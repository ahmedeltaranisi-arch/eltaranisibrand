/**
 * Every routed shelf on a running storefront, in the reference's own order.
 *
 *   node verification/tools/rail-order.mjs                       # http://127.0.0.1:3000
 *   node verification/tools/rail-order.mjs https://host          # any base URL
 *
 * Compares each collection page (every paginated page, in order) against the capture it was built
 * from: `relay/reference-grid-<name>.json`, with the All collection in `relay/reference-grid.json`.
 * Exits 1 and names the first divergent card whenever a shelf is not in the reference's order.
 */
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const SLUG = /data-product-slug="([^"]+)"/g;

/** Routed handles and the capture each one comes from (mirrors scripts/apply-reference-collections.mjs). */
const SOURCES = {
  all: "all",
  balsam: "balsam",
  bottoms: "bottoms",
  "bundle-and-save": "bundleandsave",
  "cozy-shop": "the-cozy-shop",
  fleece: "new-organic-fleece",
  "getaway-edit": "the-getaway-edit",
  "heather-oat": "heather-oat",
  intimates: "intimates",
  "merino-wool": "merino-wool",
  nori: "nori",
  "october-capsule": "the-october-capsule",
  "organic-stretch": "activewear",
  peppercorn: "peppercorn",
  "pima-cotton": "pima-collection",
  sleep: "sleep",
  socks: "socks",
  sweaters: "new",
  sweatpants: "sweatpants",
  sweats: "the-sweats-edit",
  sweatshirts: "sweatshirts",
  tees: "the-tee-shop",
  "up-to-50-off": "up-to-50-off",
  waffle: "organic-waffle",
  wisteria: "wisteria",
};
/** Collection pages whose leader must be their own first card, never the store's. */
const LEADERS = {
  sweats: "organic-fleece-relaxed-pocket-sweatpant-mocha",
  tees: "organic-pima-classic-tee-true-white",
  "october-capsule": "organic-stretch-crossover-legging-jet-black",
  "getaway-edit": "organic-stretch-crop-racer-tank-midnight",
  sweatshirts: "fleece-half-zip-sweatshirt-bone",
  "organic-stretch": "organic-stretch-full-length-legging-jet-black",
};

const capture = (name) => {
  const path = name === "all" ? "relay/reference-grid.json" : `relay/reference-grid-${name}.json`;
  return JSON.parse(readFileSync(path, "utf8")).cards.map((card) => card.handle);
};

const read = async (url) => {
  const response = await fetch(url, { headers: { "user-agent": "eltaranisi-rail-order/1.0" } });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.text();
};

const rendered = async (handle) => {
  const out = [];
  for (let page = 1; page <= 14; page += 1) {
    const html = await read(`${BASE}/en/collections/${handle}?page=${page}`);
    const found = [...new Set([...html.matchAll(SLUG)].map((match) => match[1]))];
    if (found.length === 0) break;
    out.push(...found);
  }
  return out;
};

let failures = 0;
for (const [handle, name] of Object.entries(SOURCES)) {
  const ref = capture(name);
  const our = await rendered(handle);
  const wanted = ref.filter((slug) => our.includes(slug));
  const at = our.findIndex((slug, index) => slug !== wanted[index]);
  if (at !== -1 || our.length !== wanted.length) {
    const index = at === -1 ? Math.min(our.length, wanted.length) : at;
    failures += 1;
    console.log(`${handle}: NOT IN REFERENCE ORDER — card #${index + 1} is ${our[index]}, reference prints ${wanted[index]} (ours ${our.length} / reference ${wanted.length})`);
    continue;
  }
  const leader = LEADERS[handle];
  const leaderAt = leader ? our.indexOf(leader) : 0;
  console.log(`${handle}: ${our.length} cards in the reference's order${leader ? `, leader #${leaderAt + 1}` : ""}`);
  if (leader && leaderAt !== 0) failures += 1;
}
console.log(failures === 0 ? `\nall ${Object.keys(SOURCES).length} shelves in the reference's order` : `\n${failures} shelf check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
