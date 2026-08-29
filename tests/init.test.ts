import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { initProject, initTemplates } from "../src/init.js";
import { loadConfig } from "../src/config/config.js";
import { loadLock } from "../src/config/lock.js";
import { lockEntriesFor, resolvePack } from "../src/pack/resolve.js";
import { syncProject } from "../src/sync.js";
import { runtimeVersion } from "../src/version.js";
import { validateProject } from "../src/validate.js";
import { fixture, makeEmptyRepo } from "./helpers.js";

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function emptyRepo(): string {
  const dir = makeEmptyRepo();
  tempDirs.push(dir);
  return dir;
}

const OWNED_PATHS = [
  ".pactwright/config.yml",
  ".pactwright/lifecycle.yml",
  "specs/nodes/.gitkeep",
  "specs/graph/edges.yml",
  ".claude/agents",
  ".claude/commands",
  ".pactwright/lock.yml",
];

function read(dir: string, relPath: string): string {
  return fs.readFileSync(path.join(dir, relPath), "utf8");
}

test("init: creates exactly the owned core structure in a clean repository", () => {
  const dir = emptyRepo();
  const report = initProject(dir);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(report.problems, []);
  assert.deepEqual(
    report.entries.map((entry) => entry.path),
    OWNED_PATHS,
  );
  assert.ok(report.entries.every((entry) => entry.action === "created"));

  const fixtureDir = path.join(fixture("valid-project"), ".pactwright");
  assert.equal(
    read(dir, ".pactwright/config.yml"),
    fs.readFileSync(path.join(fixtureDir, "config.yml"), "utf8"),
  );
  assert.equal(
    read(dir, ".pactwright/lifecycle.yml"),
    fs.readFileSync(path.join(fixtureDir, "lifecycle.yml"), "utf8"),
  );
  assert.equal(read(dir, "specs/graph/edges.yml"), "edges: []\n");
  assert.equal(read(dir, "specs/nodes/.gitkeep"), "");
  assert.deepEqual(fs.readdirSync(path.join(dir, ".claude", "agents")), []);
  assert.deepEqual(fs.readdirSync(path.join(dir, ".claude", "commands")), []);
  assert.equal(fs.existsSync(path.join(dir, ".github")), false);
});

test("init: resolves the lock exactly as pack resolution does", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir).ok, true);
  const lock = loadLock(path.join(dir, ".pactwright", "lock.yml"));
  assert.deepEqual(lock.problems, []);
  assert.equal(lock.value!.agentPack.name, "@pactwright/standard");
  assert.equal(lock.value!.runtime.version, runtimeVersion());

  const config = loadConfig(path.join(dir, ".pactwright", "config.yml"));
  const resolved = resolvePack({ root: dir, config: config.value! });
  assert.ok(resolved.value, resolved.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(lock.value, lockEntriesFor(resolved.value));
});

test("init: is idempotent — a second run skips everything and changes no bytes", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir).ok, true);
  const before = new Map(
    OWNED_PATHS.filter((p) => p.endsWith(".yml") || p.endsWith(".gitkeep")).map((p) => [
      p,
      read(dir, p),
    ]),
  );
  const again = initProject(dir);
  assert.equal(again.ok, true);
  assert.deepEqual(
    again.entries.map((entry) => entry.action),
    OWNED_PATHS.map(() => "skipped"),
  );
  for (const [relPath, content] of before) assert.equal(read(dir, relPath), content);
});

test("init: preserves a pre-existing config and resolves the lock from it", () => {
  const dir = emptyRepo();
  const custom = `${initTemplates().get(".pactwright/config.yml")!}# user comment\n`;
  fs.mkdirSync(path.join(dir, ".pactwright"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".pactwright", "config.yml"), custom);

  const report = initProject(dir);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  const byPath = new Map(report.entries.map((entry) => [entry.path, entry.action]));
  assert.equal(byPath.get(".pactwright/config.yml"), "skipped");
  assert.equal(byPath.get(".pactwright/lock.yml"), "created");
  assert.equal(read(dir, ".pactwright/config.yml"), custom);
});

test("init: never touches a pre-existing lock", () => {
  const dir = emptyRepo();
  const sentinel = "runtime:\n  version: 9.9.9\n";
  fs.mkdirSync(path.join(dir, ".pactwright"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".pactwright", "lock.yml"), sentinel);

  const report = initProject(dir);
  const byPath = new Map(report.entries.map((entry) => [entry.path, entry.action]));
  assert.equal(byPath.get(".pactwright/lock.yml"), "skipped");
  assert.equal(read(dir, ".pactwright/lock.yml"), sentinel);
  // The sentinel is not a valid lock, so the final validation reports it.
  assert.equal(report.ok, false);
  assert.ok(report.problems.length > 0);
});

test("init: reports a corrupt pre-existing config and writes no lock", () => {
  const dir = emptyRepo();
  fs.mkdirSync(path.join(dir, ".pactwright"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".pactwright", "config.yml"), "version: []\n");

  const report = initProject(dir);
  assert.equal(report.ok, false);
  assert.ok(report.problems.length > 0);
  assert.equal(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")), false);
  assert.equal(read(dir, ".pactwright/config.yml"), "version: []\n");
});

test("init: leaves user-authored files untouched in a populated repository", () => {
  const dir = emptyRepo();
  const userFiles = new Map([
    [".claude/agents/custom.md", "my agent\n"],
    [".claude/commands/deploy.md", "my command\n"],
    [".github/workflows/verify.yml", "name: verify\n"],
    ["README.md", "# my project\n"],
  ]);
  for (const [relPath, content] of userFiles) {
    fs.mkdirSync(path.dirname(path.join(dir, relPath)), { recursive: true });
    fs.writeFileSync(path.join(dir, relPath), content);
  }

  const report = initProject(dir);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  const byPath = new Map(report.entries.map((entry) => [entry.path, entry.action]));
  assert.equal(byPath.get(".claude/agents"), "skipped");
  assert.equal(byPath.get(".claude/commands"), "skipped");
  for (const [relPath, content] of userFiles) assert.equal(read(dir, relPath), content);

  // The documented flow is `init` then `sync`. What init promises to leave
  // alone, sync must also leave alone — otherwise the two disagree.
  const synced = syncProject(dir);
  assert.equal(synced.ok, true, synced.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(synced.removed, []);
  assert.deepEqual(synced.kept, [".claude/agents/custom.md", ".claude/commands/deploy.md"]);
  for (const [relPath, content] of userFiles) assert.equal(read(dir, relPath), content);
});

test("init: the resulting project validates with an empty graph", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir).ok, true);
  const report = validateProject({ root: dir });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(report.summary!.nodes, 0);
  assert.equal(report.summary!.edges, 0);
  assert.equal(report.summary!.lineages, 0);
});
