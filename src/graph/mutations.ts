import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dump } from "js-yaml";
import { tempSibling } from "../atomic.js";
import { PactwrightError, type Problem } from "../errors.js";
import { decisionActor } from "../config/lifecycle.js";
import { actorPermitted, authorisedKinds } from "./authority.js";
import { assertEvidenceClosure } from "./closure.js";
import { closureFrom, closureFrontmatter, closureOf } from "./evidence-closure.js";
import { loadProject, type Project } from "../loader.js";
import { assertPackComplete } from "../pack/resolve.js";
import { edgeKey, type Edge } from "./edges.js";
import { mintNodeId, slugify } from "./ids.js";
import { graphRevision } from "./revision.js";
import { withRepositoryLock } from "./writer-lock.js";
import { checkNodeIdImmutability, parseNodeFile, type GraphNode } from "./nodes.js";
import { parseDecidedBy, type DecisionOutcome } from "./schema.js";
import {
  proposedSnapshot,
  snapshotOf,
  validateSnapshot,
  type ValidationScope,
} from "../validate/kernel.js";

/**
 * New canonical records to commit in one atomic mutation.
 *
 * Internal: this raw shape is produced only by the typed mutation functions
 * below (`createIntent`, `recordDecision`, `createBrief`, `createEvidence`).
 * It is deliberately not part of the public package surface — callers own
 * semantic content; the runtime owns node construction, serialisation and
 * destination paths.
 */
export interface GraphChange {
  readonly addNodes: readonly GraphNode[];
  readonly addEdges: readonly Edge[];
}

/** Internal: test-only hooks for the shared commit path. */
export interface CommitOptions {
  /** Runs after the atomic renames, before resulting-state validation. */
  readonly postWrite?: () => void;
}

function fail(code: string, message: string): never {
  throw new PactwrightError(code, message);
}

/** Serialises a node to Markdown + YAML frontmatter that `parseNodeFile` round-trips. */
export function serialiseNode(node: GraphNode): string {
  const front = dump(node.frontmatter, { lineWidth: -1 });
  return `---\n${front}---\n\n${node.body}\n`;
}

/** Serialises the shared typed-edge store in the `edges.yml` fixture shape. */
export function serialiseEdges(edges: readonly Edge[]): string {
  if (edges.length === 0) return "edges: []\n";
  const items = edges
    .map(
      (edge) => `  - source: ${edge.source}\n    type: ${edge.type}\n    target: ${edge.target}\n`,
    )
    .join("");
  return `edges:\n${items}`;
}

const COMMON_FIELDS = ["id", "type", "title", "created"] as const;

/**
 * Complete common validation of one proposed node, exactly as loading it
 * back will judge it: the destination path is derived from the id (never
 * caller-supplied), and the serialised file must round-trip through
 * `parseNodeFile` to the same common fields.
 */
function checkProposedNode(project: Project, node: GraphNode): readonly Problem[] {
  const canonical = join(project.paths.nodesDir, `${node.id}.md`);
  if (node.path !== canonical) {
    return [
      {
        code: "invalid-path",
        message: `node "${node.id}" must be committed to ${canonical}; committed paths are derived from the id, never supplied`,
        path: node.path,
      },
    ];
  }
  const parsed = parseNodeFile(serialiseNode(node), canonical);
  if (parsed.value === undefined) return parsed.problems;
  const problems: Problem[] = [];
  for (const field of COMMON_FIELDS) {
    if (parsed.value[field] !== node[field]) {
      problems.push({
        code: "field-mismatch",
        message: `node "${node.id}" ${field} does not round-trip: frontmatter carries "${String(parsed.value[field])}" but the node declares "${String(node[field])}"`,
        path: canonical,
      });
    }
  }
  return problems;
}

/**
 * Internal shared mutation path (Implementation Guide, "Filesystem
 * mutation"): plan → validate the complete proposed state against the
 * current graph state → write atomically → validate the resulting state.
 *
 * The whole sequence runs under the repository writer lock (§10). Each typed
 * mutation takes the lock *before* it loads, so the snapshot it plans against
 * cannot go stale underneath it; the lock taken here is the re-entrant inner
 * take that covers a direct caller.
 *
 * Before anything else the selected agent pack is resolved and checked
 * against the required capabilities (Distribution §7): an incomplete or
 * unresolvable pack throws here, before any validation or write.
 *
 * Validation covers the full common node rules (derived path, id shape,
 * frontmatter round-trip, body) plus type schemas, the typed-edge registry,
 * global lineage constraints and id immutability. Every file is written to a
 * temporary sibling and renamed into place, node files first, `edges.yml`
 * last. After the writes the resulting repository state is reloaded through
 * the canonical loader; if it fails, the new node files are removed and
 * `edges.yml` is restored, so no partial graph state remains.
 */
