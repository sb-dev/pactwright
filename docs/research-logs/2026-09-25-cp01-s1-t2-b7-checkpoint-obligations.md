# CP01 Stage 1 T2 — B7: Checkpoint-wide obligations and review bindings

**Scope:** full T2 pass on Checkpoint 1 Stage 1 (CP01-S01…S05) on `refactor/pactwright-v2`, starting at `8e7804f`. Inputs: Core v3, Distribution v2, OSS v2, Guide 16, Principles 4, Checkpoint 1 v24, Spec 00 v5, methodology v2, contract format 2. PR #41 resolved Q01–Q20 in B1–B6 ([B1 record](2026-09-23-pr41-b1-loading.md)), and review 5301803981 passed its corrections. This pass keeps those decisions. It inventories residual gaps as new questions from Q57 and dispositions the later questions Q21–Q56 that reach Stage 1.

**Authorisation:** in this session, the owner asked for T2 on the Stage 1 steps with questions resolved by the methodology. The owner then chose the full Stage 1 pass (fresh review plus new questions) over a stage-exit-only check and approved the plan that recommends the Step 25 self-hosting threshold. The PR for this branch records that hand-off; the owner's review of the PR is the approval of the Principles §3 semantic change. No runtime, harness or verifier implementation is built.

**Batch order:** B7 (this record) → B8 loader → B9 records → B10 edges → B11 lineage → B12 revision → B13 integration and stage exit. B8–B12 use the binding definitions defined here. B13 records the verification and review results.

## Questions

| Question / classification | Answer and rationale |
|---|---|
| Q57 — missing requirement | Four shared requirements, each with a review criterion. **R02 simplicity** (Principles §20, Distribution §25): additions must trace to an accepted requirement. **R03 graph boundary** (Principles §12, Core §§55/58): non-Delivery and execution state never become core truth, and after Step 25 the repository's own canonical graph changes only through runtime mutations. **R04 self-hosting threshold**: acceptance of CP01-S25. Principles §3 now states the general rule (mandatory from the acceptance of the step that makes a capability work in the Pactwright repository) and the CP01 value. |
| Q58 — ambiguous | CP01/AC01 now runs from a fresh checkout of the exact candidate revision: `pnpm install --frozen-lockfile`, then `pnpm verify`. This applies Guide "Verification" and Spec 00 T5's "prevent … stale binaries". The ID is kept because the obligation is unchanged; the clarified run environment is recorded here. |
| Q59 — missing format and definitions | `checkpoint.yml` gains a `bindings` map defining each review binding (`method`, `role`, `rubric`, `pass`, `evidence`) and each approval binding (`method`, `authority`, `effect`, `evidence`). All six Stage 1 review bindings are defined. The rubrics settle the unclear points: preserving declarations, inventorying roots, the generic seam and test fixtures are allowed, while decoding or activating a named Extension is not; the run model supplies the content reviewer, and S02 ships no rubric artefact; user-authored extra frontmatter is allowed canonical content with no authority (Core §6, already specified) and must be ignored by derivation. |
| Q60 — missing | The review policy is shared requirement R05 with criterion AC05 and binding `review.independent-step`. The reviewer did not produce the candidate or author its tests. The rubric covers meaning, per-case results, tests rejecting plausible wrong implementations, and no contract weakening. |

Rejected alternatives:
- Self-hosting at CP01-S12, when the adapter exists: no installed, initialised consumer exists until S23/S25, so this threshold would force pre-installation self-governance.
- Self-hosting at S26: S25 already makes the repository a valid Pactwright project, so later work there needs no further capability.
- Binding definitions as separate files, or in each step: this duplicates the policy and breaks "declared once" (Spec 00 §2).
- Treating undefined bindings as errors now: this would fail the unreviewed Stages 2–5. Their bindings are listed as T2 inputs instead.

## Challenge plan and why

The risks are a definition that the checker accepts while it is unused or mismatched, a Stage 1 binding silently left undefined, and a threshold that contradicts Stage 7.

- **Planted defects:** an unused definition and a method mismatch each produce the specific error.
- **Stage 1 coverage test:** a test asserts that no checkpoint-wide or S01–S05 criterion uses an undefined binding. Removing one definition made the test fail, and restoring it made it pass (executed locally).
- **Stage 7 fit:** read Step 25/26 prose. S25 makes Pactwright a valid Pactwright project, and S26 is the first real self-hosted Delivery. R04 therefore applies from S26 onwards.
- **Cross-document consistency:** grep for other threshold statements. The first pass missed the Principles §21 open-gap bullet (review finding M1). It now names only thresholds that checkpoints have not yet declared.

## Applied changes

- `checkpoint.yml`: source `CONTRACT`; R02–R05 with AC02–AC05; AC01 clarified; `bindings` for 4 checkpoint-wide and 6 Stage 1 review bindings.
- `contract.schema.json`: `bindings` with review and approval definition shapes; binding ID pattern shared with use sites.
- `scripts/checkpoint-contracts.ts`: definitions must be used and match method; undefined review/approval uses are reported, not failed.
- `tests/checkpoint-contracts.test.ts`: three planted defects (unused definition, method mismatch, approval definition without effect) and the Stage 1 coverage test.
- Spec 00 v6 §§2–3 and Principles v5 §3.
- Crosswalk: Q57–Q60 appended.

## Review corrections

Independent review of `6f08a78` (recorded in B13) accepted with fixes:
- **M1:** Principles §21 bullet reworded.
- **M2:** the graph-boundary and self-hosting rubrics now trace commits to the producing runtime or adapter command and to existing execution state or provenance, and forbid a new mutation log (Core §55).
- **M3:** R04 applies per change after CP01-S25 acceptance, including corrective re-runs and contract-named operations such as S31 Intent capture. AC04 has one case for each.
- **Minor:**
  - R03 now cites CORE#54 and uses the "acceptance of CP01-S25" anchor;
  - the simplicity rubric covers Distribution §25 and test-only helpers;
  - `review.independent-step` covers inherited criteria and outputs;
  - GitHub provisioning is scoped to GitHub clients;
  - CP01-S04/AC05 names fields the runtime writes or reads, per Core §6;
  - an approval-definition schema test is added.
- **Not changed:** the Stage 1 "must be defined" rule stays a test, not a checker option. The contracts carry no progress metadata, so the checker cannot know which steps passed T2 (methodology §6).

**Later owners:** R03/R04 bind every later step, and their first real evidence arises at S26. The review bindings of Stages 2–5 (17 uses, listed by `contracts:check`) are defined during those stages' T2.

Verification results and independent review are recorded in B13.

**CP01 Stage 1 T2 B7 v2**
