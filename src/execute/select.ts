import { readFileSync } from "node:fs";
import type { PactwrightConfig } from "../config/config.js";
import { templateFor, type CommandName } from "../adapter/commands.js";
import { COMMAND_NAMES } from "../adapter/commands.js";
import type { LifecycleAction } from "../lifecycle/engine.js";
import type { ActionExecutor, ActionOutcome, ActionRequest } from "../lifecycle/run.js";
import { repositoryRevision } from "../graph/repository.js";
import { agentFor } from "../pack/resolve.js";
import { resolvePack } from "../pack/resolve.js";
import { STEP_CAPABILITY, type ShapeStepKind } from "../lifecycle/shape.js";
import { claudeCodeExecutor } from "./claude-code.js";
import { noneExecutor, type CapabilityExecutor, type CapabilityTask } from "./task.js";

/**
 * Resolves the executor a project declares (Distribution §3).
 *
 * Opt-in and explicit: absent configuration means `none`, and nothing here
 * inspects `PATH`. `scripted` is the harness's own double and is never
 * selected by configuration — a project cannot accidentally evaluate itself
 * against a test double.
 */
export function selectExecutor(config: PactwrightConfig): CapabilityExecutor {
  switch (config.execution?.executor) {
    case "claude-code":
      return claudeCodeExecutor();
    default:
      return noneExecutor;
  }
}

/**
 * The command whose instruction a lifecycle action performs.
 *
 * Shape steps and Contract-crafting responsibilities both map to one of the
 * seven canonical commands, so the headless path asks for exactly what the
 * rendered `.claude/commands/*.md` asks for. `actionForResponsibility` gave
 * responsibilities no capability at all, because the interactive path never
 * needed one — the mapping was unused, not missing, and reading it from a
 * second table would let the two paths drift into using different agents.
 */
const STEP_COMMAND: Readonly<Record<ShapeStepKind, CommandName | undefined>> = {
  delivery: "deliver-brief",
  review: "review",
  // The Evidence step is a runtime closure step: it invokes the mutation
  // guards, not an agent.
  evidence: undefined,
};

export function commandForAction(action: LifecycleAction): CommandName | undefined {
  if (action.kind === "responsibility") {
    return (COMMAND_NAMES as readonly string[]).includes(action.name)
      ? (action.name as CommandName)
      : undefined;
  }
  return undefined;
}

/** The command a shape step of `kind` performs. */
export function commandForStepKind(kind: ShapeStepKind): CommandName | undefined {
  return STEP_COMMAND[kind];
}

/** The capability a lifecycle action delegates to, read from the one table. */
export function capabilityForAction(
  action: LifecycleAction,
  kind?: ShapeStepKind,
): string | undefined {
  if (action.capability !== undefined) return action.capability;
  if (action.kind === "step") return kind === undefined ? undefined : STEP_CAPABILITY[kind];
  const command = commandForAction(action);
  return command === undefined ? undefined : templateFor(command).capability;
}

export interface TaskBuildOptions {
  readonly action: LifecycleAction;
  readonly kind?: ShapeStepKind;
  readonly root: string;
  readonly agent: CapabilityTask["agent"];
  readonly subject?: string;
}

/**
 * Builds the task for one lifecycle action.
 *
 * The instruction body comes from the same `COMMAND_TEMPLATES` entry the
 * adapter renders, so the interactive surface and the headless path cannot
 * diverge in what they ask for.
 */
export function taskForAction(options: TaskBuildOptions): CapabilityTask | undefined {
  const capability = capabilityForAction(options.action, options.kind);
  if (capability === undefined) return undefined;
  const command =
    options.action.kind === "step"
      ? options.kind === undefined
        ? undefined
        : commandForStepKind(options.kind)
      : commandForAction(options.action);
  if (command === undefined) return undefined;
  const template = templateFor(command);
  const instruction = [
    `# /${template.name}`,
    ``,
    template.description,
    ``,
    options.subject === undefined ? "" : `Subject: ${options.subject}`,
    ``,
    template.body(options.agent.key),
  ]
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""))
    .join("\n");
  return {
    capability,
    agent: options.agent,
    instruction,
    root: options.root,
    ...(options.subject === undefined ? {} : { label: options.subject }),
  };
}

