import { CORE_STAGES, type StageName } from "../config/lifecycle.js";

/**
 * One generated adapter command (Delivery Graph §19). The body only says
 * how to call the runtime and which pack agent does the work: which stage
 * is permitted, who may decide and how records are linked stay with the
 * runtime (§18). `capability` names the pack agent the command delegates
 * to; absent when the command needs no agent.
 */
export interface CommandTemplate {
  readonly stage: StageName;
  readonly description: string;
  readonly argumentHint: string;
  readonly capability?: string;
  /** Body sections after the common "Ask the runtime first" section. */
  readonly body: (agent: string | undefined) => string;
}

const RECORD = (stage: StageName, fields: string): string =>
  [
    `## 3. Hand the result to the runtime`,
    ``,
    `Write a YAML file in a temporary location outside the repository with:`,
    ``,
    "```yaml",
    fields,
    "```",
    ``,
    `Then run \`pnpm pactwright lifecycle record ${stage} --file <path>\`.`,
    `The runtime checks the transition, validates the complete graph and writes`,
    `the record. Do not create or edit anything under \`specs/\` yourself.`,
  ].join("\n");

const TRANSIENT = [
  `## 3. Report, do not record`,
  ``,
  `This stage leaves no graph record. Present the result to the user. Do not`,
  `create or edit anything under \`specs/\`.`,
].join("\n");

const STOP = [
  `## 4. Stop`,
  ``,
  `Show the runtime output verbatim and stop. Do not run another adapter`,
  `command; the user decides what to do next.`,
].join("\n");

const delegate = (agent: string | undefined, task: string): string =>
  agent === undefined
    ? task
    : `Use the \`${agent}\` agent (from \`.claude/agents/${agent}.md\`) for this. Give it the runtime context verbatim. ${task}`;

export const COMMAND_TEMPLATES: readonly CommandTemplate[] = [
  {
    stage: "capture-intent",
    description: "Capture a new Delivery intent from text",
    argumentHint: "<text>",
    body: () =>
      [
        `## 2. Shape the intent`,
        ``,
        `\`$ARGUMENTS\` is the whole intent text. Derive a short title (under ten`,
        `words) from it. The body is the text as given, restated only if it is`,
        `not already a clear statement of who is affected, the outcome wanted and`,
        `any constraint. Target 300 words or fewer. Do not add solutions.`,
        ``,
        RECORD("capture-intent", `title: <title>\nbody: |\n  <intent body>`),
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "propose-contracts",
    description: "Generate transient contract alternatives for an intent",
    argumentHint: "<intent-id>",
    capability: "delivery-specification",
    body: (agent) =>
      [
        `## 2. Propose alternatives`,
        ``,
        delegate(
          agent,
          `Produce two to four genuinely different contract alternatives for the intent. Label them A, B, C, D.`,
        ),
        ``,
        TRANSIENT,
        `Alternatives are transient material for a decision; they are not saved.`,
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "approve-contract",
    description: "Record the human decision on an intent and its canonical contract",
    argumentHint: "<intent-id> <alternative> [notes]",
    capability: "delivery-specification",
    body: (agent) =>
      [
        `## 2. Synthesise the canonical contract`,
        ``,
        `\`$ARGUMENTS\` is the intent id, the label of the chosen alternative (or`,
        `\`reject\` / \`defer\`) and optional notes. This command is run by a human;`,
        `their choice is the decision.`,
        ``,
        delegate(
          agent,
          `For a chosen alternative, write the one canonical contract from it (the contract-writing skill applies). For reject or defer, write nothing but the decision body.`,
        ),
        ``,
        RECORD(
          "approve-contract",
          [
            `intent: <intent-id>`,
            `outcome: proceed | reject | defer`,
            `decided_by: human:<name>   # name from \`git config user.name\``,
            `body: |`,
            `  <why this alternative; include the notes>`,
            `contract:                   # proceed only`,
            `  title: <contract title>`,
            `  body: |`,
            `    <canonical contract>`,
          ].join("\n"),
        ),
        `Alternatives that were not chosen are not saved anywhere.`,
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "write-brief",
    description: "Write the delivery brief for an approved contract",
    argumentHint: "<contract-id>",
    capability: "delivery-specification",
    body: (agent) =>
      [
        `## 2. Write the brief`,
        ``,
        delegate(
          agent,
          `Inspect the relevant project and repository state and write one focused brief for the contract. Reference the contract; do not copy it.`,
        ),
        ``,
        RECORD("write-brief", `contract: <contract-id>\ntitle: <brief title>\nbody: |\n  <brief>`),
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "deliver-brief",
    description: "Execute a brief against the repository",
    argumentHint: "<brief-id>",
    capability: "delivery-execution",
    body: (agent) =>
      [
        `## 2. Execute the brief`,
        ``,
        delegate(
          agent,
          `Execute the brief within the contract's scope, run the verification it names and report what changed, file by file, with the real verification result.`,
        ),
        ``,
        TRANSIENT,
        `Repository changes stay in the working tree for the user to review.`,
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "review",
    description: "Review delivered changes against the contract and brief",
    argumentHint: "<brief-id>",
    capability: "delivery-review",
    body: (agent) =>
      [
        `## 2. Review`,
        ``,
        delegate(
          agent,
          `Review the contract, the brief, the delivered changes and the required verification. Report findings with file references.`,
        ),
        ``,
        TRANSIENT,
        `Review reasoning is not graph state.`,
        ``,
        STOP,
      ].join("\n"),
  },
  {
    stage: "prepare-evidence",
    description: "Record final delivery and verification facts for a brief",
    argumentHint: "<brief-id>",
    capability: "delivery-execution",
    body: (agent) =>
      [
        `## 2. Collect the facts`,
        ``,
        delegate(
          agent,
          `State what was delivered (files, commits or output references) and the verification that was run with its result. Facts only: no contract, brief or review text, no reasoning. Target 400 words or fewer.`,
        ),
        ``,
        RECORD(
          "prepare-evidence",
          `brief: <brief-id>\ntitle: <evidence title>\nbody: |\n  <facts>`,
        ),
        ``,
        STOP,
      ].join("\n"),
  },
];

/** Every core stage has exactly one template, in lifecycle order. */
export function templateFor(stage: StageName): CommandTemplate {
  return COMMAND_TEMPLATES.find((template) => template.stage === stage)!;
}

// Guard kept next to the data so a stage rename fails typecheck here.
void (CORE_STAGES satisfies readonly StageName[]);
