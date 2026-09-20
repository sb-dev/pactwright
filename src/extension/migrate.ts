import { renameSync, writeFileSync } from "node:fs";
import { tempSibling } from "../atomic.js";
import type { Problem } from "../errors.js";
import type { GraphNode } from "../graph/nodes.js";
import { serialiseNode } from "../graph/mutations.js";
import type { ExtensionMigration, MigrationOperation } from "./manifest.js";

/**
 * Versioned Extension schema migrations (Distribution §11, §15).
 *
 * An Extension that changes the shape of the canonical records it owns had
 * no declared way to migrate them, so `extension upgrade` re-locked without
 * reinterpreting anything it had contributed — the open Intent
 * `intent-give-extensions-versioned-schema-migrations-2bebaf56`. This runs
 * the steps a manifest declares, and only those.
 *
 * Migrations are data, not code. Pactwright applies the operations itself,
 * so an Extension stays a manifest: nothing it ships is ever executed, and
 * what a migration can do is bounded by the list below rather than by
 * whatever a script could reach.
 *
 * Nothing is written until every record has been rewritten in memory and the
 * result has passed the caller's validation, and the whole thing runs inside
 * the environment transaction — so canonical state is either fully migrated
 * or untouched, which is what §15 requires.
 */

/** Where an extension's records currently sit, read from the project lock. */
export const SCHEMA_VERSION_FIELD = "schema_version";

export interface MigrationPlan {
  readonly extension: string;
  readonly from: number;
  readonly to: number;
  /** The steps to apply, in order. Empty when nothing is pending. */
  readonly steps: readonly ExtensionMigration[];
  readonly problems: readonly Problem[];
}

/**
 * The steps that carry `extension`'s records from `from` to its declared
 * schema version.
 *
 * A record set ahead of the manifest is a downgrade, which is not a
 * migration: §15 has no backward step, and silently reinterpreting newer
 * records as older ones is exactly the reinterpretation it forbids.
 */
export function planMigration(
  extension: string,
  from: number,
  declared: number,
  migrations: readonly ExtensionMigration[],
): MigrationPlan {
  if (from === declared) {
    return { extension, from, to: declared, steps: [], problems: [] };
  }
  if (from > declared) {
    return {
      extension,
      from,
      to: declared,
      steps: [],
      problems: [
        {
          code: "extension-schema-ahead",
          message: `extension "${extension}" records are at schema version ${from} but the installed manifest declares ${declared}; Pactwright does not migrate canonical records backwards`,
        },
      ],
    };
  }

  const steps: ExtensionMigration[] = [];
  for (let at = from; at < declared; at += 1) {
    const step = migrations.find((migration) => migration.from === at);
    if (step === undefined) {
      return {
        extension,
        from,
        to: declared,
        steps: [],
        problems: [
          {
            code: "extension-migration-missing",
            message: `extension "${extension}" declares schema version ${declared} but no migration from version ${at}; a schema change needs an explicitly defined, versioned migration (Distribution §15)`,
          },
        ],
      };
    }
    steps.push(step);
  }
  return { extension, from, to: declared, steps, problems: [] };
}

export interface MigrationResult {
  /** Paths whose contents changed, sorted. */
  readonly changed: readonly string[];
  /** The rewritten records, in memory. The caller writes them. */
  readonly records: readonly { readonly path: string; readonly content: string }[];
  readonly problems: readonly Problem[];
}

/**
 * Applies `plan` to the records of the types `owned` names, in memory.
 *
 * Only the extension's own types are touched. §11: an Extension's
 * declarations "constrain the Extension's own contributed types; they cannot
 * add fields to, relax or reinterpret a core Delivery type", and a migration
 * reaching a core record would be exactly that.
 */
export function applyMigration(
  /**
   * The records as they are on disk, read *without* schema validation.
   *
   * A migration exists precisely because the records do not satisfy the new
   * schema yet, so loading them through the canonical path — which validates
   * against the installed manifest — would fail on the very records it is
   * about to fix.
   */
  nodes: readonly GraphNode[],
  plan: MigrationPlan,
  owned: ReadonlySet<string>,
): MigrationResult {
  const problems: Problem[] = [];
  const records: { path: string; content: string }[] = [];
  const changed: string[] = [];

  for (const node of nodes) {
    if (!owned.has(node.type)) continue;
    let frontmatter: Record<string, unknown> = { ...node.frontmatter };
    let touched = false;
    for (const step of plan.steps) {
      for (const operation of step.operations) {
        if (operation.type !== node.type) continue;
        const applied = apply(frontmatter, operation, node, problems);
        if (applied === undefined) continue;
        frontmatter = applied;
        touched = true;
      }
    }
    if (!touched) continue;
    const migrated: GraphNode = {
      ...node,
      ...(frontmatter as Partial<GraphNode>),
      frontmatter,
      body: node.body,
      path: node.path,
    };
    records.push({ path: node.path, content: serialiseNode(migrated) });
    changed.push(node.path);
  }

  return { changed: changed.sort(), records, problems };
}

function apply(
  frontmatter: Readonly<Record<string, unknown>>,
  operation: MigrationOperation,
  node: GraphNode,
  problems: Problem[],
): Record<string, unknown> | undefined {
  const next = { ...frontmatter };
  if (operation.kind === "rename") {
    if (!(operation.from in next)) return undefined;
    if (operation.to in next) {
      problems.push({
        code: "migration-conflict",
        message: `cannot rename "${operation.from}" to "${operation.to}" on "${node.id}": both fields are present`,
        path: node.path,
      });
      return undefined;
    }
    next[operation.to] = next[operation.from];
    delete next[operation.from];
    return next;
  }
  if (operation.kind === "set-default") {
    // A field that is already set keeps its value: a default fills a gap, it
    // does not reinterpret what somebody wrote.
    if (operation.field in next) return undefined;
    next[operation.field] = operation.value;
    return next;
  }
  if (!(operation.field in next)) return undefined;
  delete next[operation.field];
  return next;
}

/** Writes the migrated records atomically. The transaction owns the undo. */
export function writeMigration(result: MigrationResult): void {
  for (const record of result.records) {
    const temp = tempSibling(record.path);
    writeFileSync(temp, record.content, "utf8");
    renameSync(temp, record.path);
  }
}
