#!/usr/bin/env node
/**
 * Puts the catalogue in the reference store's own Featured order.
 *
 *   node scripts/apply-reference-order.mjs
 *
 * `relay/reference-grid.json` is a page-by-page capture of `/collections/all`, so its card order is
 * the order the reference renders with `sort_by=manual` — the Featured order a shopper lands on.
 * Every colourway this repository carries takes that position; a colourway the reference's All
 * collection does not list (our own remaining colourways, and the sale shelf's) keeps its relative
 * order after them rather than being dropped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG = join(ROOT, "src/lib/shopAllCatalog.json");
const GRID = join(ROOT, "relay/reference-grid.json");

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const grid = JSON.parse(readFileSync(GRID, "utf8"));
const position = new Map(grid.cards.map((card, index) => [card.handle, index]));

catalog.products.sort((a, b) => {
  const left = position.has(a.slug) ? position.get(a.slug) : Number.MAX_SAFE_INTEGER;
  const right = position.has(b.slug) ? position.get(b.slug) : Number.MAX_SAFE_INTEGER;
  if (left !== right) return left - right;
  return a.featuredRank - b.featuredRank;
});
catalog.products.forEach((product, index) => { product.featuredRank = index; });

writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
const onPageOne = catalog.products.slice(0, 48).filter((product) => position.has(product.slug)).length;
console.log(`catalogue ordered: ${catalog.products.length} colourways | reference cards matched in the first 48: ${onPageOne}`);
