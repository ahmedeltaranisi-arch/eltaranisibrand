import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import statuses from "../src/lib/photoPoses.json";
import hashes from "../src/lib/photoFrameHashes.json";
import measured from "../src/lib/photoPoseSignatures.json";
import { POSE_BITS, POSE_GAP, SCALE_JUMP, hashBits, poseGap, poseRules, scaleRatio } from "../scripts/photoPoseRules.mjs";
import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import {
  displayFrames,
  frameRank,
  frameStatus,
  hoverFrame,
  isProductOnly,
  pooledFrames,
  selectFrames,
} from "../src/lib/photoSelection";

/**
 * The scan in `scripts/scan-photo-poses.py` measures every frame against the box it is painted
 * into (333/431, scaled to fill), so "complete" here means complete on screen: crown to sole inside
 * the part of the file a card shows. `scripts/order-card-frames.mjs` then hands each colourway an
 * ordered list of those frames, dropping the near-duplicates a hover must never swap to.
 */
const TIER = statuses as unknown as Record<string, number>;
const HASH = hashes as unknown as Record<string, string>;
/** Below this many differing bits, two frames are the same pose at another zoom. */
const POSE_DISTANCE = 20;

/** One bits per byte, so a hash comparison is a table lookup per hex pair. */
const POPCOUNT = Array.from({ length: 256 }, (_, value) => value.toString(2).split("0").join("").length);
/** Bits two 16x16 difference hashes disagree on — a table lookup per hex pair, no BigInt. */
function poseDistance(a: string, b: string): number {
  let bits = 0;
  const left = a.padStart(64, "0");
  const right = b.padStart(64, "0");
  for (let index = 0; index < left.length; index += 2) {
    bits += POPCOUNT[parseInt(left.slice(index, index + 2), 16) ^ parseInt(right.slice(index, index + 2), 16)];
  }
  return bits;
}

const PRODUCT_ONLY = new Set(["socks", "headbands", "accessories"]);
type Raw = { slug: string; images: string[]; category: string };
const rawArrivals = JSON.parse(readFileSync("src/lib/newArrivalsCatalog.json", "utf8")) as Raw[];
const rawActivewear = (JSON.parse(readFileSync("src/lib/activewearCatalog.json", "utf8")) as { products: Raw[] }).products;
const rawShopAll = (JSON.parse(readFileSync("src/lib/shopAllCatalog.json", "utf8")) as { products: Raw[] }).products;

const catalogs = [
  ["activewear", activewearProducts],
  ["new arrivals", arrivalCatalog],
  ["shop all", shopAllProducts],
] as const;

