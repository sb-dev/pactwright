import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, normalize, sep } from "node:path";
import type { ParseResult } from "../config/config.js";
import {
  Checker,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";
import { CAPABILITY_PATTERN } from "./capabilities.js";

/** File name of an agent-pack manifest at the pack root. */
export const PACK_MANIFEST_FILE = "pack.yml";
/** Skills are looked up by name at `skills/<name>.md` under the pack root. */
export const SKILLS_DIR = "skills";

export interface PackAgent {
  /** Prompt path relative to the pack root, e.g. `agents/spec.md`. */
  readonly prompt: string;
  /** Skill names, in manifest order, each resolving to `skills/<name>.md`. */
  readonly skills: readonly string[];
}

/** An agent-pack manifest (Distribution §7). */
export interface PackManifest {
  readonly name: string;
  readonly version: string;
  /** Compatible runtime: an exact version or a `^x.y.z` caret range. */
  readonly pactwright: string;
  /** Capability → agent key; every value names an entry of `agents`. */
  readonly capabilities: Readonly<Record<string, string>>;
  readonly agents: Readonly<Record<string, PackAgent>>;
}

export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const COMPAT_PATTERN = /^\^?\d+\.\d+\.\d+$/;
const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
// npm package name, optionally scoped; capped at npm's 214-character limit.
export const PACKAGE_NAME_PATTERN = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const PACK_NAME_PATTERN = PACKAGE_NAME_PATTERN;

function expectRelativeFile(c: Checker, value: unknown, label: string): string | undefined {
  const text = expectString(c, value, label);
  if (text === undefined) return undefined;
  const clean = normalize(text);
  // Reject a leading `..` path *segment*, not any name starting with two
  // dots: `agents/..foo.md` is a legitimate (if odd) file name.
  if (isAbsolute(clean) || clean === ".." || clean.startsWith(`..${sep}`)) {
    return c.fail("invalid-path", `${label} must be a relative path inside the pack`);
  }
  return text;
}

function parseAgent(c: Checker, raw: unknown, label: string): PackAgent | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return c.fail("invalid-type", `${label} must be a mapping`);
  requireKeys(c, record, label, ["prompt"]);
  rejectUnknownKeys(c, record, label, ["prompt", "skills"]);
  const prompt = expectRelativeFile(c, record["prompt"], `${label}.prompt`);
  const skills: string[] = [];
  if (record["skills"] !== undefined) {
    if (!Array.isArray(record["skills"])) {
      c.fail("invalid-type", `${label}.skills must be a list of skill names`);
    } else {
      record["skills"].forEach((item, index) => {
        const name = expectString(c, item, `${label}.skills[${index}]`);
        if (name === undefined) return;
        if (!NAME_PATTERN.test(name)) {
          c.fail("invalid-value", `${label}.skills[${index}] "${name}" is not a valid skill name`);
        } else if (skills.includes(name)) {
          c.fail("duplicate-skill", `${label}.skills lists "${name}" more than once`);
        } else skills.push(name);
      });
    }
  }
  return prompt === undefined ? undefined : { prompt, skills };
}

