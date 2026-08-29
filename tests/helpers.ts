import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

/**
 * A writable temporary project: `valid-project` config/lock, the given
 * lineage fixture's `specs/` (or none) and the given lifecycle fixture.
 * Callers remove the directory afterwards.
 */
export function makeTempProject(
  options: {
    readonly lineage?: string;
    readonly lifecycle?: string;
    readonly stages?: Readonly<Record<string, { execution: string; actor?: string }>>;
    /** A `tests/fixtures/packs/<name>` pack copied to `<dir>/pack` and selected by config. */
    readonly pack?: string;
    /**
     * Fixture extensions installed into `<dir>/node_modules/@pactwright/<name>`.
     * A plain name is installed and configured enabled; pass `enabled: false`
     * to configure it disabled, or `configure: false` to install the package
     * without a config entry (for `extension add` tests).
     */
    readonly extensions?: ReadonlyArray<
      string | { readonly id: string; readonly enabled?: boolean; readonly configure?: boolean }
    >;
  } = {},
): string {
  const dir = mkdtempSync(path.join(repoRoot, ".tmp-pactwright-test-"));
  cpSync(path.join(fixture("valid-project"), ".pactwright"), path.join(dir, ".pactwright"), {
    recursive: true,
  });
  if (options.lineage !== undefined) {
    cpSync(path.join(fixture("lineage"), options.lineage, "specs"), path.join(dir, "specs"), {
      recursive: true,
    });
  } else {
    mkdirSync(path.join(dir, "specs", "nodes"), { recursive: true });
    mkdirSync(path.join(dir, "specs", "graph"), { recursive: true });
    writeFileSync(path.join(dir, "specs", "graph", "edges.yml"), "edges: []\n");
  }
  if (options.pack !== undefined) {
    cpSync(path.join(fixture("packs"), options.pack), path.join(dir, "pack"), { recursive: true });
    const configPath = path.join(dir, ".pactwright", "config.yml");
    writeFileSync(
      configPath,
      readFileSync(configPath, "utf8")
        .replace('source: "@pactwright/standard"', 'source: "./pack"')
        .replace(/\n {2}version: .*\n/, "\n"),
    );
  }
  if (options.extensions !== undefined) {
    const entries: string[] = [];
    for (const item of options.extensions) {
      const { id, enabled, configure } =
        typeof item === "string" ? { id: item, enabled: true, configure: true } : item;
      cpSync(
        path.join(fixture("extensions"), id),
        path.join(dir, "node_modules", "@pactwright", id),
        { recursive: true },
      );
      if (configure === false) continue;
      entries.push(
        `  ${id}:`,
        `    enabled: ${enabled !== false}`,
        `    source: "@pactwright/${id}"`,
      );
    }
    if (entries.length > 0) {
      const configPath = path.join(dir, ".pactwright", "config.yml");
      writeFileSync(
        configPath,
        readFileSync(configPath, "utf8").replace(
          "extensions: {}",
          ["extensions:", ...entries].join("\n"),
        ),
      );
    }
  }
  const lifecyclePath = path.join(dir, ".pactwright", "lifecycle.yml");
  if (options.lifecycle !== undefined) {
    copyFileSync(path.join(fixture("lifecycle"), options.lifecycle), lifecyclePath);
  }
  if (options.stages !== undefined) {
    const lines = ["version: 1", "", "stages:"];
    for (const [name, stage] of Object.entries(options.stages)) {
      lines.push(`  ${name}:`, `    execution: ${stage.execution}`);
      if (stage.actor !== undefined) lines.push(`    actor: ${stage.actor}`);
    }
    writeFileSync(lifecyclePath, `${lines.join("\n")}\n`);
  }
  return dir;
}

/**
 * An empty temporary directory outside the repository, for `init` tests: no
 * enclosing `.pactwright/` can be found by walking up from it. Callers
 * remove the directory afterwards.
 */
export function makeEmptyRepo(): string {
  return mkdtempSync(path.join(tmpdir(), "pactwright-init-"));
}

/** The §17 default lifecycle stages, with overrides. */
export function defaultStages(
  overrides: Readonly<Record<string, { execution: string; actor?: string }>> = {},
): Record<string, { execution: string; actor?: string }> {
  return {
    "capture-intent": { execution: "manual" },
    "propose-contracts": { execution: "automatic" },
    "approve-contract": { execution: "manual", actor: "human" },
    "write-brief": { execution: "automatic" },
    "deliver-brief": { execution: "automatic" },
    review: { execution: "automatic" },
    "prepare-evidence": { execution: "automatic" },
    ...overrides,
  };
}
