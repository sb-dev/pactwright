# CP01 Stage 1 T2 — B13: Integration, verification and stage exit

**Scope and authority:** see [B7](2026-09-25-cp01-s1-t2-b7-checkpoint-obligations.md). Start `8e7804f`; batches B7–B12 follow in dependency order. This record holds cross-stage dispositions, verification results, review references and the methodology §7 verdict.

**Status:** interim. B11/B12 independent review and the whole-stage review are pending. **No stage-exit verdict yet.**

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
| B11, B12 | Pending | — |
| Whole stage (§7) | Pending; also serves as a fresh review of all corrections. | — |

**CP01 Stage 1 T2 B13 v0 (interim)**
