import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { runValidation } from "../tools/validator.ts";
import type { LoadedSpec, Rule } from "../tools/loader.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Byte-equality (graft 2): the seven section keys live canonically in the
// integration-reviewer agent; the validation rule and CLAUDE.md reference it.
// Assert the agent's documented list is byte-equal to the rule's configured keys,
// so a drift across the two files fails the suite rather than production.
test("byte-equality: integration-reviewer keys == integration-sections-keys rule keys", () => {
  const agent = fs.readFileSync(path.join(repoRoot, ".claude", "agents", "integration-reviewer.md"), "utf8");
  const m = agent.match(/```yaml\n([\s\S]*?)\n```/);
  assert.ok(m, "integration-reviewer.md must carry a ```yaml integration_sections block");
  const agentKeys = (load(m![1]) as { integration_sections: string[] }).integration_sections;

  const rulesDoc = load(fs.readFileSync(path.join(repoRoot, "specs", "schema", "validation-rules.yaml"), "utf8")) as {
    rules: { id: string; keys?: string[] }[];
  };
  const rule = rulesDoc.rules.find((r) => r.id === "integration-sections-keys");
  assert.ok(rule?.keys, "integration-sections-keys rule must declare keys");
  assert.deepEqual(agentKeys, rule!.keys);
});

// Dispatch-pinning (graft 3): every new rule kind must resolve in HANDLERS —
// runValidation hard-fails an unknown kind. A config/fail-open finding is fine;
// an "unknown kind" finding is the failure we guard against.
test("dispatch-pinning: new kinds dispatch (never 'unknown kind')", () => {
  const base = (rules: Rule[]): LoadedSpec => ({
    root: "",
    nodes: [],
    edges: [],
    nodeTypes: {},
    edgeTypes: {},
    rules,
    checks: [],
    sensitivePaths: [],
  });
  for (const kind of ["closed_key_set", "coverage_coherence"]) {
    const findings = runValidation(base([{ id: `r-${kind}`, kind }]));
    assert.ok(!findings.some((f) => /unknown kind/.test(f.detail)), `${kind} must be registered in HANDLERS`);
  }
});

// Ordering: coverage-coherence walks resolved edges, so it must be listed AFTER
// edges-references-resolve (its position relative to indexes-fresh is immaterial —
// findings do not short-circuit).
test("ordering: coverage-coherence is after edges-references-resolve", () => {
  const rulesDoc = load(fs.readFileSync(path.join(repoRoot, "specs", "schema", "validation-rules.yaml"), "utf8")) as {
    rules: { id: string }[];
  };
  const ids = rulesDoc.rules.map((r) => r.id);
  assert.ok(ids.includes("coverage-coherence") && ids.includes("edges-references-resolve"));
  assert.ok(ids.indexOf("coverage-coherence") > ids.indexOf("edges-references-resolve"));
});
