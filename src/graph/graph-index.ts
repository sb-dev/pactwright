import { PactwrightError } from "../errors.js";
import type { Edge } from "./edges.js";
import type { GraphNode } from "./nodes.js";

/**
 * An immutable index over one graph state, built once per loaded snapshot.
 *
 * Before this existed, parent discovery was written four times — the private
 * index inside lineage derivation, `findIntentOf`'s one-hop `edges.find`
 * walk, closure's three nested full scans, and the mutation path's
 * per-candidate supersession scan. Three of the four took the first matching
 * edge and ignored a second parent, so they answered questions on state that
 * validation rejects.
 */
export class GraphIndex {
  private readonly byId: ReadonlyMap<string, GraphNode>;
  private readonly superseded: ReadonlySet<string>;
  private readonly bySource: ReadonlyMap<string, readonly Edge[]>;
  private readonly byTarget: ReadonlyMap<string, readonly Edge[]>;

  private constructor(
    byId: ReadonlyMap<string, GraphNode>,
    superseded: ReadonlySet<string>,
    bySource: ReadonlyMap<string, readonly Edge[]>,
    byTarget: ReadonlyMap<string, readonly Edge[]>,
  ) {
    this.byId = byId;
    this.superseded = superseded;
    this.bySource = bySource;
    this.byTarget = byTarget;
  }

  static build(nodes: readonly GraphNode[], edges: readonly Edge[]): GraphIndex {
    const bySource = new Map<string, Edge[]>();
    const byTarget = new Map<string, Edge[]>();
    const superseded = new Set<string>();
    for (const edge of edges) {
      push(bySource, edge.source, edge);
      push(byTarget, edge.target, edge);
      if (edge.type === "supersedes") superseded.add(edge.target);
    }
    return new GraphIndex(
      new Map(nodes.map((node) => [node.id, node])),
      superseded,
      bySource,
      byTarget,
    );
  }

  node(id: string): GraphNode | undefined {
    return this.byId.get(id);
  }

  /** Every indexed node, sorted by id; narrowed to one type when given. */
  nodes(type?: string): readonly GraphNode[] {
    const all = [...this.byId.values()];
    return (type === undefined ? all : all.filter((node) => node.type === type)).sort(byId);
  }

  /**
   * A record is current when nothing supersedes it (Delivery Graph §15). An
   * id nothing points at is current; an unknown id is the caller's concern.
   */
  isCurrent(id: string): boolean {
    return !this.superseded.has(id);
  }

  /**
   * Existing nodes with an edge of `edgeType` pointing at `target`, sorted by
   * id, optionally narrowed to one node type. Edges whose endpoint is missing
   * are ignored: `validateEdges` reports those.
   */
  sourcesOf(target: string, edgeType: string, nodeType?: string): readonly GraphNode[] {
    return this.endpoints(this.byTarget.get(target), edgeType, (edge) => edge.source, nodeType);
  }

  /** As `sourcesOf`, following edges the other way. */
  targetsOf(source: string, edgeType: string, nodeType?: string): readonly GraphNode[] {
    return this.endpoints(this.bySource.get(source), edgeType, (edge) => edge.target, nodeType);
  }

  /** Every edge of `edgeType` leaving `source`, endpoints unresolved. */
  edgesFrom(source: string, edgeType?: string): readonly Edge[] {
    return (this.bySource.get(source) ?? []).filter(
      (edge) => edgeType === undefined || edge.type === edgeType,
    );
  }

  /** Every edge of `edgeType` arriving at `target`, endpoints unresolved. */
  edgesTo(target: string, edgeType?: string): readonly Edge[] {
    return (this.byTarget.get(target) ?? []).filter(
      (edge) => edgeType === undefined || edge.type === edgeType,
    );
  }

  private endpoints(
    edges: readonly Edge[] | undefined,
    edgeType: string,
    pick: (edge: Edge) => string,
    nodeType: string | undefined,
  ): readonly GraphNode[] {
    const found: GraphNode[] = [];
    for (const edge of edges ?? []) {
      if (edge.type !== edgeType) continue;
      const node = this.byId.get(pick(edge));
      if (node === undefined) continue;
      if (nodeType !== undefined && node.type !== nodeType) continue;
      found.push(node);
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

/**
 * The structural edge that leads from each core record towards its Intent,
 * and which way it points (Core §15). Superseded records are followed too:
 * this is structure, not currency.
 */
export const TOWARDS_INTENT: Readonly<
  Record<string, { readonly type: string; readonly direction: "out" | "in" }>
> = {
  evidence: { type: "evidences", direction: "out" }, // evidence --evidences--> brief
  brief: { type: "decomposes", direction: "out" }, // brief --decomposes--> contract
  contract: { type: "selects", direction: "in" }, // decision --selects--> contract
  decision: { type: "resolves", direction: "out" }, // decision --resolves--> intent
};

/**
 * The Intent a core Delivery record belongs to, walking structural edges.
 * `undefined` when the record is not linked to an Intent at all.
 *
 * Throws `ambiguous-parent` when a hop has more than one structural parent.
 * That is the point: a record with two parents is invalid (Core §15), and an
 * operation that quietly picked the first would act on state validation
 * rejects.
 */
export function intentOf(index: GraphIndex, nodeId: string): GraphNode | undefined {
  const seen = new Set<string>();
  let current = index.node(nodeId);
  while (current !== undefined && !seen.has(current.id)) {
    if (current.type === "intent") return current;
    seen.add(current.id);
    const step = TOWARDS_INTENT[current.type];
    if (step === undefined) return undefined;
    const parents =
      step.direction === "out"
        ? index.edgesFrom(current.id, step.type).map((edge) => edge.target)
        : index.edgesTo(current.id, step.type).map((edge) => edge.source);
    if (parents.length > 1) {
      throw new PactwrightError(
        "ambiguous-parent",
        `${current.type} "${current.id}" has ${parents.length} ${step.type} parents (${[...parents].sort().join(", ")}); a core record has exactly one`,
        [
          {
            code: "ambiguous-parent",
            message: `${current.type} "${current.id}" has ${parents.length} ${step.type} parents`,
            path: current.path,
          },
        ],
      );
    }
    const parent = parents[0];
    current = parent === undefined ? undefined : index.node(parent);
  }
  return undefined;
}
