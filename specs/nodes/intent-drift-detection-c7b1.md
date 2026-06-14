---
id: intent-drift-detection-c7b1
type: intent
title: Detect drift between code changes and the spec graph
status: addressed
created: 2026-06-14
---

Add drift detection.

Schema migration first: node type `capability` (required: id, type, title,
status, paths[] — repo globs the capability owns); node type `drift-finding`
(required: id, type, title, status(open|resolved|accepted), body); edge
types `touches` (evidence → capability) and `flags`
(drift-finding → evidence | capability).

Command /detect-drift <pr-number|branch>:
get the diff; load specs/indexes/by-type.yaml; map changed files to
capability nodes via their paths globs; for each affected capability,
follow incoming edges to its contracts and briefs; answer ONE question —
does this diff change observable behaviour not represented in the linked
contract or brief? If yes: invoke graph-maintainer to create a
drift-finding node with flags edges and a body stating the behaviour,
where it diverges, and a suggested resolution
(update-spec | revert | accept-with-contract). If no: report 'no drift',
create nothing.

Script spec:check-diff: read a sensitive_paths list from
schema/validation-rules.yaml; if a PR diff touches a sensitive glob,
require a linked approved contract or an override node in the same PR;
exit non-zero otherwise.

Workflow drift-review.yml: run spec:check-diff and /detect-drift on every
PR, warn-only (annotate, never fail). Flip to blocking only after ~5 real
PRs with correct behaviour.

Acceptance: /detect-drift run on the two Phase 4 PRs produces a
drift-finding or an explicit 'no drift' for each.
