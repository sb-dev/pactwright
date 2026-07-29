import { asString, compareStrings, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import {
  briefsCoveredByIntegration,
  briefsForPatch,
  comparedCompetitors,
  competingPatches,
  finalEvidenceForBrief,
  liveBriefsForContract,
  liveCompetitors,
  liveProposingContracts,
  patchMarketResolved,
} from "./handlers/coverage_traversal.ts";

/**
 * The conveyor: ONE pure next-step resolver, the sole producer of routing truth.
 * `spec:status`, `trails.md`, `status.md` and every command's closing NEXT block are
 * one call to `nextSteps` — there are not three producers, so they cannot diverge.
 *
 * Three properties are load-bearing and every edit must preserve them:
 *
 *  - PURE. No I/O, no `Date`, no `process.env`, no `spawnSync`. This module is
 *    imported by `indexer.ts`'s view serializers, which run inside
 *    `handlers/indexes_fresh.ts` on EVERY `spec:validate` — a throw or a clock byte
 *    here escapes through `spec.ts`'s fail-closed channel and reds every PR (CC-8).
 *  - TOTAL. Every derivation is total over any LOADABLE graph. An unknown `type`, an
 *    absent `status`, a dangling edge, a cycle or a class outside 0-3 yields an
 *    explicit "no derivable next step, and why" entry — never an exception.
 *  - NEVER EMPTY. `nextSteps` always returns at least one `Step` (contract Risk 1).
 *    A missing edge yields a MISSING step, not a wrong one — the weaker failure mode.
 *
 * Judgement is the structural boundary, and it is honest: whether a lane deserves a
 * patch market, which candidate a human should select, and what an amendment note
 * says are not functions of graph state. Those enter as `template` args or through a
 * marker a command's judgement authored — so "derived" describes the IDs, not the
 * choice to act.
 */

/** `paste` = every argument is a resolved id, safe to run as printed. `template` =
 * one argument no graph state can fill (a note, a rationale, a lane list). `action` =
 * a PR action or a judgement reminder — never a paste-able command line. */
export type StepKind = "paste" | "template" | "action";

export interface Step {
  /** The slash command without its leading slash, or a stable token for an `action`. */
  command: string;
  args: string[];
  /** The exact line to print. For `paste`/`template`, `/command args…`. */
  rendered: string;
  kind: StepKind;
  /** The edge or field that turned this routing on — the "why" behind the step. */
  why: string;
}

/** Lifecycle position of a node, shared by both views and `spec:status`. */
export type Stage =
  | "intent-open"
  | "intent-proposed"
  | "intent-compared"
  | "intent-selected"
  | "intent-addressed"
  | "intent-rejected"
  | "contract-candidate"
  | "contract-approved"
  | "contract-decomposed"
  | "contract-rejected"
  | "contract-superseded"
  | "brief-open"
  | "brief-market"
  | "brief-implemented"
  | "brief-evidenced"
  | "patch-candidate"
  | "patch-selected"
  | "patch-superseded"
  | "evidence-draft"
  | "evidence-final"
  | "integration-draft"
  | "integration-final"
  | "record"
  | "unknown";

/**
 * A12 — the work-class routing table, pinned byte-equal to `CLAUDE.md`'s
 * `## Work-class routing` table rows. This is the SECOND and LAST copy in the repo:
 * the CLAUDE.md table and this literal, never a third. The pin test lives in
 * `test-verification`; this module's obligation is to export the literal and both
 * derivations as named, side-effect-free values so that test reinvents nothing.
 *
 * The literal is preferred over reading CLAUDE.md at run time because (a) CC-8
 * requires the view derivation be TOTAL, and parsing a prose markdown table at run
 * time is a partiality source that would throw inside `indexes_fresh` and red every
 * PR from a docs edit; (b) it would make `tools/**` depend at run time on an
 * unvalidated governing document no rule reads; (c) it would make this module
 * build-order dependent on the `docs-spec` lane. The cost — a machine-checked second
 * copy — is accepted and recorded, not argued away.
 */
export interface ClassRouting {
  change: string;
  proposalMarket: string;
  critics: string;
  lanes: string;
  patchMarket: string;
  humanGates: string;
}

export const CONVEYOR_CLASS_ROUTING: Readonly<Record<0 | 1 | 2 | 3, ClassRouting>> = {
  0: {
    change: "Trivial mechanical (typo, dependency bump, comment)",
    proposalMarket: "skipped — one contract, one brief",
    critics: "spec-critic only",
    lanes: "none",
    patchMarket: "none",
    humanGates: "none",
  },
  1: {
    change: "Simple low-risk change on a single surface",
    proposalMarket: "one candidate + one brief permitted",
    critics: "spec-critic only",
    lanes: "none",
    patchMarket: "none",
    humanGates: "none",
  },
  2: {
    change: "Meaningful product or technical change",
    proposalMarket: "required (≥2 candidates)",
    critics: "specialist critics where the change touches their surface",
    lanes: "optional",
    patchMarket: "optional per brief",
    humanGates: "none beyond selection",
  },
  3: {
    change:
      "High-risk or ambiguous; anything touching security, privacy, compliance, payments, or production-sensitive paths; or any multi-surface change",
    proposalMarket: "required (≥2 candidates)",
    critics: "full specialist critic panel",
    lanes: "required",
    patchMarket: "available per lane",
    humanGates: "explicit, at contract selection AND at integration",
  },
};

function routingFor(cls: number | undefined): ClassRouting | undefined {
  if (cls === 0 || cls === 1 || cls === 2 || cls === 3) return CONVEYOR_CLASS_ROUTING[cls];
  return undefined;
}

/** Does this class REQUIRE a proposal market (>=2 candidates)? Derived from the
 * pinned `Proposal market` cell rather than hand-written, so no routing boolean
 * escapes the pin. Total: a string predicate, never a throw. An unknown class is
 * treated as NOT requiring a market — the resolver then emits a template step and
 * the class-range rule owns the malformed class. */
export function marketRequired(cls: number | undefined): boolean {
  return routingFor(cls)?.proposalMarket.startsWith("required") ?? false;
}

/** Does this class REQUIRE lane decomposition? Derived from the pinned `Lanes` cell
 * for the same reason as `marketRequired`. Total. */
export function lanesRequired(cls: number | undefined): boolean {
  return routingFor(cls)?.lanes === "required";
}

/**
 * CC-6 — the node-id shape the resolver refuses to render.
 *
 * HONEST BOUND, recorded: the id convention is a COMMENT in `node-types.yaml` with
 * no validation rule behind it. This is a tool-side refusal at the egress points
 * (a printed `Step.rendered` line and a `gh` argument), NOT a graph invariant. The
 * rule belongs to Phase 10 Step 0.
 */
export const NODE_ID_PATTERN = /^[a-z]+-[a-z0-9-]+-[0-9a-f]{4}$/;

export function isRenderableId(id: string): boolean {
  return NODE_ID_PATTERN.test(id);
}

function asClass(node: NodeRecord): number | undefined {
  const raw = node.data["class"];
  return typeof raw === "number" && Number.isInteger(raw) ? raw : undefined;
}

function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort(compareStrings);
}

