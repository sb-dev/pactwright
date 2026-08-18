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

test("lock: non-empty extensions are rejected in this runtime", () => {
  const result = parseLock(
    { ...valid, extensions: { operations: { version: "1.0.0" } } },
    "lock.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["extensions-not-supported"],
  );
});
