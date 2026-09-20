import { after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { loadEdges } from "../src/graph/edges.js";
import { withRepositoryLock, writerLockPath } from "../src/graph/writer-lock.js";
import { makeTempProject, repoRoot } from "./helpers.js";

/**
 * The repository writer lock (§10).
 *
 * `commitGraphChange` compared the planned-against graph revision with a
 * fresh load and *then* renamed a sequence of files: two processes could both
 * pass the comparison before either renamed, and the second wholesale
 * `edges.yml` rewrite dropped the first's edge. The review traced this by
 * inspection rather than reproducing it; the first test below reproduces the
 * write race directly.
 */

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const WORKERS = 4;

test("writer lock: concurrent writers all land their edges", async () => {
  const root = project();
  const worker = path.join(root, "worker.mjs");
  // Real processes: the race is between operating-system processes, so an
  // in-process test could never exercise it. Each worker creates an Intent
  // and a Decision resolving it, so every worker contributes an edge — the
  // wholesale `edges.yml` rewrite is exactly what a lost update drops.
  writeFileSync(
    worker,
    [
      `import { createIntent, recordDecision } from ${JSON.stringify(
        path.join(repoRoot, "src/graph/mutations.ts"),
      )};`,
      `const [root, title] = process.argv.slice(2);`,
      `const intent = createIntent(root, { title, body: "Concurrent write probe." });`,
      `recordDecision(root, {`,
      `  intentId: intent.id,`,
      `  outcome: "reject",`,
      `  decidedBy: "human:probe",`,
      `  body: "Rejected by the concurrency probe.",`,
      `});`,
    ].join("\n"),
    "utf8",
  );

  const titles = Array.from({ length: WORKERS }, (_, i) => `Concurrent write ${i}`);
  const children = titles.map(
    (title) =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(process.execPath, ["--import", "tsx", worker, root, title], {
          cwd: repoRoot,
          stdio: ["ignore", "ignore", "pipe"],
        });
        let stderr = "";
        child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
        child.on("error", reject);
        child.on("close", (code) =>
          code === 0 ? resolve() : reject(new Error(`worker "${title}" exited ${code}: ${stderr}`)),
        );
      }),
  );
  await Promise.all(children);

  const edges = loadEdges(path.join(root, "specs", "graph", "edges.yml"));
  assert.deepEqual(edges.problems, []);
  const resolves = edges.edges.filter((edge) => edge.type === "resolves");
  assert.equal(
    resolves.length,
    WORKERS,
    "every concurrent writer's edge survived the wholesale edges.yml rewrite",
  );
  assert.equal(existsSync(writerLockPath(root)), false, "no worker left the lock held");
});

test("writer lock: a live holder blocks and then reports repository-locked", () => {
  const root = project();
  const lock = writerLockPath(root);
  // This process is live by definition, so a held lock from another "process"
  // id we know is alive is the blocking case.
  writeFileSync(
    lock,
    `${JSON.stringify({ pid: process.pid, host: hostname(), startedAt: Date.now() })}\n`,
    "utf8",
  );
  assert.throws(
    () => withRepositoryLock(root, () => "never", { waitMs: 50 }),
    (error: unknown) => error instanceof PactwrightError && error.code === "repository-locked",
  );
  // Refusing leaves the holder's lock alone.
  assert.ok(existsSync(lock));
  rmSync(lock, { force: true });
});

test("writer lock: a dead holder's lock is reclaimed and reported", () => {
  const root = project();
  const lock = writerLockPath(root);
  // A pid that exited: spawn a process and wait for it, then reuse its id.
  const dead = Number(
    execFileSync(process.execPath, ["-e", "process.stdout.write(String(process.pid))"], {
      encoding: "utf8",
    }),
  );
  writeFileSync(
    lock,
    `${JSON.stringify({ pid: dead, host: hostname(), startedAt: Date.now() })}\n`,
    "utf8",
  );

  const problems: string[] = [];
  const result = withRepositoryLock(root, () => "ran", {
    waitMs: 50,
    onProblem: (problem) => problems.push(problem.code),
  });
  assert.equal(result, "ran");
  assert.deepEqual(problems, ["stale-writer-lock"]);
  assert.equal(existsSync(lock), false, "the lock is released afterwards");
});

test("writer lock: an over-age lock is reclaimed even from a live pid", () => {
  const root = project();
  const lock = writerLockPath(root);
  writeFileSync(
    lock,
    `${JSON.stringify({ pid: process.pid, host: hostname(), startedAt: Date.now() - 600_000 })}\n`,
    "utf8",
  );
  const problems: string[] = [];
  withRepositoryLock(root, () => undefined, {
    waitMs: 50,
    staleAfterMs: 1_000,
    onProblem: (problem) => problems.push(problem.code),
  });
  assert.deepEqual(problems, ["stale-writer-lock"]);
});

test("writer lock: the lock is released when the body throws", () => {
  const root = project();
  const lock = writerLockPath(root);
  assert.throws(() => {
    withRepositoryLock(root, () => {
      throw new Error("boom");
    });
  }, /boom/);
  assert.equal(existsSync(lock), false);
});

test("writer lock: a nested take reuses the held lock instead of deadlocking", () => {
  const root = project();
  // A typed mutation holds the lock around load → validate → write → reload,
  // and the execution-state writes inside it take it again.
  const result = withRepositoryLock(root, () =>
    withRepositoryLock(root, () => "nested", { waitMs: 50 }),
  );
  assert.equal(result, "nested");
  assert.equal(existsSync(writerLockPath(root)), false);
});
