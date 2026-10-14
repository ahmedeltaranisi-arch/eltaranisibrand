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

## Pooling a colourway's frames

The same slug is filed in more than one catalogue and each capture holds different frames: a dye
the Activewear capture shot waist-up may be shot full length in the New Arrivals capture.
`src/lib/photoPool.json` unions a slug's frames across all captures, complete frames first — and
within those, the frames that hold the model's feet ahead of the closer crops, so a card leads
with the most complete photograph the colourway owns.

## Frames and colourways that leave

`selectFrames()` renders only complete frames, and a colourway left with none is dropped from the
catalogue rather than shown cropped — the storefront is smaller and honest rather than complete
and wrong. After the current scan the arrivals catalogue holds 167 colourways (was 177), the
activewear catalogue 85 (was 95) and the shop-all catalogue 191 (was 205).

## Verifying

* `npx tsx scripts/audit-photos.ts` — catalogue-side report: rows, frames per row, drops.
* `node verification/tools/live-sweep.mjs` — production sweep: every card frame in every
  collection and every product-page gallery frame is checked against `photoPoses.json`.
* `node verification/tools/swatch-sweep.mjs` — clicks every swatch on a set of cards and checks
  the photograph each dye swaps to.
