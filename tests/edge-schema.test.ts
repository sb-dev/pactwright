import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import {
  CORE_EDGE_OWNER,
  CORE_EDGE_SCHEMAS,
  CORE_EDGE_TYPES,
  createEdgeSchemaRegistry,
  edgeTypes,
  validateEdges,
  type EdgeSchemaRegistry,
} from "../src/graph/edge-schema.js";
import { loadEdges } from "../src/graph/edges.js";
import { loadNodes, type GraphNode } from "../src/graph/nodes.js";
import { CORE_NODE_SCHEMAS, validateNodes } from "../src/graph/schema.js";
import { fixture } from "./helpers.js";

/** Nodes + edges of one fixture dir, validated exactly as the loader does it. */
function loadAndValidate(dir: string, registry: EdgeSchemaRegistry = CORE_EDGE_SCHEMAS) {
  const nodes = loadNodes(path.join(dir, "specs", "nodes"));
  const edgesPath = path.join(dir, "specs", "graph", "edges.yml");
  const edges = loadEdges(edgesPath);
  return {
    nodes: nodes.nodes,
    edges: edges.edges,
    problems: [
      ...nodes.problems,
      ...validateNodes(nodes.nodes, CORE_NODE_SCHEMAS),
      ...edges.problems,
      ...validateEdges(edges.edges, nodes.nodes, registry, edgesPath),
    ],
  };
}

function node(id: string, type: string): GraphNode {
  return {
    id,
    type,
    title: id,
    created: "2026-08-18",
    frontmatter: {},
    body: "x",
    path: `${id}.md`,
  };
}

