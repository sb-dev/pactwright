# A2-G — Graph and persistence

**Session:** A2, Graph and persistence audit · **Date:** 21 September 2026
**Reference audited:** `19c66d5f2368932ff05306db1fae8da8ec5810dd`
**Checkout:** `trial/a2-graph`, one overlay commit on the pinned reference; the
`src`, `packages` and `tests` tree hashes are
`ea6a948d0b1a84ceb3f8690396a8c1f554e91c43`,
`874973b940b485550d86854df9861ad62a2010d6` and
`c8089f77e7102923b554121485a517507c0d30b6` — identical to the values A1
recorded for all five checkouts, so this report judges the same bytes the
other four sessions do.

Nothing in the reference was repaired. No sibling report was read; `analysis/`
contained only `README.md` when this session started.

## How to reproduce everything below

```sh
pnpm install --frozen-lockfile
sh tools/implementation-trial/a2-graph/run-all.sh
```

Each probe prints one line per observation, prefixed `executed-pass` or
`executed-fail`. Every finding below names the observation id that produced it.
A probe exits 0 whether or not an observation failed — a failing observation is
a finding, not a broken probe.

## Environment

| | |
|---|---|
| Platform | Linux 6.18.44 (x86_64 container), **not** the macOS host A1 measured |
| Node | `v22.22.2` (the reference declares `>=22 <23 \|\| >=24 <25`) |
| Package manager | `pnpm 11.7.0`, matching the pinned `packageManager` |
| git | `2.43.0` |
| Model | Opus 5 |

**Baseline, executed here:** `pnpm test` → **684 tests, 683 pass, 1 skipped, 0
fail, exit 0** (14.0 s). The skipped test is `executor: claude-code performs a
capability end to end`, gated on `PACTWRIGHT_E2E_CLAUDE=1`. This agrees with
PR #39's claim and with green CI, and differs from A1's macOS run, which saw one
failure at the same SHA. The two results are consistent with a
platform-dependent test rather than with a disagreement about this SHA, but
this session did not identify which test A1 saw fail and cannot confirm that
reading — A3 should ask A1 for the failing test name. `pnpm build` and `node dist/cli.js validate --json`
also succeed here; `validate` reports `ok: true` over 16 nodes, 12 edges and 4
lineages.

## Skills applied

Assigned: `acquire-codebase-knowledge`, `architecture-patterns`,
`property-based-testing`. All three were read from the checkout's own
`.claude/skills/` — the copies the pinned `skills-lock.json` names, which this
checkout carries unchanged from the reference. None was installed, upgraded or
modified. I did not re-derive each skill's `computedHash`; A1 recorded that
`skills-lock.json` itself is byte-identical at `main` and at the reference.

- **`acquire-codebase-knowledge`** — its discovery method was applied: map
  before reading, tie every claim to a file and line or to terminal output,
  mark what could not be determined rather than inferring it. Its *output
  contract* (seven documents under `docs/codebase/`) was **not** applied: A2
  specifies one report in one format, and writing seven parallel documents
  would have produced exactly the competing record §1.4 forbids. The skill's
  own "Focus Area Mode" sanctions narrowing; this is that, taken to one
  boundary.
- **`architecture-patterns`** — used as a lens on layering, not as a
  prescription. The core/adapter direction, the port-shaped seams
  (`ContextContributor`, the schema registries, `CommitOptions.postWrite`) and
  the dependency cycles between `graph/` and `lifecycle/` are assessed under
  *Architecture* below. No refactor is proposed here; A5 owns design.
- **`property-based-testing`** — used for the identity, serialisation and
  revision surfaces, which have the algebraic shape the skill asks for
  (roundtrip, idempotence, order invariance, determinism). The reference
  declares no PBT library, and the skill is explicit that adding one is the
  maintainer's decision, so `probe-identity-properties.ts` generates from a
  seeded LCG instead: a counterexample is reproducible from the seed printed
  beside it. The skill's two failure modes were checked for deliberately — two
  assertions in the first draft were **vacuous** (an anti-CRLF check over input
  that contained no CRLF; pass counts that hid how many generated cases the
  filters discarded) and were rewritten. The rewritten CRLF property then
  failed, which is finding G-11. A recommendation on adopting `fast-check` is
  in *For A4 and A5*.

## What was traced

| Surface | Where |
|---|---|
| Node parse, load, id rules, immutability | `src/graph/nodes.ts`, `src/graph/ids.ts` |
| Node type schemas, cardinality rules | `src/graph/schema.ts`, `src/graph/relationships.ts` |
| Typed edges, endpoint types, per-relation cycles | `src/graph/edges.ts`, `src/graph/edge-schema.ts` |
| Supersession, currency, lineage derivation | `src/graph/graph-index.ts`, `src/graph/lineage.ts` |
| Current vs historical context | `src/context.ts` |
| Graph revision and canonicalisation | `src/graph/revision.ts`, `src/canonical.ts` |
| Repository revision and the delivery digest | `src/graph/repository.ts` |
| Closure preconditions and the closure block | `src/graph/closure.ts`, `src/graph/evidence-closure.ts` |
| Writes, rollback, the writer lock | `src/graph/mutations.ts`, `src/graph/writer-lock.ts`, `src/atomic.ts` |
| Loading and the validation kernel | `src/loader.ts`, `src/validate.ts`, `src/validate/kernel.ts`, `src/validate/rules.ts` |
| Extension ownership of graph types | `src/extension/resolve.ts`, `src/extension/manifest.ts` |

Public triggers were traced from `src/cli.ts`'s dispatch and from
`src/index.ts`'s exports, so every finding below names a trigger a consumer can
actually reach — a CLI command or an exported function — not an internal call.

---

# Findings

