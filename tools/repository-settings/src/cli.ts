// Repository governance command line (GitHub repository governance research
// log §6).
//
// Usage: repository-settings audit [--repo OWNER/NAME] [policy options]
// Reads every governed setting and prints what is already set, what would
// change and what needs a person. It writes nothing. Exits 0 when nothing
// would change, 1 when something would, 2 on a usage or access error.
//
// Usage: repository-settings apply [--repo OWNER/NAME] [--yes] [--backup DIR]
//                                  [policy options]
// Audits, backs up each resource it will change, asks before each change
// unless --yes, applies it, reads it back and reports. Nothing is deleted
// and no setting is loosened. Exits 0 when every change applied and read
// back as desired, 1 when one was refused, rejected or differs, 2 on a
// usage or access error. Secrets are never read, printed or written.

import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";

import { Command, CommanderError } from "commander";

import { currentLogin, currentRepository, ghClient, type Gh } from "./github.js";
import { audit, canonical, DEFAULT_POLICY, type Finding, type Policy } from "./policy.js";

const USAGE_ERROR = 2;

type Options = {
  repo?: string;
  integrationBranch: string;
  requiredCheck: string[];
  allowOwnerPush: boolean;
  liveEnvironment: string;
  releaseEnvironment: string;
  secretName: string;
  allowAction: string[];
  yes?: boolean;
  backup?: string;
};

/** Collects a repeatable option; the first given value replaces `defaults` instead of extending it. */
const collect =
  (defaults: readonly string[]) =>
  (value: string, previous: string[]): string[] =>
    previous === defaults ? [value] : [...previous, value];

function policyOptions(command: Command): Command {
  return command
    .option("--repo <owner/name>", "repository; default: the one gh resolves here")
    .option(
      "--integration-branch <name>",
      "branch protected like the default branch, without required checks",
      DEFAULT_POLICY.integrationBranch,
    )
    .option(
      "--required-check <name>",
      "check the default branch requires (repeatable)",
      collect(DEFAULT_POLICY.requiredChecks),
      DEFAULT_POLICY.requiredChecks,
    )
    .option(
      "--allow-owner-push",
      "let admins push to protected branches directly, not only through pull requests",
      DEFAULT_POLICY.ownerPush,
    )
    .option(
      "--live-environment <name>",
      "environment holding the provider secret",
      DEFAULT_POLICY.liveEnvironment,
    )
    .option(
      "--release-environment <name>",
      "environment the release deploys from",
      DEFAULT_POLICY.releaseEnvironment,
    )
    .option(
      "--secret-name <name>",
      "provider secret, set only in the live environment",
      DEFAULT_POLICY.secretName,
    )
    .option(
      "--allow-action <pattern>",
      "third-party action pattern workflows may use (repeatable)",
      collect(DEFAULT_POLICY.allowedActions),
      DEFAULT_POLICY.allowedActions,
    );
}

async function policyFor(options: Options): Promise<Policy> {
  const full = options.repo ?? (await currentRepository());
  const [owner, repo] = full.split("/");
  if (!owner || !repo || full.split("/").length !== 2) {
    throw new Error(`--repo must be OWNER/NAME, not ${full}`);
  }
  return {
    owner,
    repo,
    integrationBranch: options.integrationBranch,
    requiredChecks: options.requiredCheck,
    ownerPush: options.allowOwnerPush,
    liveEnvironment: options.liveEnvironment,
    releaseEnvironment: options.releaseEnvironment,
    secretName: options.secretName,
    allowedActions: options.allowAction,
  };
}

const MARK: Record<Finding["state"], string> = {
  "already-set": "=",
  change: "~",
  manual: "!",
  unreadable: "?",
};

function printFindings(findings: Finding[]): void {
  for (const f of findings) {
    process.stdout.write(`${MARK[f.state]} ${f.resource}: ${f.detail}\n`);
    if (f.state === "change")
      for (const line of f.change.lines) process.stdout.write(`    ${line}\n`);
  }
  const count = (state: Finding["state"]): number =>
    findings.filter((f) => f.state === state).length;
  process.stdout.write(
    `\n${count("already-set")} already set, ${count("change")} to change, ${count("manual")} for a person, ${count("unreadable")} unreadable\n`,
  );
}

