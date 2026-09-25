import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import {
  checkpointDirs,
  githubSlug,
  isShallowRepository,
  validateCheckpointDir,
  type ValidateOptions,
} from "../scripts/checkpoint-contracts.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const CP01 = "docs/checkpoints/01-self-hosted-delivery";

// The crosswalk quotes earlier Checkpoint 1 revisions. A shallow clone may lack
// them, so there only the unavailable sources are skipped; a full clone checks
// every source and fails on a missing revision.
const shallow = isShallowRepository(repoRoot);

function hasCommit(rev: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${rev}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const crosswalk = yaml.load(readFileSync(join(repoRoot, CP01, "crosswalk.yml"), "utf8")) as {
  sources: { source: string; steps: string[] }[];
};
const revisionOf = (step: string): string =>
  crosswalk.sources.find((s) => s.steps.includes(step))?.source.split("@")[1] ?? "";
const stage1 = revisionOf("CP01-S01");
const stage2 = revisionOf("CP01-S06");

describe("checkpoint contracts", () => {
  const scratch = mkdtempSync(join(tmpdir(), "pactwright-contracts-"));
  after(() => rmSync(scratch, { recursive: true, force: true }));

  // Copies docs/ into a scratch root and applies text replacements to one contract file.
  const plant = (name: string, file: string, edits: [string, string][]): string => {
    const root = join(scratch, name);
    cpSync(join(repoRoot, "docs"), join(root, "docs"), { recursive: true });
    const path = join(root, CP01, file);
    let text = readFileSync(path, "utf8");
    for (const [from, to] of edits) {
      assert.ok(text.includes(from), `fixture text missing in ${file}: ${from}`);
      text = text.replace(from, to);
    }
    writeFileSync(path, text);
    return root;
  };

  it("validates every converted checkpoint in the repository", (t) => {
    const dirs = checkpointDirs(repoRoot);
    assert.ok(dirs.includes(CP01));
    for (const dir of dirs) {
      const errors = validateCheckpointDir(repoRoot, dir, {
        skipUnavailableSources: shallow,
        onSkippedSource: (source) => t.diagnostic(`${source} not in this shallow clone: skipped`),
      });
      assert.deepEqual(errors, [], dir);
    }
  });

  it("defines every checkpoint-wide and Stage 1 review binding", () => {
    const undefinedBindings: string[] = [];
    validateCheckpointDir(repoRoot, CP01, {
      skipSource: true,
      onUndefinedBinding: (where, binding) => undefinedBindings.push(`${where} ${binding}`),
    });
    const stage1Steps = /^CP01(\/|-S0[1-5]\/)/;
    assert.deepEqual(
      undefinedBindings.filter((u) => stage1Steps.test(u)),
      [],
    );
  });

  it("uses GitHub heading anchors", () => {
    assert.equal(githubSlug("Replay provenance"), "replay-provenance");
    assert.equal(
      githubSlug("Step 3 — Implement the shared typed-edge store"),
      "step-3--implement-the-shared-typed-edge-store",
    );
  });

  const defects: {
    name: string;
    file: string;
    from: string;
    to: string;
    expect: RegExp;
    needs?: string;
    options?: ValidateOptions;
  }[] = [
    {
      name: "unresolved section reference",
      file: "CP01-S05.yml",
      from: "source: [CORE#56]\n",
      to: "source: [CORE#99]\n",
      expect: /CORE#99 does not resolve/,
    },
    {
      name: "uncovered requirement",
      file: "CP01-S04.yml",
      from: "\nacceptance:\n",
      to:
        "\n  R07:\n    source: [CORE#44]\n" +
        "    statement: Added requirement without acceptance coverage.\nacceptance:\n",
      expect: /R07: not covered/,
    },
    {
      name: "prerequisite on a later step",
      file: "CP01-S03.yml",
      from: "requires: [CP01-S02]",
      to: "requires: [CP01-S04]",
      expect: /requires CP01-S04 is not an earlier step/,
    },
    {
      name: "invalid case name",
      file: "CP01-S02.yml",
      from: "cases: [intent, decision, contract, brief, evidence]",
      to: "cases: [Intent, decision, contract, brief, evidence]",
      expect: /schema: \/acceptance\/AC02\/cases\/0/,
    },
    {
      name: "unknown crosswalk ID",
      file: "crosswalk.yml",
      from: "covered_by: [CP01-S01/R01, CP01-S01/AC01]",
      to: "covered_by: [CP01-S01/R01, CP01-S01/AC99]",
      expect: /covered_by unknown id CP01-S01\/AC99/,
    },
    {
      name: "converted step without a crosswalk source",
      file: "crosswalk.yml",
      from: "steps: [CP01-S06, CP01-S07, CP01-S08, CP01-S09]",
      to: "steps: [CP01-S06, CP01-S07, CP01-S08]",
      expect: /CP01-S09 has no source/,
    },
    {
      name: "unavailable source revision in a full clone",
      file: "crosswalk.yml",
      from: `01-self-hosted-delivery.md@${stage2}`,
      to: "01-self-hosted-delivery.md@0000000",
      expect: /cannot read source docs\/checkpoints\/01-self-hosted-delivery\.md@0000000 from Git/,
      options: { skipUnavailableSources: false },
    },
    {
      name: "non-verbatim crosswalk quote",
      file: "crosswalk.yml",
      from: '"Create the Pactwright runtime and CLI package foundation."',
      to: '"Build the Pactwright runtime and CLI package foundation."',
      expect: /text for S01.run.1 is not the verbatim source unit/,
      needs: stage1,
    },
    {
      name: "unused binding definition",
      file: "CP01-S01.yml",
      from: "review: [loader.single-path]",
      to: "review: [loader.other-path]",
      expect: /binding loader.single-path is defined but never used/,
    },
    {
      name: "binding used with another method",
      file: "CP01-S01.yml",
      from: "review: [loader.single-path]",
      to: "approval: [loader.single-path]",
      expect: /approval binding loader.single-path is defined as review/,
    },
    {
      name: "approval definition without its effect",
      file: "checkpoint.yml",
      from: "bindings:\n",
      to: "bindings:\n  release.fixture-approval:\n    method: approval\n    authority: Owner.\n    evidence: Record.\n",
      expect: /schema: \/bindings\/release.fixture-approval/,
    },
  ];

  for (const [i, defect] of defects.entries()) {
    it(`reports a planted ${defect.name}`, (t) => {
      if (defect.needs && !hasCommit(defect.needs)) {
        t.skip(`${defect.needs} not in this shallow clone`);
        return;
      }
      const root = plant(String(i), defect.file, [[defect.from, defect.to]]);
      const errors = validateCheckpointDir(root, CP01, {
        skipUnavailableSources: shallow,
        gitDir: repoRoot,
        ...defect.options,
      });
      assert.ok(
        errors.some((e) => defect.expect.test(e)),
        `expected ${defect.expect} in:\n${errors.join("\n")}`,
      );
    });
  }

  it("skips only the unavailable source when allowed", (t) => {
    if (!hasCommit(stage1)) {
      t.skip(`${stage1} not in this shallow clone`);
      return;
    }
    // Stage 2's revision becomes unavailable while one quote from each stage is corrupted.
    const root = plant("partial", "crosswalk.yml", [
      [`01-self-hosted-delivery.md@${stage2}`, "01-self-hosted-delivery.md@0000000"],
      [
        '"Create the Pactwright runtime and CLI package foundation."',
        '"Build the Pactwright runtime and CLI package foundation."',
      ],
      [
        '"Implement the initial built-in direct fulfilment shape:"',
        '"Implement some built-in direct fulfilment shape:"',
      ],
    ]);
    const skipped: string[] = [];
    const errors = validateCheckpointDir(root, CP01, {
      skipUnavailableSources: true,
      onSkippedSource: (source) => skipped.push(source),
      gitDir: repoRoot,
    });
    assert.deepEqual(skipped, ["docs/checkpoints/01-self-hosted-delivery.md@0000000"]);
    assert.deepEqual(errors, ["crosswalk: text for S01.run.1 is not the verbatim source unit"]);
  });
});
