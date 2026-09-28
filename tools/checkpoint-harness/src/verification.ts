// T3-D: verification dispatch and reconciliation, verifier admission,
// independent review and the acceptance decision (Task 3 research log §§5–7,
// 9 and §12; Spec 00 §§3–4). Each automated binding runs its subject, the
// code under test, in a fresh read-only workspace of the sealed candidate, and
// its judge in a separate workspace holding only the binding's files; the
// judge's report is reconciled against the exact targets. Reviews run in a
// read-only workspace opened from the candidate. A new or changed verifier
// counts only after a provisional run, an adequacy review, a pin and a fresh
// acceptance run. Every record is stored as evidence under the digest of its
// key-ordered JSON and journaled.
// `decideAcceptance` is pure: it counts only records that are that evidence,
// are committed to the journal and belong to the current attempt, and returns
// accept, correct or pause with specific reasons. Only `recordDecision`
// journals a decision, and it derives the decision itself.

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";

import {
  buildPacket,
  containedOps,
  invokeAgent,
  type AgentOutcome,
  type AgentRole,
  type Finding,
  type Provider,
  type ReviewContext,
  type ReviewVerdict,
  type Submission,
  type WorkspaceOps,
} from "./claude.js";
import {
  sha256,
  type AcceptedOutput,
  type ContractStep,
  type PreparedRun,
  type VerificationTarget,
} from "./contracts.js";
import {
  appendEvent,
  evaluationDigest,
  putEvidence,
  readEvidence,
  readRun,
  type EvaluationManifest,
  type Json,
  type JsonObject,
  type JournalEvent,
  type RunHandle,
} from "./evidence.js";
import {
  ADEQUACY_RUBRIC,
  bindingDigests,
  COMMON_RUBRIC,
  type AutomatedBinding,
  type Registry,
} from "./software-bootstrap.js";
import {
  createWorkspace,
  fence,
  subsetSnapshot,
  treeEntries,
  type SealedCandidate,
  type SourceSnapshot,
  type WritePolicy,
} from "./workspace.js";

const READ_ONLY: WritePolicy = { writable: [], scratch: [], protected: [] };

/** A record stored as evidence: `ref` is the SHA-256 of its key-ordered JSON. */
export type Stored<T> = { ref: string; record: T };

export type Stage = "provisional" | "acceptance";

/** Where a record belongs; it counts only for this run, attempt, evaluation and candidate. */
export type Identity = { run: string; attempt: number; evaluation: string; candidate: string };

/**
 * The controller's reading of one target in one invocation. `invalid` is a
 * verifier that ran but broke the report protocol; `unavailable` is one that
 * never ran, such as a workspace that could not be opened.
 */
export type TargetResult =
  | { target: VerificationTarget; outcome: "passed"; assertions: number; observations: JsonObject }
  | {
      target: VerificationTarget;
      outcome: "failed" | "invalid" | "unavailable";
      reason: string;
    };

/** One contained run: its argv, exit status and evidence refs of its output. */
export type RunRecord = {
  argv: string[];
  exit: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
};

/**
 * One execution of one binding: the subject run on the candidate, then the
 * judge run on a snapshot of the binding's files only (`judge.snapshot`),
 * whose stdout is the report.
 */
export type Invocation = Identity & {
  id: string;
  stage: Stage;
  binding: string;
  digest: string;
  subject: RunRecord | null;
  judge: (RunRecord & { snapshot: SourceSnapshot }) | null;
  /** Why a run could not start or complete; its targets are then unavailable. */
  error: string | null;
  /** A failure to stop a workspace after its run; the run's results still stand. */
  cleanup: string | null;
  results: TargetResult[];
};

export type ReviewRecord = Identity & {
  kind: ReviewContext["kind"];
  /** Invocation records whose results the reviewer was shown. */
  invocations: string[];
  /** The output inventory the reviewer was shown (candidate reviews). */
  outputs: OutputProof[];
  /** A failure to stop the reviewer's workspace after the review. */
  cleanup: string | null;
  /** Digest of the rubric the reviewer applied. */
  rubric: string;
  /** Digest of the reviewer's packet. */
  packet: string;
  outcome: AgentOutcome;
};

/** The adequacy route's result for one verifier digest; `approved` pins it. */
export type Admission = Identity & {
  step: string;
  binding: string;
  digest: string;
  /** Digest of the adequacy rubric the review applied. */
  rubric: string;
  provisional: string | null;
  review: string | null;
  outcome: "approved" | "rejected" | "paused" | "invalid";
  findings: Finding[];
  reasons: string[];
};

/** An operator's decision on one approval target, for the exact candidate and evaluation. */
export type Approval = {
  run: string;
  target: VerificationTarget;
  authority: string;
  actor: string;
  decision: "approved" | "denied";
  candidate: string;
  evaluation: string;
};

export type OutputProof = { output: string; paths: { path: string; entry: string }[] };

/** Research log §7: correct automatically, retry the controller step, pause for an owner, or await approval. */
export type Route = "owner" | "correct" | "retry" | "approval";
export type Reason = { route: Route; subject: string; detail: string; requirements: string[] };

type DecisionBase = { step: string; attempt: number; evaluation: string; candidate: string };
export type Decision =
  | (DecisionBase & {
      decision: "accept";
      targets: string[];
      outputs: OutputProof[];
      evidence: string[];
    })
  | (DecisionBase & { decision: "correct"; reasons: Reason[]; findings: Finding[] })
  | (DecisionBase & { decision: "pause"; reasons: Reason[] });

/** A contained workspace of `snapshot`; `close` stops and removes it. */
export type ContainedWorkspace = WorkspaceOps & {
  snapshot: SourceSnapshot;
  close(): Promise<void>;
};
export type OpenWorkspace = (snapshot: SourceSnapshot) => Promise<ContainedWorkspace>;

export type ReviewerAccess = {
  role: AgentRole;
  /** Opens a read-only workspace of the snapshot under review. */
  open: OpenWorkspace;
  signal: AbortSignal;
  provider?: Provider;
};

type ReportEntry = {
  binding: string;
  owner: string;
  criterion: string;
  case: string | null;
  outcome: "passed" | "failed" | "skipped";
  assertions: number;
  observations: JsonObject;
  message?: string;
};

const reportSchema: unknown = JSON.parse(
  readFileSync(new URL("./verifier-report.schema.json", import.meta.url), "utf8"),
);
const validateReport = new Ajv2020({ allErrors: true }).compile<{ results: ReportEntry[] }>(
  reportSchema as Record<string, unknown>,
);

/** A target's stable key, e.g. `CP01-S03/AC05/self-loop/automated/edges.supersession-cycles`. */
export const targetKey = (t: VerificationTarget): string =>
  [t.owner, t.criterion, t.caseId ?? "-", t.method, t.binding].join("/");

const within = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const unique = (values: readonly string[]): string[] => [...new Set(values)].sort();

function store<T extends object>(run: RunHandle, record: T): Stored<T> {
  return { ref: putEvidence(run, stringify(record)), record };
}

/**
 * Journals a stored record: its reference comes first in the event's
 * evidence and is repeated as `data.record`, where `recordDecision` finds it.
 */
