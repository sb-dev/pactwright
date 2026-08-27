# Design Specification: Astro + Cloudflare Workers + Meta CAPI

**Content-Driven Marketing Site with Server-Side Conversion Tracking & Analytics**

| Field   | Value                                       |
|---------|---------------------------------------------|
| Version | 1.5                                         |
| Date    | August 2026                                 |
| Author  | Samir                                       |
| Stack   | Astro · Cloudflare · Turborepo · Neon       |
| Status  | Draft                                       |

---

## 1. Executive Summary

This specification defines the architecture of a content-driven marketing site built with **Astro** and deployed to **Cloudflare Workers**. The system uses markdown files as the content source, generates static pages at build time with incremental rebuild support via **Turborepo**, implements **Meta Conversions API (CAPI)** for server-side conversion tracking without third-party cookies, and collects **first-party web analytics** via a dual-write to **Neon Postgres** — all behind **Cloudflare Bot Management** to ensure clean data.

### Goals

| Goal               | Description                                                                                                                                      |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Zero 3P Cookies    | No third-party cookies set by Meta or any external script. All tracking state is first-party, HttpOnly, and server-managed.                      |
| Markdown → Pages   | Authors write `.md` files with YAML frontmatter. Astro's content collections compile these to static HTML at build time.                         |
| Incremental Builds | Turborepo caches build outputs by content hash. Only new or changed markdown files trigger page regeneration.                                    |
| Edge Delivery      | All static assets served from Cloudflare's global CDN. SSR API routes run as Workers at the edge.                                                |
| Privacy-First      | Consent-gated tracking. PII is SHA-256 hashed before leaving the server. No data sent without explicit opt-in.                                   |
| Own Your Analytics | First-party analytics stored in Neon Postgres via dual-write from `/api/track`. No external analytics scripts loaded. Cloudflare Web Analytics provides the baseline dashboard. |
| Bot-Filtered Data  | Cloudflare Bot Management scores every request. Bot traffic (score < 30) is excluded from analytics writes to ensure clean data.                 |

---

## 2. System Architecture

### 2.1 High-Level Overview

The system follows a clear separation between build-time static generation and runtime server-side tracking. Content flows unidirectionally from markdown sources through Astro's build pipeline into static HTML, while user interactions flow through a thin server-side API layer that dual-writes to both Meta's Graph API and a Neon Postgres analytics table.

```
┌─────────────────────────────────────────────────┐
│  Content Layer                                  │
│  Markdown files (.md) with YAML frontmatter     │
│  in src/content/posts/                          │
└──────────────────────┬──────────────────────────┘
                       │ Build (astro build)
                       ▼
┌─────────────────────────────────────────────────┐
│  Build Pipeline                                 │
│  Astro Content Collections → Static HTML pages  │
│  Turborepo caches by content hash               │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐   ┌───────────────────────────────────┐
│  Static Layer    │   │  Runtime Layer (Cloudflare Worker)│
│  Pre-rendered    │   │                                   │
│  HTML/CSS/JS     │   │  Middleware:                      │
│  served from     │   │    • _fbp/_fbc cookie management  │
│  Cloudflare CDN  │   │    • Bot score extraction         │
│                  │   │                                   │
│  + Cloudflare    │   │  POST /api/track:                 │
│    Web Analytics │   │    1. Validate consent            │
│    (zero-config) │   │    2. Check bot score (≥ 30)      │
│                  │   │    3. Dual-write:                 │
└──────────────────┘   │       → Neon (analytics)          │
                       │       → Meta Graph API (CAPI)     │
                       └──────────┬──────────┬─────────────┘
                                  │          │
                    ┌─────────────┘          └──────────┐
                    ▼                                   ▼
       ┌────────────────────┐           ┌───────────────────────┐
       │  Neon Postgres     │           │  Meta Graph API       │
       │  (via Hyperdrive)  │           │  graph.facebook.com   │
       │                    │           │  /v22.0/{PIXEL_ID}/   │
       │  analytics_events  │           │  events               │
       │  table             │           │                       │
       └────────────────────┘           └───────────────────────┘
```

### 2.2 Monorepo Structure (Turborepo)

The project uses Turborepo to orchestrate builds across packages. The monorepo is structured to maximize cache hits and minimize rebuild scope.

| Path                     | Type              | Purpose                                                              |
|--------------------------|-------------------|----------------------------------------------------------------------|
| `/`                      | Root              | `turbo.json`, `pnpm-workspace.yaml`, root `package.json`            |
| `apps/web`               | Astro application | The main site: pages, layouts, components, content, API routes       |
| `packages/tracking`      | Shared library    | Meta CAPI client, analytics writer, SHA-256 hashing, cookie utils, bot score helpers, event types |
| `packages/ui`            | Shared components | Reusable React islands (ConsentBanner, TrackingProvider)             |
| `packages/tsconfig`      | Shared configs    | Base TypeScript configurations                                       |
| `packages/eslint-config` | Shared configs    | ESLint rules                                                         |

### 2.3 Turborepo Pipeline Configuration

The pipeline is configured so that the `build` task in `apps/web` depends on the build outputs of all packages. Turborepo hashes the inputs (source files, dependencies) and skips the build entirely if the hash matches a cached result.

```jsonc
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        "src/content/**/*.md",
        "astro.config.mjs",
        "wrangler.jsonc",
        "package.json"
      ],
      "outputs": ["dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": {}
  }
}
```

The critical detail is the `inputs` array. By including `src/content/**/*.md`, Turborepo computes a content-aware hash. If no markdown files changed (and no code changed), the entire Astro build is served from cache, including all generated HTML. This gives you incremental builds at the monorepo level without any custom diffing logic.

---

## 3. Content System

### 3.1 Markdown Content Collections

Astro's Content Collections provide type-safe markdown handling with schema validation via Zod. Each post is a `.md` file in `src/content/posts/` with YAML frontmatter defining metadata.

#### 3.1.1 Frontmatter Schema

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().default('Samir'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    canonicalUrl: z.string().url().optional(),
    metaEvent: z.enum(['ViewContent', 'Lead']).default('ViewContent'),
  }),
});

export const collections = { posts };
```

#### 3.1.2 Example Post

```md
---
title: "Building AI-Native SaaS on Cloudflare"
description: "How to architect an AICaaS platform using Workers, Durable Objects, and R2."
publishedAt: 2026-03-10
tags: ["cloudflare", "ai", "architecture"]
draft: false
metaEvent: ViewContent
---

# Building AI-Native SaaS on Cloudflare

Your markdown content here. Supports all standard markdown features plus
syntax-highlighted code blocks via Shiki.
```

#### 3.1.3 Static Page Generation

Each markdown file generates a static HTML page at build time using Astro's `getStaticPaths()` pattern. The pages are pre-rendered and served from Cloudflare's CDN with no server-side computation at request time.

```astro
---
// src/pages/posts/[slug].astro
import { getCollection } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export const prerender = true; // Static generation

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<PostLayout frontmatter={post.data}>
  <Content />
</PostLayout>
```

### 3.2 Incremental Build Strategy

True per-file incremental builds are not natively supported by Astro — it rebuilds all content collection pages on each build. The strategy therefore operates at **three tiers** to minimize unnecessary work.

| Tier                              | Mechanism                                                                                                                                                                                                        | Cache Hit Rate |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|
| **Tier 1: Turborepo Hash Cache**  | If no files in the `inputs` array have changed since the last build, Turborepo serves the entire `dist/` directory from its local or remote cache. Zero work is done. This is the primary incremental mechanism. | ~100%          |
| **Tier 2: Remote Cache**          | Enable Turborepo Remote Caching (Vercel or self-hosted) so CI runners share cache across machines. A content author pushing a markdown change won't invalidate the cache if a parallel code-only PR was already built. | ~80%      |
| **Tier 3: Content Hash Script**   | A pre-build script computes SHA-256 hashes of each `.md` file and compares against a manifest. If nothing changed, the script exits early and the Astro build is skipped entirely for content-only deploys.      | ~95%           |

#### 3.2.1 Content Hash Script

```ts
// scripts/check-content-changes.ts
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';

const CONTENT_DIR = 'src/content/posts';
const MANIFEST = '.content-hashes.json';

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const prev = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, 'utf-8'))
  : {};

const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
const current: Record<string, string> = {};
let hasChanges = false;

