import { PactwrightError } from "./errors.js";
import type { Edge } from "./graph/edges.js";
import { deriveLineage, type DeliveryState, type Lineage } from "./graph/lineage.js";
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

/** Structural edge from a core node towards its intent, regardless of currency. */
const TOWARDS_INTENT: Readonly<Record<string, { type: string; direction: "out" | "in" }>> = {
  evidence: { type: "evidences", direction: "out" }, // evidence --evidences--> brief
  brief: { type: "decomposes", direction: "out" }, // brief --decomposes--> contract
  contract: { type: "selects", direction: "in" }, // decision --selects--> contract
  decision: { type: "resolves", direction: "out" }, // decision --resolves--> intent
};

/**
 * The intent a core Delivery node belongs to, found by walking structural
 * edges (superseded records included). `undefined` when the node is not
 * linked to any intent.
 */
export function findIntentOf(
  nodeId: string,
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
): GraphNode | undefined {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  let current = byId.get(nodeId);
  while (current !== undefined && !seen.has(current.id)) {
    if (current.type === "intent") return current;
    seen.add(current.id);
    const step = TOWARDS_INTENT[current.type];
    if (step === undefined) return undefined;
    const id = current.id;
    const link = edges.find((edge) =>
      step.direction === "out"
        ? edge.type === step.type && edge.source === id
        : edge.type === step.type && edge.target === id,
    );
    current =
      link === undefined
        ? undefined
        : byId.get(step.direction === "out" ? link.target : link.source);
  }
  return undefined;
}

/** Every core node in the intent's tree, current or not, sorted by id. */
function lineageTree(
  intent: GraphNode,
  nodes: readonly GraphNode[],
  edges: readonly Edge[],
): GraphNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const collect = (
    targets: readonly string[],
    type: string,
    direction: "sources" | "targets",
    nodeType: string,
  ) =>
    edges
      .filter(
        (edge) =>
          edge.type === type &&
          targets.includes(direction === "sources" ? edge.target : edge.source),
      )
      .map((edge) => byId.get(direction === "sources" ? edge.source : edge.target))
      .filter((node): node is GraphNode => node !== undefined && node.type === nodeType);
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
  const { nodes, edges } = project.graph;
  const node = nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) {
    throw new PactwrightError("unknown-node", `"${nodeId}" is not a node in this project`);
  }
  const intent = findIntentOf(nodeId, nodes, edges);
  if (intent === undefined) {
    throw new PactwrightError(
      "unlinked-node",
      `${node.type} "${nodeId}" is not linked to any intent; it has no Delivery lineage`,
    );
  }
  const lineage = deriveLineage(intent.id, nodes, edges);
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
  const history = lineageTree(intent, nodes, edges)
    .filter((record) => !currentIds.has(record.id))
    .map((record) => ({
      node: record,
      supersededBy: edges
        .filter((edge) => edge.type === "supersedes" && edge.target === record.id)
        .map((edge) => edge.source)
        .sort(),
    }));
  return { ...base, history };
}
