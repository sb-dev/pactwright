// T3.6 L4 proof assertions (evidence-backed learning log §3 T3.6-L4, L4-01
// and L4-02): checks over one run's saved journal and evidence, shared by the
// in-process rehearsal and the hosted proof. Every fact is read from records,
// never from job logs or summaries. Each assertion takes the state it checks,
// so a test can hand it a tampered copy and see it fail.

import assert from "node:assert/strict";

import type { AgentOutcome } from "../src/claude.js";
import type { JournalEvent, EvaluationManifest } from "../src/evidence.js";
import type { Injection } from "../src/fixture.js";
import {
  contextDigest,
  learningInputs,
  type ContextManifest,
  type GuidanceAdmission,
  type GuidanceProposal,
  type KnowledgeAdmission,
  type KnowledgeProposal,
} from "../src/knowledge.js";
import type { FeedbackSnapshot, RoundRecord } from "../src/pull-requests.js";
import type { Decision, ExplorationRouting, ExplorationStart } from "../src/verification.js";
import { savedFault } from "../src/workflow.js";

/** A run's saved state as the proof reads it: its directory, journal and record reader. */
export type ProofState = {
  dir: string;
  events: JournalEvent[];
  read(ref: string): unknown;
};

/** The faults the hosted proof dispatches, each ending one hosted job (§5 of the L4 plan). */
export const FAULTS = [
  "crash-after-save:start:support",
  "crash-after-save:knowledge-admission",
  "crash-after-save:guidance-proposal",
  "crash-after-save:guidance-admission",
  "crash-after-save:exploration-start",
  "crash-after-save:start:diagnose",
  "crash-after-save:agent-invocation:diagnostic-approach",
  "crash-after-save:exploration-routing",
  "crash-after-save:start:challenge",
  "crash-after-save:review:challenge",
] as const;

/** The effect fault of the second round, recovered by read-back. */
export const EFFECT_FAULT = "crash-after-effect:pr-reply";

type Start = {
  phase: string;
  step: string;
  attempt: number;
  key: string;
  production: { context?: ContextManifest; exploration?: string } | null;
  allowance?: number | null;
};
type Evaluation = { step: string; attempt: number; manifest: EvaluationManifest };
type Intent = { key: string; request: { action: string; payload?: Record<string, unknown> } };
type Receipt = { key: string; receipt: { details?: { commit?: string } }; reconciled: boolean };
type Github = { repository: string; run_id: number; run_attempt: number; job: string };

const RESULTS = new Set(["agent-invocation", "review", "verifier-admission", "pr-assessment"]);
const DONE = new Set(["submitted", "reviewed", "proposed", "diagnosed"]);
const LEARNING_PHASES = new Set(["propose", "support", "diagnose", "select", "challenge"]);

const refOf = (e: JournalEvent): string => {
  const ref = typeof e.data.record === "string" ? e.data.record : e.evidence[0];
  assert.ok(ref, `${e.action} ${e.seq} names no record`);
  return ref;
};

/** The records journaled under `action`, with their events. */
export function recordsOf<T>(
  state: ProofState,
  action: string,
): { event: JournalEvent; ref: string; record: T }[] {
  return state.events
    .filter((e) => e.action === action)
    .map((event) => ({ event, ref: refOf(event), record: state.read(refOf(event)) as T }));
}

/** Each owner epoch: its owner event, its events and whether it ended released. */
function epochs(
  state: ProofState,
): { owner: JournalEvent; events: JournalEvent[]; released: boolean; last: boolean }[] {
  const owners = state.events.filter((e) => e.action === "owner");
  return owners.map((owner, i) => {
    const next = owners[i + 1]?.seq ?? Number.POSITIVE_INFINITY;
    const events = state.events.filter((e) => e.seq > owner.seq && e.seq < next);
    return {
      owner,
      events,
      released: events.some((e) => e.action === "released"),
      last: i === owners.length - 1,
    };
  });
}

/** The last event of each owner epoch that ended without a release: where a runner was lost. */
export function lostAt(state: ProofState): JournalEvent[] {
  return epochs(state).flatMap((e) => (!e.released && !e.last ? [e.events.at(-1) ?? e.owner] : []));
}

