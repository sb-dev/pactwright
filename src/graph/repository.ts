import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The exact repository state an execution ran against (Spec 01 §56). It is
 * deliberately distinct from `project_graph_revision`: the graph revision
 * identifies semantic graph state, while this identifies the reconstructible
 * repository input base — including the working-tree bytes an agent actually
 * saw.
 *
 * Together with `environment_lock_hash` (Spec 02) these form the shared
 * replay base:
 *
 *   repository_revision + project_graph_revision + environment_lock_hash
 */
export interface RepositoryRevision {
  /** The committed revision, when the project is inside a git work tree. */
  readonly commit?: string;
  /**
   * A digest of the delivered state that is *not* in `commit`: modifications
   * to tracked files plus untracked, non-ignored files. Absent when the tree
   * matches `commit` exactly.
   *
   * A boolean `dirty` flag used to stand here, which made every modified tree
   * at one commit share the identity `git:<commit>+dirty`. The closure guard
   * compares these identifiers, so it could not tell two different delivered
   * states apart: deliver, review, change the same file again, and closure
   * still passed (the 19 September review's R02).
   */
  readonly workingTree?: string;
  /**
   * The identity used for provenance and replay checks:
   * `git:<commit>` for a clean tree, `git:<commit>+sha256:<hex>` for a
   * modified one, and `none` where no repository revision can be resolved.
   */
  readonly id: string;
}

/** Identity used when no repository revision can be resolved at all. */
export const NO_REPOSITORY_REVISION = "none";

/**
 * Paths excluded from the working-tree digest.
 *
 * Recording lifecycle progress and re-rendering the adapter are things the
 * runtime does *while* a Delivery is under review. Including them would make
 * a Review invalidate itself the moment the run advanced, so the digest
 * covers delivered input and not the runtime's own bookkeeping (Spec 01 §56
 * excludes execution state and adapter output from graph identity for the
 * same reason).
 */
export const DELIVERY_DIGEST_EXCLUDED = [
  ".pactwright/execution/",
  ".pactwright/.lock",
  ".claude/agents/",
  ".claude/commands/",
] as const;

function git(root: string, args: readonly string[]): string | undefined {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30_000,
    });
  } catch {
    return undefined;
  }
}

function excluded(path: string): boolean {
  return DELIVERY_DIGEST_EXCLUDED.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix,
  );
}

/**
 * A digest of everything delivered at `root` that `commit` does not already
 * describe: the content of tracked modifications, and the content of
 * untracked, non-ignored files.
 *
 * Untracked files count. An agent's new file is delivered input, and the old
 * identity ignored them entirely — a Delivery that only added files was
 * indistinguishable from a clean tree.
 *
 * Returns `undefined` when there is nothing outside the commit.
 */
function workingTreeDigest(root: string): string | undefined {
  // `diff HEAD` covers staged and unstaged modifications to tracked files.
  const diff = git(root, ["diff", "HEAD", "--"]) ?? "";
  const untracked = (git(root, ["ls-files", "--others", "--exclude-standard"]) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !excluded(line))
    .sort();

  // A diff naming only excluded paths is not a delivered change. Re-ask git
  // for a diff restricted to everything else rather than parsing the patch.
  const changed = (git(root, ["diff", "HEAD", "--name-only", "--"]) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !excluded(line))
    .sort();
  if (changed.length === 0 && untracked.length === 0) return undefined;

  const hash = createHash("sha256");
  hash.update("pactwright-delivery-digest-1\n");
  if (changed.length > 0) {
    const restricted = git(root, ["diff", "HEAD", "--", ...changed]);
    hash.update("tracked\n");
    hash.update(restricted ?? diff);
  }
  for (const path of untracked) {
    hash.update(`untracked ${path}\n`);
    const absolute = join(root, path);
    try {
      // A directory or an unreadable entry contributes its name only; the
      // listing above already records that it is present.
      if (statSync(absolute).isFile()) hash.update(readFileSync(absolute));
    } catch {
      hash.update("<unreadable>\n");
    }
  }
  return `sha256:${hash.digest("hex")}`;
}

/**
 * Resolves the repository revision of `root`. Fails soft: a project outside
 * a repository, or one whose VCS cannot be queried, resolves to
 * `NO_REPOSITORY_REVISION` rather than throwing. Replay is what must fail
 * explicitly on an unresolvable identity, not ordinary operation.
 */
export function repositoryRevision(root: string): RepositoryRevision {
  if (!existsSync(join(root, ".git")) && git(root, ["rev-parse", "--git-dir"]) === undefined) {
    return { id: NO_REPOSITORY_REVISION };
  }
  const commit = git(root, ["rev-parse", "HEAD"])?.trim();
  if (commit === undefined || commit.length === 0) return { id: NO_REPOSITORY_REVISION };
  const workingTree = workingTreeDigest(root);
  return workingTree === undefined
    ? { commit, id: `git:${commit}` }
    : { commit, workingTree, id: `git:${commit}+${workingTree}` };
}

/**
 * Whether `id` describes state that `commit` alone cannot reconstruct.
 *
 * Pinned replay must fail explicitly on one of these rather than resolve the
 * commit and call it equivalent (Spec 01 §56, Principle 18).
 */
export function isReconstructible(id: string): boolean {
  return id !== NO_REPOSITORY_REVISION && !id.includes("+sha256:");
}

/**
 * The shared replay base (§56). Each identity is recorded separately so a
 * replay check can say *which* one failed to reconstruct.
 */
export interface ReplayBase {
  readonly repositoryRevision: string;
  readonly projectGraphRevision: string;
  readonly environmentLockHash: string;
}

export function formatReplayBase(base: ReplayBase): string {
  return [
    `repository_revision: ${base.repositoryRevision}`,
    `project_graph_revision: ${base.projectGraphRevision}`,
    `environment_lock_hash: ${base.environmentLockHash}`,
  ].join("\n");
}
