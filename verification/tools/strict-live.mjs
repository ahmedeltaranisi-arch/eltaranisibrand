/** Every rendered frame on every collection page, card and product page must be a complete shot. */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const BASE = "https://eltaranisibrand.vercel.app";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const problems = [];
let frames = 0, cards = 0;
const urls = ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear",
  "/en/collections/all", "/en/collections/intimates", "/en/collections/sleep", "/en/collections/tees", "/en/collections/sweats",
  "/en/collections/clothing", "/en/collections/loungewear"];
for (const url of urls) {
  await page.goto(`${BASE}${url}?cb=d1b32b0`, { waitUntil: "networkidle", timeout: 90000 });
  for (let i = 0; i < 4; i++) { await page.evaluate((y) => window.scrollTo(0, y), i * 1200); await page.waitForTimeout(400); }
  const found = await page.$$eval(".product-reveal-card", (nodes) => nodes.map((n) => ({
    slug: n.getAttribute("data-product-slug"),
    srcs: [...n.querySelectorAll(".na-product-media img")].map((i) => new URL(i.currentSrc || i.src, location.origin).pathname),
  })));
  for (const card of found) {
    cards++;
    for (const src of card.srcs) {
      frames++;
      const flags = POSES[src];
      if (flags !== 2) problems.push(`${url} ${card.slug} ${src} status=${flags}`);
    }
  }
  console.log(`${url}: ${found.length} cards | ${frames} frames | ${problems.length} problems`);
}
await browser.close();
console.log(`\nCARDS ${cards} | FRAMES ${frames} | problems ${problems.length}`);
for (const p of problems.slice(0, 10)) console.log("  ✗", p);
process.exit(problems.length ? 1 : 0);
