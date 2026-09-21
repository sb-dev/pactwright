/**
 * A2-D probe helper — one real writer-lock holder, driven by file signals.
 *
 * argv: <root> <name> <staleAfterMs> [--crash]
 *
 * Writes `<root>/.probe/<name>.held` once the lock is held, then blocks until
 * `<root>/.probe/<name>.go` appears. With `--crash` it never releases: the
 * parent kills it while it is inside the critical section.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withRepositoryLock } from "../../../src/graph/writer-lock.js";

const [root, name, stale, flag] = process.argv.slice(2);
const signals = join(root!, ".probe");
mkdirSync(signals, { recursive: true });

const waitFor = (path: string, timeoutMs = 30_000): void => {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${path}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
};

try {
  withRepositoryLock(
    root!,
    () => {
      writeFileSync(join(signals, `${name}.held`), `${process.pid}\n`, "utf8");
      if (flag === "--crash") {
        // Advertise readiness, then stay in the critical section for ever.
        waitFor(join(signals, "never"), 60_000);
      }
      waitFor(join(signals, `${name}.go`));
      writeFileSync(join(signals, `${name}.leaving`), `${process.pid}\n`, "utf8");
    },
    {
      waitMs: 20_000,
      staleAfterMs: Number(stale),
      onProblem: (p) =>
        writeFileSync(join(signals, `${name}.problem`), `${p.code}: ${p.message}\n`, "utf8"),
    },
  );
  writeFileSync(join(signals, `${name}.released`), "ok\n", "utf8");
} catch (error) {
  writeFileSync(join(signals, `${name}.error`), `${(error as Error).message}\n`, "utf8");
  process.exit(3);
}
