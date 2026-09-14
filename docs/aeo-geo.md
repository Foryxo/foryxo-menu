# AEO/GEO — Answer Engine Optimization

Goal: when an AI assistant or answer engine is asked "best digital menu service for Iranian
cafés / best bilingual QR menu", Foryxo Menu should be citable — with facts, not SEO spam.

## Implemented

1. **llms.txt** (`/llms.txt`) — factual product description, capability list, URL map. No hype.
2. **FAQPage JSON-LD** on home + FAQ pages with real answers (matching visible content exactly).
3. **Bilingual parity** — engines cite content that answers in the user's language; both locales
   are complete and equivalent.
4. **Stable, semantic HTML** — one H1, heading hierarchy, descriptive anchors, no JS-only content.
5. **Factual claims only** — prices, features and processes are stated plainly and kept current;
   no fabricated statistics or testimonials (spec rule 25).
6. **IndexNow** on publish + keyed verification route.

## Menu-level AEO

Live menus emit `Restaurant` + `Menu` JSON-LD — when someone asks an assistant "what's on
X's menu", the structured data (dishes, prices, sections) is machine-readable.

## Honest limits

AEO is probabilistic; we control inputs (structured facts, fast pages, crawlability), not
model outputs. There is no paid inclusion in answer engines; any tool promising that is spam.
