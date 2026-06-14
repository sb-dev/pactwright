---
id: brief-drift-tool-assisted-d4ee
type: brief
title: Implement tool-assisted drift detection — schema migration, spec:check-diff + spec:drift-map, /detect-drift, drift-review (warn-only)
status: implemented
created: 2026-06-14
---

Decomposes `contract-drift-tool-assisted-7173` (approved), honoring the ten
grafts/amendments in `decision-drift-tool-assisted-d5e2`. Ordered so each step
keeps `pnpm spec:validate` green. CODE steps are written by the implementer;
`capability`/`touches` seeding and any runtime `drift-finding` creation are GRAPH
writes performed by graph-maintainer (sole writer of `specs/nodes/` +
`edges.yaml`) — called out where they occur.

## Grounding (what already exists — reuse, don't reinvent)

- `tools/spec.ts` — CLI dispatch (`index | validate | gate`). Add `check-diff`
  and `drift-map` to the subcommand union, USAGE, and exit-code doc.
- `tools/gate.ts` — the PR gate; contains the base-ref/diff machinery to REUSE:
  `resolveBase()` (`$GATE_BASE` else `git merge-base origin/HEAD HEAD`, with
  `rev-parse --verify`), `addedEdgeIds(spec, base)`, `addedNodeIds(spec, base)`
  (set-difference vs `git show`/`ls-tree` — never scrape +/- lines), the fail-
  closed `git()` spawnSync runner, and `toDateString()` for `expires`.
  `evaluateGate` is pure and unit-tested in `tests/gate.test.ts`.
- `tools/loader.ts` — `loadSpec()` → `LoadedSpec { nodes, edges, nodeTypes,
  edgeTypes, rules, checks }` + `asString`, `compareStrings`, `nodesById`.
  `EdgeTypeDef { source?: string; target?: string }`,
  `NodeTypeDef { required_fields?, requires_body?, status_values? }`.
- `tools/handlers/edge_endpoint_types.ts` — reads `def.source`/`def.target` via
  `asString`, so a LIST target is coerced to `undefined` and SKIPPED
  (permissive). This is the handler to extend for `flags`.
- `tools/validator.ts` (HANDLERS registry), `tools/indexer.ts`, `tools/yaml.ts`
  (`fromYaml` / deterministic `toYaml`).
- `specs/schema/{node-types,edge-types,validation-rules,checks}.yaml` — data.
  `checks.yaml` is the named-check allowlist (`[ci, spec-index, spec-validate,
  pr-evidence]`); a `waives`-target check must be listed there or
  `references_resolve` fails.
- Tests: `node --test --import tsx tests/*.test.ts`; fixtures under
  `tests/fixtures/{good,bad,good-waives}`; `tests/gate.test.ts` +
  `tests/gate-io.test.ts` show the pure-vs-git split to mirror.
- `.claude/commands/*.md` — thin command files; `/detect-drift` is a new one.

## Step 1 — Schema migration (CODE; stays green on the current graph)

