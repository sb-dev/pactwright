import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { loadEdges, parseEdges } from "../src/graph/edges.js";
import { fixture } from "./helpers.js";

test("edges: parses the {source,type,target} list", () => {
  const result = parseEdges(
    { edges: [{ source: "decision-a-1111", type: "resolves", target: "intent-b-2222" }] },
    "edges.yml",
  );
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.edges, [
    { source: "decision-a-1111", type: "resolves", target: "intent-b-2222" },
  ]);
});

test("edges: empty document and empty list are valid empty stores", () => {
  assert.deepEqual(parseEdges(null, "edges.yml"), { edges: [], problems: [] });
  assert.deepEqual(parseEdges({ edges: [] }, "edges.yml"), { edges: [], problems: [] });
});

test("edges: duplicate tuples are reported and dropped", () => {
  const edge = { source: "a-x-1111", type: "resolves", target: "b-y-2222" };
  const result = parseEdges({ edges: [edge, edge] }, "edges.yml");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["duplicate-edge"],
  );
  assert.equal(result.edges.length, 1);
});

test("edges: missing fields, unknown fields and bad types are reported", () => {
  const result = parseEdges(
    { edges: [{ source: "a", type: "Resolves!", target: "b" }, { source: "a" }, "nope"], other: 1 },
    "edges.yml",
  );
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "invalid-type",
    "invalid-value",
    "missing-field",
    "missing-field",
    "unknown-field",
  ]);
});

test("edges: loadEdges reads the fixture", () => {
  const result = loadEdges(path.join(fixture("valid-project"), "specs", "graph", "edges.yml"));
  assert.deepEqual(result.problems, []);
  assert.equal(result.edges.length, 1);
});
