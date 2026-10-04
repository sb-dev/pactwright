// Test helpers (T3.5 H3): the hosted fixture CP95 in a local Git repository,
// a state store in a directory, an in-memory GitHub (branches, pull requests,
// reviews, comments, jobs, artifacts) with the effects a hosted effects job
// performs, and one `job` call per hosted job: each restores the saved state
// into a fresh directory under its own GitHub run, job and attempt, as a new
// runner would. Agents are scripted; producer commands run as local
// processes. Nothing here writes a journal.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Packet, ReviewVerdict } from "../src/claude.js";
import { exportRevision } from "../src/contracts.js";
import {
  readEvidence,
  readRun,
  type JournalEvent,
  type Liveness,
  type OwnerRecord,
  type RunHandle,
} from "../src/evidence.js";
import type {
  FeedbackSource,
  IssueComment,
  PullRequest,
  Review,
  ReviewComment,
} from "../src/pull-requests.js";
import {
  containedProducer,
  EffectRefused,
  type EffectRequest,
  type EffectService,
  type Receipt,
  type Workspaces,
} from "../src/runner.js";
import { createRegistry, FIXTURE_BINDINGS } from "../src/software-bootstrap.js";
import type { SavedState, StateFiles, StateStore } from "../src/state.js";
import { containedWorkspaces } from "../src/verification.js";
import { captureSource, fenceWorkers } from "../src/workspace.js";
import { runFacts, type RunFacts } from "../src/runner.js";
import { APPLICABILITY } from "../src/software-bootstrap.js";
import {
  parseInputs,
  runJob,
  selfCheck,
  type Inputs,
  type JobContext,
  type JobKind,
  type JobOutcome,
  type Services,
} from "../src/workflow.js";
import { scriptedAgent, submit, type ScriptedAgent } from "./runner-fixtures.js";
import { localWorkspaces, passVerdict, reviewerWorkspaces } from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
export const skillsRoot = join(repoRoot, ".claude/skills");

/** The fixture's repository-relative root, as in the Pactwright repository. */
export const H = "tools/checkpoint-harness/test/fixtures/checkpoint-harness";
export const WORK = `${H}/hosted/work`;
export const GREETING = `${WORK}/greeting.mjs`;
export const STAMP = `${WORK}/STAMP.txt`;
export const S01 = "CP95-S01";
export const S02 = "CP95-S02";
export const S03 = "CP95-S03";
/** The repository CP95 Step 3 runs in, and the path of its release list there. */
export const REGISTRY = "sb-dev/pactwright-registry";
export const RELEASES = "RELEASES.md";
export const OWNER = "sb-dev";
export const REPOSITORY = "sb-dev/pactwright";
export const BRANCH = "fixture";
export const TEMPLATE = "h3-fixture.yml";

export const git = (cwd: string, args: string[], input?: string): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] },
  ).trim();

export type Repo = { root: string; head: string };

/**
 * A repository on branch `fixture` holding CP95 at its Pactwright path, the
 * format schema and the hosted template retargeted at this branch; `edit`
 * changes the template first.
 */
