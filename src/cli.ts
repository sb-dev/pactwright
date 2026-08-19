#!/usr/bin/env node
import { formatProblem, PactwrightError } from "./errors.js";
import {
  lifecycleNext,
  lifecycleStatus,
  type LineageStatus,
  type NextAction,
} from "./lifecycle/engine.js";
import { noExecutor, runLifecycle, type RunResult } from "./lifecycle/run.js";
import { loadProject } from "./loader.js";
import { findProjectRoot } from "./project.js";
import { runtimeVersion } from "./version.js";

const HELP = `Usage: pactwright <command> [options]

Commands:
  lifecycle status [--intent <id>] [--json]  Report stage, completed stages, gates and lineage
  lifecycle next   [--intent <id>] [--json]  Report the next permitted core Delivery action
  lifecycle run    [--intent <id>] [--json]  Run automatic stages until a gate, completion,
                                             a stage failure or a validation error

Options:
  -h, --help     Show this help
  -v, --version  Print the runtime version
`;

interface CommonOptions {
  readonly intent?: string;
  readonly json: boolean;
}

function parseOptions(args: readonly string[]): CommonOptions | string {
  let intent: string | undefined;
  let json = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === "--json") json = true;
    else if (arg === "--intent") {
      intent = args[i + 1];
      if (intent === undefined || intent.startsWith("--")) return "--intent needs an intent id";
      i += 1;
    } else return `unknown option "${arg}"`;
  }
  return intent === undefined ? { json } : { intent, json };
}

const out = (text: string): void => void process.stdout.write(text);
const err = (text: string): void => void process.stderr.write(text);

function printProblems(error: PactwrightError, json: boolean): void {
  if (json) {
    out(`${JSON.stringify({ problems: error.problems }, null, 2)}\n`);
    return;
  }
  out("Validation problems:\n");
  for (const problem of error.problems) out(`  - ${formatProblem(problem)}\n`);
}

function formatStatus(entry: LineageStatus): string {
  const lines: string[] = [];
  lines.push(entry.intent === undefined ? "No active lineage" : `Intent: ${entry.intent}`);
  lines.push(`  state: ${entry.state}`);
  lines.push(
    `  current stage: ${entry.currentStage ?? "none (core Delivery lifecycle complete or terminal)"}`,
  );
  lines.push(
    `  completed stages: ${entry.completed.length === 0 ? "none" : entry.completed.join(", ")}`,
  );
  if (entry.blockedStage !== undefined) {
    lines.push(`  blocked stage: ${entry.blockedStage} (required actor: ${entry.requiredActor})`);
  }
  if (entry.lineage !== undefined) {
    const { decision, contract, brief, evidence } = entry.lineage;
    const chain = [entry.lineage.intent, decision, contract, brief, evidence]
      .filter((node) => node !== undefined)
      .map((node) => node.id);
    lines.push(`  current lineage: ${chain.join(" → ")}`);
  }
  return `${lines.join("\n")}\n`;
}

function formatNext(action: NextAction): string {
  const who = action.intent === undefined ? "No active lineage" : `Intent: ${action.intent}`;
  const stage =
    action.stage === undefined
      ? "next stage: none"
      : `next stage: ${action.stage} (${action.execution}${action.actor ? `, actor ${action.actor}` : ""}${action.gate ? ", human gate" : ""})`;
  return `${who}\n  ${stage}\n  ${action.reason}\n`;
}

function formatRun(result: RunResult): string {
  const lines: string[] = [];
  lines.push(result.intent === undefined ? "No active lineage" : `Intent: ${result.intent}`);
  lines.push(`  executed: ${result.executed.length === 0 ? "none" : result.executed.join(", ")}`);
  switch (result.stop) {
    case "completed":
      lines.push("  stopped: lifecycle complete or no automatic stage to run");
      break;
    case "human-gate":
      lines.push(
        `  stopped: human gate at ${result.stage} (required actor: ${result.requiredActor})`,
      );
      break;
    case "stage-failed":
      lines.push(`  stopped: stage ${result.stage} failed: ${result.message}`);
      break;
    case "validation-error":
      lines.push(`  stopped: validation error: ${result.message}`);
      break;
  }
  return `${lines.join("\n")}\n`;
}

async function lifecycle(sub: string | undefined, args: readonly string[]): Promise<number> {
  const options = parseOptions(args);
  if (typeof options === "string") {
    err(`pactwright: ${options}\n\n${HELP}`);
    return 1;
  }
  if (sub === "run") {
    // `runLifecycle` loads the project itself and reports load problems as a
    // validation-error stop; only the root is resolved here.
    let root: string;
    try {
      root = findProjectRoot();
    } catch (error) {
      if (!(error instanceof PactwrightError)) throw error;
      printProblems(error, options.json);
      return 1;
    }
    const results = await runLifecycle({
      root,
      execute: noExecutor,
      ...(options.intent === undefined ? {} : { intentId: options.intent }),
    });
    out(options.json ? `${JSON.stringify(results, null, 2)}\n` : results.map(formatRun).join(""));
    return results.some((r) => r.stop === "stage-failed" || r.stop === "validation-error") ? 1 : 0;
  }
  if (sub !== "status" && sub !== "next") {
    err(`pactwright: unknown lifecycle command "${sub ?? ""}"\n\n${HELP}`);
    return 1;
  }
  try {
    const project = loadProject();
    if (sub === "status") {
      const status = lifecycleStatus(project, options.intent);
      out(
        options.json
          ? `${JSON.stringify(status, null, 2)}\n`
          : `${status.lineages.map(formatStatus).join("")}Validation problems: none\n`,
      );
    } else {
      const actions = lifecycleNext(project, options.intent);
      out(
        options.json ? `${JSON.stringify(actions, null, 2)}\n` : actions.map(formatNext).join(""),
      );
    }
    return 0;
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
}

export async function main(argv: readonly string[]): Promise<number> {
  const [first, ...rest] = argv;
  if (first === undefined || first === "--help" || first === "-h" || first === "help") {
    out(HELP);
    return first === undefined ? 1 : 0;
  }
  if (first === "--version" || first === "-v" || first === "version") {
    out(`${runtimeVersion()}\n`);
    return 0;
  }
  if (first === "lifecycle") return lifecycle(rest[0], rest.slice(1));
  err(`pactwright: unknown command "${first}"\n\n${HELP}`);
  return 1;
}

process.exitCode = await main(process.argv.slice(2));
