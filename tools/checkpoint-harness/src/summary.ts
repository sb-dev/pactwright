// T3.5 H3: the operator summary of a workflow job (production readiness log
// §3 H3, requirement 10). Every field comes from the run's recorded state, and
// `checkSummary` compares each field with that state again, so a summary that
// omits or misstates a field fails on that field. A job that could not restore
// state reports every run field as unknown and no acceptance. A green job or a
// saved artifact is never reported as step or checkpoint acceptance.

import stringify from "safe-stable-stringify";

import type { PauseReason, RunFacts } from "./runner.js";
import type { SavedState } from "./state.js";

export const UNKNOWN = "unknown" as const;
type Unknown = typeof UNKNOWN;

export type Summary = {
  action: string;
  /** What the job did: ran the run to a stop, recorded an operator record, reported, or refused. */
  outcome: "selection-accepted" | "paused" | "recorded" | "reported" | "refused";
  run: { name: string; id: string } | Unknown;
  boundary: string | Unknown;
  accepted: string[] | Unknown;
  checkpoint: { complete: boolean; unaccepted: string[]; pending: number } | Unknown;
  roles: RunFacts["roles"] | Unknown;
  spending: RunFacts["spending"] | Unknown;
  pause: string[] | null | Unknown;
  next: string;
  evidence: { job: string; state: string | null; records: string[] } | Unknown;
  saved:
    | {
        name: string;
        sequence: number;
        id: string;
        url: string | null;
        expiresAt: string | null;
        journal: { seq: number; head: string | null };
      }
    | null
    | Unknown;
  pullRequest: { number: number; url: string; head: string | null } | null | Unknown;
  round:
    | {
        round: number;
        pull: number;
        head: string;
        complete: boolean;
        dispositions: { item: string; disposition: string; reason: string }[];
        fix: { commit: string | null; evaluation: string; targets: number } | null;
        replies: { item: string; reference: string }[];
      }
    | null
    | Unknown;
  /**
   * Evidence-backed learning (T3.6 §2.6, L4): the run's mode, its knowledge
   * and reminders by disposition, each step's latest frozen context, its
   * explorations and challenges, and what the learning sessions used. A run
   * that does not learn reports mode none; unreadable records are reported
   * unavailable. Knowledge reuse, guidance and selection are never acceptance.
   */
  learning: Learning | Unknown;
  diagnostics: string[];
};

type Learning =
  | { mode: "none" }
  | {
      mode: "context" | "phases";
      records: NonNullable<RunFacts["learning"]>["records"];
      contexts: {
        step: string;
        attempt: number;
        manifest: string;
        knowledge: string[];
        guidance: string[];
        omitted: Record<string, number>;
      }[];
      explorations: {
        step: string;
        attempt: number;
        round: number;
        trigger: string;
        diagnoses: string[];
        checks: string[];
        routing: string;
      }[];
      challenges: { step: string; attempt: number; verdict: string }[];
      usage: NonNullable<RunFacts["learning"]>["usage"];
    };

/** The learning facts as the summary reports them: each step's latest context, and counts of omissions by reason. */
function learningOf(facts: RunFacts): Learning {
  const l = facts.learning;
  if (!l || l.mode === "none") return { mode: "none" };
  const latest = new Map(l.contexts.map((c) => [c.step, c]));
  return {
    mode: l.mode,
    records: l.records,
    contexts: [...latest.values()].map((c) => ({
      step: c.step,
      attempt: c.attempt,
      manifest: c.manifest,
      knowledge: c.knowledge,
      guidance: c.guidance,
      omitted: c.omitted.reduce<Record<string, number>>(
        (n, o) => ({ ...n, [o.reason]: (n[o.reason] ?? 0) + 1 }),
        {},
      ),
    })),
    explorations: l.explorations.map((x) => ({
      step: x.step,
      attempt: x.attempt,
      round: x.round,
      trigger: `${x.trigger.kind} on ${x.trigger.rule}`,
      diagnoses: x.diagnoses.map((d) => `${d.side}: ${d.outcome}`),
      checks: x.checks.map((c) => `${c.side}: ${c.outcome}`),
      routing: x.routing?.outcome ?? "none",
    })),
    challenges: l.challenges.map((c) => ({ step: c.step, attempt: c.attempt, verdict: c.verdict })),
    usage: l.usage,
  };
}