export function hostedRepo(scratch: string, edit: (template: string) => string = (t) => t): Repo {
  const root = join(scratch, `repo-${randomUUID()}`);
  mkdirSync(join(root, H), { recursive: true });
  for (const dir of ["docs", "hosted"]) {
    cpSync(join(repoRoot, H, dir), join(root, H, dir), { recursive: true });
  }
  mkdirSync(join(root, "docs/checkpoints"), { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  mkdirSync(join(root, ".github/checkpoint-harness"), { recursive: true });
  const template = readFileSync(
    join(repoRoot, `.github/checkpoint-harness/${TEMPLATE}`),
    "utf8",
  ).replace(/branch: .*/, `branch: ${BRANCH}`);
  writeFileSync(join(root, `.github/checkpoint-harness/${TEMPLATE}`), edit(template));
  git(root, ["init", "-q", "-b", BRANCH]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

/** The registry repository: CP95 Step 3's declared target, a repository of its own. */
export function registryRepo(scratch: string): Repo {
  const root = join(scratch, `registry-${randomUUID()}`);
  cpSync(join(repoRoot, H, "registry"), root, { recursive: true });
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "registry"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

/** The template's declaration that Step 3 runs in the registry at `revision`. */
export const registryTarget = (revision: string): string => `
operations:
  targets:
    registry:
      repository: ${REGISTRY}
      revision: ${revision}
      writable: [${RELEASES}]
  steps:
    ${S03}: registry
`;

/** Commits a changed template on the fixture branch and returns the new commit. */
export function commitTemplate(repo: Repo, edit: (template: string) => string): string {
  const file = join(repo.root, `.github/checkpoint-harness/${TEMPLATE}`);
  writeFileSync(file, edit(readFileSync(file, "utf8")));
  git(repo.root, ["add", "-A"]);
  git(repo.root, ["commit", "-q", "--no-gpg-sign", "-m", "template"]);
  return git(repo.root, ["rev-parse", "HEAD"]);
}

/** Saved states in a directory: one subdirectory per saved state, as artifacts are. */
export class DirStore implements StateStore {
  private next = 1;
  readonly states: (SavedState & { dir: string })[] = [];
  constructor(readonly root: string) {
    mkdirSync(root, { recursive: true });
  }
  list(name: string): Promise<SavedState[]> {
    return Promise.resolve(this.states.filter((s) => s.name === name).map((s) => ({ ...s })));
  }
  download(saved: SavedState, into: string): Promise<StateFiles> {
    const found = this.states.find((s) => s.id === saved.id);
    if (!found) return Promise.reject(new Error(`${saved.id}: no such saved state`));
    mkdirSync(into, { recursive: true });
    for (const f of readdirSync(found.dir)) cpSync(join(found.dir, f), join(into, f));
    return Promise.resolve({
      archive: join(into, "state.tar.gz"),
      manifest: join(into, "state.json"),
    });
  }
  upload(name: string, sequence: number, files: StateFiles): Promise<SavedState> {
    const id = String(this.next++);
    const dir = join(this.root, id);
    mkdirSync(dir);
    cpSync(files.archive, join(dir, "state.tar.gz"));
    cpSync(files.manifest, join(dir, "state.json"));
    const saved = {
      id,
      name,
      sequence,
      expired: false,
      expiresAt: "2027-01-01T00:00:00Z",
      url: `https://github.example/artifacts/${id}`,
      workflowRun: null,
    };
    this.states.push({ ...saved, dir });
    return Promise.resolve(saved);
  }
  latest(name: string): SavedState & { dir: string } {
    const found = this.states
      .filter((s) => s.name === name)
      .sort((a, b) => b.sequence - a.sequence)[0];
    assert.ok(found, `${name} has saved state`);
    return found;
  }
  expire(name: string, sequence: number): void {
    for (const s of this.states) if (s.name === name && s.sequence === sequence) s.expired = true;
  }
  /** Damages a saved archive's bytes without its manifest knowing. */
  damage(name: string, sequence: number): void {
    const found = this.states.find((s) => s.name === name && s.sequence === sequence);
    assert.ok(found);
    const file = join(found.dir, "state.tar.gz");
    const bytes = readFileSync(file);
    bytes[bytes.length - 20] = (bytes[bytes.length - 20] ?? 0) ^ 0xff;
    writeFileSync(file, bytes);
  }
  /** Drops saved states, as deletion or expiry beyond listing would. */
  drop(name: string, from = 0): void {
    for (let i = this.states.length - 1; i >= 0; i--) {
      const s = this.states[i];
      if (s?.name === name && s.sequence >= from) this.states.splice(i, 1);
    }
  }
  /** Saves a copy of an existing state under another sequence, as a competing writer would. */
  copy(name: string, from: number, to: number): void {
    const found = this.states.find((s) => s.name === name && s.sequence === from);
    assert.ok(found);
    const manifest = JSON.parse(readFileSync(join(found.dir, "state.json"), "utf8")) as {
      sequence: number;
    };
    manifest.sequence = to;
    const dir = join(this.root, `copy-${to}-${randomUUID()}`);
    mkdirSync(dir);
    cpSync(join(found.dir, "state.tar.gz"), join(dir, "state.tar.gz"));
    writeFileSync(join(dir, "state.json"), JSON.stringify(manifest));
    this.states.push({ ...found, id: String(this.next++), sequence: to, dir });
  }
}

type Pull = PullRequest & { body: string; draft: boolean };

/**
 * GitHub for one repository: branches, pull requests and their feedback,
 * the jobs of workflow runs, effect artifacts and workflow dispatches. Its
 * effects write real commits into the fixture repository, so adopted and
 * reconciled heads are real Git history.
 */
export class FakeGitHub {
  branches = new Map<string, string>();
  pulls = new Map<number, Pull>();
  reviews: (Review & { pull: number })[] = [];
  reviewComments: (ReviewComment & { pull: number })[] = [];
  comments: (IssueComment & { pull: number })[] = [];
  jobs = new Map<string, string>();
  artifacts = new Set<string>();
  executions: { key: string; action: string }[] = [];
  dispatches: Record<string, string>[] = [];
  private ids = 1000;
  constructor(readonly repo: Repo) {
    this.branches.set(BRANCH, repo.head);
  }
  id(): number {
    return this.ids++;
  }
  jobKey(owner: { run_id: number; run_attempt: number; job: string }): string {
    return `${owner.run_id}/${owner.run_attempt}/${owner.job}`;
  }
  liveness = (owner: OwnerRecord): Promise<Liveness> => {
    const job = owner.github;
    if (!job) return Promise.resolve("unknown");
    const status = this.jobs.get(this.jobKey(job));
    return Promise.resolve(
      status === undefined ? "unknown" : status === "completed" ? "dead" : "live",
    );
  };
  /** The one pull request of a branch. */
  pullOf(branch: string): Pull {
    const found = [...this.pulls.values()].find((p) => p.head.ref === branch);
    assert.ok(found, `${branch} has a pull request`);
    return found;
  }
  /** A submitted review with inline comments, by `author`. */
  review(
    pull: number,
    author: string,
    body: string,
    inline: { path: string; line: number; body: string }[] = [],
  ): number {
    const id = this.id();
    this.reviews.push({
      id,
      pull,
      author,
      state: "COMMENTED",
      body,
      url: `https://github.example/review/${id}`,
    });
    for (const c of inline) {
      const cid = this.id();
      this.reviewComments.push({
        id: cid,
        pull,
        review: id,
        author,
        body: c.body,
        path: c.path,
        line: c.line,
        url: `https://github.example/comment/${cid}`,
      });
    }
    return id;
  }
  comment(pull: number, author: string, body: string): number {
    const id = this.id();
    this.comments.push({
      id,
      pull,
      author,
      body,
      url: `https://github.example/issue-comment/${id}`,
    });
    return id;
  }
  /** A commit on the pull request's head by someone else, changing `files`. */
  pushHuman(branch: string, files: Record<string, string>): string {
    const head = this.branches.get(branch);
    assert.ok(head);
    const dir = join(this.repo.root, "..", `human-${randomUUID()}`);
    mkdirSync(dir);
    git(this.repo.root, ["worktree", "add", "-q", "--detach", dir, head]);
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "--no-gpg-sign", "-m", "human change"]);
    const sha = git(dir, ["rev-parse", "HEAD"]);
    git(this.repo.root, ["worktree", "remove", "--force", dir]);
    this.branches.set(branch, sha);
    const pull = [...this.pulls.values()].find((p) => p.head.ref === branch);
    if (pull) pull.head.sha = sha;
    return sha;
  }
  feedback(): FeedbackSource {
    const root = this.repo.root;
    return {
      pull: (n) => Promise.resolve(this.pulls.get(n) ?? null),
      review: (pull, id) =>
        Promise.resolve(this.reviews.find((r) => r.pull === pull && r.id === id) ?? null),
      reviews: (pull) => Promise.resolve(this.reviews.filter((r) => r.pull === pull)),
      reviewComments: (pull) => Promise.resolve(this.reviewComments.filter((c) => c.pull === pull)),
      comments: (pull) => Promise.resolve(this.comments.filter((c) => c.pull === pull)),
      descends: (ancestor, commit) => {
        const ran = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, commit], {
          cwd: root,
        });
        return Promise.resolve(ran.status === 0);
      },
      changed: (from, to) =>
        Promise.resolve(git(root, ["diff", "--name-only", from, to]).split("\n").filter(Boolean)),
    };
  }
  /** The effects of an effects job over a restored run directory. */
  effects(runDir: string, options: { lost?: Set<string> } = {}): EffectService {
    const receipt = (
      key: string,
      request: EffectRequest,
      reference: string,
      details: Receipt["details"],
    ): Receipt => ({
      key,
      target: request.target,
      reference,
      ...(details ? { details } : {}),
    });
    const read = (key: string, request: EffectRequest): Receipt | null => {
      const p = request.payload ?? {};
      switch (request.action) {
        case "push-branch": {
          const head = this.branches.get(String(p.branch));
          return head !== undefined && head === p.commit
            ? receipt(key, request, head, {
                branch: String(p.branch),
                commit: head,
                parent: String(p.parent),
              })
            : null;
        }
        case "open-pr": {
          const pull = [...this.pulls.values()].find(
            (x) => x.head.ref === p.head && x.state === "open",
          );
          return pull
            ? receipt(key, request, pull.url, { number: pull.number, url: pull.url })
            : null;
        }
        case "pr-reply": {
          const found = [...this.comments, ...this.reviewComments].find(
            (c) => c.author === "github-actions[bot]" && c.body.includes(`effect=${key}`),
          );
          return found ? receipt(key, request, found.url, { id: found.id, url: found.url }) : null;
        }
        default:
          return this.artifacts.has(key)
            ? receipt(key, request, `artifact ${key}`, { name: key })
            : null;
      }
    };
    return {
      execute: (key, request) => {
        this.executions.push({ key, action: request.action });
        const p = request.payload ?? {};
        switch (request.action) {
          case "push-branch": {
            const branch = String(p.branch);
            const head = this.branches.get(branch) ?? null;
            if (head !== null && head !== p.commit && head !== p.parent) {
              return Promise.reject(new EffectRefused(`${branch} moved to ${head}`));
            }
            git(this.repo.root, [
              "fetch",
              "-q",
              join(runDir, "source.git"),
              `refs/snapshots/${request.candidate}`,
            ]);
            if (p.commit !== p.parent) {
              const object = [
                `tree ${String(p.tree)}`,
                `parent ${String(p.parent)}`,
                `author Pactwright harness <harness@pactwright.invalid> ${String(p.time)} +0000`,
                `committer Pactwright harness <harness@pactwright.invalid> ${String(p.time)} +0000`,
                "",
                String(p.message),
              ].join("\n");
              const written = git(
                this.repo.root,
                ["hash-object", "-w", "-t", "commit", "--stdin"],
                object,
              );
              assert.equal(written, p.commit, "the publication commit is the intended one");
            }
            this.branches.set(branch, String(p.commit));
            const pull = [...this.pulls.values()].find((x) => x.head.ref === branch);
            if (pull) pull.head.sha = String(p.commit);
            break;
          }
          case "open-pr": {
            const number = this.id();
            this.pulls.set(number, {
              number,
              state: "open",
              url: `https://github.example/pull/${number}`,
              head: {
                ref: String(p.head),
                sha: this.branches.get(String(p.head)) ?? "",
                repository: REPOSITORY,
              },
              base: { ref: String(p.base) },
              body: String(p.body),
              draft: p.draft === true,
            });
            break;
          }
          case "pr-reply": {
            const id = this.id();
            const body = `${String(p.body)}\n\n<!-- pactwright-harness effect=${key} -->`;
            const pull = Number(p.pull);
            if (typeof p.thread === "number") {
              this.reviewComments.push({
                id,
                pull,
                review: null,
                author: "github-actions[bot]",
                body,
                path: "",
                line: null,
                url: `https://github.example/comment/${id}`,
              });
            } else {
              this.comments.push({
                id,
                pull,
                author: "github-actions[bot]",
                body,
                url: `https://github.example/issue-comment/${id}`,
              });
            }
            break;
          }
          default:
            this.artifacts.add(key);
        }
        if (options.lost?.has(request.action)) return Promise.resolve(null);
        return Promise.resolve(read(key, request));
      },
      inspect: (key, request) => Promise.resolve(read(key, request)),
    };
  }
}

/** A producer workspace whose commands run as local processes in an export of the snapshot. */
export function commandProducers(run: RunHandle, root: string): Workspaces["producer"] {
  const within = (path: string, prefixes: readonly string[]): boolean =>
    prefixes.some((p) => path === p || path.startsWith(`${p}/`));
  return async (from, policy) => {
    const dir = join(root, randomUUID());
    mkdirSync(dir, { recursive: true });
    await exportRevision(join(run.dir, "source.git"), from.commit, dir);
    return {
      readFile(path) {
        try {
          return Promise.resolve({ ok: true, bytes: readFileSync(join(dir, path)) });
        } catch {
          return Promise.resolve({ ok: false, reason: `${path}: No such file or directory` });
        }
      },
      writeFile(path, bytes) {
        if (!within(path, policy.writable) || within(path, policy.protected)) {
          return Promise.resolve({ ok: false, reason: `${path}: Read-only file system` });
        }
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), bytes);
        return Promise.resolve({ ok: true });
      },
      exec(argv, { timeoutMs }) {
        const [program = "", ...args] = argv;
        const ran = spawnSync(program, args, {
          cwd: dir,
          timeout: timeoutMs,
          env: { PATH: process.env.PATH ?? "" },
        });
        return Promise.resolve({
          exitCode: ran.status,
          stdout: ran.stdout,
          stderr: ran.stderr,
          timedOut: false,
        });
      },
      seal: (against) =>
        Promise.resolve(captureSource(run.dir, dir, against.base, against.policy, "candidate")),
      close() {
        rmSync(dir, { recursive: true, force: true });
        return Promise.resolve();
      },
    };
  };
}

