---
id:      brief-critics-literal-panel-b5c6
type:    brief
title:   "Implement specialist critics + durable proposal comparison — comparison node/compares edge/comparison-required rule (atomic), nine bespoke critic agents, prose+command routing"
status:  implemented
created: 2026-06-18
---
This brief decomposes `contract-critics-literal-panel-1c4a` (status: approved, class 3), honoring the 7 binding directives in `decision-critics-literal-panel-9c4f`, which OVERRIDE any stale prose in the contract body — notably the contract's claim that the coverage predicate is "identical to `class_market_quorum`'s live-candidate predicate" (directive 1: that closure returns a *number*; coverage is genuinely NEW set logic) and its shown cutoff compare that normalizes only `C.created` (directive 2: normalize BOTH operands through `toDateString`). As a class-3 change this brief decomposes the work into three **lanes**; the per-lane patch market is available. It remains ONE brief node.

- **Lane A — Schema + validation gate (the atomic core):** the `comparison` node type, the `compares` edge type, the top-level `comparison_required_from` cutoff scalar, the loader read, and the new `comparison-required` validate rule (set-based coverage + dual-operand date grandfathering), plus tests. Ships as ONE atomic commit.
- **Lane B — Specialist critic panel:** nine bespoke standalone `.claude/agents/*-critic.md` files, authored from one pinned skeleton.
- **Lane C — Routing, command rewrites, CLAUDE.md:** the critic-routing-by-class table and surface→critic mapping as CLAUDE.md prose, the `/review-contracts` rewrite (per-class invocation, idempotency, class-3 count guard), and the `/approve-contract` decision-body update.

