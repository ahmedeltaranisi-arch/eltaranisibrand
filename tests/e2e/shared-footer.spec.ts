import { test, expect } from "@playwright/test";
test("homepage and arrivals share the exact Eltaranisi footer and typography", async ({ page }) => {
  const snapshots = [];
  for (const url of ["/en", "/en/collections/new-arrivals"]) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const footer = page.locator('[data-site-footer="eltaranisi"]');
    await expect(footer).toHaveCount(1);
    await expect(footer).toContainText("Join the Eltaranisi world.");
    await expect(footer).toContainText("ELTARANISI");
    snapshots.push(await footer.evaluate(e => ({ text: (e as HTMLElement).innerText, background: getComputedStyle(e).backgroundColor, font: getComputedStyle(e).fontFamily, heading: getComputedStyle(e.querySelector("h2")!).fontFamily, html: e.innerHTML.replace(/id="[^"]*"/g, "") })));
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
});
