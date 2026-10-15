#!/usr/bin/env python3
"""Measure every storefront photograph against the crop its surface applies.

    python3 scripts/scan-photo-poses.py [--only <substring>] [--cache <file>]

A card, a product gallery, a search row and a cart line all render a frame inside a box whose
aspect ratio is 333/431, with the photograph scaled to fill it (`object-fit: cover`). Filling that
box trims the picture: a 3:4 frame loses 1.47% of its height at the top and the bottom, and a
square frame loses 11.4% at each side. So "complete" cannot mean "complete in the file" — it has to
mean "complete in the part of the file a card actually shows".

The hash is a 16x16 difference hash (256 bits, written as 64 hex digits): two frames whose hashes
agree within 20 bits are the same pose at another zoom, which is what `order-card-frames.mjs`
refuses to put next to each other.

`--prune` also drops the entries of frames no catalogue renders any more, which keeps the file the
client bundle carries down to exactly the photographs the storefront can still paint.

This scan runs MediaPipe Pose over every frame the catalogues reference, then asks the question the
shelves care about for the *surviving* region:

  2  whole   the head, both shoulders, both hips, both knees and both ankles are inside it, and so
             is a foot — the model is in the picture from crown to sole, nothing is cut
  1  hem     the head, both shoulders and both hips are inside it — the garment being sold is
             entirely visible and the model is not beheaded, but the legs run past the frame
  0  crop    the detector found no model, the head is cut, or the frame is a torso/leg detail

The pose geometry — the joints in body units, the model's size inside the rendered box and the
frame's aspect ratio — goes to `src/lib/photoPoseSignatures.json`. `scripts/order-card-frames.mjs`
uses it to refuse a hover that is the same stance at another zoom, which a difference hash alone
cannot see, and `scripts/audit-photos.ts` fails the build over one.

`src/lib/photoSelection.py` renders 2 first, then 1, and never a 0. The 16x16 difference hash of
each frame goes to `src/lib/photoFrameHashes.json`: two frames whose hashes agree closely are the
same pose of the same model reframed, which is what a hover must never swap to, so the frame
ordering script uses it to drop near-duplicates. A frame that cannot be measured is recorded as 0.
"""
import argparse
import json
import math
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES_OUT = os.path.join(ROOT, "src/lib/photoPoses.json")
HASHES_OUT = os.path.join(ROOT, "src/lib/photoFrameHashes.json")
SIGS_OUT = os.path.join(ROOT, "src/lib/photoPoseSignatures.json")
MODEL = os.environ.get("POSE_MODEL", "/tmp/pose.task")
# MediaPipe's BlazePose index, the joints this storefront's rule is stated in.
INDEX = {"nose": 0, "l_ear": 2, "r_ear": 5, "l_shoulder": 11, "r_shoulder": 12, "l_hip": 23, "r_hip": 24,
         "l_knee": 25, "r_knee": 26, "l_ankle": 27, "r_ankle": 28, "l_heel": 29, "r_heel": 30, "l_foot": 31, "r_foot": 32,
         "l_elbow": 13, "r_elbow": 14, "l_wrist": 15, "r_wrist": 16}
# The joints a pose is compared on, in this order: the arms carry the difference between two shots
# of a standing model, so a frame that is the same pose at another zoom has no movement in them.
SIG_JOINTS = ["l_shoulder", "r_shoulder", "l_elbow", "r_elbow", "l_wrist", "r_wrist",
              "nose", "l_hip", "r_hip", "l_knee", "r_knee"]
SIG_MISSING = 9999
# The box every card, gallery, search row and cart line renders into.
BOX = 333 / 431
# Landmarks have to clear the surviving region by this much to count as inside it.
SAFETY = 0.012
_LONG_EDGE = 620
_ENGINE = None


def rendered_frames():
    """Every frame path the storefront renders, from the three catalogues and the shared pool."""
    paths = set()
    for name in ("shopAllCatalog.json", "newArrivalsCatalog.json", "activewearCatalog.json"):
        data = json.load(open(os.path.join(ROOT, "src/lib", name)))
        rows = data["products"] if isinstance(data, dict) else data
        for row in rows:
            paths.update(row.get("images", []))
    pool = json.load(open(os.path.join(ROOT, "src/lib/photoPool.json")))
    for images in pool.values():
        paths.update(images)
    return paths