CODE steps (`specs/schema/**`, `tools/**`, `.claude/**`, `CLAUDE.md`, `tests/**`) are written by the implementer. There are **no graph-data writes in this brief**: this market is grandfathered (its three bootstrap candidate contracts are `created: 2026-06-17`, before the `2026-06-18` cutoff — even though the selecting decision `decision-critics-literal-panel-9c4f` is dated `2026-06-18`, the gate keys on the *selected contract's* `created`, per directive 2 / contract Shared-core item 3 / intent lines 57-61), so no `comparison` node or `compares` edge is authored for the real tree — the decision records this explicitly. The only graph write graph-maintainer records is the brief's own provenance edge `brief —decomposes→ contract-critics-literal-panel-1c4a`. All paths below are absolute. Line numbers are current-tree anchors; **re-confirm each before editing, since earlier edits in the same file shift them.**

## Grounding (reuse, don't reinvent)

- **Traversal + live-predicate model** — `/home/samir/workspace/pactwright/tools/handlers/class_market_quorum.ts`. Its header idiom (`const ruleId = String(rule.id); const byId = nodesById(spec); const findings: Finding[] = [];`, lines 22-24), its live-candidate predicate (iterate `spec.edges`; keep `type === "proposes"` with `target === intentId`; resolve `source` via `byId`, skip if unresolved, skip if `status === "superseded"` — lines 28-36), and its selects-walk (lines 40-76: iterate edges, `type === "selects"`, resolve target contract via `byId` skipping unresolved, gather proposed intents via `proposes` where `source === contractId`, read `intent.data["class"]` as a number, `typeof cls !== "number" || cls < 2` ⇒ continue, lines 64-65) are the scaffolding. **CRITICAL (directive 1):** its `liveCandidates` closure (lines 26-38) returns a NUMBER — do NOT reuse it for coverage; the new rule builds a Set of live proposing-contract ids.
- **Date normalization** — `/home/samir/workspace/pactwright/tools/gate.ts` line 42: `export function toDateString(value: unknown): string | undefined`. Single-arg; slices to 10 chars, validates `/^\d{4}-\d{2}-\d{2}$/` and round-trips through `Date.UTC` to reject impossible calendar dates; returns `undefined` on any malformed/non-date input. Import as `import { toDateString } from "../gate.ts";` (handlers live in `tools/handlers/`, so `../gate.ts` resolves to `tools/gate.ts`).
- **Loader exports** — `/home/samir/workspace/pactwright/tools/loader.ts`: `nodesById(spec): Map<string, NodeRecord>` (exported, lines 167-174, first declarer wins — do NOT reinvent); `asString` (lines 144-147, returns `undefined` for absent/empty/non-string); `NodeRecord` (`{ file, data, body }`, lines 5-12); `LoadedSpec` interface (lines 35-48; `sensitivePaths: string[]` at line 47); `Rule` (`{ id?, kind?, [param]: unknown }`, lines 29-33). The `sensitive_paths` LIST read is at lines 128-130 (`asList(...).map(asString).filter(...)`); directive 3 forbids cloning that shape for the new scalar.
- **Registry** — `/home/samir/workspace/pactwright/tools/validator.ts`: `HANDLERS: Record<string, Handler>` map (lines 24-34), `Handler = (rule: Rule, spec: LoadedSpec) => Finding[]` (line 22), `Finding = { rule, kind, subject, detail }` (lines 15-20). `runValidation` (lines 53-80) pushes an "unknown kind" finding when `HANDLERS[kind]` is undefined (lines 67-76) and runs rules in declared order — so a rule whose kind is unregistered reds the graph. This is why Lane A is atomic.
- **YAML** — never import `js-yaml` directly; use `/home/samir/workspace/pactwright/tools/yaml.ts` (`fromYaml`/`toYaml`, CORE_SCHEMA). Under CORE_SCHEMA an ISO `YYYY-MM-DD` value parses to a JS string and sorts lexically == chronologically.
- **Tests** — `/home/samir/workspace/pactwright/package.json` line 11 `"test": "node --test --import tsx tests/*.test.ts"` auto-globs any new `tests/*.test.ts`. The handler is a pure `(rule, spec) => Finding[]`, so prefer DIRECT UNIT TESTS over CLI fixtures, modeled on `/home/samir/workspace/pactwright/tests/class_market_quorum.test.ts`. For one-off CLI in this PRoot env, `pnpm` is broken (per environment memory): run `node_modules/.bin/tsx tools/spec.ts <cmd>`.
- **Agent skeleton** — `/home/samir/workspace/pactwright/.claude/agents/spec-critic.md` (26 lines): frontmatter `name`/`description`/`tools: Read, Grep, Glob` (lines 1-6); a six-step numbered prompt (locate via incoming.yaml / per-axis review / draft `## Critique` / critique every candidate / never select-or-rank / mutating-step reminder). `/home/samir/workspace/pactwright/.claude/agents/spec-writer.md` confirms the draft-only / writes-through-graph-maintainer convention. Both are read-only references — do NOT modify them.

## Pinned decisions (state these; they bind the implementation)

- **Lane A is ONE atomic commit (directive 4).** The `comparison` node type + `compares` edge type + `comparison_required_from` scalar + the `comparison-required` rule entry + the new handler file + its import + its `HANDLERS`-map registration + the loader change + index regeneration land together. A rule kind with no registered handler trips the unknown-kind finding (`validator.ts` lines 67-76) and `indexes-fresh` byte-compares the committed indexes against `serializeIndexes(spec)` — so schema-first staging is forbidden, exactly as in `brief-work-class-routing-9a1c`.
- **Coverage is NEW set logic, not a count (directive 1).** Build a Set of live (non-superseded) proposing-contract ids; resolve+dedupe `compares` targets; require `live ⊆ covered` AND ≥2 distinct resolved-and-qualifying `compares` edges. A `compares` edge to a superseded OR duplicate target is tolerated but does NOT count toward coverage; two `compares` edges to the same/superseded candidate MUST fail the ≥2 bar.
- **Both cutoff operands normalized, and the grandfather date is the SELECTED CONTRACT's `created` (directive 2; contract Shared-core item 3; intent lines 57-61).** `c = toDateString(C.created)` where `C` is the contract the `selects` edge targets, and `cut = toDateString(comparison_required_from)`; fail-open (skip) if EITHER is `undefined`; then `c < cut` ⇒ grandfathered (skip). Do NOT key the grandfather on the intent's `created` — the intent supplies only the routing `class` (per `class_market_quorum`'s precedent), while the cutoff predicate is the *contract's* `created`. A one-char cutoff typo disables the gate by skipping, never by silent mis-grandfathering.
- **Cutoff is a top-level SCALAR string (directive 3),** NOT list-shaped like `sensitive_paths`. Absent/empty/non-string ⇒ `undefined` ⇒ gate disabled. Read via `asString(rulesDoc["comparison_required_from"])`; do NOT clone the `asList(...).map(asString)` read.
- **`comparison` node carries no `status_values` and no `class` (directive 7).** `nodes-status-in-enum` skips status-less types (decision/override precedent); `nodes-class-in-range` is scoped `types: [intent, contract]` (validation-rules.yaml line 39). `compares` edge direction is comparison→contract. The comparison body STRUCTURE stays a command/graph-maintainer convention, never a validate rule.
- **Routing is PROSE + command logic only (CRITICAL out-of-scope).** No declarative critic-registry / routing-table data file, nothing pulling routing into the validated graph, and no validate rule resolving routing against `.claude/agents/` files. That is the decision's separate FOLLOW-UP intent.

---

## Lane A — Schema + validation gate (the atomic core)

This lane is the deterministic core: the `comparison` node type, the `compares` edge type, and the `comparison-required` rule enforcing set-based coverage with date grandfathering. Per directive 4 it MUST land as ONE atomic commit so the validator's unknown-kind backstop never reddens the graph mid-migration. It writes no production graph data: schema + tooling + tests only.

### (a) Files to create / modify

- MODIFY `/home/samir/workspace/pactwright/specs/schema/node-types.yaml` — add the `comparison` node type.
- MODIFY `/home/samir/workspace/pactwright/specs/schema/edge-types.yaml` — add the `compares` edge type.
- MODIFY `/home/samir/workspace/pactwright/specs/schema/validation-rules.yaml` — add the top-level scalar `comparison_required_from` and the `comparison-required` rule entry.
- MODIFY `/home/samir/workspace/pactwright/tools/loader.ts` — surface `comparison_required_from` as a new optional scalar on `LoadedSpec` and read it from the rules document.
- CREATE `/home/samir/workspace/pactwright/tools/handlers/comparison_required.ts` — NEW handler (directives 1 + 2).
- MODIFY `/home/samir/workspace/pactwright/tools/validator.ts` — import the handler and register `comparison_required` in `HANDLERS`.
- CREATE `/home/samir/workspace/pactwright/tests/comparison_required.test.ts` — NEW direct-unit matrix.
- CREATE `/home/samir/workspace/pactwright/tests/loader.test.ts` — add `comparison_required_from` present/absent/empty/non-string cases (no loader test file exists today — confirmed; create it; see step 8).
- REGENERATE (do not hand-edit) `/home/samir/workspace/pactwright/specs/indexes/*.yaml` (`by-type.yaml`, `incoming.yaml`, `outgoing.yaml`, `unresolved.yaml`) via `spec:index`, in the same commit so `indexes-fresh` stays green.

### (b) Script / test entries and libraries reused

- No new package scripts. `tests/comparison_required.test.ts` and `tests/loader.test.ts` are auto-globbed by `package.json` line 11.
- Reuse only: `toDateString` from `tools/gate.ts`; `asString`, `nodesById`, `LoadedSpec`, `Rule` from `tools/loader.ts`; `Finding` from `tools/validator.ts`; `js-yaml` only via `tools/yaml.ts`; `node:test` + `node:assert/strict`. The traversal scaffolding is modeled on `class_market_quorum.ts`, but the coverage predicate is written fresh (directive 1).

### (c) Ordered implementation steps

1. **Node type (`node-types.yaml`).** Under the `node_types:` map key (line 11), add a sibling block, mirroring the status-less/class-less `decision` precedent (lines 32-36):
   ```yaml
   comparison:
     # A durable, regenerable record of one proposal market: the trade-off table
     # and per-perspective critic findings for the live candidates of one intent.
     # Status-less and class-less by design (directive 7): authored fresh by
     # /review-contracts, never lifecycled, never class-routed.
     required_fields: [id, type, title, created]
     requires_body:   true
   ```
   Deliberately NO `status_values`, NO `class`. Validates clean: `nodes-status-in-enum` (`enum_constraint` on `status`) skips any type lacking `status_values` (as for decision/override); `nodes-class-in-range` is scoped `types: [intent, contract]` (line 39), so `comparison` is never class-checked.

2. **Edge type (`edge-types.yaml`).** Under the `edge_types:` map key (line 8), add a sibling mirroring the `proposes` two-line shape (lines 9-11):
   ```yaml
   compares:
     source: comparison
     target: contract
   ```
   Direction is comparison→contract (directive 7). `edge_endpoint_types` validates `source`/`target` against `node_types` keys, so this depends on step 1 landing in the same commit.

3. **Validation rules + cutoff scalar (`validation-rules.yaml`).** Two edits in this one file:
   - Insert the rule entry BETWEEN `class-market-quorum` (lines 58-59) and `indexes-fresh` (lines 60-61, which MUST remain last) — after line 59, before line 60:
     ```yaml
       # A post-cutoff, selected (selects-edged) class-2+ intent must have a
       # comparison node whose `compares` edges cover EVERY live candidate and
       # number >=2 distinct resolved targets. Runs after class-market-quorum so
       # the live-candidate set is meaningful; the handler reads the cutoff
       # (comparison_required_from) and grandfathers contracts created before it.
       - id: comparison-required
         kind: comparison_required
     ```
     No params on the rule (the cutoff is top-level data, directive 3).
   - Add a NEW top-level SCALAR string sibling of `rules:` and `sensitive_paths:` (NOT a rule, NOT list-shaped). Place it near `sensitive_paths` (lines 67-68):
     ```yaml
     # The date from which the proposal-comparison gate is enforced. A selected
     # class-2+ intent whose SELECTED CONTRACT's `created` is strictly before this
     # is grandfathered (no comparison node required); absent or malformed =>
     # gate disabled.
     comparison_required_from: "2026-06-18"
     ```

4. **Loader: surface the scalar (`loader.ts`).** Two edits:
   - In the `LoadedSpec` interface (lines 35-48), add an optional field after `sensitivePaths` (line 47):
     ```ts
       /** Date string from schema/validation-rules.yaml `comparison_required_from`;
        * `undefined` when absent/empty/non-string. Read only by comparison_required. */
       comparison_required_from?: string;
     ```
   - In `loadSpec`, after the `sensitivePaths` list read (lines 128-130), add a SCALAR read (do NOT clone the `asList(...).map(asString)` shape — directive 3):
     ```ts
     // Scalar (not a rule, not a list): absent/empty/non-string => undefined => gate off.
     const comparison_required_from = asString(rulesDoc["comparison_required_from"]);
     ```
     Add it to the returned object literal (line 141): `return { root, nodes, edges, nodeTypes, edgeTypes, rules, checks, sensitivePaths, comparison_required_from };`. `asString` (lines 144-147) already returns `undefined` for absent/empty/non-string, satisfying the malformed-cutoff fail-open path.

5. **Handler (`tools/handlers/comparison_required.ts`, NEW).** Signature `export default function comparisonRequired(rule: Rule, spec: LoadedSpec): Finding[]`. Imports: `{ toDateString } from "../gate.ts"`; `{ asString, nodesById, type LoadedSpec, type Rule } from "../loader.ts"`; `type { Finding } from "../validator.ts"`. Header idiom copied from `class_market_quorum.ts` lines 22-24 (`const ruleId = String(rule.id); const byId = nodesById(spec); const findings: Finding[] = [];`). Logic, in order:
   - **Cutoff normalization (directive 2, fail-open):** `const cut = toDateString(spec.comparison_required_from);` If `cut === undefined`, `return findings;` (empty) — gate disabled / cutoff malformed.
   - **Live-candidate Set builder (directive 1, NEW — Set not number):** a closure `liveCandidateSet(intentId: string): Set<string>` that iterates `spec.edges`, keeps `type === "proposes"` with `target === intentId`, resolves `source` via `byId` (skip if unresolved — `references_resolve` owns it), skips when `status === "superseded"`, and adds the surviving `sourceId` to a `Set<string>`. Replicates the live predicate of `class_market_quorum.ts` lines 28-36 but COLLECTS ids rather than counting.
   - **Covered-set + count builder (directive 1, NEW):** for a given `intentId`, iterate `spec.edges` for `type === "compares"`; resolve both endpoints via `byId`; skip if either is unresolved (defensive, matrix (h)); count a target toward coverage ONLY if (i) that target contract has a `proposes` edge to `intentId` (this ties the comparison to the intent WITHOUT a routing table) AND (ii) the target is live (`status !== "superseded"`). Collect qualifying target ids into a `Set<string>` (`covered`); the distinct count of qualifying targets is `comparesCount` (a `compares` edge to a superseded or duplicate target is tolerated but does NOT increase `comparesCount`, so two edges to the same/superseded candidate cannot reach 2 — directive 1).
   - **selects-walk (reuse `class_market_quorum.ts` lines 40-76):** iterate `spec.edges`; `type === "selects"`; resolve target contract `C` via `byId` (skip if unresolved — matrix (h)); gather proposed intent ids via `proposes` where `source === contractId`; for each resolved intent read `intent.data["class"]`; `if (typeof cls !== "number" || cls < 2) continue;` (class read off the INTENT, matching `class_market_quorum` precedent — matrix (e)).
   - **Grandfather check (directive 2, both operands normalized, keyed on the SELECTED CONTRACT's `created`):** `const c = toDateString(C.data["created"]);` where `C` is the resolved `selects` target contract. If `c === undefined`, `continue;` (fail-open, matrix (f)). If `c < cut`, `continue;` (the selected contract predates the cutoff — grandfathered, matrix (d)). `cut` is already normalized once outside the loop. Do NOT read `intent.data["created"]` for this compare — the intent supplies only the class; the cutoff predicate is the contract's `created` (contract Shared-core item 3; intent lines 57-61).
   - **Coverage assertion (directive 1):** build `live = liveCandidateSet(intentId)`; build `covered`/`comparesCount` for the intent. VALID iff every member of `live` is in `covered` (`live ⊆ covered`) AND `comparesCount >= 2`. Otherwise push ONE finding: `rule: ruleId`, `kind: "comparison_required"`, `subject: intentId`, with a `detail` naming whether coverage or the ≥2 bar failed and which live candidate(s) are uncovered, e.g. `intent ${intentId} (class ${cls}) is selected post-cutoff (selected contract ${contractId} created ${c}) but its comparison covers {covered ids} of live candidates {live ids} with ${comparesCount} distinct compares edge(s) (>=2 covering required)`.
   - Return `findings`. No throws on any unresolved/missing endpoint — every resolution failure is a `continue`/skip (matrix (h)).

6. **Register the handler (`validator.ts`, SAME commit — directive 4).** Add `import comparisonRequired from "./handlers/comparison_required.ts";` to the import block (after line 13) and `comparison_required: comparisonRequired,` to the `HANDLERS` map (after line 33). Must be the identical commit as step 3's rule entry.

7. **Handler unit tests (`tests/comparison_required.test.ts`, NEW).** Follow the `class_market_quorum.test.ts` idiom: `node(data)` helper → `{ file, data, body: "x" }`; `spec(nodes, edges, comparison_required_from?)` builds a synthetic `LoadedSpec` literal (`{ root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [], comparison_required_from }`) — the new field is OPTIONAL so the existing literal stays valid; set it explicitly here (e.g. `spec(nodes, edges, "2026-06-18")`). `const RULE: Rule = { id: "comparison-required", kind: "comparison_required" };`. Factories: reuse `intent(id, cls)`, `contract(id, status)` — and give the SELECTED contract a `created` field where the cutoff is exercised (the grandfather keys on the contract's `created`, not the intent's), `proposes(source, target)`, `selects(id, target)`; ADD `comparison(id)` → `node({ id, type: "comparison" })` and `compares(id, source, target)` → `{ id, source, type: "compares", target }`. The handler reads the cutoff from `spec.comparison_required_from` (directive 3), so tests set it on the spec literal. Required matrix (each one test):
   - (a) post-cutoff (selected contract `created >= cutoff`) class-2 selected, no comparison → 1 finding (subject = intent id).
   - (b) comparison covering BOTH live candidates with ≥2 distinct `compares` → `[]`.
   - (c) comparison covering only 1 of 2 live candidates → 1 finding (coverage, not count).
   - (d) selected contract `created` strictly before cutoff → `[]` (grandfathered skip); explicitly assert this is keyed on the CONTRACT's `created`, e.g. a post-cutoff intent date with a pre-cutoff selected contract still grandfathers.
   - (e) class-1 selected intent → `[]` (no quorum; class read off the intent).
   - (f) cutoff absent/empty/non-string → `[]`; AND selected contract `created` malformed/absent → `[]` (fail-open).
   - (g) a `superseded` candidate is excluded from `live` AND a `compares` edge to it does not count toward coverage → finding when that leaves <2 covering edges.
   - (h) two `compares` edges to the SAME target → does not reach ≥2 → finding; AND an unresolved `selects`/`compares` endpoint → `[]` (assert the direct call does not throw).

8. **Loader test (`tests/loader.test.ts`, NEW — no loader test exists today).** Create following the `node:test`/`assert/strict` idiom. Because `loadSpec` reads from disk, either point it at a tmp fixture root (write a minimal `specs/` tree under a `node:os.tmpdir()` dir, as `spec.test.ts` does via `spawnSync` against fixtures) or, more simply, assert the loader's documented semantics by constructing a `validation-rules.yaml` doc and exercising the same `asString(rulesDoc["comparison_required_from"])` read the loader uses (the field is `undefined` for absent/empty/non-string by `asString`'s contract, lines 144-147). Cover: `comparison_required_from` present → exact string; absent → `undefined`; empty `""` → `undefined`; non-string (number/list) → `undefined`.

9. **Regenerate indexes + validate, SAME commit (directive 4).** Run `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate` (canonical instruction: `pnpm spec:index && pnpm spec:validate`; `pnpm`/corepack are broken in this PRoot env). No `indexer.ts` change is needed — `buildIndexes` derives `by-type` generically from each node's `type` (indexer.ts lines 55-61), so a `comparison` group auto-appears once such nodes exist, and `compares` edges flow into `incoming.yaml`/`outgoing.yaml` generically (lines 63-76); for THIS commit none exist, so indexes regenerate with no `comparison`/`compares` entries and `indexes-fresh` stays green. Then run `node --test --import tsx tests/*.test.ts`. Do NOT commit on any red.

### (d) Lane A explicit Non-scope

- No agent files, no `/review-contracts`/`/approve-contract` edits, no `CLAUDE.md` prose (Lanes B and C).
- No declarative critic-registry/routing-table data file; nothing pulling routing into the validated graph; no rule resolving routing against `.claude/agents/` files (decision follow-up intent).
- No validation of the `comparison` BODY structure (directive 7; no body-section-validation precedent among data rules).
- No `indexer.ts` change and no new package.json script.
- No authoring of any `comparison` node or `compares` edge for the live tree (grandfathered). Lane A produces ZERO `comparison-required` findings on the current real tree.
- No reuse of `class_market_quorum`'s `liveCandidates` count for coverage (directive 1) and no rule param for the cutoff (top-level data, directive 3).
- No keying the grandfather on the intent's `created` (directive 2: it is the selected contract's `created`).

---

## Lane B — Specialist critic panel (nine bespoke named agents)

This lane creates nine standalone critic agent files, each attacking candidate contracts from one perspective. At authoring time it depends on nothing in Lane A or C (flat markdown, writable in parallel), but the nine files must remain skeleton-parity, so they are authored from one pinned template. Routing (which class invokes which critics) lives entirely in Lane C; this lane writes no routing logic and no shared data file. The patch market is available.

### (a) Files to create / modify

All NEW, all under `/home/samir/workspace/pactwright/.claude/agents/`:

1. `product-critic.md`
2. `ux-critic.md`
3. `architecture-critic.md`
4. `security-privacy-critic.md`
5. `compliance-risk-critic.md`
6. `qa-test-critic.md`
7. `reliability-ops-critic.md`
8. `cost-maintainability-critic.md`
9. `release-critic.md`

Read-only reference (do NOT modify): `/home/samir/workspace/pactwright/.claude/agents/spec-critic.md` (26-line skeleton source) and `/home/samir/workspace/pactwright/.claude/agents/spec-writer.md` (draft-only / writes-through-graph-maintainer convention).

### (b) Script / test entries and libraries reused

- No `package.json` scripts, no test files, no libraries. Agent files are not loaded by `tools/spec.ts` and are validated by no rule — agent-body content is never machine-checked (contract Risk "Nine-file drift"; decision "Residuals accepted"). This is deliberate per the CRITICAL out-of-scope: no validate rule resolves routing or skeleton parity against `.claude/agents/`.
- Reused artifact (not code): the `spec-critic.md` boilerplate is the single source for the shared skeleton (steps 1, 3, 4, 5, 6), copied verbatim per file (prompt files have no include mechanism).
- Verification is manual (contract "Agent shape check"): each file must parse with `name`/`description`/`tools: Read, Grep, Glob` frontmatter and carry the draft-only / never-select / writes-via-graph-maintainer skeleton; a manual diff of the nine confirms no drift. Pin the shared boilerplate (step 1) so the diff is a literal byte-comparison of every line except the step-2 block and the frontmatter `name`/`description`/`## Critique` label.

### (c) Ordered implementation steps

**Step 1 — Pin the shared skeleton template (the anti-drift artifact).** Before writing any file, fix this exact template. Every one of the nine files is this template with ONLY the marked `<<...>>` slots substituted. This pinning is the mitigation the contract Risk "Nine-file drift" demands; reviewers diff against it.

```
---
name: <<critic-name>>
description: <<one-sentence perspective focus>>. Reviews candidate
  contracts from the <<perspective>> perspective only. Drafts critiques
  only — all graph writes go through graph-maintainer.
tools: Read, Grep, Glob
---
You review candidate contracts from the <<perspective>> perspective only,
per CLAUDE.md. You never write to specs/nodes/ or specs/graph/edges.yaml —
you return one drafted `## Critique` per candidate and hand all writes to
graph-maintainer.
On invocation: 1) locate every candidate contract for the given intent
through specs/indexes/incoming.yaml (the `proposes` edges pointing at it),
reading only the named node files;
2) <<PER-AXIS REVIEW BLOCK — the only substantive variation between the
nine files; see step 3>>
3) draft one `## Critique (<<perspective label>>)` section per candidate
for graph-maintainer to append verbatim to that node's body — name
concrete failure scenarios on your axis, not generalities;
4) critique every candidate, including the one you'd expect to win;
5) never select or rank candidates;
6) remind the caller that appending critiques mutates the graph: the step
ends with `pnpm spec:index && pnpm spec:validate` and must not commit on
failure.
```

Binding notes to the real `spec-critic.md` (lines 1-26): frontmatter shape mirrors lines 1-6; the "You review … never write … hand all writes to graph-maintainer" opener mirrors lines 8-10; numbered steps 1/3/4/5/6 mirror spec-critic's 1/3/4/5/6 in intent; spec-critic's generic step 2 (ambiguity / missing cases / scope creep, lines 14-18) is REPLACED per file by the specialized per-axis block. The step-6 reminder text must match spec-critic lines 23-25 exactly. Step 5 must read "never select or rank candidates" with NO "unless explicitly asked to rank" clause — that softening exists only in spec-critic.md line 22; do not copy it here, since the comparison's purpose is to NOT rank.

**Step 2 — Confirm the perspective focus line per critic.** Each file's `description` and `<<perspective>>` substitution use exactly this one-line focus:

- `product-critic` — product / user-value: does the candidate solve the intent's actual user problem, or a proxy; is the value claim falsifiable.
- `ux-critic` — user-experience / interaction surface: confusing flows, unstated states, accessibility and error-path gaps.
- `architecture-critic` — system structure / boundaries: coupling, schema-and-service-boundary fit, extensibility debt, abstraction mismatch.
- `security-privacy-critic` — security and privacy: trust boundaries, data exposure, authz/authn gaps, secrets, injection and abuse paths.
- `compliance-risk-critic` — regulatory / legal / policy risk: retention, consent, auditability, jurisdictional and contractual obligations.
- `qa-test-critic` — testability and verification: untestable claims, missing acceptance coverage, oracle gaps, flaky or manual-only checks.
- `reliability-ops-critic` — runtime reliability and operations: failure modes, idempotency, rollback, observability, blast radius.
- `cost-maintainability-critic` — long-run cost and maintainability: duplication, drift surfaces, ongoing operational and cognitive cost.
- `release-critic` — release / rollout: migration safety, sequencing, backward compatibility, feature-flag and rollback strategy.

**Step 3 — Write the per-axis review block (step-2 slot) for each file.** This is the only place the nine files diverge in body. For each critic, the block is a short numbered list naming, on that axis specifically: (i) the concrete missing-cases it hunts, (ii) the concrete risks it hunts, and (iii) the strongest-argument-against-the-candidate it must articulate. Phrase as imperatives demanding named scenarios (mirroring spec-critic.md line 17). Example for `security-privacy-critic` (author the analogous block for each of the other eight against its own focus line):

```
2) review each candidate on the security and privacy axis only: a) name
   the trust boundaries the contract crosses and any input it accepts
   without naming who is trusted to send it; b) name every place
   personal or sensitive data is read, stored, logged, or transmitted
   and whether retention/exposure is bounded; c) name the concrete abuse
   or injection path a contract is silent on; d) state the single
   strongest security-or-privacy argument against approving this
   candidate as written;
