import type { Problem } from "../errors.js";
import type { GraphIndex } from "./graph-index.js";
import type { GraphNode } from "./nodes.js";
import type { NodeSchemaRegistry, RelationshipRule } from "./schema.js";

/**
 * The relationships every record must have, checked for every record in the
 * graph whether or not it is reachable from an Intent (Core §15).
 *
 * Cardinality used to live only inside the lineage walk, which starts at an
 * Intent and works outwards: an orphan Decision, Contract, Brief or Evidence
 * was never visited, and a Decision resolving two Intents passed because each
 * Intent's own walk saw exactly one Decision. Both pass `validate.ok = true`
 * today.
 *
 * These are structural, so they hold across superseded records too: a
 * superseded Decision still resolved exactly one Intent.
 *
 * Edges are counted, not resolved: a dangling endpoint is
 * `validateEdges`'s problem to report, and counting it here would hide the
 * cardinality failure behind a second message about the same edge.
 */
export interface RelationshipProblem extends Problem {
  /** The node type whose rule failed, so a caller can map it to its §57 rule. */
  readonly nodeType: string;
}

export function validateRelationships(
  nodes: readonly GraphNode[],
  index: GraphIndex,
  registry: NodeSchemaRegistry,
): readonly RelationshipProblem[] {
  const problems: RelationshipProblem[] = [];
  for (const node of [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    for (const rule of registry[node.type]?.relationships ?? []) {
      if (rule.when !== undefined && !rule.when(node)) continue;
      const found =
        rule.direction === "out"
          ? index.edgesFrom(node.id, rule.type).length
          : index.edgesTo(node.id, rule.type).length;
      if (found >= rule.min && (rule.max === undefined || found <= rule.max)) continue;
      problems.push({
        code: found < rule.min ? "missing-relationship" : "excess-relationship",
        message: message(node, rule, found),
        path: node.path,
        nodeType: node.type,
      });
    }
  }
  return problems;
}

function message(node: GraphNode, rule: RelationshipRule, found: number): string {
  const subject = rule.subject ?? `a ${node.type}`;
  const way = rule.direction === "out" ? `${rule.type} edge` : `incoming ${rule.type} edge`;
  const plural = (n: number) => (n === 1 ? "" : "s");
  const expected =
    rule.max === rule.min
      ? rule.min === 0
        ? `no ${way}`
        : `exactly ${rule.min} ${way}${plural(rule.min)}`
      : `at least ${rule.min} ${way}${plural(rule.min)}`;
  return `${node.type} "${node.id}" has ${found} ${way}${plural(found)}; ${subject} has ${expected} (Spec 01 §15)`;
}
