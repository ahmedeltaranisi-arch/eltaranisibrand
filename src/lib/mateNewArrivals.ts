/**
 * MATE New Arrivals - curated from Brand--New.zip assets
 * Matches matethelabel.com/collections/new?sort_by=created-descending
 * Each entry corresponds to a card in the video, with real mate images
 */

export type MateColor = {
  name: string;
  hex: string;
  label?: string;
};

export type MateProduct = {
  id: string;
  title: string;
  priceLE: number; // e.g. 10572
  priceDisplay: string; // LE 10,572
  badge?: "BEST SELLER";
  colors: MateColor[];
  images: string[]; // at least 2 images for hover
  slug: string; // for linking to product page
};

// Color hex map matching MATE swatches from the zip and catalog
const C: Record<string, string> = {
  "jet-black": "#111111",
  jet: "#111111",
  black: "#111111",
  midnight: "#1a2a3a",
  balsam: "#354641",
  forest: "#2f4638",
  mocha: "#4a2c2a",
  espresso: "#5f362a",
  brown: "#5a3a2a",
  bone: "#f3efea",
  "heather-grey": "#d1d1d1",
  "heather-oat": "#e9dbd2",
  "heather-pine": "#8aa090",
  fig: "#4e2138",
  mulberry: "#762134",
  wisteria: "#b8a3ae",
  peppercorn: "#725354",
  pebble: "#857668",
  sand: "#dec4ac",
  oat: "#e9dbd2",
  white: "#ffffff",
  "off-white": "#f9f6f0",
  thyme: "#7a8a6a",
  rosewater: "#d8a8a0",
  lotus: "#e8d5c4",
};

function le(n: number) {
  return `LE ${n.toLocaleString("en-US")}`;
}

// Helper to pick images from /img/mate folder
// We use the sanitized names we created
const img = (name: string) => `/img/mate/${name}`;