function journal(
  run: RunHandle,
  action: string,
  at: { attempt: number; evaluation: string },
  record: string,
  more: readonly (string | null)[],
  data: JsonObject,
): void {
  const others = unique(more.flatMap((r) => (r === null || r === record ? [] : [r])));
  appendEvent(run, {
    action,
    attempt: at.attempt,
    evaluation: at.evaluation,
    evidence: [record, ...others],
    data: { ...data, record },
  });
}

function contractStep(plan: PreparedRun, id: string): ContractStep {
  const step = plan.steps.find((s) => s.id === id);
  if (step?.kind !== "contract") throw new Error(`${id}: not a planned contract step`);
  return step;
}

/** Every target a step must satisfy: its own and the checkpoint's inherited ones. */
const targetsOf = (plan: PreparedRun, step: ContractStep): VerificationTarget[] => [
  ...step.targets,
  ...plan.inherited.targets,
];

/** The candidate's files: path → `mode sha`, read from the run's source repository. */
export const candidateTree = (run: RunHandle, snapshot: SourceSnapshot): Map<string, string> =>
  treeEntries(run.dir, snapshot.tree);

function identityOf(
  run: RunHandle,
  attempt: number,
  manifest: EvaluationManifest,
  candidate: SealedCandidate,
): Identity {
  if (manifest.source.commit !== candidate.commit || manifest.source.tree !== candidate.tree) {
    throw new Error(`the evaluation manifest names another candidate than ${candidate.commit}`);
  }
  return {
    run: run.run,
    attempt,
    evaluation: evaluationDigest(manifest),
    candidate: candidate.commit,
  };
}

/**
 * Opens each subject, judge and reviewer run in a fresh B workspace of the
 * given snapshot: read-only but for its tmpfs, no network, the candidate's
 * user, one container. Code under test never shares a workspace with a judge.
 */
