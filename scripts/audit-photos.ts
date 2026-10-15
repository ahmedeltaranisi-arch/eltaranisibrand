import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import { frameStatus, hoverFrame, isProductOnly, pooledFrames } from "../src/lib/photoSelection";
import hashes from "../src/lib/photoFrameHashes.json";
import statuses from "../src/lib/photoPoses.json";
import signatures from "../src/lib/photoPoseSignatures.json";
import gallery from "../src/lib/referenceGalleryFrames.json";
import pool from "../src/lib/photoPool.json";
import universeFile from "../src/lib/photoFrameUniverse.json";
import { poseRules } from "./photoPoseRules.mjs";

/**
 * A report on what the shelves can actually show, read straight from the catalogues after
 * `scripts/order-card-frames.mjs` has ordered them. Every number here is derived, not asserted:
 * a row that lost its photograph, a crop that slipped through, a card that cannot change pose or a
 * hover that is the same stance at another distance shows up as a line below — and fails the build.
 *
 * The two pose rules live in `scripts/photoPoseRules.mjs`, shared with the script that builds the
 * order, so a pass cannot drift from the check that grades it.
 */
const HASH = hashes as unknown as Record<string, string>;
const STATUS = statuses as unknown as Record<string, number>;
type Measured = { p: number[] | null; s: number | null; a: number | null; t?: number };
const SIG = signatures as unknown as Record<string, Measured>;
const GALLERY = gallery as unknown as Record<string, string[]>;
const POOL = pool as unknown as Record<string, string[]>;
const UNIVERSE = universeFile as unknown as Record<string, string[]>;
const rules = poseRules({ hashes: HASH, signatures: SIG });

/** A frame's tier: the rendered scan first, then the universe scan's verdict for a frame it may pick. */
const tier = (src: string) => STATUS[src] ?? SIG[src]?.t ?? 0;
/**
 * What a shelf prefers to lead with, which is not the tier number: a modelled row wants a complete
 * figure (2) over a head-to-hem shot (1) over a crop (0), and a flat still (3) only where no body is
 * expected at all — the socks, headbands and accessories shelves, where the still *is* the product
 * photograph. Same ladder `order-card-frames.mjs` sorts by, read as a rank.
 */
const MODELLED = new Map<number, number>([[2, 3], [1, 2], [3, 1], [0, 0]]);
const STILLS = new Map<number, number>([[3, 3], [2, 2], [1, 1], [0, 0]]);
const rank = (src: string, productOnly = false) => (productOnly ? STILLS : MODELLED).get(tier(src)) ?? 0;

/**
 * Everything a colourway could be photographed with: the row's own frames, the shared pool and the
 * reference gallery record. A frame in here that is better than the one a card leads with is a
 * photograph the storefront is choosing not to show.
 */
function universe(slug: string, images: string[]): string[] {
  const seen = new Set<string>();
  return [...pooledFrames(slug, images), ...(UNIVERSE[slug] ?? []), ...(GALLERY[slug] ?? []), ...(POOL[slug] ?? [])]
    .filter((src) => (seen.has(src) ? false : (seen.add(src), true)));
}

const catalogues = [["activewear", activewearProducts], ["new arrivals", arrivalCatalog], ["shop all", shopAllProducts]] as const;
const tiers = [0, 0, 0, 0];
let rows = 0;
let frames = 0;
let wholeLead = 0;
let single = 0;
let zoomSwap = 0;
let distant = 0;
let betterKept = 0;
const violations: string[] = [];

for (const [name, products] of catalogues) {
  for (const product of products) {
    rows += 1;
    frames += product.images.length;
    for (const src of product.images) tiers[tier(src)] += 1;
    if (!isProductOnly(product.category) && frameStatus(product.images[0]) === "whole") wholeLead += 1;
    if (product.images.length < 2) single += 1;
    for (const src of product.images) {
      // A crop may only render when it is all the colourway owns.
      if (frameStatus(src) === "crop" && !isProductOnly(product.category)
        && product.images.some((other) => other !== src && frameStatus(other) !== "crop")) {
        violations.push(`${name}: ${product.slug} renders ${src}, a cut-off model, beside a complete frame`);
      }
    }
    // The lead is the first thing a shopper sees, so it has to be the best photograph the colourway
    // owns: a complete figure whenever one is in the drawer, at any tier the row was handed.
    const productOnly = isProductOnly(product.category);
    const available = universe(product.slug, product.images);
    const best = available.reduce((top, src) => Math.max(top, rank(src, productOnly)), 0);
    if (rank(product.images[0], productOnly) < best) {
      betterKept += 1;
      const better = available.find((src) => rank(src, productOnly) > rank(product.images[0], productOnly));
      violations.push(`${name}: ${product.slug} leads with a ${frameStatus(product.images[0])} (${product.images[0]}) while it owns a ${frameStatus(better!)} (${better})`);
    }
    const alternate = hoverFrame(product.images, product.category, product.images[0]);
    if (alternate && !rules.differs(product.images[0], alternate)) {
      zoomSwap += 1;
      violations.push(`${name}: ${product.slug} hovers to ${alternate} — ${rules.why(product.images[0], alternate)}: the same stance, not a new pose`);
    } else if (alternate && !rules.holds(product.images[0], alternate)) {
      distant += 1;
      console.log(`  ~ ${name}: ${product.slug} hovers at another distance — ${rules.why(product.images[0], alternate)}`);
    }
  }
}

console.log(`rows ${rows} · frames ${frames} · whole-figure leads ${wholeLead} · single-frame rows ${single}`);
console.log(`tiers: crops ${tiers[0]} · hem ${tiers[1]} · flats ${tiers[3]} · whole ${tiers[2]}`);
console.log(`hovers that change the model's size rather than the pose: ${distant}`);
console.log(`rows that lead below the best tier they own: ${betterKept}`);
console.log(`pose violations (a crop next to a better frame, a lead below its best, or a hover that is not a new pose): ${violations.length}`);
for (const line of violations.slice(0, 12)) console.log(`  ! ${line}`);
if (zoomSwap > 0) console.log(`  ${zoomSwap} of them are hover-zooms`);
process.exit(violations.length ? 1 : 0);
