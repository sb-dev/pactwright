import type { ParseResult } from "./config.js";
import {
  ACTORS,
  EXECUTION_MODES,
  type Actor,
  type ExecutionMode,
  type StepPolicy,
} from "./lifecycle-policy.js";
import { DIRECT_SHAPE, parseShape, type LifecycleShape } from "../lifecycle/shape.js";
import {
  Checker,
  expectEnum,
  expectInteger,
  expectRecord,
  isRecord,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

export { ACTORS, EXECUTION_MODES };
export type { Actor, ExecutionMode, StepPolicy };

/**
 * The Contract-crafting responsibilities (Spec 01 §22–§23). These sit
 * *upstream* of the Brief and carry execution policy, but they are
 * deliberately not lifecycle-shape steps: the shape governs the
 * Brief-to-Evidence portion only (§27). Adapter command decomposition must
 * never become lifecycle topology.
 */
export const RESPONSIBILITIES = [
  "capture-intent",
  "propose-contracts",
  "approve-contract",
  "write-brief",
] as const;
export type ResponsibilityName = (typeof RESPONSIBILITIES)[number];

/** The responsibility whose configured actor authorises Decisions (§8). */
export const DECISION_RESPONSIBILITY = "approve-contract" as const;

/**
 * Responsibilities that leave a durable Delivery Graph record. Contract
 * alternatives stay transient until one is selected (§7), so
 * propose-contracts is deliberately absent: the graph cannot show that it
 * ran, and the runtime must not demand that it did.
 */
export const RECORDING_RESPONSIBILITIES = [
  "capture-intent",
  "approve-contract",
  "write-brief",
] as const satisfies readonly ResponsibilityName[];

export function isRecordingResponsibility(name: string): boolean {
  return (RECORDING_RESPONSIBILITIES as readonly string[]).includes(name);
}

/**
 * `.pactwright/lifecycle.yml` — how the repository operates the lifecycle.
 * It holds execution policy and the selected shape; it holds no graph truth
 * and no fine-grained progression (§28).
 */
export interface LifecycleConfig {
  readonly version: 2;
  readonly responsibilities: Readonly<Record<ResponsibilityName, StepPolicy>>;
  readonly shape: LifecycleShape;
}

export const LIFECYCLE_VERSION = 2;

/** The seven-stage v1 document this runtime migrates from. */
const V1_STAGES = [
  "capture-intent",
  "propose-contracts",
  "approve-contract",
  "write-brief",
  "deliver-brief",
  "review",
  "prepare-evidence",
] as const;

/** v1 stage → the v2 shape step it became. */
const V1_SHAPE_STAGES: Readonly<Record<string, string>> = {
  "deliver-brief": "delivery",
  review: "review",
  "prepare-evidence": "evidence",
};

function checkPolicy(c: Checker, raw: unknown, label: string): StepPolicy | undefined {
  const record = expectRecord(c, raw, label);
  if (record === undefined) return undefined;
  requireKeys(c, record, label, ["execution"]);
  rejectUnknownKeys(c, record, label, ["execution", "actor"]);
  const execution = expectEnum(c, record["execution"], `${label}.execution`, EXECUTION_MODES);
  const actor =
    record["actor"] === undefined
      ? undefined
      : expectEnum(c, record["actor"], `${label}.actor`, ACTORS);
  if (execution === undefined) return undefined;
  return actor === undefined ? { execution } : { execution, actor };
}

/**
 * Recognises a v1 seven-stage document so the runtime can say "migrate"
 * rather than emitting seven confusing unknown-key problems.
 */
function looksLikeV1(root: Record<string, unknown>): boolean {
  if (root["version"] !== 1) return false;
  const stages = root["stages"];
  return typeof stages === "object" && stages !== null;
}

export function parseLifecycle(raw: unknown, path: string): ParseResult<LifecycleConfig> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "lifecycle");
  if (root === undefined) return { value: undefined, problems: c.problems };

  if (looksLikeV1(root)) {
    c.fail(
      "lifecycle-needs-migration",
      `lifecycle.yml is version 1, which encoded the seven adapter commands as lifecycle stages; version ${LIFECYCLE_VERSION} separates Contract-crafting responsibilities from the Brief-to-Evidence shape. Run "pactwright upgrade" to migrate it.`,
    );
    return { value: undefined, problems: c.problems };
  }

  requireKeys(c, root, "lifecycle", ["version", "responsibilities", "shape"]);
  rejectUnknownKeys(c, root, "lifecycle", ["version", "responsibilities", "shape"]);
  const version = expectInteger(c, root["version"], "lifecycle.version");
  if (version !== undefined && version !== LIFECYCLE_VERSION) {
    c.fail(
      "unsupported-version",
      `lifecycle.version must be ${LIFECYCLE_VERSION}, found ${version}`,
    );
  }

  const responsibilities: Partial<Record<ResponsibilityName, StepPolicy>> = {};
  const rawResponsibilities = expectRecord(
    c,
    root["responsibilities"],
    "lifecycle.responsibilities",
  );
  if (rawResponsibilities !== undefined) {
    requireKeys(c, rawResponsibilities, "lifecycle.responsibilities", RESPONSIBILITIES);
    for (const key of Object.keys(rawResponsibilities)) {
      if (!(RESPONSIBILITIES as readonly string[]).includes(key)) {
        const wasShapeStage = V1_SHAPE_STAGES[key];
        c.fail(
          "unknown-responsibility",
          wasShapeStage === undefined
            ? `lifecycle.responsibilities has unknown responsibility "${key}"`
            : `lifecycle.responsibilities has unknown responsibility "${key}"; it is a shape step named "${wasShapeStage}" and belongs under lifecycle.shape.steps`,
        );
      }
    }
    for (const name of RESPONSIBILITIES) {
      const raw = rawResponsibilities[name];
      // The *declared* key decides whether the actor is missing: an actor that
      // failed its enum check is invalid, not absent, and must not also be
      // reported as missing.
      const declaresActor = isRecord(raw) && "actor" in raw;
      if (name === DECISION_RESPONSIBILITY && raw !== undefined && !declaresActor) {
        c.fail(
          "missing-actor",
          `lifecycle.responsibilities.${name} must declare "actor"; Decisions must be authorised by lifecycle.yml (Spec 01 §8)`,
        );
        continue;
      }
      const policy = checkPolicy(c, raw, `lifecycle.responsibilities.${name}`);
      if (policy === undefined) continue;
      responsibilities[name] = policy;
    }
  }

  const shape = parseShape(root["shape"], path);
  c.problems.push(...shape.problems);

  if (!c.ok || shape.value === undefined) return { value: undefined, problems: c.problems };
  return {
    value: {
      version: LIFECYCLE_VERSION,
      responsibilities: responsibilities as Record<ResponsibilityName, StepPolicy>,
      shape: shape.value,
    },
    problems: [],
  };
}

