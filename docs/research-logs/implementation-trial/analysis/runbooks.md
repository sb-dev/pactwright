# A2-R — Specifications and checkpoint instructions

The audit of `docs/checkpoints/**` and the specifications that own them, run
against the pinned reference `19c66d5f2368932ff05306db1fae8da8ec5810dd`.

**Session:** A2-R, 22 September 2026. **Branch:** `trial/a2-runbooks`.
**Skills applied:** `documentation-and-adrs`, `acquire-codebase-knowledge`
(both read from `.claude/skills/`, the versions pinned in `skills-lock.json`;
no skill was installed, upgraded or modified).

This report does not edit `docs/specs/**` or `docs/checkpoints/**`. Every
change it argues for is a proposal for A5/A6.

---

## 1. Base, branch and one deviation to record first

The runbook's A2 section says each audit session must prove `HEAD` descends
from **`a2_base_sha`**, recorded in `state.md`, and that all five audit
branches are cut from `trial/a2-base`.

**Neither exists.** `state.md` records no `a2_base_sha` key, `trial/a2-base`
is not on `origin`, and `trial/a2-runbooks` had not been pushed. `state.md`
was written against an earlier A1 layout that used one overlay commit per
isolated local clone
([`evidence/a1/a2-checkouts.md`](../evidence/a1/a2-checkouts.md)), and the
five overlay SHAs it records are from clones on the A1 machine — none of them
is reachable from this repository (`git cat-file -t a295986a…` fails). The two
sibling branches that *are* pushed carry their own, different overlay commits
(`209cdcd` for A2-G, `7f26783` for A2-L), so there is no shared base commit
either.

What this session did instead, recorded rather than assumed:

| | |
|---|---|
| Branch | `trial/a2-runbooks`, created here from `19c66d5f` |
| Effective base (`a2_base_sha` for this branch) | `69cdc95a9d5ed578ef21c165b359ace8f5a2954f` |
| Base contents | `19c66d5f` + the 28-file trial overlay (runbook, `implementation-trial/`, `tools/implementation-trial/`) |
| Production diff at the base | `git diff --cached --name-only 19c66d5f -- src packages tests specs .pactwright .claude .github examples skills-lock.json package.json pnpm-lock.yaml docs/specs docs/checkpoints README.md CHANGELOG.md` → **0 paths** |

Recorded here as **A2R-00**: the runbook's own A2 precondition is
unverifiable as written, and every audit session must either invent a base or
stop. It is listed because a coordinator checking "descends from the recorded
`a2_base_sha`" will find nothing to check against.

**Environment.** Node `v22.22.2`, pnpm launcher `11.7.0`, Linux
`6.18.44-fc-v37`. A1's baseline was macOS/Node 22. This matters for one
result below.

---

## 2. Method, and what "evidence" means here

Statuses follow runbook §1.3: `executed-pass`, `executed-fail`,
`code-traced`, `not-reproduced`, `not-run`, `environment-blocked`. Anything
marked `executed-*` was run in this checkout in this session, with its exit
code read; everything else says so plainly.

Causes follow `analysis/README.md`: **missing requirement, ambiguity,
contradiction, unenforced requirement, inadequate test, environment
assumption**.

From `documentation-and-adrs` the audit takes one test in particular: *where
is the decision recorded, and does the record still match what was built?*
From `acquire-codebase-knowledge` it takes the rule that every claim names a
file, a command or an exit code, and that intent-vs-reality divergences are
reported rather than smoothed over. That skill's seven-document output
contract is **not** applied — it would write `docs/codebase/**`, which is
outside A2-R's permitted paths.

Committed evidence lives in
[`../evidence/a2/runbooks/logs/`](../evidence/a2/runbooks/logs/).

---

## 3. Findings

### 3.1 The released-baseline comparison cannot be performed

#### A2R-01 · Step 28's baseline comparison is unsatisfiable by any released artefact combination · `executed-fail`

**Requirement.** Checkpoint 1 v17 Step 13: *"After `0.0.1` is published, Step
28 must prove resolution against the real released baseline."* Step 28's
verification block, and exit condition 19: *"baseline/candidate evaluation
reports meaningful per-dimension regressions and **resolves the real released
`@pactwright/standard@0.0.1` baseline**."* Owned by Distribution §24.

**Public trigger.** The exact command the runbook prints:

```bash
pnpm pactwright eval \
  --baseline @pactwright/standard@0.0.1 \
  --candidate @pactwright/standard@0.0.2
```

**Source and test locations.** `packages/standard/pack.yml:3`
(`pactwright: 0.0.2`); `src/pack/resolve.ts:98-102` (the compatibility gate);
`src/pack/locate.ts:27-38` (`satisfiesRange`); `src/eval/acquire.ts:95-107`;
`src/cli.ts:786-800`.

**Expected effect.** The baseline resolves and per-capability, per-agent,
per-case comparison results are emitted.

**Actual effect.** Exit 1 before either side is evaluated:

```
pactwright: could not acquire the baseline "@pactwright/standard@0.0.1"
  … pack "@pactwright/standard@0.0.1" requires pactwright 0.0.1;
    this runtime is 0.0.2 [incompatible-runtime]
```

**Evidence.** `executed-fail`, exit 1, at `69cdc95` with the reference's
`dist/` built from `19c66d5f`:

- [`logs/01-step28-baseline-comparison.log`](../evidence/a2/runbooks/logs/01-step28-baseline-comparison.log)
  — the command verbatim.
- [`logs/02-step28-candidate-side.log`](../evidence/a2/runbooks/logs/02-step28-candidate-side.log)
  — the same failure with a local candidate, so only the baseline side can
  fail; plus the registry state (`pactwright` and `@pactwright/standard` both
  publish **only** `0.0.1`).
- [`logs/03-released-runtime-has-no-comparison.log`](../evidence/a2/runbooks/logs/03-released-runtime-has-no-comparison.log)
  — the released `pactwright@0.0.1` runtime answers
  `pactwright: unknown option "--baseline"`. The comparison surface does not
  exist in any published runtime.
- [`logs/05-compat-range-algebra.log`](../evidence/a2/runbooks/logs/05-compat-range-algebra.log)
  — the decisive part.

**Why it is structural, not a bug to patch.** `pack.yml`'s `pactwright:`
field accepts `x.y.z` or `^x.y.z` (`src/pack/manifest.ts:38`). Under npm caret
semantics, which `satisfiesRange` implements faithfully, `^0.0.z` **is
exact**. So during the whole `0.0.x` series there is *no declarable value*
that lets a `0.0.1`-era pack run on a `0.0.2` runtime:

```
pack.yml pactwright: 0.0.1    -> satisfiesRange("0.0.2", "0.0.1")  = false
pack.yml pactwright: ^0.0.1   -> satisfiesRange("0.0.2", "^0.0.1") = false
```

The constraint lifts only from `0.1.0` onward (`^0.1.0` admits `0.1.1`). Two
release ladders therefore collide: the Implementation Guide puts Checkpoints
1–9 entirely inside `0.0.x`, and Checkpoint 1 requires a cross-version
baseline comparison inside `0.0.x`. One of them has to give.

**Cause.** **Missing requirement.** No step in Checkpoint 1 requires the
Agent Pack's declared runtime compatibility to be expressible across
releases, and no step notices that the guide's `0.0.x` ladder forbids it.
This is not loose wording — Step 13 and exit condition 19 are explicit, and
they are explicitly unsatisfiable.

**Acceptance proposal.** Pick one and write it into the runbook:

1. *Preferred.* Move the first released baseline comparison to the first
   release pair that can express compatibility — Checkpoint 2's
   `0.0.2 → 0.0.3` under a `^0.1.0`-style scheme, or promote the release
   ladder out of `0.0.x` earlier. Keep Step 13's **fixture** proof in
   Checkpoint 1 exactly as it is, and move the *real released baseline*
   obligation, with its exit condition, to the checkpoint that can meet it.
2. Or state in Step 10 that a pack declares a **range**, require
   `packages/standard/pack.yml` to carry one, and add a proof: *acquire a
   pack built for the previous release under the current runtime and show
   `resolvePack` accepts it.* This needs the version scheme to leave `0.0.x`
   first, so it does not stand alone.

