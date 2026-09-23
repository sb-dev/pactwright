# PR #41 B2 — Canonical records and graph identity

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Adoption:** the user's explicit instruction to resolve the questions and apply fixes authorises this design pass. Core v2 and Checkpoint 1 v19 are a material amendment, not an equivalent conversion or reuse of an earlier execution pass. Existing requirement/criterion IDs retain their obligation; refinements require reassessment at the new definition revision. No runtime, T3 harness or future verifiers are implemented here.

**Acceptance status:** decisions applied; mandatory checks and independent semantic acceptance pending. This writer's review is not independent acceptance. See B6 for the exact available/blocked validation results and final hand-off.

**Dependencies:** B1. **Owners:** Core §§6/9/45/54/56; S02/R04–R09 and AC01–AC13; S03/R08 and AC11; S05/R02–R07 and AC03–AC13.

| Question / classification | Adopted answer; alternatives rejected |
|---|---|
| Q05 — missing identity contract | Persist runtime-assigned `<type>-<slug>-<hex suffix>` and matching filename; retain IDs on load. Enforce well-formedness and unique graph endpoint IDs. Compare stored/proposed IDs to reject deletion or rename-plus-add. Do not recompute identity from current body content. |
| Q06 — missing immutability scope | Every stored core record, including unresolved Intent, and existing core edge tuples survive proposed mutations. Compare with the current validated store, not a Git-history scan. Add records/edges and supersede explicitly. A single snapshot cannot prove historical tampering. |
| Q07 — missing canonical-content rule | Parse frontmatter; normalise body line endings and boundary whitespace only. Comments/key order/quoting are presentation; internal body whitespace, arrays and Unicode strings remain significant. Byte-only identity would make harmless formatting a semantic rewrite; Markdown rendering would erase meaningful differences. |
| Q08 — ambiguous schema versus judgement | Mandatory common envelope and Decision fields are structural. Body-owned meaning, exclusions, completeness, fidelity, concise rationale and factual Evidence use an independent cited review rubric with justified not-applicable decisions. Neither mandatory field proliferation nor a non-empty body proves quality. |
| Q09 — ambiguous actor representation | Persist both kind and identity as `decided_by: <kind>:<identity>`. Parsing is not authentication. This preserves the released representation; B4/B6 own actual policy checks. |
| Q18 — missing revision protocol | `pg1:sha256:<64 lower-case hex>` over the specified RFC 8785 envelope. Canonical contributions use owner/kind/key/value; edges remain directed tuples. Fixed ordering is UTF-16, not locale order. Versions/platforms preserve protocol bytes; incompatible protocols need a new identifier and explicit replay handling. Neither raw serialization nor runtime-dependent hashing is acceptable. |

The registry includes canonical non-node Extension records without imposing core fields (B3). Hashing depends on canonical schema/endpoint integrity, not execution policy or acceptance of the current lineage; review may identify a stored graph that cannot execute. All contribution values share the interoperable JSON/Unicode/numeric domain.

## Evidence and probe

Primary serialization source: [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html). Released `src/graph/nodes.ts`, `schema.ts` and `ids.ts` at `207ac08507f9687be9eca105915bbd3db1e1dd4b` were inspected for the persisted envelope, actor attribution and allocation boundary; their implementation is not replacement authority.

Probe question, stated before execution: can pg1 produce fixed canonical bytes while preserving owner-defined non-node records, UTF-16 ordering and array order? A local Node 22.16.0 probe produced five [frozen vectors](../specs/fixtures/project-graph-revision-pg1.json); a separate Python serializer for those fixture values and `hashlib.sha256` reproduced every byte string and digest. Reordered lineage has the same digest; integer-like keys and supplementary Unicode order correctly. Empty-envelope digest: `7f839064b4647b19e70826f7a5f5640b5a4ee8d8467de3bb9f857f90d46faf49`.

This is executed definition-probe evidence, not a general JCS-library certification or execution of Pactwright's future verifier. The frozen fixtures must not be regenerated from the implementation under test. F02's hashing obligation is retained.

**Later proof:** Step 7 uses the immutability guard through every public entry; Step 9 validates replay protocols; Step 16 proves installed contributions. **Independent review:** pending. Mandatory checks remain pending as recorded in B6.

**PR #41 B2 v1**
