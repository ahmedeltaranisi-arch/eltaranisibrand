import { test, expect } from "@playwright/test";

/** No zoom means no scale: translation from a load reveal is still allowed. */
async function expectNoZoom(locator: import("@playwright/test").Locator) {
  const scale = await locator.evaluate(e => {
    const t = getComputedStyle(e).transform;
    if (t === "none") return 1;
    const values = t.match(/matrix\(([^)]+)\)/);
    if (!values) return 1;
    const [a, b, c, d] = values[1].split(",").map(Number);
    if (a !== d) throw new Error("non-uniform scale " + t);
    if (Math.abs(b) > 0.001 || Math.abs(c) > 0.001) throw new Error("rotation or skew " + t);
    return a;
  });
  if (Math.abs(scale - 1) > 0.001) throw new Error("zoomed by " + scale);
}

test("Activewear editorial automatically plays muted inline and stays pausable", async ({ page }) => {
  await page.goto("/en/collections/activewear");
  const video = page.locator(".na-aw-editorial-video-el");
  await video.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute("autoplay", "");
  expect(await video.evaluate(e => (e as HTMLVideoElement).muted)).toBe(true);
  await expect.poll(() => video.evaluate(e => !(e as HTMLVideoElement).paused), { timeout: 20000 }).toBe(true);
  await expect.poll(() => video.evaluate(e => (e as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(0);
  await page.locator(".na-aw-editorial-toggle").click();
  await expect.poll(() => video.evaluate(e => (e as HTMLVideoElement).paused)).toBe(true);
});

test("every collection and home card cross-fades to another pose without zooming or cropping", async ({ page }) => {
  for (const url of ["/en", "/en/collections/new-arrivals", "/en/collections/best-sellers", "/en/collections/activewear", "/en/collections/intimates"]) {
    await page.goto(url);
    const media = page.locator(".product-reveal-card").first().locator("a").first();
    await media.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const images = media.locator("img");
    expect(await images.nth(0).getAttribute("src")).not.toBe(await images.nth(1).getAttribute("src"));
    for (const img of await images.all()) { await expect(img).toHaveCSS("object-fit", "contain"); await expectNoZoom(img); }
    await expect(images.nth(1)).toHaveCSS("opacity", "0");
    await media.hover();
    await expect(images.nth(1)).toHaveCSS("opacity", "1");
    for (const img of await images.all()) await expectNoZoom(img);
    await page.mouse.move(0, 0);
    await media.focus();
    await expect(images.nth(1)).toHaveCSS("opacity", "1");
    for (const img of await images.all()) { await expect(img).toHaveCSS("object-fit", "contain"); await expectNoZoom(img); }
  }
});

test("product pages swap full poses on hover and focus instead of zooming", async ({ page }) => {
  await page.goto("/en/collections/intimates");
  const href = await page.locator(".product-reveal-card").first().locator("a").first().getAttribute("href");
  await page.goto(href!);
  const frame = page.locator('[class*="cursor-zoom-in"] img').first();
  const first = await frame.getAttribute("src");
  await frame.hover();
  await expect.poll(() => frame.getAttribute("src")).not.toBe(first);
  for (const img of await page.locator('[class*="cursor-zoom-in"] img').all()) await expectNoZoom(img);
});
