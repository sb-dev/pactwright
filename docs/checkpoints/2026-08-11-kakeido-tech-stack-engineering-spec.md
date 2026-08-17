# Kakeido — Tech Stack Engineering Spec

**Version:** 3  
**Status:** Adopted  
**Date:** 9 August 2026 (amended 17 August 2026)

> **v2 amendment:** Apple and Google platform diagnostics promoted from native crash *fallback* to the *primary* native crash reporting layer. The Decision, its trade-offs and revisit triggers are recorded inline in §11, and the canonical Decision is recorded in the graph when Operations becomes active. §§2, 11 and 23 updated.
> **v3 amendment:** Test strategy hardened: new §12.2a component/screen layer (Jest + React Native Testing Library); §12.3 gains required unhappy-path flows, explicit suite contents and CI execution hosts; §12.4 defines minimum OS versions and a named device matrix; §13 defines the PR mobile checks concretely and adds the OTA staging-channel verification gate; §§2 and 23 updated accordingly.

## 1. Purpose

Define the default technology stack for Kakeido across:

- the React Native mobile app;
- the Astro marketing site at `trykakeido.com`;
- the Cloudflare backend;
- Neon Postgres persistence;
- Kei assistant workloads;
- testing, delivery, observability, analytics, and infrastructure.

The stack should stay lean, Git-driven, inexpensive to operate, and highly automated.

The AICaaS stack is the backend architecture reference, adapted for a mobile-first product.

---

## 2. Default Stack

| Concern | Technology |
|---|---|
| Monorepo | pnpm + Turborepo |
| Language | TypeScript |
| Source control | GitHub |
| CI/CD control plane | GitHub Actions |
| Marketing site | Astro |
| Marketing hosting/runtime | Cloudflare Workers + Workers Assets |
| Mobile runtime | React Native + Expo |
| Mobile navigation | Expo Router |
| Mobile components | React Native Reusables |
| Mobile styling | NativeWind v4 + Tailwind CSS v3 |
| Mobile primitives | React Native + RN Primitives |
| Mobile animation | React Native Reanimated when needed |
| Mobile gestures | react-native-gesture-handler when needed |
| Mobile icons | lucide-react-native |
| Complex mobile sheets | @gorhom/bottom-sheet when needed |
| Forms | React Hook Form + Zod where useful |
| Backend API | Hono on Cloudflare Workers |
| Durable jobs | Cloudflare Workflows |
| Real-time workflow status | Durable Objects + WebSockets |
| Database | Neon Postgres |
| Edge database access | Cloudflare Hyperdrive |
| File/blob storage | Cloudflare R2 |
| LLM gateway | Cloudflare AI Gateway |
| Infrastructure as Code | Terraform |
| Cloudflare deployment | Wrangler |
| Mobile builds/releases | Expo Application Services |
| Mobile E2E | Maestro |
| Device-matrix testing | Firebase Test Lab |
| Web E2E | Playwright |
| Unit/integration tests (shared packages) | Vitest |
| Mobile component/screen tests | Jest + React Native Testing Library |
| API mocking | MSW |
| Isolated component development | Storybook where useful |
| Observability | Better Stack + Cloudflare Observability |
| Web analytics | Cloudflare Web Analytics |
| First-party product/marketing analytics | Neon Postgres |
| Advertising conversion tracking | Meta Conversions API |
| Bot protection/filtering | Cloudflare SBFM / Bot Management |
| Native crash reporting (primary) | Apple + Google platform diagnostics |

Do not add overlapping platforms without a demonstrated capability gap.

---

## 3. Architecture