export function commitGraphChange(
  project: Project,
  change: GraphChange,
  options: CommitOptions = {},
): void {
  withRepositoryLock(project.paths.root, () => {
    commitLocked(project, change, options);
  });
}

function commitLocked(project: Project, change: GraphChange, options: CommitOptions): void {
  assertPackComplete(project);
  const problems: Problem[] = [];
  const nodes = [...project.graph.nodes];
  const seenIds = new Set(nodes.map((node) => node.id));
  for (const node of change.addNodes) {
    if (seenIds.has(node.id)) {
      problems.push({
        code: "duplicate-id",
        message: `node id "${node.id}" already exists in the graph`,
        path: node.path,
      });
      continue;
    }
    seenIds.add(node.id);
    nodes.push(node);
    problems.push(...checkProposedNode(project, node));
  }
  const edges = [...project.graph.edges];
  const seenEdges = new Set(edges.map(edgeKey));
  for (const edge of change.addEdges) {
    const key = edgeKey(edge);
    if (seenEdges.has(key)) {
      problems.push({ code: "duplicate-edge", message: `edge ${key} already exists` });
      continue;
    }
    seenEdges.add(key);
    edges.push(edge);
  }

  // The complete proposed state, judged by the one kernel before any write
  // (Core §57, Checkpoint 1 Step 9). The mutation gate used to run only the
  // structural checks — Decision authority lived inside `recordDecision` and
  // closure inside `createEvidence` — so it could admit a graph that
  // `validate` rejects.
  problems.push(
    ...validateSnapshot(
      proposedSnapshot(snapshotOf(project), change),
      new Set<ValidationScope>(["structural", "authority", "execution"]),
    ),
    ...checkNodeIdImmutability(project.graph.nodes, nodes),
  );
  if (problems.length > 0) throw PactwrightError.fromProblems("mutation-invalid", problems);

  // Compare-and-swap, now *inside* the writer lock (§10). The lock is what
  // makes the sequence atomic; this stays as the cheap second check, so a
  // caller that planned against a stale snapshot — one loaded before another
  // process released the lock — still gets `concurrent-modification` rather
  // than overwriting its records in the wholesale edges.yml rewrite.
  const expected = graphRevision({ nodes: project.graph.nodes, edges: project.graph.edges });
  const fresh = loadProject({ root: project.paths.root });
  if (graphRevision({ nodes: fresh.graph.nodes, edges: fresh.graph.edges }) !== expected) {
    throw new PactwrightError(
      "concurrent-modification",
      "the graph changed since this mutation was planned; reload and retry",
    );
  }

  // path → content, edges.yml last so the links land only after the records.
  const previousEdges = readFileSync(project.paths.edges, "utf8");
  const writes: Array<{ path: string; content: string }> = [
    ...change.addNodes.map((node) => ({ path: node.path, content: serialiseNode(node) })),
    { path: project.paths.edges, content: serialiseEdges(edges) },
  ];
  const temps: string[] = [];
  const restore = (): void => {
    for (const node of change.addNodes) {
      try {
        unlinkSync(node.path);
      } catch {
        /* rollback is best effort */
      }
    }
    const temp = tempSibling(project.paths.edges);
    writeFileSync(temp, previousEdges, "utf8");
    renameSync(temp, project.paths.edges);
  };
  try {
    for (const write of writes) {
      const temp = tempSibling(write.path);
      writeFileSync(temp, write.content, "utf8");
      temps.push(temp);
    }
    writes.forEach((write, index) => {
      renameSync(temps[index]!, write.path);
      temps[index] = "";
    });
  } catch (error) {
    for (const temp of temps.filter((t) => t !== "")) {
      try {
        unlinkSync(temp);
      } catch {
        /* rollback is best effort */
      }
    }
    restore();
    throw error;
  }

  // Validate the resulting repository state; roll back if it does not load.
  try {
    options.postWrite?.();
    loadProject({ root: project.paths.root });
  } catch (error) {
    restore();
    if (error instanceof PactwrightError) {
      throw PactwrightError.fromProblems("resulting-state-invalid", error.problems);
    }
    throw error;
  }
}

/**
 * The closure block of the Evidence a correction supersedes (§45).
 *
 * Correcting what Evidence *says* does not reopen Delivery, and the run that
 * closed it has rightly been cleared, so the facts about that closure are
 * carried forward rather than reconstructed or dropped.
 */
function carriedClosure(project: Project, briefId: string): Record<string, unknown> | undefined {
  const current = project.graph.index
    .sourcesOf(briefId, "evidences", "evidence")
    .find((node) => project.graph.index.isCurrent(node.id));
  if (current === undefined) return undefined;
  const closure = closureOf(current);
  return typeof closure === "object" && closure !== null
    ? (closure as Record<string, unknown>)
    : undefined;
}

