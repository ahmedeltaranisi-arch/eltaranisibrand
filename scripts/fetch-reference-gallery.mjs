#!/usr/bin/env node
/**
 * Buys the frames a card still lacks: complete poses of the colourway it is showing.
 *
 *   node scripts/fetch-reference-gallery.mjs [--round 1] [--per-round 4] [--budget 1200] [--dry]
 *
 * The reference store keeps one product per colourway, so its own product gallery — every frame
 * `https://matethelabel.com/products/<handle>.js` lists, in the order it publishes them — is a
 * colour-correct set of photographs of exactly the garment the card sells. This storefront already
 * vendored the frames the reference's *card* carousel renders; this script walks the rest of the
 * gallery for the colourways that cannot yet show two distinct whole-figure poses.
 *
 * A vendored file is named after the sha1 of the URL it came from, so the download is idempotent:
 * a frame the last round fetched is recognised and skipped without any bookkeeping. Frames land in
 * `public/img/mate/`, are appended to `src/lib/photoPool.json`, and are recorded per colourway in
 * `src/lib/referenceGalleryFrames.json`, which is what `scripts/order-card-frames.mjs` reads to
 * keep the reference's own card lead in front of its gallery frames.
 *
 * Rounds keep the repository small: each round buys a few more frames per colourway, then
 * `python3 scripts/scan-photo-poses.py` measures them and `order-card-frames.mjs` picks. A
 * colourway that already has two distinct complete poses is left alone, so the budget is spent on
 * the ones that actually need it.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { poseRules, readSignatures } from "./photoPoseRules.mjs";

/**
 * The reference store's CDN answers a plain bot signature with an interstitial, so every
 * request carries a browser's own headers. The frames are the reference's published product
 * photography; this is the same content a shopper's browser is served.
 */
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

const ROOT = new URL("..", import.meta.url).pathname;
const MATEDIR = join(ROOT, "public/img/mate");
const CATALOGS = ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"];
const POOL = join(ROOT, "src/lib/photoPool.json");
const POSSES = join(ROOT, "src/lib/photoPoses.json");
const HASHES = join(ROOT, "src/lib/photoFrameHashes.json");
const GALLERY = join(ROOT, "src/lib/referenceGalleryFrames.json");
const SIGS = join(ROOT, "src/lib/photoPoseSignatures.json");
const WIDTH = 720;
const QUALITY = 82;
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? process.argv[index + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);
const round = Number(arg("round", 1));
const perRound = Number(arg("per-round", 4));
const budget = Number(arg("budget", 1400));
const dry = flag("dry");
/** Milliseconds between handles: a request per second is what a shopper's browser does, and what the
 * storefront's filter lets through. */
const pace = Number(arg("pace", 260));

const key = (url) => createHash("sha1").update(url).digest("hex").slice(0, 16);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rows() {
  const out = [];
  for (const name of CATALOGS) {
    const data = JSON.parse(readFileSync(join(ROOT, "src/lib", name), "utf8"));
    const products = Array.isArray(data) ? data : data.products;
    for (const product of products) out.push({ name, product });
  }
  return out;
}

const statuses = JSON.parse(readFileSync(POSSES, "utf8"));
const hashes = existsSync(HASHES) ? JSON.parse(readFileSync(HASHES, "utf8")) : {};
const signatures = readSignatures(SIGS);
/** The same rules `scripts/order-card-frames.mjs` orders with, so the rounds chase what ordering needs. */
const rules = poseRules({ hashes, signatures });
const pool = JSON.parse(readFileSync(POOL, "utf8"));
const galleryIndex = existsSync(GALLERY) ? JSON.parse(readFileSync(GALLERY, "utf8")) : {};

/** Frames a colourway can render: its pool entry first, then the row's own list. */
function candidates(slug, images) {
  const out = [];
  for (const src of [...(pool[slug] ?? []), ...images]) if (!out.includes(src)) out.push(src);
  return out;
}

/**
 * `true` when a colourway can already lead with a complete figure and swap to a second complete
 * figure that `scripts/photoPoseRules.mjs` agrees is a different stance at a comparable distance. A
 * pair that passes on pixels alone but is the same stance reframed is not enough: the card would be
 * buying a zoom, and the shopper would see it.
 */
