// Fixture subject for library.accepts and library.rejects (CP97-S01). It
// loads no code under test: a child process imports the candidate's
// `src/config.mjs` and calls `parseConfig` on the input of the target's case.
// The child reports on file descriptor 3, so output the library writes itself
// cannot pass for the report. The subject prints one line of facts.
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

const PROBE = `
import { writeSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const text = process.argv[1];
const report = (fact) => writeSync(3, JSON.stringify(fact));
const lib = await import(pathToFileURL(resolve("src/config.mjs")).href);
try {
  report({ returned: true, value: JSON.stringify(lib.parseConfig(text)) ?? null, error: null, message: null });
} catch (e) {
  const typed = typeof lib.ConfigError === "function" && e instanceof lib.ConfigError;
  report({
    returned: false,
    value: null,
    error: typed ? "ConfigError" : String(e?.name ?? typeof e),
    message: typeof e?.message === "string" ? e.message : null,
  });
}
`;
const ran = spawnSync(process.execPath, ["--input-type=module", "-e", PROBE, INPUTS[id]], {
  stdio: ["ignore", "ignore", "ignore", "pipe"],
  env: {},
  timeout: 5_000,
});
// A program the runner had to stop, or that a signal killed, has no exit status.
const signal = ran.signal ?? ran.error?.code ?? null;
let fact = { returned: null, value: null, error: null, message: null };
try {
  fact = { ...fact, ...JSON.parse(ran.output[3].toString("utf8")) };
} catch {
  // The probe did not report: the library failed to load or the child stopped.
}
process.stdout.write(`${JSON.stringify({ exit: ran.status, signal, ...fact })}\n`);
