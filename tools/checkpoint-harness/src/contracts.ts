// T3-A: loads checkpoint contracts at a pinned definitions revision and
// prepares executable work (Task 3 research log §§4–6 and §12; Spec 00 §§2–4).
// Planning reads nothing but the definitions revision and the run
// configuration, calls no agent and records no progress.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, relative } from "node:path";
import { pipeline } from "node:stream/promises";

import { DirectedGraph } from "graphology";
import { dfsFromNode } from "graphology-traversal";
import { Ajv2020 } from "ajv/dist/2020.js";
import stringify from "safe-stable-stringify";
import { x as extract } from "tar";

import {
  anchors,
  githubSlug,
  loadCheckpointDir,
  proseText,
  type Contract,
  type Section,
  type Criterion,
  type Method,
} from "./checkpoint-contracts.js";

/**
 * Another repository an operational step runs in (T3.5 H3), at a pinned
 * revision, with the paths its procedure may change there; `path` makes a
 * directory of that revision the target's root, such as a fixture repository.
 */
export type OperationTarget = {
  repository: string;
  revision: string;
  path?: string;
  writable: string[];
};

/** The declared targets of operational steps; an undeclared step runs on the candidate. */
export type Operations = {
  targets: Record<string, OperationTarget>;
  steps: Record<string, string>;
};

/** The lineage of the run's own candidate, published for review. */
export const CANDIDATE = "candidate";

/**
 * The lineage a step's candidates belong to: its declared operation target,
 * or the run's candidate. Steps of one lineage build on each other.
 */
export const lineageOf = (step: { procedure?: { target?: { name: string } } }): string =>
  step.procedure?.target?.name ?? CANDIDATE;

export type RunConfig = {
  repository: { name: string; branch: string; expected_head: string };
  checkpoint: string;
  definitions: { revision: string; review: string };
  selection: { through: string };
  operations?: Operations;
  roles?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  budgets?: Record<string, unknown>;
};

/** One required result: a criterion's case checked by one binding (research log §6). */
export type VerificationTarget = {
  owner: string;
  criterion: string;
  caseId: string | null;
  method: Method;
  binding: string;
};

export type PlannedRequirement = { id: string; source: string[]; statement: string };
export type PlannedCriterion = Criterion & { id: string };
export type PlannedInput = { name: string; kind: "source" | "output"; ref: string };

export type ContractStep = {
  kind: "contract";
  id: string;
  requires: string[];
  inputs: PlannedInput[];
  uses: string[];
  outputs: { id: string; meaning: string }[];
  requirements: PlannedRequirement[];
  criteria: PlannedCriterion[];
  targets: VerificationTarget[];
  /**
   * Present for a reviewed operational step kept in prose (Spec 00 §4, Q67;
   * T3.5 H3): its reviewed text and hash. The text is its one requirement,
   * `PROCEDURE`; it has no outputs or own targets. It runs like a contract
   * step once every earlier step is accepted, and is accepted only with
   * recorded command and observation evidence.
   */
  procedure?: { hash: string; text: string; target?: OperationTarget & { name: string } };
};

/** Every planned step is executable: a contract, or an operational step in reviewed prose. */
export type PlannedStep = ContractStep;

/**
 * When the targets of an inherited criterion apply (T3.5 H1; Spec 00 §4):
 * to every step's evaluation, to the evaluations journaled after a step's
 * first acceptance, or only to the checkpoint exit evaluation. A target that
 * does not apply yet is pending, never waived: the exit evaluation applies
 * every inherited target.
 */
export type Applicability = { kind: "step" } | { kind: "after"; step: string } | { kind: "exit" };

/** The run model's reviewed applicability rules: checkpoint → inherited criterion → rule. */
export type ApplicabilityRules = Readonly<Record<string, Readonly<Record<string, Applicability>>>>;

