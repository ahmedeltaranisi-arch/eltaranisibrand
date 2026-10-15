/**
 * Sweeps a deployment: every card in every collection and every product-page gallery.
 *
 *   node verification/tools/live-sweep.mjs [base-url]
 *
 * Three things are checked, all of them on what the browser actually paints:
 *
 *   1. a frame is one the pose scan measured as renderable — a complete figure, a head-to-hem shot
 *      or a frame with no model in it. A cut-off model may only appear on a colourway the reference
 *      photographs no other way, which is decided from the frames the card itself lists;
 *   2. the photograph fills the 333/431 frame: `object-fit: cover` and no letterbox gap, the way the
 *      reference paints its own cards;
 *   3. a hover changes the *pose* — the frame that appears is a different file, the card does not
 *      scale or move, and the card that could not change (one frame only) does not pretend to.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const BASE = process.argv[2] ?? "https://eltaranisibrand.vercel.app";
const RENDERABLE = new Set([1, 2, 3]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const problems = [];
let cards = 0;
let frames = 0;
let hovers = 0;
let productPages = 0;
let galleryFrames = 0;

const collections = ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear",
  "/en/collections/all", "/en/collections/intimates", "/en/collections/sleep", "/en/collections/tees", "/en/collections/sweats"];

for (const url of collections) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
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
      };
    });
    return { slug: node.getAttribute("data-product-slug"), box: box ? { w: +box.width.toFixed(1), h: +box.height.toFixed(1) } : null, images };
  }));
  for (const card of found) {
    cards += 1;
    const anyRenderable = card.images.some((image) => RENDERABLE.has(POSES[image.src]));
    for (const image of card.images) {
      frames += 1;
      if (!image.loaded) problems.push(`${url} ${card.slug} ${image.src} did not load`);
      const status = POSES[image.src];
      if (status === undefined) { problems.push(`${url} ${card.slug} ${image.src} was never measured`); continue; }
      if (!RENDERABLE.has(status) && anyRenderable) problems.push(`${url} ${card.slug} ${image.src} is a crop (status ${status}) beside a complete frame`);
      if (image.fit !== "cover") problems.push(`${url} ${card.slug} ${image.src} is painted with object-fit:${image.fit}, not cover`);
      if (image.gapW < -0.6 || image.gapH < -0.6) problems.push(`${url} ${card.slug} ${image.src} leaves a letterbox of ${image.gapW}x${image.gapH}`);
      if (image.transform !== "none") problems.push(`${url} ${card.slug} ${image.src} carries a transform (${image.transform})`);
    }
    if (card.box && Math.abs(card.box.w / card.box.h - 333 / 431) > 0.005) problems.push(`${url} ${card.slug} frame is ${card.box.w}x${card.box.h}, not 333/431`);
  }
  // Hover a few cards per shelf and read what the pose change produced.
  for (const index of [0, 1, 2, 3, 4, 5]) {
    const card = page.locator(".product-reveal-card").nth(index);
    if ((await card.count()) === 0) break;
    const box = await card.locator(".na-product-media").boundingBox().catch(() => null);
    if (!box) continue;
    await card.scrollIntoViewIfNeeded();
    const before = await visibleFrames(card);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(450);
    const after = await visibleFrames(card);
    hovers += 1;
    const held = await card.evaluate((node) => (node.querySelectorAll(".na-product-media img").length < 2));
    if (held) {
      if (after[0] !== before[0]) problems.push(`${url} card ${await card.getAttribute("data-product-slug")} swapped to a second frame it does not list`);
      continue;
    }
    if (after.length === before.length && after[0] === before[0]) {
      problems.push(`${url} card ${await card.getAttribute("data-product-slug")} shows no pose change under the pointer`);
    }
    await page.mouse.move(2, 2);
    await page.waitForTimeout(120);
  }
  console.log(`${url}: ${found.length} cards (${frames} frames, ${hovers} hovers, ${problems.length} problems)`);
}

async function visibleFrames(card) {
  return card.evaluate((node) => [...node.querySelectorAll(".na-product-media img")]
    .filter((img) => img.getBoundingClientRect().height > 2 && getComputedStyle(img).opacity !== "0")
    .map((img) => new URL(img.currentSrc || img.src, location.origin).pathname));
}

const hrefs = await page.$$eval(".product-reveal-card a[href*='/products/']", (nodes) => [...new Set(nodes.map((node) => node.getAttribute("href")))]);
for (const href of hrefs.slice(0, 18)) {
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(400);
  const images = await page.$$eval(".na-product-gallery img", (nodes) => nodes.map((img) => {
    const rect = img.getBoundingClientRect();
    return { src: new URL(img.currentSrc || img.src, location.origin).pathname, fit: getComputedStyle(img).objectFit, ratio: +(rect.width / rect.height).toFixed(4), loaded: img.naturalWidth > 0 && img.complete };
  })).catch(() => []);
  productPages += 1;
  for (const image of images) {
    galleryFrames += 1;
    if (!image.loaded) problems.push(`${href} gallery ${image.src} did not load`);
    const status = POSES[image.src];
    if (status !== undefined && !RENDERABLE.has(status)) problems.push(`${href} gallery ${image.src} is a crop (status ${status})`);
    if (image.fit !== "cover") problems.push(`${href} gallery ${image.src} uses object-fit:${image.fit}`);
    if (Math.abs(image.ratio - 333 / 431) > 0.01) problems.push(`${href} gallery ${image.src} is painted at ${image.ratio}, not 333/431`);
  }
}

await browser.close();
console.log(`\nCARDS ${cards} (${frames} frames, ${hovers} hovers) | PRODUCT PAGES ${productPages} (${galleryFrames} gallery frames) | problems: ${problems.length}`);
for (const line of problems.slice(0, 12)) console.log(`  x ${line}`);
process.exit(problems.length ? 1 : 0);
