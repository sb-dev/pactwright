import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "tools", "spec.ts");
const fixtures = path.join(repoRoot, "tests", "fixtures");
const INDEX_FILES = ["by-type.yaml", "incoming.yaml", "outgoing.yaml", "unresolved.yaml"];

function runCli(cwd: string, subcommand: string) {
  // Temp dirs live inside the repo so `--import tsx` resolves via node_modules.
  const result = spawnSync(process.execPath, ["--import", "tsx", cli, subcommand], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.error, undefined);
  return result;
}

function copyFixture(t: { after(fn: () => void): void }, name: string): string {
  const dir = fs.mkdtempSync(path.join(repoRoot, ".tmp-spec-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(fixtures, name), dir, { recursive: true });
  return dir;
}

function expectedErrors(name: string): string[] {
  return fs
    .readFileSync(path.join(fixtures, name, "expected-errors.txt"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

function errorLines(stderr: string): string[] {
  return stderr.split("\n").filter((l) => l.startsWith("[rule: "));
}

test("good graph: index is deterministic and byte-identical to committed fixtures, validate passes", (t) => {
  const dir = copyFixture(t, "good");
  assert.equal(runCli(dir, "index").status, 0);
  const first = new Map<string, string>();
  for (const name of INDEX_FILES) {
    const regenerated = fs.readFileSync(path.join(dir, "specs", "indexes", name), "utf8");
    const committed = fs.readFileSync(path.join(fixtures, "good", "specs", "indexes", name), "utf8");
    assert.equal(regenerated, committed, `${name} differs from committed fixture`);
    first.set(name, regenerated);
  }
  // Acceptance example 7 (determinism): re-run is byte-identical.
  assert.equal(runCli(dir, "index").status, 0);
  for (const name of INDEX_FILES) {
    assert.equal(fs.readFileSync(path.join(dir, "specs", "indexes", name), "utf8"), first.get(name));
  }
  assert.equal(runCli(dir, "validate").status, 0);
});

// Acceptance examples 1–5 (contract A) and 8 (rule provenance, asserted by
// the `[rule: <id>]` prefix on every pinned error string).
for (const name of [
  "dangling-target",
  "duplicate-node-id",
  "wrong-endpoint-type",
  "supersedes-across-types",
  "missing-required-field",
]) {
  test(`bad/${name}: validate fails with the pinned errors`, (t) => {
    const dir = copyFixture(t, `bad/${name}`);
    assert.equal(runCli(dir, "index").status, 0);
    const result = runCli(dir, "validate");
    assert.equal(result.status, 1);
    for (const line of expectedErrors(`bad/${name}`)) {
      assert.ok(result.stderr.includes(line), `missing error: ${line}\nstderr:\n${result.stderr}`);
    }
  });
}

test("bad/dangling-target: spec:index writes the unresolved endpoint to unresolved.yaml", (t) => {
  const dir = copyFixture(t, "bad/dangling-target");
  assert.equal(runCli(dir, "index").status, 0);
  const doc = load(fs.readFileSync(path.join(dir, "specs", "indexes", "unresolved.yaml"), "utf8"));
  assert.deepEqual(doc, {
    unresolved: [{ edge: "edge-foo-1234", missing: "target", value: "intent-missing-zzzz" }],
  });
});

test("bad/index-drift: hand-edited index is reported as drift (acceptance example 6)", (t) => {
  const dir = copyFixture(t, "bad/index-drift");
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  const lines = errorLines(result.stderr);
  assert.deepEqual(lines, expectedErrors("bad/index-drift"));
});

test("bad/schema-extension: appending a rule of an existing kind rejects a passing graph (example 9)", (t) => {
  const dir = copyFixture(t, "bad/schema-extension");
  assert.equal(runCli(dir, "index").status, 0);
  assert.equal(runCli(dir, "validate").status, 0, "fixture must pass with the bootstrap rules");
  const rulesFile = path.join(dir, "specs", "schema", "validation-rules.yaml");
  fs.appendFileSync(
    rulesFile,
    "  - id: nodes-title-unique\n    kind: unique_field\n    scope: nodes\n    field: title\n",
  );
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  for (const line of expectedErrors("bad/schema-extension")) {
    assert.ok(result.stderr.includes(line), `missing error: ${line}\nstderr:\n${result.stderr}`);
  }
});

test("bad/rule-disable: removing a rule makes exactly its errors disappear (example 10)", (t) => {
  const dir = copyFixture(t, "bad/rule-disable");
  const before = runCli(dir, "validate");
  assert.equal(before.status, 1);
  assert.deepEqual(errorLines(before.stderr), expectedErrors("bad/rule-disable"));

  const rulesFile = path.join(dir, "specs", "schema", "validation-rules.yaml");
  const doc = load(fs.readFileSync(rulesFile, "utf8")) as { rules: { id: string }[] };
  doc.rules = doc.rules.filter((r) => r.id !== "indexes-fresh");
  fs.writeFileSync(rulesFile, JSON.stringify(doc) + "\n"); // JSON is valid YAML
  const after = runCli(dir, "validate");
  assert.equal(after.status, 0, `expected no errors, got:\n${after.stderr}`);
  assert.deepEqual(errorLines(after.stderr), []);
});

test("bad/dispatch-all-kinds: each kind dispatches and produces exactly one error per rule", (t) => {
  const dir = copyFixture(t, "bad/dispatch-all-kinds");
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  const lines = errorLines(result.stderr);
  assert.deepEqual(lines, expectedErrors("bad/dispatch-all-kinds"));
  const ruleIds = [
    "edges-endpoint-types",
    "edges-references-resolve",
    "indexes-fresh",
    "nodes-id-unique",
    "nodes-required-fields",
    "nodes-type-declared",
  ];
  for (const id of ruleIds) {
    assert.equal(lines.filter((l) => l.startsWith(`[rule: ${id}]`)).length, 1, `one error for ${id}`);
  }
});

test("unknown subcommand: usage text on stderr, exit 2", () => {
  const result = runCli(repoRoot, "frobnicate");
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes("usage: spec <index|validate>"));
});
