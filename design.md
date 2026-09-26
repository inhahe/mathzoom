# mathzoom — design

An infinite, accelerating zoom-out through a self-similar typeset formula for an
unimaginably large number, inspired by `D:\pics\misc\math.gif` and `math3.gif`.
Everything on screen is TeX's own typesetting (Computer Modern outlines), drawn
as vectors, so it stays sharp at every scale.

## Files

| File | Role |
|---|---|
| `index.html` | The page: layout, camera, renderer, main loop. Opens straight from disk (`file://`). |
| `glyphs.js` / `glyphs.json` | Generated: TeX glyph outlines (tower, seed `2`, `⋯`, `⋮`, sample braces). |
| `braces.js` / `braces.json` | Generated: the pieces TeX builds braces from (see *Typesetting*). |
| `tex/glyphs.tex` | Typesets every glyph, one tightly cropped page each. |
| `tex/glyphs.pdf` | Its output; committed so Tectonic is only needed to change the glyphs. |
| `tex/glyphs.py` | PDF → outline paths (`glyphs.json` + `glyphs.js`). |
| `tex/braces.py` | Splits the tallest/widest braces into pieces (`braces.json` + `braces.js`). |
| `preview.html` | Dev aid: draws every glyph large with its measured ink box. |
| `dev/harness.js` | Runs the page's script in Node on a fake canvas (layout/camera/LOD checks). |
| `dev/run-chrome.ps1` | One headless-Chrome run: benchmark title or screenshot. |

## The formula

The notation (from the user's hand-made images) builds huge numbers by nesting:

- **Tower** — `2^{2^{⋰^{2}}}`: a power tower of 2s. Level 0, the base glyph.
- **V-level** (vertical column): children stacked top to bottom, each followed by an
  underbrace; `⋮` between the 2nd and last child; the last underbrace is labelled
  with the seed `2`. Reading: each child's height is the value of the child below
  it, and the bottom one is seeded with 2.
- **H-level** (horizontal row): `c } c } ⋯ } c } 2` — children joined by right braces,
  `⋯ }` between the 2nd and last, seeded with `2` after the last brace.

Levels alternate: tower → V → H → V → H → … Every level shows three explicit
children (first, second, last) plus an ellipsis standing for the rest.

## Exact self-similarity (the "two images" question)

The user proposed a starting image (the concrete end of the formula) plus a purely
recursive image that can be zoomed out of for ever. That is the right idea; worked
out exactly it becomes:

- The pattern repeats every **two** levels (it alternates V/H), not every level.
- **Level 2 — a row — has exactly the tower's aspect ratio.** So level 3 is level 1
  with every tower replaced by a level-2 row filling the same box, and in general
  level n+2 is level n under that substitution. The "starting image" and the
  "recursive image" therefore have the *same layout*; they differ only in what sits
  at the very bottom: towers. Each period shrinks those by 6.1064×, so they fade out
  within a few periods.
- So there is no swap between two pictures. The page composes the recursion itself
  from vector glyphs; two levels further out, the picture is an exact scaled copy
  (×6.1064) of the current one, apart from the vanishing towers.

**Why it is exact — equal growth.** A V-level is `3 + Dv` child-heights tall; an
H-level is `3 + Dh` child-widths wide, where `Dv`, `Dh` are its decorations (braces,
kerns, dots, seed) in the same units — both proportional to the font. Over one
period the aspect ratio is multiplied by `(3 + Dh) / (3 + Dv)`. With TeX's spacing
the decorations differ (53.98 pt of them across a row vs 50.87 pt down a column),
and the first version drifted
3.1% per period for ever (level aspect 0.182 at level 1, 0.471 at level 63 — never
converging). The H-levels' font is therefore scaled by `H_SCALE = Dv / Dh`
(0.94234 at the defaults, measured at start-up from trial levels so it follows
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
  (× `H_SCALE` on H-levels). `font = 1/16.375` makes level 1 exactly TeX's natural
  10 pt setting around a natural-size tower; each level's type then suits what it
  encloses. Spacing: TeX's 3 pt `\underbrace` kern; 1.5 pt / 3 pt around right
  braces; the seed at 0.7 f (script style).
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
brace construction ever differs from what it expects.

## Rendering

- Each level's layout is stored **normalised** (level height = 1): children
  `{x, y, s}` and decorations as O(1) numbers, so nothing overflows however deep
  the zoom goes. `LEVELS[0..64]` is built at start-up; beyond that `par(n)` reuses
  level 63 or 64 by parity (the layout is periodic anyway — the table is long only
  so the zoom centre below has converged).
- **Zoom centre** `C[n]`: the point in the *last* child at every level (next to the
  seed — "the end of the formula"); at level 1 it is the centre of the last tower,
  its underbrace and the seed. It converges geometrically (≈ 1/6.1 per period).
- **Camera in log space**: `(K, h)` = a reference level and its screen height.
  `LH[n]` is the log-height of level n and `PERIOD_LOG = ln 6.1064` one period;
  an H-level is no taller than its children (height growth exactly 1), so levels
  are chosen by log-height, never by assuming growth per level.
- **Frame**: find the smallest level whose box covers the viewport, draw it
  recursively, culling nodes that are off-screen or under `MIN_PX` (0.8 px) and
  decorations under `MIN_DECO`.
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

## Zoom speed

Speed in levels per second grows geometrically, `v(t) = v0 · grow^t`, capped at
`vmax`. Defaults: `v0 = 0.12`, `grow = 1.10`/s, `vmax = 1.6` — slow enough at first
to read the end of the formula, reaching the cap after ~27 s (around level 16.5).
At the cap one period (×6.1) passes every 1.25 s, ≈ ×4.25 zoom per second. The cap
exists because past it a self-similar picture changes too much between frames and
just strobes; `?vmax=` raises it.

## Controls and URL parameters

- Click: pause / resume. `R`: restart. The corner shows the current level.
- `?font=` (default 1/16.375), `?label=` (0.7): type size, seed size.
- `?v0=`, `?grow=`, `?vmax=`: zoom speed (above).
- `?cx=`, `?cy=` (0.62, 0.60): where on screen the zoom centre sits.
- `?t=N`: freeze at time N (testing); `?t=N&bench`: time 60 renders of that frame,
  result in the page title. In these test modes errors also go to the title.

## Testing

- `node dev/harness.js <t> [w h] [--levels] [--iter N]` — runs the page's script
  against a recording fake canvas: camera level, node/fill/bitmap counts, cache
  reuse, and with `--levels` every level's aspect ratio (must repeat with period 2).
- `dev\run-chrome.ps1 -Query "t=30&bench"` or `-Shot out.png` — one headless-Chrome
  run with a throwaway profile and a PID-scoped timeout.
- The `?t=` mode draws with `setTimeout`, not `requestAnimationFrame`: headless
  Chrome under `--virtual-time-budget` does not reliably deliver animation frames.
  Its virtual clock also only advances while the page is idle, so on a heavily
  loaded machine runs can stall — a timeout there is not a page bug.
