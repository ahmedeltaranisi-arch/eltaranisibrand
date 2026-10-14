#!/usr/bin/env node
/**
 * Adds colourways the reference store lists but this repository never captured.
 *
 *   node scripts/ingest-reference-products.mjs <handle> [more handles…]
 *   node scripts/ingest-reference-products.mjs --collection all
 *
 * For each slug the script reads the reference's own product payload
 * (`matethelabel.com/products/<handle>.js`) and its card in the captured grid, reads the category
 * and colour group out of the reference's own facet listings (`relay/reference-facets.json`),
 * stores the reference's leading card frames as WebP inside `public/img/mate/`, and writes a
 * complete catalogue row: colour, sizes, availability, badges, price on the catalogue's own EGP
 * scale, and the reference's card order for its photographs. Rows join the rails their category
 * belongs to; `scripts/apply-reference-collections.mjs` then rebuilds every rail from the
 * reference's own collection pages.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG = join(ROOT, "src/lib/shopAllCatalog.json");
const POOL = join(ROOT, "src/lib/photoPool.json");
const REFERENCE_FRAMES = join(ROOT, "src/lib/referenceCardFrames.json");
const GRID = join(ROOT, "relay/reference-grid.json");
const FACETS = join(ROOT, "relay/reference-facets.json");
const MATEDIR = join(ROOT, "public/img/mate");
const CACHE_DIRS = ["/tmp/ingest", "/tmp/frame-align/ref", "/tmp/vendor"];
const REF = "https://matethelabel.com";
const WIDTH = 720;
const QUALITY = 82;
/** Reference frames kept per ingested colourway: the lead the reference shows plus its poses. */
const FRAMES_PER_PRODUCT = 4;

/** The catalogue's own EGP list for the reference's USD ticket, read from the pricing module. */
const PRICING_SOURCE = readFileSync(join(ROOT, "src/lib/mateNewArrivals.ts"), "utf8");
const REFERENCE_EGP = Object.fromEntries(
  [.../const REFERENCE_EGP: Record<number, number> = \{([\s\S]*?)\n\};/.exec(PRICING_SOURCE)[1].matchAll(/([\d.]+):\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]),
);
const usdToReferenceLE = (amount) => REFERENCE_EGP[amount] ?? Math.round(amount * 76.61);

/** The reference's own Category facet, in its drawer order: id → slug this storefront lists. */
const REFERENCE_CATEGORIES = [
  ["aa-1-1-2", "Activewear Tops", "activewear-tops"],
  ["aa-1-25-1", "Baby & Children's Bottoms", "baby-bottoms"],
  ["aa-1-25-9", "Baby & Children's Tops", "baby-tops"],
  ["aa-1-6-11-1", "Bikinis", "bikinis"],
  ["aa-1-6-3", "Bras", "bras"],
  ["aa-1-6-11-3", "Briefs", "briefs"],
  ["aa-2-14-8", "Headbands", "headbands"],
  ["aa-1-1-1-2", "Leggings", "leggings"],
  ["aa-1-17-4", "Pajamas", "pajamas"],
  ["aa-1-12", "Pants", "pants"],
  ["bi-22-5", "Paper & Plastic Shopping Bags", "shopping-bags"],
  ["aa-1-1-1-3", "Shorts", "shorts"],
  ["aa-1-18", "Socks", "socks"],
  ["aa-1-1-6", "Sports Bras", "sports-bras"],
  ["aa-1-13-12", "Sweaters", "sweaters"],
  ["aa-1-1-1-4", "Sweatpants", "sweatpants"],
  ["aa-1-13-14", "Sweatshirts", "sweatshirts"],
  ["aa-1-13-8", "T-Shirts", "t-shirts"],
  ["aa-1-13-9", "Tank Tops", "tank-tops"],
  ["aa-1-1-9-2", "Unitards", "unitards"],
];
const REFERENCE_COLOR_GROUPS = ["Beige", "Black", "Blue", "Brown", "Green", "Grey", "Neutral", "Orange", "Pink", "Purple", "Red", "White", "Yellow"];

