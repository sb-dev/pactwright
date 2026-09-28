// Fixture judge for parser.accepts and parser.rejects (CP99-S01/AC01). It runs
// outside every candidate process. For each target's run it reduces the
// subject's output to primitive facts: the run must exit 0 and print exactly
// one JSON object whose only value is a `name` or `threw` string (or null).
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const checks = {
  "parser.accepts": {
    valid: (o) => o.name === "demo",
    invalid: (o) => "threw" in o,
  },
  "parser.rejects": {
    valid: (o) => "name" in o,
    invalid: (o) => typeof o.threw === "string" && /name/.test(o.threw),
  },
};
const facts = (run) => {
  const lines = run.stdout.split("\n").filter((l) => l !== "");
  if (run.exit !== 0 || lines.length !== 1) return undefined;
  let o;
  try {
    o = JSON.parse(lines[0]);
  } catch {
    return undefined;
  }
  if (o === null || typeof o !== "object" || Array.isArray(o)) return undefined;
  const keys = Object.keys(o);
  const primitive = (v) => v === null || typeof v === "string";
  if (keys.length !== 1 || !["name", "threw"].includes(keys[0]) || !primitive(o[keys[0]])) {
    return undefined;
  }
  return o;
};
const results = runs.map((run) => {
  const o = facts(run);
  const check = checks[binding]?.[run.case];
  const passed = o !== undefined && check !== undefined && check(o);
  return {
    binding,
    owner: run.owner,
    criterion: run.criterion,
    case: run.case,
    outcome: passed ? "passed" : "failed",
    assertions: 1,
    observations: { observed: o ?? null },
    ...(passed
      ? {}
      : {
          message:
            o === undefined
              ? `exit ${run.exit}, printed ${JSON.stringify(run.stdout.slice(0, 200))}`
              : `observed ${JSON.stringify(o)}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
