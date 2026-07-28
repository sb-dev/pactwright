---
id: comparison-conveyor-market-890e
type: comparison
title: "Self-guiding delivery loop market: prose (A) vs derived (B) vs pinned (C) conveyor"
created: 2026-07-28
---
## Candidate trade-off table

| Axis | A — prose | B — derived | C — pinned |
|---|---|---|---|
| **Where routing truth lives** | Each command's own markdown, fourteen files | One pure resolver, `tools/conveyor.ts` | Declarative table, `specs/schema/lifecycle.yaml` |
| **Routing copies to keep in sync** | Sixteen: fourteen prints, `deriveStatus`, CLAUDE.md | One producer; the per-command instruction is routing-invariant | About thirty: table, fourteen blocks, fourteen prose prints, CLAUDE.md |
| **What machine-checks a print** | Presence only — the file names some `/`-command | Nothing on the command surface; the resolver is unit-tested | Fenced block deep-equals the table; the prose above is unread |
| **Cost of adding a lifecycle step** | Edit N files; no test catches a miss | One resolver edit; zero command-file edits | Table edit plus one block; a partial edit reds `ci` |
| **Failure mode when routing is wrong** | Silent divergence, unbounded time-to-detect | Missing step, not wrong step; fails quiet in `status.md` | Red build across fifteen files; blocks every merge |
| **Degraded mode, `tools/` broken** | Prints survive; one hop reads `incoming.yaml` | Prints and both views die with `loadSpec()` | Prints survive from each command's own file |
| **Future routing edit's merge cost** | Ordinary PR; `.claude/commands/**` is not sensitive | Ordinary PR; `tools/**` is not sensitive | Contract or override, plus code-owner review, forever |
| **Paste-only acceptance enforcement** | Review-only, one human run | Prose-enforced transcription over a unit-tested resolver | Review-only, one human run |
| **Net-new artifact** | None | One module plus a `CONVEYOR_CLASS_ROUTING` literal | New data format, two closed vocabularies, loader field |
| **Sharpest unresolved defect** | Divergence mitigation contradicts A's own fourteen-file Scope | No rule emits `/prepare-evidence` after implementation | Acceptance 3's machine-check has no second code path |

All three ship an **identical common core**: the eight-file lane catalog at `.claude/lanes/` plus
its `.gitignore` negation (`.gitignore:10-12`), the optional `owner` field on `brief`, seven
implementer agents, a ten-leg lane drift pin, `spec:issue-sync` + `issue-sync.yml`, the
`drift-review.yml` warn-to-blocking flip, the `trails.md` and `status.md` views inside
`INDEX_FILES`, the CLAUDE.md output-attention and mix-and-match conventions, the graph-data
backfill, the docs refresh, and four stale-file reconciliations. They differ on **exactly one
axis**: *how the conveyor's next-command knowledge is represented, and what keeps the command
closing-prints and `spec:status` from diverging.* A writes routing once per command in its own
markdown and derives the same answer independently in TypeScript; B makes one pure resolver the sole
producer and every print a call to it; C makes routing declarative data that prose and `spec:status`
both read, pinned by a drift test.

Ten perspectives were routed (the full class-3 panel plus spec-critic). **All ten returned
findings**; none returned a clean bill, and none was silent. Where a perspective recorded an
explicit "no concern" on a sub-axis, that is stated in its subsection rather than omitted.

## Critic findings by perspective

### spec

**Axis verdict.** Only graph-derived routing is unit-testable, yet `CLAUDE.md:71` makes
implementation a step with no graph write; A and C key the print on the command.

1. A — "already exported" is false: those walks are private (`coverage_coherence.ts:68-102`).
2. B — step 5 writes no graph state; `nextSteps` reprints `/implement-brief` (`4c8c.md:148-151`).
3. B — Scope 2 keeps the private walks it calls exported (`4c8c.md:47-49`); lift or drop it.
4. C — Acceptance 3 is "machine-checked" with no second code path (`8df4.md:212-214`).

Minor: 5 minor findings not carried; six shared defects → common-core 1, 12, 13, 15.

### architecture

