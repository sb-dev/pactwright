---
id: integration-conveyor-derived-4d19
type: integration
title: Self-guiding delivery loop — seven lanes integrated (draft; paste-only acceptance failed on one lane)
status: draft
created: 2026-07-30
integration_sections: [combined-outputs, combined-test-run, compliance-verdict, rollback-sequencing, combined-risk, follow-ups, scope-integrity]
---
This integration combines the seven final lane evidences (`evidence-conveyor-resolver-2f18`,
`evidence-conveyor-schema-graph-7c41`, `evidence-conveyor-commands-8a52`,
`evidence-conveyor-ci-4b73`, `evidence-conveyor-lane-catalog-3d84`, `evidence-conveyor-docs-5e91`,
`evidence-conveyor-tests-6b2f`) against `contract-conveyor-derived-4c8c` (Candidate **B**, derived
conveyor, class 3, approved) for `intent-self-guiding-delivery-loop-6d79`. The effective contract is
that contract **plus** the sixteen amendments and sixteen binding common-core findings of
`decision-conveyor-derived-5a91` (whose binding text is `comparison-conveyor-market-890e`'s
`## Common-core findings`). This node is **`draft`**, not final, because contract Acceptance 1's
paste-only clause **failed on one of the seven lanes** — recorded in full in `## combined-test-run`
and carried into `## compliance-verdict` and `## scope-integrity`.

## combined-outputs

The seven lanes combine into one coherent self-guiding delivery loop. The decomposition's boundary
map held: no two lanes edited the same file, and every cross-lane seam was surfaced by the lane that
found it and closed by the lane that owns the file.

- **data-migration** (`4f94e41` schema, `46eb5bd` graph data) — `specs/schema/node-types.yaml`
  (optional unvalidated `owner` on `brief`; the inline eight-lane enumeration replaced by a pointer
  to `brief-lane-valid`'s `keys`; CC-13's single "live intent" definition), plus all five Scope-14
  graph migrations: ten `touches` edges, two capability widenings, the PR #4 drift verdict (**no
  drift**), two follow-up intents, and the `.gitignore` unowned-path authorization.
- **domain-backend** (`b7aed9f` the lane, `d8bc47d` three defect fixes) — `tools/conveyor.ts`
  (`nextSteps`, `deriveStage`, `liveIntents`, `CONVEYOR_CLASS_ROUTING`, `marketRequired`,
  `lanesRequired`), `tools/issue_sync.ts` (`planIssueSync` pure seam + dry-by-default `gh` adapter),
  `tools/spec.ts`'s `status` branch, `tools/indexer.ts`'s six-file `INDEX_FILES` with the two view
  serializers, the A11 lift into `coverage_traversal.ts`, `driftmap.ts`'s `decisions` field.
- **api-integration** (`6c5ca89`) — the resolver `NEXT` block and the marked
  `FALLBACK (RESOLVER UNAVAILABLE):` region across all 14 chain commands, `select-patch.md`'s
  type-wrong hop fixed to `/prepare-evidence <brief-id>`, `/review-contracts` steps 2-3 retargeted,
  `/decompose-lanes`' `test-verification` refusal and `## Strategy tension` writer,
  `/implement-brief`'s single graph write, the four pinned body templates, echo-before-mutate and
  `ON RED:` on all 13 mutators.
- **observability-release** (`88d4ded`) — `.github/workflows/issue-sync.yml` (permissions, weekly
  cron, concurrency, opt-in apply, always-report summary), the `drift-review.yml` graduation
  (exactly one `continue-on-error: true` deleted), A9's transcription check as a step in the
  required `ci` job, `.github/CODEOWNERS`' `/specs/nodes/decision-*` row.
- **product-spec** (`2f86187`) — the `!.claude/lanes/` negation, eight `.claude/lanes/*.md` catalog
  files, seven implementer agents, the four agent corrections (`spec-writer`, `contract-reviewer`,
  `test-writer`, `integration-reviewer`), and `.gitattributes` (`specs/indexes/** -merge`).
- **docs-spec** (`d666190`) — `CLAUDE.md`'s A7 lifecycle amendment, the completed lifecycle map, the
  three new rules, `## The conveyor` / `### Output attention` / `### The effective contract`, plus
  `README.md` (40 lines), `CONTRIBUTING.md`, `docs/branch-protection.md`, `docs/drift-detection.md`.
- **test-verification** (`3bae96e`, plus `48543b1` closing the two CC-8 gaps; authored by
  `test-writer` via `/write-tests`, never the invocation that wrote the code under test) — the
  thirteen-leg lane union pin, A6's resolver-invocation pin with its negative leg, the 33-case
  conveyor routing matrix, the four CC-8 view legs, the CC-12 transcript fixture and manifest, the
  18-case `issue_sync` suite, the `AGENT_TOOLS` pin, and the fixture blast-radius repairs.

**Conflicts and couplings visible only in the combined result:**

1. **The A1/A6 distinguishability contract is a byte-for-byte cross-lane negotiation.** A1 requires
   a template-shaped fallback in every chain command; A6 requires a pin that a print-less command
   reds CI — and A1's fallback must **not** be able to satisfy A6's pin. Five clauses (the token
   `pnpm spec:status`, the exact opener `FALLBACK (RESOLVER UNAVAILABLE):`, the close
   `^[A-Z][A-Z0-9 /()-]*:$` or EOF, no `spec:status` inside a region, the token surviving excision
   in each of 14 files) are reproduced byte-identically in `brief-conveyor-commands-c14d` and
   `brief-conveyor-tests-4c86`. An earlier draft pinned *different* literals in the two briefs,
   which would have made the excision never fire and A6 pass vacuously — caught in review before
   either lane was implemented. **Resolved, and proved by a negative leg** that strips the resolver
   clause from every chain file (fallback byte-identical), confirms the pin reds, then injects
   `pnpm spec:status` *inside* the intact fallback and confirms it **still** reds.
