---
id: intent-work-class-routing-b9c4
type: intent
title: Add work-class routing and scope-integrity rules
status: open
created: 2026-06-16
---

Add work-class routing and scope-integrity rules.

Schema migration first: add required field `class` to node types intent
and contract — integer 0|1|2|3. Add optional field `produced_by` to every
node type (free text: the agent or human that authored the node body).
`produced_by` unset is always allowed and never a validation error — it is
provenance plumbing for future agent scorecards, not a gate.

Migration backfill (part of THIS change, not a later step): `class` is now
required on intent and contract, so every existing intent and contract node
— all Phase 1-5 nodes and this phase's own bootstrap nodes — must receive a
`class` in the same change. Making the field required while pre-existing
nodes lack it fails spec:validate across the whole graph. Default them to 2
(each was a meaningful change that went through the two-candidate proposal
market — the Class 2 signature); set a different class only where a specific
change clearly warrants it. `produced_by` is optional, so it needs no
backfill.

CLAUDE.md additions:

1. Work-class routing table. Every intent is classified at capture; its
   contracts inherit the class and may revise it with recorded rationale in
   the contract body.
     Class 0 — trivial mechanical change (typo, dependency bump, comment).
       May skip the proposal market: one contract, one brief, spec-critic
       only, no specialist critics, no patch market, no lanes.
     Class 1 — simple low-risk change on a single surface.
       One candidate contract and one brief permitted; spec-critic only;
       no patch market; no lanes.
     Class 2 — meaningful product or technical change.
       Proposal market required (>=2 candidate contracts); specialist
       critics where the change touches their surface; lanes optional;
       patch market optional per brief.
     Class 3 — high-risk or ambiguous change; anything touching security,
       privacy, compliance, payments, or production-sensitive paths;
       or any multi-surface change.
       Proposal market required; the full specialist critic panel required;
       lane decomposition required; patch market available per lane;
       explicit human gates at contract selection and again at integration.

2. Scope-integrity rules, applied whenever any review — contract, patch,
   or integration — reveals the approved contract or brief was wrong:
     - Brief boundary wrong, contract intact: supersede the brief with a
       corrected brief (supersedes edge). Never edit an approved brief in
       place.
     - Contract incomplete, intended behaviour unchanged: spawn a follow-up
       intent via /capture-intent for the missing scope. Do not widen the
       current contract silently.
     - Selected work changes the intended behaviour: stop and return to
       human approval. A new decision node is required before proceeding.
   No review may silently absorb scope drift. The graph must record why
   scope moved.

Command updates:
- /capture-intent sets `class`; if the prompt did not supply one, ask
  before creating the node.
- /propose-contracts reads the intent class: Class 0-1 may emit a single
  candidate contract; Class 2-3 must emit >=2 candidates.
- /write-brief and the later lane and patch commands read the contract
  class to decide whether lanes and the patch market apply.

Validation (extend spec:validate; no new workflow — spec-validate.yml
already runs it): `class` is present and in {0,1,2,3} on every intent and
every contract. A missing or out-of-range class is a validation failure.
`produced_by` is never validated. Because the rule covers the whole graph,
the backfill above ships in the same PR — spec-validate.yml runs on the PR,
and the phase is green only when validation passes over every node, not just
the new ones.

Acceptance: an intent captured without a class is rejected by
spec:validate; a Class 0 intent runs end to end through one contract and
one brief with no proposal market; a Class 3 intent cannot be approved
until at least two candidate contracts exist.
