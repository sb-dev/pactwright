// T3.6 L4 comparison (evidence-backed learning log §4): one run of one task
// by one arm, with the arm's own controller source tree. The arm's runner,
// verification, containment and SDK provider are imported from that tree;
// only the injector of the task's fixture faults is this revision's, so
// every arm is served byte-identical injected attempts. As a program it runs
// in a child process the driver starts, so arms never share module state; a
// recovery task's process is killed at its interruption boundary and the
// driver resumes the run in a new process.

import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import stringify from "safe-stable-stringify";

import type { Provider } from "../../src/claude.js";
import type { JournalEvent } from "../../src/evidence.js";
import { injecting } from "../../src/fixture.js";
import type { RunnerDeps, RunResult, Workspaces } from "../../src/runner.js";
import type * as Runner from "../../src/runner.js";
import type * as Claude from "../../src/claude.js";
import type * as Evidence from "../../src/evidence.js";
import type * as Verification from "../../src/verification.js";
import type * as Workspace from "../../src/workspace.js";
import type * as Bootstrap from "../../src/software-bootstrap.js";
import {
  configFor,
  injectionsOf,
  loadProtocol,
  loadTask,
  openTaskRepo,
  REPO,
  taskRepo,
  type Arm,
  type Protocol,
  type Task,
} from "./task.js";

export type ArmOptions = {
  /** The repository root of the arm's controller source tree. */
  tree: string;
  task: Task;
  protocol: Protocol;
  arm: Arm;
  /** A directory of this run's own: its task repository, workspaces and run directory. */
  work: string;
  env: Readonly<Record<string, string | undefined>>;
  /** Resume the run directory instead of starting the task. */
  resume?: string;
  /** Tests: scripted providers and local workspaces instead of the SDK and containment. */
  providers?: { producer?: Provider; reviewer?: Provider };
  workspaces?: (run: Parameters<RunnerDeps["workspaces"]>[0], root: string) => Workspaces;
  liveness?: NonNullable<RunnerDeps["liveness"]>;
  fence?: RunnerDeps["fence"];
  /** What happens at a recovery task's interruption boundary; by default the process is killed. */
  interrupt?: () => void;
};

export type ArmResult = {
  outcome: RunResult["outcome"];
  dir: string | null;
  run: string | null;
  reasons: { code: string; subject: string; detail: string }[];
  diagnostics: string[];
  amended: boolean;
  harness: string;
};

type Modules = {
  runner: typeof Runner;
  claude: typeof Claude;
  evidence: typeof Evidence;
  verification: typeof Verification;
  workspace: typeof Workspace;
  bootstrap: typeof Bootstrap;
};

/** The arm's controller modules, from its own source tree. */
async function modules(tree: string): Promise<Modules> {
  const src = (name: string): string =>
    pathToFileURL(join(tree, "tools/checkpoint-harness/src", name)).href;
  return {
    runner: (await import(src("runner.ts"))) as typeof Runner,
    claude: (await import(src("claude.ts"))) as typeof Claude,
    evidence: (await import(src("evidence.ts"))) as typeof Evidence,
    verification: (await import(src("verification.ts"))) as typeof Verification,
    workspace: (await import(src("workspace.ts"))) as typeof Workspace,
    bootstrap: (await import(src("software-bootstrap.ts"))) as typeof Bootstrap,
  };
}

