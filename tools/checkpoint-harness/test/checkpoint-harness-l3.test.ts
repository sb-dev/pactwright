// T3.6 L3 acceptance (evidence-backed learning log §3 T3.6-L3, §§2.3–2.4
// and 2.6; L3-01–L3-04), offline. A real CP97 library run with the learning
// phases configured repeats the injected boundary fault for three attempts:
// the repeated reviewed failure opens one exploration round before attempt
// 4, whose two diagnostic sessions, contained check, selection review,
// routing and cross-attempt challenge all run through the runner. Tests
// branch the run stopped after attempt 3's decision and resume it with their
// own scripted sessions; every refusal has a valid control. Candidate
// commands run as local processes here; real containment is the Docker
// integration test's.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import type {
  AgentOutcome,
  Diagnosis,
  Packet,
  Proposals,
  ReviewVerdict,
  ToolReply,
} from "../src/claude.js";
import { CHALLENGE_RUBRIC, COMMON_RUBRIC } from "../src/software-bootstrap.js";
import {
  appendEvent,
  putEvidence,
  readEvidence,
  readRun,
  type JournalEvent,
  type RunHandle,
} from "../src/evidence.js";
import { amendRun, resumeRun, runFacts, startRun } from "../src/runner.js";
import { packState, unpackState } from "../src/state.js";
import {
  challengeSubjects,
  decideAcceptance,
  diagnosticCheck,
  explorationRecords,
  journalInput,
  candidateTree,
  routeExploration,
  selectionSubjects,
  type Decision,
  type ExplorationCheck,
  type ExplorationRouting,
  type ExplorationStart,
  type OpenWorkspace,
  type ReviewRecord,
} from "../src/verification.js";
import { treeFiles } from "../src/workspace.js";
import {
  assertAccepted,
  assertPaused,
  bootstrapRegistry,
  eventsOf,
  LIBRARY,
  workOf,
} from "./bootstrap-fixtures.js";
import {
  BOUNDARY,
  committed,
  CONTROLLER,
  recordSession,
  sessionObservation,
} from "./knowledge-fixtures.js";
import {
  between,
  branch,
  depsOf,
  faultVerdict,
  LEARNING,
  plainDiagnosis,
  R01,
  R03,
  resume,
  selectionVerdict,
  start,
  stopped,
  world,
  type World,
} from "./learning-fixtures.js";
import {
  dispatch,
  GREETING,
  inspectSaved,
  OWNER,
  recordsOf,
  S02,
  verdictFor,
  world as hostedWorld,
} from "./h3-fixtures.js";
import { last, settle, toS02 } from "./h3-scenarios.js";
import { Crash, scriptedAgent } from "./runner-fixtures.js";
import { approveAll, localWorkspaces } from "./verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-l3-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const PHASES = { exploration_rounds: 2, check_timeout_seconds: 30 } as const;
const PHASED = { ...LEARNING, phases: PHASES };

/** The shared run: stopped after attempt 3's decision, and that run resumed to its acceptance at attempt 4. */
let w: World;
let stopped3: string;
let final: string;

before(async () => {
  w = await world(scratch, { faults: 3, attempts: 6, learning: PHASED });
  stopped3 = stopped(await start(w, 3));
  final = branch(w, stopped3);
  assertAccepted(await resume(w, final), [LIBRARY]);
});

// Reading a run.

/**
 * The phase keys whose reserved allowance no result resolved, as the
 * runner's spending pairs a start with the next result before another start.
 */
function unresolvedKeys(dir: string): string[] {
  const results = new Set(["agent-invocation", "review", "verifier-admission", "pr-assessment"]);
  const starts = new Map(
    committed<{ key: string; allowance?: number | null }>(dir, "start").map((s) => [
      s.event.seq,
      s.record,
    ]),
  );
  const open: string[] = [];
  let current: string | null = null;
  for (const e of eventsOf(dir)) {
    if (e.action === "start") {
      if (current) open.push(current);
      const record = starts.get(e.seq);
      current = record?.allowance != null ? record.key : null;
    } else if (current && results.has(e.action)) current = null;
  }
  if (current) open.push(current);
  return open;
}

const sessionsOf = (dir: string, purpose: string) =>
  committed<AgentOutcome>(dir, "agent-invocation", (f) => f.event.data.purpose === purpose);

const explorationsIn = (dir: string) => committed<ExplorationStart>(dir, "exploration-start");
const checksIn = (dir: string) => committed<ExplorationCheck>(dir, "exploration-check");
const routingsIn = (dir: string) => committed<ExplorationRouting>(dir, "exploration-routing");
const reviewsIn = (dir: string, kind: ReviewRecord["kind"]) =>
  committed<ReviewRecord>(dir, "review", (f) => f.record.kind === kind);

const startsOf = (dir: string, phase: string) =>
  eventsOf(dir).filter((e) => e.action === "start" && e.data.phase === phase);

type Started = { key: string; production: { exploration?: string; from: { commit: string } } };
const produced = (dir: string, attempt: number) =>
  committed<Started>(
    dir,
    "start",
    (f) => f.event.data.phase === "produce" && f.event.attempt === attempt,
  );

const decisionsOf = (dir: string, attempt: number) =>
  eventsOf(dir)
    .filter((e) => (e.action === "decision" || e.action === "acceptance") && e.attempt === attempt)
    .map((e) => JSON.parse(readEvidence(dir, e.evidence[0] ?? "").toString("utf8")) as Decision);

/** The scripted reviewer's packets from here on. */
const mark = (): number => w.reviewer.packets.length;
const packetsSince = (from: number): Packet[] => w.reviewer.packets.slice(from);
const producerPacket = (from: number, attempt: number): Packet | undefined =>
  w.producer.packets.slice(from).find((p) => p.attempt === attempt);

/** A copy of the stopped run with the script set for one test; the script is reset afterwards. */
async function withScript<T>(script: Partial<World["script"]>, fn: () => Promise<T>): Promise<T> {
  const saved = { ...w.script };
  Object.assign(w.script, script);
  try {
    return await fn();
  } finally {
    for (const key of Object.keys(w.script) as (keyof World["script"])[]) delete w.script[key];
    Object.assign(w.script, saved);
  }
}

/** A faulty library verdict on `rule` instead of R03, with the same defect text. */
function faultOn(packet: Packet, rule: string): ReviewVerdict {
  const verdict = faultVerdict(packet);
  return {
    ...verdict,
    coverage: verdict.coverage.map((c) =>
      c.subject === R03
        ? { ...c, result: "satisfied", note: "met" }
        : c.subject === rule
          ? { ...c, result: "unsatisfied", basis: "inspection", note: "port 65536 is accepted" }
          : c,
    ),
    findings: verdict.findings.map((f) => ({ ...f, rule })),
  };
}

/** The library with its boundary fault, without the fault's label. */
const unlabelledFault = (): Record<string, string> => {
  const good = workOf(LIBRARY).good();
  return {
    ...good,
    "src/config.mjs": (good["src/config.mjs"] ?? "").replace("port > 65535", "port > 65536"),
  };
};

/** A symptom-only fix: it rejects the verifier's exact input, port 65536 labelled api, and nothing else. */
const symptomFix = (): Record<string, string> => {
  const files = unlabelledFault();
  const source = files["src/config.mjs"] ?? "";
  const line = source.split("\n").find((l) => l.includes("port > 65536"));
  assert.ok(line);
  return {
    ...files,
    "src/config.mjs": source.replace(
      line,
      `${line}\n  if (port === 65536 && label === "api") throw new ConfigError(\`port: \${port} is outside 1 through 65535\`);`,
    ),
  };
};

/** A challenge reviewer that reads the candidate and blocks a fix special-casing the verifier's input. */
async function inspectingChallenge(session: {
  packet: Packet;
  call(name: string, args: unknown): Promise<ToolReply>;
}): Promise<ReviewVerdict> {
  const read = await session.call("read_file", { path: "src/config.mjs" });
  assert.ok(read.ok);
  const verdict = approveAll(session.packet);
  if (!read.text.includes('label === "api"')) return verdict;
  const symptom = `${LIBRARY}/challenge/symptom`;
  return {
    ...verdict,
    verdict: "changes-required",
    coverage: verdict.coverage.map((c) =>
      c.subject === symptom
        ? {
            ...c,
            result: "unsatisfied",
            basis: "inspection",
            note: "port 65536 is rejected only with the label the check used",
          }
        : c,
    ),
    findings: [
      {
        severity: "blocking",
        basis: "inspection",
        rule: symptom,
        location: "src/config.mjs:28",
        defect: "the fix special-cases the failing input: port 65536 labelled web is accepted",
        correction: "reject every port above 65535 whatever the label",
      },
    ],
  };
}

/** A check that observes the explored candidate's upper bound for a label the verifier never uses. */
const BOUNDARY_CHECK = [
  "node",
  "--input-type=module",
  "-e",
  `const { parseConfig } = await import("${"./src/config.mjs"}"); try { parseConfig('{"port":65536,"label":"web"}'); console.log("accepted"); } catch (e) { console.log("rejected: " + e.message); }`,
];

