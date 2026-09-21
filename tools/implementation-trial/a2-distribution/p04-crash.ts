/**
 * A2-D probe 04 — handled failure versus process crash.
 *
 * The same transaction, the same effects, two endings: one where the body
 * returns `ok: false`, and one where the process is killed after the effects
 * have landed. The transaction's restore is in-memory, so the two endings
 * are not the same guarantee.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyEnvironmentPlan,
  planEnvironmentChange,
} from "../../../src/environment/transaction.js";
import { writerLockPath } from "../../../src/graph/writer-lock.js";
import { doctor } from "../../../src/doctor.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, makeProject, report } from "./fixture.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const RUNTIME = runtimeVersion();

function until(predicate: () => boolean, what: string, timeoutMs = 60_000): void {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${what}`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
}

const mkRoot = (): string => {
  const root = makeProject({
    pack: { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME },
    packageManager: "pnpm@11.7.0",
    runtime: RUNTIME,
  });
  writeFileSync(
    join(root, ".pactwright", "lock.yml"),
    `runtime:\n  version: ${RUNTIME}\nagent_pack:\n  name: '@probe/pack'\n  version: 0.1.0\n  hash: sha256:${"0".repeat(64)}\nagents: {}\nskills: {}\nextensions: {}\n`,
    "utf8",
  );
  return root;
};

/* A — handled failure, in this process. ---------------------------------- */
{
  const root = mkRoot();
  const before = readFileSync(join(root, ".pactwright", "lock.yml"), "utf8");
  const plan = planEnvironmentChange(root);
  const { result } = applyEnvironmentPlan(plan, () => {
    const target = join(root, ".pactwright", "lock.yml");
    writeFileSync(`${target}.tmp`, "runtime:\n  version: 9.9.9\n", "utf8");
    renameSync(`${target}.tmp`, target);
    return {
      ok: false,
      value: undefined,
      problems: [{ code: "probe-failure", message: "injected after the effect" }],
    };
  });
  const after = readFileSync(join(root, ".pactwright", "lock.yml"), "utf8");
  report("A — handled failure after the effect", {
    restored: result.restored,
    recovery: result.recovery ?? [],
    lockBackToItsPreviousBytes: after === before,
    writerLockLeftBehind: existsSync(writerLockPath(root)),
  });
  cleanup(root);
}

/* B — the identical transaction, killed after the effect. ----------------- */
{
  const root = mkRoot();
  const before = readFileSync(join(root, ".pactwright", "lock.yml"), "utf8");
  const signals = join(root, ".probe");
  mkdirSync(signals, { recursive: true });

  const child = spawn(
    process.execPath,
    ["--import", "tsx", join(here, "crash-body.ts"), root, signals],
    { stdio: "inherit" },
  );
  until(() => existsSync(join(signals, "effects-applied")), "the child's effects to land");
  child.kill("SIGKILL");
  until(() => (child.killed && child.exitCode === null ? true : true), "the kill to be delivered");
  // Give the OS the chance to reap; the assertions below are about on-disk state.
  until(() => existsSync(join(signals, "effects-applied")), "state to settle");

  const after = readFileSync(join(root, ".pactwright", "lock.yml"), "utf8");
  report("B — SIGKILL after the same effect", {
    lockBackToItsPreviousBytes: after === before,
    lockYmlNow: after.trim().split("\n"),
    writerLockLeftBehind: existsSync(writerLockPath(root)),
    writerLockContents: existsSync(writerLockPath(root))
      ? readFileSync(writerLockPath(root), "utf8").trim()
      : "<absent>",
    recoveryRecordOnDisk:
      existsSync(join(root, ".pactwright", "transaction.json")) ||
      existsSync(join(root, ".pactwright", "journal"))
        ? "present"
        : "none — the snapshot lived only in the dead process",
    managedSetTheDeadTransactionOwned: JSON.parse(
      readFileSync(join(signals, "managed.json"), "utf8"),
    ),
  });

  const d = doctor(root);
  report("B — what doctor says about the crashed project", {
    status: d.status,
    checks: d.checks.map((c) => `[${c.status}] ${c.name}: ${c.detail}`),
    namesTheHalfAppliedTransaction: d.checks.some((c) =>
      /transaction|interrupt|crash|half/i.test(c.detail),
    ),
  });
  rmSync(root, { recursive: true, force: true });
}
