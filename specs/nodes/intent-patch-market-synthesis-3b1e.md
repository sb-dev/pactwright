---
id: intent-patch-market-synthesis-3b1e
type: intent
title: Add the lane-aware patch market and synthesis
status: addressed
created: 2026-06-24
class: 3
---
Add the lane-aware patch market and synthesis.

Schema migration first:
- Add node type `patch` (required: id, type, title,
  status(candidate|selected|superseded), branch, strategy, created;
  requires_body for the evidence summary).
- Add edge type `competes-for`: patch -> brief.
- Add edge type `synthesizes`: patch -> patch (a synthesis patch points at
  each candidate patch it combines).
- Extend edge type `compares` to also allow comparison -> patch (it already
  allows comparison -> contract).
- `selects` already allows decision -> patch; use it here.
- Add optional brief frontmatter flag patch_market: true.

New commands:
- /propose-patches <brief-id> <n> <strategy-list>: the brief must be a lane
  brief or a single brief. For each strategy, create branch
  patch/<brief-slug>/<strategy>, run the implementation agent with the brief
  PLUS an injected strategy directive, open a draft PR, create a patch node
  (branch, strategy, evidence summary) with a competes-for edge, and set
  patch_market: true on the brief.
- /compare-patches <brief-id>: for each candidate branch run
  contract-reviewer and /detect-drift; invoke graph-maintainer to create a
  comparison node scoring contract fit, scope control, simplicity, test
  quality, drift risk, rollback safety, with compares edges to each
  candidate patch; end by asking for a human decision. Never select.
- /synthesize-patches <brief-id> <patch-id-list> <instruction>: create a
  synthesis patch (status candidate) on branch patch/<brief-slug>/synthesis,
  combining the named patches per the human instruction; add synthesizes
  edges to each parent patch and a competes-for edge to the brief; carry an
  evidence summary. A synthesis patch competes for the SAME lane brief as
  its parents — across-lane combination is integration (Phase 8), not
  synthesis.
- /select-patch <patch-id> <rationale>: create a decision node with a
  selects edge to the winner; set losing patches (including the parents of
  a selected synthesis patch) to superseded, close their draft PRs, keep
  their branches; the winner's branch proceeds to /prepare-evidence. Apply
  the scope-integrity rules: if comparison exposed that the contract or
  brief was wrong, supersede the brief, spawn a follow-up intent, or return
  to human approval rather than widening scope inside the winner.

CLAUDE.md additions:
- The patch market runs per lane brief; patches compete within one lane;
  patch comparison judges that lane in isolation; cross-lane fit is judged
  at integration, never in patch comparison.
- Patch market by class: Class 0-1 a single patch, no market; Class 2
  optional per brief; Class 3 available per lane.
- Within-lane synthesis is a synthesis patch with synthesizes edges;
  across-lane combination is integration.
- Patch review carries the scope-integrity rules from Phase 6.

Validation and enforcement:
- New workflow patch-comparison.yml: if a brief has more than one
  competes-for edge, merging its implementation PR requires a comparison
  node comparing those patches and a selects decision in the graph; fail
  otherwise; overridable via an override node.
- Extend spec:validate: a selected patch's brief must have a comparison node
  covering its competing patches; a synthesis patch must carry synthesizes
  edges to at least two parent patches.

Acceptance: one real lane brief runs two candidate patches through
/compare-patches and human /select-patch, fully traced; a /synthesize-patches
run produces a selected synthesis patch with synthesizes edges to two
parents now superseded; a multi-patch brief whose PR skips the comparison
node is blocked by patch-comparison.yml.
