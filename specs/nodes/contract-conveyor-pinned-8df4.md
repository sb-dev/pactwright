---
id: contract-conveyor-pinned-8df4
type: contract
title: Self-guiding delivery loop (pinned conveyor — declarative lifecycle table, drift-pinned)
status: rejected
created: 2026-07-27
class: 3
---

This intent (`intent-self-guiding-delivery-loop-6d79`, class 3) is multi-surface — schema, tooling,
tests, lifecycle commands, agents, CI, docs, and graph data — so it carries three candidates; this
is **C**. All three carry an identical common core: the lane catalog and its `.gitignore` negation;
the optional `owner` field; the seven implementer agents; the ten-way lane pin and lane market; the
`decompose-lanes.md` and `node-types.yaml` lane-list copies replaced by pointers; issue sync; gate
graduation; the `CLAUDE.md` conventions and mix-and-match reads; the navigation views inside
`INDEX_FILES`; the graph-data backfill; the docs refresh; four stale-file reconciliations — all
enumerated per surface in `## Scope`. They differ on one axis: **how the conveyor's next-command
knowledge is represented, and what keeps the command prints and `spec:status` from diverging.**
**C** takes the *pinned-data* position: routing is normative once, as a declarative table at
`specs/schema/lifecycle.yaml` that command prose and `spec:status` both read, with a drift test
pinning that table, the command blocks, and `CLAUDE.md`'s lifecycle to each other.

## Problem interpretation

The intent asks for one loop that drives itself: every lifecycle-chain command ends by printing the
next command with real IDs, and a read-only `spec:status` derives *the same* paste-ready command.
Two producers of one truth; the question is where the normative copy lives.

