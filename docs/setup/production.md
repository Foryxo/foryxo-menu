# Production Setup

## 1. Environment

Start from `.env.example`. Production requirements:

```bash
NODE_ENV=production
APP_URL=https://menu.foryxo.com
AUTH_URL=https://menu.foryxo.com
AUTH_SECRET=<openssl rand -hex 32>
DB_DRIVER=postgres
DATABASE_URL=postgres://user:pass@host:5432/foryxo_menu
REDIS_URL=redis://<host>:6379          # required in prod: rate limits + durable queues
FEATURE_FLAGS=                         # start minimal; enable explicitly per capability
AUTH_DEV_OTP=false                     # MUST be false in production
ZARINPAL_MERCHANT_ID=<from ZarinPal panel>
ZARINPAL_SANDBOX=false
# YekPay is disabled pending merchant onboarding and a verified WebGate integration.
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_BUCKET=foryxo-menu
S3_ACCESS_KEY_ID= / S3_SECRET_ACCESS_KEY=
EMAIL_PROVIDER=resend                    # transactional sender; verify foryxo.com in Resend first
RESEND_API_KEY=                          # secret, set on the server only
EMAIL_FROM="Foryxo <otp@foryxo.com>"
SMS_PROVIDER=kavenegar + SMS_KAVENEGAR_API_KEY=   # or SMS_GENERIC_URL/KEY
INDEXNOW_KEY=<random>
SENTRY_DSN=                            # optional error tracking
```

## 2. Database

```bash
npm run db:migrate          # against DATABASE_URL (postgres)
# Seed only staging. For production catalog:
FORCE_SEED=1 npm run db:seed   # seeds ONLY the price catalog + templates when forced; review before running
```

The seed script refuses to run in production without `FORCE_SEED=1` and never creates demo
businesses in production mode.

## 3. Verify before go-live

1. `npm run build && npm start` behind TLS — confirm headers via `curl -I`.
2. Place a 1 Toman (or minimum) sandbox payment end-to-end in ZarinPal sandbox first.
3. Confirm OTP delivery with real provider credentials — `EXTERNAL_VERIFICATION_REQUIRED`.
4. Confirm Redis connection (rate limiting + queues log fallback warnings otherwise).
5. Run `npm run seo:audit` against the production URL.
6. Create the first superadmin manually (insert into `user` with `role=superadmin`) or via a
   one-time setup command — do not rely on seeded dev accounts.

## 4. Backups

- Postgres: nightly `pg_dump` + WAL archiving (see `docs/operations/disaster-recovery.md`).
- R2 bucket: enable versioning; uploads are content-addressed.
- `.env`: stored in a secret manager, never in the repo.
