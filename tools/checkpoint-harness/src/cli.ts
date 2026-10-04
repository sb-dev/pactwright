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
//
// Usage: checkpoint-harness workflow prepare|route|controller|effects
// One job of the Checkpoint harness workflow (T3.5 H3). Inputs come from
// HARNESS_* environment variables, never the command line, and the GitHub
// context from the Actions environment. `prepare` prints the controller
// commit the run is pinned to; the others restore the run's saved state, act,
// save and write the step summary and the job outputs `next` and
// `dispatch_ref`. Exits 0 for an orderly stop and 2 for a refusal.

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";

import { Command, CommanderError } from "commander";
import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { prepareRun } from "./contracts.js";
import { readRun, runStatus } from "./evidence.js";
import {
  branchHead,
  githubApi,
  githubEffects,
  githubFeedback,
  githubLiveness,
  githubStore,
  pullsFrom,
} from "./github.js";
import {
  amendRun,
  approveRequest,
  containedProducer,
  exitCode,
  harnessIdentity,
  resumeRun,
  runFacts,
  startRun,
  stateTrace,
  type RunnerDeps,
  type RunResult,
} from "./runner.js";
import { APPLICABILITY, BINDINGS, createRegistry, FIXTURE_BINDINGS } from "./software-bootstrap.js";
import { latestState } from "./state.js";
import { renderSummary } from "./summary.js";
import {
  checkTemplates,
  parseInputs,
  runJob,
  selfCheck,
  type JobKind,
  type Services,
} from "./workflow.js";
import { containedDependencies, containedWorkspaces } from "./verification.js";
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
  const result = await prepareRun(config, {
    repoRoot: repoRoot(),
    configName: configFile,
    applicability: APPLICABILITY,
  });
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

/**
 * The production boundaries: B's containment, the SDK provider and no effect
 * service. Production bindings are those each candidate declares under
 * `verification.bindings` (T3.5 H1); the controller registers none itself.
 */
/** The controller's bindings: CP01's, none yet, and the H3 hosted fixture's (T3.5 H3). */
function controllerRegistry(): ReturnType<typeof createRegistry> {
  return createRegistry([...BINDINGS, ...FIXTURE_BINDINGS]);
}

