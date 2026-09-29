// T3-E acceptance (Task 3 research log §12): the runner's correction loop,
// budgets, operator approvals, external effects and recovery, run offline.
// Runs are real run directories with real sealed candidates; the fixture
// verifiers run as local processes; producer and reviewer sessions are
// scripted; effects go to a local receipt service. A crash is an exception
// thrown through the runner from an injected boundary or its progress
// callback; the crashed controller is then treated as dead. Real containment
// is B's and a real provider C's. Nothing here edits a journal by hand except
// the torn-write case, which appends an incomplete line as a crash would.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import type { Finding, Packet, ReviewVerdict } from "../src/claude.js";
import {
  readEvidence,
  readRun,
  recoverRun,
  releaseRun,
  type JournalEvent,
} from "../src/evidence.js";
import {
  amendRun,
  approveRequest,
  exitCode,
  resumeRun,
  startRun,
  stateTrace,
  type ApprovalRequest,
  type RunnerDeps,
  type RunResult,
} from "../src/runner.js";
import { recordApproval, type Approval } from "../src/verification.js";
import {
  COMMAND,
  crashAfter,
  Crash,
  fixtureRepo,
  GOOD_PARSER,
  goodProducer,
  KEY_VAR,
  LENIENT_PARSER,
  MODEL,
  OWNER,
  receiptService,
  runConfig,
  runnerRegistry,
  scriptedAgent,
  STEP_WORK,
  submit,
  testDeps,
  type Repo,
  type ScriptedAgent,
} from "./runner-fixtures.js";
import { approveAll, calibration, git } from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "../src/cli.ts");
const tsx = import.meta.resolve("tsx");
const skillsRoot = join(here, "../../../.claude/skills");

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-e-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

type World = { repo: Repo; scratch: string };
function world(): World {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  return { repo: fixtureRepo(dir), scratch: dir };
}

const reviewer = (respond: (packet: Packet) => ReviewVerdict = approveAll): ScriptedAgent =>
  scriptedAgent(({ packet }) => ({ output: respond(packet) }));

const eventsOf = (dir: string): JournalEvent[] => {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return read.records.events;
};

function recordsOf<T>(dir: string, action: string): T[] {
  return eventsOf(dir)
    .filter((e) => e.action === action)
    .map((e) => {
      const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
      assert.ok(ref !== undefined);
      return JSON.parse(readEvidence(dir, ref).toString("utf8")) as T;
    });
}

const actions = (dir: string, action: string): JournalEvent[] =>
  eventsOf(dir).filter((e) => e.action === action);

function dirOf(result: RunResult): string {
  assert.notEqual(result.outcome, "invalid", stringify(result, null, 2));
  assert.ok(result.outcome !== "invalid");
  return result.dir;
}

function assertAccepted(result: RunResult, steps: string[]): void {
  assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
  assert.ok(result.outcome === "selection-accepted");
  assert.deepEqual(result.accepted, steps);
  assert.equal(exitCode(result), 0);
}

function assertPaused(
  result: RunResult,
  expected: { code: string; subject?: RegExp; detail?: RegExp; step?: string },
): Extract<RunResult, { outcome: "paused" }> {
  assert.equal(result.outcome, "paused", stringify(result, null, 2));
  assert.ok(result.outcome === "paused");
  assert.equal(exitCode(result), 3);
  if (expected.step !== undefined) assert.equal(result.step, expected.step);
  assert.ok(
    result.reasons.some(
      (r) =>
        r.code === expected.code &&
        (expected.subject?.test(r.subject) ?? true) &&
        (expected.detail?.test(r.detail) ?? true),
    ),
    stringify(result.reasons, null, 2),
  );
  return result;
}

/** A producer whose attempt `n` does `work(n)`. */
const producerBy = (
  work: (attempt: number, packet: Packet) => Record<string, string>,
): ScriptedAgent =>
  scriptedAgent((session) =>
    submit(
      session,
      work(session.packet.attempt, session.packet),
      STEP_WORK[session.packet.step.id]?.outputs ?? {},
    ),
  );

/** The approval an operator would record for `asked`, without its request. */
const approvalFor = (asked: ApprovalRequest): Approval => ({
  run: asked.run,
  target: asked.target,
  authority: asked.authority,
  actor: OWNER,
  decision: "approved",
  candidate: asked.candidate,
  evaluation: asked.evaluation,
});

const approvalOf = (result: RunResult): string => {
  const paused = assertPaused(result, { code: "approval", detail: /awaiting approval by owner/ });
  const request = paused.reasons.find((r) => r.request !== null)?.request;
  assert.ok(request, "the pause names an approval request");
  return request;
};

