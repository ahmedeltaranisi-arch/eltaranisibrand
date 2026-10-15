#!/usr/bin/env node
/**
 * Writes the reference's compare-at prices into the catalogues.
 *
 *   node scripts/apply-reference-prices.mjs [--dry]
 *
 * `scripts/ingest-reference-prices.mjs` records, per colourway, the two prices the reference prints
 * on its own card. A card that prints one usually-costs price struck through in front of the sale
 * price must print it here too, or the `30% OFF` badge this storefront already carries hangs off a
 * single number. The Egyptian figure comes from `usdToReferenceLE` — the same table the catalogue's
 * own prices were converted with — so the two numbers on a card are the two the reference prints and
 * nothing is invented: a handle the reference lists no compare-at for keeps `null` on both fields.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const dry = process.argv.includes("--dry");
const record = JSON.parse(readFileSync(join(ROOT, "src/lib/referencePrices.json"), "utf8"));
const prices = record.prices ?? record;

// The store's converter, read out of the source it is written in rather than copied here.
const source = readFileSync(join(ROOT, "src/lib/mateNewArrivals.ts"), "utf8");
const TABLE = new Map();
const block = /const REFERENCE_EGP[^{]*\{([\s\S]*?)\};/.exec(source)?.[1] ?? "";
for (const match of block.matchAll(/(\d+):\s*(\d+)/g)) TABLE.set(Number(match[1]), Number(match[2]));
if (TABLE.size === 0) throw new Error("the Egyptian price table in src/lib/mateNewArrivals.ts could not be read");
const RATE = Number(/amount \* ([0-9.]+)\)/.exec(source)?.[1] ?? "76.61");
const usdToReferenceLE = (amount) => (TABLE.has(amount) ? TABLE.get(amount) : Math.round(amount * RATE));

const CATALOGS = ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"];
let written = 0;
let cleared = 0;
let missing = 0;
for (const name of CATALOGS) {
  const file = join(ROOT, "src/lib", name);
  const data = JSON.parse(readFileSync(file, "utf8"));
  const products = Array.isArray(data) ? data : data.products;
  for (const product of products) {
    const entry = prices[product.slug];
    if (entry && entry.priceUSD != null && Math.round(entry.priceUSD) !== Math.round(product.priceUSD)) missing += 1;
    const compareAt = entry?.compareAtUSD ?? null;
    if (compareAt) {
      const next = { compareAtUSD: compareAt, compareAtLE: usdToReferenceLE(compareAt) };
      if (product.compareAtUSD !== next.compareAtUSD || product.compareAtLE !== next.compareAtLE) {
        Object.assign(product, next);
        written += 1;
      }
      continue;
    }
    if (product.compareAtUSD != null || product.compareAtLE != null) {
      product.compareAtUSD = null;
      product.compareAtLE = null;
      cleared += 1;
    }
  }
  if (!dry) writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}
console.log(`${dry ? "would write" : "wrote"} ${written} compare-at prices · ${cleared} cleared that the reference does not print · ${missing} rows whose US price disagrees with the reference's card`);