- `specs/schema/node-types.yaml`: add
  - `capability`: `required_fields: [id, type, title, status, paths]`,
    `requires_body: true`, `status_values: [active]` (amendment 8 — no
    `retired`; a retire lifecycle is out of scope). `paths` is a frontmatter list
    of repo globs; `required_fields` checks presence only, so the list validates.
  - `drift-finding`: `required_fields: [id, type, title, status]`,
    `requires_body: true`, `status_values: [open, resolved, accepted]` (the
    intent's required `body` = `requires_body: true`, not a frontmatter field).
- `specs/schema/edge-types.yaml`: add `touches` (`source: evidence`,
  `target: capability`) and `flags` (`source: drift-finding`,
  `target: [evidence, capability]`).
- `tools/loader.ts`: widen `EdgeTypeDef.source`/`.target` to `string | string[]`;
  add `sensitivePaths: string[]` read from the `sensitive_paths:` key of
  `validation-rules.yaml` (mirror the `checks` loader; default `[]`); add it to
  `LoadedSpec`.
- `tools/handlers/edge_endpoint_types.ts`: handle an array `def.source`/
  `def.target` — when it is a list, the endpoint passes iff the node's type is a
  member (else a finding); keep `any` (skip) and `same_as_source` (amendment 7 —
  enforce membership, NOT `target: any`).
- `specs/schema/validation-rules.yaml`: add top-level
  `sensitive_paths: [specs/schema/**]` (one glob to start, SPEC §19). DATA read by
  `check-diff`, not a new validate rule.
- `specs/schema/checks.yaml`: add `check-diff` (and reserve `drift`) so a
  `waives → check-diff` edge resolves.
- Tests: `tests/fixtures/bad/flags-wrong-endpoint/` — a `flags` edge whose target
  is an `intent` must fail `edge_endpoint_types`; a good fixture with `capability`
  + `touches` + `drift-finding` + `flags → {evidence,capability}` must pass;
  extend the handler test for list targets.
- No `capability`/`drift-finding` nodes or `touches`/`flags` edges are added in
  this CODE step, so `pnpm spec:validate` stays green.

## Step 2 — Factor the shared base-ref/diff adapter (CODE; one source of truth)

- `tools/gitdiff.ts` (NEW): move the git adapter out of `gate.ts` — `git()`
  runner, `resolveBase()`, `addedEdgeIds`, `addedNodeIds`, and ADD
  `changedFiles(base): string[]` = `git diff --name-only <base>...HEAD` (fails
  closed like the others). `gate.ts` imports these (keeps `evaluateGate`/
  `runGate`). `gate`, `check-diff`, and `drift-map` then share ONE base-ref/diff
  implementation and cannot drift apart. Keep `tests/gate.test.ts` /
  `gate-io.test.ts` passing (adjust imports).

## Step 3 — `tools/glob.ts` (CODE; no new dependency)

- `tools/glob.ts` (NEW): `matchGlob(filePath, pattern): boolean` translating
  `**` (any segments), `*` (within a segment), and literals to an anchored
  RegExp. Used by BOTH `check-diff` (sensitive_paths) and `drift-map` (capability
  `paths`) — keeps the runtime dep surface at `js-yaml` only. `tests/glob.test.ts`:
  `tools/**` matches `tools/a/b.ts`; `specs/schema/**` matches
  `specs/schema/x.yaml` but not `specs/nodes/x.md`.

## Step 4 — `spec:check-diff` (CODE; deterministic; the blocking-first layer)

- `tools/checkdiff.ts` (NEW), pure + adapter like `gate.ts`:
  - `evaluateCheckDiff(spec, { changedFiles, addedEdgeIds, addedNodeIds, today })`
    — if no `changedFiles` matches any `spec.sensitivePaths` glob → `pass` ("no
    sensitive paths touched"). Else pass iff EITHER:
    (a) the PR adds an `evidences` edge → brief → `decomposes` → `approved`
        contract, AND that same evidence node has a `touches` edge to the
        `capability` whose `paths` own the changed sensitive file — i.e. bound to
        the OWNING capability, NOT any approved contract (amendment 5); OR
    (b) an added `override` node + `waives → check-diff` edge, not expired (reuse
        `gate.ts`'s `toDateString`/expiry pattern).
  - `runCheckDiff(spec)` = resolve base via `gitdiff`, derive `changedFiles` +
    added sets, call `evaluateCheckDiff`.
- `tools/spec.ts`: add `check-diff` subcommand; `package.json`
  `"spec:check-diff": "tsx tools/spec.ts check-diff"`.
- `tests/checkdiff.test.ts` (NEW): sensitive file + no link → fail; + evidence
  that `touches` the OWNING capability and reaches its approved contract → pass;
  + a link to an UNRELATED approved contract (evidence not touching the owning
  capability) → still fail (proves amendment 5); + override/waives → pass;
  non-sensitive change → pass.

## Step 5 — `spec:drift-map` (CODE; deterministic mapping + pinned packet schema)

- `tools/driftmap.ts` (NEW). Pinned types (amendment 3 — MANY and ZERO defined):
  - `DriftPacket { capability: string; capabilityTitle: string; changedFiles:
    string[]; contracts: {id,title,status}[]; approvedContract: string | null;
    briefs: {id,title,status}[]; priorEvidence: {id,title}[]; linkState:
    "linked" | "unlinked" }`
  - `DriftMapResult { packets: DriftPacket[]; uncovered: string[] }` (`uncovered`
    = changed files owning no capability — coverage visibility).
  - `buildDriftMap(spec, changedFiles)` — for each `capability`, `matchGlob` its
    `paths` against `changedFiles`; for each affected capability walk
    `capability ← touches ← evidence → evidences → brief → decomposes → contract`
    collecting ALL reachable contracts/briefs/evidence; `approvedContract` = the
    `status: approved` one or `null`; `linkState: "unlinked"` when no chain
    resolves. Deterministic, sorted output.
- `tools/spec.ts`: add `drift-map` subcommand → prints `DriftMapResult` JSON;
  `package.json` `"spec:drift-map": "tsx tools/spec.ts drift-map"`.
- `tests/driftmap.test.ts` (NEW): single-capability map; MANY contracts (lists
  all, flags the approved); ZERO/unlinked (`linkState: "unlinked"`); `uncovered`
  non-empty; a change spanning two capabilities → two packets.

## Step 6 — `/detect-drift` command (CODE; thin semantic layer; no agent→agent nesting)

- `.claude/commands/detect-drift.md` (NEW). Input `<pr-number|branch>`. The
  COMMAND (not an agent) resolves the diff deterministically: a branch →
  `git merge-base origin/HEAD <branch>`; a PR number → `gh pr view <n> --json
  baseRefOid,headRefOid`. It runs `pnpm spec:drift-map` with the resolved base
  (`GATE_BASE`) to get packets + `uncovered`.
- It carries an OPERATIONAL definition of "observable behaviour" (amendment 4): *a
  change a consumer could detect without reading the diff* — public CLI
  subcommands/flags/exit codes, emitted file contents/formats, schema or edge
  rules enforced, generated-index shape, workflow triggers/required checks,
  documented behaviour — AS OPPOSED TO internal refactors with identical outputs.
  Acceptance 4's "behaviour-preserving refactor" is judged against this.
- For each `linked` packet it asks the ONE question using the packet's
  contract/brief bodies; then, GRAFT FROM B (amendment 1), it runs ONE holistic
  cross-capability pass over ALL packets together ("does the change drift ACROSS
  capabilities?"). `unlinked` packets and `uncovered` files are reported
  explicitly (coverage holes visible, not silent).
- On drift (per-capability or cross-capability) it invokes graph-maintainer to
  create a `drift-finding` node (`status: open`; body = the changed behaviour,
  where it diverges from the linked contract/brief, and a suggested resolution
  `update-spec | revert | accept-with-contract`) plus `flags` edges → the
  capability and the touching evidence. On no drift: report 'no drift', create
  nothing. Mapping stays deterministic in the tool; the command (not a nested
  agent) does the judging; only graph-maintainer writes — rejecting B's LLM
  glob-matching and agent→agent nesting.

## Step 7 — `drift-review.yml` workflow (CODE; warn-only)

- `.github/workflows/drift-review.yml` (NEW), `on: pull_request`,
  `fetch-depth: 0`, pnpm provisioning like the other workflows:
  - Deterministic layer: `pnpm spec:check-diff` with `GATE_BASE=${{
    github.event.pull_request.base.sha }}`, WARN-ONLY (`continue-on-error: true`;
    surface the reason as a `::warning`). This layer flips to blocking FIRST (drop
    `continue-on-error` after ~5 clean PRs).
  - Semantic layer: a `/detect-drift` step, WARN-ONLY (annotate, never fail).
    Amendment 10: before ANY blocking flip the CI Claude step must be pinned
    (action, credential, model); until then the warn phase runs it via the
    configured Claude Code action if credentials exist, else documents a manual
    `/detect-drift` run. Never blocks.
  - Document the blocking-flip criteria (≥5 real PRs, correct behaviour) in
    `docs/drift-detection.md` (NEW) or a workflow comment.

## Step 8 — Graph seeding (GRAPH WRITE via graph-maintainer; AFTER step 1 lands)

Not code — performed by graph-maintainer because `specs/nodes/` + `edges.yaml`
are its exclusive domain. Seed four `capability` nodes (`status: active`,
one-line bodies) and the retroactive `touches` edges so a diff resolves to a
governing contract:
- `capability-spec-tooling` `paths: [tools/**]`
- `capability-ci-enforcement` `paths: [.github/workflows/**, .github/CODEOWNERS]`
- `capability-spec-schema` `paths: [specs/schema/**]`
- `capability-lifecycle-commands` `paths: [.claude/commands/**, .claude/agents/**]`
- `touches`: `evidence-spec-tooling-schema-driven-9c4e → capability-spec-tooling`;
  `evidence-ci-gate-spec-tool-693d → capability-ci-enforcement` and
  `→ capability-spec-schema`; `evidence-lifecycle-thin-commands-8296 →
  capability-lifecycle-commands`. Then `pnpm spec:index && pnpm spec:validate`.

## Acceptance (maps to the contract)

1. Post-migration `pnpm spec:validate` green; `capability`/`drift-finding` in
   `node-types`, `touches`/`flags` in `edge-types`; after step 8 a `capability`
   group in `specs/indexes/by-type.yaml`.
2. `spec:drift-map` on a branch touching `tools/spec.ts` emits a `linked` packet
   for `capability-spec-tooling` whose `approvedContract` is
   `contract-spec-tooling-schema-driven-b2e7`; MANY/ZERO/uncovered behave per the
   pinned schema.
3. `spec:check-diff`: a PR editing `specs/schema/**` with no owning-capability
   approved-contract link and no override → non-zero; evidence that `touches`
   `capability-spec-schema` and reaches its approved contract → pass; a link to an
   UNRELATED approved contract → still non-zero (amendment 5); override +
   `waives → check-diff` → pass.
4. `/detect-drift` creates a `drift-finding` (`flags` → capability + evidence) on
   a behaviour-changing branch and reports 'no drift' creating nothing on a
   behaviour-preserving refactor (per the operational definition).
5. A change spanning two capabilities is surfaced by the holistic cross-capability
   pass.
6. Intent acceptance: `/detect-drift` on the Phase 4 change yields a
   `drift-finding` or explicit 'no drift'. Reconciliation (amendment 9): Phase 4
   shipped as a SINGLE PR (#4); run on PR #4 (base→head). The intent's "two Phase
   4 PRs" is satisfied by running on #4; if a distinct second ref is intended the
   implementer names it before the run rather than inventing one.
7. `drift-review.yml` annotates findings but the check stays green until the
   documented ~5-PR flip; `pnpm test` / `typecheck` / `lint` green.

## Non-scope

- The semantic `/detect-drift` verdict going BLOCKING (warn-only first; the flip
  is a later operational step after ~5 PRs + pinning the CI Claude step).
- C's structural-signal proxy AS the behaviour verdict; the optional structural
  `spec:drift` (exported-symbol/flag/trigger deltas) is DEFERRED — only the
  deterministic `spec:check-diff` ships now (the `drift` check name is reserved).
- B's LLM-driven file→capability mapping and agent→agent nesting (mapping is
  deterministic; the command invokes the reviewer; only graph-maintainer writes).
- A `capability` retire lifecycle (`status_values: [active]` only).
- Applying GitHub branch-protection settings (repo-admin; documented only).
- Binding `check-diff` more tightly than owning-capability path ownership.

## Bootstrapping note (amendment 6)

The PR implementing this brief edits `specs/schema/**`, now a `sensitive_paths`
match, so `spec:check-diff` would apply to that PR. Two things prevent chicken-and-
egg blocking: (1) `drift-review.yml` ships WARN-ONLY, so `check-diff` cannot fail
the implementing PR; and (2) the lifecycle satisfies it anyway — `prepare-evidence`
adds this brief's `evidences` edge, and graph-maintainer's step-8 seeding binds
`capability-spec-schema` (`paths: [specs/schema/**]`) into the chain, so once
evidence exists the sensitive path is owned by a capability linked to an
`approved` contract. By the time `check-diff` flips to blocking, the schema is
stable and linked. No override needed.
