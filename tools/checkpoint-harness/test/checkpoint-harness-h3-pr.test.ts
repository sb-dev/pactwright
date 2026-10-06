// T3.5 H3 acceptance (production readiness log §3 H3, H3-01–H3-15), offline.
// Each hosted job is a `job` call: it restores the saved state into a fresh
// directory under its own GitHub run and job, and its summary is checked
// against the state it saved. GitHub is in memory, agents are scripted and
// candidate commands run as local processes; real containment is the Docker
// integration test's and the hosted runs are the hosted proof's. Every
// semicolon case of the plan's table has its own assertion, with a valid
// control where a case is a refusal.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { type Assessment, type FeedbackSnapshot, type RoundRecord } from "../src/pull-requests.js";

import {
  BRANCH,
  Crash,
  dispatch,
  eventsOf,
  factsOf,
  inspectSaved,
  GOOD_GREETING,
  GREETING,
  H,
  job,
  OWNER,
  pendingOf,
  recordsOf,
  S01,
  S02,
  S03,
  S04,
  WELCOME,
  world,
} from "./h3-fixtures.js";

import { last, settle, toPublished, toS02, sequences, StaleView } from "./h3-scenarios.js";

const here = dirname(fileURLToPath(import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-pr-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// No world is shared between tests. Release its archives before the next case.
afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch);
});

describe("H3-13 pull-request correction rounds reuse the run", () => {
  it("initial publication and two rounds keep history, receipts, attempts and spending, and renew only affected evidence", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const pr = w.github.pulls.get(pull);
    assert.ok(pr?.draft);
    assert.match(pr.body, /pactwright-harness run=h3-test/);
    const published = w.github.branches.get(`harness/${w.run}`);
    const before = await factsOf(w);
    const s01Before = before.evidence.find((e) => e.step === S01)?.acceptance;
    const spentBefore = before.spending.reportedUsd;
    // Round 1: a submitted review with an actionable inline comment.
    const review = w.github.review(pull, OWNER, "[addressed] the stamp is right", [
      { path: GREETING, line: 1, body: "[actionable] cite the specification in a comment" },
    ]);
    const round1 = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      {
        actor: "github-actions[bot]",
      },
    );
    assert.deepEqual(
      round1.map((o) => o.kind),
      ["route", "controller", "effects"],
    );
    const fixed1 = w.github.branches.get(`harness/${w.run}`);
    assert.notEqual(fixed1, published);
    const facts1 = await factsOf(w);
    assert.equal(facts1.round?.complete, true);
    assert.equal(facts1.round?.fix?.commit, fixed1);
    assert.equal(
      facts1.evidence.find((e) => e.step === S01)?.acceptance,
      s01Before,
      "S01's evidence stays valid",
    );
    // Round 2: a manual round with a conversation comment.
    w.github.comment(pull, OWNER, "[declined] rename the greeting to salutation");
    const round2 = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.equal(last(round2).exit, 0);
    const facts2 = await factsOf(w);
    assert.equal(facts2.round?.round, 2);
    assert.equal(facts2.round?.complete, true);
    assert.deepEqual(
      facts2.round?.dispositions.map((d) => d.disposition),
      ["declined"],
    );
    // History, receipts, attempts and spending persist across the rounds.
    inspectSaved(w, (dir) => {
      const rounds = recordsOf<RoundRecord>(w, "pr-round", dir);
      assert.equal(rounds.length, 2);
      const s02Attempts = recordsOf<{ step: string; attempt: number }>(w, "evaluation", dir).filter(
        (e) => e.step === S02,
      );
      assert.ok(Math.max(...s02Attempts.map((e) => e.attempt)) >= 2);
      assert.ok(facts2.spending.reportedUsd > spentBefore);
      const pushes = recordsOf<{ key: string }>(w, "effect-receipt", dir).length;
      assert.ok(pushes >= 6);
      // One run throughout: one run-start, one manifest run identity.
      assert.equal(recordsOf(w, "run-start", dir).length, 1);
      assert.equal(new Set(eventsOf(w, dir).map((e) => e.run)).size, 1);
    });
  });

  it("a fixing commit or a reply alone does not restore acceptance", async () => {
    for (const humanFix of [false, true]) {
      const w = world(scratch);
      const pull = await toS02(w);
      w.github.comment(pull, OWNER, `[actionable] cite the specification in ${GREETING}`);
      // The assessment invalidates S02; a person pushes a fix and replies before the harness corrects it.
      const routed = await job(w, "route", { action: "address-comments", pr: String(pull) });
      assert.equal(routed.next, "controller");
      const assessed = await job(
        w,
        "controller",
        { action: "address-comments", pr: String(pull) },
        {
          started: Date.now() - 10 * 60 * 1000,
        },
      );
      assert.equal(assessed.next, "continue");
      assert.ok(!(await factsOf(w)).accepted.includes(S02), "the assessment invalidated S02");
      const human = humanFix
        ? w.github.pushHuman(`harness/${w.run}`, {
            [GREETING]: "// Greets as HOSTED §1 says.\n" + GOOD_GREETING,
          })
        : null;
      assert.ok(
        !(await factsOf(w)).accepted.includes(S02),
        "a fixing commit alone is not acceptance",
      );
      w.github.comment(pull, "someone", "Fixed it by hand.");
      assert.ok(!(await factsOf(w)).accepted.includes(S02), "a reply is not acceptance either");
      const resumed = await dispatch(w, { action: "continue" });
      if (human === null) {
        assert.equal(last(resumed).summary.outcome, "selection-accepted");
        assert.ok(
          (await factsOf(w)).accepted.includes(S02),
          "only the harness's own decision restored it",
        );
      } else {
        // A head moved during an open round is refused at publication (H3-15).
        assert.equal(last(resumed).summary.outcome, "paused", stringify(last(resumed).summary));
        assert.match(stringify(last(resumed).summary.pause), /moved/);
        assert.equal(
          w.github.branches.get(`harness/${w.run}`),
          human,
          "the human fix is not overwritten",
        );
        assert.equal((await factsOf(w)).round?.complete, false);
      }
    }
  });
});

