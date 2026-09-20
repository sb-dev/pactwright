import { test } from "node:test";
import assert from "node:assert/strict";
import type { LifecycleConfig } from "../src/config/lifecycle.js";
import {
  gateActor,
  gateSatisfied,
  transition,
  type LifecycleEvent,
  type TransitionOutcome,
} from "../src/lifecycle/transition.js";
import type { LifecycleShape, ShapeStep } from "../src/lifecycle/shape.js";
import { beginExecution, type ExecutionState } from "../src/lifecycle/state.js";

/**
 * The one lifecycle transition reducer (consolidation design §3).
 *
 * Two private `advance` functions used to apply a completed step: the
 * automatic loop's, which checked Gates before consulting the executor, and
 * the adapter's, which checked nothing and collapsed every stop into
 * `blocked` with no reason. Nothing wrote a Gate record at all.
 *
 * These are table tests over shape, policy, state and event. The reducer is
 * pure, so none of them touches a filesystem.
 */

function shapeOf(steps: readonly ShapeStep[], transitions: LifecycleShape["transitions"] = []) {
  return { id: "direct", steps, transitions } satisfies LifecycleShape;
}

const DELIVERY: ShapeStep = { name: "delivery", kind: "delivery", execution: "automatic" };
const REVIEW: ShapeStep = { name: "review", kind: "review", execution: "automatic" };
const EVIDENCE: ShapeStep = { name: "evidence", kind: "evidence", execution: "automatic" };

const DIRECT = shapeOf([DELIVERY, REVIEW, EVIDENCE]);
const CORRECTIVE = shapeOf(
  [DELIVERY, REVIEW, EVIDENCE],
  [{ from: "review", to: "delivery", maxIterations: 2 }],
);

// The reducer reads shape steps for policy; the responsibility table is not
// consulted, so a minimal stand-in keeps these tests about transitions.
const POLICY = { version: 2, responsibilities: {}, shape: DIRECT } as unknown as LifecycleConfig;

function fresh(shape: LifecycleShape = DIRECT): ExecutionState {
  return beginExecution("brief-x-1111", shape.id, shape.steps[0]?.name);
}

function run(
  shape: LifecycleShape,
  state: ExecutionState,
  ...events: readonly LifecycleEvent[]
): { state: ExecutionState; outcome: TransitionOutcome; reason: string | undefined } {
  let current = state;
  let last = {
    state: current,
    outcome: "advanced" as TransitionOutcome,
    reason: undefined as string | undefined,
  };
  for (const event of events) {
    const result = transition(shape, POLICY, current, event);
    last = { state: result.state, outcome: result.outcome, reason: result.reason };
    current = result.state;
  }
  return last;
}

/* ---- forward progression ---- */

test("transition: a completed step is visited, routed forward and eventually completes", () => {
  const first = transition(DIRECT, POLICY, fresh(), {
    kind: "step-completed",
    step: "delivery",
    revision: "git:abc",
  });
  assert.equal(first.outcome, "advanced");
  assert.deepEqual(first.state.visited, ["delivery"]);
  assert.equal(first.state.currentStep, "review");
  assert.equal(first.state.deliveredRevision, "git:abc");

  const second = transition(DIRECT, POLICY, first.state, {
    kind: "step-completed",
    step: "review",
    review: "pass",
  });
  assert.equal(second.outcome, "advanced");
  assert.equal(second.state.currentStep, "evidence");
  assert.deepEqual(second.state.review, {
    step: "review",
    outcome: "pass",
    revision: "git:abc",
  });

  const third = transition(DIRECT, POLICY, second.state, {
    kind: "step-completed",
    step: "evidence",
  });
  // Completion is an outcome of routing running out of forward steps, never
  // an inference from "no next action" — which is what let a failed run
  // report `completed` on retry.
  assert.equal(third.outcome, "completed");
  assert.equal(third.state.status, "completed");
  assert.equal(third.state.currentStep, undefined);
  assert.deepEqual(third.state.visited, ["delivery", "review", "evidence"]);
});

test("transition: a step the shape does not declare is refused, changing nothing", () => {
  const state = fresh();
  const result = transition(DIRECT, POLICY, state, { kind: "step-completed", step: "publish" });
  assert.equal(result.outcome, "refused");
  assert.equal(result.state, state);
  assert.match(result.reason ?? "", /not part of the "direct" shape/);
});

