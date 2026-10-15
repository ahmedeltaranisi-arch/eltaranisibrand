import snapshot from "./newArrivalsCatalog.json";
import { pooledFrames, selectFrames } from "./photoSelection";

/** A colorway is a real, independently photographed product, never a tinted fallback. */
export type MateProduct = {
  id: string;
  slug: string;
  title: string;
  style: string;
  category: string;
  priceUSD: number;
  priceLE: number;
  /**
   * The price the reference itself strikes through in front of the sale price — `LE 10,572 $138` for
   * the waffle crew top. Only the colourways the reference discounts carry it; a row with no
   * compare-at prints one price, exactly as the reference does.
   */
  compareAtUSD?: number | null;
  compareAtLE?: number | null;
  color: {
    name: string;
    label: string;
    hex: string;
    swatch: string;
    group: string;
  };
  images: string[];
  sizes: string[];
  availableSizes: string[];
  badges: string[];
  description: string;
  colorways: string[];
  colorEdition: "essential" | "limited";
  featuredRank: number;
  newestRank: number;
  bestSellingRank: number;
  createdAt: string;
  inNewArrivals: boolean;
};

/**
 * Every colourway leads with a whole photograph of the model, and the hover frame is a second
 * whole photograph of the same colourway — see `photoSelection.ts`. A colourway whose whole
 * photography is crops never enters the catalogue.
 */
export const arrivalCatalog: MateProduct[] = (snapshot as MateProduct[])
  .map((product) => ({ ...product, images: selectFrames(pooledFrames(product.slug, product.images), product.category).images }))
  .filter((product) => product.images.length > 0);

const bySlug = new Map(arrivalCatalog.map((product) => [product.slug, product]));

export const mateNewArrivals = arrivalCatalog
  .filter((product) => product.inNewArrivals)
  .sort((a, b) => a.featuredRank - b.featuredRank);

export function getArrivalProduct(slug: string): MateProduct | undefined {
  return bySlug.get(slug);
}

export function productColorways(product: MateProduct): MateProduct[] {
  return product.colorways
    .map((slug) => bySlug.get(slug))
    .filter(
      (colorway): colorway is MateProduct =>
        !!colorway &&
        colorway.style === product.style &&
        colorway.images.length > 0 &&
        colorway.availableSizes.length > 0,
    );
}

