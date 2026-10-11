// T3.6 L1: knowledge records and their derived views (evidence-backed
// learning log §2.1, with the applicability rules of §2.2; Spec 00 §4). An
// agent proposes one claim about an evaluated candidate, citing original
// observations by reference. A separate reviewer invocation assesses it. The
// controller admits it only when every cited observation is a committed
// record of the claimed evaluation, an executed basis is a verifier result
// for the claimed target, an inspected basis is a candidate review that read
// the source, the scope keeps the evaluation's dependencies unless an
// inspection and the review justify narrowing it, every contradiction or
// correction it records relates exact entries about the same target and
// scope, and the review is independent and assesses each of those; admission
// is derived here, never supplied by a caller, and binds each relation to the
// related revisions that hold at that scope.
// Views are derived from committed journal events and immutable evidence
// alone and are never saved. Nothing here produces an AcceptedOutput, and
// the acceptance decision reads none of these records. Records carry their
// format and the controller identity that wrote them; another format or
// controller refuses the run rather than migrating it.

import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";

import type { AgentOutcome, ReviewVerdict } from "./claude.js";
import { sha256 } from "./contracts.js";
import {
  appendEvent,
  putEvidence,
  readEvidence,
  readRun,
  type EvaluationManifest,
  type JournalEvent,
  type RunHandle,
} from "./evidence.js";
import { targetKey, type Invocation, type ReviewRecord, type Stored } from "./verification.js";
import { treeEntries, type SourceSnapshot } from "./workspace.js";

export const KNOWLEDGE_FORMAT = 1;

export type ClaimKind = "positive" | "failed-approach" | "counterexample";
export type Basis = "reported" | "inspected" | "executed";

/** One precise assertion about a requirement or target key, and what kind of result it states. */
export type Claim = { assertion: string; target: string; kind: ClaimKind };

/**
 * What a claim relies on: the repository, the definition set, the full
 * candidate or, narrowed with the claim's review, the tree entries of the
 * paths it depends on, and further dependencies by the names
 * `evaluationDependencies` gives them.
 */
export type KnowledgeScope = {
  repository: string;
  definitions: string;
  candidate: SourceSnapshot | { paths: Record<string, string> };
  dependencies: Record<string, string>;
};

/** An agent's proposal, as the controller records it. `proposer` is its agent-invocation record. */
export type KnowledgeProposal = {
  format: typeof KNOWLEDGE_FORMAT;
  controller: string;
  run: string;
  step: string;
  attempt: number;
  /** The evaluation whose candidate the claim describes. */
  evaluation: string;
  round: number | null;
  claim: Claim;
  observations: { ref: string; basis: Basis }[];
  scope: KnowledgeScope;
  proposer: string;
  /** Entries whose claims this one contradicts at the same target and scope. */
  contradicts: string[];
  /** Entries this one corrects at this evaluation's scope. */
  supersedes: string[];
};

/**
 * A relation the controller admitted: the related entry and the exact
 * revisions of it that hold at the admitted proposal's evaluation scope.
 */
export type Relation = {
  relation: "contradicts" | "supersedes";
  entry: string;
  revisions: string[];
};

/** The controller's admission of one proposal; `basis` is the strongest verified observation's. */
export type KnowledgeAdmission = {
  format: typeof KNOWLEDGE_FORMAT;
  controller: string;
  run: string;
  entry: string;
  proposal: string;
  review: string | null;
  disposition: "supported" | "rejected";
  basis: "inspected" | "executed" | null;
  /** The bound relations of a supported proposal; none when rejected. */
  relations: Relation[];
  reasons: string[];
};

/** One evaluated attempt and the decision journaled for it, if any. */
export type AttemptRecord = {
  step: string;
  attempt: number;
  evaluation: string;
  candidate: string;
  decision: "accept" | "correct" | "pause" | null;
  record: string | null;
};

export type Revision = Omit<
  KnowledgeProposal,
  "format" | "controller" | "run" | "step" | "claim"
> & {
  proposal: string;
  admission:
    | (Omit<KnowledgeAdmission, "format" | "controller" | "run" | "entry" | "proposal"> & {
        record: string;
      })
    | null;
  /** Entries whose supported corrections bind this revision. */
  supersededBy: string[];
};

export type KnowledgeEntry = {
  entry: string;
  step: string;
  claim: Claim;
  /** Supersession is evaluated per target, in `applicability`. */
  disposition: "proposed" | "supported" | "rejected";
  /** Entries whose supported corrections bind any revision of this one. */
  supersededBy: string[];
  /** Every proposal of the entry, in journal order. */
  revisions: Revision[];
};

export type KnowledgeView = {
  format: typeof KNOWLEDGE_FORMAT;
  run: string;
  controller: string;
  attempts: AttemptRecord[];
  entries: KnowledgeEntry[];
};

/** The candidate and dependencies knowledge is applied to. */
export type KnowledgeTarget = {
  repository: string;
  definitions: string;
  candidate: SourceSnapshot;
  tree: ReadonlyMap<string, string>;
  dependencies: Readonly<Record<string, string>>;
};

/**
 * Supported entries for a target: current, historical for a changed or
 * unknown dependency, withheld for a conflict, or superseded by a correction
 * that holds at the target.
 */
export type Applicability = {
  current: string[];
  historical: { entry: string; changed: string[]; unknown: string[] }[];
  withheld: { entry: string; conflicts: string[] }[];
  superseded: { entry: string; by: string[] }[];
};

export type Read<T> = { ok: true; value: T } | { ok: false; diagnostics: string[] };

const PROPOSAL = "knowledge-proposal";
const ADMISSION = "knowledge-admission";
const NEGATIVE: readonly ClaimKind[] = ["failed-approach", "counterexample"];
const PROVIDER_FAILURES = new Set(["failed", "cancelled", "exhausted"]);

const DIGEST = { type: "string", pattern: "^sha256:[0-9a-f]{64}$" };
const TEXT = { type: "string", minLength: 1 };
const COUNT = { type: "integer", minimum: 1 };
const DIGESTS = { type: "array", uniqueItems: true, items: DIGEST };
const object = (properties: Record<string, unknown>): Record<string, unknown> => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

const ajv = new Ajv2020({ allErrors: true });
const validateProposal = ajv.compile<KnowledgeProposal>(
  object({
    format: { const: KNOWLEDGE_FORMAT },
    controller: TEXT,
    run: TEXT,
    step: TEXT,
    attempt: COUNT,
    evaluation: DIGEST,
    round: { oneOf: [COUNT, { type: "null" }] },
    claim: object({
      assertion: TEXT,
      target: TEXT,
      kind: { enum: ["positive", "failed-approach", "counterexample"] },
    }),
    observations: {
      type: "array",
      items: object({ ref: DIGEST, basis: { enum: ["reported", "inspected", "executed"] } }),
    },
    scope: object({
      repository: TEXT,
      definitions: TEXT,
      candidate: {
        oneOf: [
          object({ commit: TEXT, tree: TEXT }),
          object({ paths: { type: "object", minProperties: 1, additionalProperties: TEXT } }),
        ],
      },
      dependencies: { type: "object", additionalProperties: TEXT },
    }),
    proposer: DIGEST,
    contradicts: DIGESTS,
    supersedes: DIGESTS,
  }),
);
const validateAdmission = ajv.compile<KnowledgeAdmission>(
  object({
    format: { const: KNOWLEDGE_FORMAT },
    controller: TEXT,
    run: TEXT,
    entry: DIGEST,
    proposal: DIGEST,
    review: { oneOf: [DIGEST, { type: "null" }] },
    disposition: { enum: ["supported", "rejected"] },
    basis: { type: ["string", "null"], enum: ["inspected", "executed", null] },
    relations: {
      type: "array",
      items: object({
        relation: { enum: ["contradicts", "supersedes"] },
        entry: DIGEST,
        revisions: { ...DIGESTS, minItems: 1 },
      }),
    },
    reasons: { type: "array", items: TEXT },
  }),
);

/**
 * A guidance proposal (T3.6 L2, evidence-backed learning log §2.5): one
 * reminder for later attempts of a step, about the rule a reviewed failure
 * left unmet. Text `null` proposes withdrawing the reminder. Occurrences cite
 * blocking findings of committed candidate reviews by record and index.
 */
export type GuidanceProposal = {
  format: typeof KNOWLEDGE_FORMAT;
  controller: string;
  run: string;
  step: string;
  /** The attempt whose evaluation the proposal follows. */
  attempt: number;
  evaluation: string;
  round: number | null;
  guidance: { rule: string; cause: string; text: string | null };
  /** Why the reminder is proposed or withdrawn. */
  reason: string;
  occurrences: { review: string; finding: number }[];
  proposer: string;
  /** Guidance this reminder contradicts. */
  contradicts: string[];
};

/** What a supported reminder relies on: the definitions, step definition and rubric its occurrences were judged under. */
export type GuidanceScope = { definitions: string; step: string; rubric: string };

/** The controller's admission of one guidance proposal. */
export type GuidanceAdmission = {
  format: typeof KNOWLEDGE_FORMAT;
  controller: string;
  run: string;
  guidance: string;
  proposal: string;
  review: string | null;
  disposition: "supported" | "rejected";
  scope: GuidanceScope | null;
  /** The contradicted guidance and its versions this admission is bound to; none when rejected. */
  relations: { guidance: string; versions: string[] }[];
  reasons: string[];
};