/** Parses manifest data; structural checks only, no filesystem access. */
export function parsePackManifest(raw: unknown, path: string): ParseResult<PackManifest> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "pack");
  if (root === undefined) {
    c.fail("invalid-type", "pack manifest must be a mapping");
    return { value: undefined, problems: c.problems };
  }
  requireKeys(c, root, "pack", ["name", "version", "pactwright", "capabilities", "agents"]);
  rejectUnknownKeys(c, root, "pack", ["name", "version", "pactwright", "capabilities", "agents"]);

  const name = expectString(c, root["name"], "pack.name");
  if (name !== undefined && (name.length > 214 || !PACK_NAME_PATTERN.test(name))) {
    c.fail(
      "invalid-value",
      `pack.name must be a lowercase npm package name (optionally scoped), found "${name}"`,
    );
  }
  const version = expectString(c, root["version"], "pack.version");
  if (version !== undefined && !VERSION_PATTERN.test(version)) {
    c.fail("invalid-value", `pack.version must be x.y.z, found "${version}"`);
  }
  const pactwright = expectString(c, root["pactwright"], "pack.pactwright");
  if (pactwright !== undefined && !COMPAT_PATTERN.test(pactwright)) {
    c.fail("invalid-value", `pack.pactwright must be x.y.z or ^x.y.z, found "${pactwright}"`);
  }

  // Prototype-less maps: keys are author-controlled, and a name like
  // "constructor" must never resolve to an Object.prototype member.
  const agents: Record<string, PackAgent> = Object.create(null) as Record<string, PackAgent>;
  const agentsRaw = expectRecord(c, root["agents"], "pack.agents");
  if (agentsRaw !== undefined) {
    for (const key of Object.keys(agentsRaw).sort()) {
      if (!NAME_PATTERN.test(key)) {
        c.fail("invalid-value", `pack.agents key "${key}" is not a valid agent name`);
        continue;
      }
      const agent = parseAgent(c, agentsRaw[key], `pack.agents.${key}`);
      if (agent !== undefined) agents[key] = agent;
    }
    if (Object.keys(agentsRaw).length === 0) {
      c.fail("missing-field", "pack.agents must declare at least one agent");
    }
  }

  const capabilities: Record<string, string> = Object.create(null) as Record<string, string>;
  const capsRaw = expectRecord(c, root["capabilities"], "pack.capabilities");
  if (capsRaw !== undefined) {
    for (const capability of Object.keys(capsRaw).sort()) {
      if (!CAPABILITY_PATTERN.test(capability)) {
        c.fail("invalid-capability", `pack.capabilities "${capability}" is not a capability name`);
        continue;
      }
      const agent = expectString(c, capsRaw[capability], `pack.capabilities.${capability}`);
      if (agent === undefined) continue;
      if (agentsRaw !== undefined && !Object.hasOwn(agentsRaw, agent)) {
        c.fail(
          "unknown-agent",
          `pack.capabilities.${capability} names agent "${agent}", which pack.agents does not declare`,
        );
        continue;
      }
      capabilities[capability] = agent;
    }
  }

  if (!c.ok || name === undefined || version === undefined || pactwright === undefined) {
    return { value: undefined, problems: c.problems };
  }
  return { value: { name, version, pactwright, capabilities, agents }, problems: [] };
}

export function skillPath(dir: string, skill: string): string {
  return join(dir, SKILLS_DIR, `${skill}.md`);
}

function isNonEmptyFile(path: string): boolean {
  try {
    return statSync(path).isFile() && statSync(path).size > 0;
  } catch {
    return false;
  }
}

/**
 * Loads and validates the manifest at `<dir>/pack.yml`, then checks that
 * every agent prompt and every referenced skill exists as a non-empty file.
 */
export function loadPackManifest(dir: string): ParseResult<PackManifest> {
  const manifestPath = join(dir, PACK_MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    return {
      value: undefined,
      problems: [
        { code: "pack-not-found", message: `no ${PACK_MANIFEST_FILE} found`, path: manifestPath },
      ],
    };
  }
  const read = readYamlFile(manifestPath);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  const parsed = parsePackManifest(read.value, manifestPath);
  if (parsed.value === undefined) return parsed;

  const c = new Checker(manifestPath);
  for (const [key, agent] of Object.entries(parsed.value.agents)) {
    if (!isNonEmptyFile(join(dir, agent.prompt))) {
      c.fail(
        "missing-prompt",
        `pack.agents.${key}.prompt "${agent.prompt}" is not a non-empty file in the pack`,
      );
    }
    for (const skill of agent.skills) {
      if (!isNonEmptyFile(skillPath(dir, skill))) {
        c.fail(
          "missing-skill",
          `pack.agents.${key} uses skill "${skill}" but ${SKILLS_DIR}/${skill}.md is not a non-empty file in the pack`,
        );
      }
    }
  }
  return c.ok ? parsed : { value: undefined, problems: c.problems };
}

/** Reads a pack file with LF line endings, the bytes that are hashed. */
export function readPackFile(dir: string, relative: string): string {
  return readFileSync(join(dir, relative), "utf8").replace(/\r\n/g, "\n");
}
