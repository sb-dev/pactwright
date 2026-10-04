// T3.5 H3: portable run state (production readiness log §3 H3, requirement 1;
// Spec 00 §4). A run directory — journal, evidence, candidate Git history and
// therefore the effective configuration, approvals, counters and receipts it
// records — travels between hosted jobs as one validated archive with an
// increasing sequence number. A job restores the exact latest sequence;
// missing, damaged or stale state is refused, never replaced by a new run.
// One writer saves at a time: a save refuses when the store already holds
// its sequence or a later one, so a fenced controller cannot overwrite the
// state of the job that took the run over.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import stringify from "safe-stable-stringify";
import { c as createTar, x as extractTar } from "tar";

import { FencedError, readRun } from "./evidence.js";

/** A harness run name: the stable identifier the workflow's `run` input gives. */
export const RUN_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;

export const ARCHIVE = "state.tar.gz";
export const MANIFEST = "state.json";

/** What a saved state is: its run, sequence, journal head and archive digest. */
export type StateManifest = {
  format: 1;
  /** The harness run name. */
  name: string;
  sequence: number;
  /** The run directory's own identifier (its manifest's `run`). */
  run: string;
  journal: { seq: number; head: string | null; epoch: number; released: boolean };
  /** The pinned controller revision and the harness identity that wrote it. */
  controller: { commit: string; identity: string };
  /** SHA-256 of the archive. */
  archive: string;
  created: string;
};

/** One saved state in a store. `id` is the store's own identifier. */
export type SavedState = {
  id: string;
  name: string;
  sequence: number;
  expired: boolean;
  expiresAt: string | null;
  /** Where an operator can fetch it, if the store has an address. */
  url: string | null;
  /** The workflow run that saved it, for an Actions artifact. */
  workflowRun?: number | null;
};

export type StateFiles = { archive: string; manifest: string };

/** Where saved states live: Actions artifacts on GitHub, a directory in tests. */
export type StateStore = {
  /** Every saved state of the run name, expired ones included. */
  list(name: string): Promise<SavedState[]>;
  /** Downloads a saved state's files into `into`. */
  download(saved: SavedState, into: string): Promise<StateFiles>;
  /** Stores a new saved state; the caller checks sequences first. */
  upload(name: string, sequence: number, files: StateFiles): Promise<SavedState>;
};

export const artifactName = (name: string, sequence: number): string =>
  `harness-${name}-${String(sequence).padStart(6, "0")}`;

const digest = (bytes: Buffer): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/**
 * Packs the run directory, without its scratch `tmp/`, into `out` with its
 * manifest. The run must be quiescent: the controller saves between actions.
 */
export async function packState(
  runDir: string,
  out: string,
  meta: { name: string; sequence: number; controller: StateManifest["controller"] },
): Promise<{ manifest: StateManifest; files: StateFiles }> {
  if (!RUN_NAME.test(meta.name)) throw new Error(`${meta.name}: not a run name`);
  const read = readRun(runDir);
  if (!read.ok) throw new Error(`${runDir}: ${read.diagnostics.join("; ")}`);
  const { manifest: runManifest, events, owner, head } = read.records;
  mkdirSync(out, { recursive: true });
  const archive = join(out, ARCHIVE);
  await createTar(
    {
      gzip: true,
      file: archive,
      cwd: runDir,
      portable: true,
      filter: (path) => path !== "./tmp" && !path.startsWith("./tmp/"),
    },
    ["."],
  );
  const manifest: StateManifest = {
    format: 1,
    name: meta.name,
    sequence: meta.sequence,
    run: runManifest.run,
    journal: {
      seq: events.at(-1)?.seq ?? 0,
      head,
      epoch: owner.epoch,
      released: owner.released,
    },
    controller: meta.controller,
    archive: digest(readFileSync(archive)),
    created: new Date().toISOString(),
  };
  const manifestFile = join(out, MANIFEST);
  writeFileSync(manifestFile, `${stringify(manifest, null, 2)}\n`);
  return { manifest, files: { archive, manifest: manifestFile } };
}

export type Unpacked =
  { ok: true; dir: string; manifest: StateManifest } | { ok: false; diagnostics: string[] };

function parseManifest(file: string): StateManifest | string {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return `${file}: ${e instanceof Error ? e.message : String(e)}`;
  }
  const m = value as Partial<StateManifest> | null;
  const count = (n: unknown): boolean => Number.isSafeInteger(n) && (n as number) >= 0;
  const ok =
    m !== null &&
    m.format === 1 &&
    typeof m.name === "string" &&
    count(m.sequence) &&
    typeof m.run === "string" &&
    typeof m.archive === "string" &&
    count(m.journal?.seq) &&
    count(m.journal?.epoch) &&
    typeof m.journal?.released === "boolean" &&
    (m.journal.head === null || typeof m.journal.head === "string") &&
    typeof m.controller?.commit === "string" &&
    typeof m.controller.identity === "string";
  return ok ? (m as StateManifest) : `${file}: not a state manifest`;
}

