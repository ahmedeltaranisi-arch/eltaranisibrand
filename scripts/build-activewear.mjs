#!/usr/bin/env node
/**
 * Builds the Activewear collection from the captured reference data in `relay/`.
 *
 *   node scripts/build-activewear.mjs
 *
 * Nothing here is typed in: the product list and its order are the captured collection order,
 * the facet membership comes from the reference's own facet pages (`relay/facets2/*.html`),
 * prices are the captured Shopify prices, the colourway rows are the reference's own card
 * swatch rows, and every image key is derived from the real Shopify file name so the upload
 * job and the app agree byte-for-byte.
 *
 * Outputs
 *   src/lib/activewearCatalog.json  the collection itself (products, rails, facets, swatches)
 *   src/lib/activewearImages.json   key -> source URL, for the Cloudflare upload job
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RELAY = "relay";
const OUT_CATALOG = "src/lib/activewearCatalog.json";
const OUT_IMAGES = "src/lib/activewearImages.json";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const page = (p) => readFileSync(join(RELAY, "data", p), "utf8");

const slugify = (value) =>
  value.toLowerCase().replace(/["'’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fileBase = (url) => url.split("?")[0].split("/").pop();
const sha = (value) => createHash("sha1").update(value).digest("hex").slice(0, 12);
/** One photo key per real Shopify file: `aw/<12 hex>.webp`. */
const photoKey = (url) => `aw/${sha(fileBase(url))}.webp`;

const images = {};
const products = read(join(RELAY, "data/products-activewear.json")).products;
const catalogue = read("src/lib/newArrivalsCatalog.json");
const capture = `${page("page-activewear.html")}\n${page("page-activewear-2.html")}`;

/* ------------------------------------------------- authoritative facet membership */

const CATEGORY_FACETS = {
  "aa-1-1-2": "activewear-tops",
  "aa-1-1-1-2": "leggings",
  "aa-1-1-1-3": "shorts",
  "aa-1-18": "socks",
  "aa-1-1-6": "sports-bras",
  "aa-1-1-1-4": "sweatpants",
  "aa-1-13-9": "tank-tops",
  "aa-1-1-9-2": "unitards",
};

function facetPage(file) {
  const body = readFileSync(join(RELAY, "facets2", file), "utf8");
  const handles = [];
  for (const m of body.matchAll(/<mate-product-card\b[^>]*?data-product-handle="([^"]+)"/gs)) {
    if (!handles.includes(m[1])) handles.push(m[1]);
  }
  const status = body.match(/mate-collection__status[^>]*>\s*([\d,]+)\s+products/);
  return { count: status ? Number(status[1].replace(/,/g, "")) : null, handles };
}

const categoryMembership = Object.fromEntries(
  Object.entries(CATEGORY_FACETS).map(([id, key]) => [key, facetPage(`${id}.html`)]),
);
const colorMembership = Object.fromEntries(
  ["Black", "Blue", "Brown", "Green", "Grey", "Purple", "Red", "White", "Yellow"].map((group) => [
    group,
    facetPage(`color-${group}.html`),
  ]),
);
const groupOf = new Map();
for (const [group, facet] of Object.entries(colorMembership)) {
  for (const handle of facet.handles) groupOf.set(handle, group);
}

/* --------------------------------------------------- the reference's own swatches */

/** Each card's current swatch is that colourway's own tile — parsed, never guessed. */
const swatchByHandle = new Map();
for (const card of capture.split("<mate-product-card").slice(1)) {
  const handle = card.match(/data-product-handle="([^"]+)"/)?.[1];
  if (!handle) continue;
  const current = card.match(/class="mate-shop-card__swatch is-current"[\s\S]{0,600}?--swatch-image: url\('([^']+)'\)/);
  if (current) swatchByHandle.set(handle, `https:${current[1]}`);
}

const groupSwatch = Object.fromEntries(
  [...capture.matchAll(/value="(Black|Blue|Brown|Green|Grey|Purple|Red|White|Yellow)"[\s\S]{0,400}?--facet-swatch-image: url\('([^']+)'\)/g)].map(
    (m) => [m[1], `https:${m[2]}`],
  ),
);

