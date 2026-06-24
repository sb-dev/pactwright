---
id: comparison-patch-market-synthesis-7b1d
type: comparison
title: Patch-market merge-gate market — A (validate-authoritative) vs B (dedicated CI gate) vs C (reuse pr-evidence)
created: 2026-06-24
---
This is the durable comparison for the class-3 patch-market-synthesis proposal market (intent-patch-market-synthesis-3b1e). The live candidate set is A (contract-patch-market-validate-authoritative-9d41), B (contract-patch-market-ci-gate-6b7e), and C (contract-patch-market-reuse-evidence-gate-c3f8). All three implement the same four-command patch-market workflow and the same shared-core schema widening; they differ on one axis: **where the multi-patch merge gate lives** — a `spec:validate` rule (A), a dedicated diff-aware CI workflow (B), or folded into the existing `pr-evidence` gate (C).

## Candidate trade-off table

| Axis | A (validate-authoritative) | B (dedicated CI gate) | C (reuse pr-evidence) |
|------|----------------------------|-----------------------|------------------------|
| Merge-gate location | New `patch_market_resolved` rule inside `spec:validate` | New diff-aware `spec:patch-gate` subcommand | Folded clause inside `evaluateGate`/`spec:gate` |
| New CI workflow | `patch-comparison.yml` (thin runner of `spec:validate`) | `patch-comparison.yml` (dedicated, always-on) | None |
| Validate stays diff/override-agnostic | No — first waiver- and date-aware validate rule | Yes — `HANDLERS` map stays all-pure | Yes — structural rules stay pure (gate logic moves to `evaluateGate`) |
| Source-of-truth count for "live competitor" | One (validate rule) | Two (gate + structural handlers) — drift surface | Two (gate clause + structural handlers) — drift surface |
| Override path | `waives → patch-comparison`, but standing/whole-graph (not same-PR-bound) | `waives → patch-comparison`, dedicated, same-PR-bound | `waives → pr-evidence`, overloaded (waives evidence + market together) |
| Literal intent fidelity (`patch-comparison.yml` + named check) | Partial — file exists but failing rule id is `patch_market_resolved`, not a `patch-comparison` check | Full — workflow and `patch-comparison` named check exist | None — no workflow, no `patch-comparison` check |
| WIP graph mid-market | RED (open market reds the whole graph) | GREEN (validate green; only the merge is gated) | GREEN (validate green; only the merge is gated) |
| Primary risk | Red-WIP couples graph-well-formed to market-finished; impure date/waiver logic in validate | PR→brief mapping via head branch is net-new, brittle, fail-mode ambiguous | Specs-only-PR skip leaves the headline acceptance case ungated |

## Critic findings by perspective

### spec
- A makes `spec:validate` the first waiver- and date-aware rule, but `runValidation` hands handlers `(rule, spec)` with no `today`, so expiry is either non-deterministic or expiry-blind (A). A's red-on-open-market also fails validate on the very mutation `/propose-patches` must commit, inverting the lifecycle (A).
- B's design is the cleanest fit with the existing override mechanism (pure validate + diff-aware gate), but its `patch-comparison` literal must be registered in `checks.yaml` or `references_resolve` reds the graph, and its PR→brief mapping fail-closed default can wedge ordinary PRs (B).
- C's specs-only skip can leave the intent's headline acceptance silently unmet, and folding a PR→brief mapping into the brief-agnostic `evaluateGate` corrupts a load-bearing tested function (C).
- Shared core (all): widening `selects.target` to `[contract, patch]` feeds patch ids into `class_market_quorum` and `comparison_required`, which call `intentsForContract` assuming a contract and emit a spurious red on every patch selection unless guarded to `type === "contract"` (A,B,C).

### product
- A's red-WIP makes the normal mid-market state feel like a failure and trains the team to reach for overrides as a routine un-stick button, eroding the strongest safety signal (A).
- B is the only candidate that delivers the intent's literal acceptance (a check named `patch-comparison`), a genuine legibility value — but its PR→brief mapping's worst failure mode is a silent pass that voids the exact guarantee being bought (B).
- C's specs-only bypass is exactly the artifact the headline acceptance describes, so C can fail the one scenario it must pass; its overloaded waiver also silently weakens the evidence guarantee (C).
- Shared honest bound (all): the gate checks that comparison/selects nodes exist, not that a human substantively compared (A,B,C).

### ux
- A's red-WIP makes the operator's local feedback loop lie about what they did wrong, and the override (a heavyweight governance artifact) becomes the routine escape — discoverability exactly backwards (A).
- B splits the "is my market mergeable?" answer across two tools that disagree by design, with no locally-runnable preview of the one gate that blocks at merge time (B).
- C's specs-only success is a silent green-light the operator trusts and is wrong about; its overloaded `pr-evidence` failure name sends the operator down the wrong remediation path (C).
- Shared (all): none of the four new commands carry the closing-report contract every existing command guarantees (A,B,C).

### architecture
- A forces the first override-aware handler into a validator with no run-date and no waiver concept — threading a clock into `runValidation` touches every handler's contract or makes validate non-deterministic (A). A's `patch-comparison` waiver name, `patch-comparison.yml`, and the failing rule id `patch_market_resolved` are three loosely-tied names for one gate (A).
- B's "reuse the gate pattern" claim hides genuinely new git plumbing: nothing in the codebase reads the head branch, and the `patch.branch` join key has no rule keeping it equal to the real ref — a single point of silent failure A avoids (B).
- C is an impedance mismatch: `evaluateGate` reasons over added edges, but the multi-patch test needs the full live `competes-for` set the winner's PR may not add (C).
- Two-places drift on "live competitor" between gate and handlers (B,C).

