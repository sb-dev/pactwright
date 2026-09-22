/**
 * A1 baseline source accounting for the reimplementation trial.
 *
 * Measures one checkout and reports each kind of material separately, because a
 * single "lines of code" number cannot be compared honestly between a reference
 * and a candidate: comments, tests, prompts and dependencies move independently
 * and each can be traded against the others.
 *
 * Invocation (from the planning checkout, against any checkout root):
 *
 *   node --import tsx tools/implementation-trial/measure-source.ts \
 *     --root /path/to/checkout --label reference [--json]
 *
 * The group definitions below are the measurement denominators. A1 records them
 * as *provisional*: A4 owns freezing comparable accounting before any candidate
 * result exists, and may redefine these groups. Nothing here is a threshold, a
 * score or a gate.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** One measured kind of material. `subsetOf` marks a group counted twice on purpose. */
interface Group {
  readonly id: string;
  readonly what: string;
  /** Directories walked, relative to the checkout root. */
  readonly dirs: readonly string[];
  /** A file is included when this returns true for its path relative to the root. */
  readonly include: (path: string) => boolean;
  /** Set when this group's files are already counted inside another group. */
  readonly subsetOf?: string;
}

const isTs = (path: string): boolean => path.endsWith(".ts") && !path.endsWith(".d.ts");
const isMd = (path: string): boolean => path.endsWith(".md");
const inDir = (path: string, dir: string): boolean => path.startsWith(`${dir}/`);

const GROUPS: readonly Group[] = [
  {
    id: "runtime-source",
    what: "the published runtime and CLI",
    dirs: ["src"],
    include: isTs,
  },
  {
    id: "prompts-embedded",
    what: "agent-facing prompt text held inside runtime source",
    dirs: ["src/adapter"],
    include: (path) => path === "src/adapter/commands.ts",
    subsetOf: "runtime-source",
  },
  {
    id: "pack-source",
    what: "the default agent pack's own source",
    dirs: ["packages/standard/src"],
    include: isTs,
  },
  {
    id: "tests",
    what: "test drivers",
    dirs: ["tests"],
    include: (path) => isTs(path) && !inDir(path, "tests/fixtures"),
  },
  {
    id: "test-fixtures",
    what: "fixture data the tests read",
    dirs: ["tests/fixtures"],
    include: () => true,
  },
  {
    id: "prompts-pack",
    what: "agent prompts and skills shipped by the pack",
    dirs: ["packages/standard/agents", "packages/standard/skills"],
    include: isMd,
  },
  {
    id: "prompts-generated",
    what: "the rendered Claude Code adapter surface",
    dirs: [".claude/agents", ".claude/commands"],
    include: isMd,
  },
  {
    id: "specs",
    what: "canonical specifications",
    dirs: ["docs/specs"],
    include: isMd,
  },
  {
    id: "checkpoints",
    what: "checkpoint instructions",
    dirs: ["docs/checkpoints"],
    include: isMd,
  },
  {
    id: "graph-records",
    what: "the repository's own Delivery Graph",
    dirs: ["specs"],
    include: (path) => isMd(path) || path.endsWith(".yml"),
  },
  {
    id: "workflows",
    what: "repository CI configuration",
    dirs: [".github/workflows"],
    include: (path) => path.endsWith(".yml") || path.endsWith(".yaml"),
  },
];

interface Counts {
  files: number;
  bytes: number;
  lines: number;
  blank: number;
  /** Lines carrying comment text and no code. */
  comment: number;
  /** Lines carrying code, whether or not they also carry a trailing comment. */
  code: number;
  /** Lines carrying both, already counted in `code`. */
  mixed: number;
}

const emptyCounts = (): Counts => ({
  files: 0,
  bytes: 0,
  lines: 0,
  blank: 0,
  comment: 0,
  code: 0,
  mixed: 0,
});

/**
 * Classifies each line of a TypeScript source as blank, comment-only or code.
 *
 * The scanner tracks strings and template literals so that a `//` inside one is
 * not read as a comment. Regular-expression literals are recognised by the usual
 * heuristic — a `/` is a regex only where an operand cannot appear — which is
 * ambiguous in a handful of constructs; the residual error is a line or two per
 * file and is reported here rather than hidden.
 */
