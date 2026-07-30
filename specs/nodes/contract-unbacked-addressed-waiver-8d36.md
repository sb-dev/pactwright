---
id: contract-unbacked-addressed-waiver-8d36
type: contract
title: Unbacked `addressed` guard, with the d4f2 exception as a signed expiring `override`
status: candidate
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-unbacked-addressed-guard-8c4e` (class 2). The market carries
**three** candidates and this is **C**. All three ship an identical guard — one intent-scoped
validation rule that reaches an intent no existing rule can see — and differ on exactly one axis:
**how the single standing exception, `intent-status-coherence-d4f2`, is recorded.** C takes the
**waiver** position: no new edge type and no cutoff. The waiver registry is extended so an
`override`'s `waives` edge may target a **validation-rule id**, and d4f2's exception is recorded as
a signed, expiring `override` node.

## Problem interpretation

Ten intents are `addressed`. Nine carry two or three incoming `proposes` edges from their candidate
contracts; exactly one — `intent-status-coherence-d4f2` — has **zero** incoming edges. It was never
proposed and never contracted; it was flipped by `decision-lane-integration-9f3b`'s closing prose
plus `evidence-lane-integration-9b4c`, which evidences a *different* brief.

Incoming-edge *count* is not the discriminator: a live intent legitimately carries `proposes` edges
from candidates before anything is selected. The discriminator is the **`selects`-coverage chain**.
`coverage-coherence` is that chain's rule and it is `selects`-**scoped**:
`coverage_coherence.ts:78` opens with `spec.edges.forEach` filtered to `selects`, so an intent no
`selects` edge reaches is never visited. d4f2 is structurally invisible to it.

The shared core, identical in A, B and C:

1. **One new rule** — id `unbacked-addressed`, kind `unbacked_addressed`, handler
   `tools/handlers/unbacked_addressed.ts`, registered in `tools/validator.ts`'s `HANDLERS`, and
   inserted in `specs/schema/validation-rules.yaml` directly **after** `coverage-coherence`.
2. **The iteration is inverted.** The rule walks `spec.nodes` filtered to
   `type: intent, status: addressed`. That inversion is the whole mechanism: it reaches d4f2.
3. **Backing is provenance, not a second coverage notion.** An addressed intent is backed iff at
   least one live (non-`superseded`) contract both `proposes` it and is the target of a `selects`
   edge — from `liveProposingContracts` in `tools/handlers/coverage_traversal.ts` intersected with
   the `selects`-target set `coverage_coherence.ts:66-71` already builds. Coverage stays
   `coverage-coherence`'s verdict, so the two rules never double-report a subject.
4. **The honest bound.** Green asserts decision-backed provenance, not coverage.

C's premise is a **real extension, not a reuse**: `specs/schema/checks.yaml` is "the single registry
of check identifiers" and lists `ci`, `spec-index`, `spec-validate`, `pr-evidence`, `check-diff`,
`patch-comparison`, `drift` — CI checks, not validation rules. `references_resolve.ts:27` resolves a
`waives` target only against that list. Waiving a *rule* is a capability the graph does not have.

## Scope

1. **`tools/handlers/unbacked_addressed.ts` (new)** — the shared-core rule, plus C's escape clause:
   an addressed intent is excepted iff **one** `override` node carries **both** a
   `waives → unbacked-addressed` edge (the rule id) **and** a `waives → <intent-id>` edge (a node
   id, already legal under `waives`' `target: any`), and that override's `expires` is not before
   `spec.today`. Requiring both edges on the same node is load-bearing: a rule-id waiver alone would
   switch the rule off graph-wide.
2. **`tools/handlers/references_resolve.ts`** — the `waives`-target branch at `:27` extends to
   accept a validation-rule id from `spec.rules` in addition to a registered check id. No
   hand-maintained second list: the rule-id namespace *is* `validation-rules.yaml`.
3. **`specs/schema/checks.yaml`** — the header comment is corrected from "the single registry of
   check identifiers" to name **two** waivable namespaces (checks here, rule ids in
   `validation-rules.yaml`). The `checks:` list itself is unchanged.
4. **`tools/loader.ts`** — `today: string` on `LoadedSpec`, defaulted at load
   (`new Date().toISOString().slice(0, 10)`) and injectable. Findings stay a pure function of
   `(spec, rules)`; no handler calls `new Date()`. This mirrors `GateInput.today` in `gate.ts:22`.
5. **`specs/schema/validation-rules.yaml`** — the one rule entry. No new cutoff scalar.
6. **`tools/validator.ts`** — one `HANDLERS` entry, dispatch-pinned (id / kind / handler filename).
7. **`CLAUDE.md` rule 7** — "a `waives` edge whose target is a check id registered in
   `specs/schema/checks.yaml`" becomes "…a check id registered in `specs/schema/checks.yaml` **or a
   validation-rule id declared in `specs/schema/validation-rules.yaml`**", with the existing honest
   bound (`approved_by` is provenance, never authentication) restated verbatim.
8. **`docs/branch-protection.md`** — the "Override integrity" paragraph extends to rule waivers.
   `.github/CODEOWNERS:14` already matches `/specs/nodes/override-*`, so **no CODEOWNERS edit is
   needed** and the new node trips code-owner review the day it lands.
9. **Graph data (via graph-maintainer)** — the repository's **first** `override` node,
   `override-d4f2-unbacked-addressed-<hex>`, carrying `reason` (d4f2 predates the market discipline;
   its single-lane coherence rule was landed and generalised by
   `contract-lane-integration-convention-body-4c1f`, human-confirmed in
   `decision-lane-integration-9f3b`), `approved_by`, and `expires: 2027-01-31`; plus two `waives`
   edges, one to `unbacked-addressed` and one to `intent-status-coherence-d4f2`.
10. **`tests/`** — `unbacked_addressed.test.ts` (new), override/expiry and subject-scoping cases,
    a CODEOWNERS-coverage assertion, and `tests/fixtures/bad/unbacked-addressed/` with
    `expected-errors.txt`.
11. **Evidence obligations** — `specs/schema/**` is `sensitive_paths`' sole glob, so this change's
    evidence must carry `touches → capability-spec-schema-2c3d`, plus
    `capability-spec-tooling-1a2b` (`tools/**`), `capability-spec-tests-3a6e` (`tests/**`) and
    `capability-spec-docs-8c1d` (`CLAUDE.md`, `docs/**`). `specs/{nodes,graph}/**` stays
    intentionally unowned per `decision-graph-data-unowned-2f7b`.

## Out of scope

1. **No new edge type**, and no dated cutoff scalar — so C neither adds permanent vocabulary nor
   widens `intent-malformed-cutoff-finding-b3d7`'s surface.
2. **No change to `coverage-coherence`**, its cutoff or its verdict, and no backfill of the nine
   already-backed addressed intents.
3. **No retroactive waiver of any other rule.** Extending the registry makes rule waivers
   *possible*; this change authors exactly one, for exactly one intent.
4. **No authentication of `approved_by`.** CLAUDE.md rule 7's bound stands unchanged: the field is
   provenance; CODEOWNERS review is what makes the waiver independent.
5. **No `spec:validate` scheduling, notification or expiry-warning mechanism.** An override that
   lapses reds at the next run; nothing warns beforehand.

## Behaviour

1. For each node with `type: intent` and `status: addressed`, compute
   `backing = liveProposingContracts(intent) ∩ selectsTargets`. Non-empty → emit nothing.
2. Otherwise scan `override` nodes for one carrying both `waives → unbacked-addressed` and
   `waives → <this intent id>`. If found and `toDateString(expires) >= spec.today`, emit nothing.
3. If such an override exists but is expired or its `expires` is unparseable, emit a finding whose
   detail names the override, its `expires`, `spec.today`, and the remedy (renew with a fresh signed
   override, or supply real provenance) — never a silent pass, mirroring `gate.ts`' near-miss text.
4. Otherwise emit one finding, subject = the intent id, naming both remedies.
5. `edges-references-resolve` resolves `waives → unbacked-addressed`; a `waives` target that is
   neither a node id, a registered check, nor a declared rule id still reds unchanged.

## Trade-offs

1. **+ The only candidate whose exception is independently signed.** Adding an `override-*` node
   trips `.github/CODEOWNERS:14`, so d4f2's exception cannot merge without the graph owner's review.
   A's `subsumes` edge and B's date both land under ordinary review.
2. **+ The only candidate that expires.** On 2027-01-31 the exception lapses and someone must
   re-justify it or supply real provenance. The exception cannot quietly become permanent — the
   property neither of the other two has.
3. **+ The richest reconstruction.** `reason`, `approved_by` and `expires` sit in the graph,
   discoverable under `by-type: override`, with prose in the node body. A reader six months on gets
   the whole story from one node, not a bare edge and not a bare date.
4. **− `spec:validate` becomes time-dependent for the first time.** A graph green today reds on the
   expiry date with **no commit**: a re-run or scheduled job fails on a branch nobody touched. That
   is what an expiry *is*, and it is C's largest cost.
5. **− The registry extension is general and cannot be scoped down.** Every current and future
   validation rule becomes waivable by an author-added override. CODEOWNERS is the only thing
   between that and self-serve, and CLAUDE.md rule 7 already records that `approved_by`
   authenticates nothing. This is a much wider blast radius than A's single edge type.
6. **− The two-edge subject-scoping idiom is novel and has no precedent.** A reviewer who reads only
   the `waives → unbacked-addressed` edge will misread the waiver's blast radius as graph-wide.
7. **− The largest conceptual surface for the smallest permanent gain.** A new waiver namespace, a
   clock in the validator and a new node class, to excuse one node.

## Acceptance

1. **Four-state behaviour, with an injected `today`.** Override absent → **exactly one** finding,
   subject `intent-status-coherence-d4f2`. Override present, `today = 2026-07-30` → **0** findings.
   Override present, `today = 2027-02-01` → **one** finding whose detail names the override and its
   `expires`. Override present with an unparseable `expires` → **one** finding. No test reads the
   wall clock.
2. **Subject scoping is falsifiable.** An override carrying **only** `waives → unbacked-addressed`
   excuses nothing — d4f2's finding still fires, and so does every other unbacked intent's. An
   override carrying **only** `waives → intent-status-coherence-d4f2` likewise excuses nothing.
   Two unit cases; either failing means the rule can be switched off graph-wide.
3. **Registry extension.** `waives → unbacked-addressed` produces no `edges-references-resolve`
   finding; `waives → not-a-check-or-rule` still reds, and
   `tests/fixtures/bad/waives-unknown-check/expected-errors.txt` passes **unchanged** — asserted, so
   the extension is proven not to have loosened the existing case.
4. **Determinism preserved.** `runValidation` on a fixed `spec.today` is a pure function; two runs
   are byte-identical, and a test asserts no file under `tools/handlers/` calls `new Date(`.
5. **The expiry is real, not decorative.** A test asserts the live graph reds for
   `intent-status-coherence-d4f2` at `today = 2027-02-01`.
6. **CODEOWNERS coverage is proven, not asserted in prose.** A test reads `.github/CODEOWNERS` and
   asserts the new override node's path matches the `/specs/nodes/override-*` rule.
7. **No double-report.** An addressed intent whose selected contract is uncovered yields exactly one
   finding, from `coverage-coherence`, and none from `unbacked-addressed`.
8. **Whole-graph no-regression and dispatch pinning.** `pnpm spec:validate` is clean today; kind
   `unbacked_addressed` resolves to the named handler; an unknown kind still hard-fails;
   `tests/fixtures/bad/dispatch-all-kinds/` passes unchanged.

## Risks

1. **The expiry reds a graph with no commit**, and the operator sees a failure they did not cause.
   *Mitigation:* the finding names the override, its `expires`, `today` and both remedies. This
   cannot be mitigated away — it is the mechanism, priced in Trade-off 4.
2. **Registry generalization widens the waivable surface to every rule.** *Mitigation:* CODEOWNERS,
   plus CLAUDE.md rule 7's restated bound. *Honest:* there is no mechanical cap, and **a reviewer
   may reasonably judge a waiver registry an authorization surface and route this to class 3** under
   the work-class table. C names that as a live objection rather than arguing it away.
3. **The two-edge idiom is misread**, and someone later authors a rule-id-only waiver believing it
   is scoped. *Mitigation:* acceptance 2's tests fail such a waiver's intended effect; the override
   body states both edges explicitly; CLAUDE.md rule 7 records the pairing.
4. **`spec.today` injection leaks into handler signatures.** *Mitigation:* it lands once on
   `LoadedSpec` with a loader default, so no handler signature changes and no existing handler is
   edited.
5. **The first `override` node in the repository exercises an untested path.** No `override` node
   exists today, so `by-type: override` indexing, CODEOWNERS matching and `waives` resolution are
   all first-run. *Mitigation:* acceptance 3 and 6 test exactly those three.
6. **Self-application ordering.** This PR touches `specs/schema/**`, so `drift-review`'s
   sensitive-paths gate needs the approved contract link and the
   `touches → capability-spec-schema-2c3d` edge in the **same** diff. *Mitigation:* pinned as
   within-PR ordering in the brief.
