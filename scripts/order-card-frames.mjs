#!/usr/bin/env node
/**
 * Puts every colourway's photographs in the order a card renders them.
 *
 *   node scripts/order-card-frames.mjs [--max 8] [--dry]
 *
 * `src/lib/photoSelection.ts` decides *whether* a frame may render (whole figure first, head-to-hem
 * only when a colourway owns nothing better, never a crop). This script decides *in which order*,
 * and it is what makes a hover land on a different pose instead of the same shot reframed:
 *
 *   1. a colourway's pool ∪ its own row frames, cropped to the renderable tiers;
 *   2. inside a tier, the reference store's own card order leads (that shelf's photograph, exactly
 *      as the reference paints it), then the gallery frames this repository bought, then anything
 *      else it holds;
 *   3. a frame whose 16x16 difference hash agrees with an earlier frame's within 20 bits is the same
 *      pose of the same model reframed — it is dropped from the row, so consecutive frames are
 *      always consecutive poses;
 *   4. the row keeps at most `--max` frames, so a shelf's swipe stays honest about what it owns.
 *
 * `src/lib/photoPool.json` is written from the same lists, so every catalogue that pools a slug's
 * frames (Shop All, New Arrivals, Activewear) agrees on one order.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const POOL = join(ROOT, "src/lib/photoPool.json");
const POSSES = join(ROOT, "src/lib/photoPoses.json");
const HASHES = join(ROOT, "src/lib/photoFrameHashes.json");
const GALLERY = join(ROOT, "src/lib/referenceGalleryFrames.json");
const GRID = join(ROOT, "relay/reference-grid.json");
const CATALOGS = ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"];
/** Below this many differing bits two frames are the same photograph at another zoom. */
const POSE_DISTANCE = 20;

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? Number(process.argv[index + 1]) : fallback;
};
const max = arg("max", 8);
const dry = process.argv.includes("--dry");

const statuses = JSON.parse(readFileSync(POSSES, "utf8"));
const hashes = existsSync(HASHES) ? JSON.parse(readFileSync(HASHES, "utf8")) : {};
const galleryIndex = existsSync(GALLERY) ? JSON.parse(readFileSync(GALLERY, "utf8")) : {};
const grid = existsSync(GRID) ? JSON.parse(readFileSync(GRID, "utf8")).byHandle ?? {} : {};
const pool = JSON.parse(readFileSync(POOL, "utf8"));

const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);
const tier = (src) => (statuses[src] ?? 0);

function distance(a, b) {
  const left = a.padStart(64, "0");
  const right = b.padStart(64, "0");
  let xor = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let bits = 0;
  while (xor) { bits += Number(xor & 1n); xor >>= 1n; }
  return bits;
}

/**
 * The order the reference store paints a colourway's frames in, on its own card. A vendored file is
 * named after the sha1 of the URL it came from, so the capture's URLs resolve to the same stems.
 */
const referenceMaps = new Map();
function referenceRank(slug) {
  if (!referenceMaps.has(slug)) {
    const map = new Map();
    (grid[slug]?.images ?? []).forEach((url, index) => {
      map.set(createHash("sha1").update(String(url)).digest("hex").slice(0, 16), index);
    });
    referenceMaps.set(slug, map);
  }
  return referenceMaps.get(slug);
}

let changed = 0;
let single = 0;
let leadWhole = 0;
const rowsBySlug = new Map();
const catalogs = [];
for (const name of CATALOGS) {
  const data = JSON.parse(readFileSync(join(ROOT, "src/lib", name), "utf8"));
  catalogs.push({ name, data, products: Array.isArray(data) ? data : data.products });
}

/** Every frame a slug owns, across every catalogue and the shared pool. */
for (const { products } of catalogs) {
  for (const product of products) {
    const frames = rowsBySlug.get(product.slug) ?? [];
    for (const src of [...(pool[product.slug] ?? []), ...(product.images ?? [])]) {
      if (!frames.includes(src)) frames.push(src);
    }
    rowsBySlug.set(product.slug, frames);
  }
}

/**
 * The list a colourway renders: tiered, in the reference's own order inside a tier, with the
 * near-duplicate reframings of a pose dropped so a hover always means a different pose.
 */
function orderedFrames(slug, frames, category) {
  const byReference = referenceRank(slug);
  const galleryList = galleryIndex[slug] ?? [];
  // The same ladder src/lib/photoSelection.ts renders on: a row keeps its complete figures and its
  // head-to-hem shots — complete figures first — and only a colourway with nothing else keeps a crop,
  // so a dye the reference sells is never dropped over its photography.
  const renderable = PRODUCT_ONLY.has(category)
    ? [...frames]
    : (frames.filter((src) => tier(src) === 2 || tier(src) === 1).length
      ? frames.filter((src) => tier(src) === 2 || tier(src) === 1)
      : [...frames]);
  const rank = (src) => {
    const position = byReference.get(src.split("/").pop().replace(/\.webp$/, ""));
    if (position !== undefined) return [0, position];
    const bought = galleryList.indexOf(src);
    if (bought >= 0) return [1, bought];
    return [2, frames.indexOf(src)];
  };
  const sorted = [...renderable].sort((a, b) => {
    if (tier(a) !== tier(b)) return tier(b) - tier(a);
    const [ta, ka] = rank(a);
    const [tb, kb] = rank(b);
    return ta === tb ? ka - kb : ta - tb;
  });
  const out = [];
  for (const src of sorted) {
    const hash = hashes[src];
    const lookalike = hash && out.some((other) => hashes[other] && distance(hash, hashes[other]) < POSE_DISTANCE);
    // A near-duplicate of a frame already kept is the same pose at another zoom: dropped, even when
    // that leaves the colourway with a single photograph. A card that owns one pose holds it, and a
    // card that "changes" to the same pose reframed is the failure this ordering exists to prevent.
    if (lookalike) continue;
    out.push(src);
    if (out.length >= max) break;
  }
  // A card cycles: the frame after the last one is the first. If those two are the same pose at
  // another zoom the last hover of the cycle is a zoom, so the last frame goes instead.
  while (out.length > 1 && hashes[out[0]] && hashes[out[out.length - 1]]
    && distance(hashes[out[0]], hashes[out[out.length - 1]]) < POSE_DISTANCE) {
    out.pop();
  }
  return out;
}

const lists = new Map();
for (const [slug, frames] of rowsBySlug) {
  const category = catalogs.flatMap((entry) => entry.products).find((product) => product.slug === slug)?.category ?? "";
  lists.set(slug, orderedFrames(slug, frames, category));
}

for (const { name, data, products } of catalogs) {
  for (const product of products) {
    const next = lists.get(product.slug) ?? [];
    if (next.length === 0) console.log(`  ! ${name}: ${product.slug} owns no frame at all`);
    if (next.length < 2) single += 1;
    if (tier(next[0]) === 2) leadWhole += 1;
    const same = next.length === (product.images?.length ?? -1) && next.every((src, index) => product.images[index] === src);
    if (same) continue;
    changed += 1;
    if (!dry) product.images = next;
  }
  if (!dry) writeFileSync(join(ROOT, "src/lib", name), JSON.stringify(data, null, 2) + "\n");
}
if (!dry) {
  for (const [slug, next] of lists) pool[slug] = next;
  writeFileSync(POOL, JSON.stringify(pool, null, 2) + "\n");
}
const total = catalogs.reduce((sum, entry) => sum + entry.products.length, 0);
console.log(`${dry ? "would reorder" : "reordered"} ${changed} of ${total} rows · ${leadWhole} lead with a whole figure · ${single} rows hold a single frame`);
