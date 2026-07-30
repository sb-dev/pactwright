---
id: brief-conveyor-resolver-3f7a
type: brief
title: Conveyor resolver and tooling — nextSteps/deriveStage/CONVEYOR_CLASS_ROUTING, spec:status, the trails+status views, the planIssueSync seam, and the A11 traversal consolidation
status: implemented
created: 2026-07-28
lane: domain-backend
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
`domain-backend` lane of `intent-self-guiding-delivery-loop-6d79` (status: open, class 3), per
decision `decision-conveyor-derived-5a91`. This lane owns `tools/**` and `package.json` — Scope
items 1-5: the pure next-step resolver `tools/conveyor.ts`, the `spec:status` read-only branch, the
`INDEX_FILES` widening that puts `trails.md` and `status.md` under `indexes-fresh`, the pure
`planIssueSync` seam in `tools/issue_sync.ts`, the A11 consolidation of the two private coverage
walks, and the CC-10(c) drift-packet extension. **Every other surface belongs to another lane** —
the schema and all graph data to `data-migration`, the fifteen command files to `api-integration`,
the workflows and CODEOWNERS to `observability-release`, the lane catalog / agents / `.gitignore` to
`product-spec`, `CLAUDE.md` and the root docs to `docs-spec`, and every line of test code to
`test-verification`. **BOOTSTRAP — read this before looking for an `owner` key.** This decomposition
predates the lane market the contract builds: `.claude/lanes/` does not exist (confirmed absent on
disk), `owner` is not in `specs/schema/node-types.yaml`, and none of the seven implementer agents
(`product-spec-writer`, `backend-implementer`, `ui-implementer`, `migration-implementer`,
`api-implementer`, `ops-implementer`, `docs-implementer`) exists in `.claude/agents/`. So **no brief
in this decomposition carries an `owner`**, and lane owners are assigned by `/decompose-lanes` only
after this change lands — the market cannot decompose itself. The effective contract is
`contract-conveyor-derived-4c8c` **plus** the sixteen amendments A1-A16 in
`decision-conveyor-derived-5a91` **plus** the sixteen common-core findings CC-1-CC-16 under
`## Common-core findings` in `comparison-conveyor-market-890e`, binding in full — that comparison's
text is the binding text, and nothing paraphrased here replaces it.

## Grounding (reuse, don't reinvent)

All paths are absolute under `/home/samir/workspace/pactwright/`. Every line number below was
re-confirmed on disk on 2026-07-28 while drafting this brief; **re-confirm each before editing,
since earlier edits in the same file shift them.**

- **`tools/handlers/coverage_traversal.ts` — eight walks already exported. Import them; do not
  re-derive any of them.** `liveSourcesByEdge` (`:25-51`, the parameterised live-sources walk with
  its `excludeStatus` default of `"superseded"`), `liveProposingContracts` (`:54-60`),
  `intentsForContract` (`:67-76`, deduped via a `Set`, no `byId` parameter),
  **`briefsForPatch` (`:91-104`)** — the `competes-for` walk from a patch to its brief, which **is**
  the `/select-patch` → `/prepare-evidence` hop the contract's Behaviour 2.8 and Acceptance 2 name;
  `competingPatches` (`:111-120`, deliberately status-blind via an EMPTY exclude list, never
  `undefined`, because `undefined` triggers the `"superseded"` default), `liveCompetitors`
  (`:125-131`, excludes `superseded` **and** `selected`), `comparedCompetitors` (`:135-151`) and
  `patchMarketResolved` (`:161-182`, the exact clean condition the `selected-patch-comparison` rule
  reds on). The module header (`:3-19`) states the shared contract these walks honour: skip an
  endpoint that does not resolve, skip a `superseded` source, count DISTINCT sources.
- **`tools/handlers/coverage_coherence.ts` — the two private closures A11 lifts.**
  `finalEvidenceForBrief` at **`:68-81`** (sources of `evidences` edges targeting the brief, kept
  only when the source node's `status` is exactly `"final"`) and `briefsCoveredByIntegration` at
  **`:85-102`** (the two-hop walk integration —`integrates`→ evidence —`evidences`→ brief, with a
  `final` filter on the middle node). The handler also shows the coverage verdict the resolver must
  agree with rather than re-invent: the live-brief set at `:119`
  (`liveSourcesByEdge(spec, byId, "decomposes", contractId)`), the integration-count invariants at
  `:136-150`, and the single-brief vs multi-brief coverage split at `:155-176`.
- **`tools/handlers/comparison_required.ts:38-59` — a THIRD private closure (`coveredSet`).** It is
  named here so nobody lifts it opportunistically: **A11 does not cover it**, and moving it is not
  this lane's work. If the implementer believes it must move, that is scope-integrity rule 5 (a
  follow-up intent), not a silent widening.
- **`tools/spec.ts` — the dispatch this lane extends.** `USAGE` at **`:9-25`**; its line **`:11`**
  currently reads `  index       regenerate the four files under specs/indexes/` — the stale literal
  CC-14 requires be rendered from `INDEX_FILES.length`. `SUBCOMMANDS` at **`:27`** is today
  `["index", "validate", "gate", "check-diff", "patch-gate", "drift-map"]`. `main()` at `:29-87`
  loads once at `:36` and falls through to the validate branch at `:78-86` — whose
  `${findings.length} error(s) across ${spec.rules.length} rules` line at `:82` is the
  planned/applied/failed reporting shape CC-5 cites. The fail-closed `spec: <message>` channel is
  `:89-98` (`process.exit(main())` inside a `try`/`catch`), and it is what Behaviour 5's "a load
  failure exits through the fail-closed `spec:` error channel" refers to — it already covers
  `status`, because `loadSpec()` runs before any branch.
- **`tools/indexer.ts` — the widening and its trap.** `Indexes` at `:28-33`; **`INDEX_FILES` at
  `:35`** (four entries, `as const`) with `IndexFileName` derived from it at `:36`; `buildIndexes`
  at `:43-97`; **`serializeIndexes` at `:99-108`** and `writeIndexes` at `:110-121`.
- **`tools/handlers/indexes_fresh.ts:12-33`** — regenerates via `serializeIndexes` and byte-compares
  every `INDEX_FILES` entry against the committed file. This is CC-8's critical path: it runs on
  every `spec:validate`.
