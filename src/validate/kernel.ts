import { join } from "node:path";
import type { Problem } from "../errors.js";
import { decisionActor } from "../config/lifecycle.js";
import type { LockFile } from "../config/lock.js";
import { detectPackageManager, installedVersion } from "../config/package-manager.js";
import { composedRegistries } from "../extension/resolve.js";
import { actorPermitted, authorisedKinds } from "../graph/authority.js";
import { checkEvidenceClosure } from "../graph/closure.js";
import { checkClosureBlock } from "../graph/evidence-closure.js";
import { validateEdges } from "../graph/edge-schema.js";
import type { Edge } from "../graph/edges.js";
import { GraphIndex } from "../graph/graph-index.js";
import { lineagesOf, type Lineage } from "../graph/lineage.js";
import { validateRelationships } from "../graph/relationships.js";
import type { GraphNode } from "../graph/nodes.js";
import { isReconstructible, repositoryRevision } from "../graph/repository.js";
import { graphRevision } from "../graph/revision.js";
import { parseDecidedBy, validateNodes } from "../graph/schema.js";
import { executionFor, inShapePhase } from "../lifecycle/engine.js";
import { isGate, isPermittedTransition, stepNamed } from "../lifecycle/shape.js";
import { loadAllExecutionState, type ExecutionState } from "../lifecycle/state.js";
import { gateActor, gateSatisfied } from "../lifecycle/transition.js";
import type { Project } from "../loader.js";
import { isPathSource } from "../pack/locate.js";
import { resolveDesiredState } from "../pack/resolve.js";
import { RUNTIME_PACKAGE, runtimeVersion } from "../version.js";
import {
  asRuleProblem,
  asScopedProblem,
  ruleForRelationship,
  type RuleProblem,
  type ScopedProblem,
  type ValidationRuleId,
} from "./rules.js";

/**
 * One validation kernel (consolidation design §4).
 *
 * Seven entry points used to validate different subsets, and they disagreed:
 * `loadProject` checked structure only; `validateProject` checked structure
 * plus a handful of semantic rules; `commitGraphChange` validated nodes,
 * edges, lineages and id immutability, with Decision authority checked only
 * inside `recordDecision` and closure only inside `createEvidence`; the
 * adapter's record path loaded and wrote without checking anything. So a
 * graph could pass one gate and fail another, and the mutation gate could
 * admit state that `validate` rejects.
 *
 * The scopes are the only thing a caller chooses. Each rule lives in exactly
 * one of them.
 */
export const VALIDATION_SCOPES = [
  "structural",
  "authority",
  "execution",
  "environment",
  "replay",
] as const;
export type ValidationScope = (typeof VALIDATION_SCOPES)[number];

/**
 * An in-memory graph state: what is on disk, or a proposed state before a
 * write.
 *
 * It is a `Project` plus the execution documents, so a proposed snapshot can
 * be handed to the same closure and lifecycle derivation a loaded project is.
 */
export interface GraphSnapshot extends Project {
  /** Every run in the project, already parsed. */
  readonly executions: readonly ExecutionState[];
  /** Problems found while reading execution state, if any. */
  readonly executionProblems: readonly Problem[];
}

export interface ReplayCheck {
  readonly repositoryRevision: string;
  readonly projectGraphRevision: string;
}

/** The snapshot of a loaded project, reading its execution state once. */
export function snapshotOf(project: Project): GraphSnapshot {
  const { states, problems } = loadAllExecutionState(project.paths.root);
  return { ...project, executions: states, executionProblems: problems };
}

/**
 * The snapshot a mutation proposes: the loaded project with the change
 * merged in and the index rebuilt over it.
 *
 * This is what makes "validation should fail before canonical mutation where
 * possible" (Core §57) real for more than the structural rules: the kernel
 * judges the complete proposed state, not the state on disk.
 */
export function proposedSnapshot(
  snapshot: GraphSnapshot,
  change: { readonly addNodes: readonly GraphNode[]; readonly addEdges: readonly Edge[] },
): GraphSnapshot {
  const nodes = [...snapshot.graph.nodes, ...change.addNodes];
  const edges = [...snapshot.graph.edges, ...change.addEdges];
  return {
    ...snapshot,
    graph: { nodes, edges, index: GraphIndex.build(nodes, edges) },
  };
}

