#!/usr/bin/env node
/**
 * Puts every colourway's card in the reference's own frame order.
 *
 *   node scripts/vendor-reference-frames.mjs [--all]
 *
 * `relay/reference-grid.json` records, per product handle, the photographs the reference's card
 * carousel renders and the order it renders them in. For each colourway this storefront carries,
 * this script stores the reference's leading frames as WebP inside `public/img/mate/`, registers
 * them in `src/lib/referenceCardFrames.json` (the rule that keeps a reference-shipped frame even
 * when our own pose scan would call it a crop) and then writes the card's photograph order:
 *
 *   reference frame 1 (the lead the reference shows) → reference frames 2…n → our own photographs
 *
 * A colourway with our own photography keeps its shooting set behind the reference's three leading
 * frames; a colourway this repository only knows from the reference (an ingested row) keeps four.
 * Frames already downloaded are reused from the caches under /tmp, so a re-run is cheap.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG = join(ROOT, "src/lib/shopAllCatalog.json");
const POOL = join(ROOT, "src/lib/photoPool.json");
const REFERENCE_FRAMES = join(ROOT, "src/lib/referenceCardFrames.json");
const GRID = join(ROOT, "relay/reference-grid.json");
const MATEDIR = join(ROOT, "public/img/mate");
const WIDTH = 720;
const QUALITY = 82;
/** Frames kept for a colourway whose own photography we hold, and for one known only from the reference. */
const POSITIONS = { local: 8, reference: 8 };

mkdirSync(MATEDIR, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const key = (url) => createHash("sha1").update(url).digest("hex");

/**
 * Vendors one reference frame as a 720px WebP and returns the repository path it now lives at.
 * The fetch and the encode happen in one call, so a half-written temporary never leaves the frame
 * unvendored — a frame that fails all three attempts is simply skipped by the caller.
 */
async function vendor(url) {
  const hash = key(url);
  const target = join(MATEDIR, `${hash.slice(0, 16)}.webp`);
  const path = `/img/mate/${hash.slice(0, 16)}.webp`;
  if (existsSync(target) && statSync(target).size > 900) return path;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${url}?width=${WIDTH}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; eltaranisi-parity/1.0)" } });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 900) return null;
      const webp = await sharp(buffer).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
      writeFileSync(target, webp);
      return path;
    } catch {
      await sleep(600 * (attempt + 1));
    }
  }
  return null;
}

const grid = JSON.parse(readFileSync(GRID, "utf8"));
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const pool = JSON.parse(readFileSync(POOL, "utf8"));
const referenceFrames = existsSync(REFERENCE_FRAMES)
  ? JSON.parse(readFileSync(REFERENCE_FRAMES, "utf8"))
  : { note: "Frames the reference storefront renders on its own product card, per colourway. The photography rule keeps these even when a pose scan would call them a crop, because the reference ships exactly this frame.", frames: {} };
referenceFrames.frames ??= {};

mkdirSync("/tmp/vendor", { recursive: true });

let changedLeads = 0;

let vendored = 0;
let unmatched = 0;
for (const product of catalog.products) {
  const card = grid.byHandle[product.slug];
  const before = product.images[0];
  if (!card || !card.images?.length) {
    unmatched += 1;
    continue;
  }
  const limit = POSITIONS[(product.source === "reference-catalogue" ? "reference" : "local")];
  const frames = [];
  for (const url of card.images.slice(0, limit)) {
    const path = await vendor(url);
    if (!path) continue;
    referenceFrames.frames[path] ??= 2;
    if (!frames.includes(path)) frames.push(path);
    vendored += 1;
  }
  if (!frames.length) {
    unmatched += 1;
    continue;
  }
  // The reference's own order leads; our photographs of the same colourway follow, deduplicated.
  if (vendored % 200 === 0) console.log(`… ${vendored} frames vendored`);
  const rest = product.images.filter((src) => !frames.includes(src));
  const order = [...frames, ...rest];
  product.images = order;
  pool[product.slug] = order;
  if (before !== order[0]) changedLeads += 1;
}

const empty = catalog.products.filter((product) => !product.images.length).map((product) => product.slug);
writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(POOL, JSON.stringify(pool, null, 2) + "\n");
writeFileSync(REFERENCE_FRAMES, JSON.stringify(referenceFrames, null, 2) + "\n");
console.log(`reference frames vendored: ${vendored} (leads changed: ${changedLeads}) of ${catalog.products.length} colourways`);
if (unmatched) console.log(`colourways the reference grid does not list: ${unmatched}`);
if (empty.length) console.log(`rows left without a photograph: ${empty.join(", ")}`);
