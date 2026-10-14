#!/usr/bin/env node
/**
 * Rebuilds every rail, fabric and dye membership from the reference's own collection captures.
 *
 *   node scripts/apply-reference-collections.mjs
 *
 * Each `relay/reference-grid-<collection>.json` file is the reference's `/collections/<handle>`
 * listing, captured page by page in the reference's own order. A rail therefore stops being a
 * hand-written list and becomes what the reference itself ships: the same products, in the same
 * order, at the same size — intersected with the colourways this repository actually carries, so a
 * count is always a count of cards the grid can really print.
 *
 * The reference's sale shelf (`/collections/up-to-50-off`, where the Clothing menu's "Sale" row
 * points) becomes a rail of its own for the first time.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG = join(ROOT, "src/lib/shopAllCatalog.json");
const read = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const capture = (handle) => (existsSync(join(ROOT, `relay/reference-grid-${handle}.json`)) ? read(`relay/reference-grid-${handle}.json`) : null);

/** rail id → the reference collection it really is. */
const RAIL_SOURCES = {
  all: () => read("relay/reference-grid.json"),
  activewear: () => capture("activewear"),
  tees: () => capture("the-tee-shop"),
  sweats: () => capture("the-sweats-edit"),
  intimates: () => capture("intimates"),
  sleep: () => capture("sleep"),
  socks: () => capture("socks"),
  "october-capsule": () => capture("the-october-capsule"),
  "getaway-edit": () => capture("the-getaway-edit"),
  "cozy-shop": () => capture("the-cozy-shop"),
  "bundle-and-save": () => capture("bundleandsave"),
  sweatshirts: () => capture("sweatshirts"),
  sweatpants: () => capture("sweatpants"),
  bottoms: () => capture("bottoms"),
};
/** Fabric rails: the reference's own fabric pages, and for Organic Stretch its own link target. */
const FABRIC_SOURCES = {
  stretch: () => capture("activewear"),
  "pima-cotton": () => capture("pima-collection"),
  fleece: () => capture("new-organic-fleece"),
  waffle: () => capture("organic-waffle"),
  "merino-wool": () => capture("merino-wool"),
};
/** Featured Colors and Featured Fabrics, in the reference's own row order. */
const DYE_ORDER = ["nori", "wisteria", "balsam", "heather-oat", "peppercorn"];
const FABRIC_ORDER = ["stretch", "pima-cotton", "fleece", "waffle", "merino-wool"];
/**
 * The drawer prints its rows in the reference's own order: the Category list alphabetically by the
 * reference's label, thirteen colour groups, eighteen size rows.
 */
const REFERENCE_CATEGORY_ORDER = [
  "activewear-tops", "baby-bottoms", "baby-tops", "bikinis", "bras", "briefs", "headbands",
  "leggings", "pajamas", "pants", "shopping-bags", "shorts", "socks", "sports-bras", "sweaters",
  "sweatpants", "sweatshirts", "t-shirts", "tank-tops", "unitards",
];
const REFERENCE_COLOR_ORDER = ["Beige", "Black", "Blue", "Brown", "Green", "Grey", "Neutral", "Orange", "Pink", "Purple", "Red", "White", "Yellow"];
const REFERENCE_SIZE_ORDER = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "0/6m", "6/12m", "12/18m", "1X", "2X", "3X", "2/3y", "4/5y", "6/7y", "OS"];

const catalog = read("src/lib/shopAllCatalog.json");
const carried = new Set(catalog.products.map((product) => product.slug));

/**
 * The reference files each colourway in a category and a colour group of its own, and its facet
 * listings (`relay/reference-facets.json`) are that filing. A row takes the reference's category
 * and group wherever the listing names it, so the drawer's counts are the reference's counts.
 */
