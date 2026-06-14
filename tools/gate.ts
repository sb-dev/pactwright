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

/**
 * Normalize a frontmatter date to a `YYYY-MM-DD` string, which sorts lexically.
 * Returns `undefined` if the value is not a real calendar date.
 *
 * The shape regex alone is not enough: `2099-99-99` matches `\d{4}-\d{2}-\d{2}`
 * yet names no real day. So after the shape check we round-trip the components
 * through `Date.UTC` and require them to survive unchanged — rejecting
 * impossible months/days (`2099-99-99`, `2026-02-30`). `fromYaml` parses with
 * CORE_SCHEMA, so dates reach us as strings (an unquoted `2099-99-99` is no
 * longer overflow-coerced into a far-future `Date`); the `Date` branch is a
 * defensive fallback for any caller that still passes a parsed `Date`.
 */
function toDateString(value: unknown): string | undefined {
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

// --- git adapter: derive the added-id sets by diffing the base ref ---------

function git(args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { encoding: "utf8" });
  // A failed spawn or a signal (status === null) is never a legitimate "command
  // ran and reported"; coercing it to a number here once let callers read it as
  // an ordinary non-zero exit and silently treat a base path as "absent". Throw
  // so the gate fails closed instead. A real non-zero exit is returned for
  // callers that inspect it (resolveBase, rev-parse, the ls-tree presence test).
  if (r.error) throw new Error(`git ${args.join(" ")}: ${r.error.message}`);
  if (r.status === null) {
    throw new Error(`git ${args.join(" ")}: terminated by signal ${r.signal ?? "unknown"}`);
  }
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
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
  const path = "specs/graph/edges.yaml";
  const ids = new Set<string>();
  // Distinguish "file legitimately absent at base" (→ empty, all head edges are
  // new) from an infra error (→ throw, fail closed). For a verified base commit
  // `ls-tree` always exits 0; empty stdout means the path is absent. If it IS
  // present, a non-zero `git show` is unexpected (unreadable object) → throw,
  // rather than the old behaviour of treating it as absent and over-counting
  // added edges.
  const listed = git(["ls-tree", base, "--", path]);
  if (listed.status !== 0) {
    throw new Error(`git ls-tree ${base} -- ${path}: ${listed.stderr.trim() || `exit ${listed.status}`}`);
  }
  if (listed.stdout.trim() === "") return ids;
  const r = git(["show", `${base}:${path}`]);
  if (r.status !== 0) {
    throw new Error(`git show ${base}:${path}: ${r.stderr.trim() || `exit ${r.status}`}`);
  }
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
  // For a verified base, ls-tree exits 0 even when specs/nodes never existed
  // (empty output). A non-zero status is therefore an infra error, not an
  // absent dir: throw so the gate fails closed instead of treating every node
  // as "added" (which could let a pre-existing override waive).
  if (r.status !== 0) {
    throw new Error(`git ls-tree ${base} specs/nodes: ${r.stderr.trim() || `exit ${r.status}`}`);
  }
  const baseFiles = new Set(
    r.stdout.split("\n").map((l) => l.trim()).filter((l) => l !== ""),
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
