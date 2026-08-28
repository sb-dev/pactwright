import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GENERATED_MARKER,
  renderClaudeCodeAdapter,
  writeAdapter,
  type RenderedFiles,
} from "./adapter/claude-code.js";
import { PactwrightError, type Problem } from "./errors.js";
import { loadProject, type Project } from "./loader.js";
import { assertPackComplete, type ResolvedPack } from "./pack/resolve.js";
import { projectPaths } from "./project.js";

/** `pactwright sync` result. */
export interface SyncReport {
  readonly ok: boolean;
  readonly root: string;
  /** Rendered files whose on-disk bytes differed (or were absent) before this sync. */
  readonly changed: readonly string[];
  /** Rendered files that were already byte-identical on disk. */
  readonly unchanged: readonly string[];
  /** Stale generated files the render no longer produces, deleted. */
  readonly removed: readonly string[];
  /**
   * Files inside the managed directories that carry no Pactwright marker, so
   * are not Pactwright's to remove. Reported, never deleted.
   */
  readonly kept: readonly string[];
  /**
   * Rendered paths already occupied by an unmarked file. The file is left
   * untouched and the sync fails, so the collision is resolved deliberately
   * rather than by overwriting user state.
   */
  readonly conflicts: readonly string[];
  /** Empty when `ok`. */
  readonly problems: readonly Problem[];
}

/**
 * The Distribution §8 GitHub-workflow rendering step. It is a seam in this
 * checkpoint: GitHub provisioning arrives in Checkpoint 2, so no workflow
 * files are rendered and nothing under `.github/` is ever Pactwright-managed
 * yet. When it activates it renders only files Pactwright explicitly owns
 * (e.g. `.github/workflows/pactwright*.yml`) — `sync` never claims
 * ownership of user-authored `.github/workflows/**`.
 */
export function renderGitHubWorkflows(project: Project, pack: ResolvedPack): RenderedFiles {
  void project;
  void pack;
  return new Map();
}

/**
 * Deterministic local synchronisation (Distribution §8): load configuration,
 * lock and extensions through the canonical loader, validate the required
 * capability union, assemble agents and skills from the resolved pack, and
 * render only the Pactwright-managed `.claude/` adapter surface. Enabled
 * extensions contribute through the same adapter process; in this checkpoint
 * their contribution is the capability union, since extension manifests
 * declare no renderable adapter content yet. Repeated sync with unchanged
 * inputs is byte-identical. Never throws for expected failures, and writes
 * nothing when resolution fails.
 *
 * Only files carrying the Pactwright marker are overwritten or removed, so a
 * hand-written file inside `.claude/agents` or `.claude/commands` survives
 * every sync.
 */
export function syncProject(root: string = process.cwd()): SyncReport {
  const paths = projectPaths(root);
  const failure = (problems: readonly Problem[]): SyncReport => ({
    ok: false,
    root: paths.root,
    changed: [],
    unchanged: [],
    removed: [],
    kept: [],
    conflicts: [],
    problems,
  });

  let project: Project;
  let pack: ResolvedPack;
  try {
    project = loadProject({ root: paths.root });
    pack = assertPackComplete(project);
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    return failure(error.problems);
  }

  const files = new Map([
    ...renderClaudeCodeAdapter(pack),
    ...renderGitHubWorkflows(project, pack),
  ]);

  // Compared before the write, or every rendered file would read back as
  // unchanged. Paths that turn out to collide with user state are dropped
  // afterwards: nothing was written there.
  const changed: string[] = [];
  const unchanged: string[] = [];
  for (const [relPath, content] of files) {
    const target = join(paths.root, relPath);
    if (existsSync(target) && readFileSync(target, "utf8") === content) {
      unchanged.push(relPath);
    } else {
      changed.push(relPath);
    }
  }

  const written = writeAdapter(paths.root, files);
  const conflicted = new Set(written.conflicts);

  // A collision with an unmarked file is reported, never resolved by
  // overwriting: `sync` fails so the state is visible to the user and to CI
  // (Distribution §14 — leave ambiguous state intact and report it).
  const problems: Problem[] = written.conflicts.map((path) => ({
    code: "unmanaged-conflict",
    message: `"${path}" is not a Pactwright-generated file, so it was not overwritten: delete it, or restore its "${GENERATED_MARKER}" banner, then run \`pactwright sync\` again`,
    path,
  }));

  return {
    ok: problems.length === 0,
    root: paths.root,
    changed: changed.filter((path) => !conflicted.has(path)).sort(),
    unchanged: unchanged.filter((path) => !conflicted.has(path)).sort(),
    removed: written.removed,
    kept: written.kept,
    conflicts: written.conflicts,
    problems,
  };
}
