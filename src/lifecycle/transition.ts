import type { LifecycleConfig } from "../config/lifecycle.js";
import { actorPermitted, authorisedKinds } from "../graph/authority.js";
import {
  forwardStep,
  isGate,
  stepNamed,
  transitionsFrom,
  type LifecycleShape,
  type ShapeStep,
} from "./shape.js";
import { routeKey, type ExecutionState, type GateRecord, type ReviewOutcome } from "./state.js";

/**
 * The one lifecycle transition reducer (consolidation design §3).
 *
 * Two private `advance` functions used to apply a completed step and route
 * the run: one in `lifecycle run`, one in the adapter's provenance path. They
 * shared `routeAfter`, so the routing agreed — but the guards did not. The
 * automatic loop checked Gates before consulting the executor; `recordDelivery`
 * reached no Gate check at all and advanced regardless. Nothing anywhere
 * wrote a Gate record, so `ExecutionState.gates` had readers and no producer.
 *
 * Pure: no I/O, no clock, no filesystem. The caller writes the returned state
 * — or, on `refused`, writes nothing, because the state it gets back is the
 * state it passed in.
 */

export type LifecycleEvent =
  | {
      readonly kind: "step-completed";
      readonly step: string;
      /** Required from a Review step: what it concluded (§32). */
      readonly review?: ReviewOutcome;
      /** The delivered state's identity, recorded by a Delivery step. */
      readonly revision?: string;
    }
  | {
      readonly kind: "gate-resolved";
      readonly step: string;
      /** The acting actor, `<kind>:<name>`, e.g. `human:samir`. */
      readonly resolvedBy: string;
    }
  | { readonly kind: "step-failed"; readonly step: string; readonly message: string }
  /** A governed retry of a failed run at the step it failed on. */
  | { readonly kind: "resume" };

export type TransitionOutcome =
  "advanced" | "waiting-gate" | "blocked" | "completed" | "failed" | "refused";

export interface TransitionResult {
  /** Identical to the input when the outcome is `refused`. */
  readonly state: ExecutionState;
  readonly outcome: TransitionOutcome;
  readonly reason?: string;
}

/**
 * Whether a Gate has been resolved by an actor its policy admits.
 *
 * Shared by the reducer, validation rule 14 and the Evidence closure check,
 * so "this Gate was passed legitimately" means one thing everywhere. Rule 14
 * used to test only that a record existed, which made
 * `resolvedBy: agent:unauthorised` on a human Gate pass validation.
 */
export function gateSatisfied(
  step: ShapeStep,
  gates: Readonly<Record<string, GateRecord>>,
): boolean {
  const record = gates[step.name];
  if (record === undefined) return false;
  return actorPermitted(gateActor(step), record.resolvedBy);
}

/** The authority a Gate requires. A Gate with no declared actor needs a human (§31). */
export function gateActor(step: ShapeStep): "human" | "agent" {
  return step.actor ?? "human";
}

/** Where a completed step hands off to (§32). */
export interface Routing {
  readonly to?: string;
  /** Set when the route is a declared transition rather than the forward step. */
  readonly route?: string;
  readonly stop?: "blocked" | "iteration-exhausted" | "no-corrective-route";
  readonly reason?: string;
}

/**
 * A Review routes by outcome: a pass continues forward, a revise takes a
 * *declared* corrective route, and a block stops. Everything else moves
 * forward; `to: undefined` means the shape is finished.
 */
export function routeAfter(
  shape: LifecycleShape,
  state: ExecutionState,
  step: ShapeStep,
  outcome?: ReviewOutcome,
): Routing {
  if (step.kind === "review" && outcome !== undefined && outcome !== "pass") {
    if (outcome === "blocked") {
      return { stop: "blocked", reason: `review "${step.name}" reported the work blocked` };
    }
    // A correction may only take a route the shape declares: AI cannot invent
    // one (§32), and the route's policy bound caps automatic iteration (§34).
    const corrective = transitionsFrom(shape, step.name).find(
      (transition) => transition.maxIterations !== undefined,
    );
    if (corrective === undefined) {
      return {
        stop: "no-corrective-route",
        reason: `review "${step.name}" asked for correction but the "${shape.id}" shape declares no corrective route from it`,
      };
    }
    const key = routeKey(corrective.from, corrective.to);
    const taken = state.iterations[key] ?? 0;
    if (taken >= corrective.maxIterations!) {
      return {
        stop: "iteration-exhausted",
        reason: `corrective route ${key} has run ${taken} of ${corrective.maxIterations!} permitted iterations; policy requires human intervention now`,
      };
    }
    return { to: corrective.to, route: key };
  }
  const next = forwardStep(shape, step.name);
  return next === undefined ? {} : { to: next.name };
}

function refuse(state: ExecutionState, reason: string): TransitionResult {
  return { state, outcome: "refused", reason };
}

function withoutCurrentStep(state: ExecutionState): ExecutionState {
  const rest = { ...state };
  delete (rest as { currentStep?: string }).currentStep;
  return rest;
}

/**
 * Applies one event to a run's state and reports what became of it.
 *
 * Every rule the two `advance` functions disagreed about lives here:
 *
 * - a Gate step cannot be completed unless its Gate is resolved by an
 *   authorised actor, on *every* path including the adapter's;
 * - `gate-resolved` is the write side that did not exist;
 * - completion is an outcome of routing, never inferred from "no next
 *   action" — which is what made a failed run report `completed` on retry;
 * - `step-failed` and `resume` give a failed run a governed retry;
 * - every stop keeps its reason, which the provenance path used to drop.
 */
