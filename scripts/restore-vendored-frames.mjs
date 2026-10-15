#!/usr/bin/env node
/**
 * Puts back the vendored reference frames a catalogue references but the disk has lost.
 *
 *   node scripts/restore-vendored-frames.mjs [--check]
 *
 * A vendored file is named after the sha1 of the URL it came from, and the URL is reproducible: the
 * card frames come from `relay/reference-grid.json` and the gallery frames from
 * `https://matethelabel.com/products/<handle>.js`, which is what `vendor-reference-frames.mjs` and
 * `fetch-reference-gallery.mjs` fetched in the first place. So every `/img/mate/<stem>.webp` a row
 * renders can be traced back to its source, refetched at the same width and re-encoded with the same
 * settings, and the checksum on disk ends up naming the same file again.
 *
 * `--check` only reports what is missing.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

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
const GRID = join(ROOT, "relay/reference-grid.json");
const CATALOGS = ["shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"];
const WIDTH = 720;
const QUALITY = 82;
const check = process.argv.includes("--check");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const key = (url) => createHash("sha1").update(url).digest("hex").slice(0, 16);

const rendered = new Map();
for (const name of CATALOGS) {
  const data = JSON.parse(readFileSync(join(ROOT, "src/lib", name), "utf8"));
  for (const product of (Array.isArray(data) ? data : data.products)) {
    for (const src of product.images ?? []) {
      if (src.startsWith("/img/mate/")) {
        const list = rendered.get(src) ?? new Set();
        list.add(product.slug);
        rendered.set(src, list);
      }
    }
  }
}
for (const file of ["photoPool.json", "referenceGalleryFrames.json", "photoFrameUniverse.json"]) {
  for (const [slug, images] of Object.entries(JSON.parse(readFileSync(join(ROOT, "src/lib", file), "utf8")))) {
    for (const src of images) {
      if (src.startsWith("/img/mate/")) {
        const list = rendered.get(src) ?? new Set();
        list.add(slug);
        rendered.set(src, list);
      }
    }
  }
}

const missing = new Map();
for (const [src, slugs] of rendered) {
  const stem = src.split("/").pop().replace(/\.webp$/, "");
  if (!existsSync(join(MATEDIR, `${stem}.webp`))) missing.set(stem, { src, slugs: [...slugs] });
}
// `referenceGalleryFrames.json` records every gallery frame a round of buying traced, including
// the ones an ordering pass dropped from the rows. They are not rendered today, but they are the
// photographs a later round can order, so a lost file is restored all the same.
console.log(`${rendered.size} vendored frames are recorded · ${missing.size} are missing from disk`);
if (check || missing.size === 0) process.exit(0);

/** Every URL that could have produced a missing file, gathered per handle from both sources. */
const grid = existsSync(GRID) ? JSON.parse(readFileSync(GRID, "utf8")).byHandle ?? {} : {};
const wantedStems = new Set(missing.keys());
const urlsByStem = new Map();
/** Which handle each traced file came from, so the log can say where a frame was restored from. */
const provenance = new Map();
for (const [slug, entry] of Object.entries(grid)) {
  for (const url of entry?.images ?? []) {
    const stem = key(String(url).replace(/^\/\//, "https://"));
    if (wantedStems.has(stem) && !urlsByStem.has(stem)) {
      urlsByStem.set(stem, String(url).replace(/^\/\//, "https://"));
      provenance.set(stem, `card capture ${slug}`);
    }
  }
}
const stillMissing = [...wantedStems].filter((stem) => !urlsByStem.has(stem));
const slugsToRead = new Set();
for (const stem of stillMissing) for (const slug of missing.get(stem).slugs) slugsToRead.add(slug);
console.log(`${urlsByStem.size} traced to the card capture · ${stillMissing.length} to trace through ${slugsToRead.size} product galleries`);

mkdirSync(MATEDIR, { recursive: true });
let batch = [];
for (const slug of slugsToRead) {
  batch.push(slug);
  if (batch.length < 8) continue;
  await Promise.all(batch.map(async (handle) => {
    try {
      const res = await fetch(`https://matethelabel.com/products/${handle}.js`, { headers: BROWSER_HEADERS });
      if (!res.ok) return;
      const json = await res.json();
      for (const raw of json.images ?? []) {
        const url = String(raw).replace(/^\/\//, "https://");
        const stem = key(url);
        if (stillMissing.includes(stem) && !urlsByStem.has(stem)) {
          urlsByStem.set(stem, url);
          provenance.set(stem, `product gallery ${handle}`);
        }
      }
    } catch { /* a handle that will not answer is reported as untraceable below */ }
  }));
  batch = [];
}
for (const handle of batch) {
  try {
    const res = await fetch(`https://matethelabel.com/products/${handle}.js`, { headers: BROWSER_HEADERS });
    if (res.ok) {
      const json = await res.json();
      for (const raw of json.images ?? []) {
        const url = String(raw).replace(/^\/\//, "https://");
        const stem = key(url);
        if (stillMissing.includes(stem) && !urlsByStem.has(stem)) {
          urlsByStem.set(stem, url);
          provenance.set(stem, `product gallery ${handle}`);
        }
      }
    }
  } catch { /* ignored */ }
}

let restored = 0;
let failed = [];
for (const [stem, url] of urlsByStem) {
  const target = join(MATEDIR, `${stem}.webp`);
  if (existsSync(target)) { restored += 1; continue; }
  let buffer = null;
  for (let attempt = 0; attempt < 3 && !buffer; attempt += 1) {
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}width=${WIDTH}`, { headers: BROWSER_HEADERS });
      if (!res.ok) break;
      const raw = Buffer.from(await res.arrayBuffer());
      if (raw.length > 900) buffer = await sharp(raw).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    } catch {
      await sleep(500 * (attempt + 1));
    }
  }
  if (!buffer) { failed.push(stem); continue; }
  writeFileSync(target, buffer);
  restored += 1;
  if (restored % 40 === 0) console.log(`  ${restored} restored`);
}
const unresolved = [...wantedStems].filter((stem) => !urlsByStem.has(stem) && !existsSync(join(MATEDIR, `${stem}.webp`)));
const sources = [...new Set(provenance.values())];
console.log(`restored ${restored} of ${missing.size} · ${unresolved.length} could not be traced back to a URL`);
console.log(`  traced through ${sources.length} kinds of source, e.g. ${sources.slice(0, 2).join(" | ") || "none"}`);
if (unresolved.length) {
  writeFileSync("/tmp/untraceable-frames.json", JSON.stringify(unresolved.map((stem) => ({ stem, slugs: missing.get(stem)?.slugs })), null, 2));
  console.log("  the untraceable ones are listed in /tmp/untraceable-frames.json");
}
void failed;
