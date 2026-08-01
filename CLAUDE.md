# pactwright — file-based spec graph

This repository is a **graph of specifications** stored as plain files. The
graph is the source of truth for what we intend to build, what we've agreed
to build, and what we've actually built.

## Structure

```
/specs/
├── schema/
│   ├── node-types.yaml        # allowed node types + required fields
│   ├── edge-types.yaml        # allowed edge types + source→target rules
│   └── validation-rules.yaml  # cross-cutting graph invariants (stub)
├── nodes/                     # one file per node: <id>.md, flat layout
├── graph/
│   └── edges.yaml             # ALL relationships between nodes
├── indexes/                   # generated views (never hand-edit)
└── reports/                   # generated reports (never hand-edit)
```

### Where canonical truth lives

- **Nodes** — `/specs/nodes/<id>.md`. YAML frontmatter (`id`, `type`,
  `title`, `status`, `created`) followed by a markdown body.
- **Edges** — `/specs/graph/edges.yaml` ONLY. Each edge has `id`
  (`edge-<slug>-<4 hex>`), `source`, `type`, `target`, `created`.
- **Schema** — `/specs/schema/`. Constrains what nodes and edges may exist.
- **Indexes & reports** — derived artifacts. Regenerate; never edit.

### Node IDs

`<type>-<slug>-<4 hex chars>` — e.g. `intent-spec-tooling-7f3a`,
`contract-cli-flag-parsing-b21d`.

## Rules

1. **Relationships go in `edges.yaml` only.** Do not encode "this contract
   proposes intent X" inside a node body as canonical data. Prose in node
   bodies may *reference* other nodes for context, but the relationship
   itself only exists if there is an edge for it.
2. **No implementation without an approved contract and a brief.** If you
   are about to write production code and there is no `contract` (status
   `approved`) plus a `brief` decomposing it, stop and create them first.
3. **Never delete nodes — supersede them.** When a node is wrong or
   replaced, create the new node and add a `supersedes` edge from new → old.
   Move the old node's status to its terminal value (e.g. contract →
   `superseded`). The history must remain readable.
   **`subsumes` is the cross-type companion, and it is not supersession.**
   `decision —subsumes→ intent` records that a decision accounts for an intent
   which ran no market of its own. Unlike `supersedes` (`source: any`,
   `target: same_as_source`, and a status consequence two consumers read) it is
   heterogeneous and changes **no** node's status. It is read by exactly one
   rule, `unbacked-addressed`, and only when the subsuming decision `selects` a
   contract that is **covered** — the escape is anchored to delivered work and
   cannot be conjured from a decision that delivered nothing.
4. **Arrows mean edges, not time.** An arrow (→) anywhere in this
   repository's docs means canonical edge direction (source → target),
   never lifecycle order. Lifecycle order is written as numbered steps.
5. **Scope-integrity — record why scope moves; never absorb drift
   silently.** Whenever any review (contract, patch, or integration)
   reveals the approved contract or brief was wrong:
   - *Brief boundary wrong, contract intact* — supersede the brief with a
     corrected brief (`supersedes` edge). Never edit an approved brief in
     place.
   - *Contract incomplete, intended behaviour unchanged* — capture a
     follow-up intent (`/capture-intent`) for the missing scope. Do not
     widen the current contract silently.
   - *Selected work changes the intended behaviour* — stop and return to
     human approval. A new `decision` node is required before proceeding.
6. **graph-maintainer is the sole writer of the graph.** Only
   `graph-maintainer` writes `specs/nodes/` and `specs/graph/edges.yaml`.
   Every command that changes the graph delegates to it; commands and other
   agents *propose* nodes, edges and status changes and hand them over. A
   command that edits a graph file directly has bypassed the one place the
   invariants are enforced, however correct its content.
7. **Recording an override.** A waiver is an `override` node carrying
   `reason`, `approved_by` and `expires` (the fields
   `specs/schema/node-types.yaml` requires), plus a `waives` edge whose
   target is a check id registered in `specs/schema/checks.yaml`. **Honest
   bound:** `approved_by` is *provenance*, never authentication — nothing
   verifies it. What makes a waiver an independent approval is that adding
   an `override-*` node trips CODEOWNERS review; the mechanism is documented
   in `docs/branch-protection.md`.
