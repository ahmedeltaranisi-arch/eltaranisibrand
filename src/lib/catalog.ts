import type { Product, CollectionDef } from "./types";

/**
 * Catalog data. Titles/descriptions are resolved through the i18n message
 * files (messages/en.json, messages/ar.json) via `titleKey`.
 *
 * `colorways[].slug` points at the real product route for that colour, so the
 * swatch row on a card navigates exactly like a multi-variant storefront.
 */

const C = {
  clay: { name: "clay", hex: "#c08a6d" },
  terra: { name: "terra", hex: "#a4603f" },
  midnight: { name: "midnight", hex: "#2b3346" },
  jet: { name: "jet", hex: "#1b1b1a" },
  bone: { name: "bone", hex: "#ece5d8" },
  sage: { name: "sage", hex: "#b8c1ae" },
  pine: { name: "pine", hex: "#5f6f5c" },
  mocha: { name: "mocha", hex: "#8b6f5c" },
  heather: { name: "heather", hex: "#b3b0a8" },
  cove: { name: "cove", hex: "#7f93a1" },
  ochre: { name: "ochre", hex: "#c79a4b" },
  mulberry: { name: "mulberry", hex: "#6d4557" },
};

const line = (
  base: string,
  colors: (keyof typeof C)[],
): { slug: string; colorways: Product["colorways"] } => ({
  slug: `${base}-${colors[0]}`,
  colorways: colors.map((c) => ({ ...C[c], slug: `${base}-${c}` })),
});

type Row = {
  id: string;
  base: string;
  titleKey: string;
  price: number;
  compareAt?: number;
  image: string;
  colors: (keyof typeof C)[];
  badges?: Product["badges"];
  collections: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
};

const APPAREL = ["XS", "S", "M", "L", "XL"];
const BRA = ["XS", "S", "M", "L", "XL"];
const SOCK = ["S/M", "M/L"];

