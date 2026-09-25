# Checkpoint 1 Stage 2 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 2 (CP01-S06 to CP01-S09) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Reviewed revision `65cbb83` on `claude/stage-2-step-contracts-6q1g6z` (PR #49), base `refactor/pactwright-v2` at `36fb238`. Source revisions at review: Core v4, Distribution v3, Implementation Guide v16, Checkpoint 1 v26, Spec 00 v5, contract format 2. The corrections below produce Core v5 and Checkpoint 1 v27. Questions Q21–Q33 keep their crosswalk IDs and wording; the batch records [B7](./2026-09-25-cp01-stage-2-b7-shapes-and-identity.md), [B8](./2026-09-25-cp01-stage-2-b8-gates-review-and-actors.md), [B9](./2026-09-25-cp01-stage-2-b9-execution-state.md), [B10](./2026-09-25-cp01-stage-2-b10-lifecycle-commands.md) and [B11](./2026-09-25-cp01-stage-2-b11-validation-and-context.md) remain the decision records.

**Prior state:** the batches were answered, reviewed by three independent read-only reviewers (24 findings applied) and by five owner review rounds on PR #49. The owner approved the eight owning clauses and Q33 option A, applied in Core v4 §§27, 28, 32, 52, 53, 55, 57 and Checkpoint 1 v26 §4 and Step 24. Owner review 5322823149 at `65cbb83` found no remaining batch findings and asked for this review.

## Method

Two independent read-only reviewers ran at `65cbb83`. One checked whole-stage consistency: identity, storage, authority, failure behaviour and revisions across S06–S09 and Core v4; requirement coverage; case distinctness; binding methods; verifier-ID uniqueness; prerequisite feasibility; deliverable-summary equality; and loss against `36fb238`. The other audited cross-stage allocation: every later-step obligation Stage 2 assigns, contradictions with Stage 1 (requirement-ready) and Stages 3–5, Stage 3/4 open questions affected, and exit-gate satisfiability. Each refuted its own candidates before reporting. The author verified every reported finding against the text before acting.

## Findings and dispositions

Blocking findings, applied in this pass:

| ID | Location | Finding | Correction |
|---|---|---|---|
| X1 | S09/R05 rule 12; S06/R04 | Rule 12 failed current Evidence whose Brief has no execution-state document, which includes this repository's two 0.0.1 Evidence records (Step 25) and every migrated 0.0.1 project (S19/AC07); Evidence is immutable, so validate could never pass. | **Owner decisions:** a Brief with a legacy-closure execution-state document is reported as unavailable verification and does not fail; only the Step 19 released-format migration writes that document, one per Brief with current Evidence and no document; a missing document for current Evidence fails rule 12, so deleting a current-format document cannot hide invalid Evidence (owner review 5322921376, P1). Core v5 §57; S06/R04; S09/R05, R11, AC11 `migrated-legacy-evidence` and `deleted-current-state`; S19/R11, AC13 `upgrade.legacy-closure-markers` and the migration output. Step 25's 0.0.1 Evidence therefore passes validate after the Step 19 migration. |
| X2 | S06/R03; S07/R09; Core §27 | A Gate passed before a correction that returns to a Delivery step before the Gate stayed "passed", so later corrected work could cross it unapproved. | **Owner decision:** a pass is recorded with the delivery sequence it approved and lapses when a correction re-enters a Delivery step before the Gate. Core v4 §27; S06/R03, new AC14 `lifecycle.gate-re-entry`; S07/R09. |
| X3 | Checkpoint 1 Step 24 | The approved paragraph required `run` to stop at "the configured Gate", which a packed consumer's lifecycle `version: 1` cannot declare; rules 10, 11, 14 and 15 need fixture shapes. | **Owner decision:** Step 24 stops at manual entries and the missing-invoker failure; rules 10, 11, 14 and 15 are proven by the repository test suite against the built runtime through Step 6 fixture definitions; the published package exposes no fixture entry point. |
| X4 | S08/R03 | prepare-evidence and delegated approve-contract were "runtime-executed", leaving no source for Evidence facts, the selected alternative or `decided_by`; this contradicted Core §49, the released executor (`207ac08:src/lifecycle/run.ts`, `src/adapter/commands.ts`) and S08/AC08, and pre-empted Stage 3 Q38. | Every automatic responsibility is capability-backed: the capability supplies content, selection and actor, and the runtime applies the Step 7 guards and writes. Cites Core §49. |
| X5 | S09/R11, AC11; S08/R07, AC06 | A malformed or unknown-version execution-state document had no validate result; it is not a Core §54 required input, so validate could pass. | Structure failure for its Brief, non-zero exit (AC11 `malformed-execution-state`); status reports it and next/run refuse (S08/AC06 `malformed-execution-state`). |
| X6 | S09/R11 | R11 defined an unreconstructible historical check as unavailable execution authority, contradicting R04, AC04, AC11 and Core v4 §57 (unavailable verification). | Clause removed from R11 and from the B11 Q30 row. |
| X7 | S09/R06, AC05 | A malformed revision value was both a document defect ("rule 17 does not run") and a rule 17 failure. R06 also held a duplicated sentence. | The decoder checks version, exact key set and non-empty string values; protocol and grammar are rule 17 checks. `malformed-document-value` is an empty or non-string value. R06 rewritten without duplication. |

