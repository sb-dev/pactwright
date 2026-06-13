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
| `spec-validate` | `spec-validate.yml` | `pnpm spec:validate` on PRs touching `specs/**` |
| `pr-evidence` | `pr-evidence.yml` | every code PR carries an `evidences` edge to an approved contract, or an `override` waiving the `pr-evidence` check |

`pr-evidence` and `spec-validate` decide internally whether a given PR is in
scope (e.g. a docs-only PR is skipped inside the job and still reports
success), so they are safe to mark **required** without stranding
out-of-scope PRs on a check that never reports.

## Required reviews (CODEOWNERS)

Enable "Require review from Code Owners". `.github/CODEOWNERS` requires the
graph owner (`@sb-dev`) to review changes under:

- `/specs/schema/` — node/edge/validation schema
- `/specs/nodes/contract-*` — contract nodes

## How `pr-evidence` is satisfied

A PR that changes code (anything not exclusively under `specs/` or `docs/`)
passes `pr-evidence` when its diff against the base branch adds **either**:

1. an `evidences` edge whose target brief `decomposes` a contract with status
   `approved`; **or**
2. an `override` node together with a `waives` edge targeting the
   `pr-evidence` check, where the override's `expires` is not in the past.

The override node is then findable under `by-type: override` in
`specs/indexes/by-type.yaml`.