8. **Drift is detected, then routed — never absorbed.** Divergence between a
   merged diff and the graph is found by `/detect-drift <pr-number|branch>`
   over the deterministic `spec:check-diff` and `spec:drift-map` layers
   (`docs/drift-detection.md`). A real divergence is recorded as a
   `drift-finding` node via graph-maintainer and is a **rule 5 event**.

## Lifecycle (numbered steps; each shows the edge it authors)

1. Intent captured (status: open)                  `/capture-intent`
2. Candidate contracts proposed      contract —proposes→ intent
                                                   `/propose-contracts`
3. Review and comparison (class 2+)  comparison —compares→ contract
   (one edge per live candidate; the comparison is never superseded by
   selection)                                      `/review-contracts`
4. Human selection                   decision —selects→ contract
   (chosen contract becomes approved, siblings rejected; intent stays open)
                                                   `/approve-contract`
5. Brief written                     brief —decomposes→ contract
                                     `/write-brief` or `/decompose-lanes`
6. Implementation                                  `/implement-brief`
   Writes code and project files, and performs **exactly one** graph write:
   the brief moves to `implemented`, through graph-maintainer (rule 6), which
   makes the implementation-to-evidence hop derivable rather than recalled.
   This amends the step's former code-only wording and is a change of
   intended behaviour approved under rule 5 by
   `decision-conveyor-derived-5a91`.
7. Evidence prepared                 evidence —evidences→ brief
   (the intent becomes `addressed` only when its contract is covered — for a
   multi-brief contract that means the final `integration` of step 8, per
   `coverage-coherence`)                           `/prepare-evidence`
8. Integration (multi-lane only)     integration —integrates→ evidence
   (one edge per live lane's final evidence)       `/integrate`

The four patch-market commands — `/propose-patches`, `/compare-patches`,
`/synthesize-patches` and `/select-patch` — are deliberately **not** numbered
steps: they are a per-lane sub-loop inside the implementation step, documented
in `### Patch market`.

Mnemonic: edges point backwards in time, from the newer record to what
it is about — provenance, like citations. Superseding follows the same
shape: a same-type successor points back via `supersedes` (newer
—supersedes→ older); the superseded node stays in place, its status
moved to its terminal value. `subsumes` (decision —subsumes→ intent) points
backwards the same way and is the one provenance edge that crosses types
without touching status; see rule 3.

**Backing, and its honest bound.** An `addressed` intent must be *backed* — some
live contract markets it **and nothing else**, and a decision selected that
contract — enforced by the `unbacked-addressed` validation rule, which walks
addressed intents rather than `selects` edges so an intent no `selects` edge
reaches is still reached. The singleton clause is load-bearing: a `selects` edge
names a **contract**, not an intent, so it endorses an intent only when the
contract markets one; without it, appending a single `proposes` edge from any
already-selected contract would back any intent. **The bound:** green asserts
*provenance*, never *coverage*. Coverage remains `coverage-coherence`'s verdict
and stays grandfathered at `coverage_coherence_from`, so an addressed intent
whose selected contract predates that cutoff is checked for coverage by neither
rule.

## Work-class routing

Every intent is classified at capture; its contracts inherit the class and
may revise it with recorded rationale in the contract body. The class routes
how much process a change earns. `class` is a required integer field (0–3) on
every `intent` and `contract`, range-checked by the `nodes-class-in-range`
validation rule.

| Class | Change | Proposal market | Critics | Lanes | Patch market | Human gates |
|-------|--------|-----------------|---------|-------|--------------|-------------|
| 0 | Trivial mechanical (typo, dependency bump, comment) | skipped — one contract, one brief | spec-critic only | none | none | none |
| 1 | Simple low-risk change on a single surface | one candidate + one brief permitted | spec-critic only | none | none | none |
| 2 | Meaningful product or technical change | required (≥2 candidates) | specialist critics where the change touches their surface | optional | optional per brief | none beyond selection |
| 3 | High-risk or ambiguous; anything touching security, privacy, compliance, payments, or production-sensitive paths; or any multi-surface change | required (≥2 candidates) | full specialist critic panel | required | available per lane | explicit, at contract selection AND at integration |

The "≥2 candidates" bar for class ≥2 is machine-enforced: the
`class-market-quorum` validation rule fails the graph when a selected
(`selects`-edged) class-≥2 intent has fewer than two live (non-superseded)
candidate contracts — so **an under-proposed class-≥2 approval cannot stand in
a green graph / cannot merge.** `/propose-contracts` and `/approve-contract`
also refuse up front in the normal path; the validation rule is the
unbypassable backstop, not the only line of defence.

### Critic routing

`/review-contracts` routes critics by the intent's `class` and the candidates'
declared scope — there is no code diff at proposal time, so routing reads each
candidate's `## Scope`, never a diff:

- **Class 0–1** — `spec-critic` only.
- **Class 2** — `spec-critic` plus the specialist critics whose surface the
  candidates' scope touches (when scope is ambiguous, route in *more* critics,
  never fewer):
  - UI: `ux-critic`
  - payments or personal data: `security-privacy-critic` and `compliance-risk-critic`
  - schema or service-boundary: `architecture-critic`
  - testing: `qa-test-critic`
  - runtime or ops: `reliability-ops-critic`
  - cost or maintainability: `cost-maintainability-critic`
  - release or rollout: `release-critic`
  - product or value: `product-critic`
