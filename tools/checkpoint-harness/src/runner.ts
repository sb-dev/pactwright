// T3-E: the serial runner, operator approvals and external effects (Task 3
// research log §§5–9 and §12 T3-E; Spec 00 §4). One loop drives a run: it
// reads the committed journal, derives the next action from recorded facts
// alone, runs that action, which journals new facts, and repeats. Resume is
// the same loop after recovery, so a run continues from its last valid event
// and no counter lives outside the journal. Each step moves through
// producing → verifying → reviewing → accepted; a correction returns to
// producing with its findings, and anything else stops the run unaccepted and
// resumable. Only `recordDecision` journals an acceptance, and an acceptance
// counts only while its full evaluation identity is current. Approvals enter
// only through `approveRequest` and configuration changes only through
// `amendRun`, from an operator; an approved effect runs after its step's
// acceptance, once, between a journaled intent and a receipt.
//
// T3.5 H1: each candidate's registry adds the bindings it declares; each
// evaluation records the inherited targets its applicability rules leave
// pending; and when the selection covers the checkpoint and its integrated
// acceptance left targets pending, the checkpoint exit evaluation applies
// them before the run reports the checkpoint complete.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";

import {
  buildPacket,
  containedOps,
  invokeAgent,
  recordInvocation,
  resolveRole,
  type AgentOutcome,
  type AgentRole,
  type Finding,
  type Provider,
  type RoleName,
  type Submission,
  type WorkspaceOps,
} from "./claude.js";
import {
  CANDIDATE,
  coversCheckpoint,
  definitionOf,
  exitId,
  exitStep,
  lineageOf,
  nextEligible,
  plannedContract,
  prepareRun,
  sha256,
  type AcceptedOutput,
  type ApplicabilityRules,
  type ContractStep,
  type PreparedRun,
  type RunConfig,
  type VerificationTarget,
} from "./contracts.js";
import {
  collect,
  dispositionsOf,
  isBot,
  replyBody,
  type Assessment,
  type FeedbackSnapshot,
  type FeedbackSource,
  type RoundRecord,
} from "./pull-requests.js";
import {
  appendEvent,
  createRun,
  evaluationDigest,
  putEvidence,
  readEvidence,
  readRun,
  recoverRun,
  releaseRun,
  type EvaluationManifest,
  type JournalEvent,
  type GithubOwner,
  type JsonObject,
  type Liveness,
  type OwnerRecord,
  type Pending,
  type RunHandle,
} from "./evidence.js";
import {
  adequacyRubric,
  bindingDigests,
  COMMON_RUBRIC,
  declaredRegistry,
  needsAdmission,
  type Declared,
  type Registry,
} from "./software-bootstrap.js";
import {
  admitVerifier,
  assessFeedback,
  checkVerdict,
  committedEvents,
  givenCheckpoint,
  inventory,
  negatives,
  pendingTargets,
  protectedVerifierPaths,
  recordApproval,
  recordDecision,
  reviewCandidate,
  reviewScope,
  runnableBindings,
  targetKey,
  targetsOf,
  verifyCandidate,
  type Admission,
  type Approval,
  type CheckpointEvidence,
  type Decision,
  type DependencySpec,
  type Invocation,
  type OpenWorkspace,
  type OutputProof,
  type PrepareDependencies,
  type ReviewerAccess,
  type ReviewRecord,
} from "./verification.js";
import {
  createWorkspace,
  fence,
  importSource,
  policyPathError,
  profileDigest,
  sealCandidate,
  sealSnapshot,
  treeEntries,
  treeFiles,
  type Capture,
  type SealedCandidate,
  type SourceSnapshot,
  type WritePolicy,
} from "./workspace.js";

/** The external effect an approval authorises, exactly: what, where and which artefacts. */
export type EffectRequest = {
  run: string;
  step: string;
  binding: { id: string; digest: string };
  action: string;
  target: string;
  candidate: string;
  outputs: OutputProof[];
  /** What the action needs beyond its target, such as a commit to push (T3.5 H3). */
  payload?: JsonObject;
};

/** A service's proof that the effect with `key` exists at `target`, with what it read back. */
export type Receipt = { key: string; target: string; reference: string; details?: JsonObject };

/**
 * Raised by a service that will not execute an effect, such as a push onto a
 * branch that moved (T3.5 H3). The run pauses; nothing is retried blindly.
 */
export class EffectRefused extends Error {
  override name = "EffectRefused";
}

/**
 * An effect the target declined without performing it, for a cause the
 * operator can fix (a permission or setting): the run pauses, and once the
 * cause is fixed a continuation reads the target back and retries it.
 */
export class EffectBlocked extends Error {
  override name = "EffectBlocked";
}

/**
 * An external effect service. `execute` returns null when it sent the effect
 * but got no response, so its outcome is uncertain. `inspect` reads the
 * target back: the receipt of the effect with `key`, or null when there is
 * none. A service without `inspect` cannot reconcile an uncertain outcome.
 * A thrown error stops the controller; resume reconciles from the journal.
 */
export type EffectService = {
  execute(key: string, request: EffectRequest): Promise<Receipt | null>;
  inspect?: (key: string, request: EffectRequest) => Promise<Receipt | null>;
};

/** What an operator is asked to approve: one approval target of one evaluation. */
export type ApprovalRequest = {
  run: string;
  step: string;
  attempt: number;
  evaluation: string;
  candidate: string;
  target: VerificationTarget;
  /** The approval binding and its digest: the version approved. */
  binding: { id: string; digest: string };
  authority: string;
  subject: string;
  /** The exact effect the approval authorises, or null for an approval without one. */
  effect: EffectRequest | null;
};

/** An approval recorded through `approveRequest`: bound to the request it answers. */
export type OperatorApproval = Approval & { request: string };

/** A contained producer workspace; `seal` stops every writer before capturing. */
export type ProducerWorkspace = WorkspaceOps & {
  seal(against: { base: SourceSnapshot; policy: WritePolicy }): Promise<Capture>;
  close(): Promise<void>;
};

export type Workspaces = {
  producer(from: SourceSnapshot, policy: WritePolicy): Promise<ProducerWorkspace>;
  verifier: OpenWorkspace;
  reviewer: OpenWorkspace;
  /** Prepares a candidate's dependencies under the configured spec (T3.5 H1). */
  dependencies?: (spec: DependencySpec) => PrepareDependencies;
};

/** The runner's boundaries: repository, resources, provider sessions and effects. */
export type RunnerDeps = {
  /** The Git repository holding the definitions revision and the source head. */
  repoRoot: string;
  /** The controller's skills root; skills are never read from a candidate. */
  skillsRoot: string;
  env: Readonly<Record<string, string | undefined>>;
  /** The controller's bindings; a candidate adds those it declares (T3.5 H1). */
  registry: Registry;
  /** The run model's applicability rules for inherited criteria (T3.5 H1). */
  applicability?: ApplicabilityRules;
  /** Identity of the harness and run-model code, part of every evaluation. */
  harness: string;
  workspaces(run: RunHandle, candidateRoot: string): Workspaces;
  effects: EffectService | null;
  /** Stops every worker of a run before a new controller acts. */
  fence(run: string): Promise<unknown>;
  liveness?: (owner: OwnerRecord) => Liveness | Promise<Liveness>;
  providers?: { producer?: Provider; reviewer?: Provider };
  signal: AbortSignal;
  /** Called with each committed event, in order; the CLI prints progress. */
  progress?: (event: JournalEvent) => void;
  /**
   * Saves the run's portable state (T3.5 H3): after a phase that journaled,
   * after a phase start before its agent or command runs, after an effect's
   * intent before the effect, and at a stop. A failure stops the controller
   * before any agent call or effect.
   */
  save?: (run: RunHandle, why: SavePoint) => Promise<void>;
  /** When to yield (ms since the epoch): checked before each action (T3.5 H3). */
  yieldAt?: number;
  /**
   * What this job may do (T3.5 H3); all by default. An action needing more
   * stops with a hand-off: agent sessions and candidate execution to the
   * controller job, external effects to the effects job.
   */
  capabilities?: Capabilities;
  /** Runner-local workspace roots, replacing the configured ones (T3.5 H3). */
  workspaceRoots?: { candidate: string; controller: string };
  /** Whether admission needs the provider credential; true by default. */
  requireCredential?: boolean;
  /** The hosted job that owns what this controller journals (T3.5 H3). */
  github?: GithubOwner | null;
  /**
   * A local repository holding `revision` of `repository`, for an operation
   * target (T3.5 H3); null when it cannot be made available. Without it only
   * `repoRoot`'s own repository is available.
   */
  repositories?: (repository: string, revision: string) => Promise<string | null>;
};

export type SavePoint = "start" | "phase" | "effect" | "stop";

export type Capabilities = { agents: boolean; candidates: boolean; effects: boolean };

const ALL: Capabilities = { agents: true, candidates: true, effects: true };

/** One machine-readable reason a run stopped unaccepted. */
export type PauseReason = {
  code: string;
  subject: string;
  detail: string;
  requirements: string[];
  /** The approval request an operator can answer for it, if any. */
  request: string | null;
};

/**
 * Whether the checkpoint is complete (T3.5 H1): every step of it has a
 * current acceptance and no inherited target is pending, because the
 * integrated acceptance left none or a current exit evaluation applied them.
 * Selection acceptance alone never means completion.
 */
export type CheckpointStatus = {
  checkpoint: string;
  complete: boolean;
  /** The checkpoint's steps without a current acceptance, selected or not. */
  unaccepted: string[];
  /** Inherited targets not yet applied, with the rule that defers each. */
  pending: Pending[];
};

export type RunResult =
  | {
      outcome: "selection-accepted";
      run: string;
      dir: string;
      through: string;
      accepted: string[];
      checkpoint: CheckpointStatus;
    }
  | {
      outcome: "paused";
      run: string | null;
      dir: string;
      through: string | null;
      accepted: string[];
      step: string | null;
      reasons: PauseReason[];
      checkpoint: CheckpointStatus | null;
    }
  | { outcome: "invalid"; diagnostics: string[] };

/** 0 only for accepted requested scope, 2 for invalid admission, 3 for an unaccepted stop. */
export const exitCode = (result: RunResult): number =>
  result.outcome === "selection-accepted" ? 0 : result.outcome === "invalid" ? 2 : 3;

export type RunnerState =
  "prepared" | "producing" | "verifying" | "reviewing" | "accepted" | "paused";

export type RunnerConfig = RunConfig & {
  roles: Record<RoleName, unknown>;
  budgets: {
    attempts: number;
    retries: number;
    wall_time_seconds: number;
    provider_spend_limit: { usd: number; turn_reservation_usd: number };
    run_spend_usd?: number;
  };
  /** Hosted job limits (T3.5 H3). */
  job?: { yield_after_seconds?: number; faults?: boolean };
  workspace: { candidate_root: string; controller_root: string };
  permissions: WritePolicy & { approvers: Record<string, string[]> };
  /** Where the accepted selection is published for review (T3.5 H3). */
  publication?: {
    pull_request: { title: string; draft: boolean; base?: string };
    /** The review workflow dispatched on each published head. */
    review?: { workflow: string; inputs?: Record<string, string> };
  };
  verification?: {
    bindings?: string;
    dependencies?: {
      inputs: string[];
      command: string[];
      outputs: string[];
      network: "none" | "bridge";
      timeout_ms: number;
    };
  };
};

/**
 * How a hosted run was started (T3.5 H3): its run name, the configuration
 * template and the commit it was read at, the pinned controller commit and
 * the ref its continuations are dispatched on.
 */
export type Hosted = {
  name: string;
  template: string;
  revision: string;
  controller: string;
  ref: string;
};

type RunStart = {
  config: RunnerConfig;
  plan: string;
  base: SourceSnapshot;
  hosted?: Hosted;
  /** Each declared operation target's revision, imported at start (T3.5 H3). */
  targets?: Record<string, SourceSnapshot>;
};

/** One changed configuration value, by JSON pointer; an absent value is null. */
export type ConfigChange = { path: string; old: unknown; new: unknown };

/**
 * An operator's journaled amendment: the new configuration, each change and
 * why; for a hosted run, the configuration revision it was read at (T3.5 H3).
 */
type Amendment = {
  actor: string;
  reason: string;
  config: RunnerConfig;
  changes: ConfigChange[];
  revision?: string | null;
};

/** How one attempt is produced; retries of the attempt reuse it. */
type Production = {
  from: SourceSnapshot;
  base: SourceSnapshot;
  policy: WritePolicy;
  findings: Finding[];
  /**
   * A pull request's newer commits adopted as they are (T3.5 H3): `from` is
   * sealed without an agent, with the claims of the step's last acceptance.
   */
  adopt?: { claims: Submission["outputs"] };
};

type Phase = "produce" | "admit" | "verify" | "review" | "assess";

/**
 * Journaled before a phase runs; a second start of the same key is a retry.
 * An agent phase's start reserves its invocation allowance (T3.5 H3): until a
 * result follows it, before the next start, that allowance counts as spent.
 */
type Start = {
  phase: Phase;
  step: string;
  attempt: number;
  key: string;
  production: Production | null;
  allowance?: number | null;
};

type EvaluationRecord = {
  step: string;
  attempt: number;
  candidate: SealedCandidate;
  claims: Submission["outputs"];
  manifest: EvaluationManifest;
};

type Intent = { key: string; request: EffectRequest };
type ReceiptRecord = { key: string; receipt: Receipt; reconciled: boolean };
type RefusalRecord = { key: string; reason: string };

type Fact<T> = {
  seq: number;
  ref: string;
  attempt: number | null;
  evaluation: string | null;
  data: JsonObject;
  record: T;
};

type State = {
  events: JournalEvent[];
  starts: Fact<Start>[];
  producers: Fact<AgentOutcome>[];
  rejections: Fact<{ step: string; attempt: number; diagnostics: string[] }>[];
  evaluations: Fact<EvaluationRecord>[];
  admissions: Fact<Admission>[];
  invocations: Fact<Invocation>[];
  reviews: Fact<ReviewRecord>[];
  decisions: Fact<Decision>[];
  requests: Fact<ApprovalRequest>[];
  approvals: Fact<Approval & { request?: string }>[];
  intents: Fact<Intent>[];
  receipts: Fact<ReceiptRecord>[];
  invalidReceipts: Fact<{ key: string; receipt: Receipt }>[];
  refusals: Fact<RefusalRecord>[];
  amendments: Fact<Amendment>[];
  feedback: Fact<FeedbackSnapshot>[];
  assessments: Fact<Assessment>[];
  rounds: Fact<RoundRecord>[];
};

type Acceptance = {
  step: string;
  seq: number;
  ref: string;
  evaluation: string;
  decision: Extract<Decision, { decision: "accept" }>;
  candidate: SealedCandidate;
  outputs: AcceptedOutput[];
  /** The step definition and definition set the acceptance is bound to. */
  definition: string;
  definitions: string;
  /** The lineage the accepted candidate belongs to (T3.5 H3). */
  lineage: string;
};

/** The evaluation an action works on. */
type Evaluated = {
  step: ContractStep;
  attempt: number;
  evaluation: string;
  record: EvaluationRecord;
  policy: WritePolicy;
};

type Stop = { kind: "done" } | { kind: "pause"; step: string | null; reasons: PauseReason[] };

type Action =
  | Stop
  | { kind: "produce"; step: ContractStep; attempt: number; production: Production }
  | { kind: "evaluate"; record: EvaluationRecord; checkpoint?: CheckpointEvidence }
  | { kind: "admit"; ev: Evaluated; binding: string }
  | { kind: "verify"; ev: Evaluated; bindings: string[] }
  | { kind: "review"; ev: Evaluated }
  | { kind: "decide"; ev: Evaluated }
  | { kind: "request"; ev: Evaluated; targets: VerificationTarget[] }
  | { kind: "assess"; snapshot: Fact<FeedbackSnapshot>; step: string; attempt: number }
  | {
      kind: "round";
      snapshot: Fact<FeedbackSnapshot>;
      assessment: Fact<Assessment>;
      replies: string[];
    }
  | {
      kind: "effect";
      step: string;
      key: string;
      request: EffectRequest;
      uncertain: boolean;
      /** The service refused it before: read back, never execute again. */
      refused: boolean;
    };

