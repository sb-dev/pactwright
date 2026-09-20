import { PactwrightError, type Problem } from "../errors.js";
import type { Edge } from "./edges.js";
import { GraphIndex, intentOf } from "./graph-index.js";
import type { GraphNode } from "./nodes.js";
import { decisionFields, type DecisionOutcome } from "./schema.js";

/**
 * Derived Delivery lifecycle states (Delivery Graph §14). These are views of
 * canonical graph structure, never stored node fields.
 */
export const DELIVERY_STATES = [
  "open",
  "deferred",
  "rejected",
  "contracted",
  "delivering",
  "done",
] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

/**
 * The current Delivery lineage of one intent: the current records that hang
 * off it, one per type, plus the lifecycle state derived from which of them
 * exist. Records that are missing simply are not there yet.
 */
export interface Lineage {
  readonly intent: GraphNode;
  readonly decision?: GraphNode;
  readonly contract?: GraphNode;
  readonly brief?: GraphNode;
  readonly evidence?: GraphNode;
  readonly state: DeliveryState;
  /** The intent itself is superseded: the lineage is frozen (§15). */
  readonly superseded: boolean;
}

export interface LineageResult {
  /** One lineage per unambiguous intent, sorted by intent id. */
  readonly lineages: readonly Lineage[];
  /** Current-lineage ambiguity problems (Delivery Graph §21). */
  readonly problems: readonly Problem[];
}

function ids(nodes: readonly GraphNode[]): string {
  return nodes.map((node) => node.id).join(", ");
}

interface GlobalCardinality {
  readonly problems: readonly Problem[];
  /** Contract/brief ids whose current children are ambiguous. */
  readonly ambiguous: ReadonlySet<string>;
}

/**
 * Global cardinality constraints (Delivery Graph §21): at most one current
 * Brief decomposes each Contract, and at most one current Evidence record
 * evidences each Brief — checked for every contract and brief in the graph,
 * independently of any intent path and of the record's own currency.
 */
function checkGlobalCardinality(graph: GraphIndex): GlobalCardinality {
  const problems: Problem[] = [];
  const ambiguous = new Set<string>();
  const of = (type: string): readonly GraphNode[] => graph.nodes(type);
  for (const contract of of("contract")) {
    const briefs = graph
      .sourcesOf(contract.id, "decomposes", "brief")
      .filter((brief) => graph.isCurrent(brief.id));
    if (briefs.length > 1) {
      ambiguous.add(contract.id);
      problems.push({
        code: "ambiguous-brief",
        message: `contract "${contract.id}" is decomposed by ${briefs.length} current briefs (${ids(briefs)}); supersede all but one`,
        path: contract.path,
      });
    }
  }
  for (const brief of of("brief")) {
    const evidences = graph
      .sourcesOf(brief.id, "evidences", "evidence")
      .filter((evidence) => graph.isCurrent(evidence.id));
    if (evidences.length > 1) {
      ambiguous.add(brief.id);
      problems.push({
        code: "ambiguous-evidence",
        message: `brief "${brief.id}" is evidenced by ${evidences.length} current evidence records (${ids(evidences)}); supersede all but one`,
        path: brief.path,
      });
    }
  }
  return { problems, ambiguous };
}

/**
 * Derives the current lineage of one intent, reporting every ambiguity in it
 * (Delivery Graph §21, Current-lineage ambiguity). Returns no lineage when the
 * lineage is ambiguous.
 */
