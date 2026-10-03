# Pactwright — GitHub Repository Governance

**Version:** 1

**Date:** 3 October 2026

**Branch analysed:** `refactor/pactwright-v2`

**Inspected revision:** `0da7b7113563bde3ed2c080ed87ab4d5306cbda6`

**Authority:** [GitHub Integration](../specs/07-github-integration.md) §3 (sync owns remote desired state), §34 (managed ownership and reconciliation) and §36 (security boundary); [Open-Source Project Organisation](../specs/08-open-source-project-organisation.md) §23 (contribution model) and §26 (repository task graph and CI). This log is an operator guide and bootstrap tooling. It is not a product capability: the `pactwright github sync` command of GitHub Integration §3 later owns repository settings, and this tooling must then be retired or adopted by it.

## 1. Purpose

The repository is public, one person owns it, and AI agent sessions work in it as that person. T3.5-H2 adds a paid Claude credential for a GitHub Actions job. Before that credential exists, the repository must be set so that:

- only code owners change the protected branches and release tags, and only through pull requests;
- only collaborators open pull requests;
- a secret or a publication needs a human approval that an agent cannot give;
- a contributor or a fork cannot reach a secret or a write-capable token.

Section 5 gives the rules. Section 6 gives the tool that applies them. Section 7 lists the practices that need a person, not a setting.

## 2. Audit of 2 October 2026

Read through the GitHub API; nothing was changed.

| Item | State found | Risk |
| --- | --- | --- |
| Collaborators | `sb-dev` only, admin. Pull-request creation already limited to collaborators. | None. |
| `CODEOWNERS` | `* @sb-dev` on every branch. | None, but it is not enforced on `refactor/pactwright-v2`. |
| Branch protection | `main` only. `refactor/pactwright-v2`, where checkpoint pull requests merge, has none. | Anyone with push rights, agents included, can push to the integration branch. |
| Tags | None protected. A `v*` tag runs `release.yml`, which publishes to npm. | A pushed tag publishes. |
| Workflows | Read-only token, SHA-pinned actions, `persist-credentials: false`, no `pull_request_target` or `workflow_run`. Release runs in environment `npm-release` with OIDC. | None found. |
| Agent identity | Pull request #62 and its workflow run are authored and triggered by `sb-dev`. | GitHub cannot tell an agent from the owner. Rules keyed on the actor do not separate them. |
| Planned credential | `live-claude` reads a repository secret and runs on every same-repository push. | Any branch push, by an agent too, spends it. |
| Not readable with the tools used | Rulesets, environment rules, Actions settings, installed GitHub App permissions. | The owner verifies these; the tool in §6 reads them. |

## 3. Threat model

The owner's identity is shared with agents. A rule that trusts the actor therefore trusts every agent. The only gate an agent cannot pass is one that needs a click in the GitHub web UI by a signed-in person: a required reviewer on an environment. Every secret and every publication is placed behind that gate.

Everything else reduces what a mistaken or compromised session can do without that click: no direct pushes, no tag pushes, a read-only workflow token, selected pinned actions, and approval for runs from outside the repository.

## 4. Secrets model

| Rule | Reason |
| --- | --- |
| The Claude token is an **environment** secret in `claude-live`, never a repository secret. | A repository secret is readable by every same-repository workflow run, including one an agent edits. |
| `claude-live` has `sb-dev` as a required reviewer and no admin bypass. | Each run waits for the owner's approval in the web UI. |
| A job that uses the token declares `environment: claude-live`. | Without the declaration, the secret is not provided. |
| The owner approves a run only after reading the workflow diff on that head. | The approval releases the secret to that exact workflow. |
| Approvals are given only in the web UI. | An API token with the owner's identity could otherwise approve. Agent tokens must not hold `actions: write`. |
| `npm-release` keeps the same reviewer rule and deploys only from `v*` tags. | Publication stays behind the same gate. |
| The tool never reads, prints or sets a secret value. | It reports presence and prints the `gh secret set --env` command for the owner. |

## 5. Policy

The desired state of each GitHub resource. The tool applies it without loosening what is already set: an existing stricter value, an extra rule, reviewer or allowed action stays.

