// Judge of banner.prints: the program prints the shouted greeting and exits 0.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let o = null;
  try {
    o = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const passed = run.exit === 0 && o?.exit === 0 && o.stdout === "Hello, Ada!!\n";
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 1,
    observations: { stdout: o?.stdout ?? null },
    ...(passed ? {} : { message: `observed ${JSON.stringify(o)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
