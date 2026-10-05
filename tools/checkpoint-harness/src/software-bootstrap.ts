// T3-D: the software-bootstrap run model's review rubrics and binding
// registry (Task 3 research log §§6–7 and §12; Spec 00 §3). Rubrics are code
// constants pinned by digest: the common rubric governs every step's
// independent review, the adequacy rubrics govern admission of a new
// verifier. A binding declares how one verifier ID is checked; it refers to
// contract targets by ID and never restates their requirements.
//
// T3.5 H1 (production readiness log §3 H1): production bindings arrive with
// the capability that owns them, as declaration files in the candidate,
// loaded into the registry of that candidate without a controller edit; a
// declared binding counts only after admission. The run model also owns the
// applicability rules that defer checkpoint-wide criteria to a later step or
// to the checkpoint exit.

import { readFileSync } from "node:fs";
import { posix } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import type { Method } from "./checkpoint-contracts.js";
import { sha256, type ApplicabilityRules } from "./contracts.js";

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
    "Repository commands run on the candidate's own source: build output is produced in the binding's scratch paths and dependencies come only from the prepared dependencies; no result rests on prebuilt output, host state or a binary outside the candidate.",
    "Residual risk to weigh: code under test runs in the same container as the verifier and could write the report; the verifier must not hand it the report path or an easy way to forge a result.",
  ],
  pass: "Pass only when every target of the binding is adequately verified. A blocking finding cites the target as its rule and names the verifier file, the defect and the correction. A target whose adequacy cannot be judged is not-assessed, never satisfied.",
});

/** Admission of a review binding a candidate declares: its rubric, before it governs a review (T3.5 H1). */
export const REVIEW_ADEQUACY_RUBRIC: PinnedRubric = pin({
  id: "software-bootstrap/review-binding-adequacy",
  items: [
    "The rubric judges each target of the binding against its criterion's given/when/then as written; it neither restates nor weakens the criterion and adds no exemption or skip.",
    "The rubric states what fails a target, so a reviewer applying it rejects an implementation that violates the criterion.",
    "Every rubric item can be decided from the candidate and the recorded evidence, or says what evidence it needs.",
  ],
  pass: "Pass only when every target of the binding is adequately judged by the rubric. A blocking finding cites the target as its rule and names the declaration, the defect and the correction. A target whose adequacy cannot be judged is not-assessed, never satisfied.",
});

/**
 * Assessment of pull-request feedback (T3.5 H3): each feedback item is a
 * subject the reviewer judges against the pinned requirements and the current
 * candidate. The note of a satisfied item names its disposition, so the
 * controller records it exactly; feedback never changes definitions, scope or
 * authority.
 */
