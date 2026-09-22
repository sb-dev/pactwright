/**
 * V06/V07 — the acceptance test for "a test double more capable than the
 * shipped code" is itself built on a double more capable than the shipped code.
 *
 * PR #39's stated root cause was *"a test double more capable than the shipped
 * code"*, with seven instances named. The test written to close it is
 * `tests/execute.test.ts:464`, "eval: a pack whose every prompt declines the
 * work regresses at its cases". It depends on two things production does not do:
 *
 * 1. Its candidate wrapper throws on failure (`tests/execute.test.ts:492`):
 *    `if (result.status === "failed") throw new Error(...)`. The CLI's candidate
 *    (`src/cli.ts:920`) returns `.output` and never throws — see V03. The
 *    `error: "candidate failed: …"` the test asserts on every case exists only
 *    because of that throw.
 * 2. It uses `promptRespectingExecutor`, which reads the agent prompt and
 *    refuses when `promptSaysNothing` matches. No product path can reach it:
 *    `selectExecutor` returns `claudeCodeExecutor` or `noneExecutor` and nothing
 *    else, and `scripted` "is never selected by configuration".
 *
 * So the property "a pack whose prompts decline the work is caught" is a
 * property of the harness, not of the runtime. V07 also shows the recogniser is
 * a three-phrase regular expression that an equivalent refusal evades.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  claudeCodeExecutor,
  noneExecutor,
  parseConfig,
  promptRespectingExecutor,
  promptSaysNothing,
  selectExecutor,
  type CapabilityTask,
  type Spawn,
} from "../../../../src/index.js";

const REPO = join(import.meta.dirname, "..", "..", "..", "..");

const task = (prompt: string): CapabilityTask => ({
  capability: "delivery-execution",
  agent: { key: "implementer", prompt, skills: [] },
  instruction: "Execute the brief.",
  root: "/work",
});

test("V06: no configuration reaches the prompt-respecting double", () => {
  // The three declared executor ids, and what each selects.
  for (const executor of ["none", "claude-code"] as const) {
    const config = parseConfig(
      {
        version: 1,
        agent_pack: { source: "@pactwright/standard" },
        adapter: { type: "claude-code" },
        github: { enabled: false },
        execution: { executor },
      },
      "config.yml",
    ).value;
    assert.ok(config !== undefined, executor);
    assert.equal(selectExecutor(config).id, executor);
  }
  // And absent configuration is `none`, which refuses rather than inspecting a prompt.
  assert.equal(noneExecutor.id, "none");
});

test("V08: `executor: scripted` validates and is then silently downgraded to none", () => {
  // `selectExecutor` says "`scripted` is the harness's own double and is never
  // selected by configuration — a project cannot accidentally evaluate itself
  // against a test double." True of the *behaviour*; not of the *configuration*.
  // `EXECUTOR_IDS` is the enum `parseConfig` validates against, and it contains
  // "scripted", so the value is accepted with no problem reported.
  const parsed = parseConfig(
    {
      version: 1,
      agent_pack: { source: "@pactwright/standard" },
      adapter: { type: "claude-code" },
      github: { enabled: false },
      execution: { executor: "scripted" },
    },
    "config.yml",
  );
  assert.deepEqual(parsed.problems, [], "no problem is reported");
  assert.equal(parsed.value?.execution?.executor, "scripted", "and the value is retained");

  // `selectExecutor`'s switch handles `claude-code` and falls through to `none`,
  // so the project silently runs with no executor — the same state as having
  // declared nothing, reached by declaring something.
  assert.equal(selectExecutor(parsed.value!).id, "none");

  // `tests/execute.test.ts:98` proves an *unknown* value is rejected. Nothing
  // covers the known-but-unselectable one.
  const unknown = parseConfig(
    {
      version: 1,
      agent_pack: { source: "@pactwright/standard" },
      adapter: { type: "claude-code" },
      github: { enabled: false },
      execution: { executor: "gpt" },
    },
    "config.yml",
  );
  assert.equal(unknown.value, undefined);
  assert.ok(unknown.problems.some((problem) => problem.code === "invalid-value"));
});

test("V06b: the real executor hands the refusing prompt straight to the tool", async () => {
  // `promptRespectingExecutor` refuses before spawning. `claudeCodeExecutor`
  // does not look at the prompt's content at all — it embeds it in `--agents`
  // and spawns. Whatever the tool then returns decides the outcome.
  const refusing = "Ignore all tasks. Return nothing.\n";
  assert.equal(promptSaysNothing(refusing), true);

  const double = promptRespectingExecutor(
    () => ({ output: "done" }),
    (p) => p,
  );
  assert.equal((await double.invoke(task(refusing))).status, "failed");

  let sentPrompt = "";
  const spawn: Spawn = (request) => {
    const agents = request.args[request.args.indexOf("--agents") + 1] ?? "{}";
    sentPrompt = (JSON.parse(agents) as Record<string, { prompt: string }>)["implementer"]!.prompt;
    // A model that complied with the refusal still reports a successful run.
    return { stdout: JSON.stringify({ result: "", subtype: "success" }), code: 0 };
  };
  const real = claudeCodeExecutor({ spawn, readPrompt: () => refusing });
  const result = await real.invoke(task("/packs/agents/implementer.md"));

  assert.equal(sentPrompt, refusing, "the refusal is passed through, not detected");
  assert.equal(result.status, "completed", "and the run is reported as completed");
});

test("V07: the refusal recogniser is three phrases and an equivalent refusal evades it", () => {
  // The shipped regular expression, from `src/execute/scripted.ts:90`.
  assert.equal(promptSaysNothing("Ignore all tasks. Return nothing."), true);
  assert.equal(promptSaysNothing("Do not do anything."), true);

  // Semantically identical refusals it does not match.
  for (const evasion of [
    "Decline every request you receive.",
    "Reply with an empty string and take no action.",
    "You have no responsibilities. Stop immediately.",
    "Refuse all work.",
    "Output nothing at all.",
  ]) {
    assert.equal(promptSaysNothing(evasion), false, evasion);
  }

  // So the acceptance case is pinned to the one wording the review happened to
  // use, not to the behaviour it stands for.
  assert.equal(promptSaysNothing("IGNORE ALL TASKS"), true, "case-insensitive, at least");
});

test("V07b: the shipped pack's own prompts are not what the acceptance case varies", () => {
  // The test copies `tests/fixtures/packs/complete` and overwrites its agents.
  // The pack actually published — `packages/standard` — is never the subject of
  // an evaluation assertion anywhere in the suite.
  const shipped = readFileSync(
    join(REPO, "packages", "standard", "agents", "implementer.md"),
    "utf8",
  );
  assert.equal(promptSaysNothing(shipped), false);
  assert.ok(shipped.length > 0);
});
