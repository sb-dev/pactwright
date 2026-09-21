/**
 * A2-G probe: typed edges, cardinality, supersession and what the loader
 * can and cannot see. Cycles are checked per relation, as the registry
 * declares them, not by assuming the whole graph is a DAG.
 */
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadContext } from "../../../src/context.js";
import { PactwrightError } from "../../../src/errors.js";
import {
  createEdgeSchemaRegistry,
  CORE_EDGE_SCHEMAS,
  validateEdges,
} from "../../../src/graph/edge-schema.js";
import type { Edge } from "../../../src/graph/edges.js";
import { createBrief, createIntent, recordDecision } from "../../../src/graph/mutations.js";
import { loadNodes, type GraphNode } from "../../../src/graph/nodes.js";
import { loadProject } from "../../../src/loader.js";
import { makeProject, observe, summary } from "./fixture.js";

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

/* G-STR-1 — a supersedes cycle is rejected (positive control). */
{
  const nodes = ["a", "b", "c"].map((n) => node(`intent-${n}-1234`, "intent"));
  const edges: Edge[] = [
    { source: "intent-a-1234", type: "supersedes", target: "intent-b-1234" },
    { source: "intent-b-1234", type: "supersedes", target: "intent-c-1234" },
    { source: "intent-c-1234", type: "supersedes", target: "intent-a-1234" },
  ];
  const problems = validateEdges(edges, nodes, CORE_EDGE_SCHEMAS, "edges.yml");
  observe(
    "G-STR-1 supersedes cycle (positive control)",
    "a cycle in an acyclic relation is reported as edge-cycle",
    codes(problems),
    problems.some((p) => p.code === "edge-cycle"),
  );
}

/* G-STR-2 — a cycle in a relation that is *not* declared acyclic is allowed. */
{
  const registry = createEdgeSchemaRegistry([
    ...Object.values(CORE_EDGE_SCHEMAS),
    { type: "relates-to", owner: "probe", sourceTypes: "any", targetTypes: "any" },
  ]);
  const nodes = ["a", "b"].map((n) => node(`intent-${n}-1234`, "intent"));
  const edges: Edge[] = [
    { source: "intent-a-1234", type: "relates-to", target: "intent-b-1234" },
    { source: "intent-b-1234", type: "relates-to", target: "intent-a-1234" },
  ];
  const problems = validateEdges(edges, nodes, registry, "edges.yml");
  observe(
    "G-STR-2 cycle in a relation not declared acyclic (positive control)",
    "a cyclic relation that does not declare acyclicity is accepted",
    codes(problems),
    problems.length === 0,
  );
}

/* G-STR-3 — a cycle alternating two acyclic relations. */
{
  const registry = createEdgeSchemaRegistry([
    ...Object.values(CORE_EDGE_SCHEMAS),
    {
      type: "replaces",
      owner: "probe",
      sourceTypes: "any",
      targetTypes: "any",
      sameType: true,
      acyclic: true,
    },
  ]);
  const nodes = ["a", "b"].map((n) => node(`intent-${n}-1234`, "intent"));
  const edges: Edge[] = [
    { source: "intent-a-1234", type: "supersedes", target: "intent-b-1234" },
    { source: "intent-b-1234", type: "replaces", target: "intent-a-1234" },
  ];
  const problems = validateEdges(edges, nodes, registry, "edges.yml");
  observe(
    "G-STR-3 cycle spanning two acyclic relations",
    "a supersession cycle formed by two acyclic relations together is reported",
    codes(problems),
    problems.some((p) => p.code === "edge-cycle"),
  );
}

/* G-STR-4 — orphan and over-connected records are caught (positive control). */
{
  const root = makeProject("cardinality");
  const first = createIntent(root, { title: "First intent", body: "Body." });
  const second = createIntent(root, { title: "Second intent", body: "Body." });
  const { decision } = recordDecision(root, {
    intentId: first.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "Body.",
    contract: { title: "Probe contract", body: "Body." },
  });
  // Hand-add a second `resolves` edge: the shape no public command produces.
  const edgesPath = join(root, "specs", "graph", "edges.yml");
  writeFileSync(
    edgesPath,
    `${readFileSync(edgesPath, "utf8")}  - source: ${decision.id}\n    type: resolves\n    target: ${second.id}\n`,
    "utf8",
  );
  let outcome: string;
  try {
    loadProject({ root });
    outcome = "accepted";
  } catch (error) {
    outcome = codes((error as PactwrightError).problems);
  }
  observe(
    "G-STR-4 a decision resolving two intents (positive control)",
    "the loader reports excess-relationship for the second resolves edge",
    outcome,
    outcome.includes("excess-relationship"),
  );
}

