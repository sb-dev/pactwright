// Test helpers (T3.6 L1, reusable by L2–L4 and T4): a real CP97 run whose
// first library attempt fails one boundary target and is corrected, copies
// of it reopened by a new controller epoch for knowledge records, proposals
// that cite its committed observations, and separate proposer and reviewer
// sessions recorded as the runner records agent invocations. The run's
// candidate reviews read the sealed candidate's library files, so they are
// recorded source inspections. Support comes only from admitKnowledge;
// nothing here writes an admission.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import stringify from "safe-stable-stringify";

import {
  recordInvocation,
  type AgentOutcome,
  type Observation,
  type ReviewVerdict,
  type RoleName,
} from "../src/claude.js";
import { prepareRun, sha256, type PreparedRun } from "../src/contracts.js";
import {
  appendEvent,
  putEvidence,
  readEvidence,
  recoverRun,
  type EvaluationManifest,
  type JournalEvent,
  type JsonObject,
  type RunHandle,
} from "../src/evidence.js";
import {
  admitKnowledge,
  entryId,
  evaluationDependencies,
  knowledgeTarget,
  proposeKnowledge,
  relationSubject,
  scopeSubject,
  type Claim,
  type KnowledgeAdmission,
  type KnowledgeProposal,
  type KnowledgeScope,
  type KnowledgeTarget,
} from "../src/knowledge.js";
import { startRun } from "../src/runner.js";
import {
  targetKey,
  type Invocation,
  type OpenWorkspace,
  type ReviewRecord,
  type Stored,
} from "../src/verification.js";
import { treeFiles } from "../src/workspace.js";
import {
  assertAccepted,
  bootstrapConfig,
  bootstrapProducer,
  bootstrapRegistry,
  bootstrapRepo,
  eventsOf,
  injectedFirst,
  LIBRARY,
  workOf,
} from "./bootstrap-fixtures.js";
import { scriptedAgent, testDeps, type Repo, type ScriptedAgent } from "./runner-fixtures.js";
import { approveAll } from "./verification-fixtures.js";

/** The controller identity of the fixture run and of its knowledge records. */
export const CONTROLLER = "t3-6-l1-test";

/** The boundary target the first library attempt's injected fault fails. */
export const BOUNDARY = `${LIBRARY}/AC03/port-above-highest/automated/library.rejects`;

export type LearningRun = { dir: string; repo: Repo; scratch: string; plan: PreparedRun };

/** The library's files, which every candidate review reads. */
export const LIBRARY_FILES = workOf(LIBRARY).outputs["config-library"] ?? [];

/** Read-only reviewer workspaces that serve the sealed snapshot's files. */
export const snapshotReviewers =
  (dir: string): OpenWorkspace =>
  (snapshot) =>
    Promise.resolve({
      snapshot,
      readFile: (path) => {
        const bytes = treeFiles(dir, snapshot.tree, path).get(path);
        return Promise.resolve(
          bytes ? { ok: true, bytes } : { ok: false, reason: `${path}: no such file` },
        );
      },
      writeFile: () => Promise.resolve({ ok: false, reason: "Read-only file system" }),
      exec: () =>
        Promise.resolve({
          exitCode: 1,
          stdout: Buffer.alloc(0),
          stderr: Buffer.alloc(0),
          timedOut: false,
        }),
      close: () => Promise.resolve(),
    });

/** The bootstrap reviewer, reading the library's source before each candidate verdict. */
const inspectingReviewer = (): ScriptedAgent =>
  scriptedAgent(async (session) => {
    if (session.packet.review?.kind === "candidate") {
      for (const path of LIBRARY_FILES) {
        assert.ok((await session.call("read_file", { path })).ok, `the review reads ${path}`);
      }
    }
    return { output: approveAll(session.packet) };
  });

/** CP97 through its library step: attempt 1 fails BOUNDARY and is corrected, attempt 2 is accepted. */
export async function learningRun(scratch: string): Promise<LearningRun> {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  const repo = bootstrapRepo(dir);
  const config = bootstrapConfig(repo, dir, { through: LIBRARY });
  const prepared = await prepareRun(config, { repoRoot: repo.root });
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  const deps = testDeps(repo, {
    producer: bootstrapProducer(injectedFirst),
    reviewer: inspectingReviewer(),
    registry: bootstrapRegistry(),
    harness: CONTROLLER,
  });
  const workspaces = deps.workspaces;
  deps.workspaces = (run, root) => ({
    ...workspaces(run, root),
    reviewer: snapshotReviewers(run.dir),
  });
  const result = await startRun(config, deps);
  return { dir: assertAccepted(result, [LIBRARY]), repo, scratch: dir, plan: prepared.plan };
}

