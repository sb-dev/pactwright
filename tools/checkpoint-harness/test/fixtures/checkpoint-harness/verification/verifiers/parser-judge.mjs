// Fixture judge for parser.accepts and parser.rejects (CP99-S01/AC01). It runs
// without the code under test: it reads the subject's observations as JSON on
// stdin and writes the report to stdout.
import { readFileSync } from "node:fs";

const { binding, stdout } = JSON.parse(readFileSync(0, "utf8"));
const seen = new Map();
for (const line of stdout.split("\n")) {
  try {
    const o = JSON.parse(line);
    if (typeof o?.case === "string") seen.set(o.case, o);
  } catch {
    // Not an observation line.
  }
}
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
const results = ["valid", "invalid"].map((id) => {
  const o = seen.get(id);
  const passed = o !== undefined && checks[binding][id](o);
  return {
    binding,
    owner: "CP99-S01",
    criterion: "AC01",
    case: id,
    outcome: passed ? "passed" : "failed",
    assertions: 1,
    observations: { input: o?.input ?? null, observed: o ?? null },
    ...(passed ? {} : { message: o === undefined ? "no observation" : `observed ${JSON.stringify(o)}` }),
  };
});
process.stdout.write(JSON.stringify({ results }));
