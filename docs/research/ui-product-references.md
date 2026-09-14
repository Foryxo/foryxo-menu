# UI / Product Research Summary

**Date:** September 2026 · **Purpose:** internal reference for Foryxo Menu design decisions.
**Method:** studied public product surfaces, onboarding flows, and menu UX patterns. **No visual assets, layouts, copy, or branding were copied.** This document records functional and UX patterns only.

## Iranian digital-menu products (pattern study)

| Product class | Observed patterns worth adopting | Patterns deliberately avoided |
| --- | --- | --- |
| QR-menu SaaS platforms (e.g. Menudar-style systems) | Category chip rails on mobile; per-table QR parameters; Persian-first typography with Toman price labels; WhatsApp/order handoff links | Dense admin panels designed desktop-first; hard-coded single theme; subdomain-per-tenant URL schemes; cluttered upsell banners inside guest menus |
| Café-chain websites (Tehran specialty coffee segment) | Editorial photography with generous whitespace; bilingual toggle treated as a first-class control; store locator tied to menus | Intro splash animations that delay menu access; image-heavy pages with no text scan path |
| Fast-food ordering sites | Sticky cart summary; modifier selection before add-to-cart; large appetite-appeal crops | Fake countdown timers; aggressive modal upsells; carousels everywhere |
| Persian restaurant sites | Structured kebab/stew category hierarchy; price-per-portion clarity; trust signals (address, hours) near the top | Stock tourist imagery; religious/clichéd motifs; auto-playing music |

## International product references (pattern study)

| Product | Adopted patterns | Avoided patterns |
| --- | --- | --- |
| Toast (restaurant OS) | Role-differentiated dashboards; order state machines with explicit statuses; hardware-free QR ordering flows | Hardware-centric onboarding irrelevant to us; US-centric tax logic |
| Square for Restaurants | Floor/table context in ordering; clean modifier matrix; clear "menu vs order" separation | Loyalty hardware; POS-first IA |
| Popmenu | Rich item storytelling (photos per item); guest engagement without login walls | Bold popup collection widgets that interrupt menu scanning; fabricated urgency |
| BentoBox | Editorial hospitality marketing pages; elegant typography systems; storytelling sections between menu access points | Long single-page scroll menus with no sticky navigation |
| Owner.com | Conversion-audited menu layout: photos on top sellers, scannable prices, minimal taps to order; strong before/after messaging | Dark patterns: hidden fees, fake scarcity, guilt-copy declines |
| GloriaFood | Zero-friction ordering funnel; clear setup checklists for owners | Generic template look; ad-supported widgets inside client menus |

## Cross-cutting insights applied to Foryxo

1. **Menu access latency is the product.** Guests scan a QR mid-conversation; the menu must render under 2.5s on 3G-class connections and require zero interaction (no modal, no signup, no intro animation). This drove: read-model caching, CDN-first menu path, server-rendered menus.
2. **One-hand mobile ergonomics.** Category rails within thumb reach, bottom-sheet product detail, sticky search. Desktop is an adaptation, not the default.
3. **Modifiers are where ordering UX is won or lost.** We adopt the "group → options with price delta → server-side re-validation" model with required-group enforcement, because both Toast and Square treat modifiers as structured data, not free text.
4. **Bilingual is a market requirement in Iran**, not a feature. FA is default; EN is one tap away and priced as an add-on. hreflang/canonical hygiene is designed in from day one.
5. **Owner trust is built with process transparency** (timeline, quotes, previews before publish), not testimonials. We show no fake social proof.
6. **The dashboard must be staff-simple.** Restaurant staff need Today / Orders / Sold-out toggles first, analytics later. Information density is progressive.
7. **Premium ≠ decorative.** The Foryxo site itself uses editorial typography, asymmetric grids, restrained motion (spring-based, reduced-motion aware), and real interactive previews — not gradient blobs or glassmorphism.

## Foryxo differentiators chosen

- Path-based tenant URLs (`/menus/{slug}/menu`) — no subdomain DNS dependency at signup, works with QR instantly.
- Managed/self/hybrid editing modes with a formal quote workflow — most Iranian competitors offer only self-serve editing.
- Financially strict service-credit ledger (immutable, integer minor units, holds/captures) — rare in this market.
- 10 genuinely distinct demo architectures rather than one template with color variants.
