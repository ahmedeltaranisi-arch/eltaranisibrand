import type { Product, CollectionDef } from "./types";

/**
 * Catalog data. Titles/descriptions are resolved through the i18n message
 * files (messages/en.json, messages/ar.json) via `titleKey`.
 *
 * Photography model
 * -----------------
 * The brand shoot lives in `public/img/shots/<family>-<tone>-<n>.jpg`. Every
 * frame is a real person from that shoot, filed by the garment family and the
 * tone it was shot in — so a colourway can show the actual garment in the
 * colour the shopper picked, and the second (hover) frame is the *same* model
 * in the *same* tone, just a different pose.
 *
 * A colourway is one entry in `colorways`; `photo` picks the frame set, or is
 * omitted when the shoot never had that garment in that tone, in which case
 * the style falls back to its hero frames. `hex` comes from the archive's own
 * colour tiles, so the swatch is literally the dye of the garment next to it.
 */

const SHOTS = "/img/shots";

const C = {
  jet: { name: "jet", hex: "#111111" },
  midnight: { name: "midnight", hex: "#364450" },
  nori: { name: "nori", hex: "#26322b" },
  balsam: { name: "balsam", hex: "#354641" },
  mocha: { name: "mocha", hex: "#412d2c" },
  espresso: { name: "espresso", hex: "#5f362a" },
  sienna: { name: "sienna", hex: "#c47c63" },
  sand: { name: "sand", hex: "#dec4ac" },
  bone: { name: "bone", hex: "#f3efea" },
  oat: { name: "oat", hex: "#e9dbd2" },
  heather: { name: "heather", hex: "#e1e0e5" },
  iris: { name: "iris", hex: "#293da5" },
  fig: { name: "fig", hex: "#4e2138" },
  mulberry: { name: "mulberry", hex: "#762134" },
  wisteria: { name: "wisteria", hex: "#b8a3ae" },
  peppercorn: { name: "peppercorn", hex: "#725354" },
  pebble: { name: "pebble", hex: "#857668" },
} as const;

type Tone = keyof typeof C;

/**
 * How many frames each set in `public/img/shots` actually holds. Sets with a
 * single frame are real: the shoot never gave that garment a second pose in
 * that tone, so the shop shows one photograph instead of a broken hover.
 */
const SET_FRAMES: Record<string, number> = {
  "biker-jet": 3,
  "biker-midnight": 2,
  "bra-bone": 2,
  "bra-fig": 4,
  "bra-iris": 1,
  "bra-jet": 4,
  "crossover-fig": 2,
  "crossover-jet": 3,
  "hoodie-nori": 2,
  "layering-bone": 2,
  "layering-jet": 2,
  "layering-midnight": 2,
  "legging-bone": 1,
  "legging-fig": 3,
  "legging-jet": 4,
  "lst-bone": 1,
  "lst-jet": 6,
  "lst-midnight": 2,
  "lst-mocha": 2,
  "pant-bone": 2,
  "pant-nori": 2,
  "polo-bone": 2,
  "scoop-bone": 2,
  "scoop-fig": 2,
  "scoop-jet": 1,
  "sock-bone": 1,
  "sweatpant-heather": 1,
  "sweatpant-jet": 2,
  "tank-bone": 2,
  "tank-jet": 2,
  "tank-midnight": 2,
  "tank-mocha": 2
};

type Shot = {
  /** frame set in `/img/shots`, e.g. "bra-jet" */
  photo?: string;
};

const line = (
  base: string,
  tones: Tone[],
  shots: Partial<Record<Tone, Shot>> = {},
): {
  slug: string;
  colorways: (Product["colorways"][number] & { photo?: string })[];
} => ({
  slug: `${base}-${tones[0]}`,
  colorways: tones.map((t) => ({
    ...C[t],
    slug: `${base}-${t}`,
    ...shots[t],
  })),
});

/** Every frame a set holds, in shoot order. */
function setFrames(set: string): string[] {
  const n = SET_FRAMES[set] ?? 1;
  return Array.from({ length: n }, (_, i) => `${SHOTS}/${set}-${i + 1}.jpg`);
}

/** Frame `slot` of a set, clamped to what exists. */
export function frameAt(set: string, slot: number): string {
  const n = SET_FRAMES[set] ?? 1;
  return `${SHOTS}/${set}-${Math.min(slot, n)}.jpg`;
}