const withCheck = (approach: string, check: Diagnosis["check"]): Diagnosis => ({
  ...plainDiagnosis(approach),
  check,
});

/** A proposal of the decided attempt's boundary counterexample, citing its failed check. */
function boundaryProposal(packet: Packet): Proposals {
  const observations = (packet.proposal?.observations ?? []) as {
    ref: string;
    action: string;
    results?: { target: string; outcome: string }[];
  }[];
  const failed = observations.find((o) =>
    o.results?.some((r) => r.target === BOUNDARY && r.outcome === "failed"),
  );
  assert.ok(failed);
  return {
    knowledge: [
      {
        assertion: `Attempt ${packet.attempt}'s parser accepts port 65536.`,
        target: BOUNDARY,
        kind: "counterexample",
        observations: [{ ref: failed.ref, basis: "executed" }],
        contradicts: [],
        supersedes: [],
      },
    ],
    guidance: [],
  };
}

const pinnedConfig = (dir: string): Record<string, unknown> => {
  const [started] = committed<{ config: Record<string, unknown> }>(dir, "run-start");
  assert.ok(started);
  const amended = committed<{ config: Record<string, unknown> }>(dir, "amendment").at(-1);
  return structuredClone(amended?.record.config ?? started.record.config);
};

async function amend(
  dir: string,
  change: (config: Record<string, unknown> & { learning?: Record<string, unknown> }) => void,
  reason = "test amendment",
) {
  const config = pinnedConfig(dir);
  change(config);
  return amendRun(dir, { config, reason, actor: "operator" }, depsOf(w));
}

const phasesOf = (config: Record<string, unknown>): Record<string, number> => {
  const learning = config.learning as { phases: Record<string, number> };
  return learning.phases;
};

describe("T3.6 L3-01 triggers and isolated diagnoses on one sealed snapshot", () => {
  it("a repeated reviewed failure opens one round whose two read-only diagnoses cannot see each other", async () => {
    const dir = branch(w, stopped3);
    const from = mark();
    const producedFrom = w.producer.packets.length;
    const seen: Record<string, { tools: string[]; replies: ToolReply[]; peek?: ToolReply }> = {};
    const texts: Record<string, string> = {};
    const result = await withScript(
      {
        diagnose: async (session) => {
          const side = session.packet.diagnosis?.side ?? "";
          const replies = [
            await session.call("read_file", { path: "src/config.mjs" }),
            await session.call("search_files", { pattern: "65535", path: "src" }),
          ];
          const entry: (typeof seen)[string] = {
            tools: session.request.tools.map((t) => t.name).sort(),
            replies,
          };
          if (side === "alternative") {
            // The approach's committed result exists, but it is not this session's to read.
            const run = w.live.run;
            assert.ok(run);
            const [approach] = sessionsOf(run.dir, "diagnostic-approach");
            assert.ok(approach, "the approach diagnosis is committed before the alternative runs");
            entry.peek = await session.call("read_evidence", { ref: approach.ref });
          }
          seen[side] = entry;
          texts[side] = `${side}-${randomUUID()}`;
          return plainDiagnosis(texts[side] ?? "");
        },
      },
      () => resume(w, dir),
    );
    assertAccepted(result, [LIBRARY]);

    // The trigger and the frozen inputs are recorded before any session.
    const [exploration, ...others] = explorationsIn(dir);
    assert.ok(exploration);
    assert.equal(others.length, 0);
    const e = exploration.record;
    assert.deepEqual(
      [
        e.attempt,
        e.round,
        e.trigger.kind,
        e.trigger.rule,
        e.trigger.occurrences.map((o) => o.attempt),
      ],
      [4, 1, "repeated", R03, [2, 3]],
    );
    const [decided] = decisionsOf(dir, 3);
    assert.ok(decided?.decision === "correct");
    assert.deepEqual(e.findings, decided.findings);
    const evaluated = committed<{ candidate: { commit: string; tree: string } }>(
      dir,
      "evaluation",
      (f) => f.event.attempt === 3,
    ).at(-1);
    assert.equal(e.candidate.commit, evaluated?.record.candidate.commit);
    const firstSession = eventsOf(dir).find(
      (x) => x.action === "start" && x.data.phase === "diagnose",
    );
    assert.ok(exploration.event.seq < (firstSession?.seq ?? 0));

    // Two fresh sessions on the same snapshot with the same inputs; only the side and briefing differ.
    const diagnoses = packetsSince(from).filter((p) => p.diagnosis);
    assert.deepEqual(
      diagnoses.map((p) => p.diagnosis?.side),
      ["approach", "alternative"],
    );
    const [a, b] = diagnoses;
    assert.ok(a && b);
    const shared = (p: Packet) => ({
      ...p,
      diagnosis: { ...p.diagnosis, side: null, briefing: null },
    });
    assert.deepEqual(shared(a), shared(b));
    assert.notEqual(a.diagnosis?.briefing, b.diagnosis?.briefing);
    assert.equal(a.candidate?.commit, e.candidate.commit);
    assert.deepEqual(a.findings, e.findings);
    assert.equal(a.diagnosis?.exploration, exploration.ref);
    const [approach, alternative] = [
      sessionsOf(dir, "diagnostic-approach"),
      sessionsOf(dir, "diagnostic-alternative"),
    ];
    assert.equal(approach.length, 1);
    assert.equal(alternative.length, 1);
    assert.ok(approach[0] && alternative[0]);
    assert.ok(
      !(b.records ?? []).includes(approach[0].ref),
      "the alternative cannot list the approach",
    );
    assert.ok(!stringify(b).includes(texts.approach ?? "?"), "nor be shown its result");
    assert.notEqual(
      approach[0].record.observation.session,
      alternative[0].record.observation.session,
    );

    // Read-only inspection works; the other side's result and every write are out of reach.
    for (const side of ["approach", "alternative"]) {
      assert.deepEqual(seen[side]?.tools, ["read_evidence", "read_file", "search_files"]);
      assert.ok(seen[side]?.replies.every((r) => r.ok));
    }
    assert.equal(seen.alternative?.peek?.ok, false);
    assert.match(
      seen.alternative?.peek?.text ?? "",
      /refused: only the records listed under records/,
    );
    for (const s of [...approach, ...alternative]) {
      assert.ok(
        s.record.observation.toolCalls.every(
          (c) => !["write_file", "run_command"].includes(c.tool),
        ),
      );
    }

    // One producer, one attempt-4 candidate, following the routing.
    const [routing] = routingsIn(dir);
    assert.equal(routing?.record.outcome, "selected");
    const starts = produced(dir, 4);
    assert.equal(starts.length, 1);
    assert.equal(starts[0]?.record.production.exploration, routing?.ref);
    assert.equal(starts[0]?.record.production.from.commit, e.candidate.commit);
    const producer = producerPacket(producedFrom, 4);
    assert.equal(producer?.exploration?.outcome, "selected");
    assert.equal(producer?.exploration?.approach?.side, "approach");
    assert.match(producer?.exploration?.notice ?? "", /not verification/);
    // The independent review of the explored candidate is shown none of it.
    const review = packetsSince(from).find(
      (p) => p.review?.kind === "candidate" && p.attempt === 4,
    );
    assert.ok(review);
    assert.equal(review.exploration, undefined);
    assert.equal(review.records, undefined);
    assert.ok(!stringify(review).includes(exploration.ref));
  });

  it("a reviewed blocking finding naming a choice opens a round before the next attempt", async () => {
    const w1 = await world(scratch, { faults: 1, learning: PHASED });
    w1.script.review = (session) => {
      if (session.packet.attempt !== 1) return null;
      const verdict = faultVerdict(session.packet);
      return {
        ...verdict,
        findings: verdict.findings.map((f, i) =>
          i === 0
            ? { ...f, choice: "tighten the bound or clamp ports; only a probe of 65536 can tell" }
            : f,
        ),
      };
    };
    const dir = assertAccepted(await start(w1), [LIBRARY]);
    const [exploration, ...others] = explorationsIn(dir);
    assert.equal(others.length, 0);
    assert.deepEqual(
      [
        exploration?.record.attempt,
        exploration?.record.trigger.kind,
        exploration?.record.trigger.rule,
      ],
      [2, "choice", R03],
    );
    assert.deepEqual(
      exploration?.record.trigger.occurrences.map((o) => [o.attempt, o.finding]),
      [[1, 0]],
    );
    assert.match(exploration?.record.trigger.cause ?? "", /only a probe of 65536/);
    const [challenge] = reviewsIn(dir, "challenge");
    assert.equal(challenge?.record.attempt, 2);
    const [accepted] = decisionsOf(dir, 2);
    assert.ok(accepted?.decision === "accept");
    assert.ok(accepted.evidence.includes(challenge?.ref ?? "?"));
  });

  it("verifier text, optional findings, equal text under another rule and a single occurrence open no round", async () => {
    const w0 = await world(scratch, { faults: 3, learning: PHASED });
    const unexplored = (dir: string): void => {
      assert.deepEqual(explorationsIn(dir), []);
      for (const phase of ["diagnose", "check", "select", "challenge"]) {
        assert.deepEqual(startsOf(dir, phase), [], phase);
      }
      assert.equal(produced(dir, 4)[0]?.record.production.exploration, undefined);
    };

    // Fault: only the verifier fails the boundary, with the same text each time, and the review's finding is optional.
    w0.script.review = (session) => ({
      ...approveAll(session.packet),
      findings: [
        {
          severity: "optional",
          basis: "inspection",
          rule: R03,
          location: "src/config.mjs:28",
          defect: "the upper port bound accepts 65536",
          correction: "reject every port above 65535",
        },
      ],
    });
    const verifierOnly = assertAccepted(await start(w0), [LIBRARY]);
    unexplored(verifierOnly);
    for (const attempt of [1, 2, 3]) {
      const [d] = decisionsOf(verifierOnly, attempt);
      assert.ok(d?.decision === "correct");
      assert.deepEqual(
        d.findings.map((f) => f.rule),
        [BOUNDARY],
      );
    }

    // Fault: attempt 2's reviewed failure has the same text under another rule.
    w0.script.review = (session) =>
      session.packet.attempt === 2 && session.packet.review ? faultOn(session.packet, R01) : null;
    const otherRule = assertAccepted(await start(w0), [LIBRARY]);
    unexplored(otherRule);
    const [second] = decisionsOf(otherRule, 2);
    assert.ok(second?.decision === "correct" && second.findings.some((f) => f.rule === R01));

    // Fault: one correction attempt only — attempt 3 succeeds after two reviewed failures.
    delete w0.script.review;
    w0.script.extra = (attempt) => (attempt === 3 ? workOf(LIBRARY).good() : {});
    const once = assertAccepted(await start(w0), [LIBRARY]);
    assert.deepEqual(explorationsIn(once), []);
    assert.deepEqual(startsOf(once, "challenge"), []);
    delete w0.script.extra;

    // Control: the same reviewed failure in two correction attempts opens a round.
    const control = assertAccepted(await start(w0), [LIBRARY]);
    assert.deepEqual(
      explorationsIn(control).map((x) => [x.record.attempt, x.record.trigger.kind]),
      [[4, "repeated"]],
    );
  });

  it("a restart after a seal rejection keeps the routing and the challenge without a second round", async () => {
    const dir = branch(w, stopped3);
    const result = await withScript(
      { extra: (attempt) => (attempt === 4 ? { "outside.txt": "not the step's path\n" } : {}) },
      () => resumeRun(dir, depsOf(w, { bypass: true })),
    );
    assertAccepted(result, [LIBRARY]);
    assert.ok(eventsOf(dir).some((e) => e.action === "seal-rejected" && e.attempt === 4));
    const [routing, ...more] = routingsIn(dir);
    assert.equal(more.length, 0);
    assert.equal(explorationsIn(dir).length, 1);
    assert.equal(produced(dir, 5)[0]?.record.production.exploration, routing?.ref);
    const challenges = reviewsIn(dir, "challenge");
    assert.deepEqual(
      challenges.map((c) => c.record.attempt),
      [5],
    );
  });
});

