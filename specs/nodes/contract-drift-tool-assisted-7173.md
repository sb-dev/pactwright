---
id: contract-drift-tool-assisted-7173
type: contract
title: Tool-assisted drift — tools/spec.ts maps the diff to capabilities; Claude judges the residual
status: approved
created: 2026-06-14
class: 2
---

## Problem interpretation

The intent (`intent-drift-detection-c7b1`) is the Phase-5 "Drift" work of
SPEC.md (§15, §22): `capability` nodes own repo path globs; `/detect-drift
<pr|branch>` maps a diff to affected capabilities, follows each capability's
incoming edges to its contract/brief, and answers ONE semantic question — *did
observable behaviour change without being represented in the linked contract or
brief?* — plus a deterministic `spec:check-diff` sensitive-paths gate and a
warn-only `drift-review.yml`.

The only irreducibly *semantic* step is that one question. Everything around it
— parsing the diff, globbing changed files to capabilities, walking
`touches → evidence → evidences → brief → decomposes → contract` — is
deterministic graph work that `tools/spec.ts` already does for
`spec:index`/`spec:validate`/`spec:gate`. This candidate puts the deterministic
~90% in the tool and reserves Claude for the ~10% that needs judgment:
`tools/spec.ts` emits, per affected capability, a structured "drift packet"
(changed files, the linked contract/brief text, prior evidence); `/detect-drift`
feeds each packet to the drift reviewer and asks only the one question.
`spec:check-diff` is a sibling subcommand reusing the gate's base-ref/diff
machinery.

## Scope

### Shared migration & seeding (identical in all three candidates)

- **`node-types.yaml`** — add `capability` (`required_fields: [id, type, title,
  status, paths]`, `requires_body: true`, `status_values: [active, retired]`;
  `paths` is a frontmatter list of repo globs) and `drift-finding`
  (`required_fields: [id, type, title, status]`, `requires_body: true` — the
  intent's required `body` maps to a non-empty markdown body, not a frontmatter
  field; `status_values: [open, resolved, accepted]`).
- **`edge-types.yaml`** — add `touches` (`source: evidence`, `target:
  capability`) and `flags` (`source: drift-finding`, `target: [evidence,
  capability]`). The `[evidence, capability]` union needs a one-line extension
  to the `edge_endpoint_types` handler so a target may be a list of allowed
  types (fallback if that is rejected in review: `target: any`, the `waives`
  precedent).
- **`validation-rules.yaml`** — add `sensitive_paths: [specs/schema/**]` (start
  with one glob, per SPEC §19).
- **Seed capability nodes** — `capability-spec-tooling` (`paths: [tools/**]`),
  `capability-ci-enforcement` (`paths: [.github/workflows/**,
  .github/CODEOWNERS]`), `capability-spec-schema` (`paths: [specs/schema/**]`),
  `capability-lifecycle-commands` (`paths: [.claude/commands/**,
  .claude/agents/**]`) — each `status: active`, with a one-line body. Add
  retroactive `touches` edges from existing evidence so a diff can resolve
  `capability ← touches ← evidence → evidences → brief → decomposes →
  contract`: `evidence-spec-tooling-schema-driven-9c4e → capability-spec-tooling`;
  `evidence-ci-gate-spec-tool-693d → capability-ci-enforcement` and
  `→ capability-spec-schema`; `evidence-lifecycle-thin-commands-8296 →
  capability-lifecycle-commands`.
- **`spec:check-diff` subcommand** (deterministic, diff-aware, reuses the gate
  base-ref machinery): if any changed file matches a `sensitive_paths` glob,
  pass iff the PR diff adds an `evidences`/`decomposes` edge resolving to a
  `status: approved` contract OR adds an `override` node plus a `waives` edge
  naming check `check-diff`; otherwise non-zero with a human-readable reason.
- **`drift-finding` body format** when created: the changed behaviour, where it
  diverges from the linked contract/brief, and a suggested resolution
  (`update-spec | revert | accept-with-contract`).

### What distinguishes this candidate

