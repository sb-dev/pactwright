// T3.6 L4 comparison tooling (evidence-backed learning log §4, L4-03): the
// task starts every arm shares, one arm's run with its injected attempts, a
// recovery interruption and a definitions amendment, the measurements and
// oracle read from a run's records, and the pinned decision rules. Sessions
// are scripted and candidate work runs as local processes; the live
// comparison runs only in the comparison workflow, and nothing here is a
// comparison result.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import type { Packet, ReviewVerdict } from "../src/claude.js";
import { readRun } from "../src/evidence.js";
import { runArm, runDirOf } from "./comparison/arm.js";
import { orderOf } from "./comparison/driver.js";
import { classify, measure, type RunMetrics } from "./comparison/metrics.js";
import { runOracle } from "./comparison/oracle.js";
import { decide } from "./comparison/report.js";
import {
  configFor,
  injectionsOf,
  loadProtocol,
  loadTask,
  REPO,
  taskDigest,
  taskRepo,
  type Arm,
  type Task,
} from "./comparison/task.js";
import { commandProducers } from "./h3-fixtures.js";
import { snapshotReviewers } from "./knowledge-fixtures.js";
import { scriptedAgent, submit } from "./runner-fixtures.js";
import { approveAll, localWorkspaces } from "./verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l4-comparison-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const { protocol, digest } = loadProtocol();

/** Correct work for each task, as a capable producer would write it. */
const SOLUTIONS: Record<string, string> = {
  "cp80-slug":
    "export function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }",
  "cp83-leap":
    "export function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }",
  "cp85-normalize": "export function normalize(t) { return t.trim().split(/\\s+/).join(' '); }",
  "cp86-csv":
    "export function splitCsv(l) { const f = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '\"') { if (l[i + 1] === '\"') { c += '\"'; i++; } else q = false; } else c += ch; } else if (ch === '\"') q = true; else if (ch === ',') { f.push(c); c = ''; } else c += ch; } f.push(c); return f; }",
};

const solution = (task: Task): string =>
  `${SOLUTIONS[task.id] ?? ""}\n\nif (process.argv[1] === new URL(import.meta.url).pathname) {\n  console.log(JSON.stringify(${task.fn}(${task.id === "cp83-leap" ? "Number(process.argv[2])" : 'process.argv[2] ?? ""'})));\n}\n`;

/** A reviewer that fails a candidate holding an injected fault, and passes everything else. */
function reviewer(task: Task) {
  return scriptedAgent(async (session) => {
    const { packet } = session;
    if (packet.diagnosis) {
      return {
        output: {
          approach: "rewrite",
          assumptions: [],
          evidence: [task.module],
          check: null,
          blockers: [],
        },
      };
    }
    if (packet.proposal) return { output: { knowledge: [], guidance: [] } };
    if (packet.review?.kind === "selection") {
      return {
        output: {
          ...approveAll(packet),
          recommendation: { select: "approach", reason: "rewrite", evidence: [task.module] },
        },
      };
    }
    if (packet.review?.kind === "candidate") {
      const read = await session.call("read_file", { path: task.module });
      if (read.ok && read.text.startsWith("// INJECTED FAULT"))
        return { output: faulted(packet, task) };
    }
    return { output: approveAll(packet) };
  });
}

function faulted(packet: Packet, task: Task): ReviewVerdict {
  const verdict = approveAll(packet);
  return {
    ...verdict,
    verdict: "changes-required",
    coverage: verdict.coverage.map((c) =>
      c.subject === `${task.step}/R01`
        ? { ...c, result: "unsatisfied", basis: "executed", note: "the requirement fails" }
        : c,
    ),
    findings: [
      {
        severity: "blocking",
        basis: "executed",
        rule: `${task.step}/R01`,
        location: `${task.module}:2`,
        defect: "the module fails its requirement",
        correction: "meet the requirement",
      },
    ],
  };
}

const producer = (task: Task) =>
  scriptedAgent((session) =>
    submit(session, { [task.module]: solution(task) }, { [task.output]: [task.module] }),
  );

/** One arm's run of a task with scripted sessions and local workspaces, from this revision's tree. */
const run = (
  task: Task,
  arm: Arm,
  work: string,
  extra: Partial<Parameters<typeof runArm>[0]> = {},
) =>
  runArm({
    tree: REPO,
    task,
    protocol,
    arm,
    work,
    env: { CLAUDE_CODE_OAUTH_TOKEN: "test-token" },
    providers: { producer: producer(task), reviewer: reviewer(task) },
    workspaces: (r, root) => ({
      producer: commandProducers(r, root),
      verifier: localWorkspaces(r, root),
      reviewer: snapshotReviewers(r.dir),
    }),
    fence: () => Promise.resolve(0),
    ...extra,
  });

