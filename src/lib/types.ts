export type ColorWay = {
  /** unique key, e.g. "clay" */
  name: string;
  /** hex used for the swatch dot */
  hex: string;
  /** slug of the product page for this colourway */
  slug: string;
};

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
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  image: string;
  qty: number;
};