for (const file of files) {
  const hash = hashFile(`${CONTENT_DIR}/${file}`);
  current[file] = hash;
  if (prev[file] !== hash) hasChanges = true;
}

// Detect deletions
for (const file of Object.keys(prev)) {
  if (!current[file]) hasChanges = true;
}

writeFileSync(MANIFEST, JSON.stringify(current, null, 2));
process.exit(hasChanges ? 0 : 1); // exit 1 = no changes, skip build
```

In CI and in `package.json`:

```jsonc
// apps/web/package.json
{
  "scripts": {
    "build": "astro build",
    "build:incremental": "tsx scripts/check-content-changes.ts && astro build || echo 'No content changes, using cache'"
  }
}
```

---

## 4. Meta Conversions API (Server-Side Tracking)

### 4.1 Why No fbevents.js

The traditional Meta Pixel script (`fbevents.js`) sets third-party cookies, is blocked by ad blockers and Safari ITP, and is affected by iOS ATT. Industry data indicates over 50% of browser-side conversions now go untracked. By replacing the Pixel entirely with the Conversions API, we achieve:

- **No third-party cookies** — all tracking state is first-party
- **Ad-blocker immunity** — the browser never loads Meta's script
- **Full data control** — PII is hashed server-side before transmission
- **iOS/Safari resilience** — server-to-server calls bypass all browser restrictions
- **Reduced page weight** — no external JavaScript bundle loaded

### 4.2 Data Flow

The tracking flow has four stages, each with clear responsibilities.

| Stage            | Details                                                                                                                                                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Landing**   | User arrives. Middleware captures `fbclid` from URL query param (if present from Meta ad click). Middleware generates `_fbp` (browser ID) if not already set. Both stored as first-party, HttpOnly, SameSite=Lax cookies with 90-day expiry. |
| **2. Consent**   | ConsentBanner React island renders. No tracking occurs until user grants explicit consent. Consent state stored in `tracking_consent` cookie (first-party, non-HttpOnly so JS can read it).                                                  |
| **3. Dispatch**  | After consent, the tracker module queues events in memory and flushes via `navigator.sendBeacon()` (with `fetch` + `keepalive` fallback). Flushes occur on `visibilitychange` (page exit), on a 30-second interval, or when the queue reaches 10 events. Each flush sends a batch `POST /api/track` with an array of events. |
| **4. Relay**     | API route validates consent cookie, checks bot score, reads `_fbp`/`_fbc` from request cookies, hashes any PII with SHA-256 via Web Crypto, dual-writes to Neon analytics table and Meta CAPI, and returns 204.                             |

### 4.3 Cookie Strategy

All cookies are first-party, set by our own domain via `Set-Cookie` headers from the Cloudflare Worker. No external domain ever sets a cookie.

| Cookie             | Purpose                      | Set By              | Flags                              | TTL      | Format                            |
|--------------------|------------------------------|----------------------|------------------------------------|----------|-----------------------------------|
| `_fbp`             | Browser ID for Meta matching | Server (middleware)  | HttpOnly; Secure; SameSite=Lax     | 90 days  | `fb.1.{timestamp}.{random}`       |
| `_fbc`             | Click ID from Meta ad click  | Server (middleware)  | HttpOnly; Secure; SameSite=Lax     | 90 days  | `fb.1.{timestamp}.{fbclid}`       |
| `tracking_consent` | User consent state           | Client (JS)          | Secure; SameSite=Lax               | 365 days | `granted` or `denied`             |

### 4.4 API Endpoint: POST /api/track

#### Request Body

The endpoint accepts either a single event or a batched array. The client-side tracker always sends batches.

```json
{
  "events": [
    {
      "event_name": "ViewContent",
      "event_id": "uuid-v4",
      "source_url": "https://example.com/posts/my-post",
      "referrer": "https://google.com",
      "custom_data": {
        "content_name": "Building AI-Native SaaS",
        "content_category": "architecture"
      },
      "timestamp": 1741900000
    },
    {
      "event_name": "scroll_depth",
      "event_id": "uuid-v4",
      "source_url": "https://example.com/posts/my-post",
      "custom_data": { "depth": 75 },
      "timestamp": 1741900030
    }
  ],
  "email": "optional-plaintext@example.com",
  "phone": "+1234567890"
}
```

#### Server Processing

1. Validate `tracking_consent` cookie is `"granted"`. If not, return 204 immediately.
2. Extract bot score from `context.locals.runtime.cf` (Astro Cloudflare adapter exposes `cf` there, not on the Request). If score < 30 and not a verified bot, skip — return 204.
3. Parse and validate the `events` array: reject malformed JSON, empty batches, batches over 25 events, or events missing `event_name`/`event_id`/`source_url` with 400.
4. Read `_fbp` and `_fbc` from request cookies.
5. Extract client IP from `cf-connecting-ip` header, User-Agent, country from `cf-ipcountry`.
6. If email or phone provided (top-level, typically on form submissions), hash with SHA-256 via Web Crypto API.
7. Clamp each event's client timestamp to `[now − 6 days, now]` — client clocks can't be trusted, and Meta rejects events older than 7 days or in the future.
8. **Dual-write (concurrent):**
   - INSERT every event into `analytics_events` in Neon (via Hyperdrive), with `created_at` derived from the clamped event time.
   - POST only standard Meta events (allowlist: PageView, ViewContent, Lead, Purchase, etc.) to `https://graph.facebook.com/v22.0/{PIXEL_ID}/events` in one batch. Analytics-only events like `scroll_depth` and `page_exit` are never sent to Meta — they would pollute Events Manager and drag down EMQ.
9. Return 204 No Content to client.

#### Outbound Payload to Meta

```json
{
  "data": [{
    "event_name": "ViewContent",
    "event_time": 1741900000,
    "event_id": "uuid-v4",
    "event_source_url": "https://...",
    "action_source": "website",
    "user_data": {
      "client_ip_address": "203.0.113.1",
      "client_user_agent": "Mozilla/5.0...",
      "fbp": "fb.1.1741900000.123456789",
      "fbc": "fb.1.1741900000.AbC123...",
      "em": "a1b2c3...sha256hash",
      "ph": "d4e5f6...sha256hash"
    },
    "custom_data": { "..." : "..." }
  }],
  "access_token": "EAA..."
}
```

### 4.5 Event Match Quality Targets

Meta assigns an Event Match Quality (EMQ) score from 0–10 for each event type. The following are the targets for this implementation.

| Event                  | Target EMQ  | Available Identifiers                                                      |
|------------------------|-------------|----------------------------------------------------------------------------|
| PageView / ViewContent | 6.5 – 7.5   | IP + UA + `_fbp`. No PII typically available.                              |
| Lead (form submit)     | 8.0+         | IP + UA + `_fbp` + hashed email + hashed phone.                           |
| Purchase               | 8.8 – 9.3   | All identifiers including `_fbc` (from ad click) + transaction data.       |

### 4.6 Pixel Strategy: CAPI-Only with Proxied Hybrid Upgrade Path

#### Chosen Approach: CAPI-Only (No fbevents.js)

This implementation does not load Meta's client-side Pixel script (`fbevents.js`). All conversion events are sent exclusively server-to-server via the Conversions API. The browser never contacts `connect.facebook.net` or `www.facebook.com`.

**Rationale:**

- **Cleanest privacy posture.** No third-party JavaScript executing in the user's browser. Simplifies GDPR/CCPA compliance — the consent gate controls exactly one data pathway (your own `/api/track` endpoint).
- **Zero ad-blocker surface.** The tracker sends to your own domain. There's nothing for uBlock Origin, Brave, or Safari ITP to catch.
- **Minimal browser payload.** 0 KB of external scripts. Your custom tracker is ~0.5 KB.
- **Architectural simplicity.** One tracking path (browser → your Worker → Meta + Neon). No deduplication logic needed. No second event stream to monitor.

**Retargeting tradeoff acknowledged:** CAPI-only retargeting audiences will be smaller than a hybrid Pixel + CAPI setup. Meta's Pixel script collects browser-level fingerprints (canvas, WebGL, screen properties) that improve audience matching for custom and lookalike audiences. With CAPI-only, retargeting relies on IP + User-Agent + server-generated `_fbp`/`_fbc` + hashed PII, which typically yields EMQ scores of 6.5–7.5 for PageView events vs. 8.0+ with the hybrid approach.

