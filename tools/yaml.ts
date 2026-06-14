import { CORE_SCHEMA, dump, load } from "js-yaml";

/**
 * Deterministic YAML emission: sorted keys, no line wrapping, no anchors,
 * exactly one trailing newline. Every file the tooling writes goes through
 * this so regenerated output is byte-identical.
 */
export function toYaml(value: unknown): string {
  const out = dump(value, { sortKeys: true, lineWidth: -1, noRefs: true });
  return out.endsWith("\n") ? out : out + "\n";
}

/**
 * Parse with the YAML 1.2 CORE schema, NOT js-yaml's default. The default
 * schema resolves the `!!timestamp` tag, turning a bare `expires: 2099-99-99`
 * into a `Date` via overflow-normalization (→ 2107-06-07) — a malformed date
 * silently waiving the gate far into the future. CORE has no timestamp type, so
 * dates arrive as plain `YYYY-MM-DD` strings and are calendar-checked where
 * read (`tools/gate.ts` `toDateString`). Booleans, lists, and other scalars are
 * unchanged; no date field is ever re-emitted via `toYaml`, so index/report
 * output stays byte-identical.
 */
export function fromYaml(text: string): unknown {
  return load(text, { schema: CORE_SCHEMA });
}
