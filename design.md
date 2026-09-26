# mathzoom — design

Four zooms, each through a self-similar typeset formula for an unimaginably
large number, and a hub page linking them in order of power. Inspired by
`D:\pics\misc\math.gif` and `math3.gif`. Each zoom starts on the end of its
formula and accelerates geometrically for ever — through a blur, a stroboscope
and pure flicker — until the viewer clicks. Then the number gets its outermost
level, the next one up that can be shown whole, and the zoom stops there on the
finished number. Everything on screen is TeX's own typesetting (Computer Modern
outlines), drawn as vectors, so it stays sharp at every scale.

## Files

| File | Role |
|---|---|
| `index.html` | The hub: the four zooms in order of power, each with a live picture of a finished number (its page embedded frozen, `?t=30&click=0&embed`), its rung and what it beats. |
| `towers.html`, `arrows.html`, `chains.html`, `brackets.html` | The four zooms. Each only loads the data and the engine and calls `mathzoom({...})` with its notation. Open straight from disk (`file://`). Arrows and chains *settle* (see *Exact self-similarity*). |
| `arrows-exact.html`, `chains-exact.html` | The first versions of arrows and chains, forced into their base's exact shape (wide gaps around the rows' `⋯`; the finished number is a column). Kept, and linked from the hub's footer. |
| `folding.md` | Two pages of English describing a number built by folding the fold itself, rung by rung, as far as notation reaches (from the discussion that led to these pages). |
| `engine.js` | The engine: layout grammars, exact self-similarity, drawing, level-of-detail bitmaps, camera, motion, the ending, HUD, main loop, test modes. |
| `glyphs.js` / `glyphs.json` | Generated: TeX glyph outlines (bases, seed `10`, `⋯`, `⋮`, sample braces and brackets, the brackets key). |
| `braces.js` / `braces.json` | Generated: the pieces TeX builds braces from (see *Typesetting*). |
| `metrics.js` / `metrics.json` | Generated: the arrow run's span in `10↑↑⋯↑10`; TeX's square-bracket proportions. |
| `tex/glyphs.tex` | Typesets every glyph, one tightly cropped page each. |
| `tex/glyphs.pdf` | Its output; committed so Tectonic is only needed to change the glyphs. |
| `tex/glyphs.py` | PDF → outline paths (`glyphs.json` + `glyphs.js`), by glyph name. |
| `tex/braces.py` | Splits the tallest/widest braces into pieces (`braces.json` + `braces.js`). |
| `tex/metrics.py` | Measures the arrow span and the bracket (`metrics.json` + `metrics.js`). |
| `preview.html` | Dev aid: draws every glyph large with its measured ink box. |
| `dev/harness.js` | Runs a page's scripts in Node on a fake canvas (layout/camera/motion/LOD checks). |
| `dev/run-chrome.ps1` | One headless-Chrome run of a page: benchmark title or screenshot. |
| `ROADMAP.md` | The four numbers and what could come after. |

## The four notations

"Rung" is the position on the step/fold ladder — the fast-growing hierarchy: a
step repeats the operation before it; a fold, ω, jumps to "as many steps as the
number itself"; ω² folds the folds; ε₀ is the limit of ω, ω^ω, ω^ω^ω, …. N is the
number of levels of the finished number.

**Towers, arrows and chains** share one grammar (`'braces'`). A base expression
carries a count shown by an underbrace. **Columns** stack bases (later: rows) with
underbraces — each child's count is the value of the child below it, `⋮` stands
for the rest, the last one's count is the seed `10`. **Rows** chain columns with
right braces, `c } c } ⋯ } c } 10` — each column's count (how many it stacks) is
what its brace points at. Levels alternate: base → column → row → column → …