describe("T3.6 L3-02 contained checks and selection", () => {
  it("runs a valid check once on a read-only copy of the explored candidate and refuses one outside its limit", async () => {
    const dir = branch(w, stopped3);
    const from = mark();
    const producedFrom = w.producer.packets.length;
    await withScript(
      {
        diagnose: (session) =>
          session.packet.diagnosis?.side === "approach"
            ? withCheck("tighten the upper bound", {
                argv: BOUNDARY_CHECK,
                timeout_seconds: 20,
                distinguishes: "a bound fix rejects 65536 for any label",
              })
            : withCheck("clamp the port", {
                argv: ["node", "-e", "process.exit(0)"],
                timeout_seconds: 31,
                distinguishes: "nothing",
              }),
      },
      async () => assertAccepted(await resume(w, dir), [LIBRARY]),
    );
    const checks = checksIn(dir);
    assert.deepEqual(
      checks.map((c) => [c.record.side, c.record.outcome]),
      [
        ["approach", "ran"],
        ["alternative", "refused"],
      ],
    );
    const [ran, refused] = checks;
    assert.ok(ran?.record.ran && refused);
    assert.deepEqual(ran.record.argv, BOUNDARY_CHECK);
    assert.equal(ran.record.ran.exit, 0);
    assert.equal(readEvidence(dir, ran.record.ran.stdout).toString("utf8").trim(), "accepted");
    assert.deepEqual(
      ran.event.evidence.slice(1).sort(),
      [ran.record.ran.stdout, ran.record.ran.stderr].sort(),
    );
    assert.deepEqual(refused.record.reasons, ["timeout 31 s is outside 1 to 30 s"]);
    assert.equal(refused.record.ran, null);
    // Each check ran at most once, under its own phase key, reserving no provider allowance.
    assert.deepEqual(
      committed<{ key: string; allowance: number | null }>(
        dir,
        "start",
        (f) => f.event.data.phase === "check",
      ).map((s) => [s.record.key, s.record.allowance]),
      [
        [`check/${LIBRARY}/4/approach`, null],
        [`check/${LIBRARY}/4/alternative`, null],
      ],
    );
    // The selection review is shown both observations; the producer the selected approach's.
    const selection = packetsSince(from).find((p) => p.review?.kind === "selection");
    const shown = selection?.review?.evidence as {
      checks: { side: string; outcome: string; stdout?: string }[];
    };
    assert.deepEqual(
      shown.checks.map((c) => [c.side, c.outcome, c.stdout?.trim() ?? null]),
      [
        ["approach", "ran", "accepted"],
        ["alternative", "refused", null],
      ],
    );
    assert.deepEqual(producerPacket(producedFrom, 4)?.exploration?.approach?.check, {
      argv: BOUNDARY_CHECK,
      outcome: "ran",
      exit: 0,
    });
    // The candidate the attempt starts from is the sealed snapshot the check copied.
    const [exploration] = explorationsIn(dir);
    assert.equal(
      produced(dir, 4)[0]?.record.production.from.commit,
      exploration?.record.candidate.commit,
    );
  });

  it("refuses an invalid check without opening a workspace; a valid one runs", async () => {
    const dir = branch(w, final);
    const [exploration] = explorationsIn(dir);
    assert.ok(exploration);
    let opened = 0;
    await between(dir, async (run) => {
      const open: OpenWorkspace = (snapshot, options) => {
        opened += 1;
        return localWorkspaces(run, join(w.scratch, randomUUID()))(snapshot, options);
      };
      const diagnosis = (
        check: Diagnosis["check"],
        options: { outcome?: "failed"; purpose?: string; exploration?: string } = {},
      ): JournalEvent => {
        const observation = sessionObservation(run.dir, "reviewer", 4, randomUUID());
        const ref = recordSession(
          run,
          options.outcome === "failed"
            ? { outcome: "failed", reason: "provider error", observation }
            : { outcome: "diagnosed", diagnosis: withCheck("probe", check), observation },
          {
            step: LIBRARY,
            purpose: options.purpose ?? "diagnostic-approach",
            exploration: options.exploration ?? exploration.ref,
            key: "test",
          },
        );
        const event = eventsOf(run.dir).find((e) => e.data.record === ref);
        assert.ok(event);
        return event;
      };
      const valid = {
        argv: ["node", "-e", "console.log('probe')"],
        timeout_seconds: 5,
        distinguishes: "probe",
      };
      const refused = async (event: JournalEvent, reasons: RegExp): Promise<void> => {
        const before = opened;
        const stored = await diagnosticCheck(run, {
          exploration,
          side: "approach",
          diagnosis: event,
          open,
          key: "test",
        });
        assert.equal(stored.record.outcome, "refused", stringify(stored.record));
        assert.match(stored.record.reasons.join("; "), reasons);
        assert.equal(stored.record.ran, null);
        assert.equal(opened, before, "a refused check opens no workspace");
      };
      await refused(diagnosis({ ...valid, argv: [] }), /argv has 0 entries; 1 to 32 are allowed/);
      await refused(
        diagnosis({ ...valid, argv: Array.from({ length: 33 }, () => "x") }),
        /argv has 33 entries/,
      );
      await refused(
        diagnosis({ ...valid, argv: ["node", "x".repeat(4097)] }),
        /argv\[1\] has 4097 characters/,
      );
      await refused(
        diagnosis({ ...valid, argv: ["node", "a\0b"] }),
        /argv\[1\] holds a NUL character/,
      );
      await refused(diagnosis({ ...valid, argv: [" "] }), /argv names no program/);
      for (const timeout of [0, 31, 1.5]) {
        await refused(
          diagnosis({ ...valid, timeout_seconds: timeout }),
          /timeout .* is outside 1 to 30 s/,
        );
      }
      await refused(diagnosis(null), /the diagnosis proposed no check/);
      await refused(
        diagnosis(valid, { outcome: "failed" }),
        /the diagnosis did not complete: failed/,
      );
      await refused(
        diagnosis(valid, { purpose: "diagnostic-alternative" }),
        /not this exploration's approach diagnosis/,
      );
      await refused(
        diagnosis(valid, { exploration: "sha256:other" }),
        /not this exploration's approach diagnosis/,
      );
      // Control.
      const stored = await diagnosticCheck(run, {
        exploration,
        side: "approach",
        diagnosis: diagnosis(valid),
        open,
        key: "test",
      });
      assert.equal(stored.record.outcome, "ran");
      assert.equal(
        readEvidence(run.dir, stored.record.ran?.stdout ?? "").toString("utf8"),
        "probe\n",
      );
      assert.equal(opened, 1);
    });
  });

  it("routes only a supported recommendation; a blocked routing names no winner and pauses until amended", async () => {
    // The controller's validation, on the committed exploration of the accepted run.
    const dir = branch(w, final);
    const [exploration] = explorationsIn(dir);
    assert.ok(exploration);
    const diagnoses = (["approach", "alternative"] as const).map((side) => {
      const [s] = sessionsOf(dir, `diagnostic-${side}`);
      assert.ok(s);
      return { side, ref: s.ref, outcome: s.record };
    });
    const [selection] = sessionsOf(dir, "exploration-selection");
    assert.ok(selection?.record.outcome === "reviewed");
    const verdict = selection.record.verdict;
    const subjects = selectionSubjects(exploration.ref);
    const outcomeWith = (v: ReviewVerdict): AgentOutcome => ({
      ...selection.record,
      outcome: "reviewed",
      verdict: v,
    });
    await between(dir, (run) => {
      const route = (v: ReviewVerdict) =>
        routeExploration(run, {
          exploration,
          selection: { ref: selection.ref, outcome: outcomeWith(v) },
          diagnoses,
          checks: [],
          key: "test",
        }).record;
      const blocked = (v: ReviewVerdict, reason: RegExp): void => {
        const r = route(v);
        assert.deepEqual([r.outcome, r.selected], ["blocked", null]);
        assert.match(r.reasons.join("; "), reason);
      };
      const rec = verdict.recommendation;
      assert.ok(rec);
      blocked(
        { ...verdict, recommendation: { ...rec, select: "none", reason: "neither is supported" } },
        /no diagnosis is selected: neither is supported/,
      );
      blocked(
        { ...verdict, recommendation: { ...rec, evidence: ["sha256:invented"] } },
        /cites sha256:invented, which is neither a record it was given nor a path/,
      );
      blocked({ ...verdict, recommendation: { ...rec, evidence: [] } }, /cites no evidence/);
      // A candidate path may carry a line or line range the file has.
      const { tree } = exploration.record.candidate;
      const [path, lines] = [...candidateTree(run, exploration.record.candidate).keys()]
        .map((p) => [p, treeFiles(run.dir, tree, p).get(p)] as const)
        .filter(([, b]) => b !== undefined && b.at(-1) === 0x0a)
        .map(([p, b]) => [p, (b?.toString("utf8").split("\n").length ?? 1) - 1] as const)
        .find(([, n]) => n >= 2) ?? ["", 0];
      assert.ok(lines >= 2, "the candidate has a file of two or more lines");
      const citing = (ref: string): ReviewVerdict => ({
        ...verdict,
        recommendation: { ...rec, evidence: [...rec.evidence, ref] },
      });
      for (const ref of [`${path}:1`, `${path}:${lines}`, `${path}:1-${lines}`]) {
        const r = route(citing(ref));
        assert.equal(r.outcome, "selected", ref);
        assert.ok(r.selected?.evidence.includes(ref), ref);
      }
      blocked(
        citing(`${path}:${lines + 1}`),
        new RegExp(`but ${path} has no such lines \\(it has ${lines}\\)`),
      );
      blocked(
        citing(`${path}:2-1`),
        new RegExp(`but ${path} has no such lines \\(it has ${lines}\\)`),
      );
      for (const ref of [`${path}:0`, `${path}:x`, `${path}:`, "missing.mjs:1"]) {
        blocked(citing(ref), /which is neither a record it was given nor a path/);
      }
      blocked(
        {
          ...verdict,
          verdict: "changes-required",
          coverage: verdict.coverage.map((c) =>
            c.subject === subjects[0] ? { ...c, result: "unsatisfied" } : c,
          ),
          findings: [
            {
              severity: "blocking",
              basis: "inspection",
              rule: subjects[0] ?? "",
              location: "src/config.mjs:28",
              defect: "unsupported",
              correction: "none",
            },
          ],
        },
        /the recommended approach diagnosis is unsatisfied/,
      );
      blocked(
        { ...verdict, coverage: verdict.coverage.slice(1) },
        /the selection review is incomplete/,
      );
      blocked(
        { ...verdict, verdict: "blocked", blockers: ["the checks contradict each other"] },
        /the selection review is blocked: the checks contradict each other/,
      );
      const { recommendation: _omitted, ...without } = verdict;
      void _omitted;
      blocked(without, /recommends nothing/);
      // Control: the committed recommendation.
      assert.equal(route(verdict).outcome, "selected");
    });

    // Through the runner: no winner, a pause for the owner, then the attempt proceeds once amended.
    const paused = branch(w, stopped3);
    const producedFrom = w.producer.packets.length;
    await withScript(
      {
        select: (session) =>
          selectionVerdict(session.packet, {
            select: "none",
            reason: "the diagnoses contradict each other",
          }),
      },
      async () => {
        const result = await resume(w, paused);
        assertPaused(result, { code: "owner", step: LIBRARY });
        assert.ok(result.outcome === "paused");
        assert.match(
          result.reasons[0]?.detail ?? "",
          /no approach was selected for attempt 4: no diagnosis is selected: the diagnoses contradict each other/,
        );
        assert.deepEqual(produced(paused, 4), []);
        const [routing] = routingsIn(paused);
        assert.deepEqual([routing?.record.outcome, routing?.record.selected], ["blocked", null]);
        // Resuming without an amendment changes nothing.
        assertPaused(await resume(w, paused), { code: "owner", step: LIBRARY });
        assert.equal(sessionsOf(paused, "exploration-selection").length, 1);
        const amended = await amend(paused, (c) => {
          phasesOf(c).exploration_rounds = 3;
        });
        assert.ok(amended.ok, amended.ok ? "" : amended.diagnostics.join("\n"));
        assertAccepted(await resume(w, paused), [LIBRARY]);
        assert.equal(produced(paused, 4)[0]?.record.production.exploration, routing?.ref);
        const packet = producerPacket(producedFrom, 4);
        assert.deepEqual(
          [packet?.exploration?.outcome, packet?.exploration?.approach],
          ["blocked", null],
        );
        assert.equal(reviewsIn(paused, "challenge").length, 1);
      },
    );
  });

  it("a selected approach and agreeing diagnoses grant nothing: the explored attempt is still verified and reviewed", async () => {
    const dir = branch(w, stopped3);
    const faulty = workOf(LIBRARY).fault();
    await withScript(
      {
        extra: (attempt) => (attempt === 4 ? faulty : {}),
        diagnose: () => plainDiagnosis("tighten the upper bound"),
      },
      async () => stopped(await resume(w, dir, 4)),
    );
    const [routing] = routingsIn(dir);
    assert.equal(routing?.record.outcome, "selected");
    const [a, b] = [
      sessionsOf(dir, "diagnostic-approach")[0],
      sessionsOf(dir, "diagnostic-alternative")[0],
    ];
    assert.ok(a?.record.outcome === "diagnosed" && b?.record.outcome === "diagnosed");
    assert.equal(a.record.diagnosis.approach, b.record.diagnosis.approach);
    const [decision] = decisionsOf(dir, 4);
    assert.ok(decision?.decision === "correct", stringify(decision));
    assert.ok(decision.reasons.some((r) => r.subject === BOUNDARY));
    assert.ok(decision.findings.some((f) => f.rule === R03));
    assert.ok(!eventsOf(dir).some((e) => e.action === "acceptance"));
    // The decision counted the explored attempt's own verification and review; the challenge ran too.
    assert.equal(reviewsIn(dir, "challenge").length, 1);
  });
});

