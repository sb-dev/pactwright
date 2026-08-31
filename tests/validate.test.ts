import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { graphRevision } from "../src/graph/revision.js";
import { loadProject } from "../src/loader.js";
import { validateProject } from "../src/validate.js";
import { fixture, loadGraphFixture, makeTempProject, notAProject } from "./helpers.js";

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

test("validate: a valid project reports ok with counts and the graph revision", () => {
  const root = fixture("valid-project");
  const report = validateProject({ root });
  assert.equal(report.ok, true);
  assert.deepEqual(report.problems, []);
  const project = loadProject({ root });
  assert.deepEqual(report.summary, {
    nodes: 3,
    edges: 2,
    lineages: 1,
    revision: graphRevision(project.graph),
  });
});

const invalid: Array<[string, string]> = [
  ["invalid-lineage-ambiguous", "ambiguous-decision"],
  ["invalid-edges-supersession-cycle", "edge-cycle"],
  ["invalid-edges-missing-target", "missing-target"],
  ["invalid-node-bad-id", "invalid-id"],
  ["invalid-lifecycle-bad-actor", "invalid-value"],
];

for (const [name, code] of invalid) {
  test(`validate: ${name} is reported with ${code}`, () => {
    const report = validateProject({ root: fixture(name) });
    assert.equal(report.ok, false);
    assert.equal(report.summary, undefined);
    assert.ok(
      report.problems.some((p) => p.code === code),
      `expected ${code} in ${JSON.stringify(report.problems.map((p) => p.code))}`,
    );
  });
}

// Delivery Graph §21: brief/evidence cardinality is a global constraint,
// not a per-selected-path check — off-path ambiguities must fail too.
const offpath: Array<[string, string]> = [
  ["two-current-briefs-offpath", "ambiguous-brief"],
  ["two-current-evidence-offpath", "ambiguous-evidence"],
];

for (const [name, code] of offpath) {
  test(`validate: ${name} fails globally with ${code}`, () => {
    const root = makeTempProject({ lineage: name });
    tempDirs.push(root);
    const report = validateProject({ root });
    assert.equal(report.ok, false);
    assert.ok(
      report.problems.some((p) => p.code === code),
      `expected ${code} in ${JSON.stringify(report.problems.map((p) => p.code))}`,
    );
  });
}

test("validate: every problem is reported in one pass", () => {
  const report = validateProject({ root: fixture("invalid-lineage-ambiguous") });
  const graph = loadGraphFixture(fixture("invalid-lineage-ambiguous"));
  assert.ok(report.problems.length >= graph.problems.length);
});

test("validate: no project is a reported problem, not a crash", () => {
  const report = validateProject({ cwd: notAProject() });
  assert.equal(report.ok, false);
  assert.equal(report.problems[0]?.code, "project-not-found");
});