export const mateNewArrivals: MateProduct[] = [
  {
    id: "mate-01",
    title: "Organic Fleece Cropped Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
    ],
    images: [
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1127.jpg"),
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1141.jpg"),
    ],
    slug: "organic-fleece-cropped-sweatpant-mocha",
  },
  {
    id: "mate-02",
    title: "Organic Fleece Cropped Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
      { name: "bone", hex: C.bone },
    ],
    images: [
      img("look_33-look_30-organic_fleece_cropped_sweatpant_bone-3784.jpg"),
      img("look_33-look_30-organic_fleece_cropped_sweatpant_bone-3794.jpg"),
    ],
    slug: "organic-fleece-cropped-sweatpant-jet-black",
  },
  {
    id: "mate-03",
    title: "Organic Fleece Cropped Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "bone", hex: C.bone },
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1182_5c5d240.jpg"),
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1207.jpg"),
    ],
    slug: "organic-fleece-cropped-sweatpant-bone",
  },
  {
    id: "mate-04",
    title: "Organic Fleece Cropped Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "bone", hex: "#ffffff" },
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_33-look_30-organic_fleece_cropped_sweatpant_bone-3812_3.jpg"),
      img("look_33-look_30-organic_fleece_cropped_sweatpant_bone-3817.jpg"),
    ],
    slug: "organic-fleece-cropped-sweatpant-bone-2",
  },
  {
    id: "mate-05",
    title: "Organic Fleece Oversized Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2805_1.jpg"),
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2808.jpg"),
    ],
    slug: "organic-fleece-oversized-sweatpant-mocha",
  },
  {
    id: "mate-06",
    title: "Organic Fleece Oversized Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2815_1_06c.jpg"),
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2837_1.jpg"),
    ],
    slug: "organic-fleece-oversized-sweatpant-jet-black",
  },
  {
    id: "mate-07",
    title: "Organic Fleece Oversized Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "bone", hex: C.bone },
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3099.jpg"),
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3106.jpg"),
    ],
    slug: "organic-fleece-oversized-sweatpant-bone",
  },
  {
    id: "mate-08",
    title: "Organic Fleece Oversized Sweatpant",
    priceLE: 10572,
    priceDisplay: le(10572),
    colors: [
      { name: "bone", hex: "#ffffff" },
      { name: "mocha", hex: C.mocha },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3128-1.jpg"),
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2842_1.jpg"),
    ],
    slug: "organic-fleece-oversized-sweatpant-off-white",
  },
  {
    id: "mate-09",
    title: "Organic Stretch Crossover Legging",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "jet-black", hex: C.jet },
      { name: "forest", hex: C.forest },
      { name: "midnight", hex: C.midnight },
    ],
    images: [
      img("look_04-organic_stretch_crossover_legging_jet_black-0570_27f.jpg"),
      img("look_04-organic_stretch_crossover_legging_jet_black-0595.jpg"),
    ],
    slug: "organic-stretch-crossover-legging-jet-black",
  },
  {
    id: "mate-10",
    title: "Organic Stretch Crossover Legging",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "forest", hex: C.forest },
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_05-organic_stretch_crossover_legging_forest-0689.jpg"),
      img("look_05-organic_stretch_crossover_legging_forest-0701_25bde1.jpg"),
    ],
    slug: "organic-stretch-crossover-legging-forest",
  },
  {
    id: "mate-11",
    title: "Organic Stretch Crossover Legging",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "jet-black", hex: C.jet },
      { name: "forest", hex: C.forest },
      { name: "mocha", hex: C.mocha },
      { name: "midnight", hex: C.midnight },
    ],
    images: [
      img("look_04-organic_stretch_crossover_legging_jet_black-0619.jpg"),
      img("look_04-organic_stretch_crossover_legging_jet_black-0635.jpg"),
    ],
    slug: "organic-stretch-crossover-legging-jet-black-2",
  },
  {
    id: "mate-12",
    title: "Organic Stretch Crossover Legging",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
      { name: "forest", hex: C.forest },
      { name: "mocha", hex: C.mocha },
    ],
    images: [
      img("look_05-organic_stretch_crossover_legging_forest-0712.jpg"),
      img("look_05-organic_stretch_crossover_legging_forest-0762.jpg"),
    ],
    slug: "organic-stretch-crossover-legging-balsam",
  },
  {
    id: "mate-13",
    title: "Organic Stretch Foldover Pant",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "midnight", hex: C.midnight },
      { name: "forest", hex: C.forest },
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
    ],
    images: [
      img("look_15-organic_stretch_foldover_pant_midnight-2222.jpg"),
      img("look_15-organic_stretch_foldover_pant_midnight-2229_7fa98c83.jpg"),
    ],
    slug: "organic-stretch-foldover-pant-midnight",
  },
  {
    id: "mate-14",
    title: "Organic Stretch Foldover Pant",
    priceLE: 8274,
    priceDisplay: le(8274),
    colors: [
      { name: "jet-black", hex: C.jet },
      { name: "midnight", hex: C.midnight },
      { name: "forest", hex: C.forest },
      { name: "mocha", hex: C.mocha },
    ],
    images: [
      img("look_15-organic_stretch_foldover_pant_midnight-2206.jpg"),
      img("look_15-organic_stretch_foldover_pant_midnight-2319.jpg"),
    ],
    slug: "organic-stretch-foldover-pant-jet-black",
  },
  {
    id: "mate-15",
    title: "Organic Fleece Relaxed Crewneck Sweatshirt",
    priceLE: 9806,
    priceDisplay: le(9806),
    colors: [
      { name: "rosewater", hex: C.rosewater },
      { name: "brown", hex: C.brown },
      { name: "bone", hex: C.bone },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_14-organic_fleece_relaxed_crewneck_sweatshirt_rosewater-1.jpg"),
      img("look_14-organic_fleece_relaxed_crewneck_sweatshirt_rosewater.jpg"),
    ],
    slug: "organic-fleece-relaxed-crewneck-rosewater",
  },
  {
    id: "mate-16",
    title: "Organic Fleece Relaxed Crewneck Sweatshirt",
    priceLE: 9806,
    priceDisplay: le(9806),
    colors: [
      { name: "balsam", hex: C.balsam },
      { name: "brown", hex: C.brown },
      { name: "bone", hex: C.bone },
      { name: "jet-black", hex: C.jet },
    ],
    images: [
      img("look_19-organic-fleece-oversized_sweatshirt_mocha-organic_fl-10.jpg"),
      img("look_19-organic-fleece-oversized_sweatshirt_mocha-organic_fl-11.jpg"),
    ],
    slug: "organic-fleece-relaxed-crewneck-balsam",
  },
  {
    id: "mate-17",
    title: "Organic Fleece Cropped Half Zip Sweatshirt",
    priceLE: 12105,
    priceDisplay: le(12105),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "bone", hex: C.bone },
      { name: "jet-black", hex: C.jet },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1127.jpg"),
      img("look_08-organic_fleece_cropped_sweatpant_balsam-1141.jpg"),
    ],
    slug: "organic-fleece-cropped-half-zip-mocha",
  },
  {
    id: "mate-18",
    title: "Organic Stretch Scoop Bra",
    priceLE: 4444,
    priceDisplay: le(4444),
    badge: "BEST SELLER",
    colors: [
      { name: "midnight", hex: C.midnight },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "pebble", hex: C.pebble },
    ],
    images: [
      img("look_01-organic_stretch_scoop_bra_midnight-0005.jpg"),
      img("look_01-organic_stretch_scoop_bra_midnight-0043_ddd5c258-11c.jpg"),
    ],
    slug: "organic-stretch-scoop-bra-midnight",
  },
  {
    id: "mate-19",
    title: "Organic Stretch Scoop Bra",
    priceLE: 4444,
    priceDisplay: le(4444),
    colors: [
      { name: "fig", hex: C.fig },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "pebble", hex: C.pebble },
    ],
    images: [
      img("look_01-organic_stretch_scoop_bra_fig-0043.jpg"),
      img("look_01-organic_stretch_scoop_bra_fig-0054.jpg"),
    ],
    slug: "organic-stretch-scoop-bra-fig",
  },
  {
    id: "mate-20",
    title: "Organic Stretch Sports Bra",
    priceLE: 4444,
    priceDisplay: le(4444),
    badge: "BEST SELLER",
    colors: [
      { name: "midnight", hex: C.midnight },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "pebble", hex: C.pebble },
    ],
    images: [
      img("look_12-organic_stretch_sports_bra_midnight_organic_stretch_-1.jpg"),
      img("look_12-organic_stretch_sports_bra_midnight_organic_stretch_-2.jpg"),
    ],
    slug: "organic-stretch-sports-bra-midnight",
  },
  {
    id: "mate-21",
    title: "Organic Stretch Sports Bra",
    priceLE: 4444,
    priceDisplay: le(4444),
    badge: "BEST SELLER",
    colors: [
      { name: "mulberry", hex: C.mulberry },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "pebble", hex: C.pebble },
    ],
    images: [
      img("look_06-organic_stretch_sports_bra_fig-0812_36a4eb08-3184-49.jpg"),
      img("look_06-organic_stretch_sports_bra_fig-0828_eee5372d-b10f-4e.jpg"),
    ],
    slug: "organic-stretch-sports-bra-mulberry",
  },
  {
    id: "mate-22",
    title: "Organic Fleece Straight Leg Sweatpant",
    priceLE: 9806,
    priceDisplay: le(9806),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_20-organic_fleece_oversized_sweatpant_balsam-2860_35e3b.jpg"),
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3099.jpg"),
    ],
    slug: "organic-fleece-straight-leg-mocha",
  },
  {
    id: "mate-23",
    title: "Organic Fleece Relaxed Pocket Sweatpant",
    priceLE: 9806,
    priceDisplay: le(9806),
    colors: [
      { name: "rosewater", hex: C.rosewater },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3106.jpg"),
      img("look_24-organic_fleece_oversized_sweatpant_mocha-3128.jpg"),
    ],
    slug: "organic-fleece-relaxed-pocket-mocha",
  },
  {
    id: "mate-24",
    title: "Organic Stretch High Neck Tank",
    priceLE: 5210,
    priceDisplay: le(5210),
    colors: [
      { name: "midnight", hex: C.midnight },
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
    ],
    images: [
      img("look_03_organic_stretch_high_neck_tank_midnight-0357.jpg"),
      img("look_03_organic_stretch_high_neck_tank_midnight-0408_13cb5e1.jpg"),
    ],
    slug: "organic-stretch-high-neck-tank-midnight",
  },
  {
    id: "mate-25",
    title: "Organic Stretch Full Length Legging",
    priceLE: 7508,
    priceDisplay: le(7508),
    badge: "BEST SELLER",
    colors: [
      { name: "mulberry", hex: C.mulberry },
      { name: "balsam", hex: C.balsam },
      { name: "jet-black", hex: C.jet },
      { name: "mocha", hex: C.mocha },
    ],
    images: [
      img("look_04-organic_stretch_crossover_legging_jet_black-0570_27f.jpg"),
      img("look_05-organic_stretch_crossover_legging_forest-0689.jpg"),
    ],
    slug: "organic-stretch-full-length-legging-mulberry",
  },
  {
    id: "mate-26",
    title: "Organic Fleece Zip Hoodie",
    priceLE: 12105,
    priceDisplay: le(12105),
    colors: [
      { name: "mocha", hex: C.mocha },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_27-organic_fleece_full_zip_hoodie_jet_black-organic_fle-1.jpg"),
      img("look_27-organic_fleece_full_zip_hoodie_jet_black-organic_fle-2.jpg"),
    ],
    slug: "organic-fleece-zip-hoodie-mocha",
  },
  {
    id: "mate-27",
    title: "Organic Stretch Crop Racer Tank",
    priceLE: 5210,
    priceDisplay: le(5210),
    colors: [
      { name: "mulberry", hex: C.mulberry },
      { name: "jet-black", hex: C.jet },
      { name: "bone", hex: C.bone },
      { name: "pebble", hex: C.pebble },
    ],
    images: [
      img("look_13-organic_stretch_racer_tank_midnight_organic_stretch_-1.jpg"),
      img("look_13-organic_stretch_racer_tank_midnight_organic_stretch_-2.jpg"),
    ],
    slug: "organic-stretch-crop-racer-tank-mulberry",
  },
  {
    id: "mate-28",
    title: "Organic Stretch Midi Legging",
    priceLE: 6742,
    priceDisplay: le(6742),
    colors: [
      { name: "jet-black", hex: C.jet },
      { name: "midnight", hex: C.midnight },
      { name: "pebble", hex: C.pebble },
      { name: "balsam", hex: C.balsam },
    ],
    images: [
      img("look_04-organic_stretch_crossover_legging_jet_black-0619.jpg"),
      img("look_05-organic_stretch_crossover_legging_forest-0712.jpg"),
    ],
    slug: "organic-stretch-midi-legging-jet-black",
  },
];
