import assert from "node:assert/strict";
import test from "node:test";
import {
  SHOP_ALL_CATEGORIES, SHOP_ALL_COLOR_GROUPS, SHOP_ALL_DYES, SHOP_ALL_FABRICS, SHOP_ALL_ROUTES,
  SHOP_ALL_SIZE_FACETS, SHOP_ALL_TABS, filterShopAll, groupOf, offeredCategories, offeredColorGroups,
  railProducts, readShopAllState, shopAllColorways, shopAllFacetCounts, shopAllProducts, shopAllQuery,
  sizeMatches, sortShopAll,
} from "../src/lib/shopAll";
import { PAGE_SIZE } from "../src/lib/mateNewArrivals";

const blank = { categories: [], sizes: [], colors: [] };

test("shop all is the union of both captures, one row per photographed colorway", () => {
  assert.equal(shopAllProducts.length, 191);
  assert.equal(new Set(shopAllProducts.map((product) => product.slug)).size, 191);
  // The Activewear capture's own products are all reachable here.
  assert.ok(shopAllProducts.some((product) => product.slug === "organic-stretch-biker-short-jet-black"));
  // Every row ships real photography and a real purchase choice.
  for (const product of shopAllProducts) {
    assert.ok(product.images.length > 0, `${product.slug} has no photograph`);
    assert.ok(product.availableSizes.length > 0, `${product.slug} has no available size`);
  }
});

test("every rail holds real products and is discoverable from the header", () => {
  const counts = Object.fromEntries(SHOP_ALL_TABS.map((tab) => [tab.id, railProducts(tab.handle).length]));
  assert.deepEqual(counts, { all: 191, activewear: 78, tees: 14, sweats: 77, intimates: 19, sleep: 18 });
  // The Organic Stretch fabric rail is its own collection, so it cannot shadow Activewear.
  assert.equal(railProducts("organic-stretch").length, 77);
  assert.equal(railProducts("activewear").length, 78);
  for (const tab of SHOP_ALL_TABS) assert.ok(railProducts(tab.handle).length > 0, `${tab.handle} is empty`);
  assert.ok(SHOP_ALL_FABRICS.length > 0);
  assert.ok(SHOP_ALL_DYES.length > 0);
  // Activewear keeps its own dedicated page; every other routed rail renders a non-empty grid.
  assert.equal(SHOP_ALL_ROUTES.includes("activewear"), false);
  for (const handle of SHOP_ALL_ROUTES) {
    assert.ok(railProducts(handle).length > 0, `/collections/${handle} would render an empty grid`);
    assert.ok(SHOP_ALL_TABS.some((tab) => tab.handle === handle) || SHOP_ALL_FABRICS.some((rail) => rail.handle === handle) || SHOP_ALL_DYES.some((rail) => rail.handle === handle) || ["tees", "sweats", "intimates", "sleep", "socks", "october-capsule", "getaway-edit", "cozy-shop", "bundle-and-save", "sweatshirts", "sweatpants", "sweaters", "bottoms"].includes(handle), handle);
  }
});

test("facet counts are derived from the catalogue, never typed in", () => {
  const counts = shopAllFacetCounts(shopAllProducts, blank);
  const facetTotal = Object.values(counts.categories).reduce((a, b) => a + b, 0);
  const colorTotal = Object.values(counts.colors).reduce((a, b) => a + b, 0);
  // One colorway (Chili Oil) carries neither a category nor a colour group on the reference
  // store either, so it stays in the grid and out of every facet row.
  const uncategorised = shopAllProducts.filter((product) => !product.category).length;
  assert.equal(uncategorised, 1);
  assert.equal(facetTotal, shopAllProducts.length - uncategorised);
  assert.equal(colorTotal, shopAllProducts.length - uncategorised);
  assert.equal(counts.categories.leggings, 34);
  assert.equal(counts.categories["sports-bras"], 19);
  assert.equal(counts.categories.sweatshirts, 38);
  assert.equal(counts.sizes.XS > 0, true);
  // A facet never counts a value the drawer does not offer.
  for (const value of Object.keys(counts.categories)) assert.ok(SHOP_ALL_CATEGORIES.includes(value), value);
  for (const value of Object.keys(counts.colors)) assert.ok(SHOP_ALL_COLOR_GROUPS.includes(value), value);
  for (const value of Object.keys(counts.sizes)) assert.ok(SHOP_ALL_SIZE_FACETS.includes(value), value);
});

