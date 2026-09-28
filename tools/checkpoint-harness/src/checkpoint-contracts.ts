// Validates checkpoint contract directories (Spec 00 §§2–3): the format schema,
// cross-file references, source citations, the conversion crosswalk and the
// reviewed prose of unconverted steps.
//
// Usage: pnpm contracts:check [--skip-source] [checkpoint-dir ...]
// The checkpoint harness (./contracts.ts) plans runs from loadCheckpointDir,
// so the checker and the harness share one validated parse.
// With no directory, every docs/checkpoints/* directory holding a
// checkpoint.yml is checked. --skip-source skips the verbatim crosswalk checks,
// which read the replaced checkpoint text from Git history. In a shallow clone,
// only the sources whose revision is absent are skipped, with a warning; in a
// full clone an unavailable source revision is an error.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, normalize, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Ajv2020 } from "ajv/dist/2020.js";
import yaml from "js-yaml";

export type Requirement = { source: string[]; statement: string };
export type Method = "automated" | "review" | "approval";
export type Criterion = {
  covers: string[];
  cases?: string[];
  given: string;
  when: string;
  then: string;
  verify: Partial<Record<Method, string[]>>;
};
/** A checkpoint.yml or step contract; its shape holds once the format schema accepted it. */
export type Contract = {
  id?: string;
  checkpoint?: string;
  run_model?: string;
  sources?: Record<string, string>;
  prose_steps?: Record<string, string>;
  requires?: string[];
  inputs?: Record<string, string>;
  uses?: string[];
  outputs?: Record<string, string>;
  requirements?: Record<string, Requirement>;
  acceptance?: Record<string, Criterion>;
  [key: string]: unknown;
};
type CrosswalkEntry = {
  key: string;
  text?: string;
  covered_by?: string[];
  allocated_to?: string;
};
type CrosswalkSource = { source?: string; steps?: string[]; reviewed?: Record<string, string> };
type Crosswalk = {
  sources?: CrosswalkSource[];
  entries?: CrosswalkEntry[];
  open_questions?: { id: string; affects?: string[] }[];
};

// The crosswalk is conversion evidence without a format schema; this checks
// only the shape the checks below read, so a malformed file is reported
// instead of crashing them.
const strings = { type: "array", items: { type: "string" } };
const CROSSWALK_SHAPE = {
  type: "object",
  properties: {
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string" },
          steps: strings,
          reviewed: { type: "object", additionalProperties: { type: "string" } },
        },
      },
    },
    entries: {
      type: "array",
      items: {
        type: "object",
        required: ["key"],
        properties: {
          key: { type: "string" },
          text: { type: "string" },
          covered_by: strings,
          allocated_to: { type: "string" },
        },
      },
    },
    open_questions: {
      type: "array",
      items: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" }, affects: strings },
      },
    },
  },
};

export type Unit = { key: string; text: string };

/** A checkpoint directory's parsed files; use them only when `errors` is empty. */
export type CheckpointLoad = {
  errors: string[];
  checkpoint: Contract | undefined;
  /** Step contracts by step ID, in file-name order. */
  steps: Map<string, Contract>;
  /** Each step contract's file bytes, by step ID. */
  stepTexts: Map<string, string>;
  /** Checkpoint markdown step sections, by step number. */
  sections: Map<number, Section>;
  /** Declared source keys resolved to absolute paths. */
  sources: Map<string, string>;
};
export type StepUnits = Record<string, { title: string; units: Unit[] }>;

export type ValidateOptions = {
  /** Skip checks that read the replaced checkpoint text from Git. */
  skipSource?: boolean;
  /**
   * Skip only the crosswalk sources whose revision is absent from the
   * repository, as in a shallow clone, and still check every reachable source.
   * Without it an unavailable source revision is an error.
   */
  skipUnavailableSources?: boolean;
  /** Called with each source skipped under skipUnavailableSources. */
  onSkippedSource?: (source: string) => void;
  /** Git working tree used to read the crosswalk source revisions. */
  gitDir?: string;
};

