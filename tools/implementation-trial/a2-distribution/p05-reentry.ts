/**
 * A2-D probe 05 — real child re-entry, executable origin and lock ownership
 * across the process boundary.
 *
 * Distribution §15 requires migration, locking, sync and validation to be
 * performed by the *newly installed* runtime. `upgradeRuntime` spawns
 * `node_modules/.bin/pactwright upgrade --finish` to do that. This probe
 * installs a genuinely different runtime build into the fixture's
 * `node_modules`, points the bin at it, and runs the real thing: a real
 * child process, a real second transaction, a real writer lock taken in the
 * child while the parent's transaction is open.
 */
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { upgradeRuntime } from "../../../src/upgrade.js";
import { writerLockPath } from "../../../src/graph/writer-lock.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, makeProject, report, write } from "./fixture.js";

const checkout = fileURLToPath(new URL("../../..", import.meta.url));
const RUNTIME = runtimeVersion();

const V1_LIFECYCLE = [
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
  "    execution: automatic",
  "  prepare-evidence:",
  "    execution: automatic",
  "",
].join("\n");

/** Installs a runnable copy of this build as `pactwright@<version>` in the fixture. */
function installRuntime(root: string, version: string): void {
  const dir = join(root, "node_modules", "pactwright");
  mkdirSync(dir, { recursive: true });
  cpSync(join(checkout, "dist"), join(dir, "dist"), { recursive: true });
  const manifest = JSON.parse(readFileSync(join(checkout, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ ...manifest, version }, null, 2)}\n`,
    "utf8",
  );
  // Dependencies the copied build resolves by walking up from its own path.
  for (const dep of ["js-yaml"]) {
    const target = join(root, "node_modules", dep);
    if (!existsSync(target)) symlinkSync(join(checkout, "node_modules", dep), target, "dir");
  }
  const bin = join(root, "node_modules", ".bin");
  mkdirSync(bin, { recursive: true });
  const shim = join(bin, "pactwright");
  writeFileSync(
    shim,
    `#!/bin/sh\nexec "${process.execPath}" "${join(dir, "dist", "cli.js")}" "$@"\n`,
    "utf8",
  );
  chmodSync(shim, 0o755);
}

function fixture(packRange: string): string {
  const root = makeProject({
    pack: { name: "@probe/pack", version: "0.1.0", pactwright: packRange },
    packageManager: "pnpm@11.7.0",
    runtime: RUNTIME,
  });
  return root;
}

/* A — re-entry into a runtime the selected pack does not support. --------- */
{
  const root = fixture(RUNTIME);
  const { useAgentPack } = await import("../../../src/pack/select.js");
  useAgentPack(root, "@probe/pack");
  write(root, ".pactwright/lifecycle.yml", V1_LIFECYCLE);
  const lockBefore = readFileSync(join(root, ".pactwright/lock.yml"), "utf8");

  installRuntime(root, RUNTIME);
  const calls: string[] = [];
  const result = upgradeRuntime(root, {
    view: () => ["0.9.0"],
    install: ({ spec }) => {
      calls.push(spec ?? "<frozen reinstall>");
      installRuntime(root, spec === undefined ? RUNTIME : "0.9.0");
      return [];
    },
    // No `reenter` override: the production `cliReentry` spawns the real child.
  });
  report("A — upgrade to a runtime the pack pins away from", {
    ok: result.ok,
    from: result.from,
    to: result.to,
    installerCalls: calls,
    restored: result.restored,
    recovery: result.recovery ?? [],
    problems: result.problems.map((p) => `${p.code}: ${(p.message ?? "").split("\n")[0]}`),
    lockUnchanged: readFileSync(join(root, ".pactwright/lock.yml"), "utf8") === lockBefore,
    installedRuntimeAfter: JSON.parse(
      readFileSync(join(root, "node_modules/pactwright/package.json"), "utf8"),
    ).version,
    writerLockLeftBehind: existsSync(writerLockPath(root)),
    lifecycleVersionAfter: readFileSync(join(root, ".pactwright/lifecycle.yml"), "utf8").split(
      "\n",
    )[0],
  });
  cleanup(root);
}

/* B — re-entry that succeeds: the child migrates, re-locks, syncs. -------- */
{
  const root = fixture(RUNTIME);
  const { useAgentPack } = await import("../../../src/pack/select.js");
  useAgentPack(root, "@probe/pack");
  write(root, ".pactwright/lifecycle.yml", V1_LIFECYCLE);

  installRuntime(root, RUNTIME);
  const calls: string[] = [];
  const result = upgradeRuntime(root, {
    view: () => [RUNTIME],
    install: ({ spec }) => {
      calls.push(spec ?? "<frozen reinstall>");
      installRuntime(root, RUNTIME);
      return [];
    },
  });
  const lifecycle = readFileSync(join(root, ".pactwright/lifecycle.yml"), "utf8");
  report("B — successful re-entry through the installed binary", {
    parentReport: {
      ok: result.ok,
      from: result.from,
      to: result.to,
      unchanged: result.unchanged,
      migrations: result.migrations,
      synced: result.synced,
    },
    installerCalls: calls,
    theChildActuallyMigrated: lifecycle.startsWith("version: 2"),
    lifecycleFirstLines: lifecycle.split("\n").slice(0, 3),
    adapterFilesRendered: existsSync(join(root, ".claude/commands/review.md")),
    writerLockLeftBehind: existsSync(writerLockPath(root)),
  });
  cleanup(root);
}

/* C — no local runtime to re-enter through. ------------------------------- */
{
  const root = fixture(RUNTIME);
  const { useAgentPack } = await import("../../../src/pack/select.js");
  useAgentPack(root, "@probe/pack");
  const calls: string[] = [];
  const result = upgradeRuntime(root, {
    view: () => [RUNTIME],
    install: ({ spec }) => {
      calls.push(spec ?? "<frozen reinstall>");
      // Installs the package but no `.bin` entry — a globally installed CLI
      // driving a project that does not depend on the runtime locally.
      write(
        root,
        "node_modules/pactwright/package.json",
        `${JSON.stringify({ name: "pactwright", version: RUNTIME }, null, 2)}\n`,
      );
      return [];
    },
  });
  report("C — re-entry with no node_modules/.bin/pactwright", {
    ok: result.ok,
    problems: result.problems.map((p) => `${p.code}: ${p.message}`),
    restored: result.restored,
    recovery: result.recovery ?? [],
    installerCalls: calls,
  });
  cleanup(root);
}
