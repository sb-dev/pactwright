import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Problem } from "../src/errors.js";
import { CORE_EDGE_SCHEMAS, validateEdges } from "../src/graph/edge-schema.js";
import { loadEdges, type Edge } from "../src/graph/edges.js";
import { loadNodes, type GraphNode } from "../src/graph/nodes.js";
import { CORE_NODE_SCHEMAS, validateNodes } from "../src/graph/schema.js";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const fixtures = path.join(repoRoot, "tests", "fixtures");

export function fixture(name: string): string {
  return path.join(fixtures, name);
}

/**
 * Nodes + edges of one `<dir>/specs` fixture, validated exactly as the
 * loader does it (node schemas, then the typed-edge registry).
 */
export function loadGraphFixture(dir: string): {
  nodes: readonly GraphNode[];
  edges: readonly Edge[];
  problems: readonly Problem[];
} {
  const nodes = loadNodes(path.join(dir, "specs", "nodes"));
  const edgesPath = path.join(dir, "specs", "graph", "edges.yml");
  const edges = loadEdges(edgesPath);
  return {
    nodes: nodes.nodes,
    edges: edges.edges,
    problems: [
      ...nodes.problems,
      ...validateNodes(nodes.nodes, CORE_NODE_SCHEMAS),
      ...edges.problems,
      ...validateEdges(edges.edges, nodes.nodes, CORE_EDGE_SCHEMAS, edgesPath),
    ],
  };
}