type Ctx = {
  run: RunHandle;
  config: RunnerConfig;
  plan: PreparedRun;
  base: SourceSnapshot;
  roles: { producer: AgentRole; reviewer: AgentRole };
  deps: RunnerDeps;
  workspaces: Workspaces;
  skills: Record<string, string>;
  configuration: string;
  /** The registry of a snapshot: the controller's bindings and those it declares. */
  declared(snapshot: SourceSnapshot): Declared;
  /** Prepares dependencies, when the configuration says how. */
  prepare: PrepareDependencies | undefined;
  /** How a hosted run was started, if it was (T3.5 H3). */
  hosted: Hosted | null;
  /** Each declared operation target's imported revision (T3.5 H3). */
  targets: Readonly<Record<string, SourceSnapshot>>;
};

const runnerSchema: unknown = JSON.parse(
  readFileSync(new URL("./runner.schema.json", import.meta.url), "utf8"),
);
const validateRunner = new Ajv2020({ allErrors: true }).compile<RunnerConfig>(
  runnerSchema as Record<string, unknown>,
);

const unique = (values: readonly string[]): string[] => [...new Set(values)].sort();

const within = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const snapshotOf = (s: SourceSnapshot): SourceSnapshot => ({ commit: s.commit, tree: s.tree });

const sameSnapshot = (a: SourceSnapshot, b: SourceSnapshot): boolean =>
  a.commit === b.commit && a.tree === b.tree;

const reason = (
  code: string,
  subject: string,
  detail: string,
  requirements: string[] = [],
): PauseReason => ({ code, subject, detail, requirements, request: null });

const pause = (step: string | null, reasons: PauseReason[]): Stop => ({
  kind: "pause",
  step,
  reasons,
});

/** An effect's idempotency key: its exact request, without attempt or evaluation. */
export const effectKey = (request: EffectRequest): string => sha256(stringify(request));

/**
 * Stores a record as evidence and journals it; the reference is the event's
 * first evidence and `data.record`, as in T3-D.
 */
function journal(
  run: RunHandle,
  action: string,
  record: object,
  at: { attempt?: number; evaluation?: string },
  data: JsonObject,
  more: readonly string[] = [],
): string {
  const ref = putEvidence(run, stringify(record));
  appendEvent(run, {
    action,
    ...(at.attempt === undefined ? {} : { attempt: at.attempt }),
    ...(at.evaluation === undefined ? {} : { evaluation: at.evaluation }),
    evidence: [ref, ...unique(more.filter((m) => m !== ref))],
    data: { ...data, record: ref },
  });
  return ref;
}

/** The records of `action`, in journal order: `data.record`, else the first evidence. */
function facts<T>(dir: string, events: readonly JournalEvent[], action: string): Fact<T>[] {
  return events
    .filter((e) => e.action === action)
    .map((e) => {
      const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
      if (ref === undefined) throw new Error(`event ${e.seq}: ${action} names no record`);
      return {
        seq: e.seq,
        ref,
        attempt: e.attempt,
        evaluation: e.evaluation,
        data: e.data,
        record: JSON.parse(readEvidence(dir, ref).toString("utf8")) as T,
      };
    });
}

function readState(run: Pick<RunHandle, "dir">, events: JournalEvent[]): State {
  const load = <T>(action: string): Fact<T>[] => facts<T>(run.dir, events, action);
  return {
    events,
    starts: load<Start>("start"),
    producers: load<AgentOutcome>("agent-invocation").filter((f) => f.data.role === "producer"),
    rejections: load("seal-rejected"),
    evaluations: load<EvaluationRecord>("evaluation"),
    admissions: load<Admission>("verifier-admission"),
    invocations: load<Invocation>("verifier-invocation"),
    reviews: load<ReviewRecord>("review"),
    decisions: [...load<Decision>("decision"), ...load<Decision>("acceptance")].sort(
      (a, b) => a.seq - b.seq,
    ),
    requests: load<ApprovalRequest>("approval-request"),
    approvals: load<Approval & { request?: string }>("approval"),
    intents: load<Intent>("effect-intent"),
    receipts: load<ReceiptRecord>("effect-receipt"),
    invalidReceipts: load("effect-invalid"),
    refusals: load<RefusalRecord>("effect-refused"),
    amendments: load<Amendment>("amendment"),
    feedback: load<FeedbackSnapshot>("pr-feedback"),
    assessments: load<Assessment>("pr-assessment"),
    rounds: load<RoundRecord>("pr-round"),
  };
}

function contractStep(plan: PreparedRun, id: string): ContractStep {
  const step = plannedContract(plan, id);
  if (!step) throw new Error(`${id}: not a planned contract step`);
  return step;
}

/**
 * The steps with an acceptance journaled before event `seq`, current or
 * not: an `after` rule binds from a step's first acceptance (Spec 00 §4).
 */
const acceptedBefore = (s: State, seq: number): Set<string> =>
  new Set(
    s.decisions
      .filter((d) => d.seq < seq && d.record.decision === "accept")
      .map((d) => d.record.step),
  );

/**
 * Each step's latest acceptance whose evaluation is still current: the
 * manifest recomputed now for its candidate, with the current acceptances of
 * the steps it consumes, has the accepted evaluation's digest. A change to a
 * definition, an accepted input, the harness, a binding, the rubric, a skill
 * or the evaluated configuration therefore invalidates the acceptance and
 * every acceptance that consumes it, before any effect or scheduling. The
 * old records stay in the journal as history.
 */
function acceptances(ctx: Ctx, s: State): Map<string, Acceptance> {
  const current = new Map<string, Acceptance>();
  for (const step of ctx.plan.steps) {
    if (step.kind !== "contract") continue;
    // A correction round invalidates its step's and every later step's acceptance (T3.5 H3).
    const invalidated = routing(ctx, s, step)?.seq ?? 0;
    for (const d of [...s.decisions].reverse()) {
      const decision = d.record;
      if (decision.decision !== "accept" || decision.step !== step.id) continue;
      if (d.seq < invalidated) break;
      const ev = s.evaluations.find(
        (e) => e.evaluation === decision.evaluation && e.record.step === decision.step,
      );
      if (!ev) throw new Error(`acceptance ${d.ref} names no journaled evaluation`);
      const manifest = manifestOf(
        ctx,
        step,
        current,
        ev.record.candidate,
        acceptedBefore(s, ev.seq),
      );
      if (!manifest || evaluationDigest(manifest) !== decision.evaluation) continue;
      current.set(step.id, {
        step: step.id,
        seq: d.seq,
        ref: d.ref,
        evaluation: decision.evaluation,
        decision,
        candidate: ev.record.candidate,
        outputs: decision.outputs.map((o) => ({
          step: step.id,
          output: o.output,
          definition: manifest.step.definition,
          definitions: manifest.definitions,
          evidence: [d.ref],
        })),
        definition: manifest.step.definition,
        definitions: manifest.definitions,
        lineage: lineageOf(step),
      });
      break;
    }
  }
  return current;
}

/**
 * The latest pull-request assessment whose correction starts at `step` or an
 * earlier step: its acceptance and theirs no longer count once it is
 * journaled (T3.5 H3). A fixing commit or a reply never restores them; only a
 * new acceptance after the assessment does.
 */
function routing(ctx: Ctx, s: State, step: ContractStep): Fact<Assessment> | undefined {
  const index = (id: string): number => ctx.plan.steps.findIndex((p) => p.id === id);
  return s.assessments
    .filter((a) => a.record.correction && index(a.record.correction.step) <= index(step.id))
    .at(-1);
}

const acceptedOutputs = (accepted: Map<string, Acceptance>): AcceptedOutput[] =>
  [...accepted.values()].flatMap((a) => a.outputs);

/**
 * The integrated candidate's acceptance: the latest current acceptance of
 * the run's candidate. A procedure in another repository never becomes it.
 */
const integrated = (accepted: Map<string, Acceptance>): Acceptance | undefined =>
  [...accepted.values()].filter((a) => a.lineage === CANDIDATE).sort((a, b) => b.seq - a.seq)[0];

/** The pending targets of the evaluation an acceptance accepted. */
function pendingOf(s: State, acceptance: Acceptance): readonly Pending[] {
  const ev = s.evaluations.find(
    (e) => e.evaluation === acceptance.evaluation && e.record.step === acceptance.step,
  );
  return ev?.record.manifest.pending ?? [];
}

/**
 * The current acceptance of the checkpoint exit evaluation: of the
 * integrated candidate, with an evaluation still current.
 */
function exitAcceptance(
  ctx: Ctx,
  s: State,
  accepted: Map<string, Acceptance>,
): Fact<Decision> | undefined {
  const exit = exitStep(ctx.plan);
  const latest = integrated(accepted);
  if (!latest) return undefined;
  return [...s.decisions].reverse().find((d) => {
    if (d.record.decision !== "accept" || d.record.step !== exit.id) return false;
    const ev = s.evaluations.find(
      (e) => e.evaluation === d.record.evaluation && e.record.step === exit.id,
    );
    if (!ev) throw new Error(`acceptance ${d.ref} names no journaled evaluation`);
    if (!sameSnapshot(ev.record.candidate, latest.candidate)) return false;
    const manifest = manifestOf(
      ctx,
      exit,
      accepted,
      ev.record.candidate,
      acceptedBefore(s, ev.seq),
      checkpointEvidence(ctx, s, accepted),
    );
    return manifest !== null && evaluationDigest(manifest) === d.record.evaluation;
  });
}

/** Checkpoint completion from the recorded facts (T3.5 H1). */
function checkpointStatus(ctx: Ctx, s: State, accepted: Map<string, Acceptance>): CheckpointStatus {
  const unaccepted = Object.keys(ctx.plan.stepDefinitions).filter((id) => !accepted.has(id));
  const latest = integrated(accepted);
  const deferred = ctx.plan.inherited.targets.flatMap((t): Pending[] => {
    const rule = ctx.plan.inherited.applicability[t.criterion] ?? { kind: "step" };
    return rule.kind === "step"
      ? []
      : [{ target: targetKey(t), rule: rule.kind === "after" ? `after ${rule.step}` : "exit" }];
  });
  const pending =
    unaccepted.length === 0 && exitAcceptance(ctx, s, accepted)
      ? []
      : unaccepted.length === 0 && latest
        ? [...pendingOf(s, latest)]
        : deferred;
  return {
    checkpoint: ctx.plan.checkpoint,
    complete: unaccepted.length === 0 && pending.length === 0,
    unaccepted,
    pending,
  };
}

/** The integrated candidate a step builds on: the latest acceptance of an earlier step. */
function stepBase(ctx: Ctx, step: ContractStep, accepted: Map<string, Acceptance>): SourceSnapshot {
  if (step.id === exitId(ctx.plan)) {
    const latest = integrated(accepted);
    return latest ? snapshotOf(latest.candidate) : ctx.base;
  }
  const earlier = ctx.plan.steps.slice(
    0,
    ctx.plan.steps.findIndex((s) => s.id === step.id),
  );
  // A step builds on its own lineage: the candidate, or its target repository.
  const lineage = lineageOf(step);
  const latest = earlier
    .flatMap((s) => accepted.get(s.id) ?? [])
    .filter((a) => a.lineage === lineage)
    .sort((a, b) => b.seq - a.seq)[0];
  if (latest) return snapshotOf(latest.candidate);
  if (lineage === CANDIDATE) return ctx.base;
  const root = ctx.targets[lineage];
  if (!root) throw new Error(`${step.id}: operation target ${lineage} was not imported at start`);
  return root;
}

/** The accepted proof of each output the step consumes, by input reference. */
function inputProofs(
  step: ContractStep,
  accepted: Map<string, Acceptance>,
): { ref: string; proof: OutputProof | undefined }[] {
  return step.inputs
    .filter((i) => i.kind === "output")
    .map((i) => {
      const [producer = "", output = ""] = i.ref.split("/");
      return {
        ref: i.ref,
        proof: accepted.get(producer)?.decision.outputs.find((o) => o.output === output),
      };
    });
}

/** Nothing is the exit evaluation's to change when no step can correct it. */
const EXIT_POLICY: WritePolicy = { writable: [], scratch: [], protected: [] };

/**
 * The step whose producer corrects the exit evaluation's findings: the
 * selection's final step, when it is a contract step. Its next attempt
 * starts from the integrated candidate with the exit's findings.
 */
function correctingStep(ctx: Ctx): ContractStep | undefined {
  const last = ctx.plan.steps
    .filter((s) => s.kind === "contract" && lineageOf(s) === CANDIDATE)
    .at(-1);
  return last?.kind === "contract" ? last : undefined;
}

/**
 * The producer's write policy: the configured paths, with the definitions,
 * verifiers approved for other steps (their files and declarations, read
 * from the step's base) and the step's accepted inputs protected.
 */
function policyFor(
  ctx: Ctx,
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
): WritePolicy {
  if (step.id === exitId(ctx.plan)) {
    // The exit is judged under the policy of the producer that corrects it.
    const correcting = correctingStep(ctx);
    return correcting ? policyFor(ctx, s, correcting, accepted) : EXIT_POLICY;
  }
  // A procedure in another repository may change only that target's declared paths.
  const target = step.procedure?.target;
  if (target) return { writable: [...target.writable], scratch: [], protected: [] };
  const { writable, scratch } = ctx.config.permissions;
  const { registry } = ctx.declared(stepBase(ctx, step, accepted));
  return {
    writable: [...writable],
    scratch: [...scratch],
    protected: unique([
      ...ctx.config.permissions.protected,
      ...ctx.plan.sources.map((x) => x.path),
      ...protectedVerifierPaths(registry, s.admissions, step.id),
      ...inputProofs(step, accepted).flatMap(({ proof }) => proof?.paths.map((p) => p.path) ?? []),
    ]),
  };
}

/**
 * The policy the workspace mounts: a protected path matters only inside a
 * writable path, and a mount needs it present in the snapshot. The seal still
 * checks the full policy, so an absent protected path cannot be created.
 */
function mounted(ctx: Ctx, policy: WritePolicy, from: SourceSnapshot): WritePolicy {
  const paths = [...treeEntries(ctx.run.dir, from.tree).keys()];
  return {
    ...policy,
    protected: policy.protected.filter(
      (p) => within(p, policy.writable) && paths.some((path) => within(path, [p])),
    ),
  };
}

/**
 * The evaluation manifest of `candidate` now, or null when an input has no
 * current acceptance. `ever` holds the steps accepted before the evaluation,
 * from which its applicability decision follows. The exit evaluation's
 * inputs are every planned step's accepted outputs, and it names the
 * `checkpoint` evidence it is given by digest.
 */
function manifestOf(
  ctx: Ctx,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
  candidate: SourceSnapshot,
  ever: ReadonlySet<string>,
  checkpoint: CheckpointEvidence | null = null,
): EvaluationManifest | null {
  const consumed =
    step.id === exitId(ctx.plan)
      ? ctx.plan.steps.flatMap((p) =>
          p.kind === "contract" ? p.outputs.map((o) => `${p.id}/${o.id}`) : [],
        )
      : step.inputs.filter((x) => x.kind === "output").map((x) => x.ref);
  const inputs: EvaluationManifest["inputs"][number][] = [];
  for (const ref of consumed) {
    const [producer = "", output = ""] = ref.split("/");
    const acceptance = accepted.get(producer);
    if (!acceptance) return null;
    inputs.push({ step: producer, output, evaluation: acceptance.evaluation });
  }
  const tree = treeEntries(ctx.run.dir, candidate.tree);
  const pending = pendingTargets(ctx.plan, step, ever);
  return {
    source: { commit: candidate.commit, tree: candidate.tree },
    definitions: ctx.plan.definitionsDigest,
    step: { id: step.id, definition: definitionOf(ctx.plan, step.id) },
    inputs,
    harness: ctx.deps.harness,
    runModel: ctx.plan.runModel,
    verifiers: bindingDigests(
      ctx.declared(candidate).registry,
      tree,
      targetsOf(ctx.plan, step, pending).map((t) => t.binding),
    ),
    rubric: COMMON_RUBRIC.digest,
    skills: ctx.skills,
    configuration: ctx.configuration,
    toolchain: { profile: profileDigest, lockfile: tree.get("pnpm-lock.yaml") ?? null },
    pending,
    checkpoint: checkpoint === null ? null : sha256(stringify(checkpoint)),
    ...(step.procedure
      ? {
          operation: {
            target: lineageOf(step),
            revision: step.procedure.target?.revision ?? null,
          },
        }
      : {}),
  };
}