test("the size rows use the captured variants, and the twelve reference rows stay in order", () => {
  assert.deepEqual([...SHOP_ALL_SIZE_FACETS], ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "1X", "2X", "3X", "OS"]);
  const socks = shopAllProducts.filter((product) => product.category === "socks");
  assert.ok(socks.length > 0);
  for (const sock of socks) assert.equal(sizeMatches(sock, "S/M"), true);
  assert.equal(filterShopAll(shopAllProducts, { ...blank, sizes: ["OS"] }).length, 1);
  assert.equal(filterShopAll(shopAllProducts, { ...blank, sizes: ["XXL"] }).length, 0);
});

test("filtering is OR within a facet and AND across facets, like every other collection", () => {
  const leggings = filterShopAll(shopAllProducts, { ...blank, categories: ["leggings"] });
  assert.equal(leggings.length, 34);
  assert.ok(leggings.every((product) => product.category === "leggings"));
  const green = filterShopAll(shopAllProducts, { ...blank, colors: ["Green"] });
  const greenLeggings = filterShopAll(shopAllProducts, { ...blank, categories: ["leggings"], colors: ["Green"] });
  assert.ok(greenLeggings.length <= Math.min(leggings.length, green.length));
  assert.ok(greenLeggings.every((product) => groupOf(product) === "Green" && product.category === "leggings"));
  // A facet that the current rail cannot offer is never listed.
  const tees = railProducts("tees");
  assert.equal(offeredCategories(tees).includes("socks"), false);
  assert.ok(offeredColorGroups(tees).every((group) => tees.some((product) => groupOf(product) === group)));
});

test("sorting uses the captured reference ranks", () => {
  const byPrice = sortShopAll(shopAllProducts, "price-ascending");
  for (let index = 1; index < byPrice.length; index += 1) {
    assert.ok(byPrice[index].priceLE >= byPrice[index - 1].priceLE);
  }
  const newest = sortShopAll(shopAllProducts, "created-descending");
  assert.equal(newest[0].newestRank, Math.min(...shopAllProducts.map((product) => product.newestRank)));
  assert.equal(sortShopAll(shopAllProducts, "manual")[0].featuredRank, Math.min(...shopAllProducts.map((product) => product.featuredRank)));
  assert.ok(Math.ceil(shopAllProducts.length / PAGE_SIZE) > 1, "the collection pages like the reference");
});

test("the reference's own query names round-trip through the URL state", () => {
  const params = new URLSearchParams("sort_by=price-ascending&filter.p.t.category=aa-1-1-1-2&filter.v.option.size=L&filter.p.m.custom.parent_color=Green&page=2");
  const state = readShopAllState(params);
  assert.deepEqual(state.categories, ["leggings"]);
  assert.deepEqual(state.sizes, ["L"]);
  assert.deepEqual(state.colors, ["Green"]);
  assert.equal(state.sort, "price-ascending");
  assert.equal(state.page, 2);
  assert.equal(shopAllQuery(state), "sort_by=price-ascending&filter.p.t.category=aa-1-1-1-2&filter.v.option.size=L&filter.p.m.custom.parent_color=Green&page=2");
  // An unknown value is dropped rather than trusted.
  assert.deepEqual(readShopAllState(new URLSearchParams("filter.p.m.custom.parent_color=Magenta")).colors, []);
});

test("a card's swatch row prints one dye per colour group and opens on its own photograph", () => {
  const card = shopAllProducts.find((product) => product.style === "organic-stretch-sports-bra")!;
  const row = shopAllColorways(card);
  const groups = row.map((colorway) => groupOf(colorway));
  assert.equal(new Set(groups).size, groups.length);
  assert.equal(row[0].slug, card.slug);
  for (const colorway of row) {
    assert.equal(colorway.style, card.style);
    assert.ok(colorway.images.length > 0);
  }
  // A garment photographed in one colour offers exactly that colour.
  const single = shopAllProducts.find((product) => shopAllColorways(product).length === 1);
  assert.ok(single, "the catalogue holds at least one single-colour garment");
});