const reasonLine = (r: PauseReason): string =>
  `${r.code} ${r.subject}: ${r.detail}${r.request ? ` (request ${r.request})` : ""}`;

/** The operator's next action, from the recorded stop. */
export function nextAction(facts: RunFacts, handedTo: string | null): string {
  if (handedTo) return `none: the ${handedTo} job continues the run`;
  // An approve, deny or amend job records its input; the run applies it when continued.
  if (facts.unapplied) return `continue: the next job applies the recorded ${facts.unapplied}`;
  const pause = facts.pause ?? [];
  const codes = new Set(pause.map((r) => r.code));
  if (codes.has("yield")) return "none: a continuation is dispatched within the selection";
  const pending = facts.pending[0];
  if (codes.has("approval") && pending) {
    return `approve or deny request ${pending.request} for candidate ${pending.candidate}`;
  }
  if (codes.has("exhausted")) return "amend the exhausted budget with a reason, or stop the run";
  if (codes.has("effect-blocked")) return "fix the cause the named effect reports, then continue";
  if (codes.has("effect-refused") || codes.has("effect-uncertain") || codes.has("effect-invalid")) {
    return "inspect the named effect's target, then continue";
  }
  if (pause.length > 0) return "resolve the named pause reason, then continue";
  const queued = facts.round?.complete ? facts.queued[0] : undefined;
  if (queued) {
    return `none: address-comments for review ${queued.review} on #${queued.pull}, submitted during the last round, is dispatched`;
  }
  const blocked = facts.round?.dispositions.filter((d) => d.disposition === "blocked") ?? [];
  if (blocked.length > 0) {
    return `decide the blocked feedback ${blocked.map((b) => b.item).join(", ")}; dispatch address-comments after an edit`;
  }
  if (facts.round && !facts.round.complete) return "continue: the correction round is incomplete";
  return facts.checkpoint.complete
    ? "none: the checkpoint is complete"
    : "extend the selection with continue and a later through, or review the pull request";
}

/** The summary of a job that ran or read the run, from its facts and saved state. */
export function summarize(input: {
  action: string;
  outcome: Summary["outcome"];
  facts: RunFacts;
  saved: SavedState | null;
  savedJournal: { seq: number; head: string | null } | null;
  job: string;
  handedTo: string | null;
  diagnostics?: string[];
}): Summary {
  const { facts } = input;
  return {
    action: input.action,
    outcome: input.outcome,
    run: { name: facts.name ?? facts.run, id: facts.run },
    boundary: facts.boundary,
    accepted: facts.accepted,
    checkpoint: {
      complete: facts.checkpoint.complete,
      unaccepted: facts.checkpoint.unaccepted,
      pending: facts.checkpoint.pending.length,
    },
    roles: facts.roles,
    spending: facts.spending,
    pause: facts.pause ? facts.pause.map(reasonLine) : null,
    next: nextAction(facts, input.handedTo),
    evidence: {
      job: input.job,
      state: input.saved?.url ?? null,
      records: facts.evidence.flatMap((e) =>
        [e.acceptance, ...e.refs].map((ref) => `evidence/${ref.slice("sha256:".length)}`),
      ),
    },
    saved:
      input.saved && input.savedJournal
        ? {
            name: input.saved.name,
            sequence: input.saved.sequence,
            id: input.saved.id,
            url: input.saved.url,
            expiresAt: input.saved.expiresAt,
            journal: input.savedJournal,
          }
        : null,
    pullRequest: facts.pullRequest?.pull
      ? {
          number: facts.pullRequest.pull.number,
          url: facts.pullRequest.pull.url,
          head: facts.pullRequest.head?.commit ?? null,
        }
      : null,
    round: facts.round
      ? {
          round: facts.round.round,
          pull: facts.round.pull,
          head: facts.round.head,
          complete: facts.round.complete,
          dispositions: facts.round.dispositions,
          fix: facts.round.fix
            ? {
                commit: facts.round.fix.commit,
                evaluation: facts.round.fix.evaluation,
                targets: facts.round.fix.targets,
              }
            : null,
          replies: facts.round.replies,
        }
      : null,
    learning: learningOf(facts),
    diagnostics: input.diagnostics ?? [],
  };
}

