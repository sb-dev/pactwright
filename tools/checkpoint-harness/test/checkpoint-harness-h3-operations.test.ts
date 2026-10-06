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
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, afterEach, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import { buildPacket, OPERATION_GUIDANCE, type AgentOutcome } from "../src/claude.js";
import { prepareRun, type AcceptedOutput } from "../src/contracts.js";
import { readRun, type RunHandle } from "../src/evidence.js";

import { GitHubError, githubEffects, targetRepositories } from "../src/github.js";
import { EffectBlocked, pinned, type ConfigChange, type EffectRequest } from "../src/runner.js";
import {
  APPLICABILITY,
  createRegistry,
  declaredRegistry,
  FIXTURE_BINDINGS,
} from "../src/software-bootstrap.js";

import { checkSummary, FIELDS, refusedSummary, type Summary } from "../src/summary.js";
import {
  decideAcceptance,
  journalInput,
  type AcceptanceInput,
  type Decision,
} from "../src/verification.js";
import { treeFiles } from "../src/workspace.js";
import { scriptedAgent } from "./runner-fixtures.js";
import { parseInputs } from "../src/workflow.js";
import {
  BRANCH,
  commitTemplate,
  Crash,
  dispatch,
  eventsOf,
  factsOf,
  fixtureProducer,
  H,
  OWNER,
  pendingOf,
  recordsOf,
  registryRepo,
  RELEASES,
  REPOSITORY,
  S01,
  S02,
  S03,
  S04,
  savedDir,
  STAMP,
  verdictFor,
  WORK,
  world,
  type World,
} from "./h3-fixtures.js";

import {
  START,
  last,
  settle,
  toApproval,
  toPublished,
  toS02,
  sequences,
  type EvaluationOf,
} from "./h3-scenarios.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h3-operations-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// No world is shared between tests. Release its archives before the next case.
afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch);
});

describe("H3-05 approvals and denials are bound to the GitHub actor, request and candidate", () => {
  it("an authorised approval of the exact request permits its effect once", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    const approved = await dispatch(w, { action: "approve", ...pending });
    assert.equal(last(approved).exit, 0);
    // The decision is applied by the next continuation, and the summary says so.
    assert.equal(
      last(approved).summary.next,
      "continue: the next job applies the recorded decision",
    );
    const [approval] = recordsOf<{
      actor: string;
      request: string;
      decision: string;
      candidate: string;
    }>(w, "approval");
    assert.deepEqual(
      [approval?.actor, approval?.request, approval?.decision, approval?.candidate],
      [OWNER, pending.request, "approved", pending.candidate],
    );
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
  });

  it("a requirement only an approval proves is the approver's: a strict reviewer cannot block its request", async () => {
    const w = world(scratch);
    const subjects: string[][] = [];
    // A reviewer that, like the live one in h3-proof-6 (job 111651959214),
    // cannot judge CP95-S01/R02 from the candidate and says so.
    w.reviewer = scriptedAgent(({ packet }) => {
      const verdict = verdictFor(packet);
      subjects.push(packet.review?.subjects ?? []);
      const strict = verdict.coverage.map((c) =>
        c.subject === `${S01}/R02` ? { ...c, result: "not-assessed" as const } : c,
      );
      return { output: { ...verdict, coverage: strict } };
    });
    const pending = await toApproval(w);
    // The step's common review, after the verifier's adequacy review.
    const common = subjects.filter((x) => x.includes(`${S01}/greeting`));
    assert.deepEqual(common, [[`${S01}/R01`, `${S01}/greeting`]]);
    assert.match(pending.request, /^sha256:/);
    // The approval still gates the step: unanswered, nothing is accepted.
    assert.deepEqual((await factsOf(w)).accepted, []);
    await dispatch(w, { action: "approve", ...pending });
    await dispatch(w, { action: "continue" });
    assert.deepEqual((await factsOf(w)).accepted, [S01]);
  });

  it("a denial is recorded; its effect never runs and the step stays unaccepted", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    const denied = last(await dispatch(w, { action: "deny", ...pending }));
    assert.equal(denied.exit, 0);
    assert.equal(denied.summary.next, "continue: the next job applies the recorded decision");
    const continued = await dispatch(w, { action: "continue" });
    assert.match(stringify(last(continued).summary.pause), /denied by sb-dev/);
    assert.equal(last(continued).summary.next, "resolve the named pause reason, then continue");
    assert.deepEqual((await factsOf(w)).accepted, []);
    assert.equal(w.github.executions.length, 0);
  });

  for (const action of ["approve", "deny"] as const) {
    it(`${action}: an unauthorised actor, a stale request and another candidate are refused`, async () => {
      const w = world(scratch);
      const pending = await toApproval(w);
      const saved = sequences(w);
      const intruder = await dispatch(w, { action, ...pending }, { actor: "intruder" });
      assert.equal(last(intruder).exit, 2);
      assert.match(
        last(intruder).summary.diagnostics.join("\n"),
        /intruder does not hold the owner authority/,
      );
      const other = await dispatch(w, {
        action,
        request: pending.request,
        candidate: "0".repeat(40),
      });
      assert.equal(last(other).exit, 2);
      assert.match(last(other).summary.diagnostics.join("\n"), /is not the candidate/);
      assert.deepEqual(sequences(w), saved, "refusals record nothing");
      assert.deepEqual(recordsOf(w, "approval"), []);
      // A stale request: the reviewer's effort is amended, so the evaluation and its request are new.
      const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
      assert.equal(
        last(
          await dispatch(w, {
            action: "amend",
            config_revision: revision,
            reason: "a deeper review",
          }),
        ).exit,
        0,
      );
      const renewed = await dispatch(w, { action: "continue" });
      const fresh = pendingOf(last(renewed));
      assert.notEqual(fresh.request, pending.request);
      const stale = await dispatch(w, { action, ...pending });
      assert.equal(last(stale).exit, 2);
      assert.match(last(stale).summary.diagnostics.join("\n"), /superseded|stale/);
      assert.deepEqual(recordsOf(w, "approval"), []);
      assert.equal(w.github.executions.length, 0);
      // Control: the fresh request is decided.
      assert.equal(last(await dispatch(w, { action, ...fresh })).exit, 0);
      assert.equal(recordsOf(w, "approval").length, 1);
    });
  }
});

