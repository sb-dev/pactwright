import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { Problem } from "../errors.js";

export function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function parseVersion(text: string): readonly [number, number, number] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (match === null) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Whether `range` is a shape `satisfiesRange` understands: `x.y.z` or `^x.y.z`. */
export function isValidRange(range: string): boolean {
  return parseVersion(range.startsWith("^") ? range.slice(1) : range) !== undefined;
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

/** Whether `source` is a filesystem path rather than a package name. */
export function isPathSource(source: string): boolean {
  return source.startsWith("./") || source.startsWith("../") || isAbsolute(source);
}

/**
 * Where a package-backed component (agent pack or extension) lives. A path
 * source resolves from the project root. A package source resolves like a
 * dependency of the project first (`<root>/node_modules`), then like a
 * dependency of the runtime — which is how `@pactwright/standard`, a
 * dependency of `pactwright`, is always found after one
 * `pnpm add -D pactwright`. `kind` names the component in problem messages.
 */
export function locatePackage(root: string, source: string, kind: string): string | Problem {
  if (isPathSource(source)) return resolve(root, source);
  const candidates = [join(root, "package.json"), import.meta.url];
  let unexported = false;
  for (const from of candidates) {
    try {
      return dirname(createRequire(from).resolve(`${source}/package.json`));
    } catch (error) {
      // An installed package whose `exports` map hides package.json is a
      // different failure from an absent one; try the next location.
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ERR_PACKAGE_PATH_NOT_EXPORTED") unexported = true;
    }
  }
  if (unexported) {
    return {
      code: "pack-not-exported",
      message: `${kind} "${source}" is installed but its package "exports" does not expose ./package.json, so it cannot be used as a ${kind}`,
    };
  }
  return {
    code: "pack-not-found",
    message: `${kind} "${source}" is not installed: it resolves neither from ${root} nor from the runtime`,
  };
}
