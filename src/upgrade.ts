import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempSibling } from "./atomic.js";
import { loadConfig } from "./config/config.js";
import { LIFECYCLE_VERSION, migrateLifecycleV1 } from "./config/lifecycle.js";
import {
  detectPackageManager,
  installedVersion,
  type PackageManager,
} from "./config/package-manager.js";
import type { Problem } from "./errors.js";
import { projectPaths } from "./project.js";
import { resolveDesiredState, serialiseLock } from "./pack/resolve.js";
import { syncProject } from "./sync.js";
import { validateProject } from "./validate.js";
import { RUNTIME_PACKAGE, runtimeVersion } from "./version.js";
import { readYamlFile } from "./yaml.js";

export { RUNTIME_PACKAGE };

export interface UpgradeOptions {
  /** An explicit target release, for a forward upgrade or a rollback. */
  readonly to?: string;
  /**
   * Runs the package manager. Injected so tests can drive the whole flow
   * against packed fixture runtimes without reaching the network.
   */
  readonly install?: PackageInstaller;
  /**
   * Re-enters through the newly installed runtime. Spec 02 §15 requires
   * migration, locking, sync and validation to be performed by the *new*
   * runtime, not the old one that started the upgrade.
   */
  readonly reenter?: Reentry;
}

/** Replaces the runtime package. Returns problems rather than throwing. */
export type PackageInstaller = (request: {
  readonly root: string;
  readonly manager: PackageManager;
  readonly spec: string;
}) => readonly Problem[];

/** Runs `pactwright upgrade --finish` through the newly installed runtime. */
export type Reentry = (request: {
  readonly root: string;
  readonly version: string;
}) => readonly Problem[];

export interface UpgradeReport {
  readonly ok: boolean;
  readonly root: string;
  readonly from: string;
  /** The release upgraded to, when the operation succeeded. */
  readonly to?: string;
  readonly manager?: PackageManager;
  readonly unchanged: boolean;
  /** Migrations the new runtime ran, in order. */
  readonly migrations: readonly string[];
  readonly synced: readonly string[];
  /** Set when the previous environment had to be restored. */
  readonly restored?: true;
  readonly problems: readonly Problem[];
}

function failure(
  root: string,
  from: string,
  problems: readonly Problem[],
  restored = false,
): UpgradeReport {
  return {
    ok: false,
    root,
    from,
    unchanged: true,
    migrations: [],
    synced: [],
    ...(restored ? { restored: true as const } : {}),
    problems,
  };
}

/** The default installer: delegates package replacement to the package manager. */
export const packageManagerInstaller: PackageInstaller = ({ root, manager, spec }) => {
  const args =
    manager === "npm"
      ? ["install", "--save-dev", spec]
      : manager === "yarn"
        ? ["add", "--dev", spec]
        : ["add", "-D", spec];
  const result = spawnSync(manager, args, { cwd: root, encoding: "utf8", timeout: 300_000 });
  if (result.error !== undefined) {
    return [
      {
        code: "package-manager-failed",
        message: `could not run ${manager}: ${result.error.message}`,
        path: root,
      },
    ];
  }
  if (result.status !== 0) {
    return [
      {
        code: "package-manager-failed",
        message: `${manager} ${args.join(" ")} exited ${result.status ?? "with a signal"}: ${(result.stderr ?? "").trim() || "no output"}`,
        path: root,
      },
    ];
  }
  return [];
};

/**
 * The default re-entry: runs the freshly installed runtime's own CLI so
 * migration, locking, sync and validation happen under the new code, as
 * Distribution §15 requires.
 */
export const cliReentry: Reentry = ({ root }) => {
  const bin = join(root, "node_modules", ".bin", RUNTIME_PACKAGE);
  if (!existsSync(bin)) {
    return [
      {
        code: "reentry-unavailable",
        message: `the newly installed runtime was not found at ${bin}`,
        path: root,
      },
    ];
  }
  const result = spawnSync(bin, ["upgrade", "--finish"], {
    cwd: root,
    encoding: "utf8",
    timeout: 300_000,
  });
  if (result.status === 0) return [];
  return [
    {
      code: "reentry-failed",
      message: `the new runtime could not complete the upgrade: ${(result.stderr ?? "").trim() || (result.stdout ?? "").trim() || "no output"}`,
      path: root,
    },
  ];
};

