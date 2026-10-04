// T3.5 H3 hosted proof (production readiness log §3 H3): assertions on the
// final saved state of the hosted fixture run. Set PACTWRIGHT_H3_PROOF_RUN to
// the run name. With GITHUB_REPOSITORY and GITHUB_TOKEN, the latest state is
// found and downloaded from the run's Actions artifacts as a workflow job
// finds it; else PACTWRIGHT_H3_PROOF_DIR names a directory holding a
// downloaded artifact's `state.tar.gz` and `state.json`. The state is validated as a fresh runner restores it; every
// fact below is read from its journal and evidence, never from job logs. A
// missing state fails; it is never a pass. This is evidence for review, not
// acceptance.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import type { AgentOutcome } from "../../src/claude.js";
import { readEvidence, readRun, type JournalEvent } from "../../src/evidence.js";
import type { Assessment, FeedbackSnapshot, RoundRecord } from "../../src/pull-requests.js";
import { githubApi, githubStore } from "../../src/github.js";
import { latestState, unpackState, type StateFiles, type StateManifest } from "../../src/state.js";
import type { Approval, Decision } from "../../src/verification.js";

const from = process.env.PACTWRIGHT_H3_PROOF_DIR ?? "";
const name = process.env.PACTWRIGHT_H3_PROOF_RUN ?? "";
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-proof-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

type Stored<T> = { event: JournalEvent; record: T };

/** The run's latest saved state from its Actions artifacts, checked as a job checks it. */
async function download(): Promise<StateFiles> {
  const store = githubStore(githubApi(process.env), {
    currentRun: 0,
    ref: process.env.PACTWRIGHT_H3_PROOF_REF ?? process.env.GITHUB_REF_NAME ?? "",
  });
  const latest = await latestState(store, name);
  assert.ok(
    latest.kind === "found",
    latest.kind === "refused" ? latest.diagnostics.join("\n") : `${name}: no state`,
  );
  console.log(`proof state: ${latest.saved.url} (sequence ${latest.saved.sequence})`);
  return store.download(latest.saved, join(scratch, "artifact"));
}

