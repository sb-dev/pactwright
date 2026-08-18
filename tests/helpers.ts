import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const fixtures = path.join(repoRoot, "tests", "fixtures");

export function fixture(name: string): string {
  return path.join(fixtures, name);
}
