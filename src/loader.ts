import { PactwrightError, type Problem } from "./errors.js";
import { loadConfig, type PactwrightConfig } from "./config/config.js";
import { loadLifecycle, type LifecycleConfig } from "./config/lifecycle.js";
import { loadLock, type LockFile } from "./config/lock.js";
import {
  composedRegistries,
  resolveExtensions,
  type ResolvedExtension,
} from "./extension/resolve.js";
import { CORE_EDGE_SCHEMAS, validateEdges } from "./graph/edge-schema.js";
import { loadEdges, type Edge } from "./graph/edges.js";
import { validateLineages } from "./graph/lineage.js";
import { loadNodes, type GraphNode } from "./graph/nodes.js";
import { CORE_NODE_SCHEMAS, validateNodes } from "./graph/schema.js";
import { findProjectRoot, projectPaths, type ProjectPaths } from "./project.js";

/** Fully loaded canonical project state. */
export interface Project {
  readonly paths: ProjectPaths;
  readonly config: PactwrightConfig;
  readonly lifecycle: LifecycleConfig;
  readonly lock: LockFile;
  /** Every configured extension, resolved; empty when none are configured. */
  readonly extensions: readonly ResolvedExtension[];
  readonly graph: {
    readonly nodes: readonly GraphNode[];
    readonly edges: readonly Edge[];
  };
}

export interface LoadProjectOptions {
  /** Directory to start searching for the project root from. Defaults to `process.cwd()`. */
  readonly cwd?: string;
  /** Use this root directly instead of searching upward from `cwd`. */
  readonly root?: string;
}

/**
 * The single canonical loading path for a Pactwright project.
 *
 * Reads, in order: config → lifecycle → lock → configured extensions (whose
 * registered graph types extend the schema registries) → nodes (then node
 * schemas) → edges (then the typed-edge registry) → current-lineage
 * derivation. Every file is parsed even after an earlier one fails so the
 * caller sees all problems at once; if any problem was found a
 * `PactwrightError` with code `project-load-failed` is thrown carrying the
 * full list.
 */
export function loadProject(options: LoadProjectOptions = {}): Project {
  const root = options.root ?? findProjectRoot(options.cwd);
  const paths = projectPaths(root);
  const problems: Problem[] = [];

  const config = loadConfig(paths.config);
  problems.push(...config.problems);
  const lifecycle = loadLifecycle(paths.lifecycle);
  problems.push(...lifecycle.problems);
  const lock = loadLock(paths.lock);
  problems.push(...lock.problems);

  let extensions: readonly ResolvedExtension[] = [];
  let nodeRegistry = CORE_NODE_SCHEMAS;
  let edgeRegistry = CORE_EDGE_SCHEMAS;
  if (config.value !== undefined && Object.keys(config.value.extensions).length > 0) {
    const resolved = resolveExtensions({ root: paths.root, config: config.value });
    if (resolved.value === undefined) {
      problems.push(...resolved.problems);
    } else {
      extensions = resolved.value;
      ({ nodes: nodeRegistry, edges: edgeRegistry } = composedRegistries(extensions));
    }
  }

  const nodes = loadNodes(paths.nodesDir);
  problems.push(...nodes.problems);
  problems.push(...validateNodes(nodes.nodes, nodeRegistry));
  const edges = loadEdges(paths.edges);
  problems.push(...edges.problems);
  problems.push(...validateEdges(edges.edges, nodes.nodes, edgeRegistry, paths.edges));
  problems.push(...validateLineages(nodes.nodes, edges.edges));

  if (problems.length > 0 || !config.value || !lifecycle.value || !lock.value) {
    throw PactwrightError.fromProblems("project-load-failed", problems);
  }
  return {
    paths,
    config: config.value,
    lifecycle: lifecycle.value,
    lock: lock.value,
    extensions,
    graph: { nodes: nodes.nodes, edges: edges.edges },
  };
}
