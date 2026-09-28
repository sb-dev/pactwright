// Fixture subject for parser.accepts and parser.rejects (CP99-S01/AC01).
// It runs the code under test and prints one observation per case as a JSON
// line. It has no report path: the judge decides each result.
import { parseConfig } from "../src/parser.mjs";

const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
for (const [id, input] of Object.entries(inputs)) {
  try {
    console.log(JSON.stringify({ case: id, input, returned: parseConfig(input) }));
  } catch (e) {
    console.log(JSON.stringify({ case: id, input, threw: String(e?.message ?? e) }));
  }
}
