// T3-D verification, containment part (Task 3 research log §12). Requires a
// running Linux Docker daemon; the pinned image is pulled by digest if absent.
// The fixture verifiers run for real: each subject in a read-only B workspace
// of the sealed candidate, each judge in a B workspace holding only its
// binding's files, and each review in a read-only workspace of the candidate.
// Reviewers are scripted. A missing Docker environment fails these tests; it
// is never a pass.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import type { Packet } from "../../src/claude.js";
import type { PreparedRun } from "../../src/contracts.js";
import { readEvidence } from "../../src/evidence.js";
import {
  admitVerifier,
  candidateTree,
  containedWorkspaces,
  recordDecision,
  reviewCandidate,
  targetKey,
  verifyCandidate,
  type Admission,
  type Decision,
  type Invocation,
  type OpenWorkspace,
  type ReviewerAccess,
  type Stored,
} from "../../src/verification.js";
import { fenceWorkers, PROFILE, treeEntries } from "../../src/workspace.js";
import {
  approveAll,
  calibration,
  FAULTY_PARSERS,
  fixturePlan,
  fixtureRegistry,
  manifestFor,
  passing,
  PRODUCER,
  reviewerRole,
  scriptedReviewer,
  seal,
  stepTargets,
  world,
} from "../verification-fixtures.js";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-d-int-"));
const runs: string[] = [];
const registry = fixtureRegistry();
let plan: PreparedRun;

before(async () => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
  plan = await fixturePlan(scratch);
});
after(async () => {
  for (const id of runs) await fenceWorkers(id);
  rmSync(scratch, { recursive: true, force: true });
});

const access = (
  open: OpenWorkspace,
  respond: (p: Packet) => unknown = approveAll,
): ReviewerAccess => ({
  role: reviewerRole(),
  open,
  signal: new AbortController().signal,
  provider: scriptedReviewer(respond),
});

const containers = (run: string): string =>
  execFileSync("docker", ["ps", "--all", "--quiet", "--filter", `label=pactwright.run=${run}`], {
    encoding: "utf8",
  }).trim();

/** Admits, verifies, reviews and decides one CP99-S01 candidate with the real fixture verifiers. */
async function attempt(files: Record<string, string>): Promise<{
  run: string;
  dir: string;
  admissions: Stored<Admission>[];
  invocations: Stored<Invocation>[];
  decision: Decision;
}> {
  const w = await world(scratch);
  runs.push(w.run.run);
  const candidate = await seal(w, files);
  const tree = candidateTree(w.run, candidate);
  const manifest = manifestFor(plan, "CP99-S01", candidate, registry, tree);
  const open = containedWorkspaces(w.run, join(scratch, `workspaces-${randomUUID()}`));
  const common = { plan, step: "CP99-S01", registry, candidate, attempt: 1, manifest };
  const bindings = [
    ...new Set(
      stepTargets(plan, "CP99-S01")
        .filter((t) => t.method === "automated")
        .map((t) => t.binding),
    ),
  ].sort();
  const admissions: Stored<Admission>[] = [];
  for (const binding of bindings) {
    admissions.push(
      await admitVerifier(w.run, {
        ...common,
        binding,
        accepted: [],
        open,
        reviewer: access(open),
      }),
    );
  }
  const invocations = await verifyCandidate(w.run, { ...common, admissions, open });
  const claims = [{ output: "config-parser", paths: ["src/parser.mjs"] }];
  await reviewCandidate(w.run, {
    ...common,
    accepted: [],
    claims,
    reviewer: access(open),
  });
  const { decision } = recordDecision(w.run, {
    ...common,
    run: w.run.run,
    policy: PRODUCER,
    claims,
  });
  return { run: w.run.run, dir: w.run.dir, admissions, invocations, decision };
}

const text = (dir: string, ref: string | undefined): string =>
  ref === undefined ? "" : readEvidence(dir, ref).toString("utf8");

