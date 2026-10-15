/**
 * Sweeps a deployment: every card in every collection and every product-page gallery.
 *
 *   node verification/tools/live-sweep.mjs [base-url] [--pages a,b] [--hovers 6]
 *
 * Four things are checked, all of them on what the browser actually paints:
 *
 *   1. a frame is one the pose scan measured as renderable — a complete figure, a head-to-hem shot
 *      or a frame with no model in it. A cut-off model may only appear on a colourway the reference
 *      photographs no other way, which is decided from the frames the card itself lists;
 *   2. the lead frame is the best tier the colourway owns: a card never shows a head-to-hem shot
 *      while a complete figure of that same dye sits in the drawer;
 *   3. the photograph fills the 333/431 frame: `object-fit: cover` and no letterbox gap, the way the
 *      reference paints its own cards;
 *   4. a hover changes the *pose* — a different file, a different stance by the measured geometry (a
 *      same stance at another zoom is a zoom, not a pose), the card neither scales nor moves, and a
 *      card that cannot change (one frame only) does not pretend to.
 *
 * The geometry rules are the ones `scripts/order-card-frames.mjs` builds the rows with, imported
 * from `scripts/photoPoseRules.mjs`, so this sweep and the pipeline cannot disagree.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { poseRules, readSignatures } from "../../scripts/photoPoseRules.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const POSES = JSON.parse(readFileSync(`${ROOT}/src/lib/photoPoses.json`, "utf8"));
/**
 * The shelves that sell a product with no body in front of it. A close-up of a sock or a headband is
 * the product photograph there, not a model cut off, so the crop rule does not apply to them — the
 * same exemption `scripts/audit-photos.ts` grades the catalogues with, read from the same source.
 */
const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);
const CATEGORIES = {};
for (const file of ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"]) {
  const data = JSON.parse(readFileSync(`${ROOT}/src/lib/${file}`, "utf8"));
  for (const row of Array.isArray(data) ? data : data.products ?? []) CATEGORIES[row.slug] = row.category ?? "";
}
const SIGNATURES = readSignatures(`${ROOT}/src/lib/photoPoseSignatures.json`);
const HASHES = JSON.parse(readFileSync(`${ROOT}/src/lib/photoFrameHashes.json`, "utf8"));
const GALLERY = JSON.parse(readFileSync(`${ROOT}/src/lib/referenceGalleryFrames.json`, "utf8"));
const POOL = JSON.parse(readFileSync(`${ROOT}/src/lib/photoPool.json`, "utf8"));
const UNIVERSE = JSON.parse(readFileSync(`${ROOT}/src/lib/photoFrameUniverse.json`, "utf8"));
const rules = poseRules({ hashes: HASHES, signatures: SIGNATURES });
const RENDERABLE = new Set([1, 2, 3]);
const tier = (src) => POSES[src] ?? SIGNATURES[src]?.t ?? 0;

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--") ? process.argv[index + 1] : fallback;
};
const BASE = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "https://eltaranisibrand.vercel.app";
const HOVERS = Number(arg("hovers", 6));
const DEFAULT_PAGES = ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear",
  "/en/collections/all", "/en/collections/intimates", "/en/collections/sleep", "/en/collections/tees", "/en/collections/sweats"];
const pages = arg("pages", DEFAULT_PAGES.join(",")).split(",").filter(Boolean);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();
const tally = new Map();
const lines = [];
const report = (kind, line) => {
  tally.set(kind, (tally.get(kind) ?? 0) + 1);
  lines.push(`  x ${kind}: ${line}`);
};
let cards = 0;
let frames = 0;
let hovers = 0;
let poseChanges = 0;
let productPages = 0;
let galleryFrames = 0;

/**
 * Walks the page so every lazy image is fetched before anything is measured, then returns to the
 * top. `complete && naturalWidth === 0` is the only honest failure — an image still on its way is
 * reported as unknown instead of counted as broken.
 */
async function settle() {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(220);
  await page.waitForFunction(() => [...document.querySelectorAll("img")].every((img) => img.complete), null, { timeout: 15000 }).catch(() => undefined);
}

