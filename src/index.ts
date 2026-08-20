export { PactwrightError, formatProblem, type Problem } from "./errors.js";
export {
  ADAPTER_TYPES,
  CONFIG_VERSION,
  loadConfig,
  parseConfig,
  type PactwrightConfig,
  type ParseResult,
} from "./config/config.js";
export {
  ACTORS,
  CORE_STAGES,
  DECISION_STAGE,
  EXECUTION_MODES,
  LIFECYCLE_VERSION,
  decisionActor,
  humanGates,
  isHumanGate,
  loadLifecycle,
  parseLifecycle,
  type Actor,
  type ExecutionMode,
  type LifecycleConfig,
  type StageConfig,
  type StageName,
} from "./config/lifecycle.js";
export { HASH_PATTERN, loadLock, parseLock, type LockFile } from "./config/lock.js";
export {
  CREATED_PATTERN,
  NODE_ID_PATTERN,
  NODE_TYPE_PATTERN,
  REQUIRED_NODE_FIELDS,
  checkNodeId,
  checkNodeIdImmutability,
  loadNodes,
  parseNodeFile,
  type GraphNode,
  type NodesLoadResult,
} from "./graph/nodes.js";
export {
  CORE_NODE_SCHEMAS,
  CORE_NODE_TYPES,
  DECIDED_BY_KINDS,
  DECIDED_BY_PATTERN,
  DECISION_OUTCOMES,
  createNodeSchemaRegistry,
  decisionFields,
  nodeTypes,
  parseDecidedBy,
  validateNode,
  validateNodes,
  type CoreNodeType,
  type DecidedBy,
  type DecidedByKind,
  type DecisionFields,
  type DecisionOutcome,
  type NodeSchema,
  type NodeSchemaRegistry,
} from "./graph/schema.js";
export {
  CORE_EDGE_OWNER,
  CORE_EDGE_SCHEMAS,
  CORE_EDGE_TYPES,
  createEdgeSchemaRegistry,
  edgeTypes,
  validateEdges,
  type CoreEdgeType,
  type EdgeSchema,
  type EdgeSchemaRegistry,
} from "./graph/edge-schema.js";
export {
  DELIVERY_STATES,
  deriveLineage,
  deriveLineages,
  isCurrent,
  validateLineages,
  type DeliveryState,
  type Lineage,
  type LineageResult,
} from "./graph/lineage.js";
export {
  EDGE_TYPE_PATTERN,
  edgeKey,
  loadEdges,
  parseEdges,
  type Edge,
  type EdgesParseResult,
} from "./graph/edges.js";
export { mintNodeId, slugify } from "./graph/ids.js";
export {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
  type CreateBriefInput,
  type CreateEvidenceInput,
  type CreateIntentInput,
  type RecordDecisionInput,
  type RecordedDecision,
} from "./graph/mutations.js";
export {
  REVISION_PATTERN,
  REVISION_VERSION,
  canonicalGraphPayload,
  canonicalJson,
  graphRevision,
  type CanonicalRecord,
  type RevisionInput,
} from "./graph/revision.js";
export {
  CONFIG_FILE,
  EDGES_FILE,
  LIFECYCLE_FILE,
  LOCK_FILE,
  NODES_DIR,
  findProjectRoot,
  projectPaths,
  type ProjectPaths,
} from "./project.js";
export { loadProject, type LoadProjectOptions, type Project } from "./loader.js";
export { runtimeVersion } from "./version.js";
export {
  GRAPH_MARKING_STAGES,
  TRANSIENT_STAGES,
  completedStages,
  isActive,
  isTransientStage,
  lifecycleNext,
  lifecycleStatus,
  nextActionFor,
  pendingStages,
  selectLineages,
  type LifecycleStatus,
  type LineageStatus,
  type NextAction,
} from "./lifecycle/engine.js";
export {
  noExecutor,
  runLifecycle,
  type RunOptions,
  type RunResult,
  type RunStop,
  type StageExecutor,
  type StageOutcome,
  type StageRequest,
} from "./lifecycle/run.js";
export { validateProject, type ValidationReport } from "./validate.js";
export {
  findIntentOf,
  loadContext,
  type ContextContributor,
  type ContextOptions,
  type DeliveryContext,
  type ExtensionContext,
  type HistoryRecord,
} from "./context.js";
