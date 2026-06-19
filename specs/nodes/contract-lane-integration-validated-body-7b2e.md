---
id: contract-lane-integration-validated-body-7b2e
type: contract
title: Lane model and integration node (integration body machine-validated)
status: candidate
created: 2026-06-19
class: 3
---

This intent (`intent-lane-model-integration-a1f7`) is itself multi-surface — it
migrates the schema (`specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`),
extends the validator (`tools/validator.ts` + new `tools/handlers/*.ts`), adds two agents
and three commands under `.claude/`, and edits `CLAUDE.md`, all in one PR. Under its own
routing table that is a **Class 3** change, which is why this proposal market carries ≥2
candidate contracts (this is candidate **B** of two). The two candidates share an
identical common core — the lane enum, the `integration` node and `integrates` edge, the
two agents, the three commands and the `/prepare-evidence` update, the CLAUDE.md lane
catalog and four rules, and the coverage-and-coherence handler — and differ on exactly
one axis: **whether `spec:validate` machine-checks the `integration` node's body, or
leaves body quality to the agent plus a convention.** Candidate B takes the validated
path: the same coverage core **plus a second validation rule** that requires the
`integration` body to contain each of its required sections, non-empty.

## Problem interpretation

The intent asks for a minimal lane model, a contract-level `integration` artifact for
multi-lane changes, evidence-to-capability wiring, and a validator extension that lands
and generalises the single-lane status-coherence rule that
`intent-status-coherence-d4f2` (class 2, open) specifies but which **does not exist in
code today**. That coherence rule — `evidence(final) —evidences→ brief —decomposes→
contract —proposes→ intent` with a `decision —selects→ contract`, flagged in both
directions — is the kernel this contract generalises from "one brief" to "every brief,
combined by an integration node." Because this contract lands and generalises d4f2's
rule, **the selecting `decision` records d4f2 as subsumed by this work**, and d4f2 moves
`open → addressed` once the rule lands with final evidence. d4f2 is an `intent` and so
cannot be `supersede`d (that edge is same-type→same-type), and no new intent is captured
for it — it already exists. It is simply driven to `addressed` by the coherence rule
this contract delivers.

The irreducible common core (identical across candidates A and B):

- **Schema.** In `specs/schema/node-types.yaml`, add an optional `lane` enum to node
  type `brief` with the eight values `product-spec | domain-backend | frontend-ui |
  data-migration | api-integration | test-verification | observability-release |
  docs-spec`; unset is an unlaned single brief and is allowed. Add node type
  `integration` with `required_fields [id, type, title, status, created]`,
  `status_values [draft, final]`, `requires_body: true`. In
  `specs/schema/edge-types.yaml`, add edge type `integrates` (`source: integration`,
  `target: evidence`).
- **Agents.** `.claude/agents/integration-reviewer.md` — judgement-only (same shape as
  contract-reviewer and the critics): judges the final per-lane evidence against the
  approved contract, surfaces conflicts and residual risk, applies scope-integrity
  (CLAUDE.md rule 5), authors the `integration` body, invokes graph-maintainer to write.
  `.claude/agents/test-writer.md` — writes/extends a brief's tests, never the same
  invocation that implemented the code under test.
- **Commands.** `.claude/commands/decompose-lanes.md`, `write-tests.md`, `integrate.md`,
  and the `prepare-evidence.md` update, exactly as in the intent (one brief per lane with
  a `lane` field + `decomposes` edge; a `test-verification` lane whenever ≥1
  implementation lane; `/write-tests` independent of `/implement-brief`; `/integrate`
  creates exactly one `integration` node with `integrates` edges to each lane's `final`
  evidence, adds `touches` edges, applies scope-integrity, sets `final` only when every
  lane is covered, then index + validate, commit only on green).
- **`/prepare-evidence` update:** (a) laned brief → brief `implemented`, intent stays
  `open` (addressed only via `/integrate`); unlaned single brief unchanged. (b)
  capability wiring: map the diff to capability `paths[]` from `specs/indexes/by-type.yaml`,
  add `touches` edges to every owning capability, and **STOP and ask the human** on
  paths no capability owns.
- **CLAUDE.md.** The eight-lane catalog + four rules (Class 3 decomposes into lanes /
  Class 2 may; verification always its own lane owned by test-writer; single-brief skips
  integration, multi-lane completed by a final `integration` node that is the coverage
  artifact and release `includes` target; every evidence records `touches`, unowned paths
  are a same-PR coverage gap).
- **Coverage + coherence rule.** A new handler in `tools/handlers/` registered in the
  `HANDLERS` map in `tools/validator.ts` and appended to `validation-rules.yaml`,
  modelled on `tools/handlers/comparison_required.ts`'s set-based coverage. It lands and
  generalises d4f2's single-lane coherence rule. (Exact shape and status-safety trap in
  Scope.)

What distinguishes **candidate B**: on top of the shared coverage core, B adds a
**second** validation rule + handler that machine-guards the `integration` node body for
**section presence**. The required sections — declared by the intent — are: combined lane
outputs and conflicts resolved; the COMBINED test run on the integrated result (commands
+ results); the joint contract-compliance verdict; cross-lane rollback and release
sequencing; combined risk; follow-ups; and the scope-integrity outcome. B's rule requires
each of these headings to be **present and non-empty** in every `integration` node's
body. This closes the agent-trust gap candidate A leaves open: an integration node that
omits, say, the COMBINED-test-run section turns `spec:validate` **red** rather than
passing on the structural facts alone.

## Scope

- **`specs/schema/node-types.yaml`** — add optional `lane` enum (8 values, unset allowed)
  to `brief`; add node type `integration` (`required_fields [id, type, title, status,
  created]`, `status_values [draft, final]`, `requires_body: true`). `nodes-status-in-enum`
  and `nodes-required-fields` + `requires_body` cover status/presence/non-empty-body for
  free.
- **`specs/schema/edge-types.yaml`** — add `integrates` (`source: integration`, `target:
  evidence`); `edges-endpoint-types` enforces endpoints for free.
