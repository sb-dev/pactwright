import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { tempSibling } from "../atomic.js";
import {
  loadConfig,
  rewriteConfig,
  type ConfigExtension,
  type PactwrightConfig,
} from "../config/config.js";
import { EXTENSION_ID_PATTERN, loadLock, type LockExtension } from "../config/lock.js";
import {
  applyEnvironmentPlan,
  planEnvironmentChange,
  type TransactionBody,
} from "../environment/transaction.js";
import type { Problem } from "../errors.js";
import { detectPackageManager } from "../config/package-manager.js";
import { isPathSource, locatePackage } from "../pack/locate.js";
import {
  selectTarget,
  type PackageView,
  type SelectedTarget,
} from "../environment/select-target.js";
import { runtimeVersion } from "../version.js";
import { packageManagerInstaller, type PackageInstaller } from "../upgrade.js";
import { resolveDesiredState, serialiseLock } from "../pack/resolve.js";
import { projectPaths } from "../project.js";
import { validateProject } from "../validate.js";
import { loadExtensionManifest } from "./manifest.js";
import { applyMigration, planMigration, writeMigration } from "./migrate.js";
import { resolveExtensionsBestEffort, type ResolvedExtension } from "./resolve.js";
import { loadNodes } from "../graph/nodes.js";

/** One extension the operation touched. */
export interface ExtensionChange {
  readonly id: string;
  readonly action: "added" | "removed" | "upgraded" | "unchanged";
  readonly version?: string;
  readonly previousVersion?: string;
}

/** Result of `pactwright extension add|remove|upgrade`. */
export interface ExtensionChangeReport {
  /** Packages this operation installed through the project package manager. */
  readonly installed?: readonly string[];
  readonly ok: boolean;
  readonly root: string;
  readonly changes: readonly ExtensionChange[];
  /**
   * GitHub profiles declared by newly added extensions. Reported only:
   * provisioning does not exist in this checkpoint, and `github.enabled`
   * controls whether it ever runs.
   */
  readonly githubProfiles: readonly string[];
  /**
   * Paths of canonical records that stayed on disk after a removal. Removal
   * never deletes user-authored extension graph data; the user chooses
   * separately whether to delete it.
   */
  readonly preserved: readonly string[];
  readonly problems: readonly Problem[];
}

const failure = (root: string, problems: readonly Problem[]): ExtensionChangeReport => ({
  ok: false,
  root,
  changes: [],
  githubProfiles: [],
  preserved: [],
  problems,
});

/**
 * `add project-intelligence` resolves `@pactwright/project-intelligence`;
 * the explicit package form is also valid (Distribution §4).
 */
function parseSpec(spec: string): { id: string; source: string } | Problem {
  if (spec.startsWith("@")) {
    const slash = spec.indexOf("/");
    const id = slash === -1 ? "" : spec.slice(slash + 1);
    if (!EXTENSION_ID_PATTERN.test(id)) {
      return {
        code: "invalid-extension-id",
        message: `"${spec}" does not name an extension: the part after "/" must be a valid extension id`,
      };
    }
    return { id, source: spec };
  }
  if (!EXTENSION_ID_PATTERN.test(spec)) {
    return { code: "invalid-extension-id", message: `"${spec}" is not a valid extension id` };
  }
  return { id: spec, source: `@pactwright/${spec}` };
}

function withExtensions(
  config: PactwrightConfig,
  extensions: Readonly<Record<string, ConfigExtension>>,
): PactwrightConfig {
  return { ...config, extensions };
}

/**
 * Writes config and lock atomically (temp sibling + rename, config first).
 * `config` is `undefined` when only the lock changes, so desired state is
 * left exactly as the user wrote it. Returns a Problem rather than throwing
 * when either file is absent, keeping the result idiom the callers rely on.
 *
 * It no longer carries a restore handle. Restoration belongs to the
 * environment transaction, whose managed set is larger than these two files
 * — this was one of the four private snapshot routines that each owned a
 * different subset (§6).
 */
