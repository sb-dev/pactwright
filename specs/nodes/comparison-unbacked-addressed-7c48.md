---
id: comparison-unbacked-addressed-7c48
type: comparison
title: Unbacked `addressed` guard — three exception mechanisms compared across ten routed perspectives
created: 2026-07-31
produced_by: "/review-contracts"
---

The market for `intent-unbacked-addressed-guard-8c4e` (class 2) carries three live candidates. All
three ship an **identical** guard — one intent-scoped validation rule (`unbacked-addressed`, kind
`unbacked_addressed`) that walks `spec.nodes` filtered to `type: intent, status: addressed` and
emits a finding when nothing backs the flip. They differ on exactly one axis: **how the single
standing exception, `intent-status-coherence-d4f2`, is recorded.**

- **A** — `contract-unbacked-addressed-edge-5b71`: a new `subsumes` edge type (decision → intent).
- **B** — `contract-unbacked-addressed-dated-2e94`: a dated `unbacked_addressed_from` cutoff.
- **C** — `contract-unbacked-addressed-waiver-8d36`: an `override` node waiving the rule id.

Ten perspectives were routed (spec-critic plus the nine specialists, the class-3 panel applied to a
class-2 market because the candidates' scope spans schema, tooling, tests, docs and — for C — an
authorization surface). **Thirty verdict pointers were recorded, one per perspective per
candidate; none was dropped.** Every perspective returned `Concern` on every candidate. No
perspective returned a clean bill on any candidate, and several recorded explicit "no concern on
this sub-axis" verdicts, which are preserved below rather than collapsed into silence.

**The market's headline result is not a ranking.** It is that the shared core — the part all three
hold identical and none put up for comparison — carries a bypass cheaper than either designed
escape hatch, and carries it into whichever candidate wins. That is finding 1 below, and it means
**no candidate is selectable without amendment.**

## Candidate trade-off table

| Axis | A — `subsumes` edge | B — dated cutoff | C — override waiver |
|------|---------------------|------------------|---------------------|
| Exception is recorded as | a typed edge, queryable and permanent | nothing in the graph; a date in schema | a node with reason, approved_by, expires |
| Review gate on *granting* one | none — `edges.yaml` is unowned | CODEOWNERS plus sensitive-paths | CODEOWNERS on the first grant only |
| Permanent vocabulary added | a new edge type, forever | a third dated scalar | every rule id becomes waivable |
| Documented kill switch | none of any kind | the scalar itself (fail-open) | delete or lapse the override |
| Cost to revert cleanly | schema plus graph data, ordered | one line; leaves zero residue | code plus a node rule 3 forbids deleting |
| Scheduled re-examination | never | never | 2027-01-31, unattended |
| Correct against today's graph | anchor holds today | Acceptance 2 is false on day one | first override; three first-run paths |
| Pre-attached exemption shipped | none | `intent-docs-arrow-lint-e7b3`, forever | none |
| Visible in `trails.md` | no | no | no |
| Blast radius when it fails | d4f2 reds on an unrelated lane | guard silently disabled | every `specs/**` PR reds |

The shared core outside the table: one new handler, one `HANDLERS` entry, one rule entry inserted
after `coverage-coherence`, one `tests/fixtures/bad/unbacked-addressed/` fixture, and the same
honest bound — green asserts decision-backed *provenance*, never that the work is *covered*.

## Shared-core findings (binding whichever candidate wins)

1. **One `proposes` edge launders any intent past the guard, and it is cheaper than either
   designed escape hatch.** Backing is satisfied by any live contract that both proposes the
   intent and is a `selects` target *anywhere in the graph*. `specs/schema/edge-types.yaml:9-11`
   declares `proposes: {source: contract, target: intent}` with **no cardinality constraint**, and
   ten already-selected contracts exist. So the cheapest way to make an unbacked intent pass is to
   append one `proposes` edge from an already-selected contract to it — a single line in
   `specs/graph/edges.yaml`, a path `.github/CODEOWNERS` (`:3-14`) does not cover and
   `sensitive_paths` (`specs/schema/validation-rules.yaml:126-127`, sole glob `specs/schema/**`)
   does not reach. A's hatch needs a `decision-*` node and C's an `override-*` node; both trip
   `@sb-dev` review. **The shared bypass trips nothing.** The market is being decided on which
   exception mechanism is best governed while the guard underneath all three has a cheaper,
   unreviewed door. No candidate's acceptance tests this case. The winner needs either a
   same-intent constraint on the backing walk or an explicit, tested honest bound naming the
   laundering path.

2. **The `selects`-target set all three claim to reuse is not exported.** All three write that
   backing is `liveProposingContracts` intersected with "the `selects`-target set
   `coverage_coherence.ts:66-71` **already builds**". Those lines are a function-local
   `const selectedContracts` inside `coverageCoherence`'s body — not exported, not in
   `coverage_traversal.ts`, not reachable. Every candidate must therefore copy the walk into the
   new handler or lift it into the shared module; **none names either edit in Scope**, and A's
   Scope 2 ("imported, not modified… every walk A needs is already exported there") explicitly
   forecloses both. Copying it is the precise hazard `coverage_traversal.ts:3-19` and the A11 note
   at `coverage_coherence.ts:73-76` exist to prevent. Independently reported by spec, architecture
   and cost-maintainability. The winning contract needs an explicit Scope item: lift
   `selectedContracts` into `coverage_traversal.ts` as an exported walk.

