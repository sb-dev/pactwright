/**
 * A2-G probe: a hand-authored Evidence record, judged by the full validation
 * kernel rather than by the loader alone.
 *
 * `createEvidence` always writes a closure block, so the §53 preconditions
 * cannot be skipped through the mutation path. The question this probe asks
 * is what happens to a record that never went through it — a file written by
 * hand, imported from another repository, or produced by an older runtime.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLOSURE_PROVENANCE_FROM } from "../../../src/graph/evidence-closure.js";
import { createBrief, createIntent, recordDecision } from "../../../src/graph/mutations.js";
import { serialiseEdges } from "../../../src/graph/mutations.js";
import { validateProject } from "../../../src/validate.js";
import { loadProject } from "../../../src/loader.js";
import { makeProject, observe, summary } from "./fixture.js";

/** Writes an Evidence file and its `evidences` edge straight into the repository. */
function handAuthoredEvidence(root: string, briefId: string, id: string, created: string): void {
  const edges = loadProject({ root }).graph.edges;
  writeFileSync(
    join(root, "specs", "nodes", `${id}.md`),
    `---\nid: ${id}\ntype: evidence\ntitle: Hand authored evidence\ncreated: '${created}'\n---\n\nDelivered and verified.\n`,
    "utf8",
  );
  writeFileSync(
    join(root, "specs", "graph", "edges.yml"),
    serialiseEdges([...edges, { source: id, type: "evidences", target: briefId }]),
    "utf8",
  );
}

/** A lineage with a Brief, no run, and therefore no Review of anything. */
function unreviewedLineage(name: string): { root: string; briefId: string } {
  const root = makeProject(name);
  const intent = createIntent(root, { title: `${name} intent`, body: "Body." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "Body.",
    contract: { title: `${name} contract`, body: "Body." },
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: `${name} brief`,
    body: "Body.",
  });
  return { root, briefId: brief.id };
}

for (const [label, created] of [
  ["on the cutover date", CLOSURE_PROVENANCE_FROM],
  ["one day before the cutover", "2026-09-19"],
  ["an impossible date that sorts before it", "0000-00-00"],
] as const) {
  const { root, briefId } = unreviewedLineage(`backdated-${created.replace(/-/g, "")}`);
  handAuthoredEvidence(
    root,
    briefId,
    `evidence-hand-authored-${created.replace(/-/g, "")}ab`,
    created,
  );
  const report = validateProject({ root });
  observe(
    `G-R03 hand-authored Evidence created ${label} (${created})`,
    "validate reports Evidence that never passed the §53 preconditions",
    report.ok
      ? "validate reports ok: the record is accepted with no closure block and no Review on record"
      : `rules ${report.rules.join(", ")}: ${report.problems.map((p) => p.code).join(", ")}`,
    !report.ok,
  );
}

summary();
