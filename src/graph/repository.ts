import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
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
   * True when tracked files differ from `commit`. A dirty tree is still a
   * usable execution input base — it is what the agent saw — but it is not
   * reconstructible from `commit` alone, which is what `dirty` records.
   */
  readonly dirty: boolean;
  /**
   * The identity used for provenance and replay checks:
   * `git:<commit>` for a clean tree, `git:<commit>+dirty` for a modified
   * one, and `none` where no repository revision can be resolved.
   */
  readonly id: string;
}

/** Identity used when no repository revision can be resolved at all. */
export const NO_REPOSITORY_REVISION = "none";

function git(root: string, args: readonly string[]): string | undefined {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Resolves the repository revision of `root`. Fails soft: a project outside
 * a repository, or one whose VCS cannot be queried, resolves to
 * `NO_REPOSITORY_REVISION` rather than throwing. Replay is what must fail
 * explicitly on an unresolvable identity, not ordinary operation.
 */
export function repositoryRevision(root: string): RepositoryRevision {
  if (!existsSync(join(root, ".git")) && git(root, ["rev-parse", "--git-dir"]) === undefined) {
    return { dirty: false, id: NO_REPOSITORY_REVISION };
  }
  const commit = git(root, ["rev-parse", "HEAD"]);
  if (commit === undefined) return { dirty: false, id: NO_REPOSITORY_REVISION };
  // `--quiet --exit-code` reports "tracked files differ from HEAD" without
  // printing the diff; untracked files are deliberately not dirt, since they
  // are not part of the committed input base being described.
  const clean = git(root, ["diff", "--quiet", "--exit-code", "HEAD"]) !== undefined;
  const dirty = !clean;
  return { commit, dirty, id: `git:${commit}${dirty ? "+dirty" : ""}` };
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
