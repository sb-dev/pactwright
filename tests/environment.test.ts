import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { checkEnvironmentAgreement } from "../src/config/agreement.js";
import { environmentLockHash, loadLock } from "../src/config/lock.js";
import { detectPackageManager, installedVersion } from "../src/config/package-manager.js";
import { repositoryRevision, NO_REPOSITORY_REVISION } from "../src/graph/repository.js";
import { loadProject } from "../src/loader.js";
import { syncProject } from "../src/sync.js";
import { makeTempProject, repoRoot } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const lockOf = (root: string) => loadLock(path.join(root, ".pactwright", "lock.yml")).value!;

/* ---- environment_lock_hash (Distribution §12, Step 15) ---- */

test("environment: the same locked environment always produces the same hash", () => {
  const a = temp({ pack: "complete" });
  const b = temp({ pack: "complete" });
  assert.equal(
    fs.readFileSync(path.join(a, ".pactwright", "lock.yml"), "utf8"),
    fs.readFileSync(path.join(b, ".pactwright", "lock.yml"), "utf8"),
    "resolving twice must be byte-identical",
  );
  assert.equal(environmentLockHash(lockOf(a)), environmentLockHash(lockOf(b)));
  assert.match(environmentLockHash(lockOf(a)), /^sha256:[0-9a-f]{64}$/);
});

test("environment: changing any one resolved identity changes the hash", () => {
  const root = temp({ pack: "complete" });
  const base = lockOf(root);
  const hash = environmentLockHash(base);
  const zero = `sha256:${"0".repeat(64)}`;
  const agent = Object.keys(base.agents)[0]!;
  const skill = Object.keys(base.skills)[0]!;

  const variants = {
    "runtime version": { ...base, runtime: { version: "9.9.9" } },
    "pack version": { ...base, agentPack: { ...base.agentPack, version: "9.9.9" } },
    "pack hash": { ...base, agentPack: { ...base.agentPack, hash: zero } },
    "agent hash": { ...base, agents: { ...base.agents, [agent]: zero } },
    "skill hash": { ...base, skills: { ...base.skills, [skill]: zero } },
    "extension pin": {
      ...base,
      extensions: {
        ...base.extensions,
        "fixture-base": { package: "@pactwright/fixture-base", version: "1.0.0", hash: zero },
      },
    },
  };
  for (const [what, variant] of Object.entries(variants)) {
    assert.notEqual(environmentLockHash(variant), hash, `${what} must change the hash`);
  }
});

/* ---- lock agreement (Step 15) ---- */

test("environment: a healthy project agrees with its lock", () => {
  const root = temp({ pack: "complete" });
  const agreement = checkEnvironmentAgreement(loadProject({ root }));
  assert.equal(agreement.ok, true, agreement.problems.map((p) => p.message).join("\n"));
  assert.equal(agreement.environmentLockHash, environmentLockHash(lockOf(root)));
});

test("environment: a tampered lock is rejected and never replaces generated integration", () => {
  const root = temp({ pack: "complete" });
  // Render once so there is a previous valid generated environment to protect.
  assert.equal(syncProject(root).ok, true);
  const generated = path.join(root, ".claude", "commands", "review.md");
  const before = fs.readFileSync(generated, "utf8");

  // The exact probe from the gap analysis: claim a runtime that is not
  // running and a pack hash of zeros.
  const lockPath = path.join(root, ".pactwright", "lock.yml");
  fs.writeFileSync(
    lockPath,
    fs
      .readFileSync(lockPath, "utf8")
      .replace(/^(runtime:\n {2}version: ).*$/m, "$19.9.9")
      .replace(/(\n {2}hash: )sha256:[0-9a-f]{64}/, `$1sha256:${"0".repeat(64)}`),
  );

  const agreement = checkEnvironmentAgreement(loadProject({ root }));
  assert.equal(agreement.ok, false);
  const codes = agreement.problems.map((p) => p.code);
  assert.ok(codes.includes("lock-runtime-mismatch"), codes.join(", "));
  assert.ok(codes.includes("lock-drift"), codes.join(", "));

  const report = syncProject(root);
  assert.equal(report.ok, false, "sync must refuse a lock that disagrees");
  assert.deepEqual(report.changed, []);
  assert.equal(fs.readFileSync(generated, "utf8"), before, "generated files must survive intact");
});

/* ---- package manager detection (Step 19) ---- */

test("environment: the package manager is detected from an explicit declaration", () => {
  const detected = detectPackageManager(repoRoot);
  assert.equal(detected.problems.length, 0);
  assert.equal(detected.value?.name, "pnpm");
  assert.equal(detected.value?.source, "declared");
  assert.equal(detected.value?.version, "11.7.0");
  assert.equal(detected.value?.lockFile, "pnpm-lock.yaml");
});

test("environment: competing lock files are ambiguous, not guessed", () => {
  const root = temp();
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "x" }));
  fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  fs.writeFileSync(path.join(root, "package-lock.json"), "{}");
  const detected = detectPackageManager(root);
  assert.equal(detected.value, undefined);
  assert.deepEqual(
    detected.problems.map((p) => p.code),
    ["ambiguous-package-manager"],
  );
});

test("environment: a project with no package manager is reported, not assumed", () => {
  const root = temp();
  const detected = detectPackageManager(root);
  assert.equal(detected.value, undefined);
  assert.deepEqual(
    detected.problems.map((p) => p.code),
    ["no-package-manager"],
  );
});

test("environment: installed versions come from the package the manager resolved", () => {
  assert.equal(installedVersion(repoRoot, "@pactwright/standard"), "0.0.1");
  assert.equal(installedVersion(repoRoot, "not-a-real-package-xyz"), undefined);
});

/* ---- repository revision (Step 5) ---- */

test("environment: repository revision resolves this repository's commit", () => {
  const revision = repositoryRevision(repoRoot);
  const head = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  assert.equal(revision.commit, head);
  assert.match(revision.id, /^git:[0-9a-f]{40}(\+dirty)?$/);
  assert.equal(revision.id, `git:${head}${revision.dirty ? "+dirty" : ""}`);
});

test("environment: a directory outside a repository resolves to no revision", () => {
  const outside = fs.mkdtempSync(path.join(tmpdir(), "pactwright-norepo-"));
  dirs.push(outside);
  const revision = repositoryRevision(outside);
  assert.equal(revision.id, NO_REPOSITORY_REVISION);
  assert.equal(revision.commit, undefined);
});

test("environment: the three replay identities are distinct", () => {
  const root = temp({ pack: "complete" });
  const project = loadProject({ root });
  const repository = repositoryRevision(root).id;
  const environment = environmentLockHash(project.lock);
  const graph = checkEnvironmentAgreement(project).environmentLockHash;
  assert.equal(environment, graph);
  assert.notEqual(repository, environment);
});
