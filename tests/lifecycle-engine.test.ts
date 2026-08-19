import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { PactwrightError } from "../src/errors.js";
import { CORE_STAGES } from "../src/config/lifecycle.js";
import {
  GRAPH_MARKING_STAGES,
  TRANSIENT_STAGES,
  lifecycleNext,
  lifecycleStatus,
} from "../src/lifecycle/engine.js";
import { loadProject } from "../src/loader.js";
import { defaultStages, makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(options: Parameters<typeof makeTempProject>[0] = {}) {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return loadProject({ root: dir });
}

const INTENT = "intent-quick-start-a1b2";

test("engine: every core stage is either graph-marking or transient, in lifecycle order", () => {
  const all = [...GRAPH_MARKING_STAGES, ...TRANSIENT_STAGES].sort();
  assert.deepEqual(all, [...CORE_STAGES].sort());
  assert.deepEqual(TRANSIENT_STAGES, ["propose-contracts", "deliver-brief", "review"]);
});

const table: Array<[string, readonly string[], string | undefined]> = [
  ["open", ["capture-intent"], "propose-contracts"],
  ["deferred", ["capture-intent", "propose-contracts", "approve-contract"], undefined],
  ["rejected", ["capture-intent", "propose-contracts", "approve-contract"], undefined],
  ["contracted", ["capture-intent", "propose-contracts", "approve-contract"], "write-brief"],
  [
    "delivering",
    ["capture-intent", "propose-contracts", "approve-contract", "write-brief"],
    "deliver-brief",
  ],
  ["done", [...CORE_STAGES], undefined],
];

for (const [state, completed, current] of table) {
  test(`engine: status/next of the ${state} lineage (default lifecycle)`, () => {
    const p = project({ lineage: state });
    const status = lifecycleStatus(p);
    const entry = status.lineages.find((l) => l.intent === INTENT);
    assert.ok(entry);
    assert.equal(entry.state, state);
    assert.deepEqual(entry.completed, completed);
    assert.equal(entry.currentStage, current);
    assert.equal(entry.blockedStage, undefined); // none of these first stages is a gate
    assert.deepEqual(status.problems, []);

    const [next] = lifecycleNext(p, INTENT);
    assert.equal(next?.intent, INTENT);
    assert.equal(next?.stage, current);
    if (current === undefined) {
      assert.equal(next?.gate, false);
      if (state === "done") assert.match(next!.reason, /no next stage/);
      else assert.match(next!.reason, /new Decision/);
    } else {
      assert.equal(next?.execution, "automatic");
      assert.equal(next?.gate, false);
    }
  });
}

test("engine: after current Evidence, next reports no further core Delivery stage", () => {
  const p = project({ lineage: "done" });
  const actions = lifecycleNext(p);
  // The done lineage has no next stage; with no active lineage, capture-intent is the entry point.
  assert.deepEqual(
    actions.map((a) => [a.intent, a.stage]),
    [
      [INTENT, undefined],
      [undefined, "capture-intent"],
    ],
  );
  assert.equal(actions[1]?.gate, true);
});

test("engine: an empty graph reports capture-intent as a human gate", () => {
  const p = project();
  const status = lifecycleStatus(p);
  assert.deepEqual(status.lineages, [
    {
      state: "none",
      completed: [],
      currentStage: "capture-intent",
      blockedStage: "capture-intent",
      requiredActor: "human",
    },
  ]);
  const [next] = lifecycleNext(p);
  assert.equal(next?.stage, "capture-intent");
  assert.equal(next?.execution, "manual");
  assert.equal(next?.gate, true);
});

test("engine: a human-actor stage blocks and reports the required actor", () => {
  const p = project({
    lineage: "contracted",
    stages: defaultStages({ "write-brief": { execution: "automatic", actor: "human" } }),
  });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.blockedStage, "write-brief");
  assert.equal(entry?.requiredActor, "human");
  const [next] = lifecycleNext(p, INTENT);
  assert.equal(next?.gate, true);
  assert.equal(next?.actor, "human");
});

test("engine: the automated lifecycle leaves only capture-intent gated", () => {
  const p = project({ lineage: "open", lifecycle: "automated.yml" });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.blockedStage, undefined);
  assert.equal(entry?.currentStage, "propose-contracts");
});

test("engine: status carries the current lineage chain", () => {
  const p = project({ lineage: "delivering" });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.lineage?.brief?.id, "brief-quick-start-d4e5");
  assert.equal(entry?.lineage?.evidence, undefined);
});

test("engine: an unknown intent id is rejected", () => {
  const p = project({ lineage: "open" });
  assert.throws(
    () => lifecycleStatus(p, "intent-nope-0000"),
    (e: unknown) => e instanceof PactwrightError && e.code === "unknown-intent",
  );
  assert.throws(
    () => lifecycleNext(p, "decision-quick-start-b2c3"),
    (e: unknown) => e instanceof PactwrightError && e.code === "unknown-intent",
  );
});
