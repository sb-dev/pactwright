import type { Problem } from "../errors.js";
import { RECORDING_RESPONSIBILITIES, decisionActor } from "../config/lifecycle.js";
import { checkEvidenceClosure } from "../graph/closure.js";
import { deriveLineages, type Lineage } from "../graph/lineage.js";
import { graphRevision } from "../graph/revision.js";
import { repositoryRevision } from "../graph/repository.js";
import { parseDecidedBy, type DecidedBy } from "../graph/schema.js";
import { executionFor, inShapePhase } from "../lifecycle/engine.js";
import { isGate, isPermittedTransition, stepNamed } from "../lifecycle/shape.js";
import { loadAllExecutionState } from "../lifecycle/state.js";
import type { Project } from "../loader.js";

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
 * The §57 rules that need a *loaded* project: the loader cannot see them
 * because they are about recorded authority, execution state and replay
 * provenance rather than file shape.
 *
 * Read-only, and never repairs graph state as a side effect.
 */
export function checkSemanticRules(
  project: Project,
  options: RuleCheckOptions = {},
): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const at = (path: string) => path;
  const add = (rule: ValidationRuleId, code: string, message: string, path: string): void => {
    problems.push(asRuleProblem({ code, message, path }, rule));
  };

  const { lineages } = deriveLineages(project.graph.nodes, project.graph.edges);

  // Rule 13 — unauthorised Decision. recordDecision refuses one at mutation
  // time, but a hand-edited or imported record has never passed that guard.
  const authorised = decisionActor(project.lifecycle);
  const allowedKinds: readonly string[] =
    authorised === "human" ? ["human"] : ["agent", "automation"];
  for (const node of project.graph.nodes) {
    if (node.type !== "decision") continue;
    const raw = node.frontmatter["decided_by"];
    if (typeof raw !== "string") continue;
    const actor: DecidedBy | undefined = parseDecidedBy(raw);
    if (actor === undefined) continue;
    if (!allowedKinds.includes(actor.kind)) {
      add(
        "unauthorised-decision",
        "unauthorised-actor",
        `decision "${node.id}" was decided by "${raw}" but lifecycle.yml authorises ${authorised} (${allowedKinds.join("/")}) actors`,
        at(node.path),
      );
    }
  }

  // Rules 11 and 14 — execution state must describe a run the shape permits.
  const shape = project.lifecycle.shape;
  const { states, problems: stateProblems } = loadAllExecutionState(project.paths.root);
  for (const problem of stateProblems) {
    problems.push(asRuleProblem(problem, "unresolved-shape-identity"));
  }
  for (const state of states) {
    const path = `${project.paths.root}/.pactwright/execution/${state.brief}.yml`;

    // Rule 10 — the run must name the shape it is executing.
    if (state.shape !== shape.id) {
      add(
        "unresolved-shape-identity",
        "shape-identity-mismatch",
        `the run for brief "${state.brief}" is executing shape "${state.shape}" but the project's resolved shape is "${shape.id}"`,
        path,
      );
      continue;
    }
    // Rule 11 — every recorded step, and every route between consecutive
    // recorded steps, must exist in the shape.
    const walked = [...state.completedSteps, ...(state.currentStep ? [state.currentStep] : [])];
    for (const name of walked) {
      if (stepNamed(shape, name) === undefined) {
        add(
          "impossible-shape-transition",
          "unknown-step",
          `the run for brief "${state.brief}" records step "${name}", which the "${shape.id}" shape does not declare`,
          path,
        );
      }
    }
    for (let i = 0; i + 1 < walked.length; i += 1) {
      const from = walked[i]!;
      const to = walked[i + 1]!;
      if (stepNamed(shape, from) === undefined || stepNamed(shape, to) === undefined) continue;
      if (!isPermittedTransition(shape, from, to)) {
        add(
          "impossible-shape-transition",
          "undeclared-transition",
          `the run for brief "${state.brief}" moved from "${from}" to "${to}", which the "${shape.id}" shape does not declare`,
          path,
        );
      }
    }
    // Rule 14 — a Gate the run has moved past must record who authorised it.
    for (const name of state.completedSteps) {
      const step = stepNamed(shape, name);
      if (step === undefined || !isGate(step)) continue;
      if (state.gates[name] === undefined) {
        add(
          "unauthorised-gate",
          "unauthorised-gate-progression",
          `the run for brief "${state.brief}" progressed past Gate "${name}" without recording the ${step.actor ?? "human"} authority that permitted it`,
          path,
        );
      }
    }
    // Rule 15 — a recorded iteration count must stay within its bound.
    for (const [route, taken] of Object.entries(state.iterations)) {
      const [from, to] = route.split("->", 2) as [string, string | undefined];
      const declared = shape.transitions.find(
        (transition) => transition.from === from && transition.to === to,
      );
      if (declared === undefined) {
        add(
          "impossible-shape-transition",
          "undeclared-route",
          `the run for brief "${state.brief}" counts iterations of route "${route}", which the "${shape.id}" shape does not declare`,
          path,
        );
        continue;
      }
      if (declared.maxIterations !== undefined && taken > declared.maxIterations) {
        add(
          "unbounded-corrective-loop",
          "iteration-bound-exceeded",
          `route "${route}" has run ${taken} times but policy permits ${declared.maxIterations}`,
          path,
        );
      }
    }
  }

  // Rule 12 — Evidence attempted before a successful closing Review. Checked
  // against recorded state: a lineage that reached `done` must have closure
  // its execution state still supports, where that state survives.
  for (const lineage of lineages) {
    problems.push(...checkEvidenceRule(project, lineage));
  }

  // Rule 17 — replay provenance, only when replay validation is requested.
  if (options.replay !== undefined) {
    const derived = graphRevision({ nodes: project.graph.nodes, edges: project.graph.edges });
    const actual = repositoryRevision(project.paths.root).id;
    if (actual !== options.replay.repositoryRevision) {
      add(
        "replay-provenance-mismatch",
        "repository-revision-mismatch",
        `replay requires repository revision "${options.replay.repositoryRevision}" but the repository is at "${actual}"`,
        project.paths.root,
      );
    }
    if (derived !== options.replay.projectGraphRevision) {
      add(
        "replay-provenance-mismatch",
        "graph-revision-mismatch",
        `the recorded repository state derives project graph revision "${derived}", not the recorded "${options.replay.projectGraphRevision}"`,
        project.paths.root,
      );
    }
  }

  return problems;
}