```text
                         ┌─────────────────────────┐
                         │       GitHub            │
                         │ code · CI · releases    │
                         └───────────┬─────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
          ┌─────────▼─────────┐             ┌─────────▼──────────┐
          │ trykakeido.com    │             │ Kakeido Mobile    │
          │ Astro             │             │ React Native      │
          │ Cloudflare        │             │ Expo              │
          └─────────┬─────────┘             └─────────┬──────────┘
                    │                                 │
                    │ tracking / public calls         │ authenticated API
                    │                                 │
                    └───────────────┬─────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │ Hono API Worker │
                           │ Cloudflare      │
                           └───────┬─────────┘
                                   │
             ┌─────────────────────┼──────────────────────┐
             │                     │                      │
             ▼                     ▼                      ▼
      ┌──────────────┐      ┌──────────────┐       ┌──────────────┐
      │ Workflows    │      │ Hyperdrive   │       │ R2           │
      │ imports/Kei  │      │ DB access    │       │ CSV / blobs  │
      └──────┬───────┘      └──────┬───────┘       └──────────────┘
             │                     │
             │                     ▼
             │              ┌──────────────┐
             │              │ Neon         │
             │              │ Postgres     │
             │              └──────────────┘
             │
             ├──────────────► Durable Object
             │                workflow status / WebSocket
             │
             └──────────────► AI Gateway
                              │
                              ▼
                           LLM provider
```

### Core boundary

The mobile application never connects directly to Neon.

All mobile reads, writes, imports, review actions, and Kei requests go through the Hono API.

This intentionally differs from the AICaaS browser architecture, where trusted server-side frontend loaders can query Postgres directly.

---

## 4. Monorepo

Use one pnpm + Turborepo repository.

```text
.
├── apps/
│   ├── mobile/                  # Expo / React Native
│   ├── web/                     # Astro marketing site
│   └── api/                     # Hono Cloudflare Worker
│
├── packages/
│   ├── domain/                  # Kakeido domain types and rules
│   ├── api-client/              # typed mobile/web API client
│   ├── validation/              # shared Zod schemas
│   ├── design-tokens/           # shared semantic brand tokens
│   ├── tracking/                # web analytics + Meta CAPI helpers
│   ├── mocks/                   # MSW handlers and fixtures
│   ├── config/                  # shared TS/lint/build config
│   └── observability/           # logging/telemetry helpers
│
├── infra/
│   ├── terraform/
│   └── environments/
│
├── .github/
│   └── workflows/
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Sharing rule

Share:

- domain types;
- validation schemas;
- API contracts;
- design tokens;
- telemetry contracts;
- fixtures.

Do not attempt to share Astro and React Native view components.

The web and mobile surfaces use different rendering primitives.

---

## 5. Mobile Application

### 5.1 Runtime

Use:

```text
React Native
Expo
Expo Router
TypeScript
```

Expo Router owns application routing.

The canonical product navigation remains:

```text
Today
Review
Plan
Explore
```

### 5.2 UI system

Use:

```text
React Native Reusables
NativeWind v4
Tailwind CSS v3
RN Primitives
```

React Native Reusables components are copied into the application and become application-owned source.

Install only required components.

Dependency priority:

```text
existing Kakeido component
→ adapt React Native Reusables
→ compose React Native primitives
→ add specialist dependency
```

### 5.3 Specialist mobile packages

Use only when required:

```text
Reanimated
→ coordinated, gesture-driven, or layout animation

react-native-gesture-handler
→ swipe, pan, drag, pinch

@shopify/flash-list
→ introduce only if normal lists cannot meet performance needs

@gorhom/bottom-sheet
→ complex bottom sheets

