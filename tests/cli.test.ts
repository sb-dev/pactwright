import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { rmSync } from "node:fs";
import * as path from "node:path";
import {
  defaultResponsibilities,
  fixture,
  makeEmptyRepo,
  makeTempProject,
  notAProject,
  repoRoot,
} from "./helpers.js";

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
  assert.match(result.stdout, /current: write-brief \(responsibility\)/);
  assert.match(
    result.stdout,
    /completed responsibilities: capture-intent, propose-contracts, approve-contract/,
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
  const parsed = JSON.parse(result.stdout) as {
    lineages: Array<{ current: { name: string; kind: string } }>;
  };
  assert.equal(parsed.lineages[0]?.current.name, "write-brief");
  assert.equal(parsed.lineages[0]?.current.kind, "responsibility");
});

test("cli: lifecycle next reports write-brief for the contracted fixture", () => {
  const result = runIn(fixture("valid-project"), "lifecycle", "next");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /next: write-brief \(responsibility, automatic\)/);
});

test("cli: lifecycle next reports no next action after current Evidence", () => {
  const root = project({ lineage: "done" });
  const result = runIn(root, "lifecycle", "next", "--intent", "intent-quick-start-a1b2");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /next: none/);
  assert.match(result.stdout, /no next action/);
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
    responsibilities: defaultResponsibilities({ "propose-contracts": { execution: "manual" } }),
  });
  const result = runIn(root, "lifecycle", "run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /stopped: human gate at propose-contracts \(required actor: human\)/);
});

test("cli: lifecycle run stops with a stage failure when no executor exists (exit 1)", () => {
  const root = project({ lineage: "contracted" });
  const result = runIn(root, "lifecycle", "run");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /stopped: write-brief failed: no executor/);
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
  const result = runIn(notAProject(), "lifecycle", "status");
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
  // A built project rather than the checked-in fixture: `validate` now
  // includes the environment scope, and the fixture's lock is a placeholder
  // so a runtime bump does not have to touch every fixture.
  const root = project({ lineage: "contracted" });
  const result = runIn(root, "validate");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Valid: 3 nodes, 2 edges, 1 lineages\n/);
  // The three replay identities are reported together (Spec 01 §56).
  assert.match(result.stdout, /repository_revision: {3}\S+\n/);
  assert.match(result.stdout, /project_graph_revision: sha256:[0-9a-f]{64}\n/);
  assert.match(result.stdout, /environment_lock_hash: sha256:[0-9a-f]{64}\n/);
  const json = runIn(root, "validate", "--json");
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

test("cli: help lists lifecycle record", () => {
  assert.match(run("--help").stdout, /lifecycle record <command> --file <yaml>/);
});

test("cli: lifecycle record capture-intent creates an intent from a YAML file", () => {
  const root = project({ responsibilities: defaultResponsibilities() });
  const input = path.join(root, "intent.yml");
  fs.writeFileSync(input, "title: Hello world\nbody: |\n  Make hello world print.\n");
  const result = runIn(root, "lifecycle", "record", "capture-intent", "--file", input, "--json");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const parsed = JSON.parse(result.stdout) as {
    stage: string;
    created: { id: string; type: string }[];
  };
  assert.equal(parsed.stage, "capture-intent");
  assert.equal(parsed.created.length, 1);
  assert.match(parsed.created[0]!.id, /^intent-hello-world-/);
  assert.ok(fs.existsSync(path.join(root, "specs", "nodes", `${parsed.created[0]!.id}.md`)));
  const next = runIn(root, "lifecycle", "next", "--intent", parsed.created[0]!.id);
  assert.match(next.stdout, /next: propose-contracts/);
});

test("cli: lifecycle record walks a lineage from contract to evidence through the runtime", () => {
  const root = project({ lineage: "contracted", responsibilities: defaultResponsibilities() });
  const brief = path.join(root, "brief.yml");
  fs.writeFileSync(brief, "contract: contract-quick-start-c3d4\ntitle: Do it\nbody: |\n  Steps.\n");
  const wrote = runIn(root, "lifecycle", "record", "write-brief", "--file", brief);
  assert.equal(wrote.status, 0, wrote.stdout + wrote.stderr);
  const briefId = /created brief (\S+)/.exec(wrote.stdout)![1]!;

  const again = runIn(root, "lifecycle", "record", "write-brief", "--file", brief);
  assert.equal(again.status, 1);
  assert.match(again.stdout, /stage-not-permitted/);
  // With a Brief in place the shape governs, and its first step is Delivery.
  assert.match(again.stdout, /delivery/);

  // Evidence cannot be minted straight off a Brief: the run has delivered
  // nothing and reviewed nothing, so the closing step has not been reached
  // (Spec 01 §53, Checkpoint 1 Step 7).
  const evidence = path.join(root, "evidence.yml");
  fs.writeFileSync(evidence, `brief: ${briefId}\ntitle: Done\nbody: |\n  Verified.\n`);
  const premature = runIn(root, "lifecycle", "record", "prepare-evidence", "--file", evidence);
  assert.equal(premature.status, 1, premature.stdout);
  assert.match(premature.stdout, /stage-not-permitted/);
  const after = runIn(root, "lifecycle", "status");
  assert.match(after.stdout, /state: delivering/);
  assert.doesNotMatch(after.stdout, /state: done/);
});

