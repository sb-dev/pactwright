import { existsSync } from "node:fs";
import { join as joinPath } from "node:path";
import type { ParseResult } from "../config/config.js";
import { EXTENSION_ID_PATTERN } from "../config/lock.js";
import { CAPABILITY_PATTERN } from "../pack/capabilities.js";
import { COMPAT_PATTERN, PACKAGE_NAME_PATTERN, VERSION_PATTERN } from "../pack/manifest.js";
import {
  Checker,
  expectEnum,
  expectInteger,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
  type UnknownRecord,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/** File name of an extension manifest at the extension package root. */
export const EXTENSION_MANIFEST_FILE = "extension.yml";

/**
 * A versioned extension manifest (Distribution §5). The manifest declares
 * runtime compatibility, extension dependencies, graph contribution, command
 * namespaces, required agent capabilities and the GitHub profile. It
 * contains no project-specific configuration.
 */
export interface ExtensionManifest {
  readonly id: string;
  readonly package: string;
  readonly version: string;
  /** Compatible runtime: an exact version or a `^x.y.z` caret range. */
  readonly pactwright: string;
  /** Ids of extensions this extension requires, in declaration order. */
  readonly dependencies: readonly string[];
  /** Node types this extension owns and registers in the Project Graph. */
  readonly nodeTypes: readonly string[];
  /** Edge types this extension owns; shared core relations are reused, not redeclared. */
  readonly edgeTypes: readonly string[];
  /**
   * What each contributed node type requires, when the manifest declares it
   * in the map form. A bare list registers the name only, which is what
   * every contributed type used to be.
   */
  readonly nodeSchemas: Readonly<Record<string, ExtensionNodeType>>;
  /** Endpoint types for each contributed edge type, from the map form. */
  readonly edgeSchemas: Readonly<Record<string, ExtensionEdgeType>>;
  /** The schema version this release of the extension expects its records at. */
  readonly schemaVersion: number;
  /** Declared, ordered steps from version 1 up to `schemaVersion`. */
  readonly migrations: readonly ExtensionMigration[];
  /** Command namespaces the extension registers (`runtime.namespace` or `runtime.namespaces`). */
  readonly namespaces: readonly string[];
  /** Agent capabilities the selected pack must provide while this extension is enabled. */
  readonly agentCapabilities: readonly string[];
  /**
   * Declared GitHub profile: logical automation/projection requirements.
   * Metadata only in this checkpoint — nothing acts on it until GitHub
   * provisioning exists.
   */
  readonly githubProfile?: string;
}

/**
 * What an Extension declares about one node type it owns (Distribution §11).
 *
 * "A registered type name is not a schema": until this existed, a contributed
 * type became `requiredFields: []` with no relationships, so an Extension's
 * own records were accepted whatever shape they had.
 */
export interface ExtensionNodeType {
  readonly requiredFields: readonly string[];
  readonly relationships: readonly ExtensionRelationship[];
}

export interface ExtensionRelationship {
  readonly type: string;
  readonly direction: "in" | "out";
  readonly min: number;
  readonly max?: number;
}

/** Endpoint types for one contributed edge type. Declared, never open. */
export interface ExtensionEdgeType {
  readonly sourceTypes: readonly string[];
  readonly targetTypes: readonly string[];
}

/**
 * One declared, ordered step between two schema versions (Distribution §11,
 * §15).
 *
 * The operations are Pactwright's, not the Extension's: an Extension is a
 * manifest, and running code it ships would make it something else. What a
 * migration can do is therefore bounded by this list, which is also what
 * makes it checkable before it is written.
 */
export interface ExtensionMigration {
  readonly from: number;
  readonly to: number;
  readonly operations: readonly MigrationOperation[];
}

export type MigrationOperation =
  | { readonly kind: "rename"; readonly type: string; readonly from: string; readonly to: string }
  | {
      readonly kind: "set-default";
      readonly type: string;
      readonly field: string;
      readonly value: string;
    }
  | { readonly kind: "remove"; readonly type: string; readonly field: string };

const FIELD_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * The `graph:` block in either form.
 *
 * A bare list keeps its meaning — a registered type with no extra
 * requirements — so manifests written against the previous shape keep
 * working. A map adds the semantics §11 describes.
 */
function parseGraphTypes(
  c: Checker,
  record: UnknownRecord,
): {
  nodeTypes: string[];
  edgeTypes: string[];
  nodeSchemas: Record<string, ExtensionNodeType>;
  edgeSchemas: Record<string, ExtensionEdgeType>;
} {
  const nodeSchemas: Record<string, ExtensionNodeType> = {};
  const edgeSchemas: Record<string, ExtensionEdgeType> = {};

  const nodeTypes = Array.isArray(record["node_types"])
    ? parseTokenList(
        c,
        record["node_types"],
        "extension.graph.node_types",
        EXTENSION_ID_PATTERN,
        "node type",
      )
    : parseNodeTypeMap(c, record["node_types"], nodeSchemas);

  const edgeTypes = Array.isArray(record["edge_types"])
    ? parseTokenList(
        c,
        record["edge_types"],
        "extension.graph.edge_types",
        EXTENSION_ID_PATTERN,
        "edge type",
      )
    : parseEdgeTypeMap(c, record["edge_types"], edgeSchemas);

  return { nodeTypes, edgeTypes, nodeSchemas, edgeSchemas };
}

function parseNodeTypeMap(
  c: Checker,
  raw: unknown,
  into: Record<string, ExtensionNodeType>,
): string[] {
  if (raw === undefined) return [];
  const record = expectRecord(c, raw, "extension.graph.node_types");
  if (record === undefined) return [];
  const types: string[] = [];
  for (const type of Object.keys(record).sort()) {
    if (!EXTENSION_ID_PATTERN.test(type)) {
      c.fail("invalid-value", `extension.graph.node_types "${type}" is not a valid node type`);
      continue;
    }
    types.push(type);
    const declared = expectRecord(c, record[type], `extension.graph.node_types.${type}`);
    if (declared === undefined) {
      into[type] = { requiredFields: [], relationships: [] };
      continue;
    }
    rejectUnknownKeys(c, declared, `extension.graph.node_types.${type}`, [
      "required_fields",
      "relationships",
    ]);
    into[type] = {
      requiredFields: parseTokenList(
        c,
        declared["required_fields"],
        `extension.graph.node_types.${type}.required_fields`,
        FIELD_PATTERN,
        "field name",
      ),
      relationships: parseRelationships(
        c,
        declared["relationships"],
        `extension.graph.node_types.${type}.relationships`,
      ),
    };
  }
  return types;
}

function parseRelationships(c: Checker, raw: unknown, label: string): ExtensionRelationship[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    c.fail("invalid-type", `${label} must be a list`);
    return [];
  }
  const rules: ExtensionRelationship[] = [];
  for (const [index, entry] of raw.entries()) {
    const at = `${label}[${index}]`;
    const record = expectRecord(c, entry, at);
    if (record === undefined) continue;
    rejectUnknownKeys(c, record, at, ["type", "direction", "min", "max"]);
    requireKeys(c, record, at, ["type", "direction", "min"]);
    const type = expectString(c, record["type"], `${at}.type`);
    const direction = expectEnum(c, record["direction"], `${at}.direction`, ["in", "out"] as const);
    const min = expectInteger(c, record["min"], `${at}.min`);
    const max =
      record["max"] === undefined ? undefined : expectInteger(c, record["max"], `${at}.max`);
    if (type === undefined || direction === undefined || min === undefined) continue;
    if (min < 0) {
      c.fail("invalid-value", `${at}.min must not be negative`);
      continue;
    }
    if (max !== undefined && max < min) {
      c.fail("invalid-value", `${at}.max (${max}) is below ${at}.min (${min})`);
      continue;
    }
    rules.push({ type, direction, min, ...(max === undefined ? {} : { max }) });
  }
  return rules;
}

