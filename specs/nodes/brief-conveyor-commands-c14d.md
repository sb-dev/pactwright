---
id: brief-conveyor-commands-c14d
type: brief
title: Conveyor command chain — resolver NEXT block, marked degraded fallback, retargeted critic routing, and the type-wrong /prepare-evidence hop, across the 15 command files
status: implemented
created: 2026-07-28
lane: api-integration
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
'api-integration' lane of `intent-self-guiding-delivery-loop-6d79`, per decision
`decision-conveyor-derived-5a91`. This lane owns Scope item 10 and nothing else: the 15 prompt
files under `.claude/commands/` — the 14 lifecycle-chain commands plus `detect-drift.md`. It makes
every chain command's closing report end with the resolver's `NEXT` block, gives each chain command
a marked degraded fallback, fixes the type-wrong `/prepare-evidence` hop, retargets
`/review-contracts`' critic instruction and its enumeration guard, and pins the comparison and
decision body templates. There are 16 files in that directory; `update-spec-graph.md` is NOT a chain
step and is NOT this lane's. Every other surface belongs to another lane: the resolver and
`spec:status` (`tools/**`, `package.json`) to `domain-backend`; `specs/schema/node-types.yaml` and
all graph data to `data-migration`; `.github/workflows/**` and `.github/CODEOWNERS` to
`observability-release`; `.claude/lanes/**`, `.claude/agents/**` and `.gitignore` to `product-spec`;
`CLAUDE.md`, `README.md`, `CONTRIBUTING.md` and `docs/**` to `docs-spec`; and `tests/**` to
`test-verification`.
**BOOTSTRAP — why this brief carries no `owner`.** This decomposition predates the lane market the
contract builds. `.claude/lanes/` does not exist; `owner` is not in the schema (the `brief` block at
`specs/schema/node-types.yaml:22-33` declares `required_fields: [id, type, title, status, created]`,
documents only the optional `lane` and `patch_market` keys, and names no `owner`); and none of the
seven implementer agents exist (`.claude/agents/` holds fifteen files today — twelve critics/
reviewers plus `graph-maintainer`, `spec-writer`, `test-writer` — and no implementer among them).
So **no brief in this decomposition carries an `owner`**, and lane owners are assigned by
`/decompose-lanes` only after this change lands. That is not incidental to this lane: the
owner-routing clause this brief writes into `implement-brief.md` and the market this brief writes
into `decompose-lanes.md` are exactly the machinery that will assign owners to the *next*
decomposition, never to this one.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Every line number below was verified
against the current tree while drafting this brief; they are anchors, not authority — **re-confirm
each before editing, since earlier edits in the same file shift them.**

- **The 15 files this lane owns**, with today's line counts: `capture-intent.md` (15),
  `propose-contracts.md` (13), `review-contracts.md` (41), `approve-contract.md` (25),
  `write-brief.md` (14), `decompose-lanes.md` (20), `implement-brief.md` (11), `write-tests.md`
  (12), `propose-patches.md` (34), `compare-patches.md` (30), `synthesize-patches.md` (29),
  `select-patch.md` (41), `prepare-evidence.md` (30), `integrate.md` (27) — the 14 chain files —
  plus `detect-drift.md` (40). `update-spec-graph.md` (10) is the 16th file and is out of scope.
- **Two closing-report house styles already exist in these files; reuse the stronger one.** The four
  Phase-9 patch-market commands end with an all-caps `CLOSING REPORT:` paragraph enumerating every
  id the run produced (`propose-patches.md:30-34`, `compare-patches.md:26-30`,
  `synthesize-patches.md:26-29`, `select-patch.md:37-41`), and `integrate.md:25-27` follows it. The
  older nine end with a one-line `End by reporting …` (e.g. `capture-intent.md:14-15`,
  `approve-contract.md:24-25`, `write-brief.md:14`, `decompose-lanes.md:20`,
  `prepare-evidence.md:29-30`). **Converge the nine onto the `CLOSING REPORT:` form** rather than
  inventing a third; the conveyor block then attaches at one known place in all fourteen.
- **`.claude/commands/` is tracked, so these edits reach CI.** `.gitignore:10` is `.claude/*`,
  negated at `:11` (`!.claude/agents/`) and `:12` (`!.claude/commands/`). This lane needs no
  `.gitignore` change — the third negation (`!.claude/lanes/`) is `product-spec`'s, and this lane's
  files are already visible to any test that reads them.
- **`select-patch.md` already holds the brief id it fails to print.** `select-patch.md:5-6` locates
  "its brief via the winner's `competes-for` edge"; `select-patch.md:40` then prints
  `/prepare-evidence <winner-branch>`. The datum is in hand at print time — this is a pure type
  error, not a missing lookup, which is why it is the contract's proof case.
- **`prepare-evidence.md:4`** is the consumer: "Input: brief node ID ($ARGUMENTS)." Also read
  `prepare-evidence.md:9-12` (the laned/unlaned status rule) and `:23-25` (the IDEMPOTENT /
  RE-ENTRANT paragraph) — A7 makes both load-bearing.
- **The verdict-pointer critique form already exists on disk; pin it rather than invent it.**
  `specs/nodes/contract-conveyor-derived-4c8c.md:260-317` carries ten `## Critique (<axis>)`
  sections, each two or three lines — a one-word verdict, one sentence of finding, then "Full
  finding … in `comparison-conveyor-market-890e`". That is exactly the shape A14/CC-1 wants
  `review-contracts.md` step 2 to instruct. Reuse it verbatim as the pinned template.
- **`review-contracts.md`'s six steps**, current anchors: step 1 routing `:8-19`; step 2 the
  `## Critique (<perspective>)` appending instruction `:20-22`; step 3 the count-enumeration guard
  `:23-27`; step 4 the one-comparison-per-market rule `:28-35`; step 5 the graph-maintainer
  mutation `:36-38`; step 6 the closing `:39-41`. CC-1's cited span `review-contracts.md:20-27` is
  steps 2 and 3 exactly.
