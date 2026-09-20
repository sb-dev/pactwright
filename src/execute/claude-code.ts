import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { CapabilityExecutor, CapabilityResult, CapabilityTask } from "./task.js";

/**
 * The Claude Code executor.
 *
 * Pactwright delegates execution to one tool that already owns providers,
 * routing and credentials; it never learns to choose models (Distribution
 * §20), and the declared executor set stays small enough to enumerate rather
 * than becoming a registry (§25).
 *
 * Everything unpredictable is on the far side of `Spawn`. Prompt
 * construction and response parsing — where the real complexity is — are
 * deterministic and offline, so malformed JSON, `is_error`, permission
 * denials, timeouts and a missing binary are all covered without a network
 * call.
 */
export interface SpawnRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly timeoutMs: number;
}

export interface SpawnResult {
  readonly stdout: string;
  readonly stderr?: string;
  /** Absent when the process could not be started at all. */
  readonly code?: number;
  readonly error?: string;
}

export type Spawn = (request: SpawnRequest) => SpawnResult;

export interface ClaudeCodeOptions {
  /** Injected for tests; defaults to a synchronous `execFileSync` spawn. */
  readonly spawn?: Spawn;
  /** Binary to invoke. Default `claude`. */
  readonly command?: string;
  /** Per-action wall-clock bound. */
  readonly timeoutMs?: number;
  /** Explicit model, when the project pins one. Absent means the tool decides. */
  readonly model?: string;
  /** Injected for tests; defaults to `randomUUID`. */
  readonly sessionId?: () => string;
  /** Injected for tests; defaults to reading the prompt file. */
  readonly readPrompt?: (path: string) => string;
}

export const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

/**
 * The print-mode invocation, verified against `claude 2.1.270`.
 *
 * `--session-id` is not optional: without it the child reported the *parent*
 * session's id, so runs would have shared identity with whatever spawned
 * them. `--permission-prompts none` is what stops a print-mode run hanging
 * on a permission it lacks. There is no `--max-turns` in that version, so the
 * run is bounded from the spawn side by `timeoutMs`.
 */
export function claudeCodeArgs(
  task: CapabilityTask,
  agents: string,
  sessionId: string,
  model?: string,
): readonly string[] {
  return [
    "-p",
    task.instruction,
    "--output-format",
    "json",
    "--agents",
    agents,
    "--session-id",
    sessionId,
    "--permission-mode",
    "acceptEdits",
    "--add-dir",
    task.root,
    "--permission-prompts",
    "none",
    ...(model === undefined ? [] : ["--model", model]),
  ];
}

/**
 * The agent definition passed through `--agents`.
 *
 * The pack's prompt is handed over directly, so the pack stays the single
 * source of truth for agent behaviour and the generated `.claude/agents/`
 * surface stays an interface for humans instead of quietly becoming a runtime
 * dependency.
 */
export function agentDefinition(task: CapabilityTask, prompt: string): string {
  return JSON.stringify({
    [task.agent.key]: {
      description: `Pactwright ${task.capability}`,
      prompt,
      ...(task.agent.skills.length === 0 ? {} : { skills: [...task.agent.skills] }),
    },
  });
}

interface PrintModeResponse {
  readonly result?: unknown;
  readonly is_error?: boolean;
  readonly subtype?: string;
  readonly permission_denials?: unknown;
  readonly total_cost_usd?: unknown;
  readonly usage?: { readonly input_tokens?: unknown; readonly output_tokens?: unknown };
}

/** Parses one print-mode response into a `CapabilityResult`. */
export function parsePrintMode(stdout: string): CapabilityResult {
  let parsed: PrintModeResponse;
  try {
    parsed = JSON.parse(stdout) as PrintModeResponse;
  } catch {
    return {
      status: "failed",
      output: undefined,
      message: `the executor returned output that is not JSON: ${stdout.slice(0, 200)}`,
    };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { status: "failed", output: undefined, message: "the executor returned no object" };
  }

  const denials = Array.isArray(parsed.permission_denials)
    ? parsed.permission_denials.map((entry) =>
        typeof entry === "string" ? entry : JSON.stringify(entry),
      )
    : [];
  const cost = {
    ...(typeof parsed.usage?.input_tokens === "number"
      ? { inputTokens: parsed.usage.input_tokens }
      : {}),
    ...(typeof parsed.usage?.output_tokens === "number"
      ? { outputTokens: parsed.usage.output_tokens }
      : {}),
    ...(typeof parsed.total_cost_usd === "number" ? { usd: parsed.total_cost_usd } : {}),
  };
  const withCost = Object.keys(cost).length === 0 ? {} : { cost };
  // A refused permission is structured data, not prose to pattern-match: the
  // lifecycle can tell "the agent could not do this" from "the agent did this
  // badly" without guessing, and the first is an environment failure.
  const withDenials = denials.length === 0 ? {} : { denials };

  if (parsed.is_error === true || (parsed.subtype !== undefined && parsed.subtype !== "success")) {
    return {
      status: "failed",
      output: parsed.result,
      message:
        denials.length > 0
          ? `the executor was denied ${denials.length} permission${denials.length === 1 ? "" : "s"}: ${denials.join("; ")}`
          : `the executor reported an error (${parsed.subtype ?? "is_error"})`,
      ...withCost,
      ...withDenials,
    };
  }
  return { status: "completed", output: parsed.result, ...withCost, ...withDenials };
}

const defaultSpawn: Spawn = (request) => {
  try {
    const stdout = execFileSync(request.command, [...request.args], {
      cwd: request.cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: request.timeoutMs,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { stdout, code: 0 };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: failure.stdout ?? "",
      ...(failure.stderr === undefined ? {} : { stderr: failure.stderr }),
      ...(typeof failure.status === "number" ? { code: failure.status } : {}),
      error: failure.code ?? failure.message,
    };
  }
};

export function claudeCodeExecutor(options: ClaudeCodeOptions = {}): CapabilityExecutor {
  const spawn = options.spawn ?? defaultSpawn;
  const command = options.command ?? "claude";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const sessionId = options.sessionId ?? randomUUID;
  const readPrompt = options.readPrompt ?? ((path: string) => readFileSync(path, "utf8"));

  return {
    id: "claude-code",
    invoke: (task: CapabilityTask): Promise<CapabilityResult> => {
      let prompt: string;
      try {
        prompt = readPrompt(task.agent.prompt);
      } catch (error) {
        return Promise.resolve({
          status: "failed",
          output: undefined,
          message: `cannot read the "${task.agent.key}" agent prompt at ${task.agent.prompt}: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      const result = spawn({
        command,
        args: claudeCodeArgs(task, agentDefinition(task, prompt), sessionId(), options.model),
        cwd: task.root,
        timeoutMs,
      });

      if (result.error !== undefined && result.stdout.trim().length === 0) {
        // A missing binary, a timeout or an unrecognised flag: fail loudly
        // rather than degrade into a silent no-op.
        return Promise.resolve({
          status: "failed",
          output: undefined,
          message: `"${command}" did not run (${result.error})${result.stderr === undefined || result.stderr.length === 0 ? "" : `: ${result.stderr.trim().slice(0, 400)}`}`,
        });
      }
      return Promise.resolve(parsePrintMode(result.stdout));
    },
  };
}