/** Colourway order per card: the reference lists every colour of the style, in its order. */
const swatchOrder = new Map();
for (const card of capture.split("<mate-product-card").slice(1)) {
  const handle = card.match(/data-product-handle="([^"]+)"/)?.[1];
  if (!handle) continue;
  const block = card.match(/mate-shop-card__swatches[\s\S]{0,9000}?mate-shop-card__action/)?.[0];
  if (!block) continue;
  const list = swatchOrder.get(handle) ?? [];
  for (const m of block.matchAll(/data-card-swatch[\s\S]{0,400}?data-product-handle="([^"]+)"/g)) {
    if (!list.includes(m[1])) list.push(m[1]);
  }
  swatchOrder.set(handle, list);
}

/* ------------------------------------------------------------------ colour names */

const COLOR_LABELS = {
  "jet-black": "Jet Black",
  "heather-grey": "Heather Grey",
  "chili-oil": "Chili Oil",
  "bone-balsam": "Bone / Balsam",
  "heather-grey-bone": "Heather Grey / Bone",
  "mulberry-tide": "Mulberry / Tide",
  "natural-sage-sedona": "Natural / Sage / Sedona",
  "bone-forest-maple-jet-black-birch": "Bone / Forest / Maple / Jet Black / Birch",
};
const label = (name) =>
  COLOR_LABELS[name] ?? name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const colorName = (product) => {
  const tags = (product.tags ?? []).filter(
    (tag) => tag.startsWith("color-") && !tag.startsWith("color-collection:"),
  );
  const raw = tags.length > 0 ? tags[tags.length - 1].slice("color-".length) : "";
  return raw.toLowerCase().replace(/\s+/g, "-") || slugify(product.title);
};

/** Hexes measured from the archive's own colour tiles (`relay/swatch-hex.json`). */
const measuredHex = read(join(RELAY, "swatch-hex.json"));
const catalogueColor = new Map(catalogue.map((p) => [p.color.name, p.color]));
const knownPrice = new Map(catalogue.map((p) => [p.slug, p.priceLE]));
const usdToReferenceLE = (usd) => Math.round(usd * 76.612);

/* --------------------------------------------------------------------- products */

const publishedNewest = read(join(RELAY, "data/products-new.json")).products.map((p) => p.handle);
/** The reference's own "Newest" is published-date order; ranks are measured, not invented. */
const newestOrder = [...products]
  .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
  .map((product) => product.handle);
const bestSellingOrder = (() => {
  const body = page("sorted-activewear-best-selling.html");
  const order = [];
  for (const m of body.matchAll(/<mate-product-card\b[^>]*?data-product-handle="([^"]+)"/gs)) {
    if (!order.includes(m[1])) order.push(m[1]);
  }
  return order;
})();

