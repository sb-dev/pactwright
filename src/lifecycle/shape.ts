import type { ParseResult } from "../config/config.js";
import {
  ACTORS,
  EXECUTION_MODES,
  type Actor,
  type ExecutionMode,
} from "../config/lifecycle-policy.js";
import {
  Checker,
  expectEnum,
  expectInteger,
  expectRecord,
  expectString,
  isRecord,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";

/**
 * The closed core shape-step vocabulary (Spec 01 §25, invariants 2, 3, 10 and
 * 11). A shape may order and repeat these steps; it may not invent new ones,
 * so domain-specific production stages can never enter the core shape.
 */
export const SHAPE_STEP_KINDS = ["delivery", "review", "evidence"] as const;
export type ShapeStepKind = (typeof SHAPE_STEP_KINDS)[number];

/**
 * The core capability each step kind delegates to (§35). `evidence` is a
 * runtime closure step: it invokes the Step 7 mutation guards, not an agent,
 * so it maps to no capability.
 */
export const STEP_CAPABILITY: Readonly<Record<ShapeStepKind, string | undefined>> = {
  delivery: "delivery-execution",
  review: "delivery-review",
  evidence: undefined,
};

/** Step names are kebab-case identifiers, like `delivery` or `second-review`. */
export const STEP_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ShapeStep {
  readonly name: string;
  readonly kind: ShapeStepKind;
  readonly execution: ExecutionMode;
  /**
   * Present when the step is a Gate: it names the authority required to
   * progress (§25 invariant 4). A Gate changes progression authority; it
   * never creates a Decision (§31).
   */
  readonly actor?: Actor;
}

/**
 * A declared route between steps (§18, §32). Forward movement between
 * adjacent steps is implicit; anything else — a skip forward or a corrective
 * return — must be declared here, because AI must not invent transitions.
 */
export interface ShapeTransition {
  readonly from: string;
  readonly to: string;
  /**
   * Required on a corrective (backward) route: how many automatic iterations
   * policy permits before a human must intervene (§34). Unbounded corrective
   * loops are rejected.
   */
  readonly maxIterations?: number;
}

/**
 * A resolved lifecycle shape: the fulfilment topology between a current Brief
 * and Evidence closure. The shape is not Contract authority and not graph
 * truth; a run identifies which shape it is executing by `id` (§23), and this
 * checkpoint deliberately gives shapes no hash and no part in Brief identity.
 */
export interface LifecycleShape {
  readonly id: string;
  readonly steps: readonly ShapeStep[];
  readonly transitions: readonly ShapeTransition[];
}

/**
 * The built-in direct shape required by Checkpoint 1: `Brief → Delivery →
 * Review → Evidence`. The Brief is the entry condition rather than a step
 * (§25 invariant 1), so the steps are what happens after it exists.
 */
export const DIRECT_SHAPE_ID = "direct";

export const DIRECT_SHAPE: LifecycleShape = {
  id: DIRECT_SHAPE_ID,
  steps: [
    { name: "delivery", kind: "delivery", execution: "automatic" },
    { name: "review", kind: "review", execution: "automatic" },
    { name: "evidence", kind: "evidence", execution: "automatic" },
  ],
  transitions: [],
};

export function stepNamed(shape: LifecycleShape, name: string): ShapeStep | undefined {
  return shape.steps.find((step) => step.name === name);
}

export function stepIndex(shape: LifecycleShape, name: string): number {
  return shape.steps.findIndex((step) => step.name === name);
}

/**
 * A Gate is a step that cannot progress without a human: manual execution or
 * a human actor (§31). `lifecycle run` stops at one and never skips it.
 */
export function isGate(step: ShapeStep): boolean {
  return step.execution === "manual" || step.actor === "human";
}

/** The declared corrective routes leaving a step, in declaration order. */
export function transitionsFrom(shape: LifecycleShape, name: string): readonly ShapeTransition[] {
  return shape.transitions.filter((transition) => transition.from === name);
}

/**
 * The step that follows `name` on the forward path, or `undefined` at the
 * closing step. Forward movement between adjacent steps needs no declaration.
 */
export function forwardStep(shape: LifecycleShape, name: string): ShapeStep | undefined {
  const index = stepIndex(shape, name);
  return index < 0 ? undefined : shape.steps[index + 1];
}

/**
 * Whether moving `from` → `to` is permitted: the implicit forward step, or a
 * declared transition. Everything else is an impossible transition (§57
 * rule 11), which is what stops an agent inventing a route.
 */
export function isPermittedTransition(shape: LifecycleShape, from: string, to: string): boolean {
  if (forwardStep(shape, from)?.name === to) return true;
  return shape.transitions.some((transition) => transition.from === from && transition.to === to);
}

function checkStep(
  c: Checker,
  raw: unknown,
  label: string,
  seen: Set<string>,
): ShapeStep | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["name", "kind", "execution"]);
  rejectUnknownKeys(c, record, label, ["name", "kind", "execution", "actor"]);

  const name = expectString(c, record["name"], `${label}.name`);
  if (name !== undefined && !STEP_NAME_PATTERN.test(name)) {
    c.fail("invalid-step-name", `${label}.name must be a kebab-case identifier, found "${name}"`);
    return undefined;
  }
  if (name !== undefined && seen.has(name)) {
    c.fail("duplicate-step", `${label}.name "${name}" is declared more than once`);
    return undefined;
  }
  const kind = expectEnum(c, record["kind"], `${label}.kind`, SHAPE_STEP_KINDS);
  const execution = expectEnum(c, record["execution"], `${label}.execution`, EXECUTION_MODES);
  const actor =
    record["actor"] === undefined
      ? undefined
      : expectEnum(c, record["actor"], `${label}.actor`, ACTORS);

  if (name === undefined || kind === undefined || execution === undefined) return undefined;
  seen.add(name);
  return actor === undefined ? { name, kind, execution } : { name, kind, execution, actor };
}

