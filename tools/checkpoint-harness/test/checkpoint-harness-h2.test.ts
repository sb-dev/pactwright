// T3.5 H2 acceptance (T3.5 plan v4 §3 H2; Spec 00 §3): each role's Claude
// model and effort are admitted against the pinned adapter before dispatch,
// sent with every request of that role's sessions, recorded as configured and
// as the session reports applying them, and part of every evaluation's
// identity. Runs are real run directories driven offline by scripted
// sessions, as in T3-E; the real SDK is exercised up to the CLI process it
// starts. test/live/checkpoint-harness-claude.test.ts proves real provider
// sessions with admitted settings. No outcome here is acceptance.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import type { EffortLevel, HookInput } from "@anthropic-ai/claude-agent-sdk";
import stringify from "safe-stable-stringify";

import {
  EFFORT_LEVELS,
  resolveRole,
  sdkOptions,
  sdkProvider,
  Secret,
  sessionSettings,
  SUBMISSION_SCHEMA,
  type AgentOutcome,
  type ProviderRequest,
  type RoleName,
  type SpawnProcess,
} from "../src/claude.js";
import { readEvidence, readRun, type JournalEvent } from "../src/evidence.js";
import {
  amendRun,
  approveRequest,
  exitCode,
  resumeRun,
  startRun,
  type RunResult,
} from "../src/runner.js";
import {
  fixtureRepo,
  GOOD_PARSER,
  goodProducer,
  KEY_VAR,
  LENIENT_PARSER,
  OWNER,
  receiptService,
  runConfig,
  scriptedAgent,
  STEP_WORK,
  submit,
  testDeps,
  type Repo,
  type ScriptedAgent,
  type Session,
} from "./runner-fixtures.js";
import { approveAll, packetOf } from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const skillsRoot = join(here, "../../../.claude/skills");
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h2-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

type World = { repo: Repo; scratch: string };
function world(): World {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  return { repo: fixtureRepo(dir), scratch: dir };
}

type Setting = { model: string; effort: EffortLevel };
const PRODUCER: Setting = { model: "claude-opus-5-5", effort: "xhigh" };
const REVIEWER: Setting = { model: "claude-sonnet-5", effort: "low" };

/** `config` with each role's model and effort replaced, as configuration text. */
function withRoles(
  config: Record<string, unknown>,
  producer: { model: string; effort: string },
  reviewer: { model: string; effort: string },
): Record<string, unknown> {
  const roles = config.roles as Record<RoleName, Record<string, unknown>>;
  return {
    ...config,
    roles: {
      producer: { ...roles.producer, ...producer },
      reviewer: { ...roles.reviewer, ...reviewer },
    },
  };
}

const configFor = (w: World, options: Parameters<typeof runConfig>[2] = {}) =>
  withRoles(runConfig(w.repo, w.scratch, options), PRODUCER, REVIEWER);

const schema = JSON.parse(readFileSync(join(here, "../src/dispatch.schema.json"), "utf8")) as {
  $defs: { role: { properties: { model: { enum: string[] }; effort: { enum: string[] } } } };
};
const MODELS = schema.$defs.role.properties.model.enum;
const LEVELS = schema.$defs.role.properties.effort.enum;

const env = { [KEY_VAR]: "sk-ant-test-h2" };
const dispatch = (producer: Record<string, unknown>) => ({
  roles: {
    producer: { adapter: "claude-sdk", skills: [], max_turns: 8, ...producer },
    reviewer: { adapter: "claude-sdk", skills: [], max_turns: 8, ...REVIEWER },
  },
  credentials: { provider: `env:${KEY_VAR}` },
  budgets: {
    attempts: 2,
    wall_time_seconds: 60,
    provider_spend_limit: { usd: 1, turn_reservation_usd: 0.1 },
  },
});

const eventsOf = (dir: string): JournalEvent[] => {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return read.records.events;
};

const actions = (dir: string, action: string): JournalEvent[] =>
  eventsOf(dir).filter((e) => e.action === action);

