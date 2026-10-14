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
  /** Whole-photograph frames first, in catalogue order, then the remaining crops. */
  images: string[];
  /** How many whole-photograph frames the colourway owns. */
  wholeCount: number;
  /** The hero and the hover frame, which are always whole photographs when `wholeCount > 0`. */
  hero: string;
  hover: string;
};

/**
 * Orders a colourway's frames so every card leads with a full photograph and swaps to a second
 * one on hover. Crops are kept at the end for the gallery and the arrow keys, never as a hero.
 */
export function selectFrames(images: string[], category: string): FrameSelection {
  const whole: string[] = [];
  const rest: string[] = [];
  for (const src of images) {
    if (isWholePose(src, category) === false) rest.push(src);
    else whole.push(src);
  }
  const ordered = [...whole, ...rest];
  const hero = whole[0] ?? images[0] ?? "";
  const hover = whole[1] ?? hero;
  return { images: ordered, wholeCount: whole.length, hero, hover };
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
