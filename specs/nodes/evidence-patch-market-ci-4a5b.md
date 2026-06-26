---
id: evidence-patch-market-ci-4a5b
type: evidence
title: patch-comparison.yml CI gate landed (observability-release lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-ci-d8a4` (the `observability-release` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented.

## What landed (code & project files)
- `.github/workflows/patch-comparison.yml` — runs `pnpm spec:patch-gate` with `GATE_BASE: ${{ github.event.pull_request.base.sha }}` and `fetch-depth: 0`, modelled on `pr-evidence.yml`; on every PR with NO specs-only/code-only skip, so the gate fires on the code-merge PR (Graft C) and the required check always reports. Header comment states it computes/reports only — blocking depends on the branch-protection required-check setting.
- `docs/branch-protection.md` — added the `patch-comparison` required-status-check row + a paragraph on the required-check wiring (Fix 5: the blocking step lives outside the diff).
- Committed as `ce2a354`.

## Verification (run 2026-06-25)
- `patch-comparison.yml` parses as valid YAML (`js-yaml.load`).
- The named-check literal is byte-identical across the three lanes: `patch-comparison` in `specs/schema/checks.yaml`, `PATCH_COMPARISON_CHECK` in `tools/patch_gate.ts`, and this workflow's gate step; the script is exactly `pnpm spec:patch-gate`, env `GATE_BASE`.

## Touches
- `capability-ci-enforcement-3e4f` (owns `.github/workflows/**`, `.github/CODEOWNERS`).
- `capability-spec-docs-8c1d` (`docs/branch-protection.md`; `docs/` newly owned in this PR).

## Capability ownership (extend-a-capability resolution)
`docs/branch-protection.md` was owned by no capability (the `/prepare-evidence` STOP-and-ask). Resolved in this PR by extending `capability-spec-docs-8c1d` `paths` from `[CLAUDE.md]` to `[CLAUDE.md, docs/**]` — it is the documentation capability, and this also closes the pre-existing ownership gap on `docs/drift-detection.md`.
