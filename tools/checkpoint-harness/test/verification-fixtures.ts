// Test helpers (T3-D, reusable by T3-E): the fixture binding registry, a
// source repository holding the fixture verifiers, scripted verifier
// workspaces and reviewers, and evaluation manifests. Fixture bindings and
// verifiers are not Checkpoint 1 product verifiers. Nothing here records
// acceptance.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import {
  Secret,
  type AgentRole,
  type Packet,
  type Provider,
  type ProviderEvent,
  type ProviderRequest,
  type ReviewVerdict,
} from "../src/claude.js";
import {
  exportRevision,
  prepareRun,
  sha256,
  type PreparedRun,
  type VerificationTarget,
} from "../src/contracts.js";
import { createRun, type EvaluationManifest, type RunHandle } from "../src/evidence.js";
import {
  bindingDigests,
  COMMON_RUBRIC,
  createRegistry,
  type Registry,
} from "../src/software-bootstrap.js";
import type { ContainedWorkspace, OpenWorkspace } from "../src/verification.js";
import {
  captureSource,
  importSource,
  profileDigest,
  type SealedCandidate,
  type SourceSnapshot,
  type WritePolicy,
} from "../src/workspace.js";

const here = dirname(fileURLToPath(import.meta.url));
export const fixtureRoot = join(here, "fixtures/checkpoint-harness");

/** The fixture bindings; `parser.accepts` and `parser.rejects` share their commands. */
export function fixtureRegistry(): Registry {
  const created = createRegistry([
    {
      id: "parser.accepts",
      method: "automated",
      version: "1",
      command: ["node", "verifiers/parser-subject.mjs"],
      judge: ["node", "verifiers/parser-judge.mjs"],
      files: ["verifiers/parser-judge.mjs", "verifiers/parser-subject.mjs"],
      timeoutMs: 30_000,
      observations: ["input"],
    },
    {
      id: "parser.rejects",
      method: "automated",
      version: "1",
      command: ["node", "verifiers/parser-subject.mjs"],
      judge: ["node", "verifiers/parser-judge.mjs"],
      files: ["verifiers/parser-judge.mjs", "verifiers/parser-subject.mjs"],
      timeoutMs: 30_000,
      observations: ["input"],
    },
    {
      id: "repo.verify",
      method: "automated",
      version: "1",
      command: ["node", "verifiers/repo-subject.mjs"],
      judge: ["node", "verifiers/repo-judge.mjs"],
      files: ["verifiers/repo-judge.mjs", "verifiers/repo-subject.mjs"],
      timeoutMs: 30_000,
      observations: ["files"],
    },
    {
      id: "command.prints",
      method: "automated",
      version: "1",
      command: ["node", "src/command.mjs", "verifiers/fixtures/valid.json"],
      judge: ["node", "verifiers/command-judge.mjs"],
      files: ["verifiers/command-judge.mjs", "verifiers/fixtures/valid.json"],
      timeoutMs: 30_000,
      observations: ["stdout"],
    },
    {
      id: "parser.single-path",
      method: "review",
      version: "1",
      rubric: ["One function validates the configuration; no other code restates its rules."],
    },
    {
      id: "report.owner-approval",
      method: "approval",
      version: "1",
      authority: "owner",
      subject: "the exact release report",
    },
  ]);
  assert.ok(created.ok, created.ok ? "" : created.diagnostics.join("\n"));
  return created.registry;
}

export const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

/** A Git repository at `root` holding the fixture verifiers, committed once. */
export function sourceRepo(root: string): { root: string; head: string } {
  mkdirSync(root, { recursive: true });
  cpSync(join(fixtureRoot, "verification"), root, { recursive: true });
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

/** Writes `files` (path → UTF-8 text) below `dir`. */
export function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
}

/** The fixture producer's write policy. */
export const PRODUCER: WritePolicy = { writable: ["src", "verifiers"], scratch: [], protected: [] };

const fresh = (scratch: string, name: string): string => join(scratch, `${name}-${randomUUID()}`);

/** Plans the format-2 fixture checkpoint through CP99-S03 from a new definitions repository. */
export async function fixturePlan(scratch: string): Promise<PreparedRun> {
  const root = fresh(scratch, "definitions");
  cpSync(join(fixtureRoot, "docs"), join(root, "docs"), { recursive: true });
  cpSync(
    join(here, "../../../docs/checkpoints/contract.schema.json"),
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
      selection: { through: "CP99-S03" },
    },
    { repoRoot: root },
  );
  assert.ok(result.ok, result.ok ? "" : result.diagnostics.join("\n"));
  return result.plan;
}

