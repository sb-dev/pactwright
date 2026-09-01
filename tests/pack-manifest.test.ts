import { test } from "node:test";
import assert from "node:assert/strict";
import { CORE_CAPABILITIES, missingCapabilities } from "../src/pack/capabilities.js";
import { loadPackManifest, parsePackManifest } from "../src/pack/manifest.js";
import { fixture } from "./helpers.js";

const pack = (name: string): string => fixture(`packs/${name}`);

test("pack manifest: the complete fixture parses to the §7 shape", () => {
  const result = loadPackManifest(pack("complete"));
  assert.deepEqual(result.problems, []);
  assert.equal(result.value?.name, "@pactwright/standard");
  assert.equal(result.value?.pactwright, "0.0.1");
  assert.deepEqual(
    { ...result.value?.capabilities },
    {
      "delivery-execution": "implementer",
      "delivery-review": "reviewer",
      "delivery-specification": "spec",
    },
  );
  assert.deepEqual(result.value?.agents["spec"], {
    prompt: "agents/spec.md",
    skills: ["repository-analysis", "contract-writing"],
  });
  assert.deepEqual(missingCapabilities(result.value!, CORE_CAPABILITIES), []);
});

test("pack manifest: an incomplete pack parses but misses a core capability", () => {
  const result = loadPackManifest(pack("incomplete"));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(missingCapabilities(result.value!, CORE_CAPABILITIES), ["delivery-review"]);
});

test("pack manifest: extra capabilities are allowed and inert", () => {
  const result = loadPackManifest(pack("extra-capability"));
  assert.deepEqual(result.problems, []);
  assert.equal(result.value?.capabilities["operations-analysis"], "reviewer");
  assert.deepEqual(missingCapabilities(result.value!, CORE_CAPABILITIES), []);
});

for (const [name, code] of [
  ["unknown-agent", "unknown-agent"],
  ["missing-prompt", "missing-prompt"],
  ["missing-skill", "missing-skill"],
] as const) {
  test(`pack manifest: ${name} fixture fails with ${code}`, () => {
    const result = loadPackManifest(pack(name));
    assert.equal(result.value, undefined);
    assert.deepEqual(
      result.problems.map((p) => p.code),
      [code],
    );
  });
}

test("pack manifest: a directory without pack.yml is pack-not-found", () => {
  const result = loadPackManifest(fixture("not-a-project"));
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["pack-not-found"],
  );
});

const valid = {
  name: "@x/pack",
  version: "1.2.3",
  pactwright: "^1.0.0",
  capabilities: { "delivery-specification": "spec" },
  agents: { spec: { prompt: "agents/spec.md", skills: ["a"] } },
};

test("pack manifest: pack.name accepts scoped npm names and rejects invalid ones", () => {
  for (const name of ["@pactwright/standard", "plain-name", "a.b_c-d"]) {
    const result = parsePackManifest({ ...valid, name }, "pack.yml");
    assert.deepEqual(result.problems, [], `expected "${name}" to be a valid pack name`);
  }
  for (const name of ["../evil", "UPPER", "@bad/", "@/x", 'has"quote', "a".repeat(215)]) {
    const result = parsePackManifest({ ...valid, name }, "pack.yml");
    assert.deepEqual(
      result.problems.map((p) => p.code),
      ["invalid-value"],
      `expected "${name}" to be rejected`,
    );
  }
});

test("pack manifest: a leading .. segment is rejected but ..-prefixed names are not", () => {
  const withPrompt = (prompt: string) =>
    parsePackManifest({ ...valid, agents: { spec: { prompt } } }, "pack.yml");
  assert.deepEqual(withPrompt("agents/..foo.md").problems, []);
  assert.deepEqual(withPrompt("..foo.md").problems, []);
  for (const prompt of ["../outside.md", "..", "agents/../../outside.md"]) {
    assert.deepEqual(
      withPrompt(prompt).problems.map((p) => p.code),
      ["invalid-path"],
      prompt,
    );
  }
});

test("pack manifest: structural problems are all reported in one pass", () => {
  const result = parsePackManifest(
    {
      ...valid,
      version: "1.2",
      pactwright: "~1.0.0",
      extra: true,
      capabilities: { "Bad Name": "spec", "delivery-review": "nobody" },
      agents: {
        spec: { prompt: "../outside.md", skills: ["a", "a"], model: "x" },
      },
    },
    "pack.yml",
  );
  assert.equal(result.value, undefined);
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "duplicate-skill",
    "invalid-capability",
    "invalid-path",
    "invalid-value",
    "invalid-value",
    "unknown-agent",
    "unknown-field",
    "unknown-field",
  ]);
});

test("pack manifest: missing fields and an empty agent map are reported", () => {
  const result = parsePackManifest({ name: "x", agents: {} }, "pack.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-field", "missing-field", "missing-field", "missing-field"],
  );
});

test("pack manifest: skills are optional", () => {
  const result = parsePackManifest(
    { ...valid, agents: { spec: { prompt: "agents/spec.md" } } },
    "pack.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.value?.agents["spec"]?.skills, []);
});