2. **The A9 transcript-fixture layout conflict.** `observability-release` shipped its A9 step
   reading a per-command-directory layout it invented to make the step executable;
   `test-verification`'s brief owns the fixture and specifies **one shared recorded graph plus a
   `transcript.yaml` manifest**. The test lane could not edit `ci.yml`, so it surfaced the conflict;
   a human settled it on 2026-07-30 in favour of the owning lane's layout, and `ci.yml` was
   corrected by the lane that owns it. **Verified in the combined tree:**
   `.github/workflows/ci.yml:41-42` states the manifest contract in a comment and `:86` reads
   `path.join(FIXTURE, "transcript.yaml")`. Had it shipped unreconciled, A9's legs 1 and 2 would
   have failed against the fixture that actually landed.
3. **`product-spec`'s single `touches` edge is valid only because `data-migration` landed first.**
   Nineteen of its twenty-one files fall under `capability-lifecycle-commands-4f5a` — but only
   because Scope 14.2 widened that capability's `paths` with `.claude/lanes/**`. The same coupling
   holds for `docs-spec`: `README.md` and `CONTRIBUTING.md` were owned by no capability until 14.2
   widened `capability-spec-docs-8c1d`. Both lanes flagged the dependency and confirmed rather than
   assumed it; neither authored a capability change inside its own lane.
4. **Three defects the verification lane found in `domain-backend`'s code, reported and fixed at
   source.** In each case `test-writer` refused to touch `tools/**` and left the assertion failing;
   the fix landed in `d8bc47d`. (a) `issue_sync.ts` — CC-4(3)'s collapsed-lane close was
   **unreachable**, because `syncTargets` walked `liveBriefsForContract`, dropping superseded briefs
   before `shouldClose` could see them. (b) `conveyor.ts` — the A7 loop reappeared one step later:
   `briefSteps` tested `status === "implemented"` before consulting `finalEvidenceForBrief`, so an
   already-evidenced brief reprinted `/prepare-evidence` for itself. (c) `conveyor.ts` — a
   **resolved** patch market fell through to the no-market path and routed to `/implement-brief`.
   This is the separation-of-duties rule earning its keep, and it is the substantive outcome of that
   lane.

## combined-test-run

Transcribed from the seven lane evidences, all run 2026-07-30 on the integrated tree:

- `node --test --import tsx tests/*.test.ts` → **289 tests, 289 pass, 0 fail**, 0 skipped, 0 todo.
  The suite entered `test-verification` at 187 with 4 failures (the `INDEX_FILES` blast radius) and
  left at 289/289. Reported identically by all seven lane evidences that ran it.
- `node_modules/.bin/tsc --noEmit` → exit 0. `node_modules/.bin/eslint .` → clean.
- `node_modules/.bin/tsx tools/spec.ts validate` → **OK, 20 rules, 0 errors**. The rule count is
  **unchanged**, which is itself the check that `data-migration` added no validation rule for
  `owner` (contract Out of scope 1 forbids one). Negative controls were run in a throwaway copy for
  the seven rules that lane's data engages, so a green run is not mistaken for a vacuous one.
- `spec:index` run twice → byte-identical across all **six** index files; `INDEX_FILES.length` → 6.
- A9's workflow step executed locally by extracting its `run:` script: three legs green (live-graph
  smoke; 14 chain commands / 17 recorded blocks; 17 blocks byte-identical), and **two negative paths
  red** — fixture absent → fails rather than skips; one-character drift inside one recorded block →
  fails and names the offender. Fixture restored byte-identically after both runs.
- All seven workflow files parse as YAML; every inline `run:` block passes `bash -n`.
- Catalog measurements: `git check-ignore -v .claude/lanes/product-spec.md` exits **1**;
  `git ls-files .claude/lanes` lists **eight**; `grep -n '^tools:' .claude/agents/*.md` shows nine
  new `Bash` grants over ten total holders.

**Honest bound on this section:** these numbers are transcribed from the lane evidences' recorded
runs. This integration node **declares** them; it does not re-execute them. The caller's mutating
step (`pnpm spec:index && pnpm spec:validate`) is the live re-check and must not commit on red.

**THE PASTE-ONLY RUN — the discharging run for Acceptance 1, and its verdict: FAILED on one lane.**
Per `CLAUDE.md:331-337` a paste-only acceptance claim must name its discharging run, record that
run's verdict here, and name the remediation on failure. The named run is the seven-lane execution
of this very change, driven from `spec:status`.

- **ID clause — PASSED.** No id was hand-assembled anywhere in the seven lanes. Every id pasted into
  a command came from a resolver print. `select-patch.md`'s type-wrong hop is closed
  (`grep -n "winner-branch" .claude/commands/` → nothing), and A7's `implemented` →
  `/prepare-evidence` rule routed the evidence runs for real.
