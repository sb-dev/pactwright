import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import yaml from "js-yaml";

// Definition checks for the frozen env1 examples (Distribution §12), not a
// runtime lock decoder or an acceptance binding.
type Vector = {
  id: string;
  input: Record<string, unknown>;
  canonical_json: string;
  environment_lock_hash: string;
  stored_files?: Record<string, string>;
};
const { vectors } = JSON.parse(
  readFileSync(
    new URL("../docs/specs/fixtures/environment-lock-env1.json", import.meta.url),
    "utf8",
  ),
) as { vectors: Vector[] };

// RFC 8785 for the JSON-compatible value domain of Core §6: members in unsigned
// UTF-16 key order, no whitespace, and only finite safe numbers.
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

describe("env1 frozen definition vectors", () => {
  it("retains unique examples, the stored-byte controls and a changed-identity control", () => {
    assert.equal(new Set(vectors.map((v) => v.id)).size, vectors.length);
    const scaffold = vectors.find((v) => v.id === "unactivated-scaffold");
    const other = vectors.find((v) => v.id === "unactivated-scaffold-other-runtime");
    assert.ok(scaffold?.stored_files && other);
    assert.ok(Object.keys(scaffold.stored_files).length >= 3);
    assert.ok(Object.values(scaffold.stored_files).some((text) => text.includes("\r\n")));
    assert.notEqual(scaffold.environment_lock_hash, other.environment_lock_hash);
  });
  for (const vector of vectors) {
    it(`${vector.id}: preserves the recorded canonical bytes and SHA-256`, () => {
      const bytes = canonical(vector.input);
      assert.equal(bytes, vector.canonical_json);
      assert.match(vector.environment_lock_hash, /^env1:sha256:[a-f0-9]{64}$/);
      assert.equal(
        `env1:sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`,
        vector.environment_lock_hash,
      );
      for (const [name, text] of Object.entries(vector.stored_files ?? {})) {
        const decoded = yaml.load(text, { schema: yaml.CORE_SCHEMA });
        assert.equal(canonical(decoded), bytes, `stored form ${name}`);
      }
    });
  }
});
