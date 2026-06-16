---
id: contract-drift-agent-native-bafa
type: contract
title: Agent-native drift — a drift-reviewer subagent maps and judges; only spec:check-diff is new tooling
status: rejected
created: 2026-06-14
class: 2
---

## Problem interpretation

Same intent (`intent-drift-detection-c7b1`). This candidate draws the boundary
where Phase 3 drew it ("thin commands; the agent does the reasoning") and where
SPEC §15 literally puts it ("semantic drift is Claude-assisted"). Rather than
teach `tools/spec.ts` about capabilities, globs, and packets, it keeps the tool
minimal — only the deterministic `spec:check-diff` — and gives the whole drift
job to a new `drift-reviewer` subagent: the agent loads `by-type.yaml` + edges,
matches changed files to capability `paths`, walks to contracts/briefs, and
answers the one question, then hands writes to graph-maintainer. The command is a
thin shim.

## Scope

- **Shared migration & seeding** — the schema migration (`capability`,
  `drift-finding`, `touches`, `flags`), `sensitive_paths`, the capability +
  `touches` seeding, the deterministic `spec:check-diff` subcommand, and the
  `drift-finding` body format — are **identical to the tool-assisted candidate**.
  This candidate changes only where the *drift mapping and judgment* live.
- **`drift-reviewer` subagent** (`.claude/agents/drift-reviewer.md`; read-only
  tools + invokes graph-maintainer): given a pr/branch, get the diff, load
  `specs/indexes/by-type.yaml` + `edges.yaml`, map changed files to capabilities
  via `paths` globs, follow incoming edges to contracts/briefs, and answer the
  one question per capability; on "yes" ask graph-maintainer to write a
  `drift-finding` + `flags` edges; on "no" report 'no drift'.
- **`/detect-drift <pr|branch>`** (thin): resolve the diff source, invoke
  `drift-reviewer`, and surface its per-capability verdicts.
- **`drift-review.yml`**: every PR — `pnpm spec:check-diff` (deterministic,
  warn-only) + a Claude step running `/detect-drift` (the subagent); annotate;
  `continue-on-error` in the warn phase; flip blocking after ~5 clean PRs.

## Non-scope

- No capability/glob/packet/traversal code in `tools/spec.ts` — only
  `spec:check-diff` is added there.
- No structural heuristics.
- No branch-protection config in code.

## Trade-offs

- **+** Smallest tooling footprint: `tools/spec.ts` gains only the simple
  deterministic `check-diff`; the fuzzy work lives in an agent that is easy to
  evolve as real drift patterns emerge — matching the thin-command decision and
  SPEC §15.
- **+** Mapping + judgment is one coherent agent pass with full graph context, so
  it can spot cross-capability drift a per-packet tool split might miss.
- **+** No new tool public surface (no packet schema) to freeze.
- **−** File→capability globbing and graph traversal are done by the LLM, so they
  are non-deterministic and not unit-testable — the very resolution the indexes
  exist to make exact is re-done fuzzily each run (the drift the validator was
  built to prevent, reintroduced in the reviewer).
- **−** Token-heavy and slower (the agent re-reads indexes/edges every run);
  higher CI cost.
- **−** Hardest to make blocking: non-deterministic mapping + judgment makes a
  red/green gate unreliable, so the ~5-PR flip is riskiest here.

## Risks

- **Inconsistent glob matching by the LLM** (misses a file, mis-owns another) →
  missed or spurious drift, with no deterministic oracle to test against.
  Mitigation: give the agent the exact capability `paths` and require it to list
  matched files per capability for human audit; a deterministic `spec:drift-map`
  can be added later (which is exactly the tool-assisted candidate).
- **Ad-hoc diff acquisition in the agent layer.** Mitigation: the command
  resolves the base ref/diff deterministically and passes it in.
- **Non-reproducibility undermines CI trust.** Mitigation: keep warn-only longer;
  retain transcripts.

## Acceptance examples

