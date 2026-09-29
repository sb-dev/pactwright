// T3-F acceptance (Task 3 research log §12 T3-F): the complete bootstrap loop
// on the CP97 fixture, run offline. The runner, bindings and definitions are
// the ones the integration and live tests use. Runs are real run directories
// with sealed candidates; the fixture verifiers run as local processes;
// producer and reviewer sessions are scripted. The two injected faults are
// labelled in their own bytes and are never attributed to a model. Real
// containment is in test/integration/checkpoint-harness.test.ts and a real
// provider in test/live/checkpoint-harness.test.ts.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import stringify from "safe-stable-stringify";

import type { Packet } from "../src/claude.js";
import { prepareRun, type ContractStep, type PreparedRun } from "../src/contracts.js";
import { resumeRun, startRun, stateTrace, type RunnerDeps } from "../src/runner.js";
import { targetKey, targetsOf, type Decision } from "../src/verification.js";
import {
  assertAccepted,
  assertPaused,
  bootstrapConfig,
  bootstrapProducer,
  bootstrapRegistry,
  bootstrapReport,
  bootstrapRepo,
  bootstrapReviewer,
  COMMAND_STEP,
  eventsOf,
  INJECTED,
  injectedFirst,
  LIBRARY,
  recordsOf,
  SINGLE_VALIDATION,
  workOf,
  type BootstrapReport,
} from "./bootstrap-fixtures.js";
import {
  Crash,
  crashAfter,
  MODEL,
  testDeps,
  type Repo,
  type ScriptedAgent,
} from "./runner-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-f-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

type World = { repo: Repo; scratch: string };
function world(): World {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  return { repo: bootstrapRepo(dir), scratch: dir };
}

const deps = (
  w: World,
  producer: ScriptedAgent,
  reviewer: ScriptedAgent,
  progress?: RunnerDeps["progress"],
): RunnerDeps =>
  testDeps(w.repo, {
    producer,
    reviewer,
    registry: bootstrapRegistry(),
    harness: "t3-f-test",
    ...(progress ? { progress } : {}),
  });

async function planOf(w: World): Promise<PreparedRun> {
  const prepared = await prepareRun(bootstrapConfig(w.repo, w.scratch), { repoRoot: w.repo.root });
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  return prepared.plan;
}

const stepOf = (plan: PreparedRun, id: string): ContractStep => {
  const step = plan.steps.find((s) => s.id === id);
  assert.ok(step?.kind === "contract");
  return step;
};

/** The step's own automated target keys. */
const ownAutomated = (plan: PreparedRun, id: string): string[] =>
  stepOf(plan, id)
    .targets.filter((t) => t.method === "automated")
    .map(targetKey)
    .sort();

const attemptOf = (report: BootstrapReport, step: string, attempt: number) => {
  const found = report.attempts.find((a) => a.step === step && a.attempt === attempt);
  assert.ok(found, `${step} attempt ${attempt} is in the report`);
  return found;
};

const PORT_ABOVE_HIGHEST = `${LIBRARY}/AC03/port-above-highest/automated/library.rejects`;

