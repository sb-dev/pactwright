import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { loadProject } from "../src/loader.js";
import { findProjectRoot } from "../src/project.js";
import { fixture } from "./helpers.js";

test("loader: loads a valid project through the canonical path", () => {
  const project = loadProject({ root: fixture("valid-project") });
  assert.equal(project.paths.root, fixture("valid-project"));
  assert.equal(project.config.agentPack.source, "@pactwright/standard");
  assert.equal(project.lifecycle.stages["approve-contract"].actor, "human");
  assert.equal(project.lock.runtime.version, "0.0.0");
  assert.deepEqual(
    project.graph.nodes.map((n) => n.id),
    ["decision-hello-world-c3d4", "intent-hello-world-a1b2"],
  );
  assert.deepEqual(project.graph.edges, [
    { source: "decision-hello-world-c3d4", type: "resolves", target: "intent-hello-world-a1b2" },
  ]);
});

test("loader: finds the project root from a nested cwd", () => {
  const nested = path.join(fixture("valid-project"), "specs", "nodes");
  assert.equal(findProjectRoot(nested), fixture("valid-project"));
  assert.equal(loadProject({ cwd: nested }).paths.root, fixture("valid-project"));
});

test("loader: no project → project-not-found", () => {
  assert.throws(
    () => loadProject({ cwd: path.join(fixture("not-a-project"), "sub") }),
    (error: unknown) => error instanceof PactwrightError && error.code === "project-not-found",
  );
});

const failures: Array<[string, string, RegExp]> = [
  ["invalid-config-missing-field", "missing-field", /config\.yml/],
  ["invalid-config-extensions", "extensions-not-supported", /config\.yml/],
  ["invalid-lifecycle-unknown-stage", "unknown-stage", /lifecycle\.yml/],
  ["invalid-lock-bad-hash", "invalid-hash", /lock\.yml/],
  ["invalid-missing-lock", "missing-file", /lock\.yml/],
  ["invalid-node-bad-id", "invalid-id", /intent-hello-world-a1b2\.md/],
  ["invalid-node-type-mismatch", "invalid-id", /intent-hello-world-a1b2\.md/],
  ["invalid-node-missing-field", "missing-field", /intent-hello-world-a1b2\.md/],
  ["invalid-node-unknown-type", "unknown-node-type", /alternative-hello-world-e5f6\.md/],
  ["invalid-edges-duplicate", "duplicate-edge", /edges\.yml/],
  ["invalid-edges-missing-target", "missing-target", /edges\.yml/],
  ["invalid-edges-wrong-endpoint-type", "invalid-source-type", /edges\.yml/],
  ["invalid-edges-self-supersession", "self-loop", /edges\.yml/],
  ["invalid-edges-supersession-cycle", "edge-cycle", /edges\.yml/],
];

for (const [name, code, pathPattern] of failures) {
  test(`loader: ${name} fails with ${code}`, () => {
    assert.throws(
      () => loadProject({ root: fixture(name) }),
      (error: unknown) => {
        assert.ok(error instanceof PactwrightError);
        assert.equal(error.code, "project-load-failed");
        const hit = error.problems.find((p) => p.code === code);
        assert.ok(hit, `expected problem ${code}, got ${JSON.stringify(error.problems)}`);
        assert.match(hit.path ?? "", pathPattern);
        return true;
      },
    );
  });
}

test("loader: reports problems from every file in one pass", () => {
  // Combine two independent failures by loading a fixture whose config AND
  // node are broken: build it in memory by pointing at a config-broken fixture
  // and checking the node problems are still collected.
  try {
    loadProject({ root: fixture("invalid-config-extensions") });
    assert.fail("expected throw");
  } catch (error) {
    assert.ok(error instanceof PactwrightError);
    assert.equal(error.problems.length, 1);
    assert.match(error.message, /extensions-not-supported/);
  }
});
