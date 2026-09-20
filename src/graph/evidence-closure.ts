import type { Problem } from "../errors.js";
import type { LifecycleShape } from "../lifecycle/shape.js";
import { isGate, stepNamed } from "../lifecycle/shape.js";
import type { ExecutionState } from "../lifecycle/state.js";
import { gateActor, gateSatisfied } from "../lifecycle/transition.js";
import type { GraphNode } from "./nodes.js";

/**
 * The closure block Evidence carries (Core §14, "Closure provenance").
 *
 * The §53 preconditions are checked against execution state, and the run file
 * is deleted as soon as the run closes. After that a valid Evidence record
 * and one written by hand were indistinguishable: rule 12 exited on its first
 * line for a `done` lineage, and even if it had not, there was nothing left
 * to read. This is the durable record of what the runtime verified.
 *
 * Five facts, and nothing else. It reproduces neither the Contract, the Brief
 * nor any review text, and it introduces no Review or Delivery node (§13).
 */
export interface EvidenceClosure {
  /** The resolved shape the run executed (§23). */
  readonly shape: string;
  /** The delivered state's identity at closure. */
  readonly deliveredRevision: string;
  /** The identity the closing Review was taken against; equal to the above. */
  readonly reviewedRevision: string;
  /** The Review step that permitted closure. */
  readonly reviewStep: string;
  /** Gate step name → the actor that resolved it. */
  readonly gates: Readonly<Record<string, string>>;
}

/**
 * The runtime version from which Evidence carries a closure block.
 *
 * Evidence created before it has none and cannot honestly be given one: the
 * execution state it would be derived from is gone. Core §14 recognises such
 * a record as predating verifiable closure rather than as proof of it, so
 * rule 12 requires the block only from this date onwards and validates any
 * block it does find, whatever the record's age. A date, not a version,
 * because `created` is the only thing a record carries that can be compared.
 */
export const CLOSURE_PROVENANCE_FROM = "2026-09-20";

/** Whether `evidence` is old enough to predate closure provenance. */
export function predatesClosureProvenance(evidence: GraphNode): boolean {
  return evidence.created < CLOSURE_PROVENANCE_FROM;
}

/** Builds the block from the run state that has just satisfied the §53 checks. */
export function closureFrom(
  shape: LifecycleShape,
  state: ExecutionState,
): EvidenceClosure | undefined {
  if (state.review === undefined) return undefined;
  const gates: Record<string, string> = {};
  for (const name of Object.keys(state.gates).sort()) {
    gates[name] = state.gates[name]!.resolvedBy;
  }
  return {
    shape: shape.id,
    deliveredRevision: state.deliveredRevision ?? state.review.revision,
    reviewedRevision: state.review.revision,
    reviewStep: state.review.step,
    gates,
  };
}

/** The frontmatter shape of the block, for `serialiseNode`. */
export function closureFrontmatter(closure: EvidenceClosure): Record<string, unknown> {
  return {
    shape: closure.shape,
    delivered_revision: closure.deliveredRevision,
    reviewed_revision: closure.reviewedRevision,
    review_step: closure.reviewStep,
    gates: { ...closure.gates },
  };
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads the block from an Evidence record's frontmatter. `undefined` when
 * there is no `closure` key at all; a malformed one is reported by
 * `checkClosureBlock`.
 */
export function closureOf(evidence: GraphNode): unknown {
  return evidence.frontmatter["closure"];
}

/**
 * Validates one Evidence record's closure block against the resolved shape.
 *
 * A forged block is a question for Git history and Graph Review, not for the
 * validator, and Core §14 says so; this checks that a block is present where
 * one is required, well-formed, self-consistent, and describes a closure the
 * shape actually permits.
 */
export function checkClosureBlock(evidence: GraphNode, shape: LifecycleShape): readonly Problem[] {
  const problems: Problem[] = [];
  const at = (code: string, message: string): void => {
    problems.push({ code, message, path: evidence.path });
  };
  const raw = closureOf(evidence);

  if (raw === undefined) {
    if (predatesClosureProvenance(evidence)) return [];
    at(
      "missing-closure-provenance",
      `evidence "${evidence.id}" carries no closure block; the runtime writes one at /prepare-evidence from the §53 preconditions it verified (Spec 01 §14)`,
    );
    return problems;
  }

  if (!isStringRecord(raw)) {
    at("invalid-closure-provenance", `evidence "${evidence.id}" closure must be a mapping`);
    return problems;
  }

  const text = (key: string): string | undefined =>
    typeof raw[key] === "string" ? (raw[key] as string) : undefined;
  const shapeId = text("shape");
  const delivered = text("delivered_revision");
  const reviewed = text("reviewed_revision");
  const reviewStep = text("review_step");
  for (const [key, value] of [
    ["shape", shapeId],
    ["delivered_revision", delivered],
    ["reviewed_revision", reviewed],
    ["review_step", reviewStep],
  ] as const) {
    if (value === undefined || value.length === 0) {
      at(
        "invalid-closure-provenance",
        `evidence "${evidence.id}" closure.${key} must be a non-empty string`,
      );
    }
  }
  const rawGates = raw["gates"] ?? {};
  if (!isStringRecord(rawGates)) {
    at("invalid-closure-provenance", `evidence "${evidence.id}" closure.gates must be a mapping`);
    return problems;
  }
  if (problems.length > 0) return problems;

  // The reviewed state is the delivered state. A divergence is exactly the
  // R02 case: a delivery change after the Review it claims to rest on.
  if (delivered !== reviewed) {
    at(
      "unreviewed-delivered-state",
      `evidence "${evidence.id}" closes delivered state "${delivered!}" but its Review was taken against "${reviewed!}"; a delivery change after Review requires Review of the new delivered state (Spec 01 §53)`,
    );
  }

  if (shapeId !== shape.id) {
    at(
      "invalid-closure-provenance",
      `evidence "${evidence.id}" closure.shape is "${shapeId!}" but the project's resolved shape is "${shape.id}"`,
    );
  } else {
    const step = stepNamed(shape, reviewStep!);
    if (step === undefined || step.kind !== "review") {
      at(
        "invalid-closure-provenance",
        `evidence "${evidence.id}" closure.review_step "${reviewStep!}" is not a Review step of the "${shape.id}" shape`,
      );
    }
    // Every Gate the shape declares must have been resolved by an actor its
    // authority admits — the same predicate the reducer and rule 14 apply.
    const gates: Record<string, { readonly resolvedBy: string }> = {};
    for (const [name, value] of Object.entries(rawGates)) {
      if (typeof value === "string") gates[name] = { resolvedBy: value };
    }
    for (const declared of shape.steps) {
      if (!isGate(declared)) continue;
      if (gateSatisfied(declared, gates)) continue;
      const recorded = gates[declared.name];
      at(
        "unauthorised-closure-gate",
        recorded === undefined
          ? `evidence "${evidence.id}" records no resolution for Gate "${declared.name}", which requires ${gateActor(declared)} authority`
          : `evidence "${evidence.id}" records Gate "${declared.name}" resolved by "${recorded.resolvedBy}", which is not ${gateActor(declared)} authority`,
      );
    }
  }
  return problems;
}