const GUIDANCE_PROPOSAL = "guidance-proposal";
const GUIDANCE_ADMISSION = "guidance-admission";

const validateGuidance = ajv.compile<GuidanceProposal>(
  object({
    format: { const: KNOWLEDGE_FORMAT },
    controller: TEXT,
    run: TEXT,
    step: TEXT,
    attempt: COUNT,
    evaluation: DIGEST,
    round: { oneOf: [COUNT, { type: "null" }] },
    guidance: object({ rule: TEXT, cause: TEXT, text: { oneOf: [TEXT, { type: "null" }] } }),
    reason: TEXT,
    occurrences: {
      type: "array",
      items: object({ review: DIGEST, finding: { type: "integer", minimum: 0 } }),
    },
    proposer: DIGEST,
    contradicts: DIGESTS,
  }),
);
const SCOPE = object({ definitions: TEXT, step: TEXT, rubric: TEXT });
const validateGuidanceAdmission = ajv.compile<GuidanceAdmission>(
  object({
    format: { const: KNOWLEDGE_FORMAT },
    controller: TEXT,
    run: TEXT,
    guidance: DIGEST,
    proposal: DIGEST,
    review: { oneOf: [DIGEST, { type: "null" }] },
    disposition: { enum: ["supported", "rejected"] },
    scope: { oneOf: [SCOPE, { type: "null" }] },
    relations: {
      type: "array",
      items: object({ guidance: DIGEST, versions: { ...DIGESTS, minItems: 1 } }),
    },
    reasons: { type: "array", items: TEXT },
  }),
);

/** A stable guidance identity: the run, the step, the rule and the cause, so a new version keeps it. */
export const guidanceId = (p: Pick<GuidanceProposal, "run" | "step" | "guidance">): string =>
  sha256(
    stringify({ run: p.run, step: p.step, rule: p.guidance.rule, cause: p.guidance.cause }) ?? "",
  );

/** A stable entry identity: the run, the step and the claim, so a revalidation keeps it. */
export const entryId = (p: Pick<KnowledgeProposal, "run" | "step" | "claim">): string =>
  sha256(stringify({ run: p.run, step: p.step, claim: p.claim }) ?? "");

/**
 * Every dependency an evaluation records besides its source and definitions,
 * by name: what a claim's scope may rely on.
 */
export function evaluationDependencies(m: EvaluationManifest): Record<string, string> {
  const deps: Record<string, string> = {
    harness: m.harness,
    "run-model": m.runModel,
    configuration: m.configuration,
    toolchain: m.toolchain.profile,
    [`step:${m.step.id}`]: m.step.definition,
  };
  if (m.toolchain.lockfile !== null) deps.lockfile = m.toolchain.lockfile;
  if (m.rubric !== null) deps.rubric = m.rubric;
  if (m.checkpoint !== null) deps.checkpoint = m.checkpoint;
  if (m.operation) deps[`operation:${m.operation.target}`] = m.operation.revision ?? "candidate";
  for (const [id, digest] of Object.entries(m.verifiers)) deps[`verifier:${id}`] = digest;
  for (const [name, digest] of Object.entries(m.skills)) deps[`skill:${name}`] = digest;
  for (const i of m.inputs) deps[`input:${i.step}/${i.output}`] = i.evaluation;
  return deps;
}

/** The target of an evaluation's candidate in a run directory. */
export const knowledgeTarget = (
  dir: string,
  repository: string,
  m: EvaluationManifest,
): KnowledgeTarget => ({
  repository,
  definitions: m.definitions,
  candidate: { commit: m.source.commit, tree: m.source.tree },
  tree: treeEntries(dir, m.source.tree),
  dependencies: evaluationDependencies(m),
});

/** The parts of a scope the target changes, and the dependencies it does not know. */
export function scopeDiff(
  scope: KnowledgeScope,
  target: KnowledgeTarget,
): { changed: string[]; unknown: string[] } {
  const changed: string[] = [];
  const unknown: string[] = [];
  if (scope.repository !== target.repository) changed.push("repository");
  if (scope.definitions !== target.definitions) changed.push("definitions");
  if ("paths" in scope.candidate) {
    for (const [path, entry] of Object.entries(scope.candidate.paths)) {
      if (target.tree.get(path) !== entry) changed.push(`path:${path}`);
    }
  } else if (
    scope.candidate.commit !== target.candidate.commit ||
    scope.candidate.tree !== target.candidate.tree
  ) {
    changed.push("candidate");
  }
  for (const [name, digest] of Object.entries(scope.dependencies)) {
    const now = target.dependencies[name];
    if (now === undefined) unknown.push(name);
    else if (now !== digest) changed.push(name);
  }
  return { changed: changed.sort(), unknown: unknown.sort() };
}

type Committed<T> = Stored<T> & { seq: number };

type Records = {
  events: JournalEvent[];
  proposals: Committed<KnowledgeProposal>[];
  admissions: Committed<KnowledgeAdmission>[];
  guidance: Committed<GuidanceProposal>[];
  guidanceAdmissions: Committed<GuidanceAdmission>[];
};

/**
 * Where learning records are read from (T3.6 L2): the run's committed
 * journal, or the caller's already-read copy of it, and only the events up to
 * `cutoff` when one is given.
 */
export type ReadOptions = { events?: readonly JournalEvent[]; cutoff?: number };

function parse(dir: string, ref: string): unknown {
  try {
    return JSON.parse(readEvidence(dir, ref).toString("utf8"));
  } catch {
    return undefined;
  }
}

/** The kind of learning record an action journals, if it is one. */
const learningKind = (action: string): "knowledge" | "guidance" | null =>
  action.startsWith("knowledge-")
    ? "knowledge"
    : action.startsWith("guidance-")
      ? "guidance"
      : null;

/**
 * The run's committed events and learning records: knowledge and guidance. A
 * corrupt run, a record of another format or controller, a malformed record
 * and an unknown knowledge or guidance action are refused; nothing is skipped
 * or migrated.
 */
function readRecords(dir: string, controller: string, options: ReadOptions = {}): Read<Records> {
  let all: readonly JournalEvent[];
  if (options.events) all = options.events;
  else {
    const read = readRun(dir);
    if (!read.ok) return read;
    all = read.records.events;
  }
  const { cutoff } = options;
  const events = cutoff === undefined ? [...all] : all.filter((e) => e.seq <= cutoff);
  const run = all[0]?.run ?? "";
  const records: Records = {
    events,
    proposals: [],
    admissions: [],
    guidance: [],
    guidanceAdmissions: [],
  };
  const diagnostics: string[] = [];
  for (const e of events) {
    const kind = learningKind(e.action);
    if (kind === null) continue;
    const at = `event ${e.seq} (${e.action})`;
    const ref = e.data.record;
    const known =
      kind === "knowledge"
        ? e.action === PROPOSAL || e.action === ADMISSION
        : e.action === GUIDANCE_PROPOSAL || e.action === GUIDANCE_ADMISSION;
    if (!known) {
      diagnostics.push(`${at}: not a ${kind} record of format ${KNOWLEDGE_FORMAT}`);
      continue;
    }
    if (typeof ref !== "string" || e.evidence[0] !== ref) {
      diagnostics.push(`${at}: names no record`);
      continue;
    }
    const record = parse(dir, ref) as Partial<KnowledgeProposal> | undefined;
    if (record?.format !== KNOWLEDGE_FORMAT) {
      diagnostics.push(
        `${at}: ${kind} record format ${String(record?.format)} is not supported; a run is never migrated`,
      );
      continue;
    }
    if (record.controller !== controller) {
      diagnostics.push(
        `${at}: written by controller ${String(record.controller)}, not ${controller}`,
      );
      continue;
    }
    if (record.run !== run) {
      diagnostics.push(`${at}: names run ${String(record.run)}, not ${run}`);
      continue;
    }
    if (e.action === PROPOSAL) {
      if (!validateProposal(record) || e.data.entry !== entryId(record)) {
        diagnostics.push(`${at}: not a valid knowledge proposal`);
      } else records.proposals.push({ seq: e.seq, ref, record });
      continue;
    }
    if (e.action === GUIDANCE_PROPOSAL) {
      if (!validateGuidance(record) || e.data.guidance !== guidanceId(record)) {
        diagnostics.push(`${at}: not a valid guidance proposal`);
      } else records.guidance.push({ seq: e.seq, ref, record });
      continue;
    }
    const proposed = (record as { proposal?: unknown }).proposal;
    if (e.action === GUIDANCE_ADMISSION) {
      const proposal = records.guidance.find((p) => p.ref === proposed);
      if (
        !validateGuidanceAdmission(record) ||
        !proposal ||
        record.guidance !== guidanceId(proposal.record)
      ) {
        diagnostics.push(`${at}: not a valid admission of a committed guidance proposal`);
      } else if (records.guidanceAdmissions.some((a) => a.record.proposal === proposed)) {
        diagnostics.push(`${at}: admits proposal ${String(proposed)} again`);
      } else records.guidanceAdmissions.push({ seq: e.seq, ref, record });
      continue;
    }
    const proposal = records.proposals.find((p) => p.ref === proposed);
    if (!validateAdmission(record) || !proposal || record.entry !== entryId(proposal.record)) {
      diagnostics.push(`${at}: not a valid admission of a committed proposal`);
    } else if (records.admissions.some((a) => a.record.proposal === record.proposal)) {
      diagnostics.push(`${at}: admits proposal ${record.proposal} again`);
    } else records.admissions.push({ seq: e.seq, ref, record });
  }
  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, value: records };
}

