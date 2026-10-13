import {
  arrivalCatalog,
  productColorways as arrivalColorways,
  type MateProduct,
} from "./mateNewArrivals";
import { activewearProducts } from "./activewearCatalog";

/**
 * One lookup across every photographed colorway this storefront sells.
 *
 * New Arrivals / Best Sellers and Activewear are separate captures of the same reference store:
 * most activewear styles appear in both, while biker shorts, unitards, socks, track pants and a
 * few bras only exist in the Activewear capture. The arrival entry wins when both describe the
 * same slug so the pages that shipped earlier keep rendering the exact bytes they were built
 * with, and the Activewear-only colorways fill in the rest.
 */
// The full capture, not just the arrivals slice: Best Sellers shares these products too.
const arrivalSlugs = new Set(arrivalCatalog.map((product) => product.slug));

export const activewearOnlyProducts: MateProduct[] = activewearProducts.filter(
  (product) => !arrivalSlugs.has(product.slug),
);

export const catalogProducts: MateProduct[] = [...arrivalCatalog, ...activewearOnlyProducts];

const bySlug = new Map(catalogProducts.map((product) => [product.slug, product]));
const byActivewearSlug = new Map(activewearProducts.map((product) => [product.slug, product]));

export function getCatalogProduct(slug: string): MateProduct | undefined {
  return bySlug.get(slug);
}

export const catalogProductSlugs: string[] = catalogProducts.map((product) => product.slug);

// Identity, not slug: a product that both captures describe is held twice, and only the object
// the caller passed in tells us which capture's photography its colourway grid should speak.
const activewearObjects = new Set<MateProduct>(activewearProducts);

/**
 * A colourway is offered only when its own photograph exists and it can actually be bought —
 * never as a tinted or borrowed image. Slugs resolve across both captures.
 *
 * An Activewear product resolves its own colourways inside the Activewear capture first: a card
 * on that collection must swap to that collection's photograph of the colour, not to the arrival
 * capture's shot of the same style. Everything else keeps the arrival capture first, so the
 * pages that shipped before the Activewear collection are untouched.
 */
export function catalogColorways(product: MateProduct): MateProduct[] {
  const lookup = (slug: string) =>
    (activewearObjects.has(product) ? byActivewearSlug.get(slug) : undefined) ?? bySlug.get(slug);
  const own = product.colorways
    .map((slug) => lookup(slug))
    .filter(
      (colorway): colorway is MateProduct =>
        !!colorway &&
        colorway.style === product.style &&
        colorway.images.length > 0 &&
        colorway.availableSizes.length > 0,
    );
  if (own.length > 0) return own;
  return arrivalColorways(product);
}
