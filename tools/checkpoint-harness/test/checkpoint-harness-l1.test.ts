// T3.6 L1 acceptance (evidence-backed learning log §3 T3.6-L1, §§2.1–2.2):
// knowledge records and views over a real CP97 run whose first library
// attempt fails one boundary target and is corrected. The runner, verifier
// records, journal, evidence and portable state are the harness's own;
// proposer and reviewer sessions are recorded fixture outcomes. Every
// refusal has its own asserted reason beside a valid control built the same
// way, and every refused admission had a reviewer that agreed.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  chmodSync,
  cpSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import type { AgentOutcome, Submission } from "../src/claude.js";
import { sha256 } from "../src/contracts.js";
import {
  appendEvent,
  putEvidence,
  readRun,
  type EvaluationManifest,
  type RunHandle,
} from "../src/evidence.js";
import {
  admitKnowledge,
  applicability,
  entryId,
  knowledgeView,
  proposeKnowledge,
  type KnowledgeAdmission,
  type KnowledgeProposal,
  type KnowledgeTarget,
  type KnowledgeView,
} from "../src/knowledge.js";
import { packState, unpackState } from "../src/state.js";
import {
  decideAcceptance,
  journalInput,
  targetKey,
  type Decision,
  type Invocation,
  type ReviewRecord,
  type Stored,
} from "../src/verification.js";
import type { WritePolicy } from "../src/workspace.js";
import { bootstrapRegistry, LIBRARY } from "./bootstrap-fixtures.js";
import {
  BOUNDARY,
  candidateReview,
  committed,
  CONTROLLER,
  evaluationOf,
  fullScope,
  invocationFor,
  journalInvocation,
  journalRecord,
  learningRun,
  LIBRARY_FILES,
  passedTarget,
  proposal,
  proposeAndAdmit,
  proposerSession,
  recordSession,
  reopen,
  reviewSession,
  sessionObservation,
  supportingVerdict,
  targetOf,
  type LearningRun,
} from "./knowledge-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l1-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let w: LearningRun;
before(async () => {
  w = await learningRun(scratch);
});

const view = (dir: string): KnowledgeView => {
  const built = knowledgeView(dir, CONTROLLER);
  assert.ok(built.ok, built.ok ? "" : built.diagnostics.join("\n"));
  return built.value;
};

const manifestOf = (dir: string, attempt: number) => evaluationOf(dir, attempt).record.manifest;

/** A positive executed claim about a target the failed first attempt passed: the valid control. */
function fragment(run: RunHandle, fields: Partial<KnowledgeProposal> = {}): KnowledgeProposal {
  const target = passedTarget(run.dir);
  return proposal(run, {
    attempt: 1,
    claim: {
      assertion: "The first attempt's parser accepts this well-formed configuration case.",
      target,
      kind: "positive",
    },
    observations: [{ ref: invocationFor(run.dir, 1, target).ref, basis: "executed" }],
    ...fields,
  });
}

/** The first attempt's executed boundary failure, as a counterexample at its candidate. */
function counterexample(
  run: RunHandle,
  fields: Partial<KnowledgeProposal> = {},
): KnowledgeProposal {
  return proposal(run, {
    attempt: 1,
    claim: {
      assertion: "The first attempt's parser accepts a port above the highest valid port.",
      target: BOUNDARY,
      kind: "counterexample",
    },
    observations: [{ ref: invocationFor(run.dir, 1, BOUNDARY).ref, basis: "executed" }],
    ...fields,
  });
}

function supported(admission: Stored<KnowledgeAdmission>, basis: "inspected" | "executed"): void {
  const { disposition, reasons } = admission.record;
  assert.deepEqual([disposition, admission.record.basis, reasons], ["supported", basis, []]);
}

/** Rejected for exactly the expected reasons, in order: each case's only defects. */
function rejected(admission: Stored<KnowledgeAdmission>, ...expected: RegExp[]): void {
  const { disposition, basis, reasons } = admission.record;
  assert.deepEqual([disposition, basis], ["rejected", null], stringify(reasons));
  assert.equal(reasons.length, expected.length, stringify(reasons, null, 2));
  expected.forEach((reason, i) => assert.match(reasons[i] ?? "", reason));
}

const producerOf = (dir: string, attempt: number) => {
  const [found] = committed<AgentOutcome>(
    dir,
    "agent-invocation",
    (f) => f.record.observation.role === "producer" && f.event.attempt === attempt,
  );
  assert.ok(found, `attempt ${attempt} has a producer invocation`);
  return found;
};

const segmentOf = (run: RunHandle, suffix: "jsonl" | "head"): string =>
  join(run.dir, "journal", `${String(run.epoch).padStart(6, "0")}.${suffix}`);

const copyOf = (dir: string): string => {
  const copy = join(w.scratch, randomUUID());
  cpSync(dir, copy, { recursive: true });
  return copy;
};