/** Four colourways per style (the shop rule: a swatch row of four). */
type Row = {
  id: string;
  base: string;
  titleKey: string;
  price: number;
  compareAt?: number;
  /** frame set used for every tone that has no dedicated set */
  main: string;
  tones: Tone[];
  shots?: Partial<Record<Tone, Shot>>;
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
    main: "scoop-bone",
    tones: ["bone", "fig", "jet", "iris"],
    shots: {
      bone: { photo: "scoop-bone" },
      fig: { photo: "scoop-fig" },
      jet: { photo: "scoop-jet" },
    },
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
    main: "legging-jet",
    tones: ["jet", "fig", "bone", "heather"],
    shots: {
      jet: { photo: "legging-jet" },
      fig: { photo: "legging-fig" },
      bone: { photo: "legging-bone" },
      heather: { photo: "legging-bone" },
    },
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
    main: "crossover-jet",
    tones: ["jet", "fig", "bone", "nori"],
    shots: {
      jet: { photo: "crossover-jet" },
      fig: { photo: "crossover-fig" },
      bone: { photo: "legging-bone" },
      nori: { photo: "pant-nori" },
    },
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
    main: "tank-mocha",
    tones: ["mocha", "midnight", "jet", "bone"],
    shots: {
      mocha: { photo: "tank-mocha" },
      midnight: { photo: "tank-midnight" },
      jet: { photo: "tank-jet" },
      bone: { photo: "tank-bone" },
    },
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
    main: "lst-jet",
    tones: ["jet", "mocha", "midnight", "bone"],
    shots: {
      jet: { photo: "lst-jet" },
      mocha: { photo: "lst-mocha" },
      midnight: { photo: "lst-midnight" },
      bone: { photo: "lst-bone" },
    },
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
    main: "hoodie-nori",
    tones: ["nori", "jet", "heather", "bone"],
    shots: {
      nori: { photo: "hoodie-nori" },
      jet: { photo: "lst-jet" },
      heather: { photo: "sweatpant-heather" },
      bone: { photo: "polo-bone" },
    },
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
    main: "pant-nori",
    tones: ["nori", "bone", "jet", "heather"],
    shots: {
      nori: { photo: "pant-nori" },
      bone: { photo: "pant-bone" },
      jet: { photo: "sweatpant-jet" },
      heather: { photo: "sweatpant-heather" },
    },
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
    main: "polo-bone",
    tones: ["bone", "mocha", "nori", "jet"],
    shots: {
      bone: { photo: "polo-bone" },
      mocha: { photo: "tank-mocha" },
      nori: { photo: "hoodie-nori" },
      jet: { photo: "sweatpant-jet" },
    },
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
    main: "bra-fig",
    tones: ["fig", "jet", "bone", "iris"],
    shots: {
      fig: { photo: "bra-fig" },
      jet: { photo: "bra-jet" },
      bone: { photo: "bra-bone" },
      iris: { photo: "bra-iris" },
    },
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
    main: "biker-jet",
    tones: ["jet", "midnight", "espresso", "fig"],
    shots: {
      jet: { photo: "biker-jet" },
      midnight: { photo: "biker-midnight" },
      espresso: { photo: "tank-mocha" },
      fig: { photo: "bra-fig" },
    },
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
    main: "layering-jet",
    tones: ["jet", "mocha", "midnight", "bone"],
    shots: {
      jet: { photo: "layering-jet" },
      mocha: { photo: "tank-mocha" },
      midnight: { photo: "layering-midnight" },
      bone: { photo: "layering-bone" },
    },
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
    main: "sock-bone",
    tones: ["bone", "heather", "sand", "nori"],
    shots: {
      bone: { photo: "sock-bone" },
      heather: { photo: "sweatpant-heather" },
      sand: { photo: "sock-bone" },
      nori: { photo: "pant-nori" },
    },
    collections: ["new-arrivals", "best-sellers", "accessories", "sale"],
    sizes: SOCK,
    rating: 4.8,
    reviewCount: 733,
  },
];

