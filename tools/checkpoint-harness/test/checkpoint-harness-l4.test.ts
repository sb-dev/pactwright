// T3.6 L4 tests (evidence-backed learning log §3 T3.6-L4): the fixture
// faults and injected attempts the hosted proof uses, refused outside a
// fixture; the hosted learning run rehearsed in process through the hosted
// job path, with every proof assertion of `l4-proof.ts` on its saved state
// and a fault for each assertion; and the learning field of the operator
// summary, derived again from the records. The hosted proof itself runs the
// same assertions over the real run's saved state
// (test/hosted/checkpoint-harness-l4-proof.test.ts); this rehearsal is not
// that evidence.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";

import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { readEvidence, readRun } from "../src/evidence.js";
import { injectedSources, INJECTED_HEADER, type Injection } from "../src/fixture.js";
import { checkSummary, FIELDS, renderSummary, type Summary } from "../src/summary.js";
import { checkTemplate, parseInputs, savedFault } from "../src/workflow.js";
import { dispatch, git, savedDir, type World } from "./h3-fixtures.js";
import { last, settle } from "./h3-scenarios.js";
import {
  EFFECT_FAULT,
  FAULTS,
  authority,
  boundaries,
  challenge,
  exploration,
  guidance,
  injected,
  knowledgeReuse,
  manifests,
  noReplay,
  oneRun,
  proveAll,
  reservations,
  rounds,
  type ProofState,
} from "./l4-proof.js";
import {
  INJECTED,
  L,
  NORMALIZE,
  OWNER,
  R01,
  S01,
  S02,
  START,
  TEMPLATE,
  learningWorld,
} from "./l4-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l4-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const MINIMUM = { jobs: 12, runs: 12 };
const STEPS = { corrected: S02, unchanged: S01 };

/** The record an event journals. */
const refOf = (e: ProofState["events"][number]): string =>
  typeof e.data.record === "string" ? e.data.record : (e.evidence[0] ?? "");