describe("H3-06 effects survive interruption without repetition", () => {
  it("a write GitHub declines pauses with its cause, and a continuation after the fix performs it once", async () => {
    // Hosted run h3-proof-7, effects job 111694905162: opening the pull
    // request was declined while Actions could not create pull requests.
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    w.github.blocked.add("open-pr");
    const blocked = last(await dispatch(w, { action: "continue" }));
    assert.equal(blocked.exit, 0, "an orderly pause, not a crash");
    assert.match(
      stringify(blocked.summary.pause),
      /effect-blocked .*open-pr .*was not performed: GitHub declined it/,
    );
    assert.equal(blocked.summary.next, "fix the cause the named effect reports, then continue");
    assert.equal(w.github.pulls.size, 0);
    w.github.blocked.delete("open-pr");
    const continued = last(await dispatch(w, { action: "continue" }));
    assert.equal(continued.summary.outcome, "selection-accepted", stringify(continued.summary));
    assert.equal(w.github.pulls.size, 1);
    assert.equal(w.github.executions.filter((e) => e.action === "open-pr").length, 1);
  });

  it("GitHub's refusal of a write is a declined effect; a server error is not", async () => {
    const request = {
      run: "r",
      step: S01,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "open-pr",
      target: "t",
      payload: { head: "harness/r", base: BRANCH, title: "t", body: "b", draft: true },
    } as unknown as EffectRequest;
    const effects = (status: number) =>
      githubEffects(
        {
          repository: REPOSITORY,
          token: "t",
          request<T>(method: string, path: string): Promise<T> {
            if (method === "POST") {
              return Promise.reject(new GitHubError(`POST ${path}: ${status} no`, status));
            }
            return Promise.resolve([] as T);
          },
        },
        { repoRoot: scratch, runDir: scratch, ref: "main-line", wait: () => Promise.resolve() },
      );
    for (const status of [401, 403, 404, 422]) {
      await assert.rejects(effects(status).execute("sha256:k", request), EffectBlocked);
    }
    await assert.rejects(
      effects(502).execute("sha256:k", request),
      (e) => !(e instanceof EffectBlocked),
    );
  });

  it("a write GitHub performed stays uncertain when reading it back is declined, and is found later", async () => {
    // Review 5412894516: only the write itself is a declined effect.
    const request = {
      run: "r",
      step: S01,
      binding: { id: "b", digest: "d" },
      candidate: "c",
      outputs: [],
      action: "pr-reply",
      target: "t",
      payload: { pull: 7, body: "**Declined**" },
    } as unknown as EffectRequest;
    const posted: { id: number; body: string; user: { login: string }; html_url: string }[] = [];
    let readable = false;
    const effects = githubEffects(
      {
        repository: REPOSITORY,
        token: "t",
        request<T>(method: string, path: string, body?: unknown): Promise<T> {
          if (method === "POST") {
            const id = posted.length + 1;
            const text = (body as { body: string }).body;
            posted.push({
              id,
              body: text,
              user: { login: "github-actions[bot]" },
              html_url: `c${id}`,
            });
            return Promise.resolve({} as T);
          }
          if (!readable) {
            return Promise.reject(new GitHubError(`GET ${path}: 403 not accessible`, 403));
          }
          return Promise.resolve((path.includes("/issues/7/comments") ? posted : []) as T);
        },
      },
      { repoRoot: scratch, runDir: scratch, ref: "main-line", wait: () => Promise.resolve() },
    );
    await assert.rejects(
      effects.execute("sha256:k", request),
      (e) => e instanceof GitHubError && !(e instanceof EffectBlocked),
    );
    assert.equal(posted.length, 1);
    readable = true;
    assert.equal((await effects.inspect?.("sha256:k", request))?.reference, "c1");
    assert.equal(posted.length, 1);
  });

  it("an effect whose read-back fails after the write is reconciled by the next job, not repeated", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    w.github.unreadable.add("open-pr");
    // The effects job stops on the failed read, never reporting the write as not performed.
    await assert.rejects(dispatch(w, { action: "continue" }), GitHubError);
    assert.equal(w.github.pulls.size, 1);
    w.github.unreadable.delete("open-pr");
    const continued = last(await dispatch(w, { action: "continue" }));
    assert.equal(continued.summary.outcome, "selection-accepted", stringify(continued.summary));
    assert.doesNotMatch(stringify(continued.summary), /not performed/);
    assert.equal(w.github.executions.filter((e) => e.action === "open-pr").length, 1);
    const key = w.github.executions.find((e) => e.action === "open-pr")?.key;
    assert.deepEqual(
      recordsOf<{ key: string; reconciled: boolean }>(w, "effect-receipt")
        .filter((r) => r.key === key)
        .map((r) => r.reconciled),
      [true],
    );
  });

  it("a runner lost after the intent, before the effect, runs it once on recovery", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    const lost = await dispatch(w, { action: "continue", fault: "crash-after-intent" });
    assert.ok(last(lost).error instanceof Crash);
    assert.equal(w.github.executions.length, 0);
    assert.equal(recordsOf(w, "effect-intent").length, 1);
    assert.equal(recordsOf(w, "effect-receipt").length, 0, "no completion without a receipt");
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    const [receipt] = recordsOf<{ reconciled: boolean }>(w, "effect-receipt");
    assert.equal(receipt?.reconciled, false);
  });

  it("a runner lost after the effect, before its receipt, reads it back and never repeats it", async () => {
    const w = world(scratch);
    const pending = await toApproval(w);
    await dispatch(w, { action: "approve", ...pending });
    const lost = await dispatch(w, { action: "continue", fault: "crash-after-effect" });
    assert.ok(last(lost).error instanceof Crash);
    assert.equal(w.github.executions.length, 1);
    assert.equal(recordsOf(w, "effect-receipt").length, 0);
    await dispatch(w, { action: "continue" });
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
    const [receipt] = recordsOf<{ reconciled: boolean }>(w, "effect-receipt");
    assert.equal(receipt?.reconciled, true);
  });

  it("a fault needs a template that allows faults", async () => {
    const w = world(scratch, { edit: (t) => t.replace("faults: true", "faults: false") });
    const refused = await dispatch(w, { ...START, fault: "crash-after-intent" });
    assert.equal(last(refused).exit, 2);
    assert.deepEqual(sequences(w), []);
  });
});

