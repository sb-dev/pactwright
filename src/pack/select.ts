import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tempSibling } from "../atomic.js";
import { loadConfig, rewriteConfig, type PactwrightConfig } from "../config/config.js";
import type { Problem } from "../errors.js";
import { projectPaths } from "../project.js";
import { syncProject } from "../sync.js";
import { validateProject } from "../validate.js";
import { isPathSource, satisfiesRange } from "./locate.js";
import { resolveDesiredState, serialiseLock } from "./resolve.js";

/**
 * The result of selecting or upgrading the Agent Pack. Configuration, lock
 * and generated environment change only after the complete required
 * capability set has been validated; on any failure the previous valid state
 * is left exactly as it was (Distribution §15).
 */
export interface PackChangeReport {
  readonly ok: boolean;
  readonly root: string;
  /** The pack now selected, when the operation succeeded. */
  readonly selected?: { readonly name: string; readonly version: string };
  /** What was selected before, when the resolved identity changed. */
  readonly previous?: { readonly name: string; readonly version: string };
  /** True when the resolved pack identity did not change. */
  readonly unchanged: boolean;
  /** Set when only the configured desired constraint moved. */
  readonly constraintChanged?: true;
  /** Generated files the follow-on sync wrote. */
  readonly synced: readonly string[];
  /** GitHub reconciliation this operation could not perform. */
  readonly reconciliation: readonly string[];
  readonly problems: readonly Problem[];
}

function failure(root: string, problems: readonly Problem[]): PackChangeReport {
  return { ok: false, root, unchanged: true, synced: [], reconciliation: [], problems };
}

/**
 * Snapshots config and lock so a failed change restores the previous valid
 * state. A scaffold has no lock yet: that absence is itself the state to
 * restore to, so a rejected first selection leaves no half-locked project.
 */
function begin(root: string): { restore: () => void; config: string } | Problem {
  const paths = projectPaths(root);
  let config: string;
  try {
    config = readFileSync(paths.config, "utf8");
  } catch {
    return { code: "missing-file", message: "file not found", path: paths.config };
  }
  const lock = existsSync(paths.lock) ? readFileSync(paths.lock, "utf8") : undefined;
  return {
    config,
    restore: () => {
      const temp = tempSibling(paths.config);
      writeFileSync(temp, config, "utf8");
      renameSync(temp, paths.config);
      if (lock === undefined) {
        rmSync(paths.lock, { force: true });
      } else {
        const lockTemp = tempSibling(paths.lock);
        writeFileSync(lockTemp, lock, "utf8");
        renameSync(lockTemp, paths.lock);
      }
    },
  };
}

/**
 * Applies a proposed configuration: resolve it completely, write config and
 * lock, sync, then validate. Any failure restores the snapshot, so a rejected
 * pack never costs the project its working environment.
 */
function apply(
  root: string,
  proposed: PactwrightConfig,
  previous: { readonly name: string; readonly version: string } | undefined,
): PackChangeReport {
  const paths = projectPaths(root);
  const resolved = resolveDesiredState({ root, config: proposed });
  if (resolved.value === undefined) return failure(root, resolved.problems);

  const snapshot = begin(root);
  if ("code" in snapshot) return failure(root, [snapshot]);

  const selected = {
    name: resolved.value.lock.agentPack.name,
    version: resolved.value.lock.agentPack.version,
  };
  // "Unchanged" is about the resolved *identity*: a project may narrow or
  // widen its desired constraint without the pack it runs changing at all.
  const rewritten = rewriteConfig(snapshot.config, proposed);
  const unchanged =
    previous !== undefined &&
    previous.name === selected.name &&
    previous.version === selected.version;
  const constraintChanged = rewritten !== snapshot.config;

  for (const [target, content] of [
    [paths.config, rewritten],
    [paths.lock, serialiseLock(resolved.value.lock)],
  ] as const) {
    const temp = tempSibling(target);
    writeFileSync(temp, content, "utf8");
    renameSync(temp, target);
  }

  const sync = syncProject(root);
  if (!sync.ok) {
    snapshot.restore();
    return failure(root, sync.problems);
  }
  const validation = validateProject({ root });
  if (!validation.ok) {
    snapshot.restore();
    return failure(root, validation.problems);
  }

  return {
    ok: true,
    root: paths.root,
    selected,
    ...(previous === undefined || unchanged ? {} : { previous }),
    unchanged,
    ...(constraintChanged ? { constraintChanged: true as const } : {}),
    synced: sync.changed,
    // Checkpoint 1 keeps GitHub disabled, so there is nothing to reconcile
    // yet; the seam reports it rather than mutating remote state.
    reconciliation: proposed.github.enabled
      ? ["GitHub integration is configured; reconcile it after this change"]
      : [],
    problems: [],
  };
}

