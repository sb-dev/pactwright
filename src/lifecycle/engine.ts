import type { Problem } from "../errors.js";
import { PactwrightError } from "../errors.js";
import {
  RESPONSIBILITIES,
  type Actor,
  type ExecutionMode,
  type ResponsibilityName,
} from "../config/lifecycle.js";
import { deriveLineages, type DeliveryState, type Lineage } from "../graph/lineage.js";
import type { Project } from "../loader.js";
import { permittedOperations, snapshotOf, type PermittedOperation } from "../validate/kernel.js";
import {
  DIRECT_SHAPE_ID,
  STEP_CAPABILITY,
  isGate,
  stepNamed,
  type LifecycleShape,
  type ShapeStep,
} from "./shape.js";
import { beginExecution, loadExecutionState, type ExecutionState } from "./state.js";

/**
 * How many Contract-crafting responsibilities each derived state has
 * completed (§44). `deferred`/`rejected` completed the decision and are
 * terminal for this lineage: resuming needs a new Decision (§15), which is
 * not a responsibility the engine loops back to. `undefined` = no lineage
 * yet: nothing completed.
 *
 * Only the four responsibilities are counted here. Progress through the
 * Brief-to-Evidence shape is execution state, never derived from the graph
 * beyond the broad `delivering`/`done` distinction.
 */
const COMPLETED_RESPONSIBILITIES: Readonly<Record<DeliveryState, number>> = {
  open: 1, // capture-intent
  deferred: 3, // …propose-contracts, approve-contract
  rejected: 3,
  contracted: 3,
  delivering: 4, // …write-brief
  done: 4,
};

const TERMINAL_STATES: readonly DeliveryState[] = ["deferred", "rejected", "done"];

/** One thing the lifecycle can do next: a responsibility or a shape step. */
export interface LifecycleAction {
  readonly kind: "responsibility" | "step";
  readonly name: string;
  readonly execution: ExecutionMode;
  readonly actor?: Actor;
  /** The core capability a shape step delegates to; absent for closure steps. */
  readonly capability?: string;
}

/** Responsibilities a lineage has completed, in order. */
export function completedResponsibilities(
  lineage: Lineage | undefined,
): readonly ResponsibilityName[] {
  return RESPONSIBILITIES.slice(
    0,
    lineage === undefined ? 0 : COMPLETED_RESPONSIBILITIES[lineage.state],
  );
}

/** Responsibilities still to run, in order. Empty once a Brief exists. */
export function pendingResponsibilities(
  lineage: Lineage | undefined,
): readonly ResponsibilityName[] {
  if (lineage === undefined) return ["capture-intent"];
  if (lineage.superseded) return [];
  if (TERMINAL_STATES.includes(lineage.state)) return [];
  return RESPONSIBILITIES.slice(COMPLETED_RESPONSIBILITIES[lineage.state]);
}

/** A lineage still progressing through the lifecycle. */
export function isActive(lineage: Lineage): boolean {
  return !lineage.superseded && !TERMINAL_STATES.includes(lineage.state);
}

/** True once the lineage has a current Brief, so the shape governs progression. */
export function inShapePhase(lineage: Lineage | undefined): boolean {
  return lineage !== undefined && !lineage.superseded && lineage.state === "delivering";
}

function actionForResponsibility(project: Project, name: ResponsibilityName): LifecycleAction {
  const policy = project.lifecycle.responsibilities[name];
  return {
    kind: "responsibility",
    name,
    execution: policy.execution,
    ...(policy.actor === undefined ? {} : { actor: policy.actor }),
  };
}

function actionForStep(step: ShapeStep): LifecycleAction {
  const capability = STEP_CAPABILITY[step.kind];
  return {
    kind: "step",
    name: step.name,
    execution: step.execution,
    ...(step.actor === undefined ? {} : { actor: step.actor }),
    ...(capability === undefined ? {} : { capability }),
  };
}

/** Whether an action waits for a human: manual execution or a human actor. */
export function isActionGate(action: LifecycleAction): boolean {
  return action.execution === "manual" || action.actor === "human";
}

/**
 * The execution state governing a lineage's shape phase, beginning a fresh
 * run when none exists yet. Returns `undefined` outside the shape phase.
 */