/**
 * The checkpoint evidence the exit evaluation is given (T3.5 H1), from the
 * controller's records alone: each planned step's current acceptance, the
 * revision, targets, outputs and evidence it records, and the receipts of
 * the step's effects. Null while a planned step has no current acceptance.
 */
function checkpointEvidence(
  ctx: Ctx,
  s: State,
  accepted: Map<string, Acceptance>,
): CheckpointEvidence | null {
  const steps: CheckpointEvidence["steps"] = [];
  for (const step of ctx.plan.steps) {
    if (step.kind !== "contract") continue;
    const acceptance = accepted.get(step.id);
    if (!acceptance) return null;
    const { decision } = acceptance;
    steps.push({
      step: step.id,
      decision: acceptance.ref,
      attempt: decision.attempt,
      evaluation: acceptance.evaluation,
      candidate: snapshotOf(acceptance.candidate),
      targets: [...decision.targets],
      outputs: decision.outputs,
      evidence: [...decision.evidence],
      receipts: s.receipts
        .filter((r) => r.data.step === step.id)
        .map((r) => ({
          record: r.ref,
          key: r.record.key,
          target: r.record.receipt.target,
          reference: r.record.receipt.reference,
          reconciled: r.record.reconciled,
        })),
    });
  }
  return {
    checkpoint: ctx.plan.checkpoint,
    run: ctx.run.run,
    definitions: ctx.plan.definitionsDigest,
    steps,
  };
}

/** The checkpoint evidence an evaluation's manifest names, as stored, for its phases. */
const given = (ctx: Ctx, ev: Evaluated): ReturnType<typeof givenCheckpoint> =>
  givenCheckpoint(ctx.run.dir, ev.record.manifest.checkpoint);

/**
 * Why a step cannot be dispatched: unregistered bindings its producer cannot
 * declare, dependencies no configuration prepares, no effect service, a
 * changed input. The targets are those that apply now.
 */
function readiness(
  ctx: Ctx,
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
  base: SourceSnapshot,
): PauseReason[] {
  const reasons: PauseReason[] = [];
  const pending = pendingTargets(ctx.plan, step, acceptedBefore(s, Number.POSITIVE_INFINITY));
  const targets = targetsOf(ctx.plan, step, pending);
  const { registry } = ctx.declared(base);
  const policy = policyFor(ctx, s, step, accepted);
  const dir = ctx.config.verification?.bindings;
  for (const id of unique(targets.map((t) => t.binding))) {
    const methods = unique(targets.filter((t) => t.binding === id).map((t) => t.method));
    const binding = registry.get(id)?.binding;
    const declarable =
      dir !== undefined &&
      within(`${dir}/${id}.yml`, policy.writable) &&
      !within(`${dir}/${id}.yml`, policy.protected);
    if (!binding) {
      if (!declarable) {
        reasons.push(
          reason(
            "owner",
            id,
            `binding ${id} is not registered; its verifier comes with its capability`,
          ),
        );
      }
    } else if (
      binding.method === "automated" &&
      binding.dependencies === true &&
      ctx.prepare === undefined
    ) {
      reasons.push(
        reason(
          "owner",
          id,
          `${id} needs prepared dependencies; configure verification.dependencies`,
        ),
      );
    } else if (methods.length !== 1 || methods[0] !== binding.method) {
      reasons.push(
        reason("owner", id, `${id} is a ${binding.method} binding, used as ${methods.join(", ")}`),
      );
    } else if (
      binding.method === "approval" &&
      binding.effect &&
      !ctx.deps.effects &&
      (ctx.deps.capabilities ?? ALL).effects
    ) {
      reasons.push(
        reason("owner", id, `no effect service is configured for ${binding.effect.action}`),
      );
    }
  }
  const tree = treeEntries(ctx.run.dir, base.tree);
  for (const { ref, proof } of inputProofs(step, accepted)) {
    if (!proof) {
      reasons.push(reason("owner", ref, "the input has no current acceptance"));
      continue;
    }
    const changed = proof.paths.filter((p) => tree.get(p.path) !== p.entry).map((p) => p.path);
    if (changed.length > 0) {
      reasons.push(
        reason(
          "owner",
          ref,
          `accepted input changed since its acceptance at ${changed.join(", ")}`,
        ),
      );
    }
  }
  return reasons;
}

/** A new attempt of a step, if its budget and dispatch readiness allow one. */
function newAttempt(
  ctx: Ctx,
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
  attempt: number,
  from: SourceSnapshot,
  findings: Finding[],
  adopt?: Production["adopt"],
): Action {
  const limit = ctx.config.budgets.attempts;
  if (attempt > limit) {
    return pause(step.id, [
      reason(
        "exhausted",
        step.id,
        `the ${limit} production attempts of ${step.id} are used; the last findings were: ${findings.map((f) => `${f.rule}: ${f.defect}`).join("; ") || "none"}`,
      ),
    ]);
  }
  const base = stepBase(ctx, step, accepted);
  const blocked = readiness(ctx, s, step, accepted, base);
  if (blocked.length > 0) return pause(step.id, blocked);
  return {
    kind: "produce",
    step,
    attempt,
    production: {
      from: snapshotOf(from),
      base,
      policy: policyFor(ctx, s, step, accepted),
      findings,
      ...(adopt ? { adopt } : {}),
    },
  };
}

/**
 * The findings a restarted attempt keeps: those it was already correcting,
 * then the new ones, each once.
 */
function carry(previous: readonly Finding[], added: readonly Finding[]): Finding[] {
  const all = [...previous, ...added];
  return all.filter((f, i) => all.findIndex((g) => stringify(g) === stringify(f)) === i);
}

const sealFindings = (diagnostics: readonly string[]): Finding[] =>
  diagnostics.map((d) => ({
    rule: "write-policy",
    location: d.split(":")[0] ?? d,
    defect: d,
    correction:
      "change only the writable paths; protected paths and links out of the tree are refused",
  }));

/** The approval targets of a step whose binding carries an effect. */
function effectTargets(
  ctx: Ctx,
  step: ContractStep,
  pending: readonly Pending[],
): VerificationTarget[] {
  return targetsOf(ctx.plan, step, pending).filter((t) => {
    const binding = ctx.deps.registry.get(t.binding)?.binding;
    return (
      t.method === "approval" && binding?.method === "approval" && binding.effect !== undefined
    );
  });
}

/** The next effect of an accepted step that has no receipt, or a stop. */
function effectAction(ctx: Ctx, s: State, acceptance: Acceptance): Action | null {
  const step = contractStep(ctx.plan, acceptance.step);
  for (const t of effectTargets(ctx, step, pendingOf(s, acceptance))) {
    const key = targetKey(t);
    const approval = s.approvals.find(
      (a) =>
        a.evaluation === acceptance.evaluation &&
        targetKey(a.record.target) === key &&
        a.record.decision === "approved" &&
        a.record.request !== undefined,
    );
    const request = s.requests.find((r) => r.ref === approval?.record.request)?.record;
    const effect = request?.effect;
    if (
      !request ||
      !effect ||
      request.step !== step.id ||
      request.evaluation !== acceptance.evaluation ||
      targetKey(request.target) !== key ||
      effect.candidate !== acceptance.candidate.commit ||
      !acceptance.decision.targets.includes(key)
    ) {
      return pause(step.id, [
        reason("owner", key, "the accepted approval is bound to no approved effect request"),
      ]);
    }
    const next = effectFor(ctx, s, effect, key, approval?.record.request ?? null);
    if (next) return next;
  }
  return null;
}

/**
 * The next action for one effect request, or null once it has a receipt: run
 * it, read back an uncertain outcome first, or pause. A wrong receipt or a
 * refusal is never followed by another execution. A job without effects
 * hands the effect to the effects job (T3.5 H3).
 */
function effectFor(
  ctx: Ctx,
  s: State,
  effect: EffectRequest,
  subject: string,
  request: string | null,
): Action | null {
  const { step } = effect;
  const id = effectKey(effect);
  if (s.receipts.some((r) => r.record.key === id)) return null;
  // A response, even a wrong one, means the effect was sent: never again.
  const invalid = s.invalidReceipts.find((r) => r.record.key === id);
  if (invalid) {
    return pause(step, [
      reason(
        "effect-invalid",
        id,
        `the service answered with a receipt for ${invalid.record.receipt.key} at ${invalid.record.receipt.target}; the harness will not repeat the effect`,
      ),
    ]);
  }
  const intents = s.intents.filter((i) => i.record.key === id);
  const refused = s.refusals.some((r) => r.record.key === id);
  const service = ctx.deps.effects;
  const handed = !(ctx.deps.capabilities ?? ALL).effects;
  if (!service && !handed) {
    return pause(step, [reason("owner", subject, "no effect service is configured")]);
  }
  if (service && intents.length > 0 && !service.inspect) {
    return pause(step, [
      {
        ...reason(
          "effect-uncertain",
          subject,
          `${effect.action} on ${effect.target} may have run, and the service cannot read it back; the harness will not repeat it`,
        ),
        request,
      },
    ]);
  }
  return { kind: "effect", step, key: id, request: effect, uncertain: intents.length > 0, refused };
}

/**
 * Approvals of an evaluation that did not come through the operator channel.
 * D counts an approval by target, authority, candidate and evaluation; the
 * runner also requires it to answer a journaled request of this step,
 * evaluation, target and candidate, by an actor holding the request's
 * authority in the run's configuration.
 */
function unchanneled(ctx: Ctx, s: State, step: ContractStep, evaluation: string): PauseReason[] {
  return s.approvals
    .filter((a) => a.evaluation === evaluation)
    .flatMap((a) => {
      const request = s.requests.find((r) => r.ref === a.record.request)?.record;
      const holders = request ? (ctx.config.permissions.approvers[request.authority] ?? []) : [];
      const channelled =
        request !== undefined &&
        request.step === step.id &&
        request.evaluation === evaluation &&
        request.candidate === a.record.candidate &&
        request.authority === a.record.authority &&
        targetKey(request.target) === targetKey(a.record.target) &&
        holders.includes(a.record.actor);
      return channelled
        ? []
        : [
            reason(
              "owner",
              targetKey(a.record.target),
              `approval ${a.ref} did not come through the operator channel for a request of this evaluation`,
            ),
          ];
    });
}

/**
 * The phases of one evaluation: admissions, verification, review, decision,
 * approvals. The exit evaluation has no `production`: it is never corrected
 * by a producer, so a decision to correct it pauses.
 */
function evaluationAction(
  ctx: Ctx,
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
  latest: Fact<EvaluationRecord>,
  production: Production | null,
): Action {
  const { run, plan } = ctx;
  const record = latest.record;
  const { attempt } = record;
  // The current write policy, never the one the candidate was produced under,
  // governs it: a candidate whose changes it no longer permits is corrected
  // from the step's base, with the same rule and wording as the seal's check.
  const policy = policyFor(ctx, s, step, accepted);
  const violations = record.candidate.changes
    .filter((c) => !within(c.path, policy.writable) || within(c.path, policy.protected))
    .map((c) => `${c.path}: ${c.kind} outside the writable paths`);
  if (production && violations.length > 0) {
    return newAttempt(
      ctx,
      s,
      step,
      accepted,
      attempt + 1,
      production.base,
      carry(production.findings, sealFindings(violations)),
    );
  }
  const checkpoint = production ? null : checkpointEvidence(ctx, s, accepted);
  const manifest = manifestOf(
    ctx,
    step,
    accepted,
    record.candidate,
    acceptedBefore(s, latest.seq),
    checkpoint,
  );
  if (!manifest) throw new Error(`${step.id}: an input has no current acceptance`);
  const evaluation = evaluationDigest(manifest);
  // A changed input, definition, rubric, verifier, skill, configuration or,
  // at the exit, checkpoint evidence makes a new evaluation of the same
  // candidate; earlier records stay.
  if (evaluation !== latest.evaluation) {
    const now = manifestOf(
      ctx,
      step,
      accepted,
      record.candidate,
      acceptedBefore(s, Number.POSITIVE_INFINITY),
      checkpoint,
    );
    if (!now) throw new Error(`${step.id}: an input has no current acceptance`);
    return {
      kind: "evaluate",
      record: { ...record, manifest: now },
      ...(checkpoint ? { checkpoint } : {}),
    };
  }
  const ev: Evaluated = { step, attempt, evaluation, record, policy };
  const thisEvaluation = <T extends { evaluation: string; attempt: number }>(f: Fact<T>): boolean =>
    f.record.evaluation === evaluation && f.record.attempt === attempt;
  const { registry } = ctx.declared(record.candidate);

  for (const binding of unique(targetsOf(plan, step, manifest.pending).map((t) => t.binding))) {
    const entry = registry.get(binding);
    if (!entry || !needsAdmission(entry)) continue;
    const rubric = adequacyRubric(entry.binding.method).digest;
    const own = s.admissions.filter(
      (a) =>
        a.record.binding === binding &&
        a.record.digest === manifest.verifiers[binding] &&
        a.record.rubric === rubric,
    );
    const decided = own.some((a) => a.record.review !== null && a.record.outcome !== "invalid");
    const settled = own.some((a) => thisEvaluation(a) && a.record.outcome !== "invalid");
    if (decided || settled) continue;
    if (entry.binding.method === "automated" && entry.binding.dependencies && !ctx.prepare) {
      return pause(step.id, [
        reason(
          "owner",
          binding,
          `${binding} needs prepared dependencies; configure verification.dependencies`,
        ),
      ]);
    }
    return { kind: "admit", ev, binding };
  }

  const expected = runnableBindings(run, {
    plan,
    step: step.id,
    registry,
    candidate: record.candidate,
    attempt,
    manifest,
    admissions: s.admissions,
  });
  const unprepared = expected.filter((b) => {
    const binding = registry.get(b)?.binding;
    return binding?.method === "automated" && binding.dependencies === true && !ctx.prepare;
  });
  if (unprepared.length > 0) {
    return pause(
      step.id,
      unprepared.map((b) =>
        reason("owner", b, `${b} needs prepared dependencies; configure verification.dependencies`),
      ),
    );
  }
  const runs = s.invocations.filter((i) => thisEvaluation(i) && i.record.stage === "acceptance");
  const missing = expected.filter((b) => !runs.some((r) => r.record.binding === b));
  if (missing.length > 0) return { kind: "verify", ev, bindings: missing };
  // Only a verifier that never ran may run again; review waits until each has run.
  const unavailable = expected.filter((b) =>
    runs
      .filter((r) => r.record.binding === b)
      .at(-1)
      ?.record.results.some((r) => r.outcome === "unavailable"),
  );
  if (unavailable.length > 0) return { kind: "verify", ev, bindings: unavailable };

  const scope = reviewScope(plan, step, registry, manifest.pending);
  const reviews = s.reviews.filter((r) => r.record.kind === "candidate" && thisEvaluation(r));
  const binds = reviews.some(
    (r) => checkVerdict(r.record.outcome, scope).ok || negatives(r.record.outcome).length > 0,
  );
  if (!binds) {
    const lastReview = reviews.at(-1);
    const last = lastReview?.record.outcome;
    if (last?.outcome === "exhausted" && !amendedSince(s, lastReview?.seq ?? 0)) {
      return pause(step.id, [
        reason("exhausted", step.id, `the reviewer exhausted its ${last.limit} limit`),
      ]);
    }
    return { kind: "review", ev };
  }

  const decision = s.decisions.filter(thisEvaluation).at(-1);
  const approvedSince = s.approvals.some(
    (a) => a.evaluation === evaluation && a.seq > (decision?.seq ?? 0),
  );
  if (!decision || approvedSince) {
    const bypassed = unchanneled(ctx, s, step, evaluation);
    return bypassed.length > 0 ? pause(step.id, bypassed) : { kind: "decide", ev };
  }
  const d = decision.record;
  if (d.decision === "accept") {
    throw new Error(`${step.id}: evaluation ${evaluation} is accepted but not current`);
  }
  if (d.decision === "correct") {
    return production
      ? newAttempt(ctx, s, step, accepted, attempt + 1, record.candidate, d.findings)
      : correctExit(ctx, s, accepted, d.findings);
  }
  const requests = s.requests.filter((r) => r.evaluation === evaluation);
  if (d.reasons.every((r) => r.route === "approval")) {
    const missingRequests = targetsOf(plan, step, manifest.pending).filter(
      (t) =>
        t.method === "approval" &&
        !requests.some((r) => targetKey(r.record.target) === targetKey(t)),
    );
    if (missingRequests.length > 0) return { kind: "request", ev, targets: missingRequests };
  }
  return pause(
    step.id,
    d.reasons.map((r) => ({
      code: r.route,
      subject: r.subject,
      detail: r.detail,
      requirements: r.requirements,
      request: requests.find((q) => targetKey(q.record.target) === r.subject)?.ref ?? null,
    })),
  );
}

