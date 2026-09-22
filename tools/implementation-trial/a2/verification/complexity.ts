/**
 * V13 — source-size and complexity accounting the A1 probe does not measure,
 * and the ways its groups can be gamed.
 *
 * A1's `tools/implementation-trial/measure-source.ts` counts lines per group and
 * says so honestly: *"It says nothing about duplication, complexity, import
 * cycles or repeated runtime work."* A4 freezes the comparable accounting, and
 * a candidate will be compared against the reference on it. This probe adds the
 * two things a line count cannot see — where the complexity actually sits, and
 * which group boundaries move under a candidate's own control — so that A4
 * freezes denominators that cannot be satisfied by moving code sideways.
 *
 * Nothing here is a threshold or a score. Every number is per-file and
 * separately reported, for the same reason A1 refused an aggregate.
 *
 * Usage:
 *   node --import tsx tools/implementation-trial/a2/verification/complexity.ts \
 *     --root . [--json] [--top 15]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

interface FileMetrics {
  readonly path: string;
  readonly lines: number;
  /** Branch and loop keywords plus `&&`, `||`, `??` and `?:` — one proxy, named. */
  readonly decisions: number;
  /** The largest single function body, in lines. */
  readonly longestFunction: number;
  /** Deepest brace nesting reached. */
  readonly maxDepth: number;
  /** Distinct modules imported. */
  readonly imports: number;
  readonly exports: number;
}

const DECISION = /\b(if|for|while|case|catch)\b|\?\?|\|\||&&|\?[^.]/g;

function walk(
  root: string,
  dir: string,
  out: string[],
  keep: (path: string) => boolean = (path) => path.endsWith(".ts") && !path.endsWith(".d.ts"),
): void {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    if (entry.isDirectory()) walk(root, path, out, keep);
    else if (entry.isFile() && keep(path)) out.push(path);
  }
}

/**
 * Characters of template-literal text in a TypeScript source, scanned rather
 * than matched: a regular expression over backticks pairs the closing backtick
 * of one literal with the opening backtick of the next and reports almost every
 * file. Comments, quoted strings and `${...}` substitutions are skipped, so
 * what is counted is prose the module carries.
 */
function templateLiteralChars(text: string): number {
  let state: "code" | "line" | "block" | "quote" | "template" = "code";
  let quote = "";
  let depth = 0;
  let total = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] as string;
    const next = text[i + 1];
    switch (state) {
      case "line":
        if (char === "\n") state = "code";
        break;
      case "block":
        if (char === "*" && next === "/") {
          state = "code";
          i += 1;
        }
        break;
      case "quote":
        if (char === "\\") i += 1;
        else if (char === quote) state = "code";
        break;
      case "template":
        if (char === "\\") i += 1;
        else if (char === "$" && next === "{") {
          depth += 1;
          i += 1;
        } else if (char === "}" && depth > 0) depth -= 1;
        else if (char === "`" && depth === 0) state = "code";
        else if (depth === 0) total += 1;
        break;
      default:
        if (char === "/" && next === "/") {
          state = "line";
          i += 1;
        } else if (char === "/" && next === "*") {
          state = "block";
          i += 1;
        } else if (char === '"' || char === "'") {
          state = "quote";
          quote = char;
        } else if (char === "`") {
          state = "template";
          depth = 0;
        }
    }
  }
  return total;
}