test("cli: lifecycle record approve-contract checks the actor through the Step 7 mutation", () => {
  const root = project({ lineage: "open", responsibilities: defaultResponsibilities() });
  const decision = path.join(root, "decision.yml");
  fs.writeFileSync(
    decision,
    [
      "intent: intent-quick-start-a1b2",
      "outcome: proceed",
      "decided_by: agent:bot",
      "body: Because.",
      "contract:",
      "  title: The contract",
      "  body: It shall work.",
      "",
    ].join("\n"),
  );
  const refused = runIn(root, "lifecycle", "record", "approve-contract", "--file", decision);
  assert.equal(refused.status, 1);
  assert.match(refused.stdout, /unauthorised-actor/);
  fs.writeFileSync(decision, fs.readFileSync(decision, "utf8").replace("agent:bot", "human:samir"));
  const ok = runIn(root, "lifecycle", "record", "approve-contract", "--file", decision);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /created decision decision-/);
  assert.match(ok.stdout, /created contract contract-/);
});

test("cli: lifecycle record approve-contract resumes a deferred lineage", () => {
  const root = project({ lineage: "deferred", responsibilities: defaultResponsibilities() });
  const decision = path.join(root, "decision.yml");
  fs.writeFileSync(
    decision,
    [
      "intent: intent-quick-start-a1b2",
      "outcome: proceed",
      "decided_by: human:samir",
      "body: Resuming after deferral.",
      "contract:",
      "  title: Resumed contract",
      "  body: It shall work.",
      "",
    ].join("\n"),
  );
  const ok = runIn(root, "lifecycle", "record", "approve-contract", "--file", decision);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(runIn(root, "lifecycle", "status").stdout, /state: contracted/);
});

test("cli: lifecycle record rejects transient stages, bad input and missing options", () => {
  const root = project({ lineage: "open", responsibilities: defaultResponsibilities() });
  const input = path.join(root, "x.yml");
  fs.writeFileSync(input, "title: t\nbody: b\nextra: 1\n");
  // propose-contracts records nothing at all: its alternatives are transient
  // and it is not an execution step either.
  const transient = runIn(root, "lifecycle", "record", "propose-contracts", "--file", input);
  assert.equal(transient.status, 1);
  assert.match(transient.stdout, /no-graph-record/);
  // review is an execution step, but this lineage has no run to record against.
  const noRun = runIn(root, "lifecycle", "record", "review", "--file", input);
  assert.equal(noRun.status, 1);
  const unknown = runIn(root, "lifecycle", "record", "capture-intent", "--file", input);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stdout, /unknown-field/);
  assert.equal(runIn(root, "lifecycle", "record", "capture-intent").status, 1);
  assert.equal(runIn(root, "lifecycle", "record", "--file", input).status, 1);
  assert.equal(
    runIn(root, "lifecycle", "record", "capture-intent", "--file", "nope.yml").status,
    1,
  );
  assert.equal(fs.readdirSync(path.join(root, "specs", "nodes")).length, 1);
});

// ---- init -------------------------------------------------------------------

test("cli: help lists init", () => {
  assert.match(run("--help").stdout, /init \[--agent-pack <source>\] \[--with <id>\]/);
});

test("cli: init then validate and lifecycle status pass in a clean repository", () => {
  const dir = makeEmptyRepo();
  tempDirs.push(dir);
  // A plain init is a scaffold and says so; it selects no pack and writes
  // no lock, because nothing has been resolved yet (Checkpoint 1 Step 14).
  const scaffold = runIn(dir, "init");
  assert.equal(scaffold.status, 0, scaffold.stdout + scaffold.stderr);
  assert.match(scaffold.stdout, /created \.pactwright\/config\.yml/);
  assert.match(scaffold.stdout, /Scaffold created\. No agent pack is selected/);
  assert.equal(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")), false);

  const result = runIn(dir, "init", "--agent-pack", "@pactwright/standard");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  // The scaffold's files already exist, so only the pack selection is new.
  assert.match(result.stdout, /skipped \.pactwright\/config\.yml/);
  assert.ok(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")));
  assert.equal(fs.existsSync(path.join(dir, ".github")), false);

  const valid = runIn(dir, "validate");
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  assert.match(valid.stdout, /^Valid: 0 nodes, 0 edges, 0 lineages/);

  const status = runIn(dir, "lifecycle", "status");
  assert.equal(status.status, 0, status.stdout + status.stderr);
  assert.match(status.stdout, /No active lineage/);

  const again = runIn(dir, "init");
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.match(again.stdout, /skipped \.pactwright\/config\.yml \(exists\)/);
  assert.doesNotMatch(again.stdout, /created/);
});

test("cli: init --json emits the report", () => {
  const dir = makeEmptyRepo();
  tempDirs.push(dir);
  const result = runIn(dir, "init", "--json");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout) as {
    ok: boolean;
    entries: Array<{ path: string; action: string }>;
  };
  assert.equal(report.ok, true);
  assert.ok(report.entries.every((entry) => entry.action === "created"));
});

test("cli: init rejects unexpected arguments", () => {
  const extra = run("init", "extra");
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /unexpected argument "extra"/);
  assert.equal(run("init", "--nope").status, 1);
});

