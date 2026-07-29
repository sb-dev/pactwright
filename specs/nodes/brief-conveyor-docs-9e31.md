---
id: brief-conveyor-docs-9e31
type: brief
title: Conveyor governing docs — CLAUDE.md step-5 amendment (A7), output-attention and mix-and-match conventions, lifecycle completeness, the conveyor subsection, and the README/CONTRIBUTING/branch-protection/drift-detection repairs
status: implemented
created: 2026-07-28
lane: docs-spec
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
`docs-spec` lane of `intent-self-guiding-delivery-loop-6d79` (status: open, class 3), per decision
`decision-conveyor-derived-5a91`. This lane owns the governing and root documentation ONLY —
contract Scope 12 (`CLAUDE.md`) and Scope 13 (`README.md`, `CONTRIBUTING.md`,
`docs/branch-protection.md`, `docs/drift-detection.md`) — and writes no code, schema, command,
agent, workflow, catalog file, graph data or test; every one of those surfaces belongs to one of the
six sibling lanes named under `## Non-scope`. The effective contract is
`contract-conveyor-derived-4c8c` **plus** the sixteen amendments A1–A16 in
`decision-conveyor-derived-5a91` **plus** the sixteen common-core findings CC-1–CC-16 under
`## Common-core findings` in `comparison-conveyor-market-890e`, binding in full — the comparison's
text is the binding text, and nothing below paraphrases it as a substitute. **Bootstrap:** this
decomposition predates the lane market this very contract builds — `.claude/lanes/` does not exist,
`owner` is not a field in `specs/schema/node-types.yaml`, and none of the seven implementer agents
exist — so no brief in this decomposition carries an `owner` key, and lane owners are assigned by
`/decompose-lanes` only after this change lands.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Every line number below was verified
against the working tree on 2026-07-28. **They are current-tree anchors: re-confirm each before
editing, since earlier edits in the same file shift them.**

- **`CLAUDE.md` — 260 lines, the only governing-doctrine file and the sole `CLAUDE.md` editor in
  this decomposition.** Verified structure: `## Structure` `:7-20`; `### Where canonical truth
  lives` `:22-29`; `### Node IDs` `:31-34`; `## Rules` `:36-62` with scope-integrity **rule 5** at
  `:52-62`; `## Lifecycle (numbered steps; each shows the edge it authors)` `:64-73` with the six
  numbered steps at `:66-73` and **step 5 — "Implementation (code only; no graph writes)" — at
  `:71`**; `## Work-class routing` `:81-102` with the class table at `:89-94`; `### Critic routing`
  `:104-130`; `### Proposal comparison` `:132-155`; `## Lane model and integration` `:157-206`,
  whose rule 2 carries **"the release's `includes` target" at `:186-187`**; `### Patch market`
  `:208-260`.
- **The house voice to imitate, not re-invent.** `### Critic routing` (`:104-130`) and
  `### Patch market` (`:208-260`) are the sibling-subsection register for a new `###` subsection
  under an existing `##`. Two conventions are already load-bearing and both apply to every edit
  below: (a) the **"Honest bound:"** paragraph shape (`:197-206`, `:255-260`) — state what a green
  check asserts and, explicitly, what it does not; (b) **point, never re-list** — `:201-204` defers
  the canonical `integration_sections` key list to `.claude/agents/integration-reviewer.md` rather
  than copying it. Both are reused in shape by steps 7, 9 and 12.
- **`brief-patch-market-docs-e2b5`** — the Phase 9 `docs-spec` brief for the same file. It is the
  precedent for this lane's whole shape: prose only, no graph mutation of its own, acceptance by
  read-against-anchor rather than by test, and a Non-scope section naming the identifier owner for
  every term the prose spells. Reuse its framing; do not re-derive it.
- **`README.md` — 19 lines.** `SPEC.md` is linked twice: at `:7` carrying the **dangling `§22`**
  ("See [`SPEC.md`](./SPEC.md) §22 for the build order") and at `:11` as a bare link (correct,
  leave it). `:7` also carries a **false status claim** — "`main` currently holds the licence and
  governance scaffold only", plus a pointer to bootstrap PR #1 — contradicted by the working tree,
  which holds the full spec graph, schema, tooling, six workflows and nine phases of nodes.
- **`SPEC.md` — 80 lines, exactly five sections.** `§1 The problems`, `§2 The fix`, `§3 What
  emerges`, **`§4 Documents and build order`** (a five-row documents table, `:64-70`), `§5 Done
  when`. So the build order README `:7` points at is **§4, not §22**, and every `SPEC.md §N` with
  N > 5 anywhere in this repo is dangling. `SPEC.md` itself is **not** edited by this lane (contract
  Out of scope 5).
