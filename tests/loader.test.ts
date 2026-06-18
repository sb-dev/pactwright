import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadSpec } from "../tools/loader.ts";

/**
 * Build a minimal on-disk specs/ tree with the given validation-rules.yaml
 * contents, run `fn` against the loaded spec, then remove the fixture. Only the
 * pieces loadSpec touches are written (empty nodes/, empty edges, empty schemas).
 */
function withFixture(rulesYaml: string, fn: (spec: ReturnType<typeof loadSpec>) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "spec-loader-"));
  try {
    fs.mkdirSync(path.join(root, "nodes"));
    fs.mkdirSync(path.join(root, "graph"));
    fs.mkdirSync(path.join(root, "schema"));
    fs.writeFileSync(path.join(root, "graph", "edges.yaml"), "edges: []\n");
    fs.writeFileSync(path.join(root, "schema", "node-types.yaml"), "node_types: {}\n");
    fs.writeFileSync(path.join(root, "schema", "edge-types.yaml"), "edge_types: {}\n");
    fs.writeFileSync(path.join(root, "schema", "validation-rules.yaml"), rulesYaml);
    fn(loadSpec(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("loader: comparison_required_from present → exact string", () => {
  withFixture('rules: []\ncomparison_required_from: "2026-06-18"\n', (spec) => {
    assert.equal(spec.comparisonRequiredFrom, "2026-06-18");
  });
});

test("loader: comparison_required_from absent → undefined", () => {
  withFixture("rules: []\n", (spec) => {
    assert.equal(spec.comparisonRequiredFrom, undefined);
  });
});

test("loader: comparison_required_from empty string → undefined", () => {
  withFixture('rules: []\ncomparison_required_from: ""\n', (spec) => {
    assert.equal(spec.comparisonRequiredFrom, undefined);
  });
});

test("loader: comparison_required_from non-string (number) → undefined", () => {
  withFixture("rules: []\ncomparison_required_from: 20260618\n", (spec) => {
    assert.equal(spec.comparisonRequiredFrom, undefined);
  });
});

test("loader: comparison_required_from non-string (list) → undefined", () => {
  withFixture("rules: []\ncomparison_required_from:\n  - 2026-06-18\n", (spec) => {
    assert.equal(spec.comparisonRequiredFrom, undefined);
  });
});