function parseEdgeTypeMap(
  c: Checker,
  raw: unknown,
  into: Record<string, ExtensionEdgeType>,
): string[] {
  if (raw === undefined) return [];
  const record = expectRecord(c, raw, "extension.graph.edge_types");
  if (record === undefined) return [];
  const types: string[] = [];
  for (const type of Object.keys(record).sort()) {
    if (!EXTENSION_ID_PATTERN.test(type)) {
      c.fail("invalid-value", `extension.graph.edge_types "${type}" is not a valid edge type`);
      continue;
    }
    types.push(type);
    const at = `extension.graph.edge_types.${type}`;
    const declared = expectRecord(c, record[type], at);
    if (declared === undefined) continue;
    rejectUnknownKeys(c, declared, at, ["source_types", "target_types"]);
    // §11: "Endpoint types are declared, not open." An edge registered
    // without them leaves its own records unvalidated, which is the state
    // every contributed edge type used to be in.
    requireKeys(c, declared, at, ["source_types", "target_types"]);
    into[type] = {
      sourceTypes: parseTokenList(
        c,
        declared["source_types"],
        `${at}.source_types`,
        EXTENSION_ID_PATTERN,
        "node type",
      ),
      targetTypes: parseTokenList(
        c,
        declared["target_types"],
        `${at}.target_types`,
        EXTENSION_ID_PATTERN,
        "node type",
      ),
    };
  }
  return types;
}

