import { asString, loadSpec, nodesById } from "./loader.ts";
import { INDEX_FILES, writeIndexes } from "./indexer.ts";
import { deriveStage, isRenderableId, liveIntents, nextSteps } from "./conveyor.ts";
import { runGate } from "./gate.ts";
import { runCheckDiff } from "./checkdiff.ts";
import { runPatchGate } from "./patch_gate.ts";
import { runDriftMap } from "./driftmap.ts";
import { formatFinding, runValidation, writeReport } from "./validator.ts";

const USAGE = `usage: spec <index|validate|status|gate|check-diff|patch-gate|drift-map>

  index       regenerate the ${INDEX_FILES.length} files under specs/indexes/
  validate    run the rules in specs/schema/validation-rules.yaml;
              findings are persisted to specs/reports/validation.yaml
  status      print each live intent's stage and next step, or a single node's
              with an optional <node-id> argument; read-only, never mutates
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

const SUBCOMMANDS = ["index", "validate", "status", "gate", "check-diff", "patch-gate", "drift-map"];

/**
 * The machine-stable NEXT block every chain command reproduces verbatim, and the
 * artifact A9's transcription job diffs a printed block against. Its bytes are a
 * pure function of the graph: no clock, no locale, no absolute path.
 */
function printNextBlock(spec: ReturnType<typeof loadSpec>, nodeId: string): void {
  console.log(`NEXT ${nodeId} ${deriveStage(spec, nodeId)}`);
  for (const s of nextSteps(spec, nodeId)) console.log(`${s.kind} ${s.rendered}`);
  console.log("END");
}

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

  // Read-only: prints and exits, never mutates and never reds a build on graph
  // content. A load failure already exited through the fail-closed `spec:` channel
  // above; a malformed or unknown node id is a USAGE error (2), not a graph failure.
  if (subcommand === "status") {
    const nodeId = process.argv[3];
    if (nodeId !== undefined) {
      if (!isRenderableId(nodeId)) {
        console.error(`spec:status: ${JSON.stringify(nodeId)} is not a well-formed node id`);
        return 2;
      }
      if (nodesById(spec).get(nodeId) === undefined) {
        console.error(`spec:status: no node in the graph has id ${nodeId}`);
        return 2;
      }
      printNextBlock(spec, nodeId);
      return 0;
    }
    const intents = liveIntents(spec);
    if (intents.length === 0) console.log("spec:status: no live intents");
    for (const intent of intents) {
      const id = asString(intent.data["id"]);
      if (id === undefined) continue;
      printNextBlock(spec, id);
    }
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
