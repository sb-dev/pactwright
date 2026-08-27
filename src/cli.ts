#!/usr/bin/env node
import { formatProblem, PactwrightError } from "./errors.js";
import {
  lifecycleNext,
  lifecycleStatus,
  type LineageStatus,
  type NextAction,
} from "./lifecycle/engine.js";
import { noExecutor, runLifecycle, type RunResult } from "./lifecycle/run.js";
import { recordStage } from "./lifecycle/record.js";
import type { StageName } from "./config/lifecycle.js";
import { loadContext, type DeliveryContext, type HistoryRecord } from "./context.js";
import { loadConfig, type PactwrightConfig } from "./config/config.js";
import { CORE_DELIVERY_SUITE } from "./eval/core-suite.js";
import { evalPassed, runEval, type EvalCaseResult, type EvalReport } from "./eval/runner.js";
import type { GraphNode } from "./graph/nodes.js";
import { initProject } from "./init.js";
import { loadProject } from "./loader.js";
import { resolvePack } from "./pack/resolve.js";
import { validateProject } from "./validate.js";
import { findProjectRoot, projectPaths } from "./project.js";
import { runtimeVersion } from "./version.js";

const HELP = `Usage: pactwright <command> [options]

Commands:
  init [--json]                              Create the Pactwright-owned core structure
                                             (.pactwright, specs, .claude directories) in the
                                             current directory and resolve the lock; existing
                                             paths are left untouched
  validate [--json]                          Validate the Delivery Graph and typed-edge store
  context <node-id> [--history] [--json]     Print the current core Delivery lineage of a node
  lifecycle status [--intent <id>] [--json]  Report stage, completed stages, gates and lineage
  lifecycle next   [--intent <id>] [--json]  Report the next permitted core Delivery action
  lifecycle run    [--intent <id>] [--json]  Run automatic stages until a gate, completion,
                                             a stage failure or a validation error
  lifecycle record <stage> --file <yaml>     Record the content of a graph-marking stage
                                             (capture-intent, approve-contract, write-brief,
                                             prepare-evidence) after the runtime checks the
                                             transition
  eval [--json]                              Run the core Delivery evaluation suite against
                                             the selected agent pack (deterministic assertions
                                             and semantic dimensions reported separately)

Options:
  -h, --help     Show this help
  -v, --version  Print the runtime version
`;

interface CommonOptions {
  readonly intent?: string;
  readonly json: boolean;
  readonly history: boolean;
  readonly file?: string;
  /** Positional arguments, in order. */
  readonly positional: readonly string[];
}

function parseOptions(
  args: readonly string[],
  allow: { intent?: boolean; history?: boolean; file?: boolean } = {},
): CommonOptions | string {
  let intent: string | undefined;
  let file: string | undefined;
  let json = false;
  let history = false;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === "--json") json = true;
    else if (arg === "--history" && allow.history === true) history = true;
    else if (arg === "--intent" && allow.intent === true) {
      intent = args[i + 1];
      if (intent === undefined || intent.startsWith("--")) return "--intent needs an intent id";
      i += 1;
    } else if (arg === "--file" && allow.file === true) {
      file = args[i + 1];
      if (file === undefined || file.startsWith("--")) return "--file needs a path";
      i += 1;
    } else if (arg.startsWith("--")) return `unknown option "${arg}"`;
    else positional.push(arg);
  }
  return {
    json,
    history,
    positional,
    ...(intent === undefined ? {} : { intent }),
    ...(file === undefined ? {} : { file }),
  };
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

function record(args: readonly string[]): number {
  const options = parseOptions(args, { file: true });
  if (
    typeof options === "string" ||
    options.positional.length !== 1 ||
    options.file === undefined
  ) {
    const why =
      typeof options === "string"
        ? options
        : options.positional.length === 0
          ? "record needs a <stage>"
          : options.positional.length > 1
            ? `unexpected argument "${options.positional[1]}"`
            : "record needs --file <yaml>";
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  try {
    const root = findProjectRoot();
    const result = recordStage(root, options.positional[0] as StageName, options.file);
    if (options.json) {
      const created = result.created.map((node) => ({ id: node.id, type: node.type }));
      out(`${JSON.stringify({ stage: result.stage, created }, null, 2)}\n`);
    } else {
      out(result.created.map((node) => `created ${node.type} ${node.id}\n`).join(""));
    }
    return 0;
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
}

async function lifecycle(sub: string | undefined, args: readonly string[]): Promise<number> {
  if (sub === "record") return record(args);
  const options = parseOptions(args, { intent: true });
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
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

function initCommand(args: readonly string[]): number {
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  // Init is the one command that must not search for an enclosing project:
  // it creates the project in the current directory.
  const report = initProject();
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const entry of report.entries) {
      out(
        entry.action === "created" ? `created ${entry.path}\n` : `skipped ${entry.path} (exists)\n`,
      );
    }
    if (report.problems.length > 0) {
      out("Validation problems:\n");
      for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
    }
  }
  return report.ok ? 0 : 1;
}

function validate(args: readonly string[]): number {
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  const report = validateProject();
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.ok) {
    const s = report.summary!;
    out(
      `Valid: ${s.nodes} nodes, ${s.edges} edges, ${s.lineages} lineages (revision ${s.revision})\n`,
    );
  } else {
    out("Validation problems:\n");
    for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
  }
  return report.ok ? 0 : 1;
}

