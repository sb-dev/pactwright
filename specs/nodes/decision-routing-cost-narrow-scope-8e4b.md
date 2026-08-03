---
id: decision-routing-cost-narrow-scope-8e4b
type: decision
title: Approve the narrow-scope reduction, delivered as a governance change outside the lifecycle
created: 2026-08-03
decided_by: Samir Benzenine
---

**DECIDED:** a class-2 contract may declare `scope: narrow` and run a single-candidate market.
`class-market-quorum` and `comparison-required` both skip such a contract. Class 3 is never
reducible. Delivered as a **governance change outside the lifecycle** — no market, no comparison, no
critic panel, no contract, no brief.

## The change

`scope: narrow` is an optional, author-declared field on `contract`, read by the two rules that
enforce the ≥2-candidate bar. Both must skip together, because each enforces the bar independently —
lifting one alone moves the red rather than removing it. Adding an optional field needs no schema
facility: `required_fields` checks presence only and never rejects extra keys, which is how
`produced_by` already exists. Nothing is backfilled; every existing contract lacks the field and
behaves exactly as before.

## Rule-5 declaration

This changes intended behaviour of the work-class routing rule and is approved here under CLAUDE.md
scope-integrity rule 5. Exactly one such declaration is made.

## Rule-2 exemption, and why it is not hypocrisy

Rule 2 requires an approved contract and a brief before implementation. **This change has neither**,
and that is deliberate.

The measured cost of running the current class-2 process is a median of 816 lines of process artifact;
the largest observed was 2,053. This change amends roughly 50 lines of rule and doc. Running the
process on it would cost between 16× and 40× the change itself — which is the defect being repaired.
By the current table this change is **class 3** (multi-surface, touching `specs/schema/**`), so the
honest price is the full nine-critic panel, required lanes and two human gates.

**This is a one-time bootstrap exemption, not a precedent.** It is available only for a change to the
process machinery itself, and only while that machinery is the thing under repair. A later author
cannot cite this decision to skip a market for ordinary work; if this exemption is wanted again, it
needs its own decision and its own reasoning.

## What was verified before approving

Proved against the live graph in a scratch copy, not asserted:

1. class 2, one candidate, **no** `scope` field → **2 findings** (both rules). The pre-existing bar
   is untouched for anything that does not opt in.
2. `scope: narrow` added → **0 findings**.
3. Intent moved to class 3, `narrow` kept → **findings return**.
4. `scope: broad`, an unrecognised value → **findings return**. Only the exact string reduces.

## Honest bounds

1. **The declaration is unverified.** Nothing checks that a contract calling itself narrow is narrow
   — exactly the standing of `class`, which is also author-declared and gameable. What backs it is
   that `/specs/nodes/contract-*` is CODEOWNERS-covered, so it cannot merge unreviewed, plus the
   rationale the contract body must carry and `/approve-contract` must confirm.
2. **Critic panel size is unchanged mechanically.** CLAUDE.md now says a narrow market routes
   `spec-critic` plus one specialist, but panel size has never been machine-enforced and this change
   does not make it so. That prose is guidance, as it was before.
3. **This addresses one of five identified process defects.** Unenforced output limits, rule 5's
   missing reject path, merge cadence, and the conveyor's inability to route graph-data work all
   remain open and unfixed.
4. **This decision creates an intent that no contract backs, and that is a known future finding.**
   `intent-routing-cost-narrow-scope-5d2c` goes `addressed` with zero incoming edges, because the
   rule-2 exemption above means it has no contract to be backed by. That is green today only because
   this branch is cut from `main`, which carries no guard against it. A guard for exactly this shape
   was built and then abandoned with PR #16; when it is rebuilt, this intent will be one of its
   subjects. The intended resolution is already the mechanism that guard was designed with: a
   `decision —subsumes→ intent` edge from **this** decision, which is precisely the case it exists
   for — a decision accounting for an intent that ran no market of its own. Recorded now so the
   finding is expected rather than discovered.
5. **`scope` has no value validation, unlike `lane`.** `scope: narow` — a typo — silently means
   "ordinary market". This fails **closed**: an unrecognised value means the full bar applies, so the
   risk is an author silently *paying* process, never silently escaping it. Eight values are pinned
   as non-reducing in the handler tests (`broad`, `Narrow`, `NARROW`, `"narrow "`, `""`, `true`, `1`,
   `["narrow"]`). The repo has the exact precedent for fixing it — `brief-lane-valid`, a
   `closed_key_set` with `mode: member` — so a `contract-scope-valid` rule with `keys: [narrow]` is
   the right follow-up. Shipped unfixed deliberately, to keep this change small.
6. **The two rules read `class` off the INTENT while `scope` is read off the CONTRACT.** That
   asymmetry is pre-existing for `class` and is not introduced here, but it bounds the new guarantee:
   "class 3 is never reducible" holds only while nobody uses the contract-level revise-upward path,
   because a contract revising itself to class 3 under a class-2 intent would still be reduced.
   Checked before shipping: two contracts in the graph do diverge from their intent's class
   (`contract-work-class-command-discipline-a1b2` and `contract-work-class-approval-gate-e5f6`, both
   class 2 under the class-3 `intent-work-class-routing-b9c4`), so the revise path is demonstrably
   used — but both diverge **downward**, and the upward case has zero instances. Mitigated in prose
   rather than code: CLAUDE.md's narrow-scope section states which class counts, and
   `/approve-contract` must refuse `scope: narrow` on a contract whose own `class` is 3.

## Consequences

- `intent-routing-cost-narrow-scope-5d2c` → `addressed` (the change is implemented and verified)
- No contract, no brief, no comparison, no evidence node — see the rule-2 exemption above
- `class-market-quorum` and `comparison-required` gain a shared skip; no other rule changes
