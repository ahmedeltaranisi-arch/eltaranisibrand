import { test, expect, type Locator } from "@playwright/test";
import {
  BEST_SELLER_TABS, SIZE_FACETS, bestSellerFacetCounts, mateBestSellers,
  sortBestSellers, tabProducts, type BestSellerTabId,
} from "../../src/lib/mateBestSellers";
import { COLOR_GROUPS, PAGE_SIZE } from "../../src/lib/mateNewArrivals";

const PATH = "/en/collections/best-sellers";
const cards = ".na-product-grid > .na-product-card";
const rails = ".na-collection-nav-link";
const tab = (id: BestSellerTabId) => BEST_SELLER_TABS.find((entry) => entry.id === id)!;
// Tiles carry the reference's descriptive alt text, so the accessible name ends with the label.
const railLink = (page: import("@playwright/test").Page, label: string) =>
  page.locator(".na-collection-nav-link").filter({ hasText: new RegExp(`^\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\s*$`) });
// Click the actual visible label: the inputs themselves are visually hidden by design.
async function choose(input: Locator) { await input.locator("..").click(); await expect(input).toBeChecked(); }
async function unchoose(input: Locator) { await input.locator("..").click(); await expect(input).not.toBeChecked(); }

test.beforeEach(async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator(cards)).toHaveCount(PAGE_SIZE);
  await expect(page.getByRole("heading", { name: "Best Sellers", exact: true })).toBeVisible();
});

test("text hero, six rails and the grid share the reference geometry", async ({ page }) => {
  await expect(page.getByText("Luxurious textures, clean silhouettes, positive impact.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "All Filters +", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sort by: Featured", exact: true })).toBeVisible();

  await expect(page.locator(".na-collection-nav")).toHaveAttribute("aria-label", "Shop collection categories");
  await expect(page.locator(".na-collection-nav-item")).toHaveCount(BEST_SELLER_TABS.length);
  for (const entry of BEST_SELLER_TABS) {
    const link = railLink(page, entry.fallback);
    await expect(link).toHaveAttribute("href", entry.id === "all" ? "/en/collections/best-sellers" : new RegExp(`\\?tab=${entry.id}$`));
    await expect(link.locator("img")).toHaveAttribute("src", entry.image);
    await expect(link.locator("img")).toHaveAttribute("alt", /.{40,}/);
  }
  await expect(railLink(page, "All Best Sellers")).toHaveAttribute("aria-current", "page");

  // Tile metrics measured off the reference stylesheet: 218x281 with a cover crop.
  const media = page.locator(".na-collection-nav-media").first();
  const box = await media.boundingBox();
  expect(Math.round(box!.width)).toBe(218);
  expect(Math.round(box!.height)).toBe(281);
  expect(await media.locator("img").evaluate((el) => getComputedStyle(el).objectFit)).toBe("cover");
  await expect(page.locator(".na-collection-nav-label-text").first()).toHaveCSS("font-size", "18px");
  expect(await page.locator(rails).nth(1).locator(".na-collection-nav-label-text")
    .evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).textDecorationStyle, getComputedStyle(el).opacity]))
    .toEqual(["underline", "dotted", "0.6"]);
  expect(await page.locator(rails).first().locator(".na-collection-nav-label-text")
    .evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).opacity]))
    .toEqual(["none", "1"]);

  const geometry = await page.locator(".na-product-grid").boundingBox();
  expect(geometry?.x).toBe(36);
  expect(geometry?.width).toBe(1275);
  expect(await page.locator(".na-collection-intro h1").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Edict Display");
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(mateBestSellers.length));

  // Every card of this collection carries the rail badge, exactly once.
  await expect(page.locator(cards).first().locator(".na-product-badge")).toHaveText(["Best Seller"]);
  await expect(page.locator(".na-product-badge").filter({ hasText: "Best Seller" })).toHaveCount(PAGE_SIZE);
});

