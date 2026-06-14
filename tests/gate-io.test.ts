import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "../tools/loader.ts";
import { addedEdgeIds, addedNodeIds, resolveBase, runGate } from "../tools/gate.ts";
import { changedFiles } from "../tools/gitdiff.ts";

// End-to-end coverage for the git adapter (`resolveBase` / `addedEdgeIds` /
// `addedNodeIds` / `runGate`) and the `spec:gate` CLI — the layer that the pure
// `evaluateGate` unit tests in gate.test.ts cannot reach, and where the
// admitted base-ref bug lived. Each test builds a throwaway git repo with a
// committed base graph, then mutates the working tree to model a PR.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "tools", "spec.ts");
// Reuse the good-waives fixture's schema files so loadSpec() can parse the repo.
const schemaSrc = path.join(repoRoot, "tests", "fixtures", "good-waives", "specs", "schema");

interface Edge {
  id: string;
  source: string;
  type: string;
  target: string;
}

function git(cwd: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout;
}

function writeNode(dir: string, id: string, type: string, fields: Record<string, string>): void {
  const lines = [`id: ${id}`, `type: ${type}`, ...Object.entries(fields).map(([k, v]) => `${k}: ${v}`)];
  fs.writeFileSync(path.join(dir, "specs", "nodes", `${id}.md`), `---\n${lines.join("\n")}\n---\n\nbody\n`);
}

function writeEdges(dir: string, edges: Edge[]): void {
  const lines = ["edges:"];
  for (const e of edges) {
    lines.push(`  - id: ${e.id}`, `    source: ${e.source}`, `    type: ${e.type}`, `    target: ${e.target}`, `    created: 2026-06-13`);
  }
  fs.writeFileSync(path.join(dir, "specs", "graph", "edges.yaml"), lines.join("\n") + "\n");
}

const DECOMPOSES: Edge = { id: "edge-dec-0001", source: "brief-base-0002", type: "decomposes", target: "contract-base-0001" };

/** A temp git repo (inside repoRoot so `--import tsx` resolves node_modules)
 * with a committed base graph: an approved contract + a brief decomposing it. */
