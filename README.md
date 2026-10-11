# Storefront — Next.js 16 + Tailwind v4 + next-intl (EN / AR)

A minimal-clean apparel storefront in the visual language of a premium
organic-basics brand: sticky header with mega menu, full-bleed hero slider,
marquee value strip, tabbed product rails, colourway swatches, cart drawer,
collection filtering, product detail with accordion + reviews, about/contact
pages, 404, and full English/Arabic (RTL) localisation.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16.4 (App Router, Turbopack, SSG)           |
| Styling        | Tailwind CSS v4 (`@theme` design tokens)            |
| i18n           | next-intl 4.14 — `/en` + `/ar`, `dir="rtl"`         |
| Fonts          | Inter (Latin) + Cairo (Arabic) via `next/font`      |
| Cart           | React context + `useSyncExternalStore` over localStorage |
| Data           | Static TS catalog (`src/lib/catalog.ts`) — 12 styles, 63 colourway routes |
| Imagery        | The brand's own shoot (`brand.zip`, 78 frames) — 2 angles per product |

## Commands

```bash
npm run dev          # http://localhost:3000
npm run build        # production build (every route statically generated)
npm run lint         # eslint
npx tsc --noEmit     # typecheck
npm run check:i18n   # en/ar key parity + {placeholder} parity
npm run verify       # all of the above, in order
```

## Routes

```
/                         -> 307 redirect to /en (or the cookie locale)
/[locale]                 home: hero slider, marquee, statement, editorial,
                          tabbed rails, values, reviews
/[locale]/collections     collection index
/[locale]/collections/[handle]
                          hero + client-side filters (size / colour / price / sort)
/[locale]/products/[slug] gallery, colourways, sizes, qty, add-to-bag,
                          accordions, reviews, related
/[locale]/cart            full cart page + summary + suggestions
/[locale]/checkout        contact / address / delivery / payment + live
                          totals, validation, order confirmation
/[locale]/pages/about     story, materials, factories, responsibility
/[locale]/pages/contact   form with validation, contact block, FAQ accordion
404                       localised, with popular products
```

## Layout of the source

```
src/
  proxy.ts              locale routing (Next 16 renamed `middleware` -> `proxy`)
  navigation.ts         locale-aware Link / router / redirect
  i18n/                 routing config + request config
  context/cart.tsx      cart store (localStorage-backed)
  lib/catalog.ts        products, collections, menu model, productKey()
  components/           header, mega menu, search overlay, cart drawer,
                        hero slider, marquee, product card/rail/tabs,
                        filters, buy box, review carousel, newsletter,
                        locale switcher, breadcrumbs, reveal, icons
messages/en.json        396 keys
messages/ar.json        396 keys (same shape, RTL copy)
scripts/check-i18n.mjs  key + placeholder parity check
public/img/shots/       the brand shoot: <style>-<tone>-<n>.jpg, where 1 is
                        the front frame, 2 the hover pose and 3+ extra
                        angles; public/img/rev-*.jpg are review avatars
```

## Interactions worth knowing

- **Card hover swap** — each product card stacks two angles; the second fades
  in on hover (`ProductCard.tsx`).
- **Gallery + lightbox** — product page has a thumbnail rail and a
  keyboard-navigable lightbox (Esc / ← / →) in `ProductGallery.tsx`.
- **Colourway swatches** — clicking a swatch on a product page routes to that
  colour's own URL, so every variant is deep-linkable.
- **Checkout** — client-side only. Totals recalc live (free shipping over
  $200, $8 standard, $18 express, 8% estimated tax). No payment is processed.

## Notes gotchas worth knowing

- **`src/proxy.ts`, not `middleware.ts`.** Next.js 16 deprecated the
  `middleware` file convention and renamed it to `proxy`. A file named
  `middleware.ts` is silently ignored — the root path just 404s instead of
  redirecting to `/en`.
- **No `@utility` in this build.** The Turbopack CSS pass forwards unknown
  at-rules untouched, so Tailwind v4 `@utility` blocks ship as literal text
  and the class names never exist. Component classes live in `globals.css` as
  plain CSS instead.
### Photography
Everything in `public/img/` comes from the brand's own shoot (`brand.zip`). The
archive held ~194 files — mostly the same frame re-exported at several sizes —
so the build keeps one copy of each, re-encoded to web weight. Frames live in
`public/img/shots/<style>-<tone>-<n>.jpg`, and `SET_FRAMES` in
`src/lib/catalog.ts` records how many each set holds: a tone the shoot captured
once renders a single image rather than a missing one. Every colourway resolves
its own frames through `colorwayFrames(product, tone)`, so picking a swatch
swaps the model photo *and* the product gallery. The tone hexes were measured
from the archive colour tiles, never by eye.

- **`@keyframes` must be top-level.** Nesting `@keyframes marquee-rtl` inside
  `html[dir="rtl"]` makes the CSS parser bail on the whole block, which
  silently kills the RTL marquee animation. Keyframes now sit at the top level
  with a `html[dir="rtl"] .animate-marquee { animation-name: … }` override.
- **Product copy keys.** `titleKey` is `p.<group>.title`; `productKey()` in
  `src/lib/catalog.ts` strips both the `p.` prefix and the `.title` suffix.
  Don't hand-roll that replacement — `String.replace(".title", …)` also
  rewrites the `.title` in the middle of the key.

## Before this goes anywhere public

The photography is now the client's own shoot. The **copy, the product data and
the wordmark in `src/components/Wordmark.tsx` are still original placeholder
work** — replace the brand name, wordmark and product copy with your own before
deploying, and don't ship it under another company's name or logo.
# eltaranisibrand
