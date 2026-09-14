/**
 * Execution-policy primitives shared by the contract-crafting
 * responsibilities and the lifecycle shape (Spec 01 §26). They live apart
 * from both so the shape parser and the responsibility parser can use them
 * without importing each other.
 */

export const EXECUTION_MODES = ["manual", "automatic"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const ACTORS = ["human", "agent"] as const;
export type Actor = (typeof ACTORS)[number];

/** Policy attached to one responsibility or shape step. */
export interface StepPolicy {
  readonly execution: ExecutionMode;
  readonly actor?: Actor;
}