describe("T3-E correction: failures lead to corrections and eventual acceptance", () => {
  it("a verification failure is corrected with its findings, then accepted", async () => {
    const w = world();
    const producer = producerBy((attempt) => ({
      "src/parser.mjs": attempt === 1 ? LENIENT_PARSER : GOOD_PARSER(),
    }));
    const result = await startRun(
      runConfig(w.repo, w.scratch),
      testDeps(w.repo, { producer, reviewer: reviewer() }),
    );
    assertAccepted(result, ["CP99-S01"]);
    const dir = dirOf(result);

    // The second packet carries the verifiers' specific failures.
    assert.deepEqual(
      producer.packets.map((p) => p.attempt),
      [1, 2],
    );
    assert.deepEqual(producer.packets[0]?.findings, []);
    const findings = producer.packets[1]?.findings ?? [];
    assert.ok(
      findings.some((f) =>
        /^CP99-S01\/AC01\/invalid\/automated\/parser\.(accepts|rejects)$/.test(f.rule),
      ),
      stringify(findings, null, 2),
    );
    // The failed attempt is preserved: its evaluation, decision and candidate.
    const decisions = recordsOf<{ decision: string; attempt: number; candidate: string }>(
      dir,
      "decision",
    ).concat(recordsOf(dir, "acceptance"));
    assert.deepEqual(
      decisions.map((d) => [d.attempt, d.decision]),
      [
        [1, "correct"],
        [2, "accept"],
      ],
    );
    const evaluations = recordsOf<{ attempt: number; candidate: { commit: string } }>(
      dir,
      "evaluation",
    );
    assert.equal(evaluations.length, 2);
    assert.notEqual(evaluations[0]?.candidate.commit, evaluations[1]?.candidate.commit);
    execFileSync("git", ["cat-file", "-e", `${evaluations[0]?.candidate.commit}^{commit}`], {
      env: { ...process.env, GIT_DIR: join(dir, "source.git") },
    });
    // The correction starts from the failed candidate, sealed against the step's base.
    const starts = recordsOf<{
      phase: string;
      attempt: number;
      production: { from: { commit: string } } | null;
    }>(dir, "start").filter((s) => s.phase === "produce");
    assert.equal(starts[1]?.production?.from.commit, evaluations[0]?.candidate.commit);
    assert.deepEqual(
      stateTrace(eventsOf(dir)).map((t) => `${t.state}${t.attempt ?? ""}`),
      [
        "prepared",
        "producing1",
        "verifying1",
        "reviewing1",
        "producing2",
        "verifying2",
        "reviewing2",
        "accepted2",
      ],
    );
  });

  it("a review rejection is corrected with the reviewer's finding, then accepted", async () => {
    const w = world();
    const bad = calibration("known-bad");
    const producer = producerBy((attempt) =>
      attempt === 1 ? bad.files : { "src/parser.mjs": GOOD_PARSER() },
    );
    const review = reviewer((packet) =>
      packet.review?.kind === "candidate" && packet.attempt === 1
        ? bad.verdict
        : approveAll(packet),
    );
    const result = await startRun(
      runConfig(w.repo, w.scratch),
      testDeps(w.repo, { producer, reviewer: review }),
    );
    assertAccepted(result, ["CP99-S01"]);
    // The blocking finding is passed on verbatim, with the coverage it left unmet.
    const blocking = bad.verdict.findings.find((f) => f.severity === "blocking");
    const nit = bad.verdict.findings.find((f) => f.severity === "optional");
    assert.ok(blocking && nit);
    const expected: Finding = {
      rule: blocking.rule,
      location: blocking.location,
      defect: blocking.defect,
      correction: blocking.correction,
    };
    const findings = producer.packets[1]?.findings ?? [];
    assert.deepEqual(findings[0], expected);
    assert.deepEqual(
      findings.slice(1).map((f) => [f.rule, f.location]),
      [["CP99-S01/R01", "common review"]],
    );
    // The optional nit is not fed back as work.
    assert.ok(!findings.some((f) => f.defect === nit.defect), stringify(findings, null, 2));
  });

  it("an accepted output feeds the next eligible step; the result reports only the selection", async () => {
    const w = world();
    const producer = goodProducer();
    const result = await startRun(
      runConfig(w.repo, w.scratch, { through: "CP99-S02" }),
      testDeps(w.repo, { producer, reviewer: reviewer() }),
    );
    assertAccepted(result, ["CP99-S01", "CP99-S02"]);
    assert.ok(!("checkpoint" in result));
    const dir = dirOf(result);
    const [first] = actions(dir, "acceptance");
    assert.ok(first);
    const s02 = producer.packets.find((p) => p.step.id === "CP99-S02");
    assert.deepEqual(
      s02?.inputs.accepted.map((a) => [a.step, a.output, a.evidence]),
      [["CP99-S01", "config-parser", first.evidence]],
    );
    const evaluations = recordsOf<{
      step: string;
      candidate: { commit: string };
      manifest: { inputs: unknown[] };
    }>(dir, "evaluation");
    const s01 = evaluations.find((e) => e.step === "CP99-S01");
    const s02Eval = evaluations.find((e) => e.step === "CP99-S02");
    assert.deepEqual(s02Eval?.manifest.inputs, [
      { step: "CP99-S01", output: "config-parser", evaluation: first.evaluation },
    ]);
    const s02Start = recordsOf<{ step: string; production: { base: { commit: string } } | null }>(
      dir,
      "start",
    ).find((s) => s.step === "CP99-S02");
    assert.equal(s02Start?.production?.base.commit, s01?.candidate.commit);
  });
});

describe("T3-E correction: a sealed-out attempt keeps what it was correcting", () => {
  it("the attempt after a seal rejection restarts from where it started, with the earlier findings", async () => {
    const w = world();
    const producer = producerBy((attempt) =>
      attempt === 1
        ? { "src/parser.mjs": LENIENT_PARSER }
        : attempt === 2
          ? {
              "src/parser.mjs": GOOD_PARSER(),
              "README.md": "rewritten outside the writable paths\n",
            }
          : { "src/parser.mjs": GOOD_PARSER() },
    );
    const result = await startRun(
      runConfig(w.repo, w.scratch),
      testDeps(w.repo, { producer, reviewer: reviewer(), bypass: true }),
    );
    assertAccepted(result, ["CP99-S01"]);
    const [second, third] = [producer.packets[1], producer.packets[2]];
    assert.ok(second && third);
    assert.ok(second.findings.length > 0);
    assert.deepEqual(third.findings.slice(0, second.findings.length), second.findings);
    assert.deepEqual(
      third.findings.slice(second.findings.length).map((f) => [f.rule, f.defect]),
      [["write-policy", "README.md: modified outside the writable paths"]],
    );
    const starts = recordsOf<{ phase: string; production: { from: { commit: string } } | null }>(
      dirOf(result),
      "start",
    ).filter((st) => st.phase === "produce");
    assert.equal(starts[2]?.production?.from.commit, starts[1]?.production?.from.commit);
  });
});

describe("T3-E budgets: exhaustion never passes and resume cannot reset counters", () => {
  it("exhausted correction attempts stop unaccepted; resume adds none", async () => {
    const w = world();
    const producer = producerBy(() => ({ "src/parser.mjs": LENIENT_PARSER }));
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const result = await startRun(runConfig(w.repo, w.scratch, { attempts: 2 }), deps);
    assertPaused(result, {
      code: "exhausted",
      detail: /2 production attempts of CP99-S01 are used/,
    });
    const dir = dirOf(result);
    assert.equal(producer.requests.length, 2);
    assert.equal(actions(dir, "acceptance").length, 0);
    const again = await resumeRun(dir, deps);
    assertPaused(again, { code: "exhausted" });
    assert.equal(producer.requests.length, 2);
    assert.equal(actions(dir, "acceptance").length, 0);
  });

  it("protocol retries are bounded and survive resume", async () => {
    const w = world();
    const producer = scriptedAgent(() => ({ raw: "not json" }));
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const result = await startRun(runConfig(w.repo, w.scratch, { retries: 1 }), deps);
    assertPaused(result, { code: "retries", subject: /^produce\/CP99-S01\/1$/ });
    assert.equal(producer.requests.length, 2);
    const again = await resumeRun(dirOf(result), deps);
    assertPaused(again, { code: "retries" });
    assert.equal(producer.requests.length, 2);
  });

  it("a retry within the budget still reaches acceptance", async () => {
    const w = world();
    let calls = 0;
    const producer = scriptedAgent((session) =>
      ++calls === 1
        ? { raw: "{" }
        : submit(
            session,
            { "src/parser.mjs": GOOD_PARSER() },
            { "config-parser": ["src/parser.mjs"] },
          ),
    );
    const result = await startRun(
      runConfig(w.repo, w.scratch, { retries: 1 }),
      testDeps(w.repo, { producer, reviewer: reviewer() }),
    );
    assertAccepted(result, ["CP99-S01"]);
    assert.deepEqual(
      producer.packets.map((p) => p.attempt),
      [1, 1],
    );
  });

  it("a provider limit stops the run unaccepted, before and after resume", async () => {
    const w = world();
    const producer = scriptedAgent(() => ({ subtype: "error_max_budget_usd" }));
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const result = await startRun(runConfig(w.repo, w.scratch), deps);
    assertPaused(result, { code: "exhausted", detail: /exhausted its spend limit/ });
    const again = await resumeRun(dirOf(result), deps);
    assertPaused(again, { code: "exhausted", detail: /spend/ });
    assert.equal(producer.requests.length, 1);
    assert.equal(actions(dirOf(result), "acceptance").length, 0);
  });
});

