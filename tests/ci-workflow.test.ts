import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { readYamlFile } from "../src/yaml.js";
import { repoRoot } from "./helpers.js";

/**
 * The repository verification workflow is engineering infrastructure, not a
 * Pactwright-generated surface: these assertions hold the Implementation
 * Guide's Engineering baseline (GitHub Actions) rules in place so a later edit
 * cannot quietly drop a SHA pin, widen the token or rename the required check.
 */

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

interface Job {
  name?: string;
  "timeout-minutes"?: number;
  strategy?: { matrix?: { "node-version"?: string[] } };
  steps?: Step[];
}

interface Workflow {
  name: string;
  on: Record<string, { branches?: string[] } | null>;
  permissions: Record<string, string>;
  concurrency: { group: string; "cancel-in-progress": string | boolean };
  jobs: Record<string, Job>;
}

const workflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");
const read = readYamlFile(workflowPath);
assert.deepEqual(read.problems, []);
const workflow = read.value as Workflow;
const jobs = Object.values(workflow.jobs);
const steps = jobs.flatMap((job) => job.steps ?? []);

const engines = (
  JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    engines: { node: string };
  }
).engines.node;

test("ci workflow: the required check is `CI / Verify`", () => {
  assert.equal(workflow.name, "CI");
  assert.ok(
    jobs.some((job) => job.name === "Verify"),
    "a job named `Verify` exists",
  );
});

test("ci workflow: runs on pull requests and default-branch pushes only", () => {
  assert.deepEqual(Object.keys(workflow.on).sort(), ["pull_request", "push"]);
  assert.deepEqual(workflow.on["push"]?.branches, ["main"]);
  assert.equal(workflow.on["pull_request_target"], undefined);
});

test("ci workflow: grants only `contents: read`", () => {
  assert.deepEqual(workflow.permissions, { contents: "read" });
});

test("ci workflow: cancels superseded pull-request runs", () => {
  assert.match(workflow.concurrency.group, /github\.workflow.*github\.ref/);
  assert.match(String(workflow.concurrency["cancel-in-progress"]), /pull_request/);
});

test("ci workflow: every job sets a bounded timeout", () => {
  for (const [id, job] of Object.entries(workflow.jobs)) {
    assert.equal(typeof job["timeout-minutes"], "number", `job ${id} sets timeout-minutes`);
  }
});

test("ci workflow: pins every action to a full commit SHA", () => {
  const uses = steps.flatMap((step) => (step.uses === undefined ? [] : [step.uses]));
  assert.ok(uses.length > 0, "the workflow uses actions");
  for (const ref of uses) {
    assert.match(ref, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, `${ref} is pinned to a commit SHA`);
  }
});

test("ci workflow: checks out without persisting credentials", () => {
  const checkouts = steps.filter((step) => step.uses?.startsWith("actions/checkout@") === true);
  assert.equal(checkouts.length, 1);
  assert.equal(checkouts[0]?.with?.["persist-credentials"], false);
});

test("ci workflow: verifies exactly the Node versions the package supports", () => {
  const versions = jobs.flatMap((job) => job.strategy?.matrix?.["node-version"] ?? []);
  assert.ok(versions.length > 0, "a Node version matrix exists");

  // Expand engines.node into every admitted major. Only single-major
  // `>=A <A+1` clauses are recognised, so a wider range shape fails here and
  // forces this coupling to be revisited instead of passing silently.
  const admitted = engines.split("||").map((clause) => {
    const bounds = /^>=(\d+) <(\d+)$/.exec(clause.trim());
    assert.ok(bounds, `engines.node clause "${clause.trim()}" is a single-major >=A <A+1 range`);
    const major = Number(bounds[1]);
    assert.equal(Number(bounds[2]), major + 1, `clause "${clause.trim()}" admits one major`);
    return String(major);
  });

  // Exact equality both ways: every claimed major is exercised (no untested
  // compatibility claim) and every matrix version is claimed.
  assert.deepEqual([...versions].sort(), [...admitted].sort());
});

test("ci workflow: installs from the lockfile and runs the one verification gate", () => {
  const runs = steps.flatMap((step) => (step.run === undefined ? [] : [step.run]));
  assert.ok(runs.includes("corepack enable"), "uses the repository-pinned pnpm through Corepack");
  assert.ok(runs.includes("pnpm install --frozen-lockfile"), "installs from the lockfile");
  assert.ok(runs.includes("pnpm verify"), "runs pnpm verify");
  assert.ok(
    !steps.some((step) => step.uses?.startsWith("pnpm/action-setup") === true),
    "no third-party pnpm action",
  );
});