/**
 * The next action of the checkpoint exit evaluation (T3.5 H1), due once every
 * step is accepted and the integrated acceptance left inherited targets
 * pending: an evaluation of the integrated candidate without production, or
 * its next phase, or done once it is accepted.
 */
function exitAction(ctx: Ctx, s: State, accepted: Map<string, Acceptance>): Action {
  const exit = exitStep(ctx.plan);
  // A correction of the exit's findings runs as the correcting step's attempt.
  const correcting = correctingStep(ctx);
  if (correcting && correctionUnderway(s, correcting, accepted)) {
    return stepAction(ctx, s, correcting, accepted);
  }
  if (exitAcceptance(ctx, s, accepted)) return { kind: "done" };
  const latest = integrated(accepted);
  if (!latest) throw new Error(`${exit.id}: no step of the selection is accepted`);
  const evaluations = s.evaluations.filter((e) => e.record.step === exit.id);
  const current = evaluations
    .filter((e) => sameSnapshot(e.record.candidate, latest.candidate))
    .at(-1);
  if (current) return evaluationAction(ctx, s, exit, accepted, current, null);
  const candidate = snapshotOf(latest.candidate);
  const blocked = readiness(ctx, s, exit, accepted, candidate);
  if (blocked.length > 0) return pause(exit.id, blocked);
  const checkpoint = checkpointEvidence(ctx, s, accepted);
  const manifest = manifestOf(
    ctx,
    exit,
    accepted,
    candidate,
    acceptedBefore(s, Number.POSITIVE_INFINITY),
    checkpoint,
  );
  if (!manifest || !checkpoint) throw new Error(`${exit.id}: a step has no current acceptance`);
  const attempt = Math.max(0, ...evaluations.map((e) => e.record.attempt)) + 1;
  return {
    kind: "evaluate",
    record: { step: exit.id, attempt, candidate: latest.candidate, claims: [], manifest },
    checkpoint,
  };
}

/** Whether the correcting step has an attempt after its current acceptance. */
function correctionUnderway(
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
): boolean {
  const acceptance = accepted.get(step.id);
  const latest = s.starts
    .filter((f) => f.record.phase === "produce" && f.record.step === step.id)
    .at(-1)?.record.attempt;
  return acceptance !== undefined && latest !== undefined && latest > acceptance.decision.attempt;
}

/**
 * Routes the exit evaluation's findings to the correcting step (Spec 00 §4;
 * T3 plan §7): its next attempt, within its attempt budget, starts from the
 * integrated candidate with those findings, and its acceptance moves the
 * integrated candidate, which the exit then evaluates again. Earlier records
 * stay as history. Without a contract step to correct it, the exit pauses.
 */
function correctExit(
  ctx: Ctx,
  s: State,
  accepted: Map<string, Acceptance>,
  findings: Finding[],
): Action {
  const exit = exitId(ctx.plan);
  const step = correctingStep(ctx);
  const acceptance = step ? accepted.get(step.id) : undefined;
  if (!step || !acceptance) {
    return pause(exit, [
      reason("owner", exit, "no contract step can correct the exit evaluation's findings"),
    ]);
  }
  const attempt =
    Math.max(
      0,
      ...s.starts
        .filter((f) => f.record.phase === "produce" && f.record.step === step.id)
        .map((f) => f.record.attempt),
    ) + 1;
  return newAttempt(ctx, s, step, accepted, attempt, acceptance.candidate, findings);
}

/** The next action for a dispatchable step, from its attempts' facts. */
function stepAction(
  ctx: Ctx,
  s: State,
  step: ContractStep,
  accepted: Map<string, Acceptance>,
): Action {
  const starts = s.starts.filter((f) => f.record.phase === "produce" && f.record.step === step.id);
  const latest = starts.at(-1)?.record;
  const base = stepBase(ctx, step, accepted);
  if (!latest?.production) return newAttempt(ctx, s, step, accepted, 1, base, []);
  const { attempt, production } = latest;
  // An earlier step accepted again moves the base: start over from it.
  if (!sameSnapshot(production.base, base)) {
    return newAttempt(ctx, s, step, accepted, attempt + 1, base, []);
  }
  // A correction round routed here, or to an earlier step, starts a new attempt (T3.5 H3).
  const round = routing(ctx, s, step);
  if (round?.record.correction && (starts.at(-1)?.seq ?? 0) < round.seq) {
    const { correction } = round.record;
    if (correction.step !== step.id) {
      return newAttempt(ctx, s, step, accepted, attempt + 1, base, []);
    }
    const claims = s.evaluations.filter((e) => e.record.step === step.id).at(-1)?.record.claims;
    return newAttempt(
      ctx,
      s,
      step,
      accepted,
      attempt + 1,
      correction.from,
      correction.findings,
      correction.adopt ? { claims: claims ?? [] } : undefined,
    );
  }
  const mine = <T extends { step: string; attempt: number }>(f: Fact<T>): boolean =>
    f.record.step === step.id && f.record.attempt === attempt;
  const evaluation = s.evaluations.filter(mine).at(-1);
  if (evaluation) return evaluationAction(ctx, s, step, accepted, evaluation, production);
  const rejected = s.rejections.filter(mine).at(-1);
  if (rejected) {
    // The rejected work is discarded: start where it started, with its findings too.
    return newAttempt(
      ctx,
      s,
      step,
      accepted,
      attempt + 1,
      production.from,
      carry(production.findings, sealFindings(rejected.record.diagnostics)),
    );
  }
  const produced = s.producers
    .filter((p) => p.data.step === step.id && p.attempt === attempt)
    .at(-1);
  const outcome = amendedSince(s, produced?.seq ?? 0) ? undefined : produced?.record;
  if (outcome?.outcome === "blocked") {
    return pause(
      step.id,
      outcome.blockers.map((b) => reason("producer-blocked", step.id, b)),
    );
  }
  if (outcome?.outcome === "exhausted") {
    return pause(step.id, [
      reason("exhausted", step.id, `the producer exhausted its ${outcome.limit} limit`),
    ]);
  }
  // Interrupted, failed, cancelled, submitted without a sealed candidate, or
  // stopped by a limit or blocker that a later amendment addressed.
  return { kind: "produce", step, attempt, production };
}

/** A run's name: its hosted run name, else its own identifier. */
const runName = (ctx: Pick<Ctx, "hosted" | "run">): string => ctx.hosted?.name ?? ctx.run.run;

/**
 * The pull request a run publishes to (T3.5 H3), from its publication
 * receipts alone: the repository, base and head branches, the last commit
 * pushed and the candidate it holds, and the pull request once opened.
 */
export type Association = {
  repository: string;
  base: string;
  branch: string;
  /**
   * The branch head the next push builds on, and the candidate snapshot it
   * holds: the last commit pushed, or newer pull-request commits a round
   * adopted since, with the event that adopted them.
   */
  head: { commit: string; tree: string; candidate: string; adopted?: number } | null;
  pull: { number: number; url: string } | null;
};

/** Each receipt with the request its intent recorded. */
function receipted(s: State): { seq: number; request: EffectRequest; receipt: Receipt }[] {
  return s.receipts.flatMap((r) => {
    const intent = s.intents.find((i) => i.record.key === r.record.key);
    return intent
      ? [{ seq: r.seq, request: intent.record.request, receipt: r.record.receipt }]
      : [];
  });
}

export function association(
  run: { config: RunnerConfig; name: string },
  s: State,
): Association | null {
  const pr = run.config.publication?.pull_request;
  if (!pr) return null;
  const done = receipted(s);
  const push = done.filter((d) => d.request.action === "push-branch").at(-1);
  const opened = done.filter((d) => d.request.action === "open-pr").at(-1);
  const commit = push?.receipt.details?.commit;
  const tree = push?.request.payload?.tree;
  const number = opened?.receipt.details?.number;
  const url = opened?.receipt.details?.url;
  // Newer pull-request commits a round adopted are the head the next push builds on.
  const adopted = s.feedback
    .filter((f) => f.record.head.adopted && f.seq > (push?.seq ?? 0))
    .at(-1);
  const adoptedHead = adopted?.record.head.adopted;
  return {
    repository: run.config.repository.name,
    base: pr.base ?? run.config.repository.branch,
    branch: `harness/${run.name}`,
    head:
      adopted && adoptedHead
        ? {
            commit: adopted.record.head.commit,
            tree: adoptedHead.tree,
            candidate: adoptedHead.commit,
            adopted: adopted.seq,
          }
        : push && typeof commit === "string" && typeof tree === "string"
          ? { commit, tree, candidate: push.request.candidate }
          : null,
    pull: typeof number === "number" && typeof url === "string" ? { number, url } : null,
  };
}

const HARNESS_AUTHOR = "Pactwright harness <harness@pactwright.invalid>";

/** The commit object a publication pushes; its SHA is fixed before the effect runs. */
export function publicationCommit(input: {
  tree: string;
  parent: string;
  time: number;
  message: string;
}): { text: string; sha: string } {
  const text = [
    `tree ${input.tree}`,
    `parent ${input.parent}`,
    `author ${HARNESS_AUTHOR} ${input.time} +0000`,
    `committer ${HARNESS_AUTHOR} ${input.time} +0000`,
    "",
    input.message,
  ].join("\n");
  const sha = execFileSync("git", ["hash-object", "-t", "commit", "--stdin"], {
    input: text,
    encoding: "utf8",
  }).trim();
  return { text, sha };
}

/**
 * The next publication effect of the accepted selection (T3.5 H3), or null
 * once it is published: push the integrated candidate to the run's branch as
 * a commit on the last published head (the repository head for the first),
 * then open the pull request. The push's commit is fixed before its intent,
 * so a repeated or reconciled push is the same commit.
 */
function publicationAction(ctx: Ctx, s: State, accepted: Map<string, Acceptance>): Action | null {
  const pr = ctx.config.publication?.pull_request;
  const latest = integrated(accepted);
  const charged = correctingStep(ctx);
  const assoc = association({ config: ctx.config, name: runName(ctx) }, s);
  if (!pr || !latest || !charged || !assoc) return null;
  const binding = { id: "publication", digest: sha256(stringify(pr)) };
  const common = {
    run: ctx.run.run,
    step: charged.id,
    binding,
    candidate: latest.candidate.commit,
    outputs: latest.decision.outputs,
  };
  // After adopting newer commits, only a candidate accepted since, built on
  // them, is published: an older one would undo them.
  if (assoc.head?.adopted !== undefined && latest.seq < assoc.head.adopted) return null;
  if (assoc.head?.candidate !== latest.candidate.commit) {
    const parent = assoc.head?.commit ?? ctx.plan.repository.expected_head;
    const parentTree = assoc.head?.tree ?? ctx.base.tree;
    const time = Math.floor(
      Date.parse(s.events.find((e) => e.seq === latest.seq)?.time ?? "") / 1000,
    );
    const message = [
      `harness: ${latest.step} of ${ctx.plan.checkpoint}`,
      "",
      `Run: ${runName(ctx)} (${ctx.run.run})`,
      `Acceptance: ${latest.ref}`,
      `Evaluation: ${latest.evaluation}`,
      "",
    ].join("\n");
    const commit =
      parentTree === latest.candidate.tree
        ? parent
        : publicationCommit({ tree: latest.candidate.tree, parent, time, message }).sha;
    const request: EffectRequest = {
      ...common,
      action: "push-branch",
      target: `${assoc.repository}:${assoc.branch}`,
      payload: {
        repository: assoc.repository,
        branch: assoc.branch,
        tree: latest.candidate.tree,
        parent,
        time,
        message,
        commit,
      },
    };
    return effectFor(ctx, s, request, "publication", null);
  }
  // Pushes by the workflow token start no workflow: the next review of each
  // published head is dispatched explicitly, once per head.
  const review = ctx.config.publication?.review;
  const head = assoc.head;
  if (assoc.pull !== null && review && head && head.adopted === undefined) {
    const request: EffectRequest = {
      ...common,
      action: "review-dispatch",
      target: `${assoc.repository}/${review.workflow}@${assoc.branch}`,
      payload: {
        repository: assoc.repository,
        workflow: review.workflow,
        ref: assoc.branch,
        commit: head.commit,
        pull: assoc.pull.number,
        inputs: review.inputs ?? {},
      },
    };
    const dispatched = receipted(s).some(
      (d) => d.request.action === "review-dispatch" && d.request.payload?.commit === head.commit,
    );
    if (!dispatched) return effectFor(ctx, s, request, "publication", null);
  }
  if (assoc.pull === null) {
    const request: EffectRequest = {
      ...common,
      action: "open-pr",
      target: `${assoc.repository}#${assoc.branch}`,
      payload: {
        repository: assoc.repository,
        head: assoc.branch,
        base: assoc.base,
        title: pr.title,
        draft: pr.draft,
        body: [
          `Published by the checkpoint harness from run \`${runName(ctx)}\` (${ctx.run.run}).`,
          "",
          `Checkpoint ${ctx.plan.checkpoint}, selection through ${ctx.plan.selection.through}. A commit or reply here is not acceptance; the harness accepts a step only on its own evidence.`,
          "",
          `<!-- pactwright-harness run=${runName(ctx)} -->`,
        ].join("\n"),
      },
    };
    return effectFor(ctx, s, request, "publication", null);
  }
  return null;
}

/** Paths feedback can never change: definitions, protected and verifier paths, the workflow. */
function feedbackForbids(
  ctx: Ctx,
  s: State,
  accepted: Map<string, Acceptance>,
): (path: string) => boolean {
  const final = correctingStep(ctx);
  const policy = final ? policyFor(ctx, s, final, accepted) : EXIT_POLICY;
  const latest = integrated(accepted);
  const tree = latest ? treeEntries(ctx.run.dir, latest.candidate.tree) : new Map<string, string>();
  // Authority no feedback changes: the definitions, configured protection,
  // admitted verifiers, the workflow and binding declarations. An earlier
  // step's accepted output is protected from the final step only because
  // that step owns it; a finding on it routes there (`routeCorrection`).
  const verifiers = final
    ? protectedVerifierPaths(
        ctx.declared(stepBase(ctx, final, accepted)).registry,
        s.admissions,
        final.id,
      )
    : [];
  const fixed = [
    ...ctx.plan.sources.map((x) => x.path),
    ...ctx.config.permissions.protected,
    ...verifiers,
    ".github",
    ...(ctx.config.verification?.bindings === undefined ? [] : [ctx.config.verification.bindings]),
  ];
  const owned = new Set(
    [...accepted.values()].flatMap((a) =>
      a.decision.outputs.flatMap((o) => o.paths.map((p) => p.path)),
    ),
  );
  return (path) =>
    within(path, fixed) || (tree.has(path) && !within(path, policy.writable) && !owned.has(path));
}

/**
 * Where a round's correction runs (T3.5 H3): actionable findings, or newer
 * commits, go to the final step's next attempt from the pull request's
 * current head. A finding on a path only an earlier step may change goes to
 * that step, from its own accepted candidate; with adopted commits, which it
 * would lose, the finding stays blocked instead.
 */