| Page | Base, and the count its underbrace sets | Finished number | Rung |
|---|---|---|---|
| towers | `10^10^⋰^10` — how many 10s | ≥ 10 ↑^(N+2) 4: past Graham's g₁, below g₂ | about N |
| arrows | `10↑↑⋯↑10` — how many arrows (brace under the arrows only, as in Graham's diagram) | every one beats Graham's number | ω + N |
| chains | `10→10→⋯→10` — how many 10s in the Conway chain | beats any Conway chain one could write out | ω² + N |

Each level of these iterates the level below (its count set by the bracket
around it), which is one step; so the finished number sits at the base's rung
plus N. A tower of c 10s is 10↑↑c and a column of c towers is 10↑↑↑(c+1); the
arrow count is itself a fold (Graham's number is at ω+1); a chain's length is a
fold of folds.

**Brackets** (`'brackets'`) use the ordinals themselves as the picture, in
Cantor normal form as in the Kirby–Paris hydra: `[ ]` (a bracket with nothing
inside) is one step; brackets side by side add; a bracket around brackets folds
as many times as what is inside it says (`[[ ]]` = ω, `[[ ][ ]]` = ω², `[[[ ]]]` =
ω^ω). A picture followed by 10 is the number at that rung applied to 10, on the
Knuth-arrow ladder: F_k(x) = 10 ↑^k x, F_{α+1}(x) = F_α iterated from 10 x−1 times,
F_λ(x) = F_{λ[x]}(x). Each level is a bracket around three copies of the level
below — a row inside `[ ]`, or a column between `⎴` and `⎵` (the same bracket,
turned). Every copy is drawn, no ellipsis, so the picture is exact. The finished
number is the outermost row followed by `10`. Each level wraps everything below
in a new fold, so N levels sit at a tower of ω's N high, climbing toward ε₀ (the
limit of what Peano arithmetic can prove terminates). This notation isn't
standard, so its page opens with a key in standard notation instead of words:
`[ ] 10 = 10↑10`, `[ ][ ] 10 = 10↑↑10`, `[[ ]] 10 = 10↑↑⋯↑10` (ten arrows); it fades
out after ~10 s.

**Why 10s.** Every bracket's picture shows more than two of what it counts (a
tower draws at least four 10s, a column three children and a `⋮`), so a count of
2 would contradict its own picture; 10 is the smallest tidy number that doesn't.

**Every bracket has a single numeral on its far side**, so the finished number
ends the same way: its outermost level is an ordinary level with `10` at its end.
(`math3.gif` ends its top row with a small chain of towers — the one bracket with
a sub-formula on its far side — which was deliberately not copied.)

**The outermost level has no ellipsis.** Every other `⋯`/`⋮` stands for a count
that the bracket around it sets; the outermost level has none around it, so it
has exactly the three children drawn.

## Exact self-similarity (the "two images" question)

The user's idea — a starting image plus a purely recursive image to zoom out of
for ever — worked out exactly:

- The pattern repeats every **two** levels (columns and rows alternate).
- **Level 2 has exactly the base's aspect ratio.** So level 3 is level 1 with each
  base replaced by a level-2 row filling the same box, and level n+2 is level n
  under that substitution. The starting image and the recursive image have the
  same layout; they differ only in the bases at the very bottom, which shrink
  away (×6.1 per period for towers, ×8.8 arrows, ×10.9 chains, ×3.8 brackets).
- There is no swap between pictures: the recursion is composed live from vector
  glyphs, and two levels further out the picture is an exact scaled copy.

**Why it is exact — equal growth.** A column is `3 + Dv` child-heights tall; a
row is `3 + Dh` child-widths wide (Dv, Dh: its decorations in the same units).
Over one period the aspect ratio is multiplied by `(3 + Dh) / (3 + Dv)`; unless
the two are equal it drifts for ever and never repeats (the first version did,
3.1% per period). So rows are made exactly `K_V = 3 + Dv` times wider than their
children: if their decorations come out too wide, the rows' type is scaled down
(`HS`: 0.888 towers, 0.485 brackets); if too narrow, the spare width `PAD` goes
around the row's `⋯` (arrows 2.89, chains 8.43 column-heights — the ellipsis
region reads naturally as "many more columns here"). Measured at start-up from
trial levels built from the base's actual proportions. Then `a₂ = a₀` to within
a few 10⁻¹⁶ and every level repeats with period 2 from the start.

