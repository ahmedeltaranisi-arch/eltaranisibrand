export type ColorWay = {
  /** unique key, e.g. "fig" */
  name: string;
  /** hex used for the swatch dot */
  hex: string;
  /** slug of the product page for this colourway */
  slug: string;
};

/** Every frame the shoot captured for one colourway, in order. */
export type ColorwayShot = { frames: string[] };

export type Product = {
  id: string;
  /** base slug without the colourway suffix */
  baseSlug: string;
  titleKey: string;
  price: number;
  compareAt?: number;
  image: string;
  /** second angle, used for the hover swap + gallery */
  imageAlt: string;
  /** per-tone frames from the shoot, keyed by colourway name */
  colorwayFrames: Record<string, string[]>;
  colorways: ColorWay[];
  badges?: ("new" | "best" | "limited")[];
  collections: string[];
  sizes: string[];
  /** units on hand per size — 0 renders as sold out */
  stock: Record<string, number>;
  rating: number;
  reviewCount: number;
  blurbKey: string;
  descriptionKey: string;
  materialKey: string;
  careKey: string;
};

export type CollectionDef = {
  handle: string;
  titleKey: string;
  descriptionKey: string;
  hero: string;
};

export type CartLine = {
  id: string;
  productSlug: string;
  productId: string;
  titleKey: string;
  /** Literal snapshot labels for imported products; legacy lines still use i18n keys. */
  title?: string;
  colorName: string;
  colorLabel?: string;
  colorHex: string;
  size: string;
  /** Accounting currency is USD; EGP is a display-only reference amount. */
  price: number;
  priceLE?: number;
  image: string;
  qty: number;
};
