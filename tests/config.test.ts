import { test } from "node:test";
import assert from "node:assert/strict";
import { load as loadYaml } from "js-yaml";
import { parseConfig, loadConfig, serialiseConfig } from "../src/config/config.js";
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

test("config: parses the Distribution §4 extensions block", () => {
  const result = parseConfig(
    {
      ...valid,
      extensions: {
        "project-intelligence": { enabled: true, source: "@pactwright/project-intelligence" },
        operations: { enabled: false, source: "@pactwright/operations" },
      },
    },
    "config.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value?.extensions, {
    operations: { enabled: false, source: "@pactwright/operations" },
    "project-intelligence": { enabled: true, source: "@pactwright/project-intelligence" },
  });
});

test("config: extension entries are validated", () => {
  const result = parseConfig(
    {
      ...valid,
      extensions: {
        "project-intelligence": {},
        Bad_Id: { enabled: true, source: "x" },
        operations: { enabled: "yes", source: "@pactwright/operations", extra: 1 },
      },
    },
    "config.yml",
  );
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "invalid-extension-id",
    "invalid-type",
    "missing-field",
    "missing-field",
    "unknown-field",
  ]);
});

test("config: serialiseConfig round-trips and orders extensions deterministically", () => {
  const parsed = parseConfig(
    {
      ...valid,
      extensions: {
        "review-creative": { enabled: true, source: "@pactwright/review-creative" },
        "project-intelligence": { enabled: true, source: "@pactwright/project-intelligence" },
      },
    },
    "config.yml",
  ).value!;
  const text = serialiseConfig(parsed);
  const reparsed = parseConfig(loadYaml(text), "config.yml");
  assert.deepEqual(reparsed.problems, []);
  assert.deepEqual(reparsed.value, parsed);
  assert.ok(text.indexOf("project-intelligence:") < text.indexOf("review-creative:"));
  assert.equal(serialiseConfig(reparsed.value!), text);
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
