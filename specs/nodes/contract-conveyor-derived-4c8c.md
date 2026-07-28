---
id: contract-conveyor-derived-4c8c
type: contract
title: Self-guiding delivery loop (derived conveyor — one next-step resolver in code)
status: candidate
created: 2026-07-27
class: 3
---

This contract proposes `intent-self-guiding-delivery-loop-6d79` (class 3) — make the delivery loop
self-guiding, lane execution visible, and the graph readable. It spans `tools/`, `.claude/`,
`specs/schema/`, workflows, `tests/`, `CLAUDE.md`, root docs and graph data — Class 3. The market
carries **three** candidates and this is **B**. All three share an identical common core and differ
on one axis: **how the conveyor's next-command knowledge is represented, and what keeps the command
prints and `spec:status` from diverging.** B takes the **derived** position: one next-step resolver
in `tools/` is the sole source of routing truth, `spec:status` is its read-only surface, and every
closing report and both navigation views are one call to it.

## Problem interpretation

Nine workstreams; only the conveyor is contested. The common core, identical across A, B and C:

1. **Lane market** — eight `.claude/lanes/<lane>.md` catalog files, optional `owner` on `brief`,
   seven implementer agents, the ten-leg drift pin, `/decompose-lanes` running the market, and the
   prose lane-list copies becoming pointers.
2. **The `.gitignore` negation** — `.gitignore:10` is `.claude/*`, negated only for
   `!.claude/agents/` and `!.claude/commands/`; without a third negation the catalog never reaches
   the repo and every catalog assertion no-ops in CI. Omitted by the intent; corrected here.
3. **Issue sync, gate graduation, graph data** — `spec:issue-sync` + `issue-sync.yml`, graph to
   issues only, marker-idempotent, never blocking; the `drift-review.yml` flip, two doc corrections,
   the PR #4 verdict, the `touches` backfill, two follow-up intents, one authorization artifact.
4. **Mix-and-match, output attention, docs, four stale files** — the operational half included:
   `/write-brief` and `/decompose-lanes` carry the amendments into the briefs, and
   `contract-reviewer`, `integration-reviewer` and `/detect-drift` judge contract with decision.

**Candidate B**: the conveyor is one pure function, `nextSteps(spec, nodeId)`, in a new
`tools/conveyor.ts`. It walks `edges.yaml` to fill every ID it prints, including the `/select-patch`
→ `/prepare-evidence` hop through the winner's `competes-for` edge. Its boundary is judgement: a
step no graph state implies enters through a marker a command wrote. One correction, recorded not
absorbed: `detect-drift` and `update-spec-graph` are not chain steps, so the surface is **14** of 16
command files, none meeting the bar today — it sizes to 14, not 9.

## Scope

1. **`tools/conveyor.ts` (new)** — `nextSteps(spec, nodeId): Step[]` plus a `deriveStage` helper,
   pure and deterministic, and a `CONVEYOR_CLASS_ROUTING` literal.
2. **`tools/handlers/coverage_traversal.ts` — imported, not modified.** Its exports supply every
   walk the resolver needs, so **no live rule handler is touched**; consolidating the private walks
   left in the two coverage rules is not required by construction and stays out under rule 5.
3. **`tools/spec.ts` + `package.json`** — `status` joins `SUBCOMMANDS`/`USAGE` as a read-only branch
   with an optional node-id filter. `issue-sync` is deliberately **not** a subcommand — that
   dispatch is read-and-validate only — and ships behind a `spec:issue-sync` script.
4. **`tools/indexer.ts`** — `INDEX_FILES` (`:35`) extended to six with `trails.md`/`status.md` plus
   deterministic serializers, putting both views under `indexes-fresh` rather than outside it.
5. **`tools/issue_sync.ts` + `.github/workflows/issue-sync.yml` (new)** — the sync shells `gh` and
   `gh api` GraphQL; the workflow runs on merge to main and dispatch, warns, never blocks.
6. **`.github/workflows/drift-review.yml`** — delete `continue-on-error: true` from the
   `Sensitive-paths gate` step (`:31`); rewrite the false header (`:3-9`) and step (`:29`) comments.
7. **`specs/schema/node-types.yaml`** — optional `owner` on `brief`; the lane comment becomes a
   pointer. The intent's one schema touch; nothing else is added.
8. **`.claude/lanes/*.md` (8 new) + `.gitignore`** — the catalog plus the `!.claude/lanes/`
   negation, without which nine of the ten pin legs pass vacuously.
