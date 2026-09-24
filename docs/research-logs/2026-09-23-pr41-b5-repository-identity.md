# PR #41 B5 — Repository input identity

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Authorisation and definition history:** the owner requested resolution and fixes in this conversation; [the original SHA-bound outcome](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5802879622) identifies resolution `0363777` and cleanup `1bcd2ea`. The owner's subsequent instruction to address the new review is recorded in [the correction hand-off](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5808776011) at `1bcd2ea667ac32912b7af96a9978416379fc1b91`. This pass keeps the chosen direction while correcting the review findings, including the explicitly named compatibility changes. Core v3 and Checkpoint 1 v20 replace v2/v19 for new attempts; dependent specifications/checkpoints are amended at their owners. Earlier definitions and evidence remain in Git, not silently reused. No runtime or harness is implemented.

**Acceptance status:** [independent review 5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) returned changes required at `1bcd2ea`. The corrections below are applied for fresh review, not self-accepted. The inherited build failure remains a failed mandatory gate; B6 and the SHA-bound PR reply distinguish current checks from future acceptance.

**Dependency:** B1/B2/B3 storage, canonical inputs and exclusions; no dependency on B4 policy. **Owner:** Core §56; S05/R01/R02/R06 and AC01/02/03/07/08/11/15; requested replay at Step 9, diagnostics at Step 18. Cross-spec consequence owners are Spec 04 §§8/19/20, Spec 07 §§18–19 and Checkpoints 2/4.

**Q17 — missing observable replay-input contract.** Adopt `git:<object-format>:<full-commit-id>` for a clean committed input base. Reject missing Git/HEAD, staged or unstaged tracked changes, non-ignored untracked inputs and required inputs absent from the commit. Ignored generated/dependency output is outside the repository base; required canonical/configuration/lock files cannot evade tracking through ignore rules. For this initial repository-identity profile, required external-only/LFS/submodule content and a project root below the Git top level explicitly make repository identity unavailable; no snapshot or transport fallback is invented. Graph hashing remains local-root based and available without Git when the required active load is complete.

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

**Review corrections:** R13 checks every required input against the commit, not just canonical files or status: ignored config/lifecycle/lock/active Extension inputs and an untracked empty record directory fail; a tracked empty `.gitkeep` is a valid control. R14 requires pg1 from actual loaded bytes without Git and after uncommitted canonical edits. S05/AC15 tests full SHA-1/SHA-256 identity grammar and rejects abbreviations/ref names/malformed values. AC08 restores existing repository mechanisms; Step 9, not early Step 5, owns observable pinned-execution refusal.

R16 makes complete replay-base preflight precede an execution attempt. Unavailable identity yields a reported refusal and no replay record; a later execution failure yields provenance against the successfully resolved base. Written provenance must be committed before another pinned invocation. Specs 04/07 and Checkpoints 2/4 now carry these consequences, including the second-run dirty-provenance control. Doctor severity is warning for otherwise valid graph-only inspection and action required for requested pinned work. These are required future integration proofs, not executed runtime behaviour.

The earlier probe is retained as historical evidence only; reproducible current checks and the required fresh independent review are recorded in B6.

**PR #41 B5 v2**