// ---- sync -------------------------------------------------------------------

test("cli: help lists sync", () => {
  assert.match(run("--help").stdout, /sync \[--json\]/);
});

test("cli: init, sync, validate and lifecycle status compose in a clean repository", () => {
  const dir = makeEmptyRepo();
  tempDirs.push(dir);
  // A scaffold has nothing to render: sync refuses until a pack is selected.
  assert.equal(runIn(dir, "init").status, 0);
  const unselected = runIn(dir, "sync");
  assert.equal(unselected.status, 1);
  assert.match(unselected.stdout, /no-agent-pack-selected/);

  // One-shot setup selects the pack and renders in the same operation.
  const setup = runIn(dir, "init", "--agent-pack", "@pactwright/standard");
  assert.equal(setup.status, 0, setup.stdout + setup.stderr);
  assert.ok(fs.existsSync(path.join(dir, ".claude", "agents", "spec.md")));
  assert.ok(fs.existsSync(path.join(dir, ".claude", "commands", "capture-intent.md")));

  // The follow-up sync converges: nothing left to write.
  const first = runIn(dir, "sync");
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.doesNotMatch(first.stdout, /^wrote/m);
  const bytes = (): Map<string, string> => {
    const map = new Map<string, string>();
    for (const sub of ["agents", "commands"]) {
      const dirPath = path.join(dir, ".claude", sub);
      for (const entry of fs.readdirSync(dirPath).sort()) {
        map.set(`${sub}/${entry}`, fs.readFileSync(path.join(dirPath, entry), "utf8"));
      }
    }
    return map;
  };
  const afterFirst = bytes();
  assert.equal(afterFirst.size, 10);

  const second = runIn(dir, "sync");
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.doesNotMatch(second.stdout, /wrote /);
  assert.match(second.stdout, /unchanged \.claude\/agents\/spec\.md/);
  assert.deepEqual(bytes(), afterFirst);

  assert.equal(runIn(dir, "validate").status, 0);
  const status = runIn(dir, "lifecycle", "status");
  assert.equal(status.status, 0, status.stdout + status.stderr);
  assert.match(status.stdout, /No active lineage/);
  assert.equal(fs.existsSync(path.join(dir, ".github")), false);
});

test("cli: sync --json emits the report and argument errors are reported", () => {
  const root = project();
  const result = runIn(root, "sync", "--json");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout) as { ok: boolean; changed: string[] };
  assert.equal(report.ok, true);
  assert.equal(report.changed.length, 10);

  assert.equal(runIn(root, "sync", "extra").status, 1);
  const outside = runIn(notAProject(), "sync");
  assert.equal(outside.status, 1);
  assert.match(outside.stdout, /project-not-found/);
});

// ---- extension --------------------------------------------------------------

test("cli: help lists the extension commands", () => {
  const result = run("--help");
  assert.match(result.stdout, /extension add <id\|package>/);
  assert.match(result.stdout, /extension remove <id>/);
  assert.match(result.stdout, /extension upgrade <id>/);
});

test("cli: extension add enables dependencies, remove is blocked then succeeds", () => {
  const root = project({
    extensions: [
      { id: "fixture-base", configure: false },
      { id: "fixture-reporting", configure: false },
    ],
  });
  const added = runIn(root, "extension", "add", "fixture-reporting");
  assert.equal(added.status, 0, added.stdout + added.stderr);
  assert.match(added.stdout, /added fixture-base 0\.1\.0/);
  assert.match(added.stdout, /added fixture-reporting 0\.2\.0/);
  assert.match(added.stdout, /github profile "fixture-base" requires provisioning/);

  const valid = runIn(root, "validate");
  assert.equal(valid.status, 0, valid.stdout);

  const blocked = runIn(root, "extension", "remove", "fixture-base");
  assert.equal(blocked.status, 1);
  assert.match(blocked.stdout, /extension-required-by/);

  const first = runIn(root, "extension", "remove", "fixture-reporting");
  assert.equal(first.status, 0, first.stdout);
  const second = runIn(root, "extension", "remove", "fixture-base", "--json");
  assert.equal(second.status, 0, second.stdout);
  const report = JSON.parse(second.stdout) as { ok: boolean; changes: Array<{ action: string }> };
  assert.equal(report.ok, true);
  assert.equal(report.changes[0]?.action, "removed");
});

