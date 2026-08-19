import { PactwrightError, type Problem } from "./errors.js";
import { deriveLineages } from "./graph/lineage.js";
import { graphRevision } from "./graph/revision.js";
import { loadProject, type LoadProjectOptions } from "./loader.js";

/** `pactwright validate` result (Delivery Graph §21). */
export interface ValidationReport {
  readonly ok: boolean;
  /** Every problem found in one pass; empty when `ok`. */
  readonly problems: readonly Problem[];
  /** Present when `ok`: what was validated. */
  readonly summary?: {
    readonly nodes: number;
    readonly edges: number;
    readonly lineages: number;
    readonly revision: string;
  };
}

/**
 * Validates core Delivery Graph integrity and shared typed-edge integrity
 * through the one canonical loading path (config, lifecycle, lock, node
 * schemas, typed-edge registry, current-lineage ambiguity). Validation does
 * not require the lifecycle to be complete. Never throws for expected
 * failures: an unloadable or absent project is reported as problems.
 */
export function validateProject(options: LoadProjectOptions = {}): ValidationReport {
  try {
    const project = loadProject(options);
    const { nodes, edges } = project.graph;
    return {
      ok: true,
      problems: [],
      summary: {
        nodes: nodes.length,
        edges: edges.length,
        lineages: deriveLineages(nodes, edges).lineages.length,
        revision: graphRevision({ nodes, edges }),
      },
    };
  } catch (error) {
    if (!(error instanceof PactwrightError)) throw error;
    return { ok: false, problems: error.problems };
  }
}