async function restore(): Promise<{ dir: string; events: JournalEvent[] }> {
  assert.ok(name !== "", "PACTWRIGHT_H3_PROOF_RUN is required");
  const files =
    from === ""
      ? await download()
      : { archive: join(from, "state.tar.gz"), manifest: join(from, "state.json") };
  const manifest = JSON.parse(readFileSync(files.manifest, "utf8")) as StateManifest;
  const unpacked = await unpackState(files, join(scratch, "run"), {
    name,
    sequence: manifest.sequence,
  });
  assert.ok(unpacked.ok, unpacked.ok ? "" : unpacked.diagnostics.join("\n"));
  const read = readRun(unpacked.dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return { dir: unpacked.dir, events: read.records.events };
}

const state = restore();
// Each test awaits the state and fails on its error; nothing is left unhandled.
state.catch(() => undefined);

async function records<T>(action: string): Promise<Stored<T>[]> {
  const { dir, events } = await state;
  return events
    .filter((e) => e.action === action)
    .map((event) => {
      const ref = typeof event.data.record === "string" ? event.data.record : event.evidence[0];
      assert.ok(ref, `${action} ${event.seq} names no record`);
      return { event, record: JSON.parse(readEvidence(dir, ref).toString("utf8")) as T };
    });
}

type Github = { repository: string; run_id: number; run_attempt: number; job: string };
const jobOf = (g: Github): string => `${g.run_id}/${g.run_attempt}/${g.job}`;

/** The hosted job that owned the run when event `seq` was journaled. */
async function ownerAt(seq: number): Promise<Github> {
  const { events } = await state;
  const owner = events.filter((e) => e.action === "owner" && e.seq < seq).at(-1);
  const github = owner?.data.github as Github | null | undefined;
  assert.ok(github, `event ${seq} has no hosted owner`);
  return github;
}

describe("H3 hosted proof: one saved run across hosted jobs", () => {
  it("is one run, owned only by hosted jobs of several workflow runs", async () => {
    const { events } = await state;
    assert.equal(events.filter((e) => e.action === "run-start").length, 1);
    const owners = events
      .filter((e) => e.action === "owner")
      .map((e) => e.data.github as Github | null);
    assert.ok(
      owners.every((o) => o !== null),
      "every owner epoch names its hosted job",
    );
    const jobs = new Set(owners.map((o) => jobOf(o as Github)));
    const runs = new Set(owners.map((o) => (o as Github).run_id));
    assert.ok(jobs.size >= 6, `${jobs.size} hosted jobs`);
    assert.ok(runs.size >= 4, `${runs.size} workflow runs`);
  });

  it("yielded within the selection and continued in another workflow run (H3-03, H3-12)", async () => {
    const { events } = await state;
    const yields = events.filter(
      (e) =>
        e.action === "pause" &&
        Array.isArray(e.data.reasons) &&
        (e.data.reasons as { code: string }[]).some((r) => r.code === "yield"),
    );
    assert.ok(yields.length >= 1, "a planned yield");
    for (const y of yields) {
      const next = events.find((e) => e.action === "owner" && e.seq > y.seq);
      assert.ok(next, "the yield was continued");
      assert.notEqual((next.data.github as Github).run_id, (await ownerAt(y.seq)).run_id);
    }
  });

  it("recorded a denial and an approval by the GitHub actor, and an amendment with its revision (H3-05, H3-09)", async () => {
    const approvals = (await records<Approval>("approval")).map((a) => a.record);
    assert.ok(approvals.some((a) => a.decision === "denied"));
    assert.ok(approvals.some((a) => a.decision === "approved"));
    assert.ok(approvals.every((a) => a.actor === "sb-dev"));
    const amendments = await records<{ actor: string; reason: string; revision?: string }>(
      "amendment",
    );
    assert.ok(
      amendments.some(
        (a) => /^[0-9a-f]{40}$/.test(a.record.revision ?? "") && a.record.reason !== "",
      ),
    );
  });

  it("recovered effects interrupted after their intent by read-back, never repeating one (H3-06, H3-15)", async () => {
    const { events } = await state;
    const intents = await records<{ key: string; request: { action: string } }>("effect-intent");
    const receipts = await records<{ key: string; reconciled: boolean }>("effect-receipt");
    const keys = receipts.map((r) => r.record.key);
    assert.equal(new Set(keys).size, keys.length, "one receipt per effect");
    for (const i of intents)
      assert.ok(keys.includes(i.record.key), `${i.record.key} has a receipt`);
    const interrupted = intents.filter((i) => {
      const receipt = receipts.find((r) => r.record.key === i.record.key);
      return events.some(
        (e) => e.action === "owner" && e.seq > i.event.seq && e.seq < (receipt?.event.seq ?? 0),
      );
    });
    assert.ok(interrupted.length >= 2, "runner loss after an intent, before its receipt");
    assert.ok(
      receipts.some((r) => r.record.reconciled),
      "a receipt read back after runner loss",
    );
    const actions = new Set(intents.map((i) => i.record.request.action));
    for (const action of ["fixture-receipt", "push-branch", "open-pr", "pr-reply"]) {
      assert.ok(actions.has(action), action);
    }
  });

  it("published the selection and ran two correction rounds in separate hosted jobs (H3-13, H3-14)", async () => {
    const feedback = await records<FeedbackSnapshot>("pr-feedback");
    const rounds = await records<RoundRecord>("pr-round");
    assert.deepEqual(
      rounds.map((r) => r.record.round),
      [1, 2],
    );
    assert.deepEqual(
      feedback.map((f) => f.record.round),
      [1, 2],
    );
    assert.deepEqual(
      feedback.map((f) => f.record.trigger.kind),
      ["review", "manual"],
    );
    assert.ok(
      feedback[1]?.record.items.some((i) => i.kind === "comment"),
      "manual rounds read the conversation",
    );
    const jobs = await Promise.all(rounds.map(async (r) => jobOf(await ownerAt(r.event.seq))));
    assert.notEqual(jobs[0], jobs[1]);
    for (const r of rounds)
      assert.ok(r.record.replies.length > 0, `round ${r.record.round} replied`);
    const assessments = (await records<Assessment>("pr-assessment")).map((a) => a.record);
    const kinds = assessments.flatMap((a) => a.dispositions.map((d) => d.disposition));
    assert.ok(kinds.includes("actionable"));
    assert.ok(kinds.includes("already-addressed") || kinds.includes("declined"));
  });

  it("renewed only the corrected step's acceptance, after the assessment, and kept counting spend (H3-13)", async () => {
    const assessments = await records<Assessment>("pr-assessment");
    const corrected = assessments.find((a) => a.record.correction !== null);
    assert.ok(corrected, "a round corrected the candidate");
    const step = corrected.record.correction?.step ?? "";
    const acceptances = await records<Decision>("acceptance");
    assert.ok(
      acceptances.some((a) => a.record.step === step && a.event.seq > corrected.event.seq),
      `${step} was accepted again after the assessment`,
    );
    const earlier = acceptances.filter((a) => a.record.step !== step && a.record.step < step);
    assert.ok(
      earlier.every((a) => a.event.seq < corrected.event.seq),
      "earlier steps were not re-accepted",
    );
    const producers = await records<AgentOutcome>("agent-invocation");
    const spent = producers.reduce(
      (n, p) =>
        n +
        (typeof p.record.observation.usage.costUsd === "number"
          ? p.record.observation.usage.costUsd
          : 0),
      0,
    );
    assert.ok(spent > 0, "provider spend was recorded");
    assert.ok(
      producers.some((p) => p.event.seq > corrected.event.seq),
      "the correction ran a provider session after the round began",
    );
  });
});