/** The attempt history: every journaled evaluation and the latest decision on it. */
function attemptsOf(dir: string, events: readonly JournalEvent[]): AttemptRecord[] {
  return events.flatMap((e): AttemptRecord[] => {
    if (e.action !== "evaluation" || e.attempt === null || e.evaluation === null) return [];
    const step = String(e.data.step);
    const record = parse(dir, String(e.data.record)) as { manifest: EvaluationManifest };
    const decided = [...events]
      .reverse()
      .find(
        (d) =>
          (d.action === "decision" || d.action === "acceptance") &&
          d.seq > e.seq &&
          d.data.step === step &&
          d.attempt === e.attempt &&
          d.evaluation === e.evaluation,
      );
    return [
      {
        step,
        attempt: e.attempt,
        evaluation: e.evaluation,
        candidate: record.manifest.source.commit,
        decision: (decided?.data.decision as AttemptRecord["decision"] | undefined) ?? null,
        record: decided?.evidence[0] ?? null,
      },
    ];
  });
}

/**
 * The run's attempt history and knowledge entries, derived from its
 * committed records alone. Read-only: a refusal leaves the run untouched.
 */
export function knowledgeView(
  dir: string,
  controller: string,
  options: ReadOptions = {},
): Read<KnowledgeView> {
  const read = readRecords(dir, controller, options);
  return read.ok ? { ok: true, value: viewOf(dir, read.value, controller) } : read;
}

function viewOf(dir: string, records: Records, controller: string): KnowledgeView {
  const { events, proposals, admissions } = records;
  const entries = new Map<string, KnowledgeEntry>();
  for (const { ref, record: p } of proposals) {
    const id = entryId(p);
    const a = admissions.find((x) => x.record.proposal === ref);
    const entry = entries.get(id) ?? {
      entry: id,
      step: p.step,
      claim: p.claim,
      disposition: "proposed",
      supersededBy: [],
      revisions: [],
    };
    entry.revisions.push({
      proposal: ref,
      attempt: p.attempt,
      evaluation: p.evaluation,
      round: p.round,
      observations: p.observations,
      scope: p.scope,
      proposer: p.proposer,
      contradicts: p.contradicts,
      supersedes: p.supersedes,
      admission: a
        ? {
            record: a.ref,
            review: a.record.review,
            disposition: a.record.disposition,
            basis: a.record.basis,
            relations: a.record.relations,
            reasons: a.record.reasons,
          }
        : null,
      supersededBy: [],
    });
    entries.set(id, entry);
  }
  // A supported correction binds only the revisions it was admitted against;
  // where it supersedes them is decided per target.
  const revisions = new Map(
    [...entries.values()].flatMap((e) => e.revisions.map((r) => [r.proposal, r] as const)),
  );
  for (const entry of entries.values()) {
    for (const r of entry.revisions) {
      for (const rel of r.admission?.relations ?? []) {
        if (rel.relation !== "supersedes") continue;
        for (const ref of rel.revisions) revisions.get(ref)?.supersededBy.push(entry.entry);
      }
    }
  }
  for (const entry of entries.values()) {
    entry.supersededBy = [...new Set(entry.revisions.flatMap((r) => r.supersededBy))].sort();
    entry.disposition = entry.revisions.some((r) => r.admission?.disposition === "supported")
      ? "supported"
      : entry.revisions.some((r) => r.admission)
        ? "rejected"
        : "proposed";
  }
  return {
    format: KNOWLEDGE_FORMAT,
    run: events[0]?.run ?? "",
    controller,
    attempts: attemptsOf(dir, events),
    entries: [...entries.values()],
  };
}

/** Which supported entries hold, and with what effect, when `correctors` are the current entries. */
type Settled = {
  correctedBy: Map<string, string[]>;
  applicable: Set<string>;
  conflicts: Map<string, string[]>;
  current: Set<string>;
};

/**
 * Supported entries as they apply to a target. A supported revision holds at
 * the target when it matches it in every part of its scope. A correction
 * supersedes a revision it is bound to only where its own revision holds and
 * its entry is current. An entry is applicable when a holding revision is not
 * superseded; two applicable entries conflict through a recorded
 * contradiction whose own revision is applicable, and both are withheld.
 * Current entries are the applicable ones without a conflict.
 *
 * Because a correction counts only from a current entry, current support is
 * a fixed point: starting with no correction in effect, each round applies
 * the corrections of the previous round's current entries. Relations that
 * never settle leave current only the entries current in every round of
 * their cycle; the rest are withheld. A claim's kind alone never makes a
 * conflict, and rejected or proposed entries are never current. An entry
 * whose holding revisions are all superseded is reported as superseded, and
 * one with no holding revision as historical.
 */
export function applicability(view: KnowledgeView, target: KnowledgeTarget): Applicability {
  const { supported, holding, settled } = settleAt(view, target);
  const result: Applicability = { current: [], historical: [], withheld: [], superseded: [] };
  const order = view.entries.map((e) => e.entry);
  const inOrder = (ids: readonly string[]): string[] => order.filter((id) => ids.includes(id));
  for (const id of order) {
    const mine = supported.filter((x) => x.entry === id);
    if (mine.length === 0) continue;
    const holds = holding.filter((x) => x.entry === id);
    if (settled.current.has(id)) {
      result.current.push(id);
    } else if (settled.applicable.has(id)) {
      result.withheld.push({ entry: id, conflicts: inOrder(settled.conflicts.get(id) ?? []) });
    } else if (holds.length > 0) {
      const by = holds.flatMap((x) => settled.correctedBy.get(x.r.proposal) ?? []);
      result.superseded.push({ entry: id, by: inOrder(by) });
    } else {
      const last = mine.at(-1);
      result.historical.push({
        entry: id,
        changed: last?.changed ?? [],
        unknown: last?.unknown ?? [],
      });
    }
  }
  return result;
}

/**
 * The revisions through which each current entry holds at a target (T3.6
 * L2): its supported revisions that match the target and no current
 * correction supersedes. A consumed revision missing here is no longer
 * current, even when its entry is.
 */
export function currentRevisions(
  view: KnowledgeView,
  target: KnowledgeTarget,
): Map<string, string[]> {
  const { holding, settled } = settleAt(view, target);
  const current = new Map<string, string[]>();
  for (const { entry, r } of holding) {
    if (!settled.current.has(entry) || settled.correctedBy.has(r.proposal)) continue;
    current.set(entry, [...(current.get(entry) ?? []), r.proposal]);
  }
  return current;
}

type Scoped = { entry: string; r: Revision; changed: string[]; unknown: string[] };

/** The supported revisions at a target, those that hold there, and the settled fixed point. */
function settleAt(
  view: KnowledgeView,
  target: KnowledgeTarget,
): { supported: Scoped[]; holding: Scoped[]; settled: Settled } {
  const supported = view.entries.flatMap((e) =>
    e.revisions
      .filter((r) => r.admission?.disposition === "supported")
      .map((r) => ({ entry: e.entry, r, ...scopeDiff(r.scope, target) })),
  );
  const holding = supported.filter((x) => x.changed.length === 0 && x.unknown.length === 0);

  const settle = (correctors: ReadonlySet<string>): Settled => {
    const correctedBy = new Map<string, string[]>();
    for (const { entry, r } of holding) {
      if (!correctors.has(entry)) continue;
      for (const rel of r.admission?.relations ?? []) {
        if (rel.relation !== "supersedes") continue;
        for (const ref of rel.revisions) {
          correctedBy.set(ref, [...(correctedBy.get(ref) ?? []), entry]);
        }
      }
    }
    const live = holding.filter((x) => !correctedBy.has(x.r.proposal));
    const applicable = new Set(live.map((x) => x.entry));
    const conflicts = new Map<string, string[]>();
    const add = (a: string, b: string): void => {
      if (!conflicts.get(a)?.includes(b)) conflicts.set(a, [...(conflicts.get(a) ?? []), b]);
    };
    for (const { entry, r } of live) {
      for (const rel of r.admission?.relations ?? []) {
        if (rel.relation !== "contradicts" || !applicable.has(rel.entry)) continue;
        add(entry, rel.entry);
        add(rel.entry, entry);
      }
    }
    const current = new Set([...applicable].filter((e) => !conflicts.has(e)));
    return { correctedBy, applicable, conflicts, current };
  };

  const key = (set: ReadonlySet<string>): string => [...set].sort().join(" ");
  const rounds: Set<string>[] = [];
  let correctors = new Set<string>();
  let settled = settle(correctors);
  for (;;) {
    rounds.push(correctors);
    const seen = rounds.findIndex((round) => key(round) === key(settled.current));
    if (seen === rounds.length - 1) break;
    if (seen >= 0) {
      // A cycle: only entries current in every round of it stay current.
      const cycle = rounds.slice(seen);
      correctors = new Set(
        [...settled.current].filter((e) => cycle.every((round) => round.has(e))),
      );
      const stable = correctors;
      settled = settle(correctors);
      settled.current = new Set([...settled.current].filter((e) => stable.has(e)));
      break;
    }
    correctors = settled.current;
    settled = settle(correctors);
  }
  return { supported, holding, settled };
}

/**
 * Journals a proposal as an agent made it. Only its shape, run and
 * controller are checked here; admission decides whether it is supported.
 * A malformed proposal, or one for a run whose knowledge records this
 * controller cannot read, is refused before anything is written.
 */
