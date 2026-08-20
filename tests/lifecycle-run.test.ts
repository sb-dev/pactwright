import { after, test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import type { StageName } from "../src/config/lifecycle.js";
import { deriveLineage } from "../src/graph/lineage.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../src/graph/mutations.js";
import { lifecycleNext } from "../src/lifecycle/engine.js";
import {
  noExecutor,
  runLifecycle,
  type StageExecutor,
  type StageRequest,
} from "../src/lifecycle/run.js";
import { loadProject } from "../src/loader.js";
import { defaultStages, makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const INTENT = "intent-quick-start-a1b2";
const AGENT = "agent:spec";

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

/**
 * An executor that really performs every stage: transient stages do
 * nothing, graph-marking stages call the Step 7 mutations with the project
 * root (mutations load current graph state themselves at commit time).
 * Records the order it was asked in.
 */
function fullExecutor(asked: StageName[], intents = 1): StageExecutor {
  return ({ stage, project, lineage }: StageRequest) => {
    asked.push(stage);
    const root = project.paths.root;
    switch (stage) {
      case "capture-intent":
        for (let i = 1; i <= intents; i += 1) {
          createIntent(root, { title: `Captured number ${i}`, body: "Do the thing." });
        }
        break;
      case "approve-contract":
        recordDecision(root, {
          intentId: lineage!.intent.id,
          outcome: "proceed",
          decidedBy: AGENT,
          body: "Go.",
          contract: { title: "Contract", body: "Print a banner." },
        });
        break;
      case "write-brief":
        createBrief(root, {
          contractId: lineage!.contract!.id,
          title: "Brief",
          body: "Add banner.",
        });
        break;
      case "prepare-evidence":
        createEvidence(root, {
          briefId: lineage!.brief!.id,
          title: "Evidence",
          body: "Banner added.",
        });
        break;
      default:
        break;
    }
    return { status: "completed" };
  };
}

const state = (root: string) => {
  const p = loadProject({ root });
  return deriveLineage(INTENT, p.graph.nodes, p.graph.edges)?.state;
};

test("run: stops at the manual approve-contract gate and never asks the executor for it", async () => {
  const root = temp({ lineage: "open" }); // §17 default lifecycle
  const asked: StageName[] = [];
  const results = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.deepEqual(results, [
    {
      intent: INTENT,
      stop: "human-gate",
      stage: "approve-contract",
      requiredActor: "human",
      executed: ["propose-contracts"],
    },
  ]);
  assert.deepEqual(asked, ["propose-contracts"]);
  assert.equal(state(root), "open");
});

test("run: never skips a configured gate, even one the executor could perform", async () => {
  const root = temp({
    lineage: "contracted",
    stages: defaultStages({ "write-brief": { execution: "manual" } }),
  });
  const asked: StageName[] = [];
  const before = snapshot(root);
  const [result] = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(result?.stop, "human-gate");
  assert.equal(result?.stage, "write-brief");
  assert.deepEqual(result?.executed, []);
  assert.deepEqual(asked, []);
  assert.equal(snapshot(root), before);
});

test("run: a human-actor automatic stage is a gate too", async () => {
  const root = temp({
    lineage: "delivering",
    stages: defaultStages({ review: { execution: "automatic", actor: "human" } }),
  });
  const asked: StageName[] = [];
  const [result] = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(result?.stop, "human-gate");
  assert.equal(result?.stage, "review");
  assert.deepEqual(result?.executed, ["deliver-brief"]);
});

test("run: the automated lifecycle runs open → done, then has no next stage", async () => {
  const root = temp({ lineage: "open", lifecycle: "automated.yml" });
  const asked: StageName[] = [];
  const results = await runLifecycle({ root, execute: fullExecutor(asked) });
  const order: StageName[] = [
    "propose-contracts",
    "approve-contract",
    "write-brief",
    "deliver-brief",
    "review",
    "prepare-evidence",
  ];
  assert.deepEqual(results, [{ intent: INTENT, stop: "completed", executed: order }]);
  assert.deepEqual(asked, order);
  assert.equal(state(root), "done");

  const again = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(again[0]?.stop, "completed");
  assert.deepEqual(again[0]?.executed, []);
  const [next] = lifecycleNext(loadProject({ root }), INTENT);
  assert.equal(next?.stage, undefined);
  assert.match(next!.reason, /no next stage/);
});

test("run: automatic capture-intent creates the lineage and continues with it", async () => {
  const root = temp({
    lifecycle: "automated.yml",
    stages: defaultStages({
      "capture-intent": { execution: "automatic" },
      "approve-contract": { execution: "automatic", actor: "agent" },
    }),
  });
  const asked: StageName[] = [];
  const results = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(results.length, 2);
  assert.deepEqual(results[0], { stop: "completed", executed: ["capture-intent"] });
  assert.equal(results[1]?.stop, "completed");
  assert.equal(results[1]?.executed.length, 6);
  const p = loadProject({ root });
  assert.equal(p.graph.nodes.filter((n) => n.type === "evidence").length, 1);
});

test("run: capturing three intents in one run keeps every lineage's edges; rerun is idempotent", async () => {
  const root = temp({
    lifecycle: "automated.yml",
    stages: defaultStages({
      "capture-intent": { execution: "automatic" },
      "approve-contract": { execution: "automatic", actor: "agent" },
    }),
  });
  const asked: StageName[] = [];
  const inner = fullExecutor(asked, 3);
  // Node count each lineage's first graph-marking stage was handed: every
  // lineage must start from the graph the previous lineage wrote.
  const seen: number[] = [];
  const execute: StageExecutor = (request) => {
    if (request.stage === "approve-contract") seen.push(request.project.graph.nodes.length);
    return inner(request);
  };
  const results = await runLifecycle({ root, execute });
  // 3 intents, then +4 records (decision, contract, brief, evidence) per lineage.
  assert.deepEqual(seen, [3, 7, 11]);
  assert.equal(results.length, 4);
  assert.deepEqual(results[0], { stop: "completed", executed: ["capture-intent"] });
  for (const result of results.slice(1)) {
    assert.equal(result.stop, "completed");
    assert.equal(result.executed.length, 6);
  }
  const p = loadProject({ root });
  const intents = p.graph.nodes.filter((n) => n.type === "intent");
  assert.equal(intents.length, 3);
  assert.equal(p.graph.nodes.filter((n) => n.type === "evidence").length, 3);
  for (const intent of intents) {
    assert.ok(
      p.graph.edges.some((e) => e.type === "resolves" && e.target === intent.id),
      `edges.yml keeps the resolves edge of ${intent.id}`,
    );
    assert.equal(
      deriveLineage(intent.id, p.graph.nodes, p.graph.edges)?.state,
      "done",
      `${intent.id} ran to done`,
    );
  }

  // Rerun of every lineage executes nothing and changes nothing (PI §16).
  const before = snapshot(root);
  for (const intent of intents) {
    const again = await runLifecycle({ root, execute: fullExecutor([], 3), intentId: intent.id });
    assert.deepEqual(again, [{ intent: intent.id, stop: "completed", executed: [] }]);
  }
  assert.equal(snapshot(root), before);
});

test("run: a stage failure stops the run; later stages do not run; graph unchanged", async () => {
  const root = temp({ lineage: "contracted", lifecycle: "automated.yml" });
  const asked: StageName[] = [];
  const before = snapshot(root);
  const failing: StageExecutor = (request) => {
    asked.push(request.stage);
    return { status: "failed", message: "brief writer crashed" };
  };
  const [result] = await runLifecycle({ root, execute: failing });
  assert.deepEqual(result, {
    intent: INTENT,
    stop: "stage-failed",
    stage: "write-brief",
    executed: [],
    message: "brief writer crashed",
  });
  assert.deepEqual(asked, ["write-brief"]);
  assert.equal(snapshot(root), before);
});

test("run: an executor that throws is a stage failure, not a crash", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({
    root,
    execute: () => {
      throw new Error("boom");
    },
  });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.stage, "deliver-brief");
  assert.equal(result?.message, "boom");
});

