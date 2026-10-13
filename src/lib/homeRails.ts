import { mateNewArrivals, productColorways, sortProducts, type MateProduct } from "./mateNewArrivals";
import { mateBestSellers, sortBestSellers, tabProducts } from "./mateBestSellers";

/**
 * The home rails read the same verified catalogue the collection pages filter on, and each card
 * is a real photographed colorway — so a swatch on the home page swaps to that colour's own
 * garment and model pose instead of a guessed frame.
 */
export const HOME_RAIL_SIZE = 8;

export type HomeRail = {
  key: "new-arrivals" | "best-sellers" | "fleece-edit";
  labelKey: "newArrivals" | "bestSellers" | "loungewear";
  href: string;
  products: MateProduct[];
};

export function homeRails(): HomeRail[] {
  return [
    {
      key: "new-arrivals",
      labelKey: "newArrivals",
      href: "/collections/new-arrivals",
      products: sortProducts(mateNewArrivals, "manual").slice(0, HOME_RAIL_SIZE),
    },
    {
      key: "best-sellers",
      labelKey: "bestSellers",
      href: "/collections/best-sellers?sort_by=best-selling",
      products: sortBestSellers(mateBestSellers, "best-selling").slice(0, HOME_RAIL_SIZE),
    },
    {
      key: "fleece-edit",
      labelKey: "loungewear",
      href: "/collections/best-sellers?tab=sweats",
      products: sortProducts(tabProducts("sweats"), "manual").slice(0, HOME_RAIL_SIZE),
    },
  ];
}

/**
 * The "Clean comfort" trio. Each tile counts exactly what its own landing page shows, and each
 * swatch row it inherits from the rail is reachable on that page.
 */
export function homeCategoryTiles() {
  return [
    { image: "/img/shots/bra-fig-1.jpg", count: tabProducts("activewear").length },
    { image: "/img/shots/tank-mocha-1.jpg", count: mateBestSellers.length },
    { image: "/img/shots/hoodie-nori-1.jpg", count: tabProducts("sweats").length },
  ];
}

/** Colourways a home card can actually switch to, each with its own photography. */
export function homeCardColorways(product: MateProduct): MateProduct[] {
  return productColorways(product);
}
