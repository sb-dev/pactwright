/**
 * Minimal path-glob matcher — enough for the prefix globs the spec graph uses
 * (`tools/**`, `specs/schema/**`, `.github/workflows/**`, `*.ts`) without
 * pulling in a dependency. Shared by `check-diff` (sensitive_paths) and
 * `drift-map` (capability `paths`).
 *
 * Semantics:
 *   `**` — any run of characters, slashes included (any depth)
 *   `*`  — any run of characters within a single segment (no slash)
 *   everything else is a literal (regex metacharacters are escaped)
 * The whole path must match (the pattern is anchored at both ends).
 */
const SPECIALS = new Set("\\^$.|?+()[]{}".split(""));

function globToRegExp(pattern: string): RegExp {
  let out = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        out += ".*"; // `**` crosses path separators
        i++;
      } else {
        out += "[^/]*"; // `*` stays within a segment
      }
    } else if (SPECIALS.has(c)) {
      out += "\\" + c;
    } else {
      out += c;
    }
  }
  return new RegExp(out + "$");
}

/** True iff `filePath` (repo-relative, posix separators) matches `pattern`. */
export function matchGlob(filePath: string, pattern: string): boolean {
  return globToRegExp(pattern).test(filePath);
}

/** True iff `filePath` matches any pattern in `patterns`. */
export function matchAny(filePath: string, patterns: string[]): boolean {
  return patterns.some((p) => matchGlob(filePath, p));
}
