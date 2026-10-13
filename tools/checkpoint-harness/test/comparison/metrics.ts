// T3.6 L4 comparison (evidence-backed learning log §4): what one run used
// and how it ended, read from its run directory's committed journal and
// evidence, the same way for every arm's records. Usage counts live provider
// sessions, model turns, output tokens and uncached input tokens; the
// harness records no cache tokens, so they are reported as not recorded. The
// SDK's cost is kept only as an API-price equivalent. Injected attempts are
// attempts, never sessions or usage.

import type { AgentOutcome } from "../../src/claude.js";
import { readEvidence, readRun, type JournalEvent } from "../../src/evidence.js";
import type { Decision } from "../../src/verification.js";
import type { Arm, Task } from "./task.js";

export type Outcome =
  "valid" | "false-acceptance" | "exhausted" | "paused" | "infrastructure" | "error";

/** What a run used and recorded, before it is scored. */
export type Usage = {
  attempts: number;
  liveAttempts: number;
  injectedAttempts: number;
  /** Live attempts whose `correct` decision shares a finding rule with the previous attempt's. */
  repeatedFailures: number;
  sealRejections: number;
  sessions: number;
  learningSessions: number;
  turns: number;
  outputTokens: number;
  inputTokens: number;
  cacheTokens: "not recorded";
  apiEquivalentUsd: number;
  unknownCost: number;
  /** Failed sessions whose reason names a provider, rate-limit or network failure. */
  infrastructureFailures: string[];
  journalMs: number;
  /** The candidate commit of the step's latest acceptance, if any. */
  accepted: string | null;
};

export type RunMetrics = Usage & {
  set: string;
  task: string;
  category: string;
  arm: Arm;
  repeat: number;
  /** Which run of the (task, repeat) this is: 0, then 1, 2 for infrastructure reruns. */
  rerun: number;
  /** A later rerun replaced this run's (task, repeat) in the paired totals. */
  superseded: boolean;
  protocol: string;
  taskDigest: string;
  harness: string;
  outcome: Outcome;
  oracle: "passed" | "failed" | "not-run";
  oracleDetail: string;
  reasons: string[];
  elapsedMs: number;
  run: string | null;
  archive: string | null;
};

const LEARNING = new Set([
  "learning-proposal",
  "knowledge-review",
  "guidance-review",
  "diagnostic-approach",
  "diagnostic-alternative",
  "exploration-selection",
]);
const INFRASTRUCTURE =
  /rate.?limit|overloaded|\b429\b|\b5[0-9]{2}\b|ECONN|ETIMEDOUT|EAI_AGAIN|socket hang up|network|unavailable/i;

const refOf = (e: JournalEvent): string =>
  typeof e.data.record === "string" ? e.data.record : (e.evidence[0] ?? "");

/** The usage and decisions a run directory records for the task's step. */
export function measure(dir: string, task: Pick<Task, "step">): Usage | { error: string } {
  const read = readRun(dir);
  if (!read.ok) return { error: read.diagnostics.join("; ") };
  const events = read.records.events;
  const record = <T>(e: JournalEvent): T =>
    JSON.parse(readEvidence(dir, refOf(e)).toString("utf8")) as T;
  const observations: {
    observation: AgentOutcome["observation"];
    learning: boolean;
    outcome: AgentOutcome;
  }[] = [];
  for (const e of events) {
    if (e.action === "agent-invocation") {
      const outcome = record<AgentOutcome>(e);
      observations.push({
        observation: outcome.observation,
        learning: LEARNING.has(String(e.data.purpose)),
        outcome,
      });
    } else if (e.action === "review") {
      const r = record<{ kind: string; outcome: AgentOutcome }>(e);
      observations.push({
        observation: r.outcome.observation,
        learning: r.kind === "challenge",
        outcome: r.outcome,
      });
    }
  }
  const injected = (o: AgentOutcome["observation"]): boolean =>
    (o.session ?? "").startsWith("fixture-injection/");
  const live = observations.filter((o) => !injected(o.observation));
  const sum = (values: (number | "unknown" | null)[]): number =>
    values.reduce<number>((n, v) => (typeof v === "number" ? n + v : n), 0);
  const producers = events.filter(
    (e) =>
      e.action === "agent-invocation" && e.data.role === "producer" && e.data.step === task.step,
  );
  const injectedAttempts = new Set(
    producers.filter((e) => injected(record<AgentOutcome>(e).observation)).map((e) => e.attempt),
  );
  const liveAttempts = new Set(
    producers.filter((e) => !injected(record<AgentOutcome>(e).observation)).map((e) => e.attempt),
  );
  const decisions = [...events.filter((e) => e.action === "decision" || e.action === "acceptance")]
    .map((e) => record<Decision>(e))
    .filter((d) => d.step === task.step);
  const rules = (attempt: number): Set<string> =>
    new Set(
      decisions
        .filter((d) => d.attempt === attempt && d.decision === "correct")
        .flatMap((d) => (d.decision === "correct" ? d.findings.map((f) => f.rule) : [])),
    );
  let repeatedFailures = 0;
  for (const attempt of liveAttempts) {
    if (attempt === undefined || attempt === null || attempt < 2) continue;
    const now = rules(attempt);
    const before = rules(attempt - 1);
    if ([...now].some((r) => before.has(r))) repeatedFailures += 1;
  }
  const accepted = decisions.filter((d) => d.decision === "accept").at(-1)?.candidate ?? null;
  const times = events.map((e) => Date.parse(e.time)).filter((t) => !Number.isNaN(t));
  return {
    attempts: Math.max(
      0,
      ...events
        .filter(
          (e) => e.action === "start" && e.data.phase === "produce" && e.data.step === task.step,
        )
        .map((e) => e.attempt ?? 0),
    ),
    liveAttempts: liveAttempts.size,
    injectedAttempts: injectedAttempts.size,
    repeatedFailures,
    sealRejections: events.filter((e) => e.action === "seal-rejected").length,
    sessions: live.length,
    learningSessions: live.filter((o) => o.learning).length,
    turns: sum(live.map((o) => o.observation.turns)),
    outputTokens: sum(live.map((o) => o.observation.usage.outputTokens)),
    inputTokens: sum(live.map((o) => o.observation.usage.inputTokens)),
    cacheTokens: "not recorded",
    apiEquivalentUsd: sum(live.map((o) => o.observation.usage.costUsd)),
    unknownCost: live.filter((o) => o.observation.usage.costUsd === "unknown").length,
    infrastructureFailures: live.flatMap((o) =>
      o.outcome.outcome === "failed" && INFRASTRUCTURE.test(o.outcome.reason)
        ? [o.outcome.reason]
        : [],
    ),
    journalMs: times.length > 1 ? Math.max(...times) - Math.min(...times) : 0,
    accepted,
  };
}

/** How a run ended, from its result, its records and the oracle. */
export function classify(
  result: { outcome: string; reasons: { code: string }[] } | null,
  usage: Usage | { error: string },
  oracle: "passed" | "failed" | "not-run",
): Outcome {
  if (!result || "error" in usage || result.outcome === "invalid") return "error";
  if (usage.accepted !== null && result.outcome === "selection-accepted") {
    return oracle === "passed" ? "valid" : oracle === "failed" ? "false-acceptance" : "error";
  }
  if (usage.infrastructureFailures.length > 0) return "infrastructure";
  return result.reasons.some((r) => r.code === "exhausted") ? "exhausted" : "paused";
}
