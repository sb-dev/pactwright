import type { ParseResult } from "./config.js";
import {
  Checker,
  expectEnum,
  expectRecord,
  expectVersion,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/** The seven core Delivery lifecycle stages, in lifecycle order (Delivery Graph §17). */
export const CORE_STAGES = [
  "capture-intent",
  "propose-contracts",
  "approve-contract",
  "write-brief",
  "deliver-brief",
  "review",
  "prepare-evidence",
] as const;
export type StageName = (typeof CORE_STAGES)[number];

export const EXECUTION_MODES = ["manual", "automatic"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const ACTORS = ["human", "agent"] as const;
export type Actor = (typeof ACTORS)[number];

export interface StageConfig {
  readonly execution: ExecutionMode;
  readonly actor?: Actor;
}

/** `.pactwright/lifecycle.yml` — how the repository operates the lifecycle. */
export interface LifecycleConfig {
  readonly version: 1;
  readonly stages: Readonly<Record<StageName, StageConfig>>;
}

export const LIFECYCLE_VERSION = 1;

export function parseLifecycle(raw: unknown, path: string): ParseResult<LifecycleConfig> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "lifecycle");
  if (root === undefined) return { value: undefined, problems: c.problems };

  requireKeys(c, root, "lifecycle", ["version", "stages"]);
  rejectUnknownKeys(c, root, "lifecycle", ["version", "stages"]);
  expectVersion(c, root["version"], "lifecycle.version", LIFECYCLE_VERSION);

  const stages: Partial<Record<StageName, StageConfig>> = {};
  const rawStages = expectRecord(c, root["stages"], "lifecycle.stages");
  if (rawStages !== undefined) {
    requireKeys(c, rawStages, "lifecycle.stages", CORE_STAGES);
    for (const key of Object.keys(rawStages)) {
      if (!(CORE_STAGES as readonly string[]).includes(key)) {
        c.fail(
          "unknown-stage",
          `lifecycle.stages has unknown stage "${key}"; only core Delivery stages are configurable here`,
        );
      }
    }
    for (const name of CORE_STAGES) {
      const label = `lifecycle.stages.${name}`;
      const stage = expectRecord(c, rawStages[name], label);
      if (stage === undefined) continue;
      requireKeys(c, stage, label, ["execution"]);
      rejectUnknownKeys(c, stage, label, ["execution", "actor"]);
      const execution = expectEnum(c, stage["execution"], `${label}.execution`, EXECUTION_MODES);
      const actor =
        stage["actor"] === undefined
          ? undefined
          : expectEnum(c, stage["actor"], `${label}.actor`, ACTORS);
      if (execution !== undefined) {
        stages[name] = actor === undefined ? { execution } : { execution, actor };
      }
    }
  }

  if (!c.ok) return { value: undefined, problems: c.problems };
  return { value: { version: 1, stages: stages as Record<StageName, StageConfig> }, problems: [] };
}

export function loadLifecycle(path: string): ParseResult<LifecycleConfig> {
  const read = readYamlFile(path);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseLifecycle(read.value, path);
}
