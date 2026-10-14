import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

// Removes exactly the leading and trailing characters that
// String.prototype.trim removes: spaces, tabs, line breaks and Unicode
// space separators such as U+00A0 and U+3000 (LEARNING §2).
export function normalize(text) {
  return String(text).trim();
}

// Run as a program: print the normalised first argument (LEARNING §2).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(normalize(process.argv[2] ?? ""));
}
