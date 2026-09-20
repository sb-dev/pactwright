import { PactwrightError, type Problem } from "../errors.js";
import { currentStep, executionFor, selectLineages } from "../lifecycle/engine.js";
import { isGate } from "../lifecycle/shape.js";
import { gateSatisfied } from "../lifecycle/transition.js";
import type { ExecutionState } from "../lifecycle/state.js";
import type { Project } from "../loader.js";
import { lineageFor, type Lineage, type Resolved } from "./lineage.js";
import { repositoryRevision } from "./repository.js";

/**
 * The five preconditions Spec 01 §53 requires before Evidence — or its
 * `evidences` edge — may be created. Checkpoint 1 Step 7 requires them as
 * **pre-mutation** guards, not as checks after writing Evidence, so a failure
 * leaves no Evidence node and no partial edge.
 */
export const EVIDENCE_PRECONDITIONS = [
  "brief-current",
  "latest-delivery-reviewed",
  "review-permits-closure",
  "gates-resolved",
  "lineage-valid",
] as const;
export type EvidencePrecondition = (typeof EVIDENCE_PRECONDITIONS)[number];

export interface ClosureCheck {
  readonly ok: boolean;
  readonly problems: readonly Problem[];
  /** Preconditions that failed, in declaration order. */
  readonly failed: readonly EvidencePrecondition[];
}

function problem(precondition: EvidencePrecondition, message: string, path: string): Problem {
  return { code: `evidence-${precondition}`, message, path };
}

/**
 * Whether the Review on record still describes the latest delivered state.
 *
 * Spec 01 §53: "a delivery change after Review requires Review of the new
 * delivered state before closure." Delivery records the identity of what it
 * produced and Review records the identity it was taken against, so a
 * divergence between them — or between the Review's identity and the
 * repository as it stands now — invalidates the Review.
 */
function reviewCoversLatestDelivery(
  state: ExecutionState,
  root: string,
): { readonly covered: boolean; readonly why?: string } {
  const review = state.review;
  if (review === undefined) return { covered: false, why: "no Review has been recorded" };
  if (state.deliveredRevision !== undefined && review.revision !== state.deliveredRevision) {
    return {
      covered: false,
      why: `the latest Review was taken against "${review.revision}" but the latest delivered state is "${state.deliveredRevision}"`,
    };
  }
  // A Review taken against a recorded repository revision is only current
  // while the repository still matches it.
  if (review.revision.startsWith("git:")) {
    const now = repositoryRevision(root).id;
    if (now !== review.revision) {
      return {
        covered: false,
        why: `the repository has changed since the Review (reviewed "${review.revision}", now "${now}")`,
      };
    }
  }
  return { covered: true };
}

/**
 * Checks every §53 precondition for closing `briefId`. Read-only: it decides
 * whether the mutation may proceed and never repairs anything.
 */