1. **Schema first** — as in the tool-assisted candidate, example 1.
2. **Drift found** — `/detect-drift` via `drift-reviewer` on a behaviour-changing
   branch creates a `drift-finding` with `flags` → capability + evidence and the
   standard body.
3. **No drift** — a refactor yields 'no drift'; nothing created.
4. **Sensitive gate** — as in the tool-assisted candidate, example 5
   (`spec:check-diff` is identical).
5. **Acceptance (intent)** — `/detect-drift` on each of the two Phase 4 PRs
   yields a `drift-finding` or an explicit 'no drift'.
6. **Warn-only** — `drift-review.yml` annotates and stays green until the flip.

## Verification needs

- `node --test` over `spec:check-diff` (the only deterministic piece).
- For the agent: a documented manual matrix — fixed branches with known-correct
  verdicts, run repeatedly to gauge consistency; transcripts retained (no
  automated oracle).
- `pnpm spec:validate` green post-migration/seeding.
- A scratch PR for the sensitive gate and warn-only behaviour; a recorded
  `/detect-drift` for the two Phase 4 PRs.

## Critique

- **Acceptance contradicts the admitted non-determinism.** The trade-offs
  concede mapping and judgment are "non-deterministic and not unit-testable,"
  yet acceptance 2, 3 and 5 assert definite outcomes ("creates a
  `drift-finding`"). An LLM pass is not guaranteed to reproduce these, so the
  acceptance examples are aspirations, not checkable gates — there is no oracle
  by which a reviewer could mark example 2 passed or failed.
- **Agent-invokes-agent is an unestablished pattern.** Scope has the
  `drift-reviewer` subagent "ask graph-maintainer to write a `drift-finding`."
  The repo's established shape is that *commands* invoke agents and only
  graph-maintainer writes; a subagent invoking another subagent is nowhere
  established, and the contract does not say whether it is permitted or how the
  nested call is wired. A brief cannot proceed without that decision.
- **Diff acquisition for a PR number exceeds the agent's tools.** `/detect-drift
  <pr|branch>` "resolve[s] the diff source," but for a PR *number* that needs
  `gh`/network access not listed among the `drift-reviewer`'s "read-only tools."
  Whether the command pre-resolves the diff or the agent fetches it is left
  open, and the latter exceeds the agent's stated capabilities.
- **"Cross-capability drift" is asserted, not specified.** The headline "+" is
  that one agent pass "can spot cross-capability drift a per-packet tool split
  might miss," but no clause says how the agent decides a *combination* of
  changes drifts. Without a procedure the advantage is unfalsifiable and cannot
  be implemented or tested.
- **LLM glob matching has no audit gate.** The Risk mitigation — "require it to
  list matched files per capability for human audit" — leans on a human to catch
  a mis-owned or skipped file every run, with no deterministic check. For a step
  meant to graduate to blocking, "a human will eyeball the file list" is not an
  enforceable control.
- **CI cost/credentials/rate-limits are unaddressed.** Running "a full subagent
  per PR" is acknowledged only as "highest cost"; there is no statement of the
  credential path, model, timeout, or rate-limit behaviour, and the
  warn→blocking flip "after ~5 clean PRs" is dubious for a check whose output can
  vary run-to-run on an unchanged diff.
- **Shared/inherited gaps.** (1) The migration PR touches `specs/schema/**`, now
  in `sensitive_paths`, so the drift PR must clear its own `spec:check-diff` — a
  bootstrapping ordering none of the three resolve. (2) `flags: target
  [evidence, capability]` needs an unspecified `edge_endpoint_types` extension
  (fallback `any` drops the constraint). (3) capability `status_values: [active,
  retired]` is invented with no retire lifecycle. (4) "the two Phase 4 PRs"
  assumes two PRs where history shows a single #4. (5) `spec:check-diff`'s
  "linked approved contract" is satisfiable by any added edge to any approved
  contract, not one governing the touched file.
