---
id: contract-conveyor-prose-f6fe
type: contract
title: Self-guiding delivery loop (prose conveyor — each command owns its closing print)
status: rejected
created: 2026-07-27
class: 3
---

`intent-self-guiding-delivery-loop-6d79` (class 3) is multi-surface — fifteen of the sixteen command
files, seven new agent files, eight new lane-catalog files, `tools/`, `tests/`, two workflows,
`.gitignore`, one optional schema field, graph data, `CLAUDE.md` and five root/`docs/` files — so it
carries a three-candidate market; this is candidate **A** of three. All three share an identical
common core, enumerated below, and differ on exactly one axis: **how the conveyor's next-command
knowledge is represented, and what keeps the command prints and `spec:status` from diverging.**
**A** takes the prose path: the routing truth is written **once per command, in that command's own
markdown**, and `spec:status` derives the same answer **independently** in TypeScript. There is no
shared routing artifact and no new graph data; the two expressions are reconciled by the annotated
lifecycle in `CLAUDE.md`, by code review, and by the intent's end-to-end acceptance run.

## Problem interpretation

The loop stops at every step: the operator reconstructs the next command by hand from `edges.yaml`.
Lanes have no owners, lane execution is invisible, the graph is unnavigable without tooling, and the
review left stale files, two ungraduated gates and two unlinked evidences. The common core:

1. **Lane catalog** — eight `.claude/lanes/<lane>.md` files (`eligible_agents`, `default_agent`,
   `## Owns`, `## Dependency hints`); `decompose-lanes.md` and `node-types.yaml` become pointers.
2. **`.gitignore` negation** — line 10 is `.claude/*`, negated only for `!.claude/agents/` and
   `!.claude/commands/`; without `!.claude/lanes/` the catalog never reaches the repo and the drift
   pin passes vacuously in CI. Unnamed by the intent, carried as a discovered precondition.
3. **Optional `owner` on `brief`**; **seven new implementer agents**; the **ten-leg drift pin** —
   the review's six legs, `lane_enum.test.ts`'s `LANES`, well-typedness, acyclicity, anti-vacuity.
4. **`spec:issue-sync` + `issue-sync.yml`** — graph to issues only, marker-idempotent, best-effort,
   never blocking; **navigation views** `trails.md` and `status.md`.
5. **Gate graduation** — the `drift-review.yml` warn → blocking flip, the `branch-protection.md`
   miscount, the PR #4 `/detect-drift` verdict; the **backfill**; two follow-up intents.
6. **`CLAUDE.md`, docs, capabilities, stale files** — output-attention conventions *and their
   command-file mechanics*, binding amendments *and the reviews that read them*, lifecycle
   completeness; SPEC delta, README, CONTRIBUTING; two capability extensions; four stale files.

What distinguishes **A**: the conveyor is **prose only** — each chain command carries its own
closing-print instruction written against the annotated lifecycle, and `spec:status` is a second,
independent derivation. A declines a shared routing artifact; the routing truth exists twice.

## Scope

1. **`.claude/commands/` — the conveyor surface is exactly fourteen lifecycle-chain files**:
   `capture-intent`, `propose-contracts`, `review-contracts`, `approve-contract`, `write-brief`,
   `decompose-lanes`, `implement-brief`, `write-tests`, `propose-patches`, `synthesize-patches`,
   `compare-patches`, `select-patch`, `prepare-evidence`, `integrate` — each gains or amends a
   `CLOSING REPORT` paragraph naming the paste-ready next command(s). Beyond the print:
   1. `implement-brief.md` is **rewritten**: "delegates to no agent" contradicts owner routing.
   2. `write-brief.md` states class 2 may lane and may open a patch market, and carries the
      selecting decision's amendments into the brief it writes.
   3. `decompose-lanes.md` replaces its inline eight-lane enumeration with a catalog pointer, runs
      the lane market, carries the decision's amendments into every lane brief, and invokes
      `spec:issue-sync` best-effort.
   4. `review-contracts.md` step 5 stops appending `## Critique` sections to candidates: findings
      go to the `comparison` node only, each candidate getting a one-line-per-axis verdict pointer.
   5. `review-contracts.md`, `compare-patches.md`, `approve-contract.md` and `select-patch.md`
      carry the pinned body shapes — comparison: a ≤10-row verdict table of ≤15-word cells;
      decision: the `decision-patch-market-ci-gate-8a2f` shape.
   6. `detect-drift.md` reads an approved contract **and** its selecting decision together.
