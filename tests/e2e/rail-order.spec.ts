import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

/**
 * The reference prints a collection's own first card first. These routes used to open with the All
 * collection's leader, so each is pinned here to the first cards of its own capture.
 */
const CASES: Array<{ handle: string; capture: string; leader: string }> = [
  { handle: "sweats", capture: "the-sweats-edit", leader: "organic-fleece-relaxed-pocket-sweatpant-mocha" },
  { handle: "tees", capture: "the-tee-shop", leader: "organic-pima-classic-tee-true-white" },
  { handle: "october-capsule", capture: "the-october-capsule", leader: "organic-stretch-crossover-legging-jet-black" },
  { handle: "getaway-edit", capture: "the-getaway-edit", leader: "organic-stretch-crop-racer-tank-midnight" },
  { handle: "sweatshirts", capture: "sweatshirts", leader: "fleece-half-zip-sweatshirt-bone" },
  { handle: "waffle", capture: "organic-waffle", leader: "organic-waffle-crew-top-heather-grey" },
  { handle: "up-to-50-off", capture: "up-to-50-off", leader: "regenerative-hemp-shrunken-tee-fir" },
  { handle: "cozy-shop", capture: "the-cozy-shop", leader: "organic-fleece-zip-hoodie-jet-black" },
];

const captureOrder = (name: string): string[] => {
  const path = `relay/reference-grid-${name}.json`;
  if (!existsSync(path)) return [];
  const data = JSON.parse(readFileSync(path, "utf8")) as { cards: Array<{ handle: string }> };
  return data.cards.map((card) => card.handle);
};

const slugs = (page: import("@playwright/test").Page) =>
  page.$$eval("[data-product-slug]", (nodes) => {
    const seen = new Set<string>();
    return nodes
      .map((node) => node.getAttribute("data-product-slug") ?? "")
      .filter((slug) => slug && !seen.has(slug) && (seen.add(slug), true));
  });

for (const { handle, capture, leader } of CASES) {
  test(`${handle} prints its own reference order`, async ({ page }) => {
    await page.goto(`/en/collections/${handle}`);
    await expect(page.locator(`[data-product-slug="${leader}"]`).first()).toBeVisible();
    const rendered = await slugs(page);
    expect(rendered[0]).toBe(leader);
    // The whole first page follows the capture, colourway for colourway.
    const ref = captureOrder(capture).filter((slug) => rendered.includes(slug));
    expect(rendered.slice(0, ref.length)).toEqual(ref);
  });
}