- **Paste-only clause — FAILED, on 1 of 7 lanes.** After `/write-tests brief-conveyor-tests-4c86`,
  the resolver **reprinted `/write-tests brief-conveyor-tests-4c86`**. `/write-tests` performs no
  graph write, so the brief stayed `draft` and Behaviour 2.5(b) kept matching — the identical loop
  A7 closes for `/implement-brief`, on the one lane that may not be run through it. An operator
  pasting only printed commands loops there **forever**; the operator had to know, from outside the
  print, to run `/prepare-evidence brief-conveyor-tests-4c86`.
  `evidence-conveyor-commands-8a52:216-219` foresaw exactly this and left it "a single human
  observation to be recorded at integration".
- **Secondary break.** `/update-spec-graph` for the deferred Scope 14 graph-data work was
  hand-invoked, not printed — a deliberate human choice taken because `/implement-brief`'s own
  wording contradicts itself (it performs no graph write yet the lane's deliverable *is* graph
  data).
- **Remediation, created alongside this node** (the rule-5 route `CLAUDE.md:335` requires):
  `drift-finding-write-tests-no-flip-7e52` (status `open`,
  `flags → evidence-conveyor-commands-8a52`) records the divergence, and
  `intent-write-tests-status-flip-2b64` (`open`, class 2) captures the missing status flip as scope.
- **Consequence, stated not softened.** `CLAUDE.md:335` — "A change does not reach a final
  integration on a failed run." This node is therefore **`draft`**. Because `coverage-coherence`
  treats a non-final integration as **not-covered** and checks intent coherence bidirectionally,
  `intent-self-guiding-delivery-loop-6d79` correctly stays **`open`**. Draft integration + open
  intent is the **green** shape here, not a broken one.

## compliance-verdict

**Lane → brief legend. This legend is the naming required by `CLAUDE.md:378-381`** — the table's
`Lane(s)` column names each item's discharging brief through it, which keeps 32 rows scannable where
full brief ids would not:

| Lane | Discharging brief |
|---|---|
| DB | `brief-conveyor-resolver-3f7a` (`domain-backend`) |
| DM | `brief-conveyor-schema-graph-8b2e` (`data-migration`) |
| AI | `brief-conveyor-commands-c14d` (`api-integration`) |
| OR | `brief-conveyor-ci-6a9f` (`observability-release`) |
| PS | `brief-conveyor-lane-catalog-2d5b` (`product-spec`) |
| DS | `brief-conveyor-docs-9e31` (`docs-spec`) |
| TV | `brief-conveyor-tests-4c86` (`test-verification`) |

The decision assigns no amendment to any lane; this mapping is built **bottom-up** from each brief's
and evidence's own discharge sentence. All 32 items have a holder.

| Item | Requirement (≤12 words) | Lane(s) | Note |
|---|---|---|---|
| A1 | Template-shaped, marked degraded fallback in every chain command | AI | Three binding constraints all hold; A1×A3 and A1×A15 reconciled in file |
| A2 | `planIssueSync` pure seam, out of `spec` dispatch, unit-tested | DB | Seam DB's; the 18-case suite is TV's under CC-5 |
| A3 | No unsubstituted placeholder on a resolved path | AI | `compare-patches.md`'s `<winner>` correctly declared not an instance |
| A4 | BLOCKED `/write-tests` interim clause, recoverable action | AI | Named a recoverable action per the UX finding, not a bare block |
| A5 | Terminality computed from graph state, never a boolean | DB | `grep -cE "terminal:" tools/conveyor.ts` → 0 |
| A6 | Pin that every chain command still invokes the resolver | TV | A6.1-A6.5 plus the non-vacuity negative leg; bound A6.6 recorded |
| A7 | Make implement → prepare-evidence hop derivable | DB, AI, DS | Three-way by declared sub-part: resolver rule / command flip / CLAUDE.md step |
| A8 | Author a writer for every marker the resolver reads | DB, AI | **ANOMALY** — see (1) below; AI implemented it, no AI discharge sentence names it |
| A9 | CI job diffing each printed block against `spec:status` | OR | Step in the required `ci` job; three legs green, two negatives red |
| A10 | Add the nine-`Bash`-grants risk entry | PS | Risk lives in the brief (contract body never edited); fences are the mitigation |
| A11 | Resolve Scope 2 self-contradiction; consolidation is required | DB | Both walks lifted; bit-identical; 29 tests pass unchanged and unweakened |
| A12 | `CONVEYOR_CLASS_ROUTING` read-as-data or byte-pinned, never a third copy | DB, TV | DB chose **PIN** with recorded rationale; TV wrote the pin leg |
| A13 | Union of the three ten-leg pins binding; "schema lane" → `data-migration` | TV, DM | TV delivered thirteen legs; DM made the acceptance-text correction |
| A14 | Retarget `/review-contracts` steps 2-3; fix `approve-contract.md:21-23` | AI | The `approve-contract.md` orphan was an amendment this review produced |
| A15 | Suppress the closing print when the graph write failed | AI | All 13 mutators carry the `ON RED:` clause; no `NEXT` block and no fallback |
| A16 | Live-graph `owner` leg; refuse decomposition omitting `test-verification`; issue-sync credentials | AI, OR, TV | **ANOMALY** — see (2); TV's leg-13 assignment is **INFERRED**, not read |
| CC-1 | `/review-contracts` steps 2 and 3 are orphaned | AI | Step 2 → one verdict pointer per candidate; step 3's guard retargeted, teeth kept |
| CC-2 | Nine `Bash` grants unfenced and unpinned | PS, TV | PS authored the literals and five-clause fences; TV pinned them via `AGENT_TOOLS` |
| CC-3 | `issue-sync.yml` has no credential or permissions model | OR | No precedent in repo; built-in token, no PAT, apply opt-in, dry by default |
| CC-4 | Sync write conditions under-specified three ways | DB | All three landed; the collapsed-lane close was TV-found and fixed at source |
| CC-5 | Complete-listing guarantee, durable record, self-healing trigger, A's seam | DB, OR, TV | Three-way: refusal+seam / cron+per-run report / the 18-case suite |
| CC-6 | Node ids unvalidated; `gh` must not go through a shell | DB | Refusal at both egress points; `spawnSync` with `shell: false`; bound recorded |
| CC-7 | Closing print not suppressed on a failed graph write | AI | Echo before mutating plus the canonical gate text in all 13 |
| CC-8 | `INDEX_FILES` widening: make derivation total, add a no-clock test | DB, TV | DB total+clock-free; TV's four view legs (two added by a second invocation) |
| CC-9 | `owner` unpoliced; owner-less path undefined; refuse laneless decomposition | DM, PS, TV | Three-way: schema field / owner-less path declared / live-graph leg 13 |
| CC-10 | Audit and governance records lag: (a)-(d) | OR, DS, DB, PS | (a) CODEOWNERS = OR; (b) branch-protection row = DS; (c) drift packet = DB; (d) doctrine = DS + `integration-reviewer.md` = PS |
| CC-11 | Persist the wave on each lane brief; render `issue: not synced` | AI, DB | **ANOMALY** — see (3): rendering half discharged, **persistence half NOT** |
| CC-12 | Headline acceptance needs named run, verdict site, regression artifact | DS, TV | DS wrote the standing convention; TV built the transcript replay; A9 (OR) is the named run |
| CC-13 | Two lifecycle-map gaps; define "live intent" once | DM, DS | DM authored the single definition; DS completed the map and pointed at it |
| CC-14 | `spec.ts`'s "four files" count; `CLAUDE.md`'s `includes`-target claim | DB, DS | Rendered from `INDEX_FILES.length`; the forward reference deleted |
| CC-15 | Acceptance text must use catalog lane names; union must be binding | DM, TV | **ANOMALY** — see (4): clause (i) DM under the A13 label, clause (ii) TV |
| CC-16 | Minor hygiene: pattern, `git ls-files` sizing, `Owns` normalization, merge rule | PS, TV | PS documented the deny-then-negate trap and authored `.gitattributes`; TV sized leg 12 and declared leg 6's normalization |

