/**
 * A2-G probe: repeated graph derivation and repeated repository I/O inside a
 * single read-only `validate`.
 *
 * Git invocations are counted with a shim ahead of the real `git` on PATH,
 * so the count is of what the production code actually ran, not of what the
 * probe believes it should have run.
 */
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createBrief, createIntent, recordDecision } from "../../../src/graph/mutations.js";
import { beginExecution, writeExecutionState } from "../../../src/lifecycle/state.js";
import { recordDelivery, recordReview } from "../../../src/lifecycle/provenance.js";
import { validateProject } from "../../../src/validate.js";
import { makeProject, observe, summary } from "./fixture.js";

function installGitShim(root: string): { log: string; restore: () => void } {
  const dir = join(root, ".git-shim");
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "calls.log");
  writeFileSync(log, "", "utf8");
  writeFileSync(
    join(dir, "git"),
    `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(log)}\nexec /usr/bin/git "$@"\n`,
    "utf8",
  );
  chmodSync(join(dir, "git"), 0o755);
  const previous = process.env["PATH"] ?? "";
  process.env["PATH"] = `${dir}:${previous}`;
  return {
    log,
    restore: () => {
      process.env["PATH"] = previous;
    },
  };
}

/**
 * A project with `count` lineages all standing at their Evidence step.
 *
 * Every graph write happens first and every run is advanced afterwards:
 * execution state is excluded from the delivery digest, so all the Reviews
 * are taken against one repository state and all the lineages are closable
 * at once. Interleaving them instead is what G-XLIN-1 shows to be refused.
 */
function projectWithLineages(name: string, count: number): string {
  const root = makeProject(name);
  const briefs: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const intent = createIntent(root, { title: `Lineage ${i} intent`, body: "Body." });
    const { contract } = recordDecision(root, {
      intentId: intent.id,
      outcome: "proceed",
      decidedBy: "human:probe",
      body: "Body.",
      contract: { title: `Lineage ${i} contract`, body: "Body." },
    });
    briefs.push(
      createBrief(root, { contractId: contract!.id, title: `Lineage ${i} brief`, body: "Body." })
        .id,
    );
  }
  for (const brief of briefs) {
    writeExecutionState(root, beginExecution(brief, "direct", "delivery"));
    recordDelivery(root, { anchor: brief });
    recordReview(root, { anchor: brief, outcome: "pass" });
  }
  return root;
}

/* G-COST-1 — git invocations per `validate`, against the number of lineages. */
{
  const counts: Array<{ lineages: number; git: number }> = [];
  for (const lineages of [1, 2, 4, 8]) {
    const root = projectWithLineages(`cost-${lineages}`, lineages);
    const shim = installGitShim(root);
    validateProject({ root });
    shim.restore();
    const calls = readFileSync(shim.log, "utf8")
      .split("\n")
      .filter((l) => l.length > 0);
    counts.push({ lineages, git: calls.length });
  }
  const growth = counts.map((c) => `${c.lineages} lineage(s): ${c.git} git calls`).join("; ");
  const constant = new Set(counts.map((c) => c.git)).size === 1;
  observe(
    "G-COST-1 repository I/O per validate",
    "a read-only validate resolves the repository revision a bounded number of times, independent of lineage count",
    growth,
    constant,
  );
}

/* G-COST-2 — wall-clock scaling of a clean validate. */
{
  const timings: string[] = [];
  const perLineage: number[] = [];
  for (const lineages of [2, 8, 16]) {
    const root = projectWithLineages(`scale-${lineages}`, lineages);
    const start = Date.now();
    const report = validateProject({ root });
    const ms = Date.now() - start;
    timings.push(`${lineages} lineage(s): ${ms}ms, ok=${String(report.ok)}`);
    perLineage.push(ms / lineages);
  }
  // Superlinear if the per-lineage cost of the largest run is materially
  // above the smallest: the work per lineage should be roughly flat.
  const ratio = perLineage[perLineage.length - 1]! / perLineage[0]!;
  observe(
    "G-COST-2 validate cost per lineage",
    "per-lineage validation cost stays roughly flat as the graph grows",
    `${timings.join("; ")}; per-lineage cost ratio largest/smallest = ${ratio.toFixed(2)}`,
    ratio < 2,
  );
}

summary();
