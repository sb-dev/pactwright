import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";
import {
  backingContracts,
  briefsCoveredByIntegration,
  finalEvidenceForBrief,
  intentsForContract,
  liveBriefsForContract,
  liveProposingContracts,
  selectedContracts,
} from "./coverage_traversal.ts";

/**
 * An intent whose `status` is `addressed` must be BACKED: some live contract markets
 * it and nothing else, and a `decision` selected that contract. The iteration is
 * INVERTED relative to `coverage-coherence` — this rule walks `spec.nodes` filtered to
 * addressed intents, not `spec.edges` filtered to `selects`. That inversion is the whole
 * mechanism: `coverage_coherence` opens with a `selects` scan, so an intent that NO
 * `selects` edge reaches is never visited and an unbacked flip is structurally invisible
 * to it. This rule reaches such an intent on the first pass.
 *
 * The standing exception is expressed in the graph, not in prose: a
 * `decision —subsumes→ intent` edge backs the intent when that same decision `selects` a
 * contract that is COVERED. The escape is anchored — subsumption borrows the coverage of
 * delivered work and cannot be conjured from a decision that delivered nothing.
 *
 * HONEST BOUND. Green asserts decision-backed PROVENANCE for every addressed intent. It
 * does NOT assert the work is covered — that stays `coverage-coherence`'s verdict, which
 * grandfathers on the selected contract's `created` against `coverage_coherence_from`. An
 * addressed intent whose selected contract predates that cutoff is checked for coverage by
 * NEITHER rule.
 *
 * Endpoints that do not resolve are defensively skipped rather than dereferenced.
 * `runValidation` runs every rule unconditionally and never short-circuits, and it wraps no
 * handler in a try/catch — so a throw here would not produce one finding, it would abort
 * `spec:validate` and lose every other rule's findings. Rule order buys output sequencing
 * only, never a precondition.
 */
export default function unbackedAddressed(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const findings: Finding[] = [];

  // Is the contract COVERED, per the same walks `coverage-coherence` uses? Single live
  // brief: exactly one final evidence. Multi-brief: one final integration covering every
  // live brief. Anchors the `subsumes` escape so it cannot borrow coverage that is absent.
  const contractCovered = (contractId: string): boolean => {
    const liveBriefs = liveBriefsForContract(spec, byId, contractId);
    if (liveBriefs.size === 0) return false;
    if (liveBriefs.size === 1) {
      const [briefId] = [...liveBriefs];
      return finalEvidenceForBrief(spec, byId, briefId).size === 1;
    }
    const supersededTargets = new Set(
      spec.edges
        .filter((e) => asString(e["type"]) === "supersedes")
        .map((e) => asString(e["target"]))
        .filter((t): t is string => t !== undefined),
    );
    let full = 0;
    for (const node of spec.nodes) {
      if (asString(node.data["type"]) !== "integration") continue;
      const intId = asString(node.data["id"]);
      if (intId === undefined) continue;
      if (supersededTargets.has(intId)) continue; // superseded integration: not live
      if (asString(node.data["status"]) !== "final") continue;
      const covered = briefsCoveredByIntegration(spec, byId, intId);
      if (covered.size !== liveBriefs.size) continue;
      if (![...liveBriefs].every((b) => covered.has(b))) continue;
      full += 1;
    }
    return full === 1;
  };

  // The anchored `subsumes` escape: a decision that subsumes this intent AND selected a
  // covered contract. Returns the anchoring decision id, or undefined with the reason the
  // near-miss failed, so branch 3 can name what actually broke.
  const subsumption = (intentId: string): { decisionId: string; anchored: boolean } | undefined => {
    let nearMiss: { decisionId: string; anchored: boolean } | undefined;
    for (const edge of spec.edges) {
      if (asString(edge["type"]) !== "subsumes") continue;
      if (asString(edge["target"]) !== intentId) continue;
      const decisionId = asString(edge["source"]);
      if (decisionId === undefined) continue;
      const decision = byId.get(decisionId);
      if (decision === undefined) continue; // unresolved: references_resolve owns it
      if (asString(decision.data["type"]) !== "decision") continue;
      // Anchored iff this decision selects at least one live, covered contract.
      let holds = false;
      for (const e of spec.edges) {
        if (asString(e["type"]) !== "selects") continue;
        if (asString(e["source"]) !== decisionId) continue;
        const contractId = asString(e["target"]);
        if (contractId === undefined) continue;
        const contract = byId.get(contractId);
        if (contract === undefined) continue; // unresolved: references_resolve owns it
        if (asString(contract.data["type"]) !== "contract") continue; // selects → patch
        if (asString(contract.data["status"]) === "superseded") continue;
        if (contractCovered(contractId)) {
          holds = true;
          break;
        }
      }
      if (holds) return { decisionId, anchored: true };
      nearMiss = { decisionId, anchored: false };
    }
    return nearMiss;
  };

  for (const record of spec.nodes) {
    if (asString(record.data["type"]) !== "intent") continue;
    if (asString(record.data["status"]) !== "addressed") continue;
    const intentId = asString(record.data["id"]);
    if (intentId === undefined) continue; // nodes-required-fields owns a missing id

    if (backingContracts(spec, byId, intentId).size > 0) continue;

    const sub = subsumption(intentId);
    if (sub !== undefined && sub.anchored) continue;

    // Branch 3 — a `subsumes` edge exists but its anchor no longer holds. Named first
    // because it is the most specific diagnosis available.
    if (sub !== undefined) {
      findings.push({
        rule: ruleId,
        kind: "unbacked_addressed",
        subject: intentId,
        detail:
          `intent ${intentId} is addressed and ${sub.decisionId} subsumes it, but that decision ` +
          `selects no live contract that is covered, so the subsumption is unanchored: revert ` +
          `${intentId} to \`open\`, or restore coverage of the contract ${sub.decisionId} selected ` +
          `(a subsumption borrows the coverage of delivered work and cannot outlive it)`,
      });
      continue;
    }

    // Branches 1 and 2 turn on WHY the backing set is empty: no selected proposer at all,
    // or selected proposers that also market other intents (the ambiguous market).
    const live = liveProposingContracts(spec, byId, intentId);
    const selected = selectedContracts(spec, byId);
    const ambiguous = [...live].filter((c) => selected.has(c)).sort();

    if (ambiguous.length > 0) {
      const others = new Set<string>();
      for (const contractId of ambiguous) {
        for (const other of intentsForContract(spec, contractId)) {
          if (other !== intentId) others.add(other);
        }
      }
      findings.push({
        rule: ruleId,
        kind: "unbacked_addressed",
        subject: intentId,
        detail:
          `intent ${intentId} is addressed and selected contract(s) {${ambiguous.join(", ")}} propose ` +
          `it, but each also markets {${[...others].sort().join(", ") || "(none)"}}, so no \`selects\` ` +
          `edge names ${intentId} unambiguously: revert ${intentId} to \`open\`, or give it its own ` +
          `contract (one \`proposes\` target per contract), or record a decision that subsumes ` +
          `${intentId} and is anchored to covered work`,
      });
      continue;
    }

    findings.push({
      rule: ruleId,
      kind: "unbacked_addressed",
      subject: intentId,
      detail:
        `intent ${intentId} is addressed but no selected contract markets it ` +
        `(${live.size} live proposing contract(s), 0 selected): revert ${intentId} to \`open\` until ` +
        `a decision selects a contract that proposes it, or record a decision that subsumes ` +
        `${intentId} and is anchored to covered work`,
    });
  }

  return findings;
}
