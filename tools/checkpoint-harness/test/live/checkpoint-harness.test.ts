// T3-F live proof (Task 3 research log §12 T3-F): the CP97 bootstrap loop with
// a real provider. It uses the runner, registry, definitions and contained
// Docker workspaces of the integration test. The first attempt of each step is
// its labelled injected fault; every other session is a real Claude Agent SDK
// session: the producer's corrections, the adequacy reviews and the candidate
// reviews. The reviewer has not seen any producer conversation.
//
// Requires a credential in PACTWRIGHT_ANTHROPIC_API_KEY (an Anthropic API key,
// or an OAuth token with PACTWRIGHT_LIVE_CREDENTIAL_KIND=oauth-token), an
// explicit model ID in PACTWRIGHT_LIVE_MODEL, each role's effort in
// PACTWRIGHT_LIVE_PRODUCER_EFFORT and PACTWRIGHT_LIVE_REVIEWER_EFFORT (T3.5
// H2) and a running Linux Docker daemon. A missing resource fails this file; it is never a pass. Spend is
// capped per session by budgets.provider_spend_limit. The evidence report is
// printed and, when PACTWRIGHT_LIVE_REPORT names a file, written there; with
// PACTWRIGHT_LIVE_KEEP set, the run directory is kept and its path printed.
// No outcome here is acceptance of the harness.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import { sdkProvider } from "../../src/claude.js";
import {
  containedProducer,
  harnessIdentity,
  startRun,
  type RunnerDeps,
  type RunResult,
} from "../../src/runner.js";
import { containedWorkspaces } from "../../src/verification.js";
import { fenceWorkers, PROFILE } from "../../src/workspace.js";
import {
  bootstrapConfig,
  bootstrapRegistry,
  bootstrapReport,
  bootstrapRepo,
  COMMAND_STEP,
  LIBRARY,
  SINGLE_VALIDATION,
  withInjectedFaults,
  type BootstrapReport,
} from "../bootstrap-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const skillsRoot = join(here, "../../../../.claude/skills");
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-f-live-"));
const KEY = "PACTWRIGHT_ANTHROPIC_API_KEY";
const SPEND = { usd: 1, turn_reservation_usd: 0.2 };
const PORT_ABOVE_HIGHEST = `${LIBRARY}/AC03/port-above-highest/automated/library.rejects`;

let model = "";
let effort = { producer: "", reviewer: "" };
let result: RunResult | null = null;
let report: BootstrapReport | null = null;

before(() => {
  const missing: string[] = [];
  if (!process.env[KEY]) missing.push(`${KEY} is not set`);
  model = process.env.PACTWRIGHT_LIVE_MODEL ?? "";
  if (model === "") missing.push("PACTWRIGHT_LIVE_MODEL is not set");
  effort = {
    producer: process.env.PACTWRIGHT_LIVE_PRODUCER_EFFORT ?? "",
    reviewer: process.env.PACTWRIGHT_LIVE_REVIEWER_EFFORT ?? "",
  };
  for (const [role, level] of Object.entries(effort)) {
    if (level === "") missing.push(`PACTWRIGHT_LIVE_${role.toUpperCase()}_EFFORT is not set`);
  }
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
  } catch {
    missing.push("no Docker daemon is reachable");
  }
  if (missing.length > 0) throw new Error(`live proof not executed: ${missing.join("; ")}`);
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "ignore" });
  }
});

after(async () => {
  if (result && result.outcome !== "invalid" && result.run) await fenceWorkers(result.run);
  if (report) {
    const text = stringify(report, null, 2);
    process.stdout.write(`# live evidence report\n${text}\n`);
    if (process.env.PACTWRIGHT_LIVE_REPORT) writeFileSync(process.env.PACTWRIGHT_LIVE_REPORT, text);
  }
  if (process.env.PACTWRIGHT_LIVE_KEEP) process.stdout.write(`# live run kept in ${scratch}\n`);
  else rmSync(scratch, { recursive: true, force: true });
});

