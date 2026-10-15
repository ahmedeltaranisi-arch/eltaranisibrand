import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { arrivalCatalog, formatLE, usdToReferenceLE } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import { activewearProducts } from "../src/lib/activewearCatalog";

/**
 * The price line, checked against the reference's own cards.
 *
 * `scripts/ingest-reference-prices.mjs` records, per colourway, the two numbers the reference prints
 * on its card: the price a shopper pays, and — only where the product carries one — the price it
 * usually costs, struck through in front. `scripts/apply-reference-prices.mjs` copies exactly that
 * into the catalogues, so a `30% OFF` badge never hangs off a single number here while the reference
 * shows two.
 */
const record = JSON.parse(readFileSync("src/lib/referencePrices.json", "utf8")) as { prices?: Record<string, { priceUSD: number | null; compareAtUSD: number | null }> };
const prices = record.prices ?? (record as unknown as Record<string, { priceUSD: number | null; compareAtUSD: number | null }>);

const catalogs = [["shop all", shopAllProducts], ["new arrivals", arrivalCatalog], ["activewear", activewearProducts]] as const;

test("every card prints the US price the reference's own card prints", () => {
  let compared = 0;
  for (const [, products] of catalogs) {
    for (const product of products) {
      const entry = prices[product.slug];
      if (!entry?.priceUSD) continue;
      assert.equal(product.priceUSD, entry.priceUSD, `${product.slug} drifted from the reference's price`);
      compared += 1;
    }
  }
  assert.ok(compared > 590, `only ${compared} cards were checked against the reference's prices`);
});

test("a compare-at price exists exactly where the reference prints one", () => {
  const discounted: string[] = [];
  for (const [name, products] of catalogs) {
    for (const product of products) {
      const expected = prices[product.slug]?.compareAtUSD ?? null;
      assert.equal(product.compareAtUSD ?? null, expected, `${name}: ${product.slug} compare-at`);
      if (expected) {
        // Converted with the store's own table, not a rate invented here.
        assert.equal(product.compareAtLE, usdToReferenceLE(expected), `${name}: ${product.slug} LE conversion`);
        assert.ok((product.compareAtLE ?? 0) > product.priceLE, `${name}: ${product.slug} compares below its own price`);
        if (name === "shop all") discounted.push(product.slug);
      } else {
        assert.equal(product.compareAtLE ?? null, null, `${name}: ${product.slug} invented a compare-at`);
      }
    }
  }
  // The reference discounts seven colourways across the whole catalogue; no more, no fewer.
  assert.deepEqual(discounted.slice().sort(), [
    "organic-comfort-high-waist-brief-3-pack-bone-sand-espresso",
    "organic-comfort-high-waist-brief-3-pack-jet-black",
    "organic-comfort-mid-rise-bikini-3-pack-bone-sand-espresso",
    "organic-comfort-mid-rise-bikini-3-pack-jet-black",
    "organic-cotton-trouser-sock-bone",
    "organic-cotton-trouser-sock-bone-conch-raffia",
    "organic-waffle-crew-top-heather-grey",
  ]);
});

test("the discounted card renders both prices, and the rest render one", () => {
  const waffle = shopAllProducts.find((product) => product.slug === "organic-waffle-crew-top-heather-grey");
  assert.ok(waffle, "the waffle shelf's discounted colourway is gone");
  assert.equal(formatLE(waffle.priceLE), "LE 7,355");
  assert.equal(formatLE(waffle.compareAtLE!), "LE 10,572");
  assert.ok(waffle.badges.some((badge) => /off/i.test(badge)), "its discount badge is gone with the price");
  const plain = shopAllProducts.find((product) => product.slug === "organic-stretch-sports-bra-heather-grey");
  assert.ok(plain && !plain.compareAtLE, "a colourway the reference does not discount must not gain a struck price");
});
