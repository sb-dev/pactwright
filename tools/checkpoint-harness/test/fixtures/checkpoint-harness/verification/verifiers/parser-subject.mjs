// Fixture subject for parser.accepts and parser.rejects (CP99-S01/AC01). It
// reads its target key from stdin before it loads the code under test, so
// that code never learns the target. It calls parseConfig with the target's
// input and prints one line of primitive facts: the returned `name`, or the
// thrown message. It never serialises a value the code under test returned.
import { readFileSync } from "node:fs";

const target = readFileSync(0, "utf8");
const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
const id = Object.keys(inputs).find((c) => target.startsWith(`CP99-S01/AC01/${c}/`));
if (id === undefined) process.exit(2);
const input = inputs[id];

const { parseConfig } = await import("../src/parser.mjs");
let line;
try {
  const returned = parseConfig(input);
  const name = typeof returned?.name === "string" ? returned.name : null;
  line = `{"name":${JSON.stringify(name)}}`;
} catch (e) {
  const thrown = typeof e?.message === "string" ? e.message : null;
  line = `{"threw":${JSON.stringify(thrown)}}`;
}
process.stdout.write(`${line}\n`);
