# SEO Implementation

## Structure

- Locale-prefixed routes (`/fa`, `/en`); middleware redirects `/` → `/fa`.
- Every public page exports `generateMetadata` with per-locale title/description and
  `alternates` carrying `canonical` + `hreflang` (`fa`, `en`, `x-default` → fa).
- No duplicate indexing: one canonical URL per page per locale; `hreflang` pairs both.

## Structured data (JSON-LD)

| Page | Schema |
| --- | --- |
| Home | `Organization`, `WebSite` (+ SearchAction), `FAQPage` |
| Demos | `ItemList` of the 10 designs |
| Demo detail | `Product`-like `CreativeWork` description + FAQ where present |
| Live menus | `Restaurant` + `Menu`/`MenuSection`/`MenuItem` with offers (IRT prices) |
| Contact | `ContactPage`/`LocalBusiness` contact data |

All prices in JSON-LD use integer Toman with the IRT currency notation consistent with on-page display.

## Sitemaps & robots

- `sitemap.xml` includes all public pages **plus every published, indexable menu** (generated
  dynamically from published read models).
- `robots.txt`: allows all; disallows `/dashboard`, `/admin`, `/api`, `/build` draft states.
- Demo menus ship `isDemo: true` and remain indexable — they are the portfolio.

## Content rules

- No fake testimonials, statistics or urgency devices (spec rule 25).
- Persian and English content are both complete and equivalent — no machine-shell pages.

## AEO / GEO (answer engines)

- `llms.txt` route (`/llms.txt`) gives engines a factual product summary + link map.
- FAQ pages use real Q&A pairs with `FAQPage` JSON-LD (factual, no puffery).
- Semantic HTML single-H1 structure, descriptive headings, stable slugs.

## Off-site signaling

- IndexNow: on menu publish we ping `api.indexnow.org` with the published URL using
  `INDEXNOW_KEY` (verification route `/indexnow-key/{key}` implemented).
- OpenGraph/Twitter metadata on all public pages for social sharing (spec §143).