Either way, add the missing proof obligation: **a released-baseline
comparison is only provable once two releases exist whose declared
compatibility ranges overlap; the runbook must say which two.**

---

### 3.2 Release-number drift

#### A2R-02 · Checkpoint 1 and Checkpoint 2 both publish `0.0.2` · `code-traced`

**Requirement.** Checkpoint 1 v17 header: *"**Release:** `0.0.2`
(corrective…)"*; Step 28 publishes `pactwright@0.0.2` and
`@pactwright/standard@0.0.2`; exit condition 23 gates on them being registry
verified. Checkpoint 2 v16 header: *"**Release:** `0.0.2`"*
(`02-remote-delivery.md:5`), Stage 6 is literally *"Release `0.0.2`"*
(`:626`), Step 16 tags `v0.0.2` (`:634-638`), exit gate requires
`pactwright@0.0.2` registry verified (`:886`).

**Expected effect.** Each checkpoint publishes a distinct immutable version.

**Actual effect.** Two checkpoints publish the same version. npm reserves a
version permanently — the same reason Checkpoint 1 gives for not re-cutting
`0.0.1`. Only one of the two can succeed, and the second will fail at exactly
the step its exit gate depends on.

**The damage runs further than a duplicate number.** Checkpoint 2's central
Kakeibo proof is *"a real, exact published `0.0.1 → 0.0.2` runtime/Agent Pack
upgrade"* (`:138`, `:647-700`, exit `:888`), which begins with Kakeibo running
`pactwright@0.0.1` (`:653-657`) and explicitly forbids preinstalling `0.0.2`
(`:660`). Checkpoint 1 Step 29 now installs **`0.0.2`** into Kakeibo. After
Checkpoint 1, Checkpoint 2 has no upgrade left to prove and its starting state
cannot be reached.

The Implementation Guide — which Checkpoint 1 §2 names as canonical baseline —
still carries the original map:

```
00-implementation-guide.md:413   Checkpoint 1 → 0.0.1
00-implementation-guide.md:414   Checkpoint 2 → 0.0.2
…
00-implementation-guide.md:421   Checkpoint 9 → 0.0.9
00-implementation-guide.md:312   0.0.1  README Quick Start + Getting Started + core Delivery example
```

and Checkpoints 3–9 each expect the previous checkpoint's number as their
baseline (`0.0.2 → 0.0.3`, `0.0.3 → 0.0.4`, … `0.0.9 → 0.1.0`).

**Cause.** **Contradiction.** Checkpoint 1 was re-cut from `0.0.1` to `0.0.2`
without renumbering the ladder or its owning guide.

**Acceptance proposal.** Decide the ladder once, in the Implementation Guide,
and propagate:

- Guide §"release map": `Checkpoint 1 → 0.0.1 (published) + 0.0.2
  (corrective re-cut)`, `Checkpoint 2 → 0.0.3`, … `Checkpoint 9 → 0.0.10`, or
  an explicit skip. Update the public-content ladder at `:312-321` to match.
- Checkpoint 2 header, Stage 6 title, Step 16 tag, Step 17 upgrade pair and
  exit conditions: the new pair.
- Add one exit condition to the guide: *"no two checkpoints publish the same
  package version."* It is checkable mechanically and would have caught this.

#### A2R-03 · Checkpoint 1's own Stage titles still say `0.0.1` · `code-traced`

`01-self-hosted-delivery.md` after the re-cut:

| Location | Text |
|---|---|
| §1 Goal | *"adopt it in Pactwright, publish **`0.0.1`**"* |
| Stage 8 heading | *"Complete the **`0.0.1`** public learning path"* |
| Step 27 | *"install/execute/upgrade **`0.0.1`**"* |
| Stage 9 heading | *"Publish **`0.0.1`**"* |
| Step 28 body | publish **`0.0.2`** |
| Exit 23 | `0.0.2` registry verified |
| Exit 25 | the **`0.0.1`** public content set |

**Cause.** **Contradiction**, intra-document. The header and Step 28 were
corrected; the Goal, two Stage headings and Step 27 were not.

**Acceptance proposal.** Rewrite Stage 8 as *"Complete the public learning
path for the corrective release"* and Stage 9 as *"Publish the corrective
release"*; make Step 27 name `0.0.2`; keep exit 25's reference to the `0.0.1`
content set only if A2R-12's readiness problem is resolved, and say
explicitly which release's content is being gated.

---

### 3.3 Explicit requirements that were simply ignored

These are not loose wording. Each is an imperative sentence that the delivered
system contradicts.

#### A2R-04 · Step 14 forbids inventing a CLI flag; Step 29 invents one · `executed-pass` (the flag exists and works)

Step 14: *"Exact input ergonomics are implementation details; **do not invent
an additional canonical CLI flag in this runbook**."*
Step 29, twelve pages later: `pnpm pactwright init --agent-pack @pactwright/standard`.

The flag is real (`src/cli.ts:41`, `README.md:11`, `docs/getting-started.md:13`)
and A1 exercised it successfully
([`evidence/a1/baseline-checks.md`](../evidence/a1/baseline-checks.md), check 7).
Its origin is traceable: the 19 September review's **R13** asked Step 29 to
name a pack, and the consolidation design records the fix as *"one line in
Step 29"* with no corresponding amendment to Step 14.

**Cause.** **Contradiction.** A correct fix applied at the wrong altitude.

**Acceptance proposal.** Step 14 should stop forbidding the flag and start
owning it: *"Selection is supplied to `init` through one documented input.
This runbook names it `--agent-pack <source>`; an implementation may add
equivalent inputs but must not require a second resolver."* Then Step 29 is
consistent by construction, and Steps 23 and 25 can cite the same name
instead of the phrase *"the documented normal init selection interaction/input"*,
which appears five times and names nothing.

#### A2R-05 · Step 16 requires an installation order that cannot exist · `code-traced`

Step 16: *"Installation must: … **install required dependencies first through
the same normal installation path**."* Exit condition 15 gates on *"Extension
dependency-first installation … fixture-proven."*

`src/extension/manage.ts:275-284` explains why this cannot be done, and the
explanation is correct: an Extension's dependencies are declared **in its
manifest**, and the manifest cannot be read until the package is installed.
The runtime therefore installs in discovery order and orders **enablement and
locking** dependency-first. The 19 September review reported the old
behaviour as defect R10 *"the add walk installs the requested Extension
before its dependencies"*; the consolidation's delivery notes record the
correction as *"Installation cannot be dependency-first"*
(`2026-09-20-…-consolidation-design.md:863-868`) and note that the test
asserting the old order *"pinned a defect rather than a behaviour"*.

