import { test } from "node:test";
import assert from "node:assert/strict";
import classRange from "../tools/handlers/class_range.ts";
import type { LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

function spec(nodes: NodeRecord[]): LoadedSpec {
  return { root: "", nodes, edges: [], nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}

const RULE: Rule = {
  id: "nodes-class-in-range",
  kind: "class_range",
  scope: "nodes",
  types: ["intent", "contract"],
  values: [0, 1, 2, 3],
};

test("class_range: every allowed integer passes", () => {
  const nodes = [0, 1, 2, 3].map((c, i) => node({ id: `intent-x${i}`, type: "intent", class: c }));
  assert.deepEqual(classRange(RULE, spec(nodes)), []);
});

test("class_range: 2.0 passes (under CORE_SCHEMA it parses to the integer 2)", () => {
  // In JS there is no distinct 2.0; the literal IS the number 2, exactly what
  // the YAML loader produces for `class: 2.0`. Number.isInteger(2) is true.
  assert.deepEqual(classRange(RULE, spec([node({ id: "contract-a", type: "contract", class: 2.0 })])), []);
});

test("class_range: out-of-range integers fail", () => {
  for (const bad of [4, -1]) {
    const findings = classRange(RULE, spec([node({ id: "intent-b", type: "intent", class: bad })]));
    assert.equal(findings.length, 1);
    assert.equal(findings[0].rule, "nodes-class-in-range");
    assert.equal(findings[0].kind, "class_range");
    assert.equal(findings[0].subject, "intent-b");
    assert.equal(findings[0].detail, "node intent-b field 'class' must be an integer in [0, 1, 2, 3]");
  }
});

test("class_range: a string is not a number and fails", () => {
  const findings = classRange(RULE, spec([node({ id: "intent-c", type: "intent", class: "2" })]));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].detail, "node intent-c field 'class' must be an integer in [0, 1, 2, 3]");
});

test("class_range: a non-integral number fails", () => {
  const findings = classRange(RULE, spec([node({ id: "contract-d", type: "contract", class: 2.5 })]));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "contract-d");
});

test("class_range: an absent or null class is skipped (presence is required_fields' job)", () => {
  assert.deepEqual(classRange(RULE, spec([node({ id: "intent-e", type: "intent" })])), []);
  assert.deepEqual(classRange(RULE, spec([node({ id: "intent-f", type: "intent", class: null })])), []);
});

test("class_range: nodes of other types are ignored even with a bad class", () => {
  const nodes = [
    node({ id: "brief-g", type: "brief", class: 9 }),
    node({ id: "decision-h", type: "decision", class: "nope" }),
  ];
  assert.deepEqual(classRange(RULE, spec(nodes)), []);
});

test("class_range: misconfigured rule reports itself", () => {
  const findings = classRange({ id: "nodes-class-in-range", kind: "class_range", scope: "edges" }, spec([]));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "specs/schema/validation-rules.yaml");
});