describe("T3-F F01 the fixture plan", () => {
  it("prepares deterministically, with every case, the inherited gate and the accepted input", async () => {
    const w = world();
    const plan = await planOf(w);
    assert.equal(stringify(await planOf(w)), stringify(plan));
    assert.deepEqual(
      plan.steps.map((s) => [s.id, s.kind]),
      [
        [LIBRARY, "contract"],
        [COMMAND_STEP, "contract"],
      ],
    );
    const library = stepOf(plan, LIBRARY);
    const command = stepOf(plan, COMMAND_STEP);
    // Every case of every criterion is its own target.
    assert.equal(ownAutomated(plan, LIBRARY).length, 15);
    assert.ok(ownAutomated(plan, LIBRARY).includes(PORT_ABOVE_HIGHEST));
    assert.deepEqual(command.targets.map(targetKey).sort(), [
      `${COMMAND_STEP}/AC01/trimmed-label/automated/cli.prints`,
      `${COMMAND_STEP}/AC01/valid/automated/cli.prints`,
      `${COMMAND_STEP}/AC02/directory/automated/cli.refuses`,
      `${COMMAND_STEP}/AC02/malformed-json/automated/cli.refuses`,
      `${COMMAND_STEP}/AC02/missing-file/automated/cli.refuses`,
      `${COMMAND_STEP}/AC02/port-above-highest/automated/cli.refuses`,
      `${COMMAND_STEP}/AC02/unknown-field/automated/cli.refuses`,
      SINGLE_VALIDATION,
    ]);
    assert.deepEqual(command.inputs, [
      { name: "library", kind: "output", ref: `${LIBRARY}/config-library` },
    ]);
    // The library's step runs its own and the inherited targets; the command's
    // also runs every automated library target again on its candidate.
    const inherited = "CP97/AC01/-/automated/repo.verify";
    assert.deepEqual(targetsOf(plan, library).map(targetKey).sort(), [
      ...ownAutomated(plan, LIBRARY),
      inherited,
    ]);
    assert.deepEqual(
      targetsOf(plan, command).map(targetKey).sort(),
      [...command.targets.map(targetKey), inherited, ...ownAutomated(plan, LIBRARY)].sort(),
    );
  });
});

