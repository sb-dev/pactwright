// Judge of checkpoint.exit-check (CP96/AC03): the changelog names every
// step, and the checkpoint evidence the controller gives the exit judge on
// stdin holds an acceptance with proven targets for each of them. Neither
// fact is taken from the candidate alone.
import { readFileSync } from "node:fs";

const STEPS = ["CP96-S01", "CP96-S02"];
const { binding, runs, checkpoint } = JSON.parse(readFileSync(0, "utf8"));
const accepted = Array.isArray(checkpoint?.steps)
  ? checkpoint.steps
      .filter((s) => typeof s.decision === "string" && s.targets.length > 0 && s.candidate?.commit)
      .map((s) => s.step)
  : [];
const results = runs.map((run) => {
  let o = null;
  try {
    o = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const steps = Array.isArray(o?.steps) ? o.steps : [];
  const unnamed = STEPS.filter((s) => !steps.includes(s));
  const unaccepted = STEPS.filter((s) => !accepted.includes(s));
  const passed = run.exit === 0 && unnamed.length === 0 && unaccepted.length === 0;
  const problems = [
    ...(unnamed.length > 0 ? [`the changelog does not name ${unnamed.join(", ")}`] : []),
    ...(unaccepted.length > 0 ? [`no recorded acceptance of ${unaccepted.join(", ")}`] : []),
  ];
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: STEPS.length * 2,
    observations: { steps, accepted },
    ...(passed ? {} : { message: problems.join("; ") }),
  };
});
process.stdout.write(JSON.stringify({ results }));
