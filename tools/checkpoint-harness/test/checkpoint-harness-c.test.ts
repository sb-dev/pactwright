// T3-C acceptance, offline part (Task 3 research log §12): the adapter's
// dispatch refusals, packets, effective-session checks and outcome union,
// driven by scripted providers and an in-memory workspace. A real provider
// session through B's containment is proved by
// test/live/checkpoint-harness-claude.test.ts. No outcome here is acceptance.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import stringify from "safe-stable-stringify";

import {
  buildPacket,
  fromSdkMessage,
  invokeAgent,
  recordInvocation,
  resolveRole,
  sdkOptions,
  Secret,
  sessionSettings,
  SUBMISSION_SCHEMA,
  type AgentOutcome,
  type AgentRole,
  type Packet,
  type Provider,
  type ProviderEvent,
  type ProviderRequest,
  type RoleName,
  type WorkspaceOps,
  workspaceTools,
} from "../src/claude.js";
import { prepareRun, sha256, type AcceptedOutput, type PreparedRun } from "../src/contracts.js";
import { createRun, readEvidence, readRun } from "../src/evidence.js";
import type { WritePolicy } from "../src/workspace.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const fixture = join(here, "fixtures/checkpoint-harness");

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-c-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const SECRET = "sk-ant-test-0123456789-secret";
const MODEL = "claude-fixture-1";
const POLICY: WritePolicy = {
  writable: ["src"],
  scratch: ["build"],
  protected: ["src/verifier.ts"],
};

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