/** The summary of a job that refused before any state was restored: nothing is known. */
export function refusedSummary(action: string, job: string, diagnostics: string[]): Summary {
  return {
    action,
    outcome: "refused",
    run: UNKNOWN,
    boundary: UNKNOWN,
    accepted: UNKNOWN,
    checkpoint: UNKNOWN,
    roles: UNKNOWN,
    spending: UNKNOWN,
    pause: UNKNOWN,
    next: "correct the refused input or state, then dispatch again; nothing was accepted",
    evidence: UNKNOWN,
    saved: UNKNOWN,
    pullRequest: UNKNOWN,
    round: UNKNOWN,
    learning: UNKNOWN,
    diagnostics,
  };
}

/** The summary fields `checkSummary` compares with recorded state. */
export const FIELDS = [
  "run",
  "boundary",
  "accepted",
  "checkpoint",
  "roles",
  "spending",
  "pause",
  "next",
  "evidence",
  "saved",
  "pullRequest",
  "round",
  "learning",
] as const;

/**
 * The fields of a summary that disagree with the recorded state, each named
 * once. A refused summary must report every run field unknown.
 */
export function checkSummary(
  summary: Summary,
  expected: Summary,
): { field: (typeof FIELDS)[number]; reported: unknown; recorded: unknown }[] {
  return FIELDS.filter((f) => stringify(summary[f]) !== stringify(expected[f])).map((f) => ({
    field: f,
    reported: summary[f] ?? null,
    recorded: expected[f],
  }));
}

const show = (value: unknown): string =>
  value === UNKNOWN ? "unknown" : value === null ? "none" : String(value);

/** The summary as the job's step summary. */
export function renderSummary(summary: Summary): string {
  const lines: string[] = [`# Checkpoint harness — ${summary.action}`, ""];
  const row = (label: string, value: string): void => {
    lines.push(`| ${label} | ${value.replaceAll("|", "\\|").replaceAll("\n", " ")} |`);
  };
  lines.push("| Field | Value |", "| --- | --- |");
  row("Outcome", summary.outcome);
  row("Run", summary.run === UNKNOWN ? "unknown" : `${summary.run.name} (${summary.run.id})`);
  row("Selected boundary", show(summary.boundary));
  row(
    "Accepted steps",
    summary.accepted === UNKNOWN ? "unknown" : summary.accepted.join(", ") || "none",
  );
  row(
    "Checkpoint complete",
    summary.checkpoint === UNKNOWN
      ? "unknown"
      : `${summary.checkpoint.complete ? "yes" : "no"}; unaccepted: ${summary.checkpoint.unaccepted.join(", ") || "none"}; pending targets: ${summary.checkpoint.pending}`,
  );
  if (summary.roles === UNKNOWN) row("Model and effort", "unknown");
  else {
    for (const [role, r] of Object.entries(summary.roles)) {
      const effort = Array.isArray(r.effort.reported)
        ? r.effort.reported.join(", ")
        : r.effort.reported;
      row(
        `${role} model / effort`,
        `requested ${r.model.requested} / ${r.effort.requested}; reported ${r.model.reported} / ${effort}`,
      );
    }
  }
  row(
    "Spending",
    summary.spending === UNKNOWN
      ? "unknown"
      : `${summary.spending.reportedUsd.toFixed(4)} USD reported; ${summary.spending.unknownSessions} sessions of unknown cost; ${summary.spending.reservedUsd.toFixed(2)} USD reserved by ${summary.spending.unresolved} unresolved sessions`,
  );
  row(
    "Pause reason",
    summary.pause === UNKNOWN
      ? "unknown"
      : summary.pause === null
        ? "none"
        : summary.pause.join("; "),
  );
  row("Next action", summary.next);
  if (summary.evidence === UNKNOWN) row("Evidence", "unknown");
  else {
    row("Job", summary.evidence.job);
    row("Saved state", summary.evidence.state ?? "none");
    row("Evidence records (in the saved state)", summary.evidence.records.join(", ") || "none");
  }
  row(
    "Saved-state identity",
    summary.saved === UNKNOWN
      ? "unknown"
      : summary.saved === null
        ? "none saved by this job"
        : `${summary.saved.name} sequence ${summary.saved.sequence} (artifact ${summary.saved.id}); journal ${summary.saved.journal.seq} ${summary.saved.journal.head ?? ""}; expires ${summary.saved.expiresAt ?? "per repository retention"}`,
  );
  row(
    "Pull request",
    summary.pullRequest === UNKNOWN
      ? "unknown"
      : summary.pullRequest === null
        ? "none"
        : `#${summary.pullRequest.number} ${summary.pullRequest.url} at ${summary.pullRequest.head ?? "unknown"}`,
  );
  if (summary.round !== UNKNOWN && summary.round !== null) {
    const r = summary.round;
    row(
      "Correction round",
      `${r.round} on #${r.pull} at ${r.head}; ${r.complete ? "complete" : "incomplete"}`,
    );
    row(
      "Feedback dispositions",
      r.dispositions.map((d) => `${d.item}: ${d.disposition} (${d.reason})`).join("; ") || "none",
    );
    row(
      "Fixing commit and checks",
      r.fix
        ? `${r.fix.commit ?? "not yet published"}; ${r.fix.targets} targets passed, evaluation ${r.fix.evaluation}`
        : "none",
    );
    row("Reply receipts", r.replies.map((x) => `${x.item}: ${x.reference}`).join("; ") || "none");
  }
  renderLearning(summary.learning, row);
  lines.push(
    "",
    "A green job or a saved artifact is not acceptance. Only `Checkpoint complete: yes` reports checkpoint completion. Knowledge reuse, guidance and exploration selection are not acceptance.",
  );
  if (summary.diagnostics.length > 0) {
    lines.push("", "## Diagnostics", "", ...summary.diagnostics.map((d) => `- ${d}`));
  }
  return `${lines.join("\n")}\n`;
}

