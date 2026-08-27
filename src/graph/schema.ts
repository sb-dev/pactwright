import { PactwrightError, type Problem } from "../errors.js";
import { Checker, requireKeys } from "../validation.js";
import type { GraphNode } from "./nodes.js";

/** The five durable core Delivery node types (Delivery Graph §5). */
export const CORE_NODE_TYPES = ["intent", "decision", "contract", "brief", "evidence"] as const;
export type CoreNodeType = (typeof CORE_NODE_TYPES)[number];

/** Allowed Decision outcomes (Delivery Graph §8). */
export const DECISION_OUTCOMES = ["proceed", "reject", "defer"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

/** `decided_by` records the actual actor as `<kind>:<name>` (Delivery Graph §8). */
export const DECIDED_BY_KINDS = ["human", "agent", "automation"] as const;
export type DecidedByKind = (typeof DECIDED_BY_KINDS)[number];
export const DECIDED_BY_PATTERN = /^(human|agent|automation):\S+$/;

export interface DecidedBy {
  readonly kind: DecidedByKind;
  readonly name: string;
}

/** Splits `human:samir` into `{ kind: "human", name: "samir" }`; `undefined` when malformed. */
export function parseDecidedBy(value: string): DecidedBy | undefined {
  if (!DECIDED_BY_PATTERN.test(value)) return undefined;
  const separator = value.indexOf(":");
  return { kind: value.slice(0, separator) as DecidedByKind, name: value.slice(separator + 1) };
}

/**
 * A node type schema: the type-specific frontmatter fields required beyond
 * the common ones, plus an optional deeper check run only when those fields
 * are present.
 */
export interface NodeSchema {
  readonly type: string;
  readonly requiredFields: readonly string[];
  readonly validate?: (node: GraphNode, c: Checker) => void;
}

/** Node schemas keyed by node type. */
export type NodeSchemaRegistry = Readonly<Record<string, NodeSchema>>;

/**
 * Builds a frozen registry. Throws `duplicate-node-type` when two schemas
 * claim the same type; later extensions compose registries with
 * `createNodeSchemaRegistry([...Object.values(CORE_NODE_SCHEMAS), ...own])`.
 */
export function createNodeSchemaRegistry(schemas: readonly NodeSchema[]): NodeSchemaRegistry {
  // Prototype-less, so a type like "constructor" can never resolve to an
  // Object.prototype member instead of a registered schema.
  const registry: Record<string, NodeSchema> = Object.create(null) as Record<string, NodeSchema>;
  for (const schema of schemas) {
    if (Object.hasOwn(registry, schema.type)) {
      throw new PactwrightError(
        "duplicate-node-type",
        `node type "${schema.type}" is already registered`,
      );
    }
    registry[schema.type] = schema;
  }
  return Object.freeze(registry);
}

/** Registered node types, sorted. */
export function nodeTypes(registry: NodeSchemaRegistry): readonly string[] {
  return Object.keys(registry).sort();
}

function validateDecision(node: GraphNode, c: Checker): void {
  const outcome = node.frontmatter["outcome"];
  if (outcome !== undefined && !(DECISION_OUTCOMES as readonly unknown[]).includes(outcome)) {
    c.fail(
      "invalid-outcome",
      `frontmatter.outcome must be one of: ${DECISION_OUTCOMES.join(", ")}`,
    );
  }
  const decidedBy = node.frontmatter["decided_by"];
  if (
    decidedBy !== undefined &&
    (typeof decidedBy !== "string" || !DECIDED_BY_PATTERN.test(decidedBy))
  ) {
    c.fail(
      "invalid-actor",
      `frontmatter.decided_by must be "<kind>:<name>" with kind one of: ${DECIDED_BY_KINDS.join(", ")}`,
    );
  }
}

/**
 * The core Delivery schema registry: exactly the five durable node types.
 * Contract alternatives (§7), Delivery execution and Review (§11) are
 * transient and deliberately absent.
 */
export const CORE_NODE_SCHEMAS: NodeSchemaRegistry = createNodeSchemaRegistry([
  { type: "intent", requiredFields: [] },
  { type: "decision", requiredFields: ["decided_by", "outcome"], validate: validateDecision },
  { type: "contract", requiredFields: [] },
  { type: "brief", requiredFields: [] },
  { type: "evidence", requiredFields: [] },
]);

/** Validates one parsed node against the registry (Delivery Graph §21, Nodes). */
export function validateNode(node: GraphNode, registry: NodeSchemaRegistry): readonly Problem[] {
  const c = new Checker(node.path);
  const schema = registry[node.type];
  if (schema === undefined) {
    c.fail(
      "unknown-node-type",
      `node type "${node.type}" is not a registered node type (known: ${nodeTypes(registry).join(", ")})`,
    );
    return c.problems;
  }
  requireKeys(c, node.frontmatter, "frontmatter", schema.requiredFields);
  schema.validate?.(node, c);
  return c.problems;
}

export function validateNodes(
  nodes: readonly GraphNode[],
  registry: NodeSchemaRegistry,
): readonly Problem[] {
  return nodes.flatMap((node) => validateNode(node, registry));
}

export interface DecisionFields {
  readonly outcome: DecisionOutcome;
  readonly decidedBy: DecidedBy;
}

/** Typed view of a valid decision's fields; `undefined` for any other or invalid node. */
export function decisionFields(node: GraphNode): DecisionFields | undefined {
  if (node.type !== "decision") return undefined;
  const outcome = node.frontmatter["outcome"];
  const rawActor = node.frontmatter["decided_by"];
  if (!(DECISION_OUTCOMES as readonly unknown[]).includes(outcome)) return undefined;
  if (typeof rawActor !== "string") return undefined;
  const decidedBy = parseDecidedBy(rawActor);
  if (decidedBy === undefined) return undefined;
  return { outcome: outcome as DecisionOutcome, decidedBy };
}
