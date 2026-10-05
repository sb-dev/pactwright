// T3.5 H3: pull-request correction rounds (production readiness log §3 H3,
// requirements 11–14; Spec 00 §4). A round reuses the run that published the
// pull request: its feedback is snapshotted with IDs and content digests,
// assessed by a fresh read-only reviewer against the pinned requirements,
// corrected through the run's own correction loop, published to the same
// branch and answered item by item. This module holds the round's records and
// the rules that need no I/O; the runner drives them.

import stringify from "safe-stable-stringify";

import type { Finding, ReviewVerdict } from "./claude.js";
import { sha256 } from "./contracts.js";
import type { SourceSnapshot } from "./workspace.js";

/** What reads a pull request and its feedback; GitHub in a hosted job. */
export type FeedbackSource = {
  pull(number: number): Promise<PullRequest | null>;
  review(pull: number, id: number): Promise<Review | null>;
  reviews(pull: number): Promise<Review[]>;
  reviewComments(pull: number): Promise<ReviewComment[]>;
  comments(pull: number): Promise<IssueComment[]>;
  /** Whether `ancestor` is `commit` or one of its ancestors. */
  descends(ancestor: string, commit: string): Promise<boolean>;
  /** The paths that differ between two commits. */
  changed(from: string, to: string): Promise<string[]>;
};

export type PullRequest = {
  number: number;
  state: "open" | "closed";
  url: string;
  head: { ref: string; sha: string; repository: string | null };
  base: { ref: string };
};
export type Review = {
  id: number;
  author: string;
  state: string;
  body: string;
  url: string;
};
export type ReviewComment = {
  id: number;
  review: number | null;
  /** The thread's first comment, for a reply in an existing thread; null for the first. */
  inReplyTo: number | null;
  author: string;
  body: string;
  path: string;
  line: number | null;
  url: string;
};
export type IssueComment = { id: number; author: string; body: string; url: string };

/** One feedback item; its digest changes when its content is edited. */
export type FeedbackItem = {
  id: string;
  kind: "review" | "review-comment" | "comment";
  author: string;
  body: string;
  path: string | null;
  line: number | null;
  /** The review comment a reply goes under, for an inline item. */
  thread: number | null;
  url: string;
  digest: string;
};

/** A round's feedback snapshot, journaled as `pr-feedback`. */
export type FeedbackSnapshot = {
  round: number;
  pull: number;
  trigger: { kind: "review" | "manual"; actor: string; review: number | null };
  /** The pull request head when the round began, and its snapshot when newer commits were adopted. */
  head: { commit: string; adopted: SourceSnapshot | null };
  items: FeedbackItem[];
};

export type DispositionKind = "actionable" | "already-addressed" | "declined" | "blocked";

export type Disposition = {
  item: string;
  digest: string;
  disposition: DispositionKind;
  reason: string;
  finding: Finding | null;
};

/** A round's assessment, journaled as `pr-assessment`. */
export type Assessment = {
  round: number;
  /** The feedback snapshot assessed and the review that judged it. */
  feedback: string;
  review: string;
  dispositions: Disposition[];
  /**
   * The step whose next attempt corrects the round, where it starts and with
   * what findings; null when nothing needs correcting.
   */
  correction: {
    step: string;
    from: SourceSnapshot;
    findings: Finding[];
    adopt: boolean;
  } | null;
};

/** A completed round, journaled as `pr-round`. */
export type RoundRecord = {
  round: number;
  feedback: string;
  assessment: string;
  head: string | null;
  replies: string[];
};

/** Accounts GitHub marks as apps, such as the workflow token's `github-actions[bot]`. */
export const isBot = (login: string): boolean => login.endsWith("[bot]");

// The digest covers what an author can edit. An inline comment's line is
// where GitHub shows it on the current head, so it moves with later commits
// and is left out.
const itemDigest = (item: Omit<FeedbackItem, "digest">): string =>
  sha256(stringify({ body: item.body, path: item.path }) ?? "");

const item = (fields: Omit<FeedbackItem, "digest">): FeedbackItem => ({
  ...fields,
  digest: itemDigest(fields),
});

/**
 * The feedback of a round: a submitted review batches its body and inline
 * comments; a manual round also collects the conversation. Only authorised
 * authors count, and never the harness's own replies or another app.
 */
