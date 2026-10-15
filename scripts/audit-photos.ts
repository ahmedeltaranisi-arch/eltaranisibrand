import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import { frameRank, frameStatus, hoverFrame, isProductOnly } from "../src/lib/photoSelection";
import hashes from "../src/lib/photoFrameHashes.json";

/**
 * A report on what the shelves can actually show, read straight from the catalogues after
 * `scripts/order-card-frames.mjs` has ordered them. Every number here is derived, not asserted:
 * a row that lost its photograph, a crop that slipped through or a card that cannot change pose
 * shows up as a line below.
 */
const HASH = hashes as unknown as Record<string, string>;
/** Below this many differing bits, two frames are the same pose at another zoom. */
const POSE_DISTANCE = 20;
/** One bits per byte, so a hash comparison is a table lookup per hex pair. */
const POPCOUNT = Array.from({ length: 256 }, (_, value) => value.toString(2).split("0").join("").length);
/** Bits two difference hashes disagree on — hex pairs, so no BigInt is needed below ES2020. */
const distance = (a: string, b: string) => {
  const left = a.padStart(64, "0");
  const right = b.padStart(64, "0");
  let bits = 0;
  for (let index = 0; index < left.length; index += 2) {
    bits += POPCOUNT[parseInt(left.slice(index, index + 2), 16) ^ parseInt(right.slice(index, index + 2), 16)];
  }
  return bits;
};

const catalogues = [["activewear", activewearProducts], ["new arrivals", arrivalCatalog], ["shop all", shopAllProducts]] as const;
const tiers = [0, 0, 0, 0];
let rows = 0;
let frames = 0;
let wholeLead = 0;
let single = 0;
let zoomSwap = 0;
const violations: string[] = [];

for (const [name, products] of catalogues) {
  for (const product of products) {
    rows += 1;
    frames += product.images.length;
    for (const src of product.images) tiers[frameRank(src)] += 1;
    if (!isProductOnly(product.category) && frameStatus(product.images[0]) === "whole") wholeLead += 1;
    if (product.images.length < 2) single += 1;
    for (const src of product.images) {
      // A crop may only render when it is all the colourway owns.
      if (frameStatus(src) === "crop" && !isProductOnly(product.category)
        && product.images.some((other) => other !== src && frameStatus(other) !== "crop")) {
        violations.push(`${name}: ${product.slug} renders ${src}, a cut-off model, beside a complete frame`);
      }
    }
    const alternate = hoverFrame(product.images, product.category, product.images[0]);
    const leadHash = HASH[product.images[0]];
    const alternateHash = alternate ? HASH[alternate] : undefined;
    if (alternate && leadHash && alternateHash) {
      const bits = distance(leadHash, alternateHash);
      if (bits < POSE_DISTANCE) {
        zoomSwap += 1;
        violations.push(`${name}: ${product.slug} hovers to ${alternate} — ${bits} bits from its lead`);
      }
    }
  }
}

console.log(`rows ${rows} · frames ${frames} · whole-figure leads ${wholeLead} · single-frame rows ${single}`);
console.log(`tiers: crops ${tiers[0]} · hem ${tiers[1]} · flats ${tiers[3]} · whole ${tiers[2]}`);
console.log(`pose violations (a crop next to a better frame, or a hover that is a zoom): ${violations.length}`);
for (const line of violations.slice(0, 12)) console.log(`  ! ${line}`);
if (zoomSwap > 0) console.log(`  ${zoomSwap} of them are hover-zooms`);
process.exit(violations.length ? 1 : 0);
