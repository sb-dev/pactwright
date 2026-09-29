// Test helpers (T3-F): the CP97 bootstrap fixture that the deterministic,
// integration and live tests share, so every mode runs the same runner,
// bindings and definitions. The injected faults are labelled in their own
// bytes; the report reads that label from the sealed candidate, so an
// injected submission is never attributed to a model.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import stringify from "safe-stable-stringify";

import type { AgentOutcome, Packet, Provider, ReviewVerdict } from "../src/claude.js";
import { readEvidence, readRun, type JournalEvent } from "../src/evidence.js";
import { exitCode, type RunResult } from "../src/runner.js";
import { createRegistry, type Registry } from "../src/software-bootstrap.js";
import {
  targetKey,
  type Admission,
  type Decision,
  type Invocation,
  type OutputProof,
  type ReviewRecord,
} from "../src/verification.js";
import type { Change, SourceSnapshot } from "../src/workspace.js";
import {
  fixtureRepo,
  OWNER,
  runConfig,
  runnerRegistry,
  scriptedAgent,
  submit,
  type Repo,
  type ScriptedAgent,
  type Session,
} from "./runner-fixtures.js";
import { approveAll, fixtureRoot, packetOf } from "./verification-fixtures.js";

export const LIBRARY = "CP97-S01";
export const COMMAND_STEP = "CP97-S02";

/** The first line of every injected fault. */
export const INJECTED = "// INJECTED FAULT (T3-F fixture)";

const candidate = (name: string): string =>
  readFileSync(join(fixtureRoot, "bootstrap/candidates", name), "utf8");

type Files = Record<string, string>;

/** Each CP97 step's outputs, its known-good files and the injected fault of its first attempt. */
export const BOOT_WORK: Record<
  string,
  { outputs: Record<string, string[]>; good: () => Files; fault: () => Files }
> = {
  [LIBRARY]: {
    outputs: { "config-library": ["src/config.mjs", "src/config.d.ts"] },
    good: () => ({
      "src/config.mjs": candidate("config.mjs"),
      "src/config.d.ts": candidate("config.d.ts"),
    }),
    fault: () => ({
      "src/config.mjs": candidate("config-upper-bound-fault.mjs"),
      "src/config.d.ts": candidate("config.d.ts"),
    }),
  },
  [COMMAND_STEP]: {
    outputs: { "config-command": ["src/cli.mjs"] },
    good: () => ({ "src/cli.mjs": candidate("cli.mjs") }),
    fault: () => ({ "src/cli.mjs": candidate("cli-duplicate-validation-fault.mjs") }),
  },
};

export const workOf = (step: string): (typeof BOOT_WORK)[string] => {
  const work = BOOT_WORK[step];
  assert.ok(work, `no CP97 work for ${step}`);
  return work;
};

/** A repository holding the fixture definitions and every fixture verifier, CP97's included. */
export const bootstrapRepo = (scratch: string): Repo =>
  fixtureRepo(scratch, ["bootstrap/verifiers"]);

/** A run of CP97 through its command step; the producer may write only `src`. */
export function bootstrapConfig(
  repo: Repo,
  scratch: string,
  options: { through?: string; attempts?: number } = {},
): Record<string, unknown> {
  return {
    ...runConfig(repo, scratch, {
      checkpoint: "CP97",
      through: options.through ?? COMMAND_STEP,
      ...(options.attempts === undefined ? {} : { attempts: options.attempts }),
    }),
    permissions: { writable: ["src"], scratch: [], protected: [], approvers: { owner: [OWNER] } },
  };
}

const LIBRARY_VERIFIER = {
  method: "automated",
  version: "1",
  command: ["node", "verifiers/library-subject.mjs"],
  judge: ["node", "verifiers/library-judge.mjs"],
  files: ["verifiers/library-judge.mjs", "verifiers/library-subject.mjs"],
  timeoutMs: 30_000,
  observations: ["observed"],
} as const;
const COMMAND_VERIFIER = {
  method: "automated",
  version: "1",
  command: ["node", "verifiers/cli-subject.mjs"],
  judge: ["node", "verifiers/cli-judge.mjs"],
  files: ["verifiers/cli-judge.mjs", "verifiers/cli-subject.mjs"],
  timeoutMs: 30_000,
  observations: ["observed"],
} as const;

