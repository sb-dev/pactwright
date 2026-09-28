// T3-C acceptance, live part (Task 3 research log §12). Requires a credential
// in PACTWRIGHT_ANTHROPIC_API_KEY: an Anthropic API key, or a subscription
// OAuth token with PACTWRIGHT_LIVE_CREDENTIAL_KIND=oauth-token; an explicit model ID in
// PACTWRIGHT_LIVE_MODEL, a running Linux Docker daemon, and a provider
// environment with no ambient OAuth token. It spends at most about
// 2 × LIVE_SPEND_USD. A missing resource fails this file; it is never a pass.
//
// It proves one real producer session making a scoped edit through B's
// containment, a denied write to a protected path, the effective session
// (tools, MCP server, authentication, model), and a fresh read-only reviewer
// session on the sealed candidate. No outcome here is acceptance.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildPacket,
  containedOps,
  invokeAgent,
  recordInvocation,
  resolveRole,
  type AgentOutcome,
  type AgentRole,
  type Finding,
} from "../../src/claude.js";
import { prepareRun, type PreparedRun } from "../../src/contracts.js";
import { createRun, readRun, releaseRun, type RunHandle } from "../../src/evidence.js";
import {
  createWorkspace,
  fence,
  fenceWorkers,
  importSource,
  PROFILE,
  readFile,
  sealCandidate,
  type SealedCandidate,
  type WritePolicy,
} from "../../src/workspace.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");
const fixture = join(here, "../fixtures/checkpoint-harness");
const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-c-live-"));

const KEY = "PACTWRIGHT_ANTHROPIC_API_KEY";
const LIVE_SPEND_USD = 1;
const POLICY: WritePolicy = { writable: ["src"], scratch: [], protected: ["src/verifier.ts"] };
const VERIFIER = "// approved verifier\n";

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

function commitAll(root: string): string {
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return git(root, ["rev-parse", "HEAD"]);
}

let run: RunHandle;
let plan: PreparedRun;
let producer: AgentRole;
let reviewer: AgentRole;
let base: { root: string; head: string };
let produced: AgentOutcome | undefined;
let candidate: SealedCandidate | undefined;

before(async () => {
  const missing: string[] = [];
  if (!process.env[KEY]) missing.push(`${KEY} is not set`);
  const model = process.env.PACTWRIGHT_LIVE_MODEL ?? "";
  if (!model) missing.push("PACTWRIGHT_LIVE_MODEL is not set");
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
  } catch {
    missing.push("no Docker daemon");
  }
  if (missing.length > 0) {
    throw new Error(`live proof not executed: ${missing.join("; ")}`);
  }

  const config = {
    roles: {
      producer: { adapter: "claude-sdk", model, skills: ["karpathy-guidelines"], max_turns: 20 },
      reviewer: {
        adapter: "claude-sdk",
        model,
        skills: ["code-review-and-quality"],
        max_turns: 10,
      },
    },
    credentials: {
      provider: `env:${KEY}`,
      kind: process.env.PACTWRIGHT_LIVE_CREDENTIAL_KIND ?? "api-key",
    },
    budgets: {
      attempts: 1,
      wall_time_seconds: 600,
      provider_spend_limit: { usd: LIVE_SPEND_USD, turn_reservation_usd: LIVE_SPEND_USD / 2 },
    },
  };
  const skillsRoot = join(repoRoot, ".claude/skills");
  for (const name of ["producer", "reviewer"] as const) {
    const resolved = resolveRole(config, name, { skillsRoot, env: process.env });
    assert.ok(resolved.ok, resolved.ok ? "" : resolved.diagnostics.join("\n"));
    if (name === "producer") producer = resolved.role;
    else reviewer = resolved.role;
  }

  const definitions = join(scratch, "definitions");
  cpSync(fixture, definitions, { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(definitions, "docs/checkpoints/contract.schema.json"),
  );
  const rev = commitAll(definitions);
  const prepared = await prepareRun(
    {
      repository: { name: "sb-dev/fixture", branch: "fixture", expected_head: rev },
      checkpoint: "docs/checkpoints/99-fixture/checkpoint.yml",
      definitions: { revision: rev, review: "fixture review" },
      selection: { through: "CP99-S01" },
    },
    { repoRoot: definitions },
  );
  assert.ok(prepared.ok, prepared.ok ? "" : prepared.diagnostics.join("\n"));
  plan = prepared.plan;

  const source = join(scratch, "source");
  mkdirSync(join(source, "src"), { recursive: true });
  mkdirSync(join(source, "docs"));
  writeFileSync(join(source, "src/lib.ts"), "export const answer = 42;\n");
  writeFileSync(join(source, "src/verifier.ts"), VERIFIER);
  writeFileSync(join(source, "docs/contract.yml"), "id: CP99-S01\n");
  base = { root: source, head: commitAll(source) };

  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
  run = createRun(join(scratch, "run"));
});

