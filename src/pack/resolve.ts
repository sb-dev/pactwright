import { renameSync, writeFileSync } from "node:fs";
import { dump } from "js-yaml";
import { join } from "node:path";
import { tempSibling } from "../atomic.js";
import type { PactwrightConfig } from "../config/config.js";
import type { LockFile } from "../config/lock.js";
import { PactwrightError, type Problem } from "../errors.js";
import { canonicalJson } from "../graph/revision.js";
import { loadProject, type Project } from "../loader.js";
import { runtimeVersion } from "../version.js";
import {
  enabledManifests,
  extensionLockEntries,
  resolveExtensions,
  type ResolvedExtension,
} from "../extension/resolve.js";
import type { ExtensionManifest } from "../extension/manifest.js";
import { missingCapabilities, requiredCapabilities } from "./capabilities.js";
import { isPathSource, isValidRange, locatePackage, satisfiesRange, sha256 } from "./locate.js";
import { loadPackManifest, readPackFile, skillPath, type PackManifest } from "./manifest.js";

/** A pack resolved from a project's configuration, with every hash the lock records. */
export interface ResolvedPack {
  /** Absolute pack root: where `pack.yml`, `agents/` and `skills/` live. */
  readonly dir: string;
  readonly manifest: PackManifest;
  readonly hashes: {
    /** Hash of the whole resolved pack: manifest plus every agent and skill hash. */
    readonly pack: string;
    /** Agent key → hash of its prompt file. */
    readonly agents: Readonly<Record<string, string>>;
    /** Skill name → hash of its file. */
    readonly skills: Readonly<Record<string, string>>;
  };
}

export interface ResolvePackOptions {
  /** Project root; path sources and package lookups start here. */
  readonly root: string;
  readonly config: PactwrightConfig;
  /** Defaults to the running runtime's version. */
  readonly runtimeVersion?: string;
}

export { isValidRange, satisfiesRange, sha256 };

/** Where the configured pack lives; see `locatePackage`. */
export function locatePack(root: string, source: string): string | Problem {
  return locatePackage(root, source, "agent pack");
}

/**
 * Resolves the configured pack: locate → load/validate the manifest → check
 * runtime and requested-version compatibility → hash prompts, skills and
 * the pack. Returns every problem found; a pack that resolves is complete
 * in itself but not yet checked against required capabilities (see
 * `assertPackComplete`).
 */
export function resolvePack(options: ResolvePackOptions): {
  value: ResolvedPack | undefined;
  problems: readonly Problem[];
} {
  const source = options.config.agentPack.source;
  const located = locatePack(options.root, source);
  if (typeof located !== "string") return { value: undefined, problems: [located] };
  const dir = located;
  const loaded = loadPackManifest(dir);
  if (loaded.value === undefined) return { value: undefined, problems: loaded.problems };
  const manifest = loaded.value;
  const path = join(dir, "pack.yml");
  const problems: Problem[] = [];

  if (manifest.name !== source && !isPathSource(source)) {
    problems.push({
      code: "pack-name-mismatch",
      message: `pack manifest declares name "${manifest.name}" but config.agent_pack.source is "${source}"`,
      path,
    });
  }
  const runtime = options.runtimeVersion ?? runtimeVersion();
  if (!satisfiesRange(runtime, manifest.pactwright)) {
    problems.push({
      code: "incompatible-runtime",
      message: `pack "${manifest.name}@${manifest.version}" requires pactwright ${manifest.pactwright}; this runtime is ${runtime}`,
      path,
    });
  }
  const wanted = options.config.agentPack.version;
  if (wanted !== undefined && !isValidRange(wanted)) {
    // A range the runtime cannot parse is its own problem, not a mismatch.
    problems.push({
      code: "invalid-version-range",
      message: `config.agent_pack.version "${wanted}" is not a supported range; use x.y.z or ^x.y.z`,
      path,
    });
  } else if (wanted !== undefined && !satisfiesRange(manifest.version, wanted)) {
    problems.push({
      code: "incompatible-pack-version",
      message: `config.agent_pack.version wants ${wanted} but the installed pack "${manifest.name}" is ${manifest.version}`,
      path,
    });
  }
  if (problems.length > 0) return { value: undefined, problems };

  const agents: Record<string, string> = {};
  const skills: Record<string, string> = {};
  for (const key of Object.keys(manifest.agents).sort()) {
    const agent = manifest.agents[key]!;
    agents[key] = sha256(readPackFile(dir, agent.prompt));
    for (const skill of agent.skills) {
      skills[skill] ??= sha256(readPackFile(dir, skillPath("", skill)));
    }
  }
  const sortedSkills = Object.fromEntries(
    Object.keys(skills)
      .sort()
      .map((k) => [k, skills[k]!]),
  );
  const pack = sha256(
    canonicalJson({
      name: manifest.name,
      version: manifest.version,
      pactwright: manifest.pactwright,
      capabilities: manifest.capabilities,
      agents: Object.fromEntries(
        Object.keys(manifest.agents)
          .sort()
          .map((key) => [key, { prompt: agents[key], skills: manifest.agents[key]!.skills }]),
      ),
      skills: sortedSkills,
    }),
  );
  return {
    value: { dir, manifest, hashes: { pack, agents, skills: sortedSkills } },
    problems: [],
  };
}