describe("T3-F live: the bootstrap loop with a real producer and a fresh real reviewer", () => {
  it("corrects both injected faults through real sessions and accepts the selection", async () => {
    const repo = bootstrapRepo(scratch);
    const config = {
      ...bootstrapConfig(repo, scratch),
      roles: {
        producer: {
          adapter: "claude-sdk",
          model,
          effort: effort.producer,
          skills: ["karpathy-guidelines", "typescript-magician"],
          max_turns: 40,
        },
        reviewer: {
          adapter: "claude-sdk",
          model,
          effort: effort.reviewer,
          skills: ["code-review-and-quality", "evaluation"],
          max_turns: 30,
        },
      },
      credentials: {
        provider: `env:${KEY}`,
        kind: process.env.PACTWRIGHT_LIVE_CREDENTIAL_KIND ?? "api-key",
      },
      budgets: { attempts: 3, retries: 1, wall_time_seconds: 900, provider_spend_limit: SPEND },
    };
    const deps: RunnerDeps = {
      repoRoot: repo.root,
      skillsRoot,
      env: process.env,
      registry: bootstrapRegistry(),
      harness: harnessIdentity(),
      workspaces: (run, root) => ({
        producer: containedProducer(run, root),
        verifier: containedWorkspaces(run, root),
        reviewer: containedWorkspaces(run, root),
      }),
      effects: null,
      fence: fenceWorkers,
      providers: { producer: withInjectedFaults(sdkProvider) },
      signal: AbortSignal.timeout(3 * 60 * 60 * 1000),
      progress: (e) =>
        process.stderr.write(
          `# ${e.seq} ${e.action} ${String(e.data.step ?? e.data.binding ?? "")} ${e.attempt ?? ""}\n`,
        ),
    };
    result = await startRun(config, deps);
    assert.notEqual(result.outcome, "invalid", stringify(result, null, 2));
    assert.ok(result.outcome !== "invalid");
    report = bootstrapReport(result.dir);
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));

    const attempts = (step: string) => report?.attempts.filter((a) => a.step === step) ?? [];
    // The library: the injected fault fails its boundary target; a real session corrects it.
    const [injectedLibrary, ...libraryCorrections] = attempts(LIBRARY);
    assert.equal(injectedLibrary?.producer?.source, "injected-fault");
    assert.ok(injectedLibrary?.verification.failed.includes(PORT_ABOVE_HIGHEST));
    assert.equal(injectedLibrary?.decision?.decision, "correct");
    // The command: the test-green duplicate validation passes every automated
    // target; the real reviewer must reject it.
    const [injectedCommand, ...commandCorrections] = attempts(COMMAND_STEP);
    assert.equal(injectedCommand?.producer?.source, "injected-fault");
    assert.deepEqual(injectedCommand?.verification.failed, []);
    assert.equal(injectedCommand?.decision?.decision, "correct", stringify(injectedCommand));
    assert.ok(
      injectedCommand.decision?.rules.some(
        (r) => r === SINGLE_VALIDATION || r === `${COMMAND_STEP}/R03`,
      ),
      stringify(injectedCommand.decision),
    );
    // Every correction is a real session of the configured model.
    for (const a of [...libraryCorrections, ...commandCorrections]) {
      assert.equal(a.producer?.source, "agent");
      assert.equal(a.producer?.model?.reported, model, stringify(a.producer));
    }
    assert.ok(libraryCorrections.length > 0 && commandCorrections.length > 0);
    // Reviews are fresh real sessions, never a producer's.
    const producers = new Set(report.attempts.map((a) => a.producer?.session));
    const reviews = report.attempts.flatMap((a) => a.reviews);
    assert.ok(reviews.length >= 4);
    const admitted = report.admissions.filter((a) => a.outcome === "approved");
    assert.equal(admitted.length, 5, stringify(report.admissions));
    for (const r of [...reviews, ...admitted]) {
      assert.equal(r.model, model, stringify(r));
      assert.ok(r.session !== null && !producers.has(r.session), stringify(r));
    }
    // The final outputs pass every own target, and the library's are rechecked on the final candidate.
    const [library, command] = report.accepted;
    assert.ok(library && command);
    assert.deepEqual([library.step, command.step], [LIBRARY, COMMAND_STEP]);
    assert.ok(command.targets.includes(`${COMMAND_STEP}/AC02/missing-file/automated/cli.refuses`));
    assert.deepEqual(command.inputs, [
      { step: LIBRARY, output: "config-library", evaluation: library.evaluation },
    ]);
    const rechecked = report.recheck.filter((r) => r.step === COMMAND_STEP);
    assert.equal(rechecked.length, 15);
    assert.ok(rechecked.every((r) => r.outcome === "passed"));
  });
});
