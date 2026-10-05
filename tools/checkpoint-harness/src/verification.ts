// T3-D: verification dispatch and reconciliation, verifier admission,
// independent review and the acceptance decision (Task 3 research log §§5–7,
// 9 and §12; Spec 00 §§3–4). Each automated binding runs its subject, the
// code under test, once per target in its own fresh read-only workspace of
// the sealed candidate, and its judge in a separate workspace holding only
// the binding's files; the judge's report is reconciled against the exact
// targets. Reviews run in a
// read-only workspace opened from the candidate. A new or changed verifier
// counts only after a provisional run, an adequacy review, a pin and a fresh
// acceptance run. Every record is stored as evidence under the digest of its
// key-ordered JSON and journaled.
// `decideAcceptance` is pure: it counts only records that are that evidence,
// are committed to the journal and belong to the current attempt, and returns
// accept, correct or pause with specific reasons. Only `recordDecision`
// journals a decision, and it derives the decision itself.
//
// T3.5 H1 (production readiness log §3 H1): bindings a candidate declares are
// admitted through the same route. Repository commands run on the sealed
// candidate with empty scratch paths for their build output and the run's
// prepared dependencies mounted read-only, so neither host state nor
// prebuilt output can satisfy a check. Each evaluation records which
// inherited targets its applicability rules leave pending.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

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
  type ToolCall,
  type WorkspaceOps,
} from "./claude.js";
import {
  CANDIDATE,
  definitionOf,
  exitId,
  exitStep,
  lineageOf,
  plannedContract,
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
  type Pending,
  type RunHandle,
} from "./evidence.js";
import {
  adequacyRubric,
  bindingDigests,
  COMMON_RUBRIC,
  FEEDBACK_RUBRIC,
  needsAdmission,
  type AutomatedBinding,
  type Registry,
  type RegistryEntry,
  type Rejection,
} from "./software-bootstrap.js";
import {
  createWorkspace,
  exec,
  fence,
  linkAncestor,
  profileDigest,
  subsetSnapshot,
  treeEntries,
  type Mount,
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
 * One execution of one binding: one subject run per expected target on the
 * candidate, each labelled by the controller with its target key, then the
 * judge run on a snapshot of the binding's files only (`judge.snapshot`),
 * whose stdout is the report.
 */
export type Invocation = Identity & {
  id: string;
  stage: Stage;
  binding: string;
  /** The binding's declared version; `digest` is its identity. */
  version: string;
  digest: string;
  /** One run per target, each in its own workspace, labelled with its target key. */
  subjects: (RunRecord & { target: string })[];
  judge: (RunRecord & { snapshot: SourceSnapshot }) | null;
  /** The prepared dependencies the subjects ran with: their key and preparation record. */
  dependencies: { key: string; record: string } | null;
  /** The checkpoint evidence the judge was given, for the exit evaluation; else null. */
  checkpoint: string | null;
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
  /** The checkpoint evidence the reviewer was shown, for the exit evaluation; else null. */
  checkpoint: string | null;
  outcome: AgentOutcome;
};

/** The adequacy route's result for one verifier digest; `approved` pins it. */
export type Admission = Identity & {
  step: string;
  binding: string;
  version: string;
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

/** A subject workspace's empty writable scratch paths and read-only mounts. */
export type WorkspaceOptions = { scratch?: readonly string[]; mounts?: readonly Mount[] };

export type OpenWorkspace = (
  snapshot: SourceSnapshot,
  options?: WorkspaceOptions,
) => Promise<ContainedWorkspace>;

/**
 * How a run prepares dependencies (operator configuration
 * `verification.dependencies`): `command` runs in a contained workspace
 * holding only the candidate's `inputs` paths, such as its manifests,
 * lockfile and vendored packages, with the configured network; the
 * `outputs` it writes are mounted read-only into subject workspaces of
 * bindings that declare `dependencies`.
 */
export type DependencySpec = {
  inputs: readonly string[];
  command: readonly string[];
  outputs: readonly string[];
  network: "none" | "bridge";
  timeoutMs: number;
};

/** One preparation of dependencies for a candidate, stored as evidence. */
export type PreparationRecord = {
  run: string;
  key: string;
  candidate: string;
  /** The snapshot of the candidate's input paths the command ran on. */
  inputs: SourceSnapshot;
  spec: DependencySpec;
  profile: string;
  ran: RunRecord | null;
  outcome: "prepared" | "failed" | "unavailable";
  reason: string | null;
};

/** Prepared dependencies of one candidate: the mounts when `prepared`, else why not. */
export type PreparedDependencies = {
  key: string;
  record: string;
  outcome: PreparationRecord["outcome"];
  reason: string | null;
  mounts: Mount[];
};

export type PrepareDependencies = (candidate: SealedCandidate) => Promise<PreparedDependencies>;

/**
 * What the controller gives the checkpoint exit evaluation (T3.5 H1; CP01
 * R05/AC05): every planned step's current acceptance as the journal records
 * it, with the revision it names, its proven targets and outputs, the
 * evidence it counted and its effects' receipts. It is built from the
 * controller's own records, stored as evidence and named by digest in the
 * exit evaluation's manifest, then handed to each exit judge on stdin and to
 * the exit reviewer, never through the candidate.
 */
export type CheckpointEvidence = {
  checkpoint: string;
  run: string;
  definitions: string;
  steps: {
    step: string;
    /** The acceptance record. */
    decision: string;
    attempt: number;
    evaluation: string;
    candidate: SourceSnapshot;
    targets: string[];
    outputs: OutputProof[];
    evidence: string[];
    receipts: {
      record: string;
      key: string;
      target: string;
      reference: string;
      reconciled: boolean;
    }[];
  }[];
};

/** Checkpoint evidence as given to an exit evaluation: its record and evidence reference. */
export type GivenCheckpoint = { ref: string; record: CheckpointEvidence };

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

/**
 * The stored records the run's committed journal lists under `action`, in
 * journal order. readRun has checked every evidence digest, and
 * decideAcceptance checks each record against its reference again, so a
 * record is what the controller stored.
 */
export function journalRecords<T>(
  run: RunHandle,
  events: readonly JournalEvent[],
  action: string,
  keep: (e: JournalEvent) => boolean,
): Stored<T>[] {
  return events
    .filter((e) => e.action === action && keep(e))
    .map((e) => {
      const ref = e.data.record;
      if (typeof ref !== "string") throw new Error(`event ${e.seq}: ${action} names no record`);
      return { ref, record: JSON.parse(readEvidence(run.dir, ref).toString("utf8")) as T };
    });
}

/** The run's committed journal events; corrupt records throw. */
export function committedEvents(run: RunHandle): JournalEvent[] {
  const read = readRun(run.dir);
  if (!read.ok) throw new Error(read.diagnostics.join("\n"));
  return read.records.events;
}

function contractStep(plan: PreparedRun, id: string): ContractStep {
  const step = plannedContract(plan, id);
  if (!step) throw new Error(`${id}: not a planned contract step`);
  return step;
}

/**
 * The planned contract steps before `step`, in checkpoint order. The exit
 * evaluation has none: the integrated acceptance holds their results.
 */
const earlierSteps = (plan: PreparedRun, step: ContractStep): ContractStep[] =>
  step.id === exitId(plan)
    ? []
    : plan.steps
        .slice(
          0,
          plan.steps.findIndex((s) => s.id === step.id),
        )
        .filter(
          (s): s is ContractStep => s.kind === "contract" && lineageOf(s) === lineageOf(step),
        );

/**
 * Every target a step must satisfy: its own, the checkpoint's inherited ones
 * that apply (all but `pending`, the evaluation's applicability decision) and
 * the automated targets of every earlier planned step. A step's candidate
 * builds on the earlier acceptances, so their executed checks run again on it
 * (T3 plan §5). Earlier review and approval targets keep their recorded
 * evidence; approvals and effects are never replayed.
 */
export const targetsOf = (
  plan: PreparedRun,
  step: ContractStep,
  pending: readonly Pending[] = [],
): VerificationTarget[] => {
  // A procedure in another repository is judged on its own evidence: the
  // candidate's checks do not apply there.
  if (lineageOf(step) !== CANDIDATE) return [...step.targets];
  const deferred = new Set(pending.map((p) => p.target));
  return [
    ...step.targets,
    ...plan.inherited.targets.filter((t) => !deferred.has(targetKey(t))),
    ...earlierSteps(plan, step).flatMap((s) => s.targets.filter((t) => t.method === "automated")),
  ];
};

/**
 * The applicability decision for an evaluation of `step` (T3.5 H1; Spec 00
 * §4): the inherited targets whose rule does not apply yet. An `exit` target
 * waits for the checkpoint exit evaluation; an `after` target waits until its
 * step has been accepted before the evaluation (`accepted`, the steps with an
 * acceptance journaled earlier). The exit evaluation leaves nothing pending.
 */
export function pendingTargets(
  plan: PreparedRun,
  step: ContractStep,
  accepted: ReadonlySet<string>,
): Pending[] {
  if (step.id === exitId(plan) || lineageOf(step) !== CANDIDATE) return [];
  return plan.inherited.targets.flatMap((t): Pending[] => {
    const rule = plan.inherited.applicability[t.criterion] ?? { kind: "step" };
    if (rule.kind === "exit") return [{ target: targetKey(t), rule: "exit" }];
    if (rule.kind === "after" && !accepted.has(rule.step)) {
      return [{ target: targetKey(t), rule: `after ${rule.step}` }];
    }
    return [];
  });
}

/**
 * Why an evaluation's pending list is not one the plan's rules allow: a
 * deferred target that is not inherited, a rule other than the target's own,
 * a `step` target deferred, or anything deferred at the exit.
 */
export function pendingIssues(
  plan: PreparedRun,
  step: ContractStep,
  pending: readonly Pending[],
): string[] {
  if (step.id === exitId(plan) && pending.length > 0) {
    return ["the exit evaluation defers no target"];
  }
  return pending.flatMap((p) => {
    const target = plan.inherited.targets.find((t) => targetKey(t) === p.target);
    if (!target) return [`${p.target} is deferred but is no inherited target`];
    const rule = plan.inherited.applicability[target.criterion] ?? { kind: "step" };
    const text = rule.kind === "after" ? `after ${rule.step}` : rule.kind;
    return rule.kind === "step" || text !== p.rule
      ? [`${p.target} is deferred as ${p.rule}, but its rule is ${text}`]
      : [];
  });
}

/** The candidate's files: path → `mode sha`, read from the run's source repository. */
export const candidateTree = (run: RunHandle, snapshot: SourceSnapshot): Map<string, string> =>
  treeEntries(run.dir, snapshot.tree);

/**
 * What the candidate holds at the workspace paths `prefixes`: its files at
 * or below them, and the links on their ancestors that would resolve them
 * into other source.
 */
const heldUnder = (tree: ReadonlyMap<string, string>, prefixes: readonly string[]): string[] =>
  unique([
    ...[...tree.keys()].filter((path) => within(path, prefixes)),
    ...prefixes.flatMap((p) => linkAncestor(tree, p) ?? []),
  ]);

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
  return async (snapshot, options = {}) => {
    const dir = join(root, randomUUID());
    const ws = await createWorkspace(run, {
      base: { commit: snapshot.commit, tree: snapshot.tree },
      root: dir,
      policy: { ...READ_ONLY, scratch: [...(options.scratch ?? [])] },
      mounts: [...(options.mounts ?? [])],
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

/**
 * Prepares a candidate's dependencies under `root`/dependencies (T3.5 H1):
 * the spec's command runs once per key — the snapshot of the candidate's
 * input paths, the spec and the containment profile — in a contained
 * workspace of that snapshot alone, as the candidate's user, with only the
 * output paths writable and the configured network. Its outputs move to a
 * directory named by the key, which subject workspaces mount read-only. Each
 * preparation is journaled as `dependency-preparation` before its outputs
 * are published, so a published directory always has a record; a later
 * preparation of the same key reuses both. A candidate holding files at an
 * output path, a failing command or a missing output fails; a workspace that
 * could not run or a timeout leaves the dependencies unavailable.
 */
export function containedDependencies(
  run: RunHandle,
  root: string,
  spec: DependencySpec,
): PrepareDependencies {
  const cache = join(root, "dependencies");
  return async (candidate) => {
    const tree = candidateTree(run, candidate);
    const inputs = subsetSnapshot(
      run.dir,
      candidate,
      [...tree.keys()].filter((path) => within(path, spec.inputs)),
    );
    const identity = { inputs: inputs.tree, spec, profile: profileDigest };
    const key = sha256(stringify(identity));
    const dir = join(cache, key.slice("sha256:".length));
    const mounts = spec.outputs.map((path) => ({ path, source: join(dir, path) }));
    const settle = (
      outcome: PreparationRecord["outcome"],
      reason: string | null,
      ran: RunRecord | null,
    ): PreparedDependencies => {
      const stored = store(run, {
        run: run.run,
        key,
        candidate: candidate.commit,
        inputs: { commit: inputs.commit, tree: inputs.tree },
        spec,
        profile: profileDigest,
        ran,
        outcome,
        reason,
      } satisfies PreparationRecord);
      appendEvent(run, {
        action: "dependency-preparation",
        evidence: [stored.ref, ...unique(ran ? [ran.stdout, ran.stderr] : [])],
        data: { key, outcome, candidate: candidate.commit, record: stored.ref },
      });
      return { key, record: stored.ref, outcome, reason, mounts };
    };
    const held = heldUnder(tree, spec.outputs);
    if (held.length > 0) {
      return settle(
        "failed",
        `the candidate holds ${held.join(", ")} at a dependency output path; dependencies are prepared, never taken from the candidate`,
        null,
      );
    }
    const prepared = journalRecords<PreparationRecord>(
      run,
      committedEvents(run),
      "dependency-preparation",
      (e) => e.data.key === key && e.data.outcome === "prepared",
    ).at(-1);
    if (prepared && existsSync(dir)) {
      return { key, record: prepared.ref, outcome: "prepared", reason: null, mounts };
    }
    mkdirSync(cache, { recursive: true });
    const work = join(cache, `${randomUUID()}.work`);
    try {
      let ws;
      try {
        ws = await createWorkspace(run, {
          base: inputs,
          root: work,
          policy: { writable: [], scratch: [...spec.outputs], protected: [] },
          network: spec.network,
        });
      } catch (e) {
        return settle(
          "unavailable",
          `the preparation workspace did not start: ${message(e)}`,
          null,
        );
      }
      const result = await exec(ws, spec.command, { timeoutMs: spec.timeoutMs });
      if (!ws.fenced) await fence(ws);
      const ran: RunRecord = {
        argv: [...spec.command],
        exit: result.exitCode,
        timedOut: result.timedOut,
        stdout: putEvidence(run, result.stdout),
        stderr: putEvidence(run, result.stderr),
      };
      const stderr = result.stderr.toString("utf8").trim().slice(-500);
      if (result.timedOut) {
        return settle("unavailable", `the preparation timed out after ${spec.timeoutMs} ms`, ran);
      }
      if (result.exitCode !== 0) {
        return settle(
          "failed",
          `the preparation exited ${result.exitCode ?? "by a signal"}: ${stderr}`,
          ran,
        );
      }
      const absent = spec.outputs.filter((o) => !existsSync(join(work, o)));
      if (absent.length > 0) {
        return settle("failed", `the preparation produced no ${absent.join(", ")}`, ran);
      }
      const partial = `${dir}.partial`;
      rmSync(partial, { recursive: true, force: true });
      for (const o of spec.outputs) {
        mkdirSync(dirname(join(partial, o)), { recursive: true });
        renameSync(join(work, o), join(partial, o));
      }
      const settled = settle("prepared", null, ran);
      rmSync(dir, { recursive: true, force: true });
      renameSync(partial, dir);
      return settled;
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  };
}

const sameSnapshot = (a: SourceSnapshot, b: SourceSnapshot): boolean =>
  a.commit === b.commit && a.tree === b.tree;

type Ran = { exitCode: number | null; timedOut: boolean; stdout: Buffer; stderr: Buffer };

/**
 * The controller's reading of one invocation, per expected target, given the
 * subject runs in target order. A subject run that timed out fails its own
 * target. Otherwise a subject or judge that never ran leaves the targets
 * unavailable, and the judge must exit 0 with a report holding exactly one
 * result per target: a pass needs at least one executed assertion and every
 * required observation. A judge failure, a missing or malformed report, a
 * skip or a result the targets do not expect never pass.
 */
export function reconcile(
  binding: AutomatedBinding,
  targets: readonly VerificationTarget[],
  observed: { error: string | null; subjects: readonly Ran[]; judge: Ran | null },
): TargetResult[] {
  return judged(binding, targets, observed).map((result, i) =>
    observed.subjects[i]?.timedOut === true
      ? {
          target: result.target,
          outcome: "failed",
          reason: `the subject timed out after ${binding.timeoutMs} ms`,
        }
      : result,
  );
}

function judged(
  binding: AutomatedBinding,
  targets: readonly VerificationTarget[],
  observed: { error: string | null; subjects: readonly Ran[]; judge: Ran | null },
): TargetResult[] {
  const all = (outcome: "invalid" | "unavailable", reason: string): TargetResult[] =>
    targets.map((target) => ({ target, outcome, reason }));
  const { judge } = observed;
  const unrun = `the verifier did not run: ${observed.error ?? "no workspace"}`;
  if (observed.subjects.length !== targets.length || judge === null) {
    return all("unavailable", unrun);
  }
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
 * commands. The subject runs once per expected target, each time in its own
 * fresh read-only workspace of the candidate, so runs cannot reach one
 * another. Its argv is the binding's command alone and its only input is the
 * target key on stdin. The subject observes the candidate as a program, a
 * separate process, and no code under test runs in the subject's own
 * process. A run's exit status and stdout are the behaviour observed: the
 * controller labels them with the run's target and constructs nothing from
 * them. The judge runs in a workspace of a snapshot holding only the
 * binding's files, outside every candidate process: it reads the labelled
 * runs as JSON on stdin, reduces each to the criterion's primitive facts and
 * writes the report to stdout.
 * Workspace and execution errors are recorded, never thrown; a failure to
 * stop a workspace is recorded apart and never discards a run.
 *
 * Repository commands (T3.5 H1): a subject workspace has the binding's
 * scratch paths empty and writable, for build output, and the prepared
 * dependencies mounted read-only when the binding declares them. A candidate
 * holding files under a scratch path fails every target, so prebuilt output
 * cannot pass; dependencies that failed to prepare fail them too, and
 * dependencies that could not be prepared leave them unavailable.
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
    prepare?: PrepareDependencies | undefined;
    checkpoint?: GivenCheckpoint | undefined;
  },
): Promise<Stored<Invocation>> {
  const { binding, identity } = input;
  const checkpoint = input.checkpoint ?? null;
  if (checkpoint && sha256(stringify(checkpoint.record)) !== checkpoint.ref) {
    throw new Error(`the checkpoint evidence does not match ${checkpoint.ref}`);
  }
  let error: string | null = null;
  const cleanup: string[] = [];
  const timeoutMs = binding.timeoutMs;
  const contained = async <T>(
    snapshot: SourceSnapshot,
    use: (ws: ContainedWorkspace) => Promise<T>,
    options?: WorkspaceOptions,
  ): Promise<T | null> => {
    let ws: ContainedWorkspace;
    try {
      ws = await input.open(snapshot, options);
    } catch (e) {
      error ??= message(e);
      return null;
    }
    try {
      if (!sameSnapshot(ws.snapshot, snapshot)) {
        error ??= `the workspace holds ${ws.snapshot.commit}, not ${snapshot.commit}`;
        return null;
      }
      return await use(ws);
    } catch (e) {
      error ??= message(e);
      return null;
    } finally {
      await ws.close().catch((e: unknown) => {
        cleanup.push(message(e));
      });
    }
  };

  // What the candidate and its dependencies decide before any subject runs.
  let precondition: { outcome: "failed" | "unavailable"; reason: string } | null = null;
  let dependencies: Invocation["dependencies"] = null;
  const options: WorkspaceOptions = { scratch: binding.scratch ?? [], mounts: [] };
  const held = heldUnder(candidateTree(run, input.candidate), binding.scratch ?? []);
  if (held.length > 0) {
    precondition = {
      outcome: "failed",
      reason: `the candidate holds ${held.join(", ")} under the scratch paths ${(binding.scratch ?? []).join(", ")}; build output is produced from the candidate's source, never taken from it`,
    };
  } else if (binding.dependencies === true) {
    if (!input.prepare) {
      precondition = { outcome: "unavailable", reason: "no dependency preparation is configured" };
    } else {
      try {
        const prepared = await input.prepare(input.candidate);
        dependencies = { key: prepared.key, record: prepared.record };
        if (prepared.outcome === "prepared") options.mounts = prepared.mounts;
        else {
          precondition = {
            outcome: prepared.outcome,
            reason: `dependencies: ${prepared.reason ?? prepared.outcome}`,
          };
        }
      } catch (e) {
        precondition = { outcome: "unavailable", reason: `dependencies: ${message(e)}` };
      }
    }
  }
  const argv = [...binding.command];
  const subjects: { target: VerificationTarget; ran: Ran }[] = [];
  for (const target of precondition === null ? input.targets : []) {
    const stdin = Buffer.from(targetKey(target));
    const ran = await contained(
      input.candidate,
      (ws) => ws.exec(argv, { timeoutMs, stdin }),
      options,
    );
    if (ran === null) break;
    subjects.push({ target, ran });
  }
  const judgeArgv = [...binding.judge];
  let judge: Ran | null = null;
  let judged: SourceSnapshot | null = null;
  if (precondition === null && subjects.length === input.targets.length) {
    try {
      judged = subsetSnapshot(run.dir, input.candidate, binding.files);
    } catch (e) {
      error ??= message(e);
    }
    if (judged !== null) {
      const runs = subjects.map(({ target, ran }) => ({
        owner: target.owner,
        criterion: target.criterion,
        case: target.caseId,
        exit: ran.exitCode,
        timedOut: ran.timedOut,
        stdout: ran.stdout.toString("utf8"),
      }));
      const stdin = Buffer.from(
        JSON.stringify({
          binding: binding.id,
          runs,
          ...(checkpoint ? { checkpoint: checkpoint.record } : {}),
        }),
      );
      judge = await contained(judged, (ws) => ws.exec(judgeArgv, { timeoutMs, stdin }));
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
    version: binding.version,
    digest: input.digest,
    subjects: subjects.map(({ target, ran }) => ({
      target: targetKey(target),
      ...record(argv, ran),
    })),
    judge:
      judge === null || judged === null
        ? null
        : { ...record(judgeArgv, judge), snapshot: { commit: judged.commit, tree: judged.tree } },
    dependencies,
    checkpoint: checkpoint?.ref ?? null,
    error: error ?? (precondition?.outcome === "unavailable" ? precondition.reason : null),
    cleanup: cleanup.length > 0 ? cleanup.join("; ") : null,
    results:
      precondition === null
        ? reconcile(binding, input.targets, {
            error,
            subjects: subjects.map((s) => s.ran),
            judge,
          })
        : input.targets.map((target) => ({ target, ...precondition })),
  };
  const stored = store(run, invocation);
  const runs = [
    ...[...invocation.subjects, invocation.judge].flatMap((r) =>
      r === null ? [] : [r.stdout, r.stderr],
    ),
    ...(dependencies ? [dependencies.record] : []),
    ...(checkpoint ? [checkpoint.ref] : []),
  ];
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
  const rubrics = new Set([adequacyRubric("automated").digest, adequacyRubric("review").digest]);
  const own = admissions.filter(
    ({ record: a }) => a.binding === binding && a.digest === digest && rubrics.has(a.rubric),
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

type VerifyInput = {
  plan: PreparedRun;
  step: string;
  registry: Registry;
  candidate: SealedCandidate;
  attempt: number;
  manifest: EvaluationManifest;
  admissions: readonly Stored<Admission>[];
  /** Prepares the candidate's dependencies for bindings that declare them. */
  prepare?: PrepareDependencies | undefined;
  /** The checkpoint evidence of an exit evaluation, given to every judge. */
  checkpoint?: GivenCheckpoint | undefined;
};

/**
 * The automated bindings `verifyCandidate` runs for acceptance: each one the
 * step and its inherited requirements need whose current digest, as the
 * evaluation lists it, has an approved admission. Other bindings are not
 * run; `decideAcceptance` states why they cannot count.
 */
export function runnableBindings(run: RunHandle, input: VerifyInput): string[] {
  const targets = targetsOf(
    input.plan,
    contractStep(input.plan, input.step),
    input.manifest.pending,
  ).filter((t) => t.method === "automated");
  const ids = unique(targets.map((t) => t.binding));
  const digests = bindingDigests(input.registry, candidateTree(run, input.candidate), ids);
  return ids.filter((id) => {
    const digest = digests[id];
    return (
      input.registry.get(id)?.binding.method === "automated" &&
      digest !== undefined &&
      input.manifest.verifiers[id] === digest &&
      approvedFor(input.admissions, id, digest) !== undefined
    );
  });
}

/**
 * Runs, for acceptance, each of the `runnableBindings`, or only those of
 * them named in `bindings`.
 */
export async function verifyCandidate(
  run: RunHandle,
  input: VerifyInput & { open: OpenWorkspace; bindings?: readonly string[] },
): Promise<Stored<Invocation>[]> {
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const targets = targetsOf(
    input.plan,
    contractStep(input.plan, input.step),
    input.manifest.pending,
  ).filter((t) => t.method === "automated");
  const ids = runnableBindings(run, input).filter(
    (id) => input.bindings === undefined || input.bindings.includes(id),
  );
  const digests = bindingDigests(input.registry, candidateTree(run, input.candidate), ids);
  const invocations: Stored<Invocation>[] = [];
  for (const id of ids) {
    const binding = input.registry.get(id)?.binding;
    const digest = digests[id];
    if (binding?.method !== "automated" || digest === undefined) continue;
    invocations.push(
      await runBinding(run, {
        binding,
        digest,
        targets: targets.filter((t) => t.binding === id),
        identity,
        stage: "acceptance",
        candidate: input.candidate,
        open: input.open,
        prepare: input.prepare,
        checkpoint: input.checkpoint,
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
    /** The checkpoint evidence the context shows, for the exit evaluation. */
    checkpoint: string | null;
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
    checkpoint: input.checkpoint,
    outcome,
  } satisfies ReviewRecord);
  journal(run, "review", identity, stored.ref, [...input.shown, input.checkpoint], {
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
export const negatives = (outcome: AgentOutcome): string[] => {
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
 * review was incomplete) may be followed by another admission. A review
 * binding a candidate declares (T3.5 H1) has nothing to run: its rubric
 * alone is reviewed, against the review-binding adequacy rubric.
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
    prepare?: PrepareDependencies | undefined;
    checkpoint?: GivenCheckpoint | undefined;
  },
): Promise<Stored<Admission>> {
  const step = contractStep(input.plan, input.step);
  const entry = input.registry.get(input.binding);
  if (!entry || !needsAdmission(entry)) {
    throw new Error(`${input.binding}: not a registered binding that needs admission`);
  }
  const binding = entry.binding;
  const rubric = adequacyRubric(binding.method);
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const tree = candidateTree(run, input.candidate);
  const digest = bindingDigests(input.registry, tree, [binding.id])[binding.id];
  if (digest === undefined) throw new Error(`${binding.id}: no digest`);
  const targets = targetsOf(input.plan, step, input.manifest.pending).filter(
    (t) => t.method === binding.method && t.binding === binding.id,
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
      version: binding.version,
      digest,
      rubric: rubric.digest,
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
  const declaration = entry.source ?? null;
  const declared: JsonObject =
    declaration === null
      ? {}
      : { declaration: { path: declaration, entry: tree.get(declaration) ?? null } };

  let provisional: Stored<Invocation> | null = null;
  let evidence: JsonObject;
  if (binding.method === "automated") {
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
    provisional = await runBinding(run, {
      binding,
      digest,
      targets,
      identity,
      stage: "provisional",
      candidate: input.candidate,
      open: input.open,
      prepare: input.prepare,
      checkpoint: input.checkpoint,
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
    const files: JsonObject = {};
    for (const f of binding.files) files[f] = tree.get(f) ?? null;
    evidence = {
      binding: {
        id: binding.id,
        command: [...binding.command],
        timeoutMs: binding.timeoutMs,
        observations: [...binding.observations],
        scratch: [...(binding.scratch ?? [])],
        dependencies: binding.dependencies === true,
      },
      files,
      provisional: verificationSummary([provisional]),
      ...declared,
    };
  } else if (binding.method === "review") {
    evidence = {
      binding: { id: binding.id, version: binding.version, rubric: [...binding.rubric] },
      ...declared,
    };
  } else throw new Error(`${binding.id}: approval bindings are not admitted`);

  const subjects = targets.map(targetKey);
  const review = await runReview(run, {
    plan: input.plan,
    step,
    identity,
    candidate: input.candidate,
    accepted: input.accepted,
    reviewer: input.reviewer,
    shown: provisional ? [provisional.ref] : [],
    outputs: [],
    checkpoint: null,
    context: {
      kind: "adequacy",
      rubric,
      subjects,
      targets: [],
      bindings: [],
      evidence,
    },
  });
  const refs = { provisional: provisional?.ref ?? null, review: review.ref };
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
export function reviewScope(
  plan: PreparedRun,
  step: ContractStep,
  registry: Registry,
  pending: readonly Pending[] = [],
): Scope & { bindings: ReviewContext["bindings"] } {
  const targets = targetsOf(plan, step, pending).filter((t) => t.method === "review");
  // An inherited requirement every one of whose targets is pending is judged
  // where those targets apply, not before.
  const deferred = new Set(pending.map((p) => p.target));
  const applies = (requirement: string): boolean => {
    const proving = plan.inherited.targets.filter((t) =>
      plan.inherited.criteria.some((c) => c.id === t.criterion && c.covers.includes(requirement)),
    );
    return proving.length === 0 || proving.some((t) => !deferred.has(targetKey(t)));
  };
  // A requirement proved only by approval targets is judged by its approver:
  // no candidate shows an approval before it is given, so the review leaves it out.
  const byApproval = (
    criteria: readonly { id: string; covers: readonly string[] }[],
    proving: readonly VerificationTarget[],
    requirement: string,
  ): boolean => {
    const covering = proving.filter((t) =>
      criteria.some((c) => c.id === t.criterion && c.covers.includes(requirement)),
    );
    return covering.length > 0 && covering.every((t) => t.method === "approval");
  };
  return {
    subjects: [
      ...step.requirements
        .filter((r) => !byApproval(step.criteria, step.targets, r.id))
        .map((r) => `${step.id}/${r.id}`),
      ...plan.inherited.requirements
        .filter((r) => applies(r.id))
        .filter((r) => !byApproval(plan.inherited.criteria, plan.inherited.targets, r.id))
        .map((r) => `${plan.checkpoint}/${r.id}`),
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
    claims: Submission["outputs"];
    reviewer: ReviewerAccess;
    /** The checkpoint evidence of an exit evaluation, shown to the reviewer. */
    checkpoint?: GivenCheckpoint | undefined;
  },
): Promise<Stored<ReviewRecord>> {
  const step = contractStep(input.plan, input.step);
  const checkpoint = input.checkpoint ?? null;
  const identity = identityOf(run, input.attempt, input.manifest, input.candidate);
  const scope = reviewScope(input.plan, step, input.registry, input.manifest.pending);
  const { proofs, issues } = inventory(step, input.claims, candidateTree(run, input.candidate));
  const events = committedEvents(run);
  // The evidence shown is this attempt's committed acceptance runs, never a caller's selection.
  const shown = journalRecords<Invocation>(
    run,
    events,
    "verifier-invocation",
    (e) =>
      e.attempt === identity.attempt &&
      e.evaluation === identity.evaluation &&
      e.data.stage === "acceptance",
  );
  return runReview(run, {
    plan: input.plan,
    step,
    identity,
    candidate: input.candidate,
    accepted: input.accepted,
    reviewer: input.reviewer,
    shown: shown.map((i) => i.ref),
    outputs: proofs,
    checkpoint: checkpoint?.ref ?? null,
    context: {
      kind: "candidate",
      rubric: COMMON_RUBRIC,
      subjects: [...scope.subjects],
      targets: [...scope.targets],
      bindings: scope.bindings,
      evidence: {
        verification: verificationSummary(shown),
        outputs: { proofs, issues },
        ...(checkpoint ? { checkpoint: checkpoint.record } : {}),
        ...(step.procedure
          ? {
              operation: transcript(
                run,
                producerInvocation(run, events, step.id, identity.attempt),
              ),
            }
          : {}),
      },
    },
  });
}

/**
 * Assesses a pull request's feedback (T3.5 H3): a fresh reviewer in a
 * read-only workspace of the current candidate judges each feedback item, a
 * subject, against the pinned requirements of every selected step under the
 * feedback rubric. It uses the reviewer's own template and verdict rules; the
 * packet is the checkpoint's integrated view, consuming every accepted output.
 */
export async function assessFeedback(
  run: RunHandle,
  input: {
    plan: PreparedRun;
    identity: Identity;
    candidate: SealedCandidate;
    accepted: readonly AcceptedOutput[];
    feedback: { ref: string; pull: number; url: string | null; items: readonly Json[] };
    subjects: readonly string[];
    reviewer: ReviewerAccess;
  },
): Promise<Stored<ReviewRecord>> {
  const step = exitStep(input.plan);
  return runReview(run, {
    plan: input.plan,
    step,
    identity: input.identity,
    candidate: input.candidate,
    accepted: input.accepted,
    reviewer: input.reviewer,
    shown: [],
    outputs: [],
    checkpoint: null,
    context: {
      kind: "feedback",
      rubric: FEEDBACK_RUBRIC,
      subjects: [...input.subjects],
      targets: [],
      bindings: [],
      evidence: {
        pullRequest: {
          number: input.feedback.pull,
          url: input.feedback.url,
          snapshot: input.feedback.ref,
        },
        feedback: [...input.feedback.items],
        requirements: input.plan.steps.map((s) => ({
          step: s.id,
          requirements: s.requirements.map((r) => ({
            id: `${s.id}/${r.id}`,
            statement: r.statement,
          })),
          outputs: s.outputs.map((o) => ({ id: `${s.id}/${o.id}`, meaning: o.meaning })),
        })),
        inherited: input.plan.inherited.requirements.map((r) => ({
          id: `${input.plan.checkpoint}/${r.id}`,
          statement: r.statement,
        })),
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
  /**
   * Where the candidate declares bindings and the declarations its registry
   * refused (T3.5 H1); none when the run configures no declarations.
   */
  declarations?: { dir: string | null; rejected: readonly Rejection[] };
  /**
   * The checkpoint evidence the exit evaluation's manifest names, read from
   * the run's evidence; null or absent when there is none.
   */
  checkpoint?: GivenCheckpoint | null;
  /**
   * The attempt's producer invocation, the latest journaled: an operational
   * step's command and observation evidence (T3.5 H3). Null when none ran.
   */
  producer?: Stored<AgentOutcome> | null;
};

/** The commands a producer invocation ran in its workspace, with their recorded output. */
export const commandsOf = (outcome: AgentOutcome): ToolCall[] =>
  outcome.observation.toolCalls.filter((c) => c.tool === "run_command" && c.exit !== undefined);

const TRANSCRIPT_TAIL = 4096;

/**
 * An operational step's command transcript as the reviewer is shown it: each
 * recorded command, its exit status and the tail of its recorded output.
 */
function transcript(run: RunHandle, producer: Stored<AgentOutcome> | null): Json {
  const text = (ref: string | undefined): string =>
    ref === undefined
      ? "(not recorded)"
      : readEvidence(run.dir, ref).toString("utf8").slice(-TRANSCRIPT_TAIL);
  return {
    invocation: producer?.ref ?? null,
    commands: (producer ? commandsOf(producer.record) : []).map((c) => ({
      command: c.target,
      exit: c.exit ?? null,
      timedOut: c.timedOut ?? false,
      stdout: text(c.stdout),
      stderr: text(c.stderr),
    })),
  };
}

/** The latest producer invocation journaled for an attempt of a step. */
export function producerInvocation(
  run: RunHandle,
  events: readonly JournalEvent[],
  step: string,
  attempt: number,
): Stored<AgentOutcome> | null {
  return (
    journalRecords<AgentOutcome>(
      run,
      events,
      "agent-invocation",
      (e) => e.attempt === attempt && e.data.role === "producer" && e.data.step === step,
    ).at(-1) ?? null
  );
}

/**
 * Decides one attempt from its evidence. A step is accepted only when every
 * current target — its own and the inherited ones that apply, of every
 * method — has a proof,
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

  const targets = targetsOf(plan, step, manifest.pending);
  const byKey = new Map(targets.map((t) => [targetKey(t), t]));
  const covers = new Map<string, string[]>([
    ...[step, ...earlierSteps(plan, step)].flatMap((s) =>
      s.criteria.map((c): [string, string[]] => [
        `${s.id}/${c.id}`,
        c.covers.map((r) => `${s.id}/${r}`),
      ]),
    ),
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
    manifest.step.definition !== definitionOf(plan, step.id) ||
    manifest.definitions !== plan.definitionsDigest
  ) {
    reason("retry", "evaluation", "the evaluation is not for this step's current definitions");
  }
  for (const issue of pendingIssues(plan, step, manifest.pending)) {
    reason("retry", "evaluation", `the applicability decision is not the plan's: ${issue}`);
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

  // The exit evaluation is given the controller's checkpoint evidence: it
  // must exist, be committed and hold exactly the current acceptance of every
  // planned step that the evaluation's inputs name.
  const exiting = step.id === exitId(plan);
  if (!exiting && manifest.checkpoint !== null) {
    reason("retry", "evaluation", "a step evaluation names checkpoint evidence");
  }
  if (exiting) {
    const given = input.checkpoint ?? null;
    if (manifest.checkpoint === null) {
      reason("retry", "checkpoint-evidence", "the exit evaluation names no checkpoint evidence");
    } else if (
      given === null ||
      given.ref !== manifest.checkpoint ||
      sha256(stringify(given.record)) !== given.ref
    ) {
      reason(
        "owner",
        "checkpoint-evidence",
        `the checkpoint evidence ${manifest.checkpoint} is missing`,
      );
    } else if (!input.journaled.has(given.ref)) {
      reason(
        "retry",
        "checkpoint-evidence",
        "the checkpoint evidence is not in the committed journal",
      );
    } else {
      const record = given.record;
      if (record.checkpoint !== plan.checkpoint || record.definitions !== plan.definitionsDigest) {
        reason("retry", "checkpoint-evidence", "the checkpoint evidence is of other definitions");
      }
      const planned = plan.steps.filter((s): s is ContractStep => s.kind === "contract");
      for (const entry of record.steps) {
        if (!planned.some((s) => s.id === entry.step)) {
          reason("retry", `checkpoint-evidence/${entry.step}`, "it is not a planned step");
        }
      }
      for (const s of planned) {
        const subject = `checkpoint-evidence/${s.id}`;
        const entries = record.steps.filter((e) => e.step === s.id);
        const [entry] = entries;
        const named = unique(
          manifest.inputs.filter((i) => i.step === s.id).map((i) => i.evaluation),
        );
        if (entries.length !== 1 || entry === undefined) {
          reason(
            "retry",
            subject,
            `the checkpoint evidence holds ${entries.length} acceptances of ${s.id}`,
          );
        } else if (!input.journaled.has(entry.decision)) {
          reason(
            "retry",
            subject,
            `its acceptance ${entry.decision} is not in the committed journal`,
          );
        } else if (named.some((e) => e !== entry.evaluation)) {
          reason(
            "retry",
            subject,
            `it is stale: evaluation ${entry.evaluation}, the exit evaluation names ${named.join(", ")}`,
          );
        }
      }
    }
  }

  const admissions = input.admissions.filter((a) => intact(`admission ${a.ref}`, a));
  const runs = new Map<string, Stored<Invocation>[]>();
  for (const stored of input.invocations) {
    const r = stored.record;
    const label = `invocation ${r.id} of ${r.binding}`;
    if (!current(label, stored) || r.stage === "provisional") continue;
    if ((r.checkpoint ?? null) !== manifest.checkpoint) {
      reason("retry", label, "its judge was not given the evaluation's checkpoint evidence");
    } else if (!targets.some((t) => t.method === "automated" && t.binding === r.binding)) {
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

  const declarations = input.declarations ?? { dir: null, rejected: [] };
  const declarationPath = (id: string): string | null =>
    declarations.dir === null ? null : `${declarations.dir}/${id}.yml`;
  // The paths a producer changes to correct a binding: its files and declaration.
  const ownPaths = (entry: RegistryEntry): string[] => [
    ...(entry.binding.method === "automated" ? entry.binding.files : []),
    ...(entry.source === undefined ? [] : [entry.source]),
  ];
  for (const r of declarations.rejected) {
    const subject = r.binding ?? r.path;
    const uses = targets.filter((t) => t.binding === r.binding);
    const detail = r.diagnostics.join("; ");
    if (inScope([r.path])) {
      correct(
        {
          rule: subject,
          location: r.path,
          defect: `the binding declaration is refused: ${detail}`,
          correction: `correct or remove ${r.path}; a declaration is ${declarations.dir ?? "the bindings directory"}/<binding-id>.yml for a binding a planned target names`,
        },
        uses.flatMap(linked),
      );
    } else
      reason(
        "owner",
        subject,
        `the binding declaration is refused: ${detail}`,
        uses.flatMap(linked),
      );
  }

  /**
   * The approved admission that pins the binding's current digest, or
   * undefined with the reason it cannot count yet. A verifier approved for
   * another step is protected: only its approved digest may run.
   */
  const pinFor = (
    entry: RegistryEntry,
    uses: VerificationTarget[],
  ): Stored<Admission> | undefined => {
    const { binding } = entry;
    const digest = digests[binding.id];
    const requirements = uses.flatMap(linked);
    const missing = binding.method === "automated" ? binding.files.filter((f) => !tree.has(f)) : [];
    const protectedPins = admissions.filter(
      ({ record: a }) => a.outcome === "approved" && a.binding === binding.id && a.step !== step.id,
    );
    const changed =
      protectedPins.length > 0 && !protectedPins.some(({ record: a }) => a.digest === digest);
    const pin =
      missing.length > 0 || changed ? undefined : approvedFor(admissions, binding.id, digest);
    if (pin) return pin;
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
      if (inScope(ownPaths(entry))) for (const f of latest.findings) correct(f, linksOf(f.rule));
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
    return undefined;
  };

  const decideAutomated = (
    entry: RegistryEntry,
    binding: AutomatedBinding,
    uses: VerificationTarget[],
  ): void => {
    const pin = pinFor(entry, uses);
    if (!pin) return;
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
    const entry = registry.get(id);
    const binding = entry?.binding;
    const path = declarationPath(id);
    if (!entry || !binding) {
      // A refused declaration already has its reason.
      if (declarations.rejected.some((r) => r.binding === id)) continue;
      if (path !== null && inScope([path])) {
        correct(
          {
            rule: id,
            location: path,
            defect: `no binding defines ${id}`,
            correction: `declare ${id} at ${path} with the verifier it runs; it is admitted before its results count`,
          },
          uses.flatMap(linked),
        );
      } else {
        reason(
          "owner",
          id,
          `the binding registry has no definition of ${id}`,
          uses.flatMap(linked),
        );
      }
    } else if (methods.length !== 1 || methods[0] !== binding.method) {
      reason(
        "owner",
        id,
        `${id} is a ${binding.method} binding, used as ${methods.join(", ")}`,
        uses.flatMap(linked),
      );
    } else if (binding.method === "automated") decideAutomated(entry, binding, uses);
    else if (binding.method === "approval") for (const t of uses) decideApproval(binding, t);
    else if (needsAdmission(entry)) {
      // A declared review binding's rubric counts only once admitted; the
      // common review proves its targets.
      const pin = pinFor(entry, uses);
      if (pin) evidence.add(pin.ref);
    }
  }

  // An operational step is accepted only on the command and observation
  // evidence the controller recorded while its producer ran the procedure.
  if (step.procedure) {
    const subject = `${step.id}/PROCEDURE`;
    // The procedure ran where the definitions and configuration declare.
    const declared = { target: lineageOf(step), revision: step.procedure.target?.revision ?? null };
    if (stringify(manifest.operation ?? null) !== stringify(declared)) {
      reason(
        "owner",
        subject,
        `the procedure was evaluated in ${stringify(manifest.operation ?? null)}, not its declared target ${stringify(declared)}`,
        [subject],
      );
    }
    const producer = input.producer ?? null;
    const commands =
      producer && intact(`producer ${producer.ref}`, producer) ? commandsOf(producer.record) : [];
    const outputs = commands.flatMap((c) => [c.stdout, c.stderr]);
    // A journaled reference is intact: readRun checks every evidence digest.
    const recorded = (ref: string | undefined): ref is string =>
      ref !== undefined && input.journaled.has(ref);
    if (producer === null || commands.length === 0) {
      correct(
        {
          rule: subject,
          location: "the step's workspace",
          defect: "no command of the procedure was executed, so there is no command evidence",
          correction: "carry out the procedure by running its commands with run_command as written",
        },
        [subject],
      );
    } else if (!outputs.every(recorded)) {
      correct(
        {
          rule: subject,
          location: "the step's workspace",
          defect: "the observation evidence of a command, its recorded output, is missing",
          correction: "run the procedure's commands again so that their output is recorded",
        },
        [subject],
      );
    } else {
      evidence.add(producer.ref);
      for (const ref of outputs) if (ref !== undefined) evidence.add(ref);
    }
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
  const scope = reviewScope(plan, step, registry, manifest.pending);
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
  if (bound !== null && (bound.checkpoint ?? null) !== manifest.checkpoint) {
    reason("retry", "review", "the review was not shown the evaluation's checkpoint evidence");
  }
  if (bound !== null) {
    // The verdict speaks for the evidence it was shown: exactly the runs counted here.
    const counted = unique([...runs.values()].flat().map((i) => i.ref));
    const shown = unique(bound.invocations);
    if (stringify(counted) !== stringify(shown)) {
      reason(
        "retry",
        "review",
        `the review was shown runs ${shown.join(", ") || "(none)"}, not the counted ${counted.join(", ") || "(none)"}`,
      );
    }
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

/**
 * The acceptance input of an attempt with every part `recordDecision` reads
 * from the run's committed journal and evidence rather than from its caller.
 */
export function journalInput(
  run: RunHandle,
  input: Omit<AcceptanceInput, FromJournal>,
): AcceptanceInput {
  const events = committedEvents(run);
  const evaluation = evaluationDigest(input.manifest);
  const load = <T>(action: string, keep: (e: JournalEvent) => boolean): Stored<T>[] =>
    journalRecords<T>(run, events, action, keep);
  const thisAttempt = (e: JournalEvent): boolean =>
    e.attempt === input.attempt && e.evaluation === evaluation;
  return {
    ...input,
    tree: candidateTree(run, input.manifest.source),
    invocations: load<Invocation>("verifier-invocation", thisAttempt),
    admissions: load<Admission>("verifier-admission", () => true),
    reviews: load<ReviewRecord>("review", thisAttempt),
    approvals: load<Approval>("approval", (e) => e.evaluation === evaluation),
    journaled: new Set(events.flatMap((e) => e.evidence)),
    checkpoint: givenCheckpoint(run.dir, input.manifest.checkpoint),
    producer: producerInvocation(run, events, input.step, input.attempt),
  };
}

/** The checkpoint evidence stored under `ref`, or null when there is none or it is unreadable. */
export function givenCheckpoint(dir: string, ref: string | null): GivenCheckpoint | null {
  if (ref === null) return null;
  try {
    const record = JSON.parse(readEvidence(dir, ref).toString("utf8")) as CheckpointEvidence;
    return { ref, record };
  } catch {
    return null;
  }
}

/** Inputs `recordDecision` reads from the run instead of taking them from its caller. */
type FromJournal =
  | "tree"
  | "invocations"
  | "admissions"
  | "reviews"
  | "approvals"
  | "journaled"
  | "checkpoint"
  | "producer";

/**
 * Decides an attempt from the run's committed journal and records the
 * decision. The candidate's files come from the evaluation's source tree.
 * The attempt's invocations and reviews, the approvals of its evaluation and
 * every admission are read from their journal events in sequence, so a
 * caller can neither omit nor reorder them. The checkpoint evidence an exit
 * evaluation's manifest names is read from the run's evidence. Only an
 * `accept` is journaled as `acceptance` and returns accepted output
 * instances; any other decision is journaled as `decision`. The decision is
 * always derived here.
 */
export function recordDecision(
  run: RunHandle,
  input: Omit<AcceptanceInput, FromJournal>,
): { decision: Decision; ref: string; accepted: AcceptedOutput[] } {
  const decision = decideAcceptance(journalInput(run, input));
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
      const entry = registry.get(record.binding);
      if (record.outcome !== "approved" || record.step === step || !needsAdmission(entry)) {
        return [];
      }
      return [
        ...(entry?.binding.method === "automated" ? entry.binding.files : []),
        ...(entry?.source === undefined ? [] : [entry.source]),
      ];
    }),
  );
}
