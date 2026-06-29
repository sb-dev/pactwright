---
id: evidence-patch-market-tests-6c7d
type: evidence
title: Patch-market tests + fixtures landed (test-verification lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-tests-f6c7` (the `test-verification` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented. Authored by `test-writer` via `/write-tests`, a separate invocation from the domain-backend lane that wrote the code under test.

## What landed (code & project files)
- `tests/patch_gate.test.ts` — `evaluatePatchGate` matrix: PR→brief mapping (graph-first match, patch-branch-with-no-node fail-closed, non-patch branch passes), the >1-competitor unresolved/resolved cases, and `waives → patch-comparison` override expiry.
- `tests/patch_synthesis_parentage.test.ts` — ≥2 distinct parents pass; one parent (or two edges to the same parent) → finding.
- `tests/patch_comparison_coverage.test.ts` — comparison covering ≥2 competitors passes; coverage <2 or a live candidate uncovered → finding; `selects → contract` ignored.
- `tests/patch_live_competitor_parity.test.ts` — the Fix-2/Fix-3 parity test: the gate and the structural handler agree on the competing set; `selected`/`superseded` excluded from `liveCompetitors` but present in status-blind `competingPatches`.
- Fixtures `tests/fixtures/good-patch-market/` (green resolved market incl. a selected synthesis) and `tests/fixtures/bad/{patch-synthesis-one-parent,patch-status-merged,competes-for-bad-endpoints}/`, wired into `tests/spec.test.ts`.
- Committed as `2b073d9`.

## Verification (run 2026-06-25)
- `node --test --import tsx tests/*.test.ts` → 181 tests, 181 pass, 0 fail (35 new patch tests).
- The parity test caught the `competingPatches` status-blindness bug in the gate lane (red before / green after the domain-backend fix) — independent verification doing its job.
- `good-patch-market`: `spec:validate` exits 0 and the regenerated indexes are byte-identical to the committed fixture; the three bad fixtures fail with their pinned `[rule: …]` errors.

## Touches
- `capability-spec-tests-3a6e` (owns `tests/**`).

## Honest bound
These tests verify the gate's verdict and the rules' findings against synthetic graphs and fixtures; a live multi-patch market blocking a real PR is verified by the fixtures, not yet by an end-to-end market run.
