# Pactwright Distribution, Agent Packs, Extensions and Evaluation

## 1. Purpose

This specification defines how Pactwright is packaged, installed, configured, extended, composed with AI capabilities, synchronised, locked, upgraded, diagnosed and evaluated.

The architecture is:

```text
Pactwright Core
      ↓
enabled Pactwright Extensions
      ↓
required capabilities
      ↓
selected Agent Pack
      ↓
agents
      ↓
Production Skills
      ↓
Production Extension Packs
      ↓
execution adapter
```

Responsibilities are deliberately separated:

```text
Pactwright Core
→ stable semantics and deterministic runtime

Pactwright Extensions
→ optional Pactwright semantics

Agent Pack
→ AI implementation of Pactwright responsibilities

Production Skills
→ specialised production expertise

Production Extension Packs
→ specialised Production Skills knowledge

Adapter
→ execution-environment projection
```

Pactwright must not absorb production-domain workflows merely because it can execute them.

---

## 2. Scope

This specification owns:

- Pactwright distribution and initialisation;
- project configuration;
- package-manager integration;
- locking and reproducibility;
- Agent Packs;
- capability resolution;
- Pactwright Extension installation, removal and upgrade;
- Production Skills integration;
- Production Extension Pack resolution;
- adapters;
- synchronisation;
- runtime and component upgrades;
- migrations;
- environment diagnosis;
- compatibility validation;
- Pactwright-level evaluation and baseline comparison.

It does not own:

- Contract or lifecycle semantics;
- extension-specific graph semantics;
- exact GitHub projection mechanics;
- domain production workflows;
- Production Skill commands;
- Production Extension Pack internals;
- domain-specific benchmarks.

---

# 3. Distribution, Initialisation and Project Configuration

Pactwright is installed as a project development dependency using the project's package manager.

Example:

```text
pnpm add -D pactwright
```

Initialise a repository through:

```text
pnpm pactwright init
```

The initialised repository contains Pactwright configuration, Project Graph storage and generated adapter/integration surfaces. Users should not manually copy Pactwright runtime scripts, agents or workflow commands between repositories.

The repository-level Pactwright customisation mechanisms are:

```text
Agent Pack
Pactwright Extensions
Adapter
Lifecycle configuration
GitHub configuration
```

Production Skills are not another peer-level project setting. They are composed through the selected Agent Pack.

Conceptually:

```yaml
version: 1

agent_pack:
  source: "@pactwright/standard"
  version: "..."

adapter:
  type: claude-code

extensions: {}

github:
  enabled: true
```

Configuration records desired Pactwright state.

The released configuration format is the `version: 1` mapping above: an optional explicitly selected `agent_pack` with `source` and version constraint, adapter selection, an Extension-ID map and GitHub enablement. It remains a native input; missing pack selection denotes an unactivated scaffold, not implicit selection of standard. `extensions` maps each Extension ID to a mapping with `source` (string), `enabled` (boolean) and an optional `version` constraint (string); the released `0.0.1` decoder accepted only `source` and `enabled`, so the optional `version` key is a compatible addition within version 1. Configuration, lifecycle and lock documents reject unknown keys with path and cause, as the released decoders did; an unknown key makes the load incomplete rather than being preserved as inert data. The canonical loader reads this format without rewriting it. Unknown format versions are unsupported; the recognised earlier lock and lifecycle dispositions are specified in section 12 and Core section 27.

The package-manager manifest and lock record installed package state.

`.pactwright/lock.yml` records the exact resolved Pactwright execution environment.

One-shot initialisation options must compose the same underlying operations as the corresponding explicit commands rather than implement a separate setup path. For example:

```text
pactwright init --with project-intelligence --github
```

must compose normal initialisation, Extension installation and GitHub synchronisation.

The explicit Agent Pack choice is supplied to `init` through `--agent-pack <source>`, where `<source>` uses the `agent-pack use` grammar of section 5. This option is the documented init selection input; every one-shot option reuses it. `pactwright init --agent-pack <source>` composes plain initialisation and `agent-pack use <source>`, so it ends with the configuration, lock and generated output that the two commands produce in sequence, and `--with <extension>` additionally composes `extension add`. An init that names a pack, an Extension or GitHub validates the complete requested composition before it keeps any of it: a `--with` or `--github` without a selection, an incompatible or unresolvable selection, or an Extension that cannot be installed is refused with the repository byte-identical, a package dependency the attempt added removed and no scaffold left behind. `init` never prompts for a choice and never selects a pack that was not named.

A plain `pactwright init` with no selection creates the Core section 54 scaffold: configuration with no `agent_pack` and GitHub disabled, lifecycle configuration, the empty core stores (an empty `specs/nodes/.gitkeep` and `edges: []`) and the section 12 lock recording the runtime version and no pack. The scaffold is a complete load: every required input exists, its empty graph has a Project Graph revision, and `validate`, `doctor` and read-only lifecycle inspection run on it; `validate` reports it valid and exits zero, since the missing selection is `doctor`'s finding. It is not an executable environment: `sync`, `lifecycle run` and every capability invocation refuse it naming the missing selection, and `doctor` reports it as action required. `init` in an initialised repository preserves every existing file, including an explicit pack choice; a selection named on such an init is applied through `agent-pack use` when no pack is selected and refused when it differs from the selected pack. `init` stages and commits nothing.

---

# 4. Pactwright Capabilities

A capability identifies a semantic AI responsibility.

It does not identify:

- an agent;
- a skill;
- a model;
- a provider;
- a production domain.

Core capabilities are:

```text
delivery-specification
delivery-execution
delivery-review
```

Extensions may add genuinely distinct responsibilities. Current sourced examples include:

```text
graph-review
operations-analysis
```

Project Intelligence may also require Agent Pack capabilities, but its exact capability decomposition and identifiers remain unresolved in the Project Intelligence specification.

Do not create capabilities such as:

```text
software-delivery
creative-delivery
video-delivery
music-delivery
creative-verification
generation-review
```

when an existing Pactwright responsibility plus specialised skills is sufficient.

---

# 5. Agent Packs

An Agent Pack defines how AI performs Pactwright responsibilities.

It may contain:

```text
capability mappings
agents
prompts
direct skills
Production Skills imports
evaluation cases
```

Conceptually:

```yaml
capabilities:
  delivery-specification: spec
  delivery-execution: implementer
  delivery-review: reviewer
```

Agent identity is not capability identity.

## Recognised Agent Pack manifest

The current pack manifest is `pack.yml` at the pack root, in the released `0.0.1` shape: `name`, the npm package name that is the pack's source identity; `version`, an exact `x.y.z`; `pactwright`, the compatible runtime as an exact version or a `^x.y.z` caret range; `capabilities`, capability → agent key, each value naming an entry of `agents`; and `agents`, agent key → `prompt`, a relative file inside the pack, and optional `skills`, direct skill names each resolving to `skills/<name>.md` inside the pack. Every prompt and skill file must exist and be non-empty. A pack distributed as a package exposes `pack.yml` and `package.json` through its `exports`, and its manifest `name` and `version` equal the package's; a path-sourced pack has no package to agree with. An optional `production_skills` mapping, keyed by Production Skills family ID with at least a `source` string per entry, declares external Production Skills imports; it is a compatible addition within this shape, and until external Production Skills resolution is implemented the runtime reports each entry as unsupported by that release, resolving or dropping none, and a pack declaring any entry is not accepted by that release. Unknown keys are rejected with path and cause, as for the other Pactwright documents. The manifest declares no evaluation cases and no adapter content; those remain later compatible additions. A later incompatible manifest change needs an explicit format version and migration, not silent reinterpretation.