const git = (cwd: string, args: string[]): string =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function hasCommit(cwd: string, rev: string): boolean {
  try {
    git(cwd, ["cat-file", "-e", `${rev}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/** Whether the Git working tree is a shallow clone, which may lack older crosswalk sources. */
export function isShallowRepository(cwd: string): boolean {
  try {
    return git(cwd, ["rev-parse", "--is-shallow-repository"]).trim() === "true";
  } catch {
    return false;
  }
}

const STEP_KEYS = ["id", "requires", "inputs", "uses", "outputs", "requirements", "acceptance"];
const CRITERION_KEYS = ["covers", "cases", "given", "when", "then", "verify"];
const LABELS: Record<string, string> = {
  "**Run**": "run",
  "**Expected result**": "expected",
  "**Verify before continuing**": "verify",
};

const norm = (s: string): string => s.replace(/\s+/g, " ").trim();

const splitSentences = (line: string): string[] =>
  line
    .trim()
    .split(/(?<=[.])\s+(?=[A-Z`])/)
    .map(norm)
    .filter(Boolean);

export type Section = { intro: string[]; heading: string; title: string; lines: string[] };

const STEP_HEADING = /^### Step (\d+) — (.*)$/;

/** Step numbers in heading order, repeats included. */
export function stepHeadings(markdown: string): number[] {
  return markdown
    .split("\n")
    .map((line) => STEP_HEADING.exec(line))
    .filter((m) => m !== null)
    .map((m) => Number(m[1]));
}

/**
 * Each step section: its `### Step N — title` heading and the lines up to the
 * next step or `##` heading. The first step after a `##` heading also carries
 * that heading and the lines before the step as its intro, such as a stage's
 * introduction.
 */
export function stepSections(markdown: string): Map<number, Section> {
  const sections = new Map<number, Section>();
  let current: number | undefined;
  let intro: string[] = [];
  for (const line of markdown.split("\n")) {
    const heading = STEP_HEADING.exec(line);
    if (heading) {
      current = Number(heading[1]);
      sections.set(current, { intro, heading: line, title: heading[2] ?? "", lines: [] });
      intro = [];
      continue;
    }
    if (line.startsWith("## ")) {
      current = undefined;
      intro = [line];
      continue;
    }
    if (current !== undefined) sections.get(current)?.lines.push(line);
    else if (intro.length > 0) intro.push(line);
  }
  return sections;
}

/**
 * SHA-256, as recorded in `prose_steps` (Spec 00 §2), of a step's intro,
 * heading and lines: UTF-8, each line without trailing whitespace, trailing
 * blank lines removed, joined by LF with no final newline.
 */
export function proseHash(section: Section): string {
  const lines = [...section.intro, section.heading, ...section.lines].map((l) => l.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return `sha256:${createHash("sha256").update(lines.join("\n"), "utf8").digest("hex")}`;
}

/** Splits prompt-style step prose (References/Run/Expected/Verify) into keyed units. */
export function splitUnits(markdown: string): StepUnits {
  const result: StepUnits = {};
  for (const [num, section] of stepSections(markdown)) {
    const sid = `S${String(num).padStart(2, "0")}`;
    const units: Unit[] = [];
    const counters = new Map<string, number>();
    let part: string | undefined;
    let inCode = false;
    let inIntro = false;
    let para: string[] = [];
    const emit = (p: string, text: string): void => {
      const n = (counters.get(p) ?? 0) + 1;
      counters.set(p, n);
      units.push({ key: `${sid}.${p}.${n}`, text });
    };
    const flush = (): void => {
      if (para.length > 0 && part) {
        const p = part;
        splitSentences(para.map((x) => x.trim()).join(" ")).forEach((s) => emit(p, s));
      }
      para = [];
    };
    const feed = (raw: string): void => {
      const line = raw.trimEnd();
      if (line.startsWith("```")) {
        flush();
        inCode = !inCode;
        return;
      }
      if (inCode) {
        if (line.trim() && part) emit(part, norm(line));
        return;
      }
      // Inside a stage introduction, labels are plain text.
      const refs = inIntro ? null : /^\*\*References:\*\*\s*(.*)$/.exec(line);
      if (refs) {
        flush();
        units.push({ key: `${sid}.references`, text: norm(refs[1] ?? "") });
        return;
      }
      const label = inIntro ? undefined : LABELS[line.trim()];
      if (label) {
        flush();
        part = label;
        return;
      }
      if (!line.trim()) {
        flush();
        return;
      }
      if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
        flush();
        const p = part;
        if (p) splitSentences(line.replace(/^\s*([-*]|\d+\.) /, "")).forEach((s) => emit(p, s));
        return;
      }
      para.push(line);
    };
    // A stage introduction before the step (its lines after the `##` heading)
    // becomes `intro` units, so a conversion must quote it (Spec 00 §2).
    part = "intro";
    inIntro = true;
    section.intro.slice(1).forEach(feed);
    flush();
    // Step prose before its first Run/Expected/Verify label becomes `body` units.
    part = "body";
    inIntro = false;
    inCode = false;
    section.lines.forEach(feed);
    flush();
    result[sid] = { title: section.title, units };
  }
  return result;
}

/** GitHub heading anchor slug. */
export function githubSlug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]/gu, "")
    .replaceAll(" ", "-");
}

