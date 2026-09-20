import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { PactwrightError, type Problem } from "../errors.js";

/**
 * A repository-scoped writer lock.
 *
 * `commitGraphChange` compares the planned-against graph revision with a
 * fresh load and *then* renames a sequence of files. Two processes can both
 * pass that comparison before either renames, and the second wholesale
 * `edges.yml` rewrite drops the first's edge: the compare is not an atomic
 * compare-and-swap. Execution-state writes had no protection at all.
 *
 * This is a file, not a database (Core §59). It is process-local to one
 * checkout and deliberately does not resolve the Implementation Guide's open
 * "automation branch/PR concurrency" gap; it answers a code-derived risk
 * before Checkpoint 2 introduces remote writers.
 */
export const WRITER_LOCK_FILE = ".pactwright/.lock";

export interface WriterLockOptions {
  /** Bounded wait for a live holder before giving up. */
  readonly waitMs?: number;
  /** A lock at least this old is reclaimable even if its pid still exists. */
  readonly staleAfterMs?: number;
  /** Reclamation notices. Reclaiming is reported, never silent. */
  readonly onProblem?: (problem: Problem) => void;
  /** Injected clock, for tests; defaults to `Date.now`. */
  readonly now?: () => number;
}

/** Lock paths this process currently holds, for the re-entrancy check below. */
const held = new Set<string>();

const DEFAULT_WAIT_MS = 5_000;
const DEFAULT_STALE_AFTER_MS = 120_000;
const POLL_FLOOR_MS = 10;
const POLL_CEILING_MS = 200;

interface LockHolder {
  readonly pid: number;
  readonly host: string;
  readonly startedAt: number;
}

export function writerLockPath(root: string): string {
  return join(root, WRITER_LOCK_FILE);
}

function readHolder(path: string): LockHolder | undefined {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return undefined; // Released between our failed create and this read.
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const { pid, host, startedAt } = parsed as Partial<LockHolder>;
    if (typeof pid !== "number" || typeof host !== "string" || typeof startedAt !== "number") {
      return undefined;
    }
    return { pid, host, startedAt };
  } catch {
    // An unreadable lock names no owner, so it can only be treated as stale.
    return undefined;
  }
}

/**
 * Whether `holder` is a process that could still be writing. Only a holder on
 * this host can be checked: a pid from another machine means nothing here, so
 * it is treated as live and left to the age check.
 */
function isLive(holder: LockHolder): boolean {
  if (holder.host !== hostname()) return true;
  try {
    // Signal 0 performs the permission and existence checks without
    // delivering anything.
    process.kill(holder.pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function acquire(path: string, now: () => number): boolean {
  const holder: LockHolder = { pid: process.pid, host: hostname(), startedAt: now() };
  let fd: number;
  try {
    fd = openSync(path, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
  try {
    writeFileSync(fd, `${JSON.stringify(holder)}\n`, "utf8");
  } finally {
    closeSync(fd);
  }
  return true;
}

function sleep(ms: number): void {
  // Synchronous on purpose: every caller is a synchronous mutation, and an
  // await here would let a second mutation interleave inside one process.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Runs `fn` while holding the repository's writer lock, releasing it in
 * `finally` whether `fn` returns or throws.
 *
 * A live holder on this host blocks until `waitMs` elapses, then
 * `repository-locked`. A dead pid, an over-age lock or an unreadable one is
 * reclaimed and reported through `onProblem`.
 *
 * Re-entrant within one process: a nested call reuses the held lock rather
 * than deadlocking against itself, so a mutation may take the lock around its
 * whole load → validate → write → reload sequence without auditing every
 * helper it calls.
 */
export function withRepositoryLock<T>(
  root: string,
  fn: () => T,
  options: WriterLockOptions = {},
): T {
  const path = writerLockPath(root);
  if (held.has(path)) return fn();

  const now = options.now ?? Date.now;
  const waitMs = options.waitMs ?? DEFAULT_WAIT_MS;
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  mkdirSync(join(root, ".pactwright"), { recursive: true });

  const deadline = now() + waitMs;
  let backoff = POLL_FLOOR_MS;
  for (;;) {
    if (acquire(path, now)) break;

    const holder = readHolder(path);
    const age = holder === undefined ? undefined : now() - holder.startedAt;
    const reclaimable =
      holder === undefined || !isLive(holder) || (age !== undefined && age >= staleAfterMs);
    if (reclaimable) {
      options.onProblem?.({
        code: "stale-writer-lock",
        message:
          holder === undefined
            ? "reclaimed an unreadable writer lock"
            : `reclaimed a writer lock held by ${holder.host}:${holder.pid} since ${new Date(holder.startedAt).toISOString()}`,
        path,
      });
      rmSync(path, { force: true });
      continue;
    }

    if (now() >= deadline) {
      throw new PactwrightError(
        "repository-locked",
        `another Pactwright process (${holder.host}:${holder.pid}) is writing to this repository; it has held the lock since ${new Date(holder.startedAt).toISOString()}`,
        [{ code: "repository-locked", message: "the repository writer lock is held", path }],
      );
    }
    sleep(backoff);
    backoff = Math.min(backoff * 2, POLL_CEILING_MS);
  }

  held.add(path);
  try {
    return fn();
  } finally {
    held.delete(path);
    rmSync(path, { force: true });
  }
}