export function proposeKnowledge(
  run: RunHandle,
  proposal: KnowledgeProposal,
): Stored<KnowledgeProposal> {
  if (!validateProposal(proposal)) {
    const [error] = validateProposal.errors ?? [];
    throw new Error(
      `invalid knowledge proposal: ${error?.instancePath || "/"} ${error?.message ?? ""}`,
    );
  }
  if (proposal.run !== run.run) {
    throw new Error(`the proposal names run ${proposal.run}, not ${run.run}`);
  }
  const read = readRecords(run.dir, proposal.controller);
  if (!read.ok) throw new Error(read.diagnostics.join("\n"));
  const ref = putEvidence(run, stringify(proposal));
  appendEvent(run, {
    action: PROPOSAL,
    attempt: proposal.attempt,
    evaluation: proposal.evaluation,
    evidence: [ref],
    data: { record: ref, entry: entryId(proposal), step: proposal.step },
  });
  return { ref, record: proposal };
}

/** The record an event journals: `data.record`, else its first evidence. */
const recordOf = (e: JournalEvent): string | undefined =>
  typeof e.data.record === "string" ? e.data.record : e.evidence[0];

/** The coverage subject a review uses to assess a scope narrower than its evaluation's. */
export const scopeSubject = (entry: string): string => `${entry}/scope`;

/** The coverage subject a review uses to assess a recorded contradiction or correction. */
export const relationSubject = (
  entry: string,
  relation: "contradicts" | "supersedes",
  other: string,
): string => `${entry}/${relation}/${other}`;

/** Why a committed proposal cannot be supported, and the basis it would be supported on. */
function assess(
  dir: string,
  records: Records,
  proposal: Committed<KnowledgeProposal>,
  review: string | null,
): { reasons: string[]; basis: KnowledgeAdmission["basis"]; relations: Relation[] } {
  const { events } = records;
  const p = proposal.record;
  const entry = entryId(p);
  const before = events.filter((e) => e.seq < proposal.seq && learningKind(e.action) === null);
  const reasons: string[] = [];

  // The scope is the evaluation's, or a narrowing of it: fewer dependencies or candidate paths.
  const evaluation = before.find(
    (e) =>
      e.action === "evaluation" &&
      e.evaluation === p.evaluation &&
      e.attempt === p.attempt &&
      e.data.step === p.step,
  );
  const started = before.find((e) => e.action === "run-start");
  let target: KnowledgeTarget | null = null;
  if (!evaluation || !started) {
    reasons.push(`${p.step} attempt ${p.attempt} has no committed evaluation ${p.evaluation}`);
  } else {
    const { manifest } = parse(dir, String(evaluation.data.record)) as {
      manifest: EvaluationManifest;
    };
    const { config } = parse(dir, String(started.data.record)) as {
      config: { repository: { name: string } };
    };
    target = knowledgeTarget(dir, config.repository.name, manifest);
    const diff = scopeDiff(p.scope, target);
    if (diff.changed.length > 0 || diff.unknown.length > 0) {
      reasons.push(
        `the scope is not the evaluation's: changed ${diff.changed.join(", ") || "nothing"}; unknown ${diff.unknown.join(", ") || "nothing"}`,
      );
    }
  }
  const omitted = Object.keys(target?.dependencies ?? {})
    .filter((name) => !Object.hasOwn(p.scope.dependencies, name))
    .sort();
  const paths = "paths" in p.scope.candidate ? Object.keys(p.scope.candidate.paths).sort() : [];
  const narrowed = omitted.length > 0 || paths.length > 0;
  if (
    p.round !== null &&
    !before.some((e) => e.action === "pr-round" && e.data.round === p.round)
  ) {
    reasons.push(`pull-request round ${p.round} is not committed`);
  }
  // A contradiction or correction relates this claim to a supported earlier
  // claim about the same step and target that holds at this evaluation.
  const relations = [
    ...p.contradicts.map((id) => ["contradicts", id] as const),
    ...p.supersedes.map((id) => ["supersedes", id] as const),
  ];
  const bound: Relation[] = [];
  for (const [relation, id] of relations) {
    const revisions = records.proposals.filter(
      (x) =>
        x.seq < proposal.seq &&
        entryId(x.record) === id &&
        records.admissions.some(
          (a) => a.record.proposal === x.ref && a.record.disposition === "supported",
        ),
    );
    const [first] = revisions;
    if (id === entry || !first) {
      reasons.push(`${relation} ${id}, which is not a supported earlier entry`);
    } else if (first.record.step !== p.step || first.record.claim.target !== p.claim.target) {
      reasons.push(
        `${relation} ${id}, a claim about ${first.record.step} ${first.record.claim.target}, not ${p.step} ${p.claim.target}`,
      );
    } else if (target) {
      const at = target;
      const holding = revisions.filter((x) => {
        const diff = scopeDiff(x.record.scope, at);
        return diff.changed.length === 0 && diff.unknown.length === 0;
      });
      if (holding.length === 0) {
        reasons.push(`${relation} ${id}, which does not hold at this evaluation's scope`);
      } else bound.push({ relation, entry: id, revisions: holding.map((x) => x.ref) });
    }
  }

  // Each observation is a typed record of the claimed evaluation, committed
  // before the proposal. A child output, such as a run's stdout, is judged by
  // the invocation that owns it. An executed observation is an admitted
  // verifier's result for the claimed target; an inspected one is a
  // candidate review whose recorded tool calls read the candidate's source.
  let basis: KnowledgeAdmission["basis"] = null;
  const executed = new Set<string>();
  const read = new Set<string>();
  if (p.observations.length === 0) reasons.push("the claim cites no observation");
  for (const { ref, basis: declared } of p.observations) {
    const at = `observation ${ref}`;
    const listing =
      before.find((e) => recordOf(e) === ref) ?? before.find((e) => e.evidence.includes(ref));
    if (!listing) {
      const later = events.find((e) => e.evidence.includes(ref));
      const kind = later ? learningKind(later.action) : null;
      const why = kind
        ? `is a ${kind} record, not an original observation`
        : later
          ? "was committed after the proposal"
          : stored(dir, ref)
            ? "is not committed"
            : "is not in the evidence store";
      reasons.push(`${at} ${why}`);
      continue;
    }
    if (
      (listing.attempt !== null && listing.attempt !== p.attempt) ||
      (listing.evaluation !== null && listing.evaluation !== p.evaluation)
    ) {
      reasons.push(`${at} belongs to attempt ${listing.attempt} evaluation ${listing.evaluation}`);
      continue;
    }
    const owner = recordOf(listing);
    const child = owner !== ref;
    const record = owner === undefined ? undefined : parse(dir, owner);
    const negative = NEGATIVE.includes(p.claim.kind);
    if (listing.action === "agent-invocation" && record !== undefined) {
      const outcome = (record as AgentOutcome).outcome;
      if (negative && PROVIDER_FAILURES.has(outcome)) {
        reasons.push(
          `${at} is a provider outcome "${outcome}": an execution problem, not a disproof`,
        );
        continue;
      }
    }
    const invocation =
      listing.action === "verifier-invocation" ? (record as Invocation | undefined) : undefined;
    const result = invocation?.results.find((r) => targetKey(r.target) === p.claim.target);
    const timedOut = invocation?.subjects.some((s) => s.target === p.claim.target && s.timedOut);
    if (
      negative &&
      result &&
      (result.outcome === "unavailable" || result.outcome === "invalid" || timedOut)
    ) {
      reasons.push(
        `${at} is an execution problem for ${p.claim.target} (${timedOut ? "timed out" : result.outcome}), not a disproof`,
      );
      continue;
    }
    if (child && declared !== "reported") {
      reasons.push(`${at} is output of ${owner}; cite that record as the observation`);
      continue;
    }
    if (declared === "executed") {
      const expected = negative ? "failed" : "passed";
      const wrong = !invocation
        ? "is not a verifier invocation, so it executed nothing for the claim"
        : invocation.stage !== "acceptance"
          ? "is a provisional run of an unadmitted verifier"
          : !result
            ? `has no result for ${p.claim.target}`
            : result.outcome !== expected
              ? `${result.outcome} ${p.claim.target}; the claim needs ${expected}`
              : null;
      if (wrong) reasons.push(`${at} ${wrong}`);
      else {
        basis = "executed";
        executed.add(`verifier:${invocation?.binding ?? ""}`);
      }
    } else if (declared === "inspected") {
      const reviewed = listing.action === "review" ? (record as ReviewRecord) : undefined;
      const reads = (reviewed?.outcome.observation.toolCalls ?? []).filter(
        (c) => c.tool === "read_file" && c.ok,
      );
      if (reviewed?.kind !== "candidate" || reviewed.outcome.outcome !== "reviewed") {
        reasons.push(
          `${at} is not a recorded source inspection: it is no completed candidate review`,
        );
      } else if (reads.length === 0) {
        reasons.push(`${at} records no read of the candidate's source`);
      } else {
        for (const c of reads) read.add(c.target);
        basis ??= "inspected";
      }
    }
  }
  if (p.observations.length > 0 && p.observations.every((o) => o.basis === "reported")) {
    reasons.push(
      "no observation is inspected or executed; reported observations remain historical context",
    );
  }

  // An executed result always depends on its verifier and toolchain. Any
  // other narrowing needs a source inspection of the paths it keeps and the
  // review's explicit assessment of the narrower scope.
  const kept = [...executed, "toolchain", "lockfile"].filter(
    (name) => executed.size > 0 && omitted.includes(name),
  );
  if (kept.length > 0) {
    reasons.push(`the scope omits ${kept.join(", ")}, on which its executed observations depend`);
  }
  if (narrowed && read.size === 0) {
    reasons.push(
      `the scope is narrower than its evaluation (omits ${omitted.join(", ") || "nothing"}; paths ${paths.join(", ") || "none"}) without a source inspection`,
    );
  } else if (paths.some((path) => !read.has(path))) {
    reasons.push(
      `the scope keeps paths the inspection did not read: ${paths.filter((path) => !read.has(path)).join(", ")}`,
    );
  }

  // The proposer and the reviewer are separate committed invocations and sessions.
  const independent = independentReview(dir, events, proposal, p.proposer, review, "claim");
  reasons.push(...independent.reasons);
  const { verdict } = independent;
  if (verdict && review !== null) {
    const covers = covered(verdict);
    if (
      verdict.verdict !== "pass" ||
      !covers(entry) ||
      verdict.blockers.length > 0 ||
      verdict.findings.some((f) => f.severity === "blocking")
    ) {
      reasons.push(`the review ${review} does not find the claim supported`);
    } else if (narrowed && !covers(scopeSubject(entry))) {
      reasons.push(`the review ${review} does not assess the narrower scope`);
    }
    for (const [relation, id] of relations) {
      if (!covers(relationSubject(entry, relation, id))) {
        reasons.push(`the review ${review} does not assess that the entry ${relation} ${id}`);
      }
    }
  }
  const ok = reasons.length === 0;
  return { reasons, basis: ok ? basis : null, relations: ok ? bound : [] };
}