test("the mid-grid editorial spans two columns after the sixth product", async ({ page }) => {
  const editorial = page.locator(".na-bs-editorial");
  await expect(editorial).toHaveCount(1);
  expect(await page.locator(".na-product-grid > *").evaluateAll((els) => els.findIndex((el) => el.classList.contains("na-bs-editorial")))).toBe(6);
  const [width, cardWidth] = await Promise.all([
    editorial.evaluate((el) => el.getBoundingClientRect().width),
    page.locator(cards).first().evaluate((el) => el.getBoundingClientRect().width),
  ]);
  expect(width).toBeGreaterThan(cardWidth * 2 - 2);
  await expect(editorial.getByRole("heading", { name: "The October Capsule", exact: true })).toBeVisible();
  await expect(editorial.locator("img")).toHaveCount(2);
  await expect(editorial.getByRole("link", { name: "Shop Now", exact: true })).toHaveAttribute("href", `${PATH}?tab=sleep`);
  expect(await editorial.locator(".na-bs-editorial-media")
    .evaluate((el) => { const r = el.getBoundingClientRect(); return Math.round((r.width / r.height) * 100) / 100; }))
    .toBeCloseTo(678 / 431, 2);
});

test("each rail filters the grid to its own products and keeps the chosen sort", async ({ page }) => {
  for (const id of ["activewear", "tees", "sweats", "intimates", "sleep"] as BestSellerTabId[]) {
    const expected = sortBestSellers(tabProducts(id), "manual");
    await railLink(page, tab(id).fallback).click();
    await expect(page).toHaveURL(new RegExp(`[?&]tab=${id}`));
    await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(expected.length));
    const actual = await page.locator(cards).evaluateAll((els) => els.map((el) => el.getAttribute("data-default-slug")));
    expect(actual).toEqual(expected.slice(0, PAGE_SIZE).map((product) => product.slug));
    await expect(railLink(page, tab(id).fallback)).toHaveAttribute("aria-current", "page");
    await railLink(page, "All Best Sellers").click();
    await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(mateBestSellers.length));
  }

  // The chosen sort survives a rail change, and filters are scoped to the new rail.
  await page.locator(".na-sort-trigger").click();
  const dialog = page.locator(".na-filter-drawer");
  await choose(dialog.getByRole("radio", { name: "Best Selling", exact: true }));
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=best-selling/);
  await railLink(page, "Tees").click();
  await expect(page).toHaveURL(/tab=tees/);
  const expected = sortBestSellers(tabProducts("tees"), "best-selling");
  const actual = await page.locator(cards).evaluateAll((els) => els.map((el) => el.getAttribute("data-default-slug")));
  expect(actual).toEqual(expected.map((product) => product.slug));
});

