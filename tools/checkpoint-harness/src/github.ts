// T3.5 H3: the GitHub boundary of a hosted run (production readiness log §3
// H3; Spec 00 §4). Everything the controller learns from or does to GitHub
// passes through here: the owning job's verified status, the saved run states
// (Actions artifacts of this workflow's dispatched runs only), pull requests
// and their feedback, and the external effects, each read back before its
// receipt is recorded. Tests replace these boundaries with in-memory ones.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DefaultArtifactClient } from "@actions/artifact";
import stringify from "safe-stable-stringify";

import type { Liveness, OwnerRecord } from "./evidence.js";
import type { FeedbackSource } from "./pull-requests.js";
import type { EffectRequest, EffectService, Receipt } from "./runner.js";
import { EffectBlocked, EffectRefused } from "./runner.js";
import {
  ARCHIVE,
  MANIFEST,
  RUN_NAME,
  artifactName,
  type SavedState,
  type StateStore,
} from "./state.js";

/** The workflow whose dispatched runs alone may write a run's state. */
export const WORKFLOW = ".github/workflows/checkpoint-harness.yml";

/** Hidden marker the harness puts in what it posts, so it never reads its own replies as feedback. */
export const MARKER = "<!-- pactwright-harness";

export class GitHubError extends Error {
  override name = "GitHubError";
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** A REST client for one repository. */
export type GitHubApi = {
  repository: string;
  token: string;
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
};

/** A client from the Actions environment: GITHUB_REPOSITORY, GITHUB_TOKEN and GITHUB_API_URL. */
export function githubApi(env: Readonly<Record<string, string | undefined>>): GitHubApi {
  const repository = env.GITHUB_REPOSITORY ?? "";
  const token = env.GITHUB_TOKEN ?? "";
  const base = env.GITHUB_API_URL ?? "https://api.github.com";
  if (!/^[^/]+\/[^/]+$/.test(repository) || token === "") {
    throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
  }
  return {
    repository,
    token,
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "x-github-api-version": "2022-11-28",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new GitHubError(
          `${method} ${path}: ${response.status} ${text.slice(0, 300)}`,
          response.status,
        );
      }
      return (text === "" ? null : JSON.parse(text)) as T;
    },
  };
}

/** Every page of a list endpoint; `pick` extracts a page's items. */
async function pages<T, P>(api: GitHubApi, path: string, pick: (page: P) => T[]): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page += 1) {
    const sep = path.includes("?") ? "&" : "?";
    const items = pick(await api.request<P>("GET", `${path}${sep}per_page=100&page=${page}`));
    all.push(...items);
    if (items.length < 100) return all;
  }
}

/** Statuses of a write GitHub declined without performing it. */
const DECLINED = new Set([401, 403, 404, 422]);

/** Waits the given milliseconds; injected so tests need not. */
export type Wait = (ms: number) => Promise<void>;
const wait: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The waits between read-backs of a write GitHub has accepted: listings and
 * newly uploaded artifacts can lag a write by seconds, so a read-back keeps
 * looking for about a minute before it reports the write absent.
 */
export const SETTLE_MS = [1000, 2000, 4000, 8000, 16000, 32000] as const;

/** `read` once, then again after each settling wait until it finds something. */
async function settled<T>(read: () => Promise<T | null>, delay: Wait): Promise<T | null> {
  for (const ms of SETTLE_MS) {
    const found = await read();
    if (found !== null) return found;
    await delay(ms);
  }
  return read();
}

type JobsPage = { jobs: { name: string; status: string }[] };

/**
 * The liveness of an unreleased owner from GitHub (T3.5 H3): its recorded
 * job's verified status. A completed job is dead; a queued, waiting or
 * running one is live. No GitHub identity, no such job or a failed read is
 * unknown, which is never taken over.
 */
export function githubLiveness(api: GitHubApi): (owner: OwnerRecord) => Promise<Liveness> {
  return async (owner) => {
    const job = owner.github;
    if (!job || job.repository !== api.repository) return "unknown";
    try {
      const { jobs } = await api.request<JobsPage>(
        "GET",
        `/repos/${api.repository}/actions/runs/${job.run_id}/attempts/${job.run_attempt}/jobs?per_page=100`,
      );
      const found = jobs.filter((j) => j.name === job.job);
      if (found.length !== 1 || !found[0]) return "unknown";
      return found[0].status === "completed" ? "dead" : "live";
    } catch {
      return "unknown";
    }
  };
}