**Four anomalies, stated here rather than buried in the table:**

1. **A8 names two lanes and only one claims it.** A8 is `domain-backend`'s amendment and that lane
   chose the *author-the-writer* branch over *delete-the-marker*. But the writer lives in
   `decompose-lanes.md`, which `api-integration` owns, and that brief explicitly declined the row as
   "a cross-lane conflict, recorded not taken" pending `domain-backend`'s choice
   (`brief-conveyor-commands-c14d:589-596`). The condition fired and the writer **was** implemented
   (`evidence-conveyor-commands-8a52:150-159`), so the item is materially discharged — but **no
   discharge sentence names `api-integration` for A8**. The mapping is complete only when both lanes
   are named, which this row does.
2. **A16 has three parts and one assignment is inferred, not read.** The `/decompose-lanes` refusal
   (AI) and the issue-sync credential/permissions/dry-run model (OR) are both named explicitly in
   their evidences. The live-graph `owner` leg is delivered by `test-verification` as union leg 13 —
   but that lane names it **only under CC-9**, never under A16. **This third assignment is INFERRED
   from the artifact, not read from a discharge sentence.** The work exists; the attribution is this
   node's.
3. **CC-11 is the one genuine mechanism disagreement, and it is not papered over.** CC-11 requires
   the wave be *persisted on each lane brief*. `api-integration` writes it as **brief-body prose**
   and explicitly declines a `wave` frontmatter field, reasoning that the field "would be
   `data-migration`'s schema surface" (`brief-conveyor-commands-c14d:245-248`). `domain-backend`'s
   views are specified against a **persisted `wave`** (`brief-conveyor-resolver-3f7a:260-265`). And
   `brief-conveyor-schema-graph-8b2e` **never mentions `wave`** (verified: zero occurrences), so
   **no lane declares the field.** Net effect in the combined tree: `specs/indexes/status.md:39`
   renders a `wave` column that can never populate, with `:4` documenting `wave: —` as its permanent
   value. `brief-conveyor-resolver-3f7a:480-486` recorded the asymmetry and said the integration
   node should resolve it. **Resolution: the rendering half is discharged; the persistence half is
   NOT.** This is a rule-5 *"contract incomplete, intended behaviour unchanged"* event, routed to a
   follow-up intent named in `## follow-ups`, never widened silently here.
4. **CC-15's two clauses were discharged by two lanes under two labels.** Clause (i) — replacing the
   non-existent "schema lane" in the contract's Acceptance-7 text with the catalog lane
   `data-migration` — was done by `data-migration`, but recorded there under the **A13** label.
   Clause (ii) — the union of the three differing pin sets being binding — was done by
   `test-verification`, which claims CC-15 **unqualified** while not having done clause (i). Both
   lanes are named above, split by clause; neither claim is complete on its own.

**Acceptance, item by item, against the contract's eight:**

1. **End-to-end by paste alone — SPLIT VERDICT: ID clause passed, paste-only clause FAILED on one of
   seven lanes.** This is the reason this node is `draft`. Full record and remediation in
   `## combined-test-run`. A9 **retires** the contract's own honest bound on this acceptance (the
   effective contract is strictly stronger here), which is why the failure is a recorded verdict
   rather than an unfalsifiable claim.
