# mathzoom — design

A zoom out through a self-similar typeset formula for an unimaginably large
number, inspired by `D:\pics\misc\math.gif` and `math3.gif`. It starts on the end
of the formula and accelerates geometrically for ever — through a blur, a
stroboscope and pure flicker — until the viewer clicks. Then the number gets its
outermost level, the next one up that can be shown whole, and the zoom stops
there on the finished number. Everything on screen is TeX's own typesetting
(Computer Modern outlines), drawn as vectors, so it stays sharp at every scale.

## Files

| File | Role |
|---|---|
| `index.html` | The page: layout, camera, motion, renderer, main loop. Opens straight from disk (`file://`). |
| `glyphs.js` / `glyphs.json` | Generated: TeX glyph outlines (tower, seed `10`, `⋯`, `⋮`, sample braces). |
| `braces.js` / `braces.json` | Generated: the pieces TeX builds braces from (see *Typesetting*). |
| `tex/glyphs.tex` | Typesets every glyph, one tightly cropped page each. |
| `tex/glyphs.pdf` | Its output; committed so Tectonic is only needed to change the glyphs. |
| `tex/glyphs.py` | PDF → outline paths (`glyphs.json` + `glyphs.js`). |
| `tex/braces.py` | Splits the tallest/widest braces into pieces (`braces.json` + `braces.js`). |
| `preview.html` | Dev aid: draws every glyph large with its measured ink box. |
| `dev/harness.js` | Runs the page's script in Node on a fake canvas (layout/camera/motion/LOD checks). |
| `dev/run-chrome.ps1` | One headless-Chrome run: benchmark title or screenshot. |

## The formula

