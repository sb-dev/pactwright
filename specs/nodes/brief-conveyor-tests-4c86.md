---
id: brief-conveyor-tests-4c86
type: brief
title: Conveyor verification lane — the thirteen-leg lane-union pin, the resolver-invocation pin, conveyor routing, view time-invariance and the transcript regression fixture
status: implemented
created: 2026-07-28
lane: test-verification
produced_by: "/decompose-lanes"
---

This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
`test-verification` lane of `intent-self-guiding-delivery-loop-6d79` (status: open, class 3), per
`decision-conveyor-derived-5a91`. This lane owns Scope 11 and writes ONLY under `tests/**`: the new
`tests/conveyor.test.ts` routing suite, the `planIssueSync` unit suite, the union lane pin and the
resolver-invocation pin in `tests/lane_catalog_drift.test.ts`, the de-duplication of
`tests/lane_enum.test.ts`'s hand-written lane list, the `tests/spec.test.ts` updates for the widened
`INDEX_FILES` and the new `status` subcommand, ten new fixture view files and three extended
`expected-errors.txt` files. Every other surface belongs to another lane — `tools/**` and
`package.json` to `domain-backend`, `specs/schema/**` and all graph data to `data-migration`, the
fifteen `.claude/commands/*.md` files to `api-integration`, `.github/**` to
`observability-release`, `.claude/lanes/**` + `.claude/agents/**` + `.gitignore` to `product-spec`,
and `CLAUDE.md` + root docs to `docs-spec`. **BOOTSTRAP.** This decomposition predates the lane
market the contract builds: `.claude/lanes/` does not exist, `owner` is not in
`specs/schema/node-types.yaml`, and none of the seven implementer agents exists. Therefore **no
brief in this decomposition carries an `owner`**, and lane owners are assigned by
`/decompose-lanes` only after this change lands. Every leg this brief writes over `owner` must
therefore tolerate an absent `owner` — see CC-9 below, where that tolerance is a pinned
requirement, not an oversight.

## Lane ownership

This lane is **owned by `test-writer` via `/write-tests <brief-id>`** and is authored by the
`test-writer` agent, whose tool set today is `Read, Write, Edit` (`.claude/agents/test-writer.md:6`
— no `Bash`; Scope 9.4 adds it, in the `product-spec` lane) and which is barred from authoring any
file under `specs/`. Per CLAUDE.md's lane rule 1 ("Verification is always its own lane … never the
same invocation that implemented the code under test"), these tests MUST NOT be written by the
`/implement-brief` invocation that authored `tools/conveyor.ts`, `tools/issue_sync.ts`,
`tools/indexer.ts`'s widened `INDEX_FILES`, `tools/spec.ts`'s `status` branch, the `.claude/lanes/`
catalog, the seven implementer agents, or any command file. `/write-tests` refuses any brief whose
`lane` is not `test-verification` (`.claude/commands/write-tests.md:4-6`); this brief satisfies that
precondition. The independence invariant is the whole reason this lane exists separately, and it is
sharper here than in Phase 9: the acceptance this lane machine-checks (A6) is precisely an
assertion *about the artifacts another lane writes*, so a shared invocation would be marking its
own work.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Every line number below was
re-confirmed in this session; re-confirm again before editing, since earlier edits in the same file
shift them.

