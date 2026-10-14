import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  arrivalCatalog, mateNewArrivals, productColorways, getArrivalProduct,
  emptyFilters, filterProducts, sortProducts, facetCounts, filterCount,
  readCollectionState, collectionQuery, usdToReferenceLE, formatLE,
  CATEGORIES, COLOR_GROUPS, PAGE_SIZE,
} from "../src/lib/mateNewArrivals";
import { CatalogLineError, resolveCheckoutLine } from "../src/lib/checkoutCatalog";
import { resolveExternalImageSources, sanitizeImagePath } from "../src/lib/imageApi";

const blank = emptyFilters();

test("real catalog is unique: 107 arrivals and 176 verified colorways", () => {
  assert.equal(mateNewArrivals.length, 107);
  assert.equal(arrivalCatalog.length, 176);
  assert.equal(new Set(arrivalCatalog.map((p) => p.slug)).size, 176);
  assert.equal(PAGE_SIZE, 48);
  assert.deepEqual(mateNewArrivals.map((p) => p.featuredRank), Array.from({ length: 107 }, (_, i) => i));
});

test("every color uses real photographs and a real swatch served via the external image API", () => {
  const images = new Set<string>();
  for (const p of arrivalCatalog) {
    assert.ok(p.images.length > 0, p.slug);
    assert.ok(p.priceUSD > 0 && p.priceLE > 0, p.slug);
    assert.ok(CATEGORIES.includes(p.category as never), p.slug);
    assert.ok(COLOR_GROUPS.includes(p.color.group as never), p.slug);
    assert.ok(["essential", "limited"].includes(p.colorEdition), p.slug);
    assert.ok(p.availableSizes.every((s) => p.sizes.includes(s)), p.slug);
    const swatchClean = sanitizeImagePath(p.color.swatch.replace(/^\/img\//, ""));
    assert.ok(swatchClean, p.color.swatch);
    assert.ok(resolveExternalImageSources(swatchClean).length >= 3, p.color.swatch);
    for (const image of p.images) {
      assert.ok(image.startsWith("/img/new-arrivals/"));
      const clean = sanitizeImagePath(image.replace(/^\/img\//, ""));
      assert.ok(clean, image);
      assert.ok(resolveExternalImageSources(clean).length >= 3, image);
      images.add(image);
    }
    for (const colorway of productColorways(p)) {
      assert.equal(colorway.style, p.style);
      assert.ok(colorway.images.length && colorway.availableSizes.length);
      assert.equal(getArrivalProduct(colorway.slug), colorway);
    }
  }
  // Only whole photographs are shown: the measured crops stay out of every product's frames.
  assert.equal(images.size, 614);
});

test("category, size and color counts reflect actual available products", () => {
  const counts = facetCounts(mateNewArrivals, blank);
  assert.deepEqual(counts.categories, { "activewear-tops": 9, headbands: 1, leggings: 15, pants: 6, "sports-bras": 8, sweaters: 9, sweatpants: 29, sweatshirts: 21, "t-shirts": 6, "tank-tops": 3 });
  assert.deepEqual(counts.colors, { Beige: 4, Black: 10, Blue: 14, Brown: 14, Green: 23, Grey: 11, Neutral: 5, Pink: 9, Purple: 8, Red: 5, White: 4 });
  assert.deepEqual(counts.sizes, { XS: 102, S: 105, M: 103, L: 102, XL: 103 });
  assert.equal(Object.values(counts.categories).reduce((a, b) => a + b), 107);
  assert.equal(Object.values(counts.colors).reduce((a, b) => a + b), 107);
});

test("OR within a filter, AND between filters, using available sizes", () => {
  const filter = { categories: ["sports-bras", "leggings"], sizes: ["XS", "M"], colors: ["Black", "Purple"] };
  const actual = filterProducts(mateNewArrivals, filter);
  const expected = mateNewArrivals.filter((p) => filter.categories.includes(p.category) && filter.sizes.some((s) => p.availableSizes.includes(s)) && filter.colors.includes(p.color.group));
  assert.deepEqual(actual, expected);
  assert.equal(filterCount(filter), 6);
  assert.equal(filterProducts(mateNewArrivals, { ...blank, categories: ["headbands"], sizes: ["XS"] }).length, 0);
});

test("facet counts exclude only their own selected facet", () => {
  const filter = { categories: ["leggings"], sizes: ["XS"], colors: ["Black"] };
  const counts = facetCounts(mateNewArrivals, filter);
  for (const category of CATEGORIES) assert.equal(counts.categories[category], filterProducts(mateNewArrivals, { ...filter, categories: [category] }).length);
  for (const color of COLOR_GROUPS) assert.equal(counts.colors[color], filterProducts(mateNewArrivals, { ...filter, colors: [color] }).length);
  for (const size of ["XS", "S", "M", "L", "XL"]) assert.equal(counts.sizes[size], filterProducts(mateNewArrivals, { ...filter, sizes: [size] }).length);
});

test("every sort actually uses the correct rank or numeric price; input is not mutated", () => {
  const original = [...mateNewArrivals];
  for (const sort of ["manual", "created-descending", "best-selling", "price-ascending", "price-descending"] as const) {
    const sorted = sortProducts(mateNewArrivals, sort);
    assert.equal(sorted.length, 107);
    for (let i = 1; i < sorted.length; i++) {
      if (sort === "price-ascending") assert.ok(sorted[i - 1].priceLE <= sorted[i].priceLE);
      else if (sort === "price-descending") assert.ok(sorted[i - 1].priceLE >= sorted[i].priceLE);
      else {
        const key = sort === "manual" ? "featuredRank" : sort === "created-descending" ? "newestRank" : "bestSellingRank";
        assert.ok(sorted[i - 1][key] <= sorted[i][key]);
      }
    }
  }
  assert.deepEqual(mateNewArrivals, original);
});

test("URLs round-trip the reference's query names, sort, filters and page", () => {
  const state = { categories: ["leggings", "sweatpants"], sizes: ["XS", "L"], colors: ["Green", "Black"], sort: "price-descending" as const, page: 2 };
  const query = collectionQuery(state);
  assert.ok(query.includes("filter.p.t.category"));
  assert.deepEqual(readCollectionState(new URLSearchParams(query)), state);
  assert.deepEqual(readCollectionState(new URLSearchParams("sort_by=bogus&page=-4&filter.v.option.size=oops&filter.p.m.custom.parent_color=Fake")), { ...blank, sort: "manual", page: 1 });
});

test("displayed LE amounts reproduce the reference, accounting remains USD", () => {
  assert.equal(usdToReferenceLE(58), 4444);
  assert.equal(usdToReferenceLE(148), 11338);
  assert.equal(formatLE(11338), "LE 11,338");
});

test("server resolves all arrival variants at canonical USD prices", () => {
  for (const p of arrivalCatalog.filter((p) => p.availableSizes.length)) {
    const resolved = resolveCheckoutLine({ slug: p.slug, size: p.availableSizes[0], qty: 2, color: "fake", price: 0.01, priceLE: 1 });
    assert.equal(resolved.price, p.priceUSD);
    assert.equal(resolved.color, p.color.label);
    assert.equal(resolved.image, p.images[0]);
    assert.equal(resolved.qty, 2);
  }
});

test("checkout rejects unknown SKUs, invalid/unavailable sizes and invalid quantities", () => {
  const p = mateNewArrivals[0];
  const expectError = (input: unknown, code: string) => assert.throws(() => resolveCheckoutLine(input), (e: unknown) => e instanceof CatalogLineError && e.code === code);
  expectError(null, "invalid_line");
  expectError({ slug: "missing", size: "S", qty: 1 }, "invalid_product");
  expectError({ slug: p.slug, size: "XXXL", qty: 1 }, "invalid_size");
  for (const qty of [0, -1, 1.5, 11, NaN, Infinity, "2"]) expectError({ slug: p.slug, size: p.availableSizes[0], qty }, "invalid_quantity");
  const limited = arrivalCatalog.find((p) => p.sizes.some((s) => !p.availableSizes.includes(s)))!;
  assert.ok(limited);
  expectError({ slug: limited.slug, size: limited.sizes.find((s) => !limited.availableSizes.includes(s)), qty: 1 }, "out_of_stock");
});

test("fonts are local and editorial photographs/brand marks resolve through external image API", () => {
  for (const path of ["fonts/FHOscarPro-Regular.woff2", "fonts/FHOscarPro-Medium.woff2", "fonts/EdictDisplay-Light.woff2", "fonts/EdictDisplay-LightItalic.woff2"]) assert.ok(existsSync(join(process.cwd(), "public", path)), path);
  for (const imgPath of ["eltaranisi-logo.png", "hero-1.jpeg", "hero-2.jpeg", "hero-3.jpeg", "rev-a.jpg", "rev-b.jpg", "rev-c.jpg", "new-arrivals/getaway-street.webp", "new-arrivals/getaway-still.webp", "new-arrivals/mate-wordmark.svg", "new-arrivals/footer-monogram.svg", "new-arrivals/footer-mate-wordmark.svg"]) {
    const clean = sanitizeImagePath(imgPath);
    assert.ok(clean, imgPath);
    assert.ok(resolveExternalImageSources(clean).length >= 3, imgPath);
  }
  const css = readFileSync("src/app/new-arrivals.css", "utf8");
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes(".na-filter-drawer"));
});