- **`tools/loader.ts`** — `LoadedSpec` at `:35-56` (note `checks`, `sensitivePaths`,
  `comparisonRequiredFrom`, `coverageCoherenceFrom`), `asString` at `:159-161`, **`compareStrings`
  at `:169-171`** (the toolchain's single ordering primitive, documented there as "the precondition
  for byte-identical, deterministic files" — every view sort must use it), `capabilityPaths` at
  `:175-178`, `nodesById` at `:181-188`.
- **`tools/gitdiff.ts:14-21`** — the `git()` helper: `spawnSync("git", args, { encoding: "utf8" })`,
  an argv array, no shell, throwing on `r.error` and on a null status. This is the exact adapter
  shape CC-6 requires for `gh`; copy it rather than inventing one, and note the module header
  (`:5-12`) stating every helper fails CLOSED.
- **`tools/gate.ts:42`** — `toDateString`, the shared date normaliser. `tools/patch_gate.ts:1-27` is
  the module shape to mirror: a pure, unit-testable `evaluate*` seam over a thin `run*` adapter,
  plus a single exported literal (`PATCH_COMPARISON_CHECK`, `:27`) whose comment names every other
  place the same literal must stay byte-equal.
- **`tools/driftmap.ts`** — `DriftPacket` at `:20-33`; **`priorEvidence` at `:30` is typed
  `{ id: string; title: string }[]`**, the existing precedent for a reference to a node whose
  `status` is not meaningful (a `decision` has no `status` at all — `node-types.yaml:40-44`), so
  CC-10(c)'s new field mirrors `priorEvidence`, not `NodeRef` (`:14-18`, whose `ref()` at `:49-52`
  would emit `status: ""`). Reuse `uniqSorted` (`:41-43`), `sourcesOf` (`:54-62`) and `targetsOf`
  (`:64-72`); the existing capability walk is `:88-92` and the packet sort is `:106`.
- **`package.json:5-15`** — the `scripts` block; every `spec:*` script is `tsx tools/spec.ts <sub>`.
- **`CLAUDE.md`** — `## Work-class routing` at `:81`; the work-class table's header row at `:89`,
  separator at `:90`, and the four class rows at **`:91-94`** (seven columns: `Class`, `Change`,
  `Proposal market`, `Critics`, `Lanes`, `Patch market`, `Human gates`). This table is A12's pin
  subject. Lifecycle step 5 at **`:71`** reads `5. Implementation (code only; no graph writes)` —
  A7 amends it, in the `docs-spec` lane, not here.
