/**
 * A2-D probe 10 — can `doctor` reach its pending-migration check in the
 * state that check exists for?
 *
 * Distribution §11 calls a pending migration an environment fault and §16
 * requires `doctor` to report it. A pending migration means records at the
 * old schema and a manifest declaring the new one — which is exactly a
 * project the canonical loader rejects.
 */
import { join } from "node:path";
import { doctor } from "../../../src/doctor.js";
import { useAgentPack } from "../../../src/pack/select.js";
import { resolveDesiredState, writeLock } from "../../../src/pack/resolve.js";
import { loadConfig } from "../../../src/config/config.js";
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

function project(withRecords: boolean): string {
  const root = makeProject({
    pack: { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME },
    packageManager: "pnpm@11.7.0",
    runtime: RUNTIME,
    extensions: [ext],
  });
  useAgentPack(root, "@probe/pack");
  if (withRecords) {
    write(
      root,
      "specs/nodes/deployment-live-1a2b.md",
      "---\nid: deployment-live-1a2b\ntype: deployment\ntitle: live\ncreated: 2026-09-01\nexposure_level: public\n---\n\nA record at schema version 1.\n",
    );
  }
  const config = loadConfig(join(root, ".pactwright/config.yml"));
  writeLock(
    join(root, ".pactwright/lock.yml"),
    resolveDesiredState({ root, config: config.value! }).value!.lock,
  );
  // The package moves to v2 without the upgrade running: a pending migration.
  installExtension(root, { ...ext, version: "0.2.0", graph: V2 });
  return root;
}

for (const withRecords of [false, true]) {
  const root = project(withRecords);
  const d = doctor(root);
  report(
    withRecords
      ? "pending migration WITH records of the migrating type"
      : "pending migration with NO records of that type (the shape the suite tests)",
    {
      status: d.status,
      checks: d.checks.map((c) => `[${c.status}] ${c.name}: ${c.detail}`),
      reachedTheMigrationCheck: d.checks.some((c) => c.name === "extension-migrations"),
    },
  );
  cleanup(root);
}
