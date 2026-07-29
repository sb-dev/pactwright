import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { asString, compareStrings, loadSpec, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import { finalEvidenceForBrief, liveBriefsForContract } from "./handlers/coverage_traversal.ts";

/**
 * One-way graph → GitHub issue projection: one issue per lane brief, one parent per
 * contract. The graph stays the source of truth; issues are a VIEW. No node
 * frontmatter ever references an issue (contract Out-of-scope 3).
 *
 * The module is deliberately split:
 *
 *  - `planIssueSync` is PURE — deterministic, clock-free, network-free, total. It
 *    decides what would change and why. Its four behaviours (no-op re-run, reopen of
 *    a hand-closed lane, close on final evidence, close on final integration) are
 *    what the `test-verification` lane's unit tests drive.
 *  - `applyPlan` is the thin impure adapter over `gh`. It is DRY by default.
 *
 * `issue-sync` is deliberately NOT a `spec` subcommand (contract Scope 3): that
 * dispatch stays read-and-validate only, and nothing in `tools/spec.ts` imports this
 * module. It ships behind the `spec:issue-sync` package script instead.
 *
 * Nothing here executes on import — the CLI entry is guarded at the bottom.
 */

/** The durable marker that ties an issue to its node. CC-4(1): an issue is adopted
 * only when its body carries this EXACT HTML comment AND its author is the sync
 * identity. Body text merely containing the sentinel substring is never adopted. */
export const NODE_MARKER_PREFIX = "pactwright:node=";

export function nodeMarker(nodeId: string): string {
  return `<!-- ${NODE_MARKER_PREFIX}${nodeId} -->`;
}

const MARKER_RE = /<!--\s*pactwright:node=([a-z]+-[a-z0-9-]+-[0-9a-f]{4})\s*-->/;

/** The node id an issue body claims, or `undefined`. Strict: only the exact HTML
 * comment form counts, so prose containing the sentinel does not qualify. */
export function markedNodeId(body: string): string | undefined {
  return MARKER_RE.exec(body)?.[1];
}

export interface ExistingIssue {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  /** CC-4(1): only issues authored by the sync identity are adopted. */
  authorLogin: string;
}

export interface IssueAction {
  nodeId: string;
  title: string;
  body: string;
  /** Present for update/reopen/close; absent for create. */
  issueNumber?: number;
  reason: string;
}

export interface IssueSyncPlan {
  create: IssueAction[];
  update: IssueAction[];
  reopen: IssueAction[];
  close: IssueAction[];
  skipped: { nodeId: string; reason: string }[];
  /** CC-5: when true NO mutation may be applied — the listing did not complete, so
   * the plan cannot distinguish "issue absent" from "issue not listed". */
  refused: boolean;
  refusedReason?: string;
}

export interface PlanOptions {
  /** CC-5: did the caller's paginated listing complete? Fail closed if not. */
  listingComplete: boolean;
  /** The login this sync writes as. */
  syncIdentity: string;
  /** `owner/repo`, used only to build the projection's link. */
  repo: string;
}

const EMPTY_PLAN: Omit<IssueSyncPlan, "refused" | "refusedReason"> = {
  create: [],
  update: [],
  reopen: [],
  close: [],
  skipped: [],
};

/** CC-4(2) — the projection is BOUNDED. Only these fields of a node ever reach an
 * issue: id, title, status, lane, owner and a link. No node body, ever. */
function projectBody(node: NodeRecord, nodeId: string, repo: string): string {
  const field = (k: string): string => asString(node.data[k]) ?? "—";
  return [
    nodeMarker(nodeId),
    "",
    `- id: \`${nodeId}\``,
    `- status: ${field("status")}`,
    `- lane: ${field("lane")}`,
    `- owner: ${field("owner")}`,
    `- source: https://github.com/${repo}/blob/main/specs/nodes/${nodeId}.md`,
    "",
    "_Projected from the spec graph by `spec:issue-sync`. The graph is the source of",
    "truth; edits here are not read back._",
  ].join("\n");
}

function projectTitle(node: NodeRecord, nodeId: string): string {
  const lane = asString(node.data["lane"]);
  const title = asString(node.data["title"]) ?? nodeId;
  return lane === undefined ? title : `[${lane}] ${title}`;
}

/** Nodes that get an issue: every live lane brief, plus its contract as the parent. */
function syncTargets(spec: LoadedSpec, byId: Map<string, NodeRecord>): string[] {
  const out = new Set<string>();
  for (const node of spec.nodes) {
    if (asString(node.data["type"]) !== "contract") continue;
    const contractId = asString(node.data["id"]);
    if (contractId === undefined) continue;
    const briefs = liveBriefsForContract(spec, byId, contractId);
    if (briefs.size === 0) continue;
    out.add(contractId);
    for (const b of briefs) out.add(b);
  }
  return [...out].sort(compareStrings);
}

/**
 * CC-4(3) — an issue closes on FINAL EVIDENCE **or** on `superseded`/`rejected`.
 * The second half is load-bearing: a collapsed lane is SUPERSEDED, never evidenced,
 * so evidence alone would leave its issue open forever.
 */
function shouldClose(spec: LoadedSpec, byId: Map<string, NodeRecord>, nodeId: string, node: NodeRecord): boolean {
  const status = asString(node.data["status"]);
  if (status === "superseded" || status === "rejected") return true;
  const type = asString(node.data["type"]);
  if (type === "brief") return finalEvidenceForBrief(spec, byId, nodeId).size > 0;
  if (type === "contract") {
    const briefs = liveBriefsForContract(spec, byId, nodeId);
    if (briefs.size === 0) return false;
    return [...briefs].every((b) => finalEvidenceForBrief(spec, byId, b).size > 0);
  }
  return false;
}

/**
 * Decide what would change. Pure, total, deterministic; no clock and no network.
 */
export function planIssueSync(
  spec: LoadedSpec,
  existingIssues: readonly ExistingIssue[],
  opts: PlanOptions,
): IssueSyncPlan {
  // CC-5 — fail CLOSED on an incomplete listing, in the discipline of `gitdiff.ts`.
  // With a partial listing an absent issue is indistinguishable from an unlisted
  // one, and planning a create would duplicate it.
  if (!opts.listingComplete) {
    return {
      ...EMPTY_PLAN,
      refused: true,
      refusedReason: "issue listing did not complete; refusing to plan any mutation",
    };
  }

  const byId = nodesById(spec);
  const plan: IssueSyncPlan = { create: [], update: [], reopen: [], close: [], skipped: [], refused: false };

  // CC-4(1) — adopt only issues that carry the exact marker AND are authored by the
  // sync identity. Everything else is recorded as skipped, never adopted.
  const adopted = new Map<string, ExistingIssue>();
  for (const issue of [...existingIssues].sort((a, b) => a.number - b.number)) {
    const claimed = markedNodeId(issue.body);
    if (claimed === undefined) continue;
    if (issue.authorLogin !== opts.syncIdentity) {
      plan.skipped.push({
        nodeId: claimed,
        reason: `issue #${issue.number} carries the marker but was authored by ${issue.authorLogin}, not the sync identity ${opts.syncIdentity}`,
      });
      continue;
    }
    if (!adopted.has(claimed)) adopted.set(claimed, issue);
  }

  for (const nodeId of syncTargets(spec, byId)) {
    const node = byId.get(nodeId);
    if (node === undefined) continue;
    const title = projectTitle(node, nodeId);
    const body = projectBody(node, nodeId, opts.repo);
    const existing = adopted.get(nodeId);
    const close = shouldClose(spec, byId, nodeId, node);

    if (existing === undefined) {
      if (close) {
        plan.skipped.push({ nodeId, reason: "already complete and has no issue; nothing to open" });
        continue;
      }
      plan.create.push({ nodeId, title, body, reason: "no issue carries this node's marker" });
      continue;
    }

    const action: IssueAction = { nodeId, title, body, issueNumber: existing.number, reason: "" };
    if (close) {
      if (existing.state === "closed") {
        plan.skipped.push({ nodeId, reason: `issue #${existing.number} is already closed` });
      } else {
        plan.close.push({ ...action, reason: "the node is complete (final evidence) or superseded/rejected" });
      }
      continue;
    }
    if (existing.state === "closed") {
      // A hand-closed issue for still-open work is REOPENED — the graph is truth.
      plan.reopen.push({ ...action, reason: "the node is still open work but its issue was closed" });
      continue;
    }
    if (existing.title !== title || existing.body !== body) {
      plan.update.push({ ...action, reason: "the projected title or body drifted from the node" });
      continue;
    }
    // No-op re-run: identical projection, nothing planned.
    plan.skipped.push({ nodeId, reason: `issue #${existing.number} already matches the node` });
  }

  return plan;
}

export interface ApplyResult {
  planned: number;
  applied: number;
  failed: number;
}

export function countPlanned(plan: IssueSyncPlan): number {
  return plan.create.length + plan.update.length + plan.reopen.length + plan.close.length;
}

/** CC-6 — `gh` is invoked through `spawnSync` with an ARGV ARRAY and `shell: false`
 * (stated explicitly though it is the default), mirroring `gitdiff.ts`'s adapter. No
 * string interpolation ever reaches a shell. */
function gh(args: string[]): { ok: boolean; message: string } {
  const r = spawnSync("gh", args, { encoding: "utf8", shell: false });
  if (r.error) return { ok: false, message: r.error.message };
  if (r.status !== 0) return { ok: false, message: (r.stderr || r.stdout || "").trim() || `gh exited ${r.status}` };
  return { ok: true, message: (r.stdout || "").trim() };
}

/**
 * Apply a plan. DRY BY DEFAULT — `apply` must be passed explicitly. Best-effort by
 * design (contract Risk 5): a failure warns and is counted, never blocks, and the
 * graph stays truth.
 */
export function applyPlan(plan: IssueSyncPlan, opts: { repo: string; apply: boolean }): ApplyResult {
  const planned = countPlanned(plan);
  const result: ApplyResult = { planned, applied: 0, failed: 0 };
  if (plan.refused) {
    console.error(`spec:issue-sync: REFUSED — ${plan.refusedReason ?? "listing incomplete"}`);
    return result;
  }
  if (!opts.apply) {
    for (const a of plan.create) console.log(`would create: ${a.nodeId} — ${a.reason}`);
    for (const a of plan.update) console.log(`would update: #${a.issueNumber} ${a.nodeId} — ${a.reason}`);
    for (const a of plan.reopen) console.log(`would reopen: #${a.issueNumber} ${a.nodeId} — ${a.reason}`);
    for (const a of plan.close) console.log(`would close:  #${a.issueNumber} ${a.nodeId} — ${a.reason}`);
    return result;
  }

  const run = (args: string[], label: string): void => {
    const r = gh([...args, "--repo", opts.repo]);
    if (r.ok) result.applied += 1;
    else {
      result.failed += 1;
      console.error(`spec:issue-sync: ${label} failed — ${r.message}`);
    }
  };
  for (const a of plan.create) run(["issue", "create", "--title", a.title, "--body", a.body], `create ${a.nodeId}`);
  for (const a of plan.update)
    run(["issue", "edit", String(a.issueNumber), "--title", a.title, "--body", a.body], `update ${a.nodeId}`);
  for (const a of plan.reopen) run(["issue", "reopen", String(a.issueNumber)], `reopen ${a.nodeId}`);
  for (const a of plan.close) run(["issue", "close", String(a.issueNumber)], `close ${a.nodeId}`);
  return result;
}

/** CC-5 — the durable per-run record, in the shape of `spec.ts`'s validate line. */
export function formatRunReport(plan: IssueSyncPlan, r: ApplyResult): string {
  return `spec:issue-sync: ${r.planned} planned, ${r.applied} applied, ${r.failed} failed (${plan.skipped.length} skipped)`;
}

function listIssues(repo: string): { issues: ExistingIssue[]; complete: boolean } {
  const r = gh(["issue", "list", "--repo", repo, "--state", "all", "--limit", "1000", "--json", "number,title,body,state,author"]);
  if (!r.ok) return { issues: [], complete: false };
  try {
    const raw: unknown = JSON.parse(r.message);
    if (!Array.isArray(raw)) return { issues: [], complete: false };
    const issues = raw.map((x) => {
      const o = x as Record<string, unknown>;
      const author = (o["author"] ?? {}) as Record<string, unknown>;
      return {
        number: typeof o["number"] === "number" ? o["number"] : -1,
        title: asString(o["title"]) ?? "",
        body: asString(o["body"]) ?? "",
        state: asString(o["state"])?.toLowerCase() === "closed" ? ("closed" as const) : ("open" as const),
        authorLogin: asString(author["login"]) ?? "",
      };
    });
    // A full page back means the listing may have been truncated — fail closed.
    return { issues, complete: issues.length < 1000 };
  } catch {
    return { issues: [], complete: false };
  }
}

function main(): number {
  const apply = process.argv.includes("--apply");
  const repoArg = process.argv.indexOf("--repo");
  const repo = repoArg >= 0 ? (process.argv[repoArg + 1] ?? "") : (process.env["GITHUB_REPOSITORY"] ?? "");
  if (repo === "") {
    console.error("spec:issue-sync: --repo <owner/name> is required (or set GITHUB_REPOSITORY)");
    return 2;
  }
  const identityArg = process.argv.indexOf("--identity");
  const syncIdentity = identityArg >= 0 ? (process.argv[identityArg + 1] ?? "") : "github-actions[bot]";

  const spec = loadSpec();
  const { issues, complete } = apply ? listIssues(repo) : { issues: [], complete: true };
  const plan = planIssueSync(spec, issues, { listingComplete: complete, syncIdentity, repo });
  const result = applyPlan(plan, { repo, apply });
  console.log(formatRunReport(plan, result));
  // Best-effort by design: never block the caller on a sync failure.
  return 0;
}

// Guarded CLI entry: nothing runs on import, so the pure seam stays unit-testable.
// Deliberately NOT `spec.ts`'s unguarded top-level `process.exit(main())`.
const invokedDirectly = (() => {
  try {
    return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
  } catch {
    return false;
  }
})();

if (invokedDirectly) process.exit(main());
