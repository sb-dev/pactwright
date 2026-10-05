// T3.5 H3 acceptance (production readiness log §3 H3, H3-01–H3-15), offline.
// Each hosted job is a `job` call: it restores the saved state into a fresh
// directory under its own GitHub run and job, and its summary is checked
// against the state it saved. GitHub is in memory, agents are scripted and
// candidate commands run as local processes; real containment is the Docker
// integration test's and the hosted runs are the hosted proof's. Every
// semicolon case of the plan's table has its own assertion, with a valid
// control where a case is a refusal.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { buildPacket, OPERATION_GUIDANCE, type AgentOutcome } from "../src/claude.js";
import { prepareRun, type AcceptedOutput } from "../src/contracts.js";
import { readRun, type RunHandle } from "../src/evidence.js";
import {
  collect,
  type Assessment,
  type FeedbackSnapshot,
  type RoundRecord,
} from "../src/pull-requests.js";
import {
  GitHubError,
  githubEffects,
  githubFeedback,
  githubStore,
  ProvenanceError,
  SETTLE_MS,
  targetRepositories,
  WORKFLOW,
  type GitHubApi,
} from "../src/github.js";
import { EffectBlocked, pinned, type ConfigChange, type EffectRequest } from "../src/runner.js";
import {
  APPLICABILITY,
  createRegistry,
  declaredRegistry,
  FIXTURE_BINDINGS,
} from "../src/software-bootstrap.js";
import {
  latestState,
  saveState,
  type SavedState,
  type StateFiles,
  type StateStore,
} from "../src/state.js";
import {
  checkSummary,
  FIELDS,
  refusedSummary,
  renderSummary,
  type Summary,
} from "../src/summary.js";
import {
  decideAcceptance,
  journalInput,
  type AcceptanceInput,
  type Decision,
} from "../src/verification.js";
import { treeFiles, type SealedCandidate } from "../src/workspace.js";
import { scriptedAgent } from "./runner-fixtures.js";
import { parseInputs } from "../src/workflow.js";
import {
  BRANCH,
  commitTemplate,
  Crash,
  dispatch,
  eventsOf,
  factsOf,
  fixtureProducer,
  GREETING,
  H,
  job,
  OWNER,
  pendingOf,
  recordsOf,
  registryRepo,
  RELEASES,
  REPOSITORY,
  S01,
  S02,
  S03,
  S04,
  savedDir,
  STAMP,
  verdictFor,
  WELCOME,
  WORK,
  world,
  type World,
} from "./h3-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const START = { action: "start", config: "h3-fixture.yml" } as const;

/** The journaled evaluation record of an attempt. */
type EvaluationOf = {
  step: string;
  attempt: number;
  candidate: SealedCandidate;
  claims: Parameters<typeof journalInput>[1]["claims"];
  manifest: Parameters<typeof journalInput>[1]["manifest"];
};

type Outcomes = Awaited<ReturnType<typeof dispatch>>;
const last = (outcomes: Outcomes): Outcomes[number] => {
  const found = outcomes.at(-1);
  assert.ok(found);
  return found;
};

/** The automatic continuations a hosted run dispatches, until the run stops. */
async function settle(w: World, outcomes: Outcomes): Promise<Outcomes> {
  let current = outcomes;
  for (let i = 0; i < 10 && last(current).next === "continue"; i++) {
    current = await dispatch(w, { action: "continue" });
  }
  return current;
}

/** Starts a run and runs it to its approval request. */
async function toApproval(w: World): Promise<{ request: string; candidate: string }> {
  const started = await dispatch(w, START);
  assert.equal(last(started).summary.outcome, "paused", stringify(last(started).summary));
  return pendingOf(last(started));
}

/** Runs a run through S01's approval, its effect and the first publication. */
async function toPublished(w: World): Promise<void> {
  const pending = await toApproval(w);
  assert.equal(last(await dispatch(w, { action: "approve", ...pending })).exit, 0);
  const continued = await dispatch(w, { action: "continue" });
  assert.equal(last(continued).summary.outcome, "selection-accepted");
}

/** Runs a run through S02 and its publication: the pull request every round uses. */
async function toS02(w: World): Promise<number> {
  await toPublished(w);
  const extended = await dispatch(w, { action: "continue", through: S02 });
  assert.equal(
    last(extended).summary.outcome,
    "selection-accepted",
    stringify(last(extended).summary),
  );
  return w.github.pullOf(`harness/${w.run}`).number;
}

const sequences = (w: World): number[] =>
  w.store.states.filter((s) => s.name === w.run).map((s) => s.sequence);

describe("H3-01 a fresh runner restores the exact state", () => {
  it("each job restores the latest sequence and continues its journal unchanged", async () => {
    const w = world(scratch);
    const started = await dispatch(w, START);
    assert.deepEqual(
      started.map((o) => o.kind),
      ["route", "controller"],
    );
    // The controller job restored the route job's last state and extended it.
    const route = started[0]?.saved;
    assert.ok(route);
    const before = eventsOf(w, savedDirOf(w, route.sequence));
    const after = eventsOf(w);
    assert.deepEqual(after.slice(0, before.length), before);
    // Its owner record names the controller job, not a host or process.
    const owners = after.filter((e) => e.action === "owner").map((e) => e.data.github);
    assert.deepEqual(
      owners.map((o) => (o as { job: string } | null)?.job),
      ["route", "controller"],
    );
    // Sequences are contiguous: no state was skipped or reset.
    assert.deepEqual(
      sequences(w),
      [...sequences(w).keys()].map((i) => i + 1),
    );
  });

  it("a missing state is refused, and the run cannot be started again", async () => {
    const w = world(scratch, { run: "never-started" });
    const refused = await dispatch(w, { action: "continue" });
    assert.equal(refused.length, 1);
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /has no saved state/);
    assert.deepEqual(sequences(w), []);
    // Control: the name with state continues.
    const v = world(scratch);
    await dispatch(v, START);
    assert.equal(last(await dispatch(v, { action: "continue" })).exit, 0);
    const again = await dispatch(v, START);
    assert.equal(last(again).exit, 2);
    assert.match(last(again).summary.diagnostics.join("\n"), /already has saved state/);
  });

  it("a damaged archive is refused without a new state", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    const saved = sequences(w);
    w.store.damage(w.run, Math.max(...saved));
    const refused = await dispatch(w, { action: "continue" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /damaged/);
    assert.deepEqual(sequences(w), saved);
    assert.equal(last(refused).summary.run, "unknown");
  });

  it("a stale state, older than an expired latest sequence, is refused", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    const latest = Math.max(...sequences(w));
    w.store.expire(w.run, latest);
    const expired = await dispatch(w, { action: "continue" });
    assert.equal(last(expired).exit, 2);
    assert.match(last(expired).summary.diagnostics.join("\n"), /expired/);
    assert.equal(last(await dispatch(w, START)).exit, 2, "an expired run is never started again");
  });

  it("a sequence saved again later, by a racing writer, never replaces its first save", async () => {
    const v = world(scratch);
    await dispatch(v, START);
    const top = Math.max(...sequences(v));
    const journal = eventsOf(v).length;
    // An older state stored again as the latest sequence, after the first save of it.
    v.store.copy(v.run, top - 1, top);
    const continued = await dispatch(v, { action: "continue" });
    assert.equal(last(continued).exit, 0, stringify(last(continued).summary));
    assert.ok(
      eventsOf(v).length > journal,
      "the run continued from the first save, not the older copy",
    );
  });

  it("of two writers that both pass the sequence check, the later save fences itself", async () => {
    const v = world(scratch);
    await dispatch(v, START);
    const top = v.store.latest(v.run);
    const files = { archive: join(top.dir, "state.tar.gz"), manifest: join(top.dir, "state.json") };
    // A competitor stores the same sequence first, after both checked it.
    const racing: StateStore = {
      list: (name) => v.store.list(name),
      download: (saved, into) => v.store.download(saved, into),
      async upload(name, sequence, f) {
        await v.store.upload(name, sequence, f);
        return v.store.upload(name, sequence, f);
      },
    };
    await assert.rejects(
      () => saveState(racing, v.run, top.sequence + 1, files),
      /saved first by another controller/,
    );
    // Control: the first of the two stands.
    const winner: StateStore = {
      ...racing,
      async upload(name, sequence, f) {
        const first = await v.store.upload(name, sequence, f);
        await v.store.upload(name, sequence, f);
        return first;
      },
    };
    const saved = await saveState(winner, v.run, top.sequence + 2, files);
    const latest = await latestState(v.store, v.run);
    assert.ok(latest.kind === "found");
    assert.equal(latest.saved.id, saved.id);
  });

  it("a dispatch on another branch than the run's is refused", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    const saved = sequences(w);
    const elsewhere = await dispatch(w, { action: "continue" }, { ref: "attacker-branch" });
    assert.equal(last(elsewhere).exit, 2);
    assert.match(
      last(elsewhere).summary.diagnostics.join("\n"),
      /is operated from fixture; this job was dispatched on attacker-branch/,
    );
    assert.deepEqual(sequences(w), saved);
    assert.equal(
      last(await dispatch(w, { action: "continue" })).exit,
      0,
      "control: the run's branch",
    );
  });
});

