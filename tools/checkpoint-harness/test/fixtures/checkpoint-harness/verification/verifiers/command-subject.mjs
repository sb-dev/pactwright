// Fixture subject for command.prints (CP99-S02/AC01). Run with --permission
// --allow-fs-read=. --allow-child-process. It reads the seal from stdin to
// its end, runs the candidate command as a child process under the
// permission model, with no stdin and an empty environment, and writes the
// child's exit status and output as the observation, marked with the seal.
// The child never receives the seal.
import { spawnSync } from "node:child_process";
import { readSync, writeSync } from "node:fs";

const raw = Buffer.allocUnsafeSlow(512);
let size = 0;
for (let n; (n = readSync(0, raw, size, raw.length - size, null)) > 0;) size += n;
const seal = Buffer.allocUnsafeSlow(64);
raw.copy(seal, 0, 0, 64);
raw.fill(0);

const child = spawnSync(
  process.execPath,
  ["--permission", "--allow-fs-read=.", "src/command.mjs", "verifiers/fixtures/valid.json"],
  { stdio: ["ignore", "pipe", "pipe"], env: {}, timeout: 20_000 },
);
const observed = { exit: child.status, stdout: child.stdout?.toString("utf8") ?? "" };
writeSync(1, "\n");
writeSync(1, seal);
writeSync(1, ` ${JSON.stringify(observed)}\n`);