test("a card never shows a frame the scan measured as cutting the model off", () => {
  // Cards, the product gallery, the swipe frames, the search rows and the cart lines all read these
  // arrays, so a cut-off model cannot come back on screen anywhere — nor can a flat still or a
  // fabric close-up, which is what the frames without a resolved pose mostly are. The one case the
  // rule allows: a colourway the reference photographs no other way keeps its colour instead of
  // losing it, so its last-resort frame is whatever the reference ships.
  const offenders: string[] = [];
  for (const [name, products] of catalogs) {
    for (const product of products) {
      if (isProductOnly(product.category) || PRODUCT_ONLY.has(product.category)) continue;
      const all = pooledFrames(product.slug, []);
      const owns = (src: string) => src === "whole" || src === "hem";
      const better = all.some((other) => owns(frameStatus(other)));
      for (const frame of product.images) {
        if (better && !owns(frameStatus(frame))) offenders.push(`${name}: ${product.slug} shows ${frame} (${frameStatus(frame)})`);
      }
      if (better) assert.ok(owns(frameStatus(product.images[0])), `${name}: ${product.slug} leads with a ${frameStatus(product.images[0])}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("a row keeps its frames in the order the pipeline wrote, and leads with the best of them", () => {
  let leadingWhole = 0;
  let rows = 0;
  let modelled = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      const selection = selectFrames(pooledFrames(product.slug, []), product.category);
      assert.deepEqual(product.images, selection.images, `${name}: ${product.slug} is out of order`);
      rows += 1;
      // A socks or accessories shelf sells a product with no body in it: its flat stills are the
      // right lead there, and the pose rule does not apply.
      if (isProductOnly(product.category) || PRODUCT_ONLY.has(product.category)) continue;
      modelled += 1;
      if (product.images.some((src) => frameStatus(src) === "whole")) {
        leadingWhole += 1;
        assert.equal(frameStatus(product.images[0]), "whole", `${name}: ${product.slug} leads with ${product.images[0]}`);
      }
    }
  }
  assert.ok(rows > 600, `only ${rows} rows render`);
  // Every modelled colourway that owns a complete figure leads with one. 591 of 637 rows do: the rest
  // are dyes the reference itself photographs from the chest down, and a card may not invent a longer
  // pose than the shoot contains. The floor is 92% so a quiet regression in the frame ordering shows
  // up here, and the exact number is reported by `npx tsx scripts/audit-photos.ts`.
  assert.ok(modelled > 600, `only ${modelled} modelled rows`);
  assert.ok(leadingWhole / modelled > 0.92, `only ${leadingWhole}/${modelled} modelled rows lead with a whole figure`);
});

test("a hover is a different pose of the same colourway, never the same photograph reframed", () => {
  let swapped = 0;
  let singles = 0;
  let lastResort = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      const hero = product.images[0];
      const alternate = hoverFrame(product.images, product.category, hero);
      const modelled = !isProductOnly(product.category) && !PRODUCT_ONLY.has(product.category);
      // The one exception the rules allow: a colourway with nothing but crops keeps the reference's
      // own frame rather than losing its colour, and then it has no complete pose to offer either.
      const owns = modelled && product.images.some((src) => ["whole", "hem"].includes(frameStatus(src)));
      if (!alternate) {
        assert.equal(product.images.length, 1, `${name}: ${product.slug} holds one frame and still swapped`);
        singles += 1;
        continue;
      }
      assert.notEqual(alternate, hero, `${name}: ${product.slug}`);
      if (modelled && owns) assert.ok(["whole", "hem"].includes(frameStatus(alternate)), `${name}: ${product.slug} → ${alternate}`);
      if (modelled && !owns && product.images.length > 0) lastResort += 1;
      swapped += 1;
    }
  }
  assert.ok(swapped > 600, `only ${swapped} colourways can swap poses`);
  // A colourway the reference photographed in one stance keeps that one photograph. The alternative —
  // promoting a same-stance detail shot so the card appears to change — is the behaviour the shelves
  // were called out for, so the count is allowed, kept small, and reported exactly by
  // `npx tsx scripts/audit-photos.ts` (`single-frame rows`).
  assert.ok(singles < 40, `${singles} rows are left with a single frame`);
  assert.ok(lastResort < 40, `${lastResort} rows render a crop because the reference photographed no further`);
});

test("the pose rules read the measured geometry, not just the pixels", () => {
  // The two frames the complaint named (a card that "changed" to the same stance at another zoom)
  // differ in their pixels: a difference hash sees a different picture. The joints do not move, and
  // that is what the geometry rule is for, so both signals have to agree before a pair is called a
  // new pose. A frame pair the scan could not resolve on both sides is left to the hash rule.
  assert.equal(POSE_BITS, 20);
  assert.equal(hashBits("0".repeat(64), "0".repeat(64)), 0);
  assert.equal(hashBits("f".repeat(64), "0".repeat(64)), 256);
  const armsUp = { p: [0, 0, 10, 0, -60, -90, 70, -85, -80, -160, 90, -155, 0, -40, 5, 60, -5, 62, 20, 90, -20, 92, 0, 0], s: 0.42, a: 0.75 };
  const armsDown = { p: [0, 0, 10, 0, -40, 55, 55, 60, -60, 120, 85, 118, 0, -40, 5, 60, -5, 62, 20, 90, -20, 92, 0, 0], s: 0.43, a: 0.75 };
  const reframed = { ...armsUp, s: 0.58, a: 0.9 };
  const pair = (a: unknown, b: unknown) => poseRules({ hashes: {}, signatures: { a: a as never, b: b as never } });
  assert.ok(poseGap(armsUp, armsDown) !== null && poseGap(armsUp, armsDown)! >= POSE_GAP, "a raised arm is not a pose change");
  assert.equal(poseGap(armsUp, { ...armsUp, s: 0.9 }), 0, "the same stance at another zoom moves no joint");
  // Without a recorded hash pair the geometry alone decides, and the framing rule alone reports the zoom.
  assert.equal(pair(armsUp, armsUp).differs("a", "b"), false, "identical geometry is never a pose change");
  assert.equal(pair(armsUp, armsDown).differs("a", "b"), true);
  assert.equal(pair(armsUp, armsUp).differs("a", "b"), false);
  assert.ok(scaleRatio(armsUp, armsDown)! < SCALE_JUMP, "two frames shot at the same distance");
  assert.ok(scaleRatio(armsUp, reframed)! > SCALE_JUMP, "a closer camera has to register as a scale jump");
  assert.equal(pair(armsUp, armsDown).holds("a", "b"), true);
  assert.equal(pair(armsUp, reframed).holds("a", "b"), false);
  // The comparison needs four joints in common: a torso crop and a full-length pose share the
  // shoulders and the hips, which is not enough to call a stance change either way.
  const sparse = (list: number[]) => ({ p: list, s: 0.4, a: 0.75 });
  assert.equal(poseGap(sparse([0, 0, 5, 5, 20, 30, 0, 0, ...Array(16).fill(0)]), sparse([0, 0, 5, 5, 9999, 9999, 9999, 9999, ...Array(16).fill(9999)])), null);
  // Four joints in common — the floor for a comparison — each moved 30 units of a hundredth of a
  // torso on x: total 120, over 4 joints and 2 axes, 120 / (4 · 2 · 100) = 0.15 of a torso.
  assert.equal(poseGap(sparse([0, 0, 0, 0, 0, 0, 0, 0, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999]),
    sparse([30, 0, 30, 0, 30, 0, 30, 0, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999])), 0.15);
  assert.equal(poseGap(sparse([0, 0, 0, 0, 0, 0, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999]),
    sparse([30, 0, 30, 0, 30, 0, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999])), null);
  // The scan recorded the geometry for the frames the storefront can paint.
  const sigs = measured as unknown as Record<string, { p: number[] | null }>;
  assert.ok(Object.keys(sigs).length > 2000, `only ${Object.keys(sigs).length} frames carry a pose signature`);
});

test("no two frames of a colourway are the same pose at another zoom", () => {
  // The rule the ordering enforces, checked on the result: every pair a card can cycle through —
  // next, previous and the wrap from the last frame back to the first — is a different pose, both in
  // pixels (the difference hash) and in the model's joints (the scan's signature).
  const rules = poseRules({ hashes: HASH, signatures: measured as unknown as never });
  let pairs = 0;
  for (const [name, products] of catalogs) {
    for (const product of products) {
      const frames = product.images.filter((src) => HASH[src]);
      for (let index = 0; index < frames.length; index += 1) {
        const next = frames[(index + 1) % frames.length];
        if (next === frames[index]) continue;
        const distance = poseDistance(HASH[frames[index]], HASH[next]);
        assert.ok(distance >= POSE_DISTANCE, `${name}: ${product.slug} ${frames[index]} → ${next} is ${distance} bits apart`);
        assert.ok(rules.differs(frames[index], next), `${name}: ${product.slug} ${rules.why(frames[index], next)}: the same stance`);
        pairs += 1;
      }
    }
  }
  // Every consecutive pair of every row: 1 419 frames across 649 rows, of which the wrap pairs of
  // single-frame rows are skipped.
  assert.ok(pairs > 1300, `only ${pairs} pose pairs were checked`);
});

test("a colourway is judged on every photograph of that slug, not just its own catalogue", () => {
  // The Activewear capture filed some dyes as waist-up crops while the New Arrivals capture held
  // their full-length pose, and the reference's own gallery holds more. Pooling is what gives a dye
  // the photograph it deserves instead of the accident of which capture listed it — and the ordering
  // writes one list per slug, so every catalogue that carries it renders the same frames.
  const shared = activewearProducts.filter((product) => rawArrivals.some((arrival) => arrival.slug === product.slug));
  assert.ok(shared.length > 40, `only ${shared.length} colourways are carried by both captures`);
  for (const product of shared) {
    assert.deepEqual(pooledFrames(product.slug, []), product.images, product.slug);
    const arrival = arrivalCatalog.find((candidate) => candidate.slug === product.slug);
    assert.ok(arrival, `${product.slug} is missing from the arrivals catalogue`);
    assert.deepEqual(arrival.images, product.images, `${product.slug} renders two different rails`);
  }
  const pooled = pooledFrames(shared[0].slug, []);
  assert.equal(frameStatus(pooled[0]), "whole", shared[0].slug);
  // The two cards the complaint named. The sports bra owns full-length photographs, so it must lead
  // with one; the waffle crew top is photographed from the chest down by the reference itself, so the
  // most its card can honestly do is keep the head in the picture and answer a hover with a pose that
  // is not the same shot at another zoom.
  const waffle = shopAllProducts.find((product) => product.slug === "organic-waffle-crew-top-heather-grey");
  assert.ok(waffle, "the waffle shelf's lead colourway is missing");
  assert.ok(waffle.images.length >= 2, "the waffle crew top cannot change pose");
  assert.ok(["whole", "hem"].includes(frameStatus(waffle.images[0] ?? "")), "the waffle crew top leads with a cut-off model");
  const bra = shopAllProducts.find((product) => product.slug === "organic-stretch-sports-bra-heather-grey");
  assert.ok(bra && bra.images.length >= 2, "the sports bra lost its second pose");
  assert.equal(frameStatus(bra.images[0]), "whole", "the heather-grey sports bra still leads waist-up");
  assert.ok(poseDistance(HASH[bra!.images[0]!], HASH[bra!.images[1]!]) >= POSE_DISTANCE, "the sports bra's hover is the same pose");
  assert.ok(poseRules({ hashes: HASH, signatures: measured as unknown as never }).differs(bra!.images[0]!, bra!.images[1]!),
    `the sports bra's hover is the same stance: ${JSON.stringify(bra!.images.slice(0, 2))}`);
});

test("a flat frame carries no model and is never filtered out", () => {
  assert.equal(isProductOnly("socks"), true);
  assert.equal(isProductOnly("leggings"), false);
  const stills = ["/img/aw/12124ed56afe.webp", "/img/aw/dbf7746aaf99.webp"];
  assert.deepEqual(displayFrames(stills, "socks"), stills);
  // A frame the detector found no model in is ranked below a real pose but still renders: a gift
  // card graphic and a folded garment have nothing to cut off.
  const flat = Object.keys(TIER).find((src) => TIER[src] === 3);
  assert.ok(flat, "the scan recorded the frames that hold no model");
  assert.equal(frameStatus(flat), "flat", flat);
  assert.deepEqual(displayFrames([flat], "socks"), [flat], "a sock still renders on the socks shelf");
  assert.deepEqual(displayFrames([flat], "leggings"), [flat], "and is all a colourway owns: the row keeps it");
  const legging = shopAllProducts.find((product) => product.category === "leggings" && product.images.length > 1);
  assert.ok(legging && !legging.images.some((src) => frameStatus(src) === "flat"), `${legging?.slug}: a flat frame is not mixed into a modelled row`);
  assert.ok(frameRank(flat) > 0, flat);
});

test("no catalogue row is dropped for want of photography", () => {
  // The shelf counts, the filter drawer's numbers and the swatch rails are all derived from these
  // arrays: a row that vanished over a photograph would quietly change every count on the page.
  const cases = [["arrivals", rawArrivals, arrivalCatalog], ["activewear", rawActivewear, activewearProducts], ["shop all", rawShopAll, shopAllProducts]] as const;
  for (const [name, raw, kept] of cases) {
    assert.equal(kept.length, raw.length, `${name}: a row was dropped`);
    for (const product of raw) {
      const usable = displayFrames(pooledFrames(product.slug, product.images), product.category);
      assert.ok(usable.length > 0, `${name}: ${product.slug} has no frame at all`);
    }
  }
  assert.equal(shopAllProducts.length, rawShopAll.length);
  assert.equal(arrivalCatalog.length, 177);
  assert.equal(activewearProducts.length, 95);
});
