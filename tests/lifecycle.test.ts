import { test } from "node:test";
import assert from "node:assert/strict";
import { CORE_STAGES, parseLifecycle } from "../src/config/lifecycle.js";

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
