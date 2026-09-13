import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { doctor } from "../src/doctor.js";
import { loadConfig } from "../src/config/config.js";
import { loadLock } from "../src/config/lock.js";
import { parseSpec, upgradeAgentPack, useAgentPack } from "../src/pack/select.js";
import { runtimeVersion } from "../src/version.js";
import { fixture, makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A temp project that also looks like the npm project a real consumer is:
 * `doctor` reports on the package manager, which a bare fixture has none of.
 */
function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify({ name: "consumer", private: true, packageManager: "pnpm@11.7.0" }, null, 2)}\n`,
  );
  return dir;
}

const configOf = (root: string) => loadConfig(path.join(root, ".pactwright", "config.yml")).value!;
const lockOf = (root: string) => loadLock(path.join(root, ".pactwright", "lock.yml")).value!;
const check = (root: string, name: string) =>
  doctor(root).checks.find((entry) => entry.name === name)!;

/* ---- agent-pack use (Step 11) ---- */

test("agent-pack: selecting the standard pack resolves, locks and syncs", () => {
  const root = temp();
  const report = useAgentPack(root, "@pactwright/standard");
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(report.selected?.name, "@pactwright/standard");
  assert.equal(configOf(root).agentPack!.source, "@pactwright/standard");
  assert.equal(lockOf(root).agentPack.name, "@pactwright/standard");
  assert.ok(report.synced.length > 0, "selection runs sync");
  assert.ok(fs.existsSync(path.join(root, ".claude", "agents", "spec.md")));
});

test("agent-pack: switching to a compatible fixture pack updates config and lock", () => {
  const root = temp({ pack: "complete" });
  const before = lockOf(root).agentPack.hash;
  const report = useAgentPack(root, "./pack");
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(configOf(root).agentPack!.source, "./pack");
  assert.equal(lockOf(root).agentPack.hash, before);
});

test("agent-pack: an incomplete pack is rejected and the previous environment survives", () => {
  const root = temp();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const config = fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8");
  const lock = fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8");
  const agent = fs.readFileSync(path.join(root, ".claude", "agents", "spec.md"), "utf8");

  fs.cpSync(path.join(fixture("packs"), "incomplete"), path.join(root, "bad"), {
    recursive: true,
  });
  const report = useAgentPack(root, "./bad");
  assert.equal(report.ok, false);
  assert.ok(
    report.problems.some((p) => p.code === "missing-capability"),
    report.problems.map((p) => p.code).join(", "),
  );
  // Nothing moved: configuration, lock and the generated environment stand.
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8"), config);
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"), lock);
  assert.equal(fs.readFileSync(path.join(root, ".claude", "agents", "spec.md"), "utf8"), agent);
});

test("agent-pack: an unresolvable source is rejected without touching the project", () => {
  const root = temp();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const lock = fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8");
  const report = useAgentPack(root, "@pactwright/does-not-exist");
  assert.equal(report.ok, false);
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"), lock);
});

test("agent-pack: an exact configured target stays selected", () => {
  const root = temp();
  const report = useAgentPack(root, `@pactwright/standard@${runtimeVersion()}`);
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.equal(configOf(root).agentPack!.version, runtimeVersion());
  // A desired constraint does not authorise changing pack identity, so an
  // upgrade under an exact pin resolves to the same version.
  const upgraded = upgradeAgentPack(root);
  assert.equal(upgraded.ok, true, upgraded.problems.map((p) => p.message).join("\n"));
  assert.equal(upgraded.selected?.version, runtimeVersion());
  assert.equal(upgraded.unchanged, true);
  assert.equal(
    configOf(root).agentPack!.version,
    runtimeVersion(),
    "upgrade never rewrites desired state",
  );
});

test("agent-pack: an incompatible exact target is rejected", () => {
  const root = temp();
  assert.equal(useAgentPack(root, "@pactwright/standard").ok, true);
  const report = useAgentPack(root, "@pactwright/standard@9.9.9");
  assert.equal(report.ok, false);
  assert.ok(
    report.problems.some((p) => p.code === "incompatible-pack-version"),
    report.problems.map((p) => p.code).join(", "),
  );
});

test("agent-pack: a malformed version range is refused before anything resolves", () => {
  const parsed = parseSpec("@pactwright/standard@not-a-version");
  assert.ok("code" in parsed);
  assert.equal(parsed.code, "invalid-version-range");
});

test("agent-pack: specs split scoped names from versions correctly", () => {
  assert.deepEqual(parseSpec("@scope/pack"), { source: "@scope/pack" });
  assert.deepEqual(parseSpec("@scope/pack@1.2.3"), { source: "@scope/pack", version: "1.2.3" });
  assert.deepEqual(parseSpec("plain@^1.2.0"), { source: "plain", version: "^1.2.0" });
  assert.deepEqual(parseSpec("./local/pack"), { source: "./local/pack" });
});

/* ---- doctor (Step 18) ---- */

test("doctor: a healthy project reports healthy and names no remediation", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  const report = doctor(root);
  assert.equal(report.status, "healthy", JSON.stringify(report.checks, null, 2));
  assert.deepEqual(
    report.checks.filter((entry) => entry.remediation !== undefined),
    [],
  );
});

test("doctor: performs no writes", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  const snapshot = (dir: string): string =>
    fs
      .readdirSync(dir, { withFileTypes: true, recursive: true })
      .map((entry) => path.join(entry.parentPath, entry.name))
      .sort()
      .join("|");
  const before = snapshot(root);
  doctor(root);
  doctor(root);
  assert.equal(snapshot(root), before);
});

test("doctor: lock drift is action required with a deterministic remediation", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  const lockPath = path.join(root, ".pactwright", "lock.yml");
  fs.writeFileSync(
    lockPath,
    fs
      .readFileSync(lockPath, "utf8")
      .replace(/(\n {2}hash: )sha256:[0-9a-f]{64}/, `$1sha256:${"0".repeat(64)}`),
  );
  const entry = check(root, "lock-agreement");
  assert.equal(entry.status, "action-required");
  assert.equal(entry.remediation, "pactwright agent-pack upgrade");
  assert.equal(doctor(root).status, "action-required");
});

test("doctor: a runtime mismatch points at pactwright upgrade", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  const lockPath = path.join(root, ".pactwright", "lock.yml");
  fs.writeFileSync(
    lockPath,
    fs.readFileSync(lockPath, "utf8").replace(/^(runtime:\n {2}version: ).*$/m, "$19.9.9"),
  );
  assert.equal(check(root, "runtime").remediation, "pactwright upgrade");
});

test("doctor: a missing capability points at agent-pack use", () => {
  const root = temp({ pack: "incomplete" });
  const entry = check(root, "capabilities");
  assert.equal(entry.status, "action-required");
  assert.equal(entry.remediation, "pactwright agent-pack use <source>");
});

test("doctor: generated drift is action required and points at sync", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  fs.rmSync(path.join(root, ".claude", "agents", "spec.md"));
  const entry = check(root, "generated-drift");
  assert.equal(entry.status, "action-required");
  assert.equal(entry.remediation, "pactwright sync");
  assert.match(entry.detail, /missing/);
});

test("doctor: a version 1 lifecycle document is reported as needing migration", () => {
  const root = temp();
  fs.writeFileSync(
    path.join(root, ".pactwright", "lifecycle.yml"),
    "version: 1\n\nstages:\n  capture-intent:\n    execution: manual\n",
  );
  const entry = check(root, "configuration");
  assert.equal(entry.status, "action-required");
  assert.equal(entry.remediation, "pactwright upgrade");
  assert.match(entry.detail, /predates the shape model/);
});

test("doctor: external Production Skills imports are reported as unsupported", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  fs.writeFileSync(
    path.join(root, "pactwright.yml"),
    "production_skills:\n  - source: github:acme/narrative-skills\n",
  );
  const entry = check(root, "production-skills");
  assert.equal(entry.status, "warning");
  assert.match(entry.detail, /not supported by this release/);
  assert.match(entry.detail, /Checkpoint 5/);
  // A warning is information, not a broken environment.
  assert.equal(doctor(root).status, "warning");
});

test("doctor: an inferred package manager is a warning, not a failure", () => {
  const root = temp({ pack: "complete" });
  assert.equal(useAgentPack(root, "./pack").ok, true);
  // Drop the declaration and leave only lock-file evidence.
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "consumer" }));
  fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  const entry = check(root, "package-manager");
  assert.equal(entry.status, "healthy");
  assert.match(entry.detail, /inferred from pnpm-lock\.yaml/);
  assert.equal(check(root, "package-manager-declaration").status, "warning");
});

test("doctor: a scaffold is action required, not healthy", () => {
  const root = temp();
  fs.rmSync(path.join(root, ".pactwright", "lock.yml"), { force: true });
  fs.writeFileSync(
    path.join(root, ".pactwright", "config.yml"),
    "version: 1\n\nadapter:\n  type: claude-code\n\nextensions: {}\n\ngithub:\n  enabled: false\n",
  );
  const report = doctor(root);
  assert.equal(report.status, "action-required");
  const entry = report.checks.find((c) => c.name === "configuration")!;
  assert.equal(entry.status, "action-required");
  assert.ok(
    entry.problems?.some((p) => p.code === "no-agent-pack-selected"),
    "the cause is the unselected pack, not a missing file",
  );
});