function writeDesiredState(
  root: string,
  config: PactwrightConfig | undefined,
  lockText: string,
): undefined | Problem {
  const paths = projectPaths(root);
  let previousConfig: string;
  try {
    previousConfig = readFileSync(paths.config, "utf8");
    // Read to prove it exists: the write below replaces it wholesale, and a
    // lock that is not there is a broken project rather than a first write.
    readFileSync(paths.lock, "utf8");
  } catch (error) {
    const path = (error as NodeJS.ErrnoException).path ?? paths.lock;
    return { code: "missing-file", message: "file not found", path };
  }
  const writeAll = (entries: readonly (readonly [string, string])[]): void => {
    for (const [target, content] of entries) {
      const temp = tempSibling(target);
      writeFileSync(temp, content, "utf8");
      renameSync(temp, target);
    }
  };

  const written: (readonly [string, string])[] = [];
  if (config !== undefined) {
    // Only the `extensions:` block ever changes, so the rest of the file —
    // including whatever the team wrote in comments — is carried across.
    written.push([paths.config, rewriteConfig(previousConfig, config)]);
  }
  written.push([paths.lock, lockText]);

  writeAll(written);
  return undefined;
}

/**
 * Enables an extension (Distribution §4): resolve the package, resolve and
 * enable missing dependencies first, validate the complete required
 * capability union, then record the exact state in config and lock. Fails
 * before any write when compatibility is incomplete; rolls both files back
 * if the resulting project state does not validate.
 *
 * "Missing" means not enabled, not merely absent: a dependency the
 * configuration already names but has disabled is enabled too. So adding an
 * extension that is itself already enabled still repairs a disabled
 * dependency underneath it, at any depth, and reports what it enabled rather
 * than `unchanged`.
 *
 * Because the walk crosses already-enabled dependencies to reach what is
 * below them, an add whose enabled dependency is itself broken reports that
 * problem rather than `unchanged`. The write would have failed on it anyway;
 * saying so up front is the more truthful answer.
 */
export interface AddExtensionOptions {
  /**
   * Replaces a package the project does not have. Installation is delegated
   * to the project package manager (Distribution §10); Pactwright never
   * becomes a second installer. Injected so tests drive the whole flow
   * without the network.
   */
  readonly install?: PackageInstaller;
  /**
   * When false, a package that is not installed is reported rather than
   * installed. `extension add` installs; a plain `sync` must not.
   */
  readonly allowInstall?: boolean;
}

/**
 * `ids` in dependency-first order: a dependency before anything that needs
 * it, ties broken alphabetically so the result is deterministic.
 *
 * This is the order Distribution §10 asks for. It is decided here, after
 * every manifest has been read, rather than during the walk — where the
 * dependencies are not yet knowable.
 */
function dependencyFirst(
  ids: readonly string[],
  dependencies: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  const wanted = new Set(ids);
  const ordered: string[] = [];
  const placed = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string): void => {
    if (placed.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const dep of [...(dependencies.get(id) ?? [])].sort()) {
      if (wanted.has(dep)) visit(dep);
    }
    visiting.delete(id);
    placed.add(id);
    ordered.push(id);
  };
  for (const id of [...ids].sort()) visit(id);
  return ordered;
}

export function addExtension(
  root: string,
  spec: string,
  options: AddExtensionOptions = {},
): ExtensionChangeReport {
  const paths = projectPaths(root);
  const parsed = parseSpec(spec);
  if ("code" in parsed) return failure(paths.root, [parsed]);

  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);

  // The whole operation, including the install walk, runs inside one
  // transaction. It used to install packages during the walk and snapshot
  // only afterwards, so a dependency install that failed part-way left
  // `package.json` and the package-manager lock carrying packages no
  // configuration named (R07).
  const plan = planEnvironmentChange(paths.root);
  const { value, result } = applyEnvironmentPlan(
    plan,
    (about) => addWithin(paths, config.value!, parsed, options, about),
    { installer: options.install ?? packageManagerInstaller },
  );
  if (!result.ok) return failure(paths.root, result.problems);
  return value;
}

