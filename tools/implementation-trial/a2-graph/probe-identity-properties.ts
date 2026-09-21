/**
 * A2-G probe: properties of node identity, serialisation and the graph
 * revision, asserted over generated input rather than a handful of examples.
 *
 * The reference declares no property-based testing library and adding one is
 * the maintainer's decision, so the generators here are a seeded LCG: a
 * failing case is reproducible from the seed printed beside it. Each property
 * is the strongest the code supports — roundtrip for serialisation, oracle
 * determinism for id minting, an order invariant for canonicalisation —
 * rather than "it does not crash".
 */
import { mintNodeId, slugify } from "../../../src/graph/ids.js";
import { serialiseNode } from "../../../src/graph/mutations.js";
import { checkNodeId, parseNodeFile, type GraphNode } from "../../../src/graph/nodes.js";
import { canonicalGraphPayload, graphRevision } from "../../../src/graph/revision.js";
import type { Edge } from "../../../src/graph/edges.js";
import { observe, rng, summary } from "./fixture.js";

const ALPHABET = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ..." \t-_.:/\\#@!?'\"`|>[]{},",
  ..."éüçł日本語Ωμ",
  "​",
  "\r\n",
  "\n",
  "---",
  "\u0000",
  "�",
];

function text(next: () => number, min: number, max: number): string {
  const length = min + Math.floor(next() * (max - min + 1));
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(next() * ALPHABET.length)]!;
  }
  return out;
}

const CASES = 400;

/* G-ID-1 — slugify is idempotent on its own output. */
{
  const next = rng(20260921);
  let counterexample: string | undefined;
  let exercised = 0;
  for (let i = 0; i < CASES && counterexample === undefined; i += 1) {
    const raw = text(next, 1, 60);
    const once = slugify(raw);
    if (once === undefined) continue;
    exercised += 1;
    if (slugify(once) !== once) counterexample = raw;
  }
  observe(
    "G-ID-1 slugify idempotence",
    "slugify(slugify(t)) === slugify(t) for every generated title",
    counterexample === undefined
      ? `${exercised} of ${CASES} cases exercised, none failing`
      : `counterexample ${JSON.stringify(counterexample)}`,
    counterexample === undefined && exercised > CASES / 2,
  );
}

/* G-ID-2 — a minted id always satisfies the id rule for its type. */
{
  const next = rng(7);
  const failures: string[] = [];
  for (let i = 0; i < CASES; i += 1) {
    const raw = text(next, 1, 80);
    const slug = slugify(raw);
    if (slug === undefined) continue;
    for (const type of ["intent", "decision", "contract", "brief", "evidence"]) {
      const id = mintNodeId(type, slug, `${raw}\nseed`, new Set());
      const problem = checkNodeId(id, type);
      if (problem !== undefined)
        failures.push(`${type}: ${JSON.stringify(raw)} -> ${id}: ${problem}`);
    }
  }
  observe(
    "G-ID-2 minted ids satisfy the id rule",
    "every minted id passes checkNodeId for its own type",
    failures.length === 0
      ? `${CASES} titles x 5 types, none failing`
      : `${failures.length} failures, first: ${failures[0]!}`,
    failures.length === 0,
  );
}

/* G-ID-3 — minting is deterministic and never returns a taken id. */
{
  const next = rng(99);
  let broken: string | undefined;
  for (let i = 0; i < CASES && broken === undefined; i += 1) {
    const slug = slugify(text(next, 1, 30));
    if (slug === undefined) continue;
    const seed = text(next, 1, 40);
    const first = mintNodeId("intent", slug, seed, new Set());
    if (mintNodeId("intent", slug, seed, new Set()) !== first) {
      broken = `non-deterministic for slug ${slug}`;
      break;
    }
    const taken = new Set([first]);
    const second = mintNodeId("intent", slug, seed, taken);
    if (taken.has(second)) broken = `collided with a taken id for slug ${slug}`;
    if (checkNodeId(second, "intent") !== undefined)
      broken = `collision fallback ${second} is not a valid id`;
  }
  observe(
    "G-ID-3 minting determinism and collision avoidance",
    "the same input mints the same id; a taken id is never returned",
    broken ?? `${CASES} cases, none failing`,
    broken === undefined,
  );
}

/* G-ID-4 — a serialised node round-trips through the loader's own parser. */
{
  const next = rng(31337);
  const failures: string[] = [];
  let exercised = 0;
  for (let i = 0; i < CASES; i += 1) {
    const rawTitle = text(next, 1, 70);
    const slug = slugify(rawTitle);
    if (slug === undefined) continue;
    const title = rawTitle.trim();
    if (title.length === 0) continue;
    const body = text(next, 1, 120).trim();
    if (body.length === 0) continue;
    const created = "2026-09-21";
    const id = mintNodeId("intent", slug, `${created}\n${title}\n${body}`, new Set());
    const path = `/specs/nodes/${id}.md`;
    const node: GraphNode = {
      id,
      type: "intent",
      title,
      created,
      frontmatter: { id, type: "intent", title, created },
      body,
      path,
    };
    exercised += 1;
    const parsed = parseNodeFile(serialiseNode(node), path);
    if (parsed.value === undefined) {
      failures.push(
        `parse failed for ${JSON.stringify(title)}: ${parsed.problems.map((p) => p.code).join(",")}`,
      );
      continue;
    }
    for (const field of ["id", "type", "title", "created", "body"] as const) {
      if (parsed.value[field] !== node[field]) {
        failures.push(
          `${field} does not round-trip for ${JSON.stringify(title)}: wrote ${JSON.stringify(node[field])}, read ${JSON.stringify(parsed.value[field])}`,
        );
        break;
      }
    }
  }
  observe(
    "G-ID-4 node serialisation roundtrip",
    "parseNodeFile(serialiseNode(n)) reproduces id, type, title, created and body",
    failures.length === 0
      ? `${exercised} of ${CASES} generated nodes exercised, none failing`
      : `${failures.length} of ${exercised} failing, first: ${failures[0]!}`,
    failures.length === 0 && exercised > CASES / 2,
  );
}