**When this tradeoff is acceptable:** For a content marketing site in its early stages, the retargeting audience is small enough that the matching gap is negligible. The focus should be on content quality and organic distribution first. Once paid Meta Ads spend exceeds a threshold where the EMQ gap materially impacts ROAS (typically $2k+/month), upgrade to the proxied hybrid approach documented below.

#### Upgrade Path: Proxied Pixel + CAPI (Option C)

When retargeting performance demands maximum data quality, the architecture can be upgraded to a hybrid model where Meta's Pixel script and its collection endpoint are proxied through a Cloudflare Worker on your own domain. This bypasses ad blockers while giving Meta both browser-side and server-side signals.

**How it works:**

```
Browser                         Your Cloudflare Worker              Meta
  │                                     │                             │
  │ GET /t/p.js                         │                             │
  │────────────────────────────────────>│                             │
  │                                     │ GET connect.facebook.net/   │
  │                                     │     en_US/fbevents.js       │
  │                                     │────────────────────────────>│
  │                                     │<────────────────────────────│
  │<────────────────────────────────────│ (rewrite internal URLs)     │
  │                                     │                             │
  │ POST /t/tr  {pixel event}           │                             │
  │────────────────────────────────────>│                             │
  │                                     │ POST www.facebook.com/tr    │
  │                                     │────────────────────────────>│
  │                                     │<────────────────────────────│
  │<────────────────────────────────────│                             │
  │                                     │                             │
  │ POST /api/track {CAPI event,        │                             │
  │   same event_id}                    │                             │
  │────────────────────────────────────>│                             │
  │                                     │ POST graph.facebook.com     │
  │                                     │   /v22.0/{PIXEL_ID}/events  │
  │                                     │────────────────────────────>│
```

**Proxy Worker sketch:**

```ts
// workers/pixel-proxy.ts (separate Worker, routed via wrangler.jsonc)

const SCRIPT_ORIGIN = "https://connect.facebook.net";
const COLLECT_ORIGIN = "https://www.facebook.com";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Proxy the Pixel script: /t/p.js → connect.facebook.net/en_US/fbevents.js
    if (url.pathname === "/t/p.js") {
      const resp = await fetch(`${SCRIPT_ORIGIN}/en_US/fbevents.js`);
      const script = await resp.text();

      // Rewrite collection endpoint URLs inside the script
      // so Pixel sends to /t/tr instead of www.facebook.com/tr
      const rewritten = script
        .replaceAll("www.facebook.com/tr", `${url.hostname}/t/tr`)
        .replaceAll("connect.facebook.net", `${url.hostname}/t`);

      return new Response(rewritten, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Proxy the collection endpoint: /t/tr → www.facebook.com/tr
    if (url.pathname === "/t/tr") {
      const targetUrl = `${COLLECT_ORIGIN}/tr${url.search}`;
      return fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method === "POST" ? request.body : undefined,
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
```

**Modified Pixel snippet (loaded post-consent):**

```html
<!-- Loaded by ConsentBanner only after tracking_consent=granted -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  '/t/p.js');  // ← Proxied through your domain, not connect.facebook.net

  fbq('init', 'YOUR_PIXEL_ID');
</script>
```

**Deduplication requirement:** When running hybrid, both the Pixel and CAPI must send the same `event_id` for each event. The tracker module already generates UUIDs — pass the same ID to both `fbq('track', ...)` and the `/api/track` POST:

```ts
// In TrackingProvider, after Pixel is loaded:
const eventId = crypto.randomUUID();

// Pixel fires client-side
fbq('track', 'ViewContent', customData, { eventID: eventId });

// Tracker sends to CAPI via /api/track
tracker.track('ViewContent', { ...customData, event_id: eventId });
```

Meta deduplicates by matching `event_id` across Pixel and CAPI streams. Target >70% deduplication quality in Events Manager.

**Risks & maintenance costs of Option C:**

- Meta can change `fbevents.js` internals, endpoint URLs, or add integrity checks at any time. The proxy must be monitored and updated.
- The URL rewriting in the script is fragile — Meta's JS is minified and obfuscated. A structural change could break the `replaceAll` approach.
- Some sophisticated ad blockers (uBlock Origin with custom filter lists) detect patterns in the JS code itself, not just the domain. This is an arms race.
- Ethically gray: proxying third-party tracking as first-party undermines user expectations about what first-party code does. Ensure consent is airtight and transparent.
- Add a WAF skip rule for `/t/*` paths to prevent SBFM from challenging Pixel requests.

**Decision trigger for upgrade:** Monitor these metrics in Meta Events Manager monthly. If any threshold is crossed, implement Option C:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Monthly Meta Ads spend | > $2,000/month | Evaluate hybrid ROI |
| EMQ for PageView events | Consistently < 6.5 | Hybrid likely needed |
| Custom audience match rate | < 40% of website visitors matched | Hybrid likely needed |
| Attributed conversions gap | > 30% gap between Neon analytics events and Meta reported events | CAPI signal loss, hybrid helps |

---

## 5. Web Analytics

### 5.1 Strategy: Dual-Write + Cloudflare Web Analytics

The analytics approach has two layers, each with a distinct role.

**Cloudflare Web Analytics** is enabled at the dashboard level (zero code changes). It provides an instant visual dashboard with page views, referrers, top paths, Core Web Vitals, and performance metrics. This is the primary "look at the dashboard" tool for day-to-day visibility. It's free, cookieless, and requires no consent banner.

**Neon Postgres (dual-write from `/api/track`)** is the raw data layer. Every consented, bot-filtered event that flows through the tracking endpoint is also written to an `analytics_events` table. This data is queryable with SQL for questions Cloudflare WA can't answer: funnel analysis, per-post conversion rates, cohort behavior, UTM attribution breakdowns. No additional browser script is loaded — the existing `TrackingProvider` island's `POST /api/track` call is the sole data source.

### 5.2 Postgres Extensions

The analytics table uses two Neon-supported extensions that are already preloaded in Neon's `shared_preload_libraries` — no configuration needed.

| Extension       | Purpose                                                                                                     | Preloaded on Neon | When to Add |
|-----------------|-------------------------------------------------------------------------------------------------------------|-------------------|-------------|
| **TimescaleDB** | Automatic time-based partitioning (hypertables), built-in compression, continuous aggregates that auto-refresh incrementally. Queries on `created_at` ranges only scan relevant chunks. | Yes | Day 1 |
| **pg_cron**     | Schedule recurring SQL jobs inside Postgres (data retention, maintenance). No external cron or Cloudflare Cron Trigger needed. | Yes | Day 1 |
| **HLL**         | Probabilistic distinct counting. Sub-millisecond `COUNT(DISTINCT visitor)` approximations with ~2% error. Useful for "unique visitors per page" at scale. | Available | When daily events > 50k |
| **pg_mooncake** | Columnstore tables with DuckDB vectorized execution. 10–100x faster aggregation. Stores data as Parquet in object storage. | Available | When you outgrow TimescaleDB or need ad-hoc analytics across tens of millions of rows. Currently requires BYO object storage bucket on Neon. |

### 5.3 Analytics Schema (Neon Postgres + TimescaleDB)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Analytics events table
CREATE TABLE analytics_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY,
  event_name    TEXT        NOT NULL,
  event_id      UUID        NOT NULL,
  source_url    TEXT        NOT NULL,
  referrer      TEXT,
  user_agent    TEXT,
  country       TEXT,       -- From cf-ipcountry header
  city          TEXT,       -- From cf-ipcity header (if available)
  device_type   TEXT,       -- Parsed: 'mobile' | 'tablet' | 'desktop'
  browser       TEXT,       -- Parsed from UA: 'Chrome' | 'Safari' | ...
  os            TEXT,       -- Parsed from UA: 'iOS' | 'Windows' | ...
  utm_source    TEXT,       -- Extracted from source_url query params
  utm_medium    TEXT,
  utm_campaign  TEXT,
  bot_score     SMALLINT,   -- Cloudflare bot score (30–99 for humans)
  custom_data   JSONB,      -- Flexible event-specific properties
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hypertables require unique constraints to INCLUDE the partitioning
  -- column — a UNIQUE on event_id alone would make create_hypertable()
  -- fail. event_id is a client-generated UUID, so (event_id, created_at)
  -- is unique in practice. The server derives created_at from the
  -- event's clamped client timestamp, so a retried insert of the same
  -- event carries identical values and is dropped by ON CONFLICT.
  UNIQUE (event_id, created_at)
);