/**
 * Validates `snapshot` under the given scopes and returns every problem in
 * one pass. Read-only: it never repairs graph state as a side effect.
 */
export function validateSnapshot(
  snapshot: GraphSnapshot,
  scopes: ReadonlySet<ValidationScope>,
  replay?: ReplayCheck,
): readonly ScopedProblem[] {
  const problems: ScopedProblem[] = [];
  if (scopes.has("structural")) problems.push(...structural(snapshot));
  if (scopes.has("authority")) problems.push(...authority(snapshot));
  if (scopes.has("execution")) problems.push(...execution(snapshot));
  if (scopes.has("environment")) problems.push(...environment(snapshot));
  if (scopes.has("replay") && replay !== undefined)
    problems.push(...replayProvenance(snapshot, replay));
  return problems;
}

/* ---- structural: rules 1–8 and the declared relationship cardinality ---- */

function structural(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const registries = composedRegistries(snapshot.extensions);
  const { nodes, edges, index } = snapshot.graph;

  for (const problem of validateNodes(nodes, registries.nodes)) {
    problems.push(asRuleProblem(problem, "malformed-core-nodes"));
  }
  for (const problem of validateEdges(edges, nodes, registries.edges, snapshot.paths.edges)) {
    problems.push(asRuleProblem(problem, "invalid-core-relationships"));
  }
  for (const problem of validateRelationships(nodes, index, registries.nodes)) {
    problems.push(asRuleProblem(problem, ruleForRelationship(problem.nodeType)));
  }
  // Current-record cardinality (one current Decision per Intent, one current
  // Brief per Contract, one current Evidence per Brief) is derived over the
  // same index rather than rebuilt.
  for (const problem of lineagesOf(index).problems) {
    problems.push(
      asRuleProblem(problem, LINEAGE_RULES[problem.code] ?? "missing-required-lineage"),
    );
  }
  return problems;
}

const LINEAGE_RULES: Readonly<Record<string, ValidationRuleId>> = {
  "missing-contract": "missing-required-lineage",
  "unexpected-contract": "contradictory-current-records",
  "ambiguous-decision": "multiple-unsuperseded-records",
  "ambiguous-contract": "multiple-unsuperseded-records",
  "ambiguous-brief": "invalid-brief-lineage",
  "ambiguous-evidence": "invalid-evidence-lineage",
};

/* ---- authority: rule 13 ---- */

function authority(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const configured = decisionActor(snapshot.lifecycle);
  // The one authority table `recordDecision` and the lifecycle reducer use.
  // Rule 13 used to keep its own copy beside it.
  for (const node of snapshot.graph.nodes) {
    if (node.type !== "decision") continue;
    const raw = node.frontmatter["decided_by"];
    if (typeof raw !== "string") continue;
    if (parseDecidedBy(raw) === undefined) continue;
    if (actorPermitted(configured, raw)) continue;
    problems.push(
      asRuleProblem(
        {
          code: "unauthorised-actor",
          message: `decision "${node.id}" was decided by "${raw}" but lifecycle.yml authorises ${configured} (${authorisedKinds(configured).join("/")}) actors`,
          path: node.path,
        },
        "unauthorised-decision",
      ),
    );
  }
  return problems;
}

/* ---- execution: rules 10, 11, 12, 14, 15 ---- */

