# Kakeido — Mobile Design Spec

## 1. Design direction

Kakeido should feel like a calm weekly money ritual rather than a bank dashboard, trading app or spreadsheet.

The supplied Kakeido landing-page concept is the visual reference for this spec: warm off-white surfaces, dark ink typography, rounded cards, restrained orange brand accents, green review actions and a small friendly Kei presence.

Visual character:

```text
warm
clean
spacious
focused
trustworthy
minimal
human
```

Avoid:

```text
neon finance styling
dense chart walls
aggressive red warnings
streak gamification
spreadsheet-like tables
mascot overload
```

---

## 2. Brand and colour roles

Colour communicates role rather than decoration.

### Base

- **Paper:** warm off-white background and large surfaces.
- **Ink:** deep charcoal/navy for primary text and navigation.
- **Warm grey:** borders, separators and quiet secondary surfaces.

### Brand orange

Use for Kakeido identity, marketing CTAs, small highlights and Kei's warm visual family.

Orange should not indicate financial risk.

### Review green

Use for confirmed, reviewed, on-track and primary in-app review actions.

Examples:

```text
Review this week
Confirm all
Mark as reviewed
On track
```

### Attention amber

Use for items that deserve attention but are not failures.

### Risk red

Reserve for genuine negative or destructive states. Never use it merely because spending is above pace.

### Soft lilac / blue

Use as an optional secondary accent for inspect, search and intelligence surfaces. It should remain subordinate to orange and green.

Do not rely on colour alone. Always pair state colour with a clear label.

---

## 3. Typography

Use the platform system font.

```text
iOS      SF Pro
Android  Roboto
```

Use large, highly legible numerals for key money values and workload counts. Keep supporting labels plain and compact.

Hierarchy should come primarily from size, weight and spacing rather than multiple font styles.

---

## 4. Shape and spacing

Use soft rounded geometry consistent with the landing-page concept.

Recommended ranges:

```text
cards           16–24 px radius
buttons         12–18 px radius or pill
bottom sheets   20–28 px top radius
chips           pill
```

Use generous section spacing, short cards, minimal borders and clear grouping. Dense rows are acceptable only in the full weekly scan.

Shadows should be subtle. Prefer surface separation through whitespace and soft borders.

---

## 5. App shell

Canonical navigation follows the Product & UX spec:

```text
Today
Review
Plan
Explore
```

The supplied landing-page mock-up uses **Account** as the fourth tab. Treat that as visual reference, not canonical information architecture. If Account is required later, expose it from profile/settings or revisit the shell deliberately rather than silently replacing Explore.

### Today

Status and next action.

### Review

Weekly review inbox and review flow. This is the strongest tab.

### Plan

Monthly Kakeibo plan and envelopes.

### Explore

Spendings, insights, rules and journal.

---

## 6. Today screen

The Today screen is a calm status surface, not a dashboard wall.

Structure:

```text
date / greeting
month status card
review workload card
one Kei observation
primary review action
```

Example:

```text
Today
Thursday 28 May

May plan
£460 projected savings
£500 target
Slightly at risk

Weekly review
6 decisions
4 groups to check
52 look safe

Kei noticed
Wants is running fast, mostly from food delivery.

[Review this week]
```

Avoid pie charts, transaction feeds and multiple competing alerts.

---

## 7. Review tab

The Review tab should feel like a small inbox.

Header:

```text
Weekly Review
20 May — 26 May

6 decisions
4 groups to check
52 look safe
```

Use clear lanes:

```text
Decisions
Groups
Looks Safe
All
```

The user can jump between lanes, but Decisions is the recommended starting point.

Show progress without turning completion into gamification.

---

## 8. Decision card

Decision cards should feel focused, not form-like.

Layout:

```text
Decision 3 of 6

Amazon Marketplace
£24.99
Friday · Barclaycard

Why this needs a decision
Amazon has been used for different categories before.

Most likely
Wants / Shopping

[Accept]
Change · Split · Details
```

Use a single strong primary action and quiet secondary actions.

Use bottom sheets for category changes, details, split spending and rule creation.

Optional swipe gestures may accelerate accept or skip, but gestures must never be the only way to act.

---

## 9. Group check

Group checks should feel like approving a small coherent bundle.

Collapsed:

```text
Pret A Manger
4 spendings · £23.70
Wants / Eating out
Higher than usual this week
```

Expanded:

```text
Wed   £4.80
Thu   £6.20
Fri   £5.90
Sun   £6.80
```

