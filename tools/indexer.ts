import * as fs from "node:fs";
import * as path from "node:path";
import { asString, type LoadedSpec } from "./loader.ts";
import { toYaml } from "./yaml.ts";

/**
 * Minimal projections of edges.yaml. The keyed node is implicit; `id` is the
 * edge id pointing back to the full record in edges.yaml.
 */
export interface IncomingEntry {
  id: string;
  type: string;
  source: string;
}

export interface OutgoingEntry {
  id: string;
  type: string;
  target: string;
}

export interface UnresolvedEntry {
  edge: string;
  missing: "source" | "target";
  value: string;
}

export interface Indexes {
  incoming: Record<string, IncomingEntry[]>;
  outgoing: Record<string, OutgoingEntry[]>;
  byType: Record<string, string[]>;
  unresolved: UnresolvedEntry[];
}

export const INDEX_FILES = ["by-type.yaml", "incoming.yaml", "outgoing.yaml", "unresolved.yaml"] as const;
export type IndexFileName = (typeof INDEX_FILES)[number];

function compareEntries(a: { id: string; type: string }, b: { id: string; type: string }): number {
  // Sort by (type, then edge id) so relationship kinds read contiguously.
  return a.type < b.type ? -1 : a.type > b.type ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildIndexes(spec: LoadedSpec): Indexes {
  const knownIds = new Set<string>();
  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    if (id !== undefined) knownIds.add(id);
  }

  const incoming: Record<string, IncomingEntry[]> = {};
  const outgoing: Record<string, OutgoingEntry[]> = {};
  const byType: Record<string, string[]> = {};
  const unresolved: UnresolvedEntry[] = [];

  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    const type = asString(node.data["type"]);
    if (id === undefined || type === undefined) continue;
    (byType[type] ??= []).push(id);
  }
  for (const ids of Object.values(byType)) ids.sort();

  for (const edge of spec.edges) {
    const id = asString(edge["id"]) ?? "";
    const type = asString(edge["type"]) ?? "";
    const source = asString(edge["source"]);
    const target = asString(edge["target"]);

    if (target !== undefined && source !== undefined) {
      (incoming[target] ??= []).push({ id, type, source });
      (outgoing[source] ??= []).push({ id, type, target });
    } else if (target !== undefined) {
      (incoming[target] ??= []).push({ id, type, source: "" });
    } else if (source !== undefined) {
      (outgoing[source] ??= []).push({ id, type, target: "" });
    }

    for (const endpoint of ["source", "target"] as const) {
      const value = asString(edge[endpoint]);
      if (value !== undefined && !knownIds.has(value)) {
        unresolved.push({ edge: id, missing: endpoint, value });
      }
    }
  }

  for (const entries of Object.values(incoming)) entries.sort(compareEntries);
  for (const entries of Object.values(outgoing)) entries.sort(compareEntries);
  unresolved.sort(
    (a, b) =>
      a.edge.localeCompare(b.edge) || a.missing.localeCompare(b.missing) || a.value.localeCompare(b.value),
  );

  return { incoming, outgoing, byType, unresolved };
}

/** Serialize the four index files; key order inside each file is handled by toYaml. */
export function serializeIndexes(spec: LoadedSpec): Record<IndexFileName, string> {
  const indexes = buildIndexes(spec);
  return {
    "by-type.yaml": toYaml({ "by-type": indexes.byType }),
    "incoming.yaml": toYaml({ incoming: indexes.incoming }),
    "outgoing.yaml": toYaml({ outgoing: indexes.outgoing }),
    "unresolved.yaml": toYaml({ unresolved: indexes.unresolved }),
  };
}

/** Write the four index files under <root>/indexes/; returns relative paths written. */
export function writeIndexes(spec: LoadedSpec): string[] {
  const dir = path.join(spec.root, "indexes");
  fs.mkdirSync(dir, { recursive: true });
  const serialized = serializeIndexes(spec);
  const written: string[] = [];
  for (const name of INDEX_FILES) {
    fs.writeFileSync(path.join(dir, name), serialized[name]);
    written.push(path.join(path.relative(process.cwd(), dir) || ".", name).split(path.sep).join("/"));
  }
  return written;
}
