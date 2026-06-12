import * as fs from "node:fs";
import * as path from "node:path";
import { INDEX_FILES, serializeIndexes } from "../indexer.ts";
import type { LoadedSpec, Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * Regenerate the indexes in-memory and byte-compare against the committed
 * files under <root>/indexes/. Covers indexes/ only — reports/ is gitignored
 * and never part of the freshness contract.
 */
export default function indexesFresh(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const expected = serializeIndexes(spec);
  const findings: Finding[] = [];
  for (const name of INDEX_FILES) {
    const file = path.join(spec.root, "indexes", name);
    let actual: string | undefined;
    try {
      actual = fs.readFileSync(file, "utf8");
    } catch {
      actual = undefined;
    }
    if (actual !== expected[name]) {
      findings.push({
        rule: ruleId,
        kind: "indexes_fresh",
        subject: name,
        detail: `indexes drifted: ${name}${actual === undefined ? " (missing — run spec:index)" : ""}`,
      });
    }
  }
  return findings;
}