let plan: PreparedRun;
before(async () => {
  const root = join(scratch, "repo");
  cpSync(fixture, root, { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  const rev = git(root, ["rev-parse", "HEAD"]);
  const result = await prepareRun(
    {
      repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: rev },
      checkpoint: "docs/checkpoints/99-fixture/checkpoint.yml",
      definitions: { revision: rev, review: "fixture review" },
      selection: { through: "CP99-S02" },
    },
    { repoRoot: root },
  );
  assert.ok(result.ok, result.ok ? "" : result.diagnostics.join("\n"));
  plan = result.plan;
});

const acceptedParser = (): AcceptedOutput => ({
  step: "CP99-S01",
  output: "config-parser",
  definition: plan.stepDefinitions["CP99-S01"] ?? "",
  definitions: plan.definitionsDigest,
  evidence: ["fixture acceptance"],
});

function role(name: RoleName = "producer", limits: Partial<AgentRole["limits"]> = {}): AgentRole {
  return {
    name,
    model: MODEL,
    available: ["karpathy-guidelines"],
    skills: [{ name: "karpathy-guidelines", digest: sha256("skill"), text: "skill" }],
    limits: { attempts: 3, wallTimeMs: 5_000, maxTurns: 8, maxBudgetUsd: 1, ...limits },
    credential: new Secret(SECRET),
  };
}

function packetFor(r: AgentRole, attempt = 1): Packet {
  const built = buildPacket(plan, "CP99-S02", r, {
    attempt,
    accepted: [acceptedParser()],
    policy: POLICY,
  });
  assert.ok(built.ok, built.ok ? "" : built.diagnostics.join("\n"));
  return built.packet;
}

/** An in-memory workspace applying the write policy, recording every write. */
function memoryOps(files: Record<string, string> = { "src/lib.ts": "old\n" }): WorkspaceOps & {
  files: Map<string, string>;
  writes: string[];
} {
  const map = new Map(Object.entries(files));
  const writes: string[] = [];
  const inside = (path: string, prefixes: readonly string[]): boolean =>
    prefixes.some((p) => path === p || path.startsWith(`${p}/`));
  return {
    files: map,
    writes,
    readFile(path) {
      const text = map.get(path);
      return Promise.resolve(
        text === undefined
          ? { ok: false, reason: `${path}: No such file or directory` }
          : { ok: true, bytes: Buffer.from(text) },
      );
    },
    writeFile(path, bytes) {
      if (!inside(path, POLICY.writable) || inside(path, POLICY.protected)) {
        return Promise.resolve({ ok: false, reason: `${path}: Read-only file system` });
      }
      writes.push(path);
      map.set(path, bytes.toString("utf8"));
      return Promise.resolve({ ok: true });
    },
    exec() {
      return Promise.resolve({
        exitCode: 1,
        stdout: Buffer.alloc(0),
        stderr: Buffer.alloc(0),
        timedOut: false,
      });
    },
  };
}

const account = (overrides: Partial<Extract<ProviderEvent, { type: "account" }>> = {}) =>
  ({
    type: "account",
    apiKeySource: "ANTHROPIC_API_KEY",
    tokenSource: null,
    apiProvider: "firstParty",
    ...overrides,
  }) as const;

const init = (
  request: ProviderRequest,
  overrides: Partial<Extract<ProviderEvent, { type: "init" }>> = {},
): Extract<ProviderEvent, { type: "init" }> => ({
  type: "init",
  session: "session-1",
  model: MODEL,
  tools: ["StructuredOutput", ...request.tools.map((t) => `mcp__workspace__${t.name}`)],
  mcpServers: [{ name: "workspace", status: "connected" }],
  plugins: [],
  permissionMode: "dontAsk",
  apiKeySource: "ANTHROPIC_API_KEY",
  ...overrides,
});

const result = (
  output: unknown,
  overrides: Partial<Extract<ProviderEvent, { type: "result" }>> = {},
): ProviderEvent => ({
  type: "result",
  subtype: "success",
  isError: false,
  output: typeof output === "string" ? output : JSON.stringify(output),
  costUsd: 0.25,
  inputTokens: 100,
  outputTokens: 20,
  models: [MODEL],
  turns: 3,
  denials: [],
  errors: [],
  ...overrides,
});

const SUBMISSION = {
  status: "submitted",
  outputs: [{ output: "command", paths: ["src/lib.ts"] }],
  changes: [{ path: "src/lib.ts", summary: "prints the parsed configuration" }],
  verifier_proposals: [],
  blockers: [],
};

/** A provider that plays `script` and records how far it got. */
function scripted(
  script: (request: ProviderRequest) => AsyncGenerator<ProviderEvent>,
): Provider & { requests: ProviderRequest[] } {
  const requests: ProviderRequest[] = [];
  const provider = (request: ProviderRequest): AsyncIterable<ProviderEvent> => {
    requests.push(request);
    return script(request);
  };
  return Object.assign(provider, { requests });
}

const call = (request: ProviderRequest, name: string, args: unknown) => {
  const def = request.tools.find((t) => t.name === name);
  assert.ok(def, `tool ${name} is offered`);
  return def.run(args);
};

const never = (): Promise<never> => new Promise(() => undefined);

async function invoke(
  provider: Provider,
  options: { role?: AgentRole; ops?: WorkspaceOps; signal?: AbortSignal; attempt?: number } = {},
): Promise<AgentOutcome> {
  const r = options.role ?? role();
  return invokeAgent(
    r,
    packetFor(r, options.attempt),
    options.ops ?? memoryOps(),
    options.signal ?? new AbortController().signal,
    { provider },
  );
}

describe("T3-C dispatch refuses incomplete configuration", () => {
  const skills = join(scratch, "skills");
  before(() => {
    for (const name of ["karpathy-guidelines", "code-review-and-quality"]) {
      mkdirSync(join(skills, name), { recursive: true });
      writeFileSync(join(skills, name, "SKILL.md"), `# ${name}\n`);
    }
  });
  type RoleFixture = {
    adapter: string;
    model: string;
    skills: string[];
    max_turns: number;
    skill_digests?: Record<string, string>;
  };
  type ConfigFixture = {
    roles: { producer: RoleFixture; reviewer?: RoleFixture };
    credentials: { provider: string };
    budgets: { attempts?: number; wall_time_seconds: number; provider_spend_limit: unknown };
  };
  const config = (edit: (c: ConfigFixture) => void = () => undefined): unknown => {
    const c: ConfigFixture = {
      roles: {
        producer: {
          adapter: "claude-sdk",
          model: "claude-opus-5-5",
          skills: ["karpathy-guidelines"],
          max_turns: 20,
        },
        reviewer: {
          adapter: "claude-sdk",
          model: "claude-opus-5-5",
          skills: ["code-review-and-quality"],
          max_turns: 10,
        },
      },
      credentials: { provider: "env:FIXTURE_KEY" },
      budgets: {
        attempts: 2,
        wall_time_seconds: 600,
        provider_spend_limit: { usd: 5, turn_reservation_usd: 1 },
      },
    };
    edit(c);
    return c;
  };
  const env = { FIXTURE_KEY: SECRET };
  const refused = (
    cfg: unknown,
    name: RoleName,
    pattern: RegExp,
    e: Record<string, string> = env,
  ) => {
    const resolved = resolveRole(cfg, name, { skillsRoot: skills, env: e });
    assert.equal(resolved.ok, false);
    if (!resolved.ok) assert.match(resolved.diagnostics.join("\n"), pattern);
  };

  it("resolves a complete role with pinned skills and an enforceable spend cap", () => {
    const resolved = resolveRole(config(), "producer", { skillsRoot: skills, env });
    assert.ok(resolved.ok, resolved.ok ? "" : resolved.diagnostics.join("\n"));
    const r = resolved.role;
    assert.deepEqual(r.limits, { attempts: 2, wallTimeMs: 600_000, maxTurns: 20, maxBudgetUsd: 4 });
    assert.deepEqual(r.available, ["code-review-and-quality", "karpathy-guidelines"]);
    assert.deepEqual(
      r.skills.map((s) => [s.name, s.digest]),
      [["karpathy-guidelines", sha256(readFileSync(join(skills, "karpathy-guidelines/SKILL.md")))]],
    );
    assert.equal(r.credential.reveal(), SECRET);
    assert.ok(!JSON.stringify(r).includes(SECRET), "the credential never serialises");
    assert.ok(!String(r.credential).includes(SECRET));
  });

  it("refuses a missing credential without reading it from configuration", () => {
    refused(config(), "producer", /FIXTURE_KEY is not set; dispatch refused/, {});
    refused(
      config((c) => (c.credentials = { provider: SECRET })),
      "producer",
      /credentials\/provider must match/,
    );
  });

  it("refuses a model alias, another adapter and an unconfigured role", () => {
    for (const alias of [
      "opus",
      "claude-sonnet-latest",
      "claude-opus",
      "claude-opus-5-5[1m]",
      "claude-opus-latest-5",
    ]) {
      refused(
        config((c) => (c.roles.producer.model = alias)),
        "producer",
        /model must match/,
      );
    }
    for (const exact of ["claude-opus-5-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"]) {
      const resolved = resolveRole(
        config((c) => (c.roles.producer.model = exact)),
        "producer",
        { skillsRoot: skills, env },
      );
      assert.ok(resolved.ok, exact);
    }
    refused(
      config((c) => (c.roles.producer.adapter = "claude-cli")),
      "producer",
      /adapter/,
    );
    refused(
      config((c) => delete c.roles.reviewer),
      "reviewer",
      /roles\.reviewer: not configured/,
    );
  });

  it("refuses a spend limit the provider cannot enforce", () => {
    refused(
      config((c) => (c.budgets.provider_spend_limit = 5)),
      "producer",
      /provider_spend_limit must be object/,
    );
    refused(
      config((c) => (c.budgets.provider_spend_limit = { usd: 5 })),
      "producer",
      /turn_reservation_usd/,
    );
    refused(
      config((c) => (c.budgets.provider_spend_limit = { usd: 5, turn_reservation_usd: 5 })),
      "producer",
      /not enforceable/,
    );
    refused(
      config((c) => delete c.budgets.attempts),
      "producer",
      /attempts/,
    );
  });

  it("refuses a missing or changed skill", () => {
    refused(
      config((c) => c.roles.producer.skills.push("absent")),
      "producer",
      /absent has no SKILL.md/,
    );
    refused(
      config((c) => (c.roles.producer.skill_digests = { "karpathy-guidelines": sha256("other") })),
      "producer",
      /karpathy-guidelines is sha256:[0-9a-f]+, expected/,
    );
    const pinned = sha256(readFileSync(join(skills, "karpathy-guidelines/SKILL.md")));
    const resolved = resolveRole(
      config((c) => (c.roles.producer.skill_digests = { "karpathy-guidelines": pinned })),
      "producer",
      { skillsRoot: skills, env },
    );
    assert.ok(resolved.ok);
  });
});

describe("T3-C packets carry exact clauses and no conversation", () => {
  it("copies the step's clauses, accepted inputs, effects, skills and findings", () => {
    const r = role();
    const findings = [
      { rule: "CP99-S02/R01", location: "src/lib.ts:1", defect: "no output", correction: "print" },
    ];
    const built = buildPacket(plan, "CP99-S02", r, {
      attempt: 2,
      accepted: [acceptedParser()],
      policy: POLICY,
      findings,
    });
    assert.ok(built.ok);
    const { packet } = built;
    const step = plan.steps.find((s) => s.id === "CP99-S02");
    assert.ok(step?.kind === "contract");
    assert.deepEqual(packet.step.requirements, step.requirements);
    assert.deepEqual(packet.step.criteria, step.criteria);
    assert.deepEqual(packet.step.targets, step.targets);
    assert.deepEqual(packet.inherited, plan.inherited);
    assert.deepEqual(packet.inputs.accepted, [acceptedParser()]);
    assert.deepEqual(
      packet.inputs.sources.map((s) => s.ref),
      ["FIX#2"],
    );
    assert.deepEqual(packet.effects, { ...POLICY, commands: "contained, no network" });
    assert.deepEqual(packet.skills, [{ name: "karpathy-guidelines", digest: sha256("skill") }]);
    assert.deepEqual(packet.findings, findings);
    assert.equal(packet.definitions, plan.definitionsDigest);
    assert.deepEqual(Object.keys(packet).sort(), [
      "attempt",
      "candidate",
      "checkpoint",
      "definitions",
      "effects",
      "findings",
      "inherited",
      "inputs",
      "role",
      "skills",
      "step",
      "template",
    ]);
  });

  it("is deterministic for identical inputs", () => {
    const a = buildPacket(plan, "CP99-S02", role(), {
      attempt: 1,
      accepted: [acceptedParser()],
      policy: POLICY,
    });
    const b = buildPacket(plan, "CP99-S02", role(), {
      attempt: 1,
      accepted: [acceptedParser()],
      policy: POLICY,
    });
    assert.ok(a.ok && b.ok);
    assert.equal(a.digest, b.digest);
    assert.match(a.digest, /^sha256:[0-9a-f]{64}$/);
  });

  it("refuses a missing or stale accepted input", () => {
    const missing = buildPacket(plan, "CP99-S02", role(), {
      attempt: 1,
      accepted: [],
      policy: POLICY,
    });
    assert.deepEqual(missing, {
      ok: false,
      diagnostics: ["CP99-S02/inputs/parser: CP99-S01/config-parser has no current acceptance"],
    });
    const stale = buildPacket(plan, "CP99-S02", role(), {
      attempt: 1,
      accepted: [{ ...acceptedParser(), definitions: sha256("older definitions") }],
      policy: POLICY,
    });
    assert.equal(stale.ok, false);
    assert.equal(
      buildPacket(plan, "CP99-S09", role(), { attempt: 1, accepted: [], policy: POLICY }).ok,
      false,
    );
  });

  it("gives a reviewer the sealed candidate but nothing of the producer's session", async () => {
    const producer = scripted(async function* (request) {
      yield account();
      yield init(request);
      yield result(SUBMISSION);
    });
    const produced = await invoke(producer);
    assert.equal(produced.outcome, "submitted");
    const serialised = JSON.stringify(produced);
    assert.ok(!serialised.includes(producer.requests[0]?.system ?? "unreachable"));
    const candidate = { commit: "c".repeat(40), tree: "t".repeat(40), base: null, changes: [] };
    const reviewer = buildPacket(plan, "CP99-S02", role("reviewer"), {
      attempt: 1,
      accepted: [acceptedParser()],
      policy: { writable: [], scratch: [], protected: [] },
      candidate,
    });
    assert.ok(reviewer.ok);
    assert.equal(reviewer.packet.role, "reviewer");
    assert.deepEqual(reviewer.packet.candidate, candidate);
    assert.deepEqual(reviewer.packet.findings, []);
  });
});

describe("T3-C outcomes", () => {
  it("submitted: tools change the workspace and the validated proposal is returned", async () => {
    const ops = memoryOps();
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      const read = await call(request, "read_file", { path: "src/lib.ts" });
      assert.deepEqual(read, { ok: true, text: "old\n" });
      const wrote = await call(request, "write_file", { path: "src/lib.ts", content: "new\n" });
      assert.equal(wrote.ok, true);
      yield result(SUBMISSION);
    });
    const outcome = await invoke(provider, { ops });
    assert.equal(outcome.outcome, "submitted");
    assert.ok(outcome.outcome === "submitted");
    assert.deepEqual(outcome.submission, SUBMISSION);
    assert.equal(ops.files.get("src/lib.ts"), "new\n");
    const o = outcome.observation;
    assert.equal(o.session, "session-1");
    assert.deepEqual(o.model, { configured: MODEL, reported: MODEL, used: [MODEL] });
    assert.deepEqual(o.usage, { costUsd: 0.25, inputTokens: 100, outputTokens: 20 });
    assert.equal(o.auth, "ANTHROPIC_API_KEY");
    assert.deepEqual(o.skills, {
      available: ["karpathy-guidelines"],
      selected: ["karpathy-guidelines"],
      supplied: [{ name: "karpathy-guidelines", digest: sha256("skill") }],
      invoked: "not-observable",
    });
    assert.deepEqual(
      o.toolCalls.map((c) => [c.tool, c.target, c.ok]),
      [
        ["read_file", "src/lib.ts", true],
        ["write_file", "src/lib.ts", true],
      ],
    );
    const built = buildPacket(plan, "CP99-S02", role(), {
      attempt: 1,
      accepted: [acceptedParser()],
      policy: POLICY,
    });
    assert.ok(built.ok);
    assert.equal(o.packet, built.digest);
    assert.equal(o.template, built.packet.template);
  });

  it("submitted outcomes record unknown usage as unknown", async () => {
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      yield result(SUBMISSION, { costUsd: null, inputTokens: null, outputTokens: null });
    });
    const outcome = await invoke(provider);
    assert.deepEqual(outcome.observation.usage, {
      costUsd: "unknown",
      inputTokens: "unknown",
      outputTokens: "unknown",
    });
  });

  it("blocked: reported blockers are returned; a blocked result without one fails", async () => {
    const blocked = {
      ...SUBMISSION,
      status: "blocked",
      outputs: [],
      changes: [],
      blockers: ["R01 contradicts FIX#2"],
    };
    const outcome = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result(blocked);
      }),
    );
    assert.equal(outcome.outcome, "blocked");
    assert.ok(outcome.outcome === "blocked");
    assert.deepEqual(outcome.blockers, ["R01 contradicts FIX#2"]);
    const empty = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result({ ...blocked, blockers: [] });
      }),
    );
    assert.equal(empty.outcome, "failed");
  });

  it("failed: provider errors, a thrown session and a missing result", async () => {
    const error = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result(null, { subtype: "error_during_execution", output: null, errors: ["boom"] });
      }),
    );
    assert.ok(error.outcome === "failed");
    assert.match(error.reason, /provider error_during_execution: boom/);
    const thrown = await invoke(
      // eslint-disable-next-line require-yield
      scripted(async function* () {
        throw new Error("process exited with code 1");
      }),
    );
    assert.ok(thrown.outcome === "failed");
    assert.match(thrown.reason, /provider error: process exited/);
    const ended = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
      }),
    );
    assert.ok(ended.outcome === "failed");
    assert.match(ended.reason, /ended without a result/);
  });

  it("failed: malformed JSON", async () => {
    const outcome = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result("{ status: submitted");
      }),
    );
    assert.ok(outcome.outcome === "failed");
    assert.equal(outcome.reason, "malformed result: not JSON");
  });

  it("failed: unexpected fields, including a self-granted acceptance", async () => {
    for (const [output, field] of [
      [{ ...SUBMISSION, accepted: true }, "/ unexpected field accepted"],
      [
        { ...SUBMISSION, changes: [{ path: "src/lib.ts", summary: "x", verified: true }] },
        "/changes/0 unexpected field verified",
      ],
    ] as const) {
      const outcome = await invoke(
        scripted(async function* (request) {
          yield account();
          yield init(request);
          yield result(output);
        }),
      );
      assert.ok(outcome.outcome === "failed");
      assert.match(outcome.reason, new RegExp(field));
    }
    const missing = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result({ status: "submitted" });
      }),
    );
    assert.ok(missing.outcome === "failed");
    assert.match(missing.reason, /must have required property/);
  });

  it("cancelled: the caller's signal stops a running session; an aborted signal never dispatches", async () => {
    const controller = new AbortController();
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      controller.abort();
      await never();
    });
    const outcome = await invoke(provider, { signal: controller.signal });
    assert.equal(outcome.outcome, "cancelled");
    assert.equal(
      provider.requests[0]?.abort.signal.aborted,
      true,
      "the provider session is aborted",
    );

    const idle = scripted(async function* () {
      yield account();
    });
    const aborted = new AbortController();
    aborted.abort();
    const before = await invoke(idle, { signal: aborted.signal });
    assert.equal(before.outcome, "cancelled");
    assert.equal(idle.requests.length, 0);
  });

  it("exhausted: attempts, time, turns and spend", async () => {
    const idle = scripted(async function* () {
      yield account();
    });
    const attempts = await invoke(idle, { role: role("producer", { attempts: 1 }), attempt: 2 });
    assert.ok(attempts.outcome === "exhausted");
    assert.equal(attempts.limit, "attempts");
    assert.equal(idle.requests.length, 0, "no provider call beyond the attempt limit");

    const slow = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        await never();
      }),
      { role: role("producer", { wallTimeMs: 50 }) },
    );
    assert.ok(slow.outcome === "exhausted");
    assert.equal(slow.limit, "time");

    for (const [subtype, limit] of [
      ["error_max_turns", "turns"],
      ["error_max_budget_usd", "spend"],
    ] as const) {
      const outcome = await invoke(
        scripted(async function* (request) {
          yield account();
          yield init(request);
          yield result(null, { subtype, output: null });
        }),
      );
      assert.ok(outcome.outcome === "exhausted");
      assert.equal(outcome.limit, limit);
    }
  });

  it("passes the role's limits and the structured-result schema to the provider", async () => {
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      yield result(SUBMISSION);
    });
    await invoke(provider, { role: role("producer", { maxTurns: 7, maxBudgetUsd: 2.5 }) });
    const request = provider.requests[0];
    assert.ok(request);
    assert.equal(request.maxTurns, 7);
    assert.equal(request.maxBudgetUsd, 2.5);
    assert.equal(request.model, MODEL);
    assert.deepEqual(request.outputSchema, SUBMISSION_SCHEMA);
    assert.match(request.system, /## Skill karpathy-guidelines \(sha256:[0-9a-f]{64}\)\n\nskill/);
    assert.match(request.prompt, /"id": "CP99-S02"/);
  });
});

