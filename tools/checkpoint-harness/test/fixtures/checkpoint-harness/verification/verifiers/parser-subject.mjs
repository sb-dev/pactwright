// Fixture subject for parser.accepts and parser.rejects (CP99-S01/AC01). The
// parser is observed as a program: `node src/parser.mjs` reads a configuration
// on stdin, prints the parsed JSON and exits 0, or exits 1 with the error on
// stderr. This driver reads its target key from stdin, runs the candidate
// program as a separate process with that case's input, and prints one line
// of primitive facts about it: exit status, the signal or spawn error that
// ended it instead, the printed `name` if it is a string, and the first line
// of stderr. No code under test runs in this process.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const target = readFileSync(0, "utf8");
const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
const id = Object.keys(inputs).find((c) => target.startsWith(`CP99-S01/AC01/${c}/`));
if (id === undefined) process.exit(2);

const ran = spawnSync(process.execPath, ["src/parser.mjs"], {
  input: inputs[id],
  stdio: ["pipe", "pipe", "pipe"],
  env: {},
  timeout: 5_000,
});
// A program the runner had to stop, or that a signal killed, has no exit status.
const signal = ran.signal ?? ran.error?.code ?? null;
let name = null;
try {
  const printed = JSON.parse(ran.stdout.toString("utf8")).name;
  if (typeof printed === "string") name = printed;
} catch {
  // The program did not print a JSON object.
}
const error =
  ran.stderr
    .toString("utf8")
    .split("\n")
    .find((l) => l.trim() !== "") ?? null;
process.stdout.write(`${JSON.stringify({ exit: ran.status, signal, name, error })}\n`);