- **`tests/lane_catalog_drift.test.ts` (56 lines, ONE test at `:15`, TWO assertions).** It asserts
  the CLAUDE.md lane catalog deep-equals a hard-coded eight-name literal (`:44-53`) and deep-equals
  `brief-lane-valid`'s `keys` (`:55`). It does **not** read `.claude/lanes/`, does not shell
  `git ls-files`, and does not read `.claude/agents/` today. **Two shapes in it are reused, not
  reinvented:** `:28-33` slices the `## Lane model and integration` section (`indexOf` the heading,
  then bound the slice at the next `\n## `), and `:36-41` is the first-column backticked-token row
  regex (`/^\|\s*`([^`]+)`\s*\|/` at `:39`). **Union legs 1 and 5 reuse both verbatim**; the section
  slice is also reused, retargeted, by the A12 pin below — but `:39`'s regex is **not** reusable
  there (see A12).
- **`tests/lane_enum.test.ts` (37 lines).** `:8-17` is the hand-written `LANES` array — the sixth
  lane-list copy the intent's count misses — consumed at `:18` by `RULE.keys`. `:22-24` is a compact
  `spec(nodes): LoadedSpec` literal builder worth copying for any synthetic-graph leg.
- **`tests/lane_integration_meta.test.ts:17-20` is the byte-equality PRECEDENT but the WRONG SHAPE
  here.** It reads the agent file and extracts a **fenced yaml block** via
  `/```yaml\n([\s\S]*?)\n```/`, then `load()`s it. The CLAUDE.md work-class table is a **markdown
  table**, not a fenced block, so this extractor does not apply to A12. See A12 for the extractor
  that does.
- **`tests/spec.test.ts` (258 lines) — the whole-tree fixture driver.** `:12` declares a LOCAL
  `INDEX_FILES` copy (the one Scope 11.4 replaces with an import); `:14-22` `runCli` spawns
  `node --import tsx tools/spec.ts <sub>`; `:24-29` `copyFixture`; `:31-37` `expectedErrors`;
  `:39-41` `errorLines` filters `[rule: ` lines. `:43-59` is the `good` byte-identity + re-run
  determinism case, looping `INDEX_FILES` at `:47` and `:55`; `:189-198` is the same loop for
  `good-patch-market` at `:194`. `:63-89` is the fifteen-name bad-fixture loop (each runs `index`
  BEFORE `validate`, so those fixtures regenerate all index files and are unaffected by the
  widening). `:100-106` (`index-drift`), `:124-137` (`rule-disable`) and `:139-156`
  (`dispatch-all-kinds`) run `validate` **without** a prior `index`, which is why exactly those
  three pin `indexes drifted` lines. `:225-229` is the usage assertion; `:228` holds the literal
  `usage: spec <index|validate|gate|check-diff|patch-gate|drift-map>`.
- **`tests/checkdiff.test.ts:6-17` — the pure-decision builder idiom.** `TODAY` at `:6`,
  `node(id, type, extra)` at `:9-11`, `edge(id, type, source, target)` at `:12-14`, and
  `spec(nodes, edges): LoadedSpec` at `:15-17`. `tests/conveyor.test.ts` copies this exactly for
  `nextSteps(spec, nodeId)`; the handler-suite idiom
  (`tests/class_market_quorum.test.ts`, `tests/comparison_required.test.ts`) is the model for any
  finding-shaped leg.
- **`tools/indexer.ts:35` — `export const INDEX_FILES` (four entries) is ALREADY exported and the
  module has no top-level side effects**, so Scope 11.4's "imported, not re-declared" is satisfiable
  today with a one-line import. `serializeIndexes` at `:99-108` returns a hard-coded four-key object
  literal, and the doc comments at `:99` and `:110` both say "four" — that is the domain-backend
  lane's trap, named here only because this lane's fixture expectations depend on the widened list
  landing.
- **`tools/spec.ts` — do NOT import it from a test.** `:94` runs `process.exit(main())` at module
  scope inside the `try` at `:93-98`, so importing `tools/spec.ts` to reach `SUBCOMMANDS` (`:27`)
  or `USAGE` (`:9`) would execute the CLI and kill the test process. `spec.test.ts` must keep
  driving it through `runCli`. This is why the new usage assertion below parses the printed line
  rather than importing the constant.
- **`tools/validator.ts:50-57` `compareFindings` + `:89` `findings.sort(compareFindings)`** — every
  finding list is sorted by `(rule, kind, subject, detail)`. `tools/handlers/indexes_fresh.ts:16-31`
  emits **one finding per index file**, `subject` = the file name, detail
  `indexes drifted: <name>` (with ` (missing — run spec:index)` appended when the file is absent,
  `:29`). Consequently the two new `indexes-fresh` lines sort by subject **between**
  `by-type.yaml` and nothing else: the pinned order becomes `by-type.yaml`, `status.md`,
  `trails.md`. They are INSERTED, not appended.
- **`tools/handlers/coverage_traversal.ts` exports eight walks** (`:25`, `:54`, `:67`, `:91`,
  `:111`, `:125`, `:135`, `:161`) — `liveSourcesByEdge`, `liveProposingContracts`,
  `intentsForContract`, `briefsForPatch`, `competingPatches`, `liveCompetitors`,
  `comparedCompetitors`, `patchMarketResolved`. `tests/coverage_traversal.test.ts` already exercises
  them; this lane's conveyor tests assert the resolver's OUTPUT, never re-test these walks.
- **`CLAUDE.md` anchors.** `## Work-class routing` at `:81`; its table header at `:89`, separator at
  `:90`, four class rows at `:91-94` — **the first cell is a bare digit (`| 0 |`), not a backticked
  token.** `## Lane model and integration` at `:157`; its lane table header at `:163`, separator at
  `:164`, eight lane rows at `:165-172` with a backticked first cell.
- **Harness and CI.** `package.json:12` is `node --test --import tsx tests/*.test.ts` — a **flat**
  glob, so `tests/conveyor.test.ts` and `tests/issue_sync.test.ts` are picked up with no
  `package.json` edit (that file is the domain-backend lane's anyway).
  `.github/workflows/ci.yml:19` runs `pnpm test`; `.github/workflows/spec-index.yml:21` runs
  `git diff --exit-code specs/indexes/` on **every** pull request — the fact that makes CC-8's
  no-clock leg load-bearing rather than decorative. In this PRoot environment `pnpm` is broken:
  the canonical `pnpm spec:index && pnpm spec:validate` runs as
  `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`.
- **Fixture inventory, verified.** EXACTLY FIVE fixture directories contain `specs/indexes/`:
  `tests/fixtures/good/`, `tests/fixtures/good-patch-market/`, `tests/fixtures/bad/index-drift/`,
  `tests/fixtures/bad/rule-disable/`, `tests/fixtures/bad/dispatch-all-kinds/`. Each holds exactly
  the four index files. `tests/fixtures/good-drift/` and `tests/fixtures/good-waives/` have **no**
  `specs/indexes/` at all (their `spec.test.ts` cases at `:158-187` run `index` first and read the
  generated output) — they are untouched by this lane, and they are the precedent for the new
  transcript fixture carrying no committed indexes.

## Pinned decisions (the amendments and findings THIS lane discharges)

### A13 + CC-15 — the union of the three leg sets is binding; the count is THIRTEEN, not ten

`decision-conveyor-derived-5a91:129-133` (A13) supersedes the approved contract's "ten-leg" label.
The three candidates' pins **differ** (`comparison-conveyor-market-890e:271-274`, CC-15), so the
base candidate would otherwise silently decide the assertions. The sources, all read in this
session: **B** — `contract-conveyor-derived-4c8c.md` Behaviour 3, `:161-171`; **C** —
`contract-conveyor-pinned-8df4.md:170-178` (plus its Scope 12 at `:89-90` and its Acceptance 4 at
`:216-219`); **A** — `contract-conveyor-prose-f6fe.md:32-33` (Scope 3) and its machine-checkable
acceptance list at `:202-211`.

**Counting convention, stated so the count is reproducible: one leg = one distinct assertion.** C
counts its four-way equality as "four legs" (one per equal source); this brief counts it as the
three distinct equalities B enumerates plus C's separately-retained literal anchor. The union,
binding in full:

1. **Filenames == CLAUDE.md table.** The `.claude/lanes/` filename set equals the CLAUDE.md lane
   table's first column, in order. (B leg 1; C `:171-172`; A `:202-203`.) Reuses
   `lane_catalog_drift.test.ts:28-33` + `:36-41` verbatim.
2. **== rule keys.** That list equals `brief-lane-valid`'s `keys`, in order. (B leg 2; C; A `:208`.)
   This is today's `:55` assertion, retained.
3. **No sixth hand-written copy.** `tests/lane_enum.test.ts` LOADS the lane list from
   `brief-lane-valid` rather than hand-writing it. Once it loads from the rule, leg 2 covers the
   equality transitively, so the residual assertion is the *absence of a relapse*: this leg asserts
   `tests/lane_enum.test.ts`'s source contains no lane-name array literal — concretely, that the
   source does not contain the string `frontend-ui`, a lane name with no other legitimate reason to
   appear in that file. **Honest bound: this is a source grep that catches the specific relapse of
   re-inlining the list; it is not a semantic proof.** (B leg 3; C `:172` "the seventh source"; A
   `:32-33`.)
4. **The literal eight-name anchor is RETAINED.** The CLAUDE.md-derived list deep-equals the
   hard-coded literal at today's `lane_catalog_drift.test.ts:44-53`. (C-only, `8df4.md:89-90`,
   which retains it explicitly "as the anchor".) **This does NOT contradict CC-16**: CC-16 replaces
   the literal `8` in the *anti-vacuity count* (leg 12), not the literal *names* here. Keep both —
   without leg 4, a coordinated shrink that deletes a lane from the table, the rule and the catalog
   together passes legs 1-3 and 12 unnoticed.
5. **Well-typedness.** Every catalog file carries both frontmatter keys (`eligible_agents` a
   non-empty string list, `default_agent` a string) and both body sections (`## Owns`,
   `## Dependency hints`). (B leg 4; C `:176`; A `:205-206`.)
6. **`## Owns` byte-equality, under a DECLARED normalization.** Each catalog file's `## Owns` text
   equals that lane's CLAUDE.md `Owns` cell. (B leg 5; C `:177`; A `:206`; normalization mandated
   by CC-16, `comparison-conveyor-market-890e:275-278`, citing
   `lane_catalog_drift.test.ts:39`.) See "CC-16" below for the normalization itself.
7. **Agent resolution.** Every `eligible_agents` entry and every `default_agent` resolves to an
   existing `.claude/agents/<name>.md`. (B leg 6; C `:173`; A `:202-203`.)
8. **`default_agent ∈ eligible_agents`.** (B leg 7; C `:174`; A `:205`.)
9. **`test-verification`'s `eligible_agents` deep-equals `["test-writer"]`.** (B leg 8; C `:175`;
   A `:207-208`.) The security panel records this as machine-checked separation of duties
   (`comparison-conveyor-market-890e:72`, credit) — it is the machine half of this very lane's
   ownership rule.
10. **`## Dependency hints` MEMBERSHIP.** Every lane named in any `## Dependency hints` section is a
    catalog lane. **(A-only — `f6fe.md:206-207` "names only catalog lanes and is acyclic"; B leg 9
    and C `:178` assert acyclicity alone.)** Without it a hint naming `backend` instead of
    `domain-backend` is simply an isolated node in an acyclic graph and passes.
11. **`## Dependency hints` acyclicity.** The hint graph is acyclic. (B leg 9; C `:178`; A `:207`.)
12. **Anti-vacuity, sized from the table.** `git ls-files .claude/lanes` lists exactly as many files
    as the CLAUDE.md lane table has rows, and their basenames set-equal `<lane>.md` for exactly
    those lanes. (B leg 10, C `:216-219`, A `:209-210`; CC-16 replaces B's literal `8` with the
    table-derived count.) This is the leg that fails if `product-spec`'s `!.claude/lanes/` negation
    is missing — without it nine of the other legs pass vacuously over an empty directory.
13. **Live-graph `owner` leg.** Every `brief` carrying `owner` names an agent in its lane's
    `eligible_agents`, and every `test-verification` brief carrying an `owner` carries
    `owner: test-writer`. **(A-only — `f6fe.md:211`; made binding by CC-9
    (`comparison-conveyor-market-890e:247-250`) and A16 (`5a91.md:141-142`).)** Scoping and
    bootstrap tolerance are pinned under "CC-9" below.

**Thirteen legs. The contract's "ten-leg pin" label is superseded and must not be used in this
lane's code comments, commit messages or evidence.**

### A6 — every chain command still invokes the resolver, and A1's fallback CANNOT satisfy it

`decision-conveyor-derived-5a91:90-92`. The panel finding is
`comparison-conveyor-market-890e:107` (B has no pin over the command surface, so a print-less
command reds nothing) and `:118` (a hand-typed `NEXT` block is indistinguishable from a resolved
one). **This is the single hardest assertion in the change**, because the `api-integration` lane's
A1 fallback (`5a91.md:64-70`) puts *routing-shaped prose* into the very same files — and A1 says in
terms that the fallback "must **not** satisfy A6's pin".

A grep for `NEXT`, for a `/`-command, or for a step-shaped line is therefore **useless**: the
fallback contains all three by construction. The pin greps for the **invocation of the resolver**,
in a region the fallback is excluded from. The literals are **pinned, not negotiated per lane**: the
block below is reproduced byte-for-byte in `brief-conveyor-commands-c14d` and is binding on both
lanes (recorded as a cross-lane dependency below).

A1/A6 DISTINGUISHABILITY CONTRACT (byte-identical in `brief-conveyor-commands-c14d` and
`brief-conveyor-tests-4c86`; neither lane may vary it unilaterally):

1. Resolver-invocation token: `pnpm spec:status`. Every chain command file must instruct the
   agent to run it.
2. A fallback region opens with a line that is exactly `FALLBACK (RESOLVER UNAVAILABLE):`.
3. A fallback region ends at the next line matching `^[A-Z][A-Z0-9 /()-]*:$`, or at EOF.
4. A fallback region MUST NOT contain the substring `spec:status` anywhere — bare or
   `pnpm`-prefixed. The fallback is what an operator reads when the resolver is gone, so it
   names candidate next commands with placeholder arguments and never resolved ids.
5. THE PIN (A6): after excising every fallback region, each of the fourteen chain command files
   must contain `pnpm spec:status` AT LEAST ONCE. A print-less or hand-typed command therefore
   reds CI even though it carries fallback prose.

The delimiter matches the repo's existing ALL-CAPS label idiom (`CLOSING REPORT:`,
`CAPABILITY WIRING:`, `STATUS (laned lifecycle):`), which is why clause 3's closing pattern is that
idiom's shape.

Six legs:

- **A6.1 Coverage / anti-vacuity.** The scanned set is exactly the fourteen chain command files,
  derived as `.claude/commands/*.md` minus `detect-drift.md` and `update-spec-graph.md` (today the
  directory holds sixteen files; 16 − 2 = 14, verified this session). Assert the derived set has
  fourteen members and that each file exists — so a newly added command must be classified, never
  silently skipped.
- **A6.2 Invocation present OUTSIDE the fallback.** With the fallback region **excised**, the
  remaining text of every chain file contains `pnpm spec:status` at least once (clause 5 above —
  AT LEAST ONCE, not exactly once). This is the leg that
  reds a print-less command AND a command whose only resolver mention is inside its fallback.
- **A6.3 The fallback is resolver-free.** The fallback region, where present, contains no
  `spec:status` substring at all — clause 4, so the bare test catches the `pnpm`-prefixed form
  too. This is not belt-and-braces: the fallback is *by definition* the
  resolver-unavailable path, so telling the agent to run the resolver inside it is itself the
  defect, and it is also what makes A6.2's excision sound rather than cosmetic.
- **A6.4 The fallback is template-shaped.** Every `/`-command line inside the fallback region has
  all arguments in `<...>` form and contains no token matching CC-6's node-id shape
  `\b[a-z]+-[a-z0-9-]*-[0-9a-f]{4}\b`. This machine-checks A1's binding constraint ("no resolved
  IDs") rather than trusting it.
- **A6.5 The fallback is explicitly marked.** Where a fallback region exists its opening line is
  the exact agreed delimiter — so "marked as the resolver-unavailable path" is a literal, not a
  judgement.
- **A6.6 Honest bound, recorded in the test file and in this lane's evidence.** A6 pins that each
  command **file instructs** the agent to run the resolver. It does **not** prove the agent ran it
  on any given invocation. That second half is A9's CI transcription job (the
  `observability-release` lane) plus CC-12's transcript fixture below. `comparison:118`'s finding is
  therefore *partly*, not wholly, retired by this lane, and this lane says so rather than claiming
  it away.