describe("H3-01 and H3-06 GitHub provenance and read-back", () => {
  // One repository's REST API, in memory: artifacts, the runs that uploaded
  // them, and pull-request comments.
  const RUNS: Record<number, object> = {
    1: {
      id: 1,
      path: WORKFLOW,
      event: "workflow_dispatch",
      head_branch: "main-line",
      head_repository: { full_name: REPOSITORY },
    },
    2: {
      id: 2,
      path: WORKFLOW,
      event: "workflow_dispatch",
      head_branch: "attacker",
      head_repository: { full_name: REPOSITORY },
    },
    3: {
      id: 3,
      path: WORKFLOW,
      event: "pull_request",
      head_branch: "main-line",
      head_repository: { full_name: REPOSITORY },
    },
    4: {
      id: 4,
      path: ".github/workflows/other.yml",
      event: "workflow_dispatch",
      head_branch: "main-line",
      head_repository: { full_name: REPOSITORY },
    },
    5: {
      id: 5,
      path: WORKFLOW,
      event: "workflow_dispatch",
      head_branch: "main-line",
      head_repository: { full_name: "fork/pactwright" },
    },
  };
  const artifact = (id: number, name: string, run: number): object => ({
    id,
    name,
    expired: false,
    expires_at: null,
    workflow_run: { id: run },
  });
  const api = (
    options: {
      comments?: object[];
      artifacts?: object[];
      runs?: Record<number, object>;
      /** Runs whose lookup fails, each for the given number of reads. */
      failing?: Map<number, number>;
      posts?: string[];
    } = {},
  ): GitHubApi => ({
    repository: REPOSITORY,
    token: "test",
    request<T>(method: string, path: string): Promise<T> {
      if (method === "POST") {
        options.posts?.push(path);
        return Promise.resolve({ id: 1, body: "", html_url: "posted", user: null } as T);
      }
      const runs = /\/actions\/runs\/(\d+)$/.exec(path);
      if (runs) {
        const id = Number(runs[1]);
        const left = options.failing?.get(id) ?? 0;
        if (left > 0) {
          options.failing?.set(id, left - 1);
          return Promise.reject(new Error(`GET ${path}: 502`));
        }
        return Promise.resolve({ ...RUNS, ...options.runs }[id] as T);
      }
      if (path.includes("/actions/artifacts")) {
        const all =
          options.artifacts ??
          [1, 2, 3, 4, 5].map((run) => artifact(100 + run, "harness-h3-test-000007", run));
        const fixture = [1, 2].map((run) => artifact(200 + run, "harness-effect-abc", run));
        const page = /[?&]page=(\d+)/.exec(path)?.[1] ?? "1";
        const named = /[?&]name=([^&]+)/.exec(path)?.[1];
        const rows = named ? fixture.filter((a) => (a as { name: string }).name === named) : all;
        return Promise.resolve({ artifacts: page === "1" ? rows : [] } as T);
      }
      if (path.includes("/comments")) {
        const page = /[?&]page=(\d+)/.exec(path)?.[1] ?? "1";
        return Promise.resolve(
          (page === "1" && path.includes("/issues/") ? (options.comments ?? []) : []) as T,
        );
      }
      return Promise.reject(new Error(`unexpected ${path}`));
    },
  });

  it("an artifact whose run cannot be read refuses the run's state, never yielding an older one", async () => {
    // Sequence 7 from a trusted run; sequence 8 from run 6, which cannot be read.
    const rows = [
      artifact(101, "harness-h3-test-000007", 1),
      artifact(106, "harness-h3-test-000008", 6),
    ];
    const run6 = { ...(RUNS[1] as object), id: 6 };
    const unreadable = githubStore(api({ artifacts: rows, failing: new Map([[6, 99]]) }), {
      currentRun: 9,
      ref: "main-line",
    });
    await assert.rejects(() => unreadable.list("h3-test"), ProvenanceError);
    const refused = await latestState(unreadable, "h3-test");
    assert.equal(refused.kind, "refused");
    assert.match(refused.kind === "refused" ? refused.diagnostics.join() : "", /cannot be read/);
    // Control: once the run reads as this run's, sequence 8 is the latest.
    const readable = await latestState(
      githubStore(api({ artifacts: rows, runs: { 6: run6 } }), { currentRun: 9, ref: "main-line" }),
      "h3-test",
    );
    assert.ok(readable.kind === "found");
    assert.equal(readable.saved.sequence, 8);
    // A failed read is not remembered: the same store reads the run again.
    const flaky = githubStore(
      api({ artifacts: rows, runs: { 6: run6 }, failing: new Map([[6, 1]]) }),
      {
        currentRun: 9,
        ref: "main-line",
      },
    );
    await assert.rejects(() => flaky.list("h3-test"), ProvenanceError);
    assert.deepEqual((await flaky.list("h3-test")).map((x) => x.sequence).sort(), [7, 8]);
  });

  it("a job whose saved states cannot be vouched for refuses before restoring, saving or dispatching", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    const saved = sequences(w);
    const unverifiable: StateStore = {
      list: () =>
        Promise.reject(new ProvenanceError("artifact 9: its workflow run cannot be read")),
      download: (x, into) => w.store.download(x, into),
      upload: (name, sequence, files) => w.store.upload(name, sequence, files),
    };
    const blind = { ...w, store: unverifiable as unknown as typeof w.store };
    for (const action of ["continue", "status"]) {
      const refused = await job(blind, "route", { action });
      assert.equal(refused.exit, 2, action);
      assert.match(refused.summary.diagnostics.join("\n"), /cannot be read/);
      assert.deepEqual([refused.next, refused.dispatch, refused.saved], ["none", null, null]);
      assert.equal(refused.summary.run, "unknown");
    }
    assert.deepEqual(sequences(w), saved);
    assert.equal(
      (await job(w, "route", { action: "continue" })).exit,
      0,
      "control: a readable store",
    );
  });

  it("only states a dispatched run of this workflow uploaded on the run's branch count", async () => {
    const listed = await githubStore(api(), { currentRun: 9, ref: "main-line" }).list("h3-test");
    assert.deepEqual(
      listed.map((x) => x.workflowRun),
      [1],
    );
    assert.deepEqual(await githubStore(api(), { currentRun: 9, ref: "" }).list("h3-test"), []);
  });

  it("a reply or a fixture receipt is read back only from the harness's own writes", async () => {
    const key = "sha256:abc";
    const request = {
      run: "r",
      step: S02,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "pr-reply",
      target: "t",
      payload: { pull: 7 },
    } as unknown as EffectRequest;
    const marked = `reply\n\n<!-- pactwright-harness effect=${key} -->`;
    const forged = githubEffects(
      api({ comments: [{ id: 1, body: marked, html_url: "u1", user: { login: "intruder" } }] }),
      { repoRoot: scratch, runDir: scratch, ref: "main-line" },
    );
    assert.equal(await forged.inspect?.(key, request), null);
    const own = githubEffects(
      api({
        comments: [{ id: 2, body: marked, html_url: "u2", user: { login: "github-actions[bot]" } }],
      }),
      { repoRoot: scratch, runDir: scratch, ref: "main-line" },
    );
    assert.equal((await own.inspect?.(key, request))?.reference, "u2");
    // A fixture receipt uploaded from another branch is not this run's.
    const fixture = { ...request, action: "fixture-receipt" } as EffectRequest;
    const elsewhere = githubEffects(api(), { repoRoot: scratch, runDir: scratch, ref: "attacker" });
    const here = githubEffects(api(), { repoRoot: scratch, runDir: scratch, ref: "main-line" });
    assert.equal((await here.inspect?.(key, fixture))?.details?.artifact, 201);
    assert.equal((await elsewhere.inspect?.(key, fixture))?.details?.artifact, 202);
    const unknown = githubEffects(api(), { repoRoot: scratch, runDir: scratch, ref: "other" });
    assert.equal(await unknown.inspect?.(key, fixture), null);
  });
});

describe("H3-11 and H3-14 GitHub boundaries", () => {
  it("an inline reply's feedback item keeps its own identity and answers on the thread's first comment", async () => {
    const posts: string[] = [];
    const rows = [
      {
        id: 10,
        pull_request_review_id: 1,
        in_reply_to_id: null,
        user: { login: OWNER },
        body: "first",
        path: GREETING,
        line: 1,
        html_url: "c10",
      },
      {
        id: 11,
        pull_request_review_id: 2,
        in_reply_to_id: 10,
        user: { login: OWNER },
        body: "follow-up",
        path: GREETING,
        line: 1,
        html_url: "c11",
      },
    ];
    const api: GitHubApi = {
      repository: REPOSITORY,
      token: "t",
      request<T>(method: string, path: string): Promise<T> {
        if (method === "POST") {
          posts.push(path);
          return Promise.resolve({} as T);
        }
        if (path.includes("/pulls/7/comments")) {
          return Promise.resolve((/[?&]page=1(&|$)/.test(path) ? rows : []) as T);
        }
        return Promise.resolve([] as T);
      },
    };
    const comments = await githubFeedback(api).reviewComments(7);
    const items = collect(
      { review: null, reviews: [], reviewComments: comments, comments: [] },
      () => true,
      "<!-- pactwright-harness",
    );
    assert.deepEqual(
      items.map((i) => [i.id, i.thread]),
      [
        ["review-comment:10", 10],
        ["review-comment:11", 10],
      ],
    );
    const effects = githubEffects(api, {
      repoRoot: scratch,
      runDir: scratch,
      ref: "main-line",
      wait: () => Promise.resolve(),
    });
    await effects.execute("sha256:k", {
      run: "r",
      step: S02,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "pr-reply",
      target: "t",
      payload: { pull: 7, thread: items[1]?.thread ?? 0, body: "reply" },
    } as unknown as EffectRequest);
    assert.deepEqual(posts, [`/repos/${REPOSITORY}/pulls/7/comments/10/replies`]);
  });

  it("a saved state reports the expiry GitHub records for its artifact", async () => {
    const dir = mkdtempSync(join(scratch, "upload-"));
    writeFileSync(join(dir, "state.tar.gz"), "a");
    writeFileSync(join(dir, "state.json"), "{}");
    // GitHub can report a just-finalized artifact missing (hosted run 37232764758).
    const store = (missing: number, waits: number[]) =>
      githubStore(
        {
          repository: REPOSITORY,
          token: "t",
          request<T>(_method: string, path: string): Promise<T> {
            assert.equal(path, `/repos/${REPOSITORY}/actions/artifacts/4242`);
            if (missing-- > 0) return Promise.reject(new GitHubError(`GET ${path}: 404`, 404));
            return Promise.resolve({
              id: 4242,
              name: "harness-h3-test-000003",
              expired: false,
              expires_at: "2026-12-30T10:00:00Z",
              workflow_run: { id: 77 },
            } as T);
          },
        },
        {
          currentRun: 77,
          ref: "main-line",
          client: {
            uploadArtifact: () => Promise.resolve({ id: 4242, size: 2 }),
            downloadArtifact: () => Promise.reject(new Error("unused")),
          } as unknown as NonNullable<Parameters<typeof githubStore>[1]["client"]>,
          wait: (ms) => {
            waits.push(ms);
            return Promise.resolve();
          },
        },
      );
    const files = { archive: join(dir, "state.tar.gz"), manifest: join(dir, "state.json") };
    for (const missing of [0, 2]) {
      const waits: number[] = [];
      const saved = await store(missing, waits).upload("h3-test", 3, files);
      assert.deepEqual(
        [saved.id, saved.expiresAt, saved.workflowRun],
        ["4242", "2026-12-30T10:00:00Z", 77],
      );
      assert.deepEqual(waits, SETTLE_MS.slice(0, missing));
    }
    const waits: number[] = [];
    await assert.rejects(
      store(SETTLE_MS.length + 1, waits).upload("h3-test", 3, files),
      /harness-h3-test-000003: GitHub does not show the uploaded artifact 4242/,
    );
    assert.deepEqual(waits, [...SETTLE_MS]);
  });

  it("a dispatched review is read back once GitHub lists its run, and is not sent twice", async () => {
    const request = {
      run: "r",
      step: S04,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "review-dispatch",
      target: "t",
      payload: {
        workflow: "checkpoint-harness-verify.yml",
        ref: "harness/r",
        commit: "a".repeat(40),
        inputs: { live: "false" },
      },
    } as unknown as EffectRequest;
    const dispatch = async (unlisted: number) => {
      const posts: string[] = [];
      const waits: number[] = [];
      const effects = githubEffects(
        {
          repository: REPOSITORY,
          token: "t",
          request<T>(method: string, path: string): Promise<T> {
            if (method === "POST") {
              posts.push(path);
              return Promise.resolve(null as T);
            }
            if (path.endsWith("/git/ref/heads/harness/r")) {
              return Promise.resolve({ object: { sha: "a".repeat(40) } } as T);
            }
            assert.match(path, /\/actions\/workflows\/checkpoint-harness-verify\.yml\/runs\?/);
            const run = { id: 91, html_url: "https://github.com/runs/91" };
            return Promise.resolve({ workflow_runs: unlisted-- > 0 ? [] : [run] } as T);
          },
        },
        {
          repoRoot: scratch,
          runDir: scratch,
          ref: "main-line",
          wait: (ms) => {
            waits.push(ms);
            return Promise.resolve();
          },
        },
      );
      return { receipt: await effects.execute("sha256:k", request), posts, waits };
    };
    const dispatches = [
      `/repos/${REPOSITORY}/actions/workflows/checkpoint-harness-verify.yml/dispatches`,
    ];
    for (const unlisted of [0, 3]) {
      const { receipt, posts, waits } = await dispatch(unlisted);
      assert.equal(receipt?.reference, "https://github.com/runs/91");
      assert.deepEqual(posts, dispatches);
      assert.deepEqual(waits, SETTLE_MS.slice(0, unlisted));
    }
    // Never listed: the outcome is uncertain, for the runner to read back, not a second dispatch.
    const { receipt, posts, waits } = await dispatch(SETTLE_MS.length + 1);
    assert.equal(receipt, null);
    assert.deepEqual(posts, dispatches);
    assert.deepEqual(waits, [...SETTLE_MS]);
  });

  it("a malformed dispatch is refused at the command line with every run field unknown", () => {
    const dir = mkdtempSync(join(scratch, "cli-"));
    const summaryFile = join(dir, "summary.md");
    const outputFile = join(dir, "output");
    const ran = spawnSync(
      process.execPath,
      ["--import", "tsx", join(here, "../src/cli.ts"), "workflow", "route"],
      {
        cwd: join(here, ".."),
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? "",
          HARNESS_ACTION: "approve",
          HARNESS_RUN: "Not A Run",
          GITHUB_STEP_SUMMARY: summaryFile,
          GITHUB_OUTPUT: outputFile,
          GITHUB_REPOSITORY: REPOSITORY,
          GITHUB_RUN_ID: "123",
        },
      },
    );
    assert.equal(ran.status, 2, ran.stderr);
    const printed = JSON.parse(ran.stdout) as { summary: Summary };
    const expected = refusedSummary(
      "approve",
      `https://github.com/${REPOSITORY}/actions/runs/123`,
      printed.summary.diagnostics,
    );
    assert.deepEqual(checkSummary(printed.summary, expected), []);
    for (const field of FIELDS.filter((f) => f !== "next"))
      assert.equal(printed.summary[field], "unknown", field);
    assert.match(printed.summary.diagnostics.join("\n"), /run Not A Run is not a run name/);
    const rendered = readFileSync(summaryFile, "utf8");
    assert.equal(rendered, renderSummary(printed.summary));
    for (const row of [
      "| Run | unknown |",
      "| Accepted steps | unknown |",
      "| Saved-state identity | unknown |",
    ]) {
      assert.ok(rendered.includes(row), row);
    }
    assert.match(readFileSync(outputFile, "utf8"), /^next=none$/m);
  });
});

