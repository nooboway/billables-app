#!/usr/bin/env python3
"""
normalize_invoices.py — convert a folder of mixed invoice files
(PDF / PNG / JPG / JPEG / WebP / TIFF) into a folder of uniform PDFs.

Mirrors the in-app JavaScript unifier (src/lib/fileUnify.ts) for batch
or offline work. Useful for:
  • Building test fixtures for the in-app importer (uploads/ → fixtures/)
  • Bulk-converting a year of scanned receipts before bulk-importing
  • Standardizing a vendor's mixed-format archive

Image files are wrapped one-image-per-page sized to the image's
natural pixel dimensions so nothing is cropped or stretched.

Usage
-----
    python scripts/normalize_invoices.py SRC_DIR OUT_DIR [--quality 92]

Arguments
---------
    SRC_DIR        Directory containing input files (recursed).
    OUT_DIR        Where to write the normalized .pdf files.
                   Created if it does not exist. Output filenames
                   mirror the input stems (foo.jpg -> foo.pdf).
    --quality N    JPEG quality for the image-embed pass (1-100,
                   default 92).
    --overwrite    Replace existing .pdf files in OUT_DIR (default
                   skips them).
    --dry-run      Print what would happen, write nothing.

Dependencies
------------
    pip install pypdf pillow

This script does NOT depend on the Node app or run from inside it.
It exits with a non-zero status if any file fails.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}
PDF_EXTS = {".pdf"}


def _require(module: str, pip_name: str | None = None) -> None:
    try:
        __import__(module)
    except ImportError as e:
        print(
            f"error: missing dependency '{module}'.\n"
            f"       install with: pip install {pip_name or module}",
            file=sys.stderr,
        )
        raise SystemExit(2) from e


def normalize_image_to_pdf(src: Path, dst: Path, quality: int) -> None:
    """Wrap a single image into a one-page PDF sized to its native px."""
    from PIL import Image  # type: ignore[import-not-found]

    img = Image.open(src)
    # Pillow's save(format='PDF') wants RGB / L; flatten transparency.
    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")
    img.save(dst, format="PDF", resolution=72.0, quality=quality)


def passthrough_pdf(src: Path, dst: Path) -> None:
    """Copy a PDF as-is. (No re-encoding; preserves text layer.)"""
    shutil.copyfile(src, dst)


def collect(src_dir: Path) -> list[Path]:
    files: list[Path] = []
    for p in sorted(src_dir.rglob("*")):
        if not p.is_file():
            continue
        if p.suffix.lower() in IMAGE_EXTS | PDF_EXTS:
            files.append(p)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Normalize a folder of mixed PDFs / images into uniform PDFs.",
    )
    parser.add_argument("src", type=Path, help="Source directory")
    parser.add_argument("out", type=Path, help="Output directory")
    parser.add_argument("--quality", type=int, default=92, help="JPEG embed quality (1-100)")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing PDFs in out/")
    parser.add_argument("--dry-run", action="store_true", help="Print only, write nothing")
    args = parser.parse_args()

    if not args.src.is_dir():
        print(f"error: source directory not found: {args.src}", file=sys.stderr)
        return 2

    files = collect(args.src)
    if not files:
        print(f"no .pdf / image files under {args.src}")
        return 0

    # Lazy-require Pillow only if we hit at least one image input.
    if any(p.suffix.lower() in IMAGE_EXTS for p in files):
        _require("PIL", "pillow")

    args.out.mkdir(parents=True, exist_ok=True)

    failures = 0
    written = 0
    skipped = 0
    for p in files:
        dst = args.out / (p.stem + ".pdf")
        if dst.exists() and not args.overwrite:
            print(f"skip  {p.name}  -> {dst.name} (exists; pass --overwrite to replace)")
            skipped += 1
            continue
        action = "PDF (pass-through)" if p.suffix.lower() in PDF_EXTS else "image -> PDF"
        if args.dry_run:
            print(f"would {action:<22}{p.name}  ->  {dst.name}")
            continue
        try:
            if p.suffix.lower() in PDF_EXTS:
                passthrough_pdf(p, dst)
            else:
                normalize_image_to_pdf(p, dst, args.quality)
            print(f"ok    {action:<22}{p.name}  ->  {dst.name}")
            written += 1
        except Exception as e:  # noqa: BLE001 — surface anything sensibly
            print(f"FAIL  {p.name}: {e}", file=sys.stderr)
            failures += 1

    if args.dry_run:
        print(f"\ndry run · {len(files)} file(s) would be processed")
    else:
        print(f"\nwritten: {written}    skipped: {skipped}    failed: {failures}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
