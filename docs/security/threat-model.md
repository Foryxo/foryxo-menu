# Threat Model (STRIDE-lite)

## Assets

- Money: service-credit ledger, payment records, invoices.
- Credentials: business accounts, admin account, OTP channels.
- Content: client menus, uploaded images, message templates.
- Reputation: live client menus must never serve attacker content.

## Actors

- Opportunistic attackers (credential stuffing, payment tampering).
- Malicious clients (chargeback/fraud, other clients' data access).
- Compromised consumer device (QR to attacker-in-the-middle).
- Insider (Foryxo staff) — bounded by audit log + least privilege.

## Surfaces & mitigations

| Surface | Threat | Mitigation |
| --- | --- | --- |
| `/api/payments/callback` | Forged completion | Server-to-server verify + amount match; idempotent ledger keys; reconciliation re-check |
| Ledger | Double-spend | Append-only + unique idempotency keys; derived balances |
| Auth | OTP brute force | Per-identifier+IP throttle (Redis), single-use short-lived codes, dev OTP off in prod |
| Uploads | Malicious files | MIME allowlist, size caps, sanitized names, EXIF strip, no-exec storage, content-type pinned on serve |
| Admin | Privilege escalation | Role from DB server-side; audit log on every action; no client-trusted roles |
| Cross-client | IDOR | Every query business-scoped by membership; slugs validated; reserved slugs blocked |
| Free-text notes | XSS/stored abuse | sanitizeNote (no HTML), length caps, no HTML rendering anywhere |
| Session theft | Account takeover | Session listing/revocation, security events, optional TOTP |
| SEO spam | Fake reviews | No testimonial seeding; demo data labeled `isDemo` |

## Open items (honest)

- CSP nonce infrastructure (styles currently `'unsafe-inline'`).
- Upload AV scanning wired to a real scanner (interface exists).
- DDoS: dependent on edge provider (Cloudflare) — application-layer limits exist at the app.
- Rate limits use in-memory fallback without Redis → single-instance only; production requires REDIS_URL.
