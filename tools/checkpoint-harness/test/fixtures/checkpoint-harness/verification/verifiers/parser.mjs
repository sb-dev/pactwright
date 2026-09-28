// Fixture verifier for parser.accepts and parser.rejects (CP99-S01/AC01).
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const binding = process.env.PACTWRIGHT_BINDING;
const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
const checks = {
  "parser.accepts": {
    valid: (parse, input) => assert.deepEqual(parse(input), { name: "demo" }),
    invalid: (parse, input) => assert.throws(() => parse(input)),
  },
  "parser.rejects": {
    valid: (parse, input) => assert.doesNotThrow(() => parse(input)),
    invalid: (parse, input) => assert.throws(() => parse(input), /name/),
  },
};
if (!(binding in checks)) {
  console.error(`unknown binding ${binding}`);
  process.exit(2);
}
const { parseConfig } = await import("../src/parser.mjs");
const results = Object.entries(inputs).map(([id, input]) => {
  const result = { binding, owner: "CP99-S01", criterion: "AC01", case: id, assertions: 1 };
  try {
    checks[binding][id](parseConfig, input);
    return { ...result, outcome: "passed", observations: { input } };
  } catch (e) {
    return { ...result, outcome: "failed", observations: { input }, message: e.message };
  }
});
writeFileSync(process.env.PACTWRIGHT_REPORT, JSON.stringify({ results }));
process.exit(results.every((r) => r.outcome === "passed") ? 0 : 1);