### security-privacy
- A's waiver moves a gate from diff-aware/same-PR-bound into `spec:validate`, turning the override into a standing repo-wide bypass token that suppresses every later market until expiry, and putting a waivable hole in the previously-unbypassable structural backstop (A).
- B makes the head branch name a trusted, author-controllable security input whose mapping-miss can land a multi-patch merge ungated, and re-implements override/expiry parsing as a second copy that can drift (B).
- C inherits the specs-only skip as a security coverage hole and overloads one waiver to suppress two distinct gates at once; its structural rules staying pure is C's relative strength on this axis (C).

### compliance-risk
- A's whole-tree waiver is invisible to the audit trail (not co-located with the PR it excuses) and is an unscoped standing waiver of a compliance gate; red-WIP manufactures routine non-exceptional overrides that pollute the waiver ledger (A).
- B's PR→brief mapping is the gate's single point of compliance failure — "fail closed" collapses to "cannot decide" when the mapping itself fails; its dedicated `patch-comparison` waiver is finer-grained (a strength) but not market-scoped (B). B is the only candidate with no un-recorded market-resolution event (B).
- C never fires on a specs-only PR (no recorded gate event), overloads one waiver across two compliance concerns destroying attribution, and deletes the named check so the control is unregistered and code-only (C).

### qa-test
- A's headline gate has no offline oracle distinguishing "resolved" from "winner-already-selected": `liveSourcesByEdge` excludes only `superseded`, so a `selected` winner still counts as a live competitor and the post-selection steady state is never tested (A). Validate's new override-expiry path can't reuse existing gate fixtures (A).
- B's acceptance can't be tested by its claimed harness because the gate needs a head branch name no existing gate input carries (and CI's detached HEAD yields `HEAD`); the graph-first mapping is circular at the moment the gate must fire; two-places drift has no enforced parity test (B).
- C's specs-only bypass is a demonstrable gate-bypass with only an untested narrative mitigation; the overloaded waiver is untestable as a patch-market control; the folded clause can newly fail previously-green evidence PRs (C).
- Shared `selected`-patch-counts-as-live trap (A,B,C), most dangerous in C where the gate runs on the post-selection code merge.

### reliability-ops
- A's red-WIP is a global CI outage: opening a market reds `spec:validate` on every concurrent spec-touching PR, with no per-brief containment; the validate waiver can't replicate same-PR semantics and is globally sticky until expiry (A).
- B is the most operationally containable (validate stays green mid-market, dedicated always-on check, dedicated waiver) but its PR→brief mapping fail-mode is unspecified, two-places drift can split green-validate/red-gate, and it must carry `gitdiff.ts`'s `fetch-depth: 0`/`GATE_BASE` shallow-checkout requirements (B).
- C's gate is dark on the market-recording PR (specs-only skip), and overloading `pr-evidence` collapses two failure domains into one signal and one coarse waiver, worsening triage and blast radius (C).

### cost-maintainability
- A makes `spec:validate` carry a permanent override-awareness exception with nothing stopping it from becoming the template for a general waivable-validate pattern; `patch-comparison.yml` near-duplicates `spec-validate.yml` and its blocking value depends on an unowned branch-protection change (A).
- B doubles the patch-market surface into a third diff-aware module, its "literal fidelity" still hinges on a manual GitHub required-check setting outside the diff, and it adds a brittle, precedent-free PR→brief mapping; keeping validate pure is a real countervailing credit (B).
- C's specs-only bypass rots first, overloading `evaluateGate` raises the cognitive cost of every future edit to the most-touched gate, and it still needs B's PR→brief mapping but hidden inside the universal gate; smallest CI surface is C's genuine cost credit (C).

### release
- A's thin `patch-comparison.yml` inherits `spec-validate.yml`'s specs-only scope guard and won't fire on the code merge it must block; coupling graph-well-formed to market-finished reds every parallel PR for the whole market window; making validate waiver-aware lets the local validator flip red↔green by the calendar (A). Override-target wiring is sound (A).
- B introduces a brand-new required check that must be wired into branch protection before it blocks anything and must always-report to avoid stranding open PRs; its PR→brief mapping is net-new release-critical machinery; two-places drift can have two required checks disagree (B). Override path is the least risky part (B).
- C's specs-only skip bypasses the gate on the way markets are actually recorded; one overloaded waiver covers two concerns un-splittably; it openly forfeits the named workflow/check (losing a distinct CI identity); and it adds a new failure clause into the hot path that gates every code PR (C).

## The case against each candidate

### A
Coupling "graph well-formed" to "market finished" makes an open market RED across the whole graph, stranding every concurrent spec-touching PR until a human selects — and the only escape, an `override`, is a standing/whole-graph waiver (not same-PR-bound) that the previously-pure `spec:validate` must now evaluate against wall-clock expiry, breaking its determinism and turning the structural backstop into the system's first waivable validate hole.

### B
The gate's correctness rests on a net-new PR→brief mapping that reads the author-controllable head branch name and the unenforced `patch.branch` field — input no existing gate carries — whose "fail-closed" default is ambiguous (it can either strand unrelated PRs repo-wide or silently pass an unmapped multi-patch merge, voiding the guarantee), all to buy a literal named check whose blocking still depends on an unowned branch-protection setting.

### C
`pr-evidence.yml` skips specs-only PRs, so the patch market's graph-only steps — the exact "PR skips the comparison node" case the intent's headline acceptance names — never invoke C's folded clause and merge green; compounding this, the reused `waives → pr-evidence` override silently waives both evidence-provenance and patch-comparison at once, an un-splittable coarsening on a class-3 gate.

This comparison covers the live candidate set (3 candidates, 3 compares edges) and is the durable record the selecting decision cites; it is replaced, never duplicated, on re-review.