export function executionFor(
  project: Project,
  lineage: Lineage | undefined,
): { readonly state: ExecutionState; readonly problems: readonly Problem[] } | undefined {
  if (!inShapePhase(lineage) || lineage?.brief === undefined) return undefined;
  const shape = project.lifecycle.shape;
  const loaded = loadExecutionState(project.paths.root, lineage.brief.id);
  if (loaded.value !== undefined) return { state: loaded.value, problems: loaded.problems };
  if (loaded.problems.length > 0) {
    return {
      state: beginExecution(lineage.brief.id, shape.id, shape.steps[0]?.name),
      problems: loaded.problems,
    };
  }
  return {
    state: beginExecution(lineage.brief.id, shape.id, shape.steps[0]?.name),
    problems: [],
  };
}

/**
 * The shape step a run is currently at, or `undefined` when the run has
 * finished or its recorded step is not in the resolved shape.
 */
export function currentStep(shape: LifecycleShape, state: ExecutionState): ShapeStep | undefined {
  if (state.status === "completed" || state.status === "failed") return undefined;
  if (state.currentStep === undefined) return undefined;
  return stepNamed(shape, state.currentStep);
}

/**
 * Routing moved into the reducer (`./transition.js`), which is now the only
 * thing that applies it. Re-exported here so `routeAfter` keeps the import
 * path its callers already use.
 */
export { routeAfter, type Routing } from "./transition.js";

export interface LineageStatus {
  /** Absent for the "no lineage yet" entry. */
  readonly intent?: string;
  readonly state: DeliveryState | "none";
  /** Set when the intent itself is superseded: the lineage is frozen (§15). */
  readonly superseded?: true;
  readonly completedResponsibilities: readonly ResponsibilityName[];
  /** Shape steps the current run has completed, in order, repeats included. */
  readonly visited: readonly string[];
  /** The next action, absent when the lifecycle has nothing further to do. */
  readonly current?: LifecycleAction;
  /** Set when `current` waits for a human. */
  readonly blocked?: string;
  readonly requiredActor?: Actor;
  readonly lineage?: Lineage;
  /** The resolved shape a shape-phase lineage is executing (§23). */
  readonly shape?: string;
  readonly executionStatus?: ExecutionState["status"];
  /**
   * Every recording operation this lineage admits now, replacements
   * included — the same list `lifecycle record` checks against, so a CLI
   * command and an adapter command cannot disagree about what is legal
   * (consolidation design §12).
   */
  readonly permitted: readonly PermittedOperation[];
}

export interface LifecycleStatus {
  readonly lineages: readonly LineageStatus[];
  /** Validation problems found while deriving; empty for a coherent graph. */
  readonly problems: readonly Problem[];
}

/** `lifecycle next` for one lineage: the next permitted action, not executed. */
export interface NextAction {
  readonly intent?: string;
  /** Absent when there is no further lifecycle action. */
  readonly action?: LifecycleAction;
  /** True when the action needs a human: `lifecycle run` stops here. */
  readonly gate: boolean;
  readonly reason: string;
}

function findLineage(project: Project, intentId: string, lineages: readonly Lineage[]): Lineage {
  const lineage = lineages.find((candidate) => candidate.intent.id === intentId);
  if (lineage === undefined) {
    const exists = project.graph.nodes.some(
      (node) => node.id === intentId && node.type === "intent",
    );
    throw new PactwrightError(
      exists ? "ambiguous-lineage" : "unknown-intent",
      exists
        ? `intent "${intentId}" has an ambiguous lineage; fix validation problems first`
        : `"${intentId}" is not an intent in this project`,
    );
  }
  return lineage;
}

/**
 * The lineages `status`/`next`/`run` operate on: the one named by `intentId`,
 * else every lineage sorted by intent id. When the graph has no active
 * lineage and no id was given, one `undefined` entry stands for the
 * capture-intent entry point.
 */
export function selectLineages(
  project: Project,
  intentId?: string,
): readonly (Lineage | undefined)[] {
  const { lineages } = deriveLineages(project.graph.nodes, project.graph.edges);
  if (intentId !== undefined) return [findLineage(project, intentId, lineages)];
  if (!lineages.some(isActive)) return [...lineages, undefined];
  return lineages;
}