2. **`.claude/lanes/`** — eight new catalog files; **`.gitignore`** gains `!.claude/lanes/`.
3. **`.claude/agents/`** — seven new implementers (`product-spec-writer`, `backend-implementer`,
   `ui-implementer`, `migration-implementer`, `api-implementer`, `ops-implementer`,
   `docs-implementer`); `spec-writer.md` becomes class- and lane-aware; `contract-reviewer.md` gains
   its patch-branch mode; `test-writer.md` gains `Bash` with its write-fence restated against
   Bash-mediated writes; `integration-reviewer.md` reads contract and selecting decision together.
   **Declared correction (rule 5):** the intent grants `Bash` only to `test-writer`, but a
   patch-branch review and seven implementers cannot run without it — nine hold it after, named.
4. **`specs/schema/node-types.yaml`** — optional `owner` on `brief`; the lane comment becomes a
   catalog pointer. This is the change's only schema touch.
5. **`tools/`, `package.json`** — `spec.ts` gains one subcommand, `status` (`SUBCOMMANDS`, `USAGE`,
   a dispatch branch, `process.argv[3]` as an optional intent-id filter). New `status.ts` holds a
   pure `deriveStatus(spec)` returning each live intent's stage and next command, consumed by
   `spec:status`, `status.md` and Phase 10; it reuses the already-exported walks in
   `tools/handlers/coverage_traversal.ts` **read-only** — no validation-rule handler is modified.
   `issue-sync` is deliberately **not** a `spec.ts` subcommand: a standalone `tools/issue_sync.ts`
   keeps network side effects out of the read-only `spec` dispatch, holding a pure
   `planIssueSync(spec, existingIssues)` plus a thin `gh` shell. `indexer.ts` widens `INDEX_FILES`
   from four to six (`trails.md`, `status.md`) with a deterministic markdown serializer, putting
   the views under the existing `indexes-fresh` invariant; `package.json` gains the two scripts.
6. **`tests/`** — the ten-leg lane pin in `lane_catalog_drift.test.ts` with `lane_enum.test.ts`'s
   `LANES` folded in; the conveyor presence pin; unit tests for `deriveStatus`, the serializers and
   `planIssueSync`; in `spec.test.ts` the widened `runCli`, the usage-string assertion and its local
   `INDEX_FILES`; and the three fixture `expected-errors.txt` files plus every fixture index tree.
7. **`.github/workflows/`** — `drift-review.yml`: the flip, its step name and header comment;
   `issue-sync.yml`: new, on merge to `main` and manual dispatch.
8. **`CLAUDE.md`** — output-attention conventions, mix-and-match approval, the annotated lifecycle
   with the class-2+ review-and-comparison step, the graph-maintainer sole-writer rule, the override
   recording recipe, a `/detect-drift` pointer and the lane-catalog pointer.
9. **Docs** — `docs/branch-protection.md` (four → five), `docs/drift-detection.md` (its now-false
   warn-only section), the SPEC v3.1 delta (**verify-only**: the four amendments appear already
   landed, so the docs lane confirms each and re-authors nothing), `README.md` (≤40 lines, drawing
   on the drafted `docs/research-logs/07-27-2026-readme.md` cut to true status), `CONTRIBUTING.md`.
10. **Graph data** — the two backfill `touches` edge sets for `evidence-work-class-routing-f0a3` and
    `evidence-critics-literal-panel-e2a7` (capability set determined by those merged diffs; expected
    five each); the PR #4 `/detect-drift` verdict; `.claude/lanes/**` onto
    `capability-lifecycle-commands-4f5a` and `SPEC.md`/`README.md`/`CONTRIBUTING.md` onto
    `capability-spec-docs-8c1d`; **two** follow-up `intent` nodes (malformed-cutoff,
    `/write-tests`-on-unlaned-briefs); and one dated authorization node recording `.gitignore`
    intentionally unowned, on the `decision-graph-data-unowned-2f7b` precedent.

## Out of scope

1. **All validation-rule and edge-type work — Phase 10 Step 0.** No new rule, no widened edge type,
   no required-field migration. The malformed-cutoff work is **captured as an intent only**; its
   implementation (reversing `decision-critics-literal-panel-9c4f`'s fail-open for the malformed
   case) is Phase 10's. **No rule reads `owner`**: like `produced_by`, it is unvalidated.
2. **Branch-protection API application (Step 2)**, with Step 2's live market and override-expiry
   exercise. `drift-review` is not required, so the flip reds the job without blocking a merge.
