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
  excludeStatus: string | readonly string[] | undefined = "superseded",
): Set<string> {
  const excluded =
    excludeStatus === undefined
      ? undefined
      : new Set(typeof excludeStatus === "string" ? [excludeStatus] : excludeStatus);
  const live = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== edgeType) continue;
    if (asString(edge["target"]) !== targetId) continue;
    const sourceId = asString(edge["source"]);
    if (sourceId === undefined) continue;
    const source = byId.get(sourceId);
    if (source === undefined) continue; // unresolved: references_resolve owns it
    if (excluded !== undefined) {
      const status = asString(source.data["status"]);
      if (status !== undefined && excluded.has(status)) continue;
    }
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

/**
 * Patch-market traversal primitives — the single source of truth for "who competes
 * for a brief" and "is its market resolved", shared by the diff-aware patch gate
 * (`tools/patch_gate.ts`) and the `selected_patch_comparison` validation rule so the
 * two cannot drift apart (the panel's two-places-drift concern).
 */

/** All distinct patch ids that `competes-for` the brief, STATUS-BLIND. The
 * historical competitor set: it includes a `selected` winner and `superseded`
 * losers, both of which legitimately competed. Unlike a contract proposal market,
 * patch losers go `superseded` (not `rejected`) at selection, so a superseded-
 * excluding walk would wrongly drop the very losers a comparison had to weigh. */
export function competingPatches(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): Set<string> {
  // An EMPTY exclude set, never `undefined`: `liveSourcesByEdge`'s `excludeStatus`
  // has a `"superseded"` DEFAULT, and passing `undefined` would trigger it — here
  // we want a genuinely status-blind walk that keeps superseded losers.
  return liveSourcesByEdge(spec, byId, "competes-for", briefId, []);
}

/** LIVE (candidate) competitors of the brief: excludes a `selected` winner AND
 * `superseded` losers. The open market — what the patch gate counts to decide a
 * brief still has a market to resolve. */
export function liveCompetitors(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): Set<string> {
  return liveSourcesByEdge(spec, byId, "competes-for", briefId, ["superseded", "selected"]);
}

/** Distinct competing patches of the brief that a resolved `comparison` node
 * `compares` — the durable-record coverage set. */
export function comparedCompetitors(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): Set<string> {
  const competing = competingPatches(spec, byId, briefId);
  const covered = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "compares") continue;
    const sourceId = asString(edge["source"]);
    const source = sourceId !== undefined ? byId.get(sourceId) : undefined;
    if (source === undefined || asString(source.data["type"]) !== "comparison") continue; // unresolved/wrong source
    const targetId = asString(edge["target"]);
    if (targetId !== undefined && competing.has(targetId)) covered.add(targetId);
  }
  return covered;
}

/** A brief's patch market is RESOLVED iff a comparison covers >=2 of its competing
 * patches AND some `decision` has `selects`-ed one of those competitors. The shared
 * verdict the patch gate uses to let a winner's merge through. */
export function patchMarketResolved(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): boolean {
  if (comparedCompetitors(spec, byId, briefId).size < 2) return false;
  const competing = competingPatches(spec, byId, briefId);
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "selects") continue;
    const target = asString(edge["target"]);
    if (target !== undefined && competing.has(target)) return true;
  }
  return false;
}
