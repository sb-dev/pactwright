import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/** Every edge endpoint named in `fields` resolves to a known node id. */
export default function referencesResolve(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const fields = Array.isArray(rule.fields)
    ? rule.fields.filter((f): f is string => typeof f === "string")
    : ["source", "target"];

  const knownIds = new Set<string>();
  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    if (id !== undefined) knownIds.add(id);
  }
  const checks = new Set(spec.checks);

  const findings: Finding[] = [];
  spec.edges.forEach((edge, i) => {
    const subject = asString(edge["id"]) ?? `specs/graph/edges.yaml[${i}]`;
    const edgeType = asString(edge["type"]);
    for (const field of fields) {
      const value = asString(edge[field]);
      if (value === undefined) continue;
      // A `waives` edge may target a named check (not a node); a check from
      // the registry resolves just as a node id would.
      if (field === "target" && edgeType === "waives" && checks.has(value)) continue;
      if (!knownIds.has(value)) {
        findings.push({
          rule: ruleId,
          kind: "references_resolve",
          subject,
          detail: `edge ${subject} ${field} ${value} does not resolve`,
        });
      }
    }
  });
  return findings;
}
