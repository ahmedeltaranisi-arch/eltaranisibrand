# Home rails on the verified catalogue

The home page's three product rails ("New arrivals", "Best sellers", "The fleece edit") and the
"Clean comfort" category trio read the same verified capture the collection pages filter on
(`src/lib/homeRails.ts` → `newArrivalsCatalog.json`), rendered with the shared `MateProductCard`.

Why: the home grids were the last place still building themselves from `src/lib/catalog.ts`, the
hand-kept lookbook set — 12 styles and 21 colourways after `ff80487` priced them, against the 107
the shop actually carries — with four swatches per style and its own USD price list. A home card
could therefore offer a dye no other page sells, price it differently from the product page the
card links to, and answer "pick a colour" with a photograph chosen by filename convention rather
than by the catalogue the rest of the storefront is measured against.

With `MateProductCard` the home follows the collection's rules instead: a swatch exists only when
that colourway has its own photography (`productColorways`), clicking or hovering it loads that
colourway's own first frame — same garment, same dye, the model in that shot's pose — the media
advances to the *next pose of the same colourway* on hover, the title link and the quick add
follow the colour on screen, and the prices are the captured ones. The trio's counts
(`33 / 107 / 47`) are the live product counts of the pages they link to
(`/collections/best-sellers?tab=activewear|…|tab=sweats`), asserted in `tests/home-rails.test.ts`
and `tests/e2e/home-colors.spec.ts`.
