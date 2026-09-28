// Fixture judge for command.prints (CP99-S02/AC01). The subject is the
// candidate command itself; this judge checks what it printed.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let name;
  try {
    name = JSON.parse(run.stdout).name;
  } catch {
    // Not JSON.
  }
  const passed = run.exit === 0 && name === "demo";
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 2,
    observations: { stdout: run.stdout },
    ...(passed ? {} : { message: `exit ${run.exit}, printed ${run.stdout}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