9. **`.claude/agents/`** —
   1. seven implementer agents with `Bash`: `product-spec-writer`, `backend-implementer`,
      `ui-implementer`, `migration-implementer`, `api-implementer`, `ops-implementer`,
      `docs-implementer`;
   2. `spec-writer.md` becomes class- and lane-aware and drops "draft exactly one brief";
   3. `contract-reviewer.md` gains its patch-branch mode and the `Bash` it requires (`Read, Grep`
      today) — a **correction the intent does not name**, declared, fenced to read-only `git`;
   4. `test-writer.md` gains `Bash` (intent-named), its `tests/`-only fence restated;
   5. `integration-reviewer.md` judges lane coverage against the contract **and its `decision`**.
10. **`.claude/commands/` (the 14 chain files plus `detect-drift.md`)** —
    1. every chain command's report ends with the resolver's `NEXT` block, and `select-patch.md:40`
       prints `/prepare-evidence <brief-id>`, branch kept as context;
    2. `review-contracts.md` — step 5's critique-appending is deleted, critics write a per-axis
       verdict pointer per candidate, and step 6 becomes Behaviour 6's decision block;
    3. `write-brief.md:6-8` corrected to the routing table for class 2; `decompose-lanes.md:9-10`'s
       inline lane enumeration becomes a pointer, and the command runs the market and prints waves;
    4. `implement-brief.md:7-8`'s "delegates to no agent" clause routes to the brief's `owner`;
    5. `write-brief.md` and `decompose-lanes.md` carry the decision's amendments into the briefs
       they draft; `detect-drift.md` judges the diff against contract **and** decision;
    6. pinned body templates — the comparison shape in `review-contracts.md`, `compare-patches.md`;
       the decision shape in `approve-contract.md`, `select-patch.md`.
11. **`tests/`** —
    1. `lane_catalog_drift.test.ts` grows from today's two-way pin to the ten legs of Behaviour 3;
    2. new: `conveyor.test.ts`, a `CONVEYOR_CLASS_ROUTING` pin, view byte-determinism;
    3. `lane_enum.test.ts` loads `brief-lane-valid`'s keys from `validation-rules.yaml` instead of
       its hand-written `LANES` (`:8-17`) — a sixth lane-list copy the intent's count misses;
    4. `spec.test.ts` — new usage string; `INDEX_FILES` imported, not re-declared;
    5. fixtures — views committed into the five index-bearing fixtures; three `expected-errors.txt`
       (`index-drift`, `rule-disable`, `dispatch-all-kinds`) each gain two `indexes drifted` lines.
12. **`CLAUDE.md`** — output-attention conventions; the mix-and-match rule; lifecycle completeness
    (review-and-comparison step, per-step command annotations, graph-maintainer sole-writer rule,
    override recipe, `/detect-drift` pointer); a conveyor subsection naming the resolver as truth.
13. **Root docs** — `README.md` rewritten to ≤40 lines from the drafted `07-27-2026-readme.md`, its
    dangling `SPEC.md §22` link repaired; `CONTRIBUTING.md` pointed at `/capture-intent`, its five
    dangling `SPEC.md` refs (§11, §13×2, §16×2) and two mis-describing ones (§4, §5) repaired;
    `branch-protection.md:13` four→five; `drift-detection.md:32-39`'s warn-only section rewritten.
