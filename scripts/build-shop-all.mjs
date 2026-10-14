#!/usr/bin/env node
/**
 * Builds the Shop All (`/collections/all`) catalogue from the two captures this storefront
 * already owns: the New Arrivals / Best Sellers capture (`src/lib/newArrivalsCatalog.json`)
 * and the Activewear capture (`src/lib/activewearCatalog.json`).
 *
 *   node scripts/build-shop-all.mjs
 *
 * Nothing is typed in. The reference store's `all` collection holds both captures' garments —
 * its category drawer lists Activewear Tops, Leggings, Sports Bras, Sweatshirts, Sweatpants,
 * T-shirts and the rest of the catalogue on one page — so the union of the two captures is the
 * closest thing to it that this storefront can actually photograph and sell:
 *
 *   - one row per photographed colorway (style + dye), the arrival capture winning when both
 *     captures describe the same garment so the pages that shipped first keep their bytes;
 *   - every number (facet counts, rail sizes, page counts) is derived at run time from this
 *     file by `src/lib/shopAll.ts`, never written into a component;
 *   - a colorway whose reference variant is a merge placeholder (`…-bone-croissant`, whose only
 *     "size" is the mis-imported word CROISSANT) is not sellable and is dropped;
 *   - a product the reference never filed under a category or a colour group (Chili Oil) stays
 *     in the grid exactly as it does there, and simply appears in no facet row;
 *   - ranks are the captured reference ranks, best-of-both, so Featured / Newest / Best Selling
 *     order real products instead of inventing one.
 *
 * Output: src/lib/shopAllCatalog.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const ARRIVALS = "src/lib/newArrivalsCatalog.json";
const ACTIVEWEAR = "src/lib/activewearCatalog.json";
const OUT = "src/lib/shopAllCatalog.json";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Reference category order, taken from the `all` collection's own filter drawer. */
const CATEGORY_ORDER = [
  "activewear-tops",
  "headbands",
  "leggings",
  "pants",
  "shorts",
  "socks",
  "sports-bras",
  "sweaters",
  "sweatpants",
  "sweatshirts",
  "t-shirts",
  "tank-tops",
  "unitards",
];

/** Reference colour-group order, taken from the same drawer. */
const COLOR_GROUP_ORDER = [
  "Beige", "Black", "Blue", "Brown", "Green", "Grey",
  "Neutral", "Orange", "Pink", "Purple", "Red", "White", "Yellow",
];

/** Reference size rows, in the drawer's own order. */
const SIZE_ORDER = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "1X", "2X", "3X", "OS"];

const SIZE_ALIASES = { OS: ["One Size"] };

/** Nothing in either capture is withheld: the storefront sells what it can photograph. */
const EXCLUDED_STYLES = new Set();

const SLEEP_STYLES = [
  "organic-waffle-crew-cardigan",
  "organic-pointelle-pant",
  "merino-boatneck-cardigan",
  "merino-foldover-pant",
  "merino-wrap-top",
];

const TEE_STYLES = [
  "organic-pointelle-baby-tee",
  "organic-pointelle-tank",
  "organic-pointelle-cardigan",
  "organic-fleece-oversized-polo",
];

const SWEAT_STYLES = [
  "organic-fleece-cropped-sweatpant",
  "organic-fleece-oversized-sweatpant",
  "organic-fleece-relaxed-pocket-sweatpant",
  "organic-fleece-straight-leg-sweatpant",
  "organic-fleece-pocket-hoodie",
  "organic-fleece-zip-hoodie",
  "organic-fleece-relaxed-crewneck-sweatshirt",
  "organic-fleece-cropped-half-zip-sweatshirt",
  "organic-fleece-oversized-sweatshirt",
  "organic-waffle-sweatpant",
  "organic-waffle-straight-leg-sweatpant",
  "organic-waffle-collared-half-zip-sweatshirt",
  "organic-heritage-jersey-track-pant",
];

const INTIMATES_STYLES = [
  "organic-stretch-sports-bra",
  "organic-stretch-scoop-bra",
  "organic-stretch-v-neck-bra",
];

/** The October Capsule: the merino and waffle layers the reference sells as its autumn capsule. */
const CAPSULE_STYLES = [
  "merino-boatneck-cardigan",
  "merino-wrap-top",
  "merino-headband-set-of-2",
  "organic-waffle-crew-cardigan",
  "organic-waffle-collared-half-zip-sweatshirt",
  "organic-waffle-sweatpant",
  "organic-waffle-straight-leg-sweatpant",
  "organic-pointelle-cardigan",
  "organic-pointelle-baby-tee",
  "organic-pointelle-tank",
  "organic-pointelle-pant",
  "organic-fleece-relaxed-crewneck-sweatshirt",
  "organic-fleece-cropped-half-zip-sweatshirt",
  "organic-fleece-oversized-sweatshirt",
  "organic-fleece-zip-hoodie",
  "organic-fleece-pocket-hoodie",
  "organic-fleece-oversized-polo",
];

