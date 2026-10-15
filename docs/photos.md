# Product photography — what may be shown

A card, a gallery, a search row and a swatch never show a photograph the model is cut off in.
That rule is measured, not guessed, and the measurement is stored in the repository.

## The scan

Every file the catalogues reference is measured by `scripts/scan-photo-poses.py`, which runs MediaPipe
`PoseLandmarker` over the frame and records three things per file:

* a **tier** — the verdict in the table under [What "complete" is
  measured against](#what-complete-is-measured-against);
* a **pose signature** — the nose, both shoulders, both elbows, both wrists, both hips and both knees
  as coordinates in body units (the shoulder-to-hip distance is one unit), plus how large the model
  stands inside the box a card paints;
* a **16×16 difference hash** of the frame.

They are stored apart, because the three files are read by different people:

| file | read by | contents |
| --- | --- | --- |
| `src/lib/photoPoses.json` | the storefront, at render time | tier per frame the catalogues actually paint |
| `src/lib/photoPoseSignatures.json` | the ordering script, the audit, the sweep | tier, signature, scale and aspect for every frame the repository holds |
| `src/lib/photoFrameHashes.json` | the same scripts | difference hash per measured frame |

The last two cover a superset: a colourway owns frames that no row renders today (the reference's
gallery, poses an ordering pass set aside), and the ordering script reads back through them on the next
pass. Which frames those are is recorded in `src/lib/photoFrameUniverse.json` (per slug, every frame the
shelves and the buying passes have ever held, written by `order-card-frames.mjs` itself), so an ordering
run is **lossless and idempotent**: it re-reads the whole candidate set instead of only what the rows
happen to paint, and running it twice reports `reordered 0 of 649 rows`. Without that file a pass that
drops a frame drops it for good, because the next pass could no longer see it.

`--prune` keeps `photoPoses.json` down to what is rendered, so the browser never ships a verdict for a
photograph it cannot reach — and, since only rendered frames are committed under `public/img/mate`,
pruning is what tells `restore-vendored-frames.mjs` which files the repository does not carry. The
measured verdicts of the set-aside frames stay in `photoPoseSignatures.json`, which is never pruned:
a colourway whose row shrinks can be re-picked without re-scanning a byte.

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
called out for, so pose identity is a rule and not a hope. It is stated once, in
`scripts/photoPoseRules.mjs`, and the ordering script, the audit, the unit tests and the production
sweep all import that file — none of them can drift from the others:

* **a different stance.** Two frames are the same stance when their difference hashes agree within
  `POSE_BITS` (20 of 256 bits) *or* when the joints they share moved less than `POSE_GAP` (0.12 of a
  head-and-shoulders unit). The pixels alone cannot see it: reframe a standing model and every
  low-frequency value in the hash shifts, while her arms, hips and knees stay exactly where they were.
* **the same distance.** `SCALE_JUMP` (1.15) is how much larger the model may stand in the hover frame
  than in the lead. A pair that fails this is a *second choice*: `order-card-frames.mjs` takes a real
  pose change shot closer up in preference to no pose change at all, and prints the row as
  `~ … hovers at another distance` so the count is visible.
* **no transform anywhere.** Nothing scales, translates or crops a photograph: `transform: none`,
  `scale: 1`, and the only transition on a card image is the cross-fade (`new-arrivals.css`, the block
  that starts "A pose change cross-fades to the second photograph").

Note that the reference's own card is not the standard here: on its best-sellers shelf a fig sports bra
opens on an arms-up shot cut at the hip and its second frame is a back detail with the chin out of
picture. Ours leads with a complete figure for every colourway, which is what the storefront is held to
— the reference supplies the *order within* a colourway's frames and the dye, never permission to paint
a cut body.

`scripts/order-card-frames.mjs` therefore orders each colourway's frames — complete figures first, in
the order the reference's own card paints them, then the gallery frames it bought — drops a frame that
is not a new stance next to the ones already kept, keeps at most `--max` of them, and drops the last
frame of the list when the card's cycle would wrap from it back into the same stance. `hoverFrame()`
then hands the card the *next* frame in that list, so a hover is always a different pose of the same
colourway; a colourway left with one frame keeps it and no hover state appears.

## Restoring a frame the repository lost

A `/img/mate/<stem>.webp` file is named after the sha1 of the URL it came from, so a frame that has
gone missing is re-derivable: `scripts/restore-vendored-frames.mjs --check` lists what the rows, the
pool and `referenceGalleryFrames.json` reference but the disk does not have, and a run without
`--check` traces each stem back through `relay/reference-grid.json` and the product's own gallery and
re-downloads it. `--check` is the command to run after anything has deleted files by name: a prune that
compares bare filenames against `/img/mate/…` paths matches nothing and removes the lot.

## Buying the poses a colourway is short of

`scripts/fetch-reference-gallery.mjs` finds every colourway that cannot yet lead with a whole figure
and swap to a second whole pose, reads the reference's own product gallery
(`https://matethelabel.com/products/<handle>.js` — one product per colourway, so every frame is that
dye), and vendors the frames it does not hold yet as 720px WebP in `public/img/mate/`, named after the
sha1 of the URL they came from. Files on disk are recognised by that name, so a re-run buys nothing
twice; `--round`/`--budget` keep the repository small. Bought frames are recorded per colourway in
`src/lib/referenceGalleryFrames.json` and appended to `src/lib/photoPool.json`.

```sh
node scripts/fetch-reference-gallery.mjs --round 1 --per-round 4 --budget 1300 --pace 300
python3 scripts/scan-photo-poses.py --write
node scripts/order-card-frames.mjs
```

Which colourways need frames is decided by the same `poseRules` a hover is graded by, so a row whose
two frames are one stance at two zooms counts as needing a pose and is not declared satisfied. The
storefront's CDN answers a bare bot signature with an interstitial, so every request carries a
browser's headers and `--pace` leaves 300 ms between handles. A frame recorded in
`referenceGalleryFrames.json` is only left alone when the file is really on disk: a lost download is
re-bought, not declared unbuyable.

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
  them, a whole-figure lead wherever the colourway owns one, every pair a card can cycle through a
  different stance by both signals, and no row dropped for want of photography.
* `npx playwright test tests/e2e/card-fit.spec.ts` measures the rendered card: the 333/431 frame, the
  image filling it, no scale, and the pose changing under the pointer — then the product-page gallery.
* `npx tsx scripts/audit-photos.ts` — catalogue-side report: rows, frames per row, tiers, and two
  failures the ordering can regress into: a row that leads below the best tier its colourway owns
  anywhere in the drawer, and a hover that is the same stance.
* `node verification/tools/live-sweep.mjs` — production sweep: every card frame in every collection
  and every product-page gallery frame, checked against the measured tiers *and* against its own box,
  so a deployment cannot quietly fall back to a letterbox, a zoom or a crop. It hovers each card in
  place (the box is measured after the scroll, or the pointer misses and the miss reads as a bug),
  walks the page so lazy frames are fetched before anything is called broken, and tallies what it
  found by kind.
* `node verification/tools/swatch-sweep.mjs` — clicks every swatch on a set of cards and checks the
  photograph each dye swaps to is that dye's own complete figure.
