"""
Convert glyphs.pdf (one tightly-cropped TeX glyph per page) into glyphs.json.

For each page we ask PyMuPDF for an SVG with text rendered as outline paths,
flatten that SVG's <use>/<g transform> nesting into a flat list of
(path data, 2x3 matrix) parts, and measure the true ink bounding box by
rasterising at high resolution. Parts are re-based so the ink box starts at
(0,0); the page's own crop box is TeX's box, which can include invisible
phantom space (e.g. the \\vphantom that sizes a brace).

Output: { name: { "w": ink width, "h": ink height, "parts": [ {"d":..., "m":[a,b,c,d,e,f]} ] } }
Units are TeX points. The page renders each glyph by, for each part,
transform(m) then fill(Path2D(d)).
"""
import json
import re
import sys
import xml.etree.ElementTree as ET

import pymupdf

NAMES = [
    "tower", "seed", "cdots", "vdots",
    "rbrace20", "rbrace40", "rbrace80", "rbrace160",
    "ubrace30", "ubrace60", "ubrace120", "ubrace240",
]

SVGNS = "{http://www.w3.org/2000/svg}"
XLINK = "{http://www.w3.org/1999/xlink}href"


def mat_mul(a, b):
    """Compose 2x3 affine matrices: result = a then... applied as a*b (b first)."""
    a0, a1, a2, a3, a4, a5 = a
    b0, b1, b2, b3, b4, b5 = b
    return [
        a0 * b0 + a2 * b1, a1 * b0 + a3 * b1,
        a0 * b2 + a2 * b3, a1 * b2 + a3 * b3,
        a0 * b4 + a2 * b5 + a4, a1 * b4 + a3 * b5 + a5,
    ]


IDENT = [1, 0, 0, 1, 0, 0]


def parse_transform(s):
    """Parse an SVG transform attribute into a single 2x3 matrix."""
    if not s:
        return IDENT
    m = IDENT
    for kind, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s):
        v = [float(x) for x in re.split(r"[\s,]+", args.strip()) if x]
        if kind == "matrix":
            t = v
        elif kind == "translate":
            t = [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0]
        elif kind == "scale":
            sx = v[0]
            sy = v[1] if len(v) > 1 else sx
            t = [sx, 0, 0, sy, 0, 0]
        else:
            raise ValueError("unsupported transform %s" % kind)
        m = mat_mul(m, t)
    return m


def flatten(svg_text):
    root = ET.fromstring(svg_text)
    defs = {}
    for el in root.iter():
        if el.tag == SVGNS + "path" and el.get("id"):
            defs[el.get("id")] = el
    parts = []

    def walk(el, m, in_defs):
        tag = el.tag.replace(SVGNS, "")
        if tag in ("defs", "clipPath", "mask"):
            return  # definitions are only drawn when referenced by <use>
        mm = mat_mul(m, parse_transform(el.get("transform")))
        if tag == "path" and not in_defs and el.get("d"):
            fill = el.get("fill", "")
            stroke = el.get("stroke", "")
            if fill != "none":
                parts.append({"d": el.get("d"), "m": mm})
            elif stroke and stroke != "none":
                # A stroked path, e.g. the \leaders\vrule segments TeX uses to join
                # the curved pieces of an \underbrace. Skipping these leaves gaps.
                # stroke-width is in this element's own user space, which the
                # renderer reproduces by applying m before stroking.
                parts.append({"d": el.get("d"), "m": mm,
                              "sw": float(el.get("stroke-width", "1"))})
        elif tag == "use":
            ref = (el.get(XLINK) or el.get("href") or "").lstrip("#")
            target = defs.get(ref)
            if target is not None:
                x = float(el.get("x", 0) or 0)
                y = float(el.get("y", 0) or 0)
                um = mat_mul(mm, [1, 0, 0, 1, x, y])
                tm = mat_mul(um, parse_transform(target.get("transform")))
                parts.append({"d": target.get("d"), "m": tm})
        for ch in el:
            walk(ch, mm, in_defs)

    walk(root, IDENT, False)
    return parts


def ink_bbox(page, zoom=24):
    """Tight bbox of dark pixels, in PDF points."""
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False, colorspace=pymupdf.csGRAY)
    w, h, s = pix.width, pix.height, pix.samples
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        row = s[y * w:(y + 1) * w]
        if min(row) < 128:
            xs = [i for i, v in enumerate(row) if v < 128]
            x0 = min(x0, xs[0]); x1 = max(x1, xs[-1])
            y0 = min(y0, y); y1 = y
    if x1 < 0:
        return None
    r = page.rect
    return (r.x0 + x0 / zoom, r.y0 + y0 / zoom, r.x0 + (x1 + 1) / zoom, r.y0 + (y1 + 1) / zoom)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "glyphs.pdf"
    out = sys.argv[2] if len(sys.argv) > 2 else "glyphs.json"
    doc = pymupdf.open(src)
    if doc.page_count != len(NAMES):
        sys.exit("expected %d pages, got %d" % (len(NAMES), doc.page_count))
    result = {}
    for page, name in zip(doc, NAMES):
        svg = page.get_svg_image(text_as_path=True)
        parts = flatten(svg)
        bb = ink_bbox(page)
        if bb is None:
            sys.exit("page for %s has no ink" % name)
        bx0, by0, bx1, by1 = bb
        shift = [1, 0, 0, 1, -bx0, -by0]
        for p in parts:
            p["m"] = [round(v, 5) for v in mat_mul(shift, p["m"])]
        result[name] = {"w": round(bx1 - bx0, 5), "h": round(by1 - by0, 5), "parts": parts}
        print("%-10s ink %7.3f x %7.3f pt   %d part(s)" % (name, bx1 - bx0, by1 - by0, len(parts)))
    with open(out, "w") as f:
        json.dump(result, f, separators=(",", ":"))
    # Also emit a script so index.html works from file:// (fetch() of a local
    # JSON file is blocked there by the browser's same-origin rules).
    js = out[:-5] + ".js" if out.endswith(".json") else out + ".js"
    with open(js, "w") as f:
        f.write("window.GLYPHS=")
        json.dump(result, f, separators=(",", ":"))
        f.write(";\n")
    print("wrote", out, "and", js)


if __name__ == "__main__":
    main()