- **`tools/spec.ts drift-map`** (script `spec:drift-map`): deterministic. Given
  a base ref, `git diff --name-only`, match each changed file against every
  capability's `paths` globs, and for each affected capability walk the graph to
  its linked contract(s)/brief(s). Emit one JSON "drift packet" per capability:
  `{capability, changed_files, contract {id,title,status,body}, brief {…},
  prior_evidence}`. No judgment — pure resolution, unit-testable, byte-stable.
- **`/detect-drift <pr|branch>`** (thin command): run `spec:drift-map`; for each
  packet ask the drift reviewer (Claude) the ONE question. On "yes", invoke
  graph-maintainer to create a `drift-finding` node + `flags` edges (→ the
  capability and the touching evidence) with the standard body; on "no", report
  'no drift' and create nothing. Aggregates a per-capability verdict list.
- **`drift-review.yml`**: every PR — step 1 `pnpm spec:check-diff` (warn-only:
  annotate, never fail); step 2 a Claude step running `/detect-drift` fed by
  drift-map packets, posting `::warning` annotations / a PR comment.
  `continue-on-error` during the warn phase; drop it to flip blocking after ~5
  clean PRs.

## Non-scope

- No structural/heuristic drift inference — the behaviour judgment is Claude's,
  fed precise packets.
- No node/edge types beyond the shared migration.
- No branch-protection config in code (documented manual step), as in the CI-gate
  phase.

## Trade-offs

- **+** Determinism where it is cheap: file→capability globbing and graph
  traversal are tool code (reusing the loader + gate base-ref machinery),
  unit-testable and byte-reproducible; the LLM sees a tight, pre-resolved packet,
  so its judgment is cheaper and steadier than re-deriving the graph each run.
- **+** One source of graph semantics: `drift-map` shares the loader with
  index/validate/gate, so "which contract governs this file" cannot drift from
  the validator's view.
- **+** Smaller, auditable LLM surface → quicker path to trustworthy warn output
  and an eventual blocking flip.
- **−** Grows `tools/spec.ts` with capability/glob/packet logic and a second
  diff-aware subcommand beside `gate` (shared base-ref code to factor).
- **−** Still depends on Claude for the verdict, so `drift-review.yml` needs a
  Claude step in CI (key/cost), and the verdict is not fully reproducible.
- **−** The packet schema is new public surface to keep stable.

## Risks

- **Base-ref correctness in CI** (shallow clone / wrong base) → empty diff,
  false 'no drift'. Mitigation: `fetch-depth: 0`, pass
  `pull_request.base.sha`, error loudly on an unresolvable base — same posture as
  `spec:gate`.
- **Glob ownership gaps/overlaps**: a changed file matching no capability is
  invisible to drift; one matching several fans out. Mitigation: `drift-map`
  reports unowned changed files explicitly (an "uncovered" list) so coverage
  holes are visible, not silent.
- **Packet under-context**: if the linked brief/contract body omits the
  behaviour, Claude may misjudge. Mitigation: include prior evidence text and the
  full contract/brief bodies in the packet.

## Acceptance examples

1. **Schema first.** After the migration commit, `pnpm spec:validate` is green;
   `capability`/`drift-finding` appear in `node-types.yaml`, `touches`/`flags` in
   `edge-types.yaml`, and a `capability` group exists in
   `specs/indexes/by-type.yaml`.
2. **Mapping.** `spec:drift-map` on a branch changing `tools/spec.ts` emits a
   packet for `capability-spec-tooling` carrying
   `contract-spec-tooling-schema-driven-b2e7` (approved) and its brief.
3. **Drift found.** `/detect-drift` on a branch that changes observable behaviour
   not in the linked contract creates a `drift-finding` with `flags` → capability
   + evidence, body naming the divergence and a resolution.
4. **No drift.** `/detect-drift` on a behaviour-preserving refactor reports 'no
   drift' and creates nothing.
5. **Sensitive gate.** A PR editing `specs/schema/**` with no linked approved
   contract and no override fails `spec:check-diff`; adding an `override` node +
   `waives → check-diff` passes.
