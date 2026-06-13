---
id: intent-ci-enforcement-gates-b6c4
type: intent
title: Enforce specs via GitHub Actions with human approval gates and override waivers
status: open
created: 2026-06-13
---

Add GitHub Actions enforcement and human approval gates.
Schema migration first: node type override (required: id, type, title,
reason, approved_by, expires) and edge type waives
(override → any node or named check).
Workflows:
ci.yml — pnpm install, test, typecheck, lint on every PR.
spec-index.yml — run pnpm spec:index, then fail if
git diff --exit-code specs/indexes/ is dirty: committed indexes must
match regenerated output.
spec-validate.yml — run pnpm spec:validate on every PR touching specs/.
pr-evidence.yml — diff specs/graph/edges.yaml against the base branch.
Pass iff the diff adds at least one evidences edge whose target brief
decomposes a contract with status approved, OR the diff adds an
override node with a waives edge naming check pr-evidence.
Skip for PRs touching only specs/ or docs.
CODEOWNERS: /specs/schema/ and /specs/nodes/contract-* require review by
@<reviewer>.
Acceptance: a PR changing code with no evidence edge is blocked; adding
an override node with a reason unblocks it; the override is findable in
specs/indexes/by-type.yaml.
