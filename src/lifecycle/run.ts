import { PactwrightError, type Problem } from "../errors.js";
import { isRecordingResponsibility, type Actor } from "../config/lifecycle.js";
import { deriveLineage, type Lineage } from "../graph/lineage.js";
import { loadProject, type Project } from "../loader.js";
import {
  executionFor,
  inShapePhase,
  isActive,
  nextActionFor,
  selectLineages,
  type LifecycleAction,
} from "./engine.js";
import { transition } from "./transition.js";
import {
  clearExecutionState,
  routeKey,
  writeExecutionState,
  type ExecutionState,
  type ReviewOutcome,
} from "./state.js";

/** What an executor reports back to the runtime. */
export type ActionOutcome =
  | {
      readonly status: "completed";
      /** Required from a Review step: what it concluded (§32). */
      readonly review?: ReviewOutcome;
      /** The delivered state's identity, recorded by a Delivery step. */
      readonly revision?: string;
    }
  | { readonly status: "failed"; readonly message: string };

export interface ActionRequest {
  readonly action: LifecycleAction;
  /**
   * Read-only derivation input (which lineage, which policy) — never a
   * mutation base. Executors that mutate the graph pass `project.paths.root`
   * to the typed mutations, which load and validate the current graph state
   * themselves at commit time.
   */
  readonly project: Project;
  /** Absent for capture-intent on a graph with no active lineage. */
  readonly lineage?: Lineage;
  /** The run this action belongs to; absent for Contract-crafting responsibilities. */
  readonly execution?: ExecutionState;
}

/**
 * Performs one automatic lifecycle action. The runtime decides *which* action
 * runs and when, enforces Gates and bounded iteration, and owns every
 * canonical mutation; the executor only performs the responsibility, through
 * the selected Agent Pack's capability.
 */
export type ActionExecutor = (request: ActionRequest) => ActionOutcome | Promise<ActionOutcome>;

/** Why `lifecycle run` stopped (§20). */
export type RunStop = "completed" | "human-gate" | "stage-failed" | "validation-error" | "blocked";

export interface RunResult {
  readonly intent?: string;
  readonly stop: RunStop;
  /** The gate reached, the step that failed, or the blocked step. */
  readonly action?: string;
  readonly requiredActor?: Actor;
  /** Actions executed in this run, in order. */
  readonly executed: readonly string[];
  readonly message?: string;
  readonly problems?: readonly Problem[];
}

export interface RunOptions {
  readonly root: string;
  readonly execute: ActionExecutor;
  readonly intentId?: string;
}

/**
 * The executor a project has before an Agent Pack capability runner is
 * configured: it performs nothing, so `run` stops at the first automatic
 * action rather than pretending the responsibility was discharged.
 */
export const noExecutor: ActionExecutor = ({ action }) => ({
  status: "failed",
  message: `no executor configured for automatic ${action.kind} "${action.name}"`,
});

function load(root: string): Project | PactwrightError {
  try {
    return loadProject({ root });
  } catch (error) {
    if (error instanceof PactwrightError) return error;
    throw error;
  }
}

function validationStop(
  intent: string | undefined,
  error: PactwrightError,
  executed: readonly string[],
): RunResult {
  return {
    ...(intent === undefined ? {} : { intent }),
    stop: "validation-error",
    executed: [...executed],
    message: error.message,
    problems: error.problems,
  };
}

/**
 * Applies a completed shape step through the shared reducer and maps its
 * outcome onto a run stop. The routing, the Gate guard and the bounded
 * iteration counter all live in `transition`; this is the only thing left
 * that is specific to the automatic loop.
 */
