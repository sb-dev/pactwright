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

import type { AgentOutcome } from "./claude.js";
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
};

function parse(dir: string, ref: string): unknown {
  try {
    return JSON.parse(readEvidence(dir, ref).toString("utf8"));
  } catch {
    return undefined;
  }
}

/**
 * The run's committed events and knowledge records. A corrupt run, a record
 * of another format or controller, a malformed record and an unknown
 * knowledge action are refused; nothing is skipped or migrated.
 */
function readRecords(dir: string, controller: string): Read<Records> {
  const read = readRun(dir);
  if (!read.ok) return read;
  const { events } = read.records;
  const run = read.records.manifest.run;
  const records: Records = { events, proposals: [], admissions: [] };
  const diagnostics: string[] = [];
  for (const e of events) {
    if (!e.action.startsWith("knowledge-")) continue;
    const at = `event ${e.seq} (${e.action})`;
    const ref = e.data.record;
    if (e.action !== PROPOSAL && e.action !== ADMISSION) {
      diagnostics.push(`${at}: not a knowledge record of format ${KNOWLEDGE_FORMAT}`);
      continue;
    }
    if (typeof ref !== "string" || e.evidence[0] !== ref) {
      diagnostics.push(`${at}: names no record`);
      continue;
    }
    const record = parse(dir, ref) as Partial<KnowledgeProposal> | undefined;
    if (record?.format !== KNOWLEDGE_FORMAT) {
      diagnostics.push(
        `${at}: knowledge record format ${String(record?.format)} is not supported; a run is never migrated`,
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
    const proposal = records.proposals.find(
      (p) => p.ref === (record as { proposal?: unknown }).proposal,
    );
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
export function knowledgeView(dir: string, controller: string): Read<KnowledgeView> {
  const read = readRecords(dir, controller);
  if (!read.ok) return read;
  const { events, proposals, admissions } = read.value;
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
    ok: true,
    value: {
      format: KNOWLEDGE_FORMAT,
      run: events[0]?.run ?? "",
      controller,
      attempts: attemptsOf(dir, events),
      entries: [...entries.values()],
    },
  };
}

/**
 * Supported entries as they apply to a target. A supported revision holds at
 * the target when it matches it in every part of its scope. A correction
 * supersedes a revision it is bound to only where the correcting revision
 * holds too. An entry is current when a holding revision is not superseded
 * there, superseded when every holding revision is, and otherwise
 * historical. Two current entries conflict only through a recorded
 * contradiction whose own revision is live at the target; both are withheld
 * until a reviewed correction supersedes one side. A claim's kind alone never
 * makes a conflict, and rejected or proposed entries are never current.
 */
export function applicability(view: KnowledgeView, target: KnowledgeTarget): Applicability {
  const result: Applicability = { current: [], historical: [], withheld: [], superseded: [] };
  const supported = view.entries.flatMap((e) =>
    e.revisions
      .filter((r) => r.admission?.disposition === "supported")
      .map((r) => ({ entry: e.entry, r, ...scopeDiff(r.scope, target) })),
  );
  const holds = new Set(
    supported
      .filter((x) => x.changed.length === 0 && x.unknown.length === 0)
      .map((x) => x.r.proposal),
  );
  // The corrections that hold here, by the revision each supersedes.
  const correctedBy = new Map<string, string[]>();
  for (const { entry, r } of supported) {
    if (!holds.has(r.proposal)) continue;
    for (const rel of r.admission?.relations ?? []) {
      if (rel.relation !== "supersedes") continue;
      for (const ref of rel.revisions)
        correctedBy.set(ref, [...(correctedBy.get(ref) ?? []), entry]);
    }
  }
  const live = new Set([...holds].filter((ref) => !correctedBy.has(ref)));
  const applicable: KnowledgeEntry[] = [];
  for (const entry of view.entries) {
    const mine = supported.filter((x) => x.entry === entry.entry);
    if (mine.length === 0) continue;
    const holding = mine.filter((x) => holds.has(x.r.proposal));
    if (holding.some((x) => live.has(x.r.proposal))) {
      applicable.push(entry);
    } else if (holding.length > 0) {
      const by = holding.flatMap((x) => correctedBy.get(x.r.proposal) ?? []);
      result.superseded.push({ entry: entry.entry, by: [...new Set(by)].sort() });
    } else {
      const last = mine.at(-1);
      result.historical.push({
        entry: entry.entry,
        changed: last?.changed ?? [],
        unknown: last?.unknown ?? [],
      });
    }
  }
  const contradicts = (a: KnowledgeEntry, b: KnowledgeEntry): boolean =>
    a.revisions.some(
      (r) =>
        live.has(r.proposal) &&
        (r.admission?.relations ?? []).some(
          (rel) => rel.relation === "contradicts" && rel.entry === b.entry,
        ),
    );
  for (const entry of applicable) {
    const conflicts = applicable
      .filter((other) => contradicts(entry, other) || contradicts(other, entry))
      .map((other) => other.entry);
    if (conflicts.length > 0) result.withheld.push({ entry: entry.entry, conflicts });
    else result.current.push(entry.entry);
  }
  return result;
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
  const before = events.filter((e) => e.seq < proposal.seq && !e.action.startsWith("knowledge-"));
  const typed = (ref: string, among: readonly JournalEvent[]): JournalEvent | undefined =>
    among.find((e) => e.data.record === ref);
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
      const why = later?.action.startsWith("knowledge-")
        ? "is a knowledge record, not an original observation"
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
  const proposer = typed(
    p.proposer,
    before.filter((e) => e.action === "agent-invocation"),
  );
  if (!proposer) reasons.push(`the proposer invocation ${p.proposer} is not committed`);
  const reviewed =
    review === null
      ? undefined
      : typed(
          review,
          events.filter((e) => e.action === "agent-invocation" && e.seq > proposal.seq),
        );
  if (review === null) {
    reasons.push("the claim has no independent review");
  } else if (!reviewed) {
    reasons.push(`the review ${review} is not a committed invocation after the proposal`);
  } else if (reviewed.data.proposal !== proposal.ref) {
    reasons.push(`the review ${review} assessed another proposal`);
  } else {
    const outcome = parse(dir, review) as AgentOutcome;
    const session = outcome.observation.session;
    if (review === p.proposer || session === null || session === proposer?.data.session) {
      reasons.push(`the review ${review} is not independent of the proposer`);
    } else if (outcome.outcome !== "reviewed" || outcome.observation.role !== "reviewer") {
      reasons.push(
        `the review ${review} is a ${outcome.observation.role} ${outcome.outcome} outcome, not a review`,
      );
    } else {
      const { verdict } = outcome;
      const covers = (subject: string): boolean =>
        verdict.coverage.some((c) => c.subject === subject && c.result === "satisfied");
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
  }
  const ok = reasons.length === 0;
  return { reasons, basis: ok ? basis : null, relations: ok ? bound : [] };
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