/**
 * Declared, versioned migrations, checked for a contiguous chain.
 *
 * A gap or an overlap is a manifest fault rather than something to resolve
 * at run time: §15 requires migrations to be "explicitly defined", and a
 * chain that does not reach the declared schema version cannot be.
 */
function parseMigrations(c: Checker, raw: unknown, schemaVersion: number): ExtensionMigration[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    c.fail("invalid-type", "extension.graph.migrations must be a list");
    return [];
  }
  const migrations: ExtensionMigration[] = [];
  for (const [index, entry] of raw.entries()) {
    const at = `extension.graph.migrations[${index}]`;
    const record = expectRecord(c, entry, at);
    if (record === undefined) continue;
    rejectUnknownKeys(c, record, at, ["from", "to", "operations"]);
    requireKeys(c, record, at, ["from", "to", "operations"]);
    const from = expectInteger(c, record["from"], `${at}.from`);
    const to = expectInteger(c, record["to"], `${at}.to`);
    if (from === undefined || to === undefined) continue;
    if (to !== from + 1) {
      c.fail("invalid-value", `${at} must step one version at a time, not ${from} to ${to}`);
      continue;
    }
    migrations.push({ from, to, operations: parseOperations(c, record["operations"], at) });
  }

  migrations.sort((a, b) => a.from - b.from);
  for (const [index, migration] of migrations.entries()) {
    const expected = index + 1;
    if (migration.from !== expected) {
      c.fail(
        "invalid-value",
        `extension.graph.migrations must form an unbroken chain from version 1; found a step from ${migration.from} where ${expected} was expected`,
      );
      break;
    }
  }
  const last = migrations[migrations.length - 1];
  if (last !== undefined && last.to !== schemaVersion) {
    c.fail(
      "invalid-value",
      `extension.graph.migrations end at version ${last.to} but extension.graph.schema_version is ${schemaVersion}`,
    );
  }
  return migrations;
}

