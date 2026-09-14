# Menu Engine

One data-driven renderer serves every menu at `/menus/[slug]/menu` — no per-client code, ever.

## Entities

`menu → menu_versions → categories → products → product_translations`, plus
`modifier_groups → modifiers` joined via `product_modifier_groups`, and
`menu_themes`, `branches`, `custom_domains` (see `src/domains/db/schema/menu.ts`).

## Versioning & publishing

1. All edits happen on the **draft version** (v2+).
2. Publish (`menu-engine/publish.ts`) builds the **read model** — a complete JSONB snapshot of
   categories, products, bilingual fields, nutrition/allergens/badges, modifier groups/options,
   theme and metadata — computes a `content_hash`, marks the version `published`, and flips the
   menu's `published_version_id`.
3. The renderer reads one row (the published read model) — single fetch, cacheable, immutable.
4. Rollback = point `published_version_id` back at any prior published version.

## Read model shape

`MenuReadModel` (src/domains/menu-engine/read-model.ts): `business`, `menu`, `theme`,
`categories[]` each with `products[]` each with `modifierGroups[]` → `options[]`.
Products carry: price (integer IRT), `priceOld`, badges, nutrition, allergens, dietary tags,
`available/soldOut/hidden/scheduledHide`, `allowsCustomRequest`, image URL/prompt.

## Availability rules

- `soldOut` — shown grayed with a badge; not orderable.
- `hidden` — excluded from the read model entirely.
- `scheduledHide` / daypart categories — categories carry `daypart_start/end`; the renderer
  shows them inside their window (e.g. breakfast 06–11).
- Seasonal menus = versions with scheduled publish windows (project-level).

## Locales & RTL

Per-menu `locales[]` (e.g. `["fa","en"]`). The renderer picks the request locale when available,
falls back to the default locale, and applies `dir` per locale. Formatting uses `Intl` with the
Persian calendar for fa dates and Persian digits for fa numerals (display-only).

## Custom requests (spec §20 demo "District")

Products with `allowsCustomRequest` accept a free-text note + modifier selections. Notes pass
through `sanitizeNote` (control/HTML chars stripped, length-capped), are stored as plain text,
never rendered as HTML, and travel with the order line. The UI states clearly that requests are
requests — not guaranteed substitutions — and require restaurant acceptance.

## Ordering math (when ordering is enabled)

Client totals are display-only. The server recomputes every line via `pricing/engine.ts`
(calculateCart): validates modifier min/max/required, availability, clamps quantity 1–99,
applies discount → fee → tax in that order, and snapshots names/prices onto each line
(order items are immutable snapshots — later price changes never rewrite history).

## Caching & scale

Read models are immutable per publish; served with public cache headers so a CDN can cache
menu HTML. Publish-time is the only invalidation point. See `docs/scaling/10m-concurrency-strategy.md`.
