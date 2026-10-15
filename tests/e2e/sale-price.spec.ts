import { expect, test } from "@playwright/test";

/**
 * The price line, measured on the rendered page against the reference's own card markup:
 * a colourway the reference discounts prints its usual price struck through in front of the sale
 * price — 12px apart on a card, 18px on the product page — and every other colourway prints one
 * price and nothing else.
 */
test("a discounted card prints both prices, struck in grey like the reference", async ({ page }) => {
  await page.goto("/en/collections/waffle");
  const card = page.locator('.na-product-card[data-product-slug="organic-waffle-crew-top-heather-grey"]').first();
  await expect(card).toBeVisible();
  const price = card.locator(".na-product-price");
  await expect(price).toHaveText(/LE 10,572\s*LE 7,355/);
  const struck = card.locator(".na-product-compare-price");
  await expect(struck).toHaveCount(1);
  const style = await struck.evaluate((node) => {
    const s = getComputedStyle(node);
    return { colour: s.color, decoration: s.textDecorationLine, size: s.fontSize, weight: s.fontWeight, gap: getComputedStyle(node.parentElement!).columnGap };
  });
  expect(style).toEqual({ colour: "rgb(174, 174, 174)", decoration: "line-through", size: "14px", weight: "400", gap: "12px" });
  // The sale price itself stays black, on the same baseline.
  const current = await card.locator(".na-product-current-price").evaluate((node) => {
    const s = getComputedStyle(node);
    return { colour: s.color, decoration: s.textDecorationLine };
  });
  expect(current).toEqual({ colour: "rgb(0, 0, 0)", decoration: "none" });
});

test("a colourway the reference does not discount prints one price", async ({ page }) => {
  for (const url of ["/en/collections/best-sellers", "/en/collections/all", "/en/collections/sweats"]) {
    await page.goto(url);
    const cards = page.locator(".na-product-card");
    await expect(cards.first()).toBeVisible();
    expect(await page.locator(".na-product-compare-price").count(), url).toBe(0);
    const text = await cards.first().locator(".na-product-price").innerText();
    expect(text.replace(/\s+/g, " ").trim(), url).toMatch(/^LE [\d,]+$/);
  }
});

test("the product page prints the pair with the reference's own spacing", async ({ page }) => {
  await page.goto("/en/products/organic-waffle-crew-top-heather-grey");
  const line = page.locator(".na-product-price-line");
  await expect(line).toBeVisible();
  await expect(line).toHaveText(/LE 10,572\s*LE 7,355/);
  const style = await line.evaluate((node) => {
    const s = getComputedStyle(node);
    const struck = getComputedStyle(node.querySelector("s")!);
    return { display: s.display, gap: s.columnGap, size: s.fontSize, decoration: struck.textDecorationLine, colour: struck.color };
  });
  expect(style).toEqual({ display: "flex", gap: "18px", size: "14px", decoration: "line-through", colour: "rgb(0, 0, 0)" });
});

test("every card's struck price is its own row's compare-at — and only the rows that carry one", async ({ page }) => {
  // The `data-compare-at` attribute is the row's own value and the `<s>` is what got painted: the two
  // have to agree on every card of a shelf, discounted or not. The socks shelf is where the reference
  // puts its `35% OFF` cards, best sellers is where it prints none.
  const shelves = ["/en/collections/socks", "/en/collections/best-sellers", "/en/collections/up-to-50-off"];
  let discounted = 0;
  let plain = 0;
  for (const url of shelves) {
    await page.goto(url);
    const rows = await page.locator(".na-product-card").evaluateAll((nodes) => nodes.map((node) => ({
      slug: node.getAttribute("data-product-slug") ?? "",
      compare: node.getAttribute("data-compare-at") ?? "",
      struck: [...node.querySelectorAll(".na-product-compare-price")].map((el) => (el.textContent ?? "").trim()),
      price: (node.querySelector(".na-product-price")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
    expect(rows.length, url).toBeGreaterThan(0);
    for (const row of rows) {
      const expected = row.compare ? `LE ${Number(row.compare).toLocaleString("en-US")}` : null;
      if (expected) {
        expect(row.struck.length, `${url} ${row.slug}`).toBe(1);
        expect(row.struck[0], `${url} ${row.slug}`).toBe(expected);
        expect(row.price, `${url} ${row.slug}`).toContain(expected);
        discounted += 1;
      } else {
        expect(row.struck.length, `${url} ${row.slug} printed a compare-at its row does not carry`).toBe(0);
        expect(row.price, `${url} ${row.slug}`).toMatch(/^LE [\d,]+$/);
        plain += 1;
      }
    }
  }
  expect(discounted).toBeGreaterThan(0);
  expect(plain).toBeGreaterThan(40);
});

test("the struck price follows a swatch switch, because it belongs to the colourway", async ({ page }) => {
  // The trouser sock is photographed in two colourways and the reference discounts both; switching
  // dyes has to move the whole price line with it, not leave the previous dye's number behind.
  await page.goto("/en/collections/socks");
  const card = page.locator('.na-product-card[data-default-slug="organic-cotton-trouser-sock-bone"]').first();
  await expect(card).toBeVisible();
  await expect(card.locator(".na-product-compare-price")).toHaveText("LE 3,678");
  const before = await card.getAttribute("data-product-slug");
  const priceBefore = await card.locator(".na-product-price").innerText();
  await card.locator(".na-swatch").nth(1).click();
  await expect.poll(() => card.getAttribute("data-product-slug")).not.toBe(before);
  const after = await card.evaluate((node) => ({
    slug: node.getAttribute("data-product-slug") ?? "",
    compare: node.getAttribute("data-compare-at") ?? "",
    struck: (node.querySelector(".na-product-compare-price")?.textContent ?? "").trim(),
    price: (node.querySelector(".na-product-price")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  }));
  expect(after.slug).toBe("organic-cotton-trouser-sock-bone-conch-raffia");
  expect(after.compare).toBe("3678");
  expect(after.struck).toBe("LE 3,678");
  expect(after.price.replace(/\s+/g, "")).toBe(priceBefore.replace(/\s+/g, ""));
});
