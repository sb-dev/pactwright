---
id: intent-ci-enforcement-approval-gates-b8c1
type: intent
title: Add GitHub Actions enforcement and human approval gates
status: open
created: 2026-06-13
---

Add GitHub Actions enforcement and human approval gates.

Schema migration first: node type `override` (required: id, type, title,
reason, approved_by, expires) and edge type `waives`
(override → any node or named check).

Workflows:
1. ci.yml — pnpm install, test, typecheck, lint on every PR.
2. spec-index.yml — run pnpm spec:index, then fail if
   `git diff --exit-code specs/indexes/` is dirty: committed indexes must
   match regenerated output.
3. spec-validate.yml — run pnpm spec:validate on every PR touching specs/.
4. pr-evidence.yml — diff specs/graph/edges.yaml against the base branch.
   Pass iff the diff adds at least one `evidences` edge whose target brief
   `decomposes` a contract with status approved, OR the diff adds an
   `override` node with a `waives` edge naming check pr-evidence.
   Skip for PRs touching only specs/ or docs.

CODEOWNERS: /specs/schema/ and /specs/nodes/contract-* require review by
@<github-handle>.

Acceptance: a PR changing code with no evidence edge is blocked; adding
an override node with a reason unblocks it; the override is findable in
specs/indexes/by-type.yaml.
