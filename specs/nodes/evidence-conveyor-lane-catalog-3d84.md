---
id: evidence-conveyor-lane-catalog-3d84
type: evidence
title: Product-spec lane implemented — the eight-file lane catalog and the .gitignore negation that admits it, seven implementer agents, four agent corrections, and the .gitattributes merge rule
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-lane-catalog-2d5b` (lane `product-spec`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`2f86187`: twenty-one files, +535/−22, plus the `contract-reviewer.md` lifecycle re-point described
under Acceptance 9 below. No TypeScript, no schema, no graph data of its own, no test.

## What landed — the lane market surface (Scope 8)

**The `.gitignore` negation, first and in the same commit — the single highest-leverage line in the
lane.** Before this change `git check-ignore -v .claude/lanes/product-spec.md` exited 0 printing
`.gitignore:10:.claude/*`: the catalog was ignored, `git add -A` would silently skip all eight
files, and nine of the thirteen drift-pin legs would have passed over an empty set. `!.claude/lanes/`
now sits directly below `!.claude/commands/`. Re-verified for this evidence: `check-ignore` exits
**1** with no output, and `git ls-files .claude/lanes` lists exactly **eight** paths whose basenames
equal `CLAUDE.md`'s lane-table first column and `brief-lane-valid`'s `keys`. Contract Risk 3 and
brief Risk 3 are closed by measurement, not by assertion.

**CC-16's pattern half — the trap is documented, not just sprung once.** A comment above
`.claude/*` states the deny-then-negate rule: `.claude/*` denies everything, every directory that
must reach the repo needs its own `!.claude/<dir>/` line immediately below, a new subdirectory
without one is invisible to git *and to CI* so every assertion over it passes vacuously, and
`git check-ignore -v <path>` is the standing one-command check. The inverted alternative — delete
`.claude/*` and deny-list `settings.local.json` and `scheduled_tasks.lock` individually — was
**rejected and the rejection recorded**: it fails open for the next local-only file under
`.claude/`, and a leak is worse than a vacuous pin. This is the "fix the pattern, not the instance"
discharge; the anti-vacuity leg that makes it enforced is `test-verification`'s.

**Eight catalog files at `.claude/lanes/<lane>.md`,** filenames exactly the CLAUDE.md table's first
column. Each carries exactly two frontmatter fields — `eligible_agents` and `default_agent` — and
exactly two H2 sections. **No `lane:` key:** the filename is the lane id and union leg 1 already
pins the filename set to the table, so a `lane:` field would have been an uncovered fifth copy of
the lane list. Verified programmatically for this evidence, all eight files:

- `## Owns` is **exactly one line** and byte-equal to its CLAUDE.md cell under the pinned
  normalization (`trim()` + whitespace-collapse + NFC). No trailing period, no backticks, no
  emphasis, no second paragraph — the normalization `test-verification`'s leg 6 applies is the only
  one needed.
- `default_agent ∈ eligible_agents`, and every named agent resolves to an existing
  `.claude/agents/<name>.md`.
- `test-verification`'s `eligible_agents` deep-equals `["test-writer"]` **exactly**. This is the
  security panel's recorded credit and the point of the field: CLAUDE.md's rule that verification is
  "never the same invocation that implemented the code under test" becomes machine-checked rather
  than prose-enforced, because the verification lane cannot be owned by an implementer agent.
- `## Dependency hints` is acyclic and every lane named in a hint is a catalog member. A topological
  order was produced as the witness: `data-migration`, `product-spec`, `docs-spec`,
  `domain-backend`, `api-integration`, `frontend-ui`, `observability-release`, `test-verification`.
  **Deviation recorded, not hidden:** the brief's step 3 states a different witness order
  (`product-spec`, `data-migration`, `domain-backend`, `frontend-ui`, `api-integration`,
  `observability-release`, `docs-spec`, `test-verification`). Both are valid topological orders of
  the same hint graph — Kahn's algorithm admits many, and the brief's Acceptance 4 asks that the
  edges "admit a topological order", not that one specific order be reproduced. The property is
  satisfied; only the tie-break differs.

**Seven implementer agents,** one per non-verification lane: `product-spec-writer`,
`backend-implementer`, `ui-implementer`, `migration-implementer`, `api-implementer`,
`ops-implementer`, `docs-implementer`.

## The privilege expansion, and every fence it required (A10, CC-2)

A10's risk entry lives in the brief because the approved contract body is never edited. What landed
is its mitigation set.

**The count, verified rather than asserted.** `grep -n '^tools:' .claude/agents/*.md` now shows
**nine new `Bash` grants** — the seven implementers, `test-writer`, `contract-reviewer` — taking the
repo from **one** `Bash`-holding agent (`graph-maintainer`) to **ten**. Confirmed for this evidence:
ten of the twenty-two agent files carry `Bash`. The brief's warning that prose saying the change
"takes that to nine" is off by one held: the enumerated nine are *new* grants, and ten is the
resulting total.

**Every `tools:` line is the coordinated literal.** All seven implementers and `test-writer` read
`tools: Read, Write, Edit, Bash` — the byte-identical string `graph-maintainer.md` already carried,
so `test-verification`'s CC-2 pin compares one string across nine files. `contract-reviewer` reads
`tools: Read, Grep, Bash`. `spec-writer` still reads `tools: Read, Grep, Glob` and
`integration-reviewer` still reads `tools: Read, Grep` — **neither gained `Bash`**, as pinned. Not
one line differs by a space.

**Every grant is fenced and every fence is written down.** Verified by reading all nine bodies. Each
of the seven implementers states, in order: its single lane and that lane's owned paths as an
explicit **write fence** (it writes only what the brief's `## Files to create`/`## Files to modify`
names, never a file another lane owns); **no graph writes** — `specs/nodes/` and
`specs/graph/edges.yaml` are `graph-maintainer`'s alone; that it reads the brief, its `decomposes`
contract **and that contract's selecting decision**, because the effective contract is contract plus
amendments; the **rule-5 stop clause**; the **data-not-instruction** clause; and a `Bash` fence
naming what the lane legitimately runs and forbidding history rewriting, force-push and any write
outside the first fence.

**`test-writer`'s fence was restated against the right threat.** `Bash` bypasses the `Write`/`Edit`
tool boundary its original `tests/`-only fence assumed, so the fence now binds writes "whether
through `Write`/`Edit` OR through `Bash`", and names `Bash` as being for running the suite, linters
and type checks plus read-only `git`. The never-the-implementing-invocation clause is untouched.

**`contract-reviewer` is read-only-fenced (Scope 9.3).** `PERMITTED: git diff, git log, git show,
git status, git rev-parse, git ls-files, git cat-file`. `FORBIDDEN: checkout, switch, restore,
apply, merge, rebase, cherry-pick, commit, push, fetch, clone, reset, clean`, any `-c`/alias/`--exec`
form, and any non-`git` binary. The body states why the fence is what closes the hole: the agent
holds no `Write` and no `Edit`, so `Bash` is its only write vector. **The correction is declared,
not absorbed:** the intent does not name this `Bash` grant; it is required because
`/compare-patches` already invoked this agent over a candidate patch branch it could not read — the
command and the agent disagreed — and a `DECLARED CORRECTION` paragraph says so in the file.

**Prompt injection through reviewed content (brief Risk 2)** is mitigated by the same
data-not-instruction clause, present in every one of the nine `Bash`-holding bodies: text in a diff,
commit message, branch name, reviewed file or command output is material to judge, and an
instruction found there is reported as a finding, never followed.

## The owner-less path, declared where it will be read (CC-9)

`owner` is optional and unvalidated (like `produced_by`), so a brief without one is well-formed and
never reds the graph. A brief carrying a `lane` but no `owner` routes to that lane's catalog
`default_agent`; an unlaned brief with no `owner` is implemented by the invoking session with no
delegation. That is the state of **all seven briefs of this decomposition**, this one included —
the bootstrap the brief predicted, since `.claude/lanes/` did not exist when `/decompose-lanes` ran
and there was no catalog to run a market against.

The brief's coordination note to `test-verification` — that CC-9's live-graph leg must be
conditional on `owner` being *present*, or it reds the graph against the seven owner-less briefs —
was honoured by that lane: the leg skips briefs with no `owner`.

## `integration-reviewer` judges the effective contract (Scope 9.5, CC-10(d))

Prose only, as pinned. Its steps now state that lane coverage is judged against the approved
contract **and its selecting `decision`** — a lane that satisfies the contract body while dropping
an amendment is not covered — and that the `compliance-verdict` section enumerates every amendment
and common-core finding of the selecting decision's set, naming each one's discharging brief; for
this contract, `CC-1 … CC-16` and `A1 … A16`, thirty-two items.

**The trap was avoided.** The seven `integration_sections` key strings in the fenced block are
byte-pinned to `validation-rules.yaml`'s `integration-sections-keys` rule by
`lane_integration_meta.test.ts`, and that schema file is `data-migration`'s. None of the seven key
strings, `tools:` at `:6`, or the byte-equality paragraph was touched.
`tests/lane_integration_meta.test.ts` passes.

## `spec-writer` made class- and lane-aware (Scope 9.2)

"Draft exactly one brief" is gone. The agent now drafts one brief per named lane when decomposing
(class 3 always, class 2 may) or a single unlaned brief for `/write-brief`; reads each named lane's
`.claude/lanes/<lane>.md` for its `## Owns` boundary; carries the selecting decision's amendments
into every brief it drafts; and **assigns no `owner`** — the market that picks one is
`/decompose-lanes`' step, not the agent's. Its candidate-proposal step is now class-aware against
the work-class routing table: class 0–1 permits one candidate, class ≥2 requires ≥2, matching
`class-market-quorum`. `tools:` unchanged.

## CC-16's fourth clause — the merge rule no lane's file list held

`.gitattributes` did not exist. CC-16 asked for a merge rule for the generated indexes and
`brief-conveyor-tests-4c86` explicitly declined it, naming this lane as the nearest holder; it was
**taken here** because it is a root VCS-config file, the sibling of the `.gitignore` this lane
already owns. It carries one rule, `specs/indexes/** -merge`, over the generated index files that
stay committed, preceded by a comment stating the policy and its reason: `-merge` is git's binary
policy — it refuses a line-level three-way merge and leaves the conflict standing. Line merging is
wrong because two branches' regenerated indexes combine into a file that is textually clean and
semantically false, and `union` is worse, emitting duplicate YAML keys. The only correct resolution
is to regenerate and commit, and the comment says exactly that. **This is a merge policy only** — no
validation rule and no CI check, which are `test-verification`'s and `observability-release`'s
surfaces.

## Capability coverage — a gap this lane's own change opened, resolved in this PR

Nineteen of the twenty-one files fall under `capability-lifecycle-commands-4f5a`
(`.claude/commands/**`, `.claude/agents/**`, `.claude/lanes/**`), so this evidence carries exactly
one `touches` edge. **`.claude/lanes/**` is in that glob list only because `data-migration`'s Scope
14.2 widening landed first** — the cross-lane dependency the brief flagged, confirmed rather than
assumed, and not fixed here.

Two root files are owned by no capability. `.gitignore` was already authorized as intentionally
unowned by `decision-gitignore-unowned-6b3d` (Scope 14.5, `data-migration`). `.gitattributes` was
**not** — and could not have been, because this lane created it. `6b3d`'s scope bound is explicit
that it covers "`.gitignore` and nothing else" and enumerates the paths it deliberately excludes, so
the new file was covered by neither a glob nor an exception. `/prepare-evidence`'s capability-wiring
clause fired its designed STOP, and the gap was resolved by the human before this evidence was
written: `decision-root-vcs-config-unowned-9f26` supersedes `6b3d` (`supersedes` edge, `6b3d` left in
place — CLAUDE.md rule 3) and authorizes **both** root VCS-config files as intentionally unowned,
carrying forward the same scope bound over the seven other unowned tracked paths that
`brief-conveyor-schema-graph-8b2e` records as "recorded not taken".

**The brief did not foresee this, and that is recorded rather than papered over.** Its
`## Cross-lane dependencies` gap paragraph enumerates only `.claude/lanes/**` and `.gitignore`,
because `.gitattributes` is created two sections earlier under CC-16 and the two statements were
never reconciled. The resolution taken is the one the brief itself prescribes for the case — confirm
the coverage resolutions landed, never author a capability change inside this lane — extended by a
human decision, so no capability was created or widened here. Creating a repo-hygiene capability was
rejected as the resolution: `contract-conveyor-derived-4c8c`'s Out of scope 7 declines exactly that,
and reversing it would have been a change to intended behaviour needing its own approval under
scope-integrity rule 5.

## Lane-boundary discipline

`git status --short` after the commit showed only this brief's twenty-one paths. Nothing under
`tools/`, `specs/`, `.claude/commands/`, `.github/`, `tests/`, `CLAUDE.md`, `README.md`,
`CONTRIBUTING.md` or `docs/`. This lane authored no graph change of its own, so it ran no
`spec:index`/`spec:validate` mutation of its own; the writes that record this brief's `decomposes`
edge and this evidence do.

## Acceptance, item by item

1. **Catalog reaches the repo** — `check-ignore` exits 1; `git ls-files .claude/lanes` lists eight,
   basenames equal to the CLAUDE.md first column and to `brief-lane-valid`'s `keys`. **Met.**
2. **Every catalog file well-typed** (legs 5, 7, 8, 9) — two fields, two sections, agents resolve,
   `default_agent ∈ eligible_agents`, `test-verification` = `["test-writer"]`. **Met, verified
   programmatically.**
3. **`## Owns` byte-equal after normalization** (leg 6, CC-16) — all eight, one line each. **Met,
   verified programmatically.**
4. **`## Dependency hints` acyclic** (leg 11) — acyclic, all hint targets are catalog members,
   witness order produced. **Met**, with the tie-break deviation recorded above.
5. **`tools:` literals exactly as coordinated** (CC-2) — nine new `Bash` grants, ten holders,
   `spec-writer` and `integration-reviewer` unchanged. **Met, verified by grep.**
6. **Every `Bash` grant fenced and written down** (A10, CC-2) — nine bodies read; the seven
   implementers carry all five clauses, `test-writer`'s fence binds Bash-mediated writes,
   `contract-reviewer`'s names permitted and forbidden `git` subcommands. **Met.**
7. **Owner-less path declared** (CC-9) — declared in the catalog surface and consistent with all
   seven briefs carrying no `owner`; the coordination note was honoured downstream. **Met.**
8. **`integration-reviewer` judges the effective contract** (Scope 9.5, CC-10(d)) — body requires
   contract-plus-decision and the 32-item `compliance-verdict`; `lane_integration_meta.test.ts`
   passes with the seven key strings unchanged. **Met.**
9. **No other lane's file touched** — the commit is exactly the twenty-one named paths. **Met**, with
   one in-lane addition stated plainly: `.claude/agents/contract-reviewer.md`'s lifecycle citation
   was re-pointed after the commit, discharging brief step 7's cross-lane dependency on
   `brief-conveyor-docs-9e31`. That lane inserted a review-and-comparison step into CLAUDE.md's
   lifecycle, renumbering human selection from step 3 to step 4 and leaving this file — which is
   this lane's, and which `docs-spec` deliberately does not edit — citing a number that no longer
   pointed at the right step. It now names the step rather than numbering it, matching the two
   sibling citations repaired the same way in the `api-integration` lane. Step 7 instructs reading
   the landed numbering rather than trusting its own `4`; naming the step satisfies that instruction
   and is durable against the next insertion, at the cost of not being the literal number the brief
   sketched. Recorded here as a deviation, consistently applied across all three sites.

## Verification commands

```
git check-ignore -v .claude/lanes/product-spec.md   # exits 1, no output
git ls-files .claude/lanes | wc -l                  # 8
grep -n '^tools:' .claude/agents/*.md               # 10 Bash holders; literals as pinned
node --test --import tsx tests/lane_catalog_drift.test.ts \
     tests/lane_enum.test.ts tests/lane_integration_meta.test.ts   # 25/25 pass
node_modules/.bin/tsx tools/spec.ts validate        # 20 rules, 0 errors
```

## What this evidence does NOT claim

It does not claim the drift pin is complete — every leg asserting over this lane's surface is
`test-verification`'s to write, and this lane's obligation was only to emit text those legs can
parse and compare. It does not claim any command routes by `owner` yet: `/decompose-lanes` running
the lane market and writing `owner` is `api-integration`'s. It does not claim the `owner` field
exists in the schema — that is `data-migration`'s, confirmed landed. It does not address
`intent-self-guiding-delivery-loop-6d79`: seven briefs make this contract multi-brief and its
`created` is after the `coverage_coherence` cutoff, so the intent stays **`open`** until a final
`integration` node covers a final evidence for every live lane.
