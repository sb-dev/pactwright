---
id: evidence-conveyor-docs-5e91
type: evidence
title: Docs-spec lane implemented — CLAUDE.md A7 amendment and lifecycle completion, the conveyor / output-attention / effective-contract sections, and the README/CONTRIBUTING/branch-protection/drift-detection repairs
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-docs-9e31` (lane `docs-spec`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`d666190`: five files, +245/−55, no code, no schema, no graph data of its own.

## What landed — `CLAUDE.md` (Scope 12)

**A7's governing-doc half — the rule-5 edit this lane exists to carry.** Lifecycle step 5 read
"Implementation (code only; no graph writes)". It now states that implementation writes code and
project files and performs **exactly one** graph write: the brief moves to `implemented`, *through*
graph-maintainer. It names only the terminal status and encodes **no** `status: approved`
precondition — every brief in this decomposition is created `draft` and nothing in the repo moves a
brief to `approved`, so a precondition would have made `/implement-brief` refuse all seven. The text
cites `decision-conveyor-derived-5a91` as the scope-integrity rule 5 approval.

**Step 6's parenthetical corrected in the same pass.** It claimed the brief becomes `implemented` at
the evidence step, which A7 makes false the moment it lands.

**CC-13(a) — the lifecycle map completed.** A review-and-comparison step (class 2+) was inserted
between "Candidate contracts proposed" and "Human selection", showing the edge it authors
(`comparison —compares→ contract`, one per live candidate) as every other step does; an integration
step was added as step 8; and **every** numbered step now names the command that performs it. The
four patch-market commands are dispositioned in one stated sentence — a per-lane sub-loop inside the
implementation step, documented in `### Patch market`, deliberately **not** numbered steps. CC-13
permitted either resolution; recording the choice was mandatory, and silence would not have been a
discharge.

**Three new rules in `## Rules`:** graph-maintainer as the sole writer of `specs/nodes/` and
`specs/graph/edges.yaml` (which A7's step now depends on); the override recording recipe, taking its
field names from the schema rather than inventing them, with the honest bound that `approved_by` is
*provenance* not authentication and what makes a waiver independent is the CODEOWNERS review an
`override-*` node trips; and the `/detect-drift` pointer, naming a real divergence as a rule 5 event.

**Three new sections.** `## The conveyor` names `tools/conveyor.ts`'s `nextSteps` as the single
source of routing truth, states A1's degraded fallback honestly (template-shaped, marked, never a
second routing source), and carries the two standing bounds — the conveyor prints and never
executes, and terminality is derived from graph shape. `### Output attention` carries the
conventions and closes with the explicit sentence that they are **guidance, not gates**: no
validation rule reads them and no length is machine-checked. `### The effective contract` states the
mix-and-match rule and folds in CC-10(d)'s doctrine half.

**CC-14's `CLAUDE.md` half** — "and the release's `includes` target" deleted from the lane-model
rule. Verified against the schema first: no `release` node type and no `includes` edge type exist,
so it was a forward reference to a type nobody has proposed. Deleting cost nothing and "the
contract's coverage artifact" already carried the sentence's meaning.

**CC-13(b) and CC-10(d), both discharged by POINTING rather than restating.** The conveyor section
points at `specs/schema/node-types.yaml` for the single "live intent" definition and writes no
second copy; the effective-contract section points at `.claude/agents/integration-reviewer.md` for
the canonical `integration_sections` keys. Both follow the point-never-re-list convention already
established in `## Lane model and integration`.

**CC-12's standing-convention half.** A paste-only acceptance claim must name its discharging run,
record that run's verdict in the final `integration` node's `combined-test-run` section
(cross-referenced from `compliance-verdict`), and name the remediation on failure — a
`drift-finding` plus a rule 5 route, with the change not completing on a failed run.

## What landed — root and docs (Scope 13)

