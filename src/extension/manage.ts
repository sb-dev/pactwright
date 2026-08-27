import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { tempSibling } from "../atomic.js";
import {
  loadConfig,
  serialiseConfig,
  type ConfigExtension,
  type PactwrightConfig,
} from "../config/config.js";
import { EXTENSION_ID_PATTERN, loadLock } from "../config/lock.js";
import type { Problem } from "../errors.js";
import { locatePackage } from "../pack/locate.js";
import { resolveDesiredState, serialiseLock } from "../pack/resolve.js";
import { projectPaths } from "../project.js";
import { validateProject } from "../validate.js";
import { loadExtensionManifest } from "./manifest.js";
import { resolveExtensions } from "./resolve.js";

/** One extension the operation touched. */
export interface ExtensionChange {
  readonly id: string;
  readonly action: "added" | "removed" | "upgraded" | "unchanged";
  readonly version?: string;
  readonly previousVersion?: string;
}

/** Result of `pactwright extension add|remove|upgrade`. */
export interface ExtensionChangeReport {
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
   * Node ids of canonical records that stayed on disk after a removal.
   * Removal never deletes user-authored extension graph data; the user
   * chooses separately whether to delete it.
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

/** Writes config and lock atomically (temp sibling + rename, config first). */
function writeDesiredState(
  root: string,
  config: PactwrightConfig,
  lockText: string,
): { restore: () => void } {
  const paths = projectPaths(root);
  const previousConfig = readFileSync(paths.config, "utf8");
  const previousLock = readFileSync(paths.lock, "utf8");
  for (const [target, content] of [
    [paths.config, serialiseConfig(config)],
    [paths.lock, lockText],
  ] as const) {
    const temp = tempSibling(target);
    writeFileSync(temp, content, "utf8");
    renameSync(temp, target);
  }
  return {
    restore: () => {
      for (const [target, content] of [
        [paths.config, previousConfig],
        [paths.lock, previousLock],
      ] as const) {
        const temp = tempSibling(target);
        writeFileSync(temp, content, "utf8");
        renameSync(temp, target);
      }
    },
  };
}

/**
 * Enables an extension (Distribution §4): resolve the package, resolve and
 * enable missing dependencies first, validate the complete required
 * capability union, then record the exact state in config and lock. Fails
 * before any write when compatibility is incomplete; rolls both files back
 * if the resulting project state does not validate.
 */
export function addExtension(root: string, spec: string): ExtensionChangeReport {
  const paths = projectPaths(root);
  const parsed = parseSpec(spec);
  if ("code" in parsed) return failure(paths.root, [parsed]);

  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);

  const proposed: Record<string, ConfigExtension> = { ...config.value.extensions };
  const added: string[] = [];
  const problems: Problem[] = [];

  // Enable the requested extension, then walk manifest dependencies and
  // enable any that are not yet configured, resolving each by its
  // conventional `@pactwright/<id>` package (Distribution §4).
  const queue: Array<{ id: string; source: string }> = [parsed];
  while (queue.length > 0) {
    const { id, source } = queue.shift()!;
    const existing = Object.hasOwn(proposed, id) ? proposed[id] : undefined;
    if (existing !== undefined) {
      if (!existing.enabled) {
        proposed[id] = { ...existing, enabled: true };
        added.push(id);
      }
      continue;
    }
    const located = locatePackage(paths.root, source, "extension");
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
    proposed[id] = { enabled: true, source };
    added.push(id);
    for (const dep of manifest.value.dependencies) {
      if (!Object.hasOwn(proposed, dep)) queue.push({ id: dep, source: `@pactwright/${dep}` });
    }
  }
  if (problems.length > 0) return failure(paths.root, problems);
  if (added.length === 0) {
    return {
      ok: true,
      root: paths.root,
      changes: [{ id: parsed.id, action: "unchanged" }],
      githubProfiles: [],
      preserved: [],
      problems: [],
    };
  }

  const desired = resolveDesiredState({
    root: paths.root,
    config: withExtensions(config.value, proposed),
  });
  if (desired.value === undefined) return failure(paths.root, desired.problems);

  const written = writeDesiredState(
    paths.root,
    withExtensions(config.value, proposed),
    serialiseLock(desired.value.lock),
  );
  const report = validateProject({ root: paths.root });
  if (!report.ok) {
    written.restore();
    return failure(paths.root, report.problems);
  }

  const byId = new Map(desired.value.extensions.map((e) => [e.id, e]));
  return {
    ok: true,
    root: paths.root,
    changes: added.sort().map((id) => ({
      id,
      action: "added",
      ...(byId.get(id) === undefined ? {} : { version: byId.get(id)!.manifest.version }),
    })),
    githubProfiles: added
      .map((id) => byId.get(id)?.manifest.githubProfile)
      .filter((profile): profile is string => profile !== undefined)
      .sort(),
    preserved: [],
    problems: [],
  };
}

/**
 * Removes an extension (Distribution §4). Blocked while an enabled
 * extension still depends on it. Canonical graph data owned by the
 * extension is never deleted — it is reported as preserved, and the user
 * chooses separately whether to delete it.
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

  const resolved = resolveExtensions({ root: paths.root, config: config.value });
  if (resolved.value === undefined) return failure(paths.root, resolved.problems);
  const removed = resolved.value.find((e) => e.id === id);
  const dependants = resolved.value
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

  const proposed = { ...config.value.extensions };
  delete proposed[id];
  const desired = resolveDesiredState({
    root: paths.root,
    config: withExtensions(config.value, proposed),
  });
  if (desired.value === undefined) return failure(paths.root, desired.problems);

  writeDesiredState(
    paths.root,
    withExtensions(config.value, proposed),
    serialiseLock(desired.value.lock),
  );

  // Preserved user-authored canonical data: records whose types the removed
  // extension registered. `pactwright validate` reports them as unknown
  // types until the user deletes them or re-enables the extension.
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

  return {
    ok: true,
    root: paths.root,
    changes: [
      {
        id,
        action: "removed",
        ...(removed === undefined ? {} : { previousVersion: removed.manifest.version }),
      },
    ],
    githubProfiles: [],
    preserved,
    problems: [],
  };
}

/**
 * Upgrades an extension (Distribution §15): re-resolves the configured
 * package, validates the complete dependency graph and capability union,
 * and updates the lock. The configuration is desired state and does not
 * change; canonical Project Graph state is never reinterpreted.
 */
export function upgradeExtension(root: string, id: string): ExtensionChangeReport {
  const paths = projectPaths(root);
  const config = loadConfig(paths.config);
  if (config.value === undefined) return failure(paths.root, config.problems);
  if (!Object.hasOwn(config.value.extensions, id)) {
    return failure(paths.root, [
      { code: "extension-not-configured", message: `extension "${id}" is not configured` },
    ]);
  }

  const previousLock = loadLock(paths.lock);
  const previousVersion = previousLock.value?.extensions[id]?.version;
  const desired = resolveDesiredState({ root: paths.root, config: config.value });
  if (desired.value === undefined) return failure(paths.root, desired.problems);
  const next = desired.value.extensions.find((e) => e.id === id);

  writeDesiredState(paths.root, config.value, serialiseLock(desired.value.lock));
  const report = validateProject({ root: paths.root });
  if (!report.ok) return failure(paths.root, report.problems);

  return {
    ok: true,
    root: paths.root,
    changes: [
      {
        id,
        action: "upgraded",
        ...(next === undefined ? {} : { version: next.manifest.version }),
        ...(previousVersion === undefined ? {} : { previousVersion }),
      },
    ],
    githubProfiles: [],
    preserved: [],
    problems: [],
  };
}