3. **The two available spellings of "selected" are not equivalent, which undercuts all three
   no-double-report criteria.** `coverage_coherence.ts:66-71` is a **raw** edge scan — every
   `selects` target, no endpoint resolution, no source-status filter. The exported
   `liveSourcesByEdge` (`coverage_traversal.ts:25-51`) skips any edge whose source does not resolve.
   A graph carrying a `selects` edge with a typo'd decision id yields "selected" under the raw set
   and "not selected" under the helper. All three cite both sources in one sentence and ship
   neither decision. A6 / B5 / C7 ("no double-report") are sound only if the new rule's notion of
   selected is byte-identical to `coverage-coherence`'s.

4. **The coverage residue is six intents wide, and no candidate states its size.** All three
   define backing as provenance and disclaim coverage, deferring it to `coverage-coherence` —
   which grandfathers on the **selected contract's** `created` against
   `coverage_coherence_from: "2026-06-18"`. Verified against the loaded graph: of ten `addressed`
   intents, **six** are backed by a contract created before that cutoff — `a3f1` (06-11), `f367`
   (06-12), `5c90` (06-13), `c7b1` (06-14), `b9c4` (06-16), `7ada` (06-17) — and are therefore
   checked for provenance by the new rule and for coverage by **neither** rule. Adding `d4f2`
   itself, **seven** of ten addressed intents end up outside any coverage check. (The spec and
   product critics reported seven and six respectively; both are correct under the two readings,
   and the reconciliation is recorded here so a later reader does not treat it as a contradiction.)
   Delete every `evidences` edge on those six and the graph stays green under A, B or C alike. The
   composite honest bound the winner must state: *green asserts provenance for every addressed
   intent and coverage only for those whose selected contract postdates 2026-06-18.*

5. **The discriminator is untested in the only direction that matters.** All three state that
   incoming-edge *count* is not the discriminator and that backing is
   `liveProposingContracts(intent) ∩ selectsTargets`. Yet A's Acceptance 3 and B's Acceptance 4
   both describe the fixture as "an addressed intent with **zero** incoming edges", and C's Scope
   10 leaves it unspecified. An implementation computing backing as
   `liveProposingContracts(intent).size > 0` — dropping the intersection, the exact error every
   contract warns against — passes every named fixture, the whole-graph no-regression leg and the
   red-then-green leg, because d4f2 has zero incoming edges either way. The missing case is: **an
   addressed intent carrying live `proposes` edges but no `selects` edge must still fire.** That is
   the *market-opened-but-never-selected* flip, far likelier than a zero-edge flip now that
   `/propose-contracts` is routine, and it is unpinned in all three.

6. **A new bad fixture is never run unless it is added to a hard-coded literal.** Verified:
   `tests/spec.test.ts:106-122` lists **fifteen** names; **nineteen** `tests/fixtures/bad/*/`
   directories carry an `expected-errors.txt`, the remaining four having bespoke cases. There is no
   `readdirSync` over `tests/fixtures/bad` anywhere in `tests/`. All three candidates add at least
   one bad fixture (A adds two). A fixture directory omitted from that array is silently never run
   and the suite stays green with a dead fixture on disk — defeating the single durable oracle each
   candidate has for its core rule. `tests/spec.test.ts:214-217` already added an anti-vacuity
   guard for exactly this class of under-sized literal in the dispatch case; the bad-fixture list
   has no equivalent.

7. **Rule ordering is stated as a precondition it cannot be.** All three insert the rule directly
   after `coverage-coherence` and assert it "assumes `edges-references-resolve` has run".
   `runValidation` (`tools/validator.ts:63-89`) runs every rule unconditionally, never
   short-circuits, and sorts afterwards; earlier rules *report* unresolved endpoints and never
   *remove* them — the warning at `coverage_traversal.ts:5-9`. Placement buys output sequencing
   only. The new handler must defensively skip unresolved endpoints itself; no candidate says it
   does. Compounding this: `tools/validator.ts:87` is a bare
   `findings.push(...handler(rule, spec))` with no try/catch and no per-rule isolation, so a throw
   in the new handler does not produce one finding — it aborts `spec:validate` and loses every
   other rule's findings. All three add the first rule that dereferences intent frontmatter it did
   not itself type-check.