/** Today's date in UTC — deliberately timezone-independent, since `created` feeds the id hash. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function requireNode(project: Project, id: string, type: string): GraphNode {
  const node = project.graph.index.node(id);
  if (node === undefined || node.type !== type) {
    fail("unknown-node", `"${id}" is not an existing ${type} node`);
  }
  if (!project.graph.index.isCurrent(id)) {
    fail("superseded-node", `${type} "${id}" is superseded; only current records take new work`);
  }
  return node;
}

/** Current (unsuperseded) sources of `edgeType` edges into `target`. */
function currentSources(project: Project, target: string, edgeType: string): readonly string[] {
  const index = project.graph.index;
  return index
    .edgesTo(target, edgeType)
    .map((edge) => edge.source)
    .filter((id) => index.isCurrent(id));
}

interface NewNodeInput {
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly created?: string | undefined;
  /** Type-specific frontmatter; nested values round-trip through js-yaml. */
  readonly extraFront?: Readonly<Record<string, unknown>>;
  readonly taken?: ReadonlySet<string>;
}

function buildNode(project: Project, input: NewNodeInput): GraphNode {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length === 0) fail("invalid-title", "title must not be empty");
  if (body.length === 0) fail("missing-body", "node must have a Markdown body");
  const slug = slugify(title);
  if (slug === undefined) fail("invalid-title", `cannot derive a slug from title "${input.title}"`);
  const created = input.created ?? today();
  const taken = new Set([...project.graph.nodes.map((node) => node.id), ...(input.taken ?? [])]);
  const id = mintNodeId(input.type, slug, `${created}\n${title}\n${body}`, taken);
  return {
    id,
    type: input.type,
    title,
    created,
    frontmatter: { id, type: input.type, title, created, ...(input.extraFront ?? {}) },
    body,
    path: join(project.paths.nodesDir, `${id}.md`),
  };
}

export interface CreateIntentInput {
  readonly title: string;
  readonly body: string;
  readonly created?: string;
}

/**
 * Creates an Intent (Delivery Graph §6). Like every typed mutation, it loads
 * the current graph state itself at commit time, builds the node from that
 * state in one synchronous sequence and validates the complete proposed and
 * resulting states — a caller-held snapshot never reaches the filesystem.
 */
export function createIntent(root: string, input: CreateIntentInput): GraphNode {
  return withRepositoryLock(root, () => {
    const project = loadProject({ root });
    const intent = buildNode(project, { type: "intent", ...input });
    commitGraphChange(project, { addNodes: [intent], addEdges: [] });
    return intent;
  });
}

export interface RecordDecisionInput {
  readonly intentId: string;
  readonly outcome: DecisionOutcome;
  /** The actual acting actor, recorded verbatim in `decided_by`, e.g. "human:samir". */
  readonly decidedBy: string;
  readonly title?: string;
  readonly body: string;
  /** The canonical contract; required for proceed, forbidden otherwise (§8, §9). */
  readonly contract?: { readonly title: string; readonly body: string };
  readonly created?: string;
}

export interface RecordedDecision {
  readonly decision: GraphNode;
  readonly contract?: GraphNode;
}

const DECISION_TITLES: Readonly<Record<DecisionOutcome, string>> = {
  proceed: "Proceed with",
  reject: "Reject",
  defer: "Defer",
};

/**
 * Records a Decision resolving an Intent (Delivery Graph §8) and, for
 * proceed, creates the one canonical Contract it selects (§9, §19).
 * The acting actor must be authorised for approve-contract by lifecycle.yml;
 * authorisation is checked before anything is built or written. Re-deciding
 * supersedes the previous current decision and its selected contract (§15).
 * Current graph state is loaded at commit time; see `createIntent`.
 */
export function recordDecision(root: string, input: RecordDecisionInput): RecordedDecision {
  return withRepositoryLock(root, () => recordDecisionLocked(root, input));
}

