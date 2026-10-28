// T3.6 L3-02, containment part (evidence-backed learning log §2.3): a
// diagnosis's proposed check runs only through the controller's validation
// and the existing contained execution path, on a fresh read-only copy of
// the explored candidate. Requires a running Linux Docker daemon; the pinned
// image is pulled by digest if absent. A missing Docker environment fails
// these tests; it is never a pass.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import type { Diagnosis } from "../../src/claude.js";
import { readEvidence, type JournalEvent, type RunHandle } from "../../src/evidence.js";
import {
  containedWorkspaces,
  diagnosticCheck,
  type ExplorationCheck,
  type ExplorationStart,
} from "../../src/verification.js";
import { fenceWorkers, PROFILE } from "../../src/workspace.js";
import { assertAccepted, eventsOf, LIBRARY } from "../bootstrap-fixtures.js";
import { committed, recordSession, sessionObservation } from "../knowledge-fixtures.js";
import {
  between,
  branch,
  LEARNING,
  plainDiagnosis,
  start,
  world,
  type World,
} from "../learning-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l3-int-"));
const runs: string[] = [];

/** Secrets of the controller's environment; none may reach a check. */
const SECRETS = {
  CLAUDE_CODE_OAUTH_TOKEN: `oauth-${randomUUID()}`,
  ANTHROPIC_API_KEY: `sk-ant-${randomUUID()}`,
  GITHUB_TOKEN: `ghs_${randomUUID()}`,
};

let w: World;
let dir: string;

before(async () => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
  Object.assign(process.env, SECRETS);
  w = await world(scratch, {
    faults: 3,
    learning: { ...LEARNING, phases: { exploration_rounds: 1, check_timeout_seconds: 30 } },
  });
  dir = branch(w, assertAccepted(await start(w), [LIBRARY]));
});

after(async () => {
  for (const key of Object.keys(SECRETS)) delete process.env[key];
  for (const id of runs) await fenceWorkers(id);
  rmSync(scratch, { recursive: true, force: true });
});

/** Runs `argv` as the explored candidate's approach check through the controller. */
async function check(
  run: RunHandle,
  exploration: { ref: string; record: ExplorationStart },
  argv: string[],
  timeout = 10,
): Promise<ExplorationCheck> {
  const diagnosis: Diagnosis = {
    ...plainDiagnosis("probe"),
    check: { argv, timeout_seconds: timeout, distinguishes: "containment" },
  };
  const ref = recordSession(
    run,
    {
      outcome: "diagnosed",
      diagnosis,
      observation: sessionObservation(run.dir, "reviewer", 4, randomUUID()),
    },
    { step: LIBRARY, purpose: "diagnostic-approach", exploration: exploration.ref, key: "probe" },
  );
  const event: JournalEvent | undefined = eventsOf(run.dir).find((e) => e.data.record === ref);
  assert.ok(event);
  const stored = await diagnosticCheck(run, {
    exploration,
    side: "approach",
    diagnosis: event,
    open: containedWorkspaces(run, join(scratch, "checks", randomUUID())),
    key: "probe",
  });
  return stored.record;
}

const text = (run: RunHandle, ref: string | undefined): string =>
  ref === undefined ? "" : readEvidence(run.dir, ref).toString("utf8");

describe("T3.6 L3-02 diagnostic checks in containment", () => {
  it("runs an authorised check and records its observation; prohibited effects fail inside the workspace", async () => {
    const [exploration] = committed<ExplorationStart>(dir, "exploration-start");
    assert.ok(exploration, "the run explored attempt 4");
    await between(dir, async (run) => {
      runs.push(run.run);
      // Control: normal read-only inspection of the explored candidate.
      const read = await check(run, exploration, ["sh", "-c", "grep -n 'port >' src/config.mjs"]);
      assert.equal(read.outcome, "ran");
      assert.equal(read.ran?.exit, 0);
      assert.match(text(run, read.ran?.stdout), /port > 65536/);

      // The candidate copy is read-only, and so is the rest of the workspace.
      for (const argv of [
        ["sh", "-c", "echo tampered > src/config.mjs"],
        ["sh", "-c", "touch /work/added"],
      ]) {
        const write = await check(run, exploration, argv);
        assert.equal(write.outcome, "ran", argv.join(" "));
        assert.notEqual(write.ran?.exit, 0, argv.join(" "));
        assert.match(text(run, write.ran?.stderr), /Read-only file system/, argv.join(" "));
      }

      // No network, no Docker control socket and no controller credential.
      const network = await check(run, exploration, [
        "node",
        "-e",
        "fetch('http://1.1.1.1').then(() => process.exit(0), () => process.exit(3))",
      ]);
      assert.equal(network.ran?.exit, 3);
      const socket = await check(run, exploration, [
        "sh",
        "-c",
        "test -e /var/run/docker.sock && echo present || echo absent",
      ]);
      assert.equal(text(run, socket.ran?.stdout).trim(), "absent");
      const env = await check(run, exploration, [
        "sh",
        "-c",
        "env; tr '\\0' '\\n' < /proc/1/environ 2>/dev/null; true",
      ]);
      assert.equal(env.ran?.exit, 0);
      const seen = text(run, env.ran?.stdout) + text(run, env.ran?.stderr);
      for (const secret of Object.values(SECRETS)) {
        assert.ok(!seen.includes(secret), "no controller secret reaches a check");
      }

      // A check that overruns its timeout is stopped and recorded as such.
      const slow = await check(run, exploration, ["sleep", "20"], 1);
      assert.equal(slow.outcome, "ran");
      assert.equal(slow.ran?.timedOut, true);

      // The explored candidate is unchanged: a fresh copy still holds its source.
      const again = await check(run, exploration, [
        "sh",
        "-c",
        "grep -c tampered src/config.mjs; true",
      ]);
      assert.equal(text(run, again.ran?.stdout).trim(), "0");

      // The controller refuses a check outside its limits before any workspace exists.
      const refused = await check(run, exploration, ["sleep", "1"], 31);
      assert.deepEqual(
        [refused.outcome, refused.reasons, refused.ran],
        ["refused", ["timeout 31 s is outside 1 to 30 s"], null],
      );
    });
  });

  it("leaves no container of the run behind", () => {
    for (const id of runs) {
      const left = execFileSync("docker", [
        "ps",
        "--all",
        "--quiet",
        "--filter",
        `label=pactwright.run=${id}`,
      ])
        .toString("utf8")
        .trim();
      assert.equal(left, "");
    }
  });
});
