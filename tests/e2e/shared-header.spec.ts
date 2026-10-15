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
    // The reference fades the action in place — no translate, so the card's lower half never moves.
    await expect(button).toHaveCSS("transform", "none");
    await card.locator("a").first().hover();
    await expect(button).toHaveCSS("opacity", "1");
    await expect(button).toHaveCSS("transform", "none");
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

test("the dot marks only the label of the page you are standing on", async ({ page }) => {
  // A mega panel lists a dozen shelves; that does not make its parent label current. Best Sellers
  // carries the dot there and Clothing carries none — not at rest, and not while the pointer is on
  // the label: the dot is a location marker, so a label being hovered is not the page you are
  // standing on, and for a panel that opens on hover the panel itself is the affordance.
  const topLevel = (label: string) => page
    .locator(".na-header-nav > ul > li > a, .na-header-nav > ul > li > div > a")
    .filter({ hasText: new RegExp(`^${label}$`) }).first();
  const dot = (label: string) => topLevel(label).evaluate((node) => getComputedStyle(node, "::after").opacity);
  const litLabels = () => page.evaluate(() => [...document.querySelectorAll(".na-header-nav > ul > li a")]
    .filter((node) => getComputedStyle(node, "::after").opacity === "1")
    .map((node) => (node.textContent ?? "").trim()));

  await page.goto("/en/collections/best-sellers");
  await expect(page.locator('.na-header-nav a[aria-current="page"]')).toHaveCount(1);
  expect(await dot("Best Sellers")).toBe("1");
  expect(await dot("Clothing")).toBe("0");
  expect(await dot("Activewear")).toBe("0");
  const box = (await topLevel("Clothing").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator(".na-header-mega.is-open")).toHaveCount(1);
  expect(await dot("Clothing")).toBe("0");
  expect(await dot("Best Sellers")).toBe("1");
  // Every other label stays dark under the pointer too, and an open panel lights nothing else.
  for (const label of ["New", "Intimates", "About"]) {
    const spot = (await topLevel(label).boundingBox())!;
    await page.mouse.move(spot.x + spot.width / 2, spot.y + spot.height / 2);
    expect(await litLabels(), `hovering ${label}`).toEqual(["Best Sellers"]);
  }
  await page.mouse.move(2, 700);
  expect(await litLabels()).toEqual(["Best Sellers"]);

  // And the dot does appear where it belongs: Clothing is the current label on /collections/all,
  // while a mega parent stays dark on a page that merely lives inside its panel.
  await page.goto("/en/collections/all");
  expect(await dot("Clothing")).toBe("1");
  await page.goto("/en/collections/tees");
  expect(await dot("Clothing")).toBe("0");
  expect(await page.locator('.na-header-nav a[aria-current="page"]').count()).toBe(0);
  await page.goto("/en/collections/activewear");
  expect(await dot("Activewear")).toBe("1");
  expect(await dot("Clothing")).toBe("0");
  // A keyboard focus ring is fine; the marker never follows focus either.
  await page.goto("/en/collections/best-sellers");
  await topLevel("Clothing").focus();
  expect(await dot("Clothing")).toBe("0");
  expect(await dot("Best Sellers")).toBe("1");
});