function addWithin(
  paths: ReturnType<typeof projectPaths>,
  configured: PactwrightConfig,
  parsed: { id: string; source: string },
  options: AddExtensionOptions,
  about: TransactionBody,
): { ok: boolean; value: ExtensionChangeReport; problems?: readonly Problem[] } {
  const config = { value: configured };
  const proposed: Record<string, ConfigExtension> = { ...configured.extensions };
  const added: string[] = [];
  const problems: Problem[] = [];

  // Enable the requested extension, then walk its manifest dependencies and
  // enable every one that is not already enabled — whether it is absent from
  // the configuration or configured and disabled (Distribution §4). A
  // dependency the configuration already names is located by its recorded
  // source, never by the conventional package name: sources may be paths,
  // and resolution treats a divergence as `extension-package-mismatch`. An
  // unconfigured dependency falls back to `@pactwright/<id>`.
  //
  // `visited` makes termination independent of the enabled flags, so a
  // dependency cycle among configured extensions stops here; reporting the
  // cycle stays with `resolveDesiredState` below.
  const queue: Array<{ id: string; source: string }> = [parsed];
  const visited = new Set<string>();
  /** Packages this operation installed, so a failure can report them. */
  const installedPackages: string[] = [];
  /** id → its manifest dependencies, for the post-order sort. */
  const dependenciesOf = new Map<string, readonly string[]>();
  while (queue.length > 0) {
    const { id, source } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const existing = Object.hasOwn(proposed, id) ? proposed[id] : undefined;
    let located = locatePackage(paths.root, existing?.source ?? source, "extension");
    if (typeof located !== "string" && located.code !== "pack-not-exported") {
      // Installed in discovery order, which is breadth-first from the
      // requested extension and so reaches a dependant before its
      // dependency. That is not a choice: an extension's dependencies are
      // declared in its manifest, and the manifest cannot be read until the
      // package is installed. The comment here used to claim the opposite.
      //
      // What Distribution §10 is about — a dependency being enabled and
      // locked before the dependant that needs it — is decided by `added`
      // below, which is ordered dependency-first once every manifest has
      // been read.
      about.installing(existing?.source ?? source);
      const installed = installPackage(paths.root, existing?.source ?? source, options);
      if (installed.length > 0) {
        problems.push(...installed);
        continue;
      }
      installedPackages.push(existing?.source ?? source);
      located = locatePackage(paths.root, existing?.source ?? source, "extension");
    }
    if (typeof located !== "string") {
      problems.push({
        ...located,
        code:
          located.code === "pack-not-exported" ? "extension-not-exported" : "extension-not-found",
      });
      continue;
    }
    const manifest = loadExtensionManifest(located);
    if (manifest.value === undefined) {
      problems.push(...manifest.problems);
      continue;
    }
    if (existing === undefined) {
      proposed[id] = { enabled: true, source };
      added.push(id);
    } else if (!existing.enabled) {
      proposed[id] = { ...existing, enabled: true };
      added.push(id);
    }
    dependenciesOf.set(id, manifest.value.dependencies);
    // Every dependency is enqueued, enabled or not: stopping at an enabled one
    // would hide whatever sits beneath it, and a disabled dependency two hops
    // down is exactly what needs repairing. `visited` is what bounds the walk.
    for (const dep of manifest.value.dependencies) {
      const configured = Object.hasOwn(proposed, dep) ? proposed[dep] : undefined;
      queue.push({ id: dep, source: configured?.source ?? `@pactwright/${dep}` });
    }
  }
  if (problems.length > 0) {
    return { ok: false, value: failure(paths.root, problems), problems };
  }
  if (added.length === 0) {
    return {
      ok: true,
      value: {
        ok: true,
        root: paths.root,
        changes: [{ id: parsed.id, action: "unchanged" }],
        githubProfiles: [],
        preserved: [],
        problems: [],
      },
    };
  }

  const desired = resolveDesiredState({
    root: paths.root,
    config: withExtensions(config.value, proposed),
  });
  if (desired.value === undefined) {
    return { ok: false, value: failure(paths.root, desired.problems), problems: desired.problems };
  }

  const written = writeDesiredState(
    paths.root,
    withExtensions(config.value, proposed),
    serialiseLock(desired.value.lock),
  );
  if (written !== undefined) {
    return { ok: false, value: failure(paths.root, [written]), problems: [written] };
  }
  const report = validateProject({ root: paths.root });
  if (!report.ok) {
    return { ok: false, value: failure(paths.root, report.problems), problems: report.problems };
  }

  const byId = new Map(desired.value.extensions.map((e) => [e.id, e]));
  const success: ExtensionChangeReport = {
    ok: true,
    root: paths.root,
    ...(installedPackages.length === 0 ? {} : { installed: installedPackages.sort() }),
    changes: dependencyFirst(added, dependenciesOf).map((id) => ({
      id,
      action: "added",
      ...(byId.get(id) === undefined ? {} : { version: byId.get(id)!.manifest.version }),
    })),
    githubProfiles: dependencyFirst(added, dependenciesOf)
      .map((id) => byId.get(id)?.manifest.githubProfile)
      .filter((profile): profile is string => profile !== undefined)
      .sort(),
    preserved: [],
    problems: [],
  };
  return { ok: true, value: success };
}

