import { test, expect, type Locator } from "@playwright/test";
import { mateNewArrivals, sortProducts, filterProducts, getArrivalProduct, PAGE_SIZE } from "../../src/lib/mateNewArrivals";

const PATH = "/en/collections/new-arrivals";
const cards = ".na-product-grid > .na-product-card";
// Click the actual visible label: inputs are intentionally visually hidden.
async function choose(input: Locator) { await input.locator("..").click(); await expect(input).toBeChecked(); }

test.beforeEach(async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator(cards)).toHaveCount(48);
  // Native modal becoming open verifies event-handler hydration, not just SSR.
  await expect(page.getByRole("heading", { name: "New Arrivals", exact: true })).toBeVisible();
});

test("reference intro, four correct first poses, local assets and dimensions", async ({ page }) => {
  await expect(page.getByText("Refresh your days with naturally luxurious new arrivals.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "All Filters +", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sort by: Featured", exact: true })).toBeVisible();
  for (let i = 0; i < 4; i++) {
    const card = page.locator(cards).nth(i);
    await expect(card).toHaveAttribute("data-default-slug", mateNewArrivals[i].slug);
    await expect(card.locator(".na-product-media img").first()).toHaveAttribute("src", mateNewArrivals[i].images[0]);
  }
  await page.evaluate(() => document.fonts.ready);
  const geometry = await page.locator(".na-product-grid").boundingBox();
  expect(geometry?.x).toBe(36);
  expect(geometry?.y).toBeCloseTo(369.734375, 1);
  expect(geometry?.width).toBe(1275);
  expect(await page.locator(".na-collection-intro h1").evaluate((e) => getComputedStyle(e).fontFamily)).toContain("Edict Display");
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", "107");
});