/**
 * Restores a saved state into `into`, a new directory. Refuses a manifest of
 * another run name or sequence, an archive that is not the one the manifest
 * names, an archive entry that is not a plain file or directory inside the
 * run, and a run whose records do not validate or whose journal is not the
 * one the manifest names.
 */
export async function unpackState(
  files: StateFiles,
  into: string,
  expected: { name: string; sequence: number },
): Promise<Unpacked> {
  const fail = (...diagnostics: string[]): Unpacked => ({ ok: false, diagnostics });
  if (!existsSync(files.manifest) || !existsSync(files.archive)) {
    return fail(`saved state ${expected.name} ${expected.sequence} is missing its files`);
  }
  const manifest = parseManifest(files.manifest);
  if (typeof manifest === "string") return fail(manifest);
  if (manifest.name !== expected.name || manifest.sequence !== expected.sequence) {
    return fail(
      `the saved state is ${manifest.name} ${manifest.sequence}, not ${expected.name} ${expected.sequence}`,
    );
  }
  if (digest(readFileSync(files.archive)) !== manifest.archive) {
    return fail(`the archive of ${expected.name} ${expected.sequence} is damaged`);
  }
  if (existsSync(into)) return fail(`${into}: already exists`);
  mkdirSync(into, { recursive: true });
  const unsafe: string[] = [];
  try {
    await extractTar({
      file: files.archive,
      cwd: into,
      strict: true,
      filter: (path, entry) => {
        const type = "type" in entry ? entry.type : "File";
        const plain = type === "File" || type === "Directory";
        const inside = !path.startsWith("/") && !path.split("/").includes("..");
        if (!plain || !inside) unsafe.push(`${path} (${type})`);
        return plain && inside;
      },
    });
  } catch (e) {
    return fail(`the archive of ${expected.name} ${expected.sequence} is damaged: ${String(e)}`);
  }
  if (unsafe.length > 0) return fail(`the archive holds unsafe entries: ${unsafe.join(", ")}`);
  mkdirSync(join(into, "tmp"), { recursive: true });
  const read = readRun(into);
  if (!read.ok) return fail(...read.diagnostics);
  const { manifest: runManifest, events, owner, head } = read.records;
  const journal = {
    seq: events.at(-1)?.seq ?? 0,
    head,
    epoch: owner.epoch,
    released: owner.released,
  };
  if (runManifest.run !== manifest.run || stringify(journal) !== stringify(manifest.journal)) {
    return fail(
      `the restored journal ${stringify(journal)} of ${runManifest.run} is not the saved ${stringify(manifest.journal)} of ${manifest.run}`,
    );
  }
  return { ok: true, dir: into, manifest };
}

export type Latest =
  | { kind: "found"; saved: SavedState }
  | { kind: "missing" }
  | { kind: "refused"; diagnostics: string[] };

/**
 * The latest saved state of a run name. Two states with one sequence mean
 * competing writers; an expired latest sequence would roll the run back to an
 * older one. Both are refused.
 */
export async function latestState(store: StateStore, name: string): Promise<Latest> {
  const saved = firsts(await store.list(name));
  const latest = saved.at(-1);
  if (!latest) return { kind: "missing" };
  if (latest.expired) {
    return {
      kind: "refused",
      diagnostics: [
        `${name}: the latest state, sequence ${latest.sequence}, has expired; an earlier one would roll the run back`,
      ],
    };
  }
  return { kind: "found", saved: latest };
}

/** Whether artifact `a` was stored before `b`: artifact IDs increase. */
const earlier = (a: SavedState, b: SavedState): boolean =>
  a.id.length !== b.id.length ? a.id.length < b.id.length : a.id < b.id;

/**
 * The saved states in sequence order, each sequence by its first save. Two
 * controllers racing past the sequence check can both store one sequence;
 * the first save stands and the later writer fences itself (`saveState`).
 */
function firsts(saved: readonly SavedState[]): SavedState[] {
  const bySequence = new Map<number, SavedState>();
  for (const s of saved) {
    const kept = bySequence.get(s.sequence);
    if (!kept || earlier(s, kept)) bySequence.set(s.sequence, s);
  }
  return [...bySequence.values()].sort((a, b) => a.sequence - b.sequence);
}

/**
 * Saves `files` as `sequence` only when the store holds no state of the run
 * name at or after it, then checks that no other writer saved the same
 * sequence first meanwhile. A refusal is a FencedError: another controller
 * writes the run.
 */
export async function saveState(
  store: StateStore,
  name: string,
  sequence: number,
  files: StateFiles,
): Promise<SavedState> {
  const newer = (await store.list(name)).filter((s) => s.sequence >= sequence);
  if (newer.length > 0) {
    throw new FencedError(
      `${name}: sequence ${Math.max(...newer.map((s) => s.sequence))} is already saved; another controller owns the run`,
    );
  }
  const saved = await store.upload(name, sequence, files);
  const first = (await store.list(name)).filter(
    (s) => s.sequence === sequence && s.id !== saved.id && earlier(s, saved),
  );
  if (first.length > 0) {
    throw new FencedError(`${name}: sequence ${sequence} was saved first by another controller`);
  }
  return saved;
}