describe("H3-07 the selection boundary", () => {
  it("start without through selects the first step; with a valid one it records that one", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    assert.equal((await factsOf(w)).boundary, S01);
    const v = world(scratch);
    await dispatch(v, { ...START, through: S02 });
    assert.equal((await factsOf(v)).boundary, S02);
  });

  it("continue keeps the saved boundary, and records a valid extension", async () => {
    const w = world(scratch);
    await toPublished(w);
    await dispatch(w, { action: "continue" });
    assert.equal((await factsOf(w)).boundary, S01);
    await dispatch(w, { action: "continue", through: S02 });
    assert.equal((await factsOf(w)).boundary, S02);
    const [extension] = recordsOf<{ actor: string; reason: string; changes: ConfigChange[] }>(
      w,
      "amendment",
    );
    assert.equal(extension?.actor, OWNER);
    assert.deepEqual(
      extension?.changes.map((c) => [c.path, c.old, c.new]),
      [["/selection/through", S01, S02]],
    );
  });

  it("invalid boundaries are refused without starting or changing the run", async () => {
    const w = world(scratch);
    const refused = await dispatch(w, { ...START, through: "CP95-S09" });
    assert.equal(last(refused).exit, 2);
    assert.deepEqual(sequences(w), []);
    const malformed = parseInputs({ action: "start", run: w.run, through: "S01" });
    assert.equal(malformed.ok, false);
    await dispatch(w, { ...START, through: S02 });
    const saved = sequences(w);
    for (const through of ["CP95-S01", "CP95-S02", "CP95-S07"]) {
      const not = await dispatch(w, { action: "continue", through });
      assert.equal(last(not).exit, 2, through);
      assert.deepEqual(sequences(w), saved, through);
    }
    assert.equal((await factsOf(w)).boundary, S02);
  });

  it("an automatic continuation never extends the selection", async () => {
    const w = world(scratch);
    const early = Date.now() - 10 * 60 * 1000;
    const outcomes = await dispatch(w, START, { started: early });
    assert.equal(last(outcomes).next, "continue");
    assert.deepEqual(Object.keys(last(outcomes).dispatch ?? {}).sort(), ["ref", "run"]);
    await dispatch(w, { action: "continue" }, { started: early });
    assert.equal((await factsOf(w)).boundary, S01);
    assert.equal(recordsOf(w, "amendment").length, 0);
  });
});

