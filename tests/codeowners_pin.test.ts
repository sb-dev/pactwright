import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { matchGlob } from "../tools/glob.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Amendment 3 — pin the `.github/CODEOWNERS` glob that covers `decision-*` nodes.
 *
 * WHY IT IS LOAD-BEARING HERE. The `unbacked-addressed` rule's standing escape is a
 * `decision —subsumes→ intent` edge, and the reason that escape is more expensive than
 * appending a `proposes` line to `specs/graph/edges.yaml` is precisely that it needs a
 * NEW `specs/nodes/decision-*.md` file — a path a code-owner rule reaches. Delete the
 * CODEOWNERS line and the escape hatch becomes the cheap path, silently.
 *
 * THE HONEST BOUND, stated because the test cannot close it. This proves the PATTERN
 * MATCHES a decision-node path and that the entry names at least one owner. It does NOT
 * prove code-owner review is ENABLED or REQUIRED: "Require review from Code Owners" is
 * GitHub branch-protection state, which `docs/branch-protection.md:5-7` records as
 * repo-admin state explicitly NOT reproducible from files in this repo. A green here is
 * a statement about the file, never about the merge gate.
 *
 * Second bound: `matchGlob` is this repo's own prefix-glob matcher, not GitHub's
 * CODEOWNERS matcher. For the anchored, single-`*`-in-a-segment patterns used here the
 * two agree; a pattern relying on CODEOWNERS-specific semantics would need a real
 * implementation of that syntax.
 */
interface Entry {
  pattern: string;
  owners: string[];
}

function codeownersEntries(): Entry[] {
  const text = fs.readFileSync(path.join(repoRoot, ".github", "CODEOWNERS"), "utf8");
  const entries: Entry[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    // A leading `/` anchors a CODEOWNERS pattern at the repo root; strip it so the
    // remainder is a repo-relative path glob. A trailing `/` means "this directory".
    const normalized = pattern.replace(/^\//, "").replace(/\/$/, "/**");
    entries.push({ pattern: normalized, owners });
  }
  return entries;
}

test("CODEOWNERS carries a pattern covering decision-* nodes, with an owner", () => {
  const entries = codeownersEntries();
  // A synthetic path, not a node that happens to exist today: the pin must hold for the
  // NEXT decision authored, which is the one that would grant a `subsumes` escape.
  const futureDecision = "specs/nodes/decision-some-future-grant-0000.md";
  const covering = entries.filter((e) => matchGlob(futureDecision, e.pattern));
  assert.ok(
    covering.length > 0,
    `no .github/CODEOWNERS pattern matches ${futureDecision}; patterns were:\n` +
      entries.map((e) => `  ${e.pattern}`).join("\n"),
  );
  for (const entry of covering) {
    assert.ok(
      entry.owners.length > 0,
      `CODEOWNERS pattern ${entry.pattern} names no owner, so it requires review from nobody`,
    );
  }
});

test("the decision-* pattern is decision-scoped — it is not a blanket /specs/nodes/ rule", () => {
  // Anti-vacuity. If the covering pattern were `/specs/nodes/` the assertion above would
  // pass while saying nothing about decisions specifically. At least one covering pattern
  // must therefore distinguish a decision node from a sibling intent node.
  const entries = codeownersEntries();
  const decisionPath = "specs/nodes/decision-some-future-grant-0000.md";
  const intentPath = "specs/nodes/intent-some-future-thing-0000.md";
  const scoped = entries.filter((e) => matchGlob(decisionPath, e.pattern) && !matchGlob(intentPath, e.pattern));
  assert.ok(
    scoped.length > 0,
    "expected a CODEOWNERS pattern matching decision-* but NOT a sibling intent node; got:\n" +
      entries.map((e) => `  ${e.pattern} -> ${e.owners.join(" ")}`).join("\n"),
  );
  assert.ok(
    scoped.some((e) => e.pattern.includes("decision-")),
    "the decision-scoped pattern must name `decision-` literally",
  );
});

test("CODEOWNERS also covers contract-* nodes (the residual grant path's reviewed half)", () => {
  // The honest bound recorded in `validation-rules.yaml` for `unbacked-addressed` says the
  // remaining grant path is a NEW contract-*.md plus a `selects` edge, and that the
  // contract file half IS code-owner covered while the edge half is not. Pin the half the
  // bound claims exists, so the bound cannot quietly become false.
  const entries = codeownersEntries();
  const contractPath = "specs/nodes/contract-some-future-grant-0000.md";
  const covering = entries.filter((e) => matchGlob(contractPath, e.pattern));
  assert.ok(covering.length > 0, "no CODEOWNERS pattern matches a contract-* node");
  assert.ok(covering.every((e) => e.owners.length > 0));
});

test("CODEOWNERS does NOT reach specs/graph/edges.yaml — the stated, unreviewed half", () => {
  // NOT an aspiration: this asserts the bound the rule's comment and the decision's
  // amendment 6 both state as CURRENTLY TRUE. If someone adds `/specs/graph/` to
  // CODEOWNERS (routed out as a follow-up intent, not silently), this test reds and the
  // prose claiming the edge half is unreviewed must be updated in the same change.
  const entries = codeownersEntries();
  const edgesPath = "specs/graph/edges.yaml";
  const covering = entries.filter((e) => matchGlob(edgesPath, e.pattern));
  assert.deepEqual(
    covering.map((e) => e.pattern),
    [],
    "specs/graph/edges.yaml is now code-owner covered — update the honest bounds in " +
      "specs/schema/validation-rules.yaml and tools/handlers/coverage_traversal.ts that say it is not",
  );
});