/**
 * Installs one extension package through the project package manager.
 *
 * Only a package source ever reaches here: `locatePackage` resolves a path
 * source to a path without checking it exists, so a missing path-sourced
 * extension fails later on its absent manifest — which is right, because a
 * path source lives in the repository and is not something to fetch.
 */
function installPackage(
  root: string,
  source: string,
  options: AddExtensionOptions,
): readonly Problem[] {
  if (options.allowInstall === false) {
    return [
      {
        code: "extension-not-installed",
        message: `extension package "${source}" is not installed; run "pactwright extension add ${source}"`,
        path: root,
      },
    ];
  }
  const detected = detectPackageManager(root);
  if (detected.value === undefined) return detected.problems;
  const install = options.install ?? packageManagerInstaller;
  return install({ root, manager: detected.value.name, spec: source });
}

/**
 * Removes an extension (Distribution §4). Blocked while an enabled
 * extension still depends on it. Canonical graph data owned by the
 * extension is never deleted — it is reported as preserved, and the user
 * chooses separately whether to delete it.
 *
 * Removal is the remedy for a broken extension set, so nothing about that set
 * being broken may block it: the dependant scan runs best effort, and when the
 * remaining configuration still does not resolve the lock is derived from its
 * previous contents rather than re-resolved. Both degradations are reported.
 */
export function removeExtension(root: string, id: string): ExtensionChangeReport {
  const paths = projectPaths(root);
  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);
  if (!Object.hasOwn(config.value.extensions, id)) {
    return failure(paths.root, [
      { code: "extension-not-configured", message: `extension "${id}" is not configured` },
    ]);
  }

  // Deliberately best effort: `remove` is the remedy for a broken extension
  // set, so it must not be blocked by that set being broken. An extension
  // left incompatible by a runtime bump, or whose package was uninstalled,
  // fails every other command — including the remove that would fix it.
  // Nothing here decides the write: the proposed `resolveDesiredState` below
  // still refuses any state that does not resolve, so every blind spot in
  // this scan fails closed.
  const scan = resolveExtensionsBestEffort({ root: paths.root, config: config.value });
  const removed = scan.extensions.find((e) => e.id === id);
  const dependants = scan.extensions
    .filter((e) => e.id !== id && e.config.enabled && e.manifest.dependencies.includes(id))
    .map((e) => e.id)
    .sort();
  if (dependants.length > 0) {
    return failure(paths.root, [
      {
        code: "extension-required-by",
        message: `extension "${id}" cannot be removed: enabled extension${dependants.length === 1 ? "" : "s"} ${dependants.map((d) => `"${d}"`).join(", ")} still depend${dependants.length === 1 ? "s" : ""} on it`,
      },
    ]);
  }

  // Read before the write: `writeDesiredState` replaces the lock. When the
  // manifest could not be loaded the lock still records the exact version
  // that was resolved, so the report stays truthful.
  const previousLock = loadLock(paths.lock);
  const previousVersion = removed?.manifest.version ?? previousLock.value?.extensions[id]?.version;

  const proposed = { ...config.value.extensions };
  delete proposed[id];
  const desired = resolveDesiredState({
    root: paths.root,
    config: withExtensions(config.value, proposed),
  });

  // Resolving afresh is the happy path. When the state left behind still does
  // not resolve — a runtime bump breaks every extension at once, so removing
  // one of them cannot fix the others — fall back to the lock already on
  // disk, minus this entry. That lock is by definition the last state that
  // did resolve, so nothing is recorded that was never resolvable, and the
  // command that repairs a broken set stays available while the set is broken.
  const degraded: Problem[] = [];
  let lockText: string;
  if (desired.value !== undefined) {
    lockText = serialiseLock(desired.value.lock);
  } else if (previousLock.value !== undefined) {
    const rest = { ...previousLock.value.extensions };
    delete rest[id];
    lockText = serialiseLock({ ...previousLock.value, extensions: rest });
    degraded.push({
      code: "lock-not-re-resolved",
      message: `extension "${id}" was removed, but the remaining configuration does not resolve, so the lock was derived from its previous contents rather than re-resolved; fix the reported problems and run \`pactwright extension upgrade\` to re-lock`,
    });
  } else {
    return failure(paths.root, desired.problems);
  }

  // Wrapped, but with the validate step deliberately *advisory*: a removal
  // is expected to leave records the graph no longer recognises, so gating
  // the commit on `validate` would break the one command that repairs a
  // broken extension set. The transaction is here for the write itself —
  // a throw mid-write still puts the managed set back.
  const plan = planEnvironmentChange(paths.root);
  const { result } = applyEnvironmentPlan(plan, () => {
    const problem = writeDesiredState(
      paths.root,
      withExtensions(config.value!, proposed),
      lockText,
    );
    return problem === undefined
      ? { ok: true, value: undefined }
      : { ok: false, value: undefined, problems: [problem] };
  });
  if (!result.ok) return failure(paths.root, result.problems);

  // Preserved user-authored canonical data: records whose types the removed
  // extension registered. `pactwright validate` reports them as unknown
  // types until the user deletes them or re-enables the extension. The
  // restore handle is deliberately unused: a removal is *expected* to leave
  // records validate rejects, so `report.ok` is never consulted here.
  const ownedTypes = new Set(removed === undefined ? [] : removed.manifest.nodeTypes);
  const report = validateProject({ root: paths.root });
  const preserved =
    removed === undefined
      ? []
      : report.problems
          .map((p) => p.path)
          .filter((p): p is string => p !== undefined)
          .filter((p) => [...ownedTypes].some((type) => p.includes(`/${type}-`)))
          .sort();

  // `preserved` is defined by attribution, so with no manifest there is no
  // ownership fact and the only honest list is empty. A bare `[]` would read
  // as "nothing was left behind", which cannot be supported, so the removal
  // succeeds and says why the inventory is missing.
  return {
    ok: true,
    root: paths.root,
    changes: [
      {
        id,
        action: "removed",
        ...(previousVersion === undefined ? {} : { previousVersion }),
      },
    ],
    githubProfiles: [],
    preserved,
    problems: [
      ...(removed === undefined
        ? [
            {
              code: "extension-manifest-unavailable",
              message: `extension "${id}" was removed, but its manifest could not be read, so the records it owned could not be listed; run \`pactwright validate\` to see records left without a registered type`,
            },
          ]
        : []),
      ...degraded,
    ],
  };
}