3. **Issue → graph direction.** The graph never references an issue: no frontmatter field, no edge.
4. **`/write-tests` is not widened to unlaned briefs.** It refuses any brief whose `lane` is not
   `test-verification`; widening that precondition changes intended behaviour, so per rule 5 it is a
   follow-up intent captured in this PR. **Interim clause:** for a class-≥1 unlaned brief,
   `/write-brief` prints `/implement-brief <brief-id>` **and** a second, explicitly BLOCKED
   `/write-tests <brief-id>` line citing the precondition mismatch and that intent — so the chain
   never silently routes an operator past independent verification.
5. **`detect-drift.md` and `update-spec-graph.md` get no conveyor print** — neither is a chain step
   (`detect-drift.md` is still edited, per Scope 1.6); the silent bucket is then ten, not eight.
6. **`tests/fixtures/**` schema trees are not pinned to the live catalog**; **no root `SPEC.md`
   re-sectioning, no v3.2 bump, no Phase 10 board sync**; **no historical body edits** (rule 3).
7. **`specs/{nodes,graph,indexes}/**` stays intentionally unowned**, per the standing record in
   `prepare-evidence.md`, so the generated views raise no coverage gap.

## Behaviour

1. All fourteen chain commands end with a `CLOSING REPORT` naming the paste-ready next command(s).
   **The conveyor prints; it never executes.** **A recommendation is never an exemption** — a print
   obeys the standing rules for the class, so a class-3 approval prints `/decompose-lanes`.
2. **No unsubstituted ID placeholder.** A printed line carries no `<...>` token for an identifier
   the command already holds; only unknowable arguments (a winner not yet chosen, free-text
   rationale) stay templated and visibly marked. Two commands are instances today:
   1. `propose-patches.md` prints `<brief-id>` with the brief id in hand.
   2. `synthesize-patches.md` prints `<brief-id>` with the brief id in hand.
   `compare-patches.md` is **not** one — it prints `<winner>`, a human choice it does not hold.
3. **Per-command prints.** `/select-patch` prints `/prepare-evidence <brief-id>`, the brief resolved
   through the winner's `competes-for` edge (today it prints the branch; `/prepare-evidence` takes a
   node id). `/review-contracts` ends with one line per candidate — verdict, strongest objection —
   the grafts from each non-base candidate, and an `/approve-contract <base-id> '<amendments>'` line
   per plausible base. `/compare-patches` prints one `/select-patch <patch-id> "<rationale>"` line
   per live competitor, enumerating and never ranking. `/decompose-lanes` ends with a wave plan:
   numbered parallel waves from catalog hints plus overrides and an optional cap, each lane line
   naming its owner agent, issue link and command.
4. **Terminal prints.** `/prepare-evidence` prints the PR action on an unlaned brief; on a laned
   brief, the outstanding sibling lanes' commands, or `/integrate <contract-id>` when it is the last
   lane to reach final evidence. `/integrate` prints the PR action when final, the blocking lane's
   command plus a re-run when draft. The intent calls last-lane `/prepare-evidence` terminal; the
   documented chain says otherwise, and this contract pins the correction. Resolving siblings is the
   **one new traversal** (`decomposes` then `evidences` incomings), read from `incoming.yaml`.
5. `spec:status [<intent-id>]` prints, per live intent, its stage and the same paste-ready next
   command, derived independently by `deriveStatus(spec)`. Read-only, no git or network I/O.
6. `trails.md` carries one section per intent (contracts, comparison, decision, briefs with lane and
   owner, evidence, integration — each as id, title, status); `status.md` the open-work view. Both
   are byte-deterministic (fixed order, `compareStrings`, no dates) and inside `INDEX_FILES`.
7. `/decompose-lanes` weighs each named lane's `eligible_agents` against the brief scope, picks
   `default_agent` unless it states a reason, writes `owner` plus a one-line rationale into the lane
   brief, and shows the pairing in the wave plan; `/implement-brief` invokes `owner`. Decomposition
   is required here (class 3) and includes a `test-verification` lane.
8. `spec:issue-sync` creates one issue per lane brief and one parent per multi-lane contract, lanes
   as native sub-issues with blocked-by relations from the wave plan, via `gh api` GraphQL. A re-run
   on an unchanged graph changes nothing; hand-edits, including a hand-closed lane, are corrected
   next sync; a lane issue closes on final evidence, the parent at final integration.