/** Ids that are the TARGET of a `supersedes` edge — retired records. */
function supersededIds(spec: LoadedSpec): Set<string> {
  const out = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== "supersedes") continue;
    const t = asString(e["target"]);
    if (t !== undefined) out.add(t);
  }
  return out;
}

/** Distinct source ids of `edgeType` edges pointing at `targetId`, status-blind and
 * without resolution — used for existence questions ("is there a selects edge?"). */
function rawSourcesOf(spec: LoadedSpec, edgeType: string, targetId: string): Set<string> {
  const out = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== edgeType) continue;
    if (asString(e["target"]) !== targetId) continue;
    const s = asString(e["source"]);
    if (s !== undefined) out.add(s);
  }
  return out;
}

/** Distinct target ids of `edgeType` edges leaving `sourceId`. */
function rawTargetsOf(spec: LoadedSpec, edgeType: string, sourceId: string): Set<string> {
  const out = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== edgeType) continue;
    if (asString(e["source"]) !== sourceId) continue;
    const t = asString(e["target"]);
    if (t !== undefined) out.add(t);
  }
  return out;
}

/** Contract ids of an intent that a `comparison` node `compares`. The contract-side
 * analogue of `comparedCompetitors` (which is patch-side). */
function comparedContracts(spec: LoadedSpec, byId: Map<string, NodeRecord>, candidateIds: Set<string>): Set<string> {
  const covered = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== "compares") continue;
    const sId = asString(e["source"]);
    const source = sId !== undefined ? byId.get(sId) : undefined;
    if (source === undefined || asString(source.data["type"]) !== "comparison") continue;
    const t = asString(e["target"]);
    if (t !== undefined && candidateIds.has(t)) covered.add(t);
  }
  return covered;
}