/** The runner's fixture registry plus CP97's bindings. */
export function bootstrapRegistry(): Registry {
  const cp97 = createRegistry([
    { id: "library.accepts", ...LIBRARY_VERIFIER },
    { id: "library.rejects", ...LIBRARY_VERIFIER },
    { id: "cli.prints", ...COMMAND_VERIFIER },
    { id: "cli.refuses", ...COMMAND_VERIFIER },
    {
      id: "cli.single-validation",
      method: "review",
      version: "1",
      rubric: [
        "The command validates only by calling the accepted library's parseConfig; it restates none of the library's rules, such as the field list, the port range or the label check.",
      ],
    },
  ]);
  assert.ok(cp97.ok, cp97.ok ? "" : cp97.diagnostics.join("\n"));
  return new Map([...runnerRegistry(), ...cp97.registry]);
}

const submitFor = (session: Session, files: Files): ReturnType<typeof submit> =>
  submit(session, files, workOf(session.packet.step.id).outputs);

/** A scripted producer that submits `files(step, attempt)` for each CP97 attempt. */
export const bootstrapProducer = (files: (step: string, attempt: number) => Files): ScriptedAgent =>
  scriptedAgent((session) =>
    submitFor(session, files(session.packet.step.id, session.packet.attempt)),
  );

/** Each step's injected fault on its first attempt, then its known-good work. */
export const injectedFirst = (step: string, attempt: number): Files =>
  attempt === 1 ? workOf(step).fault() : workOf(step).good();

/**
 * A producer provider that serves each CP97 step's first attempt with its
 * injected fault and hands every other session to `next`, the real provider
 * in the live test.
 */
export function withInjectedFaults(next: Provider): Provider {
  const injected = scriptedAgent((session) =>
    submitFor(session, workOf(session.packet.step.id).fault()),
  );
  return (request) => {
    const packet = packetOf(request);
    return packet.role === "producer" && packet.attempt === 1 && packet.step.id in BOOT_WORK
      ? injected(request)
      : next(request);
  };
}

export const SINGLE_VALIDATION = `${COMMAND_STEP}/AC03/-/review/cli.single-validation`;

/**
 * The recorded rejection of the injected duplicate-validation command: a
 * calibrated verdict for the deterministic runs, not a live judgement.
 */
export function rejectDuplicateValidation(packet: Packet): ReviewVerdict {
  const verdict = approveAll(packet);
  return {
    ...verdict,
    verdict: "changes-required",
    coverage: verdict.coverage.map((c) =>
      c.subject === `${COMMAND_STEP}/R03`
        ? {
            ...c,
            result: "unsatisfied",
            basis: "inspection",
            note: "src/cli.mjs restates the library's rules",
          }
        : c,
    ),
    targets: verdict.targets.map((t) =>
      t.binding === "cli.single-validation"
        ? { ...t, result: "failed", note: "the command validates without parseConfig" }
        : t,
    ),
    findings: [
      {
        severity: "blocking",
        basis: "inspection",
        rule: SINGLE_VALIDATION,
        location: "src/cli.mjs:24",
        defect:
          "the command restates the field list, the port range and the label check instead of calling parseConfig",
        correction: "validate only through parseConfig from ./config.mjs",
      },
    ],
  };
}

/**
 * A scripted reviewer that approves every admission and candidate, except the
 * first command candidate when `rejectFirstCommand`, which gets the recorded
 * rejection.
 */
export const bootstrapReviewer = (rejectFirstCommand: boolean): ScriptedAgent =>
  scriptedAgent(({ packet }) => ({
    output:
      rejectFirstCommand &&
      packet.review?.kind === "candidate" &&
      packet.step.id === COMMAND_STEP &&
      packet.attempt === 1
        ? rejectDuplicateValidation(packet)
        : approveAll(packet),
  }));

// Reading a run's results and records.

export function assertAccepted(result: RunResult, steps: string[]): string {
  assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
  assert.ok(result.outcome === "selection-accepted");
  assert.deepEqual(result.accepted, steps);
  assert.equal(exitCode(result), 0);
  return result.dir;
}

export function assertPaused(result: RunResult, expected: { code: string; step: string }): string {
  assert.equal(result.outcome, "paused", stringify(result, null, 2));
  assert.ok(result.outcome === "paused");
  assert.equal(exitCode(result), 3);
  assert.equal(result.step, expected.step);
  assert.ok(
    result.reasons.some((r) => r.code === expected.code),
    stringify(result.reasons, null, 2),
  );
  return result.dir;
}