const facets = existsSync(join(ROOT, "relay/reference-facets.json")) ? read("relay/reference-facets.json") : { categories: {}, groups: {} };
let refiled = { categories: 0, groups: 0 };
for (const product of catalog.products) {
  const category = facets.categories[product.slug];
  if (category && category !== product.category) {
    product.category = category;
    refiled.categories += 1;
  }
  const group = facets.groups[product.slug];
  if (group && group !== (product.group || product.color.group)) {
    product.group = group;
    product.color.group = group;
    refiled.groups += 1;
  }
}
console.log(`re-filed from the reference's own listings: ${refiled.categories} categories, ${refiled.groups} colour groups`);
const members = (grid) => (grid ? [...new Set(grid.cards.map((card) => card.handle))].filter((handle) => carried.has(handle)) : null);

/**
 * Membership is the reference's own list, in the reference's own order — and only what this
 * repository carries of it, so a rail's size is always a number of cards the grid can print.
 */
function apply(rail, slugs, note) {
  if (!slugs) return false;
  rail.slugs = [...slugs];
  rail.count = rail.slugs.length;
  console.log(`${rail.id.padEnd(18)} ${String(rail.count).padStart(4)}  ${note}`);
  return true;
}

for (const rail of catalog.rails) if (RAIL_SOURCES[rail.id]) apply(rail, members(RAIL_SOURCES[rail.id]()), "reference collection");
for (const fabric of catalog.fabrics) if (FABRIC_SOURCES[fabric.id]) apply(fabric, members(FABRIC_SOURCES[fabric.id]()), "reference fabric page");
catalog.fabrics.sort((a, b) => FABRIC_ORDER.indexOf(a.id) - FABRIC_ORDER.indexOf(b.id));
for (const dye of catalog.dyes) if (capture(dye.handle)) apply(dye, members(capture(dye.handle)), "reference dye page");
catalog.dyes.sort((a, b) => DYE_ORDER.indexOf(a.handle) - DYE_ORDER.indexOf(b.handle));

// A fabrication the catalogue carries but the capture never saw becomes a real Featured Fabrics row.
for (const product of catalog.products) {
  const id = /^organic-pima/.test(product.slug) ? "pima-cotton" : /stretch/.test(product.slug) ? "stretch" : /fleece/.test(product.slug) ? "fleece" : /waffle/.test(product.slug) ? "waffle" : /merino/.test(product.slug) ? "merino-wool" : null;
  if (!id || catalog.fabrics.some((fabric) => fabric.id === id)) continue;
  catalog.fabrics.push({ id, handle: id, href: `/collections/${id}`, image: null, swatch: null, count: 0, slugs: [] });
}

// The reference's own sale shelf, the target of the Clothing menu's Sale row.
const sale = members(capture("up-to-50-off"));
if (sale) {
  const rail = catalog.rails.find((entry) => entry.id === "sale") ?? { id: "sale", handle: "up-to-50-off", href: "/collections/up-to-50-off", image: null, swatch: null, count: 0, slugs: [] };
  if (!catalog.rails.includes(rail)) catalog.rails.push(rail);
  apply(rail, sale, "reference sale shelf");
}

const alias = (size) => catalog.sizeAliases?.[size] ?? [size];
const ordered = (reference, present) => [...reference.filter((value) => present.has(value)), ...[...present].filter((value) => !reference.includes(value))];
catalog.categories = ordered(REFERENCE_CATEGORY_ORDER, new Set(catalog.products.map((product) => product.category).filter(Boolean)));
catalog.colorGroups = ordered(REFERENCE_COLOR_ORDER, new Set(catalog.products.map((product) => product.group || product.color.group).filter(Boolean)));
catalog.sizes = ordered(REFERENCE_SIZE_ORDER, new Set(catalog.products.flatMap((product) => REFERENCE_SIZE_ORDER.filter((size) => product.availableSizes.some((value) => alias(size).includes(value))))));
console.log(`drawer rows: categories ${catalog.categories.length}, colors ${catalog.colorGroups.length}, sizes ${catalog.sizes.length}`);

// A tile row needs an image; the sale shelf is a menu row, so it never joins the tabs.
catalog.nav.tabs = catalog.rails.filter((rail) => rail.image).map((rail) => ({ ...rail }));
writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
console.log("rails:", catalog.rails.map((rail) => `${rail.id}:${rail.count}`).join(" "));