const anchorCache = new Map<string, { numbers: Set<string>; slugs: Set<string> }>();

/** Numbered-section and GitHub-anchor headings of a markdown source. */
export function anchors(path: string): { numbers: Set<string>; slugs: Set<string> } {
  const cached = anchorCache.get(path);
  if (cached) return cached;
  const numbers = new Set<string>();
  const slugs = new Set<string>();
  let inCode = false;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const heading = /^#+\s+(.*?)\s*$/.exec(line);
    if (!heading) continue;
    const title = heading[1] ?? "";
    const numbered = /^(\d+)\.\s/.exec(title);
    if (numbered?.[1]) numbers.add(numbered[1]);
    slugs.add(githubSlug(title));
  }
  const result = { numbers, slugs };
  anchorCache.set(path, result);
  return result;
}

function sequential(prefix: string, keys: string[]): boolean {
  return keys.every((k, i) => k === `${prefix}${String(i + 1).padStart(2, "0")}`);
}

function ordered(keys: string[], order: string[]): boolean {
  const expected = order.filter((k) => keys.includes(k));
  return keys.length === expected.length && keys.every((k, i) => k === expected[i]);
}

/** Returns one message per error found in a checkpoint contract directory. */
export function validateCheckpointDir(
  repoRoot: string,
  checkpointDir: string,
  options: ValidateOptions = {},
): string[] {
  return loadCheckpointDir(repoRoot, checkpointDir, options).errors;
}

