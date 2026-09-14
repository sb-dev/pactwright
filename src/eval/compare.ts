import type { EvalCaseResult, EvalReport } from "./runner.js";

/**
 * Baseline/candidate comparison (Distribution §24). A released Agent Pack
 * establishes a baseline; a candidate environment is compared against it.
 *
 * The report exposes differences at the dimensions a release decision is
 * actually made on — capability, agent, evaluation case and assertion — and
 * deliberately computes **no aggregate score**: §24 forbids deciding whether
 * a candidate is better from one opaque number.
 */

/** How one assertion moved between baseline and candidate. */
export type AssertionMovement = "regressed" | "fixed" | "unchanged" | "added" | "removed";

export interface AssertionDelta {
  readonly id: string;
  readonly movement: AssertionMovement;
  readonly baseline?: boolean;
  readonly candidate?: boolean;
  /** The candidate's observation, so a regression can be read without a re-run. */
  readonly detail?: string;
}

export interface CaseComparison {
  readonly caseId: string;
  readonly capability: string;
  /** The agent each side used; they differ when the packs map the capability differently. */
  readonly baselineAgent?: string;
  readonly candidateAgent?: string;
  /** Present only where the two sides differ. */
  readonly assertions: readonly AssertionDelta[];
  readonly regressed: boolean;
  readonly fixed: boolean;
  /** Set when a case errored on one side only. */
  readonly errorChanged?: {
    readonly baseline?: string;
    readonly candidate?: string;
  };
}

/** What changed about the environment itself, not its results. */
export interface EnvironmentDelta {
  readonly packChanged: boolean;
  readonly promptsChanged: boolean;
  readonly skillsChanged: boolean;
  readonly baseline: { readonly name: string; readonly version: string; readonly hash: string };
  readonly candidate: { readonly name: string; readonly version: string; readonly hash: string };
  /** Agent keys whose prompt hash differs. */
  readonly changedAgents: readonly string[];
  /** Direct-skill names whose hash differs. */
  readonly changedSkills: readonly string[];
}

export interface ComparisonReport {
  readonly suite: string;
  readonly environment: EnvironmentDelta;
  readonly cases: readonly CaseComparison[];
  /** Capabilities carrying at least one regression. */
  readonly regressedCapabilities: readonly string[];
  /** Agents carrying at least one regression, by the candidate's mapping. */
  readonly regressedAgents: readonly string[];
  /** Evaluation cases carrying at least one regression. */
  readonly regressedCases: readonly string[];
  readonly hasRegressions: boolean;
}

/** Component identities either side of a comparison, for the environment delta. */
export interface ComparisonEnvironment {
  readonly agents: Readonly<Record<string, string>>;
  readonly skills: Readonly<Record<string, string>>;
}

export interface CompareOptions {
  readonly baseline: EvalReport;
  readonly candidate: EvalReport;
  /** Locked component hashes, when available, so prompt and skill changes are named. */
  readonly baselineEnvironment?: ComparisonEnvironment;
  readonly candidateEnvironment?: ComparisonEnvironment;
}

function differingKeys(
  a: Readonly<Record<string, string>> = {},
  b: Readonly<Record<string, string>> = {},
): readonly string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((key) => a[key] !== b[key]).sort();
}

function compareCase(
  baseline: EvalCaseResult | undefined,
  candidate: EvalCaseResult | undefined,
): CaseComparison | undefined {
  const present = candidate ?? baseline;
  if (present === undefined) return undefined;

  const baseAssertions = new Map((baseline?.deterministic ?? []).map((a) => [a.id, a]));
  const candAssertions = new Map((candidate?.deterministic ?? []).map((a) => [a.id, a]));
  const ids = [...new Set([...baseAssertions.keys(), ...candAssertions.keys()])].sort();

  const assertions: AssertionDelta[] = [];
  for (const id of ids) {
    const before = baseAssertions.get(id);
    const after = candAssertions.get(id);
    if (before === undefined && after !== undefined) {
      assertions.push({
        id,
        movement: "added",
        candidate: after.passed,
        ...(after.detail === undefined ? {} : { detail: after.detail }),
      });
      continue;
    }
    if (after === undefined && before !== undefined) {
      assertions.push({ id, movement: "removed", baseline: before.passed });
      continue;
    }
    if (before === undefined || after === undefined) continue;
    if (before.passed === after.passed) continue; // unchanged results are not noise worth printing
    assertions.push({
      id,
      movement: before.passed && !after.passed ? "regressed" : "fixed",
      baseline: before.passed,
      candidate: after.passed,
      ...(after.detail === undefined ? {} : { detail: after.detail }),
    });
  }

  const errorChanged =
    baseline?.error === candidate?.error
      ? undefined
      : {
          ...(baseline?.error === undefined ? {} : { baseline: baseline.error }),
          ...(candidate?.error === undefined ? {} : { candidate: candidate.error }),
        };

  // A case that errors only on the candidate side is a regression even when
  // no individual assertion moved: nothing was evaluated.
  const erroredNow = candidate?.error !== undefined && baseline?.error === undefined;
  const regressed = assertions.some((a) => a.movement === "regressed") || erroredNow;
  const fixed =
    assertions.some((a) => a.movement === "fixed") ||
    (baseline?.error !== undefined && candidate?.error === undefined);

  if (assertions.length === 0 && errorChanged === undefined) return undefined;

  return {
    caseId: present.id,
    capability: present.capability,
    ...(baseline?.agent === undefined ? {} : { baselineAgent: baseline.agent }),
    ...(candidate?.agent === undefined ? {} : { candidateAgent: candidate.agent }),
    assertions,
    regressed,
    fixed,
    ...(errorChanged === undefined ? {} : { errorChanged }),
  };
}

