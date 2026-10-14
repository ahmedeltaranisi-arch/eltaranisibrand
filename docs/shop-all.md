# Shop All collection

`/en/collections/all` (and `/ar/...`) reproduces the reference store's All collection: the text
hero, the six category tiles, the filter/sort drawer, the four-column grid with the two mid-grid
editorials, the FAQ, the breadcrumb and the shared arrival skin (header, promo, footer, cart).

## Data: nothing on the page is typed in

`scripts/build-shop-all.mjs` derives `src/lib/shopAllCatalog.json` from the two captures this
storefront already owns — `src/lib/newArrivalsCatalog.json` (New Arrivals / Best Sellers) and
`src/lib/activewearCatalog.json` (Activewear) — and `src/lib/shopAll.ts` derives every number at
request time:

| Facet | Values (collection-wide counts) |
| --- | --- |
| Collection | 205 colorways, one per photographed garment-dye |
| Tiles | Shop All 205 · Activewear 87 · Tees 17 · Sweats 79 · Intimates 22 · Sleep 18 |
| Category | Activewear Tops 15 · Headbands 1 · Leggings 35 · Pants 9 · Shorts 9 · Socks 4 · Sports Bras 22 · Sweaters 9 · Sweatpants 43 · Sweatshirts 39 · T-Shirts 11 · Tank Tops 3 · Unitards 4 |
| Color Group | Beige 4 · Black 33 · Blue 17 · Brown 20 · Green 29 · Grey 32 · Neutral 27 · Pink 9 · Purple 8 · Red 6 · White 19 |
| Size | the reference's twelve rows (XS … OS), counted from the captured available variants |
| Fabrics | Organic Stretch 86 · Organic Fleece 68 · Organic Waffle 12 · Merino 10 |
| Dyes | Nori 8 · Wisteria 2 · Balsam 7 · Heather Oat 8 · Peppercorn 3 |

The category and colour-group totals both come to 204, not 205: one garment (Chili Oil) carries
neither a category nor a colour group on the reference store either, so it stays in the grid and
out of every facet row instead of being filed somewhere convenient.

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

The Clothing mega menu mirrors the reference's rows exactly — Categories, Featured Colors,
Featured Fabrics, Featured Collections and two featured tiles — and drops a row only when the
catalogue truly carries nothing for it (Sale, Gift Card and Organic Pima Cotton today), so a menu
entry never lands on an empty page.

## Verify

```sh
node scripts/build-shop-all.mjs     # regenerate the catalogue
npx tsx --test tests/shop-all.test.ts
npm run verify
```
