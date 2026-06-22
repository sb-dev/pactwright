import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import { toDateString } from "../gate.ts";
import { intentsForContract, liveSourcesByEdge } from "./coverage_traversal.ts";
import type { Finding } from "../validator.ts";

/**
 * Coherence of a SELECTED contract's coverage with its intent's status, plus the
 * lane/integration completeness rule. Scoped to `selects`-edged intents whose
 * SELECTED CONTRACT was created on/after `coverage_coherence_from` (normalized
 * through `toDateString`; absent/malformed cutoff or `created` → fail-open skip,
 * the gate off — so a green graph cannot be re-reddened by a malformed cutoff).
 *
 * Coverage of the selected contract (live brief set = non-`superseded` briefs that
 * `decomposes` it):
 *  - single live brief: covered iff EXACTLY ONE `final` evidence `evidences` it (a
 *    `draft` evidence never counts);
 *  - >=2 live briefs: covered iff EXACTLY ONE `final` `integration` node
 *    `integrates` a `final` evidence for EVERY live brief. A multi-brief contract
 *    treated covered WITHOUT that final integration is a finding — the headline
 *    acceptance (a two-lane change cannot mark its intent addressed until a final
 *    integration integrates final evidence for both lanes).
 *
 * The intent's `status` must then agree with coverage in BOTH directions:
 * `addressed`-but-uncovered and covered-but-not-`addressed` are each findings. The
 * d4f2 single-lane coherence special case is subsumed here; d4f2 itself has no
 * `selects` edge, so it is structurally out of this rule's reach (its transition is
 * a separate, decision-recorded manual edit — by design, not by this rule).
 *
 * Invariant: at most one `integration` may cover a contract's briefs; a second
 * (e.g. a botched /integrate retry) is a finding, so a forked coverage artifact
 * surfaces red rather than silently. Endpoints that do not resolve are defensively
 * skipped.
 */
export default function coverageCoherence(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const findings: Finding[] = [];

  const cut = toDateString(spec.coverageCoherenceFrom);
  if (cut === undefined) return findings; // fail-open: no cutoff → gate off

  const byId = nodesById(spec);

  // Final evidence ids that `evidences` the given brief.
  const finalEvidenceForBrief = (briefId: string): Set<string> => {
    const out = new Set<string>();
    for (const e of spec.edges) {
      if (asString(e["type"]) !== "evidences") continue;
      if (asString(e["target"]) !== briefId) continue;
      const evId = asString(e["source"]);
      if (evId === undefined) continue;
      const ev = byId.get(evId);
      if (ev === undefined) continue; // unresolved
      if (asString(ev.data["status"]) !== "final") continue;
      out.add(evId);
    }
    return out;
  };

  // Brief ids whose FINAL evidence an integration node `integrates`
  // (integration -> integrates -> evidence -> evidences -> brief).
  const briefsCoveredByIntegration = (integrationId: string): Set<string> => {
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
  };

  spec.edges.forEach((edge) => {
    if (asString(edge["type"]) !== "selects") return;
    const contractId = asString(edge["target"]);
    if (contractId === undefined) return;
    const contract = byId.get(contractId);
    if (contract === undefined) return; // unresolved: references_resolve owns it

    // Grandfather on the SELECTED CONTRACT's `created`.
    const c = toDateString(contract.data["created"]);
    if (c === undefined) return; // fail-open
    if (c < cut) return; // predates the cutoff: grandfathered

    // Live (non-superseded) briefs decomposing the contract.
    const liveBriefs = liveSourcesByEdge(spec, byId, "decomposes", contractId);

    // Integration nodes covering at least one of this contract's live briefs.
    const integrationsForContract = new Map<string, { status: string | undefined; briefs: Set<string> }>();
    for (const node of spec.nodes) {
      if (asString(node.data["type"]) !== "integration") continue;
      const intId = asString(node.data["id"]);
      if (intId === undefined) continue;
      const covered = briefsCoveredByIntegration(intId);
      if (![...covered].some((b) => liveBriefs.has(b))) continue; // not tied to this contract
      integrationsForContract.set(intId, { status: asString(node.data["status"]), briefs: covered });
    }

    // One-integration-per-contract invariant.
    if (integrationsForContract.size > 1) {
      findings.push({
        rule: ruleId,
        kind: "coverage_coherence",
        subject: contractId,
        detail: `contract ${contractId} is covered by ${integrationsForContract.size} integration nodes [${[...integrationsForContract.keys()].sort().join(", ")}] (at most one is allowed)`,
      });
    }

    // Coverage of the contract.
    let covered: boolean;
    let reason: string;
    if (liveBriefs.size === 0) {
      covered = false;
      reason = "has no live brief decomposing it";
    } else if (liveBriefs.size === 1) {
      const [briefId] = [...liveBriefs];
      const finals = finalEvidenceForBrief(briefId);
      covered = finals.size === 1;
      reason = covered
        ? `single brief ${briefId} has one final evidence`
        : `single brief ${briefId} has ${finals.size} final evidence (exactly one required)`;
    } else {
      const fullFinal = [...integrationsForContract.entries()].filter(
        ([, v]) => v.status === "final" && [...liveBriefs].every((b) => v.briefs.has(b)),
      );
      covered = fullFinal.length === 1;
      reason = covered
        ? `final integration ${fullFinal[0][0]} integrates final evidence for all ${liveBriefs.size} live briefs`
        : `${liveBriefs.size} live briefs require exactly one final integration covering every lane (found ${fullFinal.length})`;
    }

    // Bidirectional coherence with each proposed intent's status.
    for (const intentId of intentsForContract(spec, contractId)) {
      const intent = byId.get(intentId);
      if (intent === undefined) continue;
      const addressed = asString(intent.data["status"]) === "addressed";
      if (addressed && !covered) {
        findings.push({
          rule: ruleId,
          kind: "coverage_coherence",
          subject: intentId,
          detail: `intent ${intentId} is addressed but its selected contract ${contractId} is not covered: ${reason}`,
        });
      } else if (!addressed && covered) {
        findings.push({
          rule: ruleId,
          kind: "coverage_coherence",
          subject: intentId,
          detail: `intent ${intentId} is not addressed but its selected contract ${contractId} is covered (${reason})`,
        });
      }
    }
  });

  return findings;
}
