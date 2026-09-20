import { PactwrightError } from "../errors.js";
import { lineageFor, type Lineage } from "../graph/lineage.js";
import { repositoryRevision } from "../graph/repository.js";
import { loadProject, type Project } from "../loader.js";
import { currentStep, executionFor, routeAfter } from "./engine.js";
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
  const advanced = advance(project, { ...state, deliveredRevision: revision }, step);
  writeExecutionState(root, advanced);
  return { step, brief: state.brief, state: advanced };
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
  const carried: ExecutionState = {
    ...state,
    review: {
      step,
      outcome: input.outcome,
      revision: state.deliveredRevision ?? repositoryRevision(root).id,
    },
  };
  const advanced = advance(project, carried, step, input.outcome);
  writeExecutionState(root, advanced);
  return { step, brief: state.brief, state: advanced };
}

/** Applies a completed step and takes the route the shape permits. */
function advance(
  project: Project,
  state: ExecutionState,
  stepName: string,
  outcome?: ReviewOutcome,
): ExecutionState {
  const shape = project.lifecycle.shape;
  const step = shape.steps.find((candidate) => candidate.name === stepName)!;
  const completedSteps = state.completedSteps.includes(stepName)
    ? state.completedSteps
    : [...state.completedSteps, stepName];
  const carried: ExecutionState = { ...state, completedSteps };
  const routing = routeAfter(shape, carried, step, outcome);
  if (routing.stop !== undefined) {
    return { ...carried, status: "blocked", currentStep: stepName };
  }
  if (routing.to === undefined) {
    const rest = { ...carried };
    delete (rest as { currentStep?: string }).currentStep;
    return { ...rest, status: "completed" };
  }
  const iterations =
    routing.route === undefined
      ? carried.iterations
      : { ...carried.iterations, [routing.route]: (carried.iterations[routing.route] ?? 0) + 1 };
  return { ...carried, status: "running", currentStep: routing.to, iterations };
}
