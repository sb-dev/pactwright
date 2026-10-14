// T3.6 L4 comparison report (evidence-backed learning log §4, L4-03): the
// pinned decision rules applied to every retained run of a set. Results of
// another protocol digest are refused. A (task, repeat) counts in the paired
// totals only when all three arms have a final run that is not missing, an
// error or an infrastructure failure; every other run is still listed, and
// any planned (task, repeat) without a complete pair keeps the result from
// being a benefit. The result is a benefit, a regression or inconclusive,
// with its reasons; a bounded fixture study cannot establish a general
// performance gain.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { DefaultArtifactClient } from "@actions/artifact";

import type { RunMetrics } from "./metrics.js";
import { ARMS, loadProtocol, type Arm, type Protocol } from "./task.js";

export type ArmTotals = {
  runs: number;
  valid: number;
  falseAcceptances: number;
  exhausted: number;
  paused: number;
  repeatedFailures: number;
  medianTurns: number;
  medianElapsedMs: number;
  medianSessions: number;
  outputTokens: number;
  apiEquivalentUsd: number;
  unknownCost: number;
  validByTask: Record<string, number>;
};

export type Verdict = {
  result: "benefit" | "regression" | "inconclusive";
  reasons: string[];
  pairs: { task: string; repeat: number }[];
  missing: { task: string; repeat: number; why: string }[];
  totals: Record<Arm, ArmTotals>;
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

const EXCLUDED = new Set(["error", "infrastructure"]);

/** The pinned decision over a set's results (protocol `decision`). */
export function decide(
  results: RunMetrics[],
  protocol: Protocol,
  digest: string,
  set: string,
): Verdict {
  const foreign = results.filter((r) => r.protocol !== digest || r.set !== set);
  if (foreign.length > 0) {
    throw new Error(
      `${foreign.length} results are of another protocol or set; none is mixed into the decision`,
    );
  }
  const final = results.filter((r) => !r.superseded);
  const tasks = protocol.sets[set]?.tasks ?? [];
  const repeats = protocol.sets[set]?.repeats ?? 0;
  const pairs: Verdict["pairs"] = [];
  const missing: Verdict["missing"] = [];
  for (const task of tasks) {
    for (let repeat = 1; repeat <= repeats; repeat++) {
      const runs = ARMS.map((arm) =>
        final.find((r) => r.task === task && r.repeat === repeat && r.arm === arm),
      );
      const absent = ARMS.filter((_, i) => runs[i] === undefined);
      const bad = runs.find(
        (r) =>
          r !== undefined &&
          (EXCLUDED.has(r.outcome) || r.reasons.some((x) => x.startsWith("missing:"))),
      );
      if (absent.length === 0 && bad === undefined) pairs.push({ task, repeat });
      else
        missing.push({
          task,
          repeat,
          why:
            absent.length > 0
              ? `no run of ${absent.join(", ")}`
              : `${bad?.arm} ${bad?.outcome}: ${bad?.reasons[0] ?? ""}`,
        });
    }
  }
  const paired = (arm: Arm): RunMetrics[] =>
    final.filter(
      (r) => r.arm === arm && pairs.some((p) => p.task === r.task && p.repeat === r.repeat),
    );
  const totalsOf = (arm: Arm): ArmTotals => {
    const runs = paired(arm);
    const validByTask = Object.fromEntries(
      tasks.map((t) => [t, runs.filter((r) => r.task === t && r.outcome === "valid").length]),
    );
    return {
      runs: runs.length,
      valid: runs.filter((r) => r.outcome === "valid").length,
      falseAcceptances: final.filter((r) => r.arm === arm && r.outcome === "false-acceptance")
        .length,
      exhausted: runs.filter((r) => r.outcome === "exhausted").length,
      paused: runs.filter((r) => r.outcome === "paused").length,
      repeatedFailures: runs.reduce((n, r) => n + r.repeatedFailures, 0),
      medianTurns: median(runs.map((r) => r.turns)),
      medianElapsedMs: median(runs.map((r) => r.elapsedMs)),
      medianSessions: median(runs.map((r) => r.sessions)),
      outputTokens: runs.reduce((n, r) => n + r.outputTokens, 0),
      apiEquivalentUsd: runs.reduce((n, r) => n + r.apiEquivalentUsd, 0),
      unknownCost: runs.reduce((n, r) => n + r.unknownCost, 0),
      validByTask,
    };
  };
  const totals = { B: totalsOf("B"), D: totalsOf("D"), E: totalsOf("E") };
  const d = protocol.decision;
  const reasons: string[] = [];
  const control = (arm: Arm): number =>
    final.filter((r) => r.arm === arm && r.task === d.control.task && r.outcome === "valid").length;
  // Regression: a false acceptance by E, E's control failing, or E's valid total below another arm's.
  const regressions = [
    ...(totals.E.falseAcceptances > 0
      ? [`E accepted ${totals.E.falseAcceptances} run(s) the oracle rejects`]
      : []),
    ...(tasks.includes(d.control.task) && control("E") < d.control.valid_repeats
      ? [
          `E's control ${d.control.task} was valid in ${control("E")} repeats, fewer than ${d.control.valid_repeats}`,
        ]
      : []),
    ...(["B", "D"] as const).flatMap((x) =>
      totals.E.valid < totals[x].valid
        ? [`E's valid outcomes (${totals.E.valid}) are below ${x}'s (${totals[x].valid})`]
        : [],
    ),
  ];
  if (regressions.length > 0)
    return { result: "regression", reasons: regressions, pairs, missing, totals };
  for (const x of ["B", "D"] as const) {
    if (tasks.includes(d.control.task) && control(x) < d.control.valid_repeats) {
      reasons.push(
        `${x}'s control ${d.control.task} was valid in ${control(x)} repeats; the study's control did not progress`,
      );
    }
    const more = totals.E.valid - totals[x].valid >= d.valid_margin;
    const lessRepeated =
      totals[x].repeatedFailures >= d.repeated_minimum &&
      totals.E.repeatedFailures <= d.repeated_ratio * totals[x].repeatedFailures;
    if (!more && !lessRepeated) {
      reasons.push(
        `against ${x}: valid outcomes ${totals.E.valid} vs ${totals[x].valid} (needs +${d.valid_margin}) and repeated failed approaches ${totals.E.repeatedFailures} vs ${totals[x].repeatedFailures} (needs at most ${d.repeated_ratio} of at least ${d.repeated_minimum})`,
      );
    }
    for (const t of tasks) {
      if ((totals.E.validByTask[t] ?? 0) < (totals[x].validByTask[t] ?? 0)) {
        reasons.push(
          `against ${x}: ${t} has fewer valid outcomes (${totals.E.validByTask[t] ?? 0} vs ${totals[x].validByTask[t] ?? 0})`,
        );
      }
    }
    if (totals.E.medianTurns > d.turns_ratio * totals[x].medianTurns) {
      reasons.push(
        `against ${x}: median turns ${totals.E.medianTurns} exceed ${d.turns_ratio} × ${totals[x].medianTurns}`,
      );
    }
    if (totals.E.medianElapsedMs > d.elapsed_ratio * totals[x].medianElapsedMs) {
      reasons.push(
        `against ${x}: median time ${Math.round(totals.E.medianElapsedMs / 1000)} s exceeds ${d.elapsed_ratio} × ${Math.round(totals[x].medianElapsedMs / 1000)} s`,
      );
    }
  }
  // A benefit is never drawn from an incomplete experiment: every planned
  // (task, repeat) of the set must be a complete pair.
  for (const m of missing) {
    reasons.push(`${m.task} repeat ${m.repeat} has no complete paired run (${m.why})`);
  }
  return reasons.length === 0
    ? {
        result: "benefit",
        reasons: ["every pinned benefit condition holds against B and D"],
        pairs,
        missing,
        totals,
      }
    : { result: "inconclusive", reasons, pairs, missing, totals };
}

/** The report as Markdown: the verdict, the per-task table and every run. */
export function render(
  results: RunMetrics[],
  verdict: Verdict,
  protocol: Protocol,
  digest: string,
  set: string,
): string {
  const lines = [
    `# T3.6 L4 comparison — ${set}`,
    "",
    `Protocol version ${protocol.version}, ${digest}. Baseline ${protocol.baseline}. Arms: B the baseline, D the revision under test without learning, E with learning.`,
    "",
    `**Result: ${verdict.result}.**`,
    "",
    ...verdict.reasons.map((r) => `- ${r}`),
    "",
    "A bounded fixture study: it measures these tasks under these settings and cannot establish a general performance gain. Usage is live provider sessions, model turns and output tokens; cache tokens are not recorded; the API-price equivalent is not a bill.",
    "",
    "## Paired totals",
    "",
    "| Arm | Runs | Valid | False acceptances | Exhausted | Paused | Repeated failed approaches | Median sessions | Median turns | Output tokens | Median time (s) | API-price equivalent (USD) | Unknown cost |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...ARMS.map((a) => {
      const t = verdict.totals[a];
      return `| ${a} | ${t.runs} | ${t.valid} | ${t.falseAcceptances} | ${t.exhausted} | ${t.paused} | ${t.repeatedFailures} | ${t.medianSessions} | ${t.medianTurns} | ${t.outputTokens} | ${Math.round(t.medianElapsedMs / 1000)} | ${t.apiEquivalentUsd.toFixed(2)} | ${t.unknownCost} |`;
    }),
    "",
    "## Valid outcomes per task",
    "",
    `| Task | ${ARMS.join(" | ")} |`,
    `| --- | ${ARMS.map(() => "---").join(" | ")} |`,
    ...Object.keys(verdict.totals.E.validByTask).map(
      (t) => `| ${t} | ${ARMS.map((a) => verdict.totals[a].validByTask[t] ?? 0).join(" | ")} |`,
    ),
    "",
    `Missing from the paired totals: ${verdict.missing.map((m) => `${m.task} r${m.repeat} (${m.why})`).join("; ") || "none"}.`,
    "",
    "## Every run",
    "",
    "| Task | Repeat | Rerun | Arm | Outcome | Oracle | Live attempts | Repeated | Sessions | Learning sessions | Turns | Output tokens | Time (s) | Superseded | Archive |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...results.map(
      (r) =>
        `| ${r.task} | ${r.repeat} | ${r.rerun} | ${r.arm} | ${r.outcome} | ${r.oracle} | ${r.liveAttempts} | ${r.repeatedFailures} | ${r.sessions} | ${r.learningSessions} | ${r.turns} | ${r.outputTokens} | ${Math.round(r.elapsedMs / 1000)} | ${r.superseded ? "yes" : "no"} | ${r.archive ?? "none"} |`,
    ),
    "",
    "## Run notes",
    "",
    ...results.flatMap((r) =>
      r.reasons.length > 0 || r.oracle === "failed"
        ? [
            `- ${r.task} r${r.repeat}.${r.rerun} ${r.arm}: ${[...r.reasons, ...(r.oracle === "failed" ? [`oracle: ${r.oracleDetail}`] : [])].join("; ")}`,
          ]
        : [],
    ),
  ];
  return `${lines.join("\n")}\n`;
}

