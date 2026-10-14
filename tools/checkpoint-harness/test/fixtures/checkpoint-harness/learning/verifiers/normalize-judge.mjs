// Judge of learning.normalizes: every text of the whitespace case prints
// `Ada` and a newline, and the program exits 0.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let observed = null;
  try {
    observed = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const wrong = Array.isArray(observed)
    ? observed.filter((o) => o.exit !== 0 || o.stdout !== "Ada\n")
    : null;
  const passed = run.exit === 0 && wrong !== null && observed.length === 4 && wrong.length === 0;
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: Array.isArray(observed) ? observed.length : 1,
    observations: { exit: run.exit, stdout: JSON.stringify(observed) },
    ...(passed
      ? {}
      : {
          message:
            wrong === null
              ? `observed ${JSON.stringify(run.stdout)}`
              : `not normalised to Ada: ${wrong.map((o) => `${o.text} printed ${JSON.stringify(o.stdout)}`).join("; ")}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
