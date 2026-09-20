import type { Problem } from "../errors.js";
import { decisionActor } from "../config/lifecycle.js";
import { composedRegistries } from "../extension/resolve.js";
import { actorPermitted, authorisedKinds } from "../graph/authority.js";
import { checkEvidenceClosure } from "../graph/closure.js";
import { validateEdges } from "../graph/edge-schema.js";
import type { Edge } from "../graph/edges.js";
import { GraphIndex } from "../graph/graph-index.js";
import { lineagesOf, type Lineage } from "../graph/lineage.js";
import { validateRelationships } from "../graph/relationships.js";
import type { GraphNode } from "../graph/nodes.js";
import { repositoryRevision } from "../graph/repository.js";
import { graphRevision } from "../graph/revision.js";
import { parseDecidedBy, validateNodes } from "../graph/schema.js";
import { executionFor, inShapePhase } from "../lifecycle/engine.js";
import { isGate, isPermittedTransition, stepNamed } from "../lifecycle/shape.js";
import { loadAllExecutionState, type ExecutionState } from "../lifecycle/state.js";
import { gateActor, gateSatisfied } from "../lifecycle/transition.js";
import type { Project } from "../loader.js";
import {
  asRuleProblem,
  ruleForRelationship,
  type RuleProblem,
  type ValidationRuleId,
} from "./rules.js";

/**
 * One validation kernel (consolidation design §4).
 *
 * Seven entry points used to validate different subsets, and they disagreed:
 * `loadProject` checked structure only; `validateProject` checked structure
 * plus a handful of semantic rules; `commitGraphChange` validated nodes,
 * edges, lineages and id immutability, with Decision authority checked only
 * inside `recordDecision` and closure only inside `createEvidence`; the
 * adapter's record path loaded and wrote without checking anything. So a
 * graph could pass one gate and fail another, and the mutation gate could
 * admit state that `validate` rejects.
 *
 * The scopes are the only thing a caller chooses. Each rule lives in exactly
 * one of them.
 */
export const VALIDATION_SCOPES = ["structural", "authority", "execution", "replay"] as const;
export type ValidationScope = (typeof VALIDATION_SCOPES)[number];

/**
 * An in-memory graph state: what is on disk, or a proposed state before a
 * write.
 *
 * It is a `Project` plus the execution documents, so a proposed snapshot can
 * be handed to the same closure and lifecycle derivation a loaded project is.
 */
export interface GraphSnapshot extends Project {
  /** Every run in the project, already parsed. */
  readonly executions: readonly ExecutionState[];
  /** Problems found while reading execution state, if any. */
  readonly executionProblems: readonly Problem[];
}

export interface ReplayCheck {
  readonly repositoryRevision: string;
  readonly projectGraphRevision: string;
}

/** The snapshot of a loaded project, reading its execution state once. */
export function snapshotOf(project: Project): GraphSnapshot {
  const { states, problems } = loadAllExecutionState(project.paths.root);
  return { ...project, executions: states, executionProblems: problems };
}

/**
 * The snapshot a mutation proposes: the loaded project with the change
 * merged in and the index rebuilt over it.
 *
 * This is what makes "validation should fail before canonical mutation where
 * possible" (Core §57) real for more than the structural rules: the kernel
 * judges the complete proposed state, not the state on disk.
 */
export function proposedSnapshot(
  snapshot: GraphSnapshot,
  change: { readonly addNodes: readonly GraphNode[]; readonly addEdges: readonly Edge[] },
): GraphSnapshot {
  const nodes = [...snapshot.graph.nodes, ...change.addNodes];
  const edges = [...snapshot.graph.edges, ...change.addEdges];
  return {
    ...snapshot,
    graph: { nodes, edges, index: GraphIndex.build(nodes, edges) },
  };
}

/**
 * Validates `snapshot` under the given scopes and returns every problem in
 * one pass. Read-only: it never repairs graph state as a side effect.
 */
export function validateSnapshot(
  snapshot: GraphSnapshot,
  scopes: ReadonlySet<ValidationScope>,
  replay?: ReplayCheck,
): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  if (scopes.has("structural")) problems.push(...structural(snapshot));
  if (scopes.has("authority")) problems.push(...authority(snapshot));
  if (scopes.has("execution")) problems.push(...execution(snapshot));
  if (scopes.has("replay") && replay !== undefined)
    problems.push(...replayProvenance(snapshot, replay));
  return problems;
}

/* ---- structural: rules 1–8 and the declared relationship cardinality ---- */

function structural(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const registries = composedRegistries(snapshot.extensions);
  const { nodes, edges, index } = snapshot.graph;

  for (const problem of validateNodes(nodes, registries.nodes)) {
    problems.push(asRuleProblem(problem, "malformed-core-nodes"));
  }
  for (const problem of validateEdges(edges, nodes, registries.edges, snapshot.paths.edges)) {
    problems.push(asRuleProblem(problem, "invalid-core-relationships"));
  }
  for (const problem of validateRelationships(nodes, index, registries.nodes)) {
    problems.push(asRuleProblem(problem, ruleForRelationship(problem.nodeType)));
  }
  // Current-record cardinality (one current Decision per Intent, one current
  // Brief per Contract, one current Evidence per Brief) is derived over the
  // same index rather than rebuilt.
  for (const problem of lineagesOf(index).problems) {
    problems.push(
      asRuleProblem(problem, LINEAGE_RULES[problem.code] ?? "missing-required-lineage"),
    );
  }
  return problems;
}

