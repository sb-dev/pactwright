// Judge of checkpoint.exit-check (CP96/AC03): the changelog names every step.
import { readFileSync } from "node:fs";

const STEPS = ["CP96-S01", "CP96-S02"];
const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let o = null;
  try {
    o = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const steps = Array.isArray(o?.steps) ? o.steps : [];
  const missing = STEPS.filter((s) => !steps.includes(s));
  const passed = run.exit === 0 && missing.length === 0;
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: STEPS.length,
    observations: { steps },
    ...(passed ? {} : { message: `the changelog does not name ${missing.join(", ")}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
