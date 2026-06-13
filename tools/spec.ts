import { loadSpec } from "./loader.ts";
import { writeIndexes } from "./indexer.ts";
import { runGate } from "./gate.ts";
import { formatFinding, runValidation, writeReport } from "./validator.ts";

const USAGE = `usage: spec <index|validate|gate>

  index     regenerate the four files under specs/indexes/
  validate  run the rules in specs/schema/validation-rules.yaml;
            findings are persisted to specs/reports/validation.yaml
  gate      pass/fail the PR evidence-or-override gate for the current diff
            (base ref from $GATE_BASE, else merge-base with origin/HEAD)

exit codes: 0 success, 1 validation/load/gate failure, 2 usage error`;

function main(): number {
  const subcommand = process.argv[2];
  if (subcommand !== "index" && subcommand !== "validate" && subcommand !== "gate") {
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
