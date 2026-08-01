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

/** Live (non-`superseded`) brief ids that `decomposes` the contract — the live-lane
 * set. Named alias for the `decomposes` case of `liveSourcesByEdge`, mirroring
 * `liveProposingContracts`, so the resolver and the `coverage-coherence` rule cannot
 * count lanes differently (A11). */
export function liveBriefsForContract(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  contractId: string,
): Set<string> {
  return liveSourcesByEdge(spec, byId, "decomposes", contractId);
}

/** FINAL evidence ids that `evidences` the brief. A `draft` evidence never counts.
 *
 * Deliberately a STATUS-BLIND walk plus an explicit `status === "final"` INCLUSION
 * filter, not an exclusion. `liveSourcesByEdge`'s `excludeStatus` skips a node only
 * when its status is defined AND excluded, so an exclusion-based spelling
 * (`["draft"]`) would wrongly ADMIT a status-less evidence node. The empty exclude
 * list is required, never `undefined` — `undefined` triggers the `"superseded"`
 * default (see `competingPatches`). Lifted from `coverage_coherence.ts` (A11) so the
 * conveyor resolver and that rule share one definition of "covered". */
export function finalEvidenceForBrief(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): Set<string> {
  const out = new Set<string>();
  for (const evId of liveSourcesByEdge(spec, byId, "evidences", briefId, [])) {
    const ev = byId.get(evId);
    if (ev === undefined) continue; // unresolved: references_resolve owns it
    if (asString(ev.data["status"]) !== "final") continue;
    out.add(evId);
  }
  return out;
}

/** Brief ids whose FINAL evidence an integration node `integrates` — the two-hop walk
 * integration —`integrates`→ evidence —`evidences`→ brief, with a `final` filter on
 * the MIDDLE node. Not expressible as a single `liveSourcesByEdge` call, which is why
 * A11 lifts it bodily rather than composing it. Lifted from `coverage_coherence.ts`. */
export function briefsCoveredByIntegration(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  integrationId: string,
): Set<string> {
  const briefs = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== "integrates") continue;
    if (asString(e["source"]) !== integrationId) continue;
    const evId = asString(e["target"]);
    if (evId === undefined) continue;
    const ev = byId.get(evId);
    if (ev === undefined || asString(ev.data["status"]) !== "final") continue;
    for (const ee of spec.edges) {
      if (asString(ee["type"]) !== "evidences") continue;
      if (asString(ee["source"]) !== evId) continue;
      const briefId = asString(ee["target"]);
      if (briefId !== undefined) briefs.add(briefId);
    }
  }
  return briefs;
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

/** Contract ids some `decision` has `selects`-ed. THE authoritative spelling of
 * "selected" for every rule that needs one (A8): both endpoints resolve through
 * `byId` and both are type-checked, so a `selects` edge whose source id does not
 * resolve confers nothing here. That edge is already an `edges-references-resolve`
 * finding, and rule order alone must not decide backing — `runValidation` never
 * short-circuits, so an earlier rule REPORTS an unresolved endpoint without
 * removing it.
 *
 * Two spellings of this walk were available and they are NOT equivalent: a raw
 * `selects`-target scan (the function-local const this replaces) and this resolving
 * walk disagree on an edge with a typo'd decision id — raw says "selected", resolving
 * says "not selected". Every "no double-report" acceptance criterion rests on
 * `unbacked-addressed` and `coverage-coherence` meaning the SAME thing by selected,
 * so the choice is made once, here, and both rules call it.
 *
 * The target type-check also filters `selects → patch`, which `coverage_coherence.ts`
 * handles after the fact at its own walk. STATUS-BLIND on purpose: "was it selected"
 * is a historical fact; liveness is the caller's concern. */
export function selectedContracts(spec: LoadedSpec, byId: Map<string, NodeRecord>): Set<string> {
  const out = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "selects") continue;
    const sourceId = asString(edge["source"]);
    if (sourceId === undefined) continue;
    const source = byId.get(sourceId);
    if (source === undefined) continue; // unresolved: references_resolve owns it
    if (asString(source.data["type"]) !== "decision") continue;
    const targetId = asString(edge["target"]);
    if (targetId === undefined) continue;
    const target = byId.get(targetId);
    if (target === undefined) continue; // unresolved: references_resolve owns it
    if (asString(target.data["type"]) !== "contract") continue; // selects → patch
    out.add(targetId);
  }
  return out;
}

