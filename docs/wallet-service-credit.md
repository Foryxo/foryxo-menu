# Wallet & Service Credit

`src/domains/wallet/ledger.ts` — the only code that writes ledger rows.

## Model

- `credit_accounts` — one per business; balance is **derived** (never stored mutated).
- `credit_ledger` — append-only. Each row: `account_id, delta (+/-), reason, ref_type/ref_id,
  idempotency_key (unique), created_at, actor`.

## Invariants

1. **Integer Toman only.** No floats anywhere in the ledger path.
2. **Append-only:** no UPDATE/DELETE on ledger rows, enforced by convention and code review
   (and safe even under concurrency — balances are recomputed).
3. **Idempotency:** every write carries `idempotency_key` (`zarinpal:{authority}`,
   `invoice:{id}`, `refund:{id}`). A replay returns the original result — never double-credit,
   never double-charge.
4. **Authorization before debit:** quote must be `approved` (client approval + funded balance or
   paid invoice) before any manual-work charge. No silent debits, ever (spec rule 18).
5. **Two-tier refunds:** gateway refunds go back through the gateway; credit refunds stay in the
   ledger (`refund:{id}` negative-entry reversal pairs).

## Flows

| Flow | Entries |
| --- | --- |
| Top-up (ZarinPal/YekPay verified) | `+amount` reason `topup`, key `provider:{ref}` |
| Invoice paid from credit | `−amount` reason `invoice`, key `invoice:{id}` |
| Quote charge after approval | `−amount` reason `quote`, key `quote:{id}` |
| Refund to credit | `+amount` reason `refund`, key `refund:{id}` |
| Admin adjustment | `±amount` reason `admin_adjustment`, audited with actor |

Every transition is audit-logged with actor and before/after balance.

## Why not Redis

Redis is used for rate limits/OTP throttle/queues only. Financial truth lives in Postgres with
transactions; the ledger survives Redis loss with zero inconsistency.
