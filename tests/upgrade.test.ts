import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "../src/config/config.js";
import { loadLifecycle } from "../src/config/lifecycle.js";
import { loadLock } from "../src/config/lock.js";
import {
  finishUpgrade,
  upgradeRuntime,
  type PackageInstaller,
  type Reentry,
} from "../src/upgrade.js";
import { useAgentPack } from "../src/pack/select.js";
import { runtimeVersion } from "../src/version.js";
import { makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

/** A project that looks like a real consumer: declared package manager and a pack. */
function consumer(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "consumer",
        private: true,
        packageManager: "pnpm@11.7.0",
        devDependencies: { pactwright: `^${runtimeVersion()}` },
      },
      null,
      2,
    )}\n`,
  );
  return dir;
}

/**
 * A packed fixture runtime: installing writes the package the way a package
 * manager would, so `installedVersion` reads it back exactly as in a real
 * install. No network, and the flow under test is the real one.
 */
function fixtureInstaller(version: string): { install: PackageInstaller; calls: string[] } {
  const calls: string[] = [];
  const install: PackageInstaller = ({ root, manager, spec }) => {
    const dir = path.join(root, "node_modules", "pactwright");
    // No spec is a frozen install: put node_modules back in line with the
    // manifest and lock as they now stand. The environment transaction uses
    // it to undo an install after restoring both files, and it is the only
    // thing that makes `restored` mean the runtime really did come back.
    if (spec === undefined) {
      calls.push(`${manager} install`);
      fs.rmSync(dir, { recursive: true, force: true });
      return [];
    }
    calls.push(`${manager} ${spec}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name: "pactwright", version, main: "index.js" }, null, 2)}\n`,
    );
    fs.writeFileSync(path.join(dir, "index.js"), "module.exports = {};\n");
    return [];
  };
  return { install, calls };
}

const noReentry: Reentry = () => [];

test("upgrade: detects the package manager and delegates package replacement", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const { install, calls } = fixtureInstaller("0.0.2");
  const report = upgradeRuntime(root, { install, reenter: noReentry });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(report.manager, "pnpm");
  assert.equal(report.to, "0.0.2");
  assert.deepEqual(calls, ["pnpm pactwright@latest"], "the package manager does the install");
});

test("upgrade: --to targets an exact release, forward or back", () => {
  for (const target of ["0.0.5", "0.0.1"]) {
    const root = consumer();
    assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
    const { install, calls } = fixtureInstaller(target);
    const report = upgradeRuntime(root, { to: target, install, reenter: noReentry });
    assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
    assert.equal(report.to, target);
    assert.deepEqual(calls, [`pnpm pactwright@${target}`]);
  }
});

test("upgrade: --to rejects anything that is not an exact release", () => {
  const root = consumer();
  const report = upgradeRuntime(root, { to: "^0.0.2", install: fixtureInstaller("0.0.2").install });
  assert.equal(report.ok, false);
  assert.deepEqual(
    report.problems.map((p) => p.code),
    ["invalid-target"],
  );
});

test("upgrade: re-entry runs through the newly installed runtime", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const seen: Array<{ root: string; version: string }> = [];
  const report = upgradeRuntime(root, {
    install: fixtureInstaller("0.0.2").install,
    reenter: (request) => {
      seen.push({ root: request.root, version: request.version });
      return [];
    },
  });
  assert.equal(report.ok, true);
  // The version handed to re-entry is what the package manager installed,
  // not what the old runtime was running (Distribution §15).
  assert.deepEqual(seen, [{ root, version: "0.0.2" }]);
});

test("upgrade: a failed install restores the previous environment", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const before = {
    config: fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8"),
    lock: fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"),
    manifest: fs.readFileSync(path.join(root, "package.json"), "utf8"),
  };
  const report = upgradeRuntime(root, {
    install: () => [
      { code: "package-manager-failed", message: "registry unreachable", path: root },
    ],
    reenter: noReentry,
  });
  assert.equal(report.ok, false);
  assert.equal(report.restored, true);
  assert.equal(
    fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8"),
    before.config,
  );
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"), before.lock);
  assert.equal(fs.readFileSync(path.join(root, "package.json"), "utf8"), before.manifest);
});

test("upgrade: a failed target recovers the previous valid config and lock", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const lockBefore = fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8");
  const report = upgradeRuntime(root, {
    install: fixtureInstaller("9.9.9").install,
    reenter: () => [
      { code: "reentry-failed", message: "the new runtime rejected the environment", path: root },
    ],
  });
  assert.equal(report.ok, false);
  assert.equal(report.restored, true);
  assert.ok(report.problems.some((p) => p.code === "reentry-failed"));
  // Canonical state is untouched and the previous lock stands, so the project
  // can run on — or explicitly target — the runtime it had.
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"), lockBefore);
});

test("upgrade: an undetectable package manager fails before anything is installed", () => {
  const root = makeTempProject();
  dirs.push(root);
  let called = false;
  const report = upgradeRuntime(root, {
    install: () => {
      called = true;
      return [];
    },
    reenter: noReentry,
  });
  assert.equal(report.ok, false);
  assert.equal(called, false, "no install is attempted without a detected manager");
  assert.ok(report.problems.some((p) => p.code === "no-package-manager"));
});

/* ---- the second half, run by the new runtime ---- */

test("upgrade --finish: migrates a version 1 lifecycle document and preserves its policy", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  fs.writeFileSync(
    path.join(root, ".pactwright", "lifecycle.yml"),
    [
      "version: 1",
      "",
      "stages:",
      "  capture-intent:",
      "    execution: manual",
      "  propose-contracts:",
      "    execution: automatic",
      "  approve-contract:",
      "    execution: manual",
      "    actor: human",
      "  write-brief:",
      "    execution: automatic",
      "  deliver-brief:",
      "    execution: automatic",
      "  review:",
      "    execution: manual",
      "    actor: human",
      "  prepare-evidence:",
      "    execution: automatic",
      "",
    ].join("\n"),
  );

  const report = finishUpgrade(root);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(report.migrations, ["lifecycle.yml -> version 2"]);

  const lifecycle = loadLifecycle(path.join(root, ".pactwright", "lifecycle.yml"));
  assert.deepEqual(lifecycle.problems, []);
  assert.equal(lifecycle.value?.version, 2);
  // The v1 review stage was a human gate; it stays one as a shape step.
  assert.deepEqual(
    lifecycle.value?.shape.steps.find((step) => step.name === "review"),
    { name: "review", kind: "review", execution: "manual", actor: "human" },
  );
  assert.equal(lifecycle.value?.responsibilities["approve-contract"].actor, "human");
});

test("upgrade --finish: re-locks, syncs and validates", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  fs.rmSync(path.join(root, ".claude", "agents", "spec.md"));
  const report = finishUpgrade(root);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.ok(report.synced.includes(".claude/agents/spec.md"), report.synced.join(", "));
  const lock = loadLock(path.join(root, ".pactwright", "lock.yml"));
  assert.equal(lock.value?.runtime.version, runtimeVersion());
});

test("upgrade --finish: an unresolvable environment leaves nothing half-migrated", () => {
  const root = consumer();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const configPath = path.join(root, ".pactwright", "config.yml");
  const lockPath = path.join(root, ".pactwright", "lock.yml");
  const lifecyclePath = path.join(root, ".pactwright", "lifecycle.yml");
  fs.writeFileSync(
    configPath,
    fs
      .readFileSync(configPath, "utf8")
      .replace('source: "@pactwright/standard"', 'source: "@pactwright/does-not-exist"'),
  );
  // A v1 document that would have been migrated had the environment resolved.
  fs.writeFileSync(
    lifecyclePath,
    "version: 1\n\nstages:\n  capture-intent:\n    execution: manual\n",
  );
  const lockBefore = fs.readFileSync(lockPath, "utf8");

  const report = finishUpgrade(root);
  assert.equal(report.ok, false);
  assert.equal(report.restored, true);
  assert.ok(
    report.problems.some((p) => p.code === "extension-not-found" || p.code === "pack-not-found"),
  );
  // Neither the lock nor the lifecycle document moved: a failed finish does
  // not leave canonical configuration partially migrated.
  assert.equal(fs.readFileSync(lockPath, "utf8"), lockBefore);
  assert.match(fs.readFileSync(lifecyclePath, "utf8"), /^version: 1/);
  assert.deepEqual(report.migrations, []);
});

test("upgrade --finish: a scaffold upgrades without inventing a pack", () => {
  const root = consumer();
  fs.rmSync(path.join(root, ".pactwright", "lock.yml"), { force: true });
  fs.writeFileSync(
    path.join(root, ".pactwright", "config.yml"),
    "version: 1\n\nadapter:\n  type: claude-code\n\nextensions: {}\n\ngithub:\n  enabled: false\n",
  );
  const report = finishUpgrade(root);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(
    loadConfig(path.join(root, ".pactwright", "config.yml")).value?.agentPack,
    undefined,
  );
  assert.equal(fs.existsSync(path.join(root, ".pactwright", "lock.yml")), false);
});

test("upgrade: the agent pack and extension identities are not touched", () => {
  const root = consumer({ extensions: ["fixture-base"] });
  const pinned = runtimeVersion();
  assert.equal(useAgentPack(root, `@pactwright/standard@${pinned}`).ok, true);
  const before = loadLock(path.join(root, ".pactwright", "lock.yml")).value!;
  const report = upgradeRuntime(root, {
    install: fixtureInstaller("9.0.0").install,
    reenter: noReentry,
  });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  const after = loadLock(path.join(root, ".pactwright", "lock.yml")).value!;
  assert.deepEqual(after.agentPack, before.agentPack, "a runtime upgrade never moves the pack");
  assert.deepEqual(after.extensions, before.extensions, "nor any extension");
  assert.equal(
    loadConfig(path.join(root, ".pactwright", "config.yml")).value?.agentPack?.version,
    pinned,
    "the configured constraint stays authoritative",
  );
});
