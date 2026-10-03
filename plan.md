# Website Production Plan

## Summary

- Readiness: **9/20 complete** against the requested checklist (9 present, 9 partial, 1 missing, 1 not applicable). This is a local-code and browser assessment, not a production security certification.
- Critical gaps: the privacy and terms pages still identify themselves as drafts; there is no working site-analytics collection despite an admin reports table; the public contact route does not publish a verified business address. The original local PGlite store aborts on open, so authenticated and persisted workflows need a clean, isolated QA run before any release.
- Recommended focus: repair/restore the local data safely, finish legal and contact details, validate the full customer–creator–admin journey and payments, then polish search and conversion details. Preserve the currently deployed version until those gates pass.

## Audit Checklist

| # | Item | Status | Evidence | Priority | Effort |
|---:|---|---|---|---|---|
| 1 | Custom 404 page | Present | Branded root and locale 404 pages; invalid route returns HTTP 404 and `noindex`. | Medium | Low |
| 2 | Meta title on every page | Partial | Public pages have titles, but several private/status-like routes rely on generic inherited titles; status titles were corrected locally. | Medium | Medium |
| 3 | Meta description on every page | Partial | Main public routes have descriptions; legal/contact/security copy was corrected locally, but private and exceptional routes still inherit generic marketing text. | Medium | Medium |
| 4 | CTA above the fold | Present | Home hero offers “Browse demos” and “Build my menu” on mobile and desktop. | High | Low |
| 5 | Favicon set | Present | `/favicon.ico`, `/icon.png`, and web manifest respond successfully. | Medium | Low |
| 6 | robots.txt file | Present | Generated `/robots.txt` declares sitemap and excludes private route patterns. | High | Low |
| 7 | sitemap.xml | Present | Generated `/sitemap.xml` includes bilingual public routes, articles, and published indexable menus. | High | Low |
| 8 | Open Graph image | Present | A 1200×630 generated image now appears on checked public pages and its URL returns PNG 200 locally. | Medium | Low |
| 9 | Alt text on every image | Present | Content images expose dish/article names; decorative logos and theme icons use empty alt with hidden semantics. Sampled in source and Axe runs. | Medium | Medium |
| 10 | Mobile breakpoints | Present | Responsive header/gallery/menu and no horizontal overflow in sampled mobile routes; mobile Axe scans pass. | High | Medium |
| 11 | Sticky mobile CTA | Partial | Quick-action FAB is fixed, but a direct, persistent conversion CTA is hidden until it is expanded. | Medium | Low |
| 12 | Loading states | Present | Builder shows a loading placeholder; menus and buttons expose loading/saving states. | Medium | Low |
| 13 | Form error states | Partial | Contact and builder show generic errors and builder now offers manual save retry; field-specific, retry, offline, and failed-submit scenarios are not fully covered. | High | Medium |
| 14 | Thank you page | Partial | Payment-success status exists and builder has inline confirmation, but contact has only an inline success message without a dedicated confirmation route/next step. | Medium | Low |
| 15 | Privacy policy page | Partial | Bilingual page exists, but visibly warns that it is a draft and requires legal/operational review. | Critical | Medium |
| 16 | Terms and conditions | Partial | Bilingual page exists, but visibly warns that it is a draft and requires legal/operational review. | Critical | Medium |
| 17 | Cookie banner | Not applicable | Current declared behavior is essential session/language/theme cookies only, with no advertising tracker. Reassess if non-essential analytics/marketing cookies are introduced; obtain jurisdiction-specific advice. | Medium | Low |
| 18 | Analytics installed | Missing | `analyticsEvents` is read by admin reports, but no writer or analytics provider was found; the report is not evidence of real traffic collection. | High | Medium |
| 19 | Real contact address | Partial | Contact form and WhatsApp quick action exist, but no verified public business email or postal address is displayed. | High | Low |
| 20 | Compressed images | Partial | The served menu photos are WebP with thumbnails, but 152 source PNGs totaling about 331 MB remain in `public/images/demos`; confirm references and move originals outside the deployable public tree without losing masters. | Medium | Medium |

## Phase 1: Critical (do before any traffic)

