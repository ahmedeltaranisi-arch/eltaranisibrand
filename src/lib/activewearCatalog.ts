import snapshot from "./activewearCatalog.json";
import measuredAspects from "./photoAspects.json";
import {
  filterCount,
  type CollectionFilters,
  type CollectionSort,
  type MateProduct,
} from "./mateNewArrivals";

/**
 * The Activewear collection, measured from the captures in `relay/` by
 * `scripts/build-activewear.mjs`: the reference's own collection order, its facet pages, the
 * swatch rows printed on each of its product cards, and the Shopify feed behind them. Nothing
 * on the page is typed in here — rail membership, facet values and every count are data.
 */
export type ActivewearProduct = MateProduct & {
  /** The reference's colour group metafield; one dye carries none (see `groupedProducts`). */
  group: string;
  publishedNewestRank: number;
};

type Rail = {
  id: string;
  handle: string;
  label: string;
  image: string;
  count: number;
  handles: string[];
};

type Snapshot = {
  products: ActivewearProduct[];
  rails: Rail[];
  categories: string[];
  colorGroups: string[];
  sizes: string[];
  nav: {
    editorial: { videoStill: string; primary: string; secondary: string };
    mega: { limitedEditionFig: string; shopAllActivewear: string };
  };
};

const data = snapshot as unknown as Snapshot;

/** Pixel sizes measured once from the shipped WebPs; square frames are detail crops. */
const PHOTO_ASPECTS = measuredAspects as unknown as Record<string, [number, number]>;

/**
 * A card shows the complete pose, so a colourway always leads with its full-length portrait
 * frames and the square detail crops follow. The card still swaps to a further full-length
 * pose on hover, which is a pose change — never a zoom or a crop of the garment.
 */
export function posedFrames(images: string[]): string[] {
  const full: string[] = [];
  const detail: string[] = [];
  for (const src of images) {
    const size = PHOTO_ASPECTS[src];
    (size && size[1] > size[0] ? full : detail).push(src);
  }
  return full.length ? [...full, ...detail] : images;
}

export const activewearProducts: ActivewearProduct[] = [...data.products]
  .sort((a, b) => a.featuredRank - b.featuredRank)
  .map((product) => ({ ...product, images: posedFrames(product.images) }));

const bySlug = new Map(activewearProducts.map((product) => [product.slug, product]));

export function getActivewearProduct(slug: string): ActivewearProduct | undefined {
  return bySlug.get(slug);
}

/** The six rails the reference prints above the grid, each with its real member count. */
export const ACTIVEWEAR_RAILS: Rail[] = data.rails;

export const ACTIVEWEAR_RAIL_IDS: readonly string[] = ACTIVEWEAR_RAILS.map((rail) => rail.id);

/** The reference's eight category rows, in the order its drawer lists them. */
export const ACTIVEWEAR_CATEGORIES: readonly string[] = data.categories;

/** The reference's nine colour groups, in the order its drawer lists them. */
export const ACTIVEWEAR_COLOR_GROUPS: readonly string[] = data.colorGroups;

/** The reference's ten size rows — the union runs from XS to 3X. */
export const ACTIVEWEAR_SIZES: readonly string[] = data.sizes;

export const ACTIVEWEAR_NAV = data.nav;

/** The reference's own facet ids, so a link copied from it keeps working here. */
export const CATEGORY_FACET_IDS: Record<string, string> = {
  "activewear-tops": "aa-1-1-2",
  leggings: "aa-1-1-1-2",
  shorts: "aa-1-1-1-3",
  socks: "aa-1-18",
  "sports-bras": "aa-1-1-6",
  sweatpants: "aa-1-1-1-4",
  "tank-tops": "aa-1-13-9",
  unitards: "aa-1-1-9-2",
};

/**
 * One dye in the collection (Chili Oil) carries no colour group on the reference store either —
 * that store's own Red facet holds five products, not six — so it stays out of the group rows
 * and is reachable through the collection itself, exactly as it is there.
 */
export const groupedProducts = activewearProducts.filter((product) => Boolean(product.group));

export function railProducts(railId: string): ActivewearProduct[] {
  const rail = ACTIVEWEAR_RAILS.find((candidate) => candidate.id === railId);
  if (!rail || rail.id === "all") return activewearProducts;
  const allowed = new Set(rail.handles);
  return activewearProducts.filter((product) => allowed.has(product.slug));
}

/** A rail measured by the reference but empty here is never offered. */
export const ACTIVEWEAR_VISIBLE_RAILS = ACTIVEWEAR_RAILS.filter((rail) => railProducts(rail.id).length > 0);

const RAIL_BY_HANDLE = new Map(ACTIVEWEAR_RAILS.map((rail) => [rail.handle, rail.id]));

