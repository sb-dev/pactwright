import { test } from "node:test";
import assert from "node:assert/strict";
import listField from "../tools/handlers/list_field.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// The `integration-sections-list` rule reuses the existing list_field handler
// VERBATIM on a second node type (integration) and field (integration_sections).
const RULE: Rule = { id: "integration-sections-list", kind: "list_field", scope: "nodes", type: "integration", field: "integration_sections" };
function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[]): LoadedSpec {
  return { root: "", nodes, edges: [], nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}

test("empty list → finding", () => {
  assert.equal(listField(RULE, spec([node({ id: "x", type: "integration", integration_sections: [] })])).length, 1);
});
test("non-string item → finding", () => {
  assert.equal(listField(RULE, spec([node({ id: "x", type: "integration", integration_sections: ["a", 3] })])).length, 1);
});
test("absent field → none (presence is required_fields' job)", () => {
  assert.deepEqual(listField(RULE, spec([node({ id: "x", type: "integration" })])), []);
});
test("non-empty string list → none", () => {
  assert.deepEqual(listField(RULE, spec([node({ id: "x", type: "integration", integration_sections: ["a", "b"] })])), []);
});
