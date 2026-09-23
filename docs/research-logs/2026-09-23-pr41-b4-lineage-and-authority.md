# PR #41 B4 — Current lineage and authority

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Adoption:** the user's explicit instruction to resolve the questions and apply fixes authorises this design pass. Core v2 and Checkpoint 1 v19 are a material amendment, not an equivalent conversion or reuse of an earlier execution pass. Existing requirement/criterion IDs retain their obligation; refinements require reassessment at the new definition revision. No runtime, T3 harness or future verifiers are implemented here.

**Acceptance status:** decisions applied; mandatory checks and independent semantic acceptance pending. This writer's review is not independent acceptance. See B6 for the exact available/blocked validation results and final hand-off.

**Dependencies:** B2/B3. **Owners:** Core §§9/15/31/44/45/55/57; S04/R01–R06/AC01–AC10; integration Steps 6–9/16/24.

| Question / classification | Adopted answer; alternatives rejected |
|---|---|
| Q14 — missing current-record cardinality | At most one current Decision/Contract/Brief/Evidence per Intent direction. Competing Briefs/Evidence are ambiguity, not implicit parallel delivery. Validate same-parent replacement scopes and reject one current Contract shared by different Intent directions. Independent Intent directions remain valid. |
| Q15 — ambiguous withdrawal | Reject/defer may supersede proceed. The old Contract and descendants stay stored but cease to be current through their withdrawn Decision; no fake replacement Contract or cross-type edge is created. Re-authorise with a fresh Decision/Contract, superseding the previous Decision and last Contract where present, without reviving old Brief/Evidence. |
| Q16 — ambiguous policy boundary | Derive recorded authority from canonical structure and actor syntax only. Current lifecycle policy and trusted invoking actor are enforced by mutation/execution guards; integrated validation reports current unauthorised Decisions. A valid lineage does not grant permission to run. |

Changing current policy does not edit historical Decisions or their graph revision, and does not retroactively invalidate withdrawn Decisions solely because their actors are no longer permitted. A requested historical authority check requires the historical policy. A superseded Intent's descendants are inactive; a replacement Intent starts without inherited authorisation.

The rejected alternatives—arbitrarily choosing among competing current records, retaining a withdrawn Contract as authorised, conflating a Gate with a Decision, or allowing actor syntax to grant authority—have explicit negative criteria. Positive controls cover all six broad states, valid supersession, withdrawal/re-authorisation and unaffected Intent diagnostics. Any incomplete whole-repository load remains non-executable.

**Verification:** self-review traced these decisions through S04 and the added real Step 6–9/16/24 obligations. Schema, local references and mappings passed the available subset. No lifecycle authority or runtime mutation was executed. Independent acceptance is pending; details and hand-off are in B6.

**PR #41 B4 v1**
