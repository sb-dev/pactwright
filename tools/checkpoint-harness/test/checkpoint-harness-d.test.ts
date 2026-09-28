// T3-D acceptance (Task 3 research log §12): verification bindings, verifier
// admission, the common independent review and the acceptance decision, run
// offline. Candidates are real sealed snapshots in a real run directory;
// verifier workspaces and reviewer sessions are scripted, so no verifier code
// runs and no provider is called. Real containment is B's; a real reviewer is
// C's adapter. Fixture acceptances are explicit test inputs.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import {
  buildPacket,
  invokeAgent,
  SUBMISSION_SCHEMA,
  VERDICT_SCHEMA,
  type Packet,
  type ReviewVerdict,
  type Submission,
} from "../src/claude.js";
import {
  nextEligible,
  type AcceptedOutput,
  type PreparedRun,
  type VerificationTarget,
} from "../src/contracts.js";
import {
  appendEvent,
  evaluationDigest,
  putEvidence,
  readEvidence,
  readRun,
  type EvaluationManifest,
  type RunHandle,
} from "../src/evidence.js";
import {
  bindingDigests,
  COMMON_RUBRIC,
  createRegistry,
  type Binding,
} from "../src/software-bootstrap.js";
import {
  admitVerifier,
  candidateTree,
  decideAcceptance,
  protectedVerifierPaths,
  recordDecision,
  reviewCandidate,
  targetKey,
  verifyCandidate,
  type AcceptanceInput,
  type Admission,
  type Approval,
  type Decision,
  type Invocation,
  type OpenWorkspace,
  type ReviewerAccess,
  type ReviewRecord,
  type Stored,
} from "../src/verification.js";
import type { SealedCandidate, WritePolicy } from "../src/workspace.js";
import {
  approveAll,
  calibration,
  fixturePlan,
  fixtureRegistry,
  manifestFor,
  passing,
  passingVerifier,
  localWorkspaces,
  passVerdict,
  PRODUCER,
  reviewerRole,
  scriptedReviewer,
  reviewerWorkspaces,
  scriptedVerifier,
  seal,
  stepTargets,
  world,
  type Execution,
  type ReportEntry,
  type World,
} from "./verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-d-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const registry = fixtureRegistry();
const A_SNAPSHOT = { commit: "0".repeat(40), tree: "0".repeat(40) };

let plan: PreparedRun;
before(async () => {
  plan = await fixturePlan(scratch);
});

const COMMAND =
  'import { readFileSync } from "node:fs";\nimport { parseConfig } from "./parser.mjs";\nprocess.stdout.write(JSON.stringify(parseConfig(readFileSync(process.argv[2], "utf8"))));\n';
const FILES: Record<string, () => Record<string, string>> = {
  "CP99-S01": () => calibration("known-good").files,
  "CP99-S02": () => ({ ...calibration("known-good").files, "src/command.mjs": COMMAND }),
  "CP99-S03": () => ({ "src/report.md": "# Fixture report\n" }),
};
const CLAIMS: Record<string, Submission["outputs"]> = {
  "CP99-S01": [{ output: "config-parser", paths: ["src/parser.mjs"] }],
  "CP99-S02": [{ output: "command", paths: ["src/command.mjs"] }],
  "CP99-S03": [{ output: "report", paths: ["src/report.md"] }],
};

/** Explicit fixture acceptances of a step's accepted inputs. */
const inputsFor = (step: string): AcceptedOutput[] =>
  step === "CP99-S02"
    ? [
        {
          step: "CP99-S01",
          output: "config-parser",
          definition: plan.stepDefinitions["CP99-S01"] ?? "",
          definitions: plan.definitionsDigest,
          evidence: ["fixture acceptance of CP99-S01"],
        },
      ]
    : [];

/** One attempt's records, as the controller would hold them. */
type Attempt = {
  w: World;
  step: string;
  attempt: number;
  candidate: SealedCandidate;
  tree: Map<string, string>;
  manifest: EvaluationManifest;
  claims: Submission["outputs"];
  admissions: Stored<Admission>[];
  invocations: Stored<Invocation>[];
  reviews: Stored<ReviewRecord>[];
  approvals: Stored<Approval>[];
};

async function attemptOf(
  w: World,
  step: string,
  options: {
    files?: Record<string, string>;
    removed?: string[];
    policy?: WritePolicy;
    attempt?: number;
  } = {},
): Promise<Attempt> {
  const files = options.files ?? FILES[step]?.() ?? {};
  const candidate = await seal(w, files, options);
  const tree = candidateTree(w.run, candidate);
  return {
    w,
    step,
    attempt: options.attempt ?? 1,
    candidate,
    tree,
    manifest: manifestFor(plan, step, candidate, registry, tree),
    claims: CLAIMS[step] ?? [],
    admissions: [],
    invocations: [],
    reviews: [],
    approvals: [],
  };
}

const access = (respond: (packet: Packet) => unknown = approveAll): ReviewerAccess => ({
  role: reviewerRole(),
  open: reviewerWorkspaces(),
  signal: new AbortController().signal,
  provider: scriptedReviewer(respond),
});

const automatedBindings = (step: string): string[] =>
  [
    ...new Set(
      stepTargets(plan, step)
        .filter((t) => t.method === "automated")
        .map((t) => t.binding),
    ),
  ].sort();

const passes = (step: string): ReturnType<typeof scriptedVerifier> =>
  passingVerifier(stepTargets(plan, step));

async function admit(
  a: Attempt,
  options: {
    verifier?: OpenWorkspace;
    adequacy?: (p: Packet) => unknown;
    bindings?: string[];
  } = {},
): Promise<Stored<Admission>[]> {
  const admitted: Stored<Admission>[] = [];
  for (const binding of options.bindings ?? automatedBindings(a.step)) {
    admitted.push(
      await admitVerifier(a.w.run, {
        plan,
        step: a.step,
        registry,
        binding,
        candidate: a.candidate,
        attempt: a.attempt,
        manifest: a.manifest,
        accepted: inputsFor(a.step),
        open: options.verifier ?? passes(a.step),
        reviewer: access(options.adequacy),
      }),
    );
  }
  a.admissions.push(...admitted);
  return admitted;
}

async function verify(a: Attempt, verifier: OpenWorkspace = passes(a.step)): Promise<void> {
  a.invocations.push(
    ...(await verifyCandidate(a.w.run, {
      plan,
      step: a.step,
      registry,
      candidate: a.candidate,
      attempt: a.attempt,
      manifest: a.manifest,
      admissions: a.admissions,
      open: verifier,
    })),
  );
}

async function review(
  a: Attempt,
  respond: (p: Packet) => unknown = approveAll,
): Promise<Stored<ReviewRecord>> {
  const reviewed = await reviewCandidate(a.w.run, {
    plan,
    step: a.step,
    registry,
    candidate: a.candidate,
    attempt: a.attempt,
    manifest: a.manifest,
    accepted: inputsFor(a.step),
    claims: a.claims,
    reviewer: access(respond),
  });
  a.reviews.push(reviewed);
  return reviewed;
}

/** Admission with passing verifiers, then acceptance verification with `verifier`, then review. */
async function complete(
  a: Attempt,
  options: { verifier?: OpenWorkspace; respond?: (p: Packet) => unknown } = {},
): Promise<Attempt> {
  await admit(a);
  await verify(a, options.verifier);
  await review(a, options.respond);
  return a;
}

const journaled = (run: RunHandle): Set<string> => {
  const read = readRun(run.dir);
  assert.ok(read.ok, read.ok ? "" : read.diagnostics.join("\n"));
  return new Set(read.records.events.flatMap((e) => e.evidence));
};

type DecisionInput = Omit<AcceptanceInput, "journaled">;

