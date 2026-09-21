/**
 * A2-D probe 02 — post-write migration failure and installed-state recovery.
 *
 * Distribution §15 requires canonical records to end up "fully migrated or
 * untouched". `extension upgrade` runs the migration inside the environment
 * transaction and the code says the transaction owns the undo. This asks the
 * question the comment answers: does the transaction's managed set actually
 * contain the records a migration writes?
 *
 * The failure is injected *after* the migration's effect, not before the
 * write — a second record the declared migration cannot complete, so the v2
 * schema rejects it at the validation step that follows the write.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { upgradeExtension } from "../../../src/extension/manage.js";
import { managedSet } from "../../../src/environment/transaction.js";
import { doctor } from "../../../src/doctor.js";
import { loadProject } from "../../../src/loader.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, installExtension, makeProject, report, write } from "./fixture.js";

const RUNTIME = runtimeVersion();

const V1 = [
  "graph:",
  "  schema_version: 1",
  "  node_types:",
  "    deployment:",
  "      required_fields: [exposure_level]",
].join("\n");

const V2 = [
  "graph:",
  "  schema_version: 2",
  "  node_types:",
  "    deployment:",
  "      required_fields: [exposure, environment]",
  "  migrations:",
  "    - from: 1",
  "      to: 2",
  "      operations:",
  "        - { kind: rename, type: deployment, from: exposure_level, to: exposure }",
  "        - { kind: set-default, type: deployment, field: environment, value: unknown }",
].join("\n");

const ext = {
  id: "probe-mig",
  pkg: "@probe/mig",
  version: "0.1.0",
  pactwright: RUNTIME,
  graph: V1,
};

const root = makeProject({
  pack: { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME },
  packageManager: "pnpm@11.7.0",
  runtime: RUNTIME,
  extensions: [ext],
});

const node = (id: string, fields: string): string =>
  `---\nid: ${id}\ntype: deployment\ntitle: ${id}\ncreated: 2026-09-01\n${fields}---\n\nProbe record.\n`;

// One record the declared migration carries cleanly.
write(
  root,
  "specs/nodes/deployment-alpha-aa11.md",
  node("deployment-alpha-aa11", "exposure_level: high\n"),
);
// One it cannot: no `exposure_level` to rename, so after the migration it is
// still missing a field the v2 schema requires.
write(
  root,
  "specs/nodes/deployment-beta-bb22.md",
  node("deployment-beta-bb22", "exposure_level_typo: high\n"),
);

// Lock the project at the extension's v1 state, exactly as `extension add` leaves it.
const { resolveDesiredState, writeLock } = await import("../../../src/pack/resolve.js");
const { loadConfig } = await import("../../../src/config/config.js");
const config = loadConfig(join(root, ".pactwright", "config.yml"));
const desired = resolveDesiredState({ root, config: config.value! });
writeLock(join(root, ".pactwright", "lock.yml"), desired.value!.lock);

report(
  "managed set the transaction will snapshot",
  managedSet(root).map((p) => p.slice(root.length + 1)),
);
report("records before the upgrade", {
  alpha: readFileSync(join(root, "specs/nodes/deployment-alpha-aa11.md"), "utf8")
    .split("\n")
    .slice(0, 7),
  beta: readFileSync(join(root, "specs/nodes/deployment-beta-bb22.md"), "utf8")
    .split("\n")
    .slice(0, 7),
});
report(
  "lock schema_version before",
  /schema_version/.test(readFileSync(join(root, ".pactwright/lock.yml"), "utf8"))
    ? "present"
    : "absent (= version 1)",
);

// The upgrade. `install` is the production seam: it stands in for the package
// manager and installs v2 into the tree, and the frozen reinstall the
// transaction performs on failure puts v1 back, exactly as the real manager
// would from the restored package.json and lock.
let installCalls = 0;
const result = upgradeExtension(root, "probe-mig", {
  view: () => ["0.1.0", "0.2.0"],
  install: ({ spec }) => {
    installCalls += 1;
    installExtension(root, {
      ...ext,
      version: spec === undefined ? "0.1.0" : "0.2.0",
      graph: spec === undefined ? V1 : V2,
    });
    return [];
  },
});

report("extension upgrade result", {
  ok: result.ok,
  changes: result.changes,
  problems: result.problems.map((p) => `${p.code}: ${p.message}`),
  installerCalls: installCalls,
});

report(
  "installed extension manifest AFTER the failed upgrade",
  readFileSync(join(root, "node_modules/@probe/mig/extension.yml"), "utf8").trim(),
);
report("records AFTER the failed upgrade", {
  alpha: readFileSync(join(root, "specs/nodes/deployment-alpha-aa11.md"), "utf8")
    .split("\n")
    .slice(0, 7),
  beta: readFileSync(join(root, "specs/nodes/deployment-beta-bb22.md"), "utf8")
    .split("\n")
    .slice(0, 7),
});
report(
  "lock schema_version AFTER",
  /schema_version/.test(readFileSync(join(root, ".pactwright/lock.yml"), "utf8"))
    ? "present"
    : "absent (= version 1)",
);

try {
  loadProject({ root });
  report("loadProject after the failed upgrade", "the project loads");
} catch (error) {
  report("loadProject after the failed upgrade", {
    threw: (error as Error).message.split("\n")[0],
    problems: ((error as { problems?: { code: string; message: string }[] }).problems ?? []).map(
      (p) => `${p.code}: ${p.message}`,
    ),
  });
}

const d = doctor(root);
report("doctor after the failed upgrade", {
  status: d.status,
  checks: d.checks.map((c) => `[${c.status}] ${c.name}: ${c.detail}`),
});

cleanup(root);
void existsSync;
void writeFileSync;