A project selects **one Agent Pack**.

Agent Pack composition is not required because one Agent Pack may already compose multiple Production Skills families.

The supported selection interface is:

```text
pactwright agent-pack use <source>
```

`<source>` is either a package name, optionally followed by `@` and an exact version or `^x.y.z` caret range that becomes the configured version constraint (without one, the caret range of the resolved exact version is recorded), or a relative (`./`, `../`) or absolute filesystem path to a pack directory, recorded as the source with no version constraint. A package source resolves from the project's installed packages, then from the runtime's own dependencies, which is how `@pactwright/standard` is found after the runtime is installed; when no installed package satisfies the request, the detected project package manager (section 15) installs it as a development dependency before resolution. Pactwright never copies, fetches or unpacks packages itself.

The operation must:

1. resolve a compatible complete pack;
2. validate it against core and enabled-Extension capabilities;
3. update configuration only after successful resolution;
4. record exact pack and agent identities in the lock;
5. run `pactwright sync`;
6. report any GitHub integration changes.

If required capabilities are missing, selection fails without replacing the current valid lock or generated environment.

Pactwright may recommend a compatible pack but must not silently select one.

Upgrade the currently configured Agent Pack through:

```text
pactwright agent-pack upgrade
```

This upgrades the selected pack within its configured compatibility constraints without changing Agent Pack identity.

---

# 6. Production Skills

Production Skills are independently maintained repositories containing specialised production expertise.

Examples include:

```text
software-engineering-skills
ui-ux-design-skills
deep-research-skills
video-game-development-skills
video-production-skills
music-production-skills
narrative-production-skills
```

They own their own:

```text
skills
skill commands
production workflows
Extension Packs
tools
examples
tests
benchmarks
evaluation
```

They must remain usable without Pactwright.

```text
standalone:
AI agent
→ Production Skills

with Pactwright:
Pactwright
→ Agent Pack
→ Production Skills
```

Pactwright must not require Production Skills repositories to adopt Pactwright lifecycle or Project Graph semantics.

---

# 7. Pactwright Integration Manifest

A Production Skills repository may optionally expose:

```text
integrations/
└── pactwright.yml
```

The manifest declares how its skills can participate in Pactwright responsibilities.

Conceptually:

```yaml
version: 1
id: video-production-skills

compatibility:
  pactwright: "..."

bindings:
  delivery-execution:
    skills:
      - video-production

  delivery-review:
    skills:
      - video-evaluate

extension_packs:
  path: extension-packs/
```

The exact schema may evolve.

The manifest should contain only:

```text
identity
Pactwright compatibility
capability → skill bindings
Production Extension Pack discovery
resolution metadata where necessary
```

It must not define:

```text
Pactwright agents
agent prompts
Pactwright commands
lifecycle shapes
Project Graph nodes
Pactwright Extension semantics
provider routing
domain workflow definitions
Project Intelligence rules
```

It is an integration contract, not a second Pactwright manifest.

---

# 8. Multi-Production-Skills Composition

An Agent Pack may import multiple Production Skills integrations.

Example:

```yaml
production_skills:
  narrative-production-skills:
    source: github:sb-dev/narrative-production-skills
  music-production-skills:
    source: github:sb-dev/music-production-skills
  video-production-skills:
    source: github:sb-dev/video-production-skills
```

The mapping is keyed by family ID, the same key the section 12 lock uses; a list form is not a recognised serialisation.

Multiple Production Skills may contribute to the same capability:

```text
delivery-execution
        ↓
producer
        ├── narrative-production
        ├── music-production
        └── video-production
```

Likewise:

```text
delivery-review
        ↓
reviewer
        ├── narrative-evaluate
        ├── music-evaluate
        └── video-evaluate
```

Pactwright must therefore assume:

```text
one capability
→ one agent
→ potentially many Production Skills
```

not:

```text
one capability
→ one domain
```

---

# 9. Production Extension Packs

A Production Extension Pack adds specialised production knowledge to one Production Skills family.

An Agent Pack may select packs while importing the owning family:

```yaml
production_skills:
  narrative-production-skills:
    source: github:sb-dev/narrative-production-skills
    extension_packs:
      - childrens-television
```

Pactwright owns:

```text
selection
resolution
locking
availability
```

The Production Skills family owns:

```text
pack meaning
production rules
validation
evaluation
behavioural effect
```

A Production Extension Pack is not a Pactwright Extension.

```text
Pactwright Extension
→ extends Pactwright semantics

Production Extension Pack
→ extends Production Skills
```

---

# 10. Pactwright Extensions

A Pactwright Extension adds optional Pactwright semantics without redefining the core Delivery model.

It may contribute:

- Project Graph node and edge types;
- schemas and validation;
- namespaced runtime commands;
- context;
- required capabilities;
- evaluation cases;
- generated repository integration;
- GitHub profile requirements.

The redesigned first-party Extension set is:

```text
Project Intelligence
Graph Review
Assets / Publication
Operations
```

Extensions may depend on other Extensions when there is a real semantic dependency.

Expected examples include:

```text
Graph Review
→ Project Intelligence

Operations
→ Project Intelligence
```

Dependencies must not be introduced merely for implementation convenience.

The supported management interfaces are:

```text
pactwright extension add <id-or-package>
pactwright extension disable <id>
pactwright extension remove <id>
pactwright extension upgrade <id>
```

Canonical storage follows Core section 54: an Extension's records and relation-owned edge file live below `specs/extensions/<id>/`, while the shared graph API composes enabled owners. This replaces the released `0.0.1` physical shared-store placement, not the shared validation mechanism. Section 15 owns migration of released Extension records/edges out of the core stores. An inactive owner needs no installed decoder merely to preserve and report its directory; its data does not participate in active endpoint resolution or graph hashing.

## Installation

`extension add` must:

1. resolve a compatible package;
2. resolve and install required Extension dependencies first;
3. add package dependencies;
4. register the Extension in project configuration;
5. record exact package/version/hash and resolved dependencies in the lock;
6. validate runtime compatibility and required Agent Pack capabilities;
7. create Extension-owned repository structure;
8. run `pactwright sync`;
9. report any GitHub provisioning changes.

Dependency installation uses the same compatibility, locking, capability-validation and synchronisation path as explicit Extension installation.

Installation fails before canonical Project Graph mutation if the complete environment is incompatible.

## Removal and disablement