function parseOperations(c: Checker, raw: unknown, label: string): MigrationOperation[] {
  if (!Array.isArray(raw)) {
    c.fail("invalid-type", `${label}.operations must be a list`);
    return [];
  }
  const operations: MigrationOperation[] = [];
  for (const [index, entry] of raw.entries()) {
    const at = `${label}.operations[${index}]`;
    const record = expectRecord(c, entry, at);
    if (record === undefined) continue;
    const kind = expectEnum(c, record["kind"], `${at}.kind`, [
      "rename",
      "set-default",
      "remove",
    ] as const);
    if (kind === undefined) continue;
    const type = expectString(c, record["type"], `${at}.type`);
    if (type === undefined) continue;
    if (kind === "rename") {
      rejectUnknownKeys(c, record, at, ["kind", "type", "from", "to"]);
      requireKeys(c, record, at, ["from", "to"]);
      const from = expectString(c, record["from"], `${at}.from`);
      const to = expectString(c, record["to"], `${at}.to`);
      if (from !== undefined && to !== undefined) operations.push({ kind, type, from, to });
      continue;
    }
    if (kind === "set-default") {
      rejectUnknownKeys(c, record, at, ["kind", "type", "field", "value"]);
      requireKeys(c, record, at, ["field", "value"]);
      const field = expectString(c, record["field"], `${at}.field`);
      const value = expectString(c, record["value"], `${at}.value`);
      if (field !== undefined && value !== undefined) operations.push({ kind, type, field, value });
      continue;
    }
    rejectUnknownKeys(c, record, at, ["kind", "type", "field"]);
    requireKeys(c, record, at, ["field"]);
    const field = expectString(c, record["field"], `${at}.field`);
    if (field !== undefined) operations.push({ kind, type, field });
  }
  return operations;
}

function parseTokenList(
  c: Checker,
  raw: unknown,
  label: string,
  pattern: RegExp,
  kind: string,
): string[] {
  const out: string[] = [];
  if (raw === undefined) return out;
  if (!Array.isArray(raw)) {
    c.fail("invalid-type", `${label} must be a list`);
    return out;
  }
  raw.forEach((item, index) => {
    const text = expectString(c, item, `${label}[${index}]`);
    if (text === undefined) return;
    if (!pattern.test(text)) {
      c.fail("invalid-value", `${label}[${index}] "${text}" is not a valid ${kind}`);
    } else if (out.includes(text)) {
      c.fail("duplicate-value", `${label} lists "${text}" more than once`);
    } else {
      out.push(text);
    }
  });
  return out;
}

