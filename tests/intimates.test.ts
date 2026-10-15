import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import {
  availableIntimatesMenuColors,
  INTIMATES_FEATURED_COLORS,
  INTIMATES_HANDLES,
  INTIMATES_MENU_TILES,
  INTIMATES_TABS,
  intimatesColorway,
  intimatesColorways,
  intimatesProducts,
  intimatesProductsInColor,
} from "../src/lib/intimates";

const capture = (name: string) => {
  const data = JSON.parse(readFileSync(`relay/reference-grid-${name}.json`, "utf8")) as { cards: Array<{ handle: string }> };
  return data.cards.map((card) => card.handle);
};

test("Intimates tabs are backed by the reference's real, photographed product subsets", () => {
  assert.equal(intimatesProducts("intimates").length, 39);
  assert.equal(intimatesProducts("bras-and-tanks").length, 10);
  assert.equal(intimatesProducts("undies").length, 14);
  assert.equal(intimatesProducts("tanks").length, 9);
  assert.equal(intimatesProducts("socks").length, 6);
  assert.equal(intimatesProducts("undie-packs").length, 4);

  for (const handle of INTIMATES_HANDLES) {
    const products = intimatesProducts(handle);
    assert.equal(new Set(products.map((product) => product.slug)).size, products.length, `${handle} repeats a product`);
    for (const product of products) {
      assert.ok(product.images.length > 0, `${product.slug} has no matching photograph`);
      assert.ok(product.availableSizes.length > 0, `${product.slug} has no available size`);
      assert.ok(product.priceLE > 0, `${product.slug} has no real LE price`);
    }
  }
});

test("the All Intimates, Undies, Tanks and Socks shelves keep their captured reference order", () => {
  for (const [handle, source] of [["intimates", "intimates"], ["undies", "undies"], ["tanks", "tanks"], ["socks", "socks"]] as const) {
    const actual = intimatesProducts(handle).map((product) => product.slug);
    const expected = capture(source).filter((slug) => actual.includes(slug));
    assert.deepEqual(actual, expected, `${handle} is not in the captured collection order`);
  }
});

test("Undie Packs are the real four-product subset of Undies, not a fabricated fifth category", () => {
  const undies = new Set(intimatesProducts("undies").map((product) => product.slug));
  const packs = intimatesProducts("undie-packs");
  assert.equal(packs.length, 4);
  assert.ok(packs.every((product) => undies.has(product.slug) && product.slug.includes("-3-pack-")));
});

test("menu colors are exactly the available Intimates dyes and use captured swatch colors", () => {
  const available = availableIntimatesMenuColors();
  assert.deepEqual(available.map((color) => color.key), ["jet-black", "sand", "bone", "espresso", "heather-grey"]);
  for (const color of available) {
    assert.ok(INTIMATES_FEATURED_COLORS.some((candidate) => candidate.key === color.key));
    assert.match(color.hex, /^#[0-9a-f]{6}$/i);
  }
  const products = intimatesProducts("intimates");
  for (const product of products) {
    assert.notEqual(intimatesColorway(product).color.hex, "#d9d9d9", `${product.slug} still uses the placeholder grey swatch`);
  }
});

test("featured color links narrow to the exact available Intimates dye, not its broader color group", () => {
  for (const color of availableIntimatesMenuColors()) {
    const products = intimatesProductsInColor("intimates", color.key);
    assert.ok(products.length > 0, `${color.key} has no product behind its menu link`);
    assert.ok(products.every((product) => product.color.name === color.key), `${color.key} leaks another dye`);
  }
  assert.equal(intimatesProductsInColor("intimates", "not-a-real-dye").length, 0);
});

test("hover swatches stay inside the same garment style and resolve real colorway photos", () => {
  for (const product of intimatesProducts("intimates")) {
    const colorways = intimatesColorways(product);
    assert.ok(colorways.some((colorway) => colorway.slug === product.slug), `${product.slug} is not in its own swatch row`);
    assert.equal(new Set(colorways.map((colorway) => colorway.slug)).size, colorways.length);
    for (const colorway of colorways) {
      assert.equal(colorway.style, product.style, `${product.slug} points to another product style`);
      assert.ok(colorway.images.length > 0, `${colorway.slug} has no product photograph`);
    }
  }
});

test("every Intimates tab, menu tile and editorial image is a supplied local asset", () => {
  assert.deepEqual(INTIMATES_TABS.map((tab) => tab.handle), ["intimates", "bras-and-tanks", "undies", "tanks", "socks", "undie-packs"]);
  for (const path of [
    ...INTIMATES_TABS.map((tab) => tab.image),
    ...INTIMATES_MENU_TILES.map((tile) => tile.image),
    "/img/intimates/editorial-second-skin.jpg",
  ]) {
    assert.ok(existsSync(`public${path}`), `${path} is missing`);
  }
});