export const GOOD_GREETING = `// CP95 Step 1: the greeting of HOSTED §1.
export function greet(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "") throw new TypeError("name must not be blank");
  return \`Hello, \${trimmed}!\`;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    console.log(greet(process.argv[2]));
  } catch (e) {
    process.exit(1);
  }
}
`;

/**
 * The fixture producer: Step 1 writes `greeting` (with `extra` appended on a
 * correction that names it); Step 2 runs the stamp procedure. `runCommands:
 * false` submits Step 2 without running anything.
 */
export function fixtureProducer(
  options: { runCommands?: boolean; greeting?: () => string; probes?: string[][] } = {},
): ScriptedAgent {
  return scriptedAgent(async (session) => {
    const { step, findings } = session.packet;
    if (step.id === S01 || findings.some((f) => f.location.includes("greeting.mjs"))) {
      const fix = findings.some((f) => /comment/.test(f.correction))
        ? "// Greets as HOSTED §1 says.\n"
        : "";
      if (step.id === S01) {
        return submit(
          session,
          { [GREETING]: fix + (options.greeting?.() ?? GOOD_GREETING) },
          { greeting: [GREETING] },
        );
      }
      await session.call("write_file", { path: GREETING, content: fix + GOOD_GREETING });
    }
    if (step.id === S02 && options.runCommands !== false) {
      for (const argv of options.probes ?? []) await session.call("run_command", { argv });
      await session.call("run_command", { argv: ["node", `${H}/hosted/stamp.mjs`] });
    }
    if (step.id === S03 && options.runCommands !== false) {
      await session.call("run_command", { argv: ["node", "record.mjs", "CP95"] });
    }
    return submit(session, {}, {});
  });
}

