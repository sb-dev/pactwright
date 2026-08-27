import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "../src/config/config.js";
import { loadLock } from "../src/config/lock.js";
import { addExtension, removeExtension, upgradeExtension } from "../src/extension/manage.js";
import { resolveExtensions } from "../src/extension/resolve.js";
import { loadProject } from "../src/loader.js";
import { requiredCapabilities } from "../src/pack/capabilities.js";
import { resolveDesiredState, serialiseLock } from "../src/pack/resolve.js";
import { validateProject } from "../src/validate.js";
import { makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});
function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

function config(root: string) {
  return loadConfig(path.join(root, ".pactwright", "config.yml")).value!;
}

function writeNode(root: string, id: string, type: string, title: string): string {
  const file = path.join(root, "specs", "nodes", `${id}.md`);
  fs.writeFileSync(
    file,
    `---\nid: ${id}\ntype: ${type}\ntitle: ${title}\ncreated: "2026-08-27"\n---\n\n${title}.\n`,
  );
  return file;
}

function installedManifest(root: string, id: string): string {
  return path.join(root, "node_modules", "@pactwright", id, "extension.yml");
}

// ---- resolution -------------------------------------------------------------

test("extensions: configured extensions resolve with dependencies, namespaces and hashes", () => {
  const root = temp({ extensions: ["fixture-base", "fixture-reporting"] });
  const resolved = resolveExtensions({ root, config: config(root) });
  assert.deepEqual(resolved.problems, []);
  assert.deepEqual(
    resolved.value!.map((e) => e.id),
    ["fixture-base", "fixture-reporting"],
  );
  assert.match(resolved.value![0]!.hash, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(resolved.value![1]!.manifest.dependencies, ["fixture-base"]);
});

test("extensions: the same desired state resolves to byte-identical locks across roots", () => {
  const a = temp({ extensions: ["fixture-base", "fixture-reporting"] });
  const b = temp({ extensions: ["fixture-base", "fixture-reporting"] });
  const ra = resolveDesiredState({ root: a, config: config(a) });
  const rb = resolveDesiredState({ root: b, config: config(b) });
  assert.deepEqual(ra.problems, []);
  assert.equal(serialiseLock(ra.value!.lock), serialiseLock(rb.value!.lock));
  const entry = ra.value!.lock.extensions["fixture-reporting"]!;
  assert.equal(entry.package, "@pactwright/fixture-reporting");
  assert.equal(entry.version, "0.2.0");
  assert.deepEqual(entry.dependencies, { "fixture-base": "0.1.0" });
});

test("extensions: a missing dependency and a dependency cycle are reported", () => {
  const missing = temp({ extensions: ["fixture-reporting"] });
  const resolved = resolveExtensions({ root: missing, config: config(missing) });
  assert.deepEqual(
    resolved.problems.map((p) => p.code),
    ["extension-dependency-missing"],
  );

  const cyclic = temp({ extensions: ["fixture-base", "fixture-reporting"] });
  fs.writeFileSync(
    installedManifest(cyclic, "fixture-base"),
    fs
      .readFileSync(installedManifest(cyclic, "fixture-base"), "utf8")
      .replace("graph:", "dependencies:\n  extensions:\n    - fixture-reporting\n\ngraph:"),
  );
  const cycle = resolveExtensions({ root: cyclic, config: config(cyclic) });
  assert.ok(cycle.problems.some((p) => p.code === "extension-dependency-cycle"));
});

test("extensions: reserved namespaces and duplicate graph types are rejected", () => {
  const root = temp({ extensions: ["fixture-base"] });
  const manifest = installedManifest(root, "fixture-base");
  fs.writeFileSync(
    manifest,
    fs.readFileSync(manifest, "utf8").replace("namespace: notes", "namespace: lifecycle"),
  );
  const reserved = resolveExtensions({ root, config: config(root) });
  assert.ok(reserved.problems.some((p) => p.code === "reserved-namespace"));

  const clash = temp({ extensions: ["fixture-base"] });
  const clashManifest = installedManifest(clash, "fixture-base");
  fs.writeFileSync(
    clashManifest,
    fs.readFileSync(clashManifest, "utf8").replace("- note", "- intent"),
  );
  const duplicate = resolveExtensions({ root: clash, config: config(clash) });
  assert.ok(duplicate.problems.some((p) => p.code === "duplicate-node-type"));
});

test("extensions: the capability union gates the selected pack", () => {
  const failing = temp({ extensions: ["fixture-analysis"] });
  const result = resolveDesiredState({ root: failing, config: config(failing) });
  assert.equal(result.value, undefined);
  assert.ok(
    result.problems.every(
      (p) => p.code === "missing-capability" && p.message.includes("operations-analysis"),
    ),
  );

  const passing = temp({ pack: "extra-capability", extensions: ["fixture-analysis"] });
  const ok = resolveDesiredState({ root: passing, config: config(passing) });
  assert.deepEqual(ok.problems, []);

  const resolved = resolveExtensions({ root: passing, config: config(passing) });
  assert.deepEqual(
    requiredCapabilities(
      config(passing),
      resolved.value!.map((e) => e.manifest),
    ),
    ["delivery-execution", "delivery-review", "delivery-specification", "operations-analysis"],
  );
});

// ---- graph contribution -----------------------------------------------------

test("extensions: registered node and edge types validate through the canonical loader", () => {
  const root = temp({ extensions: ["fixture-base"] });
  writeNode(root, "note-first-1a2b", "note", "First note");
  const project = loadProject({ root });
  assert.equal(project.extensions.length, 1);
  assert.ok(project.graph.nodes.some((n) => n.type === "note"));
  assert.equal(validateProject({ root }).ok, true);
});

test("extensions: an unregistered type is still unknown", () => {
  const root = temp({ extensions: ["fixture-base"] });
  writeNode(root, "report-first-1a2b", "report", "A report");
  const report = validateProject({ root });
  assert.equal(report.ok, false);
  assert.ok(report.problems.some((p) => p.code === "unknown-node-type"));
});

// ---- add --------------------------------------------------------------------

test("extension add: enables the extension and updates config and lock", () => {
  const root = temp({ extensions: [{ id: "fixture-base", configure: false }] });
  const report = addExtension(root, "fixture-base");
  assert.equal(report.ok, true, JSON.stringify(report.problems));
  assert.deepEqual(report.changes, [{ id: "fixture-base", action: "added", version: "0.1.0" }]);
  assert.deepEqual(report.githubProfiles, ["fixture-base"]);
  assert.deepEqual(
    { ...config(root).extensions },
    {
      "fixture-base": { enabled: true, source: "@pactwright/fixture-base" },
    },
  );
  const lock = loadLock(path.join(root, ".pactwright", "lock.yml")).value!;
  assert.equal(lock.extensions["fixture-base"]?.version, "0.1.0");
  assert.equal(validateProject({ root }).ok, true);
});

test("extension add: resolves and enables missing dependencies first", () => {
  const root = temp({
    extensions: [
      { id: "fixture-base", configure: false },
      { id: "fixture-reporting", configure: false },
    ],
  });
  const report = addExtension(root, "fixture-reporting");
  assert.equal(report.ok, true, JSON.stringify(report.problems));
  assert.deepEqual(
    report.changes.map((c) => c.id),
    ["fixture-base", "fixture-reporting"],
  );
  const lock = loadLock(path.join(root, ".pactwright", "lock.yml")).value!;
  assert.deepEqual(lock.extensions["fixture-reporting"]?.dependencies, { "fixture-base": "0.1.0" });
});

test("extension add: the explicit package form and re-add work", () => {
  const root = temp({ extensions: [{ id: "fixture-base", configure: false }] });
  assert.equal(addExtension(root, "@pactwright/fixture-base").ok, true);
  const again = addExtension(root, "fixture-base");
  assert.equal(again.ok, true);
  assert.deepEqual(again.changes, [{ id: "fixture-base", action: "unchanged" }]);
});

test("extension add: fails without writing when the package is missing or the pack is incomplete", () => {
  const root = temp();
  const before = fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8");
  const missing = addExtension(root, "fixture-base");
  assert.equal(missing.ok, false);
  assert.ok(missing.problems.some((p) => p.code === "extension-not-found"));

  const incomplete = temp({ extensions: [{ id: "fixture-analysis", configure: false }] });
  const blocked = addExtension(incomplete, "fixture-analysis");
  assert.equal(blocked.ok, false);
  assert.ok(blocked.problems.every((p) => p.code === "missing-capability"));
  assert.equal(fs.readFileSync(path.join(root, ".pactwright", "config.yml"), "utf8"), before);
  assert.equal(config(incomplete).extensions["fixture-analysis"], undefined);
});

// ---- remove / disable -------------------------------------------------------

test("extension remove: blocked while an enabled extension depends on it", () => {
  const root = temp({ extensions: ["fixture-base", "fixture-reporting"] });
  const blocked = removeExtension(root, "fixture-base");
  assert.equal(blocked.ok, false);
  assert.deepEqual(
    blocked.problems.map((p) => p.code),
    ["extension-required-by"],
  );
  assert.match(blocked.problems[0]!.message, /fixture-reporting/);
  assert.equal(config(root).extensions["fixture-base"]?.enabled, true);

  assert.equal(removeExtension(root, "fixture-reporting").ok, true);
  const unblocked = removeExtension(root, "fixture-base");
  assert.equal(unblocked.ok, true);
  assert.deepEqual({ ...config(root).extensions }, {});
  assert.deepEqual(loadLock(path.join(root, ".pactwright", "lock.yml")).value!.extensions, {});
});

test("extensions: disabling a dependant is safe; disabling its dependency is reported", () => {
  const safe = temp({
    extensions: ["fixture-base", { id: "fixture-reporting", enabled: false }],
  });
  assert.equal(validateProject({ root: safe }).ok, true);
  const resolved = resolveExtensions({ root: safe, config: config(safe) });
  assert.deepEqual(resolved.problems, []);

  const broken = temp({
    extensions: [{ id: "fixture-base", enabled: false }, "fixture-reporting"],
  });
  const report = validateProject({ root: broken });
  assert.equal(report.ok, false);
  assert.ok(report.problems.some((p) => p.code === "extension-dependency-disabled"));
});

test("extensions: a disabled extension keeps its graph types registered", () => {
  const root = temp({ extensions: [{ id: "fixture-base", enabled: false }] });
  writeNode(root, "note-kept-1a2b", "note", "Kept note");
  assert.equal(validateProject({ root }).ok, true);
});

test("extension remove: preserves user-authored canonical extension data", () => {
  const root = temp({ extensions: ["fixture-base"] });
  const file = writeNode(root, "note-kept-1a2b", "note", "Kept note");
  const report = removeExtension(root, "fixture-base");
  assert.equal(report.ok, true);
  assert.equal(fs.existsSync(file), true);
  assert.equal(fs.readFileSync(file, "utf8").includes("Kept note"), true);
  assert.deepEqual(report.preserved, [file]);
  // The preserved records now have no registered owner; validate says so
  // honestly until the user deletes them or re-enables the extension.
  const after_ = validateProject({ root });
  assert.equal(after_.ok, false);
  assert.ok(after_.problems.some((p) => p.code === "unknown-node-type"));
  assert.equal(addExtension(root, "fixture-base").ok, true);
  assert.equal(validateProject({ root }).ok, true);
});

test("extension remove: an unconfigured extension is reported", () => {
  const root = temp();
  const report = removeExtension(root, "fixture-base");
  assert.equal(report.ok, false);
  assert.deepEqual(
    report.problems.map((p) => p.code),
    ["extension-not-configured"],
  );
});

// ---- upgrade ----------------------------------------------------------------

test("extension upgrade: re-resolves and updates the lock", () => {
  const root = temp({ extensions: ["fixture-base"] });
  assert.equal(addExtension(root, "fixture-base").changes[0]?.action, "unchanged");
  const lockPath = path.join(root, ".pactwright", "lock.yml");
  // The configured lock predates the extension; upgrade records it first.
  assert.equal(upgradeExtension(root, "fixture-base").ok, true);
  assert.equal(loadLock(lockPath).value!.extensions["fixture-base"]?.version, "0.1.0");

  const manifest = installedManifest(root, "fixture-base");
  fs.writeFileSync(
    manifest,
    fs.readFileSync(manifest, "utf8").replace("version: 0.1.0", "version: 0.1.1"),
  );
  const report = upgradeExtension(root, "fixture-base");
  assert.equal(report.ok, true, JSON.stringify(report.problems));
  assert.deepEqual(report.changes, [
    { id: "fixture-base", action: "upgraded", version: "0.1.1", previousVersion: "0.1.0" },
  ]);
  assert.equal(loadLock(lockPath).value!.extensions["fixture-base"]?.version, "0.1.1");
});