for (const url of pages) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await settle();
  const found = await page.$$eval(".product-reveal-card", (nodes) => nodes.map((node) => {
    const media = node.querySelector(".na-product-media");
    const box = media?.getBoundingClientRect();
    const images = [...(media?.querySelectorAll("img") ?? [])].map((img) => {
      const rect = img.getBoundingClientRect();
      const style = getComputedStyle(img);
      return {
        src: new URL(img.currentSrc || img.src, location.origin).pathname,
        fit: style.objectFit, transform: style.transform,
        gapW: +(rect.width - box.width).toFixed(1), gapH: +(rect.height - box.height).toFixed(1),
        painted: img.complete, natural: img.naturalWidth,
      };
    });
    return {
      slug: node.getAttribute("data-product-slug") ?? "",
      defaultSlug: node.getAttribute("data-default-slug") ?? "",
      box: box ? { w: +box.width.toFixed(1), h: +box.height.toFixed(1) } : null,
      images,
    };
  }));
  for (const card of found) {
    cards += 1;
    const anyRenderable = card.images.some((image) => RENDERABLE.has(tier(image.src)));
    for (const image of card.images) {
      frames += 1;
      // A frame the browser has not finished with is not a broken frame; only a completed decode
      // that came back empty is a real failure.
      if (!image.painted) report("unfetched", `${url} ${card.slug} ${image.src} had not finished loading when measured`);
      else if (image.natural === 0) report("broken", `${url} ${card.slug} ${image.src} failed to load`);
      const status = tier(image.src);
      if (POSES[image.src] === undefined && SIGNATURES[image.src] === undefined) {
        report("unmeasured", `${url} ${card.slug} ${image.src} was never measured`);
        continue;
      }
      const productOnly = PRODUCT_ONLY.has(CATEGORIES[card.slug] ?? CATEGORIES[card.defaultSlug] ?? "");
      if (!RENDERABLE.has(status) && anyRenderable && !productOnly) report("crop", `${url} ${card.slug} ${image.src} is a crop (status ${status}) beside a complete frame`);
      if (image.fit !== "cover") report("fit", `${url} ${card.slug} ${image.src} is painted with object-fit:${image.fit}, not cover`);
      if (image.gapW < -0.6 || image.gapH < -0.6) report("letterbox", `${url} ${card.slug} ${image.src} leaves a letterbox of ${image.gapW}x${image.gapH}`);
      // `matrix(1,0,0,1,0,0)` is the identity — the reveal animation leaves one behind, exactly as
      // the reference's own cards do. What must never appear is a scale or a shift.
      if (image.transform !== "none" && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(image.transform)) {
        report("transform", `${url} ${card.slug} ${image.src} carries a transform (${image.transform})`);
      }
    }
    if (card.box && Math.abs(card.box.w / card.box.h - 333 / 431) > 0.005) report("ratio", `${url} ${card.slug} frame is ${card.box.w}x${card.box.h}, not 333/431`);
    // The lead has to be the best photograph the colourway owns, counting every frame it holds.
    const held = [...new Set([...(POOL[card.defaultSlug] ?? []), ...(GALLERY[card.defaultSlug] ?? []), ...(UNIVERSE[card.defaultSlug] ?? []), ...card.images.map((i) => i.src)])];
    // The ladder the shelf renders by: a modelled row wants a complete figure, a still-life shelf
    // wants its flat product shot. A tier number is not a preference — 3 (flat) outranks 2 (whole)
    // only where no body is expected.
    const productOnlyRow = PRODUCT_ONLY.has(CATEGORIES[card.slug] ?? CATEGORIES[card.defaultSlug] ?? "");
    const PREFER = productOnlyRow
      ? (src) => ({ 3: 3, 2: 2, 1: 1, 0: 0 })[tier(src)] ?? 0
      : (src) => ({ 2: 3, 1: 2, 3: 1, 0: 0 })[tier(src)] ?? 0;
    const lead = card.images[0]?.src;
    const best = held.reduce((top, src) => Math.max(top, PREFER(src)), 0);
    if (lead && best > PREFER(lead)) report("not-best-lead", `${url} ${card.slug} leads with ${lead} (tier ${tier(lead)}) while it owns a tier ${held.find((src) => PREFER(src) > PREFER(lead))} frame`);
  }
  // Hover cards, in place: the media box is measured after the scroll, and the pointer is parked
  // once more before the frame list is read, so a miss cannot be mistaken for a missing pose.
  for (let index = 0; index < HOVERS; index += 1) {
    const card = page.locator(".product-reveal-card").nth(index);
    if ((await card.count()) === 0) break;
    const media = card.locator(".na-product-media");
    const box = await media.boundingBox().catch(() => null);
    if (!box) { report("no-media", `${url} card ${await card.getAttribute("data-product-slug")} has no media box`); continue; }
    const slug = await card.getAttribute("data-product-slug");
    // `hover()` scrolls the card into view inside its own scroller and moves the real pointer, so a
    // rail card clipped by `overflow: hidden` is still hovered — a manual mouse.move at the box centre
    // would land on its neighbour and read as a missing pose change.
    await media.hover();
    await page.waitForTimeout(260);
    await media.hover();
    await page.waitForTimeout(380);
    // The hover is a cross-fade: the second photograph fades in *over* the first, both at full
    // opacity for a moment, so "what the card is showing" is the top-most frame — the last one that
    // has faded in — and not the first in DOM order.
    const listed = await listedFrames(card);
    const shown = await topFrame(card);
    hovers += 1;
    if (listed.length < 2) {
      if (shown !== listed[0]) report("swap-unlisted", `${url} card ${slug} shows ${shown}, which it does not list`);
      continue;
    }
    if (shown === listed[0]) {
      report("no-pose-change", `${url} card ${slug} shows no pose change under the pointer (${listed.length} frames listed, none revealed)`);
      continue;
    }
    if (!rules.differs(listed[0], shown)) {
      report("same-pose", `${url} card ${slug} hovers to ${shown} — ${rules.why(listed[0], shown)}: not a new stance`);
      continue;
    }
    poseChanges += 1;
    const grown = await card.locator(".na-product-media").boundingBox().catch(() => null);
    if (grown && (Math.abs(grown.width - box.width) > 0.6 || Math.abs(grown.height - box.height) > 0.6)) {
      report("card-moved", `${url} card ${slug} media grows from ${box.width}x${box.height} to ${grown.width}x${grown.height} on hover`);
    }
    await page.mouse.move(2, 2);
    await page.waitForTimeout(120);
  }
  console.log(`${url}: ${found.length} cards, ${hovers} hovers so far`);
}