/**
 * Adapts a `CapabilityExecutor` to the lifecycle's action seam.
 *
 * The executor returns a proposal; the runtime performs the typed mutation
 * or the transition itself. Letting the agent run `lifecycle record` inside
 * an automatic step double-advances the run — the agent's call advances the
 * state and then the loop advances it again — and it would put a canonical
 * write outside the mutation guards.
 */
export function lifecycleExecutor(executor: CapabilityExecutor): ActionExecutor {
  return async (request: ActionRequest): Promise<ActionOutcome> => {
    const { action, project } = request;
    const step =
      action.kind === "step"
        ? project.lifecycle.shape.steps.find((candidate) => candidate.name === action.name)
        : undefined;
    if (action.kind === "step" && step?.kind === "evidence") {
      // A closure step invokes the runtime's own guards, not an agent.
      return { status: "completed" };
    }

    const resolved = resolvePack({ root: project.paths.root, config: project.config });
    if (resolved.value === undefined) {
      return {
        status: "failed",
        message: `the agent pack does not resolve, so "${action.name}" cannot be performed`,
      };
    }
    const capability = capabilityForAction(action, step?.kind);
    const packAgent = capability === undefined ? undefined : agentFor(resolved.value, capability);
    if (capability === undefined || packAgent === undefined) {
      return {
        status: "failed",
        message: `the selected agent pack provides no agent for "${action.name}"${capability === undefined ? "" : ` (capability "${capability}")`}`,
      };
    }

    const task = taskForAction({
      action,
      ...(step === undefined ? {} : { kind: step.kind }),
      root: project.paths.root,
      agent: packAgent,
      ...(request.lineage?.brief === undefined ? {} : { subject: request.lineage.brief.id }),
    });
    if (task === undefined) {
      return { status: "failed", message: `"${action.name}" has no command template to perform` };
    }

    const result = await executor.invoke(task);
    if (result.status === "failed") {
      return { status: "failed", message: result.message ?? `"${action.name}" failed` };
    }
    return interpret(action, step?.kind, result.output, project.paths.root);
  };
}

/**
 * Reads the runtime-relevant facts out of an agent's proposal. Everything
 * else the agent returned is its own report, not graph truth.
 */
function interpret(
  action: LifecycleAction,
  kind: ShapeStepKind | undefined,
  output: unknown,
  root: string,
): ActionOutcome {
  if (kind === "delivery") {
    // The identity of what was delivered, so a later change invalidates the
    // Review taken against it (§53 precondition 2). `recordDelivery` reads
    // the same default for an adapter-driven Delivery.
    return { status: "completed", revision: repositoryRevision(root).id };
  }
  if (kind !== "review") return { status: "completed" };
  const verdict = readOutcome(output);
  if (verdict === undefined) {
    return {
      status: "failed",
      message: `the review of "${action.name}" reported no outcome; the runtime cannot choose a transition without one`,
    };
  }
  return { status: "completed", review: verdict };
}

function readOutcome(output: unknown): "pass" | "revise" | "blocked" | undefined {
  const text =
    typeof output === "string"
      ? output
      : typeof output === "object" && output !== null
        ? String((output as { outcome?: unknown }).outcome ?? "")
        : "";
  for (const verdict of ["blocked", "revise", "pass"] as const) {
    if (new RegExp(`\\b${verdict}\\b`, "i").test(text)) return verdict;
  }
  return undefined;
}

/** Reads an agent prompt file; exported so tests can inject a double. */
export function readAgentPrompt(path: string): string {
  return readFileSync(path, "utf8");
}