def catalogue_frames():
    """`rendered_frames()` plus every frame `order-card-frames.mjs` may still choose from.

    The reference gallery capture records frames an ordering pass has since dropped from the rows —
    they are the photographs a colourway owns but does not currently show, and the ordering script
    reads them again on the next pass. Their verdicts therefore have to be measured and kept, while
    `photoPoses.json`, which ships to the browser, stays the rendered set alone.
    """
    paths = rendered_frames()
    for name in ("referenceGalleryFrames.json", "photoFrameUniverse.json"):
        gallery = os.path.join(ROOT, "src/lib", name)
        if not os.path.exists(gallery):
            continue
        for images in json.load(open(gallery)).values():
            for src in images:
                # Only a frame that is really on disk (or in the download cache) is worth a verdict:
                # a recorded-but-never-delivered path would come back as a crop and stay there.
                if file_for(src):
                    paths.add(src)
    return sorted(paths)


def file_for(src):
    """Where a `/img/...` path lives: the repository, or the out-of-tree download cache."""
    local = os.path.join(ROOT, "public", src.lstrip("/"))
    if os.path.exists(local):
        return local
    cache = os.path.join(os.environ.get("FRAME_CACHE", "/tmp/frames-nar"), os.path.basename(src))
    return cache if os.path.exists(cache) else None


def engine():
    global _ENGINE
    if _ENGINE is None:
        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision
        options = vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=MODEL),
            running_mode=vision.RunningMode.IMAGE, num_poses=1,
            min_pose_detection_confidence=0.25, min_pose_presence_confidence=0.25, min_tracking_confidence=0.25,
        )
        _ENGINE = (mp, vision.PoseLandmarker.create_from_options(options))
    return _ENGINE


def dhash(gray, size=16):
    small = np.asarray(Image.fromarray(gray).resize((size + 1, size), Image.BILINEAR), dtype=np.int16)
    value = 0
    for bit in (small[:, 1:] > small[:, :-1]).flatten():
        value = (value << 1) | int(bit)
    return f"{value:064x}"  # 16 rows x 16 comparisons = 256 bits = 64 hex digits, zero padded


def cover_loss(width, height):
    """How much of each edge a `cover` render into the shared box trims, as a fraction of the frame."""
    aspect = width / height
    if aspect < BOX:                      # narrower than the box: the height is trimmed
        trim = (1 - aspect / BOX) / 2
        return 0.0, trim
    trim = (1 - BOX / aspect) / 2         # wider than the box: the sides are trimmed
    return trim, 0.0


def signature(width, height, landmarks):
    """The model's geometry, in body units, plus how large they stand inside the rendered box.

    Coordinates are measured in pixels, moved so the midpoint of the shoulders sits at the origin and
    divided by the shoulder-to-hip distance (or twice the nose-to-shoulder distance when the hips are
    below the frame), so two photographs of the same pose from the same distance agree whatever the
    file's dimensions are. `scale` is that unit over the height that survives the cover crop: two
    frames whose scales differ are the same pose at another zoom, which is exactly what a hover must
    not look like.
    """
    points = {}
    for name, index in INDEX.items():
        raw = landmarks[index]
        if float(getattr(raw, "visibility", 0.0) or 0.0) >= 0.5:
            points[name] = (float(raw.x) * width, float(raw.y) * height)

    def middle(first, second):
        left, right = points.get(first), points.get(second)
        if left and right:
            return ((left[0] + right[0]) / 2, (left[1] + right[1]) / 2)
        return left or right

    origin = middle("l_shoulder", "r_shoulder")
    if origin is None:
        return None, None
    hips, nose = middle("l_hip", "r_hip"), points.get("nose")
    if hips:
        unit = math.dist(origin, hips)
    elif nose:
        unit = 2 * math.dist(origin, nose)
    else:
        return None, None
    if unit < 8:
        return None, None
    pose = []
    for name in SIG_JOINTS:
        point = points.get(name)
        if point is None:
            pose += [SIG_MISSING, SIG_MISSING]
        else:
            pose += [round((point[0] - origin[0]) / unit * 100), round((point[1] - origin[1]) / unit * 100)]
    _, loss_y = cover_loss(width, height)
    surviving = height * (1 - 2 * loss_y)
    scale = round(unit / surviving, 4) if surviving > 0 else None
    return pose, scale