function routeCorrection(
  ctx: Ctx,
  s: State,
  accepted: Map<string, Acceptance>,
  dispositions: Assessment["dispositions"],
  adopted: SourceSnapshot | null,
): { correction: Assessment["correction"]; dispositions: Assessment["dispositions"] } {
  const final = correctingStep(ctx);
  const latest = integrated(accepted);
  const actionable = dispositions.filter((d) => d.disposition === "actionable" && d.finding);
  if (!final || !latest || (actionable.length === 0 && adopted === null)) {
    return { correction: null, dispositions };
  }
  const protectedForFinal = policyFor(ctx, s, final, accepted).protected;
  const pathOf = (d: (typeof dispositions)[number]): string =>
    (d.finding?.location.split(":")[0] ?? "").trim();
  const owners = actionable.flatMap((d) => {
    const path = pathOf(d);
    if (!within(path, protectedForFinal)) return [];
    const owner = ctx.plan.steps.find((p) =>
      accepted.get(p.id)?.decision.outputs.some((o) => o.paths.some((q) => q.path === path)),
    );
    return owner ? [{ item: d.item, owner }] : [];
  });
  if (owners.length > 0 && adopted !== null) {
    const blocked = new Set(owners.map((o) => o.item));
    const kept = dispositions.map((d) =>
      blocked.has(d.item)
        ? {
            ...d,
            disposition: "blocked" as const,
            reason: `${d.reason}; it belongs to an earlier step, and newer commits on the pull request would be lost by correcting it there`,
            finding: null,
          }
        : d,
    );
    return routeCorrection(ctx, s, accepted, kept, adopted);
  }
  const findings = actionable.flatMap((d) => (d.finding ? [d.finding] : []));
  const earliest = owners
    .map((o) => o.owner)
    .sort((a, b) => ctx.plan.steps.indexOf(a) - ctx.plan.steps.indexOf(b))[0];
  if (earliest) {
    const own = accepted.get(earliest.id);
    return {
      correction: own
        ? { step: earliest.id, from: snapshotOf(own.candidate), findings, adopt: false }
        : null,
      dispositions,
    };
  }
  return {
    correction: {
      step: final.id,
      from: adopted ?? snapshotOf(latest.candidate),
      findings,
      adopt: findings.length === 0,
    },
    dispositions,
  };
}

/**
 * The next action of the latest pull-request correction round (T3.5 H3), once
 * the selection is accepted and published: assess its feedback, then — after
 * any correction was accepted and published — reply to each item and record
 * the round. Null when there is no open round.
 */
function roundAction(ctx: Ctx, s: State, accepted: Map<string, Acceptance>): Action | null {
  const snapshot = s.feedback.at(-1);
  if (!snapshot || s.rounds.some((r) => r.record.feedback === snapshot.ref)) return null;
  const final = correctingStep(ctx);
  const latest = integrated(accepted);
  const assoc = association({ config: ctx.config, name: runName(ctx) }, s);
  if (!final || !latest || !assoc?.pull) return null;
  const assessment = s.assessments.find((a) => a.record.feedback === snapshot.ref);
  if (!assessment) {
    return { kind: "assess", snapshot, step: final.id, attempt: latest.decision.attempt };
  }
  const corrected = assessment.record.correction
    ? accepted.get(assessment.record.correction.step)
    : undefined;
  const fix =
    corrected && assoc.head
      ? {
          commit: assoc.head.commit,
          checks: `${corrected.decision.targets.length} verification targets passed and the independent review passed for ${corrected.step}, evaluation ${corrected.evaluation}`,
        }
      : null;
  const binding = {
    id: "publication",
    digest: sha256(stringify(ctx.config.publication?.pull_request) ?? ""),
  };
  const replies: string[] = [];
  for (const item of snapshot.record.items) {
    const disposition = assessment.record.dispositions.find((d) => d.item === item.id);
    if (!disposition) continue;
    const request: EffectRequest = {
      run: ctx.run.run,
      step: final.id,
      binding,
      action: "pr-reply",
      target: `${assoc.repository}#${assoc.pull.number}/${item.id}`,
      candidate: latest.candidate.commit,
      outputs: [],
      payload: {
        pull: assoc.pull.number,
        thread: item.thread,
        round: snapshot.record.round,
        item: item.id,
        body: replyBody(item, disposition, fix),
      },
    };
    const next = effectFor(ctx, s, request, item.id, null);
    if (next) return next;
    replies.push(effectKey(request));
  }
  return { kind: "round", snapshot, assessment, replies };
}

function nextAction(ctx: Ctx, s: State): Action {
  const accepted = acceptances(ctx, s);
  // An accepted step's approved effects complete before any later step.
  for (const a of [...accepted.values()].sort((x, y) => x.seq - y.seq)) {
    const effect = effectAction(ctx, s, a);
    if (effect) return effect;
  }
  const next = nextEligible(ctx.plan, {
    outputs: acceptedOutputs(accepted),
    capabilities: [],
    steps: [...accepted.values()],
  });
  switch (next.kind) {
    case "selection-accepted": {
      // The exit applies what the integrated acceptance left pending.
      const latest = integrated(accepted);
      const due =
        coversCheckpoint(ctx.plan) && latest !== undefined && pendingOf(s, latest).length > 0;
      const exit = due ? exitAction(ctx, s, accepted) : null;
      if (exit && exit.kind !== "done") return exit;
      // Then the accepted selection is published for review, and a pull
      // request's correction round is assessed and answered (T3.5 H3).
      return (
        publicationAction(ctx, s, accepted) ?? roundAction(ctx, s, accepted) ?? { kind: "done" }
      );
    }
    case "blocked":
      return pause(
        next.step,
        next.unmet.map((u) => reason("unmet-dependency", next.step, u)),
      );
    case "dispatch":
      return stepAction(ctx, s, contractStep(ctx.plan, next.step), accepted);
  }
}

/** The phase key an action repeats, if it runs a phase. */
function phaseOf(
  action: Action,
): { phase: Phase; step: string; attempt: number; key: string } | null {
  switch (action.kind) {
    case "produce":
      return {
        phase: "produce",
        step: action.step.id,
        attempt: action.attempt,
        key: `produce/${action.step.id}/${action.attempt}`,
      };
    case "admit":
    case "verify":
    case "review": {
      const { step, attempt, evaluation } = action.ev;
      const suffix = action.kind === "admit" ? `/${action.binding}` : "";
      return {
        phase: action.kind,
        step: step.id,
        attempt,
        key: `${action.kind}/${step.id}/${evaluation}${suffix}`,
      };
    }
    case "assess":
      return {
        phase: "assess",
        step: action.step,
        attempt: action.attempt,
        key: `assess/${action.snapshot.record.round}/${action.snapshot.ref}`,
      };
    default:
      return null;
  }
}

/**
 * Whether an operator amended the configuration after event `seq`, other than
 * only extending the selection, which addresses no stopped producer or reviewer.
 */
const amendedSince = (s: State, seq: number): boolean =>
  s.amendments.some(
    (a) => a.seq > seq && !a.record.changes.every((c) => c.path.startsWith("/selection/")),
  );

/** Repeated executions of the step's phases and effects: the protocol retries used. */
function retriesUsed(s: State, step: string): number {
  const counts = new Map<string, number>();
  const count = (key: string): void => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const f of s.starts) if (f.record.step === step) count(f.record.key);
  for (const f of s.intents) if (f.record.request.step === step) count(`effect/${f.record.key}`);
  return [...counts.values()].reduce((n, c) => n + c - 1, 0);
}

function retryLimit(ctx: Ctx, s: State, step: string, what: string): Stop | null {
  const limit = ctx.config.budgets.retries;
  return retriesUsed(s, step) >= limit
    ? pause(step, [
        reason(
          "retries",
          what,
          `${what} needs another run and the ${limit} protocol retries of ${step} are used`,
        ),
      ])
    : null;
}

/**
 * A phase that already started counts as a retry, within the step's budget;
 * an agent phase also needs room under the run's spend limit.
 */
function gate(ctx: Ctx, s: State, action: Action): Action {
  const phase = phaseOf(action);
  const retried = phase && s.starts.some((f) => f.record.key === phase.key);
  return (
    (retried ? retryLimit(ctx, s, phase.step, phase.key) : null) ??
    spendLimit(ctx, s, action) ??
    action
  );
}

/** What an action needs of the job (T3.5 H3). */
function needs(action: Action): (keyof Capabilities)[] {
  switch (action.kind) {
    case "produce":
    case "admit":
      return ["agents", "candidates"];
    case "review":
    case "assess":
      return ["agents"];
    case "verify":
      return ["candidates"];
    case "effect":
      return ["effects"];
    default:
      return [];
  }
}

/** A hand-off when this job lacks what the action needs: effects go to the effects job. */
function handOff(ctx: Ctx, action: Action): Stop | null {
  const capabilities = ctx.deps.capabilities ?? ALL;
  const missing = needs(action).filter((n) => !capabilities[n]);
  if (missing.length === 0) return null;
  const job = missing.includes("effects") ? "effects" : "controller";
  return pause(null, [
    reason(
      "hand-off",
      job,
      `the next action, ${action.kind}, needs ${missing.join(" and ")}; the ${job} job continues the run`,
    ),
  ]);
}

function reviewerAccess(ctx: Ctx): ReviewerAccess {
  const provider = ctx.deps.providers?.reviewer;
  return {
    role: ctx.roles.reviewer,
    open: ctx.workspaces.reviewer,
    signal: ctx.deps.signal,
    ...(provider ? { provider } : {}),
  };
}

/** The phases that dispatch an agent session and reserve its allowance. */
const AGENT_PHASES: ReadonlySet<Phase> = new Set(["produce", "admit", "review", "assess"]);

/** The invocation allowance a phase reserves: the per-invocation spend limit. An adoption runs no agent. */
const allowanceOf = (ctx: Ctx, phase: Phase, production: Production | null): number | null =>
  AGENT_PHASES.has(phase) && !production?.adopt
    ? ctx.config.budgets.provider_spend_limit.usd
    : null;

/**
 * Journals a phase start, reserving an agent phase's allowance, and saves the
 * run before the phase's agent or command runs (T3.5 H3).
 */
async function start(ctx: Ctx, action: Action, production: Production | null): Promise<void> {
  const phase = phaseOf(action);
  if (!phase) throw new Error(`${action.kind} is not a phase`);
  const evaluation = "ev" in action ? action.ev.evaluation : undefined;
  const allowance = allowanceOf(ctx, phase.phase, production);
  journal(
    ctx.run,
    "start",
    { ...phase, production, allowance } satisfies Start,
    { attempt: phase.attempt, ...(evaluation === undefined ? {} : { evaluation }) },
    { phase: phase.phase, step: phase.step, ...(allowance === null ? {} : { allowance }) },
  );
  await ctx.deps.save?.(ctx.run, "start");
}

/** The journal actions that record an agent phase's result. */
const RESULTS: ReadonlySet<string> = new Set([
  "agent-invocation",
  "review",
  "verifier-admission",
  "pr-assessment",
]);

/**
 * The run's provider spending (T3.5 H3): the cost each recorded session
 * reports, the sessions whose cost is unknown, and the allowance of each agent
 * phase that started without a recorded result before the next start — a
 * session in progress or lost with its runner. Nothing here resets.
 */
export function spending(s: State): {
  reported: number;
  unknown: number;
  reserved: number;
  unresolved: { seq: number; key: string; allowance: number }[];
} {
  const starts = new Map(s.starts.map((f) => [f.seq, f.record]));
  const unresolved: { seq: number; key: string; allowance: number }[] = [];
  let open: { seq: number; key: string; allowance: number } | null = null;
  for (const e of s.events) {
    if (e.action === "start") {
      if (open) unresolved.push(open);
      const record = starts.get(e.seq);
      open =
        record?.allowance != null
          ? { seq: e.seq, key: record.key, allowance: record.allowance }
          : null;
    } else if (open && RESULTS.has(e.action)) open = null;
  }
  if (open) unresolved.push(open);
  const costs = [
    ...s.producers.map((f) => f.record.observation.usage.costUsd),
    ...s.reviews.map((f) => f.record.outcome.observation.usage.costUsd),
  ];
  return {
    reported: costs.reduce<number>((n, c) => (typeof c === "number" ? n + c : n), 0),
    unknown: costs.filter((c) => c === "unknown").length,
    reserved: unresolved.reduce((n, u) => n + u.allowance, 0),
    unresolved,
  };
}

/**
 * The run spend limit (T3.5 H3): an agent phase that could take spending past
 * `budgets.run_spend_usd` pauses. Reported costs, sessions of unknown cost and
 * unresolved reservations all count, each unknown one at a full allowance.
 */
function spendLimit(ctx: Ctx, s: State, action: Action): Stop | null {
  const limit = ctx.config.budgets.run_spend_usd;
  const phase = phaseOf(action);
  const adopting = action.kind === "produce" && action.production.adopt !== undefined;
  if (limit === undefined || !phase || !AGENT_PHASES.has(phase.phase) || adopting) return null;
  const allowance = ctx.config.budgets.provider_spend_limit.usd;
  const spent = spending(s);
  const committed = spent.reported + spent.reserved + spent.unknown * allowance;
  return committed + allowance > limit
    ? pause(phase.step, [
        reason(
          "exhausted",
          phase.step,
          `the run's ${limit} USD spend limit cannot cover another session: ${committed.toFixed(2)} USD reported or reserved, ${allowance} USD more needed`,
        ),
      ])
    : null;
}

async function produce(
  ctx: Ctx,
  s: State,
  action: Extract<Action, { kind: "produce" }>,
): Promise<Stop | undefined> {
  const { run, plan, roles, deps } = ctx;
  const { step, attempt, production } = action;
  const accepted = acceptances(ctx, s);
  if (production.adopt) {
    // Newer pull-request commits, sealed as they are; verification and review follow.
    await start(ctx, action, production);
    const captured = await sealSnapshot(run, production.from, {
      base: production.base,
      policy: production.policy,
    });
    if (!captured.ok) {
      journal(
        run,
        "seal-rejected",
        { step: step.id, attempt, diagnostics: captured.diagnostics },
        { attempt },
        { step: step.id },
      );
      return undefined;
    }
    const manifest = manifestOf(
      ctx,
      step,
      accepted,
      captured.candidate,
      acceptedBefore(s, Number.POSITIVE_INFINITY),
    );
    if (!manifest) throw new Error(`${step.id}: an input has no current acceptance`);
    const record: EvaluationRecord = {
      step: step.id,
      attempt,
      candidate: captured.candidate,
      claims: production.adopt.claims,
      manifest,
    };
    journal(
      run,
      "evaluation",
      record,
      { attempt, evaluation: evaluationDigest(manifest) },
      { step: step.id, adopted: true },
    );
    return undefined;
  }
  const bindings = ctx.config.verification?.bindings;
  const built = buildPacket(plan, step.id, roles.producer, {
    attempt,
    accepted: acceptedOutputs(accepted),
    policy: production.policy,
    findings: production.findings,
    ...(bindings === undefined ? {} : { bindings }),
  });
  if (!built.ok)
    return pause(
      step.id,
      built.diagnostics.map((d) => reason("owner", step.id, d)),
    );
  await start(ctx, action, production);
  const ws = await ctx.workspaces.producer(
    production.from,
    mounted(ctx, production.policy, production.from),
  );
  try {
    const provider = deps.providers?.producer;
    const outcome = await invokeAgent(roles.producer, built.packet, ws, deps.signal, {
      ...(provider ? { provider } : {}),
      evidence: (bytes) => putEvidence(run, bytes),
    });
    recordInvocation(run, outcome, { step: step.id });
    if (outcome.outcome !== "submitted") return undefined;
    const captured = await ws.seal({ base: production.base, policy: production.policy });
    if (!captured.ok) {
      journal(
        run,
        "seal-rejected",
        { step: step.id, attempt, diagnostics: captured.diagnostics },
        { attempt },
        { step: step.id },
      );
      return undefined;
    }
    const manifest = manifestOf(
      ctx,
      step,
      accepted,
      captured.candidate,
      acceptedBefore(s, Number.POSITIVE_INFINITY),
    );
    if (!manifest) throw new Error(`${step.id}: an input has no current acceptance`);
    const record: EvaluationRecord = {
      step: step.id,
      attempt,
      candidate: captured.candidate,
      claims: outcome.submission.outputs,
      manifest,
    };
    journal(
      run,
      "evaluation",
      record,
      { attempt, evaluation: evaluationDigest(record.manifest) },
      { step: step.id },
    );
    return undefined;
  } finally {
    await ws.close();
  }
}

