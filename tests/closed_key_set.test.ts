import { test } from "node:test";
import assert from "node:assert/strict";
import closedKeySet from "../tools/handlers/closed_key_set.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[]): LoadedSpec {
  return { root: "", nodes, edges: [], nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const KEYS = ["a", "b", "c"];
const SET: Rule = { id: "r-set", kind: "closed_key_set", scope: "nodes", type: "integration", field: "integration_sections", mode: "set", keys: KEYS };
const MEMBER: Rule = { id: "r-mem", kind: "closed_key_set", scope: "nodes", type: "brief", field: "lane", mode: "member", keys: KEYS };

// --- set mode (the integration_sections completeness check) ---
test("set: exact key set → none", () => {
  assert.deepEqual(closedKeySet(SET, spec([node({ id: "x", type: "integration", integration_sections: ["a", "b", "c"] })])), []);
});
test("set: missing a key → finding", () => {
  const f = closedKeySet(SET, spec([node({ id: "x", type: "integration", integration_sections: ["a", "b"] })]));
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /missing \[c\]/);
});
test("set: unexpected key → finding", () => {
  const f = closedKeySet(SET, spec([node({ id: "x", type: "integration", integration_sections: ["a", "b", "c", "z"] })]));
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /unexpected \[z\]/);
});
test("set: duplicate key → finding", () => {
  const f = closedKeySet(SET, spec([node({ id: "x", type: "integration", integration_sections: ["a", "a", "b", "c"] })]));
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /duplicate \[a\]/);
});
test("set: non-list value → finding", () => {
  const f = closedKeySet(SET, spec([node({ id: "x", type: "integration", integration_sections: "a" })]));
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /must be a list/);
});
test("set: absent field skipped (presence is required_fields' job)", () => {
  assert.deepEqual(closedKeySet(SET, spec([node({ id: "x", type: "integration" })])), []);
});
test("reads node.data only — a body carrying the keys does not satisfy an absent field", () => {
  const n: NodeRecord = { file: "x", data: { id: "x", type: "integration" }, body: "a\nb\nc" };
  assert.deepEqual(closedKeySet(SET, spec([n])), []); // body ignored; absent field still skipped
});
test("set: wrong node type ignored", () => {
  assert.deepEqual(closedKeySet(SET, spec([node({ id: "x", type: "brief", integration_sections: ["a"] })])), []);
});

// --- member mode (the lane membership check) ---
test("member: value in keys → none", () => {
  assert.deepEqual(closedKeySet(MEMBER, spec([node({ id: "x", type: "brief", lane: "b" })])), []);
});
test("member: value not in keys → finding", () => {
  const f = closedKeySet(MEMBER, spec([node({ id: "x", type: "brief", lane: "z" })]));
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /must be one of/);
});
test("member: absent field skipped (optional lane)", () => {
  assert.deepEqual(closedKeySet(MEMBER, spec([node({ id: "x", type: "brief" })])), []);
});

// --- config guard ---
test("config: missing type/field/keys or bad mode → one config finding", () => {
  assert.equal(closedKeySet({ id: "r", kind: "closed_key_set", scope: "nodes", type: "integration" }, spec([])).length, 1);
  assert.equal(
    closedKeySet({ id: "r", kind: "closed_key_set", scope: "nodes", type: "integration", field: "f", keys: ["a"], mode: "bogus" }, spec([])).length,
    1,
  );
});
