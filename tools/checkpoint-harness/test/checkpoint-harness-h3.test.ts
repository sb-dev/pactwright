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
import { after, afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import { collect } from "../src/pull-requests.js";
import {
  GitHubError,
  githubEffects,
  githubFeedback,
  githubStore,
  ProvenanceError,
  SETTLE_MS,
  WORKFLOW,
  type GitHubApi,
} from "../src/github.js";
import { type EffectRequest } from "../src/runner.js";

import { latestState, saveState, type StateStore } from "../src/state.js";
import {
  checkSummary,
  FIELDS,
  refusedSummary,
  renderSummary,
  type Summary,
} from "../src/summary.js";

import {
  Crash,
  dispatch,
  eventsOf,
  factsOf,
  fixtureProducer,
  GREETING,
  job,
  OWNER,
  pendingOf,
  recordsOf,
  REPOSITORY,
  S01,
  S02,
  S04,
  world,
  type World,
} from "./h3-fixtures.js";

import { START, last, toApproval, toPublished, sequences, StaleView } from "./h3-scenarios.js";

const here = dirname(fileURLToPath(import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// No world is shared between tests. Release its archives before the next case.
afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch);
});

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
    let lostSession: AbortController | undefined;
    w.producer = Object.assign(
      (request: Parameters<typeof good>[0]) => {
        if (!crashed) {
          crashed = true;
          lostSession = request.abort;
          throw new Crash("the runner was lost in the session");
        }
        return good(request);
      },
      { requests: good.requests, packets: good.packets },
    );
    const lost = await dispatch(w, START);
    assert.ok(last(lost).error instanceof Crash);
    assert.equal(lostSession?.signal.aborted, true, "a failed provider releases its session");
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
