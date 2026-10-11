// T3.6 L2 fixtures (evidence-backed learning log §3 T3.6-L2): a real CP97
// library run with learning configured, whose producer repeats the injected
// boundary fault for a chosen number of attempts. The scripted reviewer reads
// the library source for each candidate review and, while the fault is
// there, records two blocking findings and one optional finding on R03. Its
// learning purposes answer from a per-test script. A run stops after a chosen
// decision, so a test can run the learning sessions and records between two
// attempts, then resume the same run.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import {
  resolveRole,
  type AgentRole,
  type Packet,
  type Proposals,
  type ReviewVerdict,
} from "../src/claude.js";
import { prepareRun, type PreparedRun } from "../src/contracts.js";
import {
  readEvidence,
  recoverRun,
  releaseRun,
  type JournalEvent,
  type RunHandle,
} from "../src/evidence.js";
import type { ContextManifest } from "../src/knowledge.js";
import { resumeRun, startRun, type RunnerDeps, type RunResult } from "../src/runner.js";
import type { ReviewerAccess } from "../src/verification.js";
import {
  bootstrapConfig,
  bootstrapRegistry,
  bootstrapRepo,
  INJECTED,
  LIBRARY,
  workOf,
} from "./bootstrap-fixtures.js";
import { CONTROLLER, LIBRARY_FILES, snapshotReviewers } from "./knowledge-fixtures.js";
import {
  KEY_VAR,
  scriptedAgent,
  submit,
  testDeps,
  type Repo,
  type ScriptedAgent,
  type Session,
} from "./runner-fixtures.js";
import { approveAll } from "./verification-fixtures.js";

const here = new URL("../../..", import.meta.url).pathname;

/** The requirement the injected fault leaves unmet, as a review subject and finding rule. */
export const R03 = `${LIBRARY}/R03`;
export const R01 = `${LIBRARY}/R01`;

export const LEARNING = {
  reminder_chars: 400,
  context: { entries: 4, guidance: 2, bytes: 16384 },
} as const;

/** What the scripted sessions do; tests change it between runs of the same world. */
export type Script = {
  /** Runs inside each producer session before it submits. */
  during?: (session: Session) => Promise<void> | void;
  /** Files of a producer attempt beyond the library's; written before submission. */
  extra?: (attempt: number) => Record<string, string>;
  /** The proposer's result; a string is returned as raw output. */
  proposals?: (packet: Packet) => Proposals | string;
  /** A knowledge or guidance reviewer's verdict; passes every subject by default. */
  verdict?: (packet: Packet) => ReviewVerdict;
};

export type World = {
  scratch: string;
  repo: Repo;
  config: Record<string, unknown>;
  plan: PreparedRun;
  script: Script;
  producer: ScriptedAgent;
  reviewer: ScriptedAgent;
  /** The run handle the runner last saved with. */
  live: { run?: RunHandle };
};

/** The fault of attempts up to `faults`, made distinct per attempt; then the known-good library. */
export function libraryFiles(attempt: number, faults: number): Record<string, string> {
  const work = workOf(LIBRARY);
  if (attempt > faults) return work.good();
  const files = work.fault();
  return { ...files, "src/config.mjs": `${files["src/config.mjs"] ?? ""}// attempt ${attempt}\n` };
}

/** The candidate review of a faulty library: R03 unmet, two blocking findings and one optional. */
export function faultVerdict(packet: Packet): ReviewVerdict {
  const verdict = approveAll(packet);
  return {
    ...verdict,
    verdict: "changes-required",
    coverage: verdict.coverage.map((c) =>
      c.subject === R03
        ? { ...c, result: "unsatisfied", basis: "inspection", note: "port 65536 is accepted" }
        : c,
    ),
    findings: [
      {
        severity: "blocking",
        basis: "inspection",
        rule: R03,
        location: "src/config.mjs:28",
        defect: "the upper port bound accepts 65536",
        correction: "reject every port above 65535",
      },
      {
        severity: "blocking",
        basis: "inspection",
        rule: R03,
        location: "src/config.mjs:28",
        defect: "the message names 65535 while 65536 passes",
        correction: "make the bound match its message",
      },
      {
        severity: "optional",
        basis: "inspection",
        rule: R03,
        location: "src/config.mjs:1",
        defect: "the header comment describes the fixture",
        correction: "describe the library",
      },
    ],
  };
}

const EMPTY: Proposals = { knowledge: [], guidance: [] };