- **`tools/handlers/*.ts` (coverage handler, working name `coverage_coherence.ts`),
  registered in the `HANDLERS` map in `tools/validator.ts`, appended to
  `validation-rules.yaml`** — pure `(rule, spec) => Finding[]`, modelled on
  `comparison_required.ts`. **Scoped to `selects`-edged intents only**, it encodes:
  single-brief contract covered ⟺ exactly one `final` evidence `evidences` its lone live
  brief; multi-brief contract covered ⟺ a `final` `integration` node `integrates` a
  `final` evidence for **every** live brief that `decomposes` it (a set/coverage check
  like `comparison_required`'s); an intent `addressed` ⟺ its `selects`-edged contract
  covered, **flagged in both directions**; a multi-brief contract treated covered without
  a `final` integration ⇒ finding. Counts **only non-superseded briefs and `final`
  evidence**; resolves via `nodesById`, defensively skips unresolved endpoints; listed
  **after `edges-references-resolve`**. This LANDS and GENERALISES d4f2's single-lane
  coherence rule, **absent from code today**.
- **`tools/handlers/*.ts` (integration-body handler, working name
  `integration_body_sections.ts`), registered in the `HANDLERS` map in
  `tools/validator.ts`, appended to `validation-rules.yaml`** — B's distinguishing rule.
  A `(rule, spec) => Finding[]` handler that, for every node whose `type` is
  `integration`, parses the markdown body and requires each configured section heading to
  be present with non-empty content. The required-section list is a **rule parameter** in
  `validation-rules.yaml` (the same data-driven pattern as `class_range`'s `values` and
  `list_field`'s `field`), so the heading set is config, not code: combined-lane-outputs-
  and-conflicts / COMBINED-test-run / joint-contract-compliance-verdict / cross-lane-
  rollback-and-sequencing / combined-risk / follow-ups / scope-integrity-outcome. Emits a
  `Finding` per missing-or-empty section. This rule depends on the body text, not on edge
  resolution, so its order relative to `edges-references-resolve` is immaterial; place it
  near the other node-field rules.
- **`.claude/agents/`** — add `integration-reviewer.md` and `test-writer.md`.
- **`.claude/commands/`** — add `decompose-lanes.md`, `write-tests.md`, `integrate.md`;
  update `prepare-evidence.md` (laned-brief status + capability wiring with STOP-and-ask).
- **`CLAUDE.md`** — lane catalog + four rules; **and** a note that, unlike the `comparison`
  node (whose body is convention-only), the `integration` node's body **is**
  machine-validated for section presence — making the inconsistency with the existing
  precedent explicit and deliberate rather than silent.
- **Capability-recursion resolution (in-scope, this PR).** The four capabilities own
  `specs/schema/**` (`capability-spec-schema-2c3d`), `tools/**`
  (`capability-spec-tooling-1a2b`), `.claude/{commands,agents}/**`
  (`capability-lifecycle-commands-4f5a`), `.github/**` (`capability-ci-enforcement-3e4f`)
  — **not** `CLAUDE.md`, `tests/`, or `specs/{nodes,graph,indexes}/`. This change's own
  evidence touches `CLAUDE.md` **and** `tests/`, so its `/prepare-evidence` STOP-and-asks.
  Resolve in-scope: extend `capability-spec-tooling-1a2b`'s `paths` (currently
  `[tools/**]`) with `CLAUDE.md` + `tests/**`, and record `specs/{nodes,graph,indexes}/**`
  as **intentionally unowned** via the human-confirm branch. (B's extra body handler adds
  more `tools/` and `tests/` surface, all owned by the now-extended capability.)

## Non-scope

- **No semantic body check.** B's body rule checks **section presence and non-emptiness
  only** — it asserts the headings exist with content, **not** that the content is true:
  a present COMBINED-test-run section does **not** prove tests actually ran. This is form,
  not substance, and is stated honestly here so the reviewer does not over-read the
  guarantee. Verifying that the combined run really happened remains the
  `integration-reviewer` agent's judgement.
- **No body validation for other node types.** Only `integration` bodies are
  section-checked; `comparison`, `brief`, `evidence`, etc. keep `requires_body`-only
  (non-empty) treatment. B does not retrofit section rules onto `comparison` (which
  CLAUDE.md explicitly keeps convention-only).
- **No new CI workflow.** Both new rules ride the existing `spec-validate.yml`.
- **No supersede / new intent for d4f2.** Driven to `addressed` by the coherence rule, as
  in Problem interpretation.
- **No release-node / `includes`-edge schema work** (pre-existing/out-of-band).
- **No retire/supersede changes** to existing lifecycle beyond scope-integrity.

## Trade-offs

- **+** Strongest guarantee — an `integration` node missing e.g. the COMBINED-test-run
  section turns `spec:validate` **red**, closing the agent-trust gap candidate A leaves
  open. Body completeness is enforced by CI, not just by agent discipline.
- **+** The required-section list is a rule parameter in `validation-rules.yaml` (same
  data-driven shape as `class_range`/`list_field`), so the section set is auditable
  config and is tuned without code changes.
- **+** Shares candidate A's entire coverage core, so the headline acceptance L1–L4 is
  delivered identically; B only **adds** assurance, never weakens the coverage rule.
- **−** **Breaks the established "node bodies are convention, not validation" precedent.**
  CLAUDE.md already states the `comparison` body structure is "a command/graph-maintainer
  convention, not a validation rule," and `node-types.yaml` enforces only `requires_body`
  for every body-bearing type. B introduces the first section-presence body rule — an
  **architecture-critic will challenge the inconsistency** of validating one node type's
  body while every other (including the closely analogous `comparison`) stays
  convention-only. B owns this by making the divergence explicit in CLAUDE.md, but it is
  a genuine doctrinal break.
- **−** **Checks FORM, not SUBSTANCE.** A present heading with a sentence under it
  satisfies the rule; it does **not** prove the combined tests ran, that the verdict is
  sound, or that the rollback sequence is correct. The rule can give a false sense of
  completeness — a thorough-looking but hollow body passes. (Stated plainly so selection
  is informed.)
- **−** **Largest validator surface** — **two** new rules + two handlers + their tests,
  plus a markdown-body parser the codebase does not yet have (existing handlers read
  frontmatter `data`, not body prose), which is new parsing risk (heading-matching,
  case/whitespace, fenced-code false positives).

## Risks

- **Status-blind coverage count (primary trap — a prior critique caught exactly this on
  the quorum rule).** Identical to candidate A: a status-blind brief/evidence count would
  mistake a superseded brief or a `draft` evidence for coverage. **Mitigation:** scope to
  `selects`-edged intents; count **only non-superseded briefs** and **only `final`
  evidence** (mirror `comparison_required.ts`'s live-only covered set); unit-test the
  superseded-brief and draft-evidence boundaries.
- **Rule must EXIT NON-ZERO, not merely report.** Acceptance L4 requires a non-zero exit,
  not an `indexes/unresolved.yaml` write (which d4f2's *origin text* mentions).
  **Mitigation:** both rules are plain `Finding[]` handlers in the `HANDLERS` registry; a
  finding makes the run non-zero. The d4f2 origin's `unresolved.yaml` routing is
  generalised and behaviourally superseded by these hard-fail handlers — recorded so it is
  not read as a regression.
- **Body-parser brittleness (B's defining risk).** Section-presence checking requires
  parsing markdown headings out of the body — a capability no existing handler has (all
  read frontmatter `data`). A naive parser could miss a section written with a slightly
  different heading, match a heading inside a fenced code block, or be defeated by an empty
  section with whitespace. A false **red** (heading present but unmatched) is as damaging
  as a false green. **Mitigation:** define the required headings as an explicit,
  documented config list with exact match semantics; strip fenced code before
  heading-scanning; treat a heading whose section content is only whitespace as empty;
  unit-test each failure mode (missing heading, present-but-empty, heading-in-code-fence,
  case/whitespace variants). The brief must pin the exact `kind`, rule `id`, and handler
  filename so the validator's `HANDLERS[kind]` dispatch does not silently fall through to
  an "unknown kind" finding.
- **Form-not-substance misread (B's honesty risk).** Readers may treat a green body rule
  as proof the integration was sound. **Mitigation:** state in CLAUDE.md and in the rule's
  finding text that the check is **section presence only**; the substantive judgement
  stays with `integration-reviewer`. This is a documentation mitigation for an inherent
  limitation, not a code fix.
- **Precedent-inconsistency challenge (B's doctrinal risk).** Validating the `integration`
  body while `comparison` stays convention-only is a real inconsistency a reviewer will
  raise. **Mitigation:** make the divergence explicit in CLAUDE.md with the rationale
  (the integration node is a *contract-coverage and release-`includes`* artifact whose
  completeness gates whether a multi-lane change is "done," a higher-stakes role than the
  comparison's advisory record) — so the inconsistency is a recorded, defended choice, not
  drift. The reviewer (and architecture-critic) weighs whether that rationale justifies
  the break versus candidate A's consistency.
- **Rule ordering / unresolved endpoints (coverage rule).** As in candidate A: list the
  coverage rule **after `edges-references-resolve`** and defensively skip unresolved
  endpoints. The body rule has no edge dependency.
- **Capability-recursion regression.** Same as candidate A — extend
  `capability-spec-tooling-1a2b` carefully; keep `sensitive_paths` at `specs/schema/**`.

## Acceptance examples

1. **(L1) Two-lane contract cannot mark its intent `addressed` until a final integration
   integrates both lanes.** Identical mechanism to candidate A: two lane briefs each with
   `decomposes` and `final` evidence; with no `final` integration integrating **both**,
   the intent `addressed` makes `spec:validate` **fail** on the coverage rule. Adding the
   `final` integration covering both lanes flips that rule green. **Additionally** the
   integration node's body must pass the section rule (see example 7).
2. **(L2) Single-brief contract completes with no integration node.** One unlaned brief,
   one `final` evidence, intent `addressed` → green, no `integration` node, no body rule
   applies (the body rule only fires on `integration`-type nodes).
3. **(L3) `/prepare-evidence` on a change touching an unowned path stops and asks.** As in
   candidate A — and this PR's own diff (touching `CLAUDE.md` + `tests/`) is the concrete
   case; resolution records the extended `capability-spec-tooling-1a2b` paths and confirms
   `specs/{nodes,graph,indexes}/**` intentionally unowned.
4. **(L4) `spec:validate` exits non-zero on a two-brief contract completed without
   integration.** Two live briefs `decompose` the contract, a `final` evidence for each,
   intent `addressed`, **no** `final` integration → `node_modules/.bin/tsx tools/spec.ts
   validate` exits **non-zero** on the coverage rule. Identical to candidate A.
5. **(d4f2 subsumption — generalisation lands.)** Single-lane contract green when
   `final`-evidenced and `addressed`, red when evidence is `draft` and intent `addressed`
   — d4f2's bidirectional single-lane rule as a special case. The selecting `decision`
   records d4f2 subsumed; d4f2 → `addressed` once the rule lands with final evidence.
6. **(Status-safety — the trap.)** A two-brief contract with one brief **superseded** is
   judged against the live brief set; a `draft` evidence never counts as coverage.
   Status-blind counting is avoided.
7. **(B's distinguishing acceptance — body section enforcement.)** A `final` `integration`
   node that `integrates` `final` evidence for every live brief (so the **coverage** rule
   is green) **but whose body omits the COMBINED-test-run section** makes `spec:validate`
   **fail** on B's body rule, e.g. `integration <id> body is missing required non-empty
   section 'COMBINED test run'`. Adding that section (non-empty) flips it green. **This is
   the exact case candidate A passes** — the agent-trust gap B closes.
8. **(B's honesty bound — form not substance.)** A `final` integration whose
   COMBINED-test-run section is present and non-empty but **describes no real test run**
   (prose only, no commands) **passes** B's body rule — demonstrating the rule guarantees
   section presence, not that tests ran. The substantive check stays with
   `integration-reviewer`. (Recorded so the guarantee is not over-read.)

## Verification needs

- **`node --test`** over the coverage-and-coherence handler: the same matrix as candidate
  A (single-brief covered/uncovered both directions; two-brief covered via final
  integration; two-brief uncovered → finding (L4); partial integration → finding;
  superseded brief excluded; draft evidence not counted; unresolved endpoint skipped;
  covered-but-not-addressed → finding).
- **`node --test`** over the integration-body handler: (a) all required sections present
  and non-empty → no finding; (b) each section missing in turn → one finding naming that
  section; (c) a section heading present but content only whitespace → finding
  (present-but-empty); (d) a matching heading inside a fenced code block does **not**
  satisfy the rule (no false green); (e) case/whitespace heading variants handled per the
  pinned match semantics; (f) a non-`integration` node is ignored.
- **Form-not-substance demonstration:** a body whose COMBINED-test-run section is present
  but contains only prose (no commands/results) **passes** the body rule — verifying B's
  honest bound (example 8).
- **Real-tree green check:** `node_modules/.bin/tsx tools/spec.ts validate` green on the
  actual post-migration graph, including this PR's own `integration` node body (which must
  itself satisfy B's section rule — B's own dogfooding) and the extended
  `capability-spec-tooling-1a2b` paths.
- **Ordering check:** the coverage rule is listed **after `edges-references-resolve`**;
  the body rule's position is asserted to be order-independent (no edge dependency).
- **Dispatch-pinning check:** assert the exact `kind` string for each new rule matches a
  key in the `HANDLERS` map in `tools/validator.ts`, so neither rule falls through to the
  "unknown kind" finding.
- **Schema checks (free from existing handlers):** `integration` status outside `{draft,
  final}` fails `nodes-status-in-enum`; empty `integration` body fails `requires_body`;
  malformed `integrates` endpoints fail `edges-endpoint-types`.
- **CI:** both new rules are picked up by `spec-validate.yml` with no workflow edit; the
  mutating step ends with `node_modules/.bin/tsx tools/spec.ts index && … validate` and
  must not commit on failure.

## Critique (spec)

Reviewed from the spec axis only, against the actual schema, the validator dispatch, the `comparison_required.ts`/`references_resolve` handlers, and the live edge set. Candidate B inherits the entire shared core, so findings 1, 2, and 4 below are the same shared-core defects raised against candidate A; finding 3 and finding 5 are specific to B's added body-section rule.

1. **(Shared) d4f2 cannot be "driven to `addressed`" by the rule as scoped.** B's Problem interpretation makes the identical claim as candidate A: "d4f2 moves `open → addressed` once the rule lands." But B's coverage rule is also "**Scoped to `selects`-edged intents only**," and `intent-status-coherence-d4f2` has **no incoming edges at all** in the live graph (`incoming.yaml` has no entry for it; nothing `proposes` it, no `decision` selects a contract for it). A `selects`-reachable-only rule structurally **skips d4f2** and can never set it `addressed`. **Fix / sharp question:** state whether d4f2's `open → addressed` is a manual edit recorded in the selecting decision (it must be), not a consequence of the rule firing on d4f2 — the mechanism described cannot reach the node it claims to advance.

2. **(Shared) `/integrate` adding `touches` edges collides with the `touches` source-type rule B also relies on as "free."** B's Scope says `/integrate` "adds `touches` edges," yet `edge-types.yaml` fixes `touches` as `source: evidence, target: capability`, and B claims `edges-endpoint-types` enforces endpoints "for free." A `touches` edge written **from the `integration` node** would fail that very handler (`requires source.type=evidence, got integration`). **Fix:** state explicitly that `touches` edges are authored from the per-lane **evidence** nodes, or list widening the `touches` source as in-scope schema work (it is currently absent from Non-scope).

3. **B's body-section rule double-covers `requires_body` and risks an undefined-behaviour overlap on the empty-body case — pin the boundary.** B keeps `integration.requires_body: true` (Scope) *and* adds a section-presence rule that requires every configured heading non-empty. On a completely empty `integration` body, **two** rules now fire (`requires_body` and the new body rule emitting one finding per missing section), which is noisy but harmless; the unstated case is a body that is **non-empty prose with no recognised headings** — `requires_body` passes, and the new rule must emit one finding per *missing* section. **Sharp question:** does the body rule iterate the *required-section config list* (so a heading-less body yields N findings) or scan *found headings* (so a heading-less body yields zero findings and a false green)? B's text says "requires each configured section heading to be present" — that implies the former, but the contract must pin it, because the parser direction is the whole correctness of the rule.

4. **(Shared) The `unresolved.yaml` reporting contract d4f2 specifies is replaced, not just generalised.** d4f2's body explicitly requires its violations to be **distinguishable in `indexes/unresolved.yaml`** and warns against merging them with unresolved-edge findings. B (like A) delivers `Finding[]` hard-fails instead — a fine upgrade, but it changes d4f2's own acceptance. This reinforces finding 1: the delivered rule does not satisfy d4f2's stated contract, so "d4f2 subsumed/addressed" needs the decision to record the deliberate replacement, not assert seamless subsumption.

5. **B's own dispatch-pinning risk is real and the contract must make the `kind` string a hard deliverable, not a note.** I confirmed in `tools/validator.ts` that an unrecognised rule `kind` does not silently no-op — it emits a `Finding` ("unknown kind") that turns validate **red**. B already flags this (Risks: "pin the exact `kind`, rule `id`, and handler filename"), which is good; the spec-axis sharpening is that B is adding the codebase's **first body-prose-parsing handler** (every existing handler reads frontmatter `data`, never markdown body), so there is no precedent `kind` to copy and the `HANDLERS` registration is genuinely novel surface. **Fix / sharp question:** the brief must name the exact `kind` literal, the `validation-rules.yaml` rule `id`, and the handler filename together, *and* specify whether fenced-code stripping and whitespace-only-section detection are acceptance-tested — otherwise B ships a new parsing primitive whose first failure mode (a real false-red on a correctly-written body) is as graph-blocking as the gap it closes. The honest "form not substance" bound is fine; the unaddressed spec risk is the parser's *false-red*, which would block green graphs on well-formed integrations.

None of findings 1, 2, or 4 are introduced by B's distinguishing rule — they are shared-core issues. Findings 3 and 5 are the price of B's added body rule and are the spec-axis cost the selector should weigh against the agent-trust gap it closes.

## Critique (product)

**User problem the intent states.** Same user problem as A: the graph must not silently claim a multi-lane change is done, and the integration body exists specifically so "this catches defects present in no single lane." The user is whoever trusts the graph's `done`/green signal — the release, the next contributor, the auditor — typically *without reading the body*. B inherits A's entire coverage core (so the coverage half of the problem is solved identically) and *adds* a machine check that the integration body contains its required sections, non-empty. On my axis, B's distinguishing move is aimed squarely at the intent's headline value: it makes "the integration node actually documents a combined test run and a contract-compliance verdict" a CI gate rather than agent trust.

**Where B's gate matches — and where it falls short of — the stated value.** B closes the precise gap I flag in A: an integration node that omits the COMBINED-test-run section turns the tree red (B's example 7), so the downstream user who trusts green now gets a stronger guarantee that the documented verification *exists*. That is a real product gain and is faithful to the intent's emphasis on body content. But B is explicit (Non-scope, Trade-offs, example 8) that the check is *presence and non-emptiness only* — a COMBINED-test-run heading with one sentence of prose and no commands passes. So B narrows but does not close the proxy: the falsifiable claim moves from A's "an integration node exists" up to "an integration node *documents* the required sections," but stops short of the intent's actual value, "the combined change *was tested*." The product risk specific to B: a *form* gate can manufacture false confidence more effectively than no gate, because a green tree now positively asserts "COMBINED-test-run section present" — and a reader will over-read that as "combined tests ran." Concrete scenario: an author, knowing the body rule will fail an empty section, pastes a plausible-sounding sentence under each required heading; CI goes green; the section-presence gate has now *laundered* a hollow integration into a check that looks more authoritative than A's. B names this honestly (example 8), but honesty in the contract body does not reach the downstream user reading only the green check.

**Unstated user / use-case B silently burdens.** B introduces section-presence enforcement on the integration body, with the required headings pinned as a config list. The unstated user here is the *integration author working under the rule*: every `/integrate` run must now produce all seven sections (combined-lane-outputs, COMBINED-test-run, joint-contract-compliance-verdict, cross-lane-rollback-and-sequencing, combined-risk, follow-ups, scope-integrity-outcome) non-empty, or the tree is red — including for a *two-lane* change where, say, "cross-lane rollback sequencing" or "follow-ups" may genuinely be "none." B does not state how a legitimately-empty section is satisfied. Concrete failure scenario: a clean two-lane integration with no cross-lane rollback concern and no follow-ups; the author must write filler ("N/A," "none") under those headings to pass the non-empty check, training authors to treat the sections as boxes to fill rather than judgements to make — which *erodes* the very body quality the rule exists to protect. Sharp question/fix: does B's rule accept an explicit "none"/"N/A" as non-empty, and if so, isn't a body of seven "N/A"s green — reducing B's guarantee to A's plus boilerplate? B should specify, on the product axis, what a *minimally-passing* body looks like, because that body — not the ideal one — is what the rule actually guarantees to downstream users.

**Value claim that is not falsifiable as written.** B's implicit product claim is "multi-lane integrations are now documented to a required standard before they're marked done." After shipping, how do we know it worked? We can falsify "required sections are present" (B's example 7 — genuinely testable, a real improvement over A). We *cannot* falsify the claim a user will actually draw — "the integration was verified" — because example 8 concedes a hollow-but-present body is green. So B's earned claim is "the integration node is structurally complete," and B must be read as claiming only that, not verification. The reviewer's sharp question: does moving the gate from "node exists" (A) to "node has all headings" (B) buy enough *user value* to justify the cost, given that neither reaches "node is true"?

**Shared product concerns B inherits (same as A, on my axis).**
- *d4f2 subsumption drops d4f2's distinguishability requirement.* Identical to A: B drives `intent-status-coherence-d4f2` to `addressed` but reframes its `unresolved.yaml`-with-distinguishable-`kind` reporting requirement as a hard-fail `Finding[]`. d4f2's "Considerations" explicitly names mixing failure classes into one undifferentiated list as "the failure mode to avoid." Sharp question: do B's two new findings (coverage, and the body-section finding) carry messages that an operator can distinguish from each other and from the existing edge-resolution findings — or does the operator just see more red? B *adds a second source of red* (the body rule), making the distinguishability concern d4f2 raised strictly worse than A's, not better. If d4f2's value is operator-distinguishable diagnostics, neither candidate delivers it, and B compounds it.
- *Laned-lifecycle complexity with no documented misclassification exit.* Same as A: the mandatory `/decompose-lanes`→`/write-tests`→`/integrate` path has no stated recovery when a lane collapses to nothing, and B *raises* the exit cost — collapsing to single-lane now also means escaping a seven-section body rule that would otherwise fire on the integration node the contributor no longer needs. Fix/question: B should state the recovery path *and* confirm the body rule does not fire on a contract that legitimately reverts to single-brief (B asserts the body rule "only fires on integration-type nodes," so a single-brief contract with no integration node is safe — confirm this is documented for the contributor, not just true in code).

**Strongest single product argument against approving B as written.** B's added gate raises the *floor* of the documented integration but risks raising users' *trust* by more than it raises actual assurance: a green tree under B positively asserts "all required sections present," which a downstream consumer will read as "the combined change was properly verified," while B itself concedes (example 8) a present-but-hollow body passes. The product question for selection is whether a *form* gate that can be satisfied by boilerplate delivers enough user value over A's agent-trust model to justify the extra surface — or whether it mostly relocates the trust problem from "is the body present?" to "is the present body real?", a question the gate still cannot answer and that the green check now obscures.

## Critique (ux)

Candidate B shares candidate A's entire operator-facing core, so every shared-core UX gap I raise against A applies here too: `/integrate` has no specified closing report; the partial / blocked-integration remediation path is undescribed; the `/write-tests` vs `/implement-brief` ordering is an unguided two-command dance; the `/prepare-evidence` STOP-and-ask prompt content (which unowned paths, which extendable capabilities) is unspecified; and the laned-brief → intent-stays-`open` → `/integrate` hand-off is not self-explaining at the point the operator observes it. B does **not** fix any of these, so they stand against B identically. B's body-validation rule then adds a second, distinct operator-facing surface — a new way for `spec:validate` to go red — with its own UX risks.

### B closes A's silent-failure gap — a real UX improvement on this axis

B's defining rule turns the invisible failure A leaves open into a **discoverable** one: an integration body missing the COMBINED-test-run section turns `spec:validate` red with a finding (example 7, lines 260–265: `integration <id> body is missing required non-empty section '...'`). From the operator's seat this is strictly better discoverability for the most consequential state — "the integration record is incomplete" — because it surfaces as a red CI signal instead of requiring a human to open the body and notice a missing heading. This is the one axis where B's divergence is a UX win, and I record it as such.

### But B introduces a new false-red operator experience — and the finding UX is underspecified

- **A false red is a worse operator experience than a false green here.** B's own Risks (lines 203–214) concede the body parser can fire a finding when a section *is* present but written with a slightly different heading, or treat a whitespace-only section as missing, or be "defeated" by a heading inside a fenced code block. For the operator this is the most frustrating possible interaction: they wrote the COMBINED-test-run section, `spec:validate` insists it is missing, and they must reverse-engineer the parser's exact heading-match semantics to get to green. The existing handlers all read structured frontmatter `data`; B is the **first** rule whose pass/fail depends on free-form prose the human typed, so it is the first rule that can be wrong about what the human plainly wrote. **Fix:** the finding text must not just say "missing section X" — it must tell the operator the *exact heading string* the rule expected and, ideally, which headings it *did* find, so an operator hitting a false red can self-correct without reading the handler source. (Contrast the existing `comparison_required` finding, which spells out the full covered/live sets so the operator sees exactly what is short.)

- **No authoring affordance closes the discoverability loop.** B requires seven specific headings present and non-empty, but the operator authors the integration body through the integration-reviewer agent with no template or echoed checklist surfaced to the human. The operator's first encounter with the exact required heading set is a red `spec:validate` *after* authoring — a discover-by-failure loop. **Fix:** have `/integrate` (or the integration-reviewer agent definition) surface the required-section checklist *before* the body is finalized, so the operator meets the requirement at authoring time, not at validate time. B notes the section list lives in `validation-rules.yaml` config (lines 116–124), which is good for auditors but invisible to the operator authoring a body — config-as-source-of-truth does not help the human unless something echoes it to them.

- **The form-not-substance bound is an operator-facing trap, not just a doctrinal one.** B is honest (lines 179–183, example 8 at lines 266–270) that a present-but-hollow section passes. The UX risk is that a green body rule *reads to the operator and to downstream humans as "the integration is complete and tested,"* when it only means the headings exist. This is arguably a worse discoverability outcome than A's honest silence, because a green-with-body-rule actively signals false assurance. **Sharp question:** will the finding/success text and the CLAUDE.md note make unmistakably clear to the operator that green means *sections present*, not *integration sound* — so the rule does not lull the next human into skipping the read? Without that, B trades A's silent gap for a confidently-wrong green.

### Net on this axis

B's body rule is a genuine discoverability improvement over A's silent gap for the integration-completeness state, but it ships a new false-red interaction whose finding-message UX and authoring-time affordance are unspecified, plus a false-assurance reading of its own green. None of these is blocking, but the finding text and an authoring-time checklist are the difference between B's rule helping the operator and merely punishing them.

## Critique (architecture)

Reviewed on the architecture axis only. Candidate B shares A's entire coverage core, so findings 1–4 in A's architecture critique apply verbatim to B as well: the `integration` node is bound to its contract only transitively through `integrates → evidence` with no one-integration-per-contract invariant; the coverage handler is a third hand-rolled traversal of the proposes/selects/decomposes spine; the `capability-spec-tooling-1a2b` widening annexes `CLAUDE.md` and `tests/**` into a grab-bag capability; and `touches`-coverage remains a workflow promise with no validate backstop. Those are not re-argued here. B's *distinguishing* second rule adds three further architecture concerns.

**1. B introduces body-prose parsing into `spec:validate` for the first time — a new architectural layer inside a validator that, by design, reads only frontmatter.** Every handler in `tools/validator.ts`'s `HANDLERS` map (`required_fields`, `enum_constraint`, `references_resolve`, `class_range`, `comparison_required`, …) reads `node.data` (parsed YAML frontmatter) or `spec.edges`. None reads `node.body`. `loader.ts` does load `body` onto every `NodeRecord`, so the text is available — but B's `integration_body_sections.ts` would be the first handler to treat the markdown body as *structured, machine-checked data*. That crosses a real boundary: the validator stops being a graph/frontmatter-shape checker and becomes a markdown-content linter. The blast radius B's Trade-offs note (heading-matching, fenced-code false positives, whitespace-only sections) is the symptom; the architectural cost is that the validator now owns a markdown-parsing contract it never had, and every future "the body must contain X" demand for any node type now has precedent to land in `spec:validate` rather than in an agent. Sharp question: should body-content checks live in the schema validator at all, or in the `integration-reviewer` agent / a separate `spec:lint-bodies` surface, keeping `spec:validate` a pure graph-shape tool?

**2. B breaks the "node bodies are convention, not validation" doctrine *asymmetrically* — it section-checks `integration` while the structurally-analogous `comparison` stays convention-only.** `node-types.yaml` enforces only `requires_body` for every body-bearing type, and CLAUDE.md explicitly fixes the `comparison` body as "a command/graph-maintainer convention, not a validation rule." `comparison` and `integration` are close architectural twins: both are durable, regenerable, contract-scoped record artifacts authored by a reviewer agent and consumed downstream. B validates one twin's sections and not the other. B's own Scope concedes this and proposes a CLAUDE.md note defending it (the integration node is a higher-stakes coverage/release artifact). The defense is coherent, but it establishes a *case-by-case* policy for which node bodies are machine-checked — a slippery boundary the codebase has so far avoided by a flat rule ("all bodies: non-empty only"). Concrete debt: the next node type whose body "really matters" reopens this argument, and reviewers must now adjudicate body-validation per type rather than pointing at one doctrine. Sharp question: if the integration body's *completeness* must gate `addressed`, is section-presence-in-prose the right schema mechanism, or should the load-bearing facts (combined test run happened, joint verdict reached) be promoted to frontmatter fields / dedicated nodes that the existing frontmatter validators already cover — keeping the body convention-only and the gate on structured data?

**3. Section headings as a config list in `validation-rules.yaml` couples a schema file to prose strings and creates a three-way drift surface.** B stores the required-heading set as a rule parameter (citing `class_range`'s `values` and `list_field`'s `field` as precedent). But those precedents are *structural* parameters (an integer range, a frontmatter field name); B's parameter is a list of human-readable heading strings that must stay byte-aligned with (a) the headings the `integration-reviewer` agent actually writes, (b) the CLAUDE.md convention text describing those sections, and (c) the intent's prose list. Three copies of the same heading vocabulary, in three files, with no single source of truth — a classic drift trap. Concrete failure: someone renames a section in the agent definition or CLAUDE.md (e.g. "COMBINED test run" → "Integrated test run") and the validator now false-reds every new integration, or the config is loosened and silently stops checking a renamed section. Sharp question: where is the single canonical declaration of the integration body's required sections, and what keeps the validator config, the authoring agent, and CLAUDE.md from diverging — given the validator has no test that the config strings match what the agent emits?

## Critique (security-privacy)

**Personal/sensitive data axis: no concern.** Like candidate A, B handles no personal or user data — spec-graph schema, CI handlers, agents, commands only. Nothing reads, stores, logs, or transmits PII or secrets. The findings below are integrity/CI-trust, the security half of this axis.

**B inherits every trust-boundary finding from A, unchanged.** B shares A's entire coverage core, so the same three boundary concerns apply verbatim: (1) `/integrate` writes the `touches` edge that `check-diff`'s `hasGoverningEvidence` (tools/checkdiff.ts) trusts to govern a `specs/schema/**` change, and Scope does not require that edge to target the path's *owning* capability (`capability-spec-schema-2c3d`); (2) widening `capability-spec-tooling-1a2b` to own `tests/**` + `CLAUDE.md` folds code-under-test, its tests, and the security-policy text under one capability's coverage; (3) `specs/{nodes,graph,indexes}/**` declared intentionally unowned is exactly where the `touches`/`status`/`final` inputs the gate trusts are authored. These are not re-argued here — they are identical and equally unaddressed in B.

**B's distinguishing mechanism adds a NEW untrusted-input parsing surface inside the CI gate — the sharpest security finding against B.** B's second handler parses the `integration` node's *markdown body prose* — a capability the codebase explicitly does not have today (every existing handler reads frontmatter `data`, never body text). This moves attacker- or agent-controllable free text into the trusted path of `spec:validate`, which runs in CI and whose green/red result is a merge gate. B names this as "body-parser brittleness" (heading-in-code-fence, whitespace, case) but frames it as a correctness risk, not a gate-integrity/injection risk. The security framing is sharper: a body author who controls the prose controls the parser's input. Concrete failure modes the contract does not enumerate on-axis: (a) **false-green by heading spoofing** — a body that places the seven required headings inside a fenced code block, an HTML comment, or a blockquote (so the change looks complete to a human reader scanning the rendered doc, while a naive heading scan that doesn't strip those constructs either over- or under-matches) can pass section presence with no real combined-test-run; (b) **CI denial-of-service / parser abuse** — pathological markdown (deeply nested fences, gigantic bodies, regex-catastrophic heading patterns if the matcher uses regex) fed to a body parser that runs on every validate could hang or crash the gate, and a crashed validator is a failed gate for *everyone's* PR, not just the malicious node. B's mitigation (strip fenced code, exact-match semantics, treat whitespace-only as empty) is the right direction but is described as test cases, not as a hardened-parser security requirement (input-size bounds, no catastrophic backtracking, fail-closed on parse error rather than fail-open to "section present"). Sharp question: if the body parser throws or times out on a malformed body, does the handler fail *closed* (finding emitted, gate red) or fail *open* (no finding, gate green)? The contract does not say, and `comparison_required.ts`'s precedent is to defensively *skip* on bad input — fail-open — which for a body-presence rule would silently wave through exactly the incomplete integration B exists to catch.

**B's own honesty bound is itself a security caveat that must not be over-read.** B states (Non-scope, example 8) that the rule checks section *presence and non-emptiness only*, not substance: a COMBINED-test-run heading with one line of prose and no real commands passes. On-axis, this means B does NOT close the gate-integrity gap from A as cleanly as its trade-offs imply — it raises the bar for a hollow body from "empty" to "one non-empty line under each of seven headings," which an agent (or adversary) producing the body can trivially clear. The integration node still sits on the sensitive-change coverage chain; B's rule makes a bypass slightly noisier, not impossible. The contract records this honestly, which is good; the reviewer must not read "body machine-validated" as "combined test run machine-verified."

**Strongest single security argument against approving B as written.** B's added value on this axis is real but bounded (presence, not substance), while its added *cost* on this axis is a brand-new untrusted-markdown-prose parser running inside the merge-gating validator — the first time body text becomes a CI-trusted input in this codebase. That trades a documented agent-trust gap for a fresh parsing/injection/availability surface in the one tool whose integrity the whole gate model depends on, and the contract specifies neither a fail-closed-on-parse-error rule nor input-hardening bounds. Approving B means accepting that new attack surface; it should not be approved without the body handler pinned to fail *closed* (parse failure or timeout ⇒ finding, never silent pass) and bounded against pathological input.

## Critique (compliance-risk)

Scope reviewed: this candidate's `## Scope` (both handlers), `## Non-scope`, `## Problem interpretation`, and acceptance examples 7-8. Same compliance surface as for candidate A: the spec graph's own governance regime — audit trail, record-keeping obligations, and the CLAUDE.md/`validation-rules.yaml` policy constraints. B shares A's entire core, so the shared findings below apply identically; B then adds a body-section validation rule whose compliance characteristics I assess separately.

### a) Shared record-keeping gap (carried from the common core): d4f2 reaches `addressed` with no provenance chain
Identical to candidate A and identically load-bearing here. B drives `intent-status-coherence-d4f2` from `open -> addressed` through a note in this contract's selecting `decision` plus the coherence rule landing — with no contract that `proposes` d4f2, no `selects` edge of its own, and (per Scope bullet 3) a coverage handler *scoped to `selects`-edged intents only*, so the very rule whose landing justifies d4f2's new status does not itself cover d4f2. Concrete failure: an auditor querying "what selected, contracted work addressed d4f2?" gets nothing. Fix / sharp question: persist the subsumption as a queryable record (an explicit `decision` naming d4f2 as subsumed subject, or a real contract/brief/evidence chain) rather than as prose inside a different intent's contract. B's extra body rule does NOT touch this gap.

### b) Shared audit-trail gap (carried from the common core): the `specs/{nodes,graph,indexes}/**` "intentionally unowned" exemption persists no authorization record
Identical to candidate A. B's capability-recursion resolution records the graph-data tree as intentionally unowned via the `/prepare-evidence` human-confirm branch with no durable node/edge capturing who authorized it, when, or why — permanently exempting the territory that physically holds every `decision`, `comparison`, and `supersedes` provenance edge from drift/coverage detection. Fix / sharp question: require the human-confirm branch to write a dated, durable authorization (a `decision` node or a capability whose body states the unowned-by-design rationale).

### c) Policy/constraint the change could violate (carried from the common core, *aggravated* in B): `CLAUDE.md` folded into a tooling capability, now with B's CLAUDE.md edit also owned by tooling
Same as candidate A — extending `capability-spec-tooling-1a2b` to own `CLAUDE.md` misclassifies the governing compliance document as tooling, so a future PR weakening a class-3 human gate is `touches`-attributed to tooling rather than routed as a policy change. B aggravates this slightly: Scope adds a CLAUDE.md note declaring the integration-body validation a *deliberate, explicit divergence* from the "node bodies are convention, not validation" precedent — a genuine compliance-doctrine statement that will live in `CLAUDE.md` under tooling ownership. Fix / sharp question: give `CLAUDE.md` its own governance capability, or record why the compliance charter is owned by the tooling capability.

### d) B-specific, on-axis: the body-section rule strengthens the audit record but its honest "form-not-substance" bound must not be over-read as compliance assurance
B's distinguishing `integration_body_sections` rule machine-checks that the `integration` body contains each required section — including the joint-contract-compliance-verdict, the COMBINED-test-run, and the scope-integrity-outcome — non-empty. On the compliance axis this is the *stronger* record-keeping posture than A: the contract-level audit record's completeness is enforced by the gate, not by agent trust, so the silence-is-a-clean-bill failure A concedes is closed for *section presence*. But Non-scope bullet 1 and acceptance example 8 concede the rule proves only that the heading exists with content, not that the combined tests ran or the verdict is sound. Concrete compliance failure to guard against: a `final` integration whose COMBINED-test-run and scope-integrity-outcome sections are present but contain hollow prose (no commands, no real outcome) passes `spec:validate` green — and a downstream reviewer, or a release built on that integration as its `includes` target, treats a green graph as evidence the joint compliance verdict was actually performed. The danger is that a *machine-green* compliance section reads as stronger assurance than an agent-attested one while certifying no more substance. Fix / sharp question: pin the rule's finding text and the CLAUDE.md note to state explicitly that the check is section-presence only and that the substantive contract-compliance and combined-test verdicts remain `integration-reviewer` judgement — so a green body rule is never cited as proof the compliance verdict was performed.

### e) B-specific, on-axis: parser brittleness can produce a false-green compliance record
B's body rule requires a markdown-heading parser the codebase does not yet have (every existing handler reads frontmatter `data`, not body prose; Trade-offs final bullet and Risks "Body-parser brittleness" concede this). On the compliance axis the asymmetric danger is the false GREEN, not the false red: a heading-match that is too loose, or one that matches a heading inside a fenced code block (example given in B's own risk), lets an integration whose real compliance-verdict section is *absent* pass as present — a missing audit record certified as present. Fix / sharp question: ensure the unit matrix (Verification needs) asserts the false-green cases — heading-in-code-fence and present-but-whitespace must produce findings — and treats a false green on the verdict/scope-integrity sections as a release-blocking defect, since a false green here is a missing compliance record reported as complete.

### f) Single strongest compliance argument against approving B as written
B materially improves the audit posture over A by gating the integration body's required compliance sections — that is, on this axis, a real strength, not a concern. The strongest compliance argument against B *as written* is residual and shared: even with section presence enforced, B still (a) drives d4f2 to `addressed` with no provenance chain and (b) leaves the graph-data tree exempted with no durable authorization record — neither of which B's extra rule addresses — and B newly introduces a machine-green-but-substance-blind compliance section that can be over-read as assurance the joint verdict was actually performed. Approving B without closing (a), (b), and pinning the form-not-substance bound risks a lifecycle that *looks* more rigorously audited than it certifies.

## Critique (qa-test)

Scope reviewed: this candidate's `## Scope`, `## Acceptance examples`, `## Verification needs`, `## Non-scope`, and `## Trade-offs` (no code diff at proposal time). Findings are on the testability/verification axis only.

**1. B closes A's oracle gap on the integration body — but with a body parser that is the largest new test surface in the change, and its hardest failure mode is under-specified.** B's defining rule parses markdown headings out of the integration body (a capability no existing handler has — every current handler reads frontmatter `node.data`; the loader does expose `node.body`, so no loader change is needed, but no handler precedent for prose parsing exists). B's `## Risks` (Body-parser brittleness) and `## Verification needs` (b)-(e) do enumerate the obvious modes (missing heading, present-but-empty, heading-in-code-fence, case/whitespace, non-integration ignored) — a genuinely good start. The unaddressed failure is the **three-way agreement** the rule silently depends on: the heading strings in CLAUDE.md's prose section list, the headings the `integration-reviewer` agent actually emits into the body, and the required-section config list in `validation-rules.yaml` must all match exactly. The plan tests the parser against fixtures *the test author writes*, never against the headings the agent is told to produce. Concrete failure: the agent emits "## Combined test run" while the config pins "COMBINED test run" (the casing the intent uses) — every real integration node turns **false-red**, and a false red here blocks every legitimate multi-lane merge until someone reconciles three files. A false red is as damaging as a false green (B's own Risks say so) but the plan has no test that the agent's emitted headings satisfy the config — only that hand-built fixtures do. Fix or sharp question: does Verification needs include a fixture generated from (or asserted byte-equal to) the integration-reviewer's documented heading set, so a drift between agent output and rule config fails the suite rather than production?

**2. B's body rule's green is itself a misleading oracle (form-not-substance), and example 8 *certifies* that.** Acceptance example 8 and `## Non-scope` honestly state a `final` integration whose COMBINED-test-run section is "present and non-empty but describes no real test run (prose only, no commands) **passes**." From the qa-test axis this means B's strongest selling point — "body completeness enforced by CI" — guarantees section *presence*, not that any test ran, exactly the substance A was faulted for leaving to agents. B narrows the trust gap (an *omitted* section now fails) but does not close it (a *hollow* section still passes). The risk is that a green B body rule is read as "the integration was verified" when it only means "seven headings exist with at least a space of text under each." B documents this, but the verification plan should make the limit a *positive* test (example 8 does this — good) AND the finding text and CLAUDE.md must say "section presence only" so reviewers do not over-trust the green. Sharp question: is a rule that turns red on an omitted section but green on a hollow one worth the new parser surface, versus enforcing the same discipline through the `integration-reviewer` agent that already authors the body?

**3. The new `lane` enum is unverifiable as specified — identical shared-core defect as candidate A.** B's Scope adds the same optional `lane` enum to `brief` and the same lane-dependent rules (verification always its own lane; `test-verification` lane required when >=1 implementation lane). No existing handler constrains a `lane` frontmatter field against an enum (`enum_constraint` covers only `type` and `status`), and B's `## Verification needs` — despite being the larger of the two plans — still tests neither lane-value validity nor adds a rule for it. Concrete failure: `lane: test-verfication` (typo) passes `spec:validate` and the verification lane is silently unrecognized. B adds machine-checking precisely to the integration *body* but leaves the *lane field that drives the whole model* unvalidated. Fix or sharp question: given B's appetite for a second validation rule, why does that appetite stop at the body and not also cover the `lane` enum that every lane rule depends on? Either add a lane-enum check with a bad-value unit test, or state in Verification needs that invalid `lane` values are intentionally unenforced and name the catcher.

**4. Two coverage-handler boundary rows missing (shared with A) — B inherits A's matrix verbatim.** B's `## Verification needs` says the coverage matrix is "the same matrix as candidate A." It therefore inherits A's two omissions: (i) no test that a `draft` integration node integrating both `final` evidences is **uncovered** (the matrix varies evidence/lane completeness, never the integration node's own status), and (ii) no test that coverage is **bounded to this contract's brief set** (a stray `integrates` to an extra brief outside the contract must not satisfy coverage — the analogue of comparison_required's wrong-market test). A handler that forgot the integration-must-be-`final` check, or that didn't bound the brief set, would pass B's listed matrix. Fix: add both rows with their expected findings.

**5. Two rules now interact, but no test exercises a node that trips both, or the ordering claim.** B introduces two handlers and asserts the body rule is "order-independent (no edge dependency)" while the coverage rule must run after `edges-references-resolve`. The plan tests each rule in isolation but never the combined case: a `final` integration that *both* fails the body rule (missing COMBINED-test-run) *and* is partial coverage — does `spec:validate` emit two findings with stable, distinguishable `kind`s so neither masks the other, and is the run still non-zero? Given findings are sorted and de-duplicated by (rule, kind, subject, detail) in `runValidation`, two findings on the same `integration`/`intent` subject from two rules must carry distinct `kind` strings or they read as one problem. Fix: add a fixture that trips both new rules on the same subject and assert two distinctly-`kind`ed findings; and assert the body rule's order-independence empirically (run it before and after `edges-references-resolve` and assert identical output) rather than only claiming it.

**6. Self-dogfooding raises the bar for B specifically and is untested at the failure path.** B's real-tree check notes this PR's own integration node body "must itself satisfy B's section rule (B's own dogfooding)." That is a sharper constraint than A: the PR cannot go green unless its own integration body carries all seven non-empty sections in the exact configured headings. The plan asserts the final green state but not the red-then-green path (author the integration body missing a section, confirm B's rule fails the PR's own graph, then add it) — the one demonstration that the body rule actually fires on a real, non-synthetic node and that the config headings match what a real author writes. This is also where finding 1's three-way drift would first surface. Sharp question: does the plan include a deliberate red dogfood on the PR's own integration body, or only a final green snapshot?

Severity rationale: B closes A's central oracle gap (a concrete improvement on this axis) but trades it for a new parser whose hardest failure (config-vs-agent-vs-CLAUDE.md heading drift producing false-reds) is named in Risks yet not covered by a test in the plan, and inherits the shared lane-enum and coverage-boundary gaps. These are fixable test-plan additions within B's chosen mechanism, not a reason the mechanism cannot work — hence concern, not blocking.

## Critique (reliability-ops)

This critique is on the reliability and operations axis only: partial writes, crash/retry mid-step, idempotency, rollback/recovery, and observability/blast-radius during an incident. B shares A's entire `/integrate` and `/prepare-evidence` runtime flow and the same coverage handler, so findings 1–4 and 6 below are the **same shared-core risks raised against candidate A** and carry over verbatim in substance. B then adds a second handler (`integration_body_sections.ts`) that introduces a new runtime surface — markdown-body parsing inside `spec:validate` — with its own reliability characteristics.

### 1. Shared `/integrate` multi-write step has no crash/retry recovery (carried from the shared core)
As with candidate A: `/integrate` performs a node write + N `integrates` edges + M `touches` edges + a status flip before the terminal `index && validate`, and the contract never specifies idempotent re-run after a crash mid-write. "Creates exactly one integration node" is asserted in prose, not machine-enforced; a retried run after a partial write can author a second integration node, and the coverage rule (existence-only) will not catch the fork. Same fix: pin `/integrate` as re-runnable, detecting and converging an existing `draft` integration rather than authoring a second, and holding the node at `draft` until the full edge set is written and green.

### 2. Shared coverage rule has no uniqueness clause (carried)
Identical to candidate A: the coverage handler is an existence check with no "exactly one live integration per contract" guard, so a botched retry that leaves two `final` integrations (or a `final` plus a stale `draft`) stays green while the graph carries a contradictory release/`includes` target. Same sharp question applies.

### 3. Shared terminal `index && validate && commit-only-on-green` sequence has no abort-recovery contract (carried)
Identical to candidate A: a crash after `spec:index` rewrites generated indexes but before the commit decision leaves a dirty tree, and the contract does not specify how the next run reconciles regenerated indexes plus uncommitted node/edge writes. Same fix: require a clean tree and document the reset path on abort.

### 4. Shared `/prepare-evidence` STOP-and-ask branch has no resume/idempotency semantics (carried)
Identical to candidate A: the STOP gate's ordering relative to evidence write / brief flip / `touches` wiring is unspecified, so resume-after-STOP risks duplicate evidence or duplicate `touches` edges. Same sharp question on re-entrancy.

### 5. The new body-section handler adds markdown-prose parsing inside `spec:validate` — a NEW failure surface that can take the whole gate red or green wrongly (B's defining reliability risk)
B's distinguishing rule (`integration_body_sections.ts`) parses each `integration` node's markdown **body** for required section headings. Every existing handler reads only frontmatter `data` via the loader (confirmed: `loader.ts` exposes structured `data` and a raw `body: string`, and `comparison_required.ts` and peers touch only `data`/edges). B is the first rule to make `spec:validate`'s pass/fail depend on free-text prose. The reliability consequences:
  - **False red blast radius is the entire gate.** `runValidation` collects findings from all rules with no short-circuit, and a single finding makes the run non-zero (confirmed in `validator.ts`). A brittle heading match — a section written `## Combined test run` vs the configured `COMBINED-test-run`, a trailing-space heading, a heading nested under a different level, a CRLF body, an emoji or smart-quote in a heading — produces a **false red that blocks the merge of an otherwise-correct multi-lane change.** Under B, an integration whose combined run genuinely happened can be rejected by CI on a formatting nit, and the operator's only recovery is to re-edit prose until the parser is appeased. That is a new, self-inflicted incident class the codebase does not have today.
  - **False green is equally reachable.** B's own Risk and Acceptance example 8 concede the rule checks presence, not substance: a heading with one sentence under it passes. A fenced code block containing `# COMBINED test run` could satisfy a naive scanner (B flags this as a risk to mitigate, but it is unmitigated until the handler is written and tested). A green body rule that responders **read as proof the combined run happened** is a worse observability outcome than A's honest "not checked," because it manufactures false confidence at incident time.
  - **Dispatch fall-through is a silent-pass failure mode.** `validator.ts` emits an "unknown kind" finding only if the rule's `kind` has no `HANDLERS` entry; if the brief mis-pins the `kind`/handler-filename wiring, the rule could either hard-fail every run or, if mis-registered, never run at all while the rule line sits in `validation-rules.yaml` looking active. B names this risk; the brief must pin the exact `kind`, rule `id`, and handler filename so the body rule cannot silently fail to run, which would erase the very assurance B exists to add.

### 6. B's strongest reliability *gain* must be weighed against its parser fragility, not assumed (observability trade)
B's intended benefit is real on this axis: an integration node missing the COMBINED-test-run section turns `spec:validate` red, giving a durable, queryable machine signal that A lacks (see A's finding 5). For incident response that is a genuinely better artifact — *if* the parser is robust. But the value is bounded by presence-only semantics (Acceptance 8): the signal proves a heading exists, not that the combined run occurred, so a responder who treats green-body-rule as "the integration was sound" is misled. Net on the reliability axis: B converts A's silent agent-trust gap into a machine-checked **presence** signal at the cost of a new prose-parsing failure surface that can both false-red (block good merges) and false-green (manufacture confidence). Sharp question for the brief: does B's body parser strip fenced code, normalize case/whitespace/CRLF, and treat whitespace-only sections as empty *before* the rule ships — and is each of those failure modes a required unit test — so the new red/green surface is trustworthy rather than a new flake source?

### 7. Shared post-coverage drift gap (carried)
Identical to candidate A: nothing specified drives a `final` integration back to `draft` when a lane brief is later superseded or its evidence reworked. B's body rule does not help here — it checks body sections, not whether the integration's coverage still holds against the live brief set.

### Strongest reliability-or-ops argument against approving B as written
B makes `spec:validate`'s pass/fail depend, for the first time, on parsing free-text markdown prose, and a single brittle heading match takes the entire non-short-circuiting gate red. Without a fully specified-and-tested parser (fenced-code stripping, case/whitespace/CRLF normalization, whitespace-only-section handling, pinned dispatch), B trades A's honest "not machine-checked" for a new false-red flake surface that can block correct multi-lane merges — and a false-green presence signal that a responder may over-trust. The reliability gain is real but unbanked until that parser robustness is pinned in the brief.

### Note for graph-maintainer
Appending this critique mutates the graph. The step must end with `pnpm spec:index && pnpm spec:validate` (in this environment, `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`) and must not commit on failure.

## Critique (cost-maintainability)

Reviewing candidate B (`contract-lane-integration-validated-body-7b2e`) on the long-run cost and maintainability axis only.

### Duplication / new surface kept in sync by hand

- **B introduces the first markdown-body parser into a validator that has never had one, and that is a permanent new maintenance category.** Confirmed against the tree: every existing handler reads frontmatter `node.data`; the *only* code that touches `node.body` is `required_fields.ts`, and it does nothing but `body.trim() === ""`. B's `integration_body_sections.ts` would be the sole handler that parses prose structure (headings, section boundaries, fenced-code stripping, whitespace-only detection). Concrete cost: every future change to how integration bodies are written — a heading renamed, a section reordered, a sub-heading added, switching `##` to `###`, an example body that legitimately contains a `## COMBINED test run` line inside a fenced block — is now a potential false red that the *coverage* rule (and the rest of the validator) never had to care about. The codebase acquires a markdown-parsing dependency surface forever, for one node type.
- **The required-section list is duplicated between `validation-rules.yaml` config and the agent prompt / CLAUDE.md, and now they can disagree in a way that hard-fails CI.** Under A a drift between convention and agent is silent; under B it is *louder but more disruptive*: if the agent prompt and the rule's configured heading list fall out of sync (agent writes "Combined risk", rule expects "Risk (combined)"), every integration node turns red and the graph cannot merge until someone reconciles two files. B presents the config-list as auditable (true) but does not account for the new tight coupling between freeform agent prose and an exact-match rule param — a coupling that did not exist for any other node body.

### Drift / rot a future maintainer inherits

- **B establishes a precedent the codebase explicitly disavows today, and the next maintainer must re-litigate it.** CLAUDE.md states in exactly one place (the comparison section) that a node body's structure "is a command/graph-maintainer convention, not a validation rule," and `node-types.yaml` enforces only `requires_body` for every body-bearing type. B makes `integration` the lone exception. The rot: the next person adding a structured body (a richer `evidence`, a sectioned `decision`) faces an inconsistent codebase — one node type's body is CI-validated, every other is convention — and must either propagate the body-rule pattern (multiplying the markdown-parser surface across types) or defend why `integration` is special yet again. B documents the divergence in CLAUDE.md, which helps, but a documented inconsistency is still an inconsistency every future body-shape decision must reason around.
- **The exact-match heading semantics are a brittle invariant that decays as humans edit bodies.** Markdown bodies are the most human-edited, least-schema'd artifact in the graph. Pinning CI-merge-ability to exact heading strings means routine prose maintenance (capitalisation, punctuation, pluralisation, a maintainer who writes "Combined test run" instead of "COMBINED test run") can red the whole graph. B's mitigation ("documented config list with exact match semantics") is itself a standing source of false reds that someone must triage on every integration.

### Ongoing operational / cognitive cost not accounted for

- **B doubles the distinguishing-rule maintenance load for a guarantee it admits is form, not substance.** B adds a *second* rule + handler + full test matrix (six-plus body-parsing cases: missing, present-but-empty, in-code-fence, case/whitespace variants, non-integration ignored) on top of the shared coverage handler. B itself concedes the rule proves only that a heading exists with *some* content — "a present COMBINED-test-run section does not prove tests actually ran." So the recurring cost (maintaining a markdown parser, triaging its false reds, keeping the heading config synced with agent prose) buys a guarantee that still requires the same human read A requires to confirm the section is *true*. The cost-to-assurance ratio is the core maintainability question B must answer.
- **B's own dogfooding makes this PR's integration body a merge-blocker for prose reasons.** B notes its own integration node body must satisfy the section rule. Concrete failure: this very PR cannot go green until its hand-written integration body matches the exact configured headings — a prose-formatting gate on the change that introduces the gate. That is a real, if one-time, operational cost B should name as a bootstrap risk.

### Single strongest cost-or-maintainability argument against approving B as written

B pays a permanent, novel maintenance cost — the codebase's first and only markdown-body structure parser, exact-heading-match brittleness, a second hard-fail rule coupled to freeform agent prose, and a deliberate break of the "bodies are convention" precedent that every future body-shape decision must navigate — in exchange for a guarantee B itself concedes is presence-only and does not prove the integration was sound. The standing risk is a steady stream of false reds from routine prose edits that block merges on formatting rather than on coverage being wrong.

### Sharpest question for selection

Given B concedes the body rule proves section *presence* not *substance*, and that no other node body in the graph is structurally validated, what is the long-run maintenance budget for the markdown parser and its false-red triage, and is that budget justified by a check that still requires the same human read A needs to confirm the section is real?

## Critique (release)

Reviewed on the release and rollout axis only (migration ordering, backward-compatibility / in-flight state, staged-rollout / flag / rollback paths). Body-validation design merits, doctrine, and parser correctness are out of my lane except where they create a rollout hazard.

**1. B inherits A's ungated-coverage-rule rollout hazard in full. (blocking question.)** B's coverage-and-coherence rule is the *same* core as A's and, like A's, carries **no dated `_from` cutoff** — unlike the `comparison_required.ts` it is modelled on, which explicitly grandfathers any selected contract created before `comparison_required_from`. On merge it retroactively judges every `selects`-edged intent already in the graph (the incoming index shows six live selected contracts whose intents are `addressed`). Any pre-existing covered-but-not-`addressed` or `addressed`-but-not-final-evidenced intent turns main red on the merge of this PR, with no rollback short of reverting the whole migration. Everything said for candidate A's point 1 applies identically to B; the body rule does not change it. Fix: add a `coverage_coherence_from` cutoff mirroring `comparison_required_from`, **or** carry a committed pre-merge audit of all six existing selected intents as an explicit acceptance step. **Sharp question:** same as A — which existing selected intents have been confirmed coherent under the new bidirectional rule, and is the remedy backfill-in-PR or a cutoff?

**2. B's body rule is a NEW, stricter gate that fires on every `integration` node the instant it merges — and the first node it judges is this PR's own. (blocking.)** B adds a second rule that requires seven named sections, each present and non-empty, in *every* `integration`-type node's body. This is a release-specific hazard distinct from the coverage rule: the section-presence rule is the **dogfooding tripwire** for this very PR. This Class 3 contract's own completion requires writing a `final` integration node (Verification needs explicitly calls this "B's own dogfooding"). So at merge, B's body rule must pass against B's own hand-authored integration body — and the rule is enforced by a **markdown-body parser the codebase does not have today** (every existing handler reads frontmatter `data`, not body prose, as B's own Trade-offs admit). If the parser's heading-match semantics (case, whitespace, fenced-code handling) do not exactly match the headings the integration-reviewer agent emitted in this PR's own node, the PR's own validate goes red and the migration cannot commit ("commit only on green"). That is a chicken-and-egg rollout coupling: the rule and the first body it must accept ship in the same commit, and a mismatch is a self-block. Fix: the brief must (a) pin the exact heading strings and match semantics, (b) require the integration-reviewer agent template and the rule's configured heading list to be authored from a *single shared source* so they cannot drift, and (c) sequence the PR so the rule is registered only after this PR's own integration body is confirmed parseable against it. Without that, B has a strictly higher chance than A of a red-on-merge self-block.

**3. Two new gates, two new handlers, plus a net-new parser = the largest migration surface, and the staged-rollout question is doubled. (concern.)** From a release standpoint, B ships *two* irreversible gating changes in one Class 3 PR rather than one. Each is a one-way door (no cutoff, no flag). If either rule proves too aggressive against the existing graph post-merge, there is no per-rule disable lever short of editing `validation-rules.yaml` in a follow-up PR — and removing a freshly-landed gate is itself a graph change that must pass review. The body rule in particular has *no graph-shape precondition* to grandfather behind, so it is even harder to stage than the coverage rule. Fix: if both rules must land together, state the rollback procedure explicitly (which rule to remove first, and that removal is a clean follow-up PR not a revert), and consider landing the body rule behind its own dated/flagged enablement so the coverage core — the headline acceptance — is not held hostage to body-parser teething. The contract should not let the higher-risk body rule gate the merge of the lower-risk, higher-value coverage rule.

**4. Same in-flight-state and ordering surface as A, plus the body rule has no edge-ordering dependency but DOES have a dispatch-pinning dependency. (concern.)** Like A, B alters `/prepare-evidence` lifecycle semantics and assumes no mid-flight multi-lane work exists at merge (true today, but unstated as the safety assumption). Additionally, B's Risks correctly flag that the body rule's `kind` string must match a `HANDLERS` map key or it "falls through to an unknown-kind finding." That is a real rollout footgun: a typo'd `kind` in `validation-rules.yaml` does not silently no-op — per the codebase pattern it produces a finding, turning the PR's own validate red. Good that B names it; the brief must make the dispatch-pinning check (Verification needs item) a hard gate, not advisory, since it is on the critical merge path. Fix: assert in CI/tests that both new `kind` strings resolve in the `HANDLERS` map *before* the rules are appended to `validation-rules.yaml`.

**5. d4f2 retirement — identical to A, same one-way-door note. (concern.)** B drives `intent-status-coherence-d4f2` to `addressed` by behaviourally landing its rule and abandoning the `indexes/unresolved.yaml` report path, with no fallback to reporting if hard-fail proves too aggressive. The release note is the same as candidate A's point 3: record that the report-path abandonment is intentional and irreversible, and that the remedy for over-aggression is a dated cutoff (point 1), not a revert to reporting.

**Strongest release argument against approving B as written:** B ships **two ungated, irreversible gating rules in one Class 3 migration** — the same cutoff-less coverage rule as A *plus* a net-new section-presence body rule enforced by a parser the codebase has never had, whose very first subject is this PR's own integration node. That couples the merge of the high-value coverage core to the teething risk of a brand-new markdown parser passing a hand-authored body in the same commit: a heading-match or fenced-code mismatch turns the migration's own validate red with no rollback but reverting everything. The body rule should at minimum be staged or flagged so it cannot self-block the coverage core's merge.

**Mutation reminder:** appending this critique mutates the graph. The step must end with `pnpm spec:index && pnpm spec:validate` (or, per the env memo, `node_modules/.bin/tsx tools/spec.ts index && … validate`) and must not commit on a non-green validate.
