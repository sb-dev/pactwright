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
  loadCheckpointDir,
  type Contract,
  type Criterion,
  type Method,
} from "./checkpoint-contracts.js";

export type RunConfig = {
  repository: { name: string; branch: string; expected_head: string };
  checkpoint: string;
  definitions: { revision: string; review: string };
  selection: { through: string };
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
};

/** A reviewed unconverted step: planned, never dispatched (Spec 00 §4). */
export type ProseStep = { kind: "prose"; id: string; reviewedHash: string };

export type PlannedStep = ContractStep | ProseStep;

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

export type Acceptances = {
  outputs: readonly AcceptedOutput[];
  capabilities: readonly CapabilityReceipt[];
};

export type Eligibility =
  | { kind: "dispatch"; step: string }
  | { kind: "unconverted"; step: string }
  | { kind: "blocked"; step: string; unmet: string[] }
  | { kind: "selection-accepted" };

const METHODS: readonly Method[] = ["automated", "review", "approval"];

const schema: unknown = JSON.parse(
  readFileSync(new URL("./run-config.schema.json", import.meta.url), "utf8"),
);
const validateConfig = new Ajv2020({ allErrors: true }).compile<RunConfig>(
  schema as Record<string, unknown>,
);

const sha256 = (bytes: string | Buffer): string =>
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

async function exportRevision(repoRoot: string, revision: string, into: string): Promise<void> {
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
    return plan(root, { ...config, checkpoint: checkpointPath }, name);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function plan(root: string, config: RunConfig, name: string): Preparation {
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

  // Edges point from a step to its prerequisites. An unconverted step waits
  // for every earlier step (Spec 00 §4).
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
  const through = config.selection.through;
  if (!graph.hasNode(through)) {
    diagnostics.push(`${name}: selection.through ${through} is not a step of ${cpid}`);
  }
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const selected = closure(through);
  const steps: PlannedStep[] = order
    .filter((sid) => selected.has(sid))
    .map((sid): PlannedStep => {
      const doc = loaded.steps.get(sid);
      if (!doc) return { kind: "prose", id: sid, reviewedHash: prose[sid] ?? "" };
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
  const inheritedCriteria = criteriaOf(checkpoint);
  const inherited = {
    requirements: requirementsOf(checkpoint),
    criteria: inheritedCriteria,
    targets: expand(cpid, inheritedCriteria),
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
 * The first selected step, in checkpoint order, that is not yet accepted, and
 * whether it can be dispatched. A step is accepted when every declared output
 * has an accepted instance bound to the step's current definition and to the
 * current governing definition set. A record bound to an older step definition
 * or definition set is stale and counts as missing: a change to an inherited
 * requirement or a canonical source alters obligations without touching any
 * step file. Earlier steps are never skipped. Resources and authority are
 * checked at dispatch, not here.
 */
export function nextEligible(plan: PreparedRun, accepted: Acceptances): Eligibility {
  const current = (record: { step: string; definition: string; definitions: string }): boolean =>
    plan.stepDefinitions[record.step] === record.definition &&
    plan.definitionsDigest === record.definitions;
  for (const step of plan.steps) {
    if (step.kind === "prose") return { kind: "unconverted", step: step.id };
    const done = step.outputs.every(({ id }) =>
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
