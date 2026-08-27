import { rmSync } from "node:fs";
import { agentFor, type ResolvedPack } from "../pack/resolve.js";
import { runtimeVersion } from "../version.js";
import type { CandidateRunner, EvalCase, EvalSuite, Observation, SemanticJudge } from "./case.js";
import { createSandbox, diffSnapshots, sandboxRevision, snapshotFiles } from "./sandbox.js";

export interface DeterministicResult {
  readonly id: string;
  readonly description: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface SemanticResult {
  readonly id: string;
  readonly question: string;
  readonly judged: boolean;
  readonly verdict?: string;
  readonly rationale?: string;
  /** Why the dimension was not judged. */
  readonly reason?: string;
}

export interface EvalCaseResult {
  readonly id: string;
  readonly title: string;
  readonly capability: string;
  /** The pack agent key that implemented the capability, when the pack provides it. */
  readonly agent?: string;
  /** The case could not be evaluated (missing capability, candidate error). */
  readonly error?: string;
  readonly deterministic: readonly DeterministicResult[];
  /** Reported separately from the deterministic results, never merged or scored. */
  readonly semantic: readonly SemanticResult[];
}

/**
 * One evaluation run: per-case, per-assertion and per-dimension results
 * only. Deliberately no aggregate quality score (Distribution §16); the
 * report is a generated artefact, never Project Graph state.
 */
export interface EvalReport {
  readonly suite: string;
  readonly runtime: string;
  readonly pack: {
    readonly name: string;
    readonly version: string;
    readonly hash: string;
  };
  readonly cases: readonly EvalCaseResult[];
}

export interface EvalOptions {
  /** The agent pack supplying the implementation being evaluated. */
  readonly pack: ResolvedPack;
  readonly suite: EvalSuite;
  /** Overrides each case's scripted reference candidate (model-backed runs plug in here). */
  readonly candidate?: CandidateRunner;
  /** Judges semantic dimensions; absent means they are reported unjudged. */
  readonly judge?: SemanticJudge;
  /** Directory sandboxes are created under; defaults to the OS temp directory. */
  readonly workDir?: string;
  /**
   * Per-case candidate deadline in ms; `undefined` disables. Scripted
   * reference candidates are synchronous, so only model-backed runners need
   * this. On timeout the case is reported as an error and its sandbox is
   * removed immediately; a still-running candidate writes into the void.
   */
  readonly candidateTimeoutMs?: number;
  /** Per-dimension judge deadline in ms; `undefined` disables. */
  readonly judgeTimeoutMs?: number;
}

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

async function withTimeout<T>(work: Promise<T>, ms: number | undefined, label: string): Promise<T> {
  if (ms === undefined) return work;
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        // The timer stays referenced so the deadline fires even when the
        // hung work holds nothing else on the event loop; it is cleared as
        // soon as the race settles.
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void work.catch(() => {}); // the losing promise must not become an unhandled rejection
  }
}

async function runCase(options: EvalOptions, evalCase: EvalCase): Promise<EvalCaseResult> {
  const base = { id: evalCase.id, title: evalCase.title, capability: evalCase.capability };
  const agent = agentFor(options.pack, evalCase.capability);
  if (agent === undefined) {
    return {
      ...base,
      error: `pack "${options.pack.manifest.name}@${options.pack.manifest.version}" does not provide capability "${evalCase.capability}"; the case was not evaluated`,
      deterministic: [],
      semantic: [],
    };
  }
  const withAgent = { ...base, agent: agent.key };
  let root: string | undefined;
  try {
    root = createSandbox(options.pack, options.workDir);
    evalCase.setup(root);
    const filesBefore = snapshotFiles(root);
    const revisionBefore = sandboxRevision(root);

    let output: unknown;
    try {
      const run: CandidateRunner =
        options.candidate ?? ((task) => evalCase.reference.run(task.root));
      output = await withTimeout(
        Promise.resolve(
          run({
            caseId: evalCase.id,
            capability: evalCase.capability,
            instruction: evalCase.instruction,
            root,
            agent,
          }),
        ),
        options.candidateTimeoutMs,
        "candidate",
      );
    } catch (error) {
      return {
        ...withAgent,
        error: `candidate failed: ${message(error)}`,
        deterministic: [],
        semantic: [],
      };
    }

    const observation: Observation = {
      root,
      changedFiles: diffSnapshots(filesBefore, snapshotFiles(root)),
      revisionBefore,
      revisionAfter: sandboxRevision(root),
      output,
    };

    const deterministic = evalCase.deterministic.map((assertion) => {
      try {
        const result = assertion.check(observation);
        return {
          id: assertion.id,
          description: assertion.description,
          passed: result.passed,
          detail: result.detail,
        };
      } catch (error) {
        return {
          id: assertion.id,
          description: assertion.description,
          passed: false,
          detail: `assertion threw: ${message(error)}`,
        };
      }
    });

    const semantic: SemanticResult[] = [];
    for (const dimension of evalCase.semantic) {
      const entry = { id: dimension.id, question: dimension.question };
      if (options.judge === undefined) {
        semantic.push({
          ...entry,
          judged: false,
          reason:
            "no semantic judge configured; semantic quality is never decided deterministically",
        });
        continue;
      }
      try {
        const judgement = await withTimeout(
          Promise.resolve(options.judge({ caseId: evalCase.id, dimension, observation })),
          options.judgeTimeoutMs,
          "judge",
        );
        semantic.push({
          ...entry,
          judged: true,
          verdict: judgement.verdict,
          ...(judgement.rationale === undefined ? {} : { rationale: judgement.rationale }),
        });
      } catch (error) {
        semantic.push({ ...entry, judged: false, reason: `judge failed: ${message(error)}` });
      }
    }

    return { ...withAgent, deterministic, semantic };
  } catch (error) {
    // Sandbox creation, case setup or observation building failed: the
    // failure is data in the report, never a thrown run (Distribution §16).
    return {
      ...withAgent,
      error: `case failed: ${message(error)}`,
      deterministic: [],
      semantic: [],
    };
  } finally {
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  }
}

/**
 * Runs a suite against a resolved pack, one throw-away sandbox per case.
 * Never throws for a failing case: failures are data in the report.
 */
export async function runEval(options: EvalOptions): Promise<EvalReport> {
  const cases: EvalCaseResult[] = [];
  for (const evalCase of options.suite.cases) cases.push(await runCase(options, evalCase));
  return {
    suite: options.suite.name,
    runtime: runtimeVersion(),
    pack: {
      name: options.pack.manifest.name,
      version: options.pack.manifest.version,
      hash: options.pack.hashes.pack,
    },
    cases,
  };
}

/**
 * Whether every case was evaluated and every deterministic assertion
 * passed — the CLI's exit-code gate. This is not a quality score: semantic
 * dimensions never enter it, and no aggregate is calculated anywhere.
 */
export function evalPassed(report: EvalReport): boolean {
  return report.cases.every(
    (entry) => entry.error === undefined && entry.deterministic.every((a) => a.passed),
  );
}