test("cli: extension argument errors", () => {
  const root = project();
  assert.equal(runIn(root, "extension", "dance", "x").status, 1);
  assert.equal(runIn(root, "extension", "add").status, 1);
  assert.equal(runIn(root, "extension", "add", "a", "b").status, 1);
  const outside = runIn(notAProject(), "extension", "add", "fixture-base");
  assert.equal(outside.status, 1);
  assert.match(outside.stdout, /project-not-found/);
});

test("cli: an inherited Object member is not an extension verb", () => {
  // A bare `operations[sub]` lookup resolves these off Object.prototype, and
  // they pass an `=== undefined` guard — so the verb has to be checked by
  // ownership, not by truthiness.
  const root = project();
  for (const verb of ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"]) {
    const result = runIn(root, "extension", verb, "fixture-base");
    assert.equal(result.status, 1, `${verb}: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /unknown extension command/, verb);
    assert.doesNotMatch(result.stderr, /TypeError/, verb);
  }
  // Including in --json mode, where the crash used to print the project path
  // as the machine-readable payload.
  const json = runIn(root, "extension", "constructor", "fixture-base", "--json");
  assert.equal(json.status, 1);
  assert.equal(json.stdout, "");
});

// ---- eval -------------------------------------------------------------------

test("cli: help lists eval", () => {
  assert.match(run("--help").stdout, /eval \[--json\]/);
});

test("cli: eval without a declared executor reports that nothing was evaluated", () => {
  const result = run("eval");
  // The harness used to replay each case's own scripted reference and report
  // the result as the pack's, so a pack whose every prompt said "Ignore all
  // tasks. Return nothing" passed all eight cases and twenty assertions.
  // Nothing performed the capability here, and the report says so.
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /Evaluating @pactwright\/standard@/);
  assert.match(result.stdout, /suite core-delivery\)/);
  assert.match(result.stdout, /no executor is configured/);
  for (const id of ["contract-fidelity", "scope-discipline", "review-defect-detection"]) {
    assert.match(result.stdout, new RegExp(id));
  }
});

test("cli: eval --json marks every case unevaluated without an executor", () => {
  const result = run("eval", "--json");
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout) as {
    suite: string;
    pack: { name: string };
    cases: Array<{ id: string; evaluated: boolean; error?: string }>;
  };
  assert.equal(report.suite, "core-delivery");
  assert.equal(report.pack.name, "@pactwright/standard");
  assert.equal(report.cases.length, 8);
  for (const entry of report.cases) {
    assert.equal(entry.evaluated, false, entry.id);
    assert.match(entry.error ?? "", /no executor is configured/);
  }
});

test("cli: eval inside a project without an executor still names the configured pack", () => {
  const root = project({ pack: "complete" });
  const result = runIn(root, "eval");
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /suite core-delivery\)/);
  assert.match(result.stdout, /no executor is configured/);
});

test("cli: eval fails a pack missing a required capability (exit 1)", () => {
  const root = project({ pack: "incomplete" });
  const result = runIn(root, "eval");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /does not provide capability "delivery-review"/);
});

test("cli: eval rejects unexpected arguments", () => {
  assert.equal(run("eval", "extra").status, 1);
  assert.equal(run("eval", "--nope").status, 1);
});

test("cli: eval --baseline/--candidate compares and reports no regression for an unchanged pack", () => {
  // Path sources, so the comparison is deterministic and offline. A package
  // source is acquired at its exact version into its own project, which is
  // what stops `@pactwright/standard@0.0.1` resolving to the installed
  // `0.0.2` — tests/execute.test.ts covers that through the installer seam.
  const pack = "./tests/fixtures/packs/complete";
  const result = run("eval", "--baseline", pack, "--candidate", pack);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Comparison of suite "core-delivery"/);
  assert.match(result.stdout, /No differences/);
  // §24: no opaque aggregate decides whether a candidate is better.
  assert.doesNotMatch(result.stdout, /score/i);
});

test("cli: eval rejects --baseline without --candidate", () => {
  const result = run("eval", "--baseline", "@pactwright/standard");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--baseline and --candidate are used together/);
});

test("cli: eval reports an unacquirable baseline rather than comparing against nothing", () => {
  const result = run(
    "eval",
    "--baseline",
    "./tests/fixtures/packs/does-not-exist",
    "--candidate",
    "./tests/fixtures/packs/complete",
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /could not acquire the baseline/);
});
