import { PactwrightError, type Problem } from "./errors.js";
import { deriveLineages } from "./graph/lineage.js";
import { graphRevision } from "./graph/revision.js";
import { repositoryRevision } from "./graph/repository.js";
import { environmentLockHash } from "./config/lock.js";
import { loadProject, type LoadProjectOptions } from "./loader.js";
import {
  VALIDATION_RULES,
  asRuleProblem,
  checkSemanticRules,
  ruleForCode,
  rulesTriggered,
  type RuleCheckOptions,
  type RuleProblem,
  type ValidationRuleId,
} from "./validate/rules.js";

export { VALIDATION_RULES, type RuleProblem, type ValidationRuleId } from "./validate/rules.js";

/** `pactwright validate` result (Spec 01 §57). */
export interface ValidationReport {
  readonly ok: boolean;
  /** Every problem found in one pass; empty when `ok`. */
  readonly problems: readonly Problem[];
  /**
   * The §57 rules these problems were detected under, in specification
   * order. A problem that maps to no rule — a malformed configuration file,
   * say — still appears in `problems`.
   */
  readonly rules: readonly ValidationRuleId[];
  /** Present when `ok`: what was validated. */
  readonly summary?: {
    readonly nodes: number;
    readonly edges: number;
    readonly lineages: number;
    readonly revision: string;
    readonly repositoryRevision: string;
    readonly environmentLockHash: string;
  };
}

export interface ValidateOptions extends LoadProjectOptions, RuleCheckOptions {}

/**
 * Read-only validation of the complete §57 minimum detection contract.
 *
 * Structural rules (1–8, and the shape-configuration rules) are detected by
 * the canonical loading path, so they are mapped to their rule rather than
 * reimplemented here; the rules that need loaded state — recorded Decision
 * authority, execution progression against the resolved shape, Gate
 * authority, iteration bounds, Evidence closure and replay provenance — are
 * checked afterwards.
 *
 * Validation never repairs graph state as a side effect, and never throws
 * for expected failures: an unloadable or absent project is reported as
 * problems.
 */
export function validateProject(options: ValidateOptions = {}): ValidationReport {
  const { replay, ...loadOptions } = options;
  let project;
  try {
    project = loadProject(loadOptions);
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    const problems = error.problems.map((problem) => {
      const rule = ruleForCode(problem.code);
      return rule === undefined ? problem : asRuleProblem(problem, rule);
    });
    return { ok: false, problems, rules: rulesTriggered(ruleProblems(problems)) };
  }

  const semantic = checkSemanticRules(project, replay === undefined ? {} : { replay });
  if (semantic.length > 0) {
    return { ok: false, problems: semantic, rules: rulesTriggered(semantic) };
  }

  const { nodes, edges } = project.graph;
  return {
    ok: true,
    problems: [],
    rules: [],
    summary: {
      nodes: nodes.length,
      edges: edges.length,
      lineages: deriveLineages(nodes, edges).lineages.length,
      revision: graphRevision({ nodes, edges }),
      repositoryRevision: repositoryRevision(project.paths.root).id,
      environmentLockHash: environmentLockHash(project.lock),
    },
  };
}

function ruleProblems(problems: readonly Problem[]): readonly RuleProblem[] {
  return problems.filter((problem): problem is RuleProblem => "rule" in problem);
}

/** Every §57 rule, for tooling that enumerates the contract. */
export function validationRules(): typeof VALIDATION_RULES {
  return VALIDATION_RULES;
}