/* G-STR-5 — node files the loader cannot see. */
{
  const root = makeProject("visibility");
  const intent = createIntent(root, { title: "Visible intent", body: "Body." });
  const nodesDir = join(root, "specs", "nodes");
  const visible = loadNodes(nodesDir).nodes.length;
  // The same record, moved one directory down and given a non-.md extension.
  mkdirSync(join(nodesDir, "archive"), { recursive: true });
  renameSync(join(nodesDir, `${intent.id}.md`), join(nodesDir, "archive", `${intent.id}.md`));
  const afterMove = loadNodes(nodesDir);
  observe(
    "G-STR-5 a node file in a subdirectory",
    "a node file moved into a subdirectory is reported, not silently dropped",
    `before ${visible} node(s); after ${afterMove.nodes.length} node(s), ${codes(afterMove.problems)}`,
    afterMove.problems.length > 0,
  );
}

/* G-STR-6 — id immutability across time. */
{
  const root = makeProject("immutability");
  const intent = createIntent(root, { title: "Durable intent", body: "Body." });
  rmSync(join(root, "specs", "nodes", `${intent.id}.md`));
  let outcome: string;
  try {
    const project = loadProject({ root });
    outcome = `accepted with ${project.graph.nodes.length} node(s)`;
  } catch (error) {
    outcome = codes((error as PactwrightError).problems);
  }
  observe(
    "G-STR-6 a canonical record deleted from disk",
    'Core §5 "IDs never change; records are superseded, not deleted" is enforced on load',
    outcome,
    outcome.includes("id-removed"),
  );
}

/* G-STR-7 — the extension context namespace map. */
{
  const root = makeProject("namespace");
  const intent = createIntent(root, { title: "Context intent", body: "Body." });
  const project = loadProject({ root });
  for (const namespace of ["constructor", "review", "isprototypeof"]) {
    let outcome: string;
    try {
      const context = loadContext(project, intent.id, {
        contributors: [() => ({ namespace, context: { seen: true } })],
      });
      outcome = `contributed; keys = ${Object.keys(context.extensions).join(",") || "(none)"}`;
    } catch (error) {
      outcome = `refused: ${(error as PactwrightError).code}`;
    }
    observe(
      `G-STR-7 extension context namespace "${namespace}"`,
      "a single contribution under a schema-valid namespace is accepted once",
      outcome,
      outcome.startsWith("contributed") && outcome.includes(namespace),
    );
  }
}

/* G-STR-8 — an impossible and a future `created` date. */
{
  const root = makeProject("dates");
  const results: string[] = [];
  for (const created of ["2026-13-45", "2099-01-01", "0000-00-00"]) {
    try {
      const intent = createIntent(root, { title: `Dated ${created}`, body: "Body.", created });
      results.push(`${created}: accepted as ${intent.created}`);
    } catch (error) {
      results.push(`${created}: refused (${(error as PactwrightError).code})`);
    }
  }
  observe(
    "G-STR-8 impossible and future created dates",
    "a created date that is not a real past date is refused",
    results.join("; "),
    results.every((r) => r.includes("refused")),
  );
}

/* G-STR-9 — history does not report a record twice. */
{
  const root = makeProject("history");
  const intent = createIntent(root, { title: "History intent", body: "Body." });
  recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "First decision.",
    contract: { title: "First contract", body: "Body." },
  });
  const second = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:probe",
    body: "Second decision.",
    contract: { title: "Second contract", body: "Body." },
  });
  createBrief(root, { contractId: second.contract!.id, title: "History brief", body: "Body." });
  const context = loadContext(loadProject({ root }), intent.id, { history: true });
  const ids = (context.history ?? []).map((record) => record.node.id);
  observe(
    "G-STR-9 superseded history (positive control)",
    "every superseded record appears exactly once",
    `${ids.length} record(s): ${ids.join(", ")}`,
    new Set(ids).size === ids.length,
  );
}

summary();
