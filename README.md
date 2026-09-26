# mathzoom

Four endless, accelerating zoom-outs, each through a self-similar formula for an
unimaginably large number, and a hub page that links them in order of power:

1. **Towers** (`towers.html`) — power towers of 10s, stacked with braces.
2. **Arrows** (`arrows.html`) — Knuth's arrows: Graham's diagram, nested. Every
   finished number beats Graham's number.
3. **Chains** (`chains.html`) — Conway's chained arrows, nested.
4. **Brackets** (`brackets.html`) — brackets that fold whatever is inside them,
   climbing toward ε₀; the page opens with a key.

Each starts on the end of its formula and speeds up geometrically without limit
(into a stroboscope, then flicker) until you click; then it stops at the next
level where the whole, finished number fits. Every glyph is TeX's own
typesetting, drawn as vectors.

**Watch it online at https://inhahe.github.io/mathzoom/** and pick one, or open
`index.html` from a copy of this repository in a browser (double-click works; no
server needed).

- **Click** to end it; once it has stopped, click again to start over.
- **Space** pauses, **R** restarts.
- URL parameters tune it, e.g. `towers.html?grow=1.2` (accelerate faster) or
  `towers.html?v0=0.3` (faster start). See `design.md` for all of them.

The first versions of arrows and chains, forced into their base's exact shape,
are kept as `arrows-exact.html` and `chains-exact.html`.

How it works — the notations, why the zoom is exactly self-similar, the ending,
the TeX pipeline and the renderer — is in [`design.md`](design.md); what's done
and what could come next is in [`ROADMAP.md`](ROADMAP.md).
[`folding.md`](folding.md) climbs further in words: a number built by folding
the fold itself, as far as notation reaches.
