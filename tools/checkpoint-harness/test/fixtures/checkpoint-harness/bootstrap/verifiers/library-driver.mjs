// Fixture driver for library-subject.mjs (CP97-S01). It runs in the child
// process that imports the candidate's `src/config.mjs`, and runs first:
// before any candidate code, it reads the subject's one-time nonce and the
// case input from stdin and keeps the functions it reports with. The
// candidate can write to stdout but cannot read the nonce: stdin is drained,
// and the permission model denies it memory, other files, workers, child
// processes and the inspector. The subject accepts only the line that starts
// with the nonce. It reports what it observed; the subject and judge decide.
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const write = writeSync;
const stringify = JSON.stringify;
const exit = process.exit.bind(process);
const input = readFileSync(0, "utf8");
const newline = input.indexOf("\n");
const nonce = input.slice(0, newline);
const text = input.slice(newline + 1);

let fact;
try {
  const lib = await import(pathToFileURL(resolve("src/config.mjs")).href);
  if (typeof lib.parseConfig !== "function" || typeof lib.ConfigError !== "function") {
    fact = { returned: null, value: null, error: "no parseConfig and ConfigError exports", message: null };
  } else {
    try {
      fact = { returned: true, value: stringify(lib.parseConfig(text)) ?? null, error: null, message: null };
    } catch (e) {
      fact = {
        returned: false,
        value: null,
        error: e instanceof lib.ConfigError ? "ConfigError" : String(e?.name ?? typeof e),
        message: typeof e?.message === "string" ? e.message : null,
      };
    }
  }
} catch (e) {
  fact = { returned: null, value: null, error: `the library did not load: ${String(e?.code ?? e)}`, message: null };
}
const line = `${nonce} ${stringify(fact)}\n`;
write(1, line);
exit(0);