function execution(snapshot: GraphSnapshot): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const shape = snapshot.lifecycle.shape;
  const add = (rule: ValidationRuleId, code: string, message: string, path: string): void => {
    problems.push(asRuleProblem({ code, message, path }, rule));
  };
  for (const problem of snapshot.executionProblems) {
    problems.push(asRuleProblem(problem, "unresolved-shape-identity"));
  }

  for (const state of snapshot.executions) {
    const path = `${snapshot.paths.root}/.pactwright/execution/${state.brief}.yml`;

    // Rule 10 — the run must name the shape it is executing.
    if (state.shape !== shape.id) {
      add(
        "unresolved-shape-identity",
        "shape-identity-mismatch",
        `the run for brief "${state.brief}" is executing shape "${state.shape}" but the project's resolved shape is "${shape.id}"`,
        path,
      );
      continue;
    }

    // Rule 11 — every recorded step, and every route between consecutive
    // recorded steps, must exist in the shape. `visited` is chronology, so a
    // permitted corrective loop reads as delivery → review → delivery here
    // rather than as a `review → review` transition.
    const walked = [...state.visited, ...(state.currentStep ? [state.currentStep] : [])];
    for (const name of walked) {
      if (stepNamed(shape, name) === undefined) {
        add(
          "impossible-shape-transition",
          "unknown-step",
          `the run for brief "${state.brief}" records step "${name}", which the "${shape.id}" shape does not declare`,
          path,
        );
      }
    }
    for (let i = 0; i + 1 < walked.length; i += 1) {
      const from = walked[i]!;
      const to = walked[i + 1]!;
      if (stepNamed(shape, from) === undefined || stepNamed(shape, to) === undefined) continue;
      if (!isPermittedTransition(shape, from, to)) {
        add(
          "impossible-shape-transition",
          "undeclared-transition",
          `the run for brief "${state.brief}" moved from "${from}" to "${to}", which the "${shape.id}" shape does not declare`,
          path,
        );
      }
    }

    // Rule 14 — a Gate the run has moved past must record an *authorised*
    // resolution. Presence alone used to satisfy it, so
    // `resolved_by: agent:unauthorised` passed a human Gate.
    for (const name of new Set(state.visited)) {
      const step = stepNamed(shape, name);
      if (step === undefined || !isGate(step)) continue;
      if (gateSatisfied(step, state.gates)) continue;
      const recorded = state.gates[name];
      const required = gateActor(step);
      add(
        "unauthorised-gate",
        "unauthorised-gate-progression",
        recorded === undefined
          ? `the run for brief "${state.brief}" progressed past Gate "${name}" without recording the ${required} authority that permitted it`
          : `the run for brief "${state.brief}" progressed past Gate "${name}" on the authority of "${recorded.resolvedBy}", which is not ${required} authority`,
        path,
      );
    }

    // Rule 15 — a recorded iteration count must stay within its bound.
    for (const [route, taken] of Object.entries(state.iterations)) {
      const [from, to] = route.split("->", 2) as [string, string | undefined];
      const declared = shape.transitions.find(
        (transition) => transition.from === from && transition.to === to,
      );
      if (declared === undefined) {
        add(
          "impossible-shape-transition",
          "undeclared-route",
          `the run for brief "${state.brief}" counts iterations of route "${route}", which the "${shape.id}" shape does not declare`,
          path,
        );
        continue;
      }
      if (declared.maxIterations !== undefined && taken > declared.maxIterations) {
        add(
          "unbounded-corrective-loop",
          "iteration-bound-exceeded",
          `route "${route}" has run ${taken} times but policy permits ${declared.maxIterations}`,
          path,
        );
      }
    }
  }

  // Rule 12 — Evidence before a successful closing Review.
  //
  // Checked for every Evidence record, on `done` lineages as well as
  // delivering ones. `checkEvidenceRule` used to exit on its first line
  // unless the lineage was still delivering, so inserting an Evidence node
  // and edge into an unreviewed lineage made that lineage `done` and removed
  // it from the check — the third row of the review's R03 table.
  for (const evidence of snapshot.graph.nodes) {
    if (evidence.type !== "evidence") continue;
    for (const problem of checkClosureBlock(evidence, shape)) {
      problems.push(asRuleProblem(problem, "evidence-before-review"));
    }
  }
  for (const lineage of lineagesOf(snapshot.graph.index).lineages) {
    problems.push(...evidenceRule(snapshot, lineage));
  }
  return problems;
}

/**
 * Rule 12 for one lineage: a run standing at its closing step must pass the
 * §53 preconditions — the same check the mutation guard runs, reused rather
 * than reimplemented.
 */