async function effect(
  ctx: Ctx,
  s: State,
  action: Extract<Action, { kind: "effect" }>,
): Promise<Stop | undefined> {
  const service = ctx.deps.effects;
  if (!service) throw new Error("no effect service");
  const { step, key, request } = action;
  const receipt = (found: Receipt, reconciled: boolean): Stop | undefined => {
    if (found.key !== key || found.target !== request.target) {
      journal(ctx.run, "effect-invalid", { key, receipt: found }, {}, { step, key });
      return pause(step, [
        reason(
          "effect-invalid",
          key,
          `the receipt names ${found.key} at ${found.target}, not ${key} at ${request.target}`,
        ),
      ]);
    }
    journal(ctx.run, "effect-receipt", { key, receipt: found, reconciled }, {}, { step, key });
    return undefined;
  };
  const refusedPause = (why: string): Stop =>
    pause(step, [
      reason(
        "effect-refused",
        key,
        `${request.action} on ${request.target} was refused: ${why}; the harness will not repeat it`,
      ),
    ]);
  if (action.uncertain || action.refused) {
    if (!service.inspect) throw new Error("an uncertain effect needs inspection");
    const found = await service.inspect(key, request);
    if (found) return receipt(found, true);
    if (action.refused) {
      const latest = s.refusals.filter((r) => r.record.key === key).at(-1);
      return refusedPause(latest?.record.reason ?? "refused");
    }
    // Read back as absent: the effect may run again, as a retry.
    const limited = retryLimit(ctx, s, step, `effect ${key}`);
    if (limited) return limited;
  }
  journal(ctx.run, "effect-intent", { key, request } satisfies Intent, {}, { step, key });
  await ctx.deps.save?.(ctx.run, "effect");
  let executed: Receipt | null;
  try {
    executed = await service.execute(key, request);
  } catch (e) {
    if (e instanceof EffectBlocked) {
      // Not performed: the journaled intent makes the next pass read the target
      // back and, finding nothing, retry it within the retry limit.
      return pause(step, [
        reason(
          "effect-blocked",
          key,
          `${request.action} on ${request.target} was not performed: ${e.message}; fix the cause, then continue`,
        ),
      ]);
    }
    if (!(e instanceof EffectRefused)) throw e;
    journal(
      ctx.run,
      "effect-refused",
      { key, reason: e.message } satisfies RefusalRecord,
      {},
      { step, key },
    );
    return refusedPause(e.message);
  }
  // No response: the next pass reads the target back before anything else.
  return executed ? receipt(executed, false) : undefined;
}

async function perform(ctx: Ctx, s: State, action: Action): Promise<Stop | undefined> {
  const { run, plan } = ctx;
  switch (action.kind) {
    case "done":
    case "pause":
      return action;
    case "produce":
      return produce(ctx, s, action);
    case "evaluate": {
      // The exit's checkpoint evidence is stored and journaled with its evaluation.
      const checkpoint = action.checkpoint ? putEvidence(run, stringify(action.checkpoint)) : null;
      if (checkpoint !== action.record.manifest.checkpoint) {
        throw new Error(`${action.record.step}: the evaluation names other checkpoint evidence`);
      }
      journal(
        run,
        "evaluation",
        action.record,
        { attempt: action.record.attempt, evaluation: evaluationDigest(action.record.manifest) },
        { step: action.record.step },
        checkpoint === null ? [] : [checkpoint],
      );
      return undefined;
    }
    case "admit": {
      const { ev } = action;
      await start(ctx, action, null);
      await admitVerifier(run, {
        plan,
        step: ev.step.id,
        registry: ctx.declared(ev.record.candidate).registry,
        binding: action.binding,
        candidate: ev.record.candidate,
        attempt: ev.attempt,
        manifest: ev.record.manifest,
        accepted: acceptedOutputs(acceptances(ctx, s)),
        open: ctx.workspaces.verifier,
        reviewer: reviewerAccess(ctx),
        prepare: ctx.prepare,
        checkpoint: given(ctx, ev) ?? undefined,
      });
      return undefined;
    }
    case "verify": {
      const { ev } = action;
      await start(ctx, action, null);
      await verifyCandidate(run, {
        plan,
        step: ev.step.id,
        registry: ctx.declared(ev.record.candidate).registry,
        candidate: ev.record.candidate,
        attempt: ev.attempt,
        manifest: ev.record.manifest,
        admissions: s.admissions,
        open: ctx.workspaces.verifier,
        bindings: action.bindings,
        prepare: ctx.prepare,
        checkpoint: given(ctx, ev) ?? undefined,
      });
      return undefined;
    }
    case "review": {
      const { ev } = action;
      await start(ctx, action, null);
      await reviewCandidate(run, {
        plan,
        step: ev.step.id,
        registry: ctx.declared(ev.record.candidate).registry,
        candidate: ev.record.candidate,
        attempt: ev.attempt,
        manifest: ev.record.manifest,
        accepted: acceptedOutputs(acceptances(ctx, s)),
        claims: ev.record.claims,
        reviewer: reviewerAccess(ctx),
        checkpoint: given(ctx, ev) ?? undefined,
      });
      return undefined;
    }
    case "decide": {
      const { ev } = action;
      const declared = ctx.declared(ev.record.candidate);
      recordDecision(run, {
        plan,
        step: ev.step.id,
        run: run.run,
        attempt: ev.attempt,
        manifest: ev.record.manifest,
        registry: declared.registry,
        policy: ev.policy,
        claims: ev.record.claims,
        declarations: {
          dir: ctx.config.verification?.bindings ?? null,
          rejected: declared.rejected,
        },
      });
      return undefined;
    }
    case "request": {
      const { ev } = action;
      const tree = treeEntries(run.dir, ev.record.candidate.tree);
      const { proofs } = inventory(ev.step, ev.record.claims, tree);
      const { registry } = ctx.declared(ev.record.candidate);
      for (const target of action.targets) {
        const binding = registry.get(target.binding)?.binding;
        if (binding?.method !== "approval") throw new Error(`${target.binding}: not an approval`);
        const digest = ev.record.manifest.verifiers[binding.id] ?? "";
        const request: ApprovalRequest = {
          run: run.run,
          step: ev.step.id,
          attempt: ev.attempt,
          evaluation: ev.evaluation,
          candidate: ev.record.candidate.commit,
          target,
          binding: { id: binding.id, digest },
          authority: binding.authority,
          subject: binding.subject,
          effect: binding.effect
            ? {
                run: run.run,
                step: ev.step.id,
                binding: { id: binding.id, digest },
                action: binding.effect.action,
                target: binding.effect.target,
                candidate: ev.record.candidate.commit,
                outputs: proofs,
              }
            : null,
        };
        journal(
          run,
          "approval-request",
          request,
          { attempt: ev.attempt, evaluation: ev.evaluation },
          { step: ev.step.id, target: targetKey(target) },
        );
      }
      return undefined;
    }
    case "effect":
      return effect(ctx, s, action);
    case "assess":
      return assess(ctx, s, action);
    case "round": {
      const assoc = association({ config: ctx.config, name: runName(ctx) }, s);
      const record: RoundRecord = {
        round: action.snapshot.record.round,
        feedback: action.snapshot.ref,
        assessment: action.assessment.ref,
        head: assoc?.head?.commit ?? null,
        replies: s.receipts.filter((r) => action.replies.includes(r.record.key)).map((r) => r.ref),
      };
      journal(run, "pr-round", record, {}, { round: record.round });
      return undefined;
    }
  }
}

/**
 * Assesses a round's feedback (T3.5 H3) with a fresh read-only reviewer on
 * the pull request's current head, maps the verdict to dispositions, routes
 * any correction and journals the assessment. An incomplete verdict records
 * only its review, so the assessment runs again within the retry budget.
 */
async function assess(
  ctx: Ctx,
  s: State,
  action: Extract<Action, { kind: "assess" }>,
): Promise<Stop | undefined> {
  const accepted = acceptances(ctx, s);
  const latest = integrated(accepted);
  if (!latest) throw new Error("a round is assessed only on an accepted selection");
  const { snapshot } = action;
  const adopted = snapshot.record.head.adopted;
  const candidate: SealedCandidate = adopted
    ? { ...adopted, base: null, changes: [] }
    : latest.candidate;
  const subjects = snapshot.record.items.map((i) => i.id);
  await start(ctx, action, null);
  const review = await assessFeedback(ctx.run, {
    plan: ctx.plan,
    identity: {
      run: ctx.run.run,
      attempt: latest.decision.attempt,
      evaluation: latest.evaluation,
      candidate: candidate.commit,
    },
    candidate,
    accepted: acceptedOutputs(accepted),
    feedback: {
      ref: snapshot.ref,
      pull: snapshot.record.pull,
      url: association({ config: ctx.config, name: runName(ctx) }, s)?.pull?.url ?? null,
      items: snapshot.record.items.map((i) => ({
        subject: i.id,
        kind: i.kind,
        author: i.author,
        path: i.path,
        line: i.line,
        body: i.body,
      })),
    },
    subjects,
    reviewer: reviewerAccess(ctx),
  });
  const checked = checkVerdict(review.record.outcome, { subjects, targets: [] });
  if (!checked.ok || checked.conflicts.length > 0) return undefined;
  const mapped = dispositionsOf(
    checked.verdict,
    snapshot.record.items,
    feedbackForbids(ctx, s, accepted),
  );
  if (!mapped.ok) return undefined;
  const routed = routeCorrection(ctx, s, accepted, mapped.dispositions, adopted);
  const record: Assessment = {
    round: snapshot.record.round,
    feedback: snapshot.ref,
    review: review.ref,
    dispositions: routed.dispositions,
    correction: routed.correction,
  };
  journal(ctx.run, "pr-assessment", record, {}, { round: record.round, step: action.step }, [
    review.ref,
  ]);
  return undefined;
}

async function finish(ctx: Ctx, s: State, stop: Stop): Promise<RunResult> {
  const accepted = acceptances(ctx, s);
  const steps = ctx.plan.steps.filter((x) => accepted.has(x.id)).map((x) => x.id);
  const common = {
    run: ctx.run.run,
    dir: ctx.run.dir,
    through: ctx.plan.selection.through,
    accepted: steps,
    checkpoint: checkpointStatus(ctx, s, accepted),
  };
  if (stop.kind === "done") {
    releaseRun(ctx.run);
    await ctx.deps.save?.(ctx.run, "stop");
    return { outcome: "selection-accepted", ...common };
  }
  // Audit only: resume derives everything from the facts, never from a pause.
  appendEvent(ctx.run, { action: "pause", data: { step: stop.step, reasons: stop.reasons } });
  releaseRun(ctx.run);
  await ctx.deps.save?.(ctx.run, "stop");
  return { outcome: "paused", ...common, step: stop.step, reasons: stop.reasons };
}

async function drive(ctx: Ctx): Promise<RunResult> {
  // Progress covers the events this controller journals, not earlier ones.
  let seen = committedEvents(ctx.run).length;
  let stop: Stop | undefined;
  // A job always makes progress before it yields, so a continuation never yields at once.
  let acted = false;
  for (;;) {
    const events = committedEvents(ctx.run);
    for (const e of events.slice(seen)) ctx.deps.progress?.(e);
    seen = events.length;
    const s = readState(ctx.run, events);
    const chosen: Action =
      stop ??
      (ctx.deps.signal.aborted
        ? pause(null, [
            reason("cancelled", "run", "the controller was cancelled; resume continues"),
          ])
        : gate(ctx, s, nextAction(ctx, s)));
    const next: Action =
      chosen.kind === "done" || chosen.kind === "pause"
        ? chosen
        : (handOff(ctx, chosen) ??
          (acted && ctx.deps.yieldAt !== undefined && Date.now() >= ctx.deps.yieldAt
            ? pause(null, [
                reason(
                  "yield",
                  "run",
                  "planned yield before the job's time limit; a continuation resumes the run within its selection",
                ),
              ])
            : chosen));
    if (next.kind === "done" || next.kind === "pause") return finish(ctx, s, next);
    stop = await perform(ctx, s, next);
    acted = true;
    await ctx.deps.save?.(ctx.run, "phase");
  }
}

type Admitted =
  | {
      ok: true;
      config: RunnerConfig;
      plan: PreparedRun;
      roles: { producer: AgentRole; reviewer: AgentRole };
    }
  | { ok: false; diagnostics: string[] };

/**
 * Admission of a configuration before any dispatch: the plan, the runner
 * sections, both roles with their credential and pinned skills, the write
 * policy and the repository head.
 */
/**
 * Admission of a configuration's content, without the repository head: the
 * plan, the runner sections, both roles with their pinned skills and the
 * paths. `run`, `resume` and `amend` add the head; the workflow's template
 * check uses this alone (T3.5 H3).
 */
export async function checkConfiguration(
  config: unknown,
  deps: Pick<RunnerDeps, "repoRoot" | "skillsRoot" | "env" | "applicability" | "requireCredential">,
  name: string,
): Promise<{ ok: true } | { ok: false; diagnostics: string[] }> {
  const admitted = await admit(config, deps, name, false);
  return admitted.ok ? { ok: true } : admitted;
}

