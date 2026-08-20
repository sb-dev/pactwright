import { PactwrightError } from "../errors.js";
import type { StageName } from "../config/lifecycle.js";
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
  GRAPH_MARKING_STAGES,
  isTransientStage,
  nextActionFor,
  pendingStages,
  selectLineages,
} from "./engine.js";

/** A stage that leaves a durable record (Delivery Graph §§6–12). */
export type RecordingStage = (typeof GRAPH_MARKING_STAGES)[number];

export function isRecordingStage(stage: string): stage is RecordingStage {
  return (GRAPH_MARKING_STAGES as readonly string[]).includes(stage);
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
 * The runtime's transition check (Delivery Graph §18): the stage being
 * recorded must be pending for the lineage the input refers to, with only
 * transient stages (whose completion the graph cannot show) before it.
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
  const pending = pendingStages(lineage);
  const index = pending.indexOf(stage);
  if (index < 0 || !pending.slice(0, index).every(isTransientStage)) {
    const action = nextActionFor(project, lineage);
    throw new PactwrightError(
      "stage-not-permitted",
      `${stage} is not a permitted action for intent "${intent.id}" now: ${action.reason}`,
    );
  }
}

/**
 * `pactwright lifecycle record <stage> --file <yaml>`: the runtime
 * responsibility an adapter command hands finished content to. The runtime
 * checks the transition, then the Step 7 mutation validates and writes the
 * complete proposed state atomically. Nothing is written on any failure.
 */
export function recordStage(root: string, stage: StageName, inputPath: string): RecordResult {
  if (!isRecordingStage(stage)) {
    throw new PactwrightError(
      "no-graph-record",
      `stage "${stage}" leaves no graph record; only ${GRAPH_MARKING_STAGES.join(", ")} can be recorded`,
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