/**
 * The fixture reviewer: passes candidate and adequacy reviews, and assesses
 * feedback by the tag its body starts with — [actionable], [addressed],
 * [declined] or [blocked].
 */
export function fixtureReviewer(): ScriptedAgent {
  return scriptedAgent(({ packet }) => ({ output: verdictFor(packet) }));
}

export function verdictFor(packet: Packet): ReviewVerdict {
  const review = packet.review;
  if (review?.kind !== "feedback")
    return passVerdict(review?.subjects ?? [], review?.targets ?? []);
  const items = (
    review.evidence as { feedback: { subject: string; body: string; path: string | null }[] }
  ).feedback;
  const coverage: ReviewVerdict["coverage"] = [];
  const findings: ReviewVerdict["findings"] = [];
  for (const item of items) {
    const tag = /^\[(\w+)\]/.exec(item.body)?.[1] ?? "addressed";
    if (tag === "actionable") {
      coverage.push({
        subject: item.subject,
        result: "unsatisfied",
        basis: "inspection",
        note: "not yet done",
      });
      findings.push({
        severity: "blocking",
        rule: item.subject,
        location: `${item.path ?? GREETING}:1`,
        defect: "the greeting module has no comment citing its specification",
        correction: "add a comment citing HOSTED §1",
        basis: "inspection",
      });
    } else if (tag === "blocked") {
      coverage.push({
        subject: item.subject,
        result: "not-assessed",
        basis: "inspection",
        note: "needs the owner's decision",
      });
    } else {
      const prefix = tag === "declined" ? "declined:" : "already-addressed:";
      coverage.push({
        subject: item.subject,
        result: "satisfied",
        basis: "inspection",
        note: `${prefix} as recorded`,
      });
    }
  }
  const actionable = findings.length > 0;
  return {
    verdict: actionable
      ? "changes-required"
      : coverage.every((c) => c.result === "satisfied")
        ? "pass"
        : "changes-required",
    coverage,
    targets: [],
    findings,
    blockers: [],
  };
}