**Why towers fit and arrows/chains need filler.** The stuff between a column's
entries (underbraces, kerns, `⋮`, seed: ~51 pt) is sized by the type, not the
entry. A tower is 16 pt tall, so a column is ~6.1 towers tall, and a row of 3
columns plus its braces at natural size comes out ~6.3 columns wide — nearly
equal by the luck of the tower's shape. `10↑↑⋯↑10` (8.8 pt tall) and a chain
(6.5 pt) make columns 8.8× and 10.9× their entries, while a row's braces cover
only ~1.4 / ~0.8 of a (wide) column: the rest must be filler.

**Settling instead (`settle: true`; `arrows.html`, `chains.html`).** Don't force
level 2 into the base's shape. With the type caps (a row's brace ≥ 44 pt, a
column's underbrace ≥ 24 pt at its own font), a row's decorations scale with its
children's height rather than their width, so a row that is too narrow for its
column gets relatively wider decorations next time and vice versa: the aspect
ratio converges geometrically (×0.16 per period) to a fixed shape — rows
2.157 : 1, columns 0.285, ×7.57 per period — the same for both bases, close to
the towers' own proportions. The first levels have their own proportions (rows
3.5 → 2.5 → 2.2 …); by level 12 it is periodic to 5·10⁻⁴, by NMAX exactly in
doubles. The camera therefore uses the real heights of the even levels (the
`LHE` table, continued periodically; a straight line for exact notations, so
those pages are unchanged), each finished level gets its own outermost layout and
framing height (`outerFor(N)`, `hFit(N)`), and `lamEnd(N)` is the exact position
where the zoom stops to frame it.

## Typesetting

- **Glyphs** are TeX's own: typeset by Tectonic (XeTeX, Computer Modern Type 1),
  extracted as outlines. TeX's rules (the straight runs of `\underbrace`) are
  stroked paths in the PDF and are kept with their stroke width.
- **Extensible braces, built the way TeX builds them.** A tall `\}` is top + repeated
  bar + middle + repeated bar + bottom; an `\underbrace` is two ends, two middle
  halves and rules. `braces.py` keeps TeX's curved pieces verbatim and replaces
  each straight run with one rectangle ("spine", tucked `OV` = 0.6 pt under the
  pieces), so the page can build a brace of any length at any font size.
- **Square brackets** are drawn from TeX's own proportions (`metrics.py` measures
  the large bracket: stem 0.687 pt, serif 3.318 pt, serif thickness 0.687 pt at
  10 pt) as a stem and two serifs, any length, in four orientations: `[`, `]`,
  and the same turned to close a column from above and below.