Non-blocking findings, applied:

| ID | Correction |
|---|---|
| X8 | Rule 14 limited to Gate resolutions of current Briefs, so a policy change cannot fail validate permanently (AC11 `gate-policy-changed-for-superseded-brief`). |
| X9 | S06/AC06 `iteration-limit-reached` asserts the blocking step and required actor `human` that S06/R05 states. |
| X10 | S06/R04 states Checkpoint 1 defines one execution-state format version, so no Checkpoint 1 migration exists. S19/AC11 names the S09/R06 replay-base document instead of "execution provenance". Lock-hash verification is allocated only to the later pinned-replay owners, since Step 15 derives but never checks a recorded hash. |
| X11 | S08 `lifecycle-run` output and the checkpoint deliverable summary name the manual and blocked-Review stops. Checkpoint §3 lists Core §52. |
| X12 | Records: B7 Q24 row no longer cites the dropped configuration arm of rule 9; B7 Q21 sentence repaired; B8 Q31 row names approve-contract's declared-kind report; B11 cites S19/AC11; B10 notes the replaced classification. |
| X13 | S09/R06, AC05: the replay-base `version` is the integer 1 and the three identities are non-empty strings, with `string-document-version`, `empty-identity-value` and `non-string-identity-value` cases (owner review 5322921376). |
| X14 | Core moves to v5 and Checkpoint 1 to v27, since this pass changed Core §§27, 57 and Step 24 after v4/v26 were established at `65cbb83`; batch records, crosswalk and checkpoint §3 cite the new versions (owner review 5322921376). |

Later-stage follow-ups, owned and non-blocking for Stage 2:

- **Q37 / Q38 (Stage 3, Step 12):** S12/AC03 does not yet cover unmapped, ambiguous or blocked Review output, and S12 does not state that `/deliver-brief` and `/review` record Delivery completion and the Review result through the Step 6 boundary. Execution-state documents are ordinary files an agent could edit. `affects` now include S06/R09, S08/R03, S12/AC03 and S12/AC07.
- **Q39 (Stage 3):** its runtime-invoked-provider option must use the S08/R03 capability-invocation seam and the Checkpoint §4 invoker line. `affects` include S08/R03.
- **Q45 (Stage 4, Step 15):** the environment-lock hash protocol also bounds S09/R06. `affects` include S09/R06 and AC05.
- **Q47–Q49 (Stage 4, Steps 18–19):** the severity of an uncommitted execution-state document, and execution-state handling across upgrade hand-off and rollback; a mid-delivery 0.0.1 Brief has no document and restarts at Delivery. `affects` include S06/R04.

## Stage-level result (§7)

Checks at `65cbb83` confirmed by the reviewers and unchanged by the corrections: every S06–S09 requirement has an exercising criterion; all verifier bindings across CP01 contracts are unique (225 at `65cbb83`; 227 after adding `lifecycle.gate-re-entry` and `upgrade.legacy-closure-markers`, 49 of them in Stage 2); `requires` are feasible with S06 delivering the serialised boundary that S07 extends; the Stage 2 deliverable summaries equal the contract `outputs`; no requirement, criterion, `covers`, `source` or `verify` entry from `36fb238` was removed; each Q21–Q33 has a supported disposition consistent with Core v4 and Checkpoint 1 v26; later-step allocations have owners or explicit out-of-scope lines; the exit-gate lines on lifecycle commands, execution state, Evidence guards and validation are satisfiable.

With X1–X14 applied, no unresolved behaviour needed by Stage 2 steps remains. Verdict: **requirement-ready, subject to fresh independent review of this record's corrections** (methodology §6: they were authored by the record's author). This is scoped T2 work; it authorises no implementation, harness construction or acceptance.

## Verification

Commands on the corrected tree, Node `v22.22.2`, pnpm `11.7.0`:

| Command | Result |
|---|---|
| `pnpm contracts:check` | PASS |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 20/20 |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no `@pactwright/standard` project and no runtime inputs; identical on `36fb238` |

Schema, citation and mapping checks establish structural consistency only. No verifier binding, runtime or harness was executed.

**Checkpoint 1 Stage 2 exit review v2**
