---
id: decision-conveyor-derived-5a91
type: decision
title: Select Candidate B (derived conveyor) for the self-guiding delivery loop, grafting A and C
decided_by: Samir Benzenine
created: 2026-07-28
produced_by: "/approve-contract"
---

SELECTED (→ approved): `contract-conveyor-derived-4c8c` (Candidate **B**, derived conveyor) for
`intent-self-guiding-delivery-loop-6d79` (class 3). REJECTED (→ rejected):
`contract-conveyor-prose-f6fe` (Candidate **A**) and `contract-conveyor-pinned-8df4` (Candidate
**C**).

This is a step-3 selection in the `decision-patch-market-ci-gate-8a2f` mould: one base approved,
with the grafts from the rejected candidates and the panel's mandatory fixes **recorded here** —
not silently absorbed — and binding every brief that decomposes this contract. **The approved
contract body is never edited. The effective contract is `contract-conveyor-derived-4c8c` plus the
amendments below.**

Unlike that precedent, **one amendment (A7) does change intended behaviour**, and is approved here
under CLAUDE.md scope-integrity rule 5 — see *Rule-5 declaration*. Every other amendment refines
HOW, not WHAT. If, while writing a brief, any further graft would change intended behaviour, STOP
and return to human approval rather than widening scope inside the winner.

## Accepted trade-off (why B)

B is the only candidate that makes the intent's headline acceptance — *any hand-assembled ID is a
defect* — **structural rather than review-only**. A and C both leave ID substitution to an agent
reading markdown: the very control that let `select-patch.md:40` print a branch where
`prepare-evidence.md:4` needs a brief id. B moves it into code, so every printed ID is resolved
from `edges.yaml` rather than recalled.

The accepted price is stated plainly: a prompt layer that renders at run time from `tools/`, an
inverted `.claude/**` → `tools/**` dependency, the largest implementation of the three, and a
last-hop transcription that is still prose-enforced in B as written. Amendments A1 and A9 buy back
the two sharpest parts of that price — the shared failure domain and the unobservable
transcription.

## Why each rejected candidate lost

**A (`contract-conveyor-prose-f6fe`)** — A keeps fourteen prints and one derivation in agreement by
review alone, and Trade-off 6 supplies its own base rate: eight commands silent for nine phases
because nothing checked. Risk 1's "stated once and referenced" contradicts Scope 1's fourteen
per-file paragraphs carrying real IDs; the single machine check is presence-only over a truth held
in sixteen places. Its cost case rests on a false boundary — "already-exported walks" against
private closures (`coverage_coherence.ts:68-102`) — so A writes a second copy of validation
semantics with no parity oracle, and `spec:status` can print `/integrate` for a contract
`coverage-coherence` reds. And the print is A's only enforcement of the class-3 obligations, so one
wrong print yields a laneless, unverified change, green.

**C (`contract-conveyor-pinned-8df4`)** — C spends the most net-new surface (a data format with two
closed vocabularies) and lands where A lands: Trade-off 3 concedes review-only acceptance,
Trade-off 4 that contradicting prose passes. Its Acceptance 3 "machine-check" has no second code
path, `lifecycle?` is optional where the fields it mirrors are required, and its pin certifies the
half of each file the agent does not read. **Decisively, C is rejected because siting routing in
`specs/schema/**` taxes every future lifecycle edit with a contract-or-override plus CODEOWNERS
review in perpetuity** — `specs/schema/**` is the only `sensitive_paths` glob and the only
CODEOWNERS-gated node path, and this same change makes that gate blocking. C prices that recurring
cost once, for this PR, and never again.

## Grafts from A (`contract-conveyor-prose-f6fe`)

**A1. Degraded-mode fallback.** Every chain command retains a static, self-contained fallback print
in its own markdown, used when the resolver is unavailable. This graft exists to patch B's
shared-failure-domain defect: B's stated `trails.md` fallback comes from `indexer.ts` and dies with
the same `loadSpec()` it covers. **Binding constraint:** the fallback is template-shaped — no
resolved IDs — and explicitly marked as the resolver-unavailable path, so it never becomes a second
authoritative routing source and never re-imports A's sixteen-copy divergence surface. It must
**not** satisfy A6's pin: a print-less command still reds CI.

**A2. `planIssueSync(spec, existingIssues)` as a pure seam** in a standalone `tools/issue_sync.ts`,
kept **out** of the read-only `spec` dispatch, with A's unit tests: no-op re-run, reopen of a
hand-closed lane, close on final evidence and on final integration. Per common-core finding 5.

**A3. The no-unsubstituted-placeholder invariant** (A Behaviour 2), including A's correct finding
that `compare-patches.md`'s `<winner>` is **not** an instance — it is a human choice the command
does not hold. Only `propose-patches.md` and `synthesize-patches.md` are real instances.

**A4. The BLOCKED `/write-tests` interim clause** for class-≥1 unlaned briefs, so the chain never
silently routes an operator past independent verification — amended per the UX finding to name a
**recoverable action**, not just a block.

## Grafts from C (`contract-conveyor-pinned-8df4`)

**A5. C's correction-3 discipline: terminality is graph-state dependent, never a static per-command
boolean.** B's resolver must compute it, so `/prepare-evidence` is terminal only for a lone live
brief and `/integrate` only at final coverage.