/**
 * CC-13's "live intent" predicate: `status` is `open` AND the intent is not the
 * target of a `supersedes` edge. The CANONICAL definition lives in
 * `specs/schema/node-types.yaml` (data-migration lane) and `CLAUDE.md` (docs-spec
 * lane); this predicate must agree with it in meaning, and a disagreement is an
 * integration finding rather than a unilateral code fix here.
 *
 * The edge clause is load-bearing because `intent` declares no `superseded` status
 * value — a superseded intent lands at its terminal value (`rejected`), so the
 * status clause alone covers only a COMPLETED supersession; the edge clause covers
 * the window before that flip, which is what lets a parked intent print nothing.
 */
export function liveIntents(spec: LoadedSpec): NodeRecord[] {
  const retired = supersededIds(spec);
  const out: NodeRecord[] = [];
  for (const node of spec.nodes) {
    if (asString(node.data["type"]) !== "intent") continue;
    if (asString(node.data["status"]) !== "open") continue;
    const id = asString(node.data["id"]);
    if (id === undefined || retired.has(id)) continue;
    out.push(node);
  }
  return out.sort((a, b) => compareStrings(asString(a.data["id"]) ?? "", asString(b.data["id"]) ?? ""));
}

function step(command: string, args: string[], kind: StepKind, why: string): Step {
  const rendered = args.length > 0 ? `/${command} ${args.join(" ")}` : `/${command}`;
  return { command, args, rendered, kind, why };
}

function action(command: string, rendered: string, why: string): Step {
  return { command, args: [], rendered, kind: "action", why };
}

/** The Risk-1 floor: an explicit "no derivable next step, and why" entry. */
function noStep(why: string): Step {
  return action("none", `no derivable next step — ${why}`, why);
}

/** A paste step whose ids are all renderable, or an explicit refusal naming the
 * malformed id (CC-6). Never emits an unvalidated id into a printed line. */
function pasteStep(command: string, ids: string[], why: string): Step {
  const bad = ids.find((id) => !isRenderableId(id));
  if (bad !== undefined) {
    return noStep(`node id ${JSON.stringify(bad)} does not match the id convention, so it is not rendered`);
  }
  return step(command, ids, "paste", why);
}