describe("T3-C late output cannot change an outcome", () => {
  it("a result and a tool call after the time limit are ignored and refused", async () => {
    const ops = memoryOps();
    let late: Promise<unknown> = Promise.resolve();
    let release = (): void => undefined;
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      await new Promise<void>((resolve) => (release = resolve));
      late = call(request, "write_file", { path: "src/lib.ts", content: "late\n" });
      yield result(SUBMISSION);
    });
    const outcome = await invoke(provider, { ops, role: role("producer", { wallTimeMs: 50 }) });
    assert.ok(outcome.outcome === "exhausted");
    assert.equal(outcome.limit, "time");
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(await late, {
      ok: false,
      text: "the invocation is closed; no further tool calls run",
    });
    assert.deepEqual(ops.writes, [], "the late write never reached the workspace");
    assert.equal(ops.files.get("src/lib.ts"), "old\n");
    assert.deepEqual(outcome.observation.toolCalls, []);
  });
});

describe("T3-C authentication and the effective session are checked before work counts", () => {
  it("an ambient token, a missing key or another backend fails before the prompt is sent", async () => {
    for (const bad of [
      { tokenSource: "CCR_OAUTH_TOKEN_FILE" },
      { apiKeySource: null },
      { apiKeySource: "apiKeyHelper" },
      { apiProvider: "bedrock" },
    ]) {
      let prompted = false;
      const outcome = await invoke(
        scripted(async function* (request) {
          yield account(bad);
          prompted = true;
          yield init(request);
          yield result(SUBMISSION);
        }),
      );
      assert.ok(outcome.outcome === "failed", JSON.stringify(bad));
      assert.match(outcome.reason, /unsupported authentication.*the prompt was not sent/);
      assert.equal(prompted, false, `the prompt was released for ${JSON.stringify(bad)}`);
    }
  });

  it("a result without a checked account and session fails", async () => {
    for (const [name, script] of [
      [
        "no account",
        async function* (request: ProviderRequest): AsyncGenerator<ProviderEvent> {
          yield init(request);
          yield result(SUBMISSION);
        },
      ],
      [
        "no init",
        async function* (): AsyncGenerator<ProviderEvent> {
          yield account();
          yield result(SUBMISSION);
        },
      ],
      [
        "repeated account",
        async function* (): AsyncGenerator<ProviderEvent> {
          yield account();
          yield account();
        },
      ],
    ] as const) {
      const outcome = await invoke(scripted(script));
      assert.ok(outcome.outcome === "failed", name);
      assert.match(outcome.reason, /^provider reported \w+ where \w+ was due$/, name);
    }
  });

  it("an effective session other than the configured one fails", async () => {
    const cases: [
      string,
      (r: ProviderRequest) => Partial<Extract<ProviderEvent, { type: "init" }>>,
    ][] = [
      ["built-in tool", (r) => ({ tools: [...init(r).tools, "Bash"] })],
      ["missing tool", () => ({ tools: ["StructuredOutput"] })],
      [
        "other MCP server",
        () => ({
          mcpServers: [
            { name: "workspace", status: "connected" },
            { name: "project", status: "connected" },
          ],
        }),
      ],
      ["disconnected server", () => ({ mcpServers: [{ name: "workspace", status: "failed" }] })],
      ["plugin", () => ({ plugins: ["candidate-plugin"] })],
      ["permission mode", () => ({ permissionMode: "bypassPermissions" })],
      ["authentication", () => ({ apiKeySource: "none" })],
      ["model", () => ({ model: "claude-other-1" })],
    ];
    for (const [name, edit] of cases) {
      const ops = memoryOps();
      const outcome = await invoke(
        scripted(async function* (request) {
          yield account();
          yield init(request, edit(request));
          yield result(SUBMISSION);
        }),
        { ops },
      );
      assert.ok(outcome.outcome === "failed", name);
      assert.match(outcome.reason, /^effective session differs: /, name);
    }
  });

  it("a reviewer has only read and search tools; producer tools in its session fail", async () => {
    const reviewer = role("reviewer");
    const provider = scripted(async function* (request) {
      yield account();
      yield init(request);
      yield result(SUBMISSION);
    });
    const outcome = await invoke(provider, { role: reviewer });
    assert.equal(outcome.outcome, "submitted");
    assert.deepEqual(
      provider.requests[0]?.tools.map((t) => t.name),
      ["read_file", "search_files"],
    );
    assert.deepEqual(outcome.observation.tools, [
      "StructuredOutput",
      "mcp__workspace__read_file",
      "mcp__workspace__search_files",
    ]);
    const widened = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request, {
          tools: [
            "StructuredOutput",
            "mcp__workspace__read_file",
            "mcp__workspace__search_files",
            "mcp__workspace__write_file",
          ],
        });
        yield result(SUBMISSION);
      }),
      { role: reviewer },
    );
    assert.equal(widened.outcome, "failed");
  });
});

