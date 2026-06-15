---
description: Detect drift between a PR/branch diff and the linked spec graph
---
Input: $ARGUMENTS is a single `<pr-number|branch>`. Resolve it to a base ref
DETERMINISTICALLY, map the diff with the tool, then judge it yourself. This
command does the judging; it never maps files with an LLM (the tool does that),
and it delegates only graph WRITES to graph-maintainer.

1. Resolve the diff base:
   - a branch name → `git merge-base origin/HEAD <branch>`;
   - a PR number   → `gh pr view <n> --json baseRefOid -q .baseRefOid`.
   Export it as `GATE_BASE` and run `pnpm spec:drift-map` to get the drift
   packets and the `uncovered` list (deterministic file→capability mapping,
   no judgment).

2. For each packet whose `linkState` is `linked`, answer ONE question against the
   packet's contract/brief bodies: does this diff change OBSERVABLE BEHAVIOUR not
   represented in the linked contract or brief? "Observable behaviour" = a change
   a consumer could detect WITHOUT reading the diff — public CLI subcommands /
   flags / exit codes, emitted file contents or formats, schema or edge rules
   enforced, generated-index shape, workflow triggers or required checks,
   documented behaviour. An internal refactor with identical outputs is NOT drift.

3. Then run ONE holistic cross-capability pass over ALL packets together: does the
   change drift ACROSS capabilities (a change in one capability breaking another
   capability's linked contract's assumptions) even if each looked clean alone?

4. Report `unlinked` packets and `uncovered` files explicitly — they are coverage
   holes, not silently "no drift".

5. If drift is found (per-capability or cross-capability), invoke graph-maintainer
   to create a `drift-finding` node (status `open`; body states the changed
   behaviour, where it diverges from the linked contract/brief, and a suggested
   resolution: `update-spec | revert | accept-with-contract`) plus `flags` edges
   to the affected capability and to the touching evidence. If there is no drift,
   report 'no drift' and create nothing.

End by reporting, per affected capability, a drift-finding id or 'no drift', plus
any unlinked/uncovered coverage holes. Do not modify code; graph writes go only
through graph-maintainer.
