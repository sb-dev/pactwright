import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import yaml from "js-yaml";

// Definition checks for the frozen examples, not a runtime loader or acceptance binding.
// The stored examples use only the Core scalar forms js-yaml resolves identically;
// this does not certify its handling of non-string keys, binary numbers or invalid input.
type Projection = { owner: string; kind: string; key: string; value: unknown };
type Edge = { source: string; type: string; target: string };
type Input = { format: number; records: Projection[]; edges: Edge[] };
type Vector = {
  id: string;
  input: Input;
  canonical_json: string;
  revision: string;
  stored_files?: Record<string, string>;
};
const { vectors } = JSON.parse(
  readFileSync(
    new URL("../docs/specs/fixtures/project-graph-revision-pg1.json", import.meta.url),
    "utf8",
  ),
) as { vectors: Vector[] };

// Emit object members directly: JSON.stringify on a sorted object would reorder
// integer-looking keys again. String comparison here is unsigned UTF-16 order.
function canonical(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value));
    assert.ok(!Number.isInteger(value) || Number.isSafeInteger(value));
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  assert.ok(value && typeof value === "object");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}
function compare(left: string[], right: string[]): number {
  for (let i = 0; i < left.length; i++) {
    const a = left[i] ?? "";
    const b = right[i] ?? "";
    if (a !== b) return a < b ? -1 : 1;
  }
  return 0;
}
function serialise(input: Input): string {
  return canonical({
    format: input.format,
    records: [...input.records].sort((a, b) =>
      compare([a.owner, a.kind, a.key], [b.owner, b.kind, b.key]),
    ),
    edges: [...input.edges].sort((a, b) =>
      compare([a.source, a.type, a.target], [b.source, b.type, b.target]),
    ),
  });
}
function projectStoredExample(files: Record<string, string>): Input {
  const records: Projection[] = [];
  let edges: Edge[] | undefined;
  for (const [path, bytes] of Object.entries(files)) {
    const text = bytes.replace(/\r\n?/g, "\n");
    if (path === "specs/graph/edges.yml") {
      edges = (yaml.load(text, { schema: yaml.CORE_SCHEMA }) as { edges: Edge[] }).edges;
      continue;
    }
    assert.match(path, /^specs\/nodes\/.+\.md$/);
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
    assert.ok(match);
    const frontmatter = yaml.load(match[1] ?? "", { schema: yaml.CORE_SCHEMA }) as Record<
      string,
      unknown
    >;
    assert.equal(typeof frontmatter["id"], "string");
    assert.equal(typeof frontmatter["type"], "string");
    assert.equal(typeof frontmatter["created"], "string");
    if ("flag" in frontmatter) assert.equal(frontmatter["flag"], "yes");
    records.push({
      owner: "core",
      kind: frontmatter["type"] as string,
      key: frontmatter["id"] as string,
      value: { frontmatter, body: (match[2] ?? "").trim() },
    });
  }
  assert.ok(edges);
  return { format: 1, records, edges };
}

describe("pg1 frozen definition vectors", () => {
  it("retains unique examples and both stored-byte presentation controls", () => {
    assert.equal(new Set(vectors.map((v) => v.id)).size, vectors.length);
    const crlf = vectors.find((v) => v.id === "stored-yaml-crlf");
    const lf = vectors.find((v) => v.id === "stored-yaml-lf-quoted");
    assert.ok(crlf?.stored_files && lf?.stored_files);
    assert.notDeepEqual(crlf.stored_files, lf.stored_files);
    assert.ok(Object.values(crlf.stored_files).every((text) => text.includes("\r\n")));
    assert.equal(crlf.canonical_json, lf.canonical_json);
    assert.equal(crlf.revision, lf.revision);
  });
  for (const vector of vectors) {
    it(`${vector.id}: preserves the recorded sorted bytes and SHA-256`, () => {
      const bytes = serialise(vector.input);
      assert.equal(bytes, vector.canonical_json);
      assert.match(vector.revision, /^pg1:sha256:[a-f0-9]{64}$/);
      assert.equal(
        `pg1:sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`,
        vector.revision,
      );
      if (vector.stored_files) {
        const projected = projectStoredExample(vector.stored_files);
        assert.equal(canonical(projected), canonical(vector.input));
        assert.equal(serialise(projected), bytes);
      }
    });
  }
});
