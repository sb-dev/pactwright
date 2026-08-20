import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { parseConfig, type PactwrightConfig } from "../src/config/config.js";
import { parseLock } from "../src/config/lock.js";
import { load as loadYaml } from "js-yaml";
import { PactwrightError } from "../src/errors.js";
import { loadProject } from "../src/loader.js";
import {
  agentFor,
  assertPackComplete,
  locatePack,
  lockEntriesFor,
  resolveAndLock,
  resolvePack,
  satisfiesRange,
  serialiseLock,
} from "../src/pack/resolve.js";
import { runtimeVersion } from "../src/version.js";
import { fixture, makeTempProject, repoRoot } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});
function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const standardDir = path.join(repoRoot, "packages", "standard");
const config = (source: string, version?: string): PactwrightConfig =>
  parseConfig(
    {
      version: 1,
      agent_pack: version === undefined ? { source } : { source, version },
      adapter: { type: "claude-code" },
      github: { enabled: false },
    },
    "config.yml",
  ).value!;

const fileHash = (file: string): string =>
  `sha256:${createHash("sha256").update(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), "utf8").digest("hex")}`;

test("resolve: satisfiesRange handles exact and caret ranges", () => {
  assert.equal(satisfiesRange("0.0.1", "0.0.1"), true);
  assert.equal(satisfiesRange("0.0.2", "0.0.1"), false);
  assert.equal(satisfiesRange("0.0.1", "^0.0.1"), true);
  assert.equal(satisfiesRange("0.0.2", "^0.0.1"), false);
  assert.equal(satisfiesRange("0.1.5", "^0.1.0"), true);
  assert.equal(satisfiesRange("0.2.0", "^0.1.0"), false);
  assert.equal(satisfiesRange("1.9.0", "^1.0.0"), true);
  assert.equal(satisfiesRange("2.0.0", "^1.0.0"), false);
  assert.equal(satisfiesRange("0.9.0", "^1.0.0"), false);
  assert.equal(satisfiesRange("x", "^1.0.0"), false);
});

test("resolve: @pactwright/standard resolves from a project with no node_modules (runtime fallback)", () => {
  const root = temp();
  assert.ok(!existsSync(path.join(root, "node_modules")));
  const located = locatePack(root, "@pactwright/standard");
  assert.equal(typeof located, "string");
  assert.equal(path.resolve(located as string), path.resolve(standardDir));
  const resolved = resolvePack({ root, config: config("@pactwright/standard") });
  assert.deepEqual(resolved.problems, []);
  assert.equal(resolved.value?.manifest.name, "@pactwright/standard");
  assert.equal(resolved.value?.manifest.pactwright, runtimeVersion());
});

test("resolve: an unknown package source is pack-not-found", () => {
  const resolved = resolvePack({ root: temp(), config: config("@pactwright/nope") });
  assert.deepEqual(
    resolved.problems.map((p) => p.code),
    ["pack-not-found"],
  );
});

test("resolve: a path source resolves from the project root and hashes every file", () => {
  const root = temp({ pack: "complete" });
  const resolved = resolvePack({ root, config: loadProject({ root }).config });
  assert.deepEqual(resolved.problems, []);
  const pack = resolved.value!;
  assert.equal(pack.dir, path.join(root, "pack"));
  assert.deepEqual(pack.hashes.agents, {
    implementer: fileHash(path.join(pack.dir, "agents/implementer.md")),
    reviewer: fileHash(path.join(pack.dir, "agents/reviewer.md")),
    spec: fileHash(path.join(pack.dir, "agents/spec.md")),
  });
  assert.deepEqual(Object.keys(pack.hashes.skills), [
    "contract-writing",
    "implementation-review",
    "repository-analysis",
  ]);
  assert.equal(
    pack.hashes.skills["contract-writing"],
    fileHash(path.join(pack.dir, "skills/contract-writing.md")),
  );
  assert.match(pack.hashes.pack, /^sha256:[0-9a-f]{64}$/);
  const again = resolvePack({ root, config: loadProject({ root }).config });
  assert.deepEqual(again.value?.hashes, pack.hashes);
  assert.deepEqual(agentFor(pack, "delivery-review"), {
    key: "reviewer",
    prompt: path.join(pack.dir, "agents/reviewer.md"),
    skills: ["implementation-review"],
  });
  assert.equal(agentFor(pack, "operations-analysis"), undefined);
});

