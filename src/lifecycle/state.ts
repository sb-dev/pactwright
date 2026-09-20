import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempSibling } from "../atomic.js";
import type { ParseResult } from "../config/config.js";
import type { Problem } from "../errors.js";
import { withRepositoryLock } from "../graph/writer-lock.js";
import {
  Checker,
  expectEnum,
  expectInteger,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";
import { STEP_NAME_PATTERN } from "./shape.js";

/**
 * Fine-grained lifecycle progression (Spec 01 §28). This is **not** Project
 * Graph truth: it never enters `canonicalGraphPayload`, so advancing a run
 * leaves `project_graph_revision` unchanged. The Delivery Graph still derives
 * the broad state (`delivering`, `done`) from canonical lineage alone.
 *
 * It lives beside configuration under `.pactwright/execution/`, one document
 * per Brief, because progression is per-Brief and a superseded Brief's run
 * must not be mistaken for the current one.
 */
export const EXECUTION_DIR = ".pactwright/execution";
export const EXECUTION_STATE_VERSION = 2;

/**
 * Version 2 renamed `completed_steps` to `visited` and added `waiting-gate`.
 * Version 1 documents are migrated on read (see `parseExecutionState`).
 */
export const EXECUTION_STATE_VERSIONS = [1, 2] as const;

export const EXECUTION_STATUSES = [
  "running",
  "waiting-gate",
  "blocked",
  "completed",
  "failed",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/** What a Review concluded about the state it reviewed (§32). */
export const REVIEW_OUTCOMES = ["pass", "revise", "blocked"] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

/**
 * A recorded Review. `revision` identifies the delivered state that was
 * reviewed, so a later delivery change invalidates this Review rather than
 * silently carrying its verdict forward (§53 precondition 2).
 */
export interface ReviewRecord {
  readonly step: string;
  readonly outcome: ReviewOutcome;
  readonly revision: string;
}

/** A resolved Gate: who authorised progression past it (§25 invariant 4, §31). */
export interface GateRecord {
  readonly resolvedBy: string;
}

export interface ExecutionState {
  readonly version: 2;
  /** The Brief this run fulfils (§28). */
  readonly brief: string;
  /** Which resolved shape definition the run is executing (§23). */
  readonly shape: string;
  readonly status: ExecutionStatus;
  /** Absent once the run has completed or failed. */
  readonly currentStep?: string;
  /**
   * Steps the run has completed, in the order it completed them, repeats
   * included.
   *
   * Version 1 called this `completed_steps` and both writers deduplicated it
   * while the validator read it as chronology, so a permitted corrective loop
   * — Delivery, Review(revise), Delivery — produced the walk
   * `delivery, review, review` and a spurious `undeclared-transition` until
   * the next Review passed. One meaning now: this is history, and the
   * completed *set* is derived from it with `completedSet`.
   */
  readonly visited: readonly string[];
  /** Step name → who authorised progression past that Gate. */
  readonly gates: Readonly<Record<string, GateRecord>>;
  /** `"<from>-><to>"` → how many times that declared route has been taken (§34). */
  readonly iterations: Readonly<Record<string, number>>;
  /** The latest delivered state's identity, recorded when Delivery completes. */
  readonly deliveredRevision?: string;
  /** The latest Review, if any. */
  readonly review?: ReviewRecord;
}

export function executionDir(root: string): string {
  return join(root, EXECUTION_DIR);
}

export function executionPath(root: string, brief: string): string {
  return join(executionDir(root), `${brief}.yml`);
}

/** The key under which a declared route's iteration count is tracked. */
export function routeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

function checkGate(c: Checker, raw: unknown, label: string): GateRecord | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["resolved_by"]);
  rejectUnknownKeys(c, record, label, ["resolved_by"]);
  const resolvedBy = expectString(c, record["resolved_by"], `${label}.resolved_by`);
  return resolvedBy === undefined ? undefined : { resolvedBy };
}

function checkReview(c: Checker, raw: unknown, label: string): ReviewRecord | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["step", "outcome", "revision"]);
  rejectUnknownKeys(c, record, label, ["step", "outcome", "revision"]);
  const step = expectString(c, record["step"], `${label}.step`);
  const outcome = expectEnum(c, record["outcome"], `${label}.outcome`, REVIEW_OUTCOMES);
  const revision = expectString(c, record["revision"], `${label}.revision`);
  if (step === undefined || outcome === undefined || revision === undefined) return undefined;
  return { step, outcome, revision };
}