/** Parses extension manifest data; structural checks only, no filesystem access. */
export function parseExtensionManifest(raw: unknown, path: string): ParseResult<ExtensionManifest> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "extension");
  if (root === undefined) {
    c.fail("invalid-type", "extension manifest must be a mapping");
    return { value: undefined, problems: c.problems };
  }
  requireKeys(c, root, "extension", ["id", "package", "version", "pactwright"]);
  rejectUnknownKeys(c, root, "extension", [
    "id",
    "package",
    "version",
    "pactwright",
    "dependencies",
    "graph",
    "runtime",
    "agent_capabilities",
    "github",
  ]);

  const id = expectString(c, root["id"], "extension.id");
  if (id !== undefined && !EXTENSION_ID_PATTERN.test(id)) {
    c.fail("invalid-extension-id", `extension.id "${id}" is not a valid extension id`);
  }
  const pkg = expectString(c, root["package"], "extension.package");
  if (pkg !== undefined && (pkg.length > 214 || !PACKAGE_NAME_PATTERN.test(pkg))) {
    c.fail(
      "invalid-value",
      `extension.package must be a lowercase npm package name (optionally scoped), found "${pkg}"`,
    );
  }
  const version = expectString(c, root["version"], "extension.version");
  if (version !== undefined && !VERSION_PATTERN.test(version)) {
    c.fail("invalid-value", `extension.version must be x.y.z, found "${version}"`);
  }
  const pactwright = expectString(c, root["pactwright"], "extension.pactwright");
  if (pactwright !== undefined && !COMPAT_PATTERN.test(pactwright)) {
    c.fail("invalid-value", `extension.pactwright must be x.y.z or ^x.y.z, found "${pactwright}"`);
  }

  let dependencies: string[] = [];
  if (root["dependencies"] !== undefined) {
    const record = expectRecord(c, root["dependencies"], "extension.dependencies");
    if (record !== undefined) {
      requireKeys(c, record, "extension.dependencies", ["extensions"]);
      rejectUnknownKeys(c, record, "extension.dependencies", ["extensions"]);
      dependencies = parseTokenList(
        c,
        record["extensions"],
        "extension.dependencies.extensions",
        EXTENSION_ID_PATTERN,
        "extension id",
      );
    }
  }

  let nodeTypes: string[] = [];
  let edgeTypes: string[] = [];
  let nodeSchemas: Record<string, ExtensionNodeType> = {};
  let edgeSchemas: Record<string, ExtensionEdgeType> = {};
  let migrations: ExtensionMigration[] = [];
  let schemaVersion = 1;
  if (root["graph"] !== undefined) {
    const record = expectRecord(c, root["graph"], "extension.graph");
    if (record !== undefined) {
      rejectUnknownKeys(c, record, "extension.graph", [
        "node_types",
        "edge_types",
        "schema_version",
        "migrations",
      ]);
      const declared = parseGraphTypes(c, record);
      nodeTypes = declared.nodeTypes;
      edgeTypes = declared.edgeTypes;
      nodeSchemas = declared.nodeSchemas;
      edgeSchemas = declared.edgeSchemas;
      if (record["schema_version"] !== undefined) {
        schemaVersion =
          expectInteger(c, record["schema_version"], "extension.graph.schema_version") ?? 1;
      }
      migrations = parseMigrations(c, record["migrations"], schemaVersion);
    }
  }

  // Distribution §5 uses both `runtime.namespace: x` and `runtime.namespaces: [x, y]`.
  let namespaces: string[] = [];
  if (root["runtime"] !== undefined) {
    const record = expectRecord(c, root["runtime"], "extension.runtime");
    if (record !== undefined) {
      rejectUnknownKeys(c, record, "extension.runtime", ["namespace", "namespaces"]);
      if (record["namespace"] !== undefined && record["namespaces"] !== undefined) {
        c.fail(
          "invalid-value",
          "extension.runtime declares both namespace and namespaces; use one form",
        );
      } else if (record["namespace"] !== undefined) {
        const namespace = expectString(c, record["namespace"], "extension.runtime.namespace");
        if (namespace !== undefined && !EXTENSION_ID_PATTERN.test(namespace)) {
          c.fail(
            "invalid-value",
            `extension.runtime.namespace "${namespace}" is not a valid command namespace`,
          );
        } else if (namespace !== undefined) {
          namespaces = [namespace];
        }
      } else {
        namespaces = parseTokenList(
          c,
          record["namespaces"],
          "extension.runtime.namespaces",
          EXTENSION_ID_PATTERN,
          "command namespace",
        );
      }
    }
  }

  const agentCapabilities = parseTokenList(
    c,
    root["agent_capabilities"],
    "extension.agent_capabilities",
    CAPABILITY_PATTERN,
    "capability name",
  );

  let githubProfile: string | undefined;
  if (root["github"] !== undefined) {
    const record = expectRecord(c, root["github"], "extension.github");
    if (record !== undefined) {
      requireKeys(c, record, "extension.github", ["profile"]);
      rejectUnknownKeys(c, record, "extension.github", ["profile"]);
      githubProfile = expectString(c, record["profile"], "extension.github.profile");
    }
  }

  if (
    !c.ok ||
    id === undefined ||
    pkg === undefined ||
    version === undefined ||
    pactwright === undefined
  ) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      id,
      package: pkg,
      version,
      pactwright,
      dependencies,
      nodeTypes,
      edgeTypes,
      nodeSchemas,
      edgeSchemas,
      schemaVersion,
      migrations,
      namespaces,
      agentCapabilities,
      ...(githubProfile === undefined ? {} : { githubProfile }),
    },
    problems: [],
  };
}

/** Loads and validates the manifest at `<dir>/extension.yml`. */
export function loadExtensionManifest(dir: string): ParseResult<ExtensionManifest> {
  const manifestPath = joinPath(dir, EXTENSION_MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    return {
      value: undefined,
      problems: [
        {
          code: "extension-not-found",
          message: `no ${EXTENSION_MANIFEST_FILE} found`,
          path: manifestPath,
        },
      ],
    };
  }
  const read = readYamlFile(manifestPath);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseExtensionManifest(read.value, manifestPath);
}
