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
2. Invoke each routed critic as a real subagent (not an inline "act as").
   - CLASS 2+: each critic produces ONE VERDICT-POINTER LINE per candidate — a
     verdict word, one sentence naming its strongest finding, and a pointer to the
     comparison node that holds the full finding. The full analysis lives in the
     comparison, never on the candidate body. The on-disk exemplar is the ten
     `## Critique (<axis>)` sections of `contract-conveyor-derived-4c8c`: two or
     three lines each, verdict then finding then pointer.
   - CLASS 0–1: the critique stays a perspective-labelled section on the candidate
     body, because a class-0/1 review records no comparison and the finding would
     otherwise have nowhere to live.
3. Count-enumeration guard: confirm ONE VERDICT POINTER per routed critic exists for
   every candidate before going further (for a class-3 panel, the nine specialists
   plus spec-critic). For class 0–1, confirm the critique section instead. If any
   routed perspective is missing, stop and report which — never proceed with a
   silently dropped critic. A perspective that found nothing records an explicit
   "no concern on this axis"; silence is never read as a clean bill.
4. For a Class 2 or 3 market, invoke graph-maintainer to record exactly ONE
   `comparison` node — body per the COMPARISON BODY TEMPLATE below — with one
   `compares` edge per live candidate (`comparison —compares→ contract`). If a
   `comparison` already covers this market, REPLACE it (regenerate its body and
   re-author its `compares` edges to the current live candidate set) rather than
   author a second; never leave two comparison nodes for one market. A comparison is
   never superseded by selection. A class-0/1 review records no comparison — there is
   no market to compare.
5. graph-maintainer then writes (or replaces) the comparison and, for class 0–1 only,
   the candidate-body critiques.

COMPARISON BODY TEMPLATE (a prose convention for graph-maintainer, NOT a validation
rule — no rule reads a comparison body): `## Candidate trade-off table`, one row per
axis the candidates actually differ on; `## Critic findings by perspective`, one
`### <perspective>` per routed critic carrying an axis verdict and its numbered
findings; and `## The case against each candidate`, one `### <candidate>` each.
On-disk exemplars to match: `comparison-patch-market-synthesis-7b1d` and
`comparison-conveyor-market-890e`.

ECHO BEFORE MUTATING: print the comparison's intended id and every candidate id its
`compares` edges will point at, so the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
DECISION BLOCK (judgement content this command owns, printed ABOVE the NEXT block):
per candidate, a verdict, the strongest objection against it, and the plausible
grafts a selection could take from each non-base candidate. This is what a human
reads before choosing; the templates below are what they run afterwards.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <intent-id>` and reproduce
its NEXT block verbatim — one `/approve-contract <base-id> '<amendments>'` template
per live candidate. "Verbatim" binds the block only; the decision block above belongs
around it, never inside it. Do NOT select or rank the candidates.
CLOSING REPORT: the comparison id, every candidate id it compares, and every routed
perspective.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /approve-contract <contract-id> '<amendments>'
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
