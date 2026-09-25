# Checkpoint 1 Stage 1 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 1 (CP01-S01 to CP01-S05) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Starting revision `8e7804fd5b6b42634308b167cd2d02f01067c2c6` on `refactor/pactwright-v2`. Source revisions: Core v3, Distribution v2, OSS v2, Implementation Guide v16, Checkpoint 1 v24, Spec 00 v5, contract format 2. Questions Q01–Q20 keep their crosswalk IDs and wording; the batch records B1–B6 (`2026-09-23-pr41-b*.md`) remain the decision records.

**Prior state, verified:** PR #41 resolved Q01–Q20 and applied Core v3 / Checkpoint 1 v20. Independent review [5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) returned R1–R16 at `1bcd2ea`; the targeted correction review [5301803981](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5301803981) passed at `87bd3eb` and PR #41 merged. The batch records' "fresh review required / not requirement-ready" lines predate that passing review; they are left as history and superseded by this record. Stages 2–5 were converted afterwards (PRs #42–#45), so every later-step proof that Stage 1 allocates can now be checked against a YAML contract rather than prose. No §7 stage-level review existed before this pass.

## Method

Six independent read-only reviewers, one per batch (B1 Q01–Q04, B2 Q05–Q09/Q18, B3 Q10–Q13/Q19, B4 Q14–Q16, B5 Q17, B6 Q20 plus the §7 whole-stage checks), re-verified every disposition from the current text, not from the batch-record summaries. Each applied the methodology tests: applied-at-owner, two-implementation divergence, rejected-alternative coverage, contradiction, coverage/binding fit, feasibility of prerequisites, allocation to later contracts, and cross-stage impact from Q21–Q56. Each reviewer refuted its own candidates before reporting; refuted candidates are listed in their reports. The author of this record then verified every reported finding against the text before acting on it. Verification commands and results are in the last section.

## Per-question disposition

| Q | Classification | Owner clauses | Status |
|---|---|---|---|
| Q01 storage layout / 0.0.1 readability | already specified (Core v3) | Core §54; Distribution §§3, 12, 15 | applied in S01/R05–R06, AC05, AC09, AC12; S02/R06; S03/R01; later S06/AC08, S11/AC07, S14/AC02, S15/AC05, S18/AC03, S19/AC06. Configuration v1 Extension-entry key set is held open (D1). |
| Q02 parse-failure contract | already specified | Core §§54, 56, 57 | applied in S01/R06, AC07, AC09, AC11; S05/R07, AC12; S18/R08. Coverage gaps corrected (S01/AC03, AC09, AC10). |
| Q03 inert declarations | already specified | Core §54 | applied in S01/R09, AC10; undeclared-directory case added. |
| Q04 package location | internal choice, pinned for CP01 | OSS §6 exception | applied in S01/R01, AC01; consistent with OSS §4/§6 and the checkpoint text. |
| Q05 record identity | already specified | Core §§6, 45 | applied in S02/R06–R07, AC05, AC09; grammar/prefix/filename negatives added to AC05. |
| Q06 immutability scope | already specified | Core §45 | applied in S02/R07, AC06, AC07, AC09; S03/R08, AC11; S07/R05, AC05. |
| Q07 canonical content | already specified | Core §6 | applied in S02/AC06, AC10; S05/AC06, AC10; normalisation edge cases pinned. Two wording items held open (D3, D4). |
| Q08 schema vs judgement | already specified | Core §6 | applied in S02/R04, R08, AC02, AC08, AC11 (review bindings). |
| Q09 actor representation | already specified | Core §§9, 27 | applied in S02/R05, AC13; S07/R07, AC04; whitespace-set and colon cases added. |
| Q10 supersession scope | already specified | Core §§15, 45 | applied in S03/R03, AC01, AC03, AC10; S04/R01. |
| Q11 supersession cardinality | already specified | Core §§15, 44 | applied in S03/R05, AC05, AC10; S04/R06; S05/AC12; S09 rule 8. |
| Q12 protected core constraints | already specified | Core §15; Distribution §11 | applied in S03/R06, AC07, AC09; S02/R09, AC12; equivalent-definition reuse pinned. |
| Q13 inactive data | already specified | Core §§15, 54 | applied in S03/R09, AC12; S05/R04, AC05, AC12; S16/AC10; S18/AC04; unresolvable-endpoint wording pinned. |
| Q14 competing Briefs/Evidence | already specified | Core §44 | applied in S04/R06, AC06, AC10; S09/AC03; S08/AC06. |
| Q15 withdrawal | already specified | Core §§44, 45 | applied in S04/R02, AC07; S07/R08, AC09–AC11; S12/AC06; initial-defer/reject and Decision-supersession cases added. Two §44 wording items held open (D5, D6). |
| Q16 policy boundary | already specified | Core §§9, 27, 44, 57 | applied in S04/R02, AC08; S06/AC09; S07/AC04; S09/AC04. |
| Q17 repository identity | already specified | Core §56; Distribution §16 | applied in S05/R01–R02, R06, AC01–AC03, AC07, AC08, AC11, AC15; grammar and input-boundary cases completed. |
| Q18 revision protocol | already specified | Core §56; fixtures | applied in S05/R02, R05, R07, AC03, AC06, AC09, AC10, AC12–AC14; S09/AC05; S16/AC12. Collection-order vector held open (D2). |
| Q19 registration seam owner | already specified; installed proof at Step 16 | Core §54; Distribution §11 | applied in S02 output `canonical-contribution-registry`, R09, AC12; S03/AC06–AC13; S05/AC04; S16/AC11, AC12, AC17. |
| Q20 cross-stage obligations | later-stage, owners named | Core §§45, 54, 55 | every allocation verified against the later contracts (table below). |

