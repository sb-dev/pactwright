import * as fs from "node:fs";
import * as path from "node:path";
import { asString, compareStrings, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import { deriveStage, liveIntents, nextSteps } from "./conveyor.ts";
import { toYaml } from "./yaml.ts";

/**
 * Minimal projections of edges.yaml. The keyed node is implicit; `id` is the
 * edge id pointing back to the full record in edges.yaml.
 */
export interface IncomingEntry {
  id: string;
  type: string;
  source: string;
}

export interface OutgoingEntry {
  id: string;
  type: string;
  target: string;
}

export interface UnresolvedEntry {
  edge: string;
  missing: "source" | "target";
  value: string;
}

export interface Indexes {
  incoming: Record<string, IncomingEntry[]>;
  outgoing: Record<string, OutgoingEntry[]>;
  byType: Record<string, string[]>;
  unresolved: UnresolvedEntry[];
}

/** Every generated file under `specs/indexes/`. Extending this list ALSO requires
 * extending `serializeIndexes`'s object literal below — it is typed
 * `Record<IndexFileName, string>` and `IndexFileName` is derived from this array, so
 * a one-sided edit fails `tsc`, deliberately. `writeIndexes` scales on its own. */
export const INDEX_FILES = [
  "by-type.yaml",
  "incoming.yaml",
  "outgoing.yaml",
  "unresolved.yaml",
  "trails.md",
  "status.md",
] as const;
export type IndexFileName = (typeof INDEX_FILES)[number];

function compareEntries(a: { id: string; type: string }, b: { id: string; type: string }): number {
  // Sort by (type, then edge id) so relationship kinds read contiguously.
  return compareStrings(a.type, b.type) || compareStrings(a.id, b.id);
}

export function buildIndexes(spec: LoadedSpec): Indexes {
  const knownIds = new Set<string>();
  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    if (id !== undefined) knownIds.add(id);
  }

  const incoming: Record<string, IncomingEntry[]> = {};
  const outgoing: Record<string, OutgoingEntry[]> = {};
  const byType: Record<string, string[]> = {};
  const unresolved: UnresolvedEntry[] = [];

  for (const node of spec.nodes) {
    const id = asString(node.data["id"]);
    const type = asString(node.data["type"]);
    if (id === undefined || type === undefined) continue;
    (byType[type] ??= []).push(id);
  }
  for (const ids of Object.values(byType)) ids.sort();

  spec.edges.forEach((edge, i) => {
    const id = asString(edge["id"]) ?? "";
    const type = asString(edge["type"]) ?? "";
    const source = asString(edge["source"]);
    const target = asString(edge["target"]);

    if (target !== undefined && source !== undefined) {
      (incoming[target] ??= []).push({ id, type, source });
      (outgoing[source] ??= []).push({ id, type, target });
    } else if (target !== undefined) {
      (incoming[target] ??= []).push({ id, type, source: "" });
    } else if (source !== undefined) {
      (outgoing[source] ??= []).push({ id, type, target: "" });
    }

    // An edge missing its own id is still named by position, so the entry
    // points somewhere actionable instead of an empty string.
    const edgeRef = id !== "" ? id : `specs/graph/edges.yaml[${i}]`;
    for (const endpoint of ["source", "target"] as const) {
      const value = asString(edge[endpoint]);
      if (value !== undefined && !knownIds.has(value)) {
        unresolved.push({ edge: edgeRef, missing: endpoint, value });
      }
    }
  });

  for (const entries of Object.values(incoming)) entries.sort(compareEntries);
  for (const entries of Object.values(outgoing)) entries.sort(compareEntries);
  unresolved.sort(
    (a, b) =>
      compareStrings(a.edge, b.edge) || compareStrings(a.missing, b.missing) || compareStrings(a.value, b.value),
  );

  return { incoming, outgoing, byType, unresolved };
}

/**
 * The two navigation views.
 *
 * Both are TOTAL over any loadable graph and CLOCK-FREE (CC-8): no `Date`, no
 * `process.env`, no locale, no filesystem mtime, no absolute path, and every sort
 * through `compareStrings`. They run inside `handlers/indexes_fresh.ts` on every
 * `spec:validate`, and `.github/workflows/spec-index.yml` diffs `specs/indexes/` on
 * every PR — so a single dated or locale-dependent byte here freezes CI.
 *
 * Both call `nextSteps`/`deriveStage` from `tools/conveyor.ts` rather than deriving
 * routing themselves, so the views and the command prints cannot disagree.
 */