/* G-ID-5 — the graph revision is invariant under node and edge ordering. */
{
  const next = rng(4242);
  const node = (n: number): GraphNode => {
    const id = `intent-generated-${(n + 0x1000).toString(16)}`;
    return {
      id,
      type: "intent",
      title: `Node ${n}`,
      created: "2026-09-21",
      frontmatter: { id, type: "intent", title: `Node ${n}`, created: "2026-09-21" },
      body: text(next, 1, 40),
      path: `/specs/nodes/${id}.md`,
    };
  };
  const nodes = Array.from({ length: 12 }, (_, n) => node(n));
  const edges: Edge[] = nodes.slice(1).map((target, i) => ({
    source: nodes[i]!.id,
    type: "supersedes",
    target: target.id,
  }));
  const base = graphRevision({ nodes, edges });
  const shuffled = new Set<string>();
  for (let round = 0; round < 40; round += 1) {
    const ns = [...nodes].sort(() => next() - 0.5);
    const es = [...edges].sort(() => next() - 0.5);
    shuffled.add(graphRevision({ nodes: ns, edges: es }));
  }
  observe(
    "G-ID-5 graph revision order invariance",
    "40 permutations of the same graph derive one revision",
    `${shuffled.size} distinct revisions; base ${base.slice(0, 20)}…`,
    shuffled.size === 1 && shuffled.has(base),
  );
}

/* G-ID-6 — the revision is sensitive to every part of the canonical payload. */
{
  const base: GraphNode = {
    id: "intent-sensitivity-1234abcd",
    type: "intent",
    title: "Sensitivity",
    created: "2026-09-21",
    frontmatter: {
      id: "intent-sensitivity-1234abcd",
      type: "intent",
      title: "Sensitivity",
      created: "2026-09-21",
    },
    body: "Body.",
    path: "/specs/nodes/intent-sensitivity-1234abcd.md",
  };
  const variants: Array<[string, () => string]> = [
    ["body", () => graphRevision({ nodes: [{ ...base, body: "Body changed." }], edges: [] })],
    [
      "created",
      () =>
        graphRevision({
          nodes: [{ ...base, frontmatter: { ...base.frontmatter, created: "2026-09-20" } }],
          edges: [],
        }),
    ],
    [
      "extra frontmatter",
      () =>
        graphRevision({
          nodes: [{ ...base, frontmatter: { ...base.frontmatter, extra: 1 } }],
          edges: [],
        }),
    ],
    [
      "an added edge",
      () =>
        graphRevision({
          nodes: [base],
          edges: [{ source: base.id, type: "supersedes", target: base.id }],
        }),
    ],
    [
      "an extension record",
      () =>
        graphRevision({
          nodes: [base],
          edges: [],
          records: [{ owner: "x", kind: "asset", id: "a", record: { a: 1 } }],
        }),
    ],
  ];
  const reference = graphRevision({ nodes: [base], edges: [] });
  const insensitive = variants.filter(([, derive]) => derive() === reference).map(([what]) => what);
  observe(
    "G-ID-6 graph revision sensitivity",
    "changing the body, a frontmatter field, an edge or an extension record moves the revision",
    insensitive.length === 0
      ? "every variant moves the revision"
      : `unchanged for: ${insensitive.join(", ")}`,
    insensitive.length === 0,
  );
  const path = base.path;
  const moved = graphRevision({ nodes: [{ ...base, path: `${path}.other` }], edges: [] });
  observe(
    "G-ID-6b file path is not graph state (positive control)",
    "moving a node's file path alone does not move the revision",
    moved === reference ? "revision unchanged" : "revision moved",
    moved === reference,
  );
}

/* G-ID-7 — line endings are normalised out of the revision. */
{
  const make = (body: string): GraphNode => ({
    id: "intent-endings-1234abcd",
    type: "intent",
    title: "Endings",
    created: "2026-09-21",
    frontmatter: {
      id: "intent-endings-1234abcd",
      type: "intent",
      title: "Endings",
      created: "2026-09-21",
    },
    body,
    path: "/specs/nodes/intent-endings-1234abcd.md",
  });
  const lf = graphRevision({ nodes: [make("one\ntwo")], edges: [] });
  const crlf = graphRevision({ nodes: [make("one\r\ntwo")], edges: [] });
  observe(
    "G-ID-7 line-ending normalisation (positive control)",
    "a body differing only in line endings derives the same revision",
    lf === crlf ? "same revision" : "different revisions",
    lf === crlf,
  );
  const withFront = (summaryText: string): GraphNode => ({
    ...make("body"),
    frontmatter: { ...make("body").frontmatter, summary: summaryText },
  });
  const frontLf = graphRevision({ nodes: [withFront("one\ntwo")], edges: [] });
  const frontCrlf = graphRevision({ nodes: [withFront("one\r\ntwo")], edges: [] });
  const payload = canonicalGraphPayload({ nodes: [withFront("one\r\ntwo")], edges: [] });
  observe(
    "G-ID-7b frontmatter line endings",
    "a frontmatter string differing only in line endings is normalised as the body is",
    frontLf === frontCrlf
      ? "same revision"
      : `different revisions; the payload carries raw CRLF: ${String(payload.includes("\\r\\n"))}`,
    frontLf === frontCrlf,
  );
}

summary();
