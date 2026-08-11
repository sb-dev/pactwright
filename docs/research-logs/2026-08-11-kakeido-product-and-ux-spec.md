# Kakeido — Product & UX Spec

## 1. Product focus

Kakeido is a Kakeibo-inspired spending review app built around a weekly ritual.

Its core job is:

> Turn imported spending into a small number of useful review decisions, while keeping every spending inspectable.

Kakeido is not a dashboard-first finance app. The product should lead with decisions, review progress and plain-language meaning rather than charts or raw transaction tables.

Canonical flow:

```text
Plan the month
→ Import spending
→ Review brief
→ Resolve decisions
→ Check groups
→ Confirm safe spendings
→ Scan the week
→ Confirm review
→ Reflect briefly
```

Financial semantics are defined in `Kakeido — Financial Model Spec.md`. Assistant-authored observations and explanations are defined in `Kei — Assistant Spec.md`.

---

## 2. Product mental model

Kakeido has four areas:

```text
Today
Review
Plan
Explore
```

### Today

The home surface. Show the current state and one next best action.

### Review

The centre of the product. Import and process the weekly review without turning every spending into a task.

### Plan

Set the monthly savings goal, fixed commitments, flexible spending envelopes and monthly intention.

### Explore

Inspect spending history, insights, rules and reflections when the user has a specific question.

Explore is secondary. Review should remain the strongest product destination.

---

## 3. UX principles

### 3.1 Lead with decisions, not data

Prefer:

```text
6 spendings need a decision
4 groups are worth checking
52 look safe
```

Do not lead with:

```text
74 transactions imported
```

### 3.2 Group before listing

Default order:

```text
summary
→ decisions
→ grouped checks
→ safe spendings
→ full weekly scan
→ item detail on demand
```

### 3.3 One job per screen

Each step should have one clear task: import, decide, check, scan, confirm or reflect.

### 3.4 Automation must be inspectable

The user should always be able to understand why Kakeido or Kei suggested an outcome and change it before or after confirmation.

### 3.5 Bulk actions must be safe

Before a bulk confirmation, show what will be affected, representative examples and why the group looks safe. Bulk actions must be undoable.

### 3.6 Preserve uncertainty

Do not convert uncertain evidence into confident UI. If Kakeido cannot make a useful suggestion, ask for a decision instead.

### 3.7 Every insight should lead somewhere

A useful insight either explains what changed or offers an immediate relevant action such as viewing spendings, reviewing a merchant, adjusting a plan or creating a rule.

---

## 4. Core weekly review

The weekly review has eight stages.

```text
1. Import Spending
2. Review Brief
3. Decision Cards
4. Group Checks
5. Looks Safe
6. All Spendings Scan
7. Weekly Summary
8. Optional Reflection
```

This is a guided sequence, not a locked wizard. The user can move between review lanes and return later without losing progress.

### 4.1 Import Spending

Purpose: import a bank or credit-card CSV and prepare a review.

Show:

- recognised account and period;
- new spendings;
- possible duplicates;
- rows that need fixing;
- a clear action to import and prepare the review.

Hide column mapping unless recognition fails or the user asks to inspect it.

The user should feel that they are preparing a review, not committing database rows.

### 4.2 Review Brief

Purpose: make the workload feel bounded.

Example:

```text
Weekly Review
20 May — 26 May

6 need a decision
4 groups are worth checking
52 look safe
74 spendings imported

Focus areas
Amazon has mixed categories
Food delivery is above normal
One possible duplicate needs checking

Start with: Decisions
```

The brief should answer:

```text
How much work is this?
Why does anything need my attention?
Where should I start?
```

### 4.3 Decision Card

Purpose: resolve one high-attention spending.

Show:

```text
merchant
amount, date and account
why it needs a decision
most likely category, when useful
few likely alternatives
accept / change / split / skip / details
```

Do not show the full category tree by default.

Details may expose the raw bank description, relevant reviewed history and the evidence behind the suggestion.

### 4.4 Group Check

Purpose: review similar spendings together.

Group by merchant or another clearly coherent pattern. Never group merely because items share the same envelope.

Show:

```text
merchant or group name
item count and total
suggested category
why the group is worth checking
compact item list
accept / change / review individually / create rule
```

Grouping must reduce repeated work without hiding meaningful differences.

### 4.5 Looks Safe

Purpose: let the user inspect low-attention spendings without forcing item-by-item review.

Show representative examples and a concise reason such as stable reviewed merchant history or an explicit rule.

Primary actions:

```text
Confirm all
Inspect list
```

Use **confirm**, not “accepted automatically”. The user remains the actor.

### 4.6 All Spendings Scan

Purpose: let the user inspect every spending from the week without turning every item into a separate task.

This is a weekly receipt, not a transaction table.

Default presentation:

```text
grouped by day
compact rows
short attention labels
filterable
openable for detail
```

Useful labels:

```text
new
changed
rule
above normal
duplicate?
skipped
```

Useful filters:

```text
All
Flagged
Changed this review
By day
By Kakeibo envelope
```

### 4.7 Weekly Summary

Purpose: close the review with meaning rather than completion statistics alone.