- **`approve-contract.md`'s comparison-citation paragraph** is `:16-23`; the orphaned fallback
  sentence is `:20-23` ("A pre-cutoff or class-≤1 selection is grandfathered — there is no
  comparison node to cite, so record the analysis of record instead (e.g. the candidates' appended
  critiques)."). The quorum pre-check at `:8-11` and the closing at `:24-25` stay.
- **`compare-patches.md:17-20`** already specifies the six patch-comparison axes (contract fit,
  scope control, simplicity, test quality, drift risk, rollback safety). The pinned comparison
  template for patch markets must keep these six; do not re-derive them.
- **Comparison and decision body exemplars to pin against, on disk:**
  `specs/nodes/comparison-patch-market-synthesis-7b1d.md` (90 lines; `## Candidate trade-off table`
  `:9`, `## Critic findings by perspective` `:22` with one `### <axis>` each, `## The case against
  each candidate` `:79`) and `specs/nodes/comparison-conveyor-market-890e.md` (306 lines; same three
  sections at `:7`, `:38`, `:167`, plus `## Common-core findings` `:215`).
  `specs/nodes/decision-patch-market-ci-gate-8a2f.md` (51 lines) is the decision mould: a SELECTED /
  REJECTED lead line `:10`, `## Accepted trade-off (why B)` `:14`, `## Why each rejected candidate
  lost` `:18`, grafts `:24`, mandatory fixes `:35`, `## Consequences` `:43`, comparison citation
  `:49`, `**Next step:**` `:51`. `specs/nodes/decision-conveyor-derived-5a91.md` (180 lines) is the
  same mould extended with `## Common-core findings (binding in full)` `:144` and `## Rule-5
  declaration (A7)` `:155` — both optional sections the template must permit.
- **`CLAUDE.md:89-94`** is the work-class routing table. Row class 2 reads Lanes `optional`, Patch
  market `optional per brief` — the authority that makes `write-brief.md:6-8` wrong today.
- **`CLAUDE.md:71`** is lifecycle step 5: "Implementation (code only; no graph writes)". A7 amends
  it, but the amendment is `docs-spec`'s edit, not this lane's.
- **`tools/spec.ts:9-27`** — today `USAGE` names six subcommands and `SUBCOMMANDS` (`:27`) lists
  `index, validate, gate, check-diff, patch-gate, drift-map`. **`status` does not exist yet**; every
  `pnpm spec:status` line this lane writes is dead until `domain-backend` ships Scope 3.
- **`tools/driftmap.ts:20-33`** — `DriftPacket` carries `contracts`, `approvedContract`, `briefs`,
  `priorEvidence`, `linkState` and **no decision**. `detect-drift.md:16-17` judges "against the
  packet's contract/brief bodies". Scope 10.5's contract-**and**-decision judging therefore depends
  on CC-10c's packet extension, which is `domain-backend`'s.
- **Toolchain.** The canonical instruction in every command is `pnpm spec:index && pnpm
  spec:validate`. `pnpm`/corepack are broken in this PRoot environment, so the verification runs in
  this repo are `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx
  tools/spec.ts validate`. **The command files keep the canonical `pnpm` form** — the env workaround
  is how this brief is verified, never what it writes into the prompts.

## Pinned decisions

Binding constraints this lane discharges. Identifiers are the discharge key of
`decision-conveyor-derived-5a91` (A1–A16) and `comparison-conveyor-market-890e` `## Common-core
findings` (CC-1–CC-16); the comparison's text is the binding text and is not paraphrased here as if
the paraphrase were the requirement.

- **A1 — the degraded-mode fallback, and the sharpest constraint in this brief.** Every chain
  command retains a **static, self-contained fallback print in its own markdown**, used when the
  resolver is unavailable. This exists to patch B's shared-failure-domain defect: B's stated
  `trails.md` fallback comes from `indexer.ts` and dies with the same `loadSpec()` it covers. The
  decision binds it three ways and **all three are load-bearing**:
  1. **Template-shaped — no resolved IDs.** The fallback names the next command(s) in pure
     `<placeholder>` form and fills nothing. It performs no graph derivation and substitutes no id,
     *including ids the command holds as its own input arguments*. This is what keeps a fallback
     print visibly distinguishable from a resolved one (reliability-ops finding 2:
     "a hand-typed `NEXT` block is indistinguishable from a resolved one").
  2. **Explicitly marked as the resolver-unavailable path**, so it never becomes a second
     authoritative routing source and never re-imports Candidate A's sixteen-copy divergence
     surface — the exact axis Candidate B won on. Nothing in the fallback may read as routing truth.
  3. **It must NOT satisfy A6's pin.** A print-less command still reds CI even though it carries
     fallback prose. The pin is `test-verification`'s to build; this lane's obligation is to make
     the two textually separable, which the literals below do.

A1/A6 DISTINGUISHABILITY CONTRACT (byte-identical in `brief-conveyor-commands-c14d` and
`brief-conveyor-tests-4c86`; neither lane may vary it unilaterally):

1. Resolver-invocation token: `pnpm spec:status`. Every chain command file must instruct the
   agent to run it.
2. A fallback region opens with a line that is exactly `FALLBACK (RESOLVER UNAVAILABLE):`.
3. A fallback region ends at the next line matching `^[A-Z][A-Z0-9 /()-]*:$`, or at EOF.
4. A fallback region MUST NOT contain the substring `spec:status` anywhere — bare or
   `pnpm`-prefixed. The fallback is what an operator reads when the resolver is gone, so it
   names candidate next commands with placeholder arguments and never resolved ids.
5. THE PIN (A6): after excising every fallback region, each of the fourteen chain command files
   must contain `pnpm spec:status` AT LEAST ONCE. A print-less or hand-typed command therefore
   reds CI even though it carries fallback prose.

- **A1 × A3 reconciliation (state it, or the two amendments read as contradictory).** A3's
  no-unsubstituted-placeholder invariant binds the **resolved** path only. In the marked fallback,
  placeholders are **required**, not defects. Write this exemption into the fallback's own prose so
  no later reviewer "fixes" the fallback by substituting ids.
- **A1 × A15 reconciliation (equally load-bearing).** The fallback fires **only** when the resolver
  itself is unavailable — `spec:status` absent, throwing, or failing to load the spec. It does
  **not** fire when the graph write failed. A red `spec:validate` prints findings, remediation and
  explicitly **no** next step (A15); printing a template next step there would walk the operator
  past the failure, which is exactly what A15 forbids. Two failure modes, two different outputs.
- **A3 — the no-unsubstituted-placeholder invariant, with the decision's correction.** A printed
  next-step line must contain no `<placeholder>` whose value the command holds. The **real
  instances** on disk are `propose-patches.md:33` and `synthesize-patches.md:28`, both printing
  `/compare-patches <brief-id>` while the brief id is the command's own first argument.
  **`compare-patches.md:29`'s `<winner>` is NOT an instance** — it is a human choice the command
  does not hold, and the command is forbidden to rank (`compare-patches.md:29-30`: "Do NOT select or
  rank the candidates"). Say so explicitly in the file; it is a correction the decision records, and
  removing that placeholder would break the command. The same reading applies to `<winner>` at
  `propose-patches.md:33` and `synthesize-patches.md:29` and to every free-text argument
  (`"<rationale>"`, `'<amendments>'`, `"<notes>"`, `"<strategies>"`, `"<instruction>"`), which the
  resolver itself emits as `kind: template`.
- **A4 — the BLOCKED `/write-tests` interim clause, as a recoverable action.** `write-tests.md:5-6`
  refuses any brief whose `lane` is not `test-verification`. **Widening that precondition changes
  intended behaviour and is out of scope** (contract `## Out of scope` 6); rule 5 routes it to
  `data-migration`'s Scope 14.4 follow-up intent. The interim is a `kind: action` line in
  `/write-brief`'s closing block for a **class-≥1 unlaned brief**: independent verification is still
  required, and the recoverable actions are named — (a) re-decompose the contract with a
  `test-verification` lane via `/decompose-lanes`, or (b) write the tests outside the command. Per
  the UX finding (`comparison-conveyor-market-890e` `### user experience` finding 2), the line must
  **not be paste-shaped** — it must not look like a runnable `/write-tests <brief-id>` — so the
  operator is never handed a command that will refuse them. The refusal message at
  `write-tests.md:5-6` gains the same two recoverable actions and a pointer to the follow-up intent;
  **the precondition itself does not move.**
- **A7 (this lane's half) — `/implement-brief` acquires exactly one graph write.** It flips its
  brief to `implemented` via graph-maintainer as its **single** graph write, making the
  implementation-to-evidence hop derivable. **This changes intended behaviour and is approved under
  CLAUDE.md scope-integrity rule 5 by `decision-conveyor-derived-5a91`** (`## Rule-5 declaration
  (A7)`); the brief does not re-open that question. graph-maintainer remains the sole writer — the
  flip goes through it, never inline. Three constraints:
  1. **Status precision.** A7's text reads `approved` → `implemented`. `node-types.yaml:33` allows
     `[draft, approved, implemented]`, but nothing in this repo authors a brief at `approved` —
     every live brief is created `draft` (this brief included). The command therefore flips the
     brief **from its pre-implementation status (`draft` or `approved`) to `implemented`**, and the
     resolver rule keys on the *resulting* `implemented` status, not on a prior `approved`. This is
     a HOW refinement, not a scope change.
  2. **Cross-lane, both halves named:** the resolver rule for a `brief` at `implemented` is
     `domain-backend`'s, and the `CLAUDE.md` lifecycle step-5 amendment is `docs-spec`'s.
     **Until `docs-spec` lands its edit, this command contradicts the governing document** —
     `CLAUDE.md:71` still reads "Implementation (code only; no graph writes)". State that plainly in
     the PR; do not edit `CLAUDE.md` from this lane.
  3. **Downstream idempotence.** `prepare-evidence.md:9-12` sets a laned brief to `implemented`;
     after A7 that brief is already `implemented`. Extend `prepare-evidence.md`'s existing
     IDEMPOTENT / RE-ENTRANT paragraph (`:23-25`) so an already-`implemented` brief is a no-op, not
     a conflict.
- **A7 × Scope 10.4 — `implement-brief.md:7-8`'s "delegates to no agent" clause routes to the
  brief's `owner`.** Both halves of that clause change: it no longer performs "no graph writes"
  (A7), and it no longer "delegates to no agent". The owner-less path must be declared (CC-9
  requires the owner-less behaviour be declared; the field and the agents are other lanes'): **a
  brief with no `owner` is implemented inline, exactly as today, and the closing report says so.**
  Given the bootstrap above, that is the path every brief in *this* decomposition takes.
- **A14 / CC-1 — retarget `/review-contracts` steps 2 AND 3, not step 5 alone.** All three
  candidates edited step 5 only, leaving step 2's `## Critique` appending instruction and step 3's
  guard live at `review-contracts.md:20-27`. Binding: step 2 instructs each routed critic to produce
  **one verdict-pointer line per candidate** (verdict word, one-sentence finding, pointer to the
  comparison) for class 2+, and step 3's guard is retargeted to count **one verdict pointer per
  routed critic** — the guard's purpose (never proceed with a silently dropped critic) is preserved,
  only its subject changes. **Class-0/1 critiques stay on the candidate body**, because a class-0/1
  review records no comparison (`review-contracts.md:34-35`) and the finding would otherwise have
  nowhere to live.
- **A14 / CC-1 — fix `approve-contract.md:20-23`, an orphan this very review hit.** That sentence
  offers "the candidates' appended critiques" as the grandfathered analysis of record, but Scope
  10.2 deletes step 5's critique-appending, so the fallback names an artifact that will no longer
  exist for class-2+ markets. Rewrite it to name what actually survives: for a **class-≤1**
  selection, the candidate body's critique section; for a **pre-cutoff class-2/3** selection,
  whatever analysis the market actually recorded, named explicitly in the decision body. The quorum
  pre-check at `approve-contract.md:8-11` and the `comparison_required_from` citation rule at
  `:16-20` are unchanged.
- **A15 / CC-7 — suppress the closing print on red, and echo before mutating.** Commands end
  "nothing is committed on red" (`select-patch.md:31`, and the same clause in eleven siblings) yet
  all three candidates printed after it. Binding, in every command with a mutating step: (a) **echo
  the resolved ids before mutating**, so the operator sees what is about to change; (b) on a red
  `spec:index`/`spec:validate`, print the findings, the remediation, and **explicitly no next
  step** — no `NEXT` block, no fallback; (c) the `NEXT` block is printed only after a green
  validate.
- **A16 (this lane's half) — `/decompose-lanes` REFUSES a decomposition omitting
  `test-verification`.** `decompose-lanes.md:11-13` today *instructs* inclusion ("Whenever the list
  has at least one IMPLEMENTATION lane, INCLUDE a `test-verification` lane brief"). An instruction
  is not a refusal. Binding: when the named lane list contains at least one implementation lane and
  no `test-verification`, the command **stops, reports why, and writes nothing** — no brief nodes,
  no edges. The refusal is stated as a precondition alongside the existing `selects`-edge
  precondition at `:4-7`.
- **CC-11 (this lane's half) — render `issue: not synced`.** The wave plan must never leave a lane's
  issue column blank, because a blank column reads as a lost lane. Every lane line in the wave plan
  carries either its issue link or the literal `issue: not synced`. The issue sync is best-effort
  and never blocks (contract Behaviour 9), so `not synced` is a normal outcome, not an error. **Wave
  persistence, resolved without taking another lane's surface:** the command writes each lane's wave
  assignment into the **body** of the lane brief it drafts (a one-line "Wave N of M" statement),
  which needs no schema field and no `frontmatter` key. A `wave` frontmatter field would be
  `data-migration`'s schema surface and is **not** taken here; the graph-side/view-side half of
  CC-11 is `domain-backend`'s.
- **Scope 10.1 — every chain command's report ends with the resolver's `NEXT` block, reproduced
  verbatim.** "Verbatim" binds **the block only**. Judgement content the command owns is **required
  around it** (contract Behaviour 6): `/review-contracts`' decision block — per candidate, a
  verdict, the strongest objection, and the plausible grafts from each non-base candidate, sitting
  **above** the Behaviour-2.3 `/approve-contract <base-id> '<amendments>'` templates — and
  `/decompose-lanes`' wave plan. **The conveyor prints, never executes**: a printed command still
  obeys its class's standing rules, and that sentence goes in every file.
- **Scope 10.1 file set, made unambiguous for A6's pin.** The `NEXT`-block requirement covers the
  **14 chain commands**. `detect-drift.md` is in this lane's file set for Scope 10.5 only: it is not
  a chain step, the resolver has no routing rule for a `drift-finding`, and it therefore carries a
  `kind: action` closing line (the rule-5 routing) and **no** `NEXT` block. `update-spec-graph.md`
  is neither. **A6's pin set is the 14 chain files** — state this in the brief so
  `test-verification` does not size the pin at 15 or 16. (The contract's problem interpretation
  sizes the surface at "14 of 16"; Scope 10's heading counts 15 files because it adds
  `detect-drift.md` for 10.5. Both are correct — they count different things.)
- **Scope 10.3 — `write-brief.md:6-8` corrected for class 2.** It currently reads "class 3 per the
  work-class routing table; class 0–2 keep a single brief", which contradicts `CLAUDE.md:89-94`,
  where class 2 has Lanes `optional` and Patch market `optional per brief`. Correct it to: class 3
  **requires** lanes (use `/decompose-lanes`); class 2 **may** lane and **may** open a patch market
  per brief; class 0–1 keep a single unlaned brief and no market.
- **Scope 10.3 — `decompose-lanes.md:9-10`'s inline lane enumeration becomes a pointer.** The
  eight-lane list spelled out at `:9-10` is one of the prose copies the contract's common core
  retires. Replace it with a pointer to the `.claude/lanes/` catalog (`product-spec`'s files) and
  the `brief-lane-valid` rule, and add the market: read each named lane's catalog file, weigh
  `eligible_agents` against the brief scope, pick `default_agent` unless stating a reason, write
  `owner` plus a one-line rationale, order waves from the catalog's dependency hints with an
  optional cap, state **per lane why a patch market was or was not opened**, and invoke
  `spec:issue-sync` best-effort.
- **Scope 10.5 — `/write-brief` and `/decompose-lanes` carry the decision's amendments into the
  briefs they draft; `/detect-drift` judges the diff against contract AND decision.** Both drafting
  commands must state that the **effective contract is the approved contract plus its selecting
  decision's amendments**, and that every brief carries its slice with the amendment identifiers
  named. `detect-drift.md:16-17` judges "against the packet's contract/brief bodies" — extend it to
  the contract's selecting `decision` as well, else the gate judges diffs against half the contract.
- **Scope 10.6 — pinned body templates.** `review-contracts.md` and `compare-patches.md` each carry
  the **comparison shape**; `approve-contract.md` and `select-patch.md` each carry the **decision
  shape**. Both templates are prose conventions for graph-maintainer, **not** validation rules
  (CLAUDE.md is explicit that the comparison body structure is a command/graph-maintainer
  convention). Pin them against the on-disk exemplars named in Grounding, not against a fresh
  invention.
- **Scope discipline — this lane widens nothing.** If any step here would require editing a file
  another lane owns, or would change intended behaviour beyond A7's recorded approval, **stop** and
  apply CLAUDE.md rule 5 (supersede the brief, capture a follow-up intent, or return to human
  approval). One such event is already recorded below under Cross-lane dependencies and is
  **not** implemented by this lane.

## Files to create

None. This lane creates no files. Every file it touches already exists.

## Files to modify

All under `/home/samir/workspace/pactwright/.claude/commands/`. Fifteen files; no other lane edits
any of them.

The 14 chain commands — each gains the resolver `NEXT` block, the marked fallback, the
echo-before-mutate and red-suppression discipline, and the `CLOSING REPORT:` convergence:

1. `capture-intent.md`
2. `propose-contracts.md`
3. `review-contracts.md` — plus A14/CC-1 steps 2 and 3, Scope 10.2's step 5 and step 6, and the
   pinned comparison template.
4. `approve-contract.md` — plus the A14 orphan fix at `:20-23` and the pinned decision template.
5. `write-brief.md` — plus the class-2 correction at `:6-8`, A4's interim clause, and the
   carry-the-amendments clause.
6. `decompose-lanes.md` — plus the `:9-10` pointer, the lane market, the wave plan with CC-11's
   `issue: not synced` rendering, A16's refusal, and the carry-the-amendments clause.
7. `implement-brief.md` — plus A7's single graph write and the owner routing at `:7-8`.
8. `write-tests.md` — plus A4's recoverable-action refusal message (precondition unchanged).
9. `propose-patches.md` — plus A3 at `:33`.
10. `compare-patches.md` — plus A3's `<winner>` correction at `:29` and the pinned comparison
    template.
11. `synthesize-patches.md` — plus A3 at `:28`.
12. `select-patch.md` — plus the `:40` type fix and the pinned decision template.
13. `prepare-evidence.md` — plus A7's downstream idempotence.
14. `integrate.md`

And one non-chain file:

15. `detect-drift.md` — Scope 10.5 (judge against contract AND decision) and A15's red discipline
    only. **No `NEXT` block**; a `kind: action` closing line instead.

Explicitly NOT modified: `.claude/commands/update-spec-graph.md`.

## Ordered implementation steps

Steps 1–3 establish the shared shape; steps 4–11 apply the per-file amendments; step 12 verifies.
Every line number is a current-tree anchor — re-confirm before editing.

1. **Fix the type-wrong hop first — it is the contract's proof case.** In `select-patch.md`, change
   the closing report at `:40` so the next step prints `/prepare-evidence <brief-id>` with the brief
   id resolved through the winner's `competes-for` edge (already located at `:5-6`), keeping the
   winner's branch as **context**, not as the argument. Do this before anything else so the diff
   carries the intent's named defect as its first hunk. Nothing else in `select-patch.md` steps 1–4
   changes here.

2. **Author the shared closing-report contract once, then apply it verbatim.** Draft the exact
   paragraph the 14 chain files will carry, with these parts in this order:
   1. `CLOSING REPORT:` — the command's own resolved ids and statuses (converging the nine older
      `End by reporting …` files onto this form).
   2. **Echo-before-mutate (A15).** A sentence placed with the mutating step, before it: echo the
      resolved ids the graph write is about to touch.
   3. **Red suppression (A15/CC-7).** On a red `pnpm spec:index && pnpm spec:validate`: print
      findings, remediation, and explicitly **no next step** — no `NEXT` block and no fallback.
   4. **The resolver call.** After a green mutating step, run `pnpm spec:status <id>` and reproduce
      its `NEXT` block **verbatim**. The clause must contain the literal token `pnpm spec:status`.
   5. **The judgement content the command owns**, around the block, where the contract requires it
      (step 4 and step 6 below).
   6. **The fallback (A1),** opening with a line that is exactly the literal heading `FALLBACK
      (RESOLVER UNAVAILABLE):`, naming the next command(s) in pure `<placeholder>` form,
      resolving nothing, containing no `spec:status` substring (bare or `pnpm`-prefixed, per
      the distinguishability contract's clause 4), and carrying one sentence stating
      that its placeholders are required (the A1 × A3 exemption) and that it is **not** a routing
      source.
   7. **"The conveyor prints, never executes; a printed command still obeys its class's standing
      rules."**

3. **Apply the shared contract to all 14 chain files**, adjusting only the ids each command holds.
   Keep the two A1/A6 literals byte-equal in every file. Do not give `detect-drift.md` a `NEXT`
   block.

4. **`review-contracts.md` — A14/CC-1 plus Scope 10.2, in one pass over steps 2–6.**
   1. **Step 2 (`:20-22`)** — replace the "appends one perspective-labelled `## Critique
      (<perspective>)` section per candidate" instruction with: for a **class-2+** market each
      routed critic produces **one verdict-pointer line per candidate** (verdict word, one-sentence
      strongest finding, pointer to the comparison node), drafted for graph-maintainer; for
      **class 0–1**, the critique stays a section on the candidate body, since no comparison exists.
      Pin the form to the on-disk exemplar (`contract-conveyor-derived-4c8c.md:260-317`).
   2. **Step 3 (`:23-27`)** — retarget the count-enumeration guard from `## Critique` sections to
      **one verdict pointer per routed critic** (per candidate, for a class-3 panel: nine
      specialists plus spec-critic). Keep the guard's teeth: if any routed perspective is missing,
      stop and report which; never proceed with a silently dropped critic.
   3. **Step 4 (`:28-35`)** — unchanged in substance; attach the pinned comparison template from
      step 11 below.
   4. **Step 5 (`:36-38`)** — delete the critique-appending clause for class-2+ (graph-maintainer
      writes the verdict pointers and the comparison; it no longer appends critique sections), keep
      the mutating-step sentence, and add the echo-before-mutate and red-suppression clauses.
   5. **Step 6 (`:39-41`)** — becomes Behaviour 6's decision block: **per candidate**, a verdict,
      the strongest objection, and the plausible grafts from each non-base candidate — printed
      **above** the resolver's `NEXT` block, whose Behaviour-2.3 content is one
      `/approve-contract <base-id> '<amendments>'` template per live candidate. Keep "Do NOT select
      or rank the candidates."

5. **`approve-contract.md` — the A14 orphan.** Rewrite `:20-23` so the grandfathered analysis of
   record names an artifact that will still exist: for a class-≤1 selection, the candidate body's
   critique section; for a pre-cutoff class-2/3 selection, the analysis the market actually
   recorded, named explicitly in the decision body. Leave `:8-11` (quorum) and `:16-20` (comparison
   citation) alone. Attach the pinned decision template from step 11. **Also re-point the lifecycle
   citation at `:15`** ("the status changes of CLAUDE.md lifecycle step 3"): `docs-spec`
   (`brief-conveyor-docs-9e31`) inserts a review-and-comparison step into `CLAUDE.md`'s numbered
   lifecycle, renumbering every step after 2, and hands the downstream references to the lane that
   owns each file — this one is this lane's. The inserted step lands after step 2, so step 3 becomes
   step 4; confirm the number against `brief-conveyor-docs-9e31`'s landed text before editing, and
   edit no `CLAUDE.md` line.

6. **`write-brief.md` — Scope 10.3, A4, and Scope 10.5.**
   1. Correct `:6-8`: class 3 **requires** lanes via `/decompose-lanes`; class 2 **may** lane and
      **may** open a patch market per brief; class 0–1 keep a single unlaned brief and no market.
      Cite `CLAUDE.md`'s work-class routing table as the authority.
   2. Add A4's interim clause to the closing block: for a **class-≥1 unlaned** brief, a `kind:
      action` line — not paste-shaped — stating that independent verification is still required and
      naming the two recoverable actions (re-decompose with a `test-verification` lane; write the
      tests outside the command).
   3. Add the carry-the-amendments clause (Scope 10.5): the effective contract is the approved
      contract **plus** its selecting decision's amendments, and the drafted brief carries its slice
      with the amendment identifiers named.

7. **`decompose-lanes.md` — Scope 10.3, A16, CC-11, Scope 10.5.**
   1. Replace the inline eight-lane enumeration at `:9-10` with a pointer to the `.claude/lanes/`
      catalog and the `brief-lane-valid` rule.
   2. Add A16's **refusal**: an implementation-bearing lane list omitting `test-verification` stops
      the command with a report and **no** graph write. Replace the softer instruction at `:11-13`.
   3. Add the lane market: read each named lane's catalog file, weigh `eligible_agents` against the
      brief scope, pick `default_agent` unless stating a reason, write `owner` plus a one-line
      rationale into the lane brief.
   4. Add the wave plan: numbered waves from the catalog's dependency hints with an optional cap;
      each lane line carries its owner agent, its issue link **or the literal `issue: not synced`**
      (CC-11), and its paste-ready command; each lane also states **why a patch market was or was
      not opened** (contract Risk 4's mitigation). Persist each lane's wave assignment in the
      drafted brief's **body**; take no schema field.
   5. Add `spec:issue-sync` best-effort invocation, explicitly non-blocking.
   6. Add the carry-the-amendments clause, as in step 6.3.
   7. Keep the integration-expectation paragraph at `:14-17` (it already states the laned-brief /
      final-integration / collapsed-lane rules correctly).

8. **`implement-brief.md` — A7 and Scope 10.4.** Rewrite `:7-8`: the command implements exactly what
   the brief says, delegates to the brief's `owner` agent when the brief carries one (and implements
   inline, as today, when it does not — stating which path it took), and performs **exactly one**
   graph write: graph-maintainer flips the brief to `implemented`. Keep the STOP-and-ask scope
   discipline at `:9-10` verbatim. Add the mutating-step sentence (`pnpm spec:index && pnpm
   spec:validate`, nothing committed on red), echo-before-mutate, red suppression, and the `NEXT`
   block — which now resolves to `/prepare-evidence <brief-id>`, closing the loop the whole contract
   rests on. State in the file that the `CLAUDE.md` lifecycle step-5 amendment is
   `decision-conveyor-derived-5a91`'s A7 and lands in the `docs-spec` lane.

9. **`write-tests.md` and `prepare-evidence.md` — the A4 and A7 downstream halves.**
   1. `write-tests.md`: keep the precondition at `:5-6` **exactly as strict**; extend only its
      refusal report with the two recoverable actions and a pointer to the Scope 14.4 follow-up
      intent. Add the shared closing contract.
   2. `prepare-evidence.md`: extend the IDEMPOTENT / RE-ENTRANT paragraph (`:23-25`) so a brief
      already at `implemented` (A7) is a no-op rather than a conflict, and adjust the STATUS
      paragraph (`:9-12`) to say the laned brief is set to `implemented` **if it is not already**.
      **Also re-point the lifecycle citation at `:27`** ("the status changes of CLAUDE.md lifecycle
      step 6") for the same reason as step 5's `:15` — `brief-conveyor-docs-9e31`'s insertion after
      step 2 renumbers it, so step 6 becomes step 7; confirm against that lane's landed text. Under
      A7 this citation is additionally wrong in substance, since the brief's flip to `implemented`
      has already happened upstream, so the sentence must name only the status changes this command
      still makes. The unlaned-brief rule and the capability-wiring paragraph (`:13-22`) are
      unchanged.

10. **`detect-drift.md` — Scope 10.5 and A15 only.** Extend the judging instruction at `:16-17` so
    each linked packet is judged against the contract **and** the contract's selecting `decision`
    (the effective contract). Note in the file that the packet's decision field is supplied by
    `spec:drift-map` (`domain-backend`, CC-10c) and that until it lands the command reads the
    decision by following the contract's inbound `selects` edge. Add the red-suppression discipline
    to the graph-maintainer write at `:31-36`. Add a `kind: action` closing line routing a finding
    to CLAUDE.md rule 5. **Add no `NEXT` block.**

11. **The four pinned body templates (Scope 10.6).**
    1. **Comparison shape** into `review-contracts.md` and `compare-patches.md`: `## Candidate
       trade-off table` (for patch markets, the six axes already at `compare-patches.md:17-20`),
       `## Critic findings by perspective` with one `### <perspective>` per routed critic (for patch
       markets, the reviewer and drift findings grouped per candidate), and `## The case against
       each candidate` with one `### <candidate>` each. Note the exemplars by id
       (`comparison-patch-market-synthesis-7b1d`, `comparison-conveyor-market-890e`) and that a
       comparison is **never superseded by selection** and is **replaced**, never duplicated, on
       re-review — both already stated at `review-contracts.md:31-35` and
       `compare-patches.md:21-24`.
    2. **Decision shape** into `approve-contract.md` and `select-patch.md`: a SELECTED / REJECTED
       lead line, `## Accepted trade-off (why <base>)`, `## Why each rejected candidate lost`,
       grafts and mandatory fixes as an **identifier-prefixed numbered list** (the discharge key),
       `## Consequences`, the comparison citation, and a closing `**Next step:**` line. Note the
       optional `## Common-core findings (binding in full)` and `## Rule-5 declaration` sections and
       the exemplars by id (`decision-patch-market-ci-gate-8a2f`, `decision-conveyor-derived-5a91`).
       State that the templates are prose conventions, not validation rules.

12. **Sweep and verify.** Re-read all 15 files end to end and confirm, mechanically:
    (a) each of the 14 chain files contains the token `pnpm spec:status` **at least once** outside
    its fallback region, and `detect-drift.md` and `update-spec-graph.md` contain it zero times;
    (b) each of the 14 contains the `FALLBACK (RESOLVER UNAVAILABLE):` heading line exactly once,
    byte-equal, and no fallback region contains a substituted id or the `spec:status` substring;
    (c) `grep -n '<[a-z][a-z-]*>' .claude/commands/*.md` shows no unsubstituted placeholder on a
    printed next-step line whose value the command holds — `<winner>`, `"<rationale>"`,
    `'<amendments>'`, `"<notes>"` and the other free-text arguments remain, correctly, as templates;
    (d) `select-patch.md`'s closing prints `/prepare-evidence <brief-id>`, and no file prints
    `<winner-branch>` as a `/prepare-evidence` argument;
    (e) every command with a mutating step carries the echo-before-mutate clause, the
    red-suppression clause, and the canonical `pnpm spec:index && pnpm spec:validate` text.
    Then run the graph gate for the PR that carries these edits — `node_modules/.bin/tsx
    tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate` (canonical form `pnpm
    spec:index && pnpm spec:validate`) — both exiting 0. **Nothing is committed on red.**

## Non-scope

The six sibling lanes and what is specifically theirs. No two lanes edit the same file.

- **`brief-conveyor-resolver-3f7a` — `domain-backend`.** `tools/**` and `package.json`: the whole of
  `tools/conveyor.ts` (`nextSteps`, `deriveStage`, `CONVEYOR_CLASS_ROUTING`), `tools/issue_sync.ts`
  (A2's `planIssueSync` seam), `tools/spec.ts`'s `status` subcommand and `USAGE`,
  `tools/indexer.ts`'s `INDEX_FILES` widening, the `coverage_traversal.ts`/`coverage_coherence.ts`
  consolidation (A11), and `tools/driftmap.ts`'s decision field (CC-10c). Amendments A2, A5, A7 (the
  resolver rule for a `brief` at `implemented`), A8, A11, A12, CC-4, CC-5, CC-6, CC-8, CC-10(c),
  CC-11 (the graph/view half), CC-14. **This lane writes no TypeScript at all** — every routing decision the
  commands print is produced there, and CC-6's node-id refusal and `spawnSync`/`shell: false`
  binding live there, not in prompt prose.
- **`brief-conveyor-schema-graph-8b2e` — `data-migration`.** `specs/schema/node-types.yaml` (the
  optional `owner` field on `brief`, the `:25-26` lane-comment pointer, CC-13's "live intent"
  definition) and **all** graph data of Scope 14: the ten `touches` edges, the capability widenings,
  the PR #4 `drift-finding` and its `flags` edge, the two follow-up intents — **including the
  `/write-tests`-on-unlaned-briefs intent this lane's A4 clause is the interim for** — and the
  `.gitignore` unowned authorization. CC-9, CC-13, A13's lane-name correction. **This
  api-integration lane authors no node and no edge of its own** — its commands describe graph writes
  that graph-maintainer performs at run time; it writes none while implementing this brief.
- **`brief-conveyor-ci-6a9f` — `observability-release`.** `.github/workflows/**` and
  `.github/CODEOWNERS`: the new `issue-sync.yml` (with A16's `permissions`, token and dry-run
  default), A9's transcription job diffing each printed block against `spec:status` output, and the
  `drift-review.yml` `continue-on-error` deletion and header rewrite. A9, A16 (the workflow half),
  CC-3, CC-5, CC-10a. **A9 is the CI check over this lane's prints** — it consumes what this lane
  writes but is not written here.
- **`brief-conveyor-lane-catalog-2d5b` — `product-spec`.** `.claude/lanes/**` (the eight catalog
  files this lane's `/decompose-lanes` pointer will point *at*), `.claude/agents/**` (the seven
  implementer agents that `implement-brief.md`'s owner routing will delegate *to*, plus the
  `spec-writer`, `contract-reviewer`, `test-writer` and `integration-reviewer` edits), and
  `.gitignore`. A10, CC-2, CC-9, CC-10d, CC-16. **`.claude/agents/**` is not this lane's** even
  though this lane's commands invoke those agents by name.
- **`brief-conveyor-docs-9e31` — `docs-spec`.** `CLAUDE.md`, `README.md`, `CONTRIBUTING.md` and
  `docs/**`: the output-attention conventions, the mix-and-match rule, lifecycle completeness, the
  conveyor subsection, and **A7's lifecycle step-5 amendment at `CLAUDE.md:71`**. A7 (the governing-
  doc half), CC-10b, CC-10d, CC-12, CC-13, CC-14. **This lane edits no `CLAUDE.md` line**, including
  the work-class routing table it cites as authority for the `write-brief.md` correction.
- **`brief-conveyor-tests-4c86` — `test-verification`.** `tests/**`, written by `test-writer` via
  `/write-tests`, never by the invocation that implemented the code under test. It builds **A6's
  pin** over this lane's command surface, the union lane pin (A13), the conveyor unit tests and the
  fixture updates. A6, A12's pin, A13, CC-2, CC-5, CC-8, CC-9, CC-12, CC-15, CC-16. **This lane
  writes no test**; it supplies the two byte-equal literals A6's pin reads and nothing more.
- **Within this lane, also out of scope:** `.claude/commands/update-spec-graph.md` (not a chain
  step); any widening of `write-tests.md:5-6`'s precondition (contract `## Out of scope` 6 — it
  changes intended behaviour and is routed to a follow-up intent); any `NEXT` block in
  `detect-drift.md`; and any edit to `CLAUDE.md`, `tests/**`, `tools/**`, `specs/**`, `.github/**`,
  `.claude/agents/**`, `.claude/lanes/**` or `.gitignore`.

## Cross-lane dependencies & integration expectation

**This lane depends on (named, not taken):**

1. **`domain-backend` — hard runtime dependency.** Every `pnpm spec:status <id>` line this lane
   writes is inert until Scope 3 lands the subcommand (`tools/spec.ts:9-27` has no `status` today).
   A1's fallback is the designed behaviour in that window, which is why the fallback is written
   first-class rather than as a footnote.
2. **`domain-backend` — CC-10c's drift packet.** `detect-drift.md`'s contract-**and**-decision
   judging is complete only when `DriftPacket` (`tools/driftmap.ts:20-33`) carries the selecting
   decision; until then the command follows the contract's inbound `selects` edge itself.
3. **`domain-backend` + `docs-spec` — A7's other two artifacts.** The resolver rule for a `brief` at
   `implemented` is `domain-backend`'s; the `CLAUDE.md` lifecycle step-5 amendment is `docs-spec`'s.
   **`CLAUDE.md:71` today reads "Implementation (code only; no graph writes)", so until `docs-spec`
   lands its edit this lane's `/implement-brief` contradicts the governing document.** That window
   is sanctioned by `decision-conveyor-derived-5a91`'s rule-5 declaration and must be stated in the
   PR, not silently tolerated.
4. **`data-migration` + `product-spec` — `implement-brief.md`'s owner routing.** The `owner` field
   and the seven implementer agents do not exist yet. The owner-less path (implement inline, say so)
   is the declared behaviour and is the path every brief in this decomposition takes.
5. **`product-spec` — the lane catalog.** `decompose-lanes.md`'s pointer and market read
   `.claude/lanes/*.md`, which do not exist yet; the command must degrade to a named error rather
   than a silent empty market.
6. **`test-verification` — A6's pin literals.** The A1/A6 distinguishability contract in
   `## Pinned decisions` is byte-identical in this brief and `brief-conveyor-tests-4c86`: the
   token `pnpm spec:status`, the region-opening line `FALLBACK (RESOLVER UNAVAILABLE):`, the
   region-closing pattern `^[A-Z][A-Z0-9 /()-]*:$`, and the pin's file set as the **14 chain
   commands**. **Neither lane may vary it unilaterally.**
7. **`observability-release` — A9's transcription job** diffs each printed block against
   `spec:status` output; the block this lane writes is its input.
8. **`docs-spec` — the `CLAUDE.md` lifecycle renumbering.** `brief-conveyor-docs-9e31` inserts a
   review-and-comparison step into `CLAUDE.md`'s numbered lifecycle, renumbering every step after 2.
   It correctly declines to edit the downstream references and hands each to the lane that owns the
   file; **two of them are this lane's**, both verified on disk: `approve-contract.md:15`
   ("lifecycle step 3") and `prepare-evidence.md:27` ("lifecycle step 6"), re-pointed by ordered
   steps 5 and 9.2 above. `capture-intent.md:11` cites step 1 and is **unaffected**. This lane
   edits no `CLAUDE.md` line — it only follows the renumbering inside its own files, and the two
   citations are stale for the window between the two PRs.

**A cross-lane conflict, recorded not taken.** A8 ("author a writer for every marker the resolver
reads") is `domain-backend`'s amendment, but one of its two permitted resolutions — *author the
writer in `/decompose-lanes`* — lands in **this lane's file**. This brief does **not** take it
unilaterally. Step 7.4 already requires `/decompose-lanes` to state per lane why a patch market was
or was not opened, which is the natural place for a `## Strategy tension` marker; if
`domain-backend` resolves A8 that way, the writer clause is added here, coordinated, in the same PR.
If `domain-backend` instead deletes the marker and templates the step, this lane changes nothing.
Either way, no lane edits another lane's file.

**A rule-5 event this lane surfaces and does not resolve.** A7 makes `/implement-brief` write the
graph so a `brief` at `implemented` routes to `/prepare-evidence`. **`/write-tests` has the
identical defect and A7 does not name it**: `write-tests.md:9` states the agent "performs no graph
writes", so a `test-verification` brief stays at its pre-implementation status forever, Behaviour
2.5(b) keeps matching, and the conveyor reprints `/write-tests <brief-id>` — the same loop, on the
one lane that may not be run through `/implement-brief`. Extending A7's flip to `/write-tests`
**changes intended behaviour on a second command and is outside A7's letter**, so per CLAUDE.md rule
5 and `decision-conveyor-derived-5a91`'s standing instruction ("if any further graft would change
intended behaviour, STOP and return to human approval rather than widening scope inside the winner")
this lane implements nothing for it and routes it to human approval — a new `decision`, or a
follow-up intent alongside `data-migration`'s Scope 14.4. **Consequence to state in the PR:** the
contract's headline acceptance ("end-to-end by paste alone") is not reachable for the
`test-verification` lane of this very decomposition until that is resolved; the operator runs
`/prepare-evidence <brief-id>` by hand there, and that hand-assembled hop is a known, recorded
exception rather than an undetected defect.

**Integration expectation.** This laned brief reaches `implemented` via **this lane's own final
`evidence`** (`evidence —evidences→ brief`), while `intent-self-guiding-delivery-loop-6d79` stays
**`open`** — a laned brief's evidence implements the brief but never addresses the intent. The
contract `contract-conveyor-derived-4c8c` completes **only** via a final `integration` node
(authored by `/integrate`) that `integrates` a final evidence for **every live lane** —
`domain-backend`, `data-migration`, `api-integration`, `observability-release`, `product-spec`,
`docs-spec` and `test-verification`. Seven briefs make this multi-brief under the
`coverage-coherence` rule (cutoff `2026-06-18`; the contract's `2026-07-27` `created` is after it),
so integration is not skipped and the intent cannot reach `addressed` until that final integration
covers every live lane. **If a lane collapses** (its work proves unnecessary or folds into another),
it is **superseded** per CLAUDE.md rule 3 — a `supersedes` edge from its successor, the collapsed
brief moved to its terminal status — **never forced into a ceremonial integration**; the integration
node covers only the lanes that remain live. Per CC-10(d), that integration node's
`compliance-verdict` section enumerates CC-1…CC-16 and A1…A16 and names each item's discharging
brief; **this brief is the named discharger of A1, A3, A4, A7 (the command half), A14, A15, A16 (the
`/decompose-lanes` refusal half), CC-1, CC-7 and CC-11 (the `issue: not synced` rendering half).**

## Acceptance & verification (scoped to this lane)

This lane ships prompt prose. It has no validation rule of its own — nothing under `specs/schema/`
reads `.claude/commands/**` — so its machine check is `test-verification`'s A6 pin and
`observability-release`'s A9 transcription job, both of which consume artifacts defined here. What
follows is what this lane's slice must satisfy.

1. **The type-wrong hop is fixed (contract Acceptance 1 and 2; the intent's named defect).**
   `select-patch.md`'s closing report prints `/prepare-evidence <brief-id>`, never
   `<winner-branch>`; the brief id comes from the winner's `competes-for` edge already located at
   `:5-6`; the branch survives as context. Verified by direct read and by
   `grep -n 'winner-branch' .claude/commands/` returning nothing on a `/prepare-evidence` line.
2. **Every chain command reproduces the resolver's `NEXT` block (Scope 10.1, contract Behaviour
   6).** All 14 chain files carry the resolver-invocation clause containing the literal `pnpm
   spec:status`, positioned after the mutating step, with "verbatim" bound to the block only and the
   command's own judgement content around it. `detect-drift.md` and `update-spec-graph.md` carry no
   such clause. Verified by grep over the file set, and — once `domain-backend` and
   `observability-release` land — by A9's transcription job, which is the durable oracle this lane's
   prose is written for.
3. **The fallback is degraded, marked, and pin-inert (A1).** All 14 chain files carry exactly one
   `FALLBACK (RESOLVER UNAVAILABLE):` region; no fallback region
   substitutes any id or contains `spec:status`; each states that its placeholders are required
   and that it is not a routing source. **The negative acceptance is the important one:** deleting a
   file's resolver clause while leaving its fallback intact must still red A6's pin. Verified with
   `test-verification` against the built pin, not by this lane's own read.
4. **The two failure modes print differently (A1 × A15 / CC-7).** A red `spec:validate` yields
   findings, remediation and explicitly no next step — no `NEXT` block **and no fallback**; an
   unavailable resolver on a green graph yields the marked fallback. Every mutating command echoes
   its resolved ids before the write. Verified by read of each mutating command against
   `select-patch.md:31`'s "nothing is committed on red" clause and its eleven siblings.
5. **No unsubstituted placeholder on a resolved print (A3), with the recorded correction.**
   `propose-patches.md:33` and `synthesize-patches.md:28` no longer print `/compare-patches
   <brief-id>` with the id unfilled. `compare-patches.md:29`'s `<winner>` **remains**, with an
   explicit sentence stating it is a human choice the command does not hold — removing it would
   contradict `compare-patches.md:29-30`'s "Do NOT select or rank the candidates". Verified by
   `grep -n '<[a-z][a-z-]*>' .claude/commands/*.md` reviewed line by line against this rule.
6. **`/review-contracts` steps 2 and 3 are retargeted, not just step 5 (A14 / CC-1).** Step 2
   instructs a verdict pointer per candidate for class 2+ and keeps a full critique on the candidate
   body for class 0–1; step 3's guard counts verdict pointers per routed critic and still stops on a
   missing perspective; step 5 no longer appends critique sections for class 2+; step 6 is the
   decision block above the Behaviour-2.3 templates. Verified by read against
   `comparison-conveyor-market-890e`'s common-core finding 1 (the binding text) and against the
   ten-section exemplar at `contract-conveyor-derived-4c8c.md:260-317`.
7. **The `approve-contract.md` orphan is closed (A14).** `:20-23` no longer offers "the candidates'
   appended critiques" as the grandfathered analysis of record for a market whose critiques step 5
   will no longer append. Verified by read: every artifact the sentence names still exists after
   this lane's own edit to `review-contracts.md`.
8. **`/decompose-lanes` refuses, markets, and prints waves (A16, CC-11, Scope 10.3).** An
   implementation-bearing lane list omitting `test-verification` stops the command with a report and
   no graph write; the inline enumeration at `:9-10` is a pointer; every wave line carries an owner,
   a paste-ready command, a per-lane patch-market rationale, and an issue link **or the literal
   `issue: not synced`**; each drafted lane brief's body records its wave. Verified by read, and by
   exercising the refusal path against a lane list omitting `test-verification`.
9. **`/implement-brief` has exactly one graph write, routed and idempotent (A7, Scope 10.4).** The
   command flips its brief to `implemented` through graph-maintainer and does nothing else to the
   graph; it delegates to the brief's `owner` when present and implements inline (saying so) when
   absent; `prepare-evidence.md` treats an already-`implemented` brief as a no-op. Verified by read,
   and by confirming the PR states the `CLAUDE.md:71` contradiction and cites
   `decision-conveyor-derived-5a91`'s rule-5 declaration as its approval.
10. **`write-brief.md` matches the routing table, and A4's block is recoverable.** `:6-8` states
    class 3 requires lanes, class 2 may lane and may open a market, class 0–1 keep a single unlaned
    brief — byte-consistent with `CLAUDE.md:89-94`. The class-≥1 unlaned closing block carries a
    `kind: action` line that is not paste-shaped and names both recoverable actions.
    `write-tests.md:5-6`'s precondition is **unchanged**; only its refusal report improved. Verified
    by read against the routing table and contract `## Out of scope` 6.
11. **`/detect-drift` judges the effective contract (Scope 10.5).** Its judging instruction names
    the contract **and** its selecting decision, and states where the decision comes from before and
    after CC-10c. Verified by read against `tools/driftmap.ts:20-33`.
12. **The four body templates are pinned to on-disk exemplars (Scope 10.6).** `review-contracts.md`
    and `compare-patches.md` carry the comparison shape (patch markets keeping the six axes already
    at `compare-patches.md:17-20`); `approve-contract.md` and `select-patch.md` carry the decision
    shape with the identifier-prefixed amendment list and the closing next-step line; both are
    labelled prose conventions rather than validation rules. Verified by read against
    `comparison-patch-market-synthesis-7b1d`, `comparison-conveyor-market-890e`,
    `decision-patch-market-ci-gate-8a2f` and `decision-conveyor-derived-5a91`.
13. **CI / mutation discipline.** The command files keep the canonical `pnpm spec:index && pnpm
    spec:validate` text. The graph writes that record this brief and, later, this lane's evidence
    and `touches` wiring run that gate — in this PRoot environment as `node_modules/.bin/tsx
    tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate` — and **must not commit
    on red**. This lane's diff is `.claude/commands/**`-only, so its evidence `touches` resolves to
    `capability-lifecycle-commands-4f5a`.

Edge for graph-maintainer to record for this brief node: `brief —decomposes→
contract-conveyor-derived-4c8c`, with this brief carrying `lane: api-integration` and no `owner`
(the bootstrap above).