/** The Getaway Edit: the stretch travel set plus the merino layers it is styled with. */
const GETAWAY_STYLES = [
  "organic-stretch-full-length-legging",
  "organic-stretch-midi-legging",
  "organic-stretch-midi-legging-with-pockets",
  "organic-stretch-crossover-legging",
  "organic-stretch-pocket-legging",
  "organic-stretch-bootcut-pant",
  "organic-stretch-foldover-pant",
  "organic-stretch-biker-short",
  "organic-stretch-biker-short-4",
  "organic-stretch-pocket-short",
  "organic-stretch-unitard",
  "organic-stretch-cami-unitard",
  "organic-stretch-full-length-unitard",
  "organic-stretch-long-sleeve-top",
  "organic-stretch-high-neck-tank",
  "organic-stretch-crop-racer-tank",
  "organic-stretch-sports-bra",
  "organic-stretch-scoop-bra",
  "organic-stretch-v-neck-bra",
  "merino-wrap-top",
  "merino-boatneck-cardigan",
];

const bundles = (styles) => new Set(styles);

const rails = [
  { id: "all", handle: "all", href: "/collections/all", image: "/img/shop/tabs/shop-all.webp", styles: null },
  {
    id: "activewear",
    handle: "activewear",
    href: "/collections/activewear",
    image: "/img/shop/tabs/activewear.webp",
    // Every organic-stretch style plus the merino headband, minus the garments the reference
    // files under another rail of its own.
    styles: "activewear",
  },
  { id: "tees", handle: "tees", href: "/collections/tees", image: "/img/shop/tabs/tees.webp", styles: bundles(TEE_STYLES) },
  { id: "sweats", handle: "sweats", href: "/collections/sweats", image: "/img/shop/tabs/sweats.webp", styles: bundles(SWEAT_STYLES) },
  { id: "intimates", handle: "intimates", href: "/collections/intimates", image: "/img/shop/tabs/intimates.webp", styles: bundles(INTIMATES_STYLES) },
  { id: "sleep", handle: "sleep", href: "/collections/sleep", image: "/img/shop/tabs/sleep.webp", styles: bundles(SLEEP_STYLES) },
];

/** Collections the mega menu links to that are not one of the six tiles. */
const extraRails = [
  { id: "socks", handle: "socks", href: "/collections/socks", image: null, category: "socks" },
  { id: "october-capsule", handle: "october-capsule", href: "/collections/october-capsule", image: null, styles: bundles(CAPSULE_STYLES) },
  { id: "getaway-edit", handle: "getaway-edit", href: "/collections/getaway-edit", image: null, styles: bundles(GETAWAY_STYLES) },
  {
    id: "cozy-shop",
    handle: "cozy-shop",
    href: "/collections/cozy-shop",
    image: null,
    styles: new Set([...SWEAT_STYLES, ...SLEEP_STYLES, "organic-cotton-sock-3-pack", "organic-cotton-sock-5-pack"]),
  },
  { id: "bundle-and-save", handle: "bundle-and-save", href: "/collections/bundle-and-save", image: null, badge: "Bundle + Save" },
];

/**
 * The mega menu's Featured Fabrics column, in the reference's own order. A fabric row is
 * rendered only while the catalogue really carries that fabrication — Organic Pima Cotton has
 * no photographed colorway here, so the row is not printed until one exists.
 */
const fabricRails = [
  // Its own handle: the Activewear collection page already answers for `activewear`, and a rail
  // may not borrow a handle another rail owns (the menu would then print two different counts).
  { id: "stretch", handle: "organic-stretch", href: "/collections/organic-stretch", image: null, styles: "fabric:organic-stretch" },
  { id: "pima", handle: "pima", href: "/collections/pima", image: null, styles: "fabric:organic-pima" },
  { id: "fleece", handle: "fleece", href: "/collections/fleece", image: null, styles: "fabric:organic-fleece" },
  { id: "waffle", handle: "waffle", href: "/collections/waffle", image: null, styles: "fabric:organic-waffle" },
  { id: "merino-wool", handle: "merino-wool", href: "/collections/merino-wool", image: null, styles: "fabric:merino" },
];

