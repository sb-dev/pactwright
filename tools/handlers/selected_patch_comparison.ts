import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";
import { briefsForPatch, comparedCompetitors, competingPatches, liveCompetitors } from "./coverage_traversal.ts";

/**
 * A `selects`-edged PATCH (the patch market's winner) must have a durable
 * comparison covering its lane: the brief it `competes-for` must carry a
 * `comparison` whose `compares` edges cover >=2 of the brief's competing patches,
 * with NO live (candidate) competitor left uncompared. The competing set is
 * STATUS-BLIND (see coverage_traversal.competingPatches) — unlike a contract
 * proposal market, patch losers go `superseded` at selection, so a superseded-
 * excluding walk would wrongly drop the very losers a comparison had to weigh.
 *
 * Contract selections (`selects → contract`) are out of scope here — they are the
 * `comparison_required` rule's job; this rule skips any `selects` target whose node
 * type is not `patch`. Endpoints that do not resolve are defensively skipped.
 */
export default function selectedPatchComparison(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const findings: Finding[] = [];

  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "selects") continue;
    const patchId = asString(edge["target"]);
    if (patchId === undefined) continue;
    const patch = byId.get(patchId);
    if (patch === undefined) continue; // unresolved: references_resolve owns it
    if (asString(patch.data["type"]) !== "patch") continue; // contract selection: comparison_required's job

    const briefIds = briefsForPatch(spec, byId, patchId);

    if (briefIds.size === 0) {
      findings.push({
        rule: ruleId,
        kind: "selected_patch_comparison",
        subject: patchId,
        detail: `selected patch ${patchId} competes-for no resolvable brief`,
      });
      continue;
    }

    for (const briefId of briefIds) {
      const competing = competingPatches(spec, byId, briefId);
      const covered = comparedCompetitors(spec, byId, briefId);
      const uncoveredLive = [...liveCompetitors(spec, byId, briefId)].filter((p) => !covered.has(p)).sort();
      if (covered.size < 2 || uncoveredLive.length > 0) {
        const competingList = [...competing].sort().join(", ") || "(none)";
        const coveredList = [...covered].sort().join(", ") || "(none)";
        // Name the live candidate(s) left uncovered so the message identifies WHICH
        // patch failed coverage, not merely that some did (the full competing set is
        // also listed, but that does not single out the offender).
        const uncoveredClause =
          uncoveredLive.length > 0 ? `, leaving live candidate(s) {${uncoveredLive.join(", ")}} uncovered` : "";
        findings.push({
          rule: ruleId,
          kind: "selected_patch_comparison",
          subject: briefId,
          detail:
            `brief ${briefId} has a selected patch ${patchId} but its comparison covers ` +
            `{${coveredList}} of competing patches {${competingList}} via compares edges${uncoveredClause} ` +
            `(a comparison must cover >=2 competitors and leave no live candidate uncovered)`,
        });
      }
    }
  }

  return findings;
}
