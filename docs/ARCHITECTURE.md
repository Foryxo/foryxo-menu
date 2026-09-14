# Foryxo Menu — Architecture

**Domain:** `menu.foryxo.com` · **Locales:** `fa` (RTL, first-class), `en` (LTR) · **Menu URL:** `/menus/{slug}/menu`

## 1. System shape

Foryxo Menu is a **modular monolith**: a single Next.js 16 application with strict internal
domain boundaries under `src/domains/*`. Every boundary is a candidate for later extraction;
none of them cross-import each other's internals. The rule of thumb enforced in review:

- `domains/x` may import from `config`, `lib`, `db`, and explicitly exported modules of other domains.
- App routes (`src/app/**`) are thin: auth guard → domain data function → presentational component.
- Pure logic (pricing, normalization, formatting, cart math) lives in dependency-free modules and
  is unit-tested without a database.

```text
src/
  app/                    App Router routes (thin controllers)
    [locale]/             Public site, build, login, dashboard, admin (fa|en)
    menus/[slug]/         Live customer menus (data-driven, no per-client code)
    api/                  Route handlers: auth, payments, wallet, uploads, admin actions
    indexnow-key/[key]/   IndexNow verification
    llms.txt/             AEO surface
  components/             ui/ (design system) · site/ · dashboard/ · admin/ · menu/
  config/env.ts           Zod-validated environment + feature flags (server-only)
  content/                Demo menu definitions (10 demos) + feature catalog
  domains/
    i18n/                 Dictionaries, formatters, Persian normalization, locale config
    db/                   Drizzle schema + unified PGLite/Postgres client
    menu-engine/          Read-model builder, publisher, locale renderer
    pricing/              Estimate calculator + server-side cart pricing engine
    auth/                 Better Auth server/client, SMS OTP adapter, guards, security events
    payments/             Provider interface + ZarinPal/YekPay/mock adapters + reconciliation
    wallet/               Immutable credit ledger (idempotent double-entry)
    storage/              Local/S3(R2) adapter, signed uploads, MIME validation
    email/                Template rendering + queue (SMTP or console driver)
    jobs/                 Redis/BullMQ with in-memory dev fallback; drain workers
    seo/                  JSON-LD, hreflang/canonical, IndexNow
    audit/                Append-only audit log
    builder/              Builder configuration model + estimate binding
    dashboard/, admin/    Server data functions for panels
  lib/utils.ts            Shared pure helpers (slug, sanitize, clamp)
  middleware.ts           Locale routing + security
content/demos/            10 demo definitions (fa/en copy, image briefs, modifiers)
tests/unit, tests/e2e     Vitest units · Playwright smoke + axe a11y
scripts/                  db-migrate, db-seed, seo-audit
docs/                     This documentation set
```

## 2. Technology decisions

| Concern | Choice | Rationale |
| --- | --- | --- |
| Framework | Next.js 16.3 (App Router, Turbopack, async request APIs) | Current stable; RSC-first |
| UI | React 19 + Tailwind CSS 4 + custom design tokens | Own visual system; Radix primitives where interaction needs them |
| Language | TypeScript 5.9 strict | Type safety end-to-end |
| DB | PostgreSQL (prod) / PGLite (dev) via Drizzle 0.45 | Same SQL semantics in dev; typed schema |
| Cache/queue | Redis + BullMQ (in-memory fallback when `REDIS_URL` unset) | Rate limits, OTP throttle, durable jobs; never authoritative for money |
| Auth | Better Auth 1.7 + plugins (email OTP, phone OTP via SMS adapter, Google OAuth) | Passwordless, adapter-based providers |
| Payments | ZarinPal (IRR) + YekPay (international) behind one interface | Iranian billing + international fallback |
| Storage | Local FS dev / S3-compatible (R2) prod | Signed uploads, MIME + size validation |
| Fonts | Vazirmatn (fa) + Inter (en) via Fontsource | Licensed, self-hosted, subset |
| Animations | CSS + Swiper 14 only where meaningful; `prefers-reduced-motion` honored | No essential interaction depends on motion |

## 3. Money rules (non-negotiable)

1. **Integer Toman (IRT) everywhere.** No floats. Display formatting converts; storage never does.
2. **Ledger is append-only.** Balances are derived (`SUM`), never stored mutated.
3. **Every ledger write carries an `idempotencyKey`**; duplicate writes are rejected with the
   original result. Payment verification, top-ups, refunds and quote charges all funnel through
   `creditService` — no other code path touches ledger rows.
