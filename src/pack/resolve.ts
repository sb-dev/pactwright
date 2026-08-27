import { createHash } from "node:crypto";
import { renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { tempSibling } from "../atomic.js";
import type { PactwrightConfig } from "../config/config.js";
import type { LockFile } from "../config/lock.js";
import { PactwrightError, type Problem } from "../errors.js";
import { canonicalJson } from "../graph/revision.js";
import { loadProject, type Project } from "../loader.js";
import { runtimeVersion } from "../version.js";
import { missingCapabilities, requiredCapabilities } from "./capabilities.js";
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

export function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function parseVersion(text: string): readonly [number, number, number] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (match === null) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whether `version` satisfies `range`: an exact version, or a `^x.y.z`
 * caret range with npm semantics (`^0.0.z` is exact, `^0.y.z` fixes the
 * minor, `^x.y.z` fixes the major). During the `0.0.x` series packs declare
 * the exact runtime version, so caret only matters from `0.1.0` onward.
 */
export function satisfiesRange(version: string, range: string): boolean {
  const caret = range.startsWith("^");
  const want = parseVersion(caret ? range.slice(1) : range);
  const have = parseVersion(version);
  if (want === undefined || have === undefined) return false;
  if (!caret) return have.every((part, i) => part === want[i]);
  const cmp = (i: number): number => have[i]! - want[i]!;
  const notBelow = cmp(0) !== 0 ? cmp(0) > 0 : cmp(1) !== 0 ? cmp(1) > 0 : cmp(2) >= 0;
  if (!notBelow) return false;
  if (want[0] !== 0) return have[0] === want[0];
  if (want[1] !== 0) return have[0] === 0 && have[1] === want[1];
  return have[0] === 0 && have[1] === 0 && have[2] === want[2];
}

function isPathSource(source: string): boolean {
  return source.startsWith("./") || source.startsWith("../") || isAbsolute(source);
}

/**
 * Where the configured pack lives. A path source resolves from the project
 * root. A package source resolves like a dependency of the project first
 * (`<root>/node_modules`), then like a dependency of the runtime — which is
 * how `@pactwright/standard`, a dependency of `pactwright`, is always found
 * after one `pnpm add -D pactwright`.
 */
export function locatePack(root: string, source: string): string | Problem {
  if (isPathSource(source)) return resolve(root, source);
  const candidates = [join(root, "package.json"), import.meta.url];
  for (const from of candidates) {
    try {
      return dirname(createRequire(from).resolve(`${source}/package.json`));
    } catch {
      /* try the next location */
    }
  }
  return {
    code: "pack-not-found",
    message: `agent pack "${source}" is not installed: it resolves neither from ${root} nor from the runtime`,
  };
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
  if (wanted !== undefined && !satisfiesRange(manifest.version, wanted)) {
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

/**
 * The capability check that guards canonical graph mutation (Distribution
 * §7): resolves the project's pack and throws `missing-capability` — listing
 * every missing capability — or the resolution problems. Nothing is written
 * by this function; callers run it before their first write.
 */
export function assertPackComplete(project: Project): ResolvedPack {
  const resolved = resolvePack({ root: project.paths.root, config: project.config });
  if (resolved.value === undefined) {
    throw PactwrightError.fromProblems("pack-unresolved", resolved.problems);
  }
  const required = requiredCapabilities(project.config);
  const missing = missingCapabilities(resolved.value.manifest, required);
  if (missing.length > 0) {
    throw new PactwrightError(
      "missing-capability",
      `agent pack "${resolved.value.manifest.name}@${resolved.value.manifest.version}" does not provide required capabilit${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")} (required: ${required.join(", ")})`,
      missing.map((capability) => ({
        code: "missing-capability",
        message: `required capability "${capability}" is not provided by the selected agent pack`,
        path: join(resolved.value!.dir, "pack.yml"),
      })),
    );
  }
  return resolved.value;
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
  const agent = pack.manifest.agents[key]!;
  return { key, prompt: join(pack.dir, agent.prompt), skills: agent.skills };
}

/** The lock-file value recording exactly this resolved pack and runtime. */
export function lockEntriesFor(pack: ResolvedPack, runtime: string = runtimeVersion()): LockFile {
  return {
    runtime: { version: runtime },
    agentPack: { name: pack.manifest.name, version: pack.manifest.version, hash: pack.hashes.pack },
    agents: pack.hashes.agents,
    skills: pack.hashes.skills,
    extensions: {},
  };
}

function yamlMap(entries: Readonly<Record<string, string>>, indent: string): string {
  const keys = Object.keys(entries).sort();
  if (keys.length === 0) return "{}\n";
  return `\n${keys.map((key) => `${indent}${key}: ${entries[key]}\n`).join("")}`;
}

/** Serialises a lock file deterministically in the `.pactwright/lock.yml` shape. */
export function serialiseLock(lock: LockFile): string {
  return [
    `runtime:\n  version: ${lock.runtime.version}\n`,
    `agent_pack:\n  name: "${lock.agentPack.name}"\n  version: ${lock.agentPack.version}\n  hash: ${lock.agentPack.hash}\n`,
    `agents:${yamlMap(lock.agents, "  ")}`,
    `skills:${yamlMap(lock.skills, "  ")}`,
    "extensions: {}\n",
  ].join("\n");
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
  const lock = lockEntriesFor(pack);
  writeLock(project.paths.lock, lock);
  return { pack, lock };
}
