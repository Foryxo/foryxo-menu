# UX Decision Log

Why the product looks and behaves the way it does. Research basis:
`docs/research/ui-product-references.md` (patterns studied, none copied).

## Home page

- **Layered storytelling over hero-cliché:** live demo showcase beside the headline instead of a
  gradient blob; the product *is* the menus, so they lead. Swiper-driven, touch-first, reduced-motion aware.
- **Honest trust:** no testimonials section until real ones exist (spec rule 25). Trust is carried
  by showing working product surfaces instead.
- **Pricing transparency on the surface** — a teaser with real numbers, full detail one click away.
  No fake urgency, no countdowns.

## Builder (10 steps)

- One decision per screen, visible progress, persistent draft (localStorage → server on account),
  live estimate that updates with every choice — no pricing surprises at submit.
- Demo previews inline at the choice step (phone frames) rather than abstract feature lists.
- URL is `/build` (not per-step routes) to keep state logic in one place; steps are keyboard-navigable.

## Demos

- Ten **architecturally distinct** designs (spec §154-3): editorial minimal (Mora), kinetic dark
  (Volt), heritage Persian (Khesht), brutalist fast-food (CRUSH), all-day café (Atria), fine-dining
  journal (NOIR TABLE), sunlit brunch (Sunday), pâtisserie (Miette), nutrition-led (FORM),
  everything-hall (District). Each demo page states best-fit business, characteristics, supported features.

## Live menus

- **Zero-friction access:** no login, no app, no cookie wall. QR → menu.
- Category rail adapts to length (tabs → scroll); search appears above 12 items.
- Item sheets slide with real modifiers; custom-request flows warn that notes are requests,
  not guarantees (spec §20).
- Theme tokens per menu; never the Foryxo brand palette on a client menu.

## Dashboard / Admin

- Information density follows Toast/Square patterns (studied, not copied): status first,
  money second, metadata third; tables over cards for lists; actions inline where reversible,
  confirmed where not (publish, refund, charge).
- Every quote shows "nothing is charged until you approve" next to the amount — the number one
  trust objection in managed services.

## RTL & bilingual

- Logical CSS properties everywhere; mirrors verified in both locales during design, not after.
- Persian digits for display; ASCII for input handling; Persian calendar dates in fa.
- Language switch preserved in the URL (`/fa`, `/en`) — shareable, SEO-safe, no cookie surprises.

## Motion & accessibility

- Motion is decorative only; every flow completes with animations disabled
  (`prefers-reduced-motion` honored in showcase and sheets).
- WCAG 2.2 AA target: visible focus, 44px hit areas, state never by color alone (badges + text),
  automated axe checks on key pages (`tests/e2e/a11y.spec.ts`).

## What we deliberately did NOT do

- No generic shadcn-dashboard aesthetic for the marketing site.
- No popups, no exit-intent, no newsletter gates.
- No dark-pattern pricing (pre-checked add-ons, hidden recurring fees). Recurring hosting is
  labeled annual in the estimate line items.
