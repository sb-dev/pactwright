import { after, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { PactwrightError } from "../src/errors.js";
import { RESPONSIBILITIES } from "../src/config/lifecycle.js";
import { COMMAND_NAMES } from "../src/adapter/commands.js";
import { lifecycleNext, lifecycleStatus } from "../src/lifecycle/engine.js";
import { EXECUTION_DIR } from "../src/lifecycle/state.js";
import { DIRECT_SHAPE } from "../src/lifecycle/shape.js";
import { loadProject } from "../src/loader.js";
import { defaultResponsibilities, defaultShapeSteps, makeTempProject } from "./helpers.js";

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

test("engine: adapter command decomposition is not lifecycle topology", () => {
  // Checkpoint 1 Step 6: "Do not encode capture-intent, propose-contracts,
  // approve-contract or write-brief as shape stages." Those four are
  // Contract-crafting responsibilities that sit upstream of the Brief.
  const stepNames = DIRECT_SHAPE.steps.map((step) => step.name);
  assert.deepEqual(stepNames, ["delivery", "review", "evidence"]);
  for (const responsibility of RESPONSIBILITIES) {
    assert.equal(
      stepNames.includes(responsibility),
      false,
      `${responsibility} must not be a shape step`,
    );
  }
  assert.deepEqual(
    [...RESPONSIBILITIES],
    ["capture-intent", "propose-contracts", "approve-contract", "write-brief"],
  );
  // The shape has three steps; the adapter has seven commands. Neither count
  // derives from the other.
  assert.equal(COMMAND_NAMES.length, 7);
  assert.notEqual(COMMAND_NAMES.length, DIRECT_SHAPE.steps.length);
});

/** [derived state, completed responsibilities, next action name, next action kind] */
const table: Array<[string, readonly string[], string | undefined, string | undefined]> = [
  ["open", ["capture-intent"], "propose-contracts", "responsibility"],
  ["deferred", ["capture-intent", "propose-contracts", "approve-contract"], undefined, undefined],
  ["rejected", ["capture-intent", "propose-contracts", "approve-contract"], undefined, undefined],
  [
    "contracted",
    ["capture-intent", "propose-contracts", "approve-contract"],
    "write-brief",
    "responsibility",
  ],
  // Once a Brief exists the shape governs: the first step is Delivery, not an
  // adapter command.
  ["delivering", [...RESPONSIBILITIES], "delivery", "step"],
  ["done", [...RESPONSIBILITIES], undefined, undefined],
];

for (const [state, completed, current, kind] of table) {
  test(`engine: status/next of the ${state} lineage (default lifecycle)`, () => {
    const p = project({ lineage: state });
    const status = lifecycleStatus(p);
    const entry = status.lineages.find((l) => l.intent === INTENT);
    assert.ok(entry);
    assert.equal(entry.state, state);
    assert.deepEqual(entry.completedResponsibilities, completed);
    assert.equal(entry.current?.name, current);
    assert.equal(entry.current?.kind, kind);
    assert.equal(entry.blocked, undefined); // none of these is a gate
    assert.deepEqual(status.problems, []);

    const [next] = lifecycleNext(p, INTENT);
    assert.equal(next?.intent, INTENT);
    assert.equal(next?.action?.name, current);
    if (current === undefined) {
      assert.equal(next?.gate, false);
      if (state === "done") assert.match(next!.reason, /no next action/);
      else assert.match(next!.reason, /new Decision/);
    } else {
      assert.equal(next?.action?.execution, "automatic");
      assert.equal(next?.gate, false);
    }
  });
}

test("engine: a delivering lineage reports the resolved shape it is executing", () => {
  const p = project({ lineage: "delivering" });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.shape, "direct");
  assert.equal(entry?.executionStatus, "running");
  assert.deepEqual(entry?.visited, []);
  // The Delivery step delegates to the delivery-execution capability.
  assert.equal(entry?.current?.capability, "delivery-execution");
});

test("engine: status is read-only and persists no execution state", () => {
  const dir = makeTempProject({ lineage: "delivering" });
  dirs.push(dir);
  const p = loadProject({ root: dir });
  lifecycleStatus(p, INTENT);
  lifecycleNext(p, INTENT);
  assert.equal(
    existsSync(`${dir}/${EXECUTION_DIR}`),
    false,
    "reading status must not write execution state",
  );
});

test("engine: after current Evidence, next reports no further action", () => {
  const p = project({ lineage: "done" });
  const actions = lifecycleNext(p);
  assert.deepEqual(
    actions.map((a) => [a.intent, a.action?.name]),
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
      completedResponsibilities: [],
      visited: [],
      current: { kind: "responsibility", name: "capture-intent", execution: "manual" },
      // With no lineage the only operation on offer is starting one. The
      // status carries the same list `lifecycle record` checks against
      // (design §12), so the two cannot drift apart.
      permitted: [{ stage: "capture-intent", mode: "initial" }],
      blocked: "capture-intent",
      requiredActor: "human",
    },
  ]);
  const [next] = lifecycleNext(p);
  assert.equal(next?.action?.name, "capture-intent");
  assert.equal(next?.action?.execution, "manual");
  assert.equal(next?.gate, true);
});

test("engine: a human-actor responsibility blocks and reports the required actor", () => {
  const p = project({
    lineage: "contracted",
    responsibilities: defaultResponsibilities({
      "write-brief": { execution: "automatic", actor: "human" },
    }),
  });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.blocked, "write-brief");
  assert.equal(entry?.requiredActor, "human");
  const [next] = lifecycleNext(p, INTENT);
  assert.equal(next?.gate, true);
  assert.equal(next?.action?.actor, "human");
});

test("engine: a Gate on a shape step blocks the run and names its authority", () => {
  const p = project({
    lineage: "delivering",
    shapeSteps: defaultShapeSteps({ delivery: { execution: "manual", actor: "human" } }),
  });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.blocked, "delivery");
  assert.equal(entry?.requiredActor, "human");
  const [next] = lifecycleNext(p, INTENT);
  assert.equal(next?.gate, true);
  assert.match(next!.reason, /shape step "delivery" is a Gate/);
});

test("engine: the automated lifecycle leaves only capture-intent gated", () => {
  const p = project({ lineage: "open", lifecycle: "automated.yml" });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.blocked, undefined);
  assert.equal(entry?.current?.name, "propose-contracts");
});

test("engine: status carries the current lineage chain", () => {
  const p = project({ lineage: "delivering" });
  const [entry] = lifecycleStatus(p, INTENT).lineages;
  assert.equal(entry?.lineage?.brief?.id, "brief-quick-start-d4e5");
  assert.equal(entry?.lineage?.evidence, undefined);
});

test("engine: a superseded lineage has nothing pending and no next action", () => {
  const p = project({ lineage: "superseded-intent" });
  const status = lifecycleStatus(p, INTENT);
  const [entry] = status.lineages;
  assert.equal(entry?.state, "open");
  assert.equal(entry?.superseded, true);
  assert.equal(entry?.current, undefined);
  assert.equal(entry?.blocked, undefined);
  const [next] = lifecycleNext(p, INTENT);
  assert.equal(next?.action, undefined);
  assert.equal(next?.gate, false);
  assert.match(next!.reason, /superseded/);
  const [successor] = lifecycleNext(p, "intent-quick-start-v2-f6a7");
  assert.equal(successor?.action?.name, "propose-contracts");
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
