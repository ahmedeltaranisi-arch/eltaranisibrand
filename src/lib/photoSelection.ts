import poses from "./photoPoses.json";

/**
 * Every storefront photograph was measured once with a pose model (`pose_landmarks`): the
 * landmarks say whether the model's head, shoulders, hips and feet actually sit inside the
 * frame. `photoPoses.json` is that measurement — `[torso, feet]`, `1` when the landmarks are
 * complete and `0` when the photograph is a crop.
 *
 * A card must never lead with a crop: the hero frame is the whole photograph, and hovering it
 * swaps to another whole photograph of the same colourway. A colourway whose photographs are
 * all crops has no usable hero and is dropped from the catalogues — the same thing the
 * reference does when it has no full-length frame of a dye.
 */
type PoseFlags = [number, number];

const POSES = poses as unknown as Record<string, PoseFlags>;

/** Categories whose photograph has to reach the model's feet to show the garment in full. */
const BOTTOM_CATEGORIES = new Set(["leggings", "shorts", "pants", "sweatpants", "unitards", ""]);

/**
 * Categories photographed as a flat product still (no model in the frame at all), so there is
 * no pose to cut off and the product photograph is complete by definition.
 */
const PRODUCT_ONLY_CATEGORIES = new Set(["socks", "headbands", "accessories"]);

export function needsFullFigure(category: string): boolean {
  return BOTTOM_CATEGORIES.has(category);
}

export function isProductOnly(category: string): boolean {
  return PRODUCT_ONLY_CATEGORIES.has(category);
}

/**
 * `true` — the photograph shows the whole model for this category, `false` — it is cropped or
 * photographed without the model, `null` — the frame was never measured (treated as usable, so
 * a photograph added later is never silently dropped).
 */
export function isWholePose(src: string, category: string): boolean | null {
  const flags = POSES[src];
  if (!flags) return null;
  if (isProductOnly(category)) return true;
  if (!flags[0]) return false;
  return needsFullFigure(category) ? flags[1] === 1 : true;
}

export type FrameSelection = {
  /** Whole-photograph frames first (a standing full-length pose before a waist-up one), then crops. */
  images: string[];
  /** How many whole-photograph frames the colourway owns. */
  wholeCount: number;
  /** The hero and the hover frame, which are always whole photographs when `wholeCount > 0`. */
  hero: string;
  hover: string;
};

/**
 * A frame's rank: `0` a standing full-length pose (the model's feet in frame), `1` a waist-up
 * photograph that still holds the whole garment, `2` a crop. Cards lead with the lowest rank,
 * so a colourway that owns a standing pose always shows it.
 */
export function frameRank(src: string): number {
  const flags = POSES[src];
  if (!flags) return 1; // never measured: usable, ranked with the waist-up frames
  if (flags[0] !== 1) return 2;
  return flags[1] === 1 ? 0 : 1;
}

/**
 * Orders a colourway's frames so every card leads with a whole photograph — the standing pose
 * first, then the other whole frames — and swaps to a second whole photograph on hover. Crops
 * stay at the end for the gallery and the arrow keys, never as a hero.
 */
export function selectFrames(images: string[], category: string): FrameSelection {
  const ordered = displayFrames(images, category);
  const hero = ordered[0] ?? "";
  const hover = ordered[1] ?? hero;
  return { images: ordered, wholeCount: ordered.length, hero, hover };
}

/**
 * The frames a storefront surface may show: every measured crop is dropped, so no card, gallery,
 * search row or cart line can ever present a photograph that cuts the model off. A product-only
 * still (a sock pack, a flat lay) carries no model and is kept as it is. Standing full-length
 * poses stay first, waist-up frames that still hold the whole garment follow.
 */
export function displayFrames(images: string[], category: string): string[] {
  if (isProductOnly(category)) return [...images];
  const whole = images.filter((src) => isWholePose(src, category) !== false);
  // A colourway the scan has never seen keeps its frames rather than losing its photography.
  return whole.length ? whole.sort((a, b) => frameRank(a) - frameRank(b)) : [...images];
}

/**
 * A colourway stays in the catalogue only while it owns at least one whole photograph. A
 * colourway whose frames were never measured (a feed entry the scan predates) stays as it is.
 */
export function hasUsablePhotography(images: string[], category: string): boolean {
  if (isProductOnly(category)) return true;
  let measured = false;
  for (const src of images) {
    const whole = isWholePose(src, category);
    if (whole === null) continue;
    measured = true;
    if (whole) return true;
  }
  return !measured;
}

/** Every whole photograph a colourway owns, in catalogue order. Unmeasured frames count as whole. */
export function wholeFrames(images: string[], category: string): string[] {
  return images.filter((src) => isWholePose(src, category) !== false);
}

/** A colourway whose best photograph is a standing full-length pose, rather than a waist-up one. */
export function bestRank(images: string[]): number {
  return images.reduce((rank, src) => Math.min(rank, frameRank(src)), 2);
}

/**
 * The frame a card shows when the pointer or the keyboard lands on it: the next whole
 * photograph of the same colourway after `current`, wrapping around — and `""` when the
 * colourway owns a single whole photograph, because swapping to a crop is exactly what a card
 * must never do.
 */
export function hoverFrame(images: string[], category: string, current: string): string {
  const whole = wholeFrames(images, category);
  if (whole.length < 2) return "";
  const index = whole.indexOf(current);
  return whole[(index < 0 ? 0 : index + 1) % whole.length];
}
