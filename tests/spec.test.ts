import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
// Scope 11.4: `INDEX_FILES` is IMPORTED, never re-declared here. A local copy is a
// second source of truth that silently narrows every loop below the day the real
// list widens — which is exactly what happened when `trails.md` and `status.md`
// were added. The loops that consume it widen for free.
import { INDEX_FILES } from "../tools/indexer.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "tools", "spec.ts");
const fixtures = path.join(repoRoot, "tests", "fixtures");

function runCli(cwd: string, ...args: string[]) {
  // Temp dirs live inside the repo so `--import tsx` resolves via node_modules
  // (tsx does NOT resolve from /tmp). Variadic so the `status <node-id>` filter
  // form drives the same plumbing as every bare subcommand.
  const result = spawnSync(process.execPath, ["--import", "tsx", cli, ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.error, undefined);
  return result;
}

function copyFixture(t: { after(fn: () => void): void }, name: string): string {
  const dir = fs.mkdtempSync(path.join(repoRoot, ".tmp-spec-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(fixtures, name), dir, { recursive: true });
  return dir;
}

function expectedErrors(name: string): string[] {
  return fs
    .readFileSync(path.join(fixtures, name, "expected-errors.txt"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

function errorLines(stderr: string): string[] {
  return stderr.split("\n").filter((l) => l.startsWith("[rule: "));
}

/**
 * Every file under `dir`, mapped from its repo-relative-to-`dir` path to the HEX of
 * its bytes. Used to PROVE read-only-ness rather than assert it: a Map comparison
 * reds on a changed byte, a new file AND a deleted file, which an "exit 0" check
 * cannot see. Hex (not utf8) so a byte that does not round-trip through a decoder
 * still shows up as a difference.
 */
function snapshotTree(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (rel: string) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const child = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else out.set(child, fs.readFileSync(path.join(dir, child)).toString("hex"));
    }
  };
  walk("");
  return out;
}

/** A NEXT block is `NEXT <id> <stage>`, one line per Step, then a line `END`. */
function nextBlocks(stdout: string): string[] {
  const blocks: string[] = [];
  let current: string[] | undefined;
  for (const line of stdout.split("\n")) {
    if (line.startsWith("NEXT ")) current = [line];
    else if (current !== undefined) {
      current.push(line);
      if (line === "END") {
        blocks.push(current.join("\n") + "\n");
        current = undefined;
      }
    }
  }
  return blocks;
}

test("good graph: index is deterministic and byte-identical to committed fixtures, validate passes", (t) => {
  const dir = copyFixture(t, "good");
  assert.equal(runCli(dir, "index").status, 0);
  const first = new Map<string, string>();
  for (const name of INDEX_FILES) {
    const regenerated = fs.readFileSync(path.join(dir, "specs", "indexes", name), "utf8");
    const committed = fs.readFileSync(path.join(fixtures, "good", "specs", "indexes", name), "utf8");
    assert.equal(regenerated, committed, `${name} differs from committed fixture`);
    first.set(name, regenerated);
  }
  // Acceptance example 7 (determinism): re-run is byte-identical.
  assert.equal(runCli(dir, "index").status, 0);
  for (const name of INDEX_FILES) {
    assert.equal(fs.readFileSync(path.join(dir, "specs", "indexes", name), "utf8"), first.get(name));
  }
  assert.equal(runCli(dir, "validate").status, 0);
});

// Acceptance examples 1–5 (contract A) and 8 (rule provenance, asserted by
// the `[rule: <id>]` prefix on every pinned error string).
for (const name of [
  "dangling-target",
  "duplicate-node-id",
  "wrong-endpoint-type",
  "flags-wrong-endpoint",
  "supersedes-across-types",
  "missing-required-field",
  "duplicate-edge-id",
  "bad-status",
  "edge-missing-field",
  "waives-unknown-check",
  "capability-bad-paths",
  "uncovered-multi-brief",
  "patch-synthesis-one-parent",
  "patch-status-merged",
  "competes-for-bad-endpoints",
  // Amendment 9: this array is the ONLY enumeration of bad fixtures — there is no
  // readdirSync over tests/fixtures/bad anywhere in the repo, so a fixture omitted
  // here sits on disk and is silently never run. Both entries below are new; add
  // every future fixture directory name here in the same commit that creates it.
  "unbacked-addressed",
  "subsumes-wrong-endpoint",
]) {
  test(`bad/${name}: validate fails with the pinned errors`, (t) => {
    const dir = copyFixture(t, `bad/${name}`);
    assert.equal(runCli(dir, "index").status, 0);
    const result = runCli(dir, "validate");
    assert.equal(result.status, 1);
    for (const line of expectedErrors(`bad/${name}`)) {
      assert.ok(result.stderr.includes(line), `missing error: ${line}\nstderr:\n${result.stderr}`);
    }
  });
}

test("bad/dangling-target: spec:index writes the unresolved endpoint to unresolved.yaml", (t) => {
  const dir = copyFixture(t, "bad/dangling-target");
  assert.equal(runCli(dir, "index").status, 0);
  const doc = load(fs.readFileSync(path.join(dir, "specs", "indexes", "unresolved.yaml"), "utf8"));
  assert.deepEqual(doc, {
    unresolved: [{ edge: "edge-foo-1234", missing: "target", value: "intent-missing-zzzz" }],
  });
});

test("bad/index-drift: hand-edited index is reported as drift (acceptance example 6)", (t) => {
  const dir = copyFixture(t, "bad/index-drift");
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  const lines = errorLines(result.stderr);
  assert.deepEqual(lines, expectedErrors("bad/index-drift"));
});

test("bad/schema-extension: appending a rule of an existing kind rejects a passing graph (example 9)", (t) => {
  const dir = copyFixture(t, "bad/schema-extension");
  assert.equal(runCli(dir, "index").status, 0);
  assert.equal(runCli(dir, "validate").status, 0, "fixture must pass with the bootstrap rules");
  const rulesFile = path.join(dir, "specs", "schema", "validation-rules.yaml");
  fs.appendFileSync(
    rulesFile,
    "  - id: nodes-title-unique\n    kind: unique_field\n    scope: nodes\n    field: title\n",
  );
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  for (const line of expectedErrors("bad/schema-extension")) {
    assert.ok(result.stderr.includes(line), `missing error: ${line}\nstderr:\n${result.stderr}`);
  }
});

test("bad/rule-disable: removing a rule makes exactly its errors disappear (example 10)", (t) => {
  const dir = copyFixture(t, "bad/rule-disable");
  const before = runCli(dir, "validate");
  assert.equal(before.status, 1);
  assert.deepEqual(errorLines(before.stderr), expectedErrors("bad/rule-disable"));

  const rulesFile = path.join(dir, "specs", "schema", "validation-rules.yaml");
  const doc = load(fs.readFileSync(rulesFile, "utf8")) as { rules: { id: string }[] };
  doc.rules = doc.rules.filter((r) => r.id !== "indexes-fresh");
  fs.writeFileSync(rulesFile, JSON.stringify(doc) + "\n"); // JSON is valid YAML
  const after = runCli(dir, "validate");
  assert.equal(after.status, 0, `expected no errors, got:\n${after.stderr}`);
  assert.deepEqual(errorLines(after.stderr), []);
});

test("bad/dispatch-all-kinds: each kind dispatches and produces the expected error count per rule", (t) => {
  const dir = copyFixture(t, "bad/dispatch-all-kinds");
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  const lines = errorLines(result.stderr);
  // AUTHORITATIVE PIN: the full ordered line list, byte-for-byte against the
  // fixture's expected-errors.txt. Everything below is a READABILITY GUARD that
  // says which rule each pinned line belongs to and how many lines it owns — do
  // NOT "simplify" the map back to a flat array of rule ids, because a flat array
  // can only express "one finding per rule", which `indexes-fresh` no longer
  // satisfies and which silently drops the per-rule dispatch check it exists for.
  assert.deepEqual(lines, expectedErrors("bad/dispatch-all-kinds"));
  const expectedPerRule = new Map<string, number>([
    ["edges-endpoint-types", 1],
    ["edges-references-resolve", 1],
    // THREE, not one: `indexes-fresh` emits one finding per file in the widened
    // INDEX_FILES, and this fixture commits all six with three of them stale —
    // by-type.yaml, status.md and trails.md. All three are present on disk, so no
    // "(missing — run spec:index)" suffix appears; incoming/outgoing/unresolved
    // are committed fresh and stay silent.
    ["indexes-fresh", 3],
    ["nodes-id-unique", 1],
    ["nodes-required-fields", 1],
    ["nodes-type-declared", 1],
  ]);
  for (const [id, count] of expectedPerRule) {
    assert.equal(
      lines.filter((l) => l.startsWith(`[rule: ${id}]`)).length,
      count,
      `${count} error(s) for ${id}`,
    );
  }
  // Anti-vacuity: the map covers every rule that fired, so a newly dispatching
  // rule must be classified here rather than slipping past an under-sized map.
  const firedRules = new Set(lines.map((l) => l.slice("[rule: ".length, l.indexOf("]"))));
  assert.deepEqual([...firedRules].sort(), [...expectedPerRule.keys()].sort());
});

test("good-waives: an override waiving the pr-evidence named check validates", (t) => {
  const dir = copyFixture(t, "good-waives");
  assert.equal(runCli(dir, "index").status, 0);
  const result = runCli(dir, "validate");
  assert.equal(result.status, 0, `expected validate to pass, got:\n${result.stderr}`);
  // The new `override` node type appears under its own `by-type` group, the
  // index where the gate's waiver path is auditable (acceptance example 4).
  const byType = load(
    fs.readFileSync(path.join(dir, "specs", "indexes", "by-type.yaml"), "utf8"),
  ) as { "by-type": Record<string, string[]> };
  assert.deepEqual(
    byType["by-type"].override,
    ["override-waiver-3333"],
    `expected override-waiver-3333 under by-type: override, got:\n${JSON.stringify(byType, null, 2)}`,
  );
});

test("good-drift: capability/touches/flags validate and group in by-type", (t) => {
  const dir = copyFixture(t, "good-drift");
  assert.equal(runCli(dir, "index").status, 0);
  const result = runCli(dir, "validate");
  assert.equal(result.status, 0, `expected validate to pass, got:\n${result.stderr}`);
  // The new types appear under their own `by-type` groups, and the
  // `flags → capability` list-target edge passes endpoint validation.
  const byType = load(
    fs.readFileSync(path.join(dir, "specs", "indexes", "by-type.yaml"), "utf8"),
  ) as { "by-type": Record<string, string[]> };
  assert.deepEqual(byType["by-type"].capability, ["capability-x-aaaa"]);
  assert.deepEqual(byType["by-type"]["drift-finding"], ["drift-finding-x-cccc"]);
});

test("good-patch-market: a resolved patch market validates and indexes are byte-identical", (t) => {
  const dir = copyFixture(t, "good-patch-market");
  // Index regenerates and is byte-identical to the committed fixture indexes
  // (the spec:index output is deterministic — same shape as the `good` byte check).
  assert.equal(runCli(dir, "index").status, 0);
  for (const name of INDEX_FILES) {
    const regenerated = fs.readFileSync(path.join(dir, "specs", "indexes", name), "utf8");
    const committed = fs.readFileSync(path.join(fixtures, "good-patch-market", "specs", "indexes", name), "utf8");
    assert.equal(regenerated, committed, `${name} differs from committed fixture`);
  }
  // The full rule set (incl. synthesis-parentage + selected-patch-comparison) passes.
  const result = runCli(dir, "validate");
  assert.equal(result.status, 0, `expected validate to pass, got:\n${result.stderr}`);

  // Schema-for-free: the new `patch` node type groups under by-type, and the
  // `competes-for`/`synthesizes` edges appear in the relationship indexes — so a
  // `compares`/`selects → patch` edge validates as a list-target endpoint.
  const byType = load(
    fs.readFileSync(path.join(dir, "specs", "indexes", "by-type.yaml"), "utf8"),
  ) as { "by-type": Record<string, string[]> };
  assert.deepEqual(byType["by-type"].patch, ["patch-alpha-c3d4", "patch-beta-e5f6", "patch-synthesis-0708"]);

  // The edge types live in outgoing.yaml keyed by source; assert the new
  // relationship kinds (competes-for, synthesizes) and a selects → patch are present.
  const outgoing = load(
    fs.readFileSync(path.join(dir, "specs", "indexes", "outgoing.yaml"), "utf8"),
  ) as { outgoing: Record<string, { id: string; type: string; target: string }[]> };
  const allOut = Object.values(outgoing.outgoing).flat();
  const types = new Set(allOut.map((e) => e.type));
  assert.ok(types.has("competes-for"), "competes-for edge missing from outgoing index");
  assert.ok(types.has("synthesizes"), "synthesizes edge missing from outgoing index");
  // A selects edge whose target is a patch validated cleanly (widened list target).
  const selectsToPatch = allOut.find((e) => e.type === "selects" && e.target === "patch-synthesis-0708");
  assert.ok(selectsToPatch !== undefined, "selects → patch edge missing from outgoing index");
});

// Contract Behaviour 5 — `spec:status`. Read-only is PROVED, not asserted: the bytes
// of every file under the copied fixture are snapshotted before the runs and compared
// after, so a stray `writeIndexes`, a persisted report or a rewritten node reds this
// case. All four invocations (both success forms and both usage-error forms) run
// inside one snapshot window, so the error paths are covered by the same proof.
//
// HONEST BOUND: "read-only" here means "wrote no byte under the fixture tree". This
// case does NOT machine-check "no network" — nothing here sandboxes sockets, and a
// resolver that phoned home would still pass. That half is read from the source and
// recorded as a reviewer judgement, never claimed as verified.
test("status: exits 0, prints a NEXT block, and leaves the fixture tree byte-unchanged", (t) => {
  const dir = copyFixture(t, "good");
  const before = snapshotTree(dir);

  const all = runCli(dir, "status");
  assert.equal(all.status, 0, `expected status to exit 0, got:\n${all.stderr}`);
  const blocks = nextBlocks(all.stdout);
  assert.equal(blocks.length, 1, `expected one NEXT block, got:\n${all.stdout}`);
  assert.match(blocks[0], /^NEXT intent-good-aaaa /);
  assert.match(blocks[0], /\nEND\n$/);

  // The filter form: one node id, the same block the whole-graph form printed for it.
  const one = runCli(dir, "status", "intent-good-aaaa");
  assert.equal(one.status, 0, `expected status <node-id> to exit 0, got:\n${one.stderr}`);
  assert.equal(one.stdout, blocks[0]);

  // Red paths. A bad node id is a USAGE error (2), never a graph failure (1) — the
  // read-only resolver must not be able to red a build over graph content.
  const malformed = runCli(dir, "status", "not a node id");
  assert.equal(malformed.status, 2, `expected a malformed id to be a usage error:\n${malformed.stderr}`);
  assert.equal(nextBlocks(malformed.stdout).length, 0);
  const unknown = runCli(dir, "status", "intent-absent-9999");
  assert.equal(unknown.status, 2, `expected an unknown id to be a usage error:\n${unknown.stderr}`);
  assert.equal(nextBlocks(unknown.stdout).length, 0);

  assert.deepEqual(snapshotTree(dir), before, "spec:status mutated the fixture tree");
});

// CC-12's transcript fixture, driven through the CLI. `tests/conveyor.test.ts` owns
// the in-process replay of every entry and the fourteen-command coverage leg; this
// case is the CLI-level half — it proves the recorded blocks are what the SHIPPED
// entrypoint prints (the transcript header says every block was captured from
// `tools/spec.ts status <node-id>`), and that the fixture is a well-formed graph the
// rest of the toolchain accepts.
test("conveyor-transcript: no committed indexes, status replays a recorded block, index+validate green", (t) => {
  // Deliberately NO specs/indexes/ in the SOURCE fixture, following good-drift and
  // good-waives. This is load-bearing, not incidental: it keeps "exactly five
  // index-bearing fixtures" true, so pinning it here means adding indexes to this
  // fixture reds a test instead of silently changing that count.
  const source = path.join(fixtures, "conveyor-transcript");
  assert.equal(fs.existsSync(path.join(source, "specs", "indexes")), false);

  const entries = load(fs.readFileSync(path.join(source, "transcript.yaml"), "utf8")) as {
    command: string;
    node: string;
    block: string;
  }[];
  assert.ok(Array.isArray(entries) && entries.length > 0, "transcript.yaml holds no entries");
  // Behaviour 2.8's headline: the selected patch resolves to /prepare-evidence with
  // the BRIEF id, through `competes-for` — never a branch name.
  const recorded = entries.find((e) => e.node === "patch-won-alpha-1a0e");
  assert.ok(recorded !== undefined, "transcript.yaml has no patch-won-alpha-1a0e entry");

  const dir = copyFixture(t, "conveyor-transcript");
  const before = snapshotTree(dir);
  const status = runCli(dir, "status", recorded.node);
  assert.equal(status.status, 0, `expected status to exit 0, got:\n${status.stderr}`);
  assert.equal(status.stdout, recorded.block);
  // Read-only again, and here it also proves `status` does not generate the indexes
  // this fixture deliberately lacks.
  assert.deepEqual(snapshotTree(dir), before, "spec:status mutated the fixture tree");

  // The fixture generates its indexes at test time, then validates clean.
  assert.equal(runCli(dir, "index").status, 0);
  for (const name of INDEX_FILES) {
    assert.ok(
      fs.existsSync(path.join(dir, "specs", "indexes", name)),
      `spec:index did not write ${name}`,
    );
  }
  const result = runCli(dir, "validate");
  assert.equal(result.status, 0, `expected validate to pass, got:\n${result.stderr}`);
});

test("unknown subcommand: usage text on stderr, exit 2, and the advertised subcommand set", () => {
  const result = runCli(repoRoot, "frobnicate");
  assert.equal(result.status, 2);
  // Scope 11.4. `tools/spec.ts` runs `process.exit(main())` at MODULE SCOPE, so
  // importing it to reach `SUBCOMMANDS` would run the CLI and kill this test
  // process — the set is therefore PARSED out of the printed usage line rather
  // than imported. Set-equality (not a literal substring) so the assertion does
  // not encode where `status` was inserted, while still reding on a missing or an
  // unexpected subcommand.
  const usage = /^usage: spec <([^>]*)>$/m.exec(result.stderr);
  assert.ok(usage !== null, `no "usage: spec <...>" line on stderr:\n${result.stderr}`);
  const advertised = usage[1].split("|").map((s) => s.trim());
  assert.deepEqual(
    new Set(advertised),
    new Set(["index", "validate", "gate", "check-diff", "patch-gate", "drift-map", "status"]),
  );
  // No duplicate cell hiding inside the set comparison.
  assert.equal(advertised.length, new Set(advertised).size, `duplicate subcommand in: ${usage[1]}`);
});

test("bad/malformed-node: a node without frontmatter fails closed (exit 1, no rule finding)", (t) => {
  const dir = copyFixture(t, "bad/malformed-node");
  const result = runCli(dir, "validate");
  assert.equal(result.status, 1);
  // Load/parse errors are hard failures, not [rule: <id>] findings.
  assert.match(result.stderr, /missing YAML frontmatter/);
  assert.deepEqual(errorLines(result.stderr), []);
});

test("validate persists findings to specs/reports/validation.yaml", (t) => {
  const dir = copyFixture(t, "bad/missing-required-field");
  assert.equal(runCli(dir, "index").status, 0);
  assert.equal(runCli(dir, "validate").status, 1);
  const report = load(
    fs.readFileSync(path.join(dir, "specs", "reports", "validation.yaml"), "utf8"),
  ) as { rule: string; kind: string; subject: string; detail: string }[];
  assert.ok(Array.isArray(report));
  assert.ok(
    report.some(
      (f) =>
        f.rule === "nodes-required-fields" &&
        f.kind === "required_fields" &&
        f.subject === "intent-nostatus-3333" &&
        f.detail === "node intent-nostatus-3333 missing required field: status",
    ),
    `report missing the expected finding:\n${JSON.stringify(report, null, 2)}`,
  );
});
