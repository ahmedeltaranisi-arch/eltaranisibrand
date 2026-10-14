import assert from "node:assert/strict";
import test from "node:test";
import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import { isProductOnly, isWholePose, needsFullFigure, selectFrames } from "../src/lib/photoSelection";
import poses from "../src/lib/photoPoses.json";
import arrivalSnapshot from "../src/lib/newArrivalsCatalog.json";
import activewearSnapshot from "../src/lib/activewearCatalog.json";
import shopAllSnapshot from "../src/lib/shopAllCatalog.json";
import { hasUsablePhotography, hoverFrame } from "../src/lib/photoSelection";

type RawProduct = { slug: string; images: string[]; category: string };

const measured = poses as unknown as Record<string, [number, number]>;

const catalogs = [
  ["activewear", activewearProducts],
  ["new arrivals", arrivalCatalog],
  ["shop all", shopAllProducts],
] as const;

test("every card in every collection leads with a whole photograph of the model", () => {
  for (const [name, products] of catalogs) {
    for (const product of products) {
      assert.ok(product.images.length > 0, `${name}: ${product.slug} has no photograph`);
      const hero = product.images[0];
      const whole = isWholePose(hero, product.category);
      assert.equal(
        whole,
        true,
        `${name}: ${product.slug} leads with ${hero} (${whole === false ? "a crop" : "an unmeasured frame"})`,
      );
      assert.ok(measured[hero], `${name}: ${hero} was never measured`);
    }
  }
});

test("a colourway is dropped when none of its photographs shows the whole model", () => {
  // The scan measured every photograph once: a colourway whose frames are all crops (bras shot
  // from the waist up, a unitard with the feet out of frame, a legging photographed as a flat
  // still) has no hero to show, so it leaves the catalogue instead of shipping a crop.
  const cases = [
    ["arrivals", arrivalSnapshot as RawProduct[], arrivalCatalog],
    ["activewear", (activewearSnapshot as { products: RawProduct[] }).products, activewearProducts],
    ["shop all", (shopAllSnapshot as { products: RawProduct[] }).products, shopAllProducts],
  ] as const;
  let dropped = 0;
  for (const [name, raw, kept] of cases) {
    const keptSlugs = new Set(kept.map((product) => product.slug));
    for (const product of raw) {
      const usable = hasUsablePhotography(product.images, product.category);
      assert.equal(
        keptSlugs.has(product.slug),
        usable,
        `${name}: ${product.slug} is ${usable ? "missing from" : "still inside"} the catalogue`,
      );
      if (!usable) dropped += 1;
    }
  }
  assert.equal(dropped, 9, "nine colourways have no whole photograph anywhere");
  assert.equal(arrivalCatalog.length, 176);
  assert.equal(activewearProducts.length, 90);
  assert.equal(shopAllProducts.length, 202);
});

test("every card swaps only between whole photographs of the same colourway", () => {
  for (const [name, products] of catalogs) {
    for (const product of products) {
      const hero = product.images[0];
      const alternate = hoverFrame(product.images, product.category, hero);
      if (!alternate) continue;
      assert.notEqual(alternate, hero, `${name}: ${product.slug}`);
      assert.equal(isWholePose(alternate, product.category), true, `${name}: ${product.slug} → ${alternate}`);
    }
  }
});

test("selectFrames keeps every frame, lifting whole photographs ahead of the crops", () => {
  const product = activewearProducts[0];
  const selection = selectFrames([...product.images].reverse(), product.category);
  assert.deepEqual([...selection.images].sort(), [...product.images].sort());
  assert.equal(new Set(selection.images).size, selection.images.length);
  assert.equal(selection.images[0], selected(selection, product.category));
});

function selected(selection: { images: string[] }, category: string) {
  for (const src of selection.images) if (isWholePose(src, category) === true) return src;
  return selection.images[0];
}

test("a bottom category needs the feet in frame, a top category needs the waist, socks need neither", () => {
  assert.equal(needsFullFigure("leggings"), true);
  assert.equal(needsFullFigure("sweatpants"), true);
  assert.equal(needsFullFigure("sports-bras"), false);
  assert.equal(isProductOnly("socks"), true);
  // A waist-up frame is a complete photograph of a bra but not of a legging.
  const torsoOnly = Object.entries(measured).find(([, flags]) => flags[0] === 1 && flags[1] === 0);
  assert.ok(torsoOnly, "the measurement holds at least one torso-only frame");
  assert.equal(isWholePose(torsoOnly![0], "sports-bras"), true);
  assert.equal(isWholePose(torsoOnly![0], "leggings"), false);
});