describe("T3-D verifiers run contained", () => {
  it("the real fixture verifiers pass a known-good candidate, which accepts", async () => {
    const { run, admissions, invocations, decision } = await attempt(
      calibration("known-good").files,
    );
    assert.deepEqual(
      admissions.map((a) => a.record.outcome),
      ["approved", "approved", "approved"],
    );
    assert.equal(invocations.length, 3);
    for (const { record } of invocations) {
      assert.equal(record.error, null, JSON.stringify(record));
      assert.equal(record.subjects.length, record.results.length, JSON.stringify(record));
      for (const subject of record.subjects) assert.equal(subject.exit, 0, JSON.stringify(record));
      assert.equal(record.judge?.exit, 0, JSON.stringify(record));
      for (const r of record.results) {
        assert.equal(r.outcome, "passed", JSON.stringify(r));
        assert.ok(r.outcome === "passed" && r.assertions >= 1);
      }
    }
    const repo = invocations.find((i) => i.record.binding === "repo.verify")?.record.results[0];
    assert.ok(repo?.outcome === "passed");
    assert.deepEqual([...(repo.observations.files as string[])].sort(), [
      "src/parser.mjs",
      "verifiers/command-judge.mjs",
      "verifiers/parser-judge.mjs",
      "verifiers/parser-subject.mjs",
      "verifiers/repo-judge.mjs",
      "verifiers/repo-subject.mjs",
    ]);
    assert.equal(decision.decision, "accept", JSON.stringify(decision, null, 2));
    assert.equal(containers(run), "", "every subject, judge and reviewer container is removed");
  });

  it("a faulty candidate fails the real judge and is sent back for correction", async () => {
    const lenient = {
      "src/parser.mjs":
        "export function parseConfig(text) {\n  return { name: JSON.parse(text).name.trim() };\n}\n",
    };
    const { invocations, decision } = await attempt(lenient);
    const failed = invocations.flatMap(({ record }) =>
      record.results.filter((r) => r.outcome === "failed").map((r) => targetKey(r.target)),
    );
    assert.deepEqual(failed.sort(), [
      "CP99-S01/AC01/invalid/automated/parser.accepts",
      "CP99-S01/AC01/invalid/automated/parser.rejects",
    ]);
    assert.equal(decision.decision, "correct", JSON.stringify(decision, null, 2));
    assert.ok(decision.decision === "correct");
    assert.deepEqual(decision.findings.map((f) => f.rule).sort(), failed.sort());
  });

  it("faulty candidate code cannot pass by claiming a result or writing a report", async () => {
    const forged = JSON.stringify({
      results: stepTargets(plan, "CP99-S01")
        .filter((t) => t.method === "automated")
        .map(passing),
    });
    // A candidate with no parser. On import it writes a forged report into
    // every directory of its workspace and tmpfs it can enumerate, replaces
    // process.exit and registers an exit hook that print the forged report,
    // prints the expected facts and exits 0. FAULTY_PARSERS add the owner's
    // own-toJSON probe and a target-aware forger.
    const writer = [
      'import { readdirSync, statSync, writeFileSync } from "node:fs";',
      `const forged = ${JSON.stringify(forged)};`,
      "const tried = [];",
      "const forge = (path) => {",
      "  try { writeFileSync(path, forged); tried.push(`${path}: written`); }",
      "  catch (e) { tried.push(`${path}: ${e.code}`); }",
      "};",
      "const walk = (dir, depth) => {",
      "  forge(`${dir}/report.json`);",
      "  if (depth === 0) return;",
      "  let names = [];",
      "  try { names = readdirSync(dir); } catch { return; }",
      "  for (const name of names) {",
      "    const path = `${dir}/${name}`;",
      "    try { if (statSync(path).isDirectory()) walk(path, depth - 1); } catch {}",
      "  }",
      "};",
      'walk("/work", 3);',
      'walk("/tmp", 1);',
      "const exit = process.exit.bind(process);",
      "process.exit = () => { process.stdout.write(`${forged}\\n`); exit(0); };",
      'process.on("exit", () => { process.stdout.write(`${forged}\\n`); process.stderr.write(tried.join("\\n")); });',
      'console.log(\'{"name":"demo"}\');',
      'console.log(\'{"threw":"name must not be blank"}\');',
      "process.exit(0);",
      'export function parseConfig() { throw new Error("not implemented"); }',
      "",
    ].join("\n");
    const cases = {
      writer: { parser: writer, outcomes: ["failed", "failed", "failed", "failed"] },
      ...FAULTY_PARSERS,
    };
    for (const [name, { parser, outcomes }] of Object.entries(cases)) {
      const { dir, invocations, decision } = await attempt({ "src/parser.mjs": parser });
      const runs = invocations.filter((i) => i.record.binding.startsWith("parser."));
      assert.deepEqual(
        runs.flatMap((i) => i.record.results.map((r) => r.outcome)),
        outcomes,
        `${name}: ${JSON.stringify(runs.map((i) => i.record.results))}`,
      );
      for (const { record } of runs) {
        assert.ok(record.judge, `${name}: ${JSON.stringify(record)}`);
        // Each target ran as the only process in its own workspace; the
        // judge's workspace held only the binding's files.
        assert.equal(record.subjects.length, 2);
        assert.deepEqual([...treeEntries(dir, record.judge.snapshot.tree).keys()].sort(), [
          "verifiers/parser-judge.mjs",
          "verifiers/parser-subject.mjs",
        ]);
        assert.notEqual(text(dir, record.judge.stdout), forged);
        if (name !== "writer") continue;
        for (const subject of record.subjects) {
          const attempts = text(dir, subject.stderr).split("\n");
          assert.ok(attempts.includes("/work/report.json: EROFS"), attempts.join("\n"));
          for (const t of attempts.filter((x) => x.endsWith(": written"))) {
            assert.match(t, /^\/tmp\//, `only the run's own tmpfs is writable: ${t}`);
          }
        }
      }
      assert.ok(decision.decision === "correct", `${name}: ${JSON.stringify(decision)}`);
    }
  });
});
