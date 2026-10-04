// T3.5 H3: the jobs of the GitHub Actions workflow (production readiness log
// §3 H3; Spec 00 §4; T5 run guide §§3–7). A workflow run is a chain of jobs
// over one saved run state:
//
//   route       no provider credential and a read-only token: validates the
//               dispatch, restores the latest state, records operator
//               decisions, amendments and pull-request feedback, and runs the
//               actions that need neither an agent nor an effect;
//   controller  the provider credential: agent sessions and candidate work;
//   effects     repository-write credentials and no provider credential:
//               external effects, each between a saved intent and a read-back
//               receipt.
//
// Each job restores the exact latest state, takes the run over only from a
// released or provably finished owner, saves after every durable phase and
// before every effect, and hands the run to the next job by a pause. Nothing
// here decides acceptance; the runner does, from recorded evidence.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

import yaml from "js-yaml";

import { stepOrder } from "./contracts.js";
import {
  readRun,
  type GithubOwner,
  type Liveness,
  type OwnerRecord,
  type RunHandle,
} from "./evidence.js";
import type { FeedbackSource } from "./pull-requests.js";
import {
  addressComments,
  amendRun,
  approveRequest,
  checkConfiguration,
  pinned,
  resumeRun,
  runFacts,
  startRun,
  type Capabilities,
  type EffectRequest,
  type EffectService,
  type RunnerDeps,
  type RunResult,
  type Workspaces,
} from "./runner.js";
import { APPLICABILITY, type Registry } from "./software-bootstrap.js";
import {
  latestState,
  packState,
  RUN_NAME,
  saveState,
  unpackState,
  type SavedState,
  type StateStore,
} from "./state.js";
import { checkSummary, refusedSummary, summarize, type Summary } from "./summary.js";

export const ACTIONS = [
  "start",
  "continue",
  "approve",
  "deny",
  "amend",
  "status",
  "address-comments",
] as const;
export type WorkflowAction = (typeof ACTIONS)[number];

export type JobKind = "route" | "controller" | "effects";

/** The dispatch inputs, validated. */
export type Inputs = {
  action: WorkflowAction;
  run: string;
  through?: string;
  request?: string;
  candidate?: string;
  /** The template file under .github/checkpoint-harness/, for `start`. */
  config?: string;
  configRevision?: string;
  reason?: string;
  pr?: number;
  review?: number;
  fault?: string;
};

/** The job's GitHub context; `actor` is the authenticated triggering actor. */
export type JobContext = {
  repository: string;
  actor: string;
  runId: number;
  attempt: number;
  job: string;
  /** The commit this job's controller code was checked out at. */
  sha: string;
  /** The ref continuations are dispatched on. */
  ref: string;
  started: number;
  timeoutMs: number;
  serverUrl: string;
};

/** The job's boundaries: GitHub in a hosted job, in-memory fakes in tests. */
export type Services = {
  store: StateStore;
  liveness: (owner: OwnerRecord) => Promise<Liveness>;
  /** The effect service over a restored run directory; effects jobs only. */
  effects: ((runDir: string) => EffectService) | null;
  feedback: FeedbackSource | null;
  /** The head of a branch of the repository, null when absent; and its pull requests. */
  branchHead(branch: string): Promise<string | null>;
  pullsFrom(branch: string): Promise<number[]>;
  /** Makes a commit of the repository available in `repoRoot`. */
  fetch(commit: string): Promise<void>;
  registry: Registry;
  harness: string;
  skillsRoot: string;
  env: Readonly<Record<string, string | undefined>>;
  workspaces: (run: RunHandle, candidateRoot: string) => Workspaces;
  fence: (run: string) => Promise<unknown>;
  providers?: RunnerDeps["providers"];
  /** Local checkouts of operation targets in other repositories, by repository name. */
  repositories?: RunnerDeps["repositories"];
  /** Ends the controller as a lost runner would; fixture faults only. */
  crash: () => never;
  signal: AbortSignal;
};

export type Paths = { repoRoot: string; scratch: string };

/** Where the run goes next: another job of this workflow run, a new dispatch, or nowhere. */
export type Next = "controller" | "effects" | "continue" | "none";