test("run: a validation error after a stage stops the run with the problems", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const corrupting: StageExecutor = ({ stage }) => {
    if (stage === "review") {
      // Break the graph: a dangling edge is a validation error on reload.
      appendFileSync(
        path.join(root, "specs", "graph", "edges.yml"),
        "  - source: brief-quick-start-d4e5\n    type: decomposes\n    target: contract-nope-0000\n",
      );
    }
    return { status: "completed" };
  };
  const [result] = await runLifecycle({ root, execute: corrupting });
  assert.equal(result?.stop, "validation-error");
  assert.deepEqual(result?.executed, ["deliver-brief", "review"]);
  assert.ok((result?.problems?.length ?? 0) > 0);
});

test("run: a project that does not load is a validation error before anything runs", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  appendFileSync(
    path.join(root, "specs", "graph", "edges.yml"),
    "  - source: brief-quick-start-d4e5\n    type: decomposes\n    target: contract-nope-0000\n",
  );
  let called = false;
  const [result] = await runLifecycle({
    root,
    execute: () => {
      called = true;
      return { status: "completed" };
    },
  });
  assert.equal(result?.stop, "validation-error");
  assert.equal(called, false);
});

test("run: a graph-marking stage that does not advance the graph fails", async () => {
  const root = temp({ lineage: "contracted", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({ root, execute: () => ({ status: "completed" }) });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.stage, "write-brief");
  assert.match(result!.message!, /without advancing the graph/);
});

test("run: noExecutor fails the first automatic stage", async () => {
  const root = temp({ lineage: "contracted" });
  const [result] = await runLifecycle({ root, execute: noExecutor });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.stage, "write-brief");
  assert.match(result!.message!, /no executor for automatic stage "write-brief"/);
});

test("run: deferred and rejected lineages complete with nothing to run", async () => {
  for (const lineage of ["deferred", "rejected"]) {
    const root = temp({ lineage, lifecycle: "automated.yml" });
    const asked: StageName[] = [];
    const results = await runLifecycle({ root, execute: fullExecutor(asked), intentId: INTENT });
    assert.deepEqual(results, [{ intent: INTENT, stop: "completed", executed: [] }]);
    assert.deepEqual(asked, []);
  }
});

test("run: an unknown --intent is a validation error", async () => {
  const root = temp({ lineage: "open" });
  const [result] = await runLifecycle({ root, execute: noExecutor, intentId: "intent-x-0000" });
  assert.equal(result?.stop, "validation-error");
  assert.match(result!.message!, /not an intent/);
});
