import assert from "node:assert/strict";
import stringify from "safe-stable-stringify";
import type { AcceptanceInput } from "../src/verification.js";
import type { SealedCandidate } from "../src/workspace.js";
import type { SavedState, StateFiles, StateStore } from "../src/state.js";
import { dispatch, pendingOf, S02, type World } from "./h3-fixtures.js";

export const START = { action: "start", config: "h3-fixture.yml" } as const;

/** The journaled evaluation record of an attempt. */
export type EvaluationOf = {
  step: string;
  attempt: number;
  candidate: SealedCandidate;
  claims: AcceptanceInput["claims"];
  manifest: AcceptanceInput["manifest"];
};

export type Outcomes = Awaited<ReturnType<typeof dispatch>>;
export const last = (outcomes: Outcomes): Outcomes[number] => {
  const found = outcomes.at(-1);
  assert.ok(found);
  return found;
};

/** The automatic continuations a hosted run dispatches, until the run stops. */
export async function settle(w: World, outcomes: Outcomes): Promise<Outcomes> {
  let current = outcomes;
  for (let i = 0; i < 10 && last(current).next === "continue"; i++) {
    current = await dispatch(w, { action: "continue" });
  }
  return current;
}

/** Starts a run and runs it to its approval request. */
export async function toApproval(w: World): Promise<{ request: string; candidate: string }> {
  const started = await dispatch(w, START);
  assert.equal(last(started).summary.outcome, "paused", stringify(last(started).summary));
  return pendingOf(last(started));
}

/** Runs a run through S01's approval, its effect and the first publication. */
export async function toPublished(w: World): Promise<void> {
  const pending = await toApproval(w);
  assert.equal(last(await dispatch(w, { action: "approve", ...pending })).exit, 0);
  const continued = await dispatch(w, { action: "continue" });
  assert.equal(last(continued).summary.outcome, "selection-accepted");
}

/** Runs a run through S02 and its publication: the pull request every round uses. */
export async function toS02(w: World): Promise<number> {
  await toPublished(w);
  const extended = await dispatch(w, { action: "continue", through: S02 });
  assert.equal(
    last(extended).summary.outcome,
    "selection-accepted",
    stringify(last(extended).summary),
  );
  return w.github.pullOf(`harness/${w.run}`).number;
}

export const sequences = (w: World): number[] =>
  w.store.states.filter((s) => s.name === w.run).map((s) => s.sequence);

/** A store that shows a job the state as it was before `hideFrom`, for its first `views` listings. */
export class StaleView implements StateStore {
  private listings = 0;
  constructor(
    private readonly inner: StateStore,
    private readonly hideFrom: number,
    private readonly views: number,
  ) {}
  async list(name: string): Promise<SavedState[]> {
    const all = await this.inner.list(name);
    this.listings += 1;
    return this.listings <= this.views ? all.filter((s) => s.sequence < this.hideFrom) : all;
  }
  download(saved: SavedState, into: string): Promise<StateFiles> {
    return this.inner.download(saved, into);
  }
  upload(name: string, sequence: number, files: StateFiles): Promise<SavedState> {
    return this.inner.upload(name, sequence, files);
  }
}
