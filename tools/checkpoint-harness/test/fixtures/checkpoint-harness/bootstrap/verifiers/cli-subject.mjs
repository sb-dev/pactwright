// Fixture subject for cli.prints and cli.refuses (CP97-S02). It stages the
// target case's path in a fresh temporary directory, runs the candidate
// command on it as a separate program and prints one line of facts: the exit,
// stdout, the first stderr line and whether the path is unchanged.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FILES = {
  valid: '{"port": 8080, "label": "api"}',
  "trimmed-label": '{"port": 8080, "label": "  api  "}',
  "malformed-json": '{"port": 8080,',
  "port-above-highest": '{"port": 65536, "label": "api"}',
  "unknown-field": '{"port": 8080, "label": "api", "host": "localhost"}',
};
const PATHS = ["missing-file", "directory"];

const [owner, , id] = readFileSync(0, "utf8").split("/");
const known = id !== undefined && (Object.hasOwn(FILES, id) || PATHS.includes(id));
if (owner !== "CP97-S02" || !known) process.exit(2);

const path = join(mkdtempSync(join(tmpdir(), "cp97-")), "config.json");
if (id === "directory") mkdirSync(path);
else if (id !== "missing-file") writeFileSync(path, FILES[id]);
const state = () => {
  if (!existsSync(path)) return "absent";
  const stat = lstatSync(path);
  if (!stat.isFile()) return stat.isDirectory() ? "directory" : "other";
  return createHash("sha256").update(readFileSync(path)).digest("hex");
};
const before = state();

const ran = spawnSync(process.execPath, ["src/cli.mjs", path], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {},
  timeout: 5_000,
});
// A program the runner had to stop, or that a signal killed, has no exit status.
const signal = ran.signal ?? ran.error?.code ?? null;
const stderr = ran.stderr.toString("utf8").split("\n").find((l) => l.trim() !== "") ?? null;
const facts = {
  exit: ran.status,
  signal,
  stdout: ran.stdout.toString("utf8").slice(0, 1_000),
  stderr: stderr === null ? null : stderr.slice(0, 500),
  unchanged: state() === before,
};
process.stdout.write(`${JSON.stringify(facts)}\n`);
