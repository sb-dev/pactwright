// Test helpers (T3.5 H1): the CP96 production fixture repository, the
// scripted producer's work per step, the applicability rules the tests
// supply, a complete run configuration with binding declarations and
// prepared dependencies, an offline verifier that judges from the labelled
// runs it is given, and an offline dependency preparer. Fixture bindings and
// verifiers are not Checkpoint 1 product verifiers; nothing here records
// acceptance.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import type { Packet, ReviewVerdict } from "../src/claude.js";
import type { ApplicabilityRules } from "../src/contracts.js";
import {
  appendEvent,
  putEvidence,
  readEvidence,
  readRun,
  type JournalEvent,
  type RunHandle,
} from "../src/evidence.js";
import type { RunnerDeps } from "../src/runner.js";
import type { Registry } from "../src/software-bootstrap.js";
import type {
  ContainedWorkspace,
  DependencySpec,
  OpenWorkspace,
  PreparationRecord,
  PrepareDependencies,
  WorkspaceOptions,
} from "../src/verification.js";
import type { SourceSnapshot } from "../src/workspace.js";
import {
  runConfig,
  scriptedAgent,
  submit,
  testDeps,
  type Repo,
  type ScriptedAgent,
} from "./runner-fixtures.js";
import { approveAll, fixtureRoot, git } from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const production = join(fixtureRoot, "production");

export const CP96 = "docs/checkpoints/96-production/checkpoint.yml";
export const S01 = "CP96-S01";
export const S02 = "CP96-S02";
export const EXIT = "CP96/exit";
export const BINDINGS_DIR = "verifiers/bindings";

/** CP96's applicability: AC02 from the acceptance of Step 1, AC03 at the exit. */
export const RULES: ApplicabilityRules = {
  CP96: { AC02: { kind: "after", step: S01 }, AC03: { kind: "exit" } },
};

/** The dependency preparation the configuration declares: offline, from the lockfile. */
export const DEPENDENCIES = {
  inputs: ["package-lock.json", "package.json", "vendor"],
  command: [
    "npm",
    "ci",
    "--offline",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--install-links",
  ],
  outputs: ["node_modules"],
  network: "none" as const,
  timeout_ms: 120_000,
};

/** The files below `dir`, by path relative to it. */
function filesOf(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (at: string): void => {
    for (const name of readdirSync(at).sort()) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else out[relative(dir, path)] = readFileSync(path, "utf8");
    }
  };
  walk(dir);
  return out;
}

/** The correct work of a CP96 step: its capability, tests, verifiers and declarations. */
export const work = (step: string): Record<string, string> =>
  filesOf(join(production, "work", step));

/** A labelled injected defect of `production/faults/`. */
export const fault = (name: string): string =>
  readFileSync(join(production, "faults", name), "utf8");

export const OUTPUTS: Record<string, Record<string, string[]>> = {
  [S01]: { greeting: ["src/greet.mjs"] },
  [S02]: { banner: ["src/banner.mjs"] },
};

/**
 * A Git repository on branch `fixture` holding the fixture definitions, the
 * format schema and the production base repository, committed once.
 */