/**
 * The acceptance input of a step's latest evaluation, rebuilt from the saved
 * journal as the controller builds it, so a decision can be taken again.
 */
async function redecide(w: World, step: string): Promise<AcceptanceInput> {
  const dir = savedDir(w);
  const read = readRun(dir);
  assert.ok(read.ok);
  const { events, manifest, owner, head } = read.records;
  const handle: RunHandle = {
    dir,
    run: manifest.run,
    epoch: owner.epoch,
    fd: null,
    seq: (events.at(-1)?.seq ?? 0) + 1,
    prev: head,
    length: 0,
  };
  const configured = pinned(dir, events);
  assert.ok(configured);
  const prepared = await prepareRun(configured.config, {
    repoRoot: w.repo.root,
    applicability: APPLICABILITY,
  });
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  const { plan } = prepared;
  const evaluation = recordsOf<EvaluationOf>(w, "evaluation", dir)
    .filter((e) => e.step === step)
    .at(-1);
  assert.ok(evaluation);
  const bindings = configured.config.verification?.bindings ?? "";
  const known = new Map(
    [
      ...plan.inherited.targets,
      ...plan.steps.flatMap((x) => (x.kind === "contract" ? x.targets : [])),
    ].map((t) => [t.binding, t.method] as const),
  );
  const registry = createRegistry([...FIXTURE_BINDINGS]);
  assert.ok(registry.ok);
  const declared = declaredRegistry(
    registry.registry,
    [...treeFiles(dir, evaluation.candidate.tree, bindings)].map(([path, bytes]) => ({
      path,
      bytes,
    })),
    bindings,
    known,
  );
  return journalInput(handle, {
    plan,
    step,
    run: manifest.run,
    attempt: evaluation.attempt,
    manifest: evaluation.manifest,
    registry: declared.registry,
    policy: { writable: configured.config.permissions.writable, scratch: [], protected: [] },
    claims: evaluation.claims,
    declarations: { dir: bindings, rejected: declared.rejected },
  });
}