### A12 — the `CONVEYOR_CLASS_ROUTING` pin; SETTLED TO PIN, not conditional

`5a91.md:118-122`. A12 gave `domain-backend` the choice between reading the CLAUDE.md work-class
table as data and pinning a literal byte-equal to it, and required **that brief** to record the
choice and its rationale. **That choice is already recorded and is SETTLED TO PIN:**
`brief-conveyor-resolver-3f7a`'s `## Pinned decisions` reads "A12 — DECIDED: PIN the literal; do
NOT read CLAUDE.md as data", on a three-part rationale (CC-8's totality requirement; refusing a
run-time `tools/**` → `CLAUDE.md` dependency; avoiding build-order coupling to the `docs-spec`
lane), explicitly accepting the machine-checked third-copy cost. A third *unpinned* copy remains
forbidden. Only the pin branch is binding on this lane:

- **THE PIN (binding).** Write the byte-equality leg in `tests/conveyor.test.ts`, importing
  `CONVEYOR_CLASS_ROUTING` from `tools/conveyor.ts` and comparing it to the table parsed
  from CLAUDE.md. **Shape: `lane_integration_meta.test.ts:17-20` does NOT apply** — it extracts a
  fenced ```yaml block and `load()`s it, and the work-class table is a markdown table.
  **`lane_catalog_drift.test.ts:39`'s regex does NOT apply either** — it captures a backticked
  first cell, and the work-class table's first cell is a bare digit (`CLAUDE.md:91`, `| 0 |`), so
  that regex matches zero rows. What DOES apply is `lane_catalog_drift.test.ts:28-33`'s section
  slice, retargeted to the exact heading `## Work-class routing` (`CLAUDE.md:81`) and then narrowed
  to the contiguous run of lines beginning `|` that starts at the header row — necessary because
  the `\n## ` bound puts `### Critic routing` (`:104`) and `### Proposal comparison` (`:132`)
  inside the slice. Cells come from `line.split("|").slice(1, -1).map((c) => c.trim())`, and the
  comparison uses the same declared normalization as union leg 6.
