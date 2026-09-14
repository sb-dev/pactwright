import { after, test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import { deriveLineage } from "../src/graph/lineage.js";
import { graphRevision } from "../src/graph/revision.js";
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
  type ActionExecutor,
  type ActionRequest,
} from "../src/lifecycle/run.js";
import { loadExecutionState, routeKey } from "../src/lifecycle/state.js";
import { loadProject } from "../src/loader.js";
import { defaultResponsibilities, defaultShapeSteps, makeTempProject } from "./helpers.js";

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

function revisionOf(root: string): string {
  const p = loadProject({ root });
  return graphRevision({ nodes: p.graph.nodes, edges: p.graph.edges });
}

/**
 * An executor that really performs every action: Contract-crafting
 * responsibilities call the Step 7 mutations with the project root, Delivery
 * reports the state it produced and Review reports its verdict. Records the
 * order it was asked in.
 */
function fullExecutor(
  asked: string[],
  intents = 1,
  reviews: readonly ("pass" | "revise" | "blocked")[] = [],
): ActionExecutor {
  let reviewIndex = 0;
  return ({ action, project, lineage }: ActionRequest) => {
    asked.push(action.name);
    const root = project.paths.root;
    switch (action.name) {
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
      case "delivery":
        // Delivery reports the identity of what it produced, so a later
        // change invalidates a Review taken against it.
        return { status: "completed", revision: `delivered-${asked.length}` };
      case "review": {
        const outcome = reviews[reviewIndex] ?? "pass";
        reviewIndex += 1;
        return { status: "completed", review: outcome };
      }
      case "evidence":
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
  const root = temp({ lineage: "open" });
  const asked: string[] = [];
  const results = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.deepEqual(results, [
    {
      intent: INTENT,
      stop: "human-gate",
      action: "approve-contract",
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
    responsibilities: defaultResponsibilities({ "write-brief": { execution: "manual" } }),
  });
  const asked: string[] = [];
  const before = snapshot(root);
  const [result] = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(result?.stop, "human-gate");
  assert.equal(result?.action, "write-brief");
  assert.deepEqual(result?.executed, []);
  assert.deepEqual(asked, []);
  assert.equal(snapshot(root), before);
});

test("run: a Gate on a shape step stops the run after the preceding step", async () => {
  const root = temp({
    lineage: "delivering",
    shapeSteps: defaultShapeSteps({ review: { execution: "automatic", actor: "human" } }),
  });
  const asked: string[] = [];
  const [result] = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(result?.stop, "human-gate");
  assert.equal(result?.action, "review");
  assert.deepEqual(result?.executed, ["delivery"]);
  assert.equal(result?.requiredActor, "human");
});

test("run: the automated lifecycle runs open → done through the shape", async () => {
  const root = temp({ lineage: "open", lifecycle: "automated.yml" });
  const asked: string[] = [];
  const results = await runLifecycle({ root, execute: fullExecutor(asked) });
  const order = [
    "propose-contracts",
    "approve-contract",
    "write-brief",
    "delivery",
    "review",
    "evidence",
  ];
  assert.deepEqual(results, [{ intent: INTENT, stop: "completed", executed: order }]);
  assert.deepEqual(asked, order);
  assert.equal(state(root), "done");

  const again = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(again[0]?.stop, "completed");
  assert.deepEqual(again[0]?.executed, []);
  const [next] = lifecycleNext(loadProject({ root }), INTENT);
  assert.equal(next?.action, undefined);
  assert.match(next!.reason, /no next action/);
});

test("run: execution progress alone leaves canonical graph state and the revision unchanged", async () => {
  const root = temp({
    lineage: "delivering",
    lifecycle: "automated.yml",
    transitions: [{ from: "review", to: "delivery", maxIterations: 1 }],
  });
  const before = snapshot(root);
  const beforeRevision = revisionOf(root);
  // Delivery and Review run, a correction is taken and the bound is reached:
  // the run moved through several steps and wrote no canonical record (Step 6).
  const [result] = await runLifecycle({
    root,
    execute: fullExecutor([], 1, ["revise", "revise"]),
  });
  assert.equal(result?.stop, "blocked");
  assert.equal(snapshot(root), before, "canonical records must be unchanged");
  assert.equal(revisionOf(root), beforeRevision, "project_graph_revision must be unchanged");
  // …and the progress really was persisted outside the graph.
  const persisted = loadExecutionState(root, "brief-quick-start-d4e5");
  assert.equal(persisted.value?.brief, "brief-quick-start-d4e5");
  assert.equal(persisted.value?.shape, "direct");
});

test("run: a corrective Review takes the declared route and counts the iteration", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const asked: string[] = [];
  // revise, then pass: delivery runs twice, review runs twice, then evidence.
  await runLifecycle({ root, execute: fullExecutor(asked, 1, ["revise", "pass"]) });
  assert.deepEqual(asked, ["delivery", "review", "delivery", "review", "evidence"]);
  assert.equal(state(root), "done");
});

test("run: an exhausted corrective route blocks instead of looping forever", async () => {
  const root = temp({
    lineage: "delivering",
    lifecycle: "automated.yml",
    transitions: [{ from: "review", to: "delivery", maxIterations: 1 }],
  });
  const asked: string[] = [];
  const [result] = await runLifecycle({
    root,
    execute: fullExecutor(asked, 1, ["revise", "revise"]),
  });
  assert.equal(result?.stop, "blocked");
  assert.match(result!.message!, /1 of 1 permitted iterations/);
  // One correction was taken, the second was refused: no third delivery.
  assert.deepEqual(asked, ["delivery", "review", "delivery", "review"]);
  assert.equal(state(root), "delivering");
  const persisted = loadExecutionState(root, "brief-quick-start-d4e5");
  assert.equal(persisted.value?.status, "blocked");
  assert.equal(persisted.value?.iterations[routeKey("review", "delivery")], 1);
});

test("run: a Review asking for correction with no declared route stops, never invents one", async () => {
  const root = temp({
    lineage: "delivering",
    lifecycle: "automated.yml",
    transitions: [],
  });
  const [result] = await runLifecycle({ root, execute: fullExecutor([], 1, ["revise"]) });
  assert.equal(result?.stop, "blocked");
  assert.match(result!.message!, /declares no corrective route/);
  assert.equal(state(root), "delivering");
});

test("run: a Review reporting blocked stops the run", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({ root, execute: fullExecutor([], 1, ["blocked"]) });
  assert.equal(result?.stop, "blocked");
  assert.match(result!.message!, /reported the work blocked/);
});

