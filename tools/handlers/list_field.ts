import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * A named field on every node of a given type must be a NON-EMPTY list of
 * NON-EMPTY strings. required_fields only proves the field is present, so a
 * scalar (`paths: specs/schema/**`) or an empty/typo'd list slips through and
 * is then read as "owns nothing" downstream (capabilityPaths returns []).
 * This catches that shape error at validate time.
 *
 * Config: scope: nodes, type: <nodeType>, field: <name>.
 * Absent field → skipped (presence is required_fields' job).
 */
export default function listField(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  const type = asString(rule.type);
  const field = asString(rule.field);

  if (scope !== "nodes" || type === undefined || field === undefined) {
    return [
      {
        rule: ruleId,
        kind: "list_field",
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${ruleId} (list_field) needs scope: nodes plus a 'type' and 'field'`,
      },
    ];
  }

  const findings: Finding[] = [];
  for (const node of spec.nodes) {
    if (asString(node.data["type"]) !== type) continue;
    const value = node.data[field];
    if (value === undefined || value === null) continue; // presence is required_fields' job
    const subject = asString(node.data["id"]) ?? node.file;
    if (!Array.isArray(value) || value.length === 0) {
      findings.push({
        rule: ruleId,
        kind: "list_field",
        subject,
        detail: `node ${subject} field '${field}' must be a non-empty list of strings`,
      });
      continue;
    }
    if (!value.every((item) => typeof item === "string" && item !== "")) {
      findings.push({
        rule: ruleId,
        kind: "list_field",
        subject,
        detail: `node ${subject} field '${field}' must contain only non-empty strings`,
      });
    }
  }
  return findings;
}
