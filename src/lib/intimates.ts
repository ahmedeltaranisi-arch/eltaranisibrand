import { railProducts, shopAllColorways, type MateProduct, type ShopAllProduct } from "./shopAll";

export const INTIMATES_HANDLES = [
  "intimates",
  "bras-and-tanks",
  "undies",
  "tanks",
  "socks",
  "undie-packs",
] as const;

export type IntimatesHandle = (typeof INTIMATES_HANDLES)[number];
export type IntimatesTabId = "all" | "bralettes" | "undies" | "tanks" | "socks" | "undiePacks";

export type IntimatesTab = {
  id: IntimatesTabId;
  handle: IntimatesHandle;
  image: string;
  altKey: IntimatesTabId;
};

/** The six Intimates category tiles use the photographs delivered with the reference assets. */
export const INTIMATES_TABS: readonly IntimatesTab[] = [
  { id: "all", handle: "intimates", image: "/img/intimates/nav-all-intimates.jpg", altKey: "all" },
  { id: "bralettes", handle: "bras-and-tanks", image: "/img/intimates/nav-bralettes.jpg", altKey: "bralettes" },
  { id: "undies", handle: "undies", image: "/img/intimates/nav-undies.jpg", altKey: "undies" },
  { id: "tanks", handle: "tanks", image: "/img/intimates/nav-tanks.jpg", altKey: "tanks" },
  { id: "socks", handle: "socks", image: "/img/intimates/nav-socks.jpg", altKey: "socks" },
  { id: "undiePacks", handle: "undie-packs", image: "/img/intimates/nav-undie-packs.jpg", altKey: "undiePacks" },
];

/**
 * The five colours shown by the Intimates menu. Each group is linked to a real colour family in
 * this catalogue, while the label remains the actual dye name visible on the product cards.
 */
export const INTIMATES_FEATURED_COLORS = [
  { key: "jet-black", labelKey: "jetBlack", group: "Black", hex: "#000000" },
  { key: "sand", labelKey: "sand", group: "Neutral", hex: "#dec4ac" },
  { key: "bone", labelKey: "bone", group: "White", hex: "#f3efea" },
  { key: "espresso", labelKey: "espresso", group: "Brown", hex: "#5f362a" },
  { key: "heather-grey", labelKey: "heatherGrey", group: "Grey", hex: "#e1e0e5" },
] as const;

export const INTIMATES_MENU_TILES = [
  { id: "shopAll", image: "/img/intimates/mega-shop-all.jpg", href: "/collections/intimates" },
  { id: "organicComfort", image: "/img/intimates/nav-bralettes.jpg", href: "/collections/bras-and-tanks" },
] as const;

const INTIMATES = railProducts("intimates");
const UNDIES_ORDER = [
  "organic-comfort-high-waist-brief-heather-grey",
  "organic-comfort-mid-rise-bikini-heather-grey",
  "organic-comfort-mid-rise-bikini-jet-black",
  "organic-comfort-high-waist-brief-jet-black",
  "organic-comfort-high-waist-brief-sand",
  "organic-comfort-mid-rise-bikini-sand",
  "organic-comfort-high-waist-brief-espresso",
  "organic-comfort-mid-rise-bikini-espresso",
  "organic-comfort-mid-rise-bikini-bone",
  "organic-comfort-high-waist-brief-bone",
  "organic-comfort-high-waist-brief-3-pack-jet-black",
  "organic-comfort-high-waist-brief-3-pack-bone-sand-espresso",
  "organic-comfort-mid-rise-bikini-3-pack-jet-black",
  "organic-comfort-mid-rise-bikini-3-pack-bone-sand-espresso",
] as const;
const TANKS_ORDER = [
  "organic-comfort-crop-tank-bone",
  "organic-comfort-crop-tank-espresso",
  "organic-comfort-crop-tank-jet-black",
  "organic-comfort-crop-tank-sand",
  "organic-comfort-cami-bone",
  "organic-comfort-cami-jet-black",
  "organic-comfort-cami-espresso",
  "organic-comfort-cami-sand",
  "organic-comfort-crop-tank-heather-grey",
] as const;

