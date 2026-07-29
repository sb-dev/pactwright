---
id: decision-gitignore-unowned-6b3d
type: decision
title: .gitignore is intentionally unowned repo hygiene
decided_by: Samir Benzenine
created: 2026-07-29
---

Records that the repo-root file `.gitignore` is INTENTIONALLY UNOWNED by
any capability.

Verified against the live graph: no `capability.paths` glob matches
`.gitignore`. The six live capabilities own, in full,
`capability-ci-enforcement-3e4f` `[.github/workflows/**,
.github/CODEOWNERS]`, `capability-lifecycle-commands-4f5a`
`[.claude/commands/**, .claude/agents/**]`, `capability-spec-docs-8c1d`
`[CLAUDE.md, docs/**]`, `capability-spec-schema-2c3d` `[specs/schema/**]`,
`capability-spec-tests-3a6e` `[tests/**]`, and
`capability-spec-tooling-1a2b` `[tools/**, package.json]` — every pattern
either a literal filename that is not `.gitignore` or a
directory-prefixed glob. `tools/glob.ts` anchors each pattern at both
ends, expands `**` to any run of characters (separators included) and `*`
to a run within one segment, so only a pattern whose first segment is a
glob — or the literal `.gitignore` — could match a repo-root dotfile, and
no capability declares either. The same change that records this decision
widens two of those lists (Scope 14.2: `.claude/lanes/**` onto `4f5a`;
`SPEC.md`, `README.md`, `CONTRIBUTING.md` onto `8c1d`); none of those
four added patterns matches `.gitignore` either, so the finding holds
both before and after the widening.

`.gitignore` is repo hygiene, not a behavioural surface that a
path-owning capability would gate. It declares what git ignores; it
carries no behaviour a contract could specify, nor any a drift run could
usefully map back to a brief. `contract-conveyor-derived-4c8c` Out of
scope 7 (`:131-132`) therefore declines to create a repo-hygiene
capability for it: "**No repo-hygiene capability.** No capability owns
`.gitignore`; Scope 14.5 resolves it via the sanctioned 'record the paths
intentionally unowned' branch, in this PR."

This artifact also RETROACTIVELY LEGITIMIZES an existing precedent.
`evidence-lifecycle-thin-commands-8296.md:34-37` already records a
`.gitignore` edit made when no capability owned the file: "`.gitignore` —
un-anticipated enabling change: the blanket `.claude/` ignore (pre-dating
this intent) was narrowed to `.claude/*` with negations for `agents/` and
`commands/` so the deliverable is tracked while local Claude state stays
ignored." That change was correct and stands exactly as it is; what it
lacked was this durable dated record, which it now has.

This is the durable, dated authorization that `/prepare-evidence`'s
human-confirm branch points at when a diff touches `.gitignore` — in
particular the `product-spec` lane's `!.claude/lanes/` negation, which
extends the deny-then-negate block at `.gitignore:10-12` (`.claude/*`,
then `!.claude/agents/` and `!.claude/commands/`) so the lane catalog is
tracked while local Claude state stays ignored. Such a diff is a recorded
intentionally-unowned change, not a coverage gap.

SCOPE BOUND: this authorization covers `.gitignore` and nothing else. It
does NOT extend to the other tracked paths that no capability owns —
`.github/dependabot.yml`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`,
`eslint.config.js`, `tsconfig.json` and `pnpm-lock.yaml` — which
`brief-conveyor-schema-graph-8b2e` records as a coverage observation
"recorded not taken". Resolving those is a follow-up intent, never a
quiet extension of this artifact.

Authorized by Samir Benzenine on 2026-07-29, per
`contract-conveyor-derived-4c8c` Scope 14.5 (`:110-111`: "the durable
dated authorization artifact recording `.gitignore` as intentionally
unowned, on the `decision-graph-data-unowned-2f7b` precedent"), as
decomposed by `brief-conveyor-schema-graph-8b2e` step 7.
