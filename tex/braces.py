"""
Split TeX's assembled braces into their pieces so the page can build a brace of
ANY length at any stroke weight — exactly the way TeX's extensible characters work.

TeX builds a tall right brace as  top + ext* + middle + ext* + bottom  (cmex10),
and an underbrace as  left-end, rule, two middle pieces, rule, right-end.
The curved pieces are fixed shapes; only the straight runs (the repeated `ext`
bar, or the rules) stretch. We keep TeX's curved pieces verbatim and replace each
straight run with a single rectangle, so a brace of length L is:

    pieces drawn at their TeX positions, re-anchored for length L
  + one filled "spine" rectangle underneath, joining them.

Because the pieces keep a fixed size for a given font scale and only the spine
stretches, the stroke weight follows the text size — and a level Z^2 larger has
pieces Z^2 larger AND a spine Z^2 longer, i.e. an exact scaled copy. That is what
keeps the infinite zoom self-similar.

Reads glyphs.json (from glyphs.py), writes braces.json and braces.js.
"""
import json
import re
import sys


def tokens(d):
    for m in re.finditer(r"[MLCZmlcz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", d):
        yield m.group(0)


def ctrl_points(d):
    """All points of an absolute M/L/C/Z path, including Bezier control points.
    The control-point hull contains the curve, so its bbox is a safe outer bound;
    for the straight bars and rules we measure, it is exact."""
    pts, cmd, buf = [], None, []
    need = {"M": 2, "L": 2, "C": 6}
    for t in tokens(d):
        if t in "MLCZmlcz":
            if t in "mlc":
                raise ValueError("relative path commands are not expected here")
            cmd = t.upper()
            buf = []
            continue
        buf.append(float(t))
        if cmd in need and len(buf) == need[cmd]:
            pts.extend(zip(buf[0::2], buf[1::2]))
            buf = []
    return pts


def apply(m, pts):
    a, b, c, d, e, f = m
    return [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]


def bbox(part):
    p = apply(part["m"], ctrl_points(part["d"]))
    xs, ys = [q[0] for q in p], [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "../glyphs.json"
    g = json.load(open(src))

    # ---- right brace, from the tallest one (it has every piece) -------------
    rb = g["rbrace160"]
    groups = {}
    for p in rb["parts"]:
        groups.setdefault(p["d"], []).append(p)
    ext_d = max(groups, key=lambda k: len(groups[k]))       # the repeated bar
    singles = [ps[0] for k, ps in groups.items() if k != ext_d]
    singles.sort(key=lambda p: bbox(p)[1])                   # top, middle, bottom
    if len(singles) != 3:
        sys.exit("expected 3 distinct right-brace pieces, found %d" % len(singles))
    top, mid, bot = singles
    ext = groups[ext_d][0]
    ex0, _, ex1, _ = bbox(ext)                               # spine x-range
    rbrace = {
        "L": rb["h"], "w": rb["w"],
        "top": top, "mid": mid, "bot": bot,
        "spine": [ex0, ex1],
        "topY": bbox(top)[1:4:2], "midY": bbox(mid)[1:4:2], "botY": bbox(bot)[1:4:2],
    }

    # ---- underbrace, from the widest one ------------------------------------
    ub = g["ubrace240"]
    glyphs_ = [p for p in ub["parts"] if "sw" not in p]
    rules = [p for p in ub["parts"] if "sw" in p]
    glyphs_.sort(key=lambda p: bbox(p)[0])                   # left..right
    if len(glyphs_) != 4 or len(rules) != 2:
        sys.exit("expected 4 underbrace pieces + 2 rules, found %d + %d" % (len(glyphs_), len(rules)))
    left, midL, midR, right = glyphs_
    # A rule is a stroked horizontal line: its y and half its stroke width give the
    # spine's vertical extent.
    r0 = apply(rules[0]["m"], ctrl_points(rules[0]["d"]))
    ry = sum(q[1] for q in r0) / len(r0)
    half = rules[0]["sw"] / 2 * abs(rules[0]["m"][3])
    ubrace = {
        "L": ub["w"], "h": ub["h"],
        "left": left, "midL": midL, "midR": midR, "right": right,
        "spine": [ry - half, ry + half],
        "leftX": bbox(left)[0:3:2], "midX": [bbox(midL)[0], bbox(midR)[2]], "rightX": bbox(right)[0:3:2],
    }

    out = {"rbrace": rbrace, "ubrace": ubrace}
    with open("../braces.json", "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open("../braces.js", "w") as f:
        f.write("window.BRACES=")
        json.dump(out, f, separators=(",", ":"))
        f.write(";\n")

    print("right brace  L=%.3f w=%.3f  spine x %.3f..%.3f" % (rbrace["L"], rbrace["w"], ex0, ex1))
    for k in ("topY", "midY", "botY"):
        print("   %-5s y %.3f..%.3f" % (k, *rbrace[k]))
    print("underbrace   L=%.3f h=%.3f  spine y %.3f..%.3f" % (ubrace["L"], ubrace["h"], *ubrace["spine"]))
    for k in ("leftX", "midX", "rightX"):
        print("   %-6s x %.3f..%.3f" % (k, *ubrace[k]))
    print("wrote ../braces.json and ../braces.js")


if __name__ == "__main__":
    main()