export type JobOutcome = {
  exit: number;
  next: Next;
  summary: Summary;
  /** The ref and run name a continuation is dispatched with. */
  /**
   * The dispatch that continues the run: `continue` on the ref, or the next
   * round for a review submitted while the last one was open.
   */
  dispatch: { ref: string; run: string; pr?: number; review?: number } | null;
  saved: SavedState | null;
};

const CAPABILITIES: Record<JobKind, Capabilities> = {
  route: { agents: false, candidates: true, effects: false },
  controller: { agents: true, candidates: true, effects: false },
  effects: { agents: false, candidates: false, effects: true },
};

const TEMPLATE_DIR = ".github/checkpoint-harness";
const TEMPLATE = /^[a-z0-9][a-z0-9-]*\.yml$/;
const COMMIT = /^[0-9a-f]{40}$/;
const STEP = /^CP[0-9]{2}-S[0-9]{2}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
/** Room left before the job limit for one more phase and a save. */
const MARGIN_MS = 5 * 60 * 1000;

/** Validates the dispatch inputs; untrusted text never reaches a shell. */
export function parseInputs(
  raw: Readonly<Record<string, string | undefined>>,
): { ok: true; inputs: Inputs } | { ok: false; diagnostics: string[] } {
  const value = (k: string): string | undefined => {
    const v = raw[k]?.trim();
    return v === undefined || v === "" ? undefined : v;
  };
  const errors: string[] = [];
  const action = value("action");
  if (!ACTIONS.some((a) => a === action))
    errors.push(`action ${action ?? "(none)"} is not one of ${ACTIONS.join(", ")}`);
  // Untrimmed: the workflow's concurrency group uses the run name as dispatched.
  const run = raw.run ?? "";
  if (!RUN_NAME.test(run))
    errors.push(`run ${run || "(none)"} is not a run name (${RUN_NAME.source})`);
  const check = (k: string, pattern: RegExp, label: string): string | undefined => {
    const v = value(k);
    if (v !== undefined && !pattern.test(v)) errors.push(`${k} ${v} is not ${label}`);
    return v;
  };
  const through = check("through", STEP, "a step ID");
  const request = check("request", DIGEST, "an approval request ID");
  const candidate = check("candidate", COMMIT, "a candidate commit");
  const config = check("config", TEMPLATE, `a template file name in ${TEMPLATE_DIR}`);
  const configRevision = check("config_revision", COMMIT, "a full commit SHA");
  const reason = value("reason");
  const number = (k: string): number | undefined => {
    const v = value(k);
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < 1) errors.push(`${k} ${v} is not a positive number`);
    return n;
  };
  const pr = number("pr");
  const review = number("review");
  const fault = check("fault", /^crash-after-(intent|effect)(:[a-z-]+)?$/, "a fixture fault");
  const typed = action as WorkflowAction;
  if (typed === "approve" || typed === "deny") {
    if (!request) errors.push(`${typed} needs request`);
    if (!candidate) errors.push(`${typed} needs candidate`);
  }
  if (typed === "amend" && (!configRevision || !reason))
    errors.push("amend needs config_revision and reason");
  if (typed === "address-comments" && pr === undefined) errors.push("address-comments needs pr");
  if (through !== undefined && typed !== "start" && typed !== "continue") {
    errors.push("through is only for start and continue");
  }
  if (errors.length > 0) return { ok: false, diagnostics: errors };
  return {
    ok: true,
    inputs: {
      action: typed,
      run,
      ...(through ? { through } : {}),
      ...(request ? { request } : {}),
      ...(candidate ? { candidate } : {}),
      ...(config ? { config } : {}),
      ...(configRevision ? { configRevision } : {}),
      ...(reason ? { reason } : {}),
      ...(pr === undefined ? {} : { pr }),
      ...(review === undefined ? {} : { review }),
      ...(fault ? { fault } : {}),
    },
  };
}

const git = (cwd: string, args: string[]): string =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** The run's state after restore: its directory and the saved state it came from. */
type Restored = { dir: string; saved: SavedState; sequence: number };

/**
 * One job of the workflow. Refusals write nothing and report every run field
 * unknown when no state was restored.
 */
