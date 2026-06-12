import { dump, load } from "js-yaml";

/**
 * Deterministic YAML emission: sorted keys, no line wrapping, no anchors,
 * exactly one trailing newline. Every file the tooling writes goes through
 * this so regenerated output is byte-identical.
 */
export function toYaml(value: unknown): string {
  const out = dump(value, { sortKeys: true, lineWidth: -1, noRefs: true });
  return out.endsWith("\n") ? out : out + "\n";
}

export function fromYaml(text: string): unknown {
  return load(text);
}