/** Each phase start in journal order, with the result that answered it, if any. */
function starts(
  state: ProofState,
): { event: JournalEvent; start: Start; result: JournalEvent | null }[] {
  const out: { event: JournalEvent; start: Start; result: JournalEvent | null }[] = [];
  for (const e of state.events) {
    if (e.action === "start") {
      out.push({ event: e, start: state.read(refOf(e)) as Start, result: null });
    } else if (RESULTS.has(e.action)) {
      const open = out.at(-1);
      if (open && open.result === null) open.result = e;
    }
  }
  return out;
}

/** 1. One run, owned by hosted jobs of several workflow runs. */
export function oneRun(state: ProofState, minimum: { jobs: number; runs: number }): void {
  assert.equal(state.events.filter((e) => e.action === "run-start").length, 1, "one run-start");
  const owners = state.events
    .filter((e) => e.action === "owner")
    .map((e) => e.data.github as Github | null);
  assert.ok(
    owners.every((o) => o),
    "every owner epoch names its hosted job",
  );
  const jobs = new Set(owners.map((o) => `${o?.run_id}/${o?.run_attempt}/${o?.job}`));
  const runs = new Set(owners.map((o) => o?.run_id));
  assert.ok(jobs.size >= minimum.jobs, `${jobs.size} hosted jobs, at least ${minimum.jobs}`);
  assert.ok(runs.size >= minimum.runs, `${runs.size} workflow runs, at least ${minimum.runs}`);
}

/** 2. Each dispatched fault lost its runner right after saving its boundary. */
export function boundaries(state: ProofState, faults: readonly string[] = FAULTS): void {
  const lost = lostAt(state);
  for (const fault of faults) {
    const matches = savedFault(fault);
    if (matches) {
      assert.ok(
        lost.some(matches),
        `${fault}: no runner was lost right after saving a matching event`,
      );
      continue;
    }
    const [when, action] = fault.split(":");
    assert.equal(when, "crash-after-effect", `${fault} is not a proof fault`);
    assert.ok(
      lost.some(
        (e) =>
          e.action === "effect-intent" &&
          (state.read(refOf(e)) as Intent).request.action === action,
      ),
      `${fault}: no runner was lost after an ${action} intent`,
    );
  }
}

/** 3. Completed work is never repeated; a session lost in a learning phase ran again once under its key. */
export function noReplay(state: ProofState): void {
  const byKey = new Map<string, { starts: number; done: number; phase: string }>();
  for (const s of starts(state)) {
    const k = byKey.get(s.start.key) ?? { starts: 0, done: 0, phase: s.start.phase };
    k.starts += 1;
    if (s.result && DONE.has(String(s.result.data.outcome))) k.done += 1;
    byKey.set(s.start.key, k);
  }
  for (const [key, k] of byKey) assert.ok(k.done <= 1, `${key} completed ${k.done} times`);
  for (const lost of lostAt(state).filter((e) => e.action === "start")) {
    const key = (state.read(refOf(lost)) as Start).key;
    const k = byKey.get(key);
    assert.ok(k && LEARNING_PHASES.has(k.phase), `${key} is a learning phase`);
    assert.equal(k.starts, 2, `${key}: the lost session ran again once`);
    assert.equal(k.done, 1, `${key}: completed once`);
  }
  const once = (what: string, keys: string[]): void =>
    assert.equal(new Set(keys).size, keys.length, `${what} is recorded once`);
  once(
    "each proposal's admission",
    state.events
      .filter((e) => e.action === "knowledge-admission" || e.action === "guidance-admission")
      .map((e) => e.evidence[1] ?? ""),
  );
  once(
    "each exploration",
    recordsOf<ExplorationStart>(state, "exploration-start").map(
      (x) => `${x.record.step}/${x.record.attempt}`,
    ),
  );
  once(
    "each routing",
    recordsOf<ExplorationRouting>(state, "exploration-routing").map((x) => x.record.exploration),
  );
  once(
    "each evaluation's challenge",
    state.events
      .filter(
        (e) =>
          e.action === "review" && e.data.kind === "challenge" && e.data.outcome === "reviewed",
      )
      .map((e) => e.evaluation ?? ""),
  );
}

