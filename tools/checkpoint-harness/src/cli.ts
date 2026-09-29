// Checkpoint harness command line (Task 3 research log §11).
//
// Usage: checkpoint-harness plan --config FILE
// Prints the prepared run as deterministic JSON and exits 0. Invalid
// configuration or definitions print file/ID: cause diagnostics and exit 2.
// Exit 0 means only that planning succeeded; it grants no acceptance. The
// repository is the Git working tree containing the current directory.
//
// Usage: checkpoint-harness status --run DIR
// Prints facts derived from the run directory's valid records as JSON and
// exits 0. It writes nothing. A missing or corrupt run prints file: cause
// diagnostics and exits 2.
//
// Usage: checkpoint-harness run --config FILE
//        checkpoint-harness resume --run DIR
// `run` admits the configuration, creates a run directory under
// workspace.controller_root and runs the selection; `resume` continues a
// stopped or crashed run from its last valid event. Each prints its result
// as JSON and exits 0 only when the selection is accepted, 2 when admission
// is invalid and 3 when the run stops unaccepted, with its reasons. Progress
// events go to stderr. SIGINT or SIGTERM cancels the run resumably.
//
// Usage: checkpoint-harness approve --run DIR --request ID [--deny]
// The operator channel: records the operator account's decision on one
// approval request of a paused run. Exits 0 when recorded and 2 when refused.
//
// Usage: checkpoint-harness amend --run DIR --config FILE --reason TEXT
// Records the operator account's amendment of a paused run's configuration,
// with the reason and each old and new value; `resume` then continues under
// it. Exits 0 when recorded and 2 when refused.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";

import { Command, CommanderError } from "commander";
import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { prepareRun } from "./contracts.js";
import { readRun, runStatus } from "./evidence.js";
import {
  amendRun,
  approveRequest,
  containedProducer,
  exitCode,
  harnessIdentity,
  resumeRun,
  startRun,
  stateTrace,
  type RunnerDeps,
  type RunResult,
} from "./runner.js";
import { BINDINGS, createRegistry } from "./software-bootstrap.js";
import { containedWorkspaces } from "./verification.js";
import { fenceWorkers } from "./workspace.js";

const INVALID = 2;
const UNACCEPTED = 3;

const repoRoot = (): string =>
  execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();

const firstLine = (e: unknown): string =>
  e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e);

async function plan(configFile: string): Promise<number> {
  let config: unknown;
  try {
    config = yaml.load(readFileSync(configFile, "utf8"));
  } catch (e) {
    console.error(`${configFile}: ${firstLine(e)}`);
    return INVALID;
  }
  const result = await prepareRun(config, { repoRoot: repoRoot(), configName: configFile });
  if (!result.ok) {
    for (const d of result.diagnostics) console.error(d);
    return INVALID;
  }
  process.stdout.write(`${stringify(result.plan, null, 2)}\n`);
  return 0;
}

function status(dir: string): number {
  const result = runStatus(dir);
  const read = readRun(dir);
  if (!result.ok || !read.ok) {
    for (const d of result.ok ? [] : result.diagnostics) console.error(d);
    return INVALID;
  }
  const { events } = read.records;
  const last = events.filter((e) => e.action !== "owner" && e.action !== "released").at(-1);
  const runner = {
    state: stateTrace(events).at(-1) ?? null,
    pause: last?.action === "pause" ? last.data : null,
  };
  process.stdout.write(`${stringify({ ...result.status, runner }, null, 2)}\n`);
  return 0;
}

/** The production boundaries: B's containment, the SDK provider and no effect service. */
function productionDeps(signal: AbortSignal): RunnerDeps {
  const root = repoRoot();
  const registry = createRegistry(BINDINGS);
  if (!registry.ok) throw new Error(registry.diagnostics.join("\n"));
  return {
    repoRoot: root,
    skillsRoot: join(root, ".claude/skills"),
    env: process.env,
    registry: registry.registry,
    harness: harnessIdentity(),
    workspaces: (run, candidateRoot) => ({
      producer: containedProducer(run, candidateRoot),
      verifier: containedWorkspaces(run, candidateRoot),
      reviewer: containedWorkspaces(run, candidateRoot),
    }),
    effects: null,
    fence: fenceWorkers,
    signal,
    progress: (e) =>
      process.stderr.write(
        `${stringify({ seq: e.seq, action: e.action, step: e.data.step ?? null, attempt: e.attempt })}\n`,
      ),
  };
}