/** A new run whose base snapshot is the fixture source. */
export type World = { scratch: string; run: RunHandle; base: SourceSnapshot };

export async function world(scratch: string): Promise<World> {
  const repo = sourceRepo(fresh(scratch, "source"));
  const run = createRun(fresh(scratch, "run"));
  const imported = await importSource(run, repo.root, repo.head);
  assert.ok(imported.ok, imported.ok ? "" : imported.diagnostics.join("\n"));
  return { scratch, run, base: imported.snapshot };
}

/** Seals the base with `files` written and `removed` deleted, under `policy`. */
export async function seal(
  w: World,
  files: Record<string, string>,
  options: { removed?: string[]; policy?: WritePolicy } = {},
): Promise<SealedCandidate> {
  const dir = fresh(w.scratch, "tree");
  mkdirSync(dir);
  await exportRevision(join(w.run.dir, "source.git"), w.base.commit, dir);
  writeFiles(dir, files);
  for (const path of options.removed ?? []) rmSync(join(dir, path));
  const captured = captureSource(w.run.dir, dir, w.base, options.policy ?? PRODUCER, "candidate");
  assert.ok(captured.ok, captured.ok ? "" : captured.diagnostics.join("\n"));
  return captured.candidate;
}

export type Calibration = {
  description: string;
  step: string;
  files: Record<string, string>;
  verdict: ReviewVerdict;
  expected: { decision: string; rules?: string[]; requirements?: string[] };
};

export const calibration = (name: "known-good" | "known-bad"): Calibration =>
  JSON.parse(
    readFileSync(join(fixtureRoot, "review-calibration", `${name}.json`), "utf8"),
  ) as Calibration;

/** Every target of a step and its inherited requirements. */
export function stepTargets(plan: PreparedRun, id: string): VerificationTarget[] {
  const step = plan.steps.find((s) => s.id === id);
  assert.ok(step?.kind === "contract");
  return [...step.targets, ...plan.inherited.targets];
}

/** An evaluation manifest for `candidate`, with the binding digests its tree yields. */
export function manifestFor(
  plan: PreparedRun,
  step: string,
  candidate: SourceSnapshot,
  registry: Registry,
  tree: ReadonlyMap<string, string>,
  overrides: Partial<EvaluationManifest> = {},
): EvaluationManifest {
  return {
    source: { commit: candidate.commit, tree: candidate.tree },
    definitions: plan.definitionsDigest,
    step: { id: step, definition: plan.stepDefinitions[step] ?? "" },
    inputs: [],
    harness: "t3-d-test",
    runModel: plan.runModel,
    verifiers: bindingDigests(
      registry,
      tree,
      stepTargets(plan, step).map((t) => t.binding),
    ),
    rubric: COMMON_RUBRIC.digest,
    skills: {},
    configuration: sha256("t3-d test configuration"),
    toolchain: { profile: profileDigest, lockfile: null },
    ...overrides,
  };
}

export type ReportEntry = {
  binding: string;
  owner: string;
  criterion: string;
  case: string | null;
  outcome: "passed" | "failed" | "skipped";
  assertions: number;
  observations: Record<string, unknown>;
  message?: string;
};

/** A passing report entry for a target, carrying the fixture bindings' observations. */
export const passing = (t: VerificationTarget): ReportEntry => ({
  binding: t.binding,
  owner: t.owner,
  criterion: t.criterion,
  case: t.caseId,
  outcome: "passed",
  assertions: 1,
  observations: { input: "fixture", files: ["src/parser.mjs"], stdout: "{}" },
});

/**
 * What a scripted binding run does. Each subject run's exit status and stdout
 * are observations; `report` is the judge's stdout (JSON unless a string or
 * Buffer) and `exit` its exit status.
 */
export type Execution = {
  subjectExit?: number | null;
  subjectTimedOut?: boolean;
  subjectStdout?: string;
  exit?: number | null;
  timedOut?: boolean;
  report?: unknown;
  stderr?: string;
};