Severity is this session's judgement of consequence, not a project-wide scale.
Cause is one of the six the format allows. Evidence status is
`executed-pass`, `executed-fail`, `code-traced`, `not-reproduced`, `not-run` or
`environment-blocked`, with the observation id that produced it.

## G-01 — One lineage awaiting closure makes the whole repository unwritable

| | |
|---|---|
| **Severity** | High |
| **Requirement** | Core §53 (a delivery change after Review requires Review of the new delivered state) against Core §57 / Checkpoint 1 Step 9 (the mutation gate validates the complete proposed state) |
| **Public trigger** | `pactwright lifecycle record capture-intent`, then any second recording command, while another lineage stands at its Evidence step. Equivalently `createIntent` → `recordDecision` through the package API |
| **Source** | `src/graph/closure.ts:52-76` (`reviewCoversLatestDelivery` re-reads the repository), `src/validate/kernel.ts:294-302` (`execution` scope runs rule 12 over **every** lineage) and `:311-320` (`evidenceRule`), `src/graph/mutations.ts:174-181` (the mutation gate runs the `execution` scope) |
| **Tests** | `tests/closure.test.ts` builds one intent per project (`:33`); every test in `tests/mutations.test.ts` builds its own single-lineage root. No fixture has one lineage awaiting closure while another is written to. The repository's own graph has four lineages but no live run — `.pactwright/execution/` is absent at the reference — so `self-hosted.test.ts` and `pnpm verify:self` cannot reach this state either |
| **Expected** | Recording work on lineage B is unaffected by lineage A's pending closure |
| **Actual** | The first graph write after A's Review succeeds; **every subsequent write is refused**, `mutation-invalid / evidence-latest-delivery-reviewed`. Lineage A can then no longer be closed either, `evidence-closure-refused`. `validate` reports the repository invalid. Committing the unrelated work does not help: it moves `commit`, so the reviewed `git:<old>` identity still does not match |
| **Evidence** | `executed-fail` — G-XLIN-1, G-XLIN-2, G-XLIN-3, G-XLIN-4, against `19c66d5f`+overlay, exit 0 (the probe reports; it does not throw). Positive control G-XLIN-0 shows A closable before the unrelated write. **Durable effect:** the repository is left in a state where no graph mutation commits and `validate` fails |
| **Recovery** | Neither obvious recovery works. Re-recording the Review is refused — `step-not-permitted`, the run is already past its review step and the `direct` shape declares only `review → delivery` (G-XLIN-5). The only route found is deleting `.pactwright/execution/<brief>.yml` by hand, which discards the delivery record; writes then commit again (G-XLIN-6) |
| **Cause** | **Contradiction.** Two requirements that are individually right compose into a global write lock, because §53's "delivered state" is evaluated against *repository* identity while the mutation gate's scope is the *whole graph*. Nothing in either specification says a second lineage's Intent is a change to the first lineage's delivered state — but the working-tree digest cannot tell them apart |
| **Acceptance proposal** | An acceptance criterion that a project with two concurrent lineages can record every stage of lineage B while lineage A stands at its Evidence step, and can then close both. A4 should decide whether the digest is scoped per lineage (to the paths a Brief claims), whether the mutation gate's `execution` scope is narrowed to the lineage being mutated, or whether `specs/` itself is excluded from the delivery digest as `.pactwright/execution/` already is. The third is the smallest change and the one this session would try first; it is also the one that most weakens §53, so it needs an explicit amendment rather than a patch |

## G-02 — A caller-supplied delivery revision disables the repository re-check

| | |
|---|---|
| **Severity** | High · PR #39 **R02, trigger 1 — confirmed** |
| **Requirement** | Core §53 precondition 2 |
| **Public trigger** | `pactwright lifecycle record delivery --file <yaml>` with a `revision:` key, then `lifecycle record review`. Runtime operations only; no hand-edited state |
| **Source** | `src/lifecycle/record.ts:95-111` accepts `revision` for `kind: delivery`; `src/lifecycle/transition.ts:221-252` copies `deliveredRevision` into `review.revision`; `src/graph/closure.ts:66` guards the re-check with `review.revision.startsWith("git:")` |
| **Expected** | Closure is refused once the repository no longer matches what was reviewed |
| **Actual** | Closure is **permitted** with no repository check performed at all: the supplied string is not `git:`-prefixed, so the guard is skipped, and `deliveredRevision === review.revision` holds trivially because the reducer copies one into the other |
| **Evidence** | `executed-fail` — G-CLO-2. Positive control G-CLO-1, with the default revision and the same content change, is correctly refused (`latest-delivery-reviewed`). Durable effect: an Evidence node whose closure block records `delivered_revision: delivered-1`, an identity nothing verified |
| **Cause** | **Unenforced requirement.** §56 defines what a repository revision *is*; nothing rejects an identity that is not one. The guard is written as a positive test on a known prefix, so every unknown shape passes it |
| **Acceptance proposal** | Closure refuses any Review whose recorded identity is not one the runtime can re-derive. State it as a criterion over the *identity*, not the prefix: `isReconstructible`-style classification with three outcomes — re-derivable, recorded-but-not-reconstructible, unknown — and closure permitted only on the first. A fixture per outcome |

## G-03 — Outside a git work tree every delivered state shares one identity

