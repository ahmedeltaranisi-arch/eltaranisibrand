# Shop All collection

`/en/collections/all` (and `/ar/...`) reproduces the reference store's All collection: the text
hero, the six category tiles, the filter/sort drawer, the four-column grid with the two mid-grid
editorials, the FAQ, the breadcrumb and the shared arrival skin (header, promo, footer, cart).

## Data: nothing on the page is typed in

The catalogue began as `scripts/build-shop-all.mjs` derives it from the two captures this
storefront already owned — `src/lib/newArrivalsCatalog.json` (New Arrivals / Best Sellers) and
`src/lib/activewearCatalog.json` (Activewear) — and it is now the reference store's own All
collection, captured and ingested:

| Script | What it captures |
| --- | --- |
| `scripts/fetch-reference-grid.mjs [collection] [pages]` | `relay/reference-grid.json` — the reference's `/collections/all`, page by page, in its own order: each card's photographs, its swatch rail, its badges and its price. Any other shelf (`the-tee-shop`, `up-to-50-off`, a dye, a fabric) captures the same way into `relay/reference-grid-<collection>.json`. |
| `scripts/ingest-reference-products.mjs <handle…>` / `--collection <handle>` | adds a colourway the reference lists but this repository never captured, straight from the reference's own product payload and facet listings: colour, sizes, availability, badges, price, category and colour group, with the reference's leading card frames stored as WebP in `public/img/mate/`. |
| `scripts/vendor-reference-frames.mjs` | puts every colourway's card in the reference's own frame order (its lead first) and registers those frames in `src/lib/referenceCardFrames.json`, the rule that keeps a frame the reference ships even when our pose scan would call it a crop. |
| `scripts/apply-reference-collections.mjs` | rebuilds every rail, fabric and dye membership from the captured collection pages, re-files each colourway into the reference's own category and colour group, and adds the reference's sale shelf (`/collections/up-to-50-off`). |
| `scripts/apply-reference-order.mjs` | writes the reference's Featured order into the catalogue |
| `scripts/sync-catalogue-labels.mjs` | names every style, dye and colour group the catalogue carries in `messages/en.json` and `messages/ar.json` |

`src/lib/shopAll.ts` then derives every number at request time from that catalogue:

| Facet | Values (collection-wide counts) |
| --- | --- |
| Collection | the reference's All collection: 328 colourways, plus the sale shelf's own 45 and the gift card |
| Tiles | Shop All 205 · Activewear 87 · Tees 17 · Sweats 79 · Intimates 22 · Sleep 18 |
| Category | Activewear Tops 15 · Headbands 1 · Leggings 35 · Pants 9 · Shorts 9 · Socks 4 · Sports Bras 22 · Sweaters 9 · Sweatpants 43 · Sweatshirts 39 · T-Shirts 11 · Tank Tops 3 · Unitards 4 |
| Color Group | Beige 4 · Black 33 · Blue 17 · Brown 20 · Green 29 · Grey 32 · Neutral 27 · Pink 9 · Purple 8 · Red 6 · White 19 |
| Size | the reference's twelve rows (XS … OS), counted from the captured available variants |
| Fabrics | Organic Stretch 86 · Organic Fleece 68 · Organic Waffle 12 · Merino 10 |
| Dyes | Nori 8 · Wisteria 2 · Balsam 7 · Heather Oat 8 · Peppercorn 3 |

Every count above is recomputed from the catalogue on the request that renders it, so the drawer
prints the reference's own numbers — the facet listings at
`/collections/all?filter.p.t.category=…` and `?filter.p.m.custom.parent_color=…` are what re-files
each colourway, and a colourway whose listing names neither stays in the grid and out of the rows
instead of being filed somewhere convenient.

Rules, matching the filmed reference:

- Counts are always real and self-excluding (a facet counts as if its own selection were removed,
  so alternatives inside the facet stay reachable). OR within a facet, AND across.
- `See Results (N)` is the live filtered count, not a static string.
- Category rows the current rail cannot fill are not offered, and a colour group with nothing
  behind it is removed from the drawer and from the rail's filter entirely.
- Size rows with a zero count render disabled; an absent variant never borrows a neighbour's
  count, and `OS` matches the captured `One Size` variant.
- Sort values map to the reference's own names and marks (`sort_by=created-descending`,
  `best-selling`, `price-ascending`, `price-descending`), and the captured ranks behind them are
  the reference's, best-of-both captures.
- Every card prints one swatch per colour group (the reference's own card rule), and hovering or
  focusing a swatch swaps the card to that colourway's own photograph and pose.
- The two editorials sit where the reference puts them: a two-column split after the sixth card of
  page one, a full-width split after the eighteenth, each with its own photograph pair and copy.

## Rails the header links to

`/collections/tees`, `sweats`, `intimates`, `sleep`, `socks`, `october-capsule`, `getaway-edit`,
`cozy-shop`, `bundle-and-save`, `sweatshirts`, `sweatpants`, `sweaters`, `bottoms`,
`organic-stretch`, `fleece`, `waffle`, `merino-wool`, `nori`, `wisteria`, `balsam`, `heather-oat`
and `peppercorn` render the same collection page scoped to that rail, so every mega-menu entry
lands on real products. Activewear keeps its own dedicated page at `/collections/activewear`.

The Clothing mega menu mirrors the reference's rows exactly — Categories (through Sale), Featured
Colors, Featured Fabrics, Featured Collections (through Gift Card) and two featured tiles. Sale
opens the reference's own up-to-50-off shelf, which is a rail of its own, and Gift Card opens the
gift card product, so no menu entry lands on an empty page.

## Verify

```sh
node scripts/fetch-reference-grid.mjs all 8          # the reference's own All collection
node scripts/ingest-reference-products.mjs --collection all
node scripts/vendor-reference-frames.mjs             # reference frame order, per colourway
node scripts/apply-reference-collections.mjs         # rails, categories, colour groups
node scripts/apply-reference-order.mjs               # the reference's Featured order
node scripts/sync-catalogue-labels.mjs               # style, dye and colour-group names
npx tsx .probe/parity.ts                             # catalogue against the capture
npx tsx --test tests/shop-all.test.ts
npm run verify
```