/** The five dyes the reference features above the grid, each with its own real colorways. */
const dyeRails = [
  { id: "dye-nori", handle: "nori", href: "/collections/nori", image: null, colorNames: ["nori", "heather-pine"], swatch: "/img/aw/color/nori.webp" },
  { id: "dye-wisteria", handle: "wisteria", href: "/collections/wisteria", image: null, colorNames: ["wisteria"], swatch: "/img/shop/color/wisteria.webp" },
  { id: "dye-balsam", handle: "balsam", href: "/collections/balsam", image: null, colorNames: ["balsam"], swatch: "/img/shop/color/balsam.webp" },
  { id: "dye-heather-oat", handle: "heather-oat", href: "/collections/heather-oat", image: null, colorNames: ["heather-oat"], swatch: "/img/shop/color/heather-oat.webp" },
  { id: "dye-peppercorn", handle: "peppercorn", href: "/collections/peppercorn", image: null, colorNames: ["peppercorn"], swatch: "/img/shop/color/peppercorn.webp" },
];

/** Category rails the Clothing mega menu links to (its own category names). */
const categoryRails = [
  { id: "sweatshirts", handle: "sweatshirts", href: "/collections/sweatshirts", image: null, category: "sweatshirts" },
  { id: "sweatpants", handle: "sweatpants", href: "/collections/sweatpants", image: null, category: "sweatpants" },
  { id: "sweaters", handle: "sweaters", href: "/collections/sweaters", image: null, category: "sweaters" },
  { id: "bottoms", handle: "bottoms", href: "/collections/bottoms", image: null, categories: ["leggings", "pants", "shorts", "sweatpants"] },
];

const EXTRA_RAIL_ALIASES = { "the-cozy-shop": "cozy-shop", bundleandsave: "bundle-and-save", merino: "merino-wool", "the-tee-shop": "tees", "the-sweats-edit": "sweats" };

const arrival = read(ARRIVALS);
const activewear = read(ACTIVEWEAR).products;

const key = (product) => `${product.style}::${product.color.name}`;
const minRank = (...values) => Math.min(...values.filter((value) => Number.isFinite(value)));

/* ------------------------------------------------------------------ the union capture */

const merged = new Map();
for (const product of arrival) if (!merged.has(key(product))) merged.set(key(product), { ...product, source: "arrivals" });

for (const product of activewear) {
  const k = key(product);
  const existing = merged.get(k);
  if (!existing) {
    merged.set(k, { ...product, source: "activewear" });
    continue;
  }
  // The arrival capture keeps the row; the activewear capture may still hold a better rank.
  existing.featuredRank = minRank(existing.featuredRank, product.featuredRank);
  existing.bestSellingRank = minRank(existing.bestSellingRank, product.bestSellingRank);
  existing.newestRank = minRank(existing.newestRank, product.publishedNewestRank ?? product.newestRank);
}

/** A merge placeholder whose only variant is not a real size cannot be bought — drop it. */
const sellable = [...merged.values()].filter(
  (product) => !product.availableSizes.every((size) => !SIZE_ORDER.includes(size) && !Object.values(SIZE_ALIASES).flat().includes(size)),
);

/** Colour groups the activewear capture holds outside `color.group`. */
const groupOf = (product) => (product.group || product.color.group || "").trim();

const byStyle = new Map();
for (const product of sellable) {
  if (!byStyle.has(product.style)) byStyle.set(product.style, []);
  byStyle.get(product.style).push(product);
}

const isActivewearStyle = (style) => style.startsWith("organic-stretch") || style === "merino-headband-set-of-2";

const products = sellable
  .filter((product) => !EXCLUDED_STYLES.has(product.style))
  .map((product) => {
    // Every photographed colour of the same garment is a real swatch row on the reference card;
    // the storefront keeps the ones it can render, with the row's own dye first.
    const siblings = byStyle.get(product.style) ?? [];
    const colorways = [
      product.slug,
      ...siblings.map((sibling) => sibling.slug).filter((slug) => slug !== product.slug),
    ];
    return {
      ...product,
      colorways,
      color: { ...product.color, group: groupOf(product) },
      group: groupOf(product),
    };
  })
  .sort((a, b) => a.featuredRank - b.featuredRank);

const inRail = (product, rail) => {
  if (rail.styles === null) return true;
  if (typeof rail.styles === "string" && rail.styles.startsWith("fabric:")) {
    return product.style.startsWith(rail.styles.slice("fabric:".length));
  }
  if (rail.styles === "activewear") return isActivewearStyle(product.style);
  if (rail.category) return product.category === rail.category;
  if (rail.categories) return rail.categories.includes(product.category);
  if (rail.badge) return product.badges.includes(rail.badge);
  if (rail.colorNames) return rail.colorNames.includes(product.color.name);
  return rail.styles.has(product.style);
};

