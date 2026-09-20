import type { DeliveryContext } from "../context.js";

/**
 * One capability execution (consolidation design §5).
 *
 * `ActionExecutor` in the lifecycle and `CandidateRunner` in evaluation asked
 * for the same work — a capability, the pack agent that implements it, an
 * instruction, a root, and a structured result — through two unrelated
 * types. The only implementations were `noExecutor`, which performs nothing,
 * and evaluation's reference fallback, which discarded the instruction, the
 * capability and the agent and ran the case's own scripted reference. The CLI
 * supplied neither seam, so replacing every prompt in a pack changed its
 * hashes and nothing else.
 */
export interface CapabilityTask {
  /** The core capability being performed, e.g. `delivery-execution`. */
  readonly capability: string;
  /** The pack agent that implements it. */
  readonly agent: {
    readonly key: string;
    /** Absolute path of the agent's prompt file, or the prompt text itself. */
    readonly prompt: string;
    readonly skills: readonly string[];
  };
  /** What to do, built from the same command template the adapter renders. */
  readonly instruction: string;
  /** The project or sandbox root to act in. */
  readonly root: string;
  /** Bounded Delivery context, where the caller has assembled it. */
  readonly context?: DeliveryContext;
  /** Identifies the work for logs and provenance; an evaluation case id, say. */
  readonly label?: string;
}

/** What one execution cost, where the tool reports it. */
export interface CapabilityCost {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  /** Total cost in US dollars, as the tool reported it. */
  readonly usd?: number;
}

export interface CapabilityResult {
  readonly status: "completed" | "failed";
  /**
   * The agent's structured proposal. The runtime decides what becomes graph
   * truth: the agent proposes, the runtime disposes, and every canonical
   * write stays behind the mutation guards.
   */
  readonly output: unknown;
  readonly message?: string;
  readonly cost?: CapabilityCost;
  /**
   * Permissions the tool refused, where it reports them as structured data.
   * An environment failure is a different thing from work done badly, and the
   * lifecycle cares about the difference.
   */
  readonly denials?: readonly string[];
}

/** The declared executors (Distribution §3). Small enough to enumerate. */
export const EXECUTOR_IDS = ["none", "scripted", "claude-code"] as const;
export type ExecutorId = (typeof EXECUTOR_IDS)[number];

export interface CapabilityExecutor {
  readonly id: ExecutorId;
  invoke(task: CapabilityTask): Promise<CapabilityResult>;
}

/**
 * The executor a project has until it declares one.
 *
 * `lifecycle run` fails at the first automatic step rather than pretending
 * the responsibility was discharged, and evaluation reports that pack
 * behaviour was not evaluated. That refusal is the safe state, not a
 * deficiency to be removed: an installed binary is not consent to run an
 * autonomous agent against a repository.
 */
export const noneExecutor: CapabilityExecutor = {
  id: "none",
  invoke: (task) =>
    Promise.resolve({
      status: "failed",
      output: undefined,
      message: `no executor is configured, so capability "${task.capability}" was not performed; declare one with execution.executor in .pactwright/config.yml`,
    }),
};
