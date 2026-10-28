// T3.6 L4 test helpers (evidence-backed learning log §3 T3.6-L4): the hosted
// learning fixture CP94 in a local Git repository, run through the hosted
// job path of `h3-fixtures.ts` with its store and in-memory GitHub. The
// template's injected attempts of Step 2 are served by the real injector;
// every other session is scripted to answer as the live sessions of the
// hosted proof are expected to: a candidate review that reads the normaliser
// and records a blocking finding while a hand-written whitespace class is
// there, a proposer that cites the failed check and, once two attempts'
// reviews found the same rule, the guidance it supports, and passing
// learning, selection and challenge reviews.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Diagnosis, Packet, Proposals, ReviewVerdict } from "../src/claude.js";
import {
  FakeGitHub,
  DirStore,
  BRANCH,
  git,
  H,
  OWNER,
  type Repo,
  type World,
} from "./h3-fixtures.js";
import { snapshotReviewers } from "./knowledge-fixtures.js";
import { scriptedAgent, submit, type ScriptedAgent } from "./runner-fixtures.js";
import { approveAll } from "./verification-fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

export const TEMPLATE = "l4-fixture.yml";
export const L = `${H}/learning`;
export const NAME = `${L}/work/name.mjs`;
export const NORMALIZE = `${L}/work/normalize.mjs`;
export const S01 = "CP94-S01";
export const S02 = "CP94-S02";
/** The rule the injected faults leave unmet. */
export const R01 = `${S02}/R01`;
export const CAUSE = "a hand-written whitespace class misses Unicode space separators";
export const REMINDER =
  "Remove whitespace with String.prototype.trim, not a hand-written character class: LEARNING §2 counts every Unicode space separator.";
/** The attempts of Step 2 the template injects. */
export const INJECTED = [1, 2, 3];

export const GOOD_NAME = `// CP94 Step 1: the name of LEARNING §1.
export const NAME = "Pactwright";

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(NAME);
}
`;

export const GOOD_NORMALIZE = `// CP94 Step 2: the normaliser of LEARNING §2.
export function normalize(text) {
  return String(text).trim();
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(normalize(process.argv[2] ?? ""));
}
`;

/**
 * A repository on branch `fixture` holding CP94 at its Pactwright path, the
 * format schema and the L4 template retargeted at this branch; `edit`
 * changes the template first.
 */
