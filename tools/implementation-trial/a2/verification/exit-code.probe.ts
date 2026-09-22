/**
 * V05 — the Claude Code executor never reads the child process's exit status.
 *
 * `SpawnResult` declares `code`, and `defaultSpawn` fills it in on both paths
 * (`code: 0` on success, `failure.status` on error). `claudeCodeExecutor.invoke`
 * reads `result.error` and `result.stdout` and never `result.code`; the only
 * failure gate is `result.error !== undefined && result.stdout.trim().length === 0`.
 *
 * So a child that exits non-zero but still printed a JSON object is parsed as
 * an ordinary response. When that object has neither `is_error` nor a
 * non-`success` `subtype` — which is what a truncated or killed print-mode run
 * can leave behind — the executor reports `completed`.
 *
 * `tests/execute.test.ts:195` covers the case where stdout is empty. Nothing
 * covers non-empty stdout with a non-zero exit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  claudeCodeExecutor,
  parsePrintMode,
  type CapabilityTask,
  type Spawn,
} from "../../../../src/index.js";

const task = (over: Partial<CapabilityTask> = {}): CapabilityTask => ({
  capability: "delivery-execution",
  agent: { key: "implementer", prompt: "/packs/agents/implementer.md", skills: [] },
  instruction: "Execute the brief.",
  root: "/work",
  ...over,
});

test("V05: a non-zero exit with a JSON body is reported as a completed capability", async () => {
  // Exit 1, a timeout kill, anything: the status is present and ignored.
  const spawn: Spawn = () => ({
    stdout: JSON.stringify({ result: "partial work" }),
    stderr: "Error: process exited unexpectedly",
    code: 1,
    error: "ERR_CHILD",
  });
  const executor = claudeCodeExecutor({ spawn, readPrompt: () => "PROMPT" });
  const result = await executor.invoke(task());

  assert.equal(result.status, "completed", "the non-zero exit is not consulted");
  assert.equal(result.output, "partial work");
  assert.equal(result.message, undefined, "and nothing records that the child failed");
});

test("V05b: a SIGTERM'd run whose JSON survived is indistinguishable from a clean one", async () => {
  // `execFileSync` with a `timeout` kills the child and throws with
  // `signal: "SIGTERM"` and whatever stdout had already been written. If that
  // partial buffer happens to be a complete JSON object, the timeout vanishes.
  const spawn: Spawn = () => ({
    stdout: JSON.stringify({ result: { outcome: "pass" }, subtype: "success" }),
    code: 143,
    error: "ETIMEDOUT",
  });
  const executor = claudeCodeExecutor({ spawn, readPrompt: () => "PROMPT" });
  const result = await executor.invoke(task({ capability: "delivery-review" }));

  assert.equal(result.status, "completed");
  assert.deepEqual(result.output, { outcome: "pass" });
  // A Review whose verdict came from a timed-out run advances the lifecycle:
  // `lifecycleExecutor`'s `interpret` reads `outcome` and returns `pass`.
});

test("V05c: the parser alone is sound — it is the invocation that drops the status", () => {
  // `parsePrintMode` is given no exit status, so it cannot be blamed. Both
  // documented failure markers work.
  assert.equal(parsePrintMode(JSON.stringify({ is_error: true })).status, "failed");
  assert.equal(parsePrintMode(JSON.stringify({ subtype: "error_max_turns" })).status, "failed");
  // Which is exactly why the missing check belongs in `invoke`: a non-zero exit
  // is the third failure marker and the only one the tool reports out of band.
  assert.equal(parsePrintMode(JSON.stringify({ result: "x" })).status, "completed");
});