lucide-react-native
→ icons
```

Normal presses and simple interactions stay on standard React Native APIs.

### 5.4 Forms and validation

Use controlled React Native components.

Use React Hook Form when form complexity warrants it.

Use Zod for validation schemas that benefit from sharing with the API.

### 5.5 Mobile architecture

```text
Expo Router route
↓
screen
↓
feature component
↓
application UI component
↓
React Native Reusables / RN Primitive
↓
React Native
```

Product-specific composition belongs in feature modules.

Generic primitives belong in `components/ui`.

---

## 6. Marketing Site

`trykakeido.com` uses Astro.

### 6.1 Responsibilities

The site owns:

- landing pages;
- pricing;
- product explanation;
- Kei introduction;
- help and public documentation;
- blog/content;
- campaign landing pages;
- store/download CTAs;
- consent;
- marketing analytics.

It does not own Kakeido application state.

### 6.2 Content

Use Astro Content Collections and Markdown for content-driven pages.

Prefer static generation.

Use Worker-backed routes only for functionality that requires server execution.

### 6.3 Hosting

Deploy Astro to Cloudflare Workers / Workers Assets.

Static content should be served from Cloudflare's edge.

Use Wrangler for application deployment.

### 6.4 Analytics

Use two layers:

```text
Cloudflare Web Analytics
→ baseline cookieless web analytics