async function listedFrames(card) {
  return card.evaluate((node) => [...node.querySelectorAll(".na-product-media img")]
    .map((img) => new URL(img.currentSrc || img.src, location.origin).pathname));
}

/** The frame a shopper sees: the last one faded in, since the hover image is layered on top. */
async function topFrame(card) {
  return card.evaluate((node) => {
    const painted = [...node.querySelectorAll(".na-product-media img")]
      .filter((img) => img.getBoundingClientRect().height > 2 && Number(getComputedStyle(img).opacity) > 0.99);
    const top = painted[painted.length - 1] ?? painted[0];
    return top ? new URL(top.currentSrc || top.src, location.origin).pathname : "";
  });
}

const hrefs = await page.$$eval(".product-reveal-card a[href*='/products/']", (nodes) => [...new Set(nodes.map((node) => node.getAttribute("href")))]);
for (const href of hrefs.slice(0, 18)) {
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await settle();
  const images = await page.$$eval(".na-product-gallery img", (nodes) => nodes.map((img) => {
    const rect = img.getBoundingClientRect();
    return { src: new URL(img.currentSrc || img.src, location.origin).pathname, fit: getComputedStyle(img).objectFit, ratio: +(rect.width / rect.height).toFixed(4), painted: img.complete, natural: img.naturalWidth };
  })).catch(() => []);
  productPages += 1;
  const pageSlug = href.split("/").pop() ?? "";
  const pageProductOnly = PRODUCT_ONLY.has(CATEGORIES[pageSlug] ?? "");
  for (const image of images) {
    galleryFrames += 1;
    if (image.painted && image.natural === 0) report("broken", `${href} gallery ${image.src} failed to load`);
    const status = tier(image.src);
    if (status !== undefined && !RENDERABLE.has(status) && !pageProductOnly) report("crop", `${href} gallery ${image.src} is a crop (status ${status})`);
    if (image.fit !== "cover") report("fit", `${href} gallery ${image.src} uses object-fit:${image.fit}`);
    if (Math.abs(image.ratio - 333 / 431) > 0.01) report("ratio", `${href} gallery ${image.src} is painted at ${image.ratio}, not 333/431`);
  }
}

await browser.close();
const problems = lines.length;
console.log(`\nCARDS ${cards} (${frames} frames, ${hovers} hovers, ${poseChanges} pose changes) | PRODUCT PAGES ${productPages} (${galleryFrames} gallery frames) | problems: ${problems}`);
if (tally.size) console.log(`  kinds: ${[...tally].sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${kind} ${n}`).join(" · ")}`);
for (const line of lines.slice(0, 20)) console.log(line);
process.exit(problems ? 1 : 0);
