import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/** No duplicate values of `field` within `scope`. For nodes, the error names every file declaring the colliding value. */
export default function uniqueField(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  const field = asString(rule.field);
  if ((scope !== "nodes" && scope !== "edges") || field === undefined) {
    return [
      {
        rule: ruleId,
        kind: "unique_field",
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${ruleId} (unique_field) needs scope: nodes|edges and a string field`,
      },
    ];
  }

  const findings: Finding[] = [];
  if (scope === "nodes") {
    const byValue = new Map<string, string[]>();
    for (const node of spec.nodes) {
      const value = asString(node.data[field]);
      if (value === undefined) continue;
      const files = byValue.get(value) ?? [];
      files.push(node.file);
      byValue.set(value, files);
    }
    for (const [value, files] of byValue) {
      if (files.length > 1) {
        findings.push({
          rule: ruleId,
          kind: "unique_field",
          subject: value,
          detail: `duplicate node ${field} ${value} in ${[...files].sort().join(", ")}`,
        });
      }
    }
  } else {
    const counts = new Map<string, number>();
    for (const edge of spec.edges) {
      const value = asString(edge[field]);
      if (value === undefined) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    for (const [value, count] of counts) {
      if (count > 1) {
        findings.push({
          rule: ruleId,
          kind: "unique_field",
          subject: value,
          detail: `duplicate edge ${field} ${value} in specs/graph/edges.yaml (declared ${count} times)`,
        });
      }
    }
  }
  return findings;
}