/** The lifecycle stage of a node — total, and `unknown` rather than a throw. */
export function deriveStage(spec: LoadedSpec, nodeId: string): Stage {
  const byId = nodesById(spec);
  const node = byId.get(nodeId);
  if (node === undefined) return "unknown";
  const type = asString(node.data["type"]);
  const status = asString(node.data["status"]);
  const retired = supersededIds(spec);

  if (type === "intent") {
    if (status === "addressed") return "intent-addressed";
    if (status === "rejected") return "intent-rejected";
    if (status !== "open") return "unknown";
    const candidates = liveProposingContracts(spec, byId, nodeId);
    if (candidates.size === 0) return "intent-open";
    const selected = [...candidates].some((c) => rawSourcesOf(spec, "selects", c).size > 0);
    if (selected) return "intent-selected";
    if (comparedContracts(spec, byId, candidates).size > 0) return "intent-compared";
    return "intent-proposed";
  }

  if (type === "contract") {
    if (status === "rejected") return "contract-rejected";
    if (status === "superseded") return "contract-superseded";
    if (status !== "approved") return "contract-candidate";
    return liveBriefsForContract(spec, byId, nodeId).size > 0 ? "contract-decomposed" : "contract-approved";
  }

  if (type === "brief") {
    if (finalEvidenceForBrief(spec, byId, nodeId).size > 0) return "brief-evidenced";
    if (status === "implemented") return "brief-implemented";
    if (competingPatches(spec, byId, nodeId).size > 0 || node.data["patch_market"] === true) return "brief-market";
    return "brief-open";
  }

  if (type === "patch") {
    if (status === "superseded" || retired.has(nodeId)) return "patch-superseded";
    return status === "selected" ? "patch-selected" : "patch-candidate";
  }

  if (type === "evidence") return status === "final" ? "evidence-final" : "evidence-draft";
  if (type === "integration") return status === "final" ? "integration-final" : "integration-draft";
  if (type === "decision" || type === "comparison" || type === "override" || type === "capability") return "record";
  if (type === "drift-finding") return "record";
  return "unknown";
}

/** The contract a brief `decomposes`, if exactly one resolves. */
function contractForBrief(spec: LoadedSpec, byId: Map<string, NodeRecord>, briefId: string): string | undefined {
  const contracts = [...rawTargetsOf(spec, "decomposes", briefId)].filter((c) => byId.get(c) !== undefined);
  return contracts.length === 1 ? contracts[0] : undefined;
}

function intentSteps(spec: LoadedSpec, byId: Map<string, NodeRecord>, node: NodeRecord, id: string): Step[] {
  const status = asString(node.data["status"]);
  if (status !== "open") {
    return [noStep(`intent ${id} is ${status ?? "status-less"}, not open`)];
  }
  const cls = asClass(node);
  const candidates = liveProposingContracts(spec, byId, id);

  // 2.1 — open, no candidates.
  if (candidates.size === 0) {
    return [pasteStep("propose-contracts", [id], "intent is open with no live `proposes` candidate")];
  }

  const selected = sortedIds(candidates).filter((c) => rawSourcesOf(spec, "selects", c).size > 0);
  if (selected.length > 0) {
    // The market is resolved; route through the winning contract.
    return selected.flatMap((c) => nextSteps(spec, c));
  }

  const compared = comparedContracts(spec, byId, candidates);

  // 2.3 — a comparison covers the candidates but nothing is selected yet.
  if (compared.size > 0) {
    return sortedIds(candidates).map((c) =>
      isRenderableId(c)
        ? {
            command: "approve-contract",
            args: [c, "'<amendments>'"],
            rendered: `/approve-contract ${c} '<amendments>'`,
            kind: "template" as const,
            why: "a comparison covers the live candidates and no `selects` decision exists yet",
          }
        : noStep(`candidate id ${JSON.stringify(c)} does not match the id convention, so it is not rendered`),
    );
  }

  // 2.2 — live candidates, no comparison yet: class decides.
  if (marketRequired(cls)) {
    return [
      pasteStep(
        "review-contracts",
        [id],
        `class ${cls} requires a proposal market (${routingFor(cls)?.proposalMarket ?? "unknown"}); no comparison covers the candidates yet`,
      ),
    ];
  }
  return sortedIds(candidates).map((c) =>
    isRenderableId(c)
      ? {
          command: "approve-contract",
          args: [c, '"<notes>"'],
          rendered: `/approve-contract ${c} "<notes>"`,
          kind: "template" as const,
          why: `class ${cls ?? "unknown"} does not require a market (${routingFor(cls)?.proposalMarket ?? "unknown class"})`,
        }
      : noStep(`candidate id ${JSON.stringify(c)} does not match the id convention, so it is not rendered`),
  );
}