- **Re-confirm, don't re-decide.** If `brief-conveyor-resolver-3f7a`'s evidence records a different
  resolution than the pin, stop and reconcile before writing the pin. The read-as-data alternative
  is not live work for this lane and is not written speculatively.

### CC-2 (this lane's half) — pin every agent `tools:` line to a literal

`comparison-conveyor-market-890e:224-226`. `product-spec` authors the agents; this lane pins them,
reading `.claude/agents/**` and writing nothing there. In `lane_catalog_drift.test.ts`, beside legs
7 and 9, add an `AGENT_TOOLS` map from agent name to its exact expected `tools:` line and assert
byte-equality after trimming, covering the seven new implementer agents plus `contract-reviewer`
(its read-only-`git` fence) and `test-writer` (its post-change line). Add a presence leg that
`contract-reviewer.md` states diff content is data, not instruction. **Honest bounds, both
recorded:** the `tools:` leg pins the *declared* grant, not the agent's obedience to it; the
data-not-instruction leg is presence-only.

### CC-5 (this lane's half) — the `planIssueSync` unit suite

`comparison-conveyor-market-890e:234-237`, amplified by A2 (`5a91.md:72-74`). `domain-backend`
writes the pure `planIssueSync(spec, existingIssues)` seam in `tools/issue_sync.ts` and
`observability-release` the scheduled trigger; **the tests are this lane's**. Cases: a no-op re-run
on an unchanged graph; the reopen of a hand-closed lane issue; close on final **evidence**; close
on final **integration**; close on a **superseded or rejected** lane (CC-4's collapsed-lane branch,
which is superseded and never evidenced); **abort before mutating when the listing did not
complete**; and the per-run planned/applied/failed report shape. All are direct calls on synthetic
`(spec, existingIssues)` inputs — no `gh`, no network.

### CC-8 (this lane's half) — the no-clock test, and byte-identity is not time-invariance

`comparison-conveyor-market-890e:244-246`, with the release panel's precise finding at `:144`:
byte-identity is asserted, time-invariance never is, and a dated cell freezes CI. Once
`INDEX_FILES` widens, `trails.md` and `status.md` fall under `indexes-fresh` **and** under
`spec-index.yml:21`'s `git diff --exit-code specs/indexes/` on every PR — so a view carrying
today's date goes green on the day it is committed and reds every PR thereafter until someone
re-runs `spec:index`. Four legs:

1. **Byte-identity (contract Acceptance 5).** `spec:index` run twice is byte-identical across all
   six index files. This comes for free once `spec.test.ts:12` becomes an import — the existing
   loops at `:47`, `:55` and `:194` widen automatically.
2. **Time-invariance (the leg nobody asserts today).** Serialize the two views from one
   `LoadedSpec` under two far-apart fake clocks and assert byte-equality, using node:test's
   `t.mock.timers.enable({ apis: ["Date"], now: <epoch> })`. **Nothing in `tests/` uses
   `mock.timers` today** — this is a new technique in this repo; CI runs Node 22
   (`.github/workflows/ci.yml:16`), which supports it.
3. **No dated cell.** The serialized `trails.md` and `status.md` contain no `\d{4}-\d{2}-\d{2}`
   substring, matching Behaviour 8's declared columns (`id`, `title`, `status`; open-work rows plus
   the next step — no `created`). **Stated residual:** a node *title* containing a date reds this
   leg. That is the intended trade, and the remediation is to rename the node, not to weaken the
   leg.
