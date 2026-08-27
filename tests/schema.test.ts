import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { checkNodeIdImmutability, loadNodes, parseNodeFile } from "../src/graph/nodes.js";
import {
  CORE_NODE_SCHEMAS,
  CORE_NODE_TYPES,
  DECISION_OUTCOMES,
  createNodeSchemaRegistry,
  decisionFields,
  nodeTypes,
  parseDecidedBy,
  validateNode,
  validateNodes,
} from "../src/graph/schema.js";
import { fixture } from "./helpers.js";

function nodesDir(...parts: string[]): string {
  return path.join(fixture("schema"), ...parts, "specs", "nodes");
}

/** Every problem from parsing plus schema validation, as the loader sees it. */
function loadAndValidate(dir: string) {
  const loaded = loadNodes(dir);
  return {
    nodes: loaded.nodes,
    problems: [...loaded.problems, ...validateNodes(loaded.nodes, CORE_NODE_SCHEMAS)],
  };
}

test("schema: the core registry contains exactly the five Delivery node types", () => {
  assert.deepEqual(nodeTypes(CORE_NODE_SCHEMAS), [
    "brief",
    "contract",
    "decision",
    "evidence",
    "intent",
  ]);
  assert.deepEqual([...CORE_NODE_TYPES].sort(), nodeTypes(CORE_NODE_SCHEMAS));
  assert.ok(Object.isFrozen(CORE_NODE_SCHEMAS));
  for (const transient of ["alternative", "delivery", "review", "execution"]) {
    assert.equal(CORE_NODE_SCHEMAS[transient], undefined);
  }
});

test("schema: only decision has type-specific required fields", () => {
  assert.deepEqual(CORE_NODE_SCHEMAS["decision"]?.requiredFields, ["decided_by", "outcome"]);
  for (const type of ["intent", "contract", "brief", "evidence"]) {
    assert.deepEqual(CORE_NODE_SCHEMAS[type]?.requiredFields, []);
  }
  assert.deepEqual(DECISION_OUTCOMES, ["proceed", "reject", "defer"]);
});

test("schema: createNodeSchemaRegistry rejects a duplicate type and stays extensible", () => {
  assert.throws(
    () =>
      createNodeSchemaRegistry([
        { type: "intent", requiredFields: [] },
        { type: "intent", requiredFields: [] },
      ]),
    (error: unknown) => error instanceof PactwrightError && error.code === "duplicate-node-type",
  );
  const extended = createNodeSchemaRegistry([
    ...Object.values(CORE_NODE_SCHEMAS),
    { type: "asset", requiredFields: ["format"] },
  ]);
  assert.equal(nodeTypes(extended).length, 6);
  assert.equal(nodeTypes(CORE_NODE_SCHEMAS).length, 5);
});

test("schema: the positive fixture parses and validates all five types cleanly", () => {
  const result = loadAndValidate(nodesDir("valid"));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    [...new Set(result.nodes.map((n) => n.type))].sort(),
    nodeTypes(CORE_NODE_SCHEMAS),
  );
  const decisions = result.nodes.filter((n) => n.type === "decision").map((n) => decisionFields(n));
  assert.deepEqual(decisions, [
    { outcome: "proceed", decidedBy: { kind: "human", name: "samir" } },
    { outcome: "defer", decidedBy: { kind: "agent", name: "spec" } },
    { outcome: "reject", decidedBy: { kind: "automation", name: "pactwright" } },
  ]);
  const withExtra = result.nodes.find((n) => n.id === "decision-quick-start-d4e5")!;
  assert.equal(withExtra.frontmatter["priority"], "low");
});

const negatives: Array<[string, string]> = [
  ["unknown-type-alternative", "unknown-node-type"],
  ["unknown-type-delivery", "unknown-node-type"],
  ["unknown-type-review", "unknown-node-type"],
  ["unknown-type-execution", "unknown-node-type"],
  ["decision-missing-decided-by", "missing-field"],
  ["decision-missing-outcome", "missing-field"],
  ["decision-bad-outcome", "invalid-outcome"],
  ["decision-outcome-not-string", "invalid-outcome"],
  ["decision-actor-no-kind", "invalid-actor"],
  ["decision-actor-bad-kind", "invalid-actor"],
  ["decision-actor-empty-name", "invalid-actor"],
  ["id-uppercase", "invalid-id"],
  ["id-underscore", "invalid-id"],
  ["id-no-hash", "invalid-id"],
  ["id-hash-not-hex", "invalid-id"],
  ["id-hash-too-short", "invalid-id"],
  ["id-no-slug", "invalid-id"],
  ["id-type-prefix-mismatch", "invalid-id"],
  ["missing-title", "missing-field"],
  ["empty-body", "missing-body"],
];