const allProducts = products.map((product, index) => {
  const slug = product.handle;
  const variants = product.variants ?? [];
  const sizes = [...new Set(variants.map((variant) => variant.option2).filter(Boolean))];
  const availableSizes = [
    ...new Set(variants.filter((variant) => variant.available).map((variant) => variant.option2).filter(Boolean)),
  ];
  const priceUSD = Number(variants[0]?.price ?? 0);
  const name = colorName(product);
  const swatchUrl = swatchByHandle.get(slug);
  const known = catalogueColor.get(name);
  return {
    slug,
    style: slugify(product.title),
    title: product.title,
    category: Object.entries(categoryMembership).find(([, facet]) => facet.handles.includes(slug))?.[0] ?? "",
    group: groupOf.get(slug) ?? known?.group ?? "",
    images: (product.images ?? []).slice(0, 3).map((image) => photoKey(image.src)),
    sizes,
    availableSizes,
    priceUSD,
    priceLE: knownPrice.get(slug) ?? usdToReferenceLE(priceUSD),
    color: {
      name,
      label: label(name),
      hex: known?.hex ?? measuredHex[name] ?? "#d9d9d9",
      swatch: swatchUrl ? `/img/aw/color/${name}.webp` : known?.swatch ?? "",
      swatchUrl,
    },
    badges: (product.tags ?? []).includes("Best Sellers Collection") ? ["Best Seller"] : [],
    description: (product.body_html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    colorways: [],
    colorEdition: (product.tags ?? []).includes("limited-color") ? "limited" : "essential",
    featuredRank: index,
    newestRank: newestOrder.indexOf(slug),
    bestSellingRank:
      bestSellingOrder.indexOf(slug) >= 0 ? bestSellingOrder.indexOf(slug) : bestSellingOrder.length + index,
    publishedNewestRank: publishedNewest.indexOf(slug),
    createdAt: product.created_at,
    inNewArrivals: false,
    inActivewear: true,
  };
});

/** Colourway rows: the captured card order, filtered to colours we really photographed. */
const bySlug = new Map();
for (const entry of [...allProducts, ...catalogue]) bySlug.set(entry.slug, entry);
const styleColorways = new Map();
for (const entry of [...allProducts, ...catalogue]) {
  styleColorways.set(entry.style, [...(styleColorways.get(entry.style) ?? []), entry]);
}
for (const product of allProducts) {
  const ordered = [];
  for (const slug of [...(swatchOrder.get(product.slug) ?? []), ...(styleColorways.get(product.style) ?? []).map((p) => p.slug)]) {
    const entry = bySlug.get(slug);
    if (!entry || entry.style !== product.style) continue;
    if (entry.images.length === 0 || entry.availableSizes.length === 0) continue;
    if (!ordered.includes(slug)) ordered.push(slug);
  }
  product.colorways = ordered;
  // the swatch art uploaded for this colour, keyed by its own file name
  if (product.color.swatchUrl) images[`aw/color/${product.color.name}.webp`] = product.color.swatchUrl;
  delete product.color.swatchUrl;
}

/* ------------------------------------------------------------------ rails + nav */

const RAILS = [
  { id: "all", handle: "activewear", label: "All Activewear", image: "/img/aw/nav/all-activewear.webp" },
  { id: "leggings", handle: "leggings-and-shorts", label: "Leggings", image: "/img/aw/nav/leggings.webp" },
  { id: "sports-bras", handle: "sports-bras", label: "Sports Bras", image: "/img/aw/nav/sports-bras.webp" },
  { id: "activewear-tops", handle: "activewear-tops", label: "Activewear Tops", image: "/img/aw/nav/activewear-tops.webp" },
  { id: "biker-shorts", handle: "biker-shorts", label: "Biker Shorts", image: "/img/aw/nav/biker-shorts.webp" },
  { id: "unitards", handle: "dresses-unitards", label: "Unitards", image: "/img/aw/nav/unitards.webp" },
];

const TILE_URLS = {
  "all-activewear": "ACTIVEWEAR-SHOP-ALL.jpg",
  leggings: "ACTIVEWEAR-LEGGINGS.jpg",
  "sports-bras": "ACTIVEWEAR-SPORTS-BRAS.jpg",
  "activewear-tops": "LOOK_16-ORGANIC_STRETCH_LONG_SLEEVE_TOP_MOCHA-2385_3036f0ac-d6d1-43c8-947c-9e61b39ad0de.jpg",
  "biker-shorts": "ACTIVEWEAR-BIKER-SHORTS.jpg",
  unitards: "ACTIVEWEAR-UNITARDS.jpg",
};

const rails = RAILS.map((rail) => {
  const handles =
    rail.id === "all"
      ? allProducts.map((p) => p.slug)
      : read(join(RELAY, "data", `products-${rail.handle}.json`))
          .products.map((p) => p.handle)
          .filter((handle) => allProducts.some((product) => product.slug === handle));
  return { ...rail, count: handles.length, handles };
});

/* ---------------------------------------------------------------------- outputs */

const catalog = {
  source: {
    collection: "activewear",
    capturedProducts: products.length,
    referenceFacets: {
      categories: Object.fromEntries(Object.entries(categoryMembership).map(([k, v]) => [k, v.count])),
      colors: Object.fromEntries(Object.entries(colorMembership).map(([k, v]) => [k, v.count])),
      sizes: Object.fromEntries(
        ["XS", "S", "M", "L", "XL"].map((size) => [
          size,
          allProducts.filter((p) => p.availableSizes.includes(size)).length,
        ]),
      ),
      results: products.length,
    },
  },
  categories: ["activewear-tops", "leggings", "shorts", "socks", "sports-bras", "sweatpants", "tank-tops", "unitards"],
  colorGroups: ["Black", "Blue", "Brown", "Green", "Grey", "Purple", "Red", "White", "Yellow"],
  sizes: ["XS", "S", "S/M", "M", "M/L", "L", "XL", "1X", "2X", "3X"],
  nav: {
    tiles: rails,
    groupSwatch: Object.fromEntries(
      Object.entries(groupSwatch).map(([group, url]) => [group, `/img/aw/group/${slugify(group)}.webp`]),
    ),
  },
  rails,
  products: allProducts,
};

for (const [group, url] of Object.entries(groupSwatch)) images[`aw/group/${slugify(group)}.webp`] = url;
for (const rail of rails) {
  const name = rail.image.split("/").pop().replace(".webp", "");
  images[rail.image.replace("/img/", "")] = `https://matethelabel.com/cdn/shop/files/${TILE_URLS[name]}`;
}

const EDITORIAL = {
  "aw/editorial/why-activewear-1.webp": "//matethelabel.com/cdn/shop/files/DESKTOP-ACTIVE.jpg?v=1789598807&width=1800",
  "aw/editorial/why-activewear-2.webp": "//matethelabel.com/cdn/shop/files/DESKTOP-ACTIVE-2.jpg",
  "aw/editorial/video-still.webp":
    "//matethelabel.com/cdn/shop/files/preview_images/057e3af6894f48e48dfb9537ab8646e4.thumbnail.0000000000_1368x.jpg",
};
const MEGA = {
  "aw/mega/limited-edition-fig.webp": "//matethelabel.com/cdn/shop/files/image_345_f6aa500e-9cc8-4385-b383-65139a48a192.jpg?v=1791231294&width=500",
  "aw/mega/shop-all-activewear.webp": "//matethelabel.com/cdn/shop/files/image_344_d9a26137-926a-43d2-a302-b84056498d49.jpg?v=1791231308&width=500",
};
for (const [key, url] of Object.entries({ ...EDITORIAL, ...MEGA })) {
  catalog.nav[key] = `/${key}`;
  images[key] = url.startsWith("//") ? `https:${url}` : url;
}

for (const product of allProducts) {
  const captured = products.find((p) => p.handle === product.slug);
  for (const image of (captured.images ?? []).slice(0, 3)) images[photoKey(image.src)] = image.src;
}

const stripped = {
  ...catalog,
  products: catalog.products.map(({ color, ...rest }) => ({
    ...rest,
    color: { name: color.name, label: color.label, hex: color.hex, swatch: color.swatch, group: color.group },
  })),
};

const cleaned = { ...stripped };
writeFileSync(OUT_CATALOG, `${JSON.stringify(cleaned, null, 1)}\n`);
writeFileSync(OUT_IMAGES, `${JSON.stringify(images, null, 1)}\n`);

console.log(`products: ${allProducts.length}`);
console.log("reference facet counts:", JSON.stringify(catalog.source.referenceFacets));
console.log(
  "category membership:",
  JSON.stringify(
    allProducts.reduce((acc, p) => ({ ...acc, [p.category || "(none)"]: (acc[p.category || "(none)"] ?? 0) + 1 }), {}),
  ),
);
console.log(
  "colour groups:",
  JSON.stringify(
    allProducts.reduce((acc, p) => ({ ...acc, [p.group || "(none)"]: (acc[p.group || "(none)"] ?? 0) + 1 }), {}),
  ),
);
console.log("rails:", rails.map((r) => `${r.label} ${r.count}`).join(" · "));
console.log(`image keys: ${Object.keys(images).length}`);
console.log("colourways missing an image key:", allProducts.filter((p) => !p.color.swatch).length);
