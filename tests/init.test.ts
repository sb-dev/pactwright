import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { initProject, initTemplates } from "../src/init.js";
import { loadConfig } from "../src/config/config.js";
import { loadLock } from "../src/config/lock.js";
import { lockEntriesFor, resolvePack } from "../src/pack/resolve.js";
import { useAgentPack } from "../src/pack/select.js";
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

/** A scaffold has no lock: nothing is resolved until a pack is chosen. */
const SCAFFOLD_PATHS = [
  ".pactwright/config.yml",
  ".pactwright/lifecycle.yml",
  "specs/nodes/.gitkeep",
  "specs/graph/edges.yml",
  ".claude/agents",
  ".claude/commands",
];

const STANDARD = "@pactwright/standard";

function read(dir: string, relPath: string): string {
  return fs.readFileSync(path.join(dir, relPath), "utf8");
}

/* ---- plain init: a scaffold, not an activated environment (Step 14) ---- */

test("init: creates exactly the owned core structure in a clean repository", () => {
  const dir = emptyRepo();
  const report = initProject(dir);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(report.problems, []);
  assert.deepEqual(
    report.entries.map((entry) => entry.path),
    SCAFFOLD_PATHS,
  );
  assert.ok(report.entries.every((entry) => entry.action === "created"));

  const fixtureDir = path.join(fixture("valid-project"), ".pactwright");
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

test("init: selects no agent pack and says so, rather than choosing one", () => {
  const dir = emptyRepo();
  const report = initProject(dir);
  assert.equal(report.scaffold, true);
  // Nothing is resolved, so there is no lock to resolve it into.
  assert.equal(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")), false);
  const config = loadConfig(path.join(dir, ".pactwright", "config.yml"));
  assert.deepEqual(config.problems, []);
  assert.equal(config.value?.agentPack, undefined, "init must not select a pack");
  assert.doesNotMatch(read(dir, ".pactwright/config.yml"), /^agent_pack:/m);
});

test("init: is idempotent — a second run skips everything and changes no bytes", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir).ok, true);
  const before = new Map(
    SCAFFOLD_PATHS.filter((p) => p.endsWith(".yml") || p.endsWith(".gitkeep")).map((p) => [
      p,
      read(dir, p),
    ]),
  );
  const again = initProject(dir);
  assert.equal(again.ok, true);
  assert.deepEqual(
    again.entries.map((entry) => entry.action),
    SCAFFOLD_PATHS.map(() => "skipped"),
  );
  for (const [relPath, content] of before) assert.equal(read(dir, relPath), content);
});

test("init: preserves a pre-existing config", () => {
  const dir = emptyRepo();
  const custom = `${initTemplates().get(".pactwright/config.yml")!}# user comment\n`;
  fs.mkdirSync(path.join(dir, ".pactwright"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".pactwright", "config.yml"), custom);

  const report = initProject(dir);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  const byPath = new Map(report.entries.map((entry) => [entry.path, entry.action]));
  assert.equal(byPath.get(".pactwright/config.yml"), "skipped");
  assert.equal(read(dir, ".pactwright/config.yml"), custom);
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

  const report = initProject(dir, { agentPack: STANDARD });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  const byPath = new Map(report.entries.map((entry) => [entry.path, entry.action]));
  assert.equal(byPath.get(".claude/agents"), "skipped");
  assert.equal(byPath.get(".claude/commands"), "skipped");
  for (const [relPath, content] of userFiles) assert.equal(read(dir, relPath), content);

  const synced = syncProject(dir);
  assert.equal(synced.ok, true, synced.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(synced.removed, []);
  assert.deepEqual(synced.kept, [".claude/agents/custom.md", ".claude/commands/deploy.md"]);
  for (const [relPath, content] of userFiles) assert.equal(read(dir, relPath), content);
});

test("init: the resulting scaffold validates with an empty graph", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir).ok, true);
  assert.equal(useAgentPack(dir, STANDARD).ok, true);
  const report = validateProject({ root: dir });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(report.summary!.nodes, 0);
  assert.equal(report.summary!.edges, 0);
  assert.equal(report.summary!.lineages, 0);
});

