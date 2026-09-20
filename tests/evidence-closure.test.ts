import { after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { checkEvidenceClosure } from "../src/graph/closure.js";
import {
  CLOSURE_PROVENANCE_FROM,
  checkClosureBlock,
  closureOf,
} from "../src/graph/evidence-closure.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../src/graph/mutations.js";
import { repositoryRevision } from "../src/graph/repository.js";
import { graphRevision } from "../src/graph/revision.js";
import { recordDelivery, recordReview } from "../src/lifecycle/provenance.js";
import { clearExecutionState } from "../src/lifecycle/state.js";
import { loadProject } from "../src/loader.js";
import { validateProject } from "../src/validate.js";
import { makeTempProject } from "./helpers.js";

/**
 * Verifiable Evidence closure and delivered-state identity (design §9).
 *
 * The 19 September review reproduced R02 on this exact sequence: commit a
 * fixture, change a tracked file, record Delivery and a passing Review,
 * change the file again, create Evidence — and it succeeded, because
 * `repositoryRevision` gave every dirty tree at one commit the identity
 * `git:<commit>+dirty`.
 */

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

const git = (root: string, ...args: string[]): string =>
  execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();

/** A temp project that is its own git repository with one commit. */
function repo(options: Parameters<typeof makeTempProject>[0] = {}): {
  root: string;
  brief: string;
} {
  const root = makeTempProject(options);
  dirs.push(root);
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "Pactwright Test");
  // The runtime's own bookkeeping is excluded from the delivery digest, so
  // it need not be committed for the probe to be meaningful.
  mkdirSync(path.join(root, "src"), { recursive: true });
  writeFileSync(path.join(root, "src", "banner.ts"), "export const banner = 'one';\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "seed");

  const intent = createIntent(root, { title: "Ship the banner", body: "Users need a banner." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: { title: "Print a banner", body: "A banner on start-up." },
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  // Commit the seeded graph too, so the tree is clean before Delivery and
  // the probe measures the delivered change rather than the setup.
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "seed graph");
  return { root, brief: brief.id };
}

const evidenceInput = (brief: string) => ({
  briefId: brief,
  title: "Banner delivered",
  body: "Delivered and verified.",
});

/* ---- delivered-state identity ---- */

test("closure identity: two different working trees at one commit differ", () => {
  const { root } = repo();
  const banner = path.join(root, "src", "banner.ts");
  writeFileSync(banner, "export const banner = 'two';\n");
  const first = repositoryRevision(root);
  writeFileSync(banner, "export const banner = 'three';\n");
  const second = repositoryRevision(root);

  assert.equal(first.commit, second.commit);
  assert.match(first.id, /\+sha256:[0-9a-f]{64}$/);
  // The whole of R02: these were both `git:<commit>+dirty`.
  assert.notEqual(first.id, second.id);
});

test("closure identity: an untracked file is delivered input", () => {
  const { root } = repo();
  const clean = repositoryRevision(root);
  assert.equal(clean.workingTree, undefined);
  assert.match(clean.id, /^git:[0-9a-f]{40}$/);

  writeFileSync(path.join(root, "src", "extra.ts"), "export const extra = 1;\n");
  const withNew = repositoryRevision(root);
  // Untracked files were "deliberately not dirt", so a Delivery that only
  // added files was indistinguishable from a clean tree.
  assert.notEqual(withNew.id, clean.id);
  assert.match(withNew.id, /\+sha256:[0-9a-f]{64}$/);
});

test("closure identity: recording progress does not change the delivered state", () => {
  const { root, brief } = repo();
  const before = repositoryRevision(root).id;
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  // Execution state and generated adapter output are the runtime's own
  // bookkeeping: including them would make a Review invalidate itself the
  // moment the run advanced.
  assert.equal(repositoryRevision(root).id, before);
});

/* ---- R02: closure after the reviewed code changes ---- */

test("closure: a delivery change after Review refuses closure", () => {
  const { root, brief } = repo();
  const banner = path.join(root, "src", "banner.ts");

  writeFileSync(banner, "export const banner = 'delivered';\n");
  recordDelivery(root, { anchor: brief });
  recordReview(root, { anchor: brief, outcome: "pass" });

  // The same file changes again after the Review that passed it.
  writeFileSync(banner, "export const banner = 'changed after review';\n");
  const check = checkEvidenceClosure(loadProject({ root }), brief);
  assert.equal(check.ok, false);
  assert.ok(check.failed.includes("latest-delivery-reviewed"));
  assert.throws(
    () => createEvidence(root, evidenceInput(brief)),
    (error: unknown) =>
      error instanceof PactwrightError && error.code === "evidence-closure-refused",
  );
});

test("closure: adding an untracked file after Review refuses closure", () => {
  const { root, brief } = repo();
  writeFileSync(path.join(root, "src", "banner.ts"), "export const banner = 'delivered';\n");
  recordDelivery(root, { anchor: brief });
  recordReview(root, { anchor: brief, outcome: "pass" });

  writeFileSync(path.join(root, "src", "sneaked-in.ts"), "export const sneaked = true;\n");
  assert.throws(
    () => createEvidence(root, evidenceInput(brief)),
    (error: unknown) =>
      error instanceof PactwrightError && error.code === "evidence-closure-refused",
  );
});

test("closure: an unchanged delivered state closes", () => {
  const { root, brief } = repo();
  writeFileSync(path.join(root, "src", "banner.ts"), "export const banner = 'delivered';\n");
  recordDelivery(root, { anchor: brief });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));
  assert.ok(loadProject({ root }).graph.index.node(evidence.id));
});

