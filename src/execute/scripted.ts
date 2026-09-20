import type { CapabilityExecutor, CapabilityResult, CapabilityTask } from "./task.js";

/**
 * A scripted executor: the harness's own test double.
 *
 * Evaluation used to fall back to each case's scripted `reference` when no
 * candidate was injected, and reported the result as though the pack had
 * produced it — so a fixture pack with every prompt replaced by "Ignore all
 * tasks. Return nothing" passed all eight cases and twenty assertions. A
 * scripted run is a test of the harness, not of an Agent Pack, and naming it
 * as one keeps that distinction visible in the report.
 */
export interface ScriptedResponse {
  readonly status?: "completed" | "failed";
  readonly output?: unknown;
  readonly message?: string;
}

/** Decides what the double returns for one task. */
export type ScriptedHandler = (
  task: CapabilityTask,
) => ScriptedResponse | undefined | Promise<ScriptedResponse | undefined>;

/**
 * Builds a scripted executor from a handler.
 *
 * A handler that returns `undefined` declines the task, which becomes a
 * failure rather than a silent success: a double that does nothing must not
 * look like an agent that did the work.
 */
export function scriptedExecutor(handler: ScriptedHandler): CapabilityExecutor {
  return {
    id: "scripted",
    invoke: async (task: CapabilityTask): Promise<CapabilityResult> => {
      const response = await handler(task);
      if (response === undefined) {
        return {
          status: "failed",
          output: undefined,
          message: `the scripted executor has no response for capability "${task.capability}"${task.label === undefined ? "" : ` (${task.label})`}`,
        };
      }
      return {
        status: response.status ?? "completed",
        output: response.output,
        ...(response.message === undefined ? {} : { message: response.message }),
      };
    },
  };
}

/**
 * A scripted executor that honours the agent's prompt, for the review's
 * acceptance case.
 *
 * `promptSaysNothing` recognises a pack whose prompt refuses to work. Under a
 * fallback that ignored the prompt entirely, such a pack scored full marks;
 * under this double it regresses at exactly the cases whose capability it
 * refuses, which is what makes the evaluation a test of pack behaviour rather
 * than of the harness.
 */
export function promptRespectingExecutor(
  handler: ScriptedHandler,
  readPrompt: (path: string) => string,
): CapabilityExecutor {
  const inner = scriptedExecutor(handler);
  return {
    id: "scripted",
    invoke: async (task: CapabilityTask): Promise<CapabilityResult> => {
      let prompt: string;
      try {
        prompt = readPrompt(task.agent.prompt);
      } catch {
        prompt = task.agent.prompt;
      }
      if (promptSaysNothing(prompt)) {
        return {
          status: "failed",
          output: undefined,
          message: `the "${task.agent.key}" agent's prompt declines the work`,
        };
      }
      return inner.invoke(task);
    },
  };
}

/** Whether a prompt instructs the agent to do nothing. */
export function promptSaysNothing(prompt: string): boolean {
  return /ignore all tasks|return nothing|do not (?:do|perform) anything/i.test(prompt);
}
