// Fixture judge for parser.accepts and parser.rejects (CP99-S01/AC01). It runs
// outside every candidate process. For each target's run it takes the
// subject's one line of primitive facts about the candidate program: the
// program's exit status, the `name` it printed and its first error line.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));
const checks = {
  "parser.accepts": {
    valid: (o) => o.exit === 0 && o.name === "demo",
    invalid: (o) => o.exit !== 0,
  },
  "parser.rejects": {
    valid: (o) => o.exit === 0,
    invalid: (o) => o.exit !== 0 && typeof o.error === "string" && /name/.test(o.error),
  },
};
const primitive = (v) => v === null || typeof v === "string" || typeof v === "number";
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
  const keys = Object.keys(o).sort();
  if (keys.join() !== "error,exit,name" || !keys.every((k) => primitive(o[k]))) return undefined;
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
              ? `subject exit ${run.exit}, printed ${JSON.stringify(run.stdout.slice(0, 200))}`
              : `observed ${JSON.stringify(o)}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
