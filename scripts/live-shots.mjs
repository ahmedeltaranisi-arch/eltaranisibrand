/**
 * Temporary helper: photograph the deployed Activewear page from a runner.
 * The author's sandbox has no public internet, so the screenshots are taken here
 * and committed to `relay/shots/` for review.
 *
 *   node scripts/live-shots.mjs
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.LIVE_BASE ?? "https://eltaranisibrand.vercel.app";
const OUT = "relay/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const notes = [];

async function shoot(page, name, clip) {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...(clip ? { clip } : {}) });
  notes.push(`${name}: ${page.url()}${clip ? ` clip=${JSON.stringify(clip)}` : ""}`);
}

/* ---------------------------------------------------------------- desktop */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("console", (m) => {
  if (m.type() === "error") notes.push(`CONSOLE ${page.url()} :: ${m.text().slice(0, 140)}`);
});

await page.goto(`${BASE}/en/collections/activewear`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await shoot(page, "01-hero-rails");

await page.locator(".na-aw-editorial-video").scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await shoot(page, "02-grid-video-editorial");

await page.locator(".na-aw-editorial-split").scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await shoot(page, "03-split-editorial");

// card interactions: swatch swap + hover pose
const card = page.locator("article.na-product-card").nth(1);
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const box = await card.boundingBox();
await card.locator("button.na-swatch").nth(2).hover();
await page.waitForTimeout(700);
await shoot(page, "04-card-colour-swap", { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: 560 });

const link = page.locator("article.na-product-card").nth(1).locator("a.na-product-media");
await link.hover();
await page.waitForTimeout(800);
await shoot(page, "05-card-hover-pose", { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: 560 });

// quick add
await card.locator("button.na-product-add").first().click();
await page.waitForTimeout(1500);
await shoot(page, "06-quick-add");
await page.keyboard.press("Escape");
await page.waitForTimeout(600);

// filter drawer
await page.locator("button.na-all-filters").click();
await page.waitForTimeout(900);
await page.locator(".na-filter-group").nth(1).locator("> button").click();
await page.locator(".na-filter-group").nth(2).locator("> button").click();
await page.locator(".na-filter-group").nth(3).locator("> button").click();
await page.waitForTimeout(900);
await shoot(page, "07-filters-open");
await page.locator(".na-filter-group").nth(3).locator("label.na-filter-value", { hasText: "Black" }).first().click();
await page.waitForTimeout(500);
await shoot(page, "08-filters-selected");
await page.locator(".na-filter-apply").click();
await page.waitForTimeout(1600);
await shoot(page, "09-filtered-grid");

// sort popup from the toolbar
await page.locator("button.na-sort-trigger").click();
await page.waitForTimeout(1000);
await shoot(page, "10-sort-popup");
await page.locator(".na-sort-options label", { hasText: "Price, high to low" }).first().click();
await page.locator(".na-filter-apply").click();
await page.waitForTimeout(1800);
await shoot(page, "11-sorted-grid");

// mega menu
await page.goto(`${BASE}/en/collections/activewear`, { waitUntil: "load" });
await page.waitForTimeout(1500);
await page.locator(".na-header-mega > a").hover();
await page.waitForTimeout(1200);
await shoot(page, "12-mega-menu");

// second page + a child collection + a dye page + arabic
await page.goto(`${BASE}/en/collections/activewear?page=2`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await shoot(page, "13-page-two");

await page.goto(`${BASE}/en/collections/fig`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await shoot(page, "14-fig-dye-page");

await page.goto(`${BASE}/ar/collections/activewear`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await shoot(page, "15-arabic");

/* ----------------------------------------------------------------- mobile */
const small = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await small.goto(`${BASE}/en/collections/activewear`, { waitUntil: "load" });
await small.waitForTimeout(2500);
await shoot(small, "16-mobile-hero");
await small.locator(".na-aw-editorial-video").scrollIntoViewIfNeeded();
await small.waitForTimeout(1200);
await shoot(small, "17-mobile-grid");
await small.locator("button.na-all-filters").click();
await small.waitForTimeout(1000);
await shoot(small, "18-mobile-filters");

/* ------------------------------------------------------------------ report */
const failures = await page.evaluate(async () => {
  const urls = [
    ...new Set(
      Array.from(document.querySelectorAll("img"))
        .map((img) => img.currentSrc || img.src)
        .filter((src) => src.includes("/img/")),
    ),
  ].slice(0, 200);
  const bad = [];
  await Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const probe = new Image();
          probe.onload = () => {
            if (!probe.naturalWidth) bad.push(src);
            resolve();
          };
          probe.onerror = () => {
            bad.push(src);
            resolve();
          };
          probe.src = src;
        }),
    ),
  );
  return { checked: urls.length, bad };
});
notes.push(`images checked on the last page: ${failures.checked}, broken: ${failures.bad.length}`);
for (const url of failures.bad.slice(0, 10)) notes.push(`  broken ${url}`);

await browser.close();
console.log(notes.join("\n"));