describe("T3-F F02 the bootstrap loop: two steps, two corrections, reuse and the integrated recheck", () => {
  let w: World;
  let plan: PreparedRun;
  let producer: ScriptedAgent;
  let reviewer: ScriptedAgent;
  let dir: string;
  let report: BootstrapReport;
  before(async () => {
    w = world();
    plan = await planOf(w);
    producer = bootstrapProducer(injectedFirst);
    reviewer = bootstrapReviewer(true);
    const result = await startRun(bootstrapConfig(w.repo, w.scratch), deps(w, producer, reviewer));
    dir = assertAccepted(result, [LIBRARY, COMMAND_STEP]);
    report = bootstrapReport(dir);
  });

  const packets = (step: string): Packet[] => producer.packets.filter((p) => p.step.id === step);

  it("the injected upper-bound fault fails exactly its boundary target and is corrected from that finding", () => {
    const first = attemptOf(report, LIBRARY, 1);
    assert.deepEqual(first.verification.failed, [PORT_ABOVE_HIGHEST]);
    assert.deepEqual(first.verification.other, []);
    assert.deepEqual(first.decision, { decision: "correct", rules: [PORT_ABOVE_HIGHEST] });
    assert.deepEqual(
      packets(LIBRARY).map((p) => [p.attempt, p.findings.map((f) => f.rule)]),
      [
        [1, []],
        [2, [PORT_ABOVE_HIGHEST]],
      ],
    );
    const second = attemptOf(report, LIBRARY, 2);
    assert.deepEqual(second.verification.failed, []);
    assert.equal(second.decision?.decision, "accept");
  });

  it("the test-green duplicate-validation command passes every automated target; review rejects it and the correction follows", () => {
    const first = attemptOf(report, COMMAND_STEP, 1);
    assert.deepEqual(first.verification.failed, []);
    assert.deepEqual(first.verification.other, []);
    assert.ok(
      first.verification.passed.includes(`${COMMAND_STEP}/AC01/valid/automated/cli.prints`),
    );
    assert.deepEqual(
      first.reviews.map((r) => [r.verdict, r.blocking]),
      [["changes-required", [SINGLE_VALIDATION]]],
    );
    const rules = [SINGLE_VALIDATION, `${COMMAND_STEP}/R03`];
    assert.deepEqual(first.decision, { decision: "correct", rules });
    assert.deepEqual(
      packets(COMMAND_STEP).map((p) => [p.attempt, p.findings.map((f) => f.rule)]),
      [
        [1, []],
        [2, rules],
      ],
    );
    assert.equal(attemptOf(report, COMMAND_STEP, 2).decision?.decision, "accept");
  });

  it("the command consumes the accepted library: the input, the base and the protected bytes", () => {
    const [library, command] = report.accepted;
    assert.ok(library && command);
    assert.deepEqual(
      packets(COMMAND_STEP).map((p) => p.inputs.accepted.map((a) => [a.step, a.output])),
      [[[LIBRARY, "config-library"]], [[LIBRARY, "config-library"]]],
    );
    assert.deepEqual(command.inputs, [
      { step: LIBRARY, output: "config-library", evaluation: library.evaluation },
    ]);
    const starts = recordsOf<{
      phase: string;
      step: string;
      production: { base: { commit: string }; policy: { protected: string[] } } | null;
    }>(dir, "start").filter((s) => s.phase === "produce" && s.step === COMMAND_STEP);
    for (const s of starts) {
      assert.equal(s.production?.base.commit, library.candidate);
      for (const path of ["src/config.mjs", "src/config.d.ts"]) {
        assert.ok(s.production?.policy.protected.includes(path), path);
      }
    }
    // The final candidate holds the library's accepted bytes unchanged.
    const entry = (commit: string, path: string): string => {
      const [mode = "", , sha = ""] = execFileSync("git", ["ls-tree", commit, path], {
        env: { ...process.env, GIT_DIR: join(dir, "source.git") },
      })
        .toString("utf8")
        .split(/\s+/);
      return `${mode} ${sha}`;
    };
    const proof = library.outputs.find((o) => o.output === "config-library");
    assert.deepEqual(proof?.paths.map((p) => p.path).sort(), ["src/config.d.ts", "src/config.mjs"]);
    for (const p of proof?.paths ?? []) assert.equal(entry(command.candidate, p.path), p.entry);
  });

  it("every automated library obligation is checked again on the final candidate", () => {
    const command = report.accepted.find((a) => a.step === COMMAND_STEP);
    assert.ok(command);
    const expected = ownAutomated(plan, LIBRARY);
    assert.deepEqual(
      report.recheck
        .filter((r) => r.step === COMMAND_STEP)
        .map((r) => [r.target, r.outcome])
        .sort(),
      expected.map((t) => [t, "passed"]),
    );
    for (const t of expected) assert.ok(command.targets.includes(t), t);
  });

  it("each step runs prepared → producing → verifying → reviewing, corrects, then is accepted", () => {
    const trace = stateTrace(eventsOf(dir)).map((t) =>
      t.step === null ? t.state : `${t.step}:${t.state}${t.attempt ?? ""}`,
    );
    const step = (id: string) => [
      `${id}:producing1`,
      `${id}:verifying1`,
      `${id}:reviewing1`,
      `${id}:producing2`,
      `${id}:verifying2`,
      `${id}:reviewing2`,
      `${id}:accepted2`,
    ];
    assert.deepEqual(trace, ["prepared", ...step(LIBRARY), ...step(COMMAND_STEP)]);
  });

  it("every packet is generated from the contract: no hand-written per-step prompt", () => {
    for (const p of producer.packets) {
      const step = stepOf(plan, p.step.id);
      assert.deepEqual(p.step.requirements, step.requirements);
      assert.deepEqual(p.step.criteria, step.criteria);
      assert.deepEqual(p.step.outputs, step.outputs);
    }
  });

  it("the report discloses both injected faults and attributes neither to a model", () => {
    const injected = report.attempts.filter((a) => a.producer?.source === "injected-fault");
    assert.deepEqual(
      injected.map((a) => [a.step, a.attempt, a.producer?.model, a.producer?.usage]),
      [
        [LIBRARY, 1, null, null],
        [COMMAND_STEP, 1, null, null],
      ],
    );
    for (const a of report.attempts.filter((x) => x.producer?.source === "agent")) {
      assert.equal(a.producer?.model?.configured, MODEL);
      assert.equal(a.attempt, 2);
    }
    // Each injected fault carries its label in the bytes the runner sealed.
    for (const step of [LIBRARY, COMMAND_STEP]) {
      for (const text of Object.values(workOf(step).fault())) {
        if (text.startsWith("//")) assert.ok(text.startsWith(INJECTED));
      }
    }
    assert.deepEqual(report.admissions.map((a) => [a.binding, a.outcome]).sort(), [
      ["cli.prints", "approved"],
      ["cli.refuses", "approved"],
      ["library.accepts", "approved"],
      ["library.rejects", "approved"],
      ["repo.verify", "approved"],
    ]);
  });
});