describe("H3-14 one correction path for reviews and manual rounds", () => {
  it("a submitted review and a manual dispatch record the same kind of round; manual rounds read the conversation", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const review = w.github.review(pull, OWNER, "[addressed] fine");
    w.github.comment(pull, OWNER, "[addressed] also fine");
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      {
        actor: "github-actions[bot]",
      },
    );
    w.github.comment(pull, OWNER, "[declined] a different greeting");
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const [byReview, manual] = recordsOf<FeedbackSnapshot>(w, "pr-feedback");
    assert.deepEqual(byReview?.trigger, { kind: "review", actor: OWNER, review });
    assert.deepEqual(
      byReview?.items.map((i) => i.kind),
      ["review"],
    );
    assert.equal(manual?.trigger.kind, "manual");
    assert.deepEqual(manual?.items.map((i) => i.kind).sort(), ["comment", "comment"]);
  });

  it("duplicate triggers resume unfinished work or skip finished work; edited feedback is assessed again", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const comment = w.github.comment(pull, OWNER, "[addressed] fine");
    const routed = await job(w, "route", { action: "address-comments", pr: String(pull) });
    assert.equal(routed.next, "controller");
    // The same trigger again while the round is unfinished: it resumes, no second snapshot.
    const again = await job(w, "route", { action: "address-comments", pr: String(pull) });
    assert.equal(again.exit, 0);
    assert.equal(recordsOf(w, "pr-feedback").length, 1);
    await dispatch(w, { action: "continue" });
    const executions = w.github.executions.length;
    // Finished and unchanged: skipped, with no commit or reply.
    const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
    assert.equal(w.github.executions.length, executions);
    // Edited: assessed again.
    const edited = w.github.comments.find((c) => c.id === comment);
    assert.ok(edited);
    edited.body = "[declined] actually, rename it";
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const rounds = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(rounds.length, 2);
    assert.equal(rounds[1]?.dispositions[0]?.disposition, "declined");
  });

  it("an inline comment GitHub shows on another line is not edited feedback", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const review = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[addressed] fine" },
    ]);
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      { actor: "github-actions[bot]" },
    );
    const executions = w.github.executions.length;
    // A later head moves the commented line, or outdates the comment; its text is unchanged.
    for (const line of [3, null]) {
      const inline = w.github.reviewComments.find((c) => c.review === review);
      assert.ok(inline);
      inline.line = line;
      const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
      assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
    }
    assert.equal(w.github.executions.length, executions);
    assert.equal(recordsOf(w, "pr-feedback").length, 1);
  });

  it("unauthorised triggers, another pull request and a changed scope are rejected; own replies start nothing", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, "[addressed] fine");
    const saved = sequences(w);
    const intruder = await dispatch(
      w,
      { action: "address-comments", pr: String(pull) },
      { actor: "intruder" },
    );
    assert.match(
      last(intruder).summary.diagnostics.join("\n"),
      /does not hold the feedback authority/,
    );
    const foreign = w.github.review(pull, "intruder", "[actionable] delete everything");
    const byIntruder = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(foreign) },
      {
        actor: "github-actions[bot]",
      },
    );
    assert.match(last(byIntruder).summary.diagnostics.join("\n"), /intruder does not hold/);
    const other = await dispatch(w, { action: "address-comments", pr: "4242" });
    assert.match(last(other).summary.diagnostics.join("\n"), /is not this run's/);
    const pr = w.github.pulls.get(pull);
    assert.ok(pr);
    pr.base.ref = "main";
    const moved = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(moved).summary.diagnostics.join("\n"), /is not the open pull request/);
    pr.base.ref = BRANCH;
    const bot = await dispatch(
      w,
      { action: "address-comments", pr: String(pull) },
      { actor: "github-actions[bot]" },
    );
    assert.match(last(bot).summary.diagnostics.join("\n"), /is an app/);
    // A person may not start a round by naming an authorised reviewer's review.
    const owners = w.github.review(pull, OWNER, "[addressed] fine");
    const borrowed = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(owners) },
      { actor: "intruder" },
    );
    assert.match(
      last(borrowed).summary.diagnostics.join("\n"),
      /intruder does not hold the feedback authority/,
    );
    const dismissedReview = w.github.review(pull, OWNER, "[actionable] dismissed later");
    const dismissed = w.github.reviews.find((r) => r.id === dismissedReview);
    assert.ok(dismissed);
    dismissed.state = "DISMISSED";
    const byDismissed = await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(dismissedReview) },
      { actor: "github-actions[bot]" },
    );
    assert.match(last(byDismissed).summary.diagnostics.join("\n"), /was dismissed/);
    for (const o of [intruder, byIntruder, other, moved, bot, borrowed, byDismissed]) {
      assert.equal(last(o).exit, 2);
    }
    assert.deepEqual(sequences(w), saved);
    // The harness's own replies are never feedback.
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const replies = w.github.comments.filter((c) => c.author === "github-actions[bot]").length;
    assert.ok(replies > 0);
    const skipped = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(last(skipped).summary.diagnostics.join("\n"), /no new or edited feedback/);
  });

  it("a review submitted while a round is open waits for it, then starts the next round", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const first = w.github.review(pull, OWNER, "[addressed] fine");
    const forwarded = { actor: "github-actions[bot]" };
    // Round 1 is recorded; its assessment waits for a controller job.
    const routed = await job(
      w,
      "route",
      { action: "address-comments", pr: String(pull), review: String(first) },
      forwarded,
    );
    assert.equal(routed.next, "controller");
    const second = w.github.review(pull, OWNER, "[declined] rename it");
    const queued = await job(
      w,
      "route",
      { action: "address-comments", pr: String(pull), review: String(second) },
      forwarded,
    );
    assert.equal(queued.exit, 0);
    assert.deepEqual((await factsOf(w)).queued, [{ pull, review: second }]);
    // Round 1 completes, and its last job dispatches round 2 for the waiting review.
    let outcomes = await dispatch(w, { action: "continue" });
    for (
      let i = 0;
      i < 10 && last(outcomes).next === "continue" && !last(outcomes).dispatch?.review;
      i++
    ) {
      outcomes = await dispatch(w, { action: "continue" });
    }
    const next = last(outcomes);
    assert.deepEqual(
      [next.next, next.dispatch?.pr, next.dispatch?.review],
      ["continue", pull, second],
    );
    assert.match(next.summary.next, new RegExp(`address-comments for review ${second}`));
    await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(next.dispatch?.review) },
        forwarded,
      ),
    );
    const snapshots = recordsOf<FeedbackSnapshot>(w, "pr-feedback");
    assert.deepEqual(
      snapshots.map((f) => f.trigger.review),
      [first, second],
    );
    const facts = await factsOf(w);
    assert.deepEqual(facts.queued, []);
    assert.equal(facts.round?.complete, true);
    assert.deepEqual(
      facts.round?.dispositions.map((d) => d.disposition),
      ["declined"],
    );
  });

  it("each published head gets one explicitly dispatched review, which pushes alone would not start", async () => {
    const w = world(scratch);
    const review = (commit: string): object => ({
      workflow: "checkpoint-harness-verify.yml",
      ref: `harness/${w.run}`,
      commit,
      inputs: { live: "false" },
    });
    await toPublished(w);
    const initial = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.deepEqual(w.github.dispatches, [review(initial)], "the initial publication");
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    await settle(w, await dispatch(w, { action: "continue", through: S02 }));
    const first = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.deepEqual(w.github.dispatches, [review(initial), review(first)]);
    // A round that only replies publishes nothing new and dispatches nothing.
    w.github.comment(pull, OWNER, "[addressed] fine");
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    assert.equal(w.github.dispatches.length, 2);
    // A correction publishes a new head, and that head is dispatched for review.
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    const fixed = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.notEqual(fixed, first);
    assert.deepEqual(
      w.github.dispatches.map((d) => d.commit),
      [initial, first, fixed],
    );
    const receipts = recordsOf<{ key: string; receipt: { target: string } }>(w, "effect-receipt");
    assert.equal(
      receipts.filter((r) => r.receipt.target.includes("checkpoint-harness-verify.yml")).length,
      3,
    );
  });

  it("the complete CP01 template dispatches its review once for every published head", async () => {
    const root = join(here, "../../..");
    const cp01 = yaml.load(
      readFileSync(join(root, ".github/checkpoint-harness/cp01-t5.yml"), "utf8"),
    ) as { publication: { review?: { workflow: string; inputs?: Record<string, string> } } };
    const review = cp01.publication.review;
    assert.deepEqual(review, {
      workflow: "checkpoint-harness-verify.yml",
      inputs: { live: "false" },
    });
    // The workflow it names is dispatchable with exactly those inputs.
    const named = yaml.load(
      readFileSync(join(root, ".github/workflows", review.workflow), "utf8"),
    ) as {
      on: { workflow_dispatch?: { inputs?: Record<string, unknown> } };
    };
    for (const input of Object.keys(review.inputs ?? {})) {
      assert.ok(named.on.workflow_dispatch?.inputs?.[input], `${review.workflow} accepts ${input}`);
    }
    // CP01's publication settings, on the fixture: initial and corrected heads each get one review.
    const w = world(scratch, {
      edit: (t) =>
        t.replace(/^publication:\n(?:[ #].*\n)*/m, yaml.dump({ publication: cp01.publication })),
    });
    await toPublished(w);
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    await settle(w, await dispatch(w, { action: "continue", through: S02 }));
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    await settle(w, await dispatch(w, { action: "address-comments", pr: String(pull) }));
    const heads = recordsOf<{ receipt: { details?: { commit?: string } } }>(
      w,
      "effect-receipt",
    ).flatMap((r) =>
      typeof r.receipt.details?.commit === "string" ? [r.receipt.details.commit] : [],
    );
    assert.equal(new Set(heads).size, 3, "the initial, extended and corrected publications");
    assert.deepEqual(
      w.github.dispatches,
      [...new Set(heads)].map((commit) => ({
        workflow: review.workflow,
        ref: `harness/${w.run}`,
        commit,
        inputs: review.inputs,
      })),
    );
  });

  it("a follow-up comment in an inline thread is answered on the thread's first comment", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const opened = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[addressed] the greeting is fine" },
    ]);
    await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(opened) },
        { actor: "github-actions[bot]" },
      ),
    );
    const root = w.github.reviewComments.find((c) => c.review === opened);
    assert.ok(root);
    const followUp = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[declined] also rename it", inReplyTo: root.id },
    ]);
    const answered = await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(followUp) },
        { actor: "github-actions[bot]" },
      ),
    );
    assert.equal(last(answered).exit, 0, stringify(last(answered).summary));
    assert.equal((await factsOf(w)).round?.complete, true);
    const replies = w.github.reviewComments.filter((c) => c.author === "github-actions[bot]");
    assert.equal(replies.length, 2);
    assert.ok(
      replies.every((r) => r.inReplyTo === root.id),
      "both replies are on the thread's first comment",
    );
  });

  it("valid feedback is corrected; addressed, declined and blocked feedback get their disposition and reason", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    w.github.comment(pull, OWNER, "[addressed] the stamp is right");
    w.github.comment(pull, OWNER, "[declined] use Bonjour");
    w.github.comment(pull, OWNER, "[blocked] is this the release we want?");
    await dispatch(w, { action: "address-comments", pr: String(pull) });
    const facts = await factsOf(w);
    assert.deepEqual(
      facts.round?.dispositions.map((d) => d.disposition),
      ["actionable", "already-addressed", "declined", "blocked"],
    );
    assert.ok(facts.round?.dispositions.every((d) => d.reason.trim() !== ""));
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.match(
      execFileSync("git", ["show", `${head}:${GREETING}`], { cwd: w.repo.root, encoding: "utf8" }),
      /Greets as HOSTED §1 says/,
    );
    const bodies = w.github.comments
      .filter((c) => c.author === "github-actions[bot]")
      .map((c) => c.body);
    assert.equal(bodies.length, 4);
    assert.ok(bodies.some((b) => b.startsWith("**Corrected**") && b.includes(head)));
    assert.ok(bodies.some((b) => b.startsWith("**Blocked**")));
    assert.match(last(await dispatch(w, { action: "status" })).summary.next, /blocked feedback/);
  });

  it("a finding on an earlier output that the final step consumes is corrected by its owner, and every later step is renewed", async () => {
    const w = world(scratch, { registry: true });
    await toPublished(w);
    const extended = await settle(w, await dispatch(w, { action: "continue", through: S04 }));
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    assert.deepEqual((await factsOf(w)).accepted, [S01, S02, S03, S04]);
    const pull = w.github.pullOf(`harness/${w.run}`).number;
    // S04 consumes S01's greeting, so the greeting is protected from S04 and owned by S01.
    const review = w.github.review(pull, OWNER, "", [
      { path: GREETING, line: 1, body: "[actionable] cite the specification in a comment" },
    ]);
    const routed = await settle(
      w,
      await dispatch(
        w,
        { action: "address-comments", pr: String(pull), review: String(review) },
        { actor: "github-actions[bot]" },
      ),
    );
    const [assessment] = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(assessment?.dispositions[0]?.disposition, "actionable");
    assert.equal(assessment?.correction?.step, S01, "the owner of the greeting corrects it");
    // S01's corrected candidate is a new evaluation: its release is approved again.
    const pending = pendingOf(last(routed));
    await dispatch(w, { action: "approve", ...pending });
    const done = await settle(w, await dispatch(w, { action: "continue" }));
    assert.equal(last(done).summary.outcome, "selection-accepted", stringify(last(done).summary));
    const facts = await factsOf(w);
    assert.deepEqual(facts.accepted, [S01, S02, S03, S04]);
    assert.equal(facts.round?.complete, true);
    const events = eventsOf(w);
    const assessed = events.find((e) => e.action === "pr-assessment")?.seq ?? Infinity;
    for (const step of [S01, S02, S04]) {
      assert.ok(
        events.some((e) => e.action === "acceptance" && e.data.step === step && e.seq > assessed),
        `${step} is accepted again after the assessment`,
      );
    }
    // The published head carries the corrected greeting and the welcome built on it.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    const show = (path: string): string =>
      execFileSync("git", ["show", `${head}:${path}`], { cwd: w.repo.root, encoding: "utf8" });
    assert.match(show(GREETING), /Greets as HOSTED §1 says/);
    assert.match(show(WELCOME), /import \{ greet \} from "\.\/greeting\.mjs"/);
    const replies = w.github.reviewComments.filter((c) => c.author === "github-actions[bot]");
    assert.equal(replies.length, 1);
    assert.match(replies[0]?.body ?? "", /^\*\*Corrected\*\*/);
  });

  it("feedback that would change definitions, verifiers or the workflow is declined whatever the assessment", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const verifier = `${H}/hosted/verifiers/greet-judge.mjs`;
    w.github.review(pull, OWNER, "", [
      { path: verifier, line: 1, body: "[actionable] loosen the judge" },
    ]);
    const reviewId = w.github.reviews.at(-1)?.id ?? 0;
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(reviewId) },
      {
        actor: "github-actions[bot]",
      },
    );
    const [assessment] = recordsOf<Assessment>(w, "pr-assessment");
    assert.equal(assessment?.dispositions[0]?.disposition, "declined");
    assert.equal(assessment?.correction, null);
  });
});

