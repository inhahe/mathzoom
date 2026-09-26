"""
Measure what the pages need from the TeX glyphs, beyond the braces
(reads ../glyphs.json, writes ../metrics.json and ../metrics.js):

- arrowSpan: where the arrow run  ↑↑⋯↑  sits inside the `arrows` glyph (pt,
  relative to its ink box). On the arrows page a level-1 underbrace spans the
  arrows only, as in Graham's diagram, because it counts arrows, not 10s.
  The digits are recognised by sharing their outlines with the `seed` glyph (10).

- bracket: the proportions of TeX's large square bracket, from `lbrack160`
  (pt at 10pt): stem thickness, serif length (the bracket's depth) and serif
  thickness. The brackets page draws square brackets of any length in four
  orientations ([ ] and, turned, the top and bottom brackets) from these.
"""
import json
import sys

from braces import apply, bbox, ctrl_points


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "../glyphs.json"
    g = json.load(open(src))

    # ---- the arrow run inside 10↑↑⋯↑10 ---------------------------------------
    digits = {p["d"] for p in g["seed"]["parts"]}
    run = [p for p in g["arrows"]["parts"] if p["d"] not in digits]
    if len(run) == len(g["arrows"]["parts"]):
        sys.exit("could not tell the digits from the arrows")
    boxes = [bbox(p) for p in run]
    span = [min(b[0] for b in boxes), max(b[2] for b in boxes)]

    # ---- the square bracket -----------------------------------------------------
    parts = g["lbrack160"]["parts"]
    groups = {}
    for p in parts:
        groups.setdefault(p["d"], []).append(p)
    ext_d = max(groups, key=lambda k: len(groups[k]))          # the repeated stem piece
    ex0, _, ex1, _ = bbox(groups[ext_d][0])
    singles = sorted((ps[0] for k, ps in groups.items() if k != ext_d), key=lambda p: bbox(p)[1])
    if len(singles) != 2:
        sys.exit("expected a top and a bottom bracket piece, found %d" % len(singles))
    top = singles[0]
    tx0, ty0, tx1, ty1 = bbox(top)
    # The top piece is an L: its outline's distinct heights are the top edge, the
    # serif's lower edge and the stem's end. The first gap is the serif thickness.
    ys = sorted({round(y, 4) for _, y in apply(top["m"], ctrl_points(top["d"]))})
    serif_t = ys[1] - ys[0]
    bracket = {"stem": ex1 - ex0, "serif": tx1 - tx0, "serifT": serif_t}

    out = {"arrowSpan": span, "bracket": bracket}
    with open("../metrics.json", "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open("../metrics.js", "w") as f:
        f.write("window.METRICS=")
        json.dump(out, f, separators=(",", ":"))
        f.write(";\n")
    print("arrows glyph %.3f pt wide; arrow run x %.3f..%.3f" % (g["arrows"]["w"], *span))
    print("bracket: stem %.3f, serif length %.3f, serif thickness %.3f (distinct y: %s)"
          % (bracket["stem"], bracket["serif"], serif_t, ys[:6]))
    print("wrote ../metrics.json and ../metrics.js")


if __name__ == "__main__":
    main()