| | |
|---|---|
| **Severity** | High · PR #39 **R02, trigger 2 — confirmed** |
| **Requirement** | Core §56 ("a reconstructible snapshot or fail explicitly") |
| **Public trigger** | Any project not inside a git work tree, or any environment where `git` cannot be invoked. No special input needed — it is the default for such a project |
| **Source** | `src/graph/repository.ts:136-146` fails soft to the literal `none`; `src/graph/closure.ts:66` then skips the re-check for the same reason as G-02 |
| **Expected** | Closure is refused, or the unresolvable identity fails explicitly |
| **Actual** | Two materially different delivered states both derive `none` (G-REV-5), and closure is permitted after content changed (G-CLO-3) |
| **Evidence** | `executed-fail` — G-REV-5, G-CLO-3 |
| **Partly guarded** | `isReconstructible("none")` is `false`, so *pinned replay* (rule 17) does fail explicitly. Only the closure path is open. That distinction matters: the mechanism to fail explicitly already exists and is simply not consulted here |
| **Cause** | **Environment assumption.** The runtime assumes a git work tree and degrades silently when there is none |
| **Acceptance proposal** | A criterion that closure in a project with no resolvable repository revision is refused with a named problem code, and a fixture that runs the full lifecycle in a non-git directory. If Checkpoint 1 intends to support non-git projects at all, that is a separate decision and needs its own identity mechanism, not `none` |

## G-04 — Delivered changes to the adapter surface are invisible to Review

| | |
|---|---|
| **Severity** | High · the decision PR #39 asked for, now with executed evidence |
| **Requirement** | Core §56, and the §53 precondition that rests on it |
| **Public trigger** | An agent rewrites `.claude/commands/*.md` or `.claude/agents/*.md` during or after Delivery, then `pactwright lifecycle record prepare-evidence` |
| **Source** | `src/graph/repository.ts:54-59` (`DELIVERY_DIGEST_EXCLUDED`), applied at `:74-78` and `:91-128` |
| **Expected** | Either the change moves the delivered identity, or the exclusion is a declared review-scope boundary that the runtime states |
| **Actual** | The identity does not move at all (G-REV-4); `isReconstructible` reports the resulting state **reconstructible** although it carries delivered content the commit does not describe (G-REV-4b); and closure is permitted after the adapter surface is rewritten post-Review (G-CLO-4) |
| **Evidence** | `executed-fail` — G-REV-4, G-REV-4b, G-CLO-4 |
| **Why the exclusion exists** | It is load-bearing, not an oversight. `.pactwright/execution/` must be excluded or a run invalidates its own Review the moment it advances — and that same exclusion is what lets several Reviews be taken against one repository state, which is the only reason G-01 is survivable at all. The `.claude/` entries ride along with it, and they are the ones that carry agent-authored content |
| **Cause** | **Ambiguity.** §56 excludes "execution state and adapter output from graph identity"; it does not say whether generated adapter output an agent has *edited* is still adapter output, and the code answers by path prefix |
| **Acceptance proposal** | Split the list. Runtime bookkeeping (`.pactwright/execution/`, `.pactwright/.lock`) stays excluded. Generated adapter output is excluded only while it is *generated* — a criterion that `sync` output matching its renderer is excluded and any divergence from it is delivered content that moves the identity. A fixture that hand-edits a rendered command and asserts the identity moves |

## G-05 — A back-dated `created` skips the closure-block requirement

| | |
|---|---|
| **Severity** | High · PR #39 **R03 — confirmed, with its reachable trigger narrowed** |
| **Requirement** | Core §14 (closure provenance) |
| **Public trigger** | An Evidence file written by hand, imported from another repository, or produced by an older runtime, carrying `created` earlier than `2026-09-20`. **Not** reachable through `createEvidence`, which always writes a block |
| **Source** | `src/graph/evidence-closure.ts:43-48` (`CLOSURE_PROVENANCE_FROM`, a string comparison against self-declared frontmatter); `src/graph/nodes.ts:35` validates `created` only as `^\d{4}-\d{2}-\d{2}$` |
| **Expected** | `validate` reports Evidence that never passed the §53 preconditions |
| **Actual** | `validate` reports **`ok: true`** for a hand-authored Evidence on a lineage with no run and no Review, when `created` is `2026-09-19` or `0000-00-00`. The same record dated `2026-09-20` is correctly reported (`missing-closure-provenance`) |
| **Evidence** | `executed-fail` — G-R03 rows 2 and 3; `executed-pass` — G-R03 row 1 (the cutover boundary itself works). G-STR-8 shows `created` accepts `2026-13-45`, `2099-01-01` and `0000-00-00` unchanged through `createIntent`. G-CLO-5a confirms the runtime path always writes a block, so this is an import/hand-edit trigger, not a runtime one |
| **Consequence for the reference itself** | All three Evidence records in the reference's own `specs/nodes/` are dated `2026-08-31`, `2026-09-01` and `2026-09-13` and carry no closure block. `validate` reports the repository `ok`. Their closure is not verifiable, and nothing says so |
| **Cause** | **Unenforced requirement.** The cutover is a date the record declares about itself; nothing independent corroborates it |
| **Acceptance proposal** | Two criteria. (1) `created` is validated as a real calendar date not in the future. (2) The closure-provenance exemption is not derived from record-declared data: either an explicit, listed set of grandfathered ids, or a lock-recorded cutover, so a new record can never claim it. Fixtures for a back-dated import, an impossible date, and a legitimately grandfathered record |

## G-06 — Evidence correction is refused for every record without a closure block

