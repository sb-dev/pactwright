---
id:         decision-critics-literal-panel-9c4f
type:       decision
title:      Select literal-panel as the base for specialist critics + durable comparison
decided_by: Samir Benzenine
created:    2026-06-18
---

## Decision

Selected **contract-critics-literal-panel-1c4a** as the approved contract for `intent-specialist-critics-comparison-7ada` (class 3). Rejected siblings: **contract-critics-registry-driven-2d5b** and **contract-critics-named-thin-rubric-3e6c**.

Analysis of record: the three `## Critique` sections appended to the candidates during `/review-contracts`. This bootstrap market predates the comparison-node mechanism it proposes, so there is no comparison node to cite; the candidates, created 2026-06-17, are grandfathered by the proposed 2026-06-18 cutoff. Work-class quorum satisfied: a class-3 intent with three live candidate contracts.

## Accepted trade-off

Nine bespoke prompt files to maintain (real hand-drift risk; per-prompt critique quality stays unmachine-checkable) in exchange for verbatim fidelity to this class-3 intent's nine-named-files deliverable, zero new unvalidated indirection at selection time, and a base onto which later enforcement is only ever ADDED — never one that must first re-derive missing files or delete an unrequested indirection before enforcement can begin.

## Why each rejected candidate lost

**contract-critics-registry-driven-2d5b** — ships zero of the nine named agent files (its own acceptance #9, verified against the live tree), so a reviewer holding the intent's enumeration as binding sees it non-compliant and any reference to a named critic dangles; and it parks its single routing source outside the validated graph, where a typo'd trigger silently drops a critic on a green tree while the class-3 full-panel backstop cannot protect class-2. Its one strong idea — a single declarative routing source — is captured as a follow-up intent (below), not lost.

**contract-critics-named-thin-rubric-3e6c** — its rubric+pointer indirection is structure the intent never requested (rules belong IN the agent bodies, intent lines 22-28), and it invents a substitution failure mode (a thin file pointing at a stale/renamed/absent rubric section yields a critic silently reviewing the wrong perspective while still emitting one critique) that its own count guard cannot catch. Its two good ideas — the count-enumeration guard and the explicit superseded/same-target coverage phrasing — are grafted into the brief (below).

## Directives for the brief (within the approved contract's scope — no scope expansion)

1. **Coverage predicate is genuinely NEW set-based logic**, NOT a reuse of `class_market_quorum` (verified: `liveCandidates` returns a number, not a set; `class_market_quorum.ts:26-38`). Collect the live (non-superseded) proposing-contract ids into a Set; resolve+dedupe each `compares` target; require live ⊆ covered AND ≥2 resolved `compares` edges; two `compares` edges to the same or a superseded candidate must fail (superseded/extra targets tolerated but do not count toward coverage). Closes literal-panel's own Critique point (a). Budget as real code with a `node --test` matrix.
2. **Normalize BOTH operands of the cutoff compare through `toDateString`** — `c = toDateString(C.created)`, `cut = toDateString(comparison_required_from)`; fail-open (skip) if EITHER is undefined; then `c < cut`. The contract's shown compare normalizes only `C.created` (`gate.ts:42` takes one arg), so a one-char cutoff typo would silently DISABLE the class-3 gate instead of skipping.
3. **Read `comparison_required_from` as a NEW top-level SCALAR string** — NOT parallel to `sensitive_paths` (a list read via `asList(...).map(asString)` defaulting to `[]`; `loader.ts:128`). Scalar contract: absent ⇒ undefined ⇒ rule disabled; malformed ⇒ undefined via `toDateString` ⇒ skip. Tests for absent/empty/non-string.
4. **Atomic migration in ONE commit**: handler file + import + HANDLERS-map entry + `validation-rules.yaml` rule entry + index regeneration (`by-type.yaml` gains a `comparison` group). The unknown-kind branch (`validator.ts:67-73`) reddens the instant a rule kind has no handler; `indexes-fresh` byte-compares. Insertion slot: between `class-market-quorum` (line 58) and `indexes-fresh` (line 60).
5. **`/review-contracts` must be idempotent**: a re-run on an intent that already has a comparison node detects and REPLACES it (never authors a second orphaned comparison — both pass coverage, so validate cannot see the duplicate); a late candidate forces regeneration.
6. **Class-3 count-enumeration guard in `/review-contracts`** (graft from named-thin-rubric): after the panel runs, assert one perspective-labelled `## Critique` per expected routed critic (nine for class 3) exists before graph-maintainer builds the comparison — catching a dropped perspective by count. Sufficient on the literal base because bespoke agent bodies have no wrong-section substitution mode; absence is the only failure to catch.
7. **`comparison` node carries no `status_values` and no `class`** (`nodes-status-in-enum` skips status-less types per the decision/override precedent; `nodes-class-in-range` scopes only `[intent, contract]` per `validation-rules.yaml:39`); `compares` edge is comparison→contract; the comparison body structure stays a command/graph-maintainer convention, never a validate rule.

## Cutoff-window note

The 2026-06-18 cutoff has arrived; this market's bootstrap contracts (created 2026-06-17) stay grandfathered. The brief must flag that any parallel post-cutoff class-2 `selects` landing before this migration merges will instantly require a comparison — schedule accordingly.

## Follow-up intent to capture AFTER this selection (scope-expanding — deliberately NOT folded in)

A validated-graph routing artifact combining the two registry-driven grafts: replace literal-panel's prose+command routing with ONE declarative routing table (perspective→surface-triggers) that CLAUDE.md and `/review-contracts` both dereference, pull that table into the loaded spec graph, and add a `spec:validate` rule resolving it against `.claude/agents/` (every named perspective has a present `<name>-critic.md`; a class-3 panel enumerates all nine; redden on disagreement). literal-panel's Non-scope explicitly excludes a critic-registry data file and the intent asked only for prose routing, so per CLAUDE.md scope-integrity rule 5 (contract incomplete, behaviour unchanged) this is a follow-up intent, NOT a silent widening of this approval. Until it lands, the standing behaviour is literal-panel's prose+command routing, with its acknowledged CLAUDE.md/command divergence recorded here as a known trade-off — not a closed hole.

## Residuals accepted

The class-2 scope-text routing heuristic is intrinsic to the intent's selective class-2 design (class-3 full panel is the shared backstop) and is not closed by this selection — surface a routed-but-empty axis distinctly from a not-routed axis so silence reads as "never looked," not "no concern." Per-prompt critique quality stays a convention + human-selector responsibility, never a machine check.
