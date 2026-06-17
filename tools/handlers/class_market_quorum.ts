import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * A selected (`selects`-edged) intent of `class >= 2` must have at least two
 * LIVE candidate contracts — i.e. two distinct `proposes` edges targeting it
 * whose source contract is not `superseded`. This is the machine backstop for
 * the work-class routing rule "a class-2+ intent cannot be approved until >=2
 * candidate contracts exist": an under-proposed approval cannot stand in a green
 * graph.
 *
 * Candidacy is counted status-blind EXCEPT for `superseded` (CLAUDE.md rule 3
 * leaves a superseded contract's `proposes` edge in place; counting it would let
 * a single revised-away idea masquerade as two candidates). A `selects` edge to a
 * contract that proposes no intent is an explicit finding (never a silent pass). A
 * contract proposing several intents is judged against each intent's quorum
 * independently. Endpoints that do not resolve are defensively skipped here —
 * `edges-references-resolve` reports them but does not remove them, so rule order
 * alone is not enough.
 */
export default function classMarketQuorum(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const findings: Finding[] = [];

  const liveCandidates = (intentId: string): number => {
    let count = 0;
    for (const edge of spec.edges) {
      if (asString(edge["type"]) !== "proposes") continue;
      if (asString(edge["target"]) !== intentId) continue;
      const sourceId = asString(edge["source"]);
      const source = sourceId !== undefined ? byId.get(sourceId) : undefined;
      if (source === undefined) continue; // unresolved source: skip, references_resolve owns it
      if (asString(source.data["status"]) === "superseded") continue;
      count += 1;
    }
    return count;
  };

  spec.edges.forEach((edge, i) => {
    if (asString(edge["type"]) !== "selects") return;
    const subject = asString(edge["id"]) ?? `specs/graph/edges.yaml[${i}]`;
    const contractId = asString(edge["target"]);
    if (contractId === undefined || byId.get(contractId) === undefined) return; // unresolved: skip

    const intentIds = spec.edges
      .filter((e) => asString(e["type"]) === "proposes" && asString(e["source"]) === contractId)
      .map((e) => asString(e["target"]))
      .filter((id): id is string => id !== undefined);

    if (intentIds.length === 0) {
      findings.push({
        rule: ruleId,
        kind: "class_market_quorum",
        subject,
        detail: `selects edge ${subject} targets contract ${contractId} which proposes no intent`,
      });
      return;
    }

    for (const intentId of intentIds) {
      const intent = byId.get(intentId);
      if (intent === undefined) continue; // unresolved: skip
      const cls = intent.data["class"];
      if (typeof cls !== "number" || cls < 2) continue; // class < 2 imposes no quorum
      const count = liveCandidates(intentId);
      if (count < 2) {
        findings.push({
          rule: ruleId,
          kind: "class_market_quorum",
          subject: intentId,
          detail: `intent ${intentId} (class ${cls}) has a selected contract but only ${count} live candidate proposes edge(s) (>=2 required)`,
        });
      }
    }
  });

  return findings;
}
