// T3.5 H1 — CP01 production verification (Task 3.5 research log §3 H1):
// production bindings delivered with a capability, the verifier lifecycle for
// them, candidate verification from the sealed candidate, and applicability
// of checkpoint-wide targets. Offline: producers, reviewers and verifier runs
// are scripted, dependency preparation records without running. The Docker
// integration test test/integration/checkpoint-harness-h1.test.ts runs the
// real candidate containment path.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import stringify from "safe-stable-stringify";

import type { Packet } from "../src/claude.js";
import { exportRevision, prepareRun, plannedContract, type PreparedRun } from "../src/contracts.js";
import { createRun, type EvaluationManifest } from "../src/evidence.js";
import { startRun, type RunResult } from "../src/runner.js";
import {
  ADEQUACY_RUBRIC,
  APPLICABILITY,
  bindingDigests,
  createRegistry,
  declaredRegistry,
  REVIEW_ADEQUACY_RUBRIC,
  type Binding,
  type Declaration,
} from "../src/software-bootstrap.js";
import {
  admitVerifier,
  candidateTree,
  pendingIssues,
  pendingTargets,
  targetKey,
  verifyCandidate,
  type Admission,
  type Invocation,
  type PreparationRecord,
} from "../src/verification.js";
import { captureSource, importSource, type SealedCandidate } from "../src/workspace.js";
import {
  BINDINGS_DIR,
  CP96,
  EXIT,
  fault,
  judgeVerifier,
  offlinePreparer,
  producerOf,
  productionConfig,
  productionDeps,
  productionRepo,
  records,
  reviewerOf,
  RULES,
  S01,
  S02,
  work,
} from "./production-fixtures.js";
import type { ScriptedAgent } from "./runner-fixtures.js";
import {
  passVerdict,
  reviewerRole,
  scriptedReviewer,
  writeFiles,
} from "./verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-h1-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const GREET = `${S01}/AC01`;
const NAMED = `${GREET}/named/automated/greet.behaves`;
const BLANK = `${GREET}/blank/automated/greet.behaves`;
const GATE = "CP96/AC01/-/automated/repo.build-test";
const CHANGELOG = "CP96/AC02/-/automated/changelog.current";
const EXIT_CHECK = "CP96/AC03/-/automated/checkpoint.exit-check";
const EXIT_REVIEW = "CP96/AC03/-/review/checkpoint.exit-review";

async function plan(through: string = S02): Promise<PreparedRun> {
  const repo = productionRepo(scratch);
  const prepared = await prepareRun(
    {
      repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: repo.head },
      checkpoint: CP96,
      definitions: { revision: repo.head, review: "fixture review" },
      selection: { through },
    },
    { repoRoot: repo.root, applicability: RULES },
  );
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  return prepared.plan;
}

const known = (p: PreparedRun): Map<string, Binding["method"]> =>
  new Map(
    [
      ...p.inherited.targets,
      ...p.steps.flatMap((s) => (s.kind === "contract" ? s.targets : [])),
    ].map((t) => [t.binding, t.method]),
  );

const declarations = (files: Record<string, string>): Declaration[] =>
  Object.entries(files)
    .filter(([path]) => path.startsWith(`${BINDINGS_DIR}/`))
    .map(([path, text]) => ({ path, bytes: Buffer.from(text) }));

/** Runs CP96 offline with a fresh repository and the given agents and verifier. */
async function run(options: {
  through?: string;
  producer?: ScriptedAgent;
  reviewer?: ScriptedAgent;
  verifier?: ReturnType<typeof judgeVerifier>;
  verification?: Record<string, unknown> | null;
  attempts?: number;
}): Promise<{ result: RunResult; dir: string; reviewer: ScriptedAgent }> {
  const repo = productionRepo(scratch);
  const reviewer = options.reviewer ?? reviewerOf();
  const result = await startRun(
    productionConfig(repo, scratch, {
      through: options.through ?? S01,
      ...(options.attempts === undefined ? {} : { attempts: options.attempts }),
      ...(options.verification === undefined ? {} : { verification: options.verification }),
    }),
    productionDeps(repo, {
      producer: options.producer ?? producerOf(),
      reviewer,
      verifier: options.verifier ?? judgeVerifier(),
    }),
  );
  assert.ok("dir" in result, stringify(result));
  return { result, dir: result.dir, reviewer };
}

