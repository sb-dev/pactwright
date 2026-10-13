// Subject of learning.names (CP94-S01/AC01): runs the name program and prints
// what it observed.
import { spawnSync } from "node:child_process";

const ran = spawnSync(process.execPath, ["tools/checkpoint-harness/test/fixtures/checkpoint-harness/learning/work/name.mjs"], { encoding: "utf8" });
console.log(JSON.stringify({ exit: ran.status, stdout: ran.stdout }));