export function learningRepo(scratch: string, edit: (t: string) => string = (t) => t): Repo {
  const root = join(scratch, `repo-${randomUUID()}`);
  mkdirSync(join(root, H), { recursive: true });
  const work = join(repoRoot, L, "work");
  const definition = (path: string): boolean =>
    !path.startsWith(`${work}/`) || path === join(work, ".gitkeep");
  for (const dir of ["docs", "learning"]) {
    cpSync(join(repoRoot, H, dir), join(root, H, dir), { recursive: true, filter: definition });
  }
  mkdirSync(join(root, "docs/checkpoints"), { recursive: true });
  cpSync(
    join(repoRoot, "docs/checkpoints/contract.schema.json"),
    join(root, "docs/checkpoints/contract.schema.json"),
  );
  const template = readFileSync(
    join(repoRoot, `.github/checkpoint-harness/${TEMPLATE}`),
    "utf8",
  ).replace(/branch: .*/, `branch: ${BRANCH}`);
  mkdirSync(join(root, ".github/checkpoint-harness"), { recursive: true });
  writeFileSync(join(root, `.github/checkpoint-harness/${TEMPLATE}`), edit(template));
  git(root, ["init", "-q", "-b", BRANCH]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

/** The scripted producer: Step 1's name, Step 2's normaliser, with a cited comment on a correction from feedback. */
export function learningProducer(): ScriptedAgent {
  return scriptedAgent((session) => {
    const { step, findings } = session.packet;
    if (step.id === S01) return submit(session, { [NAME]: GOOD_NAME }, { name: [NAME] });
    // A correction from feedback cites the specification, once per attempt.
    const cited = findings.some((f) => /comment/.test(f.correction))
      ? `// Normalises as LEARNING §2 says (attempt ${session.packet.attempt}).\n`
      : "";
    return submit(session, { [NORMALIZE]: cited + GOOD_NORMALIZE }, { normalizer: [NORMALIZE] });
  });
}

/** What the scripted reviewer saw: the packets of each kind it answered. */
export type Seen = { packets: Packet[] };

/** A candidate review of a normaliser with a hand-written class: R01 unmet, one blocking finding. */
export function faultVerdict(packet: Packet): ReviewVerdict {
  const verdict = approveAll(packet);
  return {
    ...verdict,
    verdict: "changes-required",
    coverage: verdict.coverage.map((c) =>
      c.subject === R01
        ? { ...c, result: "unsatisfied", basis: "executed", note: "U+3000 survives normalisation" }
        : c,
    ),
    targets: verdict.targets.map((t) => ({ ...t, result: "failed", note: "U+3000 survives" })),
    findings: [
      {
        severity: "blocking",
        basis: "executed",
        rule: R01,
        location: `${NORMALIZE}:5`,
        defect: "the hand-written whitespace class leaves Unicode space separators such as U+3000",
        correction: "remove every character String.prototype.trim removes",
      },
    ],
  };
}

/** The proposer's answer: the failed check as a counterexample and, from two failed attempts on, the reminder. */
export function learnedProposals(packet: Packet): Proposals {
  const proposal = packet.proposal;
  assert.ok(proposal, "a proposal packet");
  const observations = proposal.observations as {
    ref: string;
    action: string;
    results?: { target: string; outcome: string }[];
  }[];
  const failures = proposal.failures as {
    review: string;
    attempt: number;
    findings: { index: number; rule: string }[];
  }[];
  const failed = observations.find(
    (o) => o.action === "verifier-invocation" && o.results?.some((r) => r.outcome === "failed"),
  );
  const target = failed?.results?.find((r) => r.outcome === "failed")?.target;
  const occurrences = failures.flatMap((f) =>
    f.findings.filter((x) => x.rule === R01).map((x) => ({ review: f.review, finding: x.index })),
  );
  const attempts = new Set(
    failures.filter((f) => f.findings.some((x) => x.rule === R01)).map((f) => f.attempt),
  );
  return {
    knowledge:
      failed && target
        ? [
            {
              assertion: `Attempt ${packet.attempt}'s normaliser leaves a Unicode space separator around the text.`,
              target,
              kind: "counterexample",
              observations: [{ ref: failed.ref, basis: "executed" }],
              contradicts: [],
              supersedes: [],
            },
          ]
        : [],
    // Proposed once, when the second failed attempt makes it admissible.
    guidance:
      attempts.size === 2 && packet.attempt === 2
        ? [
            {
              rule: R01,
              cause: CAUSE,
              text: REMINDER,
              reason: "two attempts' reviews found the same unmet whitespace rule",
              occurrences,
              contradicts: [],
            },
          ]
        : [],
  };
}

const diagnosis = (approach: string): Diagnosis => ({
  approach,
  assumptions: ["the verifier's texts are the whitespace LEARNING §2 names"],
  evidence: [NORMALIZE],
  check: null,
  blockers: [],
});

/** Feedback assessed by the tag its body starts with, as the H3 fixture reviewer does, with the normaliser as its location. */
function feedbackVerdict(packet: Packet): ReviewVerdict {
  const review = packet.review;
  assert.ok(review);
  const items = (
    review.evidence as { feedback: { subject: string; body: string; path: string | null }[] }
  ).feedback;
  const coverage: ReviewVerdict["coverage"] = [];
  const findings: ReviewVerdict["findings"] = [];
  for (const item of items) {
    const tag = /^\[(\w+)\]/.exec(item.body)?.[1] ?? "addressed";
    if (tag === "actionable") {
      coverage.push({
        subject: item.subject,
        result: "unsatisfied",
        basis: "inspection",
        note: "not yet done",
      });
      findings.push({
        severity: "blocking",
        rule: item.subject,
        location: `${item.path ?? NORMALIZE}:1`,
        defect: "the normaliser has no comment citing its specification",
        correction: "add a comment citing LEARNING §2",
        basis: "inspection",
      });
    } else {
      const prefix = tag === "declined" ? "declined:" : "already-addressed:";
      coverage.push({
        subject: item.subject,
        result: "satisfied",
        basis: "inspection",
        note: `${prefix} as recorded`,
      });
    }
  }
  return {
    verdict: findings.length > 0 ? "changes-required" : "pass",
    coverage,
    targets: [],
    findings,
    blockers: [],
  };
}

/** The scripted reviewer of every session kind the L4 run dispatches. */
export function learningReviewer(seen: Seen = { packets: [] }): ScriptedAgent {
  return scriptedAgent(async (session) => {
    const { packet } = session;
    seen.packets.push(packet);
    if (packet.diagnosis) return { output: diagnosis(`${packet.diagnosis.side}: use trim`) };
    if (packet.proposal) return { output: learnedProposals(packet) };
    const kind = packet.review?.kind;
    if (kind === "feedback") return { output: feedbackVerdict(packet) };
    if (kind === "selection") {
      return {
        output: {
          ...approveAll(packet),
          recommendation: {
            select: "approach",
            reason: "trim removes every whitespace character LEARNING §2 names",
            evidence: [NORMALIZE],
          },
        },
      };
    }
    if (kind === "candidate" && packet.step.id === S02) {
      const read = await session.call("read_file", { path: NORMALIZE });
      assert.ok(read.ok, "the review reads the normaliser");
      return { output: read.text.includes(".trim()") ? approveAll(packet) : faultVerdict(packet) };
    }
    return { output: approveAll(packet) };
  });
}

/** A CP94 world on the hosted job path; nothing has run yet. */
export function learningWorld(
  scratch: string,
  options: { edit?: (t: string) => string; run?: string; seen?: Seen } = {},
): World {
  const dir = join(scratch, randomUUID());
  mkdirSync(dir);
  const repo = learningRepo(dir, options.edit);
  return {
    registry: null,
    contained: false,
    env: { CLAUDE_CODE_OAUTH_TOKEN: "test-token" },
    scratch: dir,
    repo,
    store: new DirStore(join(dir, "store")),
    github: new FakeGitHub(repo),
    producer: learningProducer(),
    reviewer: learningReviewer(options.seen),
    run: options.run ?? "l4-test",
    runs: 0,
    reviewers: (run) => snapshotReviewers(run.dir),
  };
}

export const START = { action: "start", config: TEMPLATE, through: S02 } as const;
export { OWNER };
