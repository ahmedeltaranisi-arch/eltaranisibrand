/**
 * What "the pose changed" means, in one place, so the frame ordering, the catalogue audit and the
 * tests cannot drift apart.
 *
 *   node scripts/order-card-frames.mjs      — builds a row's order with these rules
 *   npx tsx scripts/audit-photos.ts         — fails when a rendered row breaks them
 *
 * A hover has to move the model to a different stance in the same dye. Two signals say whether a
 * pair of frames does that, and each one alone is not enough:
 *
 *   `hashBits`  a 16x16 difference hash of the frame (256 bits). Two frames within `POSE_BITS` bits
 *               are the same picture at another crop. Cheap, and it cannot see a pose that changed
 *               while the composition stayed put — nor a same pose that only changed framing.
 *   `poseGap`   the joints MediaPipe found, in shoulder-to-hip units, compared joint by joint
 *               (`src/lib/photoPoseSignatures.json`). Two frames closer than `POSE_GAP` are the same
 *               stance, however differently the photograph is framed — which is the "zoom" a card
 *               must never pass off as another pose.
 *   `scaleJump` how large the model stands inside the 333/431 box each surface paints. A pair whose
 *               scales differ by more than `SCALE_JUMP` reads as a zoom even when the stance moved,
 *               so a hover prefers a frame shot from a comparable distance.
 *
 * `photoPoseSignatures.json` is measured, not hand-written: `scripts/scan-photo-poses.py` writes it.
 * Without that file (a fresh checkout of an older branch, say) only the hash rule applies, which is
 * what the repository had before the geometry was recorded.
 */
import { existsSync, readFileSync } from "node:fs";

/** Two frames within this many differing bits of the difference hash are one photograph at another zoom. */
export const POSE_BITS = 20;
/** Mean joint movement, in shoulder-to-hip units, that counts as a different stance. */
export const POSE_GAP = 0.12;
/** A hover may not show the model more than this much larger or smaller than its lead. */
export const SCALE_JUMP = 1.15;

const POPCOUNT = Array.from({ length: 256 }, (_, value) => (value & 1) + (value >> 1 & 1) + (value >> 2 & 1) + (value >> 3 & 1) + (value >> 4 & 1) + (value >> 5 & 1) + (value >> 6 & 1) + (value >> 7 & 1));

/**
 * @typedef {{ p: number[] | null, s: number | null, a: number | null }} PoseRecord
 *   `p` the joints in body units (missing joints are `9999`), `s` the model's size inside the
 *   rendered box, `a` the frame's own aspect ratio.
 */

/** @param {string} file @returns {Record<string, PoseRecord>} */
export function readSignatures(file) {
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Bits two difference hashes disagree on — hex pairs, so nothing above ES2017 is needed. */
export function hashBits(a, b) {
  if (!a || !b) return -1;
  const left = String(a).padStart(64, "0");
  const right = String(b).padStart(64, "0");
  let bits = 0;
  for (let index = 0; index < left.length; index += 2) {
    bits += POPCOUNT[parseInt(left.slice(index, index + 2), 16) ^ parseInt(right.slice(index, index + 2), 16)];
  }
  return bits;
}

/**
 * Mean movement of the joints two frames have in common, in shoulder-to-hip units. `null` when
 * either frame carries no geometry or they share too few joints to compare.
 *
 * @param {PoseRecord | undefined} left @param {PoseRecord | undefined} right
 */
export function poseGap(left, right) {
  const a = left?.p;
  const b = right?.p;
  if (!a || !b || a.length !== b.length) return null;
  let total = 0;
  let seen = 0;
  for (let joint = 0; joint < a.length; joint += 2) {
    if (a[joint] >= 9999 || b[joint] >= 9999) continue;
    total += Math.abs(a[joint] - b[joint]) + Math.abs(a[joint + 1] - b[joint + 1]);
    seen += 1;
  }
  // Shoulders, elbows, wrists and the nose: fewer than four of the twelve joints in common says the
  // two frames were measured on different parts of the body, which is not a comparable pair.
  if (seen < 4) return null;
  return total / (seen * 2 * 100);
}

/** How much bigger the model stands in one frame than in another. `null` without two scales. */
export function scaleRatio(left, right) {
  const a = left?.s;
  const b = right?.s;
  if (typeof a !== "number" || typeof b !== "number" || a <= 0 || b <= 0) return null;
  return Math.max(a / b, b / a);
}

/** `|Δ|` between the two frames' own aspect ratios — how differently they are composed. */
export function aspectDrift(left, right) {
  const a = left?.a;
  const b = right?.a;
  if (typeof a !== "number" || typeof b !== "number") return 0;
  return Math.abs(a - b);
}

/** `true` when the two frames are photographed close enough that a swap is not read as a zoom. */
export function framingHolds(a, b, signatures = {}) {
  const ratio = scaleRatio(signatures[a], signatures[b]);
  if (ratio !== null) return ratio <= SCALE_JUMP;
  return aspectDrift(signatures[a], signatures[b]) <= 0.06;
}

/**
 * The two questions a frame pair has to answer, bound to the measured files. `differs` is the pose
 * rule (another stance), `holds` is the framing rule (not a zoom); `why` spells a pair out for a
 * report line.
 *
 * @param {{ hashes?: Record<string, string>, signatures?: Record<string, PoseRecord> }} measured
 */
export function poseRules({ hashes = {}, signatures = {} } = {}) {
  const differs = (a, b) => {
    const bits = hashBits(hashes[a], hashes[b]);
    const gap = poseGap(signatures[a], signatures[b]);
    // Two signals, both able to veto: the pixels say it is the same photograph trimmed, the joints
    // say the model did not move. A signal that is missing says nothing — and a pair with no
    // measurement at all is not a claim that anything changed.
    if (bits >= 0 && bits < POSE_BITS) return false;
    if (gap !== null) return gap >= POSE_GAP;
    return bits >= POSE_BITS;
  };
  const gapOf = (a, b) => poseGap(signatures[a], signatures[b]);
  const why = (a, b) => {
    const notes = [`${hashBits(hashes[a], hashes[b])} bits`];
    const gap = gapOf(a, b);
    if (gap !== null) notes.push(`${gap.toFixed(3)} pose`);
    const ratio = scaleRatio(signatures[a], signatures[b]);
    if (ratio !== null) notes.push(`×${ratio.toFixed(2)} scale`);
    return `${a} vs ${b}: ${notes.join(", ")}`;
  };
  return { differs, holds: (a, b) => framingHolds(a, b, signatures), why };
}