/**
 * The next action for a lineage: a Contract-crafting responsibility while the
 * lineage is upstream of a Brief, then the resolved shape's current step.
 */
export function nextActionFor(
  project: Project,
  lineage: Lineage | undefined,
  done: ReadonlySet<string> = new Set(),
): NextAction {
  const intent = lineage === undefined ? {} : { intent: lineage.intent.id };
  const pending = pendingResponsibilities(lineage).find((candidate) => !done.has(candidate));
  if (pending !== undefined) {
    const action = actionForResponsibility(project, pending);
    const gate = isActionGate(action);
    const who = action.actor === undefined ? "" : ` by ${action.actor}`;
    return {
      ...intent,
      action,
      gate,
      reason: gate
        ? `${pending} is a human gate (${action.execution}${who}); it waits for a human`
        : `${pending} runs ${action.execution}${who}`,
    };
  }

  if (inShapePhase(lineage)) {
    const execution = executionFor(project, lineage);
    const shape = project.lifecycle.shape;
    if (execution !== undefined) {
      const step = currentStep(shape, execution.state);
      if (step !== undefined && !done.has(step.name)) {
        const action = actionForStep(step);
        const gate = isGate(step);
        const who = step.actor === undefined ? "" : ` by ${step.actor}`;
        return {
          ...intent,
          action,
          gate,
          reason: gate
            ? `shape step "${step.name}" is a Gate (${step.execution}${who}); it waits for a human`
            : `shape step "${step.name}" runs ${step.execution}${who}`,
        };
      }
      if (execution.state.status === "blocked") {
        return {
          ...intent,
          gate: true,
          reason: `the "${execution.state.shape}" run for brief "${execution.state.brief}" is blocked and needs human intervention`,
        };
      }
    }
  }

  const reason =
    lineage?.superseded === true
      ? `intent "${lineage.intent.id}" is superseded; work continues on the superseding intent's lineage (Spec 01 §15)`
      : lineage?.state === "done"
        ? "current Evidence exists; the Delivery lifecycle is complete and has no next action"
        : lineage === undefined
          ? "nothing to do"
          : `lineage is ${lineage.state}; record a new Decision with approve-contract to resume (Spec 01 §15)`;
  return { ...intent, gate: false, reason };
}

function statusOf(project: Project, lineage: Lineage | undefined): LineageStatus {
  const next = nextActionFor(project, lineage);
  const execution = executionFor(project, lineage);
  const base: LineageStatus = {
    ...(lineage === undefined ? {} : { intent: lineage.intent.id, lineage }),
    state: lineage === undefined ? "none" : lineage.state,
    ...(lineage?.superseded === true ? { superseded: true } : {}),
    completedResponsibilities: completedResponsibilities(lineage),
    visited: execution?.state.visited ?? [],
    ...(execution === undefined
      ? {}
      : { shape: execution.state.shape, executionStatus: execution.state.status }),
    ...(next.action === undefined ? {} : { current: next.action }),
    permitted: permittedOperations(snapshotOf(project), lineage),
  };
  if (!next.gate || next.action === undefined) return base;
  return { ...base, blocked: next.action.name, requiredActor: next.action.actor ?? "human" };
}

/**
 * Derives lifecycle status from graph state, lifecycle policy, the resolved
 * shape and execution state (§20). Read-only: it never writes, and beginning
 * a run's state in memory does not persist it.
 */
export function lifecycleStatus(project: Project, intentId?: string): LifecycleStatus {
  const { problems } = deriveLineages(project.graph.nodes, project.graph.edges);
  const lineages = selectLineages(project, intentId);
  const executionProblems = lineages.flatMap(
    (lineage) => executionFor(project, lineage)?.problems ?? [],
  );
  return {
    lineages: lineages.map((lineage) => statusOf(project, lineage)),
    problems: [...problems, ...executionProblems],
  };
}

/** `lifecycle next`: the next permitted lifecycle action per lineage (§20). */
export function lifecycleNext(project: Project, intentId?: string): readonly NextAction[] {
  return selectLineages(project, intentId).map((lineage) => nextActionFor(project, lineage));
}

export { DIRECT_SHAPE_ID };
