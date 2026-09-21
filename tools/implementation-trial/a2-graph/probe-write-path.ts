/**
 * A2-G probe: the shared graph write path — the writer lock that guards it,
 * and the durable effects a mutation leaves behind.
 */
import { existsSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { PactwrightError } from "../../../src/errors.js";
import { createIntent } from "../../../src/graph/mutations.js";
import { writerLockPath, withRepositoryLock } from "../../../src/graph/writer-lock.js";
import { makeProject, observe, summary } from "./fixture.js";

const elapsed = (fn: () => void): { ms: number; error?: Error } => {
  const start = Date.now();
  try {
    fn();
    return { ms: Date.now() - start };
  } catch (error) {
    return { ms: Date.now() - start, error: error as Error };
  }
};

/* G-LCK-1 — an absolute root (positive control). */
{
  const root = makeProject("abs");
  const run = elapsed(() => {
    createIntent(root, { title: "Absolute root intent", body: "Body." });
  });
  observe(
    "G-LCK-1 absolute root (positive control)",
    "the mutation commits promptly",
    run.error === undefined ? `committed in ${run.ms}ms` : `${run.error.message} after ${run.ms}ms`,
    run.error === undefined,
  );
}

/* G-LCK-2 — a relative root, reached through the same public function. */
{
  const root = makeProject("rel");
  const previous = process.cwd();
  process.chdir(dirname(root));
  const relative = `./${basename(root)}`;
  const run = elapsed(() => {
    createIntent(relative, { title: "Relative root intent", body: "Body." });
  });
  process.chdir(previous);
  const code = run.error instanceof PactwrightError ? run.error.code : "none";
  observe(
    "G-LCK-2 relative root",
    "the mutation commits, as it does for the same project named absolutely",
    run.error === undefined
      ? `committed in ${run.ms}ms`
      : `${code} after ${run.ms}ms: ${run.error.message}`,
    run.error === undefined,
  );
  const nodes = existsSync(join(root, "specs", "nodes"))
    ? readdirSync(join(root, "specs", "nodes"))
    : [];
  observe(
    "G-LCK-2b durable effect of the refusal",
    "no lock file and no partial node are left behind",
    `lock present: ${String(existsSync(writerLockPath(root)))}; node files: ${nodes.length}`,
    !existsSync(writerLockPath(root)) && nodes.length === 0,
  );
}

/* G-LCK-3 — a root with a trailing separator. */
{
  const root = makeProject("slash");
  const run = elapsed(() => {
    createIntent(`${root}/`, { title: "Trailing slash intent", body: "Body." });
  });
  const code = run.error instanceof PactwrightError ? run.error.code : "none";
  observe(
    "G-LCK-3 trailing separator in the root",
    "the mutation commits",
    run.error === undefined ? `committed in ${run.ms}ms` : `${code} after ${run.ms}ms`,
    run.error === undefined,
  );
}

/* G-LCK-4 — re-entrancy is per module instance, not per lock file. */
{
  const root = makeProject("reentrant");
  let inner = "not reached";
  withRepositoryLock(root, () => {
    try {
      withRepositoryLock(root, () => {
        inner = "re-entered";
      });
    } catch (error) {
      inner = `refused: ${(error as PactwrightError).code}`;
    }
  });
  observe(
    "G-LCK-4 re-entrancy on an identical path (positive control)",
    "a nested take of the same lock path re-enters",
    inner,
    inner === "re-entered",
  );
}

/* G-LCK-5 — taking the lock on a directory that is not a project. */
{
  const root = makeProject("side-effect");
  const bare = join(root, "not-a-project");
  withRepositoryLock(bare, () => undefined);
  observe(
    "G-LCK-5 lock acquisition on an arbitrary path",
    "acquiring a lock does not create directories in a path that is not a project",
    `.pactwright created under the non-project path: ${String(existsSync(join(bare, ".pactwright")))}`,
    !existsSync(join(bare, ".pactwright")),
  );
}

/* G-MUT-1 — the wholesale edges.yml rewrite. */
{
  const root = makeProject("edges");
  const edges = join(root, "specs", "graph", "edges.yml");
  writeFileSync(edges, "# Hand-maintained ordering: the README explains why.\nedges: []\n", "utf8");
  createIntent(root, { title: "Edges rewrite intent", body: "Body." });
  const after = readFileSync(edges, "utf8");
  observe(
    "G-MUT-1 edges.yml rewrite",
    "a mutation that adds no edge preserves the edges file as written",
    after.includes("Hand-maintained")
      ? "comment preserved"
      : `rewritten to ${JSON.stringify(after)}`,
    after.includes("Hand-maintained"),
  );
}

/* G-MUT-2 — a symlinked root. */
{
  const root = makeProject("symlink");
  const link = `${root}-link`;
  symlinkSync(root, link);
  const run = elapsed(() => {
    createIntent(link, { title: "Symlinked root intent", body: "Body." });
  });
  const code = run.error instanceof PactwrightError ? run.error.code : "none";
  observe(
    "G-MUT-2 symlinked root",
    "the mutation commits through a symlink to the project root",
    run.error === undefined ? `committed in ${run.ms}ms` : `${code} after ${run.ms}ms`,
    run.error === undefined,
  );
}

summary();