for (const [name, code] of negatives) {
  test(`schema: negative fixture ${name} fails with ${code}`, () => {
    const result = loadAndValidate(nodesDir("invalid", name));
    assert.deepEqual(
      result.problems.map((p) => p.code),
      [code],
      JSON.stringify(result.problems),
    );
    assert.match(result.problems[0]?.path ?? "", /specs\/nodes\/[^/]+\.md$/);
  });
}

test("schema: unknown-node-type names the registered types", () => {
  const node = parseNodeFile(
    "---\nid: alternative-x-1111\ntype: alternative\ntitle: T\ncreated: 2026-08-17\n---\n\nBody\n",
    "specs/nodes/alternative-x-1111.md",
  ).value!;
  const problems = validateNode(node, CORE_NODE_SCHEMAS);
  assert.equal(problems[0]?.code, "unknown-node-type");
  assert.match(problems[0]?.message ?? "", /brief, contract, decision, evidence, intent/);
});

test("schema: prototype member names are unknown types, not Object.prototype hits", () => {
  for (const type of ["constructor", "valueof", "hasownproperty"]) {
    const node = parseNodeFile(
      `---\nid: ${type}-x-1111\ntype: ${type}\ntitle: T\ncreated: 2026-08-17\n---\n\nBody\n`,
      `specs/nodes/${type}-x-1111.md`,
    ).value!;
    const problems = validateNode(node, CORE_NODE_SCHEMAS);
    assert.equal(problems[0]?.code, "unknown-node-type", type);
  }
});

test("schema: decided_by is <kind>:<name> with kind human|agent|automation", () => {
  assert.deepEqual(parseDecidedBy("human:samir"), { kind: "human", name: "samir" });
  assert.deepEqual(parseDecidedBy("agent:@pactwright/standard/spec"), {
    kind: "agent",
    name: "@pactwright/standard/spec",
  });
  assert.deepEqual(parseDecidedBy("automation:pactwright"), {
    kind: "automation",
    name: "pactwright",
  });
  for (const bad of ["samir", "robot:x", "human:", "human: samir", "HUMAN:samir", ""]) {
    assert.equal(parseDecidedBy(bad), undefined, bad);
  }
});

test("schema: decisionFields is undefined for non-decisions and invalid decisions", () => {
  const intent = loadNodes(nodesDir("valid")).nodes.find((n) => n.type === "intent")!;
  assert.equal(decisionFields(intent), undefined);
  const bad = loadNodes(nodesDir("invalid", "decision-bad-outcome")).nodes[0]!;
  assert.equal(decisionFields(bad), undefined);
});

test("schema: an id edited in place is rejected at parse time", () => {
  const result = loadAndValidate(nodesDir("id-change", "after-edited-in-place"));
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["filename-mismatch"],
  );
});

test("schema: a renamed node with a new id is rejected as an id change", () => {
  const before = loadNodes(nodesDir("id-change", "before")).nodes;
  const renamed = loadNodes(nodesDir("id-change", "after-renamed")).nodes;
  const problems = checkNodeIdImmutability(before, renamed);
  assert.deepEqual(
    problems.map((p) => p.code),
    ["id-removed"],
  );
  assert.match(problems[0]?.message ?? "", /"intent-hello-world-a1b2".*IDs never change/);
  assert.match(problems[0]?.path ?? "", /before\/specs\/nodes\/intent-hello-world-a1b2\.md$/);
});

test("schema: unchanged and added nodes keep id immutability satisfied", () => {
  const before = loadNodes(nodesDir("id-change", "before")).nodes;
  const added = loadNodes(nodesDir("id-change", "after-added")).nodes;
  assert.deepEqual(checkNodeIdImmutability(before, before), []);
  assert.deepEqual(checkNodeIdImmutability(before, added), []);
  assert.deepEqual(checkNodeIdImmutability([], before), []);
});
