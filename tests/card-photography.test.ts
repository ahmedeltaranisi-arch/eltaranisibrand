import assert from "node:assert/strict";
import test from "node:test";
import {
  VERIFIED_FRAMES, colorwayFrames, colorwayShots, getProductBySlug, getColorway,
  productSlugs, products,
} from "../src/lib/catalog";

/**
 * The shoot is a lookbook: one photograph answers for several garments and is filed under
 * several family names. These assertions keep the shop from exploiting that — a colourway may
 * only ever render its own family's frames, and no two products may share a frame.
 */
const FAMILIES: Record<string, string> = {
  "organic-jersey-sports-bra": "bra",
  "organic-jersey-scoop-bra": "scoop",
  "organic-jersey-midi-legging": "legging",
  "organic-jersey-crossover-legging": "crossover",
  "organic-jersey-high-neck-tank": "tank",
  "organic-pima-layering-tank": "layering",
  "organic-jersey-long-sleeve-top": "lst",
  "organic-fleece-zip-hoodie": "hoodie",
  "organic-fleece-relaxed-sweatpant": "pant",
  "organic-fleece-polo-sweatshirt": "polo",
  "organic-stretch-biker-short": "biker",
  "organic-cotton-crew-socks-3pk": "sock",
};

test("every style ships exactly the colourways the archive photographed, and no invented ones", () => {
  assert.deepEqual(Object.keys(FAMILIES).sort(), [...new Set(products.map((p) => p.baseSlug))].sort());
  for (const product of products) {
    const verified = VERIFIED_FRAMES[product.baseSlug] ?? [];
    assert.ok(verified.length > 0, `${product.baseSlug} would have no photography at all`);
    assert.deepEqual(product.colorways.map((c) => c.name), verified.map(([tone]) => tone), product.baseSlug);
    assert.equal(new Set(verified.map(([tone]) => tone)).size, verified.length, product.baseSlug);
  }
});

test("a colourway only ever renders its own garment family's frames", () => {
  for (const [base, entries] of Object.entries(VERIFIED_FRAMES)) {
    const family = FAMILIES[base];
    assert.ok(family, `${base} has no declared photograph family`);
    for (const [tone, stems] of entries) {
      assert.ok(stems.length > 0, `${base}/${tone} lists no frame`);
      for (const stem of stems) {
        assert.ok(/^(.+)-(\d+)$/.test(stem), `${stem} is not a <family>-<tone>-<n> stem`);
        assert.ok(
          stem.startsWith(`${family}-`),
          `${base} borrowed ${stem} from another garment family`,
        );
        const foreign = Object.entries(FAMILIES).filter(([other, otherFamily]) => other !== base && stem.startsWith(`${otherFamily}-`));
        assert.deepEqual(foreign.map(([other]) => other), [], `${stem} belongs to ${foreign.map(([o]) => o).join(", ")}, not ${base}`);
      }
    }
  }
});

test("no photograph is handed to two products", () => {
  const seen = new Map<string, string>();
  for (const [base, entries] of Object.entries(VERIFIED_FRAMES)) {
    for (const [, stems] of entries) {
      for (const stem of stems) {
        assert.ok(!seen.has(stem), `${stem} is used by ${seen.get(stem)} and ${base}`);
        seen.set(stem, base);
      }
    }
  }
});

test("card and gallery frames, swatch routes and hover pose stay in sync", () => {
  for (const product of products) {
    assert.ok(product.image.startsWith("/img/shots/"), product.baseSlug);
    assert.equal(product.image, colorwayFrames(product, product.colorways[0].name)[0]);
    for (const colorway of product.colorways) {
      const frames = colorwayFrames(product, colorway.name);
      const { front, back } = colorwayShots(product, colorway.name);
      assert.equal(front, frames[0], `${product.baseSlug}/${colorway.name} front`);
      // A lone frame is shown twice rather than being padded with another colourway's pose.
      assert.equal(back, frames[1] ?? frames[0], `${product.baseSlug}/${colorway.name} hover pose`);
      const slug = `${product.baseSlug}-${colorway.name}`;
      assert.ok(productSlugs.includes(slug), slug);
      assert.equal(getProductBySlug(slug)?.baseSlug, product.baseSlug, slug);
      assert.equal(getColorway(slug)?.hex, colorway.hex, slug);
    }
  }
  assert.equal(productSlugs.length, products.reduce((sum, p) => sum + p.colorways.length, 0));
});

test("swatch colours stay the archive's measured dyes", () => {
  const expected: Record<string, string> = {
    jet: "#111111", fig: "#4e2138", bone: "#f3efea", heather: "#e1e0e5",
    nori: "#26322b", midnight: "#364450", mocha: "#412d2c",
  };
  for (const product of products) {
    for (const colorway of product.colorways) {
      assert.equal(colorway.hex, expected[colorway.name], `${product.baseSlug}/${colorway.name}`);
    }
  }
});
