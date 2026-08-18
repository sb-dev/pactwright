import type { Problem } from "../errors.js";
import {
  Checker,
  expectBoolean,
  expectEnum,
  expectRecord,
  expectString,
  expectVersion,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/** `.pactwright/config.yml` — desired installation state (Distribution §3). */
export interface PactwrightConfig {
  readonly version: 1;
  readonly agentPack: {
    readonly source: string;
    readonly version?: string;
  };
  readonly adapter: {
    readonly type: "claude-code";
  };
  /** Always empty in this checkpoint: optional extensions are not implemented. */
  readonly extensions: Readonly<Record<string, never>>;
  readonly github: {
    readonly enabled: boolean;
  };
}

export const CONFIG_VERSION = 1;
export const ADAPTER_TYPES = ["claude-code"] as const;

export interface ParseResult<T> {
  readonly value: T | undefined;
  readonly problems: readonly Problem[];
}

export function parseConfig(raw: unknown, path: string): ParseResult<PactwrightConfig> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "config");
  if (root === undefined) return { value: undefined, problems: c.problems };

  requireKeys(c, root, "config", ["version", "agent_pack", "adapter", "github"]);
  rejectUnknownKeys(c, root, "config", [
    "version",
    "agent_pack",
    "adapter",
    "extensions",
    "github",
  ]);
  expectVersion(c, root["version"], "config.version", CONFIG_VERSION);

  let source: string | undefined;
  let packVersion: string | undefined;
  const agentPack = expectRecord(c, root["agent_pack"], "config.agent_pack");
  if (agentPack !== undefined) {
    requireKeys(c, agentPack, "config.agent_pack", ["source"]);
    rejectUnknownKeys(c, agentPack, "config.agent_pack", ["source", "version"]);
    source = expectString(c, agentPack["source"], "config.agent_pack.source");
    packVersion = expectString(c, agentPack["version"], "config.agent_pack.version");
  }

  let adapterType: (typeof ADAPTER_TYPES)[number] | undefined;
  const adapter = expectRecord(c, root["adapter"], "config.adapter");
  if (adapter !== undefined) {
    requireKeys(c, adapter, "config.adapter", ["type"]);
    rejectUnknownKeys(c, adapter, "config.adapter", ["type"]);
    adapterType = expectEnum(c, adapter["type"], "config.adapter.type", ADAPTER_TYPES);
  }

  if (root["extensions"] !== undefined) {
    const extensions = expectRecord(c, root["extensions"], "config.extensions");
    if (extensions !== undefined && Object.keys(extensions).length > 0) {
      c.fail(
        "extensions-not-supported",
        `config.extensions must be empty: optional extensions are not supported by this runtime (found: ${Object.keys(extensions).join(", ")})`,
      );
    }
  }

  let enabled: boolean | undefined;
  const github = expectRecord(c, root["github"], "config.github");
  if (github !== undefined) {
    requireKeys(c, github, "config.github", ["enabled"]);
    rejectUnknownKeys(c, github, "config.github", ["enabled"]);
    enabled = expectBoolean(c, github["enabled"], "config.github.enabled");
  }

  if (!c.ok || source === undefined || adapterType === undefined || enabled === undefined) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      version: 1,
      agentPack: packVersion === undefined ? { source } : { source, version: packVersion },
      adapter: { type: adapterType },
      extensions: {},
      github: { enabled },
    },
    problems: [],
  };
}

export function loadConfig(path: string): ParseResult<PactwrightConfig> {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseConfig(read.value, path);
}