describe("T3-E approvals and effects", () => {
  const release = (w: World, through = "CP98-S01") =>
    runConfig(w.repo, w.scratch, { checkpoint: "CP98", through });

  it("an approval request pauses the run; only the owner's approval permits acceptance and one effect", async () => {
    const w = world();
    const service = receiptService();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: service,
    });
    const paused = await startRun(release(w), deps);
    const request = approvalOf(paused);
    const dir = dirOf(paused);
    assert.deepEqual(service.executions, []);
    const [asked] = recordsOf<ApprovalRequest>(dir, "approval-request");
    assert.ok(asked?.effect);
    assert.equal(asked.authority, "owner");
    assert.deepEqual(
      asked.effect.outputs.map((o) => [o.output, o.paths.map((p) => p.path)]),
      [["report", ["src/report.md"]]],
    );
    assert.equal(asked.binding.digest, runnerRegistry().get("report.release-approval")?.digest);

    const intruder = await approveRequest(dir, {
      request,
      decision: "approved",
      actor: "intruder",
    });
    assert.deepEqual(intruder, {
      ok: false,
      diagnostics: ["intruder does not hold the owner authority of this run"],
    });
    const unknown = await approveRequest(dir, {
      request: `sha256:${"0".repeat(64)}`,
      decision: "approved",
      actor: OWNER,
    });
    assert.equal(unknown.ok, false);
    assert.match(stringify(unknown), /is not an approval request of this run/);
    const approved = await approveRequest(dir, { request, decision: "approved", actor: OWNER });
    assert.equal(approved.ok, true, stringify(approved));
    const twice = await approveRequest(dir, { request, decision: "approved", actor: OWNER });
    assert.match(stringify(twice), /already decided/);

    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    const order = eventsOf(dir)
      .map((e) => e.action)
      .filter((a) => ["approval", "acceptance", "effect-intent", "effect-receipt"].includes(a));
    assert.deepEqual(order, ["approval", "acceptance", "effect-intent", "effect-receipt"]);
    const [approval] = recordsOf<Approval & { request: string }>(dir, "approval");
    assert.equal(approval?.request, request);
    assert.equal(approval?.actor, OWNER);
  });

  it("after its effect, the next eligible step is unconverted and pauses the run", async () => {
    const w = world();
    const service = receiptService();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: service,
    });
    const paused = await startRun(release(w, "CP98-S02"), deps);
    const dir = dirOf(paused);
    assert.ok(
      (
        await approveRequest(dir, {
          request: approvalOf(paused),
          decision: "approved",
          actor: OWNER,
        })
      ).ok,
    );
    const result = await resumeRun(dir, deps);
    assertPaused(result, { code: "unconverted", step: "CP98-S02" });
    assert.ok(result.outcome === "paused");
    assert.deepEqual(result.accepted, ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
  });

  it("a denied approval runs no effect and keeps the step unaccepted", async () => {
    const w = world();
    const service = receiptService();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: service,
    });
    const paused = await startRun(release(w), deps);
    const dir = dirOf(paused);
    const request = approvalOf(paused);
    assert.ok((await approveRequest(dir, { request, decision: "denied", actor: OWNER })).ok);
    assertPaused(await resumeRun(dir, deps), {
      code: "approval",
      detail: /denied by fixture-owner/,
    });
    assertPaused(await resumeRun(dir, deps), { code: "approval", detail: /denied/ });
    assert.equal(service.executions.length, 0);
    assert.equal(actions(dir, "acceptance").length, 0);
    const reversal = await approveRequest(dir, { request, decision: "approved", actor: OWNER });
    assert.match(stringify(reversal), /already decided/);
  });

  /** A CP98 run paused awaiting approval, and its request. */
  async function awaiting(service: ReturnType<typeof receiptService>) {
    const w = world();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: service,
    });
    const paused = await startRun(release(w), deps);
    const dir = dirOf(paused);
    const [asked] = recordsOf<ApprovalRequest>(dir, "approval-request");
    assert.ok(asked);
    return { dir, deps, asked, request: approvalOf(paused) };
  }

  it("a missing approval permits no acceptance or effect", async () => {
    const service = receiptService();
    const { dir, deps } = await awaiting(service);
    approvalOf(await resumeRun(dir, deps));
    assert.equal(service.executions.length, 0);
    assert.equal(actions(dir, "acceptance").length, 0);
  });

  // A faulty writer records approvals past the operator channel.
  const bypassed = /did not come through the operator channel/;
  const bypasses: [
    string,
    (asked: ApprovalRequest, request: string) => Approval,
    { code: string; detail: RegExp },
  ][] = [
    [
      "of another target",
      (asked) => ({ ...approvalFor(asked), target: { ...asked.target, criterion: "AC02" } }),
      { code: "owner", detail: bypassed },
    ],
    ["answering no request", (asked) => approvalFor(asked), { code: "owner", detail: bypassed }],
    [
      "by an actor without the authority",
      (asked, request) => ({ ...approvalFor(asked), actor: "intruder", request }),
      { code: "owner", detail: bypassed },
    ],
    [
      "of another evaluation",
      (asked) => ({ ...approvalFor(asked), evaluation: `sha256:${"1".repeat(64)}` }),
      { code: "approval", detail: /awaiting approval/ },
    ],
  ];
  for (const [name, approval, expected] of bypasses) {
    it(`an approval ${name} permits no acceptance or effect`, async () => {
      const service = receiptService();
      const { dir, deps, asked, request } = await awaiting(service);
      const taken = await recoverRun(dir, { fence: () => Promise.resolve() });
      assert.ok(taken.kind === "recovered");
      recordApproval(taken.run, asked.attempt, approval(asked, request));
      releaseRun(taken.run);
      assertPaused(await resumeRun(dir, deps), expected);
      assert.equal(service.executions.length, 0);
      assert.equal(actions(dir, "acceptance").length, 0);
    });
  }

  it("a receipt for another effect is recorded, and the effect never runs again", async () => {
    const service = receiptService();
    const { dir, deps, request } = await awaiting(service);
    assert.ok((await approveRequest(dir, { request, decision: "approved", actor: OWNER })).ok);
    service.fault = "wrong-receipt";
    assertPaused(await resumeRun(dir, deps), { code: "effect-invalid", detail: /elsewhere/ });
    assertPaused(await resumeRun(dir, deps), { code: "effect-invalid", detail: /will not repeat/ });
    assert.equal(service.executions.length, 1);
    assert.equal(actions(dir, "effect-invalid").length, 1);
    assert.equal(actions(dir, "effect-receipt").length, 0);
  });

  it("the operator channel is not the candidate's: tools, released runs and journaled requests only", async () => {
    const w = world();
    const producer = goodProducer();
    const deps = testDeps(w.repo, { producer, reviewer: reviewer(), effects: receiptService() });
    const paused = await startRun(release(w), deps);
    const dir = dirOf(paused);
    assert.deepEqual(
      producer.requests[0]?.tools.map((t) => t.name),
      ["read_file", "search_files", "write_file", "run_command"],
    );
    // A run owned by a controller refuses the operator channel.
    const taken = await recoverRun(dir, { fence: () => Promise.resolve() });
    assert.ok(taken.kind === "recovered");
    const busy = await approveRequest(dir, {
      request: approvalOf(paused),
      decision: "approved",
      actor: OWNER,
    });
    assert.match(stringify(busy), /not released/);
    releaseRun(taken.run);
    // The runner itself never records an approval.
    assert.equal(actions(dir, "approval").length, 0);
  });
});

