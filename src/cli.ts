#!/usr/bin/env node
import { rmSync } from "node:fs";
import { formatProblem, PactwrightError, type Problem } from "./errors.js";
import {
  lifecycleNext,
  lifecycleStatus,
  type LineageStatus,
  type NextAction,
} from "./lifecycle/engine.js";
import { noExecutor, runLifecycle, type RunResult } from "./lifecycle/run.js";
import { lifecycleExecutor, selectExecutor } from "./execute/select.js";
import { recordStage } from "./lifecycle/record.js";
import { loadContext, type DeliveryContext, type HistoryRecord } from "./context.js";
import { loadConfig, type PactwrightConfig } from "./config/config.js";
import { CORE_DELIVERY_SUITE } from "./eval/core-suite.js";
import { evalPassed, runEval, type EvalCaseResult, type EvalReport } from "./eval/runner.js";
import { compareEvalReports, formatComparison } from "./eval/compare.js";
import { acquireSide, type AcquiredPack } from "./eval/acquire.js";
import type { CandidateRunner } from "./eval/case.js";
import type { GraphNode } from "./graph/nodes.js";
import {
  addExtension,
  removeExtension,
  upgradeExtension,
  type ExtensionChangeReport,
} from "./extension/manage.js";
import { doctor, formatDoctor } from "./doctor.js";
import { finishUpgrade, upgradeRuntime } from "./upgrade.js";
import { initProject } from "./init.js";
import { syncProject } from "./sync.js";
import { loadProject } from "./loader.js";
import { resolvePack, type ResolvedPack } from "./pack/resolve.js";
import { upgradeAgentPack, useAgentPack, type PackChangeReport } from "./pack/select.js";
import { validateProject } from "./validate.js";
import { findProjectRoot, projectPaths } from "./project.js";
import { runtimeVersion } from "./version.js";

const HELP = `Usage: pactwright <command> [options]

Commands:
  init [--agent-pack <source>] [--with <id>] Create the Pactwright-owned core structure
       [--json]                              (.pactwright, specs, .claude directories) in the
                                             current directory; existing paths are left
                                             untouched. Without --agent-pack this is a scaffold
                                             and no pack is selected. With it, one-shot setup
                                             composes pack selection, any --with extensions and
                                             sync -- the same operations as doing them apart
  sync [--json]                              Render the Pactwright-managed .claude/ adapter
                                             surface from config + lock (deterministic; only
                                             files carrying the Pactwright banner are written
                                             or removed, so user-authored files are kept)
  upgrade [--to <version>] [--json]          Upgrade the Pactwright runtime: detect the project
                                             package manager, delegate package replacement to it,
                                             then re-enter through the new runtime to migrate,
                                             re-lock, sync and validate. --to takes an exact
                                             release for a forward upgrade or a rollback
  doctor [--json]                            Read-only diagnostics of the distribution and
                                             execution environment; reports healthy, warning
                                             or action required and names the deterministic
                                             remediation, never running it
  validate [--json]                          Validate the Delivery Graph and typed-edge store
  context <node-id> [--history] [--json]     Print the current core Delivery lineage of a node
  lifecycle status [--intent <id>] [--json]  Report the current action, completed
                                             responsibilities and shape steps, gates,
                                             validation problems and the current lineage
  lifecycle next   [--intent <id>] [--json]  Report the next permitted lifecycle action
  lifecycle run    [--intent <id>] [--json]  Run automatic actions until a gate, completion,
                                             a block, an execution failure or a validation error
  lifecycle record <command> --file <yaml>   Record the content of a graph-marking command
                                             (capture-intent, approve-contract, write-brief,
                                             prepare-evidence) after the runtime checks the
                                             transition, the result of an execution step
                                             (delivery, review) as execution provenance, or
                                             an authorised gate resolution (gate)
  agent-pack use <source> [--json]           Select an agent pack explicitly: resolve it,
                                             validate every required capability, then update
                                             config, lock and the generated environment
  agent-pack upgrade [--json]                Re-resolve the selected pack within its configured
                                             constraint, without changing pack identity
  extension add <id|package> [--json]        Enable an extension (and its dependencies),
                                             validate the capability union and update
                                             config and lock
  extension remove <id> [--json]             Disable and remove an extension; blocked while
                                             enabled extensions depend on it, and canonical
                                             extension data is preserved
  extension upgrade <id> [--json]            Re-resolve an extension and update the lock
  eval [--json]                              Run the core Delivery evaluation suite against
                                             the selected agent pack (deterministic assertions
                                             and semantic dimensions reported separately)
  eval --baseline <pack> --candidate <pack>  Compare a candidate against a released baseline and
       [--json]                              report regressions per capability, agent and case;
                                             no aggregate score is computed

Options:
  -h, --help     Show this help
  -v, --version  Print the runtime version
`;

