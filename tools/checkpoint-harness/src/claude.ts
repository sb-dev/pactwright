// T3-C: the one provider adapter (Task 3 research log §§8, 10 and §12). A
// role is dispatched only from complete configuration: an explicit model, an
// API key named by reference, attempt/time/turn limits and a spend limit the
// provider can enforce. The session driver runs outside the candidate; the
// agent has no built-in tools, no filesystem settings, plugins or hooks, and
// acts only through contained workspace tools. Selected skills are supplied
// inline and pinned by digest. The outcome is a validated proposal; it never
// carries acceptance, which only the controller records after verification.

import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createSdkMcpServer,
  query,
  tool,
  type Options,
  type SDKMessage,
  type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";
import { z } from "zod";

import {
  sha256,
  type AcceptedOutput,
  type PlannedCriterion,
  type PlannedInput,
  type PlannedRequirement,
  type PreparedRun,
  type VerificationTarget,
} from "./contracts.js";
import { appendEvent, putEvidence, type JournalEvent, type RunHandle } from "./evidence.js";
import {
  exec,
  readFile,
  writeFile,
  type ExecResult,
  type FileResult,
  type SealedCandidate,
  type Workspace,
  type WritePolicy,
  type WriteResult,
} from "./workspace.js";

export type RoleName = "producer" | "reviewer";

/** A secret that never serialises: JSON and string conversion show only a placeholder. */
export class Secret {
  readonly #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  reveal(): string {
    return this.#value;
  }
  toJSON(): string {
    return "[REDACTED]";
  }
  toString(): string {
    return "[REDACTED]";
  }
}

export type Skill = { name: string; digest: string; text: string };

/** How the configured credential authenticates: a Console API key or a subscription OAuth token. */
export type CredentialKind = "api-key" | "oauth-token";

/** A dispatchable role, resolved from validated configuration. */
export type AgentRole = {
  name: RoleName;
  model: string;
  /** Skill directories present in the controller's skills root. */
  available: string[];
  /** Selected skills with their pinned SKILL.md bytes. */
  skills: Skill[];
  limits: { attempts: number; wallTimeMs: number; maxTurns: number; maxBudgetUsd: number };
  credential: Secret;
  credentialKind: CredentialKind;
};

export type Finding = { rule: string; location: string; defect: string; correction: string };

/** Generated invocation context for one attempt. It holds no conversation. */
export type Packet = {
  role: RoleName;
  attempt: number;
  template: string;
  checkpoint: string;
  definitions: string;
  step: {
    id: string;
    definition: string;
    outputs: { id: string; meaning: string }[];
    requirements: PlannedRequirement[];
    criteria: PlannedCriterion[];
    targets: VerificationTarget[];
  };
  inherited: PreparedRun["inherited"];
  inputs: { sources: PlannedInput[]; accepted: AcceptedOutput[] };
  effects: WritePolicy & { commands: "contained, no network" };
  skills: { name: string; digest: string }[];
  findings: Finding[];
  candidate: SealedCandidate | null;
};

/** The agent's proposal. It names no acceptance; the controller checks actual effects. */
export type Submission = {
  status: "submitted" | "blocked";
  outputs: { output: string; paths: string[] }[];
  changes: { path: string; summary: string }[];
  verifier_proposals: { binding: string; paths: string[]; summary: string }[];
  blockers: string[];
};

export type ToolCall = { tool: string; target: string; ok: boolean; detail: string };

/** Redacted facts about one invocation. Assistant text is never recorded. */
export type Observation = {
  role: RoleName;
  attempt: number;
  packet: string;
  template: string;
  /** Digest of the effective, non-secret session settings (`sessionSettings`). */
  settings: string;
  session: string | null;
  model: { configured: string; reported: string | null; used: string[] };
  auth: string | null;
  tools: string[] | null;
  skills: {
    available: string[];
    selected: string[];
    supplied: { name: string; digest: string }[];
    /** Skills are supplied inline and no Skill tool exists, so invocation is not observable. */
    invoked: "not-observable";
  };
  toolCalls: ToolCall[];
  denials: string[];
  usage: {
    costUsd: number | "unknown";
    inputTokens: number | "unknown";
    outputTokens: number | "unknown";
  };
  turns: number | null;
  durationMs: number;
};

export type AgentOutcome =
  | { outcome: "submitted"; submission: Submission; observation: Observation }
  | { outcome: "blocked"; blockers: string[]; observation: Observation }
  | { outcome: "failed"; reason: string; observation: Observation }
  | { outcome: "cancelled"; reason: string; observation: Observation }
  | {
      outcome: "exhausted";
      limit: "attempts" | "time" | "turns" | "spend";
      observation: Observation;
    };