const input = (a: Attempt, overrides: Partial<DecisionInput> = {}): DecisionInput => ({
  plan,
  step: a.step,
  run: a.w.run.run,
  attempt: a.attempt,
  manifest: a.manifest,
  registry,
  policy: PRODUCER,
  tree: a.tree,
  claims: a.claims,
  invocations: a.invocations,
  admissions: a.admissions,
  reviews: a.reviews,
  approvals: a.approvals,
  ...overrides,
});

/** What `recordDecision` takes; it reads everything else from the journal. */
const recordInput = (a: Attempt) => ({
  plan,
  step: a.step,
  run: a.w.run.run,
  attempt: a.attempt,
  manifest: a.manifest,
  registry,
  policy: PRODUCER,
  claims: a.claims,
});

const decide = (a: Attempt, overrides: Partial<DecisionInput> = {}): Decision =>
  decideAcceptance({ ...input(a, overrides), journaled: journaled(a.w.run) });

/** Asserts a non-accepting decision with a reason on `route` whose subject and detail match. */
function assertReason(
  decision: Decision,
  expected: { decision: "correct" | "pause"; route: string; subject?: RegExp; detail: RegExp },
): void {
  assert.equal(decision.decision, expected.decision, stringify(decision, null, 2));
  assert.ok(
    decision.reasons.some(
      (r) =>
        r.route === expected.route &&
        (expected.subject?.test(r.subject) ?? true) &&
        expected.detail.test(r.detail),
    ),
    stringify(decision.reasons, null, 2),
  );
}

const target = (
  step: string,
  predicate: (t: VerificationTarget) => boolean,
): VerificationTarget => {
  const found = stepTargets(plan, step).find(predicate);
  assert.ok(found);
  return found;
};
const ACCEPTS_VALID = (): VerificationTarget =>
  target("CP99-S01", (t) => t.binding === "parser.accepts" && t.caseId === "valid");

/** A verifier that passes everything except `binding`, for which it plays `execution`. */
const defective = (
  binding: string,
  execution: (entries: ReportEntry[]) => Execution,
): OpenWorkspace => {
  const targets = stepTargets(plan, "CP99-S01");
  return scriptedVerifier((_, b) => {
    const entries = targets.filter((t) => t.binding === b).map(passing);
    return b === binding ? execution(entries) : { report: { results: entries } };
  });
};

function store<T extends object>(
  run: RunHandle,
  action: string,
  record: T,
  attempt = 1,
): Stored<T> {
  const ref = putEvidence(run, stringify(record));
  appendEvent(run, { action, attempt, evidence: [ref], data: {} });
  return { ref, record };
}

describe("T3-D binding registry", () => {
  it("validates code-owned bindings and pins each definition", () => {
    const bad: Binding[] = [
      { id: "Parser", method: "review", version: "1", rubric: ["x"] },
      { id: "a.b", method: "review", version: "", rubric: [] },
      {
        id: "c.d",
        method: "automated",
        version: "1",
        command: [],
        judge: [],
        files: ["../escape.mjs", "/abs.mjs"],
        timeoutMs: 0,
        observations: ["x", "x"],
      },
      { id: "c.d", method: "approval", version: "1", authority: " ", subject: "s" },
    ];
    const created = createRegistry(bad);
    assert.equal(created.ok, false);
    assert.deepEqual(created.ok ? [] : created.diagnostics, [
      "binding Parser: not a binding ID",
      "binding a.b: no version",
      "binding a.b: no rubric",
      "binding c.d: no command",
      "binding c.d: no judge",
      "binding c.d: files must be distinct normalised relative paths",
      "binding c.d: timeoutMs must be a positive integer",
      "binding c.d: observations must be distinct",
      "binding c.d: declared twice",
      "binding c.d: approval needs an authority and a subject",
    ]);
  });

  it("an automated binding's digest covers its definition and every file it runs", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    const b = await attemptOf(w, "CP99-S01", {
      files: { ...FILES["CP99-S01"]?.(), "verifiers/parser-subject.mjs": "// changed\n" },
    });
    const ids = ["parser.accepts", "repo.verify", "parser.single-path"];
    const before = bindingDigests(registry, a.tree, ids);
    const changed = bindingDigests(registry, b.tree, ids);
    assert.notEqual(before["parser.accepts"], changed["parser.accepts"]);
    assert.equal(before["repo.verify"], changed["repo.verify"]);
    assert.equal(before["parser.single-path"], registry.get("parser.single-path")?.digest);
    const missing = bindingDigests(registry, new Map(), ["repo.verify", "unregistered.binding"]);
    assert.deepEqual(Object.keys(missing), ["repo.verify"]);
    assert.notEqual(missing["repo.verify"], before["repo.verify"]);
  });

  it("a binding used with another method or missing from the registry pauses for its owner", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    const withoutReview = createRegistry(
      [...registry.values()].map((e) => e.binding).filter((b) => b.id !== "parser.single-path"),
    );
    assert.ok(withoutReview.ok);
    assertReason(decide(a, { registry: withoutReview.registry }), {
      decision: "pause",
      route: "owner",
      subject: /^parser\.single-path$/,
      detail: /no definition/,
    });
    const renamed = createRegistry([
      ...[...registry.values()].map((e) => e.binding).filter((b) => b.id !== "parser.single-path"),
      {
        id: "parser.single-path",
        method: "approval",
        version: "1",
        authority: "owner",
        subject: "x",
      },
    ]);
    assert.ok(renamed.ok);
    assertReason(decide(a, { registry: renamed.registry }), {
      decision: "pause",
      route: "owner",
      detail: /is a approval binding, used as review/,
    });
  });

  it("an owner reason pauses even when there is also something to correct", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      respond: () => calibration("known-bad").verdict,
    });
    assert.equal(decide(a).decision, "correct");
    const withoutRepo = createRegistry(
      [...registry.values()].map((e) => e.binding).filter((b) => b.id !== "repo.verify"),
    );
    assert.ok(withoutRepo.ok);
    const decision = decide(a, { registry: withoutRepo.registry });
    assertReason(decision, {
      decision: "pause",
      route: "owner",
      detail: /no definition of repo\.verify/,
    });
    assertReason(decision, { decision: "pause", route: "correct", detail: /loadConfig/ });
  });
});

