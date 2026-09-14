# Refunds

Workflow state machine: `requested → approved | rejected → processing → completed`.

## Who can request

- The client, from Dashboard → Wallet (against a paid invoice or top-up), or
- Admin, on the client's behalf (e.g. duplicate payment detection).

## Process

1. **Request** — client states reason + target invoice/payment. Status `requested`; template
   `refund_requested` acknowledges.
2. **Admin decision** (Admin → Payments → refund decision UI):
   - **Approve** → `processing`; template `refund_approved`.
   - **Reject** → closed with reason; template `refund_rejected`.
3. **Processing:**
   - **Gateway payments** — refund is submitted through the provider (ZarinPal/YekPay);
     bank/settlement timing is the provider's — we never promise a settlement date, only that
     Foryxo reviews within 24 business hours (spec rule 20).
   - **Wallet/credit payments** — reversing ledger entries (`refund:{id}` idempotency key);
     balance restored immediately.
4. **Completion** — `completed` on provider confirmation; template `refund_completed`; audit row.

## States and money

- No credit leaves the ledger until admin approval (no auto-debit).
- Gateway refunds never touch the credit ledger; credit refunds never leave the ledger.
- Duplicate payments found by reconciliation auto-create a refund request for review.

## Related

`docs/wallet-service-credit.md` (ledger invariants) · `docs/payments/reconciliation.md`
(duplicate detection) · Admin → Security (operations view).
