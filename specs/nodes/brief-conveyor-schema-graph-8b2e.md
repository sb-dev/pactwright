---
id: brief-conveyor-schema-graph-8b2e
type: brief
title: Conveyor schema and graph data — optional owner on brief, lane-list pointer, live-intent definition, and the five Scope-14 data migrations
status: implemented
created: 2026-07-28
lane: data-migration
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
`data-migration` lane of `intent-self-guiding-delivery-loop-6d79` (class 3, open), per decision
`decision-conveyor-derived-5a91`. This lane owns the contract's **one schema touch** (Scope 7 —
`specs/schema/node-types.yaml`) and **all five sub-items of Scope 14** (graph data: `specs/nodes/**`
and `specs/graph/edges.yaml`, plus the mandatory index regeneration). Every other surface belongs to
another lane: `tools/**` and `package.json` to `domain-backend`, the fifteen `.claude/commands/*.md`
chain files to `api-integration`, `.github/**` to `observability-release`, `.claude/lanes/**` +
`.claude/agents/**` + `.gitignore` to `product-spec`, `CLAUDE.md` + root docs + `docs/**` to
`docs-spec`, and `tests/**` to `test-verification`. **BOOTSTRAP:** this decomposition predates the
lane market the contract builds — `.claude/lanes/` does not exist, `owner` is not in the schema
(this brief is the change that adds it), and none of the seven implementer agents exist — so **no
brief in this decomposition carries an `owner`**, and lane owners are assigned by `/decompose-lanes`
only after this change lands. The absence of `owner` here is a recorded bootstrap condition, not an
omission; unknown and absent optional frontmatter keys validate green because `required_fields` is a
one-directional presence check and nothing enumerates node keys.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Every line number below was verified
against the current tree on 2026-07-28. **Re-confirm each before editing** — earlier edits in the
same file shift them, and a wrong anchor is worse than none.

- **`specs/schema/node-types.yaml`** (99 lines) — the node-type registry, and the ONLY schema file
  this lane touches.
  - The **`brief` block is `:22-33`**. Its comment `:23-27` documents the optional `lane` enum, with
    the **inline eight-lane enumeration at `:25-26`**; `:27` records that unset means an unlaned
    single brief and that `lane` is not in `required_fields`. `:31` is `required_fields: [id, type,
    title, status, created]`, `:32` `requires_body: true`, `:33` `status_values: [draft, approved,
    implemented]`.
  - **`:28-30` is the `patch_market` precedent** and the exact wording model for `owner`: an
    optional flag documented as a **comment only**, described as "Unvalidated (like `produced_by`)
    and not in required_fields", with absence given an explicit meaning. Reuse this three-part shape
    — purpose, unvalidated-and-not-required, meaning-of-absence — verbatim in structure.
  - The **`intent` block is `:12-15`**; `:15` is `status_values: [open, addressed, rejected]`.
    **There is no `superseded` intent status.** This is the exact gap CC-13 cites, and the reason
    the "live intent" definition must state the supersession clause as an *edge* condition.
  - The **`drift-finding` block is `:60-65`**: `required_fields: [id, type, title, status]` (`:63`,
    **no `created`**), `requires_body: true` (`:64`), `status_values: [open, resolved, accepted]`
    (`:65`).
  - The **`capability` block is `:53-58`**: `required_fields: [id, type, title, status, paths]`
    (`:56`) — `created` is **not** required, which is why `capability-spec-docs-8c1d` and
    `capability-spec-tests-3a6e` legally carry none while the other four do.
  - The **`decision` block is `:40-44`**: `required_fields: [id, type, title, decided_by, created]`,
    no `status`. This is the shape of the 14.5 authorization artifact.
- **`specs/schema/validation-rules.yaml`** (140 lines) — **read, never edited by this lane.**
  - `brief-lane-valid` is `:91-97`; its **`keys:` list at `:97`** is the machine-authoritative lane
    catalog and the pointer target for the `node-types.yaml:25-26` de-duplication.
  - `capability-paths-shape` (`:49-53`) requires a capability's `paths` to be a non-empty string
    list — widening a `paths` list keeps it green; replacing it with a scalar would red it.
  - `sensitive_paths` is `:126-127` and holds exactly one glob: **`specs/schema/**`**. That is why
    this lane is the self-application lane (see Acceptance).
  - `comparison_required_from: "2026-06-18"` at `:134` and `coverage_coherence_from: "2026-06-18"`
    at `:140` — the two dated cutoffs; `:129-133` and `:136-139` are the comments describing the
    absent-or-malformed fail-open that Scope 14.4's first follow-up intent reverses.
- **`specs/schema/edge-types.yaml`** (77 lines) — read only. `touches` is `:48-50` (`evidence →
  capability`); `flags` is `:52-56` (`drift-finding → [evidence, capability]`, a list target
  enforced by the generic `edge_endpoint_types` rule — **no handler change is needed for the first
  live `flags` edge**); `supersedes` is `:28-31` (`source: any`, `target: same_as_source`).
- **`specs/graph/edges.yaml`** (481 lines; 22 live `touches` edges today). The tail edge is
  `edge-conveyor-selects-derived-9c30` at `:477-481` — new edges append after it, unless
  `/decompose-lanes`' own seven `decomposes` edges have already landed there first, in which case
  append after those.
  - **Two live `touches` id conventions**, both real and both green:
    - **short** — `:252-276`, five edges from `evidence-lane-integration-9b4c`, e.g.
      `edge-touches-lane-integration-docs-8b2e` (`:267`): full evidence slug + an **abbreviated**
      capability slug (`capability-spec-docs-8c1d` → `docs`, `capability-spec-tooling-1a2b` →
      `tooling`).
    - **full** — `:372-416`, nine Phase-9 edges, e.g.
      `edge-touches-patch-market-commands-lifecycle-commands-7e1f` (`:392`): full evidence slug +
      **full** capability slug.
  - The eight oldest `touches` edges are `:117-156` (created 2026-06-15), a third, looser shape
    (`edge-touches-spec-tooling-evidence-a1b2`) that is neither convention and is not a model.
  - `edge-supersedes-capture-smoke-3f0a` (`:47-51`) is the only live `supersedes` edge and confirms
    the direction CLAUDE.md states: **source is the newer node, target the superseded older one**.
