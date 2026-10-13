// Subject of task.cases (comparison tasks, T3.6 L4 §4): runs the task's
// module as a program with each case's arguments, in the case order of
// verifiers/cases.json, and prints what each run observed.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const table = JSON.parse(readFileSync(process.argv[2], "utf8"));
const observed = table.cases.map((c) => {
  const ran = spawnSync(process.execPath, [table.module, ...c.args], {
    encoding: "utf8",
    timeout: 10000,
  });
  return { exit: ran.status, stdout: ran.stdout };
});
console.log(JSON.stringify(observed));
