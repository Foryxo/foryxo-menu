# Payment Reconciliation

Why: networks fail mid-flow. A customer can pay at the gateway and never return, or a callback
can be lost. Money correctness must not depend on the happy path.

## What runs

`src/domains/payments/index.ts` exposes `reconcilePendingPayments()` (wired to the queue as a
recurring job; also safe to run manually via a script):

1. Select payments in `init`/`redirected` older than the confirmation window.
2. Ask the provider for the authoritative status (server-to-server verify — the same code path
   as the callback, so there is exactly one verification implementation).
3. Outcomes:
   - **Paid at gateway, not settled here** → settle now (idempotent ledger credit), email receipt.
   - **Failed/expired** → mark `failed`, release any reserved invoice link.
   - **Still ambiguous** → leave open, raise `payment_verify_issue` event for finance review.
4. Every transition writes an audit log row with before/after state.

## Invariants checked

- Sum of ledger credits per payment == verified provider amount (integer IRT).
- No ledger credit exists without a verified payment row (orphan check).
- No double credit: idempotency keys `provider:{authority|ref}` are unique — a replay verify
  returns the original result instead of re-crediting.

## Schedule

Every 15 minutes in production (BullMQ repeatable job). Alerting: Sentry capture + admin
security page lists failures older than 1 hour.

## Manual run

```bash
npx tsx -e "import('./src/domains/payments/index.js').then(m => m.reconcilePendingPayments())"
```

(Dev DB driver resolves automatically; production must set DATABASE_URL explicitly.)
