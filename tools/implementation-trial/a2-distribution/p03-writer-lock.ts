/**
 * A2-D probe 03 — writer-lock ownership under real concurrency.
 *
 * Three real processes, synchronised by files rather than by sleeping, ask
 * one question: when a holder's lock has been reclaimed, does that holder's
 * release delete a lock it no longer owns?
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { writerLockPath } from "../../../src/graph/writer-lock.js";
import { report } from "./fixture.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = mkdtempSync(join(tmpdir(), "a2d-lock-"));
mkdirSync(join(root, ".pactwright"), { recursive: true });
const signals = join(root, ".probe");
mkdirSync(signals, { recursive: true });

const lockPath = writerLockPath(root);
const sig = (n: string): string => join(signals, n);
const touch = (n: string): void => writeFileSync(sig(n), "go\n", "utf8");

function until(predicate: () => boolean, what: string, timeoutMs = 30_000): void {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${what}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
}

function holder(name: string, staleAfterMs: number, crash = false): ChildProcess {
  return spawn(
    process.execPath,
    [
      "--import",
      "tsx",
      join(here, "lock-holder.ts"),
      root,
      name,
      String(staleAfterMs),
      ...(crash ? ["--crash"] : []),
    ],
    { stdio: "inherit" },
  );
}

const readLock = (): string =>
  existsSync(lockPath) ? readFileSync(lockPath, "utf8").trim() : "<absent>";

/* P1 takes the lock and holds it. */
const p1 = holder("p1", 120_000);
until(() => existsSync(sig("p1.held")), "P1 to hold the lock");
const lockAfterP1 = readLock();

/* P2 treats the lock as stale after 150ms and reclaims it. */
const p2 = holder("p2", 150);
until(() => existsSync(sig("p2.held")), "P2 to reclaim and hold the lock");
const lockAfterP2 = readLock();

report("two holders at once", {
  p1Pid: p1.pid,
  p2Pid: p2.pid,
  lockFileWhileP1Held: lockAfterP1,
  lockFileAfterP2Reclaimed: lockAfterP2,
  p2ReclaimNotice: existsSync(sig("p2.problem"))
    ? readFileSync(sig("p2.problem"), "utf8").trim()
    : "<none>",
  bothInsideCriticalSection: existsSync(sig("p1.held")) && existsSync(sig("p2.held")),
});

/* P1 now finishes normally. Its `finally` releases — but whose lock? */
touch("p1.go");
until(() => existsSync(sig("p1.released")), "P1 to release");
const lockAfterP1Released = readLock();

report("after P1's ordinary release, while P2 is still inside its critical section", {
  p2StillHolding: existsSync(sig("p2.held")) && !existsSync(sig("p2.released")),
  lockFile: lockAfterP1Released,
  lockFileBelongsTo:
    lockAfterP1Released === "<absent>" ? "nobody — P2's lock was deleted" : lockAfterP1Released,
});

/* P3 proves the consequence: it acquires immediately, beside P2. */
const p3 = holder("p3", 120_000);
until(() => existsSync(sig("p3.held")), "P3 to acquire");
report("a third writer entered while P2 had not left", {
  p3Pid: p3.pid,
  p2StillHolding: existsSync(sig("p2.held")) && !existsSync(sig("p2.released")),
  lockFile: readLock(),
});

touch("p2.go");
touch("p3.go");
until(
  () => existsSync(sig("p2.released")) && existsSync(sig("p3.released")),
  "P2 and P3 to finish",
);
for (const p of [p1, p2, p3]) p.kill("SIGTERM");
report("final lock file", readLock());
rmSync(root, { recursive: true, force: true });