/** The saved state of one sequence, restored for inspection. */
function savedDirOf(w: World, sequence: number): string {
  const found = w.store.states.find((s) => s.name === w.run && s.sequence === sequence);
  assert.ok(found);
  const dir = mkdtempSync(join(w.scratch, "seq-"));
  execFileSync("tar", ["-xzf", join(found.dir, "state.tar.gz"), "-C", dir]);
  return dir;
}

/** A store that shows a job the state as it was before `hideFrom`, for its first `views` listings. */
class StaleView implements StateStore {
  private listings = 0;
  constructor(
    private readonly inner: StateStore,
    private readonly hideFrom: number,
    private readonly views: number,
  ) {}
  async list(name: string): Promise<SavedState[]> {
    const all = await this.inner.list(name);
    this.listings += 1;
    return this.listings <= this.views ? all.filter((s) => s.sequence < this.hideFrom) : all;
  }
  download(saved: SavedState, into: string): Promise<StateFiles> {
    return this.inner.download(saved, into);
  }
  upload(name: string, sequence: number, files: StateFiles): Promise<SavedState> {
    return this.inner.upload(name, sequence, files);
  }
}

describe("H3-02 one controller owns the run", () => {
  it("an active owner is not taken over; once its job has ended, it is", async () => {
    const w = world(scratch);
    await toPublished(w);
    // A job lost while it still runs: its owner record stays unreleased and its job active.
    const v = world(scratch);
    const pending = await toApproval(v);
    await dispatch(v, { action: "approve", ...pending });
    const lost = await dispatch(
      v,
      { action: "continue", fault: "crash-after-intent" },
      { live: true },
    );
    assert.ok(last(lost).error instanceof Crash);
    const saved = sequences(v);
    const refused = await dispatch(v, { action: "continue" });
    assert.equal(last(refused).exit, 2);
    assert.match(
      last(refused).summary.diagnostics.join("\n"),
      /\(live\); only a released or dead owner/,
    );
    assert.deepEqual(sequences(v), saved, "a refused takeover writes nothing");
    // Control: the job has ended, so the next controller takes the run over.
    const lostJob = last(lost);
    v.github.jobs.set(`${lostJob.runId}/1/effects`, "completed");
    const resumed = await dispatch(v, { action: "continue" });
    assert.equal(last(resumed).exit, 0, stringify(last(resumed).summary));
  });

  it("an owner whose job cannot be verified is unknown and not taken over", async () => {
    const v = world(scratch);
    const pending = await toApproval(v);
    await dispatch(v, { action: "approve", ...pending });
    const lost = await dispatch(v, { action: "continue", fault: "crash-after-intent" });
    v.github.jobs.delete(`${last(lost).runId}/1/effects`);
    const refused = await dispatch(v, { action: "continue" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /\(unknown\)/);
  });

  it("two controllers restoring one state cannot both write it", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    const top = Math.max(...sequences(w));
    // A writes on from the latest state.
    const first = await dispatch(w, { action: "status" });
    assert.equal(last(first).exit, 0);
    const a = await dispatch(w, { action: "continue" });
    assert.equal(last(a).exit, 0);
    const written = sequences(w);
    assert.ok(Math.max(...written) > top);
    // B restored the same state before A saved: its first save is fenced.
    const stale = new StaleView(w.store, top + 1, 1);
    const b = { ...w, store: stale as unknown as typeof w.store };
    await assert.rejects(
      () => job(b, "route", { action: "continue" }),
      /another controller owns the run/,
    );
    assert.deepEqual(sequences(w), written, "the fenced controller saved nothing");
  });
});

describe("H3-03 counters survive yields and runner loss", () => {
  it("a planned yield keeps attempts, retries and spending, and the run continues", async () => {
    const w = world(scratch);
    const early = Date.now() - 10 * 60 * 1000;
    let outcomes = await dispatch(w, START, { started: early });
    let continuations = 0;
    while (last(outcomes).next === "continue") {
      continuations += 1;
      const facts = await factsOf(w);
      assert.equal(last(outcomes).dispatch?.run, w.run);
      outcomes = await dispatch(w, { action: "continue" }, { started: early });
      const after = await factsOf(w);
      assert.ok(after.spending.reportedUsd >= facts.spending.reportedUsd);
    }
    assert.ok(continuations >= 2, `yielded ${continuations} times`);
    const facts = await factsOf(w);
    assert.equal(facts.spending.unresolved, 0);
    // Yields never repeat a phase or a production attempt.
    const starts = recordsOf<{ key: string }>(w, "start").map((s) => s.key);
    assert.equal(new Set(starts).size, starts.length);
    assert.deepEqual(
      recordsOf<{ attempt: number; step: string }>(w, "evaluation").map((e) => e.attempt),
      [1],
    );
    assert.match(last(outcomes).summary.next, /approve or deny/);
  });

  it("a runner lost in an agent session keeps the session's allowance reserved, and the retry counts", async () => {
    const w = world(scratch);
    const good = fixtureProducer();
    let crashed = false;
    w.producer = Object.assign(
      (request: Parameters<typeof good>[0]) => {
        if (!crashed) {
          crashed = true;
          throw new Crash("the runner was lost in the session");
        }
        return good(request);
      },
      { requests: good.requests, packets: good.packets },
    );
    const lost = await dispatch(w, START);
    assert.ok(last(lost).error instanceof Crash);
    const reserved = await factsOf(w);
    assert.deepEqual([reserved.spending.unresolved, reserved.spending.reservedUsd], [1, 2]);
    const resumed = await dispatch(w, { action: "continue" });
    assert.match(last(resumed).summary.next, /approve or deny/);
    const after = await factsOf(w);
    assert.equal(after.spending.unresolved, 1, "the lost session stays reserved");
    assert.equal(after.spending.reservedUsd, 2);
    const keys = recordsOf<{ key: string }>(w, "start").map((s) => s.key);
    assert.equal(keys.filter((k) => k === `produce/${S01}/1`).length, 2, "the rerun is a retry");
  });

  it("the run spend limit pauses before a session it cannot cover", async () => {
    const w = world(scratch, {
      edit: (t) => t.replace("run_spend_usd: 40", "run_spend_usd: 2.005"),
    });
    const paused = await dispatch(w, START);
    const summary = last(paused).summary;
    assert.equal(summary.outcome, "paused");
    assert.match(stringify(summary.pause), /spend limit cannot cover another session/);
    const facts = await factsOf(w);
    assert.equal(facts.accepted.length, 0);
    assert.ok(facts.spending.reportedUsd > 0);
  });
});

describe("H3-04 jobs hold only the credentials their work needs", () => {
  it("only the controller job needs the provider credential", async () => {
    const w = world(scratch);
    // The route job starts the run without it and hands the agents' work on.
    const routed = await job(w, "route", START, { env: {} });
    assert.equal(routed.exit, 0, stringify(routed.summary));
    assert.equal(routed.next, "controller");
    // A controller job without the credential refuses before any agent runs.
    const saved = sequences(w);
    const keyless = await job(w, "controller", { action: "continue" }, { env: {} });
    assert.equal(keyless.exit, 2);
    assert.match(keyless.summary.diagnostics.join("\n"), /CLAUDE_CODE_OAUTH_TOKEN/);
    assert.deepEqual(sequences(w), saved);
    // Control: with it, the controller runs the agents.
    const keyed = await job(w, "controller", { action: "continue" });
    assert.match(keyed.summary.next, /approve or deny/);
    // The effects job performs the approved effect without it.
    const pending = pendingOf(keyed);
    assert.equal((await job(w, "route", { action: "approve", ...pending }, { env: {} })).exit, 0);
    const route = await job(w, "route", { action: "continue" }, { env: {} });
    assert.equal(route.next, "effects");
    const effects = await job(w, "effects", { action: "continue" }, { env: {} });
    assert.equal(effects.exit, 0, stringify(effects.summary));
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
  });

  it("an effects job runs no candidate code or agent; it hands such work to a controller", async () => {
    const w = world(scratch);
    const routed = await job(w, "route", START);
    assert.equal(routed.next, "controller");
    const effects = await job(w, "effects", { action: "continue" });
    assert.equal(effects.exit, 0);
    assert.match(stringify(effects.summary.pause), /hand-off controller/);
    assert.equal(effects.next, "continue");
    assert.deepEqual(recordsOf(w, "agent-invocation"), []);
    assert.deepEqual(recordsOf(w, "start"), []);
  });
});

