# Pactwright — Open Question Resolution Methodology

**Version:** 1  
**Date:** 23 September 2026  
**Purpose:** Resolve related open questions together and apply the necessary specification and acceptance changes before implementation.

## 1. Scope and authority

This method supports T2 in [Spec 00](specs/00-checkpoint-step-contract-and-delivery-tasks.md). It can be applied to one stage without declaring the whole checkpoint ready.

Canonical specifications define product meaning. Checkpoint contracts allocate that meaning to requirements, acceptance criteria and implementation order. Existing code, tests and PR comments are evidence, not replacement authority.

The method is:

```text
Inventory → classify → batch → resolve → apply fixes → verify → independent review
                               ↑                              │
                               └──── bounded correction ─────┘
```

This document contains instructions, not execution progress. Use existing execution records and SHA-bound PR hand-offs for assignments, decisions, evidence and review outcomes. Resolving questions does not implement the runtime or satisfy product acceptance.

## 2. Establish the inputs

Before starting a resolution pass, identify the repository, branch, PR, starting commit, question inventory, affected stage and permitted changes. Read the current owning specifications, step contracts, crosswalk and relevant reviews at that revision.

Keep original question IDs and wording. Split a compound question into named subquestions in its decision record when necessary, retaining the parent ID. Record affected requirement/criterion IDs and any later steps whose behaviour depends on the answer.

Do not infer that a question is resolved from a branch name, a previous summary or a passing schema check. Verify the actual clauses and evidence. Preserve unrelated changes and previously produced execution evidence.

## 3. Classify each question

| Classification | Treatment |
|---|---|
| Already specified | Cite the governing clause. Correct missing or inaccurate checkpoint wording or coverage; do not reopen a settled decision. |
| Ambiguous, contradictory or missing requirement | Resolve the intended behaviour and compatibility consequences, then amend the owning specification and affected contracts. |
| Internal implementation choice | Leave the choice to implementation within explicit constraints. Do not prescribe helper names or module layouts without a requirement-based reason. |
| Later-stage concern | Name the owning step and proof. Defer execution only when the current stage does not require an unresolved answer. |

A useful test is: **Could two reasonable implementations make different externally observable choices about the intended behaviour and both pass the current criteria?** If so, clarify the requirement or acceptance coverage before implementation.

Storage formats, identity rules, revision protocols and failure behaviour are not merely internal choices when they affect persisted data, public interfaces or compatibility.

## 4. Batch by shared decisions

Group questions when answering one constrains the answer to another: the same identity model, representation, invariant, authority boundary or failure policy. Do not batch solely by question number or filename.

Give each question one owning batch and record dependencies on other batches. A batch should produce one coherent set of decisions and an independently reviewable change. Split unrelated decisions; combine inseparable ones. A single substantial question may form a batch.

Order batches by their actual decision dependencies. If two batches need each other's unresolved answers, resolve that shared decision jointly rather than pretending the dependency is settled. Parallel investigation is allowed only where inputs are independent; publish shared-file changes through one writer at a time.

### Example: Checkpoint 1, Stage 1

