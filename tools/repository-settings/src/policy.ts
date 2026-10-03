// The repository governance policy (GitHub repository governance research
// log §§3–5): the desired state of each GitHub resource, how the current
// state is read, and the change that brings it to the desired state. Every
// change is idempotent and never loosens what is already set: existing
// rules, bypass actors, reviewers and allowed actions are kept, and nothing
// is deleted. Secrets are never read, printed or written.

import type { Gh, Method } from "./github.js";

export type Policy = {
  owner: string;
  repo: string;
  /** The branch pull requests merge into besides the default branch. */
  integrationBranch: string;
  /** Check names the default branch requires; the integration branch requires none. */
  requiredChecks: string[];
  /** Whether admins (the code owner) may push to protected branches directly. */
  ownerPush: boolean;
  /** The environment whose secret funds live provider sessions. */
  liveEnvironment: string;
  /** The environment the npm release job deploys from. */
  releaseEnvironment: string;
  /** The provider secret's name; it lives only in the live environment. */
  secretName: string;
  /** Third-party action patterns workflows may use, besides GitHub's own. */
  allowedActions: string[];
};

export const DEFAULT_POLICY: Omit<Policy, "owner" | "repo"> = {
  integrationBranch: "refactor/pactwright-v2",
  requiredChecks: ["Verify"],
  ownerPush: false,
  liveEnvironment: "claude-live",
  releaseEnvironment: "npm-release",
  secretName: "CLAUDE_CODE_OAUTH_TOKEN",
  allowedActions: ["pnpm/action-setup@*"],
};

/** One write that brings a resource to its desired state. */
export type Change = {
  resource: string;
  before: unknown;
  after: unknown;
  /** What differs, one line each. */
  lines: string[];
  apply(): Promise<void>;
  /** Re-reads the resource; null when it now matches, else what still differs. */
  verify(): Promise<string | null>;
};

export type Finding =
  | { resource: string; state: "already-set"; detail: string }
  | { resource: string; state: "change"; detail: string; change: Change }
  | { resource: string; state: "manual"; detail: string }
  | { resource: string; state: "unreadable"; detail: string };

type Json = Record<string, unknown>;

/** The repository role ID of an administrator in ruleset bypass actors. */
const ADMIN_ROLE = 5;

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Key-ordered JSON, for comparisons and backups. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Whether `current` already holds everything `desired` asks for: each key
 * of a desired object matches, and each element of a desired array is
 * covered by some current element. Extra current keys and elements are
 * allowed, so a stricter existing setting counts as set.
 */
export function covers(desired: unknown, current: unknown): boolean {
  if (Array.isArray(desired)) {
    return Array.isArray(current) && desired.every((d) => current.some((c) => covers(d, c)));
  }
  if (isObject(desired)) {
    return isObject(current) && Object.keys(desired).every((k) => covers(desired[k], current[k]));
  }
  return canonical(desired) === canonical(current);
}

/** The keys of `desired` that `current` does not cover, as `key: current → desired`. */
function differences(desired: Json, current: unknown): string[] {
  return Object.keys(desired)
    .filter((k) => !covers(desired[k], isObject(current) ? current[k] : undefined))
    .map(
      (k) =>
        `${k}: ${isObject(current) ? canonical(current[k]) : "absent"} → ${canonical(desired[k])}`,
    );
}

async function read(gh: Gh, path: string): Promise<{ status: number; body: unknown } | null> {
  const result = await gh.api("GET", path);
  if (result.ok) return { status: result.status, body: result.body };
  if (result.status === 404) return null;
  throw new Error(`GET ${path}: HTTP ${result.status} ${result.message}`);
}

async function write(gh: Gh, method: Method, path: string, body?: unknown): Promise<unknown> {
  const result = await gh.api(method, path, body);
  if (!result.ok) throw new Error(`${method} ${path}: HTTP ${result.status} ${result.message}`);
  return result.body;
}

/**
 * A finding for a resource whose desired state is a subset of one JSON
 * document: already set when covered, else a change that writes `body` and
 * verifies by reading the resource again, through `reread` when the written
 * resource is not the document at `path`.
 */