- **Class 3** — `spec-critic` plus the full specialist panel (all nine),
  regardless of apparent surface.

Anything touching security, privacy, compliance, payments, production-sensitive
paths, or multiple surfaces is already **Class 3** by the table above, so the
full panel is the backstop for the class-2 scope-text heuristic. A perspective
routed in but finding nothing is recorded as an explicit "no concern on this
axis" — distinct from an axis never routed, so silence is never read as a clean
bill.

### Proposal comparison

A class-2+ review ends by recording exactly **one** `comparison` node per market
(`comparison —compares→ contract`, one edge per live candidate). Its body holds
the candidate trade-off table, the critic findings grouped by perspective, and
the case against each candidate; that body structure is a command/graph-maintainer
convention, not a validation rule. The comparison is the durable record of *why
the losers lost* — `/approve-contract`'s `decision` cites it, and it is never
superseded by selection; re-running `/review-contracts` replaces the existing
comparison rather than authoring a second.

The gate is dated. `comparison_required_from` (in `schema/validation-rules.yaml`,
currently `2026-06-18`) is the cutoff: a `selects` decision on a Class 2 or 3
contract **created on or after** the cutoff is valid only if a `comparison` node
already covers the live candidate set with at least two `compares` edges —
machine-enforced by the `comparison-required` validation rule. Contracts created
**before** the cutoff, and any class-≤1 selection, are grandfathered: the rule
skips them, so every pre-cutoff selection stays green with no comparison and **no
backfill** is performed.

The optional free-text `produced_by` field records the agent or human that
authored a node body. It is provenance plumbing for future agent scorecards,
never a gate: it may be absent or hold any value, and no validation rule reads
it.

## Lane model and integration

Class 3 multi-surface work **decomposes into lanes** — one `brief` per surface,
each carrying an optional `lane` field; Class 2 *may*. A `brief` with no `lane` is
an unlaned single brief (the default). The lane catalog and what each owns:

| Lane | Owns |
|------|------|
| `product-spec` | product/UX specification and acceptance |
| `domain-backend` | domain logic and backend services |
| `frontend-ui` | UI and client code |
| `data-migration` | schema/data migrations |
| `api-integration` | API surfaces and third-party integration |
| `test-verification` | the verification lane (tests) |
| `observability-release` | telemetry, runtime, release |
| `docs-spec` | documentation and governing docs |

`/decompose-lanes <contract-id> <lanes>` creates the laned briefs; `/write-brief`
remains for a single unlaned brief. The `lane` value is constrained to this catalog
by the `brief-lane-valid` validation rule.

Three rules govern lanes and completion:

1. **Verification is always its own lane.** Any multi-lane change includes a
   `test-verification` lane, owned by the `test-writer` agent (via `/write-tests`) —
   never the same invocation that implemented the code under test. `/write-tests`
   carries the same **exactly one** graph write `/implement-brief` does — the brief
   moves to `implemented`, through graph-maintainer — so this lane's hop to evidence
   is derived rather than recalled. That extension of A7 to a second command is a
   change of intended behaviour approved under rule 5 by
   `decision-write-tests-flip-7f14`. The agent still writes nothing under `specs/`:
   the command orchestrates the write, `test-writer` never performs one.