/**
 * Upgrades an extension (Distribution §15): re-resolves the configured
 * package, validates the complete dependency graph and capability union,
 * and updates the lock. The configuration is desired state and does not
 * change; canonical Project Graph state is never reinterpreted.
 */
export interface UpgradeExtensionOptions {
  /** Installs the selected version. Injected so tests never reach a registry. */
  readonly install?: PackageInstaller;
  /** Lists published versions. Injected for the same reason. */
  readonly view?: PackageView;
  /**
   * The `pactwright` range a published version declares, without installing
   * it. A registry can answer this from published metadata; where it cannot,
   * leaving it out defers the check to resolution after the install, which
   * is what the transaction is there to undo.
   */
  readonly declaredRuntimeRange?: (version: string) => string | undefined;
}

/**
 * Selects a compatible published version, installs it, then re-resolves and
 * re-locks (Distribution §15 steps 1, 3 and 5).
 *
 * The compatibility check happens *before* the install: a version whose
 * declared `pactwright` range the running runtime does not satisfy is
 * refused rather than installed and then rejected, which is what §15 means
 * by failing clearly instead of substituting.
 */
function acquireTarget(
  root: string,
  id: string,
  source: string,
  options: UpgradeExtensionOptions,
  about: TransactionBody,
): readonly Problem[] {
  const detected = detectPackageManager(root);
  if (detected.value === undefined) return detected.problems;
  const manager = detected.value.name;

  const selected = selectTarget(
    { kind: "extension", name: source },
    // Extension configuration records a source, not a version range, so an
    // upgrade is unconstrained: the newest compatible published version.
    undefined,
    {
      runtimeVersion: runtimeVersion(),
      ...(options.declaredRuntimeRange === undefined
        ? {}
        : { declaredRuntimeRange: options.declaredRuntimeRange }),
    },
    { manager, ...(options.view === undefined ? {} : { view: options.view }) },
  );
  if (Array.isArray(selected)) {
    return (selected as readonly Problem[]).map((problem) => ({
      ...problem,
      message: `extension "${id}": ${problem.message}`,
    }));
  }

  const target = (selected as SelectedTarget).version;
  about.installing(source);
  const install = options.install ?? packageManagerInstaller;
  return install({ root, manager, spec: `${source}@${target}` });
}