function settle(
  gh: Gh,
  resource: string,
  path: string,
  current: unknown,
  desired: Json,
  send: { method: Method; path?: string; body: unknown },
  reread: () => Promise<unknown> = async () => (await read(gh, path))?.body ?? null,
): Finding {
  if (covers(desired, current)) return { resource, state: "already-set", detail: "as desired" };
  const lines = differences(desired, current);
  return {
    resource,
    state: "change",
    detail: lines.join("; "),
    change: {
      resource,
      before: current,
      after: send.body,
      lines,
      apply: async () => {
        await write(gh, send.method, send.path ?? path, send.body);
      },
      verify: async () => {
        const still = differences(desired, await reread());
        return still.length === 0 ? null : still.join("; ");
      },
    },
  };
}

const repoPath = (p: Policy, suffix = ""): string => `repos/${p.owner}/${p.repo}${suffix}`;

// Repository settings: who may open pull requests, merged branches are
// deleted, secret scanning and push protection are on.
async function repositorySettings(gh: Gh, p: Policy): Promise<Finding[]> {
  const path = repoPath(p);
  const current = (await read(gh, path))?.body;
  if (!isObject(current)) return [{ resource: "repository", state: "unreadable", detail: path }];
  const desired: Json = {
    pull_request_creation_policy: "collaborators_only",
    delete_branch_on_merge: true,
    security_and_analysis: {
      secret_scanning: { status: "enabled" },
      secret_scanning_push_protection: { status: "enabled" },
    },
  };
  const body = Object.fromEntries(
    Object.entries(desired).filter(([k]) => !covers(desired[k], current[k])),
  );
  return [settle(gh, "repository settings", path, current, desired, { method: "PATCH", body })];
}

// Toggles that GitHub exposes as PUT-to-enable endpoints.
async function toggles(gh: Gh, p: Policy): Promise<Finding[]> {
  const findings: Finding[] = [];
  const alerts = repoPath(p, "/vulnerability-alerts");
  const enabled = (await read(gh, alerts)) !== null;
  findings.push(
    enabled
      ? { resource: "vulnerability alerts", state: "already-set", detail: "enabled" }
      : {
          resource: "vulnerability alerts",
          state: "change",
          detail: "disabled → enabled",
          change: {
            resource: "vulnerability alerts",
            before: { enabled: false },
            after: { enabled: true },
            lines: ["enabled: false → true"],
            apply: async () => {
              await write(gh, "PUT", alerts);
            },
            verify: async () => ((await read(gh, alerts)) === null ? "still disabled" : null),
          },
        },
  );
  for (const [resource, suffix] of [
    ["Dependabot security updates", "/automated-security-fixes"],
    ["private vulnerability reporting", "/private-vulnerability-reporting"],
  ] as const) {
    const path = repoPath(p, suffix);
    const current = (await read(gh, path))?.body ?? { enabled: false };
    findings.push(
      settle(gh, resource, path, current, { enabled: true }, { method: "PUT", body: undefined }),
    );
  }
  return findings;
}

type Rule = { type: string; parameters?: Json };
type Actor = { actor_id: number; actor_type: string; bypass_mode: string };
type Ruleset = {
  name: string;
  target: "branch" | "tag";
  enforcement: "active";
  bypass_actors: Actor[];
  conditions: { ref_name: { include: string[]; exclude: string[] } };
  rules: Rule[];
};

function branchRuleset(name: string, include: string[], checks: Json[], p: Policy): Ruleset {
  const rules: Rule[] = [
    { type: "deletion" },
    { type: "non_fast_forward" },
    {
      type: "pull_request",
      parameters: {
        required_approving_review_count: 1,
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: true,
        require_last_push_approval: false,
        required_review_thread_resolution: true,
      },
    },
  ];
  if (checks.length > 0) {
    rules.push({
      type: "required_status_checks",
      parameters: { strict_required_status_checks_policy: true, required_status_checks: checks },
    });
  }
  return {
    name,
    target: "branch",
    enforcement: "active",
    bypass_actors: [
      {
        actor_id: ADMIN_ROLE,
        actor_type: "RepositoryRole",
        bypass_mode: p.ownerPush ? "always" : "pull_request",
      },
    ],
    conditions: { ref_name: { include, exclude: [] } },
    rules,
  };
}

const tagRuleset = (name: string): Ruleset => ({
  name,
  target: "tag",
  enforcement: "active",
  bypass_actors: [{ actor_id: ADMIN_ROLE, actor_type: "RepositoryRole", bypass_mode: "always" }],
  conditions: { ref_name: { include: ["refs/tags/v*"], exclude: [] } },
  rules: [
    { type: "creation" },
    { type: "update" },
    { type: "deletion" },
    { type: "non_fast_forward" },
  ],
});