function checkTransition(c: Checker, raw: unknown, label: string): ShapeTransition | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["from", "to"]);
  rejectUnknownKeys(c, record, label, ["from", "to", "max_iterations"]);
  const from = expectString(c, record["from"], `${label}.from`);
  const to = expectString(c, record["to"], `${label}.to`);
  const maxIterations =
    record["max_iterations"] === undefined
      ? undefined
      : expectInteger(c, record["max_iterations"], `${label}.max_iterations`);
  if (maxIterations !== undefined && maxIterations < 1) {
    c.fail(
      "invalid-iteration-bound",
      `${label}.max_iterations must be at least 1, found ${maxIterations}`,
    );
    return undefined;
  }
  if (from === undefined || to === undefined) return undefined;
  return maxIterations === undefined ? { from, to } : { from, to, maxIterations };
}

/**
 * The §25 shape invariants this checkpoint can machine-check. Invariants
 * about Contract semantics (9), capability invention (10) and Brief-level
 * shape changes (12) are structural properties of the closed step vocabulary
 * and the mutation guards rather than parse-time checks.
 */
function checkInvariants(c: Checker, steps: readonly ShapeStep[], label: string): void {
  if (steps.length === 0) {
    c.fail("empty-shape", `${label}.steps must declare at least one step`);
    return;
  }
  const closing = steps[steps.length - 1]!;
  // Invariant 5: every successful path reaches Evidence closure. With a
  // linear forward path, that means the last step closes and no earlier step
  // does — a second Evidence step would make closure ambiguous.
  if (closing.kind !== "evidence") {
    c.fail(
      "missing-evidence-closure",
      `${label} must end in an "evidence" step; every successful path reaches Evidence closure (Spec 01 §25)`,
    );
  }
  const closures = steps.filter((step) => step.kind === "evidence");
  if (closures.length > 1) {
    c.fail(
      "ambiguous-evidence-closure",
      `${label} declares ${closures.length} "evidence" steps; exactly one closes the shape`,
    );
  }
  // Invariants 2 and 3: the shape must actually deliver and review.
  if (!steps.some((step) => step.kind === "delivery")) {
    c.fail("missing-delivery-step", `${label} must declare at least one "delivery" step`);
  }
  if (!steps.some((step) => step.kind === "review")) {
    c.fail("missing-review-step", `${label} must declare at least one "review" step`);
  }
  // Invariant 6: Evidence cannot represent successful Delivery without Review
  // of the latest delivered state, so the closing step follows a Review.
  const beforeClosing = steps[steps.length - 2];
  if (
    closing.kind === "evidence" &&
    beforeClosing !== undefined &&
    beforeClosing.kind !== "review"
  ) {
    c.fail(
      "review-must-precede-evidence",
      `${label} must place a "review" step immediately before its "evidence" step (Spec 01 §25)`,
    );
  }
  // Invariant 4: a Gate identifies required authority through policy.
  for (const step of steps) {
    if (step.execution === "manual" && step.actor === undefined) {
      c.fail(
        "missing-gate-actor",
        `${label}.steps "${step.name}" is manual and must declare "actor"; a Gate identifies required authority (Spec 01 §25)`,
      );
    }
  }
}