/* ---- Gates ---- */

const HUMAN_GATE: ShapeStep = { ...DELIVERY, execution: "manual", actor: "human" };
const AGENT_GATE: ShapeStep = { ...DELIVERY, execution: "manual", actor: "agent" };
const GATED = shapeOf([HUMAN_GATE, REVIEW, EVIDENCE]);

test("transition: gateActor defaults an undeclared Gate to human authority", () => {
  assert.equal(gateActor({ ...DELIVERY, execution: "manual" }), "human");
  assert.equal(gateActor(HUMAN_GATE), "human");
  assert.equal(gateActor(AGENT_GATE), "agent");
});

test("transition: completing an unresolved Gate step is refused and changes nothing", () => {
  const state = fresh(GATED);
  const result = transition(GATED, POLICY, state, { kind: "step-completed", step: "delivery" });
  assert.equal(result.outcome, "refused");
  // Byte-identical state is what makes the adapter path safe: an
  // unauthorised attempt cannot advance the run as `recordDelivery` did.
  assert.equal(result.state, state);
  assert.match(result.reason ?? "", /requires human authority/);
});

test("transition: a Gate resolved by an unauthorised actor kind is refused", () => {
  const resolved = transition(GATED, POLICY, fresh(GATED), {
    kind: "gate-resolved",
    step: "delivery",
    resolvedBy: "agent:spec",
  });
  assert.equal(resolved.outcome, "refused");
  assert.match(resolved.reason ?? "", /may not resolve Gate "delivery"/);
  assert.deepEqual(Object.keys(resolved.state.gates), []);
});

test("transition: a Gate resolved by an authorised actor permits the step", () => {
  const resolved = transition(GATED, POLICY, fresh(GATED), {
    kind: "gate-resolved",
    step: "delivery",
    resolvedBy: "human:samir",
  });
  assert.equal(resolved.outcome, "advanced");
  assert.deepEqual(resolved.state.gates, { delivery: { resolvedBy: "human:samir" } });

  const completed = transition(GATED, POLICY, resolved.state, {
    kind: "step-completed",
    step: "delivery",
  });
  assert.equal(completed.outcome, "advanced");
  assert.equal(completed.state.currentStep, "review");
});

test("transition: an agent Gate admits agent and automation, not human", () => {
  const agentGated = shapeOf([AGENT_GATE, REVIEW, EVIDENCE]);
  for (const [actor, permitted] of [
    ["agent:spec", true],
    ["automation:ci", true],
    ["human:samir", false],
  ] as const) {
    const result = transition(agentGated, POLICY, fresh(agentGated), {
      kind: "gate-resolved",
      step: "delivery",
      resolvedBy: actor,
    });
    assert.equal(result.outcome === "advanced", permitted, `${actor} on an agent Gate`);
  }
});

test("transition: a malformed actor never resolves a Gate", () => {
  const result = transition(GATED, POLICY, fresh(GATED), {
    kind: "gate-resolved",
    step: "delivery",
    resolvedBy: "samir",
  });
  assert.equal(result.outcome, "refused");
});

test("transition: resolving a step that is not a Gate is refused", () => {
  const result = transition(DIRECT, POLICY, fresh(), {
    kind: "gate-resolved",
    step: "delivery",
    resolvedBy: "human:samir",
  });
  assert.equal(result.outcome, "refused");
  assert.match(result.reason ?? "", /is not a Gate/);
});

test("transition: advancing onto an unresolved Gate reports waiting-gate", () => {
  const gatedReview = shapeOf([DELIVERY, { ...REVIEW, actor: "human" }, EVIDENCE]);
  const result = transition(gatedReview, POLICY, fresh(gatedReview), {
    kind: "step-completed",
    step: "delivery",
  });
  assert.equal(result.outcome, "waiting-gate");
  assert.equal(result.state.status, "waiting-gate");
  assert.equal(result.state.currentStep, "review");
});

test("transition: gateSatisfied is presence *and* authority", () => {
  assert.equal(gateSatisfied(HUMAN_GATE, {}), false);
  assert.equal(gateSatisfied(HUMAN_GATE, { delivery: { resolvedBy: "agent:bot" } }), false);
  assert.equal(gateSatisfied(HUMAN_GATE, { delivery: { resolvedBy: "human:samir" } }), true);
});

/* ---- corrective routing ---- */