| | |
|---|---|
| **Severity** | High · PR #39 **R11 residual — confirmed** |
| **Requirement** | Core §45 (Evidence correction) |
| **Public trigger** | `pactwright lifecycle record prepare-evidence` on a `done` lineage whose current Evidence carries no `closure` block |
| **Source** | `src/validate/kernel.ts:607-612` advertises `prepare-evidence / supersede` for a `done` lineage; `src/graph/mutations.ts:258-267` (`carriedClosure`) returns `undefined` when the superseded record has no block; `src/graph/evidence-closure.ts:108-115` then rejects the new record, whose `created` is today |
| **Expected** | The §45 correction that `lifecycle status` lists as permitted commits |
| **Actual** | `mutation-invalid / missing-closure-provenance`. The permission was restored; the mutation still cannot complete |
| **Evidence** | `executed-fail` — G-CLO-6. Positive control `executed-pass` — G-CLO-7: the same correction over an Evidence record that *does* carry a block succeeds and supersedes correctly |
| **Scope of the dead end** | Every Evidence record in the reference's own graph, and every record imported from before `2026-09-20`. The comment at `kernel.ts:608-610` says the correction carries "its own closure block"; the implementation carries the superseded record's forward, or none |
| **Cause** | **Contradiction.** §45 says corrections are permitted; §14 says new Evidence must carry a block; the correction path can produce neither a new block (the run is gone) nor inherit one (there is none) |
| **Acceptance proposal** | A criterion that correcting Evidence created before closure provenance succeeds, and that the corrected record states honestly that it corrects a record predating verifiable closure — a third closure-block state, rather than presence/absence. A fixture per case: correcting a block-carrying record, correcting a grandfathered one, and rejecting a fabricated block |

## G-07 — The public mutation API self-deadlocks on a relative root

| | |
|---|---|
| **Severity** | High for API consumers; the CLI is unaffected |
| **Requirement** | Core §10 (repository writer lock); Distribution's package API surface |
| **Public trigger** | `createIntent("./project", …)` — any exported mutation given a root that is not already absolute. The CLI resolves its root through `findProjectRoot`, which returns an absolute path, so this is reachable only through the package API |
| **Source** | `src/graph/writer-lock.ts:171-186` keys re-entrancy on the *unnormalised* path string; `src/graph/mutations.ts:337-343` takes the lock with the caller's `root`, then `commitGraphChange` at `:127` takes it again with `project.paths.root`, which `projectPaths` has `resolve()`d |
| **Expected** | The mutation commits, as it does for the same project named absolutely |
| **Actual** | The inner take does not recognise the outer one, waits the full `DEFAULT_WAIT_MS`, and then throws `repository-locked` **naming the calling process's own pid** as the blocking holder: *"another Pactwright process (vm:1508) is writing to this repository"*. Measured 30 004 ms |
| **Evidence** | `executed-fail` — G-LCK-2. Positive controls: absolute root commits in 17 ms (G-LCK-1); a trailing separator commits (G-LCK-3, `join` normalises it); a symlinked absolute root commits (G-MUT-2); an identical path string re-enters (G-LCK-4). Durable effect: none — G-LCK-2b confirms no lock file and no partial node survive the refusal |
| **Why the suite misses it** | `tests/writer-lock.test.ts:162` passes the *same* `root` variable to both takes, so it cannot exercise two spellings of one path; no test calls `process.chdir`. This is the inverse of the root cause PR #39 named — not a double more capable than the code, but a fixture narrower than the production call chain |
| **Cause** | **Inadequate test.** The mechanism is right; its key is a raw string, and nothing proves the two takes in the shipped call chain agree |
| **Acceptance proposal** | A criterion that every exported mutation accepts any spelling of a project root that resolves to the same directory — relative, trailing separator, `..` segments, symlink — and a fixture that drives each through the real chain. The lock key should be derived once, from the same `projectPaths` the rest of the runtime uses |

## G-08 — Canonical records can leave the graph with no report

| | |
|---|---|
| **Severity** | Medium |
| **Requirement** | Core §5 ("IDs never change; records are superseded, not deleted") |
| **Public trigger** | Deleting or moving a file under `specs/nodes/`, then `pactwright validate` — the state any `git revert`, bad merge or manual tidy-up produces |
| **Source** | `src/graph/nodes.ts:113-125` (`checkNodeIdImmutability`) and `:137-149` (`loadNodes` reads one directory level and filters `*.md`) |
| **Expected** | The loader reports `id-removed` for a record that has left the graph |
| **Actual** | A deleted node file loads as a graph with one fewer node and **no problems** (G-STR-6). A node file moved one directory down into `specs/nodes/archive/` is silently invisible: nodes go from 1 to 0, problems stay empty (G-STR-5) |
| **The guard cannot fire** | `checkNodeIdImmutability` has exactly one production call site, `src/graph/mutations.ts:179`, where `nodes` is built at `:135` as `[...project.graph.nodes]` and only ever appended to. Its `previous` argument is therefore always a subset of its `proposed` argument, and it returns `[]` unconditionally. The four assertions in `tests/schema.test.ts:178-192` call it with hand-built arrays that production never constructs |
| **Evidence** | `executed-fail` — G-STR-5, G-STR-6; the dead call site is `code-traced` (read at `mutations.ts:135-179`, no other caller found in `src/`) |
| **Cause** | **Unenforced requirement.** Immutability is checked within one mutation, where it is structurally guaranteed, and never across time, where the hazard is |
| **Acceptance proposal** | A criterion that a record's disappearance is detected. It needs a previous snapshot to compare against — the lock, the last recorded graph revision, or git — so A4 must pick one; comparing the loaded graph against the revision recorded at the last mutation is the smallest. Fixtures: a deleted record, a record moved to a subdirectory, a record renamed, and a legitimately superseded record that must stay clean |

## G-09 — A read-only `validate` forks git five times per pending lineage