describe("T3-F F03 successful control", () => {
  it("known-good work is accepted at the first attempt of each step", async () => {
    const w = world();
    const producer = bootstrapProducer((step) => workOf(step).good());
    const reviewer = bootstrapReviewer(false);
    const result = await startRun(bootstrapConfig(w.repo, w.scratch), deps(w, producer, reviewer));
    const dir = assertAccepted(result, [LIBRARY, COMMAND_STEP]);
    const report = bootstrapReport(dir);
    assert.deepEqual(
      report.attempts.map((a) => [a.step, a.attempt, a.producer?.source, a.decision?.decision]),
      [
        [LIBRARY, 1, "agent", "accept"],
        [COMMAND_STEP, 1, "agent", "accept"],
      ],
    );
    assert.equal(report.recheck.length, 15);
    assert.ok(report.recheck.every((r) => r.outcome === "passed"));
  });
});

/** `base` with every `from` replaced by `to`; the anchor must exist. */
function replaced(base: string, from: string, to: string): string {
  assert.ok(base.includes(from), `the anchor ${from} is in the known-good source`);
  return base.replaceAll(from, to);
}

/**
 * A library without the API that answers every case correctly by writing the
 * verifier's report itself: one fact on fd 3, then on stdout bare and after a
 * guessed nonce, from the input in its arguments or on stdin. It then exits.
 */
const FORGER = `import { readFileSync, writeSync } from "node:fs";
let text = process.argv[1] ?? "";
try {
  text = readFileSync(0, "utf8") || text;
} catch {
  // stdin is not readable.
}
let fact = { returned: false, value: null, error: "ConfigError", message: "forged" };
try {
  const v = JSON.parse(text);
  const fields = v !== null && typeof v === "object" && !Array.isArray(v) ? Object.keys(v) : [];
  const shaped = fields.length > 0 && fields.every((k) => k === "port" || k === "label");
  if (shaped && Number.isInteger(v.port) && v.port >= 1 && v.port <= 65535 &&
      typeof v.label === "string" && v.label.trim() !== "") {
    const value = JSON.stringify({ port: v.port, label: v.label.trim() });
    fact = { returned: true, value, error: null, message: null };
  }
} catch {
  // Not JSON: the forged fact stays a rejection.
}
const report = JSON.stringify(fact);
for (const [fd, line] of [[3, report], [1, report], [1, \`\${"0".repeat(64)} \${report}\`]]) {
  try {
    writeSync(fd, \`\${line}\\n\`);
  } catch {
    // The descriptor is not open.
  }
}
process.exit(0);
`;

/**
 * Rewrites any report object that shows a returned out-of-range port into a
 * rejection, through the prototype every plain object inherits.
 */
const TO_JSON_FORGERY = `Object.prototype.toJSON = function () {
  return this.returned === true && /65536/.test(this.value)
    ? { returned: false, value: null, error: "ConfigError", message: "hidden" }
    : this;
};
`;

/** A seeded fault, labelled in its first line like the injected ones. */
const seeded = (label: string, text: string): string =>
  `${INJECTED}: ${label}. Seeded by the test; not produced by a model.\n${text}`;

