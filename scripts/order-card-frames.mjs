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
 *   3. a frame that `scripts/photoPoseRules.mjs` calls the same stance — within 20 bits of an earlier
 *      frame's difference hash, or moving the model less than the pose gap between them — is dropped
 *      from the row, so consecutive frames are consecutive poses;
 *   4. the hover frame is further chosen from the ones shot at a comparable distance, so swapping to
 *      it reads as the model moving and not as the card zooming into the same photograph;
 *   5. the row keeps at most `--max` frames, so a shelf's swipe stays honest about what it owns.
 *
 * `src/lib/photoPool.json` is written from the same lists, so every catalogue that pools a slug's
 * frames (Shop All, New Arrivals, Activewear) agrees on one order.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { poseRules, readSignatures } from "./photoPoseRules.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const POOL = join(ROOT, "src/lib/photoPool.json");
const POSSES = join(ROOT, "src/lib/photoPoses.json");
const HASHES = join(ROOT, "src/lib/photoFrameHashes.json");
const SIGS = join(ROOT, "src/lib/photoPoseSignatures.json");
const GALLERY = join(ROOT, "src/lib/referenceGalleryFrames.json");
const UNIVERSE = join(ROOT, "src/lib/photoFrameUniverse.json");
const GRID = join(ROOT, "relay/reference-grid.json");
const CATALOGS = ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"];

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? Number(process.argv[index + 1]) : fallback;
};
const max = arg("max", 8);
const dry = process.argv.includes("--dry");

const statuses = JSON.parse(readFileSync(POSSES, "utf8"));
const hashes = existsSync(HASHES) ? JSON.parse(readFileSync(HASHES, "utf8")) : {};
const signatures = readSignatures(SIGS);
const rules = poseRules({ hashes, signatures });
const galleryIndex = existsSync(GALLERY) ? JSON.parse(readFileSync(GALLERY, "utf8")) : {};
const grid = existsSync(GRID) ? JSON.parse(readFileSync(GRID, "utf8")).byHandle ?? {} : {};
const pool = JSON.parse(readFileSync(POOL, "utf8"));
const universeFile = existsSync(UNIVERSE) ? JSON.parse(readFileSync(UNIVERSE, "utf8")) : {};

const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);
/** A frame's tier: the rendered scan first, then the universe scan's verdict for what it may pick. */
const tier = (src) => (statuses[src] ?? signatures[src]?.t ?? 0);

/**
 * Whether a recorded frame can be used: `/img/mate` and `/img/aw` files live in the repository, and a
 * path the gallery index remembers but the disk has not (yet) delivered is no candidate at all.
 * `/img/new-arrivals` frames are served from the pinned catalogue mirror, outside `public/`.
 */