function derive(
  intent: GraphNode,
  graph: GraphIndex,
  ambiguous: ReadonlySet<string>,
): { lineage?: Lineage; problems: readonly Problem[] } {
  const problems: Problem[] = [];
  const fail = (node: GraphNode, code: string, message: string): void => {
    problems.push({ code, message, path: node.path });
  };
  const superseded = !graph.isCurrent(intent.id);

  const decisions = graph
    .sourcesOf(intent.id, "resolves", "decision")
    .filter((decision) => graph.isCurrent(decision.id));
  if (decisions.length > 1) {
    fail(
      intent,
      "ambiguous-decision",
      `intent "${intent.id}" is resolved by ${decisions.length} current decisions (${ids(decisions)}); supersede all but one`,
    );
    return { problems };
  }
  const decision = decisions[0];
  if (decision === undefined) return { lineage: { intent, state: "open", superseded }, problems };

  // An invalid decision was already reported by validateNode; do not judge its lineage.
  const fields = decisionFields(decision);
  if (fields === undefined) return { problems };
  const outcome: DecisionOutcome = fields.outcome;

  const selected = graph.targetsOf(decision.id, "selects", "contract");
  if (outcome !== "proceed") {
    if (selected.length > 0) {
      fail(
        decision,
        "unexpected-contract",
        `decision "${decision.id}" has outcome ${outcome} but selects a contract (${ids(selected)}); only proceed selects a contract`,
      );
      return { problems };
    }
    return {
      lineage: {
        intent,
        decision,
        state: outcome === "defer" ? "deferred" : "rejected",
        superseded,
      },
      problems,
    };
  }

  const contracts = selected.filter((contract) => graph.isCurrent(contract.id));
  if (contracts.length === 0) {
    const superseded = selected.length === 0 ? "" : ` (superseded: ${ids(selected)})`;
    fail(
      decision,
      "missing-contract",
      `decision "${decision.id}" proceeds but selects no current contract${superseded}; proceed selects exactly one current contract`,
    );
    return { problems };
  }
  if (contracts.length > 1) {
    fail(
      decision,
      "ambiguous-contract",
      `decision "${decision.id}" selects ${contracts.length} current contracts (${ids(contracts)}); proceed selects exactly one current contract`,
    );
    return { problems };
  }
  const contract = contracts[0]!;

  // >1 current brief was already reported by the global cardinality pass.
  if (ambiguous.has(contract.id)) return { problems };
  const briefs = graph
    .sourcesOf(contract.id, "decomposes", "brief")
    .filter((brief) => graph.isCurrent(brief.id));
  const brief = briefs[0];
  if (brief === undefined) {
    return { lineage: { intent, decision, contract, state: "contracted", superseded }, problems };
  }

  // >1 current evidence was already reported by the global cardinality pass.
  if (ambiguous.has(brief.id)) return { problems };
  const evidences = graph
    .sourcesOf(brief.id, "evidences", "evidence")
    .filter((evidence) => graph.isCurrent(evidence.id));
  const evidence = evidences[0];
  if (evidence === undefined) {
    return {
      lineage: { intent, decision, contract, brief, state: "delivering", superseded },
      problems,
    };
  }
  return {
    lineage: { intent, decision, contract, brief, evidence, state: "done", superseded },
    problems,
  };
}

/**
 * Derives the current Delivery lineage of every intent from graph structure
 * alone (Delivery Graph §§14–15). Every intent is covered, superseded ones
 * included: a superseded intent's lineage is frozen but must still be
 * unambiguous. Edges with missing or wrongly typed endpoints are ignored,
 * so this is safe to run on a graph `validateEdges` has already rejected.
 */
export function deriveLineages(
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
  index?: GraphIndex,
): LineageResult {
  return lineagesOf(index ?? GraphIndex.build(nodes, edges));
}

/** Every lineage in an already-indexed graph. */
export function lineagesOf(graph: GraphIndex): LineageResult {
  const global = checkGlobalCardinality(graph);
  const lineages: Lineage[] = [];
  const problems: Problem[] = [...global.problems];
  for (const intent of graph.nodes("intent")) {
    const result = derive(intent, graph, global.ambiguous);
    problems.push(...result.problems);
    if (result.lineage !== undefined) lineages.push(result.lineage);
  }
  return { lineages, problems };
}

/** The lineage of one intent; `undefined` when the id is not an intent or the lineage is ambiguous. */
export function deriveLineage(
  intentId: string,
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
  index?: GraphIndex,
): Lineage | undefined {
  return lineageOfIntent(index ?? GraphIndex.build(nodes, edges), intentId);
}

/** The lineage of one intent in an already-indexed graph. */
export function lineageOfIntent(graph: GraphIndex, intentId: string): Lineage | undefined {
  const intent = graph.node(intentId);
  if (intent === undefined || intent.type !== "intent") return undefined;
  return derive(intent, graph, checkGlobalCardinality(graph).ambiguous).lineage;
}

/** An Intent and the current lineage hanging off it, resolved from any record in it. */
export interface Resolved {
  readonly intent: GraphNode;
  readonly lineage: Lineage;
}

/**
 * The Intent and current lineage that `nodeId` belongs to, resolved through
 * the shared index (§8). Throws `ambiguous-parent` when a hop towards the
 * Intent has more than one structural parent, and `ambiguous-lineage` when
 * the Intent is reachable but its lineage is not derivable.
 *
 * Every former parent-walking entry point — `findIntentOf`, closure's
 * `lineageOf`, provenance's `runFor` — resolves here, so they can no longer
 * disagree about which Intent a record belongs to.
 */
export function lineageFor(index: GraphIndex, nodeId: string): Resolved | undefined {
  const intent = intentOf(index, nodeId);
  if (intent === undefined) return undefined;
  const lineage = lineageOfIntent(index, intent.id);
  if (lineage === undefined) {
    throw new PactwrightError(
      "ambiguous-lineage",
      `intent "${intent.id}" has no unambiguous lineage; fix validation problems first`,
    );
  }
  return { intent, lineage };
}

/** Current-lineage ambiguity validation (Delivery Graph §21). */
export function validateLineages(
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
  index?: GraphIndex,
): readonly Problem[] {
  return deriveLineages(nodes, edges, index).problems;
}

export { GraphIndex };