function contractSteps(spec: LoadedSpec, byId: Map<string, NodeRecord>, node: NodeRecord, id: string): Step[] {
  const status = asString(node.data["status"]);
  if (status !== "approved") {
    return [noStep(`contract ${id} is ${status ?? "status-less"}; only an approved contract is decomposed`)];
  }
  const briefs = liveBriefsForContract(spec, byId, id);

  // 2.4 — approved, no brief.
  if (briefs.size === 0) {
    const cls = asClass(node);
    if (lanesRequired(cls)) {
      return [
        {
          command: "decompose-lanes",
          args: [id, "'<lanes>'"],
          rendered: `/decompose-lanes ${id} '<lanes>'`,
          kind: "template",
          why: `class ${cls} requires lanes (${routingFor(cls)?.lanes ?? "unknown"})`,
        },
      ];
    }
    return [
      pasteStep("write-brief", [id], `class ${cls ?? "unknown"} does not require lanes; a single unlaned brief fits`),
      {
        command: "decompose-lanes",
        args: [id, "'<lanes>'"],
        rendered: `/decompose-lanes ${id} '<lanes>'`,
        kind: "template",
        why: `alternative: class ${cls ?? "unknown"} permits lanes (${routingFor(cls)?.lanes ?? "unknown"})`,
      },
    ];
  }

  // Decomposed: route to each live brief that is not yet finally evidenced, then to
  // integration when every lane is covered (A5 — terminality is computed here).
  return contractCoverageSteps(spec, byId, id, briefs);
}

function contractCoverageSteps(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  contractId: string,
  briefs: Set<string>,
): Step[] {
  const outstanding = sortedIds(briefs).filter((b) => finalEvidenceForBrief(spec, byId, b).size === 0);
  if (outstanding.length > 0) {
    return outstanding.flatMap((b) => briefSteps(spec, byId, byId.get(b), b));
  }
  // Every live brief carries final evidence.
  if (briefs.size === 1) {
    return [
      action(
        "pr",
        "open or update the PR for this change — the single brief is finally evidenced",
        "single-brief contract: completed by its lone final evidence, no integration node (coverage-coherence)",
      ),
    ];
  }
  const integration = liveIntegrationsForContract(spec, byId, briefs);
  const finalInts = integration.filter((i) => asString(i.node.data["status"]) === "final" && i.covers.size === briefs.size);
  if (finalInts.length > 0) {
    return [
      action(
        "pr",
        "open or update the PR for this change — every lane is integrated",
        `final integration ${finalInts[0].id} covers all ${briefs.size} live lanes`,
      ),
    ];
  }
  return [
    pasteStep(
      "integrate",
      [contractId],
      `all ${briefs.size} live lanes carry final evidence; the contract completes only via a final integration`,
    ),
  ];
}

function liveIntegrationsForContract(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  briefs: Set<string>,
): { id: string; node: NodeRecord; covers: Set<string> }[] {
  const retired = supersededIds(spec);
  const out: { id: string; node: NodeRecord; covers: Set<string> }[] = [];
  for (const node of spec.nodes) {
    if (asString(node.data["type"]) !== "integration") continue;
    const id = asString(node.data["id"]);
    if (id === undefined || retired.has(id)) continue;
    const covers = new Set<string>();
    for (const b of briefsCoveredByIntegration(spec, byId, id)) if (briefs.has(b)) covers.add(b);
    if (covers.size === 0) continue;
    out.push({ id, node, covers });
  }
  return out.sort((a, b) => compareStrings(a.id, b.id));
}

