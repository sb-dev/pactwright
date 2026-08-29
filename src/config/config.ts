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
import { parseYaml, readYamlFile } from "../yaml.js";
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
 * A YAML double-quoted scalar holding `text`. JSON is a subset of YAML 1.2
 * and the two share their double-quoted escape set, so `JSON.stringify` is a
 * correct encoder here — and for an ordinary package name or relative path it
 * emits exactly the bytes a hand-written config already has. Interpolating
 * such values raw would let a `"`, `\` or newline in a source break out of
 * the field and leave an unparseable config behind.
 */
function scalar(text: string): string {
  return JSON.stringify(text);
}

/** The canonical `extensions:` block, the only region the commands rewrite. */
function extensionsBlock(config: PactwrightConfig): readonly string[] {
  const ids = Object.keys(config.extensions).sort();
  if (ids.length === 0) return ["extensions: {}"];
  const lines = ["extensions:"];
  ids.forEach((id, index) => {
    const extension = config.extensions[id]!;
    if (index > 0) lines.push("");
    lines.push(
      `  ${id}:`,
      `    enabled: ${extension.enabled}`,
      `    source: ${scalar(extension.source)}`,
    );
  });
  return lines;
}

/**
 * Serialises a configuration in the canonical `.pactwright/config.yml`
 * shape — the exact bytes `pactwright init` writes for the default state.
 * This is the fallback whenever the previous file cannot be edited in place;
 * it re-emits from parsed values, so comments and incidental layout are not
 * carried over. `rewriteConfig` is what the commands normally use.
 */
export function serialiseConfig(config: PactwrightConfig): string {
  const lines: string[] = [
    "version: 1",
    "",
    "agent_pack:",
    `  source: ${scalar(config.agentPack.source)}`,
  ];
  if (config.agentPack.version !== undefined) {
    lines.push(`  version: ${scalar(config.agentPack.version)}`);
  }
  // `adapter.type` is a validated enum and extension ids are validated
  // kebab-case, so both are safe bare; quoting them would also change the
  // bytes `init` writes.
  lines.push("", "adapter:", `  type: ${config.adapter.type}`, "");
  lines.push(...extensionsBlock(config));
  lines.push("", "github:", `  enabled: ${config.github.enabled}`, "");
  return lines.join("\n");
}

/** The line range of the top-level `extensions:` key, or `undefined`. */
function extensionsRegion(lines: readonly string[]): { start: number; end: number } | undefined {
  const start = lines.findIndex((line) => /^extensions:/.test(line));
  if (start === -1) return undefined;
  if (lines.some((line) => line.includes("\t"))) return undefined;
  // A flow mapping (`extensions: {}`) is the whole region. Anything else on
  // the key line is a shape this editor does not claim to understand.
  const inline = lines[start]!.slice("extensions:".length).trim();
  if (inline !== "") return inline === "{}" ? { start, end: start } : undefined;
  let end = start;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.trim() === "") continue;
    if (!/^\s/.test(line)) break;
    end = i;
  }
  return { start, end };
}

/**
 * The previous configuration text with only its `extensions:` block replaced
 * (Distribution §3). `extension add` and `remove` change nothing else, so
 * every other byte — comments, key order, spacing a team chose — survives.
 *
 * Falls back to a full `serialiseConfig` rewrite whenever the edit cannot be
 * made confidently, including when the spliced result does not parse back to
 * the intended configuration. The fallback is today's behaviour, so the worst
 * case is losing comments rather than corrupting the file — which matters
 * because `removeExtension` never rolls its write back.
 *
 * Comments *inside* the extensions block are part of the replaced region and
 * are not preserved.
 */
export function rewriteConfig(previous: string, config: PactwrightConfig): string {
  const canonical = serialiseConfig(config);
  const newline = previous.includes("\r\n") ? "\r\n" : "\n";
  const lines = previous.split(/\r?\n/);
  const block = [...extensionsBlock(config)];
  const region = extensionsRegion(lines);

  let spliced: string;
  if (region !== undefined) {
    spliced = [...lines.slice(0, region.start), ...block, ...lines.slice(region.end + 1)].join(
      newline,
    );
  } else {
    // No `extensions:` key at all: place it before `github:`, else append.
    const github = lines.findIndex((line) => /^github:/.test(line));
    const at = github === -1 ? lines.length : github;
    spliced = [...lines.slice(0, at), ...block, "", ...lines.slice(at)].join(newline);
  }

  const read = parseYaml(spliced, "config.yml");
  if (read.problems.length > 0) return canonical;
  const reparsed = parseConfig(read.value, "config.yml");
  if (reparsed.value === undefined) return canonical;
  return serialiseConfig(reparsed.value) === canonical ? spliced : canonical;
}