/** A CP97 library world with learning configured; nothing has run yet. */
export async function world(
  scratch: string,
  options: { faults?: number; attempts?: number; learning?: unknown } = {},
): Promise<World> {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  const repo = bootstrapRepo(dir);
  const config = {
    ...bootstrapConfig(repo, dir, { through: LIBRARY, attempts: options.attempts ?? 4 }),
    learning: options.learning ?? LEARNING,
  };
  const prepared = await prepareRun(config, { repoRoot: repo.root });
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  const script: Script = {};
  const faults = options.faults ?? 2;
  const producer = scriptedAgent(async (session) => {
    await script.during?.(session);
    const { attempt } = session.packet;
    const outputs = workOf(LIBRARY).outputs;
    return submit(
      session,
      { ...libraryFiles(attempt, faults), ...script.extra?.(attempt) },
      outputs,
    );
  });
  const reviewer = scriptedAgent(async (session) => {
    const { packet } = session;
    if (packet.proposal) {
      const proposed = script.proposals?.(packet) ?? EMPTY;
      return typeof proposed === "string" ? { raw: proposed } : { output: proposed };
    }
    if (packet.review?.kind === "knowledge" || packet.review?.kind === "guidance") {
      return { output: script.verdict?.(packet) ?? approveAll(packet) };
    }
    if (packet.review?.kind !== "candidate") return { output: approveAll(packet) };
    const sources: string[] = [];
    for (const path of LIBRARY_FILES) {
      const read = await session.call("read_file", { path });
      assert.ok(read.ok, `the review reads ${path}`);
      sources.push(read.text);
    }
    return {
      output: sources.some((s) => s.includes(INJECTED)) ? faultVerdict(packet) : approveAll(packet),
    };
  });
  return { scratch: dir, repo, config, plan: prepared.plan, script, producer, reviewer, live: {} };
}

/** The runner's test boundaries for a world; with `stopAfter`, the run stops after that attempt's decision. */
export function depsOf(
  w: World,
  options: { stopAfter?: number; progress?: (event: JournalEvent) => void } = {},
): RunnerDeps {
  const controller = new AbortController();
  const deps = testDeps(w.repo, {
    producer: w.producer,
    reviewer: w.reviewer,
    registry: bootstrapRegistry(),
    harness: CONTROLLER,
    signal: controller.signal,
    progress: (event) => {
      options.progress?.(event);
      if (event.action === "decision" && event.attempt === options.stopAfter) controller.abort();
    },
  });
  const workspaces = deps.workspaces;
  deps.workspaces = (run, root) => ({
    ...workspaces(run, root),
    reviewer: snapshotReviewers(run.dir),
  });
  deps.save = (run) => {
    w.live.run = run;
    return Promise.resolve();
  };
  return deps;
}

export const start = (w: World, stopAfter?: number): Promise<RunResult> =>
  startRun(w.config, depsOf(w, stopAfter === undefined ? {} : { stopAfter }));

export const resume = (w: World, dir: string, stopAfter?: number): Promise<RunResult> =>
  resumeRun(dir, depsOf(w, stopAfter === undefined ? {} : { stopAfter }));

/** A run that stopped after a decision: it paused, cancelled, with nothing accepted. */
export function stopped(result: RunResult): string {
  assert.equal(result.outcome, "paused", JSON.stringify(result));
  assert.ok(result.outcome === "paused");
  assert.deepEqual(
    result.reasons.map((r) => r.code),
    ["cancelled"],
  );
  return result.dir;
}

/** A copy of a run directory, so each test branches from the same committed state. */
export function branch(w: World, dir: string): string {
  const copy = join(w.scratch, "runs", randomUUID());
  cpSync(dir, copy, { recursive: true });
  return copy;
}

/** Runs `fn` as a fresh controller epoch of a stopped run, then releases it for `resume`. */
export async function between<T>(dir: string, fn: (run: RunHandle) => Promise<T> | T): Promise<T> {
  const recovery = await recoverRun(dir, { fence: () => Promise.resolve(), github: null });
  assert.equal(recovery.kind, "recovered");
  assert.ok(recovery.kind === "recovered");
  try {
    return await fn(recovery.run);
  } finally {
    releaseRun(recovery.run);
  }
}

/** The reviewer's read-only access, as a learning session runs it. */
export function reviewerOf(w: World, dir: string): ReviewerAccess {
  const resolved = resolveRole(w.config, "reviewer", {
    skillsRoot: join(here, ".claude/skills"),
    env: { [KEY_VAR]: "sk-ant-test-e" },
  });
  assert.ok(resolved.ok, resolved.ok ? "" : resolved.diagnostics.join("\n"));
  return {
    role: resolved.role,
    open: snapshotReviewers(dir),
    signal: new AbortController().signal,
    provider: w.reviewer,
  };
}

/** The producer role a run dispatches, for rebuilding its packets. */
export function producerOf(w: World): AgentRole {
  const resolved = resolveRole(w.config, "producer", {
    skillsRoot: join(here, ".claude/skills"),
    env: { [KEY_VAR]: "sk-ant-test-e" },
  });
  assert.ok(resolved.ok, resolved.ok ? "" : resolved.diagnostics.join("\n"));
  return resolved.role;
}

/** A recorded JSON evidence record. */
export const evidenceOf = <T>(dir: string, ref: string): T =>
  JSON.parse(readEvidence(dir, ref).toString("utf8")) as T;

/** The frozen context each production start of `attempt` recorded, in journal order. */
export type Started = {
  seq: number;
  production: {
    from: { commit: string; tree: string };
    findings: unknown[];
    policy: { writable: string[]; scratch: string[]; protected: string[] };
    context?: ContextManifest;
  };
};
