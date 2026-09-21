/**
 * A2-D probe 09 — remove / re-add, and what `rewriteConfig` leaves behind.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { addExtension, removeExtension } from "../../../src/extension/manage.js";
import { loadConfig } from "../../../src/config/config.js";
import { useAgentPack } from "../../../src/pack/select.js";
import { doctor } from "../../../src/doctor.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, makeProject, report, write } from "./fixture.js";

const RUNTIME = runtimeVersion();
const graph = ["graph:", "  node_types:", "    note:", "      required_fields: []"].join("\n");

/** A package whose last path segment *is* the extension id — the shape `extension add` assumes. */
const ext = {
  id: "probe-notes",
  pkg: "@probe/probe-notes",
  version: "0.1.0",
  pactwright: RUNTIME,
  graph,
};

const root = makeProject({
  pack: { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME },
  packageManager: "pnpm@11.7.0",
  runtime: RUNTIME,
  extensions: [ext],
});
useAgentPack(root, "@probe/pack");
write(
  root,
  "specs/nodes/note-probe-cc33.md",
  "---\nid: note-probe-cc33\ntype: note\ntitle: probe note\ncreated: 2026-09-01\n---\n\nUser-authored extension record.\n",
);

const configPath = join(root, ".pactwright/config.yml");
const lockPath = join(root, ".pactwright/lock.yml");
const configBefore = readFileSync(configPath, "utf8");
const lockBefore = readFileSync(lockPath, "utf8");

const removed = removeExtension(root, "probe-notes");
const configAfterRemove = readFileSync(configPath, "utf8");
report("remove", {
  ok: removed.ok,
  changes: removed.changes,
  preserved: removed.preserved.map((p) => p.slice(root.length + 1)),
  problems: removed.problems.map((p) => p.code),
  recordPreservedOnDisk: existsSync(join(root, "specs/nodes/note-probe-cc33.md")),
});
report("config.yml after remove", configAfterRemove);
report("does the rewritten config still parse?", {
  parses: loadConfig(configPath).value !== undefined,
  problems: loadConfig(configPath).problems.map((p) => `${p.code}: ${p.message}`),
});
const d = doctor(root);
report("doctor with the removed extension's records still on disk", {
  status: d.status,
  checks: d.checks.map((c) => `[${c.status}] ${c.name}: ${c.detail}`),
});

const readded = addExtension(root, "@probe/probe-notes", { allowInstall: false });
report("re-add by explicit package", {
  ok: readded.ok,
  changes: readded.changes,
  problems: readded.problems.map((p) => `${p.code}: ${p.message}`),
  lockIdenticalToBeforeRemoval: readFileSync(lockPath, "utf8") === lockBefore,
  configIdenticalToBeforeRemoval: readFileSync(configPath, "utf8") === configBefore,
});
report("config.yml after re-add", readFileSync(configPath, "utf8"));

/* The conventional form, and the package form whose tail is not the id. */
report("id derivation in `extension add`", {
  conventional: addExtension(root, "probe-notes", { allowInstall: false }).problems.map(
    (p) => p.code,
  ),
  packageWhoseTailIsNotTheId: addExtension(root, "@probe/notes", {
    allowInstall: false,
  }).problems.map((p) => `${p.code}: ${p.message}`),
});
cleanup(root);