| | |
|---|---|
| **Severity** | Medium |
| **Requirement** | None stated; this is duplicate work, reported because A2-G was asked to identify it |
| **Public trigger** | `pactwright validate` on a project with lineages standing at their Evidence step |
| **Source** | `src/validate/kernel.ts:300-302` runs `evidenceRule` per lineage, and `:311-320` reaches the closure check; each call reaches `src/graph/closure.ts:137` → `repositoryRevision`, which runs four `git` invocations (`rev-parse --git-dir` is skipped when `.git` exists, then `rev-parse HEAD`, `diff HEAD`, `ls-files --others`, `diff HEAD --name-only`, and a fifth restricted `diff` when anything changed) |
| **Expected** | A read-only `validate` resolves the repository revision a bounded number of times |
| **Actual** | Exactly linear: **1 lineage → 5 git calls, 2 → 10, 4 → 20, 8 → 40**, every one re-deriving the same identity of the same unchanged tree |
| **Evidence** | `executed-fail` — G-COST-1, counted with a shim ahead of the real `git` on `PATH`, so the count is of what production ran |
| **Related, and *not* a problem at this scale** | `lineagesOf` and `checkGlobalCardinality` run at least four times per `validate` — once in `loadProject`, twice in the kernel's `structural` and `execution` scopes, and once more in `validateProject`'s summary, which calls `deriveLineages(nodes, edges)` at `src/validate.ts:95` **without** the already-built index and so rebuilds the whole `GraphIndex`. Measured wall-clock is nonetheless flat per lineage (2→63 ms, 8→163 ms, 16→306 ms; per-lineage ratio 0.61), so this is redundancy, not a scaling defect (G-COST-2, `executed-pass`) |
| **Cause** | **Unenforced requirement.** `GraphIndex` exists precisely so one snapshot is derived once; the repository revision has no equivalent and every caller re-derives it |
| **Acceptance proposal** | Not an acceptance criterion — a design note for A5. Resolve the repository revision once per snapshot, as `GraphIndex` is built once per snapshot, and pass it through `GraphSnapshot`. If A4 wants a criterion, the honest one is a bound on subprocess count per `validate`, which is measurable and does not over-specify the fix |

## G-10 — `edges.yml` is rewritten wholesale on every mutation

| | |
|---|---|
| **Severity** | Medium |
| **Requirement** | Core §59 (the graph is files in the repository) |
| **Public trigger** | `pactwright lifecycle record capture-intent` — any mutation, including one that adds no edge |
| **Source** | `src/graph/mutations.ts:56-64` (`serialiseEdges`) and `:199-202`, which always writes the file |
| **Expected** | A mutation that adds no edge leaves the edges file as written |
| **Actual** | A comment line is destroyed by an `createIntent` that adds zero edges; the file is replaced with the canonical rendering |
| **Evidence** | `executed-fail` — G-MUT-1. Durable effect: the hand-written content is gone from the working tree |
| **Cause** | **Unenforced requirement.** The file is treated as a serialisation target rather than as a repository file a human also edits, which §59 implies it is |
| **Acceptance proposal** | A criterion that a mutation adding no edge does not modify `edges.yml`, and that one adding an edge preserves everything the parser does not own. `parseEdges` already rejects unknown keys, so the only content at risk is comments and ordering — A4 should decide whether they are preserved or whether the file is declared machine-owned, in which case `sync`-style regeneration should state so |

## G-11 — Frontmatter strings are not line-ending-normalised in the revision

| | |
|---|---|
| **Severity** | Low |
| **Requirement** | Core §5 ("canonicalise ordering before hashing") |
| **Public trigger** | Any multi-line frontmatter value — an Evidence closure block is one — on a checkout with `core.autocrlf=true` |
| **Source** | `src/graph/revision.ts:52-70`: `body.replace(/\r\n/g, "\n")` is applied to the body and to nothing else |
| **Expected** | A frontmatter string differing only in line endings derives the same revision, as a body does |
| **Actual** | Different revisions; the canonical payload carries the raw `\r\n` |
| **Evidence** | `executed-fail` — G-ID-7b. Positive control `executed-pass` — G-ID-7: the body is correctly immune |
| **Cause** | **Missing requirement.** §5 does not say what canonicalisation covers, and the implementation chose one field |
| **Acceptance proposal** | A criterion that the graph revision of a checkout is independent of the platform's line endings, asserted over the whole canonical payload rather than the body — most simply as a property over generated nodes |

## G-12 — `loadContext` rejects the extension namespace `constructor`

| | |
|---|---|
| **Severity** | Low |
| **Requirement** | Delivery Graph §22 (namespaced extension context) |
| **Public trigger** | `loadContext(project, id, { contributors })` with `namespace: "constructor"` — a string `EXTENSION_ID_PATTERN` accepts |
| **Source** | `src/context.ts:147-158`: `extensions` is an object literal and the duplicate check is `contribution.namespace in extensions`, which is true for inherited `Object.prototype` members before anything has been contributed |
| **Expected** | A single contribution under a schema-valid namespace is accepted once |
| **Actual** | `duplicate-context-namespace` on the first contribution |
| **Evidence** | `executed-fail` — G-STR-7 for `constructor`; `executed-pass` for `review` and `isprototypeof`, which confirms the trigger is exactly the lowercase prototype members |
| **Notable** | The graph schema registries at `schema.ts:77` and `edge-schema.ts:48` are deliberately `Object.create(null)` with a comment saying why. The same hazard one layer up was not hardened, and G-EXT-5 confirms a node type named `constructor` is handled correctly. This is an inconsistency in applying a lesson the codebase already learned |
| **Cause** | **Unenforced requirement.** |
| **Acceptance proposal** | Roll into a single criterion with G-05's validation work: every map keyed by externally supplied names is prototype-less, with a fixture that registers `constructor`, `__proto__` and `toString` as a node type, an edge type, a command namespace and a context namespace |

## G-13 — Taking the writer lock creates `.pactwright/` anywhere