/**
 * Compares a candidate run against a baseline run. An unchanged candidate
 * correctly reports no regressions: the purpose is a reviewable release
 * decision, not a manufactured difference.
 */
export function compareEvalReports(options: CompareOptions): ComparisonReport {
  const { baseline, candidate } = options;
  const baseCases = new Map(baseline.cases.map((entry) => [entry.id, entry]));
  const candCases = new Map(candidate.cases.map((entry) => [entry.id, entry]));
  const ids = [...new Set([...baseCases.keys(), ...candCases.keys()])].sort();

  const cases = ids
    .map((id) => compareCase(baseCases.get(id), candCases.get(id)))
    .filter((entry): entry is CaseComparison => entry !== undefined);

  const regressed = cases.filter((entry) => entry.regressed);
  const changedAgents = differingKeys(
    options.baselineEnvironment?.agents,
    options.candidateEnvironment?.agents,
  );
  const changedSkills = differingKeys(
    options.baselineEnvironment?.skills,
    options.candidateEnvironment?.skills,
  );

  return {
    suite: candidate.suite,
    environment: {
      packChanged:
        baseline.pack.name !== candidate.pack.name ||
        baseline.pack.version !== candidate.pack.version ||
        baseline.pack.hash !== candidate.pack.hash,
      promptsChanged: changedAgents.length > 0,
      skillsChanged: changedSkills.length > 0,
      baseline: baseline.pack,
      candidate: candidate.pack,
      changedAgents,
      changedSkills,
    },
    cases,
    regressedCapabilities: [...new Set(regressed.map((entry) => entry.capability))].sort(),
    regressedAgents: [
      ...new Set(
        regressed
          .map((entry) => entry.candidateAgent ?? entry.baselineAgent)
          .filter((agent): agent is string => agent !== undefined),
      ),
    ].sort(),
    regressedCases: regressed.map((entry) => entry.caseId).sort(),
    hasRegressions: regressed.length > 0,
  };
}

/** Human-readable comparison output. */
export function formatComparison(report: ComparisonReport): string {
  const lines = [`Comparison of suite "${report.suite}"`];
  const { environment: env } = report;
  lines.push(
    `  baseline:  ${env.baseline.name}@${env.baseline.version} (${env.baseline.hash})`,
    `  candidate: ${env.candidate.name}@${env.candidate.version} (${env.candidate.hash})`,
  );
  const changes = [
    env.packChanged ? "agent pack" : undefined,
    env.promptsChanged ? `prompts (${env.changedAgents.join(", ")})` : undefined,
    env.skillsChanged ? `direct skills (${env.changedSkills.join(", ")})` : undefined,
  ].filter((entry): entry is string => entry !== undefined);
  lines.push(`  changed:   ${changes.length === 0 ? "nothing" : changes.join("; ")}`, "");

  if (report.cases.length === 0) {
    lines.push("No differences: every case behaved identically.");
    return `${lines.join("\n")}\n`;
  }

  for (const entry of report.cases) {
    const agent =
      entry.baselineAgent === entry.candidateAgent
        ? (entry.candidateAgent ?? "unknown")
        : `${entry.baselineAgent ?? "none"} -> ${entry.candidateAgent ?? "none"}`;
    lines.push(
      `  ${entry.regressed ? "REGRESSED" : entry.fixed ? "fixed" : "changed"} ${entry.caseId} (capability ${entry.capability}, agent ${agent})`,
    );
    if (entry.errorChanged !== undefined) {
      lines.push(
        `      error: ${entry.errorChanged.baseline ?? "none"} -> ${entry.errorChanged.candidate ?? "none"}`,
      );
    }
    for (const assertion of entry.assertions) {
      lines.push(`      ${assertion.movement} ${assertion.id}`);
      if (assertion.detail !== undefined) lines.push(`        ${assertion.detail}`);
    }
  }

  lines.push("");
  if (report.hasRegressions) {
    lines.push(
      `Regressions by capability: ${report.regressedCapabilities.join(", ")}`,
      `Regressions by agent:      ${report.regressedAgents.join(", ")}`,
      `Regressions by case:       ${report.regressedCases.join(", ")}`,
    );
  } else {
    lines.push("No regressions.");
  }
  return `${lines.join("\n")}\n`;
}