2. **Unit-tested routing — MET.** All three named branches are their own leg in
   `tests/conveyor.test.ts`: a `selected` patch → `/prepare-evidence <brief-id>` through
   `competes-for` (a brief id, never a branch); a class-3 `approved` contract → `/decompose-lanes`,
   never `/write-brief`; a one-candidate class-1 intent → `/approve-contract`. Thirty-three
   top-level cases cover Behaviour 2.1-2.9, plus A7's and A5's legs the base candidate lacked.
3. **Lane market and issues — PARTIALLY UNMET BY DESIGN, and both halves must be stated.** (a) "each
   brief carrying a market-chosen `owner`" is **false**: **no brief carries an `owner`**, this
   contract's seven included. That is the declared bootstrap — the market that assigns owners is
   what this change builds, and `.claude/lanes/` did not exist when `/decompose-lanes` ran. The
   owner-less path is declared (PS), the schema field is optional and unvalidated (DM), and TV's leg
   13 skips absent owners by design so the graph stays green. (b) **`spec:issue-sync` has never run
   against a live repository.** The seam is unit-tested (18 cases) and the adapter is dry by
   default; no workflow has been executed by GitHub. So the sub-issue/blocked-by/reopen/close
   behaviours are verified at the seam and **not** end to end.
4. **The ten-leg pin — MET AS AMENDED.** The contract's "ten-leg" label is **superseded by A13**
   (thirteen union legs) and its literal "eight files" anti-vacuity sizing is **superseded by
   CC-16** (sized from the CLAUDE.md table's row count, not the literal `8`). Verified: no lane used
   the old numbering — the suite nowhere describes itself as a ten-leg pin, and leg 12 shells
   `git ls-files` with `shell: false`. Each named failure mode is its own leg, so a failure names
   its leg.
5. **Navigation — MET.** `spec:status` and `trails.md`/`status.md` answer where an intent stands and
   what runs next without reading `edges.yaml`; `spec:index` run twice is byte-identical across six
   files. The two CC-8 view legs added late (`48543b1`) — behavioural time-invariance under
   `t.mock.timers` across epochs ~15 years apart, and the no-dated-cell output leg — are what make
   the byte-identity claim durable rather than incidental.
6. **Gate graduation — MET, subject to the contract's own honest bound.** Exactly one
   `continue-on-error: true` deleted from the sensitive-paths step; the survivor on `Drift map` is
   deliberate and documented; `branch-protection.md` now says **six** with a `drift-review` row;
   `drift-detection.md` no longer calls the gate warn-only. The bound the contract itself states
   holds: after the flip the job goes **red** but **blocks nothing** until an admin marks
   `drift-review` a required check — repo-admin state, out of this diff.
7. **Self-application — MET.** `data-migration`'s diff touches `specs/schema/node-types.yaml`, and
   `evidence-conveyor-schema-graph-7c41`'s `touches → capability-spec-schema-2c3d` edge lands **in
   the same diff**, which is precisely what Acceptance 7 demands. The comparison opens with a
   verdict table, the decision takes the `decision-patch-market-ci-gate-8a2f` shape, and every node
   authored in this change wraps at 100 columns.
8. **Review-only, admitted — NOT CLAIMED.** Whether the market chose well, whether an
   `eligible_agents` list is right, whether a dependency hint reflects real blocking, whether a
   printed step is the right step, whether a leg's assertion is the right assertion, and whether the
   transcript fixture's recorded graph is representative all remain reviewer judgement by
   construction. This node carries them forward rather than asserting them.

**Touches-coverage verification (sensitive path):** the sole `sensitive_paths` glob is
`specs/schema/**`, owned by `capability-spec-schema-2c3d`. **Exactly one lane touched it** —
`data-migration`, in `4f94e41`, editing `specs/schema/node-types.yaml` (three comment-level edits,
no `required_fields` and no `status_values` change) — and `evidence-conveyor-schema-graph-7c41`
carries that `touches → capability-spec-schema-2c3d` edge.
`tests/fixtures/conveyor-transcript/specs/schema/*` is **not** a sensitive hit: the glob anchors at
both ends, so fixture copies under `tests/**` fall to `capability-spec-tests-3a6e`. The remaining
lane diffs each resolve to one owning capability with a `touches` edge: `tools/**` + `package.json`
→ `capability-spec-tooling-1a2b`; `.claude/commands/**`, `.claude/agents/**`, `.claude/lanes/**` →
`capability-lifecycle-commands-4f5a` (two lanes, two edges); `.github/**` →
`capability-ci-enforcement-3e4f`; `CLAUDE.md` + `README.md` + `CONTRIBUTING.md` + `docs/**` →
`capability-spec-docs-8c1d`; `tests/**` → `capability-spec-tests-3a6e`. Every evidence carries
exactly one `touches` edge. Two path sets are **intentionally unowned by recorded authorization**:
graph data under `specs/{nodes,graph,indexes}/**` by `decision-graph-data-unowned-2f7b`, and the
root VCS-config files `.gitignore` + `.gitattributes` by `decision-root-vcs-config-unowned-9f26`
(created mid-change, `supersedes → decision-gitignore-unowned-6b3d`). No path in the combined diff
is unowned and unrecorded.

**Verdict:** the combined result covers the **effective contract** — the contract body plus all
sixteen amendments and all sixteen common-core findings, each with a named discharging brief — with
**one acceptance failed and three sub-clauses under-delivered**. Failed: **Acceptance 1's paste-only
clause**, on the `test-verification` lane, remediated by `drift-finding-write-tests-no-flip-7e52` +
`intent-write-tests-status-flip-2b64`. Under-delivered: **CC-11's persistence half** (no lane
declares `wave`, so `status.md`'s column is dead), **Acceptance 3's market-chosen `owner`**
(declared bootstrap — no brief carries one), and **Acceptance 3's live issue-sync run**
(seam-verified only). On that basis this integration is **`draft`**, and
`intent-self-guiding-delivery-loop-6d79` correctly remains **`open`**.

## rollback-sequencing

Seven lane units in dependency order — schema and graph data first, `observability-release`
**before** `docs-spec`, `test-verification` last:

1. **`4f94e41`** — `data-migration`, schema. The optional `owner` field, the lane-list pointer and
   the "live intent" definition must exist before `product-spec` writes catalog files against them,
   before `test-verification`'s leg 13 reads `owner`, and before `docs-spec` points at the
   definition.
2. **`46eb5bd`** — `data-migration`, graph data. The two capability widenings must land before any
   later lane's `touches` edge can resolve (`.claude/lanes/**` for `product-spec`, `README.md` and
   `CONTRIBUTING.md` for `docs-spec`).
