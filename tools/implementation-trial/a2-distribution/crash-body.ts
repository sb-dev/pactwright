/**
 * A2-D probe helper — a real environment transaction killed mid-body.
 *
 * argv: <root> <signalDir>
 *
 * Runs the production `applyEnvironmentPlan` with the production writer lock
 * around a body that mutates managed files and then blocks. The parent sends
 * SIGKILL while the body is inside the transaction, *after* its effects.
 */
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyEnvironmentPlan,
  planEnvironmentChange,
} from "../../../src/environment/transaction.js";
import { withRepositoryLock } from "../../../src/graph/writer-lock.js";

const [root, signals] = process.argv.slice(2);
mkdirSync(signals!, { recursive: true });

const wait = (path: string, timeoutMs = 60_000): void => {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${path}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
};

const plan = planEnvironmentChange(root!);
writeFileSync(join(signals!, "managed.json"), JSON.stringify(plan.managed, null, 2), "utf8");

applyEnvironmentPlan(plan, () =>
  withRepositoryLock(root!, () => {
    // A real managed-file mutation, written exactly as the runtime writes:
    // temporary sibling, then rename.
    const target = join(root!, ".pactwright", "lock.yml");
    const temp = `${target}.tmp-probe`;
    writeFileSync(
      temp,
      "runtime:\n  version: 9.9.9\n# half-applied by a crashed transaction\n",
      "utf8",
    );
    renameSync(temp, target);
    writeFileSync(join(signals!, "effects-applied"), `${process.pid}\n`, "utf8");
    wait(join(signals!, "never"));
    return { ok: false, value: undefined, problems: [] };
  }),
);
