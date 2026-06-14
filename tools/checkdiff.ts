import { asString, capabilityPaths, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import { type GateResult, toDateString } from "./gate.ts";
import {
  resolveBase,
  addedEdgeIds as gitAddedEdgeIds,
  addedNodeIds as gitAddedNodeIds,
  changedFiles as gitChangedFiles,
} from "./gitdiff.ts";
import { matchAny } from "./glob.ts";

/**
 * The sensitive-path gate (`spec:check-diff`). A PR that touches a
 * `sensitive_paths` glob must carry, in the same diff, either an approved
 * contract that GOVERNS the touched path (bound to the capability that owns it,
 * not just any approved contract) or an override waiving this check. Like the
 * PR gate, the decision is a pure function so it is unit-testable without git.
 */

/** The literal a `waives` edge must target to waive this check. */
const CHECK_DIFF_CHECK = "check-diff";

export interface CheckDiffInput {
  /** Repo-relative paths the PR changes. */
  changedFiles: string[];
  /** Edge ids the PR adds over the base. */
  addedEdgeIds: Set<string>;
  /** Node ids the PR adds over the base. */
  addedNodeIds: Set<string>;
  /** The run date, `YYYY-MM-DD`, compared against an override's `expires`. */
  today: string;
}

/** Is there an ADDED `override` + `waives → check-diff`, unexpired? Returns the
 * pass reason, else a near-miss describing the closest expired/malformed try. */
function checkDiffOverride(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  input: CheckDiffInput,
): { reason: string | undefined; nearMiss?: string } {
  let nearMiss: string | undefined;
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id === undefined || !input.addedEdgeIds.has(id)) continue;
    if (asString(edge["type"]) !== "waives") continue;
    if (asString(edge["target"]) !== CHECK_DIFF_CHECK) continue;
    const overrideId = asString(edge["source"]);
    if (overrideId === undefined || !input.addedNodeIds.has(overrideId)) continue;
    const node = byId.get(overrideId);
    if (node === undefined || asString(node.data["type"]) !== "override") continue;
    const expires = toDateString(node.data["expires"]);
    if (expires === undefined) {
      nearMiss = `override ${overrideId} waives check-diff but its 'expires' is missing or unparseable`;
      continue;
    }
    if (expires >= input.today) {
      return { reason: `added override ${overrideId} waives check-diff (expires ${expires} >= ${input.today})` };
    }
    nearMiss = `override ${overrideId} waives check-diff but expired (expires ${expires} < ${input.today})`;
  }
  return { reason: undefined, nearMiss };
}

/** Does the PR add an `evidences` edge whose evidence `touches` `capId` and
 * whose target brief `decomposes` an `approved` contract? (Amendment-5 binding:
 * the evidence must touch the capability that owns the sensitive path.) */
function hasGoverningEvidence(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  addedEdgeIds: Set<string>,
  capId: string,
): boolean {
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id === undefined || !addedEdgeIds.has(id)) continue;
    if (asString(edge["type"]) !== "evidences") continue;
    const evId = asString(edge["source"]);
    const briefId = asString(edge["target"]);
    if (evId === undefined || briefId === undefined) continue;
    const touchesCap = spec.edges.some(
      (e) => asString(e["type"]) === "touches" && asString(e["source"]) === evId && asString(e["target"]) === capId,
    );
    if (!touchesCap) continue;
    for (const inner of spec.edges) {
      if (asString(inner["type"]) !== "decomposes") continue;
      if (asString(inner["source"]) !== briefId) continue;
      const contractId = asString(inner["target"]);
      const contract = contractId !== undefined ? byId.get(contractId) : undefined;
      if (
        contract !== undefined &&
        asString(contract.data["type"]) === "contract" &&
        asString(contract.data["status"]) === "approved"
      ) {
        return true;
      }
    }
  }
  return false;
}

export function evaluateCheckDiff(spec: LoadedSpec, input: CheckDiffInput): GateResult {
  const sensitive = input.changedFiles.filter((f) => matchAny(f, spec.sensitivePaths));
  if (sensitive.length === 0) {
    return { pass: true, reason: "no sensitive paths touched" };
  }

  const byId = nodesById(spec);

  // An override waiving check-diff clears the whole PR.
  const override = checkDiffOverride(spec, byId, input);
  if (override.reason !== undefined) return { pass: true, reason: override.reason };
  const tail = override.nearMiss !== undefined ? ` — ${override.nearMiss}` : "";

  // Map each touched sensitive file to the capability(ies) that own it.
  const capabilities = spec.nodes.filter((n) => asString(n.data["type"]) === "capability");
  const unowned: string[] = [];
  const owningCaps = new Set<string>();
  for (const f of sensitive) {
    const owners = capabilities.filter((c) => matchAny(f, capabilityPaths(c)));
    if (owners.length === 0) {
      unowned.push(f);
      continue;
    }
    for (const c of owners) {
      const id = asString(c.data["id"]);
      if (id !== undefined) owningCaps.add(id);
    }
  }
  if (unowned.length > 0) {
    return {
      pass: false,
      reason: `sensitive path(s) with no owning capability: ${unowned.sort().join(", ")} — add a capability whose 'paths' own them, or an override waiving check-diff${tail}`,
    };
  }

  // Every owning capability must be reached by added evidence → approved contract.
  const uncovered = [...owningCaps].sort().filter((capId) => !hasGoverningEvidence(spec, byId, input.addedEdgeIds, capId));
  if (uncovered.length === 0) {
    return {
      pass: true,
      reason: `sensitive change covered: added evidence links ${[...owningCaps].sort().join(", ")} to an approved contract`,
    };
  }
  return {
    pass: false,
    reason: `sensitive change touches ${uncovered.join(", ")} but the PR adds no evidence that both touches the owning capability and reaches an approved contract${tail}`,
  };
}

/** Resolve the base ref, derive the diff sets, and evaluate the check. */
export function runCheckDiff(spec: LoadedSpec): GateResult {
  const base = resolveBase();
  return evaluateCheckDiff(spec, {
    changedFiles: gitChangedFiles(base),
    addedEdgeIds: gitAddedEdgeIds(spec, base),
    addedNodeIds: gitAddedNodeIds(spec, base),
    today: new Date().toISOString().slice(0, 10),
  });
}