export function collect(
  input: {
    review: Review | null;
    reviews: readonly Review[];
    reviewComments: readonly ReviewComment[];
    comments: readonly IssueComment[];
  },
  authorised: (author: string) => boolean,
  ownMarker: string,
): FeedbackItem[] {
  const counts = (author: string, body: string): boolean =>
    authorised(author) && !isBot(author) && !body.includes(ownMarker) && body.trim() !== "";
  const reviews = input.review ? [input.review] : input.reviews;
  const inline = input.review
    ? input.reviewComments.filter((c) => c.review === input.review?.id)
    : input.reviewComments;
  return [
    ...reviews
      .filter((r) => counts(r.author, r.body))
      .map((r) =>
        item({
          id: `review:${r.id}`,
          kind: "review",
          author: r.author,
          body: r.body,
          path: null,
          line: null,
          thread: null,
          url: r.url,
        }),
      ),
    ...inline
      .filter((c) => counts(c.author, c.body))
      .map((c) =>
        item({
          id: `review-comment:${c.id}`,
          kind: "review-comment",
          author: c.author,
          body: c.body,
          path: c.path,
          line: c.line,
          // GitHub accepts replies only to a thread's first comment.
          thread: c.inReplyTo ?? c.id,
          url: c.url,
        }),
      ),
    ...(input.review ? [] : input.comments)
      .filter((c) => counts(c.author, c.body))
      .map((c) =>
        item({
          id: `comment:${c.id}`,
          kind: "comment",
          author: c.author,
          body: c.body,
          path: null,
          line: null,
          thread: null,
          url: c.url,
        }),
      ),
  ];
}

const PREFIXES: Record<string, DispositionKind> = {
  "already-addressed:": "already-addressed",
  "declined:": "declined",
};

/**
 * Each item's disposition from a complete verdict, or the reasons the verdict
 * cannot be read as one, so the assessment runs again. A finding the
 * controller must decline — one located in definitions, protected or verifier
 * paths, the workflow or the configuration — is declined whatever the verdict
 * says: feedback cannot amend them.
 */
export function dispositionsOf(
  verdict: ReviewVerdict,
  items: readonly FeedbackItem[],
  forbidden: (path: string) => boolean,
): { ok: true; dispositions: Disposition[] } | { ok: false; issues: string[] } {
  if (verdict.verdict === "blocked") {
    const reason = verdict.blockers.join("; ");
    return {
      ok: true,
      dispositions: items.map((i) => ({
        item: i.id,
        digest: i.digest,
        disposition: "blocked",
        reason,
        finding: null,
      })),
    };
  }
  const issues: string[] = [];
  const dispositions = items.map((i): Disposition => {
    const base = { item: i.id, digest: i.digest };
    const entry = verdict.coverage.find((c) => c.subject === i.id);
    if (!entry) {
      issues.push(`${i.id} has no coverage entry`);
      return { ...base, disposition: "blocked", reason: "not judged", finding: null };
    }
    if (entry.result === "not-assessed") {
      return { ...base, disposition: "blocked", reason: entry.note, finding: null };
    }
    if (entry.result === "satisfied") {
      const prefix = Object.keys(PREFIXES).find((p) => entry.note.trim().startsWith(p));
      if (!prefix) {
        issues.push(`${i.id} is satisfied without an already-addressed: or declined: note`);
        return { ...base, disposition: "blocked", reason: entry.note, finding: null };
      }
      return {
        ...base,
        disposition: PREFIXES[prefix] ?? "blocked",
        reason: entry.note.trim().slice(prefix.length).trim(),
        finding: null,
      };
    }
    const found = verdict.findings.find((f) => f.severity === "blocking" && f.rule === i.id);
    const finding: Finding = found
      ? { rule: i.id, location: found.location, defect: found.defect, correction: found.correction }
      : {
          rule: i.id,
          location: i.path ?? "pull request",
          defect: entry.note || "the feedback is not yet met",
          correction: `address the feedback: ${i.body.slice(0, 500)}`,
        };
    const path = (finding.location.split(":")[0] ?? "").trim();
    const touched = [path, i.path ?? ""].filter((p) => p !== "" && forbidden(p));
    if (touched.length > 0) {
      return {
        ...base,
        disposition: "declined",
        reason: `the change would alter ${touched.join(", ")}, which feedback cannot amend: definitions, scope, verifiers, the workflow and authority stay as approved`,
        finding: null,
      };
    }
    return { ...base, disposition: "actionable", reason: finding.defect, finding };
  });
  return issues.length > 0 ? { ok: false, issues } : { ok: true, dispositions };
}

const LABELS: Record<DispositionKind, string> = {
  actionable: "Corrected",
  "already-addressed": "Already addressed",
  declined: "Declined",
  blocked: "Blocked",
};

/**
 * The reply to one item: its disposition and reason, and for a corrected item
 * the fixing commit and the checks that accepted it. The reply is not
 * acceptance, and says so.
 */
export function replyBody(
  item: FeedbackItem,
  disposition: Disposition,
  fix: { commit: string; checks: string } | null,
): string {
  const lines = [
    `**${LABELS[disposition.disposition]}** — ${disposition.reason || "no reason recorded"}`,
    "",
    `Feedback: ${item.url}`,
  ];
  if (disposition.disposition === "actionable" && fix) {
    lines.push(`Fixing commit: ${fix.commit}`, `Checks: ${fix.checks}`);
  }
  lines.push(
    "",
    "Recorded by the checkpoint harness. A reply or commit is not acceptance; the reviewer resolves the thread.",
  );
  return lines.join("\n");
}
