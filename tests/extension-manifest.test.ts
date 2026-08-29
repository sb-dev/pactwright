import { test } from "node:test";
import assert from "node:assert/strict";
import { loadExtensionManifest, parseExtensionManifest } from "../src/extension/manifest.js";
import { fixture } from "./helpers.js";

const valid = {
  id: "review-creative",
  package: "@pactwright/review-creative",
  version: "1.0.0",
  pactwright: "^1.0.0",
  dependencies: { extensions: ["project-intelligence"] },
  graph: {
    node_types: ["asset", "publication"],
    edge_types: ["produces", "grounded-in", "publishes"],
  },
  runtime: { namespaces: ["review", "creative"] },
  agent_capabilities: ["graph-review", "creative-delivery"],
  github: { profile: "review-creative" },
};

test("extension manifest: parses the Distribution §5 example shape", () => {
  const result = parseExtensionManifest(valid, "extension.yml");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value, {
    id: "review-creative",
    package: "@pactwright/review-creative",
    version: "1.0.0",
    pactwright: "^1.0.0",
    dependencies: ["project-intelligence"],
    nodeTypes: ["asset", "publication"],
    edgeTypes: ["produces", "grounded-in", "publishes"],
    namespaces: ["review", "creative"],
    agentCapabilities: ["graph-review", "creative-delivery"],
    githubProfile: "review-creative",
  });
});

test("extension manifest: the singular runtime.namespace form parses too", () => {
  const result = parseExtensionManifest(
    {
      id: "operations",
      package: "@pactwright/operations",
      version: "1.0.0",
      pactwright: "1.0.0",
      runtime: { namespace: "operations" },
    },
    "extension.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value?.namespaces, ["operations"]);
  assert.deepEqual(result.value?.dependencies, []);
  assert.deepEqual(result.value?.nodeTypes, []);
  assert.equal(result.value?.githubProfile, undefined);
});

test("extension manifest: both namespace forms together are rejected", () => {
  const result = parseExtensionManifest(
    { ...valid, runtime: { namespace: "a", namespaces: ["b"] } },
    "extension.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-value"],
  );
});

test("extension manifest: required fields and value shapes are enforced", () => {
  const result = parseExtensionManifest(
    {
      id: "Bad_Id",
      version: "1.0",
      pactwright: "~1.0.0",
      graph: { node_types: ["Bad Type"] },
      agent_capabilities: ["ok-capability", "ok-capability"],
      extra: true,
    },
    "extension.yml",
  );
  assert.equal(result.value, undefined);
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "duplicate-value",
    "invalid-extension-id",
    "invalid-value",
    "invalid-value",
    "invalid-value",
    "missing-field",
    "unknown-field",
  ]);
});

test("extension manifest: dependencies must be declared under extensions", () => {
  const result = parseExtensionManifest(
    { ...valid, dependencies: { packages: ["x"] } },
    "extension.yml",
  );
  assert.deepEqual(result.problems.map((p) => p.code).sort(), ["missing-field", "unknown-field"]);
});

test("extension manifest: loads the fixture extension from disk", () => {
  const result = loadExtensionManifest(fixture("extensions/fixture-reporting"));
  assert.deepEqual(result.problems, []);
  assert.equal(result.value?.id, "fixture-reporting");
  assert.deepEqual(result.value?.dependencies, ["fixture-base"]);
  assert.deepEqual(result.value?.nodeTypes, ["report"]);
  assert.equal(result.value?.githubProfile, "fixture-reporting");
});

test("extension manifest: a missing manifest is extension-not-found", () => {
  const result = loadExtensionManifest(fixture("packs/complete"));
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["extension-not-found"],
  );
});
