import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * Three supported configurations:
 *  - scope: nodes, field: type  → node.type is a key of node-types.yaml
 *  - scope: edges, field: type  → edge.type is a key of edge-types.yaml
 *  - scope: nodes, field: status → node.status ∈ node-types.yaml[<type>].status_values;
 *    types that declare no status_values (e.g. decision) are skipped.
 * Missing values are skipped — presence is required_fields' job.
 */
export default function enumConstraint(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  const field = asString(rule.field);
  const findings: Finding[] = [];

  if (scope === "nodes" && field === "type") {
    for (const node of spec.nodes) {
      const type = asString(node.data["type"]);
      if (type === undefined) continue;
      if (!(type in spec.nodeTypes)) {
        const subject = asString(node.data["id"]) ?? node.file;
        findings.push({
          rule: ruleId,
          kind: "enum_constraint",
          subject,
          detail: `node ${subject} type=${type} not declared in node-types.yaml`,
        });
      }
    }
    return findings;
  }

  if (scope === "edges" && field === "type") {
    spec.edges.forEach((edge, i) => {
      const type = asString(edge["type"]);
      if (type === undefined) return;
      if (!(type in spec.edgeTypes)) {
        const subject = asString(edge["id"]) ?? `specs/graph/edges.yaml[${i}]`;
        findings.push({
          rule: ruleId,
          kind: "enum_constraint",
          subject,
          detail: `edge ${subject} type=${type} not declared in edge-types.yaml`,
        });
      }
    });
    return findings;
  }

  if (scope === "nodes" && field === "status") {
    for (const node of spec.nodes) {
      const type = asString(node.data["type"]);
      const def = type !== undefined ? spec.nodeTypes[type] : undefined;
      if (def?.status_values === undefined) continue;
      const status = node.data["status"];
      if (status === undefined || status === null || status === "") continue;
      if (typeof status !== "string" || !def.status_values.includes(status)) {
        const subject = asString(node.data["id"]) ?? node.file;
        findings.push({
          rule: ruleId,
          kind: "enum_constraint",
          subject,
          detail: `node ${subject} status=${String(status)} not in [${def.status_values.join(", ")}]`,
        });
      }
    }
    return findings;
  }

  return [
    {
      rule: ruleId,
      kind: "enum_constraint",
      subject: "specs/schema/validation-rules.yaml",
      detail: `rule ${ruleId} (enum_constraint) has unsupported scope/field combination: ${String(scope)}/${String(field)}`,
    },
  ];
}