function recordsOf<T>(dir: string, action: string): T[] {
  return actions(dir, action).map((e) => {
    const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
    assert.ok(ref !== undefined);
    return JSON.parse(readEvidence(dir, ref).toString("utf8")) as T;
  });
}

function dirOf(result: RunResult): string {
  assert.ok(result.outcome !== "invalid", stringify(result, null, 2));
  return result.dir;
}

function assertAccepted(result: RunResult, steps: string[]): void {
  assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
  assert.ok(result.outcome === "selection-accepted");
  assert.deepEqual(result.accepted, steps);
}

function assertPaused(result: RunResult, code: string, detail: RegExp = /./): void {
  assert.equal(result.outcome, "paused", stringify(result, null, 2));
  assert.ok(result.outcome === "paused");
  assert.equal(exitCode(result), 3);
  assert.ok(
    result.reasons.some((r) => r.code === code && detail.test(r.detail)),
    stringify(result.reasons, null, 2),
  );
}

/** The approval request a paused run names. */
function requestOf(result: RunResult): string {
  assert.ok(result.outcome === "paused", stringify(result, null, 2));
  const request = result.reasons.find((r) => r.request !== null)?.request;
  assert.ok(request, "the pause names an approval request");
  return request;
}

const reviewer = (): ScriptedAgent =>
  scriptedAgent(({ packet }) => ({ output: approveAll(packet) }));

/** A producer doing each step's correct work after reporting `levels` for its turn. */
const reportingProducer = (levels: (request: ProviderRequest) => string[]): ScriptedAgent =>
  scriptedAgent(async (session: Session) => {
    for (const level of levels(session.request)) session.request.onEffort(level);
    const work = STEP_WORK[session.packet.step.id];
    assert.ok(work);
    return submit(session, work.files(), work.outputs);
  });

/** Evaluation digests of `step`, in journal order, each once. */
const evaluationsOf = (dir: string, step: string): string[] => [
  ...new Set(
    actions(dir, "evaluation")
      .filter((e) => e.data.step === step)
      .map((e) => e.evaluation ?? ""),
  ),
];

const amend = async (
  w: World,
  dir: string,
  config: Record<string, unknown>,
  reason: string,
): Promise<string[]> => {
  const amended = await amendRun(
    dir,
    { config, reason, actor: OWNER },
    {
      repoRoot: w.repo.root,
      skillsRoot,
      env,
    },
  );
  assert.ok(amended.ok, stringify(amended));
  return amended.changes.map((c) => c.path);
};