describe("T3.6 L1-01 knowledge admission", () => {
  it("supports an independently reviewed claim on its actual basis, never upgrading inspection", async () => {
    const run = await reopen(w);
    supported(proposeAndAdmit(run, fragment(run)), "executed");

    const review = candidateReview(run.dir, 1);
    const inspected = proposeAndAdmit(
      run,
      fragment(run, {
        claim: {
          assertion: "The first attempt's declarations file types parseConfig's result.",
          target: `${LIBRARY}/R01`,
          kind: "positive",
        },
        observations: [{ ref: review.ref, basis: "inspected" }],
      }),
    );
    supported(inspected, "inspected");

    // A reviewer that calls its assessment executed does not upgrade an inspection.
    const target = passedTarget(run.dir);
    const executed = invocationFor(run.dir, 1, target).ref;
    supported(
      proposeAndAdmit(
        run,
        fragment(run, {
          claim: {
            assertion: "Inspection: this case is parsed as configured.",
            target,
            kind: "positive",
          },
          observations: [{ ref: review.ref, basis: "inspected" }],
        }),
        (s) =>
          reviewSession(run, s, {
            verdict: supportingVerdict(entryId(s.record), { basis: "executed" }),
          }),
      ),
      "inspected",
    );

    // Mixed evidence is supported on its executed observation; each keeps its own basis.
    const mixed = proposeAndAdmit(
      run,
      fragment(run, {
        claim: { assertion: "Mixed: this case is parsed as configured.", target, kind: "positive" },
        observations: [
          { ref: review.ref, basis: "inspected" },
          { ref: executed, basis: "executed" },
          { ref: producerOf(run.dir, 1).ref, basis: "reported" },
        ],
      }),
    );
    supported(mixed, "executed");
    const entry = view(run.dir).entries.find((e) => e.entry === mixed.record.entry);
    assert.equal(entry?.disposition, "supported");
    assert.deepEqual(
      entry.revisions.map((r) => r.observations.map((o) => o.basis)),
      [["inspected", "executed", "reported"]],
    );
  });

  it("refuses a relabelled report, verifier result or unread review as source inspection", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const review = candidateReview(run.dir, 1);
    const reads = review.record.outcome.observation.toolCalls.filter((c) => c.tool === "read_file");
    assert.deepEqual(
      reads.map((c) => [c.target, c.ok]),
      LIBRARY_FILES.map((path) => [path, true]),
    );
    const unreadReview: ReviewRecord = {
      ...review.record,
      outcome: {
        ...review.record.outcome,
        observation: { ...review.record.outcome.observation, toolCalls: [] },
      },
    };
    const unread = journalRecord(run, "review", unreadReview);
    const cases: [string, string, RegExp][] = [
      [
        "the failed candidate's producer report",
        producerOf(run.dir, 1).ref,
        /is not a recorded source inspection/,
      ],
      [
        "a verifier result",
        invocationFor(run.dir, 1, target).ref,
        /is not a recorded source inspection/,
      ],
      ["a review that read nothing", unread, /records no read of the candidate's source/],
    ];
    for (const [name, ref, reason] of cases) {
      const claim = {
        assertion: `${name}: this case is parsed.`,
        target,
        kind: "positive" as const,
      };
      rejected(
        proposeAndAdmit(run, fragment(run, { claim, observations: [{ ref, basis: "inspected" }] })),
        reason,
      );
    }
    supported(
      proposeAndAdmit(
        run,
        fragment(run, {
          claim: { assertion: "A read review: this case is parsed.", target, kind: "positive" },
          observations: [{ ref: review.ref, basis: "inspected" }],
        }),
      ),
      "inspected",
    );
  });

  it("refuses fabricated, missing and uncommitted evidence even when a reviewer agrees", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const executed = invocationFor(run.dir, 1, target).ref;
    const cases: [string, KnowledgeProposal["observations"], RegExp][] = [
      [
        "fabricated",
        [{ ref: sha256("an observation nobody recorded"), basis: "executed" }],
        /is not in the evidence store/,
      ],
      [
        "uncommitted",
        [{ ref: putEvidence(run, "stored, never journaled"), basis: "executed" }],
        /is not committed/,
      ],
      ["none", [], /cites no observation/],
      [
        "reported only",
        [{ ref: executed, basis: "reported" }],
        /reported observations remain historical context/,
      ],
    ];
    for (const [name, observations, reason] of cases) {
      const claim = {
        assertion: `${name}: this case is parsed.`,
        target,
        kind: "positive" as const,
      };
      rejected(proposeAndAdmit(run, fragment(run, { claim, observations })), reason);
    }

    const verdict = (s: Stored<KnowledgeProposal>): AgentOutcome => ({
      outcome: "reviewed",
      verdict: supportingVerdict(entryId(s.record)),
      observation: sessionObservation(run.dir, "reviewer", 2, randomUUID()),
    });
    const reviews: [string, (s: Stored<KnowledgeProposal>) => string | null, RegExp][] = [
      ["missing", () => null, /has no independent review/],
      [
        "uncommitted",
        (s) => putEvidence(run, stringify(verdict(s))),
        /is not a committed invocation after the proposal/,
      ],
      ["fabricated", () => sha256("a review nobody ran"), /is not a committed invocation/],
    ];
    for (const [name, review, reason] of reviews) {
      const claim = {
        assertion: `${name} review: this case is parsed.`,
        target,
        kind: "positive" as const,
      };
      rejected(proposeAndAdmit(run, fragment(run, { claim }), review), reason);
    }

    // Evidence committed only after the proposal, or a knowledge record, is not an original observation.
    const late: AgentOutcome = {
      outcome: "blocked",
      blockers: ["committed after the proposal"],
      observation: sessionObservation(run.dir, "reviewer", 1, randomUUID()),
    };
    const lateRef = sha256(stringify(late) ?? "");
    const lateProposal = proposeKnowledge(
      run,
      fragment(run, {
        claim: { assertion: "late: this case is parsed.", target, kind: "positive" },
        observations: [{ ref: lateRef, basis: "inspected" }],
      }),
    );
    assert.equal(recordSession(run, late), lateRef);
    const lateAdmission = admitKnowledge(run, {
      proposal: lateProposal.ref,
      review: reviewSession(run, lateProposal),
      controller: CONTROLLER,
    });
    assert.ok(lateAdmission.ok);
    rejected(lateAdmission.value, /was committed after the proposal/);
    rejected(
      proposeAndAdmit(
        run,
        fragment(run, {
          claim: {
            assertion: "knowledge as evidence: this case is parsed.",
            target,
            kind: "positive",
          },
          observations: [{ ref: lateAdmission.value.ref, basis: "inspected" }],
        }),
      ),
      /is a knowledge record, not an original observation/,
    );

    // An uncommitted proposal cannot be admitted at all, and nothing is written.
    const storedOnly = putEvidence(run, stringify(fragment(run)));
    const events = eventCount(run);
    const refused = admitKnowledge(run, {
      proposal: storedOnly,
      review: null,
      controller: CONTROLLER,
    });
    assert.deepEqual(refused, {
      ok: false,
      diagnostics: [`${storedOnly} is not a committed knowledge proposal`],
    });
    assert.equal(eventCount(run), events);

    supported(proposeAndAdmit(run, fragment(run)), "executed");
  });

  it("refuses mismatched evidence: another target, result, attempt, evaluation, scope or review", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const own = invocationFor(run.dir, 1, target).ref;

    // A successful repository command passed its own target, not the claimed one.
    const repo = invocationFor(run.dir, 1, "CP97/AC01/-/automated/repo.verify");
    assert.deepEqual(
      repo.record.results.map((r) => [targetKey(r.target), r.outcome]),
      [["CP97/AC01/-/automated/repo.verify", "passed"]],
    );
    const cases: [string, Partial<KnowledgeProposal>, RegExp | RegExp[]][] = [
      [
        "an unrelated successful command",
        { observations: [{ ref: repo.ref, basis: "executed" }] },
        /has no result for/,
      ],
      [
        "a failed result for a positive claim",
        {
          claim: { assertion: "The boundary is enforced.", target: BOUNDARY, kind: "positive" },
          observations: [{ ref: invocationFor(run.dir, 1, BOUNDARY).ref, basis: "executed" }],
        },
        /failed .* the claim needs passed/,
      ],
      [
        "another attempt's observation",
        { observations: [{ ref: invocationFor(run.dir, 2, target).ref, basis: "executed" }] },
        /belongs to attempt 2/,
      ],
      [
        "a provisional run of an unadmitted verifier",
        {
          observations: [
            {
              ref: journalInvocation(run, {
                ...invocationFor(run.dir, 1, target).record,
                id: randomUUID(),
                stage: "provisional",
              }),
              basis: "executed",
            },
          ],
        },
        /is a provisional run of an unadmitted verifier/,
      ],
      [
        "an agent's commands as execution",
        { observations: [{ ref: producerOf(run.dir, 1).ref, basis: "executed" }] },
        /is not a verifier invocation/,
      ],
      [
        "another evaluation",
        { evaluation: evaluationOf(run.dir, 2).evaluation },
        // Its attempt 1 observation then belongs to another evaluation too.
        [/has no committed evaluation/, /belongs to attempt 1 evaluation /],
      ],
      [
        "another candidate's scope",
        { scope: fullScope(run.dir, manifestOf(run.dir, 2)) },
        /the scope is not the evaluation's: changed candidate; unknown nothing/,
      ],
      [
        "a dependency the evaluation does not record",
        {
          scope: (({ dependencies, ...scope }) => ({
            ...scope,
            dependencies: { ...dependencies, "verifier:no.such-binding": sha256("no binding") },
          }))(fullScope(run.dir, manifestOf(run.dir, 1))),
        },
        /unknown verifier:no\.such-binding/,
      ],
      ["an uncommitted pull-request round", { round: 1 }, /pull-request round 1 is not committed/],
      [
        "an unknown superseded entry",
        { supersedes: [sha256("no entry")] },
        /supersedes .*, which is not a supported earlier entry/,
      ],
    ];
    for (const [name, fields, reason] of cases) {
      const claim = fields.claim ?? {
        assertion: `${name}: this case is parsed.`,
        target,
        kind: "positive" as const,
      };
      rejected(proposeAndAdmit(run, fragment(run, { ...fields, claim })), ...[reason].flat());
    }

    const other = proposeKnowledge(
      run,
      fragment(run, { claim: { assertion: "Another.", target, kind: "positive" } }),
    );
    const reviews: [string, (s: Stored<KnowledgeProposal>) => string, RegExp][] = [
      [
        "of another proposal",
        (s) => reviewSession(run, s, { for: other.ref }),
        /assessed another proposal/,
      ],
      [
        "requiring changes",
        (s) =>
          reviewSession(run, s, {
            verdict: { ...supportingVerdict(entryId(s.record)), verdict: "changes-required" },
          }),
        /does not find the claim supported/,
      ],
      [
        "covering another subject",
        (s) => reviewSession(run, s, { verdict: supportingVerdict(sha256("another subject")) }),
        /does not find the claim supported/,
      ],
      [
        "that is a producer's submission",
        (s) =>
          recordSession(
            run,
            {
              outcome: "submitted",
              submission: {
                status: "submitted",
                outputs: [],
                changes: [],
                verifier_proposals: [],
                blockers: [],
              },
              observation: sessionObservation(run.dir, "producer", 2, randomUUID()),
            },
            { purpose: "knowledge-review", proposal: s.ref },
          ),
        /is a producer submitted outcome, not a review/,
      ],
    ];
    for (const [name, review, reason] of reviews) {
      const claim = {
        assertion: `A review ${name}: this case is parsed.`,
        target,
        kind: "positive" as const,
      };
      rejected(proposeAndAdmit(run, fragment(run, { claim }), review), reason);
    }

    supported(
      proposeAndAdmit(run, fragment(run, { observations: [{ ref: own, basis: "executed" }] })),
      "executed",
    );
  });

  it("refuses a proposer's review of its own claim", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const claim = (name: string) => ({
      assertion: `${name}: this case is parsed.`,
      target,
      kind: "positive" as const,
    });

    const same = fragment(run, { claim: claim("same invocation") });
    rejected(
      proposeAndAdmit(run, same, () => same.proposer),
      /is not a committed invocation after the proposal/,
    );

    const session = randomUUID();
    rejected(
      proposeAndAdmit(
        run,
        fragment(run, { claim: claim("same session"), proposer: proposerSession(run, 2, session) }),
        (s) => reviewSession(run, s, { session }),
      ),
      /is not independent of the proposer/,
    );

    supported(
      proposeAndAdmit(run, fragment(run, { claim: claim("separate session") })),
      "executed",
    );
  });
});