const rows: Row[] = [
  {
    id: "p01",
    base: "organic-jersey-sports-bra",
    titleKey: "p.sportsBra.title",
    price: 58,
    image: "/img/p-sports-bra.jpg",
    colors: ["clay", "jet", "bone", "heather", "pine", "mocha", "mulberry", "midnight", "cove", "terra"],
    badges: ["best"],
    collections: ["new-arrivals", "best-sellers", "activewear", "tops", "intimates"],
    sizes: BRA,
    rating: 4.8,
    reviewCount: 1284,
  },
  {
    id: "p02",
    base: "organic-jersey-midi-legging",
    titleKey: "p.midiLegging.title",
    price: 88,
    image: "/img/p-midi-legging.jpg",
    colors: ["terra", "jet", "heather", "pine", "mocha", "mulberry", "cove", "midnight", "clay", "bone"],
    badges: ["best"],
    collections: ["new-arrivals", "best-sellers", "activewear", "bottoms"],
    sizes: APPAREL,
    rating: 4.9,
    reviewCount: 2143,
  },
  {
    id: "p03",
    base: "organic-jersey-crossover-legging",
    titleKey: "p.crossoverLegging.title",
    price: 108,
    image: "/img/p-crossover-legging.jpg",
    colors: ["jet", "midnight", "mocha", "pine", "heather"],
    collections: ["new-arrivals", "activewear", "bottoms"],
    sizes: APPAREL,
    rating: 4.7,
    reviewCount: 641,
  },
  {
    id: "p04",
    base: "organic-jersey-high-neck-tank",
    titleKey: "p.highNeckTank.title",
    price: 68,
    image: "/img/p-high-neck-tank.jpg",
    colors: ["jet", "mocha", "midnight", "bone"],
    collections: ["new-arrivals", "best-sellers", "tops"],
    sizes: APPAREL,
    rating: 4.6,
    reviewCount: 388,
  },
  {
    id: "p05",
    base: "organic-jersey-long-sleeve-top",
    titleKey: "p.longSleeveTop.title",
    price: 78,
    image: "/img/p-ls-top.jpg",
    colors: ["midnight", "jet", "mocha", "bone"],
    badges: ["best"],
    collections: ["new-arrivals", "best-sellers", "tops"],
    sizes: APPAREL,
    rating: 4.8,
    reviewCount: 967,
  },
  {
    id: "p06",
    base: "organic-fleece-zip-hoodie",
    titleKey: "p.zipHoodie.title",
    price: 158,
    image: "/img/p-zip-hoodie.jpg",
    colors: ["mocha", "jet", "heather", "bone", "pine"],
    collections: ["loungewear", "new-arrivals", "best-sellers", "tops"],
    sizes: APPAREL,
    rating: 4.9,
    reviewCount: 1520,
  },
  {
    id: "p07",
    base: "organic-fleece-relaxed-sweatpant",
    titleKey: "p.relaxedSweatpant.title",
    price: 138,
    image: "/img/p-sweatpant.jpg",
    colors: ["mocha", "heather", "pine", "jet", "bone", "clay"],
    collections: ["loungewear", "best-sellers", "bottoms"],
    sizes: APPAREL,
    rating: 4.8,
    reviewCount: 1104,
  },
  {
    id: "p08",
    base: "organic-fleece-polo-sweatshirt",
    titleKey: "p.poloSweatshirt.title",
    price: 138,
    image: "/img/p-polo.jpg",
    colors: ["mocha", "heather", "bone", "jet"],
    collections: ["loungewear", "tops"],
    sizes: APPAREL,
    rating: 4.5,
    reviewCount: 212,
  },
  {
    id: "p09",
    base: "organic-jersey-scoop-bra",
    titleKey: "p.scoopBra.title",
    price: 54,
    image: "/img/p-scoop-bra.jpg",
    colors: ["midnight", "bone", "clay", "jet"],
    collections: ["new-arrivals", "activewear", "tops", "intimates"],
    sizes: BRA,
    rating: 4.6,
    reviewCount: 476,
  },
  {
    id: "p10",
    base: "organic-fleece-cropped-sweatpant",
    titleKey: "p.croppedSweatpant.title",
    price: 128,
    compareAt: 148,
    image: "/img/knit-crouch.jpg",
    colors: ["mocha", "pine", "jet", "heather", "bone"],
    collections: ["loungewear", "bottoms", "sale"],
    sizes: APPAREL,
    rating: 4.7,
    reviewCount: 305,
  },
  {
    id: "p11",
    base: "organic-cotton-crew-socks-3pk",
    titleKey: "p.socks3.title",
    price: 32,
    image: "/img/p-high-neck-tank.jpg",
    colors: ["bone", "jet", "heather"],
    collections: ["new-arrivals", "accessories", "best-sellers"],
    sizes: SOCK,
    rating: 4.8,
    reviewCount: 733,
  },
  {
    id: "p12",
    base: "organic-waffle-collar-half-zip",
    titleKey: "p.halfZip.title",
    price: 148,
    compareAt: 168,
    image: "/img/p-zip-hoodie.jpg",
    colors: ["pine", "bone", "mocha"],
    badges: ["limited"],
    collections: ["loungewear", "tops", "sale", "new-arrivals"],
    sizes: APPAREL,
    rating: 4.6,
    reviewCount: 148,
  },
];

/**
 * Deterministic pseudo-stock: the same product+size always yields the same
 * number, so the "in stock only" filter and the sold-out badges are stable
 * across renders (and across the two locales).
 */
function stockFor(id: string, sizes: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  sizes.forEach((size, i) => {
    let h = 0;
    for (const ch of `${id}:${size}`) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    out[size] = h % 7 === 0 ? 0 : (h % 24) + 1;
    if (i === 0 && id === "p12") out[size] = 0; // the limited run is thin
  });
  return out;
}

