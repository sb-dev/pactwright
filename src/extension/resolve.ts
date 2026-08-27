import type { ConfigExtension, PactwrightConfig } from "../config/config.js";
import type { LockFile } from "../config/lock.js";
import type { Problem } from "../errors.js";
import {
  CORE_EDGE_SCHEMAS,
  CORE_EDGE_TYPES,
  createEdgeSchemaRegistry,
  type EdgeSchema,
  type EdgeSchemaRegistry,
} from "../graph/edge-schema.js";
import { canonicalJson } from "../graph/revision.js";
import {
  CORE_NODE_SCHEMAS,
  CORE_NODE_TYPES,
  createNodeSchemaRegistry,
  type NodeSchema,
  type NodeSchemaRegistry,
} from "../graph/schema.js";
import { isPathSource, locatePackage, satisfiesRange, sha256 } from "../pack/locate.js";
import { loadExtensionManifest, type ExtensionManifest } from "./manifest.js";
import { runtimeVersion } from "../version.js";

/**
 * Command namespaces the runtime owns; no extension may register them.
 * Includes commands that arrive in later checkpoints so an extension cannot
 * squat on a future core surface.
 */
export const RESERVED_NAMESPACES = [
  "agent-pack",
  "context",
  "eval",
  "extension",
  "github",
  "help",
  "init",
  "lifecycle",
  "sync",
  "upgrade",
  "validate",
  "version",
] as const;

/** One extension resolved from configuration to exact state. */
export interface ResolvedExtension {
  readonly id: string;
  /** Absolute extension package root: where `extension.yml` lives. */
  readonly dir: string;
  readonly config: ConfigExtension;
  readonly manifest: ExtensionManifest;
  /** Hash of the resolved manifest, recorded in the lock. */
  readonly hash: string;
}

export interface ResolveExtensionsOptions {
  readonly root: string;
  readonly config: PactwrightConfig;
  /** Defaults to the running runtime's version. */
  readonly runtimeVersion?: string;
}

function manifestHash(manifest: ExtensionManifest): string {
  return sha256(
    canonicalJson({
      id: manifest.id,
      package: manifest.package,
      version: manifest.version,
      pactwright: manifest.pactwright,
      dependencies: manifest.dependencies,
      node_types: manifest.nodeTypes,
      edge_types: manifest.edgeTypes,
      namespaces: manifest.namespaces,
      agent_capabilities: manifest.agentCapabilities,
      github_profile: manifest.githubProfile,
    }),
  );
}

/** Reports every dependency cycle among the resolved manifests once. */
function cycleProblems(byId: ReadonlyMap<string, ExtensionManifest>): Problem[] {
  const problems: Problem[] = [];
  const states = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (id: string): void => {
    const state = states.get(id);
    if (state === "done") return;
    if (state === "visiting") {
      const cycle = [...stack.slice(stack.indexOf(id)), id];
      problems.push({
        code: "extension-dependency-cycle",
        message: `extension dependencies form a cycle: ${cycle.join(" → ")}`,
      });
      return;
    }
    states.set(id, "visiting");
    stack.push(id);
    for (const dep of byId.get(id)?.dependencies ?? []) {
      if (byId.has(dep)) visit(dep);
    }
    stack.pop();
    states.set(id, "done");
  };
  for (const id of [...byId.keys()].sort()) visit(id);
  return problems;
}

/**
 * Resolves every configured extension (Distribution §§4–5): locate the
 * package, load and validate its manifest, check runtime compatibility,
 * dependency completeness, namespace registration and graph-type ownership.
 * Disabled extensions resolve too — their graph types stay registered so
 * existing records keep their meaning — but only enabled extensions
 * contribute namespaces, capabilities and behaviour. Never throws; returns
 * every problem found in one pass.
 */
