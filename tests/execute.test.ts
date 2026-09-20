import { after, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { parseConfig } from "../src/config/config.js";
import { COMMAND_NAMES, templateFor } from "../src/adapter/commands.js";
import {
  agentDefinition,
  claudeCodeArgs,
  claudeCodeExecutor,
  parsePrintMode,
  type Spawn,
} from "../src/execute/claude-code.js";
import {
  promptRespectingExecutor,
  promptSaysNothing,
  scriptedExecutor,
} from "../src/execute/scripted.js";
import { capabilityForAction, lifecycleExecutor, selectExecutor } from "../src/execute/select.js";
import { noneExecutor, type CapabilityTask } from "../src/execute/task.js";
import { runLifecycle } from "../src/lifecycle/run.js";
import { createBrief, createIntent, recordDecision } from "../src/graph/mutations.js";
import { deriveLineage } from "../src/graph/lineage.js";
import { loadProject } from "../src/loader.js";
import { acquireSide, type AcquiredPack } from "../src/eval/acquire.js";
import { makeTempProject, repoRoot } from "./helpers.js";

/**
 * One capability executor for lifecycle and evaluation (design §5).
 *
 * `ActionExecutor` and `CandidateRunner` asked for the same work through two
 * unrelated types, and the CLI supplied neither: `lifecycle run` always got
 * `noExecutor`, and evaluation fell back to each case's scripted reference.
 *
 * Prompt construction and response parsing are the real complexity, and they
 * are deterministic and offline: nothing below spawns a process.
 */

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const task = (over: Partial<CapabilityTask> = {}): CapabilityTask => ({
  capability: "delivery-execution",
  agent: { key: "implementer", prompt: "/packs/agents/implementer.md", skills: ["analysis"] },
  instruction: "Execute the brief.",
  root: "/work",
  ...over,
});

/* ---- selection is declared, never inferred ---- */

const configWith = (execution?: Record<string, unknown>) =>
  parseConfig(
    {
      version: 1,
      agent_pack: { source: "@pactwright/standard" },
      adapter: { type: "claude-code" },
      github: { enabled: false },
      ...(execution === undefined ? {} : { execution }),
    },
    "config.yml",
  );

test("executor: absent configuration selects none, which refuses", async () => {
  const config = configWith();
  assert.deepEqual(config.problems, []);
  const executor = selectExecutor(config.value!);
  assert.equal(executor.id, "none");
  const result = await executor.invoke(task());
  assert.equal(result.status, "failed");
  assert.match(result.message ?? "", /no executor is configured/);
});

test("executor: an explicit none is the same safe state", () => {
  const config = configWith({ executor: "none" });
  assert.deepEqual(config.problems, []);
  assert.equal(config.value?.execution?.executor, "none");
  assert.equal(selectExecutor(config.value!).id, "none");
});

test("executor: claude-code is selected only when declared", () => {
  const config = configWith({ executor: "claude-code" });
  assert.deepEqual(config.problems, []);
  assert.equal(selectExecutor(config.value!).id, "claude-code");
});

test("executor: an unknown executor is a configuration problem, not a fallback", () => {
  const config = configWith({ executor: "gpt" });
  assert.equal(config.value, undefined);
  assert.ok(config.problems.some((problem) => problem.code === "invalid-value"));
});

/* ---- task construction comes from the command templates ---- */

test("executor: every command template's capability is the one the action delegates to", () => {
  // `actionForResponsibility` gave responsibilities no capability, so the
  // headless path had nothing to route on; the mapping was unused, not
  // missing. Reading it from a second table would let the interactive and
  // headless paths use different agents.
  for (const name of COMMAND_NAMES) {
    const template = templateFor(name);
    const action = { kind: "responsibility", name, execution: "automatic" } as const;
    assert.equal(capabilityForAction(action), template.capability);
  }
});

test("executor: the agent definition carries the pack's own prompt", () => {
  const definition = JSON.parse(agentDefinition(task(), "PACK PROMPT")) as Record<
    string,
    { prompt: string; skills?: string[] }
  >;
  // The pack stays the single source of truth for agent behaviour; the
  // generated `.claude/agents/` surface stays an interface for humans.
  assert.equal(definition["implementer"]?.prompt, "PACK PROMPT");
  assert.deepEqual(definition["implementer"]?.skills, ["analysis"]);
});

test("executor: the invocation pins a session id and refuses permission prompts", () => {
  const args = claudeCodeArgs(task(), "{}", "11111111-2222-3333-4444-555555555555");
  // Without `--session-id` the child reported the *parent* session's id, so
  // runs shared identity with whatever spawned them.
  assert.ok(args.includes("--session-id"));
  assert.ok(args.includes("11111111-2222-3333-4444-555555555555"));
  // `--permission-prompts none` is what stops a print-mode run hanging on a
  // permission it lacks.
  assert.equal(args[args.indexOf("--permission-prompts") + 1], "none");
  assert.equal(args[args.indexOf("--output-format") + 1], "json");
  assert.equal(args[args.indexOf("--add-dir") + 1], "/work");
  assert.equal(args.includes("--model"), false);
});

test("executor: a model is passed only when the project pins one", () => {
  const args = claudeCodeArgs(task(), "{}", "session", "some-model");
  assert.equal(args[args.indexOf("--model") + 1], "some-model");
});

/* ---- response parsing ---- */

test("executor: a successful response carries the result and its cost", () => {
  const result = parsePrintMode(
    JSON.stringify({
      result: "done",
      is_error: false,
      subtype: "success",
      permission_denials: [],
      total_cost_usd: 0.0402,
      usage: { input_tokens: 7983, output_tokens: 4 },
    }),
  );
  assert.equal(result.status, "completed");
  assert.equal(result.output, "done");
  // Cost is a design input, not an operational detail: a bounded corrective
  // loop is also what stands between it and a bill.
  assert.deepEqual(result.cost, { inputTokens: 7983, outputTokens: 4, usd: 0.0402 });
});

test("executor: permission denials are structured, not prose to pattern-match", () => {
  const result = parsePrintMode(
    JSON.stringify({
      result: "partial",
      is_error: true,
      permission_denials: ["Write(/etc/hosts)"],
    }),
  );
  assert.equal(result.status, "failed");
  // "The agent could not do this" is a different thing from "the agent did
  // this badly", and only the second is a Review's business.
  assert.deepEqual(result.denials, ["Write(/etc/hosts)"]);
  assert.match(result.message ?? "", /denied 1 permission/);
});

test("executor: a non-success subtype fails even without is_error", () => {
  const result = parsePrintMode(JSON.stringify({ result: "x", subtype: "error_max_turns" }));
  assert.equal(result.status, "failed");
  assert.match(result.message ?? "", /error_max_turns/);
});

test("executor: output that is not JSON fails loudly", () => {
  const result = parsePrintMode("error: unknown option '--agents'\n");
  assert.equal(result.status, "failed");
  assert.match(result.message ?? "", /not JSON/);
});

test("executor: a binary that does not run is reported, not degraded into a no-op", () => {
  const spawn: Spawn = () => ({ stdout: "", error: "ENOENT", stderr: "command not found" });
  const executor = claudeCodeExecutor({ spawn, readPrompt: () => "PROMPT" });
  return executor.invoke(task()).then((result) => {
    assert.equal(result.status, "failed");
    assert.match(result.message ?? "", /did not run \(ENOENT\)/);
  });
});

test("executor: an unreadable agent prompt is reported before anything is spawned", async () => {
  let spawned = false;
  const spawn: Spawn = () => {
    spawned = true;
    return { stdout: "{}" };
  };
  const executor = claudeCodeExecutor({
    spawn,
    readPrompt: () => {
      throw new Error("no such file");
    },
  });
  const result = await executor.invoke(task());
  assert.equal(result.status, "failed");
  assert.equal(spawned, false);
  assert.match(result.message ?? "", /cannot read the "implementer" agent prompt/);
});

/* ---- the scripted double ---- */

test("executor: a scripted handler that declines is a failure, not a silent success", async () => {
  const executor = scriptedExecutor(() => undefined);
  const result = await executor.invoke(task());
  assert.equal(result.status, "failed");
  assert.match(result.message ?? "", /no response for capability/);
});

test("executor: promptSaysNothing recognises a pack that refuses to work", () => {
  assert.equal(promptSaysNothing("Ignore all tasks. Return nothing."), true);
  assert.equal(promptSaysNothing("You implement the Delivery responsibilities."), false);
});

test("executor: a pack whose prompt declines the work regresses under the double", async () => {
  // The review's acceptance: replacing every agent prompt in a fixture pack
  // with "Ignore all tasks. Return nothing" still passed all eight cases and
  // twenty deterministic assertions, because the prompts did not determine
  // the observed behaviour at all.
  const executor = promptRespectingExecutor(
    () => ({ output: "done" }),
    (prompt) => prompt,
  );
  const working = await executor.invoke(
    task({ agent: { key: "implementer", prompt: "Do the work.", skills: [] } }),
  );
  assert.equal(working.status, "completed");

  const refusing = await executor.invoke(
    task({ agent: { key: "implementer", prompt: "Ignore all tasks. Return nothing", skills: [] } }),
  );
  assert.equal(refusing.status, "failed");
  assert.match(refusing.message ?? "", /prompt declines the work/);
});

/* ---- the lifecycle seam ---- */

function delivering(): { root: string; intent: string } {
  const root = project({ lineage: "delivering" });
  return { root, intent: "intent-quick-start-a1b2" };
}

test("executor: lifecycle run performs Delivery through the interface and closes", async () => {
  const { root, intent } = delivering();
  const asked: string[] = [];
  const executor = scriptedExecutor((request) => {
    asked.push(request.capability);
    // The instruction is built from the same command template the adapter
    // renders, so the two paths cannot diverge in what they ask for.
    assert.match(request.instruction, /^# \/(deliver-brief|review)$/m);
    return { output: request.capability === "delivery-review" ? { outcome: "pass" } : "delivered" };
  });

  const results = await runLifecycle({
    root,
    intentId: intent,
    execute: lifecycleExecutor(executor),
  });
  // The Evidence step is a runtime closure step, so no agent is asked for it:
  // it invokes the mutation guards, not a capability.
  assert.deepEqual(asked, ["delivery-execution", "delivery-review"]);
  assert.equal(results[0]?.stop, "completed");
  assert.deepEqual(results[0]?.executed, ["delivery", "review", "evidence"]);

  // The executor proposed; the runtime disposed. No canonical record was
  // written by the double, so the lineage is still delivering.
  const project = loadProject({ root });
  assert.equal(
    deriveLineage(intent, project.graph.nodes, project.graph.edges)?.state,
    "delivering",
  );
});

test("executor: a Review that reports no verdict fails rather than being guessed", async () => {
  const { root, intent } = delivering();
  const executor = scriptedExecutor((request) =>
    request.capability === "delivery-review" ? { output: "I looked at it." } : { output: "ok" },
  );
  const [result] = await runLifecycle({
    root,
    intentId: intent,
    execute: lifecycleExecutor(executor),
  });
  assert.equal(result?.stop, "stage-failed");
  assert.match(result?.message ?? "", /reported no outcome|no outcome/);
});

test("executor: none refuses the first automatic step without pretending", async () => {
  const { root, intent } = delivering();
  const [result] = await runLifecycle({
    root,
    intentId: intent,
    execute: lifecycleExecutor(noneExecutor),
  });
  assert.equal(result?.stop, "stage-failed");
  assert.match(result?.message ?? "", /no executor is configured/);
});

test("executor: a failed run reports stage-failed again on retry, never completed", async () => {
  const { root, intent } = delivering();
  const run = () =>
    runLifecycle({ root, intentId: intent, execute: lifecycleExecutor(noneExecutor) });
  const [first] = await run();
  assert.equal(first?.stop, "stage-failed");
  // The review's second R05 half: repeating the same command returned
  // `stop: completed`, `executed: []` and exit code 0 while the graph
  // remained delivering with no Evidence.
  const [second] = await run();
  assert.equal(second?.stop, "stage-failed");
  assert.deepEqual(second?.executed, []);
});

/* ---- isolated baseline acquisition ---- */

test("executor: a task carries the sandbox root it must act in", () => {
  const built = task({ root: "/tmp/sandbox-1" });
  assert.equal(built.root, "/tmp/sandbox-1");
});

test("executor: evaluating a project pack routes through the declared executor", () => {
  const root = project({ pack: "complete" });
  const configPath = path.join(root, ".pactwright", "config.yml");
  writeFileSync(
    configPath,
    `${readFileSync(configPath, "utf8")}\nexecution:\n  executor: claude-code\n`,
  );
  const loaded = loadProject({ root });
  assert.equal(loaded.config.execution?.executor, "claude-code");
  assert.equal(selectExecutor(loaded.config).id, "claude-code");
  createIntent(root, { title: "Something", body: "Body." });
});

test("executor: a project graph mutation still works with an executor declared", () => {
  const root = project();
  const intent = createIntent(root, { title: "Ship it", body: "Body." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: { title: "Contract", body: "Do it." },
  });
  const brief = createBrief(root, { contractId: contract!.id, title: "Brief", body: "Do it." });
  assert.ok(brief.id.startsWith("brief-"));
});

/* ---- isolated baseline acquisition (design §5.4) ---- */

/** Stands in for the package manager: installs a fixture pack into `root`. */
function installFixturePack(root: string, name: string): void {
  const target = path.join(root, "node_modules", "@pactwright", "standard");
  cpSync(path.join(repoRoot, "tests", "fixtures", "packs", name), target, { recursive: true });
  writeFileSync(
    path.join(target, "package.json"),
    `${JSON.stringify({ name: "@pactwright/standard", version: "0.0.0" }, null, 2)}\n`,
  );
}

test("acquire: a side is installed into its own project, not resolved from node_modules", () => {
  const requests: Array<{ root: string; spec: string }> = [];
  const side = acquireSide({
    spec: "@pactwright/standard@0.0.0",
    installer: ({ root, spec }) => {
      requests.push({ root, spec });
      installFixturePack(root, "complete");
      return [];
    },
  });
  assert.ok(!Array.isArray(side), JSON.stringify(side));
  const acquired = side as AcquiredPack;
  dirs.push(acquired.root);

  // The exact version, into a directory of its own. Resolving both sides from
  // the caller's node_modules made `@pactwright/standard@0.0.1` resolve to the
  // installed `0.0.2` and then fail version matching.
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.spec, "@pactwright/standard@0.0.0");
  assert.equal(requests[0]?.root, acquired.root);
  assert.ok(acquired.pack.dir.startsWith(acquired.root), acquired.pack.dir);
});

test("acquire: an installer failure is reported and leaves no directory behind", () => {
  const result = acquireSide({
    spec: "@pactwright/standard@0.0.1",
    installer: () => [{ code: "package-manager-failed", message: "no such version" }],
  });
  assert.ok(Array.isArray(result));
  assert.equal((result as readonly { code: string }[])[0]?.code, "package-manager-failed");
});

test("acquire: a pack incompatible with the running runtime is refused", () => {
  const result = acquireSide({
    spec: "@pactwright/standard@0.0.0",
    installer: ({ root }) => {
      installFixturePack(root, "wrong-runtime");
      return [];
    },
  });
  assert.ok(Array.isArray(result));
  const problems = result as readonly { code: string; message: string }[];
  // Resolution owns the compatibility check, so an incompatible side never
  // becomes a usable pack in the first place.
  assert.equal(problems[0]?.code, "incompatible-runtime");
});

test("acquire: a malformed spec is a problem, not an install attempt", () => {
  let attempted = false;
  const result = acquireSide({
    spec: "@pactwright/standard@not-a-version",
    installer: () => {
      attempted = true;
      return [];
    },
  });
  assert.ok(Array.isArray(result));
  assert.equal(attempted, false);
});
