// T3-B: the controller-owned run directory, immutable evidence and the fenced
// journal (Task 3 research log §§5, 9 and §12). Evidence is flushed before a
// journal line references it. Ownership is the journal segment itself: a
// controller owns epoch N by atomically publishing `journal/N.jsonl` with its
// owner record, and takes a run over only from a released or provably dead
// owner, never by age. The next owner records how many bytes of the previous
// segment are valid, so a late write can never change the committed record.
// Within the current segment, an anchor file outside the segment fixes the
// committed length and last line after every append.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";

import { sha256 } from "./contracts.js";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export type JournalEvent = {
  seq: number;
  run: string;
  /** Ownership epoch: the segment the event belongs to. */
  epoch: number;
  attempt: number | null;
  action: string;
  evaluation: string | null;
  time: string;
  /** `sha256:` references of evidence blobs flushed before this event. */
  evidence: string[];
  data: JsonObject;
  /** Digest of the previous journal line, across segments. */
  prev: string | null;
};

export type OwnerRecord = {
  host: string;
  pid: number;
  /** The previous segment and its valid byte length, fixed when this owner took over. */
  previous: { epoch: number; length: number } | null;
  /** Evidence reference of the previous segment's incomplete final line, if any. */
  quarantined: string | null;
};

export type RunManifest = { format: 1; run: string; created: string };

/** An open, owned run. Only its controller appends to the journal. */
export type RunHandle = {
  readonly dir: string;
  readonly run: string;
  readonly epoch: number;
  fd: number | null;
  seq: number;
  prev: string | null;
  /** Committed byte length of the owned segment. */
  length: number;
};

/** The committed end of a segment: its length, last seq and last line digest. */
type Anchor = { epoch: number; seq: number; length: number; line: string };

export type EventInput = {
  action: string;
  attempt?: number;
  evaluation?: string;
  evidence?: readonly string[];
  data?: JsonObject;
};

export type Liveness = "released" | "live" | "dead" | "unknown";

export type RunRecords = {
  manifest: RunManifest;
  events: JournalEvent[];
  owner: OwnerRecord & { epoch: number; released: boolean };
  /** Bytes after the last complete line of the current segment: an interrupted write. */
  tail: Buffer | null;
  /** Bytes written to earlier segments after their owner was replaced. */
  ignored: { epoch: number; bytes: number }[];
  /** Digest of the last committed line: the chain head the next event continues. */
  head: string | null;
  /** Committed byte length of the current segment. */
  length: number;
};

export type RunRead = { ok: true; records: RunRecords } | { ok: false; diagnostics: string[] };

export type Recovery =
  | { kind: "recovered"; run: RunHandle; events: JournalEvent[]; quarantined: string | null }
  | { kind: "locked"; owner: OwnerRecord & { epoch: number }; liveness: Liveness }
  | { kind: "paused"; diagnostics: string[] };

export type RecoverOptions = {
  /** Stops every worker of the run (its containers) before the new owner acts. */
  fence: (run: string) => Promise<unknown>;
  /** Liveness of an unreleased owner; defaults to a same-host process check. */
  liveness?: (owner: OwnerRecord) => Liveness;
};

/** Raised when a writer no longer owns the run. */
export class FencedError extends Error {
  override name = "FencedError";
}

const RESERVED = new Set(["owner", "released"]);
const NEWLINE = 0x0a;

const eventSchema: unknown = JSON.parse(
  readFileSync(new URL("./journal-event.schema.json", import.meta.url), "utf8"),
);
const validateEvent = new Ajv2020({ allErrors: true }).compile<JournalEvent>(
  eventSchema as Record<string, unknown>,
);

/** The owner record of a schema-valid `owner` event (the schema checks its shape). */
const ownerOf = (event: JournalEvent): OwnerRecord => event.data as OwnerRecord;

/**
 * Digest of an owner event without its `data.digest`. It is published in the
 * same line, so an owner line is verifiable even before its anchor exists.
 */
function ownerDigest(event: JournalEvent): string {
  const data = { ...event.data };
  delete data.digest;
  const unsigned: JournalEvent = { ...event, data };
  return sha256(stringify(unsigned));
}

const segmentName = (epoch: number): string => `${String(epoch).padStart(6, "0")}.jsonl`;
const segmentPath = (dir: string, epoch: number): string =>
  join(dir, "journal", segmentName(epoch));
const headPath = (dir: string, epoch: number): string =>
  segmentPath(dir, epoch).replace(/\.jsonl$/, ".head");
const REF = /^sha256:[0-9a-f]{64}$/;