test("resolve: changing a prompt changes its agent hash and the pack hash only", () => {
  const root = temp({ pack: "complete" });
  const before = resolvePack({ root, config: loadProject({ root }).config }).value!;
  writeFileSync(path.join(root, "pack", "agents", "spec.md"), "# spec\n\nChanged.\n");
  const after_ = resolvePack({ root, config: loadProject({ root }).config }).value!;
  assert.notEqual(after_.hashes.agents["spec"], before.hashes.agents["spec"]);
  assert.equal(after_.hashes.agents["reviewer"], before.hashes.agents["reviewer"]);
  assert.deepEqual(after_.hashes.skills, before.hashes.skills);
  assert.notEqual(after_.hashes.pack, before.hashes.pack);
});

test("resolve: runtime and requested-version compatibility are checked", () => {
  const root = temp({ pack: "wrong-runtime" });
  const cfg = loadProject({ root }).config;
  assert.deepEqual(
    resolvePack({ root, config: cfg }).problems.map((p) => p.code),
    ["incompatible-runtime"],
  );
  const ok = temp({ pack: "complete" });
  assert.deepEqual(
    resolvePack({ root: ok, config: config("./pack", "^0.1.0") }).problems.map((p) => p.code),
    ["incompatible-pack-version"],
  );
  assert.deepEqual(
    resolvePack({ root: ok, config: config("./pack", "0.0.0"), runtimeVersion: "0.0.0" }).problems,
    [],
  );
});

test("resolve: a project-local package wins over the runtime fallback; its name must match", () => {
  const root = temp();
  const local = path.join(root, "node_modules", "@x", "other");
  cpSync(fixture("packs/complete"), local, { recursive: true });
  writeFileSync(path.join(local, "package.json"), '{"name":"@x/other","version":"0.0.0"}\n');
  assert.equal(locatePack(root, "@x/other"), local);
  assert.deepEqual(
    resolvePack({ root, config: config("@x/other") }).problems.map((p) => p.code),
    ["pack-name-mismatch"],
  );
});

function lockBytes(root: string): string {
  return readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8");
}
function noTemps(root: string): void {
  assert.deepEqual(
    readdirSync(path.join(root, ".pactwright")).filter((f) => f.includes(".tmp-")),
    [],
  );
}

test("lock: a complete pack resolves and writes a lock that round-trips, byte-identical on rerun", () => {
  const root = temp({ pack: "complete" });
  const before = lockBytes(root);
  const { pack, lock } = resolveAndLock(root);
  const written = lockBytes(root);
  assert.notEqual(written, before);
  assert.equal(written, serialiseLock(lock));
  assert.deepEqual(parseLock(loadYaml(written), "lock.yml").problems, []);
  const reloaded = loadProject({ root }).lock;
  assert.deepEqual(reloaded, lockEntriesFor(pack));
  assert.equal(reloaded.runtime.version, runtimeVersion());
  assert.equal(reloaded.agentPack.hash, pack.hashes.pack);
  assert.deepEqual(reloaded.agents, pack.hashes.agents);
  assert.deepEqual(reloaded.skills, pack.hashes.skills);
  resolveAndLock(root);
  assert.equal(lockBytes(root), written);
  noTemps(root);
});

test("lock: the real @pactwright/standard pack locks from a plain project", () => {
  const root = temp();
  const { lock } = resolveAndLock(root);
  assert.equal(lock.agentPack.name, "@pactwright/standard");
  assert.deepEqual(Object.keys(lock.agents), ["implementer", "reviewer", "spec"]);
  assert.deepEqual(Object.keys(lock.skills), [
    "contract-writing",
    "implementation-review",
    "repository-analysis",
  ]);
  assert.equal(lock.agents["spec"], fileHash(path.join(standardDir, "agents", "spec.md")));
});

for (const [name, code] of [
  ["incomplete", "missing-capability"],
  ["wrong-runtime", "pack-unresolved"],
  ["missing-prompt", "pack-unresolved"],
] as const) {
  test(`lock: the ${name} pack fails with ${code} and the lock file is untouched`, () => {
    const root = temp({ pack: name });
    const before = lockBytes(root);
    assert.throws(
      () => resolveAndLock(root),
      (error: unknown) => error instanceof PactwrightError && error.code === code,
    );
    assert.equal(lockBytes(root), before);
    noTemps(root);
  });
}

test("assertPackComplete: lists every missing capability", () => {
  const root = temp({ pack: "incomplete" });
  try {
    assertPackComplete(loadProject({ root }));
    assert.fail("expected a throw");
  } catch (error) {
    assert.ok(error instanceof PactwrightError);
    assert.equal(error.code, "missing-capability");
    assert.match(error.message, /delivery-review/);
    assert.deepEqual(
      error.problems.map((p) => p.code),
      ["missing-capability"],
    );
  }
});