6. **Acceptance (intent).** `/detect-drift` run on each of the two Phase 4 PRs
   yields either a `drift-finding` or an explicit 'no drift'.
7. **Warn-only.** `drift-review.yml` annotates findings on a PR but the check is
   green (non-blocking) until the blocking flip.

## Verification needs

- `node --test` over `drift-map`: synthetic capabilities + diffs asserting
  correct file→capability mapping, traversal to the approved contract, and the
  uncovered-files list; `check-diff` pass/fail clauses.
- `pnpm spec:validate` green on the real tree post-migration and after the
  capability/`touches` seeding.
- A scratch PR per acceptance 5 and 7 observing the checks; a recorded
  `/detect-drift` transcript for acceptance 6 on the two Phase 4 PRs.
- Confirm the CI Claude step's credentials/runner; confirm annotations render and
  never fail during the warn phase.

## Critique

- **The "drift packet" is undefined surface.** Scope names a JSON packet
  `{capability, changed_files, contract {id,title,status,body}, brief {…},
  prior_evidence}` and the trade-offs call it "new public surface to keep
  stable," yet `contract {…}` and `brief {…}` are singular and the shape is
  never pinned. A capability reached through multiple chains — an `approved`
  contract plus a `superseded` one, or two distinct evidence→brief→contract
  paths — has no defined packet representation, so a brief cannot serialize it
  deterministically.
- **No verdict for owned-but-unlinked capabilities.** `drift-map` "walk[s] the
  graph to its linked contract(s)/brief(s)," but a capability whose `paths`
  match a changed file while it has no `touches` edge yet (a new or
  not-yet-evidenced area) yields an empty packet. The contract defines an
  "uncovered" list only for files matching *no* capability; it is silent on a
  matched capability with no link, so `/detect-drift` has no defined answer
  there.
- **The CI Claude step is hand-waved.** "a Claude step running `/detect-drift`"
  names no Action, model, or credential path, yet acceptance 7 and the headline
  "quicker path to blocking" depend on it running on every PR. Until the step is
  pinned (which Action, which key, behaviour with no key), the warn→blocking
  story rests on a reproducibility the LLM verdict lacks — two runs on the same
  packet may disagree.
- **Per-capability splitting hides cross-capability drift.** Because
  `/detect-drift` asks the one question once per packet, a change whose
  divergence is visible only across two capabilities is never presented as a
  unit. This is precisely the agent-native candidate's claimed strength, and
  this candidate neither acknowledges nor mitigates the blind spot.
- **"Observable behaviour" is never operationalized.** The pivotal question is
  handed to Claude with no definition of what counts (public API? CLI output?
  exit codes? internal refactor?). Acceptance 3/4 oppose "changes observable
  behaviour" to a "behaviour-preserving refactor" as if the line were
  self-evident; without a definition the verdict is irreproducible and the
  acceptance not objectively checkable.
- **Base-ref for a PR *number* is unspecified.** `drift-map` takes "a base ref"
  reusing the gate machinery, but `/detect-drift <pr|branch>` also accepts a PR
  number; how a bare number resolves to a base SHA (via `gh`? unattended in CI?)
  is left open — the base-ref hazard the Risks section raises but only
  half-closes.
- **Shared/inherited gaps.** (1) The migration PR edits `specs/schema/**`, which
  this contract adds to `sensitive_paths`, so the drift PR must satisfy its own
  new `spec:check-diff` — a bootstrapping order none of the three resolve.
  (2) `flags: target [evidence, capability]` needs an unspecified
  `edge_endpoint_types` handler extension; the fallback `any` silently drops the
  type constraint. (3) capability `status_values: [active, retired]` is invented
  beyond the intent with no retire lifecycle or superseding rule. (4) Acceptance
  6 says "the two Phase 4 PRs," but history shows Phase 4 landed as a single PR
  (#4); the contract neither pins which refs nor reconciles the count.
  (5) `spec:check-diff`'s "linked approved contract" is satisfiable by *any*
  added `evidences`/`decomposes` edge to *any* approved contract, not one
  governing the touched sensitive file.
