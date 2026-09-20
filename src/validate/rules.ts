import type { Problem } from "../errors.js";
import { RECORDING_RESPONSIBILITIES } from "../config/lifecycle.js";
import type { Project } from "../loader.js";
import { snapshotOf, validateSnapshot, type ValidationScope } from "./kernel.js";

/**
 * The Spec 01 §57 minimum detection contract, numbered as the specification
 * numbers it. Every rule has an id so a report, a fixture and the
 * specification line can be matched to each other.
 */
export const VALIDATION_RULES = [
  { number: 1, id: "malformed-core-nodes", description: "malformed core nodes" },
  { number: 2, id: "invalid-core-relationships", description: "invalid core relationships" },
  { number: 3, id: "missing-required-lineage", description: "missing required lineage" },
  { number: 4, id: "contradictory-current-records", description: "contradictory current records" },
  {
    number: 5,
    id: "multiple-unsuperseded-records",
    description: "multiple unsuperseded canonical Decisions or Contracts for one active direction",
  },
  { number: 6, id: "invalid-brief-lineage", description: "invalid Brief-to-Contract lineage" },
  { number: 7, id: "invalid-evidence-lineage", description: "invalid Evidence-to-Brief lineage" },
  { number: 8, id: "illegal-supersession", description: "illegal supersession" },
  { number: 9, id: "missing-lifecycle-shape", description: "missing lifecycle shape" },
  {
    number: 10,
    id: "unresolved-shape-identity",
    description: "unresolved or incompatible shape identity",
  },
  { number: 11, id: "impossible-shape-transition", description: "impossible shape transitions" },
  {
    number: 12,
    id: "evidence-before-review",
    description: "Evidence attempted before successful closing Review",
  },
  { number: 13, id: "unauthorised-decision", description: "unauthorised Decision" },
  { number: 14, id: "unauthorised-gate", description: "unauthorised Gate progression" },
  {
    number: 15,
    id: "unbounded-corrective-loop",
    description: "unbounded configured corrective loops",
  },
  {
    number: 16,
    id: "extension-redefines-core",
    description: "extension state that illegally redefines core Delivery semantics",
  },
  {
    number: 17,
    id: "replay-provenance-mismatch",
    description:
      "replay provenance whose recorded repository state does not derive its recorded Project Graph revision",
  },
] as const;

export type ValidationRuleId = (typeof VALIDATION_RULES)[number]["id"];

/** Problem codes the loader already emits, mapped to the rule they satisfy. */
const LOADER_CODES: Readonly<Record<string, ValidationRuleId>> = {
  // Rule 1 — malformed core nodes.
  "missing-frontmatter": "malformed-core-nodes",
  "invalid-id": "malformed-core-nodes",
  "filename-mismatch": "malformed-core-nodes",
  "missing-body": "malformed-core-nodes",
  "duplicate-id": "malformed-core-nodes",
  "unknown-node-type": "malformed-core-nodes",
  "invalid-outcome": "malformed-core-nodes",
  "invalid-actor": "malformed-core-nodes",
  "unreadable-file": "malformed-core-nodes",
  "missing-directory": "malformed-core-nodes",
  // Rule 2 — invalid core relationships.
  "unknown-edge-type": "invalid-core-relationships",
  "missing-source": "invalid-core-relationships",
  "missing-target": "invalid-core-relationships",
  "invalid-source-type": "invalid-core-relationships",
  "invalid-target-type": "invalid-core-relationships",
  "duplicate-edge": "invalid-core-relationships",
  // Rule 3 — missing required lineage.
  "missing-contract": "missing-required-lineage",
  // Rule 4 — contradictory current records.
  "unexpected-contract": "contradictory-current-records",
  // Rule 5 — multiple unsuperseded canonical records for one direction.
  "ambiguous-decision": "multiple-unsuperseded-records",
  "ambiguous-contract": "multiple-unsuperseded-records",
  // Rule 6 / 7 — invalid Brief and Evidence lineage.
  "ambiguous-brief": "invalid-brief-lineage",
  "ambiguous-evidence": "invalid-evidence-lineage",
  // Rule 8 — illegal supersession.
  "endpoint-type-mismatch": "illegal-supersession",
  "self-loop": "illegal-supersession",
  "edge-cycle": "illegal-supersession",
  // Rule 9 / 10 / 11 / 15 — shape configuration, from the shape parser.
  "empty-shape": "missing-lifecycle-shape",
  "missing-evidence-closure": "missing-lifecycle-shape",
  "missing-delivery-step": "missing-lifecycle-shape",
  "missing-review-step": "missing-lifecycle-shape",
  "review-must-precede-evidence": "missing-lifecycle-shape",
  "lifecycle-needs-migration": "missing-lifecycle-shape",
  "invalid-shape-id": "unresolved-shape-identity",
  "duplicate-step": "unresolved-shape-identity",
  "invalid-step-name": "unresolved-shape-identity",
  "impossible-transition": "impossible-shape-transition",
  "missing-gate-actor": "unauthorised-gate",
  "unbounded-corrective-loop": "unbounded-corrective-loop",
  "invalid-iteration-bound": "unbounded-corrective-loop",
  // Rule 16 — extension state redefining core semantics.
  "duplicate-node-type": "extension-redefines-core",
  "duplicate-edge-type": "extension-redefines-core",
  "reserved-namespace": "extension-redefines-core",
  "duplicate-namespace": "extension-redefines-core",
};