/** The acceptance input the runner gave attempt `attempt`, read from its committed records. */
function acceptanceInputOf(run: RunHandle, attempt: number) {
  const evaluated = evaluationOf(run.dir, attempt);
  const record = evaluated.record as {
    manifest: EvaluationManifest;
    claims: Submission["outputs"];
  };
  const [start] = committed<{ production: { policy: WritePolicy } | null }>(
    run.dir,
    "start",
    (f) =>
      f.event.attempt === attempt && f.event.data.step === LIBRARY && f.record.production !== null,
  );
  assert.ok(start?.record.production);
  return {
    plan: w.plan,
    step: LIBRARY,
    run: run.run,
    attempt,
    manifest: record.manifest,
    registry: bootstrapRegistry(),
    policy: start.record.production.policy,
    claims: record.claims,
    declarations: { dir: null, rejected: [] },
  };
}

describe("T3.6 L1-02 negative results and fragments", () => {
  it("keeps a verified counterexample and a useful fragment from the failed candidate without accepting it", async () => {
    const run = await reopen(w);
    const [recorded, ...more] = committed<Decision>(
      run.dir,
      "decision",
      (f) => f.event.attempt === 1,
    );
    assert.equal(more.length, 0);
    assert.equal(recorded?.record.decision, "correct");
    const rederive = (): string =>
      stringify(decideAcceptance(journalInput(run, acceptanceInputOf(run, 1))));
    assert.equal(rederive(), stringify(recorded.record));

    const counter = proposeAndAdmit(run, counterexample(run));
    const useful = proposeAndAdmit(run, fragment(run));
    supported(counter, "executed");
    supported(useful, "executed");

    // Both survive the failed candidate; its attempt stays corrected and unaccepted.
    const v = view(run.dir);
    assert.deepEqual(
      v.entries.map((e) => [e.entry, e.disposition]),
      [
        [counter.record.entry, "supported"],
        [useful.record.entry, "supported"],
      ],
    );
    assert.deepEqual(
      v.attempts.map((a) => [a.step, a.attempt, a.decision]),
      [
        [LIBRARY, 1, "correct"],
        [LIBRARY, 2, "accept"],
      ],
    );
    assert.equal(rederive(), stringify(recorded.record));
    assert.deepEqual(
      committed(run.dir, "acceptance").map((f) => f.event.attempt),
      [2],
    );

    // The counterexample holds at the revision it was proved on, not beyond it.
    assert.deepEqual(applicability(v, targetOf(run.dir, 1)), {
      current: [counter.record.entry, useful.record.entry],
      historical: [],
      withheld: [],
      superseded: [],
    });
    assert.deepEqual(applicability(v, targetOf(run.dir, 2)), {
      current: [],
      historical: [
        { entry: counter.record.entry, changed: ["candidate"], unknown: [] },
        { entry: useful.record.entry, changed: ["candidate"], unknown: [] },
      ],
      withheld: [],
      superseded: [],
    });
  });

  it("does not turn an execution problem into a disproof", async () => {
    const run = await reopen(w);
    const real = invocationFor(run.dir, 1, BOUNDARY).record;
    const variant = (edit: (inv: Invocation) => Partial<Invocation>): string =>
      journalInvocation(run, { ...real, id: randomUUID(), ...edit(real) });
    const at = (inv: Invocation, outcome: "unavailable" | "invalid", reason: string) =>
      inv.results.map((r) => ({ target: r.target, outcome, reason }));
    const unavailable = variant((inv) => ({
      error: "the workspace could not be opened",
      results: at(
        inv,
        "unavailable",
        "the verifier did not run: the workspace could not be opened",
      ),
    }));
    // Each variant's own run output is evidence it owns, judged by that invocation.
    const invalidOutput = putEvidence(run, "the judge was stopped before it wrote a report");
    const invalid = variant((inv) => ({
      judge: inv.judge && { ...inv.judge, stdout: invalidOutput },
      results: at(inv, "invalid", `the judge timed out after 30000 ms`),
    }));
    const timedOutOutput = putEvidence(run, "partial output before the timeout");
    const timedOut = variant((inv) => ({
      subjects: inv.subjects.map((s) =>
        s.target === BOUNDARY ? { ...s, timedOut: true, exit: null, stdout: timedOutOutput } : s,
      ),
      results: inv.results.map((r) =>
        targetKey(r.target) === BOUNDARY
          ? {
              target: r.target,
              outcome: "failed" as const,
              reason: "the subject timed out after 30000 ms",
            }
          : r,
      ),
    }));
    const provider = recordSession(run, {
      outcome: "failed",
      reason: "the provider stream ended before a result",
      observation: sessionObservation(run.dir, "producer", 1, randomUUID()),
    });
    const cases: [string, KnowledgeProposal["observations"], RegExp][] = [
      [
        "unavailable",
        [{ ref: unavailable, basis: "executed" }],
        /execution problem .*\(unavailable\), not a disproof/,
      ],
      [
        "unavailable inspected",
        [{ ref: unavailable, basis: "inspected" }],
        /\(unavailable\), not a disproof/,
      ],
      [
        "invalid",
        [{ ref: invalid, basis: "executed" }],
        /execution problem .*\(invalid\), not a disproof/,
      ],
      [
        "timed out",
        [{ ref: timedOut, basis: "executed" }],
        /execution problem .*\(timed out\), not a disproof/,
      ],
      [
        "timed-out subject output",
        [{ ref: timedOutOutput, basis: "executed" }],
        /execution problem .*\(timed out\), not a disproof/,
      ],
      [
        "timed-out subject output inspected",
        [{ ref: timedOutOutput, basis: "inspected" }],
        /execution problem .*\(timed out\), not a disproof/,
      ],
      [
        "invalid judge output",
        [{ ref: invalidOutput, basis: "executed" }],
        /execution problem .*\(invalid\), not a disproof/,
      ],
      [
        "provider failure",
        [{ ref: provider, basis: "inspected" }],
        /provider outcome "failed": an execution problem, not a disproof/,
      ],
      [
        "the scoped failure's own output",
        [
          {
            ref: real.subjects.find((s) => s.target === BOUNDARY)?.stdout ?? "",
            basis: "executed",
          },
        ],
        /is output of .*; cite that record as the observation/,
      ],
    ];
    for (const kind of ["counterexample", "failed-approach"] as const) {
      for (const [name, observations, reason] of cases) {
        const claim = {
          assertion: `${name} ${kind}: the boundary case is accepted.`,
          target: BOUNDARY,
          kind,
        };
        rejected(proposeAndAdmit(run, counterexample(run, { claim, observations })), reason);
      }
    }
    supported(proposeAndAdmit(run, counterexample(run)), "executed");
  });
});