export function resolveExtensions(options: ResolveExtensionsOptions): {
  value: readonly ResolvedExtension[] | undefined;
  problems: readonly Problem[];
} {
  const { root, config } = options;
  const runtime = options.runtimeVersion ?? runtimeVersion();
  const problems: Problem[] = [];
  const resolved: ResolvedExtension[] = [];
  const ids = Object.keys(config.extensions).sort();

  for (const id of ids) {
    const entry = config.extensions[id]!;
    const located = locatePackage(root, entry.source, "extension");
    if (typeof located !== "string") {
      problems.push({
        ...located,
        code:
          located.code === "pack-not-exported" ? "extension-not-exported" : "extension-not-found",
      });
      continue;
    }
    const loaded = loadExtensionManifest(located);
    if (loaded.value === undefined) {
      problems.push(...loaded.problems);
      continue;
    }
    const manifest = loaded.value;
    const path = `${located}/extension.yml`;
    if (manifest.id !== id) {
      problems.push({
        code: "extension-id-mismatch",
        message: `config.extensions.${id} resolves a manifest declaring id "${manifest.id}"`,
        path,
      });
      continue;
    }
    if (!isPathSource(entry.source) && manifest.package !== entry.source) {
      problems.push({
        code: "extension-package-mismatch",
        message: `extension "${id}" manifest declares package "${manifest.package}" but config.extensions.${id}.source is "${entry.source}"`,
        path,
      });
    }
    if (!satisfiesRange(runtime, manifest.pactwright)) {
      problems.push({
        code: "incompatible-runtime",
        message: `extension "${id}@${manifest.version}" requires pactwright ${manifest.pactwright}; this runtime is ${runtime}`,
        path,
      });
    }
    resolved.push({ id, dir: located, config: entry, manifest, hash: manifestHash(manifest) });
  }

  // Dependency completeness: every dependency must be configured, and an
  // enabled extension's dependencies must themselves be enabled — the rule
  // that makes disabling a dependency underneath a dependant a reported
  // problem rather than silent breakage (Distribution §4).
  for (const extension of resolved) {
    for (const dep of extension.manifest.dependencies) {
      const configured = Object.hasOwn(config.extensions, dep) ? config.extensions[dep] : undefined;
      if (configured === undefined) {
        problems.push({
          code: "extension-dependency-missing",
          message: `extension "${extension.id}" requires extension "${dep}", which is not configured`,
        });
      } else if (extension.config.enabled && !configured.enabled) {
        problems.push({
          code: "extension-dependency-disabled",
          message: `extension "${extension.id}" is enabled but its dependency "${dep}" is disabled`,
        });
      }
    }
  }
  problems.push(...cycleProblems(new Map(resolved.map((e) => [e.id, e.manifest]))));

  // Namespace registration: enabled extensions only (a disabled extension
  // contributes no behaviour), checked against the runtime's own commands
  // and against every other enabled extension.
  const namespaceOwners = new Map<string, string>();
  for (const extension of resolved.filter((e) => e.config.enabled)) {
    for (const namespace of extension.manifest.namespaces) {
      if ((RESERVED_NAMESPACES as readonly string[]).includes(namespace)) {
        problems.push({
          code: "reserved-namespace",
          message: `extension "${extension.id}" registers command namespace "${namespace}", which the runtime reserves`,
        });
        continue;
      }
      const owner = namespaceOwners.get(namespace);
      if (owner !== undefined) {
        problems.push({
          code: "duplicate-namespace",
          message: `extensions "${owner}" and "${extension.id}" both register command namespace "${namespace}"`,
        });
      } else {
        namespaceOwners.set(namespace, extension.id);
      }
    }
  }

  // Graph-type ownership: flat shared namespace; collisions with the core
  // types or another extension are configuration errors, reported here
  // rather than thrown at registry construction.
  const nodeOwners = new Map<string, string>(CORE_NODE_TYPES.map((t) => [t, "core"]));
  const edgeOwners = new Map<string, string>(CORE_EDGE_TYPES.map((t) => [t, "core"]));
  for (const extension of resolved) {
    for (const [owners, types, kind] of [
      [nodeOwners, extension.manifest.nodeTypes, "node"],
      [edgeOwners, extension.manifest.edgeTypes, "edge"],
    ] as const) {
      for (const type of types) {
        const owner = owners.get(type);
        if (owner !== undefined) {
          problems.push({
            code: `duplicate-${kind}-type`,
            message: `extension "${extension.id}" registers ${kind} type "${type}", already owned by "${owner}"`,
          });
        } else {
          owners.set(type, extension.id);
        }
      }
    }
  }

  if (problems.length > 0) return { value: undefined, problems };
  return { value: resolved, problems: [] };
}

/** Manifests of the enabled extensions, the set that contributes behaviour. */
export function enabledManifests(
  extensions: readonly ResolvedExtension[],
): readonly ExtensionManifest[] {
  return extensions.filter((e) => e.config.enabled).map((e) => e.manifest);
}

/** The lock entries recording exactly this resolved extension set (Distribution §6). */
export function extensionLockEntries(
  extensions: readonly ResolvedExtension[],
): LockFile["extensions"] {
  const versions = new Map(extensions.map((e) => [e.id, e.manifest.version]));
  return Object.fromEntries(
    [...extensions]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((extension) => {
        const dependencies = Object.fromEntries(
          [...extension.manifest.dependencies]
            .sort()
            .filter((dep) => versions.has(dep))
            .map((dep) => [dep, versions.get(dep)!]),
        );
        return [
          extension.id,
          {
            package: extension.manifest.package,
            version: extension.manifest.version,
            hash: extension.hash,
            ...(Object.keys(dependencies).length === 0 ? {} : { dependencies }),
          },
        ];
      }),
  );
}

/**
 * Graph schemas contributed by the resolved extensions (enabled or not, so
 * records owned by a disabled extension keep their meaning). The manifest
 * registers type names only; contributed schemas are structural — permissive
 * endpoints, no extra required fields — and owned by the extension id.
 */
export function extensionSchemas(extensions: readonly ResolvedExtension[]): {
  readonly nodes: readonly NodeSchema[];
  readonly edges: readonly EdgeSchema[];
} {
  const nodes: NodeSchema[] = [];
  const edges: EdgeSchema[] = [];
  for (const extension of [...extensions].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const type of extension.manifest.nodeTypes) {
      nodes.push({ type, requiredFields: [] });
    }
    for (const type of extension.manifest.edgeTypes) {
      edges.push({ type, owner: extension.id, sourceTypes: "any", targetTypes: "any" });
    }
  }
  return { nodes, edges };
}

/** The core registries extended with every type the resolved extensions register. */
export function composedRegistries(extensions: readonly ResolvedExtension[]): {
  readonly nodes: NodeSchemaRegistry;
  readonly edges: EdgeSchemaRegistry;
} {
  if (extensions.length === 0) return { nodes: CORE_NODE_SCHEMAS, edges: CORE_EDGE_SCHEMAS };
  const contributed = extensionSchemas(extensions);
  return {
    nodes: createNodeSchemaRegistry([...Object.values(CORE_NODE_SCHEMAS), ...contributed.nodes]),
    edges: createEdgeSchemaRegistry([...Object.values(CORE_EDGE_SCHEMAS), ...contributed.edges]),
  };
}
