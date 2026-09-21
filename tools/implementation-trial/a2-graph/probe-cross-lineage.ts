/**
 * A2-G probe: the mutation gate validates the *whole* proposed graph, and
 * the §53 closure check reads the repository as it stands now. Together
 * these make one lineage's pending closure a gate on every other lineage's
 * writes.
 *
 * Found while building a cost fixture, not looked for.
 */
import { PactwrightError } from "../../../src/errors.js";
import { checkEvidenceClosure } from "../../../src/graph/closure.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../../../src/graph/mutations.js";
import {
  beginExecution,
  clearExecutionState,
  writeExecutionState,
} from "../../../src/lifecycle/state.js";
import { recordDelivery, recordReview } from "../../../src/lifecycle/provenance.js";
import { loadProject } from "../../../src/loader.js";
import { validateProject } from "../../../src/validate.js";
import { git, makeProject, observe, summary } from "./fixture.js";

const root = makeProject("cross-lineage");

/* Lineage A: delivered, reviewed, standing at its Evidence step. */
const a = createIntent(root, { title: "Lineage A intent", body: "Body." });
const decisionA = recordDecision(root, {
  intentId: a.id,
  outcome: "proceed",
  decidedBy: "human:probe",
  body: "Body.",
  contract: { title: "Lineage A contract", body: "Body." },
});
const briefA = createBrief(root, {
  contractId: decisionA.contract!.id,
  title: "Lineage A brief",
  body: "Body.",
});
writeExecutionState(root, beginExecution(briefA.id, "direct", "delivery"));
recordDelivery(root, { anchor: briefA.id });
recordReview(root, { anchor: briefA.id, outcome: "pass" });

const beforeOther = checkEvidenceClosure(loadProject({ root }), briefA.id);
observe(
  "G-XLIN-0 lineage A is closable before any other work (positive control)",
  "the §53 preconditions hold immediately after its Review",
  beforeOther.ok ? "closable" : `refused (${beforeOther.failed.join(", ")})`,
  beforeOther.ok,
);

/* Unrelated work on a second lineage. */
const b = createIntent(root, { title: "Lineage B intent", body: "Body." });
let second: string;
try {
  recordDecision(root, {
    intentId: b.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "Body.",
    contract: { title: "Lineage B contract", body: "Body." },
  });
  second = "committed";
} catch (error) {
  const e = error as PactwrightError;
  second = `refused: ${e.code} / ${e.problems.map((p) => p.code).join(", ")}`;
}
observe(
  "G-XLIN-1 an unrelated lineage's Decision while another lineage awaits closure",
  "recording a Decision on lineage B is unaffected by lineage A's pending closure",
  second,
  second === "committed",
);

/* Can lineage A still be closed? */
let closeA: string;
try {
  const evidence = createEvidence(root, {
    briefId: briefA.id,
    title: "Lineage A evidence",
    body: "Body.",
  });
  closeA = `closed as ${evidence.id}`;
} catch (error) {
  const e = error as PactwrightError;
  closeA = `refused: ${e.code} / ${e.problems.map((p) => p.code).join(", ")}`;
}
observe(
  "G-XLIN-2 closing lineage A after unrelated graph writes",
  "lineage A still closes: the unrelated writes are not a change to what was delivered",
  closeA,
  closeA.startsWith("closed"),
);

/* Does committing the unrelated work restore either path? */
git(root, ["add", "-A"]);
git(root, ["commit", "-q", "-m", "unrelated work"]);
let afterCommit: string;
try {
  const evidence = createEvidence(root, {
    briefId: briefA.id,
    title: "Lineage A evidence",
    body: "Body.",
  });
  afterCommit = `closed as ${evidence.id}`;
} catch (error) {
  const e = error as PactwrightError;
  afterCommit = `refused: ${e.code} / ${e.problems.map((p) => p.code).join(", ")}`;
}
observe(
  "G-XLIN-3 closing lineage A after the unrelated work is committed",
  "committing unrelated work does not put the repository beyond lineage A's closure",
  afterCommit,
  afterCommit.startsWith("closed"),
);

const report = validateProject({ root });
observe(
  "G-XLIN-4 validate on the resulting repository",
  "the repository validates",
  report.ok
    ? "ok"
    : `rules ${report.rules.join(", ")}: ${report.problems.map((p) => p.code).join(", ")}`,
  report.ok,
);

/* G-XLIN-5 — recovery attempt 1: re-record the Review. */
{
  let recovered: string;
  try {
    recordReview(root, { anchor: briefA.id, outcome: "pass" });
    recovered = "re-recorded";
  } catch (error) {
    const e = error as PactwrightError;
    recovered = `refused: ${e.code}`;
  }
  observe(
    "G-XLIN-5 recovery by re-recording the Review",
    "the Review that the closure check says is stale can be re-taken",
    recovered,
    recovered === "re-recorded",
  );
}

/* G-XLIN-6 — recovery attempt 2: clear the run and take new work. */
{
  clearExecutionState(root, briefA.id);
  let unwedged: string;
  try {
    recordDecision(root, {
      intentId: b.id,
      outcome: "proceed",
      decidedBy: "human:probe",
      body: "Body.",
      contract: { title: "Lineage B contract", body: "Body." },
    });
    unwedged = "committed";
  } catch (error) {
    const e = error as PactwrightError;
    unwedged = `refused: ${e.code} / ${e.problems.map((p) => p.code).join(", ")}`;
  }
  observe(
    "G-XLIN-6 graph writes after discarding lineage A's run",
    "deleting the run file is not the only way back to a writable repository",
    `${unwedged} (only after deleting .pactwright/execution/${briefA.id}.yml by hand)`,
    false,
  );
}

summary();
