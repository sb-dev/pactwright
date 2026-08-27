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
import { EXTENSION_ID_PATTERN } from "./lock.js";

/** One configured extension: desired state only (Distribution §4). */
export interface ConfigExtension {
  /** A disabled extension keeps its graph types registered but contributes no behaviour. */
  readonly enabled: boolean;
  /** Package name or project-relative path the extension resolves from. */
  readonly source: string;
}

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
  /** Extension id → desired extension state (Distribution §4). */
  readonly extensions: Readonly<Record<string, ConfigExtension>>;
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

  const extensions: Record<string, ConfigExtension> = Object.create(null) as Record<
    string,
    ConfigExtension
  >;
  if (root["extensions"] !== undefined) {
    const raw = expectRecord(c, root["extensions"], "config.extensions");
    if (raw !== undefined) {
      for (const id of Object.keys(raw).sort()) {
        if (!EXTENSION_ID_PATTERN.test(id)) {
          c.fail(
            "invalid-extension-id",
            `config.extensions key "${id}" is not a valid extension id`,
          );
          continue;
        }
        const label = `config.extensions.${id}`;
        const entry = expectRecord(c, raw[id], label);
        if (entry === undefined) continue;
        requireKeys(c, entry, label, ["enabled", "source"]);
        rejectUnknownKeys(c, entry, label, ["enabled", "source"]);
        const extensionEnabled = expectBoolean(c, entry["enabled"], `${label}.enabled`);
        const extensionSource = expectString(c, entry["source"], `${label}.source`);
        if (extensionEnabled !== undefined && extensionSource !== undefined) {
          extensions[id] = { enabled: extensionEnabled, source: extensionSource };
        }
      }
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
      // Copied to a plain object; callers guard dynamic id lookups with
      // `Object.hasOwn` so an id like "constructor" cannot resolve to an
      // Object.prototype member.
      extensions: { ...extensions },
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

/**
 * Serialises a configuration in the canonical `.pactwright/config.yml`
 * shape — the exact bytes `pactwright init` writes for the default state.
 * Commands that rewrite the configuration (extension add/remove) use this,
 * so a rewritten file is always canonically formatted.
 */
export function serialiseConfig(config: PactwrightConfig): string {
  const lines: string[] = [
    "version: 1",
    "",
    "agent_pack:",
    `  source: "${config.agentPack.source}"`,
  ];
  if (config.agentPack.version !== undefined) {
    lines.push(`  version: "${config.agentPack.version}"`);
  }
  lines.push("", "adapter:", `  type: ${config.adapter.type}`, "");
  const ids = Object.keys(config.extensions).sort();
  if (ids.length === 0) {
    lines.push("extensions: {}");
  } else {
    lines.push("extensions:");
    ids.forEach((id, index) => {
      const extension = config.extensions[id]!;
      if (index > 0) lines.push("");
      lines.push(
        `  ${id}:`,
        `    enabled: ${extension.enabled}`,
        `    source: "${extension.source}"`,
      );
    });
  }
  lines.push("", "github:", `  enabled: ${config.github.enabled}`, "");
  return lines.join("\n");
}