type ArtifactRow = {
  id: number;
  name: string;
  expired: boolean;
  expires_at: string | null;
  workflow_run: { id: number; head_repository_id?: number } | null;
};
type RunRow = {
  id: number;
  path: string;
  event: string;
  head_branch: string | null;
  head_repository: { full_name: string } | null;
};

/**
 * Where an artifact came from: a dispatched run of this workflow in this
 * repository on `ref` (trusted), or positively anything else (foreign).
 * Its author controls the workflow and harness code of a run on any other
 * branch, in a fork or for another event. A run that cannot be read is
 * unknown, and an unknown artifact of a run is never skipped: it might be
 * the run's latest state.
 */
export type Provenance = "trusted" | "foreign" | "unknown";

function artifactProvenance(
  api: GitHubApi,
  ref: string,
): (row: ArtifactRow) => Promise<Provenance> {
  // Only runs read successfully are remembered; a failed read is tried again.
  const runs = new Map<number, RunRow>();
  return async (row) => {
    const id = row.workflow_run?.id;
    if (id === undefined) return "unknown";
    let run = runs.get(id);
    if (!run) {
      try {
        run = await api.request<RunRow>("GET", `/repos/${api.repository}/actions/runs/${id}`);
      } catch {
        return "unknown";
      }
      runs.set(id, run);
    }
    return ref !== "" &&
      run.path.split("@")[0] === WORKFLOW &&
      run.event === "workflow_dispatch" &&
      run.head_branch === ref &&
      run.head_repository?.full_name === api.repository
      ? "trusted"
      : "foreign";
  };
}

/** An artifact whose origin could not be established; nothing may rely on what is around it. */
export class ProvenanceError extends Error {
  override name = "ProvenanceError";
}

/**
 * Saved run states as Actions artifacts `harness-<run>-<sequence>`. Only an
 * artifact uploaded by a dispatched run of this workflow in this repository,
 * on `ref` — the branch the run is operated from — counts: any other
 * workflow, a fork, a pull request or a dispatch on another branch, whose
 * workflow and harness code its author controls, could upload an artifact
 * of that name, and it is ignored.
 */
export function githubStore(
  api: GitHubApi,
  options: {
    currentRun: number;
    ref: string;
    retentionDays?: number;
    /** The artifact client; the Actions runtime's by default. */
    client?: Pick<DefaultArtifactClient, "uploadArtifact" | "downloadArtifact">;
    wait?: Wait;
  },
): StateStore {
  const client = options.client ?? new DefaultArtifactClient();
  const provenance = artifactProvenance(api, options.ref);
  const [owner = "", repo = ""] = api.repository.split("/");
  return {
    async list(name) {
      if (!RUN_NAME.test(name)) throw new Error(`${name}: not a run name`);
      const pattern = new RegExp(`^harness-${name}-(\\d{6})$`);
      const rows = await pages<ArtifactRow, { artifacts: ArtifactRow[] }>(
        api,
        `/repos/${api.repository}/actions/artifacts`,
        (p) => p.artifacts,
      );
      const states: SavedState[] = [];
      for (const row of rows) {
        const match = pattern.exec(row.name);
        if (!match) continue;
        const origin = await provenance(row);
        if (origin === "unknown") {
          throw new ProvenanceError(
            `artifact ${row.id} (${row.name}): its workflow run cannot be read, so whether it is this run's state is unknown`,
          );
        }
        if (origin === "foreign") continue;
        states.push({
          id: String(row.id),
          name,
          sequence: Number(match[1]),
          expired: row.expired,
          expiresAt: row.expires_at,
          url: `https://github.com/${api.repository}/actions/runs/${row.workflow_run?.id ?? 0}/artifacts/${row.id}`,
          workflowRun: row.workflow_run?.id ?? null,
        });
      }
      return states;
    },
    async download(saved, into) {
      mkdirSync(into, { recursive: true });
      await client.downloadArtifact(Number(saved.id), {
        path: into,
        findBy: {
          token: api.token,
          workflowRunId: saved.workflowRun ?? 0,
          repositoryOwner: owner,
          repositoryName: repo,
        },
      });
      return { archive: join(into, ARCHIVE), manifest: join(into, MANIFEST) };
    },
    async upload(name, sequence, files) {
      const artifact = artifactName(name, sequence);
      const dir = join(files.archive, "..");
      const uploaded = await client.uploadArtifact(artifact, [files.archive, files.manifest], dir, {
        ...(options.retentionDays ? { retentionDays: options.retentionDays } : {}),
      });
      if (uploaded.id === undefined)
        throw new Error(`${artifact}: the upload returned no artifact`);
      // The saved state is what GitHub records for the artifact, its expiry included.
      // A just-finalized artifact can read as missing for a few seconds.
      const row = await settled(async () => {
        try {
          return await api.request<ArtifactRow>(
            "GET",
            `/repos/${api.repository}/actions/artifacts/${uploaded.id}`,
          );
        } catch (e) {
          if (e instanceof GitHubError && e.status === 404) return null;
          throw e;
        }
      }, options.wait ?? wait);
      if (row === null) {
        throw new Error(`${artifact}: GitHub does not show the uploaded artifact ${uploaded.id}`);
      }
      if (row.name !== artifact) {
        throw new Error(`artifact ${uploaded.id} is ${row.name}, not the uploaded ${artifact}`);
      }
      return {
        id: String(row.id),
        name,
        sequence,
        expired: row.expired,
        expiresAt: row.expires_at,
        url: `https://github.com/${api.repository}/actions/runs/${row.workflow_run?.id ?? options.currentRun}/artifacts/${row.id}`,
        workflowRun: row.workflow_run?.id ?? options.currentRun,
      };
    },
  };
}

