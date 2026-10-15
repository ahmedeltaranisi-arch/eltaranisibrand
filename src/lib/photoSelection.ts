import pool from "./photoPool.json";
import statuses from "./photoPoses.json";

/**
 * Every storefront photograph was measured against the box it is rendered in, not against its own
 * file. A card, a product gallery, a search row and a cart line all paint a frame into a box of
 * 333/431 with the picture scaled to fill it, so a square photograph loses 11.4% of each side and
 * a 3:4 one loses 1.5% of its top and bottom. `scripts/scan-photo-poses.py` runs MediaPipe Pose
 * over every frame the catalogues reference and records, for the region that *survives* that crop:
 *
 *   2  whole  the model is in the picture from crown to sole — head, both shoulders, both hips,
 *              both knees, both ankles and a foot all clear the crop
 *   1  hem    head, both shoulders and both hips clear the crop: the garment being sold is entirely
 *              visible and the model is not beheaded, but the legs run past the frame
 *   0  crop    the head is cut, the frame is a torso or a leg detail, or nothing was measured
 *
 * A card leads with a 2 whenever the colourway owns one, and hovers to another 2 — or, when the
 * colourway owns a single complete figure, to its 1: another pose of the same dye, with the whole
 * garment inside the frame. A 0 is never rendered on its own: not on a card, not in a gallery, not
 * in a search row. Frames are ordered, tiered and stripped of same-pose lookalikes by
 * `scripts/order-card-frames.mjs`, so nothing here needs to know about that. The frame lists themselves are
 * ordered by `scripts/order-card-frames.mjs`, which puts a shelf's whole frames in front, drops
 * near-duplicate poses (a card must never "change" to the same shot reframed) and keeps the
 * reference's own card order inside a tier; nothing here needs to know about that.
 */
type Status = 0 | 1 | 2 | 3;

const STATUSES = statuses as unknown as Record<string, Status>;

/**
 * Every photograph of a product — the same slug is filed in more than one catalogue, and each one
 * captured a different set of frames. Pooling them gives a colourway the widest choice of complete
 * photographs, so a dye one capture shot waist-up can still lead with the full-length pose another
 * capture holds.
 */
const POOL = pool as unknown as Record<string, string[]>;

export function pooledFrames(slug: string, own: string[]): string[] {
  const union = POOL[slug];
  if (!union || union.length === 0) return [...own];
  const seen = new Set<string>();
  return [...union, ...own].filter((src) => (seen.has(src) ? false : (seen.add(src), true)));
}

/** Categories whose photograph has to reach the model's feet to show the garment in full. */
const BOTTOM_CATEGORIES = new Set(["leggings", "shorts", "pants", "sweatpants", "unitards", ""]);

/** Categories photographed as a flat still, with no model in the frame to cut off. */
const PRODUCT_ONLY_CATEGORIES = new Set(["socks", "headbands", "accessories"]);

export function needsFullFigure(category: string): boolean {
  return BOTTOM_CATEGORIES.has(category);
}

export function isProductOnly(category: string): boolean {
  return PRODUCT_ONLY_CATEGORIES.has(category);
}

export type FrameStatus = "whole" | "hem" | "flat" | "crop";

export function frameStatus(src: string): FrameStatus {
  const status = STATUSES[src];
  if (status === 2) return "whole";
  if (status === 1) return "hem";
  if (status === 3) return "flat";
  return "crop";
}

/**
 * What a surface renders: every frame that keeps the model's head inside the crop — complete
 * figures first, then the head-to-hem shots as the pose a card swaps to when nothing else is left.
 * A flat frame (no model at all) belongs to the surfaces that sell a product without a body in
 * front of the camera. A crop is never handed out — unless it is all a colourway owns, because a
 * dye the reference photographs is a colour this storefront still sells.
 */
function renderable(images: string[], category: string): string[] {
  if (isProductOnly(category)) return [...images];
  const frames = images.filter((src) => STATUSES[src] === 2 || STATUSES[src] === 1);
  if (frames.length > 0) return frames;
  return images.length > 0 ? [...images] : [];
}

/** `true` when the scan proved the whole model is inside the crop a surface applies. */
export function isWholePose(src: string): boolean | null {
  const status = frameStatus(src);
  if (status === "whole") return true;
  if (status === "crop") return false;
  return null;
}

/**
 * The frames a surface may render: the complete figures it owns, or — when nothing reaches the
 * feet — the frames that at least hold the head and the whole garment. A product-only still (a sock
 * pack) carries no model to cut off and is kept as it is. A colourway with nothing renderable
 * returns an empty list, and the catalogue drops the row rather than showing a crop.
 */
export function displayFrames(images: string[], category: string): string[] {
  return renderable(images, category);
}

/** Every frame a card may swap to — which is every frame it may render. */
export function wholeFrames(images: string[], category: string): string[] {
  return displayFrames(images, category);
}

export type FrameSelection = {
  images: string[];
  wholeCount: number;
  hero: string;
  hover: string;
};

export function selectFrames(images: string[], category: string): FrameSelection {
  const ordered = displayFrames(images, category);
  return { images: ordered, wholeCount: ordered.filter((src) => frameStatus(src) === "whole").length, hero: ordered[0] ?? "", hover: ordered[1] ?? ordered[0] ?? "" };
}

/** `true` when a frame is one the scan found a cut-off model in, and the colourway owns a better shot. */
export function isCutOff(src: string, siblings: string[] = [src]): boolean {
  if (frameStatus(src) !== "crop") return false;
  return siblings.some((other) => other !== src && frameStatus(other) !== "crop");
}

/**
 * The frame a card shows when the pointer or the keyboard lands on it: the next renderable
 * photograph of the same colourway, wrapping around. The data layer orders a colourway's frames so
 * that consecutive entries are different poses, so "next" is always a change of pose — never the
 * same shot reframed, and never a crop. `""` when the colourway owns one frame only: a card with a
 * single photograph holds it, because inventing a second pose out of a zoom is exactly what a card
 * must not do.
 */
export function hoverFrame(images: string[], category: string, current: string): string {
  const frames = displayFrames(images, category);
  if (frames.length < 2) return "";
  const index = frames.indexOf(current);
  return frames[(index < 0 ? 0 : index + 1) % frames.length];
}

/** A colourway stays while it owns any photograph at all: the reference's own dye is not dropped. */
export function hasUsablePhotography(images: string[], category: string): boolean {
  void category;
  return images.length > 0;
}

/** `2` a complete figure, `1` head to hem, `0` a crop — the rank a card orders frames by. */
export function frameRank(src: string): number {
  const status = STATUSES[src];
  return status === 2 ? 2 : status === 1 ? 1 : status === 3 ? 3 : 0;
}

export function bestRank(images: string[]): number {
  return images.reduce((rank, src) => Math.max(rank, frameRank(src)), 0);
}
