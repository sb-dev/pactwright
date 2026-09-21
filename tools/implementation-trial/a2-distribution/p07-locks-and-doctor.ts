/**
 * A2-D probe 07 — the package-manager lock's contents, and what `doctor`
 * covers of Distribution §16.
 *
 * Distribution §13 lists "package-manager and Pactwright lock consistency"
 * among the checks made before a resolved environment is accepted, and §16
 * lists "package-manager lock ↔ .pactwright/lock.yml drift" and "available
 * runtime upgrade where determinable" among what `doctor` must report.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { doctor } from "../../../src/doctor.js";
import { validateProject } from "../../../src/validate.js";
import { detectPackageManager } from "../../../src/config/package-manager.js";
import { useAgentPack } from "../../../src/pack/select.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, makeProject, report } from "./fixture.js";

const RUNTIME = runtimeVersion();
const root = makeProject({
  pack: { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME },
  packageManager: "pnpm@11.7.0",
  runtime: RUNTIME,
});
useAgentPack(root, "@probe/pack");

const baseline = doctor(root);
report("doctor on a healthy project", {
  status: baseline.status,
  checks: baseline.checks.map((c) => `[${c.status}] ${c.name}`),
});

const REQUIRED_BY_SECTION_16 = [
  "installed Pactwright runtime version",
  "detected package manager",
  "package-manager declaration/lock consistency",
  "available runtime upgrade where determinable",
  "Pactwright configuration validity",
  "package-manager lock ↔ .pactwright/lock.yml drift",
  "runtime ↔ Extension compatibility",
  "runtime ↔ Agent Pack compatibility",
  "missing required capabilities",
  "missing/unresolvable Production Skills dependencies",
  "pending or incomplete migrations",
  "generated adapter/integration drift",
  "validation failures affecting the resolved environment",
];
report("§16's list against the checks doctor can emit", {
  checksDoctorEmits: [
    "package-manager",
    "package-manager-declaration",
    "configuration",
    "agent-pack",
    "runtime",
    "capabilities",
    "lock-agreement",
    "extensions",
    "extension-migrations",
    "generated-drift",
    "production-skills",
    "validation",
  ],
  requiredBySection16: REQUIRED_BY_SECTION_16,
});

/* The package-manager lock now claims a runtime nobody installed. ---------- */
const pmLock = join(root, "pnpm-lock.yaml");
writeFileSync(
  pmLock,
  [
    "lockfileVersion: '9.0'",
    "importers:",
    "  .:",
    "    devDependencies:",
    "      pactwright:",
    "        specifier: 0.0.1",
    "        version: 0.0.1",
    "      '@probe/pack':",
    "        specifier: 9.9.9",
    "        version: 9.9.9",
    "",
  ].join("\n"),
  "utf8",
);

const after = doctor(root);
const validation = validateProject({ root });
report("after the package-manager lock is made to disagree with everything", {
  packageManagerLockNowSays: { pactwright: "0.0.1", "@probe/pack": "9.9.9" },
  pactwrightLockSays: {
    runtime: /version: (\S+)/.exec(readFileSync(join(root, ".pactwright/lock.yml"), "utf8"))?.[1],
    pack: "0.1.0",
  },
  doctorStatus: after.status,
  doctorChecks: after.checks.map((c) => `[${c.status}] ${c.name}: ${c.detail}`),
  validateOk: validation.ok,
  detection: detectPackageManager(root).value,
});

cleanup(root);