`pactwright extension disable <id>` deactivates an Extension: its configuration entry stays with `enabled: false`, its lock entry is removed, its package stays installed, and its owned root below `specs/extensions/<id>/` is preserved byte-for-byte and inventoried as inactive. `pactwright extension remove <id>` additionally deletes the configuration entry and requests removal of the package dependency through the package manager (section 15); it preserves the owned root the same way. `pactwright extension add <id>` re-enables a disabled configured Extension through the normal installation path, registering and fully validating the preserved state before activation, and adds a removed Extension again the same way. Both commands run `pactwright sync` after configuration and lock change.

Removing or disabling an Extension must preserve user-authored Extension graph data unless the user separately chooses to delete it.

Only generated local or remote state exclusively owned by that Extension may be removed automatically.

An Extension cannot be disabled or removed while another enabled Extension still depends on it unless the dependent Extension is disabled or removed in the same operation: one invocation names every Extension it disables or removes, dependents included.

If ownership of generated or remote state is ambiguous, Pactwright must preserve it and report the ambiguity rather than delete user state.

---

# 11. Extension Manifest and Capability Resolution

A Pactwright Extension manifest declares its integration contract.

Conceptually:

```yaml
id: graph-review
package: "@pactwright/graph-review"
version: ...
pactwright: ...

dependencies:
  extensions:
    - project-intelligence

agent_capabilities:
  - graph-review

github:
  profile: graph-review
```

## Canonical contribution declarations

The package-root manifest remains `extension.yml`. Its existing `graph.node_types` and `graph.edge_types` list the names it owns; the reserved core relations are reused, never redeclared. A package contributing canonical data additionally declares this versioned graph interface:

| Field | Meaning |
|---|---|
| `graph.format_version` | Positive integer identifying the owner's stored schema and projection contract; independent of package version. |
| `graph.registration` | Package-relative module export, written `./path/to/module.js#export`, supplying the named read-only decoders, schema validators, canonical projections and optional node projections. |
| `graph.storage` | List of declarations, each with a root-relative `path`, `kind`, `decoder`, `schema` and `projection` identifier. Optional `node_projection` names the endpoint projection. |
| `graph.migrations` | Optional list of declared format migrations, each with `from`, `to` and `migration`: `from` and `to` are format versions, either of which may instead be the literal `released-0.0.1` for the section 15 released-format migration and its reverse; `migration` names an export of the registration module. |

Each storage `path` is a literal file or directory relative to `specs/extensions/<id>/`, not an absolute path, glob or path containing `..`; directory declarations enumerate their supported file forms through the named decoder. Paths must be disjoint, cannot claim `edges.yml`, generated output or another owner's data, and cannot follow symlinks. Decoder/validator/projection identifiers must resolve uniquely in the declared registration export. An absent or unknown identifier, duplicate paths within an owner, conflicting type/relation ownership or incompatible `format_version` fails registration before activation. A format without canonical records need not declare storage; an Extension with relation types still uses its owner `edges.yml` under Core section 54.

A decoder receives the declared input bytes and returns decoded values or path-specific problems. Its schema validator checks the owning semantic format. The canonical projection emits Core section 54 `(kind, key, value)` contributions; an optional node projection additionally supplies globally unique endpoint ID and a registered node type. All projected values obey Core section 6. The registration also supplies endpoint constraints for each declared additional relation, without replacing core rules. These are deterministic, read-only package functions: loading cannot install dependencies, write files, make network requests or use undeclared project inputs. Their private implementation layout is not prescribed.

Installed packages and fixtures use this same interface and record/edge validation path. A package cannot supply an installed-only hash or validation shortcut. Changing the decoder, schema or projection semantics requires a new `graph.format_version` with a declared migration under section 15; a package version change alone does not authorise reinterpreting stored bytes.

A migration is a deterministic, read-only package function like the others: it receives the owner's decoded source records and tuples and returns the target records and tuples, or path-specific problems, and the runtime performs every write within the section 15 atomic change set. An upgrade whose target `graph.format_version` differs from the locked one requires a declared migration, or a chain of declared migrations, from the locked version to the target, applied in order within one change set; without one the upgrade fails before any change. The declaration is part of `graph.declaration_hash` and the migration code of `graph.implementation_hash` (section 12), so no separate migration identity is locked. A reverse migration, declared with the older version as `to`, is optional; explicit rollback under section 15 uses it and fails before any write when it is absent.

At runtime:

```text
core capabilities
+
enabled Extension capabilities
=
required capability set
```

The selected Agent Pack must satisfy the complete set.

If it does not:

- the operation fails before activation or canonical mutation;
- Pactwright must not silently switch Agent Packs;
- the current valid configuration, lock and generated environment remain intact.

---

# 12. Resolution, Versioning and Locking

Pactwright resolves the complete execution environment.

Runtime, Pactwright Extensions and Agent Packs are independently versioned and reviewable. External Production Skills are resolved to exact revisions or versions needed by the selected Agent Pack.

For Production Skills this means:

```text
source
→ exact revision/version
→ integration manifest
→ capability bindings
→ referenced skills
→ selected Production Extension Packs
```

The lock must record enough immutable identity to reproduce the result.

Conceptually:

```yaml
version: 1

runtime:
  version: ...

extensions:
  graph-review:
    version: ...
    hash: ...
    graph:
      format_version: ...
      declaration_hash: ...
      implementation_hash: ...
    dependencies:
      project-intelligence: ...

agent_pack:
  source: "@pactwright/standard"
  version: ...
  hash: ...

production_skills:
  video-production-skills:
    source: ...
    revision: ...
    integration_hash: ...
    skills:
      - video-production
      - video-evaluate
    extension_packs:
      - ...
```

Pactwright does not copy or reinterpret a Production Skills repository's own internal lock graph.

```text
Production Skills lock
→ owned by Production Skills

Pactwright lock
→ records Pactwright's exact dependency on it
```

The package-manager lock and `.pactwright/lock.yml` have different responsibilities:

```text
package-manager lock
→ exact installed packages

.pactwright/lock.yml
→ exact resolved Pactwright semantic and AI execution environment
```

They must agree on the installed Pactwright and package-backed component versions they both identify.

Configuration expresses intent. The locks record exact resolved state at their respective layers.

## Recognised lock formats and graph implementation identity

The current resolved lock has top-level `version: 1`. It retains the runtime, Extension, selected Agent Pack, agent/direct-skill and applicable Production Skills identities described above. `runtime.version` and `extensions` (an empty mapping when no Extension is enabled) are always present; `agent_pack`, `agents` and `skills` are present exactly when a pack is selected, so the lock of an unactivated scaffold (section 3) records the runtime alone. Only an enabled Extension has a lock entry. `agent_pack.source` is the configured source identity, not an implicitly chosen package. `agents` and `skills` maps retain the resolved content hashes for direct pack content. A recognised released `0.0.1` lock has **no top-level version key**, has `runtime.version`, `agent_pack.name/version/hash`, `agents`, `skills` and `extensions`, and is labelled **migration required**, not unsupported. Its `agent_pack.name` is matched to the explicitly configured source during section 15 migration; missing or conflicting identity blocks migration instead of inventing a source or choosing a newer component. A document with an unknown explicit version is unsupported. Missing, malformed and unsupported documents are distinct diagnoses.