export function eventsOf(dir: string): JournalEvent[] {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return read.records.events;
}

/** The records of `action`, in journal order: `data.record`, else the first evidence. */
export function recordsOf<T>(dir: string, action: string): T[] {
  return eventsOf(dir)
    .filter((e) => e.action === action)
    .map((e) => {
      const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
      assert.ok(ref !== undefined);
      return JSON.parse(readEvidence(dir, ref).toString("utf8")) as T;
    });
}

// The evidence report: a read-only derivation from a run directory.

type EvaluationRecord = {
  step: string;
  attempt: number;
  candidate: SourceSnapshot & { changes: Change[] };
  manifest: {
    inputs: { step: string; output: string; evaluation: string }[];
    verifiers: Record<string, string>;
    skills: Record<string, string>;
  };
};

type SessionFacts = {
  session: string | null;
  model: string | null;
  used: string[];
  /** Why a session stopped without a result; null for a result. */
  stop: string | null;
};

export type AttemptReport = {
  step: string;
  attempt: number;
  /** An injected fault is never attributed to a model. */
  producer: {
    source: "injected-fault" | "agent";
    outcome: string;
    session: string | null;
    model: { configured: string; reported: string | null; used: string[] } | null;
    skills: string[];
    usage: unknown;
  } | null;
  candidate: { commit: string; tree: string; changes: string[] } | null;
  evaluation: string | null;
  verification: { passed: string[]; failed: string[]; other: string[] };
  reviews: (SessionFacts & { verdict: string | null; blocking: string[] })[];
  decision: { decision: string; rules: string[] } | null;
};

export type BootstrapReport = {
  run: string;
  attempts: AttemptReport[];
  admissions: (SessionFacts & {
    step: string;
    binding: string;
    digest: string;
    outcome: string;
    reasons: string[];
  })[];
  accepted: {
    step: string;
    attempt: number;
    evaluation: string;
    candidate: string;
    outputs: OutputProof[];
    inputs: EvaluationRecord["manifest"]["inputs"];
    verifiers: Record<string, string>;
    skills: Record<string, string>;
    targets: string[];
  }[];
  /** Automated targets of earlier steps, run again on each accepted candidate. */
  recheck: { step: string; target: string; outcome: string }[];
};