export type ScriptedCall = {
  snapshot: SourceSnapshot;
  binding: string;
  role: "subject" | "judge";
  /** The subject run's `PACTWRIGHT_TARGET`; empty for the judge. */
  target: string;
  argv: string[];
  stdin: string;
};

/**
 * An offline opener of verifier workspaces: `exec` runs no code but plays
 * `script` for the binding and target named in the controller's environment,
 * as the subject or, when the argv ends with the binding's judge, as the judge.
 * `openError` makes opening fail as `createWorkspace` can; `closeError`
 * makes closing fail after a completed run.
 */
export function scriptedVerifier(
  script: (snapshot: SourceSnapshot, binding: string, target: string) => Execution,
  options: { openError?: string; closeError?: string; registry?: Registry } = {},
): OpenWorkspace & { calls: ScriptedCall[] } {
  const registry = options.registry ?? fixtureRegistry();
  const calls: ScriptedCall[] = [];
  const open: OpenWorkspace = (snapshot) => {
    if (options.openError !== undefined) return Promise.reject(new Error(options.openError));
    const ws: ContainedWorkspace = {
      snapshot,
      readFile: (path) => Promise.resolve({ ok: false, reason: `${path}: not scripted` }),
      writeFile: () => Promise.resolve({ ok: false, reason: "Read-only file system" }),
      exec: (argv, exec) => {
        const binding = argv.find((a) => a.startsWith("PACTWRIGHT_BINDING="))?.slice(19) ?? "";
        const target = argv.find((a) => a.startsWith("PACTWRIGHT_TARGET="))?.slice(18) ?? "";
        const entry = registry.get(binding)?.binding;
        const judge = entry?.method === "automated" ? entry.judge : [];
        const role =
          judge.length > 0 && stringify(argv.slice(-judge.length)) === stringify(judge)
            ? "judge"
            : "subject";
        calls.push({
          snapshot,
          binding,
          role,
          target,
          argv: [...argv],
          stdin: exec.stdin?.toString("utf8") ?? "",
        });
        const run = script(snapshot, binding, target);
        const report = run.report;
        const stdout =
          role === "subject"
            ? Buffer.from(run.subjectStdout ?? "")
            : report === undefined
              ? Buffer.alloc(0)
              : Buffer.isBuffer(report)
                ? report
                : Buffer.from(typeof report === "string" ? report : JSON.stringify(report));
        return Promise.resolve({
          exitCode:
            role === "subject"
              ? run.subjectExit === undefined
                ? 0
                : run.subjectExit
              : run.exit === undefined
                ? 0
                : run.exit,
          stdout,
          stderr: Buffer.from(role === "judge" ? (run.stderr ?? "") : ""),
          timedOut: (role === "subject" ? run.subjectTimedOut : run.timedOut) ?? false,
        });
      },
      close: () =>
        options.closeError === undefined
          ? Promise.resolve()
          : Promise.reject(new Error(options.closeError)),
    };
    return Promise.resolve(ws);
  };
  return Object.assign(open, { calls });
}

/**
 * Opens each workspace as a local export of the snapshot and runs commands as
 * local processes, uncontained. Only for offline tests that run the fixture
 * verifiers against test-authored candidates; the Docker integration test
 * runs the same verifiers contained.
 */