/* ---- one-shot init: the same operations as explicit setup (Steps 14, 16) ---- */

test("init: one-shot setup with an explicit pack resolves, locks and syncs", () => {
  const dir = emptyRepo();
  const report = initProject(dir, { agentPack: STANDARD });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(report.scaffold, undefined, "this is an activated environment, not a scaffold");
  const lock = loadLock(path.join(dir, ".pactwright", "lock.yml"));
  assert.deepEqual(lock.problems, []);
  assert.equal(lock.value!.agentPack.name, STANDARD);
  assert.equal(lock.value!.runtime.version, runtimeVersion());
  assert.ok(fs.existsSync(path.join(dir, ".claude", "agents", "spec.md")));

  const config = loadConfig(path.join(dir, ".pactwright", "config.yml"));
  const resolved = resolvePack({ root: dir, config: config.value! });
  assert.ok(resolved.value, resolved.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(lock.value, lockEntriesFor(resolved.value));
});

test("init: one-shot and explicit setup produce equivalent state, not just equal exit codes", () => {
  const oneShot = emptyRepo();
  assert.equal(initProject(oneShot, { agentPack: `${STANDARD}@${runtimeVersion()}` }).ok, true);

  const explicit = emptyRepo();
  assert.equal(initProject(explicit).ok, true);
  assert.equal(useAgentPack(explicit, `${STANDARD}@${runtimeVersion()}`).ok, true);
  assert.equal(syncProject(explicit).ok, true);

  for (const relPath of [".pactwright/config.yml", ".pactwright/lock.yml"]) {
    assert.equal(read(oneShot, relPath), read(explicit, relPath), relPath);
  }
  const listing = (dir: string): string[] =>
    fs
      .readdirSync(path.join(dir, ".claude"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.join(path.relative(path.join(dir, ".claude"), entry.parentPath), entry.name),
      )
      .sort();
  assert.deepEqual(listing(oneShot), listing(explicit));
  for (const file of listing(oneShot)) {
    assert.equal(
      read(oneShot, path.join(".claude", file)),
      read(explicit, path.join(".claude", file)),
      file,
    );
  }
});

test("init: composing without an explicit pack is refused, never defaulted", () => {
  const dir = emptyRepo();
  const report = initProject(dir, { withExtensions: ["fixture-base"] });
  assert.equal(report.ok, false);
  assert.deepEqual(
    report.problems.map((p) => p.code),
    ["no-agent-pack-selected"],
  );
  // No extension was activated and no pack was chosen behind the user's back.
  assert.equal(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")), false);
  const config = loadConfig(path.join(dir, ".pactwright", "config.yml"));
  assert.equal(config.value?.agentPack, undefined);
  assert.deepEqual(config.value?.extensions, {});
});

test("init: an incompatible pack choice activates nothing", () => {
  const dir = emptyRepo();
  const report = initProject(dir, { agentPack: `${STANDARD}@9.9.9` });
  assert.equal(report.ok, false);
  assert.ok(report.problems.some((p) => p.code === "incompatible-pack-version"));
  assert.equal(fs.existsSync(path.join(dir, ".pactwright", "lock.yml")), false);
  assert.deepEqual(fs.readdirSync(path.join(dir, ".claude", "agents")), []);
});

test("init: a pre-existing pack choice is preserved", () => {
  const dir = emptyRepo();
  assert.equal(initProject(dir, { agentPack: `${STANDARD}@${runtimeVersion()}` }).ok, true);
  const config = read(dir, ".pactwright/config.yml");
  // A second init must not re-select or widen the choice already recorded.
  assert.equal(initProject(dir).ok, true);
  assert.equal(read(dir, ".pactwright/config.yml"), config);
});
