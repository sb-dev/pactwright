import type { Problem } from "../errors.js";
import { PactwrightError } from "../errors.js";
import {
  CORE_STAGES,
  isHumanGate,
  type Actor,
  type ExecutionMode,
  type StageName,
} from "../config/lifecycle.js";
import { deriveLineages, type DeliveryState, type Lineage } from "../graph/lineage.js";
import type { Project } from "../loader.js";

/**
 * Stages that leave a durable record in the Delivery Graph, and the record
 * they leave (Delivery Graph §§6–12): capture-intent → Intent,
 * approve-contract → Decision (+ Contract), write-brief → Brief,
 * prepare-evidence → Evidence.
 */
export const GRAPH_MARKING_STAGES = [
  "capture-intent",
  "approve-contract",
  "write-brief",
  "prepare-evidence",
] as const satisfies readonly StageName[];

/**
 * Stages whose output is transient (§7 alternatives, §11 delivery execution
 * and review): they never mutate the graph, so completion is only known
 * inside the `lifecycle run` that executed them.
 */
export const TRANSIENT_STAGES = [
  "propose-contracts",
  "deliver-brief",
  "review",
] as const satisfies readonly StageName[];

export function isTransientStage(stage: StageName): boolean {
  return (TRANSIENT_STAGES as readonly StageName[]).includes(stage);
}

/**
 * How many leading core stages each derived state has completed (§14, §18).
 * `deferred`/`rejected` completed the decision stage and are terminal for the
 * core lifecycle: resuming needs a new Decision (§15), which is not a stage
 * the engine loops back to. `undefined` = no lineage yet: nothing completed.
 */
const COMPLETED_COUNT: Readonly<Record<DeliveryState, number>> = {
  open: 1, // capture-intent
  deferred: 3, // …propose-contracts, approve-contract
  rejected: 3,
  contracted: 3,
  delivering: 4, // …write-brief
  done: 7,
};

const TERMINAL_STATES: readonly DeliveryState[] = ["deferred", "rejected", "done"];

/** Stages already completed by a lineage, in lifecycle order. */
export function completedStages(lineage: Lineage | undefined): readonly StageName[] {
  return CORE_STAGES.slice(0, lineage === undefined ? 0 : COMPLETED_COUNT[lineage.state]);
}

/**
 * Stages still to run for a lineage, in order. Empty for terminal lineages.
 * With no lineage, the only pending stage is capture-intent.
 */
export function pendingStages(lineage: Lineage | undefined): readonly StageName[] {
  if (lineage === undefined) return ["capture-intent"];
  if (TERMINAL_STATES.includes(lineage.state)) return [];
  return CORE_STAGES.slice(COMPLETED_COUNT[lineage.state]);
}

/** A lineage still progressing through the core lifecycle. */
export function isActive(lineage: Lineage): boolean {
  return !TERMINAL_STATES.includes(lineage.state);
}

/** `lifecycle status` for one lineage (Delivery Graph §20). */
export interface LineageStatus {
  /** Absent for the "no lineage yet" entry. */
  readonly intent?: string;
  readonly state: DeliveryState | "none";
  readonly completed: readonly StageName[];
  /** First pending stage; absent when the core lifecycle has no next stage. */
  readonly currentStage?: StageName;
  /** Set when `currentStage` is a human gate. */
  readonly blockedStage?: StageName;
  readonly requiredActor?: Actor;
  readonly lineage?: Lineage;
}

export interface LifecycleStatus {
  readonly lineages: readonly LineageStatus[];
  /** Current-lineage problems found while deriving (empty for a loaded project). */
  readonly problems: readonly Problem[];
}

/** `lifecycle next` for one lineage: the next permitted action, not executed. */
export interface NextAction {
  readonly intent?: string;
  /** Absent when there is no further core Delivery stage. */
  readonly stage?: StageName;
  readonly execution?: ExecutionMode;
  readonly actor?: Actor;
  /** True when the stage needs a human: `lifecycle run` stops here. */
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
      "unknown-intent",
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

function statusOf(project: Project, lineage: Lineage | undefined): LineageStatus {
  const currentStage = pendingStages(lineage)[0];
  const base: LineageStatus = {
    ...(lineage === undefined ? {} : { intent: lineage.intent.id, lineage }),
    state: lineage === undefined ? "none" : lineage.state,
    completed: completedStages(lineage),
    ...(currentStage === undefined ? {} : { currentStage }),
  };
  if (currentStage === undefined) return base;
  const config = project.lifecycle.stages[currentStage];
  if (!isHumanGate(config)) return base;
  return { ...base, blockedStage: currentStage, requiredActor: "human" };
}

/**
 * Derives lifecycle status from graph state + lifecycle.yml (§18, §20).
 * Validation problems of a project that failed to load are the caller's to
 * report: a `Project` here has already passed the canonical loader.
 */
export function lifecycleStatus(project: Project, intentId?: string): LifecycleStatus {
  const { problems } = deriveLineages(project.graph.nodes, project.graph.edges);
  return {
    lineages: selectLineages(project, intentId).map((lineage) => statusOf(project, lineage)),
    problems,
  };
}

/** The next permitted action for one lineage, given optionally which transient stages already ran. */
export function nextActionFor(
  project: Project,
  lineage: Lineage | undefined,
  done: ReadonlySet<StageName> = new Set(),
): NextAction {
  const intent = lineage === undefined ? {} : { intent: lineage.intent.id };
  const stage = pendingStages(lineage).find((candidate) => !done.has(candidate));
  if (stage === undefined) {
    const reason =
      lineage?.state === "done"
        ? "current Evidence exists; the core Delivery lifecycle is complete and has no next stage"
        : `lineage is ${lineage?.state}; resuming needs a new Decision (Delivery Graph §15)`;
    return { ...intent, gate: false, reason };
  }
  const config = project.lifecycle.stages[stage];
  const gate = isHumanGate(config);
  const who = config.actor === undefined ? "" : ` by ${config.actor}`;
  return {
    ...intent,
    stage,
    execution: config.execution,
    ...(config.actor === undefined ? {} : { actor: config.actor }),
    gate,
    reason: gate
      ? `${stage} is a human gate (${config.execution}${who}); it waits for a human`
      : `${stage} runs ${config.execution}${who}`,
  };
}

/** `lifecycle next`: the next permitted core Delivery action per lineage (§20). */
export function lifecycleNext(project: Project, intentId?: string): readonly NextAction[] {
  return selectLineages(project, intentId).map((lineage) => nextActionFor(project, lineage));
}