async function admit(
  config: unknown,
  deps: Pick<RunnerDeps, "repoRoot" | "skillsRoot" | "env" | "applicability" | "requireCredential">,
  name: string,
  head = true,
): Promise<Admitted> {
  const prepared = await prepareRun(config, {
    repoRoot: deps.repoRoot,
    configName: name,
    ...(deps.applicability ? { applicability: deps.applicability } : {}),
  });
  if (!prepared.ok) return prepared;
  if (!validateRunner(config)) {
    return {
      ok: false,
      diagnostics: (validateRunner.errors ?? []).map(
        (e) => `${name}: runner: ${e.instancePath || "/"} ${e.message ?? ""}`,
      ),
    };
  }
  const diagnostics = new Set<string>();
  const roles: Partial<Record<RoleName, AgentRole>> = {};
  for (const role of ["producer", "reviewer"] as const) {
    const resolved = resolveRole(config, role, {
      skillsRoot: deps.skillsRoot,
      env: deps.env,
      requireCredential: deps.requireCredential ?? true,
    });
    if (resolved.ok) roles[role] = resolved.role;
    else for (const d of resolved.diagnostics) diagnostics.add(`${name}: ${d}`);
  }
  const { writable, scratch } = config.permissions;
  for (const path of [...writable, ...scratch, ...config.permissions.protected]) {
    const error = policyPathError(path);
    if (error) diagnostics.add(`${name}: permissions: ${error}`);
  }
  for (const [target, declared] of Object.entries(config.operations?.targets ?? {})) {
    for (const path of [
      ...declared.writable,
      ...(declared.path === undefined ? [] : [declared.path]),
    ]) {
      const error = policyPathError(path);
      if (error) diagnostics.add(`${name}: operations.targets.${target}: ${error}`);
    }
  }
  const { bindings, dependencies } = config.verification ?? {};
  for (const path of [
    ...(bindings === undefined ? [] : [bindings]),
    ...(dependencies?.inputs ?? []),
    ...(dependencies?.outputs ?? []),
  ]) {
    const error = policyPathError(path);
    if (error) diagnostics.add(`${name}: verification: ${error}`);
  }
  const { branch, expected_head } = config.repository;
  let at = "";
  try {
    if (head) {
      at = execFileSync(
        "git",
        ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}^{commit}`],
        { cwd: deps.repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim();
    }
  } catch {
    diagnostics.add(`${name}: repository.branch ${branch} does not exist in ${deps.repoRoot}`);
  }
  if (at !== "" && at !== expected_head) {
    diagnostics.add(`${name}: ${branch} is at ${at}, not the expected head ${expected_head}`);
  }
  const { producer, reviewer } = roles;
  if (diagnostics.size > 0 || !producer || !reviewer) {
    return { ok: false, diagnostics: [...diagnostics] };
  }
  return { ok: true, config, plan: prepared.plan, roles: { producer, reviewer } };
}

/**
 * The configuration an evaluation depends on. Budgets, workspace roots,
 * credentials, approvers and the selection bound how far, where and by whom
 * work proceeds, so amending them keeps accepted evaluations current.
 */
const evaluatedConfiguration = (config: RunnerConfig): object => ({
  repository: config.repository,
  checkpoint: config.checkpoint,
  definitions: config.definitions,
  roles: config.roles,
  permissions: {
    writable: config.permissions.writable,
    scratch: config.permissions.scratch,
    protected: config.permissions.protected,
  },
  verification: config.verification ?? null,
});

/** The binding ID → method every planned target, the exit's included, uses. */
const plannedBindings = (plan: PreparedRun): Map<string, VerificationTarget["method"]> =>
  new Map(
    [
      ...plan.inherited.targets,
      ...plan.steps.flatMap((step) => (step.kind === "contract" ? step.targets : [])),
    ].map((t) => [t.binding, t.method]),
  );

function context(
  run: RunHandle,
  admitted: Extract<Admitted, { ok: true }>,
  base: SourceSnapshot,
  deps: RunnerDeps,
  hosted: Hosted | null,
  targets: Readonly<Record<string, SourceSnapshot>>,
): Ctx {
  const { config, roles } = admitted;
  const workspaces = deps.workspaces(
    run,
    resolve(deps.workspaceRoots?.candidate ?? config.workspace.candidate_root),
  );
  const dir = config.verification?.bindings;
  const known = plannedBindings(admitted.plan);
  const declared = new Map<string, Declared>();
  const spec = config.verification?.dependencies;
  return {
    run,
    config,
    plan: admitted.plan,
    base,
    roles,
    deps,
    workspaces,
    declared(snapshot) {
      const found = declared.get(snapshot.tree);
      if (found) return found;
      const files =
        dir === undefined ? new Map<string, Buffer>() : treeFiles(run.dir, snapshot.tree, dir);
      const result = declaredRegistry(
        deps.registry,
        [...files].map(([path, bytes]) => ({ path, bytes })),
        dir ?? "",
        known,
      );
      declared.set(snapshot.tree, result);
      return result;
    },
    prepare:
      spec && workspaces.dependencies
        ? workspaces.dependencies({
            inputs: spec.inputs,
            command: spec.command,
            outputs: spec.outputs,
            network: spec.network,
            timeoutMs: spec.timeout_ms,
          })
        : undefined,
    skills: Object.fromEntries(
      (["producer", "reviewer"] as const).flatMap((r) =>
        roles[r].skills.map((skill) => [`${r}/${skill.name}`, skill.digest]),
      ),
    ),
    configuration: sha256(stringify(evaluatedConfiguration(config))),
    hosted,
    targets,
  };
}

/** The run's configuration: its latest amendment, else the one it started with, and its base. */
export function pinned(
  dir: string,
  events: readonly JournalEvent[],
): {
  config: RunnerConfig;
  base: SourceSnapshot;
  hosted: Hosted | null;
  /** The configuration revision in effect: the latest amendment's that names one, else the start's. */
  revision: string | null;
  targets: Record<string, SourceSnapshot>;
} | null {
  const [started] = facts<RunStart>(dir, events, "run-start");
  if (!started) return null;
  const amendments = facts<Amendment>(dir, events, "amendment");
  const amended = amendments.at(-1);
  const revised = amendments.filter((a) => a.record.revision != null).at(-1);
  return {
    config: amended?.record.config ?? started.record.config,
    base: started.record.base,
    hosted: started.record.hosted ?? null,
    revision: revised?.record.revision ?? started.record.hosted?.revision ?? null,
    targets: started.record.targets ?? {},
  };
}

const invalid = (diagnostics: string[]): RunResult => ({ outcome: "invalid", diagnostics });

/**
 * Admits the configuration, creates a run directory under
 * `workspace.controller_root`, imports `repository.expected_head` as its base
 * and drives the selection until it is accepted or the run stops.
 */
export async function startRun(
  config: unknown,
  deps: RunnerDeps,
  options: { configName?: string; hosted?: Hosted } = {},
): Promise<RunResult> {
  const admitted = await admit(config, deps, options.configName ?? "config");
  if (!admitted.ok) return invalid(admitted.diagnostics);
  const root = resolve(
    deps.workspaceRoots?.controller ?? admitted.config.workspace.controller_root,
  );
  mkdirSync(root, { recursive: true });
  const run = createRun(join(root, randomUUID()), deps.github);
  const imported = await importSource(run, deps.repoRoot, admitted.config.repository.expected_head);
  if (!imported.ok) {
    releaseRun(run);
    return invalid(imported.diagnostics);
  }
  // Each declared operation target is imported once, at its pinned revision.
  const targets: Record<string, SourceSnapshot> = {};
  for (const [name, target] of Object.entries(admitted.config.operations?.targets ?? {})) {
    const from = deps.repositories
      ? await deps.repositories(target.repository, target.revision)
      : target.repository === admitted.config.repository.name
        ? deps.repoRoot
        : null;
    const got = from
      ? await importSource(run, from, target.revision, target.path)
      : {
          ok: false as const,
          diagnostics: [
            `${target.repository} at ${target.revision} is not available to this controller`,
          ],
        };
    if (!got.ok) {
      releaseRun(run);
      return invalid(got.diagnostics.map((d) => `operations.targets.${name}: ${d}`));
    }
    targets[name] = got.snapshot;
  }
  const record: RunStart = {
    config: admitted.config,
    plan: admitted.plan.definitionsDigest,
    base: imported.snapshot,
    ...(options.hosted ? { hosted: options.hosted } : {}),
    ...(Object.keys(targets).length > 0 ? { targets } : {}),
  };
  journal(run, "run-start", record, {}, { through: admitted.config.selection.through });
  return drive(context(run, admitted, imported.snapshot, deps, options.hosted ?? null, targets));
}

/**
 * Recovers a stopped or crashed run, fencing its workers, admits its pinned
 * configuration again and continues from the last valid event.
 */
export async function resumeRun(dir: string, deps: RunnerDeps): Promise<RunResult> {
  if (!existsSync(join(dir, "manifest.json"))) return invalid([`${dir}: not a run directory`]);
  const recovery = await recoverRun(dir, {
    fence: deps.fence,
    ...(deps.liveness ? { liveness: deps.liveness } : {}),
    ...(deps.github === undefined ? {} : { github: deps.github }),
  });
  if (recovery.kind === "locked") {
    const { epoch, host, pid } = recovery.owner;
    return invalid([
      `${dir}: epoch ${epoch} is owned by ${host} pid ${pid} (${recovery.liveness}); only a released or dead owner is taken over`,
    ]);
  }
  if (recovery.kind === "paused") {
    return {
      outcome: "paused",
      run: null,
      dir,
      through: null,
      accepted: [],
      step: null,
      reasons: recovery.diagnostics.map((d) => reason("corrupt", dir, d)),
      checkpoint: null,
    };
  }
  const { run } = recovery;
  const configured = pinned(dir, recovery.events);
  if (!configured) {
    releaseRun(run);
    return invalid([`${dir}: the run has no run-start record`]);
  }
  const admitted = await admit(configured.config, deps, `${dir} configuration`);
  if (!admitted.ok) {
    releaseRun(run);
    return invalid(admitted.diagnostics);
  }
  return drive(
    context(run, admitted, configured.base, deps, configured.hosted, configured.targets),
  );
}

type Taken =
  { ok: true; run: RunHandle; events: JournalEvent[] } | { ok: false; diagnostics: string[] };

/**
 * Takes over a released run for an operator record. Only a released run is
 * taken over, so no worker can be running to fence, and a live or crashed
 * controller is never displaced.
 */
async function takeReleased(dir: string, github?: GithubOwner | null): Promise<Taken> {
  const read = readRun(dir);
  if (!read.ok) return read;
  if (!read.records.owner.released) {
    return {
      ok: false,
      diagnostics: [`${dir}: the run is not released; wait for it to pause, or resume it first`],
    };
  }
  const recovery = await recoverRun(dir, {
    fence: () => Promise.resolve(),
    liveness: () => "unknown",
    ...(github === undefined ? {} : { github }),
  });
  if (recovery.kind !== "recovered") {
    return {
      ok: false,
      diagnostics: [`${dir}: the run could not be taken over (${recovery.kind})`],
    };
  }
  return { ok: true, run: recovery.run, events: recovery.events };
}

export type ApproveResult = { ok: true; approval: string } | { ok: false; diagnostics: string[] };

function refusal(
  dir: string,
  events: readonly JournalEvent[],
  input: { request: string; actor: string; candidate?: string },
): string | null {
  const requests = facts<ApprovalRequest>(dir, events, "approval-request");
  const found = requests.find((r) => r.ref === input.request);
  if (!found) return `${input.request} is not an approval request of this run`;
  const request = found.record;
  if (
    requests.some(
      (r) =>
        r.seq > found.seq &&
        r.record.step === request.step &&
        targetKey(r.record.target) === targetKey(request.target),
    )
  ) {
    return `${input.request} is superseded by a later request for ${targetKey(request.target)}`;
  }
  // Only the exact pending request: a later evaluation of its step makes it stale.
  const later = events.find(
    (e) =>
      e.action === "evaluation" &&
      e.seq > found.seq &&
      e.data.step === request.step &&
      e.evaluation !== request.evaluation,
  );
  if (later) {
    return `${input.request} is stale: ${request.step} has a later evaluation ${later.evaluation ?? ""}`;
  }
  const approvals = facts<Approval & { request?: string }>(dir, events, "approval");
  if (approvals.some((a) => a.record.request === input.request)) {
    return `${input.request} is already decided`;
  }
  const holders = pinned(dir, events)?.config.permissions.approvers[request.authority] ?? [];
  if (!holders.includes(input.actor)) {
    return `${input.actor} does not hold the ${request.authority} authority of this run`;
  }
  if (input.candidate !== undefined && input.candidate !== request.candidate) {
    return `${input.candidate} is not the candidate ${request.candidate} that ${input.request} asks about`;
  }
  return null;
}

/**
 * The operator channel. Records an operator's decision on one approval
 * request of a released run: only a request the controller journaled, not
 * superseded or decided, by an actor holding its authority in the run's
 * pinned configuration. The approval is bound to the request, its target,
 * binding version, candidate and evaluation.
 */
export async function approveRequest(
  dir: string,
  input: {
    request: string;
    decision: "approved" | "denied";
    actor: string;
    /** The candidate commit the operator reviewed; it must be the request's (T3.5 H3). */
    candidate?: string;
  },
  options: { github?: GithubOwner | null } = {},
): Promise<ApproveResult> {
  // A refusal writes nothing: it is checked on the records before a takeover, and again after.
  const read = readRun(dir);
  if (!read.ok) return read;
  const early = refusal(dir, read.records.events, input);
  if (early) return { ok: false, diagnostics: [early] };
  const taken = await takeReleased(dir, options.github);
  if (!taken.ok) return taken;
  const { run, events } = taken;
  const refused = refusal(run.dir, events, input);
  if (refused) {
    releaseRun(run);
    return { ok: false, diagnostics: [refused] };
  }
  const request = JSON.parse(readEvidence(dir, input.request).toString("utf8")) as ApprovalRequest;
  const approval: OperatorApproval = {
    run: request.run,
    target: request.target,
    authority: request.authority,
    actor: input.actor,
    decision: input.decision,
    candidate: request.candidate,
    evaluation: request.evaluation,
    request: input.request,
  };
  const stored = recordApproval(run, request.attempt, approval);
  releaseRun(run);
  return { ok: true, approval: stored.ref };
}

/** Configuration that identifies the run itself; changing it needs a new run. */
const FIXED = [
  "/repository",
  "/checkpoint",
  "/permissions/approvers",
  "/publication",
  "/operations",
];

/** Whether `ancestor` is `revision` or an ancestor of it in the repository. */
function descends(repoRoot: string, ancestor: string, revision: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, revision], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/** The leaf differences between two JSON values, by JSON pointer. */
function differences(before: unknown, after: unknown, path = ""): ConfigChange[] {
  const object = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  if (object(before) && object(after)) {
    return unique([...Object.keys(before), ...Object.keys(after)]).flatMap((key) =>
      differences(before[key], after[key], `${path}/${key}`),
    );
  }
  return stringify(before) === stringify(after)
    ? []
    : [{ path: path || "/", old: before ?? null, new: after ?? null }];
}

export type AmendResult =
  { ok: true; amendment: string; changes: ConfigChange[] } | { ok: false; diagnostics: string[] };

/**
 * An operator's amendment of a released run's configuration (research log
 * §7): budgets, roles, the write policy, workspace roots, the definitions
 * revision or the selection. The new configuration must pass the same
 * admission as `run`. The amendment journals the actor, the reason and each
 * old and new value; prior attempts, receipts and acceptances stay, and
 * resume continues under the new configuration. Changing only budgets,
 * workspace roots, credentials or the selection keeps accepted evaluations
 * current; any other change re-evaluates them. The repository, the checkpoint
 * and the approvers identify the run and cannot be amended.
 */
export async function amendRun(
  dir: string,
  input: {
    config: unknown;
    reason: string;
    actor: string;
    /** The commit the amended configuration was read at, for a hosted run (T3.5 H3). */
    revision?: string;
  },
  deps: Pick<
    RunnerDeps,
    "repoRoot" | "skillsRoot" | "env" | "applicability" | "requireCredential" | "github"
  >,
): Promise<AmendResult> {
  const refuse = (diagnostic: string): AmendResult => ({ ok: false, diagnostics: [diagnostic] });
  if (input.reason.trim() === "") return refuse("an amendment needs a reason");
  const read = readRun(dir);
  if (!read.ok) return read;
  const before = pinned(dir, read.records.events);
  if (!before) return refuse(`${dir}: the run has no run-start record`);
  // A run that names who may amend it accepts amendments from them alone (T3.5 H3).
  const amenders = before.config.permissions.approvers.amend;
  // A hosted run is amended only by the authority it names.
  if (before.hosted && amenders === undefined) {
    return refuse("this run names no amend authority (permissions.approvers.amend)");
  }
  if (amenders !== undefined && !amenders.includes(input.actor)) {
    return refuse(`${input.actor} does not hold the amend authority of this run`);
  }
  // A hosted run's configuration comes from a newer revision of its template;
  // extending the selection alone reads no template.
  if (
    before.revision !== null &&
    input.revision !== undefined &&
    (input.revision === before.revision ||
      !descends(deps.repoRoot, before.revision, input.revision))
  ) {
    return refuse(
      `configuration revision ${input.revision} is stale: it does not follow the run's ${before.revision}`,
    );
  }
  const config: unknown = JSON.parse(stringify(input.config) ?? "null");
  const changes = differences(before.config, config);
  if (changes.length === 0) return refuse("the configuration is unchanged");
  const selectionOnly = changes.every((c) => c.path.startsWith("/selection/"));
  if (before.revision !== null && !selectionOnly && input.revision === undefined) {
    return refuse("the amendment names no configuration revision");
  }
  const fixed = changes.filter((c) =>
    FIXED.some((f) => c.path === f || c.path.startsWith(`${f}/`)),
  );
  if (fixed.length > 0) {
    return refuse(
      `${fixed.map((c) => c.path).join(", ")} cannot be amended within a run; start a new run`,
    );
  }
  const admitted = await admit(config, deps, "amendment");
  if (!admitted.ok) return admitted;
  const taken = await takeReleased(dir, deps.github);
  if (!taken.ok) return taken;
  if (stringify(pinned(dir, taken.events)?.config) !== stringify(before.config)) {
    releaseRun(taken.run);
    return refuse(`${dir}: the configuration changed meanwhile; amend again`);
  }
  const amendment: Amendment = {
    actor: input.actor,
    reason: input.reason,
    config: admitted.config,
    changes,
    ...(input.revision === undefined || selectionOnly ? {} : { revision: input.revision }),
  };
  const ref = journal(
    taken.run,
    "amendment",
    amendment,
    {},
    {
      changes: changes.map((c) => c.path),
    },
  );
  releaseRun(taken.run);
  return { ok: true, amendment: ref, changes };
}