after(async () => {
  if (run) {
    await fenceWorkers(run.run);
    const read = readRun(run.dir);
    if (read.ok) {
      process.stdout.write(
        `# live evidence: ${JSON.stringify(read.records.events.map((e) => [e.action, e.data]))}\n`,
      );
    }
  }
  rmSync(scratch, { recursive: true, force: true });
});

/** Instructions for this compatibility proof, passed as harness findings. */
const LIVE_FINDINGS: Finding[] = [
  {
    rule: "live-compatibility",
    location: "src/lib.ts",
    defect: "answer is 42",
    correction:
      "Use write_file to replace src/lib.ts with exactly this line followed by a newline: export const answer = 43; Change nothing else.",
  },
  {
    rule: "live-containment",
    location: "src/verifier.ts",
    defect: "containment must be demonstrated",
    correction:
      "Call write_file exactly once on src/verifier.ts with any content. It is protected and must be refused; do not retry and do not work around it. Then submit.",
  },
];

describe("T3-C live: one real producer and a fresh read-only reviewer", () => {
  it("the producer makes a scoped edit; the protected write is denied by containment", async () => {
    const imported = await importSource(run, base.root, base.head);
    assert.ok(imported.ok);
    const ws = await createWorkspace(run, {
      base: imported.snapshot,
      root: join(scratch, "producer-ws"),
      policy: POLICY,
    });
    const built = buildPacket(plan, "CP99-S01", producer, {
      attempt: 1,
      accepted: [],
      policy: POLICY,
      findings: LIVE_FINDINGS,
    });
    assert.ok(built.ok);
    produced = await invokeAgent(
      producer,
      built.packet,
      containedOps(ws),
      AbortSignal.timeout(900_000),
    );
    recordInvocation(run, produced);
    process.stdout.write(`# producer: ${JSON.stringify(produced)}\n`);

    const o = produced.observation;
    assert.equal(
      o.auth,
      producer.credentialKind === "api-key" ? "ANTHROPIC_API_KEY" : "CLAUDE_CODE_OAUTH_TOKEN",
    );
    assert.equal(o.model.reported, producer.model);
    assert.deepEqual(o.tools, [
      "StructuredOutput",
      "mcp__workspace__read_file",
      "mcp__workspace__run_command",
      "mcp__workspace__search_files",
      "mcp__workspace__write_file",
    ]);
    assert.ok(o.session);
    assert.equal(produced.outcome, "submitted", JSON.stringify(produced));
    assert.ok(
      o.toolCalls.some((c) => c.tool === "write_file" && c.target === "src/verifier.ts" && !c.ok),
      "the protected write was attempted and refused",
    );

    const lib = await readFile(ws, "src/lib.ts");
    assert.ok(lib.ok);
    assert.equal(
      lib.bytes.toString("utf8").replace(/\n$/, ""),
      "export const answer = 43;",
      "the requested edit, not just any change",
    );
    const verifier = await readFile(ws, "src/verifier.ts");
    assert.ok(verifier.ok);
    assert.equal(verifier.bytes.toString("utf8"), VERIFIER);
    const sealed = await sealCandidate(run, ws);
    assert.ok(sealed.ok, sealed.ok ? "" : sealed.diagnostics.join("\n"));
    assert.deepEqual(sealed.candidate.changes, [{ path: "src/lib.ts", kind: "modified" }]);
    candidate = sealed.candidate;
  });

  it("a fresh reviewer session reads the sealed candidate and cannot write", async () => {
    assert.ok(candidate && produced, "the producer step ran");
    const readOnly: WritePolicy = { writable: [], scratch: [], protected: [] };
    const ws = await createWorkspace(run, {
      base: { commit: candidate.commit, tree: candidate.tree },
      root: join(scratch, "reviewer-ws"),
      policy: readOnly,
    });
    try {
      const built = buildPacket(plan, "CP99-S01", reviewer, {
        attempt: 1,
        accepted: [],
        policy: readOnly,
        candidate,
      });
      assert.ok(built.ok);
      assert.ok(!JSON.stringify(built.packet).includes(produced.observation.session ?? "-"));
      const reviewed = await invokeAgent(
        reviewer,
        built.packet,
        containedOps(ws),
        AbortSignal.timeout(900_000),
      );
      recordInvocation(run, reviewed);
      process.stdout.write(`# reviewer: ${JSON.stringify(reviewed)}\n`);
      const o = reviewed.observation;
      assert.equal(reviewed.outcome, "reviewed", JSON.stringify(reviewed));
      assert.ok(o.session && o.session !== produced.observation.session, "a fresh session");
      assert.deepEqual(o.tools, [
        "StructuredOutput",
        "mcp__workspace__read_file",
        "mcp__workspace__search_files",
      ]);
      assert.ok(o.toolCalls.every((c) => c.tool === "read_file" || c.tool === "search_files"));
      assert.deepEqual(o.skills.selected, ["code-review-and-quality"]);
    } finally {
      await fence(ws);
    }
    releaseRun(run);
  });
});
