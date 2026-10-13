import {
  CATEGORIES,
  COLOR_GROUPS,
  collectionQuery,
  emptyFilters,
  mateNewArrivals,
  readCollectionState,
  sortProducts,
  type CollectionFilters,
  type CollectionSort,
  type MateProduct,
} from "./mateNewArrivals";

/**
 * Best Sellers reuses the same verified Shopify capture as New Arrivals — one photographed
 * colorway per product, real option lists and real captured sort ranks — so every count shown
 * on this page is derived from data instead of typed in.
 */
export const mateBestSellers: MateProduct[] = mateNewArrivals;

export type BestSellerTabId = "all" | "activewear" | "tees" | "sweats" | "intimates" | "sleep";

/**
 * Style memberships for the rails, taken from the garment families each rail collects on the
 * reference store and applied only to styles this store actually carries, so no rail can be
 * rendered with products that do not exist here.
 */
const TAB_STYLE_MEMBERSHIPS: Record<Exclude<BestSellerTabId, "all">, string[]> = {
  activewear: [
    "organic-stretch-sports-bra",
    "organic-stretch-scoop-bra",
    "organic-stretch-full-length-legging",
    "organic-stretch-midi-legging",
    "organic-stretch-crossover-legging",
    "organic-stretch-pocket-legging",
    "organic-stretch-foldover-pant",
    "organic-stretch-crop-racer-tank",
    "organic-stretch-high-neck-tank",
    "organic-stretch-long-sleeve-top",
    "merino-headband-set-of-2",
  ],
  tees: [
    "organic-pointelle-baby-tee",
    "organic-pointelle-tank",
    "organic-pointelle-cardigan",
    "organic-fleece-oversized-polo",
  ],
  sweats: [
    "organic-fleece-cropped-sweatpant",
    "organic-fleece-oversized-sweatpant",
    "organic-fleece-relaxed-pocket-sweatpant",
    "organic-fleece-straight-leg-sweatpant",
    "organic-fleece-pocket-hoodie",
    "organic-fleece-zip-hoodie",
    "organic-fleece-relaxed-crewneck-sweatshirt",
    "organic-fleece-cropped-half-zip-sweatshirt",
    "organic-fleece-oversized-sweatshirt",
    "organic-waffle-sweatpant",
    "organic-waffle-straight-leg-sweatpant",
    "organic-waffle-collared-half-zip-sweatshirt",
  ],
  intimates: [
    "organic-stretch-sports-bra",
    "organic-stretch-scoop-bra",
  ],
  sleep: [
    "organic-waffle-crew-cardigan",
    "organic-pointelle-pant",
    "merino-boatneck-cardigan",
    "merino-foldover-pant",
    "merino-wrap-top",
  ],
};

export type BestSellerTab = {
  id: BestSellerTabId;
  labelKey: string;
  fallback: string;
  image: string;
  /** Reference carousel metaobject ids accepted in shared/bookmarked URLs. */
  metaobjectIds: string[];
};

export const BEST_SELLER_TABS: BestSellerTab[] = [
  { id: "all", labelKey: "tabAll", fallback: "All Best Sellers", image: "/img/best-sellers/tab-all.webp", metaobjectIds: [] },
  { id: "activewear", labelKey: "tabActivewear", fallback: "Activewear", image: "/img/best-sellers/tab-activewear.webp", metaobjectIds: ["286172283058"] },
  { id: "tees", labelKey: "tabTees", fallback: "Tees", image: "/img/best-sellers/tab-tees.webp", metaobjectIds: ["286172348594"] },
  { id: "sweats", labelKey: "tabSweats", fallback: "Sweats", image: "/img/best-sellers/tab-sweats.webp", metaobjectIds: ["286172414130"] },
  { id: "intimates", labelKey: "tabIntimates", fallback: "Intimates", image: "/img/best-sellers/tab-intimates.webp", metaobjectIds: ["286172545202"] },
  { id: "sleep", labelKey: "tabSleep", fallback: "Sleep", image: "/img/best-sellers/tab-sleep.webp", metaobjectIds: ["286172643506"] },
];

const TAB_IDS: readonly string[] = BEST_SELLER_TABS.map((tab) => tab.id);
const METAOBJECT_TO_TAB = new Map<string, BestSellerTabId>(
  BEST_SELLER_TABS.flatMap((tab) => tab.metaobjectIds.map((id) => [id, tab.id] as const)),
);

