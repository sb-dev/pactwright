// Judge of task.cases: every case's run exited 0 and printed exactly the
// case's expected output. It never runs candidate code.
import { readFileSync } from "node:fs";

const table = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let observed = null;
  try {
    observed = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const wrong = Array.isArray(observed)
    ? table.cases.flatMap((c, i) =>
        observed[i]?.exit === 0 && observed[i]?.stdout === c.stdout
          ? []
          : [`${JSON.stringify(c.args)} printed ${JSON.stringify(observed[i]?.stdout ?? null)}`],
      )
    : null;
  const passed = run.exit === 0 && wrong !== null && wrong.length === 0;
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: table.cases.length,
    observations: { exit: run.exit, stdout: JSON.stringify(observed) },
    ...(passed
      ? {}
      : {
          message:
            wrong === null
              ? `observed ${JSON.stringify(run.stdout)}`
              : `wrong: ${wrong.join("; ")}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
