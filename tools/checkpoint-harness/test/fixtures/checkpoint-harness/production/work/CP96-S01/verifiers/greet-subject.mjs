// Subject of greet.behaves (CP96-S01/AC01): runs the greeting program with
// the name the target's case names and prints what it observed.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [, , caseId] = readFileSync(0, "utf8").split("/");
const name = caseId === "named" ? "Ada" : "   ";
const ran = spawnSync(process.execPath, ["src/greet.mjs", name], { encoding: "utf8" });
console.log(JSON.stringify({ exit: ran.status, stdout: ran.stdout }));
