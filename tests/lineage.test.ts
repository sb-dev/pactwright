import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import {
  DELIVERY_STATES,
  deriveLineage,
  deriveLineages,
  isCurrent,
  validateLineages,
  type DeliveryState,
} from "../src/graph/lineage.js";
import { fixture, loadGraphFixture } from "./helpers.js";

const lineageFixture = (name: string) => loadGraphFixture(path.join(fixture("lineage"), name));
const INTENT = "intent-quick-start-a1b2";

test("lineage: the six derived states are exactly the Delivery Graph §14 table", () => {
  assert.deepEqual(DELIVERY_STATES, [
    "open",
    "deferred",
    "rejected",
    "contracted",
    "delivering",
    "done",
  ]);
});

const valid: Array<
  [
    string,
    DeliveryState,
    { decision?: string; contract?: string; brief?: string; evidence?: string },
  ]
> = [
  ["open", "open", {}],
  ["deferred", "deferred", { decision: "decision-quick-start-b2c3" }],
  ["rejected", "rejected", { decision: "decision-quick-start-b2c3" }],
  [
    "contracted",
    "contracted",
    { decision: "decision-quick-start-b2c3", contract: "contract-quick-start-c3d4" },
  ],
  [
    "delivering",
    "delivering",
    {
      decision: "decision-quick-start-b2c3",
      contract: "contract-quick-start-c3d4",
      brief: "brief-quick-start-d4e5",
    },
  ],
  [
    "done",
    "done",
    {
      decision: "decision-quick-start-b2c3",
      contract: "contract-quick-start-c3d4",
      brief: "brief-quick-start-d4e5",
      evidence: "evidence-quick-start-e5f6",
    },
  ],
  // Superseded records are not current: the newest of every chain wins, and a
  // proceed decision that also selects a superseded contract is fine.
  [
    "superseded-chain",
    "done",
    {
      decision: "decision-quick-start-8888",
      contract: "contract-quick-start-9999",
      brief: "brief-quick-start-5555",
      evidence: "evidence-quick-start-7777",
    },
  ],
];

for (const [name, state, expected] of valid) {
  test(`lineage: fixture ${name} derives state ${state}`, () => {
    const graph = lineageFixture(name);
    assert.deepEqual(graph.problems, []);
    const result = deriveLineages(graph.nodes, graph.edges);
    assert.deepEqual(result.problems, []);
    assert.equal(result.lineages.length, 1);
    const lineage = result.lineages[0]!;
    assert.equal(lineage.intent.id, INTENT);
    assert.equal(lineage.state, state);
    assert.deepEqual(
      {
        decision: lineage.decision?.id,
        contract: lineage.contract?.id,
        brief: lineage.brief?.id,
        evidence: lineage.evidence?.id,
      },
      {
        decision: undefined,
        contract: undefined,
        brief: undefined,
        evidence: undefined,
        ...expected,
      },
    );
    assert.deepEqual(deriveLineage(INTENT, graph.nodes, graph.edges), lineage);
  });
}

test("lineage: a superseded intent's lineage is derived, frozen and flagged", () => {
  const graph = lineageFixture("superseded-intent");
  assert.deepEqual(graph.problems, []);
  const result = deriveLineages(graph.nodes, graph.edges);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    result.lineages.map((lineage) => [lineage.intent.id, lineage.state, lineage.superseded]),
    [
      ["intent-quick-start-a1b2", "open", true],
      ["intent-quick-start-v2-f6a7", "open", false],
    ],
  );
});

const invalid: Array<[string, string, RegExp]> = [
  ["two-current-decisions", "ambiguous-decision", /intent-quick-start-a1b2\.md$/],
  ["proceed-no-contract", "missing-contract", /decision-quick-start-b2c3\.md$/],
  ["proceed-only-superseded-contract", "missing-contract", /decision-quick-start-b2c3\.md$/],
  ["proceed-two-contracts", "ambiguous-contract", /decision-quick-start-b2c3\.md$/],
  ["defer-selects-contract", "unexpected-contract", /decision-quick-start-b2c3\.md$/],
  ["two-current-briefs", "ambiguous-brief", /contract-quick-start-c3d4\.md$/],
  ["two-current-evidence", "ambiguous-evidence", /brief-quick-start-d4e5\.md$/],
];

