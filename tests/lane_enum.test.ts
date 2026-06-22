import { test } from "node:test";
import assert from "node:assert/strict";
import closedKeySet from "../tools/handlers/closed_key_set.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// The `brief-lane-valid` rule machine-checks the optional `lane` enum via
// closed_key_set in membership mode (enum_constraint covers only type/status).
const LANES = [
  "product-spec",
  "domain-backend",
  "frontend-ui",
  "data-migration",
  "api-integration",
  "test-verification",
  "observability-release",
  "docs-spec",
];
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
