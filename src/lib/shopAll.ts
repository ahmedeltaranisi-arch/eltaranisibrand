import snapshot from "./shopAllCatalog.json";
import { pooledFrames, selectFrames } from "./photoSelection";
import { catalogColorways, getCatalogProduct } from "./mateCatalog";
import {
  sortProducts,
  type CollectionFilters,
  type CollectionSort,
  type MateProduct,
} from "./mateNewArrivals";

/**
 * Shop All — the reference store's `/collections/all`, rebuilt from the two captures this
 * storefront already owns (New Arrivals / Best Sellers and Activewear). Every number this module
 * hands out — rail sizes, facet counts, page counts — is computed from `shopAllCatalog.json`,
 * which `scripts/build-shop-all.mjs` derives from the captured products; nothing is typed in.
 */
export type ShopAllProduct = MateProduct & { group: string };

type Rail = {
  id: string;
  handle: string;
  href: string;
  image: string | null;
  swatch?: string | null;
  count: number;
  slugs: string[];
};

type Snapshot = {
  source: Record<string, unknown>;
  categories: string[];
  colorGroups: string[];
  sizes: string[];
  sizeAliases: Record<string, string[]>;
  rails: Rail[];
  fabrics: Rail[];
  dyes: Rail[];
  railAliases: Record<string, string>;
  nav: {
    tabs: Array<Omit<Rail, "slugs" | "count"> & { count: number; slugs: string[] }>;
    editorial: {
      octoberCapsule: { primary: string; secondary: string };
      getawayEdit: { primary: string; secondary: string };
    };
    megaTiles: { octoberCapsule: string; getawayEdit: string };
    megaSwatches: Record<string, string>;
  };
  products: ShopAllProduct[];
};

const data = snapshot as unknown as Snapshot;

/** This catalogue's own rows by slug: a Shop All card resolves its swatches inside this file first. */
const rowBySlug = new Map(data.products.map((product) => [product.slug, product]));

export const shopAllProducts: ShopAllProduct[] = [...data.products]
  .map((product) => ({ ...product, images: selectFrames(pooledFrames(product.slug, product.images), product.category).images }))
  .filter((product) => product.images.length > 0)
  .sort((a, b) => a.featuredRank - b.featuredRank);

/** The collection-level copy the reference prints above the grid. */
export const SHOP_ALL_EDITORIAL = data.nav.editorial;
export const SHOP_ALL_MEGA_TILES = data.nav.megaTiles;
export const SHOP_ALL_MEGA_SWATCHES = data.nav.megaSwatches;

/** The six category tiles the reference prints above the grid, with their real sizes. */
export const SHOP_ALL_TABS: Rail[] = data.rails.filter((rail) => rail.image);

/** Featured Fabrics — a row exists only while the catalogue really carries that fabrication. */
export const SHOP_ALL_FABRICS: Rail[] = data.fabrics;

/** Featured Colors — each dye's own colorways, across every garment we photograph in it. */
export const SHOP_ALL_DYES: Rail[] = data.dyes;

export const SHOP_ALL_CATEGORIES: readonly string[] = data.categories;
export const SHOP_ALL_COLOR_GROUPS: readonly string[] = data.colorGroups;
/** The reference's twelve size rows, in the drawer's own order. */
export const SHOP_ALL_SIZE_FACETS: readonly string[] = data.sizes;
const SIZE_ALIASES = data.sizeAliases;

const bySlug = new Map(shopAllProducts.map((product) => [product.slug, product]));

export function getShopAllProduct(slug: string): ShopAllProduct | undefined {
  return bySlug.get(slug);
}

/** A product's colour group as the reference files it; empty when the reference files none. */
export function groupOf(product: MateProduct): string {
  return ((product as ShopAllProduct).group || product.color.group || "").trim();
}

const RAIL_BY_HANDLE = new Map<string, Rail>();
for (const rail of [...data.rails, ...data.fabrics, ...data.dyes]) RAIL_BY_HANDLE.set(rail.handle, rail);
for (const [alias, handle] of Object.entries(data.railAliases)) {
  const rail = RAIL_BY_HANDLE.get(handle);
  if (rail) RAIL_BY_HANDLE.set(alias, rail);
}

export const SHOP_ALL_HANDLES: readonly string[] = [...new Set([...RAIL_BY_HANDLE.keys()])];

/**
 * The handles `/collections/[handle]` renders with the Shop All grid. Activewear keeps its own
 * dedicated page, and a rail with nothing behind it is never routed.
 */
export const SHOP_ALL_ROUTES: readonly string[] = [
  ...new Set([...data.rails, ...data.fabrics, ...data.dyes].map((rail) => rail.handle)),
].filter((handle) => handle !== "activewear" && (RAIL_BY_HANDLE.get(handle)?.count ?? 0) > 0);

export function shopAllRail(handle: string): Rail | undefined {
  return RAIL_BY_HANDLE.get(handle);
}

/** Products of a rail; an unknown or empty rail is simply the whole collection. */
export function railProducts(handle: string): ShopAllProduct[] {
  const rail = RAIL_BY_HANDLE.get(handle);
  if (!rail) return shopAllProducts;
  const allowed = new Set(rail.slugs);
  return shopAllProducts.filter((product) => allowed.has(product.slug));
}

/* ------------------------------------------------------------------------------- filtering */

export type ShopAllState = CollectionFilters & { sort: CollectionSort; page: number };

export function sizeMatches(product: MateProduct, size: string): boolean {
  const values = SIZE_ALIASES[size] ?? [size];
  return values.some((value) => product.availableSizes.includes(value));
}