```

Keep each file in the ~25-40 line band (contract distinguishing item 2). Do NOT import or reference a shared rubric (that is the rejected `contract-critics-named-thin-rubric` mechanism).

**Step 4 — Write all nine files** by substituting the slots into the step-1 template: frontmatter `name` (= filename stem), `description` (focus line from step 2), `<<perspective>>`/`<<perspective label>>` occurrences, and the step-3 per-axis block. The `## Critique` label inside step 3 must read `## Critique (<perspective>)` so Lane C's class-3 count-enumeration guard (directive 6) can assert one perspective-labelled `## Critique` per routed critic.

**Step 5 — Skeleton-parity diff (manual verification).** Diff the nine files against each other and against the step-1 template. Everything outside the frontmatter `name`/`description` and the step-2 block must be byte-identical across all nine (same step 1, 3-wrapper, 4, 5, 6 wording; same step-6 `pnpm spec:index && pnpm spec:validate` reminder). Any divergence outside the allowed slots is drift and must be corrected before the lane is done. This satisfies the contract's "Agent shape check."

**Step 6 — Graph writes for this lane: none.** Per CLAUDE.md rule 1 and the spec-writer convention, these are agent prompt files, not graph nodes — no nodes/edges for graph-maintainer to record for Lane B. (The `compares`/`comparison` graph objects these critics ultimately feed are authored by Lane C's command flow, not here.) Creating these files triggers no `spec:index`/`spec:validate` step, since `.claude/agents/` is outside the validated graph.

### (d) Lane B Non-scope

- No shared rubric document (each critic owns its full inline prompt; delegating to a shared rubric is `contract-critics-named-thin-rubric`'s rejected mechanism).
- No registry / data file and no parameterized single critic (nine bespoke standalone files, not one `specialist-critic` reading a critic-registry — that is `contract-critics-registry-driven`'s rejected mechanism, and a registry / routing-table data file is the decision's separate FOLLOW-UP intent).
- No routing logic — which class invokes which critics, the surface→critic mapping, and per-class invocation lists all live in Lane C. These files never reference work-class or routing.
- No validate rule, schema entry, loader/validator change, or test (agent-body content and skeleton parity verified by manual diff only).
- No `selects`/`ranks` behaviour — step 5 of the skeleton forbids it without exception.
- No modification to `spec-critic.md` or `spec-writer.md` (read-only references).

---

## Lane C — Routing, command rewrites, and CLAUDE.md

This lane wires the critic-routing taxonomy and the comparison mechanism as **prose plus command logic only**. It mutates no schema and no `tools/` code, and authors no routing data file. To be exercised end-to-end its commands depend on Lane A (the `comparison` node type, `compares` edge, and `comparison-required` rule must exist and validate green) and Lane B (the nine `.claude/agents/*-critic.md` files plus `spec-critic.md`); its CLAUDE.md edit may land independently. As a class-3 lane it is eligible for the per-lane patch market.

### (a) Files to create / modify

All paths absolute. No NEW files.

- **MODIFY** `/home/samir/workspace/pactwright/CLAUDE.md` — extend the existing `## Work-class routing` section (heading at line 81) with the critic-routing-by-class table, the surface→critic keyword mapping, the comparison mechanism, and the grandfathering rule. Placement context is the existing work-class routing table (its class-3 row is line 94) and the `class-market-quorum` paragraph (lines 96-102).
- **MODIFY** `/home/samir/workspace/pactwright/.claude/commands/review-contracts.md` — full rewrite (current file 10 lines; the inline "Act as spec-critic" at lines 6-7 is replaced by real per-class subagent invocation).
- **MODIFY** `/home/samir/workspace/pactwright/.claude/commands/approve-contract.md` — targeted update (current file 18 lines; keep the class-market-quorum pre-check at lines 8-11 verbatim; extend only the decision-body requirements at lines 12-16).

### (b) Script / test entries and libraries reused

- No new scripts, tests, or libraries. Command and CLAUDE.md files are prose consumed by the agent runtime, not validated by `spec:validate` and not unit-tested (no body-section-validation precedent — directive 7).
- The normative source for the surface→critic mapping is **CLAUDE.md**; `/review-contracts` quotes it inline (contract Risk "CLAUDE.md / command routing divergence" mitigation). The two encodings are deliberately unenforced free text — the accepted trade-off in `decision-critics-literal-panel-9c4f` ("Residuals accepted") and the follow-up intent, not a defect this lane closes.
- The class-3 full-panel set is the nine files Lane B authors (plus `spec-critic` always).
- The `## Critique` label convention and "draft only / never select or rank / all writes via graph-maintainer / end-of-step `pnpm spec:index && pnpm spec:validate`" boilerplate are reused from `spec-critic.md` so the command's expectations match the agents Lane B ships.

### (c) Ordered implementation steps

1. **CLAUDE.md — add the critic-routing-by-class table** as a new subsection inside `## Work-class routing` (after the existing routing table whose class-3 row is line 94, near the `class-market-quorum` paragraph at lines 96-102). Write it as PROSE (markdown table or bullets), not a data file. Map exactly:
   - **Class 0–1** ⇒ `spec-critic` only.
   - **Class 2** ⇒ `spec-critic` + the specialists whose surface the candidates' declared `## Scope` touches, via the surface→critic mapping (step 2).
   - **Class 3** ⇒ `spec-critic` + the **full nine-critic panel**, regardless of surface.
   State that the candidates' `## Scope` prose is the routing input for class 2, and that when scope is ambiguous the router errs toward **more** critics, never fewer (contract Risk 4 mitigation).

2. **CLAUDE.md — add the surface→critic keyword mapping** as the normative source, exactly (contract distinguishing item 2):
   - UI ⇒ `ux-critic`
   - payments / personal-data ⇒ `security-privacy-critic` + `compliance-risk-critic`
   - schema / service-boundary ⇒ `architecture-critic`
   - testing ⇒ `qa-test-critic`
   - runtime / ops ⇒ `reliability-ops-critic`
   - cost / maintainability ⇒ `cost-maintainability-critic`
   - release / rollout ⇒ `release-critic`
   - product / value ⇒ `product-critic`
   Note inline that any genuinely security/privacy/payments/compliance/production-sensitive or multi-surface change is **class 3 by the existing routing table** (line 94) and therefore gets the full panel regardless of this heuristic — the documented backstop for the class-2 free-text match (contract Risk 4; decision "Residuals accepted"). Per the decision's residual: surface a routed-but-empty axis DISTINCTLY from a not-routed axis so silence reads as "never looked," not "no concern."

3. **CLAUDE.md — add the comparison mechanism** as prose: `/review-contracts` produces exactly **one** `comparison` node per market (body sections: trade-off table / critic findings by perspective / the case against each candidate) with **one `compares` edge per candidate** (`comparison —compares→ contract`); the comparison is the **durable record** the `decision` cites and is **never superseded** by selection. State explicitly that the comparison body **structure is a command / graph-maintainer convention, not a validate rule** (directive 7, contract Shared-core item 7).

4. **CLAUDE.md — add the grandfathering rule** as prose, consistent with Lane A's `comparison-required` semantics: the `comparison_required_from` cutoff is `2026-06-18`; selections whose **selected contract was created before** the cutoff, and any class-≤1 selection, are **skipped** (grandfathered); there is **no backfill** and no comparison node is retro-fitted to a historical market. Add the cutoff-window caution from the decision: any **post-cutoff class-2 `selects`** (i.e. selecting a contract created on/after the cutoff) landing before/after this migration merges will immediately require a covering comparison.

5. **`/review-contracts.md` — rewrite the body.** Keep `description:` frontmatter. Keep the input contract (intent node id via `$ARGUMENTS`) and the step "locate candidate contracts via `specs/indexes/incoming.yaml` (the `proposes` edges pointing at it)". Then specify, in order:
   1. **Read the intent's `class`** (from the intent node) and **each candidate's `## Scope`** (read only the named candidate node files; do not glob `specs/nodes/`).
   2. **Route critics by class + scope** using the per-class lists below, drawing the surface→critic mapping inline from CLAUDE.md (quote the mapping so the command is self-contained; name CLAUDE.md as the normative source).
   3. **Invoke each routed critic as a REAL subagent** (replacing the inline "Act as spec-critic" at lines 6-7). Each critic drafts one perspective-labelled `## Critique` per candidate for graph-maintainer to append; `spec-critic` always runs.
   4. **Class-3 count-enumeration guard (directive 6):** after the panel runs and **before** graph-maintainer builds the comparison, assert that **one perspective-labelled `## Critique` per routed critic exists on each candidate — nine specialist perspectives (plus spec-critic) for class 3**. If any expected perspective is missing, stop and report the missing perspective(s) by name; do not build the comparison. (This catches a dropped perspective by count; bespoke agent bodies have no wrong-section substitution mode, so absence is the only failure to catch.)
   5. **Idempotency (directive 5):** before authoring, check `specs/indexes/incoming.yaml` for an existing `comparison` node targeting this market's candidates via `compares`. If one exists, instruct graph-maintainer to **REPLACE** it (regenerate its body and re-author its `compares` edges to the current live candidate set) rather than author a second comparison — a late candidate forces regeneration so coverage stays satisfied. Never leave two comparison nodes for one market.
   6. **graph-maintainer authoring:** create/replace **one** `comparison` node (body sections: trade-off table; critic findings by perspective; the case against each candidate) and **one `compares` edge per live candidate** (`comparison —compares→ contract`). Then regenerate indexes and validate; **nothing is committed on red**.
   7. End by **summarising the critiques and asking for a human decision**; **never select or rank**.

   **Per-class invocation lists** to write into the command:
   - **Class 0–1:** `spec-critic` only.
   - **Class 2:** `spec-critic` + specialists matched from each candidate's `## Scope` via the inline mapping (step 2); union across candidates; ambiguous scope ⇒ invoke more, not fewer.
   - **Class 3:** `spec-critic` + all nine specialists, regardless of scope.

6. **`/review-contracts.md` — pin the mutating-step reminder:** the graph-maintainer step ends with `pnpm spec:index && pnpm spec:validate` and **must not commit on failure** (matches the `spec-critic.md` skeleton, lines 23-25, and the contract Verification CI line).

7. **`/approve-contract.md` — update the decision-body requirements only.** Keep frontmatter and the input contract. **Keep verbatim** the class-market-quorum pre-check (lines 8-11: refuse a class-≥2 selection with fewer than two live candidates, citing the `class-market-quorum` backstop). Keep "do not write a brief" (line 18). Extend the graph-maintainer decision-authoring step (lines 12-16) so the **decision body MUST cite the `comparison` node id** for the market and **record the accepted trade-off plus why each rejected candidate lost** (contract Shared-core item 5; the decision's own "Why each rejected candidate lost" is the precedent shape). Add the grandfathering caveat: for a market whose selected contract is **pre-cutoff** or whose intent is **class-≤1** there is no comparison node to cite (as in `decision-critics-literal-panel-9c4f`'s own "Analysis of record"), so the citation requirement applies only to selections of post-cutoff class-≥2 contracts. Preserve the existing regenerate-indexes-and-validate step and the "nothing committed on red" reminder.

8. **Manual verification (no machine check exists for this lane):** record a `/review-contracts` transcript for a **class-2 UI intent** (acceptance example 6: invokes `spec-critic` + `ux-critic`, NOT the payments critics) and a **class-3 intent** (acceptance example 7: invokes `spec-critic` + all nine), confirming the invoked critic set matches the CLAUDE.md table and the command's inline mapping agree (contract Verification "Routing check"). Confirm an `/approve-contract` run on a market whose selected contract is post-cutoff class-≥2 produces a decision citing the comparison id (acceptance example 8).

### (d) Lane C explicit Non-scope

- No declarative routing table / critic-registry data file, in any format, anywhere. Routing is prose in CLAUDE.md + per-class invocation logic in `/review-contracts` — nothing more.
- No pulling routing into the validated graph — neither the surface→critic mapping nor the panel composition is loaded into `LoadedSpec` or referenced by any rule.
- No `spec:validate` rule over routing — nothing validates that the CLAUDE.md table and the command's invocation list agree, nor that each named perspective has a present `<name>-critic.md`. That cross-check is the separately-captured follow-up intent, deliberately NOT folded in.
- No comparison-body schema rule — the trade-off-table / by-perspective / case-against structure stays a command/graph-maintainer convention, never machine-checked (directive 7).
- No schema, loader, validator, handler, or agent-file changes (Lanes A and B).
- No removal of the class-market-quorum pre-check from `/approve-contract` — kept verbatim.
- No automated critic selection or ranking — selection stays a human decision recorded by a `decision` node citing the comparison.

---

## Commit ordering & atomicity

- **Lane A is ONE inseparable commit (directive 4).** The `comparison` node type, the `compares` edge type, the `comparison_required_from` scalar, the `comparison-required` rule entry, the new handler file + its import + its `HANDLERS`-map registration, the loader change, and index regeneration land together. The instant a rule kind has no registered handler, `runValidation` emits an "unknown kind" finding (`validator.ts` lines 67-76); and `indexes-fresh` byte-compares the committed indexes against `serializeIndexes(spec)`. Either alone reds the graph, so schema-first or rule-before-handler staging is forbidden. The rule slot is fixed: between `class-market-quorum` and `indexes-fresh` (which stays last).
- **Lane B is independent at authoring time** (flat markdown, no graph or tooling dependency) and may land in its own commit. All nine files should land together so the skeleton-parity diff (step 5) is meaningful in one reviewable unit.
- **Lane C depends on both A and B to be exercised end-to-end:** `/review-contracts` invokes the nine Lane-B agents and instructs graph-maintainer to build a `comparison` node + `compares` edges that only validate green once Lane A's schema and rule exist. Lane C's CLAUDE.md edit may land independently of the command rewrites.
- **Recommended order: A → B → C** (or one PR in which Lane A's pieces are committed atomically as above, then B, then C). Do not land Lane C's command rewrites before Lane A's schema, or a `/review-contracts` run would author `comparison`/`compares` graph objects the validator does not yet understand.
- **Cutoff-window note (from the decision).** The `2026-06-18` cutoff has arrived; this market's bootstrap candidate contracts (`created: 2026-06-17`) stay grandfathered — even though the selecting decision is dated `2026-06-18`, the gate keys on the *selected contract's* `created` — so the migration PR is green with no comparison node authored. But any **parallel post-cutoff class-2 `selects`** (selecting a contract created on/after `2026-06-18`) landing before this migration merges will instantly require a covering comparison once the rule is live — schedule accordingly and re-audit open selection PRs before merge.

## Non-scope (whole brief)

- **The follow-up-intent routing artifact is OUT of scope.** No declarative critic-registry / routing-table data file in any format; nothing pulling critic→surface routing or panel composition into the validated graph (`LoadedSpec` or any rule); no `spec:validate` rule resolving routing against `.claude/agents/` files (every named perspective has a present `<name>-critic.md`; a class-3 panel enumerates all nine; redden on disagreement). That combined artifact is the decision's separately-captured FOLLOW-UP intent — per CLAUDE.md scope-integrity rule 5 it is captured, not silently folded in. This contract's routing is PROSE in CLAUDE.md + per-class invocation logic in `/review-contracts` — nothing more.
- **No backfill and no writes to existing nodes.** The cutoff grandfathers every selection whose selected contract predates it; no comparison node is retro-fitted to a historical market, and no existing node's status or body is changed. The current real tree has 6 `selects` edges, and every one targets a contract `created ≤ 2026-06-17` — strictly before the `2026-06-18` cutoff (this includes the just-selected `contract-critics-literal-panel-1c4a`, itself `created: 2026-06-17`, whose selecting decision is dated `2026-06-18`; the gate keys on the contract's `created`, so it grandfathers). The migration therefore produces ZERO `comparison-required` findings; the live-vs-superseded coverage distinction (no contract→contract `supersedes` edge exists today) is exercised only by Lane A's synthetic tests.
- **No comparison-body-structure validate rule.** The trade-off-table / by-perspective / case-against structure stays a command/graph-maintainer convention; there is no body-section-validation precedent among the data rules, and inventing one is out of scope (directive 7).
- **No automated critic selection or ranking, ever.** Selection stays a human decision recorded by a `decision` node citing the comparison.
- **No new CI workflow.** `spec-validate.yml` already runs `spec:validate`; `comparison-required` rides it with no workflow edit.
- **No reuse of `class_market_quorum`'s `liveCandidates` count for coverage** (directive 1: it returns a number; coverage is a Set), and **no rule param for the cutoff** (directive 3: top-level scalar data).
- **No keying the cutoff grandfather on the intent's `created`** (directive 2: it is the selected contract's `created`).
- **No modification to `spec-critic.md` or `spec-writer.md`** (read-only references for shape and convention).

## Acceptance & verification

Maps to the contract's Acceptance examples (contract lines 62-69) and the directive-driven tests (contract Verification needs, lines 73-79; decision directives 1-6).

1. **Schema first, green (contract example 1).** After Lane A's migration commit, `pnpm spec:validate` is green; `comparison` appears in `node-types.yaml` (`requires_body: true`, no `status_values`, no `class`), `compares` in `edge-types.yaml`, `comparison_required_from: "2026-06-18"` as a top-level string in `validation-rules.yaml`, and a `comparison` group exists in `specs/indexes/by-type.yaml` (auto-derived; none authored yet, so the group is absent until the first comparison node — the migration PR has none).
2. **Loader surfaces the cutoff (contract example 2; directive 3).** `LoadedSpec.comparison_required_from === "2026-06-18"` on the real tree; deleting the key leaves it `undefined` and `comparison-required` emits zero findings (disabled). Loader test covers present → string, absent/empty/non-string → `undefined`.
3. **Post-cutoff class-2 selection blocked until a covering comparison exists (contract example 3; matrix (a)/(b)).** Handler test (a): selected contract `created >= cutoff`, class-2, no comparison → 1 finding naming the intent; (b): comparison covering both live candidates with ≥2 `compares` → 0 findings.
4. **Coverage, not mere count (contract example 4; directive 1; matrix (c)/(g)/(h)).** (c) comparison covering only 1 of 2 live → finding; (g) a `superseded` candidate excluded from `live` and a `compares` edge to it not counted → finding when that leaves <2 covering edges; (h) two `compares` edges to the same target → does not reach ≥2 → finding.
5. **Grandfathering and fail-open (contract example 5; directive 2; matrix (d)/(e)/(f)).** (d) selected contract `created` before cutoff → skip (keyed on the CONTRACT's created, asserted even when the intent date is post-cutoff); (e) class-1 selected → skip; (f) cutoff or selected-contract `created` absent/empty/non-string/malformed → skip (both operands through `toDateString`). Real-tree audit: all 6 existing `selects` edges resolve to contracts `created ≤ 2026-06-17` (strictly before the cutoff) → zero `comparison-required` findings; the migration PR stays green with no comparison node authored.
6. **Defensive resolution (matrix (h)).** An unresolved `selects`/`compares` endpoint is skipped, not thrown — asserted by a direct handler call.
7. **Ordering check (contract Verification).** `comparison-required` is listed after `class-market-quorum` and before `indexes-fresh` in `validation-rules.yaml`.
8. **Class-2 UI route invokes ux-critic, not the payments critics (contract example 6).** Manual `/review-contracts` transcript for a class-2 UI intent: `spec-critic` + `ux-critic`, NOT security-privacy/compliance critics; each invoked critic appends a perspective-labelled `## Critique` to every candidate.
9. **Class-3 invokes the full panel (contract example 7; directive 6).** Manual `/review-contracts` transcript for a class-3 intent: `spec-critic` + all nine; the count-enumeration guard confirms one perspective-labelled `## Critique` per routed critic before graph-maintainer builds the comparison.
10. **The comparison is the durable record (contract example 8; directive 5).** After review, exactly one `comparison` node exists for the market with one `compares` edge per candidate (re-runs REPLACE, never duplicate; a late candidate forces regeneration); its body carries the trade-off table, critic findings by perspective, and the case against each candidate; `/approve-contract`'s `decision` cites the comparison node id and records why each loser lost; the comparison is never superseded by selection.
11. **Agent shape check (contract Verification; Lane B).** The nine `.claude/agents/*-critic.md` files each parse with `name`/`description`/`tools: Read, Grep, Glob` frontmatter and a draft-only / never-select / writes-via-graph-maintainer skeleton matching `spec-critic.md`; a manual diff of the nine skeletons against the pinned template (Lane B step 1) confirms no drift outside the allowed `name`/`description`/per-axis slots.
12. **Routing check (contract Verification).** The recorded class-2 and class-3 transcripts confirm the command's inline mapping and the CLAUDE.md prose table name the same critic set (acknowledged unenforced free-text trade-off; the cross-check rule is the follow-up intent, not in scope).
13. **CI (contract Verification).** `spec-validate.yml` picks up `comparison-required` with no workflow edit; the mutating step ends with `pnpm spec:index && pnpm spec:validate` (in this PRoot env, `node_modules/.bin/tsx tools/spec.ts index` then `... validate`) and must not commit on failure. Run `node --test --import tsx tests/*.test.ts` green before committing.

Edge for graph-maintainer to record for this brief node: `brief —decomposes→ contract-critics-literal-panel-1c4a`.