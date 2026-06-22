import { asString, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * A node field must draw from a fixed, CLOSED key set — checking only
 * `node.data`, NEVER `node.body` (no prose parsing). Two modes:
 *
 *  - `set` (default): the field is a LIST whose value-set must EQUAL `keys`
 *    exactly — every key present, no extras, no duplicates, no non-string items.
 *    Used for an `integration` node's `integration_sections` (the structured
 *    completeness signal: presence of a well-typed shape, not proof the work ran).
 *  - `member`: the field is a SCALAR string that must be ONE OF `keys` — a
 *    string-enum membership check (enum_constraint covers only `type`/`status`).
 *    Used for a `brief`'s optional `lane`.
 *
 * Absent field → skipped (presence is required_fields' job; an optional field
 * such as `lane` is simply allowed to be unset).
 *
 * Config: scope: nodes, type: <nodeType>, field: <name>, keys: [<string>...],
 * mode?: set | member (defaults to set).
 */
export default function closedKeySet(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const scope = asString(rule.scope);
  const type = asString(rule.type);
  const field = asString(rule.field);
  const mode = asString(rule.mode) ?? "set";
  const keys = Array.isArray(rule.keys)
    ? rule.keys.filter((k): k is string => typeof k === "string" && k !== "")
    : [];

  if (
    scope !== "nodes" ||
    type === undefined ||
    field === undefined ||
    keys.length === 0 ||
    (mode !== "set" && mode !== "member")
  ) {
    return [
      {
        rule: ruleId,
        kind: "closed_key_set",
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${ruleId} (closed_key_set) needs scope: nodes plus a 'type', 'field', non-empty 'keys', and mode in [set, member]`,
      },
    ];
  }

  const allowed = new Set(keys);
  const findings: Finding[] = [];
  for (const node of spec.nodes) {
    if (asString(node.data["type"]) !== type) continue;
    const value = node.data[field];
    if (value === undefined || value === null) continue; // presence is required_fields' job
    const subject = asString(node.data["id"]) ?? node.file;

    if (mode === "member") {
      if (typeof value !== "string" || !allowed.has(value)) {
        findings.push({
          rule: ruleId,
          kind: "closed_key_set",
          subject,
          detail: `node ${subject} field '${field}' must be one of [${keys.join(", ")}], got ${JSON.stringify(value)}`,
        });
      }
      continue;
    }

    // mode === "set": the field's value-set must equal `keys` exactly.
    if (!Array.isArray(value)) {
      findings.push({
        rule: ruleId,
        kind: "closed_key_set",
        subject,
        detail: `node ${subject} field '${field}' must be a list of exactly the keys [${keys.join(", ")}]`,
      });
      continue;
    }
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    const unexpected = new Set<string>();
    for (const item of value) {
      if (typeof item !== "string" || item === "") {
        unexpected.add(JSON.stringify(item));
        continue;
      }
      if (seen.has(item)) duplicates.add(item);
      seen.add(item);
      if (!allowed.has(item)) unexpected.add(item);
    }
    const missing = keys.filter((k) => !seen.has(k));
    if (missing.length > 0 || unexpected.size > 0 || duplicates.size > 0) {
      const parts: string[] = [];
      if (missing.length > 0) parts.push(`missing [${missing.join(", ")}]`);
      if (unexpected.size > 0) parts.push(`unexpected [${[...unexpected].sort().join(", ")}]`);
      if (duplicates.size > 0) parts.push(`duplicate [${[...duplicates].sort().join(", ")}]`);
      findings.push({
        rule: ruleId,
        kind: "closed_key_set",
        subject,
        detail: `node ${subject} field '${field}' must list exactly the keys [${keys.join(", ")}]: ${parts.join("; ")}`,
      });
    }
  }
  return findings;
}