/** Live contract ids that BACK the intent: selected, live, `proposes` it — AND
 * marketing NOTHING ELSE. The singleton clause is the whole of A6 and is why this
 * is one named function rather than an inlined intersection.
 *
 * Why singleton: a `selects` edge names a CONTRACT, not an intent, so it can only be
 * read as endorsing an intent when the contract markets exactly one. Without the
 * clause, backing is satisfied by any live contract that both proposes the intent and
 * is a `selects` target ANYWHERE in the graph — and `proposes` carries no cardinality
 * constraint (`specs/schema/edge-types.yaml`), while `specs/graph/edges.yaml` is
 * reached by no `.github/CODEOWNERS` rule and no `sensitive_paths` glob. One appended
 * line from any already-selected contract would then back any intent, which is cheaper
 * than the `subsumes` escape hatch (that needs a `decision-*` node, a CODEOWNERS-covered
 * path). With the clause, that same appended line costs the laundering contract its OWN
 * previously-green intent: the market becomes ambiguous and BOTH intents red.
 *
 * `intentsForContract` dedups via a `Set`, so duplicate `proposes` triples do not break
 * singleton-ness. `liveProposingContracts` already excludes `superseded` sources.
 *
 * Honest bound: the remaining grant path is a NEW `specs/nodes/contract-*.md` proposing
 * only the target intent plus a `selects` edge. `.github/CODEOWNERS` covers the contract
 * file; the edge half is unreviewed. `class-market-quorum` raises the class-2+ case to
 * two reviewed contract files. Nothing counts or caps how often this is done. */
export function backingContracts(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  intentId: string,
): Set<string> {
  const selected = selectedContracts(spec, byId);
  const backing = new Set<string>();
  for (const contractId of liveProposingContracts(spec, byId, intentId)) {
    if (!selected.has(contractId)) continue;
    const markets = intentsForContract(spec, contractId);
    if (markets.length !== 1 || markets[0] !== intentId) continue; // ambiguous market: backs neither
    backing.add(contractId);
  }
  return backing;
}

/**
 * Patch-market traversal primitives — the single source of truth for "who competes
 * for a brief" and "is its market resolved", shared by the diff-aware patch gate
 * (`tools/patch_gate.ts`) and the `selected_patch_comparison` validation rule so the
 * two cannot drift apart (the panel's two-places-drift concern).
 */

/** Distinct, RESOLVABLE brief ids that the patch `competes-for` — the inverse of the
 * competes-for walk (patch→brief, not brief→patch). The `byId.get(t) !== undefined`
 * filter drops unresolvable targets (`edges-references-resolve` owns reporting those).
 * Lifted here so the gate and the `selected_patch_comparison` rule share ONE patch→brief
 * resolution instead of copying the walk in two places. (Cannot reuse
 * `liveSourcesByEdge`, which matches by `target`; this matches by `source`.) */
export function briefsForPatch(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  patchId: string,
): Set<string> {
  const briefIds = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "competes-for") continue;
    if (asString(edge["source"]) !== patchId) continue;
    const t = asString(edge["target"]);
    if (t !== undefined && byId.get(t) !== undefined) briefIds.add(t);
  }
  return briefIds;
}

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
 * patches, NO live (candidate) competitor is left uncovered, AND some `decision` has
 * `selects`-ed one of those competitors. This is the SAME verdict the
 * `selected_patch_comparison` rule reds on (covered >= 2 AND no uncovered live) — so
 * the diff-aware patch gate cannot pass a graph that rule would red. The `decision`
 * source-type guard mirrors `comparedCompetitors`'s `comparison` guard and makes this
 * function conform to its own contract ("some DECISION has selects-ed one"); a
 * non-decision `selects` source is already a `edges-endpoint-types` validate failure. */
export function patchMarketResolved(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefId: string,
): boolean {
  const covered = comparedCompetitors(spec, byId, briefId);
  if (covered.size < 2) return false;
  // No live (candidate) competitor may be left uncovered — mirror the rule exactly.
  for (const live of liveCompetitors(spec, byId, briefId)) {
    if (!covered.has(live)) return false;
  }
  const competing = competingPatches(spec, byId, briefId);
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "selects") continue;
    const sourceId = asString(edge["source"]);
    const source = sourceId !== undefined ? byId.get(sourceId) : undefined;
    if (source === undefined || asString(source.data["type"]) !== "decision") continue;
    const target = asString(edge["target"]);
    if (target !== undefined && competing.has(target)) return true;
  }
  return false;
}