- **The two evidence nodes of Scope 14.1** — each has **exactly one** edge today and **zero**
  `touches` edges:
  - `specs/nodes/evidence-work-class-routing-f0a3.md` — only
    `edge-evidences-work-class-routing-c7e1` (`edges.yaml:182-186`). Its body enumerates the diff:
    `tools/handlers/class_range.ts`, `tools/handlers/class_market_quorum.ts`, `tools/validator.ts`
    (`:16-20`); `specs/schema/validation-rules.yaml`, `specs/schema/node-types.yaml` (`:21-25`);
    `CLAUDE.md` (`:26-28`); four `.claude/commands/*.md` (`:29-31`); two `tests/*.test.ts` (`:32`).
  - `specs/nodes/evidence-critics-literal-panel-e2a7.md` — only
    `edge-evidences-critics-literal-panel-f4b1` (`edges.yaml:212-216`). Its `## Files landed`
    section (`:24-30`) enumerates Lane A (`specs/schema/*.yaml`, `tools/loader.ts`,
    `tools/handlers/comparison_required.ts`, `tools/validator.ts`, two `tests/*.test.ts`), Lane B
    (nine `.claude/agents/*-critic.md`) and Lane C (`CLAUDE.md`, two `.claude/commands/*.md`).
  - Both therefore span **all five** capabilities → five `touches` edges each, ten in total.
- **The six capability nodes** (`specs/nodes/capability-*.md`) and their `paths`:
  `capability-ci-enforcement-3e4f` `[.github/workflows/**, .github/CODEOWNERS]` (`:7`);
  `capability-lifecycle-commands-4f5a` `[.claude/commands/**, .claude/agents/**]` (`:7`);
  `capability-spec-docs-8c1d` `[CLAUDE.md, docs/**]` (`:6`, **no `created`**);
  `capability-spec-schema-2c3d` `[specs/schema/**]` (`:7`); `capability-spec-tests-3a6e`
  `[tests/**]` (`:6`, **no `created`**); `capability-spec-tooling-1a2b` `[tools/**, package.json]`
  (`:7`). `capability-spec-docs-8c1d`'s body `:9-11` reads "Owns the governing-doctrine document
  `CLAUDE.md`" — **singular**, and already stale against its own `docs/**` glob; it goes staler
  still once Scope 14.2 adds three root files.
- **`specs/nodes/decision-graph-data-unowned-2f7b.md`** (30 lines) — the precedent for the 14.5
  artifact. A `decision` node with **zero edges** (it appears only in
  `specs/indexes/by-type.yaml:57` — verified), whose body states the paths, why they are unowned,
  that it is "the durable, dated authorization that `/prepare-evidence`'s human-confirm branch
  points at" (`:19-23`), and closes with a dated attribution line naming the authorizing human
  (`:25-29`). Reuse this shape exactly; do not invent a new node type.
- **`specs/nodes/evidence-drift-tool-assisted-3e58.md:97`** — the origin of the 14.3 debt, verbatim:
  "Run `/detect-drift` on PR #4 once capabilities are seeded (acceptance 6)." The surrounding
  `:86-93` block records that the capability nodes and retroactive `touches` edges were seeded
  **after** PR #4 — which is precisely the non-determinism the contract's Risk 6 flags.
- **`tests/fixtures/good-drift/specs/nodes/drift-finding-x-cccc.md`** (8 lines) — the ONLY
  `drift-finding` example in the repo: `id`, `type`, `title`, `status: open`, body. It carries no
  `created` and no `produced_by`. It is a minimal fixture, not a live-graph house-style precedent.