So the checkpoint still gates on a literal impossibility, the correction
lives only in a research log and a source comment, and Distribution §19
(*"Extension dependencies are installed and locked through the same managed
path"*) is satisfied by the current behaviour.

**Cause.** **Contradiction** between an explicit instruction and a physical
constraint the instruction does not acknowledge.

**Acceptance proposal.** Split the two orderings in Step 16:

> Resolve and install every package in the Extension dependency graph through
> the project package manager. Ordering of *installation* is unconstrained —
> a manifest cannot be read before its package exists. **Enablement, capability
> validation and locking are dependency-first**: a dependency is registered and
> locked before any Extension that requires it.

and change exit condition 15 to *"Extension dependency-first **enablement and
locking**, exact locking, versioned migration, failure recovery, blocked
removal and preservation of user-authored data are fixture-proven."*

#### A2R-06 · Checkpoint 1 contains no step for `lifecycle record` or `execution.executor`, both now required by its owning specifications · `code-traced`

`grep -n "lifecycle record\|execution.executor\|executor" docs/checkpoints/01-self-hosted-delivery.md` returns **nothing**.

Both are mandatory in the amended specifications the checkpoint declares as
canonical:

- **Core §46** (`docs/specs/01-…:1449-1463`) requires
  `pactwright lifecycle record <stage>` and states that *"one `lifecycle
  record` stage records an authorised Gate resolution, so a configured Gate is
  resolvable through a normal runtime operation rather than by editing
  execution state by hand."*
- **Distribution §3** (`docs/specs/02-…:132-150`) requires
  `execution.executor`, default `none`, and *"Autonomy is declared, never
  inferred."*

Checkpoint 1 Step 8 implements only `status`, `next` and `run`. Step 12
implements the seven adapter commands. Nothing tells an implementer to build
the runtime operation that records a Gate resolution, or to declare who
performs automatic responsibilities.

This is the cause of two reproduced review findings. **R04**: *"There is also
no normal CLI operation for recording an authorised Gate resolution. The suite
constructs Gate state directly with `writeExecutionState`."* **R05**: *"The
CLI always supplies `execute: noExecutor`."* Both were fixed in the runtime
and in the specifications; **neither was written back into the checkpoint**.
A re-implementation following Checkpoint 1 v17 as written reproduces both.

**Cause.** **Missing requirement**, created by amending specifications without
amending the checkpoint that owns construction order. The checkpoints README
states the authority rule — *"If a checkpoint conflicts with a canonical
Pactwright specification, the canonical specification wins and **the
checkpoint must be corrected**"* — and it was not applied.

**Acceptance proposal.** Add to Stage 2, as a new Step 8b (or extend Step 8):

> Implement `pactwright lifecycle record <command>` as the single runtime
> entry point for a completed adapter command, an execution-step result and an
> **authorised Gate resolution**. The runtime checks the resolving actor
> against the Gate's required authority before any state changes; an
> unauthorised attempt leaves execution state byte-identical.
>
> **Verify before continuing:** a configured human Gate is resolvable without
> editing `.pactwright/execution/` by hand; an unauthorised resolution leaves
> the state file byte-identical; the adapter path and the automatic executor
> pass through the same guard.

and to Step 10 or a new Step 13a:

> Declare the capability executor in project configuration
> (`execution.executor`, default `none`). Evaluation and `lifecycle run` use
> the same interface. With no declared executor the runtime **refuses** and
> reports every evaluation case as unevaluated; it never scores the harness's
> own reference implementation as though a pack produced it.

#### A2R-07 · Step 26's identity-authorisation requirement was not met and nothing gates it · `code-traced`

Step 26: *"Before PI exists, identity/positioning/product choices required by
this public work **must be authorised through Decision + Contract rather than
invented**."* Backed by Implementation Principles §7 *"Public-Content
Authority and Readiness"* and Spec 08 invariant 21 *"Identity and positioning
choices are Decisions rather than generated assumptions."*

The self-hosted graph holds three Decisions (`specs/nodes/decision-*.md`).
All three choose a **document structure** — *"Alternative B chosen: one guided
Quick Start section"*, *"a Getting Started guide plus a separate runnable
example directory"*, *"realign all three together against proven behaviour"*.
None authorises identity, positioning or a product claim.

Meanwhile the published package carries exactly such claims:
`package.json:4` — *"Graph-native AI software delivery: intent, decision,
contract, brief and evidence recorded in the repository"* — plus its keyword
set and homepage, and `README.md:53-67` makes capability claims about the
product. Those were invented, in the precise sense Step 26 forbids.

**Cause.** **Unenforced requirement.** Step 26 states the rule but its
*Verify before continuing* is *"Evidence and public instructions agree with
clean-consumer behaviour"* — which checks instructions, not authority — and
no exit condition mentions identity at all. Checkpoint 2 Step 12 repeats the
same rule with the same absence of a proof.

**Acceptance proposal.** Give the rule a proof and an exit condition:

> **Verify before continuing:** every identity, positioning or product claim
> appearing in the released public surface (package description and keywords,
> README headline and capability claims, guide framing) traces to a `proceed`
> Decision and its selected Contract. List the node ids. A claim with no
> authorising Decision is either removed or authorised before release.

and add exit condition: *"every product claim in the released public surface
traces to an authorising Decision and Contract."* Apply the same to
Checkpoint 2 Step 12.

**Related, smaller.** The three Decisions record two spellings of one person —
`decided_by: human:samir-benzenine` (×2) and `human:samir` (×1). Actor
identity is not canonicalised anywhere in Checkpoint 1, yet Gate and Decision
authority checks compare actors. This is a **missing requirement**; Step 7 or
the new Step 8b should require a canonical actor identifier form and reject
unknown spellings.

#### A2R-08 · Step 9 forbids `pactwright context` as a public contract; it ships in `--help` and in the released example · `code-traced`

Step 9: *"**Do not introduce `pactwright context` as a required public CLI
contract.**"* Spec 01 §39 (*Context*) describes context assembly and requires
no CLI.

`src/cli.ts:62` documents `context <node-id> [--history] [--json]` in the
public help text; the released `pactwright@0.0.1` runtime carries it too
([`logs/03`](../evidence/a2/runbooks/logs/03-released-runtime-has-no-comparison.log));
and `examples/core-delivery/README.md:81` teaches
`pnpm pactwright context <intent-id>` to new users. A command in `--help` and
in the shipped learning material is a public contract in every sense that
matters to a consumer.

**Cause.** **Contradiction.** Not a severe one — the command is useful and the
runtime is better for having it — but the runbook says one thing and the
release does another, and no exit condition covers it either way.

**Acceptance proposal.** Decide it explicitly rather than leaving a
prohibition the release ignores. Recommended: *"The runtime context-assembly
API is the required contract. A `pactwright context` inspection command is
permitted and, if shipped, is documented and covered by the deterministic
proofs in Step 24; it must not become the path Agent Packs use to obtain
context."* Then add it to exit condition 17's command list, or say it is
deliberately excluded.

---

### 3.4 Unfounded atomicity and completion claims

#### A2R-09 · "Atomic write" and "no partial state" are proven only against handled failures · `code-traced`

Step 7: *"All mutations use plan → validate complete proposed state → **atomic
write** → validate resulting state"*, *"failed mutation leaves no partial
state"*. Exit condition 6: *"all five Evidence closure preconditions are
enforced before **atomic canonical mutation**."*

What is actually built (`src/graph/mutations.ts:100-250`): the sequence runs
under a repository writer lock; each file is written to a temporary sibling and
renamed; `edges.yml` renames last; on a thrown error a best-effort `restore()`
unlinks the new node files and rewrites the previous `edges.yml`. The code
says so honestly — `src/graph/writer-lock.ts:17-28` states that the
compare-and-swap *"is not an atomic compare-and-swap"* and that the lock *"is
a file, not a database"*, and `src/graph/mutations.ts:184-187` says *"The lock
is what makes the sequence atomic."*

That is true for **concurrent writers**. It is not true for **interruption**:
a crash between the node rename and the `edges.yml` rename leaves node files
on disk with no edges, and `restore()` never runs. Step 7's *Verify before
continuing* asks only for *"forced write/validation failure"* — a handled
failure, the one case the code does cover.

**Cause.** **Ambiguity.** The instruction uses one word, "atomic", for two
different guarantees and then proves the weaker one.

**Acceptance proposal.** Say which guarantee is required, and prove each:

> A canonical mutation is **serialisable** against other processes and
> **all-or-nothing against handled failure**. Crash-atomicity is not claimed
> in this checkpoint; state the recovery position instead — after an
> interrupted mutation the repository must still load, and `validate` must
> report the inconsistency rather than accept it.
>
> **Verify before continuing:** in addition to forced write and validation
> failure, interrupt a mutation between the node write and the edge write and
> show that (a) the project still loads and (b) `validate` reports the missing
> lineage rather than passing.

The runtime verdict on crash behaviour belongs to **A2-D**, whose prompt owns
*"Separate handled-failure and process-crash guarantees."* This finding is
about the instruction.

#### A2R-10 · Exit condition 18 is satisfied while nothing is evaluated · `executed-fail`

Exit condition 18: *"core evaluation covers Contract fidelity, scope
discipline, Brief quality, Review quality, Evidence accuracy and lifecycle
compliance."* Exit condition 17: *"… and core `eval` work[s]."*

Run in this repository, on its own committed configuration:

```
$ pnpm pactwright eval
Evaluating @pactwright/standard@0.0.2 (runtime 0.0.2, suite core-delivery)
contract-fidelity … error: no executor is configured, so the pack's behaviour was not evaluated
… (all eight cases)
Deterministic assertions: 0 passed, 0 failed; 8 case(s) not evaluated.
Semantic dimensions: 0 judged, 0 unjudged.
exit: 1
```

[`logs/04-core-eval.log`](../evidence/a2/runbooks/logs/04-core-eval.log).
`.pactwright/config.yml` declares no `execution.executor`, so the default
`none` applies.

The suite **covers** all six named dimensions — the case list is right there.
It **evaluates** none of them. Exit condition 18 says "covers", and is
therefore literally satisfied by a suite that measures nothing.

**Cause.** **Ambiguity** in the exit condition, compounded by the
**missing requirement** in A2R-06 (nothing tells the implementer to declare an
executor). The runtime's behaviour here is *correct and worth preserving* —
see §4 — which is exactly why the exit condition needs to be sharper rather
than the code changed.

**Acceptance proposal.** Replace exit condition 18 with:

> core evaluation **evaluates** — not merely declares — Contract fidelity,
> scope discipline, Brief quality, Review quality, Evidence accuracy and
> lifecycle compliance against a declared executor, and reports `unevaluated`
> rather than a score when no executor is declared.

and give Step 13 a matching *Verify*: run the suite once with
`execution.executor: none` and require every case `unevaluated` with a
non-zero exit; run it once with a declared executor and require every case
evaluated.

#### A2R-11 · Step 13's regression proof is satisfiable by a string match · `code-traced`

Step 13 *Verify*: *"introduce known regressions in Evidence accuracy and
lifecycle compliance. Require each to appear at its affected
capability/agent/case dimensions."*

The harness's regression demonstration recognises a degraded pack by matching
a hard-coded sentinel (`src/execute/scripted.ts:87-89`):

```ts
export function promptSaysNothing(prompt: string): boolean {
  return /ignore all tasks|return nothing|do not (?:do|perform) anything/i.test(prompt);
}
```

The design intent is documented and honest — it closes review finding R06,
where a fixture pack with every prompt replaced by *"Ignore all tasks. Return
nothing"* passed all eight cases. But what the proof now demonstrates is that
the harness detects **that exact phrasing**. A genuinely worse prompt — one
that works badly rather than announcing refusal — is invisible to it.

**Cause.** **Ambiguity** in the instruction: "known regression" does not say
*behavioural*, so a lexical one satisfies it. The test-quality verdict is
**A2-V**'s (its prompt owns *"sentinel-specific scoring"*); this finding
concerns what Step 13 asks for.

**Acceptance proposal.** Require the regression to be behavioural:

> The injected regression must change what the pack **does**, not how its
> prompt is worded. A pack whose prompt is merely rephrased must not regress;
> a pack whose agent omits a required output, mutates forbidden state or skips
> a Gate must regress at exactly the affected capability, agent and case. A
> detector that recognises a fixed sentinel string does not satisfy this step.

---

### 3.5 Ambiguous proofs

Each *Verify before continuing* below can be reported as passed without the
property it names having been established. Listed with the smallest change
that fixes it.

| Step | Current proof | Why it is ambiguous | Proposed proof |
|---|---|---|---|
| 23 | *"explicit and one-shot composition resolve equivalent state"* | "equivalent" is undefined. Step 16 defines it properly (*"equivalent configuration, package locks, resolved environment identity, canonical structure and generated output, not merely successful exit codes"*); Step 23 does not, and Step 23 is the consumer-facing one | Reuse Step 16's list verbatim, and name the artefacts: `.claude/**`, `.pactwright/config.yml`, `.pactwright/lock.yml`, `.pactwright/lifecycle.yml`, the package-manager lock, and `environment_lock_hash`. A1's check 7 in fact compared exactly these — the runbook should ask for what A1 did |
| 24 | *"complete core evaluation dimensions to pass"* | Under A2R-10 a dimension can neither pass nor fail | *"every core evaluation dimension is evaluated and passes against a declared executor"* |
| 26 | *"Evidence and public instructions agree with clean-consumer behaviour"* | No command, no fixture, no comparison named | *"replay the published instructions verbatim in a clean packed-consumer fixture; every command exits 0 and the observed output matches what the instructions claim"* — which is what Step 27 already says, and Step 26 should cite it |
| 20, 21 | *"inspect workflow hardening"*, *"Validate workflow syntax, permissions and release assertions"* | "Inspect" and "validate" are not executable | Fold in the proofs that already exist: `tests/ci-workflow.test.ts` and `tests/release-workflow.test.ts`. See §4 — here the implementation is *ahead* of the runbook |
| 31 | *"Every **material** Checkpoint 1 finding exists as an open Intent"* | "Material" is undefined, and there is no count to check against | *"every finding recorded in the checkpoint's review or delivery notes is either captured as an open Intent or explicitly recorded as not worth acting on, with a reason. The count of findings and the count of dispositions must agree"* |

---

### 3.6 Self-hosting and feedback capture

#### A2R-12 · Step 31 was not performed, and the one open Intent is stale · `executed-pass`

Step 31 requires every material Checkpoint 1 finding to exist as an open
Intent. Exit condition 31: *"no known blocking failure is carried into
Checkpoint 2."*

`pnpm pactwright lifecycle status` on the reference reports four Intents:
three closed, all three about public learning material, and **one** open —
`intent-give-extensions-versioned-schema-migrations-2bebaf56`, at
`propose-contracts`.

The 19 September review reproduced ten P1 and three P2 findings. **None of
them is an Intent.** And the single open Intent describes work that has since
**shipped**: the CHANGELOG's *"Extensions declare enforceable semantics"*
section describes exactly the versioned Extension migrations that Intent asks
for. The consolidation design says so in as many words:

> §11 Extension registration with enforceable semantics — `d2d6669`. **Closes
> the open Intent `intent-give-extensions-versioned-schema-migrations-2bebaf56`,
> which stays open in the graph: this was built as a plain engineering change,
> not driven through the lifecycle.**

So the governed graph now asserts as unstarted a capability the release
ships.

**Cause.** **Unenforced requirement.** Step 31's proof — *"captured Intents
are valid open lineages"* — passes on an empty capture, because zero captured
Intents are trivially valid.

**Acceptance proposal.** As in §3.5 for Step 31, plus one exit condition:
*"no open Intent describes capability the release already ships."* That is
mechanically checkable against the CHANGELOG and would have caught this.

#### A2R-13 · Exit condition 21 is met by three documentation deliveries while the runtime was changed outside the lifecycle · `code-traced`

Exit condition 21: *"Pactwright completes real self-hosted Delivery."* Exit
condition 30: *"repeated sync converges and **graph coherence is not hand
maintained**."*

Both are satisfiable, and were satisfied, by the three closed documentation
lineages. The consolidation that produced the reference — `state.md` records
104 changed production files across 19 commits — went through **no** Intent,
Decision, Contract, Brief or Evidence. Implementation Principles §3
*Progressive Self-Hosting* and §6 *Use the Strongest Available Pactwright
Capability* are the principles at stake; Step 26 asks for *"a real
self-hosted Quick Start improvement"* and got one, which is all it asked for.

This is **loose wording**, not an ignored requirement: nothing in Checkpoint 1
says *all* subsequent repository work must be governed. A5 should decide
whether it should.

**Cause.** **Ambiguity.**

**Acceptance proposal.** Either accept the current reading and say so
explicitly — *"Checkpoint 1 proves self-hosting on one Delivery; general
adoption is Checkpoint 2's entry condition"* — or raise the bar:
*"from Step 25 onward, every change to this repository's runtime is delivered
through Pactwright; a change delivered outside the lifecycle is a blocking
failure under exit condition 31."* The second is the stronger proof of the
product and the more expensive process; it is a maintainer decision, not an
audit finding.

#### A2R-14 · Production code cites a research log as its governing authority · `code-traced`

Checkpoint 1 §2: *"Research logs are rationale only."* Checkpoints README:
*"Research logs are rationale and historical design context only."* The
authority model is: specifications own meaning, checkpoints own construction.

Ten source comments cite the consolidation research log as the reason the code
is shaped the way it is:

```
src/validate/kernel.ts:37        One validation kernel (consolidation design §4).
src/lifecycle/transition.ts:14   The one lifecycle transition reducer (consolidation design §3).
src/environment/transaction.ts:15 One environment transaction (consolidation design §6).
src/eval/acquire.ts:14           … baseline comparison (design §5.4).
src/execute/task.ts:4            One capability execution (consolidation design §5).
…
```

The comments are *good* comments — they explain why, which is what
`documentation-and-adrs` asks for. The problem is where the "why" lives. A
reader following the stated authority model will not find these decisions in
any specification or checkpoint, and the log that holds them is explicitly
declared non-authoritative. The project has no `docs/decisions/` or ADR
convention, so there is nowhere else the decision currently belongs.

**Cause.** **Contradiction** between the declared authority model and where
decisions are actually recorded.

**Acceptance proposal.** This is the clearest ADR-shaped gap in the
repository. Two options, in preference order:

1. Promote the durable parts of the consolidation design into the
   specifications that own them (Core §55 for the mutation kernel, Core §46
   for the transition reducer, Distribution §3 for the executor, Distribution
   §15 for the environment transaction) and repoint the comments there. The
   spec amendments landed in `fdee1be` already set this precedent for five
   sections; this finishes the job.
2. Establish `docs/decisions/` with the project's own numbering and move the
   consolidation's structural decisions there as ADRs, then declare in the
   checkpoints README that ADRs are authority for *implementation structure*
   while specifications remain authority for *semantics*.

Doing neither leaves the runtime's structure justified by a document the
project says does not justify anything.

#### A2R-15 · Step 31 cites the wrong Implementation Principles sections · `code-traced`

Step 31 *References:* *"Implementation Principles §§7, 14"*, and its body:
*"findings are captured directly as Intents through normal Delivery
(Implementation Principles §14)."*

- §7 is *"Public-Content Authority and Readiness"* — the right citation for
  Steps 26 and 27, not for capturing findings.
- §14 is *"Content Is Part of Product Quality"* — a discoverability
  checklist. It says nothing about capturing findings.
- **§16 *"Feedback Becomes Product Evidence"*** is the governing section, and
  says exactly what Step 31 attributes to §14: *"Before Project Intelligence
  exists, capture important findings and corrections through normal Delivery
  work."* §17 *"Evaluation Grows From Real Failures"* is the companion.

**Cause.** **Contradiction** (reference drift). Cheap to fix, and worth fixing
because Step 31 is the step most likely to be skipped, and a wrong citation
makes it unverifiable.

**Acceptance proposal.** Step 31 *References:* → *"Implementation Principles
§§16, 17; Implementation Guide — Transition rule"*, and the body citation →
§16.

---

### 3.7 Unavailable prerequisites

#### A2R-16 · Kakeibo is a hard per-checkpoint dependency that no Pactwright runbook can verify · `environment-blocked` / `not-run`

Every checkpoint 1–9 has exactly one Kakeibo acceptance stage; Graduation is
entirely Kakeibo. Checkpoint 1's exit conditions 24, 26, 27, 28 and 29 — five
of thirty-one — are Kakeibo properties. `00-kakeibo-acceptance-profile.md`
(1,314 lines) defines cross-checks against seven specifications that live in
another repository, addressed only as *"docs/specs/…"* with the note *"Those
paths resolve in the Kakeibo repository, not in this one."*

This session's repository scope is `sb-dev/pactwright`. The Kakeibo repository
was **not fetched and not inspected**; nothing here is a claim about its
state. The only evidence available is second-hand, from the 19 September
review, which recorded at `sb-dev/kakeibo` main `0151cc3`:
*"`packages/domain` contains only `.gitkeep`; no implementation, tests or
Delivery lineage"* and *"Its reviewed `main` has no package root or Pactwright
environment."*

Two structural problems follow, independent of Kakeibo's actual state:

1. **No Pactwright-side proof can establish a Kakeibo exit condition.** The
   runbook gives no instruction for recording the Kakeibo commit that
   satisfied a condition, so a later reader cannot tell which Kakeibo state
   was accepted.
2. **Step 30's expected result lists thirteen financial invariants** that are
   owned by Kakeibo's `02-financial-domain-model-spec.md`. If that spec
   changes, Checkpoint 1's copy silently goes stale — the same failure mode as
   A2R-06, across a repository boundary.

**Cause.** **Environment assumption.**

**Acceptance proposal.**

- Require every Kakeibo acceptance step to record the **exact Kakeibo commit
  SHA** and the owning Kakeibo spec revision in the Pactwright evidence
  record, the same way `state.md` pins the Pactwright reference.
- Replace Step 30's inlined invariant list with a citation to the Kakeibo
  spec section plus *"the invariants that section defines at the recorded
  revision"*, so drift is impossible. Keep the list in
  `00-kakeibo-acceptance-profile.md`, which is the acceptance profile's job.
- Add one exit condition to the Implementation Guide: *"a checkpoint's
  external acceptance is recorded with the external repository's commit and
  specification revision; an acceptance without them is not evidence."*

#### A2R-17 · Other prerequisites Checkpoint 1 needs and does not obtain

| Prerequisite | Needed by | Status in this audit |
|---|---|---|
| A published `pactwright@0.0.2` / `@pactwright/standard@0.0.2` | Steps 28–29, exits 23, 24 | `executed-fail` — registry carries only `0.0.1` for both ([`logs/02`](../evidence/a2/runbooks/logs/02-step28-candidate-side.log)). CHANGELOG itself says *"0.0.2 — unreleased"* |
| An agent executor with credentials | Step 24 (*"Use the generated adapter to complete… Intent → … → Evidence"*), exit 20 | `not-run`. A1 recorded the same. The suite's only provider-backed test is opt-in and skipped: `tests/execute.test.ts:519` |
| npm trusted-publishing (OIDC) bootstrap | Step 21, Step 28 | `not-run`. Step 28 asserts *"The npm trusted-publisher bootstrap was completed for `0.0.1`"* — an inherited claim, not verified here |
| Node 24 leg of the declared range | `engines: >=22 <23 \|\| >=24 <25` | `not-run`. This session ran Node 22 only |

Step 24 deserves a note. It is the step that proves the whole checkpoint —
*"Require all 17 validation cases, Evidence precondition failures, seven
adapter mutation-boundary cases and complete core evaluation dimensions to
pass **before self-hosting**"* — and it cannot be run without a credentialled
provider. Neither A1 nor this session could execute it; the runbook offers no
alternative. Under the current instruction the checkpoint's central proof is
unreachable in CI and unreachable in any environment without a paid provider
account.

**Acceptance proposal.** Split Step 24 into the part that is deterministic and
the part that is not:

> **24a (deterministic, gated in CI).** Drive the complete lineage through
> `pactwright lifecycle record` with the runtime performing every transition
> and mutation. Require all 17 validation cases, the five Evidence
> precondition failures and the seven adapter mutation-boundary cases.
>
> **24b (provider-backed, gated at release).** Complete the same lineage with
> a declared executor against a real provider. Record the provider, the model
> and the run identity. This step is `environment-blocked`, not passed, when
> no credential is available — it is never reported as a pass by inference
> from 24a.

---

## 4. What works and must not be lost

A reimplementation that discards these because nobody wrote down that they
worked would be a worse outcome than keeping a flawed mechanism knowingly.

**S-01 · The seven-command surface is genuinely pinned.** Step 12 asks to
*"Assert the exact seven command names"*; `tests/sync.test.ts:37-56` asserts
the rendered file set with `deepEqual` against an explicit ten-entry list
(seven commands, three agents) and requires `unchanged` and `removed` to be
empty. A renamed or added command fails the test. `src/adapter/commands.ts:1-16`
carries the right invariant comment: *"These are the runtime's command
surface, NOT lifecycle topology."* Keep both.

**S-02 · The CI and release workflows have real proofs the runbook never asked
for.** Steps 20–21 say only "inspect" and "validate"; the repository ships
`tests/ci-workflow.test.ts` and `tests/release-workflow.test.ts`. The
implementation is ahead of its instruction. A6 should fold these into the
steps rather than let a reimplementation drop back to eyeballing YAML.

**S-03 · Refusing to score the harness is the right call.** `eval` reporting
every case `unevaluated` when no executor is declared (§3.4, A2R-10) is the
fix for review finding R06, where a pack whose prompts said *"Ignore all
tasks"* scored full marks. Distribution §3's *"Autonomy is declared, never
inferred"* is a good rule, well implemented. **Preserve the behaviour; fix the
exit condition that lets it look like coverage.**

**S-04 · Isolated baseline acquisition works.** A2R-01 is a *compatibility*
failure, not an acquisition failure. The runtime created a temporary project,
delegated installation to the package manager, fetched the real published
`@pactwright/standard@0.0.1` from the registry, resolved it from *that*
directory and checked its declared runtime range — exactly the design
`src/eval/acquire.ts:14-25` describes, and exactly what review finding R06
asked for. The isolation check (`:95-107`) is what then refused. Keep the
design.

**S-05 · The validation contract has no drift.** Step 9's seventeen numbered
rules map one-to-one onto Core §57's seventeen bullets, in the same order,
with only trivial rewording on rule 16. Of everything cross-checked in this
audit, this is the cleanest spec-to-checkpoint correspondence. It is the model
the rest should follow.

**S-06 · A1's macOS failure does not reproduce on Linux — `not-reproduced`.**
`pnpm test` here: **684 tests, 683 pass, 0 fail, 1 skipped**
([`logs/06-test-suite.log`](../evidence/a2/runbooks/logs/06-test-suite.log)).
The complete documented gate, `pnpm verify`, also exits **0** here — including
the `verify:self` stage — and reproduces A1's exact
`project_graph_revision` and `environment_lock_hash`
([`logs/07-repo-gate.log`](../evidence/a2/runbooks/logs/07-repo-gate.log)).
A1's single failure (`acquire: a side is installed into its own project`) was
diagnosed as an `os.tmpdir()` symlink artefact on macOS; this run is
consistent with that diagnosis. The failure is real and platform-specific, not
imagined — and the checkpoint has no instruction requiring proofs to hold on
every declared platform, which is why CI's green Linux result and A1's red
macOS result can both be true and neither is wrong.

**S-07 · The authority model is stated correctly.** The checkpoints README's
*"If a checkpoint conflicts with a canonical Pactwright specification, the
canonical specification wins and the checkpoint must be corrected before
implementation continues"* is the right rule, clearly written. A2R-06 and
A2R-14 are failures to *apply* it, not failures of the rule. Keep the rule and
give it a trigger — see §5.

---

## 5. Proposed instruction and proof changes, consolidated

Ordered by what a reimplementation would get wrong first without them. Each
row states the change; the finding holds the argument.

| # | Where | Change | Finding |
|---|---|---|---|
| 1 | Implementation Guide release map and public-content ladder | Renumber the ladder so no two checkpoints publish one version; add the exit condition that makes it checkable | A2R-02 |
| 2 | CP1 §1, Stage 8, Stage 9, Step 27 | Say `0.0.2` where `0.0.2` is meant | A2R-03 |
| 3 | CP1 Step 13 + exit 19, or CP2 | Move the *real released baseline* obligation to the first release pair whose compatibility ranges can overlap; keep the fixture proof in CP1 | A2R-01 |
| 4 | CP1 new Step 8b | `lifecycle record`, including authorised Gate resolution, with a byte-identical-on-refusal proof | A2R-06 |
| 5 | CP1 Step 10 or new 13a | `execution.executor`, default `none`; the same interface for `run` and `eval` | A2R-06 |
| 6 | CP1 exit 18 | "evaluates", not "covers"; plus the two-run proof in Step 13 | A2R-10 |
| 7 | CP1 Step 13 *Verify* | The injected regression must be behavioural, not lexical | A2R-11 |
| 8 | CP1 Step 14 | Own the selection input by name; delete the prohibition Step 29 violates | A2R-04 |
| 9 | CP1 Step 16 + exit 15 | Separate installation order from enablement/locking order | A2R-05 |
| 10 | CP1 Step 7 + exit 6 | Name the guarantee ("serialisable; all-or-nothing against handled failure"); add the interruption proof | A2R-09 |
| 11 | CP1 Step 24 | Split into 24a deterministic (CI-gated) and 24b provider-backed (release-gated, never inferred) | A2R-17 |
| 12 | CP1 Step 26 + new exit | Every public product claim traces to an authorising Decision; list the node ids | A2R-07 |
| 13 | CP1 Step 31 | Cite Principles §§16–17; require a disposition per recorded finding; add "no open Intent describes shipped capability" | A2R-12, A2R-15 |
| 14 | CP1 Steps 20–21 | Replace "inspect" with the workflow tests that already exist | S-02, §3.5 |
| 15 | CP1 Steps 23, 26 | Reuse Step 16's equivalence list; name the replay fixture | §3.5 |
| 16 | CP1 Step 9 | Decide `pactwright context` explicitly instead of forbidding what ships | A2R-08 |
| 17 | CP3 "Deliberately unresolved" | Delete the stale `agent-pack use` / `eval --baseline` deferral | A2R-18 |
| 18 | CP2 §1, Step 17, exit gate | Re-base the Kakeibo upgrade pair once the ladder is fixed | A2R-02, A2R-19 |
| 19 | Implementation Guide, new rule | External acceptance records the external repository's commit and spec revision | A2R-16 |
| 20 | Specs 01–02 **or** a new `docs/decisions/` | Give the consolidation's structural decisions an authoritative home and repoint the ten source citations | A2R-14 |
| 21 | Checkpoints README | Add the trigger that makes the authority rule operate: *an adopted specification amendment requires a matching checkpoint review before the next checkpoint opens* | A2R-06 |
| 22 | CP10 | Bring it into the family's structure: a `**Release:**`-equivalent line, `### Step` headings, bulleted exit conditions | A2R-20 |

---

## 6. Later checkpoints

Read at header, entry-condition, exit-gate and cross-reference level.
**Their step bodies were not traced** — see §8.

#### A2R-18 · Checkpoint 3 records capabilities as deferred that Checkpoint 1 delivers and gates · `code-traced`

`03-project-intelligence.md:168`, under *"Deliberately unresolved"*:

> **`agent-pack use` and `eval --baseline`.** These remain deferred as
> recorded in Checkpoint 1.

Checkpoint 1 v17 implements both — Step 11 (`agent-pack use`, `agent-pack
upgrade`) and Step 13 (`eval --baseline … --candidate …`) — and gates on both
in exit conditions 11, 12 and 19. Checkpoint 3 is carrying a statement about
an older Checkpoint 1.

**Cause.** **Contradiction** — an inherited assumption that outlived its
source. It matters because "deliberately unresolved" is the list a Checkpoint
3 implementer reads to decide what *not* to build, and one of these two is the
capability Checkpoint 1's baseline comparison depends on.

**Acceptance proposal.** Delete the bullet. Then check the whole *"Deliberately
unresolved"* list in every later checkpoint against the current Checkpoint 1
and 2 scope — this one was found by cross-reference, and there is no reason to
assume it is the only one. **A6 should re-derive these lists rather than
inherit them**; this audit checked Checkpoint 3's and did not check 4–9's.

#### A2R-19 · Checkpoint 2's Kakeibo premise is contradicted by Checkpoint 1 · `code-traced`

Three linked assumptions in `02-remote-delivery.md`:

- *"Begin with Kakeibo running the exact published Checkpoint 1 family:
  `pactwright@0.0.1`, `@pactwright/standard@0.0.1`"* (`:653-657`) — but
  Checkpoint 1 Step 29 installs `0.0.2`.
- *"Do **not** preinstall `0.0.2` with `pnpm add`"* (`:660`) — but Checkpoint 1
  Step 29's command **is** `pnpm add -D pactwright@0.0.2`.
- *"the CP1 deterministic `packages/domain` remains the financial authority"*
  (`:899`) — depends on Checkpoint 1 Step 30, which the 19 September review
  recorded as not performed.

**Cause.** **Contradiction**, downstream of A2R-02.

**Acceptance proposal.** Re-base Checkpoint 2's upgrade pair when the ladder is
fixed, and add to its entry condition: *"Kakeibo runs the exact published
Checkpoint 1 family and carries the accepted `packages/domain` foundation"* —
so the dependency is an entry gate rather than an assumption buried at
`:653`.

#### A2R-20 · Graduation diverges from the runbook family's structure · `code-traced`

`10-graduation-connected-banking.md` uses `## Step N` where Checkpoints 1–9
use `### Step N`; numbers its exit conditions `1.`–`14.` where the others use
`- ` bullets; and carries *"**Current provider target:**"* where the others
carry *"**Release:**"*. Mechanical extraction across the family — the kind an
A6 crosswalk or a CI gate would do — sees zero steps and zero exit conditions
in Graduation.

**Cause.** **Ambiguity** (structural inconsistency). Low severity, real cost
if any exit gating is ever automated.

#### Public-content and identity readiness across the ladder

Three observations, `code-traced`:

1. **The released public content documents a runtime nobody can install
   today, and the installable one is documented nowhere.** The current
   `README.md:11` and `docs/getting-started.md:13` teach
   `pactwright init --agent-pack @pactwright/standard`, plus
   `agent-pack use` and `upgrade --to`. The released `pactwright@0.0.1`
   runtime has **none** of them — its help lists `init [--json]`, `sync`,
   `validate`, `context`, `lifecycle`, `extension`, `eval`
   ([`logs/03`](../evidence/a2/runbooks/logs/03-released-runtime-has-no-comparison.log)).
   The tagged `v0.0.1` README teaches the commands that runtime does have. So
   exit condition 25 (*"the `0.0.1` public content set … included in the
   tagged release source"*) is met, exit condition 22 (*"public learning
   material matches shipped capability"*) is met only against the
   **unshipped** `0.0.2`, and a user arriving at the repository today follows
   instructions the installable release cannot execute.

2. **A2R-21 · The immutable `0.0.1` content overstates what `0.0.1` did.**
   `git show v0.0.1:README.md:58` describes the evaluation runner as
   *"runs an agent pack against scripted delivery cases"*. Review finding R06
   established that at that release the harness ran **its own scripted
   reference** and reported the result as the pack's. Step 27's *"Only
   document proven behaviour"* did not prevent it, because its proof —
   *"Follow the material in a clean packed-consumer fixture"* — passes as long
   as the commands exit 0. npm versions are immutable, so this cannot be
   corrected in place.
   **Cause: inadequate proof.**
   **Proposal:** Step 27's *Verify* should require each documented capability
   claim to name the proof that establishes it, not merely that the command
   runs: *"for every capability claim in the public material, cite the test,
   fixture or recorded run that proves it; a claim with no proof is removed
   before release."*

3. **Identity readiness does not improve at Checkpoint 2, and Checkpoint 3
   assumes it did.** Checkpoint 2 Step 12 repeats Checkpoint 1 Step 26's rule
   for the website and, like it, provides no proof (A2R-07). Checkpoint 3 then
   requires the `content` knowledge domain to be *Covered* and
   `go-to-market` at least *Seeded* before public work. Two checkpoints of
   unauthorised identity claims would have to be retro-authorised for that
   ingestion to be honest — Spec 08 `:705` anticipates exactly this
   (*"the pre-PI Decision and Contract remain historical Delivery authority"*),
   which only works if those Decisions exist. **They do not.** The fix is
   upstream: A2R-07's exit condition at Checkpoints 1 and 2.

#### Unsupported early capabilities — checked, and clean where checked

Checkpoint 1's *"Explicitly out of scope"* list and its exit condition 16 were
cross-checked against the delivered runtime for the one boundary most at risk
of leaking: **external Production Skills resolution (Checkpoint 5)**.
Checkpoint 1 requires seams without resolution, and that unsupported imports
be *reported* rather than silently ignored — Steps 15, 17 and 18 all say so,
and exit condition 16 gates it. `code-traced`: `src/doctor.ts:63` and
`src/doctor.ts:222-226` report configured external Production Skills imports as
unsupported by this release rather than resolving or dropping them, and A1's `doctor` fixture runs showed no
Production Skills claim. **No early-capability leak found at this boundary.**

The other out-of-scope boundaries — GitHub provisioning (CP2), Project
Intelligence (CP3), Graph Review (CP4), Assets/Publication (CP5), Operations
(CP6) — were **not** checked against the runtime. Absence of a finding here is
absence of a check, not evidence of cleanliness. §8.

---

## 7. Old-step and exit-condition inventory

The crosswalk input for A6. Counts are mechanical
(`### Step ` / `^- ` under `## Exit gate`).

| Runbook | v | Release | Steps | Exit conditions | Kakeibo stage |
|---|---|---|---|---|---|
| 01 Self-Hosted Delivery | 17 | `0.0.2` (hdr) / `0.0.1` (Stages 8–9) | 31 | 31 | 1 (Stage 10) |
| 02 Remote Delivery | 16 | `0.0.2` **collides with 01** | 21 | 40 | 1 |
| 03 Project Intelligence | 13 | `0.0.3` | 27 | 31 | 1 |
| 04 Graph Review | 13 | `0.0.4` | 22 | 31 | 1 |
| 05 Production Skills + Assets/Publication | 12 | `0.0.5` | 27 | 36 | 1 |
| 06 Operations | 14 | `0.0.6` | 28 | 40 | 1 |
| 07 Publication Feedback | 11 | `0.0.7` | 15 | 25 | 1 |
| 08 GitHub Project Surface | 12 | `0.0.8` | 20 | 31 | 1 |
| 09 Hardened Closed Loop | 11 | `0.0.9` → `0.1.0` RC | 28 | 25 | 1 |
| 10 Graduation | 2 | none (provider target) | 10 (`## Step`) | 14 (numbered) | whole runbook |
| **Total** | | | **229** | **304** | |

### Checkpoint 1 steps, by stage

| Stage | Steps | Subject |
|---|---|---|
| 1 — Canonical Project Graph substrate | 1–5 | runtime/package foundation; five record types; typed-edge store; current-lineage and authority; repository and graph revision |
| 2 — Contract-driven lifecycle execution | 6–9 | shape and execution policy; mutations and Evidence closure guards; `status`/`next`/`run`; the 17-rule validation contract and context assembly |
| 3 — Replaceable AI execution | 10–13 | core capabilities and `@pactwright/standard`; Agent Pack selection and upgrade; the seven adapter commands; evaluation and baseline comparison |
| 4 — Exact environment resolution and local composition | 14–19 | `init` with explicit selection; config/lock agreement and `environment_lock_hash`; Extension mechanics and one-shot composition; `sync`; `doctor`; runtime upgrade and rollback |
| 5 — Repository CI and release safety | 20–21 | `ci.yml`; `release.yml` |
| 6 — Packed consumer behaviour | 22–24 | pack both components; clean consumer fixtures; one full fixture Delivery |
| 7 — Adopt Pactwright in Pactwright | 25–26 | initialise the repository; one real self-hosted improvement |
| 8 — Public learning path | 27 | README Quick Start, Getting Started, core Delivery example |
| 9 — Publish | 28 | publish the corrective release; prove the released baseline |
| 10 — Prove on Kakeibo | 29–30 | minimum consumer root; deterministic financial-domain foundation |
| 11 — Capture feedback | 31 | findings as open Intents |

### Checkpoint 1 exit conditions — disposition

Numbering follows the order printed in the runbook.

| # | Condition (abbreviated) | Owning step(s) | Disposition |
|---|---|---|---|
| 1 | real publishable packages | 1, 10 | keep |
| 2 | five record types, 17 validation rules | 2, 9 | keep — S-05 |
| 3 | Contract authority distinct from Gate/policy | 6 | keep |
| 4 | direct shape without adapter topology | 6, 12 | keep |
| 5 | execution state outside the graph; `status`/`next` read-only | 8 | keep |
| 6 | five closure preconditions before **atomic** mutation | 7 | **amend** — A2R-09 |
| 7 | seven adapter commands, mutation boundaries | 12 | keep — S-01 |
| 8 | three-part replay base | 5, 15 | keep |
| 9 | fixture Extension contributes to graph revision | 5, 16 | keep |
| 10 | both locks agree | 15 | keep |
| 11 | explicit, capability-checked selection incl. one-shot | 11, 14 | keep |
| 12 | `agent-pack upgrade` safe within constraints | 11 | keep |
| 13 | `upgrade` / `--to` fixture-proven, re-entrant | 19 | keep |
| 14 | one-shot composes the same operations | 16 | keep |
| 15 | Extension **dependency-first installation** … | 16 | **amend** — A2R-05 |
| 16 | Production Skills stay at CP5; imports reported | 15, 17, 18 | keep — checked, clean |
| 17 | `init`/`sync`/`doctor`/`validate`/lifecycle/`eval` work | 14–18, 13 | **amend** — add `lifecycle record`; decide `context` (A2R-06, A2R-08) |
| 18 | core evaluation **covers** six dimensions | 13 | **amend** — A2R-10 |
| 19 | baseline evaluation **resolves released `0.0.1`** | 13, 28 | **relocate** — A2R-01 |
| 20 | clean packed consumer completes a full Delivery | 23, 24 | **split** — A2R-17 |
| 21 | Pactwright completes real self-hosted Delivery | 25, 26 | **decide** — A2R-13 |
| 22 | public material matches shipped capability | 27 | **amend** — §6.1, A2R-21 |
| 23 | `0.0.2` registry verified; `0.0.1` resolvable | 28 | blocked — unpublished |
| 24 | `0.0.2` published and installs into Kakeibo | 28, 29 | blocked — A2R-16, A2R-17 |
| 25 | `0.0.1` content set in the tagged release source | 27 | met; see §6.1 |
| 26 | Kakeibo minimum consumer root | 29 | not verifiable here — A2R-16 |
| 27 | Kakeibo Intent → Evidence financial foundation | 30 | not verifiable here — A2R-16 |
| 28 | financial invariants preserved | 30 | not verifiable here; **amend** to cite the Kakeibo spec — A2R-16 |
| 29 | Kakeibo domain independence | 30 | not verifiable here — A2R-16 |
| 30 | repeated sync converges; coherence not hand maintained | 17, 25 | **amend** — A2R-12, A2R-13 |
| 31 | no known blocking failure carried into CP2 | 31 | **amend** — A2R-12 |

Twelve of thirty-one need amendment, one needs relocating, one needs a
maintainer decision, one needs splitting, and five cannot be established from
this repository at all. **Fourteen are sound as written** — the scope is not
the problem, and nothing in this report proposes reducing it.

---

## 8. What this audit did not review

Listed so that silence is not read as coverage. Each is a real gap, not a
formality.

**Not reachable from this session**

1. **The Kakeibo repository.** Not fetched, not inspected. Everything about
   Kakeibo here is either structural (what the Pactwright runbooks say) or
   cited second-hand from the 19 September review. Exit conditions 24, 26–29
   of Checkpoint 1, every Kakeibo stage in Checkpoints 2–9 and all of
   Graduation are **unverified**.
2. **`00-kakeibo-acceptance-profile.md` (1,314 lines).** Not audited. Its §5
   is the shared cross-check Checkpoint 1 depends on and it was not read
   beyond the references Checkpoint 1 makes to it.
3. **Provider-backed execution.** No credential was configured and none was
   used. The suite's single end-to-end provider test
   (`tests/execute.test.ts:519`) is skipped here as it was for A1.
   `environment-blocked`, not a pass.
4. **Node 24.** This session ran Node 22 only, on Linux. The declared range is
   `>=22 <23 || >=24 <25`, and A1's one failure was platform-dependent — the
   untested legs are not a formality.
5. **GitHub Actions.** No workflow was executed. `ci.yml` and `release.yml`
   were not re-audited beyond noting that tests for them exist (S-02); A1's
   hardening inspection stands as `code-traced` and was not repeated.

**In scope, deliberately not reached**

6. **Checkpoint step bodies for 04–09 and Graduation.** Read at header, entry
   condition, exit gate, release number and cross-reference level only. Their
   internal instructions, proofs and *"Deliberately unresolved"* lists were
   **not** audited. A2R-18 was found in Checkpoint 3 by cross-reference; the
   same class of stale inheritance may exist in 04–09 and was not looked for.
7. **Checkpoint 2's step bodies.** Only its release ladder, Kakeibo premise and
   the two identity/selection cross-references were traced.
8. **`00-implementation-principles.md` (1,022 lines).** Read at heading level
   plus §§7, 14, 16, 17 in full. §§1–6, 8–13, 15, 18–20 not audited.
9. **`00-implementation-guide.md` (633 lines).** Audited for the release
   ladder and public-content ladder only.
10. **Specs 03–08 as owning specifications.** Spec 08 was consulted for
    identity requirements; Specs 03, 04, 05, 06, 07 were **not** audited. Only
    Specs 01 and 02 were traced against their checkpoints, and even there only
    §§39, 46–53, 55–58 of Core and §§3, 10–15, 18, 24 of Distribution.
11. **The adopted Operations amendment**
    (`2026-09-02-pactwright-operations-experiment-semantics.md`), authority for
    Checkpoints 6–9. Not read.
12. **The adapter prompt bodies.** Checkpoint 1 Step 12 forbids duplicating
    *"graph-transition or authority semantics in prompts"*; the seven generated
    command bodies and the three `@pactwright/standard` agent prompts were
    **not** read against that rule.
13. **Out-of-scope boundaries other than Production Skills.** GitHub
    provisioning, PI, Graph Review, Assets/Publication and Operations were not
    checked for early leakage into the Checkpoint 1 runtime (§6).
14. **Steps 1–6, 17, 18, 22, 25 of Checkpoint 1** were read but not traced
    into implementation or tests. Findings in this report concentrate on Steps
    7, 9, 12–16, 19–21, 23–24, 26–31.

**Owned by another A2 session, referenced not adjudicated**

15. Crash-versus-handled-failure guarantees (**A2-D**), test-double strength
    and sentinel scoring (**A2-V**), graph and revision semantics (**A2-G**),
    lifecycle and executor behaviour (**A2-L**). Where this report touches
    them — A2R-09, A2R-11 — it reports the **instruction** defect and leaves
    the runtime verdict to the owning session. No sibling report was read.

---

## 9. Hand-off

```text
Step/unit: A2-R
Actor: Claude Code / A2-R session (specifications and checkpoints)
Branch: trial/a2-runbooks
Base (effective a2_base_sha): 69cdc95a9d5ed578ef21c165b359ace8f5a2954f
Reference audited: 19c66d5f2368932ff05306db1fae8da8ec5810dd
Changed paths: docs/research-logs/implementation-trial/analysis/runbooks.md
               docs/research-logs/implementation-trial/evidence/a2/runbooks/logs/*
Production files changed: none
Evidence: 7 logs under evidence/a2/runbooks/logs/; 5 executed checks
          (executed-fail on the Step 28 command; executed-fail on core eval;
          executed-pass test suite 683/684; executed-pass `pnpm verify`
          exit 0; registry and released-runtime probes)
Next owner/task: A2 coordinator — publish path-restricted onto
                 trial/restart-analysis; then A3 reconciliation
Outstanding decisions or failures:
  - state.md records no a2_base_sha and trial/a2-base was never pushed;
    the coordinator's "descends from a2_base_sha" check has nothing to
    check against (A2R-00)
  - the release ladder needs a maintainer decision before A6 can write a
    crosswalk (A2R-02)
  - exit condition 21's scope — one Delivery or all repository work — is a
    maintainer decision, not an audit finding (A2R-13)
```
