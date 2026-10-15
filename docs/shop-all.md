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
| `scripts/sync-swatch-order.mjs` | puts every card's swatch row in the reference's own capture order |
| `scripts/sync-catalogue-labels.mjs` | names every style, dye and colour group the catalogue carries in `messages/en.json` and `messages/ar.json` |

`src/lib/shopAll.ts` then derives every number at request time from that catalogue:

| Facet | Values (collection-wide counts, as the drawer prints them today) |
| --- | --- |
| Collection | the reference's All collection: 328 colourways, plus the sale shelf's own 50 and the gift card |
| Tiles | Shop All 328 · Activewear 95 · Tees 46 · Sweats 136 · Intimates 39 · Sleep 9 |
| Category | Activewear Tops 12 · Baby & Children's Bottoms 3 · Baby & Children's Tops 10 · Bikinis 7 · Bras 10 · Briefs 7 · Dresses 2 · Headbands 1 · Leggings 35 · Pajamas 9 · Pants 24 · Shopping Bags 1 · Shorts 12 · Skirts 3 · Socks 6 · Sports Bras 23 · Sweaters 10 · Sweatpants 48 · Sweatshirts 58 · T-Shirts 51 · Tank Tops 23 · Tops 7 · Unitards 4 |
| Color Group | Beige 4 · Black 50 · Blue 25 · Brown 41 · Green 45 · Grey 62 · Neutral 16 · Orange 2 · Pink 11 · Purple 9 · Red 5 · White 49 · Yellow 6 |
| Size | the reference's eighteen rows (XS … OS), counted from the captured available variants |
| Fabrics | Organic Stretch 95 · Organic Pima Cotton 27 · Organic Fleece 79 · Organic Waffle 13 · Merino 10 |
| Dyes | Nori 4 · Wisteria 5 · Balsam 8 · Heather Oat 13 · Peppercorn 3 |

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
- Every card prints one swatch per photographed colourway of the garment, in the reference's own
  rail order (`colorways`, written by `scripts/sync-swatch-order.mjs` from the captured rails): the
  reference prints a dye per sibling, not one per colour group, its lead dye first, and the rail
  never re-sorts when a dye is picked. Hovering or focusing a swatch swaps the card to that
  colourway's own photograph and pose.
- The two editorials sit where the reference puts them: a two-column split after the sixth card of
  page one, a full-width split after the eighteenth, each with its own photograph pair and copy.
- A page past the end prints the reference's own empty line — `No products match your filters.`,
  nothing else — and keeps the pagination, exactly as `/collections/all?page=9` does on the
  reference store. It never clamps back to the last page and quietly re-shows products.
- The quick add fades in: `opacity: 0 → 1` under the reference's own
  `opacity .16s, background-color .25s, color .25s`, with no vertical offset, so a card's lower half
  never shifts as the pointer moves across it.
- The swatch rail prints the reference's first four swatches plus its `+N` button; expanding wraps
  the rest and shifts the rail by the reference's own 5.05px, and the current swatch keeps the 1px
  underline the reference draws 10px below the rail. Swatches carry the same 39.5×9.5 box, the same
  `gap: 20px 10px` and the same expanded hit area (`inset: -7.25px 0`).

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

## Order: a shelf prints its own first card

The reference does not sort a collection by the store's Featured ranking. Each collection page is
that collection's own order — `/collections/sweats` opens with the relaxed pocket sweatpant in
mocha, `/collections/tees` with the classic tee in true white, `/collections/the-october-capsule`
with the crossover legging in jet black — while `/collections/all` opens with its own first card.
So:

- `railProducts(handle)` returns the rail in the captured order of the page it came from
  (`data.rails[].slugs`, written by `scripts/apply-reference-collections.mjs`), not in catalogue
  order and not re-ranked.
- Featured — `color: "manual"` in the toolbar, which is what the page renders before any sort —
  keeps that shelf order. `sortShopAll(products, "manual", shelfOrdered)` and
  `sortActivewear(products, "manual", shelfOrdered)` hand the shelf straight back when the grid
  passes `shelfOrdered`; every other sort option (price, newest) still re-ranks the shelf.
- The Activewear rails follow the same rule: `all` is the reference's `/collections/activewear`,
  `leggings` its own child collection, `sports-bras` its own, each in capture order.

`tests/rail-order.test.ts` pins every routed shelf, fabric and dye to its capture, and
`tests/e2e/rail-order.spec.ts` checks the rendered pages lead with their own card.

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
npx tsx --test tests/rail-order.test.ts              # every shelf against its own capture
node verification/tools/rail-order.mjs               # a running storefront, every page, every shelf
node verification/tools/rail-order.mjs https://eltaranisibrand.vercel.app
npm run verify
```

`verification/tools/rail-order.mjs` also accepts a base URL, so the deployed store can be checked
against the same captures: `node verification/tools/rail-order.mjs https://eltaranisibrand.vercel.app`.

## Photography and sale prices

A card paints complete photographs and nothing else, and a hover answers with another pose of the
same dye; a discounted colourway prints the price the reference strikes through in front of the sale
price. Both are measured rather than curated — `docs/photos.md` is the full rule — and both are
rebuilt with the same three steps:

```sh
python3 scripts/scan-photo-poses.py --write          # MediaPipe pose, measured inside the card's crop
node scripts/fetch-reference-gallery.mjs --round 1   # buy the whole poses a colourway is short of
node scripts/order-card-frames.mjs                   # tier, order and drop same-pose lookalikes
node scripts/ingest-reference-prices.mjs             # the two prices the reference's own cards print
node scripts/apply-reference-prices.mjs              # write the compare-at where it exists
npx tsx scripts/audit-photos.ts                      # rows, tiers, pose violations
node verification/tools/live-sweep.mjs               # the deployment: fit, load, hover, tier
node verification/tools/shelf-prices.mjs             # which shelves print a struck price
node verification/tools/swatch-sweep.mjs              # every dye's own photograph
npx playwright test tests/e2e/card-fit.spec.ts tests/e2e/sale-price.spec.ts
```

The scan needs MediaPipe (`pip install mediapipe`) and its pose model at `POSE_MODEL` (default
`/tmp/pose.task`); the two `fetch`/`ingest` scripts talk to the reference store and are re-runnable —
a vendored file is named after the sha1 of the URL it came from, so nothing is bought twice.
