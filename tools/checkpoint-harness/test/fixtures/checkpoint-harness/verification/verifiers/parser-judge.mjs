// Fixture judge for parser.accepts and parser.rejects (CP99-S01/AC01). It runs
// without the code under test. It reads the subject runs as JSON on stdin,
// each labelled by the controller with its target, and writes the report to
// stdout. A run must exit 0 and print exactly one JSON observation.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const checks = {
  "parser.accepts": {
    valid: (o) => "returned" in o && o.returned?.name === "demo",
    invalid: (o) => "threw" in o,
  },
  "parser.rejects": {
    valid: (o) => !("threw" in o),
    invalid: (o) => "threw" in o && /name/.test(o.threw),
  },
};
const observe = (run) => {
  if (run.exit !== 0) return undefined;
  try {
    const o = JSON.parse(run.stdout);
    return o !== null && typeof o === "object" && !Array.isArray(o) ? o : undefined;
  } catch {
    return undefined;
  }
};
const results = runs.map((run) => {
  const o = observe(run);
  const check = checks[binding]?.[run.case];
  const passed = o !== undefined && check !== undefined && check(o);
  const printed = JSON.stringify(run.stdout.slice(0, 200));
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 1,
    observations: { input: o?.input ?? null, observed: o ?? null },
    ...(passed
      ? {}
      : {
          message:
            o === undefined
              ? `exit ${run.exit}, printed ${printed}`
              : `observed ${JSON.stringify(o)}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