export function parseExecutionState(raw: unknown, path: string): ParseResult<ExecutionState> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "execution");
  if (root === undefined) return { value: undefined, problems: c.problems };

  const version = expectInteger(c, root["version"], "execution.version");
  if (version !== undefined && !(EXECUTION_STATE_VERSIONS as readonly number[]).includes(version)) {
    c.fail(
      "unsupported-version",
      `execution.version must be ${EXECUTION_STATE_VERSION}, found ${version}`,
    );
  }
  // Version 1 wrote `completed_steps`; version 2 writes `visited`. The name
  // is migrated on read, so an in-flight run survives the upgrade.
  const legacy = version === 1;
  const historyKey = legacy ? "completed_steps" : "visited";

  requireKeys(c, root, "execution", ["version", "brief", "shape", "status", historyKey]);
  rejectUnknownKeys(c, root, "execution", [
    "version",
    "brief",
    "shape",
    "status",
    "current_step",
    historyKey,
    "gates",
    "iterations",
    "delivered_revision",
    "review",
  ]);

  const brief = expectString(c, root["brief"], "execution.brief");
  const shape = expectString(c, root["shape"], "execution.shape");
  const status = expectEnum(c, root["status"], "execution.status", EXECUTION_STATUSES);
  const currentStep =
    root["current_step"] === undefined
      ? undefined
      : expectString(c, root["current_step"], "execution.current_step");

  const visited: string[] = [];
  const rawVisited = root[historyKey];
  if (rawVisited !== undefined && !Array.isArray(rawVisited)) {
    c.fail("invalid-type", `execution.${historyKey} must be a list`);
  } else if (Array.isArray(rawVisited)) {
    for (const [position, entry] of rawVisited.entries()) {
      const name = expectString(c, entry, `execution.${historyKey}[${position}]`);
      if (name === undefined) continue;
      if (!STEP_NAME_PATTERN.test(name)) {
        c.fail(
          "invalid-step-name",
          `execution.${historyKey}[${position}] must be a kebab-case step name, found "${name}"`,
        );
        continue;
      }
      visited.push(name);
    }
  }

  const gates: Record<string, GateRecord> = Object.create(null) as Record<string, GateRecord>;
  const rawGates =
    root["gates"] === undefined ? {} : expectRecord(c, root["gates"], "execution.gates");
  if (rawGates !== undefined) {
    for (const [name, entry] of Object.entries(rawGates)) {
      const gate = checkGate(c, entry, `execution.gates.${name}`);
      if (gate !== undefined) gates[name] = gate;
    }
  }

  const iterations: Record<string, number> = Object.create(null) as Record<string, number>;
  const rawIterations =
    root["iterations"] === undefined
      ? {}
      : expectRecord(c, root["iterations"], "execution.iterations");
  if (rawIterations !== undefined) {
    for (const [name, entry] of Object.entries(rawIterations)) {
      const count = expectInteger(c, entry, `execution.iterations.${name}`);
      if (count === undefined) continue;
      if (count < 0) {
        c.fail("invalid-value", `execution.iterations.${name} must not be negative`);
        continue;
      }
      iterations[name] = count;
    }
  }

  const deliveredRevision =
    root["delivered_revision"] === undefined
      ? undefined
      : expectString(c, root["delivered_revision"], "execution.delivered_revision");
  const review =
    root["review"] === undefined ? undefined : checkReview(c, root["review"], "execution.review");

  if (!c.ok || brief === undefined || shape === undefined || status === undefined) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      version: EXECUTION_STATE_VERSION,
      brief,
      shape,
      status,
      ...(currentStep === undefined ? {} : { currentStep }),
      visited,
      gates,
      iterations,
      ...(deliveredRevision === undefined ? {} : { deliveredRevision }),
      ...(review === undefined ? {} : { review }),
    },
    problems: [],
  };
}

/**
 * The steps a run has completed, without order or repetition. Derived, never
 * stored: `visited` is the single stored fact about progression.
 */