Each enabled Extension lock entry includes its package/source, exact version, package content hash, resolved dependencies and the graph declaration's `format_version`. `graph.declaration_hash` covers the canonical manifest graph declaration; `graph.implementation_hash` covers the registration module and every package file it imports or reads to decode, validate or project canonical data. Implementation identity includes executable code and schema resources, not just declared names. Exact immutable dependency identities are included when those functions use package dependencies. These identities participate in `environment_lock_hash`; changing a decoder's bytes while retaining its version must be detected before activation. There is no separate code archive: use normal package hashes and exact dependency resolution, and fail when the declared closure cannot be verified.

The released `version: 1` / `stages` lifecycle file remains recognised native policy under Core section 27. It does not need a synthetic format-version field on the old lock. The unreleased `version: 2` / `shape` draft has no automatic released compatibility claim; encountering it requires its own recognised schema/migration or an unsupported-version report. Ordinary loading never upgrades any of these files.

## Environment lock identity

Pactwright derives a deterministic `environment_lock_hash` from the exact resolved Pactwright execution environment represented by `.pactwright/lock.yml`.

```text
exact resolved Pactwright environment
        ↓
environment_lock_hash
```

The same locked environment must produce the same `environment_lock_hash`.

The protocol is `env1:sha256:<digest>`, with exactly 64 lower-case hexadecimal digest digits: SHA-256 over the UTF-8 [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html) serialization, without a trailing newline, of the complete decoded lock mapping, whose values are JSON-compatible under Core section 6. It hashes the lock's meaning, not its bytes: mapping-key order, quoting, comments and line endings do not change it, and any change to a recorded identity does. A runtime or platform change must preserve this protocol's digest for the same lock; an incompatible change needs a new protocol identifier and explicit replay handling, and an unknown protocol fails pinned replay, as for Core section 56's `pg1`. The hash is derived from any lock that decodes completely as `version: 1`, including the lock of an unactivated scaffold; a missing, malformed, unsupported or migration-required lock yields none. Frozen input, canonical-byte and digest examples are retained in [the env1 protocol vectors](./fixtures/environment-lock-env1.json); they are definition fixtures, not evidence that a runtime verifier has executed.

The hash identifies the resolved environment used by replayable execution provenance; it does not replace the lock contents or package/source locations needed to reconstruct that environment.

The shared replay base used across Pactwright is:

```text
repository_revision
+ project_graph_revision
+ environment_lock_hash
```

Spec 01 owns repository and Project Graph revision semantics. This specification owns `environment_lock_hash` and exact environment resolution.

For a pinned replay, the environment identified by `environment_lock_hash` must be resolvable without silently substituting newer runtime, Extension, Agent Pack, Production Skills or Production Extension Pack versions. If the historical environment cannot be reconstructed, the replay fails explicitly.

The exact retention or reacquisition mechanism for historical packages and external Production Skills revisions remains an implementation detail. The semantic requirement is exact identity plus explicit failure, not a Pactwright-hosted package archive.

---

# 13. Validation

Before accepting a resolved environment, Pactwright validates:

- runtime compatibility;
- package-manager and Pactwright lock consistency;
- Extension dependencies;
- required Agent Pack capabilities;
- Production Skills manifest syntax;
- Production Skills compatibility;
- referenced skill existence;
- selected Production Extension Pack existence;
- deterministic skill identity;
- source/revision availability;
- adapter representability;
- deterministic `environment_lock_hash` derivation from the resolved lock.

The one exception is the section 15 runtime-ahead lock, which records an incompatible selected pack or enabled Extension unchanged and is not an accepted executable environment.

If two imported skill families produce ambiguous skill identities, Pactwright must fail resolution rather than silently select one.

Compatibility validation does not imply domain quality.

A structurally valid `video-evaluate` skill is not automatically a good evaluator. Its quality belongs to the Production Skills benchmark.

---

# 14. Synchronisation and Adapters

`pactwright sync` materialises the configured and locked execution environment.

Conceptually:

```text
configuration
+ lock
+ Extensions
+ Agent Pack
+ Production Skills
        ↓
pactwright sync
        ↓
generated execution environment
```

Synchronisation must:

1. load configuration and lock;
2. load enabled Extensions;
3. derive required capabilities;
4. load the Agent Pack;
5. resolve Production Skills and selected Extension Packs;
6. validate the complete composition;
7. assemble agents and skills;
8. render the active adapter;
9. render Pactwright-managed repository integration.

Repeated `sync` with identical locked inputs **must produce identical generated output**.

Adapters convert the resolved environment into an AI execution surface.

Initial example:

```text
resolved Pactwright environment
        ↓
Claude Code adapter
        ↓
.claude/
```

Adapters do not define Pactwright semantics.

Pactwright may regenerate only files or managed regions it explicitly owns.

User-authored source, unrelated workflows and external Production Skills repositories must remain untouched.

`pactwright sync` changes local generated integration only. Remote GitHub reconciliation remains owned by `pactwright github sync` and the GitHub Integration specification.

---

# 15. Upgrade Model

Pactwright owns upgrade orchestration. The project's package manager owns package installation.

The command surface is:

```text
pactwright upgrade
pactwright upgrade --to <version>
pactwright agent-pack upgrade
pactwright agent-pack use <source>
pactwright extension upgrade <id>
```

## Pactwright runtime upgrade

`pactwright upgrade` upgrades the Pactwright runtime itself to the latest compatible release.

`pactwright upgrade --to <version>` targets an explicit release and may be used for controlled forward upgrade or rollback.

The runtime upgrade flow is:

```text
current Pactwright runtime
→ detect project package manager
→ resolve target Pactwright release
→ package manager updates Pactwright package
→ re-enter through newly installed Pactwright runtime
→ validate complete environment compatibility
→ run required migrations
→ update .pactwright lock
→ pactwright sync
→ pactwright validate
```

Pactwright must not implement a parallel package installer.

It delegates package replacement to the detected project package manager.

Package-manager detection should prefer the repository's explicit `packageManager` declaration and otherwise use unambiguous project package-manager state such as its lockfile. Pactwright must not silently switch package managers.

After package replacement, migration, lock regeneration, synchronisation and validation must be performed by the **newly installed runtime**, not by the old runtime that initiated the upgrade.

A runtime upgrade must not silently major-upgrade Extensions, Agent Packs, Production Skills or Production Extension Packs. Their configured constraints remain authoritative unless the user explicitly upgrades those components.

`pactwright upgrade` resolves its target as the newest `pactwright` release the registry offers, obtained through the package manager's version listing (the delegation seam below), that is newer than the installed runtime and inside the declared `pactwright` range of the selected Agent Pack and of every enabled Extension; when none exists it reports that and changes nothing. `--to <version>` names the target directly. Before any change, the old runtime detects the package manager and writes the upgrade recovery record; ambiguous detection or a record that cannot be written refuses the upgrade.

