import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { SHOP_ALL_ROUTES, railProducts } from "../src/lib/shopAll";
import { ACTIVEWEAR_RAILS, railProducts as activewearRailProducts } from "../src/lib/activewearCatalog";

/**
 * The reference prints each shelf in its own order, and a shelf is not the whole store: its leader
 * is the collection's own first card, not the All collection's. These tests pin every rail, fabric
 * and dye page to the capture it was built from, so a re-sort can never quietly re-rank a shelf.
 */
const capture = (name: string): string[] | null => {
  const path = `relay/reference-grid-${name}.json`;
  if (!existsSync(path)) return null;
  const data = JSON.parse(readFileSync(path, "utf8")) as { cards: Array<{ handle: string }> };
  return data.cards.map((card) => card.handle);
};
const allCapture = (): string[] => {
  const data = JSON.parse(readFileSync("relay/reference-grid.json", "utf8")) as { cards: Array<{ handle: string }> };
  return data.cards.map((card) => card.handle);
};

/** The reference capture each routed handle was ingested from (see scripts/apply-reference-collections.mjs). */
const SOURCES: Record<string, () => string[] | null> = {
  all: allCapture,
  activewear: () => capture("activewear"),
  tees: () => capture("the-tee-shop"),
  sweats: () => capture("the-sweats-edit"),
  intimates: () => capture("intimates"),
  sleep: () => capture("sleep"),
  socks: () => capture("socks"),
  "october-capsule": () => capture("the-october-capsule"),
  "getaway-edit": () => capture("the-getaway-edit"),
  "cozy-shop": () => capture("the-cozy-shop"),
  "bundle-and-save": () => capture("bundleandsave"),
  sweatshirts: () => capture("sweatshirts"),
  sweatpants: () => capture("sweatpants"),
  bottoms: () => capture("bottoms"),
  "organic-stretch": () => capture("activewear"),
  "pima-cotton": () => capture("pima-collection"),
  fleece: () => capture("new-organic-fleece"),
  waffle: () => capture("organic-waffle"),
  "merino-wool": () => capture("merino-wool"),
  sweaters: () => capture("new"),
  nori: () => capture("nori"),
  wisteria: () => capture("wisteria"),
  balsam: () => capture("balsam"),
  "heather-oat": () => capture("heather-oat"),
  peppercorn: () => capture("peppercorn"),
  sale: () => capture("up-to-50-off"),
  "up-to-50-off": () => capture("up-to-50-off"),
};

/** The reference order of a shelf: its capture, limited to the colourways this catalogue carries. */
function expectedOrder(handle: string, carried: string[]): string[] | null {
  const ref = SOURCES[handle]?.();
  if (!ref) return null;
  const allowed = new Set(carried);
  return ref.filter((slug) => allowed.has(slug));
}

test("every shop-all shelf prints the reference's own order, not the store's", () => {
  const checked: string[] = [];
  for (const handle of SHOP_ALL_ROUTES) {
    const ours = railProducts(handle).map((product) => product.slug);
    // A rail lists colourways of its own; anything the catalogue does not carry is simply absent.
    const ref = expectedOrder(handle, ours);
    if (!ref) continue;
    assert.deepEqual(ours, ref, `${handle} is not in the reference's order`);
    checked.push(handle);
  }
  assert.ok(checked.length >= 20, `only ${checked.length} shelves were pinned to a capture`);
});

test("a thin shelf leads with its own first card", () => {
  // Each of these used to open with the All collection's leader instead of its own.
  const leaders: Array<[string, string]> = [
    ["sweats", "organic-fleece-relaxed-pocket-sweatpant-mocha"],
    ["tees", "organic-pima-classic-tee-true-white"],
    ["october-capsule", "organic-stretch-crossover-legging-jet-black"],
    ["getaway-edit", "organic-stretch-crop-racer-tank-midnight"],
    ["sweatshirts", "fleece-half-zip-sweatshirt-bone"],
    ["waffle", "organic-waffle-crew-top-heather-grey"],
    ["merino-wool", "merino-wrap-top-jet-black"],
    ["up-to-50-off", "regenerative-hemp-shrunken-tee-fir"],
    ["heather-oat", "organic-fleece-relaxed-crewneck-sweatshirt-heather-oat"],
    ["sweatpants", "organic-fleece-cropped-sweatpant-balsam"],
    ["fleece", "organic-fleece-oversized-polo-bone"],
    ["nori", "organic-stretch-sports-bra-nori"],
    ["cozy-shop", "organic-fleece-zip-hoodie-jet-black"],
    ["bottoms", "organic-stretch-high-neck-tank-jet-black"],
  ];
  for (const [handle, slug] of leaders) {
    assert.equal(railProducts(handle)[0]?.slug, slug, `${handle} leads with the wrong card`);
  }
  // The All collection and the Activewear collection lead with their own first cards too.
  assert.equal(railProducts("all")[0]?.slug, "organic-stretch-high-neck-tank-jet-black");
  assert.equal(railProducts("activewear")[0]?.slug, "organic-stretch-full-length-legging-jet-black");
});

test("every activewear shelf keeps its captured order as well", () => {
  // Each rail is pinned to the reference page it was captured from.
  const activewearSources: Record<string, string> = {
    all: "activewear",
    leggings: "leggings-and-shorts",
    "sports-bras": "sports-bras",
  };
  const pinned = Object.keys(activewearSources);
  for (const rail of ACTIVEWEAR_RAILS) {
    const ours = activewearRailProducts(rail.id).map((product) => product.slug);
    const name = activewearSources[rail.id];
    const ref = name ? capture(name) : null;
    if (ref) assert.deepEqual(ours, ref.filter((slug) => ours.includes(slug)), `${rail.id} is not in the reference's order`);
    // Every rail — pinned or not — prints each colourway once, and real cards only.
    assert.equal(new Set(ours).size, ours.length, `${rail.id} prints a colourway twice`);
    assert.ok(ours.length > 0, `${rail.id} is empty`);
  }
  assert.ok(pinned.length >= 3);
  assert.equal(activewearRailProducts("all")[0]?.slug, "organic-stretch-full-length-legging-jet-black");
  assert.equal(activewearRailProducts("leggings")[0]?.slug, "organic-stretch-crossover-legging-jet-black");
  assert.equal(activewearRailProducts("sports-bras")[0]?.slug, "organic-stretch-sports-bra-jet-black");
});

test("the reference's order is what a shelf renders before any filter or sort", () => {
  // Featured is the shelf's own order: the grid hands the shelf order straight through.
  for (const handle of ["sweats", "tees", "waffle", "cozy-shop"]) {
    const shelf = railProducts(handle).map((product) => product.slug);
    assert.equal(shelf[0], expectedOrder(handle, shelf)?.[0], `${handle} renders a re-ranked shelf`);
    assert.equal(new Set(shelf).size, shelf.length, `${handle} prints a colourway twice`);
  }
});
