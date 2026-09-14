# Auth Providers

Implemented with Better Auth 1.7 (`src/domains/auth/`). All providers are adapter-based; adding
one never touches calling code.

## Email OTP (enabled)

Passwordless: enter email → 6-digit code → verified session. Dev mode logs the code to the
console (`AUTH_DEV_OTP=true`, disabled automatically when `NODE_ENV=production`). Codes are
single-use, short-lived, and throttled per identifier + IP.

## Phone OTP — Iranian numbers (enabled with an SMS provider)

- Numbers are normalized to E.164 `+989…` (`normalizeIranPhone`) before dispatch; Persian/Arabic
  digits accepted as input.
- `SmsProvider` interface (`src/domains/auth/sms.ts`):
  - `console` (default) — logs the SMS, works offline
  - `kavenegar` — official Kavenegar Verify API (`SMS_KAVENEGAR_API_KEY`)
  - `generic` — any provider with an HTTP GET/POST template (`SMS_GENERIC_URL/KEY`)
- Never hardcode a single vendor into business logic — the interface is the seam.

## Google OAuth (enabled with credentials)

Standard Better Auth social provider; needs `GOOGLE_CLIENT_ID/SECRET` with the redirect URI
`{AUTH_URL}/api/auth/callback/google`. The login UI only shows the button when the flag is on.

## WhatsApp / Telegram (flagged OFF by design)

- **WhatsApp:** implemented only through an official WhatsApp Business provider API when
  credentials exist (`whatsappAuth` flag). OTP via WhatsApp is a paid, per-message channel —
  never claimed free, never via WhatsApp Web scraping or personal-account automation.
- **Telegram:** no free arbitrary-user SMS-style OTP API exists; a compliant Telegram Login
  Widget flow may be added behind `telegramAuth` when configured. We never ask for a user's
  Telegram password.

## Account linking & lifecycle

- One user per normalized email; phone is a credential on the same identity, not a second account.
- Email/phone change requires verification of the new value before it replaces the old.
- Sessions are listed and revocable per-device from Dashboard → Security; TOTP 2FA is provided
  by Better Auth's 2FA plugin surface (enable per policy) — flagged in FINAL-AUDIT as optional.
- Security events (failed OTP bursts, new-device sign-ins) are recorded and visible in Admin → Security.
