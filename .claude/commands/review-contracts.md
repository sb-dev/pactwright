---
description: Adversarially review candidate contracts for an intent — route critics by class and scope, then record one durable comparison
---
Input: intent node ID ($ARGUMENTS). Locate its candidate contracts via
specs/indexes/incoming.yaml (the `proposes` edges pointing at it), reading
only the named node files. Read the intent's `class`.

1. Route critics by `class` and the candidates' declared `## Scope` (CLAUDE.md
   "Critic routing" is the normative mapping):
   - Class 0–1: spec-critic only.
   - Class 2: spec-critic plus the specialists whose surface the candidates'
     scope touches — UI: ux-critic; payments or personal data:
     security-privacy-critic and compliance-risk-critic; schema or
     service-boundary: architecture-critic; testing: qa-test-critic; runtime or
     ops: reliability-ops-critic; cost or maintainability:
     cost-maintainability-critic; release or rollout: release-critic; product or
     value: product-critic. Take the union across candidates; when scope is
     ambiguous, route in more critics, never fewer.
   - Class 3: spec-critic plus the full panel (all nine), regardless of surface.
2. Invoke each routed critic as a real subagent (not an inline "act as"). Each
   appends one perspective-labelled `## Critique (<perspective>)` section per
   candidate, drafted for graph-maintainer to append verbatim.
3. Count-enumeration guard: confirm one perspective-labelled `## Critique` per
   routed critic exists on every candidate before going further (for a class-3
   panel, the nine specialist sections plus spec-critic). If any routed
   perspective is missing, stop and report which — never proceed with a silently
   dropped critic.
4. For a Class 2 or 3 market, invoke graph-maintainer to record exactly ONE
   `comparison` node — body sections: the candidate trade-off table, the critic
   findings grouped by perspective, and the case against each candidate — with one
   `compares` edge per live candidate (`comparison —compares→ contract`). If a
   `comparison` already covers this market, REPLACE it (regenerate its body and
   re-author its `compares` edges to the current live candidate set) rather than
   author a second; never leave two comparison nodes for one market. A class-0/1
   review records no comparison — there is no market to compare.
5. graph-maintainer then appends the critiques, writes (or replaces) the
   comparison, regenerates indexes, and validates; the mutating step ends with
   `pnpm spec:index && pnpm spec:validate` and nothing is committed on red.
6. End by summarising the critiques (and, for class 2+, the comparison) and
   asking for a human decision (`/approve-contract`). Do NOT select or rank the
   candidates.