describe("H3-05 approvals and denials are bound to the GitHub actor, request and candidate", () => {
  it("an authorised approval of the exact request permits its effect once", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    const approved = await dispatch(w, { action: "approve", ...pending });
    assert.equal(last(approved).exit, 0);
    // The decision is applied by the next continuation, and the summary says so.
    assert.equal(
      last(approved).summary.next,
      "continue: the next job applies the recorded decision",
    );
    const [approval] = recordsOf<{
      actor: string;
      request: string;
      decision: string;
      candidate: string;
    }>(w, "approval");
    assert.deepEqual(
      [approval?.actor, approval?.request, approval?.decision, approval?.candidate],
      [OWNER, pending.request, "approved", pending.candidate],
    );
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
  });

  it("a requirement only an approval proves is the approver's: a strict reviewer cannot block its request", async () => {
    const w = world(scratch);
    const subjects: string[][] = [];
    // A reviewer that, like the live one in h3-proof-6 (job 111651959214),
    // cannot judge CP95-S01/R02 from the candidate and says so.
    w.reviewer = scriptedAgent(({ packet }) => {
      const verdict = verdictFor(packet);
      subjects.push(packet.review?.subjects ?? []);
      const strict = verdict.coverage.map((c) =>
        c.subject === `${S01}/R02` ? { ...c, result: "not-assessed" as const } : c,
      );
      return { output: { ...verdict, coverage: strict } };
    });
    const pending = await toApproval(w);
    // The step's common review, after the verifier's adequacy review.
    const common = subjects.filter((x) => x.includes(`${S01}/greeting`));
    assert.deepEqual(common, [[`${S01}/R01`, `${S01}/greeting`]]);
    assert.match(pending.request, /^sha256:/);
    // The approval still gates the step: unanswered, nothing is accepted.
    assert.deepEqual((await factsOf(w)).accepted, []);
    await dispatch(w, { action: "approve", ...pending });
    await dispatch(w, { action: "continue" });
    assert.deepEqual((await factsOf(w)).accepted, [S01]);
  });

  it("a denial is recorded; its effect never runs and the step stays unaccepted", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    const denied = last(await dispatch(w, { action: "deny", ...pending }));
    assert.equal(denied.exit, 0);
    assert.equal(denied.summary.next, "continue: the next job applies the recorded decision");
    const continued = await dispatch(w, { action: "continue" });
    assert.match(stringify(last(continued).summary.pause), /denied by sb-dev/);
    assert.equal(last(continued).summary.next, "resolve the named pause reason, then continue");
    assert.deepEqual((await factsOf(w)).accepted, []);
    assert.equal(w.github.executions.length, 0);
  });

  for (const action of ["approve", "deny"] as const) {
    it(`${action}: an unauthorised actor, a stale request and another candidate are refused`, async () => {
      const w = world(scratch);
      const pending = await toApproval(w);
      const saved = sequences(w);
      const intruder = await dispatch(w, { action, ...pending }, { actor: "intruder" });
      assert.equal(last(intruder).exit, 2);
      assert.match(
        last(intruder).summary.diagnostics.join("\n"),
        /intruder does not hold the owner authority/,
      );
      const other = await dispatch(w, {
        action,
        request: pending.request,
        candidate: "0".repeat(40),
      });
      assert.equal(last(other).exit, 2);
      assert.match(last(other).summary.diagnostics.join("\n"), /is not the candidate/);
      assert.deepEqual(sequences(w), saved, "refusals record nothing");
      assert.deepEqual(recordsOf(w, "approval"), []);
      // A stale request: the reviewer's effort is amended, so the evaluation and its request are new.
      const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
      assert.equal(
        last(
          await dispatch(w, {
            action: "amend",
            config_revision: revision,
            reason: "a deeper review",
          }),
        ).exit,
        0,
      );
      const renewed = await dispatch(w, { action: "continue" });
      const fresh = pendingOf(last(renewed));
      assert.notEqual(fresh.request, pending.request);
      const stale = await dispatch(w, { action, ...pending });
      assert.equal(last(stale).exit, 2);
      assert.match(last(stale).summary.diagnostics.join("\n"), /superseded|stale/);
      assert.deepEqual(recordsOf(w, "approval"), []);
      assert.equal(w.github.executions.length, 0);
      // Control: the fresh request is decided.
      assert.equal(last(await dispatch(w, { action, ...fresh })).exit, 0);
      assert.equal(recordsOf(w, "approval").length, 1);
    });
  }
});

describe("H3-06 effects survive interruption without repetition", () => {
  it("a write GitHub declines pauses with its cause, and a continuation after the fix performs it once", async () => {
    // Hosted run h3-proof-7, effects job 111694905162: opening the pull
    // request was declined while Actions could not create pull requests.
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    w.github.blocked.add("open-pr");
    const blocked = last(await dispatch(w, { action: "continue" }));
    assert.equal(blocked.exit, 0, "an orderly pause, not a crash");
    assert.match(
      stringify(blocked.summary.pause),
      /effect-blocked .*open-pr .*was not performed: GitHub declined it/,
    );
    assert.equal(blocked.summary.next, "fix the cause the named effect reports, then continue");
    assert.equal(w.github.pulls.size, 0);
    w.github.blocked.delete("open-pr");
    const continued = last(await dispatch(w, { action: "continue" }));
    assert.equal(continued.summary.outcome, "selection-accepted", stringify(continued.summary));
    assert.equal(w.github.pulls.size, 1);
    assert.equal(w.github.executions.filter((e) => e.action === "open-pr").length, 1);
  });

  it("GitHub's refusal of a write is a declined effect; a server error is not", async () => {
    const request = {
      run: "r",
      step: S01,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "open-pr",
      target: "t",
      payload: { head: "harness/r", base: BRANCH, title: "t", body: "b", draft: true },
    } as unknown as EffectRequest;
    const effects = (status: number) =>
      githubEffects(
        {
          repository: REPOSITORY,
          token: "t",
          request<T>(method: string, path: string): Promise<T> {
            if (method === "POST") {
              return Promise.reject(new GitHubError(`POST ${path}: ${status} no`, status));
            }
            return Promise.resolve([] as T);
          },
        },
        { repoRoot: scratch, runDir: scratch, ref: "main-line", wait: () => Promise.resolve() },
      );
    for (const status of [401, 403, 404, 422]) {
      await assert.rejects(effects(status).execute("sha256:k", request), EffectBlocked);
    }
    await assert.rejects(
      effects(502).execute("sha256:k", request),
      (e) => !(e instanceof EffectBlocked),
    );
  });

  it("a write GitHub performed stays uncertain when reading it back is declined, and is found later", async () => {
    // Review 5412894516: only the write itself is a declined effect.
    const request = {
      run: "r",
      step: S01,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "pr-reply",
      target: "t",
      payload: { pull: 7, body: "**Declined**" },
    } as unknown as EffectRequest;
    const posted: { id: number; body: string; user: { login: string }; html_url: string }[] = [];
    let readable = false;
    const effects = githubEffects(
      {
        repository: REPOSITORY,
        token: "t",
        request<T>(method: string, path: string, body?: unknown): Promise<T> {
          if (method === "POST") {
            const id = posted.length + 1;
            const text = (body as { body: string }).body;
            posted.push({
              id,
              body: text,
              user: { login: "github-actions[bot]" },
              html_url: `c${id}`,
            });
            return Promise.resolve({} as T);
          }
          if (!readable) {
            return Promise.reject(new GitHubError(`GET ${path}: 403 not accessible`, 403));
          }
          return Promise.resolve((path.includes("/issues/7/comments") ? posted : []) as T);
        },
      },
      { repoRoot: scratch, runDir: scratch, ref: "main-line", wait: () => Promise.resolve() },
    );
    await assert.rejects(
      effects.execute("sha256:k", request),
      (e) => e instanceof GitHubError && !(e instanceof EffectBlocked),
    );
    assert.equal(posted.length, 1);
    readable = true;
    assert.equal((await effects.inspect?.("sha256:k", request))?.reference, "c1");
    assert.equal(posted.length, 1);
  });

  it("an effect whose read-back fails after the write is reconciled by the next job, not repeated", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    w.github.unreadable.add("open-pr");
    // The effects job stops on the failed read, never reporting the write as not performed.
    await assert.rejects(dispatch(w, { action: "continue" }), GitHubError);
    assert.equal(w.github.pulls.size, 1);
    w.github.unreadable.delete("open-pr");
    const continued = last(await dispatch(w, { action: "continue" }));
    assert.equal(continued.summary.outcome, "selection-accepted", stringify(continued.summary));
    assert.doesNotMatch(stringify(continued.summary), /not performed/);
    assert.equal(w.github.executions.filter((e) => e.action === "open-pr").length, 1);
    const key = w.github.executions.find((e) => e.action === "open-pr")?.key;
    assert.deepEqual(
      recordsOf<{ key: string; reconciled: boolean }>(w, "effect-receipt")
        .filter((r) => r.key === key)
        .map((r) => r.reconciled),
      [true],
    );
  });

  it("a runner lost after the intent, before the effect, runs it once on recovery", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    const lost = await dispatch(w, { action: "continue", fault: "crash-after-intent" });
    assert.ok(last(lost).error instanceof Crash);
    assert.equal(w.github.executions.length, 0);
    assert.equal(recordsOf(w, "effect-intent").length, 1);
    assert.equal(recordsOf(w, "effect-receipt").length, 0, "no completion without a receipt");
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    const [receipt] = recordsOf<{ reconciled: boolean }>(w, "effect-receipt");
    assert.equal(receipt?.reconciled, false);
  });

  it("a runner lost after the effect, before its receipt, reads it back and never repeats it", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    const lost = await dispatch(w, { action: "continue", fault: "crash-after-effect" });
    assert.ok(last(lost).error instanceof Crash);
    assert.equal(w.github.executions.length, 1);
    assert.equal(recordsOf(w, "effect-receipt").length, 0);
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    const [receipt] = recordsOf<{ reconciled: boolean }>(w, "effect-receipt");
    assert.equal(receipt?.reconciled, true);
  });

  it("a fault needs a template that allows faults", async () => {
    const w = world(scratch, { edit: (t) => t.replace("faults: true", "faults: false") });
    const refused = await dispatch(w, { ...START, fault: "crash-after-intent" });
    assert.equal(last(refused).exit, 2);
    assert.deepEqual(sequences(w), []);
  });
});

describe("H3-07 the selection boundary", () => {
  it("start without through selects the first step; with a valid one it records that one", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    assert.equal((await factsOf(w)).boundary, S01);
    const v = world(scratch);
    await dispatch(v, { ...START, through: S02 });
    assert.equal((await factsOf(v)).boundary, S02);
  });

  it("continue keeps the saved boundary, and records a valid extension", async () => {
    const w = world(scratch);
    await toPublished(w);
    await dispatch(w, { action: "continue" });
    assert.equal((await factsOf(w)).boundary, S01);
    await dispatch(w, { action: "continue", through: S02 });
    assert.equal((await factsOf(w)).boundary, S02);
    const [extension] = recordsOf<{ actor: string; reason: string; changes: ConfigChange[] }>(
      w,
      "amendment",
    );
    assert.equal(extension?.actor, OWNER);
    assert.deepEqual(
      extension?.changes.map((c) => [c.path, c.old, c.new]),
      [["/selection/through", S01, S02]],
    );
  });

  it("invalid boundaries are refused without starting or changing the run", async () => {
    const w = world(scratch);
    const refused = await dispatch(w, { ...START, through: "CP95-S09" });
    assert.equal(last(refused).exit, 2);
    assert.deepEqual(sequences(w), []);
    const malformed = parseInputs({ action: "start", run: w.run, through: "S01" });
    assert.equal(malformed.ok, false);
    await dispatch(w, { ...START, through: S02 });
    const saved = sequences(w);
    for (const through of ["CP95-S01", "CP95-S02", "CP95-S07"]) {
      const not = await dispatch(w, { action: "continue", through });
      assert.equal(last(not).exit, 2, through);
      assert.deepEqual(sequences(w), saved, through);
    }
    assert.equal((await factsOf(w)).boundary, S02);
  });

  it("an automatic continuation never extends the selection", async () => {
    const w = world(scratch);
    const early = Date.now() - 10 * 60 * 1000;
    const outcomes = await dispatch(w, START, { started: early });
    assert.equal(last(outcomes).next, "continue");
    assert.deepEqual(Object.keys(last(outcomes).dispatch ?? {}).sort(), ["ref", "run"]);
    await dispatch(w, { action: "continue" }, { started: early });
    assert.equal((await factsOf(w)).boundary, S01);
    assert.equal(recordsOf(w, "amendment").length, 0);
  });
});

