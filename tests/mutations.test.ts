import { after, test } from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import * as api from "../src/index.js";
import { PactwrightError } from "../src/errors.js";
import { mintNodeId, slugify } from "../src/graph/ids.js";
import { deriveLineage } from "../src/graph/lineage.js";
import {
  commitGraphChange,
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
  serialiseNode,
} from "../src/graph/mutations.js";
import { parseNodeFile, type GraphNode } from "../src/graph/nodes.js";
import { loadProject, type Project } from "../src/loader.js";
import { fixture, makeTempProject, repoRoot } from "./helpers.js";

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** A writable copy of the lineage `open` fixture plus valid-project config. */
function tempProject(options: { agentDecides?: boolean } = {}): string {
  const dir = mkdtempSync(path.join(repoRoot, ".tmp-pactwright-test-"));
  tempDirs.push(dir);
  cpSync(path.join(fixture("valid-project"), ".pactwright"), path.join(dir, ".pactwright"), {
    recursive: true,
  });
  cpSync(path.join(fixture("lineage"), "open", "specs"), path.join(dir, "specs"), {
    recursive: true,
  });
  if (options.agentDecides === true) {
    const lifecycle = path.join(dir, ".pactwright", "lifecycle.yml");
    writeFileSync(
      lifecycle,
      readFileSync(lifecycle, "utf8").replace("actor: human", "actor: agent"),
    );
  }
  return dir;
}

const INTENT = "intent-quick-start-a1b2";
const load = (root: string): Project => loadProject({ root });

/** Sorted (file, sha256) pairs under specs/, for no-mutation assertions. */
function snapshot(root: string): string {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir, { withFileTypes: true }).sort()) {
      const full = path.join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else
        out.push(
          `${path.relative(root, full)} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`,
        );
    }
  };
  walk(path.join(root, "specs"));
  return out.sort().join("\n");
}

/** No leftover atomic-write temporaries in specs/nodes. */
function assertNoTemps(root: string): void {
  assert.deepEqual(
    readdirSync(path.join(root, "specs", "nodes")).filter((f) => f.includes(".tmp-")),
    [],
  );
}

/** A hand-built raw node for white-box tests of the internal commit path. */
function rawNode(root: string, id: string): GraphNode {
  const front = { id, type: "intent", title: id, created: "2026-08-18" };
  return {
    ...front,
    frontmatter: front,
    body: `Body of ${id}.`,
    path: path.join(root, "specs", "nodes", `${id}.md`),
  };
}

const CONTRACT = { title: "Quick start contract", body: "Print a banner." };

test("mutations: proceed records decision + canonical contract + resolves/selects", () => {
  const root = tempProject();
  const { decision, contract } = recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go ahead.",
    contract: CONTRACT,
  });
  const project = load(root); // reload proves the written state is valid
  const lineage = deriveLineage(INTENT, project.graph.nodes, project.graph.edges);
  assert.equal(lineage?.state, "contracted");
  assert.equal(lineage?.decision?.id, decision.id);
  assert.equal(lineage?.contract?.id, contract!.id);
  assert.equal(decision.frontmatter["decided_by"], "human:samir");
  assert.deepEqual(project.graph.edges, [
    { source: decision.id, type: "resolves", target: INTENT },
    { source: decision.id, type: "selects", target: contract!.id },
  ]);
});

for (const outcome of ["reject", "defer"] as const) {
  test(`mutations: ${outcome} records only the decision and resolves edge`, () => {
    const root = tempProject();
    const { decision, contract } = recordDecision(root, {
      intentId: INTENT,
      outcome,
      decidedBy: "human:samir",
      body: "Not now.",
    });
    assert.equal(contract, undefined);
    const project = load(root);
    assert.equal(project.graph.nodes.length, 2);
    assert.deepEqual(project.graph.edges, [
      { source: decision.id, type: "resolves", target: INTENT },
    ]);
    const lineage = deriveLineage(INTENT, project.graph.nodes, project.graph.edges);
    assert.equal(lineage?.state, outcome === "reject" ? "rejected" : "deferred");
  });
}

test("mutations: an unauthorised actor is rejected with no graph mutation", () => {
  const root = tempProject(); // lifecycle authorises human
  const before = snapshot(root);
  assert.throws(
    () =>
      recordDecision(root, {
        intentId: INTENT,
        outcome: "proceed",
        decidedBy: "agent:spec",
        body: "x",
        contract: CONTRACT,
      }),
    (error: unknown) => error instanceof PactwrightError && error.code === "unauthorised-actor",
  );
  assert.equal(snapshot(root), before);
  assertNoTemps(root);
});