**Axis verdict.** The axis decides which capability owns a routing change and which way the
`.claude/` ↔ `tools/` dependency points: C gates every later edit, B inverts the layers.

1. B — pins six prose columns on a seven-token precedent (`lane_integration_meta.test.ts:16-28`).
2. C — the sole `sensitive_paths` glob gates every later routing edit (`checkdiff.ts:63-147`).
3. C — parameterless `when` tokens make a new condition five edits, not data (`8df4.md:236-239`).

Minor: 3 minor; A's status-less `incoming.yaml` hop → case against A; INDEX_FILES → common-core 8.

### security & privacy

**Axis verdict.** C's table falls under `sensitive_paths`, so a routing edit is gated while B's
module and A's files change silently. **Explicit no-concern:** everything else — grants, `gh` write
path, issue export — is byte-identical.

1. B — no Risks entry for the change's largest privilege expansion (`4c8c.md:246-258`).
2. C — Risk 7's "local runs dry" is void against Scope 10's sync call (`8df4.md:256-257`).
3. All three — the gate covers `specs/schema/**`, so new `.claude/**` grants trip nothing.
4. All three, credit — pinning `test-verification` to `["test-writer"]` is machine-checked SoD.

Minor: 3 minor; A's nine unfenced grants and the shared sync defects → common-core 2–6.

### compliance & regulatory-risk

**Axis verdict.** The axis decides whether a print's class-routing content — a de-facto control, no
rule enforcing "class 3 must decompose into lanes" — is machine-checked at all. **Explicit
no-concern:** on issues-as-view auditability, the PR-4 verdict and amendments, none differs.

1. A — the print is the only class-3 control and is checked for presence alone (`f6fe.md:212-213`).
2. B — nothing proves the resolver ran (`4c8c.md:180-184`); stamp the block with a digest.
3. C — after its graduation every routing edit needs a contract or waiver (`.github/CODEOWNERS:2`).

Minor: 9 minor findings not carried; five shared audit defects → common-core 4(c) and 10.

### user experience

**Axis verdict.** A makes the operator reconcile two surfaces it admits can disagree, B has the
strongest explanation affordances but one runtime path, C ships two representations.

1. A — no precedence when print and `spec:status` disagree (`f6fe.md:190-191`); declare one.
2. A — the BLOCKED `/write-tests` line is paste-shaped and dead-ends (`write-tests.md:4-6`).
3. B — a no-market brief never reaches `/prepare-evidence`; the conveyor loops (`4c8c.md:148-160`).
4. C — nothing says whether block or prose binds the agent (`8df4.md:78-83`).

Minor: 3 minor findings not carried; four shared defects → common-core 1 and 11.

### testability & verification

**Axis verdict.** None converts the headline acceptance into a red test, and all say so; A guards
the line with a presence regex, C mislabels equality as machine-checked.

1. A — Behaviour 2's invariant and Acceptance 4 miss the machine-checkable list (`f6fe.md:135-138`).
2. A, credit — the only `planIssueSync` seam plus sync unit tests (`f6fe.md:80-82`).
3. B — no pin over the command surface, so a print-less command reds nothing (`4c8c.md:84-91`).
4. B and C — issue-sync idempotence has no oracle (`4c8c.md:226-228`).

Minor: 5 minor; C's vacuous-pass `lifecycle?` → case against C; oracle gaps → common-core 9, 12.

### reliability & ops

**Axis verdict.** A drifts silently, B concentrates the conveyor into one runtime dependency, C
fails loudest; the axis leaves the sync's failure modes untouched and identical.

1. A — divergence is "reviewable, never failing": time-to-detect is unbounded (`f6fe.md:237-239`).
2. B — a hand-typed `NEXT` block is indistinguishable from a resolved one (`4c8c.md:181-184`).
3. C — the table fails **open**, unlike the precedent it cites (`references_resolve.ts:16`).
4. C — edits the live handler gating this change's own completion (`8df4.md:47-50`).

Minor: 8 minor findings not carried; six shared defects → common-core 3–7.

### cost & maintainability

**Axis verdict.** A is cheapest to write and dearest to change; B pays a new module and a runtime
coupling of fifteen prompt files; C parks routing inside the newly blocking glob.

