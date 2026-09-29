// Fixture subject for library.accepts and library.rejects (CP97-S01). It loads
// no code under test: library-driver.mjs loads the candidate's
// `src/config.mjs` in a child process, in a V8 realm of its own that has no
// process, built-in modules or output, and prints one fact. The subject passes
// the case input on stdin and reduces the child's output to one line of
// primitive facts; output that is not exactly one fact reports nothing.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const INPUTS = {
  "lowest-port": '{"port": 1, "label": "api"}',
  "highest-port": '{"port": 65535, "label": "api"}',
  "trimmed-label": '{"port": 8080, "label": "  api  "}',
  "malformed-json": '{"port": 8080, "label": "api"',
  "not-an-object": '[8080, "api"]',
  "missing-port": '{"label": "api"}',
  "missing-label": '{"port": 8080}',
  "port-not-integer": '{"port": 80.5, "label": "api"}',
  "port-string": '{"port": "8080", "label": "api"}',
  "label-not-string": '{"port": 8080, "label": 7}',
  "port-zero": '{"port": 0, "label": "api"}',
  "port-above-highest": '{"port": 65536, "label": "api"}',
  "empty-label": '{"port": 8080, "label": ""}',
  "blank-label": '{"port": 8080, "label": "   "}',
  "unknown-field": '{"port": 8080, "label": "api", "host": "localhost"}',
};

const [owner, , id] = readFileSync(0, "utf8").split("/");
if (owner !== "CP97-S01" || id === undefined || !Object.hasOwn(INPUTS, id)) process.exit(2);

const ran = spawnSync(
  process.execPath,
  ["--experimental-vm-modules", "verifiers/library-driver.mjs"],
  { input: INPUTS[id], stdio: ["pipe", "pipe", "ignore"], env: {}, timeout: 5_000 },
);
// A program the runner had to stop, or that a signal killed, has no exit status.
const signal = ran.signal ?? ran.error?.code ?? null;
const lines = ran.stdout
  .toString("utf8")
  .split("\n")
  .filter((l) => l !== "");
let fact = { returned: null, value: null, error: null, message: null };
if (lines.length === 1) {
  try {
    const o = JSON.parse(lines[0]);
    fact = {
      returned: typeof o.returned === "boolean" ? o.returned : null,
      value: typeof o.value === "string" ? o.value : null,
      error: typeof o.error === "string" ? o.error : null,
      message: typeof o.message === "string" ? o.message : null,
    };
  } catch {
    // Not the driver's fact.
  }
}
process.stdout.write(`${JSON.stringify({ exit: ran.status, signal, ...fact })}\n`);