| Resource | Desired state |
| --- | --- |
| Repository | Pull requests from collaborators only. Head branches deleted after merge. Secret scanning and push protection on. Dependabot alerts, Dependabot security updates and private vulnerability reporting on. |
| Ruleset `protect-main` (default branch) | No deletion, no force push. Pull request required, with a code-owner review, stale approvals dismissed on push and conversations resolved. The `Verify` check must pass on an up-to-date branch. Administrators bypass only through pull requests. |
| Ruleset `protect-integration` (`refactor/pactwright-v2`) | As `protect-main`, without required checks: the harness checks are path-filtered and would block documentation-only pull requests. |
| Ruleset `protect-release-tags` (`v*`) | Only administrators create, move or delete release tags. |
| Environment `claude-live` | Required reviewer `sb-dev`, no admin bypass, any branch may deploy (the reviewer is the gate). |
| Environment `npm-release` | Required reviewer `sb-dev`, no admin bypass, deployment only from `v*` tags. Existing reviewers and rules kept. |
| Actions | Workflow token read-only; workflows cannot create or approve pull requests; runs from outside contributors need approval; only GitHub-owned actions and the listed third-party patterns (`pnpm/action-setup@*`); actions pinned to a full commit SHA where the API exposes the setting. |

The admin pull-request bypass exists because the sole code owner cannot approve their own pull request. It applies to merging only, never to a direct push. `--allow-owner-push` changes the bypass to `always`, which lets the owner, and so every agent acting as the owner, push directly. It is not the default.

Existing classic branch protection on `main` is left in place. Rulesets add to it.

## 6. Operator procedure

The tool is `tools/repository-settings`, run through the root script `github:settings`. It needs `gh` authenticated as a repository administrator.

```bash
pnpm github:settings audit          # read every governed setting; write nothing; exit 1 while something would change
pnpm github:settings apply          # back up, ask before each change, apply, read back
pnpm github:settings apply --yes    # the same without asking
```

Each finding is marked `=` already set, `~` to change, `!` for a person to do, `?` unreadable. `apply` writes a before-state file to the OS temporary directory (or `--backup DIR`) before its first change, applies each accepted change, reads the resource back and reports `applied`, `rejected: …` or `applied, but read back differs: …`. It never deletes a resource and never substitutes a weaker setting when GitHub rejects one; it reports the rejection.

What a person does after `apply`:

1. Set the secret in your own terminal: `gh secret set CLAUDE_CODE_OAUTH_TOKEN --env claude-live --repo sb-dev/pactwright`. Delete any repository-level secret of that name.
2. In pull request #62, the `live-claude` job must declare `environment: claude-live`.
3. Review the installed GitHub Apps the tool lists. Remove the permission to change workflow files from any app an agent uses. An agent then cannot change what reads a secret; the owner lands workflow changes instead.
4. Approve each `claude-live` and `npm-release` run in the web UI, after reading its workflow diff.
5. Run `audit` again after any manual change in the GitHub UI, and before each checkpoint task that adds a credential or a workflow.

## 7. Repository-wide practices

Settings alone do not make a repository safe to contribute to. These follow Open-Source Project Organisation §23 and need files or decisions, not API calls. None is part of this change.

| Practice | State | Next step |
| --- | --- | --- |
| `SECURITY.md` with a private channel | Present; names a private advisory and an email. | Keep private vulnerability reporting on (§5) so the advisory route works. |
| `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` | Present. | Add the intent-first rule to a pull-request template so every pull request names its intent or brief. |
| Issue templates | None. | Add `bug` and `intent` forms under `.github/ISSUE_TEMPLATE/`, matching the Delivery lifecycle. |
| `CHANGELOG.md` | Present. | Require an entry in the release procedure; `release.yml` asserts versions, not changelog entries. |
| Release tags | Protected by §5. | Sign tags, and record each release's provenance link in the changelog. |
| Dependabot | Version updates on `main`. | Security updates are enabled by §5; review grouped updates weekly. |
| Discussions or a support route | Off. | Enable Discussions, or name a channel in the README, so support questions stay out of the intent queue. |
| Decision records | Research logs and specs. | Record repository-level decisions like this one as research logs, as here. |

## 8. Residual risks

- Agents act as `sb-dev` and inherit the admin pull-request bypass. Only the environment approval stops them from using a secret or publishing.
- An API token with the owner's identity could approve a deployment. Give approvals only in the web UI.
- `pull_request_creation_policy` and `sha_pinning_required` may not be settable on a user-owned repository through the API. The tool reports a rejection; set them in the web UI.
- The tool was verified against an in-memory GitHub and a fake `gh`, not against the live repository. The first live `apply` is the proof; keep its backup file.

## 9. Revision record

Version 1 records the 2 October 2026 audit, the policy, the operator tool and the follow-up practices. It claims no change to repository settings.

**Pactwright — GitHub Repository Governance, Version 1**