export type World = {
  scratch: string;
  repo: Repo;
  store: DirStore;
  github: FakeGitHub;
  producer: ScriptedAgent;
  reviewer: ScriptedAgent;
  run: string;
  runs: number;
  /** The registry repository, when the template declares Step 3's target. */
  registry: Repo | null;
  /** Whether candidate work runs in Docker containment, as hosted jobs run it. */
  contained: boolean;
  /** The controller environment each job runs with. */
  env: Record<string, string>;
};

export function world(
  scratch: string,
  options: {
    edit?: (t: string) => string;
    run?: string;
    registry?: boolean;
    contained?: boolean;
    env?: Record<string, string>;
  } = {},
): World {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  const registry = options.registry ? registryRepo(dir) : null;
  const edit = options.edit ?? ((t: string) => t);
  const repo = hostedRepo(dir, registry ? (t) => edit(t) + registryTarget(registry.head) : edit);
  return {
    registry,
    contained: options.contained ?? false,
    env: options.env ?? { CLAUDE_CODE_OAUTH_TOKEN: "test-token" },
    scratch: dir,
    repo,
    store: new DirStore(join(dir, "store")),
    github: new FakeGitHub(repo),
    producer: fixtureProducer(),
    reviewer: fixtureReviewer(),
    run: options.run ?? "h3-test",
    runs: 0,
  };
}