- **`CONTRIBUTING.md` — 36 lines.** Five **dangling** refs: `§11` at `:25`; `§13` at `:12` and
  `:26`; `§16` at `:14` and `:27`. Two **mis-describing** refs: `§4` at `:23` called "graph layout"
  (SPEC `§4` is *Documents and build order*) and `§5` at `:24` called "graph rules" (SPEC `§5` is
  *Done when*). `/capture-intent` appears **nowhere** in the file — step 1 at `:9` says "Open an
  issue". `:14` additionally carries a stale future tense ("Once the bootstrap PR (#1) is merged,
  schema changes **will** require code-owner approval") though `.github/CODEOWNERS` is live today.
- **`docs/branch-protection.md` — 69 lines.** `:13` reads "These **four** checks must pass" over a
  table whose header is `:16-17` and whose **five** data rows are `:18-22` (`ci`, `spec-index`,
  `spec-validate`, `pr-evidence`, `patch-comparison`) — the off-by-one is confirmed. `:24-30` is the
  required-check safety rule (a check filtering at the **event** level with a workflow-level
  `paths:` filter must never be marked required, or a PR it never runs for is blocked forever), and
  `:32-38` is the `patch-comparison` "always reports, so it is safe to mark required" paragraph plus
  its blocks-nothing-until-an-admin-enables-it bound — **that paragraph is the exact template for
  CC-10(b)'s new row's companion prose.** `## Required reviews (CODEOWNERS)` is `:40-56` and
  `## How pr-evidence is satisfied` is `:58-69`; both are the honest repair targets for
  CONTRIBUTING's dangling `§16` and `§13`.
- **`docs/drift-detection.md` — 46 lines. VERIFIED CORRECTION TO THE SCOPE TEXT: the stale span is
  `:32-40`, not Scope 13's `:32-39`.** The heading `## Warn-only, then blocking` is `:32`; the false
  "is **warn-only** / `continue-on-error: true`" claim is `:34-36`; the flip-instruction bullet
  begins at `:38` and **ends at `:40`** ("on ~5 real PRs."). `:41-42` (the semantic layer stays
  warn-only until the CI Claude step is pinned) and `:44-46` (every blocking check stays waivable by
  an `override` with a `waives → check-diff` edge) **stay true after the flip and are not edited.**
- **`docs/research-logs/07-27-2026-readme.md` — 838 lines, the drafted source for the README
  rewrite.** Harvest from `## Quick start` (`:183-199`), `## Core commands` (`:201-217`),
  `## Repository model` (`:219-263`) and `## Status` (`:351-371`). **It describes the whole
  five-checkpoint product, most of which does not exist in this repository** — `init.sh`,
  `/ingest`, `/next-actions`, `/derive-cycles`, `/ops-intake`, `/review-queue`, `/plan-workflow`,
  providers, budgets and campaigns are all unbuilt, and its own `## Status` list is entirely
  unchecked while nine delivery phases have in fact landed. Harvest its **voice and shape**; never
  its claims.
- **`.claude/commands/` — 16 files.** 14 chain commands plus `detect-drift.md` (Scope 10's surface,
  15 files) plus `update-spec-graph.md`, which is not a chain step. `detect-drift.md` exists and is
  the resolvable target for Scope 12's `/detect-drift` pointer. **This lane edits none of them.**
- **`specs/schema/node-types.yaml`** — the `override` block is `:46-51` with `required_fields: [id,
  type, title, reason, approved_by, expires]`. Scope 12's override recipe takes its field names from
  here, verbatim; it invents none. The `brief` block is `:22-33` with `status_values: [draft,
  approved, implemented]`, and the `intent` block's `status_values: [open, addressed, rejected]` is
  at `:15` — the anchor CC-13's "live intent" definition attaches to, **authored by the
  data-migration lane, not here**.
- **`specs/schema/checks.yaml`** — the flat named-check registry, `checks:` at `:8` with entries
  `:9-17` (`ci`, `spec-index`, `spec-validate`, `pr-evidence`, `check-diff`, `patch-comparison`,
  `drift`). This is the vocabulary a `waives` edge target must come from, and the reason the
  branch-protection "Check" column is a **different namespace** from this registry (see step 12).
- **`specs/schema/edge-types.yaml` and `node-types.yaml`, checked for CC-14.** The declared node
  types are `intent, contract, brief, evidence, decision, override, capability, drift-finding,
  comparison, integration, patch`; the declared edge types are `proposes, selects, decomposes,
  evidences, supersedes, waives, compares, touches, flags, integrates, competes-for, synthesizes`.
  **There is no `release` node type and no `includes` edge type** — CC-14's claim about `CLAUDE.md`
  `:186-187` is confirmed against the schema, not assumed.
- **`capability-spec-docs-8c1d`** — `paths: [CLAUDE.md, docs/**]`. `README.md` and `CONTRIBUTING.md`
  are **not owned by any capability today**; contract Scope 14.2 (data-migration lane) widens this
  capability to `SPEC.md`, `README.md`, `CONTRIBUTING.md`. Its body's "Owns the governing-doctrine
  document `CLAUDE.md`" (singular) goes stale on that widening — **that node edit is
  data-migration's, not this lane's.** See `## Cross-lane dependencies`.
- **`.claude/agents/integration-reviewer.md`** — the single canonical `integration_sections` list;
  `compliance-verdict` is the key CC-10(d)'s doctrine attaches to. This lane writes the doctrine
  into `CLAUDE.md` and **points at** that file; the agent-instruction half is the product-spec
  lane's.

## Pinned decisions (the amendments THIS lane discharges — binding constraints)

- **A7 — the governing-doc half. THIS IS THE RULE-5 BEHAVIOUR CHANGE AND THIS LANE CARRIES ITS
  DOCUMENT.** `CLAUDE.md` lifecycle step 5 (`:71`) today reads "Implementation (code only; no graph
  writes)". It is amended so `/implement-brief` flips its brief to `implemented` **via
  graph-maintainer, as its single graph write**. This **changes intended behaviour**;
  `decision-conveyor-derived-5a91`'s *Rule-5 declaration* (`:155-161`) is the scope-integrity rule 5
  approval, recorded before any brief was written, and the amended text **must cite that decision by
  id**. Two constraints ride with it: (i) graph-maintainer remains the **sole writer** of
  `specs/nodes/` and `specs/graph/edges.yaml` — the flip goes *through* it, and the amended step
  must say so, not merely permit a write; (ii) the amended step must name only the **terminal**
  status (`implemented`) and must **not** encode a `status: approved` precondition — every brief in
  this decomposition is created at `draft`, nothing in the repo moves a brief to `approved`, and a
  precondition would make `/implement-brief` refuse all seven (see `## Cross-lane dependencies`).
