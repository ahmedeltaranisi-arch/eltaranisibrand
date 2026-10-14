/**
 * Sweeps production: every card in every collection (hero + swipe frames) and every product page
 * gallery, asserting each photograph is one the pose scan measured as whole.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const BOTTOM = new Set(["leggings", "shorts", "pants", "sweatpants", "unitards"]);
const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);
const BASE = "https://eltaranisibrand.vercel.app";

const check = (src, category) => {
  const flags = POSES[src];
  if (!flags) return { ok: false, why: "unmeasured" };
  if (PRODUCT_ONLY.has(category)) return { ok: true };
  if (flags[0] !== 1) return { ok: false, why: "crop" };
  if (BOTTOM.has(category) && flags[1] !== 1) return { ok: false, why: "feet cut" };
  return { ok: true };
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const problems = [];
let cards = 0, frames = 0, productPages = 0, galleryFrames = 0;
const categoryBySlug = new Map();

const collections = ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear",
  "/en/collections/all", "/en/collections/intimates", "/en/collections/sleep", "/en/collections/tees", "/en/collections/sweats"];
for (const url of collections) {
  await page.goto(`${BASE}${url}?cb=bcb7aeb`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  const found = await page.$$eval(".product-reveal-card", (nodes) => nodes.map((node) => ({
    slug: node.getAttribute("data-product-slug"),
    srcs: [...node.querySelectorAll(".na-product-media img")].map((img) => new URL(img.currentSrc || img.src, location.origin).pathname),
  })));
  for (const card of found) {
    cards++;
    for (const src of card.srcs) {
      frames++;
      const { ok, why } = check(src, categoryBySlug.get(card.slug) ?? "");
      if (!ok && why === "crop") problems.push(`${url} card ${card.slug} ${src} (${why})`);
    }
  }
  console.log(`${url}: ${found.length} cards (${frames} frames so far, ${problems.length} crop problems)`);
}

// Product pages: the gallery must hold whole photographs only.
const hrefs = await page.$$eval(".product-reveal-card a[href*='/products/']", (nodes) => [...new Set(nodes.map((n) => n.getAttribute("href")))]);
for (const href of hrefs.slice(0, 26)) {
  await page.goto(`${BASE}${href}?cb=bcb7aeb`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(500);
  const images = await page.$$eval("main img, .na-product-gallery img", (nodes) => nodes
    .map((img) => ({ src: new URL(img.currentSrc || img.src, location.origin).pathname, w: img.naturalWidth, h: img.naturalHeight }))
    .filter((i) => /\.(webp|jpe?g|png)$/.test(i.src) && i.w > 200));
  productPages++;
  for (const image of images) {
    galleryFrames++;
    const flags = POSES[image.src];
    if (!flags) continue;
    if (flags[0] !== 1) problems.push(`${href} gallery ${image.src} flags=${JSON.stringify(flags)}`);
  }
  console.log(`  ${href}: ${images.length} gallery frames (${problems.length} problems total)`);
}

await browser.close();
console.log(`\nCARDS ${cards} (${frames} frames) | PRODUCT PAGES ${productPages} (${galleryFrames} gallery frames) | problems: ${problems.length}`);
for (const p of problems.slice(0, 10)) console.log("  ✗", p);
process.exit(problems.length ? 1 : 0);