export async function runJob(
  kind: JobKind,
  inputs: Inputs,
  ctx: JobContext,
  services: Services,
  paths: Paths,
): Promise<JobOutcome> {
  const job = `${ctx.serverUrl}/${ctx.repository}/actions/runs/${ctx.runId}`;
  const owner: GithubOwner = {
    repository: ctx.repository,
    run_id: ctx.runId,
    run_attempt: ctx.attempt,
    job: ctx.job,
  };
  mkdirSync(paths.scratch, { recursive: true });
  let restored: Restored | null = null;
  let lastSaved: SavedState | null = null;
  let savedJournal: { seq: number; head: string | null } | null = null;
  const refuse = async (diagnostics: string[]): Promise<JobOutcome> => ({
    exit: 2,
    next: "none",
    summary: restored
      ? await summaryOf("refused", null, diagnostics)
      : refusedSummary(inputs.action, job, diagnostics),
    dispatch: null,
    saved: null,
  });

  // The saver: one new sequence per changed journal, refused when another
  // controller saved the run first.
  let sequence = 0;
  let journalSeq = -1;
  let saves = 0;
  const save = async (run: { dir: string }): Promise<void> => {
    const read = readRun(run.dir);
    if (!read.ok) throw new Error(read.diagnostics.join("; "));
    const seq = read.records.events.at(-1)?.seq ?? 0;
    if (seq === journalSeq) return;
    const configured = pinned(run.dir, read.records.events);
    const controller = configured?.hosted?.controller ?? ctx.sha;
    const packed = await packState(run.dir, join(paths.scratch, `save-${saves++}`), {
      name: inputs.run,
      sequence: sequence + 1,
      controller: { commit: controller, identity: services.harness },
    });
    lastSaved = await saveState(services.store, inputs.run, sequence + 1, packed.files);
    sequence += 1;
    journalSeq = seq;
    savedJournal = { seq, head: read.records.head };
  };

  const deps = (dir: string | null): RunnerDeps => ({
    repoRoot: paths.repoRoot,
    skillsRoot: services.skillsRoot,
    env: services.env,
    registry: services.registry,
    applicability: APPLICABILITY,
    harness: services.harness,
    workspaces: services.workspaces,
    effects:
      kind === "effects" && dir !== null && services.effects
        ? faulty(services.effects(dir), inputs.fault, services.crash)
        : null,
    fence: services.fence,
    liveness: services.liveness,
    signal: services.signal,
    save: (run) => save(run),
    yieldAt: yieldAt(dir),
    capabilities: CAPABILITIES[kind],
    workspaceRoots: {
      candidate: join(paths.scratch, "workspaces"),
      controller: join(paths.scratch, "runs"),
    },
    requireCredential: kind === "controller",
    github: owner,
    ...(services.providers ? { providers: services.providers } : {}),
    ...(services.repositories ? { repositories: services.repositories } : {}),
  });

  /**
   * The yield deadline: the configured job budget, and never later than the
   * job limit less one session's wall time and a save.
   */
  function yieldAt(dir: string | null): number {
    const configured = dir === null ? null : pinned(dir, readEvents(dir));
    const wall = (configured?.config.budgets.wall_time_seconds ?? 0) * 1000;
    const limit = ctx.started + ctx.timeoutMs - wall - MARGIN_MS;
    const after = configured?.config.job?.yield_after_seconds;
    return after === undefined ? limit : Math.min(limit, ctx.started + after * 1000);
  }

  async function summaryOf(
    outcome: Summary["outcome"],
    handedTo: string | null,
    diagnostics: string[] = [],
  ): Promise<Summary> {
    if (!restored) return refusedSummary(inputs.action, job, diagnostics);
    const facts = await runFacts(restored.dir, deps(restored.dir));
    if (!facts.ok)
      return refusedSummary(inputs.action, job, [...diagnostics, ...facts.diagnostics]);
    return summarize({
      action: inputs.action,
      outcome,
      facts: facts.facts,
      saved: lastSaved ?? restored.saved,
      savedJournal: savedJournal ?? null,
      job,
      handedTo,
      diagnostics,
    });
  }

  async function restore(): Promise<Restored | string[]> {
    const latest = await latestState(services.store, inputs.run);
    if (latest.kind === "missing") {
      return [
        `${inputs.run} has no saved state; a run is only ever continued from its own saved state`,
      ];
    }
    if (latest.kind === "refused") return latest.diagnostics;
    const into = join(paths.scratch, `restore-${latest.saved.sequence}`);
    const files = await services.store.download(latest.saved, join(into, "files"));
    const unpacked = await unpackState(files, join(into, "run"), {
      name: inputs.run,
      sequence: latest.saved.sequence,
    });
    if (!unpacked.ok) return unpacked.diagnostics;
    const { controller } = unpacked.manifest;
    if (controller.commit !== ctx.sha || controller.identity !== services.harness) {
      return [
        `${inputs.run} is pinned to controller ${controller.commit} (${controller.identity}); this job runs ${ctx.sha} (${services.harness})`,
      ];
    }
    // The run reads its recorded source revision, wherever the branch has moved since.
    const configured = pinned(unpacked.dir, readEvents(unpacked.dir));
    // A run is operated from the branch it was started on: its saved states
    // are only trusted from dispatches there.
    if (configured?.hosted && configured.hosted.ref !== ctx.ref) {
      return [
        `${inputs.run} is operated from ${configured.hosted.ref}; this job was dispatched on ${ctx.ref}`,
      ];
    }
    if (configured) {
      const { branch, expected_head } = configured.config.repository;
      await services.fetch(expected_head);
      git(paths.repoRoot, ["update-ref", `refs/heads/${branch}`, expected_head]);
    }
    sequence = latest.saved.sequence;
    journalSeq = unpacked.manifest.journal.seq;
    savedJournal = { seq: unpacked.manifest.journal.seq, head: unpacked.manifest.journal.head };
    return { dir: unpacked.dir, saved: latest.saved, sequence };
  }

  /** The job's result from a runner result: its next job and summary. */
  async function finished(result: RunResult): Promise<JobOutcome> {
    if (result.outcome === "invalid") return refuse(result.diagnostics);
    const reasons = result.outcome === "paused" ? result.reasons : [];
    const handed = reasons.find((r) => r.code === "hand-off")?.subject ?? null;
    const yielded = reasons.some((r) => r.code === "yield");
    // A review that waited for the round just completed starts the next one.
    const facts =
      restored && reasons.length === 0 ? await runFacts(restored.dir, deps(restored.dir)) : null;
    const queued =
      facts?.ok && facts.facts.round?.complete && !facts.facts.pause
        ? facts.facts.queued[0]
        : undefined;
    const next: Next =
      yielded || queued
        ? "continue"
        : handed === "effects"
          ? kind === "effects"
            ? "none"
            : "effects"
          : handed === "controller"
            ? kind === "route"
              ? "controller"
              : "continue"
            : "none";
    const hosted = restored ? pinned(restored.dir, readEvents(restored.dir))?.hosted : null;
    return {
      exit: 0,
      next,
      summary: await summaryOf(
        result.outcome,
        next === "controller" || next === "effects" ? next : null,
      ),
      dispatch:
        next === "continue" && hosted
          ? {
              ref: hosted.ref,
              run: inputs.run,
              ...(queued && !yielded ? { pr: queued.pull, review: queued.review } : {}),
            }
          : null,
      saved: lastSaved,
    };
  }

  // A fault is a hosted-fixture instrument: it needs a template that allows it.
  const faultAllowed = (dir: string): boolean =>
    pinned(dir, readEvents(dir))?.config.job?.faults === true;

  // Only the route job acts on the dispatched action; the jobs after it continue the run.
  if (inputs.action === "start" && kind === "route") return start();
  const got = await restore();
  if (Array.isArray(got)) return refuse(got);
  restored = got;
  const dir = got.dir;
  if (inputs.fault && !faultAllowed(dir)) {
    return refuse([`fault ${inputs.fault} needs a template with job.faults: true`]);
  }

  if (kind !== "route") {
    return finished(await resumeRun(dir, deps(dir)));
  }
  switch (inputs.action) {
    case "status":
      return {
        exit: 0,
        next: "none",
        summary: await summaryOf("reported", null),
        dispatch: null,
        saved: null,
      };
    case "approve":
    case "deny": {
      const recorded = await approveRequest(
        dir,
        {
          request: inputs.request ?? "",
          decision: inputs.action === "approve" ? "approved" : "denied",
          actor: ctx.actor,
          candidate: inputs.candidate ?? "",
        },
        { github: owner },
      );
      if (!recorded.ok) return refuse(recorded.diagnostics);
      await save({ dir });
      return {
        exit: 0,
        next: "none",
        summary: await summaryOf("recorded", null),
        dispatch: null,
        saved: lastSaved,
      };
    }
    case "amend":
      return amend(dir);
    case "continue": {
      if (inputs.through) {
        const extended = await extend(dir, inputs.through);
        if (extended.length > 0) return refuse(extended);
      }
      return finished(await resumeRun(dir, deps(dir)));
    }
    case "address-comments": {
      if (!services.feedback) return refuse(["no pull-request reader is available"]);
      const recorded = await addressComments(
        dir,
        { pull: inputs.pr ?? 0, actor: ctx.actor, review: inputs.review ?? null },
        {
          source: services.feedback,
          repoRoot: paths.repoRoot,
          fetch: services.fetch,
          github: owner,
        },
      );
      if (!recorded.ok) return refuse(recorded.diagnostics);
      if (recorded.outcome === "unchanged") {
        return {
          exit: 0,
          next: "none",
          summary: await summaryOf("reported", null, [
            "no new or edited feedback: every item already has a completed disposition",
          ]),
          dispatch: null,
          saved: null,
        };
      }
      if (recorded.outcome === "recorded" || recorded.outcome === "queued") await save({ dir });
      return finished(await resumeRun(dir, deps(dir)));
    }
  }
  return refuse([`${inputs.action} is not handled`]);

  async function start(): Promise<JobOutcome> {
    const existing = await latestState(services.store, inputs.run);
    if (existing.kind === "refused") return refuse(existing.diagnostics);
    if (existing.kind === "found" || (await services.store.list(inputs.run)).length > 0) {
      return refuse([
        `${inputs.run} already has saved state; continue it instead of starting it again`,
      ]);
    }
    const branch = `harness/${inputs.run}`;
    if (
      (await services.branchHead(branch)) !== null ||
      (await services.pullsFrom(branch)).length > 0
    ) {
      return refuse([`${branch} or its pull request already exists; a run name is used once`]);
    }
    const file = `${TEMPLATE_DIR}/${inputs.config ?? "cp01-t5.yml"}`;
    const composed = await compose(file, ctx.sha);
    if (typeof composed === "string") return refuse([composed]);
    const job = composed.job as { faults?: unknown } | undefined;
    if (inputs.fault && job?.faults !== true) {
      return refuse([`fault ${inputs.fault} needs a template with job.faults: true`]);
    }
    const result = await startRun(composed, deps(null), {
      configName: file,
      hosted: {
        name: inputs.run,
        template: file,
        revision: ctx.sha,
        controller: ctx.sha,
        ref: ctx.ref,
      },
    });
    if (result.outcome !== "invalid") {
      restored = { dir: result.dir, saved: lastSaved ?? emptySaved(), sequence };
    }
    return finished(result);
  }

  /** The template at `revision` with the run's resolved revisions and selection, as `start` composes it. */
  async function compose(
    file: string,
    revision: string,
  ): Promise<Record<string, unknown> | string> {
    let template: unknown;
    try {
      template = yaml.load(git(paths.repoRoot, ["show", `${revision}:${file}`]));
    } catch (e) {
      return `${file} at ${revision}: ${e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e)}`;
    }
    if (typeof template !== "object" || template === null || Array.isArray(template)) {
      return `${file} at ${revision}: not a configuration mapping`;
    }
    const t = template as Record<string, unknown>;
    if ("selection" in t || "workspace" in t) {
      return `${file}: a template names neither selection nor workspace; the workflow supplies them`;
    }
    const repository = t.repository as
      { name?: string; branch?: string; expected_head?: string } | undefined;
    if (!repository?.branch || repository.expected_head !== undefined) {
      return `${file}: repository.branch is required and expected_head is resolved at start`;
    }
    const head = await services.branchHead(repository.branch);
    if (head === null) return `${repository.branch} does not exist in ${ctx.repository}`;
    await services.fetch(head);
    git(paths.repoRoot, ["update-ref", `refs/heads/${repository.branch}`, head]);
    const definitions = (t.definitions ?? {}) as { revision?: string; review?: string };
    const revisionOf = definitions.revision ?? head;
    const checkpoint = typeof t.checkpoint === "string" ? t.checkpoint : "";
    const order = await stepOrder(paths.repoRoot, revisionOf, checkpoint);
    if (!order || order.length === 0) return `${checkpoint} does not load at ${revisionOf}`;
    const through = inputs.through ?? order[0] ?? "";
    if (!order.includes(through)) return `through ${through} is not a step of ${checkpoint}`;
    return {
      ...t,
      repository: { ...repository, expected_head: head },
      definitions: { ...definitions, revision: revisionOf },
      selection: { through },
      workspace: {
        candidate_root: join(paths.scratch, "workspaces"),
        controller_root: join(paths.scratch, "runs"),
      },
    };
  }

  /** `continue` with a later boundary: validated and recorded as a selection-only amendment. */
  async function extend(dir: string, through: string): Promise<string[]> {
    const configured = pinned(dir, readEvents(dir));
    if (!configured) return [`${dir}: the run has no run-start record`];
    const { config } = configured;
    const order = await stepOrder(paths.repoRoot, config.definitions.revision, config.checkpoint);
    const current = config.selection.through;
    if (!order?.includes(through))
      return [`through ${through} is not a step of ${config.checkpoint}`];
    if (order.indexOf(through) <= order.indexOf(current)) {
      return [`through ${through} does not extend the selection through ${current}`];
    }
    const amended = await amendRun(
      dir,
      {
        config: { ...config, selection: { through } },
        reason: `continue through ${through}`,
        actor: ctx.actor,
      },
      { ...deps(dir), requireCredential: false },
    );
    if (!amended.ok) return amended.diagnostics;
    await save({ dir });
    return [];
  }

  async function amend(dir: string): Promise<JobOutcome> {
    const configured = pinned(dir, readEvents(dir));
    if (!configured?.hosted) return refuse([`${inputs.run} was not started by the workflow`]);
    const revision = inputs.configRevision ?? "";
    await services.fetch(revision);
    let template: unknown;
    try {
      template = yaml.load(
        git(paths.repoRoot, ["show", `${revision}:${configured.hosted.template}`]),
      );
    } catch (e) {
      return refuse([
        `${configured.hosted.template} at ${revision}: ${e instanceof Error ? e.message : String(e)}`,
      ]);
    }
    if (typeof template !== "object" || template === null) {
      return refuse([`${configured.hosted.template} at ${revision}: not a configuration mapping`]);
    }
    const t = template as Record<string, unknown>;
    const { config } = configured;
    const definitions = (t.definitions ?? {}) as { revision?: string };
    const amended = {
      ...t,
      repository: config.repository,
      selection: config.selection,
      workspace: config.workspace,
      definitions: definitions.revision ? t.definitions : config.definitions,
    };
    const recorded = await amendRun(
      dir,
      { config: amended, reason: inputs.reason ?? "", actor: ctx.actor, revision },
      { ...deps(dir), requireCredential: false },
    );
    if (!recorded.ok) return refuse(recorded.diagnostics);
    await save({ dir });
    return {
      exit: 0,
      next: "none",
      summary: await summaryOf("recorded", null),
      dispatch: null,
      saved: lastSaved,
    };
  }

  function emptySaved(): SavedState {
    return {
      id: "none",
      name: inputs.run,
      sequence: 0,
      expired: false,
      expiresAt: null,
      url: null,
    };
  }
}