- **The two pin precedents, and which one fits.** `tests/lane_integration_meta.test.ts:16-28`
  extracts a **fenced yaml block** (`:18`, `/```yaml\n([\s\S]*?)\n```/`) — this is the precedent
  Behaviour 4 cites, and it is the **wrong shape** for the work-class table, which is a markdown
  table. `tests/lane_catalog_drift.test.ts` is the right shape: `:28-33` slices the section by
  heading and bounds it at the next `\n## `, and `:36-41` matches a table row's first backticked
  cell (`/^\|\s*`([^`]+)`\s*\|/`). A work-class pin needs that section-slice-plus-row-regex shape,
  widened from the first cell to all seven.
- **`.github/workflows/spec-index.yml:19-21`** — `pnpm spec:index` followed by
  `git diff --exit-code specs/indexes/`, on every `pull_request`. This is why CC-8's no-clock rule
  is load-bearing: a single dated or locale-dependent byte in either new view freezes CI.
- **`specs/schema/validation-rules.yaml`** — `indexes-fresh` at `:119-120`; `sensitive_paths` at
  `:126-127` is `specs/schema/**` only, so **nothing this lane touches is sensitive-path gated**.
- **`specs/schema/node-types.yaml`** — the node-id convention is a **comment** at `:8` with no rule
  behind it (CC-6's premise); `intent` statuses at `:15` are `[open, addressed, rejected]` with no
  `superseded` (CC-13's premise); `brief` at `:22-33`, `status_values` `[draft, approved,
  implemented]` at `:33`; `decision` at `:40-44` carries no `status`.
- **`specs/indexes/` today holds exactly four files** plus `.gitkeep` — `by-type.yaml`,
  `incoming.yaml`, `outgoing.yaml`, `unresolved.yaml`.

## Pinned decisions

Each item below is a binding constraint on this lane, named by its A*/CC-* identifier from
`decision-conveyor-derived-5a91` and `comparison-conveyor-market-890e`.

- **A11 — SETTLED, NOT OPEN. The consolidation is required.** Scope 2 of the approved contract
  contradicts itself: it claims `coverage_traversal.ts`'s exports "supply every walk the resolver
  needs" while also saying "consolidating the private walks left in the two coverage rules is not
  required by construction". A11 resolves it, and the resolution is: **`finalEvidenceForBrief`
  (`coverage_coherence.ts:68-81`) IS composable from `liveSourcesByEdge`, and
  `briefsCoveredByIntegration` (`:85-102`) is NOT** — the latter is a two-hop walk with a `final`
  filter on its middle node, expressible by no single `liveSourcesByEdge` call. Therefore **both
  closures are lifted into `tools/handlers/coverage_traversal.ts` as exported walks, and
  `tools/handlers/coverage_coherence.ts` is modified to import them.** Scope 2's first sentence
  stands (the resolver imports the walks rather than re-deriving them); Scope 2's clause "no live
  rule handler is touched" is **superseded by A11** — `coverage_coherence.ts` IS in this lane's
  diff. One precision the lift must preserve: `liveSourcesByEdge`'s `excludeStatus` filter skips a
  node only when its `status` is defined AND excluded (`:44-47`), so an exclusion-based composition
  (`excludeStatus: ["draft"]`) would wrongly ADMIT a status-less evidence node. The lifted
  `finalEvidenceForBrief` must therefore be a **status-blind walk plus an explicit
  `status === "final"` inclusion filter** — bit-identical to the closure it replaces.
- **A11 corollary — this is a pure refactor of the handler that gates this contract's own
  completion.** `coverage-coherence` is the rule that decides whether this very contract may mark
  its intent `addressed`. The lift changes **no** semantics: the existing
  `tests/coverage_coherence.test.ts` must pass **unchanged and unweakened**. Any behaviour delta is
  a defect, not an improvement.
- **A12 — DECIDED: PIN the literal; do NOT read `CLAUDE.md` as data.** `CONVEYOR_CLASS_ROUTING` is a
  single exported literal in `tools/conveyor.ts`, machine-pinned byte-equal to `CLAUDE.md:91-94`.
  There will be exactly **two** copies of the work-class table in the repo — the `CLAUDE.md` table
  and this literal — never a third. Rationale, in order of weight: (a) **CC-8 requires the view
  derivation be total**, and reading a prose markdown table at run time is a partiality source (a
  reflowed row, a renamed heading, an escaped pipe) that would throw inside `serializeIndexes` →
  `indexes_fresh.ts:12-33` → the fail-closed `spec:` channel, reddening every PR from a docs edit;
  (b) it would make `tools/**` depend at run time on `CLAUDE.md`, an unvalidated governing document
  that **no** rule reads today, deepening exactly the layer inversion the architecture panel already
  flagged; (c) it would make this lane build-order dependent on the `docs-spec` lane's `CLAUDE.md`
  edit, which the pin avoids entirely. A12 explicitly permits the pin: "If it chooses the pin, B
  Trade-off 4's admitted third copy stands as a machine-checked cost" — that cost is accepted here
  and recorded, not argued away.
- **A12, pin shape.** `CONVEYOR_CLASS_ROUTING` is keyed by class `0 | 1 | 2 | 3` and holds the six
  non-`Class` cells of that row **verbatim as strings** (`change`, `proposalMarket`, `critics`,
  `lanes`, `patchMarket`, `humanGates`). The resolver's class branches (Behaviour 2.2 and 2.4) key
  on the class **number** — a closed 0-3 enumeration already validated by `nodes-class-in-range`
  (`validation-rules.yaml:36-40`) — and read the two predicates they need as **pure functions of the
  pinned cell text**, exported by name: `marketRequired(class)` from the `Proposal market` cell and
  `lanesRequired(class)` from the `Lanes` cell. Deriving them from the pinned text rather than
  hand-writing two booleans is deliberate: **no routing boolean escapes the pin.** Both derivations
  are total by construction (a string predicate, never a throw). The residual hazard — a `CLAUDE.md`
  reword that flips a predicate while the pin is being updated to match — is closed by a second,
  tiny oracle (`marketRequired` true for 2 and 3 only; `lanesRequired` true for 3 only). **The pin
  test and the oracle test are `test-verification` lane CODE; this lane's obligation is to export
  the literal and both derivations as named, importable, side-effect-free values so those tests need
  reinvent nothing.**
- **A8 — DECIDED: author the writer; do NOT delete the marker.** The resolver's Behaviour 2.5(c)
  reads a `## Strategy tension` section in a brief body, and A8 forbids reading a marker nothing
  writes. This lane pins option (a): **`/decompose-lanes` writes `## Strategy tension` into a lane
  brief when it opens a market, and states per lane why no market was opened otherwise** — which
  contract Behaviour 9 and Risk 4's mitigation already require of that command. **`.claude/commands/
  decompose-lanes.md` is the `api-integration` lane's file, so this is a cross-lane dependency, not
  this lane's edit** (restated under Non-scope and Cross-lane dependencies). This lane's half is the
  READER, and it must be total and honest: the resolver **transcribes** the marker and never infers
  tension; when a class-≥2 brief carries no marker, the resolver emits its ordinary
  `/implement-brief` (or `/write-tests`) step **plus** a `kind: action` judgement reminder naming
  the marker's absence — a reminder, never a paste-able `/propose-patches` line. That keeps Risk 1's
  "no derivable next step, and why" honesty without inventing tension the graph does not record.
- **A2 + CC-5 (seam) — `planIssueSync` is pure and lives OUTSIDE the `spec` dispatch.**
  `tools/issue_sync.ts` exports `planIssueSync(spec, existingIssues): IssueSyncPlan` — a pure,
  deterministic, clock-free, network-free function returning the planned create/update/reopen/close
  actions. Per Scope 3, **`issue-sync` is deliberately NOT a `spec` subcommand**: `tools/spec.ts`'s
  dispatch stays read-and-validate only, and the sync ships behind a `spec:issue-sync` package
  script. The impure half (`gh`, `gh api` GraphQL) is a thin adapter over the plan, in the same
  module, and **must not execute on import** — the CC-5/A2 unit tests (no-op re-run, reopen of a
  hand-closed lane, close on final evidence, close on final integration) import the seam. Guard the
  CLI entry on `fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")`; do **not**
  copy `spec.ts:93-98`'s unguarded top-level `process.exit(main())`. If that guard proves unreliable
  under `tsx`, the sanctioned fallback is a third file `tools/issue_sync_cli.ts` (still `tools/**`,
  still this lane) — record in the evidence which was used.
- **CC-4 — the sync's write conditions, all three, decided in `planIssueSync`.** (1) An existing
  issue is adopted only when it carries the HTML-comment node-id marker **and** its author is the
  sync identity; body text merely *containing* the sentinel is rejected, never adopted. (2) The
  projection is **bounded** to `id`, `title`, `status`, `lane`, `owner` and a link — nothing else
  from a node body ever reaches an issue. (3) Close on **final evidence OR superseded/rejected**: a
  collapsed lane is superseded, never evidenced, so a supersede must close its issue.
- **CC-5 (this lane's half) — completeness and a durable per-run record.** `planIssueSync` takes the
  caller's `existingIssues` listing plus an explicit **listing-complete** flag and **refuses to plan
  any mutation when the listing did not complete** — the fail-closed discipline of
  `gitdiff.ts:5-12`, applied to a paginated `gh` listing. Every run reports **planned / applied /
  failed** counts on one line, in the shape of `spec.ts:82`. (The scheduled trigger is
  `observability-release`'s workflow; the seam's unit tests are `test-verification`'s CODE — this
  lane ships the seam those tests drive.)
- **CC-6 — node ids are refused before they reach a printed line or a `gh` argument.** No id
  matching `^[a-z]+-[a-z0-9-]+-[0-9a-f]{4}$` is assumed; ids that fail it are **never rendered into
  a `Step.rendered` line and never passed to `gh`**. Instead the resolver emits an explicit "no
  derivable next step, and why" entry naming the malformed id. `gh` is invoked through `spawnSync`
  with an **argv array and `shell: false`** (state it explicitly even though it is the default),
  mirroring `gitdiff.ts:15`. **Honest bound, recorded:** the node-id convention is a comment at
  `node-types.yaml:8` with **no validation rule** behind it, and adding one is out of scope
  (contract Out-of-scope 2 parks rule work in Phase 10 Step 0). CC-6's fix here is therefore a
  **tool-side refusal at the two egress points**, not a graph invariant — say so, do not overclaim.
- **CC-8 — DECIDED: make the derivation TOTAL and add a no-clock rule (not a soft freshness
  rule).** Scope 4 requires both views be inside `INDEX_FILES` "rather than outside it", and
  Out-of-scope 1 forbids a new validation rule; a "soft" rule would also need a severity concept the
  `Finding` type does not have. So totality is the only consistent option. **Totality:** every
  derivation feeding `trails.md` and `status.md` is total over any *loadable* graph — no throw, no
  non-null assertion, no unchecked index. A node with an absent, unknown or malformed `type`/
  `status`, a dangling edge, a cycle, or a class outside 0-3 yields an explicit row (`stage:
  unknown`, `next: no derivable next step — <why>`), never an exception, because
  `serializeIndexes` runs inside `indexes_fresh.ts:12-33` on **every** `spec:validate` and a throw
  there escapes through `spec.ts:93-98` and reds every PR. **No-clock:** both views' bytes are a
  pure function of the graph — no `Date`/`Date.now()`/`new Date()`, no `process.env`, no locale or
  timezone, no filesystem mtime, no absolute path, no iteration over an unsorted `Object.keys`.
  Every sort uses `compareStrings` (`loader.ts:169-171`). `spec-index.yml:19-21` diffs
  `specs/indexes/` on every PR, so one dated byte freezes CI. **The no-clock and byte-determinism
  TESTS are `test-verification`'s CODE**; this lane's obligation is the property and a code path
  that is grep-ably clock-free.
- **A5 — terminality is graph-state dependent, never a static per-command boolean.** The resolver
  contains **no** `terminal: true` field on any command. `/prepare-evidence` is terminal **only**
  when its brief is the contract's lone live brief
  (`liveSourcesByEdge(spec, byId, "decomposes", contractId).size === 1`); with ≥2 live briefs, the
  step after the last lane's final evidence is `/integrate <contract-id>`, and while siblings remain
  the resolver emits each outstanding sibling's own next step (Behaviour 2.9). `/integrate` is
  terminal only at final coverage. Because the resolver reads the **same** lifted walks
  `coverage-coherence` uses, `spec:status` cannot print `/integrate` for a contract that rule would
  red — the defect the comparison records against Candidate A.
- **A7 (resolver half) — a routing rule for a `brief` at status `implemented` emits
  `/prepare-evidence <brief-id>`, `kind: paste`.** This closes the loop where `/implement-brief`
  reprinted itself: implementation now writes one graph state change, and the resolver keys on it.
  Brief statuses are `[draft, approved, implemented]` (`node-types.yaml:33`), so the brief rules
  split: `draft`/`approved` → Behaviour 2.5's implement / write-tests / propose-patches steps;
  `implemented` → `/prepare-evidence`. **The `/implement-brief` flip is `api-integration`'s command
  edit and the `CLAUDE.md:71` step-5 amendment is `docs-spec`'s** — both named again under Non-scope
  and Cross-lane dependencies. Until the flip lands, this rule is unreachable in practice; that is a
  sequencing fact to record in evidence, not a reason to omit the rule.
- **CC-14 (this lane's half) — `tools/spec.ts:11`'s "the four files" is rendered from
  `INDEX_FILES.length`.** `USAGE` becomes a template string importing `INDEX_FILES` from
  `./indexer.ts` (`spec.ts:2` already imports from that module). No hand-maintained count survives
  in `tools/`. (`CLAUDE.md:186`'s `includes`-target claim is CC-14's other half and belongs to
  `docs-spec`.)
- **CC-11 (this lane's half) — the views make an unsynced lane visible and reproduce the wave.**
  `status.md` and `trails.md` render `issue: not synced` where no issue is recorded, so a blank
  column never reads as a lost lane, and they render each lane brief's persisted `wave`. Both reads
  are **total**: an absent `wave` renders as an explicit unwaved marker, never a crash. **The writer
  of `wave` is `/decompose-lanes` (`api-integration`)** and documenting `wave` alongside `owner` in
  `node-types.yaml` is `data-migration`'s — both cross-lane, both flagged.
- **CC-10(c) — the drift packet gains the contract's `selects` decision.** `DriftPacket` gains a
  `decisions: { id: string; title: string }[]` field (the `priorEvidence` shape at `driftmap.ts:30`,
  because a `decision` carries no `status`), populated by `sourcesOf(spec, "selects", contractIds)`
  filtered to nodes whose `type` is `decision` — the `selects` target is now `[contract, patch]`, so
  the type guard is real, not defensive decoration. Sorted by `uniqSorted`, so the packet stays
  deterministic. **`/detect-drift` judging the diff against contract *and* decision is
  `api-integration`'s command edit; `contract-reviewer` and `integration-reviewer` reading the
  decision is `product-spec`'s** — this lane ships the packet field only.
- **THE INDEXER TRAP — both `:35` and `:99-108` are in this lane's diff even though Scope 4 names
  only `:35`.** `serializeIndexes` (`tools/indexer.ts:99-108`) hard-codes a **four-key object
  literal** (`:102-107`) typed `Record<IndexFileName, string>`. Because `IndexFileName` is derived
  from `INDEX_FILES` at `:36`, extending `INDEX_FILES` at `:35` **alone will not compile** — the
  literal is missing two keys and `pnpm typecheck` fails. `writeIndexes` (`:110-121`) iterates
  `INDEX_FILES` and scales on its own with no edit. The doc comments at **`:99`** and **`:110`**
  both say "four" and must stop asserting a count, on the same CC-14 principle as `spec.ts:11`.
- **`spec:status` exit codes — an interpretation recorded, not absorbed.** Behaviour 5's "Read-only,
  exit 0" binds the success path. This lane pins: a well-formed, resolvable argument (or no
  argument) prints and exits **0**; a load failure exits **1** through the existing fail-closed
  `spec:` channel (`spec.ts:89-98`), unchanged; and an argument that is not a well-formed node id
  (CC-6) or names no node in the graph exits **2** with one line on stderr — the usage-error channel
  `spec.ts:25` already documents. This refines HOW, not WHAT: `status` still never mutates and never
  reds a build on graph content.

## Files to create

Both under `/home/samir/workspace/pactwright/tools/`; both are this lane's alone.

1. **`tools/conveyor.ts`** — the whole of contract Scope 1.
   - `export interface Step` with fields `command`, `args: string[]`, `rendered`, `kind`, `why`, and
     `export type StepKind = "paste" | "template" | "action"` (Behaviour 1: `paste` = every argument
     is a resolved id; `template` = one argument no graph state can fill; `action` = the PR action
     or a judgement reminder).
   - `export function nextSteps(spec: LoadedSpec, nodeId: string): Step[]` — pure, deterministic,
     total, and **never returns an empty array** (Risk 1: an explicit "no derivable next step, and
     why" `kind: action` entry instead).
   - `export function deriveStage(spec, nodeId): Stage` — the lifecycle stage helper the two views
     and `spec:status` share.
   - `export const CONVEYOR_CLASS_ROUTING` plus `marketRequired` / `lanesRequired` (A12).
   - `export function liveIntents(spec): NodeRecord[]` — the consumer of CC-13's "live intent"
     definition (`type === "intent"`, `status === "open"`, not the target of a `supersedes` edge).
     The definition's canonical text is `data-migration`'s (`node-types.yaml`) and `docs-spec`'s
     (`CLAUDE.md`); this predicate must agree with it, and a disagreement is an integration finding.
   - No I/O, no `Date`, no `process.env`, no `spawnSync`. It imports `loader.ts` and
     `handlers/coverage_traversal.ts` only.
2. **`tools/issue_sync.ts`** — A2's seam plus its adapter.
   - `export interface ExistingIssue` with fields `number`, `title`, `body`, `state` (`"open"` |
     `"closed"`) and `authorLogin` — `authorLogin` exists because CC-4(1) requires the sync identity
     as author, and `body` because it requires the node-id marker *and* rejects text merely
     containing the sentinel.
   - `export interface IssueSyncPlan` with `create` / `update` / `reopen` / `close` / `skipped`
     lists, and `export function planIssueSync(spec, existingIssues, opts): IssueSyncPlan` — pure,
     total, clock-free, network-free, refusing to plan when the listing did not complete (CC-5).
   - A thin `gh`/`gh api` adapter applying a plan, `spawnSync` with an argv array and
     `shell: false`, defaulting to **dry** unless explicitly told to apply (the workflow that passes
     the token is `observability-release`'s). Not exported into `tools/spec.ts`'s dispatch.
   - No top-level side effect: the CLI entry is guarded (see Pinned decisions).

## Files to modify

All six are this lane's alone; **no other lane edits any of them.**

1. `/home/samir/workspace/pactwright/tools/spec.ts` — `status` joins `SUBCOMMANDS` (`:27`) and
   `USAGE` (`:9-25`); `:11`'s count rendered from `INDEX_FILES.length` (CC-14); a read-only `status`
   branch with an optional node-id filter, placed before the validate fall-through at `:78`.
2. `/home/samir/workspace/pactwright/tools/indexer.ts` — `INDEX_FILES` (`:35`) extended to six with
   `trails.md` and `status.md`; the `serializeIndexes` object literal (`:99-108`) extended to six
   keys **(the trap — it will not compile otherwise)**; two new deterministic markdown serializers;
   the "four" doc comments at `:99` and `:110` de-counted.
3. `/home/samir/workspace/pactwright/tools/handlers/coverage_traversal.ts` — the A11 **lift**: add
   the exported `finalEvidenceForBrief`, `briefsCoveredByIntegration`, and a
   `liveBriefsForContract` alias in the one-line style of `liveProposingContracts` (`:54-60`).
4. `/home/samir/workspace/pactwright/tools/handlers/coverage_coherence.ts` — the A11 **consume**:
   delete the private closures at `:68-81` and `:85-102` and import the lifted walks instead. Pure
   refactor; semantics bit-identical.
5. `/home/samir/workspace/pactwright/tools/driftmap.ts` — CC-10(c): `DriftPacket` gains
   `decisions: { id: string; title: string }[]`, populated and sorted deterministically.
6. `/home/samir/workspace/pactwright/package.json` — `"spec:status": "tsx tools/spec.ts status"` and
   `"spec:issue-sync": "tsx tools/issue_sync.ts"` added to `scripts` (`:5-15`).

## Ordered implementation steps

Steps 1-2 are the pure foundation; 3-5 build the resolver on it; 6-8 wire the surfaces; 9-10 close.
Every mutating step ends with the validation gate in step 10's form and **must not commit on red.**

1. **A11 lift — `tools/handlers/coverage_traversal.ts`.** Add three exports beside the existing
   eight, in the module's documented style (a doc comment per walk stating what it skips and why):
   `finalEvidenceForBrief(spec, byId, briefId)` — a **status-blind** `liveSourcesByEdge(spec, byId,
   "evidences", briefId, [])` filtered to `asString(node.data["status"]) === "final"`, matching
   `coverage_coherence.ts:68-81` exactly (an EMPTY exclude list, never `undefined`, exactly as
   `competingPatches` documents at `:116-118`); `briefsCoveredByIntegration(spec, byId,
   integrationId)` — the two-hop walk moved from `:85-102` with its `final` middle-node filter
   intact; and `liveBriefsForContract(spec, byId, contractId)` — the named alias for
   `liveSourcesByEdge(spec, byId, "decomposes", contractId)`, mirroring `liveProposingContracts`.
   Do **not** touch `comparison_required.ts:38-59`.
2. **A11 consume — `tools/handlers/coverage_coherence.ts`.** Replace the two private closures with
   imports of the lifted walks; replace `:119`'s inline `liveSourcesByEdge` call with
   `liveBriefsForContract`. Change nothing else in the handler. Run the existing suite: the
   `coverage_coherence` tests must pass **unchanged**. If any assertion needs editing, the lift
   changed semantics — stop and fix the lift, never the test.
3. **`tools/conveyor.ts` — the routing skeleton and A12's literal.** Author `Step`, `StepKind`,
   `deriveStage`, `liveIntents`, `CONVEYOR_CLASS_ROUTING` (the six verbatim cells per class row from
   `CLAUDE.md:91-94`) and the two derivations `marketRequired`/`lanesRequired`. Export everything
   the pin and oracle tests need. No I/O, no clock.
4. **`tools/conveyor.ts` — `nextSteps`, Behaviour 2.1-2.9, importing every walk.** Reuse
   `liveProposingContracts` and `intentsForContract` for 2.1-2.3; `CONVEYOR_CLASS_ROUTING` for the
   class branches at 2.2 and 2.4; `patchMarketResolved`, `comparedCompetitors`, `liveCompetitors`
   and `competingPatches` for 2.6-2.7; **`briefsForPatch` for 2.8 — the `/select-patch` →
   `/prepare-evidence` hop, resolved to a brief id, never a branch**; and the step-1 lifted walks
   plus `liveBriefsForContract` for 2.9's terminality (A5). Add A7's `brief` at `implemented` →
   `/prepare-evidence` rule. Mark `kind` per Behaviour 1; where a step inside rules 2.2-2.4 has
   every argument resolved (notably `/write-brief <contract-id>`), it is `paste` — the contract's
   parenthetical enumerates rules, not individual steps, and this reading is recorded here rather
   than applied silently. Enforce CC-6's id refusal at render time. Enforce Risk 1: never return
   `[]`. Enforce A8: transcribe `## Strategy tension`; on its absence for a class-≥2 brief emit the
   `kind: action` judgement reminder, never an inferred `/propose-patches`.
5. **`tools/indexer.ts` — the two serializers, before touching `INDEX_FILES`.** Author
   `serializeTrails(spec): string` (Behaviour 8: one section per intent — contracts, comparison,
   decision, briefs with lane and owner, evidence, integration, each as `id`, `title`, `status`) and
   `serializeStatus(spec): string` (the intent's open-work rows, each carrying `nextSteps`' first
   step, plus CC-11's `issue: not synced` and `wave` columns). Import `nextSteps`/`deriveStage` from
   `tools/conveyor.ts` — one call per view, so the views and the prints cannot disagree. Total and
   clock-free (CC-8); every sort via `compareStrings`.
6. **`tools/indexer.ts` — spring the trap deliberately.** Extend `INDEX_FILES` (`:35`) to six, then
   **immediately** extend the `serializeIndexes` literal (`:99-108`) to six keys wiring the two new
   serializers, and de-count the doc comments at `:99` and `:110`. Run `pnpm typecheck` (env:
   `node_modules/.bin/tsc --noEmit`) and confirm it is green — a red `Record<IndexFileName, string>`
   here is the expected failure mode of doing `:35` alone.
7. **`tools/spec.ts` — the `status` branch.** Add `"status"` to `SUBCOMMANDS` (`:27`); rewrite
   `USAGE` (`:9-25`) as a template string rendering `:11`'s count from `INDEX_FILES.length` (CC-14)
   and documenting `status` with its optional node-id filter; add the branch before the validate
   fall-through at `:78`, printing per live intent with no argument and that node's with one, and
   emitting the machine-stable `NEXT` block (one line per step) that A9's transcription job will
   diff. Apply the exit-code pin from Pinned decisions.
8. **`tools/issue_sync.ts` + `package.json`.** Author `planIssueSync` with CC-4's three write
   conditions and CC-5's listing-complete refusal and planned/applied/failed report; author the
   `gh` adapter (`spawnSync`, argv array, `shell: false`, dry by default, `--repo` pinned, token
   from the environment the workflow supplies). Guard the CLI entry. Add `spec:status` and
   `spec:issue-sync` to `package.json:5-15`. Confirm **no** import path leads from `tools/spec.ts`
   to `tools/issue_sync.ts` (Scope 3: the `spec` dispatch is read-and-validate only).
9. **`tools/driftmap.ts` — CC-10(c).** Add `decisions` to `DriftPacket` (`:20-33`) and populate it
   in `buildDriftMap` from `sourcesOf(spec, "selects", contractIds)`, type-guarded to `decision`,
   `uniqSorted`. Confirm `tests/driftmap.test.ts` still passes or, if the packet shape assertion
   must widen, record that as a `test-verification` dependency — **do not edit the test.**
10. **Regenerate, validate, typecheck, test — same commit.** Run, in this order:
    `node_modules/.bin/tsx tools/spec.ts index` (canonically `pnpm spec:index`; `pnpm`/corepack are
    broken in this PRoot environment), then `node_modules/.bin/tsx tools/spec.ts validate`
    (canonically `pnpm spec:validate`), then `node_modules/.bin/tsc --noEmit`, then
    `node_modules/.bin/node --test --import tsx tests/*.test.ts`. Commit the two new
    `specs/indexes/` files with the code. `specs/indexes/` is regenerated by `spec:index` in this
    lane's commit — a derived artifact, never a lane claim and never hand-edited (CLAUDE.md).
    Run `spec:index` **twice** and confirm the second run
    leaves `git diff --exit-code specs/indexes/` clean — the byte-determinism `spec-index.yml:19-21`
    enforces. **Nothing is committed on red.**

## Non-scope

Explicitly the other six lanes' files and work. **No two lanes edit the same file.**

- **`brief-conveyor-schema-graph-8b2e` — `data-migration`.** `specs/schema/node-types.yaml` (the
  optional `owner` field on `brief`, the inline lane enumeration becoming a pointer, **CC-13's
  canonical "live intent" definition** that this lane's `liveIntents` predicate must agree with,
  and — see Cross-lane — any documentation of the `wave` field) and **all graph data (Scope 14)**:
  the ten `touches` edges, the two capability widenings, the PR #4 `drift-finding` and its `flags`
  edge, the two follow-up intents, the `.gitignore` unowned authorization. This lane authors **no**
  node and **no** edge.
- **`brief-conveyor-commands-c14d` — `api-integration`.** All fifteen `.claude/commands/*.md` chain
  files. Specifically not this lane's: **A7's `/implement-brief` flip** of its brief to
  `implemented` via graph-maintainer; **A8's `## Strategy tension` writer** in
  `decompose-lanes.md`; **CC-11's `wave` writer**; A1's degraded template-shaped fallback (which
  must not satisfy A6's pin); A3, A4, A14, A15/CC-7's red-suppression of the closing print; and
  `select-patch.md:40`'s current `/prepare-evidence <winner-branch>` correction.
- **`brief-conveyor-ci-6a9f` — `observability-release`.** `.github/workflows/**` and
  `.github/CODEOWNERS`: the new `issue-sync.yml` (its `permissions`, token, `--repo` and dry
  default), **A9's transcription job** diffing each printed block against `spec:status` output,
  CC-5's scheduled trigger, the `drift-review.yml` flip, and CC-10(a)'s CODEOWNERS entry.
- **`brief-conveyor-lane-catalog-2d5b` — `product-spec`.** `.claude/lanes/**` (all eight catalog
  files), `.claude/agents/**` (the seven implementer agents, A10's Bash-grants risk entry, CC-2's
  `tools:` pins, `integration-reviewer.md`'s CC-10(d) half — including `contract-reviewer` and
  `integration-reviewer` reading the contract's **decision**), and `.gitignore`'s `!.claude/lanes/`
  negation.
- **`brief-conveyor-docs-9e31` — `docs-spec`.** `CLAUDE.md` (including **A7's amendment of lifecycle
  step 5 at `:71`**, the conveyor subsection, CC-13's lifecycle-map gaps and its "live intent"
  prose, and CC-14's `:186` half), `README.md`, `CONTRIBUTING.md`, `docs/**`. **This lane reads
  `CLAUDE.md:91-94` only as the pin's subject — it never edits it.**
- **`brief-conveyor-tests-4c86` — `test-verification`.** All of `tests/**`, written by `test-writer`
  via `/write-tests`, never by the invocation that implemented the code under test. Specifically not
  this lane's, even though this lane's code makes them necessary: `tests/conveyor.test.ts`; **A12's
  pin test and its predicate oracle**; **CC-8's no-clock and byte-determinism tests**; A2/CC-5's
  four `planIssueSync` unit tests; A6 and A13's leg union in `lane_catalog_drift.test.ts`;
  `lane_enum.test.ts`'s `LANES` load; `spec.test.ts`'s new usage string (its current assertion at
  `:228` pins the old one) and its re-declared `INDEX_FILES` at `:12` becoming an import; and the
  five index-bearing fixtures plus three `expected-errors.txt` files that this lane's `INDEX_FILES`
  widening reds. **This lane writes no test code and edits no test file.**
- **`brief-conveyor-schema-graph-8b2e` also owns the only sensitive path.** `specs/schema/**` is the
  sole `sensitive_paths` glob (`validation-rules.yaml:126-127`); nothing this lane touches falls
  under it, so `spec:check-diff` has no claim on this lane's diff.
- **Within this lane, also out of scope:** `tools/handlers/comparison_required.ts:38-59`'s private
  `coveredSet` closure (A11 does not reach it); any new validation rule or required-field migration
  (contract Out-of-scope 1 and 2); any execution by the resolver (Out-of-scope 4 — `spec:status`
  prints and exits, no PR, no node, no branch); and issues becoming graph inputs (Out-of-scope 3 —
  the sync is one-way and no node frontmatter references an issue).

## Cross-lane dependencies & integration expectation

**What this lane depends on** (its code is correct without them, but the behaviour is incomplete
until they land — each is named here so the gap is recorded, never absorbed):

- **`api-integration`, for A8.** `/decompose-lanes` must write the `## Strategy tension` marker this
  lane's Behaviour 2.5(c) reads, and state per lane why no market was opened. Without it the reader
  is a reader of nothing and Behaviour 2.5(c) never fires. This lane chose "author the writer" over
  "delete the marker", so the dependency is deliberate and must be discharged.
- **`api-integration`, for A7.** `/implement-brief` must flip its brief to `implemented` via
  graph-maintainer. Until it does, this lane's `implemented` → `/prepare-evidence` rule is
  unreachable and the loop A7 closes stays open.
- **`api-integration` + `data-migration`, for CC-11.** `/decompose-lanes` must persist `wave` on
  each lane brief for the views to render it. **Discrepancy recorded:** neither the approved
  contract's Scope 7/14 nor the decomposition plan's `data-migration` subsection lists `wave`
  alongside `owner` as a documented `node-types.yaml` field, though CC-11 requires the value be
  persisted. Unknown frontmatter validates green (`required_fields` is a one-directional presence
  check), so this is not a red-graph risk — but the field being undocumented while `owner` is
  documented is an asymmetry the integration node should resolve.
- **`data-migration` + `docs-spec`, for CC-13.** The canonical "live intent" definition lives in
  `node-types.yaml` and `CLAUDE.md`; this lane's `liveIntents` predicate must agree byte-for-byte
  in meaning. A disagreement is an integration finding, not a code fix made unilaterally here.
- **`docs-spec`, for A12's pin subject.** The pin compares this lane's literal against
  `CLAUDE.md:91-94`. If `docs-spec` reflows or reworks the work-class table, the literal must be
  updated in the same PR or the pin reds. Choosing the pin (over read-as-data) means this is a
  **test-time** coupling, not a **run-time** one — that was the point.
- **`observability-release`, for A9.** The transcription job diffs each command's printed block
  against `spec:status` output, so this lane owes it a byte-stable `NEXT` block: one line per step,
  a fixed delimiter, no clock, no locale, no absolute path.
- **`test-verification`, for the fixture blast radius.** Widening `INDEX_FILES` reds the five
  index-bearing fixtures (`good`, `good-patch-market`, `bad/dispatch-all-kinds`, `bad/index-drift`,
  `bad/rule-disable`) and adds two `indexes drifted` lines to three `expected-errors.txt` files
  (contract Scope 11.5). **This lane must not repair them** — they are `test-verification`'s files.
  The consequence is a real ordering fact for `/integrate`: between this lane's merge and that
  lane's, `pnpm test` is red on fixtures, and the integration node must record it rather than let a
  reviewer read it as a defect in either lane.

**What depends on this lane:** every other lane, in effect. `api-integration`'s fifteen command
files print this resolver's `NEXT` block; `observability-release`'s A9 job diffs against
`spec:status`; `test-verification` cannot write `conveyor.test.ts`, the A12 pin, or the no-clock
tests until the exports exist; `docs-spec`'s conveyor subsection describes this module as the sole
routing truth.

**Integration expectation.** This laned brief reaches `implemented` via **this lane's own final
`evidence`** (`evidence —evidences→ brief`), while `intent-self-guiding-delivery-loop-6d79` stays
**`open`**. A laned brief's evidence implements the brief; it never addresses the intent. The
contract `contract-conveyor-derived-4c8c` is decomposed into **seven** briefs, so it is multi-brief
under `coverage-coherence` (cutoff `2026-06-18`; the contract's `created` of `2026-07-27` is after
it) and **does not skip integration**: it completes **only** via a final `integration` node
(authored by `/integrate`) that `integrates` a final evidence for **every live lane** —
`domain-backend`, `data-migration`, `api-integration`, `observability-release`, `product-spec`,
`docs-spec`, `test-verification`. The intent reaches `addressed` only through that integration,
never through this single lane's evidence. Per CC-10(d), that integration node's
`compliance-verdict` section enumerates all 32 items (CC-1…CC-16 and A1…A16) and names each one's
discharging brief; this lane's thirteen are **A2, A5, A7 (resolver half), A8, A11, A12, CC-4, CC-5
(seam), CC-6, CC-8, CC-10(c), CC-11 (views half), CC-14 (the `spec.ts:11` half)**. **If a lane collapses**
(its work proves unnecessary or folds into another), it is **superseded** per CLAUDE.md rule 3 — a
`supersedes` edge from the successor, the collapsed brief moved to its terminal status — **never**
forced into a ceremonial integration; the integration node then covers only the lanes that remain
live.

## Acceptance & verification (scoped to this lane)

Maps to the contract's `## Acceptance`, restricted to the `tools/**` + `package.json` surface. The
`test-verification` lane owns all test CODE; this lane states what its slice must satisfy and
verifies it through the real CLI and typecheck.

1. **Unit-testable routing exists and resolves the named hop (Acceptance 2).** `nextSteps` on a
   `selected` patch returns `/prepare-evidence <brief-id>` resolved through `briefsForPatch`
   (`coverage_traversal.ts:91-104`) — **never a branch**; on an `approved` class-3 contract with no
   brief it returns `/decompose-lanes`, never `/write-brief`; on a one-candidate class-1 intent it
   returns `/approve-contract`. Confirmed against the real graph via
   `node_modules/.bin/tsx tools/spec.ts status <node-id>`.
2. **A7's rule fires (Acceptance 1's hand-assembled-ID clause).** `nextSteps` on a `brief` at status
   `implemented` returns `/prepare-evidence <brief-id>`, `kind: paste`, with every argument
   resolved. **Honest bound, recorded:** until `api-integration` ships the `/implement-brief` flip,
   no brief in the real graph reaches `implemented` outside `/prepare-evidence`, so this is verified
   against a constructed spec, not the live tree.
3. **A5's terminality is computed, not declared.** `grep` the resolver: no `terminal` boolean exists
   on any command. `/prepare-evidence` is emitted as terminal only when
   `liveBriefsForContract(...).size === 1`; with ≥2 live briefs, `/integrate <contract-id>` follows
   the last lane's final evidence. Because the resolver and `coverage-coherence` read the same
   lifted walks, `spec:status` cannot print `/integrate` for a contract that rule would red.
4. **A11's consolidation is bit-identical (Acceptance 8's reviewer-judgement bound is not invoked
   here — this one is mechanical).** `tests/coverage_coherence.test.ts` passes **unchanged** after
   the lift, and `node_modules/.bin/tsx tools/spec.ts validate` is green on the real tree with the
   same finding set as before the refactor.
5. **A12's pin is possible and the copy count is two (Acceptance 4's anti-vacuity spirit).**
   `CONVEYOR_CLASS_ROUTING` and both derivations are exported, side-effect-free and importable; the
   six verbatim cells per class row are byte-equal to `CLAUDE.md:91-94`. `grep -rn "Trivial
   mechanical" -- CLAUDE.md tools/` returns exactly two files. Verified by reading the literal
   against the table; the pin TEST is `test-verification`'s.
6. **CC-8's totality and no-clock hold (Acceptance 5: `spec:index` run twice is byte-identical).**
   `node_modules/.bin/tsx tools/spec.ts index` run twice leaves
   `git diff --exit-code specs/indexes/` clean.
   `grep -n "Date\|process\.env\|localeCompare\|toLocale" tools/conveyor.ts tools/indexer.ts`
   returns nothing on the view code path. A graph with a malformed node (an unknown `type`, an
   absent `status`, a class outside 0-3) still serializes both views without throwing — confirmed by
   running `validate` against `tests/fixtures/bad/malformed-node`'s tree shape, since a throw inside
   `indexes_fresh.ts:12-33` would escape through `spec.ts:89-98` and red every PR.
7. **Navigation answers the question without reading `edges.yaml` (Acceptance 5).** `trails.md`
   carries one section per intent with contracts, comparison, decision, briefs (lane and owner),
   evidence and integration, each as `id`, `title`, `status`; `status.md` carries the live intents'
   open-work rows, each with its next step, plus CC-11's `issue: not synced` and `wave` columns.
   Both are committed under `specs/indexes/` and covered by `indexes-fresh`.
8. **The trap is sprung and typecheck is green.** `node_modules/.bin/tsc --noEmit` passes with
   `INDEX_FILES` at six entries and `serializeIndexes` returning a six-key
   `Record<IndexFileName, string>`; neither `indexer.ts:99` nor `:110` asserts a count, and
   `spec.ts:11` renders its count from `INDEX_FILES.length` (CC-14).
9. **The seam is pure and out of the dispatch (Scope 3).** `planIssueSync` is importable with no
   network, no clock and no side effect; `tools/spec.ts` has no import path reaching
   `tools/issue_sync.ts`; `spec:issue-sync` runs dry by default; `gh` is invoked via `spawnSync`
   with an argv array and `shell: false`. **Honest bound:** the sync's idempotence oracle is
   `test-verification`'s four unit tests (A2/CC-5); this lane ships the seam, not the proof.
10. **CC-6's refusal is at both egress points, and its bound is stated.** No id failing
    `^[a-z]+-[a-z0-9-]+-[0-9a-f]{4}$` is rendered into a `Step.rendered` line or passed to `gh`; the
    resolver emits an explicit "no derivable next step, and why" entry instead. **Honest bound:**
    this is a tool-side refusal, not a graph invariant — `node-types.yaml:8` remains a comment with
    no rule, and the rule belongs to Phase 10 Step 0 (contract Out-of-scope 2).
11. **CC-10(c)'s packet carries the decision.** `node_modules/.bin/tsx tools/spec.ts drift-map`
    emits a `decisions` array on each packet whose reachable contracts carry a `selects` decision,
    deterministically sorted. The consumers (`/detect-drift`, `contract-reviewer`,
    `integration-reviewer`) are other lanes' artifacts.
12. **Risk 1's floor holds.** `nextSteps` never returns an empty array — for any node id, including
    one that does not resolve, it returns at least one `kind: action` entry naming why no step is
    derivable. Confirmed by running `spec:status <id>` for a node of every type in the real graph.
13. **Mutation discipline (contract Acceptance 7's self-application context).** Every mutating step
    ends with the canonical `pnpm spec:index && pnpm spec:validate` — in this PRoot environment
    `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate`,
    since `pnpm`/corepack are broken here — plus `node_modules/.bin/tsc --noEmit`. **Nothing is
    committed on red.** This lane's diff is `tools/**` + `package.json` + regenerated
    `specs/indexes/`, so its evidence `touches` resolves to `capability-spec-tooling-1a2b`.

Edge for graph-maintainer to record for this brief node:
`brief-conveyor-resolver-3f7a —decomposes→ contract-conveyor-derived-4c8c`.
