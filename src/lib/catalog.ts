import type { Product, CollectionDef } from "./types";

/**
 * Catalog data. Titles/descriptions are resolved through the i18n message
 * files (messages/en.json, messages/ar.json) via `titleKey`.
 *
 * `colorways[].slug` points at the real product route for that colour, so the
 * swatch row on a card navigates exactly like a multi-variant storefront.
 */

/**
 * Colour palette. Names and hexes are the real tones of the garments in
 * `public/img` — the swatch under a card is literally the dye of the piece in
 * the photo next to it.
 */
const C = {
  mocha: { name: "mocha", hex: "#412d2c" },
  espresso: { name: "espresso", hex: "#5f362a" },
  sienna: { name: "sienna", hex: "#c47c63" },
  sand: { name: "sand", hex: "#dec4ac" },
  bone: { name: "bone", hex: "#f3efea" },
  heather: { name: "heather", hex: "#e1e0e5" },
  midnight: { name: "midnight", hex: "#364450" },
  jet: { name: "jet", hex: "#111111" },
  iris: { name: "iris", hex: "#293da5" },
  fig: { name: "fig", hex: "#4d2037" },
  mulberry: { name: "mulberry", hex: "#762134" },
  nori: { name: "nori", hex: "#26322b" },
  balsam: { name: "balsam", hex: "#354741" },
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
    colors: ["fig", "mocha", "jet", "bone", "heather", "nori", "espresso", "mulberry", "midnight", "sienna"],
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
    colors: ["jet", "mocha", "heather", "nori", "espresso", "mulberry", "midnight", "fig", "sienna", "bone"],
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
    colors: ["jet", "midnight", "mocha", "nori", "heather"],
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
    colors: ["mocha", "midnight", "jet", "bone"],
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
    colors: ["jet", "midnight", "mocha", "bone"],
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
    colors: ["mocha", "jet", "heather", "bone", "nori"],
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
    colors: ["mocha", "heather", "nori", "jet", "bone", "sienna"],
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
    colors: ["bone", "mocha", "heather", "jet"],
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
    colors: ["fig", "bone", "mocha", "jet"],
    collections: ["new-arrivals", "activewear", "tops", "intimates"],
    sizes: BRA,
    rating: 4.6,
    reviewCount: 476,
  },
  {
    id: "p10",
    base: "organic-stretch-biker-short",
    titleKey: "p.bikerShort.title",
    price: 68,
    compareAt: 82,
    image: "/img/p-biker-short.jpg",
    colors: ["jet", "midnight", "espresso", "fig"],
    badges: ["limited"],
    collections: ["new-arrivals", "activewear", "bottoms", "sale"],
    sizes: APPAREL,
    rating: 4.7,
    reviewCount: 512,
  },
  {
    id: "p11",
    base: "organic-pima-layering-tank",
    titleKey: "p.pimaTank.title",
    price: 58,
    image: "/img/p-layering-tank.jpg",
    colors: ["jet", "midnight", "bone", "heather"],
    collections: ["new-arrivals", "best-sellers", "tops"],
    sizes: APPAREL,
    rating: 4.8,
    reviewCount: 733,
  },
  {
    id: "p12",
    base: "organic-cotton-crew-socks-3pk",
    titleKey: "p.socks3.title",
    price: 32,
    compareAt: 38,
    image: "/img/p-socks.jpg",
    colors: ["bone", "jet", "heather", "sand"],
    collections: ["new-arrivals", "best-sellers", "accessories", "sale"],
    sizes: SOCK,
    rating: 4.8,
    reviewCount: 733,
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
    if (i === 0 && id === "p10") out[size] = 0; // the limited run is thin
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
  const base = slug.replace(/-(mocha|espresso|sienna|sand|bone|heather|midnight|jet|iris|fig|mulberry|nori|balsam)$/, "");
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
    hero: "/img/hero-model.jpg",
  },
  {
    handle: "best-sellers",
    titleKey: "collections.bestSellers.title",
    descriptionKey: "collections.bestSellers.description",
    hero: "/img/p-midi-legging.jpg",
  },
  {
    handle: "loungewear",
    titleKey: "collections.loungewear.title",
    descriptionKey: "collections.loungewear.description",
    hero: "/img/a-zip-hoodie.jpg",
  },
  {
    handle: "activewear",
    titleKey: "collections.activewear.title",
    descriptionKey: "collections.activewear.description",
    hero: "/img/p-sports-bra.jpg",
  },
  {
    handle: "tops",
    titleKey: "collections.tops.title",
    descriptionKey: "collections.tops.description",
    hero: "/img/a-ls-top.jpg",
  },
  {
    handle: "bottoms",
    titleKey: "collections.bottoms.title",
    descriptionKey: "collections.bottoms.description",
    hero: "/img/p-crossover-legging.jpg",
  },
  {
    handle: "accessories",
    titleKey: "collections.accessories.title",
    descriptionKey: "collections.accessories.description",
    hero: "/img/p-scoop-bra.jpg",
  },
  {
    handle: "all",
    titleKey: "collections.all.title",
    descriptionKey: "collections.all.description",
    hero: "/img/a-ls-top.jpg",
  },
  {
    handle: "intimates",
    titleKey: "collections.intimates.title",
    descriptionKey: "collections.intimates.description",
    hero: "/img/p-scoop-bra.jpg",
  },
  {
    handle: "sale",
    titleKey: "collections.sale.title",
    descriptionKey: "collections.sale.description",
    hero: "/img/a-polo.jpg",
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
      { labelKey: "menu.featuredCard.one.label", href: "/collections/new-arrivals", image: "/img/hero-model.jpg" },
      { labelKey: "menu.featuredCard.two.label", href: "/collections/loungewear", image: "/img/a-zip-hoodie.jpg" },
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
 * Per-product colourway photography. A few styles were shot in more than one
 * tone, so switching a swatch swaps the model shot for that real colourway.
 * Everything else keeps the product's own photo — a product never "changes"
 * garment when you pick another swatch.
 */
const COLORWAY_PHOTOS: Record<string, Record<string, [string, string]>> = {
  p04: {
    mocha: ["/img/tank-mocha-f.jpg", "/img/tank-mocha-b.jpg"],
    midnight: ["/img/tank-midnight-f.jpg", "/img/tank-midnight-b.jpg"],
  },
  p05: {
    mocha: ["/img/ls-mocha-f.jpg", "/img/ls-mocha-b.jpg"],
    midnight: ["/img/ls-midnight-f.jpg", "/img/ls-midnight-b.jpg"],
  },
  p09: {
    fig: ["/img/p-scoop-bra.jpg", "/img/a-sports-bra.jpg"],
    bone: ["/img/tone-bone-f.jpg", "/img/a-scoop-bra.jpg"],
  },
};

/** Front + back photo for a product in a given colourway. */
export function colorwayPhotos(
  product: { id: string; image: string; imageAlt: string },
  color: string,
): { front: string; back: string } {
  const set = COLORWAY_PHOTOS[product.id]?.[color];
  return set
    ? { front: set[0], back: set[1] }
    : { front: product.image, back: product.imageAlt };
}

/** `p.sportsBra.title` -> `sportsBra` — the group used for every product copy key. */
export function productKey(product: { titleKey: string } | string): string {
  const titleKey = typeof product === "string" ? product : product.titleKey;
  return titleKey.replace(/^p\./, "").replace(/\.title$/, "");
}