export function productionRepo(scratch: string): Repo {
  const root = join(scratch, `repo-${randomUUID()}`);
  mkdirSync(root, { recursive: true });
  cpSync(join(fixtureRoot, "docs"), join(root, "docs"), { recursive: true });
  cpSync(
    join(here, "../../../docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  cpSync(join(production, "base"), root, { recursive: true });
  git(root, ["init", "-q", "-b", "fixture"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

/** A CP96 run configuration with binding declarations and prepared dependencies. */
export function productionConfig(
  repo: Repo,
  scratch: string,
  options: {
    through?: string;
    attempts?: number;
    retries?: number;
    verification?: Record<string, unknown> | null;
  } = {},
): Record<string, unknown> {
  const base = runConfig(repo, scratch, {
    attempts: options.attempts ?? 3,
    retries: options.retries ?? 2,
  });
  const permissions = base.permissions as Record<string, unknown>;
  return {
    ...base,
    checkpoint: CP96,
    selection: { through: options.through ?? S01 },
    permissions: { ...permissions, writable: ["changes", "src", "test", "verifiers"] },
    ...(options.verification === null
      ? {}
      : {
          verification: options.verification ?? {
            bindings: BINDINGS_DIR,
            dependencies: DEPENDENCIES,
          },
        }),
  };
}

/** One labelled run the judge of a binding was given. */
export type JudgedRun = { owner: string; criterion: string; case: string | null };

export type JudgeCall = {
  snapshot: SourceSnapshot;
  binding: string;
  role: "subject" | "judge";
  options: WorkspaceOptions;
  stdin: string;
};

/**
 * An offline verifier: no code runs. A subject run exits 0; a judge reports
 * every run it is given as passed, unless `fails(binding, snapshot, run)`
 * returns a failure message. It records each call with the workspace options
 * the controller opened it with.
 */
export function judgeVerifier(
  fails: (binding: string, snapshot: SourceSnapshot, run: JudgedRun) => string | null = () => null,
): OpenWorkspace & { calls: JudgeCall[] } {
  const calls: JudgeCall[] = [];
  const open: OpenWorkspace = (snapshot, options = {}) => {
    const ws: ContainedWorkspace = {
      snapshot,
      readFile: (path) => Promise.resolve({ ok: false, reason: `${path}: not read here` }),
      writeFile: () => Promise.resolve({ ok: false, reason: "Read-only file system" }),
      exec: (_, exec) => {
        const text = exec.stdin?.toString("utf8") ?? "";
        const judge = text.startsWith("{");
        const binding = judge
          ? String((JSON.parse(text) as { binding?: unknown }).binding ?? "")
          : (text.split("/")[4] ?? "");
        calls.push({ snapshot, binding, role: judge ? "judge" : "subject", options, stdin: text });
        if (!judge) {
          return Promise.resolve({
            exitCode: 0,
            stdout: Buffer.from("{}"),
            stderr: Buffer.alloc(0),
            timedOut: false,
          });
        }
        const { runs } = JSON.parse(text) as { runs: JudgedRun[] };
        const results = runs.map((run) => {
          const message = fails(binding, snapshot, run);
          return {
            binding,
            owner: run.owner,
            criterion: run.criterion,
            case: run.case,
            outcome: message === null ? "passed" : "failed",
            assertions: 1,
            observations: {
              exit: 0,
              stdout: "",
              build: 0,
              test: 0,
              dependency: "1.0.0",
              distBefore: [],
              steps: [],
            },
            ...(message === null ? {} : { message }),
          };
        });
        return Promise.resolve({
          exitCode: 0,
          stdout: Buffer.from(JSON.stringify({ results })),
          stderr: Buffer.alloc(0),
          timedOut: false,
        });
      },
      close: () => Promise.resolve(),
    };
    return Promise.resolve(ws);
  };
  return Object.assign(open, { calls });
}

/**
 * An offline dependency preparer: it runs nothing, records a `prepared`
 * preparation as the contained one does and mounts nothing.
 */
export function offlinePreparer(
  run: RunHandle,
  spec: DependencySpec,
): PrepareDependencies & { prepared: string[] } {
  const prepared: string[] = [];
  const prepare: PrepareDependencies = (candidate) => {
    prepared.push(candidate.commit);
    const key = `sha256:${"0".repeat(64)}`;
    const record: PreparationRecord = {
      run: run.run,
      key,
      candidate: candidate.commit,
      inputs: { commit: candidate.commit, tree: candidate.tree },
      spec,
      profile: "offline",
      ran: null,
      outcome: "prepared",
      reason: null,
    };
    const ref = putEvidence(run, stringify(record));
    appendEvent(run, {
      action: "dependency-preparation",
      evidence: [ref],
      data: { key, outcome: "prepared", candidate: candidate.commit, record: ref },
    });
    return Promise.resolve({ key, record: ref, outcome: "prepared", reason: null, mounts: [] });
  };
  return Object.assign(prepare, { prepared });
}

/** The runner's offline boundaries for CP96: an empty controller registry by default. */
export function productionDeps(
  repo: Repo,
  options: {
    producer: ScriptedAgent;
    reviewer: ScriptedAgent;
    registry?: Registry;
    verifier?: OpenWorkspace;
    progress?: RunnerDeps["progress"];
  },
): RunnerDeps {
  const { verifier } = options;
  const deps = testDeps(repo, {
    producer: options.producer,
    reviewer: options.reviewer,
    registry: options.registry ?? new Map(),
    harness: "t3.5-h1-test",
    ...(verifier ? { verifier: () => verifier } : {}),
    ...(options.progress ? { progress: options.progress } : {}),
  });
  return {
    ...deps,
    applicability: RULES,
    workspaces: (run, root) => ({
      ...deps.workspaces(run, root),
      dependencies: (spec) => offlinePreparer(run, spec),
    }),
  };
}

/**
 * A producer that writes `files(step, attempt)` and claims the step's
 * outputs. In a contained workspace, where write_file creates no directory,
 * `mkdirs` first makes the new directories with run_command as an agent would.
 */
export const producerOf = (
  files: (step: string, attempt: number) => Record<string, string> = (step) => work(step),
  options: { mkdirs?: boolean } = {},
): ScriptedAgent =>
  scriptedAgent(async (session) => {
    const { step, attempt } = session.packet;
    const written = files(step.id, attempt);
    if (options.mkdirs === true) {
      const dirs = [...new Set(Object.keys(written).map((p) => dirname(p)))].filter(
        (d) => d !== ".",
      );
      const made = await session.call("run_command", { argv: ["mkdir", "-p", ...dirs.sort()] });
      assert.ok(made.ok, made.text);
    }
    return submit(session, written, OUTPUTS[step.id] ?? {});
  });

/**
 * A reviewer that passes what it is asked to judge unless `reject(packet)`
 * names a subject to fail: then it blocks on that subject alone.
 */
export const reviewerOf = (
  reject: (packet: Packet) => { subject: string; defect: string } | null = () => null,
): ScriptedAgent =>
  scriptedAgent((session) => {
    const verdict: ReviewVerdict = approveAll(session.packet);
    const rejected = reject(session.packet);
    if (rejected === null) return { output: verdict };
    return {
      output: {
        ...verdict,
        verdict: "changes-required",
        coverage: verdict.coverage.map((c) =>
          c.subject === rejected.subject
            ? { ...c, result: "unsatisfied", basis: "inspection", note: rejected.defect }
            : c,
        ),
        findings: [
          {
            rule: rejected.subject,
            location: "verifiers",
            defect: rejected.defect,
            correction: "make the verifier observe and judge the criterion",
            severity: "blocking",
            basis: "inspection",
          },
        ],
      } satisfies ReviewVerdict,
    };
  });

/** The committed journal events of a run directory. */
export function eventsIn(dir: string): JournalEvent[] {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return read.records.events;
}

/** The stored records the run's journal lists under `action`, in journal order. */
export function records<T>(dir: string, action: string): (T & { seq: number })[] {
  return eventsIn(dir)
    .filter((e) => e.action === action)
    .map((e) => {
      const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
      assert.ok(ref, `${action} names a record`);
      return { ...(JSON.parse(readEvidence(dir, ref).toString("utf8")) as T), seq: e.seq };
    });
}