export function loadLifecycle(path: string): ParseResult<LifecycleConfig> {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseLifecycle(read.value, path);
}

/** The actor authorised to make Decisions: `approve-contract`'s configured actor. */
export function decisionActor(lifecycle: LifecycleConfig): Actor {
  return lifecycle.responsibilities[DECISION_RESPONSIBILITY].actor!;
}

/**
 * A responsibility that cannot proceed without a human: manual execution or a
 * human actor. `lifecycle run` stops here and never skips one (§20).
 */
export function isHumanGate(policy: StepPolicy): boolean {
  return policy.execution === "manual" || policy.actor === "human";
}

/** The human-gated Contract-crafting responsibilities, in order. */
export function gatedResponsibilities(lifecycle: LifecycleConfig): readonly ResponsibilityName[] {
  return RESPONSIBILITIES.filter((name) => isHumanGate(lifecycle.responsibilities[name]));
}

/**
 * Migrates a parsed v1 seven-stage document to the v2 shape. The four
 * Contract-crafting stages keep their policy as responsibilities; the three
 * Brief-to-Evidence stages become the direct shape's steps, so an existing
 * project keeps exactly the operating policy it had.
 */
export function migrateLifecycleV1(raw: unknown, path: string): ParseResult<LifecycleConfig> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "lifecycle");
  if (root === undefined || !looksLikeV1(root)) {
    c.fail("not-migratable", `${path} is not a version 1 lifecycle document`);
    return { value: undefined, problems: c.problems };
  }
  const stages = expectRecord(c, root["stages"], "lifecycle.stages");
  if (stages === undefined) return { value: undefined, problems: c.problems };

  const responsibilities: Partial<Record<ResponsibilityName, StepPolicy>> = {};
  const stepPolicies = new Map<string, StepPolicy>();
  for (const stage of V1_STAGES) {
    const policy = checkPolicy(c, stages[stage], `lifecycle.stages.${stage}`);
    if (policy === undefined) continue;
    const shapeStep = V1_SHAPE_STAGES[stage];
    if (shapeStep === undefined) {
      responsibilities[stage as ResponsibilityName] = policy;
    } else {
      stepPolicies.set(shapeStep, policy);
    }
  }
  if (!c.ok) return { value: undefined, problems: c.problems };

  const shape: LifecycleShape = {
    ...DIRECT_SHAPE,
    steps: DIRECT_SHAPE.steps.map((step) => {
      const policy = stepPolicies.get(step.name);
      if (policy === undefined) return step;
      return policy.actor === undefined
        ? { ...step, execution: policy.execution }
        : { ...step, execution: policy.execution, actor: policy.actor };
    }),
  };
  return {
    value: {
      version: LIFECYCLE_VERSION,
      responsibilities: responsibilities as Record<ResponsibilityName, StepPolicy>,
      shape,
    },
    problems: [],
  };
}