export function transition(
  shape: LifecycleShape,
  policy: LifecycleConfig,
  state: ExecutionState,
  event: LifecycleEvent,
): TransitionResult {
  void policy; // Reserved: shape steps carry their own policy today (§26).

  if (event.kind === "resume") {
    if (state.status !== "failed") {
      return refuse(state, `the run for brief "${state.brief}" is ${state.status}, not failed`);
    }
    if (state.currentStep === undefined) {
      return refuse(state, `the failed run for brief "${state.brief}" records no step to resume`);
    }
    return { state: { ...state, status: "running" }, outcome: "advanced" };
  }

  const step = stepNamed(shape, event.step);
  if (step === undefined) {
    return refuse(state, `step "${event.step}" is not part of the "${shape.id}" shape`);
  }

  if (event.kind === "step-failed") {
    // `currentStep` is kept: a failed run has somewhere to resume to.
    return {
      state: { ...state, status: "failed", currentStep: step.name },
      outcome: "failed",
      reason: event.message,
    };
  }

  if (event.kind === "gate-resolved") {
    if (!isGate(step)) {
      return refuse(state, `step "${step.name}" is not a Gate; there is nothing to resolve`);
    }
    const required = gateActor(step);
    if (!actorPermitted(required, event.resolvedBy)) {
      return refuse(
        state,
        `actor "${event.resolvedBy}" may not resolve Gate "${step.name}"; it requires ${required} (${authorisedKinds(required).join("/")}) authority`,
      );
    }
    return {
      state: {
        ...state,
        status: state.status === "waiting-gate" ? "running" : state.status,
        gates: { ...state.gates, [step.name]: { resolvedBy: event.resolvedBy } },
      },
      outcome: "advanced",
    };
  }

  // step-completed.
  //
  // A Gate is authority over progression, so completing one without a
  // recorded, authorised resolution is refused — and a refusal changes
  // nothing, which is what makes an unauthorised adapter call leave the state
  // file byte-identical.
  if (isGate(step) && !gateSatisfied(step, state.gates)) {
    const required = gateActor(step);
    const recorded = state.gates[step.name];
    return refuse(
      state,
      recorded === undefined
        ? `Gate "${step.name}" requires ${required} authority; record it with "pactwright lifecycle record gate" before completing the step`
        : `Gate "${step.name}" is recorded as resolved by "${recorded.resolvedBy}", which is not ${required} (${authorisedKinds(required).join("/")}) authority`,
    );
  }

  let carried: ExecutionState = { ...state, visited: [...state.visited, step.name] };
  if (step.kind === "delivery" && event.revision !== undefined) {
    // The identity of what was delivered, so a later change invalidates the
    // Review taken against it (§53 precondition 2).
    carried = { ...carried, deliveredRevision: event.revision };
  }
  if (step.kind === "review") {
    if (event.review === undefined) {
      return {
        state: { ...carried, status: "failed", currentStep: step.name },
        outcome: "failed",
        reason: `review step "${step.name}" completed without reporting an outcome; the runtime cannot choose a transition without one`,
      };
    }
    // A Review is taken against the delivered state currently recorded. With
    // none there is nothing to review, and writing an empty identity would
    // produce state that does not parse back — which `executionFor` then
    // replaces with a pristine run, restarting the shape silently.
    if (carried.deliveredRevision === undefined) {
      return {
        state: { ...carried, status: "failed", currentStep: step.name },
        outcome: "failed",
        reason: `review step "${step.name}" completed but no delivered state is on record; a Review is taken against what Delivery produced`,
      };
    }
    carried = {
      ...carried,
      review: {
        step: step.name,
        outcome: event.review,
        revision: carried.deliveredRevision,
      },
    };
  }

  const routing = routeAfter(shape, carried, step, event.review);
  if (routing.stop !== undefined) {
    return {
      state: { ...carried, status: "blocked", currentStep: step.name },
      outcome: "blocked",
      reason: routing.reason ?? `the run is blocked at "${step.name}"`,
    };
  }
  if (routing.to === undefined) {
    // Routing ran out of forward steps: the shape is finished. Completion is
    // decided here and nowhere else.
    return { state: { ...withoutCurrentStep(carried), status: "completed" }, outcome: "completed" };
  }

  const iterations =
    routing.route === undefined
      ? carried.iterations
      : { ...carried.iterations, [routing.route]: (carried.iterations[routing.route] ?? 0) + 1 };
  const next = stepNamed(shape, routing.to);
  const advanced: ExecutionState = {
    ...carried,
    status:
      next !== undefined && isGate(next) && !gateSatisfied(next, carried.gates)
        ? "waiting-gate"
        : "running",
    currentStep: routing.to,
    iterations,
  };
  return {
    state: advanced,
    outcome: advanced.status === "waiting-gate" ? "waiting-gate" : "advanced",
    ...(advanced.status === "waiting-gate"
      ? {
          reason: `the run now stands at Gate "${routing.to}", which requires ${gateActor(next!)} authority`,
        }
      : {}),
  };
}
