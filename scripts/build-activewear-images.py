#!/usr/bin/env python3
"""Materialise the Activewear photography into `public/img/aw/**`.

    /tmp/venv/bin/python scripts/build-activewear-images.py

`src/lib/activewearImages.json` (written by `scripts/build-activewear.mjs`) maps every image
key the collection references to the reference's own file URL. The bytes are already in the
workspace — `relay/aw` (hash-named pulls + `manifest.json`), `relay/aw2` (the same pulls under
their original file names) and `relay/brand-activewear.zip` (the saved reference page, which
carries every swatch, rail tile, editorial and mega-menu photograph) — so this converts the
local original into webp at the key's own path instead of re-downloading anything.

Nothing is invented: a key with no local original is reported and left alone.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RELAY = ROOT / "relay"
OUT = ROOT / "public" / "img"
ZIP = RELAY / "brand-activewear.zip"

# Card photographs are displayed at 333px wide (666px on retina); editorial and mega-menu
# tiles run full-bleed, so they keep more pixels.
PHOTO_MAX = 1200
PHOTO_QUALITY = 78
WIDE_MAX = 1800
WIDE_QUALITY = 80
SWATCH_MAX = 400
SWATCH_QUALITY = 90


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = re.sub(r" \(\d+\)$", "", value)
    value = re.sub(r"\.(jpg|jpeg|png|webp|gif|svg)$", "", value, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def basename(url: str) -> str:
    return url.split("?")[0].split("/")[-1]


def prefix_source(key: str, index: dict[str, Path]) -> Path | None:
    """A saved page truncates long file names (`…-2385_3036f0ac-.jpg`), so fall back to a
    prefix match once the whole name has no original."""
    for candidate, path in index.items():
        if len(candidate) < 40:
            continue
        if key.startswith(candidate) or candidate.startswith(key):
            return path
    return None


def build_index() -> dict[str, Path]:  # noqa: D401
    """normalised file name -> the best local original we hold."""
    index: dict[str, Path] = {}
    for base in (RELAY / "aw2", RELAY / "aw"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                index.setdefault(norm(path.name), path)
    # the hash-named pulls keep their original file names in the manifest
    manifest = RELAY / "aw" / "manifest.json"
    if manifest.exists():
        data = json.loads(manifest.read_text())
        for entry in data.get("images", []) + data.get("extras", []):
            local = RELAY.parent / entry["local"] if not entry["local"].startswith("/") else Path("/") / entry["local"]
            candidates = [local, ROOT / entry["local"]]
            for candidate in candidates:
                if candidate.exists():
                    index.setdefault(norm(entry["file"]), candidate)
                    break
    for path in (ROOT / "public" / "img").rglob("*"):
        if path.is_file():
            index.setdefault(norm(path.name), path)
    return index


def zip_entries() -> dict[str, str]:
    out: dict[str, str] = {}
    with zipfile.ZipFile(ZIP) as archive:
        for name in archive.namelist():
            if name.endswith("/"):
                continue
            out.setdefault(norm(Path(name).name), name)
    return out


def settings_for(key: str) -> tuple[int, int]:
    if key.startswith("aw/color/") or key.startswith("aw/group/"):
        return SWATCH_MAX, SWATCH_QUALITY
    if key.startswith("aw/nav/") or key.startswith("aw/mega/"):
        return WIDE_MAX, WIDE_QUALITY
    if key.startswith("aw/editorial/"):
        return WIDE_MAX, WIDE_QUALITY
    return PHOTO_MAX, PHOTO_QUALITY


def save(image: Image.Image, dest: Path, max_width: int, quality: int) -> None:
    image = image.convert("RGBA" if image.mode in {"RGBA", "LA", "P"} else "RGB")
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=quality, method=6)


def main() -> int:
    mapping = json.loads((ROOT / "src" / "lib" / "activewearImages.json").read_text())
    index = build_index()
    zipped = zip_entries()
    written = skipped = 0
    missing: list[str] = []
    total = 0
    with zipfile.ZipFile(ZIP) as archive:
        for key, url in sorted(mapping.items()):
            dest = OUT / key
            if dest.exists():
                skipped += 1
                total += dest.stat().st_size
                continue
            name = basename(url)
            source = index.get(norm(name))
            max_width, quality = settings_for(key)
            if source is not None:
                with Image.open(source) as image:
                    save(image, dest, max_width, quality)
                written += 1
                total += dest.stat().st_size
                continue
            source = prefix_source(norm(name), index)
            if source is not None:
                with Image.open(source) as image:
                    save(image, dest, max_width, quality)
                written += 1
                total += dest.stat().st_size
                continue
            entry = zipped.get(norm(name))
            if entry is not None:
                with archive.open(entry) as handle, Image.open(handle) as image:
                    save(image, dest, max_width, quality)
                written += 1
                total += dest.stat().st_size
                continue
            missing.append(f"{key} <- {name}")
    print(f"written {written} · already present {skipped} · missing {len(missing)}")
    print(f"total {total / 1_048_576:.1f} MB under public/img/aw")
    for item in missing[:20]:
        print("  MISSING", item)
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
