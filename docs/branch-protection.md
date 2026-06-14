# Branch protection

The workflows in `.github/workflows/` only compute and report pass/fail. The
*blocking* of merges is enforced by GitHub branch-protection settings, which
are repo-admin state and are **not** reproducible from files in this repo —
this document records the intended configuration so it can be audited and
restored.

Configure the default branch (`main`) with:

## Required status checks

These four checks must pass before a PR can merge ("Require status checks to
pass" + "Require branches to be up to date"):

| Check | Workflow | Enforces |
| --- | --- | --- |
| `ci` | `ci.yml` | `pnpm test`, `pnpm typecheck`, `pnpm lint` on every PR |
| `spec-index` | `spec-index.yml` | committed `specs/indexes/` match a fresh `pnpm spec:index` |
| `spec-validate` | `spec-validate.yml` | runs on every PR; validates with `pnpm spec:validate` when `specs/**` changed, otherwise reports success |
| `pr-evidence` | `pr-evidence.yml` | every code PR carries an `evidences` edge to an approved contract, or an `override` waiving the `pr-evidence` check |

`pr-evidence` and `spec-validate` run on **every** PR and decide scope *inside*
the job (`pr-evidence` skips a specs/docs-only PR; `spec-validate` skips a PR
that touches no `specs/**`), reporting success when out of scope. Because they
always report, they are safe to mark **required**. A check that filters at the
event level (a workflow-level `paths:` filter) must **not** be made required: on
a PR it never runs for, no status is posted and GitHub blocks the PR forever
waiting on it.

## Required reviews (CODEOWNERS)

Enable "Require review from Code Owners". `.github/CODEOWNERS` requires the
graph owner (`@sb-dev`) to review changes under:

- `/specs/schema/` — node/edge/validation schema
- `/specs/nodes/contract-*` — contract nodes
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
