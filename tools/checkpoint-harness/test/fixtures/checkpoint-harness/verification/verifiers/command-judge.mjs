// Fixture judge for command.prints (CP99-S02/AC01). The subject is the
// candidate command itself; this judge checks what it printed.
import { readFileSync } from "node:fs";

const { binding, exit, stdout } = JSON.parse(readFileSync(0, "utf8"));
let name;
try {
  name = JSON.parse(stdout).name;
} catch {
  // Not JSON.
}
const passed = exit === 0 && name === "demo";
const result = {
  binding,
  owner: "CP99-S02",
  criterion: "AC01",
  case: null,
  outcome: passed ? "passed" : "failed",
  assertions: 2,
  observations: { stdout },
  ...(passed ? {} : { message: `exit ${exit}, printed ${stdout}` }),
};
process.stdout.write(JSON.stringify({ results: [result] }));