3. **`b7aed9f`** (+ **`d8bc47d`**) — `domain-backend`. `tools/conveyor.ts`, `spec:status`, the
   six-file `INDEX_FILES`, the seam, the A11 lift. Every other lane either invokes `spec:status` or
   asserts over its output.
4. **`6c5ca89`** — `api-integration`. The 14 chain commands consume the resolver's `NEXT` block and
   the `/implement-brief` flip makes `domain-backend`'s `implemented` rule reachable.
5. **`2f86187`** — `product-spec`. The `!.claude/lanes/` negation must precede any assertion over
   the catalog, or nine legs pass vacuously over an empty directory.
6. **`88d4ded`** — `observability-release`. The `drift-review.yml` flip and A9's `ci` step.
7. **`d666190`** — `docs-spec`, **strictly after 6**. The docs lane cannot document a gate flip that
   has not happened: its own Acceptance 5 forbids writing "These six checks" with a `drift-review`
   row and the as-built `continue-on-error` count before that flip lands. Its verification table
   asserts `drift-review.yml` carries exactly one `continue-on-error:` — an assertion about lane 6's
   file.
8. **`3bae96e`** (+ **`48543b1`**) — `test-verification`, last. It asserts over every preceding
   lane's artifacts: `tools/**` symbols, `.claude/**` text, `.github/**` fixtures, the CLAUDE.md
   table.

**The real ordering constraint, recorded rather than smoothed over: the branch carried a RED
`pnpm test` between `b7aed9f` and `3bae96e`.** `domain-backend`'s `INDEX_FILES` widening reddened
three `expected-errors.txt` fixtures and two stale declarations in `tests/spec.test.ts` (187 tests,
4 failing). That lane correctly did **not** repair them — they are `test-verification`'s files — and
the repair landed in `3bae96e`. That window is an ordering fact, not a defect in either lane, and it
means **no intermediate commit in 3-8 is independently releasable on a green suite.** The unit of
release is the whole branch.

**Rollback:** revert in reverse — tests, docs, observability-release, product-spec, api-integration,
domain-backend, then the schema, and **graph data last** (reverting `46eb5bd` while any dependent
`touches` edge remains would red `edges-references-resolve`; reverting the schema while any brief
carries `owner` or any doc points at the "live intent" definition breaks those references). A
partial rollback that drops `test-verification` while keeping `domain-backend` restores the
red-suite window. If `drift-review` has by then been marked required in branch protection, a full
rollback must also un-require it, or every PR strands on a check whose gate no longer exists.

## combined-risk

Residual risk visible only in the combined picture:

1. **The paste-only break is live, not hypothetical.** Until `intent-write-tests-status-flip-2b64`
   is implemented, any multi-lane change with a `test-verification` lane loops at `/write-tests` and
   requires out-of-band operator knowledge to proceed. The conveyor's headline promise is unmet on
   exactly one hop, and that hop is on the mandatory verification lane of *every* class-3 change.
2. **CC-11's dead `wave` column.** `specs/indexes/status.md` renders a `wave` column that can never
   populate, because no lane declares the field. The graph stays green (unknown frontmatter
   validates, and the read is total), so this fails **silently** — a reader sees `wave: —` on every
   row and has no signal distinguishing "unwaved" from "unimplementable".
3. **`spec:issue-sync` has never run live.** No workflow in this change was executed by GitHub. The
   GraphQL sub-issue and blocked-by mutations are the least stable surface (contract Risk 5) and
   whether the built-in `GITHUB_TOKEN` is accepted for them is not verifiable from this repository.
   A `workflow_dispatch` dry run producing a populated summary is unobserved.
4. **`drift-review` is inert until branch protection is wired.** After the graduation the job goes
   red on a violating PR and blocks nothing. Acceptance 6 is satisfied in mechanism, not in effect,
   and the enabling step is repo-admin state outside this diff.
5. **Workflow hygiene gaps this change deliberately did not close.** Five workflows still declare no
   `permissions:` at any level — `issue-sync.yml` is the only one that does, so the repository's
   default token scope remains whatever the org sets. And A9's leg-2 scratch copy is removed only on
   the success path, so a failing run leaves a `.a9-replay-*` directory in the workspace (harmless
   on an ephemeral runner, but it is a workspace write on a failure path).