8. **A legitimate `supersedes` turns a backed intent unbacked, with no author action.**
   `liveProposingContracts` excludes sources whose status is `superseded`
   (`coverage_traversal.ts:44-47`). An addressed intent whose winning contract is later superseded
   by a successor that does not itself carry a `proposes` edge to that intent goes from backed to
   unbacked with no status change and no touch to the intent — and the resulting finding names the
   intent, not the supersession that caused it. Rule 3 makes superseding the *standard* corrective
   operation. **Verified as forward-looking, not live:** the graph contains zero superseded
   contracts today, so no candidate fires on this case now. B is worst placed (Behaviour 5: "There
   is no escape clause"); A and C would each burn their exception mechanism on a false positive.

9. **The exception is invisible in the one human-rendered view, in all three.**
   `tools/indexer.ts:175-189` builds every intent trail from a **fixed literal section list** —
   `proposes`, `compares`, `selects`, `decomposes`, `evidences`, `integrates`. Neither `subsumes`
   nor `waives` is among them, and no candidate changes the indexer. Verified: after any of them
   lands, `specs/indexes/trails.md` still renders d4f2 with all six sections `_none_`, and
   `status.md` still omits it (`serializeStatus` iterates `liveIntents`; `addressed` is not live).
   That rendering — an addressed intent with an entirely empty trail — is arguably the clearest
   existing statement of the defect, legible to any human today, and **no candidate proposes to
   flag, annotate or even acknowledge it.** Related: `formatFinding` (`tools/validator.ts:46-48`)
   prints `[rule: <id>] <detail>` and **never prints `subject`**, so every detail string must be
   self-identifying.

10. **None of the three is diff-aware, unlike every existing gate that governs an exception, and
    the controls they rely on are unverifiable from files.** `gate.ts:106`, `checkdiff.ts:47` and
    `patch_gate.ts:55` all require the override to be *added in the PR under evaluation*, so an
    exception is bound to the review event that authorised it and is inert afterwards. The shared
    `unbacked_addressed` rule evaluates the graph **at rest**. That is the root cause of A's and
    C's escape-path findings and the reason B's protected-path switch fares better. Separately,
    every CODEOWNERS-based claim in this market depends on "Require review from Code Owners" being
    enabled, which `docs/branch-protection.md:5-7` records as repo-admin state **not reproducible
    from files in this repo** — and `docs/branch-protection.md:67-74` states plainly that with it
    off, "the override path is self-serve". Whichever candidate wins, the brief must state that the
    exception mechanism is evaluated at rest and is therefore not bound to the PR that introduced
    it.

11. **Two gaps in the shared premise, routed rather than absorbed.** (a) **`rejected` is the
    unguarded exit.** `specs/schema/node-types.yaml:25` gives intents
    `status_values: [open, addressed, rejected]`, and `tools/conveyor.ts:294-296` drops **both**
    `addressed` and `rejected` from the live set, so both remove work from the queue. The shared
    core scopes the rule to `addressed` only, so a body-only *rejection* erases an intent with zero
    provenance and zero rule coverage — easier to abuse, because nothing has to be delivered first.
    (b) **The status transition is not attributable in any candidate.** Intent frontmatter has no
    field recording who flipped a status or when, so "who marked d4f2 addressed, on whose
    authority" stays recoverable only from `git blame` after all three. Both are gaps in the
    market's premise, not defects in any one candidate; the rule-5-correct route is a follow-up
    intent, never a silent widening of whichever contract is selected.

12. **The red-then-green self-application leg names no run, in any of the three.** The repository
    cannot hold both states in one commit, so the red half is either a transient working-tree run
    whose only artifact is pasted prose or an in-process test. CLAUDE.md's paste-only clause
    governs this exactly: such a claim must name **the run that discharges it**, record that run's
    verdict in the final integration's `combined-test-run` section cross-referenced from
    `compliance-verdict`, and name the **remediation if it fails** (a `drift-finding` plus a rule 5
    route). A's Acceptance 1 says the states are "captured verbatim in the evidence node" — a
    paste, no run named, no remediation. B's and C's say "asserted in one test" without naming the
    test file or harness. As written, none of the three legs meets the standing bar. Compounding
    it for A and C: their red states mutate `incoming.yaml`/`by-type.yaml`, so `indexes-fresh`
    fires unless the leg also regenerates indexes — which neither says. B's is the only leg
    genuinely runnable in one commit, because flipping a cutoff in-process changes no indexed file.

13. **Self-application is currently unfalsifiable on this branch.** All three close with the same
    risk: the sensitive-paths gate needs the approved-contract link and the
    `touches → capability-spec-schema-2c3d` edge in the same diff. But `tools/checkdiff.ts:113-146`
    evaluates coverage **per owning capability**, not per file: one added `evidences` edge whose
    evidence touches the capability and whose brief decomposes an `approved` contract clears every
    sensitive file in the PR. On `intent/self-guiding-delivery-loop` those edges are already added
    relative to `main`, so `spec:check-diff` already passes for any further `specs/schema/**` edit
    here. The winner must land on a branch cut off `main`, or re-state the acceptance as a unit
    test over `evaluateCheckDiff` with a constructed added-id set — never as an observation of the
    live CI run. Related and also unstated by all three:
    `.github/workflows/drift-review.yml:16-19` records that a failing job there **blocks no merge**
    until an admin marks it required, so the "same diff" ordering is currently a convention, not a
    gate.

## Critic findings by perspective

### spec

**Verdict: Concern on all three.** The shared core's own citations do not hold, and each
candidate's headline claim is contradicted somewhere in its own body.

1. A's sole shipped `subsumes` edge anchors d4f2 on `evidence-lane-integration-9b4c` — the very
   "evidence body that evidences a DIFFERENT intent" the parent intent names as the anti-pattern
   (`intent-unbacked-addressed-guard-8c4e:17-20`) — and that evidence is already fully consumed
   backing `intent-lane-model-integration-a1f7`. A's Behaviour 2 is satisfied by exactly the
   artifact the intent objects to, and the same final evidence now backs two intents.
2. A's Out-of-scope 1 ("adds no second coverage notion") is contradicted by Scope 1: the three
   helpers A names do not compose into a coverage verdict, so A must re-implement roughly 25 lines
   including the superseded filter, the exactly-one constraint and the `final` status filter.
3. A's Scope 2 is false in two places — both `selectedContracts` (`:66-71`) and `supersededTargets`
   (`:57-62`) are function-local consts, exported from nowhere.
4. B's Acceptance 2 is false on the live graph the day it is written (see B's case below), and B
   uses the defined term "live" in a sense `specs/schema/node-types.yaml:13-22` explicitly
   excludes — writing a second reading of a single-definition term into a schema comment.
5. C generalizes the namespace without generalizing the mechanism: fourteen rule waivers become
   *expressible* and thirteen *silently ineffective*, a worse failure mode than either an
   unwaivable rule or a genuinely waivable one.
6. C's two-edge idiom scopes the subject but not the cardinality — one override may carry N
   intent-id edges, excusing N intents on one review.
7. **Credit, verified:** A's Acceptance 4 predicted error text is byte-accurate against
   `edge_endpoint_types.ts:34`, and A is the only candidate whose acceptance text checks out
   against emitted-string source.

### security-privacy

