// Judge of learning.names: the program prints `Pactwright` and exits 0.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let observed = null;
  try {
    observed = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const passed =
    run.exit === 0 && observed !== null && observed.exit === 0 && observed.stdout === "Pactwright\n";
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 1,
    observations: { exit: observed?.exit ?? null, stdout: observed?.stdout ?? null },
    ...(passed ? {} : { message: `observed ${JSON.stringify(observed)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
