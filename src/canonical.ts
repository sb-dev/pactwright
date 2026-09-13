import { PactwrightError } from "./errors.js";

/**
 * Deterministic serialisation shared by every identity Pactwright derives:
 * Project Graph revision, `environment_lock_hash` and Agent Pack hashing.
 * It lives on its own so the identity producers do not have to import each
 * other.
 *
 * JSON with object keys sorted recursively, `undefined` members dropped and
 * no whitespace, so equal values always serialise to equal bytes.
 */
export function canonicalJson(value: unknown): string {
  return canonicalise(value, new Set());
}

/** A content identity is `sha256:<64 hex>`, shared by locks and revisions. */
export const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function canonicalise(value: unknown, path: Set<object>): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (path.has(value)) {
    throw new PactwrightError("cyclic-value", "cannot canonicalise a value that contains itself");
  }
  path.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => canonicalise(item, path)).join(",")}]`;
    }
    const record = value as Record<string, unknown>;
    const members = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort(compare)
      .map((key) => `${JSON.stringify(key)}:${canonicalise(record[key], path)}`);
    return `{${members.join(",")}}`;
  } finally {
    path.delete(value);
  }
}
