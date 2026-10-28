// Fixture judge for library.accepts and library.rejects (CP97-S01). It never
// runs candidate code: it reduces each subject run to its primitive facts and
// decides one result per target.
import { readFileSync } from "node:fs";

const { binding, runs } = JSON.parse(readFileSync(0, "utf8"));

const NORMALISED = {
  "lowest-port": { port: 1, label: "api" },
  "highest-port": { port: 65535, label: "api" },
  "trimmed-label": { port: 8080, label: "api" },
};
const returned = (expected) => (o) => {
  if (o.returned !== true || typeof o.value !== "string") return false;
  let value;
  try {
    value = JSON.parse(o.value);
  } catch {
    return false;
  }
  return (
    value !== null &&
    typeof value === "object" &&
    Object.keys(value).sort().join() === "label,port" &&
    value.port === expected.port &&
    value.label === expected.label
  );
};
const rejected = (o) =>
  o.returned === false &&
  o.error === "ConfigError" &&
  typeof o.message === "string" &&
  o.message.trim() !== "";
const checks = {
  "library.accepts": (c) => (NORMALISED[c] ? returned(NORMALISED[c]) : undefined),
  "library.rejects": (c) => (NORMALISED[c] ? undefined : rejected),
};

const KEYS = "error,exit,message,returned,signal,value";
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
  const passed =
    o !== undefined && check !== undefined && o.exit === 0 && o.signal === null && check(o);
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