describe("T3-D reviewer protocol", () => {
  it("reviewer sessions use the verdict schema; a producer submission from a reviewer is malformed", async () => {
    const submission = {
      status: "submitted",
      outputs: [],
      changes: [],
      verifier_proposals: [],
      blockers: [],
    };
    const provider = scriptedReviewer(() => submission);
    const built = buildPacket(plan, "CP99-S01", reviewerRole(), {
      attempt: 1,
      accepted: [],
      policy: PRODUCER,
    });
    assert.ok(built.ok);
    const outcome = await invokeAgent(
      reviewerRole(),
      built.packet,
      await reviewerWorkspaces()(A_SNAPSHOT),
      new AbortController().signal,
      {
        provider,
      },
    );
    assert.equal(outcome.outcome, "failed");
    assert.match(
      outcome.outcome === "failed" ? outcome.reason : "",
      /malformed result: .*unexpected field status/,
    );
    assert.deepEqual(provider.requests[0]?.outputSchema, VERDICT_SCHEMA);
    assert.notDeepEqual(VERDICT_SCHEMA, SUBMISSION_SCHEMA);
    assert.equal(Object.hasOwn(built.packet, "review"), false);
  });

  it("verdict free text is redacted while its enums and identities stay intact", async () => {
    const secret = "sk-ant-test-reviewer";
    const verdict: ReviewVerdict = {
      ...passVerdict(["CP99-S01/R01"]),
      findings: [
        {
          severity: "optional",
          rule: "CP99-S01/R01",
          location: "src/parser.mjs:1",
          defect: `leaks ${secret}`,
          correction: "remove it",
          basis: "inspection",
        },
      ],
    };
    const built = buildPacket(plan, "CP99-S01", reviewerRole(), {
      attempt: 1,
      accepted: [],
      policy: PRODUCER,
    });
    assert.ok(built.ok);
    const outcome = await invokeAgent(
      reviewerRole(),
      built.packet,
      await reviewerWorkspaces()(A_SNAPSHOT),
      new AbortController().signal,
      {
        provider: scriptedReviewer(() => verdict),
      },
    );
    assert.equal(outcome.outcome, "reviewed");
    assert.ok(!JSON.stringify(outcome).includes(secret));
    assert.ok(outcome.outcome === "reviewed");
    assert.equal(outcome.verdict.findings[0]?.defect, "leaks [REDACTED]");
    assert.equal(outcome.verdict.verdict, "pass");
    assert.equal(outcome.verdict.coverage[0]?.result, "satisfied");
    assert.equal(outcome.verdict.coverage[0]?.subject, "CP99-S01/R01");
  });

  it("the review packet carries the pinned rubric, every subject and target, and recorded evidence", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(a);
    let seen: Packet | undefined;
    await review(a, (p) => {
      seen = p;
      return approveAll(p);
    });
    assert.ok(seen?.review);
    assert.equal(seen.role, "reviewer");
    assert.equal(seen.review.kind, "candidate");
    assert.equal(seen.review.rubric.digest, COMMON_RUBRIC.digest);
    assert.deepEqual(seen.review.subjects, ["CP99-S01/R01", "CP99/R01", "CP99-S01/config-parser"]);
    assert.deepEqual(seen.review.targets.map(targetKey), [
      "CP99-S01/AC02/-/review/parser.single-path",
    ]);
    assert.deepEqual(
      seen.review.bindings.map((b) => b.id),
      ["parser.single-path"],
    );
    assert.deepEqual(seen.candidate?.commit, a.candidate.commit);
    const evidence = JSON.stringify(seen.review.evidence);
    for (const t of stepTargets(plan, "CP99-S01").filter((x) => x.method === "automated")) {
      assert.ok(evidence.includes(targetKey(t)), targetKey(t));
    }
    assert.ok(evidence.includes('"src/parser.mjs"'));
  });
});