-- ── TimescaleDB Hypertable ─────────────────────────────────────────
-- Convert to a hypertable partitioned by created_at.
-- chunk_time_interval = 7 days is appropriate for a marketing site's
-- volume. TimescaleDB automatically creates and manages partitions.
-- Queries on time ranges only scan relevant chunks (partition pruning).
SELECT create_hypertable('analytics_events', 'created_at',
  chunk_time_interval => INTERVAL '7 days',
  migrate_data => true
);

-- ── Indexes ────────────────────────────────────────────────────────
-- TimescaleDB automatically indexes the time dimension.
-- Composite indexes include created_at for chunk pruning.
CREATE INDEX idx_events_name    ON analytics_events (event_name, created_at DESC);
CREATE INDEX idx_events_url     ON analytics_events (source_url, created_at DESC);
CREATE INDEX idx_events_country ON analytics_events (country, created_at DESC);
CREATE INDEX idx_events_utm     ON analytics_events (utm_source, utm_campaign, created_at DESC);

-- ── Compression ────────────────────────────────────────────────────
-- Enable compression on chunks older than 30 days.
-- Typically achieves 90%+ storage reduction on analytics data.
-- Critical for Neon's free tier (0.5 GB limit) — compression
-- effectively extends capacity to ~5 GB of raw data.
ALTER TABLE analytics_events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'event_name, country',
  timescaledb.compress_orderby = 'created_at DESC'
);

SELECT add_compression_policy('analytics_events', INTERVAL '30 days');

-- ── Continuous Aggregate ───────────────────────────────────────────
-- Replaces the manual materialized view. Auto-refreshes incrementally
-- (only processes new data since last refresh, not the entire table).
-- NOTE: continuous aggregates do NOT support COUNT(DISTINCT ...).
-- Since event_id is unique per row, COUNT(*) already equals the event
-- count. For unique-visitor counting, add the HLL extension later
-- (see Section 5.2).
CREATE MATERIALIZED VIEW analytics_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', created_at) AS day,
  event_name,
  source_url,
  country,
  device_type,
  utm_source,
  utm_campaign,
  COUNT(*)                         AS event_count
FROM analytics_events
GROUP BY 1, 2, 3, 4, 5, 6, 7
WITH NO DATA;

-- Refresh policy: update every hour, look back 3 hours for late data
SELECT add_continuous_aggregate_policy('analytics_daily',
  start_offset    => INTERVAL '3 hours',
  end_offset      => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);

-- ── Data Retention (via pg_cron) ───────────────────────────────────
-- Delete raw events older than 1 year. Aggregates are kept forever.
-- Runs every Sunday at 3 AM UTC.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('analytics-retention',
  '0 3 * * 0',
  $$DELETE FROM analytics_events WHERE created_at < now() - INTERVAL '1 year'$$
);
```

**Why TimescaleDB over plain Postgres for analytics:**

- **Partition pruning.** A query for "last 30 days" scans ~4 chunks instead of the entire table. As the table grows to millions of rows, this is the difference between 50ms and 5s.
- **Compression.** Analytics data compresses extremely well (repetitive `event_name`, `country`, `device_type` values). 90%+ reduction extends Neon's 0.5 GB free tier to hold ~25M raw events — years of headroom for a marketing site.
- **Continuous aggregates.** Unlike a manual `REFRESH MATERIALIZED VIEW` that recomputes everything, TimescaleDB's continuous aggregates only process new data since the last refresh. An hourly refresh that takes 10ms vs. 10s at scale.
- **No code changes.** The table looks and behaves like a regular Postgres table. INSERTs, SELECTs, and the `writeAnalyticsEvent()` function all work unchanged. TimescaleDB is transparent to the application layer.

### 5.4 Analytics Writer

```ts
// packages/tracking/src/analytics.ts

interface AnalyticsEvent {
  event_name: string;
  event_id: string;
  source_url: string;
  referrer?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  bot_score?: number;
  custom_data?: Record<string, unknown>;
  created_at: string; // ISO timestamp derived from the clamped event time
}

export async function writeAnalyticsEvent(
  db: any, // Hyperdrive-connected pg client
  event: AnalyticsEvent
): Promise<void> {
  await db.query(
    `INSERT INTO analytics_events (
      event_name, event_id, source_url, referrer, user_agent,
      country, city, device_type, browser, os,
      utm_source, utm_medium, utm_campaign, bot_score, custom_data,
      created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    ON CONFLICT (event_id, created_at) DO NOTHING`,
    [
      event.event_name, event.event_id, event.source_url,
      event.referrer, event.user_agent,
      event.country, event.city, event.device_type,
      event.browser, event.os,
      event.utm_source, event.utm_medium, event.utm_campaign,
      event.bot_score,
      event.custom_data ? JSON.stringify(event.custom_data) : null,
      event.created_at,
    ]
  );
}
```

### 5.5 Example Queries

```sql
-- Top posts by views (last 30 days)
-- TimescaleDB prunes to ~4 chunks instead of scanning full table
SELECT source_url, COUNT(*) as views
FROM analytics_events
WHERE event_name = 'ViewContent'
  AND created_at > now() - interval '30 days'
GROUP BY source_url ORDER BY views DESC LIMIT 20;

-- Conversion funnel: ViewContent → Lead
WITH views AS (
  SELECT DISTINCT source_url FROM analytics_events
  WHERE event_name = 'ViewContent' AND created_at > now() - interval '30 days'
),
leads AS (
  SELECT DISTINCT source_url FROM analytics_events
  WHERE event_name = 'Lead' AND created_at > now() - interval '30 days'
)
SELECT
  (SELECT COUNT(*) FROM views) AS total_viewed,
  (SELECT COUNT(*) FROM leads) AS total_leads,
  ROUND((SELECT COUNT(*) FROM leads)::numeric
    / NULLIF((SELECT COUNT(*) FROM views), 0) * 100, 2) AS conversion_pct;

-- Traffic by UTM campaign (queries the continuous aggregate — sub-ms)
SELECT utm_source, utm_campaign, SUM(event_count) AS events
FROM analytics_daily
WHERE day > now() - interval '30 days'
  AND utm_source IS NOT NULL
GROUP BY utm_source, utm_campaign ORDER BY events DESC;

-- Daily traffic trend (uses TimescaleDB time_bucket on the aggregate)
SELECT day, SUM(event_count) AS total_events
FROM analytics_daily
WHERE day > now() - interval '90 days'
GROUP BY day ORDER BY day;

-- Bot score distribution (sanity check — should see no scores < 30)
SELECT
  CASE
    WHEN bot_score >= 80 THEN 'Definitely human (80-99)'
    WHEN bot_score >= 50 THEN 'Likely human (50-79)'
    WHEN bot_score >= 30 THEN 'Ambiguous (30-49)'
    ELSE 'Bot (< 30, should not appear)'
  END AS category,
  COUNT(*) AS events
FROM analytics_events
WHERE created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 1;

-- Compression stats (monitor storage savings)
SELECT
  pg_size_pretty(before_compression_total_bytes) AS before,
  pg_size_pretty(after_compression_total_bytes) AS after,
  ROUND((1 - after_compression_total_bytes::numeric
    / NULLIF(before_compression_total_bytes, 0)) * 100, 1) AS savings_pct
FROM hypertable_compression_stats('analytics_events');
```

---

## 6. Bot Management

### 6.1 Cloudflare Bot Management Tiers

Cloudflare offers three tiers of bot protection. The choice depends on plan level and granularity needs.

| Tier                      | Plan           | Bot Score Access            | Workers Access                          | Customization                                                    |
|---------------------------|----------------|-----------------------------|-----------------------------------------|------------------------------------------------------------------|
| Bot Fight Mode            | Free           | No (binary)                 | No                                      | On/off only. Cannot skip or bypass via rules.                    |
| Super Bot Fight Mode      | Pro / Business | Grouped only (no per-request score) | No                               | Block/challenge definitely and likely automated. Can skip via WAF custom rules. |
| Bot Management (full)     | Enterprise     | Per-request 1–99            | Yes (`request.cf.botManagement.score`)  | Full granular scoring. WAF rules + Workers. Anomaly detection. ML auto-updates. |

### 6.2 Recommended Configuration

**For Pro/Business plan (starting point):** Enable Super Bot Fight Mode (SBFM) from the Cloudflare dashboard. Configure "Definitely automated" traffic to Block, "Likely automated" to Managed Challenge, and allow verified bots. Add a WAF custom rule to skip SBFM for the `/api/track` endpoint so it doesn't interfere with tracking calls from the browser — the bot filtering happens inside the Worker logic instead.

**For Enterprise plan (ideal):** Enable Bot Management with ML model auto-updates. The per-request `cf.bot_management.score` (1–99) is available both in WAF custom rules and inside Workers (`request.cf.botManagement.score` in a raw Worker; in the Astro Cloudflare adapter the same object is exposed at `context.locals.runtime.cf`). This gives the most precise analytics filtering.

### 6.3 Bot Score Integration in the Worker

Cloudflare attaches bot management data to every request's `cf` object. In a Worker (or Astro SSR route running on a Worker), you access it via `request.cf`.

```ts
// packages/tracking/src/bot.ts