test("mutations: agent lifecycle authorises agent and automation actors", () => {
  const root = tempProject({ agentDecides: true });
  const { decision } = recordDecision(root, {
    intentId: INTENT,
    outcome: "defer",
    decidedBy: "automation:pactwright",
    body: "Deferred by policy.",
  });
  assert.equal(decision.frontmatter["decided_by"], "automation:pactwright");
  assert.throws(
    () =>
      recordDecision(root, {
        intentId: INTENT,
        outcome: "defer",
        decidedBy: "human:samir",
        body: "x",
      }),
    (error: unknown) => error instanceof PactwrightError && error.code === "unauthorised-actor",
  );
});

test("mutations: proceed requires a contract; reject/defer forbid one", () => {
  const root = tempProject();
  const before = snapshot(root);
  const base = { intentId: INTENT, decidedBy: "human:samir", body: "x" } as const;
  assert.throws(
    () => recordDecision(root, { ...base, outcome: "proceed" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "invalid-outcome-input",
  );
  assert.throws(
    () => recordDecision(root, { ...base, outcome: "reject", contract: CONTRACT }),
    (error: unknown) => error instanceof PactwrightError && error.code === "invalid-outcome-input",
  );
  assert.equal(snapshot(root), before);
});

test("mutations: empty semantic content is rejected before any write", () => {
  const root = tempProject();
  const before = snapshot(root);
  assert.throws(
    () => createIntent(root, { title: "   ", body: "Body." }),
    (error: unknown) => error instanceof PactwrightError && error.code === "invalid-title",
  );
  assert.throws(
    () => createIntent(root, { title: "Fine title", body: "  " }),
    (error: unknown) => error instanceof PactwrightError && error.code === "missing-body",
  );
  assert.equal(snapshot(root), before);
  assertNoTemps(root);
});

test("mutations: intent → proceed → brief → evidence completes the lifecycle", () => {
  const root = tempProject();
  const intent = createIntent(root, {
    title: "Ship the banner",
    body: "Users need a banner.",
  });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  const evidence = createEvidence(root, {
    briefId: brief.id,
    title: "Banner evidence",
    body: "Banner added; verified by run.",
  });
  const project = load(root);
  const lineage = deriveLineage(intent.id, project.graph.nodes, project.graph.edges);
  assert.equal(lineage?.state, "done");
  assert.equal(lineage?.evidence?.id, evidence.id);
});

test("mutations: re-deciding supersedes the previous decision and contract", () => {
  const root = tempProject();
  const first = recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const second = recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Changed scope.",
    contract: { title: "Bigger contract", body: "Print two banners." },
    created: "2026-08-19",
  });
  const project = load(root);
  const edges = project.graph.edges;
  assert.ok(
    edges.some(
      (e) =>
        e.source === second.decision.id &&
        e.type === "supersedes" &&
        e.target === first.decision.id,
    ),
  );
  assert.ok(
    edges.some(
      (e) =>
        e.source === second.contract!.id &&
        e.type === "supersedes" &&
        e.target === first.contract!.id,
    ),
  );
  const lineage = deriveLineage(INTENT, project.graph.nodes, project.graph.edges);
  assert.equal(lineage?.contract?.id, second.contract!.id);
});

test("mutations: new brief and new evidence supersede the previous current ones", () => {
  const root = tempProject();
  const { contract } = recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const brief1 = createBrief(root, { contractId: contract!.id, title: "Brief one", body: "v1" });
  const brief2 = createBrief(root, { contractId: contract!.id, title: "Brief two", body: "v2" });
  const evidence1 = createEvidence(root, { briefId: brief2.id, title: "Evidence one", body: "e1" });
  const evidence2 = createEvidence(root, { briefId: brief2.id, title: "Evidence two", body: "e2" });
  const project = load(root);
  const lineage = deriveLineage(INTENT, project.graph.nodes, project.graph.edges);
  assert.equal(lineage?.brief?.id, brief2.id);
  assert.equal(lineage?.evidence?.id, evidence2.id);
  assert.ok(
    project.graph.edges.some(
      (e) => e.source === brief2.id && e.type === "supersedes" && e.target === brief1.id,
    ),
  );
  assert.ok(
    project.graph.edges.some(
      (e) => e.source === evidence2.id && e.type === "supersedes" && e.target === evidence1.id,
    ),
  );
});

