# Contributing

## Setup

```bash
npm install
cp .env.example .env.local   # dev defaults work out of the box (PGLite, console email/SMS)
npm run db:migrate
npm run db:seed
npm run dev
```

## Rules

1. **TypeScript strict, zero errors.** `npm run typecheck` must pass.
2. **Money is integer Toman.** Never float, never Rial/Toman inference — see `docs/wallet-service-credit.md`.
3. **Locale-first:** every user-facing string goes through the dictionaries; new UI ships in `fa` and `en` together.
4. **RTL:** use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start/end`); no hard-coded left/right.
5. **Boundaries:** see ARCHITECTURE §10 — payments/wallet only write money rows; guards only resolve roles.
6. **Tests:** pure logic gets unit tests (`tests/unit`); user flows get Playwright specs (`tests/e2e`).
7. **No fake data in production paths:** demo content is labeled, `isDemo: true`, and never presented as testimonials.
8. **Commits:** conventional, concise, focused; CI must be green (typecheck → unit → build).

## Before opening a PR

```bash
npm run typecheck && npm test && npm run build
```