function recordDecisionLocked(root: string, input: RecordDecisionInput): RecordedDecision {
  const project = loadProject({ root });
  const actor = parseDecidedBy(input.decidedBy);
  if (actor === undefined) {
    fail("invalid-actor", `decided_by "${input.decidedBy}" must be "<kind>:<name>"`);
  }
  const configured = decisionActor(project.lifecycle);
  if (!actorPermitted(configured, input.decidedBy)) {
    fail(
      "unauthorised-actor",
      `actor "${input.decidedBy}" is not authorised for approve-contract; lifecycle.yml authorises ${configured} (${authorisedKinds(configured).join("/")}) actors`,
    );
  }
  if ((input.outcome === "proceed") !== (input.contract !== undefined)) {
    fail(
      "invalid-outcome-input",
      input.outcome === "proceed"
        ? "proceed requires a contract; one canonical contract is created with the decision"
        : `${input.outcome} selects no contract`,
    );
  }
  const intent = requireNode(project, input.intentId, "intent");

  const decision = buildNode(project, {
    type: "decision",
    title: input.title ?? `${DECISION_TITLES[input.outcome]} ${intent.title}`,
    body: input.body,
    created: input.created,
    extraFront: { decided_by: input.decidedBy, outcome: input.outcome },
  });
  const addNodes: GraphNode[] = [decision];
  const addEdges: Edge[] = [{ source: decision.id, type: "resolves", target: intent.id }];

  let contract: GraphNode | undefined;
  if (input.contract !== undefined) {
    contract = buildNode(project, {
      type: "contract",
      title: input.contract.title,
      body: input.contract.body,
      created: input.created,
      taken: new Set([decision.id]),
    });
    addNodes.push(contract);
    addEdges.push({ source: decision.id, type: "selects", target: contract.id });
  }

  // Supersede the previous current records explicitly (§15).
  for (const previous of currentSources(project, intent.id, "resolves")) {
    addEdges.push({ source: decision.id, type: "supersedes", target: previous });
    const selected = project.graph.index
      .edgesFrom(previous, "selects")
      .map((edge) => edge.target)
      .filter((id) => project.graph.index.isCurrent(id));
    for (const oldContract of selected) {
      if (contract !== undefined) {
        addEdges.push({ source: contract.id, type: "supersedes", target: oldContract });
      } else {
        fail(
          "invalid-outcome-input",
          `intent "${intent.id}" has a current contract "${oldContract}"; a contract change needs a new proceed decision with a new canonical contract (§15)`,
        );
      }
    }
  }

  commitGraphChange(project, { addNodes, addEdges });
  return contract === undefined ? { decision } : { decision, contract };
}

export interface CreateBriefInput {
  readonly contractId: string;
  readonly title: string;
  readonly body: string;
  readonly created?: string;
}

/**
 * Creates the delivery Brief decomposing a Contract (§10). An existing
 * current brief is superseded explicitly (§15, brief change). Current graph
 * state is loaded at commit time; see `createIntent`.
 */
export function createBrief(root: string, input: CreateBriefInput): GraphNode {
  return withRepositoryLock(root, () => {
    const project = loadProject({ root });
    const contract = requireNode(project, input.contractId, "contract");
    const brief = buildNode(project, {
      type: "brief",
      title: input.title,
      body: input.body,
      created: input.created,
    });
    const addEdges: Edge[] = [{ source: brief.id, type: "decomposes", target: contract.id }];
    for (const previous of currentSources(project, contract.id, "decomposes")) {
      addEdges.push({ source: brief.id, type: "supersedes", target: previous });
    }
    commitGraphChange(project, { addNodes: [brief], addEdges });
    return brief;
  });
}

export interface CreateEvidenceInput {
  readonly briefId: string;
  readonly title: string;
  readonly body: string;
  readonly created?: string;
}

/**
 * Creates the Evidence record for a Brief (§12), completing the Delivery
 * lifecycle. Existing current evidence is superseded explicitly (§15,
 * evidence correction). Current graph state is loaded at commit time; see
 * `createIntent`.
 *
 * All five §53 closure preconditions are enforced *before* anything is
 * planned or written (Checkpoint 1 Step 7), so a refused closure leaves no
 * Evidence node and no partial `evidences` edge.
 */
export function createEvidence(root: string, input: CreateEvidenceInput): GraphNode {
  return withRepositoryLock(root, () => {
    const project = loadProject({ root });
    const check = assertEvidenceClosure(project, input.briefId);
    const brief = requireNode(project, input.briefId, "brief");
    // Written from the check that has just passed, never supplied by the
    // caller: verifying the §53 preconditions and recording them are one
    // operation (Core §§14, 53). Correcting Evidence after closure carries
    // the superseded record's block forward, because the run it describes is
    // the one that actually closed the Delivery.
    const built =
      check.state === undefined ? undefined : closureFrom(project.lifecycle.shape, check.state);
    const closure =
      built === undefined ? carriedClosure(project, input.briefId) : closureFrontmatter(built);
    const evidence = buildNode(project, {
      type: "evidence",
      title: input.title,
      body: input.body,
      created: input.created,
      ...(closure === undefined ? {} : { extraFront: { closure } }),
    });
    const addEdges: Edge[] = [{ source: evidence.id, type: "evidences", target: brief.id }];
    for (const previous of currentSources(project, brief.id, "evidences")) {
      addEdges.push({ source: evidence.id, type: "supersedes", target: previous });
    }
    commitGraphChange(project, { addNodes: [evidence], addEdges });
    return evidence;
  });
}
