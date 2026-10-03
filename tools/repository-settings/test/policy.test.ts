// Policy checks against an in-memory GitHub: every governed resource is
// brought to the policy, a second audit then changes nothing, stricter or
// unrelated existing settings are kept, nothing is deleted, and secrets are
// only looked for. The real `gh` boundary is exercised through its argument
// and response parsing only; no network call is made.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ghClient, type ApiResult, type Gh, type Method } from "../src/github.js";
import {
  audit,
  canonical,
  covers,
  DEFAULT_POLICY,
  type Finding,
  type Policy,
} from "../src/policy.js";

const here = dirname(fileURLToPath(import.meta.url));

const POLICY: Policy = { owner: "sb-dev", repo: "pactwright", ...DEFAULT_POLICY };

type Json = Record<string, unknown>;

/** An in-memory repository with the endpoints the policy reads and writes. */
function fakeGitHub(seed: Partial<State> = {}): Gh & { state: State; writes: string[] } {
  const state: State = {
    repository: {
      pull_request_creation_policy: "everyone",
      delete_branch_on_merge: false,
      security_and_analysis: {
        secret_scanning: { status: "disabled" },
        secret_scanning_push_protection: { status: "disabled" },
      },
    },
    vulnerabilityAlerts: false,
    securityFixes: { enabled: false, paused: false },
    privateReporting: { enabled: false },
    rulesets: [],
    nextRulesetId: 100,
    environments: {},
    branchPolicies: {},
    actions: { enabled: true, allowed_actions: "all", sha_pinning_required: false },
    selectedActions: null,
    workflow: { default_workflow_permissions: "write", can_approve_pull_request_reviews: true },
    forkApproval: { approval_policy: "first_time_contributors" },
    repositorySecrets: [],
    environmentSecrets: {},
    collaborators: [{ login: "sb-dev", role_name: "admin" }],
    codeowners: true,
    installations: [{ app_slug: "claude", permissions: { contents: "write", workflows: "write" } }],
    ...seed,
  };
  const writes: string[] = [];
  const ok = (body: unknown, status = 200): ApiResult => ({ ok: true, status, body });
  const notFound = (): ApiResult => ({ ok: false, status: 404, message: "Not Found" });
  const base = `repos/${POLICY.owner}/${POLICY.repo}`;
  const api = (method: Method, path: string, body?: unknown): ApiResult => {
    if (method !== "GET") writes.push(`${method} ${path}`);
    const rel = path.startsWith(`${base}/`) ? path.slice(base.length) : path === base ? "" : null;
    if (path === `users/${POLICY.owner}`) return ok({ id: 22468184, login: POLICY.owner });
    if (path === "apps/github-actions") return ok({ id: 15368 });
    if (path === "user/installations") return ok({ installations: state.installations });
    if (rel === null) return notFound();
    if (rel === "") {
      if (method === "PATCH") Object.assign(state.repository, body as Json);
      return ok(state.repository);
    }
    if (rel === "/vulnerability-alerts") {
      if (method === "PUT") state.vulnerabilityAlerts = true;
      return state.vulnerabilityAlerts ? ok(null, 204) : notFound();
    }
    if (rel === "/automated-security-fixes") {
      if (method === "PUT") state.securityFixes = { enabled: true, paused: false };
      return ok(state.securityFixes);
    }
    if (rel === "/private-vulnerability-reporting") {
      if (method === "PUT") state.privateReporting = { enabled: true };
      return ok(state.privateReporting);
    }
    if (rel === "/rulesets") {
      if (method === "POST") {
        const created = { ...(body as Json), id: state.nextRulesetId++ };
        state.rulesets.push(created);
        return ok(created, 201);
      }
      return ok(state.rulesets.map((r) => ({ id: r.id, name: r.name })));
    }
    const ruleset = /^\/rulesets\/(\d+)$/.exec(rel);
    if (ruleset) {
      const index = state.rulesets.findIndex((r) => r.id === Number(ruleset[1]));
      if (index === -1) return notFound();
      if (method === "PUT") state.rulesets[index] = { ...(body as Json), id: Number(ruleset[1]) };
      return ok(state.rulesets[index]);
    }
    const policies = /^\/environments\/([^/]+)\/deployment-branch-policies$/.exec(rel);
    if (policies) {
      const name = policies[1] ?? "";
      if (!(name in state.environments)) return notFound();
      const list = (state.branchPolicies[name] ??= []);
      if (method === "POST") {
        list.push(body as Json);
        return ok(body, 201);
      }
      return ok({ branch_policies: list });
    }
    const secret = /^\/environments\/([^/]+)\/secrets\/([^/]+)$/.exec(rel);
    if (secret) {
      return state.environmentSecrets[secret[1] ?? ""]?.includes(secret[2] ?? "")
        ? ok({ name: secret[2] })
        : notFound();
    }
    const environment = /^\/environments\/([^/]+)$/.exec(rel);
    if (environment) {
      const name = environment[1] ?? "";
      if (method === "PUT") {
        const b = body as Json;
        const reviewers = (b.reviewers as { type: string; id: number }[]).map((r) => ({
          type: r.type,
          reviewer: { id: r.id },
        }));
        state.environments[name] = {
          name,
          protection_rules: [
            { type: "required_reviewers", prevent_self_review: b.prevent_self_review, reviewers },
            { type: "wait_timer", wait_timer: b.wait_timer },
          ],
          deployment_branch_policy: b.deployment_branch_policy,
          can_admins_bypass: b.can_admins_bypass,
        };
      }
      return name in state.environments ? ok(state.environments[name]) : notFound();
    }
    if (rel === "/actions/permissions") {
      if (method === "PUT") Object.assign(state.actions, body as Json);
      return ok(state.actions);
    }
    if (rel === "/actions/permissions/selected-actions") {
      if (method === "PUT") state.selectedActions = body as Json;
      if (state.actions.allowed_actions !== "selected") {
        return { ok: false, status: 409, message: "allowed_actions is not selected" };
      }
      return ok(
        state.selectedActions ?? {
          github_owned_allowed: false,
          verified_allowed: false,
          patterns_allowed: [],
        },
      );
    }
    if (rel === "/actions/permissions/workflow") {
      if (method === "PUT") state.workflow = body as Json;
      return ok(state.workflow);
    }
    if (rel === "/actions/permissions/fork-pr-contributor-approval") {
      if (method === "PUT") state.forkApproval = body as Json;
      return ok(state.forkApproval);
    }
    const repoSecret = /^\/actions\/secrets\/([^/]+)$/.exec(rel);
    if (repoSecret)
      return state.repositorySecrets.includes(repoSecret[1] ?? "")
        ? ok({ name: repoSecret[1] })
        : notFound();
    if (rel === "/collaborators?affiliation=direct") return ok(state.collaborators);
    if (rel === "/contents/.github/CODEOWNERS")
      return state.codeowners ? ok({ path: ".github/CODEOWNERS" }) : notFound();
    return notFound();
  };
  return { state, writes, api: (method, path, body) => Promise.resolve(api(method, path, body)) };
}