function currentSelection(
  root: string,
): { readonly name: string; readonly version: string } | undefined {
  const config = loadConfig(projectPaths(root).config);
  if (config.value === undefined) return undefined;
  const resolved = resolveDesiredState({ root, config: config.value });
  if (resolved.value === undefined) return undefined;
  return {
    name: resolved.value.lock.agentPack.name,
    version: resolved.value.lock.agentPack.version,
  };
}

/**
 * `pactwright agent-pack use <source>` (Distribution §5): resolve a
 * compatible complete pack, validate every required capability, update
 * configuration only after success, lock exact identity and run sync.
 * A pack is never switched silently — the source is always explicit here.
 *
 * `source` may carry an exact version (`@scope/pack@1.2.3`) or a range
 * (`@scope/pack@^1.2.0`); with neither, the configured constraint is dropped
 * and whatever the package manager installed is locked.
 */
export function useAgentPack(root: string, spec: string): PackChangeReport {
  const paths = projectPaths(root);
  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);

  const parsed = parseSpec(spec);
  if ("code" in parsed) return failure(paths.root, [parsed]);

  const proposed: PactwrightConfig = {
    ...config.value,
    agentPack:
      parsed.version === undefined
        ? { source: parsed.source }
        : { source: parsed.source, version: parsed.version },
  };
  return apply(paths.root, proposed, currentSelection(paths.root));
}

/**
 * `pactwright agent-pack upgrade` (Distribution §15): re-resolve the
 * *currently selected* pack within its configured compatibility constraint.
 * Agent Pack identity never changes here — only which version of it is
 * locked — and the complete required capability set is validated before the
 * lock or the generated environment moves.
 *
 * An exact configured target stays selected even when a newer compatible
 * package exists: a desired constraint does not authorise changing identity
 * or pinning.
 */
export function upgradeAgentPack(root: string): PackChangeReport {
  const paths = projectPaths(root);
  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);
  // The configuration is desired state and is deliberately not rewritten:
  // an upgrade moves the lock within the constraint the project already
  // declared.
  return apply(paths.root, config.value, currentSelection(paths.root));
}

interface PackSpec {
  readonly source: string;
  readonly version?: string;
}

/** Splits `<source>` or `<source>@<version-or-range>`. */
export function parseSpec(spec: string): PackSpec | Problem {
  const trimmed = spec.trim();
  if (trimmed.length === 0) {
    return { code: "invalid-pack-source", message: "an agent pack source is required", path: spec };
  }
  if (isPathSource(trimmed)) return { source: trimmed };
  // A scoped name starts with "@", so only a later "@" separates the version.
  const at = trimmed.indexOf("@", trimmed.startsWith("@") ? 1 : 0);
  if (at < 0) return { source: trimmed };
  const source = trimmed.slice(0, at);
  const version = trimmed.slice(at + 1);
  if (version.length === 0) return { source };
  if (!isSupportedRange(version)) {
    return {
      code: "invalid-version-range",
      message: `"${version}" is not a supported version or range; use x.y.z or ^x.y.z`,
      path: spec,
    };
  }
  return { source, version };
}

function isSupportedRange(version: string): boolean {
  // `satisfiesRange` is the resolver's own notion of what it can compare, so
  // asking it directly keeps the CLI and the resolver from drifting apart.
  return satisfiesRange(version.startsWith("^") ? version.slice(1) : version, version);
}
