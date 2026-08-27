/**
 * Evaluation case model (Distribution §16).
 *
 * A case evaluates one agent responsibility of the selected pack —
 * responsibility × agent implementation × evaluation suite — independently
 * from project Delivery: the runner materialises the case's fixture into a
 * throw-away sandbox project, lets a candidate implementation act, and then
 * judges what happened through two strictly separate channels:
 *
 * - deterministic assertions: mechanical checks over what observably
 *   happened (required graph output exists, forbidden mutation did not
 *   occur, structured output is valid, correct files changed);
 * - semantic dimensions: qualities that need judgement (clarity,
 *   alternative quality, contract fidelity, review usefulness). They are
 *   never decided deterministically and never folded into a pass/fail.
 */

/** What the runner observed about one candidate run in its sandbox. */
export interface Observation {
  /** Sandbox project root the candidate worked in. */
  readonly root: string;
  /** Sandbox-relative POSIX paths whose bytes changed, appeared or disappeared, sorted. */
  readonly changedFiles: readonly string[];
  /** Deterministic Project Graph revision before the candidate ran. */
  readonly revisionBefore: string;
  /** Deterministic Project Graph revision after the candidate ran. */
  readonly revisionAfter: string;
  /** Structured output the candidate returned, if any. */
  readonly output: unknown;
}

export interface AssertionResult {
  readonly passed: boolean;
  /** What was observed, for per-case output — filled on pass and fail alike. */
  readonly detail: string;
}

/** A mechanical check over an observation; never a quality judgement. */
export interface DeterministicAssertion {
  readonly id: string;
  readonly description: string;
  readonly check: (observation: Observation) => AssertionResult;
}

/**
 * A quality only judgement can decide. Dimensions are reported separately
 * from deterministic assertions and never contribute to an exit code or any
 * score.
 */
export interface SemanticDimension {
  readonly id: string;
  readonly question: string;
}

/**
 * A scripted candidate: a deterministic stand-in for one agent run. Cases
 * bundle a compliant `reference` candidate so the whole evaluation pipeline
 * runs before a model-backed candidate runner exists, plus violating
 * candidates proving each deterministic assertion detects its violation.
 */
export interface ScriptedCandidate {
  readonly description: string;
  /** Acts inside the sandbox and returns the candidate's structured output, if any. */
  readonly run: (root: string) => unknown;
}

/** A scripted candidate that must be caught by named deterministic assertions. */
export interface ViolationCandidate extends ScriptedCandidate {
  readonly id: string;
  /** Ids of the case's deterministic assertions this candidate must fail. */
  readonly breaks: readonly string[];
}

export interface EvalCase {
  readonly id: string;
  readonly title: string;
  /** The pack capability under evaluation; the pack supplies the agent. */
  readonly capability: string;
  /** The instruction a candidate implementation receives. */
  readonly instruction: string;
  /** Materialises the case's fixture into an empty sandbox project root. */
  readonly setup: (root: string) => void;
  readonly deterministic: readonly DeterministicAssertion[];
  readonly semantic: readonly SemanticDimension[];
  /** Compliant candidate replayed when no candidate runner is supplied. */
  readonly reference: ScriptedCandidate;
  /** Violating candidates; the repository tests replay them against `deterministic`. */
  readonly violations: readonly ViolationCandidate[];
}

/** A named set of evaluation cases, versioned with the component owning the responsibility. */
export interface EvalSuite {
  readonly name: string;
  readonly cases: readonly EvalCase[];
}

/** What a candidate runner is asked to do for one case. */
export interface CandidateTask {
  readonly caseId: string;
  readonly capability: string;
  readonly instruction: string;
  /** Sandbox project root to act in. */
  readonly root: string;
  /** The pack agent implementing the capability under evaluation. */
  readonly agent: {
    readonly key: string;
    /** Absolute path of the agent's prompt file. */
    readonly prompt: string;
    readonly skills: readonly string[];
  };
}

/**
 * Executes one case's task with the agent implementation under evaluation
 * and returns the candidate's structured output, if any. The default runner
 * replays each case's scripted `reference`; a model-backed runner plugs in
 * here in a later checkpoint.
 */
export type CandidateRunner = (task: CandidateTask) => unknown | Promise<unknown>;

export interface SemanticJudgement {
  readonly verdict: string;
  readonly rationale?: string;
}

/**
 * Judges one semantic dimension of one observation. No judge is configured
 * by default: semantic dimensions are then reported as unjudged, never
 * silently decided by the deterministic runner.
 */
export type SemanticJudge = (input: {
  readonly caseId: string;
  readonly dimension: SemanticDimension;
  readonly observation: Observation;
}) => SemanticJudgement | Promise<SemanticJudgement>;