describe("T3.6 L1-03 applicability, revalidation and conflicts", () => {
  it("withholds support for changed or unknown dependencies and restores it by revalidation", async () => {
    const run = await reopen(w);
    const original = fragment(run);
    const first = proposeAndAdmit(run, original);
    supported(first, "executed");
    const id = first.record.entry;
    const at = (target: KnowledgeTarget) => applicability(view(run.dir), target);
    const t1 = targetOf(run.dir, 1);
    const t2 = targetOf(run.dir, 2);
    assert.deepEqual(at(t1), { current: [id], historical: [], withheld: [], superseded: [] });

    const changedDependency = (name: string): KnowledgeTarget => ({
      ...t1,
      dependencies: { ...t1.dependencies, [name]: sha256(`changed ${name}`) },
    });
    const changes: [string, KnowledgeTarget][] = [
      ["candidate", t2],
      ["definitions", { ...t1, definitions: sha256("amended definitions") }],
      ["repository", { ...t1, repository: "sb-dev/elsewhere" }],
      ["configuration", changedDependency("configuration")],
      ["toolchain", changedDependency("toolchain")],
      ["verifier:library.accepts", changedDependency("verifier:library.accepts")],
    ];
    for (const [name, target] of changes) {
      assert.deepEqual(
        at(target),
        {
          current: [],
          historical: [{ entry: id, changed: [name], unknown: [] }],
          withheld: [],
          superseded: [],
        },
        name,
      );
    }
    const known = { ...t1.dependencies };
    delete known["verifier:library.accepts"];
    assert.deepEqual(at({ ...t1, dependencies: known }), {
      current: [],
      historical: [{ entry: id, changed: [], unknown: ["verifier:library.accepts"] }],
      withheld: [],
      superseded: [],
    });

    // Revalidation needs fresh evidence of the new candidate and its own review.
    const target = original.claim.target;
    const revalidate = (ref: string) =>
      proposal(run, {
        attempt: 2,
        claim: original.claim,
        observations: [{ ref, basis: "executed" }],
        scope: fullScope(run.dir, manifestOf(run.dir, 2)),
      });
    const stale = proposeAndAdmit(run, revalidate(invocationFor(run.dir, 1, target).ref));
    rejected(stale, /belongs to attempt 1 evaluation /);
    assert.equal(stale.record.entry, id);
    assert.deepEqual(at(t2).current, []);

    supported(proposeAndAdmit(run, revalidate(invocationFor(run.dir, 2, target).ref)), "executed");
    assert.deepEqual(at(t2), { current: [id], historical: [], withheld: [], superseded: [] });
    assert.deepEqual(at(t1), { current: [id], historical: [], withheld: [], superseded: [] });
    const entry = view(run.dir).entries.find((e) => e.entry === id);
    assert.deepEqual(
      entry?.revisions.map((r) => [r.attempt, r.admission?.disposition]),
      [
        [1, "supported"],
        [2, "rejected"],
        [2, "supported"],
      ],
    );
  });

  it("keeps an executed claim's verifier and toolchain, and narrows other dependencies only with inspection and review", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const executed = { ref: invocationFor(run.dir, 1, target).ref, basis: "executed" as const };
    const review = candidateReview(run.dir, 1);
    const inspected = { ref: review.ref, basis: "inspected" as const };
    const narrowedBy = (omit: string[], observations: KnowledgeProposal["observations"]) =>
      fragment(run, {
        claim: {
          assertion: `Without ${omit.join(", ")}: this case is parsed.`,
          target,
          kind: "positive",
        },
        observations,
        scope: fullScope(run.dir, manifestOf(run.dir, 1), omit),
      });
    const scopeReviewed = (s: Stored<KnowledgeProposal>) =>
      reviewSession(run, s, { verdict: supportingVerdict(entryId(s.record), { scope: true }) });

    // The verifier and toolchain an executed result came from are never excluded.
    for (const name of ["verifier:library.accepts", "toolchain"]) {
      rejected(
        proposeAndAdmit(run, narrowedBy([name], [executed])),
        new RegExp(`the scope omits ${name}, on which its executed observations depend`),
        /narrower than its evaluation .* without a source inspection/,
        /does not assess the narrower scope/,
      );
      rejected(
        proposeAndAdmit(run, narrowedBy([name], [executed, inspected]), scopeReviewed),
        new RegExp(`the scope omits ${name}, on which its executed observations depend`),
      );
    }
    // Any other exclusion needs a source inspection and the review's assessment of the scope.
    rejected(
      proposeAndAdmit(run, narrowedBy(["harness"], [executed]), scopeReviewed),
      /the scope is narrower than its evaluation \(omits harness; paths none\) without a source inspection/,
    );
    rejected(
      proposeAndAdmit(run, narrowedBy(["harness"], [executed, inspected])),
      /does not assess the narrower scope/,
    );

    // A reviewed narrower scope survives a change it excludes, not one it keeps.
    const narrow = proposeAndAdmit(
      run,
      narrowedBy(["harness", "run-model"], [executed, inspected]),
      scopeReviewed,
    );
    supported(narrow, "executed");
    const full = proposeAndAdmit(run, fragment(run));
    supported(full, "executed");
    const t1 = targetOf(run.dir, 1);
    const changed = (name: string): KnowledgeTarget => ({
      ...t1,
      dependencies: { ...t1.dependencies, [name]: sha256(`changed ${name}`) },
    });
    const [n, f] = [narrow.record.entry, full.record.entry];
    assert.deepEqual(applicability(view(run.dir), changed("harness")), {
      current: [n],
      historical: [{ entry: f, changed: ["harness"], unknown: [] }],
      withheld: [],
      superseded: [],
    });
    assert.deepEqual(applicability(view(run.dir), changed("verifier:library.accepts")), {
      current: [],
      historical: [
        { entry: n, changed: ["verifier:library.accepts"], unknown: [] },
        { entry: f, changed: ["verifier:library.accepts"], unknown: [] },
      ],
      withheld: [],
      superseded: [],
    });
  });

  it("keeps a reviewed narrower candidate scope current across unrelated candidate changes", async () => {
    const run = await reopen(w);
    const t1 = targetOf(run.dir, 1);
    const t2 = targetOf(run.dir, 2);
    const path = "src/config.d.ts";
    const entryAt1 = t1.tree.get(path);
    assert.ok(entryAt1 && LIBRARY_FILES.includes(path));
    assert.equal(t2.tree.get(path), entryAt1);
    assert.notEqual(t1.candidate.commit, t2.candidate.commit);
    const unreadPath = [...t1.tree.keys()].find((p) => !LIBRARY_FILES.includes(p));
    assert.ok(unreadPath);

    const review = candidateReview(run.dir, 1);
    const narrowed = (paths: Record<string, string>, assertion: string) =>
      proposal(run, {
        attempt: 1,
        claim: { assertion, target: `${LIBRARY}/R01`, kind: "positive" },
        observations: [{ ref: review.ref, basis: "inspected" }],
        scope: { ...fullScope(run.dir, manifestOf(run.dir, 1)), candidate: { paths } },
      });
    const scopeReviewed = (s: Stored<KnowledgeProposal>) =>
      reviewSession(run, s, { verdict: supportingVerdict(entryId(s.record), { scope: true }) });
    const narrow = proposeAndAdmit(
      run,
      narrowed({ [path]: entryAt1 }, "The declarations type parseConfig's result."),
      scopeReviewed,
    );
    supported(narrow, "inspected");
    const id = narrow.record.entry;
    assert.deepEqual(applicability(view(run.dir), t2), {
      current: [id],
      historical: [],
      withheld: [],
      superseded: [],
    });

    const edited = new Map(t2.tree).set(path, `100644 ${"0".repeat(40)}`);
    assert.deepEqual(applicability(view(run.dir), { ...t2, tree: edited }), {
      current: [],
      historical: [{ entry: id, changed: [`path:${path}`], unknown: [] }],
      withheld: [],
      superseded: [],
    });
    rejected(
      proposeAndAdmit(run, narrowed({ [path]: entryAt1 }, "Unreviewed narrowing.")),
      /does not assess the narrower scope/,
    );
    rejected(
      proposeAndAdmit(
        run,
        narrowed({ [unreadPath]: t1.tree.get(unreadPath) ?? "" }, "An unread file."),
        scopeReviewed,
      ),
      new RegExp(`the scope keeps paths the inspection did not read: ${unreadPath}`),
    );
    rejected(
      proposeAndAdmit(
        run,
        narrowed({ "src/absent.mjs": entryAt1 }, "An absent file is typed."),
        scopeReviewed,
      ),
      /the scope is not the evaluation's: changed path:src\/absent\.mjs; unknown nothing/,
      /the scope keeps paths the inspection did not read: src\/absent\.mjs/,
    );
  });

  it("applies a correction only where the correcting revision holds, so a narrower claim stays current elsewhere", async () => {
    const run = await reopen(w);
    const [t1, t2] = [targetOf(run.dir, 1), targetOf(run.dir, 2)];
    const path = "src/config.d.ts";
    const entryAt1 = t1.tree.get(path);
    assert.ok(entryAt1);
    assert.equal(t2.tree.get(path), entryAt1);
    const review = candidateReview(run.dir, 1);
    const target = `${LIBRARY}/R01`;
    const narrow = proposeAndAdmit(
      run,
      proposal(run, {
        attempt: 1,
        claim: {
          assertion: "The declarations type parseConfig's result.",
          target,
          kind: "positive",
        },
        observations: [{ ref: review.ref, basis: "inspected" }],
        scope: {
          ...fullScope(run.dir, manifestOf(run.dir, 1)),
          candidate: { paths: { [path]: entryAt1 } },
        },
      }),
      (s) =>
        reviewSession(run, s, { verdict: supportingVerdict(entryId(s.record), { scope: true }) }),
    );
    supported(narrow, "inspected");
    const n = narrow.record.entry;
    // A correction proved only for the first candidate.
    const correction = proposeAndAdmit(
      run,
      proposal(run, {
        attempt: 1,
        claim: {
          assertion: "At the first candidate, parseConfig's declared result omits a field.",
          target,
          kind: "counterexample",
        },
        observations: [{ ref: review.ref, basis: "inspected" }],
        supersedes: [n],
      }),
    );
    supported(correction, "inspected");
    const c = correction.record.entry;
    const v = view(run.dir);
    const narrowed = v.entries.find((e) => e.entry === n);
    assert.deepEqual(correction.record.relations, [
      { relation: "supersedes", entry: n, revisions: [narrowed?.revisions[0]?.proposal] },
    ]);
    assert.deepEqual([narrowed?.disposition, narrowed?.supersededBy], ["supported", [c]]);
    assert.deepEqual(applicability(v, t1), {
      current: [c],
      historical: [],
      withheld: [],
      superseded: [{ entry: n, by: [c] }],
    });
    assert.deepEqual(applicability(v, t2), {
      current: [n],
      historical: [{ entry: c, changed: ["candidate"], unknown: [] }],
      withheld: [],
      superseded: [],
    });
  });

  it("records conflicts and corrections only as reviewed relations between claims about one target and scope", async () => {
    const run = await reopen(w);
    const review = candidateReview(run.dir, 1);
    const t1 = targetOf(run.dir, 1);
    const failed = proposeAndAdmit(
      run,
      counterexample(run, {
        claim: {
          assertion: "The first attempt's upper-bound check lets the highest-port case through.",
          target: BOUNDARY,
          kind: "failed-approach",
        },
      }),
    );
    // A compatible positive claim about the same target: no relation, no conflict.
    const compatible = proposeAndAdmit(
      run,
      counterexample(run, {
        claim: {
          assertion:
            "The first attempt's parser reads the port as an integer before its range check.",
          target: BOUNDARY,
          kind: "positive",
        },
        observations: [{ ref: review.ref, basis: "inspected" }],
      }),
    );
    const unrelated = proposeAndAdmit(run, fragment(run));
    for (const a of [failed, compatible, unrelated])
      assert.equal(a.record.disposition, "supported");
    const [f, c, u] = [failed.record.entry, compatible.record.entry, unrelated.record.entry];
    const all = { current: [f, c, u], historical: [], withheld: [], superseded: [] };
    assert.deepEqual(applicability(view(run.dir), t1), all);

    // Relations to claims about another target or scope, or not supported, are refused.
    const boundary = (assertion: string, fields: Partial<KnowledgeProposal>) =>
      counterexample(run, {
        claim: { assertion, target: BOUNDARY, kind: "counterexample" },
        ...fields,
      });
    rejected(
      proposeAndAdmit(run, boundary("Supersedes an unrelated claim.", { supersedes: [u] })),
      new RegExp(
        `supersedes ${u}, a claim about ${LIBRARY} ${passedTarget(run.dir)}, not ${LIBRARY} ${BOUNDARY}`,
      ),
    );
    rejected(
      proposeAndAdmit(run, boundary("Contradicts an unrelated claim.", { contradicts: [u] })),
      new RegExp(`contradicts ${u}, a claim about`),
    );
    const pending = proposeKnowledge(run, boundary("Not yet admitted.", {}));
    rejected(
      proposeAndAdmit(
        run,
        boundary("Supersedes a pending claim.", { supersedes: [entryId(pending.record)] }),
      ),
      /which is not a supported earlier entry/,
    );
    const later = proposal(run, {
      attempt: 2,
      claim: { assertion: "Attempt 2 contradicts attempt 1.", target: BOUNDARY, kind: "positive" },
      observations: [{ ref: invocationFor(run.dir, 2, BOUNDARY).ref, basis: "executed" }],
      contradicts: [f],
    });
    rejected(
      proposeAndAdmit(run, later),
      new RegExp(`contradicts ${f}, which does not hold at this evaluation's scope`),
    );
    // A relation the review does not assess is refused too.
    rejected(
      proposeAndAdmit(run, boundary("Unassessed correction.", { supersedes: [c] }), (s) =>
        reviewSession(run, s, { verdict: supportingVerdict(entryId(s.record)) }),
      ),
      new RegExp(`does not assess that the entry supersedes ${c}`),
    );
    assert.deepEqual(applicability(view(run.dir), t1), all);
  });

  it("applies a relation only where the revision recording it holds, so revalidated revisions stay current", async () => {
    const run = await reopen(w);
    const target = passedTarget(run.dir);
    const [t1, t2] = [targetOf(run.dir, 1), targetOf(run.dir, 2)];
    const positiveAt = (attempt: number): KnowledgeProposal =>
      proposal(run, {
        attempt,
        claim: { assertion: "The parser accepts this well-formed case.", target, kind: "positive" },
        observations: [{ ref: invocationFor(run.dir, attempt, target).ref, basis: "executed" }],
      });
    const negativeAt = (attempt: number, fields: Partial<KnowledgeProposal> = {}) =>
      proposal(run, {
        attempt,
        claim: {
          assertion: "The parser rejects this well-formed case.",
          target,
          kind: "counterexample",
        },
        observations: [{ ref: candidateReview(run.dir, attempt).ref, basis: "inspected" }],
        ...fields,
      });

    // (1) A contradiction established at attempt 1 withholds both claims there.
    const positive = proposeAndAdmit(run, positiveAt(1));
    supported(positive, "executed");
    const p = positive.record.entry;
    const negative = proposeAndAdmit(run, negativeAt(1, { contradicts: [p] }));
    supported(negative, "inspected");
    const n = negative.record.entry;
    const [p1] = view(run.dir).entries[0]?.revisions ?? [];
    assert.deepEqual(negative.record.relations, [
      { relation: "contradicts", entry: p, revisions: [p1?.proposal] },
    ]);
    const conflictAt1 = {
      current: [],
      historical: [],
      withheld: [
        { entry: p, conflicts: [n] },
        { entry: n, conflicts: [p] },
      ],
      superseded: [],
    };
    assert.deepEqual(applicability(view(run.dir), t1), conflictAt1);

    // (2) Both are revalidated at attempt 2 without renewing the relation.
    supported(proposeAndAdmit(run, positiveAt(2)), "executed");
    supported(proposeAndAdmit(run, negativeAt(2)), "inspected");

    // (3) The old contradiction stays at attempt 1's scope.
    assert.deepEqual(applicability(view(run.dir), t2), {
      current: [p, n],
      historical: [],
      withheld: [],
      superseded: [],
    });
    assert.deepEqual(applicability(view(run.dir), t1), conflictAt1);

    // A correction admitted at attempt 1 supersedes only the revision it was admitted against.
    const correction = proposeAndAdmit(
      run,
      proposal(run, {
        attempt: 1,
        claim: {
          assertion: "The first attempt's parser accepts this case; rejecting it was wrong.",
          target,
          kind: "positive",
        },
        observations: [{ ref: invocationFor(run.dir, 1, target).ref, basis: "executed" }],
        supersedes: [n],
      }),
    );
    supported(correction, "executed");
    const c = correction.record.entry;
    const v = view(run.dir);
    const negativeEntry = v.entries.find((e) => e.entry === n);
    assert.deepEqual(correction.record.relations, [
      { relation: "supersedes", entry: n, revisions: [negativeEntry?.revisions[0]?.proposal] },
    ]);
    assert.deepEqual(
      [
        negativeEntry?.disposition,
        negativeEntry?.revisions.map((r) => [r.attempt, r.admission?.disposition, r.supersededBy]),
      ],
      [
        "supported",
        [
          [1, "supported", [c]],
          [2, "supported", []],
        ],
      ],
    );
    assert.deepEqual(applicability(v, t2), {
      current: [p, n],
      historical: [{ entry: c, changed: ["candidate"], unknown: [] }],
      withheld: [],
      superseded: [],
    });
    assert.deepEqual(applicability(v, t1), {
      current: [p, c],
      historical: [],
      withheld: [],
      superseded: [{ entry: n, by: [c] }],
    });
  });

  for (const negative of ["counterexample", "failed-approach"] as const) {
    it(`withholds a positive claim and a ${negative} it is reviewed to contradict, until a reviewed correction supersedes it`, async () => {
      const run = await reopen(w);
      const failure = proposeAndAdmit(
        run,
        counterexample(run, {
          claim: {
            assertion: "The first attempt's parser accepts a port above the highest valid port.",
            target: BOUNDARY,
            kind: negative,
          },
        }),
      );
      const unrelated = proposeAndAdmit(run, fragment(run));
      supported(failure, "executed");
      supported(unrelated, "executed");
      const t1 = targetOf(run.dir, 1);
      const [c, u] = [failure.record.entry, unrelated.record.entry];

      const review = candidateReview(run.dir, 1);
      const mistaken = proposeAndAdmit(
        run,
        counterexample(run, {
          claim: {
            assertion: "The first attempt's parser rejects a port above the highest valid port.",
            target: BOUNDARY,
            kind: "positive",
          },
          observations: [{ ref: review.ref, basis: "inspected" }],
          contradicts: [c],
        }),
      );
      supported(mistaken, "inspected");
      const m = mistaken.record.entry;
      const conflict = {
        current: [u],
        historical: [],
        withheld: [
          { entry: c, conflicts: [m] },
          { entry: m, conflicts: [c] },
        ],
        superseded: [],
      };
      assert.deepEqual(applicability(view(run.dir), t1), conflict);

      // Each proposal of the correction comes from its own proposer session.
      const correction = (): KnowledgeProposal =>
        counterexample(run, {
          claim: {
            assertion:
              "Letting the highest-port boundary through is a defect of the first attempt.",
            target: BOUNDARY,
            kind: negative === "counterexample" ? "failed-approach" : "counterexample",
          },
          supersedes: [m],
        });
      // An unreviewed correction resolves nothing.
      rejected(
        proposeAndAdmit(run, correction(), () => null),
        /has no independent review/,
      );
      assert.deepEqual(applicability(view(run.dir), t1), conflict);

      const resolved = proposeAndAdmit(run, correction());
      supported(resolved, "executed");
      const r = resolved.record.entry;
      const v = view(run.dir);
      assert.deepEqual(applicability(v, t1), {
        current: [c, u, r],
        historical: [],
        withheld: [],
        superseded: [{ entry: m, by: [r] }],
      });
      assert.deepEqual(
        v.entries.map((e) => [
          e.entry,
          e.disposition,
          e.supersededBy,
          e.revisions.map((x) => x.admission?.disposition),
        ]),
        [
          [c, "supported", [], ["supported"]],
          [u, "supported", [], ["supported"]],
          [m, "supported", [r], ["supported"]],
          [r, "supported", [], ["rejected", "supported"]],
        ],
      );
    });
  }
});

