import { spawnSync } from "node:child_process";
import { asString, type LoadedSpec } from "./loader.ts";
import { fromYaml } from "./yaml.ts";

/**
 * Git adapter shared by the diff-aware subcommands (`gate`, `check-diff`,
 * `drift-map`): resolve a base ref and derive what the working tree adds over
 * it. One implementation so the gates cannot drift apart. Every helper fails
 * CLOSED — a spawn failure or unexpected non-zero exit throws rather than
 * yielding empty base sets that would make the whole tree look "added" and a
 * gate pass for the wrong reason.
 */

function git(args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { encoding: "utf8" });
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
  // would silently fail and yield empty base sets, making the whole graph look
  // 'added' and a gate pass for the wrong reason.
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
  // present, a non-zero `git show` is unexpected (unreadable object) → throw.
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
  // as "added".
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

/** Repo-relative paths the PR changes: `git diff --name-only <base>...HEAD`
 * (the conventional PR diff, from the merge-base to HEAD). Fails closed. */
export function changedFiles(base: string): string[] {
  const r = git(["diff", "--name-only", `${base}...HEAD`]);
  if (r.status !== 0) {
    throw new Error(`git diff --name-only ${base}...HEAD: ${r.stderr.trim() || `exit ${r.status}`}`);
  }
  return r.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}