/** The `mode sha` Git gives a file's text as a blob. */
const blob = (text: string): string =>
  `100644 ${execFileSync("git", ["hash-object", "--stdin"], { input: text, encoding: "utf8" }).trim()}`;

describe("T3.5 H1-01 production bindings are admitted without a controller edit", () => {
  it("registers each binding a candidate declares, pinned like a controller binding", async () => {
    const p = await plan(S01);
    const declared = declaredRegistry(new Map(), declarations(work(S01)), BINDINGS_DIR, known(p));
    assert.deepEqual(declared.rejected, []);
    assert.deepEqual([...declared.registry.keys()].sort(), [
      "greet.behaves",
      "greet.single-path",
      "repo.build-test",
    ]);
    const entry = declared.registry.get("repo.build-test");
    assert.equal(entry?.source, `${BINDINGS_DIR}/repo.build-test.yml`);
    assert.ok(entry?.binding.method === "automated");
    assert.deepEqual(entry.binding.scratch, ["dist"]);
    assert.equal(entry.binding.dependencies, true);
    // The declaration is the definition: its digest is the one a code-owned binding would have.
    const coded = createRegistry([entry.binding]);
    assert.ok(coded.ok);
    assert.equal(entry.digest, coded.registry.get("repo.build-test")?.digest);
  });

  it("refuses each unknown or malformed declaration with its cause, leaving it unregistered", async () => {
    const p = await plan(S01);
    const good = work(S01)[`${BINDINGS_DIR}/greet.behaves.yml`] ?? "";
    const controller = createRegistry([
      { id: "greet.single-path", method: "review", version: "1", rubric: ["controller rubric"] },
    ]);
    assert.ok(controller.ok);
    const cases: { name: string; path: string; text: string; cause: RegExp; registry?: boolean }[] =
      [
        {
          name: "not YAML",
          path: "greet.behaves.yml",
          text: "id: [unclosed",
          cause: /greet\.behaves\.yml: /u,
        },
        {
          name: "a repeated key",
          path: "greet.behaves.yml",
          text: `${good}version: "2"\n`,
          cause: /duplicated mapping key/u,
        },
        {
          name: "an unknown field",
          path: "greet.behaves.yml",
          text: `${good}skip: true\n`,
          cause: /schema: .*additional properties/u,
        },
        {
          name: "a missing field",
          path: "greet.behaves.yml",
          text: good.replace(/^judge:.*\n/mu, ""),
          cause: /schema: .*required property 'judge'/u,
        },
        {
          name: "a number for a string",
          path: "greet.behaves.yml",
          text: good.replace('version: "1"', "version: 1"),
          cause: /schema: \/version must be string/u,
        },
        {
          name: "another ID than its file",
          path: "greet.other.yml",
          text: good,
          cause: /declares greet\.behaves, not the greet\.other/u,
        },
        {
          name: "a nested file",
          path: "nested/greet.behaves.yml",
          text: good,
          cause: /is verifiers\/bindings\/<binding-id>\.yml/u,
        },
        {
          name: "a controller binding",
          path: "greet.single-path.yml",
          text: work(S01)[`${BINDINGS_DIR}/greet.single-path.yml`] ?? "",
          cause: /is a controller binding; a candidate cannot redefine it/u,
          registry: true,
        },
        {
          name: "an approval binding",
          path: "greet.behaves.yml",
          text: 'id: greet.behaves\nmethod: approval\nversion: "1"\nauthority: owner\nsubject: anything\n',
          cause: /approval bindings .* controller-owned/u,
        },
        {
          name: "an unknown binding",
          path: "greet.extra.yml",
          text: good.replace("id: greet.behaves", "id: greet.extra"),
          cause: /unknown binding: no planned target names greet\.extra/u,
        },
        {
          name: "another method than its use",
          path: "greet.behaves.yml",
          text: 'id: greet.behaves\nmethod: review\nversion: "1"\nrubric: [judge it]\n',
          cause: /declared review but used as automated/u,
        },
        {
          name: "verifier files under its scratch path",
          path: "greet.behaves.yml",
          text: `${good}scratch: [verifiers]\n`,
          cause: /are under a scratch path/u,
        },
      ];
    for (const c of cases) {
      const declared = declaredRegistry(
        c.registry === true && controller.ok ? controller.registry : new Map(),
        [{ path: `${BINDINGS_DIR}/${c.path}`, bytes: Buffer.from(c.text) }],
        BINDINGS_DIR,
        known(p),
      );
      assert.equal(declared.rejected.length, 1, `${c.name}: ${stringify(declared)}`);
      const [rejected] = declared.rejected;
      assert.match(rejected?.diagnostics.join("\n") ?? "", c.cause, c.name);
      assert.equal(rejected?.path, `${BINDINGS_DIR}/${c.path}`, c.name);
      const id = rejected?.binding ?? "";
      assert.ok(
        c.registry === true
          ? declared.registry.get(id)?.source === undefined
          : !declared.registry.has(id),
        `${c.name}: the declaration is not registered`,
      );
    }
  });

  it("a run whose controller registers no binding admits the declared ones and accepts the step", async () => {
    const { result, dir } = await run({});
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
    const admissions = records<Admission>(dir, "verifier-admission");
    assert.deepEqual(
      admissions.map((a) => [a.binding, a.outcome, a.rubric]),
      [
        ["greet.behaves", "approved", ADEQUACY_RUBRIC.digest],
        ["greet.single-path", "approved", REVIEW_ADEQUACY_RUBRIC.digest],
        ["repo.build-test", "approved", ADEQUACY_RUBRIC.digest],
      ],
    );
    const accepted = records<Invocation>(dir, "verifier-invocation").filter(
      (i) => i.stage === "acceptance",
    );
    assert.deepEqual(accepted.map((i) => i.binding).sort(), ["greet.behaves", "repo.build-test"]);
    for (const i of accepted) {
      const admission = admissions.find((a) => a.binding === i.binding);
      assert.equal(i.digest, admission?.digest, "the acceptance run is of the admitted digest");
      assert.equal(i.version, "1");
    }
  });

  it("a malformed declaration is a producer correction, never a count", async () => {
    const producer = producerOf((step, attempt) => {
      const files = work(step);
      if (attempt > 1) return files;
      const path = `${BINDINGS_DIR}/greet.behaves.yml`;
      return { ...files, [path]: `${files[path] ?? ""}skip: true\n` };
    });
    const { result, dir } = await run({ producer });
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
    const [first] = records<{ decision: string; findings: { rule: string; location: string }[] }>(
      dir,
      "decision",
    );
    assert.equal(first?.decision, "correct");
    assert.deepEqual(
      first.findings.map((f) => [f.rule, f.location]),
      [["greet.behaves", `${BINDINGS_DIR}/greet.behaves.yml`]],
    );
    const firstRuns = records<Invocation>(dir, "verifier-invocation").filter(
      (i) => i.attempt === 1 && i.binding === "greet.behaves",
    );
    assert.deepEqual(firstRuns, [], "a refused declaration never runs");
  });

  it("a binding nobody may declare pauses the step for its owner before production", async () => {
    const { result } = await run({ verification: { bindings: "tools/bindings" } });
    assert.equal(result.outcome, "paused");
    assert.ok(result.outcome === "paused");
    assert.deepEqual(result.reasons.map((r) => r.subject).sort(), [
      "greet.behaves",
      "greet.single-path",
      "repo.build-test",
    ]);
    assert.ok(result.reasons.every((r) => r.code === "owner" && /not registered/u.test(r.detail)));
  });
});

