// T3.5 H1 integration (Task 3.5 research log §3 H1): the real candidate
// containment path for repository commands. CP96 runs with only the
// bindings its candidates declare; producer, verifier, reviewer and
// dependency-preparation workspaces are contained Docker workspaces of
// T3-B's profile; sessions are scripted. The fixture verifiers run for real:
// the gate builds and tests each sealed candidate with dependencies prepared
// from its lockfile, while the host repository holds stale build output, a
// correct source and other installed dependencies that would make the gate
// pass if any of them reached the candidate. A missing Docker environment
// fails these tests; it is never a pass.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import { readEvidence } from "../../src/evidence.js";
import { containedProducer, startRun, type RunnerDeps, type RunResult } from "../../src/runner.js";
import {
  containedDependencies,
  containedWorkspaces,
  type Invocation,
  type PreparationRecord,
} from "../../src/verification.js";
import { fenceWorkers, PROFILE, treeEntries } from "../../src/workspace.js";
import {
  DEPENDENCIES,
  EXIT,
  fault,
  producerOf,
  productionConfig,
  productionDeps,
  productionRepo,
  records,
  reviewerOf,
  S01,
  S02,
  work,
} from "../production-fixtures.js";
import type { Repo, ScriptedAgent } from "../runner-fixtures.js";
import { writeFiles } from "../verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h1-integration-"));
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

const GATE = "CP96/AC01/-/automated/repo.build-test";
const NAMED = `${S01}/AC01/named/automated/greet.behaves`;

/** Contained producer, verifier, reviewer and preparation workspaces; scripted sessions. */
const contained = (
  repo: Repo,
  agents: { producer: ScriptedAgent; reviewer: ScriptedAgent },
): RunnerDeps => ({
  ...productionDeps(repo, agents),
  workspaces: (run, root) => ({
    producer: containedProducer(run, root),
    verifier: containedWorkspaces(run, root),
    reviewer: containedWorkspaces(run, root),
    dependencies: (spec) => containedDependencies(run, root, spec),
  }),
  fence: fenceWorkers,
});

/**
 * The host repository's working tree gets what would pass the gate if it
 * leaked: a correct untracked source and its built output, and an installed
 * dependency of another version. None of it is committed.
 */
function pollute(repo: Repo): void {
  const greet = work(S01)["src/greet.mjs"] ?? "";
  writeFiles(repo.root, {
    "src/greet.mjs": greet,
    "dist/greet.mjs": greet,
    "node_modules/fixture-format/package.json":
      '{ "name": "fixture-format", "version": "9.9.9", "type": "module", "exports": "./index.mjs" }\n',
    "node_modules/fixture-format/index.mjs": "export const shout = (text) => text;\n",
  });
  const untracked = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: repo.root,
    encoding: "utf8",
  });
  assert.match(untracked, /\?\? dist\/greet\.mjs/u);
}

async function start(
  through: string,
  producer: ScriptedAgent,
): Promise<{ result: RunResult; dir: string; repo: Repo }> {
  const repo = productionRepo(scratch);
  pollute(repo);
  const result = await startRun(
    productionConfig(repo, scratch, { through }),
    contained(repo, { producer, reviewer: reviewerOf() }),
  );
  assert.ok("dir" in result, stringify(result));
  if (result.run) runs.push(result.run);
  return { result, dir: result.dir, repo };
}

/** What the gate's subject observed in an invocation, from its recorded stdout. */
const observed = (dir: string, invocation: Invocation): Record<string, unknown> => {
  const [subject] = invocation.subjects;
  assert.ok(subject, stringify(invocation));
  return JSON.parse(readEvidence(dir, subject.stdout).toString("utf8")) as Record<string, unknown>;
};

const containers = (run: string): string =>
  execFileSync("docker", ["ps", "--all", "--quiet", "--filter", `label=pactwright.run=${run}`], {
    encoding: "utf8",
  }).trim();