test("run: a Review that reports no outcome cannot route and fails", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({
    root,
    execute: ({ action }) =>
      action.name === "review" ? { status: "completed" } : { status: "completed" },
  });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.action, "review");
  assert.match(result!.message!, /without reporting an outcome/);
});

test("run: automatic capture-intent creates the lineage and continues with it", async () => {
  const root = temp({
    lifecycle: "automated.yml",
    responsibilities: defaultResponsibilities({
      "capture-intent": { execution: "automatic" },
      "approve-contract": { execution: "automatic", actor: "agent" },
    }),
  });
  const asked: string[] = [];
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
    responsibilities: defaultResponsibilities({
      "capture-intent": { execution: "automatic" },
      "approve-contract": { execution: "automatic", actor: "agent" },
    }),
  });
  const asked: string[] = [];
  const inner = fullExecutor(asked, 3);
  const seen: number[] = [];
  const execute: ActionExecutor = (request) => {
    if (request.action.name === "approve-contract") seen.push(request.project.graph.nodes.length);
    return inner(request);
  };
  const results = await runLifecycle({ root, execute });
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

  const before = snapshot(root);
  for (const intent of intents) {
    const again = await runLifecycle({ root, execute: fullExecutor([], 3), intentId: intent.id });
    assert.deepEqual(again, [{ intent: intent.id, stop: "completed", executed: [] }]);
  }
  assert.equal(snapshot(root), before);
});