test("mutations: briefs need an existing current contract; a conflicting intervening change is rejected", () => {
  const root = tempProject();
  const before = snapshot(root);
  assert.throws(
    () => createBrief(root, { contractId: "contract-nope-0000", title: "x", body: "y" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "unknown-node",
  );
  assert.equal(snapshot(root), before);
  const first = recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  // Intervening change: a second decision supersedes the first contract.
  recordDecision(root, {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Rescoped.",
    contract: { title: "Other contract", body: "Other." },
    created: "2026-08-19",
  });
  // A brief for the superseded contract commits against CURRENT state and fails.
  const beforeConflict = snapshot(root);
  assert.throws(
    () => createBrief(root, { contractId: first.contract!.id, title: "x", body: "y" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "superseded-node",
  );
  assert.equal(snapshot(root), beforeConflict);
  assertNoTemps(root);
});

test("mutations: the raw commit primitive is not part of the public API", () => {
  for (const name of ["commitGraphChange", "serialiseNode", "serialiseEdges"]) {
    assert.equal(name in api, false, `${name} must not be exported from the package index`);
  }
  for (const name of ["createIntent", "recordDecision", "createBrief", "createEvidence"]) {
    assert.equal(name in api, true, `${name} is the public mutation surface`);
  }
});

test("mutations: the commit path rejects a caller-supplied path outside specs/nodes", () => {
  const root = tempProject();
  const before = snapshot(root);
  const project = load(root);
  const outside = { ...rawNode(root, "intent-sneaky-beef"), path: path.join(root, "evil.md") };
  assert.throws(
    () => commitGraphChange(project, { addNodes: [outside], addEdges: [] }),
    (error: unknown) =>
      error instanceof PactwrightError &&
      error.code === "mutation-invalid" &&
      error.problems.some((p) => p.code === "invalid-path"),
  );
  assert.equal(snapshot(root), before);
  assert.equal(existsSync(path.join(root, "evil.md")), false);
});

test("mutations: the commit path runs full common validation before any write", () => {
  const root = tempProject();
  const before = snapshot(root);
  const project = load(root);
  const bad = rawNode(root, "intent-BAD"); // invalid id shape
  assert.throws(
    () => commitGraphChange(project, { addNodes: [bad], addEdges: [] }),
    (error: unknown) =>
      error instanceof PactwrightError &&
      error.code === "mutation-invalid" &&
      error.problems.some((p) => p.code === "invalid-id"),
  );
  assert.equal(snapshot(root), before);
  assertNoTemps(root);
});

test("mutations: a post-write invalid resulting state is rolled back completely", () => {
  const root = tempProject();
  const before = snapshot(root);
  const project = load(root);
  const node = rawNode(root, "intent-extra-beef");
  assert.throws(
    () =>
      commitGraphChange(
        project,
        { addNodes: [node], addEdges: [] },
        {
          postWrite: () =>
            writeFileSync(path.join(root, "specs", "graph", "edges.yml"), "edges: [broken\n"),
        },
      ),
    (error: unknown) =>
      error instanceof PactwrightError && error.code === "resulting-state-invalid",
  );
  assert.equal(snapshot(root), before);
  assertNoTemps(root);
  assert.equal(existsSync(node.path), false);
});

test("mutations: created nodes round-trip through the node parser", () => {
  const root = tempProject();
  const intent = createIntent(root, {
    title: 'Weird: title -- with "quotes" & symbols!',
    body: "Body.",
  });
  const parsed = parseNodeFile(serialiseNode(intent), intent.path);
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.value?.title, intent.title);
});

test("mutations: ids are deterministic, unique and well-formed", () => {
  assert.equal(slugify("Ship the Banner!"), "ship-the-banner");
  assert.equal(slugify("--- !!"), undefined);
  const taken = new Set<string>();
  const a = mintNodeId("intent", "x", "seed", taken);
  assert.equal(a, mintNodeId("intent", "x", "seed", new Set()));
  taken.add(a);
  const b = mintNodeId("intent", "x", "seed", taken);
  assert.notEqual(a, b);
  assert.ok(b.startsWith(a));
  assert.notEqual(mintNodeId("intent", "x", "other-seed", new Set()), a);
});

test("mutations: an incomplete agent pack is rejected before any graph or lock mutation", () => {
  const root = makeTempProject({ lineage: "open", pack: "incomplete" });
  tempDirs.push(root);
  const before = snapshot(root);
  const lockBefore = readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8");
  assert.throws(
    () => createIntent(root, { title: "Blocked", body: "Never written." }),
    (error: unknown) =>
      error instanceof PactwrightError &&
      error.code === "missing-capability" &&
      /delivery-review/.test(error.message),
  );
  assert.throws(
    () =>
      recordDecision(root, {
        intentId: INTENT,
        outcome: "reject",
        decidedBy: "human:samir",
        body: "No.",
      }),
    (error: unknown) => error instanceof PactwrightError && error.code === "missing-capability",
  );
  assert.equal(snapshot(root), before);
  assert.equal(readFileSync(path.join(root, ".pactwright", "lock.yml"), "utf8"), lockBefore);
  assertNoTemps(root);
});

test("mutations: an unresolvable agent pack is rejected before any graph mutation", () => {
  const root = makeTempProject({ lineage: "open", pack: "missing-prompt" });
  tempDirs.push(root);
  const before = snapshot(root);
  assert.throws(
    () => createIntent(root, { title: "Blocked", body: "Never written." }),
    (error: unknown) => error instanceof PactwrightError && error.code === "pack-unresolved",
  );
  assert.equal(snapshot(root), before);
});