describe("H3-08 operational steps", () => {
  it("operational guidance travels only in operational packets; the producer prompt is the one H2 admitted", async () => {
    const w = world(scratch);
    const prepared = await prepareRun(
      {
        repository: { name: REPOSITORY, branch: BRANCH, expected_head: w.repo.head },
        checkpoint: `${H}/docs/checkpoints/95-hosted/checkpoint.yml`,
        definitions: { revision: w.repo.head, review: "x" },
        selection: { through: S02 },
      },
      { repoRoot: w.repo.root },
    );
    assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
    const producer = { name: "producer" as const, skills: [] };
    const policy = { writable: [WORK], scratch: [], protected: [] };
    const contract = buildPacket(prepared.plan, S01, producer, {
      attempt: 1,
      accepted: [],
      policy,
    });
    assert.ok(contract.ok);
    // The digest of the producer prompt H2's live proof ran with (job 111430653474).
    assert.equal(
      contract.packet.template,
      "sha256:8c02b311fb64cb52f19f9021cbea40cbc51aa4721c49df961616a62a0da19b3e",
    );
    assert.equal(contract.packet.step.operation, undefined);
    assert.equal(contract.packet.step.procedure, undefined);
    const accepted: AcceptedOutput[] = [
      {
        step: S01,
        output: "greeting",
        definition: prepared.plan.stepDefinitions[S01] ?? "",
        definitions: prepared.plan.definitionsDigest,
        evidence: ["sha256:x"],
      },
    ];
    const operational = buildPacket(prepared.plan, S02, producer, { attempt: 1, accepted, policy });
    assert.ok(operational.ok, operational.ok ? "" : operational.diagnostics.join("\n"));
    assert.equal(operational.packet.template, contract.packet.template);
    assert.equal(operational.packet.step.operation, OPERATION_GUIDANCE);
    assert.match(operational.packet.step.procedure ?? "", /^sha256:/);
  });

  it("the reviewed procedure runs in its target and is accepted on its command evidence", async () => {
    const w = world(scratch);
    await toS02(w);
    const decisions = recordsOf<Decision & { decision: "accept" }>(w, "acceptance").filter(
      (d) => d.step === S02,
    );
    assert.equal(decisions.length, 1);
    const producer = recordsOf<AgentOutcome>(w, "agent-invocation")
      .filter((o) => o.observation.role === "producer")
      .at(-1);
    const commands = producer?.observation.toolCalls.filter((c) => c.tool === "run_command") ?? [];
    assert.equal(commands.length, 1);
    assert.equal(commands[0]?.exit, 0);
    assert.ok(commands[0]?.stdout && decisions[0]?.evidence.includes(commands[0].stdout));
    // The procedure landed a revision: the stamp is in the published candidate.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.equal(
      execFileSync("git", ["show", `${head}:${STAMP}`], { cwd: w.repo.root, encoding: "utf8" }),
      "stamp: Hello, Pactwright!\n",
    );
  });

  it("a procedure with no command evidence is not accepted", async () => {
    const w = world(scratch);
    w.producer = fixtureProducer({ runCommands: false });
    await toPublished(w);
    const extended = await dispatch(w, { action: "continue", through: S02 });
    // Each attempt corrects the step; the run stops on S02 without accepting it.
    assert.match(stringify(last(extended).summary.pause), /CP95-S02/);
    assert.ok(!(await factsOf(w)).accepted.includes(S02));
    const findings = recordsOf<Decision>(w, "decision").flatMap((d) =>
      d.decision === "correct" ? d.findings.map((f) => f.defect) : [],
    );
    assert.ok(findings.some((d) => /no command of the procedure was executed/.test(d)));
  });

  it("a procedure whose observation evidence is missing is not accepted", async () => {
    const w = world(scratch);
    await toS02(w);
    const input = await redecide(w, S02);
    const recorded = decideAcceptance(input);
    assert.equal(recorded.decision, "accept", stringify(recorded));
    const producer = input.producer;
    assert.ok(producer);
    const outputs = producer.record.observation.toolCalls.flatMap((c) => [c.stdout, c.stderr]);
    assert.equal(outputs.length, 2);
    const unjournaled = new Set([...input.journaled].filter((r) => !outputs.includes(r)));
    const missing = decideAcceptance({ ...input, journaled: unjournaled });
    assert.equal(missing.decision, "correct");
    assert.ok(
      missing.decision === "correct" &&
        missing.findings.some((f) =>
          /observation evidence of a command, its recorded output, is missing/.test(f.defect),
        ),
    );
  });

  it("a procedure can change repository: it runs in its declared target and the candidate's evidence stays", async () => {
    const w = world(scratch, { registry: true });
    await toS02(w);
    const before = await factsOf(w);
    const published = w.github.branches.get(`harness/${w.run}`);
    const extended = await dispatch(w, { action: "continue", through: S03 });
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    const after = await factsOf(w);
    assert.deepEqual(after.accepted, [S01, S02, S03]);
    // Step 3's candidate is the registry's next revision, not the published candidate's.
    const [s03] = recordsOf<Decision & { decision: "accept"; targets: string[] }>(
      w,
      "acceptance",
    ).filter((d) => d.step === S03);
    assert.ok(s03);
    assert.deepEqual(s03.targets, [], "the candidate's checks do not run in the registry");
    const dir = savedDir(w);
    const releases = execFileSync(
      "git",
      ["--git-dir", join(dir, "source.git"), "show", `${s03.candidate}:${RELEASES}`],
      {
        encoding: "utf8",
      },
    );
    assert.match(releases, /released: CP94\nreleased: CP95\n$/);
    const [command] =
      recordsOf<AgentOutcome>(w, "agent-invocation", dir)
        .filter((o) => o.observation.role === "producer")
        .at(-1)
        ?.observation.toolCalls.filter((c) => c.tool === "run_command") ?? [];
    assert.deepEqual([command?.target, command?.exit], ["node record.mjs CP95", 0]);
    // Earlier acceptances stay current; the candidate is not republished.
    for (const step of [S01, S02]) {
      assert.equal(
        after.evidence.find((e) => e.step === step)?.acceptance,
        before.evidence.find((e) => e.step === step)?.acceptance,
        step,
      );
    }
    assert.equal(w.github.branches.get(`harness/${w.run}`), published);
  });

  it("a procedure in a fixture repository root runs there, and a later job restores and continues on the candidate", async () => {
    // As the hosted template declares it: the registry root at a pinned revision of this repository.
    const w = world(scratch);
    await toPublished(w);
    const extended = await settle(w, await dispatch(w, { action: "continue", through: S04 }));
    assert.equal(
      last(extended).summary.outcome,
      "selection-accepted",
      stringify(last(extended).summary),
    );
    assert.deepEqual((await factsOf(w)).accepted, [S01, S02, S03, S04]);
    const dir = savedDir(w);
    const [s03] = recordsOf<Decision & { decision: "accept" }>(w, "acceptance", dir).filter(
      (d) => d.step === S03,
    );
    assert.ok(s03);
    const files = execFileSync(
      "git",
      ["--git-dir", join(dir, "source.git"), "ls-tree", "--name-only", s03.candidate],
      {
        encoding: "utf8",
      },
    )
      .trim()
      .split("\n");
    assert.deepEqual(
      files,
      ["README.md", "RELEASES.md", "record.mjs"],
      "the workspace held the registry root",
    );
    // S03 and S04 ran in separate jobs: S04 restored the state S03's job saved.
    const owners = eventsOf(w, dir).filter((e) => e.action === "owner");
    const acceptedIn = (step: string): number | undefined => {
      const seq =
        eventsOf(w, dir).find((e) => e.action === "acceptance" && e.data.step === step)?.seq ?? 0;
      return (owners.filter((o) => o.seq < seq).at(-1)?.data.github as { run_id: number } | null)
        ?.run_id;
    };
    assert.notEqual(acceptedIn(S03), undefined);
    assert.ok(eventsOf(w, dir).some((e) => e.action === "acceptance" && e.data.step === S04));
    // The candidate's published head never holds the registry's files.
    const head = w.github.branches.get(`harness/${w.run}`) ?? "";
    assert.throws(() =>
      execFileSync("git", ["cat-file", "-e", `${head}:record.mjs`], {
        cwd: w.repo.root,
        stdio: "ignore",
      }),
    );
  });

  it("hosted jobs fetch an operation target's pinned revision, from this repository or another", async () => {
    // A server of two repositories, reached as GitHub's would be.
    const server = mkdtempSync(join(scratch, "server-"));
    const other = registryRepo(scratch);
    mkdirSync(join(server, "sb-dev"));
    execFileSync("git", ["clone", "-q", "--bare", other.root, join(server, "sb-dev/registry.git")]);
    const root = mkdtempSync(join(scratch, "checkout-"));
    execFileSync("git", ["init", "-q"], { cwd: root });
    const resolve = targetRepositories(
      { repository: REPOSITORY, token: "t", request: () => Promise.reject(new Error("no API")) },
      {
        root,
        server: `file://${server}`,
        header: "x-test: 1",
        temp: mkdtempSync(join(scratch, "temp-")),
      },
    );
    const fetched = await resolve("sb-dev/registry", other.head);
    assert.ok(fetched);
    assert.equal(
      execFileSync("git", ["rev-parse", `${other.head}^{tree}`], {
        cwd: fetched,
        encoding: "utf8",
      }).trim(),
      execFileSync("git", ["rev-parse", `${other.head}^{tree}`], {
        cwd: other.root,
        encoding: "utf8",
      }).trim(),
    );
    assert.equal(
      await resolve("sb-dev/registry", "0".repeat(40)),
      null,
      "an absent revision is not available",
    );
    assert.equal(await resolve("sb-dev/missing", other.head), null);
  });

  it("a procedure evaluated outside its declared target is not accepted", async () => {
    const w = world(scratch, { registry: true });
    await toS02(w);
    await dispatch(w, { action: "continue", through: S03 });
    const input = await redecide(w, S03);
    assert.equal(decideAcceptance(input).decision, "accept");
    assert.deepEqual(input.manifest.operation, { target: "registry", revision: w.registry?.head });
    const elsewhere = decideAcceptance({
      ...input,
      manifest: { ...input.manifest, operation: { target: "candidate", revision: null } },
    });
    assert.equal(elsewhere.decision, "pause");
    assert.ok(
      elsewhere.decision === "pause" &&
        elsewhere.reasons.some(
          (r) => r.route === "owner" && /not its declared target/.test(r.detail),
        ),
    );
  });

  it("changed or unreviewed prose is refused at planning, so it never runs", async () => {
    const w = world(scratch);
    const planAt = (revision: string): ReturnType<typeof prepareRun> =>
      prepareRun(
        {
          repository: { name: "sb-dev/pactwright", branch: BRANCH, expected_head: w.repo.head },
          checkpoint: `${H}/docs/checkpoints/95-hosted/checkpoint.yml`,
          definitions: { revision, review: "x" },
          selection: { through: S02 },
        },
        { repoRoot: w.repo.root },
      );
    const commit = (path: string, edit: (text: string) => string): string => {
      const file = join(w.repo.root, H, path);
      writeFileSync(file, edit(readFileSync(file, "utf8")));
      execFileSync("git", ["-c", "user.name=f", "-c", "user.email=f@f", "commit", "-qam", "edit"], {
        cwd: w.repo.root,
      });
      return execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: w.repo.root,
        encoding: "utf8",
      }).trim();
    };
    assert.equal((await planAt(w.repo.head)).ok, true, "control: the reviewed prose plans");
    const changed = await planAt(
      commit("docs/checkpoints/95-hosted.md", (t) =>
        t.replace("and nothing else", "and nothing more"),
      ),
    );
    assert.equal(changed.ok, false);
    assert.match(
      changed.ok ? "" : changed.diagnostics.join("\n"),
      /CP95-S02 differs from its reviewed text/,
    );
    const unreviewed = await planAt(
      commit("docs/checkpoints/95-hosted/checkpoint.yml", (t) =>
        t.replace(/^ {2}CP95-S02: .*\n/m, ""),
      ),
    );
    assert.equal(unreviewed.ok, false);
    assert.match(
      unreviewed.ok ? "" : unreviewed.diagnostics.join("\n"),
      /Step 2 has neither a contract nor a prose_steps entry/,
    );
  });

  it("a landed revision keeps earlier evidence current, reruns its checks, and resumes on a fresh runner", async () => {
    const w = world(scratch);
    await toS02(w);
    const facts = await factsOf(w);
    const s01 = facts.evidence.find((e) => e.step === S01);
    const [first] = recordsOf<Decision & { decision: "accept" }>(w, "acceptance").filter(
      (d) => d.step === S01,
    );
    assert.ok(s01 && first);
    assert.equal(
      s01.refs.join(),
      first.evidence.join(),
      "S01's acceptance is the one recorded before S02",
    );
    const s02 = recordsOf<Decision & { decision: "accept"; targets: string[] }>(
      w,
      "acceptance",
    ).find((d) => d.step === S02);
    assert.ok(
      s02?.targets.some((t) => t.startsWith(`${S01}/AC01/`)),
      "S01's automated checks reran on S02's candidate",
    );
    // S02 ran in two jobs: produced in the controller job, published by the effects job.
    const owners = eventsOf(w).filter((e) => e.action === "owner").length;
    assert.ok(owners >= 6);
  });
});