describe("T3-E recovery: crashes recover without duplicate action", () => {
  const candidateReviews = (dir: string): number =>
    actions(dir, "review").filter((e) => e.data.kind === "candidate").length;
  const runDir = (w: World): string => {
    const [dir] = readdirSync(join(w.scratch, "runs")).map((d) => join(w.scratch, "runs", d));
    assert.ok(dir);
    return dir;
  };

  const crashes: [string, (event: JournalEvent) => void][] = [
    ["after production", crashAfter("evaluation")],
    ["after an admission", crashAfter("verifier-admission")],
    ["after verification", crashAfter("start", "verify")],
    ["after a review", crashAfter("start", "review")],
    ["after an acceptance", crashAfter("acceptance")],
  ];
  for (const [name, progress] of crashes) {
    it(`a crash ${name} resumes to one acceptance per step, repeating no work`, async () => {
      const w = world();
      const config = runConfig(w.repo, w.scratch, { through: "CP99-S02" });
      const producer = goodProducer();
      const review = reviewer();
      await assert.rejects(
        startRun(config, testDeps(w.repo, { producer, reviewer: review, progress })),
        Crash,
      );
      const dir = runDir(w);
      const result = await resumeRun(dir, testDeps(w.repo, { producer, reviewer: review }));
      assertAccepted(result, ["CP99-S01", "CP99-S02"]);
      assert.deepEqual(
        actions(dir, "acceptance").map((e) => e.data.step),
        ["CP99-S01", "CP99-S02"],
      );
      // Completed work is never redone: one production and one review per step.
      assert.equal(producer.requests.length, 2);
      assert.equal(candidateReviews(dir), 2);
      assert.equal(actions(dir, "start").filter((e) => e.data.phase === "verify").length, 2);
    });
  }

  /** Workspaces whose `role` opening fails once, as soon as a `phase` start is journaled. */
  const failOnceDuring = (
    deps: RunnerDeps,
    role: "verifier" | "reviewer",
    phase: string,
    error: () => Error,
  ): RunnerDeps => ({
    ...deps,
    workspaces: (run, root) => {
      const base = deps.workspaces(run, root);
      let failed = false;
      return {
        ...base,
        [role]: (snapshot: Parameters<typeof base.verifier>[0]) => {
          const started = eventsOf(run.dir).some(
            (e) => e.action === "start" && e.data.phase === phase,
          );
          if (started && !failed) {
            failed = true;
            return Promise.reject(error());
          }
          return base[role](snapshot);
        },
      };
    },
  });

  it("a crash inside a review reruns the review on resume, as a retry", async () => {
    const w = world();
    const deps = testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() });
    const crashing = failOnceDuring(
      deps,
      "reviewer",
      "review",
      () => new Crash("crash opening the reviewer workspace"),
    );
    await assert.rejects(startRun(runConfig(w.repo, w.scratch), crashing), Crash);
    const dir = runDir(w);
    assert.equal(candidateReviews(dir), 0);
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    assert.equal(actions(dir, "start").filter((e) => e.data.phase === "review").length, 2);
    assert.equal(candidateReviews(dir), 1);
  });

  it("a verifier that could not run is run again before the review", async () => {
    const w = world();
    const deps = failOnceDuring(
      testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() }),
      "verifier",
      "verify",
      () => new Error("docker: no such container"),
    );
    const result = await startRun(runConfig(w.repo, w.scratch), deps);
    assertAccepted(result, ["CP99-S01"]);
    const dir = dirOf(result);
    const runs = recordsOf<{ stage: string; binding: string; error: string | null }>(
      dir,
      "verifier-invocation",
    ).filter((i) => i.stage === "acceptance");
    assert.match(runs[0]?.error ?? "", /no such container/);
    assert.equal(runs.filter((i) => i.binding === runs[0]?.binding).length, 2);
    // The review came after the rerun, so it was shown every counted run.
    const events = eventsOf(dir);
    const lastRun = events.map((e) => e.action).lastIndexOf("verifier-invocation");
    const review = events.findIndex((e) => e.action === "start" && e.data.phase === "review");
    assert.ok(lastRun < review);
  });

  it("a crash inside production is retried once on resume, within the retry budget", async () => {
    const w = world();
    const producer = goodProducer();
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const crashing: RunnerDeps = {
      ...deps,
      workspaces: (run, root) => ({
        ...deps.workspaces(run, root),
        producer: () => Promise.reject(new Crash("crash opening the producer workspace")),
      }),
    };
    await assert.rejects(startRun(runConfig(w.repo, w.scratch, { retries: 1 }), crashing), Crash);
    const [dir] = readdirSync(join(w.scratch, "runs")).map((d) => join(w.scratch, "runs", d));
    assert.ok(dir);
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    assert.equal(producer.requests.length, 1);
  });

  it("an interrupted phase consumes a retry: with none left, resume pauses", async () => {
    const w = world();
    const deps = testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() });
    const crashing: RunnerDeps = {
      ...deps,
      workspaces: (run, root) => ({
        ...deps.workspaces(run, root),
        producer: () => Promise.reject(new Crash("crash opening the producer workspace")),
      }),
    };
    await assert.rejects(startRun(runConfig(w.repo, w.scratch, { retries: 0 }), crashing), Crash);
    const [dir] = readdirSync(join(w.scratch, "runs")).map((d) => join(w.scratch, "runs", d));
    assert.ok(dir);
    assertPaused(await resumeRun(dir, deps), {
      code: "retries",
      subject: /^produce\/CP99-S01\/1$/,
    });
  });

  /** A CP98 run paused for approval, approved by the owner. */
  async function approvedRelease(service: ReturnType<typeof receiptService>) {
    const w = world();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: service,
    });
    const paused = await startRun(
      runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" }),
      deps,
    );
    const dir = dirOf(paused);
    assert.ok(
      (
        await approveRequest(dir, {
          request: approvalOf(paused),
          decision: "approved",
          actor: OWNER,
        })
      ).ok,
    );
    return { dir, deps };
  }

  it("a crash after the intent, before the effect, reads back and runs it once", async () => {
    const service = receiptService();
    const { dir, deps } = await approvedRelease(service);
    service.fault = "crash-before";
    await assert.rejects(resumeRun(dir, deps), Crash);
    assert.equal(actions(dir, "effect-intent").length, 1);
    assert.equal(service.executions.length, 0);
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    assert.deepEqual(
      recordsOf<{ reconciled: boolean }>(dir, "effect-receipt").map((r) => r.reconciled),
      [false],
    );
  });

  it("a crash after the effect, before its receipt, reconciles without repeating it", async () => {
    const service = receiptService();
    const { dir, deps } = await approvedRelease(service);
    service.fault = "crash-after";
    await assert.rejects(resumeRun(dir, deps), Crash);
    assert.equal(service.executions.length, 1);
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    assert.deepEqual(
      recordsOf<{ reconciled: boolean }>(dir, "effect-receipt").map((r) => r.reconciled),
      [true],
    );
  });

  it("a lost response is reconciled by reading the target back", async () => {
    const service = receiptService();
    const { dir, deps } = await approvedRelease(service);
    service.fault = "lost";
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    assert.deepEqual(
      recordsOf<{ reconciled: boolean }>(dir, "effect-receipt").map((r) => r.reconciled),
      [true],
    );
  });

  it("a torn receipt write is quarantined and the effect reconciled, not repeated", async () => {
    const service = receiptService();
    const { dir, deps } = await approvedRelease(service);
    service.fault = "crash-after";
    await assert.rejects(resumeRun(dir, deps), Crash);
    const journal = join(dir, "journal");
    const segment = readdirSync(journal)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .at(-1);
    assert.ok(segment);
    appendFileSync(join(journal, segment), '{"seq":99,"action":"effect-rec');
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    const owners = actions(dir, "owner").map((e) => e.data.quarantined);
    assert.ok(
      owners.some((q) => typeof q === "string"),
      stringify(owners),
    );
  });

  it("a crash after the receipt neither repeats the effect nor loses the acceptance", async () => {
    const service = receiptService();
    const { dir, deps } = await approvedRelease(service);
    await assert.rejects(
      resumeRun(dir, { ...deps, progress: crashAfter("effect-receipt") }),
      Crash,
    );
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    assert.equal(actions(dir, "effect-intent").length, 1);
  });

  it("an uncertain effect that cannot be read back pauses and is never repeated", async () => {
    const service = receiptService({ inspect: false });
    const { dir, deps } = await approvedRelease(service);
    service.fault = "lost";
    assertPaused(await resumeRun(dir, deps), {
      code: "effect-uncertain",
      detail: /will not repeat it/,
    });
    assertPaused(await resumeRun(dir, deps), { code: "effect-uncertain" });
    assert.equal(service.executions.length, 1);
    assert.equal(actions(dir, "effect-intent").length, 1);
  });
});