/**
 * Rule 12 for one lineage. A lineage still in its shape phase must not be
 * closable by a run that has not passed the §53 preconditions — which is the
 * same check the mutation guard runs, reused rather than reimplemented.
 */
function checkEvidenceRule(project: Project, lineage: Lineage): readonly RuleProblem[] {
  if (!inShapePhase(lineage) || lineage.brief === undefined) return [];
  const execution = executionFor(project, lineage);
  if (execution === undefined) return [];
  const state = execution.state;
  // Only a run standing at its closing step is claiming Evidence is due.
  if (state.currentStep === undefined) return [];
  const step = stepNamed(project.lifecycle.shape, state.currentStep);
  if (step?.kind !== "evidence") return [];
  const check = checkEvidenceClosure(project, lineage.brief.id);
  if (check.ok) return [];
  return check.problems.map((problem) => asRuleProblem(problem, "evidence-before-review"));
}

/** Every rule the given problems were detected under, in specification order. */
export function rulesTriggered(problems: readonly RuleProblem[]): readonly ValidationRuleId[] {
  const seen = new Set(problems.map((problem) => problem.rule));
  return VALIDATION_RULES.filter((rule) => seen.has(rule.id)).map((rule) => rule.id);
}

/** Responsibilities whose records the rules above reason about. */
export { RECORDING_RESPONSIBILITIES };
