import { expect, test } from "@playwright/test";
import { homeRails, homeCategoryTiles } from "../../src/lib/homeRails";
import { productColorways } from "../../src/lib/mateNewArrivals";

const cards = ".na-product-grid > .na-product-card";
const rails = homeRails();

async function firstSwappableCard(page: import("@playwright/test").Page) {
  const count = await page.locator(cards).count();
  for (let index = 0; index < count; index += 1) {
    const card = page.locator(cards).nth(index);
    const slug = (await card.getAttribute("data-default-slug"))!;
    const product = rails.flatMap((rail) => rail.products).find((p) => p.slug === slug)!;
    const colorways = productColorways(product);
    if (colorways.length > 1) return { card, product, colorways };
  }
  throw new Error("no card with more than one photographed colourway");
}

test("home rails carry the collection products, in the order the collections use", async ({ page }) => {
  await page.goto("/en");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(rails.length);
  for (const [index, rail] of rails.entries()) {
    await tabs.nth(index).click();
    await expect(page.locator(cards)).toHaveCount(rail.products.length);
    const actual = await page.locator(cards).evaluateAll((els) => els.map((el) => el.getAttribute("data-default-slug")));
    expect(actual).toEqual(rail.products.map((product) => product.slug));
  }
});

test("picking a colour on a home card shows that colourway's own garment and photograph", async ({ page }) => {
  await page.goto("/en");
  const { card, colorways } = await firstSwappableCard(page);
  const target = colorways[1];

  await card.locator(".na-swatch").nth(1).click();
  await expect(card).toHaveAttribute("data-product-slug", target.slug);
  await expect(card.locator(".na-product-media img").first()).toHaveAttribute("src", target.images[0]);
  await expect(card.locator(".na-product-title a")).toHaveAttribute("href", `/en/products/${target.slug}`);
  await expect(card.locator(".na-swatch").nth(1)).toHaveClass(/is-current/);
  // The swap really is a different dyed garment: the previous colour's frame is gone.
  expect(target.images[0]).not.toEqual(colorways[0].images[0]);
  expect(target.color.hex).not.toEqual(colorways[0].color.hex);
  await expect(card.locator(".na-swatch").nth(1)).toHaveCSS("background-color", /^rgb/);

  // Hovering the media advances to another whole pose of the same colourway, never another
  // colour and never a crop. A colourway that owns one whole photograph keeps it.
  const media = card.locator(".na-product-media");
  const hoverImage = media.locator(".na-product-hover-image");
  if (await hoverImage.count()) {
    expect(await hoverImage.getAttribute("src")).not.toBe(await media.locator("img").first().getAttribute("src"));
    await media.hover();
    await expect(hoverImage).toHaveClass(/is-visible/);
    await page.mouse.move(0, 0);
  }

  // Keyboard pose stepping stays inside the chosen colourway too.
  await media.focus();
  await media.press("ArrowRight");
  await expect(media.locator("img").first()).toHaveAttribute("src", target.images[1] ?? target.images[0]);
});

test("quick add from a home card adds the colour on screen, not the default one", async ({ page }) => {
  await page.goto("/en");
  const { card, colorways } = await firstSwappableCard(page);
  await card.locator(".na-swatch").nth(1).click();
  await expect(card).toHaveAttribute("data-product-slug", colorways[1].slug);
  await card.hover();
  const title = (await card.locator(".na-product-title").innerText()).trim();
  await card.getByRole("button", { name: `Quick add ${title}`, exact: true }).click();
  const dialog = page.locator(".na-quick-add");
  await expect(dialog).toBeVisible();
  // The dialog opens on the colour that is on the card, not on the product's default colourway.
  await expect(dialog.locator(".na-quick-image img")).toHaveAttribute("src", colorways[1].images[0]);
  await expect(dialog.locator(".na-swatch.is-current")).toHaveCount(1);
});

test("the category trio counts match the pages they link to", async ({ page }) => {
  await page.goto("/en");
  const expected = homeCategoryTiles().map((tile) => tile.count);
  await expect(page.locator(".na-home-category-count")).toHaveCount(3);
  expect(await page.locator(".na-home-category-count").allInnerTexts()).toEqual(expected.map((n) => `(${n})`));
  await page.locator('a[href*="/collections/best-sellers?tab=activewear"]').first().click();
  await expect(page.locator(".na-product-grid")).toHaveAttribute("data-result-count", String(expected[0]));
});

test("Arabic home rails keep the same colourway photographs and counts", async ({ page }) => {
  await page.goto("/ar");
  const { card, colorways } = await firstSwappableCard(page);
  await card.locator(".na-swatch").nth(1).click();
  await expect(card).toHaveAttribute("data-product-slug", colorways[1].slug);
  await expect(card.locator(".na-product-media img").first()).toHaveAttribute("src", colorways[1].images[0]);
  await expect(page.locator(".na-home-category-count")).toHaveCount(3);
  expect(await page.locator(".na-home-category-count").allInnerTexts()).toEqual(
    homeCategoryTiles().map((tile) => `(${tile.count})`),
  );
  const box = await page.locator(".na-product-grid").boundingBox();
  expect(box!.x).toBeGreaterThan(0);
});
