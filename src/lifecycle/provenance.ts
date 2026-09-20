import { PactwrightError } from "../errors.js";
import { lineageFor, type Lineage } from "../graph/lineage.js";
import { repositoryRevision } from "../graph/repository.js";
import { loadProject, type Project } from "../loader.js";
import { currentStep, executionFor } from "./engine.js";
import { transition, type LifecycleEvent, type TransitionResult } from "./transition.js";
import { writeExecutionState, type ExecutionState, type ReviewOutcome } from "./state.js";

/**
 * The shape steps whose result is execution provenance rather than a graph
 * record (Spec 01 §11). `/deliver-brief` and `/review` hand their result
 * here, so a Delivery driven through the adapter advances the same run state
 * `lifecycle run` advances — and the Evidence closure guards read the same
 * thing either way.
 */
export const PROVENANCE_KINDS = ["delivery", "review"] as const;
export type ProvenanceKind = (typeof PROVENANCE_KINDS)[number];

export function isProvenanceKind(name: string): name is ProvenanceKind {
  return (PROVENANCE_KINDS as readonly string[]).includes(name);
}

export interface ProvenanceResult {
  readonly step: string;
  readonly brief: string;
  readonly state: ExecutionState;
}

/** The lineage an anchor node belongs to, and its active run. */
function runFor(
  project: Project,
  anchor: string,
): { readonly lineage: Lineage; readonly state: ExecutionState } {
  const resolved = lineageFor(project.graph.index, anchor);
  if (resolved === undefined) {
    throw new PactwrightError("unknown-node", `"${anchor}" is not part of any Delivery lineage`);
  }
  const lineage = resolved.lineage;
  const execution = executionFor(project, lineage);
  if (execution === undefined) {
    throw new PactwrightError(
      "not-delivering",
      `intent "${resolved.intent.id}" is not in its Brief-to-Evidence phase; there is no run to record against`,
    );
  }
  return { lineage, state: execution.state };
}

/** The step the run stands at, required to be of `kind`. */
function stepOfKind(project: Project, state: ExecutionState, kind: ProvenanceKind): string {
  const step = currentStep(project.lifecycle.shape, state);
  if (step === undefined || step.kind !== kind) {
    const where = step === undefined ? `status "${state.status}"` : `step "${step.name}"`;
    throw new PactwrightError(
      "step-not-permitted",
      `the "${state.shape}" run for brief "${state.brief}" is at ${where}, not a ${kind} step`,
    );
  }
  return step.name;
}

export interface RecordDeliveryInput {
  /** Any node in the lineage; the Brief and its run are derived from it. */
  readonly anchor: string;
  /**
   * The delivered state's identity. Defaults to the current repository
   * revision, which is what an adapter-driven delivery actually produced.
   */
  readonly revision?: string;
}

/**
 * Records that the active Delivery step produced a state, then routes the run
 * forward. The runtime owns the transition; the adapter only reports what it
 * did, which is what keeps `/deliver-brief` from selecting transitions.
 */
export function recordDelivery(root: string, input: RecordDeliveryInput): ProvenanceResult {
  const project = loadProject({ root });
  const { state } = runFor(project, input.anchor);
  const step = stepOfKind(project, state, "delivery");
  const revision = input.revision ?? repositoryRevision(root).id;
  const result = apply(project, state, { kind: "step-completed", step, revision });
  return { step, brief: state.brief, state: writeResult(root, result) };
}

export interface RecordReviewInput {
  readonly anchor: string;
  readonly outcome: ReviewOutcome;
}

/**
 * Records a Review's verdict against the state it reviewed, then takes the
 * route the shape permits — forward on a pass, a declared corrective route on
 * a revise, a stop on a block. A Review never creates Evidence.
 */
export function recordReview(root: string, input: RecordReviewInput): ProvenanceResult {
  const project = loadProject({ root });
  const { state } = runFor(project, input.anchor);
  const step = stepOfKind(project, state, "review");
  // A Review with no delivered state on record was taken against the
  // repository as it stands; the reducer folds the verdict in either way.
  const carried: ExecutionState = {
    ...state,
    deliveredRevision: state.deliveredRevision ?? repositoryRevision(root).id,
  };
  const result = apply(project, carried, {
    kind: "step-completed",
    step,
    review: input.outcome,
  });
  return { step, brief: state.brief, state: writeResult(root, result) };
}

export interface RecordGateInput {
  readonly anchor: string;
  /** The Gate step being resolved. */
  readonly step: string;
  /** The acting actor, `<kind>:<name>` — checked against the Gate's authority. */
  readonly resolvedBy: string;
}

/**
 * Records an authorised Gate resolution (Core §46).
 *
 * This is the write side of `ExecutionState.gates`, which had readers —
 * closure, validation rule 14 — and no producer outside two tests. Without
 * it a configured human Gate could only be passed by editing execution state
 * by hand, and `recordDelivery` advanced past one without noticing.
 */
export function recordGate(root: string, input: RecordGateInput): ProvenanceResult {
  const project = loadProject({ root });
  const { state } = runFor(project, input.anchor);
  const result = apply(project, state, {
    kind: "gate-resolved",
    step: input.step,
    resolvedBy: input.resolvedBy,
  });
  return { step: input.step, brief: state.brief, state: writeResult(root, result) };
}

/** Runs the shared reducer over this project's shape and policy. */
function apply(project: Project, state: ExecutionState, event: LifecycleEvent): TransitionResult {
  return transition(project.lifecycle.shape, project.lifecycle, state, event);
}

/**
 * Writes the reducer's state, unless it refused.
 *
 * A refusal returns the input state unchanged, so throwing *before* the write
 * is what leaves the state file byte-identical after an unauthorised attempt
 * — which is the whole point of routing the adapter path through the same
 * reducer the automatic loop uses.
 */
function writeResult(root: string, result: TransitionResult): ExecutionState {
  if (result.outcome === "refused") {
    throw new PactwrightError(
      "transition-refused",
      result.reason ?? "the runtime refused this transition",
    );
  }
  writeExecutionState(root, result.state);
  return result.state;
}
