---
id: evidence-conveyor-commands-8a52
type: evidence
title: Api-integration lane implemented — the resolver NEXT block and marked degraded fallback across 14 chain commands, the type-wrong /prepare-evidence hop fixed, retargeted critic routing, and the four pinned body templates
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-commands-c14d` (lane `api-integration`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`6c5ca89` (15 files, +543/−93), with two stale-citation corrections in this evidence's own commit
(see *The lifecycle renumbering* below). `.claude/commands/update-spec-graph.md` is the 16th file in
that directory and was correctly not touched — it is not a chain step.

## The contract's proof case is closed

`select-patch.md` printed `/prepare-evidence <winner-branch>` while `prepare-evidence.md:4` takes a
brief node id. The datum was already in hand — `select-patch.md:5-6` locates the brief via the
winner's `competes-for` edge — so this was a pure **type error**, not a missing lookup, which is why
the contract nominated it as the proof case. The closing report now prints
`/prepare-evidence <brief-id>` resolved through that edge, and the winner's branch survives as
context, never as the argument. Verified: `grep -n "winner-branch" .claude/commands/` returns
**nothing** anywhere in the directory.

## A1 — the degraded fallback, and its three binding constraints

Every chain command retains a static, self-contained fallback print in its own markdown, used only
when the resolver itself is unavailable. This patches Candidate B's shared-failure-domain defect: B's
stated `trails.md` fallback comes from `indexer.ts` and dies with the same `loadSpec()` it covers.
The decision binds it three ways and all three hold:

1. **Template-shaped — no resolved ids.** Each fallback names its next command(s) in pure
   `<placeholder>` form and fills nothing, *including ids the command holds as its own arguments*.
   That is what keeps a degraded print visibly distinguishable from a resolved one — the
   reliability panel's finding that "a hand-typed `NEXT` block is indistinguishable from a resolved
   one".
2. **Explicitly marked** as the resolver-unavailable path, so it never becomes a second
   authoritative routing source and never re-imports Candidate A's sixteen-copy divergence surface —
   the exact axis Candidate B won on.
3. **It does not satisfy A6's pin.** Verified by `test-verification`'s negative leg, which for
   **every** chain file strips the resolver clause from the non-fallback text (asserting the
   fallback region stays byte-identical), confirms the pin now fails, then injects
   `pnpm spec:status` *inside* the intact fallback and confirms the pin **still** fails. A
   print-less command reds CI even though it carries fallback prose.

**A1 × A3, reconciled explicitly** so no later reviewer "fixes" a fallback by substituting ids: A3's
no-unsubstituted-placeholder invariant binds the **resolved** path only; inside the marked fallback
placeholders are **required**, not defects. That exemption is written into the fallback prose itself.

**A1 × A15, reconciled** — two failure modes, two different outputs. The fallback fires only when
the resolver is unavailable. A red `spec:validate` prints findings, remediation and explicitly **no**
next step: no `NEXT` block **and no fallback**, because printing a template step there would walk the
operator past the failure A15 exists to stop.

## The A1/A6 distinguishability contract, byte-identical across two lanes

The five clauses are reproduced byte-for-byte in this brief and in `brief-conveyor-tests-4c86`;
neither lane may vary them unilaterally. Token `pnpm spec:status`; region opens with a line that is
exactly `FALLBACK (RESOLVER UNAVAILABLE):`; region closes at the next line matching
`^[A-Z][A-Z0-9 /()-]*:$` or EOF; no region contains the substring `spec:status`; and after excising
every region each of the **14** chain files contains the token at least once.

An earlier draft of the two briefs pinned *different* literals — a lowercase em-dashed heading here
against an ALL-CAPS delimiter there — which would have made the pin's excision never fire and A6
pass **vacuously**, the precise defect A6 exists to prevent. That was caught in review before either
lane was implemented and reconciled to one byte-identical block.

**Verified over all 14 files:** each carries exactly **one** `FALLBACK (RESOLVER UNAVAILABLE):`
heading, exactly **one** `pnpm spec:status` outside its fallback region, and **zero** occurrences of
`spec:status` inside it. `detect-drift.md` and `update-spec-graph.md` carry the token **zero** times
and no `NEXT` block — `detect-drift.md` is in this lane's file set for Scope 10.5 only, is not a
chain step, and closes with a `kind: action` rule-5 routing line instead.

## A3 — the invariant, with the decision's recorded correction

`propose-patches.md` and `synthesize-patches.md` printed `/compare-patches <brief-id>` while the
brief id is the command's own first argument; both now substitute it.

**`compare-patches.md`'s `<winner>` is NOT an instance, and removing it would have broken the
command.** It is a human choice the command does not hold, and the same file forbids the command to
rank ("Do NOT select or rank the candidates"). That is stated explicitly in the file, because it is a
correction the decision records rather than a judgement left implicit. The same reading covers every
free-text argument — `"<rationale>"`, `'<amendments>'`, `"<notes>"`, `"<strategies>"`,
`"<instruction>"` — each of which the resolver itself emits as `kind: template`.

## A14 / CC-1 — steps 2 AND 3 retargeted, not step 5 alone

All three candidate contracts edited `/review-contracts` step 5 only, leaving step 2's `## Critique`
appending instruction and step 3's guard live. Both are retargeted here:

- **Step 2** — for a class-2+ market each routed critic produces **one verdict-pointer line per
  candidate** (verdict word, one-sentence strongest finding, pointer to the comparison), pinned to
  the on-disk exemplar: the ten `## Critique (<axis>)` sections of `contract-conveyor-derived-4c8c`.
  For **class 0–1** the critique stays a section on the candidate body, because a class-0/1 review
  records no comparison and the finding would otherwise have nowhere to live.
- **Step 3** — the count-enumeration guard now counts **one verdict pointer per routed critic**. Its
  teeth are preserved: a missing perspective stops the command and names which, and a perspective
  that found nothing records an explicit "no concern on this axis" so silence is never read as a
  clean bill.

**The `approve-contract.md` orphan — an amendment this very review produced.** That file offered "the
candidates' appended critiques" as the grandfathered analysis of record, while Scope 10.2 deletes the
appending that would create them. It now names what actually survives: for a class-≤1 selection the
candidate body's own critique section; for a pre-cutoff class-2/3 selection whatever analysis that
market actually recorded, named explicitly in the decision body. Never an artifact the market did not
produce. The quorum pre-check and the `comparison_required_from` citation rule were left alone.

## A15 / CC-7, A16, A7 and Scope 10.3-10.6

**A15 / CC-7 — echo before mutating, suppress the print on red.** All **13** mutating commands carry
the echo-before-mutate clause, the `ON RED:` clause and the canonical
`pnpm spec:index && pnpm spec:validate` text. Commands ended "nothing is committed on red" yet all
three candidates printed *after* it; on red they now print findings, remediation and explicitly no
next step.

**A16 — `/decompose-lanes` REFUSES.** It previously *instructed* including a `test-verification`
lane; an instruction is not a refusal. An implementation-bearing lane list omitting it now stops the
command, reports why, and writes **nothing** — no brief nodes, no edges — stated as a precondition
alongside the existing `selects`-edge one.

**A7's command half.** `/implement-brief` performs exactly one graph write: graph-maintainer flips
its brief to `implemented`. Status precision as pinned — it flips from the brief's
*pre-implementation* status (`draft` or `approved`) and the resolver keys on the **resulting**
status, never on a prior `approved`, because nothing in this repo authors a brief at `approved` and a
precondition would have made the command refuse all seven briefs of this decomposition. Downstream
idempotence landed in `prepare-evidence.md`: an already-`implemented` brief is a **no-op**, not a
conflict — a clause exercised for real by three of the evidence runs on this contract.

**Scope 10.3** — `write-brief.md`'s class rule corrected against the routing table: class 3 requires
lanes, class 2 **may** lane and may open a market per brief, class 0–1 keep a single unlaned brief.
It previously said class 0–2 keep a single brief, contradicting the table's `optional` cells.
`decompose-lanes.md`'s inline eight-lane enumeration became a pointer to the `.claude/lanes/` catalog
and `brief-lane-valid`.

**Scope 10.5** — both drafting commands carry the effective-contract clause and name each amendment
by identifier; `detect-drift.md` judges against the contract **and** its selecting decision, noting
that the packet's `decisions` field supplies it (CC-10(c), landed) and that before it the command
follows the contract's inbound `selects` edge.

**Scope 10.6** — the four pinned body templates: the comparison shape in `review-contracts.md` and
`compare-patches.md` (the latter keeping the six existing patch axes), the decision shape in
`approve-contract.md` and `select-patch.md`, each labelled a **prose convention for
graph-maintainer, not a validation rule**, and each naming its on-disk exemplars by id.

**CC-11's rendering half** — every wave line carries its issue link or the literal
`issue: not synced`, never blank, because a blank column reads as a lost lane while `not synced` is a
normal outcome of a best-effort sync. Wave assignment is persisted in the drafted brief's **body**,
taking no schema field — `wave` as frontmatter would be `data-migration`'s surface.

## The A8 writer clause — a conditional graft, and its condition was met

A8 is `domain-backend`'s amendment, but one of its two permitted resolutions — *author the writer in
`/decompose-lanes`* — lands in this lane's file. The brief did **not** take it unilaterally; it
conditioned it: "if `domain-backend` resolves A8 that way, the writer clause is added here,
coordinated, in the same PR." That lane resolved it exactly that way ("author the writer; do NOT
delete the marker"), and its resolver reads the marker. So `/decompose-lanes` now writes a
`## Strategy tension` section into a lane brief when it opens a market, and states per lane why a
market was or was not opened. The condition was met and is recorded, rather than the graft being
taken silently.