/** A copy of the run, reopened by a new controller epoch, so tests never share a journal. */
export async function reopen(w: LearningRun): Promise<RunHandle> {
  const copy = join(w.scratch, randomUUID());
  cpSync(w.dir, copy, { recursive: true });
  const recovery = await recoverRun(copy, { fence: () => Promise.resolve(), github: null });
  assert.equal(recovery.kind, "recovered");
  assert.ok(recovery.kind === "recovered");
  return recovery.run;
}

/** A committed record of `action`, with the event that journals it: `data.record`, else the first evidence. */
export type Found<T> = { ref: string; record: T; event: JournalEvent };

export function committed<T>(
  dir: string,
  action: string,
  keep: (found: Found<T>) => boolean = () => true,
): Found<T>[] {
  return eventsOf(dir)
    .filter((e) => e.action === action)
    .map((event) => {
      const ref = typeof event.data.record === "string" ? event.data.record : event.evidence[0];
      assert.ok(ref, `event ${event.seq} names a record`);
      return { ref, event, record: JSON.parse(readEvidence(dir, ref).toString("utf8")) as T };
    })
    .filter(keep);
}

export const repositoryOf = (dir: string): string => {
  const [started] = committed<{ config: { repository: { name: string } } }>(dir, "run-start");
  assert.ok(started);
  return started.record.config.repository.name;
};

export type Evaluated = Found<{ manifest: EvaluationManifest }> & { evaluation: string };

/** The library step's committed evaluation of `attempt`. */
export function evaluationOf(dir: string, attempt: number): Evaluated {
  const [found] = committed<{ manifest: EvaluationManifest }>(
    dir,
    "evaluation",
    (f) => f.event.attempt === attempt && f.event.data.step === LIBRARY,
  );
  assert.ok(found?.event.evaluation, `attempt ${attempt} has an evaluation`);
  return { ...found, evaluation: found.event.evaluation };
}

export const targetOf = (dir: string, attempt: number): KnowledgeTarget =>
  knowledgeTarget(dir, repositoryOf(dir), evaluationOf(dir, attempt).record.manifest);

/** The candidate review of `attempt`: a recorded source inspection of its library files. */
export function candidateReview(dir: string, attempt: number): Found<ReviewRecord> {
  const [found] = committed<ReviewRecord>(
    dir,
    "review",
    (f) => f.event.attempt === attempt && f.record.kind === "candidate",
  );
  assert.ok(found, `attempt ${attempt}'s candidate was reviewed`);
  return found;
}

/** The acceptance-stage verifier invocation of `attempt` with a result for `target`. */
export function invocationFor(dir: string, attempt: number, target: string): Found<Invocation> {
  const [found] = committed<Invocation>(
    dir,
    "verifier-invocation",
    (f) =>
      f.record.attempt === attempt &&
      f.record.stage === "acceptance" &&
      f.record.results.some((r) => targetKey(r.target) === target),
  );
  assert.ok(found, `attempt ${attempt} has an acceptance invocation for ${target}`);
  return found;
}

/** A library target attempt 1 passed although its candidate failed. */
export function passedTarget(dir: string, binding = "library.accepts"): string {
  const [found] = committed<Invocation>(
    dir,
    "verifier-invocation",
    (f) =>
      f.record.attempt === 1 && f.record.stage === "acceptance" && f.record.binding === binding,
  );
  const passed = found?.record.results.find((r) => r.outcome === "passed");
  assert.ok(passed, `attempt 1 passed a ${binding} target`);
  return targetKey(passed.target);
}

/** An evaluation's whole scope: its candidate and every dependency it records, but `omit`. */
export function fullScope(
  dir: string,
  manifest: EvaluationManifest,
  omit: readonly string[] = [],
): KnowledgeScope {
  const deps = evaluationDependencies(manifest);
  for (const name of omit) assert.ok(deps[name], `the evaluation records ${name}`);
  return {
    repository: repositoryOf(dir),
    definitions: manifest.definitions,
    candidate: { commit: manifest.source.commit, tree: manifest.source.tree },
    dependencies: Object.fromEntries(Object.entries(deps).filter(([n]) => !omit.includes(n))),
  };
}

/** One committed observation of the run, as a template for fixture sessions. */
export function sessionObservation(
  dir: string,
  role: RoleName,
  attempt: number,
  session: string,
): Observation {
  const [first] = committed<AgentOutcome>(dir, "agent-invocation");
  assert.ok(first);
  return {
    ...first.record.observation,
    role,
    attempt,
    session,
    packet: sha256(session),
    toolCalls: [],
    denials: [],
  };
}

/** Records an agent session's outcome as the runner does; returns its record reference. */
export function recordSession(
  run: RunHandle,
  outcome: AgentOutcome,
  data: JsonObject = {},
): string {
  return String(recordInvocation(run, outcome, data).data.record);
}

