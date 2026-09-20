import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempSibling } from "../atomic.js";
import { MANAGED_DIRS } from "../adapter/claude-code.js";
import {
  detectPackageManager,
  installedVersion,
  type PackageManager,
} from "../config/package-manager.js";
import type { Problem } from "../errors.js";
import { projectPaths } from "../project.js";

/**
 * One environment transaction (consolidation design §6).
 *
 * Every environment-changing operation used to carry its own snapshot, and
 * the four disagreed about what an operation owns: `useAgentPack` snapshotted
 * config and lock, `upgradeRuntime` those plus `lifecycle.yml` and
 * `package.json`, `addExtension` mutated `package.json` and the
 * package-manager lock *before* snapshotting anything, and `writeAdapter`
 * had no snapshot at all — it skipped a colliding file, wrote the rest, and
 * left already-renamed files behind if a later rename threw. A failure
 * therefore left a project in a state no single routine could describe, let
 * alone undo (R07).
 *
 * The managed set is one list, owned here. A snapshot covers all of it, a
 * restore rewrites all of it, and `restored` is the *result* of re-reading
 * it rather than a flag a caller sets because it believes it restored.
 *
 * What this is not: a package manager. Installation and reinstallation are
 * delegated through the `PackageInstaller` seam, exactly as before
 * (Distribution §15, §25).
 */

/**
 * Replaces packages through the project's package manager. Returns problems
 * rather than throwing.
 *
 * `spec` is optional: without one the manager installs what `package.json`
 * and its own lock already describe — a frozen install. That is how an
 * install is undone, once the transaction has put both files back, and it is
 * still the package manager doing the work (Distribution §15).
 *
 * It lives here rather than in `upgrade.ts` because the transaction and the
 * upgrade path both need it and the upgrade path is built on the transaction.
 */
export type PackageInstaller = (request: {
  readonly root: string;
  readonly manager: PackageManager;
  readonly spec?: string;
}) => readonly Problem[];

export interface TransactionSeams {
  /** Installs packages. Absent means the plan cannot undo an install. */
  readonly installer?: PackageInstaller;
}

/** What a transaction body can tell the transaction while it runs. */
export interface TransactionBody {
  /**
   * Declares that `name` is about to be installed.
   *
   * A walk that discovers its dependencies as it goes cannot list them at
   * plan time, so it says so here instead — and it must do so *before*
   * installing, because what the transaction records is the version this
   * project had at that moment, which is the version an undo has to reach.
   */
  readonly installing: (name: string) => void;
}

/** A file the transaction owns, and the bytes it held when the plan began. */
interface Snapshot {
  readonly path: string;
  /** `undefined` records that the file did not exist: an absence is a state. */
  readonly content: string | undefined;
}

/** A package the plan will ask the package manager to install. */
export interface PackageChange {
  /** `<name>` or `<name>@<version>`, exactly as the manager will receive it. */
  readonly spec: string;
  /** The package name, for reading the installed version back. */
  readonly name: string;
}

export interface EnvironmentPlan {
  readonly root: string;
  /** Every file this plan may touch, absolute and sorted. */
  readonly managed: readonly string[];
  /** Installs in dependency post-order: a dependency before its dependant. */
  readonly installs: readonly PackageChange[];
  /** Refusals detectable before anything is installed or written. */
  readonly problems: readonly Problem[];
}

export interface EnvironmentResult {
  readonly ok: boolean;
  /**
   * True when the environment is back where it started.
   *
   * Not "every managed file re-hashes to its snapshot": `node_modules` is not
   * a managed file, so that predicate is satisfiable while a newly installed
   * package is still in place — which is what made `upgradeRuntime` report
   * `restored: true` after restoring four files and leaving the installer's
   * work behind. A restore that undid an install must also see the previous
   * version read back before it claims this.
   */
  readonly restored: boolean;
  /** What a human must do when restoration could not be completed. */
  readonly recovery?: readonly string[];
  readonly problems: readonly Problem[];
}

