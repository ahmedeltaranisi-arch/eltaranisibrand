import { test, expect } from "@playwright/test";

const destinations = [
  ["New", "/en/collections/new-arrivals"],
  ["Best Sellers", "/en/collections/best-sellers"],
  ["Activewear", "/en/collections/activewear"],
  ["Clothing", "/en/collections/all"],
  ["Intimates", "/en/collections/intimates"],
  ["About", "/en/pages/about"],
] as const;

test("all six destinations share Eltaranisi branding and a current-page dot, not an underline", async ({ page }) => {
  for (const [label, url] of destinations) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator('[data-site-header="eltaranisi"]');
    await expect(header).toHaveCount(1);
    await expect(header.locator(".na-header-logo")).toContainText("Eltaranisi");
    await expect(header.locator(".na-header-logo")).toContainText("Brand");
    await expect(header.locator(".na-header-logo img")).toHaveCount(0);
    await expect(header.locator(".na-header-nav li")).toHaveCount(6);
    await expect(header.locator('.na-header-nav a[aria-current="page"]')).toHaveCount(1);
    const current = header.getByRole("link", { name: label, exact: true });
    await expect(current).toHaveAttribute("aria-current", "page");
    const style = await current.evaluate(e => ({ line: getComputedStyle(e).textDecorationLine, width: getComputedStyle(e, "::after").width, height: getComputedStyle(e, "::after").height, opacity: getComputedStyle(e, "::after").opacity }));
    expect(style).toEqual({ line: "none", width: "5px", height: "5px", opacity: "1" });
    expect((await header.boundingBox())?.height).toBe(95);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1347);
  }
});

test("header navigation switches the dot to the destination and stays mounted once", async ({ page }) => {
  await page.goto("/en");
  const nav = page.locator(".na-header-nav");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);
  await nav.getByRole("link", { name: "Best Sellers", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/collections\/best-sellers$/);
  await expect(nav.getByRole("link", { name: "Best Sellers", exact: true })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "New", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/collections\/new-arrivals$/);
  await expect(nav.getByRole("link", { name: "New", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[data-site-header="eltaranisi"]')).toHaveCount(1);
});

test("product action reveal and slate hover colors match on arrival, legacy collection and home cards", async ({ page }) => {
  for (const url of ["/en/collections/new-arrivals", "/en/collections/best-sellers", "/en"]) {
    await page.goto(url);
    const card = page.locator(".product-reveal-card").first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const button = card.locator(".product-reveal-action");
    await expect(button).toHaveCSS("opacity", "0");
    await card.locator("a").first().hover();
    await expect(button).toHaveCSS("opacity", "1");
    await button.hover();
    await expect(button).toHaveCSS("background-color", "rgb(109, 122, 130)");
    await expect(button).toHaveCSS("color", "rgb(249, 248, 242)");
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS("opacity", "0");
  }
});

test("mobile shared navigation retains the brand, all destinations and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ["/en", "/en/collections/best-sellers", "/en/collections/new-arrivals"]) {
    await page.goto(url);
    const header = page.locator('[data-site-header="eltaranisi"]');
    await expect(header.locator(".na-header-logo")).toContainText("Eltaranisi");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await header.locator(".na-menu-toggle").click();
    const menu = page.locator(".na-mobile-menu");
    await expect(menu).toBeVisible();
    await expect(menu.locator("nav a")).toHaveCount(6);
    await expect(menu.locator(".na-header-logo")).toContainText("Eltaranisi");
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
  }
});