The upgrade recovery record is Pactwright-owned ordinary repository content at a runtime-declared path below `.pactwright/`, written before package replacement and removed when the upgrade completes or is rolled back. It holds the attempt (source and target runtime versions, package manager and stage reached) and the exact previous bytes of the package manifest, the package-manager lock, `.pactwright/config.yml`, `.pactwright/lifecycle.yml` and `.pactwright/lock.yml`. Because an atomic migration prevents a partial move but not a completed move followed by a later failure, the record also holds, before a migration runs, the previous bytes of every canonical file the migration plan changes or removes and the exact previous path inventory, each entry with its type and each root with whether it exists, of every core store and owner root the plan touches or creates, so the whole upgrade stays reversible through `sync`, `validate` and interruption. The runtime never commits it. While it exists the project is an interrupted upgrade: ordinary mutation and execution refuse, and `doctor` reports action required with `pactwright upgrade --to <previous version>` as the remediation.

Re-entry is a child process. After the package manager replaces the package, the old runtime invokes the runtime now installed in the project, resolved from the project's installed package and never from its own module, and hands it the recovery record; from then on only the new runtime reads or writes project state. The new runtime validates the complete environment, runs required migrations, writes the lock, runs `sync` and `validate`, then removes the record. When a step after replacement fails, including a `sync` or `validate` failure or an interruption after a migration has completed or the new lock has been written, the new runtime restores every recorded byte, canonical files included, restores the recorded path inventory, removing every file, directory and other entry the migration created, requests restoration of the previous exact runtime version through the package manager, verifies that the restored environment loads under its recorded format, and removes the record; when that restoration itself fails, the record stays and the report names `pactwright upgrade --to <previous version>`. While a record exists, `pactwright upgrade` accepts only `--to` naming the version the record designates as its recovery target: the previous runtime for a record written before package replacement, the installed runtime for a record the completion path below wrote. That invocation writes no new record, performs the restoration the record's path requires and removes the record. Any other invocation, `upgrade` without `--to` included, is refused naming the record, and `doctor` names the designated command.

A runtime that predates this protocol, such as the released `0.0.1`, has no `upgrade` command and cannot write the record or hand off. Its supported entry is package replacement through the package manager followed by `pactwright upgrade --to <installed version>` under the new runtime: when the installed runtime already is the target and the lock records an older runtime, `upgrade --to` performs the post-replacement steps itself, writing the record first, with the lock's `runtime.version` as its source version and the post-replacement package manifest and package-manager lock as its package baseline, and making no package request. The record's attempt identifies this path and designates the installed runtime as its recovery target. On this path the recovery promise is narrower, because the source package state was replaced outside Pactwright before any record could capture it: a failure, and equally `upgrade --to <installed version>` run while such a record exists after an interruption at any point, at record creation, after the completed migration or after the lock write, restores the recorded configuration, lifecycle, lock and canonical bytes and inventory, requests no package change, and removes the record. The result is exact: the package manifest and package-manager lock equal their recorded post-replacement bytes, every `.pactwright/` file, core store and owner root equals its source bytes and inventory, no record remains, the installed runtime reads the project as migration required, and a fresh `upgrade --to <installed version>` starts a new attempt; the package manager's own history is the only route back to the previous package state. `doctor` names `upgrade --to <installed version>` both for a lock whose runtime version is behind the installed package and for a record this path wrote. Acceptance of the released-format migration runs against the unchanged published `0.0.1` artefact, acquired exactly through the delegation seam, never against a rebuilt fixture carrying capabilities the release lacks.

A selected Agent Pack or enabled Extension whose declared `pactwright` range excludes the target is neither a reason to refuse the runtime upgrade nor something the upgrade may change: the runtime is replaced, migrations that do not need that component's registration run, the lock records the new runtime with the component's identity unchanged, `sync` and `validate` are not run, and the upgrade completes with exit status zero, reporting each such component as action required with its owning upgrade command as the remediation. This runtime-ahead state is how a project whose components pin an exact runtime moves between releases. While it lasts, `agent-pack use`, `agent-pack upgrade` and `extension upgrade` validate the candidate component's own runtime compatibility, its dependencies and the complete required capability set against the other components as recorded, lock the candidate, defer `sync` until no component's declared range excludes the runtime, and report the components still pending; the command that repairs the last one runs `sync`, and ordinary execution stays refused until then. Because an owning upgrade command requests the configured constraint, an unchanged exact or caret pin resolves the same version and reports nothing changed, so the remediation for a runtime-incompatible component names the constraint change it needs, the component and its current constraint, before its owning command. Every other defect of the target environment, including a migration that needs an incompatible Extension's registration, a missing capability, lock disagreement or a failed step, fails the upgrade with the recovery above rather than silently substituting components or reinterpreting canonical state.

Canonical Project Graph state must never be left partially migrated. The recovery record is how an upgrade preserves enough previous package/configuration/lock state to restore or explicitly target the previous runtime when it cannot complete safely.

## Released-format migration boundary

The corrective runtime provides the explicit migration `released-0.0.1-to-owned-stores-v1`. `pactwright upgrade` selects it when the source environment is recognised as released `0.0.1` and the target uses Core's owner-separated stores and version-1 resolved lock. This is a named, versioned migration, not normal loader repair or a permanent unsupported-data refusal.

The new runtime first reads all source inputs with their recognised source decoders, diagnoses every prerequisite and constructs a complete target plan. Only a **complete valid legacy source** can enter migration despite not being a complete current-format load. Syntax failures, missing required input, unknown ownership or a failed source-schema check cannot use this exception. The plan uses Core section 55's exact-input stale-base and serialised atomic-write boundary. Validate the complete target and preserve, in the upgrade recovery record, the original package/configuration/lock bytes and the bytes of every graph file the plan changes, for failure recovery; explicit rollback uses the reverse migration below. No partial moves or half-updated locks are permitted.

| Released input | Required target treatment |
|---|---|
| Core-type Markdown records and core-relation tuples | Preserve valid IDs, attribution and canonical content. Do not rewrite conforming core files merely because the runtime changes. |
| Extension-typed records in `specs/nodes/` and Extension tuples in `specs/graph/edges.yml` | Resolve exactly one owner from an enabled, compatible Extension's registered types/relations. The migration maps those records through that owner's declared source-to-target format migration into its storage declaration and moves relation tuples to its `edges.yml`. Same-type Extension supersession belongs to the endpoint-type owner. Preserve identities, semantic values and exact directed tuples; leave core records and tuples in core storage. |
| Ambiguous, disabled, removed or unavailable legacy Extension ownership | Preserve every byte and report the specific owner/registration/migration prerequisite. Do not guess, discard data or activate an Extension implicitly. An existing conflicting target record/tuple also blocks before writes. |
| Desired config v1 and lifecycle v1/stages | Keep the explicitly selected component constraints, actor-kind policy and manual/automatic settings. Reuse their native formats; do not turn policy entries into topology or add an identity allow-list. |
| Released unversioned lock | Resolve the explicitly selected target environment, recording a selected pack whose declared range excludes the target unchanged under the runtime-ahead rule above, and write the section 12 `version: 1` lock with exact graph declaration/implementation identities. Check the source lock against its own installed source environment before changing it; never silently upgrade or switch other components. |
| Empty YAML edge document or `edges: null` accepted by 0.0.1 | Report migration required on ordinary load. This explicit migration may replace it with `edges: []` after validating that the complete legacy edge set is empty. It may not use that rule to discard malformed or unknown tuples. |
| Non-`.md` core-store entries, including `.DS_Store`, formerly ignored by 0.0.1 | Intentionally no longer ignored by the current loader. Preserve the file, identify the blocked path and require the owner to move/remove it explicitly before migration; never auto-delete or silently exclude it. |