This is a starting grouping of Q01–Q20 from the [crosswalk snapshot](https://github.com/sb-dev/pactwright/blob/3c053bd622630c2e460d8cec40a633ead884873f/docs/checkpoints/01-self-hosted-delivery/crosswalk.yml), not a resolution or progress report. Confirm dependencies during classification.

| Batch | Questions | Decisions considered together |
|---|---|---|
| B1 — Package, storage and loading | Q01–Q04 | Package location, storage layout, compatibility, parse failures and unsupported configuration. |
| B2 — Canonical records and graph identity | Q05–Q08, Q18 | Record identity, immutability, schema versus review obligations, canonical content, serialisation and graph-revision hashing. |
| B3 — Relationships and extension ownership | Q10–Q13, Q19 | Supersession scope/cardinality, protected core constraints, unregistered relations and the extension-record registration mechanism. |
| B4 — Lineage and authority | Q09, Q14–Q16 | Actor attribution, current-lineage multiplicity, withdrawal of a proceeding Decision and policy enforcement. |
| B5 — Repository input identity | Q17 | Which repository state is identified, changed/untracked inputs and behaviour without Git; keep this identity distinct from graph revision. |
| B6 — Cross-stage integration obligations | Q20 | Reconcile later loading, mutation and installed-extension proofs with the decisions from B1–B5. |

For example, B2 must align identity, immutability and normalisation rather than selecting a hash algorithm in isolation. B3 must use B2's record rules; B4 must use B3's relationship rules. B5 consumes the relevant storage and exclusion decisions. B6 confirms the resulting obligations have owners. Cross-batch conflicts return to the owning decisions before adoption.

## 5. Resolve one batch and apply its fixes

| Activity | Required result |
|---|---|
| Trace authority | For every question, identify the exact governing clauses, conflicting interpretations and affected acceptance cases. Distinguish requirements from historical implementation choices. |
| Compare and investigate | For genuine decisions, compare a few viable options against correctness, compatibility, simplicity and later-feature use. Research primary sources or run a bounded probe only when it can change the decision. State the question the probe answers before running it. |
| Select and authorise | Recommend one consistent answer, with rationale and consequences. Obtain any required semantic or compatibility approval before adoption; reuse existing explicit authorisation. Unresolved authority blocks dependent work, not unrelated batches. |
| Apply necessary fixes | Update the owning specification, affected step contracts and traceability together. A decision note alone does not repair an ambiguous contract. If no change is necessary, cite the existing clause and demonstrate adequate coverage. |
| Verify and review | Check the changed documents and mappings, then obtain independent review of the integrated result. Correct specific findings within the batch and repeat affected checks. |

### Apply changes at their owner

Amend the canonical specification first when meaning changes. Replace conflicting wording instead of appending another qualification that readers must reconcile. Check other owning specifications for consequences.

Update affected step requirements, acceptance scenarios, verification bindings, prerequisites and shared constraints. Preserve IDs when meaning is unchanged; make material replacement explicit and retain traceability. Keep the checkpoint file structure and original crosswalk quotes. Update obligation mappings without deleting historical questions to manufacture closure.

Acceptance must distinguish the chosen behaviour from the rejected alternatives. Include valid controls, relevant negative cases, forbidden side effects and applicable compatibility cases. Each listed case needs its own result. Use review rubrics for judgement-based qualities rather than pretending they are deterministic schema rules.

Allocate cross-stage proofs explicitly. Decide the early mechanism and later integration responsibility now; execute the installed-extension, lifecycle or other production proof only when its prerequisites exist. A fixture does not establish the later integrated capability.

Increment affected document versions by whole numbers and update their footers. Preserve the definition revision used by any existing execution. Material changes to active work require an explicit amendment and review of affected evidence, not a silent rewrite or an automatic restart of the whole stage.

Do not build runtime features, the harness or all future verifier implementations during this resolution pass. Small decision probes and necessary contract-validation fixes are within scope only when authorised. Keep temporary experiments separate from product code.

## 6. Record and verify the result

Use the existing question inventory and one compact decision record per batch in the repository's normal decision/research-record location. Do not create another acceptance database or duplicate plan.

A batch record contains:

```text
Batch and question IDs; starting source/contract revisions
Owning clauses; dependencies; affected requirement and criterion IDs
Answer for each question; rationale and alternatives where needed
Evidence and required approval references
Applied changes, or why no change is needed
Later proof owners and remaining blockers
Verification results and independent review reference
```

Link the record from the PR or supported inventory fields. Do not add unsupported metadata to contract YAML merely to track progress.

Run the available repository checks against the changed tree, including `pnpm contracts:check` and the required verification commands. Report exact commands, revisions, results and skipped checks. Do not describe an inherited build failure as a new pass or fix unrelated product code to hide it.

Schema, citation and mapping checks establish structural consistency, not semantic correctness. Future verifier IDs establish obligations, not executed proof. The independent reviewer must compare the actual specification and contract changes with the original questions and intended outcomes.

The reviewer checks that every question has a supported disposition, necessary approval exists, criteria reject the relevant wrong behaviours, dependencies are feasible and no requirement disappeared. A reviewer who authors a correction must obtain fresh review of that correction.

A batch is resolved only when its decisions are adopted, necessary fixes are applied, required checks are satisfactory and independent review accepts the result. A later-stage disposition must identify its owner and prove it does not leave a current-stage dependency unresolved. An environment-blocked mandatory check remains pending.

## 7. Stage-level exit

After the batches, review the stage as a whole: identity, storage, relationships, authority, failure behaviour and revisions must agree across the affected contracts. Check cumulative changes, not merely individual batch approvals. Reopen only decisions and evidence affected by a discovered conflict.

The stage is requirement-ready when no unresolved behaviour needed by its steps remains; each obligation has precise acceptance coverage; and deferred integration proofs have explicit owners and prerequisites. Discretionary internal implementation choices may remain open within those constraints.

This result is scoped T2 work. It does not declare all T1/T2 complete, bypass harness construction and testing, or authorise implementation before the remaining checkpoint-level prerequisites are met.

**Pactwright — Open Question Resolution Methodology v1**
