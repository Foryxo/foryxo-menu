# Foryxo Menu

> Foryxo Menu — منوی دیجیتال حرفه‌ای برای کافه‌ها و رستوران‌ها
> Professional bilingual digital menus: browse 10 menu designs, configure,
> submit content, approve a quote, pay, and go live at `menu.foryxo.com/menus/{slug}/menu`.

## Public project page

[Project overview](https://foryxo.github.io/foryxo-menu/) is built separately from the Next.js application. GitHub Actions publishes only the four public files in `site/`; it does not publish the documentation directory or attempt to run the application on GitHub Pages. The application at `menu.foryxo.com` is temporarily unavailable while its origin server is unreachable.

Build the overview with `node scripts/build-pages.mjs`. Deploying the full application requires a successful `npm run build`, a Node.js host, database access and its server-side configuration.

## Quick start (development)

Prerequisites: Node.js 20.9+ (tested on 22/25), npm 10+.

```bash
npm install
cp .env.example .env.local        # defaults work out of the box
npm run db:migrate                # creates PGLite database in .data/
npm run db:seed                   # seeds pricing, demos, templates, dev users
npm run dev                       # http://localhost:3000
```

The development database is **PGLite** (embedded Postgres) — no Docker required.
Set `DB_DRIVER=postgres` + `DATABASE_URL` for a real Postgres instance.

### Development credentials (seeded, dev-only)

| Role | Login | How |
| --- | --- | --- |
| Super admin | `admin@dev.local` | Email OTP — code printed to the server console |
| Business customer | `cafe@dev.local` | Email OTP — code printed to the server console |
| Consumer | `guest@dev.local` | Email OTP — code printed to the server console |

`AUTH_DEV_OTP=true` (default in dev) prints random six-digit codes to the
server console. Production ignores this shortcut and requires real delivery.

### Production sign-in delivery

The sign-in form only offers channels with complete server-side credentials.
Cloudflare Email Routing forwards incoming mail; it does **not** send OTPs.
For outbound email, [verify `foryxo.com` in Resend](https://resend.com/docs/dashboard/domains/introduction), add its required DNS records in Cloudflare, then create a sending API key. Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM="Foryxo <otp@foryxo.com>"` in the production server environment. Never commit the key. Resend accepts the message for delivery; a real inbox test is still required before enabling sign-in for customers. Cloudflare Email Routing remains separate and handles incoming mail only.

For Iranian SMS, provision a Kavenegar API key and a `foryxo-otp` verification template, then set `SMS_PROVIDER=kavenegar` and `SMS_KAVENEGAR_API_KEY`. The app checks both HTTP and Kavenegar application status; missing credentials do not fall back to console delivery in production. WhatsApp and Telegram sign-in are still unavailable without official provider/bot setup.

## Commands

```bash
npm run dev          # start dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest unit tests
npm run test:e2e     # playwright E2E
npm run test:a11y    # axe accessibility E2E
npm run seo:audit    # structural SEO checks
npm run db:migrate   # apply migrations (PGLite or Postgres)
npm run db:seed      # seed catalog/demos/templates (dev only)
npm run db:reset     # wipe local PGLite data
npm run load:test    # k6 anonymous menu browsing
```

## URLs

- Site: `/fa` (default, RTL) · `/en` (LTR)
- Demos: `/fa/demos` … `/menus/mora/menu` etc. (10 live demo menus)
- Builder: `/fa/build` (10-step configurator)
- Dashboard: `/fa/dashboard` (business customers)
- Admin: `/fa/admin` (super admin)
- Client menus: `/menus/{slug}/menu` — e.g. `/menus/aria/menu`

## Documentation

- `docs/ARCHITECTURE.md` — system design & module boundaries
- `docs/security/threat-model.md` — assets, actors, mitigations
- `docs/scaling/10m-concurrency-strategy.md` — capacity path to millions
- `docs/payments/zarinpal.md` / `docs/payments/yekpay.md` — provider setup
- `docs/wallet-service-credit.md` — ledger rules
- `docs/FINAL-AUDIT.md` — verified status per area
- `docs/setup/local.md`, `docs/setup/production.md` — environments

## Feature flags

All external integrations default OFF until credentials exist (see `.env.example`):
`zarinpal`, `yekpay`, Google OAuth, SMS provider, WhatsApp/Telegram auth
(require official Business APIs — never free and never scraped).

## Status of external integrations

Anything requiring real provider credentials is documented as
`EXTERNAL_VERIFICATION_REQUIRED` in `docs/FINAL-AUDIT.md` — the app runs
fully in sandbox/mock mode without them.