describe("T3-E invalidation: changed inputs invalidate prior results", () => {
  const changes: [string, Partial<Parameters<typeof testDeps>[1]>][] = [
    ["the approval binding's version", { registry: runnerRegistry("2") }],
    ["the harness identity", { harness: "t3-e-test-changed" }],
  ];
  for (const [name, change] of changes) {
    it(`a change of ${name} re-evaluates; the earlier approval permits nothing`, async () => {
      const w = world();
      const service = receiptService();
      const base = { producer: goodProducer(), reviewer: reviewer(), effects: service };
      const paused = await startRun(
        runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" }),
        testDeps(w.repo, base),
      );
      const dir = dirOf(paused);
      const first = approvalOf(paused);
      assert.ok(
        (await approveRequest(dir, { request: first, decision: "approved", actor: OWNER })).ok,
      );

      const changed = testDeps(w.repo, { ...base, ...change });
      const second = approvalOf(await resumeRun(dir, changed));
      assert.notEqual(second, first);
      assert.equal(service.executions.length, 0);
      assert.equal(actions(dir, "acceptance").length, 0);
      assert.equal(actions(dir, "evaluation").length, 2);
      // The earlier evaluation's records are kept, and its request is superseded.
      assert.equal(actions(dir, "approval").length, 1);
      assert.match(
        stringify(
          await approveRequest(dir, { request: first, decision: "approved", actor: OWNER }),
        ),
        /superseded/,
      );
      assert.ok(
        (await approveRequest(dir, { request: second, decision: "approved", actor: OWNER })).ok,
      );
      assertAccepted(await resumeRun(dir, changed), ["CP98-S01"]);
      assert.equal(service.executions.length, 1);
    });
  }

  it("a producer cannot change an accepted input; a change that evades the workspace is sealed out", async () => {
    const w = world();
    const producer = producerBy((attempt, packet) =>
      packet.step.id === "CP99-S01"
        ? { "src/parser.mjs": GOOD_PARSER() }
        : attempt === 1
          ? { "src/parser.mjs": LENIENT_PARSER, "src/command.mjs": COMMAND }
          : { "src/command.mjs": COMMAND },
    );
    const config = runConfig(w.repo, w.scratch, { through: "CP99-S02" });
    const guarded = await startRun(config, testDeps(w.repo, { producer, reviewer: reviewer() }));
    assertAccepted(guarded, ["CP99-S01", "CP99-S02"]);
    const refused = recordsOf<{ observation: { toolCalls: { target: string; ok: boolean }[] } }>(
      dirOf(guarded),
      "agent-invocation",
    ).flatMap((o) => o.observation.toolCalls.filter((c) => c.target === "src/parser.mjs" && !c.ok));
    assert.equal(refused.length, 1);

    const v = world();
    const evading = producerBy((attempt, packet) =>
      packet.step.id === "CP99-S01"
        ? { "src/parser.mjs": GOOD_PARSER() }
        : attempt === 1
          ? { "src/parser.mjs": LENIENT_PARSER, "src/command.mjs": COMMAND }
          : { "src/command.mjs": COMMAND },
    );
    const sealed = await startRun(
      runConfig(v.repo, v.scratch, { through: "CP99-S02" }),
      testDeps(v.repo, { producer: evading, reviewer: reviewer(), bypass: true }),
    );
    assertAccepted(sealed, ["CP99-S01", "CP99-S02"]);
    const [rejection] = recordsOf<{ diagnostics: string[] }>(dirOf(sealed), "seal-rejected");
    assert.deepEqual(rejection?.diagnostics, [
      "src/parser.mjs: modified outside the writable paths",
    ]);
    const second = evading.packets.find((p) => p.step.id === "CP99-S02" && p.attempt === 2);
    assert.deepEqual(
      second?.findings.map((f) => [f.rule, f.defect]),
      [["write-policy", "src/parser.mjs: modified outside the writable paths"]],
    );
  });

  it("a moved repository head refuses resume", async () => {
    const w = world();
    const deps = testDeps(w.repo, {
      producer: goodProducer(),
      reviewer: reviewer(),
      effects: receiptService(),
    });
    const paused = await startRun(
      runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" }),
      deps,
    );
    writeFileSync(join(w.repo.root, "later.txt"), "a later commit\n");
    git(w.repo.root, ["add", "-A"]);
    git(w.repo.root, ["commit", "-q", "--no-gpg-sign", "-m", "later"]);
    const result = await resumeRun(dirOf(paused), deps);
    assert.equal(result.outcome, "invalid");
    assert.equal(exitCode(result), 2);
    assert.match(stringify(result), /not the expected head/);
  });
});

