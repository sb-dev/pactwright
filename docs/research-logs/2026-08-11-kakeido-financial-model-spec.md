# Kakeido — Financial Model Spec

## 1. Purpose

This document defines the financial concepts that Kakeido UX and Kei depend on. It exists to keep planning, review, insights and projections internally consistent.

It is a product-domain model, not financial advice.

---

## 2. Monthly money model

The monthly plan has four layers:

```text
Income
− Fixed commitments
− Savings goal
= Flexible spending budget

Flexible spending budget
→ Needs
→ Wants
→ Culture
→ Unexpected
```

Canonical formulas:

```text
flexible_spending_budget = income - fixed_commitments - savings_goal

envelope_limits_total = needs + wants + culture + unexpected

envelope_limits_total = flexible_spending_budget
```

If the envelope total does not equal the flexible spending budget, the plan is incomplete and cannot be confirmed.

---

## 3. Fixed commitments

Fixed commitments are planned recurring obligations that are expected before discretionary decisions are made.

Examples:

```text
rent or mortgage
council tax
utilities
insurance
contractual repayments
other recurring commitments the user marks as fixed
```

Fixed commitments:

- reduce the money available for flexible spending;
- are still imported and reviewable;
- do not consume Needs, Wants, Culture or Unexpected envelope limits;
- may have a secondary category such as Housing or Utilities;
- may change month to month.

Example classification:

```text
Fixed / Housing
Fixed / Utilities
```

A fixed commitment must not also count against a flexible envelope. This prevents double counting.

---

## 4. Flexible Kakeibo envelopes

Kakeido uses four top-level envelopes for flexible spending:

### Needs

Necessary flexible spending required for normal life.

Examples: groceries, transport, household essentials.

### Wants

Optional consumption and convenience.

Examples: eating out, takeaway, shopping.

### Culture

Intentional enrichment, learning and recreation.

Examples: books, cinema, museums, classes.

### Unexpected

Unplanned spending that does not reasonably belong in the normal monthly plan.

Examples: urgent repairs or one-off replacement costs.

The app should not moralise these envelopes. They are planning categories, not good/bad labels.

---

## 5. Categories

Flexible spending uses:

```text
envelope / category
```

Examples:

```text
Needs / Groceries
Needs / Transport
Wants / Eating out
Wants / Shopping
Culture / Books
Culture / Entertainment
Unexpected / Repairs
```

Fixed commitments use:

```text
Fixed / category
```

Categories may be predefined initially and may later become user-editable. The product must not depend on a large fixed taxonomy.

A spending may temporarily have an envelope without a category when the top-level decision is clear but the detailed category is not useful.

---

## 6. Spending record

A spending represents one imported outflow after import normalisation.

Minimum product fields:

```text
date
amount
merchant / display description
source account
raw description
review state
classification
```

Classification is one of:

```text
Fixed / category
Needs / category
Wants / category
Culture / category
Unexpected / category
Unclassified
```

The user-facing product should call these **spendings**, not database transactions.

---

## 7. Review state

Imported spendings remain inspectable regardless of how confidently they can be prepared.

Recommended product states:

```text
needs decision
worth checking
looks safe
reviewed
skipped
```

These are UX states, not probability bands.

A spending becomes **reviewed** only after a user action confirms it directly or as part of an explicit bulk/group confirmation.

Kakeido may prepare a suggested classification, but should not describe a spending as “accepted automatically”.

---

## 8. Splits

A spending may be split when one imported payment covers more than one purpose.

Rules:

```text
sum(split amounts) = original amount
```

Each split receives its own classification.

Example:

```text
£40 Amazon
→ £25 Wants / Shopping
→ £15 Culture / Books
```

The original imported record remains the audit source; the split parts drive plan totals and insights.

---

## 9. Rules and merchant history

A rule is an explicit user-approved mapping from a recognisable spending pattern to a classification.

Example:

```text
description contains TFL
→ Needs / Transport
```

Reviewed merchant history may support a suggestion even when no rule exists.

Rules and history can lower review workload, but they do not remove the user's ability to inspect or correct a spending.

A correction should update future evidence. It should not silently rewrite already reviewed history.