describe("H2-01: each role is admitted with a model and effort the pinned adapter accepts", () => {
  it("the schema and the adapter's table list the same models and levels", () => {
    assert.deepEqual(Object.keys(EFFORT_LEVELS).sort(), [...MODELS].sort());
    assert.deepEqual(LEVELS, ["low", "medium", "high", "xhigh", "max"]);
    for (const levels of Object.values(EFFORT_LEVELS)) {
      assert.ok(levels.every((l) => LEVELS.includes(l)));
    }
    assert.deepEqual(EFFORT_LEVELS["claude-haiku-4-5-20251001"], []);
  });

  it("every model and level pair resolves exactly when the table admits it", () => {
    for (const model of MODELS) {
      for (const effort of LEVELS) {
        const resolved = resolveRole(dispatch({ model, effort }), "producer", { skillsRoot, env });
        const admitted = (EFFORT_LEVELS[model] ?? []).some((level) => level === effort);
        assert.equal(resolved.ok, admitted, `${model} ${effort}`);
        if (resolved.ok) {
          assert.deepEqual([resolved.role.model, resolved.role.effort], [model, effort]);
        } else {
          assert.ok(
            resolved.diagnostics.some((d) =>
              d.startsWith(`roles.producer.effort: ${model} does not accept effort ${effort}`),
            ),
            resolved.diagnostics.join("\n"),
          );
        }
      }
    }
  });

  it("producer and reviewer resolve to their own settings; limits do not depend on effort", () => {
    const config = dispatch(PRODUCER);
    const roles = (["producer", "reviewer"] as const).map((name) => {
      const resolved = resolveRole(config, name, { skillsRoot, env });
      assert.ok(resolved.ok, resolved.ok ? "" : resolved.diagnostics.join("\n"));
      return resolved.role;
    });
    assert.deepEqual(
      roles.map((r) => [r.name, r.model, r.effort]),
      [
        ["producer", PRODUCER.model, PRODUCER.effort],
        ["reviewer", REVIEWER.model, REVIEWER.effort],
      ],
    );
    const limits = LEVELS.map((effort) => {
      const resolved = resolveRole(dispatch({ model: PRODUCER.model, effort }), "producer", {
        skillsRoot,
        env,
      });
      assert.ok(resolved.ok);
      return resolved.role.limits;
    });
    for (const l of limits) assert.deepEqual(l, roles[0]?.limits);
  });

  it("a missing, unknown or unsupported setting fails admission before any session or run", async () => {
    const cases: [string, (c: Record<string, unknown>) => Record<string, unknown>, RegExp][] = [
      [
        "missing effort",
        (c) => {
          const roles = c.roles as Record<RoleName, Record<string, unknown>>;
          const { effort: _dropped, ...producer } = roles.producer;
          void _dropped;
          return { ...c, roles: { ...roles, producer } };
        },
        /dispatch: \/roles\/producer must have required property 'effort'/,
      ],
      [
        "unknown level",
        (c) => withRoles(c, { ...PRODUCER, effort: "extreme" }, REVIEWER),
        /dispatch: \/roles\/producer\/effort must be equal to one of the allowed values/,
      ],
      [
        "model without effort",
        (c) => withRoles(c, PRODUCER, { model: "claude-haiku-4-5-20251001", effort: "low" }),
        /roles\.reviewer\.effort: claude-haiku-4-5-20251001 does not accept effort low; it accepts no effort setting/,
      ],
    ];
    for (const [name, edit, pattern] of cases) {
      const w = world();
      const producer = goodProducer();
      const review = reviewer();
      const result = await startRun(
        edit(configFor(w)),
        testDeps(w.repo, { producer, reviewer: review }),
      );
      assert.equal(result.outcome, "invalid", name);
      assert.ok(result.outcome === "invalid");
      assert.equal(exitCode(result), 2);
      assert.ok(
        result.diagnostics.some((d) => pattern.test(d)),
        `${name}: ${result.diagnostics.join("\n")}`,
      );
      assert.equal(producer.requests.length + review.requests.length, 0, name);
      assert.equal(existsSync(join(w.scratch, "runs")), false, `${name}: no run directory`);
    }
  });

  it("an amendment to an unsupported setting is refused and records nothing", async () => {
    const w = world();
    const result = await startRun(
      configFor(w),
      testDeps(w.repo, { producer: goodProducer(), reviewer: reviewer() }),
    );
    assertAccepted(result, ["CP99-S01"]);
    const dir = dirOf(result);
    const before = eventsOf(dir).length;
    const refused = await amendRun(
      dir,
      {
        config: withRoles(configFor(w), PRODUCER, {
          ...REVIEWER,
          model: "claude-haiku-4-5-20251001",
        }),
        reason: "a cheaper reviewer",
        actor: OWNER,
      },
      { repoRoot: w.repo.root, skillsRoot, env },
    );
    assert.equal(refused.ok, false);
    assert.match(stringify(refused), /claude-haiku-4-5-20251001 does not accept effort low/);
    assert.equal(eventsOf(dir).length, before);
  });
});

