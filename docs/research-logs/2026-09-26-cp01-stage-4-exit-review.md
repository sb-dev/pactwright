# Checkpoint 1 Stage 4 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 4 (CP01-S14 to CP01-S19) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Reviewed on branch `claude/stage-4-step-contracts`, base `refactor/pactwright-v2` at `0ef869c`. Source revisions at review: Core v6, Distribution v5, Implementation Guide v17, Principles v4, Checkpoint 1 v29, Spec 00 v5, contract format 2. Questions Q41–Q51 keep their crosswalk IDs and wording; the batch records [B15](./2026-09-26-cp01-stage-4-b15-init-and-scaffold.md), [B16](./2026-09-26-cp01-stage-4-b16-extension-composition.md), [B17](./2026-09-26-cp01-stage-4-b17-environment-identity.md) and [B18](./2026-09-26-cp01-stage-4-b18-doctor-and-runtime-upgrade.md) remain the decision records.

## Method

Two independent read-only reviewers ran on the uncommitted tree. One checked whole-stage consistency: the Q41–Q51 dispositions under the two-implementations test; identity, storage, authority and failure agreement across S14–S19 and with Distribution v5 / Core v6; requirement coverage, case distinctness, binding uniqueness, `requires` and `inputs` order, deliverable-summary equality and loss against `0ef869c`; pinned behaviour against the released `207ac08` code; and the env1 vectors. The other audited cross-stage allocation: contradictions with requirement-ready Stages 1–3 and their exit follow-ups, the Stage 5 contracts, the unconverted Steps 22–31, Checkpoint 2 §3 and Steps 7 and one-shot `init --github`, Checkpoint 5 and Distribution §§6–8, the Guide and Principles, the exit gate and every later owner the records name. Each refuted its own candidates before reporting. The author verified every finding against the text before acting.

## Findings and dispositions

Pending: the two independent reviews are in progress at this revision; their findings, the corrections applied and the fresh review of those corrections are recorded in the next revision of this record.

## Verification

Commands on the corrected tree, Node `v22.22.2`, pnpm `11.7.0`:

| Command | Result |
|---|---|
| `pnpm contracts:check` | PASS |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 25/25 (20 existing, 5 env1 vector checks) |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project; identical on `0ef869c` |

Recorded challenge-plan checks executed by the author: the released `207ac08` reads cited in B15–B18; the Checkpoint 2, 5 and later-checkpoint greps; deliverable-summary equality (46 of 46 outputs across CP01-S01–S21 equal their summaries); verifier-binding uniqueness across CP01; case-name uniqueness per criterion; independent recomputation of the four env1 digests in Python and in the Node definition test. Schema, citation and mapping checks establish structural consistency only. No verifier binding, runtime or harness was executed.