/** Markdown-table-safe cell text: pipes escaped, newlines collapsed. Total — an
 * absent value renders as an em dash rather than throwing. */
function cell(value: unknown): string {
  const s = asString(value);
  if (s === undefined || s === "") return "—";
  return s.replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
}

/** Distinct source ids of `edgeType` edges pointing at `targetId`, status-blind — a
 * view-shaping projection (trails is a HISTORY view and shows rejected candidates
 * too), deliberately not the live-set routing walks in `coverage_traversal.ts`. */
function viewSourcesOf(spec: LoadedSpec, edgeType: string, targetIds: Set<string>): string[] {
  const out = new Set<string>();
  for (const e of spec.edges) {
    if (asString(e["type"]) !== edgeType) continue;
    const t = asString(e["target"]);
    if (t === undefined || !targetIds.has(t)) continue;
    const s = asString(e["source"]);
    if (s !== undefined) out.add(s);
  }
  return [...out].sort(compareStrings);
}

function rowsFor(byId: Map<string, NodeRecord>, ids: string[], extra?: (n: NodeRecord) => string): string[] {
  return ids.map((id) => {
    const n = byId.get(id);
    if (n === undefined) return `| \`${cell(id)}\` | — | unresolved |${extra ? " — |" : ""}`;
    const tail = extra ? ` ${extra(n)} |` : "";
    return `| \`${cell(id)}\` | ${cell(n.data["title"])} | ${cell(n.data["status"])} |${tail}`;
  });
}

/** `trails.md` — one section per intent: its contracts, comparison, decision, briefs
 * (with lane and owner), evidence and integration, each as id, title, status. */
export function serializeTrails(spec: LoadedSpec): string {
  const byId = nodesById(spec);
  const out: string[] = [
    "# Trails",
    "",
    "One section per intent: every record on its trail, as `id`, `title`, `status`.",
    "Generated by `spec:index` from the graph — never hand-edited.",
  ];

  const intents = spec.nodes
    .filter((n) => asString(n.data["type"]) === "intent")
    .map((n) => ({ id: asString(n.data["id"]) ?? "", node: n }))
    .filter((n) => n.id !== "")
    .sort((a, b) => compareStrings(a.id, b.id));

  for (const { id, node } of intents) {
    out.push("", `## ${cell(id)} — ${cell(node.data["title"])} (${cell(node.data["status"])})`, "");
    const contracts = new Set(viewSourcesOf(spec, "proposes", new Set([id])));
    const comparisons = viewSourcesOf(spec, "compares", contracts);
    const decisions = viewSourcesOf(spec, "selects", contracts);
    const briefs = new Set(viewSourcesOf(spec, "decomposes", contracts));
    const evidence = new Set(viewSourcesOf(spec, "evidences", briefs));
    const integrations = viewSourcesOf(spec, "integrates", evidence);
    // Decisions that SUBSUME this intent. Seeded by the intent itself, not by
    // `contracts` — a subsumed intent has no contract to hang the trail on, which is
    // exactly the case the `unbacked-addressed` rule exists to make visible. Without
    // this section such an intent renders every heading `_none_`, and the reader's
    // first stop asserts nothing exists while the graph carries a `subsumes` edge.
    const subsumers = viewSourcesOf(spec, "subsumes", new Set([id]));

    const sections: [string, string[], ((n: NodeRecord) => string) | undefined][] = [
      ["contracts", [...contracts].sort(compareStrings), undefined],
      ["comparison", comparisons, undefined],
      ["decision", decisions, undefined],
      ["subsumed by", subsumers, undefined],
      ["briefs", [...briefs].sort(compareStrings), (n) => `${cell(n.data["lane"])} | ${cell(n.data["owner"])} |`],
      ["evidence", [...evidence].sort(compareStrings), undefined],
      ["integration", integrations, undefined],
    ];

    for (const [label, ids, extra] of sections) {
      out.push(`### ${label}`, "");
      if (ids.length === 0) {
        out.push("_none_", "");
        continue;
      }
      const header =
        label === "briefs" ? "| id | title | status | lane | owner |" : "| id | title | status |";
      const sep = label === "briefs" ? "|---|---|---|---|---|" : "|---|---|---|";
      out.push(header, sep);
      // `extra` already terminates the row, so strip the duplicated trailing bar.
      out.push(...rowsFor(byId, ids, extra).map((r) => r.replace(/\|\s*\|$/, "|")));
      out.push("");
    }
  }

  return out.join("\n").replace(/\n+$/, "") + "\n";
}