function scanTypeScript(text: string, counts: Counts): void {
  const REGEX_MAY_FOLLOW = new Set("(,=:[!&|?{};+-*%~^<>".split(""));
  let state: "code" | "line-comment" | "block-comment" | "string" | "template" = "code";
  let quote = "";
  let templateDepth = 0;
  let lastSignificant = "";
  let hasCode = false;
  let hasComment = false;

  const endLine = (): void => {
    counts.lines += 1;
    if (hasCode && hasComment) counts.mixed += 1;
    if (hasCode) counts.code += 1;
    else if (hasComment) counts.comment += 1;
    else counts.blank += 1;
    hasCode = false;
    hasComment = false;
    if (state === "line-comment") state = "code";
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] as string;
    const next = text[i + 1];

    if (char === "\n") {
      endLine();
      continue;
    }
    if (char === "\r") continue;

    switch (state) {
      case "line-comment":
        if (char.trim() !== "") hasComment = true;
        break;

      case "block-comment":
        if (char.trim() !== "") hasComment = true;
        if (char === "*" && next === "/") {
          state = "code";
          i += 1;
        }
        break;

      case "string":
        hasCode = true;
        if (char === "\\") i += 1;
        else if (char === quote) state = "code";
        break;

      case "template":
        hasCode = true;
        if (char === "\\") i += 1;
        else if (char === "$" && next === "{") {
          templateDepth += 1;
          i += 1;
        } else if (char === "}" && templateDepth > 0) templateDepth -= 1;
        else if (char === "`" && templateDepth === 0) state = "code";
        break;

      case "code":
        if (char === "/" && next === "/") {
          state = "line-comment";
          hasComment = true;
          i += 1;
        } else if (char === "/" && next === "*") {
          state = "block-comment";
          hasComment = true;
          i += 1;
        } else if (char === '"' || char === "'") {
          state = "string";
          quote = char;
          hasCode = true;
        } else if (char === "`") {
          state = "template";
          templateDepth = 0;
          hasCode = true;
        } else if (char === "/" && REGEX_MAY_FOLLOW.has(lastSignificant)) {
          // A regular-expression literal: consume it so its contents cannot be
          // mistaken for a comment or an unterminated string.
          i += 1;
          while (i < text.length && text[i] !== "/" && text[i] !== "\n") {
            if (text[i] === "\\") i += 1;
            else if (text[i] === "[") {
              while (i < text.length && text[i] !== "]" && text[i] !== "\n") {
                if (text[i] === "\\") i += 1;
                i += 1;
              }
            }
            i += 1;
          }
          hasCode = true;
        } else if (char.trim() !== "") hasCode = true;
        break;
    }

    if (state === "code" && char.trim() !== "") lastSignificant = char;
  }

  if (hasCode || hasComment || text.endsWith("\n") === false) endLine();
}

/** Markdown and YAML: only a leading `#` on a YAML line is a comment. */
function scanPlain(text: string, counts: Counts, yaml: boolean): void {
  for (const line of text.split("\n")) {
    counts.lines += 1;
    const trimmed = line.trim();
    if (trimmed === "") counts.blank += 1;
    else if (yaml && trimmed.startsWith("#")) counts.comment += 1;
    else counts.code += 1;
  }
  if (text.endsWith("\n")) counts.lines -= 1;
}

function walk(root: string, dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    if (entry.isDirectory()) walk(root, path, out);
    else if (entry.isFile()) out.push(path);
  }
}

function measure(root: string, group: Group): Counts {
  const counts = emptyCounts();
  const files: string[] = [];
  for (const dir of group.dirs) walk(root, dir, files);
  for (const path of new Set(files)) {
    if (!group.include(path)) continue;
    const absolute = join(root, path);
    counts.files += 1;
    counts.bytes += statSync(absolute).size;
    const text = readFileSync(absolute, "utf8");
    if (isTs(path)) scanTypeScript(text, counts);
    else scanPlain(text, counts, path.endsWith(".yml") || path.endsWith(".yaml"));
  }
  return counts;
}