export function tabProducts(tab: BestSellerTabId): MateProduct[] {
  if (tab === "all") return mateBestSellers;
  const styles = new Set(TAB_STYLE_MEMBERSHIPS[tab]);
  return mateBestSellers.filter((product) => styles.has(product.style));
}

/** Real per-rail sizes; a rail without products is never rendered. */
export function bestSellerTabCounts(): Record<BestSellerTabId, number> {
  return Object.fromEntries(
    BEST_SELLER_TABS.map((tab) => [tab.id, tabProducts(tab.id).length]),
  ) as Record<BestSellerTabId, number>;
}

/** The reference's eleven size rows, in the order the drawer lists them. */
export const SIZE_FACETS = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "1X", "2X", "3X", "OS"] as const;

/**
 * The only row whose label is not a literal captured option: the reference's "OS" row holds
 * its one-size items. "S/M", "M/L", "1X", "2X" and "3X" stay real zero counts — they exist in
 * the reference taxonomy but this collection stocks no such variant, so they render disabled
 * instead of borrowing the count of a neighbouring size.
 */
const SIZE_ALIASES: Record<string, string[]> = { OS: ["One Size"] };

export function sizeMatches(product: MateProduct, size: string): boolean {
  const values = SIZE_ALIASES[size] ?? [size];
  return values.some((value) => product.availableSizes.includes(value));
}

export type BestSellerFilters = CollectionFilters & { tab: BestSellerTabId };
export type BestSellerState = BestSellerFilters & { sort: CollectionSort; page: number };

/** OR within a facet, AND between facets. Size rows use the captured available variants. */
export function filterBestSellers(
  products: readonly MateProduct[],
  filters: Pick<BestSellerFilters, "categories" | "sizes" | "colors">,
): MateProduct[] {
  return products.filter((product) =>
    (!filters.categories.length || filters.categories.includes(product.category)) &&
    (!filters.sizes.length || filters.sizes.some((size) => sizeMatches(product, size))) &&
    (!filters.colors.length || filters.colors.includes(product.color.group)),
  );
}

/** Self-excluding counts, so a shopper can always widen the facet they are already in. */
export function bestSellerFacetCounts(
  products: readonly MateProduct[],
  filters: Pick<BestSellerFilters, "categories" | "sizes" | "colors">,
) {
  const countBy = (
    items: MateProduct[],
    values: readonly string[],
    matches: (product: MateProduct, value: string) => boolean,
  ) => Object.fromEntries(values.map((value) => [value, items.filter((product) => matches(product, value)).length]));

  return {
    categories: countBy(filterBestSellers(products, { ...filters, categories: [] }), CATEGORIES, (p, value) => p.category === value),
    sizes: countBy(filterBestSellers(products, { ...filters, sizes: [] }), SIZE_FACETS, (p, value) => sizeMatches(p, value)),
    colors: countBy(filterBestSellers(products, { ...filters, colors: [] }), COLOR_GROUPS, (p, value) => p.color.group === value),
  };
}

const uniqueValid = (values: string[], allowed: readonly string[]) =>
  [...new Set(values)].filter((value) => allowed.includes(value));

export function readBestSellersState(params: Pick<URLSearchParams, "get" | "getAll">): BestSellerState {
  const base = readCollectionState(params);
  const requested = (params.get("tab") || params.get("carousel") || "").trim();
  const fromMetaobject = params
    .getAll("filter.p.m.custom.carousel_memberships")
    .map((value) => METAOBJECT_TO_TAB.get(value.replace(/^gid:\/\/shopify\/Metaobject\//, "")))
    .find(Boolean);
  return {
    ...base,
    // The reference drawer offers eleven rows; the arrival reader only knows the five
    // literal sizes, so sizes are re-read against the wider vocabulary.
    sizes: uniqueValid(
      [...params.getAll("size"), ...params.getAll("filter.v.option.size")],
      SIZE_FACETS,
    ),
    tab: (TAB_IDS as readonly string[]).includes(requested)
      ? (requested as BestSellerTabId)
      : fromMetaobject ?? "all",
  };
}

export function bestSellersQuery(state: BestSellerState): string {
  // Same parameter names as the arrival collection (including the reference's facet ids),
  // so a link copied from either page keeps working; the rail rides along as `tab`.
  const params = new URLSearchParams(collectionQuery(state));
  if (state.tab !== "all") params.set("tab", state.tab);
  return params.toString();
}

export function sortBestSellers(products: readonly MateProduct[], sort: CollectionSort): MateProduct[] {
  return sortProducts(products, sort);
}

export { emptyFilters };
export type { CollectionFilters, CollectionSort, MateProduct };
