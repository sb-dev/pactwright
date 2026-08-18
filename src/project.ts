import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { PactwrightError } from "./errors.js";

/** File and directory layout of a Pactwright project (Delivery Graph §4). */
export interface ProjectPaths {
  readonly root: string;
  readonly pactwrightDir: string;
  readonly config: string;
  readonly lifecycle: string;
  readonly lock: string;
  readonly specsDir: string;
  readonly nodesDir: string;
  readonly edges: string;
}

export const CONFIG_FILE = ".pactwright/config.yml";
export const LIFECYCLE_FILE = ".pactwright/lifecycle.yml";
export const LOCK_FILE = ".pactwright/lock.yml";
export const NODES_DIR = "specs/nodes";
export const EDGES_FILE = "specs/graph/edges.yml";

export function projectPaths(root: string): ProjectPaths {
  const absoluteRoot = resolve(root);
  return {
    root: absoluteRoot,
    pactwrightDir: join(absoluteRoot, ".pactwright"),
    config: join(absoluteRoot, CONFIG_FILE),
    lifecycle: join(absoluteRoot, LIFECYCLE_FILE),
    lock: join(absoluteRoot, LOCK_FILE),
    specsDir: join(absoluteRoot, "specs"),
    nodesDir: join(absoluteRoot, NODES_DIR),
    edges: join(absoluteRoot, EDGES_FILE),
  };
}

/**
 * Walks up from `cwd` until a directory containing `.pactwright/config.yml`
 * is found. Throws when no Pactwright project encloses `cwd`.
 */
export function findProjectRoot(cwd: string = process.cwd()): string {
  let current = resolve(cwd);
  for (;;) {
    if (existsSync(join(current, CONFIG_FILE))) return current;
    const parent = dirname(current);
    if (parent === current) {
      throw new PactwrightError(
        "project-not-found",
        `no Pactwright project found from ${resolve(cwd)} (expected ${CONFIG_FILE} in this directory or a parent)`,
      );
    }
    current = parent;
  }
}