interface BotInfo {
  score: number;         // 1-99 (lower = more bot-like)
  verified: boolean;     // true if Cloudflare-verified good bot (Google, Bing, etc.)
  isHuman: boolean;      // convenience: score >= 30
  source: string;        // detection engine that produced the score
}

// NOTE: In the Astro Cloudflare adapter, the cf object is NOT on the
// Request — it's exposed at context.locals.runtime.cf. Pass that in.
export function extractBotInfo(cf: Record<string, any> | undefined): BotInfo {
  // Enterprise Bot Management: granular score
  if (cf?.botManagement?.score !== undefined) {
    return {
      score: cf.botManagement.score,
      verified: cf.botManagement.verifiedBot ?? false,
      isHuman: cf.botManagement.score >= 30,
      source: cf.botManagement.detectionIds?.[0] ?? 'unknown',
    };
  }

  // Pro/Business SBFM: no granular score in Workers,
  // fall back — SBFM handles blocking at edge
  return {
    score: 99, // Assume human if no score (SBFM already filtered bots)
    verified: false,
    isHuman: true,
    source: 'sbfm-fallback',
  };
}

export function shouldTrack(bot: BotInfo): boolean {
  // Exclude verified bots (Google, Bing) from analytics to avoid inflating counts
  if (bot.verified) return false;

  // Exclude likely bots from both analytics and Meta CAPI
  if (!bot.isHuman) return false;

  return true;
}
```

### 6.4 Bot Score Flow Through the System

```
Request arrives at Cloudflare Edge
       │
       ▼
┌──────────────────────────────────┐
│  Cloudflare Bot Management       │
│  Scores request 1–99             │
│  Attaches to request.cf          │
│                                  │
│  Score < 30 + SBFM enabled:      │
│    → Blocked/Challenged at edge  │
│    → Never reaches Worker        │
│                                  │
│  Score ≥ 30 (or verified bot):   │
│    → Passes to Worker            │
└──────────────┬───────────────────┘
               ▼
┌──────────────────────────────────┐
│  Worker: /api/track              │
│                                  │
│  1. Extract bot score            │
│  2. shouldTrack(botInfo)?        │
│     • verified bot → skip        │
│     • score < 30  → skip (edge   │
│       case: SBFM may miss some)  │
│     • score ≥ 30  → proceed      │
│  3. Dual-write:                  │
│     • analytics_events (w/ score)│
│     • Meta CAPI                  │
│  4. Store bot_score in DB for    │
│     post-hoc analysis            │
└──────────────────────────────────┘
```

This double-gating approach (edge + Worker) means the vast majority of bot traffic never even reaches your Worker. The Worker-level check catches edge cases and records the bot score in Neon for ongoing data quality monitoring.

### 6.5 WAF Rule: Skip SBFM for /api/track

To prevent SBFM from challenging your site's legitimate `POST /api/track` calls from the browser, add a WAF custom rule:

```
Expression: (http.request.uri.path eq "/api/track" and http.request.method eq "POST")
Action: Skip → Super Bot Fight Mode
```

This ensures the consent-gated tracking request from `TrackingProvider` always reaches the Worker, where bot filtering is handled programmatically with the score stored for analysis.

---

## 7. Cloudflare Worker Configuration

### 7.1 Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "marketing-site",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2025-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist",
    "not_found_handling": "404-page",
    // CRITICAL: without this, prerendered pages are served directly by
    // the asset layer and the Worker (and Astro middleware) never runs —
    // meaning _fbp/_fbc cookies and fbclid capture silently fail on all
    // content pages. Hashed build assets are excluded so they stay on
    // the fast, free static-serving path.
    "run_worker_first": ["/*", "!/_astro/*", "!/favicon.svg"]
  },
  "vars": {
    "META_PIXEL_ID": "YOUR_PIXEL_ID"
  },
  // Hyperdrive accelerates Neon Postgres connections from Workers
  "hyperdrive": [{
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id"
  }],
  "observability": { "enabled": true }
}
```

Secrets are stored via `wrangler secret put META_ACCESS_TOKEN` and never committed to source control. The Hyperdrive binding provides connection pooling and caching for Neon queries from the Worker edge.

**Why `run_worker_first` matters:** By default, Cloudflare serves static assets *before* invoking the Worker. Since all content pages are prerendered, requests to them would never reach the Astro middleware — no `_fbp` cookie generation, no `fbclid` capture on ad landings, and therefore broken retargeting attribution. Setting `run_worker_first` for HTML routes forces the Worker to run first (middleware executes, cookies are set), then the Worker serves the static asset via the `ASSETS` binding. The tradeoff is one Worker invocation per page view, which is well within free-tier limits for a marketing site. Hashed assets under `/_astro/*` are excluded to keep them on the zero-cost static path.