2. **Single-brief contracts skip integration.** A contract decomposed into one brief
   is completed by that brief's lone **final** `evidence`; there is no `integration`
   node. A multi-lane change is completed by a final `integration` node (via
   `/integrate`) — the contract's coverage artifact. The `coverage-coherence` rule
   enforces this: a multi-brief contract cannot
   mark its intent `addressed` until a final integration `integrates` a final evidence
   for every live lane.
3. **Every evidence records `touches`.** `/prepare-evidence` authors `touches` edges
   (source = evidence) to each capability the change's diff falls under; a diff
   touching paths no capability owns is a coverage gap resolved in the **same PR**
   (extend/create a capability, or record the paths intentionally unowned), never
   ignored.

The `integration` node's body carries the prose; its `integration_sections`
frontmatter list is the machine-checked completeness signal. **Honest bound:** a
green graph asserts the integration node exists, is wired to a final evidence for
every live brief, and **declares** the required sections of a well-typed shape — it
does **not** prove the combined tests ran or the verdict is sound; that substance is
the `integration-reviewer` agent's judgement, recorded in the body. The single
canonical list of required section keys lives in
`.claude/agents/integration-reviewer.md`; this document references it rather than
re-listing the keys. The `integration-sections-keys` rule necessarily embeds a
literal copy (a `closed_key_set` reads its own `keys:` field), kept byte-equal to
the canonical list by the `lane_integration_meta` drift test.

### Patch market