6. **The strongest checks pin instructions and derivations, never runs.** A6 pins that each command
   *file instructs* the agent to invoke the resolver; CC-12's fixture pins what the resolver *would
   print* for a recorded graph; A9 pins byte-identity between a recorded block and `spec:status`
   output. **A hand-typed byte-equal block passes all three.** The reliability panel's finding —
   that a hand-typed `NEXT` block is indistinguishable from a resolved one — is therefore **partly,
   not wholly**, retired. Closing it needs a run stamp or digest, which this change does not take.

## follow-ups

**MANDATORY under scope-integrity rule 5** (each is a route this integration is required to take,
not an option):

1. **`intent-write-tests-status-flip-2b64`** — created alongside this node, `open`, class 2, with
   `drift-finding-write-tests-no-flip-7e52` (`flags → evidence-conveyor-commands-8a52`) as its
   finding. This is rule 5's **third** branch: extending the A7 status flip to `/write-tests`
   changes intended behaviour beyond A7's letter, so it required human approval and a new `decision`
   before implementation. `api-integration` correctly implemented **nothing** for it and stated the
   gap as a KNOWN GAP in `write-tests.md`.
2. **CC-11's wave-persistence gap** — rule 5's **second** branch (contract incomplete, intended
   behaviour unchanged). CC-11 requires the wave persisted; the combined result persists it only as
   brief-body prose while the views are specified against a field no lane declares. Capture:

   ```
   /capture-intent "Persist each lane brief's wave assignment as a documented optional `wave`
   frontmatter field on `brief` in specs/schema/node-types.yaml, and have /decompose-lanes write it,
   so status.md's `wave` column can populate. CC-11 of comparison-conveyor-market-890e requires the
   wave be persisted on each lane brief; the conveyor change discharged only the rendering half —
   api-integration writes the wave as brief-body prose and declined the field as data-migration's
   surface, data-migration never lists it, and domain-backend's views read a field that does not
   exist. Class 2."
   ```

**RECOMMENDED** (real, but outside the effective contract — capturing them is prudent, absorbing
them here would have been the silent drift rule 5 forbids):

3. **`docs/drift-detection.md:5`'s dangling `SPEC §15`** — verified still present, outside the
   `:32-40` span `docs-spec` rewrote. That lane surfaced it and deferred it correctly.
4. **`CLAUDE.md`'s `## Structure` block** omits `specs/schema/checks.yaml` and labels
   `validation-rules.yaml` "(stub)" though it is ~140 lines of live rules — including several this
   change depends on. Also surfaced and deferred by `docs-spec`.
5. **Enable `drift-review` as a required status check** in branch protection. An operational
   handoff, not missing scope: the contract puts the branch-protection API application explicitly
   out of scope and `docs/branch-protection.md` documents the wiring it cannot perform.
6. **A live issue-sync dogfood** — a `workflow_dispatch` dry run, then an applied run, confirming
   the sub-issue and blocked-by mutations against the built-in token. Closes risk 3. If the built-in
   token proves insufficient, adding `ISSUE_SYNC_TOKEN` is itself a rule-5 follow-up, never a silent
   add.
7. **A `permissions:` retrofit** onto the five untouched workflows (risk 5). Declined deliberately
   by `observability-release` as hygiene the contract does not scope.

**ALREADY OPEN — do not re-capture these three:**

- `intent-malformed-cutoff-finding-b3d7` (open, class 2) — the malformed `comparison_required_from`
  cutoff must red the graph, reversing `decision-critics-literal-panel-9c4f`'s fail-open there.
- `intent-write-tests-unlaned-brief-b3d8` (open, class 2) — `/write-tests` **refusing unlaned
  briefs**. **This is a different question from item 1.** `b3d8` is about *which briefs the command
  will accept* (its `lane: test-verification` precondition); `2b64` is about *the command performing
  no graph write on the briefs it does accept*, which is what breaks the conveyor. Resolving `b3d8`
  alone leaves the paste-only loop intact; resolving `2b64` alone leaves unlaned briefs refused. A
  later reader must not merge them.
- `intent-implement-brief-graph-lane-b3f5` (open, class 2) — `/implement-brief` performs no graph
  writes and delegates to no agent while graph-maintainer is the sole graph writer, so a lane whose
  deliverable **is** graph data cannot be implemented under that constraint.

## scope-integrity

Rule-5 judgement on each event the integrated whole reveals, distinguishing **HOW-not-WHAT
refinements** (no route needed — the intended behaviour is unchanged and the correction is recorded
in the lane evidence) from **real incompleteness** (a route is mandatory):

1. **The `/implement-brief` graph-data contradiction.** `data-migration`'s deliverable *is* graph
   data, but `/implement-brief` performs no graph write and graph-maintainer is the sole writer, so
   the lane had to be split across two commands (`/implement-brief` for the schema file,
   `/update-spec-graph` for the graph data). This is not a brief-boundary error and not a HOW
   refinement — it is a genuine gap in the command set the contract assumes. **Verdict: rule 5,
   second branch — routed to `intent-implement-brief-graph-lane-b3f5`, human-authorized during
   implementation. Not absorbed.**