/** Resolution of a pack checked against the configuration's required capabilities. */
type CompleteResolution =
  | { readonly kind: "ok"; readonly pack: ResolvedPack }
  | { readonly kind: "unresolved"; readonly problems: readonly Problem[] }
  | {
      readonly kind: "incomplete";
      readonly pack: ResolvedPack;
      readonly missing: readonly string[];
      readonly required: readonly string[];
      readonly problems: readonly Problem[];
    };

/**
 * The one resolution pipeline behind every desired-state surface: resolve
 * the configured pack, then check it provides every required capability —
 * the core set plus the capabilities of the given enabled extensions.
 */
function resolveComplete(
  options: ResolvePackOptions,
  extensions: readonly ExtensionManifest[] = [],
): CompleteResolution {
  const resolved = resolvePack(options);
  if (resolved.value === undefined) return { kind: "unresolved", problems: resolved.problems };
  const pack = resolved.value;
  const required = requiredCapabilities(extensions);
  const missing = missingCapabilities(pack.manifest, required);
  if (missing.length === 0) return { kind: "ok", pack };
  return {
    kind: "incomplete",
    pack,
    missing,
    required,
    problems: missing.map((capability) => ({
      code: "missing-capability",
      message: `required capability "${capability}" is not provided by the selected agent pack`,
      path: join(pack.dir, "pack.yml"),
    })),
  };
}

/**
 * The capability check that guards canonical graph mutation (Distribution
 * §7): resolves the project's pack and throws `missing-capability` — listing
 * every missing capability — or the resolution problems. Nothing is written
 * by this function; callers run it before their first write.
 */
export function assertPackComplete(project: Project): ResolvedPack {
  const resolution = resolveComplete(
    { root: project.paths.root, config: project.config },
    enabledManifests(project.extensions),
  );
  if (resolution.kind === "unresolved") {
    throw PactwrightError.fromProblems("pack-unresolved", resolution.problems);
  }
  if (resolution.kind === "incomplete") {
    const { pack, missing, required } = resolution;
    throw new PactwrightError(
      "missing-capability",
      `agent pack "${pack.manifest.name}@${pack.manifest.version}" does not provide required capabilit${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")} (required: ${required.join(", ")})`,
      resolution.problems,
    );
  }
  return resolution.pack;
}

/** Desired installation state resolved to exact state: pack, extensions and the lock recording them. */
export interface DesiredState {
  readonly pack: ResolvedPack;
  readonly extensions: readonly ResolvedExtension[];
  readonly lock: LockFile;
}

/**
 * Resolves desired state (configuration) to exact state (a lock value):
 * resolve every configured extension, resolve the configured pack, check
 * the required capability union, record runtime version and
 * pack/agent/skill/extension hashes (Distribution §§3–6). Pure — nothing
 * is written — and deterministic: the same desired state always resolves to
 * the same lock. Never throws; mirrors `resolvePack`'s result idiom.
 */