function briefSteps(
  spec: LoadedSpec,
  byId: Map<string, NodeRecord>,
  node: NodeRecord | undefined,
  id: string,
): Step[] {
  if (node === undefined) return [noStep(`brief ${id} does not resolve to a node`)];
  const status = asString(node.data["status"]);
  const lane = asString(node.data["lane"]);

  // A7 (resolver half) — implementation now writes one graph state change, and the
  // resolver keys on it. This is what closes the loop where `/implement-brief`
  // reprinted itself. Until `api-integration` ships the flip, this rule is
  // unreachable in practice — a sequencing fact, not a reason to omit the rule.
  if (status === "implemented") {
    return [pasteStep("prepare-evidence", [id], "brief is `implemented`; evidence is the next lifecycle record")];
  }

  const competitors = competingPatches(spec, byId, id);
  const marketOpen = competitors.size > 0 || node.data["patch_market"] === true;

  if (marketOpen) {
    // 2.7 — a covering comparison exists and nothing is selected: enumerate, never rank.
    const live = liveCompetitors(spec, byId, id);
    const covered = comparedCompetitors(spec, byId, id);
    if (!patchMarketResolved(spec, byId, id) && covered.size >= 2 && [...live].every((p) => covered.has(p))) {
      return sortedIds(live).map((p) =>
        isRenderableId(p)
          ? {
              command: "select-patch",
              args: [p, '"<rationale>"'],
              rendered: `/select-patch ${p} "<rationale>"`,
              kind: "template" as const,
              why: "a comparison covers every live competitor and no `selects` decision exists yet",
            }
          : noStep(`patch id ${JSON.stringify(p)} does not match the id convention, so it is not rendered`),
      );
    }
    // 2.6 — market open, no covering comparison.
    if (!patchMarketResolved(spec, byId, id)) {
      return [
        pasteStep("compare-patches", [id], `${competitors.size} patch(es) compete for this brief and no comparison covers them`),
        {
          command: "synthesize-patches",
          args: [id, '"<patch-ids>"', '"<instruction>"'],
          rendered: `/synthesize-patches ${id} "<patch-ids>" "<instruction>"`,
          kind: "template",
          why: "optional: competing patches within one lane may be combined into a synthesis candidate",
        },
      ];
    }
  }

  // 2.5 — no market (or a resolved one): implement, or write tests for the
  // verification lane.
  const steps: Step[] = [];
  if (lane === "test-verification") {
    steps.push(
      pasteStep("write-tests", [id], "brief carries `lane: test-verification`; its tests are written by test-writer"),
    );
  } else {
    steps.push(pasteStep("implement-brief", [id], `brief is \`${status ?? "status-less"}\` and carries no open patch market`));
  }

  // 2.5(c) / A8 — the resolver TRANSCRIBES the `## Strategy tension` marker; it never
  // infers tension. When a class->=2 brief carries no marker, emit a judgement
  // reminder naming the absence, never a paste-able /propose-patches line.
  const cls = contractClassForBrief(spec, byId, id);
  if (/^##\s+Strategy tension\s*$/m.test(node.body)) {
    steps.push({
      command: "propose-patches",
      args: [id, "<n>", '"<strategies>"'],
      rendered: `/propose-patches ${id} <n> "<strategies>"`,
      kind: "template",
      why: "the brief body carries a `## Strategy tension` section written by /decompose-lanes",
    });
  } else if (cls !== undefined && cls >= 2) {
    steps.push(
      action(
        "judgement",
        "consider whether this lane deserves a patch market — the brief carries no `## Strategy tension` section",
        `class ${cls} permits a patch market (${routingFor(cls)?.patchMarket ?? "unknown"}); no marker is recorded, and the resolver never infers tension`,
      ),
    );
  }
  return steps;
}

function contractClassForBrief(spec: LoadedSpec, byId: Map<string, NodeRecord>, briefId: string): number | undefined {
  const contractId = contractForBrief(spec, byId, briefId);
  if (contractId === undefined) return undefined;
  const contract = byId.get(contractId);
  return contract === undefined ? undefined : asClass(contract);
}