function hasTwoWholePoses(frames) {
  const whole = frames.filter((src) => (statuses[src] ?? signatures[src]?.t ?? 0) === 2);
  if (whole.length < 2) return false;
  for (let i = 0; i < whole.length; i += 1) {
    for (let j = i + 1; j < whole.length; j += 1) {
      if (rules.differs(whole[i], whole[j]) && rules.holds(whole[i], whole[j])) return true;
    }
  }
  return false;
}

const need = [];
for (const { name, product } of rows()) {
  if (product.category === "socks" || product.category === "headbands" || product.category === "accessories") continue;
  const frames = candidates(product.slug, product.images);
  if (hasTwoWholePoses(frames)) continue;
  need.push({ name, product, frames });
}
console.log(`${need.length} colourways of ${rows().length} cannot yet swap to a second whole pose (round ${round})`);
if (dry) {
  console.log(need.slice(0, 12).map((entry) => `  ${entry.product.slug} (${entry.name})`).join("\n"));
  process.exit(0);
}

/** Already-vendored URLs are recognised by their file name, so a re-run buys nothing twice. */
const bought = new Set(existsSync(MATEDIR) ? readdirSync(MATEDIR).map((file) => file.replace(/\.webp$/, "")) : []);

let spent = 0;
let helped = 0;
let failed = 0;
mkdirSync(MATEDIR, { recursive: true });

for (const entry of need) {
  if (spent >= budget) { console.log(`budget of ${budget} frames spent — rerun with a higher --budget`); break; }
  await sleep(pace);
  const { product, frames } = entry;
  let json;
  try {
    const res = await fetch(`https://matethelabel.com/products/${product.slug}.js`, { headers: BROWSER_HEADERS });
    if (!res.ok) { failed += 1; continue; }
    json = await res.json();
  } catch {
    failed += 1;
    continue;
  }
  const urls = (json.images ?? []).map((url) => String(url).replace(/^\/\//, "https://"));
  const fresh = [];
  const known = new Set(frames);
  for (const url of urls) {
    const stem = key(url);
    if (bought.has(stem)) {
      // The file is on disk already (it was a card frame): count it as a candidate, buy nothing.
      continue;
    }
    // A frame the last round recorded is not necessarily a frame the repository still has — the
    // gallery index is a record of what was traced, so only a file that is really on disk is left
    // alone. Otherwise a lost download would be declared unbuyable forever.
    if (galleryIndex[product.slug]?.includes(`/img/mate/${stem}.webp`) && existsSync(join(MATEDIR, `${stem}.webp`))) continue;
    fresh.push({ url, path: `/img/mate/${stem}.webp`, stem });
    if (fresh.length >= perRound + (round - 1) * perRound) break;
  }
  let taken = 0;
  for (const frame of fresh) {
    if (spent >= budget) break;
    if (known.has(frame.path)) continue;
    const target = join(MATEDIR, `${frame.stem}.webp`);
    if (!existsSync(target)) {
      let buffer = null;
      for (let attempt = 0; attempt < 3 && !buffer; attempt += 1) {
        try {
          // Shopify serves a resized copy through a query parameter, and a gallery URL may already
          // carry one (`?v=<version>`), so the separator has to follow the URL, not be assumed.
          const res = await fetch(`${frame.url}${frame.url.includes("?") ? "&" : "?"}width=${WIDTH}`, { headers: BROWSER_HEADERS });
          if (!res.ok) break;
          const raw = Buffer.from(await res.arrayBuffer());
          if (raw.length > 900) buffer = await sharp(raw).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
        } catch {
          await sleep(400 * (attempt + 1));
        }
      }
      if (!buffer) continue;
      writeFileSync(target, buffer);
    }
    bought.add(frame.stem);
    galleryIndex[product.slug] ??= [];
    if (!galleryIndex[product.slug].includes(frame.path)) galleryIndex[product.slug].push(frame.path);
    const list = pool[product.slug] ??= [...product.images];
    if (!list.includes(frame.path)) list.push(frame.path);
    entry.frames.push(frame.path);
    taken += 1;
    spent += 1;
  }
  if (taken && hasTwoWholePoses(candidates(product.slug, [...product.images, ...(galleryIndex[product.slug] ?? [])]))) helped += 1;
  if (taken) console.log(`  ${product.slug}: +${taken} gallery frames`);
}

writeFileSync(POOL, JSON.stringify(pool, null, 2) + "\n");
writeFileSync(GALLERY, JSON.stringify(galleryIndex, null, 2) + "\n");
console.log(`bought ${spent} frames for ${need.length} colourways (${failed} handles not reachable) — measure them with scripts/scan-photo-poses.py`);
void helped;