/** Every results.jsonl under `dir`. */
export function loadResults(dir: string): RunMetrics[] {
  const files = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? files(join(d, e.name))
        : e.name === "results.jsonl"
          ? [join(d, e.name)]
          : [],
    );
  return files(dir).flatMap((f) =>
    readFileSync(f, "utf8")
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l) as RunMetrics),
  );
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      set: { type: "string" },
      in: { type: "string" },
      out: { type: "string" },
      download: { type: "boolean" },
      upload: { type: "string" },
    },
  });
  const { set, out } = values;
  const input = values.in;
  if (!set || !input || !out) throw new Error("report.ts needs --set, --in and --out");
  if (values.download) {
    // This workflow run's shard artifacts.
    const client = new DefaultArtifactClient();
    const { artifacts } = await client.listArtifacts({ latest: true });
    for (const a of artifacts.filter(
      (x) => x.name.startsWith(`comparison-${set}-`) && !x.name.endsWith("-report"),
    )) {
      const into = join(input, a.name);
      mkdirSync(into, { recursive: true });
      await client.downloadArtifact(a.id, { path: into });
    }
  }
  const { protocol, digest } = loadProtocol();
  const results = loadResults(input).sort((a, b) =>
    `${a.task}/${a.repeat}/${a.rerun}/${a.arm}`.localeCompare(
      `${b.task}/${b.repeat}/${b.rerun}/${b.arm}`,
    ),
  );
  const verdict = decide(results, protocol, digest, set);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "report.md"), render(results, verdict, protocol, digest, set));
  writeFileSync(
    join(out, "verdict.json"),
    `${JSON.stringify({ set, protocol: digest, verdict, results }, null, 2)}\n`,
  );
  console.log(`${set}: ${verdict.result}`);
  if (values.upload) {
    await new DefaultArtifactClient().uploadArtifact(
      values.upload,
      [join(out, "report.md"), join(out, "verdict.json")],
      out,
      { retentionDays: 90 },
    );
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    process.exit(1);
  });
}