test("run: closing a lineage clears its execution state", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  await runLifecycle({ root, execute: fullExecutor([]) });
  assert.equal(state(root), "done");
  assert.equal(
    existsSync(path.join(root, ".pactwright", "execution", "brief-quick-start-d4e5.yml")),
    false,
    "a closed run leaves no progression state behind",
  );
});

test("run: an action failure stops the run; later actions do not run; graph unchanged", async () => {
  const root = temp({ lineage: "contracted", lifecycle: "automated.yml" });
  const asked: string[] = [];
  const before = snapshot(root);
  const failing: ActionExecutor = (request) => {
    asked.push(request.action.name);
    return { status: "failed", message: "brief writer crashed" };
  };
  const [result] = await runLifecycle({ root, execute: failing });
  assert.deepEqual(result, {
    intent: INTENT,
    stop: "stage-failed",
    action: "write-brief",
    executed: [],
    message: "brief writer crashed",
  });
  assert.deepEqual(asked, ["write-brief"]);
  assert.equal(snapshot(root), before);
});

test("run: an executor that throws is an action failure, not a crash", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({
    root,
    execute: () => {
      throw new Error("boom");
    },
  });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.action, "delivery");
  assert.equal(result?.message, "boom");
});

test("run: a validation error after an action stops the run with the problems", async () => {
  const root = temp({ lineage: "delivering", lifecycle: "automated.yml" });
  const corrupting: ActionExecutor = ({ action }) => {
    if (action.name === "review") {
      appendFileSync(
        path.join(root, "specs", "graph", "edges.yml"),
        "  - source: brief-quick-start-d4e5\n    type: decomposes\n    target: contract-nope-0000\n",
      );
      return { status: "completed", review: "pass" };
    }
    return { status: "completed", revision: "delivered-1" };
  };
  const [result] = await runLifecycle({ root, execute: corrupting });
  assert.equal(result?.stop, "validation-error");
  assert.deepEqual(result?.executed, ["delivery", "review"]);
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

test("run: a responsibility that does not advance the graph fails", async () => {
  const root = temp({ lineage: "contracted", lifecycle: "automated.yml" });
  const [result] = await runLifecycle({ root, execute: () => ({ status: "completed" }) });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.action, "write-brief");
  assert.match(result!.message!, /without advancing the graph/);
});

test("run: noExecutor fails the first automatic action", async () => {
  const root = temp({ lineage: "contracted" });
  const [result] = await runLifecycle({ root, execute: noExecutor });
  assert.equal(result?.stop, "stage-failed");
  assert.equal(result?.action, "write-brief");
  assert.match(
    result!.message!,
    /no executor configured for automatic responsibility "write-brief"/,
  );
});

test("run: deferred and rejected lineages complete with nothing to run", async () => {
  for (const lineage of ["deferred", "rejected"]) {
    const root = temp({ lineage, lifecycle: "automated.yml" });
    const asked: string[] = [];
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

test("run: an incomplete agent pack fails the first mutating action; graph unchanged", async () => {
  const root = temp({
    lineage: "open",
    pack: "incomplete",
    responsibilities: defaultResponsibilities({
      "approve-contract": { execution: "automatic", actor: "agent" },
    }),
  });
  const before = snapshot(root);
  const asked: string[] = [];
  const [result] = await runLifecycle({ root, execute: fullExecutor(asked) });
  assert.equal(result!.stop, "stage-failed");
  assert.equal(result!.action, "approve-contract");
  assert.match(result!.message ?? "", /missing-capability|delivery-review/);
  assert.equal(snapshot(root), before);
  assert.equal(state(root), "open");
});