function orderByCapture(products: readonly ShopAllProduct[], order: readonly string[]): ShopAllProduct[] {
  const available = new Map(products.map((product) => [product.slug, product]));
  const ordered = order.map((slug) => available.get(slug)).filter((product): product is ShopAllProduct => Boolean(product));
  const used = new Set(ordered.map((product) => product.slug));
  return [...ordered, ...products.filter((product) => !used.has(product.slug))];
}

const UNDIES = orderByCapture(
  INTIMATES.filter((product) => product.category === "briefs" || product.category === "bikinis"),
  UNDIES_ORDER,
);
const TANKS = orderByCapture(INTIMATES.filter((product) => product.category === "tank-tops"), TANKS_ORDER);
const BRALETTES = INTIMATES.filter((product) => product.category === "bras");
const SOCKS = railProducts("socks");
const UNDIE_PACKS = UNDIES.filter((product) => product.slug.includes("-3-pack-"));

/** Return the actual captured products for an Intimates tab, never a placeholder shelf. */
export function intimatesProducts(handle: string): ShopAllProduct[] {
  switch (handle) {
    case "bras-and-tanks": return BRALETTES;
    case "undies": return UNDIES;
    case "tanks": return TANKS;
    case "socks": return SOCKS;
    case "undie-packs": return UNDIE_PACKS;
    case "intimates":
    default: return INTIMATES;
  }
}

/** A menu dye narrows to its exact photographed colourway, not a broader neutral/black group. */
export function intimatesProductsInColor(handle: string, color: string): ShopAllProduct[] {
  const products = intimatesProducts(handle);
  return color ? products.filter((product) => product.color.name === color) : products;
}

/** Captured Intimates dye chips. Multi-packs use a true split swatch instead of a placeholder. */
const INTIMATES_SWATCHES: Record<string, { hex: string; swatch?: string }> = {
  "jet-black": { hex: "#000000" },
  sand: { hex: "#dec4ac" },
  bone: { hex: "#f3efea" },
  espresso: { hex: "#5f362a" },
  "heather-grey": { hex: "#e1e0e5" },
  natural: { hex: "#d3caba" },
  "natural-sage-sedona": {
    hex: "#d3caba",
    swatch: "linear-gradient(90deg, #d3caba 0 33%, #aeb9a4 33% 66%, #a4614f 66% 100%)",
  },
  "bone-forest-maple-jet-black-birch": {
    hex: "#f3efea",
    swatch: "linear-gradient(90deg, #f3efea 0 20%, #536349 20% 40%, #a95b3f 40% 60%, #000000 60% 80%, #c8c1b0 80% 100%)",
  },
  "bone-conch-raffia": {
    hex: "#f3efea",
    swatch: "linear-gradient(90deg, #f3efea 0 33%, #cda6a0 33% 66%, #c9aa89 66% 100%)",
  },
  "bone-sand-espresso": {
    hex: "#f3efea",
    swatch: "linear-gradient(90deg, #f3efea 0 33%, #dec4ac 33% 66%, #5f362a 66% 100%)",
  },
};

/** The local catalog's colour swatches are deliberately defaulted; restore the captured dye chips. */
export function intimatesColorway(product: MateProduct): MateProduct {
  const captured = INTIMATES_SWATCHES[product.color.name];
  if (!captured) return product;
  return {
    ...product,
    color: {
      ...product.color,
      hex: captured.hex,
      swatch: captured.swatch ?? product.color.swatch,
    },
  };
}

export function intimatesColorways(product: MateProduct): MateProduct[] {
  const rows = shopAllColorways(product).map(intimatesColorway);
  if (rows.some((candidate) => candidate.slug === product.slug)) return rows;
  return [intimatesColorway(product), ...rows];
}

/** Color a label links to only appears when the actual Intimates collection carries that dye. */
export function availableIntimatesMenuColors() {
  const present = new Set(INTIMATES.map((product) => product.color.name));
  return INTIMATES_FEATURED_COLORS.filter((color) => present.has(color.key));
}
