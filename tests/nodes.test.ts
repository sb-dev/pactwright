import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { checkNodeId, loadNodes, parseNodeFile } from "../src/graph/nodes.js";
import { fixture } from "./helpers.js";

const good = `---
id: intent-hello-world-a1b2
type: intent
title: Hello
created: 2026-08-17
priority: high
---

Body text.
`;

test("nodes: parses common frontmatter, keeps extra fields and the body", () => {
  const result = parseNodeFile(good, "specs/nodes/intent-hello-world-a1b2.md");
  assert.deepEqual(result.problems, []);
  const node = result.value!;
  assert.equal(node.id, "intent-hello-world-a1b2");
  assert.equal(node.type, "intent");
  assert.equal(node.title, "Hello");
  assert.equal(node.created, "2026-08-17");
  assert.equal(node.frontmatter["priority"], "high");
  assert.equal(node.body, "Body text.");
});

test("nodes: created stays a string, never a Date", () => {
  const node = parseNodeFile(good, "specs/nodes/intent-hello-world-a1b2.md").value!;
  assert.equal(typeof node.created, "string");
});

test("nodes: id format <type>-<slug>-<short-hash> is enforced", () => {
  assert.equal(checkNodeId("intent-hello-world-a1b2", "intent"), undefined);
  assert.equal(checkNodeId("evidence-x-deadbeef", "evidence"), undefined);
  assert.match(checkNodeId("Intent_Hello", "intent")!, /must match/);
  assert.match(checkNodeId("intent-a1b2", "intent")!, /must match/);
  assert.match(checkNodeId("brief-hello-world-a1b2", "intent")!, /must start with/);
  assert.match(checkNodeId("intent-hello-zzzz", "intent")!, /must match/);
});

test("nodes: missing fields, bad id, bad date, filename mismatch and empty body are reported", () => {
  const text = `---\nid: intent-Hello-a1b2\ntype: intent\ncreated: 17/08/2026\n---\n\n`;
  const result = parseNodeFile(text, "specs/nodes/other.md");
  assert.deepEqual(result.problems.map((p) => p.code).sort(), [
    "filename-mismatch",
    "invalid-id",
    "invalid-value",
    "missing-body",
    "missing-field",
  ]);
});

test("nodes: file without frontmatter is rejected", () => {
  const result = parseNodeFile("# no frontmatter\n", "specs/nodes/x.md");
  assert.deepEqual(
    result.problems.map((p) => p.code),
    ["missing-frontmatter"],
  );
});

test("nodes: loadNodes reads a directory sorted by id and reports duplicates", () => {
  const dir = path.join(fixture("valid-project"), "specs", "nodes");
  const result = loadNodes(dir);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    result.nodes.map((n) => n.id),
    ["contract-hello-world-d4e5", "decision-hello-world-c3d4", "intent-hello-world-a1b2"],
  );
  const missing = loadNodes(path.join(fixture("valid-project"), "specs", "nope"));
  assert.equal(missing.problems[0]?.code, "missing-directory");
});

test("nodes: a directory named *.md is an unreadable-file problem, not a crash", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pactwright-nodes-"));
  try {
    cpSync(path.join(fixture("valid-project"), "specs", "nodes"), dir, { recursive: true });
    mkdirSync(path.join(dir, "intent-trap-0000.md"));
    const result = loadNodes(dir);
    assert.equal(result.problems.length, 1);
    assert.equal(result.problems[0]?.code, "unreadable-file");
    assert.equal(result.nodes.length, 3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