for (const [name, code, pathPattern] of invalid) {
  test(`lineage: fixture ${name} fails with ${code}`, () => {
    const graph = lineageFixture(name);
    // Nodes and edges are individually sound; only the lineage is wrong.
    assert.deepEqual(graph.problems, []);
    const result = deriveLineages(graph.nodes, graph.edges);
    assert.deepEqual(
      result.problems.map((p) => p.code),
      [code],
    );
    assert.match(result.problems[0]!.path ?? "", pathPattern);
    assert.deepEqual(result.lineages, []);
    assert.equal(deriveLineage(INTENT, graph.nodes, graph.edges), undefined);
    assert.deepEqual(validateLineages(graph.nodes, graph.edges), result.problems);
  });
}

// Delivery Graph §21 makes brief/evidence cardinality global: an ambiguity
// off the selected intent path is still a validation failure, even when the
// intent's own current lineage derives cleanly.
const offpath: Array<[string, string, RegExp, string]> = [
  [
    "two-current-briefs-offpath",
    "ambiguous-brief",
    /contract-quick-start-c3d4\.md$/,
    "rejected", // the current decision rejects; the ambiguity is on the superseded path
  ],
  [
    "two-current-evidence-offpath",
    "ambiguous-evidence",
    /brief-quick-start-d4e5\.md$/,
    "delivering", // the current brief has no evidence; the ambiguity is on the superseded brief
  ],
];

for (const [name, code, pathPattern, state] of offpath) {
  test(`lineage: fixture ${name} fails globally with ${code}`, () => {
    const graph = lineageFixture(name);
    assert.deepEqual(graph.problems, []);
    const result = deriveLineages(graph.nodes, graph.edges);
    assert.deepEqual(
      result.problems.map((p) => p.code),
      [code],
    );
    assert.match(result.problems[0]!.path ?? "", pathPattern);
    // The intent's own current lineage is unambiguous and still derived.
    assert.equal(result.lineages.length, 1);
    assert.equal(result.lineages[0]?.state, state);
    assert.deepEqual(validateLineages(graph.nodes, graph.edges), result.problems);
  });
}

test("lineage: isCurrent follows supersedes edges only", () => {
  const edges = [
    { source: "brief-x-2222", type: "supersedes", target: "brief-x-1111" },
    { source: "brief-x-2222", type: "decomposes", target: "contract-x-3333" },
  ];
  assert.equal(isCurrent("brief-x-1111", edges), false);
  assert.equal(isCurrent("brief-x-2222", edges), true);
  assert.equal(isCurrent("contract-x-3333", edges), true);
});

test("lineage: unknown or non-intent ids have no lineage", () => {
  const graph = lineageFixture("done");
  assert.equal(deriveLineage("intent-nope-0000", graph.nodes, graph.edges), undefined);
  assert.equal(deriveLineage("decision-quick-start-b2c3", graph.nodes, graph.edges), undefined);
});

test("lineage: broken edges are ignored, not re-reported", () => {
  const graph = lineageFixture("contracted");
  const edges = [
    ...graph.edges,
    // missing source, missing target, wrong endpoint type: validateEdges owns these
    { source: "decision-ghost-0000", type: "resolves", target: INTENT },
    { source: "decision-quick-start-b2c3", type: "selects", target: "contract-ghost-0000" },
    { source: "contract-quick-start-c3d4", type: "resolves", target: INTENT },
  ];
  const result = deriveLineages(graph.nodes, edges);
  assert.deepEqual(result.problems, []);
  assert.equal(result.lineages[0]?.state, "contracted");
});

test("lineage: an invalid decision is skipped, its lineage is not judged twice", () => {
  const graph = lineageFixture("contracted");
  const nodes = graph.nodes.map((node) =>
    node.type === "decision"
      ? { ...node, frontmatter: { ...node.frontmatter, outcome: "maybe" } }
      : node,
  );
  const result = deriveLineages(nodes, graph.edges);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.lineages, []);
});

test("lineage: every intent gets its own lineage, sorted by id", () => {
  const graph = lineageFixture("done");
  const other = { ...graph.nodes.find((n) => n.type === "intent")!, id: "intent-aaa-0000" };
  const result = deriveLineages([...graph.nodes, other], graph.edges);
  assert.deepEqual(
    result.lineages.map((l) => [l.intent.id, l.state]),
    [
      ["intent-aaa-0000", "open"],
      [INTENT, "done"],
    ],
  );
});