interface PackageDependencies {
  readonly manifest: string;
  readonly runtime: readonly string[];
  readonly development: readonly string[];
}

function dependenciesOf(root: string, manifest: string): PackageDependencies | undefined {
  let parsed: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    parsed = JSON.parse(readFileSync(join(root, manifest), "utf8")) as typeof parsed;
  } catch {
    return undefined;
  }
  const names = (record: Record<string, string> | undefined): string[] =>
    Object.entries(record ?? {})
      .map(([name, range]) => `${name}@${range}`)
      .sort();
  return {
    manifest,
    runtime: names(parsed.dependencies),
    development: names(parsed.devDependencies),
  };
}

/** Counts resolved packages in a pnpm lockfile without interpreting its semantics. */
function lockedPackages(root: string): number | null {
  let text: string;
  try {
    text = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
  } catch {
    return null;
  }
  const resolutions = new Set<string>();
  let inPackages = false;
  for (const line of text.split("\n")) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line)) break;
    const match = inPackages ? /^ {2}(\S+):\s*$/.exec(line) : null;
    if (match?.[1] !== undefined) resolutions.add(match[1].replace(/^'|'$/g, ""));
  }
  return resolutions.size;
}

function headOf(root: string): string | null {
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function parseArguments(argv: readonly string[]): { root: string; label: string; json: boolean } {
  let root = process.cwd();
  let label = "";
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (argument === "--root" && argv[i + 1] !== undefined) root = argv[(i += 1)] as string;
    else if (argument === "--label" && argv[i + 1] !== undefined) label = argv[(i += 1)] as string;
    else if (argument === "--json") json = true;
    else throw new Error(`measure-source: unexpected argument "${argument}"`);
  }
  return { root, label: label === "" ? relative(process.cwd(), root) || "." : label, json };
}

function pad(value: string | number, width: number): string {
  return String(value).padStart(width);
}

const { root, label, json } = parseArguments(process.argv.slice(2));
const report = {
  tool: "tools/implementation-trial/measure-source.ts",
  accounting_version: 1,
  status: "provisional — A4 owns the frozen comparable accounting",
  label,
  root,
  head: headOf(root),
  groups: GROUPS.map((group) => ({
    id: group.id,
    what: group.what,
    ...(group.subsetOf === undefined ? {} : { subset_of: group.subsetOf }),
    ...measure(root, group),
  })),
  dependencies: {
    runtime_package: dependenciesOf(root, "package.json"),
    pack_package: dependenciesOf(root, join("packages", "standard", "package.json")),
    locked_resolutions: lockedPackages(root),
  },
  method: {
    excluded: ["node_modules", "dist", ".git"],
    typescript:
      "character scanner; strings, template literals and regular-expression literals are not read as comments",
    markdown_yaml: "non-blank lines are code; a leading # is a comment in YAML only",
    subsets: "a group marked subset_of is already counted inside the named group",
  },
};

if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`${label} — ${report.head ?? "no git head"} (${root.split(sep).pop()})\n\n`);
  process.stdout.write(
    `${"group".padEnd(20)}${pad("files", 7)}${pad("lines", 8)}${pad("code", 8)}${pad("comment", 9)}${pad("blank", 8)}${pad("bytes", 10)}\n`,
  );
  for (const group of report.groups) {
    const name = group.id + ("subset_of" in group ? " *" : "");
    process.stdout.write(
      `${name.padEnd(20)}${pad(group.files, 7)}${pad(group.lines, 8)}${pad(group.code, 8)}${pad(group.comment, 9)}${pad(group.blank, 8)}${pad(group.bytes, 10)}\n`,
    );
  }
  process.stdout.write("\n* already counted inside another group\n\n");
  const {
    runtime_package: runtime,
    pack_package: pack,
    locked_resolutions: locked,
  } = report.dependencies;
  process.stdout.write(
    `dependencies: runtime ${runtime?.runtime.length ?? 0} direct + ${runtime?.development.length ?? 0} dev; ` +
      `pack ${pack?.runtime.length ?? 0} direct + ${pack?.development.length ?? 0} dev; ` +
      `${locked ?? "no"} locked resolutions\n`,
  );
}
