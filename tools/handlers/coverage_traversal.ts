import { asString, type LoadedSpec, type NodeRecord } from "../loader.ts";

/**
 * Shared graph-traversal primitives for the coverage / quorum / comparison rules.
 * Every walk resolves endpoints through the caller's `byId` map and defensively
 * skips an edge whose endpoint does not resolve (`edges-references-resolve`
 * reports those but does not remove them, so rule order alone is not enough) or
 * whose source is `superseded` (CLAUDE.md rule 3 leaves a superseded node's edges
 * in place). Behaviour is identical to the inlined walks these replace.
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

/** Intent ids a contract `proposes` (the proposes-walk from a contract). */
export function intentsForContract(spec: LoadedSpec, contractId: string): string[] {
  return spec.edges
    .filter((e) => asString(e["type"]) === "proposes" && asString(e["source"]) === contractId)
    .map((e) => asString(e["target"]))
    .filter((id): id is string => id !== undefined);
}
