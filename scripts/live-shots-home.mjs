/**
 * Photographs the deployed storefront's footer, home editorial two-up and Activewear video from a
 * runner (the author's sandbox has no public internet) and writes them to `relay/shots-home/`.
 *
 *   node scripts/live-shots-home.mjs
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.LIVE_BASE ?? "https://eltaranisibrand.vercel.app";
const OUT = "relay/shots-home";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const notes = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("response", (r) => {
  if (r.status() >= 400) notes.push(`${r.status()} ${r.url().slice(0, 110)}`);
});

/* --------------------------------------------------------- home: editorial two-up */
await page.goto(`${BASE}/en`, { waitUntil: "load" });
await page.waitForTimeout(3000);
const duo = page.locator("section").filter({ hasText: "Cotton that was grown" }).first();
await duo.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await duo.screenshot({ path: `${OUT}/01-home-editorial-duo.png` });
notes.push(
  "duo images: " +
    JSON.stringify(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('img[src*="/img/shots/"]')).map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            src: el.getAttribute("src"),
            pos: getComputedStyle(el).objectPosition,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            natural: el.naturalWidth,
          };
        }),
      ),
    ),
);

/* ------------------------------------------------------------------- footer mark */
await page.goto(`${BASE}/en/collections/activewear`, { waitUntil: "load" });
await page.waitForTimeout(2500);
const footer = page.locator('[data-site-footer="eltaranisi"]');
await footer.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await footer.screenshot({ path: `${OUT}/02-footer.png` });
notes.push(
  "footer logo: " +
    JSON.stringify(
      await footer
        .locator('img[alt="ELTARANISI BRAND"]')
        .evaluate((el) => ({ natural: el.naturalWidth, w: Math.round(el.getBoundingClientRect().width) })),
    ),
);

/* ------------------------------------------------------------- editorial video */
const article = page.locator(".na-aw-editorial-video").first();
await article.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
const box = await article.boundingBox();
const clip = { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: Math.min(box.height + 12, 620) };
await page.screenshot({ path: `${OUT}/03-video-paused.png`, clip });
const video = page.locator(".na-aw-editorial-video-el");
notes.push("video controls=" + (await video.evaluate((el) => el.controls)));
await page.mouse.click(box.x + box.width / 2, box.y + 200);
await page.waitForTimeout(2000);
notes.push("after click paused=" + (await video.evaluate((el) => el.paused)));
await page.screenshot({ path: `${OUT}/04-video-playing.png`, clip });
notes.push("toggle label=" + (await page.locator(".na-aw-editorial-toggle").getAttribute("aria-label")));

/* --------------------------------------------------------------- mobile two-up */
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(`${BASE}/en`, { waitUntil: "load" });
await mobile.waitForTimeout(3000);
const mobileDuo = mobile.locator("section").filter({ hasText: "Cotton that was grown" }).first();
await mobileDuo.scrollIntoViewIfNeeded();
await mobile.waitForTimeout(1500);
await mobileDuo.screenshot({ path: `${OUT}/05-home-editorial-mobile.png` });

console.log(notes.join("\n"));
await browser.close();
