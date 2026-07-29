# Drift detection

Drift detection asks whether a code change still tells the same story as the
spec graph: does a diff change observable behaviour that the linked contract or
brief does not represent? It runs in two layers (SPEC §15).

## Layers

1. **Deterministic** — `spec:check-diff` and `spec:drift-map`.
   - `spec:check-diff` is the sensitive-paths gate: a PR touching a
     `sensitive_paths` glob (declared in `specs/schema/validation-rules.yaml`)
     must carry, in the same diff, a linked approved contract **bound to the
     capability that owns the path** — added `evidences` → brief → `decomposes`
     → an `approved` contract, where that evidence also `touches` the owning
     capability — or an `override` node with a `waives → check-diff` edge.
   - `spec:drift-map` deterministically maps the diff to the capabilities that
     own the changed files and walks each to its linked contract/brief, emitting
     JSON "drift packets" plus an `uncovered` list. No LLM is involved.
2. **Semantic** — `/detect-drift <pr-number|branch>`. Feeds the packets to
   Claude, which answers the one behavioural question per capability and runs a
   holistic cross-capability pass, then records `drift-finding` nodes (via
   graph-maintainer) for real divergence.

## Capabilities

`capability` nodes own repo globs via `paths` and are the unit a diff maps to. A
capability reaches its governing contract through
`capability ← touches ← evidence → evidences → brief → decomposes → contract`. A
changed file owned by no capability appears in `uncovered`; close coverage holes
by adding or widening a capability's `paths`.

## Enforcement, layer by layer

`drift-review.yml` runs on every PR and its three layers are enforced
differently — the workflow as a whole is **not** "no longer warn-only":

- The **deterministic** `check-diff` layer is **blocking**: its step no longer
  carries `continue-on-error: true`, so a violation fails the job. It graduated
  after behaving correctly on ~5 real PRs, the criterion recorded here before
  the flip.
- The **Drift map** step keeps its own `continue-on-error: true` deliberately.
  It is a reporter, not a gate, and that line is not a graduation candidate.
- The **semantic** `/detect-drift` layer stays warn-only; before making it
  blocking, pin the CI Claude step (action, credential, model).

**Honest bound:** after the graduation the job goes **red** on a violating PR
but blocks no merge until a repo admin marks `drift-review` a required status
check (see `docs/branch-protection.md`). Red is not blocked, and that setting is
repo-admin state, not reproducible from files in this repository.

Every blocking check must remain waivable by an `override` node with a
`waives → check-diff` edge (the `check-diff` and `drift` check names are
registered in `specs/schema/checks.yaml`).
