import { readFileSync } from "node:fs";
import { CORE_SCHEMA, load, YAMLException } from "js-yaml";
import type { Problem } from "./errors.js";

export interface YamlReadResult {
  readonly value: unknown;
  readonly problems: readonly Problem[];
}

/**
 * Parses YAML text with the YAML core schema: no timestamp, merge or
 * binary coercion, so `created: 2026-01-01` stays a string.
 * Returns problems instead of throwing so callers can aggregate.
 */
export function parseYaml(text: string, path: string): YamlReadResult {
  try {
    const value = load(text, { schema: CORE_SCHEMA, filename: path });
    return { value: value === undefined ? null : value, problems: [] };
  } catch (error) {
    const message = error instanceof YAMLException ? error.reason : String(error);
    return {
      value: null,
      problems: [{ code: "invalid-yaml", message: `invalid YAML: ${message}`, path }],
    };
  }
}

export function readYamlFile(path: string): YamlReadResult {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const message = code === "ENOENT" ? "file not found" : `cannot read file: ${String(error)}`;
    return { value: null, problems: [{ code: "missing-file", message, path }] };
  }
  return parseYaml(text, path);
}