function readEvents(dir: string) {
  const read = readRun(dir);
  if (!read.ok) throw new Error(read.diagnostics.join("; "));
  return read.records.events;
}

/**
 * The effect service of a job, with a fixture fault when the dispatch names
 * one: the controller ends as a lost runner would, after the effect's intent
 * is saved and before it runs, or after it runs and before its receipt.
 */
export function faulty(
  effects: EffectService | null,
  fault: string | undefined,
  crash: () => never,
): EffectService | null {
  if (!effects || !fault) return effects;
  const [when = "", action] = fault.split(":");
  let fired = false;
  const hits = (request: EffectRequest): boolean =>
    !fired && (action === undefined || request.action === action);
  return {
    async execute(key, request) {
      if (when === "crash-after-intent" && hits(request)) {
        fired = true;
        crash();
      }
      const receipt = await effects.execute(key, request);
      if (when === "crash-after-effect" && hits(request)) {
        fired = true;
        crash();
      }
      return receipt;
    },
    ...(effects.inspect ? { inspect: effects.inspect.bind(effects) } : {}),
  };
}

/**
 * Checks a job's summary against the state it saved, restored afresh: every
 * field the summary reports must be what that state records (T3.5 H3).
 */
export async function selfCheck(
  outcome: JobOutcome,
  inputs: Inputs,
  services: Services,
  paths: Paths,
  facts: (dir: string) => ReturnType<typeof runFacts>,
): Promise<string[]> {
  const saved = outcome.saved;
  if (!saved || outcome.summary.run === "unknown") return [];
  const into = join(paths.scratch, `check-${saved.sequence}`);
  const files = await services.store.download(saved, join(into, "files"));
  const unpacked = await unpackState(files, join(into, "run"), {
    name: inputs.run,
    sequence: saved.sequence,
  });
  if (!unpacked.ok) return unpacked.diagnostics;
  const recorded = await facts(unpacked.dir);
  if (!recorded.ok) return recorded.diagnostics;
  const expected = summarize({
    action: outcome.summary.action,
    outcome: outcome.summary.outcome,
    facts: recorded.facts,
    saved,
    savedJournal: { seq: unpacked.manifest.journal.seq, head: unpacked.manifest.journal.head },
    job: outcome.summary.evidence === "unknown" ? "" : outcome.summary.evidence.job,
    handedTo: outcome.next === "controller" || outcome.next === "effects" ? outcome.next : null,
    diagnostics: outcome.summary.diagnostics,
  });
  return checkSummary(outcome.summary, expected).map(
    (m) =>
      `summary field ${m.field} reports ${JSON.stringify(m.reported)}, the saved state records ${JSON.stringify(m.recorded)}`,
  );
}