/** A proposing agent's session: a reviewer-role diagnostic session of `attempt`. */
export const proposerSession = (run: RunHandle, attempt = 2, session = randomUUID()): string =>
  recordSession(run, {
    outcome: "blocked",
    blockers: ["proposes knowledge rather than a candidate"],
    observation: sessionObservation(run.dir, "reviewer", attempt, session),
  });

/**
 * A verdict that finds `entry` supported and, with `scope`, its narrower
 * scope justified; with `relations`, each recorded contradiction or correction.
 */
export const supportingVerdict = (
  entry: string,
  options: {
    scope?: boolean;
    basis?: "executed" | "inspection";
    relations?: readonly (readonly ["contradicts" | "supersedes", string])[];
  } = {},
): ReviewVerdict => ({
  verdict: "pass",
  coverage: [
    {
      subject: entry,
      result: "satisfied",
      basis: options.basis ?? "inspection",
      note: "The cited observations establish the claim at its scope and no further.",
    },
    ...(options.scope
      ? [
          {
            subject: scopeSubject(entry),
            result: "satisfied" as const,
            basis: "inspection" as const,
            note: "The inspected source shows the claim does not rely on the omitted dependencies.",
          },
        ]
      : []),
    ...(options.relations ?? []).map(([relation, other]) => ({
      subject: relationSubject(entry, relation, other),
      result: "satisfied" as const,
      basis: "inspection" as const,
      note: `The cited observations show this claim ${relation} ${other} at the same scope.`,
    })),
  ],
  targets: [],
  findings: [],
  blockers: [],
});

/**
 * A separate reviewer session assessing `proposal`; returns its record
 * reference. By default its verdict covers the proposal's recorded relations.
 */
export function reviewSession(
  run: RunHandle,
  proposal: Stored<KnowledgeProposal>,
  options: { session?: string; verdict?: ReviewVerdict; for?: string; attempt?: number } = {},
): string {
  const { contradicts, supersedes } = proposal.record;
  const relations = [
    ...contradicts.map((id) => ["contradicts", id] as const),
    ...supersedes.map((id) => ["supersedes", id] as const),
  ];
  return recordSession(
    run,
    {
      outcome: "reviewed",
      verdict: options.verdict ?? supportingVerdict(entryId(proposal.record), { relations }),
      observation: sessionObservation(
        run.dir,
        "reviewer",
        options.attempt ?? 2,
        options.session ?? randomUUID(),
      ),
    },
    { purpose: "knowledge-review", proposal: options.for ?? proposal.ref },
  );
}

/** A proposal about the library step's evaluation of `attempt`. */
export function proposal(
  run: RunHandle,
  fields: {
    attempt: number;
    claim: Claim;
    observations: KnowledgeProposal["observations"];
  } & Partial<KnowledgeProposal>,
): KnowledgeProposal {
  const evaluated = evaluationOf(run.dir, fields.attempt);
  return {
    format: 1,
    controller: CONTROLLER,
    run: run.run,
    step: LIBRARY,
    evaluation: evaluated.evaluation,
    round: null,
    scope: fullScope(run.dir, evaluated.record.manifest),
    proposer: fields.proposer ?? proposerSession(run),
    contradicts: [],
    supersedes: [],
    ...fields,
  };
}

/** Proposes, has a separate reviewer assess it, then admits it. */
export function proposeAndAdmit(
  run: RunHandle,
  p: KnowledgeProposal,
  review: (proposal: Stored<KnowledgeProposal>) => string | null = (s) => reviewSession(run, s),
): Stored<KnowledgeAdmission> {
  const proposed = proposeKnowledge(run, p);
  const admitted = admitKnowledge(run, {
    proposal: proposed.ref,
    review: review(proposed),
    controller: CONTROLLER,
  });
  assert.ok(admitted.ok, admitted.ok ? "" : admitted.diagnostics.join("\n"));
  return admitted.value;
}

/** Journals a record as the verification path does: the record first, then the evidence it owns. */
export function journalRecord(
  run: RunHandle,
  action: "verifier-invocation" | "review",
  record: { attempt: number; evaluation: string },
  owned: readonly string[] = [],
): string {
  const ref = putEvidence(run, stringify(record));
  appendEvent(run, {
    action,
    attempt: record.attempt,
    evaluation: record.evaluation,
    evidence: [ref, ...new Set(owned.filter((r) => r !== ref))],
    data: { record: ref },
  });
  return ref;
}

/** A verifier invocation, with its runs' output, journaled as the verification path journals one. */
export const journalInvocation = (run: RunHandle, record: Invocation): string =>
  journalRecord(
    run,
    "verifier-invocation",
    record,
    [...record.subjects, ...(record.judge ? [record.judge] : [])].flatMap((r) => [
      r.stdout,
      r.stderr,
    ]),
  );
