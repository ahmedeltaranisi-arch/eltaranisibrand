import { test, expect } from "@playwright/test";

test.use({ colorScheme: "light" });

test("floating night/day toggle recolors surfaces but preserves product photography", async ({ page }) => {
  await page.goto("/en/collections/new-arrivals");
  const toggle = page.locator("[data-theme-toggle]");
  await expect(toggle).toBeVisible();
  await expect(toggle).toContainText("Night");
  const image = page.locator(".na-product-media img").first();
  const before = await image.getAttribute("src");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toContainText("Day");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(16, 27, 27)");
  await expect(page.locator(".na-header-wrap")).toHaveCSS("background-color", "rgb(16, 27, 27)");
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveAttribute("src", before!);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("navbar language toggle retains page, sorting, pagination and saved appearance", async ({ page }) => {
  await page.goto("/en/collections/new-arrivals?sort_by=price-ascending&page=2");
  await page.locator("[data-theme-toggle]").click();
  await page.locator('[data-locale-toggle="header"]').click();
  await expect(page).toHaveURL(/\/ar\/collections\/new-arrivals\?sort_by=price-ascending&page=2/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("[data-theme-toggle]")).toContainText("نهاري");
  await page.locator('[data-locale-toggle="header"]').click();
  await expect(page).toHaveURL(/\/en\/collections\/new-arrivals\?sort_by=price-ascending&page=2/);
});

test("theme defaults to system preference and a manual override wins", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-theme-toggle]").click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("controls fit small mobile screens and the floating button stays physically right in both languages", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const locale of ["en", "ar"]) {
      await page.goto(`/${locale}/collections/new-arrivals`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const toggle = page.locator("[data-theme-toggle]");
      const box = await toggle.boundingBox();
      expect(box).toBeTruthy();
      expect(width - box!.x - box!.width).toBeGreaterThanOrEqual(13);
      expect(width - box!.x - box!.width).toBeLessThanOrEqual(20);
      await expect(page.locator('[data-locale-toggle="header"]')).toBeVisible();
    }
  }
});
