---
id: contract-write-tests-derived-9c48
type: contract
title: Derive the test-verification hop from the lane's test artifacts (injected resolver probe, no graph write)
status: rejected
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-write-tests-status-flip-2b64` (class 2) and is candidate **B** of
three. The market's single axis is **what makes the `test-verification` hop derivable**: a status an
agent writes (A, `contract-write-tests-flip-3a71`), a working-tree fact the resolver reads (B), or a
printed step the resolver emits unconditionally (C, `contract-write-tests-market-5e26`). B takes the
**artifact** position: `/write-tests` stays entirely write-free, and the resolver stops keying this
one lane on a status it can never observe, keying it instead on whether the lane's named test files
exist.

## Problem interpretation

A7's flip is a *recorded claim* that work happened. For six lanes that is the only available signal.
For `test-verification` it is not: the lane's deliverable is **files on disk**, and their existence
is directly checkable. B's reading of the finding is therefore that the resolver is asking the wrong
question — it asks "did someone record that this lane is done?" when it could ask "are the lane's
tests there?".

The structural facts B must design around, verified in `tools/conveyor.ts`:

1. In `briefSteps` the `status === "implemented"` check at `:521` precedes the
   `lane === "test-verification"` check at `:574`, so candidate A needs no code. **B needs code**:
   `tools/conveyor.ts` is a `capability-spec-tooling-1a2b` surface, and `tests/conveyor.test.ts`
   grows with it. That asymmetry is B's largest cost and is not argued away.
2. The module's header (`:19-30`) makes **PURE** load-bearing: no I/O, no `Date`, no `spawnSync`,
   because `indexer.ts` imports `nextSteps` for the `trails.md`/`status.md` serializers, which run
   inside `handlers/indexes_fresh.ts` on **every** `spec:validate`. A filesystem read placed inside
   the resolver would make an index byte depend on the working tree and red every PR that adds or
   deletes a test file. B therefore does **not** put I/O in the resolver: the facts are **injected**
   by the impure caller.
3. A `test-verification` brief whose patch market is **resolved** already routes to
   `/prepare-evidence` at `:533`, so the break is only the no-market path.

Four constraints this candidate holds:

1. **Lane rule 1 holds** — `test-writer` still writes the tests through `/write-tests`, separate
   from the `/implement-brief` that wrote the code under test.
2. **Rule 6 holds trivially** — this candidate authors **no** graph write anywhere in the lane. A7's
   precedent is not widened at all.
3. **`/prepare-evidence` stays idempotent** — it is reached at `draft`, which is its pre-existing
   laned path (`prepare-evidence.md:9-13` sets the brief to `implemented` if it is not already).
4. **The lane reaches final evidence by paste alone**, because once the tests exist the resolver
   prints `/prepare-evidence <brief-id>` itself.

## Scope

1. **`tools/conveyor.ts`** —
   1. a `LaneArtifacts` interface: an injected, side-effect-free fact set answering, per brief id,
      `allNamedTestFilesPresent: boolean | undefined` (`undefined` = unknown);
   2. `nextSteps(spec, nodeId, artifacts?: LaneArtifacts)` — a third **optional** parameter
      defaulting to an empty probe, so every existing caller compiles and behaves unchanged;
   3. the `:574` lane branch consults it: `true` → `pasteStep("prepare-evidence", …)` with a `why`
      naming the artifact basis and an early return; `false` or `undefined` → `/write-tests` as
      today, the `why` naming the missing file or the absent probe. **Fail toward reprint** — the
      weaker failure mode, per the module's NEVER-EMPTY/TOTAL properties;
   4. the header's PURE paragraph is extended to state that facts are injected, never read.
2. **`tools/spec.ts`** — the `status` branch builds the real probe: parse the brief body's
   `## Files to create` / `## Files to modify` sections for backticked paths under `tests/`, then
   `fs.existsSync` each. Read-only, exit 0, no network; a parse or stat failure yields `undefined`,
   not a throw, and any hard failure still exits through the fail-closed `spec:` channel.
3. **`tools/indexer.ts`** — passes **no** probe, with a comment recording that this is deliberate:
   the view serializers must stay a pure function of the graph so `indexes-fresh` and
   byte-determinism hold. This is the declared divergence named in Trade-off 4.