test("transition: a revise takes the declared corrective route and counts it", () => {
  let state = fresh(CORRECTIVE);
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    state = run(
      CORRECTIVE,
      state,
      { kind: "step-completed", step: "delivery", revision: `git:${attempt}` },
      { kind: "step-completed", step: "review", review: "revise" },
    ).state;
    assert.equal(state.currentStep, "delivery");
    assert.equal(state.iterations["review->delivery"], attempt);
  }
  // The history keeps every attempt: `visited` is chronology, so the walk is
  // delivery, review, delivery, review — which is what rule 11 reads.
  assert.deepEqual(state.visited, ["delivery", "review", "delivery", "review"]);
});

test("transition: the third revise exhausts the bound and blocks with its reason", () => {
  let state = fresh(CORRECTIVE);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    state = run(
      CORRECTIVE,
      state,
      { kind: "step-completed", step: "delivery", revision: "git:abc" },
      { kind: "step-completed", step: "review", review: "revise" },
    ).state;
  }
  const third = run(
    CORRECTIVE,
    state,
    { kind: "step-completed", step: "delivery", revision: "git:abc" },
    { kind: "step-completed", step: "review", review: "revise" },
  );
  assert.equal(third.outcome, "blocked");
  assert.equal(third.state.status, "blocked");
  // The adapter path used to collapse every stop into `blocked` with no
  // reason at all.
  assert.match(third.reason ?? "", /2 permitted iterations/);
});

test("transition: a revise with no declared corrective route blocks and says so", () => {
  const result = run(
    DIRECT,
    fresh(),
    { kind: "step-completed", step: "delivery", revision: "git:abc" },
    { kind: "step-completed", step: "review", review: "revise" },
  );
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /declares no corrective route/);
});

test("transition: a blocked Review stops with its own reason", () => {
  const result = run(
    CORRECTIVE,
    fresh(CORRECTIVE),
    { kind: "step-completed", step: "delivery", revision: "git:abc" },
    { kind: "step-completed", step: "review", review: "blocked" },
  );
  assert.equal(result.outcome, "blocked");
  assert.match(result.reason ?? "", /reported the work blocked/);
});

test("transition: a Review completed with no outcome fails rather than guessing", () => {
  const result = run(
    DIRECT,
    fresh(),
    { kind: "step-completed", step: "delivery", revision: "git:abc" },
    { kind: "step-completed", step: "review" },
  );
  assert.equal(result.outcome, "failed");
  assert.match(result.reason ?? "", /without reporting an outcome/);
});

/* ---- failure and governed retry ---- */

test("transition: step-failed keeps the step, and resume returns the run to it", () => {
  const state = fresh();
  const failed = transition(DIRECT, POLICY, state, {
    kind: "step-failed",
    step: "delivery",
    message: "no executor configured",
  });
  assert.equal(failed.outcome, "failed");
  assert.equal(failed.state.status, "failed");
  // The step is kept: a failed run has somewhere to resume to.
  assert.equal(failed.state.currentStep, "delivery");
  assert.deepEqual(failed.state.visited, []);
  assert.equal(failed.reason, "no executor configured");

  const resumed = transition(DIRECT, POLICY, failed.state, { kind: "resume" });
  assert.equal(resumed.outcome, "advanced");
  assert.equal(resumed.state.status, "running");
  assert.equal(resumed.state.currentStep, "delivery");
  // Resuming touches no history.
  assert.deepEqual(resumed.state.visited, []);
});

test("transition: resuming a run that has not failed is refused", () => {
  const state = fresh();
  const result = transition(DIRECT, POLICY, state, { kind: "resume" });
  assert.equal(result.outcome, "refused");
  assert.equal(result.state, state);
  assert.match(result.reason ?? "", /is running, not failed/);
});

test("transition: a Review with nothing delivered fails instead of writing an empty identity", () => {
  // `revision: deliveredRevision ?? ""` wrote state that does not parse back,
  // and `executionFor` replaces unparseable state with a pristine run — so an
  // executor that keeps succeeding restarted the shape from its first step
  // forever.
  const result = run(
    DIRECT,
    fresh(),
    { kind: "step-completed", step: "delivery" },
    { kind: "step-completed", step: "review", review: "pass" },
  );
  assert.equal(result.outcome, "failed");
  assert.match(result.reason ?? "", /no delivered state is on record/);
});