function advance(
  project: Project,
  state: ExecutionState,
  stepName: string,
  outcome: Extract<ActionOutcome, { status: "completed" }>,
): { readonly state: ExecutionState; readonly stop?: RunStop; readonly message?: string } {
  const result = transition(project.lifecycle.shape, project.lifecycle, state, {
    kind: "step-completed",
    step: stepName,
    ...(outcome.review === undefined ? {} : { review: outcome.review }),
    ...(outcome.revision === undefined ? {} : { revision: outcome.revision }),
  });
  switch (result.outcome) {
    case "refused":
    case "failed":
      // A refusal returns the state unchanged, so nothing is written for it;
      // either way the run reports why and stops.
      return {
        state: result.state,
        stop: "stage-failed",
        ...(result.reason === undefined ? {} : { message: result.reason }),
      };
    case "blocked":
      return {
        state: result.state,
        stop: "blocked",
        message: result.reason ?? `the run is blocked at "${stepName}"`,
      };
    default:
      // `advanced`, `completed`, and `waiting-gate` — the step completed and
      // the run moved onto a Gate. The state records `waiting-gate`; the
      // loop's own Gate check then reports *which* Gate and whose authority
      // it needs, which a stop here could not name.
      return { state: result.state };
  }
}

/** Runs one lineage (or the capture-intent entry point) until it stops. */
async function runLineage(
  options: RunOptions,
  intent: string | undefined,
  first: Project,
): Promise<RunResult> {
  const executed: string[] = [];
  const done = new Set<string>();
  let project = first;
  let previousState: string | undefined;
  const tag = intent === undefined ? {} : { intent };

  for (;;) {
    let lineage: Lineage | undefined;
    if (intent !== undefined) {
      lineage = deriveLineage(intent, project.graph.nodes, project.graph.edges);
      if (lineage === undefined) {
        // The loader validated the graph, so only a vanished intent gets here.
        return {
          ...tag,
          stop: "validation-error",
          executed,
          message: `intent "${intent}" has no unambiguous lineage`,
        };
      }
      if (lineage.state !== previousState) done.clear();
      previousState = lineage.state;
    }

    let execution = executionFor(project, lineage);

    // Execution state that does not parse is a stop, not a fresh start.
    // `executionFor` synthesises a pristine run when the document fails to
    // parse, so an unreadable state file silently restarted the shape from
    // its first step — and, with an executor that keeps succeeding, looped.
    if (execution !== undefined && execution.problems.length > 0) {
      return {
        ...tag,
        stop: "validation-error",
        executed,
        message: `the run state for brief "${execution.state.brief}" cannot be read`,
        problems: execution.problems,
      };
    }

    // A failed run is resumed, not walked past. Treating "no next action" as
    // completion is what made a second `lifecycle run` report `stop:
    // completed` with an empty `executed` list while the lineage was still
    // delivering and had no Evidence.
    if (execution?.state.status === "failed") {
      const resumed = transition(project.lifecycle.shape, project.lifecycle, execution.state, {
        kind: "resume",
      });
      if (resumed.outcome === "refused") {
        return {
          ...tag,
          stop: "stage-failed",
          executed,
          ...(resumed.reason === undefined ? {} : { message: resumed.reason }),
        };
      }
      writeExecutionState(options.root, resumed.state);
      execution = { state: resumed.state, problems: execution.problems };
    }

    const next = nextActionFor(project, lineage, done);
    if (next.action === undefined) {
      if (execution?.state.status === "blocked") {
        return { ...tag, stop: "blocked", executed, message: next.reason };
      }
      if (execution !== undefined && lineage !== undefined && lineage.state === "delivering") {
        // The run has no action but the lineage is not closed: that is a
        // stop to explain, never a completion to claim.
        return { ...tag, stop: "blocked", executed, message: next.reason };
      }
      return { ...tag, stop: "completed", executed };
    }
    // The Gate check happens on every step, before the executor is consulted,
    // so a configured Gate is never skipped whatever the executor could do.
    if (next.gate) {
      return {
        ...tag,
        stop: "human-gate",
        action: next.action.name,
        requiredActor: next.action.actor ?? "human",
        executed,
      };
    }

    let outcome: ActionOutcome;
    try {
      outcome = await options.execute({
        action: next.action,
        project,
        ...(lineage ? { lineage } : {}),
        ...(execution ? { execution: execution.state } : {}),
      });
    } catch (error) {
      outcome = {
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
    if (outcome.status === "failed") {
      if (execution !== undefined && next.action.kind === "step") {
        const failed = transition(project.lifecycle.shape, project.lifecycle, execution.state, {
          kind: "step-failed",
          step: next.action.name,
          message: outcome.message,
        });
        if (failed.outcome !== "refused") writeExecutionState(options.root, failed.state);
      }
      return {
        ...tag,
        stop: "stage-failed",
        action: next.action.name,
        executed,
        message: outcome.message,
      };
    }
    executed.push(next.action.name);

    // Repository state is re-read after every action: a validation error stops the run.
    const reloaded = load(options.root);
    if (reloaded instanceof PactwrightError) return validationStop(intent, reloaded, executed);
    project = reloaded;

    if (next.action.kind === "step") {
      if (execution === undefined) {
        return {
          ...tag,
          stop: "stage-failed",
          action: next.action.name,
          executed,
          message: `shape step "${next.action.name}" ran without execution state`,
        };
      }
      const advanced = advance(project, execution.state, next.action.name, outcome);
      const closed =
        intent !== undefined &&
        deriveLineage(intent, project.graph.nodes, project.graph.edges)?.state === "done";
      if (closed) {
        // Evidence closed the lineage: the run is over and its progression
        // state has nothing left to govern.
        clearExecutionState(options.root, execution.state.brief);
        return { ...tag, stop: "completed", executed };
      }
      // A refusal returns the state unchanged; there is nothing to write.
      if (advanced.state !== execution.state) writeExecutionState(options.root, advanced.state);
      if (advanced.stop !== undefined) {
        return {
          ...tag,
          stop: advanced.stop,
          action: next.action.name,
          executed,
          ...(advanced.message === undefined ? {} : { message: advanced.message }),
        };
      }
      if (advanced.state.status === "completed") return { ...tag, stop: "completed", executed };
      continue;
    }

    // A responsibility whose output is transient leaves no graph trace, so
    // its completion is only known inside this run.
    if (!isRecordingResponsibility(next.action.name)) {
      done.add(next.action.name);
      continue;
    }

    // A recording responsibility must have advanced the lineage, else the
    // run would loop forever.
    const advancedGraph =
      intent === undefined
        ? selectLineages(project).some(
            (candidate) => candidate !== undefined && isActive(candidate),
          )
        : deriveLineage(intent, project.graph.nodes, project.graph.edges)?.state !== previousState;
    if (!advancedGraph) {
      return {
        ...tag,
        stop: "stage-failed",
        action: next.action.name,
        executed,
        message: `${next.action.name} completed without advancing the graph`,
      };
    }
    if (intent === undefined) {
      // capture-intent created the first active lineage(s); the caller picks them up.
      return { ...tag, stop: "completed", executed };
    }
  }
}

/**
 * `lifecycle run` (§20): runs automatic actions of every active lineage (or
 * the one `intentId`) until a Gate, completion, a block, an execution failure
 * or a validation failure. It cannot skip a Gate, cannot invent a transition
 * and cannot create Evidence before the closure guards pass. Never throws for
 * expected failures.
 */
export async function runLifecycle(options: RunOptions): Promise<readonly RunResult[]> {
  const project = load(options.root);
  if (project instanceof PactwrightError) return [validationStop(options.intentId, project, [])];
  let targets: readonly (Lineage | undefined)[];
  try {
    targets = selectLineages(project, options.intentId);
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    return [validationStop(options.intentId, error, [])];
  }
  const results: RunResult[] = [];
  let current = project;
  for (const target of targets) {
    const result = await runLineage(options, target?.intent.id, current);
    results.push(result);
    if (target === undefined && result.stop === "completed" && result.executed.length > 0) {
      // capture-intent ran: continue with the lineages it created, reloading
      // before each one so lineage N+1 starts from the graph lineage N wrote.
      const reloaded = load(options.root);
      if (reloaded instanceof PactwrightError) {
        results.push(validationStop(undefined, reloaded, []));
        break;
      }
      const createdIds = selectLineages(reloaded)
        .filter((created): created is Lineage => created !== undefined && isActive(created))
        .map((created) => created.intent.id);
      for (const created of createdIds) {
        const fresh = load(options.root);
        if (fresh instanceof PactwrightError) {
          results.push(validationStop(created, fresh, []));
          break;
        }
        results.push(await runLineage(options, created, fresh));
      }
      break;
    }
    const reloaded = load(options.root);
    if (reloaded instanceof PactwrightError) break;
    current = reloaded;
  }
  return results;
}

export { inShapePhase, routeKey };
