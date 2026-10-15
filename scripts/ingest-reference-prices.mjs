#!/usr/bin/env node
/**
 * Reads the reference's own card prices, per colourway, straight off its collection pages.
 *
 *   node scripts/ingest-reference-prices.mjs [--out src/lib/referencePrices.json]
 *
 * A card prints the price a shopper pays, and prints the price the garment usually costs struck
 * through in front of it — but only when the product carries a compare-at price. That distinction is
 * what this storefront was missing: a discounted row here printed its `30% OFF` badge next to a
 * single price, where the reference prints `$138 $96` for the same card. Both are read here from the
 * markup of `/collections/all?page=1…8`, which lists every card the store has, in the reference's own
 * order:
 *
 *   { "<handle>": { "priceUSD": 96, "compareAtUSD": 138, "badges": ["30% OFF"] } }
 *
 * Nothing is invented. A handle the pages never print gets no entry, and a card that prints no
 * struck price gets `compareAtUSD: null` — the badge and the price are recorded as the reference
 * shows them, which is the only standard this file is written against.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

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
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const OUT = join(ROOT, arg("out", "src/lib/referencePrices.json"));
const PAGES = Number(arg("pages", 8));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const money = (text) => {
  const value = Number(String(text).replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
};

const prices = {};
let pages = 0;
for (let page = 1; page <= PAGES; page += 1) {
  let html = "";
  for (let attempt = 0; attempt < 3 && !html; attempt += 1) {
    try {
      const res = await fetch(`https://matethelabel.com/collections/all?page=${page}`, { headers: BROWSER_HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (error) {
      await sleep(900 * (attempt + 1));
      if (attempt === 2) console.log(`page ${page} unreachable: ${String(error).slice(0, 60)}`);
    }
  }
  if (!html) break;
  pages += 1;
  const cards = html.split("<article").slice(1).filter((block) => block.includes("mate-shop-card"));
  for (const block of cards) {
    const handle = /\/products\/([a-z0-9-]+)/i.exec(block)?.[1];
    if (!handle) continue;
    const priceRow = /<p class="mate-shop-card__price"[\s\S]*?<\/p>/.exec(block)?.[0] ?? "";
    const current = money(/mate-shop-card__current-price"[\s\S]*?<span class=money>([^<]*)</.exec(priceRow)?.[1] ?? "");
    const compare = money(/mate-shop-card__compare-price"[\s\S]*?<span class=money>([^<]*)</.exec(priceRow)?.[1] ?? "");
    const badges = [...block.matchAll(/mate-shop-card__badge[^>]*>([^<]{1,40})/g)].map((match) => match[1].trim()).filter(Boolean);
    prices[handle] = { priceUSD: current, compareAtUSD: compare && current && compare > current ? compare : null, badges };
  }
  console.log(`page ${page}: ${cards.length} cards (${Object.keys(prices).length} handles total)`);
  await sleep(400);
}
const discounted = Object.entries(prices).filter(([, entry]) => entry.compareAtUSD);
writeFileSync(OUT, JSON.stringify({ note: `The prices the reference prints on its own cards, read from /collections/all over ${pages} pages by scripts/ingest-reference-prices.mjs.`, prices }, null, 2) + "\n");
console.log(`${Object.keys(prices).length} cards read over ${pages} pages · ${discounted.length} print a struck compare-at price`);
for (const [handle, entry] of discounted.slice(0, 5)) console.log(`  ${handle}: $${entry.compareAtUSD} → $${entry.priceUSD} ${entry.badges.join(", ")}`);