/** Snapshots the files an upgrade may change, so a failure can restore them. */
function snapshot(root: string): { restore: () => void } {
  const paths = projectPaths(root);
  const files = [paths.config, paths.lifecycle, paths.lock, join(root, "package.json")];
  const before = files.map(
    (file) => [file, existsSync(file) ? readFileSync(file, "utf8") : undefined] as const,
  );
  return {
    restore: () => {
      for (const [file, content] of before) {
        if (content === undefined) {
          rmSync(file, { force: true });
          continue;
        }
        const temp = tempSibling(file);
        writeFileSync(temp, content, "utf8");
        renameSync(temp, file);
      }
    },
  };
}

/**
 * `pactwright upgrade` / `pactwright upgrade --to <version>` (Distribution
 * §15). Pactwright never becomes a second package manager: it detects the
 * project's, delegates package replacement to it, then re-enters through the
 * newly installed runtime to migrate, re-lock, sync and validate.
 *
 * The runtime is upgraded and nothing else. Agent Pack and Extension
 * constraints stay authoritative, so this never silently moves their
 * identities.
 */
export function upgradeRuntime(
  root: string = process.cwd(),
  options: UpgradeOptions = {},
): UpgradeReport {
  const paths = projectPaths(root);
  const from = runtimeVersion();

  const detected = detectPackageManager(paths.root);
  if (detected.value === undefined) return failure(paths.root, from, detected.problems);
  const manager = detected.value.name;

  const target = options.to;
  if (target !== undefined && !/^\d+\.\d+\.\d+$/.test(target)) {
    return failure(paths.root, from, [
      {
        code: "invalid-target",
        message: `"${target}" is not an exact x.y.z release; --to takes an exact forward or rollback target`,
        path: paths.root,
      },
    ]);
  }
  const spec = target === undefined ? `${RUNTIME_PACKAGE}@latest` : `${RUNTIME_PACKAGE}@${target}`;

  const taken = snapshot(paths.root);
  const install = options.install ?? packageManagerInstaller;
  const installProblems = install({ root: paths.root, manager, spec });
  if (installProblems.length > 0) {
    taken.restore();
    return failure(paths.root, from, installProblems, true);
  }

  const installed = installedVersion(paths.root, RUNTIME_PACKAGE);
  if (installed === undefined) {
    taken.restore();
    return failure(
      paths.root,
      from,
      [
        {
          code: "runtime-not-installed",
          message: `${manager} reported success but ${RUNTIME_PACKAGE} is not installed`,
          path: paths.root,
        },
      ],
      true,
    );
  }

  const reenter = options.reenter ?? cliReentry;
  const reentryProblems = reenter({ root: paths.root, version: installed });
  if (reentryProblems.length > 0) {
    // The canonical graph is never touched by the upgrade itself, and the
    // previous package/config/lock state is restored, so the project can run
    // on — or explicitly target — the runtime it had.
    taken.restore();
    return failure(paths.root, from, reentryProblems, true);
  }

  return {
    ok: true,
    root: paths.root,
    from,
    to: installed,
    manager,
    unchanged: installed === from,
    migrations: [],
    synced: [],
    problems: [],
  };
}

/**
 * The second half of an upgrade, run *by the newly installed runtime*
 * (`pactwright upgrade --finish`): migrate canonical configuration, re-lock,
 * sync and validate. Splitting it here is what makes "performed by the new
 * runtime, not the old one" true rather than claimed.
 */