1. B — the drift surface goes, the per-run fidelity surface stays (`4c8c.md:179-184`).
2. C — the pin covers the block the agent does not read (`select-patch.md:40`; `8df4.md:195-197`).
3. C, credit — the only candidate repairing the stale CLAUDE.md Structure block.

Minor: 8 minor; A's sixteen routing copies → case against A; unpinned fences → common-core 2.

### release & rollout

**Axis verdict.** Two things move: the cost of a post-merge fix (an ordinary PR under A and B,
contract-gated forever under C), and degraded mode (A and C survive a broken loader, B does not).
**Explicit no-concern:** `owner` needs no backfill, self-application is identical, acceptance one
human run.

1. A — Acceptance 4 asserts over live graph data: retiring an agent reds `ci` (`f6fe.md:211`).
2. A, credit — cheapest remediation path, though its rule-5 residual is uncaptured (`f6fe.md:103`).
3. B and C — byte-identity asserted, never time-invariance; a dated cell freezes CI (`4c8c.md:233`).
4. All three — self-application assumes a single-PR topology none states (`checkdiff.ts:66-147`).

Minor: 4 minor findings not carried; four more shared defects → common-core 3, 9, 10(b), 12.

### product & value

**Axis verdict.** A and C leave ID substitution to an agent reading markdown — the control that let
`select-patch.md:40` print a branch where `prepare-evidence.md:4` needs a brief id — while B moves
it into code, its last hop still prose-enforced.

1. A — the proof defect is one prose adjacency already failed to prevent (`select-patch.md:5-6`).
2. B — the resolver removes recall of IDs, not compliance with running it (`4c8c.md:180-184`).
3. All three — prints are hostage to issue sync; the collapse path is unused
   (`decompose-lanes.md:16`).

Minor: 5 minor; A paying twice for routing → case against A; two defects → common-core 12, 13.

**Filter note.** Nothing above was dropped as factually wrong. Two were refined: C's "four closures
lifted by construction" is half true — `finalEvidenceForBrief` is composable from
`liveSourcesByEdge`, `briefsCoveredByIntegration` is not; and the *fatal* label on B's missing hop
is the UX panel's judgement, a comparison not ranking.

## The case against each candidate

### A — prose conveyor

A keeps fourteen prints and one derivation in agreement by review alone; Trade-off 6 supplies the
base rate — eight commands silent for nine phases because nothing checked. Risk 1's "stated once and
referenced" (`f6fe.md:236-239`) contradicts Scope 1's fourteen per-file paragraphs carrying real IDs
(`:48-52`); the one machine check is presence-only (`:212-213`) over truth in sixteen places. The
cost case rests on a false boundary — "already-exported walks, no handler modified" (`:78-79`)
versus private closures (`coverage_coherence.ts:68-102`; `comparison_required.ts:38-59`) — so A
writes a second copy of validation semantics with no parity oracle, and `spec:status` can print
`/integrate` for a contract `coverage-coherence` reds; its one graph-derived hop reads
`incoming.yaml`, whose entries carry no `status` (`indexer.ts:10-20`). Scope 5 builds `deriveStatus`
then bars the print path from calling it, against Trade-off 1's "no new abstraction". And the print
is A's only enforcement of the class-3 obligations — nothing requires decomposition — so one wrong
print yields a laneless, unverified change, green.

### B — derived conveyor

B's structural claim is one link narrower than the market frames it, and its enumeration has a hole
at the busiest hop: implementation writes nothing to the graph (`CLAUDE.md:71`;
`implement-brief.md:7-8`), and B's table has no rule emitting `/prepare-evidence` for a no-market
brief (`4c8c.md:148-160`), so `/implement-brief` reprints itself and the operator loops. B names the
escape — a marker a command writes (`:39-40`) — but authors none, and the one marker it reads, `##
Strategy tension`, has no declared writer. It has no pin over the command surface (`:84-91`), so a
print-less command reds nothing. Scope 2 contradicts itself in one clause — exports "supply every
walk" alongside "consolidating the private walks … is not required" (`:47-49`) — and verifiably do
not. B also inverts the layer dependency, and its fallback shares the failure it covers: `trails.md`
comes from `indexer.ts` and carries no next step. Transcription is unobservable — no CI job diffs a
printed block against `spec:status` (`:219-222`) — and B alone logs no risk for nine agents gaining
`Bash`.

