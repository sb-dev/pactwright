import { createHash } from "node:crypto";
import { HASH_PATTERN } from "../config/lock.js";
import type { Edge } from "./edges.js";
import type { GraphNode } from "./nodes.js";

/**
 * An extension-owned canonical graph record (Assets, Publications,
 * Deployments, Observations…). Extensions hand these to `graphRevision`; the
 * core never interprets `record`, it only canonicalises and hashes it.
 */
export interface CanonicalRecord {
  /** Extension id that owns the record. */
  readonly owner: string;
  /** Record kind within that extension. */
  readonly kind: string;
  readonly id: string;
  /** JSON-like data: records, arrays, strings, numbers, booleans, null. */
  readonly record: unknown;
}

/** Everything that contributes to the Project Graph revision (Delivery Graph §5). */
export interface RevisionInput {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly Edge[];
  /** Extension canonical records; absent means none. */
  readonly records?: readonly CanonicalRecord[];
}

/** Bump only when the canonical payload shape changes; every revision changes with it. */
export const REVISION_VERSION = 1;

/** A revision is `sha256:<64 hex>`, the same shape as lock-file hashes. */
export const REVISION_PATTERN = HASH_PATTERN;

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * JSON with object keys sorted recursively, `undefined` members dropped and
 * no whitespace, so equal values always serialise to equal bytes.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const members = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort(compare)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
  return `{${members.join(",")}}`;
}

/**
 * The exact bytes hashed by `graphRevision`, exposed for tests and tooling.
 *
 * Canonicalisation (Delivery Graph §5, "canonicalise ordering before hashing"):
 * nodes reduce to `{ id, frontmatter, body }` sorted by id — the file path is
 * where the record sits, not graph state, and the common fields already live
 * in the frontmatter; bodies use LF line endings; edges sort by
 * (source, type, target); extension records sort by (owner, kind, id).
 * Config, lock, lifecycle, lineage, reports, adapter output and any other
 * derived or operational state never enter the payload.
 */
export function canonicalGraphPayload(input: RevisionInput): string {
  const nodes = [...input.nodes]
    .sort((a, b) => compare(a.id, b.id))
    .map((node) => ({
      id: node.id,
      frontmatter: node.frontmatter,
      body: node.body.replace(/\r\n/g, "\n"),
    }));
  const edges = [...input.edges]
    .sort(
      (a, b) =>
        compare(a.source, b.source) || compare(a.type, b.type) || compare(a.target, b.target),
    )
    .map((edge) => ({ source: edge.source, type: edge.type, target: edge.target }));
  const records = [...(input.records ?? [])]
    .sort((a, b) => compare(a.owner, b.owner) || compare(a.kind, b.kind) || compare(a.id, b.id))
    .map((item) => ({ owner: item.owner, kind: item.kind, id: item.id, record: item.record }));
  return canonicalJson({ version: REVISION_VERSION, nodes, edges, records });
}

/**
 * The deterministic Project Graph revision: sha256 over the canonical
 * payload. The same canonical graph state always yields the same revision;
 * nothing outside it can move it.
 */
export function graphRevision(input: RevisionInput): string {
  const digest = createHash("sha256").update(canonicalGraphPayload(input), "utf8").digest("hex");
  return `sha256:${digest}`;
}
