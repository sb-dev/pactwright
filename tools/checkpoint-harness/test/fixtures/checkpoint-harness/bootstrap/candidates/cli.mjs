// The command of BOOT §2: a known-good CP97-S02 submission for scripted
// producers. The accepted library does all validation.
import { readFileSync } from "node:fs";
import { parseConfig } from "./config.mjs";

const [path] = process.argv.slice(2);
try {
  process.stdout.write(`${JSON.stringify(parseConfig(readFileSync(path, "utf8")))}\n`);
} catch (e) {
  process.stderr.write(`config: ${path}: ${e.message}\n`);
  process.exitCode = 1;
}