/api/track
→ consent-gated first-party analytics in Neon
→ selected conversion events to Meta CAPI
```

Do not load the standard Meta Pixel by default.

### 6.5 Bot filtering

Use Cloudflare Super Bot Fight Mode as the starting protection.

Upgrade to full Bot Management only when traffic or data-quality requirements justify it.

Bot filtering must not silently corrupt analytics.

---

## 7. Backend

### 7.1 API

Use one Hono Worker as the application API.

Hono owns:

- authentication enforcement;
- authorisation;
- mobile CRUD;
- import endpoints;
- review actions;
- plan mutations;
- Explore queries;
- rule management;
- Kei requests;
- workflow creation/status;
- webhooks;
- operational endpoints.

Keep routes thin.

Domain behaviour belongs in shared application/domain modules rather than route handlers.

### 7.2 API rule

Use synchronous request handling when work is small and bounded.

Use Cloudflare Workflows when work requires:

- multiple durable steps;
- retries;
- long external waits;
- resumability;
- progress reporting.

Do not introduce a queue at launch.

---

## 8. Spending Import and Review Preparation

CSV import is the initial financial ingestion mechanism.

Kakeido does not require the user's bank credentials.

Recommended flow:

```text
mobile selects CSV
↓
API validates upload metadata
↓
file stored in R2
↓
Workflow starts
↓
parse + normalise
↓
detect duplicates / invalid rows
↓
apply existing rules and merchant history
↓
identify decisions / group checks / looks-safe items
↓
prepare Kei observations
↓
write canonical data to Neon
↓
publish completion/status
↓
mobile opens Review Brief
```

The original uploaded file stays in R2 according to the retention policy.

Parsed financial records live in Neon.

### Durable Objects

Use a Durable Object as the real-time status hub for long-running import/review preparation.

The mobile app may subscribe through WebSocket while the workflow runs.

Do not place canonical financial records in Durable Object storage.

---

## 9. Data Layer

### 9.1 Neon Postgres

Neon is the canonical database.

Store:

- users;
- accounts/import sources;
- monthly plans;
- fixed commitments;
- spendings;
- split spendings;
- categories;
- review states;
- categorisation rules;
- import metadata;
- weekly review summaries;
- reflections;
- Kei-generated observations;
- audit/history data;
- application analytics where required.

Use standard Postgres features first:

```text
relations
constraints
transactions
JSONB where genuinely useful
indexes
```

Do not introduce another primary database for data already modelled cleanly in Postgres.

### 9.2 Hyperdrive

Cloudflare Workers access Neon through Hyperdrive.

Application code should use one shared database access package.

No client-facing application receives database credentials.

### 9.3 R2

R2 stores blobs and files:

- imported CSV files;
- generated exports;
- large diagnostic artefacts if needed;
- future user attachments.

Do not store blob payloads in Postgres unless they are genuinely small relational values.

### 9.4 pgvector

Neon can support pgvector, but Kakeido does not require vector search for the initial product.

Introduce embeddings only for a demonstrated Kei capability that cannot be served well by relational history.

---

## 10. Kei Assistant

Kei is an application capability, not a standalone chatbot service.

### 10.1 Execution

```text
mobile request / scheduled review preparation
↓
Hono
↓
Workflow when durable multi-step work is required
↓
AI Gateway
↓
configured LLM provider
↓
validated result
↓
Neon
↓
mobile
```

### 10.2 AI Gateway

Use Cloudflare AI Gateway as the LLM boundary.

It provides one place for:

- provider observability;
- request analytics;
- retries;
- cost visibility;
- provider switching/fallback where configured.

Application code calls a Kakeido-owned AI adapter rather than provider SDKs throughout the codebase.

### 10.3 Provider policy

The primary LLM provider is intentionally replaceable.

Provider-specific details live behind the adapter.

Do not make Kakeido domain code depend on Anthropic-, OpenAI-, or other provider-specific response types.

### 10.4 Grounding

Kei output must be grounded in Kakeido's canonical data.

Prefer deterministic application calculations for:

- totals;
- budget status;
- category pace;
- duplicate detection;
- historical counts;
- review state.

Use the LLM for explanation, summarisation, language, and bounded recommendations.

Do not ask an LLM to calculate canonical financial state when the application can calculate it deterministically.

---

## 11. Observability

Use Better Stack as the cross-product operational layer.

Monitor:

- backend errors;
- structured logs;
- traces;
- uptime;
- API latency;
- failed imports;
- failed Workflows;
- LLM failures;
- deployment markers;
- alerts/incidents.

Use Cloudflare Observability for Worker-specific diagnostics.

### Native crash reporting

Apple and Google platform diagnostics (App Store Connect / Xcode Organizer crash reports and Google Play Vitals / Android Vitals) are the **primary** source of native crash and ANR information.

This is a deliberate Decision, consistent with §18 (existing telemetry before a new observability vendor) and §20 (no multiple observability vendors at launch): no third-party mobile crash SDK is added. When Operations becomes active for Kakeido, record this as a canonical Decision in the graph.

Accepted trade-offs:

- iOS crash coverage includes only users who opted into sharing diagnostics, so the observed crash rate understates the true rate;
- both platforms report with delay and aggregation rather than in real time, and promotion gates must tolerate that lag;
- no custom breadcrumbs, no unified backend↔mobile trace, no in-app JS crash capture from this layer.

Operating rules:

- every native release build uploads its symbolication artefacts: dSYMs to App Store Connect (via the EAS pipeline) and R8/ProGuard mapping plus native debug symbols to Google Play;
- a release is not considered symbolicated until crash reports for it deobfuscate correctly in both consoles;
- crash-free health is reviewed per release train against Play Vitals and App Store Connect metrics before any rollout stage is promoted;
- JavaScript-layer errors are not native crashes: they are handled by application error boundaries and surfaced through structured API-side logging into Better Stack, correlated by `release`;
- material crash findings enter the normal Operations → Observation → Project Intelligence path; platform diagnostics consoles are a permitted operational evidence source for mobile crash Observations.

Revisit this Decision through normal governance — a Project Intelligence Source and a superseding Decision, never a silently added vendor — if, from soft launch onwards: a production crash cannot be root-caused within one release train; crash-free-rate cannot be measured reliably enough to gate a rollout promotion; or iOS opt-in coverage proves too sparse to detect a crash regression before cohort expansion.

### Logging

Use structured logs.

Every backend operation should be correlatable using identifiers such as:

```text
request_id
user_id
import_id
review_id
workflow_id
release
```

Do not log raw financial CSV contents, secrets, access tokens, or unnecessary personal data.

---

## 12. Testing

### 12.1 Shared code

Use Vitest for:

- domain rules;
- parsers;
- validation;
- API services;
- tracking utilities;
- deterministic review calculations.

### 12.2 API

Test Hono handlers against mocked bindings where practical.

Use real Wrangler/workerd + a Neon development branch for integration tests that need the real platform.

Use MSW for shared HTTP fixtures where it reduces duplicated mocks.

### 12.2a Mobile components and screens

Use React Native Testing Library with Jest (`jest-expo` preset) for component and screen tests inside `apps/mobile`.

This is the layer between shared-package unit tests and full E2E: it renders a screen or component in a simulated React Native environment on ordinary CI and asserts behaviour — no simulator, no device, seconds per test.

Runner boundary:

```text
Vitest  → shared TypeScript packages (domain, validation, api-client, tracking)
Jest + RNTL → apps/mobile components and screens
```

Do not migrate shared packages to Jest or mobile components to Vitest; each runner stays on its side of the boundary.

Minimum coverage targets by responsibility, not percentage:

- every reusable component in the Mobile Design Spec §15 renders its defined states;
- every screen renders the §12.6 fixture states that apply to it (loading, empty, error, safe review, mixed review, failed import, Kei unavailable);
- review actions (accept, change category, split, undo) dispatch the correct API-client calls, asserted against MSW fixtures;
- accessibility assertions: state-bearing components expose accessible names/labels, per Mobile Design Spec §17.

These tests catch most UI regressions at PR speed, leaving Maestro to prove full journeys only.

### 12.3 Mobile end-to-end

Use Maestro for executable critical user journeys.

Initial critical flows:

```text
first launch
monthly plan setup
CSV import
review brief appears
resolve decision
accept group
accept looks-safe items
scan all spendings
confirm week
view weekly summary
```

Required unhappy-path flows (regression suite), grounded in the §12.6 fixture states and the Product & UX Spec §11 error rules:

```text
failed CSV import → error state → retry succeeds
offline attempt to review → offline state → recovery on reconnect
Kei unavailable → review completes without assistant content
bulk accept → undo restores prior state
```

Keep smoke flows small.

Maintain separate smoke, regression, and release suites:

- **smoke** — first launch, CSV import, resolve decision, confirm week; runs on release candidates and on PRs that touch `apps/mobile` native configuration;
- **regression** — all critical and unhappy-path flows; runs before merge to the release branch;
- **release** — regression plus device-matrix validation (§12.4); runs on release candidates only.

Execution hosts, following §18 cost ordering:

- Android smoke runs on GitHub-hosted Linux runners with an Android emulator;
- iOS Maestro runs require macOS runners and are reserved for regression/release stages;
- a hosted Maestro cloud service is an add-when-needed extension (§19), triggered only if runner maintenance cost demonstrably exceeds it.

### 12.4 Device matrix

Use Firebase Test Lab for release candidates and targeted device coverage.

Do not run the full device matrix for every pull request.

Minimum supported OS versions:

```text
iOS      16.0
Android  API 24 (Android 7.0)
```

Default release-candidate device set:

| Device | Why |
|---|---|
| iPhone SE (3rd gen) | smallest supported iOS screen, dynamic-type stress |
| Current-generation iPhone | primary iOS target |
| Pixel (current generation) | reference Android |
| Samsung Galaxy A-series (mid-range) | dominant real-world Android tier, OEM skin |
| One low-RAM Android device at minimum API level | memory pressure and oldest OS |

This set is a default, not a ceiling: revise it through a recorded Decision when crash or usage data from platform diagnostics (§11) shows a different real-world distribution.

"Representative device validation" in the release lifecycle (§14) means this named set.

### 12.5 Web

Use Playwright for critical marketing-site behaviour:

- landing page;
- navigation;
- pricing CTA;
- consent;
- tracking dispatch;
- campaign conversion flows.

### 12.6 Component development

Use Storybook only where isolated component development creates clear value.

Use MSW and fixture factories to represent:

- loading;
- empty;
- error;
- safe review;
- mixed review;
- failed import;
- Kei unavailable.

Do not create a large Storybook estate merely because the tool exists.

---

## 13. Delivery

GitHub is the delivery control plane.

### Pull requests

Run inexpensive checks on GitHub-hosted Linux runners:

```text
install/cache
↓
lint
↓
typecheck
↓
unit/integration tests
↓
web build
↓
API validation
↓
mobile checks
↓
selected smoke tests
```

Do not trigger expensive native builds for ordinary TypeScript changes.

**Mobile checks** in the PR pipeline means, concretely:

```text
typecheck apps/mobile
↓
lint apps/mobile
↓
Jest + RNTL component/screen tests (§12.2a)
↓
Expo config validation (expo-doctor / prebuild check, no build)
↓
Android emulator Maestro smoke — only when the PR touches
apps/mobile native configuration or native dependencies
```

No PR check builds a native binary or touches a real device.

### Backend deployment

Deploy Cloudflare application code with Wrangler through GitHub Actions.

Infrastructure changes run Terraform plan before apply.

### Mobile delivery

Use:

```text
EAS Build
EAS Submit
EAS Update
```

Use EAS for native work rather than general CI.

Native build triggers include:

- native dependency change;
- Expo/native configuration change;
- explicit release candidate;
- device-level validation request.

Compatible JavaScript/assets changes may use EAS Update without a new native binary.

**OTA verification gate.** An EAS Update reaches users with no store review, so it is never published directly to production:

```text
publish update → staging channel
↓
staging build receives the update
↓
Maestro smoke passes against the updated staging build
↓
manual spot-check of the changed surface
↓
promote the same update to the production channel
```

Runtime-version compatibility is enforced mechanically: an update whose runtime version does not match the target channel's deployed binaries must fail in CI, not on users' devices. Recovery from a bad production update is republishing the previous known-good update to the channel, recorded as a Decision.

---

## 14. Mobile Release Strategy

Use the established four-stage distribution lifecycle:

```text
internal testing / alpha
↓
limited user feedback / beta
↓
quiet local production / soft launch
↓
managed global rollout
```

### Alpha

- TestFlight internal testing;
- Google Play internal testing;
- Maestro smoke;
- representative device validation.

### Beta

- TestFlight external groups;
- Google Play closed testing;
- limited real-user feedback;
- production-like configuration.

### Soft launch

Release publicly into one selected geography or a deliberately small market set.

Do not combine the first public release with broad marketing.

Promotion is evidence-gated.

### Global rollout

Expand geography in managed cohorts.

For later native updates:

- iOS: phased release;
- Android: staged rollout.

### Cadence

Default to one planned native release train per week.

Skip the train when there is no useful native release.

Use OTA releases independently for compatible JS/assets changes.

---

## 15. Environments

Use four logical environments:

| Environment | Purpose |
|---|---|
| Local | development and debugging |
| Preview | PR/branch validation and stakeholder review |
| Staging | production-like release candidate |
| Production | public system |

Use Neon branches where useful for isolated development and integration testing.

Production secrets and data must never be exposed to untrusted pull-request workflows.

---

## 16. Infrastructure as Code

Terraform manages Cloudflare infrastructure where supported:

- Hyperdrive;
- R2;
- DNS;
- routes;
- custom domains;
- Worker bindings/configuration;
- environment-specific infrastructure.

Wrangler manages:

- Worker deployment;
- local Worker development;
- Durable Object migrations;
- Cloudflare runtime configuration tied to application deployment.

Neon provisioning may use the Neon Terraform provider or be managed separately until that decision is standardised.

Avoid click-ops where a stable declarative equivalent exists.

---

## 17. Security and Privacy

### Financial data

Treat imported spending data as sensitive application data.

Minimum rules:

- TLS everywhere;
- no database credentials on clients;
- least-privilege Cloudflare bindings;
- environment-separated secrets;
- no raw CSV data in logs;
- explicit file-retention policy;
- authenticated access to user financial records;
- auditable mutations for review/category changes.

### Marketing tracking

Marketing tracking is separate from application financial data.

Meta conversion tracking:

- requires consent;
- runs server-side through CAPI;
- hashes supported identifiers before transmission;
- must not send spending history or financial review data to advertising platforms.

Cloudflare Web Analytics remains the baseline cookieless site analytics layer.

---

## 18. Cost-Control Rules

Prefer the cheapest layer that can perform the work safely.

```text
GitHub Linux CI
before
EAS native build