The Extension relocation, empty/null-edge normalisation and newly reported non-Markdown entries are intentional compatibility changes. A legacy scalar whose released decoder produced a different value from Core section 6's pinned YAML profile also needs explicit value-preserving migration or a named prerequisite; re-parsing identical bytes into different truth is not migration. Recognising the source format is not a promise to accept every previously tolerated input under the target format.

Source and target graph-revision protocols remain distinct: a released `sha256:` graph revision is not a `pg1:` revision. Preserve prior execution evidence and its protocol; replay needs the recorded runtime/protocol, otherwise fails explicitly. A migration may record the newly derived identity of the migrated graph but never rewrite historical provenance or relabel an old digest. Rollback to a runtime that predates owner-separated stores and this upgrade protocol, `pactwright upgrade --to 0.0.1`, is completed entirely by the current runtime, because the target can neither run migrations nor read a recovery record: it runs the paired reverse migration `owned-stores-v1-to-released-0.0.1`, writes the released lock, validates with the released decoders, removes the record and only then requests package replacement, as the last step; this is the one exception to post-install work by the newly installed runtime. It moves each enabled owner's records and tuples back into `specs/nodes/` and `specs/graph/edges.yml` through the owner's declared reverse migration (section 11), writes the released unversioned lock from the current one and validates the result with the released decoders. Core records are unchanged, `edges: []` stays, and execution-state and legacy-closure documents stay in place, unread by the target and reported as such. A record that no declared reverse migration can express in the released format, an inactive or ambiguous owner's data, a project with no selected pack, and an interrupted upgrade block the rollback before any write, naming the prerequisite. The recovery record is written first as for any upgrade and holds the reverse migration's changed bytes until the released environment validates; a validation failure after the reverse migration restores those bytes, removes the record and leaves the current runtime and stores unchanged; a package replacement that fails after that leaves a released-format project with no record, which the still-installed runtime reads as migration required and `pactwright upgrade --to <current version>` migrates forward again. After rollback the released runtime's own `validate` must pass on the project. Rollback after new canonical work is supported when every record can be expressed; the record's pre-migration copies serve failure recovery of one upgrade, not later rollback, and are removed with the record. An older runtime must not be pointed at new stores and allowed to ignore them.

## Agent Pack upgrade

`pactwright agent-pack upgrade` upgrades the currently selected Agent Pack within its configured compatibility constraints.

It must validate the complete required capability set before changing the current lock or generated environment.

`pactwright agent-pack use <source>` remains the explicit operation for changing Agent Pack identity.

Both commands obtain packages only through the detected project package manager, under the detection rule above, through one runtime delegation seam whose requests are: install a package as a development dependency, request a source at a constraint, restore an exact installed version under the previous constraint, remove a dependency the command added or, for `extension remove`, the Extension's package, acquire an exact version into an isolated location outside the project (used by evaluation baselines, section 24), and list the versions of a package the registry offers (used by runtime-upgrade target resolution and `doctor`). `use` installs a package source that is not already installed at a satisfying version, and `upgrade` requests the configured source at its configured constraint, so the package manager resolves the version that satisfies it, replacing the installed package when that version differs from the locked one, and reconciles the package manifest to that constraint. Path sources involve no package manager. Validation of the installed candidate precedes any change to `.pactwright/lock.yml` or generated output. A candidate that fails validation is not locked, and the package-manager manifest and lock are restored to the previous installed version and constraint, or a dependency `use` added is removed; when restoration itself fails, the report names the previous exact version to restore. When the package manager's resolution of the configured constraint is the version already locked, which an exact constraint equal to the locked version or a range with no newer satisfying version produces, `upgrade` reports that nothing changed.

## Extension upgrade

`pactwright extension upgrade <id>` must:

1. resolve a compatible package;
2. validate the complete Extension dependency graph;
3. validate schema compatibility and the complete required capability set;
4. run **explicitly defined, versioned migrations** where canonical Extension state requires migration;
5. update package/configuration and lock state only after the target environment is valid;
6. run `pactwright sync`;
7. report GitHub changes requiring reconciliation.

An Extension upgrade must not silently reinterpret canonical Project Graph state.

A dependency upgrade must satisfy every enabled dependent Extension before the current lock changes.

All upgrade paths must protect canonical Project Graph state from partial mutation and leave the environment either valid at the target version or recoverable to its previous valid state.

---

# 16. `pactwright doctor`

Pactwright exposes a read-only environment health command:

```text
pactwright doctor
```

`doctor` diagnoses distribution and execution-environment problems without mutating project state.

It should report at least:

```text
installed Pactwright runtime version
detected package manager
package-manager declaration/lock consistency
available runtime upgrade where determinable
Pactwright configuration validity
package-manager lock ↔ .pactwright/lock.yml drift
runtime ↔ Extension compatibility
runtime ↔ Agent Pack compatibility
missing required capabilities
missing/unresolvable Production Skills dependencies
pending or incomplete migrations
generated adapter/integration drift
validation failures affecting the resolved environment
```

The command should distinguish:

```text
healthy
warning
action required
```

without inventing a separate health-state subsystem.

Severity follows one rule. **Action required** marks a finding that stops the environment from being activated or executed as configured, or that a target-runtime activation needs resolved: an invalid, unsupported or missing required input; a recognised legacy format needing migration; no selected Agent Pack; package-manager lock ↔ `.pactwright/lock.yml` drift; content whose hash does not match its locked identity; runtime ↔ Extension or Agent Pack incompatibility; a missing required capability; an enabled Extension that cannot register; an unsupported Production Skills import; generated adapter/integration drift; an interrupted upgrade (section 15); a configuration ↔ `.pactwright/lock.yml` disagreement about an Extension's enabled state, such as a hand-edited `enabled: false` whose lock entry remains; and a validation failure of the active graph. **Warning** marks a finding that leaves the environment executable now but a supported operation unavailable or stale: an ambiguous or contradicted package-manager declaration, and an unavailable repository revision during ordinary diagnosis, including one caused by an uncommitted execution-state or provenance document. Items with no severity are reported as information: installed versions, the detected package manager, an available runtime upgrade together with `pactwright upgrade`, that upgrade availability cannot be determined, and inventoried inactive Extension data. The overall result is the highest severity present and healthy when none is.