9. The `drift-review.yml` flip deletes one `continue-on-error: true` line, with the step name,
   header comment and `docs/drift-detection.md`'s warn-only section rewritten so the repo does not
   self-contradict. `/detect-drift 4` is **run** here and its verdict recorded durably — a
   `drift-finding` node with `flags` edges, else a dated "no drift" statement in the lane evidence.
10. **The effective contract is the approved contract plus its selecting decision's amendments.**
    `/write-brief` and `/decompose-lanes` carry them into the briefs; every review judged against an
    approved contract — `contract-reviewer`, `integration-reviewer`, `/detect-drift` — reads the
    contract and its `selects` decision together. An amendment changing intended behaviour returns
    to human approval; the approved contract body is never edited.
11. **Critic findings live only in the `comparison` node.** `/review-contracts` writes a
    one-line-per-axis verdict pointer into each candidate instead of critique sections; the
    comparison and decision body shapes above are what the four market commands instruct.

## Trade-offs

1. **+ Cheapest of the three** — no new abstraction, no new data surface, no schema beyond the
   optional `owner`; the conveyor is fourteen prose edits against a map `CLAUDE.md` must carry.
2. **+ Most idiomatic.** Every command here is a prompt, not a program; a closing-print instruction
   is the same kind of artifact as the rest of the file. A machine-readable routing table consumed
   by a markdown prompt is a kind of artifact this repo does not have.
3. **+ No runtime coupling in the print path.** A command prints its next step **without executing
   `tools/`**. The bound: the one graph-derived branch (Behaviour 4) reads the generated
   `incoming.yaml`, so a stale index can still mislead it.
4. **− The routing truth exists twice, and nothing fails when the two diverge.** Command prose and
   `deriveStatus` can drift silently — the drift class this repo pins elsewhere (the lane catalog,
   the integration section keys). Phase 10's project-sync reuses `deriveStatus`, so it propagates.
5. **− Nothing mechanically prevents a hallucinated or type-wrong ID** — the defect class the
   acceptance names. `/select-patch` is the proof: its prose names "the brief id" one line above the
   line that prints the branch. A fixes that instance, not the class.
6. **− Adding a lifecycle step later means editing N files with no test that catches a miss** — how
   eight commands stayed silent for nine phases; the presence pin catches only a total miss.
7. **− The headline acceptance is verified by a one-time human run, not by CI.**

## Acceptance

Machine-checkable in this PR:

1. Editing one catalog file's lane without `CLAUDE.md`, or naming an agent no
   `.claude/agents/<name>.md` provides, fails `tests/lane_catalog_drift.test.ts`.
2. Per catalog file: `default_agent ∈ eligible_agents`; both frontmatter keys and both body sections
   present and well-typed; `## Owns` byte-equal to the `CLAUDE.md` cell; `## Dependency hints` names
   only catalog lanes and is acyclic; `test-verification`'s `eligible_agents` equals
   `["test-writer"]`; `lane_enum.test.ts`'s `LANES` equals the rule keys (the seventh source).
3. The catalog directory holds exactly eight committed files — which fails if the `.gitignore`
   negation is missing, so pins 1–2 cannot pass vacuously in CI.
4. Every `brief` carrying `owner` names an agent in its lane's `eligible_agents`.
5. Each of the fourteen chain command files contains a `CLOSING REPORT` naming at least one
   `/`-command. **Honest bound: presence only** — not that the command is right or its ids real.
6. `deriveStatus` unit tests cover each stage boundary (unlaned vs laned, last lane vs siblings
   outstanding, open market, draft vs final integration); `planIssueSync` tests cover the no-op
   re-run, the reopen of a hand-closed lane, and the closes on final evidence and integration.
7. `spec:status` and `spec:index` are byte-deterministic; `indexes-fresh` covers `trails.md` and
   `status.md`, so `pnpm spec:validate` reds on a stale view; `spec:validate` and `spec:gate` are
   green on the post-change graph, including the new `touches` edges and the two extended capability
   `paths`, with no unowned path left open.

Review-only, recorded in the integration body:

8. A real change runs end to end by pasting only each closing report's printed command, with no
   hand-assembled ID — including the `/select-patch` → `/prepare-evidence` hop. **Under A this stays
   human-verified**, and that is the price of the axis.
9. Decomposing a multi-lane contract yields lane issues plus a parent whose live sub-issues and
   blocked-by relations match the wave plan; `spec:status` and `trails.md` answer where an intent
   stands and what runs next without reading `edges.yaml`.
10. This phase's own comparison opens with its verdict table and node bodies observe the
    output-attention conventions; the command-file half (Scope 1.4–1.5) is reviewed as an
    instruction change.

