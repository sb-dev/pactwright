import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Drift-pinning: the lane catalog lives canonically in CLAUDE.md's "Lane model and
// integration" table; the `brief-lane-valid` validation rule's `keys` must mirror it
// exactly and in order. Assert the doc's catalog == the rule's keys so editing one
// without the other fails the suite rather than letting an invalid (or newly added)
// lane slip past validation. Before this pin, the two could silently diverge.
test("drift: brief-lane-valid keys == CLAUDE.md lane catalog", () => {
  // Rule keys from the validation-rules schema.
  const rulesDoc = load(fs.readFileSync(path.join(repoRoot, "specs", "schema", "validation-rules.yaml"), "utf8")) as {
    rules: { id: string; keys?: string[] }[];
  };
  const rule = rulesDoc.rules.find((r) => r.id === "brief-lane-valid");
  assert.ok(rule?.keys, "brief-lane-valid rule must declare keys");
  const ruleKeys = rule!.keys!;

  // Lane names from the CLAUDE.md catalog table. Scope to the "Lane model and
  // integration" section so backticked tokens elsewhere are not picked up, then take
  // the backticked token in the FIRST column of each lane row (`| `lane` | ... |`).
  const claudeMd = fs.readFileSync(path.join(repoRoot, "CLAUDE.md"), "utf8");
  const sectionStart = claudeMd.indexOf("## Lane model and integration");
  assert.ok(sectionStart >= 0, "CLAUDE.md must carry the 'Lane model and integration' section");
  // Bound the slice at the next top-level heading so only the catalog table is scanned.
  const afterStart = claudeMd.slice(sectionStart + "## Lane model and integration".length);
  const nextHeading = afterStart.indexOf("\n## ");
  const section = nextHeading >= 0 ? afterStart.slice(0, nextHeading) : afterStart;

  const catalogLanesFromDoc: string[] = [];
  for (const line of section.split("\n")) {
    // A lane row: first table cell holds a single backticked token (the header
    // `| Lane | Owns |` and separator `|------|------|` rows carry no backticks).
    const m = line.match(/^\|\s*`([^`]+)`\s*\|/);
    if (m) catalogLanesFromDoc.push(m[1]);
  }

  // Sanity: the catalog is the documented 8 lanes, in order.
  assert.deepEqual(catalogLanesFromDoc, [
    "product-spec",
    "domain-backend",
    "frontend-ui",
    "data-migration",
    "api-integration",
    "test-verification",
    "observability-release",
    "docs-spec",
  ]);

  assert.deepEqual(catalogLanesFromDoc, ruleKeys);
});
