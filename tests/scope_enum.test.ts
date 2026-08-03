import { test } from "node:test";
import assert from "node:assert/strict";
import closedKeySet from "../tools/handlers/closed_key_set.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// The `contract-scope-valid` rule machine-checks the optional `scope` enum via
// closed_key_set in membership mode, mirroring `brief-lane-valid` for `lane`.
//
// Why it exists: `class_market_quorum` and `comparison_required` compare
// `scope === "narrow"` EXACTLY, so any other value silently means "ordinary market".
// That fails CLOSED — the author pays full process rather than escaping it — but
// without this rule nothing says why the quorum is still firing.
//
// The value set is deliberately a single key. Absence already means "ordinary
// market", so an explicit second value would be a distinction without a difference.
const RULE: Rule = { id: "contract-scope-valid", kind: "closed_key_set", scope: "nodes", type: "contract", field: "scope", mode: "member", keys: ["narrow"] };
function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[]): LoadedSpec {
  return { root: "", nodes, edges: [], nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const contract = (scope?: unknown): NodeRecord =>
  node(scope === undefined ? { id: "c", type: "contract" } : { id: "c", type: "contract", scope });

test("the recognised value → none", () => {
  assert.deepEqual(closedKeySet(RULE, spec([contract("narrow")])), []);
});

// THE load-bearing leg: absence is the default and the overwhelmingly common case.
// A rule that fired on unset contracts would red every contract in the graph.
test("unset scope → none (an ordinary market is the default)", () => {
  assert.deepEqual(closedKeySet(RULE, spec([contract()])), []);
});

test("a typo'd value → finding (the case this rule exists for)", () => {
  const findings = closedKeySet(RULE, spec([contract("narow")]));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "c");
  assert.equal(findings[0].rule, "contract-scope-valid");
  assert.match(findings[0].detail, /must be one of \[narrow\]/);
});

// Case and whitespace variants: the consuming handlers use an exact `===`, so these
// do not reduce. Pinned here so both rules agree on what an invalid value is.
for (const bad of ["Narrow", "NARROW", "narrow ", " narrow", "broad", ""]) {
  test(`scope: ${JSON.stringify(bad)} → finding`, () => {
    assert.equal(closedKeySet(RULE, spec([contract(bad)])).length, 1);
  });
}

// Non-string values. `class_market_quorum`'s legs already pin these as non-reducing;
// these pin that they are also NOT silently tolerated by the schema.
for (const bad of [true, 1, ["narrow"], { value: "narrow" }]) {
  test(`non-string scope ${JSON.stringify(bad)} → finding`, () => {
    assert.equal(closedKeySet(RULE, spec([contract(bad)])).length, 1);
  });
}

test("a non-contract node carrying `scope` is not this rule's subject", () => {
  assert.deepEqual(closedKeySet(RULE, spec([node({ id: "b", type: "brief", scope: "narow" })])), []);
});