test("rails are deep-linkable, carousel URLs resolve, and an empty combination offers a way back", async ({ page }) => {
  const counts = BEST_SELLER_TABS.map((entry) => tabProducts(entry.id).length);
  for (const [index, entry] of BEST_SELLER_TABS.entries()) {
    await page.goto(`${PATH}?tab=${entry.id}`);
    await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(counts[index]));
  }
  await page.goto(`${PATH}?filter.p.m.custom.carousel_memberships=gid://shopify/Metaobject/286172283058`);
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(tabProducts("activewear").length));
  await expect(railLink(page, "Activewear")).toHaveAttribute("aria-current", "page");

  await page.goto(`${PATH}?tab=intimates&size=OS`);
  await expect(page.getByRole("heading", { name: "No products found.", exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(0);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(tabProducts("intimates").length);
});

test("drawer lists the eleven size rows with real counts and disables the empty ones", async ({ page }) => {
  await page.getByRole("button", { name: "All Filters +", exact: true }).click();
  const dialog = page.locator(".na-filter-drawer");
  await expect(dialog.getByRole("heading", { name: "Filters (0)", exact: true })).toBeVisible();
  expect((await dialog.boundingBox())?.width).toBe(505);
  await dialog.getByRole("button", { name: "Size", exact: true }).click();

  const rows = dialog.locator('input[name="size"]');
  await expect(rows).toHaveCount(SIZE_FACETS.length);
  expect(await rows.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))).toEqual([...SIZE_FACETS]);
  const all = bestSellerFacetCounts(mateBestSellers, { categories: [], sizes: [], colors: [] });
  for (const size of SIZE_FACETS) {
    await expect(dialog.getByText(`${size} (${all.sizes[size]})`, { exact: true })).toBeVisible();
    const input = dialog.locator(`input[name="size"][value="${size}"]`);
    if (all.sizes[size] === 0) await expect(input).toBeDisabled();
    else await expect(input).toBeEnabled();
  }
  await dialog.getByRole("button", { name: "Color Group", exact: true }).click();
  await expect(dialog.locator('input[name="color"]')).toHaveCount(COLOR_GROUPS.length);
  await expect(dialog.getByRole("checkbox", { name: "Green (23)", exact: true })).toBeEnabled();

  // Choosing a row re-counts the grid live, before the results bar is pressed.
  await choose(dialog.locator('input[name="size"][value="OS"]'));
  await expect(dialog.getByRole("heading", { name: "Filters (1)", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "See Results (1)", exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(1);
  await unchoose(dialog.locator('input[name="size"][value="OS"]'));

  // Facets combine, and the black apply bar closes the drawer.
  await dialog.getByRole("button", { name: "Category", exact: true }).click();
  await choose(dialog.getByRole("checkbox", { name: "Sweatpants (29)", exact: true }));
  await choose(dialog.locator('input[name="size"][value="XS"]'));
  const expected = tabProducts("all").filter((product) => product.category === "sweatpants" && product.availableSizes.includes("XS"));
  const apply = dialog.getByRole("button", { name: `See Results (${expected.length})`, exact: true });
  await expect(apply).toBeVisible();
  await apply.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(expected.length));
  await expect(page.getByRole("button", { name: "All Filters (2)", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/filter\.p\.t\.category=aa-1-1-1-4/);
  await expect(page).toHaveURL(/filter\.v\.option\.size=XS/);
});

test("colors a rail cannot offer are removed instead of offered empty", async ({ page }) => {
  await page.goto(`${PATH}?tab=activewear`);
  await page.locator(".na-all-filters").click();
  const dialog = page.locator(".na-filter-drawer");
  await dialog.getByRole("button", { name: "Color Group", exact: true }).click();
  const present = new Set(tabProducts("activewear").map((product) => product.color.group));
  const absent = COLOR_GROUPS.filter((group) => !present.has(group));
  expect(absent.length).toBeGreaterThan(0);
  await expect(dialog.locator('input[name="color"]')).toHaveCount(present.size);
  for (const group of absent) await expect(dialog.getByText(`${group} (0)`, { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Size", exact: true }).click();
  await expect(dialog.locator('input[name="size"][value="3X"]')).toBeDisabled();
  await expect(dialog.locator('input[name="size"][value="S/M"]')).toBeDisabled();
});

test("all four reference sort choices reorder this collection's grid", async ({ page }) => {
  await page.locator(".na-sort-trigger").click();
  const dialog = page.locator(".na-filter-drawer");
  await expect(dialog.getByRole("radio", { name: "Newest", exact: true })).toBeVisible();
  // Entering from the sort trigger lays the whole facet list out under it, exactly as the
  // walkthrough shows, so no group has to be tapped open to read its counts.
  for (const group of ["Category", "Size", "Color Group"]) {
    await expect(dialog.locator(".na-filter-group.is-open", { hasText: group })).toHaveCount(1);
  }
  await expect(dialog.locator('input[name="color"]').first()).toBeVisible();
  for (const [label, sort] of [["Newest", "created-descending"], ["Best Selling", "best-selling"], ["Price, low to high", "price-ascending"], ["Price, high to low", "price-descending"]] as const) {
    await choose(dialog.getByRole("radio", { name: label, exact: true }));
    await expect(dialog.getByRole("radio", { name: label, exact: true })).toBeChecked();
    await expect(page).toHaveURL(new RegExp(`sort_by=${sort}`));
    const expected = sortBestSellers(tabProducts("all"), sort);
    const actual = await page.locator(cards).evaluateAll((els) => els.map((el) => el.getAttribute("data-default-slug")));
    expect(actual).toEqual(expected.slice(0, PAGE_SIZE).map((product) => product.slug));
    await expect(page.getByRole("button", { name: `Sort by: ${label}`, exact: true })).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".na-sort-trigger").click();
  await expect(dialog.getByRole("radio", { name: "Price, high to low", exact: true })).toBeChecked();
});

test("hovering a swatch shows that colorway's own photograph, and the media advances the pose", async ({ page }) => {
  const card = page.locator(cards).first();
  const swatches = card.locator(".na-swatch");
  expect(await swatches.count()).toBeGreaterThan(1);
  const slugBefore = await card.getAttribute("data-product-slug");
  const srcBefore = await card.locator(".na-product-media img").first().getAttribute("src");
  await swatches.nth(1).hover();
  await expect(card).not.toHaveAttribute("data-product-slug", slugBefore!);
  await expect(card.locator(".na-product-media img").first()).not.toHaveAttribute("src", srcBefore!);
  await expect(swatches.nth(1)).toHaveClass(/is-current/);
  expect(await card.locator(".na-product-media img").first().getAttribute("src")).toMatch(/\/img\/new-arrivals\/[0-9a-f]{12}\.webp$/);

  // Hover shows the alternate pose of the same colorway; keys step through the rest.
  const media = card.locator(".na-product-media");
  const poseA = await media.locator("img").first().getAttribute("src");
  await media.hover();
  await expect(media.locator(".na-product-hover-image")).toHaveClass(/is-visible/);
  expect(await media.locator(".na-product-hover-image").getAttribute("src")).not.toBe(poseA);
  await page.locator(".na-collection-intro h1").hover();
  await expect(media.locator(".na-product-hover-image")).not.toHaveClass(/is-visible/);
  await media.focus();
  await media.press("ArrowRight");
  const poseB = await media.locator("img").first().getAttribute("src");
  expect(poseB).not.toBe(poseA);
  await expect(card.locator(".na-product-scrollbar")).toBeVisible();
});

test("pagination walks the collection and an out-of-range page clamps to the last", async ({ page }) => {
  await page.goto(`${PATH}?tab=sweats`);
  await expect(page.locator(cards)).toHaveCount(tabProducts("sweats").length);
  await expect(page.locator(".na-pagination")).toHaveCount(0);
  const ordered = sortBestSellers(mateBestSellers, "manual");
  await page.goto(`${PATH}?page=2`);
  await expect(page.locator(cards)).toHaveCount(PAGE_SIZE);
  await expect(page.locator(cards).first()).toHaveAttribute("data-default-slug", ordered[PAGE_SIZE].slug);
  await page.goto(`${PATH}?page=99`);
  await expect(page.locator(cards)).toHaveCount(mateBestSellers.length - PAGE_SIZE * 2);
  await expect(page.locator('.na-pagination button[aria-current="page"]')).toHaveText("3");
  await page.getByRole("button", { name: "Page 1", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(PAGE_SIZE);
});

test("quick add on this page adds the real selected variant to the shared bag", async ({ page }) => {
  const card = page.locator(cards).first();
  await card.hover();
  const title = (await card.locator(".na-product-title").innerText()).trim();
  await card.getByRole("button", { name: `Quick add ${title}`, exact: true }).click();
  const quick = page.locator(".na-quick-add");
  await expect(quick).toBeVisible();
  await quick.locator('button[type="submit"]').click();
  await expect(quick.getByRole("alert")).toHaveText("Please select a size.");
  await choose(quick.getByRole("radio", { name: "S", exact: true }));
  await quick.locator('button[type="submit"]').click();
  const cart = page.locator(".na-cart-drawer");
  await expect(cart).toBeVisible();
  await expect(cart.locator(".na-cart-lines > li")).toHaveCount(1);
  await cart.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("button", { name: "Shopping bag (1)", exact: true })).toBeVisible();
});

test("the reference brand never appears as copy and the footer is the home footer", async ({ page }) => {
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\bMATE\b/);
  expect(body).not.toMatch(/\bMata\b/);
  expect(body).not.toContain("Prand");
  expect(body).toContain("Eltaranisi");
  const footer = page.locator(".na-footer");
  await expect(footer).toContainText("Join the Eltaranisi Brand world.");
  await expect(footer).toContainText("© 2026 ELTARANISI BRAND");
  await page.goto("/en");
  await expect(page.locator("footer").last()).toContainText("Join the Eltaranisi Brand world.");
});

test("mobile rails scroll inside their own row without overflowing the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(await page.locator(".na-collection-nav").evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(Math.round((await page.locator(".na-collection-nav-media").first().boundingBox())!.width)).toBe(106);
  expect(await page.locator(".na-product-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(2);
  await page.locator(".na-all-filters").click();
  const dialog = page.locator(".na-filter-drawer");
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())?.width).toBe(390);
});

test("Arabic mirrors rails, counts and filters with RTL geometry", async ({ page }) => {
  await page.goto("/ar/collections/best-sellers");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "الأكثر مبيعًا", exact: true })).toBeVisible();
  await expect(page.getByText("خامات فاخرة، قصّات نظيفة، أثر إيجابي.", { exact: true })).toBeVisible();
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(mateBestSellers.length));
  await page.locator(".na-collection-nav-label-text", { hasText: "ملابس النوم" }).click();
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(tabProducts("sleep").length));
  await page.locator(".na-all-filters").click();
  const dialog = page.locator(".na-filter-drawer");
  await expect(dialog.getByRole("heading", { name: "الفلاتر (0)", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "المقاس", exact: true }).click();
  await expect(dialog.locator('input[name="size"][value="3X"]')).toBeDisabled();
  const box = await dialog.boundingBox();
  expect(Math.round(box!.x + box!.width)).toBe(page.viewportSize()!.width);
});

test("card, toolbar and drawer metrics match the reference stylesheet", async ({ page }) => {
  const grid = page.locator(".na-product-grid");
  expect(await grid.evaluate((el) => getComputedStyle(el).gap)).toBe("75px 12px");
  expect(await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(4);

  const card = page.locator(cards).first();
  const media = card.locator(".na-product-media");
  const box = await media.boundingBox();
  expect(Math.round((box!.height / box!.width) * 1000)).toBe(Math.round((431 / 333) * 1000));
  await expect(card.locator(".na-product-badge")).toHaveCSS("height", "25px");
  await expect(card.locator(".na-product-badge")).toHaveCSS("text-transform", "uppercase");
  await expect(card.locator(".na-swatch").first()).toHaveCSS("width", "39.5px");
  await expect(card.locator(".na-swatch").first()).toHaveCSS("height", "9.5px");
  await expect(card.locator(".na-product-title")).toHaveCSS("font-size", "15.5px");
  await expect(card.locator(".na-product-price")).toHaveCSS("letter-spacing", "0.7px");

  const add = card.locator(".na-product-add");
  await expect(add).toHaveCSS("opacity", "0");
  await card.hover();
  await expect(add).toHaveCSS("opacity", "1");
  await expect(add).toHaveCSS("height", "48px");
  await expect(add).toHaveCSS("background-color", "rgb(230, 226, 212)");

  await expect(page.locator(".na-all-filters")).toHaveText("All Filters +");
  await expect(page.locator(".na-sort-trigger")).toContainText("Sort by:");
  await page.locator(".na-all-filters").click();
  const apply = page.locator(".na-filter-apply");
  await expect(apply).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(apply).toHaveCSS("color", "rgb(249, 248, 242)");
  await expect(apply).toHaveCSS("min-height", "52px");
  await expect(apply).toHaveText(`See Results (${mateBestSellers.length})`);
});