function blobPath(dir: string, ref: string): string {
  if (!REF.test(ref)) throw new Error(`${ref}: not an evidence reference`);
  return join(dir, "evidence", ref.slice("sha256:".length));
}

function fsyncDir(dir: string): void {
  const fd = openSync(dir, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** Writes `bytes` to a new temporary file and flushes it before returning its path. */
function flushedTemp(dir: string, bytes: string | Buffer, mode = 0o444): string {
  const path = join(dir, "tmp", randomUUID());
  const fd = openSync(path, "wx", mode);
  try {
    writeSync(fd, typeof bytes === "string" ? Buffer.from(bytes) : bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return path;
}

function storeBlob(dir: string, bytes: Buffer): string {
  const ref = sha256(bytes);
  const path = blobPath(dir, ref);
  if (existsSync(path)) {
    if (sha256(readFileSync(path)) !== ref) throw new Error(`${path}: evidence blob is corrupt`);
    return ref;
  }
  renameSync(flushedTemp(dir, bytes), path);
  fsyncDir(join(dir, "evidence"));
  return ref;
}

/** Reads an evidence blob and checks its digest. */
export function readEvidence(dir: string, ref: string): Buffer {
  const bytes = readFileSync(blobPath(dir, ref));
  if (sha256(bytes) !== ref) throw new Error(`${ref}: evidence blob is corrupt`);
  return bytes;
}

/** Atomically replaces the segment's anchor; a line becomes committed only here. */
function anchor(run: RunHandle, seq: number): void {
  const head: Anchor = { epoch: run.epoch, seq, length: run.length, line: run.prev ?? "" };
  renameSync(flushedTemp(run.dir, `${stringify(head)}\n`), headPath(run.dir, run.epoch));
  fsyncDir(join(run.dir, "journal"));
}

function readAnchor(file: string): Anchor | null {
  const value = parseLine(readFileSync(file)) as Partial<Anchor> | undefined;
  const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
  return value &&
    count(value.epoch) &&
    count(value.seq) &&
    count(value.length) &&
    typeof value.line === "string" &&
    REF.test(value.line)
    ? { epoch: value.epoch, seq: value.seq, length: value.length, line: value.line }
    : null;
}

/** Stores immutable evidence, durable once this returns, and returns its reference. */
export function putEvidence(run: RunHandle, bytes: Buffer | string): string {
  return storeBlob(run.dir, typeof bytes === "string" ? Buffer.from(bytes) : bytes);
}

function takeOwnership(
  dir: string,
  run: string,
  epoch: number,
  seq: number,
  prev: string | null,
  owner: OwnerRecord,
): RunHandle | null {
  const event: JournalEvent = {
    seq,
    run,
    epoch,
    attempt: null,
    action: "owner",
    evaluation: null,
    time: new Date().toISOString(),
    evidence: owner.quarantined ? [owner.quarantined] : [],
    data: owner,
    prev,
  };
  event.data = { ...owner, digest: ownerDigest(event) };
  const line = `${stringify(event)}\n`;
  // The owner appends to its segment, so only it is writable.
  const temp = flushedTemp(dir, line, 0o644);
  try {
    // link() publishes the complete segment atomically and fails if another
    // controller already holds this epoch.
    linkSync(temp, segmentPath(dir, epoch));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") return null;
    throw e;
  } finally {
    unlinkSync(temp);
  }
  fsyncDir(join(dir, "journal"));
  const handle: RunHandle = {
    dir,
    run,
    epoch,
    fd: openSync(segmentPath(dir, epoch), "a"),
    seq: seq + 1,
    prev: sha256(line.slice(0, -1)),
    length: Buffer.byteLength(line),
  };
  // Until this anchor exists, only the owner line (published whole by link) is committed.
  anchor(handle, seq);
  return handle;
}

const self = (): Pick<OwnerRecord, "host" | "pid"> => ({ host: hostname(), pid: process.pid });

/**
 * Creates a controller-owned run directory: an immutable manifest, the first
 * journal segment, the evidence store and the bare repository that holds
 * source snapshots. `dir` must not exist.
 */
export function createRun(dir: string): RunHandle {
  mkdirSync(dir);
  for (const sub of ["journal", "evidence", "tmp"]) mkdirSync(join(dir, sub));
  const manifest: RunManifest = { format: 1, run: randomUUID(), created: new Date().toISOString() };
  renameSync(flushedTemp(dir, `${stringify(manifest)}\n`), join(dir, "manifest.json"));
  execFileSync("git", ["init", "-q", "--bare", join(dir, "source.git")], { stdio: "ignore" });
  fsyncDir(dir);
  const run = takeOwnership(dir, manifest.run, 1, 1, null, {
    ...self(),
    previous: null,
    quarantined: null,
  });
  if (!run) throw new Error(`${dir}: journal already exists`);
  return run;
}

/**
 * Appends one event and flushes it. Every evidence reference must already be
 * durable and intact. Refuses once a newer controller owns the run.
 */
export function appendEvent(run: RunHandle, input: EventInput): JournalEvent {
  if (run.fd === null) throw new FencedError(`${run.dir}: run is closed`);
  if (RESERVED.has(input.action)) throw new Error(`action ${input.action} is reserved`);
  if (existsSync(segmentPath(run.dir, run.epoch + 1))) {
    throw new FencedError(`${run.dir}: epoch ${run.epoch + 1} owns the run`);
  }
  const evidence = [...(input.evidence ?? [])];
  for (const ref of evidence) {
    if (!existsSync(blobPath(run.dir, ref))) throw new Error(`${ref}: evidence is not stored`);
    readEvidence(run.dir, ref);
  }
  return write(run, {
    seq: run.seq,
    run: run.run,
    epoch: run.epoch,
    attempt: input.attempt ?? null,
    action: input.action,
    evaluation: input.evaluation ?? null,
    time: new Date().toISOString(),
    evidence,
    data: input.data ?? {},
    prev: run.prev,
  });
}

function write(run: RunHandle, event: JournalEvent): JournalEvent {
  if (run.fd === null) throw new FencedError(`${run.dir}: run is closed`);
  if (!validateEvent(event)) throw new Error(`invalid event: ${JSON.stringify(event)}`);
  const line = `${stringify(event)}\n`;
  writeSync(run.fd, line);
  fsyncSync(run.fd);
  run.seq += 1;
  run.prev = sha256(line.slice(0, -1));
  run.length += Buffer.byteLength(line);
  anchor(run, event.seq);
  return event;
}

/** Records a clean release, so the next controller may take over without a liveness check. */
export function releaseRun(run: RunHandle): void {
  if (existsSync(segmentPath(run.dir, run.epoch + 1))) {
    throw new FencedError(`${run.dir}: epoch ${run.epoch + 1} owns the run`);
  }
  write(run, {
    seq: run.seq,
    run: run.run,
    epoch: run.epoch,
    attempt: null,
    action: "released",
    evaluation: null,
    time: new Date().toISOString(),
    evidence: [],
    data: {},
    prev: run.prev,
  });
  if (run.fd !== null) closeSync(run.fd);
  run.fd = null;
}

/** Same-host process check; any doubt is `unknown` or `live`, never `dead`. */
export function processLiveness(owner: Pick<OwnerRecord, "host" | "pid">): Liveness {
  if (owner.host !== hostname()) return "unknown";
  try {
    process.kill(owner.pid, 0);
    return "live";
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "ESRCH" ? "dead" : "live";
  }
}

function lines(bytes: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let start = 0;
  for (let i = bytes.indexOf(NEWLINE); i !== -1; i = bytes.indexOf(NEWLINE, start)) {
    out.push(bytes.subarray(start, i));
    start = i + 1;
  }
  return out;
}

function parseLine(line: Buffer): unknown {
  try {
    return JSON.parse(line.toString("utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Reads and validates a run directory without writing anything. Every
 * committed line must parse, match the schema, continue the sequence and the
 * digest chain, and reference intact evidence; otherwise the run is corrupt.
 */
export function readRun(dir: string): RunRead {
  const fail = (cause: string): RunRead => ({ ok: false, diagnostics: [cause] });
  const manifestFile = join(dir, "manifest.json");
  if (!existsSync(manifestFile)) return fail(`${manifestFile}: not a run directory`);
  const manifest = parseLine(readFileSync(manifestFile)) as Partial<RunManifest> | undefined;
  if (manifest?.format !== 1 || typeof manifest.run !== "string") {
    return fail(`${manifestFile}: invalid manifest`);
  }
  const journal = join(dir, "journal");
  const files = existsSync(journal) ? readdirSync(journal).sort() : [];
  const names = files.filter((name) => name.endsWith(".jsonl"));
  if (names.length === 0) return fail(`${journal}: no journal segment`);
  const unexpected =
    names.find((name, i) => name !== segmentName(i + 1)) ??
    files.find((name) => !names.includes(name.replace(/\.head$/, ".jsonl")));
  if (unexpected !== undefined) return fail(`${journal}/${unexpected}: unexpected segment`);
  const segments = names.map((name) => readFileSync(join(journal, name)));
  const currentFile = `${journal}/${names.at(-1)}`;
  const mismatch = `${currentFile}: committed lines do not match their anchor`;

  // Each earlier segment is valid up to the length its successor's owner
  // recorded; the current one up to its anchor.
  const limits: number[] = [];
  let head: Anchor | null = null;
  let headFits = true;
  for (let i = 0; i < segments.length; i += 1) {
    const bytes = segments[i] ?? Buffer.alloc(0);
    const next = segments[i + 1];
    if (next === undefined) {
      const file = headPath(dir, i + 1);
      head = existsSync(file) ? readAnchor(file) : null;
      headFits =
        !existsSync(file) ||
        (head !== null &&
          head.epoch === i + 1 &&
          head.length > 0 &&
          head.length <= bytes.length &&
          bytes[head.length - 1] === NEWLINE);
      limits.push(head && headFits ? head.length : bytes.lastIndexOf(NEWLINE) + 1);
      continue;
    }
    const first = parseLine(next.subarray(0, Math.max(next.indexOf(NEWLINE), 0)));
    const length = validateEvent(first) ? ownerOf(first).previous?.length : undefined;
    if (
      length === undefined ||
      length > bytes.length ||
      (length > 0 && bytes[length - 1] !== NEWLINE)
    ) {
      return fail(`${journal}/${names[i + 1]}:1: owner record does not fix the previous segment`);
    }
    limits.push(length);
  }

  const events: JournalEvent[] = [];
  const ignored: RunRecords["ignored"] = [];
  let prev: string | null = null;
  for (const [i, bytes] of segments.entries()) {
    const epoch = i + 1;
    const limit = limits[i] ?? 0;
    const file = `${journal}/${names[i]}`;
    if (i < segments.length - 1 && bytes.length > limit) {
      ignored.push({ epoch, bytes: bytes.length - limit });
    }
    const committed = lines(bytes.subarray(0, limit));
    if (committed.length === 0) return fail(`${file}: segment has no owner record`);
    for (const [j, line] of committed.entries()) {
      const where = `${file}:${j + 1}`;
      const event = parseLine(line);
      if (event === undefined) return fail(`${where}: not JSON`);
      if (!validateEvent(event)) {
        const [error] = validateEvent.errors ?? [];
        return fail(`${where}: schema: ${error?.instancePath || "/"} ${error?.message ?? ""}`);
      }
      const expected = {
        seq: events.length + 1,
        run: manifest.run,
        epoch,
        prev,
        owner: j === 0,
      };
      const actual = {
        seq: event.seq,
        run: event.run,
        epoch: event.epoch,
        prev: event.prev,
        owner: event.action === "owner",
      };
      if (stringify(actual) !== stringify(expected)) {
        return fail(`${where}: expected ${stringify(expected)}, found ${stringify(actual)}`);
      }
      if (j === 0 && event.data.digest !== ownerDigest(event)) {
        return fail(`${where}: owner record does not match its digest`);
      }
      if (j === 0 && (ownerOf(event).previous?.epoch ?? null) !== (i === 0 ? null : i)) {
        return fail(`${where}: owner record names the wrong previous segment`);
      }
      if (events.at(-1)?.action === "released" && j > 0) {
        return fail(`${where}: event after the owner released the run`);
      }
      for (const ref of event.evidence) {
        if (!existsSync(blobPath(dir, ref))) return fail(`${where}: missing evidence ${ref}`);
        if (sha256(readFileSync(blobPath(dir, ref))) !== ref) {
          return fail(`${where}: corrupt evidence ${ref}`);
        }
      }
      events.push(event);
      prev = sha256(line);
    }
  }

  const last = segments.length;
  const current = segments[last - 1] ?? Buffer.alloc(0);
  const length = limits[last - 1] ?? 0;
  const ownerEvent = events.find((e) => e.epoch === last);
  if (!ownerEvent) return fail(`${journal}: no owner record`);
  if (!headFits) return fail(mismatch);
  if (head && (head.line !== prev || head.seq !== events.at(-1)?.seq)) return fail(mismatch);
  if (!head && events.filter((e) => e.epoch === last).length > 1) {
    return fail(`${currentFile}: committed lines have no anchor`);
  }
  // A crash between a segment write and its anchor leaves at most one line.
  const unanchored = current.subarray(length);
  const complete = lines(unanchored).length;
  if (complete > 1 || (complete === 1 && unanchored.at(-1) !== NEWLINE)) {
    return fail(`${currentFile}: more than one unanchored line`);
  }
  return {
    ok: true,
    records: {
      manifest: { format: 1, run: manifest.run, created: String(manifest.created) },
      events,
      owner: {
        ...ownerOf(ownerEvent),
        epoch: last,
        released: events.at(-1)?.action === "released",
      },
      tail: current.length > length ? current.subarray(length) : null,
      ignored,
      head: prev,
      length,
    },
  };
}

/**
 * Reopens a run after a stop or crash. Corrupt committed records pause
 * recovery without writing anything. A live or uncertain owner is refused.
 * Otherwise the incomplete final line is quarantined as evidence, a new
 * epoch takes ownership, and every old worker is fenced before returning.
 */
export async function recoverRun(dir: string, options: RecoverOptions): Promise<Recovery> {
  const read = readRun(dir);
  if (!read.ok) return { kind: "paused", diagnostics: read.diagnostics };
  const { manifest, events, owner, tail, head, length } = read.records;
  const liveness = owner.released ? "released" : (options.liveness ?? processLiveness)(owner);
  if (liveness !== "released" && liveness !== "dead") return { kind: "locked", owner, liveness };

  const quarantined = tail ? storeBlob(dir, tail) : null;
  const run = takeOwnership(dir, manifest.run, owner.epoch + 1, events.length + 1, head, {
    ...self(),
    previous: { epoch: owner.epoch, length },
    quarantined,
  });
  if (!run) {
    return { kind: "locked", owner: { ...owner, epoch: owner.epoch + 1 }, liveness: "unknown" };
  }
  await options.fence(manifest.run);
  return { kind: "recovered", run, events, quarantined };
}

/** Facts derived from a run's valid records, for `status --run DIR`. */
export function runStatus(
  dir: string,
): { ok: true; status: JsonObject } | { ok: false; diagnostics: string[] } {
  const read = readRun(dir);
  if (!read.ok) return read;
  const { manifest, events, owner, tail, ignored } = read.records;
  const actions: Record<string, number> = {};
  for (const e of events) actions[e.action] = (actions[e.action] ?? 0) + 1;
  const attempts = [...new Set(events.flatMap((e) => (e.attempt === null ? [] : [e.attempt])))];
  return {
    ok: true,
    status: {
      run: manifest.run,
      created: manifest.created,
      owner: {
        epoch: owner.epoch,
        host: owner.host,
        pid: owner.pid,
        state: owner.released ? "released" : processLiveness(owner),
      },
      events: events.length,
      lastSeq: events.at(-1)?.seq ?? 0,
      actions,
      attempts: attempts.sort((a, b) => a - b),
      incompleteTailBytes: tail?.length ?? 0,
      ignoredLateBytes: ignored.reduce((n, i) => n + i.bytes, 0),
    },
  };
}

/**
 * Everything an evaluation depends on besides the controller's own records
 * (research log §5). Changing any part yields a new evaluation identity.
 */
export type EvaluationManifest = {
  source: { commit: string; tree: string };
  definitions: string;
  step: { id: string; definition: string };
  inputs: readonly { step: string; output: string; evaluation: string }[];
  harness: string;
  runModel: string;
  verifiers: Readonly<Record<string, string>>;
  rubric: string | null;
  skills: Readonly<Record<string, string>>;
  configuration: string;
  toolchain: { profile: string; lockfile: string | null };
  /**
   * The applicability decision (T3.5 H1): each inherited target this
   * evaluation leaves pending, with the rule that defers it. Every other
   * target of the step applies.
   */
  pending: readonly Pending[];
  /**
   * The checkpoint exit evaluation's checkpoint evidence, by digest: the
   * controller-built record of every step's acceptance it is given (T3.5 H1).
   * Null for a step's evaluation.
   */
  checkpoint: string | null;
};

/** An inherited target an evaluation leaves pending, by key, and the rule that defers it. */
export type Pending = { target: string; rule: string };

/**
 * SHA-256 of the manifest as key-ordered JSON, with accepted inputs and
 * pending targets in a canonical order.
 */
export function evaluationDigest(manifest: EvaluationManifest): string {
  const inputs = [...manifest.inputs].sort((a, b) =>
    `${a.step}/${a.output}/${a.evaluation}` < `${b.step}/${b.output}/${b.evaluation}` ? -1 : 1,
  );
  const pending = [...manifest.pending].sort((a, b) => (a.target < b.target ? -1 : 1));
  const canonical: EvaluationManifest = { ...manifest, inputs, pending };
  return sha256(stringify(canonical));
}