- **A7 consequential, same amendment: lifecycle step 6's parenthetical.** `:73` reads "(brief
  becomes implemented; intent becomes addressed)". After A7 the brief reaches `implemented` at the
  implementation step, so the evidence step no longer performs that flip and the parenthetical is
  false the moment A7 lands. Correct it in the same pass. The "intent becomes addressed" half is
  aligned to the already-enforced `coverage-coherence` rule stated at `:183-189` (a multi-brief
  contract reaches `addressed` only via a final `integration`) — a doc-correctness alignment to an
  existing rule, **not** a second behaviour change.
- **CC-13, gap (a) — the patch-market four.** No numbered lifecycle step owns `/propose-patches`,
  `/synthesize-patches`, `/compare-patches` or `/select-patch` (`CLAUDE.md:64-73`). **Pinned
  resolution: scope the per-step annotation to the canonical numbered steps and state, in one
  sentence at the foot of the lifecycle block, that the four patch-market commands are a per-lane
  sub-loop inside the implementation step, documented in `### Patch market`** — not four additional
  numbered steps. Recording the choice is mandatory; CC-13 permits either, and silence is not a
  discharge.
- **CC-13, gap (b) — "live intent" is defined exactly ONCE, and not here.** The single definition is
  authored by the **data-migration** lane in `specs/schema/node-types.yaml` (the `intent` block at
  `:12-15`, whose `status_values` lack `superseded`). `CLAUDE.md`'s conveyor subsection **points at
  that definition and writes no second one.** If this lane finds it needs a definition the schema
  does not yet carry, that is a cross-lane reconciliation, never a second copy.
- **CC-14 — the `CLAUDE.md` half only.** `:186-187` calls the `integration` node "the contract's
  coverage artifact and the release's `includes` target". Verified against the schema: **no
  `release` node type and no `includes` edge type exist. Pinned resolution: delete the clause**
  rather than capture an intent — it is a forward reference to a type nobody has proposed, deleting
  costs nothing, and "the contract's coverage artifact" (which is true and already carries the
  sentence's meaning) survives intact. The `tools/spec.ts:11` "four files" half of CC-14 is
  **domain-backend's**.
- **CC-10(b) — the drift-review row, and the count is touched TWICE.** `docs/branch-protection.md`
  `:13` says "four" over five rows today; CC-10(b) adds a sixth row for `drift-review`. **The
  sentence that ships must read "six", not "five".** Landing the contract's literal "four→five"
  wording and forgetting the new row is the failure mode this bullet exists to prevent: fix the
  off-by-one and add the row in the same edit, then count the rendered rows.
- **CC-10(d) — the doctrine half only.** `CLAUDE.md` states, as standing doctrine, that an
  `integration` node's **`compliance-verdict`** section enumerates **each amendment of the
  contract's selecting decision and names that amendment's discharging brief**. For this contract
  that is **32 items — A1–A16 plus CC-1–CC-16** — and the discharge key is the lane assignment
  recorded in the seven briefs of this decomposition. The doctrine sentence **points at**
  `.claude/agents/integration-reviewer.md` for the canonical section keys (the established
  point-never-re-list convention at `CLAUDE.md:201-204`) and re-lists none of them. **The
  `integration-reviewer.md` agent-instruction half of CC-10(d) is the product-spec lane's**; this
  lane writes doctrine, that lane writes the instruction, and neither restates the other.
- **CC-12 — the headline acceptance gets a named subject, evaluation point and remediation.** This
  lane discharges it in two places: (i) as **standing convention** in `CLAUDE.md`'s conveyor
  subsection — a paste-only acceptance claim names its discharging run, records its verdict in the
  final `integration` node's `combined-test-run` section (cross-referenced from
  `compliance-verdict`), and names the remediation on failure; and (ii) **concretely for this
  contract**, in this brief's `## Acceptance & verification`. **The transcript-fixture regression
  artifact — capturing each printed block and replaying it against the recorded graph — is the
  test-verification lane's half**, and A9's CI transcription job is observability-release's; this
  lane must not claim either exists as prose.
- **Describe the as-built mechanism, never a divergent one.** Every identifier this lane's prose
  spells (`tools/conveyor.ts`, `nextSteps`, `spec:status`, the `NEXT` block,
  `CONVEYOR_CLASS_ROUTING`, `trails.md`, `status.md`, `owner`, `.claude/lanes/`, `drift-review`,
  `check-diff`, `spec:issue-sync`) is authored by another lane. Spell each byte-correctly and build
  none. If the prose cannot be written truthfully against what a sibling lane actually ships, that
  is a drift signal to surface under rule 5, **not** a prose patch (the
  `brief-patch-market-docs-e2b5` precedent).
- **Self-application (contract Acceptance 7).** Everything this lane authors — including this brief
  body — hard-wraps at 100 columns, and the output-attention conventions it writes into `CLAUDE.md`
  are **guidance, not gates**: no length validation rule is authored or implied by any of them.

## Files to create

None. This lane creates no files.

## Files to modify

1. `/home/samir/workspace/pactwright/CLAUDE.md` — Scope 12 in full, plus A7's governing-doc half,
   CC-13, CC-14's `CLAUDE.md` half, CC-10(d)'s doctrine half and CC-12's standing convention.
2. `/home/samir/workspace/pactwright/README.md` — Scope 13, rewrite to ≤40 lines.
3. `/home/samir/workspace/pactwright/CONTRIBUTING.md` — Scope 13, `/capture-intent` plus the seven
   broken `SPEC.md` references.
4. `/home/samir/workspace/pactwright/docs/branch-protection.md` — Scope 13's miscount plus
   CC-10(b).
5. `/home/samir/workspace/pactwright/docs/drift-detection.md` — Scope 13, the `:32-40` rewrite.

No other file is touched. This lane authors no node, no edge and no index regeneration of its own.

## Ordered implementation steps

