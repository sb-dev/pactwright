import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { MANAGED_DIRS } from "./adapter/claude-code.js";
import { tempSibling } from "./atomic.js";
import type { Problem } from "./errors.js";
import { serialiseEdges } from "./graph/mutations.js";
import {
  CONFIG_FILE,
  EDGES_FILE,
  LIFECYCLE_FILE,
  LOCK_FILE,
  NODES_DIR,
  projectPaths,
} from "./project.js";
import { loadConfig } from "./config/config.js";
import { validateProject } from "./validate.js";
import { addExtension } from "./extension/manage.js";
import { useAgentPack } from "./pack/select.js";
import { syncProject } from "./sync.js";

/**
 * Default `.pactwright/config.yml` (Distribution §3).
 *
 * It deliberately names **no** Agent Pack. A plain `init` creates a scaffold,
 * not an activated execution environment: Pactwright never selects a pack
 * silently, so the project stays inert until `agent-pack use` names one
 * (Checkpoint 1 Step 14). `github.enabled` stays `false` until GitHub
 * provisioning exists (Distribution §§9–14); `init` creates no `.github/`
 * content.
 */
export const CONFIG_TEMPLATE = `version: 1

# No agent pack is selected yet. Choose one explicitly:
#   pactwright agent-pack use @pactwright/standard

adapter:
  type: claude-code

extensions: {}

github:
  enabled: false
`;

/** Default `.pactwright/lifecycle.yml`: the human-gated core Delivery lifecycle (Delivery Graph §17). */
export const LIFECYCLE_TEMPLATE = `version: 2

# Execution policy for the Contract-crafting responsibilities. These are not
# lifecycle-shape steps: they sit upstream of the Brief (Spec 01 §27).
responsibilities:
  capture-intent:
    execution: manual
  propose-contracts:
    execution: automatic
  approve-contract:
    execution: manual
    actor: human
  write-brief:
    execution: automatic

# The fulfilment shape governing Brief -> Evidence.
shape:
  id: direct
  steps:
    - name: delivery
      kind: delivery
      execution: automatic
    - name: review
      kind: review
      execution: automatic
    - name: evidence
      kind: evidence
      execution: automatic
  transitions:
    # A Review may route back to Delivery, bounded by policy (Spec 01 §34).
    - from: review
      to: delivery
      max_iterations: 3
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
  /**
   * True when this is a scaffold with no Agent Pack selected. It is a valid
   * starting point, not a complete activated execution environment.
   */
  readonly scaffold?: true;
}

/**
 * Initialises the Pactwright-owned core structure (Distribution §§2–3) in
 * `root`: configuration, lifecycle, the empty graph, the empty adapter
 * directories, then the resolved `.pactwright/lock.yml`. Existing paths are
 * never read or overwritten — each is reported `skipped` — so re-running in
 * an initialised repository changes nothing. Finishes by validating the
 * resulting project state; never throws for expected failures.
 */
export interface InitOptions {
  /**
   * The Agent Pack to select, as `agent-pack use` takes it. Required to
   * activate anything: with no supplied choice `init` leaves a scaffold and
   * activates no dependent feature (Checkpoint 1 Step 14).
   */
  readonly agentPack?: string;
  /**
   * Extensions to install as part of one-shot setup. Each needs an explicit
   * `agentPack`; composing without a chosen pack is refused rather than
   * defaulted.
   */
  readonly withExtensions?: readonly string[];
}

export function initProject(root: string = process.cwd(), options: InitOptions = {}): InitReport {
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

  const wanted = options.withExtensions ?? [];
  // A pack the project already selected is its choice, and re-running init
  // must neither re-select it nor treat the project as an inert scaffold.
  const alreadySelected = loadConfig(paths.config).value?.agentPack !== undefined;

  if (options.agentPack === undefined) {
    if (alreadySelected && wanted.length === 0) {
      problems.push(...validateProject({ root: paths.root }).problems);
      return { ok: problems.length === 0, root: paths.root, entries, problems };
    }
    if (wanted.length > 0) {
      // Composing needs a pack, and defaulting to one would be exactly the
      // silent selection Step 14 forbids.
      problems.push({
        code: "no-agent-pack-selected",
        message: `installing ${wanted.join(", ")} needs an explicit agent pack; supply one so the environment is activated deliberately`,
        path: paths.config,
      });
      return failed();
    }
    // A scaffold, honestly reported as one: no lock, because nothing is
    // resolved, and no claim that this is a complete execution environment.
    return {
      ok: problems.length === 0,
      root: paths.root,
      entries,
      problems,
      scaffold: true,
    };
  }

  // One-shot setup composes the *same* operations as explicit setup: pack
  // selection, then extension installation, then sync. It reuses
  // `useAgentPack` rather than resolving a second time, so the two paths
  // cannot drift apart.
  const selected = useAgentPack(paths.root, options.agentPack);
  if (!selected.ok) {
    problems.push(...selected.problems);
    return failed();
  }
  entries.push({ path: LOCK_FILE, kind: "file", action: "created" });

  for (const id of wanted) {
    const added = addExtension(paths.root, id);
    if (!added.ok) {
      problems.push(...added.problems);
      return failed();
    }
  }

  if (wanted.length > 0) {
    const synced = syncProject(paths.root);
    if (!synced.ok) {
      problems.push(...synced.problems);
      return failed();
    }
  }

  problems.push(...validateProject({ root: paths.root }).problems);
  return { ok: problems.length === 0, root: paths.root, entries, problems };
}