/**
 * Rule parameters with `desired` applied over `prior` without loosening it:
 * a higher existing count and a `true` existing flag are kept.
 */
function stricter(prior: Json, desired: Json): Json {
  const merged = { ...prior };
  for (const [key, value] of Object.entries(desired)) {
    const have = prior[key];
    merged[key] =
      typeof value === "number" && typeof have === "number"
        ? Math.max(have, value)
        : typeof value === "boolean" && have === true
          ? true
          : value;
  }
  return merged;
}

/** The desired ruleset over an existing one: existing actors, refs and rules stay; ours win. */
function mergeRuleset(desired: Ruleset, existing: unknown): Ruleset {
  if (!isObject(existing)) return desired;
  const actorKey = (a: Actor): string => `${a.actor_type}:${a.actor_id}`;
  const existingActors = (
    Array.isArray(existing.bypass_actors) ? existing.bypass_actors : []
  ).filter((a): a is Actor => isObject(a) && typeof a.actor_id === "number");
  const actors = new Map(existingActors.map((a) => [actorKey(a), a]));
  for (const a of desired.bypass_actors) actors.set(actorKey(a), a);
  const conditions = isObject(existing.conditions) ? existing.conditions : {};
  const refName = isObject(conditions.ref_name) ? conditions.ref_name : {};
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  const existingRules = (Array.isArray(existing.rules) ? existing.rules : []).filter(
    (r): r is Rule => isObject(r) && typeof r.type === "string",
  );
  const rules = new Map(existingRules.map((r) => [r.type, r]));
  for (const r of desired.rules) {
    const prior = rules.get(r.type);
    rules.set(r.type, {
      type: r.type,
      ...(r.parameters || prior?.parameters
        ? { parameters: stricter({ ...prior?.parameters }, r.parameters ?? {}) }
        : {}),
    });
  }
  return {
    ...desired,
    bypass_actors: [...actors.values()],
    conditions: {
      ref_name: {
        include: [
          ...new Set([...strings(refName.include), ...desired.conditions.ref_name.include]),
        ],
        exclude: strings(refName.exclude),
      },
    },
    rules: [...rules.values()],
  };
}

async function rulesets(gh: Gh, p: Policy): Promise<Finding[]> {
  const listPath = repoPath(p, "/rulesets");
  const list = (await read(gh, listPath))?.body;
  if (!Array.isArray(list))
    return [{ resource: "rulesets", state: "unreadable", detail: listPath }];
  const actions = (await read(gh, "apps/github-actions"))?.body;
  const integration = isObject(actions) && typeof actions.id === "number" ? actions.id : null;
  const checks = p.requiredChecks.map((context) => ({
    context,
    ...(integration === null ? {} : { integration_id: integration }),
  }));
  const wanted: Ruleset[] = [
    branchRuleset("protect-main", ["~DEFAULT_BRANCH"], checks, p),
    branchRuleset("protect-integration", [`refs/heads/${p.integrationBranch}`], [], p),
    tagRuleset("protect-release-tags"),
  ];
  const findings: Finding[] = [];
  for (const desired of wanted) {
    const resource = `ruleset ${desired.name}`;
    const entry = list.find((r) => isObject(r) && r.name === desired.name);
    const id = isObject(entry) && typeof entry.id === "number" ? entry.id : null;
    const path = id === null ? listPath : `${listPath}/${id}`;
    const existing = id === null ? null : ((await read(gh, path))?.body ?? null);
    const merged = mergeRuleset(desired, existing);
    const { name: _name, ...compared } = merged;
    void _name;
    // A created ruleset is found by name, then read at its own path.
    const reread = async (): Promise<unknown> => {
      const now = (await read(gh, listPath))?.body;
      const entry = Array.isArray(now)
        ? now.find((r) => isObject(r) && r.name === desired.name)
        : null;
      if (!isObject(entry) || typeof entry.id !== "number") return null;
      return (await read(gh, `${listPath}/${entry.id}`))?.body ?? null;
    };
    findings.push(
      settle(
        gh,
        resource,
        path,
        existing,
        compared,
        { method: id === null ? "POST" : "PUT", body: merged },
        reread,
      ),
    );
  }
  return findings;
}

type Reviewer = { type: string; id: number };