describe("T3-E invalidation after acceptance: an acceptance counts only while its evaluation is current", () => {
  const evaluationsOf = (dir: string, step: string): string[] =>
    actions(dir, "evaluation")
      .filter((e) => e.data.step === step)
      .map((e) => e.evaluation ?? "");

  it("a harness change after acceptance re-evaluates the accepted step and its dependant", async () => {
    const w = world();
    const producer = goodProducer();
    const config = runConfig(w.repo, w.scratch, { through: "CP99-S02" });
    const first = await startRun(config, testDeps(w.repo, { producer, reviewer: reviewer() }));
    assertAccepted(first, ["CP99-S01", "CP99-S02"]);
    const dir = dirOf(first);
    // Unchanged, a resume accepts again without any new work.
    assertAccepted(await resumeRun(dir, testDeps(w.repo, { producer, reviewer: reviewer() })), [
      "CP99-S01",
      "CP99-S02",
    ]);
    assert.equal(actions(dir, "evaluation").length, 2);

    const changed = testDeps(w.repo, { producer, reviewer: reviewer(), harness: "t3-e-changed" });
    assertAccepted(await resumeRun(dir, changed), ["CP99-S01", "CP99-S02"]);
    // Both steps were evaluated, verified and reviewed again; nothing was produced again.
    assert.equal(producer.requests.length, 2);
    assert.equal(evaluationsOf(dir, "CP99-S01").length, 2);
    assert.equal(evaluationsOf(dir, "CP99-S02").length, 2);
    const acceptances = actions(dir, "acceptance");
    assert.deepEqual(
      acceptances.map((e) => e.data.step),
      ["CP99-S01", "CP99-S02", "CP99-S01", "CP99-S02"],
    );
    // The dependant was re-evaluated against its input's new evaluation.
    const s02 = recordsOf<{ step: string; manifest: { inputs: { evaluation: string }[] } }>(
      dir,
      "evaluation",
    ).filter((e) => e.step === "CP99-S02");
    assert.deepEqual(
      s02.map((e) => e.manifest.inputs[0]?.evaluation),
      evaluationsOf(dir, "CP99-S01"),
    );
  });

  it("an accepted step interrupted before its effect is re-evaluated, and asks again, before the effect", async () => {
    const w = world();
    const service = receiptService();
    const base = { producer: goodProducer(), reviewer: reviewer(), effects: service };
    const paused = await startRun(
      runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" }),
      testDeps(w.repo, base),
    );
    const dir = dirOf(paused);
    const first = approvalOf(paused);
    assert.ok(
      (await approveRequest(dir, { request: first, decision: "approved", actor: OWNER })).ok,
    );
    await assert.rejects(
      resumeRun(dir, testDeps(w.repo, { ...base, progress: crashAfter("acceptance") })),
      Crash,
    );
    assert.equal(actions(dir, "acceptance").length, 1);

    const changed = testDeps(w.repo, { ...base, harness: "t3-e-changed" });
    const second = approvalOf(await resumeRun(dir, changed));
    assert.notEqual(second, first);
    assert.equal(service.executions.length, 0);
    assert.ok(
      (await approveRequest(dir, { request: second, decision: "approved", actor: OWNER })).ok,
    );
    assertAccepted(await resumeRun(dir, changed), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
  });

  it("an effect already run is not repeated when its step is re-evaluated and approved again", async () => {
    const w = world();
    const service = receiptService();
    const base = { producer: goodProducer(), reviewer: reviewer(), effects: service };
    const paused = await startRun(
      runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" }),
      testDeps(w.repo, base),
    );
    const dir = dirOf(paused);
    assert.ok(
      (
        await approveRequest(dir, {
          request: approvalOf(paused),
          decision: "approved",
          actor: OWNER,
        })
      ).ok,
    );
    assertAccepted(await resumeRun(dir, testDeps(w.repo, base)), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);

    const changed = testDeps(w.repo, { ...base, harness: "t3-e-changed" });
    const again = approvalOf(await resumeRun(dir, changed));
    assert.ok(
      (await approveRequest(dir, { request: again, decision: "approved", actor: OWNER })).ok,
    );
    assertAccepted(await resumeRun(dir, changed), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    assert.equal(actions(dir, "effect-intent").length, 1);
  });
});

describe("T3-E amendments: an operator amends a paused run and it resumes in place", () => {
  it("a raised attempt budget lets an exhausted step continue, keeping its attempts", async () => {
    const w = world();
    const producer = producerBy((attempt) => ({
      "src/parser.mjs": attempt <= 2 ? LENIENT_PARSER : GOOD_PARSER(),
    }));
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const paused = await startRun(runConfig(w.repo, w.scratch, { attempts: 2 }), deps);
    assertPaused(paused, { code: "exhausted" });
    const dir = dirOf(paused);
    const amended = await amendRun(
      dir,
      {
        config: runConfig(w.repo, w.scratch, { attempts: 3 }),
        reason: "one more attempt",
        actor: OWNER,
      },
      { repoRoot: w.repo.root, skillsRoot, env: { [KEY_VAR]: "sk-ant-test-e" } },
    );
    assert.ok(amended.ok, stringify(amended));
    assert.deepEqual(amended.changes, [{ path: "/budgets/attempts", old: 2, new: 3 }]);
    const [record] = recordsOf<{ actor: string; reason: string; changes: unknown[] }>(
      dir,
      "amendment",
    );
    assert.deepEqual([record?.actor, record?.reason], [OWNER, "one more attempt"]);

    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    assert.deepEqual(
      producer.packets.map((p) => p.attempt),
      [1, 2, 3],
    );
    assert.deepEqual(
      recordsOf<{ decision: string }>(dir, "decision").map((d) => d.decision),
      ["correct", "correct"],
    );
  });

  it("a raised spend limit lifts a provider stop", async () => {
    const w = world();
    let calls = 0;
    const producer = scriptedAgent((session) =>
      ++calls === 1
        ? { subtype: "error_max_budget_usd" }
        : submit(
            session,
            { "src/parser.mjs": GOOD_PARSER() },
            { "config-parser": ["src/parser.mjs"] },
          ),
    );
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const config = runConfig(w.repo, w.scratch);
    const paused = await startRun(config, deps);
    assertPaused(paused, { code: "exhausted", detail: /spend/ });
    const dir = dirOf(paused);
    assertPaused(await resumeRun(dir, deps), { code: "exhausted" });
    const raised = structuredClone(config);
    raised.budgets = {
      ...(config.budgets as object),
      provider_spend_limit: { usd: 2, turn_reservation_usd: 0.1 },
    };
    const amended = await amendRun(
      dir,
      { config: raised, reason: "the task needs more tokens", actor: OWNER },
      { repoRoot: w.repo.root, skillsRoot, env: { [KEY_VAR]: "sk-ant-test-e" } },
    );
    assert.ok(amended.ok, stringify(amended));
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    assert.equal(producer.requests.length, 2);
  });

  it("an extended selection keeps accepted evaluations; a reviewer change re-evaluates them", async () => {
    const w = world();
    const producer = goodProducer();
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const first = await startRun(runConfig(w.repo, w.scratch), deps);
    assertAccepted(first, ["CP99-S01"]);
    const dir = dirOf(first);
    const env = { repoRoot: w.repo.root, skillsRoot, env: { [KEY_VAR]: "sk-ant-test-e" } };
    const extended = runConfig(w.repo, w.scratch, { through: "CP99-S02", retries: 3 });
    const amended = await amendRun(
      dir,
      { config: extended, reason: "run step 2", actor: OWNER },
      env,
    );
    assert.ok(amended.ok);
    assert.deepEqual(
      amended.changes.map((c) => c.path),
      ["/budgets/retries", "/selection/through"],
    );
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01", "CP99-S02"]);
    assert.equal(actions(dir, "evaluation").filter((e) => e.data.step === "CP99-S01").length, 1);

    const reviewed = structuredClone(extended);
    reviewed.roles = {
      ...(extended.roles as object),
      reviewer: {
        adapter: "claude-sdk",
        model: MODEL,
        skills: ["code-review-and-quality", "evaluation"],
        max_turns: 8,
      },
    };
    assert.ok(
      (await amendRun(dir, { config: reviewed, reason: "stricter review", actor: OWNER }, env)).ok,
    );
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01", "CP99-S02"]);
    assert.equal(actions(dir, "evaluation").filter((e) => e.data.step === "CP99-S01").length, 2);
    assert.equal(producer.requests.length, 2);
  });

  it("a restrictive write-policy amendment is enforced on the accepted candidate, as in a fresh run", async () => {
    const violation = /write-policy: src\/parser\.mjs: added outside the writable paths/;
    const w = world();
    // Attempt 1 fails the verifiers; attempt 2 corrects it and is accepted.
    const producer = producerBy((attempt) => ({
      "src/parser.mjs": attempt === 1 ? LENIENT_PARSER : GOOD_PARSER(),
    }));
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const config = runConfig(w.repo, w.scratch);
    const first = await startRun(config, deps);
    assertAccepted(first, ["CP99-S01"]);
    const dir = dirOf(first);
    const restricted = structuredClone(config);
    restricted.permissions = {
      ...(config.permissions as object),
      protected: ["src/parser.mjs"],
    };
    const amended = await amendRun(
      dir,
      { config: restricted, reason: "protect the parser", actor: OWNER },
      { repoRoot: w.repo.root, skillsRoot, env: { [KEY_VAR]: "sk-ant-test-e" } },
    );
    assert.ok(amended.ok, stringify(amended));
    const paused = assertPaused(await resumeRun(dir, deps), {
      code: "exhausted",
      detail: violation,
    });
    assert.deepEqual(paused.accepted, []);
    assert.equal(actions(dir, "acceptance").length, 1);
    // The accepted candidate is not reused: a correction starts from the base,
    // keeping the findings attempt 2 was correcting, then the policy finding.
    const second = producer.packets.find((p) => p.attempt === 2);
    const third = producer.packets.find((p) => p.attempt === 3);
    assert.ok(second && third);
    assert.ok(second.findings.length > 0);
    assert.deepEqual(third.findings.slice(0, second.findings.length), second.findings);
    assert.deepEqual(
      third.findings.slice(second.findings.length).map((f) => [f.rule, f.defect]),
      [["write-policy", "src/parser.mjs: added outside the writable paths"]],
    );

    // Control: a fresh run under the same policy stops the same way.
    const v = world();
    const fresh = await startRun(
      { ...runConfig(v.repo, v.scratch), permissions: restricted.permissions },
      testDeps(v.repo, { producer: goodProducer(), reviewer: reviewer() }),
    );
    assertPaused(fresh, { code: "exhausted", detail: violation });
    assert.equal(actions(dirOf(fresh), "acceptance").length, 0);
  });

  it("an amendment is refused without a reason, without a change, for the run's identity, when invalid or when not released", async () => {
    const w = world();
    const deps = testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() });
    const config = runConfig(w.repo, w.scratch, { attempts: 1 });
    const paused = await startRun(config, deps);
    const dir = dirOf(paused);
    const env = { repoRoot: w.repo.root, skillsRoot, env: { [KEY_VAR]: "sk-ant-test-e" } };
    const refused = async (next: Record<string, unknown>, reason: string, pattern: RegExp) => {
      const result = await amendRun(dir, { config: next, reason, actor: OWNER }, env);
      assert.equal(result.ok, false, stringify(result));
      assert.match(stringify(result), pattern);
    };
    const raised = runConfig(w.repo, w.scratch, { attempts: 2 });
    await refused(raised, " ", /needs a reason/);
    await refused(config, "no change", /unchanged/);
    await refused(
      { ...raised, repository: { ...(raised.repository as object), name: "sb-dev/other" } },
      "rename",
      /\/repository\/name cannot be amended within a run/,
    );
    await refused(
      {
        ...raised,
        permissions: { ...(raised.permissions as object), approvers: { owner: ["intruder"] } },
      },
      "grant",
      /\/permissions\/approvers\/owner cannot be amended/,
    );
    const { workspace: _dropped, ...incomplete } = raised;
    void _dropped;
    await refused(incomplete, "invalid", /runner: \/ must have required property 'workspace'/);
    const taken = await recoverRun(dir, { fence: () => Promise.resolve() });
    assert.ok(taken.kind === "recovered");
    await refused(raised, "busy", /not released/);
    releaseRun(taken.run);
    assert.equal(actions(dir, "amendment").length, 0);
  });
});

