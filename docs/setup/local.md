# Local Development

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- Optional: Redis (falls back to in-memory dev queue/limiter when absent)
- Optional: PostgreSQL (PGLite embedded DB is the dev default — zero setup)

## Quickstart

```bash
npm install
cp .env.example .env.local   # defaults are dev-safe: PGLite, console email/SMS, mock payments
npm run db:migrate           # applies Drizzle migrations (PGLite)
npm run db:seed              # price catalog + 60 message templates + 10 demo menus + dev accounts
npm run dev                  # http://localhost:3000 → redirects to /fa
```

Dev accounts (with `AUTH_DEV_OTP=true`, the default): sign in at `/fa/login` with
`admin@dev.local` (superadmin), `cafe@dev.local` (business), `guest@dev.local` (consumer) —
the OTP code is printed in the server console.

## What runs without credentials

| Capability | Dev behavior without credentials |
| --- | --- |
| Email | `EMAIL_PROVIDER=console` prints rendered emails to the server console |
| SMS/OTP | `SMS_PROVIDER=console` prints codes to console; `AUTH_DEV_OTP=true` allows dev sign-in |
| Payments | `mockPayments` flag serves a local mock gateway page; ZarinPal/YekPay adapters activate only with credentials |
| Storage | `STORAGE_PROVIDER=local` writes to `./.data/uploads`, served via `/api/media/*` |
| Queue/Redis | Without `REDIS_URL`, jobs run through an in-memory queue with the same interface |
| Database | PGLite at `DATA_DIR` — no Postgres install needed |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build + serve |
| `npm run typecheck` | Strict TS check |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke (auto-starts dev server) |
| `npm run test:a11y` | axe WCAG checks on key pages |
| `npm run seo:audit` | Sitemap/canonical/robots sanity check |
| `npm run db:migrate` / `db:seed` / `db:reset` | Schema apply / seed data / wipe |
| `npm run db:studio` | Drizzle Studio against the schema |

## Tips

- Menus are at `/menus/{slug}/menu` — try `/menus/mora/menu` (café), `/menus/khesht/menu` (Persian restaurant, RTL), `/menus/district/menu` (full ordering + custom request demo).
- Toggle theme (light/dark/system) from the header; it persists and respects system.
- Persian digits are display-only; all inputs normalize via `toAsciiDigits` before validation.