/** An environment as read, reduced to the fields the policy sets. */
function environmentState(body: unknown): Json | null {
  if (!isObject(body)) return null;
  const rules = Array.isArray(body.protection_rules) ? body.protection_rules : [];
  const reviewers: Reviewer[] = [];
  let preventSelfReview = false;
  let waitTimer = 0;
  for (const rule of rules) {
    if (!isObject(rule)) continue;
    if (rule.type === "required_reviewers") {
      preventSelfReview = rule.prevent_self_review === true;
      for (const r of Array.isArray(rule.reviewers) ? rule.reviewers : []) {
        if (isObject(r) && isObject(r.reviewer) && typeof r.reviewer.id === "number") {
          reviewers.push({ type: String(r.type), id: r.reviewer.id });
        }
      }
    }
    if (rule.type === "wait_timer" && typeof rule.wait_timer === "number")
      waitTimer = rule.wait_timer;
  }
  return {
    reviewers,
    prevent_self_review: preventSelfReview,
    wait_timer: waitTimer,
    can_admins_bypass: body.can_admins_bypass,
    deployment_branch_policy: body.deployment_branch_policy ?? null,
  };
}

async function environments(gh: Gh, p: Policy): Promise<Finding[]> {
  const user = (await read(gh, `users/${p.owner}`))?.body;
  if (!isObject(user) || typeof user.id !== "number") {
    return [{ resource: "environments", state: "unreadable", detail: `users/${p.owner}` }];
  }
  const owner: Reviewer = { type: "User", id: user.id };
  const findings: Finding[] = [];
  for (const [name, branchPolicy] of [
    [p.liveEnvironment, null],
    [p.releaseEnvironment, { protected_branches: false, custom_branch_policies: true }],
  ] as const) {
    const path = repoPath(p, `/environments/${name}`);
    const current = environmentState((await read(gh, path))?.body);
    const reviewers = (current?.reviewers as Reviewer[] | undefined) ?? [];
    const desired: Json = {
      reviewers: [owner],
      can_admins_bypass: false,
      ...(branchPolicy === null ? {} : { deployment_branch_policy: branchPolicy }),
    };
    const body = {
      wait_timer: current?.wait_timer ?? 0,
      prevent_self_review: current?.prevent_self_review ?? false,
      reviewers: reviewers.some((r) => r.type === owner.type && r.id === owner.id)
        ? reviewers
        : [...reviewers, owner],
      deployment_branch_policy: branchPolicy ?? current?.deployment_branch_policy ?? null,
      can_admins_bypass: false,
    };
    findings.push(
      settle(gh, `environment ${name}`, path, current, desired, { method: "PUT", body }, async () =>
        environmentState((await read(gh, path))?.body),
      ),
    );
  }
  const policiesPath = repoPath(
    p,
    `/environments/${p.releaseEnvironment}/deployment-branch-policies`,
  );
  const policies = (await read(gh, policiesPath))?.body;
  const existing =
    isObject(policies) && Array.isArray(policies.branch_policies) ? policies.branch_policies : [];
  const tagPolicy = { name: "v*", type: "tag" };
  findings.push(
    settle(
      gh,
      `environment ${p.releaseEnvironment} deployment tags`,
      policiesPath,
      { branch_policies: existing },
      { branch_policies: [tagPolicy] },
      { method: "POST", body: tagPolicy },
    ),
  );
  return findings;
}

async function actions(gh: Gh, p: Policy): Promise<Finding[]> {
  const base = repoPath(p, "/actions/permissions");
  const findings: Finding[] = [];
  const permissions = (await read(gh, base))?.body;
  if (!isObject(permissions))
    return [{ resource: "actions permissions", state: "unreadable", detail: base }];
  const pinning = "sha_pinning_required" in permissions ? { sha_pinning_required: true } : {};
  const desired = { enabled: true, allowed_actions: "selected", ...pinning };
  findings.push(
    settle(gh, "actions permissions", base, permissions, desired, { method: "PUT", body: desired }),
  );

  // GitHub answers 409 here while allowed_actions is not "selected".
  const selectedPath = `${base}/selected-actions`;
  const selectedResult = await gh.api("GET", selectedPath);
  const selected = selectedResult.ok ? selectedResult.body : null;
  const existingPatterns =
    isObject(selected) && Array.isArray(selected.patterns_allowed)
      ? selected.patterns_allowed.filter((s): s is string => typeof s === "string")
      : [];
  const selectedBody = {
    github_owned_allowed: true,
    verified_allowed: isObject(selected) && selected.verified_allowed === true,
    patterns_allowed: [...new Set([...existingPatterns, ...p.allowedActions])].sort(),
  };
  findings.push(
    settle(
      gh,
      "actions allowed",
      selectedPath,
      selected ?? null,
      { github_owned_allowed: true, patterns_allowed: p.allowedActions },
      { method: "PUT", body: selectedBody },
    ),
  );

  for (const [resource, suffix, desiredValue] of [
    [
      "workflow token",
      "/workflow",
      { default_workflow_permissions: "read", can_approve_pull_request_reviews: false },
    ],
    [
      "fork pull request approval",
      "/fork-pr-contributor-approval",
      { approval_policy: "all_external_contributors" },
    ],
  ] as const) {
    const path = `${base}${suffix}`;
    const current = (await read(gh, path))?.body ?? null;
    findings.push(
      settle(gh, resource, path, current, desiredValue, { method: "PUT", body: desiredValue }),
    );
  }
  return findings;
}