**Verdict: Concern on all three. Privacy axis explicitly clean for all three** — repository-local
YAML/Markdown/TypeScript, no personal data, no network, no credentials, no retention surface; the
only identifier in scope is C's `approved_by`, a maintainer handle recorded deliberately as
provenance.

1. A's escape hatch is exercised in the one graph file no control covers. Granting a subsumption
   requires no new decision node — one entry in `edges.yaml` naming an already-merged decision.
   **The exception-granting operation is the least reviewed write in the repository.**
2. A ships a ready-made reusable key: the anchor is a property of the *decision*, not of the intent
   being subsumed, so `decision-lane-integration-9f3b` becomes a permanent skeleton key evaluated
   once and reused without limit.
3. B has an escape hatch; it is unlabelled and unprotected. Behaviour 5 asserts "nothing in the
   graph can excuse a post-cutoff unbacked intent" while Behaviour 2 fail-opens on an unparseable
   intent `created` — and no rule validates a date's shape at rest.
4. **B's documented switch is the best-protected of the three**, sitting behind both
   `.github/CODEOWNERS:3` and the sole `sensitive_paths` glob. B's weakness is not access, it is
   silence: a disabled gate emits zero findings and prints a green line.
5. C's waiver is the first override consumer with **no freshness constraint**. A later PR adds one
   `waives` edge from the same override to another intent; no `override-*` file is touched, so
   CODEOWNERS:14 does not match. The exemption inherits the owner's `approved_by`, `reason` and
   expiry and reads to an auditor as though the owner signed it.
6. C's Risk 2 class-3 concession is well-founded on this axis: C is the only candidate that changes
   an authorization mechanism, and it edits the resolver deciding which waivers are legal at all.
7. **Credit:** C's expiry refuses to fail open on an unparseable `expires` and injects the clock
   from the loader rather than reading it in handlers, keeping findings a pure function of input.

### compliance-risk

**Verdict: Concern on all three. Explicit clean verdict on destruction** — no candidate deletes or
supersedes any node or moves any existing node's status. Every retention finding concerns a record
*not created* (B) or *mutable in place* (B's scalar, C's `expires`), never one destroyed.

1. A has the best query shape in the market: one `subsumes` edge, then one machine-followable hop
   to `decision-lane-integration-9f3b:5` (`decided_by`) and `:24` (the prose) — recoverable without
   reading a merged PR.
2. But A produces a green, indexed, official-looking assertion of coverage that nothing checked —
   **false assurance is worse than absent assurance**, and Behaviour 3 advertises the `subsumes`
   route inside the finding text, putting the cheapest path to green in front of every operator at
   the moment they are most motivated to take it.
3. B has no query at all: after B ships, `incoming.yaml` still lists d4f2 with zero incomings. The
   operative rationale moves to a schema comment and a test id — files `spec:index` never indexes
   and no edge points at. B answers a body-as-canonical-data objection by moving the assertion out
   of node bodies altogether.
4. B's exempt-by-date is permanent regardless of what later happens to an intent's provenance: if
   `a3f1`'s proposing contract is ever superseded, a3f1 becomes an unbacked addressed intent and
   the rule is structurally silent on it forever, with Acceptance 2's count-based test unmoved.
5. C has the richest record and the only mechanically-proven review gate (Acceptance 6 tests the
   CODEOWNERS pattern) — but the expiry creates an *occasion* for re-judgement and no *artifact* of
   one: nothing enforces freshness over an in-place date bump and nothing requires a new `reason`.
6. C's expiry is also mismatched to this subject: d4f2's exempting facts are historical and
   immutable, so a 2027 re-signature can only restate them. The property is right in general and
   misapplied to this instance.
7. **Recorded as discipline, not a finding:** B's Out-of-scope 4 declares that it widens
   `intent-malformed-cutoff-finding-b3d7`'s surface rather than absorbing the widening silently.

### architecture

**Verdict: Concern on all three.** Explicit no-concern on the sensitive-paths interaction: A Risk 4,
B Risk 5 and C Risk 6 each name the same within-PR ordering obligation and pin it to the brief —
correct handling in all three.

1. `subsumes` is a **transitive-closure shortcut, not a new relation** — it declares the endpoint of
   the existing two-hop chain as a one-hop edge, so the same fact acquires two spellings and every
   consumer must choose one.
2. The inconsistency with `supersedes` is structural: `supersedes` is homogeneous
   (`target: same_as_source`) with a status consequence two independent consumers read; `subsumes`
   is heterogeneous, has no status consequence, and is read by nothing but the new handler.
3. A never closes the `decision —subsumes→ <open intent>` case: endpoint validation checks type and
   never status, so such an edge is legal, silent and inert while the conveyor keeps printing next
   steps for an intent a decision has publicly declared subsumed.
4. B is accretion, and the key change is the tell: there is no cutoff abstraction to be a third
   instance *of* — each handler independently re-writes the same three lines. Consolidation later
   becomes a three-site migration reconciling two different grandfathering keys.
5. B's fail-open points the wrong way *for this rule specifically*: the precedents fail open into a
   real historical state they were written to grandfather; B fails open into "the anti-pattern the
   parent intent exists to catch is undetectable".
6. **B is clean on coupling:** an optional `unbackedAddressedFrom?` breaks none of the 18
   `LoadedSpec` construction sites, adds no consumer, no node type, no edge type and no graph data.
7. C's `waives` becomes polymorphic over three target kinds with **no discriminator**, and the kinds
   differ in *lifetime*: check waivers are PR-scoped and effectively single-use; C's rule waiver is
   whole-graph and standing. Identical edge shape, opposite lifetime.