An unavailable repository revision is a warning during ordinary graph/environment diagnosis when local graph loading and hashing are otherwise valid. It becomes action required when diagnosing a requested pinned execution or replay. Report the missing commit/input, dirty tree, unsupported repository-input transport or migration prerequisite; do not auto-commit or label a partial load healthy. A recognised legacy format needing migration is action required for target-runtime activation, not an unknown-version error.

`doctor` must provide concrete remediation commands where the correction is deterministic, for example:

```text
pactwright upgrade
pactwright agent-pack upgrade
pactwright extension upgrade <id>
pactwright sync
pactwright validate
```

It must not automatically execute those mutations. The deterministic remediations are `pactwright sync` for generated drift; for a migration-required source, `pactwright upgrade --to <installed version>` when the installed runtime already is the target and `pactwright upgrade` otherwise; `pactwright upgrade --to <previous version>` for an interrupted upgrade, or `--to <installed version>` when the record was written on the completion path, the only upgrade command named while a recovery record exists; `pactwright extension disable <id>` for an Extension whose configuration disables it while its lock entry remains, and `pactwright extension add <id>` for one whose configuration enables it while its lock entry is absent; `pactwright validate` for a validation failure of the active graph; `pactwright upgrade --to <installed version>` for a lock whose runtime version is behind the installed runtime; the component's owning upgrade command for a component drifted from the package-manager lock; and, for a component whose declared range excludes the runtime, the constraint change it needs followed by its owning upgrade command. Other findings name no command.

`doctor` exits zero when the result is healthy or warning and non-zero when it is action required. `pactwright doctor --json` emits the same result as a JSON document: the overall result and every finding with its severity, code, message, path where applicable and remediation.

GitHub remote-health diagnosis remains owned by the GitHub Integration surface rather than making `doctor` a second GitHub reconciler.

---

# 17. Production Skill Commands

Production Skills may decompose skills into narrower commands for composition, testing and benchmarks.

These commands do not automatically become Pactwright commands.

Pactwright commands remain Contract-driven lifecycle or Extension operations.

---

# 18. Authority Boundaries

Semantic authority flows from stable Pactwright semantics towards increasingly specialised execution:

```text
Pactwright Core
        ↓
Extension semantics within owned scope
        ↓
repository policy
        ↓
Contract + Brief
        ↓
Agent Pack
        ↓
Production Skills
        ↓
Production Extension Packs
```

Lower layers may specialise execution. They cannot override higher-layer semantics.

Examples:

- an Agent Pack cannot bypass a lifecycle Gate;
- a Production Skill cannot weaken the Contract;
- a Production Extension Pack cannot register Project Graph semantics;
- an Extension cannot redefine core Evidence meaning.

---

# 19. Project Knowledge Boundary

Reusable expertise and project-specific knowledge have different owners.

```text
Production Skills
→ reusable general expertise

Production Extension Packs
→ reusable specialised expertise

Project Intelligence
→ project-specific learned knowledge
```

Production Skills and Agent Packs should not become hidden project memory.

---

# 20. Provider Boundary

Pactwright should not recreate:

```text
provider registry
model router
task catalogue
generation routing
```

for work already owned by Production Skills.

Production Skills may know how to invoke coding tools, research services, image/video/audio models or other domain tooling.

Pactwright records only the provenance required for Contract fulfilment, Evidence, reproducibility or auditability where applicable.

---

# 21. Evaluation Model and Public Interface

Pactwright Evaluation answers:

> Can the resolved AI execution environment correctly perform its Pactwright responsibilities?

The supported runner is:

```text
pactwright eval
```

Evaluation is layered:

```text
Pactwright Core
→ core responsibility evaluation

Pactwright Extension
→ extension responsibility evaluation

Agent Pack
→ pack-specific Pactwright evaluation

Production Skills
→ domain benchmark and evaluation
```

Core evaluation should cover Contract fidelity, scope discipline, Brief quality, Review quality, Evidence accuracy and lifecycle compliance.

Evaluation invokes each case's capability through the runtime's single capability-invocation seam, the one `pactwright lifecycle run` dispatches through, and judges semantic dimensions through a judge seam. Neither seam is a provider: an invoker and a judge are supplied to the runner, and a report names the invoker and judge identities it used. Without an invoker, every result that depends on the candidate's behaviour is reported as not evaluated, never replayed from a scripted stand-in as the pack's result; without a judge, semantic dimensions are reported unjudged. Deterministic assertions alone decide the exit status: in a run without `--baseline` it is failure when any evaluated assertion fails or any case was not evaluated, and a comparison follows the section 24 rule; unjudged and not-evaluated results are neither pass nor fail.

Extension evaluations cover the responsibilities owned by each Extension.

Production-domain quality remains owned by Production Skills benchmarks.

---

# 22. Production Benchmark Ownership

Domain-specific benchmarks stay in Production Skills.

Pactwright tests the integration boundary, for example whether an Agent Pack using several Production Skills correctly satisfies a Pactwright Brief or whether Review identifies Contract violations.

Pactwright should not silently execute entire external Production Skills benchmark suites as part of normal Pactwright evaluation.

---

# 23. Evaluation Cases and Artefact Ownership

Evaluation cases belong to the component that owns the behaviour:

```text
core responsibility
→ core case

Extension responsibility
→ Extension case

Agent Pack behaviour
→ Agent Pack case

Production Skill behaviour
→ Production Skills benchmark
```

Cases are versioned with their owning component.

Pactwright evaluation may combine deterministic and semantic assertions.

Prefer deterministic validation where possible, including:

- valid graph mutation;
- valid capability routing;
- lifecycle compliance;
- required output presence;
- forbidden mutation absence;
- Contract lineage preservation.

Semantic evaluation may assess usefulness, unsupported assumptions, scope creep, unnecessary complexity and the quality of Contract, Brief or Review output.

Routine evaluation results and reports are generated artefacts, not Project Graph nodes or canonical project truth.

---

# 24. Baselines and Regression Reporting

A released Agent Pack establishes a baseline that can be compared with a candidate environment.

The supported interface is:

```text
pactwright eval \
  --baseline <released-pack-or-baseline> \
  --candidate <candidate-pack-or-environment>
```

Reports must expose regressions at meaningful dimensions such as:

```text
capability
agent
evaluation case
Agent Pack change
prompt change
Production Skills upgrade
Production Extension Pack change
Extension capability change
model adaptation
```

Do not rely on one opaque aggregate score to decide whether a candidate is better.

A regression report must make the affected capability/case visible so a release decision is reviewable.