export function finishUpgrade(root: string = process.cwd()): UpgradeReport {
  const paths = projectPaths(root);
  const from = runtimeVersion();
  const taken = snapshot(paths.root);
  const migrations: string[] = [];

  const migrated = migrateLifecycle(paths.lifecycle);
  if (migrated.problems.length > 0) {
    taken.restore();
    return failure(paths.root, from, migrated.problems, true);
  }
  if (migrated.applied) migrations.push(`lifecycle.yml -> version ${LIFECYCLE_VERSION}`);

  const config = loadConfig(paths.config);
  if (config.value === undefined) {
    taken.restore();
    return failure(paths.root, from, config.problems, true);
  }
  // A scaffold has no pack to re-lock; the runtime upgrade still stands.
  if (config.value.agentPack !== undefined) {
    const resolved = resolveDesiredState({ root: paths.root, config: config.value });
    if (resolved.value === undefined) {
      taken.restore();
      return failure(paths.root, from, resolved.problems, true);
    }
    const temp = tempSibling(paths.lock);
    writeFileSync(temp, serialiseLock(resolved.value.lock), "utf8");
    renameSync(temp, paths.lock);

    const synced = syncProject(paths.root);
    if (!synced.ok) {
      taken.restore();
      return failure(paths.root, from, synced.problems, true);
    }
    const validation = validateProject({ root: paths.root });
    if (!validation.ok) {
      taken.restore();
      return failure(paths.root, from, validation.problems, true);
    }
    return {
      ok: true,
      root: paths.root,
      from,
      to: from,
      unchanged: false,
      migrations,
      synced: synced.changed,
      problems: [],
    };
  }

  return {
    ok: true,
    root: paths.root,
    from,
    to: from,
    unchanged: false,
    migrations,
    synced: [],
    problems: [],
  };
}

/**
 * Migrates `.pactwright/lifecycle.yml` to the current version. Versioned and
 * explicit: a version 1 seven-stage document becomes a version 2
 * responsibilities-plus-shape document with its policy preserved, and
 * anything else is left exactly as it is.
 */
function migrateLifecycle(path: string): {
  readonly applied: boolean;
  readonly problems: readonly Problem[];
} {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { applied: false, problems: read.problems };
  const value = read.value;
  if (typeof value !== "object" || value === null) return { applied: false, problems: [] };
  if ((value as { version?: unknown }).version !== 1) return { applied: false, problems: [] };

  const migrated = migrateLifecycleV1(value, path);
  if (migrated.value === undefined) return { applied: false, problems: migrated.problems };
  const temp = tempSibling(path);
  writeFileSync(temp, serialiseLifecycle(migrated.value), "utf8");
  renameSync(temp, path);
  return { applied: true, problems: [] };
}

/** Renders a version 2 lifecycle document. */
function serialiseLifecycle(lifecycle: {
  readonly responsibilities: Readonly<
    Record<string, { readonly execution: string; readonly actor?: string }>
  >;
  readonly shape: {
    readonly id: string;
    readonly steps: readonly {
      readonly name: string;
      readonly kind: string;
      readonly execution: string;
      readonly actor?: string;
    }[];
    readonly transitions: readonly {
      readonly from: string;
      readonly to: string;
      readonly maxIterations?: number;
    }[];
  };
}): string {
  const lines = [`version: ${LIFECYCLE_VERSION}`, "", "responsibilities:"];
  for (const [name, policy] of Object.entries(lifecycle.responsibilities)) {
    lines.push(`  ${name}:`, `    execution: ${policy.execution}`);
    if (policy.actor !== undefined) lines.push(`    actor: ${policy.actor}`);
  }
  lines.push("", "shape:", `  id: ${lifecycle.shape.id}`, "  steps:");
  for (const step of lifecycle.shape.steps) {
    lines.push(
      `    - name: ${step.name}`,
      `      kind: ${step.kind}`,
      `      execution: ${step.execution}`,
    );
    if (step.actor !== undefined) lines.push(`      actor: ${step.actor}`);
  }
  if (lifecycle.shape.transitions.length === 0) {
    lines.push("  transitions: []");
  } else {
    lines.push("  transitions:");
    for (const transition of lifecycle.shape.transitions) {
      lines.push(`    - from: ${transition.from}`, `      to: ${transition.to}`);
      if (transition.maxIterations !== undefined) {
        lines.push(`      max_iterations: ${transition.maxIterations}`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}