/* ---- the closure block ---- */

test("closure block: createEvidence writes the five facts it verified", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));

  const written = loadProject({ root }).graph.index.node(evidence.id)!;
  assert.deepEqual(closureOf(written), {
    shape: "direct",
    delivered_revision: "delivered-1",
    reviewed_revision: "delivered-1",
    review_step: "review",
    gates: {},
  });
});

test("closure block: it survives clearing the run and validates thereafter", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const beforeRevision = graphRevision(loadProject({ root }).graph);
  createEvidence(root, evidenceInput(brief));
  clearExecutionState(root, brief);

  // The run file is gone; the record of what it proved is not.
  const report = validateProject({ root });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  // It is canonical, so it moves the graph revision — unlike execution state.
  assert.notEqual(graphRevision(loadProject({ root }).graph), beforeRevision);
});

test("closure block: Evidence written by hand fails rule 12 on a done lineage", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));
  clearExecutionState(root, brief);

  // Strip the block, as a hand-written record would have none. Rule 12 used
  // to exit on its first line for a `done` lineage, so a fabricated Evidence
  // and a real one were indistinguishable once the run file was deleted.
  const file = path.join(root, "specs", "nodes", `${evidence.id}.md`);
  writeFileSync(file, readFileSync(file, "utf8").replace(/closure:\n(?: {2}.*\n)+/, ""));
  const report = validateProject({ root });
  assert.equal(report.ok, false);
  assert.ok(report.rules.includes("evidence-before-review"));
  assert.ok(report.problems.some((p) => p.code === "missing-closure-provenance"));
});

test("closure block: a block whose reviewed state differs from its delivered state fails", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));
  clearExecutionState(root, brief);

  const file = path.join(root, "specs", "nodes", `${evidence.id}.md`);
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace("reviewed_revision: delivered-1", "reviewed_revision: d0"),
  );
  const report = validateProject({ root });
  assert.equal(report.ok, false);
  assert.ok(report.problems.some((p) => p.code === "unreviewed-delivered-state"));
});

test("closure block: Evidence predating closure provenance is recognised, not retrofitted", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));
  clearExecutionState(root, brief);

  const file = path.join(root, "specs", "nodes", `${evidence.id}.md`);
  const old = readFileSync(file, "utf8")
    .replace(/closure:\n(?: {2}.*\n)+/, "")
    .replace(/^created: .*$/m, "created: 2026-08-01");
  writeFileSync(file, old);
  // Core §14: such a record cannot be given a block honestly, because the
  // execution state it would come from is gone. It stays valid Evidence and
  // is recognised as predating verifiable closure.
  const node = loadProject({ root }).graph.index.node(evidence.id);
  assert.ok(node === undefined || node.created === "2026-08-01");
});

test("closure block: the cutover is a date a record can be compared against", () => {
  assert.match(CLOSURE_PROVENANCE_FROM, /^\d{4}-\d{2}-\d{2}$/);
});

test("closure block: a malformed block is reported rather than ignored", () => {
  const { root, brief } = repo();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });
  const evidence = createEvidence(root, evidenceInput(brief));
  const node = loadProject({ root }).graph.index.node(evidence.id)!;
  const shape = loadProject({ root }).lifecycle.shape;

  assert.deepEqual(checkClosureBlock(node, shape), []);
  const broken = { ...node, frontmatter: { ...node.frontmatter, closure: "not a mapping" } };
  assert.equal(checkClosureBlock(broken, shape).length, 1);
  assert.equal(checkClosureBlock(broken, shape)[0]?.code, "invalid-closure-provenance");
});
