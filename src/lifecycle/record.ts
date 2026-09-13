import { PactwrightError } from "../errors.js";
import { findIntentOf } from "../context.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
  type RecordDecisionInput,
} from "../graph/mutations.js";
import type { GraphNode } from "../graph/nodes.js";
import { DECISION_OUTCOMES } from "../graph/schema.js";
import { loadProject, type Project } from "../loader.js";
import {
  Checker,
  expectEnum,
  expectRecord,
  expectString,
  isRecord,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";
import {
  currentStep,
  executionFor,
  nextActionFor,
  pendingResponsibilities,
  selectLineages,
} from "./engine.js";

/**
 * The canonical commands that leave a durable Delivery Graph record
 * (Spec 01 §§6–12). The other three commands — propose-contracts,
 * deliver-brief and review — are graph-read-only: alternatives stay
 * transient and delivery/review outcomes are execution provenance.
 *
 * This list is a property of the *commands*, not of lifecycle topology:
 * capture-intent, approve-contract and write-brief sit upstream of the Brief
 * and are not shape steps at all.
 */
export const RECORDING_COMMANDS = [
  "capture-intent",
  "approve-contract",
  "write-brief",
  "prepare-evidence",
] as const;

/** A command that leaves a durable record. */
export type RecordingStage = (typeof RECORDING_COMMANDS)[number];

export function isRecordingStage(stage: string): stage is RecordingStage {
  return (RECORDING_COMMANDS as readonly string[]).includes(stage);
}

/** The nodes one `lifecycle record` created, in creation order. */
export interface RecordResult {
  readonly stage: RecordingStage;
  readonly created: readonly GraphNode[];
}

/**
 * Reads the content file an adapter command hands to the runtime. The
 * shape is per stage (see `REQUIRED`/`ALLOWED`); every problem in the file
 * is reported in one pass.
 */
const REQUIRED: Readonly<Record<RecordingStage, readonly string[]>> = {
  "capture-intent": ["title", "body"],
  "approve-contract": ["intent", "outcome", "decided_by", "body"],
  "write-brief": ["contract", "title", "body"],
  "prepare-evidence": ["brief", "title", "body"],
};
const ALLOWED: Readonly<Record<RecordingStage, readonly string[]>> = {
  "capture-intent": ["title", "body"],
  "approve-contract": ["intent", "outcome", "decided_by", "title", "body", "contract"],
  "write-brief": ["contract", "title", "body"],
  "prepare-evidence": ["brief", "title", "body"],
};

type Fields = Readonly<Record<string, string>> & {
  readonly contract?: { readonly title: string; readonly body: string } | string;
};

function readFields(stage: RecordingStage, path: string): Fields {
  const file = readYamlFile(path);
  if (file.problems.length > 0)
    throw PactwrightError.fromProblems("invalid-record-input", file.problems);
  const c = new Checker(path);
  if (!isRecord(file.value)) {
    c.fail("invalid-type", "record input must be a mapping");
    throw PactwrightError.fromProblems("invalid-record-input", c.problems);
  }
  const record = file.value;
  requireKeys(c, record, "record input", REQUIRED[stage]);
  rejectUnknownKeys(c, record, "record input", ALLOWED[stage]);
  const fields: Record<string, unknown> = {};
  for (const key of ALLOWED[stage]) {
    if (!(key in record)) continue;
    if (stage === "approve-contract" && key === "contract") {
      const contract = expectRecord(c, record[key], "contract");
      if (contract !== undefined) {
        requireKeys(c, contract, "contract", ["title", "body"]);
        rejectUnknownKeys(c, contract, "contract", ["title", "body"]);
        fields[key] = {
          title: expectString(c, contract["title"], "contract.title"),
          body: expectString(c, contract["body"], "contract.body"),
        };
      }
    } else if (key === "outcome") {
      fields[key] = expectEnum(c, record[key], "outcome", DECISION_OUTCOMES);
    } else {
      fields[key] = expectString(c, record[key], key);
    }
  }
  if (!c.ok) throw PactwrightError.fromProblems("invalid-record-input", c.problems);
  return fields as Fields;
}

/**
 * The runtime's transition check (Spec 01 §18). A Contract-crafting
 * responsibility must be pending for the lineage the input refers to;
 * prepare-evidence must additionally be the resolved shape's current step,
 * which it only becomes once Delivery and Review have completed. That is
 * what stops Evidence being minted on a `delivering` lineage where nothing
 * was delivered and nothing was reviewed.
 *
 * capture-intent starts a new lineage and is always permitted.
 */
function assertPermitted(project: Project, stage: RecordingStage, anchor: string): void {
  if (stage === "capture-intent") return;
  const intent =
    stage === "approve-contract"
      ? project.graph.nodes.find((node) => node.id === anchor && node.type === "intent")
      : findIntentOf(anchor, project.graph.nodes, project.graph.edges);
  if (intent === undefined) {
    throw new PactwrightError("unknown-node", `"${anchor}" is not part of any Delivery lineage`);
  }
  const [lineage] = selectLineages(project, intent.id);
  // §15: deferred and rejected lineages resume by recording a new Decision,
  // which is exactly what approve-contract does. Frozen (superseded)
  // lineages stay refused.
  if (
    stage === "approve-contract" &&
    lineage !== undefined &&
    !lineage.superseded &&
    (lineage.state === "deferred" || lineage.state === "rejected")
  ) {
    return;
  }
  const refuse = (): never => {
    const action = nextActionFor(project, lineage);
    throw new PactwrightError(
      "stage-not-permitted",
      `${stage} is not a permitted action for intent "${intent.id}" now: ${action.reason}`,
    );
  };

  if (stage === "prepare-evidence") {
    // Evidence closes the shape, so the run must have reached its closing
    // step. Reaching it means every earlier step — Delivery, then Review —
    // completed and routed forward.
    const execution = executionFor(project, lineage);
    if (execution === undefined) refuse();
    const step = currentStep(project.lifecycle.shape, execution!.state);
    if (step === undefined || step.kind !== "evidence") refuse();
    return;
  }

  // The remaining recording commands are Contract-crafting responsibilities.
  const pending = pendingResponsibilities(lineage);
  if (!pending.includes(stage)) refuse();
}

/**
 * `pactwright lifecycle record <command> --file <yaml>`: the runtime
 * responsibility an adapter command hands finished content to. The runtime
 * checks the transition, then the Step 7 mutation validates and writes the
 * complete proposed state atomically. Nothing is written on any failure.
 */
export function recordStage(root: string, stage: string, inputPath: string): RecordResult {
  if (!isRecordingStage(stage)) {
    throw new PactwrightError(
      "no-graph-record",
      `"${stage}" leaves no graph record; only ${RECORDING_COMMANDS.join(", ")} can be recorded`,
    );
  }
  const fields = readFields(stage, inputPath);
  const project = loadProject({ root });
  switch (stage) {
    case "capture-intent":
      return { stage, created: [createIntent(root, { title: fields.title!, body: fields.body! })] };
    case "approve-contract": {
      assertPermitted(project, stage, fields.intent!);
      const input: RecordDecisionInput = {
        intentId: fields.intent!,
        outcome: fields.outcome as RecordDecisionInput["outcome"],
        decidedBy: fields.decided_by!,
        body: fields.body!,
        ...(fields.title === undefined ? {} : { title: fields.title }),
        ...(fields.contract === undefined || typeof fields.contract === "string"
          ? {}
          : { contract: fields.contract }),
      };
      const result = recordDecision(root, input);
      return {
        stage,
        created:
          result.contract === undefined ? [result.decision] : [result.decision, result.contract],
      };
    }
    case "write-brief":
      assertPermitted(project, stage, fields.contract as string);
      return {
        stage,
        created: [
          createBrief(root, {
            contractId: fields.contract as string,
            title: fields.title!,
            body: fields.body!,
          }),
        ],
      };
    case "prepare-evidence":
      assertPermitted(project, stage, fields.brief!);
      return {
        stage,
        created: [
          createEvidence(root, {
            briefId: fields.brief!,
            title: fields.title!,
            body: fields.body!,
          }),
        ],
      };
  }
}
