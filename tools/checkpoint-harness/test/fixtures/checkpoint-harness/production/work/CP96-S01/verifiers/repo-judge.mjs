// Judge of repo.build-test: the gate passes only when it built into an empty
// dist/ with the locked dependency, and the build and the tests exited 0.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const results = runs.map((run) => {
  let o = null;
  try {
    o = JSON.parse(run.stdout);
  } catch {
    // Not the subject's observation.
  }
  const passed =
    run.exit === 0 &&
    o !== null &&
    Array.isArray(o.distBefore) &&
    o.distBefore.length === 0 &&
    o.dependency === "1.0.0" &&
    o.build === 0 &&
    o.test === 0;
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 4,
    observations: {
      build: o?.build ?? null,
      test: o?.test ?? null,
      dependency: o?.dependency ?? null,
      distBefore: o?.distBefore ?? null,
    },
    ...(passed ? {} : { message: `gate observed ${JSON.stringify(o)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
