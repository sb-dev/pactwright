// Fixture subject for repo.verify (CP99/AC01). Run with --permission
// --allow-fs-read=. --allow-child-process. It loads no code under test: it
// checks that every module parses with `node --check`, then writes the
// observation marked with the seal it read from stdin to its end.
import { execFileSync } from "node:child_process";
import { readdirSync, readSync, writeSync } from "node:fs";

const raw = Buffer.allocUnsafeSlow(512);
let size = 0;
for (let n; (n = readSync(0, raw, size, raw.length - size, null)) > 0;) size += n;
const seal = raw.subarray(0, 64);

const files = ["src", "verifiers"].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `${dir}/${f}`),
);
const broken = files.filter((f) => {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "ignore", env: {} });
    return false;
  } catch {
    return true;
  }
});
writeSync(1, "\n");
writeSync(1, seal);
writeSync(1, ` ${JSON.stringify({ files, broken })}\n`);