describe("T3-D D01 observations that cannot count prevent acceptance", () => {
  it("control: complete, current evidence and a passing common review accept", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    const decision = decide(a);
    assert.equal(decision.decision, "accept", stringify(decision, null, 2));
    assert.ok(decision.decision === "accept");
    assert.deepEqual(decision.targets, stepTargets(plan, "CP99-S01").map(targetKey).sort());
    assert.deepEqual(
      decision.outputs.map((o) => o.output),
      ["config-parser"],
    );
    assert.ok(decision.evidence.includes(a.reviews[0]?.ref ?? "-"));
  });

  const cases: [string, (entries: ReportEntry[]) => Execution, RegExp][] = [
    [
      "a missing case",
      (e) => ({ report: { results: e.filter((x) => x.case !== "invalid") } }),
      /no result was reported/,
    ],
    [
      "a duplicate result",
      (e) => ({ report: { results: [...e, ...e.slice(0, 1)] } }),
      /2 results for one target/,
    ],
    [
      "an unexpected case",
      (e) => ({ report: { results: [...e, { ...e[0], case: "other" }] } }),
      /unexpected results/,
    ],
    [
      "another binding's result",
      (e) => ({ report: { results: [...e, { ...e[0], binding: "parser.rejects" }] } }),
      /unexpected results/,
    ],
    ["a report that is not JSON", () => ({ report: "passed!" }), /not JSON/],
    [
      "a schema-invalid report",
      (e) => ({ report: { results: e.map((x) => ({ ...x, outcome: "ok" })) } }),
      /report is malformed/,
    ],
    [
      "a skipped case",
      (e) => ({ report: { results: e.map((x) => ({ ...x, outcome: "skipped" })) } }),
      /skipped/,
    ],
    [
      "a pass without an assertion",
      (e) => ({ report: { results: e.map((x) => ({ ...x, assertions: 0 })) } }),
      /without an executed assertion/,
    ],
    [
      "a missing required observation",
      (e) => ({ report: { results: e.map((x) => ({ ...x, observations: {} })) } }),
      /missing observation input/,
    ],
    ["a judge that writes no report", () => ({}), /no report was written/],
    [
      "a pass claimed with a nonzero exit",
      (e) => ({ exit: 1, report: { results: e } }),
      /the judge exited 1/,
    ],
  ];
  for (const [name, execution, detail] of cases) {
    it(`${name} prevents acceptance, and a passing rerun cannot replace it`, async () => {
      const w = await world(scratch);
      const a = await complete(await attemptOf(w, "CP99-S01"), {
        verifier: defective("parser.accepts", execution),
      });
      await verify(a);
      const expected = { subject: /\/automated\/parser\.accepts$/, detail };
      assertReason(decide(a), { decision: "correct", route: "correct", ...expected });
      const outside = { writable: ["src"], scratch: [], protected: [] };
      assertReason(decide(a, { policy: outside }), {
        decision: "pause",
        route: "owner",
        ...expected,
      });
    });
  }

  it("a verifier workspace that fails to open prevents acceptance until a run completes", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(
      a,
      scriptedVerifier(() => ({}), { openError: "docker: daemon unavailable" }),
    );
    assertReason(decide(a), {
      decision: "pause",
      route: "retry",
      detail: /verifier did not run: docker: daemon unavailable/,
    });
    // The verifier never ran, so running it is not a reroll.
    await verify(a);
    await review(a);
    assert.equal(decide(a).decision, "accept");
  });

  it("a cross-attempt record prevents acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    assertReason(decide(a, { attempt: 2 }), {
      decision: "pause",
      route: "retry",
      detail: /belongs to attempt 1, not 2/,
    });
  });

  it("a stale record from another evaluation prevents acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    const manifest = { ...a.manifest, configuration: evaluationDigest(a.manifest) };
    assertReason(decide(a, { manifest }), {
      decision: "pause",
      route: "retry",
      detail: /is stale/,
    });
  });

  it("a record that is not in the committed journal prevents acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    const [first] = a.invocations;
    assert.ok(first);
    const record = { ...first.record, id: randomUUID() };
    const unjournaled = { ref: putEvidence(w.run, stringify(record)), record };
    assertReason(decide(a, { invocations: [...a.invocations, unjournaled] }), {
      decision: "pause",
      route: "retry",
      detail: /not in the committed journal/,
    });
  });

  it("a record altered after it was stored prevents acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      verifier: defective("parser.accepts", (e) => ({
        subjectExit: 1,
        report: { results: e.map((x) => ({ ...x, outcome: "failed", message: "wrong" })) },
      })),
    });
    const forged = a.invocations.map(({ ref, record }) => ({
      ref,
      record: {
        ...record,
        results: record.results.map((r) => ({
          target: r.target,
          outcome: "passed" as const,
          assertions: 1,
          observations: {},
        })),
      },
    }));
    const decision = decide(a, { invocations: forged });
    assertReason(decision, {
      decision: "pause",
      route: "retry",
      detail: /does not match its evidence reference/,
    });
  });

  it("an invocation of a binding the step does not need prevents acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    const [first] = a.invocations;
    assert.ok(first);
    const extra = store(w.run, "verifier-invocation", {
      ...first.record,
      id: randomUUID(),
      binding: "command.prints",
    });
    assertReason(decide(a, { invocations: [...a.invocations, extra] }), {
      decision: "pause",
      route: "retry",
      detail: /has no automated target of command\.prints/,
    });
  });

  it("a report with one failure fails only that target", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      verifier: defective("parser.accepts", (e) => ({
        subjectExit: 1,
        report: {
          results: e.map((x) =>
            x.case === "invalid"
              ? { ...x, outcome: "failed", message: "accepted a blank name" }
              : x,
          ),
        },
      })),
    });
    const accepts = a.invocations.find((i) => i.record.binding === "parser.accepts")?.record;
    assert.deepEqual(
      accepts?.results.map((r) => [targetKey(r.target), r.outcome]),
      [
        ["CP99-S01/AC01/valid/automated/parser.accepts", "passed"],
        ["CP99-S01/AC01/invalid/automated/parser.accepts", "failed"],
      ],
    );
    const decision = decide(a);
    assertReason(decision, {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/AC01\/invalid\/automated\/parser\.accepts$/,
      detail: /accepted a blank name/,
    });
    assert.deepEqual(
      decision.decision === "correct" ? decision.reasons.map((r) => r.subject) : [],
      ["CP99-S01/AC01/invalid/automated/parser.accepts"],
    );
  });

  it("a subject run that times out fails only its own target", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    const targets = stepTargets(plan, "CP99-S01");
    await verify(
      a,
      scriptedVerifier((_, b, target) => ({
        subjectTimedOut: b === "parser.accepts" && target === "CP99-S01/AC01/invalid",
        report: { results: targets.filter((t) => t.binding === b).map(passing) },
      })),
    );
    await review(a);
    const accepts = a.invocations.find((i) => i.record.binding === "parser.accepts")?.record;
    assert.deepEqual(
      accepts?.results.map((r) => [targetKey(r.target), r.outcome]),
      [
        ["CP99-S01/AC01/valid/automated/parser.accepts", "passed"],
        ["CP99-S01/AC01/invalid/automated/parser.accepts", "failed"],
      ],
    );
    assertReason(decide(a), {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/AC01\/invalid\/automated\/parser\.accepts$/,
      detail: /the subject timed out after 30000 ms/,
    });
  });

  it("candidate code that prints forged observations and exits cannot pass the real judges", async () => {
    // The fixture subject and judge scripts run for real, as local processes.
    // Each forger has no parser: on import it prints observations and exits 0
    // before the subject's own code runs. The first prints every case in both
    // the old and the current observation shapes; the others print one
    // outcome whatever the case.
    const valid = '{"name": " demo "}';
    const invalid = '{"name": "  "}';
    const lines = {
      "every case": [
        { case: "valid", input: valid, returned: { name: "demo" } },
        { case: "invalid", input: invalid, threw: "name must not be blank" },
        { input: valid, returned: { name: "demo" } },
        { input: invalid, threw: "name must not be blank" },
      ],
      "a return": [{ input: valid, returned: { name: "demo" } }],
      "a rejection": [{ input: invalid, threw: "name must not be blank" }],
    };
    for (const [forgery, printed] of Object.entries(lines)) {
      const forger = [
        ...printed.map((o) => `console.log(${JSON.stringify(JSON.stringify(o))});`),
        "process.exit(0);",
        'export function parseConfig() { throw new Error("not implemented"); }',
        "",
      ].join("\n");
      const w = await world(scratch);
      const a = await attemptOf(w, "CP99-S01", { files: { "src/parser.mjs": forger } });
      const local = localWorkspaces(w.run, join(scratch, `local-${randomUUID()}`));
      await admit(a, { verifier: local });
      await verify(a, local);
      await review(a);
      const results = a.invocations
        .filter((i) => i.record.binding.startsWith("parser."))
        .flatMap((i) => i.record.results);
      assert.equal(results.length, 4, forgery);
      for (const binding of ["parser.accepts", "parser.rejects"]) {
        const own = results.filter((r) => r.target.binding === binding);
        assert.ok(
          own.some((r) => r.outcome === "failed"),
          `${forgery}: ${binding} ${JSON.stringify(own)}`,
        );
      }
      if (forgery === "every case") {
        assert.deepEqual(
          results.map((r) => r.outcome),
          ["failed", "failed", "failed", "failed"],
        );
      }
      assert.equal(decide(a).decision, "correct", forgery);
    }
  });

  it("a failure to stop a workspace keeps the executed result it followed", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    const failing = (e: ReportEntry[]): Execution => ({
      report: {
        results: e.map((x) =>
          x.case === "valid" ? { ...x, outcome: "failed", message: "rejected a valid name" } : x,
        ),
      },
    });
    const targets = stepTargets(plan, "CP99-S01");
    await verify(
      a,
      scriptedVerifier(
        (_, b) => {
          const entries = targets.filter((t) => t.binding === b).map(passing);
          return b === "parser.accepts" ? failing(entries) : { report: { results: entries } };
        },
        { closeError: "docker rm: device busy" },
      ),
    );
    const accepts = a.invocations.find((i) => i.record.binding === "parser.accepts")?.record;
    assert.match(accepts?.cleanup ?? "", /docker rm: device busy/);
    assert.deepEqual(
      accepts?.results.map((r) => r.outcome),
      ["failed", "passed"],
    );
    await verify(a);
    await review(a);
    assertReason(decide(a), {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/AC01\/valid\/automated\/parser\.accepts$/,
      detail: /rejected a valid name/,
    });
  });

  it("a rerun cannot replace a failed result; repeated passes still accept", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(
      a,
      defective("parser.accepts", (e) => ({
        subjectExit: 1,
        report: {
          results: e.map((x) => ({ ...x, outcome: "failed", message: "rejected a valid name" })),
        },
      })),
    );
    await verify(a);
    await review(a);
    assertReason(decide(a), {
      decision: "correct",
      route: "correct",
      subject: /\/automated\/parser\.accepts$/,
      detail: /rejected a valid name/,
    });
    const b = await attemptOf(w, "CP99-S01", { attempt: 2 });
    await admit(b);
    await verify(b);
    await verify(b);
    await review(b);
    assert.equal(decide(b).decision, "accept");
  });

  it("code under test gets no report channel, and the judge runs without candidate code", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    const verifier = passes("CP99-S01");
    await verify(a, verifier);
    for (const call of verifier.calls) {
      assert.ok(!call.argv.some((x) => x.startsWith("PACTWRIGHT_REPORT")), call.argv.join(" "));
      const binding = registry.get(call.binding)?.binding;
      assert.ok(binding?.method === "automated");
      if (call.role === "subject") {
        assert.equal(call.snapshot.commit, a.candidate.commit);
        assert.equal(call.snapshot.tree, a.candidate.tree);
        assert.equal(call.stdin, "");
        continue;
      }
      // The judge's workspace holds the binding's files and nothing else.
      assert.deepEqual(
        [...candidateTree(w.run, call.snapshot).keys()].sort(),
        [...binding.files].sort(),
      );
      // It is shown each subject run under the target the controller ran it for.
      const shown = JSON.parse(call.stdin) as {
        binding: string;
        runs: { owner: string; criterion: string; case: string | null }[];
      };
      assert.equal(shown.binding, call.binding);
      assert.deepEqual(
        shown.runs.map((r) => `${r.owner}/${r.criterion}/${r.case ?? "-"}`),
        verifier.calls
          .filter((c) => c.role === "subject" && c.binding === call.binding)
          .map((c) => c.target),
      );
    }
    for (const { record } of a.invocations) {
      assert.ok(record.judge);
      assert.notEqual(record.judge.snapshot.commit, a.candidate.commit);
      const binding = registry.get(record.binding)?.binding;
      assert.ok(binding?.method === "automated");
      assert.deepEqual(
        [...candidateTree(w.run, record.judge.snapshot).keys()].sort(),
        [...binding.files].sort(),
      );
    }
  });

  it("each binding sharing a command runs as its own recorded invocation", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    const verifier = passes("CP99-S01");
    await verify(a, verifier);
    // The subject runs once per target, as its own process.
    const subjects = verifier.calls.filter((c) => c.role === "subject");
    assert.deepEqual(
      subjects.map((c) => `${c.binding} ${c.target}`),
      [
        "parser.accepts CP99-S01/AC01/valid",
        "parser.accepts CP99-S01/AC01/invalid",
        "parser.rejects CP99-S01/AC01/valid",
        "parser.rejects CP99-S01/AC01/invalid",
        "repo.verify CP99/AC01/-",
      ],
    );
    for (const c of subjects.slice(0, 4)) {
      assert.deepEqual(c.argv.slice(-2), ["node", "verifiers/parser-subject.mjs"]);
    }
    const ids = a.invocations.map((i) => i.record.id);
    assert.equal(new Set(ids).size, 3);
    const events = readRun(w.run.dir);
    assert.ok(events.ok);
    const recorded = events.records.events.filter(
      (e) => e.action === "verifier-invocation" && e.data.stage === "acceptance",
    );
    assert.deepEqual(
      recorded.map((e) => e.data.invocation),
      ids,
    );
  });
});