export type PreparedRun = {
  checkpoint: string;
  runModel: string;
  repository: RunConfig["repository"];
  definitions: RunConfig["definitions"];
  selection: RunConfig["selection"];
  /** Every definition file planning read, by repository path, at the definitions revision. */
  sources: { path: string; sha256: string }[];
  /** Digest of `sources`: the governing definition set every acceptance is bound to. */
  definitionsDigest: string;
  /** Each step's definition identity: its contract file digest or its reviewed prose hash. */
  stepDefinitions: Record<string, string>;
  /** The selected step and its transitive prerequisites, in checkpoint order. */
  steps: PlannedStep[];
  /** Checkpoint-level requirements every step inherits. */
  inherited: {
    requirements: PlannedRequirement[];
    criteria: PlannedCriterion[];
    targets: VerificationTarget[];
    /** When each inherited criterion's targets apply; `step` unless a rule says otherwise. */
    applicability: Record<string, Applicability>;
  };
  /** Binding IDs the selection needs; no binding is resolved before T3-D. */
  unresolvedBindings: string[];
};

export type Preparation = { ok: true; plan: PreparedRun } | { ok: false; diagnostics: string[] };

export type PrepareOptions = {
  /** Git working tree holding the definitions revision. */
  repoRoot: string;
  /** Name used for the configuration in diagnostics. */
  configName?: string;
  /** The run model's applicability rules; an inherited criterion without one applies to every step. */
  applicability?: ApplicabilityRules;
};

type Evidence = readonly [string, ...string[]];

/**
 * An accepted output instance of a step, bound to that step's definition and
 * to the governing definition set (`PreparedRun.definitionsDigest`) it was
 * accepted under.
 */
export type AcceptedOutput = {
  step: string;
  output: string;
  definition: string;
  definitions: string;
  evidence: Evidence;
};

/** An accepted capability, bound like an output to the step that established it. */
export type CapabilityReceipt = {
  capability: string;
  step: string;
  definition: string;
  definitions: string;
  evidence: Evidence;
};

/** A step's current acceptance, bound like an output; it is how a step without outputs counts. */
export type AcceptedStep = { step: string; definition: string; definitions: string };

export type Acceptances = {
  outputs: readonly AcceptedOutput[];
  capabilities: readonly CapabilityReceipt[];
  /** Steps with a current acceptance; a step without outputs is done only with one. */
  steps?: readonly AcceptedStep[];
};

export type Eligibility =
  | { kind: "dispatch"; step: string }
  | { kind: "blocked"; step: string; unmet: string[] }
  | { kind: "selection-accepted" };

const METHODS: readonly Method[] = ["automated", "review", "approval"];

const schema: unknown = JSON.parse(
  readFileSync(new URL("./run-config.schema.json", import.meta.url), "utf8"),
);
const validateConfig = new Ajv2020({ allErrors: true }).compile<RunConfig>(
  schema as Record<string, unknown>,
);

export const sha256 = (bytes: string | Buffer): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/** Every target of a criterion: each method's bindings × each case, or one null case. */
function expand(owner: string, criteria: PlannedCriterion[]): VerificationTarget[] {
  return criteria.flatMap((c) =>
    METHODS.flatMap((method) =>
      (c.verify[method] ?? []).flatMap((binding) =>
        (c.cases ?? [null]).map((caseId) => ({ owner, criterion: c.id, caseId, method, binding })),
      ),
    ),
  );
}

const requirementsOf = (doc: Contract): PlannedRequirement[] =>
  Object.entries(doc.requirements ?? {}).map(([id, r]) => ({ id, ...r }));

const criteriaOf = (doc: Contract): PlannedCriterion[] =>
  Object.entries(doc.acceptance ?? {}).map(([id, c]) => ({ id, ...c }));

