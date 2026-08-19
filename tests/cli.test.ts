import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { rmSync } from "node:fs";
import * as path from "node:path";
import { defaultStages, fixture, makeTempProject, repoRoot } from "./helpers.js";

const cli = path.join(repoRoot, "dist", "cli.js");
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
  version: string;
};

before(() => {
  // The CLI under test is the built distribution — the same file `bin.pactwright`
  // and the `pactwright` package script point at.
  const build = spawnSync(
    process.execPath,
    [path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  assert.equal(build.status, 0, build.stdout + build.stderr);
});

function run(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: repoRoot, encoding: "utf8" });
}

test("cli: --version prints the package version", () => {
  const result = run("--version");
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), manifest.version);
});

test("cli: --help exits 0 and prints usage", () => {
  const result = run("--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: pactwright/);
});

test("cli: no arguments prints usage and exits 1", () => {
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Usage: pactwright/);
});

test("cli: unknown command exits 1 with an error", () => {
  const result = run("frobnicate");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown command "frobnicate"/);
});

test("cli: built entry point has a shebang and is executable", () => {
  const first = fs.readFileSync(cli, "utf8").split("\n")[0];
  assert.equal(first, "#!/usr/bin/env node");
});

// ---- lifecycle commands -----------------------------------------------------

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function runIn(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

function project(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  tempDirs.push(dir);
  return dir;
}

test("cli: help lists the lifecycle commands", () => {
  const result = run("--help");
  assert.match(result.stdout, /lifecycle status/);
  assert.match(result.stdout, /lifecycle next/);
  assert.match(result.stdout, /lifecycle run/);
});

test("cli: lifecycle status reports the contracted fixture", () => {
  const result = runIn(fixture("valid-project"), "lifecycle", "status");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Intent: intent-hello-world-a1b2/);
  assert.match(result.stdout, /state: contracted/);
  assert.match(result.stdout, /current stage: write-brief/);
  assert.match(
    result.stdout,
    /completed stages: capture-intent, propose-contracts, approve-contract/,
  );
  assert.match(
    result.stdout,
    /current lineage: intent-hello-world-a1b2 → decision-hello-world-c3d4 → contract-hello-world-d4e5/,
  );
  assert.match(result.stdout, /Validation problems: none/);
});

test("cli: lifecycle status --json emits the structure", () => {
  const result = runIn(fixture("valid-project"), "lifecycle", "status", "--json");
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout) as { lineages: Array<{ currentStage: string }> };
  assert.equal(parsed.lineages[0]?.currentStage, "write-brief");
});

test("cli: lifecycle next reports write-brief for the contracted fixture", () => {
  const result = runIn(fixture("valid-project"), "lifecycle", "next");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /next stage: write-brief \(automatic\)/);
});

test("cli: lifecycle next reports no next stage after current Evidence", () => {
  const root = project({ lineage: "done" });
  const result = runIn(root, "lifecycle", "next", "--intent", "intent-quick-start-a1b2");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /next stage: none/);
  assert.match(result.stdout, /no next stage/);
});

test("cli: lifecycle status/next print validation problems and exit 1", () => {
  const result = runIn(fixture("invalid-lineage-ambiguous"), "lifecycle", "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Validation problems:/);
  assert.match(result.stdout, /ambiguous-decision/);
  const next = runIn(fixture("invalid-lineage-ambiguous"), "lifecycle", "next", "--json");
  assert.equal(next.status, 1);
  assert.ok((JSON.parse(next.stdout) as { problems: unknown[] }).problems.length > 0);
});

test("cli: lifecycle run stops at a manual gate (exit 0)", () => {
  const root = project({
    lineage: "open",
    stages: defaultStages({ "propose-contracts": { execution: "manual" } }),
  });
  const result = runIn(root, "lifecycle", "run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /stopped: human gate at propose-contracts \(required actor: human\)/);
});

test("cli: lifecycle run stops with a stage failure when no executor exists (exit 1)", () => {
  const root = project({ lineage: "contracted" });
  const result = runIn(root, "lifecycle", "run");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /stopped: stage write-brief failed: no executor/);
});

test("cli: lifecycle run stops on a validation error (exit 1)", () => {
  const result = runIn(fixture("invalid-lineage-ambiguous"), "lifecycle", "run", "--json");
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout) as Array<{ stop: string }>;
  assert.equal(parsed[0]?.stop, "validation-error");
});

