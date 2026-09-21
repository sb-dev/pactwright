/**
 * A2-G probe support: disposable Pactwright project fixtures.
 *
 * Every probe builds its own project in a fresh temporary directory and
 * inspects the durable effect on disk itself, rather than trusting the
 * return value of the call under test. Nothing here repairs the reference.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const REFERENCE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export interface FixtureOptions {
  /** Initialise a git repository in the fixture. Default true. */
  readonly git?: boolean;
  /** Seed `specs/` from the reference's own graph. Default false (empty graph). */
  readonly seedGraph?: boolean;
}

/** Creates a loadable Pactwright project in a fresh temporary directory. */
export function makeProject(name: string, options: FixtureOptions = {}): string {
  const root = mkdtempSync(join(tmpdir(), `a2g-${name}-`));
  mkdirSync(join(root, ".pactwright"), { recursive: true });
  for (const file of ["config.yml", "lifecycle.yml", "lock.yml"]) {
    cpSync(join(REFERENCE_ROOT, ".pactwright", file), join(root, ".pactwright", file));
  }
  if (options.seedGraph === true) {
    cpSync(join(REFERENCE_ROOT, "specs"), join(root, "specs"), { recursive: true });
  } else {
    mkdirSync(join(root, "specs", "nodes"), { recursive: true });
    mkdirSync(join(root, "specs", "graph"), { recursive: true });
    writeFileSync(join(root, "specs", "graph", "edges.yml"), "edges: []\n", "utf8");
  }
  if (options.git !== false) initGit(root);
  return root;
}

export function initGit(root: string): void {
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "probe@example.invalid"]);
  git(root, ["config", "user.name", "A2-G probe"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "fixture"]);
}

export function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function read(path: string): string {
  return readFileSync(path, "utf8");
}

/** Records one probe observation in the shared report format. */
export interface Observation {
  readonly id: string;
  readonly expected: string;
  readonly actual: string;
  readonly status: "executed-pass" | "executed-fail";
}

const observations: Observation[] = [];

export function observe(id: string, expected: string, actual: string, holds: boolean): void {
  const status = holds ? "executed-pass" : "executed-fail";
  observations.push({ id, expected, actual, status });
  console.log(`${status}  ${id}`);
  console.log(`    expected: ${expected}`);
  console.log(`    actual:   ${actual}`);
}

export function summary(): void {
  const failed = observations.filter((o) => o.status === "executed-fail").length;
  console.log(`\n${observations.length} observations, ${failed} executed-fail`);
}

/** A deterministic PRNG, so a generated counterexample is reproducible from its seed. */
export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