**C's answer:** `specs/schema/lifecycle.yaml` is normative for "which step is this, what runs next,
where does its ID come from" — beside `checks.yaml` and `sensitive_paths`, the precedent for
schema-directory data read by tooling and by no validation rule. `tools/status.ts` is its only
derivation; `spec:status`, `trails.md`, and `status.md` are consumers. Each chain command carries a
fenced ```yaml `conveyor:` block; `conveyor_pin.test.ts` pins block, table, and lifecycle.

**Five corrections to the intent, carried here rather than absorbed silently.**

1. **The catalog would be gitignored.** `.gitignore:10` is `.claude/*`, negated only for `agents/`
   and `commands/`; without a `!.claude/lanes/` negation the lane pin passes vacuously in CI.
2. **The conveyor count understates the surface.** Of fourteen chain commands eight are silent, two
   name a command with no ID, three print placeholders, one is type-wrong — **none meets the bar.**
3. **`/prepare-evidence` is not always terminal.** A multi-lane contract's last lane evidence is
   followed by `/integrate`; it is terminal only for a lone live brief, `/integrate` only at final.
4. **The intent budgets one schema touch; C spends two.** `owner` on `brief` is the normative one;
   `lifecycle.yaml` is non-normative tooling data in the same directory, read by `tools/` and by no
   validation rule, on the `checks.yaml` precedent. Declared here, not buried in a trade-off.
5. **Two grants the intent never names.** `contract-reviewer.md` gains `Bash` (today `Read, Grep`)
   for the `git diff` its patch-branch mode needs; read-only-fenced, `tools:` still excluding
   `Write`/`Edit`. And four traversal closures lift out of two live rule handlers into
   `coverage_traversal.ts` — required by construction: `spec:status` needs the same sibling-lane
   walk `coverage_coherence.ts` uses, and a second copy is the drift C exists to stop.

## Scope

1. **`specs/schema/lifecycle.yaml` (new).** Closed vocabularies `arg_sources` and `conditions`; a
   `steps:` list, each with `step`, `name`, and an **ordered `commands:` list** (step→command is
   one-to-many — step 5 is claimed by five commands); a `commands:` map, each entry declaring
   `step`, `terminal`, optional `pr_action`, `next: [{command, arg, arg_source, when}]`.
2. **`specs/schema/node-types.yaml`** — optional `owner` on `brief`; the inline lane-list comment
   (lines 23–26) replaced by a pointer to `.claude/lanes/`.
3. **`tools/loader.ts`** — an **optional** `lifecycle?: Lifecycle` on `LoadedSpec`, mirroring
   `checks`/`sensitivePaths`; optional so in-memory `LoadedSpec` test literals keep compiling.
4. **`tools/status.ts` (new)** — pure `deriveStatus(spec)` and `nextCommands(spec, intentId)`, plus
   correction 5's lift of four traversal closures into `coverage_traversal.ts`.
5. **`tools/spec.ts`** — a read-only `status` subcommand (optional `argv[3]` intent filter) in
   `SUBCOMMANDS` and `USAGE`; `USAGE`'s "the four files" line (`spec.ts:11`) corrected to six.
6. **`tools/indexer.ts`** — `INDEX_FILES` extended to six with `trails.md` and `status.md`, plus
   deterministic serializers; the single tuple puts both views under `indexes-fresh` for free.
7. **`tools/issuesync.ts` (new) + a `spec:issue-sync` script** — a standalone entry point, **not** a
   `spec.ts` subcommand: it has network side effects while that dispatch is read/validate. Shells
   `gh`/`gh api` GraphQL for sub-issues and blocked-by; marker `<!-- pactwright:node=<id> -->`.
8. **`.claude/lanes/` (new, eight files)** and **`.gitignore`** — the `!.claude/lanes/` negation.
9. **`.claude/agents/`** — seven implementers (`product-spec-writer`, `backend-implementer`,
   `ui-implementer`, `migration-implementer`, `api-implementer`, `ops-implementer`,
   `docs-implementer`) with `Read, Write, Edit, Bash`; `test-writer.md` gains `Bash`;
   `spec-writer.md` becomes class- and lane-aware (its "draft exactly one brief" line contradicts
   its caller); `contract-reviewer.md` gains a patch-branch mode plus correction 5's fenced `Bash`;
   `integration-reviewer.md` judges against the contract **and** its selecting decision.
10. **`.claude/commands/` — the conveyor.** A `conveyor:` block and a next-command closing print in
    all fourteen chain commands; `/select-patch`'s print fixed to `/prepare-evidence <brief-id>`;
    `/propose-contracts` names `/review-contracts` for class-2+; `/decompose-lanes` gains the lane
    market, wave plan, and best-effort sync call, its inline lane list (`decompose-lanes.md:9-10`)
    becoming a catalog pointer; `/implement-brief` rewritten (its "delegates to no agent" clause
    blocks owner routing); `write-brief.md`'s "class 0–2 keep a single brief" line fixed.
11. **`.claude/commands/` — attention and amendments.** `review-contracts.md` step 5's "appends the
    critiques" instruction replaced by the one-line-per-axis verdict pointer; the pinned comparison-
    and decision-body shapes written into `review-contracts.md`, `compare-patches.md`,
    `approve-contract.md`, `select-patch.md`; `/write-brief` and `/decompose-lanes` carry the
    decision's amendments into the briefs; `detect-drift.md` judges against contract + decision.
12. **`tests/`** — `conveyor_pin.test.ts` (new); `lane_catalog_drift.test.ts` extended to the
    ten-way pin, **retaining** its hardcoded eight-lane `deepEqual` (lines 44–53) as the anchor;
    `lane_enum.test.ts`'s `LANES` folded into that equality; `spec.test.ts`'s hardcoded
    `INDEX_FILES` (`:12`) and usage string (`:228`); the five index-bearing fixtures, three
    `expected-errors.txt`, `status.ts` units.
13. **`.github/workflows/`** — `drift-review.yml` loses `continue-on-error: true` on the
    sensitive-paths step (renamed; the now-false header at lines 3–9 rewritten; the drift-map step
    stays warn-only); `issue-sync.yml` (new), on merge to `main` and dispatch.
14. **Docs** — `CLAUDE.md` (conveyor, per-step lifecycle annotations, class-2+ review step, lane
    market, output-attention, mix-and-match, sole-writer rule, override recipe, `/detect-drift`
    pointer, Structure block listing `checks.yaml` + `lifecycle.yaml`); `branch-protection.md:13`
    four→five; the false warn-only text at `docs/drift-detection.md:32-39`; `README.md` ≤40 lines
    from `docs/research-logs/07-27-2026-readme.md`; `CONTRIBUTING.md` pointed at `/capture-intent`,
    its five dangling `SPEC.md` refs (§11, §13×2, §16×2; `SPEC.md` has only §1–§5) removed and two
    mis-described (§4, §5) corrected — declared, not absorbed.
15. **Graph data** — the missing `touches` edges for `evidence-work-class-routing-f0a3` and
    `evidence-critics-literal-panel-e2a7`, one per capability each phase's **merged diff actually
    fell under** (expected five each — lifecycle-commands, spec-docs, spec-schema, spec-tests,
    spec-tooling — confirmed against the diffs, not assumed); **two** follow-up intents (the
    malformed-cutoff reversal of `decision-critics-literal-panel-9c4f`, malformed case only, and
    `/write-tests` on unlaned briefs); the PR #4 `/detect-drift` verdict; a durable dated
    authorization artifact recording `.gitignore` and root config intentionally unowned, on the
    `decision-graph-data-unowned-2f7b` precedent; `capability-lifecycle-commands-4f5a` gains
    `.claude/lanes/**`; `capability-spec-docs-8c1d` gains `SPEC.md`, `README.md`, `CONTRIBUTING.md`.

## Out of scope

1. **No validation rule and no edge-type work.** `lifecycle.yaml` is pinned by a test, never by
   `spec:validate`; `owner` is unvalidated (like `produced_by`); malformed-cutoff → Phase 10 Step 0.
2. **No branch-protection API application.** Applying the five required checks, and the live
   two-strategy market and override-expiry exercise, is Step 2 — human-driven, out-of-diff.
3. **No issues → graph direction and no project board.** One way only; board items are Phase 10.
4. **No widening of `/write-tests` to unlaned briefs.** It refuses any brief not laned
   `test-verification`, so `/write-brief` cannot print it; that gap is Scope 15's rule-5 follow-up
   intent. **Interim behaviour, stated because silence would mislead:** `/write-brief`'s class-1+
   print names `/implement-brief` then `/prepare-evidence`, with the explicit line that independent
   verification is unavailable on an unlaned brief — a gap, never an exemption.
5. **`/detect-drift` and `/update-spec-graph` carry no `conveyor:` block** — not chain steps; the
   reading under which the intent's "eight silent commands" holds. Both files are still edited.
6. **No re-authoring of the SPEC v3.1 delta and no root-map edit.** All four amendments landed in
   PR #15 (`docs/research-logs/07-12-2026-delivery-graph.md:3, 242, 263, 365, 539, 749`), build
   order included; root `SPEC.md` has only §1–§5 and its §4 is a documents table, not a phase list.
7. **No new capability for `specs/{nodes,graph,indexes}/**` or root config.** Those paths and the
   `.gitignore` edit are resolved by Scope 15's authorization artifact — `/prepare-evidence`'s third
   sanctioned branch, a durable dated record, not a note in an evidence body.
8. **No fixture-tree or historical-node edits.** Frozen fixture lane lists stay independent worlds.
9. **The conveyor prints; it never executes.** No auto-invocation, no `spec:status` write path.

## Behaviour

1. **Vocabularies, and what a command prints.** `arg_source` is `argument`, `created-node`,
   `edge:<edge-type>` (traversal), `human-choice` (the operator picks — the conveyor prints the
   candidate set, never a winner), or `none`. `when` is `always`, `class-le-1`, `class-ge-2`,
   `class-3`, `unlaned`, `siblings-outstanding`, `last-lane`, `draft`, `final`, `strategy-tension`.
   Both are pinned as closed sets. Each report ends with the paste-ready next command(s), IDs
   substituted from that command's own entry; terminal entries print `pr_action` instead. **A print
   must satisfy the standing rules for the change's class — a recommendation is never an
   exemption**, and never names a command whose preconditions the graph does not meet.
2. **Hops by `arg_source`.** Four are edge-resolved: `review-contracts → approve-contract`
   (`edge:proposes`), `select-patch → prepare-evidence` (`edge:competes-for`, the winner's brief),
   `prepare-evidence → integrate` (`edge:decomposes`), the sibling-lane check. One is
   `human-choice`: `compare-patches → select-patch` — `competes-for` resolves the live *candidate
   list*, one line each, the winner staying a placeholder **by design**, since that command ends
   "Do NOT select or rank the candidates" and printing one patch id would rank.
3. **The three commands the intent details.** `/review-contracts` ends with a decision block — one
   line per candidate (verdict, strongest objection), the plausible grafts from each non-base
   candidate, and a paste-ready `/approve-contract <base-id> '<amendment notes>'` per plausible
   base; full critiques stay in the comparison. `/approve-contract` prints `/write-brief` or
   `/decompose-lanes` with the contract id, matching approved scope against the catalog's `## Owns`
   lines — **always** `/decompose-lanes` for class 3. `/decompose-lanes` runs the market per lane,
   writes `owner` plus a rationale, carries the decision's amendments into each brief, and prints
   waves ordered by `## Dependency hints` (overridable, optional cap), each lane line carrying
   owner, issue link, and command.
4. **`spec:status`** reads the same table through `tools/status.ts` and prints, per live intent, its
   stage and the identical next command; `trails.md` (per intent: contracts, comparison, decision,
   laned briefs with owners, evidence, integration) and `status.md` (open work) share that path.
5. **The conveyor pin** asserts: (a) every `commands:` key resolves to `.claude/commands/<key>.md`
   and every chain command has a key; (b) each command's block deep-equals its table entry;
   (c) **set-equality per step** — each step's `commands:` list equals the set of entries whose
   `step` is that step, and `steps:` order matches `CLAUDE.md`'s lifecycle, now annotated per step
   with the class-2+ review step; (d) all tokens resolve; (e) terminals carry `pr_action`, no next.
6. **The lane pin becomes ten-way** (each equal source a leg — seven assertions, ten legs):
   1. `.claude/lanes/` filenames, the `CLAUDE.md` table, `brief-lane-valid` keys, and
      `lane_enum.test.ts`'s `LANES` are all equal and in order (four legs).
   2. Every `eligible_agents` / `default_agent` resolves to `.claude/agents/<name>.md`.
   3. `default_agent` is a member of its own file's `eligible_agents`.
   4. `test-verification`'s `eligible_agents` equals `["test-writer"]` exactly.
   5. Each catalog file is well-typed: both frontmatter keys, both sections.
   6. Each `## Owns` body line is byte-equal to its `CLAUDE.md` table cell.
   7. The `## Dependency hints` graph is acyclic.
7. **Issue sync and the PR #4 verdict.** One issue per lane brief; one parent per multi-lane
   contract carrying them as sub-issues plus the wave plan's blocked-by relations, all writes
   marker-scoped. `/detect-drift 4` runs here as a `drift-finding` + `flags` edge or "no drift".

## Trade-offs

1. **+ One normative source; drift pinned, not eliminated.** The table is normative and the fourteen
   `conveyor:` blocks are pinned replicas, so prose, `spec:status`, and the views cannot *silently*
   disagree — a red test, unlike A's review-only reconciliation and B's single runtime source. And
   nothing couples at runtime: a command prints from its own file even with `tools/` broken.
2. **+ It is the technique this repo has already chosen twice.** The `brief-lane-valid` keys pin and
   the `integration_sections` fenced-yaml pin are the same shape — C adds no new idea, only a third
   instance. Adding a lifecycle step is a data edit the pin polices.
3. **− The pin proves agreement, not runtime behaviour.** It asserts table, blocks, and `CLAUDE.md`
   agree; it does **not** prove any agent substituted a real resolved ID at run time, so "any
   hand-assembled ID is a defect" stays **review-only** under C — the axis's real cost.
4. **− Fifteen copies, and the pin reads only the block.** Every routing change edits the table and
   one block; a partial edit is a red build, not a silent divergence — trade-off 1's cost side. The
   pin reads the fenced block, not the prose above it, so contradicting prose still passes.
5. **− A new data format to design, document, and test.** Vocabularies, condition semantics, and
   loader shape are net-new — the least schema-like data in `specs/schema/`.
6. **− It stretches `specs/schema/`'s charter.** That directory constrains "what nodes and edges may
   exist"; `lifecycle.yaml` constrains neither, so C corrects the Structure block. Rejected:
   `.claude/lifecycle.yaml` (gitignored — the `.claude/lanes/` trap) and `tools/lifecycle.ts`.

## Acceptance

1. **End-to-end by paste only.** A real change runs the chain with every ID taken from a printed
   command, including the `/select-patch` → `/prepare-evidence` hop, which prints the brief id
   resolved through the winner's `competes-for` edge. *Review-only under C — see trade-off 3.*
2. **Conveyor pin fires. (Machine-checked.)** `conveyor_pin.test.ts` fails on: a table entry without
   its block, a block without the table, a step whose `commands:` list differs from the entries
   claiming it, a lifecycle out of step order, a command with no file, an unresolvable `edge:` type.
3. **One derivation. (Machine-checked.)** `spec:status <intent-id>` and the corresponding command's
   report yield the identical next command for one graph state — one code path, asserted by a unit
   test feeding a single in-memory `LoadedSpec` to both.
4. **Lane pin fires, and the catalog reaches CI. (Machine-checked.)** Editing one catalog file's
   lane without `CLAUDE.md` fails the drift test; so does naming an agent no `.claude/agents/` file
   provides, a `default_agent` outside `eligible_agents`, `test-verification` gaining a second
   eligible agent, or a `## Dependency hints` cycle. A further leg fails on an empty catalog dir.
5. **Lane market and issues match the wave plan.** Decomposition yields one brief per lane, each
   carrying an `owner` chosen from its catalog file with a rationale and the decision's amendments,
   plus lane issues and a parent whose sub-issues and blocked-by relations match the printed plan;
   with no graph change the sync is a no-op; a hand-closed unfinished lane issue reopens next sync,
   and a `final` evidence closes it.
6. **Views answer the question.** `spec:status` and `trails.md` state where an intent stands and
   what runs next without reading `edges.yaml`; both regenerate byte-identically and sit inside
   `INDEX_FILES`, so a stale view reds `spec:validate`, not only `spec-index`.
7. **Gates graduated.** `drift-review.yml` carries no `continue-on-error` on the sensitive-paths
   step; `branch-protection.md` reads "these five checks"; the PR #4 verdict is a durable record.
8. **Self-application.** Touching `specs/schema/**` fires the now-blocking `check-diff` gate here,
   passing only once the schema lane's evidence and its `touches` edge land in the same diff.
9. **Own conventions honoured.** Prose hard-wraps at 100 columns; binding items are numbered lists;
   findings live only in the comparison, which opens with its verdict table; the body is ≤250 lines.

## Risks

1. **The `when` vocabulary under-models reality.** `siblings-outstanding` and `last-lane` are
   graph-state predicates; too coarse a vocabulary makes the table a lie the pin certifies.
   **Mitigation:** the vocabulary is closed and pinned, each token has one implementation in
   `tools/status.ts`, and a unit test exercises each — an unimplemented token reds the suite.
2. **Pin brittleness across fourteen files** is fourteen chances for a false red. **Mitigation:**
   parsed YAML, not scraped prose; the failure names command, key, and both values.
3. **`lifecycle.yaml` is not validated.** A malformed table reds `pnpm test`, not `spec:validate` —
   weaker than every other schema-directory file. **Mitigation:** state the bound; Phase 10 Step 0.
4. **The `INDEX_FILES` widening and `status` break four pinned copies:** three bad fixtures'
   `expected-errors.txt`, `spec.test.ts:12`'s hardcoded `INDEX_FILES`, `spec.test.ts:228`'s usage
   string, and `tools/spec.ts:11`'s "the four files" line inside it. **Mitigation:** commit views
   into all five fixtures, import `INDEX_FILES` rather than copy it, widen `runCli`.
5. **Nine agents gain `Bash`** — the seven implementers, `test-writer`, and `contract-reviewer` —
   where `graph-maintainer` is the sole holder today. **Mitigation:** each implementer body restates
   its lane's owned paths as a write fence, a "no graph writes" clause, and the rule-5 stop clause;
   `test-writer`'s `tests/`-only fence is restated against Bash-mediated writes; `contract-reviewer`
   is read-only-fenced — read-only `git` on a candidate branch, no `Write`/`Edit`, no checkout.
6. **The sibling-lane traversal is the only new walk, and the easiest to get status-blind.**
   **Mitigation:** it reuses the lifted `coverage_traversal.ts` helpers (superseded-excluding,
   `final`-requiring); a parity test asserts it and `coverage_coherence.ts` agree.
7. **Issue sync writes to a live external system;** a bug could mass-close real issues.
   **Mitigation:** every write is marker-scoped, the workflow non-blocking, local runs dry.
8. **`/detect-drift 4` may surface real drift.** It maps a Phase-4 diff against capabilities seeded
   one PR later, non-deterministically. **Mitigation:** rule 5 — record it, capture a follow-up.

## Critique (spec)

Concern. Pinned table's static terminal field contradicts its own conditional-terminality
correction; Acceptance 3's machine-check has no second code path to compare. Full finding, with
evidence, in `comparison-conveyor-market-890e`.

## Critique (product)

Concern. Highest design cost of the three, lands at A's guarantee on the acceptance it cites;
Acceptance 3 cannot fail. Full finding in `comparison-conveyor-market-890e`.

## Critique (ux)

Concern. No stated precedence between fenced block and contradicting prose, and the pinned unlaned
route walks the operator past verification with only a caveat. Full finding in
`comparison-conveyor-market-890e`.

## Critique (architecture)

Concern. `specs/schema/` placement drags every future routing edit under the sensitive-paths gate;
the rejected `.claude/` alternative is fixed by C's own negation line. Full finding in
`comparison-conveyor-market-890e`.

## Critique (security-privacy)

Concern. Risk 7's "local runs dry" contradicts the local best-effort sync, voiding the stated
mitigation for mass-closing real issues. Full finding in `comparison-conveyor-market-890e`.

## Critique (compliance-risk)

Concern. `lifecycle.yaml` under `specs/schema/**` silently routes every future routing edit through
the sensitive-paths gate and CODEOWNERS, unrecorded. Full finding in
`comparison-conveyor-market-890e`.

## Critique (qa-test)

Concern. Acceptance 3's "machine-checked" single derivation cannot exist as described, and optional
`lifecycle` lets new unit tests pass vacuously. Full finding in `comparison-conveyor-market-890e`.

## Critique (reliability-ops)

Concern. Optional lifecycle load fails open silently, the pin never reads the prose agents follow,
and it edits live coverage-coherence handlers. Full finding in
`comparison-conveyor-market-890e`.

## Critique (cost-maintainability)

Concern. Routing data lands inside `sensitive_paths`, so every future routing edit needs a contract
or override; the pin covers the block, not the prose. Full finding in
`comparison-conveyor-market-890e`.

## Critique (release)

Concern. Routing under `specs/schema/` makes every future routing edit trip C's own newly-blocking
`check-diff` gate and CODEOWNERS review; cost unweighed. Full finding in
`comparison-conveyor-market-890e`.
