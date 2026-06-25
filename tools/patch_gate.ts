import { spawnSync } from "node:child_process";
import { asString, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import { type GateResult, toDateString } from "./gate.ts";
import { addedEdgeIds, addedNodeIds, resolveBase } from "./gitdiff.ts";
import { competingPatches, patchMarketResolved } from "./handlers/coverage_traversal.ts";

/**
 * The patch-comparison gate (`spec:patch-gate`). A diff-aware merge gate: when a PR
 * merges a patch branch whose brief runs a market (>1 competing patch), the graph
 * must already carry a comparison covering those patches AND a `selects` decision on
 * one of them — else an unexpired override waiving `patch-comparison`. The verdict
 * (`evaluatePatchGate`) is a pure function of the HEAD graph plus the PR's head
 * branch and added-id sets, so it is unit-testable without git.
 *
 * Mirrors `tools/gate.ts`/`checkdiff.ts`: it reuses `gitdiff.ts` and `toDateString`,
 * and shares the "who competes / is the market resolved" traversal with the
 * `selected_patch_comparison` validation rule (one source of truth — no drift).
 */

/** The literal a `waives` edge must target to waive this gate (a named check, not
 * a node id). Byte-equal to the `patch-comparison` entry in schema/checks.yaml and
 * the patch-comparison.yml workflow step. */
export const PATCH_COMPARISON_CHECK = "patch-comparison";

export interface PatchGateInput {
  /** Edge ids present at HEAD but absent at the base ref. */
  addedEdgeIds: Set<string>;
  /** Node ids present at HEAD but absent at the base ref. */
  addedNodeIds: Set<string>;
  /** The PR head branch (e.g. `patch/<brief-slug>/<strategy>`), or undefined when
   * it cannot be determined. */
  headBranch: string | undefined;
  /** The run date, `YYYY-MM-DD`, compared against an override's `expires`. */
  today: string;
}

/** Is there an ADDED `override` + `waives → patch-comparison`, unexpired? Returns
 * the pass reason, else a near-miss describing the closest expired/malformed try. */
function patchComparisonOverride(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  input: PatchGateInput,
): { reason: string | undefined; nearMiss?: string } {
  let nearMiss: string | undefined;
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id === undefined || !input.addedEdgeIds.has(id)) continue;
    if (asString(edge["type"]) !== "waives") continue;
    if (asString(edge["target"]) !== PATCH_COMPARISON_CHECK) continue;
    const overrideId = asString(edge["source"]);
    if (overrideId === undefined || !input.addedNodeIds.has(overrideId)) continue;
    const node = byId.get(overrideId);
    if (node === undefined || asString(node.data["type"]) !== "override") continue;
    const expires = toDateString(node.data["expires"]);
    if (expires === undefined) {
      nearMiss = `override ${overrideId} waives patch-comparison but its 'expires' is missing or unparseable`;
      continue;
    }
    if (expires >= input.today) {
      return {
        reason: `added override ${overrideId} waives patch-comparison (expires ${expires} >= ${input.today})`,
      };
    }
    nearMiss = `override ${overrideId} waives patch-comparison but expired (expires ${expires} < ${input.today})`;
  }
  return { reason: undefined, nearMiss };
}

/**
 * Pass iff the PR is not a patch-market merge that skipped the market. Concretely:
 *  - the head branch maps to no patch node and is not a `patch/...` branch → PASS
 *    (an unrelated PR);
 *  - the head branch is a `patch/...` branch we cannot map to exactly one patch and
 *    its single brief → FAIL CLOSED (never silently let an unmapped patch merge);
 *  - the mapped brief runs no market (<=1 competing patch) → PASS;
 *  - the market is resolved (comparison covers >=2 competitors AND one is selected)
 *    → PASS;
 *  - else require an unexpired override waiving patch-comparison, else FAIL.
 */
export function evaluatePatchGate(spec: LoadedSpec, input: PatchGateInput): GateResult {
  const { headBranch } = input;
  const byId = nodesById(spec);

  const isPatchBranch = headBranch !== undefined && headBranch.startsWith("patch/");
  const matching = spec.nodes.filter(
    (n) => asString(n.data["type"]) === "patch" && asString(n.data["branch"]) === headBranch,
  );
  if (matching.length === 0) {
    if (isPatchBranch) {
      return {
        pass: false,
        reason: `head branch '${headBranch}' is a patch branch but no patch node records it — cannot verify its market (record it via /propose-patches, or add an override waiving patch-comparison)`,
      };
    }
    return { pass: true, reason: "no patch node maps to this PR's head branch — not a patch-market merge" };
  }
  if (matching.length > 1) {
    const ids = matching.map((n) => asString(n.data["id"]) ?? n.file).sort();
    return {
      pass: false,
      reason: `head branch '${headBranch}' is recorded by ${matching.length} patch nodes [${ids.join(", ")}] — ambiguous`,
    };
  }
  const patchId = asString(matching[0].data["id"]) ?? matching[0].file;

  const briefIds = new Set<string>();
  for (const edge of spec.edges) {
    if (asString(edge["type"]) !== "competes-for") continue;
    if (asString(edge["source"]) !== patchId) continue;
    const t = asString(edge["target"]);
    if (t !== undefined && byId.get(t) !== undefined) briefIds.add(t);
  }
  if (briefIds.size !== 1) {
    return {
      pass: false,
      reason: `patch ${patchId} competes-for ${briefIds.size} resolvable brief(s) — cannot determine the market (exactly one required)`,
    };
  }
  const briefId = [...briefIds][0];

  const competing = competingPatches(spec, byId, briefId);
  if (competing.size <= 1) {
    return { pass: true, reason: `brief ${briefId} has ${competing.size} competing patch(es) — no market to resolve` };
  }

  if (patchMarketResolved(spec, byId, briefId)) {
    return {
      pass: true,
      reason: `brief ${briefId}'s patch market is resolved (a comparison covers >=2 of ${competing.size} competitors and a selects decision exists)`,
    };
  }

  const ov = patchComparisonOverride(spec, byId, input);
  if (ov.reason !== undefined) return { pass: true, reason: ov.reason };
  const tail = ov.nearMiss !== undefined ? ` — ${ov.nearMiss}` : "";
  return {
    pass: false,
    reason: `brief ${briefId} has ${competing.size} competing patches but the graph carries no comparison+selects resolving the market${tail}`,
  };
}

/** The PR head branch: `$GITHUB_HEAD_REF` (set on GitHub PR runs), else the local
 * branch name. `undefined` in a detached HEAD with no env — a non-patch context. */
function resolveHeadBranch(): string | undefined {
  const env = process.env.GITHUB_HEAD_REF;
  if (env !== undefined && env.trim() !== "") return env.trim();
  const r = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" });
  if (r.status === 0) {
    const branch = (r.stdout ?? "").trim();
    if (branch !== "" && branch !== "HEAD") return branch;
  }
  return undefined;
}

/** Resolve the base ref + head branch, derive the added-id sets, and evaluate. */
export function runPatchGate(spec: LoadedSpec): GateResult {
  const base = resolveBase();
  return evaluatePatchGate(spec, {
    addedEdgeIds: addedEdgeIds(spec, base),
    addedNodeIds: addedNodeIds(spec, base),
    headBranch: resolveHeadBranch(),
    today: new Date().toISOString().slice(0, 10),
  });
}