/**
 * Checks every configuration template as `start` would compose it at the
 * checked-out commit, without a credential or a repository head: schema,
 * plan, roles, pinned skills and paths. A template names neither selection,
 * workspace nor expected_head; the workflow supplies them.
 */
export async function checkTemplates(repoRoot: string, skillsRoot: string): Promise<string[]> {
  const head = git(repoRoot, ["rev-parse", "HEAD"]);
  const dir = join(repoRoot, TEMPLATE_DIR);
  const diagnostics: string[] = [];
  for (const name of readdirSync(dir)
    .filter((f) => TEMPLATE.test(f))
    .sort()) {
    const file = `${TEMPLATE_DIR}/${name}`;
    let t: unknown;
    try {
      t = yaml.load(git(repoRoot, ["show", `${head}:${file}`]));
    } catch (e) {
      diagnostics.push(
        `${file}: ${e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e)}`,
      );
      continue;
    }
    if (typeof t !== "object" || t === null || Array.isArray(t)) {
      diagnostics.push(`${file}: not a configuration mapping`);
      continue;
    }
    const template = t as Record<string, unknown>;
    const repository = template.repository as Record<string, unknown> | undefined;
    if (
      "selection" in template ||
      "workspace" in template ||
      repository?.expected_head !== undefined
    ) {
      diagnostics.push(`${file}: a template names neither selection, workspace nor expected_head`);
      continue;
    }
    const definitions = (template.definitions ?? {}) as Record<string, unknown>;
    const revision = typeof definitions.revision === "string" ? definitions.revision : head;
    const checkpoint = typeof template.checkpoint === "string" ? template.checkpoint : "";
    const order = await stepOrder(repoRoot, revision, checkpoint);
    if (!order?.[0]) {
      diagnostics.push(`${file}: ${checkpoint} does not load at ${revision}`);
      continue;
    }
    const composed = {
      ...template,
      repository: { ...repository, expected_head: head },
      definitions: { ...definitions, revision },
      selection: { through: order[0] },
      workspace: {
        candidate_root: "/tmp/harness-check/workspaces",
        controller_root: "/tmp/harness-check/runs",
      },
    };
    const checked = await checkConfiguration(
      composed,
      { repoRoot, skillsRoot, env: {}, applicability: APPLICABILITY, requireCredential: false },
      file,
    );
    if (!checked.ok) diagnostics.push(...checked.diagnostics);
  }
  return diagnostics;
}