export const CATEGORIES = [
  "activewear-tops",
  "headbands",
  "leggings",
  "pants",
  "sports-bras",
  "sweaters",
  "sweatpants",
  "sweatshirts",
  "t-shirts",
  "tank-tops",
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export const COLOR_GROUPS = [
  "Beige", "Black", "Blue", "Brown", "Green", "Grey",
  "Neutral", "Pink", "Purple", "Red", "White",
] as const;

export const SORT_OPTIONS = [
  "created-descending", "best-selling", "price-ascending", "price-descending",
] as const;
export type CollectionSort = "manual" | (typeof SORT_OPTIONS)[number];
export type CollectionFilters = {
  categories: string[];
  sizes: string[];
  colors: string[];
};
export type CollectionState = CollectionFilters & {
  sort: CollectionSort;
  page: number;
};

export const PAGE_SIZE = 48;

export function emptyFilters(): CollectionFilters {
  return { categories: [], sizes: [], colors: [] };
}

/** OR within a facet; AND between facets. Size counts use actual available variants. */
export function filterProducts(
  products: readonly MateProduct[],
  filters: CollectionFilters,
): MateProduct[] {
  return products.filter((product) =>
    (!filters.categories.length || filters.categories.includes(product.category)) &&
    (!filters.sizes.length || filters.sizes.some((size) => product.availableSizes.includes(size))) &&
    (!filters.colors.length || filters.colors.includes(product.color.group)),
  );
}

export function sortProducts(
  products: readonly MateProduct[],
  sort: CollectionSort,
): MateProduct[] {
  return [...products].sort((a, b) => {
    switch (sort) {
      case "created-descending":
        return a.newestRank - b.newestRank;
      case "best-selling":
        // Captured from the reference's best-selling order, not a made-up rating.
        return a.bestSellingRank - b.bestSellingRank;
      case "price-ascending":
        return a.priceLE - b.priceLE || a.featuredRank - b.featuredRank;
      case "price-descending":
        return b.priceLE - a.priceLE || a.featuredRank - b.featuredRank;
      default:
        return a.featuredRank - b.featuredRank;
    }
  });
}

/** Self-excluding counts let shoppers add alternatives within an active facet. */
export function facetCounts(products: readonly MateProduct[], filters: CollectionFilters) {
  const countBy = (items: MateProduct[], values: readonly string[], matches: (p: MateProduct, value: string) => boolean) =>
    Object.fromEntries(values.map((value) => [value, items.filter((p) => matches(p, value)).length]));
  return {
    categories: countBy(filterProducts(products, { ...filters, categories: [] }), CATEGORIES, (p, value) => p.category === value),
    sizes: countBy(filterProducts(products, { ...filters, sizes: [] }), SIZES, (p, value) => p.availableSizes.includes(value)),
    colors: countBy(filterProducts(products, { ...filters, colors: [] }), COLOR_GROUPS, (p, value) => p.color.group === value),
  };
}

export function filterCount(filters: CollectionFilters): number {
  return filters.categories.length + filters.sizes.length + filters.colors.length;
}

// Preserve reference query names so sorting/filter links can be bookmarked/shared.
const CATEGORY_IDS: Record<string, string> = {
  "activewear-tops": "aa-1-1-2", headbands: "aa-2-14-8", leggings: "aa-1-1-1-2",
  pants: "aa-1-12", "sports-bras": "aa-1-1-6", sweaters: "aa-1-13-12",
  sweatpants: "aa-1-1-1-4", sweatshirts: "aa-1-13-14", "t-shirts": "aa-1-13-8", "tank-tops": "aa-1-13-9",
};
const validValues = (values: string[], allowed: readonly string[]) =>
  [...new Set(values)].filter((value) => allowed.includes(value));

export function readCollectionState(params: Pick<URLSearchParams, "get" | "getAll">): CollectionState {
  const requestedSort = params.get("sort_by") || "manual";
  const requestedPage = Number(params.get("page") || 1);
  return {
    sort: SORT_OPTIONS.includes(requestedSort as (typeof SORT_OPTIONS)[number]) ? requestedSort as CollectionSort : "manual",
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    categories: validValues(
      [...params.getAll("category"), ...params.getAll("filter.p.t.category").map((id) =>
        Object.keys(CATEGORY_IDS).find((key) => CATEGORY_IDS[key] === id) || "",
      )], CATEGORIES,
    ),
    sizes: validValues([...params.getAll("size"), ...params.getAll("filter.v.option.size")], SIZES),
    colors: validValues([...params.getAll("color"), ...params.getAll("filter.p.m.custom.parent_color")], COLOR_GROUPS),
  };
}

export function collectionQuery(state: CollectionState): string {
  const params = new URLSearchParams();
  if (state.sort !== "manual") params.set("sort_by", state.sort);
  for (const category of state.categories) params.append("filter.p.t.category", CATEGORY_IDS[category]);
  for (const size of state.sizes) params.append("filter.v.option.size", size);
  for (const color of state.colors) params.append("filter.p.m.custom.parent_color", color);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

/** Reference EGP display amounts; all cart/checkout accounting remains in USD. */
const REFERENCE_EGP: Record<number, number> = {
  48: 3678, 58: 4444, 62: 4750, 68: 5210, 72: 5516, 78: 5976,
  88: 6742, 98: 7508, 108: 8274, 128: 9806, 138: 10572,
  148: 11338, 158: 12105, 178: 13637,
};
export function usdToReferenceLE(amount: number): number {
  return REFERENCE_EGP[amount] ?? Math.round(amount * 76.61);
}
export function formatLE(amount: number): string {
  return `LE ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}