2. **The `.gitattributes` capability gap.** `product-spec` created `.gitattributes` under CC-16;
   `decision-gitignore-unowned-6b3d` scoped itself explicitly to "`.gitignore` and nothing else", so
   the new file was covered by neither a glob nor an exception. `/prepare-evidence`'s
   capability-wiring clause fired its designed STOP. Resolved **in this PR** by the sanctioned
   "record the paths intentionally unowned" branch: `decision-root-vcs-config-unowned-9f26` covers
   both root VCS-config files and **`supersedes → decision-gitignore-unowned-6b3d`**, with `6b3d`
   left in place per CLAUDE.md rule 3. Creating a repo-hygiene capability was correctly rejected —
   contract Out of scope 7 declines exactly that, and reversing it would have needed its own
   approval. **Verdict: a real coverage gap, closed in the same PR by the sanctioned route. No
   follow-up owed. The brief did not foresee it, and both lanes said so rather than papering over
   it.**
3. **The lifecycle renumbering's stale citations.** `docs-spec` inserted a review-and-comparison
   step, shifting every number after 2, and correctly declined to edit downstream references in
   files it does not own — handing `approve-contract.md` and `implement-brief.md` to
   `api-integration` and `contract-reviewer.md` to `product-spec`. All three were repaired, and all
   three were made **number-free** (naming the step rather than numbering it) rather than renumbered
   to "4" as the briefs literally instructed. **Verdict: HOW-not-WHAT, strictly stronger than the
   letter of the briefs, flagged as a deviation by both lanes rather than presented as compliance.
   No route needed.** Related and closed: the decision's own A7 anchor says "step 5", a
   pre-insertion anchor; A7's target is the *Implementation* step whatever its number, now 6. Not a
   mismatch.
4. **The two missing CC-8 view legs.** `test-verification`'s first delivery shipped leg 2
   (time-invariance) as a static source scan instead of the pinned behavioural test, and omitted leg
   3 (no dated cell) entirely. Both were found in acceptance review and closed by a **second
   `test-writer` invocation** (`48543b1`) — leg 2 now using `t.mock.timers` across two epochs with a
   must-fire control, leg 3 asserting over both serialized views and the committed index bytes.
   **The separation of duties is what made this visible and is what forced the second invocation:
   the reviewing session had written the serializers under test and could not close the gap
   itself.** **Verdict: under-delivery against a correct brief, not a wrong brief. The remedy was to
   add the missing legs, and no leg was weakened to reach green. No supersession, no follow-up
   owed.**
5. **CC-11's persistence half — the one genuine "contract incomplete" route.** Three briefs
   independently reasoned about `wave` and none declared the field: `api-integration` wrote it as
   body prose and declined the frontmatter field as another lane's surface
   (`brief-conveyor-commands-c14d:245-248`); `domain-backend` specified its views against a
   persisted `wave` and recorded the discrepancy, asking integration to resolve it
   (`brief-conveyor-resolver-3f7a:480-486`); `data-migration` never mentions `wave` at all. Each
   lane's reasoning was locally correct and no lane crossed a boundary; the requirement fell in the
   gap between them, which is precisely the class of defect only integration can see. **Verdict:
   rule 5, second branch — contract incomplete, intended behaviour unchanged. Routed to the
   follow-up intent in `## follow-ups` item 2. NOT widened here, and the rendering half is not
   allowed to stand in for the whole item in `## compliance-verdict`.**
6. **The paste-only acceptance failure.** `/write-tests` performs no graph write, so its brief never
   leaves `draft`, Behaviour 2.5(b) keeps matching, and the conveyor reprints the command it just
   ran — A7's loop, on the one lane A7's own mechanism cannot reach. `api-integration` surfaced this
   in its brief and its evidence, implemented **nothing** for it, and routed it to human approval,
   because extending the flip to a second command changes intended behaviour beyond A7's letter.
   **Verdict: rule 5, third branch — selected work changes intended behaviour; a new `decision` is
   required before implementation. Routed to `drift-finding-write-tests-no-flip-7e52` +
   `intent-write-tests-status-flip-2b64`, and it is why this integration node is `draft`.**
7. **Recipe and tie-break deviations, recorded and dismissed.** `data-migration` reached the PR #4
   drift verdict by calling `buildDriftMap` directly rather than through the brief's pinned worktree
   overlay (same two inputs, fewer moving parts, reproducible from two shas plus one call), and its
   nodes carry `created: 2026-07-29` rather than the brief's pinned `2026-07-28` because the work
   ran a day later. `product-spec` produced a different — equally valid — topological order than its
   brief's witness, where the acceptance asks only that the hint graph *admit* one. **Verdict:
   HOW-not-WHAT in all three; each recorded in the lane evidence rather than absorbed. No route
   needed.**

**Conclusion:** the integrated whole reveals **three** rule-5 events requiring a route and **four**
that do not. Routed: the `/implement-brief` graph-data gap (`b3f5`, second branch), CC-11's
wave-persistence gap (follow-up intent, second branch), and the `/write-tests` status flip (`2b64` +
`7e52`, third branch). Not routed, correctly: the `.gitattributes` gap (closed in-PR by the
sanctioned unowned-path route with a rule-3 supersession), the number-free lifecycle citations, the
two CC-8 legs closed by a second `test-writer` invocation, and the recipe/tie-break deviations. **No
approved brief was wrong at its boundary — no `supersedes` on any brief is owed.** No lane absorbed
drift silently: every one of these seven events was surfaced in a lane brief or evidence before this
node read it, which is the discipline rule 5 exists to produce. This node stays **`draft`** until
`intent-write-tests-status-flip-2b64` is resolved and the paste-only run is re-executed green; the
intent stays **`open`** accordingly, and that pairing is the correct green state, not a defect.