describe("H2-02: each role's requests carry its model and effort to the SDK", () => {
  it("every producer and reviewer session of a run is requested with its role's settings", async () => {
    const w = world();
    const producer = goodProducer();
    const review = reviewer();
    assertAccepted(await startRun(configFor(w), testDeps(w.repo, { producer, reviewer: review })), [
      "CP99-S01",
    ]);
    const kinds = review.requests.map((r) => packetOf(r).review?.kind);
    assert.ok(kinds.includes("adequacy") && kinds.includes("candidate"), kinds.join(","));
    for (const [requests, setting] of [
      [producer.requests, PRODUCER],
      [review.requests, REVIEWER],
    ] as const) {
      assert.ok(requests.length > 0);
      for (const request of requests) {
        assert.deepEqual([request.model, request.effort], [setting.model, setting.effort]);
        const options = sdkOptions(request, "/controller/home");
        assert.deepEqual([options.model, options.effort], [setting.model, setting.effort]);
      }
    }
  });

  const request = (
    setting: Setting,
    onEffort: (level: string) => void = () => undefined,
  ): ProviderRequest => ({
    model: setting.model,
    effort: setting.effort,
    onEffort,
    system: "system",
    prompt: "prompt",
    tools: [],
    outputSchema: SUBMISSION_SCHEMA,
    maxTurns: 4,
    maxBudgetUsd: 0.5,
    credential: new Secret("sk-ant-test-h2"),
    credentialKind: "api-key",
    abort: new AbortController(),
  });

  it(
    "the SDK starts the Claude Code CLI with the role's --model and --effort",
    { timeout: 60_000 },
    async () => {
      for (const setting of [PRODUCER, REVIEWER]) {
        const argv: string[][] = [];
        // Records the CLI command line, then starts a process that exits at
        // once, so no session or provider call follows.
        const record: SpawnProcess = (command, args, options) => {
          argv.push([command, ...args]);
          return spawn(process.execPath, ["-e", ""], options);
        };
        await assert.rejects(async () => {
          for await (const event of sdkProvider(request(setting), record)) void event;
        });
        assert.equal(argv.length, 1);
        const args = argv[0] ?? [];
        const valueOf = (flag: string): (string | undefined)[] =>
          args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
        assert.deepEqual(valueOf("--model"), [setting.model], args.join(" "));
        assert.deepEqual(valueOf("--effort"), [setting.effort], args.join(" "));
      }
    },
  );

  it("the session settings digest and the observer hook cover effort", async () => {
    const settingsOf = (r: ProviderRequest): string => stringify(sessionSettings(r)) ?? "";
    assert.notEqual(
      settingsOf(request(PRODUCER)),
      settingsOf(request({ ...PRODUCER, effort: "high" })),
    );
    assert.deepEqual(sessionSettings(request(PRODUCER)).hooks, ["PreToolUse", "Stop"]);

    const reported: string[] = [];
    const hooks = sdkOptions(
      request(PRODUCER, (l) => reported.push(l)),
      "/controller/home",
    ).hooks;
    assert.deepEqual(Object.keys(hooks ?? {}).sort(), ["PreToolUse", "Stop"]);
    const input = (effort?: { level: string }): HookInput =>
      ({
        hook_event_name: "PreToolUse",
        session_id: "s",
        transcript_path: "/t",
        cwd: "/controller/home",
        tool_name: "mcp__workspace__write_file",
        tool_input: { path: "src/a.ts", content: "secret content" },
        tool_use_id: "u",
        ...(effort ? { effort } : {}),
      }) as HookInput;
    for (const matchers of Object.values(hooks ?? {})) {
      assert.equal(matchers.length, 1);
      const [observe] = matchers[0]?.hooks ?? [];
      assert.ok(observe);
      const signal = new AbortController().signal;
      // No decision: permissions stay as configured, and the tool input is not recorded.
      assert.deepEqual(await observe(input({ level: "max" }), "u", { signal }), {});
      assert.deepEqual(await observe(input(), "u", { signal }), {});
    }
    assert.deepEqual(reported, ["max", "max"]);
  });
});

