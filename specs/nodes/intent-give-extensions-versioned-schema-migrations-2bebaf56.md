---
id: intent-give-extensions-versioned-schema-migrations-2bebaf56
type: intent
title: Give Extensions versioned schema migrations
created: '2026-09-13'
---

Checkpoint 1 Step 16 requires that "canonical schema changes use explicitly
defined versioned migrations, not silent reinterpretation", and that
canonical state is protected from partial migration.

The runtime has versioned migration for its own configuration: `pactwright
upgrade` migrates a version 1 lifecycle document to version 2 and preserves
its operating policy, restoring the previous environment if it cannot
complete. Extensions have no equivalent. An Extension that changes the
shape of the canonical records it owns has no declared way to migrate them,
so `extension upgrade` re-resolves the package and re-locks without
reinterpreting or migrating anything it contributed to the graph.

Nothing in this release is corrupted by the gap, because no first-party
Extension ships canonical records yet and fixture Extensions contribute
none. It becomes load-bearing as soon as one does.

What is needed: a versioned migration declaration in the Extension
manifest, execution of those migrations during `extension upgrade` under
the same all-or-nothing discipline the runtime migration uses, and
detection of a pending or incomplete Extension migration in `doctor`.