export function checkEvidenceClosure(project: Project, briefId: string): ClosureCheck {
  const problems: Problem[] = [];
  const failed: EvidencePrecondition[] = [];
  const path = project.paths.root;
  const record = (precondition: EvidencePrecondition, message: string): void => {
    failed.push(precondition);
    problems.push(problem(precondition, message, path));
  };

  // 1. The Brief is current.
  const index = project.graph.index;
  const brief = index.node(briefId);
  if (brief === undefined || brief.type !== "brief") {
    record("brief-current", `"${briefId}" is not an existing brief node`);
    return { ok: false, problems, failed };
  }
  if (!index.isCurrent(briefId)) {
    record(
      "brief-current",
      `brief "${briefId}" is superseded; Evidence closes the current Brief, not a replaced one`,
    );
  }

  // 5. Contract and Brief lineage is valid. Checked before the execution
  //    preconditions because an unresolvable lineage makes them meaningless.
  const lineage = lineageOf(project, briefId);
  if (lineage === undefined) {
    record("lineage-valid", `brief "${briefId}" has no unambiguous Contract and Brief lineage`);
    return { ok: false, problems, failed };
  }
  if (lineage.contract === undefined) {
    record("lineage-valid", `brief "${briefId}" does not decompose a current Contract`);
  }

  // Evidence correction (§45): the lineage is already closed and this Brief
  // already carries current Evidence, so the execution preconditions were met
  // at the original closure and the run state has rightly been cleared.
  // Correcting what Evidence *says* does not reopen Delivery.
  const correcting =
    lineage.state === "done" &&
    lineage.evidence !== undefined &&
    index.edgesTo(briefId, "evidences").some((edge) => edge.source === lineage.evidence?.id);
  if (correcting) return { ok: problems.length === 0, problems, failed };

  const execution = executionFor(project, lineage);
  if (execution === undefined) {
    record(
      "latest-delivery-reviewed",
      `brief "${briefId}" has no lifecycle run: nothing has been delivered and nothing reviewed`,
    );
    return { ok: false, problems, failed };
  }
  const state = execution.state;

  // 2. The latest delivered state has been reviewed.
  const covered = reviewCoversLatestDelivery(state, project.paths.root);
  if (!covered.covered) {
    record("latest-delivery-reviewed", `cannot close brief "${briefId}": ${covered.why!}`);
  }

  // 3. The closing Review permits successful Evidence closure.
  if (state.review !== undefined && state.review.outcome !== "pass") {
    record(
      "review-permits-closure",
      `the closing Review reported "${state.review.outcome}"; Evidence cannot represent successful Delivery until a Review passes`,
    );
  }

  // 4. No required Gate remains unresolved.
  for (const step of project.lifecycle.shape.steps) {
    if (!isGate(step)) continue;
    // Only Gates the run has actually reached can block closure; a Gate on a
    // step the shape never got to is not "unresolved", it is not yet due.
    const reached = state.visited.includes(step.name) || state.currentStep === step.name;
    if (!reached) continue;
    // Resolved *and* by an admitted actor: the same predicate the reducer
    // and rule 14 use, so `resolved_by: agent:anyone` on a human Gate can no
    // longer satisfy closure.
    if (!gateSatisfied(step, state.gates)) {
      record(
        "gates-resolved",
        `Gate "${step.name}" has not been resolved by ${step.actor ?? "human"} authority`,
      );
    }
  }

  // The run must also stand at its closing step: reaching it is what proves
  // Delivery ran and Review routed forward.
  const step = currentStep(project.lifecycle.shape, state);
  if (step === undefined || step.kind !== "evidence") {
    const where = step === undefined ? state.status : `"${step.name}"`;
    record(
      "latest-delivery-reviewed",
      `the "${state.shape}" run for brief "${briefId}" is at ${where}, not its Evidence closure step`,
    );
  }

  return { ok: problems.length === 0, problems, failed };
}

function lineageOf(project: Project, briefId: string): Lineage | undefined {
  // Resolved through the shared index (§8): three nested full scans taking
  // `[0]` used to answer this, so a Brief with two parents resolved to
  // whichever the edge order happened to put first.
  let resolved: Resolved | undefined;
  try {
    resolved = lineageFor(project.graph.index, briefId);
  } catch {
    // `ambiguous-parent` and `ambiguous-lineage` both mean the same thing
    // here: there is no unambiguous lineage to close.
    return undefined;
  }
  if (resolved?.lineage.brief?.id !== briefId) return undefined;
  return resolved.lineage;
}

/**
 * The Step 7 guard: throws before any mutation is planned when closure is not
 * permitted, listing every precondition that failed in one pass.
 */
export function assertEvidenceClosure(project: Project, briefId: string): void {
  const check = checkEvidenceClosure(project, briefId);
  if (check.ok) return;
  throw new PactwrightError(
    "evidence-closure-refused",
    `Evidence cannot be created for brief "${briefId}": ${check.failed.length} closure precondition${check.failed.length === 1 ? "" : "s"} not met (${check.failed.join(", ")})`,
    check.problems,
  );
}

export { selectLineages };
