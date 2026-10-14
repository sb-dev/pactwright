import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export function normalize(text) {
  return String(text).trim();
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(normalize(process.argv[2] ?? ""));
}
