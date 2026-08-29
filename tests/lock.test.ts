import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLock } from "../src/config/lock.js";

const hash = `sha256:${"ab".repeat(32)}`;
const valid = {
  runtime: { version: "1.2.0" },
  agent_pack: { name: "@pactwright/standard", version: "1.1.0", hash },
  agents: { spec: hash, deliverer: hash },
};

test("lock: parses runtime, agent pack and agent hashes", () => {
  const result = parseLock(valid, "lock.yml");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value, {
    runtime: { version: "1.2.0" },
    agentPack: { name: "@pactwright/standard", version: "1.1.0", hash },
    agents: { deliverer: hash, spec: hash },
    skills: {},
    extensions: {},
  });
});

test("lock: hashes must be sha256:<64 hex>", () => {
  const result = parseLock(
    { ...valid, agents: { spec: "sha256:nope" }, skills: { review: "md5:abc" } },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-hash", "invalid-hash"],
  );
});

test("lock: missing runtime and pack fields are reported", () => {
  const result = parseLock({ runtime: {}, agent_pack: { name: "x" } }, "lock.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-field", "missing-field", "missing-field"],
  );
});

test("lock: parses the Distribution §6 extension structure", () => {
  const result = parseLock(
    {
      ...valid,
      extensions: {
        "project-intelligence": {
          package: "@pactwright/project-intelligence",
          version: "1.1.0",
          hash,
        },
        "review-creative": {
          package: "@pactwright/review-creative",
          version: "1.0.0",
          hash,
          dependencies: { "project-intelligence": "1.1.0" },
        },
        operations: {
          package: "@pactwright/operations",
          version: "1.0.0",
          hash,
          dependencies: { "project-intelligence": "1.1.0" },
        },
      },
    },
    "lock.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value!.extensions, {
    operations: {
      package: "@pactwright/operations",
      version: "1.0.0",
      hash,
      dependencies: { "project-intelligence": "1.1.0" },
    },
    "project-intelligence": {
      package: "@pactwright/project-intelligence",
      version: "1.1.0",
      hash,
    },
    "review-creative": {
      package: "@pactwright/review-creative",
      version: "1.0.0",
      hash,
      dependencies: { "project-intelligence": "1.1.0" },
    },
  });
});

test("lock: extension hashes must match the hash pattern", () => {
  const result = parseLock(
    {
      ...valid,
      extensions: { operations: { package: "x", version: "1.0.0", hash: "sha256:nope" } },
    },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-hash"],
  );
});

test("lock: extensions missing required fields are reported", () => {
  const result = parseLock(
    { ...valid, extensions: { operations: { version: "1.0.0" } } },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-field", "missing-field"],
  );
});

test("lock: unknown extension fields are rejected", () => {
  const result = parseLock(
    {
      ...valid,
      extensions: { operations: { package: "x", version: "1.0.0", hash, channel: "beta" } },
    },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["unknown-field"],
  );
});

test("lock: extension versions and dependency versions must be exact", () => {
  const result = parseLock(
    {
      ...valid,
      extensions: {
        operations: {
          package: "x",
          version: "1.0",
          hash,
          dependencies: { "project-intelligence": "^1.0.0" },
        },
      },
    },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-version", "invalid-version"],
  );
});

test("lock: extension ids and dependency keys must be kebab-case identifiers", () => {
  const result = parseLock(
    {
      ...valid,
      extensions: {
        Bad_Id: { package: "x", version: "1.0.0", hash },
        operations: { package: "x", version: "1.0.0", hash, dependencies: { Nope: "1.0.0" } },
      },
    },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["invalid-extension-id", "invalid-extension-id"],
  );
});

test("lock: extension dependencies must be a mapping; an empty one is omitted", () => {
  const bad = parseLock(
    {
      ...valid,
      extensions: { operations: { package: "x", version: "1.0.0", hash, dependencies: "x" } },
    },
    "lock.yml",
  );
  assert.deepEqual(
    bad.problems.map((p) => p.code),
    ["invalid-type"],
  );
  const empty = parseLock(
    {
      ...valid,
      extensions: { operations: { package: "x", version: "1.0.0", hash, dependencies: {} } },
    },
    "lock.yml",
  );
  assert.deepEqual(empty.problems, []);
  assert.deepEqual(empty.value!.extensions, {
    operations: { package: "x", version: "1.0.0", hash },
  });
});