14. **Graph data** —
    1. `touches` edges for `evidence-work-class-routing-f0a3` and
       `evidence-critics-literal-panel-e2a7` — determined by those diffs, expected five each across
       `spec-tooling-1a2b`, `spec-schema-2c3d`, `spec-docs-8c1d`, `lifecycle-commands-4f5a`,
       `spec-tests-3a6e`;
    2. `capability-lifecycle-commands-4f5a` gains `.claude/lanes/**`; `capability-spec-docs-8c1d`
       gains `SPEC.md`, `README.md`, `CONTRIBUTING.md`;
    3. the PR #4 `/detect-drift` verdict as a `drift-finding` node with a `flags` edge;
    4. follow-up intents: the malformed cutoff (it must red the graph, reversing
       `decision-critics-literal-panel-9c4f`'s fail-open there) and `/write-tests` on unlaned
       briefs;
    5. the durable dated authorization artifact recording `.gitignore` as intentionally unowned, on
       the `decision-graph-data-unowned-2f7b` precedent.

## Out of scope

1. **No validation rule and no required-field migration.** `owner` is optional and unvalidated, like
   `produced_by`. The lane pin is a test, not a rule.
2. **Phase 10 Step 0** — implementing the malformed-cutoff fix (this change only *captures* it) and
   all other validation-rule and edge-type work from the post-Phase-9 review.
3. **The branch-protection API application** (guide Step 2) stays out-of-diff, and **issues never
   become graph inputs** — one-way sync; no node frontmatter references an issue.
4. **The resolver never executes.** `spec:status` prints and exits 0 — no PR, no node, no branch.
5. **No SPEC v3.1 re-authoring and no root-map edit.** PR #15 landed all four deltas in
   `07-12-2026-delivery-graph.md` (v3.1, owned via `docs/**`), the Phase 9.5 build-order line
   included; root `SPEC.md` has §1-§5 and its §4 is a documents table, not a phase list, so a
   residual edit has no target.
6. **`/write-tests` on an unlaned brief.** `write-tests.md:5-6` refuses any brief whose `lane` is
   not `test-verification`, so widening that precondition changes intended behaviour and rule 5
   routes it to Scope 14.4. Interim, `/write-brief`'s block carries a `kind: action` line —
   independent verification is still required, by re-decomposing with a `test-verification` lane or
   writing tests outside the command — so the conveyor never walks a class-≥1 operator past it.
7. **No repo-hygiene capability.** No capability owns `.gitignore`; Scope 14.5 resolves it via the
   sanctioned "record the paths intentionally unowned" branch, in this PR.

## Behaviour

1. `nextSteps(spec, nodeId)` returns an ordered `Step[]`: `command`, `args`, `rendered` (the exact
   line), `kind`, `why` (the edge or field that turned the routing on). `kind: paste` = every
   argument is a resolved ID; `kind: template` = one argument no graph state can fill (2.2-2.4,
   2.5c, 2.6, 2.7); `kind: action` = the PR action or a judgement reminder.
2. Routing, derived per node type:
   1. `intent` open, no candidates → `/propose-contracts <intent-id>`.
   2. `intent` with live candidates → class ≥2, `/review-contracts <intent-id>`; class ≤1,
      `/approve-contract <contract-id> "<notes>"` per candidate.
   3. `intent` with a comparison, no `selects` → one `/approve-contract <base-id> '<amendments>'`
      per live candidate, through the `proposes` incomings.
   4. `contract` approved, no brief → `/decompose-lanes <contract-id> '<lanes>'` at class 3, else
      `/write-brief <contract-id>` with `/decompose-lanes` as the alternative.
   5. `brief`, no market → (a) `/implement-brief <brief-id>`; (b) `/write-tests <brief-id>` at lane
      `test-verification`; (c) `/propose-patches <brief-id> <n> "<strategies>"` when the brief body
      carries a `## Strategy tension` section, authored by judgement and needing no new field. The
      resolver transcribes that marker; it never infers tension.
   6. `brief` with `patch_market: true`, no comparison → `/compare-patches <brief-id>` plus optional
      `/synthesize-patches <brief-id> "<patch-ids>" "<instruction>"` — three args, the third free.
   7. `brief` with a covering comparison, no `selects` → `/select-patch <patch-id> "<rationale>"`,
      one line per live competitor. The resolver enumerates; it never ranks or recommends.
   8. `patch` selected → `/prepare-evidence <brief-id>` through that patch's `competes-for` edge.
      **The intent's named type-wrong hop.**
   9. final evidence on a brief → the PR action for an unlaned single brief; each outstanding
      sibling's next step while siblings remain; `/integrate <contract-id>` for the last lane.
      `integration` draft → the blocking lane's step; final → the PR action.
3. The lane pin takes the intent's six-way pin to **ten legs**, in `lane_catalog_drift.test.ts`:
   1. the `.claude/lanes/` filename set equals the CLAUDE.md lane table's first column;
   2. it equals `brief-lane-valid`'s `keys`, in order;
   3. it equals `lane_enum.test.ts`'s list, now loaded from the rule rather than hand-written;
   4. every catalog file is well-typed — `eligible_agents`, `default_agent`, both sections;
   5. each file's `## Owns` text is byte-equal to that lane's CLAUDE.md `Owns` cell;
   6. every eligible or default agent resolves to an existing `.claude/agents/<name>.md`;
   7. `default_agent` is a member of `eligible_agents`;
   8. `test-verification`'s `eligible_agents` deep-equals `["test-writer"]`;
   9. the `## Dependency hints` graph is acyclic;
   10. `git ls-files .claude/lanes` lists eight files, so legs 1 and 4-9 cannot pass vacuously.
4. The class branches (2.2, 2.4) read `CONVEYOR_CLASS_ROUTING`, pinned byte-equal to the CLAUDE.md
   work-class table (the `lane_integration_meta` precedent). A pin fits here and not the routing:
   the table is a closed enumeration already normative as text, so a copy compares byte for byte;
   routing is a function of graph shape, with no finite textual form to pin.
5. `pnpm spec:status` prints, per live intent, its stage and next step; `pnpm spec:status <node-id>`
   prints that node's. Read-only, exit 0, no network; a load failure exits through the fail-closed
   `spec:` error channel. Output carries a machine-stable `NEXT` block, one line per step.
6. After its mutating `spec:index && spec:validate` step, each chain command runs `spec:status <id>`
   and reproduces that `NEXT` block **verbatim** — "verbatim" binding the block only. Judgement
   content the command owns is required *around* it: `/review-contracts`'s decision block (per
   candidate: verdict, strongest objection, and the plausible grafts from each non-base candidate,
   above the 2.3 templates) and `/decompose-lanes`'s wave plan. The conveyor prints, never executes:
   a printed command still obeys its class's standing rules.
