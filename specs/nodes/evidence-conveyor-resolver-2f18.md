---
id: evidence-conveyor-resolver-2f18
type: evidence
title: Domain-backend lane implemented — the conveyor resolver, spec:status, the trails+status views, the planIssueSync seam, the A11 consolidation, and three defects the verification lane found
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-resolver-3f7a` (lane `domain-backend`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`b7aed9f` (the lane, 10 files, +1980/−49) and `d8bc47d` (three defect fixes, +44/−6).

## What landed

**`tools/conveyor.ts` (new) — contract Scope 1.** `nextSteps(spec, nodeId): Step[]`, pure,
deterministic, total, and never empty. `Step` carries `command`, `args`, `rendered`, `kind`, `why`;
`StepKind` is `paste | template | action`. Plus `deriveStage`, `liveIntents`,
`CONVEYOR_CLASS_ROUTING` and the two derivations `marketRequired`/`lanesRequired`. No I/O, no
`Date`, no `process.env`, no `spawnSync` — the module is imported by `indexer.ts`'s serializers,
which run inside `handlers/indexes_fresh.ts` on every `spec:validate`, so a throw or a clock byte
here would escape through the fail-closed `spec:` channel and red every PR.

**`tools/issue_sync.ts` (new) — A2 + CC-4 + CC-5's seam.** `planIssueSync(spec, existingIssues,
opts)` is pure, deterministic, clock-free and network-free, with CC-4's three write conditions and
CC-5's listing-complete refusal. The `gh` adapter is a thin impure half over the plan, `spawnSync`
with an argv array and `shell: false`, **dry by default**. Nothing executes on import — the CLI
entry is guarded — which is what makes the seam unit-testable. Per Scope 3 it is deliberately **not**
a `spec` subcommand; it ships behind `spec:issue-sync`.

**`tools/spec.ts`** — `status` joined `SUBCOMMANDS` and `USAGE` as a read-only branch with an
optional node-id filter, emitting the machine-stable `NEXT` block. Exit codes as pinned: 0 for a
resolvable argument or none, 1 for a load failure through the existing fail-closed channel, 2 for a
malformed or unknown id.

**`tools/indexer.ts`** — `INDEX_FILES` widened to six with `trails.md` and `status.md`, two new
deterministic serializers, and the `serializeIndexes` object literal extended in the same edit.

**`tools/handlers/coverage_traversal.ts` + `coverage_coherence.ts`** — A11's lift and consume.

**`tools/driftmap.ts`** — CC-10(c): `DriftPacket` gained `decisions`, type-guarded to `decision`.

**`package.json`** — `spec:status` and `spec:issue-sync`.

## THE INDEXER TRAP, sprung as the brief predicted

`serializeIndexes` hard-codes an object literal typed `Record<IndexFileName, string>`, and
`IndexFileName` is derived from `INDEX_FILES`. Extending the array alone does **not** compile — the
literal is missing two keys and `tsc` fails. Both sites were edited together, and the doc comments
that asserted "four" were de-counted on the same CC-14 principle as `spec.ts`. The brief named this
trap in advance and it behaved exactly as described.

## A11 — the consolidation was settled, and it is bit-identical

Scope 2 of the approved contract contradicts itself: it claims `coverage_traversal.ts`'s exports
"supply every walk the resolver needs" while also saying consolidating the private walks "is not
required". A11 settled it, and the resolution held on inspection: `finalEvidenceForBrief` **is**
composable from `liveSourcesByEdge`; `briefsCoveredByIntegration` is **not** — it is a two-hop walk
with a `final` filter on its middle node, expressible by no single call. Both were lifted into
`coverage_traversal.ts` as exported walks and `coverage_coherence.ts` now imports them, so the
resolver and the rule that gates this contract's own completion read the **same** walks. That is
what makes it structurally impossible for `spec:status` to print `/integrate` for a contract
`coverage-coherence` would red — the defect the comparison records against Candidate A.

One precision the lift preserves: `liveSourcesByEdge`'s `excludeStatus` skips a node only when its
status is defined AND excluded, so an exclusion-based spelling would wrongly ADMIT a status-less
evidence node. The lifted `finalEvidenceForBrief` is therefore a status-blind walk plus an explicit
`status === "final"` inclusion filter — bit-identical to the closure it replaced.

**Verified mechanically:** `tests/coverage_coherence.test.ts` and `tests/coverage_traversal.test.ts`
pass **unchanged and unweakened** (29 tests), with **no test file edited** in the lift commit, and
`spec:validate` reports the same finding set as before the refactor.

## A12 — DECIDED: pin the literal, and the copy count is two

`CONVEYOR_CLASS_ROUTING` is a single exported literal machine-pinned byte-equal to `CLAUDE.md`'s
work-class table. Reading the table as data at run time was rejected for three recorded reasons:
CC-8 requires the view derivation be **total**, and parsing a prose markdown table is a partiality
source that would throw inside `indexes_fresh` and red every PR from a docs edit; it would make
`tools/**` depend at run time on an unvalidated governing document no rule reads, deepening the
layer inversion the architecture panel flagged; and it would make this lane build-order dependent on
`docs-spec`. A12 explicitly permits the pin, and its cost — a machine-checked second copy — is
accepted and recorded, not argued away.

`marketRequired` and `lanesRequired` are derived from the **pinned cell text**, not hand-written, so
no routing boolean escapes the pin. **Verified:** a repo-wide grep for `Trivial mechanical` outside
graph data and fixtures returns exactly two files — `CLAUDE.md` and `tools/conveyor.ts`. Never a
third.

## Three defects the verification lane found — fixed here, in the implementing lane

The `test-verification` lane generated real output rather than reasoning about behaviour, and found
three genuine bugs in this lane's code. In each case `test-writer` correctly refused to touch
`tools/**` and left the assertion failing; the fix landed here, in `d8bc47d`. This is the separation
of duties working, and it is worth recording as the substantive outcome of that lane rather than a
footnote.

1. **`issue_sync.ts` — CC-4(3)'s collapsed-lane close was unreachable.** `syncTargets` derived
   briefs through `liveBriefsForContract`, which excludes `superseded`, so a superseded brief was
   dropped from the target set **before** `shouldClose` could see it. The seam's own doc comment
   asserted the behaviour its target derivation prevented: "a collapsed lane is SUPERSEDED, never
   evidenced, so evidence alone would leave its issue open forever" — and that is precisely what
   happened. The brief walk is now deliberately status-blind (an empty exclude list, never
   `undefined`, which would trigger the `"superseded"` default), while `shouldClose` keeps the LIVE
   set for a contract's own coverage test so a collapsed lane cannot hold its parent's issue open.
2. **`conveyor.ts` — the A7 loop reappeared one step later.** `briefSteps` tested
   `status === "implemented"` **before** consulting `finalEvidenceForBrief`, while `deriveStage`
   checks evidence first. An already-evidenced brief therefore printed stage `brief-evidenced`
   alongside a step of `/prepare-evidence` — stage and step disagreeing, and `/prepare-evidence`
   reprinting itself after it had already run. That is the very loop A7 exists to close. Evidence
   now takes precedence, and an evidenced brief routes through its contract's coverage instead.
3. **`conveyor.ts` — a resolved patch market routed to `/implement-brief`.** A brief whose market
   had a `selects`-ed winner fell through to the no-market path, telling the operator to implement a
   brief whose implementation had just been selected. `select-patch.md` prints
   `spec:status <brief-id>`, so that was the branch the command actually reached. A resolved market
   now yields `/prepare-evidence <brief-id>`, agreeing with the patch-side 2.8 answer — the two
   disagreed before.

All three are now pinned by `tests/conveyor.test.ts` and `tests/issue_sync.test.ts`, and the two
transcript blocks that had recorded the buggy output were regenerated from real output.

## Acceptance, verified

- **The named hop (Acceptance 2).** `nextSteps` on a `selected` patch returns
  `/prepare-evidence <brief-id>` resolved through `briefsForPatch`'s `competes-for` walk — a brief
  id, **never a branch**. On an `approved` class-3 contract with no brief it returns
  `/decompose-lanes`, never `/write-brief`; on a one-candidate class-1 intent, `/approve-contract`.
- **A5 — terminality is computed, not declared.** `grep -cE "terminal:" tools/conveyor.ts` → **0**.
  No command carries a terminal boolean; `/prepare-evidence` is terminal only when
  `liveBriefsForContract(...).size === 1`, and `/integrate` only at final coverage.
- **A7's resolver rule** — a `brief` at `implemented` returns `/prepare-evidence <brief-id>`,
  `kind: paste`. Reachable in practice since `api-integration` shipped the flip; this very
  evidence run is routed by it.
- **A8 — the reader is honest.** The resolver **transcribes** the `## Strategy tension` marker and
  never infers tension; a class-≥2 brief without it gets a `kind: action` judgement reminder, never
  a paste-able `/propose-patches`. The writer half is `api-integration`'s `/decompose-lanes`, which
  shipped it — the cross-lane dependency this lane's option-(a) choice created, discharged.
- **CC-6 — refusal at the egress points.** No id failing `^[a-z]+-[a-z0-9-]+-[0-9a-f]{4}$` is
  rendered into a `Step.rendered` line or passed to `gh`; the resolver emits an explicit "no
  derivable next step, and why" instead. **Honest bound:** this is a tool-side refusal, not a graph
  invariant — the id convention remains a comment in `node-types.yaml` with no rule behind it, and
  that rule belongs to Phase 10 Step 0.
- **CC-8 — total and clock-free.** `spec:index` run twice is byte-identical. A grep for `Date`,
  `process.env`, `localeCompare` and `toLocale` across `conveyor.ts` and `indexer.ts` returns only
  **doc-comment** lines. A graph with a malformed node — unknown `type`, absent `status`, class
  outside 0-3 — serializes both views without throwing.
- **CC-14** — `grep -c "four files" tools/spec.ts` → **0**; the count renders from
  `INDEX_FILES.length`. No hand-maintained count survives in `tools/`.
- **Scope 3** — `grep -c "issue_sync" tools/spec.ts` → **0**. No import path leads from the
  read-and-validate dispatch to the sync.
- **Risk 1's floor** — `nextSteps` never returns `[]`, including for an id that resolves to no node
  and for a CC-6-malformed id.

## Verification observed

- `node_modules/.bin/tsc --noEmit` → exit 0. `eslint .` → clean.
- `node --test --import tsx tests/*.test.ts` → **287 pass, 0 fail** (was 187 with 4 failures before
  this lane's fixture blast radius was cleared by `test-verification`).
- `node_modules/.bin/tsx tools/spec.ts validate` → **OK, 20 rules, 0 errors.**
- `spec:index` twice → byte-identical; `INDEX_FILES.length` → **6**.
- `spec:status` exercised against the real graph and against constructed specs for every routing
  branch.

## Deviations and residuals

1. **The fixture blast radius was real and is now closed.** Widening `INDEX_FILES` reddened three
   `expected-errors.txt` fixtures and two stale declarations in `tests/spec.test.ts`. This lane
   correctly did **not** repair them — they are `test-verification`'s files — and the branch carried
   a red `pnpm test` between the two lanes' commits. That window is an ordering fact for
   `/integrate` to record, not a defect in either lane. It is now closed.
2. **A9's transcription job is `observability-release`'s** and consumes this lane's `NEXT` block.
   The block's shape — a line beginning `NEXT `, one `<kind> <rendered>` line per step, a line that
   is exactly `END` — is the resolver's rendering and is the authority; the extractor was
   reconciled to it, not the reverse.
3. **CC-11's `wave` is rendered but not yet written.** The views render each lane brief's `wave` and
   `issue: not synced` totally, with an absent value shown explicitly rather than crashing. The
   writer is `/decompose-lanes` (`api-integration`) and the field is undocumented in the schema
   while `owner` is documented — an asymmetry the integration node should resolve.
4. **`spec:issue-sync` has never been run against a live repository.** The seam is unit-tested and
   the adapter is dry by default; a real `gh` round trip is an `observability-release` runtime
   observation, not claimable here.

## Discharge key (CC-10(d))

This brief is the named discharger for **A2, A5, A7** (the resolver half), **A8** (the reader),
**A11, A12, CC-4, CC-5** (the seam), **CC-6, CC-8, CC-10(c), CC-11** (the views half) and **CC-14**
(the `tools/spec.ts` half).