describe("H2-03: evidence separates requested and reported settings; identity follows them", () => {
  it("each invocation records the configured settings and those the session reported", async () => {
    const w = world();
    const producer = reportingProducer((r) => [r.effort]);
    const result = await startRun(
      configFor(w),
      testDeps(w.repo, { producer, reviewer: reviewer() }),
    );
    assertAccepted(result, ["CP99-S01"]);
    const dir = dirOf(result);
    const produced = recordsOf<AgentOutcome>(dir, "agent-invocation");
    assert.equal(produced.length, 1);
    assert.deepEqual(produced[0]?.observation.model, {
      configured: PRODUCER.model,
      reported: PRODUCER.model,
      used: [PRODUCER.model],
    });
    assert.deepEqual(produced[0]?.observation.effort, {
      configured: PRODUCER.effort,
      reported: [PRODUCER.effort],
    });
    // A session that reports no effort says so; nothing is inferred from the request.
    const reviews = recordsOf<{ kind: string; outcome: AgentOutcome }>(dir, "review");
    assert.deepEqual([...new Set(reviews.map((r) => r.kind))].sort(), ["adequacy", "candidate"]);
    for (const { outcome } of reviews) {
      assert.equal(outcome.observation.role, "reviewer");
      assert.deepEqual(outcome.observation.effort, {
        configured: REVIEWER.effort,
        reported: "not-reported",
      });
    }
  });

  it("a session reporting another effort fails at once and its later tool calls are refused", async () => {
    const w = world();
    const replies: { ok: boolean; text: string }[] = [];
    const producer = scriptedAgent(async (session) => {
      session.request.onEffort("high");
      replies.push(
        await session.call("write_file", { path: "src/parser.mjs", content: GOOD_PARSER() }),
      );
      return submit(session, {}, { "config-parser": ["src/parser.mjs"] });
    });
    const result = await startRun(
      configFor(w, { retries: 0 }),
      testDeps(w.repo, { producer, reviewer: reviewer() }),
    );
    assertPaused(result, "retries");
    const dir = dirOf(result);
    const [outcome] = recordsOf<AgentOutcome>(dir, "agent-invocation");
    assert.ok(outcome?.outcome === "failed", stringify(outcome));
    assert.equal(outcome.reason, "effective session differs: effort high is not xhigh");
    assert.deepEqual(outcome.observation.effort, { configured: "xhigh", reported: ["high"] });
    assert.deepEqual(replies, [
      { ok: false, text: "the invocation is closed; no further tool calls run" },
    ]);
    assert.equal(actions(dir, "evaluation").length, 0);
  });

  it("the evaluation identity changes with effort alone and with model alone", async () => {
    const w = world();
    const producer = goodProducer();
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const first = await startRun(configFor(w), deps);
    assertAccepted(first, ["CP99-S01"]);
    const dir = dirOf(first);
    const effortOnly = withRoles(configFor(w), { ...PRODUCER, effort: "high" }, REVIEWER);
    assert.deepEqual(await amend(w, dir, effortOnly, "a lower producer effort"), [
      "/roles/producer/effort",
    ]);
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    const modelOnly = withRoles(
      effortOnly,
      { ...PRODUCER, effort: "high" },
      { ...REVIEWER, model: "claude-opus-5-5" },
    );
    assert.deepEqual(await amend(w, dir, modelOnly, "a stronger reviewer"), [
      "/roles/reviewer/model",
    ]);
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);

    assert.equal(evaluationsOf(dir, "CP99-S01").length, 3);
    const manifests = recordsOf<{
      step: string;
      candidate: { commit: string };
      manifest: Record<string, unknown>;
    }>(dir, "evaluation").filter((r) => r.step === "CP99-S01");
    assert.equal(new Set(manifests.map((m) => m.candidate.commit)).size, 1, "one candidate");
    for (let i = 1; i < manifests.length; i++) {
      const [a, b] = [manifests[i - 1]?.manifest ?? {}, manifests[i]?.manifest ?? {}];
      const changed = Object.keys(a).filter((k) => stringify(a[k]) !== stringify(b[k]));
      assert.deepEqual(changed, ["configuration"], "only the evaluated configuration differs");
    }
    assert.equal(producer.requests.length, 1, "the candidate is not produced again");
  });
});