Steps 1–9 edit `CLAUDE.md`; steps 10–13 edit one root/docs file each; step 14 is the closing pass.
**Do the `CLAUDE.md` work as a single top-to-bottom pass in document order and re-confirm each
anchor immediately before its edit — every edit shifts every anchor below it, and the lifecycle
renumber in step 2 shifts the most.**

1. **A7 — amend the lifecycle Implementation step (`:71`).** Replace "Implementation (code only; no
   graph writes)" with text stating that implementation writes code and project files and performs
   **exactly one** graph write: `/implement-brief` moves its brief to `implemented`, **through
   graph-maintainer**, which remains the sole writer of `specs/nodes/` and `specs/graph/edges.yaml`.
   Name the terminal status only — **no `status: approved` precondition** (pinned decision above).
   Cite `decision-conveyor-derived-5a91` in the text as the scope-integrity rule 5 approval for the
   behaviour change. Then correct step 6's parenthetical at `:73` per the A7-consequential pinned
   decision: the brief reaches `implemented` at implementation, and a multi-brief contract's intent
   reaches `addressed` only via the final `integration` (`coverage-coherence`, already stated at
   `:183-189`).

2. **CC-13(a) — complete the lifecycle map.** Insert the **review-and-comparison step (class 2+)**
   between "Candidate contracts proposed" and "Human selection", showing the edge it authors
   (`comparison —compares→ contract`, one edge per live candidate) as every other step does, and
   annotate **every** numbered step with the command that performs it (`/capture-intent`,
   `/propose-contracts`, `/review-contracts`, `/approve-contract`, `/write-brief` or
   `/decompose-lanes`, `/implement-brief`, `/prepare-evidence`, and `/integrate` for a multi-lane
   contract). Then add the one-sentence disposition of the patch-market four per the pinned
   resolution: `/propose-patches`, `/compare-patches`, `/synthesize-patches` and `/select-patch` are
   a per-lane sub-loop inside the implementation step, documented in `### Patch market`,
   deliberately not numbered steps. **The insertion renumbers the steps after it** — see step 14 and
   `## Cross-lane dependencies`, because four files owned by two other lanes cite step numbers.

3. **Scope 12 — the graph-maintainer sole-writer rule.** Add it to `## Rules` (`:36-62`) as a
   numbered rule in that section's voice: graph-maintainer is the only writer of `specs/nodes/` and
   `specs/graph/edges.yaml`; every command that changes the graph delegates to it; commands and
   agents propose, graph-maintainer writes. Keep it consistent with step 1's A7 text, which now
   depends on it.

4. **Scope 12 — the override recording recipe.** Add it adjacent to the new sole-writer rule: an
   `override` node records `reason`, `approved_by` and `expires` (the field names taken from
   `specs/schema/node-types.yaml:46-51`, not invented), plus a `waives` edge whose target is a check
   **named in `specs/schema/checks.yaml`**. Add the honest bound in the existing register: the
   `approved_by` field is *provenance*, not an authentication — what makes a waiver an independent
   approval is the CODEOWNERS review that adding an `override` node trips. This is the doctrine half
   of what `docs/branch-protection.md:49-56` already documents mechanically; point at it rather than
   duplicating the mechanism.

5. **Scope 12 — the `/detect-drift` pointer.** One sentence, adjacent to the override recipe: drift
   between a merged diff and the graph is detected by `/detect-drift <pr-number|branch>` and its
   deterministic `spec:check-diff` / `spec:drift-map` layers, documented in
   `docs/drift-detection.md`; a real divergence is recorded as a `drift-finding` node (via
   graph-maintainer) and is a **rule 5 event**, never a silent absorption.

6. **Scope 12 — the output-attention conventions.** Add a `###` subsection (the `### Critic
   routing` register). Content, per the intent's conventions paragraph: the reader's attention is
   the budget; critic findings live **only** in the `comparison` node and `/review-contracts` writes
   a one-line-per-axis verdict pointer into each candidate instead of full critique sections;
   contract bodies stay pure spec (target ≤250 lines); node prose hard-wraps at 100 columns; binding
   amendments and fixes are **numbered markdown lists**, never inline enumerations; comparison
   bodies open with a verdict table of ≤10 rows whose cells are ≤15 words, with the shared-core
   prose outside the table (exemplar `comparison-patch-market-synthesis-7b1d`); decision bodies take
   the `decision-patch-market-ci-gate-8a2f` shape — SELECTED/REJECTED lead line, amendments as a
   numbered list, ≤120 lines, closing next-step print. **Close the subsection with the explicit
   sentence that these are guidance, not gates: no validation rule reads them and no length is
   machine-checked.**

7. **Scope 12 — the mix-and-match rule.** Add a `###` subsection stating: **the effective contract
   is the approved contract plus its selecting decision's amendments** — base candidate, grafts from
   named siblings, and mandatory fixes are all binding; `/write-brief` and `/decompose-lanes` carry
   those amendments into every brief they draft; every review judged against the approved
   contract — `contract-reviewer`, `integration-reviewer` and drift review included — reads the
   contract **and** its selecting decision together; **the approved contract body is never edited**;
   and an amendment
   that would change intended behaviour returns to human approval under rule 5. Name
   `decision-patch-market-ci-gate-8a2f` as the precedent this formalizes and
   `decision-conveyor-derived-5a91` as its current instance. Fold **CC-10(d)'s doctrine half** in
   here or immediately after it: an `integration` node's `compliance-verdict` section enumerates
   each amendment of the selecting decision and names its discharging brief — for
   `contract-conveyor-derived-4c8c` that is 32 items (A1–A16 and CC-1–CC-16) — and **point** at
   `.claude/agents/integration-reviewer.md` for the canonical section keys rather than re-listing
   them.

