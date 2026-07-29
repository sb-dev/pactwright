# Branch protection

The workflows in `.github/workflows/` only compute and report pass/fail. The
*blocking* of merges is enforced by GitHub branch-protection settings, which
are repo-admin state and are **not** reproducible from files in this repo —
this document records the intended configuration so it can be audited and
restored.

Configure the default branch (`main`) with:

## Required status checks

These six checks must pass before a PR can merge ("Require status checks to
pass" + "Require branches to be up to date"):

| Check | Workflow | Enforces |
| --- | --- | --- |
| `ci` | `ci.yml` | `pnpm test`, `pnpm typecheck`, `pnpm lint`, and the A9 transcription check (printed `NEXT` blocks vs `spec:status`) on every PR |
| `spec-index` | `spec-index.yml` | committed `specs/indexes/` match a fresh `pnpm spec:index` |
| `spec-validate` | `spec-validate.yml` | runs on every PR; validates with `pnpm spec:validate` when `specs/**` changed, otherwise reports success |
| `pr-evidence` | `pr-evidence.yml` | every code PR carries an `evidences` edge to an approved contract, or an `override` waiving the `pr-evidence` check |
| `patch-comparison` | `patch-comparison.yml` | a multi-patch brief's merge PR must carry a comparison + a `selects` decision, or a non-expired `waives → patch-comparison` override; the diff-aware `spec:patch-gate` blocks the merge otherwise |
| `drift-review` | `drift-review.yml` | the deterministic sensitive-paths gate (`spec:check-diff`): a touched `sensitive_paths` glob needs a linked approved contract or an override. Blocking. The semantic `/detect-drift` layer in the same workflow stays warn-only |

`pr-evidence` and `spec-validate` run on **every** PR and decide scope *inside*
the job (`pr-evidence` skips a specs/docs-only PR; `spec-validate` skips a PR
that touches no `specs/**`), reporting success when out of scope. Because they
always report, they are safe to mark **required**. A check that filters at the
event level (a workflow-level `paths:` filter) must **not** be made required: on
a PR it never runs for, no status is posted and GitHub blocks the PR forever
waiting on it.

`patch-comparison` likewise runs on **every** PR (no event-level `paths:` filter
and no specs-only in-job skip — the gate runs even on a specs-only patch-market
PR) and reports **success** when no patch market applies, so it is safe to mark
**required**: a non-market PR is never stranded. The named `patch-comparison`
check blocks nothing until a repo admin enables it under "Require status checks
to pass"; until that admin step lands, the workflow runs and reports but blocks
no merge.

`drift-review` triggers on `pull_request:` with **no** event-level `paths:`
filter, so it always runs and always reports — safe to mark required under the
rule above. Its deterministic sensitive-paths step graduated from warn-only to
blocking after behaving correctly on ~5 real PRs, and is waivable by an
`override` node with a `waives → check-diff` edge. The same honest bound applies
as to `patch-comparison`: after the graduation the job goes **red** on a
violating PR but blocks no merge until a repo admin marks `drift-review`
required. Red is not blocked, and that admin step is repo state, not
reproducible from files in this repository.

Note that the **Check** column above holds GitHub status-check names (which are
job ids), a different namespace from the waivable check ids registered in
`specs/schema/checks.yaml` — where the drift gate is registered as `check-diff`,
not `drift-review`. A row here is not a registry claim.

## Required reviews (CODEOWNERS)

Enable "Require review from Code Owners". `.github/CODEOWNERS` requires the
graph owner (`@sb-dev`) to review changes under:

- `/specs/schema/` — node/edge/validation schema
- `/specs/nodes/contract-*` — contract nodes
- `/specs/nodes/decision-*` — decision nodes, which carry the binding
  amendments that make up a contract's *effective* text
- `/specs/nodes/override-*` — gate-waiver nodes

**Override integrity depends on this last rule plus required code-owner
review.** `spec:gate` clause (b) waives `pr-evidence` on any author-added
`override` node and does **not** authenticate the override's `approved_by`
field — that field is *provenance* (free-text record of who signed off), not an
authorization check. The only thing that makes a waiver an *independent* human
approval rather than a self-issued one is that adding an `override` node trips
the CODEOWNERS rule above and blocks the PR until the graph owner reviews it. If
"Require review from Code Owners" is off, the override path is self-serve.

## How `pr-evidence` is satisfied

A PR that changes code (anything not exclusively under `specs/` or `docs/`)
passes `pr-evidence` when its diff against the base branch adds **either**:

1. an `evidences` edge whose target brief `decomposes` a contract with status
   `approved`; **or**
2. an `override` node together with a `waives` edge targeting the
   `pr-evidence` check, where the override's `expires` is not in the past.

The override node is then findable under `by-type: override` in
`specs/indexes/by-type.yaml`.
