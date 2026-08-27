import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig, loadConfig } from "../src/config/config.js";
import { fixture } from "./helpers.js";
import * as path from "node:path";

const valid = {
  version: 1,
  agent_pack: { source: "@pactwright/standard", version: "^1.0.0" },
  adapter: { type: "claude-code" },
  extensions: {},
  github: { enabled: true },
};

test("config: parses the Distribution §3 example", () => {
  const result = parseConfig(valid, "config.yml");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value, {
    version: 1,
    agentPack: { source: "@pactwright/standard", version: "^1.0.0" },
    adapter: { type: "claude-code" },
    extensions: {},
    github: { enabled: true },
  });
});

test("config: agent_pack.version and extensions are optional", () => {
  const result = parseConfig(
    {
      version: 1,
      agent_pack: { source: "@pactwright/standard" },
      adapter: { type: "claude-code" },
      github: { enabled: false },
    },
    "config.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value?.agentPack, { source: "@pactwright/standard" });
});

test("config: reports every problem in one pass", () => {
  const result = parseConfig(
    {
      version: 2,
      agent_pack: {},
      adapter: { type: "cursor" },
      github: { enabled: "yes" },
      extra: 1,
    },
    "config.yml",
  );
  assert.equal(result.value, undefined);
  const codes = result.problems.map((p) => p.code).sort();
  assert.deepEqual(codes, [
    "invalid-type",
    "invalid-value",
    "missing-field",
    "unknown-field",
    "unsupported-version",
  ]);
  for (const problem of result.problems) assert.equal(problem.path, "config.yml");
});

test("config: non-empty extensions are rejected in this runtime", () => {
  const result = parseConfig(
    { ...valid, extensions: { "project-intelligence": {} } },
    "config.yml",
  );
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["extensions-not-supported"],
  );
});

test("config: non-mapping document is rejected", () => {
  assert.equal(parseConfig("nope", "config.yml").problems[0]?.code, "invalid-type");
  assert.equal(parseConfig(null, "config.yml").problems[0]?.code, "invalid-type");
});

test("config: loadConfig reads the fixture file", () => {
  const result = loadConfig(path.join(fixture("valid-project"), ".pactwright", "config.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(result.value?.github.enabled, false);
});

test("config: missing file is a missing-file problem, not a throw", () => {
  const result = loadConfig(path.join(fixture("valid-project"), ".pactwright", "nope.yml"));
  assert.equal(result.problems[0]?.code, "missing-file");
});
