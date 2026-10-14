import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import statuses from "../src/lib/photoPoses.json";
import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import {
  displayFrames,
  frameStatus,
  hoverFrame,
  isProductOnly,
  isReferenceCardFrame,
  pooledFrames,
  selectFrames,
} from "../src/lib/photoSelection";

type RawProduct = { slug: string; images: string[]; category: string };
const rawArrivals = JSON.parse(readFileSync("src/lib/newArrivalsCatalog.json", "utf8")) as RawProduct[];
const rawActivewear = (JSON.parse(readFileSync("src/lib/activewearCatalog.json", "utf8")) as { products: RawProduct[] }).products;
const rawShopAll = (JSON.parse(readFileSync("src/lib/shopAllCatalog.json", "utf8")) as { products: RawProduct[] }).products;

const catalogs = [
  ["activewear", activewearProducts],
  ["new arrivals", arrivalCatalog],
  ["shop all", shopAllProducts],
] as const;

test("no surface can render a photograph the scan flagged as cut off", () => {
  // Cards, the product gallery, the swipe frames, the search rows and the cart lines all read
  // these arrays, so a crop cannot come back on screen anywhere.
  for (const [name, products] of catalogs) {
    for (const product of products) {
      for (const frame of product.images) {
        if (isProductOnly(product.category)) continue; // a sock flat still has no model to cut
        assert.equal(frameStatus(frame), "whole", `${name}: ${product.slug} still shows ${frame}`);
      }
    }
  }
});

test("every card leads with a complete photograph and swaps to a second one", () => {
  let cards = 0;
  let swaps = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      if (isProductOnly(product.category)) continue;
      assert.ok(product.images.length > 0, `${name}: ${product.slug} has no complete photograph`);
      assert.equal(frameStatus(product.images[0]), "whole", `${name}: ${product.slug}`);
      cards += 1;
      const alternate = hoverFrame(product.images, product.category, product.images[0]);
      if (!alternate) continue;
      assert.notEqual(alternate, product.images[0], `${name}: ${product.slug}`);
      assert.equal(frameStatus(alternate), "whole", `${name}: ${product.slug} → ${alternate}`);
      swaps += 1;
    }
  }
  assert.ok(cards > 400, `only ${cards} cards render`);
  assert.ok(swaps > 250, `only ${swaps} colourways can swap poses`);
});

test("a colourway renders the reference's own frames, and only whole frames otherwise", () => {
  const cases = [
    ["arrivals", rawArrivals, arrivalCatalog],
    ["activewear", rawActivewear, activewearProducts],
    ["shop all", rawShopAll, shopAllProducts],
  ] as const;
  let dropped = 0;
  const droppedSlugs: string[] = [];
  for (const [name, raw, kept] of cases) {
    const keptSlugs = new Set(kept.map((product) => product.slug));
    for (const product of raw) {
      const pooled = pooledFrames(product.slug, product.images);
      const usable = isProductOnly(product.category) || displayFrames(pooled, product.category).length > 0;
      assert.equal(
        keptSlugs.has(product.slug),
        usable,
        `${name}: ${product.slug} is ${usable ? "missing from" : "still inside"} the catalogue`,
      );
      if (!usable) { dropped += 1; droppedSlugs.push(product.slug); }
    }
  }
  // The reference's own card frames count as complete — its photography is the standard this
  // storefront follows — so no row of the rebuilt catalogue loses its only photograph.
  assert.equal(dropped, 0, "every catalogue row keeps at least one frame the reference renders");
  assert.equal(new Set(droppedSlugs).size, 0);
  assert.equal(arrivalCatalog.length, 177);
  assert.equal(activewearProducts.length, 95);
  assert.equal(shopAllProducts.length, 377);
  // The measured crops are still crops: a frame the scan flagged is only kept when the reference
  // ships exactly that frame on its own product card.
  const crops = Object.entries(statuses as unknown as Record<string, number>)
    .filter(([, status]) => status === 0)
    .map(([src]) => src);
  assert.ok(crops.length > 0, "the scan recorded the crops it measured");
  for (const crop of crops) {
    assert.equal(frameStatus(crop), isReferenceCardFrame(crop) ? "whole" : "crop", crop);
  }
});

test("a colourway is judged on every photograph of that slug, not just its own catalogue", () => {
  // The Activewear capture filed some dyes as waist-up crops while the New Arrivals capture held
  // their full-length pose; pooling gives the dye the photograph it deserves.
  const shared = activewearProducts.find((product) =>
    rawArrivals.some((arrival) => arrival.slug === product.slug && arrival.images.some((image) => !product.images.includes(image))),
  );
  assert.ok(shared, "the two captures disagree about at least one colourway");
  const pooled = pooledFrames(shared.slug, []);
  assert.ok(pooled.length > 0, shared.slug);
  for (const frame of pooled.slice(0, 1)) assert.equal(frameStatus(frame), "whole", frame);
});

test("selectFrames renders only complete photographs and keeps the colourway's order", () => {
  const product = activewearProducts[0];
  const selection = selectFrames(product.images, product.category);
  assert.deepEqual(selection.images, product.images);
  for (const frame of selection.images) assert.equal(frameStatus(frame), "whole", frame);
  assert.equal(selection.hero, selection.images[0]);
});

test("a flat product still carries no model and is never filtered out", () => {
  assert.equal(isProductOnly("socks"), true);
  assert.equal(isProductOnly("leggings"), false);
  const stills = ["/img/aw/12124ed56afe.webp", "/img/aw/dbf7746aaf99.webp"];
  assert.deepEqual(displayFrames(stills, "socks"), stills);
});
