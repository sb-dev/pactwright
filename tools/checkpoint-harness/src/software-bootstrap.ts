// T3-D: the software-bootstrap run model's review rubrics and binding
// registry (Task 3 research log §§6–7 and §12; Spec 00 §3). Rubrics are code
// constants pinned by digest: the common rubric governs every step's
// independent review, the adequacy rubric governs admission of a new
// verifier. A binding declares how one verifier ID is checked; it refers to
// contract targets by ID and never restates their requirements.

import { posix } from "node:path";

import stringify from "safe-stable-stringify";

import { sha256 } from "./contracts.js";

export type Rubric = { id: string; items: readonly string[]; pass: string };
export type PinnedRubric = Rubric & { digest: string };

const pin = (rubric: Rubric): PinnedRubric => ({ ...rubric, digest: sha256(stringify(rubric)) });

/** The common independent review every step receives, whatever its bindings (§7). */
export const COMMON_RUBRIC: PinnedRubric = pin({
  id: "software-bootstrap/common-review",
  items: [
    "Compliance: the candidate meets each requirement statement as its source clause defines it; no requirement is weakened, reinterpreted or skipped.",
    "Outputs: each declared output exists at its inventoried paths and has the meaning the contract declares.",
    "Test adequacy: the recorded verification exercises every criterion and case with assertions that would fail for a faulty implementation; a green exit alone is not evidence.",
    "Integration: the change works with its accepted inputs and the existing code and keeps inherited obligations.",
    "Scope: changes stay within the step and its permitted paths; nothing unrelated is changed.",
    "Architecture and simplicity: no duplicated truth or duplicated validation, speculative abstraction, unused extension point or unnecessary dependency.",
    "Security: no secret exposure, unsafe input handling, widened permission or code that could tamper with verification.",
    "Performance where the requirements or the change make it relevant.",
    "Graph work: record ownership, no duplicated truth and each relation's specific rules, when the step touches graph records.",
  ],
  pass: "Pass only when every subject is satisfied, every review target passed and no finding blocks. A blocking finding cites the unmet subject or target as its rule, with location, defect, correction and whether it rests on an executed observation or on inspection. Style preferences are optional findings and never block. A subject or target that cannot be judged from the workspace and the recorded evidence is not-assessed, never satisfied.",
});

/** Admission of a new or changed verifier before its results can count (§6). */
export const ADEQUACY_RUBRIC: PinnedRubric = pin({
  id: "software-bootstrap/verifier-adequacy",
  items: [
    "Each target of the binding has its own executed assertion, and that assertion would fail for an implementation that violates the criterion; a negative case feeds the failing input and checks the specific rejection.",
    "The verifier tests the criterion's given/when/then as written; it neither restates nor weakens it.",
    "The verifier reports only results it executed, only for its own binding, with no skip and no result copied from a file the candidate could have written.",
    "Fixtures are deterministic and need no network.",
    "The binding's files list every verifier file and fixture the command runs, so its approval pins all of them.",
    "Residual risk to weigh: code under test runs in the same container as the verifier and could write the report; the verifier must not hand it the report path or an easy way to forge a result.",
  ],
  pass: "Pass only when every target of the binding is adequately verified. A blocking finding cites the target as its rule and names the verifier file, the defect and the correction. A target whose adequacy cannot be judged is not-assessed, never satisfied.",
});

/**
 * An automated binding runs in contained workspaces. The subject `command`
 * runs once per target in its own fresh read-only workspace of the
 * candidate, with the target key on stdin. It observes the candidate as a
 * program, a separate process; no code under test runs in the subject's own
 * process, and it has no report path or other means to report a result. Its
 * exit status and stdout are the behaviour observed. The `judge` runs in a
 * workspace holding only the binding's `files`, so no candidate code runs
 * there: it reads the labelled runs as JSON on stdin, reduces each to the
 * criterion's primitive facts and writes the report to stdout.
 */
export type AutomatedBinding = {
  id: string;
  method: "automated";
  version: string;
  /** The subject: program and arguments run in the candidate workspace. */
  command: readonly string[];
  /** Program and arguments that decide each result from the subject's observations. */
  judge: readonly string[];
  /** Every verifier file and fixture the subject or judge runs; pinned on approval. */
  files: readonly string[];
  timeoutMs: number;
  /** Observation keys every reported result must carry. */
  observations: readonly string[];
};