8. C's `today` on `LoadedSpec` is a **parallel seam, not the cited one**: `gate.ts` puts `today` on
   the pure evaluator's input struct and calls the clock once at the CLI boundary; C defaults it
   inside `loadSpec()`, the module every subcommand depends on.
9. C's expiry lands in a node type with **no retirement lifecycle** — `override` has no status, so
   rule 3's "move the old node's status to its terminal value" has no instantiation, and this is
   the repository's first override node.

### ux

**Verdict: Concern on all three.** Each candidate also earns an explicit clean verdict on one
sub-axis, recorded so silence is not read as a bill of health.

1. A's edge renders in **no** human view: `trails.md` still prints `_none_` under all six headings
   for d4f2, so the one committed per-intent view a reader actually opens becomes *more* wrong —
   an edge now exists and the view asserts nothing does.
2. `incoming.yaml` is a pointer, not a reason: it emits `{id, type, source}` triples with no title
   and no prose. A's "one lookup" is one lookup to a second lookup.
3. A's finding text advertises the bypass, against house style (`coverage_coherence.ts:169` states
   the violated fact; `comparison_required.ts:93-97` restates the invariant; neither names an
   escape).
4. B's green line cannot distinguish "enforced" from "off": `spec:validate` prints
   `OK — N rules, 0 errors` counting *declared* rules, so a graph with a malformed cutoff prints
   the identical line and reports the rule in the count. **No operator-visible surface exists that
   could ever reveal it.**
5. C's expiry finding never names the intent — Behaviour 3 enumerates the override, its `expires`,
   `spec.today` and the remedy; the intent id appears only in `subject`, which `formatFinding`
   never prints.
6. C's half-wired override falls through to output indistinguishable from having written no
   override at all — C ports `gate.ts`' near-miss text for the expiry case and drops it for the
   wiring case.
7. C permanently poisons `specs/indexes/unresolved.yaml`. **Verified:** `tools/indexer.ts:93-98`
   pushes any endpoint not in `knownIds` into `unresolved` with **no `waives`/checks exemption**
   anywhere in the file, and there are **zero live `waives` edges today** — so C authors the first
   one, and `unresolved.yaml` (`[]` today) permanently gains an entry that is in fact correct, with
   nothing marking it as such. That is the exact failure mode
   `intent-status-coherence-d4f2:41-48` warns about, reintroduced by the change that excuses d4f2.
8. **No candidate's remedy text names the cheapest correct action.** The realistic trigger is a
   mis-set `status:` field and the fix is to set it back to `open`. A leads with "real provenance or
   a `subsumes` edge", B with "propose a contract, select it", C with "real provenance or a signed
   override". Two of three lead with an exception mechanism, and whatever the finding names first
   is what tired operators will do.
9. **Clean sub-axis verdicts:** A is the only candidate whose exception appears in a committed index
   keyed by the excused node's own id. B is the only candidate with no artifact that can rot,
   expire or be half-wired — every red B produces is caused by something the operator did. C is the
   only candidate that places a human-readable `reason`, `approved_by` and `expires` in the graph as
   a titled node.

### qa-test

**Verdict: Concern on all three.** Three explicit no-concern verdicts are recorded below.

1. A's Acceptance 4 oracle is scoped to the wrong file: `edge_endpoint_types.ts:18-19` reads that
   *fixture's own* `edge-types.yaml`, of which 25 independent copies exist. If the shipped
   declaration lands `target: any` or omits `source:`, the fixture is still green and production
   accepts `brief —subsumes→ intent`. The repo owns the idiom that would close this
   (`tests/lane_integration_meta.test.ts:16-28` pins the shipped schema against a canonical list)
   and A does not use it. **Acceptance 4 verifies the half that was never at risk.**
2. A's anchor is a second, unequal implementation of "covered" with no equivalence oracle: a
   decision selecting a single-live-brief contract carrying a stray integration is a
   `coverage-coherence` finding yet still anchors a `subsumes` under A — subsumption borrowing
   coverage the coverage rule is simultaneously rejecting.
3. A's Risk 3 names the one test that would partially cover finding 1, and it lives in **Risks, not
   Acceptance** — so nothing binds it. Under the effective-contract discipline the acceptance list
   is the discharge key.
4. B's Acceptance 3 asserts the wrong oracle in the wrong file: `asString` returns any non-empty
   string, so `spec.unbackedAddressedFrom` would hold `"2026-6-12"`, not `undefined`. Shape
   rejection happens later in `toDateString`, inside the handler. **One of the four assertions
   fails as written.**
5. B's Acceptance 2 is a false-positive time bomb whose trigger is already in the graph: the day
   `intent-docs-arrow-lint-e7b3` is legitimately delivered and flipped, the named-set test reds on
   a *correct* change, and the cheapest repair is to edit the expected list — precisely the quiet
   widening Risk 2 claims the test prevents. **The guard inverts under its own threat model.**
6. C's Acceptance 4 determinism grep is scoped to miss C's own clock (`new Date` goes in
   `tools/loader.ts`, not `tools/handlers/`), so it passes by construction; and Acceptance 8
   ("validate is clean today") is itself a wall-clock assertion that becomes a **failing test** on
   2027-01-31 with no commit — a self-invalidating acceptance criterion.
7. C's `today: string` breaks 18 synthetic `LoadedSpec` literals under `tsc --noEmit`, and the
   optional spelling is *worse*: tests run via tsx without typechecking, so `spec.today` would be
   `undefined` in all 18 and the handler would emit an expiry finding in every unit test that did
   not opt in. No acceptance item states which spelling is taken.