---

## 10. Monthly totals

Track at least these distinct totals:

```text
fixed commitments planned
fixed commitments reviewed
flexible spending planned
flexible spending reviewed
flexible spending unreviewed
savings target
projected savings
```

Do not combine fixed commitments and flexible envelope usage into the same “planned £X” figure unless the label explicitly means total monthly outflow.

---

## 11. Projected flexible spending

Projected flexible spending estimates end-of-month flexible spending from reviewed activity and the current month plan.

For the first implementation, use a transparent pace projection rather than an opaque model:

```text
elapsed_ratio = elapsed_days / days_in_month
pace_projection = reviewed_flexible_spending / elapsed_ratio
```

Guardrails:

- do not project before enough of the month has elapsed to make the result useful;
- exclude known duplicates and skipped/unresolved imports from reviewed spend;
- when a user changes the plan, recalculate against the new plan;
- label the value as projected, never promised.

The projection method may evolve later without changing the product meaning.

---

## 12. Projected savings

Projected savings means the money expected to remain after fixed commitments and projected flexible spending.

```text
projected_savings = income - fixed_commitments - projected_flexible_spending
```

Equivalent relation to the savings goal:

```text
projected_savings = savings_goal
                  + flexible_spending_budget
                  - projected_flexible_spending
```

This makes the Today example coherent:

```text
£460 projected / £500 target
```

means current spending pace implies savings approximately £40 below the monthly goal.

---

## 13. Pace and status language

Status labels describe the plan, not the user's character or discipline.

### On track

Current projection remains within the relevant plan limit or savings target.

### Running fast

Current pace implies an envelope is likely to exceed its limit if the pattern continues.

### Low

Spending is materially below the envelope's current pace. This is descriptive, not necessarily positive.

### Slightly at risk

Projected savings are below the target, but the gap is small enough that the month can plausibly recover through normal variation or an intentional adjustment.

### At risk

Projected savings are materially below the target.

Exact tolerance thresholds belong in implementation configuration and should be tested against real usage. They must not be exposed as confidence scores.

---

## 14. “Above normal” and “usual”

Kei may compare activity with the user's own reviewed history.

A comparison is valid only when there is enough comparable history.

Prefer simple evidence such as:

```text
merchant total this week vs recent reviewed weeks
number of visits this week vs recent reviewed weeks
amount of a recurring spending vs its recent reviewed range
```

If history is insufficient, say that the merchant is new or ask for a decision. Do not invent a normal baseline.

---

## 15. Duplicates

Possible duplicates are review findings, not automatic deletions.

A duplicate candidate should show why it was flagged, for example similar amount, merchant and date.

The user can:

```text
keep both
mark duplicate
inspect details
```

Only confirmed duplicates are excluded from spending totals.

---

## 16. Plan changes

Changing the plan must not rewrite historical spendings.

Plan changes affect:

```text
remaining envelope amounts
current pace status
projected savings
future weekly summaries
```

The app should show the immediate trade-off before saving.

Example:

```text
Increasing Wants by £50 requires reducing another envelope or lowering the savings goal.
```

---

## 17. Core invariants

The implementation must preserve these rules:

```text
fixed commitments are never double-counted in flexible envelopes
flexible envelope limits sum to the flexible spending budget
split amounts sum to the original spending
confirmed duplicates are excluded from totals once
reviewed totals contain only reviewed spendings
unreviewed spendings remain visible separately
assistant suggestions never change the canonical classification without user confirmation
historical spendings are not rewritten when the current plan changes
```

---

## 18. Acceptance criteria

The model is correct when:

- a £1,250 rent payment can be reviewed without consuming a £400 Needs envelope;
- total monthly figures distinguish fixed obligations from flexible spending;
- projected savings can be explained from the plan and spending pace;
- the same spending cannot be counted twice;
- category corrections and splits produce deterministic totals;
- Kei can explain patterns from reviewed evidence without needing hidden confidence labels;
- every number shown in Today, Review, Plan and Explore maps to one defined concept in this document.

---

**Version:** 1.0  
**Date:** 2026-08-09  
**Status:** Implementation spec
