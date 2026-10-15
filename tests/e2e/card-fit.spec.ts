import { expect, test } from "@playwright/test";

/**
 * A card paints its photograph the way the reference does — the frame scaled to fill a 333/431 box,
 * never letterboxed, never zoomed — and a hover answers with a *different pose* of the same
 * colourway. Both halves are measured on the rendered page: the shelf the complaint named
 * (best sellers) and the two grids that share the card.
 *
 * A cross-fade leaves the incoming frame on top of the outgoing one, so "what the card is showing"
 * is the last frame that has faded fully in. A colourway the reference photographed in a single
 * complete pose has no second frame to fade to, and must not invent one.
 */
const pages = ["/en/collections/best-sellers", "/en/collections/all", "/en/collections/activewear"];

/** The reveal animation leaves an identity matrix behind; what must never appear is a scale. */
const scaleOf = (transform: string) => {
  const values = /matrix\(([^)]+)\)/.exec(transform)?.[1]?.split(",").map(Number);
  if (!values) return 1;
  const [a, b, c, d] = values;
  if (Math.abs(b) > 0.001 || Math.abs(c) > 0.001) throw new Error(`rotation or skew: ${transform}`);
  if (a !== d) throw new Error(`non-uniform scale: ${transform}`);
  return a;
};

function read(card: HTMLElement) {
  const media = card.querySelector<HTMLElement>(".na-product-media");
  const images = [...(media?.querySelectorAll<HTMLImageElement>("img") ?? [])];
  const box = media?.getBoundingClientRect();
  const opaque = images.filter((img) => Number(getComputedStyle(img).opacity) > 0.99);
  const top = opaque[opaque.length - 1] ?? images[0];
  const rect = top?.getBoundingClientRect();
  const style = top ? getComputedStyle(top) : null;
  return {
    slug: card.dataset.productSlug ?? "",
    frames: images.length,
    swap: Boolean(card.querySelector(".na-product-hover-image")),
    box: box ? { w: Math.round(box.width * 10) / 10, h: Math.round(box.height * 10) / 10 } : null,
    ratio: box ? Math.round((box.width / box.height) * 10000) / 10000 : 0,
    src: top ? (top.currentSrc || top.src).split("/").pop() ?? "" : "",
    natural: top ? `${top.naturalWidth}x${top.naturalHeight}` : "",
    fit: style?.objectFit ?? "",
    transform: style?.transform ?? "none",
    // How far the painted frame overflows its box: `cover` never leaves a gap, `contain` always does.
    gap: rect && box ? { w: Math.round((rect.width - box.width) * 10) / 10, h: Math.round((rect.height - box.height) * 10) / 10 } : null,
  };
}

for (const url of pages) {
  test(`${url}: every card fills its frame, and a hover lands on another pose`, async ({ page }) => {
    await page.goto(url);
    const cards = page.locator(".na-product-card");
    await expect(cards.first()).toBeVisible();
    const count = Math.min(await cards.count(), 8);
    let swapped = 0;
    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      const before = await card.evaluate(read);
      expect(before.box, before.slug).not.toBeNull();
      // 333/431, the reference's own frame.
      expect(before.ratio, before.slug).toBeCloseTo(333 / 431, 3);
      expect(before.fit, before.slug).toBe("cover");
      expect(scaleOf(before.transform), before.slug).toBe(1);
      // The image element is the frame: `inset:0` and 100% of both. The rule this catches is the old
      // one that shrank the height by a pixel and letterboxed every card.
      expect(Math.abs(before.gap?.w ?? 99), before.slug).toBeLessThanOrEqual(0.6);
      expect(Math.abs(before.gap?.h ?? 99), before.slug).toBeLessThanOrEqual(0.6);
      expect(before.src, before.slug).toMatch(/\.(webp|jpe?g|png)$/);

      const media = card.locator(".na-product-media");
      await media.hover();
      if (!before.swap) {
        // One complete photograph of this dye: the card holds it instead of faking a pose change.
        expect(before.frames, before.slug).toBe(1);
        const still = await card.evaluate(read);
        expect(still.src, before.slug).toBe(before.src);
        expect(still.frames, before.slug).toBe(1);
        continue;
      }
      await expect.poll(async () => (await card.evaluate(read)).src, { timeout: 5000, message: `${before.slug}: the hover never landed on another frame` }).not.toBe(before.src);
      const hovered = await card.evaluate(read);
      expect(hovered.slug, before.slug).toBe(before.slug);
      expect(hovered.src, before.slug).not.toBe(before.src);
      // Same frame, same fit, no zoom — only the pose moved.
      expect(hovered.fit, before.slug).toBe("cover");
      expect(scaleOf(hovered.transform), before.slug).toBe(1);
      expect(hovered.gap, before.slug).toEqual(before.gap);
      expect(hovered.box, before.slug).toEqual(before.box);
      swapped += 1;
      await page.mouse.move(4, 4);
    }
    expect(swapped, url).toBeGreaterThan(4);
  });
}

test("a product page offers the same complete frames, and its gallery fills its box", async ({ page }) => {
  // The two cards the complaint named. The sports bra owns full-length photographs and must lead with
  // one; the waffle crew top is the discounted card, and its gallery must hold more than one pose.
  for (const slug of ["organic-stretch-sports-bra-heather-grey", "organic-waffle-crew-top-heather-grey"]) {
    await page.goto(`/en/products/${slug}`);
    const gallery = page.locator(".na-product-gallery img");
    await expect(gallery.first()).toBeVisible();
    const report = await page.locator(".na-product-gallery").evaluate((node) => [...node.querySelectorAll<HTMLImageElement>("img")].map((img) => {
      const rect = img.getBoundingClientRect();
      const style = getComputedStyle(img);
      return { src: (img.currentSrc || img.src).split("/").pop() ?? "", fit: style.objectFit, scale: style.transform, w: Math.round(rect.width), h: Math.round(rect.height) };
    }));
    expect(report.length, slug).toBeGreaterThanOrEqual(2);
    expect(new Set(report.map((entry) => entry.src)).size, slug).toBe(report.length);
    for (const entry of report) {
      expect(entry.fit, `${slug} ${entry.src}`).toBe("cover");
      expect(scaleOf(entry.scale), `${slug} ${entry.src}`).toBe(1);
      expect(Math.round((entry.w / entry.h) * 10000) / 10000, `${slug} ${entry.src}`).toBeCloseTo(333 / 431, 2);
    }
  }
});