describe("T3-C tools", () => {
  it("a protected or out-of-scope write is refused with the permitted paths", async () => {
    const ops = memoryOps();
    const replies: unknown[] = [];
    const outcome = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        replies.push(await call(request, "write_file", { path: "src/verifier.ts", content: "x" }));
        replies.push(
          await call(request, "write_file", { path: "docs/contract.yml", content: "x" }),
        );
        replies.push(await call(request, "write_file", { path: 42 }));
        yield result(SUBMISSION);
      }),
      { ops },
    );
    assert.deepEqual(ops.writes, []);
    assert.match(
      JSON.stringify(replies[0]),
      /refused: src\/verifier.ts: Read-only file system. Writable paths: src; protected: src\/verifier.ts/,
    );
    assert.match(JSON.stringify(replies[2]), /invalid arguments/);
    assert.deepEqual(
      outcome.observation.toolCalls.map((c) => [c.tool, c.target, c.ok]),
      [
        ["write_file", "src/verifier.ts", false],
        ["write_file", "docs/contract.yml", false],
        ["write_file", "", false],
      ],
    );
  });
});

describe("T3-C observations are redacted and journaled", () => {
  it("the credential never appears in an outcome or its evidence", async () => {
    const outcome = await invoke(
      scripted(async function* (request) {
        yield account();
        yield init(request);
        yield result(null, {
          subtype: "error_during_execution",
          output: null,
          errors: [`invalid x-api-key ${SECRET}`],
        });
      }),
    );
    assert.ok(outcome.outcome === "failed");
    assert.match(outcome.reason, /invalid x-api-key \[REDACTED\]/);
    assert.ok(!JSON.stringify(outcome).includes(SECRET));

    const run = createRun(join(scratch, "run-redacted"));
    const event = recordInvocation(run, outcome);
    assert.equal(event.action, "agent-invocation");
    assert.deepEqual(event.data, {
      role: "producer",
      outcome: "failed",
      session: "session-1",
      settings: outcome.observation.settings,
    });
    const [ref] = event.evidence;
    assert.ok(ref);
    assert.ok(!readEvidence(run.dir, ref).toString("utf8").includes(SECRET));
    const read = readRun(run.dir);
    assert.ok(read.ok);
    assert.ok(!read.records.events.some((e) => e.action === "accepted"));
  });
});