type State = {
  repository: Json;
  vulnerabilityAlerts: boolean;
  securityFixes: Json;
  privateReporting: Json;
  rulesets: Json[];
  nextRulesetId: number;
  environments: Record<string, Json>;
  branchPolicies: Record<string, Json[]>;
  actions: Json;
  selectedActions: Json | null;
  workflow: Json;
  forkApproval: Json;
  repositorySecrets: string[];
  environmentSecrets: Record<string, string[]>;
  collaborators: Json[];
  codeowners: boolean;
  installations: Json[];
};

async function applyAll(gh: Gh, policy: Policy = POLICY): Promise<Finding[]> {
  const findings = await audit(gh, policy);
  for (const f of findings) {
    if (f.state !== "change") continue;
    await f.change.apply();
    assert.equal(await f.change.verify(), null, f.resource);
  }
  return findings;
}

const byState = (findings: Finding[], state: Finding["state"]): string[] =>
  findings.filter((f) => f.state === state).map((f) => f.resource);

const rulesetNamed = (gh: ReturnType<typeof fakeGitHub>, name: string): Json => {
  const found = gh.state.rulesets.find((r) => r.name === name);
  assert.ok(found, name);
  return found;
};

describe("covers", () => {
  it("accepts extra keys and elements, refuses missing or different ones", () => {
    assert.ok(covers({ a: 1 }, { a: 1, b: 2 }));
    assert.ok(covers([{ type: "x" }], [{ type: "y" }, { type: "x", extra: true }]));
    assert.ok(!covers({ a: 1 }, { a: 2 }));
    assert.ok(!covers([{ type: "x" }], [{ type: "y" }]));
    assert.ok(!covers({ a: { b: 1 } }, { a: null }));
    assert.equal(
      canonical({ b: [2, { d: 1, c: 2 }], a: null }),
      '{"a":null,"b":[2,{"c":2,"d":1}]}',
    );
  });
});

