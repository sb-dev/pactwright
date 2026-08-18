import type { Problem } from "../errors.js";
import type { Edge } from "./edges.js";
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
}

export interface LineageResult {
  /** One lineage per unambiguous intent, sorted by intent id. */
  readonly lineages: readonly Lineage[];
  /** Current-lineage ambiguity problems (Delivery Graph §21). */
  readonly problems: readonly Problem[];
}

/**
 * A record is current when nothing supersedes it (Delivery Graph §15).
 * `isCurrent` for an id nothing points at is `true`; unknown ids are the
 * caller's concern.
 */
export function isCurrent(id: string, edges: readonly Edge[]): boolean {
  return !edges.some((edge) => edge.type === "supersedes" && edge.target === id);
}

/** Index of one graph, built once per derivation. */
class GraphIndex {
  private readonly byId: Map<string, GraphNode>;
  private readonly superseded: Set<string>;
  private readonly bySource = new Map<string, Edge[]>();
  private readonly byTarget = new Map<string, Edge[]>();

  constructor(nodes: readonly GraphNode[], edges: readonly Edge[]) {
    this.byId = new Map(nodes.map((node) => [node.id, node]));
    this.superseded = new Set(
      edges.filter((edge) => edge.type === "supersedes").map((edge) => edge.target),
    );
    for (const edge of edges) {
      push(this.bySource, edge.source, edge);
      push(this.byTarget, edge.target, edge);
    }
  }

  isCurrent(id: string): boolean {
    return !this.superseded.has(id);
  }

  /**
   * Existing nodes of `type` that have an edge of `edgeType` pointing at
   * `target`, sorted by id. Edges with a missing or wrongly typed source are
   * ignored: `validateEdges` reports those.
   */
  sourcesOf(target: string, edgeType: string, type: string): GraphNode[] {
    return this.endpoints(this.byTarget.get(target), edgeType, (edge) => edge.source, type);
  }

  /** As `sourcesOf`, following edges the other way. */
  targetsOf(source: string, edgeType: string, type: string): GraphNode[] {
    return this.endpoints(this.bySource.get(source), edgeType, (edge) => edge.target, type);
  }

  private endpoints(
    edges: readonly Edge[] | undefined,
    edgeType: string,
    pick: (edge: Edge) => string,
    type: string,
  ): GraphNode[] {
    const found: GraphNode[] = [];
    for (const edge of edges ?? []) {
      if (edge.type !== edgeType) continue;
      const node = this.byId.get(pick(edge));
      if (node !== undefined && node.type === type) found.push(node);
    }
    return found.sort(byId);
  }
}

function push(map: Map<string, Edge[]>, key: string, edge: Edge): void {
  const list = map.get(key);
  if (list === undefined) map.set(key, [edge]);
  else list.push(edge);
}

function byId(a: GraphNode, b: GraphNode): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function ids(nodes: readonly GraphNode[]): string {
  return nodes.map((node) => node.id).join(", ");
}

/**
 * Derives the current lineage of one intent, reporting every ambiguity in it
 * (Delivery Graph §21, Current-lineage ambiguity). Returns no lineage when the
 * lineage is ambiguous.
 */
function derive(
  intent: GraphNode,
  graph: GraphIndex,
): { lineage?: Lineage; problems: readonly Problem[] } {
  const problems: Problem[] = [];
  const fail = (node: GraphNode, code: string, message: string): void => {
    problems.push({ code, message, path: node.path });
  };

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
  if (decision === undefined) return { lineage: { intent, state: "open" }, problems };

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
      lineage: { intent, decision, state: outcome === "defer" ? "deferred" : "rejected" },
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

  const briefs = graph
    .sourcesOf(contract.id, "decomposes", "brief")
    .filter((brief) => graph.isCurrent(brief.id));
  if (briefs.length > 1) {
    fail(
      contract,
      "ambiguous-brief",
      `contract "${contract.id}" is decomposed by ${briefs.length} current briefs (${ids(briefs)}); supersede all but one`,
    );
    return { problems };
  }
  const brief = briefs[0];
  if (brief === undefined) {
    return { lineage: { intent, decision, contract, state: "contracted" }, problems };
  }

  const evidences = graph
    .sourcesOf(brief.id, "evidences", "evidence")
    .filter((evidence) => graph.isCurrent(evidence.id));
  if (evidences.length > 1) {
    fail(
      brief,
      "ambiguous-evidence",
      `brief "${brief.id}" is evidenced by ${evidences.length} current evidence records (${ids(evidences)}); supersede all but one`,
    );
    return { problems };
  }
  const evidence = evidences[0];
  if (evidence === undefined) {
    return { lineage: { intent, decision, contract, brief, state: "delivering" }, problems };
  }
  return { lineage: { intent, decision, contract, brief, evidence, state: "done" }, problems };
}

/**
 * Derives the current Delivery lineage of every intent from graph structure
 * alone (Delivery Graph §§14–15). Every intent is covered, superseded ones
 * included: a superseded intent's lineage is frozen but must still be
 * unambiguous. Edges with missing or wrongly typed endpoints are ignored,
 * so this is safe to run on a graph `validateEdges` has already rejected.
 */
export function deriveLineages(nodes: readonly GraphNode[], edges: readonly Edge[]): LineageResult {
  const graph = new GraphIndex(nodes, edges);
  const lineages: Lineage[] = [];
  const problems: Problem[] = [];
  for (const intent of [...nodes].filter((node) => node.type === "intent").sort(byId)) {
    const result = derive(intent, graph);
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
): Lineage | undefined {
  const intent = nodes.find((node) => node.id === intentId && node.type === "intent");
  if (intent === undefined) return undefined;
  return derive(intent, new GraphIndex(nodes, edges)).lineage;
}

/** Current-lineage ambiguity validation (Delivery Graph §21). */
export function validateLineages(
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
): readonly Problem[] {
  return deriveLineages(nodes, edges).problems;
}
