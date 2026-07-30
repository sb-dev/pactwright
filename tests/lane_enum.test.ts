import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import closedKeySet from "../tools/handlers/closed_key_set.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The `brief-lane-valid` rule machine-checks the optional `lane` enum via
// closed_key_set in membership mode (enum_constraint covers only type/status).
// The lane list is LOADED from that rule rather than hand-written here: a
// hand-written copy would be a further duplicate of the catalog, and
// `tests/lane_catalog_drift.test.ts` already pins the rule's keys against the
// CLAUDE.md catalog table, so reading the rule inherits that pin transitively.
// Load idiom copied from `tests/lane_catalog_drift.test.ts` — do not introduce a
// second way of reading the rules file.
const rulesDoc = load(fs.readFileSync(path.join(repoRoot, "specs", "schema", "validation-rules.yaml"), "utf8")) as {
  rules: { id: string; keys?: string[] }[];
};
const laneRule = rulesDoc.rules.find((r) => r.id === "brief-lane-valid");
assert.ok(laneRule?.keys, "brief-lane-valid rule must declare keys");
const LANES = laneRule!.keys!;
const RULE: Rule = { id: "brief-lane-valid", kind: "closed_key_set", scope: "nodes", type: "brief", field: "lane", mode: "member", keys: LANES };
function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[]): LoadedSpec {
  return { root: "", nodes, edges: [], nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}

test("a catalog lane → none", () => {
  assert.deepEqual(closedKeySet(RULE, spec([node({ id: "b", type: "brief", lane: "test-verification" })])), []);
});
test("a typo'd lane → finding", () => {
  assert.equal(closedKeySet(RULE, spec([node({ id: "b", type: "brief", lane: "test-verficiation" })])).length, 1);
});
test("an off-catalog lane → finding", () => {
  assert.equal(closedKeySet(RULE, spec([node({ id: "b", type: "brief", lane: "testing" })])).length, 1);
});
test("unset lane → none (unlaned single brief allowed)", () => {
  assert.deepEqual(closedKeySet(RULE, spec([node({ id: "b", type: "brief" })])), []);
});
