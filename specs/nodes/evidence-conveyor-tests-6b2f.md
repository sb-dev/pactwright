---
id: evidence-conveyor-tests-6b2f
type: evidence
title: Test-verification lane implemented — the thirteen-leg lane union pin, the A6 resolver-invocation pin with its negative leg, the conveyor routing matrix, the four CC-8 view legs and the CC-12 transcript replay
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-tests-4c86` (lane `test-verification`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`3bae96e` — seventy-five files, +3795/−51 — plus the CC-8 completion described under "Acceptance 4"
below. Every path is under `tests/**`. No `tools/`, no `specs/`, no `.claude/`, no `.github/`, no
root file, no graph write by this lane.

**Written by `test-writer` via `/write-tests`, never by the invocation that wrote the code under
test.** This is CLAUDE.md's lane rule 1 and it is sharper here than anywhere else in the change: the
acceptance this lane machine-checks (A6) is an assertion *about artifacts another lane writes*, so a
shared invocation would be marking its own work. The session that authored `tools/conveyor.ts`,
`tools/issue_sync.ts`, `tools/indexer.ts`'s widened `INDEX_FILES`, `tools/spec.ts`'s `status` branch,
the `.claude/lanes/` catalog and the seven implementer agents wrote **none** of these tests — it
reviewed them, found two gaps (below), and sent them back to `test-writer` rather than closing them
itself.

## Suite result

**289 tests, 289 passing**, 0 failing, 0 skipped, 0 todo. `tsc --noEmit` exits 0.
`spec:validate` green — 20 rules, 0 errors. The suite entered this lane at 187 tests with 4 failing.

## Acceptance 1 — Acceptance 2's routing, unit-tested

`tests/conveyor.test.ts` carries the routing matrix over `nextSteps(spec, nodeId)` — thirty-three
top-level cases covering Behaviour 2.1 through 2.9. The three branches the contract's Acceptance 2
names explicitly are each their own leg:

1. **A selected patch routes to `/prepare-evidence <brief-id>` through `competes-for`, never a
   branch.** This is the leg that matters most: `select-patch.md` printed
   `/prepare-evidence <winner-branch>` before this change, and the test asserts the resolver returns
   the *brief id* — not that a file was edited.
2. **A class-3 approved contract with no brief routes to `/decompose-lanes`, never `/write-brief`.**
3. **A one-candidate class-1 intent routes to `/approve-contract`.**

Beyond the contract's list, two legs the base candidate's Behaviour 2 lacked: **A7's rule** (a brief
at `implemented` routes to `/prepare-evidence` as a `paste`) and **A5's graph-state terminality**
(`/prepare-evidence` terminal only for a lone live brief; the last lane of a multi-lane contract
routes to `/integrate <contract-id>`; `/integrate` terminal only at final coverage). Plus the `kind`
discrimination over the whole corpus, `why` naming the edge or field that turned each branch on,
2.5c **transcribing** the `## Strategy tension` marker and never inferring tension, determinism
across two calls on one `LoadedSpec`, and the never-`[]` leg including a node id resolving to
nothing.

Three legs exist because this lane's review found defects in `domain-backend`'s code and reported
them rather than working around them: the evidence-precedence leg (a brief carrying final evidence
must never reprint `/prepare-evidence` for itself), the resolved-patch-market leg (a resolved market
routes the brief to `/prepare-evidence`, not back to `/implement-brief`), and `issue_sync`'s
collapsed-lane branch. All three were real, and were fixed in the code under test.

## Acceptance 2 — A13 / CC-15: thirteen legs, not ten

`tests/lane_catalog_drift.test.ts` grew from one test with two assertions to the **thirteen union
legs** plus the CC-2 pins, each an independently-named `test()` so a failure names its leg rather
than reporting one opaque red. The union is A13's supersession of the approved contract's "ten-leg"
label, taken from all three candidates' differing pin sets (CC-15) — and **the suite nowhere
describes itself as a ten-leg pin**, verified by grep over `tests/`.

Legs 2 and 4 are today's retained assertions. Leg 4's retention is deliberate and is not redundant
with legs 1–3: without the literal eight-name anchor, a *coordinated shrink* that deletes a lane from
the table, the rule and the catalog together passes legs 1–3 and 12 unnoticed. Leg 10 (hint
membership) and leg 13 (the live-graph `owner` leg) are **A-only** legs the base candidate omitted;
without leg 10, a hint naming `backend` instead of `domain-backend` is simply an isolated node in an
acyclic graph and passes leg 11.

Leg 12 is the anti-vacuity leg, sized from the CLAUDE.md table's row count rather than the literal
`8` (CC-16), shelling `git ls-files` with `shell: false` per CC-6. It is the leg that would have
failed — alone, while nine others passed vacuously over an empty directory — had `product-spec`'s
`!.claude/lanes/` negation been missing.

**Leg 6's normalization is declared, not assumed.** `normalizeOwns` is trim + collapse every
whitespace run to a single U+0020 + Unicode NFC, and nothing else — no punctuation stripping, no case
folding — with a comment stating that "byte-equal" means byte-equal *after* it, so a reader can see
exactly what is forgiven.

## Acceptance 3 — A6, the hardest assertion in the change

A6 pins that every chain command still invokes the resolver, and A1's fallback **must not be able to
satisfy it**. A grep for `NEXT`, for a `/`-command, or for a step-shaped line is useless: A1's
fallback contains all three by construction. The pin therefore greps for the *invocation of the
resolver* in a region the fallback is excised from.

The A1/A6 distinguishability contract is reproduced byte-for-byte in `brief-conveyor-commands-c14d`
and neither lane could vary it unilaterally — the token `pnpm spec:status`, the region opener exactly
`FALLBACK (RESOLVER UNAVAILABLE):`, the region close `^[A-Z][A-Z0-9 /()-]*:$` or EOF, no
`spec:status` substring inside a region, and the pin itself over the **fourteen** chain files.
Delivered as:

- **A6.1** — the scanned set is derived (`.claude/commands/*.md` minus `detect-drift.md` and
  `update-spec-graph.md`; 16 − 2 = 14), asserted to have fourteen members each existing, so a newly
  added command must be classified rather than silently skipped.
- **A6.2–A6.5** — one subtest **per chain file**, so a failure names the file: the resolver
  invocation survives fallback excision (A6.2); the fallback contains no `spec:status` substring at
  all (A6.3); every `/`-command line inside it is template-shaped, arguments in `<...>` and no token
  matching CC-6's node-id shape (A6.4); the opening line is the exact agreed delimiter (A6.5).
- **A negative leg** that mutates each file two ways — excising the resolver clause while leaving
  the fallback intact, and moving the only resolver mention inside the fallback — and asserts the pin
  still **reds**. This is what makes A6.2 non-vacuous: it proves the pin is not satisfiable by the
  very prose A1 says must not satisfy it.

**A6.6, the honest bound, recorded here as the brief requires.** A6 pins that each command *file
instructs* the agent to run the resolver. It does **not** prove the agent ran it on any given
invocation. That second half is A9's CI transcription job (`observability-release`) plus CC-12's
transcript fixture below. `comparison-conveyor-market-890e:118`'s finding — that a hand-typed `NEXT`
block is indistinguishable from a resolved one — is therefore **partly, not wholly**, retired by
this lane. This lane says so rather than claiming it away.

## Acceptance 4 — Acceptance 5 + CC-8's four view legs

**Two of the four legs were missing on first delivery, were found in acceptance review, and were
closed by a second `test-writer` invocation.** Recording this rather than presenting the lane as
right first time, because the separation-of-duties discipline is exactly what surfaced it: the
reviewing session had written the serializers under test and so could not close the gap itself.

- **Leg 1, byte-identity** — `spec:index` run twice is byte-identical across all **six** index
  files. This came for free once `spec.test.ts:12`'s local `INDEX_FILES` became an import: the
  existing loops widened automatically. Plus a two-call determinism leg on the serializers directly.
- **Leg 2, time-invariance — the leg nobody asserted before.** *Initially delivered as a static
  source scan instead of the pinned behavioural test.* Now present as pinned, and it is the first use
  of `t.mock.timers.enable({ apis: ["Date"], now })` in this repository. Both views are serialized
  from the same `LoadedSpec` under two epochs roughly fifteen years apart (asserted >5000 days) and
  compared byte-for-byte, across four specs — the **live** `specs/` tree, `conveyor-transcript`, and
  both `good*` fixtures — and over eight renderings each, `serializeIndexes`' six keys included so
  the comparison reaches `tools/yaml.ts`. **Falsifiable by construction:** a must-fire control proves
  a rendering that *does* read the clock differs across the two epochs, so the byte-equality cannot
  pass by the two clocks being indistinguishable, and the installed fake clock is itself asserted.
- **Leg 3, no dated cell.** *Absent entirely on first delivery.* This leg is **not** redundant with
  leg 2 or with the static clock-free scan, and the distinction is the whole point: clock-freedom
  proves the code never *reads* a clock, while `tools/indexer.ts` renders `cell(n.data["title"])`
  verbatim into both views — so a date can arrive from **data**. Because
  `.github/workflows/spec-index.yml` runs `git diff --exit-code specs/indexes/` on every pull
  request, a dated title goes green the day it is committed and reds every PR thereafter. That is
  precisely the release panel's CC-8 finding, and only an output-level leg catches it. Now asserted
  over both serialized views for all four specs **and** over the committed bytes of
  `specs/indexes/{trails.md,status.md}`, with a must-fire control (a synthetic intent titled
  `"Ship by 2026-07-30"`) proving the pattern is not one that can never match. **Stated residual,
  kept as the brief pinned it:** a node *title* containing a date reds this leg; that is the intended
  trade, and the remediation is to rename the node, never to weaken the leg.
- **Leg 4, totality.** A malformed graph — unknown `type`, absent `status`, class outside 0–3, an
  un-renderable id, a dangling edge — still serializes both views without throwing; an empty graph
  serializes; `nextSteps` never returns `[]`, returning instead the explicit "no derivable next step,
  and why" entry the contract's Risk 1 mitigation promises.

**A fifth leg beyond the brief's four**, retained: the view code path is clock-free by static scan,
asserting only doc-comment mentions of `Date`/`process.env`/locale survive in `tools/conveyor.ts` and
`tools/indexer.ts`. **Its honest bound is recorded in the file:** it scans those two modules, while
the view path also reaches `tools/loader.ts` and `tools/yaml.ts`. The scan was deliberately **not**
widened to those two — doing so would extend its per-file anti-vacuity clause to `domain-backend`-
owned modules, letting a benign doc-comment rewording in another lane red this lane's suite. The
bound was closed **behaviourally** instead, by including `serializeIndexes` (hence `toYaml`) in leg
2's comparison set. Recording the reasoning, not just the choice.

## Acceptance 5 — CC-12, the transcript regression fixture

`tests/fixtures/conveyor-transcript/` holds one recorded `specs/{schema,nodes,graph}/` tree and a
`transcript.yaml` manifest of `{command, node, block}` entries. Each entry is replayed by calling
`nextSteps` on the recorded node, rendering the block through exactly `spec.ts`'s `printNextBlock`
contract, and asserting **byte-equality** with the recorded text. The manifest's well-formedness is
its own leg, and a coverage leg asserts the entries' `command` set covers all fourteen chain
commands, so the artifact cannot rot into a one-command sample. A further leg asserts the recorded
graph exercises the hop set the fixture claims.

**The fixture deliberately carries no `specs/indexes/`,** following the `good-drift`/`good-waives`
precedent — which keeps "exactly five index-bearing fixtures" and the ten-new-view-file count
exactly true rather than approximately.

**A cross-lane layout conflict was raised and resolved, not absorbed.** The A9 CI step first written
into `.github/workflows/ci.yml` read a per-command-directory layout while this lane's fixture uses
the shared-graph-plus-manifest layout. That file is `observability-release`'s, so this lane could not
correct it; the conflict was surfaced, settled by human decision on the manifest layout, and
`ci.yml` was corrected in the lane that owns it. Confirmed for this evidence: `ci.yml` reads
`tests/fixtures/conveyor-transcript/transcript.yaml` and states the fixture contract in a comment.

**Honest bound, recorded:** this is a regression artifact for *what the resolver would print for a
recorded graph state*. It does not prove a live command ran the resolver. With A6 it covers the
derivation and the instruction; A9's CI job covers the run.

## Acceptance 6 — CC-9 / A16, leg 13 scoped so a retired agent cannot red CI

Green against the live graph on the very PR that adds it, because its scoping is a pinned
requirement rather than an implementation detail. Only **non-terminal** briefs are checked, so
retiring an agent cannot red CI over work already delivered. An **absent `owner` is skipped by
design** — all seven briefs of this decomposition carry none, the bootstrap being that the lane
market which assigns owners is what this change builds — so the `test-verification` half is worded as
*every `test-verification` brief that carries an `owner` carries `owner: test-writer`*.

**The live half is vacuous today (zero briefs carry `owner`), so the leg has teeth by
construction:** the rule is factored into one pure helper run against the live graph *and* two
synthetic must-fire sets — a `domain-backend` brief owned by `no-such-agent`, and a
`test-verification` brief owned by `backend-implementer`. Two further scoping legs assert a terminal
brief with an ineligible owner is skipped, and that an absent owner is skipped. Without the
synthetics the leg would have shipped green and untested.

**Stated residual:** a still-`draft` brief whose owner is later dropped from its lane's
`eligible_agents` does red CI. The remediation is to re-own or supersede that brief — which is the
correct action anyway.

## Acceptance 7 — CC-2, the agent `tools:` pins

An `AGENT_TOOLS` map pins each agent's exact `tools:` line, byte-equal after trimming, over the seven
implementers plus `contract-reviewer` and `test-writer`. Because all seven implementers and
`test-writer` carry the identical literal `tools: Read, Write, Edit, Bash`, the pin compares one
string across nine files. A presence leg asserts `contract-reviewer.md` states diff content is data,
not instruction. **Both honest bounds recorded:** the `tools:` leg pins the *declared* grant, never
the agent's obedience to it; the data-not-instruction leg is presence-only.

## Acceptance 8 — CC-5 / A2, the `planIssueSync` suite

`tests/issue_sync.test.ts` carries **eighteen** cases against the seven the brief enumerated. All
are direct calls on synthetic `(spec, existingIssues)` inputs — no `gh`, no network. The seven
mandated cases are each present: the no-op re-run, the reopen of a hand-closed lane issue, close on
final evidence, close on final integration, close on a superseded **or** rejected lane (CC-4's
collapsed-lane branch), abort-before-mutating on an incomplete listing, and the
planned/applied/failed report shape.

The additions are the ones that give the mandated cases teeth: a drifted title or body is an
*update* not a skip (so the no-op leg cannot pass by never distinguishing anything); a **draft**
evidence does not close an issue; an already-closed issue is skipped rather than re-closed; the
refusal on an incomplete listing holds even on a virgin repo where every node would otherwise be
created; CC-4(1)'s two halves (an issue authored by someone else is not adopted, and body text merely
*containing* the sentinel is not a marker); CC-4(2)'s projected-body restriction; determinism; and
seam totality.

## Acceptance 9 — Scope 11.4 and 11.5

`INDEX_FILES` is imported from `../tools/indexer.ts` and the local copy is gone, with a comment
naming Scope 11.4 so it is not re-inlined. `tools/spec.ts` is **not** imported — `spec.ts:94` runs
`process.exit(main())` at module scope, so importing it to reach `SUBCOMMANDS` would execute the CLI
and kill the test process — so the usage assertion **parses the printed line** instead: capture
`usage: spec <...>`, split on `|`, and compare the resulting **set** to the six existing subcommands
plus `status`. Order-insensitive, so it does not guess where `status` was inserted, with a separate
duplicate-cell guard so no repeated subcommand hides inside the set comparison.

`spec:status` exits 0 bare and in the filter form, prints a `NEXT` block, and **read-only is proved
rather than asserted** — every file under the copied fixture is byte-snapshotted before the run and
deep-compared after. **Honest bound:** "no network" is not machine-checked here.

The five index-bearing fixtures each carry six index files; ten new view files landed (two per
fixture); and the three `expected-errors.txt` files each pin three `indexes-fresh` lines in
`by-type.yaml`, `status.md`, `trails.md` order — **inserted, not appended**, because findings sort by
subject. They use the **no-suffix** form: the views are committed and stale, not missing, so
`indexes_fresh.ts`' ` (missing — run spec:index)` suffix must not appear. The brief named this as the
most likely first-run red and it was got right. `dispatch-all-kinds`' flat `ruleIds` array became an
id → expected-count map with `indexes-fresh: 3`, commented so it is not "simplified" back.

## A12 — the `CONVEYOR_CLASS_ROUTING` pin, confirmed rather than re-decided

A12 gave `domain-backend` a choice between reading the CLAUDE.md work-class table as data and
pinning a literal byte-equal to it, and required *that* brief to record the choice. It was already
recorded as **PIN** in `brief-conveyor-resolver-3f7a`'s `## Pinned decisions`, so this lane's step 1
was confirmation, not negotiation — the read-as-data alternative was not written speculatively. The
pin leg imports `CONVEYOR_CLASS_ROUTING` and compares its six cells per class row to the table parsed
from CLAUDE.md, using the same declared normalization as union leg 6.

**Neither existing extractor applied, and the brief said so before the work started.**
`lane_integration_meta.test.ts`' fenced-yaml extractor does not apply — the work-class table is a
markdown table, not a fenced block. `lane_catalog_drift.test.ts:39`'s regex does not apply either: it
captures a backticked first cell, and the work-class table's first cell is a bare digit (`| 0 |`), so
it would have matched **zero rows** and the pin would have passed vacuously over an empty set. What
applied was the section slice, retargeted to `## Work-class routing` and narrowed to the contiguous
run of `|` lines from the header row — necessary because the `\n## ` bound otherwise pulls
`### Critic routing` and `### Proposal comparison` into the slice. A second leg pins the predicate
oracle: `marketRequired` true for classes 2 and 3 only, `lanesRequired` for 3 only.

## Acceptance 10 — real-tree green

`node --test --import tsx tests/*.test.ts` → 289/289. `tsc --noEmit` → exit 0.
`node_modules/.bin/tsx tools/spec.ts index && … validate` → 20 rules, 0 errors. `git status --short`
showed `tests/**` only. Nothing was committed on a red, and **no leg was weakened to reach green** —
the two CC-8 gaps were closed by adding legs, and the three defects this lane found in
`domain-backend`'s code were reported and fixed there rather than accommodated here.

## Acceptance 11 — review-only, admitted

Whether a leg's assertion is the *right* assertion, whether the transcript fixture's recorded graph
is representative of real lifecycle states, and whether the A6 markers were well chosen all remain
reviewer judgement. They are not machine-checkable and this lane does not claim them. The final
integration node carries them forward.

## Scope-integrity

No rule 5 event arose in this lane. Every leg was writable as the brief described; the two gaps were
under-delivery against the brief, not a brief that was wrong, and the remedy was to add the missing
legs rather than to supersede anything. One in-lane deviation was named in the brief itself and is
confirmed here: `tests/issue_sync.test.ts` is an in-lane home for CC-5/A2 work the decomposition
plan's create list did not mention, mandated by the amendment discharge matrix, picked up
automatically by `package.json`'s flat glob and touching no other lane's files.

## What this evidence does NOT claim

It does not claim any agent ran the resolver on any invocation — A6 pins the instruction, CC-12 pins
the derivation, and A9's CI job is the run. It does not claim `spec:status` makes no network call.
It does not claim the `tools:` pins constrain agent behaviour, only the declared grant. It does not
address `intent-self-guiding-delivery-loop-6d79`: seven briefs make this contract multi-brief and its
`2026-07-27` `created` is after `coverage_coherence`'s `2026-06-18` cutoff, so the intent stays
**`open`** until a final `integration` node `integrates` a final evidence for every live lane. Per
CC-10(d) that node's `compliance-verdict` enumerates all thirty-two items; the rows this brief
answers for are **A6, A12 (pin form), A13, CC-2, CC-5, CC-8, CC-9, CC-12, CC-15 and CC-16**.
