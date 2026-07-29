---
description: Decompose an approved contract into one implementation brief per named lane
---
Input: contract node ID + lane list ($ARGUMENTS: `<contract-id> <lane,lane,...>`).
Locate the contract via specs/indexes/ and confirm an inbound `selects` edge
exists; stop and report if it was never selected. (`/write-brief` remains for a
single unlaned brief.)
REFUSE a decomposition that omits verification: when the named lane list contains at
least one IMPLEMENTATION lane and no `test-verification` lane, STOP, report why, and
write NOTHING — no brief nodes, no edges. This is a refusal, not advice: verification
is always its own lane, owned by test-writer via `/write-tests`, never the invocation
that implemented the code under test.
Act as spec-writer: draft one brief per named lane, each carrying its `lane` field.
The lane catalog is NOT enumerated here — `.claude/lanes/<lane>.md` is the
human-readable catalog and `brief-lane-valid`'s `keys` in
`specs/schema/validation-rules.yaml` is the machine-authoritative list; the lane
drift test pins them equal. If a catalog file for a named lane is missing, stop with
a named error rather than running a silent, empty market.
Each brief names its files, ordered steps, and explicit non-scope.

RUN THE LANE MARKET, per lane: read that lane's catalog file, weigh its
`eligible_agents` against the brief's scope, and pick `default_agent` unless you
state a reason to prefer another eligible agent. Write the chosen `owner` into the
brief plus a one-line rationale. Where no owner can be assigned, say so — an absent
`owner` is legal and means unassigned, never an error.
STATE PER LANE why a patch market was or was not opened. When a lane carries genuine
competing strategies, write a `## Strategy tension` section into that lane's brief
naming them; the resolver TRANSCRIBES that marker to offer `/propose-patches` and
never infers tension, so a lane with no marker gets no market.
CARRY THE AMENDMENTS: the effective contract is the approved contract PLUS its
selecting decision's amendments. Read the contract's inbound `selects` decision and
carry each lane's slice into its brief, naming every amendment by its identifier so a
later integration node can enumerate the discharge key.
State the integration expectation: each laned brief reaches `implemented` while the
intent stays `open`; the contract is completed only by a final integration node via
/integrate (a collapsed lane is superseded per CLAUDE.md rule 3, not forced into a
ceremonial integration).
Then invoke graph-maintainer to write the brief nodes and their `decomposes` edges.
Then invoke `pnpm spec:issue-sync` BEST-EFFORT: it warns and never blocks, and the
graph remains the source of truth whether or not it succeeds.

ECHO BEFORE MUTATING: print each lane, its intended brief id and its chosen owner,
and the contract id they will `decomposes`, so the operator sees what will be written.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
WAVE PLAN (judgement content this command owns, printed around the block): order the
lanes into numbered waves from the catalog's `## Dependency hints`, with an optional
cap on concurrent lanes. Persist each lane's assignment in the drafted brief's BODY
as a one-line "Wave N of M" statement — take no schema field for it. Every wave line
carries: the lane, its brief id, its owner agent, its paste-ready command, why a patch
market was or was not opened, and its issue link OR the literal `issue: not synced`.
Never leave the issue column blank — a blank reads as a lost lane, whereas
`not synced` is a normal outcome of a best-effort sync.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <contract-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the wave plan belongs
around it, never inside it.
CLOSING REPORT: each brief id, its lane, its owner and its wave. Stop there — do not
implement anything.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved, one per lane:
    /implement-brief <brief-id>
    /write-tests <brief-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
