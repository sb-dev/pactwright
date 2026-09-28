// Fixture verifier for command.prints (CP99-S02/AC01).
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let stdout = "";
let message;
try {
  stdout = execFileSync(process.execPath, ["src/command.mjs", "verifiers/fixtures/valid.json"], {
    encoding: "utf8",
  });
  if (JSON.parse(stdout).name !== "demo") message = `printed ${stdout}`;
} catch (e) {
  message = e.message;
}
const result = {
  binding: process.env.PACTWRIGHT_BINDING,
  owner: "CP99-S02",
  criterion: "AC01",
  case: null,
  outcome: message === undefined ? "passed" : "failed",
  assertions: 1,
  observations: { stdout },
  ...(message === undefined ? {} : { message }),
};
writeFileSync(process.env.PACTWRIGHT_REPORT, JSON.stringify({ results: [result] }));
process.exit(message === undefined ? 0 : 1);