describe("T3.5 H1-03 candidate verification runs from the sealed candidate, contained", () => {
  let dir: string;
  let result: RunResult;
  before(async () => {
    // The first candidate's greeting is wrong; the host's is right.
    const producer = producerOf(
      (step, attempt) =>
        attempt === 1 ? { ...work(step), "src/greet.mjs": fault("greet-wrong.mjs") } : work(step),
      { mkdirs: true },
    );
    ({ result, dir } = await start(S01, producer));
  });

  it("a wrong candidate fails the real gate although the host's output would pass it, then the correction is accepted", () => {
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
    const gate = records<Invocation>(dir, "verifier-invocation").filter(
      (i) => i.binding === "repo.build-test" && i.stage === "acceptance",
    );
    assert.deepEqual(
      gate.map((i) => [i.attempt, i.results.map((r) => r.outcome)]),
      [
        [1, ["failed"]],
        [2, ["passed"]],
      ],
    );
    const [wrong, right] = gate;
    assert.ok(wrong && right);
    const failed = observed(dir, wrong);
    // It built the candidate's own source into an empty dist/ with the locked
    // dependency, and the candidate's tests failed on it.
    assert.deepEqual([failed.distBefore, failed.dependency, failed.build], [[], "1.0.0", 0]);
    assert.notEqual(failed.test, 0, stringify(failed));
    const passed = right.results[0];
    assert.ok(passed?.outcome === "passed");
    assert.deepEqual(passed.observations, {
      build: 0,
      test: 0,
      dependency: "1.0.0",
      distBefore: [],
    });
    const [decision] = records<{ decision: string; findings: { rule: string }[] }>(dir, "decision");
    assert.equal(decision?.decision, "correct");
    assert.deepEqual(decision.findings.map((f) => f.rule).sort(), [GATE, NAMED].sort());
  });

  it("prepares the dependencies once, contained, from the candidate's lockfile alone", () => {
    const preparations = records<PreparationRecord>(dir, "dependency-preparation");
    assert.equal(preparations.length, 1, "the unchanged lockfile reuses its preparation");
    const [prepared] = preparations;
    assert.ok(prepared);
    assert.equal(prepared.outcome, "prepared", stringify(prepared));
    assert.deepEqual(prepared.ran?.argv, DEPENDENCIES.command);
    assert.equal(prepared.ran.exit, 0);
    assert.equal(prepared.spec.network, "none");
    assert.deepEqual(
      [...treeEntries(dir, prepared.inputs.tree).keys()].sort(),
      [
        "package-lock.json",
        "package.json",
        "vendor/fixture-format/index.mjs",
        "vendor/fixture-format/package.json",
      ],
      "the preparation saw the manifests, lockfile and vendored package, no source",
    );
    for (const i of records<Invocation>(dir, "verifier-invocation")) {
      if (i.binding === "repo.build-test") assert.equal(i.dependencies?.key, prepared.key);
    }
  });

  it("seals no build output and leaves no container of the run behind", () => {
    const evaluations = records<{ candidate: { tree: string } }>(dir, "evaluation");
    for (const e of evaluations) {
      const paths = [...treeEntries(dir, e.candidate.tree).keys()];
      assert.ok(!paths.some((p) => p.startsWith("dist/") || p.startsWith("node_modules/")));
    }
    assert.ok("run" in result && result.run);
    assert.equal(containers(result.run), "");
  });
});

describe("T3.5 H1-04 contained: the exit evaluation applies the terminal targets", () => {
  it("the banner uses the prepared dependency and the real exit check completes the checkpoint", async () => {
    const { result, dir } = await start(S02, producerOf(undefined, { mkdirs: true }));
    assert.ok(result.outcome === "selection-accepted", stringify(result, null, 2));
    assert.deepEqual(result.checkpoint, {
      checkpoint: "CP96",
      complete: true,
      unaccepted: [],
      pending: [],
    });
    const banner = records<Invocation>(dir, "verifier-invocation").find(
      (i) => i.binding === "banner.prints" && i.stage === "acceptance",
    );
    assert.equal(banner?.results[0]?.outcome, "passed", stringify(banner));
    const exit = records<{ step: string; targets: string[] }>(dir, "acceptance").at(-1);
    assert.equal(exit?.step, EXIT);
  });

  it("a real exit check that finds a step missing leaves the checkpoint incomplete", async () => {
    const producer = producerOf(
      (step) =>
        step === S02
          ? { ...work(step), "changes/CHANGELOG.md": fault("CHANGELOG-S01-only.md") }
          : work(step),
      { mkdirs: true },
    );
    const { result, dir } = await start(S02, producer);
    assert.ok(result.outcome === "paused", stringify(result, null, 2));
    assert.deepEqual(result.accepted, [S01, S02]);
    assert.equal(result.step, EXIT);
    assert.equal(result.checkpoint?.complete, false);
    const check = records<Invocation>(dir, "verifier-invocation").find(
      (i) => i.binding === "checkpoint.exit-check" && i.stage === "acceptance",
    );
    const [outcome] = check?.results ?? [];
    assert.ok(outcome?.outcome === "failed", stringify(check));
    assert.match(outcome.reason, /does not name CP96-S02/u);
  });
});
