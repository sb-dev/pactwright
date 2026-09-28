// T3-B: candidate isolation and source identity (Task 3 research log §§5, 8
// and §12). A workspace is an exported snapshot, without Git metadata,
// mounted into one long-lived Linux Docker container of a pinned image. Every
// candidate file operation and command, including background children, runs
// through that container: no network, read-only root, unprivileged user, no
// capabilities, resource limits, and writes only below the policy's writable
// and scratch paths, with protected paths mounted read-only over them. The
// controller root is never mounted. Sealing removes the container first,
// captures the files into the run's source repository, and checks the
// captured diff against the policy as a second control.

import { execFile, execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  lchownSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  rmSync,
} from "node:fs";
import { devNull, tmpdir } from "node:os";
import { isAbsolute, join, posix, resolve, sep } from "node:path";
import { promisify } from "node:util";

import stringify from "safe-stable-stringify";

import { exportRevision, sha256 } from "./contracts.js";
import type { RunHandle } from "./evidence.js";

/**
 * The containment profile. The image is `node:22-bookworm-slim`, pinned by
 * digest; every setting is part of the toolchain identity.
 */
export const PROFILE = {
  kind: "linux-docker",
  image: "node@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c",
  network: "none",
  rootfs: "read-only",
  capabilities: "none",
  memory: "512m",
  cpus: "1",
  pids: 128,
  tmp: "64m",
} as const;

export const profileDigest: string = sha256(stringify(PROFILE));

/** User for candidate processes when the controller runs as root. */
const CANDIDATE_ID = 65532;

export type WritePolicy = {
  /** Paths the candidate may change; their changes are sealed. */
  writable: readonly string[];
  /** Paths the candidate may write that are never sealed, such as build output. */
  scratch: readonly string[];
  /** Paths that stay read-only even inside a writable path. */
  protected: readonly string[];
};

export type SourceSnapshot = { commit: string; tree: string };

export type Change = { path: string; kind: "added" | "modified" | "deleted" };

export type SealedCandidate = SourceSnapshot & {
  base: SourceSnapshot | null;
  changes: Change[];
};

export type Capture =
  { ok: true; candidate: SealedCandidate } | { ok: false; diagnostics: string[] };

export type Workspace = {
  readonly id: string;
  readonly run: string;
  readonly root: string;
  readonly base: SourceSnapshot;
  readonly policy: WritePolicy;
  readonly container: string;
  fenced: boolean;
};

export type ExecResult = {
  exitCode: number | null;
  stdout: Buffer;
  stderr: Buffer;
  timedOut: boolean;
};

export type FileResult = { ok: true; bytes: Buffer } | { ok: false; reason: string };
export type WriteResult = { ok: true } | { ok: false; reason: string };

const execFileAsync = promisify(execFile);

const sourceGit = (runDir: string): string => join(runDir, "source.git");

/** Git without system/user configuration, so hooks, filters or signing cannot affect identity. */
function git(runDir: string, args: string[], input?: string | Buffer, index?: string): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    input,
    maxBuffer: 1 << 28,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH ?? "",
      GIT_DIR: sourceGit(runDir),
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: devNull,
      ...(index ? { GIT_INDEX_FILE: index } : {}),
      GIT_AUTHOR_NAME: "Pactwright harness",
      GIT_AUTHOR_EMAIL: "harness@pactwright.invalid",
      GIT_AUTHOR_DATE: "1970-01-01T00:00:00+0000",
      GIT_COMMITTER_NAME: "Pactwright harness",
      GIT_COMMITTER_EMAIL: "harness@pactwright.invalid",
      GIT_COMMITTER_DATE: "1970-01-01T00:00:00+0000",
    },
  }).trim();
}

const hasControl = (text: string): boolean =>
  [...text].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);

