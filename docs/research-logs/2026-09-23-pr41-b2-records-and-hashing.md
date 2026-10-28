# PR #41 B2 — Canonical records and graph identity

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Authorisation and definition history:** the owner requested resolution and fixes in this conversation; [the original SHA-bound outcome](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5802879622) identifies resolution `0363777` and cleanup `1bcd2ea`. The owner's subsequent instruction to address the new review is recorded in [the correction hand-off](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5808776011) at `1bcd2ea667ac32912b7af96a9978416379fc1b91`. This pass keeps the chosen direction while correcting the review findings, including the explicitly named compatibility changes. Core v3 and Checkpoint 1 v20 replace v2/v19 for new attempts; dependent specifications/checkpoints are amended at their owners. Earlier definitions and evidence remain in Git, not silently reused. No runtime or harness is implemented.

**Acceptance status:** [independent review 5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) returned changes required at `1bcd2ea`. The corrections below are applied for fresh review, not self-accepted. The inherited build failure remains a failed mandatory gate; B6 and the SHA-bound PR reply distinguish current checks from future acceptance.

**Dependencies:** B1. **Owners:** Core §§6/9/45/54/56; S02/R04–R09 and AC01–AC13; S03/R08 and AC11; S05/R02–R07 and AC03–AC13.

| Question / classification | Adopted answer; alternatives rejected |
|---|---|
| Q05 — missing identity contract | Persist runtime-assigned `<type>-<slug>-<hex suffix>` and matching filename; retain IDs on load. Enforce well-formedness and unique graph endpoint IDs. Compare stored/proposed IDs to reject deletion or rename-plus-add. Do not recompute identity from current body content. |
| Q06 — missing immutability scope | Every stored core record, including unresolved Intent, and existing core edge tuples survive proposed mutations. Compare with the completely loaded store validated by the mutation plan, not a Git-history scan. Add records/edges and supersede explicitly. A single snapshot cannot prove historical tampering. |
| Q07 — missing canonical-content rule | Parse all Pactwright YAML under the pinned YAML 1.2.2 Core scalar/key profile; normalise body line endings and boundary whitespace only. Comments/key order/quoting are presentation; internal body whitespace, arrays and Unicode strings remain significant. Byte-only identity would make harmless formatting a semantic rewrite; Markdown rendering would erase meaningful differences. |
| Q08 — ambiguous schema versus judgement | Mandatory common envelope and Decision fields are structural. Body-owned meaning, exclusions, completeness, fidelity, concise rationale and factual Evidence use an independent cited review rubric with justified not-applicable decisions. Neither mandatory field proliferation nor a non-empty body proves quality. |
| Q09 — ambiguous actor representation | Persist both kind and identity as `decided_by: <kind>:<identity>`. Parsing is not authentication. This preserves the released representation; B4/B6 own actual policy checks. |
| Q18 — missing revision protocol | `pg1:sha256:<64 lower-case hex>` over the specified RFC 8785 envelope. Canonical contributions use owner/kind/key/value; edges remain directed tuples. Fixed ordering is UTF-16, not locale order. Versions/platforms preserve protocol bytes; incompatible protocols need a new identifier and explicit replay handling. Neither raw serialization nor runtime-dependent hashing is acceptable. |

The registry includes canonical non-node Extension records without imposing core fields (B3). Hashing requires a complete active load and full Core §§6/15/54 record, contribution, ownership and edge validation, including all required configuration/lifecycle/lock inputs. Core §44 lineage or §57 policy failure alone does not prevent hashing; positive controls cover that distinction. All contribution values share the interoperable JSON/Unicode/numeric domain.

## Evidence and probe

Primary serialization source: [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html). Released `src/graph/nodes.ts`, `schema.ts` and `ids.ts` at `207ac08507f9687be9eca105915bbd3db1e1dd4b` were inspected for the persisted envelope, actor attribution and allocation boundary; their implementation is not replacement authority.

Probe question, stated before execution: can pg1 produce fixed canonical bytes while preserving owner-defined non-node records, UTF-16 ordering and array order? A local Node 22.16.0 probe produced five [frozen vectors](../specs/fixtures/project-graph-revision-pg1.json); a separate Python serializer for those fixture values and `hashlib.sha256` reproduced every byte string and digest. Reordered lineage has the same digest; integer-like keys and supplementary Unicode order correctly. Empty-envelope digest: `7f839064b4647b19e70826f7a5f5640b5a4ee8d8467de3bb9f857f90d46faf49`.

This is executed definition-probe evidence, not a general JCS-library certification or execution of Pactwright's future verifier. The frozen fixtures must not be regenerated from the implementation under test. F02's hashing obligation is retained.

**Review corrections:** R8 pins scalar resolution and non-string-key rejection and adds stored-byte pg1 vectors, not just pre-parsed projections. R9 adds the complete structural failure boundary and a lineage-invalid positive control. R11 adds cross-owner/core endpoint collisions, duplicate relation ownership, reserved owner and invalid owner-decoded value controls to S02/AC12. The S02/R01–R03 and AC03 first-pass rewrites are obligation-preserving, not a change to the five core types or the transient-state exclusions. S02 now declares the contribution registry as an output, restores affected-ID diagnostics, and covers Unicode difference, upstream duplication and justified/unjustified not-applicable review outcomes.

The five original vector values remain unchanged. New vectors freeze exact stored UTF-8 bytes, including CRLF, comments, `flag: yes` and quoting/key-order differences. The committed vector-definition test checks those fixture bytes and expected hashes; it does not certify the full YAML profile or execute a product verifier. Primary scalar-resolution authority is [YAML 1.2.2 §10.3.2](https://yaml.org/spec/1.2.2/#1032-tag-resolution), including finite floating-point forms, not the review suggestion's abbreviated scalar list.

**Later proof:** Step 7 uses the runtime immutability API; Steps 8/12 repeat its guards through real CLI/adapter entries; Step 9 validates replay protocols; Step 16 proves installed declarations. Fresh independent review and mandatory gate disposition are recorded in B6.

**PR #41 B2 v2**