describe("an unprotected repository is brought to the policy", () => {
  it("audits every resource, applies each change and reads it back; a second audit changes nothing", async () => {
    const gh = fakeGitHub();
    const first = await audit(gh, POLICY);
    assert.equal(gh.writes.length, 0, "audit writes nothing");
    assert.deepEqual(byState(first, "change"), [
      "repository settings",
      "vulnerability alerts",
      "Dependabot security updates",
      "private vulnerability reporting",
      "ruleset protect-main",
      "ruleset protect-integration",
      "ruleset protect-release-tags",
      "environment claude-live",
      "environment npm-release",
      "environment npm-release deployment tags",
      "actions permissions",
      "actions allowed",
      "workflow token",
      "fork pull request approval",
    ]);
    assert.deepEqual(byState(first, "manual"), [
      "environment secret CLAUDE_CODE_OAUTH_TOKEN",
      "GitHub Apps",
    ]);
    assert.deepEqual(byState(first, "unreadable"), []);

    await applyAll(gh);
    const second = await audit(gh, POLICY);
    assert.deepEqual(byState(second, "change"), []);
    assert.deepEqual(byState(second, "unreadable"), []);
    const writesAfter = gh.writes.length;
    await applyAll(gh);
    assert.equal(gh.writes.length, writesAfter, "nothing is written again");
  });

  it("protects the default and integration branches through pull requests and locks release tags", async () => {
    const gh = fakeGitHub();
    await applyAll(gh);
    const main = rulesetNamed(gh, "protect-main");
    assert.deepEqual(main.conditions, { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } });
    assert.deepEqual(main.bypass_actors, [
      { actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "pull_request" },
    ]);
    assert.deepEqual(
      (main.rules as Json[]).map((r) => r.type),
      ["deletion", "non_fast_forward", "pull_request", "required_status_checks"],
    );
    const checks = (main.rules as Json[]).find((r) => r.type === "required_status_checks")
      ?.parameters as Json;
    assert.deepEqual(checks, {
      strict_required_status_checks_policy: true,
      required_status_checks: [{ context: "Verify", integration_id: 15368 }],
    });
    const integration = rulesetNamed(gh, "protect-integration");
    assert.deepEqual(integration.conditions, {
      ref_name: { include: ["refs/heads/refactor/pactwright-v2"], exclude: [] },
    });
    assert.ok(!(integration.rules as Json[]).some((r) => r.type === "required_status_checks"));
    const tags = rulesetNamed(gh, "protect-release-tags");
    assert.equal(tags.target, "tag");
    assert.deepEqual(tags.bypass_actors, [
      { actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" },
    ]);
    assert.deepEqual(
      (tags.rules as Json[]).map((r) => r.type),
      ["creation", "update", "deletion", "non_fast_forward"],
    );
  });

  it("gates both environments on the owner's review without admin bypass; the release deploys from v* tags only", async () => {
    const gh = fakeGitHub();
    await applyAll(gh);
    for (const name of ["claude-live", "npm-release"]) {
      const env = gh.state.environments[name];
      assert.ok(env, name);
      assert.equal(env.can_admins_bypass, false);
      const reviewers = (env.protection_rules as Json[]).find(
        (r) => r.type === "required_reviewers",
      );
      assert.deepEqual(reviewers?.reviewers, [{ type: "User", reviewer: { id: 22468184 } }]);
    }
    assert.equal(gh.state.environments["claude-live"]?.deployment_branch_policy, null);
    assert.deepEqual(gh.state.environments["npm-release"]?.deployment_branch_policy, {
      protected_branches: false,
      custom_branch_policies: true,
    });
    assert.deepEqual(gh.state.branchPolicies["npm-release"], [{ name: "v*", type: "tag" }]);
  });

  it("restricts Actions to a read-only token, selected pinned actions and approved outside runs", async () => {
    const gh = fakeGitHub();
    await applyAll(gh);
    assert.deepEqual(gh.state.actions, {
      enabled: true,
      allowed_actions: "selected",
      sha_pinning_required: true,
    });
    assert.deepEqual(gh.state.selectedActions, {
      github_owned_allowed: true,
      verified_allowed: false,
      patterns_allowed: ["pnpm/action-setup@*"],
    });
    assert.deepEqual(gh.state.workflow, {
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: false,
    });
    assert.deepEqual(gh.state.forkApproval, { approval_policy: "all_external_contributors" });
    assert.deepEqual(gh.state.repository, {
      pull_request_creation_policy: "collaborators_only",
      delete_branch_on_merge: true,
      security_and_analysis: {
        secret_scanning: { status: "enabled" },
        secret_scanning_push_protection: { status: "enabled" },
      },
    });
  });

  it("--allow-owner-push lets admins bypass the branch rulesets always", async () => {
    const gh = fakeGitHub();
    await applyAll(gh, { ...POLICY, ownerPush: true });
    for (const name of ["protect-main", "protect-integration"]) {
      assert.deepEqual(rulesetNamed(gh, name).bypass_actors, [
        { actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" },
      ]);
    }
  });
});

describe("existing settings are kept, never loosened or deleted", () => {
  it("keeps extra rules, bypass actors, refs, reviewers, action patterns and unrelated rulesets", async () => {
    const gh = fakeGitHub({
      rulesets: [
        {
          id: 7,
          name: "protect-main",
          target: "branch",
          enforcement: "active",
          bypass_actors: [{ actor_id: 42, actor_type: "Integration", bypass_mode: "always" }],
          conditions: {
            ref_name: {
              include: ["~DEFAULT_BRANCH", "refs/heads/release/*"],
              exclude: ["refs/heads/tmp"],
            },
          },
          rules: [
            { type: "required_linear_history" },
            {
              type: "pull_request",
              parameters: { required_approving_review_count: 2, allowed_merge_methods: ["squash"] },
            },
          ],
        },
        {
          id: 8,
          name: "other",
          target: "branch",
          enforcement: "active",
          bypass_actors: [],
          conditions: {},
          rules: [],
        },
      ],
      environments: {
        "claude-live": {
          name: "claude-live",
          protection_rules: [
            {
              type: "required_reviewers",
              prevent_self_review: true,
              reviewers: [{ type: "Team", reviewer: { id: 9 } }],
            },
            { type: "wait_timer", wait_timer: 5 },
          ],
          deployment_branch_policy: null,
          can_admins_bypass: true,
        },
      },
      actions: { enabled: true, allowed_actions: "selected" },
      selectedActions: {
        github_owned_allowed: true,
        verified_allowed: true,
        patterns_allowed: ["docker/*"],
      },
    });
    await applyAll(gh);
    const main = rulesetNamed(gh, "protect-main");
    assert.deepEqual(main.bypass_actors, [
      { actor_id: 42, actor_type: "Integration", bypass_mode: "always" },
      { actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "pull_request" },
    ]);
    assert.deepEqual(main.conditions, {
      ref_name: {
        include: ["~DEFAULT_BRANCH", "refs/heads/release/*"],
        exclude: ["refs/heads/tmp"],
      },
    });
    const rules = main.rules as Json[];
    assert.deepEqual(
      rules.map((r) => r.type),
      [
        "required_linear_history",
        "pull_request",
        "deletion",
        "non_fast_forward",
        "required_status_checks",
      ],
    );
    assert.deepEqual(rules.find((r) => r.type === "pull_request")?.parameters, {
      required_approving_review_count: 2,
      allowed_merge_methods: ["squash"],
      dismiss_stale_reviews_on_push: true,
      require_code_owner_review: true,
      require_last_push_approval: false,
      required_review_thread_resolution: true,
    });
    assert.ok(
      gh.state.rulesets.some((r) => r.name === "other"),
      "an unrelated ruleset stays",
    );
    assert.equal(gh.state.rulesets.length, 4);

    const live = gh.state.environments["claude-live"];
    assert.ok(live);
    const reviewers = (live.protection_rules as Json[]).find(
      (r) => r.type === "required_reviewers",
    );
    assert.deepEqual(reviewers?.reviewers, [
      { type: "Team", reviewer: { id: 9 } },
      { type: "User", reviewer: { id: 22468184 } },
    ]);
    assert.equal(reviewers?.prevent_self_review, true);
    assert.equal(
      (live.protection_rules as Json[]).find((r) => r.type === "wait_timer")?.wait_timer,
      5,
    );
    assert.equal(live.can_admins_bypass, false);
    assert.deepEqual(gh.state.selectedActions, {
      github_owned_allowed: true,
      verified_allowed: true,
      patterns_allowed: ["docker/*", "pnpm/action-setup@*"],
    });
    assert.equal(
      gh.state.actions.sha_pinning_required,
      undefined,
      "a field the API does not expose is not sent",
    );
  });

  it("a stricter existing review rule is kept and reported as already set", async () => {
    const gh = fakeGitHub();
    await applyAll(gh);
    const rule = (rulesetNamed(gh, "protect-main").rules as Json[]).find(
      (r) => r.type === "pull_request",
    );
    assert.ok(rule);
    rule.parameters = {
      ...(rule.parameters as Json),
      required_approving_review_count: 3,
      require_last_push_approval: true,
    };
    const findings = await audit(gh, POLICY);
    assert.equal(findings.find((f) => f.resource === "ruleset protect-main")?.state, "already-set");
    await applyAll(gh);
    assert.deepEqual(
      (rulesetNamed(gh, "protect-main").rules as Json[]).find((r) => r.type === "pull_request")
        ?.parameters,
      {
        required_approving_review_count: 3,
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: true,
        require_last_push_approval: true,
        required_review_thread_resolution: true,
      },
    );
  });
});

describe("secrets and people are reported, never changed", () => {
  it("names a repository-level secret to move and the command to set the environment secret", async () => {
    const gh = fakeGitHub({ repositorySecrets: ["CLAUDE_CODE_OAUTH_TOKEN"] });
    const findings = await audit(gh, POLICY);
    const repoSecret = findings.find(
      (f) => f.resource === "repository secret CLAUDE_CODE_OAUTH_TOKEN",
    );
    assert.equal(repoSecret?.state, "manual");
    assert.match(repoSecret?.detail ?? "", /move it to the claude-live environment/);
    const envSecret = findings.find(
      (f) => f.resource === "environment secret CLAUDE_CODE_OAUTH_TOKEN",
    );
    assert.equal(envSecret?.state, "manual");
    assert.equal(
      envSecret?.detail,
      "not set; run in your own terminal: gh secret set CLAUDE_CODE_OAUTH_TOKEN --env claude-live --repo sb-dev/pactwright",
    );
    assert.ok(!gh.writes.some((w) => w.includes("secrets")), "no secret endpoint is written");
  });

  it("an environment secret that exists is already set; other collaborators and workflow-writing apps need a person", async () => {
    const gh = fakeGitHub({
      environmentSecrets: { "claude-live": ["CLAUDE_CODE_OAUTH_TOKEN"] },
      collaborators: [
        { login: "sb-dev", role_name: "admin" },
        { login: "intruder", role_name: "write" },
      ],
      codeowners: false,
    });
    const findings = await audit(gh, POLICY);
    const by = (resource: string): Finding | undefined =>
      findings.find((f) => f.resource === resource);
    assert.equal(by("environment secret CLAUDE_CODE_OAUTH_TOKEN")?.state, "already-set");
    assert.equal(by("collaborators")?.state, "manual");
    assert.match(by("collaborators")?.detail ?? "", /intruder \(write\)/);
    assert.equal(by("CODEOWNERS")?.state, "manual");
    assert.equal(by("GitHub Apps")?.state, "manual");
    assert.match(by("GitHub Apps")?.detail ?? "", /claude/);
  });

  it("a read failure other than 404 is reported as unreadable, not applied over", async () => {
    const gh = fakeGitHub();
    const failing: Gh = {
      api: (method, path, body) =>
        path === "repos/sb-dev/pactwright/rulesets" && method === "GET"
          ? Promise.resolve({ ok: false, status: 403, message: "Resource not accessible" })
          : gh.api(method, path, body),
    };
    const findings = await audit(failing, POLICY);
    const unreadable = findings.find((f) => f.state === "unreadable");
    assert.equal(unreadable?.resource, "rulesets");
    assert.match(unreadable?.detail ?? "", /403 Resource not accessible/);
    assert.ok(
      findings.some((f) => f.resource === "environment claude-live"),
      "later sections still run",
    );
  });
});

describe("the gh boundary", () => {
  it("sends the method, path, headers and JSON body, and parses status and body", async () => {
    const calls: { args: readonly string[]; input: string | undefined }[] = [];
    const client = ghClient((args, input) => {
      calls.push({ args, input });
      const body = input === undefined ? "" : input;
      return Promise.resolve({
        code: 0,
        stdout: `HTTP/2.0 201 Created\r\nContent-Type: application/json\r\n\r\n{"echo":${body || "null"}}`,
        stderr: "",
      });
    });
    const result = await client.api("POST", "repos/o/r/rulesets", { name: "x" });
    assert.deepEqual(result, { ok: true, status: 201, body: { echo: { name: "x" } } });
    assert.deepEqual(calls[0]?.args, [
      "api",
      "-X",
      "POST",
      "repos/o/r/rulesets",
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      "--include",
      "--input",
      "-",
    ]);
    assert.equal(calls[0]?.input, '{"name":"x"}');
    const read = ghClient(() =>
      Promise.resolve({ code: 0, stdout: "HTTP/2.0 204 No Content\r\n\r\n", stderr: "" }),
    );
    assert.deepEqual(await read.api("GET", "repos/o/r/vulnerability-alerts"), {
      ok: true,
      status: 204,
      body: null,
    });
  });

  it("reports a non-2xx response with GitHub's message, and a failed process with stderr", async () => {
    const refused = ghClient(() =>
      Promise.resolve({
        code: 1,
        stdout: 'HTTP/2.0 404 Not Found\r\n\r\n{"message":"Not Found","documentation_url":"x"}',
        stderr: "gh: Not Found (HTTP 404)",
      }),
    );
    assert.deepEqual(await refused.api("GET", "repos/o/r/environments/none"), {
      ok: false,
      status: 404,
      message: "Not Found",
    });
    const crashed = ghClient(() =>
      Promise.resolve({ code: 4, stdout: "", stderr: "gh: not logged in" }),
    );
    assert.deepEqual(await crashed.api("GET", "user"), {
      ok: false,
      status: 0,
      message: "gh: not logged in",
    });
  });
});

describe("command line", () => {
  const run = (args: string[], env: NodeJS.ProcessEnv = process.env) =>
    spawnSync(process.execPath, ["--import", "tsx", join(here, "../src/cli.ts"), ...args], {
      encoding: "utf8",
      env,
    });

  it("prints usage for --help and refuses an unknown command with exit 2", () => {
    const help = run(["--help"]);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /audit/);
    assert.match(help.stdout, /apply/);
    const applyHelp = run(["apply", "--help"]);
    assert.match(applyHelp.stdout, /--allow-owner-push/);
    assert.match(applyHelp.stdout, /--yes/);
    assert.equal(run(["nonsense"]).status, 2);
  });

  it("audit runs gh, prints each finding, writes nothing and exits 1 while something would change", () => {
    // A `gh` on PATH that answers the repository settings as desired and
    // everything else as missing, and logs every call.
    const dir = mkdtempSync(join(tmpdir(), "pactwright-fake-gh-"));
    const log = join(dir, "calls.log");
    writeFileSync(
      join(dir, "gh"),
      [
        "#!/usr/bin/env node",
        `require("node:fs").appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + "\\n");`,
        "const args = process.argv.slice(2);",
        'if (args[0] === "repo") { process.stdout.write("sb-dev/pactwright\\n"); process.exit(0); }',
        'if (args[0] === "api" && args[1] === "user") { process.stdout.write("sb-dev\\n"); process.exit(0); }',
        "const path = args[3];",
        'if (path === "repos/sb-dev/pactwright") {',
        '  process.stdout.write("HTTP/2.0 200 OK\\r\\n\\r\\n" + JSON.stringify({ pull_request_creation_policy: "collaborators_only", delete_branch_on_merge: true, security_and_analysis: { secret_scanning: { status: "enabled" }, secret_scanning_push_protection: { status: "enabled" } } }));',
        "  process.exit(0);",
        "}",
        'process.stdout.write("HTTP/2.0 404 Not Found\\r\\n\\r\\n{\\"message\\":\\"Not Found\\"}");',
        'process.stderr.write("gh: Not Found (HTTP 404)");',
        "process.exit(1);",
        "",
      ].join("\n"),
    );
    chmodSync(join(dir, "gh"), 0o755);
    const result = run(["audit", "--required-check", "CI", "--required-check", "Verify"], {
      ...process.env,
      PATH: `${dir}${delimiter}${process.env.PATH ?? ""}`,
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /^= repository settings: as desired$/m);
    assert.match(result.stdout, /^~ vulnerability alerts: disabled → enabled$/m);
    assert.match(result.stdout, /^\? rulesets: repos\/sb-dev\/pactwright\/rulesets$/m);
    assert.match(
      result.stdout,
      /^! environment secret CLAUDE_CODE_OAUTH_TOKEN: not set; run in your own terminal/m,
    );
    assert.match(result.stdout, /\d+ already set, \d+ to change, \d+ for a person, \d+ unreadable/);
    const calls = readFileSync(log, "utf8").trim().split("\n");
    assert.ok(
      calls.every((c) => c.startsWith("repo view") || c.startsWith("api -X GET ")),
      calls.join("\n"),
    );
  });
});
