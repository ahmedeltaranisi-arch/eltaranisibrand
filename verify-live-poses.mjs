import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const bySlug = new Map(Object.entries(JSON.parse(readFileSync("/tmp/catalog-map.json", "utf8"))));
const BOTTOM = new Set(["leggings", "shorts", "pants", "sweatpants", "unitards", ""]);
const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);

const pages = ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear",
  "/en/collections/all", "/en/collections/intimates", "/en/collections/sleep", "/en/collections/tees", "/en/collections/sweats"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
let checked = 0, bad = [], unknown = 0;
for (const url of pages) {
  await page.goto(`https://eltaranisibrand.vercel.app${url}?cb=b93052c`, { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const cards = await page.$$eval(".product-reveal-card", (nodes) => nodes.map((node) => {
    const img = node.querySelector(".na-product-media img");
    return { slug: node.getAttribute("data-product-slug"), src: img ? new URL(img.currentSrc || img.src, location.origin).pathname : null };
  }));
  for (const card of cards) {
    const entry = bySlug.get(card.slug);
    if (!entry || !card.src) { unknown++; continue; }
    const flags = POSES[card.src.replace(/^\/api\/images/, "")] ?? POSES[card.src];
    const whole = entry.category && PRODUCT_ONLY.has(entry.category) ? true : Boolean(flags && flags[0] && (!BOTTOM.has(entry.category) || flags[1]));
    checked++;
    if (!whole) bad.push(`${url} ${card.slug} ${card.src} flags=${JSON.stringify(flags)} cat=${entry.category}`);
    if (card.src !== entry.hero) bad.push(`${url} ${card.slug} leads with ${card.src} instead of ${entry.hero}`);
  }
  console.log(`${url}: ${cards.length} cards, running total ${checked} checked, ${bad.length} problems`);
}
await browser.close();
console.log("\nchecked:", checked, "| problems:", bad.length, "| unmatched:", unknown);
for (const b of bad.slice(0, 12)) console.log("  ✗", b);
process.exit(bad.length ? 1 : 0);