type Ref = { object: { sha: string } };
type Pull = {
  number: number;
  html_url: string;
  state: string;
  head: { ref: string; sha: string; repo: { full_name: string } | null };
  base: { ref: string; sha: string };
};
type Comment = { id: number; body: string; html_url: string; user: { login: string } | null };

/** The commit a branch points at, or null when it does not exist. */
export async function branchHead(api: GitHubApi, branch: string): Promise<string | null> {
  try {
    const ref = await api.request<Ref>(
      "GET",
      `/repos/${api.repository}/git/ref/heads/${branch.split("/").map(encodeURIComponent).join("/")}`,
    );
    return ref.object.sha;
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

/** Open or closed pull requests from `branch` of this repository. */
export async function pullsFrom(api: GitHubApi, branch: string): Promise<Pull[]> {
  const owner = api.repository.split("/")[0] ?? "";
  return api.request<Pull[]>(
    "GET",
    `/repos/${api.repository}/pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}`,
  );
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

type ReviewRow = {
  id: number;
  user: { login: string } | null;
  state: string;
  body: string | null;
  html_url: string;
};
type ReviewCommentRow = {
  id: number;
  pull_request_review_id: number | null;
  in_reply_to_id?: number | null;
  user: { login: string } | null;
  body: string;
  path: string;
  line: number | null;
  html_url: string;
};
type IssueCommentRow = {
  id: number;
  user: { login: string } | null;
  body: string | null;
  html_url: string;
};
type Compare = { status: string; files?: { filename: string; previous_filename?: string }[] };

/** Pull requests and their feedback, read from GitHub (T3.5 H3). */
export function githubFeedback(api: GitHubApi): FeedbackSource {
  const repo = `/repos/${api.repository}`;
  const login = (u: { login: string } | null): string => u?.login ?? "ghost";
  return {
    async pull(number) {
      try {
        const p = await api.request<Pull>("GET", `${repo}/pulls/${number}`);
        return {
          number: p.number,
          state: p.state === "open" ? "open" : "closed",
          url: p.html_url,
          head: { ref: p.head.ref, sha: p.head.sha, repository: p.head.repo?.full_name ?? null },
          base: { ref: p.base.ref },
        };
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return null;
        throw e;
      }
    },
    async review(pull, id) {
      try {
        const r = await api.request<ReviewRow>("GET", `${repo}/pulls/${pull}/reviews/${id}`);
        return {
          id: r.id,
          author: login(r.user),
          state: r.state,
          body: r.body ?? "",
          url: r.html_url,
        };
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return null;
        throw e;
      }
    },
    async reviews(pull) {
      const rows = await pages<ReviewRow, ReviewRow[]>(
        api,
        `${repo}/pulls/${pull}/reviews`,
        (p) => p,
      );
      return rows
        .filter((r) => r.state !== "PENDING")
        .map((r) => ({
          id: r.id,
          author: login(r.user),
          state: r.state,
          body: r.body ?? "",
          url: r.html_url,
        }));
    },
    async reviewComments(pull) {
      const rows = await pages<ReviewCommentRow, ReviewCommentRow[]>(
        api,
        `${repo}/pulls/${pull}/comments`,
        (p) => p,
      );
      return rows.map((c) => ({
        id: c.id,
        review: c.pull_request_review_id,
        inReplyTo: c.in_reply_to_id ?? null,
        author: login(c.user),
        body: c.body,
        path: c.path,
        line: c.line,
        url: c.html_url,
      }));
    },
    async comments(pull) {
      const rows = await pages<IssueCommentRow, IssueCommentRow[]>(
        api,
        `${repo}/issues/${pull}/comments`,
        (p) => p,
      );
      return rows.map((c) => ({
        id: c.id,
        author: login(c.user),
        body: c.body ?? "",
        url: c.html_url,
      }));
    },
    async descends(ancestor, commit) {
      if (ancestor === commit) return true;
      const compare = await api.request<Compare>("GET", `${repo}/compare/${ancestor}...${commit}`);
      return compare.status === "ahead" || compare.status === "identical";
    },
    async changed(from, to) {
      const compare = await api.request<Compare>("GET", `${repo}/compare/${from}...${to}`);
      return [
        ...new Set(
          (compare.files ?? []).flatMap((f) =>
            f.previous_filename ? [f.filename, f.previous_filename] : [f.filename],
          ),
        ),
      ].sort();
    },
  };
}

/** Git in the controller's checkout, with the token only on the push. */
function git(repoRoot: string, args: string[], input?: string): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...(input === undefined ? {} : { input }),
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

const has = (repoRoot: string, sha: string): boolean => {
  try {
    git(repoRoot, ["cat-file", "-e", `${sha}^{object}`]);
    return true;
  } catch {
    return false;
  }
};

/**
 * The effects of a hosted run (T3.5 H3), each read back before its receipt:
 *
 * - `push-branch` writes the payload's commit — the candidate tree on the last
 *   published head, built byte for byte from the intent — and moves the
 *   branch to it without force. A branch that moved elsewhere is refused.
 * - `open-pr` opens the draft pull request unless the branch already has one.
 * - `pr-reply` posts a reply, marked with its effect key, in a review thread
 *   or the conversation.
 * - `fixture-receipt` is the hosted recovery fixture: an artifact named for
 *   its key.
 */
export function githubEffects(
  api: GitHubApi,
  options: {
    repoRoot: string;
    runDir: string;
    /** The branch the run is operated from: fixture receipts are trusted from there. */
    ref: string;
    /** The account the job's token acts as; only its comments are the harness's replies. */
    actor?: string;
    wait?: Wait;
  },
): EffectService {
  const provenance = artifactProvenance(api, options.ref);
  const self = options.actor ?? "github-actions[bot]";
  const artifacts = new DefaultArtifactClient();
  const authHeader = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${api.token}`).toString("base64")}`;
  const remote = `https://github.com/${api.repository}.git`;
  const marker = (key: string): string => `${MARKER} effect=${key} -->`;
  const receipt = (
    key: string,
    request: EffectRequest,
    reference: string,
    details: Receipt["details"],
  ): Receipt => ({ key, target: request.target, reference, ...(details ? { details } : {}) });

  const pushed = async (key: string, request: EffectRequest): Promise<Receipt | null> => {
    const payload = request.payload ?? {};
    const head = await branchHead(api, text(payload.branch));
    return head !== null && head === payload.commit
      ? receipt(key, request, head, {
          branch: text(payload.branch),
          commit: head,
          parent: text(payload.parent),
        })
      : null;
  };
  const opened = async (key: string, request: EffectRequest): Promise<Receipt | null> => {
    const payload = request.payload ?? {};
    const open = (await pullsFrom(api, text(payload.head))).find(
      (p) => p.state === "open" && p.base.ref === payload.base,
    );
    return open
      ? receipt(key, request, open.html_url, { number: open.number, url: open.html_url })
      : null;
  };
  const replied = async (key: string, request: EffectRequest): Promise<Receipt | null> => {
    const payload = request.payload ?? {};
    const pull = Number(payload.pull);
    const lists = await Promise.all([
      pages<Comment, Comment[]>(api, `/repos/${api.repository}/issues/${pull}/comments`, (p) => p),
      pages<Comment, Comment[]>(api, `/repos/${api.repository}/pulls/${pull}/comments`, (p) => p),
    ]);
    const found = lists.flat().find((c) => c.user?.login === self && c.body.includes(marker(key)));
    return found
      ? receipt(key, request, found.html_url, { id: found.id, url: found.html_url })
      : null;
  };
  const fixtureName = (key: string): string => `harness-effect-${key.slice("sha256:".length, 39)}`;
  const fixture = async (key: string, request: EffectRequest): Promise<Receipt | null> => {
    const rows = await api.request<{ artifacts: ArtifactRow[] }>(
      "GET",
      `/repos/${api.repository}/actions/artifacts?name=${fixtureName(key)}`,
    );
    let row: ArtifactRow | undefined;
    for (const r of rows.artifacts) {
      const origin = await provenance(r);
      if (origin === "unknown") {
        throw new ProvenanceError(`artifact ${r.id} (${r.name}): its workflow run cannot be read`);
      }
      if (!row && origin === "trusted") row = r;
    }
    return row
      ? receipt(key, request, `artifact ${row.id}`, { artifact: row.id, name: fixtureName(key) })
      : null;
  };
  // A dispatched review is the workflow run it started on the published head.
  const reviewed = async (key: string, request: EffectRequest): Promise<Receipt | null> => {
    const payload = request.payload ?? {};
    const query = new URLSearchParams({
      event: "workflow_dispatch",
      branch: text(payload.ref),
      head_sha: text(payload.commit),
    });
    const runs = await api.request<{ workflow_runs: { id: number; html_url: string }[] }>(
      "GET",
      `/repos/${api.repository}/actions/workflows/${encodeURIComponent(text(payload.workflow))}/runs?${query.toString()}`,
    );
    const run = runs.workflow_runs[0];
    return run ? receipt(key, request, run.html_url, { run: run.id, url: run.html_url }) : null;
  };
  // GitHub declined the write itself, for a cause the owner can fix: a
  // permission, a setting or the target's state. Only the write is judged so:
  // an error after it succeeded, such as reading it back, leaves it uncertain.
  const write = async <T>(call: Promise<T>): Promise<T> => {
    try {
      return await call;
    } catch (e) {
      if (e instanceof GitHubError && DECLINED.has(e.status)) {
        throw new EffectBlocked(`GitHub declined it: ${e.message}`);
      }
      throw e;
    }
  };
  // After a write, the receipt is what reading the target back finds once GitHub shows it.
  const readBack = (
    inspect: (key: string, r: EffectRequest) => Promise<Receipt | null>,
    key: string,
    request: EffectRequest,
  ): Promise<Receipt | null> => settled(() => inspect(key, request), options.wait ?? wait);
  const inspectors: Record<string, (key: string, r: EffectRequest) => Promise<Receipt | null>> = {
    "push-branch": pushed,
    "open-pr": opened,
    "pr-reply": replied,
    "fixture-receipt": fixture,
    "review-dispatch": reviewed,
  };

  return {
    async execute(key, request) {
      const payload = request.payload ?? {};
      switch (request.action) {
        case "push-branch": {
          const branch = text(payload.branch);
          const commit = text(payload.commit);
          const parent = text(payload.parent);
          const head = await branchHead(api, branch);
          if (head === commit) return pushed(key, request);
          // The first push creates the branch; every later one moves it from the published head.
          if (head !== null && head !== parent) {
            throw new EffectRefused(
              `${branch} is at ${head}, not the published ${parent}; newer work is never overwritten`,
            );
          }
          // The candidate's objects come from the run; the parent from the repository.
          git(options.repoRoot, [
            "fetch",
            "--quiet",
            join(options.runDir, "source.git"),
            `refs/snapshots/${request.candidate}`,
          ]);
          if (!has(options.repoRoot, parent)) {
            git(options.repoRoot, [
              "-c",
              `http.extraheader=${authHeader}`,
              "fetch",
              "--quiet",
              remote,
              parent,
            ]);
          }
          if (commit !== parent) {
            const object = [
              `tree ${text(payload.tree)}`,
              `parent ${parent}`,
              `author Pactwright harness <harness@pactwright.invalid> ${String(payload.time)} +0000`,
              `committer Pactwright harness <harness@pactwright.invalid> ${String(payload.time)} +0000`,
              "",
              text(payload.message),
            ].join("\n");
            const written = git(
              options.repoRoot,
              ["hash-object", "-w", "-t", "commit", "--stdin"],
              object,
            );
            if (written !== commit) {
              throw new EffectRefused(
                `the publication commit is ${written}, not the intended ${commit}`,
              );
            }
          }
          git(options.repoRoot, [
            "-c",
            `http.extraheader=${authHeader}`,
            "push",
            "--quiet",
            remote,
            `${commit}:refs/heads/${branch}`,
          ]);
          return readBack(pushed, key, request);
        }
        case "open-pr": {
          const existing = await opened(key, request);
          if (existing) return existing;
          await write(
            api.request<Pull>("POST", `/repos/${api.repository}/pulls`, {
              title: text(payload.title),
              head: text(payload.head),
              base: text(payload.base),
              body: text(payload.body),
              draft: payload.draft === true,
            }),
          );
          // The receipt is what reading the target back finds, not the response.
          return readBack(opened, key, request);
        }
        case "pr-reply": {
          const body = `${text(payload.body)}\n\n${marker(key)}`;
          const pull = Number(payload.pull);
          if (typeof payload.thread === "number") {
            await write(
              api.request<Comment>(
                "POST",
                `/repos/${api.repository}/pulls/${pull}/comments/${payload.thread}/replies`,
                { body },
              ),
            );
          } else {
            await write(
              api.request<Comment>("POST", `/repos/${api.repository}/issues/${pull}/comments`, {
                body,
              }),
            );
          }
          return readBack(replied, key, request);
        }
        case "fixture-receipt": {
          const dir = join(options.runDir, "tmp", fixtureName(key));
          mkdirSync(dir, { recursive: true });
          const file = join(dir, "request.json");
          writeFileSync(file, `${stringify({ key, request }, null, 2)}\n`);
          await artifacts.uploadArtifact(fixtureName(key), [file], dir);
          return readBack(fixture, key, request);
        }
        case "review-dispatch": {
          // The review runs on the published head only: a moved branch is not dispatched.
          const head = await branchHead(api, text(payload.ref));
          if (head !== payload.commit) {
            throw new EffectRefused(
              `${text(payload.ref)} is at ${head ?? "nothing"}, not the published ${text(payload.commit)}`,
            );
          }
          await write(
            api.request(
              "POST",
              `/repos/${api.repository}/actions/workflows/${encodeURIComponent(text(payload.workflow))}/dispatches`,
              { ref: text(payload.ref), inputs: payload.inputs ?? {} },
            ),
          );
          return readBack(reviewed, key, request);
        }
        default:
          throw new EffectRefused(`no GitHub effect performs ${request.action}`);
      }
    },
    inspect(key, request) {
      const inspector = inspectors[request.action];
      return inspector ? inspector(key, request) : Promise.resolve(null);
    },
  };
}

/** Makes `commit` of `repository` present in the Git repository at `dir`, fetching it if absent. */
export function fetchCommit(
  dir: string,
  server: string,
  repository: string,
  commit: string,
  header: string,
  shallow = false,
): void {
  const present = (): boolean =>
    spawnSync("git", ["cat-file", "-e", `${commit}^{commit}`], { cwd: dir, stdio: "ignore" })
      .status === 0;
  if (present()) return;
  const url = `${server}/${repository}.git`;
  // The job's token reads this repository; another public repository reads without it.
  for (const auth of [["-c", `http.extraheader=${header}`], []]) {
    spawnSync(
      "git",
      [...auth, "fetch", "--quiet", ...(shallow ? ["--depth=1"] : []), url, commit],
      {
        cwd: dir,
        stdio: "ignore",
      },
    );
    if (present()) return;
  }
  throw new Error(`${repository} at ${commit} cannot be fetched`);
}

/**
 * Where an operation target's pinned revision is read (T3.5 H3): this
 * repository's own checkout, or a separate checkout below `temp` of another
 * repository the job can read, fetched at exactly that revision. Candidate
 * work only ever sees the snapshot the run imports from it.
 */
export function targetRepositories(
  api: GitHubApi,
  options: { root: string; server: string; header: string; temp: string },
): (repository: string, revision: string) => Promise<string | null> {
  return (repository, revision) => {
    try {
      if (repository === api.repository) {
        fetchCommit(options.root, options.server, repository, revision, options.header);
        return Promise.resolve(options.root);
      }
      const dir = join(options.temp, "targets", repository.replace("/", "--"));
      if (!existsSync(join(dir, ".git"))) {
        mkdirSync(dir, { recursive: true });
        spawnSync("git", ["init", "--quiet"], { cwd: dir, stdio: "ignore" });
      }
      fetchCommit(dir, options.server, repository, revision, options.header, true);
      return Promise.resolve(dir);
    } catch {
      return Promise.resolve(null);
    }
  };
}