| | |
|---|---|
| **Severity** | Low |
| **Requirement** | None stated |
| **Public trigger** | `withRepositoryLock(path, fn)` — exported — on a path that is not a project |
| **Source** | `src/graph/writer-lock.ts:182`: `mkdirSync(join(root, ".pactwright"), { recursive: true })` before any check that `root` is a project |
| **Expected** | Acquiring a lock does not create directories under a path that is not a project |
| **Actual** | `.pactwright/` is created, and left behind |
| **Evidence** | `executed-fail` — G-LCK-5. Durable effect: a stray directory |
| **Cause** | **Unenforced requirement.** |
| **Acceptance proposal** | Fold into G-07's criterion: the lock is keyed and created from resolved project paths, so a non-project path is refused rather than scaffolded |

## G-14 — A supersession cycle spanning two acyclic relations is not detected

| | |
|---|---|
| **Severity** | Low today; it becomes reachable when an extension declares a second acyclic relation |
| **Requirement** | Core §15, Delivery Graph §13, Distribution §7 |
| **Public trigger** | An extension whose manifest declares an `acyclic` edge schema, alongside core `supersedes`, with edges forming a cycle between them |
| **Source** | `src/graph/edge-schema.ts:164-175`: `sound` is keyed by `edge.type`, and `findCycles` is run once per type |
| **Expected** | A supersession cycle formed by two acyclic relations together is reported |
| **Actual** | `no problems` |
| **Evidence** | `executed-fail` — G-STR-3. Positive controls `executed-pass`: a single-relation `supersedes` cycle is reported (G-STR-1), and a cycle in a relation that does *not* declare acyclicity is correctly accepted (G-STR-2) |
| **Deliberate design, correctly** | Checking per relation is right, and this report wants that recorded as a strength (S-3). The gap is only that "acyclic" is declared per type when the property being protected — a record cannot supersede itself transitively — is a property of a *set* of relations |
| **Cause** | **Ambiguity.** The specifications do not say whether two extensions' supersession-like relations compose |
| **Acceptance proposal** | A criterion covering the composition: either acyclicity is declared over a named relation *group* that extensions may join, or extensions are explicitly forbidden from declaring `acyclic` relations over core node types. A fixture with a two-relation cycle |

## G-15 — An extension relation may join two core records

| | |
|---|---|
| **Severity** | Informational — an ownership boundary A5 must settle, not a defect |
| **Requirement** | Rule 16 ("extension state that illegally redefines core Delivery semantics"), Distribution §7 |
| **Public trigger** | An extension declaring an edge type with `sourceTypes: any` / `targetTypes: any` |
| **Source** | `src/extension/resolve.ts:245-267` checks only that a *type name* is not already owned; `src/graph/edge-schema.ts:92-98` admits `"any"` endpoints |
| **Actual** | An extension edge `evidence --observes--> intent` validates cleanly, and core lineage derivation ignores it entirely |
| **Evidence** | `executed-fail` against this session's expectation — G-EXT-3. Whether it *should* fail is the open question |
| **Cause** | **Ambiguity.** Rule 16 is implemented as name-collision detection; the specification's wording is broader than that |
| **Acceptance proposal** | A5 states what rule 16 covers. If it is name collisions only, say so in §57 and keep the implementation. If it is semantic, a criterion is needed for the cases that matter — an extension relation that would change which record is current, or which lineage a record belongs to |

## Unexecuted findings

Each of these is reasoned from the source and **was not run**. They are listed
so A3 can commission the reproduction rather than inherit an impression.

| ID | Claim | Source | Status | Why not run |
|---|---|---|---|---|
| G-16 | `withRepositoryLock` releases the lock unconditionally in `finally` (`writer-lock.ts:227-230`), with no re-read of the holder. A process whose run exceeds `staleAfterMs` (120 s) has its lock reclaimed by a waiter; its own `finally` then deletes the *new* holder's lock, putting two writers in the critical section | `src/graph/writer-lock.ts:104-150, 224-230` | `code-traced` | Needs a deliberately >120 s holder and two real processes. Concurrency is the distribution audit's boundary; flagged here because the lock lives in `src/graph/` and gates every graph write |
| G-17 | `workingTreeDigest` computes a path-restricted `git diff HEAD -- <changed…>`; when that invocation fails, `git()` returns `undefined` and the code falls back to the **unrestricted** diff (`hash.update(restricted ?? diff)`), silently re-including `.pactwright/execution/` and the adapter surface. The most likely trigger is the argument-list limit on a delivery touching many files | `src/graph/repository.ts:102-115` | `code-traced` | Reproducing needs a delivery large enough to exceed `ARG_MAX`; not attempted in the time available |
| G-18 | `restore()` in `commitLocked` is called from the `catch` arms but is not itself guarded: its `writeFileSync`/`renameSync` can throw, replacing the original error and leaving the graph with new node files and a half-restored `edges.yml` | `src/graph/mutations.ts:204-248` | `code-traced` | Needs a filesystem fault injected between the rename and the restore. `CommitOptions.postWrite` is the seam for it; A4's harness should use it |
| G-19 | The relationship message reads *"a evidence has exactly 1 evidences edge"* — wrong article, and the edge name is pluralised as if it were a count | `src/graph/relationships.ts:53-63` | `executed`, observed in the G-R03 run output | Cosmetic; recorded because §57 messages are a public surface |

## Coverage gaps — what this session did not reach

Said plainly, rather than left to silence:

- **PR #39 R12** (`review → review` synthetic edge; its "new cause" at
  `transition.ts:222`, where a delivery reporting `revision: ""` writes state
  that `expectString` rejects on read). I traced kernel rule 11's
  `visited`-as-chronology handling and confirmed it does not manufacture a
  `review → review` transition, but I did **not** reproduce the empty-revision
  path. It sits in the lifecycle reducer; A2-L owns it.
- **R04, R05, R06, R07, R08, R09, R10, R13** — other boundaries. R07/R10 touch
  graph records through extension migrations and this session reached none of
  that: **no migration was executed against a graph**.