### 7.2 Astro Configuration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com',
  adapter: cloudflare(),
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});
```

### 7.3 Routing Strategy

The app uses a hybrid rendering model: content pages are static, API routes are server-rendered.

| Route            | Rendering          | Description                                                   |
|------------------|--------------------|---------------------------------------------------------------|
| `/`              | Static (prerender) | Homepage with post listing                                    |
| `/posts/[slug]`  | Static (prerender) | Individual post pages from markdown                           |
| `/posts`         | Static (prerender) | Post index with pagination                                    |
| `/api/track`     | SSR (Worker)       | Meta CAPI relay + Neon analytics dual-write                   |
| `/api/health`    | SSR (Worker)       | Health check for monitoring                                   |
| `/rss.xml`       | Static (prerender) | RSS feed generated from content collection                    |
| `/sitemap.xml`   | Static (prerender) | Auto-generated by `@astrojs/sitemap`                          |

---

## 8. Consent Management

Meta does not provide a native Consent Mode. The application implements its own lightweight consent system. No tracking data is collected or transmitted before the user provides explicit opt-in consent.

**Important:** Cloudflare Web Analytics runs independently and does not require consent as it is cookieless and collects no PII. The consent gate applies only to the `/api/track` endpoint (Meta CAPI + Neon analytics).

### 8.1 Consent Flow

1. User lands on any page. `ConsentBanner` island renders (`client:load`).
2. Banner displays clear explanation of what data is collected and why.
3. User clicks "Accept" or "Decline".
4. JavaScript sets `tracking_consent` cookie to `"granted"` or `"denied"`.
5. On "Accept", the banner also dispatches `document.dispatchEvent(new Event("tracking-consent-granted"))`. The tracker (already mounted but idle) listens for this event and starts — firing the current page's event without requiring a reload.
6. On subsequent pages, the tracker finds the cookie already set and starts immediately.
7. If `"denied"`, no events are ever sent. `/api/track` also validates server-side.

### 8.2 GDPR / CCPA Compliance Notes

- **No pre-checked boxes**: consent must be an affirmative action.
- **Granular control**: users can change consent at any time via a footer link.
- **Data minimization**: only event name, timestamp, hashed identifiers, and IP are sent.
- **Right to erasure**: clearing cookies removes all first-party identifiers.
- **Dual validation**: consent is checked both client-side (before dispatch) and server-side (before relay).

---

## 9. Deployment Pipeline

### 9.1 CI/CD Flow (GitHub Actions)

| #   | Step           | Details                                                                                            |
|-----|----------------|----------------------------------------------------------------------------------------------------|
| 1   | Push / PR      | Developer pushes to `main` or opens PR                                                             |
| 2   | Install        | `pnpm install` with frozen lockfile                                                                |
| 3   | Lint + Type    | `turbo run lint typecheck` (cached)                                                                |
| 4   | Build          | `turbo run build` — Turborepo checks input hashes. If cache hit, skips entirely.                   |
| 5   | Content Check  | Optional: run `check-content-changes.ts` for content-only PRs                                      |
| 6   | DB Migrate     | Run Neon schema migrations if `packages/tracking/migrations/` has changes                          |
| 7   | Deploy         | `npx wrangler deploy` run in `apps/web` (deploys `./dist` per `wrangler.jsonc`)                    |
| 8   | Post-Deploy    | Meta Test Events verification via Events Manager + Neon analytics spot check                       |

### 9.2 Cache Invalidation Rules

Turborepo's content-addressed cache means builds are invalidated when:

- Any `.md` file in `src/content/` is added, modified, or deleted
- Any source file in `src/` (components, layouts, pages) changes
- `astro.config.mjs` or `wrangler.jsonc` changes
- `package.json` dependencies change (lockfile is an implicit input)
- Any package in `packages/*` is rebuilt (due to `dependsOn: ["^build"]`)

When none of these change, Turborepo replays the cached `dist/` directory. The deploy step still runs (pushing assets to Cloudflare), but the build itself is instant.

---

## 10. Complete File Tree

```
marketing-site/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── apps/
│   └── web/
│       ├── astro.config.mjs
│       ├── wrangler.jsonc
│       ├── tsconfig.json
│       ├── .content-hashes.json
│       ├── scripts/
│       │   └── check-content-changes.ts
│       ├── public/
│       │   ├── .assetsignore
│       │   └── favicon.svg
│       └── src/
│           ├── content.config.ts
│           ├── middleware.ts
│           ├── content/
│           │   └── posts/
│           │       ├── building-ai-saas.md
│           │       └── cloudflare-patterns.md
│           ├── components/
│           │   ├── ConsentBanner.tsx
│           │   ├── TrackingProvider.tsx
│           │   └── PostCard.astro
│           ├── layouts/
│           │   ├── Base.astro
│           │   └── PostLayout.astro
│           └── pages/
│               ├── index.astro
│               ├── rss.xml.ts
│               ├── posts/
│               │   ├── index.astro
│               │   └── [slug].astro
│               └── api/
│                   ├── track.ts
│                   └── health.ts
├── packages/
│   ├── tracking/
│   │   ├── package.json
│   │   ├── migrations/
│   │   │   ├── 001_extensions.sql           # CREATE EXTENSION timescaledb, pg_cron
│   │   │   └── 002_analytics_events.sql     # Table, hypertable, compression, continuous aggregate, retention
│   │   └── src/
│   │       ├── index.ts
│   │       ├── meta-client.ts     # sendMetaEvent() → Meta Graph API
│   │       ├── analytics.ts       # writeAnalyticsEvent() → Neon
│   │       ├── bot.ts             # extractBotInfo(), shouldTrack()
│   │       ├── hash.ts            # sha256()
│   │       ├── cookies.ts         # generateFbp(), extractFbc(), parseCookie()
│   │       ├── ua-parser.ts       # parseUserAgent() → device, browser, os
│   │       └── types.ts           # MetaEvent, AnalyticsEvent, BotInfo
│   ├── ui/
│   │   ├── package.json
│   │   └── src/
│   │       ├── ConsentBanner.tsx
│   │       ├── TrackingProvider.tsx  # React island: initializes tracker
│   │       └── tracker.ts           # Core: sendBeacon transport, queue, flush, scroll/exit tracking
│   ├── tsconfig/
│   └── eslint-config/
#
# Future (Option C upgrade, see Section 4.6):
# ├── workers/
# │   └── pixel-proxy.ts          # Proxies fbevents.js + /tr endpoint
```

---

## 11. Key Implementation Details

### 11.1 Middleware — Cookie Management

```ts
// src/middleware.ts
// NOTE: middleware only runs when the Worker is invoked. See Section 7.1
// (run_worker_first) — without that setting, prerendered pages bypass
// the Worker entirely and this middleware never executes.
import { defineMiddleware } from "astro:middleware";
import { generateFbp, extractFbc, parseCookie } from "@marketing/tracking";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const response = await next();

  // Capture fbclid from ad click → store as _fbc first-party cookie
  const fbclid = url.searchParams.get("fbclid");
  if (fbclid) {
    const fbc = extractFbc(fbclid);
    response.headers.append(
      "Set-Cookie",
      `_fbc=${fbc}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7776000`
    );
  }

  // Generate _fbp if not present.
  // parseCookie avoids the substring false-positive that a plain
  // includes("_fbp=") check would hit on cookies like "foo_fbp".
  const cookies = context.request.headers.get("cookie") ?? "";
  if (!parseCookie(cookies, "_fbp")) {
    const fbp = generateFbp();
    response.headers.append(
      "Set-Cookie",
      `_fbp=${fbp}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7776000`
    );
  }

  return response;
});
```

### 11.2 API Route (Dual-Write with Bot Filtering + Batch Support)

```ts
// src/pages/api/track.ts
import type { APIContext } from "astro";
import {
  sendMetaEvent, writeAnalyticsEvent,
  sha256, parseCookie,
  extractBotInfo, shouldTrack,
  parseUserAgent, extractUtmParams,
} from "@marketing/tracking";
import { Client } from "pg";

export const prerender = false;

const MAX_BATCH_SIZE = 25;

// Standard Meta events are relayed to CAPI. Analytics-only events
// (scroll_depth, page_exit, custom engagement events) go to Neon only —
// sending them to Meta would pollute Events Manager and drag down EMQ.
const META_EVENTS = new Set([
  "PageView", "ViewContent", "Lead", "Purchase", "AddToCart",
  "InitiateCheckout", "CompleteRegistration", "Contact", "Subscribe",
]);

export async function POST(context: APIContext) {
  const cookies = context.request.headers.get("cookie") ?? "";

  // 1. Gate on consent
  const consent = parseCookie(cookies, "tracking_consent");
  if (consent !== "granted") {
    return new Response(null, { status: 204 });
  }

  // 2. Extract and evaluate bot score.
  //    In the Astro Cloudflare adapter, cf lives on locals.runtime.cf.
  const botInfo = extractBotInfo(context.locals.runtime.cf);
  if (!shouldTrack(botInfo)) {
    return new Response(null, { status: 204 });
  }

  // 3. Parse and validate — supports batched events
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const events: Array<{
    event_name: string;
    event_id: string;
    source_url: string;
    referrer?: string;
    custom_data?: Record<string, unknown>;
    timestamp?: number;
  }> = body.events ?? [body]; // Backward compat: single event or array

  if (
    !Array.isArray(events) ||
    events.length === 0 ||
    events.length > MAX_BATCH_SIZE ||
    events.some((e) => !e?.event_name || !e?.event_id || !e?.source_url)
  ) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { email, phone } = body;
  const env = context.locals.runtime.env;

  const ip = context.request.headers.get("cf-connecting-ip") ?? undefined;
  const ua = context.request.headers.get("user-agent") ?? undefined;
  const country = context.request.headers.get("cf-ipcountry") ?? undefined;
  const fbp = parseCookie(cookies, "_fbp") ?? undefined;
  const fbc = parseCookie(cookies, "_fbc") ?? undefined;

  // 4. Hash PII (once for the batch)
  const hashedEmail = email ? await sha256(email) : undefined;
  const hashedPhone = phone ? await sha256(phone) : undefined;

  // 5. Parse UA (once for the batch)
  const { device_type, browser, os } = parseUserAgent(ua);

  // 6. Clamp client timestamps. Client clocks can't be trusted, and
  //    Meta rejects events older than 7 days or in the future.
  const now = Math.floor(Date.now() / 1000);
  const minTime = now - 6 * 24 * 60 * 60;
  const clampTime = (t?: number) =>
    typeof t === "number" && t >= minTime && t <= now ? t : now;

  // 7. Dual-write (concurrent)
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();

  try {
    const prepared = events.map((evt) => {
      const { utm_source, utm_medium, utm_campaign } = extractUtmParams(evt.source_url);
      const eventTime = clampTime(evt.timestamp);
      return {
        analyticsEvent: {
          event_name: evt.event_name,
          event_id: evt.event_id,
          source_url: evt.source_url,
          referrer: evt.referrer,
          user_agent: ua,
          country, city: undefined,
          device_type, browser, os,
          utm_source, utm_medium, utm_campaign,
          bot_score: botInfo.score,
          custom_data: evt.custom_data,
          // Derived from the clamped event time so retried inserts of the
          // same event collide on (event_id, created_at) and are dropped
          created_at: new Date(eventTime * 1000).toISOString(),
        },
        metaEvent: META_EVENTS.has(evt.event_name)
          ? {
              event_name: evt.event_name,
              event_time: eventTime,
              event_id: evt.event_id,
              event_source_url: evt.source_url,
              action_source: "website" as const,
              user_data: {
                client_ip_address: ip,
                client_user_agent: ua,
                fbp, fbc,
                em: hashedEmail,
                ph: hashedPhone,
              },
              custom_data: evt.custom_data,
            }
          : null,
      };
    });

    const metaEvents = prepared
      .map((p) => p.metaEvent)
      .filter((e): e is NonNullable<typeof e> => e !== null);

    await Promise.allSettled([
      // All events go to Neon
      ...prepared.map((p) => writeAnalyticsEvent(db, p.analyticsEvent)),

      // Only standard Meta events are relayed to CAPI
      // (CAPI supports up to 1000 events per request)
      ...(metaEvents.length > 0
        ? [sendMetaEvent(env.META_PIXEL_ID, env.META_ACCESS_TOKEN, metaEvents)]
        : []),
    ]);
  } finally {
    await db.end();
  }

  return new Response(null, { status: 204 });
}
```

### 11.3 Client-Side Tracker Module

The tracker is a zero-dependency ~50-line module that handles transport, queuing, consent checking, scroll depth, time-on-page, and page exit — all without a framework dependency. The React island (`TrackingProvider`) is a thin wrapper that initializes it.

#### Transport Strategy

`navigator.sendBeacon()` is the primary transport. It's designed specifically for analytics: fire-and-forget, survives page unload, doesn't block navigation, and is more reliable than `fetch` during `visibilitychange` events — particularly on mobile Safari where `fetch` with `keepalive` frequently drops exit events. Falls back to `fetch` + `keepalive: true` if sendBeacon returns `false` (payload too large or browser quota exceeded), and to a plain `fetch` as a last resort.

| Transport              | Reliability on page exit | Custom headers | Max payload | Browser support |
|------------------------|--------------------------|----------------|-------------|-----------------|
| `navigator.sendBeacon` | Excellent                | No (POST only) | ~64 KB      | 97%+            |
| `fetch` + `keepalive`  | Good (unreliable on mobile Safari `visibilitychange`) | Yes | ~64 KB | 95%+ |
| `fetch` (plain)        | Poor on unload           | Yes            | Unlimited   | 99%+            |

#### Queue & Flush Behavior

Events are queued in memory (no localStorage — per the artifact constraints and to avoid persistence of tracking data). The queue flushes in three scenarios:

1. **`visibilitychange` → `hidden`**: user switches tab, minimizes, or navigates away. This is the most reliable exit signal across all browsers including mobile.
2. **30-second interval**: ensures data arrives even for long-lived sessions without interaction.
3. **Queue size ≥ 10**: prevents memory buildup on high-interaction pages.

Each flush serializes the queue as JSON, sends via sendBeacon to `/api/track`, and clears the queue. If sendBeacon returns `false`, falls back to fetch.

```ts
// packages/ui/src/tracker.ts

const ENDPOINT = "/api/track";
const FLUSH_INTERVAL_MS = 30_000;
const MAX_QUEUE_SIZE = 10;

interface TrackEvent {
  event_name: string;
  event_id: string;
  source_url: string;
  referrer?: string;
  custom_data?: Record<string, unknown>;
  timestamp: number;
}

let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;
let sessionStart = 0;

// ── Consent ────────────────────────────────────────────────────────

function hasConsent(): boolean {
  return document.cookie.includes("tracking_consent=granted");
}

// ── Transport ──────────────────────────────────────────────────────

function send(payload: string): void {
  // Primary: sendBeacon (fire-and-forget, survives page exit)
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  // Fallback: fetch + keepalive. Network errors surface asynchronously,
  // so a try/catch around fetch() is useless — swallow via .catch().
  // Analytics must never throw.
  fetch(ENDPOINT, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

// ── Queue & Flush ──────────────────────────────────────────────────

function flush(): void {
  if (queue.length === 0 || !hasConsent()) return;

  const payload = JSON.stringify({ events: queue });
  queue = [];
  send(payload);
}

function enqueue(event: TrackEvent): void {
  if (!hasConsent()) return;
  queue.push(event);
  if (queue.length >= MAX_QUEUE_SIZE) flush();
}

// ── Event Helpers ──────────────────────────────────────────────────

function makeEvent(
  name: string,
  customData?: Record<string, unknown>
): TrackEvent {
  return {
    event_name: name,
    event_id: crypto.randomUUID(),
    source_url: location.href,
    referrer: document.referrer || undefined,
    custom_data: customData,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

// ── Scroll Depth ───────────────────────────────────────────────────

let maxScroll = 0;
const SCROLL_MILESTONES = [25, 50, 75, 90];
const firedMilestones = new Set<number>();

function onScroll(): void {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;

  const pct = Math.round((scrollTop / docHeight) * 100);
  if (pct > maxScroll) maxScroll = pct;

  for (const milestone of SCROLL_MILESTONES) {
    if (pct >= milestone && !firedMilestones.has(milestone)) {
      firedMilestones.add(milestone);
      enqueue(makeEvent("scroll_depth", { depth: milestone }));
    }
  }
}

// ── Page Exit (time on page) ───────────────────────────────────────

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    const timeOnPage = Math.round((Date.now() - sessionStart) / 1000);
    enqueue(
      makeEvent("page_exit", {
        time_on_page_seconds: timeOnPage,
        max_scroll_depth: maxScroll,
      })
    );
    flush(); // Flush immediately — this is the last chance
  }
}

// ── Public API ─────────────────────────────────────────────────────

export function init(
  eventName: string = "ViewContent",
  customData?: Record<string, unknown>
): void {
  if (initialized) return;
  initialized = true;
  sessionStart = Date.now();

  if (!hasConsent()) {
    // First-visit case: the ConsentBanner is showing on this page.
    // Without this listener, a user who accepts moments after load
    // would never be tracked (init already ran and bailed). The banner
    // dispatches this event right after setting the consent cookie.
    document.addEventListener(
      "tracking-consent-granted",
      () => start(eventName, customData),
      { once: true }
    );
    return;
  }

  start(eventName, customData);
}

function start(
  eventName: string,
  customData?: Record<string, unknown>
): void {
  // Fire initial page view event
  enqueue(makeEvent(eventName, customData));

  // Scroll depth tracking (passive for performance)
  window.addEventListener("scroll", onScroll, { passive: true });

  // Page exit tracking — visibilitychange is the most reliable
  // signal across all browsers including mobile
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Periodic flush for long sessions
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function track(
  eventName: string,
  customData?: Record<string, unknown>
): void {
  enqueue(makeEvent(eventName, customData));
}

export function destroy(): void {
  if (flushTimer) clearInterval(flushTimer);
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  flush();
  initialized = false;
}
```

### 11.4 Tracking Provider (React Island)

The React component is a thin wrapper that calls `init()` on mount and `destroy()` on unmount. It also exposes `track()` globally on `window` so non-React parts of the site (plain `<a>` onclick handlers, Astro components) can fire custom events.

```tsx
// packages/ui/src/TrackingProvider.tsx
import { useEffect } from "react";
import { init, destroy, track } from "./tracker";

interface Props {
  sourceUrl: string;
  eventName?: string;
  customData?: Record<string, unknown>;
}

export default function TrackingProvider({
  eventName = "ViewContent",
  customData,
}: Props) {
  useEffect(() => {
    init(eventName, customData);

    // Expose track() globally for non-React usage
    // e.g. <button onclick="window.__track('cta_click', {id: 'hero'})">
    (window as any).__track = track;

    return () => {
      destroy();
      delete (window as any).__track;
    };
  }, []);

  return null;
}
```

### 11.5 Layout Integration

```astro
---
// src/layouts/Base.astro
import ConsentBanner from "@marketing/ui/ConsentBanner";
import TrackingProvider from "@marketing/ui/TrackingProvider";

interface Props {
  title: string;
  description: string;
  eventName?: string;
  customData?: Record<string, unknown>;
}

const { title, description, eventName, customData } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
    <ConsentBanner client:load />
    <TrackingProvider
      client:load
      sourceUrl={Astro.url.href}
      eventName={eventName}
      customData={customData}
    />
  </body>
</html>
```

Usage in a post layout to fire a content-specific event:

```astro
---
// src/layouts/PostLayout.astro
import Base from "./Base.astro";
const { frontmatter } = Astro.props;
---

<Base
  title={frontmatter.title}
  description={frontmatter.description}
  eventName={frontmatter.metaEvent}
  customData={{
    content_name: frontmatter.title,
    content_category: frontmatter.tags?.[0],
  }}
>
  <article>
    <slot />
  </article>
</Base>
```

Usage for custom events from any HTML element:

```html
<!-- No React needed — tracker exposes window.__track -->
<button onclick="window.__track('newsletter_signup', { location: 'footer' })">
  Subscribe
</button>
```

---

## 12. Security Considerations

**Access Token Protection.** `META_ACCESS_TOKEN` is stored as a Cloudflare Worker secret, never in source code or environment variables visible in `wrangler.jsonc`. Rotated quarterly.

**Database Credentials.** Neon connection string is managed via Hyperdrive binding — the raw connection string is never exposed in Worker code or environment variables. Hyperdrive handles connection pooling and TLS.

**PII Hashing.** All personally identifiable information (email, phone) is normalized (trimmed, lowercased) and SHA-256 hashed using the Web Crypto API before being included in the CAPI payload. Plaintext PII never leaves the Worker. The analytics table in Neon stores no PII — only anonymized signals like country, device type, and bot score.

**Cookie Security.** `_fbp` and `_fbc` are HttpOnly (no JavaScript access), Secure (HTTPS only), and SameSite=Lax (CSRF protection). They contain no PII — only opaque identifiers.

**Rate Limiting.** The `/api/track` endpoint is protected by Cloudflare's rate limiting rules (60 requests/minute per IP) to prevent abuse and database saturation.

**Bot Filtering.** Double-gated: Cloudflare SBFM/Bot Management blocks or challenges likely bots at the edge before they reach the Worker. The Worker applies a secondary bot score check and records the score in Neon for ongoing data quality auditing.

**Input Validation.** All incoming event payloads are validated against a strict schema. Invalid event names, missing `event_id`, or malformed data are rejected with 400.

**CORS.** `/api/track` only accepts requests from the same origin. No CORS headers are set, preventing cross-origin abuse.

---

## 13. Testing Strategy

| Layer             | Scope                | What's Tested                                                                                                        |
|-------------------|----------------------|----------------------------------------------------------------------------------------------------------------------|
| Unit Tests        | `packages/tracking`  | SHA-256 correctness, cookie format validation, CAPI payload structure, consent gating, bot score extraction, UA parsing, UTM extraction, batch event serialization |
| Unit Tests        | `packages/ui`        | `tracker.ts`: queue accumulates events, flush sends via sendBeacon, fallback to fetch when sendBeacon returns false, consent check prevents enqueue, scroll milestones fire at correct thresholds, `page_exit` includes time-on-page and max scroll |
| Integration Tests | `apps/web`           | Middleware sets cookies on landing (with `run_worker_first` enabled), `/api/track` dual-writes batch to Neon (test DB) and Meta (mocked), bot filtering drops low-score requests, malformed/oversized payloads get 400, analytics-only events (`scroll_depth`, `page_exit`) are never relayed to Meta, out-of-range timestamps are clamped |
| Content Tests     | `apps/web`           | All markdown files pass schema validation, no broken internal links, drafts excluded from build                      |
| Analytics Tests   | `packages/tracking`  | `writeAnalyticsEvent` inserts correctly, `ON CONFLICT` idempotency works, hypertable chunk pruning confirmed via `EXPLAIN`, continuous aggregate refreshes without error, compression policy compresses chunks older than 30 days |
| Bot Tests         | `packages/tracking`  | `extractBotInfo` handles Enterprise (granular score), Pro/Business (SBFM fallback), and missing `cf` gracefully      |
| E2E Tests         | CI                   | Playwright: consent banner appears, accepting fires tracking event *on the same page without reload* (via `tracking-consent-granted` event), declining prevents all events, scroll depth events fire on programmatic scroll, `page_exit` fires on navigation |
| Meta Validation   | Post-deploy          | Use Meta Events Manager Test Events tool to verify batched events arrive with correct parameters and EMQ score       |
| Data Quality      | Scheduled            | Weekly SQL: no `bot_score < 30` rows, event_id uniqueness holds, no PII in any column, `scroll_depth` and `page_exit` events present |

---

## 14. Open Questions & Future Considerations

- **Proxied Pixel upgrade (Option C):** The current CAPI-only approach is documented in Section 4.6 alongside a fully specified upgrade path to a proxied Pixel + CAPI hybrid. Monitor the decision triggers in the Section 4.6 table (ad spend > $2k/mo, EMQ < 6.5, audience match rate < 40%) monthly. When any threshold is crossed, the proxy Worker sketch and deduplication pattern are ready to implement. Consider starting with a non-proxied consent-gated Pixel (Option B) as a simpler intermediate step before committing to the proxy.
- **MDX support:** Should posts support `.mdx` for embedded interactive components (React islands within content)? The Astro MDX integration is already included in the config.
- **Offline conversions:** Meta deprecated the Offline Conversions API in May 2025. All offline events now flow through the standard CAPI with `action_source` set to `"physical_store"`. Relevant if the business has offline touchpoints.
- **Advanced matching:** The current implementation sends hashed email/phone only on form submissions. Consider collecting additional matching parameters (`external_id`, `country`, `zip`) to improve EMQ scores for top-of-funnel events. This becomes especially important if remaining on CAPI-only — every additional matching parameter helps close the gap vs. hybrid Pixel + CAPI.
- **Turborepo Remote Cache:** Evaluate Vercel Remote Cache vs. self-hosted (e.g., ducktape or custom R2-backed cache) for CI environments.
- **Content preview:** Implement a draft preview mode using Astro's server-side rendering for content authors to preview unpublished posts without triggering a build.
- **`fetchLater()` API:** Chrome is trialing `fetchLater()` which guarantees delivery even after page close, with a built-in `activateAfter` timeout. Once it reaches baseline browser support, it could replace the `sendBeacon` + `visibilitychange` pattern in `tracker.ts` with a single call. Monitor via [Chrome Status](https://chromestatus.com).
- **Tracker: engagement scoring:** The tracker currently captures scroll depth milestones and time-on-page. Consider adding a composite "engagement score" (weighted combination of scroll depth, time, and interaction events) computed client-side and sent as a custom_data field, useful for content quality ranking.
- **Analytics dashboard:** Start with Cloudflare WA as the visual dashboard. When richer questions arise (funnel analysis, per-post conversions), connect Grafana or Metabase to Neon, or build a password-protected Astro page with Recharts. The continuous aggregate (`analytics_daily`) provides pre-computed rollups that dashboard tools can query directly.
- **Enterprise Bot Management upgrade path:** If traffic grows and bot sophistication increases, upgrade from SBFM to Enterprise Bot Management for per-request ML scoring with `request.cf.botManagement.score` available in Workers. The Worker code already handles both paths via `extractBotInfo()`.
- **Neon scaling:** The free tier supports 0.5 GB storage and 190 compute hours. With TimescaleDB compression (90%+ reduction on chunks older than 30 days), the effective capacity is ~5 GB of raw analytics data — roughly 25M events, which is several years of headroom for a marketing site. Monitor compression stats via `hypertable_compression_stats('analytics_events')` and storage usage in the Neon dashboard. The pg_cron retention job (Section 5.3) deletes raw events older than 1 year while keeping continuous aggregates forever.
- **HLL for unique visitors:** When daily event volume exceeds 50k, add the `hll` extension and an HLL column to `analytics_daily` for sub-millisecond approximate `COUNT(DISTINCT)`. This avoids expensive exact distinct counts at scale.
- **pg_mooncake upgrade path:** If analytics query complexity grows beyond what TimescaleDB handles well (e.g., ad-hoc joins across tens of millions of rows, complex window functions over full history), consider migrating the analytics table to pg_mooncake's columnstore format with DuckDB execution. Currently requires BYO object storage bucket on Neon — monitor Neon's roadmap for native bucket support.
