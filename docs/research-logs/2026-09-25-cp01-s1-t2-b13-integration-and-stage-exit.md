# CP01 Stage 1 T2 — B13: Integration, verification and stage exit

**Scope and authority:** see [B7](2026-09-25-cp01-s1-t2-b7-checkpoint-obligations.md). Start `8e7804f`; batches B7–B12 follow in dependency order. This record holds cross-stage dispositions, verification results, review references and the methodology §7 verdict.

**Status:** interim. The P2 corrections need fresh review, and the semantic-owner approvals are pending. **No stage-exit verdict yet.**

## Cross-stage integration

| Consumer / mismatch | Disposition |
|---|---|
| S07/R06 stale-base inputs | Resolved in B8 (Q69): the load result records bytes or absence, inventories and decoder identities, and the S02 registry identity. |
| S09/R02 "Step 1 problem collection"; S18 loader results | Resolved in B8 (Q61): categorised problems. S09/S18 own exit codes and severities. |
| S09/R04, R06 reconstruction of a recorded commit | Not a Stage 1 output. S05/AC08 proves restoration with existing Git mechanisms; the S09 contract owns its runtime reconstruction path. |
| S11/R06 writing through the loader | Resolved in B8 (Q69): the loader is read-only and the command writes. |
| S14 scaffold lock (Q42) | Resolved in B8. S15's T2 owns the scaffold-lock and configuration/lock-disagreement cases. |
| S16/AC13 case names | Resolved in B11 (Q82). |
| Build script filters on `@pactwright/standard` (a CP01-S10 output) while CP01-S01 has no prerequisites | Internal implementation choice constrained by S01/R03 (no skipped or no-op build) and CP01/AC01. T5 must make the S01 build succeed without S10. |
| 17 review bindings of Stages 2–5 without definitions | Listed by `contracts:check`; defined during those stages' T2. |

## Verification (at `be4f455` plus this record)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass (session start, `8e7804f`). |
| `pnpm contracts:check` | Pass; 17 Stage 2–5 binding uses reported as undefined. |
| `pnpm format:check`, `lint`, `typecheck` | Pass. |
| `pnpm test` | Pass, 25/25. |
| `pnpm build` | **Fail (exit 2), inherited:** "No projects matched the filters" and TS18003 (no `src/`). The diff `8e7804f..HEAD` touches no build input. |
| `pnpm verify` | **Fail (exit 2)** at the same build step. The mandatory gate is not waived. |

## Reviews

| Batch | Review | Outcome |
|---|---|---|
| B7 | Independent subagent review of `6f08a78` | Accepted with fixes; corrections in `7e9776e`. |
| B8 | Independent subagent review of `572cad5` | Accepted with fixes; corrections in `d520b76`. |
| B9, B10 | Independent subagent review of `939f2b5`, `5c871d0` | Accepted with fixes; corrections in `be4f455`. |
| B11, B12 | Independent subagent review of `5b27a83`, `3b3f0ee` | Changes required; corrections in `7c6d556`. |
| Whole stage (§7) | Independent subagent review of `7c6d556` (session subagent; report summarised below) | Not requirement-ready. Every finding is listed in the table below with its disposition. |
| Owner review, PR #47 | [Review 5315357320](https://github.com/sb-dev/pactwright/pull/47#pullrequestreview-5315357320) of `7c6d556` | Two P2 findings, fixed in `a3f4ed4`: edge-shape cases (Q89, B10) and refusal proofs moved to S07/S09 (Q90, B11). |
| Owner re-review, PR #47 | [Review 5315393528](https://github.com/sb-dev/pactwright/pull/47#pullrequestreview-5315393528) of `a3f4ed4` | Two P2 findings: per-field AC15 cases (B10), and recording the whole-stage findings below. Both are applied in the next commit. |

## Whole-stage review findings (review of `7c6d556`)

| ID | Severity | Finding | Affected | Disposition |
|---|---|---|---|---|
| H1 | Blocking | S04/AC11–AC12 required complete-state refusal, which S07/S09 deliver. | CP01-S04 R06, AC11, AC12 | Applied in `a3f4ed4` (Q90). |
| M1 | Major | Distribution §12's "configuration/lock disagreement" had no category. The S01/AC13 `unavailable-enabled-extension` fixture (no lock entry) could therefore report two problems. | Distribution §12; CP01-S01/AC13 | Applied. The disagreement is an environment problem from the configuration/lock agreement check (S15). It does not make the graph load incomplete, and it refuses capability execution and `environment_lock_hash`. The AC13 fixture keeps a lock entry, so configuration and lock agree. |
| M2 | Major | The S01/R05 decoder identity was untested. | CP01-S01/R05 | Applied: new S01/AC14 (`same-build`, `decoder-code-changed`). S07/AC06 `changed-registry-identity` remains the consumer. |
| L1 | Minor | S05/AC12 lacked refusal cases for migration-required, unsupported-version, unreadable and non-core-entry loads. | CP01-S05/AC12 | Applied: four cases added. |
| L2 | Minor | No case covered records reached only through an unreachable record. | CP01-S04/AC11 | Applied: `proceed-decision-without-intent-and-its-contract`; one problem names both records. |
| L3 | Minor | CP01-S07/R05 still said "a core edge tuple". | CP01-S07/R05 | Applied: "a tuple in the core edge store" (Core v4 §45). |
| L4 | Minor | A misspelt core type could be labelled either an S02 schema problem or an S01 non-core entry. | CP01-S02 AC02, AC14 | Applied. AC02 is limited to the Decision `outcome`/`decided_by` rules and states that an unknown type is S01's non-core-entry problem. AC14 runs once per core type. |
| L5 | Minor | The format of appended edge entries was not pinned. | CP01-S03/R01 | Applied: new entries use the existing indentation, and empty or flow lists become two-space block lists. |
| L6 | Minor | This record was stale. | B13 | Applied in this version. |

No listed finding remains open. Before a stage-exit verdict, the corrected head needs a fresh whole-stage review, and the semantic-owner approvals (Principles §3, Distribution §12, Core §45) are required.

**CP01 Stage 1 T2 B13 v1 (interim)**