/** The reference's own product-type wording, mapped onto the category slugs this storefront lists. */
const CATEGORY_BY_TYPE = {
  "activewear tops": "activewear-tops",
  "baby bottoms": "baby-bottoms",
  "baby tops": "baby-tops",
  bikinis: "bikinis",
  bralettes: "bras",
  bras: "bras",
  briefs: "briefs",
  dress: "dresses",
  dresses: "dresses",
  headbands: "headbands",
  jackets: "jackets",
  leggings: "leggings",
  pajamas: "pajamas",
  pant: "pants",
  pants: "pants",
  romper: "unitards",
  short: "shorts",
  shorts: "shorts",
  skirt: "skirts",
  skirts: "skirts",
  socks: "socks",
  "sports bras": "sports-bras",
  sweatpants: "sweatpants",
  sweaters: "sweaters",
  sweatshirt: "sweatshirts",
  sweatshirts: "sweatshirts",
  "t-shirts": "t-shirts",
  "tank tops": "tank-tops",
  tees: "t-shirts",
  tops: "tops",
  undies: "briefs",
  underwear: "briefs",
  unitards: "unitards",
};

/** A colourway joins the rails its category belongs to; the reference links the same shelves. */
const RAILS_BY_CATEGORY = {
  "t-shirts": ["tees"],
  "tank-tops": ["tees"],
  sweatshirts: ["sweats"],
  sweatpants: ["sweats", "bottoms"],
  leggings: ["bottoms"],
  pants: ["bottoms"],
  shorts: ["bottoms"],
  skirts: ["bottoms"],
  bras: ["intimates"],
  briefs: ["intimates"],
  bikinis: ["intimates"],
  pajamas: ["sleep"],
  socks: ["socks"],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync(MATEDIR, { recursive: true });
mkdirSync("/tmp/ingest", { recursive: true });
const key = (url) => createHash("sha1").update(url).digest("hex");

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; eltaranisi-parity/1.0)" } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {}
    await sleep(700 * (attempt + 1));
  }
  return null;
}

async function fetchHtml(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; eltaranisi-parity/1.0)" } });
      if (res.ok) return await res.text();
    } catch {}
    await sleep(700 * (attempt + 1));
  }
  return "";
}

async function download(url, target) {
  if (existsSync(target) && statSync(target).size > 900) return true;
  for (const dir of CACHE_DIRS) {
    const cached = join(dir, `${key(url)}.jpg`);
    if (existsSync(cached) && statSync(cached).size > 900) {
      writeFileSync(target, readFileSync(cached));
      return true;
    }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${url}?width=${WIDTH}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; eltaranisi-parity/1.0)" } });
      if (!res.ok) return false;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 900) return false;
      writeFileSync(target, buffer);
      return true;
    } catch {
      await sleep(600 * (attempt + 1));
    }
  }
  return false;
}