The notation (from the user's hand-made images) builds huge numbers by nesting:

- **Tower** — `10^{10^{⋰^{10}}}`: a power tower of 10s. Level 0, the base glyph.
- **V-level** (vertical column): children stacked top to bottom, each followed by an
  underbrace; `⋮` between the 2nd and last child; the last underbrace is labelled
  with the seed `10`. Reading: each child's height is the value of the child below
  it, and the bottom one is seeded with 10.
- **H-level** (horizontal row): `c } c } ⋯ } c } 10` — children joined by right
  braces, `⋯ }` between the 2nd and last, seeded with `10` after the last brace.

Levels alternate: tower → V → H → V → H → … Every level shows three explicit
children (first, second, last) plus an ellipsis standing for the rest.

**Why 10s.** The first version used 2s (as in `math.gif`). But every bracket's
picture already shows more than two of what it counts — a tower draws at least
four 10s, a column three children and a `⋮` — so a count of 2 contradicts its own
picture. 10 is the smallest tidy number that doesn't, and using it for the tower's
entries as well keeps the whole thing one uniform number. (`math3.gif` uses 100.)

**Every bracket has a single numeral on its far side** — each level's last brace
is seeded with `10`. That is why the finished number ends the same way: its
outermost level is a row like every even level, with `10` after its last brace.
(`math3.gif` instead ends its top row with a small chain of towers; that would be
the one bracket in the number with a sub-formula on its far side, so it was
deliberately not copied.)

**The outermost row has no ellipsis.** Every other level's `⋯`/`⋮` stands for a
count that the bracket around it sets (a row's length comes from the underbrace
below it, a column's height from the brace beside it). The outermost row has no
bracket around it, so its `⋯` would stand for nothing: it has exactly the three
columns drawn, `col } col } col } 10` — as `math3.gif`'s top row also has no
ellipsis.

**Size.** A tower with 10 on its underbrace is 10↑↑10; a column of c towers is
10↑↑↑(c+1); each further level adds one Knuth arrow (it iterates the level below,
its count set by the bracket around it). So a finished number whose top is level
N is at least 10 ↑^(N+2) 4 — in Conway's chained arrows about 10→4→(N+2), `f_ω`
in the fast-growing hierarchy. Every finished number exceeds Graham's g₁, and any
N one could actually reach (even 10^(10^16), the age of the universe at the
default speed) stays below g₂ — far short of Graham's number g₆₄, let alone
TREE(3) or Rayo's number.

## Exact self-similarity (the "two images" question)

The user proposed a starting image (the concrete end of the formula) plus a purely
recursive image that can be zoomed out of for ever. That is the right idea; worked
out exactly it becomes:

- The pattern repeats every **two** levels (it alternates V/H), not every level.
- **Level 2 — a row — has exactly the tower's aspect ratio.** So level 3 is level 1
  with every tower replaced by a level-2 row filling the same box, and in general
  level n+2 is level n under that substitution. The "starting image" and the
  "recursive image" therefore have the *same layout*; they differ only in what sits
  at the very bottom: towers. Each period shrinks those by 6.1081×, so they fade out
  within a few periods.
- So there is no swap between two pictures. The page composes the recursion itself
  from vector glyphs; two levels further out, the picture is an exact scaled copy
  (×6.1081) of the current one, apart from the vanishing towers.

**Why it is exact — equal growth.** A V-level is `3 + Dv` child-heights tall; an
H-level is `3 + Dh` child-widths wide, where `Dv`, `Dh` are its decorations (braces,
kerns, dots, seed) in the same units — both proportional to the font. Over one
period the aspect ratio is multiplied by `(3 + Dh) / (3 + Dv)`. With TeX's spacing
the decorations differ (57.30 pt of them across a row vs 50.89 pt down a column),
so the picture would drift for ever and never repeat — the first version did,
3.1% per period. The H-levels' font is therefore scaled by `H_SCALE = Dv / Dh`
(0.88817 at the defaults, measured at start-up from trial levels so it follows
`?font` / `?label`). Then `a₂ = a₀` to within 2·10⁻¹⁶ and every level repeats
with period 2 from the start.

## Typesetting

- **Glyphs** are TeX's own: typeset by Tectonic (XeTeX, Computer Modern Type 1),
  extracted as outlines. TeX's rules (the straight runs of `\underbrace`) are
  stroked paths in the PDF and are kept with their stroke width.
- **Extensible braces, built the way TeX builds them.** A tall `\}` is top + repeated
  bar + middle + repeated bar + bottom; an `\underbrace` is two ends, two middle
  halves and rules. `braces.py` keeps TeX's curved pieces verbatim and replaces
  each straight run with one rectangle ("spine", tucked `OV` = 0.6 pt under the
  pieces), so the page can build a brace of any length at any font size.
- **One font scale per level**: `f = font × min(child width, child height)`
  (× `H_SCALE` on H-levels). `font = 1 / tower height` makes level 1 exactly TeX's
  natural 10 pt setting around a natural-size tower; each level's type then suits
  what it encloses. Spacing: TeX's 3 pt `\underbrace` kern; 1.5 pt / 3 pt around
  right braces; the seed at 0.7 f (script style).
- A level `Z²` larger has pieces `Z²` larger and spines `Z²` longer — an exact
  scaled copy, which is what the self-similarity above needs.

## Pipeline

```
cd tex
tectonic -X compile glyphs.tex              # -> glyphs.pdf  (Tectonic: D:\utils\tectonic.exe)
python glyphs.py glyphs.pdf ../glyphs.json  # -> ../glyphs.json, ../glyphs.js  (PyMuPDF)
python braces.py                            # -> ../braces.json, ../braces.js (reads ../glyphs.json)
```

`glyphs.py` measures each glyph's true ink box by rasterising at 24× and re-bases
its paths to it. `braces.py` identifies pieces structurally (the repeated bar is
the most frequent path; rules are the stroked parts) and fails loudly if TeX's
brace construction ever differs from what it expects. Glyphs are looked up by
name (`tower`, `seed`, …), so changing the numeral only touches `glyphs.tex`.

## Camera

- Each level's layout is stored **normalised** (level height = 1): children
  `{x, y, s}` and decorations as O(1) numbers. `LEVELS[0..64]` is built at
  start-up; beyond that `par(n)` reuses level 63 or 64 by parity (the table is
  long only so the zoom centre below has converged).
- **Zoom centre** `C[n]`: the point in the *last* child at every level (next to the
  seed — "the end of the formula"); at level 1 it is the centre of the last tower,
  its underbrace and the seed. It converges geometrically (≈ 1/6.1 per period).
  Until the ending it sits at screen position `(cx, cy)`.
- **Position = the framed level λ.** At λ = N (N even) level N, drawn as the
  finished outermost row, exactly fills the framing box (92% × 84% of the
  viewport), centred. Even level
  n's screen height at λ is `hFit · e^((n − λ)·PERIOD_LOG/2)`, so one unit of λ is
  a zoom of √6.1081 ≈ 2.47× — "one level". The HUD shows λ; the start (the last
  tower + underbrace + seed filling 70% of the height) is λ ≈ 0.95.
- **Wrapping.** From λ = 100 up, nothing below level ~70 is ever visible, and the
  layout repeats every 2 levels, so λ and the top level are shifted down by an even
  amount. Level indices stay small however deep the zoom (10⁸² levels is fine).
- **Top level.** Before the click there is none (the formula continues upward for
  ever). After it, level N has nothing above it: the covering-level search stops
  there and the space around it is white. Level N is drawn with `outerRow(w)`, which
  closes its `⋯ }` up as w goes 0 → 1 (the `⋯` and its brace shrink and fade into
  the gap, the last column slides left), so nothing jumps at the click.
- **Frame**: find the smallest level (≤ top) whose box covers the viewport, draw it
  recursively, culling nodes that are off-screen or under `MIN_PX` (0.8 px) and
  decorations under `MIN_DECO`.

## Motion

**Before the click:** speed `v(t) = v0 · grow^t` levels/s, for ever; distance
`P(t) = v0 (grow^t − 1) / ln grow`, λ = λ_start + P. Defaults `v0 = 0.12`,
`grow = 1.10`/s. At 60 Hz:

| t | speed | what it looks like |
|---|---|---|
| 0–60 s | 0.12 → 37 levels/s | a smooth, accelerating zoom |
| ~65 s | 1/2 period per frame | motion becomes ambiguous: the stroboscope starts |
| ~72 s | 1 period per frame | first moment it appears to stand still |
| 72–120 s | 1 → 100 periods/frame | still / backward / forward beats, ever faster |
| 120 s + | | flicker: each frame an unrelated phase |

**Virtual clock.** Time advances by whole display frames of a steady length (the
median of the last 61 frame intervals), not by the wall clock, whose jitter would
scramble the beats: at 100 periods/frame, 0.1 ms of jitter is 0.6 of a period. A
frame that took several intervals advances several; a hidden tab (no frames) just
pauses.

**Precision.** Distance and speed are kept as logarithms, so nothing overflows
however long it runs. Beyond 10¹² levels a double can't pin the phase within a
period, but the picture is pure flicker long before that, so each frame then
shows a random phase — indistinguishable from the exact one.

**The ending (after the click).** The number gets its top level N: the next row
up that can be shown whole — the first even level at or above both the current
position (plus `D_MIN` = 0.35, so the last moves have a little room) and the
level currently covering the screen (so nothing on screen vanishes). The zoom
carries on unchanged, same accelerating speed, and stops dead the moment level N
fills the framing box. Meanwhile (weight w = smootherstep of the distance
covered) the zoom centre drifts from `(cx, cy)` to where centring level N puts it,
and N's `⋯ }` closes up. The choice uses the frame on screen at the click — in
the flicker, the random phase you clicked on.

- Going fast (from about a minute in), all of that happens by the next frame: the
  picture freezes into the finished number.
- Right at the start it takes a few seconds (click at 0 s → N = 4, stops ~13 s
  later at the still-slow speed); click at 20 s (level 8.2) → N = 10, ~2 s later.

The finished picture is the same for every large N (the layout is periodic and
the towers are far below a pixel); only the number of levels differs.

## Rendering performance

- **Level-of-detail bitmaps**: a node smaller than `CACHE_PX` (96 CSS px) is drawn
  as one bitmap instead of recursing into its thousands of near-sub-pixel
  descendants. Bitmaps are rendered by the same vector code at the next
  half-octave size at or above the node (so at most a 1/√2 downscale — they match
  what the vectors would draw), frozen as `ImageBitmap`s, built lazily. Levels
  below `LOD_LEVEL` (10) each get their own; at or above it two shared families
  (V and H) serve the whole infinite tail — valid because the layout is periodic
  and the towers are ≤ 6.1⁻⁵ of such a node, i.e. invisible.
  Effect: the tail went from ~3300 nodes / ~55 ms per frame to ~20–50 nodes /
  2–4 ms, worst run 6.5 ms (headless Chrome, software rendering, on a fully
  loaded CPU).
- Setting a canvas's size clears it, so the canvas is resized only immediately
  before a redraw (checked every frame, including devicePixelRatio changes).

## Controls and URL parameters

- **Click**: end it — the zoom stops at the next level where the whole number
  fits. Once it has stopped, click again to start over. **Space** / `P`: pause.
  **R**: restart. The corner shows the level; at the end, how many levels the
  number has.
- `?font=` (default 1 / tower height), `?label=` (0.7): type size, seed size.
- `?v0=` (0.12), `?grow=` (1.10): the zoom speed.
- `?cx=`, `?cy=` (0.62, 0.60): where on screen the zoom centre sits.
- `?t=N` (testing): show time N; with `&click=C`, as if clicked at time C.
  `&bench`: time 60 renders of that frame, result in the page title. In these test
  modes errors also go to the title.

## Testing

- `node dev/harness.js <t> [--click C] [--size WxH] [--levels] [--iter N]` — runs
  the page's script against a recording fake canvas: camera, HUD, node/fill/bitmap
  counts, cache reuse, and with `--levels` every level's aspect ratio (must repeat
  with period 2). `--trace a:b:s` (with `--click`) prints the camera and HUD over
  time — how the examples above were measured.
- `dev\run-chrome.ps1 -Query "t=40&click=20"` with `-Shot out.png`, or
  `-Query "t=30&bench"` — one headless-Chrome run with a throwaway profile and a
  PID-scoped timeout.
- The `?t=` mode draws with `setTimeout`, not `requestAnimationFrame`: headless
  Chrome under `--virtual-time-budget` does not reliably deliver animation frames.
  Its virtual clock also only advances while the page is idle, so on a heavily
  loaded machine runs can stall — a timeout there is not a page bug.