8. **Scope 12 — the conveyor subsection.** Add a `###` subsection naming **`tools/conveyor.ts`'s
   `nextSteps(spec, nodeId)` as the single source of routing truth**: `spec:status` is its read-only
   surface; `trails.md` and `status.md` are rendered from the same derivation; every chain command's
   closing report reproduces the resolver's machine-stable `NEXT` block **verbatim**, with the
   command's own judgement content required *around* it, never inside it. State A1's degraded-mode
   fallback honestly — each command retains a static, **template-shaped** fallback print in its own
   markdown, explicitly marked as the resolver-unavailable path, carrying **no** resolved IDs, and
   never a second authoritative routing source. State the conveyor's two standing bounds: it
   **prints, never executes** (a printed command still obeys its class's standing rules — a
   recommendation is never an exemption), and terminality is derived from graph shape, so the PR
   action is terminal only for an **unlaned single brief** while a multi-lane contract's last lane
   `/prepare-evidence` is followed by `/integrate` (contract Behaviour 7). **CC-13(b):** where the
   subsection says `spec:status` reports per **live intent**, point at the single definition in
   `specs/schema/node-types.yaml` authored by the data-migration lane — write no second definition.

9. **CC-12 (standing-convention half) and CC-14, closing the `CLAUDE.md` pass.** In the conveyor
   subsection, add the acceptance-recording convention: a paste-only acceptance claim **names its
   discharging run**, records that run's **verdict in the final `integration` node's
   `combined-test-run` section** (cross-referenced from `compliance-verdict`), and names the
   **remediation if it fails** — a `drift-finding` plus a rule 5 route, with the change not
   completing on a failed run. Then discharge **CC-14**: delete "and the release's `includes`
   target" from the lane-model rule at `:186-187`, leaving "the contract's coverage artifact"
   intact.

