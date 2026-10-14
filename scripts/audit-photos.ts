import { readFileSync } from "node:fs";
import { activewearProducts } from "../src/lib/activewearCatalog";
import { arrivalCatalog } from "../src/lib/mateNewArrivals";
import { shopAllProducts } from "../src/lib/shopAll";
import { frameRank, isProductOnly, isWholePose } from "../src/lib/photoSelection";

const P = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8")) as Record<string, [number, number]>;
const all = [...activewearProducts, ...arrivalCatalog, ...shopAllProducts];
let total = 0, stand = 0, waist = 0, kept = 0;
const violations: string[] = [];
for (const p of all) for (const i of p.images) {
  total++;
  const rank = frameRank(i);
  if (rank === 0) stand++; else if (rank === 1) waist++; else {
    kept++;
    if (!isProductOnly(p.category)) violations.push(`${p.slug} (${p.category}) ${i}`);
  }
  if (isWholePose(i, p.category) === false) violations.push(`not-whole ${p.slug} ${i}`);
}
console.log("frames shown storefront-wide:", total, "| standing:", stand, "| waist-up:", waist, "| product stills kept:", kept);
console.log("violations (a crop on a modelled product):", violations.length, violations.slice(0, 5));