describe("T3-D D02 a proposed verifier counts only after adequacy and a fresh run", () => {
  const WEAK = "CP99-S01/AC01/invalid/automated/parser.rejects";
  const rejectWeak = (p: Packet): ReviewVerdict => {
    const subjects = p.review?.subjects ?? [];
    if (!subjects.includes(WEAK)) return approveAll(p);
    return {
      verdict: "changes-required",
      coverage: subjects.map((subject) => ({
        subject,
        result: subject === WEAK ? "unsatisfied" : "satisfied",
        basis: "inspection",
        note: subject === WEAK ? "never feeds an invalid configuration" : "adequate",
      })),
      targets: [],
      findings: [
        {
          severity: "blocking",
          rule: WEAK,
          location: "verifiers/parser-subject.mjs:14",
          defect: "the invalid case calls parseConfig on a valid input, so any parser passes",
          correction: "feed the blank-name input and assert the rejection names the field",
          basis: "inspection",
        },
      ],
      blockers: [],
    };
  };
  const weakFiles = (): Record<string, string> => ({
    ...FILES["CP99-S01"]?.(),
    "verifiers/parser-subject.mjs": "// weak: asserts nothing about invalid input\n",
  });

  it("a weak proposed verifier is rejected with a precise test defect and gets no pin", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01", { files: weakFiles() });
    const admitted = await admit(a, { adequacy: rejectWeak });
    const rejected = admitted.find((s) => s.record.binding === "parser.rejects")?.record;
    assert.equal(rejected?.outcome, "rejected");
    assert.deepEqual(rejected?.findings, [
      {
        rule: WEAK,
        location: "verifiers/parser-subject.mjs:14",
        defect: "the invalid case calls parseConfig on a valid input, so any parser passes",
        correction: "feed the blank-name input and assert the rejection names the field",
      },
    ]);
    const verifier = passes("CP99-S01");
    await verify(a, verifier);
    assert.ok(!verifier.calls.some((c) => c.binding === "parser.rejects"));
    await review(a);
    const decision = decide(a);
    assertReason(decision, {
      decision: "correct",
      route: "correct",
      subject: new RegExp(`^${WEAK}$`),
      detail: /any parser passes/,
    });
    assert.ok(decision.decision === "correct");
    assert.ok(
      decision.reasons.find((r) => r.subject === WEAK)?.requirements.includes("CP99-S01/R01"),
    );
    assert.ok(
      decision.findings.some(
        (f) => f.rule === WEAK && f.location === "verifiers/parser-subject.mjs:14",
      ),
    );
    // The rejected proposal's provisional run passed every case, yet none of it counts.
    const provisional = readRun(w.run.dir);
    assert.ok(provisional.ok);
    assert.ok(
      provisional.records.events.some(
        (e) =>
          e.action === "verifier-invocation" &&
          e.data.binding === "parser.rejects" &&
          e.data.stage === "provisional",
      ),
    );
  });

  it("an incomplete provisional run is rejected without calling the reviewer", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    const provider = scriptedReviewer(approveAll);
    const admission = await admitVerifier(w.run, {
      plan,
      step: "CP99-S01",
      registry,
      binding: "parser.rejects",
      candidate: a.candidate,
      attempt: 1,
      manifest: a.manifest,
      accepted: [],
      open: defective("parser.rejects", (e) => ({
        report: { results: e.filter((x) => x.case === "valid") },
      })),
      reviewer: { ...access(), provider },
    });
    assert.equal(admission.record.outcome, "rejected");
    assert.equal(provider.requests.length, 0);
    assert.equal(admission.record.review, null);
    assert.deepEqual(
      admission.record.findings.map((f) => [f.rule, f.defect]),
      [[WEAK, "provisional run: no result was reported"]],
    );
  });

  it("a rejected digest stays rejected: a later approval of it cannot count", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01", { files: weakFiles() });
    await admit(a, { adequacy: rejectWeak });
    const [again] = await admit(a, { bindings: ["parser.rejects"] });
    assert.equal(again?.record.outcome, "approved");
    const verifier = passes("CP99-S01");
    await verify(a, verifier);
    assert.ok(!verifier.calls.some((c) => c.binding === "parser.rejects"));
    await review(a);
    assertReason(decide(a), {
      decision: "correct",
      route: "correct",
      subject: new RegExp(`^${WEAK}$`),
      detail: /any parser passes/,
    });
  });

  it("a verifier that never ran is not reviewed, and its admission may be repeated", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    const provider = scriptedReviewer(approveAll);
    const unrun = await admitVerifier(w.run, {
      plan,
      step: "CP99-S01",
      registry,
      binding: "repo.verify",
      candidate: a.candidate,
      attempt: 1,
      manifest: a.manifest,
      accepted: [],
      open: scriptedVerifier(() => ({}), { openError: "docker: daemon unavailable" }),
      reviewer: { ...access(), provider },
    });
    assert.equal(unrun.record.outcome, "invalid");
    assert.equal(provider.requests.length, 0);
    assert.match(unrun.record.reasons[0] ?? "", /docker: daemon unavailable/);
    a.admissions.push(unrun);
    await admit(a);
    await verify(a);
    await review(a);
    assert.equal(decide(a).decision, "accept");
  });

  it("an admission whose review was incomplete may be repeated", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    const [incomplete] = await admit(a, {
      bindings: ["repo.verify"],
      adequacy: () => ({ verdict: "pass", coverage: [], targets: [], findings: [], blockers: [] }),
    });
    assert.equal(incomplete?.record.outcome, "invalid");
    await admit(a);
    await verify(a);
    await review(a);
    assert.equal(decide(a).decision, "accept");
  });

  it("a provisional rejection binds only its own evaluation", async () => {
    const w = await world(scratch);
    const first = await attemptOf(w, "CP99-S01");
    const [rejected] = await admit(first, {
      bindings: ["repo.verify"],
      verifier: defective("repo.verify", () => ({})),
    });
    assert.equal(rejected?.record.outcome, "rejected");
    assert.equal(rejected?.record.review, null);
    // The same verifier on a corrected candidate is a new evaluation: it is admitted afresh.
    const a = await attemptOf(w, "CP99-S01", {
      files: { ...FILES["CP99-S01"]?.(), "src/extra.mjs": "export const extra = 1;\n" },
      attempt: 2,
    });
    a.admissions.push(...first.admissions);
    assertReason(decide(a), { decision: "pause", route: "retry", detail: /admit it first/ });
    await admit(a);
    await verify(a);
    await review(a);
    assert.equal(decide(a).decision, "accept");
  });

  it("a valid replacement passes adequacy, and only its fresh acceptance run counts", async () => {
    const w = await world(scratch);
    const first = await attemptOf(w, "CP99-S01", { files: weakFiles() });
    await admit(first, { adequacy: rejectWeak });
    const a = await attemptOf(w, "CP99-S01", {
      files: {
        ...FILES["CP99-S01"]?.(),
        "verifiers/parser-subject.mjs": "// adequate replacement\n",
      },
      attempt: 2,
    });
    const replaced = await admit(a);
    a.admissions.unshift(...first.admissions);
    assert.deepEqual(
      replaced.map((s) => s.record.outcome),
      ["approved", "approved", "approved"],
    );
    // Provisional passes alone never accept, even when the controller supplies them.
    const provisional = replaced.map(({ record }): Stored<Invocation> => {
      assert.ok(record.provisional);
      const bytes = readEvidence(w.run.dir, record.provisional).toString("utf8");
      return { ref: record.provisional, record: JSON.parse(bytes) as Invocation };
    });
    assert.ok(provisional.every((p) => p.record.results.every((r) => r.outcome === "passed")));
    const provisionalOnly = { ...a, invocations: provisional, reviews: [] };
    await review(provisionalOnly);
    assertReason(decide(provisionalOnly), {
      decision: "pause",
      route: "retry",
      detail: /no acceptance result/,
    });
    await verify(a);
    assert.ok(a.invocations.every((i) => i.record.stage === "acceptance"));
    assert.ok(a.invocations.every((i) => !replaced.some((s) => s.record.provisional === i.ref)));
    await review(a);
    const decision = decide(a);
    assert.equal(decision.decision, "accept", stringify(decision, null, 2));
    const rejectsPin = replaced.find((s) => s.record.binding === "parser.rejects");
    assert.ok(rejectsPin && decision.evidence.includes(rejectsPin.ref));
    // Within the step a revised verifier is admitted again; other steps must not change it.
    assert.deepEqual(protectedVerifierPaths(registry, a.admissions, "CP99-S01"), []);
    assert.deepEqual(protectedVerifierPaths(registry, a.admissions, "CP99-S02"), [
      "verifiers/parser-judge.mjs",
      "verifiers/parser-subject.mjs",
      "verifiers/repo-judge.mjs",
      "verifiers/repo-subject.mjs",
    ]);
  });

  it("a verifier approved for another step is protected: a change is not run and pauses for its owner", async () => {
    const w = await world(scratch);
    const approved = await attemptOf(w, "CP99-S01");
    await admit(approved);
    const a = await attemptOf(w, "CP99-S02", {
      files: {
        ...FILES["CP99-S02"]?.(),
        "verifiers/repo-subject.mjs": "// edited after approval\n",
      },
    });
    a.admissions.push(...approved.admissions);
    const verifier = scriptedVerifier((_, b) => ({
      report: {
        results: stepTargets(plan, "CP99-S02")
          .filter((t) => t.binding === b)
          .map(passing),
      },
    }));
    await admit(a, { verifier, bindings: ["command.prints"] });
    await verify(a, verifier);
    assert.deepEqual(
      verifier.calls.filter((c) => c.role === "subject").map((c) => c.binding),
      ["command.prints", "command.prints"],
    );
    // An approval of the changed verifier within this step does not lift the protection.
    await admit(a, { verifier, bindings: ["repo.verify"] });
    assert.equal(a.admissions.at(-1)?.record.outcome, "approved");
    await review(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "owner",
      subject: /^repo\.verify$/,
      detail: /approved verifier of CP99-S01 changed/,
    });
  });

  it("a verifier revised within its step needs a new admission before it counts", async () => {
    const w = await world(scratch);
    const approved = await attemptOf(w, "CP99-S01");
    await admit(approved);
    const a = await attemptOf(w, "CP99-S01", {
      files: {
        ...FILES["CP99-S01"]?.(),
        "verifiers/parser-subject.mjs": "// revised in a correction\n",
      },
      attempt: 2,
    });
    a.admissions.push(...approved.admissions);
    const verifier = passes("CP99-S01");
    await verify(a, verifier);
    assert.deepEqual(
      verifier.calls.filter((c) => c.role === "subject").map((c) => c.binding),
      ["repo.verify"],
    );
    await review(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "retry",
      subject: /^parser\.accepts$/,
      detail: /has no approved admission/,
    });
  });

  it("a verifier without an admission is not run and cannot count", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await verify(a);
    assert.equal(a.invocations.length, 0);
    await review(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "retry",
      detail: /has no approved admission/,
    });
  });

  it("a missing verifier is producer work in scope and an owner's outside it", async () => {
    const w = await world(scratch);
    const a = await complete(
      await attemptOf(w, "CP99-S01", { removed: ["verifiers/repo-subject.mjs"] }),
    );
    assertReason(decide(a), {
      decision: "correct",
      route: "correct",
      subject: /^repo\.verify$/,
      detail: /verifiers\/repo-subject\.mjs of repo\.verify are not in the candidate/,
    });
    assertReason(decide(a, { policy: { writable: ["src"], scratch: [], protected: [] } }), {
      decision: "pause",
      route: "owner",
      detail: /outside the producer's writable paths/,
    });
    // Even an approval of exactly this digest cannot make an absent verifier count.
    const [rejected] = a.admissions.filter((s) => s.record.binding === "repo.verify");
    assert.equal(rejected?.record.outcome, "rejected");
    assert.ok(rejected);
    const approved = store(w.run, "verifier-admission", {
      ...rejected.record,
      outcome: "approved",
      review: rejected.ref,
      findings: [],
    } satisfies Admission);
    assertReason(decide(a, { admissions: [...a.admissions, approved] }), {
      decision: "correct",
      route: "correct",
      subject: /^repo\.verify$/,
      detail: /are not in the candidate/,
    });
  });
});