/** Runs the task once by the arm, or resumes that run; never throws for a run that stopped. */
export async function runArm(o: ArmOptions): Promise<ArmResult> {
  const m = await modules(o.tree);
  const harness = m.runner.harnessIdentity();
  const repo = o.resume
    ? openTaskRepo(join(o.work, "repo"))
    : taskRepo(o.task, join(o.work, "repo"));
  const roots = { candidate: join(o.work, "workspaces"), controller: join(o.work, "runs") };
  mkdirSync(roots.candidate, { recursive: true });
  mkdirSync(roots.controller, { recursive: true });
  const config = configFor(o.protocol, o.task, o.arm, repo, roots);
  const registry = m.bootstrap.createRegistry([]);
  if (!registry.ok) throw new Error(registry.diagnostics.join("\n"));
  const { injections, sources } = injectionsOf(o.task);
  const abort = new AbortController();
  let amendDue = false;
  const progress = (e: JournalEvent): void => {
    const { amend } = o.task;
    if (amend && repo.amended && e.action === "decision" && e.attempt === amend.after) {
      amendDue = true;
      abort.abort();
    }
  };
  const deps = (signal: AbortSignal): RunnerDeps => ({
    repoRoot: repo.root,
    skillsRoot: join(REPO, ".claude/skills"),
    env: o.env,
    registry: registry.registry,
    applicability: m.bootstrap.APPLICABILITY,
    harness,
    workspaces:
      o.workspaces ??
      ((run, root) => ({
        producer: m.runner.containedProducer(run, root),
        verifier: m.verification.containedWorkspaces(run, root),
        reviewer: m.verification.containedWorkspaces(run, root),
        dependencies: (spec) => m.verification.containedDependencies(run, root, spec),
      })),
    effects: null,
    fence: o.fence ?? m.workspace.fenceWorkers,
    signal,
    providers: {
      producer: injecting(injections, sources, o.providers?.producer ?? m.claude.sdkProvider),
      ...(o.providers?.reviewer ? { reviewer: o.providers.reviewer } : {}),
    },
    progress,
    // A recovery task loses its runner right after the boundary's start is
    // journaled, before its session runs, as a hosted runner can be lost.
    save: (run, why) => {
      const { interrupt } = o.task;
      if (why !== "start" || !interrupt || o.resume) return Promise.resolve();
      const read = m.evidence.readRun(run.dir);
      const last = read.ok ? read.records.events.at(-1) : undefined;
      if (
        last?.action === "start" &&
        last.data.phase === interrupt.phase &&
        last.attempt === interrupt.attempt
      ) {
        (o.interrupt ?? (() => process.kill(process.pid, "SIGKILL")))();
      }
      return Promise.resolve();
    },
    ...(o.liveness ? { liveness: o.liveness } : {}),
  });
  let result = o.resume
    ? await m.runner.resumeRun(o.resume, deps(abort.signal))
    : await m.runner.startRun(config, deps(abort.signal));
  let amended = false;
  // Stale knowledge: the task's definitions change after the named decision.
  if (amendDue && result.outcome === "paused" && repo.amended) {
    const recorded = await m.runner.amendRun(
      result.dir,
      {
        config: {
          ...config,
          definitions: { revision: repo.amended, review: "amended task definitions" },
        },
        reason: `the task's definitions are amended after attempt ${o.task.amend?.after ?? 0}'s decision`,
        actor: "comparison",
      },
      {
        repoRoot: repo.root,
        skillsRoot: join(REPO, ".claude/skills"),
        env: o.env,
        applicability: m.bootstrap.APPLICABILITY,
      },
    );
    if (!recorded.ok) {
      return {
        outcome: "invalid",
        dir: result.dir,
        run: result.run,
        reasons: [],
        diagnostics: recorded.diagnostics,
        amended,
        harness,
      };
    }
    amended = true;
    result = await m.runner.resumeRun(result.dir, deps(new AbortController().signal));
  }
  return {
    outcome: result.outcome,
    dir: result.outcome === "invalid" ? null : result.dir,
    run: result.outcome === "invalid" ? null : result.run,
    reasons:
      result.outcome === "paused"
        ? result.reasons.map(({ code, subject, detail }) => ({ code, subject, detail }))
        : [],
    diagnostics: result.outcome === "invalid" ? result.diagnostics : [],
    amended,
    harness,
  };
}

/** The one run directory under a run's controller root, for resuming a killed run. */
export function runDirOf(work: string): string | null {
  const root = join(work, "runs");
  const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  return dirs.length === 1 && dirs[0] ? join(root, dirs[0].name) : null;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      tree: { type: "string" },
      task: { type: "string" },
      arm: { type: "string" },
      work: { type: "string" },
      resume: { type: "string" },
      out: { type: "string" },
    },
  });
  const { tree, task, arm, work, out } = values;
  if (!tree || !task || !arm || !work || !out)
    throw new Error("arm.ts needs --tree, --task, --arm, --work and --out");
  const { protocol } = loadProtocol();
  const result = await runArm({
    tree,
    task: loadTask(task),
    protocol,
    arm: arm as Arm,
    work,
    env: process.env,
    ...(values.resume ? { resume: values.resume } : {}),
  });
  writeFileSync(out, `${stringify(result, null, 2)}\n`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    process.exit(1);
  });
}