function patchSteps(spec: LoadedSpec, byId: Map<string, NodeRecord>, node: NodeRecord, id: string): Step[] {
  const status = asString(node.data["status"]);
  if (status !== "selected") {
    return [noStep(`patch ${id} is \`${status ?? "status-less"}\`; only a selected patch routes onward`)];
  }
  // 2.8 — THE INTENT'S NAMED TYPE-WRONG HOP. Resolved to a BRIEF ID through the
  // patch's `competes-for` edge — never a branch name.
  const briefs = sortedIds(briefsForPatch(spec, byId, id));
  if (briefs.length === 0) {
    return [noStep(`patch ${id} has no resolvable \`competes-for\` brief, so its brief id cannot be derived`)];
  }
  return briefs.map((b) => pasteStep("prepare-evidence", [b], `selected patch ${id} \`competes-for\` brief ${b}`));
}

function evidenceSteps(spec: LoadedSpec, byId: Map<string, NodeRecord>, node: NodeRecord, id: string): Step[] {
  if (asString(node.data["status"]) !== "final") {
    return [noStep(`evidence ${id} is a draft; finalise it before it covers a brief`)];
  }
  // 2.9 — route through the brief's contract so terminality is computed from the
  // live lane set (A5), never declared per command.
  const briefs = sortedIds(rawTargetsOf(spec, "evidences", id)).filter((b) => byId.get(b) !== undefined);
  for (const b of briefs) {
    const contractId = contractForBrief(spec, byId, b);
    if (contractId === undefined) continue;
    return contractCoverageSteps(spec, byId, contractId, liveBriefsForContract(spec, byId, contractId));
  }
  return [noStep(`evidence ${id} does not resolve to a brief with exactly one contract`)];
}

function integrationSteps(spec: LoadedSpec, byId: Map<string, NodeRecord>, node: NodeRecord, id: string): Step[] {
  if (asString(node.data["status"]) === "final") {
    return [action("pr", "open or update the PR for this change — the integration is final", `integration ${id} is final`)];
  }
  // A draft integration routes to the blocking lane's own next step.
  const covered = briefsCoveredByIntegration(spec, byId, id);
  for (const b of sortedIds(covered)) {
    const contractId = contractForBrief(spec, byId, b);
    if (contractId === undefined) continue;
    const briefs = liveBriefsForContract(spec, byId, contractId);
    const blocking = sortedIds(briefs).filter((x) => finalEvidenceForBrief(spec, byId, x).size === 0);
    if (blocking.length > 0) return blocking.flatMap((x) => briefSteps(spec, byId, byId.get(x), x));
    return contractCoverageSteps(spec, byId, contractId, briefs);
  }
  return [noStep(`draft integration ${id} does not resolve to a covered brief`)];
}

/**
 * The ordered next steps for a node. Pure, total, deterministic, and never empty.
 */
export function nextSteps(spec: LoadedSpec, nodeId: string): Step[] {
  const byId = nodesById(spec);
  const node = byId.get(nodeId);
  if (node === undefined) {
    return [noStep(`no node in the graph has id ${JSON.stringify(nodeId)}`)];
  }
  const type = asString(node.data["type"]);
  let steps: Step[];
  switch (type) {
    case "intent":
      steps = intentSteps(spec, byId, node, nodeId);
      break;
    case "contract":
      steps = contractSteps(spec, byId, node, nodeId);
      break;
    case "brief":
      steps = briefSteps(spec, byId, node, nodeId);
      break;
    case "patch":
      steps = patchSteps(spec, byId, node, nodeId);
      break;
    case "evidence":
      steps = evidenceSteps(spec, byId, node, nodeId);
      break;
    case "integration":
      steps = integrationSteps(spec, byId, node, nodeId);
      break;
    case undefined:
      steps = [noStep(`node ${nodeId} declares no \`type\``)];
      break;
    default:
      steps = [noStep(`\`${type}\` is a record type with no lifecycle step of its own`)];
  }
  // Risk 1's floor: never an empty list.
  return steps.length > 0 ? steps : [noStep(`no routing rule matched node ${nodeId}`)];
}
