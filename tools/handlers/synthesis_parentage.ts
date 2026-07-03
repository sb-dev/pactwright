import { asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts";
import type { Finding } from "../validator.ts";

/**
 * A synthesis patch — any `patch` that points at a parent via a `synthesizes`
 * edge — must combine AT LEAST TWO distinct parent patches. A synthesis of a
 * single patch is not a synthesis (it is just that patch); across-lane combination
 * is integration, never synthesis. Counts DISTINCT resolved parents, so two
 * `synthesizes` edges to the same parent do not satisfy the bar. Endpoints that do
 * not resolve are defensively skipped (`edges-references-resolve` reports them but
 * does not remove them, so rule order alone is not enough).
 */
export default function synthesisParentage(rule: Rule, spec: LoadedSpec): Finding[] {
  const ruleId = String(rule.id);
  const byId = nodesById(spec);
  const parentsBySynthesis = new Map<string, Set<string>>();

  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "synthesizes") continue;
    const sourceId = asString(edge["source"]);
    if (sourceId === undefined) continue;
    const targetId = asString(edge["target"]);
    if (targetId === undefined || byId.get(targetId) === undefined) continue; // unresolved parent
    let parents = parentsBySynthesis.get(sourceId);
    if (parents === undefined) {
      parents = new Set<string>();
      parentsBySynthesis.set(sourceId, parents);
    }
    parents.add(targetId);
  }

  const findings: Finding[] = [];
  for (const [synthesisId, parents] of parentsBySynthesis) {
    if (parents.size < 2) {
      findings.push({
        rule: ruleId,
        kind: "synthesis_parentage",
        subject: synthesisId,
        detail: `synthesis patch ${synthesisId} has ${parents.size} distinct parent patch(es) via synthesizes edges (>=2 required)`,
      });
    }
  }
  return findings;
}