/** Whether a verdict records `subject` as satisfied. */
const covered =
  (verdict: ReviewVerdict) =>
  (subject: string): boolean =>
    verdict.coverage.some((c) => c.subject === subject && c.result === "satisfied");

/**
 * Whether `review` is an independent assessment of a committed proposal: a
 * reviewer invocation committed after it, for it, in another invocation and
 * session than its committed proposer. Returns the reasons it is not, and the
 * verdict to judge when it is.
 */
function independentReview(
  dir: string,
  events: readonly JournalEvent[],
  proposal: { seq: number; ref: string },
  proposerRef: string,
  review: string | null,
  noun: "claim" | "reminder",
): { reasons: string[]; verdict: ReviewVerdict | null } {
  const invocation = (ref: string, keep: (e: JournalEvent) => boolean): JournalEvent | undefined =>
    events.find((e) => e.action === "agent-invocation" && e.data.record === ref && keep(e));
  const reasons: string[] = [];
  const proposer = invocation(proposerRef, (e) => e.seq < proposal.seq);
  if (!proposer) reasons.push(`the proposer invocation ${proposerRef} is not committed`);
  const reviewed = review === null ? undefined : invocation(review, (e) => e.seq > proposal.seq);
  if (review === null) {
    reasons.push(`the ${noun} has no independent review`);
  } else if (!reviewed) {
    reasons.push(`the review ${review} is not a committed invocation after the proposal`);
  } else if (reviewed.data.proposal !== proposal.ref) {
    reasons.push(`the review ${review} assessed another proposal`);
  } else {
    const outcome = parse(dir, review) as AgentOutcome;
    const session = outcome.observation.session;
    if (review === proposerRef || session === null || session === proposer?.data.session) {
      reasons.push(`the review ${review} is not independent of the proposer`);
    } else if (outcome.outcome !== "reviewed" || outcome.observation.role !== "reviewer") {
      reasons.push(
        `the review ${review} is a ${outcome.observation.role} ${outcome.outcome} outcome, not a review`,
      );
    } else return { reasons, verdict: outcome.verdict };
  }
  return { reasons, verdict: null };
}

const stored = (dir: string, ref: string): boolean => {
  try {
    readEvidence(dir, ref);
    return true;
  } catch {
    return false;
  }
};

/**
 * Admits a committed proposal: derives `supported` or `rejected`, with
 * every reason, from the run's committed records and journals it. A
 * proposal that is not committed, is already admitted, or belongs to a run
 * this controller cannot read is refused without writing anything.
 */
export function admitKnowledge(
  run: RunHandle,
  input: { proposal: string; review: string | null; controller: string },
): Read<Stored<KnowledgeAdmission>> {
  const read = readRecords(run.dir, input.controller);
  if (!read.ok) return read;
  const proposal = read.value.proposals.find((p) => p.ref === input.proposal);
  if (!proposal) {
    return { ok: false, diagnostics: [`${input.proposal} is not a committed knowledge proposal`] };
  }
  if (read.value.admissions.some((a) => a.record.proposal === input.proposal)) {
    return { ok: false, diagnostics: [`${input.proposal} is already admitted`] };
  }
  const { reasons, basis, relations } = assess(run.dir, read.value, proposal, input.review);
  const admission: KnowledgeAdmission = {
    format: KNOWLEDGE_FORMAT,
    controller: input.controller,
    run: run.run,
    entry: entryId(proposal.record),
    proposal: proposal.ref,
    review: input.review,
    disposition: reasons.length === 0 ? "supported" : "rejected",
    basis,
    relations,
    reasons,
  };
  const ref = putEvidence(run, stringify(admission));
  appendEvent(run, {
    action: ADMISSION,
    attempt: proposal.record.attempt,
    evaluation: proposal.record.evaluation,
    evidence: [ref, proposal.ref],
    data: { record: ref, entry: admission.entry, disposition: admission.disposition },
  });
  return { ok: true, value: { ref, record: admission } };
}

// T3.6 L2: reviewed guidance, bounded selection and the frozen context of an
// attempt (evidence-backed learning log §§2.2 and 2.5). A reminder cites
// reviewed failures of the same rule in two or more attempts, and a separate
// reviewer assesses it before the controller supports it. Each production
// attempt freezes a bounded, ordered selection of the step's current
// knowledge and guidance before dispatch; its manifest names each consumed
// revision and the digest of what was consumed, never the journal. Nothing
// here changes a requirement, rubric, verifier, role, permission, budget or
// approval: the selection is context for a producer, and acceptance never
// reads it.

/** The coverage subjects a guidance review must find satisfied. */
export function guidanceSubjects(p: GuidanceProposal): string[] {
  const id = guidanceId(p);
  return [
    id,
    `${id}/authority`,
    ...(p.guidance.text === null
      ? [`${id}/withdrawal`]
      : p.occurrences.map((_, i) => `${id}/occurrence/${i}`)),
    ...p.contradicts.map((other) => `${id}/contradicts/${other}`),
  ];
}

/**
 * Journals a guidance proposal as an agent made it. Only its shape, run and
 * controller are checked here; admission decides whether it is supported.
 */
export function proposeGuidance(
  run: RunHandle,
  proposal: GuidanceProposal,
): Stored<GuidanceProposal> {
  if (!validateGuidance(proposal)) {
    const [error] = validateGuidance.errors ?? [];
    throw new Error(
      `invalid guidance proposal: ${error?.instancePath || "/"} ${error?.message ?? ""}`,
    );
  }
  if (proposal.run !== run.run) {
    throw new Error(`the proposal names run ${proposal.run}, not ${run.run}`);
  }
  const read = readRecords(run.dir, proposal.controller);
  if (!read.ok) throw new Error(read.diagnostics.join("\n"));
  const ref = putEvidence(run, stringify(proposal));
  appendEvent(run, {
    action: GUIDANCE_PROPOSAL,
    attempt: proposal.attempt,
    evaluation: proposal.evaluation,
    evidence: [ref],
    data: { record: ref, guidance: guidanceId(proposal), step: proposal.step },
  });
  return { ref, record: proposal };
}

/** What the controller checks a reminder against: the step's planned rules and the reminder limit. */
export type GuidanceRules = { rules: readonly string[]; reminderChars: number };

const scopeOfManifest = (m: EvaluationManifest): GuidanceScope => ({
  definitions: m.definitions,
  step: m.step.definition,
  rubric: m.rubric ?? "none",
});

