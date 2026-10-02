// The built greeting greets a name and rejects a blank one.
import assert from "node:assert/strict";
import { test } from "node:test";

import { greet } from "../dist/greet.mjs";

test("greets a trimmed name", () => {
  assert.equal(greet(" Ada "), "Hello, Ada!");
});

test("rejects a blank name", () => {
  assert.throws(() => greet("  "), /blank/);
});