describe("T3-C proxy credentials are secrets too", () => {
  it("a credential-bearing proxy URL never reaches an outcome or its evidence", async () => {
    const proxy = "http://harness:pa55-w0rd@proxy.invalid:8080";
    const saved = process.env.HTTPS_PROXY;
    process.env.HTTPS_PROXY = proxy;
    try {
      const outcome = await invoke(
        scripted(async function* (request) {
          yield account();
          yield init(request);
          yield result(null, {
            subtype: "error_during_execution",
            output: null,
            errors: [`connect via ${proxy} failed`, "proxy auth pa55-w0rd rejected"],
          });
        }),
      );
      assert.ok(outcome.outcome === "failed");
      const run = createRun(join(scratch, "run-proxy"));
      const [ref] = recordInvocation(run, outcome).evidence;
      assert.ok(ref);
      const stored = readEvidence(run.dir, ref).toString("utf8");
      for (const text of [JSON.stringify(outcome), stored]) {
        assert.ok(!text.includes("pa55-w0rd"), text);
        assert.ok(!text.includes(proxy), text);
      }
      assert.match(
        outcome.reason,
        /connect via \[REDACTED\] failed; proxy auth \[REDACTED\] rejected/,
      );
    } finally {
      if (saved === undefined) delete process.env.HTTPS_PROXY;
      else process.env.HTTPS_PROXY = saved;
    }
  });
});

