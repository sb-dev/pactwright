// Fixture judge for cli.prints and cli.refuses (CP97-S02). It never runs
// candidate code: it reduces each subject run to its primitive facts and
// decides one result per target.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));

const PRINTED = {
  valid: '{"port":8080,"label":"api"}\n',
  "trimmed-label": '{"port":8080,"label":"api"}\n',
};
const REFUSED = ["malformed-json", "port-above-highest", "unknown-field", "missing-file", "directory"];
const prints = (expected) => (o) => o.exit === 0 && o.stdout === expected;
const refuses = (o) =>
  typeof o.exit === "number" &&
  o.exit !== 0 &&
  o.stdout === "" &&
  typeof o.stderr === "string" &&
  o.unchanged === true;
const checks = {
  "cli.prints": (c) => (PRINTED[c] ? prints(PRINTED[c]) : undefined),
  "cli.refuses": (c) => (REFUSED.includes(c) ? refuses : undefined),
};

const KEYS = "exit,signal,stderr,stdout,unchanged";
const primitive = (v) =>
  v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
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
  if (keys.join() !== KEYS || !keys.every((k) => primitive(o[k]))) return undefined;
  return o;
};

const results = runs.map((run) => {
  const o = facts(run);
  const check = checks[binding]?.(run.case);
  const passed = o !== undefined && check !== undefined && o.signal === null && check(o);
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
              : `case ${run.case}: observed ${JSON.stringify(o)}`,
        }),
  };
});
process.stdout.write(JSON.stringify({ results }));