8. **No concern, verified:** C's Acceptance 3 holds — `tests/fixtures/bad/waives-unknown-check/`
   targets `no-such-check`, not a rule id in that fixture either, so it stays red. B's red-then-green
   leg is the only one genuinely runnable in one commit. And `LoadedSpec` can carry `today` without
   changing handler signatures, as C's Risk 4 claims.
9. The dispatch-pinning leg (A7 / B7 / C8) is either wrong or vacuous: the actual dispatch oracle is
   `tests/lane_integration_meta.test.ts:33-48`'s kind loop, which each candidate must extend with
   `"unbacked_addressed"` — and no candidate names that file.

### product

**Verdict: Concern on all three.** The differentiation is conducted as a schema-hygiene argument
about filing location while the consumer of the guarantee goes unnamed.

1. A's cost of excusing an intent moves from "write a sentence in a decision body" to "write a line
   of YAML" — a change in form, not in bar. There are eight decisions selecting covered contracts;
   any of them backs any intent.
2. A's anchor binds the subsumption to *some* delivered work, never to *this* intent, and no
   acceptance criterion can detect the difference. The rule fires on exactly one population:
   authors who did not bother to add the edge.
3. A's headline benefit terminates in the prose it was built to replace — the lookup returns an edge
   id and a decision id; the *reason* stays unstructured body prose. **A ships a typed pointer to
   prose and describes it as replacing prose.**
4. B's forward-only design has a permanent hole on a live intent **today**:
   `intent-docs-arrow-lint-e7b3` is `open`, `created: 2026-06-11`, zero incoming edges, and under
   B's cutoff it is exempt **forever** — flippable to `addressed` next week or in 2029 with the
   guard permanently silent. The design error is that grandfathering keys on `created` while the
   abuse is an event on `status`; d4f2 itself proves the two are decoupled.
5. B's Acceptance 2 is unfalsifiable: the *tested* set is intents addressed *today*, the *exempt*
   set is a permanent function of `created` over all intents including open ones. e7b3 sits outside
   the assertion by construction — green today, green after the flip, green forever.
6. B's Trade-off 7 states something false about its own exempt set ("today those are all backed on
   their merits") — e7b3 has no contracts at all; it is merely not yet *claiming* to be done.
7. B's Out-of-scope 2 is explicit that no record is written, and the harmed party is d4f2's next
   reader: that intent's body specifies deliverables that did not ship, so the old state is an
   **active false assertion**, and B's only correction is a comment in a schema file.
8. C answers "close the hole a prose excuse opened" by shipping a general-purpose excuse mechanism
   for every rule in the file — including `class-market-quorum`, which CLAUDE.md calls "the
   unbypassable backstop". A documented cannot-be-bypassed guarantee silently becomes
   "can be bypassed with review", purchased to excuse one node.
9. C's strongest claim is the one it never tests: nothing bounds renewal, and renewal is decided
   while CI is red on a branch nobody touched — the moment least likely to attract scrutiny.
   "Expires" is sold as "gets re-examined"; the mechanism guarantees only "gets re-signed or
   deleted".
10. **No candidate has an acceptance criterion for the intent's actual success condition** — that
    the *next* unbacked flip is caught. None simulates the realistic attack: take a real live intent
    in this repository, flip its `status` to `addressed`, run validate, expect a finding. That one
    criterion would discriminate all three sharply — it fails B today on e7b3, and passes A and C
    only until someone uses their hatch.

### reliability-ops

**Verdict: Concern on all three.**

1. A's escape trips no code-owner review **and its withdrawal is untraceable**: edges carry no
   status and no `supersedes` (that idiom is node-to-node), so withdrawing a subsumption means
   deleting a line — unreviewed, leaving no trace the exception ever existed. That directly
   contradicts A's Trade-off 1 ("queryable and permanent").
2. A couples d4f2's verdict to an unrelated lane's evidence *count*, and specifies **no finding
   text at all** for the branch where a `subsumes` edge exists but its anchor broke. A second
   `/prepare-evidence` run on `brief-lane-integration-5e2d` flips the anchor false and reds d4f2 —
   one cause, two subjects, and the misleading one is A's. The house near-miss pattern
   (`gate.ts:99-121`) exists; C adopts it and A does not.
3. A's "re-judges no historical contract" holds **by one day, not by construction**:
   `contract-lane-integration-convention-body-4c1f` is `created: 2026-06-19`, one day inside the
   cutoff A's anchor walk does not apply.
4. B ships **three** zero-output silent-disable paths — malformed scalar, malformed intent
   `created`, backdated `created` — and its own Acceptance 3 pins two of them as *correct*
   behaviour. Behaviour 2's fail-open branch ships **untested**.
5. B is the only candidate with **no bounded break-glass** (Behaviour 5 says so explicitly). If the
   rule false-positives, the only remediations turn the guard off for *every* intent. The smallest
   available fix has the largest blast radius.
6. **B's rollback is its genuine strength and it never claims it:** a revert removes handler, loader
   field, rule entry and scalar, writing nothing to `edges.yaml`, `incoming.yaml` or
   `specs/nodes/`. Neither A nor C can say that.
7. C does not mirror `GateInput.today` — it **inverts that precedent's scope**. All three existing
   expiry consumers are `addedNodeIds`-scoped, so a lapsed override is inert today; C's is re-read
   forever, making a lapse a dated repo-wide merge block whose remedy routes to one named reviewer.
8. C specifies expiry but **not revocation**: `override` has no status, so superseding it does
   nothing — C's scan returns on the first unexpired match. The escape hatch can be created but not
   withdrawn.
9. C's rule and its waiver are mutually load-bearing: deleting the rule entry makes
   `waives → unbacked-addressed` unresolvable, so turning the rule off converts one red into a
   different red.
