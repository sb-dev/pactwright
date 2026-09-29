// Test helpers (T3-E, reusable by T3-F): one fixture repository holding the
// definitions and the verifier source, a complete run configuration, local
// producer workspaces, scripted agent sessions, a local effect service with
// inspectable receipts and the runner's offline boundaries. Fixture
// acceptances come only from the runner; nothing here writes a journal.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Packet, Provider, ProviderEvent, ProviderRequest, ToolReply } from "../src/claude.js";
import { exportRevision } from "../src/contracts.js";
import type { JournalEvent, RunHandle } from "../src/evidence.js";
import type {
  EffectRequest,
  EffectService,
  Receipt,
  RunnerDeps,
  Workspaces,
} from "../src/runner.js";
import { createRegistry, type Registry } from "../src/software-bootstrap.js";
import type { OpenWorkspace } from "../src/verification.js";
import { captureSource } from "../src/workspace.js";
import {
  calibration,
  FAULTY_PARSERS,
  fixtureRegistry,
  fixtureRoot,
  git,
  localWorkspaces,
  packetOf,
  reviewerWorkspaces,
} from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

export const KEY_VAR = "PACTWRIGHT_E_TEST_KEY";
export const MODEL = "claude-opus-5-5";
export const OWNER = "fixture-owner";

/** The known-good fixture parser, a lenient one (accepts a blank name) and a command using the parser. */
export const GOOD_PARSER = (): string => calibration("known-good").files["src/parser.mjs"] ?? "";
export const LENIENT_PARSER = FAULTY_PARSERS.lenient?.parser ?? "";
export const COMMAND =
  'import { readFileSync } from "node:fs";\nimport { parseConfig } from "./parser.mjs";\nprocess.stdout.write(JSON.stringify(parseConfig(readFileSync(process.argv[2], "utf8"))));\n';

export type Repo = { root: string; head: string };

/**
 * A Git repository on branch `fixture` holding the fixture definitions, the
 * format schema and the verifier source, committed once: the definitions
 * revision and the expected head of every fixture run.
 */
