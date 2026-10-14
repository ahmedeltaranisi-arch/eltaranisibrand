#!/usr/bin/env node
/**
 * Captures the reference store's own collection grid, page by page: which product each card shows
 * and — in the reference's own order — the photographs its carousel holds, the dyes its swatch rail
 * links to, its badges and its price.
 *
 *   node scripts/fetch-reference-grid.mjs [collection] [pages]
 *
 * `relay/reference-grid.json` is the All collection (the authority every later step aligns to);
 * `relay/reference-grid-<collection>.json` is any other shelf the reference links to. Card content
 * is shared between collections, so a per-collection capture keeps the All grid's cards and records
 * its own page order.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const collection = process.argv[2] ?? "all";
const pages = Number(process.argv[3] ?? 8);
const ALL_GRID = join(ROOT, "relay/reference-grid.json");
const OUT = collection === "all" ? ALL_GRID : join(ROOT, `relay/reference-grid-${collection}.json`);
const REF = "https://matethelabel.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const seedFile = collection === "all" ? previous : (existsSync(ALL_GRID) ? JSON.parse(readFileSync(ALL_GRID, "utf8")) : null);
const known = new Map((seedFile?.cards ?? []).map((card) => [card.handle, card]));
const order = new Map((collection === "all" ? previous?.cards ?? [] : []).map((card, index) => [card.handle, index]));
const sequence = [...order.keys()];

async function fetchHtml(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; eltaranisi-parity/1.0)" } });
      if (res.ok) return await res.text();
    } catch {}
    await sleep(900 * (attempt + 1));
  }
  return "";
}

function parseCards(html) {
  const starts = [...html.matchAll(/class="mate-shop-card(?: |")/g)].map((m) => m.index);
  const cards = [];
  for (let i = 0; i < starts.length; i++) {
    const segment = html.slice(starts[i], starts[i + 1] ?? starts[i] + 90000);
    const handle = /data-product-handle="([^"]+)"/.exec(segment)?.[1];
    const title = /mate-shop-card__title[^>]*>\s*<a[^>]*>([^<]*)</.exec(segment)?.[1]?.trim() ?? "";
    if (!handle) continue;
    // The card's own carousel: the photographs before the title, in the order the reference lists them.
    const media = segment.slice(0, segment.indexOf("mate-shop-card__title"));
    const images = [];
    for (const img of media.matchAll(/<img[^>]*>/g)) {
      const file = /\/\/matethelabel\.com\/cdn\/shop\/files\/([^"'?\s]+)/.exec(img[0])?.[1];
      if (!file || /^color-/.test(file)) continue;
      const url = `https://matethelabel.com/cdn/shop/files/${file}`;
      if (!images.includes(url)) images.push(url);
    }
    const swatches = [...segment.matchAll(/<a\s+class="mate-shop-card__swatch[^"]*"[\s\S]{0,700}?<\/a>/g)].map((m) => {
      const block = m[0];
      const color = /data-swatch-color="([^"]*)"/.exec(block)?.[1] ?? null;
      const sibling = /data-product-handle="([^"]*)"/.exec(block)?.[1] ?? null;
      const image = /--swatch-image:\s*url\('([^']+)'\)/.exec(block)?.[1] ?? null;
      const current = /is-current/.test(block);
      return { color, handle: sibling, image: image ? image.replace(/^\/\//, "https://").split("?")[0] : null, current };
    });
    const badges = [...segment.matchAll(/mate-shop-card__badge[^>]*>([^<]+)</g)].map((m) => m[1].trim()).filter(Boolean);
    const price = /mate-shop-card__current-price[^>]*>\s*<span[^>]*>([^<]+)</.exec(segment)?.[1]?.trim() ?? null;
    cards.push({ handle, title, lead: images[0] ?? null, images, swatches, badges, price });
  }
  return cards;
}

for (let page = 1; page <= pages; page++) {
  const html = await fetchHtml(`${REF}/collections/${collection}?page=${page}`);
  if (!html) {
    console.log("page", page, "empty — stop");
    break;
  }
  const parsed = parseCards(html);
  console.log("page", page, "cards", parsed.length);
  if (!parsed.length) break;
  for (const card of parsed) {
    if (!order.has(card.handle)) {
      order.set(card.handle, sequence.length);
      sequence.push(card.handle);
    }
    known.set(card.handle, card);
  }
  await sleep(400);
}

const ordered = sequence.map((handle) => known.get(handle)).filter(Boolean);
writeFileSync(
  OUT,
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      collection,
      cards: ordered,
      byHandle: Object.fromEntries(ordered.map((card) => [card.handle, card])),
    },
    null,
    2,
  ),
);
console.log("grid cards:", ordered.length, "->", OUT);