function evidenceRule(snapshot: GraphSnapshot, lineage: Lineage): readonly RuleProblem[] {
  if (!inShapePhase(lineage) || lineage.brief === undefined) return [];
  const run = executionFor(snapshot, lineage);
  if (run === undefined || run.state.currentStep === undefined) return [];
  const step = stepNamed(snapshot.lifecycle.shape, run.state.currentStep);
  if (step?.kind !== "evidence") return [];
  const check = checkEvidenceClosure(snapshot, lineage.brief.id);
  if (check.ok) return [];
  return check.problems.map((problem) => asRuleProblem(problem, "evidence-before-review"));
}

/* ---- environment: Distribution §§12-13, no rule numbers ---- */

/**
 * The recorded environment must still describe the environment actually
 * installed and resolvable (Distribution §12: the two locks "must agree on
 * the installed Pactwright and package-backed component versions they both
 * identify"; §13 lists the check).
 *
 * This is a scope rather than a rule: Core §57 owns the graph contract and
 * says nothing about the package manager. Its problems therefore carry a
 * scope and no rule number.
 *
 * It lived in `config/agreement.ts` and only `sync` and `doctor` ran it, so
 * a mutation, a `validate` and a `lifecycle run` could each proceed against
 * an environment whose lock no longer described it — and then record an
 * `environment_lock_hash` in the replay base that named an environment that
 * was never used.
 */
function environment(snapshot: GraphSnapshot): readonly ScopedProblem[] {
  const problems: Problem[] = [];
  const root = snapshot.paths.root;
  const lockPath = snapshot.paths.lock;
  const lock = snapshot.lock;

  // 1. The lock must describe the runtime that is running, and the runtime
  //    the package manager installed. The two differ when a package was
  //    replaced without re-entering through it, which is the state
  //    `upgrade --finish` exists to leave behind.
  const running = runtimeVersion();
  if (lock.runtime.version !== running) {
    problems.push({
      code: "lock-runtime-mismatch",
      message: `lock records runtime ${lock.runtime.version} but the running runtime is ${running}; run "pactwright upgrade" or re-resolve the environment`,
      path: lockPath,
    });
  }
  const installedRuntime = installedVersion(root, RUNTIME_PACKAGE);
  if (installedRuntime !== undefined && installedRuntime !== lock.runtime.version) {
    problems.push({
      code: "lock-disagreement",
      message: `runtime "${RUNTIME_PACKAGE}": the Pactwright lock records ${lock.runtime.version} but the package manager installed ${installedRuntime}`,
      path: join(root, "package.json"),
    });
  }

  // 2. Every package-backed component the two locks both identify.
  problems.push(...packageAgreement(snapshot, lock));

  // 3. Re-resolving desired state must reproduce the recorded identities.
  const resolved = resolveDesiredState({ root, config: snapshot.config });
  if (resolved.value === undefined) {
    problems.push(...resolved.problems);
  } else {
    problems.push(...compareLocks(lock, resolved.value.lock, lockPath));
  }
  return problems.map((problem) => asScopedProblem(problem, "environment"));
}

function packageAgreement(snapshot: GraphSnapshot, lock: LockFile): readonly Problem[] {
  const problems: Problem[] = [];
  const root = snapshot.paths.root;
  const manifestPath = join(root, "package.json");

  // Whether a package manager can be determined is `doctor`'s story, not
  // agreement's: agreement needs the installed versions, which are on disk
  // either way. What the detection is used for is the remediation — naming
  // the manager the project actually uses. It used to be computed and
  // dropped on the floor.
  const manager = detectPackageManager(root).value?.name;
  const reinstall =
    manager === undefined ? "reinstall the dependencies" : `run "${manager} install"`;

  // Only components the *two locks both identify* can disagree. A
  // path-sourced pack or extension is not package-backed: the package
  // manager never resolved it, so a same-named package in node_modules is a
  // different component, not a mismatch.
  const expectations: Array<{
    readonly name: string;
    readonly version: string;
    readonly what: string;
  }> = [];
  const selected = snapshot.config.agentPack;
  if (selected !== undefined && !isPathSource(selected.source)) {
    expectations.push({
      name: lock.agentPack.name,
      version: lock.agentPack.version,
      what: "agent pack",
    });
  }
  for (const id of Object.keys(lock.extensions).sort()) {
    const entry = lock.extensions[id]!;
    const configured = snapshot.config.extensions[id];
    if (configured !== undefined && isPathSource(configured.source)) continue;
    expectations.push({ name: entry.package, version: entry.version, what: `extension "${id}"` });
  }

  for (const expected of expectations) {
    const installed = installedVersion(root, expected.name);
    // Absent from the project's own tree is not a disagreement. A package
    // source resolves like a dependency of the project *and then* like a
    // dependency of the runtime (`pack/locate.ts`), which is how
    // `@pactwright/standard` is found after one `pnpm add -D pactwright` —
    // so a legitimately resolved pack often has no manifest under the
    // project root at all. A component resolvable from neither place is
    // already reported by desired-state resolution below, and a resolvable
    // one at the wrong version is already reported by `compareLocks`, so
    // nothing escapes through here.
    if (installed === undefined) continue;
    if (installed !== expected.version) {
      problems.push({
        code: "lock-disagreement",
        message: `${expected.what} "${expected.name}": the Pactwright lock records ${expected.version} but the package manager installed ${installed}; ${reinstall}`,
        path: manifestPath,
      });
    }
  }
  return problems;
}

