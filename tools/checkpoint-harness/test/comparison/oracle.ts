// T3.6 L4 comparison (evidence-backed learning log §4): the hidden oracle of
// a task, run on the run's accepted candidate. The candidate is exported
// from the run's own source repository; its module runs in the harness's
// pinned containment image, without network, read-only and unprivileged,
// with the oracle's cases mounted beside it. The oracle never enters the
// task repository, so no arm's producer, verifier or reviewer sees it.

import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PROFILE } from "../../src/workspace.js";
import { FIXTURES, taskDir, type Task } from "./task.js";

type Table = { module: string; cases: { args: string[]; stdout: string }[] };

/** Runs the table subject over the exported tree: in containment by default, or `run` (tests). */
export type Execute = (
  tree: string,
  oracle: string,
) => { status: number | null; stdout: string; stderr: string };

const contained: Execute = (tree, oracle) => {
  const ran = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "none",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,size=16m",
      "--user",
      "65534:65534",
      "--memory",
      "512m",
      "--pids-limit",
      "256",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "-v",
      `${tree}:/w:ro`,
      "-v",
      `${oracle}:/o:ro`,
      "-w",
      "/w",
      PROFILE.image,
      "node",
      "/o/table-subject.mjs",
      "/o/oracle.json",
    ],
    { encoding: "utf8", timeout: 180_000 },
  );
  return {
    status: ran.status,
    stdout: ran.stdout ?? "",
    stderr: ran.stderr ?? ran.error?.message ?? "",
  };
};

/** The oracle's verdict on the run's accepted candidate, or not-run when nothing was accepted. */
export function runOracle(
  dir: string,
  task: Task,
  accepted: string | null,
  scratch: string,
  execute: Execute = contained,
): { oracle: "passed" | "failed" | "not-run"; detail: string } {
  if (accepted === null) return { oracle: "not-run", detail: "nothing was accepted" };
  const tree = join(scratch, "tree");
  const oracle = join(scratch, "oracle");
  mkdirSync(tree, { recursive: true });
  mkdirSync(oracle, { recursive: true });
  const archive = execFileSync(
    "git",
    ["--git-dir", join(dir, "source.git"), "archive", "--format=tar", accepted],
    {
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  execFileSync("tar", ["-xf", "-", "-C", tree], { input: archive });
  cpSync(join(taskDir(task.id), "oracle.json"), join(oracle, "oracle.json"));
  cpSync(join(FIXTURES, "verifiers/table-subject.mjs"), join(oracle, "table-subject.mjs"));
  const table = JSON.parse(readFileSync(join(oracle, "oracle.json"), "utf8")) as Table;
  const ran = execute(tree, oracle);
  if (ran.status !== 0)
    return {
      oracle: "failed",
      detail: `the oracle run exited ${ran.status}: ${ran.stderr.slice(0, 300)}`,
    };
  let observed: { exit: number | null; stdout: string }[];
  try {
    observed = JSON.parse(ran.stdout) as typeof observed;
  } catch {
    return { oracle: "failed", detail: `unreadable oracle output: ${ran.stdout.slice(0, 200)}` };
  }
  const wrong = table.cases.flatMap((c, i) =>
    observed[i]?.exit === 0 && observed[i]?.stdout === c.stdout
      ? []
      : [`${JSON.stringify(c.args)} printed ${JSON.stringify(observed[i]?.stdout ?? null)}`],
  );
  return wrong.length === 0
    ? { oracle: "passed", detail: `${table.cases.length} cases` }
    : { oracle: "failed", detail: wrong.join("; ").slice(0, 600) };
}
