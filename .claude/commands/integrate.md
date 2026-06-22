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
Then invoke graph-maintainer to write/converge the node + edges, regenerate indexes,
and validate; commit only on green.
CLOSING REPORT: the integration ID, its draft/final status, which
`integration_sections` keys were written, lanes covered vs blocking, the verdict,
and the remediation step for any partial. Stop there.