describe("H3-09 amendments", () => {
  it("an authorised amendment with a revision and reason is recorded and re-evaluates", async () => {
    const w = world(scratch);
    await toPublished(w);
    const receipts = recordsOf(w, "effect-receipt").length;
    const attempts = recordsOf<{ attempt: number }>(w, "evaluation").length;
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const amended = await dispatch(w, {
      action: "amend",
      config_revision: revision,
      reason: "a deeper review",
    });
    assert.equal(last(amended).exit, 0);
    assert.equal(
      last(amended).summary.next,
      "continue: the next job applies the recorded amendment",
    );
    const [amendment] = recordsOf<{
      actor: string;
      reason: string;
      revision: string;
      changes: ConfigChange[];
    }>(w, "amendment");
    assert.deepEqual(
      [amendment?.actor, amendment?.reason, amendment?.revision],
      [OWNER, "a deeper review", revision],
    );
    assert.deepEqual(
      amendment?.changes.map((c) => c.path),
      ["/roles/reviewer/effort"],
    );
    assert.deepEqual((await factsOf(w)).accepted, [], "affected evidence no longer counts");
    // The re-evaluation is reviewed again and needs a new approval of its own.
    const renewed = await dispatch(w, { action: "continue" });
    assert.ok(recordsOf<{ attempt: number }>(w, "evaluation").length > attempts);
    assert.equal(recordsOf(w, "effect-receipt").length, receipts, "receipts are kept");
    assert.deepEqual((await factsOf(w)).accepted, []);
    await dispatch(w, { action: "approve", ...pendingOf(last(renewed)) });
    await dispatch(w, { action: "continue" });
    assert.deepEqual((await factsOf(w)).accepted, [S01]);
    // The same candidate's completed effect is its receipt: it is not run again.
    assert.equal(recordsOf(w, "effect-receipt").length, receipts);
    assert.equal(w.github.executions.filter((e) => e.action === "fixture-receipt").length, 1);
  });

  it("a hosted run that names no amend authority is not amended", async () => {
    const w = world(scratch, { edit: (t) => t.replace(/^ {4}amend: .*\n/m, "") });
    await toPublished(w);
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const refused = await dispatch(w, { action: "amend", config_revision: revision, reason: "x" });
    assert.equal(last(refused).exit, 2);
    assert.match(last(refused).summary.diagnostics.join("\n"), /names no amend authority/);
  });

  it("an unauthorised actor, a missing reason, a stale revision and an invalid configuration are refused", async () => {
    const w = world(scratch);
    await toPublished(w);
    const saved = sequences(w);
    const before = await factsOf(w);
    const revision = commitTemplate(w.repo, (t) => t.replace("effort: low", "effort: medium"));
    const intruder = await dispatch(
      w,
      { action: "amend", config_revision: revision, reason: "x" },
      { actor: "intruder" },
    );
    assert.match(
      last(intruder).summary.diagnostics.join("\n"),
      /intruder does not hold the amend authority/,
    );
    assert.equal(parseInputs({ action: "amend", run: w.run, config_revision: revision }).ok, false);
    const stale = await dispatch(w, { action: "amend", config_revision: w.repo.head, reason: "x" });
    assert.match(last(stale).summary.diagnostics.join("\n"), /is stale/);
    const invalid = commitTemplate(w.repo, (t) =>
      t.replace("model: claude-opus-5-5", "model: claude-haiku-4-5-20251001"),
    );
    const refused = await dispatch(w, {
      action: "amend",
      config_revision: invalid,
      reason: "cheaper",
    });
    assert.match(last(refused).summary.diagnostics.join("\n"), /does not accept effort/);
    for (const o of [intruder, stale, refused]) assert.equal(last(o).exit, 2);
    assert.deepEqual(sequences(w), saved, "nothing was recorded");
    const after = await factsOf(w);
    assert.deepEqual(
      [after.accepted, after.spending, after.roles],
      [before.accepted, before.spending, before.roles],
    );
  });
});

