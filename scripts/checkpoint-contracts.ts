// Validates checkpoint contract directories (Spec 00 §§2–3): the format schema,
// cross-file references, source citations and the conversion crosswalk.
//
// Usage: pnpm contracts:check [--skip-source] [checkpoint-dir ...]
// With no directory, every docs/checkpoints/* directory holding a
// checkpoint.yml is checked. --skip-source skips the verbatim crosswalk checks,
// which read the replaced checkpoint text from Git history.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Ajv2020 } from "ajv/dist/2020.js";
import yaml from "js-yaml";

type Requirement = { source: string[]; statement: string };
type Criterion = { covers: string[]; cases?: string[]; verify: Record<string, string[]> };
type Contract = {
  id?: string;
  checkpoint?: string;
  sources?: Record<string, string>;
  requires?: string[];
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
type CrosswalkSource = { source?: string; steps?: string[] };
type Crosswalk = {
  sources?: CrosswalkSource[];
  entries?: CrosswalkEntry[];
  open_questions?: { id: string; affects: string[] }[];
};

export type Unit = { key: string; text: string };
export type StepUnits = Record<string, { title: string; units: Unit[] }>;

export type ValidateOptions = {
  /** Skip checks that read the replaced checkpoint text from Git. */
  skipSource?: boolean;
  /** Git working tree used to read the crosswalk source revision. */
  gitDir?: string;
};

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

/** Splits prompt-style step prose (References/Run/Expected/Verify) into keyed units. */
export function splitUnits(markdown: string): StepUnits {
  const sections = new Map<number, { title: string; lines: string[] }>();
  let current: number | undefined;
  for (const line of markdown.split("\n")) {
    const heading = /^### Step (\d+) — (.*)$/.exec(line);
    if (heading) {
      current = Number(heading[1]);
      sections.set(current, { title: heading[2] ?? "", lines: [] });
      continue;
    }
    if (line.startsWith("## ")) {
      current = undefined;
      continue;
    }
    if (current !== undefined) sections.get(current)?.lines.push(line);
  }

  const result: StepUnits = {};
  for (const [num, section] of sections) {
    const sid = `S${String(num).padStart(2, "0")}`;
    const units: Unit[] = [];
    const counters = new Map<string, number>();
    let part: string | undefined;
    let inCode = false;
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
    for (const raw of section.lines) {
      const line = raw.trimEnd();
      if (line.startsWith("```")) {
        flush();
        inCode = !inCode;
        continue;
      }
      if (inCode) {
        if (line.trim() && part) emit(part, norm(line));
        continue;
      }
      const refs = /^\*\*References:\*\*\s*(.*)$/.exec(line);
      if (refs) {
        flush();
        units.push({ key: `${sid}.references`, text: norm(refs[1] ?? "") });
        continue;
      }
      const label = LABELS[line.trim()];
      if (label) {
        flush();
        part = label;
        continue;
      }
      if (!line.trim()) {
        flush();
        continue;
      }
      if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
        flush();
        const p = part;
        if (p) splitSentences(line.replace(/^\s*([-*]|\d+\.) /, "")).forEach((s) => emit(p, s));
        continue;
      }
      para.push(line);
    }
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

function anchors(path: string): { numbers: Set<string>; slugs: Set<string> } {
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
  const errors: string[] = [];
  const dir = join(repoRoot, checkpointDir);
  const rel = (p: string): string => relative(repoRoot, p);
  const schema = JSON.parse(
    readFileSync(join(repoRoot, "docs/checkpoints/contract.schema.json"), "utf8"),
  ) as object;
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  const load = (file: string): Contract => {
    const data = yaml.load(readFileSync(file, "utf8")) as Contract;
    if (!validate(data)) {
      for (const e of validate.errors ?? []) {
        errors.push(`${rel(file)}: schema: ${e.instancePath || "/"} ${e.message ?? ""}`);
      }
    }
    return data;
  };

  const checkpointFile = join(dir, "checkpoint.yml");
  if (!existsSync(checkpointFile)) return [`${rel(dir)}: checkpoint.yml missing`];
  const checkpoint = load(checkpointFile);
  const cpid = checkpoint.checkpoint ?? "";
  const sources = new Map<string, string>();
  for (const [key, path] of Object.entries(checkpoint.sources ?? {})) {
    const resolved = normalize(join(dir, path));
    if (existsSync(resolved)) sources.set(key, resolved);
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
  const steps: string[] = [];
  for (const file of stepFiles) {
    const path = join(dir, file);
    const sid = basename(file, ".yml");
    const num = Number(sid.slice(-2));
    steps.push(sid);
    const doc = load(path);
    if (doc.id !== sid) errors.push(`${rel(path)}: id ${String(doc.id)} does not match file name`);
    const heading = new RegExp(`^### Step ${num} — (.*)$`, "m").exec(markdown)?.[1];
    const first = readFileSync(path, "utf8").split("\n")[0];
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

  const crosswalkFile = join(dir, "crosswalk.yml");
  if (!existsSync(crosswalkFile)) {
    if (steps.length > 0) errors.push(`${rel(dir)}: crosswalk.yml missing`);
    return errors;
  }
  const crosswalk = yaml.load(readFileSync(crosswalkFile, "utf8")) as Crosswalk;

  // Each converted step quotes the checkpoint revision whose prose it replaced.
  const sourceOf = new Map<string, string>();
  for (const { source = "", steps: listed = [] } of crosswalk.sources ?? []) {
    for (const sid of listed) {
      if (sourceOf.has(sid)) {
        errors.push(`crosswalk: ${sid} is listed in more than one source`);
        continue;
      }
      if (!steps.includes(sid))
        errors.push(`crosswalk: ${source} lists ${sid}, which has no contract`);
      sourceOf.set(sid, source);
    }
  }
  for (const sid of steps) {
    if (!sourceOf.has(sid)) errors.push(`crosswalk: ${sid} has no source`);
  }

  // Replaced units by step key ("S06"); null when the step's source could not be read.
  let units: Map<string, Unit[] | null> | undefined;
  if (!options.skipSource) {
    units = new Map();
    const parsed = new Map<string, StepUnits | null>();
    for (const [sid, source] of sourceOf) {
      if (!parsed.has(source)) {
        const [sourcePath, rev] = source.split("@");
        try {
          const text = execFileSync("git", ["show", `${rev}:${sourcePath}`], {
            cwd: options.gitDir ?? repoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
          });
          parsed.set(source, splitUnits(text));
        } catch {
          errors.push(`crosswalk: cannot read source ${source || "(none)"} from Git`);
          parsed.set(source, null);
        }
      }
      const text = parsed.get(source);
      const step = `S${sid.slice(-2)}`;
      const stepUnits = text === null ? null : (text?.[step]?.units ?? []);
      if (stepUnits?.length === 0) errors.push(`crosswalk: ${source} has no prose for ${sid}`);
      units.set(step, stepUnits ?? null);
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
  return errors;
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
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const skipSource = argv.includes("--skip-source");
  const dirs = argv.filter((a) => !a.startsWith("--"));
  let failed = 0;
  for (const dir of dirs.length > 0 ? dirs : checkpointDirs(repoRoot)) {
    const errors = validateCheckpointDir(repoRoot, dir, { skipSource });
    for (const e of errors) console.error(`${dir}: ${e}`);
    console.log(`${dir}: ${errors.length === 0 ? "ok" : `${errors.length} error(s)`}`);
    failed += errors.length;
  }
  return failed === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
