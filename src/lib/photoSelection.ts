import statuses from "./photoPoses.json";
import pool from "./photoPool.json";

/**
 * Every storefront photograph was measured once, twice over: the pose landmarks say where the
 * model's head, shoulders, hips and feet are, and an independent silhouette pass says where the
 * figure starts and ends against the frame. `photoPoses.json` keeps the verdict, one per file:
 *
 *   2  whole   the model is complete in the frame — head to feet for a leg garment, head,
 *              shoulders and the whole garment for a top; a flat still has no model to cut off
 *   0  crop    the frame is filled by a torso or a pair of legs, so the model is cut off
 *
 * Nothing else is stored: a photograph the scan could not prove is never rendered. A card always
 * leads with a whole photograph and swaps to a second whole one on hover. Crops are never
 * rendered anywhere: not on a card, not in the gallery, not in a search row.
 */
type Status = 0 | 1 | 2;

const STATUSES = statuses as unknown as Record<string, Status>;

/**
 * Every photograph of a product — the same slug is filed in more than one catalogue, and each one
 * captured a different set of frames. Pooling them gives a colourway the widest choice of
 * complete photographs, so a dye the Activewear capture shot as a crop can still lead with the
 * full-length pose the New Arrivals capture holds. Each slug's frames are listed complete first
 * and, among those, with the frames that hold the model's feet ahead of the closer crops, so a
 * card leads with the most complete photograph the colourway owns. Built by the scan in
 * docs/photos.md.
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

export type FrameStatus = "whole" | "crop" | "unmeasured";

export function frameStatus(src: string): FrameStatus {
  const status = STATUSES[src];
  if (status === 2) return "whole";
  if (status === 0) return "crop";
  return "unmeasured";
}

/** `true` when the scan proved the whole model is inside the frame. */
export function isWholePose(src: string, _category?: string): boolean | null {
  const status = frameStatus(src);
  if (status === "whole") return true;
  if (status === "crop") return false;
  return null;
}

/**
 * The frames a surface may render: only photographs the scan proved complete. A product-only
 * still (a sock pack) carries no model to cut off and is kept as it is. A colourway with nothing
 * left returns an empty list, and the catalogue drops the row rather than showing a crop.
 */
export function displayFrames(images: string[], category: string): string[] {
  if (isProductOnly(category)) return [...images];
  return images.filter((src) => frameStatus(src) === "whole");
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
  return { images: ordered, wholeCount: ordered.length, hero: ordered[0] ?? "", hover: ordered[1] ?? ordered[0] ?? "" };
}

/**
 * The frame a card shows when the pointer or the keyboard lands on it: the next complete
 * photograph of the same colourway after `current`, wrapping around — and `""` when the colourway
 * has only one, because swapping to a crop is exactly what a card must not do.
 */
export function hoverFrame(images: string[], category: string, current: string): string {
  const whole = displayFrames(images, category);
  if (whole.length < 2) return "";
  const index = whole.indexOf(current);
  return whole[(index < 0 ? 0 : index + 1) % whole.length];
}

/** A colourway stays only while it owns at least one complete photograph. */
export function hasUsablePhotography(images: string[], category: string): boolean {
  if (isProductOnly(category)) return true;
  return images.some((src) => frameStatus(src) === "whole");
}

/** `2` a complete photograph, `0` a crop — the rank a card orders frames by. */
export function frameRank(src: string): number {
  const status = frameStatus(src);
  return status === "whole" ? 2 : 0;
}

export function bestRank(images: string[]): number {
  return images.reduce((rank, src) => Math.max(rank, frameRank(src)), 0);
}