export const products: Product[] = rows.map((r) => {
  const colorways = line(r.base, r.tones, r.shots).colorways;
  return {
  id: r.id,
  baseSlug: r.base,
  titleKey: r.titleKey,
  price: r.price,
  compareAt: r.compareAt,
  image: frameAt(r.main, 1),
  imageAlt: frameAt(r.main, 2),
  colorways: colorways.map((cw) => ({
    name: cw.name,
    hex: cw.hex,
    slug: cw.slug,
  })),
  colorwayFrames: Object.fromEntries(
    colorways.map((cw) => [
      cw.name,
      setFrames(cw.photo ?? r.main),
    ]),
  ),
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
  };
});

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

/** Every colourway that has a routable page. */
export const productSlugs: string[] = products.flatMap((p) =>
  p.colorways.map((c) => c.slug),
);

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => slug.startsWith(`${p.baseSlug}-`));
}

export function getColorway(slug: string) {
  for (const p of products) {
    const c = p.colorways.find((cw) => cw.slug === slug);
    if (c) return c;
  }
  return undefined;
}

/** Every frame for a product in a given tone (falls back to the style hero). */
export function colorwayFrames(product: Product, color: string): string[] {
  const frames = product.colorwayFrames[color];
  return frames?.length ? frames : [product.image, product.imageAlt];
}

/** Card pair: the frame on screen plus the hover pose (same shot if solo). */
export function colorwayShots(
  product: Product,
  color: string,
): { front: string; back: string } {
  const [front, second] = colorwayFrames(product, color);
  return { front, back: second ?? front };
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
    hero: `${SHOTS}/scoop-bone-1.jpg`,
  },
  {
    handle: "best-sellers",
    titleKey: "collections.bestSellers.title",
    descriptionKey: "collections.bestSellers.description",
    hero: `${SHOTS}/legging-jet-2.jpg`,
  },
  {
    handle: "loungewear",
    titleKey: "collections.loungewear.title",
    descriptionKey: "collections.loungewear.description",
    hero: `${SHOTS}/hoodie-nori-2.jpg`,
  },
  {
    handle: "activewear",
    titleKey: "collections.activewear.title",
    descriptionKey: "collections.activewear.description",
    hero: `${SHOTS}/bra-fig-1.jpg`,
  },
  {
    handle: "tops",
    titleKey: "collections.tops.title",
    descriptionKey: "collections.tops.description",
    hero: `${SHOTS}/lst-jet-2.jpg`,
  },
  {
    handle: "bottoms",
    titleKey: "collections.bottoms.title",
    descriptionKey: "collections.bottoms.description",
    hero: `${SHOTS}/pant-nori-1.jpg`,
  },
  {
    handle: "accessories",
    titleKey: "collections.accessories.title",
    descriptionKey: "collections.accessories.description",
    hero: `${SHOTS}/sock-bone-1.jpg`,
  },
  {
    handle: "all",
    titleKey: "collections.all.title",
    descriptionKey: "collections.all.description",
    hero: `${SHOTS}/tank-mocha-1.jpg`,
  },
  {
    handle: "intimates",
    titleKey: "collections.intimates.title",
    descriptionKey: "collections.intimates.description",
    hero: `${SHOTS}/bra-jet-1.jpg`,
  },
  {
    handle: "sale",
    titleKey: "collections.sale.title",
    descriptionKey: "collections.sale.description",
    hero: `${SHOTS}/polo-bone-1.jpg`,
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
      {
        labelKey: "menu.featuredCard.one.label",
        href: "/collections/new-arrivals",
        image: `${SHOTS}/bra-fig-1.jpg`,
      },
      {
        labelKey: "menu.featuredCard.two.label",
        href: "/collections/loungewear",
        image: `${SHOTS}/hoodie-nori-2.jpg`,
      },
    ],
  },
];

export const searchSuggestions = [
  { labelKey: "collections.bestSellers.title", href: "/collections/best-sellers" },
  { labelKey: "collections.newArrivals.title", href: "/collections/new-arrivals" },
  { labelKey: "collections.bottoms.title", href: "/collections/bottoms" },
  { labelKey: "collections.sale.title", href: "/collections/sale" },
];

/** `p.sportsBra.title` -> `sportsBra` — the group used for every product copy key. */
export function productKey(product: { titleKey: string } | string): string {
  const titleKey = typeof product === "string" ? product : product.titleKey;
  return titleKey.replace(/^p\./, "").replace(/\.title$/, "");
}