Where the proposal market compares whole-contract candidates for one intent, the
**patch market** compares competing *implementations* for one lane. It runs **per
lane brief**: candidate `patch` nodes compete **within a single lane**, and patch
comparison judges **that lane in isolation** against the lane brief's slice of the
contract. **Cross-lane fit is never judged in patch comparison — it is judged at
integration** (the `integration` node documented above, which combines every live
lane into the contract's coverage artifact). A patch market is opened by
`/propose-patches <brief-id>` on a lane brief (or a single unlaned brief): the
command sets `patch_market: true` on that brief and creates one `patch` node per
implementation strategy, each carrying a `competes-for` edge to that brief.

The patch market is routed by class, elaborating the `Patch market` column of the
work-class routing table (just as `### Critic routing` elaborates the `Critics`
column) — the column's four cells stay authoritative and the prose only spells them
out:

- **Class 0–1** — a single patch, **no market** (one implementation, no competing
  candidates; matches the column's `none` cells).
- **Class 2** — a patch market is **optional per brief** (matches `optional per
  brief`).
- **Class 3** — a patch market is **available per lane** (matches `available per
  lane`).

Within a lane, competing candidate patches may be combined into a **synthesis
patch** — a `patch` on branch `patch/<brief-slug>/synthesis` carrying `synthesizes`
edges to each parent patch it combines and a `competes-for` edge to the **same** lane
brief — authored by `/synthesize-patches`. A synthesis patch combines ≥2 parents (the
structural `synthesis_parentage` rule enforces this). Synthesis stays **within one
lane**: across-lane combination is **never** synthesis — it is the `integration` node
already documented above. Keep the two crisply separate — synthesis is the within-lane
operation, integration is the across-lane one.

A class-2+ patch review ends by recording exactly **one** `comparison` node per lane
market (`comparison —compares→ patch`, one edge per live competitor) — the per-lane,
per-brief analogue of the contract-level `### Proposal comparison`. It is the durable
record the `/select-patch` `decision` cites, it is **never superseded by selection**,
and re-running `/compare-patches` **replaces** the existing comparison rather than
authoring a second.

Patch review carries the Phase-6 scope-integrity rules: a patch comparison that
reveals the approved contract or brief was wrong follows scope-integrity **rule 5**
(supersede the brief, capture a follow-up intent, or return to human approval) — it
never widens scope silently inside the winning patch. Rule 5 already names "patch"
review; this is a pointer to it, not a restatement.

**Honest bound:** a green `patch-comparison` check asserts that a covering
`comparison` node and a `selects` decision **exist** for the lane's live competitors
(or a non-expired `waives → patch-comparison` override is present) — not that the
comparison was substantive. The gate's full mechanism (the fail-closed PR→brief
mapping, override expiry, and the dated wiring) is enforced by the `patch-comparison`
CI gate; see the domain-backend and observability-release lanes' artifacts.

## The conveyor

`tools/conveyor.ts`'s `nextSteps(spec, nodeId)` is the **single source of routing
truth**. `spec:status` is its read-only surface, `trails.md` and `status.md` are
rendered from the same derivation, and every chain command's closing report
reproduces the resolver's machine-stable `NEXT` block **verbatim** — "verbatim"
binding the block only, with the command's own judgement content required *around*
it, never inside it. There are not three producers, so the three consumers cannot
diverge; every printed id is resolved from `edges.yaml` rather than recalled.

**Two commands carry the single graph write, not one** — `/implement-brief` and
`/write-tests` — because a `test-verification` brief may not go through the former,
so without the second the resolver had nothing to key on and reprinted the command
just run. The bound on what that cost, recorded so the fix is not read as larger than
it was: `/prepare-evidence` already flips a laned brief to `implemented` if it is not
already, so the window in which the status was stale was **one command wide**, never
permanent. The defect was a one-step ordering gap, not a missing fact. A **third**
command acquiring that write needs its own decision.

**The degraded path is real and is marked.** Each chain command retains a static,
**template-shaped** fallback print in its own markdown, used only when the resolver
itself is unavailable. It carries **no** resolved ids — its placeholders are
required, not defects — and it is explicitly labelled the resolver-unavailable path
so it never becomes a second authoritative routing source. A failed *graph write* is
a different case: that prints findings, remediation and explicitly **no** next step.

Two standing bounds:

- **The conveyor prints, never executes.** A printed command still obeys its class's
  standing rules; a recommendation is never an exemption.
- **Terminality is derived from graph shape**, never declared per command. The PR
  action is terminal only for an unlaned single brief; a multi-lane contract's last
  lane `/prepare-evidence` is followed by `/integrate`.

`spec:status` reports per **live intent**. That term has exactly one definition, in
the `intent` block of `specs/schema/node-types.yaml`; this document points at it and
writes no second copy.

**Recording a paste-only acceptance claim.** An acceptance that says a change runs
end to end by paste alone must name **the run that discharges it**, record that run's
verdict in the final `integration` node's `combined-test-run` section
(cross-referenced from `compliance-verdict`), and name the **remediation if it
fails** — a `drift-finding` plus a rule 5 route. A change does not reach a final
integration on a failed run. A claim with no named run, no recorded verdict and no
remediation is not an acceptance criterion.

### Output attention

The reader's attention is the budget these conventions spend. They are **guidance,
not gates**: no validation rule reads any of them and no length is machine-checked.

- Critic findings live **only** in the `comparison` node. `/review-contracts` writes
  a one-line-per-axis verdict pointer onto each candidate, not a full critique
  section — except at class 0–1, where no comparison exists and the critique has
  nowhere else to live.
- Contract bodies stay pure spec; target ≤250 lines.
- Node prose hard-wraps at 100 columns.
- Binding amendments and mandatory fixes are **numbered markdown lists**, never
  inline enumerations — the list is the discharge key a later integration enumerates.
- A comparison body opens with a verdict table of ≤10 rows whose cells are ≤15 words,
  with the shared-core prose outside the table
  (exemplar: `comparison-patch-market-synthesis-7b1d`).
- A decision body takes the `decision-patch-market-ci-gate-8a2f` shape — a
  SELECTED/REJECTED lead line, amendments as a numbered list, ≤120 lines, and a
  closing next-step print.

### The effective contract

**The effective contract is the approved contract plus its selecting decision's
amendments.** The base candidate, the grafts taken from named siblings, and the
mandatory fixes are all binding, and a change that satisfies the contract body while
dropping an amendment is not done.

- `/write-brief` and `/decompose-lanes` carry those amendments into every brief they
  draft, naming each by its identifier.
- Every review judged against the approved contract reads the contract **and** its
  selecting decision together — `contract-reviewer`, `integration-reviewer` and drift
  review included.
- **The approved contract body is never edited.** Amendments live in the decision.
- An amendment that would change intended behaviour returns to human approval under
  rule 5, recorded as a new `decision` before it is implemented.

`decision-patch-market-ci-gate-8a2f` is the precedent this formalizes;
`decision-conveyor-derived-5a91` is its current instance.

**Discharge.** An `integration` node's `compliance-verdict` section enumerates each
amendment of the selecting decision and names that amendment's **discharging brief**
— for `contract-conveyor-derived-4c8c` that is 32 items. The canonical
`integration_sections` key list lives in `.claude/agents/integration-reviewer.md`;
this document points at it rather than re-listing the keys.