describe("T3.6 L3-03 cross-attempt challenge", () => {
  it("blocks a symptom-only fix that verification and the independent review passed; the corrected control is accepted", async () => {
    const dir = branch(w, stopped3);
    const from = mark();
    let earlier: ToolReply | undefined;
    await withScript(
      {
        extra: (attempt) => (attempt === 4 ? symptomFix() : {}),
        challenge: async (session) => {
          // The history's original records are readable.
          const record = session.packet.records?.[1];
          if (record) earlier = await session.call("read_evidence", { ref: record });
          return inspectingChallenge(session);
        },
      },
      async () => assertAccepted(await resume(w, dir), [LIBRARY]),
    );
    assert.equal(earlier?.ok, true);
    // Attempt 4: verified and independently reviewed as passing, challenged as a symptom-only fix.
    const verified = committed<{ results: { outcome: string }[] }>(
      dir,
      "verifier-invocation",
      (f) => f.event.attempt === 4 && f.event.data.stage === "acceptance",
    );
    assert.ok(verified.length > 0);
    assert.ok(verified.every((v) => v.record.results.every((r) => r.outcome === "passed")));
    const [review4] = reviewsIn(dir, "candidate").filter((r) => r.record.attempt === 4);
    assert.ok(review4?.record.outcome.outcome === "reviewed");
    assert.equal(review4.record.outcome.verdict.verdict, "pass");
    const challenges = reviewsIn(dir, "challenge");
    assert.deepEqual(
      challenges.map((c) => [
        c.record.attempt,
        c.record.outcome.outcome === "reviewed" ? c.record.outcome.verdict.verdict : null,
      ]),
      [
        [4, "changes-required"],
        [5, "pass"],
      ],
    );
    const [decision4] = decisionsOf(dir, 4);
    assert.ok(decision4?.decision === "correct");
    assert.deepEqual(
      decision4.findings.map((f) => f.rule),
      [`${LIBRARY}/challenge/symptom`],
    );
    // Attempt 5 corrects it, under the same exploration, and passes both review purposes.
    assert.equal(explorationsIn(dir).length, 1);
    const [routing] = routingsIn(dir);
    assert.equal(produced(dir, 5)[0]?.record.production.exploration, routing?.ref);
    const [review5] = reviewsIn(dir, "candidate").filter((r) => r.record.attempt === 5);
    const challenge5 = challenges[1];
    assert.ok(review5 && challenge5);
    assert.equal(
      challenge5.record.records?.[0],
      review5.ref,
      "the challenge consumed the binding review",
    );
    assert.equal(challenge5.record.rubric, CHALLENGE_RUBRIC.digest);
    const [accepted] = decisionsOf(dir, 5);
    assert.ok(accepted?.decision === "accept");
    assert.ok(
      accepted.evidence.includes(review5.ref) && accepted.evidence.includes(challenge5.ref),
    );
    // The challenge was given the step's history; the independent review none of it.
    const packet = packetsSince(from).find(
      (p) => p.review?.kind === "challenge" && p.attempt === 5,
    );
    const history = packet?.review?.evidence as {
      attempts: { attempt: number; reviews: { kind: string }[] }[];
    };
    assert.deepEqual(
      history.attempts.map((x) => x.attempt),
      [1, 2, 3, 4],
    );
    assert.ok(history.attempts[3]?.reviews.some((r) => r.kind === "challenge"));
    assert.deepEqual(packet?.review?.subjects, challengeSubjects(LIBRARY));
    for (const p of packetsSince(from).filter((x) => x.review?.kind === "candidate")) {
      assert.equal(p.records, undefined);
      assert.equal(p.exploration, undefined);
    }
  });

  it("a missing, stale, unbound or other-rubric challenge cannot accept; a current one can", async () => {
    const dir = branch(w, final);
    const evaluation = committed<{
      candidate: { commit: string };
      claims: { output: string; paths: string[] }[];
      manifest: Parameters<typeof decideAcceptance>[0]["manifest"];
    }>(dir, "evaluation", (f) => f.event.attempt === 4).at(-1);
    assert.ok(
      evaluation?.record.manifest.exploration,
      "the explored attempt's evaluation names its routing",
    );
    const [start4] = produced(dir, 4);
    const policy = (
      start4?.record.production as unknown as {
        policy: Parameters<typeof decideAcceptance>[0]["policy"];
      }
    ).policy;
    await between(dir, (run) => {
      const input = journalInput(run, {
        plan: w.plan,
        step: LIBRARY,
        run: run.run,
        attempt: 4,
        manifest: evaluation.record.manifest,
        registry: bootstrapRegistry(),
        policy,
        claims: evaluation.record.claims,
      });
      const challenge = input.reviews.find((r) => r.record.kind === "challenge");
      assert.ok(challenge);
      const routes = (d: Decision): string[] =>
        d.decision === "accept"
          ? []
          : d.reasons
              .filter((r) => r.subject.includes("challenge"))
              .map((r) => `${r.route}: ${r.detail}`);
      // Control.
      assert.equal(decideAcceptance(input).decision, "accept");
      // Missing.
      const missing = decideAcceptance({
        ...input,
        reviews: input.reviews.filter((r) => r !== challenge),
      });
      assert.equal(missing.decision, "pause");
      assert.deepEqual(routes(missing), ["retry: the required cross-attempt challenge is missing"]);
      // Unbound or of another rubric: journaled records whose only defect is that.
      const forged = (change: Partial<ReviewRecord>) => {
        const record = { ...challenge.record, ...change };
        const ref = putEvidence(run, stringify(record));
        appendEvent(run, {
          action: "review",
          attempt: 4,
          evaluation: challenge.record.evaluation,
          evidence: [ref],
          data: { record: ref, kind: "challenge" },
        });
        return { ref, record };
      };
      const unbound = forged({ records: (challenge.record.records ?? []).slice(1) });
      const reloaded = journalInput(run, {
        plan: w.plan,
        step: LIBRARY,
        run: run.run,
        attempt: 4,
        manifest: evaluation.record.manifest,
        registry: bootstrapRegistry(),
        policy,
        claims: evaluation.record.claims,
      });
      assert.ok(
        reloaded.reviews.some((r) => r.ref === unbound.ref),
        "the forged challenge is committed",
      );
      const unboundOnly = decideAcceptance({
        ...reloaded,
        reviews: reloaded.reviews.filter((r) => r.ref !== challenge.ref),
      });
      assert.equal(unboundOnly.decision, "pause");
      assert.match(
        routes(unboundOnly).join("; "),
        /no complete cross-attempt challenge: challenge .* was not given the binding review/,
      );
      const rubric = forged({ rubric: COMMON_RUBRIC.digest });
      const otherRubric = decideAcceptance({
        ...input,
        journaled: new Set([...input.journaled, rubric.ref]),
        reviews: [...input.reviews.filter((r) => r !== challenge), rubric],
      });
      assert.equal(otherRubric.decision, "pause");
      assert.match(
        routes(otherRubric).join("; "),
        /retry: it applied another rubric than the challenge rubric/,
      );
      // Stale: a challenge of another evaluation of the same candidate.
      const stale = forged({ evaluation: "sha256:other-evaluation" });
      const staleOnly = decideAcceptance({
        ...input,
        journaled: new Set([...input.journaled, stale.ref]),
        reviews: [...input.reviews.filter((r) => r !== challenge), stale],
      });
      assert.equal(staleOnly.decision, "pause");
      assert.ok(
        staleOnly.reasons.some((r) =>
          /it is stale: evaluation sha256:other-evaluation/.test(r.detail),
        ),
      );
      assert.match(routes(staleOnly).join("; "), /the required cross-attempt challenge is missing/);
    });

    // Through the runner: an amended reviewer effort makes a new evaluation, whose acceptance needs a new challenge.
    const renewed = branch(w, final);
    const amended = await amend(renewed, (c) => {
      (c.roles as { reviewer: { effort: string } }).reviewer.effort = "medium";
    });
    assert.ok(amended.ok, amended.ok ? "" : amended.diagnostics.join("\n"));
    assertAccepted(await resume(w, renewed), [LIBRARY]);
    const challenges = reviewsIn(renewed, "challenge");
    assert.equal(challenges.length, 2);
    const [old, current] = challenges;
    assert.notEqual(old?.record.evaluation, current?.record.evaluation);
    const accepted = decisionsOf(renewed, 4).filter((d) => d.decision === "accept");
    assert.equal(accepted.length, 2);
    const latest = accepted.at(-1);
    assert.ok(latest?.decision === "accept" && latest.evidence.includes(current?.ref ?? "?"));
    assert.ok(!latest.evidence.includes(old?.ref ?? "?"));
    // Neither the candidate nor the exploration was produced again.
    assert.equal(produced(renewed, 4).length, 1);
    assert.equal(explorationsIn(renewed).length, 1);
  });

  it("an incomplete challenge is reviewed again; a blocked one pauses for the owner", async () => {
    const dir = branch(w, stopped3);
    let calls = 0;
    await withScript(
      {
        challenge: (session) => {
          calls += 1;
          const verdict = approveAll(session.packet);
          return calls === 1 ? { ...verdict, coverage: verdict.coverage.slice(1) } : verdict;
        },
      },
      async () => assertAccepted(await resume(w, dir), [LIBRARY]),
    );
    assert.equal(reviewsIn(dir, "challenge").length, 2);
    assert.equal(startsOf(dir, "challenge").length, 2, "the second challenge is a counted retry");

    const blocked = branch(w, stopped3);
    await withScript(
      {
        challenge: (session) => ({
          ...approveAll(session.packet),
          verdict: "blocked",
          coverage: [],
          blockers: ["the history is unreadable"],
        }),
      },
      async () => {
        const result = await resume(w, blocked);
        assertPaused(result, { code: "owner", step: LIBRARY });
        assert.ok(result.outcome === "paused");
        assert.ok(
          result.reasons.some((r) =>
            /the challenge is blocked: the history is unreadable/.test(r.detail),
          ),
        );
      },
    );
    assert.ok(!eventsOf(blocked).some((e) => e.action === "acceptance"));
  });
});