- [ ] **Privacy policy and terms (15–16)** — Have the owner and qualified counsel reconcile the draft text with actual account, order, retention, refund, and payment behavior; publish approved revision dates and remove the draft warning only after sign-off.
- [ ] **Real contact address (19)** — Verify that a monitored `@foryxo.com` inbox/forwarder actually receives messages, then publish it alongside the existing contact form; add a genuine business mailing address if legally required for the target markets.
- [ ] **Analytics (18)** — Instrument a minimal privacy-conscious page/menu event pipeline or vetted provider, document retention and consent requirements, exclude staff/test/bot traffic, and verify the admin report against known test events. Do not claim traffic insights from an empty read-only table.
- [ ] **Form errors (13)** — Exercise invalid, duplicate, rate-limited, offline, failed-upload, failed-payment, and failed-submit cases in both languages; give actionable per-field or retry feedback and ensure a backend 500 cannot silently lose a builder draft.

## Phase 2: High-impact

- [ ] **Titles and descriptions (2–3)** — Audit rendered `<head>` across every public, private, menu, article, status, and error route. Keep unique, useful bilingual public snippets; set `noindex` on non-public outcomes and avoid generic marketing descriptions on them.
- [ ] **Thank you page (14)** — Provide an accessible, noindex contact confirmation with what happens next and a route back to the product; retain inline success for no-JavaScript resilience if applicable.
- [ ] **Sticky mobile CTA (11)** — Make “Build my menu” directly available at a small-screen safe-area position without covering menus, forms, cookie controls, or the existing support FAB; respect reduced motion.
- [ ] **Compressed images (20)** — Verify every referenced asset exists, keep optimized WebP/AVIF and responsive sizes in `public`, move source PNG masters to a non-public archive, and compare production asset size and LCP before/after.

## Phase 3: Polish & Optimization

- [ ] **Metadata coverage (2–3)** — Add a rendered-route assertion to CI for title, description, canonical/hreflang, appropriate `noindex`, one meaningful H1, OG image, and HTTP status; test both `fa` and `en` plus menu query variants.
- [ ] **Form and conversion feedback (11, 13–14)** — Check focus return, screen-reader announcements, touch targets, safe-area spacing, and success paths on narrow phones, desktop keyboards, light/dark mode, and RTL/LTR.

## Notes

- The previous local `.data/pglite` fails with a PGlite WASM `Aborted()` even outside the app. It was copied to `.data/pglite-audit-copy-20260914` before further investigation; **do not delete or overwrite either**. An isolated seeded `.data/qa-production-audit-20260914` works for browser tests. Recover user data from a verified backup or PostgreSQL export before changing the normal local database path.
- The 10 demos display 20 items each, but underfilled templates are padded with four repeated, sometimes irrelevant dishes (for example, saffron chicken in a coffee menu). Replace the filler with category-appropriate, separately named products and photos before presenting them as realistic client examples.
- The blog contains 20 bilingual routes, but 17 short articles share nearly identical section structures and claim 3–4 minute reading times. Rewrite these from real expertise, correct reading-time estimates, add relevant internal links, and review before indexing; avoid scaled low-value content.
- Authenticated customer, creator, and admin workflows and live payments require separate end-to-end fixtures and provider sandbox credentials. Production sign-in is intentionally unavailable until a delivery method is configured; per the latest direction, no OTP setup was attempted in this audit. Do not deploy a flow that invites orders but cannot complete them.
- The current sitemap, canonical/hreflang helper, structured-data builders, clean slugs, and HTTP→HTTPS/HSTS are present. Validate schema currency/price units against the payment data, then verify Search Console ownership, submit the sitemap, inspect index coverage, and do the equivalent in Bing Webmaster Tools. A backlink strategy should be earned through relevant partnerships and editorial references, not automated link spam.
- `npm audit --omit=dev --audit-level=high` found no high/critical advisories, but four moderate warnings in the development-tooling dependency chain. This is not a penetration test. [ECC AgentShield](https://ecc.tools/) audits agent configuration rather than website behavior; [Strix](https://www.strix.ai/) requires a separate Docker/LLM setup not available locally. Do not treat either as a substitute for authorized production security testing.
- Run Lighthouse/field Core Web Vitals on the built deployment, especially mobile LCP, INP, and CLS, before calling performance complete. Repeat the internal-link and asset crawl after content changes.
- Next review: after legal/contact decisions and a full authenticated QA pass, then again immediately before a guarded deployment.