- **`.claude/commands/detect-drift.md`** — read, never edited by this lane (it is
  `api-integration`'s file). Its step 1 (`:9-14`) pins base resolution and `pnpm spec:drift-map`;
  step 4 (`:28-29`) requires `unlinked` packets and `uncovered` files to be reported explicitly,
  "not silently 'no drift'"; step 5 (`:31-36`) specifies the `drift-finding` (status `open`; body
  states the changed behaviour, where it diverges, and a suggested resolution from `update-spec |
  revert | accept-with-contract`) plus **`flags` edges to the affected capability *and* to the
  touching evidence** — i.e. plural, where Scope 14.3 says "a `flags` edge".
- **`tools/driftmap.ts:20-33`** — the `DriftPacket` shape. `linkState` is `linked` iff at least one
  contract is reachable via `touches → evidences → decomposes`; `uncovered` is the changed files no
  capability's `paths` match. **This is why Scope 14.1 and 14.2 must land before the 14.3 run.**
- **`tools/gitdiff.ts:126-135`** — `changedFiles(base)` runs `git diff --name-only <base>...HEAD`
  where **HEAD is the current working tree's HEAD**, and `tools/loader.ts:92` shows `loadSpec()`
  defaults its root to `process.cwd()/specs`. Together these are the historical-PR trap pinned in
  step 8 below. Neither file is this lane's to change.
- **`tools/checkdiff.ts:100-147`** (`evaluateCheckDiff`) and **`:63-98`** (`hasGoverningEvidence`) —
  the sensitive-paths gate this lane self-applies: a PR touching `specs/schema/**` passes only if it
  **adds** an `evidences` edge whose evidence carries a `touches` edge to the owning capability and
  whose brief `decomposes` an **`approved`** contract. Confirm-do-not-reimplement.
- **`tools/indexer.ts:35`** (`INDEX_FILES`, four files today), **`:61`** (`byType` groups sorted),
  and **`tools/yaml.ts:9`** (`dump(..., { sortKeys: true })`) — index emission is deterministic and
  alphabetically keyed. `specs/indexes/by-type.yaml` is 93 lines with eight groups today (`brief`,
  `capability`, `comparison`, `contract`, `decision`, `evidence`, `integration`, `intent`); a new
  `drift-finding` group sorts **between `decision` (`:52-62`) and `evidence` (`:63-76`)**.
- **`specs/nodes/intent-unbacked-addressed-guard-8c4e.md`** (38 lines, `status: open`, `class: 2`) —
  the body shape for the two Scope 14.4 follow-up intents: `## Problem`, `## Goal`, `## Source`,
  with `## Source` naming the originating PR review finding and the likely class.

## Pinned decisions

Binding constraints this lane discharges. Each names its amendment identifier. **CC-* text in
`comparison-conveyor-market-890e`'s `## Common-core findings` is the binding text** — the statements
below apply it to this lane's surface and never replace it.

- **CC-9 (the `owner` field itself).** This lane authors `owner` on `brief` in `node-types.yaml` as
  an **optional, unvalidated string**, worded on the `patch_market` precedent at `:28-30`: **not**
  in `required_fields`, and **no validation rule** (the contract's Out of scope 1 forbids one —
  "`owner` is optional and unvalidated, like `produced_by`. The lane pin is a test, not a rule").
  CC-9 also requires the **owner-less behaviour to be declared**: this lane declares it in the
  schema comment — absence is legal and means *unassigned*, never an error. **CC-9's live-graph
  leg** (that an `owner` names an agent in its lane's `eligible_agents`, and that every
  `test-verification` brief carries `owner: test-writer`, scoped so a retired agent cannot red `ci`)
  is a **drift test** and belongs to `test-verification`; the `eligible_agents`/`default_agent`
  catalog fields belong to `product-spec`; and A16's "refuse a decomposition omitting
  `test-verification`" belongs to `api-integration`. This lane ships the field and its declared
  semantics, nothing more.
- **CC-13 (define "live intent" once).** This lane authors the **single** definition, as a comment
  on the `intent` block adjacent to `:15`. The definition: **an intent is live iff its `status` is
  `open` and it is not the target of a `supersedes` edge.** The edge clause is load-bearing
  precisely because `:15` has no `superseded` value — CLAUDE.md rule 3 moves a superseded intent to
  its terminal value, which for an intent is `rejected`, so the status clause already excludes a
  *completed* supersession; the edge clause covers the window before the status flip lands and is
  what makes "parked intents print nothing" expressible at all. Every consumer **points at this
  anchor and does not restate it**. **Honest bound:** the definition is prose in a YAML comment, not
  a rule; nothing machine-enforces that `tools/conveyor.ts` implements it. CC-13's *other* half —
  the two lifecycle-map gaps (no numbered CLAUDE.md step owns `/propose-patches`,
  `/synthesize-patches`, `/compare-patches`, `/select-patch`) — is `docs-spec`'s.
- **A13 — the lane-name correction, recorded here because the approved contract body is never
  edited.** Contract Acceptance 7 says the PR "stays red until **the schema lane's** evidence and
  `touches → capability-spec-schema-2c3d` land in the same diff". **There is no `schema` lane.**
  `brief-lane-valid`'s `keys:` (`validation-rules.yaml:97`) rejects it. The catalog lane that owns
  this work is **`data-migration`**, and this brief is that lane's brief. Wherever the contract, the
  comparison or any downstream artifact says "the schema lane", read **`data-migration`**. *Verified
  citation drift:* A13 cites the phrase at `4c8c.md:239` and CC-15 at `4c8c.md:237-239`; the phrase
  actually sits at **`4c8c.md:238`**, inside the Acceptance-7 span `:237-240`. Use the verified
  anchor.
- **The lane enumeration at `node-types.yaml:25-26` becomes a pointer, not a shorter copy.** After
  this change `node-types.yaml` holds **zero** lane names. The pointer names `brief-lane-valid`'s
  `keys:` in `validation-rules.yaml` as the machine-authoritative list and the CLAUDE.md lane table
  plus `.claude/lanes/` as the human-readable one. This removes one of the six live lane-list copies
  and is a precondition for `test-verification`'s union pin not having to police a seventh.
  **Verified safe:** no test and no tool reads that comment — the loader strips YAML comments, and a
  grep of `tests/*.ts`, `tools/*.ts` and `tools/handlers/*.ts` for `node-types` finds only path
  strings and prose, never a read of the lane list.
- **One `touches` id convention is pinned: the FULL form** —
  `edge-touches-<full-evidence-slug>-<full-capability-slug>-<4hex>`, the Phase-9 shape at
  `edges.yaml:372-416`. Rationale to record in the PR: it is the newer precedent (2026-06-25 vs
  2026-06-20), it is **mechanically derivable** from the two endpoint ids with no judgement, and the
  short form's abbreviation of the capability slug (`capability-spec-tooling-1a2b` → `tooling`) is a
  naming choice a tool cannot reproduce. The five existing short-form edges at `:252-276` are **left
  exactly as they are** — ids are immutable and rewriting them would break nothing but would rewrite
  history for no gain. This lane pins the convention **going forward**; it does not migrate.
- **Scope 14.3's run order is pinned: `/detect-drift 4` runs LAST, after every other graph write in
  this lane** — after 14.1's ten `touches` edges, after 14.2's capability widening, and after 14.4
  and 14.5. Reason, verified in `tools/driftmap.ts:20-33`: a packet's `contracts`, `briefs`,
  `priorEvidence` and `linkState` are all walked from `touches` edges, and its `changedFiles`/
  `uncovered` split is computed from the **current** `capability.paths` — so both 14.1 and 14.2
  change the run's inputs. The plan asks only whether the run precedes or follows 14.2; the verified
  answer is that **14.1 moves the verdict too**, and running last is the only order that makes the
  recorded verdict reproducible against the tree this PR lands. The contract's Risk 6 ("the PR #4
  `/detect-drift` run is non-deterministic — it maps that diff against capabilities seeded one PR
  later") is therefore *managed by a pin*, not eliminated; state the pin in the recorded verdict
  itself so a re-run is comparable.
- **The two Scope 14.4 follow-up intents are `class: 2`**, matching the two live open non-conveyor
  intents (`intent-docs-arrow-lint-e7b3` and `intent-unbacked-addressed-guard-8c4e`, both `status:
  open`, `class: 2` — verified). *Recorded tension:* the malformed-cutoff finding was originally
  guessed "likely class 1" when it was deferred from the PR #10 review. Class 2 is correct and
  binding here: the change adds a validation finding on a schema-adjacent scalar **and** reverses a
  binding directive of an approved decision, which is a meaningful technical change on a gated
  surface, not a trivial one. Both intents stay `status: open` — this change **captures** them and
  implements neither (contract Out of scope 2).
- **The malformed-cutoff intent must say the gate goes RED, reversing a binding decision.**
  `decision-critics-literal-panel-9c4f` directive 2 (`:28`) mandates "fail-open (skip) if EITHER is
  undefined" and directive 3 (`:29`) mandates the scalar contract "absent ⇒ undefined ⇒ rule
  disabled; malformed ⇒ undefined via `toDateString` ⇒ skip". Both are **deliberate**. The new
  intent must state, in its `## Source`, that it reverses that choice for the *malformed* case only
  (absent may stay gate-off) and therefore needs its own contract and decision — it is not a patch
  to the approved work. **Verified supporting fact to cite in the body:**
  `tests/fixtures/bad/malformed-node/` contains five files and **no `expected-errors.txt`**, so
  today there is no fixture asserting any error for a malformed input on this path.
- **14.5's authorization is a `decision` node and it records a human's authorization; it is never
  self-issued.** `decided_by` must name the authorizing human (`Samir Benzenine`, per the
  `decision-graph-data-unowned-2f7b` precedent) and the body must carry the dated attribution line.
  The implementer records an authorization that was given; if it was not given, stop and ask.
- **This lane adds no validation rule, no edge type, and no node type.** Contract Out of scope 1 and
  2 are binding: `owner` earns no rule; the malformed-cutoff *fix* and every other post-Phase-9
  validation-rule change is Phase 10 Step 0.

## Files to create

Four new node files under `/home/samir/workspace/pactwright/specs/nodes/`, all authored by
graph-maintainer (the sole writer of `specs/nodes/` and `specs/graph/edges.yaml`):

1. `specs/nodes/intent-malformed-cutoff-finding-<4hex>.md` — Scope 14.4, first follow-up intent
   (`type: intent`, `status: open`, `class: 2`, `created: 2026-07-28`).
2. `specs/nodes/intent-write-tests-unlaned-brief-<4hex>.md` — Scope 14.4, second follow-up intent
   (same frontmatter shape).
3. `specs/nodes/decision-gitignore-unowned-<4hex>.md` — Scope 14.5, the durable dated authorization
   (`type: decision`, `decided_by: Samir Benzenine`, `created: 2026-07-28`, **no `status`**).
4. `specs/nodes/drift-finding-pr4-<slug>-<4hex>.md` — Scope 14.3, **conditional**: created only if
   the pinned `/detect-drift 4` run finds drift. If it finds none, **no node is created** and the
   explicit "no drift" record lives in this lane's evidence body (see step 8).

The four-hex suffixes are graph-maintainer's to mint; they must not collide with any live node id
(`nodes-id-unique`).

## Files to modify

1. `/home/samir/workspace/pactwright/specs/schema/node-types.yaml` — Scope 7. Three edits, all
   comment-level except the one new documented field: add optional `owner` to the `brief` block's
   comment (`:22-33`); replace the inline lane enumeration at `:25-26` with a pointer; add the
   single "live intent" definition to the `intent` block (`:12-15`). **No `required_fields` list
   changes and no `status_values` list changes anywhere in this file.**
2. `/home/samir/workspace/pactwright/specs/graph/edges.yaml` — Scope 14.1 (ten `touches` edges) and,
   conditionally, Scope 14.3 (the `flags` edges).
3. `/home/samir/workspace/pactwright/specs/nodes/capability-lifecycle-commands-4f5a.md` — Scope
   14.2: `paths` (`:7`) gains `.claude/lanes/**`; the body line `:10` is widened to name the
   catalog.
4. `/home/samir/workspace/pactwright/specs/nodes/capability-spec-docs-8c1d.md` — Scope 14.2: `paths`
   (`:6`) gains `SPEC.md`, `README.md`, `CONTRIBUTING.md`; the singular body claim at `:9-11` is
   widened so it stops going stale.

## Ordered implementation steps

Steps 1-3 are `node-types.yaml` and are order-independent among themselves; steps 4-7 are graph
data; step 8 depends on 4 and 5 having landed; step 9 must follow every preceding step. Line numbers
are current-tree anchors — **re-confirm each before editing.**

1. **`node-types.yaml` — add optional `owner` to the `brief` block.** Extend the `brief` comment
   (`:22-33`) with a paragraph modelled sentence-for-sentence on the `patch_market` precedent at
   `:28-30`. It must state (a) what `owner` is — the agent `/decompose-lanes`' lane market assigned
   to implement this brief, named from that lane's catalog file's `eligible_agents`; (b) that it is
   **unvalidated (like `produced_by` and `patch_market`) and NOT in `required_fields`**, with no
   validation rule reading it and the live-graph leg being a drift test rather than a rule; and (c)
   the **owner-less behaviour** (CC-9): absence is legal and means *unassigned* — an unlaned single
   brief, a brief written before the lane market existed (every brief in this decomposition), or a
   lane whose market recorded no assignment. Consumers treat an absent `owner` as unassigned, never
   as an error. Do **not** add `owner` to `:31`'s `required_fields`.
2. **`node-types.yaml` — turn `:25-26` into a pointer.** Delete the inline eight-lane enumeration
   and replace it with a pointer naming `brief-lane-valid`'s `keys:` in
   `specs/schema/validation-rules.yaml` as the machine-authoritative list and the CLAUDE.md lane
   table plus the `.claude/lanes/` catalog as the human-readable one, noting they are pinned equal
   by the lane drift test. Keep `:23-24`'s explanation of *why* the rule is a `closed_key_set`
   membership check (enum_constraint covers only type/status) and keep `:27`'s "unset means an
   unlaned single brief; not in required_fields". After this edit **grep the file for any lane
   name** — the correct result is zero hits.
3. **`node-types.yaml` — add the single "live intent" definition (CC-13).** Add a comment to the
   `intent` block adjacent to `:15` defining a **live intent** as one whose `status` is `open` and
   which is **not the target of a `supersedes` edge**, and explaining that the edge clause exists
   because `:15` declares no `superseded` value (a superseded intent lands at its terminal value,
   `rejected`, per CLAUDE.md rule 3; the edge clause covers the window before that flip and is what
   lets a parked intent print nothing). State that every consumer — `tools/conveyor.ts`,
   `spec:status`, `status.md`, `trails.md`, `CLAUDE.md` — **points at this definition and does not
   restate it**, and state the honest bound: this is prose, not a rule; no validation rule is added
   (contract Out of scope 1).
4. **Scope 14.2 — widen the two capabilities.** In `capability-lifecycle-commands-4f5a.md`, change
   `paths` (`:7`) to `[.claude/commands/**, .claude/agents/**, .claude/lanes/**]` and widen the body
   line `:10` so it names the lane catalog alongside the commands and agents. In
   `capability-spec-docs-8c1d.md`, change `paths` (`:6`) to `[CLAUDE.md, SPEC.md, README.md,
   CONTRIBUTING.md, docs/**]` and **rewrite the body's singular claim at `:9-11`** — today it reads
   "Owns the governing-doctrine document `CLAUDE.md`", which is already stale against its own
   `docs/**` glob and goes staler with three root files added. Widen it to name the
   governing-doctrine set (`CLAUDE.md`, `SPEC.md`, `README.md`, `CONTRIBUTING.md`) plus `docs/**`,
   and **preserve** the existing `:13-16` paragraph recording why this is a dedicated docs
   capability per `decision-lane-integration-9f3b`. Leave both nodes' remaining frontmatter
   untouched — in particular do **not** add a `created` key to `capability-spec-docs-8c1d`:
   `created` is not in `capability`'s `required_fields` (`node-types.yaml:56`), two of the six
   capabilities legally omit it, and adding one here would be a fabricated date on a 2026-06-15-era
   node.
5. **Scope 14.1 — author the ten `touches` edges**, appended to `specs/graph/edges.yaml` after the
   current tail (`edge-conveyor-selects-derived-9c30`, `:477-481`) or after this decomposition's
   `decomposes` edges if those landed first. Use the **pinned full convention** and `created:
   2026-07-28`. Five from `evidence-work-class-routing-f0a3`:
   `edge-touches-work-class-routing-spec-tooling-<4hex>` (`→ capability-spec-tooling-1a2b`,
   justified by that evidence's `:16-20`), `…-spec-schema-<4hex>` (`→ capability-spec-schema-2c3d`,
   `:21-25`), `…-spec-docs-<4hex>` (`→ capability-spec-docs-8c1d`, `:26-28`),
   `…-lifecycle-commands-<4hex>` (`→ capability-lifecycle-commands-4f5a`, `:29-31`), and
   `…-spec-tests-<4hex>` (`→ capability-spec-tests-3a6e`, `:32`). Five from
   `evidence-critics-literal-panel-e2a7`, same five capability targets, justified by its `## Files
   landed` section `:24-30` (Lane A → tooling + schema + tests; Lane B → lifecycle commands; Lane C
   → docs + lifecycle commands). Record the per-edge justification in the PR body, not in the node
   files. Confirm `edges-endpoint-types` is satisfied by construction: `touches` is `evidence →
   capability` (`edge-types.yaml:48-50`) and all twenty endpoints are of those types.
6. **Scope 14.4 — capture the two follow-up intents.** Both `status: open`, `class: 2`, `created:
   2026-07-28`, `produced_by: "/capture-intent"`, body shaped on
   `intent-unbacked-addressed-guard-8c4e.md` (`## Problem` / `## Goal` / `## Source`).
   - **Malformed cutoff.** Problem: a present-but-malformed `comparison_required_from` (e.g.
     `2026-6-18`) makes `toDateString` return undefined and **silently disables** the
     `comparison-required` gate — a typo turns a class-3 gate off with no signal; the same hazard
     applies to `coverage_coherence_from` (`validation-rules.yaml:139`) and to a selected contract's
     `created`. Goal: distinguish "absent → intentionally disabled" from "present-but-malformed →
     likely a typo" and **red the graph** on the latter. Source: PR #10 (Phase 7) code review; state
     explicitly that this **reverses** `decision-critics-literal-panel-9c4f` directives 2 (`:28`)
     and 3 (`:29`), which chose the fail-open deliberately, so it is new intended behaviour needing
     its own contract and decision — not a patch to approved work. Note the verified gap that
     `tests/bad/malformed-node/` carries no `expected-errors.txt`.
   - **`/write-tests` on unlaned briefs.** Problem: `.claude/commands/write-tests.md:4-6` refuses
     any brief whose `lane` is not `test-verification`, so a class-≥1 **unlaned single** brief has
     no in-command route to independent verification. Goal: define what `/write-tests` does for an
     unlaned brief without weakening the separation-of-duties rule that verification is never
     written by the invocation that wrote the code under test. Source: contract
     `contract-conveyor-derived-4c8c` Out of scope 6, which routes it here under rule 5 and records
     the interim mitigation (A4's recoverable BLOCKED action, built in the `api-integration` lane).
7. **Scope 14.5 — author the `.gitignore` authorization.** A `decision` node on the
   `decision-graph-data-unowned-2f7b` shape: `decided_by: Samir Benzenine`, `created: 2026-07-28`,
   no `status`, **no edges** (the precedent node has zero edges — verified). The body must record:
   (a) that `.gitignore` is **intentionally unowned** by any capability; (b) the verified fact that
   **no live `capability.paths` glob matches `.gitignore`** — the six capabilities own
   `.github/workflows/**`, `.github/CODEOWNERS`, `.claude/commands/**`, `.claude/agents/**`,
   `CLAUDE.md`, `docs/**`, `specs/schema/**`, `tests/**`, `tools/**` and `package.json`, and none
   matches a repo-root dotfile; (c) *why* — `.gitignore` is repo hygiene, not a behavioural surface
   a path-owning capability would gate, and the contract's Out of scope 7 declines to create a
   repo-hygiene capability for it; (d) that this artifact **retroactively legitimizes an existing
   precedent**: `specs/nodes/evidence-lifecycle-thin-commands-8296.md:34-37` already records a
   `.gitignore` edit ("un-anticipated enabling change: the blanket `.claude/` ignore … was narrowed
   to `.claude/*` with negations") made with no capability owning the file; (e) that it is the
   durable dated authorization `/prepare-evidence`'s human-confirm branch points at for the
   `product-spec` lane's `!.claude/lanes/` negation (`.gitignore:10-12` is the deny-then-negate
   block); and (f) the dated attribution line. **Scope bound:** this artifact authorizes
   `.gitignore` only. It does not extend to the other unowned root files — see Non-scope.
8. **Scope 14.3 — run `/detect-drift 4` and record the verdict.** This step runs **after** steps 4
   and 5 and produces a recorded result either way.
   - **Determinism recipe, pinned.** PR #4 is merge commit `cc2004b` ("Phase 4: enforce spec-graph
     gates and human approval via GitHub Actions (approved brief to addressed intent) (#4)"); its
     base is `cc2004b^1`. **The naive invocation is wrong and the brief names the trap:**
     `tools/gitdiff.ts:126-135` diffs `<base>...HEAD` against the **current** HEAD, so
     `GATE_BASE=$(git rev-parse cc2004b^1)` run from this branch would judge every commit from PR #4
     to today, not PR #4. Checking out `cc2004b` instead fixes the diff but breaks the mapping:
     `tools/loader.ts:92` loads `process.cwd()/specs`, and **`cc2004b` contains zero `capability`
     nodes** (verified with `git ls-tree --name-only cc2004b specs/nodes/`), so every packet would
     vanish and every file land in `uncovered` — a vacuous verdict. The pinned recipe is a
     **worktree at `cc2004b` with the current `specs/` tree overlaid**: `git worktree add <dir>
     cc2004b`, copy the current `specs/` directory into it, then from `<dir>` run `GATE_BASE=$(git
     rev-parse cc2004b^1) node_modules/.bin/tsx tools/spec.ts drift-map`. This is correct because
     `git diff --name-only <base>...HEAD` is a **commit-to-commit** diff (working-tree state is
     irrelevant), so the file list is exactly PR #4's, while the capability set is the post-14.2
     one. Record the recipe, the two shas, and the pin in the verdict itself.
   - **Verified expectation, to check against — not to substitute for the run.** `git diff --stat
     cc2004b^1 cc2004b` lists 44 files: `.github/CODEOWNERS`, four `.github/workflows/*.yml`,
     `docs/branch-protection.md`, `eslint.config.js`, `package.json`, `pnpm-lock.yaml`,
     `specs/graph/edges.yaml`, three `specs/indexes/*.yaml`, seven `specs/nodes/*.md`, three
     `specs/schema/*.yaml`, twenty `tests/**` files, and five `tools/**` files. It touches **none**
     of the paths step 4 adds (no `SPEC.md`, `README.md`, `CONTRIBUTING.md` or `.claude/lanes/**`),
     so 14.2's widening is verifiably **immaterial to this particular verdict** — the pin exists for
     reproducibility and for the general claim, and this observation should be recorded rather than
     used to skip the pin. Expected `uncovered`: `eslint.config.js` and `pnpm-lock.yaml` (no
     capability owns either), plus the `specs/{nodes,graph,indexes}/**` files, which are the
     recorded intentionally-unowned set of `decision-graph-data-unowned-2f7b` and must be reported
     as such, not as a gap. Expected packets: all five capabilities, each already `linked` today.
   - **If drift is found:** create one `drift-finding` node (`status: open`; body states the changed
     behaviour, where it diverges from the linked contract/brief, and one of `update-spec | revert |
     accept-with-contract`) plus `flags` edges per `.claude/commands/detect-drift.md:31-36` — to
     **each affected capability and to the touching evidence** (`evidence-ci-gate-spec-tool-693d` is
     PR #4's evidence). Note that Scope 14.3's phrase "a `flags` edge" is a **minimum, not a cap**;
     the command's own step 5 requires both legs. `flags` is `drift-finding → [evidence,
     capability]` (`edge-types.yaml:52-56`) and needs no handler change. Frontmatter: `id`, `type`,
     `title`, `status` are required (`node-types.yaml:63`); add `created: 2026-07-28` and
     `produced_by: "/detect-drift"` as optional unvalidated provenance, matching live-graph house
     style — the `tests/fixtures/good-drift/…` example omits both because it is a minimal fixture.
     **A drift finding is a rule-5 event** (contract Behaviour 10): triage it against CLAUDE.md rule
     5 before proceeding, and do not widen this lane's scope to fix it.
   - **If no drift is found:** create **no node**. Record the explicit "no drift" verdict in this
     lane's `evidence` body — naming the recipe, both shas, the packet list, the `uncovered` list
     and the pinned run order — and carry it into the integration node's `compliance-verdict`
     section. **Discrepancy recorded:** there is no node type for "no drift", so the contract's "or
     an explicit 'no drift' note" branch has no graph home; the evidence body is that home, and the
     honest consequence is that the no-drift branch is prose-recorded, not edge-backed. Per
     `detect-drift.md:28-29`, `unlinked` packets and `uncovered` files are reported explicitly and
     are never folded into "no drift".
   - **This is the graph's first `drift-finding`** — zero exist today (verified: no `drift-finding`
     group in `specs/indexes/by-type.yaml`). If one is created, `by-type.yaml` gains a **brand-new
     group** sorted between `decision` (`:52-62`) and `evidence` (`:63-76`), and index regeneration
     in the same commit is **mandatory**, not optional.
9. **Regenerate indexes and validate, in the SAME commit.** Canonical instruction `pnpm spec:index
   && pnpm spec:validate`; in this PRoot environment pnpm/corepack are broken, so run
   `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate`.
   Both must exit 0. Run `index` a **second** time and confirm the output is byte-identical
   (`indexes-fresh`). **Do not commit on any red.** Expected index deltas: the `intent` group gains
   two ids; the `decision` group gains one; a `drift-finding` group appears iff step 8 created one;
   `incoming.yaml`/`outgoing.yaml` gain the ten `touches` entries (and any `flags` entries).
   `specs/schema/*.yaml` is not indexed, so steps 1-3 produce no index delta.
   `specs/indexes/` is regenerated by `spec:index` in this lane's commit — a derived artifact,
   never a lane claim and never hand-edited (CLAUDE.md); this lane's new nodes make regeneration
   **mandatory**, not optional — the first `drift-finding` adds a brand-new by-type group.
10. **Hand off to `/prepare-evidence` — do not author the evidence here.** This lane's evidence and
    its `touches → capability-spec-schema-2c3d` edge are what unblock the PR's `check-diff` gate
    (see Acceptance 4). Implementation stops at step 9.

## Non-scope

The six sibling lanes and what is specifically theirs. **No two lanes edit the same file.**

- **`domain-backend` (`brief-conveyor-resolver-3f7a`)** — `tools/**` and `package.json`: the new
  `tools/conveyor.ts` (`nextSteps`, `deriveStage`, `CONVEYOR_CLASS_ROUTING`), `tools/issue_sync.ts`,
  `tools/spec.ts`, `tools/indexer.ts` (`INDEX_FILES` → six), the A11 coverage-walk consolidation,
  `tools/driftmap.ts` (CC-10c). Carries A2, A5, A7's resolver rule, A8, A11, A12, CC-4, CC-5's seam,
  CC-6, CC-8, CC-10(c), CC-11, CC-14. **Cross-lane dependency, not a file this lane takes:** the
  historical-PR trap named in step 8 lives in `tools/gitdiff.ts:126-135` and `tools/loader.ts:92`;
  a `GATE_HEAD`/`--head` option that would make `/detect-drift <old-pr>` executable without the
  worktree overlay is **theirs to build or decline**, and this lane's pinned recipe deliberately
  needs no tool change so the lane is not blocked on that choice.
- **`data-migration` is not `api-integration` (`brief-conveyor-commands-c14d`)** — all fifteen
  `.claude/commands/*.md` chain files, including `detect-drift.md` and `write-tests.md`. This lane
  **runs** `/detect-drift` and **reads** `write-tests.md:4-6` to write a follow-up intent; it edits
  neither. A1, A3, A4, A7's command half, A14, A15/CC-7, A16, CC-1, CC-11 are theirs.
- **`observability-release` (`brief-conveyor-ci-6a9f`)** — `.github/workflows/**` and
  `.github/CODEOWNERS`. Carries A9, A16/CC-3, CC-5's scheduled trigger, and **CC-10a**, which adds
  `/specs/nodes/decision-*` to CODEOWNERS. **Sequencing note, not a claim on their file:** this
  lane's 14.5 authorization is a `decision-*` node, and `.github/CODEOWNERS:2` currently gates only
  `/specs/schema/`, `/specs/nodes/contract-*` and `/specs/nodes/override-*`. Whether the new
  decision node lands before or after CC-10a's rule is a review-order fact to surface at
  integration, not something either lane changes unilaterally.
- **`product-spec` (`brief-conveyor-lane-catalog-2d5b`)** — `.claude/lanes/**`, `.claude/agents/**`,
  and **`.gitignore`** (the `!.claude/lanes/` negation at `.gitignore:10-12`). This lane writes the
  durable authorization *about* `.gitignore` (14.5) but **never edits the file**; the
  `eligible_agents`/`default_agent` catalog fields that CC-9's live-graph leg checks are theirs, as
  are A10, CC-2, CC-16 and CC-10(d)'s `integration-reviewer.md` half.
- **`docs-spec` (`brief-conveyor-docs-9e31`)** — `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`,
  `docs/**`. **This lane widens the capability that will own three of those files (step 4) but edits
  none of them.** CC-13's two lifecycle-map gaps and CC-14's `CLAUDE.md:186` `includes`-target claim
  are theirs; the *single* "live intent" definition is this lane's, and `docs-spec` must **point at
  `node-types.yaml`'s anchor rather than restate it**. A7's governing-doc half, CC-10b, CC-10(d)'s
  doctrine half and CC-12 are theirs.
- **`test-verification` (`brief-conveyor-tests-4c86`)** — `tests/**`, written by `test-writer` via
  `/write-tests`, never by the invocation that implemented the code under test. **CC-9's live-graph
  `owner` leg is theirs, not this lane's**: this lane ships the field and its declared semantics;
  the assertion that an `owner` names an agent in its lane's `eligible_agents`, and that every
  `test-verification` brief carries `owner: test-writer`, is a drift-test leg. A13's union pin, A6,
  A12's pin, CC-2, CC-5, CC-8, CC-12, CC-15 and CC-16 are theirs, as is the
  `tests/fixtures/bad/malformed-node/expected-errors.txt` gap this lane only *cites* in a follow-up
  intent body.
- **Also out of scope for this lane, inside its own surface:** no edit to
  `specs/schema/validation-rules.yaml`, `specs/schema/edge-types.yaml` or `specs/schema/checks.yaml`
  — contract Scope 7 is `node-types.yaml` and says "nothing else is added"; no new validation rule,
  node type or edge type (Out of scope 1); no implementation of either follow-up intent (Out of
  scope 2 — that is Phase 10 Step 0); no rewrite of the five existing short-form `touches` edge ids
  at `edges.yaml:252-276`; and no hand-edit of `specs/indexes/**`, which is regenerated only.

**Coverage observation, recorded not taken.** Beyond `.gitignore` (which 14.5 authorizes), these
tracked paths are owned by **no capability** and named by **no Scope item** of this contract:
`.github/dependabot.yml` (the CI capability owns `.github/workflows/**` and `.github/CODEOWNERS`
only), `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `eslint.config.js`, `tsconfig.json` and
`pnpm-lock.yaml`. This lane does **not** widen a capability to absorb them and does **not** extend
the 14.5 authorization to cover them — either move would be silent scope drift under CLAUDE.md rule
5. Surface the list at integration; if it is to be resolved, that is a follow-up intent, not a quiet
edit here.

**A second coverage observation, same treatment.** `evidence-ci-gate-spec-tool-693d` carries
`touches` edges to `capability-ci-enforcement-3e4f` and `capability-spec-schema-2c3d` only
(`edges.yaml:122-131`), while PR #4's verified diff also spans `tools/**`, `package.json`,
`tests/**` and `docs/**` — so the historical `touches` set under-covers there too. Scope 14.1 names
exactly two evidences (`f0a3` and `e2a7`, the only two with **zero** `touches` edges today);
widening the backfill beyond them is out of scope for this lane.

## Cross-lane dependencies & integration expectation

- **This lane blocks two others on coverage.** Step 4's widening of
  `capability-lifecycle-commands-4f5a` to `.claude/lanes/**` is what lets the `product-spec` lane's
  eight catalog files be *owned* at all, and step 4's widening of `capability-spec-docs-8c1d` to
  `SPEC.md`/`README.md`/`CONTRIBUTING.md` is what lets the `docs-spec` lane's root-doc rewrites
  resolve to a capability. Without step 4 those two lanes' evidence `touches` sets are incomplete
  and their diffs contain files no capability owns — the coverage gap CLAUDE.md requires to be
  resolved in the **same PR**, never ignored.
- **This lane blocks `domain-backend` and `docs-spec` on a definition.** The single "live intent"
  definition (step 3) is the anchor `tools/conveyor.ts` implements and `CLAUDE.md` points at. Both
  must **cite** it; neither may restate it, or CC-13's "define once" is defeated.
- **This lane depends on no other lane for its own green validate.** All three `node-types.yaml`
  edits are comment-level, and every graph write is additive: ten `touches` edges over existing
  endpoints, two widened `paths` lists, three or four new nodes. Nothing here requires
  `tools/conveyor.ts`, the lane catalog, or any command edit to exist.
- **One soft ordering dependency to state at integration:** step 4's `.claude/lanes/**` glob names a
  directory the `product-spec` lane creates. A capability may legally own a glob matching no file
  today (`capability-paths-shape` checks list shape, not existence), so this is not a blocker — but
  if `product-spec` collapses, the glob owns nothing and should be revisited rather than left as a
  silent no-op.
- **Integration expectation.** This laned brief reaches **`implemented`** via **this lane's own
  final `evidence`** (`evidence —evidences→ brief-conveyor-schema-graph-8b2e`), while
  `intent-self-guiding-delivery-loop-6d79` stays **`open`**. A laned brief's evidence implements the
  brief; it never addresses the intent. This decomposition creates **seven** briefs, so
  `contract-conveyor-derived-4c8c` is multi-brief and does **not** skip integration: it completes
  **only** via a final `integration` node (authored by `/integrate`) that `integrates` a final
  evidence for **every live lane** — enforced by the `coverage-coherence` rule, whose `2026-06-18`
  cutoff (`coverage_coherence_from`, `validation-rules.yaml:140`) this 2026-07-27 contract is after.
  The intent reaches `addressed` only through that integration.
- **If a lane collapses** (its work proves unnecessary or folds into another), it is **superseded**
  per CLAUDE.md rule 3 — a `supersedes` edge from its successor, the collapsed brief moved to its
  terminal status — and the integration node covers only the lanes that remain live. A collapsed
  lane is **never** forced into a ceremonial integration.
- **CC-10(d) discharge key.** The final integration node's `compliance-verdict` section enumerates
  all 32 items (CC-1 … CC-16 and A1 … A16) and names each one's discharging brief. This brief's
  entries are **CC-9** (the field; its live-graph leg is `test-verification`'s), **CC-13** (the
  single "live intent" definition; its lifecycle-map half is `docs-spec`'s) and **A13**'s lane-name
  correction naming `data-migration` as the catalog lane.

## Acceptance & verification (scoped to this lane)

Scoped to the schema and graph-data surface this lane owns. The `test-verification` lane owns all
test code; this lane states what its slice must satisfy and verifies it with the real CLI.

1. **Schema edits landed and green (contract Scope 7).** `node-types.yaml`'s `brief` block documents
   an optional `owner` — unvalidated, absent-means-unassigned, **not** in `required_fields`, with no
   validation rule authored; the `intent` block carries the single "live intent" definition; and a
   grep of the whole file for any lane name returns **zero** hits. `spec:validate` is green and the
   rule count is **unchanged** — a changed rule count would mean this lane added a rule, which Out
   of scope 1 forbids.
2. **All five Scope-14 sub-items are present or explicitly resolved.** 14.1: `touches` edges go from
   22 to **32**, with five from `evidence-work-class-routing-f0a3` and five from
   `evidence-critics-literal-panel-e2a7`, each to all five capabilities, all on the pinned full id
   convention. 14.2: `capability-lifecycle-commands-4f5a.paths` contains `.claude/lanes/**` and
   `capability-spec-docs-8c1d.paths` contains `SPEC.md`, `README.md`, `CONTRIBUTING.md`, with the
   latter's singular body claim widened. 14.3: **either** a `drift-finding` node with its `flags`
   edges exists, **or** this lane's evidence carries the explicit "no drift" verdict with the
   recipe, both shas, the packet list and the `uncovered` list — this is the acceptance criterion
   the compliance critique found missing, and a run with no recorded verdict fails it. 14.4: two
   `open`, `class: 2` intents exist, the malformed-cutoff one stating that it reverses
   `decision-critics-literal-panel-9c4f` directives 2 and 3. 14.5: one edgeless `decision` node with
   `decided_by` and a dated attribution line authorizes `.gitignore` as intentionally unowned.
3. **Migration safety — every change is additive and reds nothing.** Widening a capability's `paths`
   cannot narrow ownership; `capability-paths-shape` (`validation-rules.yaml:49-53`) stays green
   because both remain non-empty string lists. Ten new `touches` edges satisfy
   `edges-endpoint-types` by construction (`evidence → capability`). The comment-level
   `node-types.yaml` edits change no `required_fields` and no `status_values`, so no live node can
   newly fail `nodes-required-fields` or `nodes-status-in-enum`. Confirm on the real tree, not by
   argument.
4. **Self-application (contract Acceptance 7, with A13's lane-name correction).** This lane's diff
   touches `specs/schema/node-types.yaml`, and `specs/schema/**` is the **only** `sensitive_paths`
   glob (`validation-rules.yaml:126-127`) and a CODEOWNERS-gated path (`.github/CODEOWNERS:2`). Per
   `tools/checkdiff.ts:100-147` and `:63-98`, `check-diff` passes only when the PR **adds** an
   `evidences` edge whose evidence carries `touches → capability-spec-schema-2c3d` and whose brief
   `decomposes` an `approved` contract. So the PR **stays red until this lane's evidence and that
   `touches` edge land in the same diff** — and `contract-conveyor-derived-4c8c` is already
   `approved`, so the third leg holds. Read contract Acceptance 7's "the schema lane"
   (`4c8c.md:238`) as **`data-migration`**: `brief-lane-valid` rejects `schema` as a lane value.
   Also from Acceptance 7: this brief's body wraps at 100 columns.
5. **Index freshness and determinism (contract Acceptance 5's `spec:index` clause, scoped).**
   `node_modules/.bin/tsx tools/spec.ts index` then `… validate` both exit 0 in the same commit as
   the graph writes; a second `index` run is byte-identical. If step 8 created a `drift-finding`,
   `specs/indexes/by-type.yaml` carries a new `drift-finding` group between `decision` and
   `evidence` — the graph's first. `git status --short specs/` shows no hand-edited index.
6. **The `/detect-drift 4` run is reproducible, and its non-determinism is bounded not denied.** The
   recorded verdict names the pinned run order (last, after 14.1 and 14.2), the worktree-overlay
   recipe, `cc2004b` and `cc2004b^1`, and the verified fact that PR #4's 44-file diff touches none
   of the paths 14.2 adds. **Honest bound:** the verdict is a judgement about a fifteen-month-old
   diff mapped against a capability set seeded after it (contract Risk 6); the pin makes a re-run
   comparable, it does not make the verdict time-invariant.
7. **Scope integrity (CLAUDE.md rule 5).** If implementing this lane reveals the contract or this
   brief is wrong, do not absorb it: a wrong brief boundary is superseded by a corrected brief;
   missing scope with unchanged intended behaviour becomes a follow-up intent; and anything that
   changes intended behaviour stops and returns to human approval. A drift finding from step 8 is
   explicitly a rule-5 event (contract Behaviour 10). Nothing in this lane may widen the approved
   contract silently.
8. **Mutation discipline.** Every mutating step ends with `pnpm spec:index && pnpm spec:validate`
   (in this PRoot environment: `node_modules/.bin/tsx tools/spec.ts index` then
   `node_modules/.bin/tsx tools/spec.ts validate`) and **must not commit on red**.

Edge for graph-maintainer to record for this brief node: `brief-conveyor-schema-graph-8b2e
—decomposes→ contract-conveyor-derived-4c8c`, with this brief carrying `lane: data-migration` and,
per the bootstrap recorded above, **no `owner`**.