/**
 * The acceptance input of a step's latest evaluation, rebuilt from the saved
 * journal as the controller builds it, so a decision can be taken again.
 */
async function redecide(w: World, step: string): Promise<AcceptanceInput> {
  const dir = savedDir(w);
  const read = readRun(dir);
  assert.ok(read.ok);
  const { events, manifest, owner, head } = read.records;
  const handle: RunHandle = {
    dir,
    run: manifest.run,
    epoch: owner.epoch,
    fd: null,
    seq: (events.at(-1)?.seq ?? 0) + 1,
    prev: head,
    length: 0,
  };
  const configured = pinned(dir, events);
  assert.ok(configured);
  const prepared = await prepareRun(configured.config, {
    repoRoot: w.repo.root,
    applicability: APPLICABILITY,
  });
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  const { plan } = prepared;
  const evaluation = recordsOf<EvaluationOf>(w, "evaluation", dir)
    .filter((e) => e.step === step)
    .at(-1);
  assert.ok(evaluation);
  const bindings = configured.config.verification?.bindings ?? "";
  const known = new Map(
    [
      ...plan.inherited.targets,
      ...plan.steps.flatMap((x) => (x.kind === "contract" ? x.targets : [])),
    ].map((t) => [t.binding, t.method] as const),
  );
  const registry = createRegistry([...FIXTURE_BINDINGS]);
  assert.ok(registry.ok);
  const declared = declaredRegistry(
    registry.registry,
    [...treeFiles(dir, evaluation.candidate.tree, bindings)].map(([path, bytes]) => ({
      path,
      bytes,
    })),
    bindings,
    known,
  );
  return journalInput(handle, {
    plan,
    step,
    run: manifest.run,
    attempt: evaluation.attempt,
    manifest: evaluation.manifest,
    registry: declared.registry,
    policy: { writable: configured.config.permissions.writable, scratch: [], protected: [] },
    claims: evaluation.claims,
    declarations: { dir: bindings, rejected: declared.rejected },
  });
}

describe("H3-08 operational steps", () => {
  it("operational guidance travels only in operational packets; the producer prompt is the one H2 admitted", async () => {
    const w = world(scratch);
    const prepared = await prepareRun(
      {
        repository: { name: REPOSITORY, branch: BRANCH, expected_head: w.repo.head },
        checkpoint: `${H}/docs/checkpoints/95-hosted/checkpoint.yml`,
        definitions: { revision: w.repo.head, review: "x" },
        selection: { through: S02 },
      },
      { repoRoot: w.repo.root },
    );
    assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
    const producer = { name: "producer" as const, skills: [] };
    const policy = { writable: [WORK], scratch: [], protected: [] };
    const contract = buildPacket(prepared.plan, S01, producer, {
      attempt: 1,
      accepted: [],
      policy,
    });
    assert.ok(contract.ok);
    // The digest of the producer prompt H2's live proof ran with (job 111430653474).
    assert.equal(
      contract.packet.template,
      "sha256:8c02b311fb64cb52f19f9021cbea40cbc51aa4721c49df961616a62a0da19b3e",
    );
    assert.equal(contract.packet.step.operation, undefined);
    assert.equal(contract.packet.step.procedure, undefined);
    const accepted: AcceptedOutput[] = [
      {
        step: S01,
        output: "greeting",
        definition: prepared.plan.stepDefinitions[S01] ?? "",
        definitions: prepared.plan.definitionsDigest,
        evidence: ["sha256:x"],
      },
    ];
    const operational = buildPacket(prepared.plan, S02, producer, { attempt: 1, accepted, policy });
    assert.ok(operational.ok, operational.ok ? "" : operational.diagnostics.join("\n"));
    assert.equal(operational.packet.template, contract.packet.template);
    assert.equal(operational.packet.step.operation, OPERATION_GUIDANCE);
    assert.match(operational.packet.step.procedure ?? "", /^sha256:/);
  });

  it("the reviewed procedure runs in its target and is accepted on its command evidence", async () => {
    const w = world(scratch);
    await toS02(w);
    const decisions = recordsOf<Decision & { decision: "accept" }>(w, "acceptance").filter(
      (d) => d.step === S02,
    );
    assert.equal(decisions.length, 1);
    const producer = recordsOf<AgentOutcome>(w, "agent-invocation")
      .filter((o) => o.observation.role === "producer")
      .at(-1);
    const commands = producer?.observation.toolCalls.filter((c) => c.tool === "run_command") ?? [];
    assert.equal(commands.length, 1);
    assert.equal(commands[0]?.exit, 0);
    assert.ok(commands[0]?.stdout && decisions[0]?.evidence.includes(commands[0].stdout));
    // The procedure landed a revision: the stamp is in the published candidate.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.equal(
      execFileSync("git", ["show", `${head}:${STAMP}`], { cwd: w.repo.root, encoding: "utf8" }),
      "stamp: Hello, Pactwright!\n",
    );
  });

  it("a procedure with no command evidence is not accepted", async () => {
    const w = world(scratch);
    w.producer = fixtureProducer({ runCommands: false });
    await toPublished(w);
    const extended = await dispatch(w, { action: "continue", through: S02 });
    // Each attempt corrects the step; the run stops on S02 without accepting it.
    assert.match(stringify(last(extended).summary.pause), /CP95-S02/);
    assert.ok(!(await factsOf(w)).accepted.includes(S02));
    const findings = recordsOf<Decision>(w, "decision").flatMap((d) =>
      d.decision === "correct" ? d.findings.map((f) => f.defect) : [],
    );
    assert.ok(findings.some((d) => /no command of the procedure was executed/.test(d)));
  });

  it("a procedure whose observation evidence is missing is not accepted", async () => {
    const w = world(scratch);
    await toS02(w);
    const input = await redecide(w, S02);
    const recorded = decideAcceptance(input);
    assert.equal(recorded.decision, "accept", stringify(recorded));
    const producer = input.producer;
    assert.ok(producer);
    const outputs = producer.record.observation.toolCalls.flatMap((c) => [c.stdout, c.stderr]);
    assert.equal(outputs.length, 2);
    const unjournaled = new Set([...input.journaled].filter((r) => !outputs.includes(r)));
    const missing = decideAcceptance({ ...input, journaled: unjournaled });
    assert.equal(missing.decision, "correct");
    assert.ok(
      missing.decision === "correct" &&
        missing.findings.some((f) =>
          /observation evidence of a command, its recorded output, is missing/.test(f.defect),
        ),
    );
  });

  it("a procedure can change repository: it runs in its declared target and the candidate's evidence stays", async () => {
    const w = world(scratch, { registry: true });
    await toS02(w);
    const before = await factsOf(w);
    const published = w.github.branches.get(`harness/${w.run}`);
    const extended = await dispatch(w, { action: "continue", through: S03 });
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    const after = await factsOf(w);
    assert.deepEqual(after.accepted, [S01, S02, S03]);
    // Step 3's candidate is the registry's next revision, not the published candidate's.
    const [s03] = recordsOf<Decision & { decision: "accept"; targets: string[] }>(
      w,
      "acceptance",
    ).filter((d) => d.step === S03);
    assert.ok(s03);
    assert.deepEqual(s03.targets, [], "the candidate's checks do not run in the registry");
    const dir = savedDir(w);
    const releases = execFileSync(
      "git",
      ["--git-dir", join(dir, "source.git"), "show", `${s03.candidate}:${RELEASES}`],
      {
        encoding: "utf8",
      },
    );
    assert.match(releases, /released: CP94\nreleased: CP95\n$/);
    const [command] =
      recordsOf<AgentOutcome>(w, "agent-invocation", dir)
        .filter((o) => o.observation.role === "producer")
        .at(-1)
        ?.observation.toolCalls.filter((c) => c.tool === "run_command") ?? [];
    assert.deepEqual([command?.target, command?.exit], ["node record.mjs CP95", 0]);
    // Earlier acceptances stay current; the candidate is not republished.
    for (const step of [S01, S02]) {
      assert.equal(
        after.evidence.find((e) => e.step === step)?.acceptance,
        before.evidence.find((e) => e.step === step)?.acceptance,
        step,
      );
    }
    assert.equal(w.github.branches.get(`harness/${w.run}`), published);
  });

  it("a procedure in a fixture repository root runs there, and a later job restores and continues on the candidate", async () => {
    // As the hosted template declares it: the registry root at a pinned revision of this repository.
    const w = world(scratch);
    await toPublished(w);
    const extended = await settle(w, await dispatch(w, { action: "continue", through: S04 }));
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    assert.deepEqual((await factsOf(w)).accepted, [S01, S02, S03, S04]);
    const dir = savedDir(w);
    const [s03] = recordsOf<Decision & { decision: "accept" }>(w, "acceptance", dir).filter(
      (d) => d.step === S03,
    );
    assert.ok(s03);
    const files = execFileSync(
      "git",
      ["--git-dir", join(dir, "source.git"), "ls-tree", "--name-only", s03.candidate],
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n");
    assert.deepEqual(
      files,
      ["README.md", "RELEASES.md", "record.mjs"],
      "the workspace held the registry root",
    );
    // S03 and S04 ran in separate jobs: S04 restored the state S03's job saved.
    const owners = eventsOf(w, dir).filter((e) => e.action === "owner");
    const acceptedIn = (step: string): number | undefined => {
      const seq =
        eventsOf(w, dir).find((e) => e.action === "acceptance" && e.data.step === step)?.seq ?? 0;
      return (owners.filter((o) => o.seq < seq).at(-1)?.data.github as { run_id: number } | null)
        ?.run_id;
    };
    assert.notEqual(acceptedIn(S03), undefined);
    assert.ok(eventsOf(w, dir).some((e) => e.action === "acceptance" && e.data.step === S04));
    // The candidate's published head never holds the registry's files.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.throws(() =>
      execFileSync("git", ["cat-file", "-e", `${head}:record.mjs`], {
        cwd: w.repo.root,
        stdio: "ignore",
      }),
    );
  });

  it("hosted jobs fetch an operation target's pinned revision, from this repository or another", async () => {
    // A server of two repositories, reached as GitHub's would be.
    const server = mkdtempSync(join(scratch, "server-"));
    const other = registryRepo(scratch);
    mkdirSync(join(server, "sb-dev"));
    execFileSync("git", ["clone", "-q", "--bare", other.root, join(server, "sb-dev/registry.git")]);
    const root = mkdtempSync(join(scratch, "checkout-"));
    execFileSync("git", ["init", "-q"], { cwd: root });
    const resolve = targetRepositories(
      { repository: REPOSITORY, token: "t", request: () => Promise.reject(new Error("no API")) },
      {
        root,
        server: `file://${server}`,
        header: "x-test: 1",
        temp: mkdtempSync(join(scratch, "temp-")),
      },
    );
    const fetched = await resolve("sb-dev/registry", other.head);
    assert.ok(fetched);
    assert.equal(
      execFileSync("git", ["rev-parse", `${other.head}^{tree}`], {
        cwd: fetched,
        encoding: "utf8",
      }).trim(),
      execFileSync("git", ["rev-parse", `${other.head}^{tree}`], {
        cwd: other.root,
        encoding: "utf8",
      }).trim(),
    );
    assert.equal(
      await resolve("sb-dev/registry", "0".repeat(40)),
      null,
      "an absent revision is not available",
    );
    assert.equal(await resolve("sb-dev/missing", other.head), null);
  });

  it("a procedure evaluated outside its declared target is not accepted", async () => {
    const w = world(scratch, { registry: true });
    await toS02(w);
    await dispatch(w, { action: "continue", through: S03 });
    const input = await redecide(w, S03);
    assert.equal(decideAcceptance(input).decision, "accept");
    assert.deepEqual(input.manifest.operation, { target: "registry", revision: w.registry?.head });
    const elsewhere = decideAcceptance({
      ...input,
      manifest: { ...input.manifest, operation: { target: "candidate", revision: null } },
    });
    assert.equal(elsewhere.decision, "pause");
    assert.ok(
      elsewhere.decision === "pause" &&
        elsewhere.reasons.some(
          (r) => r.route === "owner" && /not its declared target/.test(r.detail),
        ),
    );
  });

  it("changed or unreviewed prose is refused at planning, so it never runs", async () => {
    const w = world(scratch);
    const planAt = (revision: string): ReturnType<typeof prepareRun> =>
      prepareRun(
        {
          repository: { name: "sb-dev/pactwright", branch: BRANCH, expected_head: w.repo.head },
          checkpoint: `${H}/docs/checkpoints/95-hosted/checkpoint.yml`,
          definitions: { revision, review: "x" },
          selection: { through: S02 },
        },
        { repoRoot: w.repo.root },
      );
    const commit = (path: string, edit: (text: string) => string): string => {
      const file = join(w.repo.root, H, path);
      writeFileSync(file, edit(readFileSync(file, "utf8")));
      execFileSync("git", ["-c", "user.name=f", "-c", "user.email=f@f", "commit", "-qam", "edit"], {
        cwd: w.repo.root,
      });
      return execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: w.repo.root,
        encoding: "utf8",
      }).trim();
    };
    assert.equal((await planAt(w.repo.head)).ok, true, "control: the reviewed prose plans");
    const changed = await planAt(
      commit("docs/checkpoints/95-hosted.md", (t) =>
        t.replace("and nothing else", "and nothing more"),
      ),
    );
    assert.equal(changed.ok, false);
    assert.match(
      changed.ok ? "" : changed.diagnostics.join("\n"),
      /CP95-S02 differs from its reviewed text/,
    );
    const unreviewed = await planAt(
      commit("docs/checkpoints/95-hosted/checkpoint.yml", (t) =>
        t.replace(/^ {2}CP95-S02: .*\n/m, ""),
      ),
    );
    assert.equal(unreviewed.ok, false);
    assert.match(
      unreviewed.ok ? "" : unreviewed.diagnostics.join("\n"),
      /Step 2 has neither a contract nor a prose_steps entry/,
    );
  });

  it("a landed revision keeps earlier evidence current, reruns its checks, and resumes on a fresh runner", async () => {
    const w = world(scratch);
    await toS02(w);
    const facts = await factsOf(w);
    const s01 = facts.evidence.find((e) => e.step === S01);
    const [first] = recordsOf<Decision & { decision: "accept" }>(w, "acceptance").filter(
      (d) => d.step === S01,
    );
    assert.ok(s01 && first);
    assert.equal(
      s01.refs.join(),
      first.evidence.join(),
      "S01's acceptance is the one recorded before S02",
    );
    const s02 = recordsOf<Decision & { decision: "accept"; targets: string[] }>(
      w,
      "acceptance",
    ).find((d) => d.step === S02);
    assert.ok(
      s02?.targets.some((t) => t.startsWith(`${S01}/AC01/`)),
      "S01's automated checks reran on S02's candidate",
    );
    // S02 ran in two jobs: produced in the controller job, published by the effects job.
    const owners = eventsOf(w).filter((e) => e.action === "owner").length;
    assert.ok(owners >= 6);
  });
});

