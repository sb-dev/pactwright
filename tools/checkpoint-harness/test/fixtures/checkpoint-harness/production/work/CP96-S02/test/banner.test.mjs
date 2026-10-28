// The built banner shouts the greeting.
import assert from "node:assert/strict";
import { test } from "node:test";

import { banner } from "../dist/banner.mjs";

test("shouts the greeting", () => {
  assert.equal(banner("Ada"), "Hello, Ada!!");
});