export class Crash extends Error {
  override name = "Crash";
}

/**
 * One hosted job: a fresh runner directory, its own workflow run ID and job
 * identity, the shared store and GitHub. `actor` dispatched it; `live` keeps
 * the job's status in progress afterwards, as a job still running would.
 */
export async function job(
  w: World,
  kind: JobKind,
  raw: Record<string, string | undefined>,
  options: {
    actor?: string;
    sha?: string;
    live?: boolean;
    lost?: Set<string>;
    runId?: number;
    started?: number;
    timeoutMs?: number;
    env?: Record<string, string>;
    /** The branch the job was dispatched on. */
    ref?: string;
  } = {},
): Promise<JobOutcome & { runId: number; error?: unknown }> {
  const parsed = parseInputs({ run: w.run, ...raw });
  assert.ok(parsed.ok, parsed.ok ? "" : parsed.diagnostics.join("; "));
  const inputs: Inputs = parsed.inputs;
  w.runs += 1;
  const runId = options.runId ?? 9000 + w.runs;
  const ctx: JobContext = {
    repository: REPOSITORY,
    actor: options.actor ?? OWNER,
    runId,
    attempt: 1,
    job: kind,
    sha: options.sha ?? w.repo.head,
    ref: options.ref ?? BRANCH,
    started: options.started ?? Date.now(),
    timeoutMs: options.timeoutMs ?? 6 * 60 * 60 * 1000,
    serverUrl: "https://github.example",
  };
  const key = w.github.jobKey({ run_id: runId, run_attempt: 1, job: kind });
  w.github.jobs.set(key, "in_progress");
  const registry = createRegistry([...FIXTURE_BINDINGS]);
  assert.ok(registry.ok);
  // Each job checks out the dispatched commit in a fresh clone, as a hosted runner does.
  const scratch = join(w.scratch, `job-${runId}-${kind}-${randomUUID()}`);
  const checkout = join(scratch, "checkout");
  mkdirSync(scratch, { recursive: true });
  git(scratch, ["clone", "-q", "--no-checkout", w.repo.root, checkout]);
  git(checkout, ["checkout", "-q", "--detach", ctx.sha]);
  const services: Services = {
    store: w.store,
    liveness: w.github.liveness,
    effects: (runDir) => w.github.effects(runDir, options.lost ? { lost: options.lost } : {}),
    feedback: w.github.feedback(),
    branchHead: (branch) => Promise.resolve(w.github.branches.get(branch) ?? null),
    pullsFrom: (branch) =>
      Promise.resolve(
        [...w.github.pulls.values()].filter((p) => p.head.ref === branch).map((p) => p.number),
      ),
    fetch: (commit) => {
      if (
        spawnSync("git", ["cat-file", "-e", `${commit}^{commit}`], { cwd: checkout }).status !== 0
      ) {
        git(checkout, ["fetch", "-q", "origin", commit]);
      }
      return Promise.resolve();
    },
    registry: registry.registry,
    harness: "h3-test",
    skillsRoot,
    env: options.env ?? w.env,
    workspaces: (run, root) =>
      w.contained
        ? {
            producer: containedProducer(run, root),
            verifier: containedWorkspaces(run, root),
            reviewer: containedWorkspaces(run, root),
          }
        : {
            producer: commandProducers(run, root),
            verifier: localWorkspaces(run, root),
            reviewer: reviewerWorkspaces(),
          },
    fence: (run) => (w.contained ? fenceWorkers(run) : Promise.resolve(0)),
    providers: { producer: w.producer, reviewer: w.reviewer },
    ...(w.registry ? { repositories: { [REGISTRY]: w.registry.root } } : {}),
    crash: () => {
      throw new Crash("the runner was lost");
    },
    signal: new AbortController().signal,
  };
  try {
    const paths = { repoRoot: checkout, scratch };
    const outcome = await runJob(kind, inputs, ctx, services, paths);
    // Every job's summary must be what its saved state records (H3-11).
    const mismatches = await selfCheck(outcome, inputs, services, paths, (dir) =>
      runFacts(dir, {
        repoRoot: checkout,
        skillsRoot,
        env: services.env,
        applicability: APPLICABILITY,
        registry: services.registry,
        harness: services.harness,
      }),
    );
    assert.deepEqual(mismatches, [], `${kind} job summary disagrees with its saved state`);
    return { ...outcome, runId };
  } catch (error) {
    if (!(error instanceof Crash)) throw error;
    return {
      exit: 1,
      next: "none",
      summary: { action: inputs.action } as JobOutcome["summary"],
      dispatch: null,
      saved: null,
      runId,
      error,
    };
  } finally {
    if (!options.live) w.github.jobs.set(key, "completed");
    rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * Runs a dispatch as the workflow would: route, then the controller and
 * effects jobs it hands the run to, within one workflow run.
 */
export async function dispatch(
  w: World,
  raw: Record<string, string | undefined>,
  options: Parameters<typeof job>[3] = {},
): Promise<(JobOutcome & { runId: number; kind: JobKind; error?: unknown })[]> {
  const outcomes: (JobOutcome & { runId: number; kind: JobKind; error?: unknown })[] = [];
  const runId = options.runId ?? 9000 + w.runs + 1;
  let kind = ((): JobKind | null => "route")();
  while (kind) {
    const outcome = await job(w, kind, raw, { ...options, runId });
    outcomes.push({ ...outcome, kind });
    if (outcome.error) break;
    kind =
      outcome.next === "controller" && kind === "route"
        ? "controller"
        : outcome.next === "effects" && kind !== "effects"
          ? "effects"
          : null;
  }
  return outcomes;
}

/** The latest saved state of a run, restored into a fresh directory for inspection. */
export function savedDir(w: World): string {
  const latest = w.store.latest(w.run);
  const dir = join(w.scratch, `inspect-${randomUUID()}`);
  mkdirSync(dir);
  execFileSync("tar", ["-xzf", join(latest.dir, "state.tar.gz"), "-C", dir]);
  if (!existsSync(join(dir, "tmp"))) mkdirSync(join(dir, "tmp"));
  return dir;
}

/** The facts of the latest saved state, as a fresh runner would read them. */
export async function factsOf(w: World): Promise<RunFacts> {
  const registry = createRegistry([...FIXTURE_BINDINGS]);
  assert.ok(registry.ok);
  const read = await runFacts(savedDir(w), {
    repoRoot: w.repo.root,
    skillsRoot,
    env: {},
    applicability: APPLICABILITY,
    registry: registry.registry,
    harness: "h3-test",
  });
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("; "));
  return read.facts;
}

/** The records of `action` in the latest saved state, in journal order. */
export function recordsOf<T>(w: World, action: string, dir = savedDir(w)): T[] {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("; "));
  return read.records.events
    .filter((e) => e.action === action)
    .map((e) => {
      const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
      assert.ok(ref);
      return JSON.parse(readEvidence(dir, ref).toString("utf8")) as T;
    });
}

/** The journal events of the latest saved state. */
export function eventsOf(w: World, dir = savedDir(w)): JournalEvent[] {
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("; "));
  return read.records.events;
}

/** The request and candidate an approval pause names, from a summary's next action. */
export function pendingOf(outcome: JobOutcome): { request: string; candidate: string } {
  const match = /request (\S+) for candidate (\S+)/.exec(outcome.summary.next);
  assert.ok(match, `no pending approval in: ${outcome.summary.next}`);
  return { request: match[1] ?? "", candidate: match[2] ?? "" };
}