function onDisk(src) {
  if (!src.startsWith("/img/mate/") && !src.startsWith("/img/aw/")) return true;
  if (existsSync(join(ROOT, "public", src))) return true;
  // Frames a previous round bought but the repository does not carry (they are not rendered, so they
  // are not committed) live in the download cache: same files, same names, out of tree.
  const cache = process.env.FRAME_CACHE;
  return Boolean(cache) && existsSync(join(cache, src.split("/").pop()));
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

/**
 * Every frame a slug owns: the pool and the rows (what the storefront renders today), the recorded
 * reference galleries, the reference's own card capture, and `photoFrameUniverse.json` — the list of
 * everything a previous pass considered, including the poses it set aside. A frame that is on disk is
 * never forgotten: the universe is written back at the end of this run, so dropping a frame from a
 * row is a rendering decision and not a deletion.
 */
for (const { products } of catalogs) {
  for (const product of products) {
    const frames = rowsBySlug.get(product.slug) ?? [];
    const captured = (grid[product.slug]?.images ?? []).map((url) => `/img/mate/${createHash("sha1").update(String(url).replace(/^\/\//, "https://")).digest("hex").slice(0, 16)}.webp`);
    const considered = [...(universeFile[product.slug] ?? []), ...(pool[product.slug] ?? []), ...(product.images ?? []), ...(galleryIndex[product.slug] ?? []), ...captured];
    for (const src of considered) {
      if (!frames.includes(src) && onDisk(src)) frames.push(src);
    }
    rowsBySlug.set(product.slug, frames);
  }
}

/**
 * The list a colourway renders: tiered, in the reference's own order inside a tier, with the frames
 * that are not a new stance dropped so a hover always means a different pose — and with the hover
 * frame picked from the ones photographed at a comparable distance, so it never reads as a zoom.
 */
function orderedFrames(slug, frames, category) {
  const byReference = referenceRank(slug);
  const galleryList = galleryIndex[slug] ?? [];
  // The same ladder src/lib/photoSelection.ts renders on: a row keeps its complete figures and its
  // head-to-hem shots — complete figures first — and only a colourway with nothing else keeps a crop,
  // so a dye the reference sells is never dropped over its photography. A shelf that sells a product
  // with no body in it prefers its flat stills, and a detail crop goes the same way it does anywhere
  // else: only when nothing better exists.
  const renderable = PRODUCT_ONLY.has(category)
    // A shelf that sells a product with no body in front of it keeps everything it owns — a flat
    // still, a close-up of the fabric, a model wearing it — and the sort below puts the stills first.
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

  /** A frame may join `out` when it is a new stance against every frame already kept. */
  const fresh = (src, out) => out.every((other) => rules.differs(src, other));

  const out = [];
  for (const src of sorted) {
    if (!fresh(src, out)) continue;
    // The second frame is the one a pointer reveals, so it must also hold the model the same size.
    if (out.length === 1 && !rules.holds(out[0], src)) continue;
    out.push(src);
    if (out.length >= max) break;
  }
  // A colourway whose only new stance is shot from another distance still changes pose on a hover:
  // that is the reference's own photography, and a real second pose beats no second pose. It is
  // taken as a second pass, never in place of a frame that holds the framing.
  if (out.length === 1 && sorted.length > 1) {
    const second = sorted.find((src) => src !== out[0] && fresh(src, out));
    if (second) out.push(second);
  }
  // A card cycles: the frame after the last one is the first. If those two are the same stance, or
  // the model stands at another size between them, the last hover of the cycle is a zoom, so the
  // last frame goes instead.
  while (out.length > 2 && (!rules.differs(out[out.length - 1], out[0]) || !rules.holds(out[0], out[out.length - 1]))) out.pop();
  if (out.length === 2 && (!rules.differs(out[1], out[0]) || out[1] === out[0])) out.pop();
  return out;
}

const lists = new Map();
for (const [slug, frames] of rowsBySlug) {
  const category = catalogs.flatMap((entry) => entry.products).find((product) => product.slug === slug)?.category ?? "";
  lists.set(slug, orderedFrames(slug, frames, category));
}

let zoomHover = 0;
for (const { name, data, products } of catalogs) {
  for (const product of products) {
    const next = lists.get(product.slug) ?? [];
    if (next.length === 0) console.log(`  ! ${name}: ${product.slug} owns no frame at all`);
    if (next.length < 2) single += 1;
    if (tier(next[0]) === 2) leadWhole += 1;
    if (next.length > 1 && !rules.holds(next[0], next[1])) {
      zoomHover += 1;
      console.log(`  ~ ${name}: ${product.slug} hovers at another distance — ${rules.why(next[0], next[1])}`);
    }
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
  // The universe keeps every frame a colourway holds, in the order the pass considered them, so the
  // next pass can put a set-aside pose back without anyone re-downloading it.
  const out = {};
  for (const [slug, frames] of rowsBySlug) out[slug] = frames;
  writeFileSync(UNIVERSE, JSON.stringify(out, null, 2) + "\n");
}
const total = catalogs.reduce((sum, entry) => sum + entry.products.length, 0);
console.log(`${dry ? "would reorder" : "reordered"} ${changed} of ${total} rows · ${leadWhole} lead with a whole figure · ${single} rows hold a single frame · ${zoomHover} hover at another distance`);