/** Why a committed guidance proposal cannot be supported, and the scope and relations it would have. */
function assessGuidance(
  dir: string,
  records: Records,
  proposal: Committed<GuidanceProposal>,
  review: string | null,
  known: GuidanceRules,
): { reasons: string[]; scope: GuidanceScope | null; relations: GuidanceAdmission["relations"] } {
  const { events } = records;
  const p = proposal.record;
  const id = guidanceId(p);
  const before = events.filter((e) => e.seq < proposal.seq && learningKind(e.action) === null);
  const reasons: string[] = [];
  const manifestOf = (attempt: number, evaluation: string): EvaluationManifest | undefined => {
    const e = before.find(
      (x) =>
        x.action === "evaluation" &&
        x.evaluation === evaluation &&
        x.attempt === attempt &&
        x.data.step === p.step,
    );
    return e
      ? (parse(dir, String(e.data.record)) as { manifest: EvaluationManifest }).manifest
      : undefined;
  };
  const own = manifestOf(p.attempt, p.evaluation);
  if (!own)
    reasons.push(`${p.step} attempt ${p.attempt} has no committed evaluation ${p.evaluation}`);
  if (
    p.round !== null &&
    !before.some((e) => e.action === "pr-round" && e.data.round === p.round)
  ) {
    reasons.push(`pull-request round ${p.round} is not committed`);
  }
  if (!known.rules.includes(p.guidance.rule)) {
    reasons.push(`the rule ${p.guidance.rule} is not a planned subject or target of ${p.step}`);
  }
  const supportedVersions = (gid: string): Committed<GuidanceProposal>[] =>
    records.guidance.filter(
      (x) =>
        x.seq < proposal.seq &&
        guidanceId(x.record) === gid &&
        records.guidanceAdmissions.some(
          (a) => a.record.proposal === x.ref && a.record.disposition === "supported",
        ),
    );

  // An activation rests on reviewed failures of its rule in two or more
  // attempts; a withdrawal on its reason and review alone.
  const scopes: GuidanceScope[] = [];
  const { text } = p.guidance;
  if (text === null) {
    if (p.occurrences.length > 0) reasons.push("a withdrawal cites no occurrences");
    if (supportedVersions(id).length === 0) {
      reasons.push(`it withdraws ${id}, which has no supported version`);
    }
    if (own) scopes.push(scopeOfManifest(own));
  } else {
    if (text.length > known.reminderChars) {
      reasons.push(
        `the reminder has ${text.length} characters; at most ${known.reminderChars} are admitted`,
      );
    }
    const attempts = new Set<number>();
    const seen = new Set<string>();
    for (const [i, o] of p.occurrences.entries()) {
      const at = `occurrence ${i} (${o.review} finding ${o.finding})`;
      if (seen.has(`${o.review}/${o.finding}`)) {
        reasons.push(`${at} repeats an earlier occurrence`);
        continue;
      }
      seen.add(`${o.review}/${o.finding}`);
      const event = before.find((e) => e.action === "review" && e.data.record === o.review);
      if (!event) {
        const listing = events.find((e) => e.evidence.includes(o.review));
        const what = !listing
          ? "it is not committed"
          : listing.seq > proposal.seq
            ? `it is ${listing.action} evidence committed after the proposal`
            : `it is ${listing.action} evidence`;
        reasons.push(`${at} is not a reviewed occurrence: ${what}`);
        continue;
      }
      const record = parse(dir, o.review) as ReviewRecord;
      const manifest = manifestOf(record.attempt, record.evaluation);
      const finding =
        record.outcome.outcome === "reviewed"
          ? record.outcome.verdict.findings[o.finding]
          : undefined;
      if (record.kind !== "candidate" || record.outcome.outcome !== "reviewed") {
        reasons.push(`${at} is not a completed candidate review`);
      } else if (!manifest || record.attempt > p.attempt) {
        reasons.push(`${at} reviewed no earlier evaluation of ${p.step}`);
      } else if (finding?.severity !== "blocking") {
        reasons.push(`${at} is not a blocking finding`);
      } else if (finding.rule !== p.guidance.rule) {
        reasons.push(`${at} is about ${finding.rule}, not ${p.guidance.rule}`);
      } else {
        attempts.add(record.attempt);
        scopes.push(scopeOfManifest(manifest));
      }
    }
    if (attempts.size < 2) {
      reasons.push(
        `the reminder cites reviewed failures of ${attempts.size} attempt${attempts.size === 1 ? "" : "s"}; it needs two or more`,
      );
    }
  }
  const [scope] = scopes;
  if (scope && scopes.some((x) => stringify(x) !== stringify(scope))) {
    reasons.push(
      "the occurrences were judged under different definitions, step definitions or rubrics",
    );
  }

  // A contradiction relates this reminder to the current version of supported guidance of the step.
  const relations: GuidanceAdmission["relations"] = [];
  for (const other of p.contradicts) {
    const latest = supportedVersions(other).at(-1);
    if (other === id || !latest) {
      reasons.push(`it contradicts ${other}, which is not supported earlier guidance`);
    } else if (latest.record.step !== p.step) {
      reasons.push(`it contradicts ${other}, guidance for ${latest.record.step}, not ${p.step}`);
    } else relations.push({ guidance: other, versions: [latest.ref] });
  }

  const independent = independentReview(dir, events, proposal, p.proposer, review, "reminder");
  reasons.push(...independent.reasons);
  const { verdict } = independent;
  if (verdict && review !== null) {
    const covers = covered(verdict);
    if (
      verdict.verdict !== "pass" ||
      verdict.blockers.length > 0 ||
      verdict.findings.some((f) => f.severity === "blocking")
    ) {
      reasons.push(`the review ${review} does not find the reminder supported`);
    }
    const missing = guidanceSubjects(p).filter((subject) => !covers(subject));
    if (missing.length > 0) {
      reasons.push(`the review ${review} does not assess ${missing.join(", ")}`);
    }
  }
  const ok = reasons.length === 0;
  return { reasons, scope: ok ? (scope ?? null) : null, relations: ok ? relations : [] };
}

/**
 * Admits a committed guidance proposal: derives `supported` or `rejected`,
 * with every reason, from the run's committed records and journals it. A
 * proposal that is not committed, is already admitted, or belongs to a run
 * this controller cannot read is refused without writing anything.
 */
export function admitGuidance(
  run: RunHandle,
  input: { proposal: string; review: string | null; controller: string } & GuidanceRules,
): Read<Stored<GuidanceAdmission>> {
  const read = readRecords(run.dir, input.controller);
  if (!read.ok) return read;
  const proposal = read.value.guidance.find((p) => p.ref === input.proposal);
  if (!proposal) {
    return { ok: false, diagnostics: [`${input.proposal} is not a committed guidance proposal`] };
  }
  if (read.value.guidanceAdmissions.some((a) => a.record.proposal === input.proposal)) {
    return { ok: false, diagnostics: [`${input.proposal} is already admitted`] };
  }
  const { reasons, scope, relations } = assessGuidance(
    run.dir,
    read.value,
    proposal,
    input.review,
    input,
  );
  const admission: GuidanceAdmission = {
    format: KNOWLEDGE_FORMAT,
    controller: input.controller,
    run: run.run,
    guidance: guidanceId(proposal.record),
    proposal: proposal.ref,
    review: input.review,
    disposition: reasons.length === 0 ? "supported" : "rejected",
    scope,
    relations,
    reasons,
  };
  const ref = putEvidence(run, stringify(admission));
  appendEvent(run, {
    action: GUIDANCE_ADMISSION,
    attempt: proposal.record.attempt,
    evaluation: proposal.record.evaluation,
    evidence: [ref, proposal.ref],
    data: { record: ref, guidance: admission.guidance, disposition: admission.disposition },
  });
  return { ok: true, value: { ref, record: admission } };
}

/** One proposal of a reminder, with its admission once it has one. */
export type GuidanceVersion = Omit<
  GuidanceProposal,
  "format" | "controller" | "run" | "step" | "guidance"
> & {
  proposal: string;
  text: string | null;
  admission:
    | (Omit<GuidanceAdmission, "format" | "controller" | "run" | "guidance" | "proposal"> & {
        record: string;
      })
    | null;
};

export type GuidanceEntry = {
  guidance: string;
  step: string;
  rule: string;
  cause: string;
  disposition: "proposed" | "supported" | "rejected";
  /** Every proposal of the reminder, in journal order. */
  versions: GuidanceVersion[];
};

export type GuidanceView = {
  format: typeof KNOWLEDGE_FORMAT;
  run: string;
  controller: string;
  entries: GuidanceEntry[];
};

function guidanceViewOf(records: Records, controller: string): GuidanceView {
  const entries = new Map<string, GuidanceEntry>();
  for (const { ref, record: p } of records.guidance) {
    const id = guidanceId(p);
    const a = records.guidanceAdmissions.find((x) => x.record.proposal === ref);
    const entry = entries.get(id) ?? {
      guidance: id,
      step: p.step,
      rule: p.guidance.rule,
      cause: p.guidance.cause,
      disposition: "proposed",
      versions: [],
    };
    entry.versions.push({
      proposal: ref,
      attempt: p.attempt,
      evaluation: p.evaluation,
      round: p.round,
      text: p.guidance.text,
      reason: p.reason,
      occurrences: p.occurrences,
      proposer: p.proposer,
      contradicts: p.contradicts,
      admission: a
        ? {
            record: a.ref,
            review: a.record.review,
            disposition: a.record.disposition,
            scope: a.record.scope,
            relations: a.record.relations,
            reasons: a.record.reasons,
          }
        : null,
    });
    entries.set(id, entry);
  }
  for (const entry of entries.values()) {
    entry.disposition = entry.versions.some((v) => v.admission?.disposition === "supported")
      ? "supported"
      : entry.versions.some((v) => v.admission)
        ? "rejected"
        : "proposed";
  }
  return {
    format: KNOWLEDGE_FORMAT,
    run: records.events[0]?.run ?? "",
    controller,
    entries: [...entries.values()],
  };
}

/** The run's knowledge and guidance views from one read, and the journal position of each learning record. */
export type LearningViews = {
  knowledge: KnowledgeView;
  guidance: GuidanceView;
  /** The last event read. */
  asOf: number;
  seqs: ReadonlyMap<string, number>;
};

export function learningViews(
  dir: string,
  controller: string,
  options: ReadOptions = {},
): Read<LearningViews> {
  const read = readRecords(dir, controller, options);
  if (!read.ok) return read;
  const records = read.value;
  const seqs = new Map<string, number>();
  for (const x of [
    ...records.proposals,
    ...records.admissions,
    ...records.guidance,
    ...records.guidanceAdmissions,
  ]) {
    seqs.set(x.ref, x.seq);
  }
  return {
    ok: true,
    value: {
      knowledge: viewOf(dir, records, controller),
      guidance: guidanceViewOf(records, controller),
      asOf: records.events.at(-1)?.seq ?? 0,
      seqs,
    },
  };
}

