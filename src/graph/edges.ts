import type { Problem } from "../errors.js";
import {
  Checker,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/** One typed edge in the shared store (Delivery Graph §13). */
export interface Edge {
  readonly source: string;
  readonly type: string;
  readonly target: string;
}

export const EDGE_TYPE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export interface EdgesParseResult {
  /** Successfully parsed edges, in file order. */
  readonly edges: readonly Edge[];
  readonly problems: readonly Problem[];
}

export function edgeKey(edge: Edge): string {
  return `${edge.source} --${edge.type}--> ${edge.target}`;
}

/**
 * Parses `specs/graph/edges.yml`: `{ edges: [{source, type, target}, ...] }`.
 * An empty document or `edges: []` is a valid empty store. Duplicate
 * `(source, type, target)` tuples are reported and dropped.
 */
export function parseEdges(raw: unknown, path: string): EdgesParseResult {
  const c = new Checker(path);
  if (raw === null || raw === undefined) return { edges: [], problems: [] };
  const root = expectRecord(c, raw, "edges file");
  if (root === undefined) return { edges: [], problems: c.problems };
  requireKeys(c, root, "edges file", ["edges"]);
  rejectUnknownKeys(c, root, "edges file", ["edges"]);
  const list = root["edges"];
  if (list === null || list === undefined) return { edges: [], problems: c.problems };
  if (!Array.isArray(list)) {
    c.fail("invalid-type", "edges must be a list");
    return { edges: [], problems: c.problems };
  }

  const edges: Edge[] = [];
  const seen = new Set<string>();
  list.forEach((item: unknown, index: number) => {
    const label = `edges[${index}]`;
    const record = expectRecord(c, item, label);
    if (record === undefined) return;
    requireKeys(c, record, label, ["source", "type", "target"]);
    rejectUnknownKeys(c, record, label, ["source", "type", "target"]);
    const source = expectString(c, record["source"], `${label}.source`);
    const type = expectString(c, record["type"], `${label}.type`);
    const target = expectString(c, record["target"], `${label}.target`);
    if (source === undefined || type === undefined || target === undefined) return;
    if (!EDGE_TYPE_PATTERN.test(type)) {
      c.fail("invalid-value", `${label}.type "${type}" must be a lowercase kebab-case token`);
      return;
    }
    const edge: Edge = { source, type, target };
    const key = edgeKey(edge);
    if (seen.has(key)) {
      c.fail("duplicate-edge", `${label} repeats edge ${key}`);
      return;
    }
    seen.add(key);
    edges.push(edge);
  });
  return { edges, problems: c.problems };
}

export function loadEdges(path: string): EdgesParseResult {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { edges: [], problems: read.problems };
  return parseEdges(read.value, path);
}