/** Candidate operations the tools may use; `containedOps` binds them to a B workspace. */
export type WorkspaceOps = {
  readFile(path: string): Promise<FileResult>;
  writeFile(path: string, bytes: Buffer): Promise<WriteResult>;
  exec(argv: readonly string[], options: { timeoutMs: number }): Promise<ExecResult>;
};

export const containedOps = (ws: Workspace): WorkspaceOps => ({
  readFile: (path) => readFile(ws, path),
  writeFile: (path, bytes) => writeFile(ws, path, bytes),
  exec: (argv, options) => exec(ws, argv, options),
});

export type ToolReply = { ok: boolean; text: string };

export type ToolDef = {
  name: string;
  description: string;
  shape: z.ZodRawShape;
  run(args: unknown): Promise<ToolReply>;
};

export type ProviderRequest = {
  model: string;
  system: string;
  prompt: string;
  tools: readonly ToolDef[];
  outputSchema: Record<string, unknown>;
  maxTurns: number;
  maxBudgetUsd: number;
  credential: Secret;
  credentialKind: CredentialKind;
  abort: AbortController;
};

/** What the provider reported. `account` precedes the prompt's release. */
export type ProviderEvent =
  | {
      type: "account";
      apiKeySource: string | null;
      tokenSource: string | null;
      apiProvider: string | null;
    }
  | {
      type: "init";
      session: string;
      model: string;
      tools: string[];
      mcpServers: { name: string; status: string }[];
      plugins: string[];
      permissionMode: string;
      apiKeySource: string;
    }
  | {
      type: "result";
      subtype: string;
      isError: boolean;
      output: string | null;
      costUsd: number | null;
      inputTokens: number | null;
      outputTokens: number | null;
      models: string[];
      turns: number;
      denials: string[];
      errors: string[];
    };

/**
 * One provider session. It yields `account` before sending the prompt and
 * sends it only when the consumer asks for the next event.
 */
export type Provider = (request: ProviderRequest) => AsyncIterable<ProviderEvent>;

const SERVER = "workspace";
const qualified = (name: string): string => `mcp__${SERVER}__${name}`;
const API_KEY = "ANTHROPIC_API_KEY";
const OAUTH_TOKEN = "CLAUDE_CODE_OAUTH_TOKEN";
/** Network settings the provider process may inherit; none is a credential. */
const PASSTHROUGH = [
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "NO_PROXY",
  "NODE_EXTRA_CA_CERTS",
  "SSL_CERT_FILE",
];
const MAX_TEXT = 64 * 1024;
const SDK_VERSION: string = (
  JSON.parse(
    readFileSync(
      new URL("../node_modules/@anthropic-ai/claude-agent-sdk/package.json", import.meta.url),
      "utf8",
    ),
  ) as { version: string }
).version;

const dispatchSchema: unknown = JSON.parse(
  readFileSync(new URL("./dispatch.schema.json", import.meta.url), "utf8"),
);

type RoleConfig = {
  adapter: "claude-sdk";
  model: string;
  skills: string[];
  skill_digests?: Record<string, string>;
  max_turns: number;
};
type DispatchConfig = {
  roles: Partial<Record<RoleName, RoleConfig>>;
  credentials: { provider: string; kind?: CredentialKind };
  budgets: {
    attempts: number;
    wall_time_seconds: number;
    provider_spend_limit: { usd: number; turn_reservation_usd: number };
  };
};

const ajv = new Ajv2020({ allErrors: true });
const validateDispatch = ajv.compile<DispatchConfig>(dispatchSchema as Record<string, unknown>);

/**
 * Resolves a role for dispatch from the run configuration. The credential is
 * read from the referenced environment variable; skills are read from the
 * controller's skills root, never from a candidate.
 */