- **One font scale per level**: `f = font × min(child width, child height)`,
  `font = 1 / base height` (level 1 is TeX's natural 10 pt setting around the base),
  times `HS` on rows. A row's brace spans its child's height, and below 44 pt at its
  own font TeX's pieces would overlap into a squat bar — which short, wide columns
  (arrows, chains) would cause — so a row's font is capped there (`BRACE_MIN`).
  Spacing: TeX's 3 pt `\underbrace` kern; 1.5 pt / 3 pt around right braces and
  brackets; the seed at 0.7 f (script style; brackets: full size).
- A level `Z²` larger has pieces `Z²` larger and spines `Z²` longer — an exact
  scaled copy, which is what the self-similarity above needs.

## Pipeline

```
cd tex
tectonic -X compile glyphs.tex              # -> glyphs.pdf  (Tectonic: D:\utils\tectonic.exe)
python glyphs.py glyphs.pdf ../glyphs.json  # -> ../glyphs.json, ../glyphs.js  (PyMuPDF)
python braces.py                            # -> ../braces.json, ../braces.js  (reads ../glyphs.json)
python metrics.py                           # -> ../metrics.json, ../metrics.js
```

`glyphs.py` measures each glyph's true ink box by rasterising at 24× and re-bases
its paths to it; glyphs are looked up by name (`tower`, `seed`, `arrows`, …).
`braces.py` identifies pieces structurally (the repeated bar is the most frequent
path; rules are the stroked parts) and fails loudly if TeX's construction ever
differs from what it expects. `metrics.py` finds the arrow run as the parts of
`10↑↑⋯↑10` that aren't the digits of `10`, and the bracket's stem and serifs from
the pieces of a tall `\left[`.

## Camera

- Each level's layout is stored **normalised** (level height = 1): children
  `{x, y, s}` and decorations (each with an id) as O(1) numbers. `LEVELS[0..64]` is
  built at start-up; beyond that `par(n)` reuses level 63 or 64 by parity (the
  table is long only so the zoom centre has converged).
- **Zoom centre** `C[n]`: the point in the *last* child at every level (next to the
  seed — "the end of the formula"; for brackets, the head the hydra's rule
  chops first). At level 1 it is the middle of the last base and everything below
  it, centred on the base (or its braced span). It converges geometrically.
  Until the ending it sits at screen position `(cx, cy)`.
- **Position = the framed level λ.** At λ = N level N, drawn as the finished
  outermost level, exactly fills the framing box (92% × 84% of the viewport),
  centred. Even level n's screen height at λ is `hRef · e^(lhe(n) − lhe(λ))`, where
  `lhe` is the even levels' log-height (`(n/2)·P` for an exact notation, P = ln of
  the zoom per period), so one unit of λ is "one level". A settling notation's
  early finished levels differ in shape, so they stop at `lamEnd(N)`, slightly off N.
  The finished number is a row, or — where rows are far wider than the screen, as
  on the exact-shape arrows and chains pages — a column (`top: 'V'`); for a column
  `hRef` is scaled so λ = N still frames it, and the camera's reference level steps
  down to an odd top.
  The start frames level 1's last base and everything below it at 70% of the
  height, or 90% of the width for wide bases.
- **Wrapping.** From λ = 100 up, nothing below level ~70 is ever visible, and the
  layout repeats every 2 levels, so λ and the top level are shifted down by an even
  amount. Level indices stay small however deep the zoom (10⁸² levels is fine).
- **Top level.** Before the click there is none (the formula continues upward for
  ever). After it, level N has nothing above it: the covering-level search stops
  there and the space around it is white.
- **Frame**: find the smallest level (≤ top) whose box covers the viewport, draw it
  recursively, culling nodes that are off-screen or under `MIN_PX` (0.8 px) and
  decorations under `MIN_DECO`.

## Motion

**Before the click:** speed `v(t) = v0 · grow^t` levels/s, for ever; distance
`P(t) = v0 (grow^t − 1) / ln grow`, λ = λ_start + P. Defaults `v0 = 0.12`,
`grow = 1.10`/s. At 60 Hz, with the towers' period (×6.1):

| t | speed | what it looks like |
|---|---|---|
| 0–60 s | 0.12 → 37 levels/s | a smooth, accelerating zoom |
| ~65 s | 1/2 period per frame | motion becomes ambiguous: the stroboscope starts |
| ~72 s | 1 period per frame | first moment it appears to stand still |
| 72–120 s | 1 → 100 periods/frame | still / backward / forward beats, ever faster |
| 120 s + | | flicker: each frame an unrelated phase |

**Virtual clock.** Time advances by whole display frames of a steady length (the
median of the last 61 frame intervals), not by the wall clock, whose jitter would
scramble the beats. A frame that took several intervals advances several; a
hidden tab (no frames) just pauses.

