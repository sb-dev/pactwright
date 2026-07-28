---
id: intent-self-guiding-delivery-loop-6d79
type: intent
title: Make the delivery loop self-guiding, lane execution visible, and the graph readable
status: open
created: 2026-07-27
class: 3
---
Make the delivery loop self-guiding, lane execution
visible, and the graph readable: conveyor closing reports, a lane-agent
market, issue-tracked lanes, navigation views, and essential-first output
conventions. Origin: the post-Phase-9 full review (findings report in
drafts/, 2026-07-05).

No required-field or validation-rule migration: an issue is linked to its
node by an HTML-comment node-id marker in the issue body, never by node
frontmatter — the graph never references the view. Validation-rule and
edge-type work from the review lands in Phase 10 Step 0, not here. The one
schema touch is declared below: the optional owner field on brief, which
needs no backfill or cutoff (standing rule 10).

Lane market: one catalog file per lane at .claude/lanes/<lane>.md with
frontmatter eligible_agents (the agents that may own the lane) and
default_agent, plus sections Owns (mirrors the CLAUDE.md lane table) and
Dependency hints (lanes that typically block this one). /decompose-lanes
runs the market per named lane: it weighs that lane's eligible agents
against the brief scope, picks default_agent unless it states a reason,
records the winner as owner frontmatter on the lane brief with a one-line
rationale in the body, and shows the pairing in the wave plan. Declare
`owner` as an optional field on node type brief in node-types.yaml in this
PR — optional, so no backfill and no cutoff per standing rule 10.
test-verification stays owned by test-writer via /write-tests; the seven
other lanes get implementer agents as new markdown files
(product-spec-writer, backend-implementer, ui-implementer,
migration-implementer, api-implementer, ops-implementer,
docs-implementer) invoked by /implement-brief per the brief's owner
field. The drift test becomes a six-way pin: the .claude/lanes/ filename
set, the CLAUDE.md table, and the brief-lane-valid keys stay equal;
every eligible or default agent resolves to an existing
.claude/agents/<name>.md; default_agent is a member of eligible_agents;
and test-verification's eligible_agents equals [test-writer] exactly —
the separation-of-duties invariant pinned mechanically, not by prose.
The prose copies of the lane list
(decompose-lanes.md, node-types.yaml comments) are replaced by pointers
to the catalog. Extend the lifecycle-commands capability to own
.claude/lanes/** in the same PR.

Conveyor: every lifecycle-chain command's closing report ends with the
paste-ready next command(s), real IDs filled in; terminal steps
(last-lane /prepare-evidence, /integrate) print the PR action instead.
Eight commands currently end with no print and one prints a type-wrong
handoff — fix /select-patch to print /prepare-evidence <brief-id> (the
brief resolved via the winner's competes-for edge, the branch kept as
context) and /propose-contracts to name /review-contracts for class-2+
intents. The conveyor prints; it never executes. A printed command must
satisfy the standing rules for the change's class — a recommendation is
never an exemption.
- /review-contracts ends with a decision block — one line per candidate
  (verdict, strongest objection), the plausible grafts from each non-base
  candidate, and a paste-ready /approve-contract <base-id> '<amendment
  notes>' template per plausible base.
- /approve-contract ends with /write-brief <contract-id> or
  /decompose-lanes <contract-id> '<lanes>', recommended by matching the
  approved scope against the lane catalog; for a class-3 contract the
  print is always /decompose-lanes (standing rule 5 — lanes are not
  optional there).
- /decompose-lanes ends with a wave plan: numbered waves of lanes
  runnable in parallel (catalog hints plus per-decomposition overrides;
  an optional cap limits wave size), each lane line carrying its owner
  agent, issue link, and paste-ready command (/implement-brief,
  /write-tests, or /propose-patches where strategy tension warrants a
  market).
A read-only spec:status subcommand derives, per live intent, the
lifecycle stage and the same paste-ready next command, so the journey
survives a lost chat session; Phase 10's project-sync reuses its
derivation.

Stale-file reconciliation, same PR: write-brief.md says class 2 may lane
via /decompose-lanes (it currently contradicts CLAUDE.md); spec-writer.md
becomes class- and lane-aware; contract-reviewer.md gains its
patch-branch mode (it is invoked per patch by /compare-patches but
written only for contract selection); test-writer gets the Bash grant its
run-and-confirm instruction assumes.

Issue sync: script spec:issue-sync, one direction (graph to issues) via
the gh CLI — one issue per lane brief; one parent issue per multi-lane
contract with the lane issues as native sub-issues; native blocked-by
relations from the wave plan (neither has first-class gh commands — the
sync uses gh api GraphQL mutations). Idempotent via the marker: with no
graph change a re-run changes nothing; hand-edits, including a
hand-closed unfinished lane, are corrected on the next sync. A lane issue
closes when its brief's evidence goes final; the parent closes at final
integration. /decompose-lanes invokes the script best-effort; workflow
issue-sync.yml reconciles on merge to main and manual dispatch; a sync
failure warns, never blocks. Prepares Phase 10: board items for lane
briefs will BE these issues.

Gate graduation, in this change: flip drift-review.yml's spec:check-diff
step from warn to blocking — its five-real-PR graduation criterion is met
— correct docs/branch-protection.md's 'These four checks' miscount to
five, and durably record the deferred PR #4 /detect-drift verdict in the
graph. These are repo-file and graph changes, so they ride this traced PR;
only the branch-protection API application itself is out-of-diff (Step 2).

Output-attention conventions (CLAUDE.md addition): the reader's attention
is the budget. Critic findings live only in the comparison node —
/review-contracts writes a one-line-per-axis verdict pointer into each
candidate instead of full critique sections, and contract bodies stay
pure spec (target 250 lines or fewer). Node prose hard-wraps at 100
columns; binding amendments and fixes are numbered markdown lists, never
inline enumerations. Comparison bodies open with a verdict table of at
most 10 rows with cells of at most 15 words, shared-core prose outside
the table (exemplar: comparison-patch-market-synthesis-7b1d). Decision
bodies pin the decision-patch-market-ci-gate-8a2f shape: SELECTED and
REJECTED lead line, amendments as a numbered list, at most 120 lines,
closing next-step print. Guidance, not gates — no length validation.

Navigation views: spec:index additionally emits trails.md (one section
per intent: its contracts, comparison, decision, briefs with lanes and
owners, evidence, integration — each as id, title, status) and status.md
(the open-work view: open intents, approved-but-unbriefed contracts,
unimplemented briefs, draft evidence and integration), so the graph is
followable without tooling.

Mix-and-match approval (CLAUDE.md addition): a decision body's
amendments — base candidate, grafts from named siblings, mandatory
fixes — are binding; the effective contract is the approved contract plus
its selecting decision's amendments. /write-brief and /decompose-lanes
carry the amendments into the briefs, and every review judged against the
approved contract — contract-reviewer, integration-reviewer, and drift
review included — reads the contract and its selecting decision together.
An amendment changing intended behaviour returns to human approval
(scope-integrity rule 5); the approved contract body is never edited.
This formalizes the decision-patch-market-ci-gate-8a2f precedent.

CLAUDE.md completeness (SPEC section 13): the numbered lifecycle gains
the review-and-comparison step (class 2+) and every step is annotated
with its command — the static map the conveyor's runtime prints
instantiate; add the graph-maintainer sole-writer rule, the override
recording recipe (reason, approved_by, expires, a waives edge to a named
check), and a pointer to /detect-drift.

Graph-data backfill (edges are data, not schema): add the missing
touches edges for evidence-work-class-routing-f0a3 and
evidence-critics-literal-panel-e2a7 so the capability map covers Phases
6-7; capture the malformed-cutoff follow-up intent deferred from PR #10
(a present-but-malformed cutoff must red the graph, reversing decision
9c4f's fail-open for the malformed case only) for Phase 10 Step 0 to
implement.

Docs: record a SPEC v3.1 delta — binding amendments in the
proposal-market section, issues-as-view in the Projects section, the
lane market and this phase in the build order, and the SPEC section 11
role mapping (the Code Archaeologist and Decomposer roles folded into
commands). SPEC section 7 already permits merging parts of candidates;
the delta formalizes its mechanics. Refresh README.md: true status, a
one-screen chain quickstart, a setup block, 40 lines or fewer; point
CONTRIBUTING.md at /capture-intent. Extend the spec-docs capability to
own SPEC.md, README.md, and CONTRIBUTING.md in the same PR.

Acceptance: a real change runs end to end by pasting only each closing
report's printed command — any hand-assembled ID is a defect, including
the select-patch to prepare-evidence hop; decomposing a multi-lane
contract yields lane issues plus a parent whose sub-issues and blocked-by
relations match the printed wave plan, each lane brief carrying an owner
the market chose from its catalog file; with no graph change
spec:issue-sync is a no-op, and a hand-closed unfinished lane issue is
reopened by the next sync; final evidence closes the lane issue on the
next sync; editing one catalog file's lane without CLAUDE.md fails the
drift test, and naming an agent no .claude/agents/ file provides fails it
too; spec:status and trails.md answer where an intent stands and what
runs next without reading edges.yaml; this phase's own market comparison
opens with its verdict table.
