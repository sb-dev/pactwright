import { asString, capabilityPaths, nodesById, type LoadedSpec, type NodeRecord } from "./loader.ts";
import { resolveBase, changedFiles as gitChangedFiles } from "./gitdiff.ts";
import { matchAny } from "./glob.ts";

/**
 * Deterministic diff → capability mapping (`spec:drift-map`). Maps the changed
 * files to the capabilities that own them and walks each affected capability to
 * its linked contracts/briefs/evidence, emitting one structured "drift packet"
 * per capability plus an `uncovered` list of changed files no capability owns.
 * No judgment here — `/detect-drift` feeds these packets to Claude for the one
 * semantic question.
 */

export interface NodeRef {
  id: string;
  title: string;
  status: string;
}

export interface DriftPacket {
  capability: string;
  capabilityTitle: string;
  /** Changed files (sorted) this capability owns. */
  changedFiles: string[];
  /** All contracts reachable via touches→evidences→decomposes (sorted by id). */
  contracts: NodeRef[];
  /** The reachable contract whose status is `approved`, else null. */
  approvedContract: string | null;
  briefs: NodeRef[];
  priorEvidence: { id: string; title: string }[];
  /** `linked` iff at least one contract is reachable, else `unlinked`. */
  linkState: "linked" | "unlinked";
}

export interface DriftMapResult {
  packets: DriftPacket[];
  /** Changed files matching no capability's `paths` — coverage holes. */
  uncovered: string[];
}

function uniqSorted(xs: string[]): string[] {
  return [...new Set(xs)].sort();
}

function title(byId: Map<string, NodeRecord>, id: string): string {
  return asString(byId.get(id)?.data["title"]) ?? id;
}

function ref(byId: Map<string, NodeRecord>, id: string): NodeRef {
  const n = byId.get(id);
  return { id, title: asString(n?.data["title"]) ?? id, status: asString(n?.data["status"]) ?? "" };
}

/** Sources of `type` edges whose target is in `targetIds`. */
function sourcesOf(spec: LoadedSpec, type: string, targetIds: string[]): string[] {
  return uniqSorted(
    spec.edges
      .filter((e) => asString(e["type"]) === type && targetIds.includes(asString(e["target"]) ?? ""))
      .map((e) => asString(e["source"]))
      .filter((x): x is string => x !== undefined),
  );
}

/** Targets of `type` edges whose source is in `sourceIds`. */
function targetsOf(spec: LoadedSpec, type: string, sourceIds: string[]): string[] {
  return uniqSorted(
    spec.edges
      .filter((e) => asString(e["type"]) === type && sourceIds.includes(asString(e["source"]) ?? ""))
      .map((e) => asString(e["target"]))
      .filter((x): x is string => x !== undefined),
  );
}

export function buildDriftMap(spec: LoadedSpec, changed: string[]): DriftMapResult {
  const byId = nodesById(spec);
  const capabilities = spec.nodes.filter((n) => asString(n.data["type"]) === "capability");
  const sortedFiles = uniqSorted(changed);
  const owned = new Set<string>();
  const packets: DriftPacket[] = [];

  for (const cap of capabilities) {
    const capId = asString(cap.data["id"]);
    if (capId === undefined) continue;
    const files = sortedFiles.filter((f) => matchAny(f, capabilityPaths(cap)));
    if (files.length === 0) continue;
    files.forEach((f) => owned.add(f));

    // capability ←touches← evidence →evidences→ brief →decomposes→ contract
    const evidenceIds = sourcesOf(spec, "touches", [capId]);
    const briefIds = targetsOf(spec, "evidences", evidenceIds);
    const contractIds = targetsOf(spec, "decomposes", briefIds);
    const approvedContract = contractIds.find((id) => asString(byId.get(id)?.data["status"]) === "approved") ?? null;

    packets.push({
      capability: capId,
      capabilityTitle: title(byId, capId),
      changedFiles: files,
      contracts: contractIds.map((id) => ref(byId, id)),
      approvedContract,
      briefs: briefIds.map((id) => ref(byId, id)),
      priorEvidence: evidenceIds.map((id) => ({ id, title: title(byId, id) })),
      linkState: contractIds.length > 0 ? "linked" : "unlinked",
    });
  }

  packets.sort((a, b) => (a.capability < b.capability ? -1 : a.capability > b.capability ? 1 : 0));
  return { packets, uncovered: sortedFiles.filter((f) => !owned.has(f)) };
}

/** Resolve the base ref, derive the changed files, and build the drift map. */
export function runDriftMap(spec: LoadedSpec): DriftMapResult {
  return buildDriftMap(spec, gitChangedFiles(resolveBase()));
}