test("both triggers open the same accessible filter drawer; Escape and focus return", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "All Filters +", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filters (0)", exact: true });
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())?.width).toBe(505);
  await expect(dialog.getByRole("button", { name: "Category", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByRole("button", { name: "See Results (107)" })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.locator(".na-sort-trigger").click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Category", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("button", { name: "Size", exact: true })).toHaveAttribute("aria-expanded", "true");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("all four reference sort choices actually reorder products", async ({ page }) => {
  await page.locator(".na-sort-trigger").click();
  const dialog = page.locator(".na-filter-drawer");
  for (const [label, sort] of [["Newest", "created-descending"], ["Best Selling", "best-selling"], ["Price, low to high", "price-ascending"], ["Price, high to low", "price-descending"]] as const) {
    await choose(dialog.getByRole("radio", { name: label, exact: true }));
    await expect(dialog.getByRole("radio", { name: label, exact: true })).toBeChecked();
    await expect(page).toHaveURL(new RegExp(`sort_by=${sort}`));
    const actual = await page.locator(cards).evaluateAll((els) => els.map((e) => e.getAttribute("data-default-slug")));
    expect(actual).toEqual(sortProducts(mateNewArrivals, sort).slice(0, 48).map((p) => p.slug));
    await expect(dialog.getByRole("button", { name: "See Results (107)" })).toBeVisible();
  }
});

test("category, size, color and chips use real counts and change results", async ({ page }) => {
  await page.getByRole("button", { name: "All Filters +", exact: true }).click();
  const dialog = page.locator(".na-filter-drawer");
  await dialog.getByRole("button", { name: "Category", exact: true }).click();
  await expect(dialog.getByRole("checkbox", { name: "Sports Bras (8)", exact: true })).toBeVisible();
  await expect(dialog.getByRole("checkbox", { name: "Sweatpants (29)", exact: true })).toBeVisible();
  await choose(dialog.getByRole("checkbox", { name: "Sports Bras (8)", exact: true }));
  await expect(dialog.getByRole("heading", { name: "Filters (1)", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "See Results (8)", exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(8);
  await dialog.getByRole("button", { name: "Size", exact: true }).click();
  await choose(dialog.locator('input[name="size"][value="XS"]'));
  await dialog.getByRole("button", { name: "Color Group", exact: true }).click();
  await choose(dialog.locator('input[name="color"][value="Purple"]'));
  const expected = filterProducts(mateNewArrivals, { categories: ["sports-bras"], sizes: ["XS"], colors: ["Purple"] });
  await expect(dialog.getByRole("heading", { name: "Filters (3)", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: `See Results (${expected.length})`, exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(expected.length);
  await expect(page).toHaveURL(/filter\.p\.t\.category/);
  await dialog.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Filters (0)", exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(48);
  await dialog.getByRole("button", { name: "See Results (107)", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("shared URLs, empty results, pagination and browser back", async ({ page }) => {
  await page.goto(`${PATH}?filter.p.t.category=aa-2-14-8&filter.v.option.size=XS`);
  await expect(page.getByRole("heading", { name: "No products found.", exact: true })).toBeVisible();
  await expect(page.locator(cards)).toHaveCount(0);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(48);
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(cards).first()).toHaveAttribute("data-default-slug", mateNewArrivals[PAGE_SIZE].slug);
  await page.getByRole("button", { name: "Page 3", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(11);
  await page.goBack();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(cards)).toHaveCount(48);
});

test("color changes use the corresponding photographs and product URL; keyboard cycles poses", async ({ page }) => {
  const card = page.locator(cards).first();
  const black = card.getByRole("button", { name: "Select Jet Black", exact: true });
  await black.click();
  const expected = getArrivalProduct("organic-stretch-sports-bra-jet-black");
  expect(expected).toBeTruthy();
  await expect(card).toHaveAttribute("data-product-slug", expected!.slug);
  await expect(card.locator(".na-product-media img").first()).toHaveAttribute("src", expected!.images[0]);
  await expect(card.locator(".na-product-title a")).toHaveAttribute("href", `/en/products/${expected!.slug}`);
  const image = card.locator(".na-product-media");
  await image.focus();
  await image.press("ArrowRight");
  await expect(image.locator("img").first()).toHaveAttribute("src", expected!.images[1]);
  await card.locator(".na-swatch-more-desktop").click();
  await expect(card.locator(".na-swatches")).toHaveClass(/is-expanded/);
});

test("Quick add validates size, adds the selected real variant, changes quantities and persists", async ({ page }) => {
  const card = page.locator(cards).first();
  await card.hover();
  await card.getByRole("button", { name: "Quick add Organic Stretch Sports Bra", exact: true }).click();
  const quick = page.locator(".na-quick-add");
  await expect(quick).toBeVisible();
  await quick.locator('button[type="submit"]').click();
  await expect(quick.getByRole("alert")).toHaveText("Please select a size.");
  await choose(quick.getByRole("radio", { name: "S", exact: true }));
  await quick.locator('button[type="submit"]').click();
  const cart = page.locator(".na-cart-drawer");
  await expect(cart).toBeVisible();
  await expect(quick).not.toBeVisible();
  await expect(cart.locator(".na-cart-lines > li")).toHaveCount(1);
  await expect(cart.locator(".na-cart-line-details")).toContainText("FIG / S");
  await cart.getByRole("button", { name: "Increase quantity", exact: true }).click();
  await expect(cart.locator(".na-quantity > span")).toHaveText("2");
  await cart.getByRole("button", { name: "Close", exact: true }).click();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.reload();
  await page.getByRole("button", { name: "Shopping bag (2)", exact: true }).click();
  await expect(cart.locator(".na-quantity > span")).toHaveText("2");
  await cart.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(cart).toContainText("Your bag is empty.");
});

test("Getaway photography/Shop Now, all FAQs and footer links are present and functional", async ({ page }) => {
  const getaway = page.locator(".na-getaway");
  await expect(getaway.getByRole("heading", { name: "The Getaway Edit", exact: true })).toBeVisible();
  await expect(getaway.locator("img")).toHaveCount(2);
  await expect(getaway.getByRole("link", { name: "Shop Now", exact: true })).toHaveAttribute("href", "https://matethelabel.com/collections/the-getaway-edit");
  const faq = page.locator(".na-faq");
  for (const question of ["How do I find my size?", "What is MATE’s return and exchange policy?", "Do you ship internationally?", "What makes MATE’s fabrics different?"]) {
    await faq.locator("summary").filter({ hasText: question }).click();
    await expect(faq.locator("details").filter({ hasText: question })).toHaveAttribute("open", "");
  }
  await expect(faq.getByRole("link", { name: "care@matethelabel.com", exact: true })).toHaveAttribute("href", "mailto:care@matethelabel.com");
  await expect(faq.getByRole("link", { name: "Returns", exact: true })).toHaveAttribute("href", /returns-portal/);
  await expect(faq).toContainText("$15");
  await expect(faq).toContainText("$200");
  await expect(faq.locator("em")).toBeVisible();
  await expect(page.locator(".na-breadcrumbs")).toContainText("Shop All");
  await expect(page.locator(".na-footer")).toContainText("© 2026 MATE");
  await expect(page.locator(".na-footer")).toContainText("Join the MATE world.");
});

test("newsletter never fabricates success when provider isn't configured", async ({ page }) => {
  await page.route("**/api/newsletter", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "newsletter_not_configured" }) }));
  const footer = page.locator(".na-footer");
  await footer.getByRole("textbox", { name: "Email address", exact: true }).fill("qa@example.com");
  await footer.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(footer.locator('[role="alert"]')).toContainText("unavailable");
});

test("mobile layout, full-width filter drawer and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(await page.locator(".na-product-grid").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length)).toBe(2);
  await expect(page.locator(".na-menu-toggle")).toBeVisible();
  await page.getByRole("button", { name: "All Filters +", exact: true }).click();
  const dialog = page.locator(".na-filter-drawer");
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())?.width).toBe(390);
  await page.keyboard.press("Escape");
  await page.locator(".na-menu-toggle").click();
  await expect(page.locator(".na-mobile-menu")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("Arabic locale preserves real results, RTL geometry and translated filters", async ({ page }) => {
  await page.goto("/ar/collections/new-arrivals");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", "107");
  await page.locator(".na-all-filters").click();
  await expect(page.locator(".na-filter-drawer")).toBeVisible();
  await expect(page.locator(".na-filter-header h2")).toContainText("(0)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1347);
});

test("real product details/color routes, cart and checkout accept imported products", async ({ page }) => {
  await page.goto(`/en/products/${mateNewArrivals[0].slug}`);
  await expect(page.locator(".na-product-page h1")).toHaveText("Organic Stretch Sports Bra");
  await expect(page.locator(".na-product-gallery img").first()).toHaveAttribute("src", mateNewArrivals[0].images[0]);
  await page.getByRole("button", { name: "Select Jet Black", exact: true }).first().click();
  await expect(page).toHaveURL(/organic-stretch-sports-bra-jet-black/);
  const product = page.locator(".na-product-buybox");
  await choose(product.getByRole("radio", { name: "S", exact: true }));
  await product.locator('button[type="submit"]').click();
  await expect(page.locator(".na-cart-drawer")).toBeVisible();
  await page.locator(".na-cart-drawer").getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/checkout/);
  await expect(page.locator("main")).toContainText("Organic Stretch Sports Bra");
  await expect(page.locator("main")).toContainText("Jet Black");
});

test("no runtime/console errors, broken first-row photos, or legacy route regression", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  for (const image of await page.locator(cards).first().locator(".na-product-media img").all()) {
    if (await image.isVisible()) await expect.poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.goto("/en/collections/best-sellers");
  await expect(page.locator(".na-storefront")).toHaveCount(0);
  await expect(page.locator("h1")).toBeVisible();
  await page.goto("/en");
  await expect(page.locator(".na-storefront")).toHaveCount(0);
  expect(errors).toEqual([]);
});