/** 4. A lost session's allowance stays reserved and counted. */
export function reservations(state: ProofState): void {
  const open = starts(state).filter((s) => s.result === null && (s.start.allowance ?? 0) > 0);
  const lost = lostAt(state)
    .filter((e) => e.action === "start")
    .map((e) => (state.read(refOf(e)) as Start).key)
    .sort();
  assert.deepEqual(
    open.map((s) => s.start.key).sort(),
    lost,
    "the unresolved reservations are exactly the sessions lost with their runners",
  );
}

/** 5. Each frozen context reproduces its consumed inputs and is the one its evaluation names. */
export function manifests(state: ProofState): void {
  const evaluations = recordsOf<Evaluation>(state, "evaluation");
  let checked = 0;
  for (const s of starts(state)) {
    const context = s.start.production?.context;
    if (s.start.phase !== "produce" || !context) continue;
    const inputs = learningInputs(state.dir, context);
    assert.ok(inputs.ok, inputs.ok ? "" : inputs.diagnostics.join("; "));
    const evaluation = evaluations.find(
      (e) =>
        e.event.seq > s.event.seq &&
        e.record.step === s.start.step &&
        e.record.attempt === s.start.attempt,
    );
    if (!evaluation) continue;
    assert.equal(
      evaluation.record.manifest.context?.manifest,
      contextDigest(context),
      `${s.start.step} attempt ${s.start.attempt}'s evaluation names its frozen context`,
    );
    checked += 1;
  }
  assert.ok(checked > 0, "a frozen context was checked");
}

const firstFeedback = (state: ProofState): number =>
  state.events.find((e) => e.action === "pr-feedback")?.seq ?? Number.POSITIVE_INFINITY;

const contexts = (state: ProofState): { seq: number; context: ContextManifest }[] =>
  starts(state).flatMap((s) =>
    s.start.phase === "produce" && s.start.production?.context
      ? [{ seq: s.event.seq, context: s.start.production.context }]
      : [],
  );

/** 6. Supported knowledge is consumed by a later attempt, and omitted as historical once its candidate changed. */
export function knowledgeReuse(state: ProofState): void {
  const supported = recordsOf<KnowledgeAdmission>(state, "knowledge-admission")
    .filter((a) => a.record.disposition === "supported")
    .map((a) => ({ entry: a.record.entry, seq: a.event.seq }));
  assert.ok(supported.length > 0, "supported knowledge");
  const all = contexts(state);
  assert.ok(
    supported.some((k) =>
      all.some((c) => c.seq > k.seq && c.context.knowledge.some((i) => i.id === k.entry)),
    ),
    "a later attempt consumed supported knowledge",
  );
  assert.ok(
    supported.some((k) =>
      all.some((c) => c.context.omitted.some((o) => o.id === k.entry && o.reason === "historical")),
    ),
    "supported knowledge was omitted as historical once its candidate changed",
  );
}

/** 7. A reminder rests on reviewed failures of two attempts and guides attempts before and after publication. */
export function guidance(state: ProofState): void {
  const supported = recordsOf<GuidanceAdmission>(state, "guidance-admission").filter(
    (a) => a.record.disposition === "supported",
  );
  assert.ok(supported.length > 0, "supported guidance");
  const feedback = firstFeedback(state);
  for (const a of supported) {
    const proposal = state.read(a.record.proposal) as GuidanceProposal;
    const attempts = new Set(
      proposal.occurrences.map((o) => (state.read(o.review) as { attempt: number }).attempt),
    );
    assert.ok(
      attempts.size >= 2,
      `${a.record.guidance} cites reviewed failures of ${attempts.size} attempt(s)`,
    );
  }
  const ids = new Set(supported.map((a) => a.record.guidance));
  const consumers = contexts(state).filter((c) => c.context.guidance.some((g) => ids.has(g.id)));
  assert.ok(
    consumers.some((c) => c.seq < feedback),
    "the reminder guided an attempt before publication",
  );
  assert.ok(
    consumers.some((c) => c.seq > feedback),
    "the reminder guided a correction round's attempt",
  );
}