test("cli: lifecycle rejects unknown subcommands and options", () => {
  assert.equal(runIn(fixture("valid-project"), "lifecycle", "dance").status, 1);
  assert.equal(runIn(fixture("valid-project"), "lifecycle", "status", "--nope").status, 1);
  assert.equal(runIn(fixture("valid-project"), "lifecycle", "status", "--intent").status, 1);
});

test("cli: outside a project the lifecycle commands fail cleanly", () => {
  const result = runIn(fixture("not-a-project/sub"), "lifecycle", "status");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /project-not-found/);
});

// ---- validate / context -----------------------------------------------------

test("cli: help lists validate and context", () => {
  const result = run("--help");
  assert.match(result.stdout, /validate \[--json\]/);
  assert.match(result.stdout, /context <node-id> \[--history\]/);
});

test("cli: validate reports a valid project (exit 0)", () => {
  const result = runIn(fixture("valid-project"), "validate");
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /^Valid: 3 nodes, 2 edges, 1 lineages \(revision sha256:[0-9a-f]{64}\)\n$/,
  );
  const json = runIn(fixture("valid-project"), "validate", "--json");
  assert.equal(json.status, 0);
  assert.equal((JSON.parse(json.stdout) as { ok: boolean }).ok, true);
});

test("cli: validate reports problems (exit 1)", () => {
  const result = runIn(fixture("invalid-lineage-ambiguous"), "validate");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Validation problems:/);
  assert.match(result.stdout, /ambiguous-decision/);
  assert.equal(runIn(fixture("valid-project"), "validate", "extra").status, 1);
});

test("cli: context prints the current core lineage only", () => {
  const result = runIn(fixture("valid-project"), "context", "intent-hello-world-a1b2");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^# Delivery context for intent-hello-world-a1b2/);
  assert.match(result.stdout, /state: contracted/);
  assert.match(result.stdout, /## intent intent-hello-world-a1b2/);
  assert.match(result.stdout, /## decision decision-hello-world-c3d4/);
  assert.match(result.stdout, /decided_by: /);
  assert.match(result.stdout, /## contract contract-hello-world-d4e5/);
  assert.doesNotMatch(result.stdout, /## brief/);
  assert.doesNotMatch(result.stdout, /History/);
});

test("cli: context excludes superseded records unless --history is given", () => {
  const root = project({ lineage: "superseded-chain" });
  const plain = runIn(root, "context", "contract-quick-start-2222");
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(plain.stdout, /note: contract-quick-start-2222 is superseded/);
  assert.match(plain.stdout, /## contract contract-quick-start-9999/);
  assert.doesNotMatch(plain.stdout, /## contract contract-quick-start-2222/);
  assert.doesNotMatch(plain.stdout, /decision-quick-start-0000/);

  const history = runIn(root, "context", "contract-quick-start-2222", "--history");
  assert.equal(history.status, 0, history.stderr);
  assert.match(history.stdout, /# History \(superseded records\)/);
  assert.match(
    history.stdout,
    /## contract contract-quick-start-2222\n[\s\S]*superseded by: contract-quick-start-3333/,
  );
  const json = runIn(root, "context", "evidence-quick-start-6666", "--history", "--json");
  const parsed = JSON.parse(json.stdout) as { requestedIsCurrent: boolean; history: unknown[] };
  assert.equal(parsed.requestedIsCurrent, false);
  assert.equal(parsed.history.length, 6);
});

test("cli: context argument and option errors", () => {
  assert.equal(runIn(fixture("valid-project"), "context").status, 1);
  assert.equal(runIn(fixture("valid-project"), "context", "a", "b").status, 1);
  assert.equal(
    runIn(fixture("valid-project"), "context", "intent-hello-world-a1b2", "--intent", "x").status,
    1,
  );
  const unknown = runIn(fixture("valid-project"), "context", "intent-nope-0000");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stdout, /unknown-node/);
  const broken = runIn(fixture("invalid-lineage-ambiguous"), "context", "intent-quick-start-a1b2");
  assert.equal(broken.status, 1);
  assert.match(broken.stdout, /Validation problems:/);
});