/** Reads a run directory into the facts the T3-F evidence report needs. */
export function bootstrapReport(dir: string): BootstrapReport {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  const events = read.records.events;
  const load = <T>(action: string): { event: JournalEvent; ref: string; record: T }[] =>
    events
      .filter((e) => e.action === action)
      .map((event) => {
        const ref = typeof event.data.record === "string" ? event.data.record : event.evidence[0];
        assert.ok(ref !== undefined, `event ${event.seq} names no record`);
        return { event, ref, record: JSON.parse(readEvidence(dir, ref).toString("utf8")) as T };
      });
  const git = (args: string[]): string =>
    execFileSync("git", args, {
      env: { ...process.env, GIT_DIR: join(dir, "source.git") },
    }).toString("utf8");
  const injected = (c: EvaluationRecord["candidate"]): boolean =>
    c.changes.some(
      (x) => x.kind !== "deleted" && git(["show", `${c.commit}:${x.path}`]).startsWith(INJECTED),
    );
  const sessionOf = (o: AgentOutcome): SessionFacts => ({
    session: o.observation.session,
    model: o.observation.model.reported,
    used: o.observation.model.used,
    stop:
      o.outcome === "failed" || o.outcome === "cancelled"
        ? o.reason
        : o.outcome === "exhausted"
          ? `exhausted its ${o.limit} limit`
          : o.outcome === "blocked"
            ? `blocked: ${o.blockers.join("; ")}`
            : null,
  });

  const evaluations = load<EvaluationRecord>("evaluation");
  const producers = load<AgentOutcome>("agent-invocation").filter(
    (p) => p.event.data.role === "producer",
  );
  const invocations = load<Invocation>("verifier-invocation").filter(
    (i) => i.record.stage === "acceptance",
  );
  const reviews = load<ReviewRecord>("review");
  const decisions = [...load<Decision>("decision"), ...load<Decision>("acceptance")].sort(
    (a, b) => a.event.seq - b.event.seq,
  );
  const results = (evaluation: string | null) =>
    invocations
      .filter((i) => i.record.evaluation === evaluation)
      .flatMap((i) => i.record.results.map((r) => [targetKey(r.target), r.outcome] as const));

  const keys = new Set<string>();
  for (const p of producers) keys.add(`${String(p.event.data.step)}#${p.event.attempt}`);
  for (const v of evaluations) keys.add(`${v.record.step}#${v.record.attempt}`);

  const attempts = [...keys].map((key): AttemptReport => {
    const [step = "", n = ""] = key.split("#");
    const attempt = Number(n);
    const producer = producers
      .filter((p) => p.event.data.step === step && p.event.attempt === attempt)
      .at(-1)?.record;
    const ev = evaluations
      .filter((v) => v.record.step === step && v.record.attempt === attempt)
      .at(-1);
    const evaluation = ev?.event.evaluation ?? null;
    const isInjected = ev !== undefined && injected(ev.record.candidate);
    const ran = results(evaluation);
    const decision = decisions
      .filter((d) => d.record.step === step && d.record.attempt === attempt)
      .at(-1)?.record;
    return {
      step,
      attempt,
      producer: producer
        ? {
            source: isInjected ? "injected-fault" : "agent",
            outcome: producer.outcome,
            session: producer.observation.session,
            model: isInjected ? null : producer.observation.model,
            skills: producer.observation.skills.supplied.map((s) => `${s.name}@${s.digest}`),
            usage: isInjected ? null : producer.observation.usage,
          }
        : null,
      candidate: ev
        ? {
            commit: ev.record.candidate.commit,
            tree: ev.record.candidate.tree,
            changes: ev.record.candidate.changes.map((c) => `${c.kind} ${c.path}`),
          }
        : null,
      evaluation,
      verification: {
        passed: ran.filter(([, o]) => o === "passed").map(([k]) => k),
        failed: ran.filter(([, o]) => o === "failed").map(([k]) => k),
        other: ran
          .filter(([, o]) => o !== "passed" && o !== "failed")
          .map(([k, o]) => `${k}: ${o}`),
      },
      reviews: reviews
        .filter((r) => r.record.kind === "candidate" && r.record.evaluation === evaluation)
        .map(({ record }) => {
          const verdict = record.outcome.outcome === "reviewed" ? record.outcome.verdict : null;
          return {
            ...sessionOf(record.outcome),
            verdict: verdict?.verdict ?? record.outcome.outcome,
            blocking:
              verdict?.findings.filter((f) => f.severity === "blocking").map((f) => f.rule) ?? [],
          };
        }),
      decision: decision
        ? {
            decision: decision.decision,
            rules: decision.decision === "correct" ? decision.findings.map((f) => f.rule) : [],
          }
        : null,
    };
  });

  const admissions = load<Admission>("verifier-admission").map(({ record }) => {
    const review = reviews.find((r) => r.ref === record.review);
    return {
      step: record.step,
      binding: record.binding,
      digest: record.digest,
      outcome: record.outcome,
      reasons: record.reasons,
      ...(review
        ? sessionOf(review.record.outcome)
        : { session: null, model: null, used: [], stop: null }),
    };
  });

  const latest = new Map<string, { event: JournalEvent; record: Decision }>();
  for (const d of decisions) if (d.record.decision === "accept") latest.set(d.record.step, d);
  const accepted = [...latest.values()].map(({ record }) => {
    assert.ok(record.decision === "accept");
    const ev = evaluations.find((v) => v.event.evaluation === record.evaluation);
    assert.ok(ev, `acceptance of ${record.step} names no evaluation`);
    return {
      step: record.step,
      attempt: record.attempt,
      evaluation: record.evaluation,
      candidate: record.candidate,
      outputs: record.outputs,
      inputs: ev.record.manifest.inputs,
      verifiers: ev.record.manifest.verifiers,
      skills: ev.record.manifest.skills,
      targets: record.targets,
    };
  });
  // Inherited targets are owned by the checkpoint, the step ID's prefix.
  const recheck = accepted.flatMap((a) =>
    results(a.evaluation)
      .filter(([k]) => {
        const owner = k.split("/")[0];
        return owner !== a.step && owner !== a.step.split("-")[0];
      })
      .map(([target, outcome]) => ({ step: a.step, target, outcome })),
  );
  return { run: read.records.events[0]?.run ?? "", attempts, admissions, accepted, recheck };
}