ordinary Worker request
before
Workflow

Workflow
before
queue

Postgres
before
new datastore

application-owned UI
before
new UI framework

Cloudflare / Better Stack existing telemetry
before
new observability vendor
```

Native builds, device-matrix tests, and LLM calls should be intentional rather than automatic side effects of every change.

---

## 19. Add-When-Needed Extensions

These technologies are recognised by the reference architecture but are not part of the initial Kakeido runtime unless their trigger appears.

### Cloudflare KV

Add for fine-grained cacheable data that does not belong in Postgres.

### Durable Object rate limiter

Add per external provider when AI/API rate limits require globally coordinated throttling.

### Cloudflare Queues

Add when Workflows and direct calls no longer cover:

- bursty webhook ingestion;
- fan-out;
- event-bus behaviour;
- bridges to external worker pools.

### Fly.io workers

Add for sustained CPU-heavy workloads that are a poor fit for Workers.

### SurrealDB

Do not add for normal Kakeido financial history.

Consider only if a future knowledge/memory capability genuinely needs graph + vector + document queries that Postgres cannot serve cleanly.

### Chromatic

Optional for Storybook visual regression if component visual drift becomes expensive.

---

## 20. Explicit Non-Goals

Do not introduce at launch:

- direct mobile-to-Postgres access;
- a second general-purpose UI framework;
- Kafka or NATS;
- Kubernetes;
- microservices for each product feature;
- a separate database for Kei memory;
- a queue without a demonstrated need;
- custom native CI infrastructure;
- multiple observability vendors;
- a generic chat service for Kei.

---

## 21. Open Decisions

The supplied reference stack does not standardise these choices yet:

```text
authentication provider
subscription / App Store billing abstraction
primary LLM provider
data-retention durations
backup / restore policy
```

These should be specified separately rather than silently selected inside implementation work.

---

## 22. Initial Implementation Order

```text
1. pnpm + Turborepo workspace
2. shared domain / validation / design-token packages
3. Neon schema
4. Hono API Worker + Hyperdrive
5. Astro marketing site
6. Expo mobile shell + Expo Router
7. React Native Reusables + NativeWind UI layer
8. monthly plan + core spending/review API
9. R2 CSV upload
10. import/review Workflow
11. mobile weekly review flow
12. Better Stack + Cloudflare observability
13. Maestro smoke journeys
14. EAS build/release automation
15. Firebase Test Lab release validation
16. Kei adapter + AI Gateway
17. marketing analytics + Meta CAPI
18. alpha → beta → soft-launch release path
```

Each stage should leave the repository deployable and testable.

---

## 23. System-Level Acceptance Criteria

The stack is correctly implemented when:

- `trykakeido.com` deploys from Git through Astro and Cloudflare;
- the mobile app builds through Expo/EAS;
- mobile clients access financial data only through the API;
- Neon is the canonical relational store;
- CSV imports are durable and retryable;
- review preparation can complete asynchronously;
- Kei is provider-independent and grounded in canonical data;
- critical mobile journeys, including the required unhappy paths, run in Maestro;
- mobile components and screens are covered at PR speed by Jest + React Native Testing Library;
- release candidates can run on Firebase Test Lab;
- backend and JavaScript-layer mobile failures surface in Better Stack;
- native crashes surface symbolicated in App Store Connect and Google Play Vitals for the exact released build;
- infrastructure changes are represented in Terraform where supported;
- compatible mobile changes ship through EAS Update only via the staging-channel verification gate;
- native releases can progress through alpha, beta, soft launch, and managed rollout;
- marketing analytics remain separated from private financial data.

The core rule:

> Keep Kakeido product logic in application-owned code, use Cloudflare for inexpensive durable backend execution, Neon as the source of truth, Expo for native delivery, and GitHub as the control plane.

---

*Kakeido — Tech Stack Engineering Spec v3 · 9 August 2026, amended 17 August 2026*
