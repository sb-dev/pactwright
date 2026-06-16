import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * An integer field on every node of the configured types must be one of an
 * allowed set of integers. required_fields only proves the field is present, so
 * a present-but-out-of-range or non-integer value (e.g. `class: 4`, `class: 2.5`,
 * the string `class: "2"`) would otherwise slip through.
 *
 * Config: scope: nodes, types: [<nodeType>...], values: [<int>...], field?: name
 * (defaults to `class`). Absent field → skipped (presence is required_fields' job).
 *
 * Note: under CORE_SCHEMA a YAML `2` and `2.0` both parse to the JS number `2`,
 * which `Number.isInteger` accepts — so `2.0` PASSES. Only genuinely non-integral
 * numbers, non-numbers, and out-of-set integers are rejected.
 */
export default function classRange(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  const field = asString(rule.field) ?? "class";
  const types = Array.isArray(rule.types)
    ? rule.types.filter((t): t is string => typeof t === "string")
    : [];
  const values = Array.isArray(rule.values)
    ? rule.values.filter((v): v is number => typeof v === "number")
    : [];

  if (scope !== "nodes" || types.length === 0 || values.length === 0) {
    return [
      {
        rule: ruleId,
        kind: "class_range",
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${ruleId} (class_range) needs scope: nodes plus non-empty 'types' and 'values' lists`,
      },
    ];
  }

  const findings: Finding[] = [];
  for (const node of spec.nodes) {
    const type = asString(node.data["type"]);
    if (type === undefined || !types.includes(type)) continue;
    const value = node.data[field];
    if (value === undefined || value === null) continue; // presence is required_fields' job
    if (typeof value === "number" && Number.isInteger(value) && values.includes(value)) continue;
    const subject = asString(node.data["id"]) ?? node.file;
    findings.push({
      rule: ruleId,
      kind: "class_range",
      subject,
      detail: `node ${subject} field '${field}' must be an integer in [${values.join(", ")}]`,
    });
  }
  return findings;
}