export function resolveRole(
  config: unknown,
  name: RoleName,
  options: { skillsRoot: string; env: Readonly<Record<string, string | undefined>> },
): { ok: true; role: AgentRole } | { ok: false; diagnostics: string[] } {
  if (!validateDispatch(config)) {
    return {
      ok: false,
      diagnostics: (validateDispatch.errors ?? []).map(
        (e) => `dispatch: ${e.instancePath || "/"} ${e.message ?? ""}`,
      ),
    };
  }
  const role = config.roles[name];
  if (!role) return { ok: false, diagnostics: [`roles.${name}: not configured`] };
  const diagnostics: string[] = [];
  const variable = config.credentials.provider.slice("env:".length);
  const key = options.env[variable];
  if (!key) diagnostics.push(`credentials.provider: ${variable} is not set; dispatch refused`);
  const spend = config.budgets.provider_spend_limit;
  if (spend.turn_reservation_usd >= spend.usd) {
    diagnostics.push(
      "budgets.provider_spend_limit: turn_reservation_usd must be below usd; the limit is not enforceable",
    );
  }
  let available: string[] = [];
  try {
    available = readdirSync(options.skillsRoot).sort();
  } catch {
    diagnostics.push(`${options.skillsRoot}: skills root is not readable`);
  }
  const skills: Skill[] = [];
  for (const skill of role.skills) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(join(options.skillsRoot, skill, "SKILL.md"));
    } catch {
      diagnostics.push(`roles.${name}.skills: ${skill} has no SKILL.md`);
      continue;
    }
    const digest = sha256(bytes);
    const expected = role.skill_digests?.[skill];
    if (expected !== undefined && expected !== digest) {
      diagnostics.push(`roles.${name}.skills: ${skill} is ${digest}, expected ${expected}`);
    }
    skills.push({ name: skill, digest, text: bytes.toString("utf8") });
  }
  for (const pinned of Object.keys(role.skill_digests ?? {})) {
    if (!role.skills.includes(pinned)) {
      diagnostics.push(`roles.${name}.skill_digests: ${pinned} is not selected`);
    }
  }
  if (diagnostics.length > 0 || !key) return { ok: false, diagnostics };
  return {
    ok: true,
    role: {
      name,
      model: role.model,
      available,
      skills,
      limits: {
        attempts: config.budgets.attempts,
        wallTimeMs: config.budgets.wall_time_seconds * 1000,
        maxTurns: role.max_turns,
        maxBudgetUsd: spend.usd - spend.turn_reservation_usd,
      },
      credential: new Secret(key),
      credentialKind: config.credentials.kind ?? "api-key",
    },
  };
}

const TEMPLATES: Record<RoleName, string> = {
  producer: [
    "You are the producer for one Pactwright checkpoint step. The user message is a JSON work packet: the step's exact requirements and acceptance criteria, its accepted inputs, the paths you may change and findings from earlier attempts.",
    "Work only through the mcp__workspace__ tools: read_file, search_files, write_file and run_command. They act inside an isolated workspace with no network. Change only the writable paths listed under effects; protected paths and every other path are read-only.",
    "Do not weaken or reinterpret a requirement. If a requirement is contradictory, needs authority you lack, or cannot be met within the permitted effects, report it as a blocker instead of guessing.",
    'Finish with the structured result: status "submitted" with the paths of each output you produced, a one-line summary of each changed path and any verifier you propose; or status "blocked" with the blockers. The result is a proposal. The harness checks the workspace, runs verification and obtains independent review; you cannot accept your own work.',
  ].join("\n\n"),
  reviewer: [
    "You are an independent reviewer for one Pactwright checkpoint step. The user message is a JSON work packet: the step's exact requirements and acceptance criteria and the sealed candidate in the workspace. You have not seen the producer's conversation; judge only what the workspace contains.",
    "Inspect the workspace only through mcp__workspace__read_file and mcp__workspace__search_files. You cannot change it.",
    'Finish with the structured result: status "submitted" with one entry under changes for each path you reviewed and its finding; or status "blocked" with the reasons the review cannot be completed.',
  ].join("\n\n"),
};

/**
 * Builds the packet for one attempt at a planned step. Output inputs must
 * have a current accepted instance; findings are passed on verbatim.
 */
export function buildPacket(
  plan: PreparedRun,
  stepId: string,
  role: Pick<AgentRole, "name" | "skills">,
  options: {
    attempt: number;
    accepted: readonly AcceptedOutput[];
    policy: WritePolicy;
    findings?: readonly Finding[];
    candidate?: SealedCandidate;
  },
): { ok: true; packet: Packet; digest: string } | { ok: false; diagnostics: string[] } {
  const step = plan.steps.find((s) => s.id === stepId);
  if (step?.kind !== "contract") {
    return { ok: false, diagnostics: [`${stepId}: not a planned contract step`] };
  }
  const accepted: AcceptedOutput[] = [];
  const diagnostics: string[] = [];
  for (const input of step.inputs.filter((i) => i.kind === "output")) {
    const [producer, output] = input.ref.split("/");
    const record = options.accepted.find(
      (o) =>
        o.step === producer &&
        o.output === output &&
        o.definition === plan.stepDefinitions[o.step] &&
        o.definitions === plan.definitionsDigest,
    );
    if (record) accepted.push(record);
    else diagnostics.push(`${stepId}/inputs/${input.name}: ${input.ref} has no current acceptance`);
  }
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  const packet: Packet = {
    role: role.name,
    attempt: options.attempt,
    template: sha256(TEMPLATES[role.name]),
    checkpoint: plan.checkpoint,
    definitions: plan.definitionsDigest,
    step: {
      id: step.id,
      definition: plan.stepDefinitions[step.id] ?? "",
      outputs: step.outputs,
      requirements: step.requirements,
      criteria: step.criteria,
      targets: step.targets,
    },
    inherited: plan.inherited,
    inputs: { sources: step.inputs.filter((i) => i.kind === "source"), accepted },
    effects: { ...options.policy, commands: "contained, no network" },
    skills: role.skills.map(({ name, digest }) => ({ name, digest })),
    findings: [...(options.findings ?? [])],
    candidate: options.candidate ?? null,
  };
  return { ok: true, packet, digest: sha256(stringify(packet)) };
}