const seenHandles = new Set();
const toRow = (rail) => {
  if (seenHandles.has(rail.handle)) throw new Error(`two rails claim the handle "${rail.handle}"`);
  seenHandles.add(rail.handle);
  const members = products.filter((product) => inRail(product, rail));
  return {
    id: rail.id,
    handle: rail.handle,
    href: rail.href,
    image: rail.image ?? null,
    swatch: rail.swatch ?? null,
    count: members.length,
    slugs: members.map((product) => product.slug),
  };
};

const railRows = [...rails, ...extraRails].map(toRow);
const extraRows = [...categoryRails].map(toRow).filter((rail) => rail.count > 0);
const fabricRows = fabricRails.map(toRow).filter((rail) => rail.count > 0);
const dyeRows = dyeRails.map(toRow).filter((rail) => rail.count > 0);

const usedCategories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort(
  (a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia < 0 ? CATEGORY_ORDER.length : ia) - (ib < 0 ? CATEGORY_ORDER.length : ib) || a.localeCompare(b);
  },
);

const usedGroups = [...new Set(products.map(groupOf).filter(Boolean))].sort((a, b) => {
  const ia = COLOR_GROUP_ORDER.indexOf(a);
  const ib = COLOR_GROUP_ORDER.indexOf(b);
  return (ia < 0 ? COLOR_GROUP_ORDER.length : ia) - (ib < 0 ? COLOR_GROUP_ORDER.length : ib) || a.localeCompare(b);
});

const snapshot = {
  source: {
    collection: "all",
    referenceResults: 328,
    captures: {
      arrivals: arrival.length,
      activewear: activewear.length,
      sharedStyles: arrival.filter((product) => activewear.some((other) => key(other) === key(product))).length,
    },
    capturedProducts: products.length,
    note: "Union of the arrival and activewear captures: one row per photographed colorway.",
  },
  categories: usedCategories,
  colorGroups: usedGroups,
  sizes: SIZE_ORDER,
  sizeAliases: SIZE_ALIASES,
  rails: [...railRows, ...extraRows],
  fabrics: fabricRows,
  dyes: dyeRows,
  railAliases: EXTRA_RAIL_ALIASES,
  nav: {
    tabs: railRows.filter((rail) => rail.image),
    editorial: {
      octoberCapsule: {
        primary: "/img/shop/editorial/october-capsule.webp",
        secondary: "/img/shop/editorial/october-capsule-2.webp",
      },
      getawayEdit: {
        primary: "/img/shop/editorial/getaway-edit.webp",
        secondary: "/img/shop/editorial/getaway-edit-2.webp",
      },
    },
    megaTiles: {
      octoberCapsule: "/img/shop/mega/october-capsule.webp",
      getawayEdit: "/img/shop/mega/getaway-edit.webp",
    },
    megaSwatches: {
      nori: "/img/aw/color/nori.webp",
      wisteria: "/img/shop/color/wisteria.webp",
      balsam: "/img/shop/color/balsam.webp",
      "heather-oat": "/img/shop/color/heather-oat.webp",
      peppercorn: "/img/shop/color/peppercorn.webp",
    },
  },
  products,
};

writeFileSync(OUT, `${JSON.stringify(snapshot)}\n`);

console.log(`${OUT}: ${products.length} colorways`);
for (const rail of railRows) console.log(`  ${rail.id}: ${rail.count}`);
console.log(`  categories rails: ${extraRows.map((rail) => `${rail.id} ${rail.count}`).join(" · ") || "none"}`);
console.log(`  fabrics: ${fabricRows.map((rail) => `${rail.id} ${rail.count}`).join(" · ") || "none"}`);
console.log(`  dyes: ${dyeRows.map((rail) => `${rail.id} ${rail.count}`).join(" · ") || "none"}`);
console.log(`  categories: ${usedCategories.map((value) => `${value} ${products.filter((p) => p.category === value).length}`).join(" · ")}`);
console.log(`  colour groups: ${usedGroups.map((value) => `${value} ${products.filter((p) => groupOf(p) === value).length}`).join(" · ")}`);
console.log(`  no category: ${products.filter((p) => !p.category).map((p) => p.slug).join(", ") || "none"}`);
console.log(`  no colour group: ${products.filter((p) => !groupOf(p)).map((p) => p.slug).join(", ") || "none"}`);