/** `status.md` — the live intents' open work, each row carrying the resolver's next
 * step, its persisted `wave`, and its issue state. CC-11: an unsynced lane renders
 * `not synced` explicitly, so a blank column never reads as a lost lane, and an
 * absent `wave` renders as an explicit marker rather than crashing. */
export function serializeStatus(spec: LoadedSpec): string {
  const byId = nodesById(spec);
  const out: string[] = [
    "# Status",
    "",
    "Open work per live intent, with the next step derived from the graph.",
    "`wave: —` means no wave was persisted; `issue: not synced` means no issue is recorded.",
    "Generated by `spec:index` from the graph — never hand-edited.",
  ];

  const intents = liveIntents(spec);
  if (intents.length === 0) out.push("", "_no live intents_");

  for (const intent of intents) {
    const id = asString(intent.data["id"]) ?? "";
    const steps = nextSteps(spec, id);
    out.push(
      "",
      `## ${cell(id)} — ${cell(intent.data["title"])}`,
      "",
      `stage: \`${deriveStage(spec, id)}\``,
      "",
      "next:",
      "",
    );
    // Only a runnable line is code-formatted; an `action` is prose (and may itself
    // contain backticks, which would nest badly inside inline code).
    for (const s of steps) {
      const shown = s.kind === "action" ? cell(s.rendered) : `\`${cell(s.rendered)}\``;
      out.push(`- ${shown} — _${s.kind}_ — ${cell(s.why)}`);
    }

    // Open-work rows: every live brief of every contract this intent proposes.
    const contracts = new Set(viewSourcesOf(spec, "proposes", new Set([id])));
    const briefs = viewSourcesOf(spec, "decomposes", contracts);
    if (briefs.length === 0) continue;
    out.push("", "| brief | lane | owner | wave | issue | status | next |", "|---|---|---|---|---|---|---|");
    for (const b of briefs) {
      const n = byId.get(b);
      if (n === undefined) {
        out.push(`| \`${cell(b)}\` | — | — | — | not synced | unresolved | — |`);
        continue;
      }
      const first = nextSteps(spec, b)[0];
      const issue = asString(n.data["issue"]);
      const next =
        first === undefined ? "—" : first.kind === "action" ? cell(first.rendered) : `\`${cell(first.rendered)}\``;
      out.push(
        `| \`${cell(b)}\` | ${cell(n.data["lane"])} | ${cell(n.data["owner"])} | ${cell(n.data["wave"])} | ${
          issue === undefined ? "not synced" : cell(issue)
        } | ${cell(n.data["status"])} | ${next} |`,
      );
    }
  }

  return out.join("\n").replace(/\n+$/, "") + "\n";
}

/** Serialize every index file; key order inside each YAML file is handled by toYaml.
 * The count is `INDEX_FILES.length` — no hand-maintained number survives here (CC-14). */
export function serializeIndexes(spec: LoadedSpec): Record<IndexFileName, string> {
  const indexes = buildIndexes(spec);
  return {
    "by-type.yaml": toYaml({ "by-type": indexes.byType }),
    "incoming.yaml": toYaml({ incoming: indexes.incoming }),
    "outgoing.yaml": toYaml({ outgoing: indexes.outgoing }),
    "unresolved.yaml": toYaml({ unresolved: indexes.unresolved }),
    "trails.md": serializeTrails(spec),
    "status.md": serializeStatus(spec),
  };
}

/** Write every index file under <root>/indexes/; returns relative paths written. */
export function writeIndexes(spec: LoadedSpec): string[] {
  const dir = path.join(spec.root, "indexes");
  fs.mkdirSync(dir, { recursive: true });
  const serialized = serializeIndexes(spec);
  const written: string[] = [];
  for (const name of INDEX_FILES) {
    fs.writeFileSync(path.join(dir, name), serialized[name]);
    written.push(path.join(path.relative(process.cwd(), dir) || ".", name).split(path.sep).join("/"));
  }
  return written;
}