/** Runs `drive` with SIGINT and SIGTERM cancelling it, and reports its result. */
async function drive(go: (deps: RunnerDeps) => Promise<RunResult>): Promise<number> {
  const abort = new AbortController();
  const cancel = (): void => abort.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  let result: RunResult;
  try {
    result = await go(productionDeps(abort.signal));
  } catch (e) {
    // The run stays owned by this stopped controller; resume recovers it.
    const failure = { outcome: "failed", reasons: [{ code: "error", detail: firstLine(e) }] };
    process.stdout.write(`${stringify(failure, null, 2)}\n`);
    return UNACCEPTED;
  } finally {
    process.off("SIGINT", cancel);
    process.off("SIGTERM", cancel);
  }
  process.stdout.write(`${stringify(result, null, 2)}\n`);
  if (result.outcome === "invalid") for (const d of result.diagnostics) console.error(d);
  return exitCode(result);
}

async function run(configFile: string): Promise<number> {
  let config: unknown;
  try {
    config = yaml.load(readFileSync(configFile, "utf8"));
  } catch (e) {
    const diagnostics = [`${configFile}: ${firstLine(e)}`];
    process.stdout.write(`${stringify({ outcome: "invalid", diagnostics }, null, 2)}\n`);
    console.error(diagnostics[0]);
    return INVALID;
  }
  return drive((deps) => startRun(config, deps, { configName: configFile }));
}

/** Runs an operator record: 0 when recorded, 2 when refused or failed. */
async function operator(
  record: (actor: string) => Promise<{ ok: true } | { ok: false; diagnostics: string[] }>,
): Promise<number> {
  const actor = userInfo().username;
  let result: { ok: true } | { ok: false; diagnostics: string[] };
  try {
    result = await record(actor);
  } catch (e) {
    result = { ok: false, diagnostics: [firstLine(e)] };
  }
  process.stdout.write(`${stringify({ actor, ...result }, null, 2)}\n`);
  if (!result.ok) for (const d of result.diagnostics) console.error(d);
  return result.ok ? 0 : INVALID;
}

const approve = (dir: string, request: string, deny: boolean): Promise<number> =>
  operator((actor) =>
    approveRequest(dir, { request, decision: deny ? "denied" : "approved", actor }),
  );

const amend = (dir: string, configFile: string, reason: string): Promise<number> =>
  operator((actor) => {
    const root = repoRoot();
    const config: unknown = yaml.load(readFileSync(configFile, "utf8"));
    return amendRun(
      dir,
      { config, reason, actor },
      { repoRoot: root, skillsRoot: join(root, ".claude/skills"), env: process.env },
    );
  });

const program = new Command()
  .name("checkpoint-harness")
  .description("Bootstrap checkpoint harness (Spec 00 T3).")
  .exitOverride();

program
  .command("plan")
  .description("Validate the run configuration and definitions, and print the prepared run.")
  .requiredOption("--config <file>", "run configuration YAML")
  .action(async ({ config }: { config: string }) => {
    process.exitCode = await plan(config);
  });

program
  .command("status")
  .description("Print facts derived from a run directory's valid records; writes nothing.")
  .requiredOption("--run <dir>", "run directory")
  .action(({ run }: { run: string }) => {
    process.exitCode = status(run);
  });

program
  .command("run")
  .description("Start a run of the configured selection.")
  .requiredOption("--config <file>", "run configuration YAML")
  .action(async ({ config }: { config: string }) => {
    process.exitCode = await run(config);
  });

program
  .command("resume")
  .description("Continue a stopped or crashed run from its last valid event.")
  .requiredOption("--run <dir>", "run directory")
  .action(async ({ run }: { run: string }) => {
    process.exitCode = await drive((deps) => resumeRun(run, deps));
  });

program
  .command("approve")
  .description("Record the operator's decision on one approval request of a paused run.")
  .requiredOption("--run <dir>", "run directory")
  .requiredOption("--request <id>", "approval request ID (sha256:…)")
  .option("--deny", "deny instead of approve")
  .action(async ({ run, request, deny }: { run: string; request: string; deny?: boolean }) => {
    process.exitCode = await approve(run, request, deny === true);
  });

program
  .command("amend")
  .description("Amend a paused run's configuration, recording the reason and each change.")
  .requiredOption("--run <dir>", "run directory")
  .requiredOption("--config <file>", "the amended run configuration YAML")
  .requiredOption("--reason <text>", "why the configuration changes")
  .action(async ({ run, config, reason }: { run: string; config: string; reason: string }) => {
    process.exitCode = await amend(run, config, reason);
  });

try {
  await program.parseAsync(process.argv);
} catch (e) {
  if (!(e instanceof CommanderError)) throw e;
  process.exitCode = e.exitCode === 0 ? 0 : INVALID;
}