export async function exportRevision(
  repoRoot: string,
  revision: string,
  into: string,
): Promise<void> {
  const git = spawn("git", ["archive", revision], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = new Promise<number | null>((resolve) => git.on("close", resolve));
  await pipeline(git.stdout, extract({ cwd: into }));
  if ((await exited) !== 0) throw new Error(`git archive ${revision} failed`);
}

async function isCommit(repoRoot: string, revision: string): Promise<boolean> {
  const git = spawn("git", ["cat-file", "-e", `${revision}^{commit}`], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return new Promise((resolve) => git.on("close", (code) => resolve(code === 0)));
}

/**
 * Validates the run configuration and the checkpoint definitions at
 * `definitions.revision`, then plans the selected steps. The working tree is
 * never read or written; the revision is exported to a temporary directory
 * that is removed before returning.
 */
export async function prepareRun(config: unknown, options: PrepareOptions): Promise<Preparation> {
  const name = options.configName ?? "config";
  if (!validateConfig(config)) {
    return {
      ok: false,
      diagnostics: (validateConfig.errors ?? []).map(
        (e) => `${name}: schema: ${e.instancePath || "/"} ${e.message ?? ""}`,
      ),
    };
  }
  const checkpointPath = posix.normalize(config.checkpoint);
  if (checkpointPath.startsWith("../")) {
    return {
      ok: false,
      diagnostics: [`${name}: checkpoint escapes the repository: ${config.checkpoint}`],
    };
  }
  const { revision } = config.definitions;
  if (!(await isCommit(options.repoRoot, revision))) {
    return {
      ok: false,
      diagnostics: [`${name}: definitions.revision ${revision} is not a commit`],
    };
  }
  const root = mkdtempSync(join(tmpdir(), "pactwright-plan-"));
  try {
    await exportRevision(options.repoRoot, revision, root);
    return plan(root, { ...config, checkpoint: checkpointPath }, name, options.applicability ?? {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * The step IDs of a checkpoint at a definitions revision, in checkpoint
 * order, or null when the checkpoint does not load (T3.5 H3): the workflow's
 * default and validated `through` boundaries.
 */
export async function stepOrder(
  repoRoot: string,
  revision: string,
  checkpoint: string,
): Promise<string[] | null> {
  if (!(await isCommit(repoRoot, revision))) return null;
  const root = mkdtempSync(join(tmpdir(), "pactwright-plan-"));
  try {
    await exportRevision(repoRoot, revision, root);
    const dir = posix.dirname(posix.normalize(checkpoint));
    if (!existsSync(join(root, checkpoint))) return null;
    const loaded = loadCheckpointDir(root, dir, { skipSource: true });
    if (loaded.errors.length > 0 || !loaded.checkpoint) return null;
    return [...loaded.steps.keys(), ...Object.keys(loaded.checkpoint.prose_steps ?? {})].sort();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function plan(
  root: string,
  config: RunConfig,
  name: string,
  rules: ApplicabilityRules,
): Preparation {
  const dir = posix.dirname(config.checkpoint);
  if (!existsSync(join(root, config.checkpoint))) {
    return {
      ok: false,
      diagnostics: [`${name}: ${config.checkpoint} does not exist at the definitions revision`],
    };
  }
  // Crosswalk quotes are conversion evidence checked by `pnpm contracts:check`;
  // schema, references, coverage and reviewed prose hashes are still checked.
  const loaded = loadCheckpointDir(root, dir, { skipSource: true });
  const checkpoint = loaded.checkpoint;
  if (loaded.errors.length > 0 || !checkpoint) {
    return { ok: false, diagnostics: loaded.errors.map((e) => `${dir}: ${e}`) };
  }
  const cpid = checkpoint.checkpoint ?? "";
  const prose = checkpoint.prose_steps ?? {};
  const order = [...loaded.steps.keys(), ...Object.keys(prose)].sort();

  // Edges point from a step to its prerequisites. An operational step kept in
  // prose waits for every earlier step (Spec 00 §4).
  const graph = new DirectedGraph();
  for (const sid of order) graph.addNode(sid);
  for (const [sid, doc] of loaded.steps) {
    for (const req of doc.requires ?? []) graph.mergeEdge(sid, req);
  }
  for (const sid of Object.keys(prose)) {
    for (const earlier of order.filter((s) => s < sid)) graph.mergeEdge(sid, earlier);
  }
  // A step and every step it transitively requires.
  const closure = (sid: string): Set<string> => {
    const seen = new Set<string>();
    dfsFromNode(graph, sid, (node) => {
      seen.add(node);
    });
    return seen;
  };

  const diagnostics: string[] = [];
  for (const [sid, doc] of loaded.steps) {
    for (const [input, ref] of Object.entries(doc.inputs ?? {})) {
      const where = `${dir}/${sid}.yml/inputs/${input}`;
      const [head = "", tail = ""] = ref.includes("#") ? ref.split("#") : ref.split("/");
      if (ref.includes("#")) {
        const path = loaded.sources.get(head);
        if (!path) diagnostics.push(`${where}: undeclared source key ${head}`);
        else {
          const { numbers, slugs } = anchors(path);
          if (/^\d+$/.test(tail) ? !numbers.has(tail) : !slugs.has(tail)) {
            diagnostics.push(`${where}: ${ref} does not resolve to a heading`);
          }
        }
        continue;
      }
      const producer = loaded.steps.get(head);
      if (!producer) diagnostics.push(`${where}: ${ref} names unknown step ${head}`);
      else if (!(tail in (producer.outputs ?? {}))) {
        diagnostics.push(`${where}: ${ref} names unknown output ${tail} of ${head}`);
      } else if (head === sid || !closure(sid).has(head)) {
        diagnostics.push(`${where}: ${ref} is not an output of a prerequisite of ${sid}`);
      }
    }
  }
  for (const [sid, target] of Object.entries(config.operations?.steps ?? {})) {
    if (!(sid in prose)) {
      diagnostics.push(`${name}: operations.steps ${sid} is not an operational step of ${cpid}`);
    }
    if (target === CANDIDATE || !config.operations?.targets[target]) {
      diagnostics.push(`${name}: operations.steps ${sid} names no declared target: ${target}`);
    }
  }
  const through = config.selection.through;
  if (!graph.hasNode(through)) {
    diagnostics.push(`${name}: selection.through ${through} is not a step of ${cpid}`);
  }
  const inheritedCriteria = criteriaOf(checkpoint);
  const ownRules = rules[cpid] ?? {};
  for (const [criterion, rule] of Object.entries(ownRules)) {
    const where = `applicability ${cpid}/${criterion}`;
    if (!inheritedCriteria.some((c) => c.id === criterion)) {
      diagnostics.push(`${where}: not a criterion of ${dir}/checkpoint.yml`);
    }
    if (rule.kind === "after" && !graph.hasNode(rule.step)) {
      diagnostics.push(`${where}: ${rule.step} is not a step of ${cpid}`);
    }
  }
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const selected = closure(through);
  const steps: PlannedStep[] = order
    .filter((sid) => selected.has(sid))
    .map((sid): PlannedStep => {
      const doc = loaded.steps.get(sid);
      if (!doc) {
        const name = config.operations?.steps[sid];
        const target = name === undefined ? undefined : config.operations?.targets[name];
        return operational(
          sid,
          order,
          prose[sid] ?? "",
          loaded.sections,
          `${dir}.md`,
          target && name ? { name, ...target } : undefined,
        );
      }
      const criteria = criteriaOf(doc);
      return {
        kind: "contract",
        id: sid,
        requires: doc.requires ?? [],
        inputs: Object.entries(doc.inputs ?? {}).map(([input, ref]) => ({
          name: input,
          kind: ref.includes("#") ? "source" : "output",
          ref,
        })),
        uses: doc.uses ?? [],
        outputs: Object.entries(doc.outputs ?? {}).map(([id, meaning]) => ({ id, meaning })),
        requirements: requirementsOf(doc),
        criteria,
        targets: expand(sid, criteria),
      };
    });
  const inherited = {
    requirements: requirementsOf(checkpoint),
    criteria: inheritedCriteria,
    targets: expand(cpid, inheritedCriteria),
    applicability: Object.fromEntries(
      inheritedCriteria.map((c): [string, Applicability] => [
        c.id,
        ownRules[c.id] ?? { kind: "step" },
      ]),
    ),
  };
  const bindings = [
    ...inherited.targets,
    ...steps.flatMap((s) => (s.kind === "contract" ? s.targets : [])),
  ];

  const stepDefinitions: Record<string, string> = {};
  for (const sid of order) {
    const text = loaded.stepTexts.get(sid);
    stepDefinitions[sid] = text === undefined ? (prose[sid] ?? "") : sha256(text);
  }

  // Pin every file planning read: the checkpoint directory, its markdown,
  // the format schema and each declared source.
  const files = new Set<string>([
    ...readdirSync(join(root, dir)).map((f) => posix.join(dir, f)),
    `${dir}.md`,
    "docs/checkpoints/contract.schema.json",
    ...[...loaded.sources.values()].map((p) => relative(root, p).split("\\").join("/")),
  ]);
  const sources = [...files]
    .filter((p) => existsSync(join(root, p)))
    .sort()
    .map((path) => ({ path, sha256: sha256(readFileSync(join(root, path))) }));

  return {
    ok: true,
    plan: {
      checkpoint: cpid,
      runModel: checkpoint.run_model ?? "",
      repository: config.repository,
      definitions: config.definitions,
      selection: config.selection,
      sources,
      definitionsDigest: sha256(stringify(sources)),
      stepDefinitions,
      steps,
      inherited,
      unresolvedBindings: [...new Set(bindings.map((t) => t.binding))].sort(),
    },
  };
}

/**
 * A reviewed prose step as an operational contract step (Spec 00 §4; T3.5
 * H3): its reviewed section text is its one requirement, it requires every
 * earlier step and it declares no outputs or own targets.
 */
function operational(
  sid: string,
  order: readonly string[],
  hash: string,
  sections: ReadonlyMap<number, Section>,
  markdown: string,
  target?: OperationTarget & { name: string },
): ContractStep {
  const section = sections.get(Number(sid.slice(-2)));
  const text = section ? proseText(section) : "";
  const heading = section?.heading.replace(/^### /, "") ?? sid;
  return {
    kind: "contract",
    id: sid,
    requires: order.filter((s) => s < sid),
    inputs: [],
    uses: [],
    outputs: [],
    requirements: [
      { id: "PROCEDURE", source: [`${markdown}#${githubSlug(heading)}`], statement: text },
    ],
    criteria: [],
    targets: [],
    procedure: { hash, text, ...(target ? { target } : {}) },
  };
}

/**
 * The first selected step, in checkpoint order, that is not yet accepted, and
 * whether it can be dispatched. A step is accepted when every declared output
 * has an accepted instance bound to the step's current definition and to the
 * current governing definition set; a step without outputs, such as an
 * operational step, needs its own current acceptance. A record bound to an
 * older step definition or definition set is stale and counts as missing: a
 * change to an inherited requirement or a canonical source alters obligations
 * without touching any step file. Earlier steps are never skipped. Resources
 * and authority are checked at dispatch, not here.
 */
export function nextEligible(plan: PreparedRun, accepted: Acceptances): Eligibility {
  const current = (record: { step: string; definition: string; definitions: string }): boolean =>
    plan.stepDefinitions[record.step] === record.definition &&
    plan.definitionsDigest === record.definitions;
  for (const step of plan.steps) {
    const done =
      step.outputs.length === 0
        ? (accepted.steps ?? []).some((a) => a.step === step.id && current(a))
        : step.outputs.every(({ id }) =>
            accepted.outputs.some((o) => o.step === step.id && o.output === id && current(o)),
          );
    if (done) continue;
    const unmet = step.uses
      .filter((c) => !accepted.capabilities.some((r) => r.capability === c && current(r)))
      .map((c) => `uses ${c}: no current capability receipt`);
    return unmet.length > 0
      ? { kind: "blocked", step: step.id, unmet }
      : { kind: "dispatch", step: step.id };
  }
  return { kind: "selection-accepted" };
}

/** The checkpoint exit evaluation's step ID (T3.5 H1): it follows every step and has no producer. */
export const exitId = (plan: Pick<PreparedRun, "checkpoint">): string => `${plan.checkpoint}/exit`;

/** Whether the selection plans every step of the checkpoint, so its exit evaluation is due. */
export const coversCheckpoint = (plan: PreparedRun): boolean =>
  Object.keys(plan.stepDefinitions).every((sid) => plan.steps.some((s) => s.id === sid));

/**
 * The checkpoint exit evaluation as a contract step without own outputs,
 * requirements or targets (Spec 00 §4): it evaluates the integrated
 * candidate against every inherited target, none pending. The steps' own
 * targets stand on the integrated acceptance, an evaluation of the same
 * candidate that the exit requires to be current. Its definition is the
 * governing definition set.
 */
export function exitStep(plan: PreparedRun): ContractStep {
  return {
    kind: "contract",
    id: exitId(plan),
    requires: plan.steps.map((s) => s.id),
    inputs: [],
    uses: [],
    outputs: [],
    requirements: [],
    criteria: [],
    targets: [],
  };
}

/** A planned step by ID, the exit evaluation included. */
export function plannedContract(plan: PreparedRun, id: string): ContractStep | undefined {
  if (id === exitId(plan)) return exitStep(plan);
  return plan.steps.find((s) => s.id === id);
}

/** A step's definition identity: its contract digest, or the definition set for the exit. */
export const definitionOf = (plan: PreparedRun, id: string): string =>
  id === exitId(plan) ? plan.definitionsDigest : (plan.stepDefinitions[id] ?? "");