Cross-stage questions Q21–Q56: only Q52 names a Stage 1 ID (CP01-S01/R02); S01 declares the Node range and S20/R05, AC01 prove it, so no Stage 1 change. Q23, Q28, Q42 and Q47 consume Stage 1's settled rules without needing a further Stage 1 answer. Q42's later resolution is constrained: either plain init writes a lock or Core §§54/56 are amended; it must not silently relax S01/AC09 or S05/AC12. Q31 (whether reject/defer Decisions use `approve-contract.actor`) is a Stage 2 decision; Core §9 and §27 answer it implicitly and Stage 2 T2 should make it explicit in §27 or §49.

## Allocation audit (Q20)

| Later owner | Obligation from Stage 1 | Carried by |
|---|---|---|
| Steps 6, 11, 14, 15 | real lifecycle/configuration/lock formats through the Step 1 loader | S06/R07, AC08; S11/R06, AC07; S14/R06, AC02; S15/R06, AC05, AC06 |
| Step 7 | in-place rewrite refusal through the Step 2/3 checks; exact stored base; withdrawal and re-authorisation writes | S07/R05, AC05; R06, AC06; R08, AC09–AC11 |
| Steps 8, 12 | same guard matrix through `lifecycle run` and adapter commands | S08/AC07, AC08; S12/AC04, AC06, AC10 |
| Step 9 | composed validation, historical policy, requested replay | S09/AC01, AC04, AC05, AC06 |
| Step 16 | installed repetition of S02/AC12, S03/AC06–AC13, S04 derivation, revision inclusion/exclusion, inactive data | S16/R08–R09, AC10–AC13, AC17 |
| Steps 18, 19 | doctor severities; released-0.0.1 diagnosis and migration | S18/R07–R08, AC03, AC05; S19/R06–R10, AC06–AC08 |
| Step 24 | integrated Stage 1/adapter proof before self-hosting | still version 17 prose, permitted by Checkpoint 1 §3 |

Two allocation defects were found and corrected: S05/AC14 asserted policy-failure reporting that no required step delivers at Step 5, and S16/AC13 named CP01-S04 cases that do not exist.

## Findings applied (contract, checkpoint and crosswalk scope)

Applied in this pass. Each is a coverage or feasibility correction under an existing Core v3 clause; none changes product meaning.

| ID | Location | Correction |
|---|---|---|
| F-B1-1 | S01/AC09; S03/AC13; crosswalk S01.run.2 | `unexpected-active-extension-entry` cannot be produced at Step 1 (no declaration seam); replaced by S03/AC13 `undeclared-entry-in-owner-root`, where the Step 2 seam exists. |
| F-B1-3 | S01/AC09, AC10 | Added `non-empty-gitkeep` and `undeclared-extension-directory` (Core §54: removed Extension directories are inactive, `.gitkeep` must be empty). |
| F-B1-4 | S01/AC03 | Added `missing-runtime-input`: the verify gate must fail when the runtime build has nothing to build. |
| F-B1-5 | S01/AC09 | Dropped `unsupported-version`, which AC12 owns per input. |
| F-B1-6 | crosswalk | S01/AC12 mapped by S01.run.2; Q03 `affects` names R09/AC10 where its answer landed. |
| F-B2-1 | S02/AC05 | Added `malformed-identity`, `type-prefix-mismatch`, `filename-mismatch` (Core §6 grammar and filename rule). |
| F-B2-3 | S02/R05, AC13 | Pinned the §9 whitespace/line-terminator set and a colon-bearing identity control. |
| F-B2-5 (b), F-B2-6 (b), F-B2-8 | S02/AC02, AC06, AC10; S05/AC10 | Whitespace-only body, lone CR, non-ASCII trim member, quoted-scalar type difference, line wrapping; S05/AC10 `metadata-value` renamed `frontmatter-value`. |
| F-B3-1 | S03/AC13 | Endpoint owners pinned so relation-owner placement is distinguished from source-owner placement (Core §54). |
| F-B3-3, F-B3-4, F-B3-5 | S03/AC07, AC12, AC13; S05/AC12 | Equivalent-definition core-name reuse; inactive endpoint fails as unresolvable active endpoint; current-format lock note. |
| F-B4-1 to F-B4-5, F-B4-9, F-B4-10 | S04/R06, AC06, AC07, AC08, AC10 | Added `decision-change-reselects-current-contract`, `replacement-intent-decision-supersession`, `incomplete-load`, four orphan-record cases, `initial-defer/reject-to-proceed`; Decision supersession stated in re-authorisation; unobservable "no execution permission" phrasing replaced. |
| F-B2-4 / F-B4-6 / F-B6-1 | S05 `requires`, AC14; S06/AC09; S09/AC04 | S05 now requires CP01-S04; AC14 proves the revision half and delegates the actor-kind refusal to S06/AC09 and S09/AC04, which use the frozen digest as their unchanged-revision control. |
| F-B5-1, F-B5-2, F-B6-3 | S05/AC15, AC11 | Grammar cases for case, length, non-existent and tag objects; `required-symlink-input`; `absent-required-input`. |
| F-B5-3, F-B5-4 | S05/AC11, AC08 | Index "unchanged" defined as staged content; restore isolation defined observably. |
| F-B3-2 / F-B6-4, F-B4-11 / F-B6-2 | S16/AC11, AC13 | `when` no longer contradicts S03/AC13; AC13 cases bound to real S04 fixtures. |
| F-B6-5, F-B6-6 | Checkpoint 1 §3, Step 4 note; crosswalk header | Status text names the passing correction review and this record; Step 6 added to the policy-enforcement note. |

