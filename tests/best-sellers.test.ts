import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import {
  BEST_SELLER_TABS, SIZE_FACETS, bestSellerFacetCounts, bestSellerTabCounts, bestSellersQuery,
  filterBestSellers, mateBestSellers, readBestSellersState, sizeMatches, sortBestSellers, tabProducts,
  type BestSellerTabId,
} from "../src/lib/mateBestSellers";
import { CATEGORIES, COLOR_GROUPS, PAGE_SIZE, formatLE } from "../src/lib/mateNewArrivals";

const blank = { categories: [], sizes: [], colors: [] };

test("best sellers collection is the verified 107 colorways and every rail holds real products", () => {
  assert.equal(mateBestSellers.length, 107);
  const counts = bestSellerTabCounts();
  assert.deepEqual(counts, { all: 107, activewear: 33, tees: 12, sweats: 47, intimates: 8, sleep: 15 });
  for (const tab of BEST_SELLER_TABS) assert.ok(counts[tab.id] > 0, `${tab.id} rail must never be empty`);
  // No rail may reference a style the store does not carry, and nothing in the collection
  // is left undiscoverable.
  const carried = new Set(mateBestSellers.map((product) => product.style));
  const covered = new Set(BEST_SELLER_TABS.filter((tab) => tab.id !== "all").flatMap((tab) => tabProducts(tab.id).map((p) => p.style)));
  assert.deepEqual([...covered].filter((style) => !carried.has(style)), []);
  assert.deepEqual([...carried].filter((style) => !covered.has(style)), []);
  for (const tab of BEST_SELLER_TABS) {
    for (const product of tabProducts(tab.id)) assert.ok(mateBestSellers.includes(product), product.slug);
  }
});

test("facet counts are derived from the data, not typed in", () => {
  const counts = bestSellerFacetCounts(mateBestSellers, blank);
  assert.deepEqual(counts.categories, {
    "activewear-tops": 9, headbands: 1, leggings: 15, pants: 6, "sports-bras": 8,
    sweaters: 9, sweatpants: 29, sweatshirts: 21, "t-shirts": 6, "tank-tops": 3,
  });
  assert.deepEqual(counts.colors, {
    Beige: 4, Black: 10, Blue: 14, Brown: 14, Green: 23, Grey: 11,
    Neutral: 5, Pink: 9, Purple: 8, Red: 5, White: 4,
  });
  assert.equal(Object.values(counts.categories).reduce((a, b) => a + b, 0), 107);
  assert.equal(Object.values(counts.colors).reduce((a, b) => a + b, 0), 107);
});

test("the drawer offers the reference's eleven size rows with real, self-excluding counts", () => {
  assert.deepEqual([...SIZE_FACETS], ["XS", "S", "S/M", "M", "M/L", "L", "XL", "1X", "2X", "3X", "OS"]);
  const counts = bestSellerFacetCounts(mateBestSellers, blank);
  assert.deepEqual(counts.sizes, {
    XS: 102, S: 105, "S/M": 0, M: 103, "M/L": 0, L: 102, XL: 103, "1X": 0, "2X": 0, "3X": 0, OS: 1,
  });
  // Zero rows stay zero: an absent variant never borrows a neighbouring size's count.
  assert.equal(filterBestSellers(mateBestSellers, { ...blank, sizes: ["1X"] }).length, 0);
  assert.equal(filterBestSellers(mateBestSellers, { ...blank, sizes: ["S/M"] }).length, 0);
  assert.equal(filterBestSellers(mateBestSellers, { ...blank, sizes: ["OS"] }).length, 1);
  assert.ok(sizeMatches(mateBestSellers.find((p) => p.category === "headbands")!, "OS"));
  assert.ok(!sizeMatches(mateBestSellers.find((p) => p.category === "headbands")!, "XS"));
  // A selected row is kept in the list so it can still be un-checked, while the other facets
  // re-count against it and drop to zero where the combination is impossible.
  const withColor = bestSellerFacetCounts(mateBestSellers, { ...blank, colors: ["Red"] });
  assert.equal(withColor.colors.Red, 5);
  assert.equal(withColor.categories["tank-tops"], 0);
  assert.equal(filterBestSellers(mateBestSellers, { ...blank, colors: ["Red"], categories: ["tank-tops"] }).length, 0);
  assert.equal(filterBestSellers(mateBestSellers, { ...blank, colors: ["Red"] }).length, 5);
});

