/**
 * A2-G probe: what an extension owns in the shared graph, and what it can
 * reach that the core owns.
 *
 * The registries are composed through the public constructors, so this is
 * the same composition `composedRegistries` performs for a configured
 * extension — without needing a packaged extension on disk.
 */
import { PactwrightError } from "../../../src/errors.js";
import {
  CORE_EDGE_SCHEMAS,
  createEdgeSchemaRegistry,
  validateEdges,
} from "../../../src/graph/edge-schema.js";
import type { Edge } from "../../../src/graph/edges.js";
import { GraphIndex } from "../../../src/graph/graph-index.js";
import { lineagesOf } from "../../../src/graph/lineage.js";
import type { GraphNode } from "../../../src/graph/nodes.js";
import {
  CORE_NODE_SCHEMAS,
  createNodeSchemaRegistry,
  validateNodes,
} from "../../../src/graph/schema.js";
import { validateRelationships } from "../../../src/graph/relationships.js";
import { observe, summary } from "./fixture.js";

const node = (id: string, type: string): GraphNode => ({
  id,
  type,
  title: id,
  created: "2026-09-21",
  frontmatter: { id, type, title: id, created: "2026-09-21" },
  body: "Body.",
  path: `/specs/nodes/${id}.md`,
});
const codes = (problems: readonly { code: string }[]): string =>
  problems.length === 0 ? "no problems" : problems.map((p) => p.code).join(", ");

/* G-EXT-1 — an extension node type reuses the shared supersedes relation. */
{
  const nodes = [node("asset-first-1234", "asset"), node("asset-second-1234", "asset")];
  const registry = createNodeSchemaRegistry([
    ...Object.values(CORE_NODE_SCHEMAS),
    { type: "asset", requiredFields: [], relationships: [] },
  ]);
  const edges: Edge[] = [
    { source: "asset-second-1234", type: "supersedes", target: "asset-first-1234" },
  ];
  const problems = [
    ...validateNodes(nodes, registry),
    ...validateEdges(edges, nodes, CORE_EDGE_SCHEMAS, "edges.yml"),
  ];
  observe(
    "G-EXT-1 extension type reusing supersedes (positive control)",
    "an extension node type supersedes its own records through the shared relation",
    codes(problems),
    problems.length === 0,
  );
}

/* G-EXT-2 — an extension may not redeclare a core type. */
{
  for (const [what, build] of [
    [
      "node",
      () =>
        createNodeSchemaRegistry([
          ...Object.values(CORE_NODE_SCHEMAS),
          { type: "evidence", requiredFields: [] },
        ]),
    ],
    [
      "edge",
      () =>
        createEdgeSchemaRegistry([
          ...Object.values(CORE_EDGE_SCHEMAS),
          { type: "supersedes", owner: "x", sourceTypes: "any", targetTypes: "any" },
        ]),
    ],
  ] as const) {
    let outcome: string;
    try {
      build();
      outcome = "accepted";
    } catch (error) {
      outcome = `refused: ${(error as PactwrightError).code}`;
    }
    observe(
      `G-EXT-2 extension redeclaring the core ${what} type (positive control)`,
      "registry construction refuses the duplicate",
      outcome,
      outcome.startsWith("refused"),
    );
  }
}

/* G-EXT-3 — an extension relation between two core records. */
{
  const nodes = [node("intent-target-1234", "intent"), node("evidence-source-1234", "evidence")];
  const registry = createEdgeSchemaRegistry([
    ...Object.values(CORE_EDGE_SCHEMAS),
    { type: "observes", owner: "operations", sourceTypes: "any", targetTypes: "any" },
  ]);
  const edges: Edge[] = [
    { source: "evidence-source-1234", type: "observes", target: "intent-target-1234" },
  ];
  const problems = validateEdges(edges, nodes, registry, "edges.yml");
  const index = GraphIndex.build(nodes, edges);
  const lineage = lineagesOf(index);
  observe(
    "G-EXT-3 an extension relation joining two core records",
    "an extension relation over core records is either declared out of scope or reported",
    `${codes(problems)}; core lineage derivation sees ${lineage.lineages.length} lineage(s)`,
    problems.length > 0,
  );
}

/* G-EXT-4 — an extension node type that declares its own cardinality. */
{
  const registry = createNodeSchemaRegistry([
    ...Object.values(CORE_NODE_SCHEMAS),
    {
      type: "publication",
      requiredFields: [],
      relationships: [{ type: "evidences", direction: "out", min: 1, max: 1 }],
    },
  ]);
  const nodes = [node("publication-orphan-1234", "publication")];
  const index = GraphIndex.build(nodes, []);
  const problems = validateRelationships(nodes, index, registry);
  observe(
    "G-EXT-4 extension-declared cardinality (positive control)",
    "an extension's own relationship rule is enforced for an orphan record",
    codes(problems),
    problems.some((p) => p.code === "missing-relationship"),
  );
}

/* G-EXT-5 — an extension node type whose name shadows an Object member. */
{
  let outcome: string;
  try {
    const registry = createNodeSchemaRegistry([
      ...Object.values(CORE_NODE_SCHEMAS),
      { type: "constructor", requiredFields: [] },
    ]);
    const problems = validateNodes([node("constructor-record-1234", "constructor")], registry);
    outcome = codes(problems);
  } catch (error) {
    outcome = `threw: ${(error as PactwrightError).code}`;
  }
  observe(
    "G-EXT-5 a node type named after an Object member (positive control)",
    "the prototype-less registry resolves it as an ordinary registered type",
    outcome,
    outcome === "no problems",
  );
}

summary();
