# PR #41 B3 — Relationships and Extension ownership

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Adoption:** the user's explicit instruction to resolve the questions and apply fixes authorises this design pass. Core v2 and Checkpoint 1 v19 are a material amendment, not an equivalent conversion or reuse of an earlier execution pass. Existing requirement/criterion IDs retain their obligation; refinements require reassessment at the new definition revision. No runtime, T3 harness or future verifiers are implemented here.

**Acceptance status:** decisions applied; mandatory checks and independent semantic acceptance pending. This writer's review is not independent acceptance. See B6 for the exact available/blocked validation results and final hand-off.

**Dependencies:** B1/B2. **Owners:** Core §§4/6/15/45/54/56, Distribution §10; S02/R09/AC12, S03/R01–R09/AC01–AC13, S05/R03–R04/AC04–AC05/AC12.

| Question / classification | Adopted answer; rationale |
|---|---|
| Q10 — ambiguous supersession scope | Core `supersedes` is replacement → predecessor for all five core types and registered Extension node types. Both endpoints have the same registered type. Non-node canonical contributions need no artificial node identity; their owners retain other versioning semantics. |
| Q11 — missing supersession cardinality | Reject self-links, cycles, multiple incoming and multiple outgoing supersession at Step 3. Step 4 fails affected lineage closed; Step 9 composes those checks. Do not force additional relations or the whole graph to be acyclic. |
| Q12 — ambiguous protected constraints | No core relation/type name reuse or replacement, even by an equivalent definition; no weakened endpoint, uniqueness, same-type, cycle or supersession-cardinality constraints. Failed registration leaves the effective registry unchanged. |
| Q13 — missing inactive-data contract | Unknown active relations/types are reported errors, never silently excluded. Disabled/removed Extension-owned stores are preserved, reported inactive and excluded from active hashing; active edges cannot resolve inactive endpoints. Re-enable only after successful registration/validation. Ambiguous legacy ownership needs migration, not guessed deletion. |
| Q19 — missing mechanism owner | Step 2 owns the canonical-contribution registry; Step 3 adds node/edge integration; Step 5 hashes every registered canonical contribution. Step 16 installs declarations into those same mechanisms and repeats the proofs. Non-node contributions have owner/kind/key/value, not mandatory core frontmatter. |

Storage follows declared owner roots under `specs/extensions/<id>/`; `core` is reserved. An Extension cannot claim another owner's path or move core records/core-to-core lineage into its store. Additional cross-graph relations remain allowed. Owner-defined projections are versioned semantic formats, not an upgrade loophole.

## Cross-spec review and corrections

Spec 03 §§5/8 uses independent Source/Domain identities and §27 explicitly permits storage paths to evolve. A first draft's shared core-envelope assumption would have conflicted with these schemas; it was removed before adoption. The fixture therefore includes a canonical **non-node** record with its own fields as well as an optional node projection. Distribution §10 preservation and dependency rules remain intact. No Project Intelligence implementation is introduced.

[PR review F01](https://github.com/sb-dev/pactwright/pull/41#discussion_r4082729219) requires canonical Extension records in Step 5, not just edges or a later-only proof. R03/AC04 and the crosswalk preserve that positive obligation. Additional-relation controls still permit two-way links and enforce core rules afterwards.

**Verification:** five-vector probe includes a non-node record; contract schema/mappings pass the available checks in B6. Installed loading, disabling/re-enabling and migration were **not executed**; their owner is Step 16 (and Step 19 for runtime upgrade compatibility). Independent review reference: pending.

**PR #41 B3 v1**