test("rails, colour groups and sizes combine as OR within a facet and AND across facets", () => {
  const sweats = tabProducts("sweats");
  assert.equal(filterBestSellers(sweats, { ...blank, sizes: ["XS", "OS"] }).length, sweats.filter((p) => p.availableSizes.includes("XS")).length);
  assert.equal(filterBestSellers(sweats, { ...blank, categories: ["sweatpants", "sweatshirts"] }).length, sweats.filter((p) => p.category === "sweatpants" || p.category === "sweatshirts").length);
  assert.equal(filterBestSellers(sweats, { ...blank, colors: ["Green"] }).length, sweats.filter((p) => p.color.group === "Green").length);
  assert.equal(filterBestSellers(sweats, { ...blank, categories: ["sweatpants"], colors: ["Green"] }).length, sweats.filter((p) => p.category === "sweatpants" && p.color.group === "Green").length);
  const railCounts = bestSellerFacetCounts(sweats, blank);
  // The sweats rail cannot offer headbands or leggings, so those rows are zero and disabled.
  assert.equal(railCounts.categories.headbands, 0);
  assert.equal(railCounts.categories.leggings, 0);
  assert.equal(railCounts.sizes.OS, 0);
  // Colours the rail does not photograph are removed from the UI entirely.
  for (const group of COLOR_GROUPS) {
    const present = sweats.some((product) => product.color.group === group);
    assert.equal((railCounts.colors[group] ?? 0) > 0, present, group);
  }
});

test("every sort option re-orders the grid using the captured ranks and real prices", () => {
  const products = mateBestSellers;
  const isMonotone = (values: number[]) => values.every((value, index) => index === 0 || values[index - 1] <= value);
  assert.ok(isMonotone(sortBestSellers(products, "manual").map((p) => p.featuredRank)));
  assert.ok(isMonotone(sortBestSellers(products, "created-descending").map((p) => p.newestRank)));
  assert.ok(isMonotone(sortBestSellers(products, "best-selling").map((p) => p.bestSellingRank)));
  assert.ok(isMonotone(sortBestSellers(products, "price-ascending").map((p) => p.priceLE)));
  assert.ok(isMonotone(sortBestSellers(products, "price-descending").map((p) => -p.priceLE)));
  assert.notEqual(sortBestSellers(products, "manual")[0].slug, sortBestSellers(products, "created-descending")[0].slug);
  assert.notEqual(sortBestSellers(products, "price-ascending")[0].slug, sortBestSellers(products, "price-descending")[0].slug);
  const cheapest = sortBestSellers(products, "price-ascending")[0];
  assert.equal(formatLE(cheapest.priceLE), "LE 3,678");
  // Sorting a rail keeps the rail's membership.
  const tees = new Set(tabProducts("tees").map((p) => p.slug));
  for (const product of sortBestSellers(tabProducts("tees"), "best-selling")) assert.ok(tees.has(product.slug));
});

test("collection URLs round-trip through the rail, filter and sort parameters", () => {
  const state = readBestSellersState(new URLSearchParams("tab=sleep&sort_by=best-selling&size=XS&color=Green&page=2"));
  assert.deepEqual(state, {
    tab: "sleep", sort: "best-selling", page: 2,
    categories: [], sizes: ["XS"], colors: ["Green"],
  });
  const query = bestSellersQuery(state);
  assert.deepEqual(readBestSellersState(new URLSearchParams(query)), state);
  assert.ok(query.includes("filter.v.option.size=XS"));
  assert.ok(query.includes("filter.p.m.custom.parent_color=Green"));

  // Reference carousel links resolve to the same rails.
  assert.equal(
    readBestSellersState(new URLSearchParams("filter.p.m.custom.carousel_memberships=gid://shopify/Metaobject/286172414130")).tab,
    "sweats",
  );
  assert.equal(readBestSellersState(new URLSearchParams("carousel=activewear")).tab, "activewear");
  // Unknown or empty rails fall back to the full collection, and unknown facets are dropped.
  assert.equal(readBestSellersState(new URLSearchParams("tab=socks")).tab, "all");
  assert.equal(readBestSellersState(new URLSearchParams("size=42&color=Lime")).sizes.length, 0);
  assert.equal(readBestSellersState(new URLSearchParams("size=42&color=Lime")).colors.length, 0);
  assert.equal(bestSellersQuery(readBestSellersState(new URLSearchParams())),"");
  // Category values survive as the reference's own facet parameter names.
  const categoryState = readBestSellersState(new URLSearchParams("category=leggings"));
  assert.deepEqual(categoryState.categories, ["leggings"]);
  assert.equal(bestSellersQuery(categoryState), "filter.p.t.category=aa-1-1-1-2");
  // An "all" rail must not leak a tab parameter into links.
  assert.ok(!bestSellersQuery({ ...state, tab: "all" }).includes("tab="));
});