async function confirm(question: string): Promise<"yes" | "no" | "all" | "quit"> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (;;) {
      const answer = (await rl.question(`${question} [y]es / [n]o / [a]ll / [q]uit: `))
        .trim()
        .toLowerCase();
      if (answer === "y" || answer === "yes") return "yes";
      if (answer === "n" || answer === "no") return "no";
      if (answer === "a" || answer === "all") return "all";
      if (answer === "q" || answer === "quit") return "quit";
    }
  } finally {
    rl.close();
  }
}

type Outcome = { resource: string; result: string };

async function applyChanges(gh: Gh, policy: Policy, options: Options): Promise<number> {
  const findings = await audit(gh, policy);
  printFindings(findings);
  const changes = findings.flatMap((f) => (f.state === "change" ? [f.change] : []));
  if (changes.length === 0) return findings.some((f) => f.state === "unreadable") ? 1 : 0;
  if (!options.yes && !process.stdin.isTTY) {
    throw new Error("stdin is not a terminal; pass --yes to apply without confirmation");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = options.backup ?? join(tmpdir(), "pactwright-repository-settings");
  mkdirSync(dir, { recursive: true });
  const backup = join(dir, `${policy.owner}-${policy.repo}-${stamp}.json`);
  writeFileSync(
    backup,
    `${canonical({ repository: `${policy.owner}/${policy.repo}`, taken: stamp, before: changes.map((c) => ({ resource: c.resource, before: c.before })) })}\n`,
  );
  process.stdout.write(`\nbackup of the ${changes.length} resources to change: ${backup}\n\n`);

  const outcomes: Outcome[] = [];
  let all = options.yes === true;
  for (const change of changes) {
    if (!all) {
      const answer = await confirm(`apply ${change.resource}?`);
      if (answer === "quit") {
        outcomes.push(
          ...changes
            .slice(changes.indexOf(change))
            .map((c) => ({ resource: c.resource, result: "skipped" })),
        );
        break;
      }
      if (answer === "no") {
        outcomes.push({ resource: change.resource, result: "skipped" });
        continue;
      }
      if (answer === "all") all = true;
    }
    try {
      await change.apply();
    } catch (e) {
      outcomes.push({
        resource: change.resource,
        result: `rejected: ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }
    const still = await change.verify();
    outcomes.push({
      resource: change.resource,
      result: still === null ? "applied" : `applied, but read back differs: ${still}`,
    });
  }
  process.stdout.write("\nresults\n");
  for (const o of outcomes) process.stdout.write(`  ${o.resource}: ${o.result}\n`);
  const manual = findings.filter((f) => f.state === "manual");
  if (manual.length > 0) {
    process.stdout.write("\nfor you to do\n");
    for (const f of manual) process.stdout.write(`  ${f.resource}: ${f.detail}\n`);
  }
  return outcomes.every((o) => o.result === "applied") &&
    !findings.some((f) => f.state === "unreadable")
    ? 0
    : 1;
}

async function main(argv: string[]): Promise<number> {
  const program = new Command("repository-settings")
    .description("Idempotent GitHub repository governance through the gh CLI")
    .exitOverride()
    .configureOutput({ writeErr: (s) => process.stderr.write(s) });
  let code = 0;
  policyOptions(
    program.command("audit").description("read every governed setting; write nothing"),
  ).action(async (options: Options) => {
    const findings = await audit(ghClient(), await policyFor(options));
    printFindings(findings);
    code = findings.some((f) => f.state === "change" || f.state === "unreadable") ? 1 : 0;
  });
  policyOptions(
    program
      .command("apply")
      .description("bring every governed setting to the policy, asking before each change")
      .option("--yes", "apply every change without asking")
      .option(
        "--backup <dir>",
        "where the before-state backup is written; default: the OS temp directory",
      ),
  ).action(async (options: Options) => {
    const login = await currentLogin();
    if (login === null) throw new Error("gh is not authenticated; run gh auth login");
    process.stdout.write(`authenticated as ${login}\n`);
    code = await applyChanges(ghClient(), await policyFor(options), options);
  });
  try {
    await program.parseAsync(argv, { from: "user" });
    return code;
  } catch (e) {
    if (e instanceof CommanderError) return e.exitCode === 0 ? 0 : USAGE_ERROR;
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    return USAGE_ERROR;
  }
}

process.exitCode = await main(process.argv.slice(2));