describe("H3-09 amendments", () => {
  it("an authorised amendment with a revision and reason is recorded and re-evaluates", async () => {
    const w = world(scratch);
    await toPublished(w);
    const receipts = recordsOf(w, "effect-receipt").length;
    const attempts = recordsOf<{ attempt: number }>(w, "evaluation").length;
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const amended = await dispatch(w, {
      action: "amend",
      config_revision: revision,
      reason: "a deeper review",
    });
    assert.equal(last(amended).exit, 0);
    assert.equal(
      last(amended).summary.next,
      "continue: the next job applies the recorded amendment",
    );
    const [amendment] = recordsOf<{
      actor: string;
      reason: string;
      revision: string;
      changes: ConfigChange[];
    }>(w, "amendment");
    assert.deepEqual(
      [amendment?.actor, amendment?.reason, amendment?.revision],
      [OWNER, "a deeper review", revision],
    );
    assert.deepEqual(
      amendment?.changes.map((c) => c.path),
      ["/roles/reviewer/effort"],
    );
    assert.deepEqual((await factsOf(w)).accepted, [], "affected evidence no longer counts");
    // The re-evaluation is reviewed again and needs a new approval of its own.
    const renewed = await dispatch(w, { action: "continue" });
    assert.ok(recordsOf<{ attempt: number }>(w, "evaluation").length > attempts);
    assert.equal(recordsOf(w, "effect-receipt").length, receipts, "receipts are kept");
    assert.deepEqual((await factsOf(w)).accepted, []);
    await dispatch(w, { action: "approve", ...pendingOf(last(renewed)) });
    await dispatch(w, { action: "continue" });
    assert.deepEqual((await factsOf(w)).accepted, [S01]);
    // The same candidate's completed effect is its receipt: it is not run again.
    assert.equal(recordsOf(w, "effect-receipt").length, receipts);
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
  });

  it("a hosted run that names no amend authority is not amended", async () => {
    const w = world(scratch, { edit: (t) => t.replace(/^ {4}amend: .*\n/m, "") });
    await toPublished(w);
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const refused = await dispatch(w, { action: "amend", config_revision: revision, reason: "x" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /names no amend authority/);
  });

  it("an unauthorised actor, a missing reason, a stale revision and an invalid configuration are refused", async () => {
    const w = world(scratch);
    await toPublished(w);
    const saved = sequences(w);
    const before = await factsOf(w);
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const intruder = await dispatch(
      w,
      { action: "amend", config_revision: revision, reason: "x" },
      { actor: "intruder" },
    );
    assert.match(
      last(intruder).summary.diagnostics.join("\n"),
      /intruder does not hold the amend authority/,
    );
    assert.equal(parseInputs({ action: "amend", run: w.run, config_revision: revision }).ok, false);
    const stale = await dispatch(w, { action: "amend", config_revision: w.repo.head, reason: "x" });
    assert.match(last(stale).summary.diagnostics.join("\n"), /is stale/);
    const invalid = commitTemplate(w.repo, (t) =>
      t.replace("model: claude-opus-5-5", "model: claude-haiku-4-5-20251001"),
    );
    const refused = await dispatch(w, {
      action: "amend",
      config_revision: invalid,
      reason: "cheaper",
    });
    assert.match(last(refused).summary.diagnostics.join("\n"), /does not accept effort/);
    for (const o of [intruder, stale, refused]) assert.equal(last(o).exit, 2);
    assert.deepEqual(sequences(w), saved, "nothing was recorded");
    const after = await factsOf(w);
    assert.deepEqual(
      [after.accepted, after.spending, after.roles],
      [before.accepted, before.spending, before.roles],
    );
  });
});

describe("H3-10 status", () => {
  it("reports the latest state and changes nothing", async () => {
    const w = world(scratch);
    await toPublished(w);
    const latest = w.store.latest(w.run);
    const executed = w.github.executions.length;
    const archive = readFileSync(join(latest.dir, "state.tar.gz"));
    const reported = await dispatch(w, { action: "status" });
    assert.equal(reported.length, 1);
    assert.equal(last(reported).exit, 0);
    assert.equal(last(reported).summary.outcome, "reported");
    assert.deepEqual(last(reported).summary.accepted, [S01]);
    assert.deepEqual(w.store.latest(w.run).sequence, latest.sequence);
    assert.deepEqual(readFileSync(join(latest.dir, "state.tar.gz")), archive);
    assert.equal(w.github.executions.length, executed, "status runs no effect");
  });

  it("refuses corrupt or stale state rather than presenting it", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    w.store.damage(w.run, Math.max(...sequences(w)));
    const corrupt = await dispatch(w, { action: "status" });
    assert.equal(last(corrupt).exit, 2);
    assert.equal(last(corrupt).summary.accepted, "unknown");
    const v = world(scratch);
    await dispatch(v, START);
    v.store.expire(v.run, Math.max(...sequences(v)));
    const stale = await dispatch(v, { action: "status" });
    assert.equal(last(stale).exit, 2);
    assert.equal(last(stale).summary.run, "unknown");
  });
});

describe("H3-11 summaries agree with recorded state", () => {
  it("every field of every action's summary is checked against the saved state", async () => {
    // `job` checks every summary in this file against its saved state; here
    // each field is falsified or omitted once and must fail on its own.
    const w = world(scratch);
    await toPublished(w);
    const reported = last(await dispatch(w, { action: "status" })).summary;
    assert.deepEqual(checkSummary(reported, reported), []);
    const falsified: Record<string, unknown> = {
      run: { name: "other", id: "other" },
      boundary: S02,
      accepted: [],
      checkpoint: { complete: true, unaccepted: [], pending: 0 },
      roles: "unknown",
      spending: { reportedUsd: 0, unknownSessions: 0, reservedUsd: 0, unresolved: 0 },
      pause: ["yield run: invented"],
      next: "none: the checkpoint is complete",
      evidence: { job: "elsewhere", state: null, records: [] },
      saved: null,
      pullRequest: null,
      round: { round: 9 },
    };
    for (const field of FIELDS) {
      const wrong = { ...reported, [field]: falsified[field] } as Summary;
      assert.deepEqual(
        checkSummary(wrong, reported).map((m) => m.field),
        [field],
        `falsified ${field}`,
      );
      const omitted = { ...reported } as Partial<Summary>;
      delete omitted[field];
      assert.deepEqual(
        checkSummary(omitted as Summary, reported).map((m) => m.field),
        [field],
        `omitted ${field}`,
      );
    }
    // The reported model and effort, spending and saved-state identity are the recorded ones.
    const facts = await factsOf(w);
    assert.deepEqual(reported.roles, facts.roles);
    assert.equal(facts.roles.reviewer.effort.reported, "not-reported");
    assert.ok(reported.saved !== "unknown" && reported.saved !== null);
  });

  it("a refusal before restore reports every run field unknown and no acceptance", () => {
    const refused = refusedSummary("continue", "https://github.example/run", ["no state"]);
    for (const field of FIELDS.filter((f) => f !== "next"))
      assert.equal(refused[field], "unknown", field);
    assert.equal(refused.outcome, "refused");
    assert.match(refused.next, /nothing was accepted/);
  });
});

describe("H3-12 hosted continuation", () => {
  it("yields within the selection, stops at a human decision, and never reports a green job as acceptance", async () => {
    const w = world(scratch);
    const early = Date.now() - 10 * 60 * 1000;
    let outcomes = await dispatch(w, START, { started: early });
    const yielded = last(outcomes);
    assert.equal(yielded.exit, 0, "a yielded job is green");
    assert.ok(yielded.saved, "and saved its state");
    assert.equal(yielded.summary.outcome, "paused");
    assert.deepEqual(yielded.summary.accepted, []);
    assert.ok(yielded.summary.checkpoint !== "unknown" && !yielded.summary.checkpoint.complete);
    while (last(outcomes).next === "continue") {
      outcomes = await dispatch(w, { action: "continue" }, { started: early });
    }
    assert.equal(last(outcomes).next, "none", "a human decision stops the continuations");
    assert.match(last(outcomes).summary.next, /approve or deny/);
    assert.equal((await factsOf(w)).boundary, S01);
  });

  it("stops at the selection boundary once it is accepted", async () => {
    const w = world(scratch);
    await toPublished(w);
    const done = await dispatch(w, { action: "continue" });
    assert.equal(last(done).next, "none");
    assert.equal(last(done).summary.outcome, "selection-accepted");
    const checkpoint = last(done).summary.checkpoint;
    assert.ok(checkpoint !== "unknown" && !checkpoint.complete);
  });
});

