# PR #41 B5 — Repository input identity

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Adoption:** the user's explicit instruction to resolve the questions and apply fixes authorises this design pass. Core v2 and Checkpoint 1 v19 are a material amendment, not an equivalent conversion or reuse of an earlier execution pass. Existing requirement/criterion IDs retain their obligation; refinements require reassessment at the new definition revision. No runtime, T3 harness or future verifiers are implemented here.

**Acceptance status:** decisions applied; mandatory checks and independent semantic acceptance pending. This writer's review is not independent acceptance. See B6 for the exact available/blocked validation results and final hand-off.

**Dependency:** B1/B2/B3 storage, canonical inputs and exclusions; no dependency on B4 policy. **Owner:** Core §56; S05/R01/R06 and AC01/02/07/08/11; requested replay at Step 9, diagnostics at Step 18.

**Q17 — missing observable replay-input contract.** Adopt `git:<object-format>:<full-commit-id>` for a clean committed input base. Reject missing Git/HEAD, staged or unstaged tracked changes, non-ignored untracked inputs and required inputs absent from the commit. Ignored generated/dependency output is outside the repository base; required canonical/configuration/lock files cannot evade tracking through ignore rules. Required external/LFS/submodule content needs reconstructible verified provenance or pinned replay fails.

A tree alone omits commit identity; a working-tree hash promises reconstruction without retained bytes; an automatic snapshot/archive would add infrastructure not justified here. Existing Git mechanisms suffice for restoration in isolation. The resolver must not commit, stash, reset, add or delete files to make an identity available. Graph-only diagnostics/hashing can work without Git; execution environment identity remains separate.

## Bounded probe

Question stated before execution: can read-only Git inspection distinguish clean, changed and ignored required inputs reliably? An isolated temporary Git 2.47.3 fixture produced:

| Case | Observed result |
|---|---|
| No commit | `git rev-parse --verify 'HEAD^{commit}'` exited 128. |
| Clean commit | Full SHA-1 commit identity resolved; porcelain status empty. |
| Unstaged/staged tracked edit | Porcelain reported ` M tracked` / `M  tracked`. |
| Non-ignored untracked file | Porcelain reported `?? untracked`. |
| Ignored required input | Status remained empty, but `git cat-file -e <commit>:ignored/required.yml` exited 128. |
| Repeated inspection | Index bytes unchanged with `GIT_OPTIONAL_LOCKS=0`. |

The ignored-input case demonstrates why status alone is insufficient. Fixture creation/reset was explicit probe setup, not proposed resolver behaviour. This proves Git mechanics, not a Pactwright resolver implementation.

Primary references: [git-status](https://git-scm.com/docs/git-status), [git-rev-parse](https://git-scm.com/docs/git-rev-parse). No new snapshot service or runtime feature is built.

**Verification:** local probe passed; S05 schema and mappings passed the available subset in B6. Actual S05 acceptance/replay and independent review remain pending.

**PR #41 B5 v1**