describe("T3.6 L3-04 budgets, limits and recovery", () => {
  it("every added session reserves its allowance before dispatch and is charged to the run", async () => {
    const events = eventsOf(final);
    const added = events.filter(
      (e) =>
        (e.action === "agent-invocation" && typeof e.data.key === "string") ||
        (e.action === "review" && e.data.kind === "challenge"),
    );
    assert.deepEqual(
      added.map((e) => String(e.data.purpose ?? e.data.kind)),
      [
        "learning-proposal",
        "learning-proposal",
        "learning-proposal",
        "diagnostic-approach",
        "diagnostic-alternative",
        "exploration-selection",
        "challenge",
      ],
    );
    for (const e of added) {
      const opened = events.filter((s) => s.action === "start" && s.seq < e.seq).at(-1);
      const record = committed<{ key: string; allowance: number | null }>(
        final,
        "start",
        (f) => f.event.seq === opened?.seq,
      )[0];
      assert.ok(record, `a start precedes ${e.seq}`);
      assert.equal(record.record.allowance, 1, `${record.record.key} reserves its allowance`);
      if (typeof e.data.key === "string") assert.equal(record.record.key, e.data.key);
      else assert.match(record.record.key, new RegExp(`^challenge/${LIBRARY}/`));
    }
    const facts = await runFacts(final, depsOf(w));
    assert.ok(facts.ok);
    const sessions = events.filter(
      (e) => e.action === "agent-invocation" || e.action === "review",
    ).length;
    assert.ok(
      Math.abs(facts.facts.spending.reportedUsd - sessions * 0.01) < 1e-9,
      String(facts.facts.spending.reportedUsd),
    );
    assert.deepEqual([facts.facts.spending.unresolved, unresolvedKeys(final)], [0, []]);
    assert.deepEqual(
      facts.facts.learning?.explorations.map((x) => [
        x.attempt,
        x.trigger.kind,
        x.routing?.outcome,
        x.diagnoses.map((d) => d.outcome),
      ]),
      [[4, "repeated", "selected", ["diagnosed", "diagnosed"]]],
    );
    assert.deepEqual(
      facts.facts.learning?.challenges.map((c) => [c.step, c.attempt, c.verdict]),
      [[LIBRARY, 4, "pass"]],
    );
  });

  it("a run spend limit pauses before a required diagnosis or challenge, never skipping it, and keeps usage across the amendment", async () => {
    const dir = branch(w, stopped3);
    const reported = async (): Promise<number> => {
      const facts = await runFacts(dir, depsOf(w));
      assert.ok(facts.ok);
      return facts.facts.spending.reportedUsd;
    };
    const setLimit = async (usd: number) => {
      const amended = await amend(dir, (c) => {
        (c.budgets as { run_spend_usd?: number }).run_spend_usd = usd;
      });
      assert.ok(amended.ok, amended.ok ? "" : amended.diagnostics.join("\n"));
    };
    // Room for the proposal session alone.
    const atStop = await reported();
    await setLimit(atStop + 1.005);
    const first = await resume(w, dir);
    assertPaused(first, { code: "exhausted", step: LIBRARY });
    assert.ok(first.outcome === "paused");
    assert.match(first.reasons[0]?.detail ?? "", /spend limit cannot cover another session/);
    assert.equal(sessionsOf(dir, "learning-proposal").length, 3);
    assert.deepEqual(startsOf(dir, "diagnose"), []);
    // Room up to the explored candidate's review, not its challenge.
    const atDiagnosis = await reported();
    assert.ok(atDiagnosis > atStop);
    await setLimit(atDiagnosis + 1.045);
    const second = await resume(w, dir);
    assertPaused(second, { code: "exhausted", step: LIBRARY });
    assert.equal(reviewsIn(dir, "candidate").filter((r) => r.record.attempt === 4).length, 1);
    assert.deepEqual(startsOf(dir, "challenge"), []);
    assert.deepEqual(decisionsOf(dir, 4), [], "the attempt is not decided without its challenge");
    // Room again: the challenge runs and usage only grew.
    const atChallenge = await reported();
    await setLimit(100);
    assertAccepted(await resume(w, dir), [LIBRARY]);
    assert.ok((await reported()) > atChallenge);
    assert.equal(reviewsIn(dir, "challenge").length, 1);
  });

  it("the run's exploration rounds bound the triggers, and an attempt has at most one round", async () => {
    const dir = branch(w, stopped3);
    const amended = await amend(dir, (c) => {
      phasesOf(c).exploration_rounds = 1;
    });
    assert.ok(amended.ok);
    let lost = false;
    await withScript(
      {
        // The fault persists, and attempt 4's first producer session is lost.
        extra: (attempt) => (attempt >= 4 ? workOf(LIBRARY).fault() : {}),
        during: (session) => {
          if (session.packet.attempt !== 4 || lost) return;
          lost = true;
          throw new Error("the session was lost");
        },
      },
      async () => {
        const first = await resume(w, dir);
        assertPaused(first, { code: "exhausted", step: LIBRARY });
        assert.ok(first.outcome === "paused");
        assert.match(
          first.reasons[0]?.detail ?? "",
          /the run's 1 exploration rounds are used; attempt 5 needs one for the repeated trigger on CP97-S01\/R03/,
        );
        assert.equal(produced(dir, 4).length, 2, "attempt 4's retry");
        assert.deepEqual(produced(dir, 5), []);
        assert.deepEqual(
          explorationsIn(dir).map((x) => [x.record.attempt, x.record.round]),
          [[4, 1]],
        );
        const raised = await amend(dir, (c) => {
          phasesOf(c).exploration_rounds = 2;
        });
        assert.ok(raised.ok);
        const second = await resume(w, dir);
        assertPaused(second, { code: "exhausted", step: LIBRARY });
        assert.ok(second.outcome === "paused");
        assert.match(
          second.reasons[0]?.detail ?? "",
          /the run's 2 exploration rounds are used; attempt 6 needs one/,
        );
      },
    );
    assert.deepEqual(
      explorationsIn(dir).map((x) => [x.record.attempt, x.record.round]),
      [
        [4, 1],
        [5, 2],
      ],
    );
  });

  it("an interruption after each new durable boundary resumes without replaying completed work", async () => {
    const boundaries: { action: string; purpose?: string; kind?: string }[] = [
      { action: "agent-invocation", purpose: "learning-proposal" },
      { action: "exploration-start" },
      { action: "agent-invocation", purpose: "diagnostic-approach" },
      { action: "agent-invocation", purpose: "diagnostic-alternative" },
      { action: "exploration-check" },
      { action: "agent-invocation", purpose: "exploration-selection" },
      { action: "exploration-routing" },
      { action: "review", kind: "challenge" },
    ];
    for (const boundary of boundaries) {
      const label = stringify(boundary);
      const dir = branch(w, stopped3);
      let fired = false;
      const progress = (event: JournalEvent): void => {
        if (fired || event.action !== boundary.action) return;
        if (boundary.purpose && event.data.purpose !== boundary.purpose) return;
        if (boundary.kind && event.data.kind !== boundary.kind) return;
        fired = true;
        throw new Crash(`crash after ${label}`);
      };
      await withScript(
        {
          diagnose: (session) =>
            withCheck(
              `${session.packet.diagnosis?.side ?? ""} approach`,
              session.packet.diagnosis?.side === "approach"
                ? {
                    argv: ["node", "-e", "console.log('probe')"],
                    timeout_seconds: 5,
                    distinguishes: "probe",
                  }
                : null,
            ),
        },
        async () => {
          await assert.rejects(resumeRun(dir, depsOf(w, { progress })), Crash, label);
          assert.ok(fired, label);
          assertAccepted(await resume(w, dir), [LIBRARY]);
        },
      );
      // Every completed phase has one start and one result; no work was replayed.
      const keyed = eventsOf(dir).filter(
        (e) => typeof e.data.key === "string" && e.action !== "start",
      );
      const keys = keyed.map((e) => String(e.data.key));
      assert.deepEqual(keys, [...new Set(keys)], label);
      const starts = committed<{ key: string }>(dir, "start").map((s) => s.record.key);
      assert.deepEqual(starts, [...new Set(starts)], `${label}: no phase ran twice`);
      assert.equal(reviewsIn(dir, "challenge").length, 1, label);
      assert.equal(explorationsIn(dir).length, 1, label);
      assert.equal(routingsIn(dir).length, 1, label);
      assert.equal(checksIn(dir).length, 1, label);
    }
  });

  it("a runner lost inside a diagnosis or a challenge keeps the session's allowance reserved, and the rerun counts as a retry", async () => {
    for (const lostIn of ["diagnosis", "challenge"] as const) {
      const dir = branch(w, stopped3);
      const good = w.reviewer;
      let crashed = false;
      w.reviewer = Object.assign(
        (request: Parameters<typeof good>[0]) => {
          const packet = JSON.parse(
            request.prompt.slice(request.prompt.indexOf("\n") + 1),
          ) as Packet;
          const hit =
            lostIn === "diagnosis"
              ? packet.diagnosis?.side === "alternative"
              : packet.review?.kind === "challenge";
          if (hit && !crashed) {
            crashed = true;
            throw new Crash(`the runner was lost in the ${lostIn}`);
          }
          return good(request);
        },
        { requests: good.requests, packets: good.packets },
      );
      try {
        await assert.rejects(resume(w, dir), Crash);
      } finally {
        w.reviewer = good;
      }
      const lostFacts = await runFacts(dir, depsOf(w));
      assert.ok(lostFacts.ok);
      const key =
        lostIn === "diagnosis" ? `diagnose/${LIBRARY}/4/alternative` : `challenge/${LIBRARY}/`;
      const lost = unresolvedKeys(dir);
      assert.equal(lost.length, 1);
      assert.ok(lost[0]?.startsWith(key), lost[0]);
      assert.deepEqual(
        [lostFacts.facts.spending.unresolved, lostFacts.facts.spending.reservedUsd],
        [1, 1],
      );
      assertAccepted(await resume(w, dir), [LIBRARY]);
      const facts = await runFacts(dir, depsOf(w));
      assert.ok(facts.ok);
      assert.deepEqual(unresolvedKeys(dir), lost, "it stays reserved");
      assert.deepEqual([facts.facts.spending.unresolved, facts.facts.spending.reservedUsd], [1, 1]);
      const starts = committed<{ key: string }>(dir, "start").map((s) => s.record.key);
      assert.equal(
        starts.filter((k) => k.startsWith(key)).length,
        2,
        `${lostIn}: one counted retry`,
      );
      assert.equal(
        sessionsOf(dir, "diagnostic-approach").length,
        1,
        "the completed approach is not replayed",
      );
    }
  });

  it("a failed, cancelled or exhausted proposal or proposal review runs again or waits under its key, and is never skipped", async () => {
    const phases = {
      propose: { purpose: "learning-proposal", success: "proposed", what: "learning proposal" },
      support: { purpose: "knowledge-review", success: "reviewed", what: "proposal review" },
    } as const;
    const base = eventsOf(stopped3).at(-1)?.seq ?? 0;
    for (const [phase, { purpose, success, what }] of Object.entries(phases)) {
      const targeted = (packet: Packet): boolean =>
        phase === "propose" ? packet.proposal !== undefined : packet.review?.kind === "knowledge";
      for (const fault of ["failed", "cancelled", "exhausted"] as const) {
        const label = `${phase}, ${fault}`;
        const dir = branch(w, stopped3);
        const sessions = () => sessionsOf(dir, purpose).filter((f) => f.event.seq > base);
        const outcomes = () => sessions().map((f) => f.record.outcome);
        const keyed = () => {
          const keys = startsOf(dir, phase)
            .filter((e) => e.seq > base)
            .map((e) =>
              String(
                committed<{ key: string }>(dir, "start", (f) => f.event.seq === e.seq)[0]?.record
                  .key,
              ),
            );
          return keys.filter((k) => k === keys[0]);
        };
        const cancel = new AbortController();
        let injected = false;
        await withScript(
          {
            proposals: boundaryProposal,
            learningReply: async (session) => {
              if (injected || !targeted(session.packet)) return undefined;
              injected = true;
              if (fault === "failed") return { raw: "not json" };
              if (fault === "exhausted") return { subtype: "error_max_turns" };
              // The run is cancelled while the session runs.
              const { signal } = session.request.abort;
              cancel.abort();
              if (!signal.aborted) {
                await new Promise((resolve) => signal.addEventListener("abort", resolve));
              }
              return { raw: "" };
            },
          },
          async () => {
            const first = await resumeRun(dir, depsOf(w, { controller: cancel }));
            if (fault === "cancelled") {
              stopped(first);
              assert.deepEqual(outcomes(), ["cancelled"], label);
            } else if (fault === "exhausted") {
              assertPaused(first, { code: "exhausted", step: LIBRARY });
              assert.ok(first.outcome === "paused");
              assert.equal(
                first.reasons[0]?.detail,
                `the ${what} exhausted its turns limit`,
                label,
              );
              // Without an amendment it stays paused and nothing runs again.
              assertPaused(await resume(w, dir), { code: "exhausted", step: LIBRARY });
              assert.deepEqual([outcomes(), keyed().length], [["exhausted"], 1], label);
              const amended = await amend(dir, (c) => {
                phasesOf(c).exploration_rounds = 3;
              });
              assert.ok(amended.ok, label);
            }
            if (fault === "failed") assertAccepted(first, [LIBRARY]);
            else {
              assert.deepEqual(explorationsIn(dir), [], `${label}: nothing after it ran`);
              assert.deepEqual(produced(dir, 4), [], label);
              assertAccepted(await resume(w, dir), [LIBRARY]);
            }
          },
        );
        // The same key ran once more, as a counted retry, to its expected outcome.
        assert.deepEqual(outcomes(), [fault, success], label);
        assert.equal(keyed().length, 2, `${label}: one counted retry`);
        const done = sessions().at(-1);
        assert.ok(done);
        const [exploration] = explorationsIn(dir);
        const [production] = produced(dir, 4);
        assert.ok(exploration && production, label);
        assert.ok(done.event.seq < exploration.event.seq, `${label}: before the exploration`);
        assert.ok(done.event.seq < production.event.seq, `${label}: before attempt 4`);
        if (phase === "support") {
          const admissions = eventsOf(dir).filter(
            (e) => e.action === "knowledge-admission" && e.seq > base,
          );
          assert.equal(admissions.length, 1, `${label}: admitted once`);
          assert.ok((admissions[0]?.seq ?? 0) > done.event.seq, label);
        }
        assert.deepEqual(unresolvedKeys(dir), [], label);
      }

      // Control: a fault in every session stops at the step's retry limit, unskipped.
      const dir = branch(w, stopped3);
      await withScript(
        {
          proposals: boundaryProposal,
          learningReply: (session) => (targeted(session.packet) ? { raw: "not json" } : undefined),
        },
        async () => {
          const result = await resume(w, dir);
          assertPaused(result, { code: "retries", step: LIBRARY });
        },
      );
      const retries = (pinnedConfig(dir).budgets as { retries: number }).retries;
      assert.deepEqual(
        sessionsOf(dir, purpose)
          .filter((f) => f.event.seq > base)
          .map((f) => f.record.outcome),
        Array.from({ length: retries + 1 }, () => "failed"),
        phase,
      );
      assert.deepEqual([explorationsIn(dir), produced(dir, 4)], [[], []], phase);
    }
  });

  it("refuses an amendment of the learning mode and incompatible exploration records; a compatible archive restores them", async () => {
    const dir = branch(w, final);
    const before = eventsOf(dir).length;
    const noPhases = await amend(dir, (c) => {
      delete (c.learning as Record<string, unknown>).phases;
    });
    assert.deepEqual(noPhases, {
      ok: false,
      diagnostics: [
        "the learning mode cannot be amended within a run (phases to context); start a new run",
      ],
    });
    const none = await amend(dir, (c) => {
      delete c.learning;
    });
    assert.ok(!none.ok && /\(phases to none\)/.test(none.diagnostics.join("")));
    assert.equal(eventsOf(dir).length, before, "a refused amendment journals nothing");
    const control = await amend(dir, (c) => {
      phasesOf(c).check_timeout_seconds = 60;
    });
    assert.ok(control.ok);

    // Incompatible records refuse the run; nothing is migrated or written but the pause.
    const cases: [string, (run: Parameters<Parameters<typeof between>[1]>[0]) => void, RegExp][] = [
      [
        "format",
        (run) => {
          const ref = putEvidence(
            run,
            stringify({ format: 2, controller: CONTROLLER, step: LIBRARY, attempt: 4 }) ?? "",
          );
          appendEvent(run, {
            action: "exploration-start",
            attempt: 4,
            evidence: [ref],
            data: { record: ref, step: LIBRARY },
          });
        },
        /exploration-start format 2 is not supported/,
      ],
      [
        "controller",
        (run) => {
          const ref = putEvidence(
            run,
            stringify({ format: 1, controller: "another", step: LIBRARY, attempt: 4 }) ?? "",
          );
          appendEvent(run, {
            action: "exploration-start",
            attempt: 4,
            evidence: [ref],
            data: { record: ref, step: LIBRARY },
          });
        },
        /written by controller another, not t3-6-l1-test/,
      ],
      [
        "action",
        (run) => {
          const ref = putEvidence(run, stringify({ format: 1, controller: CONTROLLER }) ?? "");
          appendEvent(run, {
            action: "exploration-verdict",
            evidence: [ref],
            data: { record: ref },
          });
        },
        /unknown exploration record exploration-verdict/,
      ],
    ];
    for (const [label, write, diagnostic] of cases) {
      const refused = branch(w, stopped3);
      await between(refused, write);
      const journaled = eventsOf(refused).length;
      const result = await resume(w, refused);
      assert.ok(result.outcome === "paused", stringify(result));
      assert.deepEqual([result.step, result.reasons.map((r) => r.code)], [null, ["owner"]]);
      assert.match(result.reasons.map((r) => r.detail).join("\n"), diagnostic, label);
      assert.deepEqual(
        eventsOf(refused)
          .slice(journaled)
          .map((e) => e.action),
        ["owner", "pause", "released"],
        label,
      );
    }

    // A compatible archive restores the same exploration records and facts.
    const { files } = await packState(final, join(w.scratch, randomUUID()), {
      name: "l3-compatible",
      sequence: 1,
      controller: { commit: "0".repeat(40), identity: CONTROLLER },
    });
    const restored = await unpackState(files, join(w.scratch, randomUUID()), {
      name: "l3-compatible",
      sequence: 1,
    });
    assert.ok(restored.ok, restored.ok ? "" : restored.diagnostics.join("\n"));
    const records = (d: string) => {
      const read = readRun(d);
      assert.ok(read.ok);
      const r = explorationRecords(
        { dir: d } as unknown as RunHandle,
        read.records.events,
        CONTROLLER,
      );
      assert.ok(r.ok);
      return stringify(r.value);
    };
    assert.equal(records(restored.dir), records(final));
    const [a, b] = [await runFacts(final, depsOf(w)), await runFacts(restored.dir, depsOf(w))];
    assert.ok(a.ok && b.ok);
    assert.deepEqual(b.facts.learning, a.facts.learning);
    assert.deepEqual(readFileSync(files.archive).length > 0, true);
  });
});

