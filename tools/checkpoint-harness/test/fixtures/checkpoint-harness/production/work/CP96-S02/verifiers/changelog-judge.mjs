// Judge of changelog.current (CP96/AC02): at least one entry, each naming a step.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let o = null;
  try {
    o = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const steps = Array.isArray(o?.steps) ? o.steps : [];
  const passed = run.exit === 0 && steps.length > 0 && steps.every((s) => s !== null);
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: Math.max(steps.length, 1),
    observations: { steps },
    ...(passed ? {} : { message: `changelog entries ${JSON.stringify(steps)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