/** A policy path: relative, normalised, inside the workspace and not Git metadata. */
function policyPathError(path: string): string | null {
  if (path === "" || isAbsolute(path) || posix.normalize(path) !== path || path === ".") {
    return `${path}: not a normalised relative path`;
  }
  if (path.split("/").some((part) => part === ".." || part === ".git")) {
    return `${path}: escapes the workspace or names Git metadata`;
  }
  if (/[,"]/.test(path) || hasControl(path)) return `${path}: unsupported character`;
  return null;
}

const within = (path: string, prefixes: readonly string[]): boolean =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

type Entry = { path: string; mode: "100644" | "100755" | "120000"; file: string; target?: string };

function walk(
  root: string,
  rel: string,
  scratch: readonly string[],
  out: Entry[],
  diagnostics: string[],
): void {
  for (const name of readdirSync(join(root, rel)).sort()) {
    const path = rel === "" ? name : `${rel}/${name}`;
    if (within(path, scratch)) continue;
    if (hasControl(name)) {
      diagnostics.push(`${JSON.stringify(path)}: control character in path`);
      continue;
    }
    if (name === ".git") {
      diagnostics.push(`${path}: Git metadata is not source`);
      continue;
    }
    const file = join(root, path);
    const stat = lstatSync(file);
    if (stat.isDirectory()) walk(root, path, scratch, out, diagnostics);
    else if (stat.isFile()) {
      out.push({ path, mode: stat.mode & 0o100 ? "100755" : "100644", file });
    } else if (stat.isSymbolicLink()) {
      const target = readlinkSync(file);
      const resolved = posix.normalize(posix.join(posix.dirname(path), target));
      if (isAbsolute(target) || resolved === ".." || resolved.startsWith("../")) {
        diagnostics.push(`${path}: unsafe link to ${target}`);
      } else out.push({ path, mode: "120000", file, target });
    } else diagnostics.push(`${path}: not a regular file, directory or link`);
  }
}

/** Every blob of a tree: path → `mode sha`. */
export function treeEntries(runDir: string, tree: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const record of git(runDir, ["ls-tree", "-r", "-z", "--full-tree", tree]).split("\0")) {
    const match = /^(\d+) \w+ ([0-9a-f]+)\t(.*)$/s.exec(record);
    if (match) entries.set(match[3] ?? "", `${match[1]} ${match[2]}`);
  }
  return entries;
}

/**
 * Captures the files under `dir` as a source snapshot in the run's source
 * repository. Links are never followed. Scratch paths are excluded. Special
 * files, Git metadata and links leaving the tree are rejected. Against a
 * `base`, any change outside the writable paths or to a protected path is
 * rejected. Identical content yields the same tree and commit.
 */
export function captureSource(
  runDir: string,
  dir: string,
  base: SourceSnapshot | null,
  policy: WritePolicy,
  message: string,
): Capture {
  const entries: Entry[] = [];
  const diagnostics: string[] = [];
  walk(dir, "", policy.scratch, entries, diagnostics);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const files = entries.filter((e) => e.target === undefined);
  const blobs = files.length
    ? git(
        runDir,
        ["hash-object", "-w", "--no-filters", "--stdin-paths"],
        files.map((e) => e.file).join("\n"),
      ).split("\n")
    : [];
  const shas = new Map(files.map((e, i) => [e.path, blobs[i] ?? ""]));
  for (const e of entries) {
    if (e.target !== undefined) {
      shas.set(e.path, git(runDir, ["hash-object", "-w", "--stdin"], Buffer.from(e.target)));
    }
  }
  const captured = new Map(entries.map((e) => [e.path, `${e.mode} ${shas.get(e.path) ?? ""}`]));

  const changes: Change[] = [];
  if (base) {
    const before = treeEntries(runDir, base.tree);
    for (const [path, entry] of captured) {
      const old = before.get(path);
      if (old !== entry) changes.push({ path, kind: old === undefined ? "added" : "modified" });
    }
    for (const path of before.keys()) {
      if (!captured.has(path)) changes.push({ path, kind: "deleted" });
    }
    changes.sort((a, b) => (a.path < b.path ? -1 : 1));
    for (const { path, kind } of changes) {
      if (!within(path, policy.writable) || within(path, policy.protected)) {
        diagnostics.push(`${path}: ${kind} outside the writable paths`);
      }
    }
    if (diagnostics.length > 0) return { ok: false, diagnostics };
  }

  const scratchDir = mkdtempSync(join(tmpdir(), "pactwright-index-"));
  try {
    const index = join(scratchDir, "index");
    const info = entries.map((e) => `${e.mode} ${shas.get(e.path) ?? ""}\t${e.path}\0`).join("");
    git(runDir, ["update-index", "-z", "--index-info"], info, index);
    const tree = git(runDir, ["write-tree"], undefined, index);
    const commit = git(
      runDir,
      ["commit-tree", tree, ...(base ? ["-p", base.commit] : []), "-m", message],
      undefined,
    );
    git(runDir, ["update-ref", `refs/snapshots/${commit}`, commit]);
    return { ok: true, candidate: { commit, tree, base, changes } };
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

/**
 * A snapshot holding only `paths` of `snapshot`, with their exact blobs and
 * modes: a workspace of it runs those files without the rest of the source.
 * Every path must be a file or link of `snapshot`.
 */
export function subsetSnapshot(
  runDir: string,
  snapshot: SourceSnapshot,
  paths: readonly string[],
): SourceSnapshot {
  const entries = treeEntries(runDir, snapshot.tree);
  const info = paths
    .map((path) => {
      const entry = entries.get(path);
      if (entry === undefined) throw new Error(`${path}: not in ${snapshot.commit}`);
      const [mode = "", sha = ""] = entry.split(" ");
      return `${mode} ${sha}\t${path}\0`;
    })
    .join("");
  const scratchDir = mkdtempSync(join(tmpdir(), "pactwright-index-"));
  try {
    const index = join(scratchDir, "index");
    if (info) git(runDir, ["update-index", "-z", "--index-info"], info, index);
    const tree = git(runDir, ["write-tree"], undefined, index);
    const commit = git(runDir, ["commit-tree", tree, "-m", "subset"], undefined);
    git(runDir, ["update-ref", `refs/snapshots/${commit}`, commit]);
    return { commit, tree };
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

/**
 * Imports `commit` of the repository at `repoRoot` as the run's base
 * snapshot, and checks that its captured tree is Git's own tree for it.
 */
export async function importSource(
  run: RunHandle,
  repoRoot: string,
  commit: string,
): Promise<{ ok: true; snapshot: SourceSnapshot } | { ok: false; diagnostics: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "pactwright-import-"));
  try {
    await exportRevision(repoRoot, commit, dir);
    const none: WritePolicy = { writable: [], scratch: [], protected: [] };
    const captured = captureSource(run.dir, dir, null, none, `base ${commit}`);
    if (!captured.ok) return captured;
    const expected = execFileSync("git", ["rev-parse", `${commit}^{tree}`], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    if (captured.candidate.tree !== expected) {
      return {
        ok: false,
        diagnostics: [`${commit}: exported tree ${captured.candidate.tree} is not ${expected}`],
      };
    }
    return {
      ok: true,
      snapshot: { commit: captured.candidate.commit, tree: captured.candidate.tree },
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function docker(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("docker", args, { maxBuffer: 1 << 24 });
  return stdout.trim();
}

function chownTree(path: string, id: number): void {
  lchownSync(path, id, id);
  if (lstatSync(path).isDirectory()) {
    for (const name of readdirSync(path)) chownTree(join(path, name), id);
  }
}

/**
 * Exports `base` from the run's source repository into `root`, a new
 * directory outside the run directory, and starts the workspace container.
 */
export async function createWorkspace(
  run: RunHandle,
  options: { base: SourceSnapshot; root: string; policy: WritePolicy },
): Promise<Workspace> {
  const { base, policy } = options;
  const root = resolve(options.root);
  const runDir = resolve(run.dir);
  if (root === runDir || root.startsWith(runDir + sep) || runDir.startsWith(root + sep)) {
    throw new Error(`${root}: workspace overlaps the run directory`);
  }
  if (/[,"]/.test(root)) throw new Error(`${root}: unsupported character in workspace path`);
  const inBase = treeEntries(run.dir, base.tree);
  const existsInBase = (p: string): boolean =>
    [...inBase.keys()].some((path) => path === p || path.startsWith(`${p}/`));
  // Docker resolves a link in a bind source, so a base link on a policy path
  // or its ancestors would mount other source (such as a protected path) there.
  const linkOn = (p: string): string | undefined =>
    p
      .split("/")
      .map((_, i, parts) => parts.slice(0, i + 1).join("/"))
      .find((prefix) => inBase.get(prefix)?.startsWith("120000 "));
  const paths = [...policy.writable, ...policy.scratch, ...policy.protected];
  const errors = [
    ...paths.flatMap((p) => policyPathError(p) ?? []),
    ...paths.flatMap((p) => {
      const link = linkOn(p);
      return link === undefined ? [] : [`${p}: resolves through a link at ${link}`];
    }),
    ...policy.protected
      .filter((p) => !existsInBase(p))
      .map((p) => `${p}: protected path is absent`),
    ...policy.scratch.filter(existsInBase).map((p) => `${p}: scratch path holds source`),
  ];
  if (errors.length > 0) throw new Error(errors.join("\n"));

  mkdirSync(root);
  await exportRevision(sourceGit(run.dir), base.commit, root);
  const rootUser = process.getuid?.() === 0;
  for (const p of [...policy.writable, ...policy.scratch]) {
    mkdirSync(join(root, p), { recursive: true });
    if (rootUser) chownTree(join(root, p), CANDIDATE_ID);
  }
  const user = rootUser
    ? `${CANDIDATE_ID}:${CANDIDATE_ID}`
    : `${process.getuid?.()}:${process.getgid?.()}`;
  const id = randomUUID();
  const mount = (path: string, readonly: boolean): string[] => [
    "--mount",
    `type=bind,source=${join(root, path)},target=${posix.join("/work", path)}${readonly ? ",readonly" : ""}`,
  ];
  const container = await docker([
    "run",
    "--detach",
    "--label",
    `pactwright.run=${run.run}`,
    "--label",
    `pactwright.workspace=${id}`,
    "--network",
    PROFILE.network,
    "--read-only",
    "--tmpfs",
    `/tmp:rw,nosuid,nodev,size=${PROFILE.tmp}`,
    "--user",
    user,
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--pids-limit",
    String(PROFILE.pids),
    "--memory",
    PROFILE.memory,
    "--memory-swap",
    PROFILE.memory,
    "--cpus",
    PROFILE.cpus,
    "--env",
    "HOME=/tmp",
    "--workdir",
    "/work",
    "--mount",
    `type=bind,source=${root},target=/work,readonly`,
    ...[...policy.writable, ...policy.scratch].flatMap((p) => mount(p, false)),
    ...policy.protected.flatMap((p) => mount(p, true)),
    "--entrypoint",
    "sleep",
    PROFILE.image,
    "infinity",
  ]);
  return { id, run: run.run, root, base, policy, container, fenced: false };
}

/** Runs `argv` inside the workspace container. A timeout fences the whole workspace. */
export async function exec(
  ws: Workspace,
  argv: readonly string[],
  options: { stdin?: Buffer; timeoutMs?: number } = {},
): Promise<ExecResult> {
  if (ws.fenced) throw new Error(`workspace ${ws.id} is fenced`);
  const child = spawn("docker", ["exec", "--interactive", ws.container, ...argv], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout.on("data", (b: Buffer) => stdout.push(b));
  child.stderr.on("data", (b: Buffer) => stderr.push(b));
  child.stdin.end(options.stdin ?? Buffer.alloc(0));
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, options.timeoutMs ?? 60_000);
  const exitCode = await new Promise<number | null>((done) => child.on("close", done));
  clearTimeout(timer);
  if (timedOut) await fence(ws);
  return { exitCode, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), timedOut };
}

function pathError(path: string): string | null {
  const normal = posix.normalize(path);
  return isAbsolute(path) || normal === ".." || normal.startsWith("../")
    ? `${path}: escapes the workspace`
    : null;
}

/** Writes a file through the container, under the same mounts and user as commands. */
export async function writeFile(ws: Workspace, path: string, bytes: Buffer): Promise<WriteResult> {
  const error = pathError(path);
  if (error) return { ok: false, reason: error };
  const result = await exec(ws, ["sh", "-c", 'cat > "$1"', "sh", path], { stdin: bytes });
  return result.exitCode === 0
    ? { ok: true }
    : { ok: false, reason: result.stderr.toString("utf8").trim() };
}

/** Reads a file through the container. */
export async function readFile(ws: Workspace, path: string): Promise<FileResult> {
  const error = pathError(path);
  if (error) return { ok: false, reason: error };
  const result = await exec(ws, ["cat", "--", path]);
  return result.exitCode === 0
    ? { ok: true, bytes: result.stdout }
    : { ok: false, reason: result.stderr.toString("utf8").trim() };
}

/** Kills and removes the workspace container, stopping every process in it. */
export async function fence(ws: Workspace): Promise<void> {
  ws.fenced = true;
  await docker(["rm", "--force", ws.container]);
}

/** Kills and removes every container of a run, including those of a crashed controller. */
export async function fenceWorkers(run: string): Promise<number> {
  const ids = (await docker(["ps", "--all", "--quiet", "--filter", `label=pactwright.run=${run}`]))
    .split("\n")
    .filter(Boolean);
  if (ids.length > 0) await docker(["rm", "--force", ...ids]);
  return ids.length;
}

/**
 * Stops every writer of the workspace, then captures its files as a new
 * snapshot whose parent is the workspace base.
 */
export async function sealCandidate(run: RunHandle, ws: Workspace): Promise<Capture> {
  await fence(ws);
  // A fixed message keeps the commit a function of the tree and base alone.
  return captureSource(run.dir, ws.root, ws.base, ws.policy, "candidate");
}
