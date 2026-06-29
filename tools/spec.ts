import { loadSpec } from "./loader.ts";
import { writeIndexes } from "./indexer.ts";
import { runGate } from "./gate.ts";
import { runCheckDiff } from "./checkdiff.ts";
import { runPatchGate } from "./patch_gate.ts";
import { runDriftMap } from "./driftmap.ts";
import { formatFinding, runValidation, writeReport } from "./validator.ts";

const USAGE = `usage: spec <index|validate|gate|check-diff|patch-gate|drift-map>

  index       regenerate the four files under specs/indexes/
  validate    run the rules in specs/schema/validation-rules.yaml;
              findings are persisted to specs/reports/validation.yaml
  gate        pass/fail the PR evidence-or-override gate for the current diff
              (base ref from $GATE_BASE, else merge-base with origin/HEAD)
  check-diff  pass/fail the sensitive-paths gate: a touched sensitive_paths
              glob needs a linked approved contract (bound to the owning
              capability) or an override; same base ref as gate
  patch-gate  pass/fail the patch-market merge gate: a PR merging a patch whose
              brief runs a market (>1 competing patch) needs a comparison + a
              selects decision (or an override); base from $GATE_BASE, head from
              $GITHUB_HEAD_REF
  drift-map   print the deterministic diff→capability drift packets (JSON)

exit codes: 0 success, 1 validation/load/gate failure, 2 usage error`;

const SUBCOMMANDS = ["index", "validate", "gate", "check-diff", "patch-gate", "drift-map"];

function main(): number {
  const subcommand = process.argv[2];
  if (subcommand === undefined || !SUBCOMMANDS.includes(subcommand)) {
    console.error(USAGE);
    return 2;
  }

  const spec = loadSpec();
  if (subcommand === "index") {
    const written = writeIndexes(spec);
    console.log(`spec:index wrote ${written.length} files: ${written.join(", ")}`);
    return 0;
  }

  if (subcommand === "gate") {
    const result = runGate(spec);
    if (result.pass) {
      console.log(`spec:gate: PASS — ${result.reason}`);
      return 0;
    }
    console.error(`spec:gate: FAIL — ${result.reason}`);
    return 1;
  }

  if (subcommand === "check-diff") {
    const result = runCheckDiff(spec);
    if (result.pass) {
      console.log(`spec:check-diff: PASS — ${result.reason}`);
      return 0;
    }
    console.error(`spec:check-diff: FAIL — ${result.reason}`);
    return 1;
  }

  if (subcommand === "patch-gate") {
    const result = runPatchGate(spec);
    if (result.pass) {
      console.log(`spec:patch-gate: PASS — ${result.reason}`);
      return 0;
    }
    console.error(`spec:patch-gate: FAIL — ${result.reason}`);
    return 1;
  }

  if (subcommand === "drift-map") {
    console.log(JSON.stringify(runDriftMap(spec), null, 2));
    return 0;
  }

  const findings = runValidation(spec);
  const report = writeReport(spec, findings);
  if (findings.length > 0) {
    for (const finding of findings) console.error(formatFinding(finding));
    console.error(`spec:validate: ${findings.length} error(s) across ${spec.rules.length} rules (report: ${report})`);
    return 1;
  }
  console.log(`spec:validate: OK — ${spec.rules.length} rules, 0 errors (report: ${report})`);
  return 0;
}

// Load/parse failures (malformed frontmatter, unreadable YAML, missing dirs)
// are intentional hard errors: they fail closed with exit 1 and a plain
// `spec: <message>` line, deliberately outside the `[rule: <id>]` findings
// channel — a graph we cannot parse cannot be meaningfully validated.
try {
  process.exit(main());
} catch (err) {
  console.error(`spec: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
