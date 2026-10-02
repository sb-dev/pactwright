// Every module of src/ is built into dist/.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";

test("every source module is built", () => {
  const built = readdirSync("dist").filter((f) => f.endsWith(".mjs")).sort();
  const sources = readdirSync("src").filter((f) => f.endsWith(".mjs")).sort();
  assert.deepEqual(built, sources);
});