4. **No debit before quote approval.** Managed requests move: `requested → quoted → approved → in_progress → done`.
   Approval (client or paid invoice) precedes any charge.
5. **Payment state machine:** `init → redirected → verified → settled/failed`. Verification is
   server-to-server with amount checking against our own record (prevents callback tampering).
   Reconciliation job re-checks unsettled payments.

## 4. Menu engine

Menus are data, not code. One renderer serves `/menus/[slug]/menu` for every client.

- **Versioning:** `menus.draft_version_id` / `published_version_id` → `menu_versions` with an
  immutable `read_model` JSONB snapshot + `content_hash`. Publish = build read model, store, swap pointer.
- **Read model** contains categories, products (with bilingual fields, nutrition, allergens,
  badges), modifier groups/options, theme and locale metadata — enough to render with a single
  row fetch (fast, cacheable, edge-friendly).
- **Availability:** sold-out flags, hidden items, scheduled (daypart) categories, seasonal menus.
- **Locales:** per-menu `locales[]`; renderer picks `fa`/`en` per request; RTL applied via logical CSS.
- **Customization:** products may allow custom requests (free-text note + modifiers) — notes are
  sanitized (`sanitizeNote`), length-capped, never rendered as HTML, and travel with the order.
- **Ordering** (when enabled) recalculates all pricing server-side (`pricing/engine.ts`);
  client totals are display-only.

## 5. Auth & sessions

- Better Auth with **email OTP** (dev: code to console), **phone OTP** via the `SmsProvider`
  interface (console / Kavenegar / generic HTTP adapters), **Google OAuth** when credentials exist.
- WhatsApp/Telegram auth are **flagged off** and documented — enabled only with official provider
  credentials (never scraped/automation).
- Guards: `requireUser` / `requireAdmin` resolve session → user → role. Admin = `role=superadmin`.
- Security events (suspicious logins, OTP abuse) are recorded and surfaced in admin/security.
- Sessions are listed and revocable from the dashboard security page.

## 6. Localization

- Locale is a URL segment (`/fa`, `/en`); middleware redirects `/` → `/fa`.
- Dictionary type `Dictionary` is the contract; missing keys are a type error.
- `Intl` APIs for dates (Persian calendar for fa), numbers, currency; Persian digits via
  `toPersianDigits` for display, ASCII folding for search via `normalizePersian`.
- Phone normalization to E.164 `+98…` before OTP dispatch.
- RTL: CSS logical properties only; `dir` set at the `[locale]` layout level.

## 7. SEO / AEO / GEO

- Per-locale metadata, canonical + `hreflang` alternates on every public page.
- JSON-LD: Organization, WebSite (SearchAction), FAQPage, Restaurant/Menu on live menus.
- `sitemap.xml` includes all published menus; `robots.txt` blocks `/dashboard`, `/admin`, `/api`.
- `llms.txt` for answer engines; IndexNow keyed pings on menu publish.
- No fake testimonials/statistics anywhere in content.

## 8. Scaling notes (target: 10M concurrent menu views)

Menu viewing is the hot path and is deliberately boring:

1. **Single-row read model fetch** → immutable `content_hash` + `Cache-Control: public` (menus
   are public and anonymous) → CDN caches the rendered HTML; revalidation on publish.
2. **No session lookup** on menu routes; no DB writes while browsing; analytics aggregates async.
3. Stateless app tier → horizontal scale; Postgres only touched by admin/edit/checkout flows.
4. Redis for rate limiting/OTP/cart presence only — never on the menu-view critical path.
5. Full strategy: `docs/scaling/10m-concurrency-strategy.md`.

## 9. Deployment topologies

- **VPS:** Node (standalone output) + Nginx/Caddy TLS + managed Postgres + Redis. See
  `docs/deployment/vps.md`.
- **Cloudflare:** R2 storage, CDN caching for `/menus/*`, Turnstile where needed. See
  `docs/deployment/cloudflare.md`.

## 10. Boundaries to keep

- `payments` and `wallet` are the only writers of financial rows.
- `menu-engine/publish` is the only writer of published read models.
- `auth/guards` is the only session→role resolution point.
- `config/env` is server-only; client components receive flags via props.
