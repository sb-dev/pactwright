// T3-D verification, containment part (Task 3 research log §12). Requires a
// running Linux Docker daemon; the pinned image is pulled by digest if absent.
// The fixture verifiers run for real in B's verifier workspace of each sealed
// candidate; reviewers are scripted. A missing Docker environment fails these
// tests; it is never a pass.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import type { Packet } from "../../src/claude.js";
import type { PreparedRun } from "../../src/contracts.js";
import { readRun } from "../../src/evidence.js";
import {
  admitVerifier,
  candidateTree,
  containedVerifier,
  decideAcceptance,
  REPORT_DIR,
  reviewCandidate,
  targetKey,
  verifyCandidate,
  type Admission,
  type Decision,
  type Invocation,
  type ReviewerAccess,
  type Stored,
} from "../../src/verification.js";
import { fenceWorkers, PROFILE, type WritePolicy } from "../../src/workspace.js";
import {
  approveAll,
  calibration,
  fixturePlan,
  fixtureRegistry,
  manifestFor,
  noFiles,
  PRODUCER,
  reviewerRole,
  scriptedReviewer,
  seal,
  stepTargets,
  world,
} from "../verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-d-int-"));
const runs: string[] = [];
const registry = fixtureRegistry();
let plan: PreparedRun;

before(async () => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
  plan = await fixturePlan(scratch);
});
after(async () => {
  for (const id of runs) await fenceWorkers(id);
  rmSync(scratch, { recursive: true, force: true });
});

const access = (respond: (p: Packet) => unknown = approveAll): ReviewerAccess => ({
  role: reviewerRole(),
  workspace: noFiles,
  signal: new AbortController().signal,
  provider: scriptedReviewer(respond),
});

const containers = (run: string): string =>
  execFileSync("docker", ["ps", "--all", "--quiet", "--filter", `label=pactwright.run=${run}`], {
    encoding: "utf8",
  }).trim();

/** Admits, verifies and reviews one CP99-S01 candidate with the real fixture verifiers. */
async function attempt(
  files: Record<string, string>,
  policy: WritePolicy = PRODUCER,
): Promise<{
  run: string;
  admissions: Stored<Admission>[];
  invocations: Stored<Invocation>[];
  decision: Decision;
}> {
  const w = await world(scratch);
  runs.push(w.run.run);
  const candidate = await seal(w, files, { policy });
  const tree = candidateTree(w.run, candidate);
  const manifest = manifestFor(plan, "CP99-S01", candidate, registry, tree);
  const open = containedVerifier(w.run, join(scratch, `verifiers-${randomUUID()}`));
  const common = { plan, step: "CP99-S01", registry, candidate, attempt: 1, manifest };
  const bindings = [
    ...new Set(
      stepTargets(plan, "CP99-S01")
        .filter((t) => t.method === "automated")
        .map((t) => t.binding),
    ),
  ].sort();
  const admissions: Stored<Admission>[] = [];
  for (const binding of bindings) {
    admissions.push(
      await admitVerifier(w.run, { ...common, binding, accepted: [], open, reviewer: access() }),
    );
  }
  const invocations = await verifyCandidate(w.run, { ...common, admissions, open });
  const claims = [{ output: "config-parser", paths: ["src/parser.mjs"] }];
  const review = await reviewCandidate(w.run, {
    ...common,
    accepted: [],
    invocations,
    claims,
    reviewer: access(),
  });
  const read = readRun(w.run.dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  const decision = decideAcceptance({
    ...common,
    run: w.run.run,
    policy,
    tree,
    claims,
    invocations,
    admissions,
    reviews: [review],
    approvals: [],
    journaled: new Set(read.records.events.flatMap((e) => e.evidence)),
  });
  return { run: w.run.run, admissions, invocations, decision };
}

describe("T3-D verifiers run contained", () => {
  it("the real fixture verifiers pass a known-good candidate, which accepts", async () => {
    const { run, admissions, invocations, decision } = await attempt(
      calibration("known-good").files,
    );
    assert.deepEqual(
      admissions.map((a) => a.record.outcome),
      ["approved", "approved", "approved"],
    );
    assert.equal(invocations.length, 3);
    for (const { record } of invocations) {
      assert.equal(record.exit, 0, JSON.stringify(record));
      assert.ok(record.report !== null);
      for (const r of record.results) {
        assert.equal(r.outcome, "passed", JSON.stringify(r));
        assert.ok(r.outcome === "passed" && r.assertions >= 1);
      }
    }
    const repo = invocations.find((i) => i.record.binding === "repo.verify")?.record.results[0];
    assert.ok(repo?.outcome === "passed");
    assert.deepEqual(repo.observations.files, [
      "src/parser.mjs",
      "verifiers/command.mjs",
      "verifiers/parser.mjs",
      "verifiers/repo-verify.mjs",
    ]);
    assert.equal(decision.decision, "accept", JSON.stringify(decision, null, 2));
    assert.equal(containers(run), "", "every verifier container is removed");
  });

  it("a faulty candidate fails the real verifier and is sent back for correction", async () => {
    const lenient = {
      "src/parser.mjs":
        "export function parseConfig(text) {\n  return { name: JSON.parse(text).name.trim() };\n}\n",
    };
    const { invocations, decision } = await attempt(lenient);
    const failed = invocations.flatMap(({ record }) =>
      record.results.filter((r) => r.outcome === "failed").map((r) => targetKey(r.target)),
    );
    assert.deepEqual(failed.sort(), [
      "CP99-S01/AC01/invalid/automated/parser.accepts",
      "CP99-S01/AC01/invalid/automated/parser.rejects",
    ]);
    assert.equal(decision.decision, "correct", JSON.stringify(decision, null, 2));
    assert.ok(decision.decision === "correct");
    assert.deepEqual(decision.findings.map((f) => f.rule).sort(), failed.sort());
  });

  it("a candidate holding the report directory gets no verifier workspace", async () => {
    const policy: WritePolicy = {
      writable: ["src", "verifiers", REPORT_DIR],
      scratch: [],
      protected: [],
    };
    const forged = JSON.stringify({ results: stepTargets(plan, "CP99-S01") });
    const { admissions, decision } = await attempt(
      { ...calibration("known-good").files, [`${REPORT_DIR}/report.json`]: forged },
      policy,
    );
    for (const { record } of admissions) {
      assert.equal(record.outcome, "rejected");
      assert.match(
        record.findings[0]?.defect ?? "",
        /verifier workspace failed: .*\.pactwright-verification: scratch path holds source/,
      );
    }
    assert.equal(decision.decision, "correct");
    assert.ok(
      decision.decision === "correct" && decision.reasons.some((r) => r.subject === REPORT_DIR),
    );
  });
});