describe("T3-D D03 defects and missing outputs are requirement-linked; nits do not block", () => {
  it("the known-bad calibration record is rejected, linked to CP99-S01/R01", async () => {
    const record = calibration("known-bad");
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, record.step, { files: record.files }), {
      respond: () => record.verdict,
    });
    const decision = decide(a);
    assert.equal(decision.decision, record.expected.decision, stringify(decision, null, 2));
    assert.ok(decision.decision === "correct");
    assert.deepEqual(
      decision.reasons.map((r) => r.subject).sort(),
      [...(record.expected.rules ?? [])].sort(),
    );
    for (const r of decision.reasons)
      assert.deepEqual(r.requirements, record.expected.requirements);
    // Every automated target passed: the rejection is the review's.
    assert.ok(a.invocations.every((i) => i.record.results.every((r) => r.outcome === "passed")));
    // The findings feed the next production packet unchanged.
    const next = buildPacket(
      plan,
      "CP99-S01",
      { name: "producer", skills: [] },
      {
        attempt: 2,
        accepted: [],
        policy: PRODUCER,
        findings: decision.findings,
      },
    );
    assert.ok(next.ok);
    assert.deepEqual(next.packet.findings, decision.findings);
    assert.ok(decision.findings.some((f) => f.location === "src/parser.mjs:11"));
  });

  it("a missing output or an absent output path is rejected against the output", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"));
    assertReason(decide(a, { claims: [] }), {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/config-parser$/,
      detail: /no path was produced/,
    });
    assertReason(decide(a, { claims: [{ output: "config-parser", paths: ["src/absent.mjs"] }] }), {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/config-parser$/,
      detail: /src\/absent\.mjs is not in the candidate/,
    });
    assertReason(
      decide(a, { claims: [...a.claims, { output: "bonus", paths: ["src/parser.mjs"] }] }),
      {
        decision: "correct",
        route: "correct",
        subject: /^CP99-S01\/bonus$/,
        detail: /not an output of the step/,
      },
    );
  });

  it("an inventoried output the review could not assess is never a proof", async () => {
    const w = await world(scratch);
    const unassessed = (p: Packet): ReviewVerdict => {
      const v = approveAll(p);
      return {
        ...v,
        coverage: v.coverage.map((c) =>
          c.subject === "CP99-S01/config-parser" ? { ...c, result: "not-assessed" } : c,
        ),
      };
    };
    const a = await complete(await attemptOf(w, "CP99-S01"), { respond: unassessed });
    // A complete verdict binds: a later clean pass cannot replace it.
    await review(a);
    const decision = decide(a);
    assertReason(decision, {
      decision: "pause",
      route: "owner",
      subject: /^CP99-S01\/config-parser$/,
      detail: /could not assess it/,
    });
    assertReason(decision, {
      decision: "pause",
      route: "owner",
      detail: /contradicts itself: the verdict is pass, yet an item is unmet, not assessed/,
    });
    const blocked = await complete(await attemptOf(w, "CP99-S01"), {
      respond: (p) => ({
        ...unassessed(p),
        verdict: "blocked",
        blockers: ["cannot run the parser"],
      }),
    });
    assertReason(decide(blocked), {
      decision: "pause",
      route: "owner",
      detail: /reviewer is blocked: cannot run the parser/,
    });
  });

  it("optional nits alone do not block: the known-good record accepts", async () => {
    const record = calibration("known-good");
    assert.ok(record.verdict.findings.length > 0);
    assert.ok(record.verdict.findings.every((f) => f.severity === "optional"));
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, record.step, { files: record.files }), {
      respond: () => record.verdict,
    });
    assert.equal(decide(a).decision, record.expected.decision);
  });

  type Mutation = [string, (v: ReviewVerdict) => ReviewVerdict, RegExp];
  const incomplete: Mutation[] = [
    [
      "a missing coverage entry",
      (v) => ({ ...v, coverage: v.coverage.slice(1) }),
      /coverage has 0 entries for CP99-S01\/R01/,
    ],
    [
      "an unknown subject",
      (v) => ({
        ...v,
        coverage: [
          ...v.coverage,
          { subject: "CP99-S01/R07", result: "satisfied", basis: "executed", note: "met" },
        ],
      }),
      /coverage names unknown CP99-S01\/R07/,
    ],
    [
      "a missing review target",
      (v) => ({ ...v, targets: [] }),
      /targets has 0 entries for CP99-S01\/AC02/,
    ],
  ];
  for (const [name, mutate, detail] of incomplete) {
    it(`a review with ${name} is incomplete: it never passes, and another review may follow`, async () => {
      const w = await world(scratch);
      const a = await complete(await attemptOf(w, "CP99-S01"), {
        respond: (p) => mutate(approveAll(p)),
      });
      assertReason(decide(a), { decision: "pause", route: "retry", subject: /^review$/, detail });
      await review(a);
      assert.equal(decide(a).decision, "accept");
    });
  }

  const contradictory: Mutation[] = [
    [
      "a blocking finding on an unknown rule",
      (v) => ({
        ...v,
        verdict: "changes-required",
        findings: [
          {
            severity: "blocking",
            rule: "CP99-S01/R09",
            location: "x",
            defect: "d",
            correction: "c",
            basis: "inspection",
          },
        ],
      }),
      /cites CP99-S01\/R09, which is not recorded as unmet/,
    ],
    [
      "a pass with an unmet subject",
      (v) => ({
        ...v,
        coverage: v.coverage.map((c) => ({ ...c, result: "unsatisfied" as const })),
      }),
      /the verdict is pass, yet an item is unmet/,
    ],
    [
      "changes-required without a blocking finding",
      (v) => ({ ...v, verdict: "changes-required" }),
      /changes-required without a blocking finding/,
    ],
  ];
  for (const [name, mutate, detail] of contradictory) {
    it(`a complete review with ${name} binds and pauses; a later pass cannot replace it`, async () => {
      const w = await world(scratch);
      const a = await complete(await attemptOf(w, "CP99-S01"), {
        respond: (p) => mutate(approveAll(p)),
      });
      await review(a);
      assertReason(decide(a), { decision: "pause", route: "owner", subject: /^review$/, detail });
    });
  }

  it("an incomplete review that judged against the candidate binds; a later pass cannot replace it", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      respond: (p) => {
        const v = approveAll(p);
        return {
          ...v,
          coverage: v.coverage
            .slice(1)
            .map((c) => (c.subject === "CP99/R01" ? { ...c, result: "unsatisfied" as const } : c)),
        };
      },
    });
    await review(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "owner",
      subject: /^review$/,
      detail: /incomplete review judged against: CP99\/R01 unsatisfied/,
    });
  });

  it("the reviewer must have been shown the outputs being accepted", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01", {
      files: { ...FILES["CP99-S01"]?.(), "src/other.mjs": "export const other = 1;\n" },
    });
    await complete(a);
    assert.equal(decide(a).decision, "accept");
    assertReason(decide(a, { claims: [{ output: "config-parser", paths: ["src/other.mjs"] }] }), {
      decision: "pause",
      route: "retry",
      subject: /^CP99-S01\/config-parser$/,
      detail: /shown other paths/,
    });
  });

  it("a review runs in a workspace opened from the candidate; any other workspace is refused", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(a);
    const opener = reviewerWorkspaces();
    await reviewCandidate(w.run, {
      plan,
      step: a.step,
      registry,
      candidate: a.candidate,
      attempt: a.attempt,
      manifest: a.manifest,
      accepted: [],
      claims: a.claims,
      reviewer: { ...access(), open: opener },
    });
    assert.deepEqual(
      opener.opened.map((s) => s.commit),
      [a.candidate.commit],
    );
    const stale = reviewerWorkspaces(w.base);
    const reviews = (): number => {
      const read = readRun(w.run.dir);
      assert.ok(read.ok);
      return read.records.events.filter((e) => e.action === "review").length;
    };
    const before = reviews();
    await assert.rejects(
      reviewCandidate(w.run, {
        plan,
        step: a.step,
        registry,
        candidate: a.candidate,
        attempt: a.attempt,
        manifest: a.manifest,
        accepted: [],
        claims: a.claims,
        reviewer: { ...access(), open: stale },
      }),
      /reviewer workspace holds .*, not the candidate/,
    );
    assert.equal(reviews(), before, "no review is recorded");
  });

  it("a review counts only for the exact runs it was shown", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(a);
    await review(a);
    const [shown] = a.reviews;
    assert.deepEqual(
      [...(shown?.record.invocations ?? [])].sort(),
      a.invocations.map((i) => i.ref).sort(),
      "the review was shown this attempt's journaled acceptance runs",
    );
    assert.equal(decide(a).decision, "accept");
    // A run the reviewer never saw, or a run it saw that is no longer counted,
    // breaks the match.
    await verify(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "retry",
      subject: /^review$/,
      detail: /the review was shown runs .*, not the counted/,
    });
    assertReason(decide(a, { invocations: a.invocations.slice(1, 3) }), {
      decision: "pause",
      route: "retry",
      subject: /^review$/,
      detail: /the review was shown runs/,
    });
    assert.equal(recordDecision(w.run, recordInput(a)).decision.decision, "pause");
    // A review held before the runs were journaled was shown none of them.
    const b = await attemptOf(w, "CP99-S01", { attempt: 2 });
    await admit(b);
    await review(b);
    assert.deepEqual(b.reviews[0]?.record.invocations, []);
    await verify(b);
    const { decision } = recordDecision(w.run, recordInput(b));
    assertReason(decision, {
      decision: "pause",
      route: "retry",
      subject: /^review$/,
      detail: /the review was shown runs \(none\), not the counted sha256:/,
    });
  });

  it("the first complete verdict binds: a later pass cannot replace a rejection", async () => {
    const record = calibration("known-bad");
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01", { files: record.files }), {
      respond: () => record.verdict,
    });
    await review(a);
    assert.equal(a.reviews.length, 2);
    assert.equal(decide(a).decision, "correct");
    const b = await complete(await attemptOf(w, "CP99-S01"), {
      respond: () => ({ verdict: "pass" }),
    });
    await review(b);
    assert.equal(decide(b).decision, "accept", "a protocol failure may be replaced");
  });
});

