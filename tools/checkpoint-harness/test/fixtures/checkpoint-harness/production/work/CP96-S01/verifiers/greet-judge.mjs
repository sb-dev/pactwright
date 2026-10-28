// Judge of greet.behaves: a named run prints the greeting and exits 0; a
// blank run exits 1 and prints nothing.
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
    run.exit === 0 &&
    observed !== null &&
    (run.case === "named"
      ? observed.exit === 0 && observed.stdout === "Hello, Ada!\n"
      : observed.exit === 1 && observed.stdout === "");
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
