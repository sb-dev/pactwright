// T3-A acceptance (Task 3 research log §12): contract loading and execution planning.
// Accepted outputs below are explicit test fixtures, never recorded progress.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import {
  nextEligible,
  prepareRun,
  type AcceptedOutput,
  type Acceptances,
  type ContractStep,
  type PreparedRun,
} from "../src/contracts.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const fixture = join(here, "fixtures/checkpoint-harness");
const cli = join(here, "../src/cli.ts");
const tsx = import.meta.resolve("tsx");
const CHECKPOINT = "docs/checkpoints/99-fixture/checkpoint.yml";
const CP99 = "docs/checkpoints/99-fixture";

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-a-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

type Edit = { file: string; from: string; to: string };

function applyEdits(root: string, edits: Edit[]): void {
  for (const { file, from, to } of edits) {
    const path = join(root, file);
    const text = readFileSync(path, "utf8");
    assert.ok(text.includes(from), `fixture text missing in ${file}: ${from}`);
    writeFileSync(path, text.replace(from, to));
  }
}

/** Commits `edits` and `added` files on top of a fixture repository's current revision. */
function commit(root: string, edits: Edit[], added: Record<string, string> = {}): void {
  applyEdits(root, edits);
  for (const [file, text] of Object.entries(added)) writeFileSync(join(root, file), text);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "change"]);
}

/** A Git repository holding the CP99 fixture, committed after applying `edits`. */
function fixtureRepo(name: string, edits: Edit[] = [], remove: string[] = []): string {
  const root = join(scratch, name);
  cpSync(fixture, root, { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  applyEdits(root, edits);
  for (const file of remove) rmSync(join(root, file));
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return root;
}

const head = (root: string): string => git(root, ["rev-parse", "HEAD"]);

const config = (rev: string, through = "CP99-S04"): Record<string, unknown> => ({
  repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: rev },
  checkpoint: CHECKPOINT,
  definitions: { revision: rev, review: "fixture review" },
  selection: { through },
});

async function planOf(root: string, cfg: unknown): Promise<PreparedRun> {
  const result = await prepareRun(cfg, { repoRoot: root });
  assert.ok(result.ok, result.ok ? "" : result.diagnostics.join("\n"));
  return result.plan;
}

/** Planning's own temporary directories under `temp` (tsx keeps its cache there too). */
const planDirs = (temp: string): string[] =>
  readdirSync(temp).filter((d) => d.startsWith("pactwright-plan-"));

let configs = 0;
/**
 * Runs `plan --config` in `root`; a string config is written verbatim. The CLI
 * gets its own temporary directory (TMPDIR), so a check of what planning left
 * there cannot see files of concurrent test runs.
 */
function runPlan(
  root: string,
  cfg: unknown,
): { status: number | null; stdout: string; stderr: string; temp: string } {
  const file = join(scratch, `config-${configs++}.yml`);
  writeFileSync(file, typeof cfg === "string" ? cfg : yaml.dump(cfg));
  const temp = mkdtempSync(join(scratch, "tmp-"));
  const run = spawnSync(process.execPath, ["--import", tsx, cli, "plan", "--config", file], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, TMPDIR: temp },
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr, temp };
}

const contract = (plan: PreparedRun, id: string): ContractStep => {
  const step = plan.steps.find((s) => s.id === id);
  assert.ok(step?.kind === "contract", `${id} is a planned contract step`);
  return step;
};

/** Accepted instances of every output of `steps`, bound to their current definitions. */
const acceptedOutputs = (plan: PreparedRun, steps: string[]): AcceptedOutput[] =>
  steps.flatMap((id) =>
    contract(plan, id).outputs.map((o) => ({
      step: id,
      output: o.id,
      definition: plan.stepDefinitions[id] ?? "",
      definitions: plan.definitionsDigest,
      evidence: ["fixture"] as const,
    })),
  );

const none: Acceptances = { outputs: [], capabilities: [] };