function formatRecord(node: GraphNode, extra: string[] = []): string {
  const lines = [`## ${node.type} ${node.id}`, `title: ${node.title}`, `created: ${node.created}`];
  if (node.type === "decision") {
    lines.push(`decided_by: ${String(node.frontmatter["decided_by"])}`);
    lines.push(`outcome: ${String(node.frontmatter["outcome"])}`);
  }
  lines.push(...extra, "", node.body, "");
  return `${lines.join("\n")}\n`;
}

function formatHistory(record: HistoryRecord): string {
  const by = record.supersededBy.length === 0 ? "none" : record.supersededBy.join(", ");
  return formatRecord(record.node, [`superseded by: ${by}`]);
}

function formatContext(context: DeliveryContext): string {
  const parts: string[] = [`# Delivery context for ${context.requested}`, ""];
  parts.push(`intent: ${context.intent}`, `state: ${context.state}`);
  if (!context.requestedIsCurrent) {
    parts.push(`note: ${context.requested} is superseded; the current lineage is shown`);
  }
  parts.push("", ...context.lineage.map((node) => formatRecord(node)));
  if (context.history !== undefined) {
    parts.push("# History (superseded records)", "");
    parts.push(
      context.history.length === 0 ? "none\n" : context.history.map(formatHistory).join(""),
    );
  }
  return `${parts.join("\n")}`;
}

function formatEvalCase(entry: EvalCaseResult): string {
  const lines: string[] = [];
  const agent = entry.agent === undefined ? "" : ` (agent: ${entry.agent})`;
  lines.push(`${entry.id} — ${entry.title}`);
  lines.push(`  capability: ${entry.capability}${agent}`);
  if (entry.error !== undefined) lines.push(`  error: ${entry.error}`);
  if (entry.deterministic.length > 0) {
    lines.push("  deterministic:");
    for (const assertion of entry.deterministic) {
      lines.push(`    ${assertion.passed ? "pass" : "FAIL"}  ${assertion.id}: ${assertion.detail}`);
    }
  }
  if (entry.semantic.length > 0) {
    lines.push("  semantic (requires judgement; reported separately, never auto-scored):");
    for (const dimension of entry.semantic) {
      lines.push(
        dimension.judged
          ? `    judged    ${dimension.id}: ${dimension.verdict}${dimension.rationale === undefined ? "" : ` — ${dimension.rationale}`}`
          : `    unjudged  ${dimension.id}: ${dimension.reason}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function formatEvalReport(report: EvalReport): string {
  const assertions = report.cases.flatMap((entry) => entry.deterministic);
  const failed = assertions.filter((assertion) => !assertion.passed).length;
  const dimensions = report.cases.flatMap((entry) => entry.semantic);
  const judged = dimensions.filter((dimension) => dimension.judged).length;
  const errors = report.cases.filter((entry) => entry.error !== undefined).length;
  return [
    `Evaluating ${report.pack.name}@${report.pack.version} (runtime ${report.runtime}, suite ${report.suite})`,
    "",
    ...report.cases.map(formatEvalCase),
    `Deterministic assertions: ${assertions.length - failed} passed, ${failed} failed${errors === 0 ? "" : `; ${errors} case(s) not evaluated`}.`,
    `Semantic dimensions: ${judged} judged, ${dimensions.length - judged} unjudged. No aggregate quality score is calculated.`,
    "",
  ].join("\n");
}

/**
 * `pactwright eval` runs inside or outside a project: inside one it
 * evaluates the configured pack; outside it evaluates the default
 * `@pactwright/standard` pack, since evaluation is independent from any
 * project's Delivery (Distribution §16).
 */
async function evalCommand(args: readonly string[]): Promise<number> {
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  let config: PactwrightConfig;
  try {
    root = findProjectRoot();
    const loaded = loadConfig(projectPaths(root).config);
    if (loaded.value === undefined) {
      printProblems(PactwrightError.fromProblems("invalid-config", loaded.problems), options.json);
      return 1;
    }
    config = loaded.value;
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    root = process.cwd();
    config = {
      version: 1,
      agentPack: { source: "@pactwright/standard" },
      adapter: { type: "claude-code" },
      extensions: {},
      github: { enabled: false },
    };
  }
  const resolved = resolvePack({ root, config });
  if (resolved.value === undefined) {
    printProblems(PactwrightError.fromProblems("pack-unresolved", resolved.problems), options.json);
    return 1;
  }
  const report = await runEval({ pack: resolved.value, suite: CORE_DELIVERY_SUITE });
  out(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatEvalReport(report));
  return evalPassed(report) ? 0 : 1;
}

function contextCommand(args: readonly string[]): number {
  const options = parseOptions(args, { history: true });
  if (typeof options === "string" || options.positional.length !== 1) {
    const why =
      typeof options === "string"
        ? options
        : options.positional.length === 0
          ? "context needs a <node-id>"
          : `unexpected argument "${options.positional[1]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  try {
    const context = loadContext(loadProject(), options.positional[0]!, {
      history: options.history,
    });
    out(options.json ? `${JSON.stringify(context, null, 2)}\n` : formatContext(context));
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
  if (first === "init") return initCommand(rest);
  if (first === "lifecycle") return lifecycle(rest[0], rest.slice(1));
  if (first === "validate") return validate(rest);
  if (first === "context") return contextCommand(rest);
  if (first === "eval") return evalCommand(rest);
  err(`pactwright: unknown command "${first}"\n\n${HELP}`);
  return 1;
}

process.exitCode = await main(process.argv.slice(2));
