import { after, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { mintNodeId, slugify } from "../src/graph/ids.js";
import { deriveLineage } from "../src/graph/lineage.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
  serialiseNode,
} from "../src/graph/mutations.js";
import { parseNodeFile } from "../src/graph/nodes.js";
import { loadProject, type Project } from "../src/loader.js";
import { fixture, repoRoot } from "./helpers.js";

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

const CONTRACT = { title: "Quick start contract", body: "Print a banner." };

test("mutations: proceed records decision + canonical contract + resolves/selects", () => {
  const root = tempProject();
  const { decision, contract } = recordDecision(load(root), {
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
    const { decision, contract } = recordDecision(load(root), {
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
      recordDecision(load(root), {
        intentId: INTENT,
        outcome: "proceed",
        decidedBy: "agent:spec",
        body: "x",
        contract: CONTRACT,
      }),
    (error: unknown) => error instanceof PactwrightError && error.code === "unauthorised-actor",
  );
  assert.equal(snapshot(root), before);
  assert.deepEqual(
    readdirSync(path.join(root, "specs", "nodes")).filter((f) => f.includes(".tmp-")),
    [],
  );
});

test("mutations: agent lifecycle authorises agent and automation actors", () => {
  const root = tempProject({ agentDecides: true });
  const { decision } = recordDecision(load(root), {
    intentId: INTENT,
    outcome: "defer",
    decidedBy: "automation:pactwright",
    body: "Deferred by policy.",
  });
  assert.equal(decision.frontmatter["decided_by"], "automation:pactwright");
  assert.throws(
    () =>
      recordDecision(load(root), {
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
  const base = { intentId: INTENT, decidedBy: "human:samir", body: "x" } as const;
  assert.throws(
    () => recordDecision(load(root), { ...base, outcome: "proceed" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "invalid-outcome-input",
  );
  assert.throws(
    () => recordDecision(load(root), { ...base, outcome: "reject", contract: CONTRACT }),
    (error: unknown) => error instanceof PactwrightError && error.code === "invalid-outcome-input",
  );
});

test("mutations: intent → proceed → brief → evidence completes the lifecycle", () => {
  const root = tempProject();
  const intent = createIntent(load(root), {
    title: "Ship the banner",
    body: "Users need a banner.",
  });
  const { contract } = recordDecision(load(root), {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const brief = createBrief(load(root), contract!.id, {
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  const evidence = createEvidence(load(root), brief.id, {
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
  const first = recordDecision(load(root), {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const second = recordDecision(load(root), {
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
  const { contract } = recordDecision(load(root), {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const brief1 = createBrief(load(root), contract!.id, { title: "Brief one", body: "v1" });
  const brief2 = createBrief(load(root), contract!.id, { title: "Brief two", body: "v2" });
  const evidence1 = createEvidence(load(root), brief2.id, { title: "Evidence one", body: "e1" });
  const evidence2 = createEvidence(load(root), brief2.id, { title: "Evidence two", body: "e2" });
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

test("mutations: briefs need an existing current contract; superseded records refuse work", () => {
  const root = tempProject();
  const before = snapshot(root);
  assert.throws(
    () => createBrief(load(root), "contract-nope-0000", { title: "x", body: "y" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "unknown-node",
  );
  assert.equal(snapshot(root), before);
  const first = recordDecision(load(root), {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  recordDecision(load(root), {
    intentId: INTENT,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Rescoped.",
    contract: { title: "Other contract", body: "Other." },
    created: "2026-08-19",
  });
  assert.throws(
    () => createBrief(load(root), first.contract!.id, { title: "x", body: "y" }),
    (error: unknown) => error instanceof PactwrightError && error.code === "superseded-node",
  );
});

test("mutations: created nodes round-trip through the node parser", () => {
  const root = tempProject();
  const intent = createIntent(load(root), {
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