test("paging uses the shared 48-per-page window", () => {
  const sorted = sortBestSellers(mateBestSellers, "manual");
  assert.equal(PAGE_SIZE, 48);
  assert.equal(sorted.slice(0, PAGE_SIZE).length, 48);
  assert.equal(sorted.slice(PAGE_SIZE).length, 107 - PAGE_SIZE);
  assert.equal(new Set(sorted.map((product) => product.slug)).size, 107);
  assert.equal(CATEGORIES.length, 10);
});

test("every card of this collection is badged once, and the rails/images/copy exist on disk", () => {
  const grid = readFileSync("src/components/MateBestSellersGrid.tsx", "utf8");
  const card = readFileSync("src/components/MateProductCard.tsx", "utf8");
  assert.match(grid, /leadingBadges=\{\["Best Seller"\]\}/);
  // Merged through a Set so a product already carrying the badge is not shown twice.
  assert.match(card, /\[\.\.\.new Set\(\[\.\.\.\(leadingBadges \?\? \[\]\), \.\.\.active\.badges\]\)\]/);
  assert.equal(mateBestSellers.filter((product) => product.badges.includes("Best Seller")).length, 23);

  const files = [
    "tab-all", "tab-activewear", "tab-tees", "tab-sweats", "tab-intimates", "tab-sleep",
    "editorial-primary", "editorial-secondary",
  ].map((name) => `public/img/best-sellers/${name}.webp`);
  for (const file of files) {
    assert.ok(existsSync(file), file);
    assert.ok(statSync(file).size > 4096, `${file} looks truncated`);
  }

  const css = readFileSync("src/app/new-arrivals.css", "utf8");
  assert.ok(css.includes(".na-collection-nav{width:100%;padding-inline-start:36px"), "rail must scroll inside the page margin");
  assert.match(css, /\.na-collection-nav-media\{display:block;aspect-ratio:218\/281/);
  assert.match(css, /\.na-collection-nav-item\{flex:0 0 218px/);
  assert.match(css, /\.na-bs-editorial\{grid-column:span 2/);
  assert.match(css, /\.na-bs-editorial-media\{[^}]*aspect-ratio:678\/431/);
  assert.match(css, /\.na-collection-nav-link:not\(\.is-current\) \.na-collection-nav-label-text\{/);

  const en = JSON.parse(readFileSync("messages/en.json", "utf8")).bestSellers as
    { title: string; description: string; tabAlt: Record<string, string> } & Record<string, unknown>;
  const ar = JSON.parse(readFileSync("messages/ar.json", "utf8")).bestSellers as
    { title: string; description: string; tabAlt: Record<string, string> } & Record<string, unknown>;
  assert.equal(en.title, "Best Sellers");
  assert.equal(en.description, "Luxurious textures, clean silhouettes, positive impact.");
  for (const tab of BEST_SELLER_TABS) {
    assert.equal(typeof en[tab.labelKey], "string");
    assert.equal(typeof ar[tab.labelKey], "string");
    assert.equal(typeof en.tabAlt[tab.id], "string");
    assert.equal(typeof ar.tabAlt[tab.id], "string");
    assert.ok(en.tabAlt[tab.id].split(/\s+/).length > 8, `${tab.id} tile needs a described photograph`);
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ar).sort());
});

test("the storefront never reads as the reference brand", () => {
  for (const locale of ["en", "ar"]) {
    const messages = readFileSync(`messages/${locale}.json`, "utf8");
    // "MATE" only ever appears as the reference store's own file paths, never as copy.
    for (const line of messages.split("\n")) {
      if (/MATE|Prand/.test(line) && !/"(swatch|image|slug|hero)"/.test(line)) {
        assert.fail(`${locale}: unbranded reference copy still present -> ${line.trim().slice(0, 90)}`);
      }
    }
  }
  const page = readFileSync("src/app/[locale]/collections/[handle]/page.tsx", "utf8");
  assert.match(page, /handle === "best-sellers"/);
  const shell = readFileSync("src/components/new-arrivals/ArrivalShell.tsx", "utf8");
  assert.match(shell, /"\/collections\/best-sellers"/);
});

test("rail ids stay in sync with the tab definitions", () => {
  const ids = BEST_SELLER_TABS.map((tab) => tab.id);
  assert.deepEqual(ids, ["all", "activewear", "tees", "sweats", "intimates", "sleep"]);
  for (const id of ids as BestSellerTabId[]) assert.equal(tabProducts(id).length, bestSellerTabCounts()[id]);
  // Rails carry the garments their label promises.
  assert.deepEqual([...new Set(tabProducts("tees").map((p) => p.category))].sort(), ["sweatshirts", "t-shirts", "tank-tops"]);
  assert.deepEqual([...new Set(tabProducts("intimates").map((p) => p.category))], ["sports-bras"]);
  assert.ok(tabProducts("sleep").every((p) => p.category === "sweaters" || p.category === "pants"));
});