## The lifecycle renumbering — two citations corrected here

`docs-spec` inserted a review-and-comparison step, shifting every number after 2, and correctly
declined to edit the downstream references — handing each to the lane that owns the file. Two were
this lane's, and both were stale as of `d666190`:

- **`approve-contract.md`** cited "CLAUDE.md lifecycle step 3" for the status changes. Human
  selection is now **step 4**.
- **`implement-brief.md`** carried a clause saying the CLAUDE.md amendment "still reads
  'Implementation (code only; no graph writes)'" and that the command "knowingly runs ahead of the
  governing document". Both halves were true when written and are now false: `docs-spec` landed the
  amendment, and the Implementation step is step 6.

**DEVIATION, recorded not absorbed.** The brief said to confirm the landed number and write *that
number*. Instead both citations were made **number-free** — `approve-contract.md` now says "CLAUDE.md's
Human-selection lifecycle step" and `implement-brief.md` says "CLAUDE.md's lifecycle Implementation
step". Writing "step 4" would have satisfied the brief literally while re-arming the identical
staleness on the next lifecycle insertion; a step's *name* is stable where its number is not. This is
a HOW refinement that strictly strengthens the brief's intent, but it is a departure from its letter
and is flagged for the reviewer rather than presented as compliance.

`capture-intent.md`'s "lifecycle step 1" is genuinely **unaffected** by the insertion and was left
alone. `prepare-evidence.md`'s citation was already rewritten during implementation to name only the
status changes that command still makes, which removed its number as a side effect.

**Still stale, and NOT this lane's to fix:** `.claude/agents/contract-reviewer.md:8` cites "lifecycle
step 3 (human selection)". That file is `product-spec`'s and is handed to that lane.

## Verification observed

Each mechanical, over the whole file set, not sampled:

| Check | Result |
|---|---|
| `pnpm spec:status` outside the fallback, per chain file | **1** in each of 14 |
| `spec:status` inside a fallback region | **0** in all 14 |
| `FALLBACK (RESOLVER UNAVAILABLE):` heading, byte-equal | exactly **1** in each of 14 |
| same token in `detect-drift.md` / `update-spec-graph.md` | **0** and **0** |
| paste-shaped line with an unfilled id on a resolved path | **none** |
| `winner-branch` anywhere in `.claude/commands/` | **0** |
| echo + red-suppression + canonical gate, per mutating command | present in all **13** |
| remaining `lifecycle step N` citations in this lane's files | **0** (one remains in `product-spec`'s) |
| `tests/conveyor.test.ts` (carries A6's pin and its negative leg) | **64 pass, 0 fail** |
| `node --test --import tsx tests/*.test.ts` | **287 pass, 0 fail** |
| `spec:validate` | OK, 20 rules, 0 errors |

## Honest bounds

- **This lane ships prompt prose and has no validation rule of its own** — nothing under
  `specs/schema/` reads `.claude/commands/**`. Its machine checks are `test-verification`'s A6 pin
  (landed, green, with a non-vacuity leg) and `observability-release`'s A9 transcription job (landed,
  verified locally on all three legs). Both consume artifacts defined here.
- **A6 pins that each command *instructs* the agent to run the resolver, not that any run occurred.**
  A9 covers the printed-block half. Neither proves a human ran `spec:status` when they wrote a block;
  a hand-typed byte-equal block passes. That residual is A9's recorded bound and is unclosed.
- **No command in this lane has been executed end-to-end by an operator following only printed
  lines.** The contract's headline acceptance — a real change walked by paste alone — remains a
  single human observation to be recorded at integration, and this lane's prose is written for it
  rather than claiming it.

## The rule-5 event this lane surfaced and did not resolve

**`/write-tests` has the identical A7 defect and A7 does not name it.** That command performs no
graph write, so a `test-verification` brief stays at its pre-implementation status forever,
Behaviour 2.5(b) keeps matching, and the conveyor reprints `/write-tests <brief-id>` — the same loop
A7 closes, on the one lane that may not be run through `/implement-brief`. Extending the flip to a
second command changes intended behaviour beyond A7's letter, so per CLAUDE.md rule 5 and the
decision's standing instruction this lane implemented **nothing** for it and routed it to human
approval. What it did instead: `write-tests.md` states the gap plainly as a KNOWN GAP and directs the
operator to run `/prepare-evidence <brief-id>` by hand.

**Consequence, stated rather than left to be discovered:** the headline acceptance is not reachable
for the `test-verification` lane of this very decomposition until that is resolved, and the operator's
hand-assembled hop there is a known, recorded exception rather than an undetected defect. It remains
open at the time of this evidence.

## Discharge key (CC-10(d))

This brief is the named discharger for **A1, A3, A4, A7** (the command half), **A14, A15, A16** (the
`/decompose-lanes` refusal half), **CC-1, CC-7** and **CC-11** (the `issue: not synced` rendering
half).