Checkpoint 1 moves to version 25. Crosswalk quotes, source revisions and Q01–Q20 wording are unchanged.

## Specification decisions held open (owner approval required)

These need a change under `docs/specs/`. They were not applied; the owner decides. Recommendation and consequence for each:

| ID | Owner | Issue | Recommendation |
|---|---|---|---|
| D1 (F-B1-2) | Distribution §3 | The released 0.0.1 decoder accepts only `source` and `enabled` per Extension entry and rejects unknown keys (`207ac08:src/config/config.ts`); §3 says entries retain a "configured version". No clause states the unknown-key policy for configuration, lifecycle or lock documents. Two loaders diverge on persisted configuration. | State the entry keys (`source`, `enabled`, optional `version`) and that these documents reject unknown keys with path and cause. This is the one item that blocks full requirement-readiness. |
| D2 (F-B2-2) | Core §56 fixtures | No pg1 vector distinguishes the UTF-16 record/edge collection sort from locale or code-point order; all keys are ASCII kebab. A `localeCompare` sort passes every vector and emits a different digest for Extension keys. | Add one frozen `collection-order` vector with keys `B`, `a`, `😀` and U+E000, frozen by the probe method, not the implementation under test. |
| D3 (F-B2-5) | Core §6 | "quoting style … does not change content" is unqualified; plain `1` and `"1"` are different values under the pinned profile. | Qualify: quoting of a scalar that resolves to the same value. |
| D4 (F-B2-9, F-B2-6a) | Core §6 | BOM, `---` line form and "non-blank" are unspecified for the record envelope. | State: file starts with `---` at byte 0, frontmatter ends at the next line that is exactly `---`; non-blank means not empty after `String.prototype.trim`. |
| D5 (F-B4-7) | Core §44 | Derived-state table rows 1–4 omit "current"; only §44 prose makes a withdrawn lineage `rejected`. | Add the qualifier to the four rows. |
| D6 (F-B4-8) | Core §44 | "omitting that supersession is invalid lineage" can be read to invalidate an empty replacement Intent. | Restrict to a new Contract in such a direction; state a replacement Intent without a Decision is `open`. |
| D7 (F-B2-7) | Core §56 fixtures | The U+E000 key in `unicode-and-arrays` is stored raw and reads as an empty string. | Escape it as `` in both JSON literals (value-preserving) and note it in `purpose`. |
| D8 (F-B4-5a) | Core §44 | Orphan records are handled by the S04/R06 sentence; a one-line §44 statement would place the rule at its owner. | Optional. |

## Stage-level result (§7)

Identity, storage, relationships, authority, failure behaviour and revisions agree across S01–S05, `checkpoint.yml`, the Checkpoint 1 Stage 1 section and the later contracts they rely on; the deliverable summaries equal the contract `outputs`. Every requirement has exercising acceptance coverage; the 60 verifier binding IDs are unique and their methods fit; deferred integration proofs have explicit owners and prerequisites. With the corrections above, no unresolved behaviour needed by Stage 1 steps remains except D1. Verdict: **ready with fixes; requirement-ready once D1 is recorded in Distribution §3 and this correction set has independent review.** D2–D8 are recommended but do not block. This is scoped T2 work: it authorises no implementation, harness construction or acceptance.

The corrections in this pass were authored by the reviewer of record and therefore require fresh independent review (methodology §6). That review is requested on the pull request carrying this record.

## Verification

Commands run on the corrected tree, Node `v22.22.2`, pnpm `11.7.0`, `pnpm install --frozen-lockfile`:

| Command | Result |
|---|---|
| `pnpm contracts:check` | PASS (Git-source verbatim checks ran; `26ea12a` present) |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 19/19 |
| `pnpm build` / `pnpm verify` | FAIL, inherited: `@pactwright/standard` filter matches nothing and TS18003 no runtime inputs; identical on the starting revision |

Schema, citation and mapping checks establish structural consistency only. No verifier binding, runtime or harness was executed.

**Checkpoint 1 Stage 1 exit review v1**
