// T3.6 L4 comparison driver (evidence-backed learning log §4, L4-03): runs
// one task of a protocol set — every repeat, every arm, in the pinned
// rotated order — each run in a child process with its arm's own controller
// tree, then measures it from its records and runs the hidden oracle on what
// it accepted. Every run is kept: failures, pauses and exhausted budgets are
// results. A (task, repeat) whose run in any arm failed on infrastructure is
// run again as a whole, at most the protocol's reruns; the earlier runs stay
// in the results, marked superseded. Each run directory is archived. The
// driver decides nothing; `report.ts` applies the pinned decision rules.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { DefaultArtifactClient } from "@actions/artifact";
import stringify from "safe-stable-stringify";

import { runDirOf, type ArmResult } from "./arm.js";
import { classify, measure, type RunMetrics } from "./metrics.js";
import { runOracle } from "./oracle.js";
import {
  ARMS,
  HERE,
  loadProtocol,
  loadTask,
  REPO,
  taskDigest,
  type Arm,
  type Protocol,
} from "./task.js";

/** The arms of repeat `k` (from 1), in the pinned order rotate([B, D, E], k - 1). */
export const orderOf = (k: number): Arm[] => {
  const shift = (k - 1) % ARMS.length;
  return [...ARMS.slice(shift), ...ARMS.slice(0, shift)];
};

/** The task IDs of a set, for the workflow's matrix. */
export function tasksOf(protocol: Protocol, set: string): string[] {
  const found = protocol.sets[set];
  if (!found) throw new Error(`no set ${set} in the protocol`);
  return found.tasks;
}

/** The baseline controller tree: a worktree of the protocol's baseline revision with its own dependencies. */
function baselineTree(protocol: Protocol, into: string): string {
  if (!existsSync(join(into, "package.json"))) {
    execFileSync("git", ["-C", REPO, "worktree", "add", "--detach", into, protocol.baseline], {
      stdio: "inherit",
    });
    execFileSync("pnpm", ["install", "--frozen-lockfile"], { cwd: into, stdio: "inherit" });
  }
  const head = execFileSync("git", ["-C", into, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== protocol.baseline)
    throw new Error(`${into} is at ${head}, not the baseline ${protocol.baseline}`);
  return into;
}

/** Runs arm.ts in a child process; a killed recovery run is resumed in a new one. */
function runChild(
  tree: string,
  task: string,
  arm: Arm,
  work: string,
  resume: string | null,
): { result: ArmResult | null; signal: string | null; stderr: string } {
  const out = join(work, resume ? "result-resumed.json" : "result.json");
  const ran = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      join(HERE, "arm.ts"),
      "--tree",
      tree,
      "--task",
      task,
      "--arm",
      arm,
      "--work",
      work,
      "--out",
      out,
      ...(resume ? ["--resume", resume] : []),
    ],
    {
      cwd: join(REPO, "tools/checkpoint-harness"),
      env: process.env,
      encoding: "utf8",
      timeout: 90 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const stderr = `${ran.stderr ?? ""}${ran.error ? `\n${ran.error.message}` : ""}`;
  writeFileSync(join(work, resume ? "stderr-resumed.log" : "stderr.log"), stderr);
  const result = existsSync(out) ? (JSON.parse(readFileSync(out, "utf8")) as ArmResult) : null;
  return { result, signal: ran.signal, stderr };
}

/** Archives a run directory; returns its file name and digest. */
function archive(dir: string, into: string, name: string): string {
  const file = join(into, `${name}.tar.gz`);
  execFileSync("tar", ["-czf", file, "-C", dir, "."]);
  return `${name}.tar.gz sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
}

export async function drive(options: {
  set: string;
  task: string;
  out: string;
  baseline?: string;
}): Promise<RunMetrics[]> {
  const { protocol, digest } = loadProtocol();
  const task = loadTask(options.task);
  const set = protocol.sets[options.set];
  if (!set?.tasks.includes(task.id)) throw new Error(`${task.id} is not a task of ${options.set}`);
  const tasks = taskDigest(task.id);
  mkdirSync(join(options.out, "archives"), { recursive: true });
  const trees: Record<"baseline" | "current", string> = {
    current: REPO,
    baseline: baselineTree(protocol, options.baseline ?? join(options.out, "..", "baseline-tree")),
  };
  const results: RunMetrics[] = [];
  const record = (m: RunMetrics): void => {
    results.push(m);
    appendFileSync(join(options.out, "results.jsonl"), `${stringify(m)}\n`);
  };
  let sessions = 0;
  for (let repeat = 1; repeat <= set.repeats; repeat++) {
    for (let rerun = 0; rerun <= protocol.infrastructure.reruns; rerun++) {
      const pair: RunMetrics[] = [];
      for (const arm of orderOf(repeat)) {
        const base = {
          set: options.set,
          task: task.id,
          category: task.category,
          arm,
          repeat,
          rerun,
          superseded: false,
          protocol: digest,
          taskDigest: tasks,
        };
        if (sessions >= protocol.stop.sessions_per_shard) {
          pair.push(
            missing(base, `the shard's ${protocol.stop.sessions_per_shard} sessions are used`),
          );
          continue;
        }
        const name = `${options.set}-${task.id}-r${repeat}-${rerun}-${arm}`;
        const work = join(options.out, "runs", name);
        mkdirSync(work, { recursive: true });
        const started = Date.now();
        const tree = trees[protocol.arms[arm].tree];
        let child = runChild(tree, task.id, arm, work, null);
        const dir = child.result?.dir ?? (existsSync(join(work, "runs")) ? runDirOf(work) : null);
        // A recovery task's run is killed at its boundary, then resumed by a new process.
        if (task.interrupt && child.signal === "SIGKILL" && dir)
          child = runChild(tree, task.id, arm, work, dir);
        const elapsedMs = Date.now() - started;
        const usage = dir
          ? measure(dir, task)
          : { error: `no run directory: ${child.stderr.split("\n").slice(-5).join(" ")}` };
        const oracle =
          !("error" in usage) && dir
            ? runOracle(dir, task, usage.accepted, join(work, "oracle"))
            : { oracle: "not-run" as const, detail: "error" in usage ? usage.error : "" };
        const outcome = classify(child.result, usage, oracle.oracle);
        const m: RunMetrics = {
          ...base,
          ...("error" in usage ? emptyUsage() : usage),
          harness: child.result?.harness ?? "unknown",
          outcome,
          oracle: oracle.oracle,
          oracleDetail: oracle.detail,
          reasons: [
            ...(child.result?.reasons.map((r) => `${r.code} ${r.subject}: ${r.detail}`) ?? []),
            ...(child.result?.diagnostics ?? []),
            ...("error" in usage ? [usage.error] : []),
          ],
          elapsedMs,
          run: child.result?.run ?? null,
          archive: dir ? archive(dir, join(options.out, "archives"), name) : null,
        };
        sessions += m.sessions;
        pair.push(m);
      }
      const infrastructure = pair.some((m) => m.outcome === "infrastructure");
      const last = rerun === protocol.infrastructure.reruns;
      for (const m of pair) record({ ...m, superseded: infrastructure && !last });
      if (!infrastructure) break;
    }
  }
  return results;
}

