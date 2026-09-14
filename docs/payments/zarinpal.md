# ZarinPal Integration (Iranian billing)

Primary gateway for Foryxo service payments in IRT (Toman).

## Flow (implemented in `src/domains/payments/zarinpal.ts`)

1. **Request** — `POST https://api.zarinpal.com/pg/v4/payment/request.json`
   with `merchant_id`, `amount` (Rial on the wire — the adapter converts from IRT ×10),
   `callback_url` = `{APP_URL}/api/payments/callback?provider=zarinpal`, `description`.
2. We store the payment row (`init` → `redirected`) with our own `authority`-pending record
   **before** redirecting the user to `https://payment.zarinpal.com/pg/StartPay/{authority}`.
3. **Callback** — ZarinPal redirects to our callback with `Authority` + `Status`.
   We **never trust the redirect**; we call
   `POST /pg/v4/payment/verify.json` server-to-server with `amount`, `authority`.
4. **Amount matching** — the verified amount must equal our stored record exactly; mismatch
   marks the payment `failed` and raises a reconciliation event (double-payment protection).
5. On verified: ledger credit (idempotency key = `zarinpal:{authority}`), invoice marked paid,
   audit log entry, email receipt.

## Activation

Set `ZARINPAL_MERCHANT_ID` and `ZARINPAL_SANDBOX=false` (sandbox uses
`https://sandbox.zarinpal.com` + the sandbox panel merchant). The `zarinpal` feature flag
turns on automatically when the merchant ID exists; otherwise the mock gateway serves.

## Failure handling

- User cancels / `Status=NOK` → payment row `failed`, invoice stays unpaid, user can retry.
- Verify error codes are mapped to messages; unknown codes → `payment_verify_issue` template.
- Unsettled `redirected` payments older than 24h are re-checked by the reconciliation job
  (`docs/payments/reconciliation.md`).

## EXTERNAL_VERIFICATION_REQUIRED

Real settlement behavior, disputed-transaction flow, and reversal timelines require a live
merchant account — verified only with production credentials and a real transaction.