- **Concurrency.** Every probe here is single-process. The compare-and-swap at
  `mutations.ts:188-195`, lock hand-off, and the wholesale `edges.yml` rewrite
  under two real writers are untested by this session.
- **Packed-consumer behaviour.** Everything ran from source through `tsx`
  against the workspace, plus one `dist/cli.js validate`. The packed package
  boundary is A2-V's.
- **Extension records in the revision.** `CanonicalRecord` is covered by a
  synthetic payload case (G-ID-6) but no real extension contributed one.
- **`pactwright context --history` at scale.** `lineageTree`
  (`src/context.ts:70-104`) does not deduplicate its `flatMap` collection; the
  runtime's own mutations produce a 1:1 decision→contract shape so no duplicate
  appeared (G-STR-9, positive control). A graph where two decisions select one
  contract would, and I did not construct one.

---

# Strengths — what a reimplementation should keep

The format asks for these explicitly, and the reason is sound: a rewrite that
discards a working mechanism because nobody wrote down that it worked is worse
than one that keeps a flawed mechanism knowingly.

| ID | What | Evidence |
|---|---|---|
| **S-1** | **The identity and serialisation core is sound under generated input.** `slugify` is idempotent; every minted id satisfies `checkNodeId` for its own type across five types; minting is deterministic and never returns a taken id; `parseNodeFile(serialiseNode(n))` reproduces id, type, title, `created` and body over 397 of 400 generated nodes including unicode, CRLF, NUL, `---` and YAML-significant characters | `executed-pass` G-ID-1..4 |
| **S-2** | **The graph revision is a well-behaved identity.** Invariant under 40 permutations of node and edge order; sensitive to the body, any frontmatter field, an added edge and an extension record; independent of file path | `executed-pass` G-ID-5, G-ID-6, G-ID-6b |
| **S-3** | **Cycles are checked per relation, from the schema.** `acyclic` is a property of an edge type, not an assumption about the graph. A `supersedes` cycle is reported; a cycle in a relation that does not claim acyclicity is correctly left alone. This is the right shape and G-14 is a boundary on it, not a refutation | `executed-pass` G-STR-1, G-STR-2 |
| **S-4** | **Declared cardinality is checked for every record, reachable or not.** A decision resolving two intents is reported `excess-relationship`; an orphan extension record with its own rule is reported `missing-relationship`. This closes the class of defect where an orphan escaped because the lineage walk never visited it | `executed-pass` G-STR-4, G-EXT-4 |
| **S-5** | **One index per snapshot, and it fails closed.** `GraphIndex` replaces four separately written parent walks; `intentOf` throws `ambiguous-parent` rather than taking the first edge | `code-traced`, `src/graph/graph-index.ts:5-14, 147-175` |
| **S-6** | **Schema registries are prototype-less on purpose,** and it works: a node type named `constructor` resolves as an ordinary registered type | `executed-pass` G-EXT-5 |
| **S-7** | **Extensions genuinely share the core machinery.** An extension node type supersedes its own records through the shared `supersedes` relation, gets the same cardinality enforcement, and cannot redeclare a core node or edge type | `executed-pass` G-EXT-1, G-EXT-2, G-EXT-4 |
| **S-8** | **Refusals leave nothing behind.** After the 30-second `repository-locked` failure of G-07 there is no lock file and no partial node; the pre-mutation gate refuses before planning | `executed-pass` G-LCK-2b |
| **S-9** | **The delivery digest covers content the obvious implementation would miss.** Two different *binary* contents at one tracked path derive different identities (git's index line carries the blob hash), and untracked files are read and hashed directly — the case a `dirty` boolean lost | `executed-pass` G-REV-1, G-REV-3 |
| **S-10** | **Excluding `.pactwright/execution/` from the digest is load-bearing** and should survive any change made for G-04: it is what stops a run invalidating its own Review, and what lets several Reviews be taken against one repository state | `code-traced` + G-COST-1's fixture, which depends on it |
| **S-11** | **The digest is deterministic.** Five reads of one unchanged state derive one identity | `executed-pass` G-REV-7 |

---

# Architecture

Assessed with `architecture-patterns` as a lens. No refactor is proposed; A5
owns design.

**The layering is real where it matters.** `src/graph/` holds the domain —
nodes, edges, schemas, lineage, revision — and depends on `node:fs` only in the
three places that must (`nodes.ts` loading, `mutations.ts` writing,
`writer-lock.ts`). `repository.ts` is the one domain module that shells out, and
it is honest about being an adapter for git. The schema registries are a
genuine port: `createNodeSchemaRegistry` / `createEdgeSchemaRegistry` let an
extension extend the domain without the domain knowing about extensions, and
G-EXT-1/2/4 show the seam carrying real weight.

**Two dependency directions are inverted from what the names suggest.**
`src/graph/closure.ts` imports `lifecycle/engine`, `lifecycle/shape`,
`lifecycle/transition` and `lifecycle/state`, and re-exports `selectLineages`
from the lifecycle engine. `src/validate/kernel.ts` imports from `graph/`,
`lifecycle/`, `config/`, `extension/`, `pack/` and `version/` — thirteen
modules. So "the graph" depends on "the lifecycle", and the validator depends on
everything. That is the structural reason G-01 exists: a closure question is
answered by reading the repository, the lifecycle and the graph at once, and
nothing scopes the answer to one lineage. It is also why G-09's repeated git
calls are invisible at the call site — `evidenceRule` looks like a cheap
predicate.

**The mutation path is the best-shaped part of the system.** `plan → validate
the complete proposed state → write atomically → validate the resulting state`,
all under one lock, with `proposedSnapshot` letting the same kernel judge a
state that is not yet on disk. `CommitOptions.postWrite` is a deliberate
fault-injection seam. This is worth preserving almost verbatim; G-18 is a gap in
its rollback, not in its shape.

**The one seam that is not a port** is the repository revision. `GraphIndex`
established the pattern — derive once per snapshot, share it — and the
repository revision never adopted it, which is G-09.

---

# Duplicate work and coupled semantics

Asked for explicitly by the assignment.

**Duplicate work**

1. `repositoryRevision` re-derived per lineage per validation pass — 5 git
   subprocesses each, measured linear (G-09).
2. `lineagesOf` / `checkGlobalCardinality` derived at least four times per
   `validate`, including once over a freshly rebuilt `GraphIndex` at
   `src/validate.ts:95` where the built one was available. Not a scaling
   problem at these sizes (G-COST-2) but it is the same derivation four times.
3. `lineageOfIntent` calls `checkGlobalCardinality(graph)` — a full scan of
   every contract and brief — for a single intent, so any caller that loops
   over intents through `lineageFor` is quadratic by construction. No such
   caller exists today; `lineagesOf` correctly hoists the scan. Recorded
   because the shape invites one.

**Coupled semantics**

1. **Repository identity ≠ lineage identity** (G-01, G-04). §53's "delivered
   state" is enforced through a whole-repository digest, so any write anywhere
   is a delivery change everywhere. This is the single highest-value thing for
   A5 to settle, and both G-01 and G-04 dissolve once it is.
2. **Closure provenance ≠ record age** (G-05, G-06). One date constant carries
   two meanings — "this record predates the mechanism" and "this record is
   exempt from it" — and a record declares its own age, so the exemption is
   self-served on the way in and inescapable on the way out.
3. **The mutation gate's scope ≠ the mutation's scope.** Validating the
   complete proposed state is right (§57) and is what makes G-01 fatal rather
   than merely noisy: an unrelated lineage's failure blocks an unrelated write.
   Whether "complete" means the whole graph or the affected lineage plus global
   invariants is a real design question, not an implementation detail.
4. **Authority has one table and three consumers** (`src/graph/authority.ts`),
   which is the *good* version of this: a previous duplicate was collapsed, and
   `recordDecision`, rule 13 and the reducer can no longer disagree. Worth
   naming as the pattern the three couplings above have not yet reached.

---

# For A4 and A5

Proposals, not decisions.

1. **Settle repository identity versus lineage identity first.** G-01 and G-04
   are the same question. Everything else in this report is local; this one
   changes what §53 means.
2. **Make identity classification total, not prefix-based.** G-02 and G-03 both
   come from a positive test on `git:`. Three outcomes — re-derivable,
   recorded-but-not-reconstructible, unknown — with closure permitted only on
   the first, closes both and gives rule 17 the same vocabulary it already
   half-uses through `isReconstructible`.
3. **Take the closure-provenance cutover out of record-declared data** (G-05,
   G-06), and give the correction path a third state so a grandfathered record
   can be corrected honestly.
4. **Validate `created` as a real, non-future date** (G-05, G-STR-8), and make
   every externally-keyed map prototype-less (G-12), which the schema
   registries already do.
5. **Derive the repository revision once per snapshot** (G-09), the way
   `GraphIndex` is derived once per snapshot.
6. **On property-based testing.** The identity, serialisation and revision
   surfaces are strong PBT candidates and the hand-rolled generators in
   `probe-identity-properties.ts` already found G-11. Adopting `fast-check`
   would give shrinking — this session's counterexamples had to be read off raw
   generated strings — and would make the properties maintainable as
   acceptance proofs rather than as probe code. That is a dependency decision
   for the maintainer; A4 should take it explicitly rather than inherit these
   probes. If the answer is no, the LCG approach works and the seeds are
   recorded.
7. **Do not treat this report's passes as coverage of the areas listed under
   *Coverage gaps*.** In particular nothing here exercises concurrency,
   migrations against graph records, or the packed package boundary.

---

# Probes

All under `tools/implementation-trial/a2-graph/`, all disposable, none touching
the reference.

| File | Observations | What it establishes |
|---|---|---|
| `fixture.ts` | — | Disposable project fixtures, the seeded PRNG, the observation recorder |
| `probe-repository-revision.ts` | 8 | What the delivery digest can and cannot tell apart (G-03, G-04; S-9, S-11) |
| `probe-closure.ts` | 8 | The §53 preconditions as a guard over graph writes (G-02, G-03, G-04, G-06) |
| `probe-backdated-evidence.ts` | 3 | A hand-authored Evidence judged by the full kernel (G-05) |
| `probe-cross-lineage.ts` | 7 | The whole-repository write wedge and its recovery (G-01) |
| `probe-write-path.ts` | 8 | Writer-lock keying and durable write effects (G-07, G-10, G-13; S-8) |
| `probe-structure.ts` | 11 | Typed edges, cardinality, supersession, visibility (G-08, G-12, G-14; S-3, S-4) |
| `probe-identity-properties.ts` | 9 | Generated properties over ids, serialisation, revision (G-11; S-1, S-2) |
| `probe-extension-ownership.ts` | 6 | What an extension owns and what it can reach (G-15; S-6, S-7) |
| `probe-validation-cost.ts` | 2 | Repeated derivation and repository I/O (G-09) |
| `run-all.sh` | — | Runs all nine in order |

**62 observations; 28 `executed-fail`, 34 `executed-pass`** (one full `run-all.sh` pass, exit 0). Every
`executed-fail` is a finding above; the `executed-pass` results are the positive
controls and the strengths. Three findings (G-16, G-17, G-18) are `code-traced`
and were not run; they are labelled as such in their own table and nowhere else.
