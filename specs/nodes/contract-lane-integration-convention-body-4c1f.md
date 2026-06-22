---
id: contract-lane-integration-convention-body-4c1f
type: contract
title: Lane model and integration node (integration body by agent + convention)
status: approved
created: 2026-06-19
class: 3
---

This intent (`intent-lane-model-integration-a1f7`) is itself multi-surface — it
migrates the schema (`specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`),
extends the validator (`tools/validator.ts` + a new `tools/handlers/*.ts`), adds two
agents and three commands under `.claude/`, and edits `CLAUDE.md`, all in one PR.
Under its own routing table that is a **Class 3** change, which is why this proposal
market carries ≥2 candidate contracts (this is candidate **A** of two). The two
candidates share an identical common core — the lane enum, the `integration` node and
`integrates` edge, the two agents, the three commands and the `/prepare-evidence`
update, the CLAUDE.md lane catalog and four rules, and one new coverage-and-coherence
handler — and differ on exactly one axis: **whether `spec:validate` machine-checks the
`integration` node's body, or leaves body quality to the `integration-reviewer` agent
plus a CLAUDE.md convention.** Candidate A takes the convention path: **no body-structure
validation rule**, one new coverage handler only.

## Problem interpretation

The intent asks for a minimal lane model, a contract-level `integration` artifact for
multi-lane changes, evidence-to-capability wiring, and a validator extension that lands
and generalises the single-lane status-coherence rule that
`intent-status-coherence-d4f2` (class 2, open) specifies but which **does not exist in
code today**. That coherence rule — `evidence(final) —evidences→ brief —decomposes→
contract —proposes→ intent` with a `decision —selects→ contract`, flagged in both
directions — is the kernel this contract generalises from "one brief" to "every brief,
combined by an integration node." Because this contract lands and generalises d4f2's
rule, **the selecting `decision` records d4f2 as subsumed by this work**, and d4f2
moves `open → addressed` once the rule lands with final evidence. d4f2 is an `intent`
and so cannot be `supersede`d (that edge is same-type→same-type, and d4f2's successor
would have to be another intent); nor is a new intent captured for it — it already
exists. It is simply driven to `addressed` by the coherence rule this contract delivers.

The irreducible common core (identical across candidates A and B):

- **Schema.** In `specs/schema/node-types.yaml`, add an optional `lane` enum to node
  type `brief` with the eight values `product-spec | domain-backend | frontend-ui |
  data-migration | api-integration | test-verification | observability-release |
  docs-spec`; an unset `lane` is an unlaned single brief and is allowed. Add node type
  `integration` with `required_fields [id, type, title, status, created]`,
  `status_values [draft, final]`, `requires_body: true`. In
  `specs/schema/edge-types.yaml`, add edge type `integrates` with `source: integration`,
  `target: evidence`.
- **Agents.** `.claude/agents/integration-reviewer.md` — judgement-only, the same shape
  as the contract-reviewer and the specialist critics: given the final per-lane evidence
  for a contract, it judges whether they combine to satisfy the approved contract,
  surfaces conflicts and residual risk, applies the scope-integrity rules (CLAUDE.md
  rule 5), authors the `integration`-node body, and invokes graph-maintainer to write the
  node and edges. `.claude/agents/test-writer.md` — writes or extends a brief's tests,
  and is **never the same invocation that implemented the code under test.**
- **Commands.** `.claude/commands/decompose-lanes.md` (`/decompose-lanes <contract-id>
  <lane-list>`) creates one brief per named lane, each carrying its `lane` field and a
  `decomposes` edge to the contract, states the integration expectation, and includes a
  `test-verification` lane whenever there is ≥1 implementation lane; `/write-brief`
  remains for single-brief contracts. `.claude/commands/write-tests.md` (`/write-tests
  <brief-id>`) invokes test-writer against a test-verification brief, independent of
  `/implement-brief`. `.claude/commands/integrate.md` (`/integrate <contract-id>`)
  invokes integration-reviewer over the final per-lane evidence, creates exactly one
  `integration` node with `integrates` edges to each lane's final evidence, adds
  `touches` edges to the capabilities the integrated change falls under, applies
  scope-integrity, sets the integration to `final` only when every lane is covered, then
  runs index + validate and commits only on green.
- **`/prepare-evidence` update** (`.claude/commands/prepare-evidence.md`): (a) for a
  laned brief, set the brief to `implemented` but leave the intent `open` — the intent
  becomes `addressed` only via `/integrate`; an unlaned single brief is unchanged. (b)
  capability wiring: map the change's diff to capability `paths[]` globs read from
  `specs/indexes/by-type.yaml`, add `touches` edges from the new evidence to every
  capability the change falls under, and **STOP and ask the human** if the diff touches
  paths no capability owns (extend a capability, create one, or confirm intentionally
  unowned).
- **CLAUDE.md.** The eight-lane catalog and what each owns, plus four rules: (1) Class 3
  multi-surface work decomposes into lanes, Class 2 may; (2) verification is always its
  own lane for any multi-lane work, owned by test-writer, never an implementation lane;
  (3) a single-brief contract skips integration (its lone final evidence completes the
  contract), a multi-lane change is completed by a final `integration` node that is the
  contract's coverage artifact and the release's `includes` target; (4) every evidence
  records `touches` edges to the capabilities its change falls under, and a diff touching
  unowned paths is a coverage gap resolved in the same PR.
- **Coverage + coherence rule.** One new handler in `tools/handlers/` registered in the
  `HANDLERS` map in `tools/validator.ts` and appended to `specs/schema/validation-rules.yaml`,
  modelled on `tools/handlers/comparison_required.ts`'s set-based coverage traversal. It
  lands and generalises d4f2's single-lane coherence rule. See Scope for its exact shape
  and the status-safety trap it must avoid.

What distinguishes **candidate A**: integration-node body quality is enforced by the
`integration-reviewer` agent plus a CLAUDE.md convention describing the required body
sections — there is **no body-structure validation rule**. This deliberately follows the
codebase's own established precedent: CLAUDE.md already states that the `comparison`
node's body structure "is a command/graph-maintainer convention, not a validation rule,"
and `node-types.yaml` enforces only `requires_body: true` (non-empty) for every
body-bearing type, never section presence. A is the **smallest faithful validator
surface**: exactly one new coverage handler, consistent with "node bodies are
agent/convention, not validated." It contrasts with candidate B, which adds a *second*
rule that machine-checks the integration body's sections for presence.

## Scope

- **`specs/schema/node-types.yaml`** — add optional `lane` enum (8 values, unset
  allowed) to `brief`; add node type `integration` (`required_fields [id, type, title,
  status, created]`, `status_values [draft, final]`, `requires_body: true`). The
  existing `nodes-status-in-enum` handler then constrains `integration.status` to
  `{draft, final}` for free, and `nodes-required-fields` + `requires_body` cover
  presence and a non-empty body — no new rule needed for those.
- **`specs/schema/edge-types.yaml`** — add `integrates` (`source: integration`,
  `target: evidence`). `edges-endpoint-types` enforces the endpoint types for free.
