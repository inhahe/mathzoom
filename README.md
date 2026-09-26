# mathzoom

A zoom out through a self-similar formula for an unimaginably large number —
power towers of 10s, stacked under underbraces, chained with right braces, and
nested for ever. It starts on the end of the formula and speeds up geometrically
without limit (into a stroboscope, then flicker) until you click; then it slows
down the same way and settles on the whole, finished number. Every glyph is TeX's
own typesetting, drawn as vectors.

**Open `index.html` in a browser** (double-click works; no server needed).

- **Click** to end it; once it has settled, click again to start over.
- **Space** pauses, **R** restarts.
- URL parameters tune it, e.g. `index.html?grow=1.2` (accelerate faster) or
  `index.html?v0=0.3` (faster start). See `design.md` for all of them.

How it works — the notation, why the zoom is exactly self-similar, the ending,
the TeX pipeline and the renderer — is in [`design.md`](design.md).
