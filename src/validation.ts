import type { Problem } from "./errors.js";

/**
 * Collects problems for one file. Every `expect*` helper records a problem
 * and returns `undefined` on failure so parsers can keep going and report
 * everything wrong with a file in one pass.
 */
export class Checker {
  readonly problems: Problem[] = [];

  constructor(readonly path: string) {}

  fail(code: string, message: string): undefined {
    this.problems.push({ code, message, path: this.path });
    return undefined;
  }

  get ok(): boolean {
    return this.problems.length === 0;
  }
}

export type Unknown = unknown;
export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/*
 * Every `expect*` helper treats `undefined` (an absent key) as already
 * reported: `requireKeys` owns the missing-field problem, so a required
 * field never produces two problems.
 */

export function expectRecord(c: Checker, value: unknown, label: string): UnknownRecord | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return c.fail("invalid-type", `${label} must be a mapping`);
  return value;
}

export function expectString(c: Checker, value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length === 0) {
    return c.fail("invalid-type", `${label} must be a non-empty string`);
  }
  return value;
}

export function expectInteger(c: Checker, value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return c.fail("invalid-type", `${label} must be an integer`);
  }
  return value;
}

export function expectBoolean(c: Checker, value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") return c.fail("invalid-type", `${label} must be a boolean`);
  return value;
}

export function expectEnum<T extends string>(
  c: Checker,
  value: unknown,
  label: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    return c.fail("invalid-value", `${label} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function expectVersion(c: Checker, value: unknown, label: string, expected: number): void {
  const version = expectInteger(c, value, label);
  if (version !== undefined && version !== expected) {
    c.fail("unsupported-version", `${label} must be ${expected}, found ${version}`);
  }
}

export function requireKeys(
  c: Checker,
  record: UnknownRecord,
  label: string,
  keys: readonly string[],
): void {
  for (const key of keys) {
    if (!(key in record)) c.fail("missing-field", `${label} is missing required field "${key}"`);
  }
}

export function rejectUnknownKeys(
  c: Checker,
  record: UnknownRecord,
  label: string,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) c.fail("unknown-field", `${label} has unknown field "${key}"`);
  }
}