4. **`.claude/commands/write-tests.md`** — the `KNOWN GAP` block (`:21-25`) is replaced by the
   derivation's contract: the command remains write-free; `test-writer` must create the test files
   the brief **names** (the probe's input), and any file written that the brief does not name is
   reported so the brief can be corrected under rule 5. The lane precondition and `REFUSAL REPORT`
   (`:4-14`) are unchanged, byte for byte.
5. **`tests/conveyor.test.ts`** — probe legs, all pure (no fs): no probe → `/write-tests`; probe
   `true` → exactly one step, `/prepare-evidence`, and no 2.5(c) reminder appended; probe `false` →
   `/write-tests` with the missing path in `why`; a brief naming no test file → `/write-tests`.
6. **`tests/spec.test.ts`** — the impure half: a fixture where the named test file is absent prints
   `paste /write-tests`, and the same fixture with the file created prints
   `paste /prepare-evidence`, with `specs/` unchanged between the runs.
7. **`tests/fixtures/conveyor-transcript/`** — the `write-tests` manifest entry
   (`transcript.yaml:99-105`) records the bug today. Re-recording it under B requires the fixture to
   provide the test file `brief-laned-tests-0f06` names, so the fixture gains that stub file and the
   entry is re-recorded by the manifest's own procedure. **The transcript artifact thereby becomes
   filesystem-dependent** — stated, not hidden.
8. **`CLAUDE.md`** — the conveyor subsection records the bound: for this one lane the printed next
   step is a function of the graph **and the working tree**, so `spec:status` and the committed
   views may differ by design.
9. **Graph records** — `drift-finding-write-tests-no-flip-7e52` moves to `resolved`, through
   graph-maintainer.

## Out of scope

1. **No status flip anywhere**, and no new producer of `implemented`. `/implement-brief` keeps A7
   unchanged.
2. **No suite execution in the resolver or the subcommand.** Presence is checked; greenness is not.
   Running tests inside `spec:status` would break both purity and the read-only guarantee.
3. **No probe for any other lane.** The artifact question is well-posed only where the deliverable
   is a file set the brief enumerates.
4. **No schema change, no new field, no validation rule.**
5. **`intent-write-tests-unlaned-brief-b3d8`** and **`intent-implement-brief-graph-lane-b3f5`**.
6. **No new `Stage` value.** `deriveStage` is untouched, which is precisely the honest bound below.

## Behaviour

1. `nextSteps` remains pure and total. The probe is data; the I/O lives in `spec.ts`. Absent probe ⇒
   today's behaviour exactly, so no existing caller changes.
2. The file list is the brief body's own `## Files to create`/`## Files to modify` entries filtered
   to `tests/`. A brief that names none yields `undefined` and reprints `/write-tests`.
3. When the probe reports every named file present, the branch returns a single
   `/prepare-evidence <brief-id>` step and returns early, so the 2.5(c) class-≥2 judgement reminder
   does not append — mirroring `:521`.
4. **The brief's `status` stays `draft` forever.** `deriveStage` still returns `brief-open`, so
   `spec:status`'s stage line, `trails.md` and `status.md` cannot distinguish "tests written" from
   "not started". This is B's honest bound and it is not mitigated, only declared.
5. **Declared divergence.** Because `indexer.ts` passes no probe, the views print `/write-tests` for
   a brief whose tests exist while `spec:status <brief-id>` prints `/prepare-evidence`. The single
   *producer* property survives (one function); the *facts* differ per caller.
6. **Self-healing.** Deleting the lane's tests makes the resolver correctly reprint `/write-tests` —
   no candidate that records a status can do this.
7. **Patch market.** Unchanged: the `:533`-`:557` branches precede the lane branch, so the probe is
   never consulted while a market is open or unresolved.
8. **Class 2 with an optional verification lane.** Identical; the probe reads no class.
9. Changing the resolver's basis for a lane is a change of intended behaviour, so the selecting
   `decision` carries the rule-5 declaration.

## Trade-offs

1. **+ No graph write, so no precedent to widen.** Rule 6 and A7 are untouched; `test-writer` stays
   write-free and no agent is trusted with a status.
2. **+ Routing reflects the world, not a recollection.** The step is derived from the artifact the
   lane exists to produce; a skipped or reverted test set cannot leave a stale "done" behind.
3. **− The largest change of the three, on the most sensitive surface.** `tools/conveyor.ts`,
   `tools/spec.ts` and `tools/indexer.ts` (`capability-spec-tooling-1a2b`), a signature change to
   the repo's single routing entry point, two test files, and a filesystem-dependent transcript
   fixture. Candidate A needs one markdown file.
4. **− It introduces exactly the divergence the conveyor exists to prevent.** Two callers of one
   resolver now answer differently for the same node by construction (Behaviour 5). That is the
   sharpest case against B, and the honest reply is only that the divergence is documented and
   one-directional (the views are conservative — they never print the *later* step).
5. **− Presence is not greenness, and the brief is the oracle.** An empty `tests/foo.test.ts` and a
   failing suite both satisfy the probe, and a brief that under-names its files misroutes. The
   verification the lane owes is judged by `/prepare-evidence`'s evidence gathering, not by the
   probe.
6. **− The status stays `draft` forever** (Behaviour 4), so a future consumer — project sync, issue
   sync, any scorecard — reading brief status gets a false negative for every verification lane.

## Acceptance

1. **Paste-only, live.** On the next `test-verification` lane, `/write-tests <brief-id>` is run,
   then `pnpm spec:status <brief-id>` prints a block whose only paste line is
   `paste /prepare-evidence <brief-id>`, and `git status --porcelain specs/` is empty between the
   two runs — the hop closed with **no** graph mutation. That run is the discharging acceptance run;
   remediation on failure is a `drift-finding` plus a rule 5 route.
2. **The probe is falsifiable both ways.** With the brief's named test file deleted, the same
   command prints `paste /write-tests <brief-id>` and the `why` names the missing path.
3. **Purity preserved.** Creating or deleting a file under `tests/` leaves `pnpm spec:index` output
   byte-identical, and `pnpm spec:validate` stays green — the leg that reds any later attempt to
   move the probe into the indexer.
4. **Unit legs.** `nextSteps` with no probe returns today's `/write-tests` step for every recorded
   fixture graph, so the default path is pinned unchanged.
5. **Divergence declared, not accidental.** A test asserts that for the same brief the view row and
   the `spec:status` block differ, with the CLAUDE.md sentence quoted in the test's comment; if a
   later change removes the divergence, the test's failure is the prompt to update the doc.
6. **Finding closed.** `drift-finding-write-tests-no-flip-7e52` is `resolved`.
7. **Review-only, admitted.** Whether presence-without-greenness is an acceptable routing basis, and
   whether the declared view divergence is tolerable, stays reviewer judgement.

## Risks

1. **A later edit moves the probe into `indexer.ts`** and reds every PR through `indexes-fresh`
   (CC-8). *Mitigation:* Acceptance 3's byte-identity leg, plus the header paragraph in Scope 1.4.
2. **Brief-body parsing is a partiality source.** *Mitigation:* the parser is total, returns
   `undefined` on anything it cannot read, and `undefined` fails toward reprinting `/write-tests`.
3. **False forward routing.** A stub file satisfies the probe and `/prepare-evidence` is printed for
   a lane with no real tests. *Mitigation:* `/prepare-evidence` must gather concrete test output; a
   substanceless evidence node is a rule-5 event, and `/integrate` judges the combined run.
4. **The permanently `draft` status misleads a future consumer.** *Mitigation:* named as the honest
   bound in Behaviour 4 and Trade-off 6; if a consumer needs the distinction, a follow-up intent
   adds it rather than this contract widening.
5. **The transcript fixture becomes working-tree-sensitive.** *Mitigation:* the stub file is
   committed inside the fixture and named in its manifest comment, so a missing file is a legible
   failure rather than a mysterious diff.

## Critique (spec)

Concern. The self-healing claim in Behaviour 6 dies at `conveyor.ts:521`, which short-circuits the
probe forever once `/prepare-evidence` has flipped the brief, and the probe's input includes
`## Files to modify` paths that already exist before the lane runs. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (product)

Concern. B closes the loop only in `spec:status <brief-id>` and deliberately leaves `status.md`'s
per-brief `next` column printing `/write-tests` forever, so the dashboard built to make the loop
self-guiding still dead-ends. Full finding in `comparison-write-tests-market-6e83`.

## Critique (ux)

Concern. The probe's oracle is the brief's prose file list, and on the very brief that motivated
this intent that list is globs and brace-expansions `fs.existsSync` can never satisfy — so B
reprints forever with the explanatory `why` discarded by `printNextBlock`. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (architecture)

Concern. `LaneArtifacts` is not a pure-core/impure-shell seam: `briefSteps` has four entry paths and
B threads one, and an optional parameter makes every missed hop compile silently — including
`integrationSteps:653`, the live path for this lane. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (security-privacy)

Concern. Backticked paths parsed from an agent-authored brief body reach `fs.existsSync` with only a
"under `tests/`" bound — no `..` rejection, no absolute-path rejection, no symlink containment — so
the CC-6 refusal precedent is unmet. Full finding in `comparison-write-tests-market-6e83`.

## Critique (compliance-risk)

Concern. The answer to "was this lane verified?" becomes a mutable property of a working tree, so a
later unrelated edit retroactively changes the record of a past verification and every drift packet
reports `status: draft` for a brief whose own evidence produced it. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (qa-test)

Concern. The probe returns `false` on the very brief whose loop produced this intent and B fails
toward reprint, so the defect is re-derived rather than fixed — while every proposed leg is
synthetic and would pass. Full finding in `comparison-write-tests-market-6e83`.

## Critique (reliability-ops)

Concern. `undefined` routes to a `paste` line the module defines as "safe to run as printed" when
the probe knows nothing, where the module's own floor for an unknown is an explicit `noStep` — the
same defect B convicts C of. Full finding in `comparison-write-tests-market-6e83`.

## Critique (cost-maintainability)

Concern. Routing becomes a function of unenforced brief prose no command file mandates and no rule
constrains, and Acceptance 5 inverts the signal — removing the declared divergence reds CI, so the
cheapest way past a red test is to restore the wart. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (release)

Concern. A9 leg 2 copies only `FIXTURE/specs` and runs `spec:status` with `cwd` set to the scratch
dir, so the probe can never see the fixture stub and B's re-recorded block reds CI without an
out-of-scope change to `ci.yml`. Full finding in `comparison-write-tests-market-6e83`.