describe("T3-F F04 boundaries: each seeded fault fails exactly its targets", () => {
  const library = workOf(LIBRARY).good()["src/config.mjs"] ?? "";
  const command = workOf(COMMAND_STEP).good()["src/cli.mjs"] ?? "";
  const lib = (c: string) => `${LIBRARY}/${c}/automated/library.rejects`;
  const cli = (c: string) => `${COMMAND_STEP}/AC02/${c}/automated/cli.refuses`;
  const REFUSED = [
    "directory",
    "malformed-json",
    "missing-file",
    "port-above-highest",
    "unknown-field",
  ];
  const cases: [string, string, Record<string, string>, string[]][] = [
    [
      "accepts port 0",
      LIBRARY,
      { "src/config.mjs": seeded("lower bound", replaced(library, "port < 1 ||", "port < 0 ||")) },
      [lib("AC03/port-zero")],
    ],
    [
      "accepts a numeric string port",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "string port",
          replaced(library, "!Number.isInteger(port)", "!Number.isInteger(Number(port))"),
        ),
      },
      [lib("AC02/port-string")],
    ],
    [
      "does not trim the label",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "untrimmed",
          replaced(library, "return { port, label: trimmed };", "return { port, label };"),
        ),
      },
      [`${LIBRARY}/AC01/trimmed-label/automated/library.accepts`],
    ],
    [
      "accepts an unknown field",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "unknown field",
          replaced(library, "if (unknown.length > 0) throw", "if (unknown.length < 0) throw"),
        ),
      },
      [lib("AC05/unknown-field")],
    ],
    [
      "accepts a blank label",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "blank label",
          replaced(library, 'if (trimmed === "") throw', "if (trimmed === null) throw"),
        ),
      },
      [lib("AC04/blank-label"), lib("AC04/empty-label")],
    ],
    [
      "throws a plain Error",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "untyped error",
          replaced(library, "new ConfigError(", "new Error("),
        ),
      },
      ownRejections(),
    ],
    [
      "hides the upper-bound fault behind an inherited toJSON",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "prototype forgery",
          `${TO_JSON_FORGERY}${workOf(LIBRARY).fault()["src/config.mjs"] ?? ""}`,
        ),
      },
      [lib("AC03/port-above-highest")],
    ],
    [
      "throws errors named ConfigError that are not ConfigError instances",
      LIBRARY,
      {
        "src/config.mjs": seeded(
          "error name spoof",
          replaced(
            replaced(library, "throw new ConfigError(", "throw spoof("),
            "const FIELDS",
            'const spoof = (m) => Object.assign(new Error(m), { name: "ConfigError" });\nconst FIELDS',
          ),
        ),
      },
      ownRejections(),
    ],
    [
      "forges verifier reports without the API",
      LIBRARY,
      // It computes each case's correct fact without exporting the API and
      // writes it where a report could go, then exits: every target must fail.
      { "src/config.mjs": seeded("forged reports", FORGER) },
      [
        ...["AC01/highest-port", "AC01/lowest-port", "AC01/trimmed-label"].map(
          (c) => `${LIBRARY}/${c}/automated/library.accepts`,
        ),
        ...ownRejections(),
      ],
    ],
    [
      "prints a payload for invalid input",
      COMMAND_STEP,
      {
        "src/cli.mjs": seeded(
          "payload on failure",
          replaced(
            command,
            "process.exitCode = 1;",
            'process.stdout.write("{}\\n");\n  process.exitCode = 1;',
          ),
        ),
      },
      REFUSED.map(cli),
    ],
    [
      "exits 0 for invalid input",
      COMMAND_STEP,
      { "src/cli.mjs": seeded("exit 0", replaced(command, "process.exitCode = 1;", "")) },
      REFUSED.map(cli),
    ],
    [
      "writes no diagnostic",
      COMMAND_STEP,
      {
        "src/cli.mjs": seeded(
          "silent",
          replaced(command, "process.stderr.write(`config: ${path}: ${e.message}\\n`);", ""),
        ),
      },
      REFUSED.map(cli),
    ],
    [
      "truncates the input",
      COMMAND_STEP,
      {
        "src/cli.mjs": seeded(
          "input mutation",
          replaced(
            replaced(
              command,
              'import { readFileSync } from "node:fs";',
              'import { readFileSync, writeFileSync } from "node:fs";',
            ),
            "process.exitCode = 1;",
            'try {\n    writeFileSync(path, "");\n  } catch {\n    // A directory cannot be truncated.\n  }\n  process.exitCode = 1;',
          ),
        ),
      },
      ["malformed-json", "missing-file", "port-above-highest", "unknown-field"].map(cli),
    ],
    [
      "prints the file as read",
      COMMAND_STEP,
      {
        "src/cli.mjs": seeded(
          "unnormalised output",
          replaced(
            command,
            'process.stdout.write(`${JSON.stringify(parseConfig(readFileSync(path, "utf8")))}\\n`);',
            'const text = readFileSync(path, "utf8");\n  parseConfig(text);\n  process.stdout.write(text);',
          ),
        ),
      },
      [
        `${COMMAND_STEP}/AC01/trimmed-label/automated/cli.prints`,
        `${COMMAND_STEP}/AC01/valid/automated/cli.prints`,
      ],
    ],
  ];

  function ownRejections(): string[] {
    return [
      "AC02/label-not-string",
      "AC02/malformed-json",
      "AC02/missing-label",
      "AC02/missing-port",
      "AC02/not-an-object",
      "AC02/port-not-integer",
      "AC02/port-string",
      "AC03/port-above-highest",
      "AC03/port-zero",
      "AC04/blank-label",
      "AC04/empty-label",
      "AC05/unknown-field",
    ].map(lib);
  }

  for (const [name, step, files, failing] of cases) {
    it(`${step}: ${name}`, async () => {
      const w = world();
      const producer = bootstrapProducer((s) =>
        s === step ? { ...workOf(s).good(), ...files } : workOf(s).good(),
      );
      const result = await startRun(
        bootstrapConfig(w.repo, w.scratch, { through: step, attempts: 1 }),
        deps(w, producer, bootstrapReviewer(false)),
      );
      const dir = assertPaused(result, { code: "exhausted", step });
      const decision = recordsOf<Decision>(dir, "decision").find((d) => d.step === step);
      assert.ok(decision?.decision === "correct", stringify(decision, null, 2));
      assert.deepEqual(decision.findings.map((f) => f.rule).sort(), [...failing].sort());
    });
  }
});