10. **Credit:** C is the strongest of the three on observability, specifying a distinct finding for
    the expired branch modelled on `gate.ts`' near-miss text. Residual: expiry and violation share
    one rule id and one subject shape, so triage cannot separate "a waiver lapsed" from "someone
    flipped an intent illegally" — distinct `kind` values would close that at zero cost.

### release

**Verdict: Concern on all three.**

1. A's rollback residue is not inert; it **hard-reds**. A `git revert` of A's code half while the
   `subsumes` edge remains in `edges.yaml` reds `edges-type-declared` on every subsequent run, on
   `main`, for unrelated changes. A's Risks never state that rollback is a two-actor, ordered
   operation, nor which order is safe.
2. No safe multi-commit ordering exists for A, and A pins only the check-diff half:
   edge-before-declaration reds one rule, rule-before-edge reds another. Only a single atomic commit
   is green — and `indexes-fresh` is a fourth artifact the ordering omits.
3. **A is the only candidate with no kill switch at all** — no cutoff, no `enabled` scalar, no
   waiver. Disabling an over-firing rule means editing a sensitive, code-owned path, and A's own
   escape requires an anchored covered decision, so it cannot serve as an emergency disable.
4. B's Acceptance 2 is false against the live graph (verified: `intent-spec-index-validate-a3f1` is
   `addressed`, `created: 2026-06-11`, the same day as d4f2), so the named-set test reds on day one
   and **no cutoff value can fix it**.
5. B has the only single-actor, single-commit rollback of the three and never claims it.
6. B has a real feature flag and files it only as a defect — and if
   `intent-malformed-cutoff-finding-b3d7` lands as intended, B's kill switch is removed by a change
   B explicitly declines to coordinate with, with no statement of which lands first.
7. **B is the first dated gate whose exempting input escapes code-owner review**: both existing
   gates key on a contract's `created` at a CODEOWNERS-protected path; B keys on an intent's
   `created` at a path matching **no** CODEOWNERS rule.
8. C's expiry precedent is materially narrower than C's own mechanism, and C never draws the
   distinction — so a reader who checks the precedent concludes the risk is already normalized. It
   is not.
9. C ships an **unstaffed scheduled outage** priced as a trade-off: on 2027-01-31 the repository
   reds on whichever unrelated PR runs first, and the remedy requires one specific human. C's
   registry extension also stops being revertible on second use.
10. **The recorded red-window precedent is on this branch and none of the three cites it:**
    `integration-conveyor-derived-4d19:349-355` concludes "the unit of release is the whole branch".
    A and C reproduce exactly that shape. All three must state whether they claim per-commit
    greenness or adopt the recorded whole-branch unit of release. One mitigating fact none notes:
    `runValidation` collects findings from every rule without short-circuit, so a red
    `unbacked-addressed` masks nothing — the window is loud, not silent.

### cost-maintainability

**Verdict: Concern on all three.**

1. A adds permanent, unboundedly reusable vocabulary — A itself concedes this is "the largest
   permanent vocabulary cost of the three" and that "nothing caps how often subsumption is used" —
   for a mechanism used exactly once today.
2. A's fixture drift is **deferred, not avoided**: `subsumes` appears in zero of the ~25 fixture
   `edge-types.yaml` copies today, and A's only guard is a *new* hand-maintained consistency test
   layered on top of the copies it is meant to police.
3. **A is not the cheapest to delete**: the type is declared in canonical schema and taught in
   CLAUDE.md, so retiring it means first confirming no other `subsumes` edge exists anywhere.
4. B adds a third dated fail-open scalar to the exact surface `intent-malformed-cutoff-finding-b3d7`
   is already open to fix, and authors four loader assertions **whose purpose is to be reversed** by
   that already-captured intent — a merge-order landmine for b3d7's implementer.
5. B's mechanical fixture cost is lighter than the framing suggests (only 6 of ~25 fixture
   `validation-rules.yaml` copies set a dated scalar at all); the carrying cost is conceptual — a
   third independent scalar keyed on a different node's `created`.
6. **B is the cheapest to delete**, and this is the strongest maintainability property in the
   market: a one-line scalar removal, no edge to hunt, no node to supersede, zero permanent graph
   residue.
7. C's registry generalization is unbounded across all rules and permanent; `spec:validate` becomes
   time-dependent for the first time; and per rule 3 the first `override` node lives in the graph
   forever regardless of whether the exception is later resolved by real provenance.
8. C makes three previously-unexercised paths load-bearing at once — `by-type: override` indexing,
   CODEOWNERS matching, and `waives` resolution — by C's own Risk 5.
9. **Credit:** C adds zero new top-level scalar and zero new edge type to canonical schema, so none
   of the three fixture `checks.yaml` copies needs editing.
10. The standing structural cost binding every candidate: 25 hand-maintained fixture schema copies
    plus 3 `checks.yaml` copies are the multiplier that makes each candidate's marginal schema
    addition costlier than a single canonical edit.

## The case against each candidate

### A — `contract-unbacked-addressed-edge-5b71`

A's central claim is that the exception becomes queryable and permanent. **Both halves fail on
inspection.** It is not queryable in the view humans read: `tools/indexer.ts:175-189`'s six fixed
trail sections exclude `subsumes`, so `trails.md` renders d4f2 exactly as it does today — six
`_none_` blocks beside an `(addressed)` heading — and A buys "no indexer change" deliberately. What
A adds is an entry in a machine-shaped reverse index that returns a decision id, from which the
actual reason is another hop into unstructured body prose: the rule-1 anti-pattern relocated one
hop, not removed. It is not permanent in the sense that matters either, because an edge has no
status and no supersession idiom, so withdrawing a subsumption is an unreviewed line deletion that
leaves no trace.