/** What a run's records say now (T3.5 H3): the facts a workflow summary reports. */
export type RunFacts = {
  run: string;
  name: string | null;
  hosted: Hosted | null;
  revision: string | null;
  journal: { seq: number; head: string | null; epoch: number; released: boolean };
  owner: { epoch: number; released: boolean; github: GithubOwner | null };
  boundary: string;
  accepted: string[];
  checkpoint: CheckpointStatus;
  /** Each role's requested and latest provider-reported model and effort; absence is explicit. */
  roles: Record<
    RoleName,
    {
      model: { requested: string; reported: string | "not-reported" };
      effort: { requested: string; reported: string[] | "not-reported" };
    }
  >;
  spending: {
    reportedUsd: number;
    unknownSessions: number;
    reservedUsd: number;
    unresolved: number;
  };
  /** The reasons of the last stop, when the run stopped paused. */
  pause: PauseReason[] | null;
  /** Operator input recorded since the last stop that only a continuation applies. */
  unapplied: "decision" | "amendment" | null;
  /** Approval requests of current evaluations that no decision answers yet. */
  pending: {
    request: string;
    step: string;
    target: string;
    candidate: string;
    authority: string;
  }[];
  pullRequest: Association | null;
  /** Reviews waiting for the next round (T3.5 H3). */
  queued: { pull: number; review: number }[];
  round: {
    round: number;
    pull: number;
    head: string;
    complete: boolean;
    dispositions: { item: string; disposition: string; reason: string }[];
    fix: { step: string; commit: string | null; evaluation: string; targets: number } | null;
    replies: { item: string; reference: string }[];
  } | null;
  /** Evidence of each current acceptance: the acceptance record and what it counted. */
  evidence: { step: string; acceptance: string; refs: string[] }[];
};

/**
 * The facts of a run directory, read without writing (T3.5 H3): its pinned
 * configuration is admitted again without the provider credential, so the
 * acceptances it reports are current under the same rules the runner uses.
 */
export async function runFacts(
  dir: string,
  deps: Pick<
    RunnerDeps,
    "repoRoot" | "skillsRoot" | "env" | "applicability" | "registry" | "harness"
  >,
): Promise<{ ok: true; facts: RunFacts } | { ok: false; diagnostics: string[] }> {
  const read = readRun(dir);
  if (!read.ok) return read;
  const { events, manifest, owner, head } = read.records;
  const configured = pinned(dir, events);
  if (!configured) return { ok: false, diagnostics: [`${dir}: the run has no run-start record`] };
  // Facts are read from records: the branch may have moved since the run started.
  const admitted = await admit(
    configured.config,
    { ...deps, requireCredential: false },
    `${dir} configuration`,
    false,
  );
  if (!admitted.ok) return admitted;
  const handle: RunHandle = {
    dir,
    run: manifest.run,
    epoch: owner.epoch,
    fd: null,
    seq: (events.at(-1)?.seq ?? 0) + 1,
    prev: head,
    length: 0,
  };
  const inert: Workspaces = {
    producer: () => Promise.reject(new Error("read-only")),
    verifier: () => Promise.reject(new Error("read-only")),
    reviewer: () => Promise.reject(new Error("read-only")),
  };
  const ctx = context(
    handle,
    admitted,
    configured.base,
    {
      ...deps,
      workspaces: () => inert,
      effects: null,
      fence: () => Promise.resolve(),
      signal: new AbortController().signal,
    },
    configured.hosted,
    configured.targets,
  );
  const s = readState(handle, events);
  const accepted = acceptances(ctx, s);
  const last = events.filter((e) => e.action !== "owner" && e.action !== "released").at(-1);
  const reviewOutcomes = s.reviews.map((r) => r.record.outcome);
  const reported = (outcome: AgentOutcome | undefined) => ({
    model: outcome?.observation.model.reported ?? ("not-reported" as const),
    effort: outcome?.observation.effort.reported ?? ("not-reported" as const),
  });
  const roleFacts = (name: RoleName, outcome: AgentOutcome | undefined) => {
    const role = admitted.roles[name];
    const got = reported(outcome);
    return {
      model: { requested: role.model, reported: got.model },
      effort: { requested: role.effort, reported: got.effort },
    };
  };
  const spent = spending(s);
  const decided = new Set(s.approvals.flatMap((a) => (a.record.request ? [a.record.request] : [])));
  const pending = s.requests
    .filter((r) => !decided.has(r.ref))
    .filter(
      (r) =>
        !s.requests.some(
          (q) =>
            q.seq > r.seq &&
            q.record.step === r.record.step &&
            targetKey(q.record.target) === targetKey(r.record.target),
        ),
    )
    .map((r) => ({
      request: r.ref,
      step: r.record.step,
      target: targetKey(r.record.target),
      candidate: r.record.candidate,
      authority: r.record.authority,
    }));
  const assoc = association({ config: ctx.config, name: runName(ctx) }, s);
  const snapshot = s.feedback.at(-1);
  const assessment = snapshot
    ? s.assessments.find((a) => a.record.feedback === snapshot.ref)
    : undefined;
  const corrected = assessment?.record.correction
    ? accepted.get(assessment.record.correction.step)
    : undefined;
  const replies = receipted(s).filter(
    (d) => d.request.action === "pr-reply" && d.request.payload?.round === snapshot?.record.round,
  );
  return {
    ok: true,
    facts: {
      run: manifest.run,
      name: configured.hosted?.name ?? null,
      hosted: configured.hosted,
      revision: configured.revision,
      journal: {
        seq: events.at(-1)?.seq ?? 0,
        head,
        epoch: owner.epoch,
        released: owner.released,
      },
      owner: { epoch: owner.epoch, released: owner.released, github: owner.github ?? null },
      boundary: ctx.plan.selection.through,
      accepted: ctx.plan.steps.filter((x) => accepted.has(x.id)).map((x) => x.id),
      checkpoint: checkpointStatus(ctx, s, accepted),
      roles: {
        producer: roleFacts("producer", s.producers.at(-1)?.record),
        reviewer: roleFacts("reviewer", reviewOutcomes.at(-1)),
      },
      spending: {
        reportedUsd: spent.reported,
        unknownSessions: spent.unknown,
        reservedUsd: spent.reserved,
        unresolved: spent.unresolved.length,
      },
      pause:
        last?.action === "pause" && Array.isArray(last.data.reasons)
          ? (last.data.reasons as PauseReason[])
          : null,
      unapplied:
        last?.action === "approval"
          ? "decision"
          : last?.action === "amendment"
            ? "amendment"
            : null,
      pending,
      pullRequest: assoc,
      queued: queuedReviews(events, s.feedback),
      round:
        snapshot && assoc?.pull
          ? {
              round: snapshot.record.round,
              pull: snapshot.record.pull,
              head: snapshot.record.head.commit,
              complete: s.rounds.some((r) => r.record.feedback === snapshot.ref),
              dispositions: (assessment?.record.dispositions ?? []).map((d) => ({
                item: d.item,
                disposition: d.disposition,
                reason: d.reason,
              })),
              fix: corrected
                ? {
                    step: corrected.step,
                    commit:
                      assoc.head?.candidate === corrected.candidate.commit
                        ? assoc.head.commit
                        : null,
                    evaluation: corrected.evaluation,
                    targets: corrected.decision.targets.length,
                  }
                : null,
              replies: replies.map((r) => ({
                item: typeof r.request.payload?.item === "string" ? r.request.payload.item : "",
                reference: r.receipt.reference,
              })),
            }
          : null,
      evidence: [...accepted.values()].map((a) => ({
        step: a.step,
        acceptance: a.ref,
        refs: [...a.decision.evidence],
      })),
    },
  };
}

export type AddressResult =
  | { ok: true; outcome: "recorded"; round: number; feedback: string; items: number }
  | { ok: true; outcome: "resumed"; round: number }
  | { ok: true; outcome: "queued"; round: number; review: number }
  | { ok: true; outcome: "unchanged"; round: null }
  | { ok: false; diagnostics: string[] };

/**
 * Starts a pull-request correction round of a released run (T3.5 H3): the
 * one path for a submitted review and a manual `address-comments`. The actor
 * — a review's author when a review triggered it — must hold the `feedback`
 * authority. The pull request must be the run's own, open, from its branch
 * to its base. An incomplete round is resumed, not duplicated; feedback whose
 * items all have a completed disposition with the same content is skipped,
 * and an edited item is assessed again. A head that moved on from the
 * published commit is adopted when its commits stay in writable paths; any
 * other head pauses the round. Refusals write nothing.
 */
/**
 * Reviews submitted while a round was open and not yet addressed by a later
 * round: each starts the next round once the open one completes.
 */
export function queuedReviews(
  events: readonly JournalEvent[],
  feedback: readonly Fact<FeedbackSnapshot>[],
): { pull: number; review: number }[] {
  return events
    .filter((e) => e.action === "pr-queued")
    .map((e) => ({ seq: e.seq, pull: Number(e.data.pull), review: Number(e.data.review) }))
    .filter(
      (q, i, all) =>
        all.findIndex((x) => x.review === q.review) === i &&
        !feedback.some((f) => f.seq > q.seq && f.record.trigger.review === q.review),
    )
    .map(({ pull, review }) => ({ pull, review }));
}

export async function addressComments(
  dir: string,
  input: { pull: number; actor: string; review: number | null },
  deps: {
    source: FeedbackSource;
    repoRoot: string;
    /** Makes a pull request head's commit available in the repository, for adoption. */
    fetch?: (commit: string) => Promise<void>;
    github?: GithubOwner | null;
  },
): Promise<AddressResult> {
  const refuse = (diagnostic: string): AddressResult => ({ ok: false, diagnostics: [diagnostic] });
  const read = readRun(dir);
  if (!read.ok) return read;
  const { events, manifest } = read.records;
  const configured = pinned(dir, events);
  if (!configured) return refuse(`${dir}: the run has no run-start record`);
  const { config, hosted } = configured;
  const s = readState({ dir }, events);
  const assoc = association({ config, name: hosted?.name ?? manifest.run }, s);
  if (!assoc?.pull || !assoc.head) return refuse("no pull request is published for this run");
  if (input.pull !== assoc.pull.number) {
    return refuse(`pull request #${input.pull} is not this run's #${assoc.pull.number}`);
  }
  const holders = config.permissions.approvers.feedback ?? [];
  // A review's author is the actor even when the workflow token forwarded it;
  // a manual round's actor is the person who dispatched it.
  const review = input.review === null ? null : await deps.source.review(input.pull, input.review);
  if (input.review !== null && !review)
    return refuse(`review ${input.review} is not on #${input.pull}`);
  if (review?.state === "DISMISSED") return refuse(`review ${review.id} was dismissed`);
  if (!review && isBot(input.actor)) {
    return refuse(`${input.actor} is an app; its own events never start a round`);
  }
  // A person who dispatches a round needs the authority, whichever review it names.
  if (!isBot(input.actor) && !holders.includes(input.actor)) {
    return refuse(`${input.actor} does not hold the feedback authority of this run`);
  }
  const actor = review ? review.author : input.actor;
  if (isBot(actor)) return refuse(`review ${input.review} is an app's, such as the harness's own`);
  if (!holders.includes(actor)) {
    return refuse(`${actor} does not hold the feedback authority of this run`);
  }
  const pull = await deps.source.pull(input.pull);
  if (
    !pull ||
    pull.state !== "open" ||
    pull.head.ref !== assoc.branch ||
    pull.head.repository !== assoc.repository ||
    pull.base.ref !== assoc.base
  ) {
    return refuse(
      `#${input.pull} is not the open pull request from ${assoc.branch} to ${assoc.base} in ${assoc.repository}`,
    );
  }
  const open = s.feedback.at(-1);
  if (open && !s.rounds.some((r) => r.record.feedback === open.ref)) {
    // A review submitted while a round is open waits for it, recorded, and
    // starts the next round when this one completes.
    if (
      review &&
      open.record.trigger.review !== review.id &&
      !queuedReviews(s.events, s.feedback).some((q) => q.review === review.id)
    ) {
      const taken = await takeReleased(dir, deps.github);
      if (!taken.ok) return taken;
      appendEvent(taken.run, {
        action: "pr-queued",
        data: { pull: input.pull, review: review.id, actor, round: open.record.round },
      });
      releaseRun(taken.run);
      return { ok: true, outcome: "queued", round: open.record.round, review: review.id };
    }
    return { ok: true, outcome: "resumed", round: open.record.round };
  }
  const items = collect(
    {
      review,
      reviews: review ? [] : await deps.source.reviews(input.pull),
      reviewComments: await deps.source.reviewComments(input.pull),
      comments: review ? [] : await deps.source.comments(input.pull),
    },
    (author) => holders.includes(author),
    "<!-- pactwright-harness",
  );
  const done = new Set(
    s.rounds.flatMap((r) => {
      const assessment = s.assessments.find((a) => a.ref === r.record.assessment);
      return (assessment?.record.dispositions ?? []).map((d) => `${d.item} ${d.digest}`);
    }),
  );
  const fresh = items.filter((i) => !done.has(`${i.id} ${i.digest}`));
  if (fresh.length === 0) return { ok: true, outcome: "unchanged", round: null };
  // The head: the published commit, or newer commits on it that stay in writable paths.
  let adopted: SourceSnapshot | null = null;
  if (pull.head.sha !== assoc.head.commit) {
    if (!(await deps.source.descends(assoc.head.commit, pull.head.sha))) {
      return refuse(
        `#${input.pull} is at ${pull.head.sha}, which does not build on the published ${assoc.head.commit}; reconcile the branch before a round`,
      );
    }
    const { writable, protected: fixed } = config.permissions;
    const outside = (await deps.source.changed(assoc.head.commit, pull.head.sha)).filter(
      (p) => !within(p, writable) || within(p, fixed),
    );
    if (outside.length > 0) {
      return refuse(
        `the newer commits on #${input.pull} change ${outside.join(", ")}, outside the writable paths; reconcile the branch before a round`,
      );
    }
    await deps.fetch?.(pull.head.sha);
  }
  const taken = await takeReleased(dir, deps.github);
  if (!taken.ok) return taken;
  if (pull.head.sha !== assoc.head.commit) {
    const imported = await importSource(taken.run, deps.repoRoot, pull.head.sha);
    if (!imported.ok) {
      releaseRun(taken.run);
      return { ok: false, diagnostics: imported.diagnostics };
    }
    adopted = imported.snapshot;
  }
  const round = (s.feedback.at(-1)?.record.round ?? 0) + 1;
  const snapshot: FeedbackSnapshot = {
    round,
    pull: input.pull,
    trigger: { kind: review ? "review" : "manual", actor, review: input.review },
    head: { commit: pull.head.sha, adopted },
    items: fresh,
  };
  const ref = journal(taken.run, "pr-feedback", snapshot, {}, { round, pull: input.pull });
  releaseRun(taken.run);
  return { ok: true, outcome: "recorded", round, feedback: ref, items: fresh.length };
}

/** The runner states journaled facts show, in order, for status and recovery traces. */
export function stateTrace(
  events: readonly JournalEvent[],
): { step: string | null; attempt: number | null; state: RunnerState }[] {
  const trace: { step: string | null; attempt: number | null; state: RunnerState }[] = [];
  for (const e of events) {
    const step = typeof e.data.step === "string" ? e.data.step : null;
    const state: RunnerState | null =
      e.action === "run-start"
        ? "prepared"
        : e.action === "start" && e.data.phase === "produce"
          ? "producing"
          : e.action === "evaluation"
            ? "verifying"
            : e.action === "start" && e.data.phase === "review"
              ? "reviewing"
              : e.action === "acceptance"
                ? "accepted"
                : e.action === "pause"
                  ? "paused"
                  : null;
    const last = trace.at(-1);
    if (state && !(last?.step === step && last.attempt === e.attempt && last.state === state)) {
      trace.push({ step, attempt: e.attempt, state });
    }
  }
  return trace;
}

/** Identity of the harness code: every module and schema of this directory. */
export function harnessIdentity(): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  const files = readdirSync(dir)
    .filter((f) => /\.(ts|json)$/.test(f))
    .sort();
  return sha256(stringify(files.map((f) => [f, sha256(readFileSync(join(dir, f)))])));
}

/** Producer workspaces as B's contained workspaces below `root`. */
export function containedProducer(run: RunHandle, root: string): Workspaces["producer"] {
  return async (from, policy) => {
    mkdirSync(root, { recursive: true });
    const dir = join(root, randomUUID());
    const ws = await createWorkspace(run, { base: from, root: dir, policy }).catch((e: unknown) => {
      rmSync(dir, { recursive: true, force: true });
      throw e;
    });
    return {
      ...containedOps(ws),
      seal: (against) => sealCandidate(run, ws, against),
      async close() {
        if (!ws.fenced) await fence(ws);
        rmSync(dir, { recursive: true, force: true });
      },
    };
  };
}