/** The learning rows of a summary (T3.6 L4). */
function renderLearning(
  learning: Summary["learning"],
  row: (label: string, value: string) => void,
): void {
  if (learning === UNKNOWN) return row("Learning", "unknown");
  if (learning.mode === "none") return row("Learning", "none: the run does not learn");
  const counts = (c: { proposed: number; supported: number; rejected: number }): string =>
    `${c.supported} supported, ${c.rejected} rejected, ${c.proposed} proposed`;
  row(
    "Learning",
    `mode ${learning.mode}; ${
      learning.records === "unavailable"
        ? "learning records unavailable"
        : `knowledge ${counts(learning.records.knowledge)}; guidance ${counts(learning.records.guidance)}`
    }`,
  );
  for (const c of learning.contexts) {
    const omitted = Object.entries(c.omitted)
      .map(([reason, n]) => `${reason} ${n}`)
      .join(", ");
    row(
      `Learning context ${c.step}`,
      `attempt ${c.attempt} (${c.manifest}): knowledge ${c.knowledge.join(", ") || "none"}; guidance ${c.guidance.join(", ") || "none"}; omitted ${omitted || "none"}`,
    );
  }
  row(
    "Explorations",
    learning.explorations
      .map(
        (x) =>
          `${x.step} attempt ${x.attempt} round ${x.round}: ${x.trigger}; diagnoses ${x.diagnoses.join(", ") || "none"}; checks ${x.checks.join(", ") || "none"}; routing ${x.routing}`,
      )
      .join("; ") || "none",
  );
  row(
    "Challenges",
    learning.challenges.map((c) => `${c.step} attempt ${c.attempt}: ${c.verdict}`).join("; ") ||
      "none",
  );
  const u = learning.usage;
  row(
    "Learning usage",
    `${u.sessions} sessions, ${u.turns} turns, ${u.outputTokens} output tokens, ${u.reportedUsd.toFixed(4)} USD API-price equivalent reported, ${u.unknownSessions} of unknown cost; ${u.unresolved} unresolved, ${u.reservedUsd.toFixed(2)} USD reserved`,
  );
}