/** 8. An exploration round ran both diagnoses and a selection, and the next attempt followed its routing. */
export function exploration(state: ProofState): void {
  const opened = recordsOf<ExplorationStart>(state, "exploration-start");
  assert.ok(opened.length > 0, "an exploration round");
  const sessions = recordsOf<AgentOutcome>(state, "agent-invocation");
  const routings = recordsOf<ExplorationRouting>(state, "exploration-routing");
  const evaluations = recordsOf<Evaluation>(state, "evaluation");
  for (const x of opened) {
    for (const side of ["approach", "alternative"]) {
      assert.ok(
        sessions.some(
          (s) =>
            s.event.data.exploration === x.ref &&
            s.event.data.purpose === `diagnostic-${side}` &&
            s.record.outcome === "diagnosed",
        ),
        `${side} diagnosis of ${x.ref}`,
      );
    }
    const routing = routings.find((r) => r.record.exploration === x.ref);
    assert.equal(routing?.record.outcome, "selected", `${x.ref} selected an approach`);
    assert.ok(
      evaluations.some(
        (e) =>
          e.record.step === x.record.step &&
          e.record.attempt === x.record.attempt &&
          e.record.manifest.exploration === routing?.ref,
      ),
      `attempt ${x.record.attempt} followed the routing`,
    );
  }
}

/** 9. The explored attempt's acceptance counted its cross-attempt challenge. */
export function challenge(state: ProofState): void {
  const explored = recordsOf<Evaluation>(state, "evaluation").filter(
    (e) => e.record.manifest.exploration,
  );
  assert.ok(explored.length > 0, "an explored evaluation");
  const accepted = recordsOf<Decision>(state, "acceptance").filter((a) =>
    explored.some((e) => e.event.evaluation === a.event.evaluation),
  );
  assert.ok(accepted.length > 0, "an explored evaluation was accepted");
  const challenges = state.events.filter(
    (e) => e.action === "review" && e.data.kind === "challenge",
  );
  for (const a of accepted) {
    const { record } = a;
    assert.ok(record.decision === "accept");
    assert.ok(
      challenges.some(
        (c) => c.evaluation === a.event.evaluation && record.evidence.includes(refOf(c)),
      ),
      `${record.step} attempt ${record.attempt}'s acceptance counts its challenge`,
    );
  }
}

/**
 * 10. Initial publication and two correction rounds in this one run: each
 * round answered, every effect read back once, one pull request, a fixing
 * commit for each round that corrected the step, and the unchanged step's
 * history kept.
 */
export function rounds(state: ProofState, steps: { corrected: string; unchanged: string }): void {
  const feedback = recordsOf<FeedbackSnapshot>(state, "pr-feedback");
  const done = recordsOf<RoundRecord>(state, "pr-round");
  assert.deepEqual(
    done.map((r) => r.record.round),
    [1, 2],
    "two completed rounds",
  );
  assert.deepEqual(
    [...new Set(feedback.map((f) => `${f.record.round}:${f.record.trigger.kind}`))],
    ["1:review", "2:manual"],
    "a submitted review, then a manual round",
  );
  for (const r of done) assert.ok(r.record.replies.length > 0, `round ${r.record.round} replied`);
  const intents = recordsOf<Intent>(state, "effect-intent");
  const receipts = recordsOf<Receipt>(state, "effect-receipt");
  const keys = receipts.map((r) => r.record.key);
  assert.equal(new Set(keys).size, keys.length, "one receipt per effect");
  for (const i of intents)
    assert.ok(keys.includes(i.record.key), `${i.record.request.action} has a receipt`);
  assert.equal(
    intents.filter((i) => i.record.request.action === "open-pr").length,
    1,
    "one pull request",
  );
  assert.ok(
    receipts.some((r) => r.record.reconciled),
    "an interrupted effect was read back",
  );
  const pushed = receipts.filter(
    (r) =>
      intents.find((i) => i.record.key === r.record.key)?.record.request.action === "push-branch",
  );
  const assessments = recordsOf<{ correction: { step: string } | null }>(state, "pr-assessment");
  const corrections = assessments.filter((a) => a.record.correction?.step === steps.corrected);
  assert.ok(corrections.length > 0, `a round corrected ${steps.corrected}`);
  const acceptances = recordsOf<Decision>(state, "acceptance");
  const corrected = acceptances.filter((a) => a.record.step === steps.corrected);
  for (const c of corrections) {
    assert.ok(
      corrected.some((a) => a.event.seq > c.event.seq),
      `${steps.corrected} was accepted again after the round's assessment`,
    );
    assert.ok(
      pushed.some((p) => p.event.seq > c.event.seq),
      "the round's correction was published as a fixing commit",
    );
  }
  assert.equal(
    new Set(pushed.map((p) => p.record.receipt.details?.commit)).size,
    pushed.length,
    "every push published a new head",
  );
  assert.equal(
    acceptances.filter((a) => a.record.step === steps.unchanged).length,
    1,
    `${steps.unchanged} keeps its one acceptance`,
  );
  const attempts = corrected.map((a) => a.record.attempt);
  assert.deepEqual(
    attempts,
    [...attempts].sort((a, b) => a - b),
    "one active candidate, in attempt order",
  );
}

