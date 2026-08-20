import { PactwrightError, type Problem } from "../errors.js";
import type { Actor, StageName } from "../config/lifecycle.js";
import { deriveLineage, type Lineage } from "../graph/lineage.js";
import { loadProject, type Project } from "../loader.js";
import { isActive, isTransientStage, nextActionFor, selectLineages } from "./engine.js";

/** What a stage executor reports back to the runtime. */
export type StageOutcome =
  { readonly status: "completed" } | { readonly status: "failed"; readonly message: string };

export interface StageRequest {
  readonly stage: StageName;
  /**
   * Read-only derivation input (which lineage, which config) — never a
   * mutation base. Executors that mutate the graph pass
   * `project.paths.root` to the typed mutations, which load and validate
   * the current graph state themselves at commit time.
   */
  readonly project: Project;
  /** Absent for capture-intent on a graph with no active lineage. */
  readonly lineage?: Lineage;
}

/**
 * Executes one automatic stage's responsibility (Delivery Graph §16). The
 * runtime decides *which* stage runs and when; the executor only performs
 * it, mutating the graph through the Step 7 mutations where the stage
 * leaves a record. Later checkpoints plug the agent pack in here.
 */
export type StageExecutor = (request: StageRequest) => StageOutcome | Promise<StageOutcome>;

/** Why `lifecycle run` stopped (Delivery Graph §20). */
export type RunStop = "completed" | "human-gate" | "stage-failed" | "validation-error";

export interface RunResult {
  readonly intent?: string;
  readonly stop: RunStop;
  /** The gate reached or the stage that failed. */
  readonly stage?: StageName;
  readonly requiredActor?: Actor;
  /** Stages executed in this run, in order. */
  readonly executed: readonly StageName[];
  readonly message?: string;
  readonly problems?: readonly Problem[];
}

export interface RunOptions {
  readonly root: string;
  readonly execute: StageExecutor;
  readonly intentId?: string;
}

/**
 * The runtime has no way to perform automatic stages until an agent pack is
 * installed (Checkpoint 1, Step 10): every automatic stage fails, so `run`
 * stops there instead of pretending.
 */
export const noExecutor: StageExecutor = ({ stage }) => ({
  status: "failed",
  message: `no executor for automatic stage "${stage}"; agent-pack execution arrives with the default agent pack`,
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
  executed: StageName[],
): RunResult {
  return {
    ...(intent === undefined ? {} : { intent }),
    stop: "validation-error",
    executed,
    message: error.message,
    problems: error.problems,
  };
}

/** Runs one lineage (or the capture-intent entry point) until it stops. */
async function runLineage(
  options: RunOptions,
  intent: string | undefined,
  first: Project,
): Promise<RunResult> {
  const executed: StageName[] = [];
  const done = new Set<StageName>();
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

    const next = nextActionFor(project, lineage, done);
    if (next.stage === undefined) return { ...tag, stop: "completed", executed };
    if (next.gate) {
      return { ...tag, stop: "human-gate", stage: next.stage, requiredActor: "human", executed };
    }

    let outcome: StageOutcome;
    try {
      outcome = await options.execute({
        stage: next.stage,
        project,
        ...(lineage ? { lineage } : {}),
      });
    } catch (error) {
      outcome = {
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
    if (outcome.status === "failed") {
      return {
        ...tag,
        stop: "stage-failed",
        stage: next.stage,
        executed,
        message: outcome.message,
      };
    }
    executed.push(next.stage);

    // Repository state is re-read after every stage: a validation error stops the run.
    const reloaded = load(options.root);
    if (reloaded instanceof PactwrightError) return validationStop(intent, reloaded, executed);
    project = reloaded;

    if (isTransientStage(next.stage)) {
      done.add(next.stage);
      continue;
    }
    // A graph-marking stage must have advanced the lineage, else the run would loop forever.
    const advanced =
      intent === undefined
        ? selectLineages(project).some(
            (candidate) => candidate !== undefined && isActive(candidate),
          )
        : deriveLineage(intent, project.graph.nodes, project.graph.edges)?.state !== previousState;
    if (!advanced) {
      return {
        ...tag,
        stop: "stage-failed",
        stage: next.stage,
        executed,
        message: `${next.stage} completed without advancing the graph`,
      };
    }
    if (intent === undefined) {
      // capture-intent created the first active lineage(s); the caller picks them up.
      return { ...tag, stop: "completed", executed };
    }
  }
}

/**
 * `lifecycle run` (Delivery Graph §20): runs automatic stages of every
 * active lineage (or the one `intentId`) until a human gate, completion, a
 * stage failure or a validation error. Gates are checked by the runtime on
 * every step, so a configured gate is never skipped whatever the executor
 * could do. Never throws for expected failures.
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