**`README.md`** rewritten to exactly **40 lines** from the 838-line draft in
`docs/research-logs/07-27-2026-readme.md`, harvesting its voice and shape and **none** of its
claims: `init.sh`, `/ingest`, `/next-actions`, `/derive-cycles`, `/ops-intake`, `/review-queue`,
`/plan-workflow`, providers, budgets and campaigns do not exist here. The false status claim
("`main` currently holds the licence and governance scaffold only") and the pointer to open
bootstrap PR #1 are gone, replaced by what the repository actually is: Checkpoint 1 delivery,
running on itself. The dangling `§22` became `§4` — verified, `SPEC.md`'s build order is
`§4 Documents and build order`. Every `/`-command it names exists in `.claude/commands/`.

**`CONTRIBUTING.md`** — step 1 now runs `/capture-intent` in place of "Open an issue", consistent
with the one-way issue sync (issues are a generated view, never a graph input). All **seven** broken
`SPEC.md` references were repaired: the five dangling (`§11`, `§13`×2, `§16`×2) and the two
mis-describing (`§4` called "graph layout", `§5` called "graph rules"). Repairs **repoint** at
targets that exist — `docs/branch-protection.md`'s two sections, `.claude/commands/`, and
`CLAUDE.md`'s `## Structure` / `### Where canonical truth lives` / `## Rules` — and add nothing to
`SPEC.md` (contract Out of scope 5). The lifecycle paraphrase was rewritten as an ordered list of
named steps with **no `→`**, because CLAUDE.md rule 4 reserves arrows for edge direction, never
lifecycle order. Its stale future tense about code-owner approval was dropped; CODEOWNERS is live.

**`docs/branch-protection.md`** — CC-10(b). The count went to **"These six checks"** and a
`drift-review` row was added, with a companion paragraph in the existing `patch-comparison`
register: no event-level `paths:` filter so it always reports and is safe to mark required, and the
honest bound that after the flip the job goes red but blocks nothing until an admin marks it
required. A clarifying clause distinguishes the **Check** column (GitHub status-check names, which
are job ids) from `specs/schema/checks.yaml`'s waivable registry — where the drift gate is
registered as `check-diff`, not `drift-review` — so the new row is not misread as a registry claim.
The `ci` row's Enforces cell gained A9's transcription step, and the CODEOWNERS bullet list gained
`/specs/nodes/decision-*`.

**The count was touched twice, deliberately.** `:13` already said "four" over a five-row table, and
CC-10(b) adds a sixth. Landing the contract's literal "four→five" wording and forgetting the new row
was the failure mode that bullet existed to prevent.

**`docs/drift-detection.md`** — the `## Warn-only, then blocking` section rewritten as
`## Enforcement, layer by layer`, stating that the workflow as a whole is **not** "no longer
warn-only": the deterministic `check-diff` layer is blocking, the Drift map step keeps its own
`continue-on-error` deliberately as a reporter, and the semantic layer stays warn-only until the CI
Claude step is pinned. The same blocks-nothing-until-an-admin bound is carried. **A verified
correction to the contract's Scope text:** the stale span is `:32-40`, not Scope 13's `:32-39` — the
flip-instruction bullet ends at `:40`. `:41-46` stayed true after the flip and was not edited.

## Verification observed

Twelve acceptance items, each checked mechanically rather than asserted:

| Check | Result |
|---|---|
| `grep -c "no graph writes" CLAUDE.md` | **0** — A7 landed |
| `grep -c "release's" CLAUDE.md` | **0** — CC-14 landed |
| `wc -l README.md` | **40** — the hard ≤40 budget met exactly |
| `SPEC.md §N` with N>5 in README + CONTRIBUTING | **0 and 0** |
| `grep -c "These six checks"` | **1**, over **6** rendered data rows |
| `decision-*` in the CODEOWNERS bullet list | present |
| `grep -c "→" CONTRIBUTING.md` | **0** — rule 4 honoured |
| `drift-review.yml` `continue-on-error:` directives | **1**, on the Drift map step — so the docs match the as-built workflow |
| "live intent" definitions repo-wide | **1**, in `node-types.yaml`; `CLAUDE.md` points at it |
| `spec:validate` | OK, 20 rules, 0 errors |
| `git status --short` | exactly the five files (plus the graph write recording this lane) |
| over-100-column lines | 4 in `CLAUDE.md`, 5 in `docs/branch-protection.md` — **all markdown table rows** |

