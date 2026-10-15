/**
 * Records, per shelf, whether the reference prints a struck-through compare-at price there — and
 * the exact styles it gives the two prices when it does.
 *
 *   node verification/tools/shelf-prices.mjs [output.json]
 *
 * The reference's card markup is the same everywhere, but its *section settings* are not: the Shop
 * All grid shows only the current price even on a card wearing a `30% OFF` badge, while the waffle
 * shelf prints `$138` struck through next to `$96`. That difference is a fact about the reference, so
 * it is captured as one — `src/lib/shelfSalePrices.json` — instead of being guessed at.
 *
 * For each shelf the tool counts the cards on the reference's own first two pages, how many of them
 * print a compare-at price, and how many wear a discount badge. A shelf that shows a discounted card
 * and prints no compare-at is a shelf that suppresses sale prices.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const REF = "https://matethelabel.com";
const ALLOW = /(matethelabel\.com|cdn\.shopify\.com|\.shopify\.com|shopify\.net)/;
const SHELVES = [
  "all", "new-arrivals", "best-sellers", "activewear", "tees", "sweats", "sweatshirts", "sweatpants",
  "sweaters", "bottoms", "leggings", "sports-bras", "intimates", "sleep", "socks", "fleece", "waffle",
  "cozy-shop", "october-capsule", "getaway-edit", "up-to-50-off", "bundle-and-save", "pima-cotton",
  "merino-wool", "organic-stretch", "heather-oat", "balsam", "nori", "peppercorn", "wisteria",
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1347, height: 1400 }, reducedMotion: "reduce" });
await context.route("**/*", (route) => (ALLOW.test(route.request().url()) ? route.continue() : route.abort()));
const page = await context.newPage();
const report = {};
let styles = null;

for (const handle of SHELVES) {
  const row = { cards: 0, compare: 0, discounted: 0 };
  for (const path of [`/collections/${handle}`, `/collections/${handle}?page=2`]) {
    try {
      await page.goto(REF + path, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch {
      continue;
    }
    await page.waitForTimeout(1200);
    const found = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("article.mate-shop-card")];
      return {
        cards: cards.length,
        compare: cards.filter((card) => card.querySelector(".mate-shop-card__compare-price")).length,
        discounted: cards.filter((card) => /%\s*OFF/i.test(card.textContent ?? "")).length,
      };
    });
    row.cards += found.cards;
    row.compare += found.compare;
    row.discounted += found.discounted;
    if (!styles && found.compare > 0) {
      styles = await page.evaluate(() => {
        const card = [...document.querySelectorAll("article.mate-shop-card")].find((node) => node.querySelector(".mate-shop-card__compare-price"));
        if (!card) return null;
        const pick = (el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { font: s.font, size: s.fontSize, weight: s.fontWeight, spacing: s.letterSpacing, colour: s.color, decoration: s.textDecorationLine, gap: s.columnGap, display: s.display, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
        };
        const price = card.querySelector(".mate-shop-card__price");
        return { price: pick(price), compare: pick(price.querySelector(".mate-shop-card__compare-price")), current: pick(price.querySelector(".mate-shop-card__current-price")) };
      });
    }
    if (row.cards > 0 && path.endsWith("page=2")) break;
  }
  report[handle] = row;
  console.log(`${handle.padEnd(22)} cards ${String(row.cards).padStart(3)} · compare ${String(row.compare).padStart(3)} · discounted ${String(row.discounted).padStart(3)}`);
}
await browser.close();

const shelves = {};
for (const [handle, row] of Object.entries(report)) {
  shelves[handle] = row.discounted > 0 ? (row.compare > 0 ? "shown" : "suppressed") : "untested";
}
const out = process.argv[2] ?? "/tmp/shelf-prices.json";
writeFileSync(out, JSON.stringify({ note: "Which shelves of the reference print a struck compare-at price on a discounted card. Derived by verification/tools/shelf-prices.mjs.", styles, shelves }, null, 2) + "\n");
console.log(`wrote ${out}`);
if (styles) console.log("styles:", JSON.stringify(styles));
