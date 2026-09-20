import type { Problem } from "../errors.js";
import type { Project } from "../loader.js";
import { snapshotOf, validateSnapshot } from "../validate/kernel.js";
import { environmentLockHash } from "./lock.js";

/**
 * The result of checking that the recorded environment still describes the
 * environment actually installed and resolvable.
 */
export interface EnvironmentAgreement {
  readonly ok: boolean;
  readonly problems: readonly Problem[];
  /** Present when the lock resolved: the exact environment identity. */
  readonly environmentLockHash?: string;
}

/**
 * Checks the Pactwright lock against the environment it claims to describe
 * (Distribution §§12–13, Checkpoint 1 Step 15).
 *
 * The checks themselves are the validation kernel's `environment` scope
 * (consolidation design §4), so `sync`, `doctor`, `validate`, the mutation
 * gate and `lifecycle run` cannot disagree about what agreement means. This
 * is the named entry point for callers that want only that scope and the
 * resulting environment identity.
 *
 * Read-only. It never repairs the lock as a side effect.
 */
export function checkEnvironmentAgreement(project: Project): EnvironmentAgreement {
  const problems = validateSnapshot(snapshotOf(project), new Set(["environment"]));
  return {
    ok: problems.length === 0,
    problems,
    environmentLockHash: environmentLockHash(project.lock),
  };
}
