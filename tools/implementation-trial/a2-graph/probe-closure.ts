/**
 * A2-G probe: the §53 closure preconditions as a guard over graph writes.
 *
 * `checkEvidenceClosure` is what stands between a Review and an Evidence
 * node. Every case below drives the real mutation, provenance and reducer
 * code; only the run's starting state is written directly, with the
 * runtime's own `beginExecution`/`writeExecutionState`, because starting a
 * run otherwise requires an agent executor (a different audit's boundary).
 * Nothing here substitutes a double for the code under test.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkEvidenceClosure } from "../../../src/graph/closure.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../../../src/graph/mutations.js";
import { beginExecution, writeExecutionState } from "../../../src/lifecycle/state.js";
import { recordDelivery, recordReview } from "../../../src/lifecycle/provenance.js";
import { loadProject } from "../../../src/loader.js";
import { makeProject, observe, summary } from "./fixture.js";

interface Delivering {
  readonly root: string;
  readonly briefId: string;
}

/** A project standing at its Evidence step, with a passing Review on record. */
function deliveringProject(
  name: string,
  options: { git?: boolean; deliveredRevision?: string },
): Delivering {
  const root = makeProject(name, { git: options.git !== false });
  const intent = createIntent(root, { title: `${name} intent`, body: "Probe intent body." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "Probe decision body.",
    contract: { title: `${name} contract`, body: "Probe contract body." },
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: `${name} brief`,
    body: "Probe brief body.",
  });
  writeExecutionState(root, beginExecution(brief.id, "direct", "delivery"));
  recordDelivery(root, {
    anchor: brief.id,
    ...(options.deliveredRevision === undefined ? {} : { revision: options.deliveredRevision }),
  });
  recordReview(root, { anchor: brief.id, outcome: "pass" });
  return { root, briefId: brief.id };
}

function write(root: string, path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf8");
}

function closes(root: string, briefId: string): { ok: boolean; failed: string } {
  const check = checkEvidenceClosure(loadProject({ root }), briefId);
  return { ok: check.ok, failed: check.failed.join(", ") };
}

/* G-CLO-1 — positive control: content changes after Review, closure refused. */
{
  const { root, briefId } = deliveringProject("control", {});
  write(root, "src/delivered.ts", "export const delivered = 1;\n");
  const after = closes(root, briefId);
  observe(
    "G-CLO-1 default identity, content changed after Review (positive control)",
    "closure is refused: latest-delivery-reviewed",
    after.ok ? "closure permitted" : `refused (${after.failed})`,
    !after.ok,
  );
}

/* G-CLO-2 — a caller-supplied delivery revision (PR #39 R02, trigger 1). */
{
  const { root, briefId } = deliveringProject("supplied", { deliveredRevision: "delivered-1" });
  write(root, "src/delivered.ts", "export const delivered = 1;\n");
  write(root, "src/more.ts", "export const more = 2;\n");
  const after = closes(root, briefId);
  observe(
    "G-CLO-2 caller-supplied delivery revision",
    "closure is refused: the repository no longer matches what was reviewed",
    after.ok ? "closure permitted with no repository check performed" : `refused (${after.failed})`,
    !after.ok,
  );
}

/* G-CLO-3 — a project outside a git work tree (PR #39 R02, trigger 2). */
{
  const { root, briefId } = deliveringProject("nogit", { git: false });
  write(root, "src/delivered.ts", "export const delivered = 1;\n");
  const after = closes(root, briefId);
  observe(
    "G-CLO-3 project outside a git work tree",
    "closure is refused, or the unresolvable identity fails explicitly",
    after.ok
      ? 'closure permitted; both identities are the literal "none"'
      : `refused (${after.failed})`,
    !after.ok,
  );
}

/* G-CLO-4 — a delivered change confined to the excluded adapter surface. */
{
  const { root, briefId } = deliveringProject("adapter", {});
  write(root, ".claude/commands/deliver-brief.md", "# rewritten after the Review\n");
  write(root, ".claude/agents/implementer.md", "# rewritten after the Review\n");
  const after = closes(root, briefId);
  observe(
    "G-CLO-4 adapter surface rewritten after Review",
    "closure is refused, or the change is declared as outside review scope",
    after.ok
      ? "closure permitted; the digest excludes .claude/agents/ and .claude/commands/"
      : `refused (${after.failed})`,
    !after.ok,
  );
}

/* G-CLO-5 — R03: a back-dated Evidence record needs no closure block. */
{
  const { root, briefId } = deliveringProject("backdate", {});
  const evidence = createEvidence(root, {
    briefId,
    title: "Back-dated evidence",
    body: "Probe evidence body.",
    created: "2026-09-19",
  });
  const project = loadProject({ root });
  const node = project.graph.index.node(evidence.id)!;
  const hasClosure = node.frontmatter["closure"] !== undefined;
  observe(
    "G-CLO-5a back-dated Evidence created through the runtime",
    "a runtime-created Evidence carries a closure block whatever its created date",
    hasClosure ? "closure block present" : "no closure block",
    hasClosure,
  );
  observe(
    "G-CLO-5b the created date is accepted unbounded",
    "a created date the runtime did not observe is refused or normalised",
    `created recorded as ${node.created}, today is ${new Date().toISOString().slice(0, 10)}`,
    node.created === new Date().toISOString().slice(0, 10),
  );
}

/* G-CLO-6 — R11: correcting Evidence that carries no closure block. */
{
  const { root, briefId } = deliveringProject("correct-old", {});
  // Close with a back-dated record so it predates closure provenance, then
  // strip its block: exactly the shape of every Evidence in this repository's
  // own graph, which was written before the block existed.
  const first = createEvidence(root, {
    briefId,
    title: "Original evidence",
    body: "Probe evidence body.",
    created: "2026-09-19",
  });
  const path = join(root, "specs", "nodes", `${first.id}.md`);
  const stripped = `---\nid: ${first.id}\ntype: evidence\ntitle: Original evidence\ncreated: '2026-09-19'\n---\n\nProbe evidence body.\n`;
  writeFileSync(path, stripped, "utf8");
  loadProject({ root }); // the stripped record is still a valid project
  let outcome: string;
  try {
    const corrected = createEvidence(root, {
      briefId,
      title: "Corrected evidence",
      body: "Corrected body.",
    });
    outcome = `correction succeeded as ${corrected.id}`;
  } catch (error) {
    outcome = `correction refused: ${(error as Error).message}`;
  }
  observe(
    "G-CLO-6 Evidence correction over a record with no closure block",
    "the §45 Evidence correction permittedOperations advertises actually commits",
    outcome,
    outcome.startsWith("correction succeeded"),
  );
}

/* G-CLO-7 — positive control: correcting Evidence that does carry a block. */
{
  const { root, briefId } = deliveringProject("correct-new", {});
  createEvidence(root, { briefId, title: "Original evidence", body: "Probe evidence body." });
  let outcome: string;
  try {
    const corrected = createEvidence(root, {
      briefId,
      title: "Corrected evidence",
      body: "Corrected body.",
    });
    outcome = `correction succeeded as ${corrected.id}`;
  } catch (error) {
    outcome = `correction refused: ${(error as Error).message}`;
  }
  observe(
    "G-CLO-7 Evidence correction over a record that carries a block (positive control)",
    "the correction commits and supersedes the previous record",
    outcome,
    outcome.startsWith("correction succeeded"),
  );
}

summary();