test("edge-schema: the core registry contains exactly the five core relations", () => {
  assert.deepEqual(edgeTypes(CORE_EDGE_SCHEMAS), [
    "decomposes",
    "evidences",
    "resolves",
    "selects",
    "supersedes",
  ]);
  assert.deepEqual([...CORE_EDGE_TYPES].sort(), edgeTypes(CORE_EDGE_SCHEMAS));
  assert.ok(Object.isFrozen(CORE_EDGE_SCHEMAS));
  for (const schema of Object.values(CORE_EDGE_SCHEMAS)) {
    assert.equal(schema.owner, CORE_EDGE_OWNER);
  }
  assert.deepEqual(CORE_EDGE_SCHEMAS["resolves"]?.sourceTypes, ["decision"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["resolves"]?.targetTypes, ["intent"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["selects"]?.sourceTypes, ["decision"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["selects"]?.targetTypes, ["contract"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["decomposes"]?.sourceTypes, ["brief"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["decomposes"]?.targetTypes, ["contract"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["evidences"]?.sourceTypes, ["evidence"]);
  assert.deepEqual(CORE_EDGE_SCHEMAS["evidences"]?.targetTypes, ["brief"]);
  assert.equal(CORE_EDGE_SCHEMAS["supersedes"]?.sourceTypes, "any");
  assert.equal(CORE_EDGE_SCHEMAS["supersedes"]?.sameType, true);
  assert.equal(CORE_EDGE_SCHEMAS["supersedes"]?.acyclic, true);
});

test("edge-schema: createEdgeSchemaRegistry rejects a duplicate type and stays extensible", () => {
  assert.throws(
    () =>
      createEdgeSchemaRegistry([
        { type: "resolves", owner: "core", sourceTypes: "any", targetTypes: "any" },
        { type: "resolves", owner: "operations", sourceTypes: "any", targetTypes: "any" },
      ]),
    (error: unknown) => error instanceof PactwrightError && error.code === "duplicate-edge-type",
  );
  const extended = createEdgeSchemaRegistry([
    ...Object.values(CORE_EDGE_SCHEMAS),
    {
      type: "deployed-as",
      owner: "operations",
      sourceTypes: ["evidence"],
      targetTypes: ["deployment"],
    },
  ]);
  assert.equal(edgeTypes(extended).length, 6);
  assert.equal(extended["deployed-as"]?.owner, "operations");
  assert.equal(edgeTypes(CORE_EDGE_SCHEMAS).length, 5);
});

test("edge-schema: an extension edge type validates against extension node types", () => {
  const extended = createEdgeSchemaRegistry([
    ...Object.values(CORE_EDGE_SCHEMAS),
    {
      type: "deployed-as",
      owner: "operations",
      sourceTypes: ["evidence"],
      targetTypes: ["deployment"],
    },
  ]);
  const nodes = [
    node("evidence-x-1111", "evidence"),
    node("deployment-x-2222", "deployment"),
    node("deployment-x-3333", "deployment"),
  ];
  const ok = validateEdges(
    [
      { source: "evidence-x-1111", type: "deployed-as", target: "deployment-x-2222" },
      // The shared core `supersedes` is reused by extension node types (Distribution §7).
      { source: "deployment-x-3333", type: "supersedes", target: "deployment-x-2222" },
    ],
    nodes,
    extended,
    "edges.yml",
  );
  assert.deepEqual(ok, []);
  const bad = validateEdges(
    [{ source: "deployment-x-2222", type: "deployed-as", target: "evidence-x-1111" }],
    nodes,
    extended,
    "edges.yml",
  );
  assert.deepEqual(
    bad.map((p) => p.code),
    ["invalid-source-type", "invalid-target-type"],
  );
  // Without the extension registered, the same edge is an unknown type.
  assert.deepEqual(
    validateEdges(
      [{ source: "evidence-x-1111", type: "deployed-as", target: "deployment-x-2222" }],
      nodes,
      CORE_EDGE_SCHEMAS,
      "edges.yml",
    ).map((p) => p.code),
    ["unknown-edge-type"],
  );
});

test("edge-schema: a long supersession chain validates without exhausting the stack", () => {
  const count = 20_000;
  const nodes = Array.from({ length: count }, (_, i) => node(`intent-chain-${i}`, "intent"));
  const edges = Array.from({ length: count - 1 }, (_, i) => ({
    source: `intent-chain-${i}`,
    type: "supersedes",
    target: `intent-chain-${i + 1}`,
  }));
  assert.deepEqual(validateEdges(edges, nodes, CORE_EDGE_SCHEMAS, "edges.yml"), []);
});

test("edge-schema: prototype member names are unknown types, not Object.prototype hits", () => {
  const nodes = loadAndValidate(path.join(fixture("edges"), "valid")).nodes;
  const source = nodes[0]!.id;
  for (const type of ["constructor", "valueof"]) {
    const problems = validateEdges(
      [{ source, type, target: source }],
      nodes,
      CORE_EDGE_SCHEMAS,
      "edges.yml",
    );
    assert.equal(problems[0]?.code, "unknown-edge-type", type);
  }
});

test("edge-schema: the positive fixture validates cleanly across all five relations", () => {
  const result = loadAndValidate(path.join(fixture("edges"), "valid"));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    [...new Set(result.edges.map((e) => e.type))].sort(),
    edgeTypes(CORE_EDGE_SCHEMAS),
  );
});

const negatives: Array<[string, string]> = [
  ["unknown-type", "unknown-edge-type"],
  ["missing-source", "missing-source"],
  ["missing-target", "missing-target"],
  ["wrong-source-type", "invalid-source-type"],
  ["wrong-target-type", "invalid-target-type"],
  ["duplicate-tuple", "duplicate-edge"],
  ["self-supersession", "self-loop"],
  ["cross-type-supersession", "endpoint-type-mismatch"],
  ["supersession-cycle", "edge-cycle"],
  ["supersession-two-cycle", "edge-cycle"],
];

for (const [name, code] of negatives) {
  test(`edge-schema: negative fixture ${name} fails with ${code}`, () => {
    const result = loadAndValidate(path.join(fixture("edges"), "invalid", name));
    assert.deepEqual(
      result.problems.map((p) => p.code),
      [code],
      JSON.stringify(result.problems),
    );
    assert.match(result.problems[0]?.path ?? "", /specs\/graph\/edges\.yml$/);
  });
}

test("edge-schema: a cycle is reported once, deterministically, from its smallest id", () => {
  const dir = path.join(fixture("edges"), "invalid", "supersession-cycle");
  const first = loadAndValidate(dir).problems;
  const second = loadAndValidate(dir).problems;
  assert.deepEqual(first, second);
  assert.equal(first.length, 1);
  assert.match(
    first[0]?.message ?? "",
    /brief-x-4444 -> brief-x-5555 -> brief-x-6666 -> brief-x-4444/,
  );
});

test("edge-schema: a missing endpoint stops further checks for that edge only", () => {
  const nodes = [node("decision-x-1111", "decision"), node("intent-x-2222", "intent")];
  const problems = validateEdges(
    [
      { source: "decision-x-1111", type: "resolves", target: "intent-x-9999" },
      { source: "intent-x-2222", type: "resolves", target: "decision-x-1111" },
    ],
    nodes,
    CORE_EDGE_SCHEMAS,
    "edges.yml",
  );
  assert.deepEqual(
    problems.map((p) => p.code),
    ["missing-target", "invalid-source-type", "invalid-target-type"],
  );
});