describe("T3.5 H1-02 a production verifier counts only once admitted", () => {
  const JUDGE = "verifiers/greet-judge.mjs";
  const weak = fault("greet-judge-weak.mjs");
  const isWeak = (packet: Packet): boolean => {
    const evidence = packet.review?.evidence as
      { files?: Record<string, string | null> } | undefined;
    return packet.review?.kind === "adequacy" && evidence?.files?.[JUDGE] === blob(weak);
  };

  it("a weak verifier is rejected by adequacy review; its replacement gets a new identity and a fresh run first", async () => {
    const producer = producerOf((step, attempt) =>
      attempt === 1 ? { ...work(step), [JUDGE]: weak } : work(step),
    );
    const reviewer = reviewerOf((packet) =>
      isWeak(packet)
        ? { subject: NAMED, defect: "the judge passes every run without reading the observation" }
        : null,
    );
    const { result, dir } = await run({ producer, reviewer });
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));

    const admissions = records<Admission>(dir, "verifier-admission").filter(
      (a) => a.binding === "greet.behaves",
    );
    assert.deepEqual(
      admissions.map((a) => [a.attempt, a.outcome]),
      [
        [1, "rejected"],
        [2, "approved"],
      ],
    );
    const [rejected, approved] = admissions;
    assert.ok(rejected && approved);
    assert.notEqual(rejected.digest, approved.digest, "the replacement is a new identity");
    assert.deepEqual(
      rejected.findings.map((f) => f.rule),
      [NAMED],
    );

    const runs = records<Invocation>(dir, "verifier-invocation").filter(
      (i) => i.binding === "greet.behaves",
    );
    // The weak digest ran only provisionally; the replacement ran
    // provisionally before its approval and for acceptance after it.
    assert.deepEqual(
      runs.map((i) => [i.digest === rejected.digest ? "weak" : "replacement", i.stage]),
      [
        ["weak", "provisional"],
        ["replacement", "provisional"],
        ["replacement", "acceptance"],
      ],
    );
    const fresh = runs.at(-1);
    assert.ok(fresh && fresh.seq > approved.seq && (runs[1]?.seq ?? 0) < approved.seq);

    const [decision] = records<{ decision: string; findings: { rule: string }[] }>(dir, "decision");
    assert.equal(decision?.decision, "correct");
    assert.ok(decision.findings.some((f) => f.rule === NAMED));
    const [acceptance] = records<{ decision: string; targets: string[]; evidence: string[] }>(
      dir,
      "acceptance",
    );
    assert.ok(acceptance?.targets.includes(NAMED) && acceptance.targets.includes(BLANK));
  });

  it("a weak declared review rubric is rejected by review-binding adequacy before it governs a review", async () => {
    const RUBRIC = `${BINDINGS_DIR}/greet.single-path.yml`;
    const weakRubric = 'id: greet.single-path\nmethod: review\nversion: "1"\nrubric: [Pass.]\n';
    const producer = producerOf((step, attempt) =>
      attempt === 1 ? { ...work(step), [RUBRIC]: weakRubric } : work(step),
    );
    const target = `${S01}/AC02/-/review/greet.single-path`;
    const reviewer = reviewerOf((packet) => {
      const evidence = packet.review?.evidence as { binding?: { rubric?: string[] } } | undefined;
      return packet.review?.kind === "adequacy" && evidence?.binding?.rubric?.[0] === "Pass."
        ? { subject: target, defect: "the rubric passes without judging the criterion" }
        : null;
    });
    const { result, dir } = await run({ producer, reviewer });
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
    const admissions = records<Admission>(dir, "verifier-admission").filter(
      (a) => a.binding === "greet.single-path",
    );
    assert.deepEqual(
      admissions.map((a) => [a.attempt, a.outcome, a.rubric, a.provisional]),
      [
        [1, "rejected", REVIEW_ADEQUACY_RUBRIC.digest, null],
        [2, "approved", REVIEW_ADEQUACY_RUBRIC.digest, null],
      ],
    );
    // The weak rubric's attempt is corrected; only the admitted rubric's attempt is accepted.
    const [decision] = records<{ attempt: number; decision: string; findings: { rule: string }[] }>(
      dir,
      "decision",
    );
    assert.deepEqual([decision?.attempt, decision?.decision], [1, "correct"]);
    assert.deepEqual(
      decision?.findings.map((f) => f.rule),
      [target],
    );
    const [acceptance] = records<{ attempt: number }>(dir, "acceptance");
    assert.equal(acceptance?.attempt, 2);
    const shown = reviewer.packets
      .filter((p) => p.review?.kind === "candidate" && p.attempt === 2)
      .flatMap((p) => p.review?.bindings ?? []);
    assert.deepEqual(
      shown.map((b) => [b.id, b.rubric]),
      [
        [
          "greet.single-path",
          [
            "One function validates the name; the program path calls it and restates no rule.",
            "A second validation path, or a rule the program checks again, fails the target.",
          ],
        ],
      ],
    );
  });

  it("a changed declaration or verifier file is a new identity", async () => {
    const p = await plan(S01);
    const files = work(S01);
    const tree = new Map([
      ["verifiers/greet-judge.mjs", blob(files["verifiers/greet-judge.mjs"] ?? "")],
      ["verifiers/greet-subject.mjs", blob(files["verifiers/greet-subject.mjs"] ?? "")],
    ]);
    const digest = (decls: Record<string, string>, t: Map<string, string>): string | undefined =>
      bindingDigests(
        declaredRegistry(new Map(), declarations(decls), BINDINGS_DIR, known(p)).registry,
        t,
        ["greet.behaves"],
      )["greet.behaves"];
    const original = digest(files, tree);
    const path = `${BINDINGS_DIR}/greet.behaves.yml`;
    const bumped = { [path]: (files[path] ?? "").replace('version: "1"', 'version: "2"') };
    const longer = { [path]: (files[path] ?? "").replace("30000", "40000") };
    const changedFile = new Map([...tree, ["verifiers/greet-judge.mjs", blob(weak)]]);
    const variants = [digest(bumped, tree), digest(longer, tree), digest(files, changedFile)];
    assert.ok(original);
    assert.equal(new Set([original, ...variants]).size, 4, stringify(variants));
    assert.equal(digest({ ...files, [path]: `# a comment\n${files[path] ?? ""}` }, tree), original);
  });
});