describe("T3.6 L3 recheck of earlier behaviour", () => {
  it("a run without learning phases schedules none and builds the L2 packets", async () => {
    const wl = await world(scratch, { faults: 3 });
    const dir = assertAccepted(await start(wl), [LIBRARY]);
    const actions = new Set(eventsOf(dir).map((e) => e.action));
    for (const action of ["exploration-start", "exploration-check", "exploration-routing"]) {
      assert.ok(!actions.has(action), action);
    }
    for (const phase of ["propose", "support", "diagnose", "check", "select", "challenge"]) {
      assert.deepEqual(startsOf(dir, phase), [], phase);
    }
    assert.ok(wl.producer.packets.every((p) => p.exploration === undefined));
    assert.ok(
      wl.reviewer.packets.every((p) => p.diagnosis === undefined && p.review?.kind !== "challenge"),
    );
    assert.ok(
      wl.reviewer.packets
        .filter((p) => p.review?.kind === "candidate")
        .every((p) => p.records === undefined),
    );
    const evaluations = committed<{ manifest: { exploration?: string } }>(dir, "evaluation");
    assert.ok(evaluations.every((e) => e.record.manifest.exploration === undefined));
    const facts = await runFacts(dir, depsOf(wl));
    assert.ok(facts.ok);
    assert.deepEqual(
      [facts.facts.learning?.explorations, facts.facts.learning?.challenges],
      [[], []],
    );
  });

  it("the runner proposes after each corrected attempt, reviews and admits each proposal, and resumes an admission without a second review", async () => {
    const wk = await world(scratch, { faults: 3, learning: PHASED });
    wk.script.proposals = boundaryProposal;
    let crashed = false;
    const progress = (event: JournalEvent): void => {
      if (
        !crashed &&
        event.action === "agent-invocation" &&
        event.data.purpose === "knowledge-review"
      ) {
        crashed = true;
        throw new Crash("crash after the review, before its admission");
      }
    };
    await assert.rejects(startRun(wk.config, depsOf(wk, { progress })), Crash);
    const run = wk.live.run;
    assert.ok(run);
    const dir = assertAccepted(await resume(wk, run.dir), [LIBRARY]);
    const proposals = committed<{ attempt: number }>(dir, "knowledge-proposal");
    assert.deepEqual(
      proposals.map((p) => p.record.attempt),
      [1, 2, 3],
    );
    for (const p of proposals) {
      const reviews = committed<AgentOutcome>(
        dir,
        "agent-invocation",
        (f) => f.event.data.proposal === p.ref,
      );
      assert.equal(reviews.length, 1, "each proposal is reviewed once");
      const admissions = eventsOf(dir).filter(
        (e) => e.action === "knowledge-admission" && e.evidence[1] === p.ref,
      );
      assert.equal(admissions.length, 1, "and admitted once");
      assert.equal(admissions[0]?.data.disposition, "supported");
    }
    for (const attempt of [1, 2, 3]) {
      const [proposer] = committed<AgentOutcome>(
        dir,
        "agent-invocation",
        (f) => f.event.data.purpose === "learning-proposal" && f.event.attempt === attempt,
      );
      assert.ok(proposer, `attempt ${attempt} is proposed from`);
    }
    // A later attempt's frozen context consumes what earlier attempts supported.
    const [start2] = committed<{ production: { context?: { knowledge: unknown[] } } }>(
      dir,
      "start",
      (f) => f.event.data.phase === "produce" && f.event.attempt === 2,
    );
    assert.ok((start2?.record.production.context?.knowledge.length ?? 0) > 0);
    // Every learning session reserved its allowance first.
    const starts = committed<{ key: string; allowance: number | null }>(dir, "start", (f) =>
      ["propose", "support"].includes(String(f.event.data.phase)),
    );
    assert.equal(starts.length, 6);
    assert.ok(starts.every((s) => s.record.allowance === 1));
  });
});