function checkRoutes(
  c: Checker,
  steps: readonly ShapeStep[],
  transitions: readonly ShapeTransition[],
  label: string,
): void {
  const index = new Map(steps.map((step, position) => [step.name, position]));
  for (const [position, transition] of transitions.entries()) {
    const where = `${label}.transitions[${position}]`;
    const from = index.get(transition.from);
    const to = index.get(transition.to);
    // §57 rule 11: a transition naming a step the shape does not declare is
    // an impossible route, not a forward reference.
    if (from === undefined) {
      c.fail(
        "impossible-transition",
        `${where}.from "${transition.from}" is not a declared step in this shape`,
      );
    }
    if (to === undefined) {
      c.fail(
        "impossible-transition",
        `${where}.to "${transition.to}" is not a declared step in this shape`,
      );
    }
    if (from === undefined || to === undefined) continue;
    if (from === to) {
      c.fail("impossible-transition", `${where} routes "${transition.from}" to itself`);
      continue;
    }
    // §34 / §57 rule 15: a corrective route loops, so policy must bound it.
    if (to < from && transition.maxIterations === undefined) {
      c.fail(
        "unbounded-corrective-loop",
        `${where} routes back from "${transition.from}" to "${transition.to}" without "max_iterations"; corrective loops must be bounded by policy (Spec 01 §34)`,
      );
    }
  }
}

export function parseShape(
  raw: unknown,
  path: string,
  label = "lifecycle.shape",
): ParseResult<LifecycleShape> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, label);
  if (root === undefined) return { value: undefined, problems: c.problems };

  requireKeys(c, root, label, ["id", "steps"]);
  rejectUnknownKeys(c, root, label, ["id", "steps", "transitions"]);

  const id = expectString(c, root["id"], `${label}.id`);
  if (id !== undefined && !STEP_NAME_PATTERN.test(id)) {
    c.fail("invalid-shape-id", `${label}.id must be a kebab-case identifier, found "${id}"`);
  }

  const steps: ShapeStep[] = [];
  const rawSteps = root["steps"];
  if (rawSteps !== undefined && !Array.isArray(rawSteps)) {
    c.fail("invalid-type", `${label}.steps must be a list`);
  } else if (Array.isArray(rawSteps)) {
    const seen = new Set<string>();
    for (const [position, entry] of rawSteps.entries()) {
      const step = checkStep(c, entry, `${label}.steps[${position}]`, seen);
      if (step !== undefined) steps.push(step);
    }
    checkInvariants(c, steps, label);
  }

  const transitions: ShapeTransition[] = [];
  const rawTransitions = root["transitions"];
  if (rawTransitions !== undefined && !Array.isArray(rawTransitions)) {
    c.fail("invalid-type", `${label}.transitions must be a list`);
  } else if (Array.isArray(rawTransitions)) {
    for (const [position, entry] of rawTransitions.entries()) {
      const transition = checkTransition(c, entry, `${label}.transitions[${position}]`);
      if (transition !== undefined) transitions.push(transition);
    }
  }
  if (steps.length > 0) checkRoutes(c, steps, transitions, label);

  if (!c.ok || id === undefined) return { value: undefined, problems: c.problems };
  return { value: { id, steps, transitions }, problems: [] };
}

/** Re-exported so callers validating a raw object need no YAML round-trip. */
export function isShapeDocument(value: unknown): boolean {
  return isRecord(value) && "steps" in value;
}
