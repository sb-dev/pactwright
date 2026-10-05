// T3.5 H3 acceptance in real containment (production readiness log §3 H3,
// H3-04 and H3-08). Requires a running Linux Docker daemon; the pinned image
// is pulled by digest if absent. A missing Docker environment fails these
// tests; it is never a pass. Each hosted job restores the saved state into a
// fresh directory, as in the offline H3 tests, but candidate commands,
// verifiers and reviewer workspaces run in the T3 containment boundary while
// the controller's environment holds provider, repository and Actions
// runtime credentials.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import type { AgentOutcome } from "../../src/claude.js";
import { readEvidence, readRun } from "../../src/evidence.js";
import { PROFILE } from "../../src/workspace.js";
import {
  dispatch,
  fixtureProducer,
  pendingOf,
  recordsOf,
  S01,
  S02,
  S03,
  S04,
  savedDir,
  STAMP,
  world,
} from "../h3-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-int-"));
before(() => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
});
after(() => rmSync(scratch, { recursive: true, force: true }));

/** Credentials a hosted controller job holds; none may reach candidate code. */
const SECRETS = {
  CLAUDE_CODE_OAUTH_TOKEN: "h3-int-oauth-6b7f0c",
  ANTHROPIC_API_KEY: "h3-int-api-key-91d2",
  GITHUB_TOKEN: "h3-int-github-token-3e55",
  ACTIONS_RUNTIME_TOKEN: "h3-int-runtime-token-a04c",
};

const PROBES = [
  ["sh", "-c", "env; cat /proc/1/environ 2>/dev/null | tr '\\0' '\\n'; exit 0"],
  ["sh", "-c", "test -e /var/run/docker.sock && echo docker-socket-present; exit 0"],
  ["sh", "-c", "echo cwd=$(pwd); ls -a /; ls -a ..; exit 0"],
];

describe("H3-04 and H3-08 in containment", () => {
  it("candidate commands see no credential or Docker control, and the contained procedure is accepted", async () => {
    const saved = { ...process.env };
    Object.assign(process.env, SECRETS);
    try {
      const w = world(scratch, { contained: true, env: { ...SECRETS } });
      w.producer = fixtureProducer({ probes: PROBES });
      const started = await dispatch(w, {
        action: "start",
        config: "h3-fixture.yml",
        through: S02,
      });
      const pending = pendingOf(started.at(-1) ?? assert.fail("no job ran"));
      await dispatch(w, { action: "approve", ...pending });
      // The automatic continuations a hosted run dispatches, until the run stops.
      let done = await dispatch(w, { action: "continue" });
      for (let i = 0; i < 10 && done.at(-1)?.next === "continue"; i++) {
        done = await dispatch(w, { action: "continue" });
      }
      const summary = done.at(-1)?.summary;
      assert.equal(summary?.outcome, "selection-accepted", stringify(summary));
      assert.deepEqual(summary?.accepted, [S01, S02]);

      // Every probe ran in the workspace, and its recorded output holds no credential.
      const dir = savedDir(w);
      const producer = recordsOf<AgentOutcome>(w, "agent-invocation", dir)
        .filter((o) => o.observation.role === "producer")
        .at(-1);
      const commands =
        producer?.observation.toolCalls.filter((c) => c.tool === "run_command") ?? [];
      assert.equal(commands.length, PROBES.length + 1);
      const output = commands
        .flatMap((c) => [c.stdout, c.stderr])
        .map((ref) => (ref ? readEvidence(dir, ref).toString("utf8") : ""))
        .join("\n");
      assert.match(output, /PATH=/, "the environment probe ran");
      assert.match(output, /^cwd=\/work$/m, "the commands ran in the contained workspace");
      for (const [name, value] of Object.entries(SECRETS)) {
        assert.doesNotMatch(output, new RegExp(value), `${name} reached candidate code`);
      }
      assert.doesNotMatch(output, /docker-socket-present/);
      assert.ok(commands.every((c) => c.exit === 0));

      // The contained procedure landed its revision in the published candidate.
      const head = w.github.branches.get(`harness/${w.run}`) ?? "";
      assert.equal(
        execFileSync("git", ["show", `${head}:${STAMP}`], { cwd: w.repo.root, encoding: "utf8" }),
        "stamp: Hello, Pactwright!\n",
      );
      // No saved state carries a credential either.
      assert.ok(readRun(dir).ok);
      for (const [name, value] of Object.entries(SECRETS)) {
        const found = spawnSync("grep", ["-rlF", value, dir], { encoding: "utf8" });
        assert.equal(found.status, 1, `${name} is in the saved state: ${found.stdout}`);
      }
    } finally {
      for (const key of Object.keys(SECRETS)) delete process.env[key];
      Object.assign(process.env, saved);
    }
  });

  it("a procedure in another repository may write a file of its declared target, contained", async () => {
    // Hosted run h3-proof-7, controller job 111700745348: the registry
    // target's writable RELEASES.md is a file, and containment failed to open it.
    const w = world(scratch, { contained: true, registry: true });
    const started = await dispatch(w, { action: "start", config: "h3-fixture.yml" });
    await dispatch(w, { action: "approve", ...pendingOf(started.at(-1) ?? assert.fail("no job")) });
    let done = await dispatch(w, { action: "continue", through: S04 });
    for (let i = 0; i < 10 && done.at(-1)?.next === "continue"; i++) {
      done = await dispatch(w, { action: "continue" });
    }
    const summary = done.at(-1)?.summary;
    assert.equal(summary?.outcome, "selection-accepted", stringify(summary));
    assert.deepEqual(summary?.accepted, [S01, S02, S03, S04]);
    const dir = savedDir(w);
    const s03 = recordsOf<AgentOutcome>(w, "agent-invocation", dir)
      .filter((o) => o.observation.role === "producer")
      .map((o) => o.observation.toolCalls.filter((c) => c.tool === "run_command"))
      .find((calls) => calls.some((c) => JSON.stringify(c).includes("record.mjs")));
    assert.ok(
      s03?.every((c) => c.exit === 0),
      "the registry procedure ran and succeeded",
    );
  });
});
