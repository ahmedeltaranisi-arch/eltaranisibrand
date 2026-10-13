import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { HOME_RAIL_SIZE, homeCardColorways, homeCategoryTiles, homeRails } from "../src/lib/homeRails";
import { mateNewArrivals } from "../src/lib/mateNewArrivals";
import { mateBestSellers, tabProducts } from "../src/lib/mateBestSellers";

const rails = homeRails();

test("the home rails are the verified catalogue, eight photographed colorways each", () => {
  assert.deepEqual(rails.map((rail) => rail.key), ["new-arrivals", "best-sellers", "fleece-edit"]);
  assert.equal(mateNewArrivals.length >= HOME_RAIL_SIZE, true);
  for (const rail of rails) {
    assert.equal(rail.products.length, HOME_RAIL_SIZE, rail.key);
    assert.equal(new Set(rail.products.map((p) => p.slug)).size, HOME_RAIL_SIZE, rail.key);
    for (const product of rail.products) {
      // A card without its own photograph or without stock is never rendered on the home page.
      assert.ok(product.images.length > 0, product.slug);
      assert.ok(product.availableSizes.length > 0, product.slug);
      assert.ok(product.color.hex.startsWith("#"), product.slug);
      assert.ok(rails.every((other) => other.products.some((p) => p !== product)), rail.key);
    }
  }
  // Each rail really is its collection: arrivals first, best-selling order, then the sweats edit.
  assert.deepEqual(rails[0].products.map((p) => p.slug), mateNewArrivals.slice(0, HOME_RAIL_SIZE).map((p) => p.slug));
  assert.deepEqual(
    rails[2].products.map((p) => p.slug),
    tabProducts("sweats")
      .sort((a, b) => a.featuredRank - b.featuredRank)
      .slice(0, HOME_RAIL_SIZE)
      .map((p) => p.slug),
  );
  for (const product of rails[1].products) assert.ok(mateBestSellers.includes(product));
});

test("every home swatch is the same style with its own colour photograph and pose", () => {
  for (const rail of rails) {
    for (const product of rail.products) {
      const colorways = homeCardColorways(product);
      assert.ok(colorways.length >= 1, product.slug);
      const frames = new Set<string>();
      for (const colorway of colorways) {
        assert.equal(colorway.style, product.style, `swatch must keep the same garment: ${product.slug} -> ${colorway.slug}`);
        assert.ok(colorway.images.length > 0, colorway.slug);
        assert.ok(colorway.availableSizes.length > 0, colorway.slug);
        frames.add(colorway.images[0]);
      }
      // Distinct first frames = picking a colour actually changes the dyed garment on the model,
      // instead of re-tinting the same shot.
      assert.equal(frames.size, colorways.length, `${product.slug} colourways must each own a frame`);
      const hexes = new Set(colorways.map((colorway) => colorway.color.hex));
      assert.equal(hexes.size, colorways.length, `${product.slug} colourways must differ in colour`);
    }
  }
  // Multi-colour cards exist, otherwise the swatch row would be decoration.
  const swappable = rails.flatMap((rail) => rail.products).filter((p) => homeCardColorways(p).length > 1);
  assert.ok(swappable.length >= 8, "home rails need colourways to switch between");
});

test("the category trio counts exactly what its own landing page reports", () => {
  assert.deepEqual(homeCategoryTiles().map((tile) => tile.count), [
    tabProducts("activewear").length,
    mateBestSellers.length,
    tabProducts("sweats").length,
  ]);
  for (const tile of homeCategoryTiles()) assert.ok(tile.image.startsWith("/img/"), tile.image);

  const en = JSON.parse(readFileSync("messages/en.json", "utf8")).home as Record<string, never>;
  const ar = JSON.parse(readFileSync("messages/ar.json", "utf8")).home as Record<string, never>;
  const hrefs = (en.categories as unknown as { items: { href: string }[] }).items.map((item) => item.href);
  assert.deepEqual(hrefs, (ar.categories as unknown as { items: { href: string }[] }).items.map((item) => item.href));
  // Every tile lands on the page whose grid holds that many products.
  assert.equal(hrefs[0], "/collections/best-sellers?tab=activewear");
  assert.equal(hrefs[1], "/collections/best-sellers");
  assert.equal(hrefs[2], "/collections/best-sellers?tab=sweats");
});

test("the home page renders the collection card, not the legacy frame-guessing one", () => {
  const page = readFileSync("src/app/[locale]/page.tsx", "utf8");
  assert.match(page, /import MateHomeRails from "@\/components\/MateHomeRails"/);
  assert.match(page, /homeRails\(\)/);
  assert.ok(!page.includes("productsByCollection"), "home must not read the unverified legacy catalogue");
  assert.ok(!page.includes("ProductTabs"), "the legacy tabs component is retired on the home page");

  const component = readFileSync("src/components/MateHomeRails.tsx", "utf8");
  assert.match(component, /import MateProductCard from "\.\/MateProductCard"/);
  assert.match(component, /<MateProductCard /);
  assert.match(component, /<ArrivalQuickAdd /);
  // Rail labels and the "View all" target come from props, so copy stays in the messages files.
  assert.match(page, /label: tt\(rail\.labelKey\)/);
  assert.match(page, /viewAll=\{tcommon\("viewAll"\)\}/);
});
