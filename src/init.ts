import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { MANAGED_DIRS } from "./adapter/claude-code.js";
import { tempSibling } from "./atomic.js";
import { loadConfig } from "./config/config.js";
import type { Problem } from "./errors.js";
import { serialiseEdges } from "./graph/mutations.js";
import { resolveDesiredState, writeLock } from "./pack/resolve.js";
import {
  CONFIG_FILE,
  EDGES_FILE,
  LIFECYCLE_FILE,
  LOCK_FILE,
  NODES_DIR,
  projectPaths,
} from "./project.js";
import { validateProject } from "./validate.js";

/**
 * Default `.pactwright/config.yml` (Distribution §3): the `@pactwright/standard`
 * pack with Claude Code defaults. `github.enabled` stays `false` until GitHub
 * provisioning exists (Distribution §§9–14); `init` creates no `.github/`
 * content.
 */
export const CONFIG_TEMPLATE = `version: 1

agent_pack:
  source: "@pactwright/standard"
  version: "^0.0.0"

adapter:
  type: claude-code

extensions: {}

github:
  enabled: false
`;

/** Default `.pactwright/lifecycle.yml`: the human-gated core Delivery lifecycle (Delivery Graph §17). */
export const LIFECYCLE_TEMPLATE = `version: 1

stages:
  capture-intent:
    execution: manual
  propose-contracts:
    execution: automatic
  approve-contract:
    execution: manual
    actor: human
  write-brief:
    execution: automatic
  deliver-brief:
    execution: automatic
  review:
    execution: automatic
  prepare-evidence:
    execution: automatic
`;

/** Keeps `specs/nodes/` tracked by git; `loadNodes` reads only `*.md` and never sees it. */
const NODES_KEEP_FILE = `${NODES_DIR}/.gitkeep`;

/**
 * The files `init` owns, in report order: relative path → content. The lock
 * is not a template — it is resolved from the on-disk configuration after
 * these files exist.
 */
export function initTemplates(): ReadonlyMap<string, string> {
  return new Map([
    [CONFIG_FILE, CONFIG_TEMPLATE],
    [LIFECYCLE_FILE, LIFECYCLE_TEMPLATE],
    [NODES_KEEP_FILE, ""],
    [EDGES_FILE, serialiseEdges([])],
  ]);
}

/**
 * Directories `init` creates empty: the Claude Code adapter surface, filled
 * by `pactwright sync` (Distribution §8) — `init` never copies runtime
 * scripts, agents or commands into the repository (Distribution §2).
 */
export const INIT_DIRS: readonly string[] = MANAGED_DIRS;

/** One path `init` considered: what it is and what happened to it. */
export interface InitEntry {
  /** Repository-relative path, e.g. `.pactwright/config.yml`. */
  readonly path: string;
  readonly kind: "file" | "dir";
  /** `skipped` means the path already existed and was left untouched. */
  readonly action: "created" | "skipped";
}

/** `pactwright init` result. */
export interface InitReport {
  readonly ok: boolean;
  readonly root: string;
  /** Every path considered, in order; empty `problems` when `ok`. */
  readonly entries: readonly InitEntry[];
  readonly problems: readonly Problem[];
}

/**
 * Initialises the Pactwright-owned core structure (Distribution §§2–3) in
 * `root`: configuration, lifecycle, the empty graph, the empty adapter
 * directories, then the resolved `.pactwright/lock.yml`. Existing paths are
 * never read or overwritten — each is reported `skipped` — so re-running in
 * an initialised repository changes nothing. Finishes by validating the
 * resulting project state; never throws for expected failures.
 */
export function initProject(root: string = process.cwd()): InitReport {
  const paths = projectPaths(root);
  const entries: InitEntry[] = [];
  const problems: Problem[] = [];
  const failed = (): InitReport => ({ ok: false, root: paths.root, entries, problems });

  for (const [relPath, content] of initTemplates()) {
    const target = join(paths.root, relPath);
    if (existsSync(target)) {
      entries.push({ path: relPath, kind: "file", action: "skipped" });
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    const temp = tempSibling(target);
    writeFileSync(temp, content, "utf8");
    renameSync(temp, target);
    entries.push({ path: relPath, kind: "file", action: "created" });
  }

  for (const relPath of INIT_DIRS) {
    const target = join(paths.root, relPath);
    if (existsSync(target)) {
      entries.push({ path: relPath, kind: "dir", action: "skipped" });
    } else {
      mkdirSync(target, { recursive: true });
      entries.push({ path: relPath, kind: "dir", action: "created" });
    }
  }

  // The lock records exact resolved state (Distribution §3), so a fresh one
  // is derived from whatever configuration is on disk — which after the step
  // above is either the template or pre-existing user content. An existing
  // lock is trusted as-is; `resolveDesiredState` is used rather than
  // `resolveAndLock` because the latter loads the full project, which
  // requires the lock to already exist.
  if (existsSync(paths.lock)) {
    entries.push({ path: LOCK_FILE, kind: "file", action: "skipped" });
  } else {
    const config = loadConfig(paths.config);
    if (config.value === undefined) {
      problems.push(...config.problems);
      return failed();
    }
    const resolved = resolveDesiredState({ root: paths.root, config: config.value });
    if (resolved.value === undefined) {
      problems.push(...resolved.problems);
      return failed();
    }
    writeLock(paths.lock, resolved.value.lock);
    entries.push({ path: LOCK_FILE, kind: "file", action: "created" });
  }

  problems.push(...validateProject({ root: paths.root }).problems);
  return { ok: problems.length === 0, root: paths.root, entries, problems };
}
