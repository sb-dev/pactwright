---
id: intent-routing-cost-narrow-scope-5d2c
type: intent
title: Make market cost track blast radius, not risk class alone
status: addressed
created: 2026-08-03
class: 3
---
The work-class routing table sizes process by **risk class alone**. Surface count appears in it only
to *escalate* — "any multi-surface change" is class 3 — never to reduce. There is no way for a change
to be small enough to earn less process at class 2, and the bar is machine-enforced, so it cannot be
opted out of.

Measured across the first ten delivered intents:

| Evidence | Value |
|----------|-------|
| Class 2 median process artifact vs class 3 | 816 vs 1,076 lines — **82%** |
| Most expensive delivery in the repository | a **class 2** intent, 2,053 lines |
| Amendments per decision, class 2 vs class 3 | 6.50 vs 4.75 — class 2 **higher** |
| Contract prose ever written that was rejected | **62.4%** (3,962 of 6,352 lines) |
| Contracts + comparisons as a share of process artifact | **55%** |
| Rejected-contract size, June vs later markets | 122 → 314 lines (**2.6×**) |

A class-2 change costs 82% of a class-3 change and can cost more than any of them. The table
discriminates on contract length and lane count; it does not discriminate on total process cost.

`class-market-quorum` is the binding constraint — undated, unwaivable and parameterless, the only
rule in the set with no cutoff and no escape. `comparison-required` enforces the same ≥2 bar
independently. Both fire on a one-candidate class-2 intent. The sole existing lever is demoting the
intent to class 1, which misstates its risk.

**Goal:** a class-2 change that is genuinely narrow may run a single-candidate market without lying
about its risk class, while every change that does not opt in behaves exactly as it does today.

Origin: the process post-mortem of 2026-08-03, after PR #16 reached 36 commits and 213 files without
merging and eight consecutive intents were captured without one being closed.