describe("H3-13 pull-request correction rounds reuse the run", () => {
  it("initial publication and two rounds keep history, receipts, attempts and spending, and renew only affected evidence", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const pr = w.github.pulls.get(pull);
    assert.ok(pr?.draft);
    assert.match(pr.body, /pactwright-harness run=h3-test/);
    const published = w.github.branches.get(`harness/${w.run}`);
    const s01Before = (await factsOf(w)).evidence.find((e) => e.step === S01)?.acceptance;
    const spentBefore = (await factsOf(w)).spending.reportedUsd;
    // Round 1: a submitted review with an actionable inline comment.
    const review = w.github.review(pull, OWNER, "[addressed] the stamp is right", [
      { path: GREETING, line: 1, body: "[actionable] cite the specification in a comment" },
    ]);
    const round1 = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      {
        actor: "github-actions[bot]",
      },
    );
    assert.deepEqual(
      round1.map((o) => o.kind),
      ["route", "controller", "effects"],
    );
    const fixed1 = w.github.branches.get(`harness/${w.run}`);
    assert.notEqual(fixed1, published);
    const facts1 = await factsOf(w);
    assert.equal(facts1.round?.complete, true);
    assert.equal(facts1.round?.fix?.commit, fixed1);
    assert.equal(
      facts1.evidence.find((e) => e.step === S01)?.acceptance,
      s01Before,
      "S01's evidence stays valid",
    );
    // Round 2: a manual round with a conversation comment.
    w.github.comment(pull, OWNER, "[declined] rename the greeting to salutation");
    const round2 = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.equal(last(round2).exit, 0);
    const facts2 = await factsOf(w);
    assert.equal(facts2.round?.round, 2);
    assert.equal(facts2.round?.complete, true);
    assert.deepEqual(
      facts2.round?.dispositions.map((d) => d.disposition),
      ["declined"],
    );
    // History, receipts, attempts and spending persist across the rounds.
    const rounds = recordsOf<RoundRecord>(w, "pr-round");
    assert.equal(rounds.length, 2);
    const s02Attempts = recordsOf<{ step: string; attempt: number }>(w, "evaluation").filter(
      (e) => e.step === S02,
    );
    assert.ok(Math.max(...s02Attempts.map((e) => e.attempt)) >= 2);
    assert.ok(facts2.spending.reportedUsd > spentBefore);
    const pushes = recordsOf<{ key: string }>(w, "effect-receipt").length;
    assert.ok(pushes >= 6);
    // One run throughout: one run-start, one manifest run identity.
    assert.equal(recordsOf(w, "run-start").length, 1);
    assert.equal(new Set(eventsOf(w).map((e) => e.run)).size, 1);
  });

  it("a fixing commit or a reply alone does not restore acceptance", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the specification in ${GREETING}`);
    // The assessment invalidates S02; a person pushes a fix and replies before the harness corrects it.
    const routed = await job(w, "route", { action: "address-comments", pr: String(pull) });
    assert.equal(routed.next, "controller");
    const assessed = await job(
      w,
      "controller",
      { action: "address-comments", pr: String(pull) },
      {
        started: Date.now() - 10 * 60 * 1000,
      },
    );
    assert.equal(assessed.next, "continue");
    w.github.comment(pull, "someone", "Fixed it by hand.");
    assert.ok(!(await factsOf(w)).accepted.includes(S02), "the assessment invalidated S02");
    const resumed = await dispatch(w, { action: "continue" });
    assert.equal(last(resumed).summary.outcome, "selection-accepted");
    assert.ok(
      (await factsOf(w)).accepted.includes(S02),
      "only the harness's own decision restored it",
    );
  });
});

describe("H3-14 one correction path for reviews and manual rounds", () => {
  it("a submitted review and a manual dispatch record the same kind of round; manual rounds read the conversation", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const review = w.github.review(pull, OWNER, "[addressed] fine");
    w.github.comment(pull, OWNER, "[addressed] also fine");
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      {
        actor: "github-actions[bot]",
      },
    );
    w.github.comment(pull, OWNER, "[declined] a different greeting");
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const [byReview, manual] = recordsOf<FeedbackSnapshot>(w, "pr-feedback");
    assert.deepEqual(byReview?.trigger, { kind: "review", actor: OWNER, review });
    assert.deepEqual(
      byReview?.items.map((i) => i.kind),
      ["review"],
    );
    assert.equal(manual?.trigger.kind, "manual");
    assert.deepEqual(manual?.items.map((i) => i.kind).sort(), ["comment", "comment"]);
  });

  it("duplicate triggers resume unfinished work or skip finished work; edited feedback is assessed again", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const comment = w.github.comment(pull, OWNER, "[addressed] fine");
    const routed = await job(w, "route", { action: "address-comments", pr: String(pull) });
    assert.equal(routed.next, "controller");
    // The same trigger again while the round is unfinished: it resumes, no second snapshot.
    const again = await job(w, "route", { action: "address-comments", pr: String(pull) });
    assert.equal(again.exit, 0);
    assert.equal(recordsOf(w, "pr-feedback").length, 1);
    await dispatch(w, { action: "continue" });
    const executions = w.github.executions.length;
    // Finished and unchanged: skipped, with no commit or reply.
    const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
    assert.equal(w.github.executions.length, executions);
    // Edited: assessed again.
    const edited = w.github.comments.find((c) => c.id === comment);
    assert.ok(edited);
    edited.body = "[declined] actually, rename it";
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const rounds = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(rounds.length, 2);
    assert.equal(rounds[1]?.dispositions[0]?.disposition, "declined");
  });

  it("an inline comment GitHub shows on another line is not edited feedback", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const review = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[addressed] fine" },
    ]);
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      { actor: "github-actions[bot]" },
    );
    const executions = w.github.executions.length;
    // A later head moves the commented line, or outdates the comment; its text is unchanged.
    for (const line of [3, null]) {
      const inline = w.github.reviewComments.find((c) => c.review === review);
      assert.ok(inline);
      inline.line = line;
      const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
      assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
    }
    assert.equal(w.github.executions.length, executions);
    assert.equal(recordsOf(w, "pr-feedback").length, 1);
  });

  it("unauthorised triggers, another pull request and a changed scope are rejected; own replies start nothing", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, "[addressed] fine");
    const saved = sequences(w);
    const intruder = await dispatch(
      w,
      { action: "address-comments", pr: String(pull) },
      { actor: "intruder" },
    );
    assert.match(
      last(intruder).summary.diagnostics.join("\n"),
      /does not hold the feedback authority/,
    );
    const foreign = w.github.review(pull, "intruder", "[actionable] delete everything");
    const byIntruder = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(foreign) },
      {
        actor: "github-actions[bot]",
      },
    );
    assert.match(last(byIntruder).summary.diagnostics.join("\n"), /intruder does not hold/);
    const other = await dispatch(w, { action: "address-comments", pr: "4242" });
    assert.match(last(other).summary.diagnostics.join("\n"), /is not this run's/);
    const pr = w.github.pulls.get(pull);
    assert.ok(pr);
    pr.base.ref = "main";
    const moved = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(moved).summary.diagnostics.join("\n"), /is not the open pull request/);
    pr.base.ref = BRANCH;
    const bot = await dispatch(
      w,
      { action: "address-comments", pr: String(pull) },
      { actor: "github-actions[bot]" },
    );
    assert.match(last(bot).summary.diagnostics.join("\n"), /is an app/);
    // A person may not start a round by naming an authorised reviewer's review.
    const owners = w.github.review(pull, OWNER, "[addressed] fine");
    const borrowed = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(owners) },
      { actor: "intruder" },
    );
    assert.match(
      last(borrowed).summary.diagnostics.join("\n"),
      /intruder does not hold the feedback authority/,
    );
    const dismissedReview = w.github.review(pull, OWNER, "[actionable] dismissed later");
    const dismissed = w.github.reviews.find((r) => r.id === dismissedReview);
    assert.ok(dismissed);
    dismissed.state = "DISMISSED";
    const byDismissed = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(dismissedReview) },
      { actor: "github-actions[bot]" },
    );
    assert.match(last(byDismissed).summary.diagnostics.join("\n"), /was dismissed/);
    for (const o of [intruder, byIntruder, other, moved, bot, borrowed, byDismissed]) {
      assert.equal(last(o).exit, 2);
    }
    assert.deepEqual(sequences(w), saved);
    // The harness's own replies are never feedback.
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const replies = w.github.comments.filter((c) => c.author === "github-actions[bot]").length;
    assert.ok(replies > 0);
    const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
  });

  it("a review submitted while a round is open waits for it, then starts the next round", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const first = w.github.review(pull, OWNER, "[addressed] fine");
    const forwarded = { actor: "github-actions[bot]" };
    // Round 1 is recorded; its assessment waits for a controller job.
    const routed = await job(
      w,
      "route",
      { action: "address-comments", pr: String(pull), review: String(first) },
      forwarded,
    );
    assert.equal(routed.next, "controller");
    const second = w.github.review(pull, OWNER, "[declined] rename it");
    const queued = await job(
      w,
      "route",
      { action: "address-comments", pr: String(pull), review: String(second) },
      forwarded,
    );
    assert.equal(queued.exit, 0);
    assert.deepEqual((await factsOf(w)).queued, [{ pull, review: second }]);
    // Round 1 completes, and its last job dispatches round 2 for the waiting review.
    let outcomes = await dispatch(w, { action: "continue" });
    for (
      let i = 0;
      i < 10 && last(outcomes).next === "continue" && !last(outcomes).dispatch?.review;
      i++
    ) {
      outcomes = await dispatch(w, { action: "continue" });
    }
    const next = last(outcomes);
    assert.deepEqual(
      [next.next, next.dispatch?.pr, next.dispatch?.review],
      ["continue", pull, second],
    );
    assert.match(next.summary.next, new RegExp(`address-comments for review ${second}`));
    await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(next.dispatch?.review) },
        forwarded,
      ),
    );
    const snapshots = recordsOf<FeedbackSnapshot>(w, "pr-feedback");
    assert.deepEqual(
      snapshots.map((f) => f.trigger.review),
      [first, second],
    );
    const facts = await factsOf(w);
    assert.deepEqual(facts.queued, []);
    assert.equal(facts.round?.complete, true);
    assert.deepEqual(
      facts.round?.dispositions.map((d) => d.disposition),
      ["declined"],
    );
  });

  it("each published head gets one explicitly dispatched review, which pushes alone would not start", async () => {
    const w = world(scratch);
    const review = (commit: string): object => ({
      workflow: "checkpoint-harness-verify.yml",
      ref: `harness/${w.run}`,
      commit,
      inputs: { live: "false" },
    });
    await toPublished(w);
    const initial = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.deepEqual(w.github.dispatches, [review(initial)], "the initial publication");
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    await settle(w, await dispatch(w, { action: "continue", through: S02 }));
    const first = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.deepEqual(w.github.dispatches, [review(initial), review(first)]);
    // A round that only replies publishes nothing new and dispatches nothing.
    w.github.comment(pull, OWNER, "[addressed] fine");
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    assert.equal(w.github.dispatches.length, 2);
    // A correction publishes a new head, and that head is dispatched for review.
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    const fixed = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.notEqual(fixed, first);
    assert.deepEqual(
      w.github.dispatches.map((d) => d.commit),
      [initial, first, fixed],
    );
    const receipts = recordsOf<{ key: string; receipt: { target: string } }>(w, "effect-receipt");
    assert.equal(
      receipts.filter((r) => r.receipt.target.includes("checkpoint-harness-verify.yml")).length,
      3,
    );
  });

  it("the complete CP01 template dispatches its review once for every published head", async () => {
    const root = join(here, "../../..");
    const cp01 = yaml.load(
      readFileSync(join(root, ".github/checkpoint-harness/cp01-t5.yml"), "utf8"),
    ) as { publication: { review?: { workflow: string; inputs?: Record<string, string> } } };
    const review = cp01.publication.review;
    assert.deepEqual(review, {
      workflow: "checkpoint-harness-verify.yml",
      inputs: { live: "false" },
    });
    // The workflow it names is dispatchable with exactly those inputs.
    const named = yaml.load(
      readFileSync(join(root, ".github/workflows", review.workflow), "utf8"),
    ) as {
      on: { workflow_dispatch?: { inputs?: Record<string, unknown> } };
    };
    for (const input of Object.keys(review.inputs ?? {})) {
      assert.ok(named.on.workflow_dispatch?.inputs?.[input], `${review.workflow} accepts ${input}`);
    }
    // CP01's publication settings, on the fixture: initial and corrected heads each get one review.
    const w = world(scratch, {
      edit: (t) =>
        t.replace(/^publication:\n(?:[ #].*\n)*/m, yaml.dump({ publication: cp01.publication })),
    });
    await toPublished(w);
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    await settle(w, await dispatch(w, { action: "continue", through: S02 }));
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    const heads = recordsOf<{ receipt: { details?: { commit?: string } } }>(
      w,
      "effect-receipt",
    ).flatMap((r) =>
      typeof r.receipt.details?.commit === "string" ? [r.receipt.details.commit] : [],
    );
    assert.equal(new Set(heads).size, 3, "the initial, extended and corrected publications");
    assert.deepEqual(
      w.github.dispatches,
      [...new Set(heads)].map((commit) => ({
        workflow: review.workflow,
        ref: `harness/${w.run}`,
        commit,
        inputs: review.inputs,
      })),
    );
  });

  it("a follow-up comment in an inline thread is answered on the thread's first comment", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const opened = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[addressed] the greeting is fine" },
    ]);
    await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(opened) },
        { actor: "github-actions[bot]" },
      ),
    );
    const root = w.github.reviewComments.find((c) => c.review === opened);
    assert.ok(root);
    const followUp = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[declined] also rename it", inReplyTo: root.id },
    ]);
    const answered = await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(followUp) },
        { actor: "github-actions[bot]" },
      ),
    );
    assert.equal(last(answered).exit, 0, stringify(last(answered).summary));
    assert.equal((await factsOf(w)).round?.complete, true);
    const replies = w.github.reviewComments.filter((c) => c.author === "github-actions[bot]");
    assert.equal(replies.length, 2);
    assert.ok(
      replies.every((r) => r.inReplyTo === root.id),
      "both replies are on the thread's first comment",
    );
  });

  it("valid feedback is corrected; addressed, declined and blocked feedback get their disposition and reason", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    w.github.comment(pull, OWNER, "[addressed] the stamp is right");
    w.github.comment(pull, OWNER, "[declined] use Bonjour");
    w.github.comment(pull, OWNER, "[blocked] is this the release we want?");
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const facts = await factsOf(w);
    assert.deepEqual(
      facts.round?.dispositions.map((d) => d.disposition),
      ["actionable", "already-addressed", "declined", "blocked"],
    );
    assert.ok(facts.round?.dispositions.every((d) => d.reason.trim() !== ""));
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.match(
      execFileSync("git", ["show", `${head}:${GREETING}`], { cwd: w.repo.root, encoding: "utf8" }),
      /Greets as HOSTED §1 says/,
    );
    const bodies = w.github.comments
      .filter((c) => c.author === "github-actions[bot]")
      .map((c) => c.body);
    assert.equal(bodies.length, 4);
    assert.ok(bodies.some((b) => b.startsWith("**Corrected**") && b.includes(head)));
    assert.ok(bodies.some((b) => b.startsWith("**Blocked**")));
    assert.match(last(await dispatch(w, { action: "status" })).summary.next, /blocked feedback/);
  });

  it("a finding on an earlier output that the final step consumes is corrected by its owner, and every later step is renewed", async () => {
    const w = world(scratch, { registry: true });
    await toPublished(w);
    const extended = await settle(w, await dispatch(w, { action: "continue", through: S04 }));
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    assert.deepEqual((await factsOf(w)).accepted, [S01, S02, S03, S04]);
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    // S04 consumes S01's greeting, so the greeting is protected from S04 and owned by S01.
    const review = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[actionable] cite the specification in a comment" },
    ]);
    const routed = await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(review) },
        { actor: "github-actions[bot]" },
      ),
    );
    const [assessment] = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(assessment?.dispositions[0]?.disposition, "actionable");
    assert.equal(assessment?.correction?.step, S01, "the owner of the greeting corrects it");
    // S01's corrected candidate is a new evaluation: its release is approved again.
    const pending = pendingOf(last(routed));
    await dispatch(w, { action: "approve", ...pending });
    const done = await settle(w, await dispatch(w, { action: "continue" }));
    assert.equal(last(done).summary.outcome, "selection-accepted", stringify(last(done).summary));
    const facts = await factsOf(w);
    assert.deepEqual(facts.accepted, [S01, S02, S03, S04]);
    assert.equal(facts.round?.complete, true);
    const events = eventsOf(w);
    const assessed = events.find((e) => e.action === "pr-assessment")?.seq ?? Infinity;
    for (const step of [S01, S02, S04]) {
      assert.ok(
        events.some((e) => e.action === "acceptance" && e.data.step === step && e.seq > assessed),
        `${step} is accepted again after the assessment`,
      );
    }
    // The published head carries the corrected greeting and the welcome built on it.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    const show = (path: string): string =>
      execFileSync("git", ["show", `${head}:${path}`], { cwd: w.repo.root, encoding: "utf8" });
    assert.match(show(GREETING), /Greets as HOSTED §1 says/);
    assert.match(show(WELCOME), /import \{ greet \} from "\.\/greeting\.mjs"/);
    const replies = w.github.reviewComments.filter((c) => c.author === "github-actions[bot]");
    assert.equal(replies.length, 1);
    assert.match(replies[0]?.body ?? "", /^\*\*Corrected\*\*/);
  });

  it("feedback that would change definitions, verifiers or the workflow is declined whatever the assessment", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const verifier = `${H}/hosted/verifiers/greet-judge.mjs`;
    w.github.review(pull, OWNER, "", [
      { path: verifier, line: 1, body: "[actionable] loosen the judge" },
    ]);
    const reviewId = w.github.reviews.at(-1)?.id ?? 0;
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(reviewId) },
      {
        actor: "github-actions[bot]",
      },
    );
    const [assessment] = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(assessment?.dispositions[0]?.disposition, "declined");
    assert.equal(assessment?.correction, null);
  });
});

describe("H3-15 rounds recover from runner loss and moved heads", () => {
  it("a runner lost after a correction push or a reply reconciles by read-back, never repeating it", async () => {
    for (const action of ["push-branch", "pr-reply"]) {
      const w = world(scratch);
      const pull = await toS02(w);
      w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
      const lost = await dispatch(w, {
        action: "address-comments",
        pr: String(pull),
        fault: `crash-after-effect:${action}`,
      });
      assert.ok(last(lost).error instanceof Crash, action);
      const facts = await factsOf(w);
      assert.equal(facts.round?.complete, false, "an unresolved effect is not claimed complete");
      const count = w.github.executions.filter((e) => e.action === action).length;
      await dispatch(w, { action: "continue" });
      assert.equal(w.github.executions.filter((e) => e.action === action).length, count, action);
      assert.equal((await factsOf(w)).round?.complete, true);
      assert.ok(recordsOf<{ reconciled: boolean }>(w, "effect-receipt").some((r) => r.reconciled));
    }
  });

  it("newer commits on the pull request are adopted, never lost; a diverged head pauses the round", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const human = w.github.pushHuman(`harness/${w.run}`, {
      [`${H}/hosted/work/NOTES.md`]: "notes\n",
    });
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    const corrected = await settle(
      w,
      await dispatch(w, { action: "address-comments", pr: String(pull) }),
    );
    assert.equal(
      last(corrected).summary.outcome,
      "selection-accepted",
      stringify(last(corrected).summary),
    );
    const facts = await factsOf(w);
    assert.equal(facts.round?.complete, true);
    assert.ok(facts.accepted.includes(S02));
    // The fixing commit is published on top of the newer commit, which it keeps.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.notEqual(head, human);
    assert.equal(facts.round?.fix?.commit, head);
    assert.equal(
      execFileSync("git", ["rev-parse", `${head}^`], { cwd: w.repo.root, encoding: "utf8" }).trim(),
      human,
    );
    const show = (path: string): string =>
      execFileSync("git", ["show", `${head}:${path}`], { cwd: w.repo.root, encoding: "utf8" });
    assert.equal(show(`${H}/hosted/work/NOTES.md`), "notes\n");
    assert.match(show(GREETING), /Greets as HOSTED §1 says/);
    // A head that does not build on the published commit pauses the round.
    const v = world(scratch);
    const pull2 = await toS02(v);
    const pr = v.github.pulls.get(pull2);
    assert.ok(pr);
    pr.head.sha = v.repo.head;
    v.github.comment(pull2, OWNER, "[addressed] fine");
    const diverged = await dispatch(v, { action: "address-comments", pr: String(pull2) });
    assert.equal(last(diverged).exit, 2);
    assert.match(last(diverged).summary.diagnostics.join("\n"), /does not build on the published/);
  });

  it("missing state cannot start a correction run, and concurrent rounds cannot both own the run", async () => {
    const w = world(scratch, { run: "no-state" });
    const refused = await dispatch(w, { action: "address-comments", pr: "1" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /has no saved state/);
    const v = world(scratch);
    const pull = await toS02(v);
    v.github.comment(pull, OWNER, "[addressed] fine");
    const top = Math.max(...sequences(v));
    await job(v, "route", { action: "address-comments", pr: String(pull) });
    const stale = new StaleView(v.store, top + 1, 1);
    await assert.rejects(
      () =>
        job({ ...v, store: stale as unknown as typeof v.store }, "route", {
          action: "address-comments",
          pr: String(pull),
        }),
      /another controller owns the run/,
    );
  });

  it("budget exhaustion in a round pauses without resetting the limits", async () => {
    const w = world(scratch, { edit: (t) => t.replace("attempts: 4", "attempts: 1") });
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    const exhausted = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(stringify(last(exhausted).summary.pause), /exhausted/);
    const attempts = recordsOf<{ step: string; attempt: number }>(w, "start").filter(
      (s) => s.step === S02,
    );
    const again = await dispatch(w, { action: "continue" });
    assert.match(stringify(last(again).summary.pause), /exhausted/);
    assert.deepEqual(
      recordsOf<{ step: string; attempt: number }>(w, "start").filter((s) => s.step === S02).length,
      attempts.length,
      "resuming adds no attempt",
    );
  });
});
