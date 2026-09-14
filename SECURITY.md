# Security Policy & Threat Model (summary)

Full model: `docs/security/threat-model.md`.

## Reporting

Email security@foryxo.com. We aim to acknowledge within 2 business days. Please do not test
against production beyond what a responsible disclosure allows.

## Baseline controls implemented

- **Headers:** CSP (script/style/connect/frame sources pinned; dev-only unsafe-eval), HSTS,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors 'none'.
  See `next.config.ts`.
- **Auth:** passwordless OTP (email + phone via adapter), Google OAuth, session listing/revocation,
  security-event logging, OTP throttling (Redis or in-memory dev fallback), dev OTP pinned to
  console and never enabled in production.
- **Authorization:** server-side guards on every dashboard/admin page and API route; role from the
  DB, never from the client; business-scoped queries filter by membership.
- **Money safety:** integer-only ledger, idempotency keys, server-to-server payment verification
  with amount matching, no debit before quote approval, append-only audit log.
- **Uploads:** MIME allowlist + extension check, size caps, sanitized filenames, EXIF stripping
  pipeline, local/S3 adapter boundary; images served from `/api/media/*` with content types pinned.
- **Input handling:** Zod validation on every route handler; Persian/Arabic digit normalization on
  user input; free-text notes sanitized (no HTML) with length caps.
- **Rate limiting:** login/OTP/contact endpoints throttled (Redis or in-memory fallback).

## Known limitations (documented honestly)

- CSP is nonce-less; `'unsafe-inline'` styles remain for Radix/theming until nonce infrastructure lands.
- Upload virus scanning is an interface point, not a wired scanner — see `EXTERNAL_VERIFICATION_REQUIRED` in FINAL-AUDIT.md.
- Sessions are cookie-based; device fingerprinting is heuristic only.