export function containedWorkspaces(run: RunHandle, root: string): OpenWorkspace {
  mkdirSync(root, { recursive: true });
  return async (snapshot) => {
    const dir = join(root, randomUUID());
    const ws = await createWorkspace(run, {
      base: { commit: snapshot.commit, tree: snapshot.tree },
      root: dir,
      policy: READ_ONLY,
    }).catch((e: unknown) => {
      rmSync(dir, { recursive: true, force: true });
      throw e;
    });
    return {
      ...containedOps(ws),
      snapshot: ws.base,
      async close() {
        if (!ws.fenced) await fence(ws);
        rmSync(dir, { recursive: true, force: true });
      },
    };
  };
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const sameSnapshot = (a: SourceSnapshot, b: SourceSnapshot): boolean =>
  a.commit === b.commit && a.tree === b.tree;

type Ran = { exitCode: number | null; timedOut: boolean; stdout: Buffer; stderr: Buffer };

/**
 * The controller's reading of one invocation, per expected target. A subject
 * or judge that never ran leaves its targets unavailable; a subject timeout
 * fails them. Otherwise the judge must exit 0 with a report holding exactly
 * one result per target: a pass needs at least one executed assertion and
 * every required observation. A judge failure, a missing or malformed
 * report, a skip or a result the targets do not expect never pass.
 */
export function reconcile(
  binding: AutomatedBinding,
  targets: readonly VerificationTarget[],
  observed: { error: string | null; subject: Ran | null; judge: Ran | null },
): TargetResult[] {
  const all = (outcome: "failed" | "invalid" | "unavailable", reason: string): TargetResult[] =>
    targets.map((target) => ({ target, outcome, reason }));
  const { subject, judge } = observed;
  const unrun = `the verifier did not run: ${observed.error ?? "no workspace"}`;
  if (subject === null) return all("unavailable", unrun);
  if (subject.timedOut) return all("failed", `the subject timed out after ${binding.timeoutMs} ms`);
  if (judge === null) return all("unavailable", unrun);
  const stderr = judge.stderr.toString("utf8").trim().slice(-500);
  if (judge.timedOut) return all("invalid", `the judge timed out after ${binding.timeoutMs} ms`);
  if (judge.exitCode !== 0) {
    return all("invalid", `the judge exited ${judge.exitCode ?? "by a signal"}: ${stderr}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(judge.stdout.toString("utf8"));
  } catch {
    return all(
      "invalid",
      judge.stdout.length === 0 ? "no report was written" : "the report is not JSON",
    );
  }
  if (!validateReport(parsed)) {
    const [error] = validateReport.errors ?? [];
    return all(
      "invalid",
      `the report is malformed: ${error?.instancePath || "/"} ${error?.message ?? ""}`,
    );
  }
  const entries = parsed.results;
  const place = (owner: string, criterion: string, caseId: string | null): string =>
    stringify([owner, criterion, caseId]);
  const expected = new Set(targets.map((t) => place(t.owner, t.criterion, t.caseId)));
  const unexpected = entries.filter(
    (e) => e.binding !== binding.id || !expected.has(place(e.owner, e.criterion, e.case)),
  );
  if (unexpected.length > 0) {
    const names = unexpected.map((e) => `${e.binding} ${e.owner}/${e.criterion}/${e.case ?? "-"}`);
    return all("invalid", `the report has unexpected results: ${names.join(", ")}`);
  }
  return targets.map((t): TargetResult => {
    const invalid = (reason: string): TargetResult => ({ target: t, outcome: "invalid", reason });
    const mine = entries.filter(
      (e) => place(e.owner, e.criterion, e.case) === place(t.owner, t.criterion, t.caseId),
    );
    const [entry] = mine;
    if (mine.length > 1) return invalid(`${mine.length} results for one target`);
    if (entry === undefined) return invalid("no result was reported");
    if (entry.outcome === "failed") {
      return {
        target: t,
        outcome: "failed",
        reason: entry.message ?? "the judge reported a failure",
      };
    }
    if (entry.outcome === "skipped") return invalid("the judge skipped it");
    if (entry.assertions < 1) return invalid("passed without an executed assertion");
    const missing = binding.observations.filter((o) => !Object.hasOwn(entry.observations, o));
    if (missing.length > 0) return invalid(`missing observation ${missing.join(", ")}`);
    return {
      target: t,
      outcome: "passed",
      assertions: entry.assertions,
      observations: entry.observations,
    };
  });
}

/**
 * Runs one binding once: one invocation, even when other bindings share its
 * commands. The subject runs in a read-only workspace of the candidate with
 * nothing but `PACTWRIGHT_BINDING`; no report path or channel exists there.
 * The judge runs in a workspace of a snapshot holding only the binding's
 * files, so no candidate code runs where the report is written. It reads the
 * subject's exit status and output as JSON on stdin and writes the report to
 * stdout. Workspace and execution errors are recorded, never thrown; a
 * failure to stop a workspace is recorded apart and never discards a run.
 */
async function runBinding(
  run: RunHandle,
  input: {
    binding: AutomatedBinding;
    digest: string;
    targets: readonly VerificationTarget[];
    identity: Identity;
    stage: Stage;
    candidate: SealedCandidate;
    open: OpenWorkspace;
  },
): Promise<Stored<Invocation>> {
  const { binding, identity } = input;
  const env = ["env", `PACTWRIGHT_BINDING=${binding.id}`];
  let error: string | null = null;
  const cleanup: string[] = [];
  const contained = async (
    snapshot: SourceSnapshot,
    argv: string[],
    stdin?: Buffer,
  ): Promise<Ran | null> => {
    let ws: ContainedWorkspace;
    try {
      ws = await input.open(snapshot);
    } catch (e) {
      error ??= message(e);
      return null;
    }
    try {
      if (!sameSnapshot(ws.snapshot, snapshot)) {
        error ??= `the workspace holds ${ws.snapshot.commit}, not ${snapshot.commit}`;
        return null;
      }
      const timeoutMs = binding.timeoutMs;
      return await ws.exec(argv, stdin === undefined ? { timeoutMs } : { timeoutMs, stdin });
    } catch (e) {
      error ??= message(e);
      return null;
    } finally {
      await ws.close().catch((e: unknown) => {
        cleanup.push(message(e));
      });
    }
  };

  const subjectArgv = [...env, ...binding.command];
  const judgeArgv = [...env, ...binding.judge];
  const subject = await contained(input.candidate, subjectArgv);
  let judge: Ran | null = null;
  let judged: SourceSnapshot | null = null;
  if (subject !== null && !subject.timedOut) {
    try {
      judged = subsetSnapshot(run.dir, input.candidate, binding.files);
    } catch (e) {
      error ??= message(e);
    }
    if (judged !== null) {
      const observations = {
        binding: binding.id,
        exit: subject.exitCode,
        stdout: subject.stdout.toString("utf8"),
        stderr: subject.stderr.toString("utf8"),
      };
      judge = await contained(judged, judgeArgv, Buffer.from(JSON.stringify(observations)));
    }
  }
  const record = (argv: string[], ran: Ran): RunRecord => ({
    argv,
    exit: ran.exitCode,
    timedOut: ran.timedOut,
    stdout: putEvidence(run, ran.stdout),
    stderr: putEvidence(run, ran.stderr),
  });
  const invocation: Invocation = {
    ...identity,
    id: randomUUID(),
    stage: input.stage,
    binding: binding.id,
    digest: input.digest,
    subject: subject === null ? null : record(subjectArgv, subject),
    judge:
      judge === null || judged === null
        ? null
        : { ...record(judgeArgv, judge), snapshot: { commit: judged.commit, tree: judged.tree } },
    error,
    cleanup: cleanup.length > 0 ? cleanup.join("; ") : null,
    results: reconcile(binding, input.targets, { error, subject, judge }),
  };
  const stored = store(run, invocation);
  const runs = [invocation.subject, invocation.judge].flatMap((r) =>
    r === null ? [] : [r.stdout, r.stderr],
  );
  journal(run, "verifier-invocation", identity, stored.ref, runs, {
    binding: binding.id,
    stage: input.stage,
    invocation: invocation.id,
  });
  return stored;
}

/**
 * The admissions of a verifier digest under the current adequacy rubric.
 * The first complete adequacy review, in journal order, decides the digest
 * for good: approved, rejected or paused; a revised verifier is a new digest.
 * A rejection by the provisional completeness check, or an invalid admission,
 * speaks only for its own evaluation (`pending`, the latest of them).
 */
function admissionFor(
  admissions: readonly Stored<Admission>[],
  binding: string,
  digest: string | undefined,
  evaluation?: string,
): { decided: Stored<Admission> | undefined; pending: Admission | undefined } {
  const own = admissions.filter(
    ({ record: a }) =>
      a.binding === binding && a.digest === digest && a.rubric === ADEQUACY_RUBRIC.digest,
  );
  const decides = (a: Admission): boolean => a.review !== null && a.outcome !== "invalid";
  return {
    decided: own.find(({ record: a }) => decides(a)),
    pending: own.filter(({ record: a }) => !decides(a) && a.evaluation === evaluation).at(-1)
      ?.record,
  };
}

const approvedFor = (
  admissions: readonly Stored<Admission>[],
  binding: string,
  digest: string | undefined,
): Stored<Admission> | undefined => {
  const { decided } = admissionFor(admissions, binding, digest);
  return decided?.record.outcome === "approved" ? decided : undefined;
};

/**
 * Runs, for acceptance, every automated binding the step and its inherited
 * requirements need whose current digest has an approved admission. Other
 * bindings are not run; `decideAcceptance` states why they cannot count.
 */
export async function verifyCandidate(
  run: RunHandle,
  input: {
    plan: PreparedRun;
    step: string;
    registry: Registry;
    candidate: SealedCandidate;
    attempt: number;
    manifest: EvaluationManifest;
    admissions: readonly Stored<Admission>[];
    open: OpenWorkspace;
  },
): Promise<Stored<Invocation>[]> {
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const targets = targetsOf(input.plan, contractStep(input.plan, input.step)).filter(
    (t) => t.method === "automated",
  );
  const ids = unique(targets.map((t) => t.binding));
  const digests = bindingDigests(input.registry, candidateTree(run, input.candidate), ids);
  const invocations: Stored<Invocation>[] = [];
  for (const id of ids) {
    const binding = input.registry.get(id)?.binding;
    const digest = digests[id];
    if (
      binding?.method !== "automated" ||
      digest === undefined ||
      input.manifest.verifiers[id] !== digest ||
      !approvedFor(input.admissions, id, digest)
    ) {
      continue;
    }
    invocations.push(
      await runBinding(run, {
        binding,
        digest,
        targets: targets.filter((t) => t.binding === id),
        identity,
        stage: "acceptance",
        candidate: input.candidate,
        open: input.open,
      }),
    );
  }
  return invocations;
}

/** What the reviewer is shown of recorded verification: per target, never a bare exit code. */
function verificationSummary(invocations: readonly Stored<Invocation>[]): Json {
  return invocations.flatMap(({ record }) =>
    record.results.map((r): Json => ({
      target: targetKey(r.target),
      invocation: record.id,
      stage: record.stage,
      outcome: r.outcome,
      ...(r.outcome === "passed"
        ? { assertions: r.assertions, observations: r.observations }
        : { reason: r.reason }),
    })),
  );
}

/**
 * Runs one review in a fresh read-only workspace opened here from the sealed
 * candidate; a workspace of any other snapshot is refused before the
 * reviewer starts. The record names the invocations and outputs shown.
 */
async function runReview(
  run: RunHandle,
  input: {
    plan: PreparedRun;
    step: ContractStep;
    identity: Identity;
    candidate: SealedCandidate;
    accepted: readonly AcceptedOutput[];
    context: ReviewContext;
    /** Invocation records whose results the context shows. */
    shown: readonly string[];
    /** The output inventory the context shows. */
    outputs: readonly OutputProof[];
    reviewer: ReviewerAccess;
  },
): Promise<Stored<ReviewRecord>> {
  const { identity, reviewer } = input;
  if (reviewer.role.name !== "reviewer") throw new Error("review needs the reviewer role");
  const built = buildPacket(input.plan, input.step.id, reviewer.role, {
    attempt: identity.attempt,
    accepted: input.accepted,
    policy: READ_ONLY,
    candidate: input.candidate,
    review: input.context,
  });
  if (!built.ok) throw new Error(built.diagnostics.join("\n"));
  const ws = await reviewer.open(input.candidate);
  let outcome: AgentOutcome;
  let cleanup: string | null = null;
  try {
    if (!sameSnapshot(ws.snapshot, input.candidate)) {
      throw new Error(
        `the reviewer workspace holds ${ws.snapshot.commit}, not the candidate ${input.candidate.commit}`,
      );
    }
    outcome = await invokeAgent(
      reviewer.role,
      built.packet,
      ws,
      reviewer.signal,
      reviewer.provider ? { provider: reviewer.provider } : {},
    );
  } finally {
    await ws.close().catch((e: unknown) => {
      cleanup = message(e);
    });
  }
  const stored = store(run, {
    ...identity,
    kind: input.context.kind,
    invocations: [...input.shown],
    outputs: [...input.outputs],
    cleanup,
    rubric: input.context.rubric.digest,
    packet: built.digest,
    outcome,
  } satisfies ReviewRecord);
  journal(run, "review", identity, stored.ref, input.shown, {
    kind: input.context.kind,
    outcome: outcome.outcome,
    session: outcome.observation.session,
  });
  return stored;
}

type Scope = { subjects: readonly string[]; targets: readonly VerificationTarget[] };

/**
 * A complete verdict binds, even if it contradicts itself (`conflicts`);
 * only an incomplete one (`issues`) may be followed by another review.
 */
type Checked =
  { ok: true; verdict: ReviewVerdict; conflicts: string[] } | { ok: false; issues: string[] };

const describeOutcome = (outcome: AgentOutcome): string => {
  switch (outcome.outcome) {
    case "failed":
    case "cancelled":
      return `${outcome.outcome}: ${outcome.reason}`;
    case "exhausted":
      return `exhausted its ${outcome.limit} limit`;
    case "blocked":
      return `blocked: ${outcome.blockers.join("; ")}`;
    default:
      return outcome.outcome;
  }
};

const verdictTargetKey = (t: ReviewVerdict["targets"][number]): string =>
  targetKey({
    owner: t.owner,
    criterion: t.criterion,
    caseId: t.case,
    method: "review",
    binding: t.binding,
  });

/**
 * Whether a reviewer returned a complete verdict for the scope: one coverage
 * entry per subject and one entry per review target, nothing unknown; a
 * blocked verdict needs blockers only. An incomplete verdict is a protocol
 * failure. A complete one binds, and its conflicts are listed: a blocking
 * finding on an item not recorded as unmet or without location, defect and
 * correction, or a label that does not follow from its entries. A conflicting
 * verdict never passes, so a later review cannot replace a negative judgement.
 */
export function checkVerdict(outcome: AgentOutcome, scope: Scope): Checked {
  if (outcome.outcome !== "reviewed") {
    return { ok: false, issues: [`the reviewer ${describeOutcome(outcome)}`] };
  }
  const v = outcome.verdict;
  if (v.verdict === "blocked") {
    return v.blockers.length > 0
      ? { ok: true, verdict: v, conflicts: [] }
      : { ok: false, issues: ["blocked without blockers"] };
  }
  const issues: string[] = [];
  const conflicts: string[] = [];
  const exactlyOnce = (
    label: string,
    expected: readonly string[],
    actual: readonly string[],
  ): void => {
    for (const key of expected) {
      const n = actual.filter((a) => a === key).length;
      if (n !== 1) issues.push(`${label} has ${n} entries for ${key}`);
    }
    for (const key of unique(actual)) {
      if (!expected.includes(key)) issues.push(`${label} names unknown ${key}`);
    }
  };
  exactlyOnce(
    "coverage",
    scope.subjects,
    v.coverage.map((c) => c.subject),
  );
  exactlyOnce("targets", scope.targets.map(targetKey), v.targets.map(verdictTargetKey));
  const unmet = new Set([
    ...v.coverage.filter((c) => c.result === "unsatisfied").map((c) => c.subject),
    ...v.targets.filter((t) => t.result === "failed").map(verdictTargetKey),
  ]);
  const unassessed =
    v.coverage.some((c) => c.result === "not-assessed") ||
    v.targets.some((t) => t.result === "not-assessed");
  const blocking = v.findings.filter((f) => f.severity === "blocking");
  if (issues.length > 0) return { ok: false, issues };
  for (const f of blocking) {
    if (!unmet.has(f.rule)) {
      conflicts.push(`a blocking finding cites ${f.rule}, which is not recorded as unmet`);
    }
    if ([f.location, f.defect, f.correction].some((s) => s.trim() === "")) {
      conflicts.push(`the blocking finding on ${f.rule} lacks a location, defect or correction`);
    }
  }
  if (v.verdict === "pass" && (unmet.size > 0 || unassessed || blocking.length > 0)) {
    conflicts.push("the verdict is pass, yet an item is unmet, not assessed or blocking");
  }
  if (v.verdict === "changes-required" && blocking.length === 0) {
    conflicts.push("changes-required without a blocking finding");
  }
  if (v.blockers.length > 0) conflicts.push(`blockers on a ${v.verdict} verdict`);
  return { ok: true, verdict: v, conflicts };
}

const blockingFindings = (v: ReviewVerdict): Finding[] =>
  v.findings
    .filter((f) => f.severity === "blocking")
    .map(({ rule, location, defect, correction }) => ({ rule, location, defect, correction }));

/** The negative judgements a reviewed verdict records, complete or not. */
const negatives = (outcome: AgentOutcome): string[] => {
  if (outcome.outcome !== "reviewed") return [];
  const v = outcome.verdict;
  return unique([
    ...v.findings.filter((f) => f.severity === "blocking").map((f) => `${f.rule} blocking`),
    ...v.coverage.filter((c) => c.result !== "satisfied").map((c) => `${c.subject} ${c.result}`),
    ...v.targets
      .filter((t) => t.result !== "passed")
      .map((t) => `${verdictTargetKey(t)} ${t.result}`),
  ]);
};

const unassessed = (v: ReviewVerdict): string[] => [
  ...v.coverage.filter((c) => c.result === "not-assessed").map((c) => c.subject),
  ...v.targets.filter((t) => t.result === "not-assessed").map(verdictTargetKey),
];

/**
 * The §6 route for a verifier digest no complete admission has decided,
 * whoever wrote it: a provisional run in isolation, a deterministic
 * completeness check, then an adequacy review by a fresh reviewer. Only
 * `approved` pins the digest; provisional results never count for
 * acceptance. `rejected` carries precise test defects for the producer and,
 * like `paused`, binds the digest. `invalid` (the verifier never ran, or the
 * review was incomplete) may be followed by another admission.
 */
export async function admitVerifier(
  run: RunHandle,
  input: {
    plan: PreparedRun;
    step: string;
    registry: Registry;
    binding: string;
    candidate: SealedCandidate;
    attempt: number;
    manifest: EvaluationManifest;
    accepted: readonly AcceptedOutput[];
    open: OpenWorkspace;
    reviewer: ReviewerAccess;
  },
): Promise<Stored<Admission>> {
  const step = contractStep(input.plan, input.step);
  const entry = input.registry.get(input.binding);
  if (entry?.binding.method !== "automated") {
    throw new Error(`${input.binding}: not a registered automated binding`);
  }
  const binding = entry.binding;
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const tree = candidateTree(run, input.candidate);
  const digest = bindingDigests(input.registry, tree, [binding.id])[binding.id];
  if (digest === undefined) throw new Error(`${binding.id}: no digest`);
  const targets = targetsOf(input.plan, step).filter(
    (t) => t.method === "automated" && t.binding === binding.id,
  );
  if (targets.length === 0) throw new Error(`${binding.id}: no target of ${step.id} uses it`);
  const admit = (
    outcome: Admission["outcome"],
    refs: { provisional: string | null; review: string | null },
    findings: Finding[],
    reasons: string[],
  ): Stored<Admission> => {
    const stored = store(run, {
      ...identity,
      step: step.id,
      binding: binding.id,
      digest,
      rubric: ADEQUACY_RUBRIC.digest,
      ...refs,
      outcome,
      findings,
      reasons,
    } satisfies Admission);
    journal(run, "verifier-admission", identity, stored.ref, [refs.provisional, refs.review], {
      binding: binding.id,
      digest,
      outcome,
    });
    return stored;
  };

  const absent = binding.files.filter((f) => !tree.has(f));
  if (absent.length > 0) {
    const finding = {
      rule: binding.id,
      location: absent.join(", "),
      defect: `verifier files ${absent.join(", ")} of ${binding.id} are not in the candidate`,
      correction: `add the verifier for ${binding.id} at the binding's files`,
    };
    return admit("rejected", { provisional: null, review: null }, [finding], []);
  }
  const provisional = await runBinding(run, {
    binding,
    digest,
    targets,
    identity,
    stage: "provisional",
    candidate: input.candidate,
    open: input.open,
  });

  const location = binding.files.join(", ") || binding.command.join(" ");
  const incomplete = provisional.record.results.flatMap((r) =>
    r.outcome === "invalid"
      ? [
          {
            rule: targetKey(r.target),
            location,
            defect: `provisional run: ${r.reason}`,
            correction:
              "Make the judge report exactly one executed result for this target, for its own binding only, on stdout.",
          },
        ]
      : [],
  );
  if (incomplete.length > 0) {
    return admit("rejected", { provisional: provisional.ref, review: null }, incomplete, []);
  }
  // A verifier that never ran has shown nothing to review; admission may be repeated.
  const unrun = provisional.record.results.flatMap((r) =>
    r.outcome === "unavailable" ? [`${targetKey(r.target)}: ${r.reason}`] : [],
  );
  if (unrun.length > 0) {
    return admit("invalid", { provisional: provisional.ref, review: null }, [], unrun);
  }

  const subjects = targets.map(targetKey);
  const files: JsonObject = {};
  for (const f of binding.files) files[f] = tree.get(f) ?? null;
  const review = await runReview(run, {
    plan: input.plan,
    step,
    identity,
    candidate: input.candidate,
    accepted: input.accepted,
    reviewer: input.reviewer,
    shown: [provisional.ref],
    outputs: [],
    context: {
      kind: "adequacy",
      rubric: ADEQUACY_RUBRIC,
      subjects,
      targets: [],
      bindings: [],
      evidence: {
        binding: {
          id: binding.id,
          command: [...binding.command],
          timeoutMs: binding.timeoutMs,
          observations: [...binding.observations],
        },
        files,
        provisional: verificationSummary([provisional]),
      },
    },
  });
  const refs = { provisional: provisional.ref, review: review.ref };
  const checked = checkVerdict(review.record.outcome, { subjects, targets: [] });
  if (!checked.ok) {
    // An incomplete review that already judged against the verifier binds.
    const negative = negatives(review.record.outcome);
    return negative.length > 0
      ? admit("paused", refs, [], [...checked.issues, ...negative])
      : admit("invalid", refs, [], checked.issues);
  }
  const v = checked.verdict;
  if (v.verdict === "blocked" || unassessed(v).length > 0 || checked.conflicts.length > 0) {
    return admit(
      "paused",
      refs,
      [],
      [...v.blockers, ...unassessed(v).map((s) => `${s} not assessed`), ...checked.conflicts],
    );
  }
  if (v.verdict === "changes-required") return admit("rejected", refs, blockingFindings(v), []);
  return admit("approved", refs, [], []);
}

/** The subjects and review targets a step's common review must cover. */
function reviewScope(
  plan: PreparedRun,
  step: ContractStep,
  registry: Registry,
): Scope & { bindings: ReviewContext["bindings"] } {
  const targets = targetsOf(plan, step).filter((t) => t.method === "review");
  return {
    subjects: [
      ...step.requirements.map((r) => `${step.id}/${r.id}`),
      ...plan.inherited.requirements.map((r) => `${plan.checkpoint}/${r.id}`),
      ...step.outputs.map((o) => `${step.id}/${o.id}`),
    ],
    targets,
    bindings: unique(targets.map((t) => t.binding)).flatMap((id) => {
      const entry = registry.get(id);
      return entry?.binding.method === "review"
        ? [{ id, digest: entry.digest, rubric: entry.binding.rubric }]
        : [];
    }),
  };
}

/**
 * Each declared output's claimed paths and their `mode sha` in the
 * candidate. An output without a claimed path, a claimed path absent from
 * the candidate and a claim for an undeclared output are issues. A proof
 * still needs the review to find the output's declared meaning satisfied.
 */
export function inventory(
  step: ContractStep,
  claims: Submission["outputs"],
  tree: ReadonlyMap<string, string>,
): { proofs: OutputProof[]; issues: { output: string; detail: string }[] } {
  const proofs: OutputProof[] = [];
  const issues: { output: string; detail: string }[] = [];
  for (const { id } of step.outputs) {
    const paths = unique(claims.filter((c) => c.output === id).flatMap((c) => c.paths));
    const found = paths.flatMap((path) => {
      const entry = tree.get(path);
      return entry === undefined ? [] : [{ path, entry }];
    });
    if (paths.length === 0) issues.push({ output: id, detail: "no path was produced for it" });
    else if (found.length < paths.length) {
      const absent = paths.filter((p) => !tree.has(p));
      issues.push({ output: id, detail: `${absent.join(", ")} is not in the candidate` });
    } else proofs.push({ output: id, paths: found });
  }
  for (const c of claims) {
    if (!step.outputs.some((o) => o.id === c.output)) {
      issues.push({ output: c.output, detail: "it is not an output of the step" });
    }
  }
  return { proofs, issues };
}

/**
 * The common independent review of a sealed candidate, required for every
 * step whether or not a criterion names a review binding. The fresh reviewer
 * sees the exact requirements, the candidate (read-only), the recorded
 * acceptance results and the output inventory, never the producer's session.
 */
export async function reviewCandidate(
  run: RunHandle,
  input: {
    plan: PreparedRun;
    step: string;
    registry: Registry;
    candidate: SealedCandidate;
    attempt: number;
    manifest: EvaluationManifest;
    accepted: readonly AcceptedOutput[];
    invocations: readonly Stored<Invocation>[];
    claims: Submission["outputs"];
    reviewer: ReviewerAccess;
  },
): Promise<Stored<ReviewRecord>> {
  const step = contractStep(input.plan, input.step);
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const scope = reviewScope(input.plan, step, input.registry);
  const { proofs, issues } = inventory(step, input.claims, candidateTree(run, input.candidate));
  const shown = input.invocations.filter((i) => i.record.stage === "acceptance");
  return runReview(run, {
    plan: input.plan,
    step,
    identity,
    candidate: input.candidate,
    accepted: input.accepted,
    reviewer: input.reviewer,
    shown: shown.map((i) => i.ref),
    outputs: proofs,
    context: {
      kind: "candidate",
      rubric: COMMON_RUBRIC,
      subjects: [...scope.subjects],
      targets: [...scope.targets],
      bindings: scope.bindings,
      evidence: {
        verification: verificationSummary(shown),
        outputs: { proofs, issues },
      },
    },
  });
}

export type AcceptanceInput = {
  plan: PreparedRun;
  step: string;
  run: string;
  attempt: number;
  /** The current evaluation; its digest, candidate, verifier digests and rubric are checked. */
  manifest: EvaluationManifest;
  registry: Registry;
  /** The producer's write policy: a missing verifier it may write is its work. */
  policy: WritePolicy;
  /** The sealed candidate's files: `candidateTree` of the manifest's source. */
  tree: ReadonlyMap<string, string>;
  /** The producer's output claims, checked against the tree. */
  claims: Submission["outputs"];
  /** This attempt's invocations; a record of any other attempt or evaluation pauses. */
  invocations: readonly Stored<Invocation>[];
  /** Every admission of the run in journal order: approvals persist across attempts and steps. */
  admissions: readonly Stored<Admission>[];
  /** This attempt's reviews in journal order; adequacy reviews are ignored. */
  reviews: readonly Stored<ReviewRecord>[];
  /** Approvals of this evaluation; one naming a target the step lacks pauses. */
  approvals: readonly Stored<Approval>[];
  /** Evidence refs listed by committed journal events. */
  journaled: ReadonlySet<string>;
};

/**
 * Decides one attempt from its evidence. A step is accepted only when every
 * current target — its own and inherited, of every method — has a proof,
 * every declared output is inventoried and found satisfied by the common
 * review, and nothing else is wrong. Otherwise the decision is `correct`,
 * with findings for the producer, or `pause`, with each reason's route. An
 * owner reason pauses even when there is something to correct. There is no
 * score: every reason names its subject and the requirements it affects.
 */
export function decideAcceptance(input: AcceptanceInput): Decision {
  const { plan, manifest, registry, tree } = input;
  const step = contractStep(plan, input.step);
  const evaluation = evaluationDigest(manifest);
  const candidate = manifest.source.commit;
  const base: DecisionBase = { step: step.id, attempt: input.attempt, evaluation, candidate };
  const reasons: Reason[] = [];
  const findings: Finding[] = [];
  const proven = new Set<string>();
  const evidence = new Set<string>();
  const reason = (
    route: Route,
    subject: string,
    detail: string,
    requirements: string[] = [],
  ): void => {
    reasons.push({ route, subject, detail, requirements: unique(requirements) });
  };
  const correct = (finding: Finding, requirements: string[]): void => {
    reason(
      "correct",
      finding.rule,
      `${finding.defect} (${finding.location}); ${finding.correction}`,
      requirements,
    );
    findings.push(finding);
  };

  const targets = targetsOf(plan, step);
  const byKey = new Map(targets.map((t) => [targetKey(t), t]));
  const covers = new Map<string, string[]>([
    ...step.criteria.map((c): [string, string[]] => [
      `${step.id}/${c.id}`,
      c.covers.map((r) => `${step.id}/${r}`),
    ]),
    ...plan.inherited.criteria.map((c): [string, string[]] => [
      `${plan.checkpoint}/${c.id}`,
      c.covers.map((r) => `${plan.checkpoint}/${r}`),
    ]),
  ]);
  const linked = (t: VerificationTarget): string[] => covers.get(`${t.owner}/${t.criterion}`) ?? [];
  const requirementIds = new Set([
    ...step.requirements.map((r) => `${step.id}/${r.id}`),
    ...plan.inherited.requirements.map((r) => `${plan.checkpoint}/${r.id}`),
  ]);
  const linksOf = (rule: string): string[] => {
    const target = byKey.get(rule);
    return requirementIds.has(rule) ? [rule] : target ? linked(target) : [];
  };

  // The evaluation must be this step's current definition, rubric and binding digests.
  const ids = unique(targets.map((t) => t.binding));
  const digests = bindingDigests(registry, tree, ids);
  if (
    manifest.step.id !== step.id ||
    manifest.step.definition !== plan.stepDefinitions[step.id] ||
    manifest.definitions !== plan.definitionsDigest
  ) {
    reason("retry", "evaluation", "the evaluation is not for this step's current definitions");
  }
  if (manifest.rubric !== COMMON_RUBRIC.digest) {
    reason("retry", "evaluation", `the evaluation's rubric is not ${COMMON_RUBRIC.digest}`);
  }
  for (const id of ids) {
    if (digests[id] !== undefined && manifest.verifiers[id] !== digests[id]) {
      reason(
        "retry",
        id,
        `the evaluation lists ${manifest.verifiers[id] ?? "no digest"}, the candidate has ${digests[id]}`,
      );
    }
  }
  // A record counts only when it is the evidence it claims to be, is
  // committed to the journal and belongs to this attempt's evaluation.
  const intact = (label: string, stored: Stored<object>): boolean => {
    if (sha256(stringify(stored.record)) !== stored.ref) {
      reason("retry", label, "the record does not match its evidence reference");
      return false;
    }
    if (!input.journaled.has(stored.ref)) {
      reason("retry", label, "the record is not in the committed journal");
      return false;
    }
    return true;
  };
  const current = (label: string, stored: Stored<Identity>): boolean => {
    if (!intact(label, stored)) return false;
    const r = stored.record;
    if (r.run !== input.run) reason("retry", label, `it belongs to run ${r.run}`);
    else if (r.attempt !== input.attempt) {
      reason("retry", label, `it belongs to attempt ${r.attempt}, not ${input.attempt}`);
    } else if (r.evaluation !== evaluation || r.candidate !== candidate) {
      reason("retry", label, `it is stale: evaluation ${r.evaluation} of ${r.candidate}`);
    } else return true;
    return false;
  };

  const admissions = input.admissions.filter((a) => intact(`admission ${a.ref}`, a));
  const runs = new Map<string, Stored<Invocation>[]>();
  for (const stored of input.invocations) {
    const r = stored.record;
    const label = `invocation ${r.id} of ${r.binding}`;
    if (!current(label, stored) || r.stage === "provisional") continue;
    if (!targets.some((t) => t.method === "automated" && t.binding === r.binding)) {
      reason("retry", label, `${step.id} has no automated target of ${r.binding}`);
    } else if (r.digest !== digests[r.binding]) {
      reason(
        "retry",
        label,
        `it ran ${r.digest}, not the candidate's ${digests[r.binding] ?? "binding"}`,
      );
    } else runs.set(r.binding, [...(runs.get(r.binding) ?? []), stored]);
  }

  const inScope = (paths: readonly string[]): boolean =>
    paths.every((p) => within(p, input.policy.writable) && !within(p, input.policy.protected));

  const decideAutomated = (binding: AutomatedBinding, uses: VerificationTarget[]): void => {
    const digest = digests[binding.id];
    const requirements = uses.flatMap(linked);
    const missing = binding.files.filter((f) => !tree.has(f));
    // Approved for another step, a verifier is protected: only its approved digest may run.
    const protectedPins = admissions.filter(
      ({ record: a }) => a.outcome === "approved" && a.binding === binding.id && a.step !== step.id,
    );
    const changed =
      protectedPins.length > 0 && !protectedPins.some(({ record: a }) => a.digest === digest);
    const pin =
      missing.length > 0 || changed ? undefined : approvedFor(admissions, binding.id, digest);
    if (!pin) {
      const { decided, pending } = admissionFor(admissions, binding.id, digest, evaluation);
      const latest = decided?.record ?? pending;
      if (missing.length > 0) {
        const defect = `verifier files ${missing.join(", ")} of ${binding.id} are not in the candidate`;
        if (inScope(missing)) {
          correct(
            {
              rule: binding.id,
              location: missing.join(", "),
              defect,
              correction: `add the verifier for ${binding.id}; it is admitted before its results count`,
            },
            requirements,
          );
        } else
          reason(
            "owner",
            binding.id,
            `${defect}, outside the producer's writable paths`,
            requirements,
          );
      } else if (changed) {
        const steps = unique(protectedPins.map(({ record: a }) => a.step)).join(", ");
        reason(
          "owner",
          binding.id,
          `the approved verifier of ${steps} changed: ${digest ?? "no digest"} is not its approved digest`,
          requirements,
        );
      } else if (latest?.outcome === "rejected") {
        if (inScope(binding.files)) for (const f of latest.findings) correct(f, linksOf(f.rule));
        else
          reason(
            "owner",
            binding.id,
            `admission rejected a verifier outside the producer's writable paths`,
            requirements,
          );
      } else if (latest?.outcome === "paused") {
        reason("owner", binding.id, `admission paused: ${latest.reasons.join("; ")}`, requirements);
      } else if (latest?.outcome === "invalid") {
        reason(
          "retry",
          binding.id,
          `admission incomplete: ${latest.reasons.join("; ")}`,
          requirements,
        );
      } else {
        reason(
          "retry",
          binding.id,
          `${digest ?? "the verifier"} has no approved admission; admit it first`,
          requirements,
        );
      }
      return;
    }
    evidence.add(pin.ref);
    // Per target, an executed failure binds, then an executed protocol
    // violation; only a verifier that never ran may be run again.
    const invocations = runs.get(binding.id) ?? [];
    for (const t of uses) {
      const key = targetKey(t);
      const results = invocations.flatMap(({ ref, record }) =>
        record.results.filter((r) => targetKey(r.target) === key).map((r) => ({ ref, r })),
      );
      const reasonOf = (outcome: TargetResult["outcome"]): string | undefined => {
        const found = results.find((x) => x.r.outcome === outcome)?.r;
        return found && found.outcome !== "passed" ? found.reason : undefined;
      };
      const failed = reasonOf("failed");
      const invalid = reasonOf("invalid");
      const passed = results.filter((x) => x.r.outcome === "passed").map((x) => x.ref);
      if (failed !== undefined) {
        correct(
          {
            rule: key,
            location: `verifier ${binding.id}`,
            defect: failed,
            correction: "change the implementation so that this target passes",
          },
          linked(t),
        );
      } else if (invalid !== undefined) {
        const defect = `the verifier ran but broke the report protocol: ${invalid}`;
        if (inScope(binding.files)) {
          correct(
            {
              rule: key,
              location: binding.files.join(", ") || `verifier ${binding.id}`,
              defect,
              correction:
                "make the judge report exactly one executed result for this target on stdout; it is admitted again",
            },
            linked(t),
          );
        } else
          reason(
            "owner",
            key,
            `${defect}; the verifier is outside the producer's writable paths`,
            linked(t),
          );
      } else if (passed.length > 0) {
        proven.add(key);
        for (const ref of passed) evidence.add(ref);
      } else {
        reason("retry", key, reasonOf("unavailable") ?? "no acceptance result", linked(t));
      }
    }
  };

  const approvals = input.approvals.filter((a) => intact(`approval ${a.ref}`, a));
  const decideApproval = (
    binding: { authority: string; subject: string },
    t: VerificationTarget,
  ): void => {
    const key = targetKey(t);
    const records = approvals.filter(
      (a) => a.record.run === input.run && targetKey(a.record.target) === key,
    );
    const exact = records.filter(
      ({ record: a }) =>
        a.authority === binding.authority &&
        a.candidate === candidate &&
        a.evaluation === evaluation,
    );
    const denied = exact.find((a) => a.record.decision === "denied");
    const approved = exact.find((a) => a.record.decision === "approved");
    if (denied) reason("approval", key, `denied by ${denied.record.actor}`, linked(t));
    else if (approved) {
      proven.add(key);
      evidence.add(approved.ref);
    } else {
      reason(
        "approval",
        key,
        records.length > 0
          ? `no approval by ${binding.authority} of evaluation ${evaluation}; the recorded ones are for another authority, candidate or evaluation`
          : `awaiting approval by ${binding.authority} of ${binding.subject}`,
        linked(t),
      );
    }
  };
  for (const a of approvals) {
    if (
      !targets.some((t) => t.method === "approval" && targetKey(t) === targetKey(a.record.target))
    ) {
      reason(
        "approval",
        targetKey(a.record.target),
        "the approval names no approval target of this step",
      );
    }
  }

  for (const id of ids) {
    const uses = targets.filter((t) => t.binding === id);
    const methods = unique(uses.map((t) => t.method));
    const binding = registry.get(id)?.binding;
    if (!binding) {
      reason("owner", id, `the binding registry has no definition of ${id}`, uses.flatMap(linked));
    } else if (methods.length !== 1 || methods[0] !== binding.method) {
      reason(
        "owner",
        id,
        `${id} is a ${binding.method} binding, used as ${methods.join(", ")}`,
        uses.flatMap(linked),
      );
    } else if (binding.method === "automated") decideAutomated(binding, uses);
    else if (binding.method === "approval") for (const t of uses) decideApproval(binding, t);
  }

  // The common review: the first complete verdict of this attempt binds.
  const { proofs, issues } = inventory(step, input.claims, tree);
  for (const i of issues) {
    correct(
      {
        rule: `${step.id}/${i.output}`,
        location: "submission outputs",
        defect: i.detail,
        correction: "produce each declared output and list its paths in the submission",
      },
      [],
    );
  }
  const scope = reviewScope(plan, step, registry);
  let verdict: ReviewVerdict | null = null;
  let bound: ReviewRecord | null = null;
  const protocol: string[] = [];
  for (const stored of input.reviews) {
    const label = `review ${stored.ref}`;
    // Adequacy reviews belong to admissions, not to the common review.
    if (stored.record.kind !== "candidate" || !current(label, stored)) continue;
    if (stored.record.rubric !== COMMON_RUBRIC.digest) {
      reason("retry", label, "it applied another rubric than the common rubric");
      continue;
    }
    const checked = checkVerdict(stored.record.outcome, scope);
    if (!checked.ok) {
      // An incomplete verdict may be followed by another, unless it already
      // recorded a negative judgement: that binds, so it cannot be rerolled.
      const negative = negatives(stored.record.outcome);
      if (negative.length === 0) {
        protocol.push(...checked.issues);
        continue;
      }
      reason("owner", "review", `an incomplete review judged against: ${negative.join("; ")}`);
    } else {
      verdict = checked.verdict;
      if (checked.conflicts.length > 0) {
        reason("owner", "review", `the review contradicts itself: ${checked.conflicts.join("; ")}`);
      }
    }
    bound = stored.record;
    evidence.add(stored.ref);
    break;
  }
  const provenOutputs: OutputProof[] = [];
  if (bound === null) {
    reason(
      "retry",
      "review",
      protocol.length > 0
        ? `no complete common review: ${protocol.join("; ")}`
        : "the common independent review is missing",
    );
  } else if (verdict === null) {
    // Bound by an incomplete review's negative judgement; reason given above.
  } else if (verdict.verdict === "blocked") {
    reason("owner", "review", `the reviewer is blocked: ${verdict.blockers.join("; ")}`);
  } else {
    for (const s of unassessed(verdict)) {
      reason("owner", s, "the reviewer could not assess it", linksOf(s));
    }
    const blocking = blockingFindings(verdict);
    for (const f of blocking) correct(f, linksOf(f.rule));
    const unmet = [
      ...verdict.coverage.flatMap((c) =>
        c.result === "unsatisfied" ? [{ rule: c.subject, note: c.note }] : [],
      ),
      ...verdict.targets.flatMap((t) =>
        t.result === "failed" ? [{ rule: verdictTargetKey(t), note: t.note }] : [],
      ),
    ];
    for (const { rule, note } of unmet) {
      if (blocking.some((f) => f.rule === rule)) continue;
      correct(
        { rule, location: "common review", defect: note || "not met", correction: `meet ${rule}` },
        linksOf(rule),
      );
    }
    for (const t of verdict.targets) if (t.result === "passed") proven.add(verdictTargetKey(t));
    const satisfied = new Set(
      verdict.coverage.filter((c) => c.result === "satisfied").map((c) => c.subject),
    );
    for (const p of proofs.filter((q) => satisfied.has(`${step.id}/${q.output}`))) {
      // The reviewer must have been shown exactly these paths and contents.
      if (bound.outputs.some((q) => stringify(q) === stringify(p))) provenOutputs.push(p);
      else reason("retry", `${step.id}/${p.output}`, "the review was shown other paths for it");
    }
  }

  if (reasons.some((r) => r.route === "owner")) return { ...base, decision: "pause", reasons };
  if (reasons.some((r) => r.route === "correct"))
    return { ...base, decision: "correct", reasons, findings };
  if (reasons.length > 0) return { ...base, decision: "pause", reasons };
  // Every path above gives each target and output a proof or a reason.
  const unproven = [
    ...targets.map(targetKey).filter((k) => !proven.has(k)),
    ...step.outputs
      .filter((o) => !provenOutputs.some((p) => p.output === o.id))
      .map((o) => `${step.id}/${o.id}`),
  ];
  if (unproven.length > 0) throw new Error(`accepting without a proof of ${unproven.join(", ")}`);
  return {
    ...base,
    decision: "accept",
    targets: [...proven].sort(),
    outputs: provenOutputs,
    evidence: [...evidence].sort(),
  };
}

/** Inputs `recordDecision` reads from the run instead of taking them from its caller. */
type FromJournal = "tree" | "invocations" | "admissions" | "reviews" | "approvals" | "journaled";

/**
 * Decides an attempt from the run's committed journal and records the
 * decision. The candidate's files come from the evaluation's source tree.
 * The attempt's invocations and reviews, the approvals of its evaluation and
 * every admission are read from their journal events in sequence, so a
 * caller can neither omit nor reorder them. Only an `accept` is journaled as
 * `acceptance` and returns accepted output instances; any other decision is
 * journaled as `decision`. The decision is always derived here.
 */
export function recordDecision(
  run: RunHandle,
  input: Omit<AcceptanceInput, FromJournal>,
): { decision: Decision; ref: string; accepted: AcceptedOutput[] } {
  const read = readRun(run.dir);
  if (!read.ok) throw new Error(read.diagnostics.join("\n"));
  const { events } = read.records;
  const evaluation = evaluationDigest(input.manifest);
  // readRun has checked every evidence digest, and decideAcceptance checks
  // each record against its reference again, so a record is what was stored.
  const load = <T>(action: string, keep: (e: JournalEvent) => boolean): Stored<T>[] =>
    events
      .filter((e) => e.action === action && keep(e))
      .map((e) => {
        const ref = e.data.record;
        if (typeof ref !== "string") throw new Error(`event ${e.seq}: ${action} names no record`);
        return { ref, record: JSON.parse(readEvidence(run.dir, ref).toString("utf8")) as T };
      });
  const thisAttempt = (e: JournalEvent): boolean =>
    e.attempt === input.attempt && e.evaluation === evaluation;
  const decision = decideAcceptance({
    ...input,
    tree: candidateTree(run, input.manifest.source),
    invocations: load<Invocation>("verifier-invocation", thisAttempt),
    admissions: load<Admission>("verifier-admission", () => true),
    reviews: load<ReviewRecord>("review", thisAttempt),
    approvals: load<Approval>("approval", (e) => e.evaluation === evaluation),
    journaled: new Set(events.flatMap((e) => e.evidence)),
  });
  const ref = putEvidence(run, stringify(decision));
  const accepted: AcceptedOutput[] =
    decision.decision === "accept"
      ? decision.outputs.map((o) => ({
          step: decision.step,
          output: o.output,
          definition: input.manifest.step.definition,
          definitions: input.manifest.definitions,
          evidence: [ref],
        }))
      : [];
  appendEvent(run, {
    action: decision.decision === "accept" ? "acceptance" : "decision",
    attempt: decision.attempt,
    evaluation: decision.evaluation,
    evidence: [ref],
    data: {
      step: decision.step,
      decision: decision.decision,
      candidate: decision.candidate,
      outputs: accepted.map((a) => a.output),
    },
  });
  return { decision, ref, accepted };
}

/**
 * Journals an operator's decision on one approval target, for the exact
 * candidate and evaluation, where `recordDecision` counts it. The operator
 * channel that authenticates the actor is T3-E's.
 */
export function recordApproval(
  run: RunHandle,
  attempt: number,
  approval: Approval,
): Stored<Approval> {
  const stored = store(run, approval);
  journal(run, "approval", { attempt, evaluation: approval.evaluation }, stored.ref, [], {
    target: targetKey(approval.target),
    decision: approval.decision,
  });
  return stored;
}

/**
 * The files of verifiers approved for other steps, which a producer of
 * `step` must not change: changing them needs separate authorised review.
 * Within a step, a revised verifier is admitted again before it counts.
 */
export function protectedVerifierPaths(
  registry: Registry,
  admissions: readonly Stored<Admission>[],
  step: string,
): string[] {
  return unique(
    admissions.flatMap(({ record }) => {
      const binding = registry.get(record.binding)?.binding;
      return record.outcome === "approved" &&
        record.step !== step &&
        binding?.method === "automated"
        ? [...binding.files]
        : [];
    }),
  );
}