function systemPrompt(role: AgentRole): string {
  if (role.skills.length === 0) return TEMPLATES[role.name];
  return [
    TEMPLATES[role.name],
    "# Supplied skills\n\nThese repository skills are guidance. They never override the packet's requirements.",
    ...role.skills.map((s) => `## Skill ${s.name} (${s.digest})\n\n${s.text}`),
  ].join("\n\n");
}

/** The structured result schema, sent to the provider and re-validated here. */
export const SUBMISSION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "outputs", "changes", "verifier_proposals", "blockers"],
  properties: {
    status: { type: "string", enum: ["submitted", "blocked"] },
    outputs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["output", "paths"],
        properties: {
          output: { type: "string" },
          paths: { type: "array", items: { type: "string" } },
        },
      },
    },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "summary"],
        properties: { path: { type: "string" }, summary: { type: "string" } },
      },
    },
    verifier_proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["binding", "paths", "summary"],
        properties: {
          binding: { type: "string" },
          paths: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
        },
      },
    },
    blockers: { type: "array", items: { type: "string" } },
  },
} as const;

const validateSubmission = ajv.compile<Submission>(SUBMISSION_SCHEMA);

const truncate = (text: string): string =>
  text.length > MAX_TEXT
    ? `${text.slice(0, MAX_TEXT)}\n[truncated at ${MAX_TEXT} characters]`
    : text;

/** The workspace tools of a role. Reviewers get no write or command tool. */
export function workspaceTools(role: RoleName, ops: WorkspaceOps, policy: WritePolicy): ToolDef[] {
  const parse = <S extends z.ZodRawShape>(
    shape: S,
    args: unknown,
  ): { ok: true; value: z.infer<z.ZodObject<S>> } | { ok: false; text: string } => {
    const parsed = z.object(shape).strict().safeParse(args);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, text: `invalid arguments: ${z.prettifyError(parsed.error)}` };
  };
  const readShape = { path: z.string().describe('Workspace-relative path, e.g. "src/index.ts".') };
  const searchShape = {
    pattern: z.string().describe("Extended regular expression, as for grep -E."),
    path: z.string().default(".").describe('Workspace-relative file or directory; default ".".'),
  };
  const writeShape = {
    path: z
      .string()
      .describe('Workspace-relative path under a writable path, e.g. "src/index.ts".'),
    content: z.string().describe("The complete new file content (UTF-8)."),
  };
  const commandShape = {
    argv: z.array(z.string()).min(1).describe('Program and arguments, e.g. ["node", "--test"].'),
    timeout_seconds: z.number().int().min(1).max(600).default(60),
  };
  const read: ToolDef = {
    name: "read_file",
    description:
      "Read one UTF-8 file of the workspace. Returns its content, truncated after 64 KiB. Fails for a missing file or a path outside the workspace.",
    shape: readShape,
    async run(args) {
      const input = parse(readShape, args);
      if (!input.ok) return input;
      const result = await ops.readFile(input.value.path);
      return result.ok
        ? { ok: true, text: truncate(result.bytes.toString("utf8")) }
        : {
            ok: false,
            text: `read_file ${input.value.path} failed: ${result.reason}. Use a relative path of an existing file; search_files lists matches.`,
          };
    },
  };
  const search: ToolDef = {
    name: "search_files",
    description:
      "Search workspace text files for a regular expression (grep -rnIE). Returns matching lines as path:line:text, or a no-match message.",
    shape: searchShape,
    async run(args) {
      const input = parse(searchShape, args);
      if (!input.ok) return input;
      const result = await ops.exec(
        ["grep", "-rnIE", "--", input.value.pattern, input.value.path],
        {
          timeoutMs: 60_000,
        },
      );
      if (result.exitCode === 0)
        return { ok: true, text: truncate(result.stdout.toString("utf8")) };
      if (result.exitCode === 1) return { ok: true, text: "no matches" };
      return {
        ok: false,
        text: `search_files failed: ${result.stderr.toString("utf8").trim()}. Check the pattern syntax and that the path exists.`,
      };
    },
  };
  const write: ToolDef = {
    name: "write_file",
    description: `Create or replace one workspace file with the given UTF-8 content. Only these paths are writable: ${policy.writable.join(", ") || "(none)"}; protected paths are never writable. Returns the byte count written.`,
    shape: writeShape,
    async run(args) {
      const input = parse(writeShape, args);
      if (!input.ok) return input;
      const bytes = Buffer.from(input.value.content, "utf8");
      const result = await ops.writeFile(input.value.path, bytes);
      return result.ok
        ? { ok: true, text: `wrote ${bytes.length} bytes to ${input.value.path}` }
        : {
            ok: false,
            text: `write_file ${input.value.path} refused: ${result.reason}. Writable paths: ${policy.writable.join(", ") || "(none)"}; protected: ${policy.protected.join(", ") || "(none)"}.`,
          };
    },
  };
  const command: ToolDef = {
    name: "run_command",
    description:
      'Run one program in the workspace as an unprivileged user without network, for builds and tests. argv is not passed through a shell; use ["sh", "-c", "..."] for pipes. Returns the exit code and the output tails. A timeout stops the whole workspace.',
    shape: commandShape,
    async run(args) {
      const input = parse(commandShape, args);
      if (!input.ok) return input;
      const result = await ops.exec(input.value.argv, {
        timeoutMs: input.value.timeout_seconds * 1000,
      });
      const tail = (b: Buffer): string => b.toString("utf8").slice(-8192);
      return {
        ok: result.exitCode === 0 && !result.timedOut,
        text: [
          result.timedOut ? "timed out; the workspace is stopped" : `exit ${result.exitCode}`,
          `stdout:\n${tail(result.stdout)}`,
          `stderr:\n${tail(result.stderr)}`,
        ].join("\n"),
      };
    },
  };
  return role === "producer" ? [read, search, write, command] : [read, search];
}