/** The step, definitions and planned rules guidance is applied to. */
export type GuidanceTarget = {
  step: string;
  definitions: string;
  /** The step's definition digest. */
  definition: string;
  rubric: string;
  rules: readonly string[];
};

/**
 * Each reminder of the target's step as it applies there: current through
 * its latest supported version; withdrawn; stale when that version's scope
 * or rule no longer holds; withheld while a reviewed contradiction with
 * another current reminder stands; or rejected or only proposed. An older
 * supported version is superseded by the latest.
 */
export type GuidanceStatus = {
  current: { guidance: string; version: string }[];
  withdrawn: { guidance: string; version: string; reason: string }[];
  stale: { guidance: string; version: string; changed: string[] }[];
  withheld: { guidance: string; version: string; conflicts: string[] }[];
  rejected: string[];
  proposed: string[];
};

export function guidanceStatus(view: GuidanceView, target: GuidanceTarget): GuidanceStatus {
  const status: GuidanceStatus = {
    current: [],
    withdrawn: [],
    stale: [],
    withheld: [],
    rejected: [],
    proposed: [],
  };
  const live: { guidance: string; version: GuidanceVersion }[] = [];
  for (const entry of view.entries) {
    if (entry.step !== target.step) continue;
    const latest = entry.versions.filter((v) => v.admission?.disposition === "supported").at(-1);
    if (!latest) {
      (entry.disposition === "rejected" ? status.rejected : status.proposed).push(entry.guidance);
      continue;
    }
    if (latest.text === null) {
      status.withdrawn.push({
        guidance: entry.guidance,
        version: latest.proposal,
        reason: latest.reason,
      });
      continue;
    }
    const scope = latest.admission?.scope;
    const changed = [
      ...(scope?.definitions === target.definitions ? [] : ["definitions"]),
      ...(scope?.step === target.definition ? [] : [`step:${target.step}`]),
      ...(scope?.rubric === target.rubric ? [] : ["rubric"]),
      ...(target.rules.includes(entry.rule) ? [] : [`rule:${entry.rule}`]),
    ];
    if (changed.length > 0) {
      status.stale.push({ guidance: entry.guidance, version: latest.proposal, changed });
    } else live.push({ guidance: entry.guidance, version: latest });
  }
  const conflicts = new Map<string, string[]>();
  const add = (a: string, b: string): void => {
    if (!conflicts.get(a)?.includes(b)) conflicts.set(a, [...(conflicts.get(a) ?? []), b]);
  };
  for (const a of live) {
    for (const rel of a.version.admission?.relations ?? []) {
      const b = live.find((x) => x.guidance === rel.guidance);
      if (!b || !rel.versions.includes(b.version.proposal)) continue;
      add(a.guidance, b.guidance);
      add(b.guidance, a.guidance);
    }
  }
  const order = live.map((x) => x.guidance);
  for (const { guidance, version } of live) {
    const against = conflicts.get(guidance);
    if (against) {
      status.withheld.push({
        guidance,
        version: version.proposal,
        conflicts: order.filter((id) => against.includes(id)),
      });
    } else status.current.push({ guidance, version: version.proposal });
  }
  return status;
}

/** How much learning context one attempt may consume: the validated `learning.context` limits. */
export type ContextLimits = { entries: number; guidance: number; bytes: number };

/** One consumed item: its entry or guidance ID, the revision consumed, its admission and the digest of what was consumed. */
export type ContextItem = { id: string; proposal: string; admission: string; digest: string };

export type OmissionReason =
  | "limit"
  | "later-attempt"
  | "historical"
  | "withheld"
  | "superseded"
  | "stale"
  | "withdrawn"
  | "rejected"
  | "proposed";

/** A candidate the selection left out, why, and its latest proposal for scoped reading. */
export type Omission = {
  kind: "knowledge" | "guidance";
  id: string;
  reason: OmissionReason;
  detail: string[];
  proposal: string | null;
};

/**
 * The frozen learning context of one production attempt, journaled with its
 * start before dispatch. It names what was consumed and omitted, not the
 * journal; `asOf` is the last event the selection read.
 */
export type ContextManifest = {
  format: typeof KNOWLEDGE_FORMAT;
  controller: string;
  run: string;
  step: string;
  attempt: number;
  asOf: number;
  limits: ContextLimits;
  knowledge: ContextItem[];
  guidance: ContextItem[];
  omitted: Omission[];
};

/** A consumed knowledge entry as the producer sees it. */
export type KnowledgeItem = {
  entry: string;
  revision: string;
  kind: ClaimKind;
  assertion: string;
  target: string;
  basis: "inspected" | "executed" | null;
  observations: { ref: string; basis: Basis }[];
};

/** A consumed reminder as the producer sees it, with the reviewed failures it cites. */
export type GuidanceItem = {
  guidance: string;
  version: string;
  rule: string;
  cause: string;
  reminder: string;
  occurrences: string[];
};

const REASONS: readonly OmissionReason[] = [
  "limit",
  "later-attempt",
  "historical",
  "withheld",
  "superseded",
  "stale",
  "withdrawn",
  "rejected",
  "proposed",
];

/**
 * The learning inputs of a producer packet, rebuilt from a frozen manifest:
 * the consumed items, how many candidates were omitted for each reason, and
 * the records the consumed items make readable. What was omitted stays in
 * the manifest and the operator's view; the producer sees only the counts.
 */
export type LearningInputs = {
  manifest: string;
  knowledge: KnowledgeItem[];
  guidance: GuidanceItem[];
  omitted: { reason: OmissionReason; count: number }[];
  evidence: string[];
};

/** The records consumed items make readable: each consumed revision and the records it cites. */
export const readableRecords = (
  knowledge: readonly KnowledgeItem[],
  guidance: readonly GuidanceItem[],
): string[] =>
  [
    ...new Set([
      ...knowledge.flatMap((k) => [k.revision, ...k.observations.map((o) => o.ref)]),
      ...guidance.flatMap((g) => [g.version, ...g.occurrences]),
    ]),
  ].sort();

/**
 * What the configured byte limit bounds (T3.6 L2): the consumed items and
 * every record reference they make readable, serialised. Nothing else in the
 * learning section varies with the run's history.
 */
export const learningBytes = (
  knowledge: readonly KnowledgeItem[],
  guidance: readonly GuidanceItem[],
): number =>
  Buffer.byteLength(
    stringify({ knowledge, guidance, records: readableRecords(knowledge, guidance) }) ?? "",
  );

export const contextDigest = (manifest: ContextManifest): string =>
  sha256(stringify(manifest) ?? "");

const knowledgeItem = (
  proposalRef: string,
  p: Pick<KnowledgeProposal, "claim" | "observations">,
  entry: string,
  basis: KnowledgeItem["basis"],
): KnowledgeItem => ({
  entry,
  revision: proposalRef,
  kind: p.claim.kind,
  assertion: p.claim.assertion,
  target: p.claim.target,
  basis,
  observations: p.observations,
});

const guidanceItem = (
  versionRef: string,
  p: Pick<GuidanceProposal, "guidance" | "occurrences">,
  id: string,
): GuidanceItem => ({
  guidance: id,
  version: versionRef,
  rule: p.guidance.rule,
  cause: p.guidance.cause,
  reminder: p.guidance.text ?? "",
  occurrences: [...new Set(p.occurrences.map((o) => o.review))],
});

const itemDigest = (item: KnowledgeItem | GuidanceItem): string => sha256(stringify(item) ?? "");

const NEGATIVE_FIRST: Record<ClaimKind, number> = {
  counterexample: 0,
  "failed-approach": 0,
  positive: 1,
};

/**
 * The bounded, deterministic learning context of a step's next attempt
 * (T3.6 L2): its current reminders, newest admission first, then its current
 * knowledge, negative results first and newest admission first, each while
 * the count limits and the byte limit of `learningBytes` allow. Every other
 * candidate of the step is recorded as omitted, with why, in the manifest
 * only. Requirements, findings and other packet content are not part of the
 * selection and are never cut.
 */
