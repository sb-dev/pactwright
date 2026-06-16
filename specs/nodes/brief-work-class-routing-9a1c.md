---
id: brief-work-class-routing-9a1c
type: brief
title: Implement work-class routing — class field, integer range rule, market-quorum invariant, backfill, CLAUDE.md routing + scope-integrity, class-aware commands
status: draft
created: 2026-06-17
---
This brief decomposes `contract-work-class-validate-invariant-c3d4` (status: approved), honoring the 7 binding corrections in `decision-work-class-routing-4d7a`, which OVERRIDE any stale prose in the contract body (notably the contract's now-dropped `2.0`-rejection claim and its status-blind candidate count). CODE steps below are written by the implementer; the 22-node `class` backfill is a GRAPH WRITE performed by graph-maintainer, the sole writer of `specs/nodes/` and `specs/graph/edges.yaml`. The ordering exists to keep `pnpm spec:validate` green: because making `class` a required field reds every intent/contract that lacks it, the schema edit and the full backfill are **one inseparable commit** — schema-first staging is forbidden. Steps are labelled CODE or GRAPH WRITE; Step 1 contains both because schema + handlers + rule entries + backfill ship atomically.

## Grounding (reuse, don't reinvent)

- **Range handler template** — `tools/handlers/list_field.ts`: type-filtered iteration over `spec.nodes`, `asString(node.data["type"])` to match types, `if (value === undefined || value === null) continue;` to skip absent fields (presence is `required_fields`' job), `asString(node.data["id"]) ?? node.file` for the subject. Model `class_range` on this exact shape.
- **Traversal handler template** — `tools/handlers/references_resolve.ts`: iterates `spec.edges`, reads endpoints with `asString(edge[field])`, builds a known-id set. Model the quorum walk on this.
- **Loader exports** (`tools/loader.ts`) — `nodesById(spec): Map<string, NodeRecord>` (real, exported; do NOT reinvent), `asString` (returns `undefined` for non-strings, so it must NOT be used to read the numeric `class`), `NodeRecord` (`{ file, data, body }`), `LoadedSpec` (`{ root, nodes, edges, nodeTypes, edgeTypes, rules, checks, sensitivePaths }`), `Rule` (`{ id?, kind?, [param]: unknown }`).
- **Registry** — `tools/validator.ts`: the `HANDLERS: Record<string, Handler>` map and `Handler = (rule: Rule, spec: LoadedSpec) => Finding[]`; `Finding = { rule, kind, subject, detail }`. `runValidation` already emits an "unknown kind" finding when `HANDLERS[kind]` is undefined and runs rules in declared order — so a rule whose `kind` is unregistered reds the graph.
- **YAML parsing** — `tools/yaml.ts` `fromYaml` uses `CORE_SCHEMA`. Under CORE_SCHEMA `class: 2` and `class: 2.0` both arrive as the JS number `2`; `class: "2"` is a string. This is the basis for correction 2.
- **Tests** — `pnpm test` runs `node --test --import tsx tests/*.test.ts`, which auto-globs any new `tests/*.test.ts`. The branchy handlers are pure `(rule, spec) => Finding[]`, so prefer DIRECT UNIT TESTS over CLI fixtures: construct a synthetic `LoadedSpec` literal in the test. Existing `tests/fixtures/**` carry their own schema copies, so editing the main `specs/schema/node-types.yaml` does not break those fixture-driven tests.

## Pinned decisions (state these; they bind the implementation)

- **One atomic commit.** The `node-types.yaml` schema edit + both new handlers + both new rule entries + the full 22-node backfill land together. The instant `class` is required, `tools/handlers/required_fields.ts` reds every intent/contract lacking it; and the quorum rule reads `intent.class`, so it must land at/after the backfill. A rule whose `kind` has no registered handler also reds the graph, so handler registration ships in the same commit as the rule entries.
- **Actor split.** `specs/schema/**`, `tools/**`, `.claude/**`, and `CLAUDE.md` are implementer CODE. The `specs/nodes/*.md` backfill is graph-maintainer's exclusive write, committed together with the schema edit.
- **Param name is `values`, not `allowed`.** Pin `values: [0, 1, 2, 3]` in both the handler read-path and the `validation-rules.yaml` rule entry. Read it as `rule.values`.
- **Backfill values (22 nodes = 9 intents + 13 contracts):** default `2`; `intent-capture-smoke-test-46d5` → `0` and `intent-capture-smoke-superseded-e7f8` → `0`; `intent-work-class-routing-b9c4` → `3`; `contract-work-class-validate-invariant-c3d4` → `3` (this contract self-revises from the inherited class to Class 3, rationale already in its body); rejected siblings `contract-work-class-command-discipline-a1b2` → `2` and `contract-work-class-approval-gate-e5f6` → `2`. Every other existing intent and contract → `2`.
- **`produced_by` is added NOWHERE** in `required_fields` and is referenced by NO rule. It is optional and unvalidated by omission; it is NOT backfilled.

## Step 1 — Schema + range rule + backfill (atomic; CODE + GRAPH WRITE)

1a. (CODE) `specs/schema/node-types.yaml`: add `class` to `required_fields` for `intent` and for `contract` only — i.e. `required_fields: [id, type, title, status, created, class]` on both. Add `produced_by` to no list. Add no `status_values` change.

1b. (CODE) Create `tools/handlers/class_range.ts` modeled on `list_field.ts`. It reads `rule.scope` (must be `nodes`), `rule.types` (a list, `[intent, contract]`), and `rule.values` (a list of numbers, `[0, 1, 2, 3]`); if any is malformed, emit the self-describing config finding like `list_field` does. Then iterate `spec.nodes`; skip a node whose `asString(node.data["type"])` is not in `types`. Read `const v = node.data["class"];` directly (NOT via `asString`). If `v === undefined || v === null`, `continue` — presence is `required_fields`' job. Otherwise emit a finding unless `typeof v === "number" && Number.isInteger(v) && values.includes(v)`. Consequences to pin: the string `"2"` fails (not a number), the float `2.5` fails (not an integer), `4`/`-1` fail (out of set); `2` PASSES and `2.0` PASSES (both parse to the integer `2` under CORE_SCHEMA). Explicitly DROP any rejection of `2.0` (correction 2). Detail text e.g. `node <id> field 'class' must be an integer in [0, 1, 2, 3]`.

1c. (CODE) In `tools/validator.ts`: `import classRange from "./handlers/class_range.ts";` and add `class_range: classRange,` to the `HANDLERS` map.

1d. (CODE) `specs/schema/validation-rules.yaml`: add exactly ONE rule — `id: nodes-class-in-range`, `kind: class_range`, `scope: nodes`, `types: [intent, contract]`, `values: [0, 1, 2, 3]`. Place it near the other node-field rules (e.g. after `nodes-status-in-enum`); it has no edge-traversal precondition.

1e. (GRAPH WRITE — graph-maintainer) Backfill `class` into all 22 nodes per the pinned values above. This is committed together with 1a–1d.

## Step 2 — Quorum invariant (same atomic commit; CODE)

Create `tools/handlers/class_market_quorum.ts` modeled on `references_resolve.ts` plus `nodesById`. Logic:

- Build `const byId = nodesById(spec);`.
- For each edge in `spec.edges` with `asString(edge["type"]) === "selects"`: resolve the target contract id via `asString(edge["target"])`. If the contract is absent from `byId`, defensively skip (do not throw) — this is the REAL guard, because `references_resolve` *reports* dangling endpoints but does not *remove* them, so rule ordering alone is insufficient.
- From the resolved contract, find its outgoing `proposes` edges (`type === "proposes"`, `source === <contract id>`) to get the intent(s) it proposes. If the selected contract has NO `proposes` edge at all, emit an explicit finding (never silent-pass), e.g. `selects edge <id> targets contract <cid> which proposes no intent`.
- For each proposed intent: resolve it via `byId`; skip defensively if absent. Read its `class` as a number (`const c = intent.data["class"]; typeof c === "number" && c >= 2`). If `class < 2` (or non-numeric), this intent imposes no quorum — continue.
- For a `class >= 2` intent, count the LIVE candidate `proposes` edges targeting it: edges with `type === "proposes"` and `target === <intent id>` whose SOURCE contract resolves in `byId` and whose source contract `status !== "superseded"` (correction 1 — this kills the superseded double-count; read status via `asString(sourceContract.data["status"])`). If the live count is `< 2`, emit a finding, e.g. `intent <id> (class <c>) has a selected contract but only <n> live candidate proposes edge(s) (>=2 required)`.
- A contract that proposes multiple intents is counted per-intent (correction 1).

Register `class_market_quorum` in `HANDLERS` (`import classMarketQuorum from "./handlers/class_market_quorum.ts";`, then `class_market_quorum: classMarketQuorum,`). In `validation-rules.yaml` add `id: class-market-quorum`, `kind: class_market_quorum`, placed AFTER `edges-references-resolve` and BEFORE `indexes-fresh` (which must stay last). Note the rule's first real subjects are the 5 existing `selects` edges; their selected contracts resolve to intents with live-candidate counts of 2/2/3/3/3 (`intent-spec-index-validate-a3f1`=2, `intent-claude-lifecycle-commands-f367`=2, `intent-ci-enforcement-gates-5c90`=3, `intent-drift-detection-c7b1`=3, `intent-work-class-routing-b9c4`=3) — all green. There is no contract→contract `supersedes` edge in the graph today, so the live-vs-raw distinction is not yet exercised by real data, but the handler must implement it for the first superseded contract created hereafter.

## Step 3 — CLAUDE.md routing table and scope-integrity rules (CODE)

Append a **Work-Class Routing** table to `CLAUDE.md` AFTER the `## Lifecycle` section, transcribing Class 0–3 with their obligations from `intent-work-class-routing-b9c4` (Class 0 trivial mechanical, may skip the proposal market, spec-critic only; Class 1 single-surface low-risk, one candidate permitted; Class 2 meaningful change, proposal market `>=2` candidates, specialist critics where touched; Class 3 high-risk/multi-surface, full critic panel, lane decomposition, patch market per lane, explicit human gates at selection and integration). State that contracts inherit the intent's class and may revise it with rationale recorded in the contract body. Add the **Scope-Integrity** rules from the intent within the `## Rules` section (brief-boundary-wrong → supersede the brief; contract-incomplete → spawn a follow-up intent; selected-work-changes-behaviour → return to human approval via a new decision node; no review silently absorbs scope drift). Frame the quorum guarantee honestly (correction 7): "an under-proposed class>=2 approval cannot stand in a green graph / cannot merge," backed by a preventive `/approve-contract` pre-check — NOT a literal pre-author block.

## Step 4 — Class-aware command edits (CODE)

In `.claude/commands/`:

- `capture-intent.md`: set/ask `class` — if the prompt did not supply a class, ask the human before graph-maintainer creates the node; pass the chosen integer into the new node's frontmatter.
- `propose-contracts.md`: read the intent's `class`; emit exactly 1 candidate for class 0–1 and `>=2` candidates for class 2–3.
- `write-brief.md`: READ the contract's `class` (to decide lane/patch applicability downstream). It only reads — no lane/patch tooling exists.
- `approve-contract.md`: add a preventive pre-check that REFUSES to author the `selects` edge when the target intent is `class >= 2` and has `< 2` live (non-superseded) candidate `proposes` edges. This is the normal-path first line; the Step 2 validate invariant is the unbypassable backstop for hand-edits.

## Step 5 — Tests (CODE)

Run via `pnpm test`. Prefer direct unit tests over CLI fixtures (the handlers are pure; build a synthetic `LoadedSpec` literal with the fields the handler reads — `nodes`, `edges`, and a `rules` entry).

- `tests/class_range.test.ts` (NEW): `0|1|2|3` pass; `2.0` passes (CORE_SCHEMA → integer `2`); `4`, `-1`, `"2"`, `2.5` each fail; absent `class` skipped (no finding); a non-intent/non-contract node carrying any `class` ignored.
- `tests/class_market_quorum.test.ts` (NEW): boundary 1 candidate → finding vs 2 candidates → no finding; a superseded-source `proposes` edge excluded from the count (2 raw → 1 live → finding); a `selects → contract` with no `proposes` edge → explicit finding; a contract proposing two intents counted per-intent; a `class < 2` selected intent → no finding; an unresolved endpoint defensively skipped, not thrown.

Note: existing `tests/fixtures/**` carry their own schema copies, so the main-schema edits in Step 1 do NOT break `pnpm test`.

## Acceptance (maps to the contract)

1. An intent file with no `class` frontmatter is rejected by `pnpm spec:validate` on rule `nodes-required-fields` (`node <id> missing required field: class`) — from `required_fields`, because `class` is now in the intent `required_fields`.
2. A `class: 0` intent runs end-to-end through one contract and one brief with no proposal market: it passes `nodes-class-in-range`, and `class-market-quorum` never fires for it (only `class >= 2`).
3. A `class: 3` intent with exactly one live `proposes` edge plus a `selects` decision fails `pnpm spec:validate` on rule `class-market-quorum` (`intent <id> (class 3) has a selected contract but only 1 live candidate proposes edge(s) (>=2 required)`); `/propose-contracts` refuses to emit a single candidate for class 3, and `/approve-contract` refuses to author the `selects` edge — the under-proposed approval cannot merge. Adding a second live candidate contract + its `proposes` edge flips the rule green.
4. Range rule: `class: 2` and `class: 2.0` PASS; `class: "2"`, `class: 2.5`, and `class: 4` each fail `nodes-class-in-range` with `node <id> field 'class' must be an integer in [0, 1, 2, 3]`.
5. Post-migration `pnpm spec:validate` is green graph-wide over all 22 backfilled nodes and all 5 `selects` edges (live-candidate counts 2/2/3/3/3).
6. `produced_by` set, empty, or entirely absent all pass `spec:validate` identically — no rule references it.

## Non-scope

- NO diff-aware gate; NO `tools/approval-gate.ts` (or any `tools/gate.ts`-style addition for this); NO new `spec:` subcommand; NO new CI workflow; NO edit to `pr-evidence.yml`. (This is rejected Candidate C — its gate is wired into `pr-evidence.yml`, which SKIPS specs-only PRs, so it would never fire on an approval PR.)
- NO lane or patch-market tooling — those commands do not exist; `write-brief` only READS the contract class.
- NO machine enforcement of the other routing obligations (specialist critic panel, lanes, human integration gates) — process and docs only.
- `produced_by` is NOT validated and NOT backfilled.

## Verification

- `pnpm spec:validate` green and `pnpm test` green after the single atomic migration commit.
- A scratch check proving atomicity: temporarily revert the 22-node backfill alone (keeping the schema edit) and confirm `nodes-required-fields` reds the graph — demonstrating schema-without-backfill cannot stand, so the two are inseparable.
- The `class-market-quorum` rule green across all 5 `selects` edges, and listed after `edges-references-resolve` and before `indexes-fresh` in `validation-rules.yaml`.
- The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is committed on red.
