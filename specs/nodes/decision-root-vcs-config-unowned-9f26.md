---
id: decision-root-vcs-config-unowned-9f26
type: decision
title: .gitignore and .gitattributes are intentionally unowned root VCS config
decided_by: Samir Benzenine
created: 2026-07-30
---

Records that the repo-root VCS-configuration files `.gitignore` and
`.gitattributes` are INTENTIONALLY UNOWNED by any capability.

This supersedes `decision-gitignore-unowned-6b3d`, which authorized
`.gitignore` alone and said so explicitly: "this authorization covers
`.gitignore` and nothing else." `.gitattributes` did not exist when that
artifact was written. It was created by the `product-spec` lane of
`contract-conveyor-derived-4c8c` to carry common-core finding CC-16's
merge rule for the generated index files (`specs/indexes/** -merge`), which
left it owned by no capability and covered by no exception — a coverage gap
that CLAUDE.md's `touches` rule requires be resolved in the same PR rather
than ignored. This decision is that resolution.

Both files are repo hygiene, not a behavioural surface a path-owning
capability would gate. `.gitignore` decides what reaches the repository at
all; `.gitattributes` declares a merge policy for files that are themselves
generated. Neither is a consumer-observable behaviour that a contract could
usefully be written against, and gating them behind a capability would make
every routine hygiene edit a contract-or-override event.

The reasoning that held for `.gitignore` holds unchanged for its sibling,
which is why this is one artifact rather than two: no capability's `paths`
glob matches either file. The six capabilities own `.github/workflows/**`,
`.github/CODEOWNERS`, `.claude/commands/**`, `.claude/agents/**`,
`.claude/lanes/**`, `CLAUDE.md`, `SPEC.md`, `README.md`, `CONTRIBUTING.md`,
`docs/**`, `specs/schema/**`, `tests/**`, `tools/**` and `package.json`.
Glob semantics anchor a pattern's first segment, so only a pattern whose
first segment is a glob — or one of the literal filenames — could match a
repo-root dotfile, and no capability declares either.

Contract `contract-conveyor-derived-4c8c`'s Out of scope 7 declines to
create a repo-hygiene capability for `.gitignore`, resolving it instead via
the sanctioned intentionally-unowned branch. This decision extends that same
branch to `.gitattributes` rather than reversing the contract — creating the
capability the contract declined would have been a change to intended
behaviour requiring its own approval under scope-integrity rule 5.

This is the durable, dated authorization that `/prepare-evidence`'s
human-confirm branch points at for both files: a diff touching `.gitignore`
or `.gitattributes` is a recorded intentionally-unowned change, not a
coverage gap.

SCOPE BOUND: this authorization covers `.gitignore` and `.gitattributes`
and nothing else. It does NOT extend to the other tracked paths that no
capability owns — `.github/dependabot.yml`, `CODE_OF_CONDUCT.md`,
`SECURITY.md`, `LICENSE`, `eslint.config.js`, `tsconfig.json` and
`pnpm-lock.yaml` — which `brief-conveyor-schema-graph-8b2e` records as a
coverage observation "recorded not taken". Resolving those is a follow-up
intent, never a quiet extension of this artifact.

Authorized by Samir Benzenine on 2026-07-30, on the
`decision-graph-data-unowned-2f7b` precedent, in response to the
capability-coverage gate firing during `/prepare-evidence` for
`brief-conveyor-lane-catalog-2d5b`.