/**
 * The complete managed set for `root`.
 *
 * One list, so an operation cannot own a different subset from the operation
 * that runs next. `.pactwright/.lock` is excluded — the writer lock is not
 * its own subject — and so is `.pactwright/execution/`, which is progress,
 * not environment (Core §28).
 */
export function managedSet(root: string): readonly string[] {
  const paths = projectPaths(root);
  const files = new Set<string>([
    paths.config,
    paths.lifecycle,
    paths.lock,
    join(root, "package.json"),
  ]);
  const lockFile = detectPackageManager(root).value?.lockFile;
  if (lockFile !== undefined) files.add(join(root, lockFile));
  for (const file of generatedFiles(root)) files.add(file);
  return [...files].sort();
}

/**
 * Every generated file under the managed adapter directories, right now.
 *
 * A render can *add* files as well as change them, and those additions have
 * no snapshot to restore — the list is read again after a failure so they
 * can be removed, which is what makes "the state to return to is: this path
 * had nothing" true rather than merely intended.
 */
function generatedFiles(root: string): readonly string[] {
  const files: string[] = [];
  for (const dir of MANAGED_DIRS) {
    const absolute = join(root, dir);
    if (!existsSync(absolute)) continue;
    for (const entry of readdirSync(absolute).sort()) {
      if (entry.endsWith(".md")) files.push(join(absolute, entry));
    }
  }
  return files;
}

/**
 * Plans an environment change.
 *
 * A plan is deliberately not total. `resolveDesiredState` resolves through
 * installed package manifests, so for an operation that installs something,
 * the desired state, the render and any declared migration are facts about
 * the environment *after* the install — they cannot be computed here without
 * pretending the install has already happened. What a plan knows is the
 * managed set, the installs in dependency order, and the refusals that do
 * not need the new package to detect.
 */
export function planEnvironmentChange(
  root: string,
  options: {
    readonly installs?: readonly PackageChange[];
    readonly problems?: readonly Problem[];
  } = {},
): EnvironmentPlan {
  return {
    root: projectPaths(root).root,
    managed: managedSet(root),
    installs: options.installs ?? [],
    problems: options.problems ?? [],
  };
}

/**
 * Runs `body` with the plan's managed set snapshotted.
 *
 * `body` returns the operation's own result and whether it succeeded. On
 * failure — returned or thrown — every managed file is put back and any
 * install this plan performed is undone through a frozen reinstall, and the
 * caller is told whether that actually worked.
 *
 * The writer lock is deliberately *not* taken here. It is the graph's lock,
 * re-entrant only within one process (`graph/writer-lock.ts`), and one
 * environment operation — the runtime upgrade — completes by spawning the
 * newly installed runtime as a child process. Holding the lock across that
 * spawn would block the child for its full wait and then fail it. Callers
 * that write graph state take the lock around that step themselves.
 */
export function applyEnvironmentPlan<T>(
  plan: EnvironmentPlan,
  body: (about: TransactionBody) => {
    readonly ok: boolean;
    readonly value: T;
    readonly problems?: readonly Problem[];
  },
  seams: TransactionSeams = {},
): { readonly value: T; readonly result: EnvironmentResult } {
  const snapshots = plan.managed.map((path): Snapshot => ({
    path,
    content: existsSync(path) ? readFileSync(path, "utf8") : undefined,
  }));
  // Read here rather than take it from the caller: the version to come back
  // to is whatever this project had installed when the plan began, which the
  // caller can only guess at. `upgradeRuntime` guessed the *running* runtime
  // version, which is not the same thing in a project that has none.
  const installedBefore = new Map(
    plan.installs.map((change) => [change.name, installedVersion(plan.root, change.name)]),
  );
  const about: TransactionBody = {
    installing: (name) => {
      if (installedBefore.has(name)) return;
      installedBefore.set(name, installedVersion(plan.root, name));
    },
  };

  let outcome: { readonly ok: boolean; readonly value: T; readonly problems?: readonly Problem[] };
  try {
    outcome = body(about);
  } catch (error) {
    const restore = restoreAll(plan, snapshots, installedBefore, seams);
    throw Object.assign(error as Error, { environmentRestored: restore.restored });
  }

  if (outcome.ok) {
    return {
      value: outcome.value,
      result: { ok: true, restored: false, problems: [] },
    };
  }

  const restore = restoreAll(plan, snapshots, installedBefore, seams);
  return {
    value: outcome.value,
    result: {
      ok: false,
      restored: restore.restored,
      ...(restore.recovery.length === 0 ? {} : { recovery: restore.recovery }),
      problems: [...(outcome.problems ?? []), ...restore.problems],
    },
  };
}

