import { test } from "node:test";
import assert from "node:assert/strict";
import { matchGlob, matchAny } from "../tools/glob.ts";

test("`**` matches any depth under a prefix", () => {
  assert.equal(matchGlob("tools/spec.ts", "tools/**"), true);
  assert.equal(matchGlob("tools/handlers/glob.ts", "tools/**"), true);
  assert.equal(matchGlob("specs/schema/node-types.yaml", "specs/schema/**"), true);
  assert.equal(matchGlob(".github/workflows/ci.yml", ".github/workflows/**"), true);
});

test("`**` does not match a sibling prefix or a different subtree", () => {
  assert.equal(matchGlob("toolsx/y.ts", "tools/**"), false);
  assert.equal(matchGlob("specs/nodes/x.md", "specs/schema/**"), false);
  assert.equal(matchGlob("tools", "tools/**"), false); // the bare dir, no child
});

test("a leading dot in the pattern is a literal, not a wildcard", () => {
  assert.equal(matchGlob("xgithub/workflows/ci.yml", ".github/workflows/**"), false);
});

test("`*` stays within a single segment", () => {
  assert.equal(matchGlob("bar.ts", "*.ts"), true);
  assert.equal(matchGlob("foo/bar.ts", "*.ts"), false);
  assert.equal(matchGlob("a/b/c.ts", "a/*/c.ts"), true);
  assert.equal(matchGlob("a/b/d/c.ts", "a/*/c.ts"), false);
});

test("matchAny is the disjunction over patterns", () => {
  const pats = [".github/workflows/**", ".github/CODEOWNERS"];
  assert.equal(matchAny(".github/workflows/drift-review.yml", pats), true);
  assert.equal(matchAny(".github/CODEOWNERS", pats), true);
  assert.equal(matchAny("tools/spec.ts", pats), false);
});
