import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { readYamlFile } from "../src/yaml.js";
import { repoRoot } from "./helpers.js";

/**
 * The trusted release workflow is repository-owned release infrastructure
 * (Implementation Guide — npm release model): a `v*` tag must be sufficient to
 * verify and publish the tagged source through OIDC, with no stored npm token,
 * no write-capable checkout credential and no path around `pnpm verify`.
 * These assertions keep those properties from regressing.
 */

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
}

interface Job {
  name?: string;
  "runs-on"?: string;
  environment?: string;
  "timeout-minutes"?: number;
  steps?: Step[];
}

interface Workflow {
  name: string;
  on: Record<string, { tags?: string[] }>;
  permissions: Record<string, string>;
  concurrency: { group: string; "cancel-in-progress": string | boolean };
  jobs: Record<string, Job>;
}

const workflowPath = path.join(repoRoot, ".github", "workflows", "release.yml");
const text = fs.readFileSync(workflowPath, "utf8");
const read = readYamlFile(workflowPath);
assert.deepEqual(read.problems, []);
const workflow = read.value as Workflow;
const jobs = Object.values(workflow.jobs);
const steps = jobs.flatMap((job) => job.steps ?? []);
const runs = steps.map((step) => step.run ?? "");

test("release workflow: triggers only on v* tags", () => {
  assert.deepEqual(Object.keys(workflow.on), ["push"]);
  assert.deepEqual(workflow.on["push"], { tags: ["v*"] });
});

test("release workflow: grants only contents:read and id-token:write", () => {
  assert.deepEqual(workflow.permissions, { contents: "read", "id-token": "write" });
});

test("release workflow: one GitHub-hosted job in the npm-release environment", () => {
  assert.equal(jobs.length, 1);
  const job = jobs[0]!;
  assert.equal(job["runs-on"], "ubuntu-latest");
  assert.equal(job.environment, "npm-release");
  assert.equal(typeof job["timeout-minutes"], "number", "sets a bounded timeout");
});

test("release workflow: release concurrency never cancels an in-progress run", () => {
  assert.ok(workflow.concurrency.group.length > 0);
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
});

test("release workflow: pins every action to a full commit SHA", () => {
  const uses = steps.flatMap((step) => (step.uses === undefined ? [] : [step.uses]));
  assert.ok(uses.length > 0, "the workflow uses actions");
  for (const ref of uses) {
    assert.match(ref, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, `${ref} is pinned to a commit SHA`);
  }
});

test("release workflow: checkout keeps no credential and fetches full history", () => {
  const checkouts = steps.filter((step) => step.uses?.startsWith("actions/checkout@") === true);
  assert.equal(checkouts.length, 1);
  assert.equal(checkouts[0]?.with?.["persist-credentials"], false);
  assert.equal(checkouts[0]?.with?.["fetch-depth"], 0, "ancestry assertion needs full history");
});

test("release workflow: uses no dependency caching", () => {
  assert.ok(
    !steps.some((step) => step.uses?.startsWith("actions/cache") === true),
    "no cache action",
  );
  for (const step of steps) {
    assert.equal(step.with?.["cache"], undefined, "no setup cache input");
  }
});

test("release workflow: installs the pinned toolchain from the lockfile and runs verify", () => {
  assert.ok(runs.includes("corepack enable"), "uses the repository-pinned pnpm through Corepack");
  assert.ok(runs.includes("pnpm install --frozen-lockfile"), "installs from the lockfile");
  assert.ok(runs.includes("pnpm verify"), "runs pnpm verify");
});

test("release workflow: asserts tag/version/default-branch before any git-check bypass", () => {
  const versionAssert = runs.findIndex((run) => run.includes("pkg.version !== expected"));
  const ancestryAssert = runs.findIndex((run) =>
    run.includes('git merge-base --is-ancestor "$GITHUB_SHA" origin/main'),
  );
  const firstBypass = runs.findIndex((run) => run.includes("--no-git-checks"));
  assert.ok(versionAssert >= 0, "the tag-version assertion exists");
  assert.ok(ancestryAssert >= 0, "the default-branch ancestry assertion exists");
  assert.ok(firstBypass >= 0, "publishing disables git checks for the detached tag checkout");
  assert.ok(versionAssert < firstBypass, "version assertion precedes any git-check bypass");
  assert.ok(ancestryAssert < firstBypass, "ancestry assertion precedes any git-check bypass");
});

test("release workflow: dry-runs, then publishes recursively with access and provenance", () => {
  const dryRun = runs.findIndex((run) => run.startsWith("pnpm publish -r --dry-run"));
  const publish = runs.findIndex((run) => /^pnpm publish -r (?!--dry-run)/.test(run));
  assert.ok(dryRun >= 0, "a recursive publish dry-run exists");
  assert.ok(publish >= 0, "a recursive publish exists");
  assert.ok(dryRun < publish, "the dry-run precedes the first registry write");
  for (const index of [dryRun, publish]) {
    const step = steps[index]!;
    assert.match(runs[index]!, /--access public/);
    assert.equal(step.env?.["NPM_CONFIG_PROVENANCE"], "true", "publishes with provenance");
  }
});

test("release workflow: maps 0.0.x to next and everything later to latest", () => {
  const selector = runs.find((run) => run.includes("GITHUB_OUTPUT"));
  assert.ok(selector !== undefined, "a dist-tag selection step exists");
  assert.match(selector, /0\.0\.\*\)\s+echo "tag=next"/);
  assert.match(selector, /\*\)\s+echo "tag=latest"/);
});

test("release workflow: verifies each published package resolves from the registry", () => {
  const verify = runs.findIndex((run) => run.includes("npm view"));
  const publish = runs.findIndex((run) => /^pnpm publish -r (?!--dry-run)/.test(run));
  assert.ok(verify > publish, "registry verification follows the publish");
  assert.match(runs[verify]!, /test "\$resolved" = "\$VERSION"/, "a missing version fails the run");
});

test("release workflow: stores no npm token", () => {
  for (const marker of ["NODE_AUTH_TOKEN", "NPM_TOKEN", "_authToken", "secrets."]) {
    assert.ok(!text.includes(marker), `${marker} does not appear in the workflow`);
  }
});