function toWebp(source, target) {
  execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open("${source}").convert("RGB")
if im.width > ${WIDTH}:
    im = im.resize((${WIDTH}, round(im.height * ${WIDTH} / im.width)), Image.LANCZOS)
im.save("${target}", "WEBP", quality=${QUALITY}, method=5)
`], { encoding: "utf8" });
}

/* ------------------------------------------------------------------ reference facet listings */

/**
 * The reference's own facet listings, restricted to the collection grid.
 *
 * A filtered collection page also carries recommendation rails below the grid, so a page is read
 * the way the grid capture reads it: the first `mate-shop-card` blocks in document order are the
 * grid, and anything after them belongs to another surface.
 */
function firstCards(html, limit = 48) {
  const starts = [...html.matchAll(/class="mate-shop-card(?: |")/g)].map((match) => match.index);
  const handles = [];
  for (let index = 0; index < starts.length && handles.length < limit; index++) {
    const segment = html.slice(starts[index], starts[index + 1] ?? starts[index] + 90000);
    const handle = /data-product-handle="([^"]+)"/.exec(segment)?.[1];
    if (handle && !handles.includes(handle)) handles.push(handle);
  }
  return handles;
}

async function collect(query) {
  const found = [];
  for (let page = 1; page <= 8; page++) {
    const html = await fetchHtml(`${REF}/collections/all?${query}&page=${page}`);
    if (!html) break;
    const handles = firstCards(html);
    if (!handles.length) break;
    for (const handle of handles) if (!found.includes(handle)) found.push(handle);
    if (handles.length < 48) break;
    await sleep(200);
  }
  return found;
}

async function buildFacetMap() {
  if (existsSync(FACETS)) {
    const cached = JSON.parse(readFileSync(FACETS, "utf8"));
    if (cached.categories && cached.groups) return cached;
  }
  const categories = {};
  const groups = {};
  for (const [id, label, slug] of REFERENCE_CATEGORIES) {
    const handles = await collect(`filter.p.t.category=${id}`);
    for (const handle of handles) categories[handle] = slug;
    console.log("category", label.padEnd(30), handles.length);
  }
  for (const group of REFERENCE_COLOR_GROUPS) {
    const handles = await collect(`filter.p.m.custom.parent_color=${encodeURIComponent(group)}`);
    for (const handle of handles) groups[handle] = group;
    console.log("color group", group.padEnd(10), handles.length);
  }
  const data = { capturedAt: new Date().toISOString(), categories, groups };
  writeFileSync(FACETS, JSON.stringify(data, null, 2));
  return data;
}

/* ----------------------------------------------------------------------------- row building */

const slugifyColor = (label) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (label) => label.trim().split(/\s+/).map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
const plainText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function averageColor(file) {
  return execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open("${file}").convert("RGB").resize((1, 1), Image.LANCZOS)
r, g, b = im.getpixel((0, 0))
print("#%02x%02x%02x" % (r, g, b))
`], { encoding: "utf8" }).trim();
}

/* ------------------------------------------------------------------------------------ main */

const collectionArgIndex = process.argv.indexOf("--collection");
const gridFile = collectionArgIndex > 0 && process.argv[collectionArgIndex + 1] !== "all"
  ? join(ROOT, `relay/reference-grid-${process.argv[collectionArgIndex + 1]}.json`)
  : GRID;
const grid = JSON.parse(readFileSync(gridFile, "utf8"));
const byHandle = grid.byHandle;
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const pool = JSON.parse(readFileSync(POOL, "utf8"));
const referenceFrames = existsSync(REFERENCE_FRAMES)
  ? JSON.parse(readFileSync(REFERENCE_FRAMES, "utf8"))
  : { note: "Frames the reference storefront renders on its own product card, per colourway. The photography rule keeps these even when a pose scan would call them a crop, because the reference ships exactly this frame.", frames: {} };
referenceFrames.frames ??= {};
const existing = new Set(catalog.products.map((product) => product.slug));

const collectionArg = process.argv.indexOf("--collection");
let requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
if (collectionArg > 0) {
  const handle = process.argv[collectionArg + 1];
  const captured = JSON.parse(readFileSync(join(ROOT, handle === "all" ? "relay/reference-grid.json" : `relay/reference-grid-${handle}.json`), "utf8"));
  requested = captured.cards.map((card) => card.handle).filter((slug) => !existing.has(slug));
  console.log(`collection ${handle}: ${captured.cards.length} cards, ${requested.length} not yet carried`);
}
if (!requested.length) {
  console.log("nothing to ingest — pass one or more product handles, or --collection <handle>");
  process.exit(0);
}

const facets = await buildFacetMap();

/**
 * The colours this catalogue already files: a dye the facet listing misses (it lists the All
 * collection only, while the sale shelf holds colourways of its own) takes the group the
 * catalogue files that same dye under.
 */
const knownGroups = new Map();
for (const product of catalog.products) {
  if (!knownGroups.has(product.color.name)) knownGroups.set(product.color.name, product.group || product.color.group || "");
}
const colorNameFromHandle = (handle) => handle.replace(/^.*?-([a-z0-9-]+)$/, "$1");

