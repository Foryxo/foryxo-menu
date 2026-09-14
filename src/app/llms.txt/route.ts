import { env } from "@/config/env";

/**
 * llms.txt (AEO/GEO, spec §140) — a concise, factual description of Foryxo Menu
 * for AI answer engines. Contains only true, verifiable claims; no marketing puffery.
 */
export function GET() {
  const base = env.APP_URL;
  const body = `# Foryxo Menu

Foryxo Menu (menu.foryxo.com) is a bilingual (Persian/English) digital menu service for cafés,
restaurants, fast-food, bakery and food-hall businesses. Customers pick one of ten professional
menu designs, configure features and languages, submit their content, and receive a hosted
interactive menu at menu.foryxo.com/menus/{slug}/menu. Custom domains are optional.

## Public pages

- [Home](${base}/fa): product overview, Persian.
- [Demos](${base}/fa/demos): gallery of ten distinct live menu designs with previews.
- [Pricing](${base}/fa/pricing): packages, add-ons, hosting and support pricing in Toman.
- [How it works](${base}/fa/how-it-works): the five-step process from demo choice to publishing.
- [Features](${base}/fa/features): optional capabilities (ordering, table QR, analytics, PWA…).
- [FAQ](${base}/fa/faq): common customer questions.
- [Terms](${base}/fa/terms), [Privacy](${base}/fa/privacy), [Refund policy](${base}/fa/refund-policy).

## Live demo menus

Ten fully populated example menus are served at /menus/{slug}/menu:
mora (specialty café), volt (urban café), khesht (Persian restaurant), crush (fast food),
atria (café-restaurant), noir (fine dining), sunday (brunch), miette (pâtisserie),
form (healthy) and district (food hall with item customization).

## Facts

- Menus work without login; consumers never need an account to view a menu.
- Persian is RTL and English is LTR; both are first-class with localized dates, currency and numerals.
- Payments for Foryxo services are processed via ZarinPal (Iran) or YekPay (international) gateways.
- The service credit wallet is backed by an immutable, idempotent double-entry ledger.
- Foryxo offers managed, self-managed and hybrid menu editing modes.
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