/** Parses and validates a checkpoint contract directory, returning its errors and parsed files. */
export function loadCheckpointDir(
  repoRoot: string,
  checkpointDir: string,
  options: ValidateOptions = {},
): CheckpointLoad {
  const errors: string[] = [];
  const steps = new Map<string, Contract>();
  const stepTexts = new Map<string, string>();
  const result = (): CheckpointLoad => ({
    errors,
    checkpoint,
    steps,
    stepTexts,
    sections,
    sources,
  });
  const dir = join(repoRoot, checkpointDir);
  const rel = (p: string): string => relative(repoRoot, p);
  const schema = JSON.parse(
    readFileSync(join(repoRoot, "docs/checkpoints/contract.schema.json"), "utf8"),
  ) as object;
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);
  const validateCrosswalk = ajv.compile<Crosswalk>(CROSSWALK_SHAPE);
  // Parses YAML, reporting duplicate keys and syntax errors instead of throwing.
  const parse = (file: string, text: string): unknown => {
    try {
      return yaml.load(text);
    } catch (e) {
      errors.push(
        `${rel(file)}: yaml: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`,
      );
      return undefined;
    }
  };
  // Returns a document only once the format schema accepts it; a rejected
  // document's shape is unknown, so no further check reads it.
  const load = (file: string, text = readFileSync(file, "utf8")): Contract | undefined => {
    const data = parse(file, text) as Contract | undefined;
    if (data === undefined) return undefined;
    if (!validate(data)) {
      for (const e of validate.errors ?? []) {
        errors.push(`${rel(file)}: schema: ${e.instancePath || "/"} ${e.message ?? ""}`);
      }
      return undefined;
    }
    return data;
  };

  const checkpointFile = join(dir, "checkpoint.yml");
  const found = existsSync(checkpointFile);
  const checkpoint = found ? load(checkpointFile) : undefined;
  const sources = new Map<string, string>();
  let sections = new Map<number, Section>();
  if (!found) errors.push(`${rel(dir)}: checkpoint.yml missing`);
  if (!checkpoint) return result();
  const cpid = checkpoint.checkpoint ?? "";
  for (const [key, path] of Object.entries(checkpoint.sources ?? {})) {
    const resolved = normalize(join(dir, path));
    const fromRoot = relative(repoRoot, resolved);
    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
      errors.push(`${rel(checkpointFile)}: source ${key} escapes the repository: ${path}`);
    } else if (existsSync(resolved)) sources.set(key, resolved);
    else errors.push(`${rel(checkpointFile)}: source ${key} does not exist: ${path}`);
  }

  const ids = new Set<string>();
  const checkRefs = (where: string, reqs: Record<string, Requirement>): void => {
    for (const [rid, req] of Object.entries(reqs)) {
      for (const ref of req.source ?? []) {
        const [key = "", anchor = ""] = ref.split("#");
        const path = sources.get(key);
        if (!path) {
          errors.push(`${where}/${rid}: undeclared source key ${key}`);
          continue;
        }
        const { numbers, slugs } = anchors(path);
        if (/^\d+$/.test(anchor) ? !numbers.has(anchor) : !slugs.has(anchor)) {
          errors.push(`${where}/${rid}: ${ref} does not resolve to a heading`);
        }
      }
    }
  };
  const checkCoverage = (where: string, doc: Contract): void => {
    const reqs = doc.requirements ?? {};
    const acc = doc.acceptance ?? {};
    const covered = new Set<string>();
    for (const [aid, criterion] of Object.entries(acc)) {
      for (const c of criterion.covers ?? []) {
        if (!(c in reqs)) errors.push(`${where}/${aid}: covers unknown ${c}`);
        covered.add(c);
      }
    }
    for (const rid of Object.keys(reqs)) {
      if (!covered.has(rid)) errors.push(`${where}/${rid}: not covered by any criterion`);
    }
    if (!sequential("R", Object.keys(reqs)))
      errors.push(`${where}: requirement IDs not sequential`);
    if (!sequential("AC", Object.keys(acc))) errors.push(`${where}: criterion IDs not sequential`);
    for (const k of Object.keys(reqs)) ids.add(`${where}/${k}`);
    for (const k of Object.keys(acc)) ids.add(`${where}/${k}`);
  };

  if (checkpoint.requirements) {
    checkRefs(cpid, checkpoint.requirements);
    checkCoverage(cpid, checkpoint);
  }

  const markdown = existsSync(`${dir}.md`) ? readFileSync(`${dir}.md`, "utf8") : "";
  const stepFiles = readdirSync(dir)
    .filter((f) => /^CP\d{2}-S\d{2}\.yml$/.test(f))
    .sort();
  const stepIds: string[] = [];
  for (const file of stepFiles) {
    const path = join(dir, file);
    const sid = basename(file, ".yml");
    const num = Number(sid.slice(-2));
    stepIds.push(sid);
    const text = readFileSync(path, "utf8");
    const doc = load(path, text);
    if (!doc) continue;
    steps.set(sid, doc);
    stepTexts.set(sid, text);
    if (doc.id !== sid) errors.push(`${rel(path)}: id ${String(doc.id)} does not match file name`);
    const heading = new RegExp(`^### Step ${num} — (.*)$`, "m").exec(markdown)?.[1];
    const first = text.split("\n")[0];
    if (first !== `# ${cpid} Step ${num} — ${heading ?? "?"}`) {
      errors.push(
        `${rel(path)}: first line must be "# ${cpid} Step ${num} — <checkpoint heading>"`,
      );
    }
    if (!ordered(Object.keys(doc), STEP_KEYS)) errors.push(`${rel(path)}: top-level key order`);
    for (const [aid, criterion] of Object.entries(doc.acceptance ?? {})) {
      if (!ordered(Object.keys(criterion), CRITERION_KEYS)) {
        errors.push(`${rel(path)}/${aid}: criterion key order`);
      }
    }
    for (const req of doc.requires ?? []) {
      if (!req.startsWith(`${cpid}-S`) || Number(req.slice(-2)) >= num) {
        errors.push(`${rel(path)}: requires ${req} is not an earlier step of ${cpid}`);
      } else if (
        !existsSync(join(dir, `${req}.yml`)) &&
        !markdown.includes(`### Step ${Number(req.slice(-2))} — `)
      ) {
        errors.push(`${rel(path)}: requires ${req}, which does not exist`);
      }
    }
    checkRefs(sid, doc.requirements ?? {});
    checkCoverage(sid, doc);
  }

  // Every step is either converted to a contract or kept as reviewed prose (Spec 00 §2).
  const headings = stepHeadings(markdown);
  for (const num of new Set(headings.filter((n, i) => headings.indexOf(n) !== i))) {
    errors.push(`Step ${num} has more than one heading`);
  }
  sections = stepSections(markdown);
  const prose = checkpoint.prose_steps ?? {};
  for (const [sid, hash] of Object.entries(prose)) {
    const section = sid.startsWith(`${cpid}-S`) ? sections.get(Number(sid.slice(-2))) : undefined;
    if (stepIds.includes(sid)) errors.push(`${sid} has both a contract and a prose_steps entry`);
    else if (!section) errors.push(`prose step ${sid} has no step heading in ${rel(`${dir}.md`)}`);
    else if (proseHash(section) !== hash) {
      errors.push(`prose step ${sid} differs from its reviewed text (${proseHash(section)})`);
    }
  }
  for (const num of sections.keys()) {
    const sid = `${cpid}-S${String(num).padStart(2, "0")}`;
    if (!stepIds.includes(sid) && !(sid in prose)) {
      errors.push(`Step ${num} has neither a contract nor a prose_steps entry`);
    }
  }

  const crosswalkFile = join(dir, "crosswalk.yml");
  if (!existsSync(crosswalkFile)) {
    if (stepIds.length > 0) errors.push(`${rel(dir)}: crosswalk.yml missing`);
    return result();
  }
  const crosswalk = parse(crosswalkFile, readFileSync(crosswalkFile, "utf8"));
  if (crosswalk === undefined) return result();
  if (!validateCrosswalk(crosswalk)) {
    for (const e of validateCrosswalk.errors ?? []) {
      errors.push(`${rel(crosswalkFile)}: schema: ${e.instancePath || "/"} ${e.message ?? ""}`);
    }
    return result();
  }

  // Each converted step quotes the checkpoint revision whose prose it replaced.
  const sourceOf = new Map<string, string>();
  const reviewedOf = new Map<string, string>();
  for (const { source = "", steps: listed = [], reviewed = {} } of crosswalk.sources ?? []) {
    for (const [sid, hash] of Object.entries(reviewed)) {
      if (!listed.includes(sid))
        errors.push(`crosswalk: ${source} has a reviewed hash for unlisted ${sid}`);
      reviewedOf.set(sid, hash);
    }
    for (const sid of listed) {
      if (sourceOf.has(sid)) {
        errors.push(`crosswalk: ${sid} is listed in more than one source`);
        continue;
      }
      if (!stepIds.includes(sid))
        errors.push(`crosswalk: ${source} lists ${sid}, which has no contract`);
      sourceOf.set(sid, source);
    }
  }
  for (const sid of stepIds) {
    if (!sourceOf.has(sid)) errors.push(`crosswalk: ${sid} has no source`);
  }

  // Replaced units by step key ("S06"); null when the step's source could not be read.
  let units: Map<string, Unit[] | null> | undefined;
  if (!options.skipSource) {
    units = new Map();
    const parsed = new Map<string, StepUnits | null>();
    const texts = new Map<string, string>();
    for (const [sid, source] of sourceOf) {
      if (!parsed.has(source)) {
        const [sourcePath, rev = ""] = source.split("@");
        const cwd = options.gitDir ?? repoRoot;
        if (options.skipUnavailableSources && !hasCommit(cwd, rev)) {
          options.onSkippedSource?.(source);
          parsed.set(source, null);
        } else {
          try {
            const text = git(cwd, ["show", `${rev}:${sourcePath}`]);
            texts.set(source, text);
            parsed.set(source, splitUnits(text));
          } catch {
            errors.push(`crosswalk: cannot read source ${source || "(none)"} from Git`);
            parsed.set(source, null);
          }
        }
      }
      const text = parsed.get(source);
      const step = `S${sid.slice(-2)}`;
      const stepUnits = text === null ? null : (text?.[step]?.units ?? []);
      if (stepUnits?.length === 0) errors.push(`crosswalk: ${source} has no prose for ${sid}`);
      units.set(step, stepUnits ?? null);
      // A converted step that was reviewed as prose replaced exactly that prose.
      const reviewed = reviewedOf.get(sid);
      const sourceText = texts.get(source);
      const section =
        sourceText === undefined ? undefined : stepSections(sourceText).get(Number(sid.slice(-2)));
      if (reviewed && section && proseHash(section) !== reviewed) {
        errors.push(`crosswalk: ${source} prose for ${sid} differs from its reviewed hash`);
      }
    }
  }

  const seen = new Set<string>();
  const stepPrefix = new RegExp(`^${cpid}-S\\d{2}$`);
  for (const entry of crosswalk.entries ?? []) {
    if (seen.has(entry.key)) errors.push(`crosswalk: duplicate key ${entry.key}`);
    seen.add(entry.key);
    const stepUnits = units?.get(entry.key.split(".")[0] ?? "");
    if (units && stepUnits !== null) {
      const unit = stepUnits?.find((u) => u.key === entry.key);
      if (!unit) errors.push(`crosswalk: unknown key ${entry.key}`);
      else if (norm(entry.text ?? "") !== unit.text) {
        errors.push(`crosswalk: text for ${entry.key} is not the verbatim source unit`);
      }
    }
    for (const id of entry.covered_by ?? []) {
      if (!ids.has(id)) errors.push(`crosswalk: ${entry.key} covered_by unknown id ${id}`);
    }
    if ((entry.covered_by ?? []).length === 0 && !entry.allocated_to) {
      errors.push(`crosswalk: ${entry.key} is neither covered nor allocated`);
    }
    if (entry.allocated_to && !stepPrefix.test(entry.allocated_to)) {
      errors.push(
        `crosswalk: ${entry.key} allocated_to ${entry.allocated_to} is not a ${cpid} step`,
      );
    }
  }
  for (const stepUnits of units?.values() ?? []) {
    for (const unit of stepUnits ?? []) {
      if (!seen.has(unit.key)) errors.push(`crosswalk: missing key ${unit.key}`);
    }
  }
  for (const question of crosswalk.open_questions ?? []) {
    for (const id of question.affects ?? []) {
      if (!ids.has(id) && !stepPrefix.test(id)) {
        errors.push(`crosswalk: ${question.id} affects unknown id ${id}`);
      }
    }
  }
  return result();
}

/** Every docs/checkpoints subdirectory that declares a checkpoint.yml. */
export function checkpointDirs(repoRoot: string): string[] {
  const base = join(repoRoot, "docs/checkpoints");
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(base, d.name, "checkpoint.yml")))
    .map((d) => join("docs/checkpoints", d.name))
    .sort();
}

function main(argv: string[]): number {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const skipSource = argv.includes("--skip-source");
  const skipUnavailableSources = isShallowRepository(repoRoot);
  const dirs = argv.filter((a) => !a.startsWith("--"));
  let failed = 0;
  for (const dir of dirs.length > 0 ? dirs : checkpointDirs(repoRoot)) {
    const errors = validateCheckpointDir(repoRoot, dir, {
      skipSource,
      skipUnavailableSources,
      onSkippedSource: (source) =>
        console.warn(`${dir}: ${source} is not in this shallow clone; its quotes were not checked`),
    });
    for (const e of errors) console.error(`${dir}: ${e}`);
    console.log(`${dir}: ${errors.length === 0 ? "ok" : `${errors.length} error(s)`}`);
    failed += errors.length;
  }
  return failed === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
