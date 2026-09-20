import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { checkEnvironmentAgreement } from "../src/config/agreement.js";
import { loadProject } from "../src/loader.js";
import { renderClaudeCodeAdapter } from "../src/adapter/claude-code.js";
import { resolveDesiredState } from "../src/pack/resolve.js";
import { repoRoot } from "./helpers.js";

/**
 * Pactwright develops itself: this repository is a Pactwright project, and
 * Checkpoint 1's exit gate is that a clean checkout can synchronise its own
 * environment. The 19 September review reproduced the opposite — the
 * committed Agent Pack hash was stale while `validate` and the whole suite
 * passed, so nothing in the gate exercised the repository's actual
 * self-hosted environment.
 *
 * These assertions close that hole without a subprocess or a build: they run
 * the same agreement and rendering mechanics `doctor` and `sync` run, against
 * the checked-in `.pactwright/` and the workspace pack. Committed drift is a
 * `pnpm test` failure, not something only a released consumer discovers.
 */

const project = loadProject({ root: repoRoot });

test("self-hosted: the committed lock agrees with the installed environment", () => {
  const agreement = checkEnvironmentAgreement(project);
  assert.deepEqual(
    agreement.problems.map((problem) => `${problem.code}: ${problem.message}`),
    [],
  );
  assert.equal(agreement.ok, true);
  assert.match(agreement.environmentLockHash ?? "", /^sha256:[0-9a-f]{64}$/);
});

test("self-hosted: re-resolving reproduces every recorded identity", () => {
  const resolved = resolveDesiredState({ root: repoRoot, config: project.config });
  assert.deepEqual(resolved.problems, []);
  const now = resolved.value?.lock;
  assert.ok(now, "the repository's own desired state resolves");

  // Field by field rather than a deep compare, so a failure names the drifted
  // component instead of printing two lock files.
  assert.equal(now.agentPack.name, project.lock.agentPack.name);
  assert.equal(now.agentPack.version, project.lock.agentPack.version);
  assert.equal(now.agentPack.hash, project.lock.agentPack.hash);
  assert.deepEqual(now.agents, project.lock.agents);
  assert.deepEqual(now.skills, project.lock.skills);
  assert.deepEqual(now.extensions, project.lock.extensions);
});

test("self-hosted: the committed adapter output is what sync renders", () => {
  const resolved = resolveDesiredState({ root: repoRoot, config: project.config });
  assert.ok(resolved.value, "the repository's own desired state resolves");
  const rendered = renderClaudeCodeAdapter(resolved.value.pack);

  assert.ok(rendered.size > 0, "the adapter renders files");
  for (const [relative, content] of rendered) {
    const committed = path.join(repoRoot, relative);
    assert.ok(fs.existsSync(committed), `${relative} is committed`);
    assert.equal(
      fs.readFileSync(committed, "utf8"),
      content,
      `${relative} matches what sync renders; run "pnpm pactwright sync"`,
    );
  }
});

test("self-hosted: the verification gate exercises the repository's own environment", () => {
  const scripts = (
    JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    }
  ).scripts;

  // `verify` is the single gate CI runs. Requiring the self-hosted stage here
  // stops a later edit quietly dropping it, exactly as tests/ci-workflow.test.ts
  // holds the workflow's own rules in place.
  assert.match(scripts["verify"] ?? "", /\bverify:self\b/);
  const self = scripts["verify:self"] ?? "";
  for (const command of ["doctor", "validate", "sync"]) {
    assert.ok(self.includes(command), `verify:self runs ${command}`);
  }
  // Two syncs and a clean tree: convergence, not merely a successful exit.
  assert.ok(self.split("sync").length - 1 >= 2, "verify:self syncs twice");
  assert.match(self, /git diff --exit-code/);
});
