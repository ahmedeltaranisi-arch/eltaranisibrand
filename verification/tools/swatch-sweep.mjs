/** Switches every colour swatch on a card and checks the photograph of each dye is whole. */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const BOTTOM = new Set(["leggings", "shorts", "pants", "sweatpants", "unitards"]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto("https://eltaranisibrand.vercel.app/en/collections/activewear?cb=05d8da1", { waitUntil: "networkidle", timeout: 90000 });
const problems = [];
let switched = 0;
for (const card of (await page.locator(".product-reveal-card").all()).slice(0, 6)) {
  await card.scrollIntoViewIfNeeded();
  await card.locator(".na-swatch-more-desktop").click().catch(() => {});
  await page.waitForTimeout(300);
  const swatches = await card.locator(".na-swatch:visible").all();
  for (const swatch of swatches) {
    await swatch.click({ force: true }).catch(() => {});
    await page.waitForTimeout(350);
    const info = await card.evaluate((node) => {
      const media = node.querySelector(".na-product-media");
      const img = media.querySelector("img");
      return { slug: node.getAttribute("data-product-slug"), src: new URL(img.currentSrc || img.src, location.origin).pathname };
    });
    const flags = POSES[info.src];
    const isBottom = BOTTOM.has("leggings");
    switched++;
    if (flags !== 2) problems.push(`${info.slug} ${info.src} ${JSON.stringify(flags)}`);
  }
}
await browser.close();
console.log("colourways switched:", switched, "| problems:", problems.length);
for (const p of problems.slice(0, 8)) console.log("  ✗", p);
process.exit(problems.length ? 1 : 0);