function compareLocks(recorded: LockFile, resolved: LockFile, path: string): readonly Problem[] {
  const problems: Problem[] = [];
  const drift = (what: string, was: string | undefined, now: string | undefined): void => {
    if (was === now) return;
    problems.push({
      code: "lock-drift",
      message: `${what}: lock records ${was ?? "nothing"} but the installed environment resolves to ${now ?? "nothing"}`,
      path,
    });
  };

  if (recorded.agentPack.name !== resolved.agentPack.name) {
    drift("agent pack name", recorded.agentPack.name, resolved.agentPack.name);
  }
  drift("agent pack version", recorded.agentPack.version, resolved.agentPack.version);
  drift("agent pack hash", recorded.agentPack.hash, resolved.agentPack.hash);

  for (const [what, was, now] of [
    ["agent", recorded.agents, resolved.agents],
    ["skill", recorded.skills, resolved.skills],
  ] as const) {
    for (const key of new Set([...Object.keys(was), ...Object.keys(now)]).values()) {
      drift(`${what} "${key}" hash`, was[key], now[key]);
    }
  }

  for (const id of new Set([
    ...Object.keys(recorded.extensions),
    ...Object.keys(resolved.extensions),
  ]).values()) {
    const was = recorded.extensions[id];
    const now = resolved.extensions[id];
    drift(`extension "${id}" version`, was?.version, now?.version);
    drift(`extension "${id}" hash`, was?.hash, now?.hash);
  }
  return problems;
}

/* ---- replay: rule 17 ---- */

function replayProvenance(snapshot: GraphSnapshot, replay: ReplayCheck): readonly RuleProblem[] {
  const problems: RuleProblem[] = [];
  const add = (code: string, message: string): void => {
    problems.push(
      asRuleProblem({ code, message, path: snapshot.paths.root }, "replay-provenance-mismatch"),
    );
  };
  // A `+sha256:` identity records what was delivered but is not
  // reconstructible from the commit alone. Pinned replay fails explicitly
  // rather than resolving the commit and calling it equivalent (Core §56,
  // Principle 18); ordinary closure does not need reconstruction, so it is
  // unaffected.
  if (!isReconstructible(replay.repositoryRevision)) {
    add(
      "unreconstructible-repository-revision",
      `replay requires repository revision "${replay.repositoryRevision}", which records working-tree state the commit alone cannot reconstruct`,
    );
  }
  const actual = repositoryRevision(snapshot.paths.root).id;
  if (actual !== replay.repositoryRevision) {
    add(
      "repository-revision-mismatch",
      `replay requires repository revision "${replay.repositoryRevision}" but the repository is at "${actual}"`,
    );
  }
  const derived = graphRevision({
    nodes: snapshot.graph.nodes,
    edges: snapshot.graph.edges,
  });
  if (derived !== replay.projectGraphRevision) {
    add(
      "graph-revision-mismatch",
      `the recorded repository state derives project graph revision "${derived}", not the recorded "${replay.projectGraphRevision}"`,
    );
  }
  return problems;
}