interface CommonOptions {
  readonly intent?: string;
  readonly json: boolean;
  readonly history: boolean;
  readonly file?: string;
  /** Explicit Agent Pack source for one-shot `init`. */
  readonly agentPack?: string;
  /** Extension ids to install as part of one-shot `init`. */
  readonly withExtensions?: readonly string[];
  /** Explicit `upgrade --to` target. */
  readonly to?: string;
  /** `eval --baseline`: the released pack or baseline to compare against. */
  readonly baseline?: string;
  /** `eval --candidate`: the pack or environment under evaluation. */
  readonly candidate?: string;
  /** `upgrade --finish`: the half the newly installed runtime runs. */
  readonly finish: boolean;
  /** Positional arguments, in order. */
  readonly positional: readonly string[];
}

function parseOptions(
  args: readonly string[],
  allow: {
    intent?: boolean;
    history?: boolean;
    file?: boolean;
    agentPack?: boolean;
    with?: boolean;
    to?: boolean;
    finish?: boolean;
    baseline?: boolean;
    candidate?: boolean;
  } = {},
): CommonOptions | string {
  let intent: string | undefined;
  let file: string | undefined;
  let agentPack: string | undefined;
  let to: string | undefined;
  let baseline: string | undefined;
  let candidate: string | undefined;
  let finish = false;
  const withExtensions: string[] = [];
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
    } else if (arg === "--baseline" && allow.baseline === true) {
      baseline = args[i + 1];
      if (baseline === undefined || baseline.startsWith("--")) {
        return "--baseline needs a released pack or baseline";
      }
      i += 1;
    } else if (arg === "--candidate" && allow.candidate === true) {
      candidate = args[i + 1];
      if (candidate === undefined || candidate.startsWith("--")) {
        return "--candidate needs a pack or environment";
      }
      i += 1;
    } else if (arg === "--to" && allow.to === true) {
      to = args[i + 1];
      if (to === undefined || to.startsWith("--")) return "--to needs a version";
      i += 1;
    } else if (arg === "--finish" && allow.finish === true) {
      finish = true;
    } else if (arg === "--agent-pack" && allow.agentPack === true) {
      agentPack = args[i + 1];
      if (agentPack === undefined || agentPack.startsWith("--")) {
        return "--agent-pack needs a pack source";
      }
      i += 1;
    } else if (arg === "--with" && allow.with === true) {
      const id = args[i + 1];
      if (id === undefined || id.startsWith("--")) return "--with needs an extension id";
      withExtensions.push(id);
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
    ...(agentPack === undefined ? {} : { agentPack }),
    ...(withExtensions.length === 0 ? {} : { withExtensions }),
    ...(to === undefined ? {} : { to }),
    ...(baseline === undefined ? {} : { baseline }),
    ...(candidate === undefined ? {} : { candidate }),
    finish,
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
  const current =
    entry.current === undefined
      ? "none (Delivery lifecycle complete or terminal)"
      : `${entry.current.name} (${entry.current.kind})`;
  lines.push(`  current: ${current}`);
  lines.push(
    `  completed responsibilities: ${entry.completedResponsibilities.length === 0 ? "none" : entry.completedResponsibilities.join(", ")}`,
  );
  if (entry.shape !== undefined) {
    lines.push(`  shape: ${entry.shape} (${entry.executionStatus ?? "running"})`);
    lines.push(
      `  steps visited: ${entry.visited.length === 0 ? "none" : entry.visited.join(", ")}`,
    );
  }
  // The one list `lifecycle record` checks against, printed so an agent can
  // act on what is permitted rather than infer it (design §12).
  lines.push(
    `  permitted: ${
      entry.permitted.length === 0
        ? "none"
        : entry.permitted
            .map((op) => (op.mode === "supersede" ? `${op.stage} (supersede)` : op.stage))
            .join(", ")
    }`,
  );
  if (entry.blocked !== undefined) {
    lines.push(`  blocked: ${entry.blocked} (required actor: ${entry.requiredActor})`);
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

function formatStatusProblems(problems: readonly Problem[]): string {
  if (problems.length === 0) return "Validation problems: none\n";
  return `Validation problems:\n${problems.map((problem) => `  - ${formatProblem(problem)}\n`).join("")}`;
}

function formatNext(action: NextAction): string {
  const who = action.intent === undefined ? "No active lineage" : `Intent: ${action.intent}`;
  const next =
    action.action === undefined
      ? "next: none"
      : `next: ${action.action.name} (${action.action.kind}, ${action.action.execution}${action.action.actor ? `, actor ${action.action.actor}` : ""}${action.gate ? ", human gate" : ""})`;
  return `${who}\n  ${next}\n  ${action.reason}\n`;
}

function formatRun(result: RunResult): string {
  const lines: string[] = [];
  lines.push(result.intent === undefined ? "No active lineage" : `Intent: ${result.intent}`);
  lines.push(`  executed: ${result.executed.length === 0 ? "none" : result.executed.join(", ")}`);
  switch (result.stop) {
    case "completed":
      lines.push("  stopped: lifecycle complete or no automatic action to run");
      break;
    case "human-gate":
      lines.push(
        `  stopped: human gate at ${result.action} (required actor: ${result.requiredActor})`,
      );
      break;
    case "stage-failed":
      lines.push(`  stopped: ${result.action} failed: ${result.message}`);
      break;
    case "blocked":
      lines.push(`  stopped: blocked at ${result.action}: ${result.message}`);
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
    const result = recordStage(root, options.positional[0]!, options.file);
    if (options.json) {
      const created = result.created.map((node) => ({ id: node.id, type: node.type }));
      out(
        `${JSON.stringify({ stage: result.stage, created, ...(result.advanced === undefined ? {} : { advanced: result.advanced }) }, null, 2)}\n`,
      );
    } else {
      out(result.created.map((node) => `created ${node.type} ${node.id}\n`).join(""));
      if (result.advanced !== undefined) {
        const { brief, status, nextStep } = result.advanced;
        out(
          `recorded ${result.stage} for brief ${brief}; run is ${status}${nextStep === undefined ? "" : ` at ${nextStep}`}\n`,
        );
      }
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
    // The executor the project declares (Distribution §3). Absent
    // configuration means `none`, which refuses rather than pretending the
    // responsibility was discharged; the CLI used to hard-wire that refusal
    // so no project could ever execute.
    let execute = noExecutor;
    try {
      execute = lifecycleExecutor(selectExecutor(loadProject({ root }).config));
    } catch (error) {
      // An unloadable project is reported by `runLifecycle` itself as a
      // validation-error stop, with every problem in one pass.
      if (!(error instanceof PactwrightError)) throw error;
    }
    const results = await runLifecycle({
      root,
      execute,
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
          : `${status.lineages.map(formatStatus).join("")}${formatStatusProblems(status.problems)}`,
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
  const options = parseOptions(args, { agentPack: true, with: true });
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  // Init is the one command that must not search for an enclosing project:
  // it creates the project in the current directory.
  const report = initProject(process.cwd(), {
    ...(options.agentPack === undefined ? {} : { agentPack: options.agentPack }),
    ...(options.withExtensions === undefined ? {} : { withExtensions: options.withExtensions }),
  });
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const entry of report.entries) {
      out(
        entry.action === "created" ? `created ${entry.path}\n` : `skipped ${entry.path} (exists)\n`,
      );
    }
    if (report.scaffold === true) {
      out(
        "\nScaffold created. No agent pack is selected, so this is not yet a complete\n" +
          "execution environment. Choose one: pactwright agent-pack use <source>\n",
      );
    }
    if (report.problems.length > 0) {
      out("Validation problems:\n");
      for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
    }
  }
  return report.ok ? 0 : 1;
}

function formatExtensionReport(report: ExtensionChangeReport): string {
  const lines: string[] = [];
  for (const change of report.changes) {
    const version =
      change.action === "upgraded" && change.previousVersion !== undefined
        ? ` ${change.previousVersion} → ${change.version ?? "?"}`
        : change.version !== undefined
          ? ` ${change.version}`
          : "";
    lines.push(`${change.action} ${change.id}${version}`);
  }
  for (const profile of report.githubProfiles) {
    lines.push(`github profile "${profile}" requires provisioning (not performed: deferred)`);
  }
  if (report.preserved.length > 0) {
    lines.push("preserved canonical extension data (delete separately if unwanted):");
    for (const path of report.preserved) lines.push(`  - ${path}`);
  }
  return lines.map((line) => `${line}\n`).join("");
}

const EXTENSION_OPERATIONS = {
  add: addExtension,
  remove: removeExtension,
  upgrade: upgradeExtension,
} as const;

function extensionOperation(
  sub: string | undefined,
): (typeof EXTENSION_OPERATIONS)[keyof typeof EXTENSION_OPERATIONS] | undefined {
  // `Object.hasOwn`, not a bare lookup: `sub` is user input, and an inherited
  // member like "constructor" would otherwise pass an `=== undefined` guard
  // and be called as if it were an extension operation.
  return sub !== undefined && Object.hasOwn(EXTENSION_OPERATIONS, sub)
    ? EXTENSION_OPERATIONS[sub as keyof typeof EXTENSION_OPERATIONS]
    : undefined;
}

function extensionCommand(sub: string | undefined, args: readonly string[]): number {
  // The verb is checked before the arguments, so an unknown verb is named as
  // such rather than being reported as a missing extension id.
  const operation = extensionOperation(sub);
  if (operation === undefined) {
    err(`pactwright: unknown extension command "${sub ?? ""}"\n\n${HELP}`);
    return 1;
  }
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length !== 1) {
    const why =
      typeof options === "string"
        ? options
        : options.positional.length === 0
          ? `extension ${sub} needs an extension id`
          : `unexpected argument "${options.positional[1]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  try {
    root = findProjectRoot();
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
  const report = operation(root, options.positional[0]!);
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    out(formatExtensionReport(report));
    if (report.problems.length > 0) {
      // A successful command can still carry an advisory, so the heading
      // follows the outcome rather than the presence of problems.
      out(report.ok ? "Notes:\n" : "Validation problems:\n");
      for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
    }
  }
  return report.ok ? 0 : 1;
}

function formatPackReport(report: PackChangeReport): string {
  const lines: string[] = [];
  if (report.selected !== undefined) {
    lines.push(
      report.unchanged
        ? `unchanged: ${report.selected.name}@${report.selected.version} is already selected\n`
        : `selected ${report.selected.name}@${report.selected.version}\n`,
    );
    if (report.previous !== undefined) {
      lines.push(`  was ${report.previous.name}@${report.previous.version}\n`);
    }
    if (report.constraintChanged === true) {
      lines.push(`  configured constraint updated\n`);
    }
  }
  for (const file of report.synced) lines.push(`  wrote ${file}\n`);
  for (const note of report.reconciliation) lines.push(`  reconcile: ${note}\n`);
  return lines.join("");
}

function agentPackCommand(sub: string | undefined, args: readonly string[]): number {
  if (sub !== "use" && sub !== "upgrade") {
    err(`pactwright: unknown agent-pack command "${sub ?? ""}"\n\n${HELP}`);
    return 1;
  }
  const options = parseOptions(args);
  const expected = sub === "use" ? 1 : 0;
  if (typeof options === "string" || options.positional.length !== expected) {
    const why =
      typeof options === "string"
        ? options
        : sub === "use" && options.positional.length === 0
          ? "agent-pack use needs a pack source"
          : `unexpected argument "${options.positional[expected]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  try {
    root = findProjectRoot();
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
  const report =
    sub === "use" ? useAgentPack(root, options.positional[0]!) : upgradeAgentPack(root);
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    out(formatPackReport(report));
    if (report.problems.length > 0) {
      out("Validation problems:\n");
      for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
    }
  }
  return report.ok ? 0 : 1;
}

function upgradeCommand(args: readonly string[]): number {
  const options = parseOptions(args, { to: true, finish: true });
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  try {
    root = findProjectRoot();
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
  // `--finish` is the half the *newly installed* runtime runs; it is not a
  // user-facing operation, which is why the help does not advertise it.
  const report = options.finish
    ? finishUpgrade(root)
    : upgradeRuntime(root, options.to === undefined ? {} : { to: options.to });
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    if (report.ok) {
      out(
        report.unchanged
          ? `unchanged: runtime ${report.from} is already the target\n`
          : `upgraded runtime ${report.from} -> ${report.to}${report.manager === undefined ? "" : ` via ${report.manager}`}\n`,
      );
      for (const migration of report.migrations) out(`  migrated ${migration}\n`);
      for (const file of report.synced) out(`  wrote ${file}\n`);
    } else {
      if (report.restored === true) {
        out("upgrade failed; the previous environment was restored\n");
      }
      out("Problems:\n");
      for (const problem of report.problems) out(`  - ${formatProblem(problem)}\n`);
    }
  }
  return report.ok ? 0 : 1;
}

function doctorCommand(args: readonly string[]): number {
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  try {
    root = findProjectRoot();
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
  const report = doctor(root);
  out(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatDoctor(report));
  // A warning is information, not a failure; only action-required exits 1.
  return report.status === "action-required" ? 1 : 0;
}

function syncCommand(args: readonly string[]): number {
  const options = parseOptions(args);
  if (typeof options === "string" || options.positional.length > 0) {
    const why =
      typeof options === "string" ? options : `unexpected argument "${options.positional[0]}"`;
    err(`pactwright: ${why}\n\n${HELP}`);
    return 1;
  }
  let root: string;
  try {
    root = findProjectRoot();
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    printProblems(error, options.json);
    return 1;
  }
  const report = syncProject(root);
  if (options.json) {
    out(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const path of report.changed) out(`wrote ${path}\n`);
    for (const path of report.unchanged) out(`unchanged ${path}\n`);
    for (const path of report.removed) out(`removed ${path}\n`);
    for (const path of report.kept) out(`kept ${path} (not pactwright-generated)\n`);
    for (const path of report.conflicts) out(`conflict ${path} (not pactwright-generated)\n`);
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
      [
        `Valid: ${s.nodes} nodes, ${s.edges} edges, ${s.lineages} lineages\n`,
        `  repository_revision:   ${s.repositoryRevision}\n`,
        `  project_graph_revision: ${s.revision}\n`,
        `  environment_lock_hash: ${s.environmentLockHash}\n`,
      ].join(""),
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
async function evalCompare(
  root: string,
  baselineSource: string,
  candidateSource: string,
  json: boolean,
): Promise<number> {
  const sides: Array<[string, string]> = [
    ["baseline", baselineSource],
    ["candidate", candidateSource],
  ];
  // Each side is acquired into its own project at its exact version, never
  // resolved from the caller's `node_modules`. Resolving both sides locally
  // made `@pactwright/standard@0.0.1` resolve to the installed `0.0.2` and
  // then fail version matching, so the published comparison command could not
  // run at all.
  const acquired: AcquiredPack[] = [];
  const cleanUp = (): void => {
    for (const side of acquired) rmSync(side.root, { recursive: true, force: true });
  };
  for (const [which, source] of sides) {
    const side = acquireSide({ spec: source });
    if (Array.isArray(side)) {
      err(`pactwright: could not acquire the ${which} "${source}"\n`);
      printProblems(PactwrightError.fromProblems("pack-unacquired", side), json);
      cleanUp();
      return 1;
    }
    acquired.push(side as AcquiredPack);
  }
  const [baselinePack, candidatePack] = acquired.map((side) => side.pack) as [
    ResolvedPack,
    ResolvedPack,
  ];
  try {
    // Both sides are evaluated by the same configured executor, so a
    // comparison measures the packs rather than the harness.
    const runner = evalRunner(root);
    const baseline = await runEval({ pack: baselinePack, suite: CORE_DELIVERY_SUITE, ...runner });
    const candidate = await runEval({ pack: candidatePack, suite: CORE_DELIVERY_SUITE, ...runner });
    const comparison = compareEvalReports({
      baseline,
      candidate,
      baselineEnvironment: {
        agents: baselinePack.hashes.agents,
        skills: baselinePack.hashes.skills,
      },
      candidateEnvironment: {
        agents: candidatePack.hashes.agents,
        skills: candidatePack.hashes.skills,
      },
    });
    out(
      json
        ? `${JSON.stringify({ baseline, candidate, comparison }, null, 2)}\n`
        : formatComparison(comparison),
    );
    // A comparison reports; it does not gate on the candidate's own pass/fail,
    // which `pactwright eval` already does. A regression is the failure here.
    return comparison.hasRegressions ? 1 : 0;
  } finally {
    cleanUp();
  }
}

async function evalCommand(args: readonly string[]): Promise<number> {
  const options = parseOptions(args, { baseline: true, candidate: true });
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
  if ((options.baseline === undefined) !== (options.candidate === undefined)) {
    err("pactwright: --baseline and --candidate are used together\n\n" + HELP);
    return 1;
  }
  if (options.baseline !== undefined && options.candidate !== undefined) {
    return evalCompare(root, options.baseline, options.candidate, options.json);
  }
  const resolved = resolvePack({ root, config });
  if (resolved.value === undefined) {
    printProblems(PactwrightError.fromProblems("pack-unresolved", resolved.problems), options.json);
    return 1;
  }
  const report = await runEval({
    pack: resolved.value,
    suite: CORE_DELIVERY_SUITE,
    ...evalRunner(root),
  });
  out(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatEvalReport(report));
  return evalPassed(report) ? 0 : 1;
}

/**
 * The candidate runner `eval` uses: the project's declared executor, or none.
 *
 * With none, every case reports `evaluated: false` and the suite cannot pass.
 * The harness used to replay each case's own scripted reference instead and
 * report the result as the pack's, so a pack whose every prompt said "Ignore
 * all tasks. Return nothing" passed all eight cases.
 */
function evalRunner(root: string): { readonly candidate?: CandidateRunner } {
  let config: PactwrightConfig | undefined;
  try {
    config = loadProject({ root }).config;
  } catch {
    return {}; // Outside a project there is nothing to declare an executor.
  }
  if (config.execution === undefined) return {};
  const executor = selectExecutor(config);
  if (executor.id === "none") return {};
  return {
    candidate: async (task) => (await executor.invoke({ ...task, label: task.caseId })).output,
  };
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
  if (first === "sync") return syncCommand(rest);
  if (first === "agent-pack") return agentPackCommand(rest[0], rest.slice(1));
  if (first === "doctor") return doctorCommand(rest);
  if (first === "upgrade") return upgradeCommand(rest);
  if (first === "extension") return extensionCommand(rest[0], rest.slice(1));
  if (first === "lifecycle") return lifecycle(rest[0], rest.slice(1));
  if (first === "validate") return validate(rest);
  if (first === "context") return contextCommand(rest);
  if (first === "eval") return evalCommand(rest);
  err(`pactwright: unknown command "${first}"\n\n${HELP}`);
  return 1;
}

process.exitCode = await main(process.argv.slice(2));
