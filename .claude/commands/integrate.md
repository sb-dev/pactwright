---
description: Combine a multi-lane contract's per-lane evidence into one final integration node
---
Input: contract node ID ($ARGUMENTS). Locate it via specs/indexes/ and confirm an
inbound `selects` edge; stop if it was never selected.
SINGLE-BRIEF NO-OP: if the contract decomposes into one (unlaned) brief, print
"this contract is single-brief; its lone final evidence completes it — no
integration node needed" and exit.
IDEMPOTENT / RE-ENTRANT: operate on a clean tree. If a `draft` (partial) integration
already exists for the contract, CONVERGE it (adopt-and-complete its edge set) —
never author a second integration node. Abort with no commit on a dirty tree or a
non-green validate.
Invoke integration-reviewer over the FINAL per-lane evidence; create exactly one
`integration` node with one `integrates` edge per lane's FINAL evidence and the
seven `integration_sections` keys (canonical vocabulary:
.claude/agents/integration-reviewer.md). Write ONLY `integrates` edges, NOT
`touches` — those are authored from each lane's evidence by /prepare-evidence;
/integrate VERIFIES touches coverage (a sensitive-path change must touch its owning
capability). REFUSE `final` until every section key is present AND every live lane
is at final evidence: a partial stays `draft`; when a lane (e.g. the
test-verification lane) is not yet final, keep the draft and name the blocking lane
in the closing report.
Then invoke graph-maintainer to write/converge the node + edges.

ECHO BEFORE MUTATING: print the integration's intended id, every lane's final
evidence id its `integrates` edges will point at, and the lanes still blocking, so
the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <contract-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the verdict and the
covered-versus-blocking summary belong around it, never inside it.
CLOSING REPORT: the integration ID, its draft/final status, which
`integration_sections` keys were written, lanes covered vs blocking, the verdict,
and the remediation step for any partial. Stop there.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /prepare-evidence <brief-id>
  for each blocking lane, or the PR action when coverage is complete.
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