describe("T3-F F05 restart", () => {
  it("crashes after the library's acceptance and inside the command's verification resume without repeated work", async () => {
    const w = world();
    const producer = bootstrapProducer(injectedFirst);
    const reviewer = bootstrapReviewer(true);
    const config = bootstrapConfig(w.repo, w.scratch);
    await assert.rejects(
      startRun(config, deps(w, producer, reviewer, crashAfter("acceptance"))),
      Crash,
    );
    const [run] = readdirSync(join(w.scratch, "runs"));
    assert.ok(run);
    const dir = join(w.scratch, "runs", run);
    assert.deepEqual(
      recordsOf<Decision>(dir, "acceptance").map((d) => d.step),
      [LIBRARY],
    );
    await assert.rejects(
      resumeRun(dir, deps(w, producer, reviewer, crashAfter("start", "verify"))),
      Crash,
    );
    assertAccepted(await resumeRun(dir, deps(w, producer, reviewer)), [LIBRARY, COMMAND_STEP]);
    // No production or candidate review ran twice: two attempts per step.
    assert.deepEqual(
      producer.packets.map((p) => [p.step.id, p.attempt]),
      [
        [LIBRARY, 1],
        [LIBRARY, 2],
        [COMMAND_STEP, 1],
        [COMMAND_STEP, 2],
      ],
    );
    assert.equal(reviewer.packets.filter((p) => p.review?.kind === "candidate").length, 4);
    const report = bootstrapReport(dir);
    assert.deepEqual(
      report.accepted.map((a) => [a.step, a.attempt]),
      [
        [LIBRARY, 2],
        [COMMAND_STEP, 2],
      ],
    );
    assert.equal(report.recheck.length, 15);
    assert.ok(report.recheck.every((r) => r.outcome === "passed"));
  });
});