The summary should answer:

```text
What happened?
What mattered?
What stayed stable?
What might be useful next week?
```

Example:

```text
Week reviewed

74 spendings reviewed
6 decisions resolved
4 groups checked
52 safe spendings confirmed

Wants was the main pressure point this week.
Food delivery and Amazon explain most of the increase.
Needs and Culture stayed within plan.
```

Assistant-authored summary copy follows the Kei spec.

### 4.8 Weekly Reflection

Reflection is optional, short and practical.

Show the relevant weekly context and no more than two lightweight prompts.

Prefer:

```text
One sentence about the week
Anything you want to change next week?
```

Do not turn the weekly review into long-form journalling.

---

## 5. Today

Purpose: show current status and one next action.

Recommended structure:

```text
month status
weekly review status
one main signal
one primary action
```

Example:

```text
Today
Thursday 28 May

May plan
£460 projected savings / £500 target
Slightly at risk

Weekly review
6 decisions
4 groups to check
52 look safe

Kei noticed
Wants is running fast, mostly from food delivery.

[Review this week]
```

Do not show a full dashboard, transaction feed or every available insight.

---

## 6. Plan

Purpose: set monthly intent.

Canonical plan structure:

```text
income
fixed commitments
savings goal
flexible spending budget
Kakeibo envelopes
monthly intention
```

Example:

```text
May Plan

Income                  £3,200
Fixed commitments       £1,850
Savings goal              £500
Flexible spending         £850

Needs                     £400
Wants                     £200
Culture                   £100
Unexpected                £150

Monthly intention
Reduce takeaway lunches and keep culture spending intentional.
```

Changing an envelope should show the trade-off immediately. The four envelopes allocate the flexible spending budget; fixed commitments do not consume those envelope limits.

---

## 7. Month Status

Purpose: show whether the current month is aligned with the plan.

Show:

```text
projected savings vs target
fixed commitments status
reviewed flexible spending vs plan
envelope status
one main insight
one relevant action
```

Example:

```text
Savings
£460 projected / £500 target
Slightly at risk

Flexible spending
£412 reviewed / £850 planned
£86 unreviewed

Needs        £220 / £400   on track
Wants        £126 / £200   running fast
Culture       £36 / £100   on track
Unexpected    £30 / £150   low
```

The definitions behind projected savings and plan statuses live in the Financial Model spec.

---

## 8. Explore

Explore begins with destinations, not raw history.

```text
Spendings
Insights
Rules
Journal
```

### Spendings

Search and inspect spending history by merchant, description, envelope, category, week, account or attention state.

### Insights

Show a small list of meaningful patterns. Each insight should explain the pattern and offer a relevant next action.

### Rules

Inspect, create, edit and disable categorisation rules. Rule management should not interrupt the weekly review unless a rule suggestion is directly useful.

### Journal

Revisit weekly and monthly reflections. Journal is for recall and behaviour learning, not long-form writing.

---

## 9. Categories and classification UX

Flexible spending uses two levels:

```text
Kakeibo envelope / category
```

Examples:

```text
Needs / Groceries
Wants / Eating out
Culture / Books
Unexpected / Repairs
```

Fixed commitments sit outside the four envelopes but may still have a category:

```text
Fixed / Housing
Fixed / Utilities
```

The user may correct either level during review. The full category model and split-spending rules are defined in the Financial Model spec.

---

## 10. Content rules

Prefer user-facing language:

```text
spending
review
looks safe
needs a decision
worth checking
weekly review
monthly plan
```

Do not expose implementation language such as confidence score, classification pipeline, database row or model output.

Use calm, factual language. Avoid shame, urgency theatre and generic praise.

---

## 11. Error and empty states

Errors should explain:

```text
what happened
why it matters
what the user can do next
whether anything changed
```

Empty states must point to the next useful action.

Example:

```text
No spending imported yet.

Import a bank or credit-card CSV to prepare your first weekly review.

[Import spending]
```

---

## 12. Interaction rules

Interaction patterns are surface-specific, but actions must remain visible and understandable without hidden gestures or shortcuts.

For keyboard-driven clients, shortcuts may accelerate visible actions:

```text
↑ / k   move up
↓ / j   move down
enter   select / accept
esc     back
/       search or filter

review actions
a       accept
c       change category
s       split spending
r       create rule
x       skip
u       undo
d       details
```

Shortcuts are accelerators, never requirements.

---

## 13. Acceptance criteria

The UX is successful when:

- the weekly workload is understandable in under 10 seconds;
- the user is not forced into a long transaction table;
- every spending can still be inspected;
- important decisions can be resolved one at a time;
- coherent spendings can be confirmed as a group;
- safe spendings can be confirmed in bulk and undone;
- the user can understand why attention or a category was suggested;
- the weekly summary explains behaviour rather than only totals;
- Today always points to one next action;
- fixed commitments and flexible envelopes are not double-counted;
- Kei adds context without taking over the workflow.

Core test:

> Can a user import a normal week of spending and complete the review without feeling punished for having many transactions?

---

**Version:** 2.0  
**Date:** 2026-08-09  
**Status:** Implementation spec
