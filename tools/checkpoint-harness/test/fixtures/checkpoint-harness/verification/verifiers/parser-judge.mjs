// Fixture judge for parser.accepts and parser.rejects (CP99-S01/AC01). It runs
// without the code under test. It reads each target's sealed observations as
// JSON on stdin and writes the report to stdout. A run must exit 0 with
// exactly one sealed observation.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const checks = {
  "parser.accepts": {
    valid: (o) => "returned" in o && o.returned?.name === "demo",
    invalid: (o) => "threw" in o,
  },
  "parser.rejects": {
    valid: (o) => "returned" in o,
    invalid: (o) => "threw" in o && /name/.test(o.threw),
  },
};
const observe = (run) => {
  if (run.exit !== 0 || run.observations.length !== 1) return undefined;
  try {
    const o = JSON.parse(run.observations[0]);
    return o !== null && typeof o === "object" && !Array.isArray(o) ? o : undefined;
  } catch {
    return undefined;
  }
};
const results = runs.map((run) => {
  const o = observe(run);
  const check = checks[binding]?.[run.case];
  const passed = o !== undefined && check !== undefined && check(o);
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
              ? `exit ${run.exit}, ${run.observations.length} sealed observations`
              : `observed ${JSON.stringify(o)}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