**Precision.** Distance and speed are kept as logarithms, so nothing overflows
however long it runs. Beyond 10¹² levels a double can't pin the phase within a
period, but the picture is pure flicker long before that, so each frame then
shows a random phase — indistinguishable from the exact one.

**The ending (after the click).** The number gets its top level N: the next level
up of the finishing kind (row or column) that can be shown whole — the first at or
above both the current position (plus `D_MIN` = 0.35) and the level covering the
screen (so nothing on screen vanishes). The zoom carries on unchanged, same
accelerating speed, and stops dead the moment level N fills the framing box.
Meanwhile (weight w = smootherstep of the distance covered) the zoom centre drifts
to where centring level N puts it, and level N turns into the outermost level:
`outerLevel(w)` blends the ordinary and the outermost layouts child by child and
decoration by decoration (by id); a decoration only one has shrinks and fades out
of — or grows and fades into — the place its `gone` twin marks (the `⋯ }` closes
up; the brackets' final `10` appears). The choice uses the frame on screen at the
click — in the flicker, the random phase you clicked on. Going fast (from about a
minute in) it all happens by the next frame; right at the start, a few seconds.

The finished picture is the same for every large N (the layout is periodic and
the bases are far below a pixel); only the number of levels differs.

## Rendering performance

- **Level-of-detail bitmaps**: a node smaller than `CACHE_PX` (96 CSS px) is drawn
  as one bitmap instead of recursing into its thousands of near-sub-pixel
  descendants. Bitmaps are rendered by the same vector code at the next
  half-octave size at or above the node (so at most a 1/√2 downscale — they match
  what the vectors would draw), frozen as `ImageBitmap`s, built lazily. Levels
  below `LOD_LEVEL` (10) each get their own; at or above it two shared families
  (column and row) serve the whole infinite tail — valid because the layout is
  periodic and the bases are invisibly small there.
  Effect: the tail went from ~3300 nodes / ~55 ms per frame to ~20–50 nodes /
  2–4 ms, worst run 6.5 ms (headless Chrome, software rendering, on a fully
  loaded CPU).
- Setting a canvas's size clears it, so the canvas is resized only immediately
  before a redraw (checked every frame, including devicePixelRatio changes).
- Still pictures (paused, finished) are drawn once instead of every frame.

## Controls and URL parameters

- **Click**: end it — the zoom stops at the next level where the whole number
  fits. Once it has stopped, click again to start over. **Space** / `P`: pause.
  **R**: restart. The corner shows the level; at the end, how many levels the
  number has. Bottom right: a link back to the hub.
- `?font=`, `?label=`: type size, seed size. `?v0=` (0.12), `?grow=` (1.10): the
  zoom speed. `?cx=`, `?cy=`: where on screen the zoom centre sits.
- `?t=N` (testing): show time N; with `&click=C`, as if clicked at time C.
  `&bench`: time 60 renders of that frame, result in the page title. `&embed`:
  hide the HUD and link (the hub uses this). In the test modes errors also go to
  the title.

## Testing

- `node dev/harness.js <t> [--page P] [--click C] [--size WxH] [--levels] [--iter N]`
  — runs a page's scripts against a recording fake canvas: camera, HUD,
  node/fill/bitmap counts, cache reuse, and with `--levels` every level's aspect
  ratio (must repeat with period 2). `--trace a:b:s` prints the camera and HUD
  over time. The engine exposes its internals as `window.ZOOM` for this.
- `dev\run-chrome.ps1 -Page P -Query "t=40&click=20"` with `-Shot out.png`, or
  `-Query "t=30&bench"` — one headless-Chrome run with a throwaway profile and a
  PID-scoped timeout.
- The `?t=` mode draws with `setTimeout`, not `requestAnimationFrame`: headless
  Chrome under `--virtual-time-budget` does not reliably deliver animation frames.
  Its virtual clock also only advances while the page is idle, so on a heavily
  loaded machine runs can stall — a timeout there is not a page bug.