## Risks

1. **Two-expression divergence — A's defining risk.** Mitigation: state the convention once in
   `CLAUDE.md` and have every command reference rather than re-word it; write both the prose and
   `deriveStatus` against the annotated lifecycle; make the presence pin required. That makes
   divergence *reviewable*, never *failing*, and the selector should weigh whether that suffices.
2. **A stale or absent `specs/indexes/incoming.yaml` misleads the one graph-derived print**
   (Behaviour 4). Mitigation: the print names the index it read; `indexes-fresh` reds a stale tree.
3. **The `.gitignore` negation is silently load-bearing.** Miss it and the catalog never reaches CI
   and the pins pass over an empty directory. Mitigation: acceptance 3 fails closed.
4. **The blocking `check-diff` flip self-applies to this PR.** This diff touches
   `specs/schema/node-types.yaml`, a sensitive path, so the PR is red until the `data-migration`
   lane's evidence and its `touches → capability-spec-schema-2c3d` edge land in the same diff.
   `/detect-drift 4`'s verdict is likewise unknown in advance — rule 5 governs a genuine finding.
5. **Pinned-assertion and fixture breakage.** `tests/spec.test.ts` asserts the exact `usage: spec
   <index|validate|gate|check-diff|patch-gate|drift-map>` line, `runCli` accepts one subcommand, and
   it holds its own four-entry `INDEX_FILES`; widening `INDEX_FILES` also churns every fixture index
   tree and three `expected-errors.txt` files. A leaked timestamp or unstable sort would flap
   `spec-index.yml`'s `git diff --exit-code` — mitigated by no dates and a re-run byte comparison.
6. **Nine agents gain `Bash`** (seven implementers, `contract-reviewer`, `test-writer`), only one of
   which the intent names; the sharpest case is `contract-reviewer` running `git` against arbitrary
   patch branches. Mitigation: Scope 3 declares it; each grant is the minimum its instruction needs.
7. **`implement-brief.md`'s "delegates to no agent" clause blocks owner routing**, and `gh` has no
   first-class sub-issue or blocked-by command. Mitigations: the clause is an explicit rewrite in
   Scope; the sync planner is pure and unit-tested, its `gh` shell thin and never blocking; a
   dependency-hint cycle is caught by acceptance 2's acyclicity assertion.

## Critique (spec)

Concern. Prose conveyor is coherent, but its coverage-walk reuse claim is false and its stated
divergence mitigation contradicts its own fourteen-paragraph scope. Full finding, with evidence,
in `comparison-conveyor-market-890e`.

## Critique (product)

Concern. Builds `deriveStatus` then bars the print path from calling it: pays for routing twice,
guarantees neither, while claiming cheapest. Full finding in `comparison-conveyor-market-890e`.

## Critique (ux)

Concern. Prose/derivation disagreement has no stated tiebreak, and the BLOCKED `/write-tests` line
is paste-shaped with no recoverable action named. Full finding in
`comparison-conveyor-market-890e`.

## Critique (architecture)

Concern. Routing exists twice over two different representations, and the index A's one
graph-derived print reads carries no status field. Full finding in
`comparison-conveyor-market-890e`.

## Critique (security-privacy)

Concern. Nine Bash grants declared but unfenced in Scope, and prose routing leaves no chokepoint to
reject a hostile id. Full finding in `comparison-conveyor-market-890e`.

## Critique (compliance-risk)

Concern. Presence-only print check leaves class-3 lane and verification obligations unverified, and
two independent next-step records make the audit trail ambiguous. Full finding in
`comparison-conveyor-market-890e`.

## Critique (qa-test)

Concern. Presence-only pin, Behaviour 2's no-placeholder invariant left unchecked, and Scope 5's
read-only-reuse claim is false against the repo. Full finding in
`comparison-conveyor-market-890e`.

## Critique (reliability-ops)

Concern. Silent two-expression divergence has no detector and unbounded MTTD; a cheap
print-versus-`deriveStatus` identity test would close it without a new artifact. Full finding in
`comparison-conveyor-market-890e`.

## Critique (cost-maintainability)

Concern. Fourteen prose copies plus a second TypeScript derivation, pinned only for presence;
adding a lifecycle step in six months drifts silently. Full finding in
`comparison-conveyor-market-890e`.

## Critique (release)

Concern. Routing hotfixes stay cheap on non-sensitive paths, but no gate ever reds a conveyor
regression and acceptance 4 can break CI irreparably. Full finding in
`comparison-conveyor-market-890e`.