const targetOf = (args: unknown): string => {
  if (typeof args !== "object" || args === null) return "";
  const a = args as Record<string, unknown>;
  if (Array.isArray(a.argv)) return a.argv.map(String).join(" ");
  return typeof a.path === "string" ? a.path : "";
};

/** Maps one SDK message to a provider event, or null for messages the adapter ignores. */
export function fromSdkMessage(message: SDKMessage): ProviderEvent | null {
  if (message.type === "system" && message.subtype === "init") {
    return {
      type: "init",
      session: message.session_id,
      model: message.model,
      tools: [...message.tools],
      mcpServers: message.mcp_servers.map(({ name, status }) => ({ name, status })),
      plugins: message.plugins.map((p) => p.name),
      permissionMode: message.permissionMode,
      apiKeySource: message.apiKeySource,
    };
  }
  if (message.type !== "result") return null;
  const success = message.subtype === "success";
  return {
    type: "result",
    subtype: message.subtype,
    isError: message.is_error,
    output: success
      ? message.structured_output !== undefined
        ? JSON.stringify(message.structured_output)
        : message.result
      : null,
    costUsd: message.total_cost_usd,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    models: Object.keys(message.modelUsage).sort(),
    turns: message.num_turns,
    denials: message.permission_denials.map((d) => d.tool_name),
    errors: success ? [] : [...message.errors],
  };
}

/**
 * Options for one SDK session: an empty working and configuration directory
 * (`home`), a minimal environment, no built-in tools, no filesystem settings,
 * skills, plugins or other MCP servers, and denial of any tool not
 * pre-approved.
 */
export function sdkOptions(request: ProviderRequest, home: string): Options {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    HOME: home,
    CLAUDE_CONFIG_DIR: home,
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    CLAUDE_AGENT_SDK_CLIENT_APP: "pactwright-checkpoint-harness",
    // An API key runs in bare mode, where the CLI ignores ambient OAuth
    // tokens (such as one a cloud host injects at a fixed path), keychains
    // and auto-discovery. Bare mode also ignores OAuth tokens passed in the
    // environment, so a configured OAuth token is passed without it; the CLI
    // prefers that token to any ambient one.
    ...(request.credentialKind === "api-key"
      ? { [API_KEY]: request.credential.reveal(), CLAUDE_CODE_SIMPLE: "1" }
      : { [OAUTH_TOKEN]: request.credential.reveal() }),
  };
  for (const name of PASSTHROUGH) {
    const value = process.env[name];
    if (value) env[name] = value;
  }
  const server = createSdkMcpServer({
    name: SERVER,
    tools: request.tools.map((def) =>
      tool(def.name, def.description, def.shape, async (args) => {
        const reply = await def.run(args);
        return { content: [{ type: "text", text: reply.text }], isError: !reply.ok };
      }),
    ),
  });
  return {
    model: request.model,
    systemPrompt: request.system,
    tools: [],
    allowedTools: request.tools.map((t) => qualified(t.name)),
    permissionMode: "dontAsk",
    settingSources: [],
    // The CLI's bundled agents-md plugin loads instruction files by itself.
    settings: { enabledPlugins: { "agents-md@builtin": false } },
    skills: [],
    plugins: [],
    strictMcpConfig: true,
    mcpServers: { [SERVER]: server },
    persistSession: false,
    cwd: home,
    env,
    outputFormat: { type: "json_schema", schema: request.outputSchema },
    maxTurns: request.maxTurns,
    maxBudgetUsd: request.maxBudgetUsd,
    abortController: request.abort,
  };
}

