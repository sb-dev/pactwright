import { test } from "node:test";
import assert from "node:assert/strict";
import { load as loadYaml } from "js-yaml";
import { parseConfig, loadConfig, rewriteConfig, serialiseConfig } from "../src/config/config.js";
import { CONFIG_TEMPLATE } from "../src/init.js";
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

test("config: serialiseConfig escapes sources that would otherwise break the document", () => {
  for (const source of [
    './packs/my "pack"',
    "./packs\\v1",
    "C:\\packs\\standard",
    "./packs/one\ntwo",
    "@scope/name",
  ]) {
    const parsed = parseConfig(
      {
        ...valid,
        agent_pack: { source },
        extensions: { operations: { enabled: true, source } },
      },
      "config.yml",
    ).value!;
    const text = serialiseConfig(parsed);
    const reparsed = parseConfig(loadYaml(text), "config.yml");
    assert.deepEqual(reparsed.problems, [], `re-parsing failed for ${JSON.stringify(source)}`);
    assert.deepEqual(reparsed.value, parsed, `round-trip lost data for ${JSON.stringify(source)}`);
  }
});

const ANNOTATED = `# pinned deliberately — see docs/adr/0007
version: 1

agent_pack:
  source: "@pactwright/standard"
  version: "^0.0.0"

# the adapter is not configurable yet
adapter:
  type: claude-code

extensions: {}

# owner: platform-team
github:
  enabled: false
`;

function withExtension(text: string, id: string): string {
  const parsed = parseConfig(loadYaml(text), "config.yml").value!;
  return rewriteConfig(text, {
    ...parsed,
    extensions: { ...parsed.extensions, [id]: { enabled: true, source: `@pactwright/${id}` } },
  });
}

test("config: rewriteConfig keeps every comment outside the extensions block", () => {
  const added = withExtension(ANNOTATED, "fixture-base");
  for (const comment of [
    "# pinned deliberately — see docs/adr/0007",
    "# the adapter is not configurable yet",
    "# owner: platform-team",
  ]) {
    assert.ok(added.includes(comment), `lost ${comment}`);
  }
  assert.ok(added.includes("  fixture-base:"));
  assert.deepEqual(parseConfig(loadYaml(added), "config.yml").value?.extensions, {
    "fixture-base": { enabled: true, source: "@pactwright/fixture-base" },
  });

  // And back again: removing the last extension collapses to the flow form
  // without disturbing anything around it.
  const parsed = parseConfig(loadYaml(added), "config.yml").value!;
  const removed = rewriteConfig(added, { ...parsed, extensions: {} });
  assert.ok(removed.includes("extensions: {}"));
  assert.ok(removed.includes("# owner: platform-team"));
  assert.equal(removed, ANNOTATED);
});

test("config: rewriteConfig inserts the block when the key is absent", () => {
  const withoutKey = ANNOTATED.replace("extensions: {}\n\n", "");
  const added = withExtension(withoutKey, "fixture-base");
  assert.ok(added.includes("# owner: platform-team"));
  assert.deepEqual(Object.keys(parseConfig(loadYaml(added), "config.yml").value!.extensions), [
    "fixture-base",
  ]);
  // The insertion goes above `github:`, not into it.
  assert.ok(added.indexOf("extensions:") < added.indexOf("github:"));
});

test("config: rewriteConfig falls back to a full rewrite rather than corrupt a file", () => {
  const parsed = parseConfig(loadYaml(ANNOTATED), "config.yml").value!;
  const next = {
    ...parsed,
    extensions: { operations: { enabled: true, source: "@pactwright/operations" } },
  };
  for (const hostile of [
    // A flow mapping spanning lines: not a shape the editor claims to read.
    ANNOTATED.replace("extensions: {}", "extensions: {\n}"),
    // Tabs anywhere make indentation unreliable to reason about.
    ANNOTATED.replace("adapter:\n  type:", "adapter:\n\ttype:"),
  ]) {
    const result = rewriteConfig(hostile, next);
    // Either shape may fail to parse at all; what matters is that whatever is
    // returned is a valid config carrying the intended extensions.
    const reparsed = parseConfig(loadYaml(result), "config.yml");
    assert.deepEqual(reparsed.problems, []);
    assert.deepEqual(Object.keys(reparsed.value!.extensions), ["operations"]);
  }
});

test("config: serialiseConfig reproduces the exact bytes init writes", () => {
  // The doc comment promises these are the same document; if the template
  // and the serialiser drift, `extension add` silently reformats config.yml.
  const parsed = parseConfig(loadYaml(CONFIG_TEMPLATE), "config.yml");
  assert.deepEqual(parsed.problems, []);
  assert.equal(serialiseConfig(parsed.value!), CONFIG_TEMPLATE);
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
