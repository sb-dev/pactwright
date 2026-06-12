import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

// Edges have one fixed shape across all edge types, so their required fields
// are a constant here rather than schema-derived like node required_fields
// (edge-types.yaml declares endpoint rules, not field lists). If edge types
// ever diverge in shape, move this into edge-types.yaml.
const EDGE_REQUIRED_FIELDS = ["id", "source", "type", "target", "created"];

function present(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Nodes: every field in node-types.yaml[<type>].required_fields is present,
 * plus a non-empty-body check when requires_body is true. Nodes of undeclared
 * type are skipped here — the enum_constraint rule flags them.
 * Edges: the five canonical edge fields are present.
 */
export default function requiredFields(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  if (scope !== "nodes" && scope !== "edges") {
    return [
      {
        rule: ruleId,
        kind: "required_fields",
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${ruleId} (required_fields) needs scope: nodes|edges`,
      },
    ];
  }

  const findings: Finding[] = [];
  if (scope === "nodes") {
    for (const node of spec.nodes) {
      const type = asString(node.data["type"]);
      const def = type !== undefined ? spec.nodeTypes[type] : undefined;
      if (def === undefined) continue;
      const subject = asString(node.data["id"]) ?? node.file;
      for (const field of def.required_fields ?? []) {
        if (!present(node.data[field])) {
          findings.push({
            rule: ruleId,
            kind: "required_fields",
            subject,
            detail: `node ${subject} missing required field: ${field}`,
          });
        }
      }
      if (def.requires_body === true && node.body.trim() === "") {
        findings.push({
          rule: ruleId,
          kind: "required_fields",
          subject,
          detail: `node ${subject} requires a non-empty body`,
        });
      }
    }
  } else {
    spec.edges.forEach((edge, i) => {
      const subject = asString(edge["id"]) ?? `specs/graph/edges.yaml[${i}]`;
      for (const field of EDGE_REQUIRED_FIELDS) {
        if (!present(edge[field])) {
          findings.push({
            rule: ruleId,
            kind: "required_fields",
            subject,
            detail: `edge ${subject} missing required field: ${field}`,
          });
        }
      }
    });
  }
  return findings;
}