/**
 * The effective session settings without secrets or per-session values: the
 * SDK version, every option `sdkOptions` sets, the environment's variable
 * names, the system prompt's digest and each workspace tool's definition.
 */
export function sessionSettings(request: ProviderRequest): Record<string, unknown> {
  const options = sdkOptions(request, "<controller-home>");
  const { env, mcpServers, abortController, systemPrompt, ...rest } = options;
  void [mcpServers, abortController, systemPrompt];
  return {
    sdk: SDK_VERSION,
    options: rest,
    env: Object.keys(env ?? {}).sort(),
    system: sha256(request.system),
    tools: request.tools.map((t) => ({
      name: qualified(t.name),
      description: t.description,
      input: z.toJSONSchema(z.object(t.shape).strict()),
    })),
  };
}

const decodeOrRaw = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/**
 * Every secret value a session receives: the API key, and each proxy URL
 * that carries credentials together with its user and password parts.
 */
export function providerSecrets(credential: Secret): string[] {
  const secrets = [credential.reveal()];
  for (const name of PASSTHROUGH) {
    const value = process.env[name];
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      continue;
    }
    if (url.username || url.password) {
      secrets.push(value, url.username, url.password);
      secrets.push(decodeOrRaw(url.username), decodeOrRaw(url.password));
    }
  }
  return [...new Set(secrets.filter((s) => s !== ""))].sort((a, b) => b.length - a.length);
}

/**
 * The Claude Agent SDK session driver. It runs in the controller process,
 * outside every candidate, and sends the prompt only after the consumer has
 * seen how the session authenticates.
 */
export async function* sdkProvider(request: ProviderRequest): AsyncGenerator<ProviderEvent> {
  const home = mkdtempSync(join(tmpdir(), "pactwright-agent-"));
  let release = (): void => undefined;
  const released = new Promise<void>((resolve) => (release = resolve));
  async function* input(): AsyncGenerator<SDKUserMessage> {
    await released;
    yield {
      type: "user",
      message: { role: "user", content: request.prompt },
      parent_tool_use_id: null,
    };
  }
  // The CLI process writes its configuration directory while it shuts down,
  // so the directory is removed only after the process has exited.
  let child: ChildProcess | undefined;
  const session = query({
    prompt: input(),
    options: {
      ...sdkOptions(request, home),
      spawnClaudeCodeProcess: ({ command, args, cwd, env, signal }) =>
        (child = spawn(command, args, { cwd, env, signal, stdio: ["pipe", "pipe", "ignore"] })),
    },
  });
  try {
    const { account } = await session.initializationResult();
    yield {
      type: "account",
      apiKeySource: account.apiKeySource ?? null,
      tokenSource: account.tokenSource ?? null,
      apiProvider: account.apiProvider ?? null,
    };
    release();
    for await (const message of session) {
      const event = fromSdkMessage(message);
      if (event) yield event;
      if (event?.type === "result") return;
    }
  } finally {
    request.abort.abort();
    session.close();
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      const timer = setTimeout(() => child?.kill("SIGKILL"), 10_000);
      await exited;
      clearTimeout(timer);
    }
    rmSync(home, { recursive: true, force: true });
  }
}

/**
 * Removes secrets from the free text of an outcome: reasons, blockers, the
 * submission's fields, tool-call targets and details, and denials. Outcome
 * kinds, limits, digests, model names and other controller-owned fields are
 * never rewritten, so a short secret cannot corrupt them.
 */
function redactOutcome(outcome: AgentOutcome, secrets: readonly string[]): AgentOutcome {
  const text = (value: string): string =>
    secrets.reduce((t, secret) => t.split(secret).join("[REDACTED]"), value);
  const observation: Observation = {
    ...outcome.observation,
    toolCalls: outcome.observation.toolCalls.map((c) => ({
      ...c,
      target: text(c.target),
      detail: text(c.detail),
    })),
    denials: outcome.observation.denials.map(text),
  };
  switch (outcome.outcome) {
    case "submitted": {
      const s = outcome.submission;
      return {
        ...outcome,
        observation,
        submission: {
          status: s.status,
          outputs: s.outputs.map((o) => ({ output: text(o.output), paths: o.paths.map(text) })),
          changes: s.changes.map((c) => ({ path: text(c.path), summary: text(c.summary) })),
          verifier_proposals: s.verifier_proposals.map((v) => ({
            binding: text(v.binding),
            paths: v.paths.map(text),
            summary: text(v.summary),
          })),
          blockers: s.blockers.map(text),
        },
      };
    }
    case "blocked":
      return { ...outcome, observation, blockers: outcome.blockers.map(text) };
    case "failed":
    case "cancelled":
      return { ...outcome, observation, reason: text(outcome.reason) };
    case "exhausted":
      return { ...outcome, observation };
  }
}

