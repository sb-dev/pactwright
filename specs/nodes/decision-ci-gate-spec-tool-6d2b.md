---
id: decision-ci-gate-spec-tool-6d2b
type: decision
title: Select the graph-aware PR gate (spec:gate in tools/spec.ts)
decided_by: samir.benzenine@gmail.com
created: 2026-06-13
---

## Selection

Selected `contract-ci-gate-spec-tool-5039` (graph-aware gate). Siblings
`contract-ci-gate-workflow-native-3489` and
`contract-ci-gate-checks-as-nodes-2d49` are rejected.

## Rationale

The `pr-evidence` rule is a graph-semantic traversal
(`evidences` → brief → `decomposes` → contract `status: approved`) that
`tools/spec.ts` already resolves for `spec:index`/`spec:validate`. Putting the
gate in a `spec:gate` subcommand that shares the validator's loader gives one
source of truth, local runnability (`pnpm spec:gate`), and unit-testability.

- **Rejected B (workflow-native):** re-implementing the traversal in
  `yq`/shell duplicates the graph model and drifts; its own drift mitigation
  ("a shared module imported by both") reintroduces shared code, defeating its
  "tool stays pure" premise.
- **Rejected C (checks-as-nodes):** contradicts the intent's "any node OR
  named check" wording, adds a `check` node type + seed nodes + out-of-repo
  branch-protection state that makes acceptance non-file-verifiable, and forces
  hex-suffixed check ids on override authors.

## Amendments to fold into the brief

1. From B, adopt ONLY its robust diff method: compute added edges by
   YAML-parsing `edges.yaml` at base vs head and set-differencing edge ids —
   never scrape `+`/`-` lines.
2. From C, adopt ONLY its enforcement clarity: document required-status-checks
   + CODEOWNERS in `docs/branch-protection.md`; keep named checks as an
   allowlist, not nodes.
3. Enforce `expires`: reject an override whose `expires` is past the run date.
4. Avoid the skipped-required-check trap: `pr-evidence.yml` runs on all PRs and
   decides the specs-only/docs-only skip inside the job (early `exit 0`), so
   the required check always reports.
5. Pin the named-check literal to `pr-evidence`, independent of workflow/job
   name.
6. `spec:gate` defaults base to the merge-base with `origin/HEAD`, overridable
   via `GATE_BASE`, and errors clearly if unresolvable.
7. `override` required-fields exactly `[id, type, title, reason, approved_by,
   expires]`; allow `created`; `requires_body: true`; non-empty `reason`; read
   the contract's `status` at head.
8. Accept as a known v1 limitation that any qualifying `evidences` edge
   satisfies the gate (not bound to changed paths); tightening is a future
   superseding contract.
9. Confirm the CODEOWNERS reviewer handle before implementing — the intent
   truncated it to `@`.

## Consequences

`contract-ci-gate-spec-tool-5039` → `approved`;
`contract-ci-gate-workflow-native-3489` → `rejected`;
`contract-ci-gate-checks-as-nodes-2d49` → `rejected`;
`intent-ci-enforcement-gates-5c90` stays `open` (closes only once evidence is
recorded). Next step: a brief decomposing the approved contract.
