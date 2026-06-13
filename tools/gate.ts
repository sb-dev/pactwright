import { spawnSync } from "node:child_process";
import { asString, nodesById, type LoadedSpec } from "./loader.ts";
import { fromYaml } from "./yaml.ts";

/**
 * The PR gate. The decision (`evaluateGate`) is a pure function of the HEAD
 * graph plus the set of ids the PR adds, so it is unit-testable without git.
 * The git adapter below derives those added-id sets by diffing the base ref.
 */

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

/** Normalize a frontmatter date (js-yaml may parse it as a Date or a string)
 * to a `YYYY-MM-DD` string, which sorts lexically. `undefined` if unparseable. */
function toDateString(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return undefined;
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
      if (contract !== undefined && asString(contract.data["status"]) === "approved") {
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

// --- git adapter: derive the added-id sets by diffing the base ref ---------

function git(args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Base ref to diff against: `$GATE_BASE` (e.g. the PR base sha), else the
 * merge-base with `origin/HEAD`. Throws if neither resolves. */
export function resolveBase(): string {
  const env = process.env.GATE_BASE;
  let base: string;
  if (env !== undefined && env.trim() !== "") {
    base = env.trim();
  } else {
    const r = git(["merge-base", "origin/HEAD", "HEAD"]);
    base = r.stdout.trim();
    if (r.status !== 0 || base === "") {
      throw new Error(
        "cannot resolve a base ref: set GATE_BASE (e.g. the PR base sha) or ensure " +
          "'git merge-base origin/HEAD HEAD' resolves (needs a full-history checkout)",
      );
    }
  }
  // Verify the base names a real commit. Otherwise `git show`/`git ls-tree`
  // would silently fail and yield empty base sets, making the whole graph
  // look 'added' and the gate pass for the wrong reason.
  const verify = git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  if (verify.status !== 0 || verify.stdout.trim() === "") {
    throw new Error(`base ref '${base}' does not resolve to a commit (set GATE_BASE to a valid base sha)`);
  }
  return base;
}

/** Edge ids in edges.yaml at `base`; empty if the file did not exist there. */
function baseEdgeIds(base: string): Set<string> {
  const r = git(["show", `${base}:specs/graph/edges.yaml`]);
  const ids = new Set<string>();
  if (r.status !== 0) return ids;
  const doc = fromYaml(r.stdout);
  const edges = doc !== null && typeof doc === "object" ? (doc as Record<string, unknown>)["edges"] : undefined;
  if (Array.isArray(edges)) {
    for (const e of edges) {
      if (e !== null && typeof e === "object") {
        const id = (e as Record<string, unknown>)["id"];
        if (typeof id === "string") ids.add(id);
      }
    }
  }
  return ids;
}

export function addedEdgeIds(spec: LoadedSpec, base: string): Set<string> {
  const baseIds = baseEdgeIds(base);
  const added = new Set<string>();
  for (const edge of spec.edges) {
    const id = asString(edge["id"]);
    if (id !== undefined && !baseIds.has(id)) added.add(id);
  }
  return added;
}

export function addedNodeIds(spec: LoadedSpec, base: string): Set<string> {
  const r = git(["ls-tree", "-r", "--name-only", base, "specs/nodes"]);
  const baseFiles = new Set(
    r.status === 0 ? r.stdout.split("\n").map((l) => l.trim()).filter((l) => l !== "") : [],
  );
  const added = new Set<string>();
  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    if (id !== undefined && !baseFiles.has(node.file)) added.add(id);
  }
  return added;
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
