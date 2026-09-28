// Fixture judge for repo.verify (CP99/AC01).
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let observed = null;
  try {
    observed = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const files = Array.isArray(observed?.files) ? observed.files : [];
  const broken = Array.isArray(observed?.broken) ? observed.broken : null;
  const passed = run.exit === 0 && files.length > 0 && broken !== null && broken.length === 0;
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: Math.max(files.length, 1),
    observations: { files },
    ...(passed ? {} : { message: `exit ${run.exit}, broken ${JSON.stringify(broken)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