describe("T3.5 H1-03 candidate verification runs from the sealed candidate", () => {
  it("subjects get empty scratch paths and the prepared dependencies, never the host's", async () => {
    const verifier = judgeVerifier();
    const { result, dir } = await run({ verifier });
    assert.equal(result.outcome, "selection-accepted", stringify(result, null, 2));
    const subjects = verifier.calls.filter((c) => c.role === "subject");
    const gate = subjects.filter((c) => c.binding === "repo.build-test");
    assert.ok(gate.length > 0);
    for (const c of gate) assert.deepEqual(c.options, { scratch: ["dist"], mounts: [] });
    for (const c of subjects.filter((c) => c.binding === "greet.behaves")) {
      assert.deepEqual(c.options, { scratch: [], mounts: [] });
    }
    for (const c of verifier.calls.filter((c) => c.role === "judge")) {
      assert.deepEqual(c.options, {}, "a judge never gets candidate scratch or dependencies");
    }
    const preparations = records<PreparationRecord>(dir, "dependency-preparation");
    const invocations = records<Invocation>(dir, "verifier-invocation");
    for (const i of invocations) {
      if (i.binding === "repo.build-test") {
        assert.ok(i.dependencies, "the gate records the dependencies it ran with");
        assert.ok(preparations.some((p) => p.key === i.dependencies?.key));
      } else assert.equal(i.dependencies, null);
    }
  });

  it("build output the candidate holds fails the gate before any subject runs", async () => {
    const p = await plan(S01);
    const repo = productionRepo(scratch);
    const r = createRun(join(scratch, `run-${randomUUID()}`));
    const imported = await importSource(r, repo.root, repo.head);
    assert.ok(imported.ok);
    const dir = join(scratch, `tree-${randomUUID()}`);
    mkdirSync(dir);
    await exportRevision(repo.root, repo.head, dir);
    // A broken source with a prebuilt output that a gate reading it would pass.
    writeFiles(dir, {
      ...work(S01),
      "src/greet.mjs": fault("greet-wrong.mjs"),
      "dist/greet.mjs": work(S01)["src/greet.mjs"] ?? "",
    });
    const captured = captureSource(
      r.dir,
      dir,
      imported.snapshot,
      { writable: ["dist", "src", "test", "verifiers"], scratch: [], protected: [] },
      "candidate",
    );
    assert.ok(captured.ok, captured.ok ? "" : captured.diagnostics.join("\n"));
    const candidate: SealedCandidate = captured.candidate;
    const declared = declaredRegistry(new Map(), declarations(work(S01)), BINDINGS_DIR, known(p));
    const tree = candidateTree(r, candidate);
    const step = plannedContract(p, S01);
    assert.ok(step);
    const pending = pendingTargets(p, step, new Set());
    const manifest: EvaluationManifest = {
      source: { commit: candidate.commit, tree: candidate.tree },
      definitions: p.definitionsDigest,
      step: { id: S01, definition: p.stepDefinitions[S01] ?? "" },
      inputs: [],
      harness: "t3.5-h1-test",
      runModel: p.runModel,
      verifiers: bindingDigests(declared.registry, tree, [
        "greet.behaves",
        "greet.single-path",
        "repo.build-test",
      ]),
      rubric: null,
      skills: {},
      configuration: "sha256:h1",
      toolchain: { profile: "offline", lockfile: null },
      pending,
    };
    const verifier = judgeVerifier();
    const reviewer = {
      role: reviewerRole(),
      open: verifier,
      signal: new AbortController().signal,
      provider: scriptedReviewer((packet) => passVerdict(packet.review?.subjects ?? [])),
    };
    const common = {
      plan: p,
      step: S01,
      registry: declared.registry,
      candidate,
      attempt: 1,
      manifest,
    };
    const prepare = offlinePreparer(r, {
      inputs: ["package.json"],
      command: ["true"],
      outputs: ["node_modules"],
      network: "none",
      timeoutMs: 1,
    });
    const admission = await admitVerifier(r, {
      ...common,
      binding: "repo.build-test",
      accepted: [],
      open: verifier,
      reviewer,
      prepare,
    });
    assert.equal(admission.record.outcome, "approved");
    const [invocation] = await verifyCandidate(r, {
      ...common,
      admissions: [admission],
      open: verifier,
      prepare,
      bindings: ["repo.build-test"],
    });
    assert.ok(invocation);
    assert.deepEqual(invocation.record.subjects, [], "no subject ran");
    assert.deepEqual(prepare.prepared, [], "nothing was prepared for a candidate that cannot pass");
    const [gate] = invocation.record.results;
    assert.ok(gate?.outcome === "failed", stringify(gate));
    assert.equal(targetKey(gate.target), GATE);
    assert.match(
      gate.reason,
      /holds dist\/greet\.mjs under the scratch paths dist; build output is produced from the candidate's source/u,
    );
  });
});

