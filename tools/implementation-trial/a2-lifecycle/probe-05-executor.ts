/**
 * A2-L probe 05 — the executor boundary and the Review-outcome derivation.
 *
 * Composes the real `claudeCodeExecutor`, the real `lifecycleExecutor` seam
 * and a real loaded project. Only the child process (`Spawn`) is replaced.
 * The double creates no Evidence, writes no execution state and repairs
 * nothing: it returns bytes a `claude -p --output-format json` run returns.
 *
 * Usage: tsx probe-05-executor.ts <project-root>
 *   where <project-root> is a project built by lib/fixture.sh (it needs a
 *   resolvable agent pack, because `lifecycleExecutor` resolves one).
 */
import {
  claudeCodeArgs,
  claudeCodeExecutor,
  parsePrintMode,
} from "../../../src/execute/claude-code.js";
import { lifecycleExecutor } from "../../../src/execute/select.js";
import type { CapabilityExecutor, CapabilityTask } from "../../../src/execute/task.js";
import type { ActionRequest } from "../../../src/lifecycle/run.js";
import { loadProject } from "../../../src/loader.js";

const root = process.argv[2];
if (root === undefined) throw new Error("usage: probe-05-executor.ts <project-root>");
const project = loadProject({ root });

let checks = 0;
let mismatches = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  holds   ${label}  => ${a}`);
  } else {
    mismatches += 1;
    console.log(`  DIFFERS ${label}\n            expected ${e}\n            actual   ${a}`);
  }
}

/** A capability executor that returns exactly `output`, performing nothing. */
const returning = (output: unknown): CapabilityExecutor => ({
  id: "scripted",
  invoke: () => Promise.resolve({ status: "completed" as const, output }),
});

/** The verdict the runtime derives from what a Review step returned. */
async function verdict(output: unknown): Promise<string> {
  const run = lifecycleExecutor(returning(output));
  const outcome = await run({
    action: {
      kind: "step",
      name: "review",
      execution: "automatic",
      capability: "delivery-review",
    },
    project,
  } as ActionRequest);
  return outcome.status === "completed"
    ? `completed/${outcome.review ?? "<none>"}`
    : "failed/<no outcome>";
}

const task: CapabilityTask = {
  capability: "delivery-execution",
  agent: { key: "implementer", prompt: "/nonexistent/implementer.md", skills: [] },
  instruction: "do the thing",
  root,
};

async function main(): Promise<void> {
  console.log("\n-- 1. Review outcome derived from what the agent returned --");
  check("structured { outcome: 'pass' }", await verdict({ outcome: "pass" }), "completed/pass");
  check(
    "structured { outcome: 'revise' }",
    await verdict({ outcome: "revise" }),
    "completed/revise",
  );
  check(
    "structured { outcome: 'blocked' }",
    await verdict({ outcome: "blocked" }),
    "completed/blocked",
  );
  check(
    "structured { verdict: 'pass' } (a different key)",
    await verdict({ verdict: "pass" }),
    "failed/<no outcome>",
  );
  check("prose 'All checks pass.'", await verdict("All checks pass."), "completed/pass");
  check(
    "prose 'Two defects remain. I have asked for another delivery pass.'",
    await verdict("Two defects remain. I have asked for another delivery pass."),
    "completed/pass",
  );
  check(
    "prose 'Nothing is blocked and nothing needs revision: ship it.'",
    await verdict("Nothing is blocked and nothing needs revision: ship it."),
    "completed/blocked",
  );
  check(
    "prose 'I could not pass judgement; I have no access to the tests.'",
    await verdict("I could not pass judgement; I have no access to the tests."),
    "completed/pass",
  );
  check("prose '' (empty report)", await verdict(""), "failed/<no outcome>");
  check(
    "structured { outcome: 'pass', blocked: true } — only `outcome` is read",
    await verdict({ outcome: "pass", blocked: true }),
    "completed/pass",
  );

  console.log("\n-- 2. parsePrintMode --");
  check("stdout that is not JSON", parsePrintMode("claude: command not found").status, "failed");
  check(
    "is_error: true",
    parsePrintMode(JSON.stringify({ result: "x", is_error: true })).status,
    "failed",
  );
  check(
    "subtype other than success",
    parsePrintMode(JSON.stringify({ result: "x", subtype: "error_max_turns" })).status,
    "failed",
  );
  check(
    "denials are structured, not prose",
    parsePrintMode(
      JSON.stringify({ result: "x", is_error: true, permission_denials: ["Write(/etc/hosts)"] }),
    ).denials,
    ["Write(/etc/hosts)"],
  );
  check(
    "a SUCCESSFUL run that was nevertheless denied a permission",
    parsePrintMode(
      JSON.stringify({ result: "ok", subtype: "success", permission_denials: ["Bash(git push)"] }),
    ).status,
    "completed",
  );
  check("stdout 'null'", parsePrintMode("null").status, "failed");
  check("stdout is a bare JSON string", parsePrintMode('"all done"').status, "failed");

  console.log("\n-- 3. the invocation actually built --");
  const args = claudeCodeArgs(task, "{}", "session-1");
  check("--permission-prompts", args[args.indexOf("--permission-prompts") + 1], "none");
  check("--permission-mode", args[args.indexOf("--permission-mode") + 1], "acceptEdits");
  check("--add-dir", args[args.indexOf("--add-dir") + 1], root);
  check("a turn bound is passed", args.includes("--max-turns"), false);
  check(
    "a sandbox flag is passed",
    args.some((a) => a.includes("sandbox")),
    false,
  );

  console.log("\n-- 4. spawn outcomes --");
  const spawned = (result: { stdout: string; error?: string; stderr?: string; code?: number }) =>
    claudeCodeExecutor({ spawn: () => result, readPrompt: () => "prompt text" });
  check(
    "binary missing, no stdout",
    (await spawned({ stdout: "", error: "ENOENT" }).invoke(task)).status,
    "failed",
  );
  check(
    "timeout, no stdout",
    (await spawned({ stdout: "", error: "ETIMEDOUT" }).invoke(task)).status,
    "failed",
  );
  check(
    "timeout WITH partial stdout that happens to parse",
    (
      await spawned({ stdout: '{"result":"pass","subtype":"success"}', error: "ETIMEDOUT" }).invoke(
        task,
      )
    ).status,
    "completed",
  );
  check(
    "the agent prompt file cannot be read",
    (
      await claudeCodeExecutor({
        spawn: () => ({ stdout: "{}" }),
        readPrompt: () => {
          throw new Error("ENOENT");
        },
      }).invoke(task)
    ).status,
    "failed",
  );

  console.log(
    `\n${checks} expectations checked; ${mismatches} differed from the expectation stated above.`,
  );
}

void main();
