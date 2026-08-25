import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import type { Edge } from "../graph/edges.js";
import { loadEdges } from "../graph/edges.js";
import { serialiseEdges } from "../graph/mutations.js";
import { loadNodes } from "../graph/nodes.js";
import { graphRevision } from "../graph/revision.js";
import { lockEntriesFor, serialiseLock, type ResolvedPack } from "../pack/resolve.js";
import { CONFIG_FILE, EDGES_FILE, LIFECYCLE_FILE, LOCK_FILE, NODES_DIR } from "../project.js";

/** Every seeded node carries the same fixed date: fixtures are deterministic. */
export const SEED_CREATED = "2026-08-20";

/** The §17 default lifecycle configuration seeded into every sandbox. */
const SANDBOX_LIFECYCLE = `version: 1

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

function write(root: string, relativePath: string, content: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

/**
 * A throw-away sandbox project for one evaluation case: a complete,
 * loadable Pactwright project whose config selects the pack under
 * evaluation by its absolute path and whose graph starts empty. The caller
 * removes the directory when the case is done.
 */
export function createSandbox(pack: ResolvedPack, workDir: string = tmpdir()): string {
  const root = mkdtempSync(join(workDir, "pactwright-eval-"));
  write(
    root,
    CONFIG_FILE,
    [
      "version: 1",
      "",
      "agent_pack:",
      `  source: ${JSON.stringify(pack.dir)}`,
      "",
      "adapter:",
      "  type: claude-code",
      "",
      "extensions: {}",
      "",
      "github:",
      "  enabled: false",
      "",
    ].join("\n"),
  );
  write(root, LIFECYCLE_FILE, SANDBOX_LIFECYCLE);
  write(root, LOCK_FILE, serialiseLock(lockEntriesFor(pack)));
  mkdirSync(join(root, NODES_DIR), { recursive: true });
  write(root, EDGES_FILE, "edges: []\n");
  return root;
}

export interface SeedNode {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  /** Extra frontmatter fields, e.g. a decision's `decided_by`/`outcome`. */
  readonly fields?: Readonly<Record<string, string>>;
}

/** Serialises a seed node in the canonical node-file shape. */
export function seedNodeFile(node: SeedNode): string {
  const fields = Object.entries(node.fields ?? {})
    .map(([key, value]) => `${key}: ${value}\n`)
    .join("");
  return `---\nid: ${node.id}\ntype: ${node.type}\ntitle: ${node.title}\ncreated: ${SEED_CREATED}\n${fields}---\n\n${node.body}\n`;
}

export function seedNode(root: string, node: SeedNode): void {
  write(root, `${NODES_DIR}/${node.id}.md`, seedNodeFile(node));
}

export function seedEdges(root: string, edges: readonly Edge[]): void {
  write(root, EDGES_FILE, serialiseEdges(edges));
}

/** Writes an ordinary repository file into the sandbox. */
export function seedFile(root: string, relativePath: string, content: string): void {
  write(root, relativePath, content);
}

/** Sandbox-relative POSIX path → sha256 of the file's bytes. */
export type FileSnapshot = ReadonlyMap<string, string>;

function walk(dir: string, base: string, into: Map<string, string>): void {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, base, into);
    else if (entry.isFile()) {
      const key = relative(base, absolute).split(sep).join("/");
      into.set(key, createHash("sha256").update(readFileSync(absolute)).digest("hex"));
    }
  }
}

/** Hashes every file under `root`; the observation diff comes from two snapshots. */
export function snapshotFiles(root: string): FileSnapshot {
  const snapshot = new Map<string, string>();
  walk(root, root, snapshot);
  return snapshot;
}

/** Paths whose bytes changed, appeared or disappeared between two snapshots, sorted. */
export function diffSnapshots(before: FileSnapshot, after: FileSnapshot): readonly string[] {
  const changed = new Set<string>();
  for (const [key, hash] of before) if (after.get(key) !== hash) changed.add(key);
  for (const [key, hash] of after) if (before.get(key) !== hash) changed.add(key);
  return [...changed].sort();
}

/**
 * The sandbox's deterministic Project Graph revision (Delivery Graph §5)
 * over whatever canonical state currently parses. Load problems are
 * deliberately ignored here: a candidate that corrupts the graph is caught
 * by the changed-files observation, while the revision proves whether the
 * canonical state it left behind still equals the seeded state.
 */
export function sandboxRevision(root: string): string {
  const nodes = loadNodes(join(root, NODES_DIR));
  const edges = loadEdges(join(root, EDGES_FILE));
  return graphRevision({ nodes: nodes.nodes, edges: edges.edges });
}