describe("T3-D D04 complete evidence, common review and exact approvals accept", () => {
  it("the known-good record accepts and only the controller journals the acceptance", async () => {
    const record = calibration("known-good");
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, record.step, { files: record.files }), {
      respond: () => record.verdict,
    });
    const recorded = recordDecision(w.run, recordInput(a));
    assert.equal(recorded.decision.decision, "accept");
    assert.deepEqual(recorded.accepted, [
      {
        step: "CP99-S01",
        output: "config-parser",
        definition: plan.stepDefinitions["CP99-S01"],
        definitions: plan.definitionsDigest,
        evidence: [recorded.ref],
      },
    ]);
    const read = readRun(w.run.dir);
    assert.ok(read.ok);
    const acceptances = read.records.events.filter((e) => e.action === "acceptance");
    assert.equal(acceptances.length, 1);
    assert.deepEqual(acceptances[0]?.evidence, [recorded.ref]);
    assert.equal(acceptances[0]?.evaluation, evaluationDigest(a.manifest));
    assert.deepEqual(nextEligible(plan, { outputs: recorded.accepted, capabilities: [] }), {
      kind: "dispatch",
      step: "CP99-S02",
    });
  });

  it("a favourable review cannot override a failed binding", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      verifier: defective("parser.accepts", (e) => ({
        subjectExit: 1,
        report: {
          results: e.map((x) =>
            x.case === "valid" ? { ...x, outcome: "failed", message: "rejected a valid name" } : x,
          ),
        },
      })),
    });
    assert.equal(a.reviews[0]?.record.outcome.outcome, "reviewed");
    const decision = decide(a);
    assertReason(decision, {
      decision: "correct",
      route: "correct",
      subject: new RegExp(`^${targetKey(ACCEPTS_VALID()).replaceAll(".", "\\.")}$`),
      detail: /rejected a valid name/,
    });
    assert.ok(decision.decision === "correct");
    assert.ok(decision.reasons.some((r) => r.requirements.includes("CP99-S01/R01")));
  });

  it("common review is required even when no criterion names a review binding", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S02");
    assert.ok(stepTargets(plan, "CP99-S02").every((t) => t.method !== "review"));
    await admit(a);
    await verify(a);
    assertReason(decide(a), {
      decision: "pause",
      route: "retry",
      detail: /common independent review is missing/,
    });
    await review(a);
    assert.equal(decide(a).decision, "accept");
  });

  const APPROVAL = (): VerificationTarget => target("CP99-S03", (t) => t.method === "approval");
  async function approvalAttempt(): Promise<Attempt> {
    const w = await world(scratch);
    return complete(await attemptOf(w, "CP99-S03"));
  }
  const approve = (a: Attempt, overrides: Partial<Approval> = {}): void => {
    a.approvals.push(
      store(a.w.run, "approval", {
        run: a.w.run.run,
        target: APPROVAL(),
        authority: "owner",
        actor: "fixture-owner",
        decision: "approved",
        candidate: a.candidate.commit,
        evaluation: evaluationDigest(a.manifest),
        ...overrides,
      } satisfies Approval),
    );
  };

  it("an exact approval of the exact evaluation accepts; a technical pass alone does not", async () => {
    const a = await approvalAttempt();
    assertReason(decide(a), {
      decision: "pause",
      route: "approval",
      detail: /awaiting approval by owner/,
    });
    approve(a);
    const decision = decide(a);
    assert.equal(decision.decision, "accept", stringify(decision, null, 2));
    assert.ok(decision.decision === "accept");
    assert.ok(decision.targets.includes(targetKey(APPROVAL())));
  });

  const wrong: [string, Partial<Approval>, RegExp][] = [
    ["denied", { decision: "denied" }, /denied by fixture-owner/],
    [
      "by another authority",
      { authority: "maintainer" },
      /another authority, candidate or evaluation/,
    ],
    [
      "of another candidate",
      { candidate: "0".repeat(40) },
      /another authority, candidate or evaluation/,
    ],
    [
      "of another evaluation",
      { evaluation: `sha256:${"0".repeat(64)}` },
      /another authority, candidate or evaluation/,
    ],
  ];
  for (const [name, overrides, detail] of wrong) {
    it(`an approval ${name} does not permit acceptance`, async () => {
      const a = await approvalAttempt();
      approve(a, overrides);
      assertReason(decide(a), { decision: "pause", route: "approval", detail });
    });
  }

  it("an approval of another target does not permit acceptance", async () => {
    const a = await approvalAttempt();
    approve(a, { target: { ...APPROVAL(), criterion: "AC02" } });
    const decision = decide(a);
    assertReason(decision, {
      decision: "pause",
      route: "approval",
      detail: /names no approval target/,
    });
    assertReason(decision, { decision: "pause", route: "approval", detail: /awaiting approval/ });
  });

  it("recordDecision decides from the journal: a caller cannot omit or reorder records", async () => {
    const w = await world(scratch);
    const a = await attemptOf(w, "CP99-S01");
    await admit(a);
    await verify(
      a,
      defective("parser.accepts", (e) => ({
        subjectExit: 1,
        report: {
          results: e.map((x) =>
            x.case === "valid" ? { ...x, outcome: "failed", message: "rejected a valid name" } : x,
          ),
        },
      })),
    );
    await verify(a);
    await review(a, () => calibration("known-bad").verdict);
    await review(a);
    const { decision, accepted } = recordDecision(w.run, recordInput(a));
    assertReason(decision, {
      decision: "correct",
      route: "correct",
      subject: /^CP99-S01\/AC01\/valid\/automated\/parser\.accepts$/,
      detail: /rejected a valid name/,
    });
    assertReason(decision, { decision: "correct", route: "correct", detail: /loadConfig/ });
    assert.deepEqual(accepted, []);
  });

  it("a correct or pause decision is journaled without an acceptance", async () => {
    const w = await world(scratch);
    const a = await complete(await attemptOf(w, "CP99-S01"), {
      respond: () => calibration("known-bad").verdict,
    });
    const corrected = recordDecision(w.run, recordInput(a));
    assert.equal(corrected.decision.decision, "correct");
    assert.deepEqual(corrected.accepted, []);
    const unreviewed = await attemptOf(w, "CP99-S01", { attempt: 2 });
    unreviewed.admissions.push(...a.admissions);
    await verify(unreviewed);
    const paused = recordDecision(w.run, recordInput(unreviewed));
    assertReason(paused.decision, {
      decision: "pause",
      route: "retry",
      detail: /common independent review is missing/,
    });
    const read = readRun(w.run.dir);
    assert.ok(read.ok);
    assert.deepEqual(
      read.records.events.filter((e) => e.action === "decision").map((e) => e.data.decision),
      ["correct", "pause"],
    );
    assert.equal(read.records.events.filter((e) => e.action === "acceptance").length, 0);
  });
});
