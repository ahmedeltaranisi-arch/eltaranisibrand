# Best Sellers collection

`/en/collections/best-sellers` (and `/ar/...`) reproduces the reference store's Best Sellers
collection — text hero, category rails, filter/sort drawer, four-column grid with mid-grid
editorial, pagination and the shared arrival skin (header, promo, footer, cart).

## Data: nothing on the page is typed in

The page reads the same verified capture as New Arrivals (`src/lib/newArrivalsCatalog.json`,
one photographed colorway per product) and derives every number at request time in
`src/lib/mateBestSellers.ts`:

| Facet | Values (collection-wide counts) |
| --- | --- |
| Collection | 107 colorways |
| Category | Activewear Tops 9 · Headbands 1 · Leggings 15 · Pants 6 · Sports Bras 8 · Sweaters 9 · Sweatpants 29 · Sweatshirts 21 · T-Shirts 6 · Tank Tops 3 (= 107) |
| Size | XS 102 · S 105 · S/M 0 · M 103 · M/L 0 · L 102 · XL 103 · 1X 0 · 2X 0 · 3X 0 · OS 1 |
| Color Group | Beige 4 · Black 10 · Blue 14 · Brown 14 · Green 23 · Grey 11 · Neutral 5 · Pink 9 · Purple 8 · Red 5 · White 4 (= 107) |
| Rails | All Best Sellers 107 · Activewear 33 · Tees 12 · Sweats 47 · Intimates 8 · Sleep 15 |

Rules, matching the filmed reference:

- Counts are always real and self-excluding (a facet counts as if its own selection were
  removed, so alternatives inside the facet stay reachable). OR within a facet, AND across.
- A row with count 0 renders disabled and greyed (`S/M`, `M/L`, `1X`, `2X`, `3X`) — it stays in
  the list because the reference lists it, but it can never be selected.
- A color group with no product in the current rail is removed from the drawer entirely, and
  colorways without their own photography are never offered (shared `productColorways` rule).
- Every card in this collection carries the `Best Seller` badge through `leadingBadges` on
  `MateProductCard`; stored product badges are never mutated, and duplicates collapse.
- `See Results (N)` is the live filtered count, not a static string.

Rail membership is style-based (activewear = the stretch performance line plus the merino
headband; tees = pointelle tees/tanks/cardigan and the fleece polo; sweats = fleece and waffle
sweatpants, hoodies, crewnecks; intimates = the bra styles; sleep = soft knits and lounge
pants), so every rail is non-empty, every style is reachable, and no rail promises a product
this store does not carry. `See Results` and pagination recompute per rail.

## URLs

`?tab=activewear|tees|sweats|intimates|sleep` (absent = all) plus the reference's own
parameters: `sort_by=created-descending|best-selling|price-ascending|price-descending`
(absent = featured order), `filter.p.t.category=<id>`, `filter.v.option.size=<size>`,
`filter.p.m.custom.parent_color=<Group>`, `page=<n>`. Incoming
`filter.p.m.custom.carousel_memberships=gid://shopify/Metaobject/<id>` links resolve to the
matching rail, so shared reference-style URLs keep working.

State is held in React and mirrored into the address bar by
`src/lib/useCollectionUrlState.ts`, so a facet toggle re-renders the grid instantly (as the
reference does) while the URL stays copy-pasteable; any real navigation — Back/Forward, a rail
link, a pasted link — makes the URL authoritative again. This also fixed the same latent bug on
New Arrivals, where `history.replaceState` alone never re-rendered the grid.

## Assets and brand

Rail tiles and the mid-grid editorial are the reference photographs, encoded as small WebP at
`public/img/best-sellers/` (they are served straight from `public/`, which wins over the
`/img/:path*` rewrite, so no pinned-asset bump is needed). Product photography continues to
come from the external image API. All copy uses the Eltaranisi Brand name — the reference
brand string was removed from the arrival promo and FAQ copy, and the footer heading reads
"Join the Eltaranisi Brand world." on every page that shares this footer.

## Verify

```sh
npm run verify          # i18n parity, lint, types, unit tests, build, CSS gate
npm run dev -- --hostname 0.0.0.0
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/best-sellers.spec.ts
```

The Playwright suite asserts the measured geometry (218×281 tiles, 4 columns at 75px/12px
gaps, 333/431 media, 505px drawer, 25px badges, black apply bar), the eleven size rows with
their real counts and disabled zeros, per-rail result counts, all four sort orders, swatch
hover swapping to that colorway's own photograph, hover revealing the next pose, pagination
clamping, quick add into the shared bag, mobile and RTL behaviour, and that no reference brand
name appears as copy.
