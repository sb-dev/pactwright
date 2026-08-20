import type { PactwrightConfig } from "../config/config.js";
import type { PackManifest } from "./manifest.js";

/**
 * The capabilities every Delivery project requires of its agent pack
 * (Distribution §7): the Specification, Delivery and Review
 * responsibilities of Delivery Graph §16. Graph mutation is a runtime
 * responsibility, never a pack capability.
 */
export const CORE_CAPABILITIES = [
  "delivery-specification",
  "delivery-execution",
  "delivery-review",
] as const;

export type CoreCapability = (typeof CORE_CAPABILITIES)[number];

/** Capability names are kebab-case identifiers, like `operations-analysis`. */
export const CAPABILITY_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * The capability set the selected pack must satisfy: the core set plus the
 * `agent_capabilities` of every enabled extension (Distribution §5, §7).
 * Extensions are not implemented in this checkpoint, so the union is the
 * core set; the parameter is the seam later extension loading plugs into.
 */
export function requiredCapabilities(config: PactwrightConfig): readonly string[] {
  void config.extensions; // always empty in this checkpoint; extension manifests arrive in Step 15
  return [...CORE_CAPABILITIES].sort();
}

/** Required capabilities the manifest does not map to an agent, sorted. */
export function missingCapabilities(
  manifest: PackManifest,
  required: readonly string[],
): readonly string[] {
  return required.filter((capability) => manifest.capabilities[capability] === undefined).sort();
}
