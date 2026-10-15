# Product photography — what may be shown

A card, a gallery, a search row and a swatch never show a photograph the model is cut off in.
That rule is measured, not guessed, and the measurement is stored in the repository.

## The scan

Every file under `public/img/` that a catalogue references was measured twice over:

1. **Pose landmarks** (MediaPipe Pose) — where the model's nose, ears, shoulders, hips, knees,
   ankles and feet are, and how much of each joint the model is confident about.
2. **Silhouette pass** — the segmented mask of the figure, its bounding box, and how wide the
   mask runs at each of the frame's four edges. A torso-wide run at an edge is what a cut looks
   like: the body continues past the frame.

The two signals are combined into one verdict per file, written to `src/lib/photoPoses.json`:

| value | meaning |
| --- | --- |
| `2` | **whole** — the model is complete inside the frame |
| `0` | **crop** — the frame is filled by a torso or a pair of legs; the model is cut off |

There is no third value. A photograph the scan could not prove is treated as a crop and never
rendered, so no surface can fall back to a cut frame.

### What "complete" means per garment

* **A leg garment** (`leggings`, `shorts`, `pants`, `sweatpants`, `unitards`) — head to feet. The
  frame must hold the head, and neither the mask's top nor its bottom edge may be crossed by a
  torso-wide run: the model's feet have to be inside the picture.
* **A top** (`sweatshirts`, `sweaters`, `t-shirts`, `tank-tops`, `activewear-tops`,
  `sports-bras`) — the head, both shoulders and the whole garment down to its hem. A top shot
  closer than full length is honest as long as the garment being sold is entirely visible.
* **A flat still** (`socks`, `headbands`, `accessories`) — no model to cut off, kept as captured.

## What "complete" is measured against

A frame is not judged as a file: it is judged as the picture a card paints. Every surface that shows
a product photograph — a card, the product-page gallery, a search row, a cart line — renders into a
box whose ratio is 333/431 with the frame scaled to fill it (`object-fit: cover`, exactly what the
reference does), so a 3:4 photograph loses 1.5% of its top and bottom and a square one loses 11.4%
of each side. The scan therefore asks its questions about the region that *survives* that crop, with
a further 1.2% of safety:

| value | meaning |
| --- | --- |
| `2` | **whole** — crown, both shoulders, both hips, both knees, both ankles and a foot survive the crop |
| `1` | **hem** — the head, both shoulders and both hips survive it: the garment is entirely visible, the legs run past the frame |
| `3` | **flat** — no model was found at all *and* the subject floats inside the frame: a folded garment, a sock pair, a gift-card graphic |
| `0` | **crop** — the head is cut, or the frame is a torso or a leg detail |

`displayFrames()` renders the 2s; a colourway that owns none renders its 1s. A flat still is handed
out only where a body is not expected at all — the socks, headbands and accessories shelves — and a
fabric close-up never reaches a card. A colourway whose every frame is a crop keeps the reference's
own frame rather than losing the colour, so a dye the reference sells is never dropped over its
photography. A white garment on a white backdrop, a torso detail or a photograph the pose detector
could not resolve is therefore a crop (0) and not a flat (3): the subject has to clear every edge of
the frame to be called a still. Ordering, tiering and everything else
is `src/lib/photoSelection.ts`, and the numbers come from `scripts/scan-photo-poses.py`:

```sh
python3 scripts/scan-photo-poses.py --write    # measures every frame the catalogues reference
```

The scan also writes `src/lib/photoFrameHashes.json`, a 16x16 difference hash per frame.

## A hover is another pose, not another zoom

A card that "changes" to the same photograph at another magnification is the failure the shelves were
called out for, so pose identity is a rule and not a hope:

* `scripts/order-card-frames.mjs` orders each colourway's frames — complete figures first, in the
  order the reference's own card paints them, then the gallery frames it bought — and drops a frame
  whose hash agrees with an earlier one within 20 bits: that is the same pose reframed.
* `hoverFrame()` then hands the card the *next* frame in that list. Consecutive entries of an ordered
  row are always ≥20 bits apart, so a hover is always a different pose of the same colourway; a
  colourway left with one frame keeps it and no hover state appears.
* Nothing scales, translates or crops a photograph: `transform: none`, `scale: 1`, and the only
  transition on a card image is the cross-fade (`new-arrivals.css`, the block that starts
  "A pose change cross-fades to the second photograph").

## Buying the poses a colourway is short of

`scripts/fetch-reference-gallery.mjs` finds every colourway that cannot yet lead with a whole figure
and swap to a second whole pose, reads the reference's own product gallery
(`https://matethelabel.com/products/<handle>.js` — one product per colourway, so every frame is that
dye), and vendors the frames it does not hold yet as 720px WebP in `public/img/mate/`, named after the
sha1 of the URL they came from. Files on disk are recognised by that name, so a re-run buys nothing
twice; `--round`/`--budget` keep the repository small. Bought frames are recorded per colourway in
`src/lib/referenceGalleryFrames.json` and appended to `src/lib/photoPool.json`.

```sh
node scripts/fetch-reference-gallery.mjs --round 1 --per-round 4 --budget 1300
python3 scripts/scan-photo-poses.py --write
node scripts/order-card-frames.mjs
```

The same loop is how a shelf gains a photograph after a catalogue change: buy, measure, order.

## The reference's own frames

`scripts/vendor-reference-frames.mjs` stores the frames the reference ships on its own card carousel —
its lead first, then its poses — and `relay/reference-grid.json` records the order. That order is what
`order-card-frames.mjs` leads with *inside* a tier, so a shelf shows the reference's photograph of a
colourway whenever the reference's photograph is complete. Where the reference leads with a waist-up
shot and a whole-figure pose exists further down its gallery, this storefront leads with the complete
one: a cut-off model is the one thing the shelves are not allowed to show.

## Verifying

* `npm test` runs `tests/photo-poses.test.ts`: no rendered crop, rows ordered as the pipeline wrote
  them, a whole-figure lead wherever the colourway owns one, a hover ≥20 bits from the frame it
  replaces, and no row dropped for want of photography.
* `npx playwright test tests/e2e/card-fit.spec.ts` measures the rendered card: the 333/431 frame, the
  image filling it, no scale, and the pose changing under the pointer — then the product-page gallery.
* `npx tsx scripts/audit-photos.ts` — catalogue-side report: rows, frames per row, tiers.
* `node verification/tools/live-sweep.mjs` — production sweep: every card frame in every collection
  and every product-page gallery frame, checked against `photoPoses.json` *and* against its own box,
  so a deployment cannot quietly fall back to a letterbox, a zoom or a crop.
* `node verification/tools/swatch-sweep.mjs` — clicks every swatch on a set of cards and checks the
  photograph each dye swaps to is that dye's own complete figure.
