import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { HASH_PATTERN } from "../src/config/lock.js";
import type { GraphNode } from "../src/graph/nodes.js";
import {
  REVISION_PATTERN,
  REVISION_VERSION,
  canonicalGraphPayload,
  canonicalJson,
  graphRevision,
} from "../src/graph/revision.js";
import { loadProject } from "../src/loader.js";
import { fixture } from "./helpers.js";

const revisionOf = (name: string) =>
  graphRevision(loadProject({ root: path.join(fixture("revision"), name) }).graph);

/**
 * Pinned so an accidental change to the canonical payload shape is caught.
 * If this changes on purpose, bump REVISION_VERSION and update this value.
 */
const BASE_REVISION = "sha256:71c26df846185c4267c860d5820dc1f9a6104cae24e443618b6d6dc241038b9d";

test("revision: identical canonical state produces an identical revision", () => {
  // same-state reorders frontmatter keys and edges, uses CRLF in one node,
  // adds specs/reports, .claude and docs files, and changes lock.yml.
  assert.equal(revisionOf("same-state"), revisionOf("base"));
});

test("revision: generated-file changes leave the revision unchanged", () => {
  assert.equal(revisionOf("generated-change"), revisionOf("base"));
});

test("revision: canonical node or edge changes change the revision", () => {
  const base = revisionOf("base");
  const node = revisionOf("node-change");
  const edge = revisionOf("edge-change");
  assert.notEqual(node, base);
  assert.notEqual(edge, base);
  assert.notEqual(edge, node);
});

test("revision: the base fixture matches its pinned revision", () => {
  assert.equal(REVISION_VERSION, 1);
  assert.equal(revisionOf("base"), BASE_REVISION);
});

test("revision: revisions have the lock-file hash shape", () => {
  assert.equal(REVISION_PATTERN, HASH_PATTERN);
  assert.match(revisionOf("base"), REVISION_PATTERN);
  assert.match(graphRevision({ nodes: [], edges: [] }), REVISION_PATTERN);
});

function node(
  id: string,
  frontmatter: Record<string, unknown>,
  body: string,
  dir: string,
): GraphNode {
  return {
    id,
    type: "intent",
    title: id,
    created: "2026-08-18",
    frontmatter,
    body,
    path: `${dir}/${id}.md`,
  };
}

test("revision: canonicalJson sorts keys recursively and drops undefined", () => {
  assert.equal(
    canonicalJson({ b: [3, { z: 1, a: undefined, y: null }], a: "x" }),
    '{"a":"x","b":[3,{"y":null,"z":1}]}',
  );
});

test("revision: the payload ignores paths and input order", () => {
  const a = node("intent-b-2222", { id: "intent-b-2222", tags: { y: 1, x: 2 } }, "b", "one");
  const b = node("intent-a-1111", { id: "intent-a-1111" }, "a\r\nline", "two");
  const forward = canonicalGraphPayload({
    nodes: [a, b],
    edges: [
      { source: "s", type: "t", target: "u" },
      { source: "s", type: "a", target: "u" },
    ],
    records: [
      { owner: "ops", kind: "deployment", id: "d-2", record: { z: 1, a: [1] } },
      { owner: "ops", kind: "asset", id: "d-1", record: null },
    ],
  });
  const backward = canonicalGraphPayload({
    nodes: [
      { ...b, path: "elsewhere/x.md" },
      { ...a, path: "nope.md" },
    ],
    edges: [
      { source: "s", type: "a", target: "u" },
      { source: "s", type: "t", target: "u" },
    ],
    records: [
      { owner: "ops", kind: "asset", id: "d-1", record: null },
      { owner: "ops", kind: "deployment", id: "d-2", record: { a: [1], z: 1 } },
    ],
  });
  assert.equal(forward, backward);
  assert.equal(
    forward,
    '{"edges":[{"source":"s","target":"u","type":"a"},{"source":"s","target":"u","type":"t"}],' +
      '"nodes":[{"body":"a\\nline","frontmatter":{"id":"intent-a-1111"},"id":"intent-a-1111"},' +
      '{"body":"b","frontmatter":{"id":"intent-b-2222","tags":{"x":2,"y":1}},"id":"intent-b-2222"}],' +
      '"records":[{"id":"d-1","kind":"asset","owner":"ops","record":null},' +
      '{"id":"d-2","kind":"deployment","owner":"ops","record":{"a":[1],"z":1}}],"version":1}',
  );
  assert.doesNotMatch(forward, /path/);
});

test("revision: extension records participate; omitted records equal an empty list", () => {
  const nodes: GraphNode[] = [];
  const edges = [] as const;
  assert.equal(graphRevision({ nodes, edges }), graphRevision({ nodes, edges, records: [] }));
  assert.notEqual(
    graphRevision({ nodes, edges }),
    graphRevision({ nodes, edges, records: [{ owner: "ops", kind: "asset", id: "a", record: 1 }] }),
  );
});
