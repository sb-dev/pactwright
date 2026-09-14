import { join } from "node:path";
import type { Problem } from "../errors.js";
import type { Project } from "../loader.js";
import { isPathSource } from "../pack/locate.js";
import { resolveDesiredState } from "../pack/resolve.js";
import { runtimeVersion } from "../version.js";
import { detectPackageManager, installedVersion } from "./package-manager.js";
import { environmentLockHash, type LockFile } from "./lock.js";

/**
 * The result of checking that the recorded environment still describes the
 * environment actually installed and resolvable.
 */
export interface EnvironmentAgreement {
  readonly ok: boolean;
  readonly problems: readonly Problem[];
  /** Present when the lock resolved: the exact environment identity. */
  readonly environmentLockHash?: string;
}

/**
 * Checks the Pactwright lock against the environment it claims to describe
 * (Distribution §§12–13, Checkpoint 1 Step 15):
 *
 * - the recorded runtime version is the running runtime;
 * - every package-backed component the two locks both identify agrees with
 *   the version the package manager installed;
 * - re-resolving desired state reproduces the recorded pack, agent, skill
 *   and extension identities, so a tampered or stale hash is rejected.
 *
 * Read-only. Callers run it before accepting a new environment or replacing
 * generated integration; it never repairs the lock as a side effect.
 */
export function checkEnvironmentAgreement(project: Project): EnvironmentAgreement {
  const problems: Problem[] = [];
  const lockPath = project.paths.lock;
  const lock = project.lock;

  // 1. The lock must describe the runtime that is running.
  const running = runtimeVersion();
  if (lock.runtime.version !== running) {
    problems.push({
      code: "lock-runtime-mismatch",
      message: `lock records runtime ${lock.runtime.version} but the running runtime is ${running}; run "pactwright upgrade" or re-resolve the environment`,
      path: lockPath,
    });
  }

  // 2. The package-manager lock and the Pactwright lock must agree on every
  //    package-backed component they both identify.
  problems.push(...checkPackageAgreement(project, lock));

  // 3. Re-resolving desired state must reproduce the recorded identities.
  const resolved = resolveDesiredState({ root: project.paths.root, config: project.config });
  if (resolved.value === undefined) {
    problems.push(...resolved.problems);
    return { ok: false, problems };
  }
  problems.push(...compareLocks(lock, resolved.value.lock, lockPath));

  return {
    ok: problems.length === 0,
    problems,
    environmentLockHash: environmentLockHash(lock),
  };
}

function checkPackageAgreement(project: Project, lock: LockFile): readonly Problem[] {
  const problems: Problem[] = [];
  const root = project.paths.root;
  const manifestPath = join(root, "package.json");

  // Detection problems are the package manager's own story; doctor reports
  // them. Agreement only needs to know what is installed.
  const detected = detectPackageManager(root);
  void detected;

  // Only components the *two locks both identify* can disagree. A
  // path-sourced pack or extension is not package-backed: the package
  // manager never resolved it, so a same-named package in node_modules is a
  // different component, not a mismatch.
  const expectations: Array<{
    readonly name: string;
    readonly version: string;
    readonly what: string;
  }> = [];
  const selected = project.config.agentPack;
  if (selected !== undefined && !isPathSource(selected.source)) {
    expectations.push({
      name: lock.agentPack.name,
      version: lock.agentPack.version,
      what: "agent pack",
    });
  }
  for (const id of Object.keys(lock.extensions).sort()) {
    const entry = lock.extensions[id]!;
    const configured = project.config.extensions[id];
    if (configured !== undefined && isPathSource(configured.source)) continue;
    expectations.push({ name: entry.package, version: entry.version, what: `extension "${id}"` });
  }

  for (const expected of expectations) {
    const installed = installedVersion(root, expected.name);
    // A component the package manager does not identify is not a
    // disagreement: a path-sourced pack has no installed package at all.
    if (installed === undefined) continue;
    if (installed !== expected.version) {
      problems.push({
        code: "lock-disagreement",
        message: `${expected.what} "${expected.name}": the Pactwright lock records ${expected.version} but the package manager installed ${installed}`,
        path: manifestPath,
      });
    }
  }
  return problems;
}

function compareLocks(recorded: LockFile, resolved: LockFile, path: string): readonly Problem[] {
  const problems: Problem[] = [];
  const drift = (what: string, was: string | undefined, now: string | undefined): void => {
    if (was === now) return;
    problems.push({
      code: "lock-drift",
      message: `${what}: lock records ${was ?? "nothing"} but the installed environment resolves to ${now ?? "nothing"}`,
      path,
    });
  };

  if (recorded.agentPack.name !== resolved.agentPack.name) {
    drift("agent pack name", recorded.agentPack.name, resolved.agentPack.name);
  }
  drift("agent pack version", recorded.agentPack.version, resolved.agentPack.version);
  drift("agent pack hash", recorded.agentPack.hash, resolved.agentPack.hash);

  for (const [what, was, now] of [
    ["agent", recorded.agents, resolved.agents],
    ["skill", recorded.skills, resolved.skills],
  ] as const) {
    for (const key of new Set([...Object.keys(was), ...Object.keys(now)]).values()) {
      drift(`${what} "${key}" hash`, was[key], now[key]);
    }
  }

  for (const id of new Set([
    ...Object.keys(recorded.extensions),
    ...Object.keys(resolved.extensions),
  ]).values()) {
    const was = recorded.extensions[id];
    const now = resolved.extensions[id];
    drift(`extension "${id}" version`, was?.version, now?.version);
    drift(`extension "${id}" hash`, was?.hash, now?.hash);
  }
  return problems;
}