function productionDeps(signal: AbortSignal): RunnerDeps {
  const root = repoRoot();
  const registry = controllerRegistry();
  if (!registry.ok) throw new Error(registry.diagnostics.join("\n"));
  return {
    repoRoot: root,
    skillsRoot: join(root, ".claude/skills"),
    env: process.env,
    registry: registry.registry,
    applicability: APPLICABILITY,
    harness: harnessIdentity(),
    workspaces: (run, candidateRoot) => ({
      producer: containedProducer(run, candidateRoot),
      verifier: containedWorkspaces(run, candidateRoot),
      reviewer: containedWorkspaces(run, candidateRoot),
      dependencies: (spec) => containedDependencies(run, candidateRoot, spec),
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
      {
        repoRoot: root,
        skillsRoot: join(root, ".claude/skills"),
        env: process.env,
        applicability: APPLICABILITY,
      },
    );
  });

/** The hosted job's services: GitHub, Docker containment and the SDK provider. */
function hostedServices(root: string, signal: AbortSignal): Services {
  const api = githubApi(process.env);
  const registry = controllerRegistry();
  if (!registry.ok) throw new Error(registry.diagnostics.join("\n"));
  const header = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${api.token}`).toString("base64")}`;
  return {
    store: githubStore(api, {
      currentRun: Number(process.env.GITHUB_RUN_ID),
      ref: process.env.HARNESS_DISPATCH_REF ?? process.env.GITHUB_REF_NAME ?? "",
    }),
    liveness: githubLiveness(api),
    effects: (runDir) =>
      githubEffects(api, {
        repoRoot: root,
        runDir,
        ref: process.env.HARNESS_DISPATCH_REF ?? process.env.GITHUB_REF_NAME ?? "",
      }),
    feedback: githubFeedback(api),
    branchHead: (branch) => branchHead(api, branch),
    pullsFrom: async (branch) => (await pullsFrom(api, branch)).map((p) => p.number),
    fetch(commit) {
      try {
        execFileSync("git", ["cat-file", "-e", `${commit}^{commit}`], {
          cwd: root,
          stdio: "ignore",
        });
      } catch {
        execFileSync(
          "git",
          [
            "-c",
            `http.extraheader=${header}`,
            "fetch",
            "--quiet",
            `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${api.repository}.git`,
            commit,
          ],
          { cwd: root, stdio: "ignore" },
        );
      }
      return Promise.resolve();
    },
    registry: registry.registry,
    harness: harnessIdentity(),
    skillsRoot: join(root, ".claude/skills"),
    env: process.env,
    workspaces: (run, candidateRoot) => ({
      producer: containedProducer(run, candidateRoot),
      verifier: containedWorkspaces(run, candidateRoot),
      reviewer: containedWorkspaces(run, candidateRoot),
      dependencies: (spec) => containedDependencies(run, candidateRoot, spec),
    }),
    fence: fenceWorkers,
    crash: () => {
      process.kill(process.pid, "SIGKILL");
      throw new Error("the controller was killed");
    },
    signal,
  };
}

/** Appends `name=value` job outputs for the workflow. */
function output(values: Record<string, string>): void {
  const file = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v.replaceAll("\n", " ")}\n`);
  if (file) appendFileSync(file, lines.join(""));
  else process.stdout.write(lines.join(""));
}

async function workflow(kind: string): Promise<number> {
  const root = repoRoot();
  const env = process.env;
  if (kind === "check") {
    const diagnostics = await checkTemplates(root, join(root, ".claude/skills"));
    for (const d of diagnostics) console.error(d);
    console.log(
      diagnostics.length === 0 ? "templates: ok" : `templates: ${diagnostics.length} error(s)`,
    );
    return diagnostics.length === 0 ? 0 : INVALID;
  }
  const parsed = parseInputs({
    action: env.HARNESS_ACTION,
    run: env.HARNESS_RUN,
    through: env.HARNESS_THROUGH,
    request: env.HARNESS_REQUEST,
    candidate: env.HARNESS_CANDIDATE,
    config: env.HARNESS_CONFIG,
    config_revision: env.HARNESS_CONFIG_REVISION,
    reason: env.HARNESS_REASON,
    pr: env.HARNESS_PR,
    review: env.HARNESS_REVIEW,
    fault: env.HARNESS_FAULT,
  });
  if (!parsed.ok) {
    for (const d of parsed.diagnostics) console.error(d);
    if (env.GITHUB_STEP_SUMMARY) {
      appendFileSync(
        env.GITHUB_STEP_SUMMARY,
        `# Checkpoint harness — refused\n\n${parsed.diagnostics.map((d) => `- ${d}`).join("\n")}\n`,
      );
    }
    output({ next: "none", controller: "" });
    return INVALID;
  }
  const { inputs } = parsed;
  const abort = new AbortController();
  process.once("SIGTERM", () => abort.abort());
  const services = hostedServices(root, abort.signal);
  if (kind === "prepare") {
    // The commit the run's controller is pinned to: the dispatched one for a new run.
    if (inputs.action === "start") {
      output({ controller: env.GITHUB_SHA ?? "" });
      return 0;
    }
    const latest = await latestState(services.store, inputs.run);
    if (latest.kind !== "found") {
      console.error(
        latest.kind === "missing"
          ? `${inputs.run} has no saved state`
          : latest.diagnostics.join("; "),
      );
      output({ controller: env.GITHUB_SHA ?? "" });
      return 0;
    }
    const files = await services.store.download(
      latest.saved,
      join(env.RUNNER_TEMP ?? tmpdir(), "prepare"),
    );
    const manifest = JSON.parse(readFileSync(files.manifest, "utf8")) as {
      controller?: { commit?: string };
    };
    const controller = manifest.controller?.commit ?? "";
    // The run's controller code is trusted only when the dispatched branch
    // carries it: the pinned commit must be in the dispatched commit's history.
    const carried =
      /^[0-9a-f]{40}$/.test(controller) &&
      spawnSync("git", ["merge-base", "--is-ancestor", controller, env.GITHUB_SHA ?? ""], {
        cwd: root,
      }).status === 0;
    if (!carried) {
      console.error(
        `${inputs.run} is pinned to controller ${controller || "(none)"}, which ${env.GITHUB_SHA ?? "the dispatched commit"} does not carry; dispatch on the branch the run was started from`,
      );
      output({ controller: "" });
      return INVALID;
    }
    output({ controller });
    return 0;
  }
  if (kind !== "route" && kind !== "controller" && kind !== "effects") {
    console.error(`${kind}: not a workflow job`);
    return INVALID;
  }
  const started = Number(env.HARNESS_JOB_STARTED);
  const ctx = {
    repository: env.GITHUB_REPOSITORY ?? "",
    actor: env.GITHUB_TRIGGERING_ACTOR ?? env.GITHUB_ACTOR ?? "",
    runId: Number(env.GITHUB_RUN_ID),
    attempt: Number(env.GITHUB_RUN_ATTEMPT),
    job: env.GITHUB_JOB ?? kind,
    sha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    ref: env.HARNESS_DISPATCH_REF ?? env.GITHUB_REF_NAME ?? "",
    started: Number.isFinite(started) && started > 0 ? started * 1000 : Date.now(),
    timeoutMs: Number(env.HARNESS_JOB_TIMEOUT_MINUTES ?? "120") * 60 * 1000,
    serverUrl: env.GITHUB_SERVER_URL ?? "https://github.com",
  };
  const paths = { repoRoot: root, scratch: join(env.RUNNER_TEMP ?? tmpdir(), `harness-${kind}`) };
  const outcome = await runJob(kind as JobKind, inputs, ctx, services, paths);
  const mismatches = await selfCheck(outcome, inputs, services, paths, (dir) =>
    runFacts(dir, {
      repoRoot: root,
      skillsRoot: services.skillsRoot,
      env,
      applicability: APPLICABILITY,
      registry: services.registry,
      harness: services.harness,
    }),
  );
  const summary = {
    ...outcome.summary,
    diagnostics: [...outcome.summary.diagnostics, ...mismatches],
  };
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, renderSummary(summary));
  process.stdout.write(`${stringify({ ...outcome, summary }, null, 2)}\n`);
  output({
    next: outcome.next,
    dispatch_ref: outcome.dispatch?.ref ?? "",
    dispatch_pr: String(outcome.dispatch?.pr ?? ""),
    dispatch_review: String(outcome.dispatch?.review ?? ""),
  });
  if (mismatches.length > 0) {
    for (const m of mismatches) console.error(m);
    return 1;
  }
  return outcome.exit;
}

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

program
  .command("workflow")
  .description(
    "Run one job of the Checkpoint harness workflow (T3.5 H3); inputs come from HARNESS_* variables.",
  )
  .argument("<job>", "check, prepare, route, controller or effects")
  .action(async (job: string) => {
    process.exitCode = await workflow(job);
  });

try {
  await program.parseAsync(process.argv);
} catch (e) {
  if (!(e instanceof CommanderError)) throw e;
  process.exitCode = e.exitCode === 0 ? 0 : INVALID;
}