/** Differences between the effective session and the one dispatch configured. */
function initErrors(
  event: Extract<ProviderEvent, { type: "init" }>,
  role: AgentRole,
  tools: readonly ToolDef[],
): string[] {
  const expected = ["StructuredOutput", ...tools.map((t) => qualified(t.name))].sort();
  const actual = [...event.tools].sort();
  const errors: string[] = [];
  if (stringify(actual) !== stringify(expected)) {
    errors.push(`tools ${actual.join(",")} are not ${expected.join(",")}`);
  }
  if (stringify(event.mcpServers) !== stringify([{ name: SERVER, status: "connected" }])) {
    errors.push(
      `MCP servers ${stringify(event.mcpServers)} are not the connected workspace server`,
    );
  }
  if (event.plugins.length > 0) errors.push(`plugins loaded: ${event.plugins.join(",")}`);
  if (event.permissionMode !== "dontAsk") errors.push(`permission mode ${event.permissionMode}`);
  const keySource = role.credentialKind === "api-key" ? API_KEY : "none";
  if (event.apiKeySource !== keySource) errors.push(`authentication from ${event.apiKeySource}`);
  if (event.model !== role.model) errors.push(`model ${event.model} is not ${role.model}`);
  return errors;
}

type Stop = { kind: "cancel" } | { kind: "time" };

/**
 * Runs one attempt of a role on a packet in a workspace. The caller's signal
 * cancels it. Events and tool calls after the outcome is decided are ignored
 * or refused. Only schema-valid results become `submitted` or `blocked`.
 */
export async function invokeAgent(
  role: AgentRole,
  packet: Packet,
  workspace: WorkspaceOps,
  signal: AbortSignal,
  options: { provider?: Provider } = {},
): Promise<AgentOutcome> {
  const started = Date.now();
  const observation: Observation = {
    role: role.name,
    attempt: packet.attempt,
    packet: sha256(stringify(packet)),
    template: sha256(TEMPLATES[role.name]),
    settings: "",
    session: null,
    model: { configured: role.model, reported: null, used: [] },
    auth: null,
    tools: null,
    skills: {
      available: role.available,
      selected: role.skills.map((s) => s.name),
      supplied: role.skills.map(({ name, digest }) => ({ name, digest })),
      invoked: "not-observable",
    },
    toolCalls: [],
    denials: [],
    usage: { costUsd: "unknown", inputTokens: "unknown", outputTokens: "unknown" },
    turns: null,
    durationMs: 0,
  };
  const secrets = providerSecrets(role.credential);
  let closed = false;
  const done = (outcome: AgentOutcome): AgentOutcome => {
    closed = true;
    outcome.observation.durationMs = Date.now() - started;
    return redactOutcome(outcome, secrets);
  };

  const policy: WritePolicy = packet.effects;
  const tools = workspaceTools(role.name, workspace, policy).map((def): ToolDef => ({
    ...def,
    async run(args) {
      if (closed) return { ok: false, text: "the invocation is closed; no further tool calls run" };
      let reply: ToolReply;
      try {
        reply = await def.run(args);
      } catch (e) {
        reply = { ok: false, text: `${def.name} failed: ${e instanceof Error ? e.message : e}` };
      }
      observation.toolCalls.push({
        tool: def.name,
        target: targetOf(args),
        ok: reply.ok,
        detail: reply.ok ? "" : reply.text.slice(0, 500),
      });
      return reply;
    },
  }));

  const abort = new AbortController();
  const request: ProviderRequest = {
    model: role.model,
    system: systemPrompt(role),
    prompt: `Work packet:\n${stringify(packet, null, 2)}`,
    tools,
    outputSchema: SUBMISSION_SCHEMA,
    maxTurns: role.limits.maxTurns,
    maxBudgetUsd: role.limits.maxBudgetUsd,
    credential: role.credential,
    credentialKind: role.credentialKind,
    abort,
  };
  observation.settings = sha256(stringify(sessionSettings(request)));
  if (packet.role !== role.name) {
    return done({ outcome: "failed", reason: `packet is for ${packet.role}`, observation });
  }
  if (packet.attempt > role.limits.attempts) {
    return done({ outcome: "exhausted", limit: "attempts", observation });
  }
  if (signal.aborted) return done({ outcome: "cancelled", reason: "cancelled", observation });

  let stop: (reason: Stop) => void = () => undefined;
  const stopped = new Promise<Stop>((resolve) => (stop = resolve));
  const onCancel = (): void => stop({ kind: "cancel" });
  signal.addEventListener("abort", onCancel);
  const timer = setTimeout(() => stop({ kind: "time" }), role.limits.wallTimeMs);
  const events = (options.provider ?? sdkProvider)(request)[Symbol.asyncIterator]();

  // Authentication and the effective session are checked before a result
  // can count, so a provider must report them first and in this order.
  const order = ["account", "init", "result"] as const;
  const decide = async (): Promise<AgentOutcome> => {
    for (let stage = 0; ; stage++) {
      let next: IteratorResult<ProviderEvent> | Stop;
      try {
        next = await Promise.race([events.next(), stopped]);
      } catch (e) {
        return {
          outcome: "failed",
          reason: `provider error: ${e instanceof Error ? e.message : String(e)}`,
          observation,
        };
      }
      if ("kind" in next) {
        return next.kind === "time"
          ? { outcome: "exhausted", limit: "time", observation }
          : { outcome: "cancelled", reason: "cancelled by the controller", observation };
      }
      if (next.done) {
        return { outcome: "failed", reason: "provider ended without a result", observation };
      }
      const event = next.value;
      if (event.type !== order[stage]) {
        return {
          outcome: "failed",
          reason: `provider reported ${event.type} where ${order[stage]} was due`,
          observation,
        };
      }
      if (event.type === "account") {
        // Only the configured credential may fund the session: the other
        // kind, an ambient OAuth token (such as one a host injects) or
        // another backend refuses it before the prompt is sent.
        const [key, token] =
          role.credentialKind === "api-key" ? [API_KEY, "none"] : ["none", OAUTH_TOKEN];
        observation.auth =
          role.credentialKind === "api-key" ? event.apiKeySource : event.tokenSource;
        if (
          (event.apiKeySource ?? "none") !== key ||
          (event.tokenSource ?? "none") !== token ||
          (event.apiProvider ?? "firstParty") !== "firstParty"
        ) {
          return {
            outcome: "failed",
            reason: `unsupported authentication: key ${event.apiKeySource}, token ${event.tokenSource}, provider ${event.apiProvider}; the prompt was not sent`,
            observation,
          };
        }
      } else if (event.type === "init") {
        observation.session = event.session;
        observation.model.reported = event.model;
        observation.tools = [...event.tools].sort();
        const errors = initErrors(event, role, tools);
        if (errors.length > 0) {
          return {
            outcome: "failed",
            reason: `effective session differs: ${errors.join("; ")}`,
            observation,
          };
        }
      } else {
        observation.model.used = event.models;
        observation.denials = event.denials;
        observation.turns = event.turns;
        observation.usage = {
          costUsd: event.costUsd ?? "unknown",
          inputTokens: event.inputTokens ?? "unknown",
          outputTokens: event.outputTokens ?? "unknown",
        };
        return resultOutcome(event, observation);
      }
    }
  };
  try {
    return done(await decide());
  } finally {
    closed = true;
    clearTimeout(timer);
    signal.removeEventListener("abort", onCancel);
    abort.abort();
    // A provider that ignores the abort cannot delay the outcome.
    void events.return?.().catch(() => undefined);
  }
}