4. **Totality (CC-8's "make the derivation total").** Every live intent in the fixture graph yields
   a `trails.md` section and a `status.md` row; a graph containing an unresolved edge and a node
   whose type has no routing rule still serializes without throwing; and `nextSteps` never returns
   `[]` — it returns the explicit "no derivable next step, and why" entry the contract's Risk 1
   mitigation promises.

### CC-9 (this lane's half) — one live-graph leg, scoped so a retired agent cannot red CI

`comparison-conveyor-market-890e:247-250`, amplified by A16 (`5a91.md:141-142`); `data-migration`
owns the field itself. Union leg 13 is this leg. Its scoping is a pinned requirement, not an
implementation detail, because the release panel's finding on the sibling case is explicit
(`comparison-conveyor-market-890e:142`): asserting over live graph data means retiring an agent
reds the build.

- **Only non-terminal briefs are checked.** A brief at `implemented` or `superseded` is history;
  skipping it means retiring an agent cannot red CI over work already delivered.
- **Absent `owner` is skipped, by design and not by accident.** THE SEVEN BRIEFS OF THIS
  DECOMPOSITION CARRY NO `owner` (see the bootstrap in the lead paragraph). The leg must be green
  against them on the very PR that introduces it. The `test-verification` half is therefore worded
  as *every `test-verification` brief that carries an `owner` carries `owner: test-writer`*.
- **A missing lane catalog file is reported by leg 1, not double-reported here.**
- **Teeth, because the live half is vacuous today (zero briefs carry `owner`).** Factor the leg
  into one pure helper over `(catalog, briefs)` and run it against BOTH the live graph and two
  synthetic sets that must FIRE: (a) `lane: domain-backend`, `owner: no-such-agent`; (b)
  `lane: test-verification`, `owner: backend-implementer`. Without this the leg would ship green
  and untested.
- **Stated residual:** a still-`draft` brief whose owner is later dropped from its lane's
  `eligible_agents` DOES red CI. The remediation is to re-own or supersede that brief — which is
  the correct action anyway — and this lane records the residual rather than hiding it.

### CC-12 (this lane's half) — the transcript regression fixture

`comparison-conveyor-market-890e:260-262`: the headline acceptance has no regression artifact.
Capture each printed block into a transcript fixture replayed against the recorded graph, so
Acceptance 1 stops resting on one human run.

- `tests/fixtures/conveyor-transcript/` holds a recorded `specs/{schema,nodes,graph}/` tree and
  `transcript.yaml`, a list of `{ command, node, block }` entries: the chain command that printed,
  the node id it resolved for, and the exact `NEXT` block text it printed.
- **The fixture carries NO `specs/indexes/`** — following `good-drift`/`good-waives`, its indexes
  are generated at test time. This keeps "exactly five index-bearing fixtures" and the
  ten-new-view-file count exactly true.
- Replay: load the fixture, call `nextSteps(spec, entry.node)` for each entry, render the `NEXT`
  block, assert byte-equality with `entry.block`.
- **Coverage leg:** the entries' `command` set is a superset of A6.1's fourteen chain commands, so
  the artifact cannot rot into a one-command sample.
- The recorded graph exercises the hop set: a class-3 approved contract with no brief (2.4), a
  laned brief set, an open patch market and a selected winner (2.8 — `/prepare-evidence <brief-id>`
  via `competes-for`, never a branch), a brief at `implemented` (A7's new rule), a final evidence
  with siblings outstanding, and a final evidence for the last lane (2.9 → `/integrate`).
- **Honest bound, recorded:** this is a regression artifact for *what the resolver would print for
  a recorded graph state*. It does not prove a live command ran the resolver. Together with A6 it
  covers the derivation and the instruction; A9's CI job covers the run.

### CC-16 (this lane's half) — the anti-vacuity size and the `## Owns` normalization

`comparison-conveyor-market-890e:275-278`.

- **Anti-vacuity sizing (leg 12).** Not the literal `8`. Shell
  `spawnSync("git", ["ls-files", ".claude/lanes"], { cwd: repoRoot, shell: false })` — `shell:
  false` per CC-6 — and assert the returned file count equals the CLAUDE.md lane table's row count,
  and that the basenames set-equal `<lane>.md` over exactly those lanes, so the count cannot be met
  by stray files.
- **`## Owns` normalization (leg 6), declared and named.** The CLAUDE.md cell is a table cell, the
  catalog text is a wrapped markdown paragraph, so "byte-equal" is undefined without a rule.
  Extract the cell by splitting the row on `|` and taking the `Owns` column (index 1 of the trimmed
  cells) — **not** `:39`'s regex, which captures only the backticked first cell. Normalize BOTH
  sides through one named `normalizeOwns(s)`: trim, collapse every whitespace run (newlines
  included) to a single U+0020, and apply Unicode NFC. Assert equality on the results. State in a
  comment that "byte-equal" means byte-equal **after** `normalizeOwns`, and normalize nothing else
  — no punctuation stripping, no case folding — so the reader can see exactly what is forgiven.

### Scope 11's remaining pins

- **`spec.test.ts` — `INDEX_FILES` imported, not re-declared** (Scope 11.4). Delete the local copy
  at `:12` and import from `../tools/indexer.ts` (already exported at `indexer.ts:35`, no top-level
  side effects). The three loops at `:47`, `:55` and `:194` then widen for free.
- **`spec.test.ts` — the new usage string** (Scope 11.4). `tools/spec.ts` is **not importable**
  (`:94` exits at module scope), so do not import `SUBCOMMANDS`. Replace `:228`'s brittle literal
  with a parse: capture the `usage: spec <...>` line, split the bracketed body on `|`, and assert
  the resulting **set** equals the six existing subcommands plus `status`. Order-insensitive, so it
  does not guess where `domain-backend` inserts `status` into `spec.ts:27`, and still reds on a
  missing or unexpected subcommand.
- **`spec:status` behaviour (contract Behaviour 5).** A `spec.test.ts` case: `runCli(dir, "status")`
  exits 0; `runCli(dir, "status", "<node-id>")` (the filter form) exits 0; the output carries a
  `NEXT` block. **Read-only is proved, not asserted:** snapshot the bytes of every file under the
  copied fixture before the run and assert deep-equality after. "No network" is not machine-checked
  here — record that as an honest bound.
- **View byte-determinism** (Scope 11.2) — CC-8 leg 1 above.
- **`CONVEYOR_CLASS_ROUTING` pin** (Scope 11.2) — A12 above, settled to pin.

### Scope-integrity standing rule

This lane only verifies the effective contract's intended behaviour. If a test cannot be written
because the behaviour appears to have shifted, **STOP** and apply CLAUDE.md rule 5 — supersede the
brief, capture a follow-up intent, or return to human approval. Never relax an assertion to make a
lane green, and never widen scope inside a test.

## Files to create

All under `/home/samir/workspace/pactwright/tests/`; all `tests/*.test.ts` files are auto-globbed
by `package.json:12`, so no harness edit is needed (and `package.json` is not this lane's file).

1. `tests/conveyor.test.ts` — the routing matrix over `nextSteps(spec, nodeId)` (Behaviour 2.1-2.9
   plus A7's `brief` at `implemented` rule), the `Step` shape legs (`command`, `args`, `rendered`,
   `kind`, `why`), purity/determinism, the never-empty legs, the A6 resolver-invocation pin, the
   CC-8 view legs, the CC-12 transcript replay, and the A12 pin (settled to pin by `3f7a`).
2. `tests/issue_sync.test.ts` — the CC-5/A2 `planIssueSync` suite. **Deviation named:** the
   decomposition plan's create list for this lane names only `conveyor.test.ts`, but the amendment
   discharge matrix assigns CC-5 to `test-verification`, and A2 requires "A's unit tests". These
   tests need a home, the flat glob picks the file up automatically, and it touches no other lane's
   files — so this is an in-lane home for already-mandated work, not new scope. If a reviewer
   disagrees, fold the suite into `conveyor.test.ts`; do not drop it.
3. `tests/fixtures/conveyor-transcript/` — the CC-12 recorded graph
   (`specs/{schema,nodes,graph}/`, deliberately **no** `specs/indexes/`) plus `transcript.yaml`.
4. **Ten new fixture view files** — `trails.md` and `status.md` under `specs/indexes/` in each of
   the five index-bearing fixtures (2 × 5 = 10):
   `tests/fixtures/good/specs/indexes/{trails.md,status.md}`,
   `tests/fixtures/good-patch-market/specs/indexes/{trails.md,status.md}`,
   `tests/fixtures/bad/index-drift/specs/indexes/{trails.md,status.md}`,
   `tests/fixtures/bad/rule-disable/specs/indexes/{trails.md,status.md}`,
   `tests/fixtures/bad/dispatch-all-kinds/specs/indexes/{trails.md,status.md}`.
   In the two `good*` fixtures these are the **true byte output** of `spec:index` run inside the
   fixture (the byte-identity assertions require it). In the three `bad/` fixtures they are
   **deliberately stale**, exactly as those fixtures' existing `by-type.yaml` is — that is what
   produces the pinned `indexes drifted` lines below and is why the contract asks for both
   "views committed into the five index-bearing fixtures" and "+2 lines each" at once.

## Files to modify

1. `tests/lane_catalog_drift.test.ts` — today's ONE test with TWO assertions becomes the thirteen
   union legs plus the CC-2 agent-`tools:` pins. Reuse `:28-33` and `:36-41`; retain `:44-53` as
   union leg 4 and `:55` as leg 2.
2. `tests/lane_enum.test.ts` — `:8-17`'s hand-written `LANES` becomes a read of
   `brief-lane-valid`'s `keys` from `specs/schema/validation-rules.yaml`; `:18` keeps referencing
   the result unchanged. The four cases at `:26-37` stay as they are.
3. `tests/spec.test.ts` — `:12` local `INDEX_FILES` → import; `:228` usage literal → the parsed
   set-equality; `:145-155`'s per-rule count map (see step 6); new `status` subcommand cases; the
   `conveyor-transcript` fixture case.
4. `tests/fixtures/bad/index-drift/expected-errors.txt` — `+2` lines, **inserted** after the
   existing `by-type.yaml` line (findings sort by `subject`: `by-type.yaml` < `status.md` <
   `trails.md`).
5. `tests/fixtures/bad/rule-disable/expected-errors.txt` — same `+2`, same position.
6. `tests/fixtures/bad/dispatch-all-kinds/expected-errors.txt` — same `+2`, inserted after the
   existing `[rule: indexes-fresh] indexes drifted: by-type.yaml` line at position 3, so the file
   goes from six lines to eight and stays sorted by `(rule, kind, subject, detail)`.

No other file in the repository is touched by this lane.

## Ordered implementation steps

1. **Re-confirm the two cross-lane pins before writing a line of test code; both are already
   settled, so this is confirmation, not negotiation.** (a) **A12 is SETTLED TO PIN** by
   `brief-conveyor-resolver-3f7a`'s `## Pinned decisions` ("A12 — DECIDED: PIN the literal; do NOT
   read CLAUDE.md as data") — write the pin; if that brief's evidence records a different
   resolution, stop and reconcile before writing it. (b) The A6 literals are fixed by the A1/A6
   distinguishability contract above — the `pnpm spec:status` invocation token and the
   `FALLBACK (RESOLVER UNAVAILABLE):` delimiter — reproduced byte-for-byte in
   `brief-conveyor-commands-c14d`; confirm that copy is byte-identical, and do not vary it
   unilaterally or guess a marker into existence.
2. **`tests/lane_enum.test.ts`** — replace `:8-17` with a `validation-rules.yaml` read of
   `brief-lane-valid.keys` (the `lane_catalog_drift.test.ts:17-22` load idiom), leaving `:18` and
   the four cases intact. Do this first: union leg 3 asserts the relapse is gone, and writing the
   leg before the change would red the suite for a whole step.
3. **`tests/lane_catalog_drift.test.ts` — the thirteen legs.** Keep the existing test as legs 2 and
   4; add the rest as separate `test()` blocks with leg numbers in their names, so a failure names
   its leg. Reuse `:28-33` and `:36-41` for legs 1 and 5; write `normalizeOwns` once for leg 6;
   shell `git ls-files` with `shell: false` for leg 12; factor leg 13's rule into a pure helper and
   run it against the live graph plus the two synthetic must-fire sets. Add the CC-2 `AGENT_TOOLS`
   pins here.
4. **`tests/conveyor.test.ts` — the routing matrix.** Copy `checkdiff.test.ts:6-17`'s builders.
   Cover every Behaviour-2 branch, with these named explicitly because the contract's Acceptance 2
   names them: a selected patch → `/prepare-evidence <brief-id>` through `competes-for`, **never a
   branch**; a class-3 approved contract → `/decompose-lanes`, never `/write-brief`; a
   one-candidate class-1 intent → `/approve-contract`. Add A7's rule (a `brief` at `implemented` →
   `/prepare-evidence <brief-id>`) and A5's graph-state terminality (`/prepare-evidence` terminal
   only for a lone live brief; `/integrate` only at final coverage; last lane of a multi-lane
   contract → `/integrate <contract-id>`). Assert the `kind` discrimination (`paste` = every
   argument a resolved id; `template` = one argument no graph state can fill; `action` = the PR
   action or a judgement reminder), that `why` names the edge or field that turned the branch on,
   that 2.5c transcribes the `## Strategy tension` marker and never infers tension, that the result
   is deterministic across two calls on one `LoadedSpec`, and that the return is never `[]`.
5. **Add the A6 pin, the CC-8 view legs and the CC-12 replay to `tests/conveyor.test.ts`**, then
   author `tests/fixtures/conveyor-transcript/` (graph tree + `transcript.yaml`, no committed
   indexes) and `tests/issue_sync.test.ts`. Add the A12 leg here, in its pin form (settled — see
   step 1).
6. **`tests/spec.test.ts`.** Import `INDEX_FILES`; delete `:12`. Replace `:228` with the parsed
   set-equality. Add the `status` cases including the byte-snapshot read-only proof. **Then fix the
   `dispatch-all-kinds` per-rule count at `:145-155`:** widening `INDEX_FILES` makes
   `indexes-fresh` emit **three** findings in that fixture, so the `assert.equal(..., 1)` at `:154`
   (which loops the `ruleIds` array whose `"indexes-fresh"` entry is at `:148`) breaks. Replace the flat `ruleIds` array with an id → expected-count
   map — `indexes-fresh: 3` with a comment naming the three stale views, every other rule `1`. The
   `assert.deepEqual(lines, expectedErrors(...))` at `:144` remains the authoritative pin; the map
   is a readability guard, and this is stated in a comment so no one later "simplifies" it back.
7. **Author the ten fixture view files.** For `good/` and `good-patch-market/`, generate them by
   running `node_modules/.bin/tsx tools/spec.ts index` **inside a copy of the fixture** and copying
   the byte output in — hand-authoring will fail the byte-identity assertions. For the three `bad/`
   fixtures, author deliberately stale views.
8. **Extend the three `expected-errors.txt`.** Insert
   `[rule: indexes-fresh] indexes drifted: status.md` and
   `[rule: indexes-fresh] indexes drifted: trails.md` after the existing `by-type.yaml` line in
   each. Use the no-suffix form: the views are **committed and stale**, not missing, so
   `indexes_fresh.ts:29`'s ` (missing — run spec:index)` suffix must not appear. If step 7 leaves
   them absent instead, the suffix IS required — the two must match exactly, and this is the most
   likely source of a red on first run.
9. **Run the suite and the real-tree check.** `node --test --import tsx tests/*.test.ts` all green,
   then `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`
   on the post-change tree (canonical form `pnpm spec:index && pnpm spec:validate`; `pnpm` is
   broken in this PRoot environment). Do not commit on any red, and do not weaken a leg to reach
   green — CLAUDE.md rule 5 governs.

## Non-scope (explicitly the other six lanes' files and work)

- **`domain-backend` (`brief-conveyor-resolver-3f7a`)** — all of `tools/**` and `package.json`:
  `tools/conveyor.ts` (`nextSteps`, `deriveStage`, `CONVEYOR_CLASS_ROUTING`), `tools/issue_sync.ts`
  (`planIssueSync`), `tools/spec.ts` (`status` in `SUBCOMMANDS`/`USAGE`), `tools/indexer.ts`
  (`INDEX_FILES` at `:35`, the four-key literal at `:99-108`, the two serializers),
  `tools/handlers/coverage_traversal.ts` and `coverage_coherence.ts` (A11), `tools/driftmap.ts`.
  Carries thirteen amendments — A2, A5, A7's resolver rule, A8, A11, A12's **decision**, CC-4,
  CC-5's seam, CC-6, CC-8's totality implementation, CC-10(c), CC-11, CC-14. This lane imports
  those symbols and writes none of them.
- **`data-migration` (`brief-conveyor-schema-graph-8b2e`)** — `specs/schema/node-types.yaml` (the
  optional `owner` field itself, the lane-comment pointer, CC-13's "live intent" definition) and
  **all** graph data under Scope 14 (the ten `touches` edges, the two capability `paths` widenings,
  the PR #4 `drift-finding` + `flags` edge, the two follow-up intents, the `.gitignore`
  authorization artifact). Carries CC-9's field, CC-13, A13's lane-name correction. `test-writer`
  performs **no** graph writes at all — this lane's own `decomposes`, `evidences` and `touches`
  edges are recorded by graph-maintainer, never by this lane.
- **`api-integration` (`brief-conveyor-commands-c14d`)** — all fifteen `.claude/commands/*.md`
  files (fourteen chain plus `detect-drift.md`). Carries A1 (the fallback this lane's A6 pin must
  not be satisfiable by), A3, A4, A7's command edit, A14, A15/CC-7, A16's `/decompose-lanes`
  refusal, CC-1, CC-11. The `select-patch.md:40` correction (it prints
  `/prepare-evidence <winner-branch>` today — verified this session) is theirs; this lane asserts
  the resolver returns the brief id, not that the file was edited.
- **`observability-release` (`brief-conveyor-ci-6a9f`)** — `.github/workflows/**` and
  `.github/CODEOWNERS`: the new `issue-sync.yml`, **A9's transcription CI job**, the
  `drift-review.yml` flip. Carries A9, A16/CC-3, CC-5's scheduled trigger, CC-10a. A9's job is the
  half of "IDs resolved not recalled" that A6 explicitly does not cover.
- **`product-spec` (`brief-conveyor-lane-catalog-2d5b`)** — `.claude/lanes/**` (the eight catalog
  files every union leg reads), `.claude/agents/**` (the seven implementer agents, plus
  `spec-writer`, `contract-reviewer`, `test-writer` — including the `Bash` grant this lane's own
  agent needs to run its suite), and `.gitignore` (the `!.claude/lanes/` negation at `:13`, after
  the two existing negations at `:11-12`, without which union leg 12 is the only leg that fails and
  nine others pass vacuously). Carries A10, CC-2's authoring half, CC-9's `eligible_agents` /
  `default_agent`, CC-16's authoring half, CC-10(d)'s `integration-reviewer.md` half.
- **`docs-spec` (`brief-conveyor-docs-9e31`)** — `CLAUDE.md` (including the work-class table this
  lane parses and lifecycle step 5's A7 amendment), `README.md`, `CONTRIBUTING.md`, `docs/**`.
  Carries A7's governing-doc half, CC-10b, CC-10(d)'s doctrine half, CC-12's naming half, CC-13,
  CC-14. **This lane never edits `CLAUDE.md`, only reads it as the pinned source of truth.**
- **Cross-lane clause, now taken by `product-spec`: CC-16's `specs/indexes/** needs a merge rule`.**
  That is a `.gitattributes` entry; **`.gitattributes` does not exist in this repository** (verified
  this session), and `brief-conveyor-lane-catalog-2d5b` discharges it by creating that file with the
  rule `specs/indexes/** -merge` — carried in its Files to create, its CC-16 pinned decision, its
  ordered step 1 and its discharge sentence. The nearest holder was indeed `product-spec`, which owns
  the other root VCS-config file (`.gitignore`); this lane does **not** take it, so the integration
  node's CC-16 row has a named holder rather than a silent drop.

## Cross-lane dependencies & integration expectation

- **Depends on `domain-backend`** for every imported symbol: `nextSteps`, `deriveStage`, the view
  serializers, `planIssueSync`, `CONVEYOR_CLASS_ROUTING` (pinned — A12 is settled to pin), the
  widened `INDEX_FILES` and the `status` subcommand. **A12's choice is already recorded in that
  brief's `## Pinned decisions`; step 5 re-confirms it rather than waiting on it.** A further ask,
  optional and this lane's to state, not to
  impose: `tools/spec.ts:94` runs `process.exit(main())` at module scope, so `SUBCOMMANDS` is not
  importable; if `domain-backend` chooses to guard the entrypoint, this lane's usage leg can
  tighten from a parsed set to a direct set-equality against the export. Until then the parse
  stands.
- **Depends on `product-spec`** for `.claude/lanes/**` (legs 1, 5-12), `.claude/agents/**` (legs 7,
  9, 13 and the CC-2 pins) and the `.gitignore` negation (leg 12), and for `test-writer.md`'s
  `Bash` grant — without it this lane's agent cannot run the suite it writes
  (`.claude/agents/test-writer.md:6` is `tools: Read, Write, Edit` today).
- **Depends on `data-migration`** for the `owner` field on `brief` (leg 13) and for the graph data
  the real-tree green check runs over.
- **Depends on `api-integration`, and this dependency is bidirectional and the sharpest in the
  change.** A6's pin and A1's fallback are one negotiated contract across two lanes: this lane
  asserts a marker the other lane writes, and the assertion is only sound if the marker is exact.
  **The literals are already fixed by the A1/A6 distinguishability contract above — the
  `pnpm spec:status` invocation token and the `FALLBACK (RESOLVER UNAVAILABLE):` delimiter — which
  is reproduced byte-for-byte in `brief-conveyor-commands-c14d`; neither lane may vary it
  unilaterally.** Any change to those literals is a joint amendment to both briefs, never a
  unilateral adoption of the other lane's wording; what neither lane can accept is a fallback whose
  text is indistinguishable from a real resolver invocation,
  because that makes A6 satisfiable by the very prose A1 says must not satisfy it.
- **Depended on by `observability-release`** — the green suite is the substance `ci.yml:19` runs,
  and A9's transcription job is the runtime complement to A6's file-level pin.
- **Depended on by the contract's final `integration` node**, which cannot mark the intent
  `addressed` until this lane reaches final evidence.
- **Integration expectation.** This laned brief reaches `implemented` via **its own final
  evidence**, while `intent-self-guiding-delivery-loop-6d79` stays **open**. Seven briefs make this
  contract multi-brief under `coverage-coherence` (cutoff `2026-06-18`; the contract's `2026-07-27`
  `created` is after it), so `contract-conveyor-derived-4c8c` completes **only** via a final
  `integration` node (authored by `/integrate`) that `integrates` a final evidence for **every**
  live lane. The intent reaches `addressed` only through that integration, never through this
  lane's evidence alone. **A collapsed lane is superseded per CLAUDE.md rule 3** (`supersedes`
  edge, old node moved to its terminal status), never forced into a ceremonial integration. Per
  CC-10(d) the integration node's `compliance-verdict` section enumerates CC-1…CC-16 and A1…A16 and
  names each one's discharging brief; the rows this brief answers for are **A6, A12 (pin form),
  A13, CC-2, CC-5, CC-8, CC-9, CC-12, CC-15, CC-16**.

## Acceptance & verification (scoped to this lane)

This lane owns the test code that discharges the contract's machine-checkable acceptance. Each item
below names the contract or amendment clause it answers.

1. **Acceptance 2, "Unit-tested routing"** → `tests/conveyor.test.ts`: `nextSteps` on a selected
   patch returns `/prepare-evidence <brief-id>` via `competes-for` and never a branch; on a class-3
   approved contract returns `/decompose-lanes`, never `/write-brief`; on a one-candidate class-1
   intent returns `/approve-contract`. Plus A7's `brief`-at-`implemented` rule and A5's graph-state
   terminality, both of which the base contract's Behaviour 2 lacked.
2. **A13 / CC-15, the union pin** → `tests/lane_catalog_drift.test.ts` carries **thirteen** named
   legs, each failing independently: editing one catalog file's lane without `CLAUDE.md` reds leg
   1; naming an agent no `.claude/agents/` file provides reds leg 7; a `default_agent` outside
   `eligible_agents` reds leg 8; a hint naming a non-catalog lane reds leg 10 (A-only, and absent
   from the base candidate); a `git ls-files .claude/lanes` count differing from the CLAUDE.md
   table's row count reds leg 12. **The suite must not describe itself as a "ten-leg pin"
   anywhere.**
3. **A6** → a chain command file with no `pnpm spec:status` outside its fallback region reds A6.2; a
   command whose only mention is inside the fallback reds A6.2 and A6.3; a fallback carrying a
   resolved node id reds A6.4. **Honest bound recorded in the file and the evidence:** this pins
   the instruction, not the run.
4. **Acceptance 5 + CC-8** → `spec:index` run twice is byte-identical over all six index files; the
   views serialize identically under two far-apart fake clocks; neither view contains a
   `YYYY-MM-DD` substring; the derivation is total and `nextSteps` never returns `[]`. The reason
   is `spec-index.yml:21`, which diffs `specs/indexes/` on every PR.
5. **CC-12** → `tests/fixtures/conveyor-transcript/transcript.yaml` replays byte-identically
   against the recorded graph, and its `command` set covers all fourteen chain commands.
   Acceptance 1 gains a regression artifact; its remaining honest bound is stated, not claimed
   away.
6. **CC-9 / A16** → leg 13 is green against the live graph on the very PR that adds it (all seven
   briefs of this decomposition carry no `owner`), and the two synthetic must-fire cases prove it
   is not vacuous.
7. **CC-2** → every new agent's `tools:` line matches its pinned literal; `contract-reviewer`'s
   read-only-`git` fence and its data-not-instruction sentence are present.
8. **CC-5 / A2** → the `planIssueSync` suite covers the no-op re-run, the reopen of a hand-closed
   lane, close on final evidence, close on final integration, close on superseded/rejected, the
   abort-before-mutating-on-incomplete-listing case, and the planned/applied/failed report shape.
9. **Scope 11.4 + 11.5** → `spec.test.ts` re-declares no `INDEX_FILES`; the usage set includes
   `status`; `spec:status` exits 0 and leaves the fixture tree byte-unchanged; the five
   index-bearing fixtures each carry six index files; the three `expected-errors.txt` each pin
   three `indexes-fresh` lines in `by-type.yaml` / `status.md` / `trails.md` order; and
   `dispatch-all-kinds`' per-rule count map expects three for `indexes-fresh`.
10. **Real-tree green (CI / mutation discipline)** → `node --test --import tsx tests/*.test.ts` all
    green, then `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts
    validate` green on the post-change tree. Nothing is committed on red.
11. **Review-only, admitted** (contract Acceptance 8) → whether a leg's assertion is the *right*
    assertion, whether the transcript fixture's recorded graph is representative, and whether the
    A6 markers were well chosen remain reviewer judgement, recorded in this lane's evidence and in
    the final integration node.

---

**Edge for graph-maintainer to record for this brief node:**
`brief-conveyor-tests-4c86 —decomposes→ contract-conveyor-derived-4c8c`, with this brief carrying
`lane: test-verification` and **no `owner` key** (the bootstrap in the lead paragraph).

**Capability wiring, for this lane's later `/prepare-evidence`:** this lane's diff falls entirely
under `capability-spec-tests-3a6e` (`paths: [tests/**]`, `capability-spec-tests-3a6e.md:6`), so its
evidence authors exactly one `touches` edge, to that capability.

**Mutating-step reminder:** when graph-maintainer records this brief (and later its evidence and
`touches` edge), the step ends with `pnpm spec:index && pnpm spec:validate` — in this PRoot
environment `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts
validate` — and must not commit on failure.
