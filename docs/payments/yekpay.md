# YekPay international payments — not activated

The former `APP_ID`/`APP_SECRET` adapter used endpoints and fields that do not match
YekPay's published [WebGate documentation](https://docs.yekpay.com/). It has been
removed. Setting legacy environment variables cannot enable payments.

Before enabling international checkout:

1. Complete YekPay merchant onboarding and obtain the required merchant ID and
   supported settlement currency; confirm contractual access to refunds.
2. Capture the payer name, country, city, address, postal code, email, and phone
   fields required by the documented request contract, with an appropriate privacy notice.
3. Implement request, hosted redirect, and server-to-server verify using the current
   documented WebGate API. Store the provider reference and verify the exact amount,
   currency, and order before changing an invoice or wallet balance.
4. Test successful, failed, cancelled, duplicate, and delayed callbacks with a real
   merchant account; reconcile against provider records before launch.

Until then the production checkout returns `payment_provider_unavailable` if no
configured, supported gateway is present. Never use mock payments in production.