type Base = Pick<
  RunMetrics,
  | "set"
  | "task"
  | "category"
  | "arm"
  | "repeat"
  | "rerun"
  | "superseded"
  | "protocol"
  | "taskDigest"
>;

/** The usage and outcome fields of a run that recorded nothing. */
const emptyUsage = (): Omit<RunMetrics, keyof Base> => ({
  attempts: 0,
  liveAttempts: 0,
  injectedAttempts: 0,
  repeatedFailures: 0,
  sealRejections: 0,
  sessions: 0,
  learningSessions: 0,
  turns: 0,
  outputTokens: 0,
  inputTokens: 0,
  cacheTokens: "not recorded",
  apiEquivalentUsd: 0,
  unknownCost: 0,
  infrastructureFailures: [],
  journalMs: 0,
  accepted: null,
  harness: "unknown",
  outcome: "error",
  oracle: "not-run",
  oracleDetail: "",
  reasons: [],
  elapsedMs: 0,
  run: null,
  archive: null,
});

const missing = (base: Base, reason: string): RunMetrics => ({
  ...base,
  ...emptyUsage(),
  reasons: [`missing: ${reason}`],
});

/** Uploads the driver's output directory as one artifact of this workflow run. */
async function upload(name: string, dir: string): Promise<void> {
  const files = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? files(join(d, e.name)) : [join(d, e.name)],
    );
  const keep = files(dir).filter((f) => f.endsWith("results.jsonl") || f.includes("/archives/"));
  await new DefaultArtifactClient().uploadArtifact(name, keep, dir, { retentionDays: 90 });
  console.log(`uploaded ${name}: ${keep.length} files`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      set: { type: "string" },
      task: { type: "string" },
      out: { type: "string" },
      baseline: { type: "string" },
      list: { type: "boolean" },
      upload: { type: "string" },
    },
  });
  const { protocol } = loadProtocol();
  if (values.list) {
    process.stdout.write(`${JSON.stringify(tasksOf(protocol, values.set ?? ""))}\n`);
    return;
  }
  if (!values.set || !values.task || !values.out)
    throw new Error("driver.ts needs --set, --task and --out");
  const results = await drive({
    set: values.set,
    task: values.task,
    out: values.out,
    ...(values.baseline ? { baseline: values.baseline } : {}),
  });
  for (const m of results) {
    console.log(
      `${m.task} r${m.repeat}.${m.rerun} ${m.arm}: ${m.outcome} (oracle ${m.oracle}); ${m.liveAttempts} live attempts, ${m.repeatedFailures} repeated, ${m.sessions} sessions, ${m.turns} turns, ${Math.round(m.elapsedMs / 1000)} s${m.superseded ? "; superseded" : ""}`,
    );
  }
  if (values.upload) await upload(values.upload, values.out);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    process.exit(1);
  });
}
