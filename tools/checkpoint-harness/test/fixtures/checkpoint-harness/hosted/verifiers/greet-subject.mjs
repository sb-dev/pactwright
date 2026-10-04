// Subject of hosted.greets (CP95-S01/AC01): runs the greeting program with
// the name the target's case names and prints what it observed.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [, , caseId] = readFileSync(0, "utf8").split("/");
const name = caseId === "named" ? "  Ada " : "   ";
const ran = spawnSync(process.execPath, ["tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/work/greeting.mjs", name], {
  encoding: "utf8",
});
console.log(JSON.stringify({ exit: ran.status, stdout: ran.stdout }));