def classify(src):
    path = file_for(src)
    if path is None:
        return src, 0, None, "missing", None, None, 0  # noqa: SCR001 - a frame that cannot be read is never rendered
    try:
        image = Image.open(path).convert("RGB")
    except Exception as error:  # noqa: BLE001
        return src, 0, None, f"unreadable: {error}"[:60], None, None, 0
    width, height = image.size
    grey = np.asarray(image.convert("L"), dtype=np.uint8)
    digest = dhash(grey)
    scale = _LONG_EDGE / max(width, height)
    probe = image if scale >= 1 else image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.BILINEAR)
    mp, pose = engine()
    result = pose.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(probe, dtype=np.uint8)))
    # A second, independent signal: the subject against the studio backdrop. A flat lay sits in the
    # middle of the frame; a detail shot of a torso or a pair of legs fills it edge to edge. The two
    # are not the same thing, and only the first may render without a model to prove it.
    small = image.resize((160, max(1, int(160 * height / width))), Image.BILINEAR)
    array = np.asarray(small, dtype=np.float32)
    rows, cols = array.shape[:2]
    pad = max(1, int(min(rows, cols) * 0.03))
    border = np.concatenate([array[:pad].reshape(-1, 3), array[-pad:].reshape(-1, 3), array[:, :pad].reshape(-1, 3), array[:, -pad:].reshape(-1, 3)])
    difference = np.abs(array - np.median(border, axis=0)).max(axis=2)
    mask = difference > 26
    coverage = float(mask.mean())
    # A product still floats inside the frame: the subject reaches none of its edges. A photograph of
    # a model — even one the pose detector could not resolve — runs to an edge, and a fabric close-up
    # fills it. Those two are crops as far as a card is concerned: something is cut off.
    ys, xs = np.nonzero(mask)
    if len(ys) < 40:
        flat_still = coverage < 0.02
    else:
        span = (float(xs.min()) / cols, float(xs.max()) / cols, float(ys.min()) / rows, float(ys.max()) / rows)
        floats = span[0] > 0.04 and span[1] < 0.96 and span[2] > 0.04 and span[3] < 0.96
        flat_still = coverage < 0.5 and floats

    if not result.pose_landmarks:
        # No person in the picture. When the frame is a product graphic or a folded garment the scan
        # calls it flat and it renders; when the subject runs to the top edge there is a model in it
        # and the pose simply did not resolve, so it is a crop and nothing else.
        return src, (3 if flat_still else 0), digest, "flat still" if flat_still else "no model", None, None, round(width / height, 4)  # noqa: E501
    points = {}
    for name, index in INDEX.items():
        raw = result.pose_landmarks[0][index]
        points[name] = (float(raw.x), float(raw.y), float(getattr(raw, "visibility", 0.0) or 0.0))
    loss_x, loss_y = cover_loss(width, height)
    low_x, high_x = loss_x + SAFETY, 1 - loss_x - SAFETY
    low_y, high_y = loss_y + SAFETY, 1 - loss_y - SAFETY

    def inside(name):
        x, y, visibility = points[name]
        return visibility >= 0.5 and low_x <= x <= high_x and low_y <= y <= high_y
    head = all(inside(k) for k in ("nose", "l_ear", "r_ear"))
    shoulders = all(inside(k) for k in ("l_shoulder", "r_shoulder"))
    hips = all(inside(k) for k in ("l_hip", "r_hip"))
    legs = all(inside(k) for k in ("l_knee", "r_knee", "l_ankle", "r_ankle"))
    feet = any(inside(k) for k in ("l_heel", "r_heel", "l_foot", "r_foot"))
    pose, scale = signature(width, height, result.pose_landmarks[0])
    aspect = round(width / height, 4)
    if head and shoulders and hips and legs and feet:
        return src, 2, digest, "whole", pose, scale, aspect
    if head and shoulders and hips:
        return src, 1, digest, "hem", pose, scale, aspect
    return src, 0, digest, "head cut" if not head else "incomplete", pose, scale, aspect


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", default="", help="measure only frames whose path contains this")
    parser.add_argument("--cache", default="/tmp/pose-cache.json", help="verdicts to reuse for files that have not changed")
    parser.add_argument("--jobs", type=int, default=min(6, os.cpu_count() or 1))
    parser.add_argument("--write", action="store_true", help="update src/lib/photoPoses.json and the hash file")
    parser.add_argument("--prune", action="store_true", help="drop the frames no catalogue renders any more")
    args = parser.parse_args()

    sources = catalogue_frames()
    if args.only:
        sources = [src for src in sources if args.only in src]
    cache = {}
    if os.path.exists(args.cache):
        cache = json.load(open(args.cache))

    def fingerprint(src):
        path = file_for(src)
        if path is None:
            return "missing"
        stat = os.stat(path)
        return f"{stat.st_size}:{int(stat.st_mtime)}"

    todo, done = [], {}
    for src in sources:
        stamp = fingerprint(src)
        entry = cache.get(src)
        # An entry from a run that did not record the pose geometry is not a hit: the ordering script
        # needs the signature, so those frames are measured again.
        if entry and entry.get("stamp") == stamp and "pose" in entry:
            done[src] = entry
        else:
            todo.append(src)
    print(f"{len(sources)} frames, {len(todo)} to measure, {len(done)} cached")
    if todo:
        with ProcessPoolExecutor(max_workers=args.jobs, initializer=engine) as pool:
            for src, status, digest, why, pose, scale, aspect in pool.map(classify, todo, chunksize=6):
                entry = {"stamp": fingerprint(src), "status": status, "hash": digest, "why": why,
                         "pose": pose, "scale": scale, "aspect": aspect}
                done[src] = entry
                cache[src] = entry
        json.dump(cache, open(args.cache, "w"))

    from collections import Counter
    print("statuses:", dict(Counter(v["status"] for v in done.values())))
    rendered = rendered_frames()
    measured = {src: done[src]["status"] for src in sources if src in rendered and src in done}
    hashes = {src: done[src]["hash"] for src in sources if src in done and done[src]["hash"]}
    measured_sigs = {src: done[src] for src in sources if src in done}
    if args.write:
        # Merge: this scan covers the frames the catalogues render. A verdict for a frame measured
        # by an earlier run and referenced from elsewhere (the lookbook catalogue, say) stays.
        previous = json.load(open(POSES_OUT)) if os.path.exists(POSES_OUT) else {}
        previous_hashes = json.load(open(HASHES_OUT)) if os.path.exists(HASHES_OUT) else {}
        previous_sigs = json.load(open(SIGS_OUT)) if os.path.exists(SIGS_OUT) else {}
        merged = {**previous, **measured}
        merged_hashes = {**previous_hashes, **hashes}
        # A frame with a verdict but no resolved pose still belongs in the file: `t` is what the
        # ordering script reads for a frame the rows do not render today, and a verdict of 0 is a
        # verdict — not a missing one.
        merged_sigs = {**previous_sigs, **{src: {"p": entry.get("pose"), "s": entry.get("scale"), "a": entry.get("aspect"), "t": entry.get("status")}
                                           for src, entry in measured_sigs.items()
                                           if entry.get("pose") is not None or entry.get("scale") is not None or entry.get("status") is not None}}
        if args.prune:
            referenced = set(sources)
            # photoPoses.json only ever carries rendered frames, so the prune is over the rendered set;
            # the signature and hash files keep the whole universe the ordering script may reach for.
            merged = {src: status for src, status in merged.items() if src in rendered}
            merged_hashes = {src: digest for src, digest in merged_hashes.items() if src in referenced}
            merged_sigs = {src: sig for src, sig in merged_sigs.items() if src in referenced}
        json.dump(merged, open(POSES_OUT, "w"), indent=0, sort_keys=True)
        json.dump(merged_hashes, open(HASHES_OUT, "w"), indent=0, sort_keys=True)
        json.dump(merged_sigs, open(SIGS_OUT, "w"), indent=0, sort_keys=True, separators=(",", ":"))
        print(f"wrote {POSES_OUT} ({len(merged)} frames, {len(measured)} re-measured), {HASHES_OUT} ({len(merged_hashes)} hashes) and {SIGS_OUT} ({len(merged_sigs)} poses)")
    else:
        print("dry run — pass --write to update the repository files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