export function localWorkspaces(run: RunHandle, root: string): OpenWorkspace {
  return async (snapshot) => {
    const dir = join(root, randomUUID());
    mkdirSync(dir, { recursive: true });
    await exportRevision(join(run.dir, "source.git"), snapshot.commit, dir);
    const ws: ContainedWorkspace = {
      snapshot,
      readFile: (path) => Promise.resolve({ ok: false, reason: `${path}: not read here` }),
      writeFile: () => Promise.resolve({ ok: false, reason: "Read-only file system" }),
      exec: (argv, { timeoutMs, stdin }) => {
        const [program = "", ...args] = argv;
        const ran = spawnSync(program, args, {
          cwd: dir,
          input: stdin,
          timeout: timeoutMs,
          env: { PATH: process.env.PATH ?? "" },
        });
        return Promise.resolve({
          exitCode: ran.status,
          stdout: ran.stdout,
          stderr: ran.stderr,
          timedOut: (ran.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT",
        });
      },
      close: () => {
        rmSync(dir, { recursive: true, force: true });
        return Promise.resolve();
      },
    };
    return ws;
  };
}

/** A verifier that passes every target of each binding it runs, from `targets`. */
export const passingVerifier = (
  targets: readonly VerificationTarget[],
): ReturnType<typeof scriptedVerifier> =>
  scriptedVerifier((_, binding) => ({
    report: { results: targets.filter((t) => t.binding === binding).map(passing) },
  }));

export const REVIEW_MODEL = "claude-fixture-1";

export function reviewerRole(): AgentRole {
  return {
    name: "reviewer",
    model: REVIEW_MODEL,
    available: ["code-review-and-quality"],
    skills: [{ name: "code-review-and-quality", digest: sha256("skill"), text: "skill" }],
    limits: { attempts: 3, wallTimeMs: 5_000, maxTurns: 8, maxBudgetUsd: 1 },
    credential: new Secret("sk-ant-test-reviewer"),
    credentialKind: "api-key",
  };
}

/** The packet a provider request carries. */
export const packetOf = (request: ProviderRequest): Packet =>
  JSON.parse(request.prompt.slice(request.prompt.indexOf("\n") + 1)) as Packet;

/** A reviewer session that reports `respond(packet)` as its structured result. */
export function scriptedReviewer(
  respond: (packet: Packet) => unknown,
): Provider & { requests: ProviderRequest[] } {
  const requests: ProviderRequest[] = [];
  const provider = (request: ProviderRequest): AsyncIterable<ProviderEvent> => {
    requests.push(request);
    return (async function* (): AsyncGenerator<ProviderEvent> {
      yield {
        type: "account",
        apiKeySource: "ANTHROPIC_API_KEY",
        tokenSource: null,
        apiProvider: "firstParty",
      };
      yield {
        type: "init",
        session: `review-${requests.length}`,
        model: REVIEW_MODEL,
        tools: ["StructuredOutput", ...request.tools.map((t) => `mcp__workspace__${t.name}`)],
        mcpServers: [{ name: "workspace", status: "connected" }],
        plugins: [],
        permissionMode: "dontAsk",
        apiKeySource: "ANTHROPIC_API_KEY",
      };
      yield {
        type: "result",
        subtype: "success",
        isError: false,
        output: JSON.stringify(respond(packetOf(request))),
        costUsd: 0.01,
        inputTokens: 10,
        outputTokens: 5,
        models: [REVIEW_MODEL],
        turns: 2,
        denials: [],
        errors: [],
      };
    })();
  };
  return Object.assign(provider, { requests });
}

/**
 * Opens a reviewer workspace that reads nothing (scripted reviewers never call
 * tools) for the requested snapshot, or for `serve` when given, to model a
 * workspace of the wrong source.
 */
export function reviewerWorkspaces(
  serve?: SourceSnapshot,
): OpenWorkspace & { opened: SourceSnapshot[] } {
  const opened: SourceSnapshot[] = [];
  const open: OpenWorkspace = (snapshot) => {
    opened.push(snapshot);
    return Promise.resolve({
      snapshot: serve ?? snapshot,
      readFile: (path) => Promise.resolve({ ok: false, reason: `${path}: not in this fixture` }),
      writeFile: () => Promise.resolve({ ok: false, reason: "Read-only file system" }),
      exec: () =>
        Promise.resolve({
          exitCode: 1,
          stdout: Buffer.alloc(0),
          stderr: Buffer.alloc(0),
          timedOut: false,
        }),
      close: () => Promise.resolve(),
    });
  };
  return Object.assign(open, { opened });
}

/** Passes whatever the packet's review context asks the reviewer to judge. */
export const approveAll = (packet: Packet): ReviewVerdict =>
  passVerdict(packet.review?.subjects ?? [], packet.review?.targets ?? []);

/** A passing verdict for the given subjects and review targets. */
export function passVerdict(
  subjects: readonly string[],
  targets: readonly VerificationTarget[] = [],
): ReviewVerdict {
  return {
    verdict: "pass",
    coverage: subjects.map((subject) => ({
      subject,
      result: "satisfied",
      basis: "executed",
      note: "met",
    })),
    targets: targets.map((t) => ({
      owner: t.owner,
      criterion: t.criterion,
      case: t.caseId,
      binding: t.binding,
      result: "passed",
      note: "met",
    })),
    findings: [],
    blockers: [],
  };
}
