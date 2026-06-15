---
id: contract-drift-deterministic-4a3a
type: contract
title: Deterministic structural drift — tools/spec.ts flags structural signals; no LLM in the detection loop
status: rejected
created: 2026-06-14
---

## Problem interpretation

Same intent (`intent-drift-detection-c7b1`), but it trades fidelity for
determinism. The intent's one question — "observable behaviour not represented in
the linked contract or brief" — is genuinely semantic, but this candidate answers
a deterministic *proxy*: for each affected capability, did the diff change
behaviour-bearing surface (added/removed/renamed exported symbols, changed CLI
subcommands/flags, changed workflow triggers, new files under the capability's
globs) **without** the same PR adding a `touches`/`evidences`/`decomposes` chain
reaching a `status: approved` contract that governs the capability, or an
override? If yes → structural drift, create a `drift-finding`. No LLM in the
detection loop; Claude or a human only triages findings afterward
(`open → resolved/accepted`). This is the fastest path to a reproducible,
CI-native, eventually-blocking check, and it is deliberately cruder than reading
behaviour.

## Scope

- **Shared migration & seeding** — identical to the tool-assisted candidate
  (schema migration, `sensitive_paths`, capability + `touches` seeding,
  `spec:check-diff`, `drift-finding` body format).
- **`tools/spec.ts drift`** (script `spec:drift`): deterministic. Map diff →
  capabilities (sharing the `spec:check-diff`/gate base-ref machinery); for each
  affected capability compute structural signals from the diff and check whether
  the same PR diff adds graph representation (an `evidences`/`decomposes` edge
  reaching an `approved` contract governing the capability, or an `override` +
  `waives → drift`). Emit a structured finding list; on real signals,
  `/detect-drift` invokes graph-maintainer to create `drift-finding` nodes +
  `flags` edges with the standard body (its "behaviour" line is the structural
  signal, e.g. "exported symbol X removed in `tools/foo.ts` under
  `capability-spec-tooling`, no spec edge in this PR").
- **`/detect-drift <pr|branch>`**: thin wrapper over `spec:drift` (no Claude);
  prints findings or 'no drift'.
- **`drift-review.yml`**: every PR — `pnpm spec:check-diff` + `pnpm spec:drift`,
  both deterministic, annotate-only/warn first; flip to blocking after ~5 clean
  PRs (the lowest-risk flip of the three).

## Non-scope

- No semantic judgment of behaviour — false positives (a benign refactor that
  changes a symbol) and false negatives (a behaviour change with no structural
  tell) are accepted and surfaced as findings a human triages.
- No Claude step in CI; no `drift-reviewer` subagent.
- No branch-protection config in code.

## Trade-offs

- **+** Fully deterministic, unit-testable, byte-reproducible; no API key/cost in
  CI; the only candidate that is safely blocking-ready soon.
- **+** Same engine/tooling family as `gate`/`check-diff` — one diff+graph code
  path.
- **+** Findings are explainable (a concrete structural delta) and easy to audit.
- **−** Lowest fidelity: it answers a proxy, not the intent's actual question;
  benign refactors flag (noise) and pure behaviour changes with no structural
  tell slip through (misses).
- **−** A signal catalogue (exported symbols, CLI flags, workflow triggers, …) is
  language/area-specific and must be maintained; coverage is only as good as the
  catalogue.
- **−** Pushes the semantic judgment to a human triage step
  (`open → accepted/resolved`) rather than catching it up front.

## Risks

- **Noise erodes trust** (alarm fatigue) before the blocking flip. Mitigation:
  start with a tiny high-precision signal set (exported-symbol delta only),
  expand as real PRs show what matters; warn-only until precision is proven.
- **Signal-catalogue rot** vs. the codebase. Mitigation: keep signals few and
  tested; treat additions as their own small changes.
- **Proxy masquerading as the real check.** Mitigation: the contract states
  plainly this is structural, not behavioural drift; a later phase can layer the
  Claude-assisted check (the tool-assisted or agent-native candidate) on top.

## Acceptance examples

1. **Schema first** — as in the tool-assisted candidate, example 1.
2. **Structural drift** — a branch removing an exported symbol under a capability
   with no spec edge in the PR produces a `drift-finding` naming the symbol;
   `flags` → capability (+ evidence if present).
3. **No drift** — a comment-only/whitespace change yields 'no drift'.
4. **Sensitive gate** — as in the tool-assisted candidate, example 5.
5. **Acceptance (intent)** — `spec:drift` / `/detect-drift` on each of the two
   Phase 4 PRs yields a `drift-finding` or an explicit 'no drift'.
6. **Reproducible & warn-only** — two runs on the same PR give identical
   findings; `drift-review.yml` annotates and stays green until the flip.

## Verification needs

- `node --test` over `spec:drift`: fixtures of diffs × capabilities asserting
  each structural signal fires/does not, and that an in-PR approved-contract
  chain suppresses the finding; `check-diff` tests as in the tool-assisted
  candidate.
- Determinism test: same input → identical output across runs.
- `pnpm spec:validate` green post-migration/seeding; a scratch PR for warn-only;
  a recorded run for the two Phase 4 PRs.

## Critique

- **The "signal catalogue" is the whole candidate and is undefined.** Scope
  hinges on detecting "added/removed/renamed exported symbols, changed CLI
  subcommands/flags, changed workflow triggers," but specifies no mechanism.
  Deterministically diffing *exported symbols* in TypeScript needs AST/`tsc`
  analysis; CLI flags and workflow triggers each need their own parser. None of
  this is in scope, so the "one diff+graph code path / same engine as
  gate/check-diff" claim conceals a large, language-specific implementation
  surface a brief cannot bound.
- **The acceptance is vacuously satisfiable.** The candidate "explicitly accepts
  false negatives," and the intent's acceptance only requires "a `drift-finding`
  or an explicit 'no drift' for each" Phase-4 PR. A `spec:drift` that fires no
  signal trivially emits 'no drift' and passes acceptance 5 — even if behaviour
  actually drifted. The acceptance certifies the plumbing, not detection.
- **The suppression rule makes the acceptance run hollow for compliant PRs.** A
  finding is created only when the diff changes surface "**without** the same PR
  adding … a chain reaching a `status: approved` contract … or an override." The
  Phase-4 PRs *did* add `evidences` edges to approved contracts, so by this rule
  they are suppressed to 'no drift' regardless of structural change — meaning
  acceptance 5, run on exactly those PRs, is expected to print 'no drift' both
  times and demonstrates nothing about the detector.
- **Renames vs. add+remove are not deterministically separable.** Scope lists
  "renamed exported symbols" as a distinct signal, but a textual diff cannot
  reliably distinguish a rename from an unrelated add plus remove without
  heuristics the contract does not give; "renamed" is thus either unimplementable
  as stated or silently collapses into two other signals (double-counting).
- **"Behaviour-bearing surface" is undefined.** The proxy stands or falls on
  which surface is "behaviour-bearing," yet the term is never defined; and "new
  files under the capability's globs" as a signal will flag every test file,
  fixture, or doc added under an owned glob — noise on the very first run.
- **The proxy risks being trusted as the real check.** Naming a
  structural-coverage heuristic "drift detection" invites reading a green check
  as "behaviour is represented in the graph," which it never verifies. The Risk
  note ("a later phase can layer the Claude-assisted check") is an aspiration,
  not a guard; nothing here prevents the misread in the interim.
- **Shared/inherited gaps.** (1) The migration PR edits `specs/schema/**`, now a
  `sensitive_path`, so the drift PR must pass its own `spec:check-diff` — an
  ordering none of the three resolve. (2) `flags: target [evidence, capability]`
  needs an unspecified `edge_endpoint_types` extension (fallback `any` drops the
  constraint). (3) capability `status_values: [active, retired]` is invented with
  no retire lifecycle. (4) "the two Phase 4 PRs" assumes two PRs where history
  shows a single #4. (5) The retroactive `touches` seeding (e.g.
  `evidence-ci-gate-spec-tool-693d → capability-spec-schema`) is an authored
  mapping with nothing validating its correctness or completeness, yet every
  traversal to a governing contract depends on it.
