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
  /** Skill name → content hash. */
  readonly skills: Readonly<Record<string, string>>;
  /** Always empty in this checkpoint: optional extensions are not implemented. */
  readonly extensions: Readonly<Record<string, never>>;
}

export const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

function expectHash(c: Checker, value: unknown, label: string): string | undefined {
  const text = expectString(c, value, label);
  if (text === undefined) return undefined;
  if (!HASH_PATTERN.test(text))
    return c.fail("invalid-hash", `${label} must match sha256:<64 hex>`);
  return text;
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

  if (root["extensions"] !== undefined) {
    const extensions = expectRecord(c, root["extensions"], "lock.extensions");
    if (extensions !== undefined && Object.keys(extensions).length > 0) {
      c.fail(
        "extensions-not-supported",
        `lock.extensions must be empty: optional extensions are not supported by this runtime (found: ${Object.keys(extensions).join(", ")})`,
      );
    }
  }

  if (!c.ok || runtimeVersion === undefined || pack === undefined) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      runtime: { version: runtimeVersion },
      agentPack: pack,
      agents,
      skills,
      extensions: {},
    },
    problems: [],
  };
}

export function loadLock(path: string): ParseResult<LockFile> {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseLock(read.value, path);
}