const sha256 = (content: string): string =>
  createHash("sha256").update(content, "utf8").digest("hex");

/**
 * Puts every managed file back and undoes any install, then *checks*.
 *
 * Restoration is only claimed when the files re-read to their snapshot and,
 * where a package was installed, the previously installed version reads back.
 */
function restoreAll(
  plan: EnvironmentPlan,
  snapshots: readonly Snapshot[],
  installedBefore: ReadonlyMap<string, string | undefined>,
  seams: TransactionSeams,
): { restored: boolean; recovery: readonly string[]; problems: readonly Problem[] } {
  const problems: Problem[] = [];
  const recovery: string[] = [];

  // Generated files the body added are not in the snapshot — the managed set
  // was read before they existed — so they are swept here. The transaction
  // owns these directories, so removing what it did not find there is within
  // what it may undo; a file with no snapshot is by definition one this
  // operation created.
  const known = new Set(snapshots.map((entry) => entry.path));
  for (const file of generatedFiles(plan.root)) {
    if (known.has(file)) continue;
    try {
      rmSync(file, { force: true });
    } catch (error) {
      problems.push({
        code: "restore-failed",
        message: `could not remove "${file}", which this operation created: ${(error as Error).message}`,
        path: file,
      });
    }
  }

  for (const entry of snapshots) {
    try {
      if (entry.content === undefined) {
        rmSync(entry.path, { force: true });
      } else {
        const temp = tempSibling(entry.path);
        writeFileSync(temp, entry.content, "utf8");
        renameSync(temp, entry.path);
      }
    } catch (error) {
      problems.push({
        code: "restore-failed",
        message: `could not restore "${entry.path}": ${(error as Error).message}`,
        path: entry.path,
      });
    }
  }

  // The package-manager lock and package.json are back, so a frozen install
  // returns node_modules to what they describe. Pactwright never installs
  // packages itself (Distribution §15).
  const manager = detectPackageManager(plan.root).value?.name;
  if (installedBefore.size > 0) {
    if (seams.installer === undefined || manager === undefined) {
      recovery.push(
        manager === undefined
          ? `reinstall dependencies in ${plan.root}: the packages this operation installed are still present`
          : `run "${manager} install" in ${plan.root}: the packages this operation installed are still present`,
      );
    } else {
      const installProblems = seams.installer({ root: plan.root, manager });
      if (installProblems.length > 0) {
        problems.push(...installProblems);
        recovery.push(`run "${manager} install" in ${plan.root} to undo the packages installed`);
      }
    }
  }

  // Now verify, rather than assume.
  let restored = true;
  for (const entry of snapshots) {
    const now = existsSync(entry.path) ? readFileSync(entry.path, "utf8") : undefined;
    const same =
      entry.content === undefined
        ? now === undefined
        : now !== undefined && sha256(now) === sha256(entry.content);
    if (same) continue;
    restored = false;
    recovery.push(`"${entry.path}" was not restored to its previous contents`);
  }
  for (const [name, before] of installedBefore) {
    const now = installedVersion(plan.root, name);
    if (now === before) continue;
    restored = false;
    recovery.push(
      before === undefined
        ? `"${name}" is still installed at ${now ?? "an unknown version"} and was not present before`
        : `"${name}" is installed at ${now ?? "nothing"} but was ${before} before`,
    );
  }
  return { restored, recovery, problems };
}
