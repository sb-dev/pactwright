// T3-F integration (Task 3 research log §12 T3-F): the CP97 bootstrap loop of
// test/checkpoint-harness-f.test.ts in real containment. Producer, verifier
// and reviewer workspaces are contained Docker workspaces (T3-B's profile);
// sessions are scripted. It proves two-step scheduling, both corrections,
// accepted-input reuse, the integrated recheck and restart after a crash.
// A missing Docker environment fails these tests; it is never a pass.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import type { AgentOutcome } from "../../src/claude.js";
import { readEvidence } from "../../src/evidence.js";
import { containedProducer, resumeRun, startRun, type RunnerDeps } from "../../src/runner.js";
import { containedWorkspaces } from "../../src/verification.js";
import { fenceWorkers, PROFILE } from "../../src/workspace.js";
import {
  assertAccepted,
  bootstrapConfig,
  bootstrapRegistry,
  bootstrapReport,
  bootstrapRepo,
  bootstrapReviewer,
  COMMAND_STEP,
  eventsOf,
  injectedFirst,
  LIBRARY,
  SINGLE_VALIDATION,
  workOf,
  type BootstrapReport,
} from "../bootstrap-fixtures.js";
import {
  Crash,
  crashAfter,
  scriptedAgent,
  submit,
  testDeps,
  type Repo,
  type ScriptedAgent,
} from "../runner-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-f-integration-"));
const runs: string[] = [];

before(() => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "ignore" });
  }
});
after(async () => {
  for (const run of runs) await fenceWorkers(run);
  rmSync(scratch, { recursive: true, force: true });
});

const PORT_ABOVE_HIGHEST = `${LIBRARY}/AC03/port-above-highest/automated/library.rejects`;
const LIBRARY_PATH = "src/config.mjs";

/** The injected faults first, then the known-good work; the first command attempt also tries the accepted library. */
const producer = (): ScriptedAgent =>
  scriptedAgent(async (session) => {
    const { step, attempt } = session.packet;
    if (step.id === COMMAND_STEP && attempt === 1) {
      await session.call("write_file", { path: LIBRARY_PATH, content: "export {};\n" });
    }
    return submit(session, injectedFirst(step.id, attempt), workOf(step.id).outputs);
  });

const contained = (
  repo: Repo,
  agents: { producer: ScriptedAgent; reviewer: ScriptedAgent },
  progress?: RunnerDeps["progress"],
): RunnerDeps => ({
  ...testDeps(repo, {
    ...agents,
    registry: bootstrapRegistry(),
    harness: "t3-f-integration",
    ...(progress ? { progress } : {}),
  }),
  workspaces: (run, root) => ({
    producer: containedProducer(run, root),
    verifier: containedWorkspaces(run, root),
    reviewer: containedWorkspaces(run, root),
  }),
  fence: fenceWorkers,
});

describe("T3-F integration: the bootstrap loop in contained workspaces, with a restart", () => {
  let dir: string;
  let agents: { producer: ScriptedAgent; reviewer: ScriptedAgent };
  let report: BootstrapReport;
  before(async () => {
    const repo = bootstrapRepo(scratch);
    agents = { producer: producer(), reviewer: bootstrapReviewer(true) };
    const config = bootstrapConfig(repo, scratch);
    // The controller crashes once the library is accepted, then resumes.
    await assert.rejects(
      startRun(config, contained(repo, agents, crashAfter("acceptance"))),
      Crash,
    );
    const [run] = readdirSync(join(scratch, "runs"));
    assert.ok(run);
    dir = join(scratch, "runs", run);
    runs.push(
      (JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as { run: string }).run,
    );
    assertAccepted(await resumeRun(dir, contained(repo, agents)), [LIBRARY, COMMAND_STEP]);
    report = bootstrapReport(dir);
  });

  it("schedules the library, then the command, each corrected once and never repeated", () => {
    assert.deepEqual(
      agents.producer.packets.map((p) => [p.step.id, p.attempt]),
      [
        [LIBRARY, 1],
        [LIBRARY, 2],
        [COMMAND_STEP, 1],
        [COMMAND_STEP, 2],
      ],
    );
    assert.deepEqual(
      report.attempts.map((a) => [a.step, a.attempt, a.producer?.source, a.decision]),
      [
        [LIBRARY, 1, "injected-fault", { decision: "correct", rules: [PORT_ABOVE_HIGHEST] }],
        [LIBRARY, 2, "agent", { decision: "accept", rules: [] }],
        [
          COMMAND_STEP,
          1,
          "injected-fault",
          { decision: "correct", rules: [SINGLE_VALIDATION, `${COMMAND_STEP}/R03`] },
        ],
        [COMMAND_STEP, 2, "agent", { decision: "accept", rules: [] }],
      ],
    );
    // The duplicate-validation command was test-green in containment.
    const first = report.attempts.find((a) => a.step === COMMAND_STEP && a.attempt === 1);
    assert.deepEqual([first?.verification.failed, first?.verification.other], [[], []]);
    assert.equal(
      report.attempts.find((a) => a.step === LIBRARY && a.attempt === 1)?.verification.failed
        .length,
      1,
    );
  });

  it("the container refuses a write to the accepted library, and the candidate holds only the command", () => {
    const [event] = eventsOf(dir).filter(
      (e) => e.action === "agent-invocation" && e.data.step === COMMAND_STEP && e.attempt === 1,
    );
    const ref = event?.evidence[0];
    assert.ok(ref, "the command's first session is journaled");
    const invocation = JSON.parse(readEvidence(dir, ref).toString("utf8")) as AgentOutcome;
    const call = invocation.observation.toolCalls.find((c) => c.target === LIBRARY_PATH);
    assert.equal(call?.tool, "write_file");
    assert.equal(call?.ok, false, JSON.stringify(call));
    const command = report.attempts.filter((a) => a.step === COMMAND_STEP);
    for (const a of command) assert.deepEqual(a.candidate?.changes, ["added src/cli.mjs"]);
  });

  it("the command reuses the accepted library and rechecks its obligations on the final candidate", () => {
    const [library, command] = report.accepted;
    assert.ok(library && command);
    assert.deepEqual(command.inputs, [
      { step: LIBRARY, output: "config-library", evaluation: library.evaluation },
    ]);
    const rechecked = report.recheck.filter((r) => r.step === COMMAND_STEP);
    assert.equal(rechecked.length, 15);
    assert.ok(
      rechecked.every((r) => r.outcome === "passed"),
      JSON.stringify(rechecked),
    );
  });

  it("leaves no container of the run behind", () => {
    const left = execFileSync("docker", [
      "ps",
      "--all",
      "--quiet",
      "--filter",
      `label=pactwright.run=${report.run}`,
    ])
      .toString("utf8")
      .trim();
    assert.equal(left, "");
  });
});