describe("H3-15 rounds recover from runner loss and moved heads", () => {
  it("a runner lost after a correction push or a reply reconciles by read-back, never repeating it", async () => {
    for (const action of ["push-branch", "pr-reply"]) {
      const w = world(scratch);
      const pull = await toS02(w);
      w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
      const lost = await dispatch(w, {
        action: "address-comments",
        pr: String(pull),
        fault: `crash-after-effect:${action}`,
      });
      assert.ok(last(lost).error instanceof Crash, action);
      const facts = await factsOf(w);
      assert.equal(facts.round?.complete, false, "an unresolved effect is not claimed complete");
      const count = w.github.executions.filter((e) => e.action === action).length;
      await dispatch(w, { action: "continue" });
      assert.equal(w.github.executions.filter((e) => e.action === action).length, count, action);
      assert.equal((await factsOf(w)).round?.complete, true);
      assert.ok(recordsOf<{ reconciled: boolean }>(w, "effect-receipt").some((r) => r.reconciled));
    }
  });

  it("newer commits on the pull request are adopted, never lost; a diverged head pauses the round", async () => {
    const w = world(scratch);
    const pull = await toS02(w);
    const human = w.github.pushHuman(`harness/${w.run}`, {
      [`${H}/hosted/work/NOTES.md`]: "notes\n",
    });
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    const corrected = await settle(
      w,
      await dispatch(w, { action: "address-comments", pr: String(pull) }),
    );
    assert.equal(
      last(corrected).summary.outcome,
      "selection-accepted",
      stringify(last(corrected).summary),
    );
    const facts = await factsOf(w);
    assert.equal(facts.round?.complete, true);
    assert.ok(facts.accepted.includes(S02));
    // The fixing commit is published on top of the newer commit, which it keeps.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.notEqual(head, human);
    assert.equal(facts.round?.fix?.commit, head);
    assert.equal(
      execFileSync("git", ["rev-parse", `${head}^`], { cwd: w.repo.root, encoding: "utf8" }).trim(),
      human,
    );
    const show = (path: string): string =>
      execFileSync("git", ["show", `${head}:${path}`], { cwd: w.repo.root, encoding: "utf8" });
    assert.equal(show(`${H}/hosted/work/NOTES.md`), "notes\n");
    assert.match(show(GREETING), /Greets as HOSTED §1 says/);
    // A head that does not build on the published commit pauses the round.
    const v = world(scratch);
    const pull2 = await toS02(v);
    const pr = v.github.pulls.get(pull2);
    assert.ok(pr);
    pr.head.sha = v.repo.head;
    v.github.comment(pull2, OWNER, "[addressed] fine");
    const diverged = await dispatch(v, { action: "address-comments", pr: String(pull2) });
    assert.equal(last(diverged).exit, 2);
    assert.match(last(diverged).summary.diagnostics.join("\n"), /does not build on the published/);
  });

  it("missing state cannot start a correction run, and concurrent rounds cannot both own the run", async () => {
    const w = world(scratch, { run: "no-state" });
    const refused = await dispatch(w, { action: "address-comments", pr: "1" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /has no saved state/);
    const v = world(scratch);
    const pull = await toS02(v);
    v.github.comment(pull, OWNER, "[addressed] fine");
    const top = Math.max(...sequences(v));
    await job(v, "route", { action: "address-comments", pr: String(pull) });
    const stale = new StaleView(v.store, top + 1, 1);
    await assert.rejects(
      () =>
        job({ ...v, store: stale as unknown as typeof v.store }, "route", {
          action: "address-comments",
          pr: String(pull),
        }),
      /another controller owns the run/,
    );
  });

  it("budget exhaustion in a round pauses without resetting the limits", async () => {
    const w = world(scratch, { edit: (t) => t.replace("attempts: 4", "attempts: 1") });
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the spec in ${GREETING}`);
    const exhausted = await dispatch(w, { action: "address-comments", pr: String(pull) });
    assert.match(stringify(last(exhausted).summary.pause), /exhausted/);
    const attempts = recordsOf<{ step: string; attempt: number }>(w, "start").filter(
      (s) => s.step === S02,
    );
    const again = await dispatch(w, { action: "continue" });
    assert.match(stringify(last(again).summary.pause), /exhausted/);
    assert.deepEqual(
      recordsOf<{ step: string; attempt: number }>(w, "start").filter((s) => s.step === S02).length,
      attempts.length,
      "resuming adds no attempt",
    );
  });
});
