/**
 * A2-D probe 06 — what the runtime actually asks the package manager to do,
 * and what it never asks it.
 *
 * A recording shim named after the package manager is placed first on PATH.
 * It writes the argv it was handed and exits 0. No registry is contacted and
 * no credential is used: the probe observes the command the reference
 * constructs, which is the thing under audit.
 */
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { packageManagerInstaller } from "../../../src/upgrade.js";
import { packageManagerView } from "../../../src/environment/select-target.js";
import { acquireSide } from "../../../src/eval/acquire.js";
import { report } from "./fixture.js";

const shimDir = mkdtempSync(join(tmpdir(), "a2d-shim-"));
const argvLog = join(shimDir, "argv.log");

for (const manager of ["pnpm", "npm", "yarn", "bun"]) {
  const shim = join(shimDir, manager);
  writeFileSync(
    shim,
    [
      "#!/bin/sh",
      `printf '%s' "${manager}" >> "${argvLog}"`,
      `for a in "$@"; do printf '\\t%s' "$a" >> "${argvLog}"; done`,
      `printf '\\n' >> "${argvLog}"`,
      // `view` must return something parseable or the caller reports a problem
      // instead of reaching the selection logic.
      'case "$1" in view) echo \'["0.0.1","0.0.2"]\' ;; esac',
      "exit 0",
    ].join("\n"),
    "utf8",
  );
  chmodSync(shim, 0o755);
}
process.env["PATH"] = `${shimDir}:${process.env["PATH"] ?? ""}`;

const read = (): string[] =>
  existsSync(argvLog) ? readFileSync(argvLog, "utf8").trimEnd().split("\n") : [];
const reset = (): void => rmSync(argvLog, { force: true });

const workRoot = mkdtempSync(join(tmpdir(), "a2d-pm-"));
mkdirSync(workRoot, { recursive: true });

/* 1 — the install command, for every supported manager. ------------------ */
reset();
for (const manager of ["pnpm", "npm", "yarn", "bun"] as const) {
  packageManagerInstaller({ root: workRoot, manager, spec: "pactwright@0.0.2" });
  packageManagerInstaller({ root: workRoot, manager });
}
report("argv the runtime hands the package manager to install / to undo", read());
report("does any install carry a dependency-script policy?", {
  ignoreScriptsAnywhere: read().some((line) => /ignore-scripts|ignore_scripts/.test(line)),
  frozenLockfileOnTheUndo: read().some((line) => /frozen-lockfile|--frozen/.test(line)),
});

/* 2 — the version listing. ------------------------------------------------ */
reset();
const versions = packageManagerView({ name: "pactwright", manager: "pnpm" });
report("argv for target selection, and what came back", { argv: read(), versions });

/* 3 — argument reaching the manager through `eval --baseline`. ------------ */
reset();
const injected = acquireSide({ spec: "-C", manager: "pnpm", from: workRoot });
report("acquireSide with a single-dash spec (the CLI guard only rejects `--`)", {
  argvTheManagerReceived: read(),
  outcome: Array.isArray(injected)
    ? injected.map((p) => `${p.code}: ${p.message}`)
    : `acquired at ${injected.root}`,
});

reset();
const normal = acquireSide({ spec: "@pactwright/standard@0.0.1", manager: "pnpm", from: workRoot });
report("acquireSide with an ordinary spec, for contrast", {
  argvTheManagerReceived: read(),
  outcome: Array.isArray(normal)
    ? normal.map((p) => `${p.code}: ${p.message}`)
    : `acquired at ${normal.root}`,
});

rmSync(shimDir, { recursive: true, force: true });
rmSync(workRoot, { recursive: true, force: true });