describe("T3-A contract loading and execution planning", () => {
  const root = fixtureRepo("valid");
  const rev = head(root);

  it("A01 expands each case and binding into its own target", async () => {
    const plan = await planOf(root, config(rev));
    const s01 = contract(plan, "CP99-S01");
    assert.deepEqual(
      s01.targets.filter((t) => t.criterion === "AC01"),
      [
        {
          owner: "CP99-S01",
          criterion: "AC01",
          caseId: "valid",
          method: "automated",
          binding: "parser.accepts",
        },
        {
          owner: "CP99-S01",
          criterion: "AC01",
          caseId: "invalid",
          method: "automated",
          binding: "parser.accepts",
        },
        {
          owner: "CP99-S01",
          criterion: "AC01",
          caseId: "valid",
          method: "automated",
          binding: "parser.rejects",
        },
        {
          owner: "CP99-S01",
          criterion: "AC01",
          caseId: "invalid",
          method: "automated",
          binding: "parser.rejects",
        },
      ],
    );
    assert.deepEqual(
      s01.targets.filter((t) => t.criterion === "AC02"),
      [
        {
          owner: "CP99-S01",
          criterion: "AC02",
          caseId: null,
          method: "review",
          binding: "parser.single-path",
        },
      ],
    );
    assert.deepEqual(plan.inherited.targets, [
      {
        owner: "CP99",
        criterion: "AC01",
        caseId: null,
        method: "automated",
        binding: "repo.verify",
      },
    ]);
    assert.deepEqual(contract(plan, "CP99-S03").targets, [
      {
        owner: "CP99-S03",
        criterion: "AC01",
        caseId: null,
        method: "approval",
        binding: "report.owner-approval",
      },
    ]);
    // Requirement and criterion text is preserved exactly.
    assert.equal(
      s01.requirements[0]?.statement,
      "The parser shall accept a valid configuration and reject an invalid one.",
    );
    assert.equal(
      s01.criteria[0]?.then,
      "The parser accepts the valid one, printing its name and exiting 0, and rejects the invalid one, exiting 1 with an error that names the field.",
    );
    assert.deepEqual(plan.unresolvedBindings, [
      "command.prints",
      "parser.accepts",
      "parser.rejects",
      "parser.single-path",
      "repo.verify",
      "report.owner-approval",
    ]);
  });

  it("A02 selects only the first eligible step", async () => {
    const plan = await planOf(root, config(rev));
    assert.deepEqual(
      plan.steps.map((s) => `${s.id}:${s.kind}`),
      ["CP99-S01:contract", "CP99-S02:contract", "CP99-S03:contract", "CP99-S04:prose"],
    );
    assert.deepEqual(contract(plan, "CP99-S02").inputs, [
      { name: "parser", kind: "output", ref: "CP99-S01/config-parser" },
      { name: "rules", kind: "source", ref: "FIX#2" },
    ]);
    const outputs = (steps: string[]): AcceptedOutput[] => acceptedOutputs(plan, steps);
    const reporting = {
      capability: "fixture-reporting",
      step: "CP99-S01",
      definition: plan.stepDefinitions["CP99-S01"] ?? "",
      definitions: plan.definitionsDigest,
      evidence: ["fixture"] as const,
    };

    assert.deepEqual(nextEligible(plan, none), { kind: "dispatch", step: "CP99-S01" });
    assert.deepEqual(nextEligible(plan, { outputs: outputs(["CP99-S01"]), capabilities: [] }), {
      kind: "dispatch",
      step: "CP99-S02",
    });
    // A later acceptance does not let an unaccepted earlier step be skipped.
    assert.deepEqual(
      nextEligible(plan, { outputs: outputs(["CP99-S01", "CP99-S03"]), capabilities: [] }),
      {
        kind: "dispatch",
        step: "CP99-S02",
      },
    );
    // An output bound to an older definition is stale: its producer runs again.
    const stale = outputs(["CP99-S01", "CP99-S02"]).map((o) =>
      o.step === "CP99-S01" ? { ...o, definition: "sha256:older" } : o,
    );
    assert.deepEqual(nextEligible(plan, { outputs: stale, capabilities: [] }), {
      kind: "dispatch",
      step: "CP99-S01",
    });
    // So is one bound to an older governing definition set.
    const staleSet = outputs(["CP99-S01", "CP99-S02"]).map((o) =>
      o.step === "CP99-S01" ? { ...o, definitions: "sha256:older" } : o,
    );
    assert.deepEqual(nextEligible(plan, { outputs: staleSet, capabilities: [] }), {
      kind: "dispatch",
      step: "CP99-S01",
    });
    // A missing or stale capability receipt prevents dispatch of the step that uses it.
    const blocked = {
      kind: "blocked",
      step: "CP99-S03",
      unmet: ["uses fixture-reporting: no current capability receipt"],
    };
    const through02 = outputs(["CP99-S01", "CP99-S02"]);
    assert.deepEqual(nextEligible(plan, { outputs: through02, capabilities: [] }), blocked);
    assert.deepEqual(
      nextEligible(plan, {
        outputs: through02,
        capabilities: [{ ...reporting, definition: "sha256:older" }],
      }),
      blocked,
    );
    assert.deepEqual(nextEligible(plan, { outputs: through02, capabilities: [reporting] }), {
      kind: "dispatch",
      step: "CP99-S03",
    });
    // A reviewed unconverted step pauses the run once every earlier step is accepted.
    const all = outputs(["CP99-S01", "CP99-S02", "CP99-S03"]);
    assert.deepEqual(nextEligible(plan, { outputs: all, capabilities: [reporting] }), {
      kind: "unconverted",
      step: "CP99-S04",
    });
    const through03 = await planOf(root, config(rev, "CP99-S03"));
    assert.deepEqual(nextEligible(through03, { outputs: all, capabilities: [reporting] }), {
      kind: "selection-accepted",
    });
  });

  it("A02 treats receipts as stale when a governing definition changes", async () => {
    const repo = fixtureRepo("definitions");
    const planAt = (): Promise<PreparedRun> => planOf(repo, config(head(repo), "CP99-S02"));
    const accept = (plan: PreparedRun): Acceptances => ({
      outputs: acceptedOutputs(plan, ["CP99-S01", "CP99-S02"]),
      capabilities: [],
    });
    const first = await planAt();
    const accepted = accept(first);
    assert.deepEqual(nextEligible(first, accepted), { kind: "selection-accepted" });

    // Control: a change outside the definitions leaves the receipts current.
    commit(repo, [], { "README.md": "Not a definition.\n" });
    const unrelated = await planAt();
    assert.equal(unrelated.definitionsDigest, first.definitionsDigest);
    assert.deepEqual(nextEligible(unrelated, accepted), { kind: "selection-accepted" });

    // An inherited checkpoint requirement changes; no step file does.
    commit(repo, [
      {
        file: `${CP99}/checkpoint.yml`,
        from: "keep the fixture repository gate passing",
        to: "keep the fixture repository gate and its build passing",
      },
    ]);
    const inherited = await planAt();
    assert.deepEqual(inherited.stepDefinitions, first.stepDefinitions);
    assert.deepEqual(nextEligible(inherited, accepted), { kind: "dispatch", step: "CP99-S01" });

    // A canonical source clause changes; no contract file does.
    const reaccepted = accept(inherited);
    assert.deepEqual(nextEligible(inherited, reaccepted), { kind: "selection-accepted" });
    commit(repo, [
      {
        file: "docs/specs/fixture-spec.md",
        from: "accepts a valid configuration",
        to: "accepts only a valid configuration",
      },
    ]);
    const canonical = await planAt();
    assert.deepEqual(canonical.stepDefinitions, inherited.stepDefinitions);
    assert.deepEqual(nextEligible(canonical, reaccepted), { kind: "dispatch", step: "CP99-S01" });
  });

  it("A02 plans Checkpoint 1 at HEAD and pauses at its first unconverted step", async () => {
    const rev = head(repoRoot);
    const plan = await planOf(repoRoot, {
      ...config(rev, "CP01-S31"),
      checkpoint: "docs/checkpoints/01-self-hosted-delivery/checkpoint.yml",
    });
    assert.equal(plan.steps.length, 31);
    assert.deepEqual(nextEligible(plan, none), { kind: "dispatch", step: "CP01-S01" });
    const converted = plan.steps.filter((s) => s.kind === "contract").map((s) => s.id);
    assert.equal(converted.length, 21);
    assert.deepEqual(
      nextEligible(plan, { outputs: acceptedOutputs(plan, converted), capabilities: [] }),
      { kind: "unconverted", step: "CP01-S22" },
    );
    const s03 = contract(plan, "CP01-S03");
    assert.deepEqual(
      s03.targets.filter((t) => t.criterion === "AC05").map((t) => t.caseId),
      ["self-loop", "two-record-cycle", "longer-cycle"],
    );
  });

  const defects: {
    name: string;
    edits?: Edit[];
    remove?: string[];
    config?: (rev: string) => unknown;
    expect: RegExp;
  }[] = [
    {
      name: "duplicate YAML key",
      edits: [
        {
          file: `${CP99}/CP99-S02.yml`,
          from: "requires: [CP99-S01]\n",
          to: "requires: [CP99-S01]\nrequires: []\n",
        },
      ],
      expect: /CP99-S02\.yml: yaml: duplicated mapping key/,
    },
    {
      name: "schema violation",
      edits: [
        {
          file: `${CP99}/CP99-S01.yml`,
          from: "cases: [valid, invalid]",
          to: "cases: [Valid, invalid]",
        },
      ],
      expect: /CP99-S01\.yml: schema: \/acceptance\/AC01\/cases\/0/,
    },
    {
      name: "unknown selected step",
      config: (rev) => config(rev, "CP99-S09"),
      expect: /selection\.through CP99-S09 is not a step of CP99/,
    },
    {
      name: "input naming an unknown step",
      edits: [
        {
          file: `${CP99}/CP99-S02.yml`,
          from: "CP99-S01/config-parser",
          to: "CP99-S07/config-parser",
        },
      ],
      expect: /CP99-S02\.yml\/inputs\/parser: CP99-S07\/config-parser names unknown step CP99-S07/,
    },
    {
      name: "input naming an unknown output",
      edits: [
        { file: `${CP99}/CP99-S02.yml`, from: "CP99-S01/config-parser", to: "CP99-S01/parser" },
      ],
      expect:
        /CP99-S02\.yml\/inputs\/parser: CP99-S01\/parser names unknown output parser of CP99-S01/,
    },
    {
      name: "input from a step that is not a prerequisite",
      edits: [{ file: `${CP99}/CP99-S02.yml`, from: "requires: [CP99-S01]", to: "requires: []" }],
      expect:
        /inputs\/parser: CP99-S01\/config-parser is not an output of a prerequisite of CP99-S02/,
    },
    {
      name: "input citing a missing source heading",
      edits: [{ file: `${CP99}/CP99-S02.yml`, from: "rules: FIX#2", to: "rules: FIX#9" }],
      expect: /CP99-S02\.yml\/inputs\/rules: FIX#9 does not resolve to a heading/,
    },
    {
      name: "requirement citing a missing source heading",
      edits: [{ file: `${CP99}/CP99-S01.yml`, from: "source: [FIX#1]", to: "source: [FIX#7]" }],
      expect: /CP99-S01\/R01: FIX#7 does not resolve to a heading/,
    },
    {
      name: "source path escaping the repository",
      edits: [
        {
          file: `${CP99}/checkpoint.yml`,
          from: "FIX: ../../specs/fixture-spec.md",
          to: "FIX: ../../../../outside.md",
        },
      ],
      expect: /source FIX escapes the repository: \.\.\/\.\.\/\.\.\/\.\.\/outside\.md/,
    },
    {
      name: "dependency cycle",
      edits: [{ file: `${CP99}/CP99-S01.yml`, from: "requires: []", to: "requires: [CP99-S03]" }],
      expect: /CP99-S01\.yml: requires CP99-S03 is not an earlier step of CP99/,
    },
    {
      name: "prerequisite without a contract or reviewed prose",
      remove: [`${CP99}/CP99-S01.yml`],
      expect: /Step 1 has neither a contract nor a prose_steps entry/,
    },
    {
      name: "wrong-typed checkpoint field",
      edits: [
        {
          file: `${CP99}/checkpoint.yml`,
          from: "FIX: ../../specs/fixture-spec.md",
          to: "FIX: 42",
        },
      ],
      expect: /checkpoint\.yml: schema: \/sources\/FIX must be string/,
    },
    {
      name: "wrong-typed step field",
      edits: [{ file: `${CP99}/CP99-S02.yml`, from: "requires: [CP99-S01]", to: "requires: 5" }],
      expect: /CP99-S02\.yml: schema: \/requires must be array/,
    },
    {
      name: "wrong-typed crosswalk field",
      edits: [{ file: `${CP99}/crosswalk.yml`, from: "entries: []", to: "entries: 5" }],
      expect: /crosswalk\.yml: schema: \/entries must be array/,
    },
    {
      name: "unconverted step changed after review",
      edits: [
        {
          file: "docs/checkpoints/99-fixture.md",
          from: "Release the fixture by hand.",
          to: "Release it.",
        },
      ],
      expect: /prose step CP99-S04 differs from its reviewed text/,
    },
    {
      name: "invalid configuration",
      config: (rev) => ({
        ...config(rev),
        repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: "HEAD" },
      }),
      expect: /schema: \/repository\/expected_head must match pattern/,
    },
    {
      name: "unknown configuration key",
      config: (rev) => ({ ...config(rev), acceptance: { skip: true } }),
      expect: /schema: \/ must NOT have additional properties/,
    },
    {
      name: "duplicate configuration key",
      config: (rev) => `${yaml.dump(config(rev))}checkpoint: ${CHECKPOINT}\n`,
      expect: /duplicated mapping key/,
    },
    {
      name: "definitions revision that is not a commit",
      config: (rev) => ({
        ...config(rev),
        definitions: { revision: "0".repeat(40), review: "fixture review" },
      }),
      expect: /definitions\.revision 0{40} is not a commit/,
    },
    {
      name: "checkpoint absent at the definitions revision",
      config: (rev) => ({
        ...config(rev),
        checkpoint: "docs/checkpoints/98-absent/checkpoint.yml",
      }),
      expect:
        /docs\/checkpoints\/98-absent\/checkpoint\.yml does not exist at the definitions revision/,
    },
  ];

  for (const [i, defect] of defects.entries()) {
    it(`A03 reports ${defect.name} and changes nothing`, () => {
      const repo =
        defect.edits || defect.remove
          ? fixtureRepo(`defect-${i}`, defect.edits, defect.remove)
          : root;
      const before = { head: head(repo), status: git(repo, ["status", "--porcelain"]) };
      const run = runPlan(repo, (defect.config ?? config)(head(repo)));
      assert.equal(run.status, 2, run.stderr);
      assert.equal(run.stdout, "");
      assert.match(run.stderr, defect.expect);
      assert.deepEqual({ head: head(repo), status: git(repo, ["status", "--porcelain"]) }, before);
      assert.deepEqual(planDirs(run.temp), [], "planning leaves no temporary files");
    });
  }

  it("A03 returns schema diagnostics for wrong-typed data instead of throwing", async () => {
    const repo = fixtureRepo("wrong-type-api", [
      { file: `${CP99}/checkpoint.yml`, from: "FIX: ../../specs/fixture-spec.md", to: "FIX: 42" },
    ]);
    const result = await prepareRun(config(head(repo)), { repoRoot: repo });
    assert.equal(result.ok, false);
    assert.ok(
      !result.ok &&
        result.diagnostics.some((d) =>
          /checkpoint\.yml: schema: \/sources\/FIX must be string/.test(d),
        ),
      result.ok ? "" : result.diagnostics.join("\n"),
    );
  });

  it("A03 rejects a plan command without a configuration", () => {
    const run = spawnSync(process.execPath, ["--import", tsx, cli, "plan"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /required option '--config <file>' not specified/);
  });

  it("A04 prints identical plans for identical inputs", async () => {
    const first = runPlan(root, config(rev));
    const second = runPlan(root, config(rev));
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.stdout, second.stdout);
    assert.ok(!first.stdout.includes(first.temp), "no temporary path in the plan");
    assert.deepEqual(planDirs(first.temp), [], "planning leaves no temporary files");
    assert.deepEqual(JSON.parse(first.stdout), await planOf(root, config(rev)));
    assert.deepEqual(await planOf(root, config(rev)), await planOf(root, config(rev)));
  });
});
