# Repository settings — operator tool

Brings the GitHub settings of `sb-dev/pactwright` to the governance policy in the [GitHub repository governance research log](../../docs/research-logs/2026-10-03-pactwright-github-repository-governance.md), through the `gh` CLI. It is idempotent: a second run changes nothing. It never deletes a resource, never loosens an existing setting and never reads, prints or writes a secret.

Requirements: `gh` on `PATH`, authenticated as a repository administrator (`gh auth login`), from a clone of the repository.

```text
pnpm github:settings audit            read every governed setting; write nothing
pnpm github:settings apply            ask before each change, apply it, read it back
pnpm github:settings apply --yes      apply every change without asking
```

Options (both commands): `--repo OWNER/NAME`, `--integration-branch NAME`, `--required-check NAME` (repeatable), `--allow-owner-push`, `--live-environment NAME`, `--release-environment NAME`, `--secret-name NAME`, `--allow-action PATTERN` (repeatable). `apply` adds `--backup DIR` for the before-state file.

Each finding is marked `=` already set, `~` to change, `!` for a person to do, `?` unreadable. `audit` exits 0 when nothing would change; `apply` exits 0 when every change applied and read back as desired. Both exit 2 on a usage or access error.

What a person must still do is printed at the end: set the environment secret, move any repository-level secret, remove collaborators or app permissions you do not want, and approve each `claude-live` or `npm-release` run in the GitHub web UI.
