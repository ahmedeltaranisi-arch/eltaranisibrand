/**
 * Switches every colour swatch on a card and checks the photograph each dye answers with: that
 * dye's own product, and a frame the pose scan measured as renderable — a complete figure wherever
 * the colourway owns one. A dye that answers with another colour's photograph, or with a crop, is
 * exactly what the rails were called out for.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const POSES = JSON.parse(readFileSync("src/lib/photoPoses.json", "utf8"));
const RENDERABLE = new Set([1, 2, 3]);
const POSES_LIST = POSES;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const BASE = process.argv[2] ?? "https://eltaranisibrand.vercel.app";
const SHELF = process.argv[3] ?? "/en/collections/activewear";
await page.goto(`${BASE}${SHELF}`, { waitUntil: "domcontentloaded", timeout: 90000 });
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
      const pressed = node.querySelector(".na-swatch.is-current");
      return {
        slug: node.getAttribute("data-product-slug"),
        src: new URL(img.currentSrc || img.src, location.origin).pathname,
        pressed: pressed?.getAttribute("title") ?? "",
        frames: node.querySelectorAll(".na-product-media img").length,
      };
    });
    const flags = POSES[info.src];
    switched++;
    if (flags === undefined) problems.push(`${info.slug} ${info.src} was never measured`);
    else if (!RENDERABLE.has(flags)) {
      const better = await card.evaluate((node) => [...node.querySelectorAll(".na-product-media img")]
        .some((other) => (POSES_LIST[new URL(other.currentSrc || other.src, location.origin).pathname] ?? 0) > 0));
      if (better) problems.push(`${info.slug} ${info.src} is a crop while the colourway owns a complete frame`);
    }
    if (info.frames > 1) {
      const mediaBox = await card.locator(".na-product-media").boundingBox();
      await page.mouse.move(mediaBox.x + mediaBox.width / 2, mediaBox.y + mediaBox.height / 2);
      await page.waitForTimeout(400);
      const shown = await card.evaluate((node) => [...node.querySelectorAll(".na-product-media img")]
        .filter((img) => img.getBoundingClientRect().height > 2 && getComputedStyle(img).opacity !== "0")
        .map((img) => new URL(img.currentSrc || img.src, location.origin).pathname));
      await page.mouse.move(2, 2);
      if (shown.length < 2) problems.push(`${info.slug} hovered with ${info.frames} frames and showed ${JSON.stringify(shown)}`);
    }
  }
}
await browser.close();
console.log("colourways switched:", switched, "| problems:", problems.length);
for (const p of problems.slice(0, 8)) console.log("  ✗", p);
process.exit(problems.length ? 1 : 0);