7. The intent's clause that terminal steps print the PR action is **wrong for multi-lane
   contracts**: the last lane's `/prepare-evidence` is followed by `/integrate`. Terminality is
   derived from graph shape (2.9), so it is terminal only for an unlaned single brief.
8. `trails.md` — one section per intent: contracts, comparison, decision, briefs with lane and
   owner, evidence, integration, each as `id`, `title`, `status`. `status.md` — the intent's
   open-work rows, each carrying the resolver's next step, so views and prints cannot disagree.
9. `/decompose-lanes` reads each named lane's catalog file, weighs `eligible_agents` against the
   brief scope, picks `default_agent` unless it states a reason, writes `owner` plus a one-line
   rationale, carries the decision's amendments into each brief, orders waves from the catalog's
   dependency hints with an optional cap, states per lane why a patch market was or was not opened,
   and invokes `spec:issue-sync` best-effort — one issue per lane brief, one parent per contract.
10. The PR #4 verdict comes from **running** `/detect-drift 4` — none exists today — recorded as a
    `drift-finding` with a `flags` edge or an explicit "no drift" note; a finding is a rule-5 event.

## Trade-offs

1. **+ One truth, unit-testable.** Routing lives in one pure function with one test file rather than
   fourteen prose paragraphs that drift independently; adding a lifecycle step is one edit; every
   printed ID is resolved from `edges.yaml` rather than recalled by an agent.
2. **+ The three consumers cannot diverge**, because there are not three producers: `status.md`, the
   subcommand and every command print are one call. Phase 10's project-sync reuses the derivation.
3. **− The largest implementation, and a runtime dependency on the tooling.** A new module, a
   subcommand, two serializers, the fixture blast radius of Scope 11.5; and if `spec:status` throws,
   the closing report has nothing to transcribe and the operator falls back to `trails.md`.
4. **− Routing fails quiet; policy moves into TypeScript.** A missing `competes-for` edge yields a
   missing step, not a wrong one — the weaker failure mode; and `CONVEYOR_CLASS_ROUTING` is a third
   copy of the work-class table, pinned red, but real, and B's cost.
5. **− Judgement is the resolver's structural boundary, and B's honest limit.** Whether a lane
   deserves a patch market, which candidate a human should select, and what an amendment note says
   are not functions of graph state; those steps enter as templates or through a marker a command's
   judgement authored (2.5c), so "derived" describes the IDs, not the choice to act.

## Acceptance

1. **End-to-end by paste alone** — a real change runs end to end by pasting only printed commands;
   any hand-assembled ID is a defect, including the `/select-patch` → `/prepare-evidence` hop.
   **Honest bound:** the resolver is unit-tested, but no CI job diffs a command transcript against
   `spec:status`; that each command reproduces it is prose-enforced, verified by the acceptance run.
2. **Unit-tested routing** — `nextSteps` on a selected patch returns `/prepare-evidence <brief-id>`
   via `competes-for`, never a branch; on a class-3 contract `/decompose-lanes`, never
   `/write-brief`; on a one-candidate class-1 intent `/approve-contract`.
3. **Lane market and issues** — a multi-lane contract yields lane issues plus a parent whose
   sub-issues and blocked-by match the waves, each brief carrying a market-chosen `owner`. With no
   graph change the sync is a no-op; a hand-closed issue is reopened; final evidence closes it.
4. **The ten-leg pin** — editing one catalog file's lane without CLAUDE.md fails it, as does naming
   an agent no `.claude/agents/` file provides, or a `default_agent` outside `eligible_agents`; and
   `git ls-files .claude/lanes` listing eight files proves no leg passes vacuously.