/** 11. No proposer reviewed its own proposal, and every acceptance follows verification and review of its evaluation. */
export function authority(state: ProofState): void {
  const admissions = [
    ...recordsOf<KnowledgeAdmission>(state, "knowledge-admission"),
    ...recordsOf<GuidanceAdmission>(state, "guidance-admission"),
  ];
  assert.ok(admissions.length > 0, "admissions");
  for (const a of admissions) {
    const proposal = state.read(a.record.proposal) as KnowledgeProposal | GuidanceProposal;
    assert.ok(a.record.review, `${a.record.proposal} was reviewed`);
    assert.notEqual(
      a.record.review,
      proposal.proposer,
      "the proposer never reviews its own proposal",
    );
  }
  for (const a of state.events.filter((e) => e.action === "acceptance")) {
    const before = state.events.filter((e) => e.seq < a.seq && e.evaluation === a.evaluation);
    assert.ok(
      before.some((e) => e.action === "verifier-invocation"),
      `acceptance ${a.seq} follows verification`,
    );
    assert.ok(
      before.some(
        (e) =>
          e.action === "review" && e.data.kind === "candidate" && e.data.outcome === "reviewed",
      ),
      `acceptance ${a.seq} follows a candidate review`,
    );
  }
}

/** 12. The template's injected attempts, and only they, are labelled as fixture injections that used nothing. */
export function injected(state: ProofState): void {
  const [started] = recordsOf<{ config: { job?: { inject?: Injection[] } } }>(state, "run-start");
  const inject = started?.record.config.job?.inject ?? [];
  assert.ok(inject.length > 0, "the run injects attempts");
  const producers = recordsOf<AgentOutcome>(state, "agent-invocation").filter(
    (p) => p.event.data.role === "producer",
  );
  for (const p of producers) {
    const step = String(p.event.data.step);
    const listed = inject.some((i) => i.step === step && i.attempt === p.event.attempt);
    const { observation } = p.record;
    if (listed) {
      assert.ok(
        observation.fixture?.startsWith(`injected ${step} attempt ${p.event.attempt} sha256:`),
        `${step} attempt ${p.event.attempt} is labelled injected`,
      );
      assert.equal(observation.turns, 0);
      assert.equal(observation.usage.costUsd, 0);
    } else {
      assert.equal(
        observation.fixture,
        undefined,
        `${step} attempt ${p.event.attempt} is a provider session`,
      );
    }
  }
  for (const i of inject) {
    assert.ok(
      producers.some((p) => p.event.data.step === i.step && p.event.attempt === i.attempt),
      `${i.step} attempt ${i.attempt} was injected`,
    );
  }
}

/** Every assertion of the L4 proof, in order. */
export function proveAll(
  state: ProofState,
  options: {
    minimum: { jobs: number; runs: number };
    steps: { corrected: string; unchanged: string };
  },
): void {
  oneRun(state, options.minimum);
  boundaries(state, [...FAULTS, EFFECT_FAULT]);
  noReplay(state);
  reservations(state);
  manifests(state);
  knowledgeReuse(state);
  guidance(state);
  exploration(state);
  challenge(state);
  rounds(state, options.steps);
  authority(state);
  injected(state);
}