The governance claim is worse. A's Trade-off 5 rests the human-in-the-loop on CODEOWNERS over
`/specs/nodes/decision-*`, but A's own Scope 7 authors **no new decision** — it reuses
`decision-lane-integration-9f3b`. Six of the ten perspectives independently found the same hole:
granting a subsumption is one line in `specs/graph/edges.yaml`, a path covered by no CODEOWNERS
rule and no `sensitive_paths` glob. The anchor is a property of the decision rather than of the
intent, so that decision becomes a reusable key, and there are eight decisions in this graph
selecting covered contracts.

And A's single shipped instance is the intent's own counter-example: it anchors d4f2 on
`evidence-lane-integration-9b4c`, the evidence that evidences a *different* intent, which is the
precise artifact `intent-unbacked-addressed-guard-8c4e:17-20` names as the defect. A converts the
prose excuse into a typed excuse without raising the bar for issuing one — and, by coupling d4f2's
verdict to an unrelated lane's evidence count with no specified finding text for the broken-anchor
branch, adds a red that names the wrong subject.

### B — `contract-unbacked-addressed-dated-2e94`

B is the cheapest, the least coupled and the easiest to revert, and on the review-gate axis its
documented switch is the best-protected in the market. **It is also the only candidate that is
factually wrong about the graph it ships against, and the error is in the artifact it offers as the
exception's record.** Acceptance 2 asserts the shipped `2026-06-12` cutoff grandfathers "exactly
one live addressed intent, `intent-status-coherence-d4f2`, by id". Verified against the loaded
graph: `intent-spec-index-validate-a3f1` is also `addressed` and also `created: 2026-06-11`, so the
grandfathered set is **two**. The named-set test reds on day one, the shipped schema comment is
untrue the day it lands, and no cutoff value can separate the two intents. Five perspectives found
this independently.

Worse than the arithmetic is the design error underneath it. B grandfathers on the intent's
`created` while the abuse it guards is an event on `status`, and the two are decoupled — d4f2 itself
was created 2026-06-11 and flipped weeks later. The consequence is live in the graph today:
`intent-docs-arrow-lint-e7b3` is `open`, `created: 2026-06-11`, with zero incoming edges, and under
B it is exempt **forever**. Someone can flip it to `addressed` with no contract, no decision and no
evidence — the exact failure mode this intent exists to stop — and B emits nothing, permanently.
B's Acceptance 2 cannot see it, because the tested set is intents addressed *today* while the exempt
set is a permanent function of `created` over all intents. **B ships with its own counter-example
pre-attached**, and its Trade-off 7 states the opposite ("today those are all backed on their
merits") about a population it did not enumerate.

B's remaining cost is that it records nothing: after B, no edge, node or field anywhere refers to
the exception, and the operative rationale lives in a schema comment and a test id — surfaces
`spec:index` never indexes and no query reaches. Combined with a green line that reads identically
whether the guard ran or a one-character typo disabled it, B is the weakest of the three on the
record axis and the only one whose failure is invisible in every operator surface.

### C — `contract-unbacked-addressed-waiver-8d36`

C has the best record content — a titled node carrying `reason`, `approved_by`, `expires` and prose
— and the only review-gate claim in the market backed by an executable assertion. **Its defect is
that it buys a general-purpose exemption capability to excuse one node, and mis-states that
capability in both directions.** Scope 2 makes every rule id in `validation-rules.yaml` a legal
`waives` target the day it lands, including `class-market-quorum`, which CLAUDE.md calls "the
unbypassable backstop". C's Trade-off 5 says every rule "becomes waivable"; verified, that is false
— **zero** validation handlers read `override` nodes, so a `waives → coverage-coherence` edge would
resolve cleanly, index as a waiver, pass code-owner review, and waive nothing. The real hazard is
the inverse of the one C names: the graph gains the ability to carry legible, green, indexed waivers
that are decorative, and no reader or auditor can tell them from effective ones. That is a
manufactured audit record in a repository whose product is auditability — and it leaves CLAUDE.md's
"unbypassable backstop" sentence ambiguous, with C shipping no correction either way.

C's expiry is genuinely the only scheduled re-examination in the market, and it is misapplied here.
d4f2's exempting facts are historical and immutable, so a 2027 re-signature can only restate them.
What the mechanism actually buys is a dated, unattended, repo-wide merge block: on 2027-01-31 every
in-flight PR touching `specs/**` reds citing an intent nobody touched, with no warning surface, and
the remedy routes to one named reviewer. Nothing enforces freshness over an in-place date bump, so
the graph cannot afterwards distinguish a re-judged waiver from a re-dated one — and renewal gets
decided while CI is red on someone else's branch, the moment least likely to attract scrutiny.

C also carries the largest incidental surface: `today` on `LoadedSpec` breaks 18 synthetic literals
(or, spelled optional, silently defaults to `undefined` under tsx and fires an expiry finding in
every unit test that did not opt in); the first live `waives` edge permanently populates
`unresolved.yaml`, which is `[]` today, because `tools/indexer.ts:93-98` carries no checks
exemption; and `override` has no status, so the node cannot be revoked, cannot be retired, and its
renewal path is undefined in a type this change is the first to instantiate.

---

**Recorded for the selection.** This comparison is the durable record of why the losers lost and is
never superseded by selection. The thirteen shared-core findings above bind whichever candidate is
selected, headed by finding 1 — the laundering path — which no candidate closes and which makes the
axis this market was framed on (which exception mechanism is best governed) secondary to a door
none of them locked. A selecting decision that does not carry finding 1 as a mandatory fix approves
a guard with a cheaper bypass than the exception it argues about.
