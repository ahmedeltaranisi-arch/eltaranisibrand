#!/usr/bin/env node
/**
 * Puts every card's swatch row in the reference's own order.
 *
 *   node scripts/sync-swatch-order.mjs
 *
 * The reference prints one swatch per photographed colourway of the garment, in the rail order it
 * captured — its own dye first, and the same order however many times a dye is picked (`is-current`
 * moves, the rail never re-sorts). Our rows were built before that rail was read, so their
 * `colorways` array was grouped by colour group instead: 163 of the 328 cards opened on a
 * different second swatch than the reference, and a duplicate-group sibling could hide a dye the
 * reference shows in its first four.
 *
 * The captured rails come from `relay/reference-grid.json` (the All collection, the reference's own
 * order) with the per-collection captures filling in any colourway the All page does not carry.
 * Anything this repository carries that the capture did not list is kept, at the end, so a rail can
 * never lose a colourway it can actually photograph.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG = join(ROOT, "src/lib/shopAllCatalog.json");
const RELAY = join(ROOT, "relay");

/** The All capture first, so its order wins; the per-collection captures fill in the rest. */
const FILES = ["reference-grid.json", ...readdirSync(RELAY).filter((name) => /^reference-grid-.*\.json$/.test(name)).sort()];

/** handle → the reference's own swatch rail, in its own order. */
const rails = new Map();
for (const file of FILES) {
  const grid = JSON.parse(readFileSync(join(RELAY, file), "utf8"));
  for (const card of grid.cards ?? []) {
    const order = (card.swatches ?? []).map((swatch) => swatch.handle).filter(Boolean);
    if (order.length && !rails.has(card.handle)) rails.set(card.handle, order);
  }
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
let updated = 0;
let undated = 0;
for (const product of catalog.products) {
  const rail = rails.get(product.slug);
  if (!rail) {
    undated += 1;
    continue;
  }
  const own = product.colorways ?? [];
  const seen = new Set();
  const next = [...rail, ...own].filter((slug) => (seen.has(slug) ? false : (seen.add(slug), true)));
  // The colourway a card opens on is always on its own rail.
  if (!next.includes(product.slug)) next.unshift(product.slug);
  if (JSON.stringify(next) !== JSON.stringify(own)) {
    product.colorways = next;
    updated += 1;
  }
}
writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`swatch rails: ${updated} of ${catalog.products.length} updated from the captures, ${undated} without a captured rail`);