/** Longest function body and deepest nesting, by brace balance. */
function shape(text: string): { longestFunction: number; maxDepth: number } {
  const lines = text.split("\n");
  let depth = 0;
  let maxDepth = 0;
  let longest = 0;
  const open: number[] = [];
  lines.forEach((line, index) => {
    const starts = /\bfunction\b|=>\s*\{|\b(?:async\s+)?[a-zA-Z_$][\w$]*\s*\([^)]*\)\s*\{/.test(
      line,
    );
    for (const char of line) {
      if (char === "{") {
        depth += 1;
        maxDepth = Math.max(maxDepth, depth);
        open.push(starts ? index : -1);
      } else if (char === "}") {
        const started = open.pop();
        if (started !== undefined && started >= 0) longest = Math.max(longest, index - started + 1);
        depth = Math.max(0, depth - 1);
      }
    }
  });
  return { longestFunction: longest, maxDepth };
}

function measureFile(root: string, path: string): FileMetrics {
  const text = readFileSync(join(root, path), "utf8");
  const { longestFunction, maxDepth } = shape(text);
  return {
    path,
    lines: text.split("\n").length,
    decisions: (text.match(DECISION) ?? []).length,
    longestFunction,
    maxDepth,
    imports: new Set(text.match(/^import .*from "([^"]+)"/gm) ?? []).size,
    exports: (text.match(/^export /gm) ?? []).length,
  };
}

/**
 * The three places A1's group definitions move under a candidate's own control.
 * Each is checked against the tree rather than asserted.
 */
function gamingSurface(root: string): readonly { readonly id: string; readonly detail: string }[] {
  const src: string[] = [];
  walk(root, "src", src);
  const tests: string[] = [];
  walk(root, "tests", tests);

  // 1. `prompts-embedded` is a single hard-coded path, so a second prompt module
  //    is counted as ordinary runtime source and disappears from the subset that
  //    exists to make prompt growth visible.
  const commandsChars = templateLiteralChars(
    readFileSync(join(root, "src", "adapter", "commands.ts"), "utf8"),
  );
  const promptish = src
    .filter((path) => path !== "src/adapter/commands.ts")
    .map((path) => ({ path, chars: templateLiteralChars(readFileSync(join(root, path), "utf8")) }))
    .filter((entry) => entry.chars >= 1000)
    .sort((a, b) => b.chars - a.chars);

  // 2. `tests` excludes only `tests/fixtures`, so a helper module in `tests/` is
  //    counted as test drivers however much product logic it carries.
  const helpers = tests.filter((path) => !path.endsWith(".test.ts"));
  const helperLines = helpers.reduce(
    (total, path) => total + readFileSync(join(root, path), "utf8").split("\n").length,
    0,
  );

  // 3. `test-fixtures` counts every file under `tests/fixtures` regardless of
  //    kind, so executable fixture code is accounted as data.
  const fixtures: string[] = [];
  walk(root, "tests/fixtures", fixtures, () => true);

  return [
    {
      id: "prompts-embedded is one hard-coded path",
      detail:
        `measure-source.ts includes exactly \`src/adapter/commands.ts\` (${commandsChars} characters ` +
        `of template-literal text). ${promptish.length} other runtime file(s) already carry 1000+: ` +
        `${promptish.map((entry) => `${entry.path} (${entry.chars})`).join(", ") || "none"}. ` +
        `The subset is a path equality, so prompt text moved into a new module leaves ` +
        `prompts-embedded entirely while runtime-source is unchanged.`,
    },
    {
      id: "tests counts non-test modules as tests",
      detail:
        `${helpers.length} module(s) under tests/ are not *.test.ts (${helpers.join(", ") || "none"}), ` +
        `totalling ${helperLines} lines. The tests group excludes only tests/fixtures, so logic moved ` +
        `into a helper leaves runtime-source and lands in the tests denominator.`,
    },
    {
      id: "test-fixtures counts executable files as data",
      detail:
        `${fixtures.length} file(s) under tests/fixtures, of which ` +
        `${fixtures.filter((p) => p.endsWith(".ts") || p.endsWith(".js")).length} are executable source. ` +
        `They are measured with the same 'non-blank line is content' rule as YAML.`,
    },
  ];
}

function parseArguments(argv: readonly string[]): { root: string; json: boolean; top: number } {
  let root = process.cwd();
  let json = false;
  let top = 12;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root" && argv[i + 1] !== undefined) root = argv[(i += 1)] as string;
    else if (argv[i] === "--json") json = true;
    else if (argv[i] === "--top" && argv[i + 1] !== undefined) top = Number(argv[(i += 1)]);
    else throw new Error(`complexity: unexpected argument "${argv[i]}"`);
  }
  return { root, json, top };
}

const { root, json, top } = parseArguments(process.argv.slice(2));
const files: string[] = [];
walk(root, "src", files);
const metrics = files.map((path) => measureFile(root, path));
const report = {
  tool: "tools/implementation-trial/a2/verification/complexity.ts",
  root: relative(process.cwd(), root) || ".",
  files: metrics.length,
  totals: {
    lines: metrics.reduce((n, m) => n + m.lines, 0),
    decisions: metrics.reduce((n, m) => n + m.decisions, 0),
    exports: metrics.reduce((n, m) => n + m.exports, 0),
  },
  by_decisions: [...metrics].sort((a, b) => b.decisions - a.decisions).slice(0, top),
  by_longest_function: [...metrics]
    .sort((a, b) => b.longestFunction - a.longestFunction)
    .slice(0, top),
  gaming_surface: gamingSurface(root),
  method: {
    decisions:
      "a keyword and operator count (if/for/while/case/catch, &&, ||, ??, ?:) — a proxy for branching, not cyclomatic complexity",
    longest_function: "largest brace-balanced body whose opening line looks like a function",
    caveat:
      "both are text heuristics on a checkout; they rank files for attention and are not thresholds",
  },
};

if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const pad = (v: string | number, w: number): string => String(v).padStart(w);
  process.stdout.write(
    `${report.root} — ${report.files} runtime files, ${report.totals.lines} lines, ` +
      `${report.totals.decisions} decision points, ${report.totals.exports} export statements\n\n`,
  );
  process.stdout.write(
    `${"file".padEnd(34)}${pad("lines", 7)}${pad("decisions", 11)}${pad("longest-fn", 12)}${pad("depth", 7)}${pad("exports", 9)}\n`,
  );
  for (const metric of report.by_decisions) {
    process.stdout.write(
      `${metric.path.padEnd(34)}${pad(metric.lines, 7)}${pad(metric.decisions, 11)}${pad(metric.longestFunction, 12)}${pad(metric.maxDepth, 7)}${pad(metric.exports, 9)}\n`,
    );
  }
  process.stdout.write(`\nLongest single function bodies:\n`);
  for (const metric of report.by_longest_function.slice(0, 6)) {
    process.stdout.write(`  ${pad(metric.longestFunction, 4)} lines  ${metric.path}\n`);
  }
  process.stdout.write(`\nWhere A1's accounting moves under a candidate's control:\n`);
  for (const entry of report.gaming_surface) {
    process.stdout.write(`\n  ${entry.id}\n    ${entry.detail}\n`);
  }
}