The 100-column bound is honoured for prose; a markdown table row cannot wrap without breaking the
table, and both files' pre-existing tables already exceeded it. `CONTRIBUTING.md` went from seven
over-length lines to **zero**.

## Capability coverage — a same-PR blocker, discharged

This lane's diff spans `CLAUDE.md`, `README.md`, `CONTRIBUTING.md` and two files under `docs/`.
Before this change `capability-spec-docs-8c1d` owned only `[CLAUDE.md, docs/**]`, so `README.md` and
`CONTRIBUTING.md` were owned by **no** capability and this evidence's `touches` could not have
resolved them — the brief named that explicitly as a blocker to be resolved in the same PR.
`data-migration`'s Scope 14.2 widened the capability to
`[CLAUDE.md, SPEC.md, README.md, CONTRIBUTING.md, docs/**]`, which is what makes this lane's single
`touches` edge sufficient. Cross-lane dependency, discharged, not assumed.

## Deviations and residuals

1. **The lifecycle renumbering broke four references this lane does not own.** Inserting the
   review-and-comparison step after step 2 shifts every number after it. Verified downstream
   citations: `.claude/commands/approve-contract.md` and `.claude/agents/contract-reviewer.md`
   (both "step 3" → step 4), `.claude/commands/prepare-evidence.md` ("step 6", additionally wrong in
   substance under A7 since the brief is already `implemented` by then), and
   `.claude/commands/capture-intent.md` ("step 1", **unaffected**). This lane edited none of them —
   the three command files are `api-integration`'s and the agent file is `product-spec`'s. The
   `prepare-evidence.md` citation was rewritten by `api-integration` to name only the status changes
   that command still makes, which removes its number entirely; `approve-contract.md:15` and
   `contract-reviewer.md:7` still say "step 3" and are **stale as of this commit**. Handed to those
   lanes and to integration, not silently tolerated.
2. **Two out-of-slice defects, recorded and deferred rather than fixed** (rule 5, middle branch —
   Acceptance 10 required one or the other explicitly). (a) `docs/drift-detection.md:5` carries a
   sixth dangling `SPEC §15`, outside the `:32-40` span this lane rewrote. (b) `CLAUDE.md`'s
   `## Structure` block omits `specs/schema/checks.yaml` and labels `validation-rules.yaml` "(stub)"
   though it is 140 lines of live rules. Both are real, both are in files this lane owns, and
   **neither is in the effective contract** — so widening to fix them would have been exactly the
   silent scope drift rule 5 forbids. They are surfaced here for a follow-up intent. This lane
   authors no graph writes, so capturing that intent from inside it was not available.
3. **`decision-conveyor-derived-5a91` anchors A7 to "step 5"**, which is a **pre-insertion** anchor.
   A7's target is the *Implementation* step whatever number it carries after the renumbering — it is
   step 6 now. Recorded so a later reader does not read the decision's "step 5" as a mismatch.
4. **CC-12's other two halves are not this lane's and are not claimed here.** The transcript-fixture
   regression artifact is `test-verification`'s (landed) and A9's CI transcription job is
   `observability-release`'s (landed and verified). This lane wrote only the standing convention.

## Discharge key (CC-10(d))

This brief is the named discharger for **A7** (the governing-doc half), **CC-10(b)**, **CC-10(d)**
(the doctrine half), **CC-12** (the naming half), **CC-13** and **CC-14** (the `CLAUDE.md` half).