export function fixtureRepo(scratch: string): Repo {
  const root = join(scratch, `repo-${randomUUID()}`);
  mkdirSync(root, { recursive: true });
  cpSync(join(fixtureRoot, "docs"), join(root, "docs"), { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  cpSync(join(fixtureRoot, "verification"), root, { recursive: true });
  git(root, ["init", "-q", "-b", "fixture"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

export const CHECKPOINTS = {
  CP99: "docs/checkpoints/99-fixture/checkpoint.yml",
  CP98: "docs/checkpoints/98-release/checkpoint.yml",
} as const;

/** A complete run configuration for `repo`; runs and workspaces live under `scratch`. */
export function runConfig(
  repo: Repo,
  scratch: string,
  options: {
    checkpoint?: keyof typeof CHECKPOINTS;
    through?: string;
    attempts?: number;
    retries?: number;
  } = {},
): Record<string, unknown> {
  return {
    repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: repo.head },
    checkpoint: CHECKPOINTS[options.checkpoint ?? "CP99"],
    definitions: { revision: repo.head, review: "fixture review" },
    selection: { through: options.through ?? "CP99-S01" },
    roles: {
      producer: {
        adapter: "claude-sdk",
        model: MODEL,
        skills: ["karpathy-guidelines"],
        max_turns: 8,
      },
      reviewer: {
        adapter: "claude-sdk",
        model: MODEL,
        skills: ["code-review-and-quality"],
        max_turns: 8,
      },
    },
    credentials: { provider: `env:${KEY_VAR}` },
    budgets: {
      attempts: options.attempts ?? 3,
      retries: options.retries ?? 2,
      wall_time_seconds: 60,
      provider_spend_limit: { usd: 1, turn_reservation_usd: 0.1 },
    },
    workspace: {
      candidate_root: join(scratch, "workspaces"),
      controller_root: join(scratch, "runs"),
    },
    permissions: {
      writable: ["src", "verifiers"],
      scratch: [],
      protected: [],
      approvers: { owner: [OWNER] },
    },
  };
}

/**
 * The fixture registry plus `report.release-approval`, whose approval
 * authorises publishing the report: CP98's effect.
 */
export function runnerRegistry(version = "1"): Registry {
  const extra = createRegistry([
    {
      id: "report.release-approval",
      method: "approval",
      version,
      authority: "owner",
      subject: "the exact release report",
      effect: { action: "publish", target: "fixture-registry/report" },
    },
  ]);
  assert.ok(extra.ok, extra.ok ? "" : extra.diagnostics.join("\n"));
  return new Map([...fixtureRegistry(), ...extra.registry]);
}

const within = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Producer workspaces as local exports of the snapshot. Writes follow the
 * mounted policy unless `bypass` models a containment failure, which only
 * the seal's diff check can then catch. Commands are refused. Sealing
 * captures the directory as `sealCandidate` does.
 */
export function localProducers(
  run: RunHandle,
  root: string,
  options: { bypass?: boolean } = {},
): Workspaces["producer"] {
  return async (from, policy) => {
    const dir = join(root, randomUUID());
    mkdirSync(dir, { recursive: true });
    await exportRevision(join(run.dir, "source.git"), from.commit, dir);
    return {
      readFile(path) {
        try {
          return Promise.resolve({ ok: true, bytes: readFileSync(join(dir, path)) });
        } catch {
          return Promise.resolve({ ok: false, reason: `${path}: No such file or directory` });
        }
      },
      writeFile(path, bytes) {
        const allowed = within(path, policy.writable) && !within(path, policy.protected);
        if (!allowed && options.bypass !== true) {
          return Promise.resolve({ ok: false, reason: `${path}: Read-only file system` });
        }
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), bytes);
        return Promise.resolve({ ok: true });
      },
      exec: () =>
        Promise.resolve({
          exitCode: 1,
          stdout: Buffer.alloc(0),
          stderr: Buffer.from("commands are not run in this fixture"),
          timedOut: false,
        }),
      seal: (against) =>
        Promise.resolve(captureSource(run.dir, dir, against.base, against.policy, "candidate")),
      close() {
        rmSync(dir, { recursive: true, force: true });
        return Promise.resolve();
      },
    };
  };
}

/** What a scripted session returns: a structured result, raw result text or a provider stop. */
export type Reply = { output: unknown } | { raw: string } | { subtype: string };

export type Session = {
  packet: Packet;
  request: ProviderRequest;
  /** Calls one of the session's workspace tools. */
  call(name: string, args: unknown): Promise<ToolReply>;
};

export type ScriptedAgent = Provider & { requests: ProviderRequest[]; packets: Packet[] };

/**
 * A provider session that authenticates as the configured API key, reports
 * the requested model and tools, runs `script` and returns its reply.
 */
export function scriptedAgent(script: (session: Session) => Promise<Reply> | Reply): ScriptedAgent {
  const requests: ProviderRequest[] = [];
  const packets: Packet[] = [];
  const provider = (request: ProviderRequest): AsyncIterable<ProviderEvent> => {
    requests.push(request);
    const packet = packetOf(request);
    packets.push(packet);
    const call = (name: string, args: unknown): Promise<ToolReply> => {
      const tool = request.tools.find((t) => t.name === name);
      assert.ok(tool, `tool ${name} is offered`);
      return tool.run(args);
    };
    return (async function* (): AsyncGenerator<ProviderEvent> {
      yield {
        type: "account",
        apiKeySource: "ANTHROPIC_API_KEY",
        tokenSource: null,
        apiProvider: "firstParty",
      };
      yield {
        type: "init",
        session: `session-${requests.length}`,
        model: request.model,
        tools: ["StructuredOutput", ...request.tools.map((t) => `mcp__workspace__${t.name}`)],
        mcpServers: [{ name: "workspace", status: "connected" }],
        plugins: [],
        permissionMode: "dontAsk",
        apiKeySource: "ANTHROPIC_API_KEY",
      };
      const reply = await script({ packet, request, call });
      yield {
        type: "result",
        subtype: "subtype" in reply ? reply.subtype : "success",
        isError: false,
        output:
          "raw" in reply ? reply.raw : "output" in reply ? JSON.stringify(reply.output) : null,
        costUsd: 0.01,
        inputTokens: 10,
        outputTokens: 5,
        models: [request.model],
        turns: 1,
        denials: [],
        errors: [],
      };
    })();
  };
  return Object.assign(provider, { requests, packets });
}

/** A producer reply that writes `files` and claims each output's paths. */
export async function submit(
  session: Session,
  files: Record<string, string>,
  outputs: Record<string, string[]>,
): Promise<Reply> {
  for (const [path, content] of Object.entries(files)) {
    await session.call("write_file", { path, content });
  }
  return {
    output: {
      status: "submitted",
      outputs: Object.entries(outputs).map(([output, paths]) => ({ output, paths })),
      changes: Object.keys(files).map((path) => ({ path, summary: "written" })),
      verifier_proposals: [],
      blockers: [],
    },
  };
}

/** The correct work for each fixture step. */
export const STEP_WORK: Record<
  string,
  { files: () => Record<string, string>; outputs: Record<string, string[]> }
> = {
  "CP99-S01": {
    files: () => ({ "src/parser.mjs": GOOD_PARSER() }),
    outputs: { "config-parser": ["src/parser.mjs"] },
  },
  "CP99-S02": {
    files: () => ({ "src/command.mjs": COMMAND }),
    outputs: { command: ["src/command.mjs"] },
  },
  "CP98-S01": {
    files: () => ({ "src/report.md": "# Fixture report\n" }),
    outputs: { report: ["src/report.md"] },
  },
};

/** A producer that does each step's correct work. */
export const goodProducer = (): ScriptedAgent =>
  scriptedAgent((session) => {
    const work = STEP_WORK[session.packet.step.id];
    assert.ok(work, `no work for ${session.packet.step.id}`);
    return submit(session, work.files(), work.outputs);
  });

/** A local effect service with inspectable receipts; `fault` fails its next execution once. */
export type ReceiptService = EffectService & {
  executions: string[];
  fault: "crash-before" | "crash-after" | "lost" | "wrong-receipt" | null;
};

export class Crash extends Error {
  override name = "Crash";
}

export function receiptService(options: { inspect?: boolean } = {}): ReceiptService {
  const effects = new Map<string, EffectRequest>();
  const receipt = (key: string, request: EffectRequest, reference: string): Receipt => ({
    key,
    target: request.target,
    reference,
  });
  const service: ReceiptService = {
    executions: [],
    fault: null,
    execute(key, request) {
      const fault = service.fault;
      service.fault = null;
      if (fault === "crash-before") return Promise.reject(new Crash("crash before the effect"));
      service.executions.push(key);
      effects.set(key, request);
      if (fault === "crash-after") return Promise.reject(new Crash("crash after the effect"));
      if (fault === "lost") return Promise.resolve(null);
      if (fault === "wrong-receipt") {
        return Promise.resolve({ key, target: "elsewhere", reference: "misrouted" });
      }
      return Promise.resolve(receipt(key, request, `published-${service.executions.length}`));
    },
    ...(options.inspect === false
      ? {}
      : {
          inspect: (key: string, request: EffectRequest) =>
            Promise.resolve(effects.has(key) ? receipt(key, request, "read-back") : null),
        }),
  };
  return service;
}

/**
 * A progress callback that crashes the controller once, after the first
 * event of `action` (of `phase`, for a phase start).
 */
export function crashAfter(action: string, phase?: string): (event: JournalEvent) => void {
  let fired = false;
  return (event) => {
    if (!fired && event.action === action && (phase === undefined || event.data.phase === phase)) {
      fired = true;
      throw new Crash(`crash after ${action}`);
    }
  };
}

/**
 * The runner's offline boundaries: the fixture repository, the repository's
 * skills, a test credential, local producer and verifier workspaces,
 * scripted sessions and no fencing to do. A crashed test controller is dead.
 */
export function testDeps(
  repo: Repo,
  options: {
    producer: ScriptedAgent;
    reviewer: ScriptedAgent;
    registry?: Registry;
    verifier?: (run: RunHandle, root: string) => OpenWorkspace;
    effects?: EffectService | null;
    harness?: string;
    bypass?: boolean;
    progress?: (event: JournalEvent) => void;
    signal?: AbortSignal;
  },
): RunnerDeps {
  return {
    repoRoot: repo.root,
    skillsRoot: join(repoRoot, ".claude/skills"),
    env: { [KEY_VAR]: "sk-ant-test-e" },
    registry: options.registry ?? runnerRegistry(),
    harness: options.harness ?? "t3-e-test",
    workspaces: (run, root) => ({
      producer: localProducers(run, root, { bypass: options.bypass ?? false }),
      verifier: options.verifier?.(run, root) ?? localWorkspaces(run, root),
      reviewer: reviewerWorkspaces(),
    }),
    effects: options.effects ?? null,
    fence: () => Promise.resolve(0),
    liveness: () => "dead",
    providers: { producer: options.producer, reviewer: options.reviewer },
    signal: options.signal ?? new AbortController().signal,
    ...(options.progress ? { progress: options.progress } : {}),
  };
}