describe("T3-E scheduling and command line", () => {
  it("with no eligible step, the run reports the unmet dependency", async () => {
    const w = world();
    const result = await startRun(
      runConfig(w.repo, w.scratch, { through: "CP99-S03" }),
      testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() }),
    );
    const paused = assertPaused(result, {
      code: "unmet-dependency",
      step: "CP99-S03",
      detail: /^uses fixture-reporting: no current capability receipt$/,
    });
    assert.deepEqual(paused.accepted, ["CP99-S01", "CP99-S02"]);
  });

  it("an unregistered binding pauses the step before any production", async () => {
    const w = world();
    const registry = new Map(runnerRegistry());
    registry.delete("parser.single-path");
    const producer = goodProducer();
    const result = await startRun(
      runConfig(w.repo, w.scratch),
      testDeps(w.repo, { producer, reviewer: reviewer(), registry }),
    );
    assertPaused(result, {
      code: "owner",
      subject: /^parser\.single-path$/,
      detail: /not registered/,
    });
    assert.equal(producer.requests.length, 0);
  });

  const harness = (args: string[], cwd: string) =>
    spawnSync(process.execPath, ["--import", tsx, cli, ...args], { cwd, encoding: "utf8" });

  it("run exits 2 with machine-readable reasons for invalid admission", () => {
    const w = world();
    const config = runConfig(w.repo, w.scratch);
    delete config.permissions;
    const file = join(w.scratch, "config.yml");
    writeFileSync(file, JSON.stringify(config));
    const run = harness(["run", "--config", file], w.repo.root);
    assert.equal(run.status, 2, run.stderr);
    const out = JSON.parse(run.stdout) as { outcome: string; diagnostics: string[] };
    assert.equal(out.outcome, "invalid");
    assert.match(
      out.diagnostics.join("\n"),
      /runner: \/ must have required property 'permissions'/,
    );
    const resume = harness(["resume", "--run", join(w.scratch, "none")], w.repo.root);
    assert.equal(resume.status, 2);
    assert.match(resume.stdout, /not a run directory/);
  });

  it("approve records the operator account's decision; status shows the pause", async () => {
    const w = world();
    const config = runConfig(w.repo, w.scratch, { checkpoint: "CP98", through: "CP98-S01" });
    const operator = userInfo().username;
    config.permissions = {
      writable: ["src"],
      scratch: [],
      protected: [],
      approvers: { owner: [operator] },
    };
    const paused = await startRun(
      config,
      testDeps(w.repo, {
        producer: goodProducer(),
        reviewer: reviewer(),
        effects: receiptService(),
      }),
    );
    const dir = dirOf(paused);
    const request = approvalOf(paused);
    const status = harness(["status", "--run", dir], w.repo.root);
    assert.equal(status.status, 0, status.stderr);
    const facts = JSON.parse(status.stdout) as {
      runner: { state: { state: string }; pause: { reasons: { request: string | null }[] } };
    };
    assert.equal(facts.runner.state.state, "paused");
    assert.ok(facts.runner.pause.reasons.some((r) => r.request === request));

    const unknown = harness(["approve", "--run", dir, "--request", "sha256:0"], w.repo.root);
    assert.equal(unknown.status, 2);
    const approve = harness(["approve", "--run", dir, "--request", request], w.repo.root);
    assert.equal(approve.status, 0, approve.stderr);
    assert.equal((JSON.parse(approve.stdout) as { actor: string }).actor, operator);
    const [approval] = recordsOf<Approval & { request: string }>(dir, "approval");
    assert.deepEqual(
      [approval?.actor, approval?.request, approval?.decision],
      [operator, request, "approved"],
    );
  });

  it("amend records nothing for an unchanged configuration and exits 2", async () => {
    const w = world();
    const config = runConfig(w.repo, w.scratch, { attempts: 1 });
    const paused = await startRun(
      config,
      testDeps(w.repo, { producer: scriptedAgent(() => ({ raw: "{" })), reviewer: reviewer() }),
    );
    const dir = dirOf(paused);
    const file = join(w.scratch, "amended.yml");
    writeFileSync(file, JSON.stringify(config));
    const amend = harness(
      ["amend", "--run", dir, "--config", file, "--reason", "none"],
      w.repo.root,
    );
    assert.equal(amend.status, 2, amend.stderr);
    assert.match(amend.stdout, /the configuration is unchanged/);
    assert.equal(actions(dir, "amendment").length, 0);
  });
});