`--baseline` and `--candidate` each accept a pack as `<package-name>@<exact-version>` or a filesystem path to a pack directory; `--candidate` also accepts a project root, whose resolved lock supplies the candidate environment. Each side resolves to exact identities, the pack source, version and content hash and every agent, prompt and direct-skill hash, through the same resolution as selection, acquiring a package version that is not installed through the project's package manager into an isolated location; an input that cannot be resolved exactly fails the comparison, naming the input, without substituting another version. Resolution for comparison establishes identity, manifest validity and completeness but does not refuse a side whose declared compatible runtime excludes the running runtime: that mismatch is reported as an incompatible component of that side, so a released pack that declares an older runtime remains a valid baseline; whether such a side's cases are evaluated when an invoker exists belongs to the owner of the first invoker. Both sides are evaluated by the running runtime's case set with the same invoker and judge. A regression is a deterministic assertion that passed on the baseline and fails on the candidate, reported at its capability, agent and case together with the pack, prompt and direct-skill components whose identities changed between the sides. An assertion not evaluated on either side is reported as not comparable, not as a regression, and a semantic verdict that differs between the sides is reported as a difference for review, never as a regression, since judgement varies between runs. Changed components are reported even when no case was evaluated. A comparison exits with failure only when it reports a regression or a side cannot be resolved; not-comparable and unjudged results do not fail it. Reports are written to standard output or an explicitly named path, never below `.pactwright/`, a canonical store or generated adapter output; whether a project commits a report is its own choice, outside Pactwright semantics.

---

# 25. Anti-Overengineering Constraints

Do not introduce initially:

```text
Agent Pack composition
generic executable plugin system
generic skill dependency solver
one Pactwright Extension per production domain
generic provider registry
generic task catalogue
Production Extension Pack interpretation engine
cross-family pack dependency language
universal domain benchmark framework
hosted evaluation
automatic prompt optimisation/promotion
parallel Pactwright package installer
doctor auto-fix engine
```

The required bridge is deliberately small:

```text
Production Skills
→ optional integrations/pactwright.yml

Agent Pack
→ imports compatible Production Skills

Pactwright
→ resolves
→ validates
→ locks
→ exposes through adapter
```

Add more machinery only when real integrations demonstrate that this model is insufficient.

---

# 26. Core Invariants

1. Pactwright Core defines stable semantics.
2. Pactwright Extensions add optional Pactwright semantics.
3. Agent Packs implement Pactwright AI responsibilities.
4. A project selects one Agent Pack.
5. One Agent Pack may compose multiple Production Skills families.
6. Production Skills remain independently usable without Pactwright.
7. Production Skills integration is optional.
8. A Production Skills integration manifest is not a Pactwright Extension manifest.
9. Production Extension Packs remain owned by Production Skills.
10. Pactwright Extensions and Production Extension Packs are different concepts.
11. Production domains do not create new Pactwright capabilities when existing responsibilities suffice.
12. Capability identity is independent from agent and skill identity.
13. Production Skills selection flows through the Agent Pack.
14. Configuration expresses desired state; locks record exact resolved state at their respective layers.
15. Package-manager and Pactwright lock state must agree on package-backed Pactwright components.
16. `environment_lock_hash` deterministically identifies the exact resolved Pactwright execution environment for replay provenance.
17. Historical replay never silently substitutes a different resolved environment.
18. Runtime, Extensions and Agent Packs may version independently under compatibility constraints.
19. Extension dependencies are installed and locked through the same managed path as explicit Extensions.
20. Enabled Extension dependencies cannot be removed underneath dependants.
21. `pactwright upgrade` upgrades the Pactwright runtime, not the Agent Pack.
22. Pactwright owns upgrade orchestration; the detected project package manager owns package installation.
23. Post-install upgrade work is performed by the newly installed runtime.
24. Runtime upgrade does not silently major-upgrade other Pactwright components.
25. Explicit runtime targets support controlled upgrade or rollback.
26. Explicit migrations are required when an upgrade changes canonical stored semantics.
27. Upgrade paths protect canonical Project Graph state from partial migration.
28. Repeated synchronisation with identical locked inputs produces identical generated output.
29. `pactwright doctor` is read-only and diagnoses environment drift and compatibility problems.
30. Adapters project the resolved environment but do not define semantics.
31. Production Skill commands do not automatically become Pactwright commands.
32. Evaluation cases remain owned and versioned by the component whose behaviour they test.
33. Evaluation results are generated artefacts, not Project Graph truth.
34. Baseline comparison reports regressions by meaningful capability/agent/case dimensions.
35. Pactwright evaluates Pactwright responsibility fulfilment.
36. Production-domain benchmarks remain owned by Production Skills.
37. Project-specific learned knowledge belongs in Project Intelligence.
38. Provider and model routing remain outside Pactwright where Production Skills already own them.

---

# 27. Current Implementation Baseline

Pactwright `0.0.1` already implements important parts of this model:

- project-level Agent Pack selection;
- `@pactwright/standard`;
- `delivery-specification`;
- `delivery-execution`;
- `delivery-review`;
- agent definitions;
- skills attached to agents;
- adapter configuration;
- Extension configuration and loading;
- locking concepts;
- synchronisation foundations;
- evaluation infrastructure.

The canonical public distribution surface is:

```text
pnpm add -D pactwright
pnpm pactwright init

pactwright upgrade
pactwright doctor

pactwright extension add
pactwright extension disable
pactwright extension remove
pactwright extension upgrade

pactwright agent-pack use
pactwright agent-pack upgrade

pactwright sync
pactwright validate
pactwright eval
```

The redesigned architecture preserves the working mechanisms while simplifying the older domain-specific capability model.

The principal new integration is:

```text
Production Skills repository
→ optional Pactwright integration manifest
→ Agent Pack import
→ capability-to-skill bindings
```

This adds multi-Production-Skills composition, Production Extension Pack selection, Production Skills revision locking, integration validation and explicit Pactwright vs Production Skills evaluation ownership.

The reproducibility target additionally requires deterministic `environment_lock_hash` identity for the exact resolved execution environment used by replayable provenance. Historical package/skill retention remains an implementation concern so long as unreconstructible pinned replay fails explicitly.

It extends the Agent Pack model rather than introducing a second AI composition system.

---

# 28. Relationship to Other Canonical Specifications

```text
01 Pactwright Core System and Lifecycle
→ Contracts, Delivery and repository/Project Graph replay identity

02 Distribution, Agent Packs, Extensions and Evaluation
→ composition, distribution, environment-lock identity, upgrades, diagnosis and AI execution

03 Project Intelligence
→ project-specific knowledge

04 Graph Review
→ specialist Project Graph analysis and pinned replay

05 Assets and Publication
→ approved durable outputs

06 Operations
→ real-world exposure and feedback

07 GitHub Integration
→ GitHub automation, provisioning and projection

08 Open-Source Project Organisation
→ repository and ecosystem structure
```

Extension-specific semantics remain in their owning specifications.

Production-specific semantics remain in independent Production Skills repositories.

---

# 29. Governing Rule

> **Pactwright defines semantic responsibilities. Pactwright Extensions add optional system semantics. The selected Agent Pack maps responsibilities to agents and may compose multiple independently maintained Production Skills through optional Pactwright integration manifests. Pactwright owns upgrade orchestration, environment identity and environment diagnosis while the project's package manager owns package installation. Production Skills retain ownership of their workflows, commands, Extension Packs, tools and benchmarks. Pactwright resolves, validates, locks, synchronises, upgrades and evaluates the resulting environment without absorbing production-domain semantics or silently substituting a different environment during pinned replay.**

---

**Pactwright Distribution, Agent Packs, Extensions and Evaluation v5**