10. **Scope 13 — rewrite `README.md` to ≤40 lines.** Draft from
    `docs/research-logs/07-27-2026-readme.md` (`## Quick start` `:183-199`, `## Core commands`
    `:201-217`, `## Repository model` `:219-263`, `## Status` `:351-371`), harvesting **voice and
    shape only**. Required content: a true status paragraph (delete the "licence and governance
    scaffold only" claim and the PR #1 pointer at `:7`; state what the repository actually is
    today — Checkpoint 1 delivery, running on itself); a **one-screen chain quickstart** naming only
    commands that exist in `.claude/commands/`, spelled exactly as those files spell them; a short
    setup block; and the SPEC/CONTRIBUTING/LICENSE pointers. **Repair the dangling `§22` at `:7` to
    `§4`** (verified: SPEC's build order is `§4 Documents and build order`); keep the bare `SPEC.md`
    link at `:11` unchanged. **Do not import any unbuilt claim from the draft** — `init.sh`,
    `/ingest`, `/next-actions`, `/derive-cycles`, `/ops-intake`, `/review-queue`, `/plan-workflow`,
    providers, budgets and campaigns do not exist here, and the draft's own unchecked `## Status`
    list is stale in the opposite direction. Verify the budget with `wc -l README.md` (≤40, hard).

11. **Scope 13 — `CONTRIBUTING.md`.** Four edits, all verify-then-cite:
    - `:9` — point step 1 at **`/capture-intent`** in place of "Open an issue", consistent with the
      contract's one-way issue sync (issues are a generated *view*; never a graph input).
    - `:3` — the lifecycle paraphrase is made stale by step 2's inserted review step **and** uses
      `→` for lifecycle order, which `CLAUDE.md` rule 4 forbids ("arrows mean edges, not time").
      Rewrite it as an ordered list of named steps without arrows, matching the amended lifecycle,
      and point it at `CLAUDE.md`'s `## Lifecycle` as the authority.
    - `:12`, `:14`, `:25`, `:26`, `:27` — the five **dangling** refs. Repoint each at a target that
      exists: PR-description/evidence expectations (`§13` at `:12` and `:26`) →
      `docs/branch-protection.md`'s `## How pr-evidence is satisfied` (`:58-69`) and
      `.claude/commands/prepare-evidence.md`; human gates and CODEOWNERS (`§16` at `:14` and `:27`)
      → `docs/branch-protection.md`'s `## Required reviews (CODEOWNERS)` (`:40-56`); Claude Code
      operating instructions (`§11` at `:25`) → `CLAUDE.md` and `.claude/commands/`. While editing
      `:14`, drop its stale future tense — code-owner approval on schema changes is live today.
    - `:23`, `:24` — the two **mis-describing** refs. `§4` is *Documents and build order* and `§5`
      is *Done when*, so neither describes graph layout or graph rules: repoint the layout bullet at
      `CLAUDE.md`'s `## Structure` / `### Where canonical truth lives` (`:7-34`) and the rules
      bullet at `CLAUDE.md`'s `## Rules` (`:36-62`).

    **Constraint: repairs repoint references; they never add sections to `SPEC.md`** (contract Out
    of scope 5). After the edit, no `SPEC.md §N` with N > 5 may remain in this file.

12. **Scope 13 + CC-10(b) — `docs/branch-protection.md`.** In one edit: change `:13`'s "These four
    checks" to **"These six checks"**, and add the sixth table row after `:22` — a `drift-review`
    row whose Workflow cell is `drift-review.yml` and whose Enforces cell is the deterministic
    sensitive-paths gate (`spec:check-diff`), blocking, with the semantic `/detect-drift` step
    staying warn-only. Then add a short companion paragraph in the register of the existing `:32-38`
    `patch-comparison` paragraph: `drift-review.yml` triggers on `pull_request:` with **no
    event-level `paths:` filter**, so it always reports and is therefore safe to mark required under
    the `:24-30` rule; and the **honest bound** — after the flip the gate goes **red** but blocks
    nothing until a repo admin marks `drift-review` required under "Require status checks to pass",
    and that admin step is out-of-diff (contract Out of scope 3, Acceptance 6). Add one clarifying
    clause that the table's **Check** column holds GitHub status-check names (workflow names), a
    different namespace from the waivable check ids registered in `specs/schema/checks.yaml` — where
    the drift gate is registered as `check-diff`, not `drift-review` — so the new row is not misread
    as a registry claim. **Count the rendered data rows before finishing: six.**

13. **Scope 13 — `docs/drift-detection.md`, the `:32-40` rewrite (corrected span).** Replace the
    heading at `:32` and the body at `:34-40` — **not `:34-39`; the flip-instruction bullet ends at
    `:40`.** New content: the deterministic `check-diff` layer **is blocking** — its ~5-real-PR
    graduation criterion is met and `drift-review.yml`'s sensitive-paths step no longer carries
    `continue-on-error: true`; the semantic `/detect-drift` layer remains warn-only until the CI
    Claude step is pinned (action, credential, model). State honestly that the **Drift map
    (informational)** step retains its own `continue-on-error: true`, so the workflow as a whole is
    not "no longer warn-only" — only the sensitive-paths gate graduated. Carry the same
    blocks-nothing-until-an-admin-enables-it bound as step 12. **Do not touch `:41-42` or
    `:44-46`** — both remain true after the flip. (The `SPEC §15` dangling reference at `:5` is
    **out of this lane's slice**; see `## Non-scope`.)

14. **Closing pass.** Re-read all five files end to end. Confirm: every surviving cross-reference
    resolves to a section that exists and is described correctly; every identifier owned by a
    sibling lane is spelled as that lane ships it; `README.md` is ≤40 lines;
    `docs/branch-protection.md` renders six data rows under a "six" sentence; no line of `CLAUDE.md`
    still says implementation performs no graph write; "the release's `includes` target" appears
    nowhere. **Then run the step-number reconciliation:** `grep -rn "lifecycle step" .claude/
    CLAUDE.md` and list every hit whose number the step-2 insertion shifted — those files belong to
    the api-integration and product-spec lanes and **are not edited here**; hand the list to
    `## Cross-lane dependencies` and to integration. This lane authors no `spec:index` /
    `spec:validate` mutation of its own (these five files are prose outside the validated graph and
    no rule reads them), but the graph writes that record this brief's `decomposes` edge and its
    later `evidence`/`touches` wiring **do** run the mutation gate: `pnpm spec:index && pnpm
    spec:validate` — in this PRoot environment `node_modules/.bin/tsx tools/spec.ts index` then
    `node_modules/.bin/tsx tools/spec.ts validate` — and **nothing is committed on red.**

## Non-scope (explicitly the other lanes' files and work)

Seven lanes decompose this contract and **no two edit the same file.** The six siblings:

- **`brief-conveyor-resolver-3f7a` — `domain-backend` (`tools/**`, `package.json`).** The resolver
  itself (`tools/conveyor.ts`, `nextSteps`, `deriveStage`, `CONVEYOR_CLASS_ROUTING`),
  `tools/issue_sync.ts`, `tools/spec.ts`, `tools/indexer.ts`, the coverage handlers and
  `tools/driftmap.ts`. It holds A2, A5, A7's **resolver rule** (routing for a `brief` at
  `implemented`), A8, A11, A12 and **CC-14's `tools/spec.ts:11` "four files" half**. This lane
  *describes* the resolver in prose and builds none of it.
- **`brief-conveyor-schema-graph-8b2e` — `data-migration` (`specs/schema/node-types.yaml` plus all
  graph data, Scope 14).** The optional `owner` field, the lane-enumeration pointer, **CC-13's
  single "live intent" definition**, the ten `touches` edges, the PR #4 `drift-finding`, the two
  follow-up intents, the `.gitignore` unowned authorization, and **Scope 14.2's widening of
  `capability-spec-docs-8c1d` to `SPEC.md` / `README.md` / `CONTRIBUTING.md`** (including refreshing
  that capability node's now-singular body text). This lane writes no second "live intent"
  definition and edits no capability node.
- **`brief-conveyor-commands-c14d` — `api-integration` (the 15 `.claude/commands/*.md` chain
  files).** A1's degraded fallback, A3, A4, **A7's command half** (`implement-brief.md` flips its
  brief via graph-maintainer), A14, A15/CC-7, A16 and CC-11 — plus every command file that cites a
  `CLAUDE.md` lifecycle step number (see `## Cross-lane dependencies`). This lane edits no command
  file, including `detect-drift.md`, which it only points at.
- **`brief-conveyor-ci-6a9f` — `observability-release` (`.github/workflows/**`,
  `.github/CODEOWNERS`).** `issue-sync.yml`, A9's transcription job, **the `drift-review.yml` flip
  itself** (deleting `continue-on-error: true` at `:31` and rewriting the false header and step
  comments) and **CC-10(a)**'s CODEOWNERS entry. This lane documents the **post-flip** state in
  `docs/drift-detection.md` and `docs/branch-protection.md`; it changes no workflow.
- **`brief-conveyor-lane-catalog-2d5b` — `product-spec` (`.claude/lanes/**`, `.claude/agents/**`,
  `.gitignore`).** The eight catalog files, the seven implementer agents, the `.gitignore`
  negation, A10, CC-2, CC-9, CC-16 and **CC-10(d)'s `integration-reviewer.md` agent-instruction
  half** — this lane holds only CC-10(d)'s doctrine half, in `CLAUDE.md`, and the two must not
  restate each other.
- **`brief-conveyor-tests-4c86` — `test-verification` (`tests/**`, written by `test-writer` via
  `/write-tests`, never the invocation that implemented the code).** A6, A12's pin, A13 and
  **CC-12's transcript-fixture regression artifact**. No prose this lane writes may claim that
  fixture, or A9's CI job, already exists.

Also explicitly out of scope for this lane:

- **`SPEC.md` — no edit at all.** Contract Out of scope 5: no SPEC v3.1 re-authoring and **no
  root-map edit**. PR #15 landed all four deltas in
  `docs/research-logs/07-12-2026-delivery-graph.md`, and root `SPEC.md`'s `§4` is a documents table,
  not a phase list, so a residual edit has no target. CONTRIBUTING's and README's repairs therefore
  **repoint references away from** non-existent sections; they never add sections to `SPEC.md`. No
  research log under `docs/research-logs/` is edited either — `07-27-2026-readme.md` is a **source**
  for step 10, not a target.
- **Two verified out-of-slice defects, recorded rather than absorbed (rule 5, middle branch).** (a)
  `docs/drift-detection.md:5` carries a **sixth dangling** SPEC reference — "(SPEC §15)" — which no
  scope item or amendment names, and it sits outside the `:32-40` span this lane rewrites. (b)
  `CLAUDE.md`'s `## Structure` block (`:9-20`) is stale twice over: it omits
  `specs/schema/checks.yaml` and labels `validation-rules.yaml` "(stub)" though it is 140 lines of
  live rules. Both are real, both are in files this lane owns, and **neither is in the effective
  contract.** Do **not** widen this contract silently: surface them at review and route them via
  `/capture-intent` as a follow-up intent (*Contract incomplete, intended behaviour unchanged*). If
  a reviewer rules either in-scope, that is a decision to record, not an assumption to make.
- **No graph writes of any kind from this lane's prose** — no node, no edge, no index regeneration,
  no validation-rule authoring. The five files are outside the validated graph.

## Cross-lane dependencies & integration expectation

- **A7 ordering — a real, named contradiction window.** The api-integration lane amends
  `/implement-brief` so it flips its brief to `implemented`; today
  `.claude/commands/implement-brief.md:7-8` reads "this command performs no graph writes and
  delegates to no agent", matching `CLAUDE.md:71`. **Until this lane's step 1 lands, that amended
  command contradicts the governing document.** Both edits ride the same PR, so the window is
  intra-PR only and must not survive the merge: if api-integration's edit lands and this one does
  not, the repository ships a command that violates its own governing doctrine. Neither lane may
  edit the other's file to close it.
- **A7 precondition, both directions.** This lane's amended step names only the terminal status
  `implemented` and encodes no `status: approved` precondition, because `brief.status_values` is
  `[draft, approved, implemented]` but every brief in this decomposition is created at `draft` and
  nothing in the repo moves a brief to `approved`. The api-integration lane's `/implement-brief` and
  the domain-backend lane's `brief`-at-`implemented` routing rule must agree with that reading; if
  either gates on `approved`, all seven briefs of this decomposition are unimplementable. Reconcile
  before either lane's evidence is final.
- **Lifecycle renumbering (step 2) breaks four references this lane does not own.** Verified today:
  `.claude/agents/contract-reviewer.md:7` ("lifecycle step 3"),
  `.claude/commands/approve-contract.md:15` ("lifecycle step 3"),
  `.claude/commands/capture-intent.md:11` ("lifecycle step 1", unaffected) and
  `.claude/commands/prepare-evidence.md:27` ("lifecycle step 6"). Inserting the
  review-and-comparison step shifts every number after 2, so the three command files belong to
  **api-integration** and the agent file to **product-spec**. Additionally,
  `prepare-evidence.md:27`'s "status changes of
  lifecycle step 6" is made substantively wrong by A7 — the brief is already `implemented` by then.
  **This lane edits none of those files**; it hands the reconciled list to those lanes and to
  integration. Note also that `decision-conveyor-derived-5a91` anchors A7 to "step 5": that is a
  **pre-insertion** anchor, and A7's target is the *Implementation* step whatever number it carries
  after step 2.
- **Capability coverage — a same-PR blocker for this lane's evidence.** `capability-spec-docs-8c1d`
  owns `[CLAUDE.md, docs/**]` today, so `README.md` and `CONTRIBUTING.md` are owned by **no**
  capability: this lane's diff would land in `spec:drift-map`'s `uncovered` list and its evidence's
  `touches` could not resolve them. The **data-migration** lane's Scope 14.2 widening fixes this.
  Per `CLAUDE.md`'s rule 3 on `touches`, a diff touching paths no capability owns is a coverage gap
  resolved in the **same PR** — so this lane's evidence depends on that widening landing with it.
- **Prose correctness depends on five siblings' as-built artifacts** (not on their commits for this
  lane's own edits, which can be authored in parallel): domain-backend's resolver names and the
  `NEXT` block; api-integration's amended commands; observability-release's actual
  `drift-review.yml` flip; data-migration's "live intent" definition and capability widening;
  product-spec's
  `integration-reviewer.md`. Reconcile the prose against what those lanes ship **before** this
  lane's evidence is final; a mismatch is a rule 5 drift signal, not a prose patch.
- **Integration expectation.** This laned brief reaches `implemented` via **this lane's own final
  `evidence`** (`evidence —evidences→ brief`), while `intent-self-guiding-delivery-loop-6d79` stays
  **`open`** — a laned brief's evidence implements the brief and never addresses the intent. Seven
  briefs make `contract-conveyor-derived-4c8c` **multi-brief** under `coverage-coherence` (cutoff
  `2026-06-18`; this contract's `2026-07-27` `created` is after it), so the contract completes
  **only** via a final `integration` node (authored by `/integrate`) that `integrates` a final
  evidence for **every live lane**, and the intent reaches `addressed` only through that
  integration. **If a lane collapses** (its work proves unnecessary or folds into another), it is
  **superseded** per `CLAUDE.md` rule 3 — a `supersedes` edge from its successor, the collapsed
  brief moved to its terminal status — **never forced into a ceremonial integration**; the
  integration node covers only the lanes that remain live.
- **Discharge key (what the final integration node names this brief for).** Per CC-10(d), the
  `integration` node's `compliance-verdict` section names each amendment's discharging brief; this
  lane is that brief for **A7** (the governing-doc half), **CC-10(b)**, **CC-10(d)** (the doctrine
  half), **CC-12**, **CC-13** and **CC-14** (the `CLAUDE.md` half).

## Acceptance & verification (scoped to this lane)

This lane ships prose, so its acceptance is read-against-anchor plus a handful of mechanical greps;
the test-verification lane owns all test code, and no validation rule reads any of these five files.
Each item below is checkable without judgement unless it says otherwise.

1. **A7 fidelity (the rule-5 edit).** The lifecycle's Implementation step states the single graph
   write, routes it through graph-maintainer, cites `decision-conveyor-derived-5a91`, and names no
   `status: approved` precondition. Mechanical: `grep -n "no graph writes" CLAUDE.md` returns
   nothing, and the evidence step's parenthetical no longer claims the brief becomes `implemented`
   there.
2. **CC-13 discharged both ways.** The lifecycle block carries a review-and-comparison step with the
   `compares` edge it authors, every numbered step is annotated with its command, and the
   patch-market four are dispositioned in one stated sentence with its reason. **Exactly one**
   definition of "live intent" exists in the repository, in `specs/schema/node-types.yaml`, and
   `CLAUDE.md` points at it — verified by `grep -rn "live intent" CLAUDE.md specs/schema/`.
3. **CC-14 discharged.** `grep -n "includes" CLAUDE.md` shows no "release's `includes` target"
   claim, consistent with `release` being absent from `node-types.yaml` and `includes` from
   `edge-types.yaml`.
4. **CC-10(b) discharged, counted twice.** `docs/branch-protection.md` reads "These six checks must
   pass" and the table renders **six** data rows including `drift-review`; the companion paragraph
   states the no-event-level-`paths:`-filter safety and the blocks-nothing-until-an-admin bound
   (contract Acceptance 6's honest bound), and distinguishes the GitHub check-name column from
   `specs/schema/checks.yaml`'s registry.
5. **Gate-graduation docs agree with the as-built workflow (contract Acceptance 6).**
   `docs/drift-detection.md` no longer calls the sensitive-paths gate warn-only anywhere, states
   that the Drift map step keeps its own `continue-on-error`, and leaves `:41-46`'s surviving
   content untouched. Verified by read against the observability-release lane's actual
   `drift-review.yml` diff — if the workflow was not flipped, this doc must not say it was.
6. **README budget and truth.** `wc -l README.md` ≤ 40; no `§22`; no "licence and governance
   scaffold only" claim and no bootstrap-PR-#1 status pointer; every `/`-command it names exists in
   `.claude/commands/`; the surviving `SPEC.md` link resolves and, where it cites a section, cites
   `§4` for the build order.
7. **CONTRIBUTING references all resolve.** `/capture-intent` is step 1; no `SPEC.md §N` with N > 5
   remains in the file; each surviving `SPEC.md` section reference describes that section correctly
   (`§4` = *Documents and build order*, `§5` = *Done when*); the lifecycle paraphrase matches the
   amended lifecycle and uses no `→` for lifecycle order (`CLAUDE.md` rule 4).
8. **CC-12 discharged, both halves stated honestly.** `CLAUDE.md`'s conveyor subsection carries the
   standing convention (named discharging run, verdict in the final `integration` node's
   `combined-test-run` section, named remediation). **Concretely for this contract:** the
   discharging run is the end-to-end paste-only walk of this contract's own delivery, performed on
   its PR before `/integrate`; its verdict is recorded in the final `integration` node's
   `combined-test-run` section and cross-referenced from `compliance-verdict`; if it fails, the
   remediation is a `drift-finding` plus a rule 5 route (follow-up intent, or return to human
   approval for a behaviour change) and the contract does **not** reach a final integration on a
   failed run. The transcript-fixture regression artifact is the test-verification lane's and is not
   claimed here.
9. **CC-10(d) doctrine discharged.** `CLAUDE.md` states that an `integration` node's
   `compliance-verdict` section enumerates every amendment of the selecting decision and names its
   discharging brief, gives this contract's count as 32 (A1–A16 plus CC-1–CC-16), and **points** at
   `.claude/agents/integration-reviewer.md` for the section keys rather than re-listing them. The
   agent-instruction half is verified to exist in the product-spec lane's diff, not this one.
10. **Scope-integrity discipline.** The two out-of-slice defects named under `## Non-scope`
    (`docs/drift-detection.md:5`'s `SPEC §15`; `CLAUDE.md:9-20`'s Structure block) are either
    captured as a follow-up intent or explicitly recorded as reviewed-and-deferred — never silently
    fixed and never silently ignored.
11. **Self-application (contract Acceptance 7).** Every file this lane touches, and this brief body,
    hard-wraps at 100 columns; the output-attention conventions ship as guidance with an explicit
    "no length validation" sentence and no new rule in `specs/schema/validation-rules.yaml`.
12. **Boundary and mutation discipline.** `git status --short` after this lane's work lists exactly
    `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `docs/branch-protection.md` and
    `docs/drift-detection.md` — no `tools/`, `.claude/`, `.github/`, `specs/`, `tests/` or
    `.gitignore` path. This lane's prose triggers no graph mutation; the graph writes that record
    this brief and its evidence end with `pnpm spec:index && pnpm spec:validate` (in this PRoot
    environment `node_modules/.bin/tsx tools/spec.ts index` then
    `node_modules/.bin/tsx tools/spec.ts validate`) and **must not commit on red**.

Edge for graph-maintainer to record for this brief node: `brief —decomposes→
contract-conveyor-derived-4c8c`, with this brief carrying `lane: docs-spec` and no `owner` key.