/** The oracle run as a local process: the fixtures' own code, in tests only. */
const local = (tree: string, oracle: string) => {
  const ran = spawnSync(
    process.execPath,
    [join(oracle, "table-subject.mjs"), join(oracle, "oracle.json")],
    {
      cwd: tree,
      encoding: "utf8",
    },
  );
  return { status: ran.status, stdout: ran.stdout, stderr: ran.stderr };
};

describe("T3.6 L4 comparison tasks", () => {
  it("builds the same task start for every arm, and changes only learning between them", () => {
    for (const id of [
      ...(protocol.sets.tuning?.tasks ?? []),
      ...(protocol.sets["held-out"]?.tasks ?? []),
    ]) {
      const task = loadTask(id);
      const a = taskRepo(task, join(scratch, `${id}-a`));
      const b = taskRepo(task, join(scratch, `${id}-b`));
      assert.equal(a.head, b.head, `${id}: a deterministic start`);
      assert.equal(a.amended, b.amended);
      const roots = { candidate: "/c", controller: "/r" };
      const [cb, cd, ce] = (["B", "D", "E"] as const).map((arm) =>
        configFor(protocol, task, arm, a, roots),
      );
      assert.deepEqual(cb, cd, `${id}: B and D run the same configuration`);
      const { learning, ...rest } = ce as Record<string, unknown>;
      assert.deepEqual(rest, cd, `${id}: E adds only learning`);
      assert.deepEqual(learning, protocol.learning);
      assert.equal(taskDigest(id), taskDigest(id));
      // The hidden oracle never enters the task repository.
      assert.equal(
        spawnSync("git", ["-C", a.root, "ls-files", "oracle.json", "injected"]).stdout.toString(),
        "",
      );
      for (const injection of injectionsOf(task).injections)
        assert.equal(injection.step, task.step);
    }
  });

  it("runs the arms of repeat k in the rotated order", () => {
    assert.deepEqual([1, 2, 3, 4].map(orderOf), [
      ["B", "D", "E"],
      ["D", "E", "B"],
      ["E", "B", "D"],
      ["B", "D", "E"],
    ]);
  });
});

describe("T3.6 L4 comparison arm runs", () => {
  it("serves the injected attempts, then a live one, and measures the run from its records", async () => {
    const task = loadTask("cp83-leap");
    for (const arm of ["D", "E"] as const) {
      const work = join(scratch, `leap-${arm}`);
      mkdirSync(work);
      const result = await run(task, arm, work);
      assert.equal(result.outcome, "selection-accepted", JSON.stringify(result));
      assert.ok(result.dir);
      const usage = measure(result.dir, task);
      assert.ok(!("error" in usage), JSON.stringify(usage));
      assert.equal(usage.injectedAttempts, 2);
      assert.equal(usage.liveAttempts, 1);
      assert.equal(usage.attempts, 3);
      assert.ok(usage.accepted);
      // Injected attempts are attempts, never sessions: only scripted sessions count.
      const read = readRun(result.dir);
      assert.ok(read.ok);
      assert.equal(
        usage.learningSessions > 0,
        arm === "E",
        `${arm}: learning sessions only with learning`,
      );
      const oracle = runOracle(result.dir, task, usage.accepted, join(work, "oracle"), local);
      assert.equal(oracle.oracle, "passed", oracle.detail);
      assert.equal(classify(result, usage, oracle.oracle), "valid");
      assert.equal(classify(result, usage, "failed"), "false-acceptance");
    }
  });

  it("resumes a recovery task's run killed at its boundary, without repeating completed work", async () => {
    const task = loadTask("cp86-csv");
    const work = join(scratch, "csv-E");
    mkdirSync(work);
    await assert.rejects(
      run(task, "E", work, {
        interrupt: () => {
          throw new Error("interrupted at the boundary");
        },
      }),
      /interrupted at the boundary/,
    );
    const dir = runDirOf(work);
    assert.ok(dir);
    const resumed = await run(task, "E", work, { resume: dir, liveness: () => "dead" });
    assert.equal(resumed.outcome, "selection-accepted", JSON.stringify(resumed));
    const usage = measure(dir, task);
    assert.ok(!("error" in usage));
    assert.equal(usage.injectedAttempts, 1);
    const read = readRun(dir);
    assert.ok(read.ok);
    const produced = read.records.events.filter(
      (e) => e.action === "start" && e.data.phase === "produce" && e.attempt === 2,
    );
    assert.equal(
      produced.length,
      2,
      "the interrupted attempt's start is retained and its session runs once more",
    );
  });

  it("amends a stale-knowledge task's definitions after the named decision, then continues the run", async () => {
    const task = loadTask("cp85-normalize");
    const work = join(scratch, "normalize-E");
    mkdirSync(work);
    const result = await run(task, "E", work);
    assert.equal(result.outcome, "selection-accepted", JSON.stringify(result));
    assert.ok(result.amended && result.dir);
    const read = readRun(result.dir);
    assert.ok(read.ok);
    const amendment = read.records.events.findIndex((e) => e.action === "amendment");
    const decision2 = read.records.events.findIndex(
      (e) => e.action === "decision" && e.attempt === 2,
    );
    assert.ok(
      amendment > decision2 && decision2 >= 0,
      "the amendment follows attempt 2's decision",
    );
    const usage = measure(result.dir, task);
    assert.ok(!("error" in usage));
    assert.equal(
      runOracle(result.dir, task, usage.accepted, join(work, "oracle"), local).oracle,
      "passed",
    );
  });
});

