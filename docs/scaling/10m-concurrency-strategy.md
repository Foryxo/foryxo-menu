# Scaling Strategy — 10M Concurrent Menu Views

A scaling **target**, not a local benchmark claim (spec rule 24). This is the architecture that
makes it reachable; numbers below are planning math, not measured results.

## Characterize the load

Menu viewing is: anonymous, read-only, ~1 read-model row per request, no writes, no session
lookup. This is the ideal CDN workload. The write path (admin/edit/checkout) is tiny by
comparison and can be treated as a separate service class.

## Read path (hot path)

1. **Edge/CDN cache** (Cloudflare) — `/menus/*` HTML cached publicly; publish is the only
   invalidation (immutable read model + content hash). At 10M concurrent, >95% of requests
   never reach the app.
2. **App tier (stateless)** — horizontal autoscale; each server holds no per-menu state.
   Render = 1 DB fetch + template. A single Node instance sustains thousands RPS for this profile.
3. **Postgres** — only touched on cache miss (~few %); read replicas absorb miss traffic.
4. **Redis** — rate limiting/OTP/cart presence; never on the menu-view critical path.

## Capacity math (planning)

- 10M concurrent viewers ≈ 100–300k req/s sustained (page + assets, CDN-absorbed).
- Origin needs to serve only miss traffic: at 97% hit rate ≈ 3–9k RPS → a handful of app
  instances + 1 primary + 2 replicas is a sane starting fleet.
- Assets: static chunks on `/_next/static/*` with immutable headers — pure CDN.

## What we would add before that scale

- Per-menu stale-while-revalidate at the edge (Cloudflare cache rules).
- Menu HTML split: shell from edge, dynamic bits (order state) via islands/edge workers.
- Postgres: partitioning/ARCHIVE of analytics events; menu analytics aggregated async (BullMQ).

## Honest constraints

- Uploads/checkout flows are not part of the 10M-concurrency claim; they scale separately.
- Real load tests (`load-tests/menu-browsing.js` k6 script) against production-like
  infrastructure are required before making any public performance claim.
- Multi-region Postgres failover is a Day-2 concern documented in DR; menus tolerate region
  loss via edge cache while traffic degrades to cache-only mode.
