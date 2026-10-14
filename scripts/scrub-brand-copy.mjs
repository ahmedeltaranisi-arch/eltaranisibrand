/**
 * The storefront is Eltaranisi Brand. Every product description this pipeline ingests comes from
 * the reference store's own product JSON, and that copy occasionally names the label it came from
 * ("The MATE Dress Code…", "MATE the Label gift cards…"). This pass rewrites those mentions in the
 * catalogue's customer-visible copy, so no product page can print another brand's name.
 *
 * It is idempotent and safe to re-run: `sync-catalogue-labels.mjs` handles the vocabulary and this
 * handles the prose. The ingestion script calls `scrubCopy` on every description it writes, so the
 * rule survives a fresh ingest.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CATALOGS = [
  "src/lib/shopAllCatalog.json",
  "src/lib/newArrivalsCatalog.json",
];

export const BRAND = "Eltaranisi Brand";

const RULES = [
  [/matethelabel\.com/gi, "eltaranisibrand.com"],
  [/mate_the_label/gi, "eltaranisibrand"],
  [/MATEtheLabel/g, BRAND],
  [/MATE\s+the\s+Label/g, BRAND],
  [/\bMATE\b/g, BRAND],
];

/** Rewrites the reference's brand name out of a block of customer-visible copy. */
export function scrubCopy(text) {
  if (typeof text !== "string" || !text) return text;
  let out = text;
  for (const [pattern, replacement] of RULES) out = out.replace(pattern, replacement);
  return out;
}

/** Walks a catalogue object and scrubs every string it holds (descriptions, titles, copy). */
function scrubValue(value) {
  if (typeof value === "string") return scrubCopy(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue(item));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = scrubValue(child);
    return out;
  }
  return value;
}

function scrubFile(relative) {
  const path = join(ROOT, relative);
  let before;
  try {
    before = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return 0;
  }
  const flat = JSON.stringify(before);
  const after = scrubValue(before);
  const text = JSON.stringify(after, null, 2) + "\n";
  const hits = (flat.match(/matethelabel\.com|mate_the_label|MATEtheLabel|\bMATE\b/g) ?? []).length;
  if (!hits) {
    console.log(`${relative}: nothing to rewrite`);
    return 0;
  }
  writeFileSync(path, text);
  console.log(`${relative}: ${hits} mention(s) rewritten to “${BRAND}”`);
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let total = 0;
  for (const catalog of CATALOGS) total += scrubFile(catalog);
  console.log(`brand mentions rewritten: ${total}`);
}
