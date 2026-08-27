import type { ParseResult } from "./config.js";
import {
  Checker,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
  type UnknownRecord,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/**
 * One locked extension: the exact package, version and content hash it
 * resolved to (Distribution §6).
 */
export interface LockExtension {
  readonly package: string;
  readonly version: string;
  readonly hash: string;
  /** Extension id → exact version of a required peer extension. Omitted when empty. */
  readonly dependencies?: Readonly<Record<string, string>>;
}

/** `.pactwright/lock.yml` — the exact resolved setup (Distribution §6). */
export interface LockFile {
  readonly runtime: { readonly version: string };
  readonly agentPack: {
    readonly name: string;
    readonly version: string;
    readonly hash: string;
  };
  /** Agent name → content hash. */
  readonly agents: Readonly<Record<string, string>>;
  /** Skill name → content hash. A runtime addition relative to the §6 shape. */
  readonly skills: Readonly<Record<string, string>>;
  /**
   * Extension id → locked extension. Produced empty in this checkpoint —
   * resolution knows no extensions yet — but the structure is Distribution
   * §6, prepared for extension support.
   */
  readonly extensions: Readonly<Record<string, LockExtension>>;
}

export const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

/** Extension ids are kebab-case identifiers, like `project-intelligence`. */
export const EXTENSION_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The lock records exact resolved state, so versions are never ranges. */
const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

function expectHash(c: Checker, value: unknown, label: string): string | undefined {
  const text = expectString(c, value, label);
  if (text === undefined) return undefined;
  if (!HASH_PATTERN.test(text))
    return c.fail("invalid-hash", `${label} must match sha256:<64 hex>`);
  return text;
}

function expectExactVersion(c: Checker, value: unknown, label: string): string | undefined {
  const text = expectString(c, value, label);
  if (text === undefined) return undefined;
  if (!EXACT_VERSION_PATTERN.test(text)) {
    return c.fail("invalid-version", `${label} must be an exact x.y.z version, found "${text}"`);
  }
  return text;
}

function parseExtension(c: Checker, raw: unknown, label: string): LockExtension | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["package", "version", "hash"]);
  rejectUnknownKeys(c, record, label, ["package", "version", "hash", "dependencies"]);
  const pkg = expectString(c, record["package"], `${label}.package`);
  const version = expectExactVersion(c, record["version"], `${label}.version`);
  const hash = expectHash(c, record["hash"], `${label}.hash`);

  let dependencies: Record<string, string> | undefined;
  if (record["dependencies"] !== undefined) {
    const deps = expectRecord(c, record["dependencies"], `${label}.dependencies`);
    if (deps !== undefined) {
      dependencies = {};
      for (const id of Object.keys(deps).sort()) {
        if (!EXTENSION_ID_PATTERN.test(id)) {
          c.fail(
            "invalid-extension-id",
            `${label}.dependencies key "${id}" is not a valid extension id`,
          );
          continue;
        }
        const wanted = expectExactVersion(c, deps[id], `${label}.dependencies.${id}`);
        if (wanted !== undefined) dependencies[id] = wanted;
      }
    }
  }

  if (pkg === undefined || version === undefined || hash === undefined) return undefined;
  return {
    package: pkg,
    version,
    hash,
    ...(dependencies === undefined || Object.keys(dependencies).length === 0
      ? {}
      : { dependencies }),
  };
}

function parseExtensions(c: Checker, raw: unknown): Record<string, LockExtension> {
  const out: Record<string, LockExtension> = {};
  if (raw === undefined) return out;
  const record = expectRecord(c, raw, "lock.extensions");
  if (record === undefined) return out;
  for (const id of Object.keys(record).sort()) {
    if (!EXTENSION_ID_PATTERN.test(id)) {
      c.fail("invalid-extension-id", `lock.extensions key "${id}" is not a valid extension id`);
      continue;
    }
    const extension = parseExtension(c, record[id], `lock.extensions.${id}`);
    if (extension !== undefined) out[id] = extension;
  }
  return out;
}

function parseHashMap(c: Checker, raw: unknown, label: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw === undefined) return out;
  const record = expectRecord(c, raw, label);
  if (record === undefined) return out;
  for (const key of Object.keys(record).sort()) {
    const hash = expectHash(c, record[key], `${label}.${key}`);
    if (hash !== undefined) out[key] = hash;
  }
  return out;
}

export function parseLock(raw: unknown, path: string): ParseResult<LockFile> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "lock");
  if (root === undefined) return { value: undefined, problems: c.problems };

  requireKeys(c, root, "lock", ["runtime", "agent_pack"]);
  rejectUnknownKeys(c, root, "lock", ["runtime", "agent_pack", "agents", "skills", "extensions"]);

  let runtimeVersion: string | undefined;
  const runtime = expectRecord(c, root["runtime"], "lock.runtime");
  if (runtime !== undefined) {
    requireKeys(c, runtime, "lock.runtime", ["version"]);
    rejectUnknownKeys(c, runtime, "lock.runtime", ["version"]);
    runtimeVersion = expectString(c, runtime["version"], "lock.runtime.version");
  }

  let pack: LockFile["agentPack"] | undefined;
  const agentPack: UnknownRecord | undefined = expectRecord(
    c,
    root["agent_pack"],
    "lock.agent_pack",
  );
  if (agentPack !== undefined) {
    requireKeys(c, agentPack, "lock.agent_pack", ["name", "version", "hash"]);
    rejectUnknownKeys(c, agentPack, "lock.agent_pack", ["name", "version", "hash"]);
    const name = expectString(c, agentPack["name"], "lock.agent_pack.name");
    const version = expectString(c, agentPack["version"], "lock.agent_pack.version");
    const hash = expectHash(c, agentPack["hash"], "lock.agent_pack.hash");
    if (name !== undefined && version !== undefined && hash !== undefined) {
      pack = { name, version, hash };
    }
  }

  const agents = parseHashMap(c, root["agents"], "lock.agents");
  const skills = parseHashMap(c, root["skills"], "lock.skills");
  const extensions = parseExtensions(c, root["extensions"]);

  if (!c.ok || runtimeVersion === undefined || pack === undefined) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      runtime: { version: runtimeVersion },
      agentPack: pack,
      agents,
      skills,
      extensions,
    },
    problems: [],
  };
}

export function loadLock(path: string): ParseResult<LockFile> {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseLock(read.value, path);
}
