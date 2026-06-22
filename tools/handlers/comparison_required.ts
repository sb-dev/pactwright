import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import { toDateString } from "../gate.ts";
import type { Finding } from "../validator.ts";
import { intentsForContract, liveProposingContracts } from "./coverage_traversal.ts";

/**
 * A selected (`selects`-edged) intent of `class >= 2` whose SELECTED CONTRACT
 * was created on/after `comparison_required_from` must carry a durable
 * comparison: `compares` edges that COVER every live (non-`superseded`)
 * candidate of that intent, and number >= 2 distinct live covered candidates.
 *
 * Grandfathering keys on the SELECTED CONTRACT's `created` (not the intent's):
 * a contract created strictly before the cutoff predates the comparison
 * mechanism and is skipped. The cutoff is read from the loader
 * (`spec.comparisonRequiredFrom`); both it and the contract date are normalized
 * through `toDateString`, so an absent/malformed cutoff or `created` disables
 * the check by skipping (fail-open) rather than mis-grandfathering.
 *
 * Coverage is a SET check, NOT class_market_quorum's count: a `compares` edge to
 * a `superseded` or duplicate target is tolerated but does not count toward
 * coverage, so two edges to the same/superseded candidate cannot satisfy the
 * >=2 bar. A target counts only if it both `proposes` the intent (tying the
 * comparison to this market) and is live. Endpoints that do not resolve are
 * defensively skipped — `edges-references-resolve` reports them but does not
 * remove them, so rule order alone is not enough.
 */
export default function comparisonRequired(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const findings: Finding[] = [];

  // Cutoff normalized once; absent/malformed → gate disabled (fail-open).
  const cut = toDateString(spec.comparisonRequiredFrom);
  if (cut === undefined) return findings;

  // Distinct contract ids covered by a `compares` edge that also `proposes` the
  // intent and is live — the qualifying covered set for this market.
  const coveredSet = (intentId: string): Set<string> => {
    const covered = new Set<string>();
    for (const edge of spec.edges) {
      if (asString(edge["type"]) !== "compares") continue;
      const sourceId = asString(edge["source"]);
      if (sourceId === undefined || byId.get(sourceId) === undefined) continue; // unresolved comparison
      const targetId = asString(edge["target"]);
      if (targetId === undefined) continue;
      const target = byId.get(targetId);
      if (target === undefined) continue; // unresolved contract
      if (asString(target.data["status"]) === "superseded") continue; // superseded does not count
      const proposesIntent = spec.edges.some(
        (e) =>
          asString(e["type"]) === "proposes" &&
          asString(e["source"]) === targetId &&
          asString(e["target"]) === intentId,
      );
      if (!proposesIntent) continue;
      covered.add(targetId);
    }
    return covered;
  };

  spec.edges.forEach((edge) => {
    if (asString(edge["type"]) !== "selects") return;
    const contractId = asString(edge["target"]);
    if (contractId === undefined) return;
    const contract = byId.get(contractId);
    if (contract === undefined) return; // unresolved: references_resolve owns it

    // Grandfather on the SELECTED CONTRACT's `created` (not the intent's).
    const c = toDateString(contract.data["created"]);
    if (c === undefined) return; // absent/unparseable created: fail-open skip
    if (c < cut) return; // selected contract predates the cutoff: grandfathered

    const intentIds = intentsForContract(spec, contractId);

    for (const intentId of intentIds) {
      const intent = byId.get(intentId);
      if (intent === undefined) continue; // unresolved: skip
      const cls = intent.data["class"];
      if (typeof cls !== "number" || cls < 2) continue; // class < 2 needs no comparison

      const live = liveProposingContracts(spec, byId, intentId);
      const covered = coveredSet(intentId);
      const uncovered = [...live].filter((id) => !covered.has(id));

      if (uncovered.length > 0 || covered.size < 2) {
        const liveList = [...live].sort().join(", ") || "(none)";
        const coveredList = [...covered].sort().join(", ") || "(none)";
        findings.push({
          rule: ruleId,
          kind: "comparison_required",
          subject: intentId,
          detail:
            `intent ${intentId} (class ${cls}) has a post-cutoff selected contract ${contractId} ` +
            `(created ${c} >= ${cut}) but its comparison covers {${coveredList}} of live candidates ` +
            `{${liveList}} via ${covered.size} distinct compares edge(s) ` +
            `(every live candidate must be covered and >=2 required)`,
        });
      }
    }
  });

  return findings;
}
