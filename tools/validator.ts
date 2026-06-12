import * as fs from "node:fs";
import * as path from "node:path";
import { asString, compareStrings, type LoadedSpec, type Rule } from "./loader.ts";
import { toYaml } from "./yaml.ts";
import uniqueField from "./handlers/unique_field.ts";
import requiredFields from "./handlers/required_fields.ts";
import enumConstraint from "./handlers/enum_constraint.ts";
import referencesResolve from "./handlers/references_resolve.ts";
import edgeEndpointTypes from "./handlers/edge_endpoint_types.ts";
import indexesFresh from "./handlers/indexes_fresh.ts";

export interface Finding {
  rule: string;
  kind: string;
  subject: string;
  detail: string;
}

export type Handler = (rule: Rule, spec: LoadedSpec) => Finding[];

const HANDLERS: Record<string, Handler> = {
  unique_field: uniqueField,
  required_fields: requiredFields,
  enum_constraint: enumConstraint,
  references_resolve: referencesResolve,
  edge_endpoint_types: edgeEndpointTypes,
  indexes_fresh: indexesFresh,
};

export function formatFinding(finding: Finding): string {
  return `[rule: ${finding.rule}] ${finding.detail}`;
}

function compareFindings(a: Finding, b: Finding): number {
  return (
    compareStrings(a.rule, b.rule) ||
    compareStrings(a.kind, b.kind) ||
    compareStrings(a.subject, b.subject) ||
    compareStrings(a.detail, b.detail)
  );
}

/**
 * Run every rule from validation-rules.yaml in declared order, collecting
 * findings from all rules (no short-circuit). Returns a sorted list.
 */
export function runValidation(spec: LoadedSpec): Finding[] {
  const findings: Finding[] = [];
  spec.rules.forEach((rule, i) => {
    const id = asString(rule.id);
    const kind = asString(rule.kind);
    if (id === undefined || kind === undefined) {
      findings.push({
        rule: id ?? `<rules[${i}]>`,
        kind: kind ?? "<unknown>",
        subject: "specs/schema/validation-rules.yaml",
        detail: `malformed rule at rules[${i}]: every rule needs a string 'id' and 'kind'`,
      });
      return;
    }
    const handler = HANDLERS[kind];
    if (handler === undefined) {
      findings.push({
        rule: id,
        kind,
        subject: "specs/schema/validation-rules.yaml",
        detail: `rule ${id} has unknown kind '${kind}' (known: ${Object.keys(HANDLERS).sort().join(", ")})`,
      });
      return;
    }
    findings.push(...handler(rule, spec));
  });
  return findings.sort(compareFindings);
}

/** Persist full findings to <root>/reports/validation.yaml; returns the path written. */
export function writeReport(spec: LoadedSpec, findings: Finding[]): string {
  const dir = path.join(spec.root, "reports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "validation.yaml");
  fs.writeFileSync(file, toYaml(findings));
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}
