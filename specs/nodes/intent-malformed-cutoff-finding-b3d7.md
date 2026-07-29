---
id: intent-malformed-cutoff-finding-b3d7
type: intent
title: Red the graph on a malformed dated cutoff instead of silently disabling the gate
status: open
created: 2026-07-29
class: 2
produced_by: "/capture-intent"
---

## Problem

The two dated gate cutoffs are top-level scalars in `specs/schema/validation-rules.yaml` —
`comparison_required_from: "2026-06-18"` (`:134`) and `coverage_coherence_from: "2026-06-18"`
(`:140`). Both are normalized through `toDateString` (`tools/gate.ts:42-54`), which returns
`undefined` for any value that fails the shape check at `gate.ts:47`:

    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;

So a present-but-**malformed** value — `2026-6-18`, one missing zero-pad — is indistinguishable
from an absent one, and `tools/handlers/comparison_required.ts:32-34` skips the entire rule:

    // Cutoff normalized once; absent/malformed → gate disabled (fail-open).
    const cut = toDateString(spec.comparisonRequiredFrom);
    if (cut === undefined) return findings;

A one-character typo turns a class-3 gate off, on a green graph, with no signal anywhere.

The same hazard applies to two further operands:

- **`coverage_coherence_from`** — `tools/handlers/coverage_coherence.ts:42-43` is the exact mirror:
  `const cut = toDateString(spec.coverageCoherenceFrom);` then
  `if (cut === undefined) return findings; // fail-open: no cutoff → gate off`.
- **A selected contract's own `created`**, which both gates grandfather on:
  `comparison_required.ts:70-71` (`const c = toDateString(contract.data["created"]);` then
  `if (c === undefined) return; // absent/unparseable created: fail-open skip`) and
  `coverage_coherence.ts:114-115` (same two lines, commented `// fail-open`). Here a malformed date
  silently exempts that one post-cutoff contract from both gates rather than disabling the rule
  wholesale — quieter still, because the rest of the graph keeps reporting normally.

The schema records this as intended behaviour, not an oversight. `validation-rules.yaml:129-133`
describes the cutoff and states "absent or malformed disables the gate"; `:136-139` mirrors it with
"absent/malformed disables the gate".

Nothing asserts anything on this path today. `tests/fixtures/bad/malformed-node/` holds exactly
five files — `specs/graph/edges.yaml`, `specs/nodes/intent-broken-4444.md`, and the three
`specs/schema/*.yaml` — and **no `expected-errors.txt`**. It is the only one of the twenty
`tests/fixtures/bad/*` directories missing that file (verified by listing all twenty), so no
fixture asserts any error for a malformed input on this path.

## Goal

Distinguish **absent → intentionally disabled** from **present-but-malformed → likely a typo**, and
red the graph on the latter only. Absent stays gate-off: it is the documented way to switch a dated
gate off and it carries no typo signal. A value that is present but that `toDateString` rejects
should instead produce a validation finding naming the key, the value as read, and the expected
`YYYY-MM-DD` shape, so the mistake is loud at the moment the typo lands rather than invisible until
an ungated contract merges.

The same distinction should be considered for a selected contract's `created` wherever a dated gate
grandfathers on it, as should closing the fixture gap above in the same change — a `bad` fixture
that asserts the new error. Which of the three operands are covered, and whether the check lands as
a validation rule or as a loader-level read, is for the contract to settle; this intent fixes the
outcome (malformed is loud, absent is not), not the mechanism.

## Source

PR #10 (Phase 7) code review, where the finding was raised and deferred. It is captured here by
Scope 14.4 of `contract-conveyor-derived-4c8c`, whose Out of scope 2 (`:117-118`) routes the *fix*
to Phase 10 Step 0 — this intent captures the behaviour and implements none of it.

**This reverses a binding directive of an approved decision.** The fail-open was chosen
deliberately in `decision-critics-literal-panel-9c4f`:

- **Directive 2 (`:28`)** — "**Normalize BOTH operands of the cutoff compare through
  `toDateString`** — `c = toDateString(C.created)`, `cut = toDateString(comparison_required_from)`;
  fail-open (skip) if EITHER is undefined; then `c < cut`."
- **Directive 3 (`:29`)** — "**Read `comparison_required_from` as a NEW top-level SCALAR string**",
  with the scalar contract spelled out: "absent ⇒ undefined ⇒ rule disabled; malformed ⇒ undefined
  via `toDateString` ⇒ skip. Tests for absent/empty/non-string."

Directive 2 names this very hazard in its own rationale — "a one-char cutoff typo would silently
DISABLE the class-3 gate instead of skipping" — and answers it by normalizing both operands so the
compare cannot mis-grandfather. What it deliberately does not do is make the malformed case
*visible*: the recorded contract is that it skips. This intent asks for the opposite outcome on the
malformed branch only, leaving the absent branch exactly as directive 3 specifies.

Because that choice was deliberate and is recorded in an approved `decision`, changing it is **new
intended behaviour, not a patch to approved work**. CLAUDE.md scope-integrity rule 5's third branch
applies — selected work changing the intended behaviour stops and returns to human approval — so
this needs its own candidate contracts, its own comparison, and its own `decision` node. Only that
new decision can retire directives 2 and 3 for the malformed case; an implementation cannot retire
them on its own, and `9c4f` stays the standing authority until it does.

**Class 2, and binding.** When it was deferred from the PR #10 review this finding was guessed
"likely class 1". That guess is wrong: the change adds a validation finding on a schema-adjacent
scalar *and* reverses a binding directive of an approved decision — a meaningful technical change
on a gated surface, not a trivial mechanical one. Per CLAUDE.md's work-class routing a candidate
contract inherits this class and may revise it with recorded rationale in its body; a proposal that
finds the fix spans handlers, schema and tests as separate surfaces may legitimately raise it.
