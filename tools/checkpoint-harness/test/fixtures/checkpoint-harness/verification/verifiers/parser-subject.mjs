// Fixture subject for parser.accepts and parser.rejects (CP99-S01/AC01). The
// controller runs it once per target, named in PACTWRIGHT_TARGET, and labels
// the run itself. It feeds that case's input to the code under test and prints
// what happened as one JSON value. It has no report path: the judge decides.
import { parseConfig } from "../src/parser.mjs";

const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
const id = (process.env.PACTWRIGHT_TARGET ?? "").split("/")[2] ?? "";
if (!Object.hasOwn(inputs, id)) {
  console.error(`no case ${id}`);
  process.exit(2);
}
const input = inputs[id];
try {
  console.log(JSON.stringify({ input, returned: parseConfig(input) }));
} catch (e) {
  console.log(JSON.stringify({ input, threw: String(e?.message ?? e) }));
}