/** OR within a facet, AND between facets — the same rule every other collection uses. */
export function filterShopAll(
  products: readonly MateProduct[],
  filters: Pick<CollectionFilters, "categories" | "sizes" | "colors">,
): MateProduct[] {
  return products.filter(
    (product) =>
      (!filters.categories.length || filters.categories.includes(product.category)) &&
      (!filters.sizes.length || filters.sizes.some((size) => sizeMatches(product, size))) &&
      (!filters.colors.length || filters.colors.includes(groupOf(product))),
  );
}

export function sortShopAll(products: readonly MateProduct[], sort: CollectionSort): MateProduct[] {
  return sortProducts(products, sort);
}

/** Self-excluding counts, so a shopper can always widen the facet they are already inside. */
export function shopAllFacetCounts(
  products: readonly MateProduct[],
  filters: Pick<CollectionFilters, "categories" | "sizes" | "colors">,
) {
  const countBy = (
    items: MateProduct[],
    values: readonly string[],
    matches: (product: MateProduct, value: string) => boolean,
  ) => Object.fromEntries(values.map((value) => [value, items.filter((product) => matches(product, value)).length]));

  return {
    categories: countBy(
      filterShopAll(products, { ...filters, categories: [] }),
      SHOP_ALL_CATEGORIES,
      (product, value) => product.category === value,
    ),
    sizes: countBy(
      filterShopAll(products, { ...filters, sizes: [] }),
      SHOP_ALL_SIZE_FACETS,
      (product, value) => sizeMatches(product, value),
    ),
    colors: countBy(
      filterShopAll(products, { ...filters, colors: [] }),
      SHOP_ALL_COLOR_GROUPS,
      (product, value) => groupOf(product) === value,
    ),
  };
}

/* ---------------------------------------------------------------------------------- state */

const CATEGORY_FACET_IDS: Record<string, string> = {
  "activewear-tops": "aa-1-1-2",
  headbands: "aa-2-14-8",
  leggings: "aa-1-1-1-2",
  pants: "aa-1-12",
  shorts: "aa-1-1-1-3",
  socks: "aa-1-18",
  "sports-bras": "aa-1-1-6",
  sweaters: "aa-1-13-12",
  sweatpants: "aa-1-1-1-4",
  sweatshirts: "aa-1-13-14",
  "t-shirts": "aa-1-13-8",
  "tank-tops": "aa-1-13-9",
  unitards: "aa-1-1-9-2",
};

const uniqueValid = (values: string[], allowed: readonly string[]) =>
  [...new Set(values)].filter((value) => allowed.includes(value));

export function readShopAllState(params: Pick<URLSearchParams, "get" | "getAll">): ShopAllState {
  const requestedSort = params.get("sort_by") || "manual";
  const requestedPage = Number(params.get("page") || 1);
  return {
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
      SHOP_ALL_CATEGORIES,
    ),
    sizes: uniqueValid([...params.getAll("size"), ...params.getAll("filter.v.option.size")], SHOP_ALL_SIZE_FACETS),
    colors: uniqueValid([...params.getAll("color"), ...params.getAll("filter.p.m.custom.parent_color")], SHOP_ALL_COLOR_GROUPS),
  };
}

/** The reference's parameter names, so a filtered link can be bookmarked or shared. */
export function shopAllQuery(state: ShopAllState): string {
  const params = new URLSearchParams();
  if (state.sort !== "manual") params.set("sort_by", state.sort);
  for (const category of state.categories) params.append("filter.p.t.category", CATEGORY_FACET_IDS[category]);
  for (const size of state.sizes) params.append("filter.v.option.size", size);
  for (const color of state.colors) params.append("filter.p.m.custom.parent_color", color);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

/** Colour groups a set of products can offer; a group with nothing behind it is never listed. */
export function offeredColorGroups(products: readonly MateProduct[]): string[] {
  const present = new Set(products.map(groupOf).filter(Boolean));
  return SHOP_ALL_COLOR_GROUPS.filter((group) => present.has(group));
}

/** Categories the given products really contain, in the reference drawer's order. */
export function offeredCategories(products: readonly MateProduct[]): string[] {
  const present = new Set(products.map((product) => product.category).filter(Boolean));
  return SHOP_ALL_CATEGORIES.filter((category) => present.has(category));
}

/* ------------------------------------------------------------------------------- colorways */

/**
 * The swatch row on a Shop All card: every photographed colour of the garment, one swatch per
 * colour group (the reference prints a dye per group, not every sibling), the dye on screen
 * first.
 */
export function shopAllColorways(product: MateProduct): MateProduct[] {
  const resolve = (slug: string): MateProduct | undefined => rowBySlug.get(slug) ?? getCatalogProduct(slug);
  const own = (product.colorways ?? [])
    .map((slug) => resolve(slug))
    .filter(
      (colorway): colorway is ShopAllProduct =>
        !!colorway &&
        colorway.style === product.style &&
        colorway.images.length > 0 &&
        colorway.availableSizes.length > 0,
    );
  const colorways = own.length > 0 ? own : catalogColorways(product);
  const active = colorways.find((colorway) => colorway.slug === product.slug) ?? product;
  const ordered = [active, ...colorways.filter((colorway) => colorway.slug !== active.slug)];
  const seen = new Set<string>();
  const rows: MateProduct[] = [];
  for (const colorway of ordered) {
    const group = groupOf(colorway) || colorway.slug;
    if (seen.has(group)) continue;
    seen.add(group);
    rows.push(colorway);
  }
  return rows;
}

/** A swatch click resolves through the shared catalogue, so its own photograph always loads. */
export function resolveShopAllColorway(slug: string): MateProduct | undefined {
  return rowBySlug.get(slug) ?? bySlug.get(slug) ?? getCatalogProduct(slug);
}

export { emptyFilters, filterCount } from "./mateNewArrivals";
export type { CollectionFilters, CollectionSort, MateProduct };