const LINEAGE_RULES: Readonly<Record<string, ValidationRuleId>> = {
  "missing-contract": "missing-required-lineage",
  "unexpected-contract": "contradictory-current-records",
  "ambiguous-decision": "multiple-unsuperseded-records",
  "ambiguous-contract": "multiple-unsuperseded-records",
  "ambiguous-brief": "invalid-brief-lineage",
  "ambiguous-evidence": "invalid-evidence-lineage",
};

/* ---- authority: rule 13 ---- */

function authority(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const configured = decisionActor(snapshot.lifecycle);
  // The one authority table `recordDecision` and the lifecycle reducer use.
  // Rule 13 used to keep its own copy beside it.
  for (const node of snapshot.graph.nodes) {
    if (node.type !== "decision") continue;
    const raw = node.frontmatter["decided_by"];
    if (typeof raw !== "string") continue;
    if (parseDecidedBy(raw) === undefined) continue;
    if (actorPermitted(configured, raw)) continue;
    problems.push(
      asRuleProblem(
        {
          code: "unauthorised-actor",
          message: `decision "${node.id}" was decided by "${raw}" but lifecycle.yml authorises ${configured} (${authorisedKinds(configured).join("/")}) actors`,
          path: node.path,
        },
        "unauthorised-decision",
      ),
    );
  }
  return problems;
}

/* ---- execution: rules 10, 11, 12, 14, 15 ---- */

function execution(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const shape = snapshot.lifecycle.shape;
  const add = (rule: ValidationRuleId, code: string, message: string, path: string): void => {
    problems.push(asRuleProblem({ code, message, path }, rule));
  };
  for (const problem of snapshot.executionProblems) {
    problems.push(asRuleProblem(problem, "unresolved-shape-identity"));
  }

  for (const state of snapshot.executions) {
    const path = `${snapshot.paths.root}/.pactwright/execution/${state.brief}.yml`;

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
    // recorded steps, must exist in the shape. `visited` is chronology, so a
    // permitted corrective loop reads as delivery → review → delivery here
    // rather than as a `review → review` transition.
    const walked = [...state.visited, ...(state.currentStep ? [state.currentStep] : [])];
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

    // Rule 14 — a Gate the run has moved past must record an *authorised*
    // resolution. Presence alone used to satisfy it, so
    // `resolved_by: agent:unauthorised` passed a human Gate.
    for (const name of new Set(state.visited)) {
      const step = stepNamed(shape, name);
      if (step === undefined || !isGate(step)) continue;
      if (gateSatisfied(step, state.gates)) continue;
      const recorded = state.gates[name];
      const required = gateActor(step);
      add(
        "unauthorised-gate",
        "unauthorised-gate-progression",
        recorded === undefined
          ? `the run for brief "${state.brief}" progressed past Gate "${name}" without recording the ${required} authority that permitted it`
          : `the run for brief "${state.brief}" progressed past Gate "${name}" on the authority of "${recorded.resolvedBy}", which is not ${required} authority`,
        path,
      );
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

  // Rule 12 — Evidence before a successful closing Review.
  for (const lineage of lineagesOf(snapshot.graph.index).lineages) {
    problems.push(...evidenceRule(snapshot, lineage));
  }
  return problems;
}

/**
 * Rule 12 for one lineage: a run standing at its closing step must pass the
 * §53 preconditions — the same check the mutation guard runs, reused rather
 * than reimplemented.
 */
function evidenceRule(snapshot: GraphSnapshot, lineage: Lineage): readonly RuleProblem[] {
  if (!inShapePhase(lineage) || lineage.brief === undefined) return [];
  const run = executionFor(snapshot, lineage);
  if (run === undefined || run.state.currentStep === undefined) return [];
  const step = stepNamed(snapshot.lifecycle.shape, run.state.currentStep);
  if (step?.kind !== "evidence") return [];
  const check = checkEvidenceClosure(snapshot, lineage.brief.id);
  if (check.ok) return [];
  return check.problems.map((problem) => asRuleProblem(problem, "evidence-before-review"));
}

/* ---- replay: rule 17 ---- */

function replayProvenance(snapshot: GraphSnapshot, replay: ReplayCheck): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const add = (code: string, message: string): void => {
    problems.push(
      asRuleProblem({ code, message, path: snapshot.paths.root }, "replay-provenance-mismatch"),
    );
  };
  const actual = repositoryRevision(snapshot.paths.root).id;
  if (actual !== replay.repositoryRevision) {
    add(
      "repository-revision-mismatch",
      `replay requires repository revision "${replay.repositoryRevision}" but the repository is at "${actual}"`,
    );
  }
  const derived = graphRevision({
    nodes: snapshot.graph.nodes,
    edges: snapshot.graph.edges,
  });
  if (derived !== replay.projectGraphRevision) {
    add(
      "graph-revision-mismatch",
      `the recorded repository state derives project graph revision "${derived}", not the recorded "${replay.projectGraphRevision}"`,
    );
  }
  return problems;
}
