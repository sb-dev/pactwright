// INJECTED FAULT (T3-F fixture): duplicate validation. The command restates
// every rule of the configuration library instead of calling parseConfig.
// Every automated target passes; the review must reject it (CP97-S02 R03).
// Seeded by the test; not produced by a model.
import { readFileSync } from "node:fs";

const fail = (message) => {
  process.stderr.write(`config: ${message}\n`);
  process.exit(1);
};

const [path] = process.argv.slice(2);
let text;
try {
  text = readFileSync(path, "utf8");
} catch (e) {
  fail(e.message);
}
let value;
try {
  value = JSON.parse(text);
} catch (e) {
  fail(`malformed JSON: ${e.message}`);
}
if (value === null || typeof value !== "object" || Array.isArray(value)) fail("not a JSON object");
for (const key of Object.keys(value)) {
  if (key !== "port" && key !== "label") fail(`unknown field: ${key}`);
}
if (!Number.isInteger(value.port) || value.port < 1 || value.port > 65535) {
  fail("port: expected an integer from 1 through 65535");
}
if (typeof value.label !== "string" || value.label.trim() === "") {
  fail("label: expected a string that is not empty once trimmed");
}
process.stdout.write(`${JSON.stringify({ port: value.port, label: value.label.trim() })}\n`);