describe("H3-10 status", () => {
  it("reports the latest state and changes nothing", async () => {
    const w = world(scratch);
    await toPublished(w);
    const latest = w.store.latest(w.run);
    const executed = w.github.executions.length;
    const archive = readFileSync(join(latest.dir, "state.tar.gz"));
    const reported = await dispatch(w, { action: "status" });
    assert.equal(reported.length, 1);
    assert.equal(last(reported).exit, 0);
    assert.equal(last(reported).summary.outcome, "reported");
    assert.deepEqual(last(reported).summary.accepted, [S01]);
    assert.deepEqual(w.store.latest(w.run).sequence, latest.sequence);
    assert.deepEqual(readFileSync(join(latest.dir, "state.tar.gz")), archive);
    assert.equal(w.github.executions.length, executed, "status runs no effect");
  });

  it("refuses corrupt or stale state rather than presenting it", async () => {
    const w = world(scratch);
    await dispatch(w, START);
    w.store.damage(w.run, Math.max(...sequences(w)));
    const corrupt = await dispatch(w, { action: "status" });
    assert.equal(last(corrupt).exit, 2);
    assert.equal(last(corrupt).summary.accepted, "unknown");
    const v = world(scratch);
    await dispatch(v, START);
    v.store.expire(v.run, Math.max(...sequences(v)));
    const stale = await dispatch(v, { action: "status" });
    assert.equal(last(stale).exit, 2);
    assert.equal(last(stale).summary.run, "unknown");
  });
});