5. **Navigation** — `spec:status` and `trails.md` answer where an intent stands and what runs next
   without reading `edges.yaml`; `spec:index` run twice is byte-identical.
6. **Gate graduation** — `drift-review.yml` carries no `continue-on-error` on the sensitive-paths
   step, `branch-protection.md` says five, `drift-detection.md` no longer calls the gate warn-only.
   **Honest bound:** it goes red but blocks nothing until an admin marks `drift-review` required.
7. **Self-application** — the flip is live on this PR and it touches `node-types.yaml`, so the PR
   stays red until the schema lane's evidence and `touches → capability-spec-schema-2c3d` land in
   the same diff; and this phase's comparison opens with a verdict table, its decision takes the
   `decision-patch-market-ci-gate-8a2f` shape, bodies wrap at 100 columns.
8. **Review-only, admitted** — whether the market chose well, an `eligible_agents` list is right, a
   dependency hint reflects real blocking, or a printed step is right stays reviewer judgement.

## Risks

1. **Conveyor unavailable when the tooling is broken.** *Mitigation:* the resolver is pure; its
   tests run in `ci`, each command spec states the `trails.md` fallback, and `nextSteps` returns an
   explicit "no derivable next step, and why" entry, never an empty list.
2. **`CONVEYOR_CLASS_ROUTING` drifts from the CLAUDE.md table.** *Mitigation:* the drift pin, on the
   `lane_integration_meta` pattern; named as a cost in Trade-off 4, not claimed away.
3. **`.claude/lanes/` never reaches CI**, or the `INDEX_FILES` widening breaks fixtures.
   *Mitigation:* pin leg 10 asserts `git ls-files`; the fixture updates are in Scope 11.5.
4. **The `## Strategy tension` marker goes unwritten**, so a deserving lane gets none. *Mitigation:*
   Behaviour 9 makes `/decompose-lanes` state per lane why a market was or was not opened.
5. **`spec:issue-sync` failure noise.** GraphQL sub-issue and blocked-by mutations are the least
   stable surface here. *Mitigation:* best-effort — warn, never block; the graph stays truth.
6. **The PR #4 `/detect-drift` run is non-deterministic** — it maps that diff against capabilities
   seeded one PR later. *Mitigation:* record what it yields; a finding routes to a follow-up.

## Critique (spec)

Concern. Derived routing cannot express the implementation hop (no graph write), leaves the
strategy-tension marker unauthored, and duplicates coverage semantics it claims to reuse. Full
finding, with evidence, in `comparison-conveyor-market-890e`.

## Critique (product)

Concern. Resolver removes ID recall, not the duty to run and transcribe it; real advantage,
honestly bounded, not structurally impossible. Full finding in `comparison-conveyor-market-890e`.

## Critique (ux)

Concern. No derivable brief-to-`prepare-evidence` hop (implementation writes no graph state),
partial derivation looks complete, and the named throw-fallback carries no next steps. Full finding
in `comparison-conveyor-market-890e`.

## Critique (architecture)

Concern. One resolver is right, but `.claude/**` gains a runtime dependency on `tools/**`, and the
class-routing literal pins TypeScript to CLAUDE.md prose. Full finding in
`comparison-conveyor-market-890e`.

## Critique (security-privacy)

Concern. No risk entry for the nine Bash grants; verbatim NEXT-block transcription pastes
unvalidated graph ids straight into an operator shell. Full finding in
`comparison-conveyor-market-890e`.

## Critique (compliance-risk)

Concern. "IDs resolved not recalled" is prose-enforced with no artifact proving `spec:status` ran;
the PR #4 verdict lacks any acceptance criterion. Full finding in
`comparison-conveyor-market-890e`.

## Critique (qa-test)

Concern. Nothing pins that a command still calls the resolver, issue-sync idempotence has no oracle,
and Scope 2's reuse claim is false. Full finding in `comparison-conveyor-market-890e`.

## Critique (reliability-ops)

Concern. Single runtime dependency whose stated `trails.md` fallback shares its failure domain; a
hand-typed NEXT block is indistinguishable from a resolved one. Full finding in
`comparison-conveyor-market-890e`.

## Critique (cost-maintainability)

Concern. One routing source makes the six-month change one edit; costs are a new module, tooling
coupling, and unbounded verbatim transcription in fourteen prompts. Full finding in
`comparison-conveyor-market-890e`.

## Critique (release)

Concern. Single resolver eases future routing releases, but the `trails.md` fallback shares the
loader failure and view determinism is not time-invariant. Full finding in
`comparison-conveyor-market-890e`.