describe("H2-04: amending model or effort re-evaluates without resetting budgets or replaying effects", () => {
  it("an effort amendment after an effect re-reviews and asks again; the effect never repeats", async () => {
    const w = world();
    const service = receiptService();
    const producer = goodProducer();
    const review = reviewer();
    const deps = testDeps(w.repo, { producer, reviewer: review, effects: service });
    const config = configFor(w, { checkpoint: "CP98", through: "CP98-S01" });
    const paused = await startRun(config, deps);
    const dir = dirOf(paused);
    assert.ok(
      (
        await approveRequest(dir, {
          request: requestOf(paused),
          decision: "approved",
          actor: OWNER,
        })
      ).ok,
    );
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);
    assert.equal(service.executions.length, 1);
    const history = (): (string | undefined)[] =>
      eventsOf(dir)
        .filter((e) => e.action === "agent-invocation" || e.action === "review")
        .map((e) => e.evidence[0]);
    const earlier = history();
    const reviews = review.requests.length;

    const amended = withRoles(config, PRODUCER, { ...REVIEWER, effort: "max" });
    assert.deepEqual(await amend(w, dir, amended, "a deeper review"), ["/roles/reviewer/effort"]);
    const again = await resumeRun(dir, deps);
    assert.ok(
      (await approveRequest(dir, { request: requestOf(again), decision: "approved", actor: OWNER }))
        .ok,
    );
    assertAccepted(await resumeRun(dir, deps), ["CP98-S01"]);

    assert.equal(service.executions.length, 1, "the completed effect is not replayed");
    assert.equal(actions(dir, "effect-intent").length, 1);
    assert.equal(producer.requests.length, 1, "no new production");
    assert.ok(review.requests.length > reviews, "the evaluation is reviewed again");
    assert.ok(review.requests.slice(reviews).every((r) => r.effort === "max"));
    assert.deepEqual(
      history().slice(0, earlier.length),
      earlier,
      "earlier invocation and review records, with their usage, are kept",
    );
  });

  it("exhausted attempts stay exhausted after an effort amendment", async () => {
    const w = world();
    const producer = scriptedAgent((session) =>
      submit(
        session,
        { "src/parser.mjs": LENIENT_PARSER },
        { "config-parser": ["src/parser.mjs"] },
      ),
    );
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const config = configFor(w, { attempts: 2 });
    const paused = await startRun(config, deps);
    assertPaused(paused, "exhausted", /production attempts/);
    const dir = dirOf(paused);
    assert.deepEqual(
      await amend(
        w,
        dir,
        withRoles(config, { ...PRODUCER, effort: "max" }, REVIEWER),
        "think harder",
      ),
      ["/roles/producer/effort"],
    );
    assertPaused(await resumeRun(dir, deps), "exhausted", /production attempts/);
    assert.deepEqual(
      producer.packets.map((p) => p.attempt),
      [1, 2],
    );
  });

  it("lowering effort after a spend stop reruns the same attempt and counts the retry", async () => {
    const w = world();
    let calls = 0;
    const producer = scriptedAgent((session) =>
      ++calls === 1
        ? { subtype: "error_max_budget_usd" }
        : submit(
            session,
            { "src/parser.mjs": GOOD_PARSER() },
            { "config-parser": ["src/parser.mjs"] },
          ),
    );
    const deps = testDeps(w.repo, { producer, reviewer: reviewer() });
    const config = configFor(w);
    const paused = await startRun(config, deps);
    assertPaused(paused, "exhausted", /spend/);
    const dir = dirOf(paused);
    const lowered = withRoles(config, { ...PRODUCER, effort: "low" }, REVIEWER);
    assert.deepEqual(await amend(w, dir, lowered, "spend less per turn"), [
      "/roles/producer/effort",
    ]);
    assertAccepted(await resumeRun(dir, deps), ["CP99-S01"]);
    assert.deepEqual(
      producer.requests.map((r) => [packetOf(r).attempt, r.effort, r.maxBudgetUsd]),
      [
        [1, "xhigh", 0.9],
        [1, "low", 0.9],
      ],
      "the same attempt, the same spend limit",
    );
    const produce = recordsOf<{ phase: string; key: string }>(dir, "start").filter(
      (s) => s.phase === "produce",
    );
    assert.deepEqual(
      produce.map((s) => s.key),
      ["produce/CP99-S01/1", "produce/CP99-S01/1"],
      "the rerun is a counted retry, not a fresh attempt",
    );
  });
});