/** The run's latest saved state as the proof reads it. */
function stateOf(w: World): ProofState {
  const dir = savedDir(w);
  const read = readRun(dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return {
    dir,
    events: read.records.events,
    read: (ref) => JSON.parse(readEvidence(dir, ref).toString("utf8")) as unknown,
  };
}

/** Commits a changed L4 template on the world's branch and returns the new commit. */
function commitTemplate(w: World, edit: (t: string) => string): string {
  const file = join(w.repo.root, `.github/checkpoint-harness/${TEMPLATE}`);
  writeFileSync(file, edit(readFileSync(file, "utf8")));
  git(w.repo.root, ["add", "-A"]);
  git(w.repo.root, ["commit", "-q", "--no-gpg-sign", "-m", "template"]);
  return git(w.repo.root, ["rev-parse", "HEAD"]);
}

type Outcomes = Awaited<ReturnType<typeof dispatch>>;
const crashed = (o: Outcomes): boolean => o.some((x) => x.error !== undefined);

/**
 * The hosted operator sequence of the L4 proof (§5 of the L4 plan): each
 * learning boundary armed in its own dispatch, publication, a forwarded
 * review and a manual round with a lost reply.
 */
async function hostedSequence(w: World): Promise<{ dispatches: Outcomes[]; status: Summary }> {
  const dispatches: Outcomes[] = [];
  for (const [i, fault] of FAULTS.entries()) {
    const out = await dispatch(w, i === 0 ? { ...START, fault } : { action: "continue", fault });
    assert.ok(crashed(out), `${fault} ended a job`);
    dispatches.push(out);
  }
  const published = await settle(w, await dispatch(w, { action: "continue" }));
  assert.equal(last(published).summary.outcome, "selection-accepted");
  dispatches.push(published);
  const pull = w.github.pullOf(`harness/${w.run}`).number;
  const review = w.github.review(pull, OWNER, "[declined] rename normalize to clean", [
    { path: NORMALIZE, line: 1, body: "[actionable] cite the specification in a comment" },
  ]);
  // A submitted review is forwarded by the workflow's own token.
  dispatches.push(
    await dispatch(
      w,
      { action: "address-comments", pr: String(pull), review: String(review) },
      { actor: "github-actions[bot]" },
    ),
  );
  w.github.comment(pull, OWNER, "[actionable] cite the specification once more");
  w.github.comment(pull, OWNER, "[declined] skip the verifier for speed");
  const lost = await dispatch(w, {
    action: "address-comments",
    pr: String(pull),
    fault: EFFECT_FAULT,
  });
  assert.ok(crashed(lost), `${EFFECT_FAULT} ended a job`);
  dispatches.push(lost);
  dispatches.push(await settle(w, await dispatch(w, { action: "continue" })));
  const status = last(await dispatch(w, { action: "status" })).summary;
  return { dispatches, status };
}

describe("T3.6 L4 fixture faults and injected attempts", () => {
  it("accepts crash-after-save faults beside the effect faults and refuses malformed ones", () => {
    for (const fault of [...FAULTS, EFFECT_FAULT, "crash-after-intent", "crash-after-save:start"]) {
      const parsed = parseInputs({ action: "continue", run: "l4-test", fault });
      assert.ok(parsed.ok, fault);
    }
    for (const fault of [
      "crash-after-save",
      "crash-after-save:",
      "crash-after-save:A",
      "crash-after-save:start:diagnose:x",
    ]) {
      const parsed = parseInputs({ action: "continue", run: "l4-test", fault });
      assert.ok(!parsed.ok, fault);
    }
    const matches = savedFault("crash-after-save:agent-invocation:diagnostic-approach");
    assert.ok(matches);
    const event = (action: string, data: Record<string, string>) =>
      ({ action, data }) as unknown as Parameters<typeof matches>[0];
    assert.ok(matches(event("agent-invocation", { purpose: "diagnostic-approach" })));
    assert.ok(!matches(event("agent-invocation", { purpose: "diagnostic-alternative" })));
    assert.ok(!matches(event("review", { kind: "diagnostic-approach" })));
    assert.equal(savedFault("crash-after-effect:pr-reply"), null);
  });

  it("refuses an injected source without its header, an unreadable one and a repeated attempt", () => {
    const at = (attempt: number, source: string): Injection => ({
      step: S02,
      attempt,
      files: { [NORMALIZE]: source },
      outputs: { normalizer: [NORMALIZE] },
    });
    const files: Record<string, string> = {
      good: `${INJECTED_HEADER}\nexport const x = 1;\n`,
      plain: "export const x = 1;\n",
    };
    const read = (source: string): string => {
      const text = files[source];
      if (text === undefined) throw new Error(`${source}: no such file`);
      return text;
    };
    assert.ok(injectedSources([at(1, "good")], read).ok, "control");
    const refused = (injections: Injection[], reason: RegExp): void => {
      const got = injectedSources(injections, read);
      assert.ok(!got.ok);
      assert.match(got.diagnostics.join("\n"), reason);
    };
    refused([at(1, "plain")], /does not start with/);
    refused([at(1, "missing")], /cannot be read/);
    refused([at(1, "good"), at(1, "good")], /more than once/);
  });

  it("starts nothing from a template whose injection lacks job.faults or its header", async () => {
    const noFaults = learningWorld(scratch, { edit: (t) => t.replace("  faults: true\n", "") });
    const a = last(await dispatch(noFaults, START));
    assert.equal(a.exit, 2);
    assert.match(a.summary.diagnostics.join("\n"), /faults/);
    assert.equal(noFaults.store.states.length, 0);
    const unlabelled = learningWorld(scratch, {
      edit: (t) => t.replace(`${L}/injected/attempt-1.mjs`, `${L}/README.md`),
    });
    const b = last(await dispatch(unlabelled, START));
    assert.equal(b.exit, 2);
    assert.match(b.summary.diagnostics.join("\n"), /does not start with/);
    assert.equal(unlabelled.store.states.length, 0);
    // A fault needs a template that allows faults at all.
    const plain = learningWorld(scratch, { edit: (t) => t.replace(/^job:\n(?:[ #].*\n)*/m, "") });
    const c = last(await dispatch(plain, { ...START, fault: FAULTS[0] }));
    assert.equal(c.exit, 2);
    assert.match(c.summary.diagnostics.join("\n"), /job.faults: true/);
    assert.equal(plain.store.states.length, 0);
  });

  it("never amends a run into or out of a fixture; other job limits stay amendable", async () => {
    const plain = learningWorld(scratch, { edit: (t) => t.replace(/^job:\n(?:[ #].*\n)*/m, "") });
    const first = await dispatch(plain, START);
    assert.equal(last(first).summary.outcome, "selection-accepted");
    const into = commitTemplate(plain, (t) => `${t}job:\n  faults: true\n`);
    const refused = last(
      await dispatch(plain, {
        action: "amend",
        config_revision: into,
        reason: "make it a fixture",
      }),
    );
    assert.equal(refused.exit, 2);
    assert.match(refused.summary.diagnostics.join("\n"), /\/job cannot be amended/);
    const control = commitTemplate(plain, (t) =>
      t.replace("job:\n  faults: true\n", "job:\n  yield_after_seconds: 600\n"),
    );
    const amended = last(
      await dispatch(plain, { action: "amend", config_revision: control, reason: "a job limit" }),
    );
    assert.equal(amended.exit, 0, stringify(amended.summary.diagnostics));
    const fixture = learningWorld(scratch);
    await settle(fixture, await dispatch(fixture, START));
    const fewer = commitTemplate(fixture, (t) =>
      t.replace(/ {4}- step: CP94-S02\n {6}attempt: 3\n(?: {6,}.*\n)*/, ""),
    );
    const changed = last(
      await dispatch(fixture, { action: "amend", config_revision: fewer, reason: "inject less" }),
    );
    assert.equal(changed.exit, 2);
    assert.match(changed.summary.diagnostics.join("\n"), /\/job\/inject.* cannot be amended/);
  });
});

describe("T3.6 L4-01 and L4-02 hosted learning run, rehearsed in process", () => {
  let w: World;
  let state: ProofState;
  let status: Summary;
  let dispatches: Outcomes[];

  before(async () => {
    w = learningWorld(scratch);
    ({ dispatches, status } = await hostedSequence(w));
    state = stateOf(w);
  });

  it("proves every L4 assertion on the run's saved state", () => {
    proveAll(state, { minimum: MINIMUM, steps: STEPS });
    // Every job that was not lost reported a summary its saved state agrees with (`job` checks it).
    assert.ok(
      dispatches
        .flat()
        .filter((o) => !o.error)
        .every((o) => o.summary.outcome !== "refused"),
    );
  });

  it("fails each assertion on its own fault", () => {
    const events = state.events;
    const override = (refs: Record<string, unknown>): ProofState => ({
      ...state,
      read: (ref) => (ref in refs ? refs[ref] : state.read(ref)),
    });
    const withEvents = (next: ProofState["events"]): ProofState => ({ ...state, events: next });
    const first = (action: string, data: Record<string, unknown> = {}) => {
      const found = events.find(
        (e) => e.action === action && Object.entries(data).every(([k, v]) => e.data[k] === v),
      );
      assert.ok(found, action);
      return found;
    };
    const fails = (name: string, check: () => void): void =>
      assert.throws(check, assert.AssertionError, `${name} fails on its fault`);
    // 1. A second run-start.
    fails("oneRun", () => oneRun(withEvents([...events, first("run-start")]), MINIMUM));
    // 2. The lost diagnosis runner released the run instead.
    const lostStart = events.find(
      (e, i) =>
        e.action === "start" && e.data.phase === "diagnose" && events[i + 1]?.action === "owner",
    );
    assert.ok(lostStart);
    fails("boundaries", () =>
      boundaries(
        withEvents(
          events.flatMap((e) =>
            e === lostStart ? [e, { ...e, seq: e.seq + 0.5, action: "released", data: {} }] : [e],
          ),
        ),
      ),
    );
    // 3. A completed diagnosis replayed.
    const diagnosis = first("agent-invocation", { purpose: "diagnostic-approach" });
    fails("noReplay", () =>
      noReplay(
        withEvents(
          events.flatMap((e) =>
            e === diagnosis
              ? [e, { ...lostStart, seq: e.seq + 0.25 }, { ...e, seq: e.seq + 0.5 }]
              : [e],
          ),
        ),
      ),
    );
    // 4. A lost session's reservation dropped.
    const lostRef = refOf(lostStart);
    fails("reservations", () =>
      reservations(override({ [lostRef]: { ...(state.read(lostRef) as object), allowance: 0 } })),
    );
    // 5. A frozen context that is not the one its evaluation names.
    const produced = events.filter((e) => e.action === "start" && e.data.phase === "produce");
    const withContext = produced
      .map((e) => ({
        e,
        start: state.read(refOf(e)) as { production: { context?: { knowledge: unknown[] } } },
      }))
      .find((x) => (x.start.production.context?.knowledge.length ?? 0) > 0);
    assert.ok(withContext);
    const context = withContext.start.production.context;
    assert.ok(context);
    fails("manifests", () =>
      manifests(
        override({
          [refOf(withContext.e)]: {
            ...withContext.start,
            production: { ...withContext.start.production, context: { ...context, asOf: 1 } },
          },
        }),
      ),
    );
    // 6. No attempt consumed any knowledge.
    const emptied = Object.fromEntries(
      produced.map((e) => {
        const start = state.read(refOf(e)) as { production: { context?: Record<string, unknown> } };
        return [
          refOf(e),
          start.production.context
            ? {
                ...start,
                production: {
                  ...start.production,
                  context: { ...start.production.context, knowledge: [] },
                },
              }
            : start,
        ];
      }),
    );
    fails("knowledgeReuse", () => knowledgeReuse(override(emptied)));
    // 7. The reminder cites one attempt only.
    const admission = first("guidance-admission");
    const proposalRef = admission.evidence[1] ?? "";
    const proposal = state.read(proposalRef) as { occurrences: unknown[] };
    fails("guidance", () =>
      guidance(
        override({ [proposalRef]: { ...proposal, occurrences: proposal.occurrences.slice(0, 1) } }),
      ),
    );
    // 8. The routing selected nothing.
    const routing = first("exploration-routing");
    fails("exploration", () =>
      exploration(
        override({
          [refOf(routing)]: { ...(state.read(refOf(routing)) as object), outcome: "blocked" },
        }),
      ),
    );
    // 9. The explored acceptance did not count its challenge.
    const challengeRef = refOf(first("review", { kind: "challenge", outcome: "reviewed" }));
    const accepted = events.filter((e) => e.action === "acceptance");
    fails("challenge", () =>
      challenge(
        override(
          Object.fromEntries(
            accepted.map((e) => {
              const d = state.read(refOf(e)) as { evidence: string[] };
              return [refOf(e), { ...d, evidence: d.evidence.filter((r) => r !== challengeRef) }];
            }),
          ),
        ),
      ),
    );
    // 10. The second round never completed.
    const round2 = events.filter((e) => e.action === "pr-round").at(-1);
    fails("rounds", () => rounds(withEvents(events.filter((e) => e !== round2)), STEPS));
    // 11. A proposer reviewed its own proposal.
    const knowledge = first("knowledge-admission");
    const k = state.read(refOf(knowledge)) as { proposal: string };
    const proposer = (state.read(k.proposal) as { proposer: string }).proposer;
    fails("authority", () =>
      authority(override({ [refOf(knowledge)]: { ...k, review: proposer } })),
    );
    // 12. An injected attempt passed off as a model's session.
    const injectedRun = events.find(
      (e) =>
        e.action === "agent-invocation" &&
        e.data.role === "producer" &&
        e.data.step === S02 &&
        e.attempt === 1,
    );
    assert.ok(injectedRun);
    const outcome = state.read(refOf(injectedRun)) as { observation: Record<string, unknown> };
    const unlabelled = { ...outcome.observation };
    delete unlabelled.fixture;
    fails("injected", () =>
      injected(override({ [refOf(injectedRun)]: { ...outcome, observation: unlabelled } })),
    );
  });

  it("reports the learning facts the records hold, and fails on a falsified one", () => {
    assert.ok(status.learning !== "unknown" && status.learning.mode === "phases");
    const learning = status.learning;
    const count = (action: string, disposition: string): number =>
      state.events.filter((e) => e.action === action && e.data.disposition === disposition).length;
    assert.deepEqual(learning.records, {
      knowledge: { proposed: 0, supported: count("knowledge-admission", "supported"), rejected: 0 },
      guidance: { proposed: 0, supported: count("guidance-admission", "supported"), rejected: 0 },
    });
    const latest = learning.contexts.find((c) => c.step === S02);
    assert.ok(latest);
    assert.equal(
      latest.attempt,
      Math.max(
        ...state.events
          .filter((e) => e.action === "start" && e.data.phase === "produce" && e.data.step === S02)
          .map((e) => e.attempt ?? 0),
      ),
    );
    assert.equal(latest.guidance.length, 1, "the reminder guides the last round's attempt");
    assert.ok((latest.omitted.historical ?? 0) > 0, "earlier knowledge is historical there");
    assert.deepEqual(
      learning.explorations.map((x) => [x.trigger, x.routing, x.diagnoses]),
      [[`repeated on ${R01}`, "selected", ["approach: diagnosed", "alternative: diagnosed"]]],
    );
    assert.deepEqual(learning.challenges, [{ step: S02, attempt: 4, verdict: "pass" }]);
    const lostLearning = state.events.filter(
      (e, i) =>
        e.action === "start" &&
        ["support", "diagnose", "challenge"].includes(String(e.data.phase)) &&
        state.events[i + 1]?.action === "owner",
    );
    assert.equal(learning.usage.unresolved, lostLearning.length);
    assert.equal(learning.usage.unresolved, 3);
    // Injected attempts are not learning sessions and report no usage.
    assert.ok(learning.usage.sessions > 0 && learning.usage.unknownSessions === 0);
    const rendered = renderSummary(status);
    assert.match(
      rendered,
      /Knowledge reuse, guidance and exploration selection are not acceptance/,
    );
    assert.match(rendered, /\| Learning \| mode phases;/);
    // Falsified learning facts fail on the learning field alone.
    for (const wrong of [
      { ...learning, records: "unavailable" as const },
      { ...learning, challenges: [] },
      { ...learning, usage: { ...learning.usage, unresolved: 0 } },
      { mode: "none" as const },
    ]) {
      assert.deepEqual(
        checkSummary({ ...status, learning: wrong }, status).map((m) => m.field),
        ["learning"],
      );
    }
    assert.ok(FIELDS.includes("learning"));
  });

  it("injects exactly the template's attempts and labels each one", () => {
    const producers = state.events.filter(
      (e) => e.action === "agent-invocation" && e.data.role === "producer" && e.data.step === S02,
    );
    const labelled = producers
      .filter((e) => {
        const ref = typeof e.data.record === "string" ? e.data.record : "";
        return (
          (state.read(ref) as { observation: { fixture?: string } }).observation.fixture !==
          undefined
        );
      })
      .map((e) => e.attempt);
    assert.deepEqual(labelled, INJECTED);
    // Each injected attempt failed its verification and review, and was corrected, never accepted.
    const decided = (attempt: number): string[] =>
      state.events
        .filter((e) => e.action === "decision" || e.action === "acceptance")
        .filter((e) => {
          const d = state.read(refOf(e)) as {
            step: string;
            attempt: number;
          };
          return d.step === S02 && d.attempt === attempt;
        })
        .map((e) => e.action);
    for (const attempt of INJECTED)
      assert.deepEqual(decided(attempt), ["decision"], `attempt ${attempt}`);
  });
});

describe("T3.6 L4 T5 template settings", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const file = ".github/checkpoint-harness/cp01-t5.yml";

  it("keeps learning off in the T5 template, with its reserved settings valid there", async () => {
    const text = readFileSync(join(root, file), "utf8");
    const template = yaml.load(text) as Record<string, unknown> & { job?: Record<string, unknown> };
    assert.equal(template.learning, undefined, "learning is not adopted");
    assert.equal(template.job?.faults, undefined, "no fixture faults");
    assert.equal(template.job?.inject, undefined, "no injected attempts");
    const block = /^# BEGIN learning \(not adopted\)\n((?:#.*\n)*?)# END learning$/m.exec(text);
    assert.ok(block?.[1], "the reserved block is present");
    // The commented settings start at their `# learning:` line.
    const lines = block[1].split("\n");
    const settings = yaml.load(
      lines
        .slice(lines.findIndex((l) => l === "# learning:"))
        .filter((l) => l.startsWith("# "))
        .map((l) => l.slice(2))
        .join("\n"),
    ) as { learning?: unknown };
    assert.ok(settings.learning, "the block holds learning settings");
    const head = git(root, ["rev-parse", "HEAD"]);
    const skills = join(root, ".claude/skills");
    assert.deepEqual(
      await checkTemplate(root, skills, file, template, head),
      [],
      "control: the template as committed",
    );
    assert.deepEqual(
      await checkTemplate(root, skills, file, { ...template, learning: settings.learning }, head),
      [],
      "the reserved settings validate against the T5 template",
    );
    const invalid = {
      ...template,
      learning: { ...(settings.learning as object), reminder_chars: 0 },
    };
    assert.notDeepEqual(
      await checkTemplate(root, skills, file, invalid, head),
      [],
      "an invalid setting fails",
    );
  });
});