function makeBaseRepo(t: { after(fn: () => void): void }): { dir: string; base: string } {
  const dir = fs.mkdtempSync(path.join(repoRoot, ".tmp-gate-io-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "specs", "nodes"), { recursive: true });
  fs.mkdirSync(path.join(dir, "specs", "graph"), { recursive: true });
  fs.cpSync(schemaSrc, path.join(dir, "specs", "schema"), { recursive: true });
  writeNode(dir, "contract-base-0001", "contract", { title: "C", status: "approved", created: "2026-06-13" });
  writeNode(dir, "brief-base-0002", "brief", { title: "B", status: "implemented", created: "2026-06-13" });
  writeEdges(dir, [DECOMPOSES]);
  git(dir, ["init", "-q"]);
  git(dir, ["config", "user.email", "t@t.t"]);
  git(dir, ["config", "user.name", "t"]);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-qm", "base"]);
  return { dir, base: git(dir, ["rev-parse", "HEAD"]).trim() };
}

/** Run `fn` with cwd = the repo and GATE_BASE set (the adapter reads both from
 * the process). Restores cwd/env even on throw; top-level tests run serially so
 * this is safe within the file. */
function inRepo<T>(dir: string, gateBase: string, fn: () => T): T {
  const prevCwd = process.cwd();
  const prevBase = process.env.GATE_BASE;
  try {
    process.chdir(dir);
    process.env.GATE_BASE = gateBase;
    return fn();
  } finally {
    process.chdir(prevCwd);
    if (prevBase === undefined) delete process.env.GATE_BASE;
    else process.env.GATE_BASE = prevBase;
  }
}

function gateCli(dir: string, gateBase: string, extraPath?: string) {
  return spawnSync(process.execPath, ["--import", "tsx", cli, "gate"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GATE_BASE: gateBase, ...(extraPath ? { PATH: extraPath } : {}) },
  });
}

test("resolveBase throws on an unresolvable GATE_BASE", (t) => {
  const { dir } = makeBaseRepo(t);
  inRepo(dir, "nope", () => assert.throws(() => resolveBase(), /does not resolve to a commit/));
});

test("resolveBase returns the base commit when GATE_BASE is valid", (t) => {
  const { dir, base } = makeBaseRepo(t);
  inRepo(dir, base, () => assert.equal(resolveBase(), base));
});

test("addedEdgeIds/addedNodeIds report only what the PR adds over the base", (t) => {
  const { dir, base } = makeBaseRepo(t);
  // The "PR": add an evidence node + an evidences edge in the working tree.
  writeNode(dir, "evidence-pr-0003", "evidence", { title: "E", status: "final", created: "2026-06-13" });
  writeEdges(dir, [DECOMPOSES, { id: "edge-ev-0002", source: "evidence-pr-0003", type: "evidences", target: "brief-base-0002" }]);
  inRepo(dir, base, () => {
    const spec = loadSpec();
    assert.deepEqual([...addedEdgeIds(spec, base)], ["edge-ev-0002"]); // decomposes was present at base
    assert.deepEqual([...addedNodeIds(spec, base)], ["evidence-pr-0003"]); // contract/brief were present at base
  });
});

test("changedFiles lists the files a follow-up commit adds/modifies over the base", (t) => {
  const { dir, base } = makeBaseRepo(t);
  // changedFiles diffs commit-to-commit (<base>...HEAD), not the working tree,
  // so the "PR" must be a real commit on top of the base — modify a tracked
  // node and add a new file, then commit.
  fs.appendFileSync(path.join(dir, "specs", "nodes", "contract-base-0001.md"), "\nedit\n");
  fs.mkdirSync(path.join(dir, "tools"), { recursive: true });
  fs.writeFileSync(path.join(dir, "tools", "added.txt"), "new\n");
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-qm", "pr"]);
  inRepo(dir, base, () => {
    assert.deepEqual(changedFiles(base).sort(), ["specs/nodes/contract-base-0001.md", "tools/added.txt"]);
  });
});

test("runGate passes when the PR adds an evidences edge to an approved contract", (t) => {
  const { dir, base } = makeBaseRepo(t);
  writeNode(dir, "evidence-pr-0003", "evidence", { title: "E", status: "final", created: "2026-06-13" });
  writeEdges(dir, [DECOMPOSES, { id: "edge-ev-0002", source: "evidence-pr-0003", type: "evidences", target: "brief-base-0002" }]);
  inRepo(dir, base, () => {
    const result = runGate(loadSpec());
    assert.equal(result.pass, true, result.reason);
  });
});

test("runGate passes when the PR adds an override waiving pr-evidence", (t) => {
  const { dir, base } = makeBaseRepo(t);
  writeNode(dir, "override-pr-0004", "override", { title: "W", reason: "hotfix", approved_by: "sb-dev", expires: "2099-01-01" });
  writeEdges(dir, [DECOMPOSES, { id: "edge-waives-0005", source: "override-pr-0004", type: "waives", target: "pr-evidence" }]);
  inRepo(dir, base, () => {
    const result = runGate(loadSpec());
    assert.equal(result.pass, true, result.reason);
  });
});

test("runGate fails on a code-only PR that adds no evidence and no override", (t) => {
  const { dir, base } = makeBaseRepo(t);
  inRepo(dir, base, () => {
    const result = runGate(loadSpec());
    assert.equal(result.pass, false, result.reason);
  });
});

test("spec:gate CLI exits 0 and prints PASS when evidence is added", (t) => {
  const { dir, base } = makeBaseRepo(t);
  writeNode(dir, "evidence-pr-0003", "evidence", { title: "E", status: "final", created: "2026-06-13" });
  writeEdges(dir, [DECOMPOSES, { id: "edge-ev-0002", source: "evidence-pr-0003", type: "evidences", target: "brief-base-0002" }]);
  const r = gateCli(dir, base);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /PASS/);
});

test("spec:gate CLI exits 1 and prints FAIL on a code-only diff", (t) => {
  const { dir, base } = makeBaseRepo(t);
  const r = gateCli(dir, base);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /FAIL/);
});

test("spec:gate CLI exits 1 with a clear error on an unresolvable base", (t) => {
  const { dir } = makeBaseRepo(t);
  const r = gateCli(dir, "nope");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /does not resolve to a commit/);
});

test("spec:gate CLI fails CLOSED when git errors mid-run (does not pass open)", (t) => {
  const { dir, base } = makeBaseRepo(t);
  // A fake `git` that lets `rev-parse` succeed (so resolveBase passes) but fails
  // every other subcommand — modeling an infra error after the base is verified.
  // The adapter must THROW (exit 1), not treat the base as empty and pass.
  const realGit = spawnSync("which", ["git"], { encoding: "utf8" }).stdout.trim();
  assert.ok(realGit, "could not locate real git for the fail-closed test");
  const binDir = fs.mkdtempSync(path.join(repoRoot, ".tmp-gate-bin-"));
  t.after(() => fs.rmSync(binDir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(binDir, "git"),
    `#!/bin/sh\nif [ "$1" = "rev-parse" ]; then exec ${realGit} "$@"; fi\nexit 1\n`,
    { mode: 0o755 },
  );
  const r = gateCli(dir, base, `${binDir}:${process.env.PATH ?? ""}`);
  assert.equal(r.status, 1, `expected fail-closed exit 1, got status ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.doesNotMatch(r.stdout, /PASS/, "gate must not pass when git is broken");
});
