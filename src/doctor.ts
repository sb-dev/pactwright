import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkEnvironmentAgreement } from "./config/agreement.js";
import { loadConfig } from "./config/config.js";
import { LIFECYCLE_VERSION } from "./config/lifecycle.js";
import { environmentLockHash } from "./config/lock.js";
import { detectPackageManager } from "./config/package-manager.js";
import { PactwrightError, formatProblem, type Problem } from "./errors.js";
import { renderClaudeCodeAdapter, isGenerated } from "./adapter/claude-code.js";
import { loadProject, type Project } from "./loader.js";
import { assertPackComplete } from "./pack/resolve.js";
import { projectPaths } from "./project.js";
import { validateProject } from "./validate.js";
import { runtimeVersion } from "./version.js";
import { readYamlFile } from "./yaml.js";

/**
 * How serious one finding is (Distribution §16). Three states, deliberately
 * not a separate health-state subsystem.
 */
export const DOCTOR_STATUSES = ["healthy", "warning", "action-required"] as const;
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];

export interface DoctorCheck {
  /** Short stable name, e.g. `package-manager` or `lock-drift`. */
  readonly name: string;
  readonly status: DoctorStatus;
  readonly detail: string;
  /**
   * A command that deterministically corrects this finding. Absent when no
   * single command does, because `doctor` must not invent remediation.
   */
  readonly remediation?: string;
  readonly problems?: readonly Problem[];
}

export interface DoctorReport {
  readonly root: string;
  /** The worst status among the checks. */
  readonly status: DoctorStatus;
  readonly runtime: string;
  readonly checks: readonly DoctorCheck[];
}

const RANK: Readonly<Record<DoctorStatus, number>> = {
  healthy: 0,
  warning: 1,
  "action-required": 2,
};

function worst(checks: readonly DoctorCheck[]): DoctorStatus {
  return checks.reduce<DoctorStatus>(
    (acc, check) => (RANK[check.status] > RANK[acc] ? check.status : acc),
    "healthy",
  );
}

/**
 * `pactwright doctor` (Distribution §16): read-only diagnostics of the
 * distribution and execution environment. It mutates nothing and never runs
 * the remediation it names.
 *
 * External Production Skills imports are reported as unsupported by this
 * release rather than ignored or claimed to resolve: their resolver is
 * Checkpoint 5 work.
 */
export function doctor(root: string = process.cwd()): DoctorReport {
  const paths = projectPaths(root);
  const checks: DoctorCheck[] = [];
  const runtime = runtimeVersion();

  // --- package manager -------------------------------------------------
  const pm = detectPackageManager(paths.root);
  if (pm.value === undefined) {
    checks.push({
      name: "package-manager",
      status: "warning",
      detail: pm.problems.map((p) => p.message).join("; "),
      problems: pm.problems,
    });
  } else {
    const declared = pm.value.source === "declared";
    checks.push({
      name: "package-manager",
      status: "healthy",
      detail: `${pm.value.name}${pm.value.version === undefined ? "" : `@${pm.value.version}`} (${declared ? "declared in package.json" : `inferred from ${pm.value.lockFile ?? "lock file"}`})`,
    });
    if (!declared) {
      checks.push({
        name: "package-manager-declaration",
        status: "warning",
        detail: `package.json declares no "packageManager"; upgrades infer ${pm.value.name} from lock-file state`,
      });
    }
  }

  // --- configuration ---------------------------------------------------
  let project: Project | undefined;
  try {
    project = loadProject({ root: paths.root });
    checks.push({
      name: "configuration",
      status: "healthy",
      detail: `configuration, lifecycle (version ${LIFECYCLE_VERSION}) and lock load through the canonical path`,
    });
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    const migration = error.problems.some((p) => p.code === "lifecycle-needs-migration");
    checks.push({
      name: "configuration",
      status: "action-required",
      detail: migration
        ? "lifecycle.yml predates the shape model and needs migrating"
        : "the project does not load",
      ...(migration ? { remediation: "pactwright upgrade" } : {}),
      problems: error.problems,
    });
    // Nothing below can be judged without a loaded project.
    return { root: paths.root, status: worst(checks), runtime, checks };
  }

  // --- runtime vs lock -------------------------------------------------
  checks.push({
    name: "runtime",
    status: project.lock.runtime.version === runtime ? "healthy" : "action-required",
    detail:
      project.lock.runtime.version === runtime
        ? `runtime ${runtime} matches the lock`
        : `lock records runtime ${project.lock.runtime.version}, running ${runtime}`,
    ...(project.lock.runtime.version === runtime ? {} : { remediation: "pactwright upgrade" }),
  });

  // --- capabilities ----------------------------------------------------
  try {
    assertPackComplete(project);
    checks.push({
      name: "capabilities",
      status: "healthy",
      detail: `agent pack "${project.lock.agentPack.name}@${project.lock.agentPack.version}" provides every required capability`,
    });
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    checks.push({
      name: "capabilities",
      status: "action-required",
      detail: error.message,
      remediation: "pactwright agent-pack use <source>",
      problems: error.problems,
    });
  }

  // --- lock agreement and drift ----------------------------------------
  const agreement = checkEnvironmentAgreement(project);
  if (agreement.ok) {
    checks.push({
      name: "lock-agreement",
      status: "healthy",
      detail: `environment_lock_hash ${environmentLockHash(project.lock)}`,
    });
  } else {
    const runtimeOnly = agreement.problems.every((p) => p.code === "lock-runtime-mismatch");
    checks.push({
      name: "lock-agreement",
      status: "action-required",
      detail: agreement.problems.map((p) => p.message).join("; "),
      remediation: runtimeOnly ? "pactwright upgrade" : "pactwright agent-pack upgrade",
      problems: agreement.problems,
    });
  }

  // --- extension compatibility -----------------------------------------
  const enabled = project.extensions.filter((extension) => extension.config.enabled);
  checks.push({
    name: "extensions",
    status: "healthy",
    detail:
      enabled.length === 0
        ? "no extensions are enabled"
        : `${enabled.length} enabled: ${enabled.map((e) => `${e.manifest.id}@${e.manifest.version}`).join(", ")}`,
  });

  // --- generated drift --------------------------------------------------
  checks.push(generatedDrift(project));

  // --- unsupported Production Skills imports ----------------------------
  const imports = productionSkillImports(paths.root);
  if (imports.length > 0) {
    checks.push({
      name: "production-skills",
      status: "warning",
      detail: `${imports.length} external Production Skills import${imports.length === 1 ? "" : "s"} configured (${imports.join(", ")}); resolving them is not supported by this release and arrives in Checkpoint 5`,
    });
  }

  // --- validation -------------------------------------------------------
  const validation = validateProject({ root: paths.root });
  checks.push({
    name: "validation",
    status: validation.ok ? "healthy" : "action-required",
    detail: validation.ok
      ? "the Project Graph satisfies the complete validation contract"
      : `${validation.problems.length} validation problem${validation.problems.length === 1 ? "" : "s"} (${validation.rules.join(", ")})`,
    ...(validation.ok ? {} : { remediation: "pactwright validate", problems: validation.problems }),
  });

  return { root: paths.root, status: worst(checks), runtime, checks };
}