**A6. C's insight that a pin must read what the agent actually follows**, applied to B's surface:
pin that **every chain command still invokes the resolver**, so a print-less or hand-typed command
reds CI. C's fenced `conveyor:` block itself is **not** grafted — it is the axis C loses on.

## Mandatory fixes, B-specific

**A7. Make the implement → prepare-evidence hop derivable.** `/implement-brief` flips its brief
`approved` → `implemented` via graph-maintainer as its single graph write, and CLAUDE.md lifecycle
step 5 is amended from "code only; no graph writes" accordingly. **This changes intended behaviour
and is approved here under scope-integrity rule 5** (see below). It closes B's sharpest defect,
where the resolver had no rule emitting `/prepare-evidence` and `/implement-brief` reprinted itself
into a loop. Consequently B Behaviour 2 gains a routing rule for a `brief` at status `implemented`,
and graph-maintainer remains the sole writer — the flip goes through it.

**A8. Author a writer for every marker the resolver reads.** B reads `## Strategy tension` but
nothing writes it; either author the writer in `/decompose-lanes` or delete the marker and template
that step.

**A9. Add the transcription check B lacks** — a CI job diffing each printed block against
`spec:status` output, so "IDs resolved not recalled" stops being prose-enforced. This **retires**
B's Acceptance 1 honest bound; the effective contract is strictly stronger there.

**A10. Add the nine-`Bash`-grants risk entry.** B alone logs none.

**A11. Resolve B Scope 2's self-contradiction** — "exports supply every walk" versus "consolidating
the private walks is not required". `finalEvidenceForBrief` is composable from `liveSourcesByEdge`;
`briefsCoveredByIntegration` is not, so **the consolidation is required** — state it.

**A12. `CONVEYOR_CLASS_ROUTING` must READ the work-class table as data or be pinned byte-equal to
it, never be a third hand-maintained copy.** Either resolution is permitted; **the brief must choose
one and record the rationale, and may not ship a third unpinned copy.** If it chooses the pin, B
Trade-off 4's admitted third copy stands as a machine-checked cost; if it chooses read-as-data, that
cost is retired.

## Mandatory fixes, called out from the common core

These four are called out because mix-and-match otherwise loses them. **They are amplifications, not
a substitute for the full binding below.**

**A13.** Common-core 15 — the three candidates' ten-leg pins **differ**, so the base would silently
decide the assertions. **The union of all three leg sets is binding**; the brief enumerates the union
and states its actual leg count, which is ≥10, so the contract's "ten-leg" label is superseded. Also
replace the non-existent "schema lane" in B's acceptance text (`4c8c.md:239`) with the catalog lane
**`data-migration`**.

**A14.** Common-core 1 — retarget `/review-contracts` steps 2-3 rather than editing step 5 alone,
and fix `approve-contract.md:21-23`. This review already hit the orphan.

**A15.** Common-core 7 — suppress the closing print when the graph write failed: on red, print
findings, remediation and explicitly **no** next step.

**A16.** Common-core 9 and 3 — add the live-graph `owner` leg and refuse a decomposition omitting
`test-verification`; declare `issue-sync.yml`'s `permissions`, token and dry-run default.

## Common-core findings (binding in full)

All sixteen findings under `## Common-core findings` in `comparison-conveyor-market-890e` are
binding in full. **The comparison's text is the binding text** — nothing is restated here, by
design, so no paraphrase can be mistaken for the requirement. A13-A16 above amplify four of them
and replace none.

The comparison's numbering 1-16 is stable and is the discharge key: per common-core 10(d), the final
integration node's `compliance-verdict` section enumerates CC-1 … CC-16 **and** A1 … A16 — 32 items
— and names each one's discharging brief.

## Rule-5 declaration (A7)

CLAUDE.md scope-integrity rule 5, third branch: *selected work changes the intended behaviour — stop
and return to human approval; a new `decision` node is required before proceeding.* A7 changes
intended behaviour — implementation acquires a graph write that CLAUDE.md lifecycle step 5 currently
forbids. **This decision node is that required approval**, recorded before any brief is written.
Nothing else in this amendment set changes intended behaviour; the remainder refine HOW.

## Consequences

- `contract-conveyor-derived-4c8c` → **approved**.
- `contract-conveyor-prose-f6fe` → **rejected**; `contract-conveyor-pinned-8df4` → **rejected**.
  They remain in the graph (not superseded) as the durable market record the comparison covers.
- `intent-self-guiding-delivery-loop-6d79` stays **open** — it closes only when this multi-lane
  change's final evidence is integrated via `/integrate` (`coverage-coherence`, whose
  `2026-06-18` cutoff this 2026-07-27 contract is after).
- `comparison-conveyor-market-890e` is **unchanged** — a comparison is never superseded by selection.

This decision cites the market's comparison node `comparison-conveyor-market-890e` (which holds the
full critic-by-axis analysis, the sixteen common-core findings and the case against each candidate);
this decision holds the choice.

**Next step:** decompose B as a class-3 multi-lane change via `/decompose-lanes`, with
`test-verification` as its own lane (owned by `test-writer`, never the invocation that implemented
the code under test) and a `data-migration` lane for the `node-types.yaml` touch that Acceptance 7's
self-application requires. Every brief carries the amendments above.
