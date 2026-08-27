/**
 * A single structural or semantic problem found while loading project state.
 * `path` is the repository-relative or absolute file the problem was found in.
 */
export interface Problem {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

/**
 * The only error type the runtime throws for expected failures.
 * `problems` always carries at least one entry so callers can print every
 * problem found in one pass instead of the first one only.
 */
export class PactwrightError extends Error {
  readonly code: string;
  readonly problems: readonly Problem[];

  constructor(code: string, message: string, problems: readonly Problem[] = []) {
    super(message);
    this.name = "PactwrightError";
    this.code = code;
    this.problems = problems.length > 0 ? problems : [{ code, message }];
  }

  static fromProblems(code: string, problems: readonly Problem[]): PactwrightError {
    const summary =
      problems.length === 1
        ? formatProblem(problems[0]!)
        : `${problems.length} problems:\n${problems.map((p) => `  - ${formatProblem(p)}`).join("\n")}`;
    return new PactwrightError(code, summary, problems);
  }
}

export function formatProblem(problem: Problem): string {
  const where = problem.path === undefined ? "" : `${problem.path}: `;
  return `${where}${problem.message} [${problem.code}]`;
}
