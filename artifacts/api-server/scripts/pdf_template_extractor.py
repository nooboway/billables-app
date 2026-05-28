#!/usr/bin/env python3
"""
pdf_template_extractor.py
Read a PDF invoice and extract visual template properties:
- Dominant background color
- Brand / accent color
- Embedded logo image (first suitable image on page 1)
- Font style hint (serif / sans / mono)
- Suggested template type from the app's set
- Color palette (top 5 distinct non-neutral colors)

Usage:  python3 pdf_template_extractor.py <path_to_pdf>
Output: JSON to stdout
"""

import sys
import json
import base64
from collections import Counter
import fitz  # PyMuPDF


def rgb_to_hex(r, g, b):
    return "#{:02x}{:02x}{:02x}".format(int(r), int(g), int(b))


def luminance(r, g, b):
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def is_near_white(r, g, b, t=220):
    return r > t and g > t and b > t


def is_near_black(r, g, b, t=35):
    return r < t and g < t and b < t


def is_gray(r, g, b, tol=22):
    return abs(int(r) - int(g)) < tol and abs(int(g) - int(b)) < tol


def color_distance(c1, c2):
    return sum(abs(int(a) - int(b)) for a, b in zip(c1, c2))


def extract_template(pdf_path):
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return {"error": str(e)}

    if len(doc) == 0:
        return {"error": "PDF has no pages"}

    page = doc[0]

    # ── Render page at low resolution for color sampling ──────────────────────
    mat = fitz.Matrix(0.4, 0.4)
    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB, alpha=False)

    # Sample every 5th pixel
    samples = []
    step = 5
    for y in range(0, pix.height, step):
        for x in range(0, pix.width, step):
            r, g, b = pix.pixel(x, y)
            # Quantize to 8-step buckets for grouping
            samples.append((r & 0xF8, g & 0xF8, b & 0xF8))

    counter = Counter(samples)
    most_common = counter.most_common(30)

    # ── Background color (most frequent) ─────────────────────────────────────
    bg_color = most_common[0][0]
    bg_hex = rgb_to_hex(*bg_color)
    bg_lum = luminance(*bg_color)
    is_dark_bg = bg_lum < 0.35

    # ── Accent color (most frequent non-neutral) ──────────────────────────────
    accent_color = None
    for color, _ in most_common:
        r, g, b = color
        if is_near_white(r, g, b) or is_near_black(r, g, b) or is_gray(r, g, b):
            continue
        # Skip if too similar to background
        if color_distance(color, bg_color) < 30:
            continue
        accent_color = color
        break

    accent_hex = rgb_to_hex(*accent_color) if accent_color else "#E54A13"

    # ── Color palette (up to 5 distinct non-neutral) ──────────────────────────
    palette = []
    seen = []
    for color, _ in most_common:
        r, g, b = color
        if is_near_white(r, g, b) or is_near_black(r, g, b) or is_gray(r, g, b):
            continue
        if any(color_distance(color, s) < 40 for s in seen):
            continue
        palette.append(rgb_to_hex(r, g, b))
        seen.append(color)
        if len(palette) >= 5:
            break

    # ── Logo extraction (first embedded image of reasonable size) ─────────────
    logo_data_url = None
    try:
        images = page.get_images(full=True)
        for img_ref in images[:5]:
            xref = img_ref[0]
            base_image = doc.extract_image(xref)
            if not base_image:
                continue
            w, h = base_image.get("width", 0), base_image.get("height", 0)
            ext = base_image.get("ext", "")
            # Accept reasonably sized images in common formats
            if w >= 20 and h >= 20 and ext in ("png", "jpeg", "jpg", "webp"):
                b64 = base64.b64encode(base_image["image"]).decode("utf-8")
                mime = "image/jpeg" if ext in ("jpeg", "jpg") else f"image/{ext}"
                logo_data_url = f"data:{mime};base64,{b64}"
                break
    except Exception:
        pass

    # ── Font detection ────────────────────────────────────────────────────────
    fonts = set()
    try:
        blocks = page.get_text("dict").get("blocks", [])
        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    fn = span.get("font", "").lower()
                    if fn:
                        fonts.add(fn)
    except Exception:
        pass

    has_serif = any(
        kw in f for f in fonts
        for kw in ("serif", "georgia", "times", "garamond", "palatino", "didot", "bodoni")
    )
    has_mono = any(
        kw in f for f in fonts
        for kw in ("mono", "courier", "code", "consolas", "inconsolata")
    )
    font_style = "serif" if has_serif else ("mono" if has_mono else "sans")

    # ── Template suggestion ───────────────────────────────────────────────────
    # Stripe / Modern → dark bg; Wardiere → serif; Classic → colorful accent; Simple → default
    if is_dark_bg:
        suggested = "Stripe" if not has_serif else "Modern"
    elif has_serif:
        suggested = "Wardiere"
    elif accent_color and not is_gray(*accent_color):
        suggested = "Classic"
    else:
        suggested = "Simple"

    doc.close()

    result = {
        "bgColor": bg_hex,
        "accentColor": accent_hex,
        "textColor": "#1c1917" if not is_dark_bg else "#f5f5f4",
        "isDark": is_dark_bg,
        "fontStyle": font_style,
        "suggestedTemplate": suggested,
        "colorPalette": palette,
        "fontsDetected": list(fonts)[:6],
    }

    if logo_data_url:
        result["logoDataUrl"] = logo_data_url

    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: pdf_template_extractor.py <pdf_path>"}))
        sys.exit(1)

    output = extract_template(sys.argv[1])
    print(json.dumps(output))