export const products: Product[] = rows.map((r) => ({
  id: r.id,
  baseSlug: r.base,
  titleKey: r.titleKey,
  price: r.price,
  compareAt: r.compareAt,
  image: r.image,
  imageAlt: r.image.replace("/img/p-", "/img/a-"),
  colorways: line(r.base, r.colors).colorways,
  badges: r.badges,
  collections: r.collections,
  sizes: r.sizes,
  stock: stockFor(r.id, r.sizes),
  rating: r.rating,
  reviewCount: r.reviewCount,
  // `titleKey` always ends in ".title" — swap only that suffix, otherwise the
  // ".title" inside the key gets mangled (e.g. p.polo.title.blurb).
  blurbKey: r.titleKey.replace(/\.title$/, ".blurb"),
  descriptionKey: r.titleKey.replace(/\.title$/, ".description"),
  materialKey: r.titleKey.replace(/\.title$/, ".material"),
  careKey: r.titleKey.replace(/\.title$/, ".care"),
}));

/** Every colourway that has a routable page. */
export const productSlugs: string[] = products.flatMap((p) =>
  p.colorways.map((c) => c.slug),
);

export function getProductBySlug(slug: string): Product | undefined {
  const base = slug.replace(/-(clay|terra|midnight|jet|bone|sage|pine|mocha|heather|cove|ochre|mulberry)$/, "");
  return products.find((p) => p.baseSlug === base);
}

export function getColorway(slug: string) {
  for (const p of products) {
    const c = p.colorways.find((cw) => cw.slug === slug);
    if (c) return c;
  }
  return undefined;
}

export function productsByCollection(handle: string): Product[] {
  if (handle === "all") return products;
  return products.filter((p) => p.collections.includes(handle));
}

export const collections: CollectionDef[] = [
  {
    handle: "new-arrivals",
    titleKey: "collections.newArrivals.title",
    descriptionKey: "collections.newArrivals.description",
    hero: "/img/hero-still-life.jpg",
  },
  {
    handle: "best-sellers",
    titleKey: "collections.bestSellers.title",
    descriptionKey: "collections.bestSellers.description",
    hero: "/img/hero-model.jpg",
  },
  {
    handle: "loungewear",
    titleKey: "collections.loungewear.title",
    descriptionKey: "collections.loungewear.description",
    hero: "/img/p-zip-hoodie.jpg",
  },
  {
    handle: "activewear",
    titleKey: "collections.activewear.title",
    descriptionKey: "collections.activewear.description",
    hero: "/img/p-midi-legging.jpg",
  },
  {
    handle: "tops",
    titleKey: "collections.tops.title",
    descriptionKey: "collections.tops.description",
    hero: "/img/p-ls-top.jpg",
  },
  {
    handle: "bottoms",
    titleKey: "collections.bottoms.title",
    descriptionKey: "collections.bottoms.description",
    hero: "/img/p-sweatpant.jpg",
  },
  {
    handle: "accessories",
    titleKey: "collections.accessories.title",
    descriptionKey: "collections.accessories.description",
    hero: "/img/p-high-neck-tank.jpg",
  },
  {
    handle: "all",
    titleKey: "collections.all.title",
    descriptionKey: "collections.all.description",
    hero: "/img/p-ls-top.jpg",
  },
  {
    handle: "intimates",
    titleKey: "collections.intimates.title",
    descriptionKey: "collections.intimates.description",
    hero: "/img/p-sports-bra.jpg",
  },
  {
    handle: "sale",
    titleKey: "collections.sale.title",
    descriptionKey: "collections.sale.description",
    hero: "/img/p-polo.jpg",
  },
];

export function getCollection(handle: string) {
  return collections.find((c) => c.handle === handle);
}

