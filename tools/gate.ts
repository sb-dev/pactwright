import { asString, nodesById, type LoadedSpec } from "./loader.ts";
import { addedEdgeIds, addedNodeIds, resolveBase } from "./gitdiff.ts";

/**
 * The PR gate. The decision (`evaluateGate`) is a pure function of the HEAD
 * graph plus the set of ids the PR adds, so it is unit-testable without git.
 * The git adapter that derives those added-id sets now lives in `gitdiff.ts`,
 * shared with `check-diff` and `drift-map`; it is re-exported here so existing
 * callers and tests can keep importing it from `gate.ts`.
 */
export { addedEdgeIds, addedNodeIds, resolveBase };

/** The literal a `waives` edge must target to waive this gate (a named check,
 * not a node id). Pinned independent of workflow filename or job name. */
const PR_EVIDENCE_CHECK = "pr-evidence";

export interface GateInput {
  /** Edge ids present at HEAD but absent at the base ref. */
  addedEdgeIds: Set<string>;
  /** Node ids whose file is present at HEAD but absent at the base ref. */
  addedNodeIds: Set<string>;
  /** The run date, `YYYY-MM-DD`, compared against an override's `expires`. */
  today: string;
}

export interface GateResult {
  pass: boolean;
  reason: string;
}

/**
 * Normalize a frontmatter date to a `YYYY-MM-DD` string, which sorts lexically.
 * Returns `undefined` if the value is not a real calendar date.
 *
 * The shape regex alone is not enough: `2099-99-99` matches `\d{4}-\d{2}-\d{2}`
 * yet names no real day. So after the shape check we round-trip the components
 * through `Date.UTC` and require them to survive unchanged — rejecting
 * impossible months/days. `fromYaml` parses with CORE_SCHEMA, so dates reach us
 * as strings; the `Date` branch is a defensive fallback for any caller that
 * still passes a parsed `Date`. Exported for reuse by `check-diff`.
 */
export function toDateString(value: unknown): string | undefined {
  let raw: string | undefined;
  if (value instanceof Date) raw = value.toISOString().slice(0, 10);
  else if (typeof value === "string") raw = value.slice(0, 10);
  else return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return undefined;
  }
  return raw;
}

/**
 * Pass iff EITHER:
 *  (a) the PR adds an `evidences` edge whose target brief `decomposes` a
 *      contract whose status (at HEAD) is `approved`; OR
 *  (b) the PR adds an `override` node together with a `waives` edge targeting
 *      the `pr-evidence` check, and that override is not expired.
 */
export function evaluateGate(spec: LoadedSpec, input: GateInput): GateResult {
  const { addedEdgeIds, addedNodeIds, today } = input;
  const byId = nodesById(spec);

  // Clause (a): added evidences edge -> brief -> approved contract.
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id === undefined || !addedEdgeIds.has(id)) continue;
    if (asString(edge["type"]) !== "evidences") continue;
    const briefId = asString(edge["target"]);
    if (briefId === undefined) continue;
    for (const inner of spec.edges) {
      if (asString(inner["type"]) !== "decomposes") continue;
      if (asString(inner["source"]) !== briefId) continue;
      const contractId = asString(inner["target"]);
      const contract = contractId !== undefined ? byId.get(contractId) : undefined;
      // Mirror clause (b)'s type guard: require the `decomposes` target to be a
      // `contract`, not merely a node that happens to be `approved`. Redundant
      // with `edge_endpoint_types` on a validated graph, but `spec:gate` runs
      // without a prior `spec:validate`, so check it here too.
      if (
        contract !== undefined &&
        asString(contract.data["type"]) === "contract" &&
        asString(contract.data["status"]) === "approved"
      ) {
        return {
          pass: true,
          reason: `added evidences edge ${id} -> brief ${briefId} -> approved contract ${contractId}`,
        };
      }
    }
  }

  // Clause (b): added override waiving pr-evidence, not expired. A single
  // expired/malformed override is not a hard fail — keep scanning, but
  // remember the closest miss for a useful message.
  let overrideNearMiss: string | undefined;
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id === undefined || !addedEdgeIds.has(id)) continue;
    if (asString(edge["type"]) !== "waives") continue;
    if (asString(edge["target"]) !== PR_EVIDENCE_CHECK) continue;
    const overrideId = asString(edge["source"]);
    if (overrideId === undefined || !addedNodeIds.has(overrideId)) continue;
    const node = byId.get(overrideId);
    if (node === undefined || asString(node.data["type"]) !== "override") continue;
    const expires = toDateString(node.data["expires"]);
    if (expires === undefined) {
      overrideNearMiss = `override ${overrideId} waives pr-evidence but its 'expires' is missing or unparseable`;
      continue;
    }
    if (expires >= today) {
      return {
        pass: true,
        reason: `added override ${overrideId} waives pr-evidence (expires ${expires} >= ${today})`,
      };
    }
    overrideNearMiss = `override ${overrideId} waives pr-evidence but expired (expires ${expires} < ${today})`;
  }

  const base =
    "no added evidences edge reaching an approved contract, and no unexpired override waiving pr-evidence";
  return { pass: false, reason: overrideNearMiss !== undefined ? `${base} — ${overrideNearMiss}` : base };
}

/** Resolve the base ref, derive the added-id sets, and evaluate the gate. */
export function runGate(spec: LoadedSpec): GateResult {
  const base = resolveBase();
  return evaluateGate(spec, {
    addedEdgeIds: addedEdgeIds(spec, base),
    addedNodeIds: addedNodeIds(spec, base),
    today: new Date().toISOString().slice(0, 10),
  });
}
