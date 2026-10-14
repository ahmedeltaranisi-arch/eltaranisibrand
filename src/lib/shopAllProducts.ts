import { catalogProducts } from "./mateCatalog";
import { shopAllProducts, type ShopAllProduct } from "./shopAll";
import type { MateProduct } from "./mateNewArrivals";

/**
 * One lookup over everything this storefront sells: the New Arrivals / Best Sellers and Activewear
 * captures first — so the pages that shipped before the Shop All rebuild keep rendering the exact
 * products they were built with — and then the reference's own `/collections/all` catalogue, whose
 * extra colorways exist nowhere else.
 *
 * The product route, the cart and checkout all resolve through this map, which is why a card on
 * `/collections/all` opens a real product page and can really be bought.
 */
const known = new Set(catalogProducts.map((product) => product.slug));

export const shopAllOnlyProducts: ShopAllProduct[] = shopAllProducts.filter(
  (product) => !known.has(product.slug),
);

const bySlug = new Map<string, MateProduct>();
for (const product of shopAllOnlyProducts) bySlug.set(product.slug, product);
for (const product of catalogProducts) bySlug.set(product.slug, product);

export function getAnyCatalogProduct(slug: string): MateProduct | undefined {
  return bySlug.get(slug);
}

export const anyCatalogProductSlugs: string[] = [...bySlug.keys()];