/** Header mega-menu structure. */
export const shopMenu = [
  {
    key: "shop",
    labelKey: "nav.shop",
    columns: [
      {
        titleKey: "menu.featured.title",
        links: [
          { labelKey: "menu.featured.newArrivals", href: "/collections/new-arrivals" },
          { labelKey: "menu.featured.bestSellers", href: "/collections/best-sellers" },
          { labelKey: "menu.featured.bundles", href: "/collections/best-sellers" },
          { labelKey: "menu.featured.sale", href: "/collections/sale" },
        ],
      },
      {
        titleKey: "menu.category.title",
        links: [
          { labelKey: "collections.tops.title", href: "/collections/tops" },
          { labelKey: "collections.bottoms.title", href: "/collections/bottoms" },
          { labelKey: "collections.loungewear.title", href: "/collections/loungewear" },
          { labelKey: "collections.activewear.title", href: "/collections/activewear" },
          { labelKey: "collections.accessories.title", href: "/collections/accessories" },
        ],
      },
      {
        titleKey: "menu.edit.title",
        links: [
          { labelKey: "menu.edit.travel", href: "/collections/activewear" },
          { labelKey: "menu.edit.layering", href: "/collections/tops" },
          { labelKey: "menu.edit.weekend", href: "/collections/loungewear" },
          { labelKey: "menu.edit.everyday", href: "/collections/best-sellers" },
        ],
      },
    ],
    featured: [
      { labelKey: "menu.featuredCard.one.label", href: "/collections/new-arrivals", image: "/img/hero-still-life.jpg" },
      { labelKey: "menu.featuredCard.two.label", href: "/collections/loungewear", image: "/img/p-zip-hoodie.jpg" },
    ],
  },
];

export const searchSuggestions = [
  { labelKey: "collections.bestSellers.title", href: "/collections/best-sellers" },
  { labelKey: "collections.newArrivals.title", href: "/collections/new-arrivals" },
  { labelKey: "collections.bottoms.title", href: "/collections/bottoms" },
  { labelKey: "collections.sale.title", href: "/collections/sale" },
];

/**
 * Real-person photo per colour tone. Switching a swatch swaps the model shot
 * to a genuine photograph of a person wearing a matching tone, so colourways
 * always show a real human (never AI).
 */
const COLOR_IMAGE: Record<string, string> = {
  jet: "/img/studio-black-f.jpg",
  midnight: "/img/studio-navy-f.jpg",
  cove: "/img/studio-navy-f.jpg",
  bone: "/img/studio-cream-f.jpg",
  clay: "/img/studio-brown-f.jpg",
  terra: "/img/studio-brown-f.jpg",
  mocha: "/img/studio-brown-f.jpg",
  mulberry: "/img/studio-brown-f.jpg",
  ochre: "/img/studio-brown-f.jpg",
  heather: "/img/studio-grey-f.jpg",
  sage: "/img/studio-grey-f.jpg",
  pine: "/img/studio-grey-f.jpg",
};

/** Back-view studio photo per tone — shown on hover, always a real person. */
const COLOR_BACK: Record<string, string> = {
  jet: "/img/studio-black-b.jpg",
  midnight: "/img/studio-navy-b.jpg",
  cove: "/img/studio-navy-b.jpg",
  bone: "/img/studio-cream-b.jpg",
  clay: "/img/studio-brown-b.jpg",
  terra: "/img/studio-brown-b.jpg",
  mocha: "/img/studio-brown-b.jpg",
  mulberry: "/img/studio-brown-b.jpg",
  ochre: "/img/studio-brown-b.jpg",
  heather: "/img/studio-grey-b.jpg",
  sage: "/img/studio-grey-b.jpg",
  pine: "/img/studio-grey-b.jpg",
};

/** Products with a real per-tone studio set (front + back) — only these swap imagery per colour. */
export const STUDIO_PRODUCTS = new Set(["p01", "p02", "p03"]);

/** Real-person photo for a colourway tone, falling back to the product shot. */
export function colorImage(color: string, fallback: string): string {
  return COLOR_IMAGE[color] ?? fallback;
}

/** Real-person back view for a colourway tone, falling back to the alt shot. */
export function colorBack(color: string, fallback: string): string {
  return COLOR_BACK[color] ?? fallback;
}

/** `p.sportsBra.title` -> `sportsBra` — the group used for every product copy key. */
export function productKey(product: { titleKey: string } | string): string {
  const titleKey = typeof product === "string" ? product : product.titleKey;
  return titleKey.replace(/^p\./, "").replace(/\.title$/, "");
}
