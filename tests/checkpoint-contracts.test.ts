import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkpointDirs,
  githubSlug,
  validateCheckpointDir,
} from "../scripts/checkpoint-contracts.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const CP01 = "docs/checkpoints/01-self-hosted-delivery";

// The crosswalk quotes Checkpoint 1 version 17, which shallow clones may lack.
function hasCommit(rev: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${rev}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const skipSource = !hasCommit("26ea12a");

describe("checkpoint contracts", () => {
  const scratch = mkdtempSync(join(tmpdir(), "pactwright-contracts-"));
  after(() => rmSync(scratch, { recursive: true, force: true }));

  it("validates every converted checkpoint in the repository", (t) => {
    if (skipSource) t.diagnostic("26ea12a unavailable: verbatim crosswalk checks skipped");
    const dirs = checkpointDirs(repoRoot);
    assert.ok(dirs.includes(CP01));
    for (const dir of dirs) {
      assert.deepEqual(validateCheckpointDir(repoRoot, dir, { skipSource }), [], dir);
    }
  });

  it("uses GitHub heading anchors", () => {
    assert.equal(githubSlug("Replay provenance"), "replay-provenance");
    assert.equal(
      githubSlug("Step 3 — Implement the shared typed-edge store"),
      "step-3--implement-the-shared-typed-edge-store",
    );
  });

  const defects: { name: string; file: string; from: string; to: string; expect: RegExp }[] = [
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
      name: "non-verbatim crosswalk quote",
      file: "crosswalk.yml",
      from: '"Create the Pactwright runtime and CLI package foundation."',
      to: '"Build the Pactwright runtime and CLI package foundation."',
      expect: /text for S01.run.1 is not the verbatim source unit/,
    },
  ];

  for (const [i, defect] of defects.entries()) {
    it(`reports a planted ${defect.name}`, (t) => {
      if (defect.name.startsWith("non-verbatim") && skipSource) {
        t.skip("26ea12a unavailable");
        return;
      }
      const root = join(scratch, String(i));
      cpSync(join(repoRoot, "docs"), join(root, "docs"), { recursive: true });
      const path = join(root, CP01, defect.file);
      const text = readFileSync(path, "utf8");
      assert.ok(text.includes(defect.from), `fixture text missing in ${defect.file}`);
      writeFileSync(path, text.replace(defect.from, defect.to));
      const errors = validateCheckpointDir(root, CP01, { skipSource, gitDir: repoRoot });
      assert.ok(
        errors.some((e) => defect.expect.test(e)),
        `expected ${defect.expect} in:\n${errors.join("\n")}`,
      );
    });
  }
});