export function resolveDesiredState(options: ResolvePackOptions): {
  value: DesiredState | undefined;
  problems: readonly Problem[];
} {
  const extensions = resolveExtensions(options);
  if (extensions.value === undefined) return { value: undefined, problems: extensions.problems };
  const resolution = resolveComplete(options, enabledManifests(extensions.value));
  if (resolution.kind !== "ok") return { value: undefined, problems: resolution.problems };
  const lock = lockEntriesFor(
    resolution.pack,
    options.runtimeVersion ?? runtimeVersion(),
    extensionLockEntries(extensions.value),
  );
  return { value: { pack: resolution.pack, extensions: extensions.value, lock }, problems: [] };
}

/** The agent key and definition implementing `capability`, if the pack maps it. */
export function agentFor(
  pack: ResolvedPack,
  capability: string,
):
  | { readonly key: string; readonly prompt: string; readonly skills: readonly string[] }
  | undefined {
  const key = pack.manifest.capabilities[capability];
  if (key === undefined) return undefined;
  const agent = pack.manifest.agents[key];
  if (agent === undefined) return undefined;
  return { key, prompt: join(pack.dir, agent.prompt), skills: agent.skills };
}

/**
 * The lock-file value recording exactly this resolved pack and runtime.
 * `extensions` is the seam for extension resolution: nothing resolves
 * extensions in this checkpoint, so it defaults to empty.
 */
export function lockEntriesFor(
  pack: ResolvedPack,
  runtime: string = runtimeVersion(),
  extensions: LockFile["extensions"] = {},
): LockFile {
  return {
    runtime: { version: runtime },
    agentPack: { name: pack.manifest.name, version: pack.manifest.version, hash: pack.hashes.pack },
    agents: pack.hashes.agents,
    skills: pack.hashes.skills,
    extensions,
  };
}

function sortedMap(entries: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(entries)
      .sort()
      .map((key) => [key, entries[key]!]),
  );
}

/** Extensions in serialisation order: sorted ids, fixed key order, sorted dependencies. */
function serialisedExtensions(extensions: LockFile["extensions"]): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(extensions)
      .sort()
      .map((id) => {
        const extension = extensions[id]!;
        return [
          id,
          {
            package: extension.package,
            version: extension.version,
            hash: extension.hash,
            ...(extension.dependencies === undefined ||
            Object.keys(extension.dependencies).length === 0
              ? {}
              : { dependencies: sortedMap(extension.dependencies) }),
          },
        ];
      }),
  );
}

/** Serialises a lock file deterministically in the `.pactwright/lock.yml` shape. */
export function serialiseLock(lock: LockFile): string {
  return dump(
    {
      runtime: { version: lock.runtime.version },
      agent_pack: {
        name: lock.agentPack.name,
        version: lock.agentPack.version,
        hash: lock.agentPack.hash,
      },
      agents: sortedMap(lock.agents),
      skills: sortedMap(lock.skills),
      extensions: serialisedExtensions(lock.extensions),
    },
    { lineWidth: -1, noRefs: true },
  );
}

/** Writes the lock file atomically (temporary sibling + rename). */
export function writeLock(lockPath: string, lock: LockFile): void {
  const temp = tempSibling(lockPath);
  writeFileSync(temp, serialiseLock(lock), "utf8");
  renameSync(temp, lockPath);
}

/**
 * Resolves the configured pack, checks required capabilities and only then
 * records the exact runtime/pack/agent/skill state in `.pactwright/lock.yml`.
 * Any failure leaves the lock file untouched.
 */
export function resolveAndLock(root: string): { pack: ResolvedPack; lock: LockFile } {
  const project = loadProject({ root });
  const pack = assertPackComplete(project);
  const lock = lockEntriesFor(pack, runtimeVersion(), extensionLockEntries(project.extensions));
  writeLock(project.paths.lock, lock);
  return { pack, lock };
}