// Secrets are never read or written; only their presence is checked.
async function secrets(gh: Gh, p: Policy): Promise<Finding[]> {
  const findings: Finding[] = [];
  const repoSecret = await read(gh, repoPath(p, `/actions/secrets/${p.secretName}`));
  if (repoSecret !== null) {
    findings.push({
      resource: `repository secret ${p.secretName}`,
      state: "manual",
      detail: `exists at repository level, where every same-repository workflow run can read it; move it to the ${p.liveEnvironment} environment and delete the repository secret yourself`,
    });
  }
  const envSecret = await read(
    gh,
    repoPath(p, `/environments/${p.liveEnvironment}/secrets/${p.secretName}`),
  );
  findings.push(
    envSecret !== null
      ? {
          resource: `environment secret ${p.secretName}`,
          state: "already-set",
          detail: `set in ${p.liveEnvironment}`,
        }
      : {
          resource: `environment secret ${p.secretName}`,
          state: "manual",
          detail: `not set; run in your own terminal: gh secret set ${p.secretName} --env ${p.liveEnvironment} --repo ${p.owner}/${p.repo}`,
        },
  );
  return findings;
}

// People and apps are reported, never changed.
async function access(gh: Gh, p: Policy): Promise<Finding[]> {
  const findings: Finding[] = [];
  const collaborators = (await read(gh, repoPath(p, "/collaborators?affiliation=direct")))?.body;
  if (Array.isArray(collaborators)) {
    const others = collaborators
      .filter((c): c is Json => isObject(c) && c.login !== p.owner)
      .map((c) => `${String(c.login)} (${String(c.role_name)})`);
    findings.push({
      resource: "collaborators",
      state: others.length === 0 ? "already-set" : "manual",
      detail:
        others.length === 0
          ? `${p.owner} only`
          : `besides ${p.owner}: ${others.join(", ")}; remove or confirm each`,
    });
  }
  const codeowners = await read(gh, repoPath(p, "/contents/.github/CODEOWNERS"));
  findings.push({
    resource: "CODEOWNERS",
    state: codeowners === null ? "manual" : "already-set",
    detail:
      codeowners === null
        ? "missing on the default branch; add `* @owner`"
        : "present on the default branch",
  });
  const installations = (await read(gh, "user/installations"))?.body;
  const apps =
    isObject(installations) && Array.isArray(installations.installations)
      ? installations.installations
      : [];
  const writers = apps
    .filter(
      (a): a is Json =>
        isObject(a) && isObject(a.permissions) && a.permissions.workflows === "write",
    )
    .map((a) => String(a.app_slug));
  findings.push({
    resource: "GitHub Apps",
    state: writers.length === 0 ? "already-set" : "manual",
    detail:
      writers.length === 0
        ? "no installed app may change workflow files"
        : `apps that may change workflow files, and so what reads a secret: ${writers.join(", ")}; remove that permission from agent apps`,
  });
  return findings;
}

/** Reads every governed resource and returns what is set, what to change and what needs a person. */
export async function audit(gh: Gh, policy: Policy): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const section of [
    repositorySettings,
    toggles,
    rulesets,
    environments,
    actions,
    secrets,
    access,
  ]) {
    try {
      findings.push(...(await section(gh, policy)));
    } catch (e) {
      findings.push({
        resource: section.name,
        state: "unreadable",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return findings;
}
