import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import {
  CORE_STAGES,
  decisionActor,
  humanGates,
  isHumanGate,
  loadLifecycle,
  parseLifecycle,
} from "../src/config/lifecycle.js";
import { fixture } from "./helpers.js";

const lifecycleFile = (name: string) => path.join(fixture("lifecycle"), name);

function stages(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const name of CORE_STAGES) base[name] = { execution: "automatic" };
  base["capture-intent"] = { execution: "manual" };
  base["approve-contract"] = { execution: "manual", actor: "human" };
  return { ...base, ...overrides };
}

test("lifecycle: parses the Delivery Graph §17 default example", () => {
  const result = parseLifecycle({ version: 1, stages: stages() }, "lifecycle.yml");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value?.stages["approve-contract"], {
    execution: "manual",
    actor: "human",
  });
  assert.deepEqual(result.value?.stages["review"], { execution: "automatic" });
  assert.deepEqual(Object.keys(result.value!.stages).sort(), [...CORE_STAGES].sort());
});

test("lifecycle: agent actor on approve-contract is accepted", () => {
  const result = parseLifecycle(
    {
      version: 1,
      stages: stages({ "approve-contract": { execution: "automatic", actor: "agent" } }),
    },
    "lifecycle.yml",
  );
  assert.deepEqual(result.problems, []);
});

test("lifecycle: every core stage is required", () => {
  const partial = stages();
  delete partial["review"];
  const result = parseLifecycle({ version: 1, stages: partial }, "lifecycle.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-field"],
  );
  assert.match(result.problems[0]!.message, /"review"/);
});

test("lifecycle: unknown stages, execution modes and actors are rejected", () => {
  const result = parseLifecycle(
    {
      version: 1,
      stages: stages({
        publish: { execution: "automatic" },
        review: { execution: "sometimes", actor: "robot" },
      }),
    },
    "lifecycle.yml",
  );
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "invalid-value",
    "invalid-value",
    "unknown-stage",
  ]);
});

test("lifecycle: wrong version is rejected", () => {
  const result = parseLifecycle({ version: 2, stages: stages() }, "lifecycle.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["unsupported-version"],
  );
});

test("lifecycle: the exact §17 default example parses; human gates derived", () => {
  const result = loadLifecycle(lifecycleFile("default.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(decisionActor(result.value!), "human");
  assert.deepEqual(humanGates(result.value!), ["capture-intent", "approve-contract"]);
});

test("lifecycle: the exact §17 automated example parses; only capture-intent gates", () => {
  const result = loadLifecycle(lifecycleFile("automated.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(decisionActor(result.value!), "agent");
  assert.deepEqual(humanGates(result.value!), ["capture-intent"]);
});

test("lifecycle: an unknown decision actor is rejected", () => {
  const result = loadLifecycle(lifecycleFile("invalid-actor.yml"));
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-value"],
  );
  assert.match(result.problems[0]!.message, /actor/);
});

test("lifecycle: approve-contract must declare the authorised Decision actor", () => {
  const result = loadLifecycle(lifecycleFile("missing-decision-actor.yml"));
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-actor"],
  );
  assert.match(result.problems[0]!.message, /Delivery Graph §8/);
});

test("lifecycle: isHumanGate follows execution and actor", () => {
  assert.equal(isHumanGate({ execution: "manual" }), true);
  assert.equal(isHumanGate({ execution: "manual", actor: "agent" }), true);
  assert.equal(isHumanGate({ execution: "automatic", actor: "human" }), true);
  assert.equal(isHumanGate({ execution: "automatic", actor: "agent" }), false);
  assert.equal(isHumanGate({ execution: "automatic" }), false);
});