/* Which colourways the reference's facet listings cover, for the validation report below. */
console.log(`facet listings cover ${Object.keys(facets.categories).length} colourways`);
/** The dye artwork of a colour the catalogue already names, downloaded once per run. */
const swatchCache = new Map();
const added = [];
let refreshed = 0;

async function ingestOne(handle) {
  const card = byHandle[handle] ?? null;
  const data = await fetchJson(`${REF}/products/${handle}.js`);
  if (!data) {
    console.log("skip (reference has no product payload):", handle);
    return;
  }
  // A product the reference lists only as a page of its own (the gift card, a one-off) has no card
  // in any grid: its own payload then carries the photographs and there is nothing to mirror.
  const cardFrames = card?.images ?? (data.images ?? []).map((image) => (typeof image === "string" ? image : image.src).split("?")[0].replace(/^\/\//, "https://"));
  const swatches = card?.swatches ?? [];
  const styleTag = (data.tags ?? []).map((tag) => /^color-collection:\s*(.+)$/.exec(tag)?.[1]).find(Boolean);
  const category = facets.categories[handle] ?? CATEGORY_BY_TYPE[String(data.type ?? "").trim().toLowerCase()] ?? "";
  const group = facets.groups[handle] ?? knownGroups.get(colorNameFromHandle(handle)) ?? "";
  const sizeOption = (data.options ?? []).find((option) => option.name.toLowerCase() === "size");
  const sizes = sizeOption?.values ?? ["OS"];
  const availableSizes = [...new Set((data.variants ?? []).filter((variant) => variant.available).map((variant) => String(variant.title).split(" / ").pop()))];
  const colorLabel = (data.options ?? []).find((option) => option.name.toLowerCase() === "color")?.values?.[0] ?? "";
  const swatchEntry = swatches.find((swatch) => swatch.handle === handle) ?? swatches[0] ?? null;
  const colorName = slugifyColor(swatchEntry?.color || colorLabel);
  // A style is the reference's own colour-collection; without one, the handle minus its dye.
  const style = styleTag ?? (colorName && handle.endsWith(`-${colorName}`) ? handle.slice(0, -(colorName.length + 1)) : handle);

  // Colour artwork: the reference's own dye swatch, stored beside the other storefront photographs.
  let swatchPath = "";
  let hex = "#d9d9d9";
  if (swatchEntry?.image) {
    const file = join(MATEDIR, `color-${colorName}.png`);
    if (!swatchCache.has(colorName)) swatchCache.set(colorName, download(swatchEntry.image, file));
    await swatchCache.get(colorName);
    if (existsSync(file)) {
      swatchPath = `/img/mate/color-${colorName}.png`;
      hex = await averageColor(file);
    }
  }

  // Photography: the reference's own card order, stored as WebP in the same tree.
  const frames = [];
  for (const url of cardFrames.slice(0, FRAMES_PER_PRODUCT)) {
    const hash = key(url);
    const target = join(MATEDIR, `${hash.slice(0, 16)}.webp`);
    if (!existsSync(target)) {
      const source = join("/tmp/ingest", `${hash}.jpg`);
      if (await download(url, source)) toWebp(source, target);
    }
    if (existsSync(target)) {
      const frame = `/img/mate/${hash.slice(0, 16)}.webp`;
      if (!frames.includes(frame)) frames.push(frame);
      referenceFrames.frames[frame] ??= 2;
    }
  }
  if (!frames.length) {
    console.log("skip (no photograph could be fetched):", handle);
    return;
  }

  // A colourway the catalogue already holds keeps its place: only the photographs it was missing
  // (the reference's own frames) are folded in, so an explicit ingest can never duplicate a row.
  const already = catalog.products.find((product) => product.slug === handle);
  if (already) {
    already.images = [...frames, ...already.images.filter((src) => !frames.includes(src))];
    pool[handle] = already.images;
    refreshed += 1;
    console.log("refreshed", handle, "|", already.category || "(no category)", "|", already.images.length, "frames");
    return;
  }

  const priceUSD = Number(data.price) / 100;
  const row = {
    id: `ref-${data.id}`,
    slug: handle,
    title: data.title,
    style,
    category,
    priceUSD,
    priceLE: usdToReferenceLE(priceUSD),
    color: {
      name: colorName,
      label: swatchEntry?.color ? titleCase(swatchEntry.color) : titleCase(colorLabel),
      hex,
      swatch: swatchPath,
      group,
    },
    images: frames,
    sizes,
    availableSizes,
    badges: [...new Set((card?.badges ?? []).map((badge) => badge.trim()).filter(Boolean))].map((badge) => titleCase(badge)),
    description: scrubCopy(plainText(data.description ?? "")).slice(0, 1600),
    colorways: swatches.map((swatch) => swatch.handle).filter(Boolean),
    colorEdition: "essential",
    featuredRank: grid.cards.findIndex((entry) => entry.handle === handle),
    newestRank: 0,
    bestSellingRank: 0,
    createdAt: data.published_at ?? "",
    inNewArrivals: false,
    group,
    source: "reference-catalogue",
  };
  catalog.products.push(row);
  pool[handle] = frames;
  added.push({ handle, title: data.title, category, group, frames: frames.length, priceLE: row.priceLE });
  console.log("added", handle, "|", category || "(no category)", "|", group || "(no group)", "|", frames.length, "frames | LE", row.priceLE);
}

/**
 * Products are ingested a batch at a time — the reference is a public store, so the batch stays
 * small — which keeps a full catalogue ingest to minutes rather than an hour.
 */
const BATCH = 6;
for (let index = 0; index < requested.length; index += BATCH) {
  await Promise.all(requested.slice(index, index + BATCH).map((handle) => ingestOne(handle)));
  await sleep(150);
}

if (added.length || refreshed) {
  const position = new Map(grid.cards.map((entry, index) => [entry.handle, index]));
  catalog.products.sort((a, b) => {
    const left = position.has(a.slug) ? position.get(a.slug) : Number.MAX_SAFE_INTEGER;
    const right = position.has(b.slug) ? position.get(b.slug) : Number.MAX_SAFE_INTEGER;
    if (left !== right) return left - right;
    return a.featuredRank - b.featuredRank;
  });
  catalog.products.forEach((product, index) => { product.featuredRank = index; });

  const addTo = (rail, slugs) => { rail.slugs = [...new Set([...rail.slugs, ...slugs])]; rail.count = rail.slugs.length; };
  for (const rail of catalog.rails) {
    if (rail.handle === "all") addTo(rail, catalog.products.map((product) => product.slug));
    else {
      const members = added.filter((entry) => (RAILS_BY_CATEGORY[entry.category] ?? []).includes(rail.id)).map((entry) => entry.handle);
      if (members.length) addTo(rail, members);
    }
  }
  for (const entry of added) {
    if (entry.category && !catalog.categories.includes(entry.category)) catalog.categories.push(entry.category);
  }
  for (const entry of added) {
    if (entry.group && !catalog.colorGroups.includes(entry.group)) catalog.colorGroups.push(entry.group);
  }
  const knownSizes = new Set(catalog.sizes);
  for (const product of catalog.products) {
    if (!added.some((row) => row.handle === product.slug)) continue;
    for (const size of product.sizes) if (!knownSizes.has(size)) { knownSizes.add(size); catalog.sizes.push(size); }
  }
  catalog.nav.tabs = catalog.rails.filter((rail) => rail.image).map((rail) => ({ ...rail }));
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
  writeFileSync(POOL, JSON.stringify(pool, null, 2) + "\n");
  writeFileSync(REFERENCE_FRAMES, JSON.stringify(referenceFrames, null, 2) + "\n");
}

console.log(`ingested ${added.length} colourway(s)`);
