import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import {
  RESPONSIBILITIES,
  decisionActor,
  gatedResponsibilities,
  isHumanGate,
  loadLifecycle,
  migrateLifecycleV1,
  parseLifecycle,
} from "../src/config/lifecycle.js";
import { fixture } from "./helpers.js";

const lifecycleFile = (name: string) => path.join(fixture("lifecycle"), name);

function responsibilities(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const name of RESPONSIBILITIES) base[name] = { execution: "automatic" };
  base["capture-intent"] = { execution: "manual" };
  base["approve-contract"] = { execution: "manual", actor: "human" };
  return { ...base, ...overrides };
}

/** The built-in direct shape: Brief → Delivery → Review → Evidence. */
function shape(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "direct",
    steps: [
      { name: "delivery", kind: "delivery", execution: "automatic" },
      { name: "review", kind: "review", execution: "automatic" },
      { name: "evidence", kind: "evidence", execution: "automatic" },
    ],
    transitions: [{ from: "review", to: "delivery", max_iterations: 3 }],
    ...overrides,
  };
}

const document = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  version: 2,
  responsibilities: responsibilities(),
  shape: shape(),
  ...overrides,
});

test("lifecycle: the four Contract-crafting responsibilities are not shape steps", () => {
  const result = parseLifecycle(document(), "lifecycle.yml");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    Object.keys(result.value!.responsibilities).sort(),
    [...RESPONSIBILITIES].sort(),
  );
  // Spec 01 Step 6: capture-intent, propose-contracts, approve-contract and
  // write-brief must never appear as lifecycle-shape steps.
  assert.deepEqual(
    result.value!.shape.steps.map((step) => step.name),
    ["delivery", "review", "evidence"],
  );
  for (const name of RESPONSIBILITIES) {
    assert.equal(
      result.value!.shape.steps.some((step) => step.name === name),
      false,
      `${name} must not be a shape step`,
    );
  }
});

test("lifecycle: agent actor on approve-contract is accepted", () => {
  const result = parseLifecycle(
    document({
      responsibilities: responsibilities({
        "approve-contract": { execution: "automatic", actor: "agent" },
      }),
    }),
    "lifecycle.yml",
  );
  assert.deepEqual(result.problems, []);
});

test("lifecycle: every responsibility is required", () => {
  const partial = responsibilities();
  delete partial["write-brief"];
  const result = parseLifecycle(document({ responsibilities: partial }), "lifecycle.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-field"],
  );
  assert.match(result.problems[0]!.message, /"write-brief"/);
});

test("lifecycle: a shape step named as a responsibility is rejected with guidance", () => {
  const result = parseLifecycle(
    document({
      responsibilities: responsibilities({ "deliver-brief": { execution: "automatic" } }),
    }),
    "lifecycle.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["unknown-responsibility"],
  );
  assert.match(result.problems[0]!.message, /shape step named "delivery"/);
});

test("lifecycle: unknown responsibilities, execution modes and actors are rejected", () => {
  const result = parseLifecycle(
    document({
      responsibilities: responsibilities({
        publish: { execution: "automatic" },
        "write-brief": { execution: "sometimes", actor: "robot" },
      }),
    }),
    "lifecycle.yml",
  );
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "invalid-value",
    "invalid-value",
    "unknown-responsibility",
  ]);
});

test("lifecycle: a version 1 seven-stage document is reported as needing migration", () => {
  const result = parseLifecycle(
    {
      version: 1,
      stages: {
        "capture-intent": { execution: "manual" },
        "propose-contracts": { execution: "automatic" },
        "approve-contract": { execution: "manual", actor: "human" },
        "write-brief": { execution: "automatic" },
        "deliver-brief": { execution: "automatic" },
        review: { execution: "automatic" },
        "prepare-evidence": { execution: "automatic" },
      },
    },
    "lifecycle.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["lifecycle-needs-migration"],
  );
});

test("lifecycle: migrating v1 preserves policy and yields the direct shape", () => {
  const v1 = {
    version: 1,
    stages: {
      "capture-intent": { execution: "manual" },
      "propose-contracts": { execution: "automatic" },
      "approve-contract": { execution: "manual", actor: "human" },
      "write-brief": { execution: "automatic" },
      "deliver-brief": { execution: "automatic" },
      review: { execution: "manual", actor: "human" },
      "prepare-evidence": { execution: "automatic" },
    },
  };
  const result = migrateLifecycleV1(v1, "lifecycle.yml");
  assert.deepEqual(result.problems, []);
  assert.equal(decisionActor(result.value!), "human");
  // The v1 review stage was a human gate; it stays one as a shape step.
  const review = result.value!.shape.steps.find((step) => step.name === "review");
  assert.deepEqual(review, {
    name: "review",
    kind: "review",
    execution: "manual",
    actor: "human",
  });
});

test("lifecycle: wrong version is rejected", () => {
  const result = parseLifecycle(document({ version: 7 }), "lifecycle.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["unsupported-version"],
  );
});

test("lifecycle: the default example parses; human gates derived", () => {
  const result = loadLifecycle(lifecycleFile("default.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(decisionActor(result.value!), "human");
  assert.deepEqual(gatedResponsibilities(result.value!), ["capture-intent", "approve-contract"]);
});

test("lifecycle: the automated example parses; only capture-intent gates", () => {
  const result = loadLifecycle(lifecycleFile("automated.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(decisionActor(result.value!), "agent");
  assert.deepEqual(gatedResponsibilities(result.value!), ["capture-intent"]);
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
  assert.match(result.problems[0]!.message, /Spec 01 §8/);
});

test("lifecycle: isHumanGate follows execution and actor", () => {
  assert.equal(isHumanGate({ execution: "manual" }), true);
  assert.equal(isHumanGate({ execution: "manual", actor: "agent" }), true);
  assert.equal(isHumanGate({ execution: "automatic", actor: "human" }), true);
  assert.equal(isHumanGate({ execution: "automatic", actor: "agent" }), false);
  assert.equal(isHumanGate({ execution: "automatic" }), false);
});