/**
 * Runs the declared migrations that carry `id`'s records from the version the
 * lock records to the version the installed manifest declares.
 *
 * A no-op when they already agree, which is the ordinary case.
 */
function runMigration(
  root: string,
  id: string,
  next: ResolvedExtension | undefined,
  locked: LockExtension | undefined,
): readonly Problem[] {
  if (next === undefined) return [];
  const from = locked?.schemaVersion ?? 1;
  const plan = planMigration(id, from, next.manifest.schemaVersion, next.manifest.migrations);
  if (plan.problems.length > 0) return plan.problems;
  if (plan.steps.length === 0) return [];

  // Read with the plain node loader, not `loadProject`: the canonical path
  // validates against the *installed* manifest, and these records are by
  // definition still at the old schema.
  const loaded = loadNodes(projectPaths(root).nodesDir);
  if (loaded.problems.length > 0) return loaded.problems;
  const result = applyMigration(loaded.nodes, plan, new Set(next.manifest.nodeTypes));
  if (result.problems.length > 0) return result.problems;
  writeMigration(result);
  return [];
}

export function upgradeExtension(
  root: string,
  id: string,
  options: UpgradeExtensionOptions = {},
): ExtensionChangeReport {
  const paths = projectPaths(root);
  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);
  const configured = config.value.extensions[id];
  if (configured === undefined) {
    return failure(paths.root, [
      { code: "extension-not-configured", message: `extension "${id}" is not configured` },
    ]);
  }

  const previousLock = loadLock(paths.lock);
  const previousVersion = previousLock.value?.extensions[id]?.version;

  // §15 requires an upgrade to satisfy every enabled dependant *before* the
  // lock file changes, so a failed upgrade must leave no trace. The
  // transaction's managed set is what makes "no trace" cover more than the
  // lock: this used to restore two files and nothing else.
  const plan = planEnvironmentChange(paths.root);
  const { value, result } = applyEnvironmentPlan(
    plan,
    (about) => {
      // Acquire first (R09). This used to call no installer at all: it
      // re-resolved whatever was already installed and rewrote the lock, so
      // "upgrade" could only reach a version somebody had installed by hand.
      // A path-sourced extension lives in the repository and is not
      // something to fetch, so it keeps the re-resolve-only behaviour.
      if (!isPathSource(configured.source)) {
        const acquired = acquireTarget(paths.root, id, configured.source, options, about);
        if (acquired.length > 0) return { ok: false, value: undefined, problems: acquired };
      }
      const desired = resolveDesiredState({ root: paths.root, config: config.value! });
      if (desired.value === undefined) {
        return { ok: false, value: undefined, problems: desired.problems };
      }
      const next = desired.value.extensions.find((e) => e.id === id);

      // Migrate the records this extension owns before the lock moves
      // (Distribution §15 step 4). In memory first, validated through the
      // loader afterwards, and inside the transaction throughout — so
      // canonical state ends up fully migrated or untouched.
      const migrated = runMigration(paths.root, id, next, previousLock.value?.extensions[id]);
      if (migrated.length > 0) return { ok: false, value: undefined, problems: migrated };

      // The lock records where the *records* now are, which a migration is
      // the only thing that advances.
      const locked = desired.value.lock.extensions[id];
      const extensions =
        next === undefined || locked === undefined
          ? desired.value.lock.extensions
          : {
              ...desired.value.lock.extensions,
              [id]: {
                ...locked,
                ...(next.manifest.schemaVersion === 1
                  ? {}
                  : { schemaVersion: next.manifest.schemaVersion }),
              },
            };

      // The configuration is desired state and cannot change on an upgrade, so
      // only the lock is written.
      const written = writeDesiredState(
        paths.root,
        undefined,
        serialiseLock({ ...desired.value.lock, extensions }),
      );
      if (written !== undefined) return { ok: false, value: undefined, problems: [written] };
      const report = validateProject({ root: paths.root });
      if (!report.ok) return { ok: false, value: undefined, problems: report.problems };
      return { ok: true, value: next?.manifest.version };
    },
    { installer: options.install ?? packageManagerInstaller },
  );

  if (!result.ok) return failure(paths.root, result.problems);

  return {
    ok: true,
    root: paths.root,
    changes: [
      {
        id,
        action: "upgraded",
        ...(value === undefined ? {} : { version: value }),
        ...(previousVersion === undefined ? {} : { previousVersion }),
      },
    ],
    githubProfiles: [],
    preserved: [],
    problems: [],
  };
}
