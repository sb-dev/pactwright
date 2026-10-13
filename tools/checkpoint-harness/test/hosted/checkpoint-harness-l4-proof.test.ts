// T3.6 L4 hosted proof (evidence-backed learning log §3 T3.6-L4, L4-01 and
// L4-02): the assertions of `../l4-proof.ts` on the final saved state of the
// hosted learning fixture run. Set PACTWRIGHT_L4_PROOF_RUN to the run name.
// With GITHUB_REPOSITORY and GITHUB_TOKEN, the latest state is found and
// downloaded from the run's Actions artifacts as a workflow job finds it;
// else PACTWRIGHT_L4_PROOF_DIR names a directory holding a downloaded
// artifact's `state.tar.gz` and `state.json`. The state is validated as a
// fresh runner restores it; every fact is read from its journal and
// evidence, never from job logs. A missing state fails; it is never a pass.
// This is evidence for review, not acceptance.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { readEvidence, readRun } from "../../src/evidence.js";
import { githubApi, githubStore } from "../../src/github.js";
import { latestState, unpackState, type StateFiles, type StateManifest } from "../../src/state.js";
import {
  EFFECT_FAULT,
  FAULTS,
  authority,
  boundaries,
  challenge,
  exploration,
  guidance,
  injected,
  knowledgeReuse,
  manifests,
  noReplay,
  oneRun,
  reservations,
  rounds,
  type ProofState,
} from "../l4-proof.js";

const from = process.env.PACTWRIGHT_L4_PROOF_DIR ?? "";
const name = process.env.PACTWRIGHT_L4_PROOF_RUN ?? "";
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l4-proof-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

/** The hosted fixture's steps: Step 2 is corrected in the rounds, Step 1 never changes. */
const STEPS = { corrected: "CP94-S02", unchanged: "CP94-S01" };
/** Every dispatch of the operator sequence runs its own workflow run. */
const MINIMUM = { jobs: 12, runs: 12 };

/** The run's latest saved state from its Actions artifacts, checked as a job checks it. */
async function download(): Promise<StateFiles> {
  const store = githubStore(githubApi(process.env), {
    currentRun: 0,
    ref: process.env.PACTWRIGHT_L4_PROOF_REF ?? process.env.GITHUB_REF_NAME ?? "",
  });
  const latest = await latestState(store, name);
  assert.ok(
    latest.kind === "found",
    latest.kind === "refused" ? latest.diagnostics.join("\n") : `${name}: no state`,
  );
  console.log(`proof state: ${latest.saved.url} (sequence ${latest.saved.sequence})`);
  return store.download(latest.saved, join(scratch, "artifact"));
}

async function restore(): Promise<ProofState> {
  assert.ok(name !== "", "PACTWRIGHT_L4_PROOF_RUN is required");
  const files =
    from === ""
      ? await download()
      : { archive: join(from, "state.tar.gz"), manifest: join(from, "state.json") };
  const manifest = JSON.parse(readFileSync(files.manifest, "utf8")) as StateManifest;
  console.log(
    `proof state ${name} sequence ${manifest.sequence}: journal ${manifest.journal.seq} ${manifest.journal.head ?? ""}, controller ${manifest.controller.commit}`,
  );
  const unpacked = await unpackState(files, join(scratch, "run"), {
    name,
    sequence: manifest.sequence,
  });
  assert.ok(unpacked.ok, unpacked.ok ? "" : unpacked.diagnostics.join("\n"));
  const read = readRun(unpacked.dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  const dir = unpacked.dir;
  return {
    dir,
    events: read.records.events,
    read: (ref) => JSON.parse(readEvidence(dir, ref).toString("utf8")) as unknown,
  };
}

const state = restore();
// Each test awaits the state and fails on its error; nothing is left unhandled.
state.catch(() => undefined);

describe("T3.6 L4 hosted proof: one saved learning run across hosted jobs", () => {
  it("is one run, owned only by hosted jobs of several workflow runs", async () => {
    oneRun(await state, MINIMUM);
  });
  it("lost a runner right after each learning boundary and after a reply (L4-01)", async () => {
    boundaries(await state, [...FAULTS, EFFECT_FAULT]);
  });
  it("never repeated completed work, and reran each lost learning session once under its key (L4-01)", async () => {
    noReplay(await state);
  });
  it("kept each lost session's allowance reserved and counted (L4-01)", async () => {
    reservations(await state);
  });
  it("restored frozen contexts that reproduce their consumed inputs (L4-01)", async () => {
    manifests(await state);
  });
  it("reused supported knowledge, then held it historical once the candidate changed (L4-01, L4-02)", async () => {
    knowledgeReuse(await state);
  });
  it("activated a reminder from two attempts' reviewed failures and used it before and after publication (L4-01, L4-02)", async () => {
    guidance(await state);
  });
  it("explored once, with both diagnoses and a selection the next attempt followed (L4-01)", async () => {
    exploration(await state);
  });
  it("counted the cross-attempt challenge in the explored acceptance (L4-01)", async () => {
    challenge(await state);
  });
  it("published once and ran two correction rounds in this run (L4-02)", async () => {
    rounds(await state, STEPS);
  });
  it("admitted nothing a proposer reviewed itself, and accepted only verified, reviewed evaluations (L4-01)", async () => {
    authority(await state);
  });
  it("labelled exactly the template's injected attempts (L4 fixture)", async () => {
    injected(await state);
  });
});
