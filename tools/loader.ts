import * as fs from "node:fs";
import * as path from "node:path";
import { fromYaml } from "./yaml.ts";

export interface NodeRecord {
  /** Path relative to the working directory, posix separators. */
  file: string;
  /** Parsed YAML frontmatter. */
  data: Record<string, unknown>;
  /** Markdown body after the closing frontmatter delimiter. */
  body: string;
}

export type EdgeRecord = Record<string, unknown>;

export interface NodeTypeDef {
  required_fields?: string[];
  requires_body?: boolean;
  status_values?: string[];
}

export interface EdgeTypeDef {
  // A single allowed type, a list of allowed types, `any`, or (target only)
  // `same_as_source`. edge_endpoint_types enforces it.
  source?: string | string[];
  target?: string | string[];
}

export interface Rule {
  id?: unknown;
  kind?: unknown;
  [param: string]: unknown;
}

export interface LoadedSpec {
  /** Absolute path of the specs directory. */
  root: string;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  nodeTypes: Record<string, NodeTypeDef>;
  edgeTypes: Record<string, EdgeTypeDef>;
  rules: Rule[];
  /** Named-check ids from schema/checks.yaml; `[]` when the file is absent. */
  checks: string[];
  /** Sensitive globs from schema/validation-rules.yaml `sensitive_paths`; `[]`
   * when absent. Read by `spec:check-diff`, not by a validation rule. */
  sensitivePaths: string[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

function splitFrontmatter(raw: string, file: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(raw);
  if (!match) {
    throw new Error(`${file}: missing YAML frontmatter (expected leading '---' block)`);
  }
  const parsed = fromYaml(match[1]);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${file}: frontmatter must be a YAML mapping`);
  }
  return { data: parsed as Record<string, unknown>, body: raw.slice(match[0].length) };
}

function readYamlFile(file: string): unknown {
  return fromYaml(fs.readFileSync(file, "utf8"));
}

function asRecord(value: unknown, file: string, key: string): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${file}: '${key}' must be a YAML mapping`);
  }
  return value as Record<string, unknown>;
}

function asList(value: unknown, file: string, key: string): unknown[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${file}: '${key}' must be a YAML list`);
  }
  return value;
}

export function loadSpec(specsRoot: string = path.join(process.cwd(), "specs")): LoadedSpec {
  const root = path.resolve(specsRoot);
  const relRoot = path.relative(process.cwd(), root) || ".";

  const nodesDir = path.join(root, "nodes");
  const nodeFiles = fs
    .readdirSync(nodesDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const nodes: NodeRecord[] = nodeFiles.map((name) => {
    const abs = path.join(nodesDir, name);
    const rel = path.join(relRoot, "nodes", name).split(path.sep).join("/");
    const { data, body } = splitFrontmatter(fs.readFileSync(abs, "utf8"), rel);
    return { file: rel, data, body };
  });

  const edgesFile = path.join(root, "graph", "edges.yaml");
  const edgesDoc = asRecord(readYamlFile(edgesFile), edgesFile, "edges document");
  const edges = asList(edgesDoc["edges"], edgesFile, "edges").map((e, i) => {
    if (e === null || typeof e !== "object" || Array.isArray(e)) {
      throw new Error(`${edgesFile}: edges[${i}] must be a YAML mapping`);
    }
    return e as EdgeRecord;
  });

  const nodeTypesFile = path.join(root, "schema", "node-types.yaml");
  const nodeTypes = asRecord(
    asRecord(readYamlFile(nodeTypesFile), nodeTypesFile, "document")["node_types"],
    nodeTypesFile,
    "node_types",
  ) as Record<string, NodeTypeDef>;

  const edgeTypesFile = path.join(root, "schema", "edge-types.yaml");
  const edgeTypes = asRecord(
    asRecord(readYamlFile(edgeTypesFile), edgeTypesFile, "document")["edge_types"],
    edgeTypesFile,
    "edge_types",
  ) as Record<string, EdgeTypeDef>;

  const rulesFile = path.join(root, "schema", "validation-rules.yaml");
  const rulesDoc = asRecord(readYamlFile(rulesFile), rulesFile, "document");
  const rules = asList(rulesDoc["rules"], rulesFile, "rules") as Rule[];
  // sensitive_paths is optional data (not a rule): absent → empty, so older
  // graphs and fixtures without it load cleanly.
  const sensitivePaths = asList(rulesDoc["sensitive_paths"], rulesFile, "sensitive_paths")
    .map((p) => asString(p))
    .filter((p): p is string => p !== undefined);

  // checks.yaml is optional: absent in older graphs and in test fixtures, so
  // a missing file yields an empty registry rather than a load failure.
  const checksFile = path.join(root, "schema", "checks.yaml");
  const checks = fs.existsSync(checksFile)
    ? asList(asRecord(readYamlFile(checksFile), checksFile, "document")["checks"], checksFile, "checks")
        .map((c) => asString(c))
        .filter((c): c is string => c !== undefined)
    : [];

  return { root, nodes, edges, nodeTypes, edgeTypes, rules, checks, sensitivePaths };
}

/** Frontmatter/edge field as a non-empty string, else undefined. */
export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Code-unit (UTF-16) string ordering. Every comparator that feeds emitted
 * output uses this so all sorts in the toolchain agree — the precondition for
 * byte-identical, deterministic files. Locale-independent and identical to the
 * default Array#sort and `<`/`>` semantics (unlike `localeCompare`).
 */
export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A capability node's owned globs (its `paths` frontmatter list); `[]` if absent
 * or malformed. Shared by `check-diff` and `drift-map`. */
export function capabilityPaths(node: NodeRecord): string[] {
  const p = node.data["paths"];
  return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
}

/** Map of node id → first node declaring it (duplicates flagged by validation). */
export function nodesById(spec: LoadedSpec): Map<string, NodeRecord> {
  const map = new Map<string, NodeRecord>();
  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    if (id !== undefined && !map.has(id)) map.set(id, node);
  }
  return map;
}
