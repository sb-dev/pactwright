import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { Problem } from "../errors.js";
import type { ParseResult } from "../config/config.js";
import {
  Checker,
  expectRecord,
  expectString,
  requireKeys,
  type UnknownRecord,
} from "../validation.js";
import { parseYaml } from "../yaml.js";

/**
 * A Project Graph node: Markdown with YAML frontmatter (Delivery Graph §5).
 * Only the common fields are typed here; type-specific fields stay in
 * `frontmatter` for the schema layer to interpret.
 */
export interface GraphNode {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly created: string;
  readonly frontmatter: Readonly<UnknownRecord>;
  readonly body: string;
  readonly path: string;
}

export const REQUIRED_NODE_FIELDS = ["id", "type", "title", "created"] as const;

/** `<type>-<slug>-<short-hash>`; type and slug are lowercase kebab tokens. */
export const NODE_TYPE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const NODE_ID_PATTERN =
  /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-([a-z0-9]+(?:-[a-z0-9]+)*)-([0-9a-f]{4,})$/;
export const CREATED_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

/**
 * Checks that `id` has the shape `<type>-<slug>-<short-hash>` and that its
 * type prefix equals `type`. Returns problems (empty when valid).
 */
export function checkNodeId(id: string, type: string): string | undefined {
  const match = NODE_ID_PATTERN.exec(id);
  if (match === null) return `id "${id}" must match <type>-<slug>-<short-hash>`;
  if (!id.startsWith(`${type}-`)) {
    return `id "${id}" must start with the node type "${type}-"`;
  }
  const rest = id.slice(type.length + 1);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{4,}$/.test(rest)) {
    return `id "${id}" must be "${type}-<slug>-<short-hash>"`;
  }
  return undefined;
}

export function parseNodeFile(text: string, path: string): ParseResult<GraphNode> {
  const c = new Checker(path);
  const match = FRONTMATTER_PATTERN.exec(text);
  if (match === null) {
    c.fail(
      "missing-frontmatter",
      "node file must start with a YAML frontmatter block delimited by ---",
    );
    return { value: undefined, problems: c.problems };
  }
  const yaml = parseYaml(match[1] ?? "", path);
  if (yaml.problems.length > 0) return { value: undefined, problems: yaml.problems };
  const front = expectRecord(c, yaml.value, "frontmatter");
  if (front === undefined) return { value: undefined, problems: c.problems };

  requireKeys(c, front, "frontmatter", REQUIRED_NODE_FIELDS);
  const id = expectString(c, front["id"], "frontmatter.id");
  const type = expectString(c, front["type"], "frontmatter.type");
  const title = expectString(c, front["title"], "frontmatter.title");
  const created = expectString(c, front["created"], "frontmatter.created");

  if (type !== undefined && !NODE_TYPE_PATTERN.test(type)) {
    c.fail("invalid-type", `frontmatter.type "${type}" must be a lowercase kebab-case token`);
  }
  if (id !== undefined && type !== undefined && NODE_TYPE_PATTERN.test(type)) {
    const idProblem = checkNodeId(id, type);
    if (idProblem !== undefined) c.fail("invalid-id", idProblem);
  }
  if (created !== undefined && !CREATED_PATTERN.test(created)) {
    c.fail("invalid-value", `frontmatter.created "${created}" must be an ISO date (YYYY-MM-DD)`);
  }
  if (id !== undefined && basename(path) !== `${id}.md`) {
    c.fail("filename-mismatch", `node file must be named "${id}.md" to match its id`);
  }
  const body = (match[2] ?? "").trim();
  if (body.length === 0)
    c.fail("missing-body", "node must have a Markdown body after the frontmatter");

  if (
    !c.ok ||
    id === undefined ||
    type === undefined ||
    title === undefined ||
    created === undefined
  ) {
    return { value: undefined, problems: c.problems };
  }
  return { value: { id, type, title, created, frontmatter: front, body, path }, problems: [] };
}

/**
 * IDs never change (Delivery Graph §5) and records are superseded, not
 * deleted. Compares a previous graph snapshot with a proposed one and reports
 * `id-removed` for every id that no longer exists — which is exactly how a
 * renamed-and-re-identified node file shows up. An in-place id edit is
 * already rejected by `parseNodeFile` (`filename-mismatch`). New ids are fine.
 */
export function checkNodeIdImmutability(
  previous: readonly Pick<GraphNode, "id" | "path">[],
  proposed: readonly Pick<GraphNode, "id" | "path">[],
): readonly Problem[] {
  const current = new Set(proposed.map((node) => node.id));
  return previous
    .filter((node) => !current.has(node.id))
    .map((node) => ({
      code: "id-removed",
      message: `node id "${node.id}" is missing from the proposed graph; IDs never change and nodes are superseded, not deleted`,
      path: node.path,
    }));
}

export interface NodesLoadResult {
  /** Successfully parsed nodes, sorted by id. */
  readonly nodes: readonly GraphNode[];
  readonly problems: readonly Problem[];
}

/**
 * Loads every `*.md` file directly inside `dir` as a node. A missing
 * directory is a problem; an existing empty directory yields no nodes.
 */
export function loadNodes(dir: string): NodesLoadResult {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return {
      nodes: [],
      problems: [{ code: "missing-directory", message: "nodes directory not found", path: dir }],
    };
  }
  const problems: Problem[] = [];
  const nodes: GraphNode[] = [];
  const seen = new Map<string, string>();
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  for (const name of files) {
    const path = join(dir, name);
    const parsed = parseNodeFile(readFileSync(path, "utf8"), path);
    problems.push(...parsed.problems);
    if (parsed.value === undefined) continue;
    const previous = seen.get(parsed.value.id);
    if (previous !== undefined) {
      problems.push({
        code: "duplicate-id",
        message: `node id "${parsed.value.id}" is already declared in ${previous}`,
        path,
      });
      continue;
    }
    seen.set(parsed.value.id, path);
    nodes.push(parsed.value);
  }
  nodes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { nodes, problems };
}