export type ReviewBinding = {
  id: string;
  method: "review";
  version: string;
  /** Criterion-specific judgement the independent reviewer applies. */
  rubric: readonly string[];
};

export type ApprovalBinding = {
  id: string;
  method: "approval";
  version: string;
  /** Who may approve. */
  authority: string;
  /** The exact output or effect being authorised. */
  subject: string;
  /**
   * The external effect the approval authorises, if any (T3-E). It runs only
   * after the step is accepted, once, and is proved by a receipt.
   */
  effect?: { action: string; target: string };
};

export type Binding = AutomatedBinding | ReviewBinding | ApprovalBinding;

/**
 * The code-owned bindings of Checkpoint 1's product verifiers. None exists
 * yet: each is delivered and admitted with its capability (Spec 00 §5 T5), so
 * until then the runner pauses a step whose bindings are unregistered.
 */
export const BINDINGS: readonly Binding[] = [];

/** Bindings by ID, each with the digest of its definition. */
export type Registry = ReadonlyMap<string, { binding: Binding; digest: string }>;

/** Format 2's binding ID pattern (docs/checkpoints/contract.schema.json). */
const BINDING_ID = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

const relativePath = (path: string): boolean =>
  path !== "" &&
  !posix.isAbsolute(path) &&
  posix.normalize(path) === path &&
  !path.split("/").some((part) => part === ".." || part === "." || part === ".git");

const texts = (values: readonly string[]): boolean =>
  values.every((v) => v.trim() !== "") && new Set(values).size === values.length;

/** Validates code-owned bindings and pins each definition by digest. */
export function createRegistry(
  bindings: readonly Binding[],
): { ok: true; registry: Registry } | { ok: false; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const registry = new Map<string, { binding: Binding; digest: string }>();
  for (const binding of bindings) {
    const where = `binding ${binding.id}`;
    if (!BINDING_ID.test(binding.id)) diagnostics.push(`${where}: not a binding ID`);
    if (registry.has(binding.id)) diagnostics.push(`${where}: declared twice`);
    if (binding.version.trim() === "") diagnostics.push(`${where}: no version`);
    if (binding.method === "automated") {
      if ((binding.command[0] ?? "").trim() === "") diagnostics.push(`${where}: no command`);
      if ((binding.judge[0] ?? "").trim() === "") diagnostics.push(`${where}: no judge`);
      if (!binding.files.every(relativePath) || !texts(binding.files)) {
        diagnostics.push(`${where}: files must be distinct normalised relative paths`);
      }
      if (!Number.isSafeInteger(binding.timeoutMs) || binding.timeoutMs < 1) {
        diagnostics.push(`${where}: timeoutMs must be a positive integer`);
      }
      if (!texts(binding.observations)) diagnostics.push(`${where}: observations must be distinct`);
    } else if (binding.method === "review") {
      if (binding.rubric.length === 0 || !texts(binding.rubric)) {
        diagnostics.push(`${where}: no rubric`);
      }
    } else {
      if (binding.authority.trim() === "" || binding.subject.trim() === "") {
        diagnostics.push(`${where}: approval needs an authority and a subject`);
      }
      if (
        binding.effect &&
        (binding.effect.action.trim() === "" || binding.effect.target.trim() === "")
      ) {
        diagnostics.push(`${where}: an effect needs an action and a target`);
      }
    }
    registry.set(binding.id, { binding, digest: sha256(stringify(binding)) });
  }
  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, registry };
}

/**
 * The digest of each named, registered binding as a candidate would run it.
 * An automated binding's digest covers its definition and the `mode sha`
 * tree entry of each of its files (null when the candidate lacks it), so a
 * changed verifier file changes it. Review and approval bindings are their
 * definitions. Unregistered IDs are omitted.
 */
export function bindingDigests(
  registry: Registry,
  tree: ReadonlyMap<string, string>,
  ids: Iterable<string>,
): Record<string, string> {
  const digests: Record<string, string> = {};
  for (const id of [...new Set(ids)].sort()) {
    const entry = registry.get(id);
    if (!entry) continue;
    const { binding, digest } = entry;
    if (binding.method !== "automated") {
      digests[id] = digest;
      continue;
    }
    const files: Record<string, string | null> = {};
    for (const file of binding.files) files[file] = tree.get(file) ?? null;
    const identity = { definition: digest, files };
    digests[id] = sha256(stringify(identity));
  }
  return digests;
}