export function completedSet(state: ExecutionState): ReadonlySet<string> {
  return new Set(state.visited);
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Serialises execution state deterministically: sorted maps and a fixed key
 * order, so an unchanged run rewrites byte-identical state.
 */
export function serialiseExecutionState(state: ExecutionState): string {
  const lines = [
    `version: ${state.version}`,
    `brief: ${quote(state.brief)}`,
    `shape: ${quote(state.shape)}`,
    `status: ${state.status}`,
  ];
  if (state.currentStep !== undefined) lines.push(`current_step: ${quote(state.currentStep)}`);
  lines.push("visited:");
  if (state.visited.length === 0) {
    lines[lines.length - 1] = "visited: []";
  } else {
    for (const step of state.visited) lines.push(`  - ${quote(step)}`);
  }
  const gateNames = Object.keys(state.gates).sort();
  if (gateNames.length === 0) {
    lines.push("gates: {}");
  } else {
    lines.push("gates:");
    for (const name of gateNames) {
      lines.push(`  ${name}:`);
      lines.push(`    resolved_by: ${quote(state.gates[name]!.resolvedBy)}`);
    }
  }
  const routes = Object.keys(state.iterations).sort();
  if (routes.length === 0) {
    lines.push("iterations: {}");
  } else {
    lines.push("iterations:");
    for (const route of routes) lines.push(`  ${quote(route)}: ${state.iterations[route]!}`);
  }
  if (state.deliveredRevision !== undefined) {
    lines.push(`delivered_revision: ${quote(state.deliveredRevision)}`);
  }
  if (state.review !== undefined) {
    lines.push("review:");
    lines.push(`  step: ${quote(state.review.step)}`);
    lines.push(`  outcome: ${state.review.outcome}`);
    lines.push(`  revision: ${quote(state.review.revision)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** Reads one Brief's execution state; absent state is not a problem. */
export function loadExecutionState(root: string, brief: string): ParseResult<ExecutionState> {
  const path = executionPath(root, brief);
  if (!existsSync(path)) return { value: undefined, problems: [] };
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseExecutionState(read.value, path);
}

/** Every execution document in the project, with any parse problems. */
export function loadAllExecutionState(root: string): {
  readonly states: readonly ExecutionState[];
  readonly problems: readonly Problem[];
} {
  const dir = executionDir(root);
  if (!existsSync(dir)) return { states: [], problems: [] };
  const states: ExecutionState[] = [];
  const problems: Problem[] = [];
  for (const entry of readdirSync(dir).sort()) {
    if (!entry.endsWith(".yml")) continue;
    const read = readYamlFile(join(dir, entry));
    if (read.problems.length > 0) {
      problems.push(...read.problems);
      continue;
    }
    const parsed = parseExecutionState(read.value, join(dir, entry));
    if (parsed.value === undefined) problems.push(...parsed.problems);
    else states.push(parsed.value);
  }
  return { states, problems };
}

/**
 * Atomically replaces one Brief's execution state, under the repository
 * writer lock (§10). The rename makes the single file atomic; the lock is
 * what stops a concurrent mutation interleaving between a caller's read of
 * this state and its write back.
 */
export function writeExecutionState(root: string, state: ExecutionState): void {
  withRepositoryLock(root, () => {
    const dir = executionDir(root);
    mkdirSync(dir, { recursive: true });
    const target = executionPath(root, state.brief);
    const temp = tempSibling(target);
    writeFileSync(temp, serialiseExecutionState(state), "utf8");
    renameSync(temp, target);
  });
}

export function clearExecutionState(root: string, brief: string): void {
  withRepositoryLock(root, () => {
    rmSync(executionPath(root, brief), { force: true });
  });
}

/** A fresh run of `shape` against `brief`, positioned at the first step. */
export function beginExecution(brief: string, shape: string, firstStep?: string): ExecutionState {
  return {
    version: EXECUTION_STATE_VERSION,
    brief,
    shape,
    status: "running",
    ...(firstStep === undefined ? {} : { currentStep: firstStep }),
    visited: [],
    gates: Object.create(null) as Record<string, GateRecord>,
    iterations: Object.create(null) as Record<string, number>,
  };
}