/** Whether the generated adapter surface still matches what sync would render. */
function generatedDrift(project: Project): DoctorCheck {
  let rendered;
  try {
    rendered = renderClaudeCodeAdapter(assertPackComplete(project));
  } catch {
    return {
      name: "generated-drift",
      status: "warning",
      detail: "the adapter surface cannot be rendered, so drift cannot be judged",
    };
  }
  const drifted: string[] = [];
  for (const [relPath, content] of rendered) {
    const target = join(project.paths.root, relPath);
    if (!existsSync(target)) {
      drifted.push(`${relPath} (missing)`);
      continue;
    }
    const actual = readFileSync(target, "utf8");
    if (actual === content) continue;
    // A file the user took ownership of is not drift; sync reports it and
    // leaves it alone, so doctor does the same.
    drifted.push(isGenerated(target) ? `${relPath} (stale)` : `${relPath} (user-authored)`);
  }
  if (drifted.length === 0) {
    return {
      name: "generated-drift",
      status: "healthy",
      detail: `${rendered.size} generated files match the resolved environment`,
    };
  }
  return {
    name: "generated-drift",
    status: "action-required",
    detail: `generated integration differs from the resolved environment: ${drifted.join(", ")}`,
    remediation: "pactwright sync",
  };
}

/**
 * External Production Skills imports declared in the Pactwright integration
 * manifest. Reading the declaration is all this release does: resolving
 * these imports is Checkpoint 5 work, and claiming otherwise would
 * misreport the installed capability boundary.
 */
function productionSkillImports(root: string): readonly string[] {
  const manifest = join(root, "pactwright.yml");
  if (!existsSync(manifest)) return [];
  const read = readYamlFile(manifest);
  if (read.problems.length > 0) return [];
  const value = read.value;
  if (typeof value !== "object" || value === null) return [];
  const skills = (value as { production_skills?: unknown }).production_skills;
  if (!Array.isArray(skills)) return [];
  return skills
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : typeof (entry as { source?: unknown }).source === "string"
          ? (entry as { source: string }).source
          : undefined,
    )
    .filter((entry): entry is string => entry !== undefined);
}

/** Human-readable `doctor` output. */
export function formatDoctor(report: DoctorReport): string {
  const lines = [`Pactwright ${report.runtime} — ${report.status}`, ""];
  for (const check of report.checks) {
    lines.push(`  [${check.status}] ${check.name}: ${check.detail}`);
    if (check.remediation !== undefined) lines.push(`      run: ${check.remediation}`);
    for (const problem of check.problems ?? []) lines.push(`      - ${formatProblem(problem)}`);
  }
  return `${lines.join("\n")}\n`;
}

export { loadConfig };