### C — pinned conveyor

C spends the most net-new surface — a data format with two closed vocabularies C calls the least
schema-like data in `specs/schema/` — and lands where A lands: Trade-off 3 concedes review-only
acceptance, Trade-off 4 that contradicting prose passes (`8df4.md:192-197`). Its maintenance surface
is the largest: Scope 10 puts a `conveyor:` block *and* a prose print in fourteen files, so the true
count is nearer thirty than Trade-off 4's fifteen. Acceptance 3, which would close this, is
*(Machine-checked.)* with no second code path. The framing is unstable twice more: `terminal` is a
per-command boolean though correction 3 makes terminality graph-state dependent, and `lifecycle?` is
optional where the fields it mirrors are required with `[]` defaults (`loader.ts:43-47`) — a
fail-open on the normative table. Placement compounds it: `specs/schema/**` is the only
`sensitive_paths` glob and the only CODEOWNERS-gated node path, so every later routing edit needs a
contract or a dated override plus code-owner review — priced for this PR, never the recurrence. And
the alternative that avoids all this was rejected as "gitignored — the `.claude/lanes/` trap" while
Scope 8 ships the identical negation.

## Common-core findings

These apply to all three candidates equally and must be fixed whichever is selected; they are the
material for mandatory-fix amendments in the selecting decision.

1. **`/review-contracts` steps 2 and 3 are orphaned.** All three edit step 5 only, leaving step 2's
   `## Critique` instruction and step 3's guard live (`review-contracts.md:20-27`). Retarget the
   guard to one verdict-pointer line per routed critic, keep class-0/1 critiques on the candidate
   body, and fix `approve-contract.md:21-23`.
2. **The nine `Bash` grants are unfenced and unpinned** — `graph-maintainer` is sole holder today
   (`.claude/agents/graph-maintainer.md:6`). Pin each new agent's `tools:` line to a literal, fence
   `contract-reviewer` to read-only `git`, and state that diff content is data, not instruction.
3. **`issue-sync.yml` has no credential or permissions model** — no `.github/` workflow declares
   `permissions:`, a token or a secret. Declare `{contents: read, issues: write}`, pin `GH_TOKEN`
   and `--repo`, say whether blocked-by mutations need a scoped secret, and default local runs dry.
4. **The sync's write conditions are under-specified three ways.** Require the marker *and* the sync
   identity as author, rejecting text containing the sentinel; bound the projection to id, title,
   status, lane, owner and a link; and close on *final evidence **or** superseded/rejected*, a
   collapsed lane being superseded, never evidenced (`decompose-lanes.md:16`).
5. **The sync has no complete-listing guarantee, durable record, or self-healing trigger.** Abort
   before mutating unless the listing completed (`gitdiff.ts:5-15`); report planned/applied/failed
   per run (`spec.ts:78-85`); add a scheduled trigger; adopt A's `planIssueSync` seam and tests
   (`f6fe.md:80-82`).
6. **Node ids are unvalidated and now reach a pasted shell line and `gh` arguments** — the
   convention is a comment (`node-types.yaml:8`), no rule a pattern check. Refuse ids not matching
   `^[a-z]+-[a-z0-9-]+-[0-9a-f]{4}$`, and bind `gh` to `spawnSync` with `shell: false`.
7. **The closing print is not suppressed when the graph write failed** — commands end "nothing is
   committed on red" (`select-patch.md:31`) yet all three print after it. On red, print findings,
   remediation and explicitly **no** next step; and echo resolved ids before mutating.
8. **Widening `INDEX_FILES` puts conveyor policy on the critical path of every graph write**
   (`indexes_fresh.ts:12-33`). Give the views a soft freshness rule or make the derivation **total**
   and add a no-clock rule with a test, since `spec-index.yml` diffs `specs/indexes/` on every PR.
