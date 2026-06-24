import { asString, type LoadedSpec, type NodeRecord } from "../loader.ts";

/**
 * Shared graph-traversal primitives for the coverage / quorum / comparison rules.
 * Every walk resolves endpoints through the caller's `byId` map and defensively
 * skips an edge whose endpoint does not resolve (`edges-references-resolve`
 * reports those but does not remove them, so rule order alone is not enough) or
 * whose source is `superseded` (CLAUDE.md rule 3 leaves a superseded node's edges
 * in place).
 *
 * These replace inlined walks in three rules. For `comparison_required` the
 * behaviour is preserved (its inlined walk was already Set-based). For
 * `class_market_quorum` there is ONE intentional tightening: the replaced walk
 * counted `proposes` EDGES (`count += 1`), whereas `liveSourcesByEdge` counts
 * DISTINCT live sources (a `Set`). They diverge only in the degenerate case of two
 * `proposes` edges from the same live contract — where distinct-source counting is
 * the correct realization of the work-class rule's "≥2 distinct candidate
 * contracts" requirement (CLAUDE.md), not a regression.
 */

/** Distinct, resolved, non-`excludeStatus` source ids of `edgeType` edges whose
 * `target` is `targetId`. With the default `excludeStatus: "superseded"`, this is
 * the "live sources" walk shared by `proposes` (candidate contracts of an intent)
 * and `decomposes` (briefs of a contract). */
export function liveSourcesByEdge(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  edgeType: string,
  targetId: string,
  excludeStatus: string | undefined = "superseded",
): Set<string> {
  const live = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== edgeType) continue;
    if (asString(edge["target"]) !== targetId) continue;
    const sourceId = asString(edge["source"]);
    if (sourceId === undefined) continue;
    const source = byId.get(sourceId);
    if (source === undefined) continue; // unresolved: references_resolve owns it
    if (excludeStatus !== undefined && asString(source.data["status"]) === excludeStatus) continue;
    live.add(sourceId);
  }
  return live;
}

/** Live (non-`superseded`) candidate contract ids that `proposes` the intent. */
export function liveProposingContracts(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  intentId: string,
): Set<string> {
  return liveSourcesByEdge(spec, byId, "proposes", intentId);
}

/** DISTINCT intent ids a contract `proposes` (the proposes-walk from a contract).
 * Deduped via a `Set` so duplicate `proposes` triples (only the edge `id` is unique
 * — no rule dedups the source/type/target triple) yield one intent, not duplicate
 * findings across the three consuming rules. Intents have no `superseded` status
 * (`nodes-status-in-enum`), so no source-status filter is needed here. */
export function intentsForContract(spec: LoadedSpec, contractId: string): string[] {
  const out = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== "proposes") continue;
    if (asString(e["source"]) !== contractId) continue;
    const target = asString(e["target"]);
    if (target !== undefined) out.add(target);
  }
  return [...out];
}
