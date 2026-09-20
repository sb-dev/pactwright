import { spawnSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync } from "node:fs";
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
import {
  applyEnvironmentPlan,
  planEnvironmentChange,
  type PackageInstaller,
} from "./environment/transaction.js";
import {
  selectTarget,
  type PackageView,
  type SelectedTarget,
} from "./environment/select-target.js";
import { withRepositoryLock } from "./graph/writer-lock.js";
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
  /**
   * Lists the runtime versions the registry publishes. Injected so tests
   * never reach one; the default asks the project's package manager.
   */
  readonly view?: PackageView;
}

export type { PackageInstaller };

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
  /**
   * Whether the previous environment was put back, *verified* rather than
   * asserted (§6). This used to be a literal the code set when it believed it
   * had restored: it reported `true` after restoring four files while the
   * installer's changes to the package-manager lock, and the newly installed
   * runtime itself, remained in place.
   */
  readonly restored?: boolean;
  /** What a human must do when restoration could not be completed. */
  readonly recovery?: readonly string[];
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

/**
 * The default installer: delegates package replacement to the package
 * manager.
 *
 * Without a `spec` it runs a plain install, which brings `node_modules` back
 * in line with whatever `package.json` and the manager's own lock now say.
 * That is how the environment transaction undoes an install once it has put
 * both files back — still the package manager doing the work, so Pactwright
 * never becomes a second one (Distribution §15, §25).
 */
export const packageManagerInstaller: PackageInstaller = ({ root, manager, spec }) => {
  const args =
    spec === undefined
      ? ["install"]
      : manager === "npm"
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
  // Select before installing (Distribution §15 step 1, R09). `@latest` used
  // to be handed straight to the package manager, so the target was
  // whatever the registry happened to publish and compatibility was
  // discovered — if at all — after the replacement.
  let spec: string;
  if (target !== undefined) {
    spec = `${RUNTIME_PACKAGE}@${target}`;
  } else {
    const selected = selectTarget(
      { kind: "runtime", name: RUNTIME_PACKAGE },
      undefined,
      { runtimeVersion: from },
      { manager, ...(options.view === undefined ? {} : { view: options.view }) },
    );
    if (Array.isArray(selected)) return failure(paths.root, from, selected as readonly Problem[]);
    spec = `${RUNTIME_PACKAGE}@${(selected as SelectedTarget).version}`;
  }

  // The first of the upgrade's two transactions. The second runs inside
  // `finishUpgrade`, in the *newly installed* runtime, because Distribution
  // §15 requires migration, locking, sync and validation to happen there —
  // and a transaction cannot span a process boundary. This one therefore
  // owns the package replacement and nothing else, and holds no writer lock
  // while it spawns the child, which would otherwise block the child for its
  // full wait and then fail it.
  const install = options.install ?? packageManagerInstaller;
  const plan = planEnvironmentChange(paths.root, {
    installs: [{ name: RUNTIME_PACKAGE, spec }],
  });

  let installed: string | undefined;
  const { result } = applyEnvironmentPlan(
    plan,
    () => {
      const installProblems = install({ root: paths.root, manager, spec });
      if (installProblems.length > 0)
        return { ok: false, value: undefined, problems: installProblems };

      installed = installedVersion(paths.root, RUNTIME_PACKAGE);
      if (installed === undefined) {
        return {
          ok: false,
          value: undefined,
          problems: [
            {
              code: "runtime-not-installed",
              message: `${manager} reported success but ${RUNTIME_PACKAGE} is not installed`,
              path: paths.root,
            },
          ],
        };
      }

      // The new runtime does the rest, under its own transaction and its own
      // writer lock. A failure there has already restored the child's managed
      // set, so this one only has to undo the package replacement.
      const reenter = options.reenter ?? cliReentry;
      const reentryProblems = reenter({ root: paths.root, version: installed });
      if (reentryProblems.length > 0) {
        return { ok: false, value: undefined, problems: reentryProblems };
      }
      return { ok: true, value: undefined };
    },
    { installer: install },
  );

  if (!result.ok) {
    return {
      ...failure(paths.root, from, result.problems),
      restored: result.restored,
      ...(result.recovery === undefined ? {} : { recovery: result.recovery }),
    };
  }

  return {
    ok: true,
    root: paths.root,
    from,
    to: installed!,
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
  const migrations: string[] = [];
  const plan = planEnvironmentChange(paths.root);

  // The upgrade's second transaction, and the one that touches canonical
  // configuration — so it takes the writer lock. The first transaction, in
  // the old runtime, deliberately holds no lock while it spawns this
  // process; taking it here rather than there is what keeps the two from
  // deadlocking across that boundary.
  const { value, result } = applyEnvironmentPlan(plan, () =>
    withRepositoryLock(paths.root, () => {
      const migrated = migrateLifecycle(paths.lifecycle);
      if (migrated.problems.length > 0) {
        return { ok: false, value: undefined, problems: migrated.problems };
      }
      if (migrated.applied) migrations.push(`lifecycle.yml -> version ${LIFECYCLE_VERSION}`);

      const config = loadConfig(paths.config);
      if (config.value === undefined) {
        return { ok: false, value: undefined, problems: config.problems };
      }
      // A scaffold has no pack to re-lock; the runtime upgrade still stands.
      if (config.value.agentPack === undefined) return { ok: true, value: [] as string[] };

      const resolved = resolveDesiredState({ root: paths.root, config: config.value });
      if (resolved.value === undefined) {
        return { ok: false, value: undefined, problems: resolved.problems };
      }
      const temp = tempSibling(paths.lock);
      writeFileSync(temp, serialiseLock(resolved.value.lock), "utf8");
      renameSync(temp, paths.lock);

      const synced = syncProject(paths.root);
      if (!synced.ok) return { ok: false, value: undefined, problems: synced.problems };
      const validation = validateProject({ root: paths.root });
      if (!validation.ok) return { ok: false, value: undefined, problems: validation.problems };
      return { ok: true, value: synced.changed };
    }),
  );

  if (!result.ok) {
    return {
      ...failure(paths.root, from, result.problems),
      restored: result.restored,
      ...(result.recovery === undefined ? {} : { recovery: result.recovery }),
    };
  }

  return {
    ok: true,
    root: paths.root,
    from,
    to: from,
    unchanged: false,
    migrations,
    synced: value ?? [],
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
