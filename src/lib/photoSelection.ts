import statuses from "./photoPoses.json";

/**
 * Every storefront photograph was measured once, twice over: the pose landmarks say where the
 * model's head, shoulders, hips and feet are, and an independent silhouette pass says where the
 * figure starts and ends against the frame. `photoPoses.json` keeps the verdict —
 *
 *   2  whole      the model is complete in the frame (a head, and feet for a leg garment)
 *   1  uncertain  the signals disagree; the photograph may be shown, never as a card's hero
 *                 unless the colourway owns nothing better, and it never keeps a colour in the
 *                 catalogue on its own
 *   0  crop       the frame is filled by a torso or a pair of legs, so the model is cut off
 *
 * A card always leads with a whole photograph and swaps to a second whole one on hover. Crops
 * are never rendered anywhere: not on a card, not in the gallery, not in a search row.
 */
type Status = 0 | 1 | 2;

const STATUSES = statuses as unknown as Record<string, Status>;

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

export type FrameStatus = "whole" | "uncertain" | "crop" | "unmeasured";

export function frameStatus(src: string): FrameStatus {
  const status = STATUSES[src];
  if (status === 2) return "whole";
  if (status === 1) return "uncertain";
  if (status === 0) return "crop";
  return "unmeasured";
}

/**
 * `true` — the photograph shows the whole model, `false` — the scan found it cut off, `null` —
 * the frame was never measured, which is treated as usable so photography added later is never
 * silently dropped.
 */
export function isWholePose(src: string, _category?: string): boolean | null {
  const status = frameStatus(src);
  if (status === "whole") return true;
  if (status === "crop") return false;
  return null;
}

/**
 * Orders a colourway's frames: whole photographs first, then the uncertain ones. A colourway
 * that owns no whole frame still leads with its best photograph rather than losing its imagery.
 */
export function displayFrames(images: string[], category: string): string[] {
  if (isProductOnly(category)) return [...images];
  const whole = images.filter((src) => frameStatus(src) === "whole");
  const uncertain = images.filter((src) => frameStatus(src) === "uncertain" || frameStatus(src) === "unmeasured");
  // A colourway the scan has never seen keeps its frames rather than losing its photography.
  if (whole.length) return [...whole, ...uncertain];
  return images.length ? [...uncertain.length ? uncertain : images] : [...images];
}

export type FrameSelection = {
  /** Whole photographs first, then the uncertain frames — and never a crop. */
  images: string[];
  /** How many whole-photograph frames the colourway owns. */
  wholeCount: number;
  /** The hero and the hover frame, which are whole photographs whenever the colourway owns one. */
  hero: string;
  hover: string;
};

export function selectFrames(images: string[], category: string): FrameSelection {
  const ordered = displayFrames(images, category);
  const hero = ordered[0] ?? "";
  const hover = ordered[1] ?? hero;
  return { images: ordered, wholeCount: ordered.filter((src) => frameStatus(src) === "whole").length, hero, hover };
}

/** Every frame a card may swap to: the whole photographs, and nothing else. */
export function wholeFrames(images: string[], category: string): string[] {
  if (isProductOnly(category)) return [...images];
  const whole = images.filter((src) => frameStatus(src) === "whole");
  return whole.length > 1 ? whole : [];
}

/**
 * The frame a card shows when the pointer or the keyboard lands on it: the next whole photograph
 * of the same colourway after `current`, wrapping around — and `""` when the colourway owns a
 * single whole photograph, because swapping to anything less is exactly what a card must not do.
 */
export function hoverFrame(images: string[], category: string, current: string): string {
  const whole = wholeFrames(images, category);
  if (whole.length < 2) return "";
  const index = whole.indexOf(current);
  return whole[(index < 0 ? 0 : index + 1) % whole.length];
}

/** A colourway stays only while it owns a photograph the scan is happy with. */
export function hasUsablePhotography(images: string[], category: string): boolean {
  if (isProductOnly(category)) return true;
  let measured = false;
  for (const src of images) {
    const status = frameStatus(src);
    if (status === "unmeasured") continue;
    measured = true;
    if (status === "whole" || status === "uncertain") return true;
  }
  return !measured;
}

/** `2` a whole photograph, `1` uncertain, `0` a crop — the rank a card orders frames by. */
export function frameRank(src: string): number {
  const status = frameStatus(src);
  if (status === "whole") return 2;
  if (status === "crop") return 0;
  return 1;
}

/** The best a colourway can lead with: `2` whole, `1` uncertain, `0` only crops. */
export function bestRank(images: string[]): number {
  return images.reduce((rank, src) => Math.max(rank, frameRank(src)), 0);
}