export function selectContext(
  views: LearningViews,
  input: {
    controller: string;
    run: string;
    step: string;
    attempt: number;
    limits: ContextLimits;
    knowledge: KnowledgeTarget;
    guidance: GuidanceTarget;
  },
): ContextManifest {
  const seq = (ref: string | undefined): number => (ref ? (views.seqs.get(ref) ?? 0) : 0);
  const newest = <T>(a: T, b: T, of: (x: T) => number, id: (x: T) => string): number =>
    of(b) - of(a) || (id(a) < id(b) ? -1 : 1);
  const omitted: Omission[] = [];
  const knowledge: { item: ContextItem; content: KnowledgeItem }[] = [];
  const guidance: { item: ContextItem; content: GuidanceItem }[] = [];
  const fits = (k: readonly KnowledgeItem[], g: readonly GuidanceItem[]): boolean =>
    learningBytes(k, g) <= input.limits.bytes;

  // Guidance: current reminders of earlier attempts, then everything else as omitted.
  const status = guidanceStatus(views.guidance, input.guidance);
  const entries = new Map(views.guidance.entries.map((e) => [e.guidance, e]));
  const latestOf = (id: string): string | null =>
    entries.get(id)?.versions.at(-1)?.proposal ?? null;
  const versionOf = (id: string, ref: string): GuidanceVersion | undefined =>
    entries.get(id)?.versions.find((v) => v.proposal === ref);
  const candidates = [...status.current].sort((a, b) =>
    newest(
      a,
      b,
      (x) => seq(versionOf(x.guidance, x.version)?.admission?.record),
      (x) => x.guidance,
    ),
  );
  for (const { guidance: id, version } of candidates) {
    const v = versionOf(id, version);
    const entry = entries.get(id);
    if (!v?.admission || !entry) continue;
    if (v.attempt >= input.attempt) {
      omitted.push({
        kind: "guidance",
        id,
        reason: "later-attempt",
        detail: [`attempt ${v.attempt}`],
        proposal: version,
      });
      continue;
    }
    const content = guidanceItem(
      version,
      {
        guidance: { rule: entry.rule, cause: entry.cause, text: v.text },
        occurrences: v.occurrences,
      },
      id,
    );
    const next = [...guidance.map((g) => g.content), content];
    if (guidance.length < input.limits.guidance && fits([], next)) {
      guidance.push({
        item: { id, proposal: version, admission: v.admission.record, digest: itemDigest(content) },
        content,
      });
    } else omitted.push({ kind: "guidance", id, reason: "limit", detail: [], proposal: version });
  }
  for (const x of status.withheld) {
    omitted.push({
      kind: "guidance",
      id: x.guidance,
      reason: "withheld",
      detail: x.conflicts,
      proposal: x.version,
    });
  }
  for (const x of status.stale) {
    omitted.push({
      kind: "guidance",
      id: x.guidance,
      reason: "stale",
      detail: x.changed,
      proposal: x.version,
    });
  }
  for (const x of status.withdrawn) {
    omitted.push({
      kind: "guidance",
      id: x.guidance,
      reason: "withdrawn",
      detail: [x.reason],
      proposal: x.version,
    });
  }
  for (const id of status.rejected) {
    omitted.push({ kind: "guidance", id, reason: "rejected", detail: [], proposal: latestOf(id) });
  }
  for (const id of status.proposed) {
    omitted.push({ kind: "guidance", id, reason: "proposed", detail: [], proposal: latestOf(id) });
  }

  // Knowledge: the step's current entries through their newest current revision.
  const mine = views.knowledge.entries.filter((e) => e.step === input.step);
  const applies = applicability(views.knowledge, input.knowledge);
  const current = currentRevisions(views.knowledge, input.knowledge);
  const revision = (e: KnowledgeEntry): Revision | undefined => {
    const refs = current.get(e.entry) ?? [];
    return e.revisions
      .filter((r) => refs.includes(r.proposal))
      .sort((a, b) => seq(b.admission?.record) - seq(a.admission?.record))[0];
  };
  const ranked = mine
    .filter((e) => applies.current.includes(e.entry))
    .map((e) => ({ e, r: revision(e) }))
    .filter((x): x is { e: KnowledgeEntry; r: Revision } => x.r?.admission != null)
    .sort(
      (a, b) =>
        NEGATIVE_FIRST[a.e.claim.kind] - NEGATIVE_FIRST[b.e.claim.kind] ||
        newest(
          a,
          b,
          (x) => seq(x.r.admission?.record),
          (x) => x.e.entry,
        ),
    );
  const contents = (): GuidanceItem[] => guidance.map((g) => g.content);
  for (const { e, r } of ranked) {
    const content = knowledgeItem(
      r.proposal,
      { claim: e.claim, observations: r.observations },
      e.entry,
      r.admission?.basis ?? null,
    );
    const next = [...knowledge.map((k) => k.content), content];
    if (knowledge.length < input.limits.entries && fits(next, contents())) {
      knowledge.push({
        item: {
          id: e.entry,
          proposal: r.proposal,
          admission: r.admission?.record ?? "",
          digest: itemDigest(content),
        },
        content,
      });
    } else
      omitted.push({
        kind: "knowledge",
        id: e.entry,
        reason: "limit",
        detail: [],
        proposal: r.proposal,
      });
  }
  const latestRevision = (id: string): string | null =>
    mine.find((e) => e.entry === id)?.revisions.at(-1)?.proposal ?? null;
  const ofStep = (id: string): boolean => mine.some((e) => e.entry === id);
  for (const x of applies.historical.filter((h) => ofStep(h.entry))) {
    omitted.push({
      kind: "knowledge",
      id: x.entry,
      reason: "historical",
      detail: [...x.changed, ...x.unknown.map((u) => `unknown:${u}`)],
      proposal: latestRevision(x.entry),
    });
  }
  for (const x of applies.withheld.filter((h) => ofStep(h.entry))) {
    omitted.push({
      kind: "knowledge",
      id: x.entry,
      reason: "withheld",
      detail: x.conflicts,
      proposal: latestRevision(x.entry),
    });
  }
  for (const x of applies.superseded.filter((h) => ofStep(h.entry))) {
    omitted.push({
      kind: "knowledge",
      id: x.entry,
      reason: "superseded",
      detail: x.by,
      proposal: latestRevision(x.entry),
    });
  }
  for (const e of mine.filter((x) => x.disposition !== "supported")) {
    omitted.push({
      kind: "knowledge",
      id: e.entry,
      reason: e.disposition === "rejected" ? "rejected" : "proposed",
      detail: [],
      proposal: latestRevision(e.entry),
    });
  }
  return {
    format: KNOWLEDGE_FORMAT,
    controller: input.controller,
    run: input.run,
    step: input.step,
    attempt: input.attempt,
    asOf: views.asOf,
    limits: input.limits,
    knowledge: knowledge.map((k) => k.item),
    guidance: guidance.map((g) => g.item),
    omitted,
  };
}

const parseAs = <T>(dir: string, ref: string): T | undefined => parse(dir, ref) as T | undefined;

/**
 * The learning inputs a frozen manifest names, rebuilt from the immutable
 * evidence store: each consumed item must still be the supported revision
 * its manifest names, with the same digest, or the manifest is refused.
 * Read-only.
 */
export function learningInputs(dir: string, manifest: ContextManifest): Read<LearningInputs> {
  const diagnostics: string[] = [];
  const knowledge: KnowledgeItem[] = [];
  for (const item of manifest.knowledge) {
    const p = parseAs<KnowledgeProposal>(dir, item.proposal);
    const a = parseAs<KnowledgeAdmission>(dir, item.admission);
    if (
      !p ||
      !a ||
      a.proposal !== item.proposal ||
      a.disposition !== "supported" ||
      entryId(p) !== item.id
    ) {
      diagnostics.push(`knowledge ${item.id}: ${item.proposal} is not its supported revision`);
      continue;
    }
    const content = knowledgeItem(item.proposal, p, item.id, a.basis);
    if (itemDigest(content) !== item.digest) {
      diagnostics.push(
        `knowledge ${item.id}: the consumed content does not have digest ${item.digest}`,
      );
      continue;
    }
    knowledge.push(content);
  }
  const guidance: GuidanceItem[] = [];
  for (const item of manifest.guidance) {
    const p = parseAs<GuidanceProposal>(dir, item.proposal);
    const a = parseAs<GuidanceAdmission>(dir, item.admission);
    if (
      !p ||
      !a ||
      a.proposal !== item.proposal ||
      a.disposition !== "supported" ||
      guidanceId(p) !== item.id ||
      p.guidance.text === null
    ) {
      diagnostics.push(`guidance ${item.id}: ${item.proposal} is not its supported version`);
      continue;
    }
    const content = guidanceItem(item.proposal, p, item.id);
    if (itemDigest(content) !== item.digest) {
      diagnostics.push(
        `guidance ${item.id}: the consumed content does not have digest ${item.digest}`,
      );
      continue;
    }
    guidance.push(content);
  }
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return {
    ok: true,
    value: {
      manifest: contextDigest(manifest),
      knowledge,
      guidance,
      omitted: REASONS.flatMap((reason) => {
        const count = manifest.omitted.filter((o) => o.reason === reason).length;
        return count > 0 ? [{ reason, count }] : [];
      }),
      evidence: readableRecords(knowledge, guidance),
    },
  };
}

/**
 * The consumed items of a frozen manifest that are no longer current at a
 * target: a knowledge revision no longer among its entry's current
 * revisions, or a reminder version that is no longer the current version.
 * Their IDs, sorted; an unchanged consumption yields none, whatever else the
 * journal gained.
 */
export function consumedStale(
  views: LearningViews,
  manifest: ContextManifest,
  knowledge: KnowledgeTarget,
  guidance: GuidanceTarget,
): string[] {
  const revisions = currentRevisions(views.knowledge, knowledge);
  const current = guidanceStatus(views.guidance, guidance).current;
  const stale = [
    ...manifest.knowledge
      .filter((item) => !(revisions.get(item.id) ?? []).includes(item.proposal))
      .map((item) => item.id),
    ...manifest.guidance
      .filter((item) => !current.some((c) => c.guidance === item.id && c.version === item.proposal))
      .map((item) => item.id),
  ];
  return [...new Set(stale)].sort();
}

/** An evaluation's whole scope: its candidate and every dependency it records. */
export const evaluationScope = (repository: string, m: EvaluationManifest): KnowledgeScope => ({
  repository,
  definitions: m.definitions,
  candidate: { commit: m.source.commit, tree: m.source.tree },
  dependencies: evaluationDependencies(m),
});
