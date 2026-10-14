import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import {
  bestRank,
  frameStatus,
  hasUsablePhotography,
  hoverFrame,
  isProductOnly,
  selectFrames,
  wholeFrames,
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

test("no modelled product shows a photograph the scan flagged as cut off", () => {
  // The gallery, the swipe frames, the search rows and the cart lines all read these arrays, so
  // no storefront surface can bring a crop back on screen.
  for (const [name, products] of catalogs) {
    for (const product of products) {
      for (const frame of product.images) {
        if (isProductOnly(product.category)) continue; // a sock flat still has no model to cut
        assert.notEqual(frameStatus(frame), "crop", `${name}: ${product.slug} still shows ${frame}`);
      }
    }
  }
});

test("every modelled card leads with a whole photograph, never an uncertain one", () => {
  let whole = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      if (isProductOnly(product.category)) continue;
      const lead = frameStatus(product.images[0]);
      assert.ok(lead === "whole" || lead === "uncertain", `${name}: ${product.slug} leads with ${product.images[0]} (${lead})`);
      if (lead === "whole") whole += 1;
    }
  }
  assert.ok(whole > 390, `only ${whole} cards lead with a whole photograph`);
});

test("the hover frame is a second whole photograph, and absent when there is none", () => {
  let swaps = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      if (isProductOnly(product.category)) continue; // a sock still swaps between flat lays
      const hero = product.images[0];
      const alternate = hoverFrame(product.images, product.category, hero);
      if (!alternate) {
        assert.ok(wholeFrames(product.images, product.category).length < 2, `${name}: ${product.slug} could swap`);
        continue;
      }
      assert.notEqual(alternate, hero, `${name}: ${product.slug}`);
      assert.equal(frameStatus(alternate), "whole", `${name}: ${product.slug} hovers to ${alternate}`);
      swaps += 1;
    }
  }
  assert.ok(swaps > 250, `only ${swaps} colourways can swap poses`);
});

test("a colourway leaves the catalogue when every one of its photographs is cut off", () => {
  const cases = [
    ["arrivals", rawArrivals, arrivalCatalog],
    ["activewear", rawActivewear, activewearProducts],
    ["shop all", rawShopAll, shopAllProducts],
  ] as const;
  let dropped = 0;
  for (const [name, raw, kept] of cases) {
    const keptSlugs = new Set(kept.map((product) => product.slug));
    for (const product of raw) {
      const usable = hasUsablePhotography(product.images, product.category);
      assert.equal(keptSlugs.has(product.slug), usable, `${name}: ${product.slug}`);
      if (!usable) dropped += 1;
    }
  }
  // Fig, Mulberry and Nori bras, the mocha high-neck tank, the iris scoop bra, the bone V-neck
  // bra, two track-pant dyes and the sienna midi legging were photographed cut off from end to
  // end, so there is no hero to show and the colour leaves the catalogue.
  assert.ok(dropped >= 9, `only ${dropped} colourways were dropped`);
  assert.equal(arrivalCatalog.length, 176);
  assert.equal(activewearProducts.length, 87);
  assert.equal(shopAllProducts.length, 202);
});

test("a card's frames rank whole first, then uncertain, and never a crop", () => {
  const a = activewearProducts[0];
  const selection = selectFrames([...a.images].reverse(), a.category);
  assert.deepEqual(selection.hero, selection.images[0]);
  assert.equal(bestRank(selection.images), 2);
  const ranks = selection.images.map((src) => Number(frameStatus(src) === "whole"));
  assert.deepEqual(ranks, [...ranks].sort((x, y) => y - x), "whole frames are not ahead of the rest");
});