describe("T3-C SDK session options", () => {
  const request = (): ProviderRequest => ({
    model: MODEL,
    system: "system",
    prompt: "prompt",
    tools: [],
    outputSchema: SUBMISSION_SCHEMA,
    maxTurns: 4,
    maxBudgetUsd: 1.5,
    credential: new Secret(SECRET),
    abort: new AbortController(),
  });

  it("disables built-in tools, filesystem settings, skills, plugins and foreign MCP servers", () => {
    process.env.PACTWRIGHT_UNRELATED_SECRET = "host-only";
    try {
      const options = sdkOptions(request(), "/controller/home");
      assert.deepEqual(options.tools, []);
      assert.deepEqual(options.settingSources, []);
      assert.deepEqual(options.skills, []);
      assert.deepEqual(options.plugins, []);
      assert.equal(options.strictMcpConfig, true);
      assert.equal(options.permissionMode, "dontAsk");
      assert.equal(options.persistSession, false);
      assert.deepEqual(Object.keys(options.mcpServers ?? {}), ["workspace"]);
      assert.equal(options.cwd, "/controller/home");
      assert.equal(options.maxTurns, 4);
      assert.equal(options.maxBudgetUsd, 1.5);
      assert.deepEqual(options.outputFormat, { type: "json_schema", schema: SUBMISSION_SCHEMA });
      const env = options.env ?? {};
      assert.equal(env.ANTHROPIC_API_KEY, SECRET);
      assert.equal(env.HOME, "/controller/home");
      assert.equal(env.CLAUDE_CONFIG_DIR, "/controller/home");
      assert.equal(env.PACTWRIGHT_UNRELATED_SECRET, undefined, "no host variable leaks");
      assert.ok(
        Object.keys(env).every((k) =>
          [
            "PATH",
            "HOME",
            "CLAUDE_CONFIG_DIR",
            "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
            "CLAUDE_AGENT_SDK_CLIENT_APP",
            "ANTHROPIC_API_KEY",
            "HTTPS_PROXY",
            "HTTP_PROXY",
            "NO_PROXY",
            "NODE_EXTRA_CA_CERTS",
            "SSL_CERT_FILE",
          ].includes(k),
        ),
        Object.keys(env).join(","),
      );
    } finally {
      delete process.env.PACTWRIGHT_UNRELATED_SECRET;
    }
  });

  it("pins the effective non-secret settings by digest", async () => {
    const digest = (r: ProviderRequest): string => sha256(stringify(sessionSettings(r)));
    const base = request();
    const settings = sessionSettings(base);
    assert.deepEqual((settings.options as Record<string, unknown>).settingSources, []);
    assert.equal((settings.options as Record<string, unknown>).permissionMode, "dontAsk");
    assert.ok(Array.isArray(settings.env) && settings.env.includes("ANTHROPIC_API_KEY"));
    const text = JSON.stringify(settings);
    assert.ok(!text.includes(SECRET), "no secret value");
    assert.ok(!text.includes(process.env.PATH ?? "unreachable"), "no host value");

    assert.equal(digest(base), digest(request()), "stable for identical settings");
    assert.equal(
      digest(base),
      digest({
        ...request(),
        credential: new Secret("sk-ant-other"),
        abort: new AbortController(),
      }),
      "independent of the secret and the session's abort controller",
    );
    const ops = memoryOps();
    const producerTools = workspaceTools("producer", ops, POLICY);
    const reviewerTools = workspaceTools("reviewer", ops, POLICY);
    for (const [name, changed] of [
      ["model", { ...request(), model: "claude-other-1" }],
      ["turns", { ...request(), maxTurns: 5 }],
      ["spend", { ...request(), maxBudgetUsd: 2 }],
      ["system prompt", { ...request(), system: "other" }],
      ["result schema", { ...request(), outputSchema: { type: "object" } }],
      ["producer tools", { ...request(), tools: producerTools }],
      ["reviewer tools", { ...request(), tools: reviewerTools }],
      [
        "tool policy",
        { ...request(), tools: workspaceTools("producer", ops, { ...POLICY, writable: ["lib"] }) },
      ],
    ] as const) {
      assert.notEqual(digest(changed), digest(base), name);
    }
    assert.notEqual(
      digest({
        ...request(),
        tools: workspaceTools("producer", ops, { ...POLICY, writable: ["lib"] }),
      }),
      digest({ ...request(), tools: producerTools }),
      "a tool definition change alone changes the digest",
    );

    const provider = scripted(async function* (r) {
      yield account();
      yield init(r);
      yield result(SUBMISSION);
    });
    const outcome = await invoke(provider);
    const captured = provider.requests[0];
    assert.ok(captured);
    assert.equal(outcome.observation.settings, digest(captured));
  });

  it("maps SDK init and result messages to provider events", () => {
    const initMessage = {
      type: "system",
      subtype: "init",
      session_id: "s-1",
      model: MODEL,
      tools: ["StructuredOutput", "mcp__workspace__read_file"],
      mcp_servers: [{ name: "workspace", status: "connected", source: "sdk" }],
      plugins: [],
      permissionMode: "dontAsk",
      apiKeySource: "ANTHROPIC_API_KEY",
      skills: ["bundled"],
    } as unknown as SDKMessage;
    assert.deepEqual(fromSdkMessage(initMessage), {
      type: "init",
      session: "s-1",
      model: MODEL,
      tools: ["StructuredOutput", "mcp__workspace__read_file"],
      mcpServers: [{ name: "workspace", status: "connected" }],
      plugins: [],
      permissionMode: "dontAsk",
      apiKeySource: "ANTHROPIC_API_KEY",
    });
    const success = {
      type: "result",
      subtype: "success",
      is_error: false,
      result: "ignored text",
      structured_output: { status: "blocked" },
      total_cost_usd: 0.01,
      usage: { input_tokens: 3, output_tokens: 4 },
      modelUsage: { [MODEL]: {} },
      num_turns: 2,
      permission_denials: [{ tool_name: "Bash", tool_use_id: "t", tool_input: {} }],
    } as unknown as SDKMessage;
    assert.deepEqual(fromSdkMessage(success), {
      type: "result",
      subtype: "success",
      isError: false,
      output: '{"status":"blocked"}',
      costUsd: 0.01,
      inputTokens: 3,
      outputTokens: 4,
      models: [MODEL],
      turns: 2,
      denials: ["Bash"],
      errors: [],
    });
    const failure = {
      ...(success as object),
      subtype: "error_max_turns",
      errors: ["max turns"],
    } as unknown as SDKMessage;
    const mapped = fromSdkMessage(failure);
    assert.ok(mapped?.type === "result");
    assert.equal(mapped.output, null);
    assert.deepEqual(mapped.errors, ["max turns"]);
    assert.equal(fromSdkMessage({ type: "assistant" } as unknown as SDKMessage), null);
  });
});
