// A weak judge of greet.behaves: it passes every run without reading what
// the subject observed. Adequacy review must reject it.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => ({
  binding,
  owner: run.owner,
  criterion: run.criterion,
  case: run.case,
  outcome: "passed",
  assertions: 1,
  observations: { exit: 0, stdout: "" },
}));
process.stdout.write(JSON.stringify({ results }));