describe("T3.5 H1-04 checkpoint-wide targets apply at the point their rules name", () => {
  it("plans each inherited criterion's rule and refuses a rule the checkpoint cannot satisfy", async () => {
    const p = await plan(S01);
    assert.deepEqual(p.inherited.applicability, {
      AC01: { kind: "step" },
      AC02: { kind: "after", step: S01 },
      AC03: { kind: "exit" },
    });
    const repo = productionRepo(scratch);
    const config = {
      repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: repo.head },
      checkpoint: CP96,
      definitions: { revision: repo.head, review: "fixture review" },
      selection: { through: S01 },
    };
    const refused = await prepareRun(config, {
      repoRoot: repo.root,
      applicability: {
        CP96: { AC09: { kind: "exit" }, AC02: { kind: "after", step: "CP96-S07" } },
      },
    });
    assert.ok(!refused.ok);
    assert.deepEqual(refused.diagnostics.sort(), [
      "applicability CP96/AC02: CP96-S07 is not a step of CP96",
      "applicability CP96/AC09: not a criterion of docs/checkpoints/96-production/checkpoint.yml",
    ]);
  });

  it("Checkpoint 1's rules defer AC02 to Step 25's acceptance and AC05 to the exit", async () => {
    const root = join(fileURLToPath(new URL(".", import.meta.url)), "../../..");
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const prepared = await prepareRun(
      {
        repository: { name: "sb-dev/pactwright", branch: "candidate", expected_head: head },
        checkpoint: "docs/checkpoints/01-self-hosted-delivery/checkpoint.yml",
        definitions: { revision: head, review: "T2 review" },
        selection: { through: "CP01-S01" },
      },
      { repoRoot: root, applicability: APPLICABILITY },
    );
    assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
    const cp01 = prepared.plan;
    assert.deepEqual(cp01.inherited.applicability, {
      AC01: { kind: "step" },
      AC02: { kind: "after", step: "CP01-S25" },
      AC03: { kind: "step" },
      AC04: { kind: "step" },
      AC05: { kind: "exit" },
    });
    const s01 = plannedContract(cp01, "CP01-S01");
    assert.ok(s01);
    assert.deepEqual(pendingTargets(cp01, s01, new Set()), [
      { target: "CP01/AC02/-/automated/repo.self-hosted-lineage", rule: "after CP01-S25" },
      { target: "CP01/AC02/-/review/repo.self-hosting-review", rule: "after CP01-S25" },
      { target: "CP01/AC05/-/automated/checkpoint.acceptance-complete", rule: "exit" },
      { target: "CP01/AC05/-/review/checkpoint.exit-gate", rule: "exit" },
    ]);
    // From Step 25's acceptance, AC02 applies to every evaluation, a re-run of S01 included.
    assert.deepEqual(
      pendingTargets(cp01, s01, new Set(["CP01-S25"])).map((x) => x.rule),
      ["exit", "exit"],
    );
  });

  it("an early step passes its applicable targets while the later-only ones stay pending", async () => {
    const verifier = judgeVerifier();
    const { result, dir, reviewer } = await run({ verifier });
    assert.ok(result.outcome === "selection-accepted", stringify(result, null, 2));
    assert.deepEqual(result.accepted, [S01]);
    // Selection acceptance is not checkpoint completion.
    assert.deepEqual(result.checkpoint, {
      checkpoint: "CP96",
      complete: false,
      unaccepted: [S02],
      pending: [
        { target: CHANGELOG, rule: `after ${S01}` },
        { target: EXIT_CHECK, rule: "exit" },
        { target: EXIT_REVIEW, rule: "exit" },
      ],
    });
    const [evaluation] = records<{ manifest: EvaluationManifest }>(dir, "evaluation");
    assert.deepEqual(
      evaluation?.manifest.pending.map((x) => x.target),
      [CHANGELOG, EXIT_CHECK, EXIT_REVIEW],
    );
    const [acceptance] = records<{ targets: string[] }>(dir, "acceptance");
    assert.deepEqual(
      acceptance?.targets,
      [GATE, BLANK, NAMED, `${S01}/AC02/-/review/greet.single-path`].sort(),
    );
    // No pending target ran, and the common review judged only what applies.
    assert.ok(
      !verifier.calls.some(
        (c) => c.binding === "changelog.current" || c.binding.startsWith("checkpoint."),
      ),
    );
    const review = reviewer.packets.find((p) => p.review?.kind === "candidate");
    assert.deepEqual(review?.review?.subjects, [`${S01}/R01`, "CP96/R01", `${S01}/greeting`]);
  });

  it("the after rule applies from the step's acceptance and the exit evaluation completes the checkpoint", async () => {
    const verifier = judgeVerifier();
    const { result, dir, reviewer } = await run({ through: S02, verifier });
    assert.ok(result.outcome === "selection-accepted", stringify(result, null, 2));
    assert.deepEqual(result.checkpoint, {
      checkpoint: "CP96",
      complete: true,
      unaccepted: [],
      pending: [],
    });
    const evaluations = records<{
      step: string;
      candidate: { commit: string };
      manifest: EvaluationManifest;
    }>(dir, "evaluation");
    assert.deepEqual(
      evaluations.map((e) => [e.step, e.manifest.pending.map((x) => x.target)]),
      [
        [S01, [CHANGELOG, EXIT_CHECK, EXIT_REVIEW]],
        [S02, [EXIT_CHECK, EXIT_REVIEW]],
        [EXIT, []],
      ],
    );
    assert.equal(
      evaluations.at(-1)?.candidate.commit,
      evaluations.find((e) => e.step === S02)?.candidate.commit,
      "the exit evaluates the integrated candidate",
    );
    const acceptances = records<{ step: string; targets: string[] }>(dir, "acceptance");
    assert.deepEqual(
      acceptances.map((a) => a.step),
      [S01, S02, EXIT],
    );
    assert.deepEqual(
      acceptances.at(-1)?.targets,
      [GATE, CHANGELOG, EXIT_CHECK, EXIT_REVIEW].sort(),
    );
    assert.ok(acceptances[1]?.targets.includes(CHANGELOG), "S02 satisfied the after rule");
    const exitReview = reviewer.packets.find(
      (p) => p.review?.kind === "candidate" && p.step.id === EXIT,
    );
    assert.deepEqual(exitReview?.review?.subjects, ["CP96/R01", "CP96/R02", "CP96/R03"]);
    assert.deepEqual(exitReview.review?.targets.map(targetKey), [EXIT_REVIEW]);
  });

  it("missing terminal evidence prevents checkpoint completion", async () => {
    const producer = producerOf((step) => {
      const files = work(step);
      return Object.fromEntries(
        Object.entries(files).filter(([path]) => !path.includes("checkpoint.exit")),
      );
    });
    const { result } = await run({ through: S02, producer });
    assert.ok(result.outcome === "paused", stringify(result, null, 2));
    assert.deepEqual(result.accepted, [S01, S02]);
    assert.equal(result.step, EXIT);
    assert.deepEqual(
      result.reasons.map((r) => [r.code, r.subject]),
      [
        ["owner", "checkpoint.exit-check"],
        ["owner", "checkpoint.exit-review"],
      ],
    );
    assert.equal(result.checkpoint?.complete, false);
    assert.deepEqual(
      result.checkpoint.pending.map((x) => x.target),
      [EXIT_CHECK, EXIT_REVIEW],
    );
  });

  it("a failing exit check leaves the checkpoint incomplete and is never corrected by a producer", async () => {
    const verifier = judgeVerifier((binding) =>
      binding === "checkpoint.exit-check" ? "the changelog does not name CP96-S02" : null,
    );
    const producer = producerOf();
    const { result, dir } = await run({ through: S02, producer, verifier });
    assert.ok(result.outcome === "paused", stringify(result, null, 2));
    assert.equal(result.step, EXIT);
    assert.deepEqual(
      result.reasons.map((r) => [r.code, r.subject]),
      [["correct", EXIT_CHECK]],
    );
    assert.equal(result.checkpoint?.complete, false);
    assert.deepEqual(
      producer.packets.map((p) => p.step.id),
      [S01, S02],
      "no producer ran for the exit",
    );
    const decisions = records<{ step: string; decision: string }>(dir, "decision");
    assert.deepEqual(
      decisions.map((d) => [d.step, d.decision]),
      [[EXIT, "correct"]],
    );
  });

  it("an evaluation cannot defer a target its rule does not defer", async () => {
    const p = await plan(S02);
    const s01 = plannedContract(p, S01);
    const exit = plannedContract(p, EXIT);
    assert.ok(s01 && exit);
    assert.deepEqual(pendingTargets(p, s01, new Set([S01])), [
      { target: EXIT_CHECK, rule: "exit" },
      { target: EXIT_REVIEW, rule: "exit" },
    ]);
    assert.deepEqual(pendingTargets(p, exit, new Set()), []);
    assert.deepEqual(pendingIssues(p, s01, [{ target: GATE, rule: "step" }]), [
      `${GATE} is deferred as step, but its rule is step`,
    ]);
    assert.deepEqual(pendingIssues(p, s01, [{ target: CHANGELOG, rule: "exit" }]), [
      `${CHANGELOG} is deferred as exit, but its rule is after ${S01}`,
    ]);
    assert.deepEqual(pendingIssues(p, s01, [{ target: NAMED, rule: "exit" }]), [
      `${NAMED} is deferred but is no inherited target`,
    ]);
    assert.deepEqual(pendingIssues(p, exit, [{ target: EXIT_CHECK, rule: "exit" }]), [
      "the exit evaluation defers no target",
    ]);
  });
});
