"""The A2-V fault-seed catalogue.

Each seed is one deliberate single-line defect in production source. `apply`
writes it into a *copy* of the tree; this checkout is never touched.

A seed names the proof it is aimed at, so a survivor reads as "this behaviour is
unproven" rather than "a mutant escaped".
"""

import pathlib
import sys

# (id, file, old, new, aimed_at)
SEEDS = [
    # --- evaluation: comparison ------------------------------------------------
    (
        "s01-compare-ignores-one-sided-error",
        "src/eval/compare.ts",
        "const erroredNow = candidate?.error !== undefined && baseline?.error === undefined;",
        "const erroredNow = false;",
        "compare: a case that errors only on the candidate side is a regression",
    ),
    (
        "s02-compare-never-regresses",
        "src/eval/compare.ts",
        "hasRegressions: regressed.length > 0,",
        "hasRegressions: false,",
        "compare: a regression is visible at capability, agent and case",
    ),
    (
        "s03-compare-drops-unchanged-guard",
        "src/eval/compare.ts",
        "if (before.passed === after.passed) continue;",
        "if (before.passed !== after.passed) continue;",
        "compare: an unchanged candidate correctly reports no regressions",
    ),
    (
        "s04-compare-ignores-added-case",
        "src/eval/compare.ts",
        'movement: "added",',
        'movement: "unchanged" as "added",',
        "compare: a case added or removed between runs is reported, not silently dropped",
    ),
    # --- evaluation: the gate --------------------------------------------------
    (
        "s05-evalpassed-ignores-evaluated",
        "src/eval/runner.ts",
        "entry.evaluated && entry.error === undefined && entry.deterministic.every((a) => a.passed),",
        "entry.error === undefined && entry.deterministic.every((a) => a.passed),",
        "the `evaluated` flag added to stop an unevaluated run passing (R06)",
    ),
    (
        "s06-evalpassed-ignores-error",
        "src/eval/runner.ts",
        "entry.evaluated && entry.error === undefined && entry.deterministic.every((a) => a.passed),",
        "entry.evaluated && entry.deterministic.every((a) => a.passed),",
        "runEval: a failing candidate is reported as a case error, not a crash",
    ),
    (
        "s07-noexecutor-claims-evaluated",
        "src/eval/runner.ts",
        "or run the harness's own reference explicitly\",\n        evaluated: false,",
        "or run the harness's own reference explicitly\",\n        evaluated: true,",
        "cli: eval --json marks every case unevaluated without an executor",
    ),
    (
        "s08-empty-run-passes",
        "src/eval/runner.ts",
        "if (report.cases.length === 0) return false;",
        "if (report.cases.length === 0) return true;",
        "runEval: an empty suite never passes the gate",
    ),
    (
        "s09-assertion-throw-becomes-pass",
        "src/eval/runner.ts",
        "          passed: false,\n          detail: `assertion threw: ${message(error)}`,",
        "          passed: true,\n          detail: `assertion threw: ${message(error)}`,",
        "an assertion that throws must not be read as a pass",
    ),
    # --- the executor: failure and denial --------------------------------------
    (
        "s10-denials-dropped",
        "src/execute/claude-code.ts",
        "const withDenials = denials.length === 0 ? {} : { denials };",
        "const withDenials: Record<string, never> = {};",
        "executor: permission denials are structured, not prose to pattern-match",
    ),
    (
        "s11-missing-binary-becomes-success",
        "src/execute/claude-code.ts",
        "if (result.error !== undefined && result.stdout.trim().length === 0) {",
        "if (result.error !== undefined && result.stdout.trim().length === 1e9) {",
        "executor: a binary that does not run is reported, not degraded into a no-op",
    ),
    (
        "s12-subtype-failure-ignored",
        "src/execute/claude-code.ts",
        'if (parsed.is_error === true || (parsed.subtype !== undefined && parsed.subtype !== "success")) {',
        "if (parsed.is_error === true) {",
        "executor: a non-success subtype fails even without is_error",
    ),
    (
        "s13-unparseable-output-becomes-success",
        "src/execute/claude-code.ts",
        '      message: `the executor returned output that is not JSON: ${stdout.slice(0, 200)}`,\n    };',
        '      message: `the executor returned output that is not JSON: ${stdout.slice(0, 200)}`,\n    } as never as ReturnType<typeof parsePrintMode>;',
        "executor: output that is not JSON fails loudly (control: a no-op edit)",
    ),
    (
        "s14-prompt-read-failure-spawns-anyway",
        "src/execute/claude-code.ts",
        'message: `cannot read the "${task.agent.key}" agent prompt at ${task.agent.prompt}: ${error instanceof Error ? error.message : String(error)}`,',
        'message: `prompt unreadable`,',
        "executor: an unreadable agent prompt is reported before anything is spawned",
    ),
    # --- the lifecycle seam ----------------------------------------------------
    (
        "s15-review-without-verdict-passes",
        "src/execute/select.ts",
        "  const verdict = readOutcome(output);\n  if (verdict === undefined) {",
        '  const verdict = readOutcome(output) ?? "pass";\n  if (verdict === undefined) {',
        "executor: a Review that reports no verdict fails rather than being guessed",
    ),
    (
        "s16-verdict-precedence-reversed",
        "src/execute/select.ts",
        'for (const verdict of ["blocked", "revise", "pass"] as const) {',
        'for (const verdict of ["pass", "revise", "blocked"] as const) {',
        "the outcome parser's precedence: a blocked review must not read as a pass",
    ),
    (
        "s17-executor-failure-not-propagated",
        "src/execute/select.ts",
        '    if (result.status === "failed") {',
        '    if (result.status === "failed" && result.message !== undefined && false) {',
        "executor: none refuses the first automatic step without pretending",
    ),
    (
        "s18-delivery-revision-not-recorded",
        "src/execute/select.ts",
        'return { status: "completed", revision: repositoryRevision(root).id };',
        'return { status: "completed" };',
        "a Delivery records the identity of what it delivered (§53 precondition 2)",
    ),
    # --- isolated acquisition --------------------------------------------------
    (
        "s19-isolation-check-removed",
        "src/eval/acquire.ts",
        "if (!isPathSource(parsed.source) && !resolved.value.dir.startsWith(root)) {",
        'if (!isPathSource(parsed.source) && !resolved.value.dir.startsWith(root + "\\u0000")) {',
        "acquire: a side is installed into its own project, not resolved from node_modules",
    ),
    (
        "s20-acquire-installs-without-version",
        "src/eval/acquire.ts",
        "parsed.version === undefined ? parsed.source : `${parsed.source}@${parsed.version}`;",
        "parsed.source;",
        "acquire: the exact version is named, so a frozen install would be the bug",
    ),
    # --- the refusal recogniser ------------------------------------------------
    (
        "s21-promptsaysnothing-always-false",
        "src/execute/scripted.ts",
        "return /ignore all tasks|return nothing|do not (?:do|perform) anything/i.test(prompt);",
        "return false;",
        "executor: promptSaysNothing recognises a pack that refuses to work",
    ),
    (
        "s22-scripted-decline-becomes-success",
        "src/execute/scripted.ts",
        '          status: "failed",\n          output: undefined,\n          message: `the scripted executor has no response',
        '          status: "completed",\n          output: undefined,\n          message: `the scripted executor has no response',
        "executor: a scripted handler that declines is a failure, not a silent success",
    ),
]


def main() -> int:
    if len(sys.argv) == 2 and sys.argv[1] == "--list":
        for seed_id, file, _old, _new, aimed in SEEDS:
            print(f"{seed_id}\t{file}\t{aimed}")
        return 0
    if len(sys.argv) != 3:
        print("usage: seeds.py <seed-id> <work-root> | seeds.py --list", file=sys.stderr)
        return 2
    seed_id, work = sys.argv[1], sys.argv[2]
    for candidate, file, old, new, _aimed in SEEDS:
        if candidate != seed_id:
            continue
        path = pathlib.Path(work) / file
        text = path.read_text()
        if old not in text:
            print(f"{seed_id}: pattern absent in {file}", file=sys.stderr)
            return 1
        path.write_text(text.replace(old, new, 1))
        return 0
    print(f"{seed_id}: no such seed", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