/**
 * The §57 rule a declared-relationship failure belongs to, by node type. The
 * Brief and Evidence rules name their own lineage; everything else is
 * "missing required lineage".
 *
 * One mapping, used by the kernel and by the loader-error path, so the same
 * orphan record is reported under the same rule whichever gate found it.
 */
const RELATIONSHIP_RULES: Readonly<Record<string, ValidationRuleId>> = {
  brief: "invalid-brief-lineage",
  evidence: "invalid-evidence-lineage",
};

export function ruleForRelationship(nodeType: string): ValidationRuleId {
  return RELATIONSHIP_RULES[nodeType] ?? "missing-required-lineage";
}

/** The rule a loader problem satisfies, when it maps to one. */
export function ruleForCode(code: string): ValidationRuleId | undefined {
  return LOADER_CODES[code];
}

/** A problem carrying the §57 rule it was detected under. */
export interface RuleProblem extends Problem {
  readonly rule: ValidationRuleId;
  readonly ruleNumber: number;
}

const RULE_NUMBERS: Readonly<Record<string, number>> = Object.fromEntries(
  VALIDATION_RULES.map((rule) => [rule.id, rule.number]),
);

export function asRuleProblem(problem: Problem, rule: ValidationRuleId): RuleProblem {
  return { ...problem, rule, ruleNumber: RULE_NUMBERS[rule]! };
}

export interface RuleCheckOptions {
  /**
   * Rule 17 is only checked when replay validation is requested: ordinary
   * validation must not require historical reconstruction (Step 9).
   */
  readonly replay?: {
    readonly repositoryRevision: string;
    readonly projectGraphRevision: string;
  };
}

/**
 * The §57 rules that need a *loaded* project, run through the one kernel.
 *
 * The logic that used to live here moved to `./kernel.js` so the standalone
 * validator, the mutation gate and the lifecycle paths cannot check different
 * subsets. This module keeps the rule table, the ids, the messages' rule
 * mapping and `RuleProblem`.
 *
 * Read-only, and never repairs graph state as a side effect.
 */
export function checkSemanticRules(
  project: Project,
  options: RuleCheckOptions = {},
): readonly RuleProblem[] {
  const scopes = new Set<ValidationScope>(["authority", "execution"]);
  if (options.replay !== undefined) scopes.add("replay");
  return validateSnapshot(snapshotOf(project), scopes, options.replay);
}

/** Every rule the given problems were detected under, in specification order. */
export function rulesTriggered(problems: readonly RuleProblem[]): readonly ValidationRuleId[] {
  const seen = new Set(problems.map((problem) => problem.rule));
  return VALIDATION_RULES.filter((rule) => seen.has(rule.id)).map((rule) => rule.id);
}

/** Responsibilities whose records the rules above reason about. */
export { RECORDING_RESPONSIBILITIES };
