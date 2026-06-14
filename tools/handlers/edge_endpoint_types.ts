import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * Enforce edge-types.yaml endpoint rules. `any` means no constraint (the
 * assertion is skipped, never compared as a literal type name);
 * `same_as_source` asserts the target node's type equals the source node's
 * type. Edges of undeclared type and unresolved endpoints are skipped —
 * enum_constraint and references_resolve flag those.
 */
export default function edgeEndpointTypes(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const findings: Finding[] = [];

  spec.edges.forEach((edge, i) => {
    const edgeType = asString(edge["type"]);
    const def = edgeType !== undefined ? spec.edgeTypes[edgeType] : undefined;
    if (edgeType === undefined || def === undefined) return;

    const subject = asString(edge["id"]) ?? `specs/graph/edges.yaml[${i}]`;
    const sourceNode = asString(edge["source"]) !== undefined ? byId.get(asString(edge["source"])!) : undefined;
    const targetNode = asString(edge["target"]) !== undefined ? byId.get(asString(edge["target"])!) : undefined;
    const sourceType = sourceNode !== undefined ? asString(sourceNode.data["type"]) : undefined;
    const targetType = targetNode !== undefined ? asString(targetNode.data["type"]) : undefined;

    // source: a concrete type, a list of allowed types, or `any` (no constraint).
    const sourceRule = def.source;
    if (sourceRule !== undefined && sourceRule !== "any" && sourceType !== undefined && !allows(sourceRule, sourceType)) {
      findings.push({
        rule: ruleId,
        kind: "edge_endpoint_types",
        subject,
        detail: `edge ${subject} type=${edgeType} requires source.type=${label(sourceRule)}, got ${sourceType}`,
      });
    }

    // target: a concrete type, a list, `any` (skip), or `same_as_source`.
    const targetRule = def.target;
    if (targetRule === undefined || targetRule === "any" || targetType === undefined) return;
    if (targetRule === "same_as_source") {
      if (sourceType !== undefined && targetType !== sourceType) {
        findings.push({
          rule: ruleId,
          kind: "edge_endpoint_types",
          subject,
          detail: `edge ${subject} type=${edgeType} requires target.type == source.type (${sourceType}), got ${targetType}`,
        });
      }
      return;
    }
    if (!allows(targetRule, targetType)) {
      findings.push({
        rule: ruleId,
        kind: "edge_endpoint_types",
        subject,
        detail: `edge ${subject} type=${edgeType} requires target.type=${label(targetRule)}, got ${targetType}`,
      });
    }
  });
  return findings;
}

/** Does a node type satisfy an endpoint rule that is a single type or a list? */
function allows(rule: string | string[], nodeType: string): boolean {
  return Array.isArray(rule) ? rule.includes(nodeType) : nodeType === rule;
}

/** Human-readable form of an endpoint rule for error messages. */
function label(rule: string | string[]): string {
  return Array.isArray(rule) ? `[${rule.join(", ")}]` : rule;
}
