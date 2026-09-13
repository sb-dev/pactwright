import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Problem } from "../src/errors.js";
import { CORE_EDGE_SCHEMAS, validateEdges } from "../src/graph/edge-schema.js";
import { loadEdges, type Edge } from "../src/graph/edges.js";
import { loadNodes, type GraphNode } from "../src/graph/nodes.js";
import { CORE_NODE_SCHEMAS, validateNodes } from "../src/graph/schema.js";
import { loadConfig } from "../src/config/config.js";
import { resolveDesiredState, writeLock } from "../src/pack/resolve.js";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const fixtures = path.join(repoRoot, "tests", "fixtures");

export function fixture(name: string): string {
  return path.join(fixtures, name);
}

/**
 * A directory guaranteed to be outside any Pactwright project. A static
 * fixture inside this repository cannot serve: the repository is itself a
 * Pactwright project, so the loader walking up from any in-repo directory
 * finds the repository's own `.pactwright/`.
 */
export function notAProject(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "pactwright-not-a-project-"));
  mkdirSync(path.join(dir, "sub"));
  return path.join(dir, "sub");
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
    readonly responsibilities?: Readonly<Record<string, { execution: string; actor?: string }>>;
    readonly shapeSteps?: readonly ShapeStepSpec[];
    readonly transitions?: readonly TransitionSpec[];
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
    /** Keep the fixture's placeholder lock, for lock-drift tests. */
    readonly resolveLock?: boolean;
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
  if (
    options.responsibilities !== undefined ||
    options.shapeSteps !== undefined ||
    options.transitions !== undefined
  ) {
    writeFileSync(
      lifecyclePath,
      lifecycleDocument(
        options.responsibilities ?? defaultResponsibilities(),
        options.shapeSteps ?? defaultShapeSteps(),
        options.transitions ?? DEFAULT_TRANSITIONS,
      ),
    );
  }
  // A real project's lock describes the environment it actually resolves to,
  // and sync now refuses to render from one that does not. Resolve the lock
  // from the finished configuration, exactly as `init` does.
  if (options.resolveLock !== false) {
    const config = loadConfig(path.join(dir, ".pactwright", "config.yml"));
    if (config.value !== undefined) {
      const desired = resolveDesiredState({ root: dir, config: config.value });
      if (desired.value !== undefined)
        writeLock(path.join(dir, ".pactwright", "lock.yml"), desired.value.lock);
    }
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

export interface ShapeStepSpec {
  readonly name: string;
  readonly kind: "delivery" | "review" | "evidence";
  readonly execution: string;
  readonly actor?: string;
}

export interface TransitionSpec {
  readonly from: string;
  readonly to: string;
  readonly maxIterations?: number;
}

/** The default Contract-crafting execution policy, with overrides. */
export function defaultResponsibilities(
  overrides: Readonly<Record<string, { execution: string; actor?: string }>> = {},
): Record<string, { execution: string; actor?: string }> {
  return {
    "capture-intent": { execution: "manual" },
    "propose-contracts": { execution: "automatic" },
    "approve-contract": { execution: "manual", actor: "human" },
    "write-brief": { execution: "automatic" },
    ...overrides,
  };
}

/** The built-in direct shape's steps: Brief → Delivery → Review → Evidence. */
export function defaultShapeSteps(
  overrides: Readonly<Record<string, { execution: string; actor?: string }>> = {},
): ShapeStepSpec[] {
  const base: ShapeStepSpec[] = [
    { name: "delivery", kind: "delivery", execution: "automatic" },
    { name: "review", kind: "review", execution: "automatic" },
    { name: "evidence", kind: "evidence", execution: "automatic" },
  ];
  return base.map((step) => {
    const override = overrides[step.name];
    if (override === undefined) return step;
    return override.actor === undefined
      ? { ...step, execution: override.execution }
      : { ...step, execution: override.execution, actor: override.actor };
  });
}

export const DEFAULT_TRANSITIONS: readonly TransitionSpec[] = [
  { from: "review", to: "delivery", maxIterations: 3 },
];

/** Renders a version 2 lifecycle document. */
export function lifecycleDocument(
  responsibilities: Readonly<Record<string, { execution: string; actor?: string }>>,
  steps: readonly ShapeStepSpec[],
  transitions: readonly TransitionSpec[],
): string {
  const lines = ["version: 2", "", "responsibilities:"];
  for (const [name, policy] of Object.entries(responsibilities)) {
    lines.push(`  ${name}:`, `    execution: ${policy.execution}`);
    if (policy.actor !== undefined) lines.push(`    actor: ${policy.actor}`);
  }
  lines.push("", "shape:", "  id: direct", "  steps:");
  for (const step of steps) {
    lines.push(
      `    - name: ${step.name}`,
      `      kind: ${step.kind}`,
      `      execution: ${step.execution}`,
    );
    if (step.actor !== undefined) lines.push(`      actor: ${step.actor}`);
  }
  if (transitions.length === 0) {
    lines.push("  transitions: []");
  } else {
    lines.push("  transitions:");
    for (const transition of transitions) {
      lines.push(`    - from: ${transition.from}`, `      to: ${transition.to}`);
      if (transition.maxIterations !== undefined) {
        lines.push(`      max_iterations: ${transition.maxIterations}`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}
