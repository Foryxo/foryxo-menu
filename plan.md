# Website Production Plan

## Summary

- Readiness: **10/20 complete** (10 present, 9 partial or missing, 1 currently not applicable).
- Critical gaps: the legal pages still require owner/counsel approval; production analytics is not collecting verified traffic; a verified public business address/contact identity is incomplete.
- Recommended focus: finish the legal/contact/analytics requirements, then complete provider-backed payment and document-scanning QA before accepting live customer money or untrusted documents.

## Phase 1: Critical (do before any traffic)

- [ ] **Privacy policy** — Replace the visible draft notice only after the text matches the real account, payment, upload, retention, refund, and support behavior. Add an approved effective date and change history.
- [ ] **Terms and conditions** — Obtain operational/legal approval for the bilingual terms, pricing, wallet, refund, service-delivery, and user-content clauses before treating them as binding.
- [ ] **Analytics** — Add a privacy-conscious production event writer or vetted analytics provider. Document retention and consent rules, exclude staff/test/bot traffic, and verify the admin report with known events.
- [ ] **Real contact identity** — Verify that the published `@foryxo.com` mailbox is monitored and add the legally required business/postal address for the markets served.
- [ ] **Form and transaction error states** — Finish authenticated QA for duplicate submissions, expired OTPs, rate limits, failed uploads, insufficient wallet funds, payment callback failures, refund conflicts, and offline retries in Persian and English.

## Phase 2: High-impact

- [ ] **Per-route metadata coverage** — Public sitemap pages pass the automated title/description/H1/alt audit. Add explicit, non-marketing titles/descriptions or `noindex` metadata to remaining private dashboards, exceptional states, and operational pages instead of relying on inherited defaults.
- [ ] **Thank-you journeys** — Add a focused contact confirmation route and clearer next steps after menu-request submission. Keep payment status pages `noindex` and prevent refreshes from repeating a transaction.
- [ ] **Sticky mobile conversion CTA** — Keep a direct “Build my menu” action available on narrow public pages without covering forms, menu content, the support FAB, or safe-area controls; respect reduced-motion settings.

## Phase 3: Polish & Optimization

- [ ] **Field-level form feedback** — Add precise validation, retry, and recovery copy where complex forms still show only a generic failure. Preserve focus and announce errors/success through accessible live regions.
- [ ] **Core Web Vitals monitoring** — Run Lighthouse and field monitoring on the final custom domain, especially mobile LCP/INP/CLS. The Pages artifact already prunes 156 redundant source PNGs; keep checking newly uploaded media for responsive WebP/AVIF derivatives and size limits.

## Notes

- Present and verified in code/build: branded 404s, public CTAs, favicon/manifest, robots.txt, sitemap.xml, OG image, image alt semantics, responsive breakpoints, loading states, HTTPS, canonical/hreflang helpers, structured data, clean slugs, internal-link auditing, and one-H1 checks.
- A cookie banner is intentionally skipped while the site uses only essential session, locale, and theme storage. Reassess before adding non-essential analytics or advertising cookies.
- The public static site and authenticated application are separate deployments. Static account/menu CTAs must continue to use the configured account-app origin; never hard-code localhost or a preview URL.
- Non-image uploads remain quarantined until a trusted scanner or explicit review workflow marks them safe. Do not weaken that boundary simply to make documents downloadable.
- Live ZarinPal/YekPay/SMS behavior still depends on valid provider credentials and sandbox/production verification. Test callbacks and reconciliation before enabling real payments.
- Four moderate `npm audit` findings remain only in Drizzle Kit's development dependency chain; production dependencies have no high or critical advisory. Do not apply the suggested forced breaking downgrade.
- Suggested next review: immediately after provider sandbox credentials and legal/contact approval are available, then again after the first week of real field analytics.