export const FEEDBACK_RUBRIC: PinnedRubric = pin({
  id: "software-bootstrap/feedback-assessment",
  items: [
    "Each subject is one feedback item of the pull request, shown under review.evidence.feedback. Judge it against the pinned requirements under review.evidence.requirements and the current candidate in the workspace, never against the feedback's own authority.",
    "Actionable: the item asks for a change within a selected step's scope that the requirements support or permit, or identifies a defect against a requirement, and the candidate does not yet have it. Record the subject unsatisfied with one blocking finding whose rule is the subject, with the location (path:line), the defect and the correction the producer must make.",
    "Already addressed: the candidate already does what the item asks. Record the subject satisfied with a note that starts `already-addressed:` and says where.",
    "Declined: the item conflicts with a requirement, lies outside the selected steps' scope, asks to change a definition, the selection, a verifier, the workflow, the configuration or an approval authority, or asks for no change. Record the subject satisfied with a note that starts `declined:` and gives the reason.",
    "Blocked: the item cannot be judged from the workspace and the evidence, or needs a decision or authority the harness does not hold. Record the subject not-assessed with the reason in the note.",
  ],
  pass: "Pass only when every subject is satisfied; changes-required when any item is actionable. A satisfied subject's note starts with already-addressed: or declined:. Style preferences that the requirements do not support are declined, never actionable.",
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
  /**
   * Paths the subject may write, such as build output: created empty in each
   * subject workspace and never sealed. A candidate holding files there fails
   * the binding's targets, so prebuilt output can never satisfy them.
   */
  scratch?: readonly string[];
  /** Whether the subject runs with the run's prepared dependencies mounted read-only. */
  dependencies?: boolean;
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

/**
 * The controller-owned bindings of the H3 hosted fixture (CP95 under
 * test/fixtures): an owner approval whose effect is a fixture receipt, read
 * back from its Actions artifact, which proves approvals, denials and effect
 * recovery on hosted runners without a real release; and the review of the
 * welcome module built on the greeting. No CP01 target names either.
 */
export const FIXTURE_BINDINGS: readonly Binding[] = [
  {
    id: "hosted.release-approval",
    method: "approval",
    version: "1",
    authority: "owner",
    subject: "the exact hosted fixture candidate, released as a fixture receipt",
    effect: { action: "fixture-receipt", target: "hosted-fixture/release" },
  },
  {
    id: "hosted.welcome-review",
    method: "review",
    version: "1",
    rubric: [
      "The welcome module imports greet from the greeting module rather than repeating it.",
      "welcome(name) returns greet(name) followed by ` Welcome aboard.` and nothing else.",
    ],
  },
];

/**
 * Bindings by ID, each with the digest of its definition and, for a binding a
 * candidate declares, the path of its declaration.
 */
export type Registry = ReadonlyMap<string, RegistryEntry>;
export type RegistryEntry = { binding: Binding; digest: string; source?: string };

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
      const scratch = binding.scratch ?? [];
      if (!scratch.every((p) => relativePath(p) && !/[,"]/.test(p)) || !texts(scratch)) {
        diagnostics.push(`${where}: scratch must be distinct normalised relative paths`);
      }
      const overlaps = binding.files.filter((f) =>
        scratch.some((p) => f === p || f.startsWith(`${p}/`)),
      );
      if (overlaps.length > 0) {
        diagnostics.push(
          `${where}: verifier files ${overlaps.join(", ")} are under a scratch path`,
        );
      }
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

/** The adequacy rubric that admits a binding of `method`. */
export const adequacyRubric = (method: Binding["method"]): PinnedRubric =>
  method === "review" ? REVIEW_ADEQUACY_RUBRIC : ADEQUACY_RUBRIC;

/**
 * Whether a binding counts only after an approved admission of its digest:
 * every automated binding, whose verifier files come from the candidate, and
 * every review binding a candidate declares. Code-owned review and approval
 * bindings are reviewed with the controller.
 */
export const needsAdmission = (entry: RegistryEntry | undefined): boolean =>
  entry?.binding.method === "automated" ||
  (entry?.binding.method === "review" && entry.source !== undefined);

/** One binding declaration file of a candidate: its path and bytes. */
export type Declaration = { path: string; bytes: Buffer };

/** A declaration the loader refused, with why; `binding` is its ID when it names one. */
export type Rejection = { path: string; binding: string | null; diagnostics: string[] };

export type Declared = { registry: Registry; rejected: Rejection[] };

const declarationSchema: unknown = JSON.parse(
  readFileSync(new URL("./binding.schema.json", import.meta.url), "utf8"),
);
const validateDeclaration = new Ajv2020({ allErrors: true }).compile<Binding>(
  declarationSchema as Record<string, unknown>,
);

/**
 * The registry of one candidate (T3.5 H1): the controller's bindings and the
 * bindings the candidate declares under `dir`, one `<id>.yml` file each. A
 * declaration is refused, with its diagnostics, when it is not YAML, repeats
 * a key, fails the declaration schema, is named for another ID, redefines a
 * controller binding, declares an approval binding, names no target of the
 * plan (`known`, binding ID → the method the plan uses it as) or is used as
 * another method. An accepted declaration is registered under its own path;
 * it still counts only after admission.
 */
export function declaredRegistry(
  controller: Registry,
  declarations: readonly Declaration[],
  dir: string,
  known: ReadonlyMap<string, Method>,
): Declared {
  const registry = new Map(controller);
  const rejected: Rejection[] = [];
  for (const { path, bytes } of [...declarations].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const name = /^([^/]+)\.yml$/.exec(posix.relative(dir, path))?.[1];
    const refuse = (binding: string | null, ...diagnostics: string[]): void => {
      rejected.push({ path, binding, diagnostics });
    };
    if (name === undefined) {
      refuse(null, `${path}: a binding declaration is ${dir}/<binding-id>.yml`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = yaml.load(bytes.toString("utf8"), { schema: yaml.JSON_SCHEMA });
    } catch (e) {
      refuse(name, `${path}: ${e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e)}`);
      continue;
    }
    const method = (parsed as { method?: unknown } | null)?.method;
    if (method === "approval") {
      refuse(
        name,
        `${path}: approval bindings name an authority and an effect; they are controller-owned, not declared by a candidate`,
      );
      continue;
    }
    if (!validateDeclaration(parsed)) {
      const errors = (validateDeclaration.errors ?? []).map(
        (e) => `${path}: schema: ${e.instancePath || "/"} ${e.message ?? ""}`,
      );
      refuse(name, ...errors);
      continue;
    }
    const binding = parsed;
    if (binding.id !== name) {
      refuse(name, `${path}: declares ${binding.id}, not the ${name} its file name gives`);
      continue;
    }
    if (controller.has(binding.id)) {
      refuse(
        binding.id,
        `${path}: ${binding.id} is a controller binding; a candidate cannot redefine it`,
      );
      continue;
    }
    const used = known.get(binding.id);
    if (used === undefined) {
      refuse(binding.id, `${path}: unknown binding: no planned target names ${binding.id}`);
      continue;
    }
    if (used !== binding.method) {
      refuse(
        binding.id,
        `${path}: ${binding.id} is declared ${binding.method} but used as ${used}`,
      );
      continue;
    }
    const created = createRegistry([binding]);
    if (!created.ok) {
      refuse(binding.id, ...created.diagnostics.map((d) => `${path}: ${d}`));
      continue;
    }
    const entry = created.registry.get(binding.id);
    if (entry) registry.set(binding.id, { ...entry, source: path });
  }
  return { registry, rejected };
}

/**
 * Checkpoint 1's applicability rules (Spec 00 §4; checkpoint.yml). CP01/AC02
 * proves CP01/R02, which binds from the acceptance of Step 25; CP01/AC05
 * proves the exit gate of CP01/R05, evaluated only at the checkpoint exit.
 * Every other inherited criterion applies to every step.
 */
export const APPLICABILITY: ApplicabilityRules = {
  CP01: {
    AC02: { kind: "after", step: "CP01-S25" },
    AC05: { kind: "exit" },
  },
};