describe("T3.6 L1-04 record recovery and compatibility", () => {
  /** Supported, rejected and pending knowledge on a reopened run. */
  async function populated(): Promise<RunHandle> {
    const run = await reopen(w);
    proposeAndAdmit(run, counterexample(run));
    proposeAndAdmit(run, fragment(run));
    proposeAndAdmit(run, fragment(run, { observations: [] }));
    proposeKnowledge(
      run,
      counterexample(run, {
        claim: { assertion: "Pending.", target: BOUNDARY, kind: "counterexample" },
      }),
    );
    return run;
  }

  const pack = async (dir: string, name: string) =>
    packState(dir, join(w.scratch, randomUUID()), {
      name,
      sequence: 1,
      controller: { commit: "0".repeat(40), identity: CONTROLLER },
    });

  it("rebuilds the same view from committed records, and a compatible archive restores it exactly", async () => {
    const run = await populated();
    const built = view(run.dir);
    assert.deepEqual(
      built.entries.map((e) => e.disposition),
      ["supported", "supported", "proposed"],
    );
    assert.equal(stringify(view(run.dir)), stringify(built));

    const { files } = await pack(run.dir, "l1-recovery");
    const restored = await unpackState(files, join(w.scratch, randomUUID()), {
      name: "l1-recovery",
      sequence: 1,
    });
    assert.ok(restored.ok, restored.ok ? "" : restored.diagnostics.join("\n"));
    assert.equal(stringify(view(restored.dir)), stringify(built));
    assert.deepEqual(
      applicability(view(restored.dir), targetOf(restored.dir, 1)),
      applicability(built, targetOf(run.dir, 1)),
    );
  });

  it("refuses uncommitted records", async () => {
    const run = await populated();
    const built = stringify(view(run.dir));

    // A record stored without its journal event is not knowledge.
    const storedOnly = putEvidence(run, stringify(fragment(run)));
    assert.equal(stringify(view(run.dir)), built);
    assert.equal(
      admitKnowledge(run, { proposal: storedOnly, review: null, controller: CONTROLLER }).ok,
      false,
    );

    // A proposal line written before a crash, without its anchor, is not committed.
    const p = fragment(run, {
      claim: { assertion: "Written, never anchored.", target: BOUNDARY, kind: "positive" },
    });
    const head = segmentOf(run, "head");
    const anchor = readFileSync(head);
    const written = proposeKnowledge(run, p);
    const temp = join(run.dir, "tmp", randomUUID());
    writeFileSync(temp, anchor);
    renameSync(temp, head);
    const read = readRun(run.dir);
    assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
    assert.ok(read.records.tail && read.records.tail.length > 0);
    assert.ok(!read.records.events.some((e) => e.data.record === written.ref));
    const after = view(run.dir);
    assert.ok(!after.entries.some((e) => e.revisions.some((r) => r.proposal === written.ref)));
    assert.deepEqual(
      admitKnowledge(run, { proposal: written.ref, review: null, controller: CONTROLLER }),
      {
        ok: false,
        diagnostics: [`${written.ref} is not a committed knowledge proposal`],
      },
    );
  });

  it("refuses altered records", async () => {
    const run = await populated();
    const [proposed] = committed(run.dir, "knowledge-proposal");
    const [admitted] = committed(run.dir, "knowledge-admission");
    assert.ok(proposed && admitted);

    // An altered evidence record no longer matches its digest.
    const blobAltered = copyOf(run.dir);
    const blob = join(blobAltered, "evidence", proposed.ref.slice("sha256:".length));
    chmodSync(blob, 0o644);
    writeFileSync(
      blob,
      JSON.stringify({ ...(proposed.record as object), claim: { kind: "positive" } }),
    );
    const blobView = knowledgeView(blobAltered, CONTROLLER);
    assert.equal(blobView.ok, false);
    assert.match(blobView.ok ? "" : blobView.diagnostics.join("\n"), /corrupt evidence/);

    // An altered journal line breaks the committed chain.
    const lineAltered = copyOf(run.dir);
    const segment = join(lineAltered, "journal", `${String(run.epoch).padStart(6, "0")}.jsonl`);
    const text = readFileSync(segment, "utf8");
    assert.ok(text.includes('"disposition":"supported"'));
    writeFileSync(segment, text.replace('"disposition":"supported"', '"disposition":"rejected"'));
    const lineView = knowledgeView(lineAltered, CONTROLLER);
    assert.equal(lineView.ok, false);
    assert.match(
      lineView.ok ? "" : lineView.diagnostics.join("\n"),
      /do not match their anchor|expected/,
    );

    // The unaltered run is readable.
    assert.ok(knowledgeView(run.dir, CONTROLLER).ok);
  });

  it("refuses incompatible records without migrating them or changing the saved archive", async () => {
    const run = await populated();
    const compatible = copyOf(run.dir);
    const future = { ...counterexample(run), format: 2 };
    const ref = putEvidence(run, stringify(future));
    appendEvent(run, {
      action: "knowledge-proposal",
      attempt: 1,
      evaluation: future.evaluation,
      evidence: [ref],
      data: { record: ref, entry: entryId(future), step: LIBRARY },
    });
    const events = eventCount(run);
    const unsupported = /format 2 is not supported; a run is never migrated/;
    const refused = knowledgeView(run.dir, CONTROLLER);
    assert.equal(refused.ok, false);
    assert.match(refused.ok ? "" : refused.diagnostics.join("\n"), unsupported);
    const [pending] = committed(run.dir, "knowledge-proposal");
    assert.ok(pending);
    const admit = admitKnowledge(run, {
      proposal: pending.ref,
      review: null,
      controller: CONTROLLER,
    });
    assert.match(admit.ok ? "" : admit.diagnostics.join("\n"), unsupported);
    assert.throws(() => proposeKnowledge(run, fragment(run)), unsupported);
    assert.equal(
      eventCount(run),
      events + 1,
      "only the proposer session of the refused proposal was written",
    );

    // Records of another controller, or an unknown knowledge action, are refused too.
    const other = knowledgeView(compatible, "another-controller");
    assert.match(
      other.ok ? "" : other.diagnostics.join("\n"),
      /written by controller t3-6-l1-test, not another-controller/,
    );
    const unknownAction = await reopen(w);
    const guidance = putEvidence(
      unknownAction,
      JSON.stringify({ format: 1, controller: CONTROLLER }),
    );
    appendEvent(unknownAction, {
      action: "knowledge-guidance",
      evidence: [guidance],
      data: { record: guidance },
    });
    const unknown = knowledgeView(unknownAction.dir, CONTROLLER);
    assert.match(
      unknown.ok ? "" : unknown.diagnostics.join("\n"),
      /not a knowledge record of format 1/,
    );
    assert.ok(knowledgeView(compatible, CONTROLLER).ok);

    // A saved archive holding the incompatible record restores unchanged and is refused.
    const { files, manifest } = await pack(run.dir, "l1-incompatible");
    const archive = readFileSync(files.archive);
    const restored = await unpackState(files, join(w.scratch, randomUUID()), {
      name: "l1-incompatible",
      sequence: 1,
    });
    assert.ok(restored.ok, restored.ok ? "" : restored.diagnostics.join("\n"));
    const fromArchive = knowledgeView(restored.dir, CONTROLLER);
    assert.match(fromArchive.ok ? "" : fromArchive.diagnostics.join("\n"), unsupported);
    assert.deepEqual(readFileSync(files.archive), archive);
    const reread = readRun(restored.dir);
    assert.ok(reread.ok);
    assert.deepEqual(
      { seq: reread.records.events.at(-1)?.seq, head: reread.records.head },
      { seq: manifest.journal.seq, head: manifest.journal.head },
    );
  });
});

function eventCount(run: RunHandle): number {
  const read = readRun(run.dir);
  assert.ok(read.ok);
  return read.records.events.length;
}
