import assert from "node:assert/strict";
import test from "node:test";
import { activewearProducts, posedFrames } from "../src/lib/activewearCatalog";
import aspects from "../src/lib/photoAspects.json";

const sizes = aspects as unknown as Record<string, [number, number]>;
const isPortrait = (src: string) => {
  const size = sizes[src];
  return Boolean(size) && size[1] > size[0];
};

test("every activewear card leads with a complete full-length pose, never a detail crop", () => {
  for (const product of activewearProducts) {
    assert.ok(product.images.length > 0, product.slug);
    assert.ok(isPortrait(product.images[0]), `${product.slug} leads with a non-portrait frame`);
    assert.ok(sizes[product.images[0]], `${product.slug} leads with an unmeasured frame`);
  }
});

test("the hover frame is a second, different, complete pose of the same colourway", () => {
  let swapped = 0;
  for (const product of activewearProducts) {
    const frame = product.images[1];
    if (!frame) continue;
    assert.notEqual(frame, product.images[0], product.slug);
    assert.ok(isPortrait(frame), `${product.slug} swaps to a detail crop`);
    swapped += 1;
  }
  assert.ok(swapped >= 90, `only ${swapped} products can swap poses`);
});

test("posedFrames keeps every frame, only reordering detail crops behind full poses", () => {
  const sample = activewearProducts[0].images;
  const reordered = posedFrames([...sample].reverse());
  assert.deepEqual([...reordered].sort(), [...sample].sort());
  assert.equal(new Set(reordered).size, reordered.length);
});
