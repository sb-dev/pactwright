import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import { toDateString } from "../gate.ts";
import { intentsForContract, liveProposingContracts, liveSourcesByEdge } from "./coverage_traversal.ts";
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
 * The status of the intent THIS contract was selected for must then agree with
 * coverage in BOTH directions: `addressed`-but-uncovered and covered-but-not-
 * `addressed` are each findings. An intent that a DIFFERENT selected contract won
 * (this contract is only a losing candidate that still `proposes` it) is not judged
 * here. The d4f2 single-lane coherence special case is subsumed; d4f2 itself has no
 * `selects` edge, so it is structurally out of this rule's reach (its transition is
 * a separate, decision-recorded manual edit — by design, not by this rule).
 *
 * Integration-count invariants: a single-/zero-brief contract completes via its lone
 * final evidence and must carry NO integration; a multi-brief contract is covered by
 * EXACTLY one final integration (a second — e.g. a botched /integrate retry — is a
 * finding). Superseded integrations and a superseded selected contract are filtered
 * out (live-set semantics, CLAUDE.md rule 3). Endpoints that do not resolve are
 * defensively skipped.
 */
export default function coverageCoherence(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const findings: Finding[] = [];

  const cut = toDateString(spec.coverageCoherenceFrom);
  if (cut === undefined) return findings; // fail-open: no cutoff → gate off

  const byId = nodesById(spec);

  // Node ids retired via a `supersedes` edge (newer→older). The older TARGET keeps
  // its terminal status (the `integration` enum has no `superseded` value), so it
  // must be filtered out of the live integration set explicitly — mirroring
  // liveSourcesByEdge's superseded-source skip (CLAUDE.md rule 3).
  const supersededTargets = new Set(
    spec.edges
      .filter((e) => asString(e["type"]) === "supersedes")
      .map((e) => asString(e["target"]))
      .filter((t): t is string => t !== undefined),
  );

  // Contract ids some `decision` has selected (targets of `selects` edges); used to
  // scope coherence to the intent THIS contract actually won (F3).
  const selectedContracts = new Set(
    spec.edges
      .filter((e) => asString(e["type"]) === "selects")
      .map((e) => asString(e["target"]))
      .filter((t): t is string => t !== undefined),
  );

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
    if (asString(contract.data["status"]) === "superseded") return; // superseded selected contract: out of scope (F4)

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
      if (supersededTargets.has(intId)) continue; // superseded integration: not live (F1)
      const covered = briefsCoveredByIntegration(intId);
      if (![...covered].some((b) => liveBriefs.has(b))) continue; // not tied to this contract
      integrationsForContract.set(intId, { status: asString(node.data["status"]), briefs: covered });
    }

    // Integration-count invariants: a single-/zero-brief contract completes via its
    // lone final evidence and must carry NO integration (F5); a multi-brief contract
    // may carry at most one.
    if (liveBriefs.size <= 1 && integrationsForContract.size >= 1) {
      findings.push({
        rule: ruleId,
        kind: "coverage_coherence",
        subject: contractId,
        detail: `contract ${contractId} has ${liveBriefs.size} live brief(s) but carries ${integrationsForContract.size} integration node(s) [${[...integrationsForContract.keys()].sort().join(", ")}] (a single-/zero-brief contract completes via its lone final evidence and must carry none)`,
      });
    } else if (integrationsForContract.size > 1) {
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
        ([, v]) =>
          v.status === "final" &&
          v.briefs.size === liveBriefs.size &&
          [...liveBriefs].every((b) => v.briefs.has(b)),
      );
      covered = fullFinal.length === 1;
      reason = covered
        ? `final integration ${fullFinal[0][0]} integrates final evidence for all ${liveBriefs.size} live briefs`
        : `${liveBriefs.size} live briefs require exactly one final integration covering every lane (found ${fullFinal.length})`;
    }

    // Bidirectional coherence with the intent THIS contract was selected for.
    for (const intentId of intentsForContract(spec, contractId)) {
      const intent = byId.get(intentId);
      if (intent === undefined) continue;
      // Scope to the won intent: if another SELECTED contract also proposes this
      // intent, its market was won elsewhere — don't judge it against this contract
      // (F3). A losing candidate keeps its live `proposes` edge (CLAUDE.md rule 3).
      const wonElsewhere = [...liveProposingContracts(spec, byId, intentId)].some(
        (pc) => pc !== contractId && selectedContracts.has(pc),
      );
      if (wonElsewhere) continue;
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
