# PR #41 B3 — Relationships and Extension ownership

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Authorisation and definition history:** the owner requested resolution and fixes in this conversation; [the original SHA-bound outcome](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5802879622) identifies resolution `0363777` and cleanup `1bcd2ea`. The owner's subsequent instruction to address the new review is recorded in [the correction hand-off](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5808776011) at `1bcd2ea667ac32912b7af96a9978416379fc1b91`. This pass keeps the chosen direction while correcting the review findings, including the explicitly named compatibility changes. Core v3 and Checkpoint 1 v20 replace v2/v19 for new attempts; dependent specifications/checkpoints are amended at their owners. Earlier definitions and evidence remain in Git, not silently reused. No runtime or harness is implemented.

**Acceptance status:** [independent review 5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) returned changes required at `1bcd2ea`. The corrections below are applied for fresh review, not self-accepted. The inherited build failure remains a failed mandatory gate; B6 and the SHA-bound PR reply distinguish current checks from future acceptance.

**Dependencies:** B1/B2. **Owners:** Core §§4/6/15/45/54/56, Distribution §§10–12/15; S02/R09/AC12, S03/R01–R09/AC01–AC13, S05/R03–R04/AC04–AC05/AC12.

| Question / classification | Adopted answer; rationale |
|---|---|
| Q10 — ambiguous supersession scope | Core `supersedes` is replacement → predecessor for all five core types and registered Extension node types. Both endpoints have the same registered type. Non-node canonical contributions need no artificial node identity; their owners retain other versioning semantics. |
| Q11 — missing supersession cardinality | Reject self-links, cycles, multiple incoming and multiple outgoing supersession at Step 3. Step 4 fails affected lineage closed; Step 9 composes those checks. Do not force additional relations or the whole graph to be acyclic. |
| Q12 — ambiguous protected constraints | No core relation/type name reuse or replacement, even by an equivalent definition; no weakened endpoint, uniqueness, same-type, cycle or supersession-cardinality constraints. Failed registration leaves the effective registry unchanged. |
| Q13 — missing inactive-data contract | Unknown active relations/types are reported errors, never silently excluded. Disabled/removed Extension-owned stores are preserved, reported inactive and excluded from active hashing; active edges cannot resolve inactive endpoints. Re-enable only after successful registration/validation. Ambiguous legacy ownership needs migration, not guessed deletion. |
| Q19 — missing mechanism owner | Step 2 owns the canonical-contribution registry and optional node-projection validation; Step 3 validates edges against those projections; Step 5 hashes every registered canonical contribution. Step 16 installs declarations into those same mechanisms and repeats the proofs. Non-node contributions have owner/kind/key/value, not mandatory core frontmatter. |

Storage follows declared owner roots under `specs/extensions/<id>/`; `core` is reserved. An Extension cannot claim another owner's path or move core records/core-to-core lineage into its store. Additional cross-graph relations remain allowed. Owner-defined projections are versioned semantic formats, not an upgrade loophole.

## Cross-spec review and corrections

R1 confirms the first pass did not propagate Core §54 to all owners. Spec 03 §27, Spec 05 §24 and Spec 06 §20 now place canonical records below their `specs/extensions/<id>/` roots; Spec 07 §§7/11/12/19/20/25 and Checkpoints 02/05–08 route their owned files and cross-graph relations consistently. Reports remain in `docs/`, and configuration/execution provenance keep their non-canonical paths. Spec 03 §13 inherits core supersession instead of redeclaring it with different cardinality.

The owner-separated physical store deliberately reverses the released shared-file layout at `207ac08`: `src/loader.ts`, `src/extension/resolve.ts` and `tests/extension.test.ts` show Extension records in core storage and disabled types still registered. The alternative of retaining that physical layout was rejected because inactive data must be preserved without its implementation and excluded deterministically. Spec 02 §15 now supplies the explicit unambiguous-owner migration, with preserved bytes/prerequisites for unavailable ownership. This compatibility change is within the correction scope named in the linked owner hand-off; it is not independent acceptance.

R10 makes relation ownership, rather than source-node ownership, determine edge placement (except inherited `supersedes`, whose same-type owner stores it). S03/AC13 now tests reverse/wrong-owner placement and an explicitly placed valid cross-graph control. R11 tests duplicate Extension IDs and global endpoint/registration collisions; R12 adds Extension cross-type/core-type supersession negatives. For Q11, the rejected alternatives were allowing an acyclic split/merge or postponing its rejection to lineage validation; same-type supersession is a linear chain enforced by the shared edge validator, not a whole-graph DAG rule.

The non-node fixture is a declared future acceptance scenario and one frozen projection vector, not evidence that registration was executed. Independent Source/Domain identities remain intact; no Project Intelligence runtime was built. Spec 02 §§10–12 now own storage/decoder/schema/projection declarations and exact implementation locking, so Step 16 consumes that interface rather than inventing it.

[PR review F01](https://github.com/sb-dev/pactwright/pull/41#discussion_r4082729219) requires canonical Extension records in Step 5, not just edges or a later-only proof. R03/AC04 and the crosswalk preserve that positive obligation. Additional-relation controls still permit two-way links and enforce core rules afterwards.

**Verification:** five-vector probe includes a non-node record; contract schema/mappings pass the available checks in B6. Installed loading, disabling/re-enabling and migration were **not executed**; their owner is Step 16 (and Step 19 for runtime upgrade compatibility). The cited independent review returned this batch; these corrections require fresh review.

**PR #41 B3 v2**
