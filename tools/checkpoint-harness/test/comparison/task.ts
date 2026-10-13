// T3.6 L4 comparison (evidence-backed learning log §4, L4-03): the pinned
// protocol, the comparison tasks and the deterministic task repositories
// every arm starts from. A task repository holds the task's definitions,
// its declared binding and visible verifier and an empty work directory; the
// hidden oracle and the injected faults never enter it. Every arm builds the
// same commits, so their task starts are byte-identical.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import type { Injection } from "../../src/fixture.js";

export const HERE = dirname(fileURLToPath(import.meta.url));
/** The repository the comparison runs from: the revision under test. */
export const REPO = join(HERE, "../../../..");
export const PROTOCOL_FILE = join(HERE, "protocol.yml");

export type Arm = "B" | "D" | "E";
export const ARMS: readonly Arm[] = ["B", "D", "E"];

export type Protocol = {
  version: number;
  baseline: string;
  arms: Record<Arm, { tree: "baseline" | "current"; learning: boolean }>;
  sets: Record<string, { repeats: number; tasks: string[] }>;
  roles: Record<string, unknown>;
  credentials: Record<string, unknown>;
  budgets: Record<string, unknown>;
  learning: Record<string, unknown>;
  toolchain: Record<string, string>;
  decision: {
    control: { task: string; valid_repeats: number };
    valid_margin: number;
    repeated_ratio: number;
    repeated_minimum: number;
    turns_ratio: number;
    elapsed_ratio: number;
  };
  infrastructure: { reruns: number };
  stop: { sessions_per_shard: number };
};

/** The protocol and the digest of its exact bytes, recorded with every result. */
export function loadProtocol(file = PROTOCOL_FILE): { protocol: Protocol; digest: string } {
  const text = readFileSync(file, "utf8");
  return {
    protocol: yaml.load(text) as Protocol,
    digest: `sha256:${createHash("sha256").update(text).digest("hex")}`,
  };
}

export type Task = {
  id: string;
  set: string;
  category: string;
  module: string;
  fn: string;
  checkpoint: string;
  step: string;
  output: string;
  /** Injected faults, served as producer attempts 1, 2, … in every arm. */
  injected: string[];
  /** Definitions amended after this attempt's decision (stale knowledge). */
  amend?: { after: number };
  /** The arm's process is killed after this attempt's phase starts, then resumed (recovery). */
  interrupt?: { attempt: number; phase: string };
};

/** Where the tasks and the shared table verifier live, with the other harness fixtures. */
export const FIXTURES = join(HERE, "../fixtures/checkpoint-harness/comparison");

export const taskDir = (id: string): string => join(FIXTURES, "tasks", id);

export function loadTask(id: string): Task {
  return JSON.parse(readFileSync(join(taskDir(id), "task.json"), "utf8")) as Task;
}

/** The digest of every file a task and the shared verifier hold, recorded with every result. */
export function taskDigest(id: string): string {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? files(join(dir, d.name)) : [join(dir, d.name)],
    );
  const hash = createHash("sha256");
  for (const f of [...files(taskDir(id)).sort(), ...verifierFiles()]) {
    hash.update(f.slice(FIXTURES.length)).update("\0").update(readFileSync(f)).update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

const verifierFiles = (): string[] =>
  ["table-subject.mjs", "table-judge.mjs"].map((f) => join(FIXTURES, "verifiers", f));

const git = (cwd: string, args: string[]): string =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Comparison",
      GIT_AUTHOR_EMAIL: "comparison@example.invalid",
      GIT_COMMITTER_NAME: "Comparison",
      GIT_COMMITTER_EMAIL: "comparison@example.invalid",
      GIT_AUTHOR_DATE: "2026-10-13T00:00:00Z",
      GIT_COMMITTER_DATE: "2026-10-13T00:00:00Z",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

/** A task repository on branch `task`, and the amended definitions' commit when the task amends them. */
export type TaskRepo = { root: string; branch: string; head: string; amended: string | null };

/** Builds the task's repository at `root`; the same commits every time. */
export function taskRepo(task: Task, root: string): TaskRepo {
  const dir = taskDir(task.id);
  mkdirSync(root, { recursive: true });
  cpSync(join(dir, "repo"), root, { recursive: true });
  for (const f of verifierFiles())
    cpSync(f, join(root, "verifiers", f.slice(f.lastIndexOf("/") + 1)));
  mkdirSync(join(root, "docs/checkpoints"), { recursive: true });
  cpSync(
    join(REPO, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  git(root, ["init", "-q", "-b", "task"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", `task ${task.id}`]);
  const head = git(root, ["rev-parse", "HEAD"]);
  let amended: string | null = null;
  if (existsSync(join(dir, "amended"))) {
    git(root, ["checkout", "-q", "-b", "amended"]);
    cpSync(join(dir, "amended"), root, { recursive: true });
    git(root, ["add", "-A"]);
    git(root, ["commit", "-q", "--no-gpg-sign", "-m", `amended definitions of ${task.id}`]);
    amended = git(root, ["rev-parse", "HEAD"]);
    git(root, ["checkout", "-q", "task"]);
  }
  return { root, branch: "task", head, amended };
}

/** A task repository built earlier, for resuming its run. */
export function openTaskRepo(root: string): TaskRepo {
  const amended = execFileSync("git", ["branch", "--list", "amended"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  return {
    root,
    branch: "task",
    head: git(root, ["rev-parse", "task"]),
    amended: amended ? git(root, ["rev-parse", "amended"]) : null,
  };
}

/** The run configuration of an arm: the protocol's settings, with learning only for E. */
export function configFor(
  protocol: Protocol,
  task: Task,
  arm: Arm,
  repo: TaskRepo,
  roots: { candidate: string; controller: string },
): Record<string, unknown> {
  return {
    repository: { name: `comparison/${task.id}`, branch: repo.branch, expected_head: repo.head },
    checkpoint: task.checkpoint,
    definitions: { revision: repo.head, review: `T3.6 L4 comparison task ${task.id}` },
    selection: { through: task.step },
    roles: protocol.roles,
    credentials: protocol.credentials,
    budgets: protocol.budgets,
    permissions: {
      writable: ["work"],
      scratch: [],
      protected: [],
      approvers: { owner: ["comparison"], amend: ["comparison"], feedback: ["comparison"] },
    },
    verification: { bindings: "bindings" },
    workspace: { candidate_root: roots.candidate, controller_root: roots.controller },
    ...(protocol.arms[arm].learning ? { learning: protocol.learning } : {}),
  };
}

/** The task's injected attempts and their sources, as the injector serves them. */
export function injectionsOf(task: Task): {
  injections: Injection[];
  sources: ReadonlyMap<string, string>;
} {
  const injections = task.injected.map((file, i) => ({
    step: task.step,
    attempt: i + 1,
    files: { [task.module]: `${task.id}/${file}` },
    outputs: { [task.output]: [task.module] },
  }));
  const sources = new Map(
    task.injected.map((file) => [
      `${task.id}/${file}`,
      readFileSync(join(taskDir(task.id), file), "utf8"),
    ]),
  );
  return { injections, sources };
}