- **`tools/handlers/*.ts` (one new file, working name `coverage_coherence.ts`),
  registered in the `HANDLERS` map in `tools/validator.ts`, appended to
  `specs/schema/validation-rules.yaml`** — a pure `(rule, spec) => Finding[]` graph-shape
  handler modelled on `comparison_required.ts`. It encodes, **scoped to `selects`-edged
  intents only**:
  - *single-brief contract* covered ⟺ exactly one `final` evidence `evidences` its lone
    live brief;
  - *multi-brief contract* covered ⟺ a `final` `integration` node `integrates` a `final`
    evidence for **every** live brief that `decomposes` the contract (a set/coverage
    check, exactly like `comparison_required`'s "every live candidate covered");
  - an intent is `addressed` ⟺ its `selects`-edged contract is covered — **flagged in
    both directions** (addressed-but-uncovered, and covered-but-not-addressed), the same
    bidirectional shape d4f2 specifies;
  - a multi-brief contract treated as covered **without** a `final` `integration` node ⇒
    a finding.
  The handler reads `node.data["status"]` and counts **only non-superseded briefs and
  `final` evidence**; it resolves edge endpoints via `nodesById` and defensively skips
  unresolved endpoints (`edges-references-resolve` reports but does not remove them). It
  is listed **after `edges-references-resolve`** in `validation-rules.yaml`. This LANDS
  and GENERALISES the single-lane coherence rule that `intent-status-coherence-d4f2`
  specifies and which is **absent from code today**.
- **`.claude/agents/`** — add `integration-reviewer.md` and `test-writer.md` (shapes per
  Problem interpretation).
- **`.claude/commands/`** — add `decompose-lanes.md`, `write-tests.md`, `integrate.md`;
  update `prepare-evidence.md` (laned-brief status handling + capability wiring with the
  STOP-and-ask branch).
- **`CLAUDE.md`** — lane catalog + four rules per Problem interpretation.
- **Capability-recursion resolution (in-scope, this PR).** The four existing
  capabilities own `specs/schema/**` (`capability-spec-schema-2c3d`), `tools/**`
  (`capability-spec-tooling-1a2b`), `.claude/{commands,agents}/**`
  (`capability-lifecycle-commands-4f5a`), and `.github/**`
  (`capability-ci-enforcement-3e4f`) — but **not** `CLAUDE.md`, `tests/`, or
  `specs/{nodes,graph,indexes}/`. This change's **own** evidence touches `CLAUDE.md`
  **and** `tests/`, so its `/prepare-evidence` would STOP-and-ask. Resolve in-scope:
  extend `capability-spec-tooling-1a2b`'s `paths` (currently `[tools/**]`) to add
  `CLAUDE.md` and `tests/**`, and record `specs/{nodes,graph,indexes}/**` as
  **intentionally unowned** via the human-confirm branch of the new `/prepare-evidence`
  flow (graph data, not a path a capability gates).

## Non-scope

- **No integration-body validation rule.** Body quality is the
  `integration-reviewer` agent's job plus a CLAUDE.md convention; `spec:validate` checks
  only `requires_body` (non-empty) for the `integration` type. This is candidate A's
  defining choice and is candidate B's mechanism, deliberately not adopted here. Section
  presence is NOT machine-checked.
- **No second validator rule of any kind** beyond the one coverage-and-coherence
  handler. The whole new validate surface is one rule + one handler + its tests.
- **No new CI workflow.** The new rule rides the existing `spec-validate.yml` that
  already runs `spec:validate`.
- **No supersede / new intent for d4f2.** d4f2 is driven to `addressed` by the rule this
  contract lands; it is an intent and cannot be superseded, and capturing a new intent
  for already-specified scope would be duplication.
- **No release-node / `includes`-edge schema work.** CLAUDE.md rule (3) names the
  integration node as "the release's `includes` target," but the release node type and
  `includes` edge are pre-existing/out-of-band; this contract only makes the integration
  node the *thing* a release would point at.
- **No retire/supersede changes** to existing decision, contract, or evidence lifecycle
  beyond what scope-integrity documents.

## Trade-offs

- **+** Smallest faithful validator surface — exactly **one** new coverage handler. The
  blast radius is a single small, unit-testable pure function.
- **+** Consistent with the codebase's established precedent that **node bodies are
  agent/convention, not validated**: CLAUDE.md already says the `comparison` body
  structure is "a command/graph-maintainer convention, not a validation rule," and
  `node-types.yaml` enforces only `requires_body`. A introduces no new doctrine.
- **+** The coverage-and-coherence rule still makes the headline acceptance machine-real:
  a two-brief contract completed without a final integration node turns `spec:validate`
  **red** (acceptance L4) regardless of the body question. The distinguishing axis does
  not weaken any of L1–L4.
- **+** Faithful to the intent's "extend spec:validate … no new workflow" framing: the
  one new rule rides the CI that already runs.
- **−** Integration-body quality is **not** machine-checked. A thin or incomplete
  integration body — e.g. one that omits the COMBINED-test-run section the intent
  requires — passes `spec:validate` as long as the structural facts (`integrates` edges
  to `final` evidence for every live brief, integration `final`) hold. A relies on
  **agent trust** for body completeness; the gap B closes is left open here.
- **−** "Was the integrated result actually tested as a whole?" is answerable only by
  reading the body, not by CI. The signal that the combined test run happened is
  human/agent-attested, not enforced.

## Risks

- **Status-blind coverage count (primary trap — a prior critique caught exactly this on
  the quorum rule).** If the new handler counts briefs or evidence **status-blind**, a
  superseded brief or a `draft` (non-final) evidence could be mistaken for coverage, and
  the rule would wave through an intent that is not really done — or conversely flag one
  that is. **Mitigation:** scope the rule to `selects`-edged intents; count **only
  non-superseded briefs** as the live brief set and **only `final` evidence** as
  covering evidence (mirror `comparison_required.ts`, which excludes `superseded`
  targets from its covered set and counts a target only if it is live). Unit-test the
  boundary: a two-brief contract with one `final` + one `draft` evidence and a `final`
  integration is **uncovered** (finding); both `final` + a `final` integration is covered
  (no finding).
- **Rule must EXIT NON-ZERO, not merely report.** d4f2's *origin text* mentions emitting
  to `indexes/unresolved.yaml`, but acceptance L4 requires `spec:validate` to **exit
  non-zero** on a two-brief contract completed without integration. A report/index write
  alone would not fail CI. **Mitigation:** implement as a plain validate `Finding[]`
  handler in the `HANDLERS` registry (like every rule in `tools/validator.ts`); the
  presence of any finding is what makes the run non-zero. The d4f2 origin's
  `unresolved.yaml` routing is **generalised and superseded in behaviour** by this
  hard-fail handler — captured here so the reviewer does not read it as a regression.
- **Rule ordering / unresolved endpoints.** Traversing `evidences`/`decomposes`/
  `proposes`/`selects`/`integrates` chains can hit a dangling endpoint. **Mitigation:**
  list the rule **after `edges-references-resolve`** in `validation-rules.yaml`, and
  defensively skip any edge whose endpoint is absent from `nodesById` (ordering is
  reassurance; the defensive skip is the real safeguard — `references_resolve` reports
  but does not remove dangling endpoints).
- **Agent-trust gap on body completeness (A's defining risk).** Because the body is not
  machine-checked, a careless integration run could ship a `final` integration whose body
  omits the joint contract-compliance verdict or the combined test run. **Mitigation:**
  the `integration-reviewer` agent definition pins the required body sections, `/integrate`
  refuses to set `final` until every lane is covered, and the CLAUDE.md convention names
  the sections — but this is **process/agent trust, not CI**. The reviewer must weigh
  this against candidate B, which closes it with a section-presence rule. (Candidate A
  states the gap honestly; it does not claim to close it.)
- **Capability-recursion regression.** Extending `capability-spec-tooling-1a2b` to own
  `CLAUDE.md` + `tests/**` must not accidentally pull unrelated paths into "sensitive"
  gating. **Mitigation:** `sensitive_paths` (in `validation-rules.yaml`) stays
  `specs/schema/**` only; widening a capability's `paths` changes drift/`touches`
  ownership, not the sensitive-path gate.

## Acceptance examples

1. **(L1) Two-lane contract cannot mark its intent `addressed` until a final integration
   integrates both lanes.** A contract is decomposed via `/decompose-lanes` into two lane
   briefs (e.g. `domain-backend` + `test-verification`), each with a `decomposes` edge.
   Each lane reaches `final` evidence. With **no** `integration` node — or with a `draft`
   integration, or a `final` integration that `integrates` only one lane's evidence — the
   intent set to `addressed` makes `spec:validate` **fail** with a finding like `intent
   <id> is addressed but its selected multi-brief contract <id> is not covered: no final
   integration integrates final evidence for live brief <brief-id>`. Adding the `final`
   integration with `integrates` edges to **both** lanes' `final` evidence flips it green.
2. **(L2) Single-brief contract completes with no integration node.** A contract
   decomposed via `/write-brief` into one unlaned brief, with exactly one `final`
   evidence `evidences`-ing it and the intent `addressed`, passes `spec:validate` green
   with **no** `integration` node — the single-brief branch treats one `final` evidence
   on the lone live brief as covered. Introducing a *second* live brief without a final
   integration would (per example 1) turn it red.
3. **(L3) `/prepare-evidence` on a change touching an unowned path stops and asks.** A
   diff whose files map (via `by-type.yaml` capability `paths[]`) to no capability — and,
   concretely, **this contract's own diff**, which touches `CLAUDE.md` and `tests/` —
   makes `/prepare-evidence` **STOP and ask the human** rather than silently write
   evidence. In this PR the resolution is recorded: `capability-spec-tooling-1a2b`'s
   `paths` gains `CLAUDE.md` + `tests/**`, and `specs/{nodes,graph,indexes}/**` is
   confirmed intentionally unowned.
4. **(L4) `spec:validate` exits non-zero on a two-brief contract completed without
   integration.** Construct a contract with two live briefs that `decompose` it, a
   `final` evidence for each, and the intent `addressed`, but **no** `final` integration
   node. `node_modules/.bin/tsx tools/spec.ts validate` exits **non-zero** on the new
   coverage rule (a `Finding`, not a report line). This is the headline acceptance,
   delivered identically by both candidates.
5. **(d4f2 subsumption — generalisation lands.)** A *single-lane* contract (one brief,
   one `final` evidence, intent `addressed`) is green, and the same contract with the
   evidence still `draft` and the intent `addressed` is **red** — exactly d4f2's
   single-lane bidirectional rule, now a live special case of the generalised handler.
   The selecting `decision` for this contract records d4f2 as subsumed; once this rule
   lands with final evidence, d4f2 moves `open → addressed`.
6. **(Status-safety — the trap.)** A two-brief contract whose first brief was
   **superseded** (replaced by a corrected brief per CLAUDE.md rule 3) is judged against
   its **live** brief set only; the superseded brief does not demand its own covering
   evidence. A `draft` (non-`final`) evidence never counts as coverage. Status-blind
   counting — the hole a prior critique caught on the quorum rule — is explicitly
   avoided.

## Verification needs

- **`node --test`** over the new coverage-and-coherence handler: synthetic graphs
  asserting (a) single-brief + one `final` evidence + `addressed` → no finding; (b)
  single-brief + `draft` evidence + `addressed` → one finding (both directions exercised);
  (c) two-brief + `final` integration integrating both `final` evidences + `addressed` →
  no finding; (d) two-brief + no integration + `addressed` → finding (L4); (e) two-brief
  + `final` integration integrating only one lane → finding; (f) a **superseded** brief
  excluded from the live set; (g) a `draft` evidence not counted as coverage; (h) an
  unresolved endpoint skipped, not thrown; (i) covered-but-not-`addressed` → finding.
- **Real-tree green check:** `node_modules/.bin/tsx tools/spec.ts validate` green on the
  actual post-migration graph, including this PR's own evidence/integration wiring and the
  extended `capability-spec-tooling-1a2b` paths.
- **Ordering check:** assert the new rule is listed **after `edges-references-resolve`**
  in `validation-rules.yaml`.
- **Schema checks:** an `integration` node with `status: review` (not in `{draft,
  final}`) fails `nodes-status-in-enum`; an `integration` with an empty body fails
  `requires_body`; an `integrates` edge from a non-`integration` source or to a
  non-`evidence` target fails `edges-endpoint-types`. (These come free from existing
  handlers — confirm, do not re-implement.)
- **No body-rule check:** confirm an `integration` node with a non-empty but
  **section-incomplete** body (e.g. missing the COMBINED-test-run heading) **passes**
  `spec:validate` under candidate A — the explicit demonstration of A's agent-trust gap
  (and the exact case candidate B turns red).
- **CI:** the new rule is picked up by `spec-validate.yml` with no workflow edit; the
  mutating step ends with `node_modules/.bin/tsx tools/spec.ts index && … validate` and
  must not commit on failure.

## Critique (spec)

Reviewed from the spec axis only, against the actual schema, the `comparison_required.ts` handler this contract models on, and the live edge set. Findings, sharpest first:

1. **d4f2 cannot be "driven to `addressed`" by the rule this contract describes — the subsumption claim is internally contradictory.** The contract scopes the coverage-and-coherence handler "to `selects`-edged intents only" (Scope, and Risks: "scope the rule to `selects`-edged intents") and reaches an intent only by walking `…—proposes→ intent` from a `decision —selects→ contract`. But `intent-status-coherence-d4f2` has **no incoming edges at all** in the live graph (`incoming.yaml` lists nothing under it; no contract `proposes` it, no `decision` selects anything for it). A rule that fires only on `selects`-edged intents therefore **structurally skips d4f2** and can never set it `addressed`. Problem-interpretation and Non-scope both assert "d4f2 is driven to `addressed` by the rule this contract lands" — that is not achievable by the rule as scoped. **Fix / sharp question:** either (a) state explicitly that d4f2's `open → addressed` transition is a manual graph edit recorded in the selecting `decision`, not a consequence of the rule firing on d4f2; or (b) explain what edge would ever make d4f2 `selects`-reachable. As written, the contract claims a mechanical effect the mechanism cannot produce.

2. **The `/integrate` `touches`-from-integration behaviour collides with the existing `touches` edge-type source constraint, which the contract leans on as "free."** Scope says `/integrate` "adds `touches` edges to the capabilities the integrated change falls under," and acceptance L3 routes capability wiring through the integration step. But `edge-types.yaml` declares `touches` as `source: evidence, target: capability`, and every live `touches` edge has an `evidence` source. The contract asserts `edges-endpoint-types` "enforces the endpoint types for free" for `integrates` — but if `/integrate` writes a `touches` edge **from the `integration` node**, that same handler turns the graph **red** (`requires source.type=evidence, got integration`). **Fix / sharp question:** state explicitly whether `touches` edges are authored from the per-lane **evidence** nodes (consistent with the existing source rule and with `/prepare-evidence` already owning capability wiring) or from the integration node (which would require widening the `touches` source type — schema work this contract's Non-scope does not list). Right now the same contract both relies on the `evidence`-sourced `touches` rule and describes `/integrate` adding `touches` edges, without reconciling the two.

3. **`requires_body: true` plus this contract's convention choice means an `integration` node with a one-character body is structurally complete.** Scope and Non-scope correctly note that `requires_body` only checks non-empty, and that section presence is deliberately not validated. The contract is honest about the agent-trust gap on *missing sections*; the residual spec concern is narrower and worth naming: because the **coverage rule** keys an integration as "covering" purely on the structural facts (`integrates` edges to `final` evidence for every live brief, status `final`), a `final` integration with a body of literally `"x"` passes both `requires_body` and the coverage rule. **Sharp question:** is `/integrate`'s refusal-to-set-`final`-until-every-lane-covered the *only* thing standing between a stub body and a green graph? If so, say in the contract that body substance is entirely process-gated, since the validator cannot distinguish a real integration body from a placeholder one.

4. **"d4f2 origin's `unresolved.yaml` routing is generalised and superseded in behaviour" understates a real spec divergence the rule must own.** d4f2's body (Reporting + Considerations) explicitly requires violations to be **distinguishable in `indexes/unresolved.yaml`** from unresolved-edge findings, and warns against "mixing the two classes into one undifferentiated list." This contract instead routes them as `Finding[]` (a hard fail). That is a defensible upgrade, but it means the rule this contract lands does **not** satisfy d4f2's stated reporting contract — another reason the bald "d4f2 → addressed" claim (finding 1) is shaky: the delivered rule changes d4f2's own acceptance, not just generalises it. **Fix:** record that the selecting decision must note d4f2's reporting requirement is deliberately replaced, so a future reader does not treat the `unresolved.yaml`/distinguishability requirement as an unmet obligation.

None of these touch the headline L4 acceptance, which the coverage rule does make machine-real; they are about claims the contract makes beyond L1–L4 (the d4f2 subsumption and the `touches` wiring) that the spec mechanism does not actually deliver as stated.

## Critique (product)

**User problem the intent states.** The intent's user problem is that the graph can *silently claim a multi-lane change is done* when it isn't: today `status` is advisory, an intent can be flipped to `addressed` before any integrated whole exists, and there is no contract-level artifact attesting the combined result was tested against the whole contract. The user is the human (or release) trusting the graph's "done" signal. Candidate A solves the *coverage* half of this faithfully — a two-brief contract cannot reach `addressed` without a `final` integration node integrating final evidence for every live brief (L1, L4), and that turns CI red. On the coverage axis A solves the real problem, not a proxy.

**Where A solves a cheaper proxy than the intent's stated value.** The intent is explicit that the integration body exists *because* "this catches defects present in no single lane" — the load-bearing user value is the COMBINED test run and the joint contract-compliance verdict, not the existence of an integration node. A's coverage rule proves a `final` integration node *exists and points at the right evidence*; it does not prove the integration body contains the combined-test-run section at all. So A makes machine-true a strictly cheaper proposition ("an integration artifact is present and wired") than the intent's stated value ("the integrated whole was actually verified as a whole"). A names this gap honestly (Trade-offs, Risks — "agent-trust gap"), which is to its credit, but from the product axis the consequence stands: A's green signal answers "is there an integration node?" and a user will *read* it as "was the combined change verified?" The risk is a confident-looking green that overstates what was checked.

**Unstated user / use-case A silently assumes.** A assumes the actor who benefits from the integration body is an *agent or human who reads the body* — not the downstream consumer (the release, the next contributor, the auditor) who trusts the green check *without reading the body*. For that second user — the actual beneficiary of a mechanical gate — A delivers nothing beyond "a non-empty body exists." Concrete failure scenario: a hurried `/integrate` run produces a `final` integration whose body is a one-line "lanes combined, looks fine," omitting the combined-test-run and contract-compliance sections entirely; `spec:validate` is green; a release node later `includes` this integration as its coverage artifact; the multi-lane defect the intent specifically wanted caught ships, and the graph's permanent record shows green. The intent's headline rationale ("this catches defects present in no single lane") is exactly the value not protected.

**Value claim that is not falsifiable as written.** A's implicit product claim is "multi-lane changes are now verified as a whole before they're marked done." After shipping A, how would we know that worked? We cannot, from the graph: a green tree is consistent with both a rigorously-tested integration and a hollow one. The only falsifiable claim A actually earns is the narrower "a multi-lane contract cannot be marked addressed without a wired integration node" — which IS testable (L1/L4) and which A should be read as claiming, *not* the broader verification claim. Sharp question for selection: is the intent's value met by "an integration node is present and wired," or does the intent require the *content* of that node to be a gate? A's Non-scope answers "present and wired is enough; content is agent-trusted" — the reviewer must decide whether that reading is faithful to an intent that spends most of its integration paragraph specifying body *content*.

**Shared product concerns A inherits (not distinguishing, but on my axis).**
- *d4f2 driven to `addressed` without its own user-facing acceptance.* A claims it subsumes `intent-status-coherence-d4f2` and drives it to `addressed` once the rule lands. But d4f2 carries a specific user-facing requirement A does not honor: its "Considerations" section demands the status-coherence findings stay *distinguishable* from the existing `unresolved.yaml` edge-endpoint findings (tag with `kind`/`category` or emit to a separate report). A reframes d4f2's reporting as a hard-fail `Finding[]` and calls the `unresolved.yaml` routing "behaviourally superseded." That may be defensible, but from the product axis it silently drops d4f2's stated user need (operators being able to tell *which* class of violation fired). Sharp question: when this new rule fires, does the operator see a message that distinguishes "intent addressed but uncovered" from a dangling-edge finding — or just one more red line? If the latter, d4f2's actual value is not delivered, only its mechanism, and marking d4f2 `addressed` overstates completion.
- *Lifecycle complexity shifts cost onto the contributor with no opt-out story.* The new laned path (`/decompose-lanes`, `/write-tests`, `/integrate`, the laned-brief `implemented`-but-intent-`open` state) is mandatory for Class 3 multi-surface work. The intent preserves the single-brief escape hatch, and A faithfully keeps it. But A states no user-facing guidance for the *misclassification* case: a contributor who decomposes into lanes and then discovers it was really single-surface now has a multi-brief contract that the coverage rule will hold `open` until a `final` integration exists — with no documented cheap exit. Concrete scenario: a change is lane-decomposed, one lane turns out empty, and the contributor is now forced to either supersede a brief or author a ceremonial integration node for what is effectively single-lane work. Fix/question: should A's `/decompose-lanes` or `/integrate` doc state the recovery path when a lane collapses, so the laned lifecycle doesn't trap a contributor in integration ceremony for a change that no longer needs it?

**Strongest single product argument against approving A as written.** A's green check makes a *weaker* promise than the intent's headline value ("catches defects present in no single lane") while occupying the same visual position — a passing `spec:validate` — that downstream users will read as the stronger promise. The product risk is not that A is wrong about coverage; it is that A ships a gate whose name ("integration node, final, covered") will be trusted to mean "the combined change was verified," when A explicitly does not check that. The decision the reviewer must make on my axis: is agent-attested body completeness an acceptable product guarantee for the *contract-coverage and release-includes artifact*, given that the intent specified the body's content precisely because that content is the user value.

## Critique (ux)

The "user" on this axis is the human operator who drives these commands at the terminal and reads `spec:validate` output. Candidate A introduces three new operator commands (`/decompose-lanes`, `/write-tests`, `/integrate`) and a STOP-and-ask branch in `/prepare-evidence`, but leaves the operator-facing interaction details of each underspecified, and — by its defining choice of *no* body rule — gives the operator no machine signal for the most consequential failure state a multi-lane change can reach.

### Interaction flows left unspecified

- **`/integrate` reports nothing back to the operator.** Scope (lines 63–68) says `/integrate` invokes integration-reviewer, writes the node and edges, applies scope-integrity, "sets the integration to `final` only when every lane is covered, then runs index + validate and commits only on green." It never says what the operator *sees*. The existing `/prepare-evidence` and `/write-brief` both end with "report the ID and each updated status"; A's `/integrate` spec omits the analogous closing report. Concretely: when integration-reviewer judges the lanes do **not** combine (a conflict, residual risk, or an uncovered lane), does `/integrate` write a `draft` integration and stop, or write nothing? The operator is left unable to tell "integration ran and found a problem" from "integration silently did nothing." **Fix:** pin `/integrate`'s closing report (integration ID, its draft/final status, which lanes are covered vs. blocking, and the verdict) the way every other command in `.claude/commands/` ends with an explicit status report.

- **The partial / blocked-integration state is reachable but undescribed.** A's own acceptance example 1 (lines 238–246) names the state where a `final` integration `integrates` only one of two lanes' evidence — the coverage rule turns that red. But A never describes the operator path *out* of that state. After `/integrate` leaves a `draft` integration (or a one-lane `final`), what command does the operator re-run to add the missing lane — `/integrate` again (does it supersede the draft, or error on "integration already exists"?), or a manual graph edit? An operator who reaches the blocked state has no documented next action. **Fix:** specify `/integrate`'s re-run behaviour on an existing draft/partial integration node, and the exact remediation step the red finding should point the operator toward.

- **`/write-tests` vs `/implement-brief` ordering is an unguided two-command dance.** The core requires verification to be its own lane owned by test-writer, run via `/write-tests`, "independent of `/implement-brief`" (lines 61–63). But nothing tells the operator the *ordering* or *coupling*: must `/write-tests` run before, after, or interleaved with the implementation lanes? If an operator runs `/integrate` before the test-verification lane has reached `final` evidence, what do they see? The coverage rule will block it, but the operator has no up-front guidance and only discovers the gap at validate time. **Fix:** state in the `/decompose-lanes` or `/write-tests` flow the expected operator sequence and what `/integrate` reports when the test-verification lane is not yet final.

### The error / empty / permission-denied paths the contract is silent on

- **`/prepare-evidence`'s STOP-and-ask is a dead-end without an actionable prompt.** The shared core (lines 69–76) has `/prepare-evidence` "STOP and ask the human" when a diff touches unowned paths, offering three options (extend a capability, create one, confirm intentionally unowned). From the operator's seat this is the single most frequent new interruption, yet A never specifies what the prompt *shows*: which exact paths were unowned, which capabilities exist to extend, and how the operator records each choice. A bare "some paths are unowned, what do you want to do?" with no list of the offending paths or the candidate capabilities is an un-actionable wall. The risk is real precisely because A's own dogfooding (lines 253–259) hits this branch on its *own* diff (`CLAUDE.md` + `tests/`). **Fix:** specify the STOP-and-ask prompt content — enumerate the unowned paths, list the extendable capabilities with their current globs, and name how each of the three resolutions is then recorded.

- **No empty / no-op feedback for `/integrate` on a single-brief contract.** Per the core, a single-brief contract skips integration entirely. If an operator mistakenly runs `/integrate <single-brief-contract>`, what happens — a clear "this contract is single-brief; no integration node is needed" message, or a confusing partial run? A is silent. **Fix:** specify the no-op / wrong-class message so the operator is told *why* nothing happened, not left guessing.

### The defining UX gap: the failure the operator can never see

- **A thin integration body fails silently from the operator's view.** This is candidate A's strongest UX liability and it is on my axis because the integration body *is* the artifact a future human reads to learn whether a multi-lane change was actually integrated and tested. A's own Non-scope (lines 155–157) and Trade-offs (lines 186–193) concede that an integration node omitting the COMBINED-test-run section "passes `spec:validate`." For the operator that means the single most important question — "was the integrated whole actually tested?" — has **no machine signal at all**; it surfaces only if a human happens to open the body and notice the missing heading. There is no red, no warning, no discoverability cue. A real reviewer days later, trusting a green `spec:validate`, will reasonably assume the integration body is complete and never open it. The verification need at lines 299–302 actively *confirms* this: a section-incomplete body "**passes**" under A. **Sharp question:** given that the integration node is, by the core's own framing, "the contract's coverage artifact and the release's `includes` target," is leaving its completeness undiscoverable to every downstream human — with green CI actively signalling "all good" — an acceptable operator experience for a Class 3 change? If A is selected, at minimum the convention must produce a *visible* operator cue (e.g. `/integrate` echoing which required sections the authored body contains) so the gap is not invisible.

### Discoverability

- **Three new commands with no surfaced relationship to the lifecycle the operator already knows.** `/decompose-lanes`, `/write-tests`, and `/integrate` slot into the existing numbered lifecycle, but A documents them only inside this contract; nothing says how an operator mid-flow *discovers* that a Class 3 contract now needs `/decompose-lanes` instead of `/write-brief`, or that the intent stays `open` after `/prepare-evidence` until `/integrate` runs. An operator who runs `/prepare-evidence` on a laned brief and sees the intent stay `open` (core item a, lines 69–71) may read that as a bug, not the intended hand-off to `/integrate`. **Fix:** ensure the CLAUDE.md lane rules (or the command bodies) make the laned-brief → `open` → `/integrate` hand-off explicit and self-explaining at the point the operator observes it.

## Critique (architecture)

Reviewed on the architecture axis only (module/service boundaries, schema and data-flow blast radius, extensibility debt). No code diff exists yet, so this reads candidate A's `## Scope` and `## Problem interpretation` against the live schema (`specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`), the validator (`tools/validator.ts`), and the handler this contract models on (`tools/handlers/comparison_required.ts`).

**1. The new `integration` node has no edge that binds it to a contract — only `integrates → evidence`. The "one integration per contract" invariant lives in a command, not the graph.** Scope adds exactly one edge type, `integrates: integration → evidence`. The coverage rule must therefore recover *which contract* an integration completes by walking `integration —integrates→ evidence —evidences→ brief —decomposes→ contract` for each integrated evidence. Nothing in the schema constrains those briefs to `decompose` the *same* contract, and nothing forbids a second `final` integration for the same contract. Both are schema-legal; the only thing preventing them is prose in `/integrate` ("creates exactly one integration node"). Concrete failure: an integration whose `integrates` edges reach evidence across two contracts — the rule's per-contract coverage verdict is undefined, and a future `/integrate` bug or a hand-authored edge produces a green graph with an ambiguous coverage artifact. Sharp question: why is the contract-coverage artifact attached to the contract only transitively through evidence, rather than via a direct `integration → contract` edge (or a rule that asserts every integrated evidence shares one contract and at most one `final` integration exists per contract)? Without that, the headline acceptance L4 rests on an invariant the validator cannot see.

**2. The coverage handler is a third near-identical set-based traversal of the proposes/selects/decomposes chain — coupling hardened, not abstracted.** Scope models the handler on `comparison_required.ts`'s "every live candidate covered" set check, and `class_market_quorum.ts` already walks the same `selects`/`proposes` spine. This contract adds a third hand-rolled traversal of `decision —selects→ contract —proposes→ intent` plus a `decomposes`/`evidences`/`integrates` fan-out, each re-implementing live-vs-superseded filtering and defensive endpoint skipping inline. The blast radius the Trade-offs understate is maintenance coupling: a future change to how "live" is computed (e.g. a brief retire lifecycle, which node-types.yaml today lacks for capability and may gain) must be edited in three places in lockstep or the rules silently disagree. Sharp question: does this contract extract a shared coverage-graph helper (live-candidate set, live-brief set, covered-by traversal) that all three rules consume, or does "smallest faithful validator surface" mean a third copy of the traversal? The smaller *file* surface is the larger *coupling* surface.

**3. Widening `capability-spec-tooling-1a2b` to own `CLAUDE.md` + `tests/**` turns a cohesive capability into a grab-bag and dilutes the drift map.** The capability node (`specs/nodes/capability-spec-tooling-1a2b.md`) is titled "Spec graph tooling" and owns `[tools/**]`. Scope resolves this contract's own capability-recursion stop by appending `CLAUDE.md` and `tests/**` to that one capability. `CLAUDE.md` is the *governing doctrine* of the whole repo, not tooling; `tests/` is a cross-cutting surface every capability's evidence touches. Folding both under "Spec graph tooling" means a future doc-only or test-only change `touches` a capability whose title misdescribes it, and the per-capability drift signal ("what broke under tooling?") is permanently muddied. The intent itself says "Drift detection is only as good as this map." Sharp question: should `CLAUDE.md` (doctrine) and `tests/**` (verification surface) get their own capabilities rather than being annexed to tooling — and is making that ownership decision inside this PR's `/prepare-evidence` STOP-and-ask the right place to set repo-wide ownership policy, or should it be a separate capability-ownership decision?

**4. `touches`-coverage is a workflow promise, not a graph invariant — the capability-wiring half of the intent has no validate backstop in A.** Scope's CLAUDE.md rule (4) says "every evidence records `touches` edges … a diff touching unowned paths is a coverage gap." But A adds exactly one validation rule (coverage+coherence); nothing in `spec:validate` asserts that an evidence node carries any `touches` edge at all. The STOP-and-ask lives only in `/prepare-evidence`. Concrete failure: evidence authored by any path that bypasses the command (a hand-edit, a future command, a careless agent) has zero `touches` edges and the graph stays green — the exact silent-drift hole rule (4) is written to close. This is consistent within A's "smallest surface" stance, but it means two of the intent's four headline guarantees (coverage *and* capability wiring) are machine-real while the wiring half is agent-trust only. Sharp question: is the absence of any `evidence-has-touches` invariant a deliberate scope choice, or an unstated gap that leaves rule (4) unenforceable?

**5. (A's defining axis, stated on-axis.)** The `integration` node is declared as the contract's *coverage artifact and the release's `includes` target* (CLAUDE.md rule 3 in Scope), yet its body — the only place the combined-test-run and joint-compliance verdict exist — is validated only by `requires_body` (non-empty). Architecturally this makes the highest-stakes artifact in the new lifecycle the *least* schema-constrained body in the graph: a one-character body satisfies the type. That is an internally consistent doctrine (bodies are convention), but it means the data-flow node on which `addressed` and release both pivot carries no structural guarantee beyond its edges. This is the axis candidate B moves on; A should own that the coverage artifact's *content* is outside the validator's reach by design.

## Critique (security-privacy)

**Personal/sensitive data axis: no concern.** This change handles no personal or user data — it migrates spec-graph schema, adds CI validator handlers, agents, and commands. Nothing here reads, stores, logs, or transmits PII or secrets, so the privacy half of this axis is genuinely clean; the findings below are all integrity/authority (the security half).

**Trust boundary 1 — the only real one: the `check-diff` sensitive-path gate, and who is trusted to author the `touches` edge that satisfies it.** The repo's one sensitive glob is `specs/schema/**`, owned by `capability-spec-schema-2c3d`. `evaluateCheckDiff`/`hasGoverningEvidence` (tools/checkdiff.ts) pass a schema-touching PR only if the diff adds an `evidences` edge whose evidence `touches` the *owning* capability and reaches an `approved` contract. This contract's `/integrate` command is given authority to write `touches` edges ("adds `touches` edges to the capabilities the integrated change falls under"), and the integration-reviewer agent authors those edges via graph-maintainer. The Scope is silent on which capability `/integrate` is permitted to point a `touches` edge at. Concrete failure: a multi-lane change that modifies `specs/schema/node-types.yaml` but whose integration run writes a `touches` edge to `capability-spec-tooling-1a2b` (not the schema owner) would still produce a green graph for the coverage rule, yet the check-diff binding for the *schema* capability is what actually gates the sensitive path — a mismatched `touches` edge silently fails to govern the sensitive change while looking covered. Sharp question: does `/integrate` verify that, for any diff path under `sensitive_paths`, the `touches` edge it writes targets the capability that *owns that path* (the same binding `hasGoverningEvidence` checks), or can it satisfy the coverage rule with a `touches` edge to any capability?

**Trust boundary 2 — capability-path widening expands what `capability-spec-tooling-1a2b` is trusted to govern.** Scope extends that capability's `paths` from `[tools/**]` to also own `CLAUDE.md` and `tests/**`. Two on-axis consequences the contract does not name. (a) `tests/**` is where the new test-verification lane and the `test-writer` agent write tests, and `tools/**` is the validator code those tests exercise — folding both the code-under-test and its tests under a single capability means one `touches`→approved-contract binding now vouches for both, eroding the separation the test-writer-is-never-the-implementer rule is trying to buy. (b) `CLAUDE.md` is the file that carries the security-relevant rules themselves (scope-integrity rule 5, the lane catalog, the sensitive-path doctrine); making it a governed-but-non-sensitive path means edits to the security policy text ride through check-diff with only ordinary tooling-capability coverage, never the schema-grade sensitive gate. Sharp question: should `CLAUDE.md` (which encodes the gate policy) be a *sensitive* path, not merely an owned one?

**Trust boundary 3 — `specs/{nodes,graph,indexes}/**` declared "intentionally unowned."** The contract resolves its own capability-recursion by recording graph data as intentionally unowned via the human-confirm branch. On-axis risk: nodes and edges are exactly the inputs the new coverage rule and the check-diff gate *trust* (a `touches` edge, a brief's `status`, an evidence's `final`). Leaving the path that holds those files ungoverned by check-diff means an actor who can land node/edge changes can manufacture the very coverage relationships the gate relies on (e.g. add a `touches` edge or flip a body to look `final`) without tripping any sensitive-path gate. That is by design today, but this contract newly makes node/edge authorship load-bearing for whether a *sensitive* schema change counts as covered (via the integration `touches` chain) — concentrating gate-satisfying authority in the one path declared unowned. The contract does not name this composition. Sharp question: with `/integrate` now writing the `touches` edges that check-diff trusts, is the unowned-graph-data decision still safe, or does the integration node's coverage power need its own integrity check?

**Abuse/injection path the contract is silent on — author-controlled `lane` enum and brief-set shaping.** The coverage rule decides "covered" from the live, non-superseded brief set and `final` evidence. The `lane` field is author-set and the contract specifies no constraint that the decomposed lane set match the contract's declared surface. Concrete abuse: an author who wants a multi-surface change to *skip* integration can decompose the contract into a single (unlaned) brief — the single-brief branch then treats one `final` evidence as covered, with no integration node and no combined-test-run artifact ever produced. The intent's own rule says Class 3 multi-surface work *must* decompose into lanes, but nothing in this candidate's validator surface enforces "this contract's surface is multi-lane, therefore single-brief completion is illegal here" — the lane/integration requirement is convention, not machine-checked. Sharp question: what stops a Class 3, multi-surface contract from being completed via the single-brief branch, bypassing integration (and thus the COMBINED-test-run evidence) entirely?

**Strongest single security argument against approving A as written.** A's defining choice — integration-body quality is agent-plus-convention, not machine-checked — means the integration node, which this contract elevates into the *coverage artifact for sensitive multi-lane changes and the release `includes` target*, can be authored `final` with a hollow or omitted COMBINED-test-run / contract-compliance section and still turn the graph green. Because that same integration node carries the `touches` edges check-diff trusts to govern `specs/schema/**` changes, the integrity of the sensitive-path gate degrades to the trustworthiness of a single agent run with no machine backstop on the body. A states the agent-trust gap honestly, but frames it as a quality gap, not a gate-integrity gap; the security framing (an unverified body sitting on the sensitive-change coverage path) is the sharper objection and is the one this contract does not record.

## Critique (compliance-risk)

Scope reviewed: this candidate's `## Scope`, `## Non-scope`, `## Problem interpretation`, and acceptance examples. In this repo the compliance-and-regulatory-risk surface is the spec graph's own governance regime — the audit trail (decision/comparison/supersedes provenance), the record-keeping obligations (CLAUDE.md scope-integrity rule 5, the dated comparison gate, the class-3 human gates), and the policy constraints encoded in CLAUDE.md and `validation-rules.yaml`. A class-3 change to the lifecycle machinery is precisely where an audit-trail defect propagates into every future change, so the bar is high.

### a) Record-keeping / status-mutation obligation left unaddressed: d4f2 reaches `addressed` with no provenance chain
The contract drives `intent-status-coherence-d4f2` (a separate, open, class-2 intent) from `open -> addressed` via a note in *this* contract's selecting `decision` body plus the coherence rule landing — explicitly NOT via a contract that `proposes` d4f2, a brief that `decomposes` it, or evidence that `evidences` it. Concrete failure: a compliance reader later asks "which contract was selected to address d4f2, and where is the decision that authorized it?" and the graph answers with nothing — d4f2 is `addressed` but no `selects` edge, no `proposes` edge, and no `comparison` node names it. Worse, the new coverage-and-coherence handler this contract ships is *scoped to `selects`-edged intents only* (Scope bullet 3), so d4f2 — which has no `selects` edge of its own — is not even covered by the very rule whose landing is claimed to justify its `addressed` status. The status mutation is therefore both unaudited and unverified by the machine. Fix / sharp question: either capture the missing provenance for d4f2 (a contract/brief/evidence chain, or an explicit `decision` node that *records d4f2 as the subsumed subject* and is itself the audit record), or state precisely which persisted node a future auditor reads to reconstruct "d4f2 was addressed by this work, on this date, by this decision." A prose claim inside another intent's contract is not a queryable provenance record.

### b) Audit-trail gap: the "intentionally unowned" exemption of `specs/{nodes,graph,indexes}/**` persists no authorization record
Scope's capability-recursion resolution records `specs/{nodes,graph,indexes}/**` as "intentionally unowned" via the human-confirm branch of `/prepare-evidence`. This is the single most compliance-sensitive territory in the repo — the graph data is where every `decision`, `comparison`, and `supersedes` provenance edge physically lives. The contract specifies no node or edge that durably captures *that* confirmation: who confirmed, when, and on what rationale. Concrete failure: six months on, drift detection silently never fires on `specs/nodes/` or `specs/graph/edges.yaml` (because nothing owns them), a brief is edited in place in violation of scope-integrity rule 5, and no coverage check or `touches` edge ever flags it — and there is no recorded decision a reviewer can point to that authorized leaving that path ungated. Fix / sharp question: require the human-confirm branch to write a durable artifact (a `decision` node, or a capability whose body explicitly states the unowned-by-design rationale) so the exemption is an auditable, dated authorization rather than an ephemeral console answer — and confirm whether the graph-data tree being permanently exempt from coverage is itself acceptable given that it holds all the lifecycle's records.

### c) Policy/constraint the change could violate: folding `CLAUDE.md` into a tooling capability misclassifies the governing policy document
Scope extends `capability-spec-tooling-1a2b` ("Spec graph tooling", `paths: [tools/**]`) to also own `CLAUDE.md` and `tests/**`. `CLAUDE.md` is the governing policy/compliance document — it carries the scope-integrity rules, the class-3 human gates, the comparison-gate doctrine. Binding it to a capability titled "Spec graph tooling" means any future PR editing the compliance rules in `CLAUDE.md` is attributed, for coverage and `touches` purposes, to *tooling* — so a change to the human-gate policy looks, in the drift/ownership view, like a tooling change and could be reviewed as one. Concrete failure: a future PR weakens a class-3 human gate in `CLAUDE.md`; because that path is owned by the tooling capability, the change is `touches`-attributed to tooling and never routed to the governance/compliance surface as a policy change. Fix / sharp question: either give `CLAUDE.md` its own governance/policy capability, or record in the capability body why the project's compliance charter is deliberately owned by the tooling capability — do not let the ownership map quietly reclassify a policy document as tooling.

### d) Single strongest compliance argument against approving A as written
This candidate ships a lifecycle in which a multi-lane change's *only* contract-level compliance record — the `integration` node body that the intent requires to carry the joint contract-compliance verdict, the combined test run, and the scope-integrity outcome — is enforced solely by agent discipline and a CLAUDE.md convention, with `spec:validate` checking only that the body is non-empty (Non-scope bullet 1; Trade-offs final two bullets, conceded). For a *class-3, compliance-and-production-sensitive* lifecycle, the durable audit record of "the whole change was checked against the whole contract, and here is the scope-integrity outcome" can be silently absent or hollow and the graph still goes green. The contract states this gap honestly, which is to its credit, but on the compliance axis an audit record whose completeness rests on agent trust rather than on the gate is exactly the failure mode the class-3 process exists to prevent: silence (a missing verdict section) is read as a clean bill. That, combined with the unaudited d4f2 status mutation in (a) and the unrecorded graph-data exemption in (b), is the strongest case against approving A as written.

## Critique (qa-test)

Scope reviewed: this candidate's `## Scope`, `## Acceptance examples`, `## Verification needs`, and `## Non-scope` (no code diff exists at proposal time). Findings are on the testability/verification axis only.

**1. The acceptance claim with no oracle: "the combined test run actually happened." (blocking gap on this axis.)** The intent's headline value for the integration node is that the COMBINED test run on the integrated result "catches defects present in no single lane." Candidate A's defining choice is that this is *not* machine-checked: `## Non-scope` says "Section presence is NOT machine-checked" and `## Verification needs` line 299-302 actively asserts that a section-incomplete body (e.g. missing the COMBINED-test-run heading) **passes** `spec:validate`. So the single most valuable verification artifact this whole intent introduces has no oracle other than agent attestation and a CLAUDE.md convention. Concrete failure scenario: an `/integrate` run ships a `final` integration whose body has the structural facts right (`integrates` edges to `final` evidence for every live brief) but whose COMBINED-test-run section is one hollow sentence or absent entirely — the graph goes green, the contract is marked covered, the intent flips `addressed`, and CI never noticed the integrated whole was never tested as a whole. A's own Trade-offs (line 191-193) concede this; from the qa-test axis it is the strongest argument against approving A *as written*: the contract delivers a coverage skeleton but leaves the substance of multi-lane verification unenforceable. Sharp question for selection: is the COMBINED-test-run claim important enough that its absence must turn CI red, or is agent-trust an acceptable oracle for it?

**2. The new `lane` enum is unverifiable as specified — a mistyped lane silently passes (shared-core defect, concrete here).** Scope adds an optional `lane` enum to `brief` with eight values, and the whole lane model leans on lane identity: CLAUDE.md rule (2) requires "verification is always its own lane," `/decompose-lanes` must "include a `test-verification` lane whenever there is >=1 implementation lane," and `/integrate` reasons per-lane. But no existing handler constrains an arbitrary frontmatter field against an enum — `enum_constraint` (tools/handlers/enum_constraint.ts) only handles node `type` and node `status`, not a field named `lane`. So a brief written `lane: test-verficiation` (typo) or `lane: testing` passes `spec:validate` today and under candidate A unchanged. Candidate A's `## Verification needs` lists no test for lane-value validity and no rule to enforce it; the "these come free from existing handlers — confirm, do not re-implement" line covers `integration.status` and `integrates` endpoints but is silent on `lane`. Concrete failure: a decomposition that fluffs the verification-lane spelling produces an unrecognized lane, the test lane is silently absent, and nothing in the verification plan would catch it. Fix or sharp question: either add a `lane`-enum check (and a unit test that a bad value is a finding) to scope, or state explicitly in Verification needs that an invalid `lane` value is intentionally unenforced and name who catches it.

**3. The coverage handler's test matrix omits two boundary cases its own correctness depends on.** `## Verification needs` (a)-(i) is a strong matrix and directly mirrors comparison_required.test.ts conventions — good. But two omissions: (i) **a multi-brief contract with a `final` integration that integrates a `final` evidence for an *extra* brief that does not `decompose` this contract** — does a stray/cross-contract `integrates` edge wrongly satisfy coverage? The set-check is "every live brief covered"; it is not tested that coverage is also bounded to *this* contract's brief set, the exact analogue of comparison_required's wrong-market case (test (i) in comparison_required.test.ts), which A's matrix does not carry over. (ii) **a `draft` (non-`final`) integration node that integrates both lanes' `final` evidence** — example 1 mentions it in prose but the unit matrix (c)-(e) only varies the evidence/lane completeness, never the integration node's own `status`; a handler that forgot to require the integration be `final` would pass every listed test. Fix: add both rows to the `node --test` matrix and name the expected finding for each.

**4. No test that the new rule is actually dispatched (silent no-op risk).** A's scope registers the handler in the `HANDLERS` map and appends the rule to `validation-rules.yaml`, but `## Verification needs` tests the handler *function* directly (import-and-call, like comparison_required.test.ts) and the real-tree green check — neither proves the rule's `kind` string in `validation-rules.yaml` matches a `HANDLERS` key. If they diverge, `runValidation` emits a one-off "unknown kind" finding rather than running the coverage logic, OR (worse for a green-seeking author) a typo'd rule id makes the rule a silent no-op that never fires on the very acceptance case L4 is about. Candidate B's plan adds an explicit "dispatch-pinning check" for exactly this; candidate A has no equivalent. Fix: add an assertion that the coverage rule's configured `kind` resolves in `HANDLERS` and that on a known-bad fixture the rule actually emits (so a mis-wired rule fails the suite rather than passing vacuously).

**5. Self-dogfooding (this PR's own wiring) is asserted but its failure path is untested.** Acceptance example 3 and Scope make this PR mark its own evidence `touches` the extended `capability-spec-tooling-1a2b`, and the real-tree check asserts the post-migration graph is green including "this PR's own evidence/integration wiring." But this contract is itself multi-surface (schema + tools + .claude + CLAUDE.md + tests): if it decomposes into lanes, its *own* completion is now gated by the very coverage rule it introduces. The verification plan does not include the scenario where the PR's own integration node is incomplete and the new rule turns the PR's own graph red — i.e. there is no test that the rule fires *on the author's own change*, only that the final state is green. That is the one place a status-blind or mis-scoped count would be most embarrassing and least observed. Sharp question: does the plan include a deliberate red-then-green dogfood (commit the migration with the integration node omitted, confirm validate fails, then add it), or only a final green snapshot?

Severity rationale: finding 1 is a genuine blocking-grade gap *on this axis* (the intent's central verification artifact has no oracle) — but it is A's explicit, owned design choice, not an oversight, so the reviewer must weigh it as a trade-off, not a defect. Findings 2-5 are concrete test-plan holes that are fixable within A's chosen mechanism.

## Critique (reliability-ops)

This critique is on the reliability and operations axis only: partial writes, crash/retry mid-step, idempotency, rollback/recovery, and observability/blast-radius during an incident. The shared `/integrate` runtime flow and the shared coverage handler dominate the findings; A's distinguishing choice (no body rule) widens one of them rather than narrowing it.

### 1. `/integrate` is a multi-write step with no specified crash/retry recovery (failure mode: partial write)
Scope (`integrate.md`) says `/integrate` "creates exactly one `integration` node with `integrates` edges to each lane's final evidence, adds `touches` edges ... applies scope-integrity, sets the integration to `final` only when every lane is covered, then runs index + validate and commits only on green." That is at least four distinct graph mutations (node write, N `integrates` edges, M `touches` edges, a status flip) handed to graph-maintainer before the terminal `index && validate`. The contract never says in what order they land or what happens if the run dies after writing the `integration` node and two of three `integrates` edges. On the next invocation, `/integrate <contract-id>` is required to create "exactly one" integration node — but a half-written one already exists. Is the command idempotent (adopt-and-complete the existing node) or does it author a second, tripping a duplicate-id / two-integration state that the new coverage rule does not even check for? **The contract does not say, so recovery is operator-improvised mid-incident.** Concrete fix: specify that `/integrate` is re-runnable against a partially-written integration — it must detect an existing `draft` integration for the contract and converge it to the intended edge set, never author a second, and it must leave the node at `draft` until the full edge set is written and green.

### 2. The new coverage rule cannot detect a duplicate / conflicting integration node (blast-radius / observability gap)
The coverage handler (per Scope) asks "does a `final` integration `integrates` a `final` evidence for every live brief?" It is a coverage (existence) check. It has no uniqueness clause. If a crashed-then-retried `/integrate` (finding 1) leaves **two** `final` integration nodes for one contract — or one `final` and one stale `draft` — the coverage rule stays green (one of them covers every lane) while the graph silently carries a contradictory second coverage artifact that CLAUDE.md rule (3) also names as "the release's `includes` target." The intent says `/integrate` creates "exactly one" integration node, but nothing machine-enforces the "exactly one" — it is asserted in prose only. During an incident this is the worst kind of gap: the graph is green, but which integration node is the real coverage/release target is ambiguous. Sharp question for graph-maintainer/the brief: should the coverage rule (or a sibling) also fail when a contract has more than one live integration node, so a botched retry surfaces as red rather than as a silent fork?

### 3. The terminal `index && validate && commit-only-on-green` sequence has an unspecified failure-recovery contract (failure mode: crash between index and commit)
Both `/integrate` and the updated `/prepare-evidence` end on `node_modules/.bin/tsx tools/spec.ts index && ... validate` and "commit only on green." `spec:index` rewrites the generated `specs/indexes/*.yaml`; those are working-tree changes. If the process is interrupted after `index` regenerates the indexes but before `validate`/the commit decision, the working tree is left with regenerated indexes plus the new uncommitted node/edge writes, and a naive re-run of `/integrate` (finding 1) now layers more writes on top of a dirtied tree. The contract treats "commit only on green" as the whole safety story but says nothing about the dirty-tree-on-abort case or how the next run reconciles it. Concrete fix: state the recovery posture explicitly — e.g. the step must operate on a clean tree and, on any non-green or aborted run, leave no commit and document that the operator resets generated indexes (`git checkout specs/indexes`) before re-running.

### 4. The `/prepare-evidence` STOP-and-ask branch has no defined resume/idempotency story (failure mode: interrupted between evidence write and `touches` wiring)
Scope (b): `/prepare-evidence` for a laned brief sets the brief to `implemented`, writes the new evidence, maps the diff to capability `paths[]`, adds `touches` edges, and STOPs-and-asks the human when the diff touches an unowned path. The ordering of "write evidence + flip brief to `implemented`" versus "add `touches` edges" versus "hit the STOP gate" is unspecified. If evidence is written and the brief flipped to `implemented` **before** the unowned-path STOP fires, the human is asked mid-way, and on resume the command must not re-write the evidence or double-add `touches` edges. **The contract gives no resume semantics for the STOP gate**, so a human who answers "extend the capability" and re-runs risks duplicate evidence or duplicate `touches` edges. Sharp question: is `/prepare-evidence` re-entrant after a STOP — does it detect the already-written evidence and only complete the missing `touches` wiring?

### 5. No machine signal that the COMBINED test run happened — and `/integrate` is the *only* place it is asserted (A's defining reliability gap)
This is A's distinguishing choice viewed from the ops axis. The intent is explicit that the combined test run "catches defects present in no single lane." Under A, that combined-run evidence lives **only** in the integration body, which is not machine-checked; `spec:validate` goes green on a `final` integration as long as the `integrates`/`final`-evidence structure holds (A's own Acceptance example and Risk admit this). From an incident-response standpoint this is the highest-value observability signal in the whole change — "was the integrated, multi-lane result actually exercised as a whole before we called the contract done?" — and under A it is human/agent-attested with **no durable, queryable artifact a responder can trust.** When a multi-lane regression ships, a responder cannot distinguish "the combined run ran and missed it" from "the combined run was never performed" by reading the green graph; they must read prose and trust the author. A states this gap honestly, but on the reliability axis it is a real loss of the post-incident audit trail. Concrete framing for the reviewer: A's safety for the catches-cross-lane-defects property rests entirely on `integration-reviewer` agent discipline and the `/integrate` "refuse `final` until every lane is covered" rule — neither of which verifies the combined run occurred, only that the lanes are individually evidenced.

### 6. `integrates` edges point at `final` evidence whose own status can later move — no specified guard against post-coverage drift (recovery gap)
The coverage rule counts "only `final` evidence." But evidence status is mutable across PRs, and CLAUDE.md rule 3 lets briefs be superseded. If, after a `final` integration is recorded, one lane's brief is superseded (rule 3) or its evidence is reworked, the integration node's `integrates` edges may now point at a brief that has left the live set, leaving a `final` integration that no longer covers the live brief set. The bidirectional coverage rule may catch the *covered-but-not-addressed* / *addressed-but-uncovered* mismatch, but the contract does not state that re-superseding a lane brief forces the integration node back to `draft` or is otherwise reconciled. Sharp question: when a single lane is reworked after integration, what drives the stale `final` integration back to `draft`, and does any rule fail loudly if it is not — or does the graph quietly carry a `final` integration whose coverage no longer holds?

### Strongest reliability-or-ops argument against approving A as written
The single most important combined-test-run signal — the thing that justifies the whole integration node existing — is, under A, never durable or machine-verifiable. A green graph is fully compatible with a multi-lane change whose combined run was never performed. For a Class 3, production-sensitive, multi-surface change, that is exactly the property an incident responder most needs to trust and, under A, cannot. (This is A's deliberate trade, not an oversight — but on the reliability axis it is the load-bearing concern.)

### Note for graph-maintainer
Appending this critique mutates the graph. The step must end with `pnpm spec:index && pnpm spec:validate` (in this environment, `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`) and must not commit on failure.

## Critique (cost-maintainability)

Reviewing candidate A (`contract-lane-integration-convention-body-4c1f`) on the long-run cost and maintainability axis only.

### Duplication / new surface kept in sync by hand

- **The integration body's required-section list lives in three hand-synced places with no machine binding.** Under A, the seven sections the intent mandates (combined outputs, COMBINED test run, joint compliance verdict, rollback/sequencing, combined risk, follow-ups, scope-integrity outcome) are written into (1) the CLAUDE.md convention, (2) the `integration-reviewer.md` agent prompt, and (3) implicitly into the intent itself. Nothing enforces that these three lists stay equal. The concrete failure: a future editor tightens the CLAUDE.md convention (say, splits "combined risk" into "risk" + "residual risk") but never touches the agent prompt; the agent keeps emitting the old shape, and `spec:validate` is green throughout because it never reads the body. The divergence is invisible until a human happens to diff two prose files. A names this duplication only obliquely ("the CLAUDE.md convention names the sections"); it should name the agent prompt as the *single* source of truth for the section list and explicitly say the CLAUDE.md text is a pointer to it, not a second copy.
- **A relies on the `integration-reviewer` agent prompt as load-bearing spec with no test.** The coverage handler is unit-tested (good), but the body-completeness guarantee rests entirely on a markdown agent file that no test exercises. Agent prompts drift silently across model upgrades and prompt edits; there is no regression signal when the prompt stops producing the COMBINED-test-run section.

### Drift / rot a future maintainer inherits

- **The widened `capability-spec-tooling-1a2b` becomes a low-cohesion catch-all.** A resolves its own capability-recursion problem by bolting `CLAUDE.md` and `tests/**` onto the capability whose name and purpose is `tools/`. Concrete rot scenario: six months on, a maintainer touches only `CLAUDE.md` prose, `/prepare-evidence` maps that diff to `capability-spec-tooling-1a2b`, and the drift/`touches` signal now reads as "the tooling capability changed" when no tool did. The capability's name no longer describes what it owns, so every future ownership decision about docs or tests inherits a misleading home. A should either name a dedicated docs/tests capability or, at minimum, record in scope *why* this overload is acceptable rather than presenting it as a free side-effect.
- **The d4f2 "subsumption" leaves a dangling lifecycle obligation A does not own in code.** A drives `intent-status-coherence-d4f2` to `addressed` via the new coherence rule, but nothing in the validator ties d4f2's status to this rule landing. A future maintainer who removes or weakens the generalised coherence handler has no machine signal that they have re-orphaned an intent that was marked addressed on its behalf. The coupling is purely narrative (in the decision body), which is exactly the kind of cross-node invariant that rots.

### Ongoing operational / cognitive cost not accounted for

- **A accepts a permanent "green-but-hollow" class of integration node and only partially budgets the cost of policing it.** Because section presence is never machine-checked, every multi-lane completion forever depends on a human or agent actually reading the body to confirm the combined test run is described. A states this honestly as its defining trade-off, but does not account for the recurring reviewer cost: on every Class 3 integration, *someone* must manually verify the seven sections, indefinitely, with no checklist enforced by CI. That is a standing per-merge tax A imposes but does not name.
- **The new coverage+coherence handler is itself a non-trivial maintenance object that A under-budgets.** It traverses a five-edge-type chain (`selects`/`proposes`/`decomposes`/`evidences`/`integrates`) with status-aware live-set logic — strictly more complex than the ~120-line `comparison_required.ts` it is modelled on. This cost is shared with B and is driven by the intent, not by A's distinguishing choice, but A's "smallest faithful validator surface" framing risks under-selling that the *one* rule it does add is the hardest handler in the tree to keep correct across future schema changes.

### Single strongest cost-or-maintainability argument against approving A as written

A's body-completeness guarantee is a three-way hand-synced prose contract (CLAUDE.md convention, agent prompt, intent text) with no test and no validator binding any of them together; the predictable long-run failure is silent divergence between the convention and the agent that produces the bodies, surfacing only when a human notices a Class 3 integration shipped without the section the convention still claims to require — at which point the convention has been quietly false for an unknown number of merges.

### Sharpest question for selection

Which single artifact is the authoritative source of the integration section list under A — the agent prompt or the CLAUDE.md convention — and what catches the other one drifting from it, given `spec:validate` reads neither body?

## Critique (release)

Reviewed on the release and rollout axis only (migration ordering, backward-compatibility / in-flight state, staged-rollout / flag / rollback paths). The schema and agent-trust design is out of my lane except where it creates a rollout hazard.

**1. The coverage rule lands ungated and retroactively judges the entire existing graph the instant it merges — no cutoff, no staged rollout. (blocking question.)** The one mechanism this contract leans on, `comparison_required.ts`, is explicitly *dated*: it skips any selected contract created before `comparison_required_from`. This contract's coverage-and-coherence rule has **no analogous `_from` cutoff** anywhere in Scope, Risks, or Acceptance. The moment it merges it evaluates *every* `selects`-edged intent already in the graph — and the incoming index already shows live selected contracts (`contract-ci-gate-spec-tool-5039`, `contract-lifecycle-thin-commands-7c20`, `contract-work-class-validate-invariant-c3d4`, `contract-spec-tooling-schema-driven-b2e7`, `contract-drift-tool-assisted-7173`, `contract-critics-literal-panel-1c4a`). Each of those is a single-brief contract today whose intent is `addressed`; the bidirectional `covered ⟺ addressed` rule will be applied to all of them on first run. If any one has, e.g., an intent left `open` while its lone evidence is `final` (covered-but-not-addressed), or an `addressed` intent whose evidence is not `final`, **the rule turns the main branch red on merge of this PR** — a self-inflicted outage with no rollback lever short of reverting the whole migration. Concrete fix: either (a) add a dated `coverage_coherence_from` cutoff mirroring `comparison_required_from` so pre-existing selections are grandfathered exactly as the comparison rule grandfathers them, or (b) make the PR carry, as an explicit acceptance step, a full real-tree audit proving every currently-`addressed` intent in the graph already satisfies the new rule before the rule is wired in. The contract's "Real-tree green check" (Verification needs) gestures at this but only asserts the post-migration graph is green for *this PR's own* wiring — it does not commit to auditing the six pre-existing selected intents the rule will newly judge. **Sharp question:** which of the existing six selected intents have you confirmed are already coherent under the new bidirectional rule, and what is the plan if one is not — backfill its status in this PR, or grandfather it?

**2. Single-PR migration ordering: the rule and the data it judges land together, so there is no green intermediate state. (concern.)** This is a Class 3 multi-surface change shipping schema + validator rule + this PR's own `integration` node + capability re-ownership in one PR (the contract states "all in one PR"). The new coverage rule will, on the very commit that introduces it, also be asked to judge *this contract's own* multi-brief decomposition — which only becomes covered once the PR's own `final` integration node and its `integrates` edges exist. If the migration is staged within the PR such that the rule is registered in `validation-rules.yaml` before the PR's own integration node is written, `spec:validate` is red in that intermediate state, and the contract's own instruction "run index + validate and commit only on green" means the PR cannot be committed mid-migration. That is survivable for a single author but leaves no documented within-PR ordering. Fix: pin the intra-PR sequence explicitly in the brief — schema first, then all node/edge data (including this PR's own integration node and `touches` edges and the capability `paths` extension), and only then append the rule to `validation-rules.yaml` + register the handler, so the first validate that includes the rule already sees a coherent graph. The contract names rule *ordering within validation-rules.yaml* (after `edges-references-resolve`) but never names the *migration step ordering across the PR*, which is the actual rollout-safety question.

**3. d4f2 is driven `open → addressed` by this rule with no rollback story if the generalisation is later found wrong. (concern.)** The contract retires intent `intent-status-coherence-d4f2` not by superseding it (correctly noting an intent cannot be `supersede`d) but by *behaviourally* landing its rule and flipping it to `addressed`. d4f2's own body specifies the failure path as emitting to `indexes/unresolved.yaml` with the two failure classes kept distinguishable; this contract instead hard-fails `spec:validate`. That is a defensible behavioural change, but it is a **one-way door**: once d4f2 is `addressed` and the report-based path is abandoned, there is no staged fallback if the hard-fail rule proves too aggressive against the existing graph (see point 1). Backward-compat hazard: d4f2's Considerations explicitly warn that `indexes/unresolved.yaml` is *already* used by `brief-spec-tooling-schema-driven-8f2d` for unresolved edge endpoints — by routing coverage findings to a hard `Finding[]` instead, this contract sidesteps that overload, which is fine, but it should state that the abandonment of the report path is intentional and irreversible for d4f2, so a future reader does not treat the missing `unresolved.yaml` routing as a regression to restore. Fix: have the selecting decision record that d4f2's report-based delivery is superseded *in behaviour* (the contract already says this in Risks — good) **and** that there is no rollback to the report path; if hard-fail proves too aggressive the remedy is a dated cutoff (point 1), not a revert to reporting.

**4. No feature-flag / staged-rollout path is offered, and for the agent-side change (laned `/prepare-evidence`) that is an in-flight-state hazard. (concern.)** The `/prepare-evidence` change alters lifecycle semantics: a laned brief now goes to `implemented` while its intent stays `open`, and the intent only reaches `addressed` via `/integrate`. Any contract that is *mid-flight at merge* — decomposed into lanes under the old single-brief assumption but not yet integrated — would, under the new rule, be a multi-brief contract with no final integration node and therefore an immediate finding if its intent was already `addressed`. The contract assumes no such in-flight multi-lane work exists (reasonable today, since lanes do not yet exist), but it does not *state* that assumption as the thing that makes the ungated rollout safe. Fix: record explicitly that no multi-lane decomposition exists in the graph prior to this PR, so the only multi-brief contract the rule can find at merge is this PR's own — making the in-flight-state surface empty by construction. If that assumption is wrong, point 1's blocking concern bites.

**Strongest release argument against approving A as written:** the coverage-and-coherence rule is introduced **without a dated cutoff or any other staged-rollout lever**, so on merge it retroactively gates every already-`addressed` intent in the live graph; unlike the comparison rule it deliberately mirrors, it has no grandfathering, and the contract proves greenness only for its own wiring — leaving the six pre-existing selected intents as an unaudited path to a red main branch with no rollback short of reverting the migration. This must be resolved (cutoff or a committed pre-merge audit) before approval. Note A's lack of a body-validation rule is *not* a release concern in itself — it is a smaller migration surface, which is rollout-favourable; the gap A leaves is an agent-trust / verification concern for other critics, not mine.

**Mutation reminder:** appending this critique mutates the graph. The step must end with `pnpm spec:index && pnpm spec:validate` (or, per the env memo, `node_modules/.bin/tsx tools/spec.ts index && … validate`) and must not commit on a non-green validate.