Primary actions:

```text
Accept group
Change group
```

Secondary actions may include review individually and create rule.

---

## 10. Looks Safe

This screen exists to build trust in automation.

Show:

```text
52 spendings look safe

Examples
Tesco     3 · £64.20 · Needs / Groceries
TfL       5 · £38.40 · Needs / Transport
Spotify   1 · £10.99 · Culture / Subscription

Why safe
Matched rules or stable reviewed history.

[Confirm all]
Inspect list
```

Before confirming all, use a short bottom sheet that states how many spendings will be confirmed and that they remain editable.

After confirmation, show a lightweight undo toast.

---

## 11. All Spendings

This is the mobile equivalent of a weekly receipt.

Use:

```text
sticky day headers
compact spending rows
filter chips
short labels
bottom-sheet detail
```

Example:

```text
All · Flagged · Changed · By group

Monday · £42.10
Tesco       £28.40   Needs
TfL          £8.50   Needs
Pret         £5.20   Wants

Tuesday · £18.99
Spotify     £10.99   Culture   rule
Amazon       £8.00   Culture   changed
```

Avoid raw bank descriptions and spreadsheet columns by default.

---

## 12. Plan screen

The Plan screen should feel like setting an intention.

Top card:

```text
May Plan

Savings goal          £500
Flexible spending     £850
```

Keep fixed commitments visible but visually separate from the four flexible Kakeibo envelopes.

Envelope cards:

```text
Needs        £220 / £400
Wants        £126 / £200
Culture       £36 / £100
Unexpected    £30 / £150
```

Each card may show:

```text
limit
spent so far
remaining
plain-language status
```

Editing an envelope should show the trade-off immediately.

---

## 13. Explore

Explore should feel like a small library.

Use destination cards:

```text
Spendings
Search and inspect history

Insights
Understand patterns behind the month

Rules
See what Kakeido handles automatically

Journal
Revisit weekly and monthly reflections
```

Do not open Explore into raw transaction history.

---

## 14. Kei visual treatment

Kei may look friendly. Kei should not behave like a mascot.

Use the supplied Kei avatar as the visual direction:

- small rounded avatar;
- warm cream/peach treatment;
- orange antenna/details;
- restrained expression;
- no constant animation.

Kei appears only when the assistant is actually adding context.

Preferred presentation:

```text
[small Kei avatar]  Kei noticed
Wants is running fast, mostly from food delivery.
```

Avoid:

```text
large persistent mascot art
speech bubbles on every screen
celebration animations
multiple unsolicited assistant cards
assistant UI competing with the review
```

The avatar and label together identify assistant-authored content; colour alone should not carry that meaning.

---

## 15. Reusable components

```text
StatusCard
ReviewWorkloadCard
KeiNote
DecisionCard
GroupCheckCard
EnvelopeCard
InsightCard
SpendingRow
DayGroup
FilterChip
BottomSheet
PrimaryButton
SecondaryAction
ProgressPill
StatusLabel
UndoToast
```

Reusable components should preserve the same information hierarchy across Today, Review and Plan rather than create a generic card system with excessive variation.

---

## 16. Interaction feel

Use:

```text
bottom sheets for focused edits
inline expansion for detail
subtle haptic feedback on confirmation
small progress transitions
clear undo after bulk actions
```

Avoid:

```text
modal overload
confirmation for every small action
hidden swipe-only actions
heavy chart animation
celebratory gamification
```

The product should feel fast enough for one-handed review.

---

## 17. Accessibility

- Never communicate state with colour alone.
- Maintain platform-appropriate contrast.
- Support dynamic text sizes without hiding primary actions.
- Keep tap targets at least platform minimum size.
- Do not require swipe gestures.
- Ensure money values and state labels have accessible names.
- Respect reduced-motion preferences.

---

## 18. Acceptance criteria

The mobile design succeeds when:

- Today makes the next action obvious;
- Review feels like clearing a small inbox;
- decision cards can be resolved in seconds;
- grouped checks reduce repeated work;
- Looks Safe increases trust rather than hiding automation;
- the weekly scan remains calm at normal transaction volumes;
- Plan feels intentional rather than spreadsheet-like;
- Explore remains secondary and searchable;
- Kei feels recognisable but never dominates the app;
- the visual system matches the supplied Kakeido landing-page direction.

Core test:

> Can the user review a normal week mostly one-handed without opening a dense transaction table?

---

**Version:** 1.0  
**Date:** 2026-08-09  
**Status:** Implementation spec