function resultOutcome(
  event: Extract<ProviderEvent, { type: "result" }>,
  observation: Observation,
): AgentOutcome {
  if (event.subtype === "error_max_turns")
    return { outcome: "exhausted", limit: "turns", observation };
  if (event.subtype === "error_max_budget_usd") {
    return { outcome: "exhausted", limit: "spend", observation };
  }
  if (event.subtype !== "success" || event.isError || event.output === null) {
    return {
      outcome: "failed",
      reason: `provider ${event.subtype}: ${
        event.errors.join("; ") || (event.isError && event.output) || "no result"
      }`,
      observation,
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(event.output);
  } catch {
    return { outcome: "failed", reason: "malformed result: not JSON", observation };
  }
  if (!validateSubmission(value)) {
    const errors = (validateSubmission.errors ?? [])
      .map((e) =>
        e.keyword === "additionalProperties"
          ? `${e.instancePath || "/"} unexpected field ${String(e.params.additionalProperty)}`
          : `${e.instancePath || "/"} ${e.message ?? ""}`,
      )
      .join("; ");
    return { outcome: "failed", reason: `malformed result: ${errors}`, observation };
  }
  if (value.status === "blocked") {
    return value.blockers.length > 0
      ? { outcome: "blocked", blockers: value.blockers, observation }
      : { outcome: "failed", reason: "malformed result: blocked without blockers", observation };
  }
  return { outcome: "submitted", submission: value, observation };
}

/** Stores an outcome as evidence and journals the invocation. It records no acceptance. */
export function recordInvocation(run: RunHandle, outcome: AgentOutcome): JournalEvent {
  const ref = putEvidence(run, stringify(outcome));
  return appendEvent(run, {
    action: "agent-invocation",
    attempt: outcome.observation.attempt,
    evidence: [ref],
    data: {
      role: outcome.observation.role,
      outcome: outcome.outcome,
      session: outcome.observation.session,
      settings: outcome.observation.settings,
    },
  });
}
