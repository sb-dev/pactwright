// Fixture judge for repo.verify (CP99/AC01).
import { readFileSync } from "node:fs";

const { binding, exit, stdout } = JSON.parse(readFileSync(0, "utf8"));
let observed = null;
try {
  observed = JSON.parse(stdout);
} catch {
  // Not the subject's observation.
}
const files = Array.isArray(observed?.files) ? observed.files : [];
const broken = Array.isArray(observed?.broken) ? observed.broken : null;
const passed = exit === 0 && files.length > 0 && broken !== null && broken.length === 0;
const result = {
  binding,
  owner: "CP99",
  criterion: "AC01",
  case: null,
  outcome: passed ? "passed" : "failed",
  assertions: Math.max(files.length, 1),
  observations: { files },
  ...(passed ? {} : { message: `exit ${exit}, broken ${JSON.stringify(broken)}` }),
};
process.stdout.write(JSON.stringify({ results: [result] }));