describe("T3.6 L3 on the pull-request correction path", () => {
  it("a correction round's failed attempt explores, and its challenge is given the round's records", async () => {
    // The hosted fixture with the learning phases configured.
    const hosted = join(scratch, "hosted");
    mkdirSync(hosted, { recursive: true });
    const w = hostedWorld(hosted, {
      edit: (t) =>
        `${t}\nlearning:\n  reminder_chars: 400\n  context: { entries: 4, guidance: 2, bytes: 16384 }\n  phases: { exploration_rounds: 1, check_timeout_seconds: 30 }\n`,
    });
    let corrected = 0;
    w.reviewer = scriptedAgent(({ packet }) => {
      if (packet.proposal) return { output: { knowledge: [], guidance: [] } };
      if (packet.diagnosis)
        return { output: { ...plainDiagnosis("cite it"), evidence: [GREETING] } };
      if (packet.review?.kind === "selection") {
        return { output: selectionVerdict(packet, { evidence: [GREETING] }) };
      }
      // The round's first corrected candidate leaves the cited specification an open choice.
      if (packet.review?.kind === "candidate" && packet.step.id === S02 && packet.attempt > 1) {
        corrected += 1;
        if (corrected === 1) {
          const verdict = verdictFor(packet);
          const subject = packet.review.subjects[0] ?? "";
          return {
            output: {
              ...verdict,
              verdict: "changes-required",
              coverage: verdict.coverage.map((c) =>
                c.subject === subject
                  ? { ...c, result: "unsatisfied", note: "the citation is ambiguous" }
                  : c,
              ),
              findings: [
                {
                  severity: "blocking",
                  basis: "inspection",
                  rule: subject,
                  location: `${GREETING}:1`,
                  defect: "the comment cites a section the specification does not have",
                  correction: "cite HOSTED §1",
                  choice:
                    "cite the section number or its heading; only reading the specification tells",
                },
              ],
            } satisfies ReviewVerdict,
          };
        }
      }
      return { output: verdictFor(packet) };
    });
    const pull = await toS02(w);
    w.github.comment(pull, OWNER, `[actionable] cite the specification in ${GREETING}`);
    const round = await settle(
      w,
      await dispatch(w, { action: "address-comments", pr: String(pull) }),
    );
    assert.equal(last(round).exit, 0, stringify(last(round).summary));
    inspectSaved(w, (dir) => {
      const [assessment] = committed<{ correction: { step: string; findings: unknown[] } | null }>(
        dir,
        "pr-assessment",
      );
      assert.equal(assessment?.record.correction?.step, S02);
      const [feedback] = committed(dir, "pr-feedback");
      // The round's correction attempt, its reviewed choice and the round of exploration it opened.
      const [exploration, ...more] = explorationsIn(dir);
      assert.equal(more.length, 0);
      assert.ok(exploration);
      assert.equal(exploration.record.step, S02);
      assert.equal(exploration.record.trigger.kind, "choice");
      const correction = committed<{ production: { findings: unknown[] } }>(
        dir,
        "start",
        (f) =>
          f.event.data.phase === "produce" &&
          f.event.data.step === S02 &&
          f.event.attempt === exploration.record.attempt - 1,
      )[0];
      assert.deepEqual(
        correction?.record.production.findings,
        assessment.record.correction?.findings,
      );
      // The explored attempt's challenge is given the round's records, and its acceptance counts it.
      const [challenge] = reviewsIn(dir, "challenge");
      assert.ok(challenge);
      assert.equal(challenge.record.attempt, exploration.record.attempt);
      assert.ok(challenge.record.records?.includes(assessment.ref));
      assert.ok(challenge.record.records?.includes(feedback?.ref ?? "?"));
      const accepted = recordsOf<Decision>(w, "acceptance", dir).filter(
        (d) => d.step === S02 && d.attempt === exploration.record.attempt,
      );
      assert.equal(accepted.length, 1);
      assert.ok(accepted[0]?.decision === "accept" && accepted[0].evidence.includes(challenge.ref));
      // The round completed and was replied to once.
      assert.equal(committed<{ complete?: boolean }>(dir, "pr-round").length, 1);
    });
  });
});