describe("H3-11 summaries agree with recorded state", () => {
  it("every field of every action's summary is checked against the saved state", async () => {
    // `job` checks every summary in this file against its saved state; here
    // each field is falsified or omitted once and must fail on its own.
    const w = world(scratch);
    await toPublished(w);
    const reported = last(await dispatch(w, { action: "status" })).summary;
    assert.deepEqual(checkSummary(reported, reported), []);
    const falsified: Record<string, unknown> = {
      run: { name: "other", id: "other" },
      boundary: S02,
      accepted: [],
      checkpoint: { complete: true, unaccepted: [], pending: 0 },
      roles: "unknown",
      spending: { reportedUsd: 0, unknownSessions: 0, reservedUsd: 0, unresolved: 0 },
      pause: ["yield run: invented"],
      next: "none: the checkpoint is complete",
      evidence: { job: "elsewhere", state: null, records: [] },
      saved: null,
      pullRequest: null,
      round: { round: 9 },
    };
    for (const field of FIELDS) {
      const wrong = { ...reported, [field]: falsified[field] } as Summary;
      assert.deepEqual(
        checkSummary(wrong, reported).map((m) => m.field),
        [field],
        `falsified ${field}`,
      );
      const omitted = { ...reported } as Partial<Summary>;
      delete omitted[field];
      assert.deepEqual(
        checkSummary(omitted as Summary, reported).map((m) => m.field),
        [field],
        `omitted ${field}`,
      );
    }
    // The reported model and effort, spending and saved-state identity are the recorded ones.
    const facts = await factsOf(w);
    assert.deepEqual(reported.roles, facts.roles);
    assert.equal(facts.roles.reviewer.effort.reported, "not-reported");
    assert.ok(reported.saved !== "unknown" && reported.saved !== null);
  });

  it("a refusal before restore reports every run field unknown and no acceptance", () => {
    const refused = refusedSummary("continue", "https://github.example/run", ["no state"]);
    for (const field of FIELDS.filter((f) => f !== "next"))
      assert.equal(refused[field], "unknown", field);
    assert.equal(refused.outcome, "refused");
    assert.match(refused.next, /nothing was accepted/);
  });
});

describe("H3-12 hosted continuation", () => {
  it("yields within the selection, stops at a human decision, and never reports a green job as acceptance", async () => {
    const w = world(scratch);
    const early = Date.now() - 10 * 60 * 1000;
    let outcomes = await dispatch(w, START, { started: early });
    const yielded = last(outcomes);
    assert.equal(yielded.exit, 0, "a yielded job is green");
    assert.ok(yielded.saved, "and saved its state");
    assert.equal(yielded.summary.outcome, "paused");
    assert.deepEqual(yielded.summary.accepted, []);
    assert.ok(yielded.summary.checkpoint !== "unknown" && !yielded.summary.checkpoint.complete);
    while (last(outcomes).next === "continue") {
      outcomes = await dispatch(w, { action: "continue" }, { started: early });
    }
    assert.equal(last(outcomes).next, "none", "a human decision stops the continuations");
    assert.match(last(outcomes).summary.next, /approve or deny/);
    assert.equal((await factsOf(w)).boundary, S01);
  });

  it("stops at the selection boundary once it is accepted", async () => {
    const w = world(scratch);
    await toPublished(w);
    const done = await dispatch(w, { action: "continue" });
    assert.equal(last(done).next, "none");
    assert.equal(last(done).summary.outcome, "selection-accepted");
    const checkpoint = last(done).summary.checkpoint;
    assert.ok(checkpoint !== "unknown" && !checkpoint.complete);
  });
});
