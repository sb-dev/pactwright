import { PactwrightError } from "./errors.js";
import type { Edge } from "./graph/edges.js";
import { GraphIndex, intentOf } from "./graph/graph-index.js";
import { lineageOfIntent, type DeliveryState, type Lineage } from "./graph/lineage.js";
import type { GraphNode } from "./graph/nodes.js";
import type { Project } from "./loader.js";

/** A superseded record of the lineage's history (`--history` only). */
export interface HistoryRecord {
  readonly node: GraphNode;
  /** Ids of the records that supersede this one. */
  readonly supersededBy: readonly string[];
}

/** One namespaced extension contribution (Delivery Graph §22). */
export interface ExtensionContext {
  readonly namespace: string;
  readonly context: unknown;
}

/**
 * The extension-context seam. Enabled extensions contribute after the core
 * lineage is resolved; they receive it read-only and can only add one
 * namespaced entry, so extension context never alters the Delivery lineage.
 * No core contributor exists in this checkpoint.
 */
export type ContextContributor = (input: {
  readonly project: Project;
  readonly lineage: Lineage;
  readonly history: boolean;
}) => ExtensionContext | undefined;

/** `pactwright context <node-id>` result (Delivery Graph §22). */
export interface DeliveryContext {
  /** The node id that was asked for. */
  readonly requested: string;
  readonly intent: string;
  readonly state: DeliveryState;
  /** Current core lineage in stage order; only existing stages. */
  readonly lineage: readonly GraphNode[];
  /** False when the requested node is superseded (it is then not in `lineage`). */
  readonly requestedIsCurrent: boolean;
  /** Superseded records of this intent's tree, sorted by id; only with `history`. */
  readonly history?: readonly HistoryRecord[];
  /** Namespaced extension context; empty in this checkpoint. */
  readonly extensions: Readonly<Record<string, unknown>>;
}

export interface ContextOptions {
  readonly history?: boolean;
  readonly contributors?: readonly ContextContributor[];
}

/**
 * The intent a core Delivery node belongs to, resolved through the shared
 * index (§8). `undefined` when the node is not linked to any intent; throws
 * `ambiguous-parent` when a hop has more than one structural parent, rather
 * than silently taking the first matching edge as it used to.
 */
export function findIntentOf(
  nodeId: string,
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
  index?: GraphIndex,
): GraphNode | undefined {
  return intentOf(index ?? GraphIndex.build(nodes, edges), nodeId);
}

/** Every core node in the intent's tree, current or not, sorted by id. */
function lineageTree(intent: GraphNode, index: GraphIndex): GraphNode[] {
  const collect = (
    anchors: readonly string[],
    type: string,
    direction: "sources" | "targets",
    nodeType: string,
  ): readonly GraphNode[] =>
    anchors.flatMap((anchor) =>
      direction === "sources"
        ? index.sourcesOf(anchor, type, nodeType)
        : index.targetsOf(anchor, type, nodeType),
    );
  const decisions = collect([intent.id], "resolves", "sources", "decision");
  const contracts = collect(
    decisions.map((d) => d.id),
    "selects",
    "targets",
    "contract",
  );
  const briefs = collect(
    contracts.map((c) => c.id),
    "decomposes",
    "sources",
    "brief",
  );
  const evidence = collect(
    briefs.map((b) => b.id),
    "evidences",
    "sources",
    "evidence",
  );
  return [intent, ...decisions, ...contracts, ...briefs, ...evidence].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

/**
 * Resolves the current core Delivery lineage the node belongs to (§22).
 * Only the five core node types exist in the graph, so rejected
 * alternatives, review transcripts, obsolete reasoning and execution
 * provenance can never appear; superseded records appear only under
 * `history` when asked for.
 */
export function loadContext(
  project: Project,
  nodeId: string,
  options: ContextOptions = {},
): DeliveryContext {
  const index = project.graph.index;
  const node = index.node(nodeId);
  if (node === undefined) {
    throw new PactwrightError("unknown-node", `"${nodeId}" is not a node in this project`);
  }
  const intent = intentOf(index, nodeId);
  if (intent === undefined) {
    throw new PactwrightError(
      "unlinked-node",
      `${node.type} "${nodeId}" is not linked to any intent; it has no Delivery lineage`,
    );
  }
  const lineage = lineageOfIntent(index, intent.id);
  if (lineage === undefined) {
    // The loader rejects ambiguous lineages, so this cannot happen for a loaded project.
    throw new PactwrightError(
      "ambiguous-lineage",
      `intent "${intent.id}" has an ambiguous lineage`,
    );
  }
  const current = [
    lineage.intent,
    lineage.decision,
    lineage.contract,
    lineage.brief,
    lineage.evidence,
  ].filter((record): record is GraphNode => record !== undefined);
  const currentIds = new Set(current.map((record) => record.id));

  const extensions: Record<string, unknown> = {};
  for (const contribute of options.contributors ?? []) {
    const contribution = contribute({ project, lineage, history: options.history === true });
    if (contribution === undefined) continue;
    if (contribution.namespace in extensions) {
      throw new PactwrightError(
        "duplicate-context-namespace",
        `extension context namespace "${contribution.namespace}" was contributed twice`,
      );
    }
    extensions[contribution.namespace] = contribution.context;
  }

  const base: DeliveryContext = {
    requested: nodeId,
    intent: intent.id,
    state: lineage.state,
    lineage: current,
    requestedIsCurrent: currentIds.has(nodeId),
    extensions,
  };
  if (options.history !== true) return base;
  const history = lineageTree(intent, index)
    .filter((record) => !currentIds.has(record.id))
    .map((record) => ({
      node: record,
      supersededBy: index
        .edgesTo(record.id, "supersedes")
        .map((edge) => edge.source)
        .sort(),
    }));
  return { ...base, history };
}