describe("T3.6 L4 comparison decision rules", () => {
  const set = "held-out";
  const tasks = protocol.sets[set]?.tasks ?? [];
  const runs = (
    outcome: (arm: Arm, task: string, repeat: number) => RunMetrics["outcome"],
    usage: (arm: Arm) => Partial<RunMetrics> = () => ({}),
  ): RunMetrics[] =>
    tasks.flatMap((task) =>
      [1, 2, 3].flatMap((repeat) =>
        (["B", "D", "E"] as const).map((arm) => ({
          set,
          task,
          category: "",
          arm,
          repeat,
          rerun: 0,
          superseded: false,
          protocol: digest,
          taskDigest: "",
          attempts: 1,
          liveAttempts: 1,
          injectedAttempts: 0,
          repeatedFailures: 0,
          sealRejections: 0,
          sessions: 4,
          learningSessions: 0,
          turns: 20,
          outputTokens: 1000,
          inputTokens: 10,
          cacheTokens: "not recorded" as const,
          apiEquivalentUsd: 0.1,
          unknownCost: 0,
          infrastructureFailures: [],
          journalMs: 1000,
          accepted: "c",
          harness: "h",
          outcome: outcome(arm, task, repeat),
          oracle: "passed" as const,
          oracleDetail: "",
          reasons: [],
          elapsedMs: 60_000,
          run: "r",
          archive: null,
          ...usage(arm),
        })),
      ),
    );

  it("reports a benefit only when every pinned condition holds against both B and D", () => {
    const better = runs((arm, task, repeat) =>
      arm !== "E" && task === "cp83-leap" && repeat < 3 ? "exhausted" : "valid",
    );
    assert.equal(decide(better, protocol, digest, set).result, "benefit");
  });

  it("reports equal arms as inconclusive", () => {
    const verdict = decide(
      runs(() => "valid"),
      protocol,
      digest,
      set,
    );
    assert.equal(verdict.result, "inconclusive");
    assert.match(verdict.reasons.join("\n"), /against B: valid outcomes/);
  });

  it("reports a false acceptance or fewer valid outcomes by E as a regression", () => {
    const accepted = runs((arm, task, repeat) =>
      arm === "E" && task === "cp84-flag" && repeat === 1 ? "false-acceptance" : "valid",
    );
    assert.equal(decide(accepted, protocol, digest, set).result, "regression");
    const fewer = runs((arm, task, repeat) =>
      arm === "E" && task === "cp83-leap" && repeat === 1 ? "exhausted" : "valid",
    );
    assert.equal(decide(fewer, protocol, digest, set).result, "regression");
  });

  it("keeps a benefit inconclusive when E's turns exceed the pinned limit", () => {
    const costly = runs(
      (arm, task, repeat) =>
        arm !== "E" && task === "cp83-leap" && repeat < 3 ? "exhausted" : "valid",
      (arm) => (arm === "E" ? { turns: 60 } : {}),
    );
    const verdict = decide(costly, protocol, digest, set);
    assert.equal(verdict.result, "inconclusive");
    assert.match(verdict.reasons.join("\n"), /median turns 60 exceed 2.5/);
  });

  it("leaves infrastructure failures out of the pairs, and refuses results of another protocol", () => {
    const flaky = runs((arm, task, repeat) =>
      arm === "D" && task === "cp82-title" && repeat === 2 ? "infrastructure" : "valid",
    );
    const verdict = decide(flaky, protocol, digest, set);
    assert.deepEqual(
      verdict.missing.map((m) => [m.task, m.repeat]),
      [["cp82-title", 2]],
    );
    assert.equal(verdict.totals.E.runs, tasks.length * 3 - 1);
    assert.throws(
      () => decide([{ ...flaky[0]!, protocol: "sha256:other" }], protocol, digest, set),
      /another protocol/,
    );
  });

  it("pins the protocol file it reads", () => {
    assert.equal(digest, loadProtocol().digest);
    assert.match(
      readFileSync(join(REPO, "tools/checkpoint-harness/test/comparison/protocol.yml"), "utf8"),
      /^version: 1$/m,
    );
  });
});