9. **`owner` is an unpoliced graph→filesystem reference and the absent-`owner` path is undefined.**
   Add one live-graph leg: `owner` names an agent in its lane's `eligible_agents`, and every
   `test-verification` brief carries `owner: test-writer`, scoped so a retired agent cannot red
   `ci`. Declare the owner-less behaviour, and refuse a decomposition omitting `test-verification`.
10. **The audit and governance records lag the controls this PR creates.** (a) Add
    `/specs/nodes/decision-*` to `.github/CODEOWNERS`, the one node path with no required review,
    now that decision bodies bind. (b) Add a `drift-review` row to `docs/branch-protection.md`, the
    sole audit record. (c) Extend the drift packet with the contract's `selects` decision
    (`driftmap.ts:25-31`), else the gate judges diffs against half the contract. (d) Require the
    `compliance-verdict` section to enumerate each amendment and name its discharging brief.
11. **The wave plan is print-only and cannot be reproduced** — waves and overrides exist nowhere in
    the graph or views, so the idempotency acceptance is unsatisfiable. Persist the wave on each
    lane brief, and render `issue: not synced` so a blank column never reads as a lost lane.
12. **The headline acceptance has no named subject, evaluation point, or regression artifact.** Name
    the discharging run, where the verdict is recorded, and the remediation if it fails; capture
    each printed block into a transcript fixture replayed against the recorded graph.
13. **Two lifecycle-map gaps block "every step is annotated with its command".** No numbered step
    owns `/propose-patches`, `/synthesize-patches`, `/compare-patches` or `/select-patch`
    (`CLAUDE.md:64-73`): assign them or scope the annotation to the six canonical steps. And define
    "live intent" once (`node-types.yaml:15` lacks `superseded`), parked intents printing nothing.
14. **Two stale constructs will be carried forward unless fixed here.** `tools/spec.ts:11` reads
    "regenerate the four files" and only C names it (`8df4.md:65`); render the count from
    `INDEX_FILES.length`. And `CLAUDE.md:186` calls the integration node "the release's `includes`
    target" though no such edge or `release` type exists — delete it or capture an intent.
15. **Acceptance text must use catalog lane names, and the "identical core" must be made
    identical.** B and C name a "schema lane" (`4c8c.md:237-239`; `8df4.md:229-230`) that
    `brief-lane-valid` rejects; the lane is `data-migration`. And the three ten-leg pins differ, so
    mix-and-match lets the base candidate decide the assertions — state the union as binding.
16. **Minor hygiene.** The `.gitignore` deny-then-negate pattern behind the vacuous-pin trap
    survives for the next `.claude/` subdirectory; the anti-vacuity leg should be `git
    ls-files`-based and sized from the CLAUDE.md table, not the literal 8; the `## Owns` leg needs a
    normalization (`lane_catalog_drift.test.ts:39`); and `specs/indexes/**` needs a merge rule.

## What the decision turns on

Every candidate delivers the same conveyor, the same lane market, the same issue sync, the same gate
graduation, and the same navigation views. Every candidate leaves the intent's headline acceptance —
a real change walked end to end by paste alone — as a one-time human observation; none of the three
converts it into a red test, and all three say so. Every candidate carries the same sixteen
common-core defects above.

So the human is answering one question:

**Is it acceptable for the command that prints a next step to depend, at run time, on the tooling
that derives it?**

A says no and pays with two independently authored expressions of one truth, reconciled only by
review. B says yes and pays with a prompt layer that renders from `tools/`, a fallback inside the
same failure domain, and a routing enumeration that cannot express the one lifecycle hop the graph
does not record. C says no and pays for the "no" twice — once in a net-new declarative format whose
pin certifies the half of each file the agent does not read, and once in permanently routing every
future lifecycle edit through the sensitive-paths gate this same change makes blocking.

Downstream of that answer follow the three things the panels disagreed about most: where a routing
hotfix's merge cost lands, what the operator sees when the conveyor is wrong, and whether the
printed ID is derivable-and-testable or merely reviewable. The comparison records; the decision
selects.

This comparison covers the live candidate set (3 candidates, 3 `compares` edges) and is the durable
record the selecting decision cites; it is replaced, never duplicated, on re-review.