/** The five child collections the reference links to, so their URLs render real results. */
export function railForCollectionHandle(handle: string): string | undefined {
  return RAIL_BY_HANDLE.get(handle);
}

export type ActivewearFilters = CollectionFilters & { rail: string };
export type ActivewearState = ActivewearFilters & { sort: CollectionSort; page: number };

/** OR within a facet, AND between facets — the same rule the other collections use. */
export function filterActivewear(
  products: readonly ActivewearProduct[],
  filters: Pick<ActivewearFilters, "categories" | "sizes" | "colors">,
): ActivewearProduct[] {
  return products.filter(
    (product) =>
      (!filters.categories.length || filters.categories.includes(product.category)) &&
      (!filters.sizes.length || filters.sizes.some((size) => product.availableSizes.includes(size))) &&
      (!filters.colors.length || filters.colors.includes(product.color.group)),
  );
}

export function sortActivewear(
  products: readonly ActivewearProduct[],
  sort: CollectionSort,
): ActivewearProduct[] {
  const list = [...products];
  switch (sort) {
    case "created-descending":
      return list.sort((a, b) => a.newestRank - b.newestRank);
    case "best-selling":
      return list.sort((a, b) => a.bestSellingRank - b.bestSellingRank);
    case "price-ascending":
      return list.sort((a, b) => a.priceLE - b.priceLE || a.featuredRank - b.featuredRank);
    case "price-descending":
      return list.sort((a, b) => b.priceLE - a.priceLE || a.featuredRank - b.featuredRank);
    default:
      return list.sort((a, b) => a.featuredRank - b.featuredRank);
  }
}

/** Self-excluding counts, so a shopper can widen the facet they are already inside. */
export function activewearFacetCounts(
  products: readonly ActivewearProduct[],
  filters: Pick<ActivewearFilters, "categories" | "sizes" | "colors">,
) {
  const countBy = (
    items: ActivewearProduct[],
    values: readonly string[],
    matches: (product: ActivewearProduct, value: string) => boolean,
  ) => Object.fromEntries(values.map((value) => [value, items.filter((product) => matches(product, value)).length]));

  return {
    categories: countBy(
      filterActivewear(products, { ...filters, categories: [] }),
      ACTIVEWEAR_CATEGORIES,
      (product, value) => product.category === value,
    ),
    sizes: countBy(
      filterActivewear(products, { ...filters, sizes: [] }),
      ACTIVEWEAR_SIZES,
      (product, value) => product.availableSizes.includes(value),
    ),
    colors: countBy(
      filterActivewear(products, { ...filters, colors: [] }),
      ACTIVEWEAR_COLOR_GROUPS,
      (product, value) => product.color.group === value,
    ),
  };
}

const uniqueValid = (values: string[], allowed: readonly string[]) =>
  [...new Set(values)].filter((value) => allowed.includes(value));

export function readActivewearState(
  params: Pick<URLSearchParams, "get" | "getAll">,
): ActivewearState {
  const requestedSort = params.get("sort_by") || "manual";
  const requestedPage = Number(params.get("page") || 1);
  const requestedRail = params.get("rail") || "all";
  return {
    rail: ACTIVEWEAR_RAIL_IDS.includes(requestedRail) ? requestedRail : "all",
    sort: (["created-descending", "best-selling", "price-ascending", "price-descending"] as const).includes(
      requestedSort as "created-descending",
    )
      ? (requestedSort as CollectionSort)
      : "manual",
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    categories: uniqueValid(
      [
        ...params.getAll("category"),
        ...params
          .getAll("filter.p.t.category")
          .map((id) => Object.keys(CATEGORY_FACET_IDS).find((key) => CATEGORY_FACET_IDS[key] === id) || ""),
      ],
      ACTIVEWEAR_CATEGORIES,
    ),
    sizes: uniqueValid(
      [...params.getAll("size"), ...params.getAll("filter.v.option.size")],
      ACTIVEWEAR_SIZES,
    ),
    colors: uniqueValid(
      [...params.getAll("color"), ...params.getAll("filter.p.m.custom.parent_color")],
      ACTIVEWEAR_COLOR_GROUPS,
    ),
  };
}

/** The reference's parameter names, so a sort/filter link can be bookmarked or shared. */
export function activewearQuery(state: ActivewearState): string {
  const params = new URLSearchParams();
  if (state.rail !== "all") params.set("rail", state.rail);
  if (state.sort !== "manual") params.set("sort_by", state.sort);
  for (const category of state.categories) params.append("filter.p.t.category", CATEGORY_FACET_IDS[category]);
  for (const size of state.sizes) params.append("filter.v.option.size", size);
  for (const color of state.colors) params.append("filter.p.m.custom.parent_color", color);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

export { filterCount };
export type { CollectionFilters, CollectionSort, MateProduct };
