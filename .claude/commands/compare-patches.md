---
description: Review a brief's live candidate patches and record one durable comparison — six-axis scoring, reviewer + drift findings; never selects
---
Input: brief node id ($ARGUMENTS). Locate the brief via specs/indexes/, then its
live (non-superseded) candidate patches via the brief's `competes-for` incomings in
specs/indexes/incoming.yaml, reading only the named patch node files.
PRECONDITION (graph-maintainer enforces at validate): depends on the data-migration
lane's widened `compares.target` (`[contract, patch]`) so `comparison —compares→
patch` validates.

1. For EACH live candidate branch (the patch node's `branch`):
   - Run `contract-reviewer` (judgement-only; it writes nothing — graph-maintainer
     records) over the branch to summarise the candidate and its consequences.
   - Run `/detect-drift <patch-branch>` to obtain that branch's observable-behaviour
     drift verdict (a `drift-finding` or 'no drift').
2. Then invoke graph-maintainer to author exactly ONE `comparison` node for the
   market — body sections: a candidate trade-off table SCORING each patch on the six
   axes (contract fit, scope control, simplicity, test quality, drift risk, rollback
   safety); the reviewer and drift findings grouped per candidate; and the case
   against each candidate — with one `compares` edge per live candidate patch
   (`comparison —compares→ patch`). If a `comparison` already covers this market,
   REPLACE it (regenerate its body and re-author its `compares` edges to the current
   live candidate set) rather than author a second; never leave two comparison nodes
   for one market. Then regenerate indexes and validate (`pnpm spec:index && pnpm
   spec:validate`); nothing is committed on red.
CLOSING REPORT: the comparison id, the patch ids it `compares`, each candidate's
six-axis line, the `patch-comparison` check named by its exact literal as the gate
the operator must clear (the `waives → patch-comparison` override is the sanctioned
escape), and the next command `/select-patch <winner> "<rationale>"`. End by asking
for a HUMAN DECISION. Do NOT select or rank the candidates. Stop there.
