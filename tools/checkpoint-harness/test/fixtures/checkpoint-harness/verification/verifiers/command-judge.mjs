// Fixture judge for command.prints (CP99-S02/AC01). It checks what the
// candidate command printed, as its subject observed and sealed it.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let observed = null;
  let name;
  try {
    if (run.observations.length === 1) observed = JSON.parse(run.observations[0]);
    name = JSON.parse(observed.stdout).name;
  } catch {
    // No observation, or the command did not print JSON.
  }
  const passed = run.exit === 0 && observed?.exit === 0 && name === "demo";
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 2,
    observations: { stdout: observed?.stdout ?? null },
    ...(passed ? {} : { message: `observed ${JSON.stringify(observed)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
